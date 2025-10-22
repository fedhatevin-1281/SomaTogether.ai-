const fs = require('fs');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

console.log('👀 Watching for CSS changes...');

// Watch for changes in the source CSS file
const watcher = chokidar.watch('./src/landing-styles.css', {
  persistent: true
});

watcher.on('change', (path) => {
  console.log(`\n📝 CSS file changed: ${path}`);
  
  // Generate timestamp for cache busting
  const timestamp = Date.now();
  
  // Build CSS
  console.log('🔨 Building CSS...');
  try {
    execSync('npx tailwindcss -i ./src/landing-styles.css -o ./src/landing-styles-built.css', { stdio: 'inherit' });
    
    // Update HTML with new timestamp
    console.log('📄 Updating HTML with cache-busting parameter...');
    const htmlPath = './public/landing-page.html';
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Replace the CSS link with new timestamp
    htmlContent = htmlContent.replace(
      /src\/landing-styles-built\.css\?v=\d+/g,
      `src/landing-styles-built.css?v=${timestamp}`
    );
    
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log(`✅ CSS built and HTML updated with timestamp: ${timestamp}`);
    console.log('🔄 Refresh your browser to see changes!');
  } catch (error) {
    console.error('❌ Error building CSS:', error.message);
  }
});

console.log('🚀 CSS watcher started. Make changes to src/landing-styles.css to see live updates!');

