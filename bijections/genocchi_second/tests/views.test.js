'use strict';
const assert=require('node:assert/strict');
const B=require('../src/model'),V=require('../src/views');
const es=pairs=>pairs.map(([from,to])=>({from,to,stage:Math.max(from,to)}));
assert.deepEqual(B.componentsOf(6,es([[4,2],[2,1],[3,3],[5,6],[6,5]])),[
  {nodes:[4,2,1],kind:'path',closed:false},{nodes:[3],kind:'loop',closed:true},{nodes:[5,6],kind:'cycle',closed:true}
]);
assert.deepEqual(B.componentsOf(1,[]),[{nodes:[1],kind:'isolated',closed:false}]);
assert.throws(()=>B.componentsOf(3,es([[1,2],[1,3]])));
assert.throws(()=>B.componentsOf(3,es([[1,3],[2,3]])));
assert.deepEqual(B.arcStatistics(es([[1,3],[2,4]])),{upper:{crossings:1,nestings:0},lower:{crossings:0,nestings:0}});
assert.deepEqual(B.arcStatistics(es([[4,1],[3,2]])),{upper:{crossings:0,nestings:0},lower:{crossings:0,nestings:1}});
assert.deepEqual(B.arcStatistics(es([[1,4],[2,3],[3,1],[4,2]])),{upper:{crossings:0,nestings:1},lower:{crossings:1,nestings:0}});
assert.deepEqual(B.arcStatistics(es([[1,2],[2,3],[4,4],[3,1]])),{upper:{crossings:0,nestings:0},lower:{crossings:0,nestings:0}});
function check(values){
  const a=B.analyze(values),total=values.length;
  for(const s of a.history){
    const c=B.componentsOf(s.i,s.edges),lg=V.laguerre(s,total,s.i),ar=V.arcs(s,total,s.i);
    assert.deepEqual(c.flatMap(c=>c.nodes).sort((a,b)=>a-b),Array.from({length:s.i},(_,j)=>j+1));
    assert.equal(c.filter(c=>!c.closed).length,s.top.length);
    assert.equal(c.filter(c=>c.closed).length,s.cycles.length);
    const rebuilt=[];
    for(const comp of c){
      for(let j=1;j<comp.nodes.length;j++)rebuilt.push([comp.nodes[j-1],comp.nodes[j]]);
      if(comp.closed)rebuilt.push([comp.nodes.at(-1),comp.nodes[0]]);
    }
    assert.deepEqual(rebuilt.sort((a,b)=>a[0]-b[0]),s.edges.map(e=>[e.from,e.to]).sort((a,b)=>a[0]-b[0]));
    for(const [markup,expected] of [[lg.markup,s.edges],[ar.markup,s.edges.filter(e=>e.from!==e.to)]]){
      const drawn=[...markup.matchAll(/data-edge="(\d+)-(\d+)"/g)].map(m=>[+m[1],+m[2]]).sort((a,b)=>a[0]-b[0]);
      assert.deepEqual(drawn,expected.map(e=>[e.from,e.to]).sort((a,b)=>a[0]-b[0]));
      assert(!/NaN|undefined/.test(markup));
    }
    for(const p of lg.nodes.values())assert(p.x>=14 && p.x<=906 && p.y>=14 && p.y<=lg.height-14);
    assert.equal((lg.markup.match(/data-free-in=/g)||[]).length,s.bottom.length);
    assert.equal((lg.markup.match(/data-free-out=/g)||[]).length,s.top.length);
    // Independent quadruple definition checks the reported statistics.
    const expect={upper:{crossings:0,nestings:0},lower:{crossings:0,nestings:0}},p=s.partial;
    for(let i=1;i<=s.i;i++)for(let j=i+1;j<=s.i;j++)for(let k=j+1;k<=s.i;k++)for(let l=k+1;l<=s.i;l++){
      if(p[i]===k&&p[j]===l)expect.upper.crossings++;
      if(p[i]===l&&p[j]===k)expect.upper.nestings++;
      if(p[k]===i&&p[l]===j)expect.lower.crossings++;
      if(p[l]===i&&p[k]===j)expect.lower.nestings++;
    }
    assert.deepEqual(ar.stats,expect);
  }
}
check(B.EXAMPLE);check(Array.from({length:20},(_,i)=>i+1));
check([3,1,5,2,7,4,9,6,11,8,13,10,15,12,17,14,19,16,20,18]);
let seed=6723;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<80;i++)check(B.random(2+2*(i%10),rng));
assert.equal(V.laguerre(null,14,0).components.length,0);assert(!V.arcs(null,14,0).markup.includes('data-edge='));
console.log('PASS: Laguerre components, degrees and free slots; exact visible edge sets; strict arc statistics against independent quadruple counts; layout bounds through size 20.');
