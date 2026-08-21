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
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove "use client"
      content = content.replace(/"use client"[\r\n]+/g, '');
      
      // Replace motion/react with framer-motion
      content = content.replace(/['"]motion\/react['"]/g, '"framer-motion"');
      
      // Replace next/link with react-router-dom
      content = content.replace(/import Link from ['"]next\/link['"]/g, 'import { Link } from "react-router-dom"');
      
      // Replace @/lib with @/v0-lib
      content = content.replace(/@\/lib\//g, '@/v0-lib/');
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
});

console.log("Migration script complete.");
