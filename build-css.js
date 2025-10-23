const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Building CSS for landing page...');

try {
  // Run Tailwind CSS build
  execSync('npx tailwindcss -i ./src/landing-styles.css -o ./src/landing-styles-built.css --minify', { stdio: 'inherit' });
  
  // Update HTML file with new CSS version
  const htmlPath = './public/landing-page.html';
  const timestamp = Date.now();
  
  if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Update CSS link with new timestamp
    htmlContent = htmlContent.replace(
      /landing-styles-built\.css\?v=\d+/g,
      `landing-styles-built.css?v=${timestamp}`
    );
    
    fs.writeFileSync(htmlPath, htmlContent);
    console.log('✅ Updated HTML with new CSS version');
  }
  
  // Copy CSS files to build directory
  const buildDir = './build';
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
    console.log('✅ Created build directory');
  }
  
  // Copy CSS files
  if (fs.existsSync('./src/landing-styles-built.css')) {
    fs.copyFileSync('./src/landing-styles-built.css', './build/landing-styles-built.css');
    console.log('✅ Copied landing-styles-built.css to build directory');
  }
  
  if (fs.existsSync('./src/landing-styles.css')) {
    fs.copyFileSync('./src/landing-styles.css', './build/landing-styles.css');
    console.log('✅ Copied landing-styles.css to build directory');
  }
  
  // Copy landing page HTML
  if (fs.existsSync(htmlPath)) {
    fs.copyFileSync(htmlPath, './build/landing-page.html');
    console.log('✅ Copied landing-page.html to build directory');
  }
  
  // Don't copy index.html here - it's already handled by Vite build process
  // The built index.html with correct asset references is already in build directory
  
  // Copy static assets
  const staticFiles = ['logo.svg', 'favicon.ico', 'favicon.svg', 'ai-mascot.svg'];
  staticFiles.forEach(file => {
    const srcPath = `./public/${file}`;
    const destPath = `./build/${file}`;
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file} to build directory`);
    }
  });
  
  console.log('🎉 CSS build completed successfully!');
  
} catch (error) {
  console.error('❌ Error building CSS:', error.message);
  process.exit(1);
}
