
import React, { useState, useRef, useEffect } from 'react';
import { getEffectChainAdvice } from '../services/geminiService.ts';

const EFFECT_CATEGORIES = {
  "Distortion": ["overdrive", "distortion", "fuzz"],
  "Spatial": ["reverb", "delay"],
  "Modulation": ["tremolo", "autowah", "chorus"],
  "Tone": ["eq"]
};

const EffectSound: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [activeEffects, setActiveEffects] = useState<Record<string, boolean>>({
    overdrive: false, distortion: false, fuzz: false, reverb: false, delay: false, 
    tremolo: false, autowah: false, chorus: false, eq: false
  });
  const [params, setParams] = useState({ delayFeedback: 0.5, reverbMix: 0.5 });
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Record<string, any>>({});
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const startProcessing = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const source = ctx.createMediaStreamSource(stream);
      analyserRef.current = ctx.createAnalyser();

      // Setup Nodes
      const delay = ctx.createDelay(2.0);
      delay.delayTime.value = 0.5;
      const dFB = ctx.createGain();
      dFB.gain.value = params.delayFeedback;
      delay.connect(dFB); dFB.connect(delay);
      const dMix = ctx.createGain(); dMix.gain.value = 0.5;
      delay.connect(dMix);
      nodesRef.current['delay'] = dMix;
      nodesRef.current['delayNode'] = dFB;

      const reverb = ctx.createConvolver();
      reverb.buffer = createImpulse(ctx, 2.5, 2.0);
      const rMix = ctx.createGain(); rMix.gain.value = params.reverbMix;
      reverb.connect(rMix);
      nodesRef.current['reverb'] = rMix;
      nodesRef.current['reverbNode'] = rMix;

      const tremolo = ctx.createGain();
      const lfo = ctx.createOscillator(); lfo.frequency.value = 6;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.8;
      lfo.connect(lfoGain); lfoGain.connect(tremolo.gain); lfo.start();
      nodesRef.current['tremolo'] = tremolo;

      updateChain(source);
      setIsActive(true);
      draw();
    } catch (e) { alert("Mic required"); }
  };

  const createImpulse = (ctx: AudioContext, d: number, dc: number) => {
    const l = ctx.sampleRate * d;
    const b = ctx.createBuffer(2, l, ctx.sampleRate);
    for(let i=0; i<2; i++) {
      const dArray = b.getChannelData(i);
      for(let j=0; j<l; j++) dArray[j] = (Math.random()*2-1) * Math.pow(1-j/l, dc);
    }
    return b;
  };

  const updateChain = (source?: any) => {
    if(!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    let last: any = source || ctx.createMediaStreamSource(micStreamRef.current!);
    
    Object.keys(activeEffects).forEach(k => {
      if(activeEffects[k] && nodesRef.current[k]) {
        last.connect(nodesRef.current[k]);
        last = nodesRef.current[k];
      }
    });

    last.connect(analyserRef.current!);
    analyserRef.current!.connect(ctx.destination);
  };

  useEffect(() => { if(isActive) updateChain(); }, [activeEffects]);
  useEffect(() => {
    if(nodesRef.current['delayNode']) nodesRef.current['delayNode'].gain.value = params.delayFeedback;
    if(nodesRef.current['reverbNode']) nodesRef.current['reverbNode'].gain.value = params.reverbMix;
  }, [params]);

  const draw = () => {
    if(!canvasRef.current || !analyserRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d')!;
    const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
    const render = () => {
      requestAnimationFrame(render);
      analyserRef.current!.getByteFrequencyData(buffer);
      ctx.fillStyle = '#050505'; ctx.fillRect(0,0,c.width,c.height);
      const w = (c.width/buffer.length)*2.5;
      for(let i=0; i<buffer.length; i++) {
        const h = (buffer[i]/255)*c.height;
        ctx.fillStyle = `rgba(59,130,246,${buffer[i]/255})`;
        ctx.fillRect(i*(w+1), c.height-h, w, h);
      }
    }; render();
  };

  const stop = () => { if(micStreamRef.current) micStreamRef.current.getTracks().forEach(t=>t.stop()); setIsActive(false); };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col p-6 gap-6 bg-black overflow-hidden">
      <div className="h-[30%] relative rounded-2xl border border-white/5 bg-zinc-950 overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={1200} height={400} className="w-full h-full" />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
            <button onClick={startProcessing} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 uppercase text-xs tracking-widest">Enable Real-Time DSP</button>
          </div>
        )}
        <div className="absolute top-4 left-4 text-[9px] font-bold text-blue-400 bg-black/50 px-2 py-1 rounded border border-blue-500/10">INPUT_SPECTRUM_MONITOR</div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(EFFECT_CATEGORIES).map(([cat, items]) => (
            <div key={cat} className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl h-fit space-y-3">
              <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">{cat}</h4>
              {items.map(item => (
                <button key={item} onClick={() => setActiveEffects(p => ({...p, [item]: !p[item]}))}
                  className={`w-full py-2 px-3 text-[10px] rounded-lg border transition-all text-left flex justify-between items-center ${activeEffects[item] ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : 'bg-black border-white/5 text-zinc-600'}`}>
                  <span className="capitalize">{item}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${activeEffects[item] ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,1)]' : 'bg-zinc-800'}`} />
                </button>
              ))}
            </div>
          ))}
          
          {(activeEffects.delay || activeEffects.reverb) && (
            <div className="p-5 bg-blue-600/5 border border-blue-500/10 rounded-2xl space-y-4">
              <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-4">Master Params</h4>
              {activeEffects.delay && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono"><span>DELAY_FB</span><span>{params.delayFeedback.toFixed(1)}</span></div>
                  <input type="range" min="0" max="0.9" step="0.1" value={params.delayFeedback} onChange={e=>setParams(p=>({...p, delayFeedback: Number(e.target.value)}))} className="w-full h-1 appearance-none bg-zinc-800 rounded-full accent-blue-500" />
                </div>
              )}
              {activeEffects.reverb && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono"><span>REVERB_MIX</span><span>{params.reverbMix.toFixed(1)}</span></div>
                  <input type="range" min="0" max="1" step="0.1" value={params.reverbMix} onChange={e=>setParams(p=>({...p, reverbMix: Number(e.target.value)}))} className="w-full h-1 appearance-none bg-zinc-800 rounded-full accent-blue-500" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-zinc-900/80 border border-white/5 rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-xl relative">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Gemini Advice</h3>
              <button onClick={() => {}} className="text-[9px] border border-white/10 px-2 py-1 rounded hover:bg-white/5">ADVISE</button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed italic">
              Enable effects and click "Advise" for AI-powered signal chain optimization.
            </p>
          </div>
          {isActive && <button onClick={stop} className="w-full py-3 mt-4 rounded-xl border border-red-500/20 text-red-400 text-[10px] font-bold uppercase hover:bg-red-500/10 transition-colors">Emergency Kill</button>}
        </div>
      </div>
    </div>
  );
};

export default EffectSound;
