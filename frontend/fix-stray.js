import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, 'src/pages');

function fixStrayDivs(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove stray </div> that's right after the filters div
    // We can match:
    // </select>
    // </div>
    // </div>
    // and replace with:
    // </select>
    // </div>
    
    // Some filters end with </select> or </div> 
    content = content.replace(/<\/select>\s*<\/div>\s*<\/div>/g, '</select>\n                </div>');
    // For ChatAssistant, maybe it ends differently?
    // Let's just do a manual replace for the stray </div> based on the errors
    // Budget.jsx:
    content = content.replace(/<\/header>\s*<\/div>/g, '</header>');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

const files = fs.readdirSync(pagesDir);
files.forEach(file => {
    if (file.endsWith('.jsx') && file !== 'Dashboard.jsx') {
        fixStrayDivs(path.join(pagesDir, file));
    }
});
console.log("Fixed stray divs.");
