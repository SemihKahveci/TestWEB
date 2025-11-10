const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../public');
const targetDir = path.join(__dirname, '../.next/standalone/public');
const standaloneDir = path.join(__dirname, '../.next/standalone');

if (!fs.existsSync(standaloneDir)) {
  console.log('Standalone build bulunamadı. Önce "npm run build" çalıştırın.');
  process.exit(0);
}

if (!fs.existsSync(sourceDir)) {
  console.log('Public klasörü bulunamadı.');
  process.exit(0);
}

// Target dizinini oluştur
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Recursive copy function
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(sourceDir, targetDir);
console.log('✓ Public klasörü .next/standalone/public içine kopyalandı');

