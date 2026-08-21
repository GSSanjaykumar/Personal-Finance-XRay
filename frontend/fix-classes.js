import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, 'src/pages');

function fixStrayDivsAndClasses(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove stray </div> after </header>
    content = content.replace(/<\/header>\s*<\/div>/g, '</header>');

    // Replace grid classes
    content = content.replace(/className="chart-grid"/g, 'className="grid grid-cols-1 gap-6 lg:grid-cols-3"');
    content = content.replace(/className="analytics-tables-grid"/g, 'className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6"');
    content = content.replace(/className="recurring-full-grid"/g, 'className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"');
    
    // Replace card classes
    content = content.replace(/className="chart-card"/g, 'className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"');
    content = content.replace(/className="table-card"/g, 'className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] overflow-x-auto"');
    content = content.replace(/className="category-card"/g, 'className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1"');
    content = content.replace(/className="insight-card"/g, 'className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"');
    
    // Replace table classes
    content = content.replace(/className="transaction-table"/g, 'className="w-full text-left text-sm whitespace-nowrap mt-4"');
    content = content.replace(/<thead>/g, '<thead className="text-muted-foreground text-xs uppercase tracking-wider">');
    content = content.replace(/<tbody>/g, '<tbody className="divide-y divide-[var(--border)]">');
    content = content.replace(/<tr key=\{i\} tabIndex="0">/g, '<tr key={i} className="transition-colors hover:bg-[var(--surface-2)]">');

    // Replace header tags inside cards
    content = content.replace(/<h3>(.*?)<\/h3>/g, '<h3 className="text-base font-semibold">$1</h3>');

    // Button
    content = content.replace(/className="btn"/g, 'className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"');

    // Replace text colors
    content = content.replace(/className="amount-credit"/g, 'className="text-[var(--positive)] font-medium"');
    content = content.replace(/className="amount-debit"/g, 'className="font-medium"');

    fs.writeFileSync(filePath, content, 'utf8');
}

const files = fs.readdirSync(pagesDir);
files.forEach(file => {
    if (file.endsWith('.jsx') && file !== 'Dashboard.jsx') {
        fixStrayDivsAndClasses(path.join(pagesDir, file));
    }
});
console.log("Fixed classes on all pages.");
