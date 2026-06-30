import React, { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export function LogoSimple({ 
  size = 'md', 
  showText = true, 
  className = '', 
  animated = true 
}: LogoProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        {/* Glow Effect */}
        {animated && (
          <div className="logo-glow absolute inset-0 rounded-lg blur-md" />
        )}
        
        {/* Logo Container */}
        <div
          className={`${sizeClasses[size]} logo-container relative rounded-lg overflow-hidden ${
            animated ? 'logo-entrance' : ''
          }`}
        >
          {/* SVG Logo */}
          <img
            src="/logo.svg"
            alt="SomaTogether.ai Logo"
            className="w-full h-full object-contain transition-all duration-300 hover:brightness-125 hover:saturate-130"
            onLoad={() => setIsLoaded(true)}
          />
          
          {/* Loading Animation */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg">
              <div className="logo-shimmer w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
            </div>
          )}

          {/* Pulse Effect */}
          {animated && isLoaded && (
            <div className="logo-pulse absolute inset-0 rounded-lg border-2 border-blue-400" />
          )}
        </div>
      </div>

      {/* Text */}
      {showText && (
        <span 
          className={`font-bold text-slate-900 ${textSizeClasses[size]} logo-text ${
            isLoaded && animated ? 'logo-text-entrance' : ''
          }`}
        >
          SomaTogether.ai
        </span>
      )}
    </div>
  );
}

// Compact version for small spaces
export function LogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-6 h-6 logo-container logo-entrance relative transition-all duration-300 hover:scale-110 hover:rotate-2">
        <img
          src="/logo.svg"
          alt="SomaTogether.ai"
          className="w-full h-full object-contain"
        />
        
        {/* Subtle pulse */}
        <div className="logo-pulse absolute inset-0 rounded border border-blue-400" />
      </div>
    </div>
  );
}
