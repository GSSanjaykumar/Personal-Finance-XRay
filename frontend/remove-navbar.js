import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, 'src/pages');

function removeNavbar(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/import Navbar from ["'].*?Navbar["'];\r?\n?/g, '');
    content = content.replace(/<Navbar \/>\r?\n?/g, '');
    
    // Sometimes there is an empty <> </> that needs to be fixed if Navbar was the only thing before <div className="page-header">
    // Actually, <><Navbar /><div className="page-header"> is standard. Just removing <Navbar /> leaves <> \n <div... which is valid JSX.
    // However, if we had <><Navbar /><ErrorState... we might get <><ErrorState...
    content = content.replace(/<><Navbar \/><ErrorState/g, '<><ErrorState');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

const files = fs.readdirSync(pagesDir);
files.forEach(file => {
    if (file.endsWith('.jsx') && file !== 'Dashboard.jsx' && file !== 'Login.jsx' && file !== 'Register.jsx') {
        removeNavbar(path.join(pagesDir, file));
    }
});
console.log("Removed Navbar from other pages.");
