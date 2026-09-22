'use strict';
const assert = require('node:assert/strict');
const B = require('../src/model.js');
const example=B.analyze(B.EXAMPLE);
assert.deepEqual(example.labels,[[0,0],[0,0],[0,0],[0,0],[2,0],[0,1],[0,0],[1,1],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]);
assert.deepEqual(example.heights,[0,1,2,3,4,3,4,3,2,1,0,-1,0,1,0]);
assert.deepEqual(example.cycles,[[1,7,8,6,4,2],[3,9,10],[5],[11],[12],[13,14]]);
assert.deepEqual(example.schroeder.filter(s=>s.step==='L').map(s=>s.indices),[[11,12]]);
function verify(p) {
  const f=B.forward(p), result=B.inverse(f.steps,f.labels);
  assert.deepEqual(result.permutation,p);
  result.history.forEach(s=>{
    // Compare the reconstructed prefix to the induced graph of the input.
    const expected=p.flatMap((v,j)=>j+1<=s.i && v<=s.i?[[j+1,v]]:[]);
    assert.deepEqual(s.edges.map(e=>[e.from,e.to]).sort((a,b)=>a[0]-b[0]),expected);
    assert.equal(s.top.length,Math.max(0,Math.ceil(s.height/2)));
    assert.equal(s.bottom.length,s.top.length);
    const actualCycles=B.cyclesOf([0,...p]).filter(c=>Math.max(...c)<=s.i);
    assert.deepEqual(s.cycles,actualCycles);
  });
  // Expand each Schröder level step back to the two original steps/labels.
  const compressed=B.schroeder(f.steps,f.labels);
  assert.deepEqual(compressed.flatMap(s=>s.step==='L'?['D','U']:[s.step]),f.steps);
  assert.deepEqual(compressed.flatMap(s=>s.step==='L'?[[0,0],[0,0]]:[s.label]),f.labels);
}
verify(B.EXAMPLE);
function enumerate(n) {
  let count=0;
  const visit=(p,used)=>{
    if(p.length===n){verify(p);count++;return;}
    const i=p.length+1;
    for(let v=1;v<=n;v++) if(!used.has(v) && (i%2?v>=i:v<=i)) {
      used.add(v);visit([...p,v],used);used.delete(v);
    }
  };
  visit([],new Set());return count;
}
assert.deepEqual([2,4,6,8].map(enumerate),[2,8,56,608]);
// Independently enumerate all legal labeled histories through length 8.
// This verifies surjectivity as well as the forward/inverse round trip.
function histories(n) {
  let count=0;const seen=new Set();
  function visit(h,steps,labels){
    if(steps.length===n){
      if(h!==0)return;
      const p=B.inverse(steps,labels).permutation,f=B.forward(p);
      assert.deepEqual(f.steps,steps);assert.deepEqual(f.labels,labels);
      const key=p.join(',');assert(!seen.has(key));seen.add(key);count++;return;
    }
    const remain=n-steps.length-1;
    for(const s of ['U','D']) {
      const after=h+(s==='U'?1:-1);
      if(after < -1 || Math.abs(after)>remain)continue;
      const [a,b]=B.allowed(h,s);
      for(let l=0;l<=a;l++)for(let m=0;m<=b;m++)visit(after,[...steps,s],[...labels,[l,m]]);
    }
  }
  visit(0,[],[]);return count;
}
assert.deepEqual([2,4,6,8].map(histories),[2,8,56,608]);
let seed=12345;
const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
for(let j=0;j<300;j++)verify(B.random(2+2*(j%10),rng));
assert.throws(()=>B.validate([2,2]));assert.throws(()=>B.validate([1,3,2,4]));
assert.throws(()=>B.inverse(['D','D'],[[0,0],[0,0]]));
assert.throws(()=>B.inverse(['U','D'],[[0,0],[1,0]]));
console.log('PASS: Figure 11; all 674 D-permutations and all 674 labeled histories through size 8; 300 generated examples through size 20; invalid inputs.');
