import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GeminiChatBox } from './GeminiChatBox';

interface FloatingAIButtonProps {
  className?: string;
}

export function FloatingAIButton({ className = '' }: FloatingAIButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { profile } = useAuth();

  const toggleAssistant = () => setIsOpen(!isOpen);

  const getAssistantTitle = () => {
    if (profile?.role === 'teacher') return 'Soma Teaching Assistant';
    if (profile?.role === 'parent') return 'Soma Parenting Assistant';
    return 'Soma Learning Assistant';
  };

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          className={`
            fixed bottom-[30px] right-[30px] w-[70px] h-[70px]
            inline-flex items-center justify-center
            bg-gradient-to-br from-[#667eea] to-[#764ba2]
            border-3 border-white shadow-lg
            rounded-full z-[1001] cursor-pointer
            transform-gpu overflow-visible
            transition-all duration-300
            hover:scale-110 hover:rotate-12
            group
            ${className}
          `}
          onClick={toggleAssistant}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Open AI Assistant"
          title={getAssistantTitle()}
        >
          <img
            src="/AI Mascot.svg"
            alt="AI Mascot"
            className="w-1/2 h-1/2 object-contain pointer-events-none mascot-live"
            onError={(e) => {
              console.error('Failed to load AI Mascot SVG:', e);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Fallback Icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ display: 'none' }} id="fallback-icon">
            <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#667eea"/>
              <circle cx="9" cy="9" r="1.5" fill="#667eea"/>
              <circle cx="15" cy="9" r="1.5" fill="#667eea"/>
              <path d="M9 15c0 1.66 1.34 3 3 3s3-1.34 3-3" stroke="#667eea" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
        </button>
      )}

      {/* Gemini Chat Box */}
      {isOpen && <GeminiChatBox onClose={toggleAssistant} />}

      {/* Tooltip */}
      <div
        className={`
          fixed left-[30px] bottom-[30px]  /* adjust above button */
          bg-[rgba(8, 8, 8, 0)] text-white
          px-3 py-2 rounded-lg text-sm whitespace-nowrap
          opacity-0 pointer-events-none
          transition-all duration-[140ms] ease-out
          ${isHovered ? 'opacity-100 translate-y-0' : ''}
        `}
        role="tooltip"
      >
        {getAssistantTitle()}
        {/* Arrow */}
        <div className="absolute -right-[6px] top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-[rgba(0,0,0,0.85)] border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent" />
      </div>
    </>
  );
}
