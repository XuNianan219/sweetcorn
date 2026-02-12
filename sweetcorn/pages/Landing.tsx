
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronRight } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Mega Hero Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/ningyuzhi-hero/1920/1080?grayscale" 
          className="w-full h-full object-cover opacity-15"
          alt="Hero background"
        />
        <div className="absolute inset-0 gradient-ningyuzhi mix-blend-multiply opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
        <div className="animate-float space-y-12">
          
          <h1 className="text-7xl md:text-9xl font-soft text-green-950 tracking-tight leading-tight">
            甜玉米<br />
            <span>成长乐园</span>
          </h1>
          
          <div className="flex flex-wrap justify-center gap-6 mt-16">
            <Link 
              to="/timeline" 
              className="px-12 py-5 gradient-ningyuzhi text-green-950 font-black text-xl rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
            >
              开启回忆 <ChevronRight />
            </Link>
            <Link 
              to="/discussion" 
              className="px-12 py-5 bg-white text-green-950 font-black text-xl rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
            >
              进入交流区 <Heart className="text-red-400 fill-current" size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Floating Blobs */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-yellow-100/30 rounded-full blur-3xl animate-pulse delay-700" />
    </div>
  );
};