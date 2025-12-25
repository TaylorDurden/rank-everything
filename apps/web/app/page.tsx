'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  ChevronRight, 
  Zap, 
  BarChart3, 
  ShieldCheck, 
  Layout, 
  ArrowRight,
  BrainCircuit,
  Bot
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[#0f172a]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Ranker
            </span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-black hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-white/10">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-purple-600/20 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest animate-fade-in">
            <Zap className="w-3 h-3" /> Powered by Gemini 2.0 AI
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1]">
            Rank Everything <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              With Precision.
            </span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl text-slate-400 leading-relaxed font-medium">
            The world's first AI-driven asset evaluation engine. Leverage advanced Multi-Criteria Decision Making (MCDM) to score, rank, and optimize your strategic portfolio with cinematic clarity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Link href="/register" className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-lg font-black flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-blue-500/20">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-lg font-bold hover:bg-white/10 transition-all">
              Live Demo
            </Link>
          </div>

          {/* Abstract UI Elements */}
          <div className="relative mt-20 p-4 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl mx-auto group">
            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 aspect-video bg-slate-900 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-4 text-center z-10">
                <BrainCircuit className="w-20 h-20 text-white/20 mx-auto animate-pulse" />
                <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Visualizing Neural Evaluation Matrix...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { 
                title: 'AI Rationale Engine', 
                desc: 'Automated scoring logic that provides human-readable explanations for every rank.', 
                icon: Bot,
                color: 'text-blue-400',
                bg: 'bg-blue-400/10'
              },
              { 
                title: 'Dynamic Frameworks', 
                desc: 'Build custom evaluation templates with weighted dimensions tailored to your industry.', 
                icon: Layout,
                color: 'text-purple-400',
                bg: 'bg-purple-400/10'
              },
              { 
                title: 'Global Analytics', 
                desc: 'Track performance trends and synchronization status across your entire asset registry.', 
                icon: BarChart3,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10'
              }
            ].map((f, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 group shadow-xl">
                <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-32 text-center max-w-4xl mx-auto px-6">
        <div className="inline-block p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-10" />
        <h2 className="text-4xl font-black italic text-slate-200 leading-tight">
          "Ranker has transformed how our enterprise quantifies subjective value. It’s the closest thing to objective truth in asset management."
        </h2>
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10" />
          <div className="text-left">
            <p className="font-bold">Jordan Vane</p>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-black">CTO @ MetaDynamic</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600 -z-20 scale-150 blur-[200px] opacity-10" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter">Ready to optimize your portfolio?</h2>
          <Link href="/register" className="inline-flex items-center gap-4 px-12 py-6 bg-white text-slate-900 rounded-[2rem] text-xl font-black hover:bg-slate-200 transition-all active:scale-95 shadow-2xl shadow-white/10">
            Get Instant Access <ChevronRight className="w-6 h-6" />
          </Link>
          <p className="mt-8 text-slate-500 font-bold uppercase tracking-widest text-sm">No credit card required for MVP trial</p>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 text-center text-slate-600 text-sm font-medium">
        <p>&copy; 2025 Ranker Platforms. Orchestrating clarity through intelligence.</p>
      </footer>
    </div>
  );
}
