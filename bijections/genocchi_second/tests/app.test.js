/* Interaction smoke checks. This minimal DOM fixture is deliberately not a
 * rendering engine; it does not verify browser layout, SVG paint, or animation.
 * No test dependencies are required.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const B=require('../src/model.js');
const V=require('../src/views.js');
const src=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const elements=new Map(),listeners=new Map(),timers=new Map();let nextTimer=0;
function classes(){const s=new Set();return {contains:x=>s.has(x),add:x=>s.add(x),remove:x=>s.delete(x),toggle:(x,v)=>{if(v===undefined)v=!s.has(x);v?s.add(x):s.delete(x);return v;}};}
class Element {
  constructor(id,tag){this.id=id;this.tagName=tag.toUpperCase();this.value='';this.innerHTML='';this.textContent='';this.hidden=false;this.checked=false;this.disabled=false;this.attrs={};this.handlers={};this.classList=classes();}
  setAttribute(k,v){this.attrs[k]=String(v);}
  addEventListener(k,f){this.handlers[k]=f;}
  querySelectorAll(){return [];}
  focus(){}
  closest(selector){return selector.split(',').includes(this.tagName.toLowerCase())?this:null;}
  emit(type){this.handlers[type]?.({target:this,preventDefault(){}});}
}
for(const m of src('template.html').matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/g))elements.set(m[2],new Element(m[2],m[1]));
const el=id=>{assert(elements.has(id),`Unknown element #${id}`);return elements.get(id);};
el('speed').value='3600';
const document={getElementById:el,body:{classList:classes()},documentElement:{},fullscreenElement:null,hidden:false,addEventListener:(k,f)=>listeners.set(k,f)};
const context=vm.createContext({window:{Bijection:B,GraphViews:V},document,console,matchMedia:()=>({matches:true}),setTimeout:f=>{const id=++nextTimer;timers.set(id,f);return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:()=>0});
vm.runInContext(src('app.js'),context,{filename:'app.js'});
const click=id=>el(id).emit('click');
const select=(id,value)=>{el(id).value=value;el(id).emit('change');};
const scrub=i=>{el('scrubber').value=String(i);el('scrubber').emit('input');};
assert.equal(el('scrubber').value,0);
assert.equal(el('previous').disabled,true);
assert.match(el('permutation').innerHTML,/>14</);
for(let i=1;i<=14;i++){
  click('next');
  assert.equal(el('scrubber').value,i);
  assert.equal(el('gamma').textContent,'Γ'+String(i).replace(/\d/g,x=>'₀₁₂₃₄₅₆₇₈₉'[+x]));
  assert(!/undefined|NaN/.test(el('graph').innerHTML+el('path').innerHTML+el('stepDescription').textContent));
}
click('next');assert.equal(el('next').disabled,true);assert.match(el('pathTitle').innerHTML,/Schröder/);
assert.match(el('stepDescription').textContent,/11 & 12/);
click('decode');assert.equal(el('scrubber').value,0);assert.match(el('permutation').innerHTML,/unknown/);
scrub(8);assert.match(el('cycleText').textContent,/\(1 7 8 6 4 2\)/);
assert.match(el('stepDescription').textContent,/7 → 8′/);
assert.match(el('stepDescription').textContent,/8 → 6′/);
assert.equal(el('stepTitle').textContent,'Two choices meet.');
click('finish');assert(!el('permutation').innerHTML.includes('unknown'));
assert.match(el('cycleText').textContent,/\(13 14\)/);
el('links').checked=true;el('links').emit('change');assert.match(el('graph').innerHTML,/class="cycle-link"/);
select('example','fixed');click('finish');assert.equal((el('path').innerHTML.match(/class="end-dip"/g)||[]).length,3);
select('example','small');click('finish');assert.equal(el('stepTitle').textContent,'Already a Dyck path.');
select('example','custom');assert.equal(el('customForm').hidden,false);
el('customInput').value='1 3 2 4';el('customForm').emit('submit');assert.match(el('customError').textContent,/position 2/);
el('customInput').value='3, 1, 4, 2';el('customForm').emit('submit');assert.equal(el('customError').textContent,'');assert.equal(el('scrubber').max,5);
el('customInput').value=Array.from({length:20},(_,i)=>i+1).join(' ');el('customForm').emit('submit');click('finish');assert.equal(el('scrubber').value,21);
assert(!/undefined|NaN/.test(el('graph').innerHTML+el('path').innerHTML));
select('example','random');assert.equal(el('scrubber').max,15);click('newRandom');assert.equal(el('scrubber').value,0);
select('example','figure');click('play');assert.equal(el('scrubber').value,1);assert.match(el('play').innerHTML,/Pause/);
const tick=[...timers.entries()][0];timers.delete(tick[0]);tick[1]();assert.equal(el('scrubber').value,2);
click('play');assert.equal(timers.size,0);
const key=(k,target=new Element('body','body'))=>listeners.get('keydown')({key:k,target,preventDefault(){}});
key('ArrowRight',el('next'));assert.equal(el('scrubber').value,3);
key('Home');assert.equal(el('scrubber').value,0);
key('End');assert.equal(el('scrubber').value,15);
key('ArrowLeft',el('customInput'));assert.equal(el('scrubber').value,15);
click('fullscreen');assert(document.body.classList.contains('present'));click('fullscreen');assert(!document.body.classList.contains('present'));
// Changing view preserves the current construction, direction and playback.
scrub(8);const unchangedPath=el('path').innerHTML,unchangedPermutation=el('permutation').innerHTML;
select('graphView','laguerre');
assert.equal(el('scrubber').value,8);assert.equal(el('path').innerHTML,unchangedPath);assert.equal(el('permutation').innerHTML,unchangedPermutation);
assert.match(el('graph').attrs['aria-label'],/Laguerre/);assert.equal(el('linkToggle').hidden,true);
assert.match(el('graph').innerHTML,/data-component="cycle"/);assert.match(el('stepDescription').textContent,/7 → 8 using outgoing rank 1/);
assert(!el('choicePanel').innerHTML.includes('6′'));
select('graphView','arcs');assert.equal(el('graphStats').hidden,false);assert.match(el('graphStats').innerHTML,/Crossings/);
assert.match(el('graph').attrs['aria-label'],/Crossing and nesting/);
scrub(5);assert.match(el('stepDescription').textContent,/draw no arc/);assert.match(el('graph').innerHTML,/data-fixed="5"/);
select('graphView','laguerre');assert.match(el('stepDescription').textContent,/Draw a loop/);
select('graphView','bipartite');assert.equal(el('linkToggle').hidden,false);assert.equal(el('graphStats').hidden,true);assert.match(el('graph').innerHTML,/class="cycle-link"/);
click('restart');click('play');select('graphView','laguerre');assert.match(el('play').innerHTML,/Pause/);assert.equal(timers.size,1);click('play');
for(const mode of ['bipartite','laguerre','arcs']) {
  select('graphView',mode);
  for(let i=0;i<=15;i++){scrub(i);assert(!/undefined|NaN/.test(el('graph').innerHTML+el('stepDescription').textContent));}
  select('example','fixed');click('finish');assert.equal(el('graphView').value,mode);
  select('example','figure');
}
console.log('PASS: page initialization, all 14 stages, inverse disclosure, cycle links, Schröder conversion, example switching, validation, 20-entry input, playback/pause, keyboard controls, presentation layout. (DOM fixture; not a browser rendering test.)');
console.log('PASS: all three graph views at every stage, view changes during playback, preserved timeline/inverse state, contextual explanations and cycle-link controls.');
