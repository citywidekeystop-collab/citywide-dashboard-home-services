// Apply the shared conversion configuration to existing large static landing pages.
const fs = require('node:fs');
const path = require('node:path');
const pages = ['index.html','city.html','commercial-mag-lock.html','baltimore-car-lockout.html','parkville/index.html','perry-hall/index.html','white-marsh/index.html','essex/index.html'];
for (const page of pages) {
  const file = path.join(__dirname, '..', 'public', page);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, script => /gtag|citywide-tracking\.js/.test(script) ? '' : script);
  if (!html.includes('</head>')) throw new Error('Missing head: ' + page);
  html = html.replace('</head>', '<script async src="https://www.googletagmanager.com/gtag/js?id=AW-16693027016"></script><script src="/citywide-tracking.js?v=20261104" defer></script></head>');
  fs.writeFileSync(file, html);
}
console.log('Prepared Google Ads tracking on ' + pages.length + ' landing pages.');
