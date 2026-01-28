
import React, { useState, useRef, useEffect } from 'react';
import { getEffectChainAdvice } from '../services/geminiService';

const EFFECT_CATEGORIES = {
  "Distortion": ["overdrive", "distortion", "fuzz"],
  "Spatial": ["reverb", "delay"],
  "Modulation": ["flanger", "phaser", "chorus", "tremolo", "vibrato"],
  "EQ": ["eq", "autowah"]
};

const EffectSound: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [activeEffects, setActiveEffects] = useState<Record<string, boolean>>({
    overdrive: false,
    distortion: false,
    fuzz: false,
    reverb: false,
    delay: false,
    flanger: false,
    phaser: false,
    chorus: false,
    tremolo: false,
    vibrato: false,
    eq: false,
    autowah: false
  });
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Ref for all nodes to manage chain dynamically
  const nodesRef = useRef<Record<string, AudioNode>>({});
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startProcessing = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;

      sourceRef.current = ctx.createMediaStreamSource(stream);
      
      // Initialize nodes
      analyserRef.current = ctx.createAnalyser();
      
      // Initialize effect nodes
      const dist = ctx.createWaveShaper();
      dist.curve = makeDistortionCurve(600);
      nodesRef.current['distortion'] = dist;

      const od = ctx.createWaveShaper();
      od.curve = makeDistortionCurve(150);
      nodesRef.current['overdrive'] = od;

      const fuzz = ctx.createWaveShaper();
      fuzz.curve = makeDistortionCurve(2000);
      nodesRef.current['fuzz'] = fuzz;

      // Enhanced Delay with higher feedback and 50% mix (managed via a sub-gain)
      const delay = ctx.createDelay(2.0);
      delay.delayTime.value = 0.5;
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = 0.55; // Higher feedback for more obvious effect
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      
      const delayMix = ctx.createGain();
      delayMix.gain.value = 0.5; // 50% Mix
      delay.connect(delayMix);
      nodesRef.current['delay'] = delayMix;

      // Real Reverb using impulse response
      const reverb = ctx.createConvolver();
      reverb.buffer = createImpulseResponse(ctx, 2.5, 2.0); // 2.5s duration
      const reverbMix = ctx.createGain();
      reverbMix.gain.value = 0.6; // ~60% Mix for obvious space
      reverb.connect(reverbMix);
      nodesRef.current['reverb'] = reverbMix;

      // EQ
      const eq = ctx.createBiquadFilter();
      eq.type = 'peaking';
      eq.frequency.value = 800;
      eq.Q.value = 1.2;
      eq.gain.value = 12;
      nodesRef.current['eq'] = eq;

      // Tremolo (Gain + LFO)
      const tremolo = ctx.createGain();
      const tremLfo = ctx.createOscillator();
      tremLfo.frequency.value = 6;
      const tremDepth = ctx.createGain();
      tremDepth.gain.value = 0.8;
      tremLfo.connect(tremDepth);
      tremDepth.connect(tremolo.gain);
      tremLfo.start();
      nodesRef.current['tremolo'] = tremolo;

      // Autowah (Filter + LFO)
      const autowah = ctx.createBiquadFilter();
      autowah.type = 'bandpass';
      const wahLfo = ctx.createOscillator();
      wahLfo.frequency.value = 3;
      const wahDepth = ctx.createGain();
      wahDepth.gain.value = 1500;
      wahLfo.connect(wahDepth);
      wahDepth.connect(autowah.frequency);
      wahLfo.start();
      nodesRef.current['autowah'] = autowah;

      // Basic placeholders for other modulations
      ['phaser', 'flanger', 'chorus', 'vibrato'].forEach(key => {
        nodesRef.current[key] = ctx.createGain();
      });

      updateChain();
      setIsActive(true);
      drawSpectrum();
    } catch (err) {
      alert("Microphone access is required for this tool.");
    }
  };

  const createImpulseResponse = (ctx: AudioContext, duration: number, decay: number) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    for (let i = 0; i < 2; i++) {
      const channelData = impulse.getChannelData(i);
      for (let j = 0; j < length; j++) {
        channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
      }
    }
    return impulse;
  };

  const makeDistortionCurve = (amount: number) => {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0 ; i < n_samples; ++i ) {
      const x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + amount ) * x * 20 * deg / ( Math.PI + amount * Math.abs(x) );
    }
    return curve;
  };

  const updateChain = () => {
    if (!sourceRef.current || !audioCtxRef.current) return;
    
    sourceRef.current.disconnect();
    (Object.values(nodesRef.current) as AudioNode[]).forEach(node => {
      try { node.disconnect(); } catch(e) {}
    });

    let lastNode: AudioNode = sourceRef.current;

    Object.keys(activeEffects).forEach(key => {
      if (activeEffects[key] && nodesRef.current[key]) {
        lastNode.connect(nodesRef.current[key]);
        // For mix-based effects like Reverb/Delay, we connect lastNode to it BUT ALSO keep lastNode going
        // However, for this simplified modular chain, we treat them as serial inserts with internal gains
        lastNode = nodesRef.current[key];
      }
    });

    if (analyserRef.current) {
      lastNode.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }
  };

  useEffect(() => {
    updateChain();
  }, [activeEffects]);

  const drawSpectrum = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for(let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgba(59, 130, 246, ${dataArray[i]/255})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    render();
  };

  const getAdvice = async () => {
    setLoadingAi(true);
    const enabled = Object.entries(activeEffects)
      .filter(([_, val]) => val)
      .map(([key]) => key);
    
    try {
      const advice = await getEffectChainAdvice(enabled.length > 0 ? enabled : ["Clean Signal"]);
      setAiAdvice(advice || null);
    } catch (e) {
      setAiAdvice("Failed to get advice.");
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleEffect = (id: string) => {
    setActiveEffects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const stopProcessing = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      setIsActive(false);
    }
  };

  return (
    <div className="px-6 py-12 max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-heading font-bold mb-4 uppercase tracking-tighter">Effects Processor</h2>
        <p className="text-zinc-400 max-w-xl mx-auto">High-performance modular signal routing for real-time audio transformation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-black border border-white/5 rounded-3xl overflow-hidden relative min-h-[300px] shadow-2xl">
            <canvas ref={canvasRef} width={1200} height={400} className="w-full h-full opacity-80" />
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md">
                <button 
                  onClick={startProcessing}
                  className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  START SIGNAL ENGINE
                </button>
              </div>
            )}
            <div className="absolute top-6 left-6 flex gap-3">
              <div className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-widest border border-blue-500/20 uppercase">
                Spectral Feedback
              </div>
            </div>
            {isActive && (
               <button 
                onClick={stopProcessing}
                className="absolute top-6 right-6 text-[10px] font-bold text-red-400 border border-red-500/30 px-3 py-1 rounded bg-red-500/5 hover:bg-red-500/20 transition-colors"
              >
                KILL ENGINE
              </button>
            )}
          </div>

          {/* Added max-h and custom scrollbar style to prevent overflow */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(EFFECT_CATEGORIES).map(([category, items]) => (
              <div key={category} className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl h-fit">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">{category}</h4>
                <div className="space-y-2">
                  {items.map(item => (
                    <button
                      key={item}
                      onClick={() => toggleEffect(item)}
                      className={`w-full px-3 py-2 text-xs rounded-lg border transition-all text-left flex justify-between items-center ${
                        activeEffects[item] 
                          ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_-5px_rgba(59,130,246,0.4)]' 
                          : 'bg-zinc-950 border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <span className="capitalize">{item}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${activeEffects[item] ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,1)]' : 'bg-zinc-800'}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="p-8 bg-zinc-900 border border-white/5 rounded-3xl h-full sticky top-24 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Optimizer</h3>
              <button 
                onClick={getAdvice}
                disabled={loadingAi}
                className="text-[10px] font-bold bg-blue-600/10 border border-blue-500/30 px-2 py-1 rounded text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                {loadingAi ? '...' : 'ANALYZE'}
              </button>
            </div>
            <div className="prose prose-invert prose-sm text-zinc-400 leading-relaxed italic">
              {aiAdvice ? (
                <div className="whitespace-pre-line text-xs font-light">{aiAdvice}</div>
              ) : (
                <p className="text-xs font-light">Gemini will evaluate your routing and suggest professional configurations.</p>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-4">Master Stats</div>
              <div className="space-y-2 font-mono text-[10px] text-zinc-600">
                <div className="flex justify-between">
                  <span>ACTIVE_NODES</span>
                  <span className="text-white">{Object.values(activeEffects).filter(Boolean).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>LATENCY</span>
                  <span className="text-white">~4ms</span>
                </div>
                <div className="flex justify-between">
                  <span>DSP_LOAD</span>
                  <span className="text-white">Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default EffectSound;
