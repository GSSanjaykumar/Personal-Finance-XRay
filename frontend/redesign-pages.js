import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, 'src/pages');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove Navbar import and component usage
    content = content.replace(/import Navbar from ["'].*?Navbar["'];\r?\n?/g, '');
    content = content.replace(/<Navbar \/>\r?\n?/g, '');
    content = content.replace(/<><Navbar \/><ErrorState/g, '<><ErrorState');

    // 2. Replace page-header
    content = content.replace(/<div className="page-header"([^>]*)>\s*<div>\s*<h1>(.*?)<\/h1>\s*<p className="subtitle">(.*?)<\/p>\s*<\/div>/g, 
        '<header className="mb-6" $1>\n  <h1 className="text-3xl font-semibold tracking-tight">$2</h1>\n  <p className="mt-1.5 text-muted-foreground">$3</p>\n</header>'
    );

    // Some pages might not have matched exactly, e.g., Recurring.jsx has dynamic subtitle
    content = content.replace(/<div className="page-header"(.*?)>\s*<div>\s*<h1>(.*?)<\/h1>\s*<p className="subtitle">\s*(\{.*?\}.*?|.*?)\s*<\/p>\s*<\/div>/g, 
        '<header className="mb-6" $1>\n  <h1 className="text-3xl font-semibold tracking-tight">$2</h1>\n  <p className="mt-1.5 text-muted-foreground">$3</p>\n</header>'
    );

    // 3. Replace filters container
    content = content.replace(/<div className="filters">/g, '<div className="mb-6 flex flex-wrap gap-4">');
    content = content.replace(/className="search-box"/g, 'className="flex h-10 w-full md:w-64 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"');
    content = content.replace(/className="filter-select"/g, 'className="flex h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"');

    // 4. Update skeleton wrapper if it exists (e.g. <div style={{ marginTop: '24px' }}>)
    content = content.replace(/<div style=\{\{ marginTop: '24px' \}\}>/g, '<div className="mt-6 space-y-6">');

    fs.writeFileSync(filePath, content, 'utf8');
}

const files = fs.readdirSync(pagesDir);
files.forEach(file => {
    if (file.endsWith('.jsx') && file !== 'Dashboard.jsx' && file !== 'Login.jsx' && file !== 'Register.jsx') {
        processFile(path.join(pagesDir, file));
    }
});
console.log("Processed pages.");
