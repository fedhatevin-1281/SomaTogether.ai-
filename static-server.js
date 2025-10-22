const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle app routes - serve React app
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Handle app routes with query parameters
app.get('/', (req, res) => {
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const isAppRoute = urlParams.has('screen') || req.path.startsWith('/app');
  
  if (isAppRoute) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'build', 'landing-page.html'));
  }
});

// All other routes serve the landing page
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'landing-page.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Static server running at http://localhost:${PORT}`);
  console.log('📄 Serving landing page and React app based on route');
  console.log('🔗 App routes: /app or ?screen=login');
  console.log('🏠 Landing page: all other routes');
});

