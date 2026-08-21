import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const dirs = [
  './src/components/v0-dashboard',
  './src/components/v0-ui',
  './src/v0-lib'
];

dirs.forEach(dir => {
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix ui paths
      content = content.replace(/@\/components\/ui\//g, '@/components/v0-ui/');
      
      // Fix dashboard paths
      content = content.replace(/@\/components\/dashboard\//g, '@/components/v0-dashboard/');
      
      // Fix theme-provider
      content = content.replace(/@\/components\/theme-provider/g, '@/components/v0-dashboard/theme-provider');
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
});

console.log("Path migration complete.");
