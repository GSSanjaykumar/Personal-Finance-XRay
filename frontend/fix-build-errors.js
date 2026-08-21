import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix Budget.jsx
let budgetPath = path.join(__dirname, 'src/pages/Budget.jsx');
let budget = fs.readFileSync(budgetPath, 'utf8');
budget = budget.replace(/<\/header>\s*<\/div>\s*<button/g, '</header>\n                <button');
fs.writeFileSync(budgetPath, budget, 'utf8');

// I also need to run redesign-pages and fix-classes on Insights.jsx since I reverted it!
