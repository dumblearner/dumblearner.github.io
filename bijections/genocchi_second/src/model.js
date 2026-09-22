/* Section 7 of Deb–Sokal, arXiv:2212.07232v1.
 * Pure, dependency-free mathematics. Arrays are 1-indexed internally.
 * Both directions are implemented independently; the inverse uses only
 * the step word and labels, never the original permutation.
 */
(function (root) {
  'use strict';
  const EXAMPLE = [7, 1, 9, 2, 5, 4, 8, 6, 10, 3, 11, 12, 14, 13];
  function validate(values) {
    if (!Array.isArray(values) || values.length < 2 || values.length % 2)
      throw new Error('Use an even number of entries (at least 2).');
    const n = values.length;
    if (values.some(v => !Number.isInteger(v) || v < 1 || v > n) || new Set(values).size !== n)
      throw new Error(`Use each integer from 1 to ${n} exactly once.`);
    values.forEach((v, j) => {
      const i = j + 1;
      if ((i % 2 && v < i) || (!(i % 2) && v > i))
        throw new Error(`At position ${i}, σ(${i}) = ${v} must be ${i % 2 ? '≥' : '≤'} ${i}.`);
    });
    return values;
  }
  function cyclesOf(p) {
    const seen = new Set(), cycles = [];
    for (let i = 1; i < p.length; i++) {
      if (seen.has(i)) continue;
      const chain = [], local = new Set();
      let j = i;
      while (j && !local.has(j) && !seen.has(j)) {
        chain.push(j); local.add(j); j = p[j];
      }
      if (j === i) cycles.push(chain);
      chain.forEach(x => seen.add(x));
    }
    return cycles;
  }
  function forward(values) {
    validate(values);
    const p = [0, ...values], n = values.length, inv = Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) inv[p[i]] = i;
    const steps = [], labels = [], heights = [0];
    for (let i = 1; i <= n; i++) {
      const up = inv[i] % 2 === 0;
      let a = 0, b = 0;
      // Equations (7.3) and (7.4), counted directly.
      for (let j = i + 1; j <= n; j++) {
        if (!up && inv[j] < inv[i] && inv[i] <= i) a++;
        if (i % 2 === 0 && p[j] < p[i] && p[i] <= i) b++;
      }
      steps.push(up ? 'U' : 'D'); labels.push([a, b]);
      heights.push(heights[i - 1] + (up ? 1 : -1));
    }
    return {permutation: values.slice(), inverse: inv.slice(1), steps, labels, heights};
  }
  function allowed(h, step) {
    if (step === 'U') return h % 2 === 0 ? [0, 0] : [0, (h + 1) / 2];
    return h % 2 === 0 ? [h / 2, 0] : [(h - 1) / 2, (h - 1) / 2];
  }
  function inverse(steps, labels) {
    const n = steps.length;
    if (!n || n % 2 || labels.length !== n) throw new Error('A history needs an even number of steps and one label pair per step.');
    let h = 0, top = [], bottom = [], edges = [];
    const p = Array(n + 1).fill(0), history = [];
    for (let z = 0; z < n; z++) {
      const i = z + 1, s = steps[z], pair = labels[z];
      if (s !== 'U' && s !== 'D') throw new Error('Steps must be U or D.');
      const bounds = allowed(h, s);
      if (!Array.isArray(pair) || pair.length !== 2 || pair.some((x,k) => !Number.isInteger(x) || x < 0 || x > bounds[k]))
        throw new Error(`Invalid label at step ${i}.`);
      const [a,b] = pair, before = h;
      h += s === 'U' ? 1 : -1;
      if (h < -1) throw new Error('The almost-Dyck path may not go below −1.');
      const topBefore = top.slice(), bottomBefore = bottom.slice(), added = [];
      const topCandidates = s === 'D' ? [...top, ...(i % 2 ? [i] : [])] : [];
      const bottomCandidates = i % 2 === 0 ? [...bottom, ...(s === 'U' ? [i] : [])] : [];
      top.push(i); bottom.push(i);
      const join = (from, to) => {
        if (!top.includes(from) || !bottom.includes(to)) throw new Error('A selected endpoint is not free.');
        const e = {from, to, stage:i}; added.push(e); edges.push(e); p[from] = to;
        top = top.filter(x => x !== from); bottom = bottom.filter(x => x !== to);
      };
      let type;
      if (s === 'U' && i % 2) type = 'valley';
      else if (s === 'U') {
        const j = bottomCandidates[b]; join(i, j);
        type = j === i ? 'evenfix' : 'doublefall';
      } else if (i % 2) {
        const j = topCandidates[a]; join(j, i);
        type = j === i ? 'oddfix' : 'doublerise';
      } else {
        join(i, bottomCandidates[b]); join(topCandidates[a], i); type = 'peak';
      }
      const cycles = cyclesOf(p);
      const newCycles = cycles.filter(c => c.includes(i));
      if (top.length !== Math.ceil(h / 2) || bottom.length !== top.length)
        throw new Error('Height/free-vertex invariant failed.');
      history.push({i, step:s, label:pair.slice(), bounds, before, height:h, type,
        topBefore, bottomBefore, topCandidates, bottomCandidates,
        top:top.slice(), bottom:bottom.slice(), edges:edges.slice(), added,
        partial:p.slice(), cycles, newCycles});
    }
    if (h !== 0 || top.length || bottom.length) throw new Error('The path must end at height 0.');
    validate(p.slice(1));
    return {permutation:p.slice(1), history};
  }
  function schroeder(steps, labels) {
    let h = 0;
    const out = [];
    for (let j = 0; j < steps.length; j++) {
      if (h === 0 && steps[j] === 'D' && steps[j + 1] === 'U') {
        out.push({step:'L', x:j, width:2, h:0, end:0, label:[0,0], indices:[j + 1,j + 2]}); j++;
      } else {
        const end = h + (steps[j] === 'U' ? 1 : -1);
        out.push({step:steps[j], x:j, width:1, h, end, label:labels[j].slice(), indices:[j + 1]}); h = end;
      }
    }
    return out;
  }
  function analyze(values) {
    const f = forward(values), back = inverse(f.steps,f.labels);
    return {...f, history:back.history, cycles:cyclesOf([0,...values]), schroeder:schroeder(f.steps,f.labels)};
  }
  // Generates legal labeled histories, then reconstructs. Not uniform over D-permutations.
  function random(n = 14, rng = Math.random) {
    if (n < 2 || n % 2) throw new Error('Use even length.');
    const steps = [], labels = []; let h = 0;
    for (let j = 0; j < n; j++) {
      const remaining = n - j - 1;
      const options = ['U','D'].filter(s => {
        const after = h + (s === 'U' ? 1 : -1);
        return after >= -1 && Math.abs(after) <= remaining;
      });
      const s = options[Math.floor(rng() * options.length)];
      const bounds = allowed(h,s);
      labels.push(bounds.map(max => Math.floor(rng() * (max + 1))));
      steps.push(s); h += s === 'U' ? 1 : -1;
    }
    return inverse(steps,labels).permutation;
  }
  // Identify the two copies of each vertex in the bipartite graph. The result
  // is a Laguerre digraph: every indegree and outdegree is at most one.
  // Only the visible prefix is used, never the unbuilt part of the permutation.
  function componentsOf(size, edges) {
    const next = Array(size + 1).fill(0), prev = Array(size + 1).fill(0), seen = new Set(), out = [];
    for (const e of edges) {
      if (e.from < 1 || e.from > size || e.to < 1 || e.to > size || next[e.from] || prev[e.to])
        throw new Error('Edges must form a Laguerre digraph on the visible vertices.');
      next[e.from] = e.to; prev[e.to] = e.from;
    }
    const walk = start => {
      const nodes=[]; let v=start;
      while (v && !seen.has(v)) {seen.add(v);nodes.push(v);v=next[v];}
      const closed=v===start;
      out.push({nodes,kind:closed?(nodes.length===1?'loop':'cycle'):(nodes.length===1?'isolated':'path'),closed});
    };
    for(let v=1;v<=size;v++) if(!prev[v] && !seen.has(v)) walk(v);
    for(let v=1;v<=size;v++) if(!seen.has(v)) walk(v);
    return out.sort((a,b)=>Math.min(...a.nodes)-Math.min(...b.nodes));
  }
  // Strict four-vertex crossings and nestings, as in §2.8 of Deb–Sokal.
  // Loops, shared endpoints (joinings), and pseudo-nestings are excluded.
  function arcStatistics(edges) {
    const result={upper:{crossings:0,nestings:0},lower:{crossings:0,nestings:0}};
    const arcs=edges.filter(e=>e.from!==e.to).map(e=>({a:Math.min(e.from,e.to),b:Math.max(e.from,e.to),side:e.from<e.to?'upper':'lower'}));
    for(let i=0;i<arcs.length;i++) for(let j=i+1;j<arcs.length;j++) {
      let x=arcs[i],y=arcs[j]; if(x.side!==y.side)continue;
      if(x.a>y.a)[x,y]=[y,x];
      if(x.a<y.a && y.a<x.b && x.b<y.b)result[x.side].crossings++;
      if(x.a<y.a && y.b<x.b)result[x.side].nestings++;
    }
    return result;
  }
  const api = {EXAMPLE, validate, forward, inverse, analyze, schroeder, cyclesOf, allowed, random, componentsOf, arcStatistics};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Bijection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
