import fs from 'fs';

let content = fs.readFileSync('./src/index.css', 'utf8');

const originalCSS = `* {
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:'Inter',sans-serif;
}
body{
    background:#080B14;
    color:white;
    overflow-x:hidden;
}

body{
    min-height:100vh;
    background:
    radial-gradient(circle at top left,
    rgba(123,47,247,.20),
    transparent 40%),
    radial-gradient(circle at top right,
    rgba(247,37,133,.18),
    transparent 35%),
    radial-gradient(circle at bottom right,
    rgba(255,140,66,.18),
    transparent 35%),
    #080B14;
    color:white;
}

.card{
    background:rgba(255,255,255,.05);
    backdrop-filter:blur(18px);
    border-radius:24px;
    border:1px solid rgba(255,255,255,.08);
    box-shadow: 0 15px 40px rgba(0,0,0,.30);
}

.gradient-card{
background: linear-gradient( 135deg, #7B2FF7, #F72585, #FF8C42 );
padding:30px;
border-radius:24px;
color:white;
overflow:hidden;
position:relative;
transition:.35s;
}

.gradient-card:hover{
transform:translateY(-8px);
box-shadow: 0 20px 60px rgba(247,37,133,.35);
}

.btn{
padding: 14px 28px;
border:none;
border-radius:15px;
cursor:pointer;
background: linear-gradient( 135deg, #7B2FF7, #F72585, #FF8C42 );
color:white;
font-weight:600;
transition:.3s;
}

.btn:hover{
transform:scale(1.05);
}

.dashboard{
display:flex;
min-height:100vh;
padding:30px;
gap:30px;
}

.sidebar{
width:270px;
background:#101827;
border-radius:24px;
padding:30px;
}

.content{
flex:1;
display:flex;
flex-direction:column;
gap:30px;
}`;

const themeCSS = fs.readFileSync('../finance-x-ray-dashboard/app/globals.css', 'utf8');
const safeThemeCSS = themeCSS.replace(/@import 'tailwindcss';/, '').replace(/@import 'tw-animate-css';/, '');

const newCSS = `@import "tailwindcss";
@import 'tw-animate-css';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

${safeThemeCSS}

@layer base {
${originalCSS}
}
`;

fs.writeFileSync('./src/index.css', newCSS);
console.log("Rewrote index.css with proper layers");
