import React, { useState, useEffect } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export function Logo({ 
  size = 'md', 
  showText = true, 
  className = '', 
  animated = true 
}: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
    <div 
      className={`flex items-center space-x-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Glow Effect */}
        {animated && (
          <div 
            className={`absolute inset-0 rounded-lg blur-md bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300 ${
              isHovered ? 'opacity-60 scale-110' : 'opacity-30'
            }`}
            style={{
              animation: animated ? 'pulse 2s infinite' : 'none'
            }}
          />
        )}
        
        {/* Logo Container */}
        <div
          className={`${sizeClasses[size]} relative rounded-lg overflow-hidden transition-all duration-300 ${
            isHovered && animated ? 'scale-110 rotate-2' : 'scale-100'
          }`}
          style={{
            animation: isLoaded ? 'logoEntrance 0.6s ease-out' : 'none'
          }}
        >
          {/* SVG Logo */}
          <img
            src="/logo.svg"
            alt="SomaTogether.ai Logo"
            className={`w-full h-full object-contain transition-all duration-300 ${
              isHovered && animated ? 'brightness-125 saturate-130' : ''
            }`}
            onLoad={() => setIsLoaded(true)}
            style={{
              animation: isHovered && animated ? 'logoWiggle 0.6s ease-in-out' : 'none'
            }}
          />
          
          {/* Loading Animation */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg animate-pulse">
              <div 
                className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                style={{
                  animation: 'shimmer 1.5s infinite linear'
                }}
              />
            </div>
          )}

          {/* Pulse Effect */}
          {animated && isLoaded && (
            <div
              className="absolute inset-0 rounded-lg border-2 border-blue-400 opacity-50"
              style={{
                animation: 'logoPulse 2s infinite ease-in-out'
              }}
            />
          )}
        </div>
      </div>

      {/* Text */}
      {showText && (
        <span 
          className={`font-bold ${textSizeClasses[size]} transition-all duration-300 ${
            isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-5 opacity-0'
          }`}
          style={{
            transitionDelay: isLoaded ? '0.2s' : '0s'
          }}
        >
          SomaTogether.ai
        </span>
      )}

      <style jsx>{`
        @keyframes logoEntrance {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes logoWiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// Compact version for small spaces
export function LogoCompact({ className = '' }: { className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <div
        className="w-6 h-6 relative transition-all duration-300 hover:scale-110 hover:rotate-2"
        style={{
          animation: isLoaded ? 'logoEntrance 0.6s ease-out' : 'none'
        }}
      >
        <img
          src="/logo.svg"
          alt="SomaTogether.ai"
          className="w-full h-full object-contain"
          onLoad={() => setIsLoaded(true)}
        />
        
        {/* Subtle pulse */}
        <div
          className="absolute inset-0 rounded border border-blue-400 opacity-30"
          style={{
            animation: 'logoPulse 3s infinite ease-in-out'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes logoEntrance {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}