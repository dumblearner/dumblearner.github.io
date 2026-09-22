/* Node.js, no packages required. Rebuilds the fully self-contained webpage. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,'src',name),'utf8');
let html = read('template.html');
for (const [tag,file] of [['STYLE','style.css'],['MODEL','model.js'],['VIEWS','views.js'],['APP','app.js']])
  html = html.replace(`/*__${tag}__*/`, () => read(file));
fs.writeFileSync(path.join(__dirname,'index.html'),html);
console.log('Built index.html — all CSS and JavaScript embedded; no network dependencies.');
