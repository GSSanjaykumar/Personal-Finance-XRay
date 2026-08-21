import fs from 'fs';

let content = fs.readFileSync('./src/index.css', 'utf8');

// remove all @import "tailwindcss" or @import 'tailwindcss'
content = content.replace(/@import ['"]tailwindcss['"];?/g, '');
content = content.replace(/@import ['"]tw-animate-css['"];?/g, '');

// The globals.css has @custom-variant dark (\&:is(.dark *));
content = content.replace(/@custom-variant dark \(\&:is\(\.dark \*\)\);?/g, '');

let themeMatch = content.match(/@theme inline \{[\s\S]*?\}/);
let themeBlock = themeMatch ? themeMatch[0] : '';
if (themeBlock) {
    content = content.replace(themeBlock, '');
}

// Now assemble the final index.css
let finalCSS = `@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@custom-variant dark (&:is(.dark *));

${themeBlock}

${content}
`;

fs.writeFileSync('./src/index.css', finalCSS);
console.log("Fixed index.css");
