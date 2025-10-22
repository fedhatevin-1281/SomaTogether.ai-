const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Serve landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'landing-page.html'));
});

// Proxy /app requests to Vite dev server
app.use('/app', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  pathRewrite: {
    '^/app': '', // Remove /app prefix when forwarding to Vite
  },
}));

// Start Vite dev server in the background
const { spawn } = require('child_process');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

app.listen(PORT, () => {
  console.log(`🚀 Local server running at http://localhost:${PORT}`);
  console.log(`📄 Landing page: http://localhost:${PORT}/`);
  console.log(`⚛️  React app: http://localhost:${PORT}/app`);
  console.log(`🔄 Vite dev server running on port 5173`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  viteProcess.kill();
  process.exit(0);
});
