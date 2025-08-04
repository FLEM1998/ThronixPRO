// Simple download helper
const fs = require('fs');
const path = require('path');

const files = [
  'thronixpro-everything.zip',
  'thronixpro-source-code.tar.gz',
  'thronixpro-part-aa',
  'thronixpro-part-ab', 
  'thronixpro-part-ac',
  'thronixpro-part-ad',
  'thronixpro-part-ae',
  'thronixpro-part-af',
  'thronixpro-part-ag'
];

console.log('Available ThronixPRO download files:');
files.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const size = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`✓ ${file} (${size}MB)`);
  } else {
    console.log(`✗ ${file} (not found)`);
  }
});

console.log('\nAccess downloads at: http://localhost:5000/downloads');
