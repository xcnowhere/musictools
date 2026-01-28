
import React from 'react';
import { Link } from 'react-router-dom';

const ToolCard: React.FC<{
  title: string;
  description: string;
  path: string;
  image: string;
  tags: string[];
}> = ({ title, description, path, image, tags }) => (
  <Link 
    to={path}
    className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 transition-all hover:border-blue-500/50 hover:shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)]"
  >
    <img 
      src={image} 
      alt={title} 
      className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
    <div className="absolute bottom-0 p-8 w-full">
      <div className="flex gap-2 mb-4">
        {tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-wider">
            {tag}
          </span>
        ))}
      </div>
      <h3 className="text-3xl font-heading font-bold mb-2 group-hover:text-blue-400 transition-colors tracking-tight">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed max-w-[280px]">
        {description}
      </p>
      <div className="mt-6 flex items-center gap-2 text-white font-medium text-sm">
        Launch Tool
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </div>
    </div>
  </Link>
);

const Home: React.FC = () => {
  return (
    <div className="px-6 py-20 max-w-7xl mx-auto">
      <header className="mb-24 space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tighter leading-none whitespace-nowrap">
          EXPLORE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">CREATIVE EDGE.</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl font-light leading-relaxed">
          A suite of modular tools designed for musicians, collectors, and sound designers. 
          Powered by Gemini AI for contextual intelligence.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ToolCard 
          title="FM SYNTH"
          description="Harness the power of Frequency Modulation. Craft complex metallic textures and crystalline pads."
          path="/fm-synth"
          image="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop"
          tags={["AUDIO", "SYNTHESIS", "PRO"]}
        />
        <ToolCard 
          title="GUITAR GALLERY"
          description="Interactive museum of legendary instruments. Explore history and specs of iconic models."
          path="/guitar-gallery"
          image="https://images.unsplash.com/photo-1550291652-6ea9114a47b1?q=80&w=800&auto=format&fit=crop"
          tags={["VISUAL", "CATALOG", "AI"]}
        />
        <ToolCard 
          title="EFFECT SOUND"
          description="Modular signal processing workstation. Chain distortion, delay, and reverb in real-time."
          path="/effect-sound"
          image="https://images.unsplash.com/photo-1525362081669-2b476bb628c3?q=80&w=800&auto=format&fit=crop"
          tags={["PROCESSING", "DSP", "LIVE"]}
        />
      </div>
    </div>
  );
};

export default Home;
