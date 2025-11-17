import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoLoaderProps {
  isTransitioning: boolean;
  onComplete: () => void;
}

export const LogoLoader: React.FC<LogoLoaderProps> = ({ isTransitioning, onComplete }) => {
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Glow effect behind logo */}
          <motion.div
            className="absolute w-32 h-32 bg-white/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Spinning Logo */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, rotate: 0 }}
            animate={{
              scale: [0, 1.2, 1],
              rotate: [0, 360, 720],
            }}
            exit={{
              scale: 0.3,
              y: -300,
              transition: {
                duration: 0.6,
                ease: [0.43, 0.13, 0.23, 0.96],
              },
            }}
            transition={{
              duration: 1.5,
              ease: [0.43, 0.13, 0.23, 0.96],
            }}
            onAnimationComplete={() => {
              // Call onComplete after animation finishes
              setTimeout(() => {
                onComplete();
              }, 200);
            }}
          >
            {/* SomaTogether.ai Logo - Always show SVG for consistent spinning */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-2xl"
              >
                <circle cx="40" cy="40" r="38" fill="white" fillOpacity="0.95" />
                <path
                  d="M40 20L50 40H30L40 20Z"
                  fill="url(#gradient1)"
                />
                <circle cx="40" cy="55" r="8" fill="url(#gradient2)" />
                <defs>
                  <linearGradient id="gradient1" x1="40" y1="20" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#3B82F6" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="40" y1="47" x2="40" y2="63" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* Loading text */}
          <motion.p
            className="absolute bottom-1/3 text-white font-semibold text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Loading...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

