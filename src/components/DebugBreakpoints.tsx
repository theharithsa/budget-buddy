import React, { useState, useEffect } from 'react';

export function DebugBreakpoints() {
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    breakpoint: 'unknown'
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let breakpoint = 'xs';
      
      if (width >= 1536) breakpoint = '2xl';
      else if (width >= 1280) breakpoint = 'xl';
      else if (width >= 1024) breakpoint = 'lg';
      else if (width >= 768) breakpoint = 'md';
      else if (width >= 640) breakpoint = 'sm';
      
      setScreenInfo({ width, height, breakpoint });
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    
    return () => window.removeEventListener('resize', updateScreenInfo);
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-3 rounded-lg shadow-lg text-sm font-mono z-50">
      <div>Screen: {screenInfo.width} × {screenInfo.height}</div>
      <div>Breakpoint: {screenInfo.breakpoint}</div>
      <div className="mt-1 text-xs opacity-75">
        <div className="sm:hidden">Current: xs (&lt;640px)</div>
        <div className="hidden sm:block md:hidden">Current: sm (640-767px)</div>
        <div className="hidden md:block lg:hidden">Current: md (768-1023px)</div>
        <div className="hidden lg:block xl:hidden">Current: lg (1024-1279px)</div>
        <div className="hidden xl:block 2xl:hidden">Current: xl (1280-1535px)</div>
        <div className="hidden 2xl:block">Current: 2xl (≥1536px)</div>
      </div>
    </div>
  );
}
