import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, 'src/pages');

function fixStrayDivs(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove stray </div> on Budget.jsx
    if (filePath.endsWith('Budget.jsx')) {
        content = content.replace(/<\/header>\s*<button/g, '</header>\n                </div>\n                <button');
        content = content.replace(/<\/button>\s*<\/div>\s*\{analysis\.length/g, '</button>\n            {analysis.length');
    }

    // Insights.jsx stray div
    if (filePath.endsWith('Insights.jsx')) {
        content = content.replace(/<\/header>\s*<\/div>\s*\{activeInsights/g, '</header>\n\n            {activeInsights');
    }

    // Recurring.jsx stray div
    if (filePath.endsWith('Recurring.jsx')) {
        content = content.replace(/<\/select>\s*<\/div>\s*<\/div>\s*\{filteredRecurring/g, '</select>\n                </div>\n\n            {filteredRecurring');
    }

    // Transactions.jsx stray div
    if (filePath.endsWith('Transactions.jsx')) {
        content = content.replace(/<\/select>\s*<\/div>\s*<\/div>\s*\{loading \?/g, '</select>\n                </div>\n\n            {loading ?');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

const files = fs.readdirSync(pagesDir);
files.forEach(file => {
    if (file.endsWith('.jsx') && file !== 'Dashboard.jsx') {
        fixStrayDivs(path.join(pagesDir, file));
    }
});
console.log("Fixed stray divs exactly.");
