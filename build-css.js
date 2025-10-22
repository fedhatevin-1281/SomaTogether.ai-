const fs = require('fs');
const { execSync } = require('child_process');

// Generate timestamp for cache busting
const timestamp = Date.now();

// Build CSS
console.log('Building CSS...');
execSync('npx tailwindcss -i ./src/landing-styles-complete.css -o ./src/landing-styles-built.css', { stdio: 'inherit' });

// Copy CSS files to build directory
console.log('Copying CSS files to build directory...');

// Ensure build directory exists
const buildDir = './build';
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('Created build directory');
}

fs.copyFileSync('./src/landing-styles-built.css', './build/landing-styles-built.css');
fs.copyFileSync('./src/landing-styles.css', './build/landing-styles.css');

// Update HTML with new timestamp
console.log('Updating HTML with cache-busting parameter...');
const htmlPath = './public/landing-page.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Replace the CSS link with new timestamp
htmlContent = htmlContent.replace(
  /landing-styles-built\.css\?v=\d+/g,
  `landing-styles-built.css?v=${timestamp}`
);

fs.writeFileSync(htmlPath, htmlContent);

console.log(`✅ CSS built and HTML updated with timestamp: ${timestamp}`);
console.log('🔄 Refresh your browser to see changes!');

