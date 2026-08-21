import fs from 'fs';

let dashContent = fs.readFileSync('./src/pages/Dashboard.jsx', 'utf8');
dashContent = dashContent.replace(/amount: r\.amount/g, 'amount: r.average_amount || 0');
fs.writeFileSync('./src/pages/Dashboard.jsx', dashContent);

let recContent = fs.readFileSync('./src/components/v0-dashboard/recurring-payments.tsx', 'utf8');
recContent = recContent.replace(/recurring\.reduce/g, 'data.reduce');
fs.writeFileSync('./src/components/v0-dashboard/recurring-payments.tsx', recContent);

let budgetContent = fs.readFileSync('./src/components/v0-dashboard/budget-overview.tsx', 'utf8');
budgetContent = budgetContent.replace(/budgets\.reduce/g, 'data.reduce');
fs.writeFileSync('./src/components/v0-dashboard/budget-overview.tsx', budgetContent);

console.log("Fixed reduce and mappings.");
