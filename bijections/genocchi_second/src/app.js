(function () {
  'use strict';
  const B = window.Bijection, V = window.GraphViews, $ = id => document.getElementById(id);
  const C = {ink:'#172642',blue:'#244fc1',pink:'#d22274',green:'#087f69',muted:'#8793aa',gold:'#ffd64e'};
  const names = {valley:'A new valley.',doublefall:'Choose below.',doublerise:'Choose above.',peak:'Two choices meet.',oddfix:'A fixed point.',evenfix:'A fixed point.'};
  let data = B.analyze(B.EXAMPLE), stage = 0, direction = 'encode', playing = false, timer = null, morphTimer = null;
  let cycleLinks = false, graphView = 'bipartite';
  const sub = x => String(x).replace(/[0-9-]/g, d => '₀₁₂₃₄₅₆₇₈₉₋'['0123456789-'.indexOf(d)]);
  const text = (x,y,value,attrs='') => `<text x="${x}" y="${y}" ${attrs}>${value}</text>`;
  const line = (x1,y1,x2,y2,attrs='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
  const circle = (x,y,r,attrs='') => `<circle cx="${x}" cy="${y}" r="${r}" ${attrs}/>`;
  const cycleString = cycles => cycles.map(c => `(${c.join(' ')})`).join(' ');
  function current() { return stage > 0 ? data.history[Math.min(stage,data.permutation.length) - 1] : null; }
  function pause() { playing=false; clearTimeout(timer); timer=null; $('play').innerHTML='▶ <span>Play</span>'; $('play').setAttribute('aria-label','Play animation'); }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!playing) return;
      if (stage >= data.permutation.length + 1) { pause(); return; }
      go(stage + 1,true);
      if (stage >= data.permutation.length + 1) pause(); else schedule();
    },Number($('speed').value));
  }
  function play() {
    if (playing) { pause(); return; }
    if (stage >= data.permutation.length + 1) go(0,false);
    playing=true; $('play').innerHTML='Ⅱ <span>Pause</span>'; $('play').setAttribute('aria-label','Pause animation');
    go(stage+1,true); schedule();
  }
  function go(value, animate=false) {
    clearTimeout(morphTimer);
    stage = Math.max(0,Math.min(data.permutation.length+1,value));
    render(animate);
  }
  function load(values) {
    pause(); data = B.analyze(values); stage=0; render(false);
  }
  function permutation() {
    const state = current(), values = direction === 'encode' ? data.permutation : (state ? state.partial.slice(1) : data.permutation.map(() => 0));
    const indices = data.permutation.map((_,j) => j+1);
    $('permutation').innerHTML = `<table class="perm-table" aria-label="Permutation in two-line notation"><tbody><tr>${indices.map(i=>`<td class="${i===stage?'active':''}">${i}</td>`).join('')}</tr><tr>${values.map((v,j)=>`<td class="${j+1===stage?'active':''} ${!v?'unknown':''}">${v||'·'}</td>`).join('')}</tr></tbody></table>`;
    $('cycleLabel').textContent = direction === 'encode' ? 'CYCLE DECOMPOSITION' : 'CYCLES RECONSTRUCTED';
    $('cycleText').textContent = cycleString(direction==='encode'?data.cycles:(state?.cycles||[])) || '—';
  }
  function geometry() {
    const n=data.permutation.length, max=Math.max(...data.heights,3);
    const dx=Math.min(58,804/n), start=(920-n*dx)/2;
    const dy=Math.min(37,170/max), baseline=206;
    return {n,max,dx,start,dy,baseline,x:i=>start+i*dx,y:h=>baseline-h*dy};
  }
  function pathDrawing(animate=false,flatten=false) {
    const {n,max,dx,x,y}=geometry(), ending=stage===n+1, visible=Math.min(stage,n);
    const full = direction==='decode' || ending;
    let out='';
    // A quiet lattice supports exact heights and rank/height comparisons.
    for(let h=-1;h<=max;h++) {
      out+=line(x(0)-10,y(h),x(n)+12,y(h),`class="${h===0?'baseline':'path-grid'}"`);
      out+=text(x(0)-25,y(h)+5,h,`text-anchor="middle" font-size="14" style="fill:${h===-1?C.pink:C.muted}"`);
      for(let i=0;i<=n;i++) out+=circle(x(i),y(h),1.6,'fill="#dce3ef"');
    }
    if(ending) {
      for(const s of data.schroeder) {
        if(s.step==='L') {
          out+=`<path d="M ${x(s.x)} ${y(0)} L ${x(s.x+1)} ${y(-1)} L ${x(s.x+2)} ${y(0)}" fill="none" stroke="${C.pink}" stroke-width="2" stroke-dasharray="4 5" opacity=".3"/>`;
          out+=`<path class="end-dip" d="M ${x(s.x)} ${y(0)} L ${x(s.x+1)} ${y(flatten?0:-1)} L ${x(s.x+2)} ${y(0)}" fill="none" stroke="${C.green}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
          out+=text(x(s.x+1),y(0)-14,'(0,0)',`text-anchor="middle" font-size="14" style="fill:${C.green}"`);
        } else {
          out+=line(x(s.x),y(s.h),x(s.x+1),y(s.end),'class="path-edge"');
          out+=text(x(s.x+.5),y(Math.max(s.h,s.end))-13,`(${s.label.join(',')})`,`text-anchor="middle" font-size="14" style="fill:${C.blue}"`);
        }
      }
    } else {
      for(let i=1;i<=n;i++) {
        if(i>visible && !full) continue;
        const active=i===stage, future=i>visible;
        out+=line(x(i-1),y(data.heights[i-1]),x(i),y(data.heights[i]),`pathLength="1" class="path-edge ${active?'new-edge':''} ${active&&animate?'draw-path':''}" opacity="${future?.2:1}"`);
        out+=circle(x(i),y(data.heights[i]),active?5.2:3.2,`fill="${active?C.pink:future?'#ccd5ea':C.blue}"`);
        out+=text(x(i-.5),y(Math.max(data.heights[i-1],data.heights[i]))-13,`(${data.labels[i-1].join(',')})`,`text-anchor="middle" font-size="14" opacity="${future?.4:1}" style="fill:${active?C.pink:C.blue}"`);
      }
      if(stage===0 && direction==='encode') {
        out+=text(460,71,'Read the values 1, 2, …, 2n',`font-size="24" text-anchor="middle" style="fill:${C.blue}"`);
        out+=text(460,106,'An even preimage rises. An odd preimage falls.',`font-size="18" text-anchor="middle" style="fill:${C.muted}"`);
      }
    }
    out+=circle(x(0),y(0),4,`fill="${C.blue}"`);
    for(let i=0;i<=n;i++) out+=text(x(i),276,i,`text-anchor="middle" font-size="14" style="fill:${i===stage?C.pink:C.muted}"`);
    $('path').innerHTML=out;
    $('path').setAttribute('aria-label',ending?`Labeled 0-Schröder path with steps ${data.schroeder.map(s=>s.step).join(' ')}.`:`Almost-Dyck path at step ${visible}, height ${data.heights[visible]}.`);
    $('pathTitle').innerHTML=ending?'The labeled 0-Schröder path <i>ψ(ω)</i>':'The almost-Dyck path <i>ω</i>';
    $('heightBadge').textContent=ending?'length = '+n:`h${sub(visible)} = ${data.heights[visible]}`;
    if(ending && animate && !flatten && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Animate the dip vertex geometrically; labels stay attached to the level step.
      const nodes=Array.from($('path').querySelectorAll('.end-dip')), dips=data.schroeder.filter(s=>s.step==='L');
      let startTime;
      function frame(now) {
        if(stage!==n+1 || !nodes[0]?.isConnected) return;
        if(startTime===undefined) startTime=now;
        const t=Math.min(1,(now-startTime)/1100), eased=t*t*(3-2*t);
        nodes.forEach((node,j)=>{const s=dips[j];node.setAttribute('d',`M ${x(s.x)} ${y(0)} L ${x(s.x+1)} ${y(-1+eased)} L ${x(s.x+2)} ${y(0)}`);});
        if(t<1) requestAnimationFrame(frame);
      }
      morphTimer=setTimeout(()=>requestAnimationFrame(frame),250);
    }
  }
  function graphDrawing(animate=false) {
    $('graphView').value=graphView;
    $('linkToggle').hidden=graphView!=='bipartite';
    $('graphStats').hidden=graphView!=='arcs';
    if(graphView==='bipartite') {
      $('graph').setAttribute('viewBox','0 0 920 280');
      $('graphKey').innerHTML='<span class="ring"></span> free <span class="dot"></span> connected <span class="pink-stroke"></span> new';
      $('graphHint').textContent='Two rows; a solid arrow j → k′ means σ(j) = k. Ranks run left to right, starting at 0.';
      bipartiteDrawing(animate);return;
    }
    const state=current(),n=data.permutation.length,i=Math.min(stage,n),end=stage===n+1;
    const result=graphView==='laguerre'?V.laguerre(state,n,stage,animate):V.arcs(state,n,stage,animate);
    $('graph').innerHTML=result.markup;
    $('graph').setAttribute('viewBox',`0 0 920 ${result.height}`);
    $('graph').setAttribute('aria-label',result.aria);
    $('gamma').textContent=`${graphView==='laguerre'?'L':'A'}${sub(i)}`;
    $('freeInvariant').textContent=`f${sub(i)} = ⌈h${sub(i)} / 2⌉ = ${state?.top.length||0}`;
    $('invariantText').textContent=end?'every incoming and outgoing slot is filled':'unfilled incoming slots, and equally many outgoing slots';
    if(graphView==='laguerre') {
      $('graphKey').innerHTML='<span class="ring in-ring"></span> free in <span class="ring"></span> free out <span class="pink-stroke"></span> new';
      $('graphHint').textContent='One vertex per label; arrows j → k mean σ(j) = k. Isolated vertices are paths of length 0; fixed points are loops. Ranks follow vertex labels.';
    } else {
      $('graphKey').innerHTML='<span class="cycle-colors"></span> components <span class="pink-stroke"></span> new';
      $('graphHint').textContent='Above: rightward. Below: leftward. Fixed points have no arc (marked “fix”). Crossings and nestings below count only present arcs with four distinct endpoints.';
      const s=result.stats;
      $('graphStats').innerHTML=`<span><strong>Crossings</strong> upper ${s.upper.crossings} · lower ${s.lower.crossings}</span><span><strong>Nestings</strong> upper ${s.upper.nestings} · lower ${s.lower.nestings}</span>`;
    }
  }
  function bipartiteDrawing(animate=false) {
    const n=data.permutation.length,state=current(), i=Math.min(stage,n), end=stage===n+1;
    const dx=Math.min(58,770/Math.max(1,n-1)), start=(920-dx*(n-1))/2, x=j=>start+(j-1)*dx;
    const yt=81,yb=203;
    let out='<defs>'+[['arrow',C.ink],['arrow-new',C.pink],['arrow-link','#b2bdd0']].map(([id,color])=>`<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="${color}" stroke-width="1.8"/></marker>`).join('')+'</defs>';
    const newCycle=state?.newCycles.flat()||[];
    if(cycleLinks) for(let j=1;j<=i;j++) out+=line(x(j),yb-9,x(j),yt+9,`class="cycle-link" marker-end="url(#arrow-link)"`);
    // A slim highlighter traces the cycle that is completed at this stage.
    if(state && !end) for(const e of state.edges.filter(e=>newCycle.includes(e.from)))
      out+=line(x(e.from),yt,x(e.to),yb,'class="cycle-glow"');
    if(state) for(const e of state.edges) {
      const isNew=e.stage===stage;
      const vx=x(e.to)-x(e.from),vy=yb-yt,len=Math.hypot(vx,vy), pad=9;
      out+=line(x(e.from)+vx/len*pad,yt+vy/len*pad,x(e.to)-vx/len*pad,yb-vy/len*pad,
        `pathLength="1" class="graph-edge ${isNew?'new-edge':''} ${isNew&&animate?'draw-edge':''}" marker-end="url(#${isNew?'arrow-new':'arrow'})"`);
    }
    const tc=state?.topCandidates||[],bc=state?.bottomCandidates||[];
    for(let j=1;j<=n;j++) {
      const future=j>i,active=j===stage,freeTop=state?.top.includes(j),freeBottom=state?.bottom.includes(j);
      out+=text(x(j),30,j,`text-anchor="middle" font-size="18" style="fill:${future?'#c5cddd':active?C.pink:C.ink}"`);
      out+=text(x(j),265,`${j}′`,`text-anchor="middle" font-size="18" style="fill:${future?'#c5cddd':active?C.pink:C.ink}"`);
      if(future) {
        out+=circle(x(j),yt,4,'fill="#e4e9f2"');out+=circle(x(j),yb,4,'fill="#e4e9f2"');continue;
      }
      const cls=active&&animate?'class="arrive"':'';
      out+=circle(x(j),yt,6,`${cls} fill="${freeTop?'white':active?C.pink:C.ink}" stroke="${active?C.pink:freeTop?C.blue:C.ink}" stroke-width="2.4"`);
      out+=circle(x(j),yb,6,`${cls} fill="${freeBottom?'white':active?C.pink:C.ink}" stroke="${active?C.pink:freeBottom?C.blue:C.ink}" stroke-width="2.4"`);
      if(!end && state) {
        if(tc.includes(j)) out+=rank(x(j),51,tc.indexOf(j),state.label[0]===tc.indexOf(j),C.blue,animate);
        if(bc.includes(j)) out+=rank(x(j),230,bc.indexOf(j),state.label[1]===bc.indexOf(j),C.green,animate);
      }
    }
    if(i===0) out+=text(460,148,'Start with no edges. Every connection will be determined.',`text-anchor="middle" font-size="19" style="fill:${C.muted}"`);
    $('graph').innerHTML=out;
    $('graph').setAttribute('aria-label',`Bipartite graph after step ${i}. ${state?.edges.length||0} edges, ${state?.top.length||0} free vertices per row. New edges: ${state?.added.map(e=>`${e.from} to ${e.to} prime`).join(', ')||'none'}.`);
    $('gamma').textContent=`Γ${sub(i)}`;
    $('freeInvariant').textContent=`f${sub(i)} = ⌈h${sub(i)} / 2⌉ = ${state?.top.length||0}`;
    $('invariantText').textContent=end?'every vertex is now connected':'free vertices on each row, after this step';
  }
  function rank(x,y,value,selected,color,animate) {
    return `<g ${animate?'class="show-rank"':''}><rect x="${x-10}" y="${y-12}" width="20" height="20" rx="4" fill="${selected?color:'white'}" stroke="${color}" stroke-width="${selected?1.7:1}"/>${text(x,y+3,value,`class="rank" text-anchor="middle" font-size="12" style="fill:${selected?'white':color}"`)}</g>`;
  }
  function choice(label,candidates,selected,row,state) {
    if(!candidates.length) return '';
    const top=row==='top';
    const bipartite=graphView==='bipartite',prime=bipartite&&!top?'′':'';
    return `<div class="choice ${row}"><div class="choice-title ${row}"><span>${bipartite?(top?'Top':'Bottom'):(top?'Outgoing':'Incoming')} candidates</span><span class="math">${label} = ${selected}</span></div><div class="chips">${candidates.map((v,k)=>`<span class="chip ${k===selected?'selected':''}"><small>rank ${k}</small><strong>${v}${prime}</strong></span>`).join('')}</div><div class="choice-caption">${candidates.includes(state.i)?`Include the new vertex ${state.i}${prime} as the last candidate.`:'Previously free slots, ordered by vertex label.'}</div></div>`;
  }
  function explain() {
    const n=data.permutation.length,state=current(), ending=stage===n+1;
    $('cycleEvent').hidden=true;
    if(stage===0) {
      $('stepLabel').textContent=direction==='encode'?'THE FORWARD MAP':'THE INVERSE MAP';
      $('phaseLabel').textContent=direction==='encode'?'σ → (ω, ξ)':'(ω, ξ) → σ';
      $('stepTitle').textContent=direction==='encode'?'One step. A pair of choices.':'The labels remember.';
      $('stepMath').innerHTML='<span class="pink">σ</span> ↔ (ω, ξ)';
      $('stepDescription').textContent=direction==='encode'?'Read the values in order. A path records the parity of each preimage; two labels remember which free vertices are joined.':'Read the same path and labels from left to right. They determine every edge, reconstructing the permutation without looking at it.';
      $('choicePanel').innerHTML=`<div class="choice"><div class="choice-title top"><span>ξ′ chooses ${graphView==='bipartite'?'a top vertex':'a free outgoing slot'}</span></div><div class="choice-title bottom" style="margin-top:12px"><span>ξ″ chooses ${graphView==='bipartite'?'a bottom vertex':'a free incoming slot'}</span></div><p>Ranks begin at <strong>0</strong>.<br>Pink shows what is added next.</p></div>`;
      $('stepFootnote').textContent='Press Play, or use the arrow keys to move through the construction at your own pace.';
      return;
    }
    if(ending) {
      const dips=data.schroeder.filter(s=>s.step==='L');
      $('stepLabel').textContent='THE FINAL BIJECTION';$('phaseLabel').textContent='ψ(ω)';
      $('stepTitle').textContent=dips.length?'Straighten the dips.':'Already a Dyck path.';
      $('stepMath').innerHTML=dips.length?'0 ↘ −1 ↗ 0 <span class="pink">→</span> 0 ⟶ 0':'ω = ψ(ω)';
      $('stepDescription').textContent=dips.length?`Each dip below zero represents two consecutive fixed points. Flatten it into a horizontal step of length 2 with the single label (0, 0). Here: ${dips.map(s=>s.indices.join(' & ')).join('; ')}.`:'This example never goes below zero, so no flattening is needed. Its almost-Dyck path is already a 0-Schröder path.';
      $('choicePanel').innerHTML=`<div class="choice"><div class="choice-title top">A complete labeled 0-Schröder path</div><p>Only height 0 permits horizontal steps. Reversing the flattening restores the two zero-labeled steps.</p></div>`;
      $('cycleEvent').hidden=false;
      $('cycleEvent').innerHTML=`${data.cycles.length} cycles recovered<br><span class="math">${cycleString(data.cycles)}</span>`;
      $('stepFootnote').textContent='The path and its labels determine one unique D-permutation. Switch direction above to watch the inverse construction.';
      return;
    }
    const {i,step,label:[a,b],type,topBefore,bottomBefore}=state;
    $('stepLabel').textContent=`STEP ${String(i).padStart(2,'0')} / ${n}`;
    $('phaseLabel').textContent=step==='U'?'RISE ↗':'FALL ↘';
    $('stepTitle').textContent=names[type];
    const inverse=data.inverse[i-1],first=direction==='encode'?`σ⁻¹(${i}) = ${inverse} <span class="pink">${step==='U'?'↗':'↘'}</span>`:`h${sub(i-1)} = ${state.before} <span class="pink">${step==='U'?'↗':'↘'}</span> ${state.height}`;
    $('stepMath').innerHTML=`${first}<br><span style="font-size:25px">ξ${sub(i)} = (<span style="color:${C.blue};${state.topCandidates.length?'text-decoration:underline;text-underline-offset:5px':''}">${a}</span>, <span style="color:${C.green};${state.bottomCandidates.length?'text-decoration:underline;text-underline-offset:5px':''}">${b}</span>)</span>`;
    const descriptions={
      valley:`Add ${i} and ${i}′, leaving both free. No connection is made, so both labels are zero. This is a cycle valley.`,
      doublefall:`Connect ${i} to the bottom vertex of rank ${b}: ${bottomBefore[b]}′. The new bottom vertex ${i}′ stays free. This is a cycle double fall.`,
      doublerise:`Connect the top vertex of rank ${a}, namely ${topBefore[a]}, to ${i}′. The new top vertex ${i} stays free. This is a cycle double rise.`,
      oddfix:`Rank ${a} selects the new top vertex ${i} itself. Join ${i} to ${i}′: an odd fixed point. Previously free vertices stay free.`,
      evenfix:`Rank ${b} selects the new bottom vertex ${i}′ itself. Join ${i} to ${i}′: an even fixed point. Previously free vertices stay free.`,
      peak:`Join ${topBefore[a]} → ${i}′ using top rank ${a}, and ${i} → ${bottomBefore[b]}′ using bottom rank ${b}. A cycle peak consumes one old free vertex on each row.`
    };
    const singleDescriptions={
      valley:`Add vertex ${i}, with both its incoming and outgoing slots free. It is an isolated vertex for now: a cycle valley. Both labels are zero.`,
      doublefall:`Connect ${i} → ${bottomBefore[b]}, selecting incoming rank ${b}. Vertex ${i} still has no incoming edge. This is a cycle double fall.`,
      doublerise:`Connect ${topBefore[a]} → ${i}, selecting outgoing rank ${a}. Vertex ${i} still has no outgoing edge. This is a cycle double rise.`,
      oddfix:`Outgoing rank ${a} selects ${i} itself: σ(${i}) = ${i}, an odd fixed point. ${graphView==='laguerre'?'Draw a loop.':'As in Figure 1, draw no arc.'}`,
      evenfix:`Incoming rank ${b} selects ${i} itself: σ(${i}) = ${i}, an even fixed point. ${graphView==='laguerre'?'Draw a loop.':'As in Figure 1, draw no arc.'}`,
      peak:`Add ${topBefore[a]} → ${i} using outgoing rank ${a}, and ${i} → ${bottomBefore[b]} using incoming rank ${b}. This cycle peak consumes one old free slot of each kind.`
    };
    $('stepDescription').textContent=(graphView==='bipartite'?descriptions:singleDescriptions)[type];
    $('choicePanel').innerHTML=choice('ξ′',state.topCandidates,a,'top',state)+choice('ξ″',state.bottomCandidates,b,'bottom',state);
    if(state.newCycles.length) {
      $('cycleEvent').hidden=false;
      $('cycleEvent').innerHTML=`${type==='peak'?'A cycle closes!':'One singleton cycle.'}<br><span class="math">${cycleString(state.newCycles)}</span>${type==='peak'?'<br>The chosen endpoints belonged to the same open chain.':''}`;
    } else if(type==='peak') {
      $('cycleEvent').hidden=false;$('cycleEvent').innerHTML='Two open chains merge.<br>This peak does not close a cycle.';
    }
    $('stepFootnote').textContent=direction==='encode'?`The preimage ${inverse} is ${inverse%2?'odd, so the path falls':'even, so the path rises'}. Underlined label entries select connections; an unused entry is 0.`:`At incoming height ${state.before}, the allowed labels are ξ′ ∈ {0${state.bounds[0]?`, …, ${state.bounds[0]}`:''}} and ξ″ ∈ {0${state.bounds[1]?`, …, ${state.bounds[1]}`:''}}. No other information is used.`;
  }
  function controls() {
    const n=data.permutation.length;
    $('scrubber').max=n+1;$('scrubber').value=stage;
    $('scrubber').setAttribute('aria-valuetext',stage===n+1?'Schröder conversion':`Step ${stage} of ${n}`);
    $('progressText').textContent=stage===n+1?'Final · Schröder path':stage===0?`Start · 0 / ${n}`:`Construction · ${stage} / ${n}`;
    $('previous').disabled=stage===0;$('next').disabled=stage===n+1;
    $('milestones').innerHTML=Array.from({length:n+2},(_,i)=>`<button data-stage="${i}" class="${i===stage?'current':''}" aria-label="${i===n+1?'Schröder conversion':`Step ${i}`}" ${i===stage?'aria-current="step"':''}>${i===n+1?'ψ':i}</button>`).join('');
    $('encode').setAttribute('aria-pressed',direction==='encode');$('decode').setAttribute('aria-pressed',direction==='decode');
  }
  function render(animate=false) {
    permutation();pathDrawing(animate,stage===data.permutation.length+1 && (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches));graphDrawing(animate);explain();controls();
  }
  function setDirection(value) { pause();direction=value;go(0,false); }
  function chooseExample(value) {
    $('customForm').hidden=value!=='custom';$('newRandom').hidden=value!=='random';
    if(value==='figure') load(B.EXAMPLE);
    else if(value==='small') load([3,1,4,2]);
    else if(value==='fixed') load([1,2,3,4,5,6]);
    else if(value==='random') load(B.random(14));
    else {$('customInput').focus(); pause();}
  }
  function present() {
    const enabled=!document.body.classList.contains('present');
    document.body.classList.toggle('present',enabled);
    if(enabled && !document.fullscreenElement && document.documentElement.requestFullscreen)
      document.documentElement.requestFullscreen().catch(()=>{});
    else if(!enabled && document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    $('fullscreen').innerHTML=enabled?'Exit <span aria-hidden="true">⛶</span>':'Present <span aria-hidden="true">⛶</span>';
  }
  $('play').addEventListener('click',play);
  $('next').addEventListener('click',()=>{pause();go(stage+1,true);});
  $('previous').addEventListener('click',()=>{pause();go(stage-1,false);});
  $('restart').addEventListener('click',()=>{pause();go(0,false);});
  $('scrubber').addEventListener('input',e=>{pause();go(Number(e.target.value),false);});
  $('milestones').addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(b){pause();go(Number(b.dataset.stage),true);}});
  $('speed').addEventListener('change',()=>{if(playing)schedule();});
  $('encode').addEventListener('click',()=>setDirection('encode'));
  $('decode').addEventListener('click',()=>setDirection('decode'));
  $('example').addEventListener('change',e=>chooseExample(e.target.value));
  $('newRandom').addEventListener('click',()=>load(B.random(14)));
  $('links').addEventListener('change',e=>{cycleLinks=e.target.checked;graphDrawing(false);});
  $('graphView').addEventListener('change',e=>{
    if(!['bipartite','laguerre','arcs'].includes(e.target.value))return;
    graphView=e.target.value;graphDrawing(false);explain();
  });
  $('finish').addEventListener('click',()=>{pause();go(data.permutation.length+1,true);});
  $('fullscreen').addEventListener('click',present);
  document.addEventListener('fullscreenchange',()=>{
    if(!document.fullscreenElement){document.body.classList.remove('present');$('fullscreen').innerHTML='Present <span aria-hidden="true">⛶</span>';}
  });
  $('customForm').addEventListener('submit',e=>{
    e.preventDefault();
    try {
      const raw=$('customInput').value.trim();
      if(!/^[\d\s,;]+$/.test(raw)) throw new Error('Enter integers separated by spaces or commas.');
      const values=raw.split(/[\s,;]+/).filter(Boolean).map(Number);
      if(values.length>20) throw new Error('Use at most 20 entries so the diagram stays readable.');
      B.validate(values);load(values);$('customError').textContent='';
    }catch(error){$('customError').textContent=error.message;}
  });
  document.addEventListener('keydown',e=>{
    if(e.target.closest('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey)return;
    if(e.key===' '){if(e.target.closest('button,summary'))return;e.preventDefault();play();}
    else if(e.key==='ArrowRight'){e.preventDefault();pause();go(stage+1,true);}
    else if(e.key==='ArrowLeft'){e.preventDefault();pause();go(stage-1,false);}
    else if(e.key==='Home'){e.preventDefault();pause();go(0,false);}
    else if(e.key==='End'){e.preventDefault();pause();go(data.permutation.length+1,true);}
    else if(e.key.toLowerCase()==='f'){e.preventDefault();present();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  render(false);
})();
