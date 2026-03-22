const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("const IS_MAINTENANCE = true;", "const IS_MAINTENANCE = false;");

fs.writeFileSync(path, content, 'utf8');
console.log('Maintenance Mode OFF!');
