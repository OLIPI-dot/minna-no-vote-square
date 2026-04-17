const fs = require('fs');
const content = fs.readFileSync('i:/olipiprojects/antigravity-scratch/minna-no-vote-square/src/App.jsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let lineNum = 1;
const braces = [];

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\n') lineNum++;
    
    if (char === '{') {
        braceCount++;
        braces.push({ line: lineNum, type: '{' });
    } else if (char === '}') {
        braceCount--;
        braces.push({ line: lineNum, type: '}' });
        if (braceCount < 0) {
            console.log(`❌ Extra closing brace at line ${lineNum}`);
            braceCount = 0; // reset to continue
        }
    }
}

console.log(`Final Brace Balance: ${braceCount}`);
if (braceCount > 0) {
    console.log(`⚠️ Missing ${braceCount} closing braces.`);
    // Show open braces and their lines
    let openStack = [];
    let lineStack = [];
    lineNum = 1;
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '\n') lineNum++;
        if (char === '{') {
            lineStack.push(lineNum);
        } else if (char === '}') {
            lineStack.pop();
        }
    }
    console.log(`Open braces are at lines: ${lineStack.join(', ')}`);
}
