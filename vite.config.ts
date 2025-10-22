
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import { copyFileSync, existsSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-landing-page',
      writeBundle() {
        // Copy landing page and CSS files to build directory
        const buildDir = 'build';
        const publicDir = 'public';
        const srcDir = 'src';
        
        if (!existsSync(buildDir)) {
          mkdirSync(buildDir, { recursive: true });
        }
        
        // Copy landing page
        if (existsSync(`${publicDir}/landing-page.html`)) {
          copyFileSync(`${publicDir}/landing-page.html`, `${buildDir}/landing-page.html`);
          console.log('✅ Copied landing-page.html to build directory');
        }
        
        // Copy CSS files
        if (existsSync(`${srcDir}/landing-styles-built.css`)) {
          copyFileSync(`${srcDir}/landing-styles-built.css`, `${buildDir}/landing-styles-built.css`);
          console.log('✅ Copied landing-styles-built.css to build directory');
        }
        
        if (existsSync(`${srcDir}/landing-styles.css`)) {
          copyFileSync(`${srcDir}/landing-styles.css`, `${buildDir}/landing-styles.css`);
          console.log('✅ Copied landing-styles.css to build directory');
        }
        
        // Copy other static assets
        const staticFiles = ['logo.svg', 'favicon.ico', 'favicon.svg', 'ai-mascot.svg'];
        staticFiles.forEach(file => {
          if (existsSync(`${publicDir}/${file}`)) {
            copyFileSync(`${publicDir}/${file}`, `${buildDir}/${file}`);
            console.log(`✅ Copied ${file} to build directory`);
          }
        });
      }
    }
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React ecosystem together to prevent module resolution issues
          'react-vendor': ['react', 'react-dom', 'scheduler'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-aspect-ratio', '@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-context-menu', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-slot', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-toggle', '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react'],
          'animation-vendor': ['framer-motion', 'recharts'],
          'form-vendor': ['react-hook-form', 'react-day-picker'],
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(assetInfo.name)) {
            return `assets/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
    server: {
      port: 3000,
      open: true,
      fs: {
        allow: ['..']
      }
    },
  });