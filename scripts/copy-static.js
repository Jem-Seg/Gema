const fs = require('fs');
const path = require('path');

console.log('\n📋 Post-build: Copying static files to standalone...\n');

const sourceStatic = path.join(__dirname, '../.next/static');
const targetStatic = path.join(__dirname, '../.next/standalone/.next/static');
const sourcePublic = path.join(__dirname, '../public');
const targetPublic = path.join(__dirname, '../.next/standalone/public');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source not found: ${src}`);
    return false;
  }

  // Create destination directory
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

// Copy static files
console.log('Copying .next/static to .next/standalone/.next/static...');
if (copyDir(sourceStatic, targetStatic)) {
  const jsFiles = fs.readdirSync(path.join(targetStatic, 'chunks')).filter(f => f.endsWith('.js')).length;
  const cssFiles = fs.readdirSync(path.join(targetStatic, 'css')).filter(f => f.endsWith('.css')).length;
  console.log(`✅ Static files copied: ${jsFiles} JS files, ${cssFiles} CSS files`);
} else {
  console.error('❌ Failed to copy static files');
  process.exit(1);
}

// Copy public files
if (fs.existsSync(sourcePublic)) {
  console.log('\nCopying public to .next/standalone/public...');
  copyDir(sourcePublic, targetPublic);
  console.log('✅ Public files copied');
} else {
  console.log('⚠️  No public directory found (this is OK)');
}

console.log('\n✨ Post-build completed successfully!\n');
