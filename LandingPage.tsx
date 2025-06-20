import React, { useState } from 'react';
import { ArrowRight, Sparkles, Zap, Users, Code } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/5 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 py-16 md:py-24 px-4">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Gemini Notes</h2>
          </div>
        </div>

        {/* Hero Section */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight">
          <span className="block text-white">Innovate.</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-500">
            Collaborate. Create.
          </span>
        </h1>
        
        <p className="max-w-xl md:max-w-2xl text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed">
          Welcome to the nexus of intelligent note-taking. Join a global community building the future, 
          one thought at a time with AI-powered insights.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          <div className="flex flex-col items-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Zap className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
            <p className="text-gray-400 text-sm">Advanced AI assistance for smarter note-taking</p>
          </div>
          <div className="flex flex-col items-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Users className="w-8 h-8 text-indigo-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Voice Notes</h3>
            <p className="text-gray-400 text-sm">Speak your thoughts with real-time transcription</p>
          </div>
          <div className="flex flex-col items-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Code className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Smart Features</h3>
            <p className="text-gray-400 text-sm">Auto-save, image support, and intelligent organization</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <button 
            onClick={onGetStarted}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group px-8 py-4 text-lg font-semibold rounded-xl text-white
                     bg-gradient-to-r from-blue-600 to-indigo-700 
                     hover:from-blue-700 hover:to-indigo-800 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                     transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </span>
          </button>
          
          <button 
            className="px-8 py-4 text-lg font-semibold rounded-xl text-gray-200 
                     bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20
                     focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-opacity-50
                     transform transition-all duration-300 hover:scale-105"
          >
            Explore Features
          </button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Powered by Gemini AI • Built with React & TypeScript
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 