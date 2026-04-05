const fs = require('fs');
const content = fs.readFileSync('world.svg', 'utf8');
const regex = /name="([^"]+)"/g;
const names = new Set();
let match;
while ((match = regex.exec(content)) !== null) {
    names.add(match[1]);
}
const sortedNames = Array.from(names).sort();
console.log('Total Unique Names:', sortedNames.length);
console.log('Sample Names:', JSON.stringify(sortedNames.slice(0, 50), null, 2));
