
import React, { useState, useEffect, useRef } from 'react';
import { getFMPresetExplanation } from '../services/geminiService';

const FMSynth: React.FC = () => {
  const [carrierFreq, setCarrierFreq] = useState(440);
  const [modulatorFreq, setModulatorFreq] = useState(100);
  const [modIndex, setModIndex] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const carrierRef = useRef<OscillatorNode | null>(null);
  const modulatorRef = useRef<OscillatorNode | null>(null);
  const modGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const ctx = audioCtxRef.current;
    
    carrierRef.current = ctx.createOscillator();
    modulatorRef.current = ctx.createOscillator();
    modGainRef.current = ctx.createGain();
    masterGainRef.current = ctx.createGain();
    analyserRef.current = ctx.createAnalyser();

    carrierRef.current.type = 'sine';
    modulatorRef.current.type = 'sine';
    
    modulatorRef.current.connect(modGainRef.current);
    modGainRef.current.connect(carrierRef.current.frequency);
    
    carrierRef.current.connect(masterGainRef.current);
    masterGainRef.current.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);

    carrierRef.current.frequency.setValueAtTime(carrierFreq, ctx.currentTime);
    modulatorRef.current.frequency.setValueAtTime(modulatorFreq, ctx.currentTime);
    modGainRef.current.gain.setValueAtTime(modIndex * 100, ctx.currentTime);
    masterGainRef.current.gain.setValueAtTime(0.2, ctx.currentTime);

    carrierRef.current.start();
    modulatorRef.current.start();
    setIsPlaying(true);
    startVisualizers();
  };

  const stopAudio = () => {
    if (carrierRef.current) {
      carrierRef.current.stop();
      modulatorRef.current?.stop();
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const startVisualizers = () => {
    if (!canvasRef.current || !spectrumCanvasRef.current || !analyserRef.current) return;
    const waveCanvas = canvasRef.current;
    const waveCtx = waveCanvas.getContext('2d')!;
    const specCanvas = spectrumCanvasRef.current;
    const specCtx = specCanvas.getContext('2d')!;
    const analyser = analyserRef.current;
    analyser.fftSize = 1024;
    
    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      // Left: Waveform
      analyser.getByteTimeDomainData(timeData);
      waveCtx.fillStyle = '#050505';
      waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);
      waveCtx.lineWidth = 3;
      waveCtx.strokeStyle = '#3b82f6';
      waveCtx.shadowBlur = 10;
      waveCtx.shadowColor = '#3b82f6';
      waveCtx.beginPath();
      let sliceWidth = waveCanvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        let v = timeData[i] / 128.0;
        let y = v * waveCanvas.height / 2;
        if (i === 0) waveCtx.moveTo(x, y);
        else waveCtx.lineTo(x, y);
        x += sliceWidth;
      }
      waveCtx.stroke();
      waveCtx.shadowBlur = 0;

      // Right: Spectrum
      analyser.getByteFrequencyData(freqData);
      specCtx.fillStyle = '#050505';
      specCtx.fillRect(0, 0, specCanvas.width, specCanvas.height);
      let barWidth = (specCanvas.width / bufferLength) * 2.5;
      let barHeight;
      let xSpec = 0;
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (freqData[i] / 255) * specCanvas.height;
        specCtx.fillStyle = `rgba(59, 130, 246, ${freqData[i] / 255 + 0.1})`;
        specCtx.fillRect(xSpec, specCanvas.height - barHeight, barWidth, barHeight);
        xSpec += barWidth + 1;
      }
    };
    draw();
  };

  useEffect(() => {
    if (carrierRef.current && audioCtxRef.current) {
      carrierRef.current.frequency.setTargetAtTime(carrierFreq, audioCtxRef.current.currentTime, 0.05);
    }
  }, [carrierFreq]);

  useEffect(() => {
    if (modulatorRef.current && audioCtxRef.current) {
      modulatorRef.current.frequency.setTargetAtTime(modulatorFreq, audioCtxRef.current.currentTime, 0.05);
    }
  }, [modulatorFreq]);

  useEffect(() => {
    if (modGainRef.current && audioCtxRef.current) {
      modGainRef.current.gain.setTargetAtTime(modIndex * 100, audioCtxRef.current.currentTime, 0.05);
    }
  }, [modIndex]);

  const fetchAiInsight = async () => {
    setLoadingAi(true);
    try {
      const insight = await getFMPresetExplanation(carrierFreq, modulatorFreq, modIndex);
      setAiInsight(insight || "Failed to generate insight.");
    } catch (e) {
      setAiInsight("AI Service temporarily unavailable.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-black overflow-hidden p-4 sm:p-6 gap-4 sm:gap-6">
      {/* Top: Double Visualization Row */}
      <div className="grid grid-cols-2 gap-4 h-1/3 min-h-[180px]">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
          <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20 backdrop-blur-md uppercase tracking-widest">Waveform</span>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
          <canvas ref={spectrumCanvasRef} width={800} height={400} className="w-full h-full" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20 backdrop-blur-md uppercase tracking-widest">Spectrum</span>
          </div>
        </div>
      </div>

      {/* Bottom: Controls and AI */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 min-h-0">
        <div className="lg:col-span-3 bg-zinc-900 border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden">
          <div className="space-y-5 overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Carrier Freq</label>
                <span className="text-blue-400 font-mono text-xs">{carrierFreq}Hz</span>
              </div>
              <input 
                type="range" min="20" max="2000" step="1" 
                value={carrierFreq} 
                onChange={(e) => setCarrierFreq(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Modulator Freq</label>
                <span className="text-blue-400 font-mono text-xs">{modulatorFreq}Hz</span>
              </div>
              <input 
                type="range" min="0" max="2000" step="1" 
                value={modulatorFreq} 
                onChange={(e) => setModulatorFreq(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Mod Index</label>
                <span className="text-blue-400 font-mono text-xs">{modIndex}</span>
              </div>
              <input 
                type="range" min="0" max="100" step="0.1" 
                value={modIndex} 
                onChange={(e) => setModIndex(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {!isPlaying ? (
              <button onClick={startAudio} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-[11px]">Start engine</button>
            ) : (
              <button onClick={stopAudio} className="flex-1 py-3 rounded-xl bg-white text-black font-bold transition-all uppercase tracking-widest text-[11px]">Kill Signal</button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="flex-1 bg-zinc-950 border border-blue-500/20 rounded-2xl p-5 sm:p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">AI Sonic Analysis</h3>
              <button 
                onClick={fetchAiInsight}
                disabled={loadingAi}
                className="text-[9px] px-2 py-0.5 rounded-full border border-blue-500/30 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
              >
                {loadingAi ? '...' : 'REFRESH'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar text-zinc-400 text-[11px] leading-relaxed italic">
              {aiInsight ? aiInsight : "Adjust parameters and click refresh for an AI analysis of the sound physics."}
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex-shrink-0">
            <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 text-center">Engine Meta</h4>
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-600">
              <span>ALGO: SINE_PM</span>
              <span>BUFFER: 1024</span>
              <span>RATE: 44.1k</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default FMSynth;
