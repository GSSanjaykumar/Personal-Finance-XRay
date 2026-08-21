import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loginPath = path.join(__dirname, 'src/pages/Login.jsx');
const registerPath = path.join(__dirname, 'src/pages/Register.jsx');

function fixAuth(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace gradient backgrounds and old colors with Vercel variables
    content = content.replace(/linear-gradient\(135deg, rgba\(20,22,35,0\.9\), rgba\(30,25,50,0\.9\)\)/g, 'var(--surface)');
    content = content.replace(/rgba\(139,92,246,0\.3\)/g, 'var(--border)');
    content = content.replace(/rgba\(139,92,246,0\.15\)/g, 'var(--border)');
    content = content.replace(/rgba\(139,92,246,0\.08\)/g, 'var(--border)');
    content = content.replace(/rgba\(139,92,246,0\.18\)/g, 'var(--border)');
    content = content.replace(/rgba\(139,92,246,0\.55\)/g, 'var(--muted)');
    content = content.replace(/linear-gradient\(135deg, #7B2FF7 0%, #F72585 100%\)/g, 'var(--accent)');
    content = content.replace(/rgba\(20,22,35,0\.55\)/g, 'var(--surface-2)');
    content = content.replace(/rgba\(20,22,35,0\.72\)/g, 'var(--background)');
    content = content.replace(/rgba\(255,255,255,0\.08\)/g, 'var(--border)');
    content = content.replace(/#8B5CF6/g, 'var(--accent)');
    content = content.replace(/#f472b6/g, 'var(--accent-hover)');
    content = content.replace(/#ec4899/g, 'var(--accent)');
    content = content.replace(/#64748b/g, 'var(--muted)');
    content = content.replace(/#94a3b8/g, 'var(--muted-foreground)');
    content = content.replace(/#e2e8f0/g, 'var(--foreground)');
    content = content.replace(/#f1f5f9/g, 'var(--foreground)');
    content = content.replace(/rgba\(148,163,184,0\.6\)/g, 'var(--muted-foreground)');

    fs.writeFileSync(filePath, content, 'utf8');
}

fixAuth(loginPath);
fixAuth(registerPath);

console.log("Fixed auth pages.");
