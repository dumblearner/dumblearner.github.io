/* Pure SVG renderers for two views of the same growing permutation.
 * Laguerre digraph definition: Deb, arXiv:2304.14487v2, §§1.1 and 6.2.
 * Arc conventions: Deb–Sokal, arXiv:2212.07232v1, Figure 1 and §2.8.
 * These views retain the original Section 7 chronological construction.
 */
(function(root){
  'use strict';
  const B = typeof module!=='undefined' && module.exports ? require('./model.js') : root.Bijection;
  const C={ink:'#172642',blue:'#244fc1',green:'#087f69',pink:'#d22274',muted:'#8793aa',gold:'#ffd64e'};
  const palette=['#244fc1','#087f69','#8650b9','#bc572b','#187fa0','#6a61a8','#ab4b34'];
  const num=x=>Number(x.toFixed(3));
  const text=(x,y,s,attrs='')=>`<text x="${num(x)}" y="${num(y)}" font-family="Georgia,serif" fill="${C.ink}" ${attrs}>${s}</text>`;
  const circle=(x,y,r,attrs='')=>`<circle cx="${num(x)}" cy="${num(y)}" r="${r}" ${attrs}/>`;
  const path=(d,attrs='')=>`<path d="${d}" ${attrs}/>`;
  function componentColors(comps){
    const colors=new Map();
    comps.forEach(c=>c.nodes.forEach(v=>colors.set(v,palette[Math.floor((Math.min(...c.nodes)-1)/2)%palette.length])));
    return colors;
  }
  const edgeKey=e=>`${e.from}-${e.to}`;
  function defs(){
    return '<defs>'+[...palette,C.pink,C.ink].map((color,i)=>`<marker id="view-arrow-${i}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="${color}" stroke-width="1.8"/></marker>`).join('')+'</defs>';
  }
  const marker=color=>`url(#view-arrow-${[...palette,C.pink,C.ink].indexOf(color)})`;
  function edge(d,e,color,stage,animate,gold=false,arrows=true){
    const fresh=e.stage===stage;
    return (gold?path(d,`fill="none" stroke="${C.gold}" stroke-width="11" opacity=".5"`):'')+
      path(d,`data-edge="${edgeKey(e)}" fill="none" stroke="${fresh?C.pink:color}" stroke-width="${fresh?3.3:2.7}" stroke-linecap="round" stroke-linejoin="round" ${arrows?`marker-end="${marker(fresh?C.pink:color)}"`:''} pathLength="1" class="${fresh&&animate?'draw-edge':''}"`);
  }
  function straight(a,b){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),pad=16;
    return `M ${num(a.x+dx/len*pad)} ${num(a.y+dy/len*pad)} L ${num(b.x-dx/len*pad)} ${num(b.y-dy/len*pad)}`;
  }
  function laguerre(state,total,stage,animate=false){
    const size=state?.i||0,edges=state?.edges||[],comps=B.componentsOf(size,edges),colors=componentColors(comps);
    const nodes=new Map(),boxes=[];let left=24,top=16,rowHeight=0;
    for(const c of comps){
      const k=c.nodes.length,rows=Math.ceil(k/10),radius=Math.max(40,k*8.5);
      const w=c.kind==='cycle'?radius*2+76:c.kind==='path'?Math.min(k,10)*56+28:94;
      const h=c.kind==='cycle'?radius*2+94:c.kind==='path'?128+(rows-1)*76:128;
      if(left+w>896){left=24;top+=rowHeight+16;rowHeight=0;}
      boxes.push({...c,x:left,y:top,w,h});
      c.nodes.forEach((v,j)=>{
        let x,y;
        if(c.kind==='cycle'){
          const angle=-Math.PI/2+2*Math.PI*j/k;
          x=left+w/2+radius*Math.cos(angle);y=top+radius+56+radius*Math.sin(angle);
        }else if(c.kind==='path'){
          const row=Math.floor(j/10),col=row%2?9-j%10:j%10;
          x=left+42+col*56;y=top+70+row*76;
        }else {x=left+w/2;y=top+76;}
        nodes.set(v,{x,y});
      });
      left+=w+16;rowHeight=Math.max(rowHeight,h);
    }
    const height=Math.max(280,top+rowHeight+14);
    let out=defs();
    for(const c of boxes){
      out+=`<g data-component="${c.kind}"><rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="10" fill="#f7f9fd" stroke="#e4eaf4"/>`;
      out+=text(c.x+c.w/2,c.y+23,({isolated:'isolated',loop:'loop',cycle:'cycle',path:'open path'})[c.kind],'text-anchor="middle" font-size="14"');out+='</g>';
    }
    const completed=new Set(stage<=total?(state?.newCycles.flat()||[]):[]);
    for(const e of edges){
      const a=nodes.get(e.from),b=nodes.get(e.to);let d;
      if(e.from===e.to) d=`M ${num(a.x-9)} ${num(a.y-10)} C ${num(a.x-40)} ${num(a.y-56)} ${num(a.x+40)} ${num(a.y-56)} ${num(a.x+9)} ${num(a.y-10)}`;
      else if(edges.some(f=>f.from===e.to && f.to===e.from)){
        // Two distinct curved arrows for a 2-cycle, not coincident line segments.
        const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
        d=`M ${num(a.x+dx/len*16)} ${num(a.y+dy/len*16)} Q ${num((a.x+b.x)/2+nx*37)} ${num((a.y+b.y)/2+ny*37)} ${num(b.x-dx/len*16)} ${num(b.y-dy/len*16)}`;
      }else d=straight(a,b);
      out+=edge(d,e,colors.get(e.from),stage,animate,completed.has(e.from));
    }
    for(const [v,p] of nodes){
      const active=v===stage,col=active?C.pink:colors.get(v);
      out+=`<g data-vertex="${v}" class="${active&&animate?'arrive':''}">`;
      // A missing incoming slot is shown to the left; missing outgoing to the right.
      if(state.bottom.includes(v))out+=circle(p.x-24,p.y,4,`fill="white" stroke="${C.green}" stroke-width="2" data-free-in="${v}"`);
      if(state.top.includes(v))out+=circle(p.x+24,p.y,4,`fill="white" stroke="${C.blue}" stroke-width="2" data-free-out="${v}"`);
      out+=circle(p.x,p.y,14,`fill="white" stroke="${col}" stroke-width="${active?3:2}"`);
      out+=text(p.x,p.y+6,v,`text-anchor="middle" font-size="18" style="fill:${col}"`);out+='</g>';
    }
    if(!size){
      out+=text(460,112,'Directed paths grow, join, and close into cycles.','text-anchor="middle" font-size="23"');
      out+=text(460,151,'One vertex per label; at most one incoming and one outgoing edge.','text-anchor="middle" font-size="18"');
    }
    const open=comps.filter(c=>!c.closed).length,closed=comps.length-open;
    return {markup:out,height,components:comps,nodes,
      aria:`Laguerre digraph on vertices 1 to ${size}: ${open} open paths, including isolated vertices, and ${closed} cycles, including loops. ${edges.length} directed edges.`};
  }
  function arcs(state,total,stage,animate=false){
    const size=state?.i||0,edges=state?.edges||[],comps=B.componentsOf(size,edges),colors=componentColors(comps);
    const dx=Math.min(58,804/Math.max(1,total-1)),start=(920-dx*(total-1))/2,x=v=>start+(v-1)*dx,y=156;
    const completed=new Set(stage<=total?(state?.newCycles.flat()||[]):[]);
    const longest=Math.max(1,...edges.map(e=>Math.abs(e.to-e.from)));
    let out=`<line x1="${start-18}" y1="${y}" x2="${x(total)+18}" y2="${y}" stroke="#a7b3c9" stroke-width="1.4"/>`;
    for(const e of edges){
      if(e.from===e.to)continue; // Figure 1 does not draw loops at fixed points.
      const span=Math.abs(e.to-e.from),height=2*span*Math.min(25,118/longest);
      const cy=y+(e.from<e.to?-height:height);
      const d=`M ${num(x(e.from))} ${y} Q ${num((x(e.from)+x(e.to))/2)} ${num(cy)} ${num(x(e.to))} ${y}`;
      out+=edge(d,e,colors.get(e.from),stage,animate,completed.has(e.from),false);
    }
    for(let v=1;v<=total;v++){
      const future=v>size,active=v===stage,fixed=state?.partial[v]===v;
      out+=`<g ${future?'':`data-vertex="${v}"`} class="${active&&animate?'arrive':''}">`;
      out+=circle(x(v),y,future?3.5:active?6:5,`fill="${future?'#dce3ef':active?C.pink:C.ink}"`);
      out+=text(x(v),y+26,v,`text-anchor="middle" font-size="18" stroke="white" stroke-width="4" paint-order="stroke" stroke-linejoin="round" style="fill:${future?'#b6c0d2':active?C.pink:C.ink}"`);
      if(fixed)out+=text(x(v),y+49,'fix',`text-anchor="middle" font-size="12" stroke="white" stroke-width="3" paint-order="stroke" style="fill:${C.muted}" data-fixed="${v}"`);
      out+='</g>';
    }
    if(!size)out+=text(460,62,'New arcs appear when both endpoints have arrived.','text-anchor="middle" font-size="20"');
    const stats=B.arcStatistics(edges);
    return {markup:out,height:310,stats,
      aria:`Crossing and nesting arc diagram after step ${size}. ${edges.filter(e=>e.from!==e.to).length} arcs. Upper crossings ${stats.upper.crossings}, lower crossings ${stats.lower.crossings}, upper nestings ${stats.upper.nestings}, lower nestings ${stats.lower.nestings}. Fixed points have no arcs.`};
  }
  const api={laguerre,arcs};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  root.GraphViews=api;
})(typeof globalThis!=='undefined'?globalThis:this);
