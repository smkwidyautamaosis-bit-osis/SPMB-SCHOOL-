'use client';

import { useState, useEffect } from 'react';

interface Banner {
  id: string;
  url: string;
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 4000); // 4 detik
    
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  if (banners.length === 1) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 -mb-8 relative z-10">
        <div className="rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-slate-50 relative aspect-[6/1] md:aspect-[5/1] lg:aspect-[6/1]">
          <img 
            src={banners[0].url} 
            alt="Banner Promosi SPMB SMK Widya Utama" 
            className="w-full h-full object-cover"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 -mb-8 relative z-10">
      <div className="rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-slate-50 relative aspect-[6/1] md:aspect-[5/1] lg:aspect-[6/1]">
        {/* Images */}
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img 
              src={banner.url} 
              alt={`Banner Promosi ${index + 1}`} 
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'bg-amber-400 w-6 shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
