import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const insightPath = path.join(__dirname, 'src/pages/Insights.jsx');

let content = fs.readFileSync(insightPath, 'utf8');

// 1. Remove Navbar import and component usage
content = content.replace(/import Navbar from ["'].*?Navbar["'];\r?\n?/g, '');
content = content.replace(/<Navbar \/>\r?\n?/g, '');
content = content.replace(/<><Navbar \/><ErrorState/g, '<><ErrorState');

// 2. Replace page-header
content = content.replace(/<div className="page-header"([^>]*)>\s*<div>\s*<h1>(.*?)<\/h1>\s*<p className="subtitle">(.*?)<\/p>\s*<\/div>/g, 
    '<header className="mb-6" $1>\n  <h1 className="text-3xl font-semibold tracking-tight">$2</h1>\n  <p className="mt-1.5 text-muted-foreground">$3</p>\n</header>'
);

// 3. Replace card classes
content = content.replace(/className="insight-card"/g, 'className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"');

// 4. Update skeleton wrapper
content = content.replace(/<div style=\{\{ marginTop: '24px' \}\}>/g, '<div className="mt-6 space-y-6">');

// 5. Replace header tags inside cards
content = content.replace(/<h3>(.*?)<\/h3>/g, '<h3 className="text-base font-semibold">$1</h3>');

// 6. Fix stray div
content = content.replace(/<\/header>\s*<button/g, '</header>\n                <button');
content = content.replace(/<\/button>\s*<\/div>\s*\{activeInsights/g, '</button>\n            {activeInsights');

fs.writeFileSync(insightPath, content, 'utf8');
console.log("Fixed Insights.jsx completely.");
