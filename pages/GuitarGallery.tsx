
import React, { useState } from 'react';
import { getGuitarInsights } from '../services/geminiService';
import { Guitar } from '../types';

const MOCK_GUITARS: Guitar[] = [
  {
    id: '1',
    name: 'Stratocaster',
    brand: 'Fender',
    year: '1954',
    description: 'The definitive electric guitar. Contoured body, three single-coil pickups, and a revolutionary synchronized tremolo.',
    imageUrl: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=800&auto=format&fit=crop',
    color: 'Sunburst'
  },
  {
    id: '2',
    name: 'Les Paul Standard',
    brand: 'Gibson',
    year: '1958',
    description: 'The heavyweight champion. Mahogany body with a maple top and dual humbucking pickups for thick, creamy sustain.',
    imageUrl: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?q=80&w=800&auto=format&fit=crop',
    color: 'Goldtop'
  },
  {
    id: '3',
    name: 'Telecaster',
    brand: 'Fender',
    year: '1950',
    description: 'The slab of wood that started it all. Simple, rugged, and possessing a "twang" that defined country and rock.',
    imageUrl: 'https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=800&auto=format&fit=crop',
    color: 'Butterscotch Blonde'
  },
  {
    id: '4',
    name: 'ES-335',
    brand: 'Gibson',
    year: '1958',
    description: 'The semi-hollow pioneer. Combining the sustain of a solid body with the warmth of a hollow body.',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop',
    color: 'Cherry Red'
  }
];

const GuitarGallery: React.FC = () => {
  const [selectedGuitar, setSelectedGuitar] = useState<Guitar | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const openDetails = async (guitar: Guitar) => {
    setSelectedGuitar(guitar);
    setInsights(null);
    setLoadingInsights(true);
    try {
      const result = await getGuitarInsights(`${guitar.brand} ${guitar.name}`);
      setInsights(result || null);
    } catch (e) {
      setInsights("Could not fetch details.");
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="px-6 py-12 max-w-7xl mx-auto">
      <header className="mb-16">
        <h2 className="text-4xl font-heading font-bold mb-4 uppercase tracking-tighter">Guitar Gallery</h2>
        <p className="text-zinc-400 max-w-xl">Explore iconic instruments that shaped the sound of modern music. Select a guitar to unlock deep AI-generated historical insights.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_GUITARS.map((guitar) => (
          <div 
            key={guitar.id}
            onClick={() => openDetails(guitar)}
            className="group cursor-pointer bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all hover:-translate-y-1"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img src={guitar.imageUrl} alt={guitar.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-6">
              <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">{guitar.brand} — {guitar.year}</div>
              <h3 className="text-xl font-heading font-bold">{guitar.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {selectedGuitar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
            onClick={() => setSelectedGuitar(null)}
          />
          <div className="relative w-full max-w-5xl bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 flex flex-col lg:flex-row max-h-[90vh]">
            <div className="w-full lg:w-1/2 aspect-square lg:aspect-auto overflow-hidden">
              <img src={selectedGuitar.imageUrl} alt={selectedGuitar.name} className="w-full h-full object-cover" />
            </div>
            <div className="w-full lg:w-1/2 p-8 md:p-12 overflow-y-auto">
              <button 
                onClick={() => setSelectedGuitar(null)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-2">Detailed Spec Sheet</div>
                  <h3 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">{selectedGuitar.name}</h3>
                  <div className="flex gap-4 mt-4 text-zinc-500 text-sm font-mono">
                    <span>BRAND: {selectedGuitar.brand}</span>
                    <span>ORIGIN: USA</span>
                    <span>YEAR: {selectedGuitar.year}</span>
                  </div>
                </div>

                <p className="text-zinc-300 leading-relaxed text-lg italic">
                  "{selectedGuitar.description}"
                </p>

                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Gemini Intelligence Report
                  </h4>
                  {loadingInsights ? (
                    <div className="space-y-4">
                      <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse" />
                      <div className="h-4 bg-zinc-800 rounded w-1/2 animate-pulse" />
                      <div className="h-4 bg-zinc-800 rounded w-2/3 animate-pulse" />
                    </div>
                  ) : (
                    <div className="prose prose-invert text-zinc-400 text-sm leading-loose">
                      {insights ? (
                        <div className="whitespace-pre-line">{insights}</div>
                      ) : (
                        "No specific data available for this model."
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuitarGallery;
