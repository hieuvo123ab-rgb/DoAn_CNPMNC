const fs = require('fs');
let c = fs.readFileSync('deploy/team-preview/nginx.conf', 'utf8').replace(/\r\n/g, '\n');
const target = 'proxy_set_header Host $host;\n';
const replacement = 'proxy_set_header Host $host;\n            proxy_set_header Origin "";\n';
c = c.replaceAll(target, replacement);
fs.writeFileSync('deploy/team-preview/nginx.conf', c, 'utf8');
console.log('Successfully patched all occurrences in nginx.conf');
