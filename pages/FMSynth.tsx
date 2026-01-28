
import React, { useState, useEffect, useRef } from 'react';
import { getFMPresetExplanation } from '../services/geminiService.ts';

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
      analyser.getByteTimeDomainData(timeData);
      waveCtx.fillStyle = '#050505';
      waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);
      waveCtx.lineWidth = 2;
      waveCtx.strokeStyle = '#3b82f6';
      waveCtx.beginPath();
      let sliceWidth = waveCanvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        let v = timeData[i] / 128.0;
        let y = v * waveCanvas.height / 2;
        if (i === 0) waveCtx.moveTo(x, y); else waveCtx.lineTo(x, y);
        x += sliceWidth;
      }
      waveCtx.stroke();

      analyser.getByteFrequencyData(freqData);
      specCtx.fillStyle = '#050505';
      specCtx.fillRect(0, 0, specCanvas.width, specCanvas.height);
      let barWidth = (specCanvas.width / bufferLength) * 2.5;
      let xSpec = 0;
      for (let i = 0; i < bufferLength; i++) {
        let barHeight = (freqData[i] / 255) * specCanvas.height;
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
      setAiInsight(insight || "Analysis failed.");
    } catch (e) {
      setAiInsight("AI Service offline.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-black flex flex-col p-4 gap-4 overflow-hidden">
      {/* Visualizers Top Layer - Fix height ratio */}
      <div className="h-[35%] min-h-[160px] grid grid-cols-2 gap-4">
        <div className="relative rounded-xl border border-white/10 bg-zinc-950 overflow-hidden">
          <canvas ref={canvasRef} width={600} height={300} className="w-full h-full" />
          <div className="absolute top-2 left-2 text-[9px] font-bold text-blue-400 bg-black/40 px-2 py-0.5 rounded border border-blue-500/20 uppercase">Waveform</div>
        </div>
        <div className="relative rounded-xl border border-white/10 bg-zinc-950 overflow-hidden">
          <canvas ref={spectrumCanvasRef} width={600} height={300} className="w-full h-full" />
          <div className="absolute top-2 left-2 text-[9px] font-bold text-blue-400 bg-black/40 px-2 py-0.5 rounded border border-blue-500/20 uppercase">Spectrum</div>
        </div>
      </div>

      {/* Interface Bottom Layer */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-between overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Carrier</span>
                <span className="text-blue-400 font-mono">{carrierFreq}Hz</span>
              </div>
              <input type="range" min="20" max="2000" step="1" value={carrierFreq} onChange={(e) => setCarrierFreq(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Modulator</span>
                <span className="text-blue-400 font-mono">{modulatorFreq}Hz</span>
              </div>
              <input type="range" min="0" max="2000" step="1" value={modulatorFreq} onChange={(e) => setModulatorFreq(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Mod Index</span>
                <span className="text-blue-400 font-mono">{modIndex}</span>
              </div>
              <input type="range" min="0" max="100" step="0.1" value={modIndex} onChange={(e) => setModIndex(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div className="flex items-end">
              <div className="w-full text-[9px] text-zinc-600 font-mono bg-black/30 p-2 rounded border border-white/5">
                STATUS: {isPlaying ? 'ENGINE_LIVE' : 'STANDBY'}<br/>
                DSP_LOAD: LOW
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            {!isPlaying ? (
              <button onClick={startAudio} className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs">Start Engine</button>
            ) : (
              <button onClick={stopAudio} className="flex-1 py-4 rounded-xl bg-white text-black font-bold transition-all uppercase tracking-widest text-xs">Kill Signal</button>
            )}
          </div>
        </div>

        <div className="bg-zinc-950 border border-blue-500/10 rounded-2xl p-6 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase">AI Report</h3>
            <button onClick={fetchAiInsight} disabled={loadingAi} className="text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1 rounded hover:text-white transition-colors">
              {loadingAi ? '...' : 'ANALYSIS'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 text-[11px] leading-relaxed text-zinc-400 font-light italic custom-scrollbar">
            {aiInsight ? aiInsight : "Adjust params and run analysis to decode sonic physics."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FMSynth;
