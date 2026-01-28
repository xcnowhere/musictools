
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import FMSynth from './pages/FMSynth';
import GuitarGallery from './pages/GuitarGallery';
import EffectSound from './pages/EffectSound';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-heading font-bold tracking-tighter hover:text-blue-400 transition-colors">
          MUSIC_TOOL <span className="text-xs font-mono text-zinc-500 ml-2">V1.1</span>
        </Link>
        <div className="flex gap-8">
          <Link 
            to="/fm-synth" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/fm-synth' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
          >
            FM SYNTH
          </Link>
          <Link 
            to="/guitar-gallery" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/guitar-gallery' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
          >
            GUITARS
          </Link>
          <Link 
            to="/effect-sound" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/effect-sound' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
          >
            EFFECTS
          </Link>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen pt-16 selection:bg-blue-500/30">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fm-synth" element={<FMSynth />} />
            <Route path="/guitar-gallery" element={<GuitarGallery />} />
            <Route path="/effect-sound" element={<EffectSound />} />
          </Routes>
        </main>
        
        <footer className="py-12 px-6 border-t border-white/5 bg-zinc-950 mt-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-zinc-500 text-sm">
              © 2024 Music Tool. Experimental Tools.
            </div>
            <div className="flex gap-6 text-zinc-400 text-xs font-mono">
              <span className="hover:text-white cursor-pointer">DOCUMENTATION</span>
              <span className="hover:text-white cursor-pointer">API_STATUS</span>
              <span className="hover:text-white cursor-pointer">SYSTEM_Vitals</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
