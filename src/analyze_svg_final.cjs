const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const text = fs.readFileSync('c:/Users/M&MLG/Documents/GitHub/zepglide demo/world.svg', 'utf8');
const dom = new JSDOM(text, { contentType: 'image/svg+xml' });
const doc = dom.window.document;
const paths = doc.querySelectorAll('path');

const countryData = {};
paths.forEach(p => {
  const name = p.getAttribute('name') || p.getAttribute('class');
  if (name) {
    if (!countryData[name]) countryData[name] = 0;
    countryData[name]++;
  }
});

const sortedNames = Object.keys(countryData).sort();
console.log('Total Unique Countries:', sortedNames.length);
console.log('Sample Names (first 210):');
console.log(JSON.stringify(sortedNames, null, 2));
