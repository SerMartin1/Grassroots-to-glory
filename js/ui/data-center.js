function dcSub(name,btn){
  document.querySelectorAll('.dc-sub-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.dc-pane').forEach(p=>p.style.display='none');
  const p=document.getElementById('dc-'+name);if(p)p.style.display='block';
  dcRender(name);
}

function dcRender(name){
  if(name==='wzrost')  dcRenderWzrost();
  if(name==='legendy') dcRenderLegенды();
  if(name==='kadra')   dcRenderKadra();
  if(name==='klub')    dcRenderKlub();
}

/* ── helpers ── */
function fmtVal(v){
  if(v>=1000000) return (v/1000000).toFixed(2).replace('.',',')+' mln';
  if(v>=1000) return Math.round(v/1000)+'k';
  return String(v);
}
function dcBars(el,data,color,h){
  if(!el)return;
  el.innerHTML='';
  const barH=h||90;
  el.style.height=barH+'px';
  const mx=Math.max(...data.map(d=>d.v),1);
  data.forEach(d=>{
    const col=document.createElement('div');col.className='dc-bar-col';
    const pxH=Math.max(3,Math.round((d.v/mx)*(barH-18)));
    const f=document.createElement('div');f.className='dc-bar-fill';
    f.style.cssText='background:'+color+';height:'+pxH+'px;width:100%;position:relative;flex-shrink:0;';
    const vl=document.createElement('span');vl.className='dc-bar-val';vl.textContent=d.lbl||d.v;f.appendChild(vl);
    const lb=document.createElement('div');lb.className='dc-bar-lbl';lb.textContent='S'+d.s;
    col.appendChild(f);col.appendChild(lb);el.appendChild(col);
  });
}

function dcBarsDouble(el,d1,d2,col1,col2,h){
  if(!el)return;
  el.innerHTML='';
  el.style.height=(h||72)+'px';
  const mx=Math.max(...d1.map(d=>d.v),...d2.map(d=>d.v),1);
  d1.forEach((_,i)=>{
    const col=document.createElement('div');col.className='dc-bar-col';
    const g=document.createElement('div');g.style.cssText='display:flex;align-items:flex-end;gap:1px;width:100%;height:88%;';
    const b1=document.createElement('div');b1.style.cssText='flex:1;background:'+col1+';height:'+Math.max(3,Math.round((d1[i].v/mx)*100))+'%;';
    const b2=document.createElement('div');b2.style.cssText='flex:1;background:'+col2+';height:'+Math.max(3,Math.round((d2[i].v/mx)*100))+'%;';
    g.appendChild(b1);g.appendChild(b2);
    const lb=document.createElement('div');lb.className='dc-bar-lbl';lb.textContent='S'+(i+1);
    col.appendChild(g);col.appendChild(lb);el.appendChild(col);
  });
}

function dcRowBars(el,data,color,mx){
  if(!el)return;
  el.innerHTML='';
  const m=mx||Math.max(...data.map(d=>d.v),1);
  data.forEach(d=>{
    const row=document.createElement('div');row.className='dc-rbar';
    row.innerHTML='<div class="dc-rbar-lbl">S'+d.s+'</div>'+
      '<div class="dc-rbar-wrap"><div class="dc-rbar-fill" style="background:'+color+';width:'+Math.round((d.v/m)*100)+'%;"></div></div>'+
      '<div class="dc-rbar-val" style="color:'+color+'">'+d.lbl+'</div>';
    el.appendChild(row);
  });
}

function dcChart(parent,title,renderFn){
  const wrap=document.createElement('div');wrap.className='dc-chart';
  const lbl=document.createElement('div');lbl.className='dc-chart-lbl';lbl.textContent=title;
  wrap.appendChild(lbl);
  const bars=document.createElement('div');bars.className='dc-bars';
  wrap.appendChild(bars);
  parent.appendChild(wrap);
  renderFn(bars);
  return wrap;
}

function dcLegend(parent,items){
  const leg=document.createElement('div');leg.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;';
  items.forEach(([color,label])=>{
    leg.innerHTML+='<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+color+';margin-right:3px;vertical-align:middle;"></span><span style="font-size:var(--fs-body);color:var(--gr)">'+label+'</span></span>';
  });
  parent.lastChild.appendChild(leg);
}

// ── WZROST ──────────────────────────────────────────────
function dcRenderWzrost(){
  const el=document.getElementById('dc-wzrost');if(!el||!G)return;
  const h=G.cHist||[];
  if(!h.length){
    el.innerHTML='<div style="font-family:VT323,monospace;font-size:var(--fs-body);color:var(--gr);padding:20px 10px;text-align:center;line-height:1.6;">Wykresy wzrostu pojawią się<br>po zakończeniu pierwszego sezonu.</div>';
    return;
  }
  el.innerHTML='';

  // Dodaj bieżący sezon jako punkt in-progress jeśli nie ma go w cHist
  const hasCurrentInHist=h.some(d=>d.season===G.season);
  const allData=[...h];
  if(!hasCurrentInHist){
    allData.push({
      season:G.season,
      reputation:G.reputation||30,
      stadiumCap:(G.stadium&&G.stadium.capacity)||200,
      _current:true
    });
  }

  // ── Wykres 1: Reputacja ──────────────────────────────
  const sec1=document.createElement('div');sec1.className='dc-sec';
  sec1.style.cssText='color:var(--am);border-color:var(--am)';
  sec1.textContent='REPUTACJA KLUBU';el.appendChild(sec1);

  const w1=document.createElement('div');w1.className='dc-chart';el.appendChild(w1);
  const l1=document.createElement('div');l1.className='dc-chart-lbl';
  l1.textContent='REPUTACJA · SEZON PO SEZONIE';w1.appendChild(l1);
  const b1=document.createElement('div');b1.className='dc-bars';b1.style.height='72px';w1.appendChild(b1);
  dcBars(b1, allData.map(d=>({
    s: d.season,
    v: d.reputation||0,
    lbl: (d.reputation||0)+(d._current?'⏳':'')
  })), 'var(--am)');

  // ── Wykres 2: Pojemność stadionu ─────────────────────
  const sec2=document.createElement('div');sec2.className='dc-sec';
  sec2.style.cssText='color:#00bcd4;border-color:#00bcd4';
  sec2.textContent='POJEMNOŚĆ STADIONU';el.appendChild(sec2);

  const w2=document.createElement('div');w2.className='dc-chart';el.appendChild(w2);
  const l2=document.createElement('div');l2.className='dc-chart-lbl';
  l2.textContent='STADION [os.] · SEZON PO SEZONIE';w2.appendChild(l2);
  const b2=document.createElement('div');b2.className='dc-bars';b2.style.height='72px';w2.appendChild(b2);
  dcBars(b2, allData.map(d=>({
    s: d.season,
    v: d.stadiumCap||200,
    lbl: (d.stadiumCap||200)+(d._current?'⏳':'')
  })), '#00bcd4');

  // ── Wykres 3: Budżet końcowy ──────────────────────────
  const sec3=document.createElement('div');sec3.className='dc-sec';
  sec3.style.cssText='color:var(--gb);border-color:var(--gb)';
  sec3.textContent='BUDŻET KOŃCOWY';el.appendChild(sec3);

  const w3=document.createElement('div');w3.className='dc-chart';el.appendChild(w3);
  const l3=document.createElement('div');l3.className='dc-chart-lbl';
  l3.textContent='BUDŻET [zł] · SEZON PO SEZONIE';w3.appendChild(l3);
  const b3=document.createElement('div');b3.className='dc-bars';b3.style.height='72px';w3.appendChild(b3);
  const budgetData=allData.map(d=>({
    s: d.season,
    v: d._current?(G.budget||0):(d.budget||0),
    lbl: fmt(d._current?(G.budget||0):(d.budget||0))+(d._current?'⏳':'')
  }));
  dcBars(b3, budgetData, 'var(--gb)');

  // ── Wykres 4: Poziom akademii ─────────────────────────
  if(G.academy&&G.academy.level>0){
    const sec4=document.createElement('div');sec4.className='dc-sec';
    sec4.style.cssText='color:#ce93d8;border-color:#9c27b0';
    sec4.textContent='POZIOM AKADEMII';el.appendChild(sec4);

    const w4=document.createElement('div');w4.className='dc-chart';el.appendChild(w4);
    const l4=document.createElement('div');l4.className='dc-chart-lbl';
    l4.textContent='AKADEMIA · POZIOM PER SEZON';w4.appendChild(l4);
    const b4=document.createElement('div');b4.className='dc-bars';b4.style.height='52px';w4.appendChild(b4);
    const acadNow=G.academy.level;
    // akademia: G.academy.hist[] zawiera {season, level} jeśli istnieje, fallback — bieżący poziom
    const acadHistArr=G.academy.hist||[];
    const acadData=allData.map(d=>{
      const entry=acadHistArr.find(a=>a.season===d.season);
      const v=entry?entry.level:(d._current?acadNow:Math.max(0,acadNow-1));
      return {s:d.season,v,lbl:'L'+v};
    });
    dcBars(b4, acadData, '#9c27b0', 52);
  }
}

// ── LEGENDY ─────────────────────────────────────────────
const LEG_THRESHOLD=200;
const LEG_W=0.25,LEG_G=0.5,LEG_A=0.3,LEG_M=12,LEG_P=8;

function legScore(stat,trophyCount,cupCount){
  const pts=
    Math.min(stat.matches*LEG_W, 75)+
    Math.min(stat.goals*LEG_G,   50)+
    Math.min(stat.assists*LEG_A, 30)+
    trophyCount*LEG_M+
    cupCount*LEG_P;
  return Math.round(pts*10)/10;
}

function legTrophies(playerId){
  // Mistrzostwa: sprawdź czy zawodnik był w klubie gracza w danym sezonie
  const h=G.cHist||[];
  const allPool=[...(G.players||[]),...(G.retiredPlayers||[]),...(G.fa||[])];
  const p=allPool.find(x=>x.id===playerId);
  if(!p)return{leagues:0,cups:0};
  const leagues=(G.trophies||[]).filter(t=>t.type==='league'&&
    p.history&&p.history.some(ph=>ph.season===t.season&&ph.clubId===G.myClubId)).length;
  const cups=(G.trophies||[]).filter(t=>t.type==='cup'&&t.place===1&&
    p.history&&p.history.some(ph=>ph.season===t.season&&ph.clubId===G.myClubId)).length;
  return{leagues,cups};
}

function dcRenderLegенды(){
  const el=document.getElementById('dc-legendy');if(!el||!G)return;
  el.innerHTML='';
  const at=G.allTimeStats&&G.allTimeStats.players?G.allTimeStats.players:{};
  const allPool=[...(G.players||[]),...(G.retiredPlayers||[]),...(G.fa||[])];

  const scored=Object.values(at).map(stat=>{
    const{leagues,cups}=legTrophies(stat.id);
    const score=legScore(stat,leagues,cups);
    const isRetired=!!(G.retiredPlayers&&G.retiredPlayers.some(x=>x.id===stat.id));
    const isAcad=!!(allPool.find(x=>x.id===stat.id)?.fromAcademy);
    return{...stat,leagues,cups,score,isRetired,isAcad};
  }).sort((a,b)=>b.score-a.score);

  const legends=scored.filter(s=>s.score>=LEG_THRESHOLD);
  const candidates=scored.filter(s=>s.score<LEG_THRESHOLD&&s.score>0);
  const mainLegs=legends.filter(s=>!s.isAcad);
  const acadLegs=legends.filter(s=>s.isAcad);

  // ── Pasek progresu kandydatów ────────────────────────
  if(candidates.length){
    const prog=document.createElement('div');prog.className='leg-prog-block';
    prog.innerHTML='<div class="leg-prog-title">KANDYDACI NA LEGENDĘ — POSTĘP</div>';
    candidates.slice(0,3).forEach(s=>{
      const pct=Math.min(100,Math.round((s.score/LEG_THRESHOLD)*100));
      const barColor=pct>=80?'var(--am)':pct>=50?'var(--gb)':'#2d6b2d';
      const row=document.createElement('div');row.className='leg-prog-row';
      // imię klikalne
      const nameSpan=s.id!=null
        ?'<span style="color:var(--am);cursor:pointer;text-decoration:underline" onclick="showById('+s.id+')">'+(s.name||'?')+'</span>'
        :'<span style="color:var(--wh)">'+(s.name||'?')+'</span>';
      row.innerHTML=
        '<div class="leg-prog-name">'+nameSpan+(s.isAcad?' 🎓':'')+'</div>'+
        '<div class="leg-prog-bar"><div class="leg-prog-fill" style="background:'+barColor+';width:'+pct+'%"></div></div>'+
        '<div class="leg-prog-val" style="color:'+barColor+'">'+s.score+'/'+LEG_THRESHOLD+'</div>';
      prog.appendChild(row);
    });
    el.appendChild(prog);
  }

  // ── Brak legend / Brak danych ────────────────────────
  if(!legends.length&&!candidates.length){
    const nd=document.createElement('div');
    nd.style.cssText='font-size:var(--fs-body);color:var(--gr);text-align:center;padding:16px 0;';
    nd.textContent='Brak legend — historia się pisze!';
    el.appendChild(nd);
  }
  if(!legends.length&&candidates.length){
    const nd=document.createElement('div');
    nd.style.cssText='font-size:var(--fs-body);color:var(--gr);text-align:center;padding:8px 0 14px;';
    nd.textContent='Brak legend — jeszcze nikt nie przekroczył progu '+LEG_THRESHOLD+' pkt.';
    el.appendChild(nd);
  }

  // ── Helper: buduj kartę legendy ──────────────────────
  function buildLegCard(s,i,rankEmoji,rankColor,cardClass,isAcad){
    const card=document.createElement('div');card.className='leg-card '+cardClass;

    const badges=[];
    if(s.leagues>0)badges.push('<span class="leg-badge" style="border-color:var(--am);color:var(--am)">🏆 '+s.leagues+'×</span>');
    if(s.cups>0)badges.push('<span class="leg-badge" style="border-color:var(--cy);color:var(--cy)">🥇 '+s.cups+'×</span>');
    if(s.isRetired)badges.push('<span class="leg-badge" style="border-color:var(--gr);color:var(--gr)">EMERYT</span>');
    if(isAcad)badges.push('<span class="leg-badge" style="border-color:#9c27b0;color:#ce93d8">🎓 WYCHOWANEK</span>');

    const pct=Math.min(100,Math.round((s.score/LEG_THRESHOLD)*100));
    const nameColor=isAcad?'#ce93d8':'var(--am)';
    // imię jako klikalny link
    const nameLink=s.id!=null
      ?'<span style="color:'+nameColor+';cursor:pointer;text-decoration:underline" onclick="showById('+s.id+')">'+(s.name||'?')+'</span>'
      :'<span style="color:'+nameColor+'">'+(s.name||'?')+'</span>';

    const debutSeason=isAcad&&s.id!=null?(allPool.find(x=>x.id===s.id)?.history||[]).find(h=>h.fromAcademy)?.season:null;
    const extraStat=isAcad
      ?'<div><div class="leg-sl">Debiut</div><div class="leg-sv">'+(debutSeason?'S'+debutSeason:'?')+'</div></div>'
      :'<div><div class="leg-sl">Mistrzostwa</div><div class="leg-sv" style="color:var(--am)">'+(s.leagues||0)+'</div></div>';

    card.innerHTML=
      '<div class="leg-rank">'+rankEmoji+' #'+(i+1)+'</div>'+
      '<div class="leg-name" style="padding-right:40px">'+nameLink+'</div>'+
      '<div class="leg-stats">'+
        '<div><div class="leg-sl">Mecze</div><div class="leg-sv">'+(s.matches||0)+'</div></div>'+
        '<div><div class="leg-sl">Gole</div><div class="leg-sv">'+(s.goals||0)+'</div></div>'+
        '<div><div class="leg-sl">Asysty</div><div class="leg-sv">'+(s.assists||0)+'</div></div>'+
        extraStat+
      '</div>'+
      (badges.length?'<div class="leg-badges">'+badges.join('')+'</div>':'')+
      '<div class="leg-score-row">'+
        '<span class="leg-score-lbl">Ocena legendy:</span>'+
        '<span class="leg-score-val" style="color:'+rankColor+'">'+s.score+'</span>'+
        '<div class="leg-score-bar"><div class="leg-score-fill" style="background:'+rankColor+';width:'+pct+'%"></div></div>'+
      '</div>';
    return card;
  }

  // ── Największe legendy ───────────────────────────────
  if(mainLegs.length){
    const sec=document.createElement('div');sec.className='leg-sec';
    sec.style.cssText='color:var(--am);border-color:var(--am)';
    sec.textContent='👑 NAJWIĘKSZE LEGENDY';
    el.appendChild(sec);
    mainLegs.forEach((s,i)=>{
      const rankEmoji=['🥇','🥈','🥉'][i]||'⭐';
      const rankColor=['var(--am)','#9e9e9e','#8d6e63','var(--gl)'][Math.min(i,3)];
      const cardClass=['r1','r2','r3',''][Math.min(i,3)];
      el.appendChild(buildLegCard(s,i,rankEmoji,rankColor,cardClass,false));
    });
  }

  // ── Wychowankowie ────────────────────────────────────
  if(acadLegs.length){
    const sec2=document.createElement('div');sec2.className='leg-sec';
    sec2.style.cssText='color:#9c27b0;border-color:#9c27b0';
    sec2.textContent='🎓 NAJLEPSI WYCHOWANKOWIE AKADEMII';
    el.appendChild(sec2);
    acadLegs.forEach((s,i)=>{
      el.appendChild(buildLegCard(s,i,'🎓','#9c27b0','rac',true));
    });
  }

  // ── INFO I NAGRODY — na samym dole ──────────────────
  const info=document.createElement('div');info.className='leg-info-box';
  info.style.marginTop='18px';
  info.innerHTML=
    '<div class="leg-info-title">JAK ZOSTAĆ LEGENDĄ KLUBU?</div>'+
    '<div class="leg-info-row">Próg: <span>'+LEG_THRESHOLD+' pkt</span></div>'+
    '<div class="leg-info-row">Mecz: <span>+'+LEG_W+' pkt</span> &nbsp; Gol: <span>+'+LEG_G+' pkt</span> &nbsp; Asysta: <span>+'+LEG_A+' pkt</span></div>'+
    '<div class="leg-info-row">Mistrzostwo: <span>+'+LEG_M+' pkt</span> &nbsp; Puchar: <span>+'+LEG_P+' pkt</span></div>'+
    '<div class="leg-info-row" style="margin-top:5px;color:#546e54">Przykład: 4M+3P = 72 pkt z trofei. Do progu '+LEG_THRESHOLD+' pkt<br>potrzeba ~14 sezonów regularnej gry.</div>';
  el.appendChild(info);

  const rew=document.createElement('div');rew.className='leg-rewards';
  rew.innerHTML=
    '<div class="leg-reward-title">NAGRODY ZA STATUS LEGENDY</div>'+
    '<div class="leg-reward-row"><span>⭐</span> Wpis do Historii Klubu</div>'+
    '<div class="leg-reward-row"><span>+15</span> reputacji klubu (jednorazowo)</div>'+
    '<div class="leg-reward-row"><span>⭐</span> Specjalna ikona przy nazwisku</div>';
  el.appendChild(rew);
}


// ── KADRA ────────────────────────────────────────────────
function dcRenderKadra(){
  const el=document.getElementById('dc-kadra');if(!el||!G)return;
  const h=G.cHist||[];
  el.innerHTML='';

  // KPI rekordy wartości
  const maxVal=h.length?Math.max(...h.map(d=>d.budget||0)):0;
  const maxRep=h.length?Math.max(...h.map(d=>d.reputation||0)):G.reputation||0;

  // Wartość bieżącej kadry
  const squadVal=myPl().reduce((s,p)=>s+(p.value||0),0);
  const kpi=document.createElement('div');kpi.className='dc-kpi2';
  kpi.innerHTML=
    '<div class="dc-kpi-box"><span class="dc-kpi-v" style="color:#9c27b0">'+fmt(squadVal)+'</span><div class="dc-kpi-l">WARTOŚĆ KADRY TERAZ</div></div>'+
    '<div class="dc-kpi-box"><span class="dc-kpi-v" style="color:var(--am)">'+myPl().length+'</span><div class="dc-kpi-l">ZAWODNIKÓW</div></div>';
  el.appendChild(kpi);

  // Wykres wartości kadry
  const sec1=document.createElement('div');sec1.className='dc-sec';sec1.style.color='#ce93d8';sec1.style.borderColor='#9c27b0';sec1.textContent='WARTOŚĆ KADRY · TREND';el.appendChild(sec1);
  if(h.length){
    const w1=document.createElement('div');w1.className='dc-chart';el.appendChild(w1);
    const l1=document.createElement('div');l1.className='dc-chart-lbl';l1.textContent='WARTOŚĆ KADRY PER SEZON';w1.appendChild(l1);
    const b1=document.createElement('div');b1.className='dc-bars';b1.style.height='90px';w1.appendChild(b1);
    const vals=h.map((d,i,arr)=>{
      const v=i===arr.length-1?squadVal:Math.round(squadVal*(d.budget||1)/Math.max(G.budget||1,1));
      return {s:d.season,v:Math.max(0,v),lbl:fmtVal(v)};
    });
    // dodaj bieżący jeśli nie ma
    if(!h.some(d=>d.season===G.season)) vals.push({s:G.season,v:squadVal,lbl:fmtVal(squadVal)+'⏳'});
    dcBars(b1,vals,'#9c27b0',90);
  }

  // Tabela OVR + potencjał bieżącej kadry
  const sec2=document.createElement('div');sec2.className='dc-sec';sec2.style.color='#ce93d8';sec2.style.borderColor='#9c27b0';sec2.textContent='OVR VS POTENCJAŁ · BIEŻĄCA KADRA';el.appendChild(sec2);

  const players=myPl().slice().sort((a,b)=>ovr(b)-ovr(a));
  const tbl=document.createElement('table');tbl.className='dc-table';
  tbl.innerHTML='<thead><tr><th>ZAWODNIK</th><th>POZ</th><th>OVR</th><th>POT</th><th>DELTA</th><th>WARTOŚĆ</th></tr></thead>';
  const tbody=document.createElement('tbody');
  players.forEach(p=>{
    const o=ovr(p),pot=p.potential||o;
    const delta=pot-o;
    const deltaColor=delta>5?'var(--gb)':delta>0?'var(--am)':'var(--gr)';
    const tr=document.createElement('tr');
    tr.style.cursor='pointer';
    tr.onclick=()=>showById(p.id);
    tr.innerHTML='<td style="color:var(--am);text-decoration:underline">'+(p.name||'?')+(p.fromAcademy?' <span style="font-size:var(--fs-meta);color:#9c27b0">🎓</span>':'')+'</td>'+
      '<td style="color:var(--gr)">'+(p.pos||'?')+'</td>'+
      '<td style="color:var(--am);font-family:\'Press Start 2P\',monospace;font-size:var(--fs-h3)">'+o+'</td>'+
      '<td style="color:#00bcd4">'+pot+'</td>'+
      '<td style="color:'+deltaColor+'">'+(delta>0?'+':'')+delta+'</td>'+
      '<td style="color:var(--wh)">'+fmtVal(p.value||0)+'</td>';
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  el.appendChild(tbl);

  // Wychowankowie akademii
  const grads=myPl().filter(p=>p.fromAcademy);
  if(grads.length){
    const sec3=document.createElement('div');sec3.className='dc-sec';sec3.style.color='#ce93d8';sec3.style.borderColor='#9c27b0';sec3.textContent='WYCHOWANKOWIE AKADEMII W KADRZE';el.appendChild(sec3);
    grads.forEach(p=>{
      const card=document.createElement('div');
      card.style.cssText='background:var(--tb);border-left:3px solid #9c27b0;padding:7px 10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;';
      card.innerHTML='<div><div style="font-size:var(--fs-body);color:var(--wh)">'+p.name+' <span style="color:#9c27b0;font-size:12px">🎓</span></div>'+
        '<div style="font-size:var(--fs-meta);color:var(--gr)">OVR '+ovr(p)+' → POT '+(p.potential||ovr(p))+' · '+(p.pos||'?')+'</div></div>'+
        '<div style="font-family:\'Press Start 2P\',monospace;font-size:var(--fs-micro);color:var(--gb)">'+fmtVal(p.value||0)+'</div>';
      el.appendChild(card);
    });
  }
}

// ── KLUB ─────────────────────────────────────────────────
function dcRenderKlub(){
  const el=document.getElementById('dc-klub');if(!el||!G)return;
  el.innerHTML='';

  const myName=G.myClub?G.myClub.n:'';
  const curSeason=G.season||1;
  const mHist=G.mHist||[];
  const cHist=G.cHist||[];
  const COL={'W':'var(--gb)','R':'var(--am)','P':'var(--rd)'};
  const LBL={'W':'Wygrana','R':'Remis','P':'Porażka'};

  // Legenda
  el.innerHTML=
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">'+
    '<span><span style="display:inline-block;width:11px;height:11px;background:var(--gb);border-radius:2px;margin-right:3px;vertical-align:middle"></span><span style="font-size:var(--fs-body);color:var(--gr)">Wygrana</span></span>'+
    '<span><span style="display:inline-block;width:11px;height:11px;background:var(--am);border-radius:2px;margin-right:3px;vertical-align:middle"></span><span style="font-size:var(--fs-body);color:var(--gr)">Remis</span></span>'+
    '<span><span style="display:inline-block;width:11px;height:11px;background:var(--rd);border-radius:2px;margin-right:3px;vertical-align:middle"></span><span style="font-size:var(--fs-body);color:var(--gr)">Porażka</span></span>'+
    '<span style="font-size:var(--fs-body);color:var(--gr)">🏠=dom ✈=wyjazd</span>'+
    '</div>';

  // Buduj listę sezonów do wyświetlenia — deduplikacja po season
  const seasonMap={};
  cHist.forEach(d=>{
    if(!seasonMap[d.season]||d.pos!=='?')seasonMap[d.season]={...d,_fromHist:true};
  });
  // Dodaj bieżący sezon jeśli nie ma go w cHist
  if(!seasonMap[curSeason]){
    seasonMap[curSeason]={season:curSeason,league:G.myLeague?LEAGUE_NAMES[G.myLeague]:'?',pos:'?',pts:0,_current:true};
  }
  const seasons=Object.values(seasonMap).sort((a,b)=>b.season-a.season);

  // Mecze gracza z mHist — mecze mają isMyH ustawione (nowe) lub pasującą nazwę (stare)
  function getMyMatches(season){
    return mHist
      .filter(m=>{
        if(m.season!==season)return false;
        // nowe wpisy mają isMyH
        if(m.isMyH===true||m.isMyH===false)return true;
        // stare wpisy — sprawdź po nazwie
        return m.hn===myName||m.an===myName;
      })
      .sort((a,b)=>(a.rnd||0)-(b.rnd||0));
  }

  function makeDot(res,isHome,rnd,opp,mg,og){
    const dot=document.createElement('div');
    dot.className='dc-hdot';
    dot.style.background=COL[res];
    // Obramowanie = wyjazd
    if(!isHome)dot.style.outline='2px solid rgba(255,255,255,0.35)';
    dot.innerHTML='<div class="dc-htip">K'+rnd+' · '+(isHome?'🏠':'✈')+' vs '+opp+' · '+mg+':'+og+' · '+LBL[res]+'</div>';
    return dot;
  }

  seasons.forEach((d,di)=>{
    const isChamp=G.trophies&&G.trophies.some(t=>t.type==='league'&&t.season===d.season);
    const isCup=G.trophies&&G.trophies.some(t=>t.type==='cup'&&t.place===1&&t.season===d.season);
    const pos=d.pos&&d.pos!=='?'?d.pos:null;
    const posColor=pos===1?'var(--am)':pos<=3?'var(--gb)':pos<=6?'var(--wh)':'var(--rd)';

    // Nagłówek
    const hdr=document.createElement('div');
    hdr.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:5px;'+(di>0?'margin-top:14px;':'');
    hdr.innerHTML=
      '<span style="font-family:\'Press Start 2P\',monospace;font-size:var(--fs-h3);color:var(--cy)">S'+d.season+'</span>'+
      '<span style="font-size:var(--fs-body);color:var(--gr)">'+(d.league||'?')+'</span>'+
      (pos?'<span style="font-family:\'Press Start 2P\',monospace;font-size:var(--fs-micro);color:'+posColor+'">'+pos+'. msc</span>':
           '<span style="font-size:var(--fs-body);color:var(--gr)">w trakcie</span>')+
      (d.pts?'<span style="font-size:var(--fs-body);color:var(--gr)">'+d.pts+' pkt</span>':'')+
      (isChamp?'<span style="font-size:14px">🏆</span>':'')+
      (isCup?'<span style="font-size:14px">🥇</span>':'');
    el.appendChild(hdr);

    // Pobierz mecze z mHist (działą dla bieżącego i zakończonych sezonów)
    const matches=getMyMatches(d.season);

    if(matches.length){
      // Dwie linie — osobno dom i wyjazd
      // isMyH: true=dom, false=wyjazd, null=stary zapis→dedukuj z hn
      const homeMatches=matches.filter(m=>m.isMyH===true||(m.isMyH==null&&m.hn===myName));
      const awayMatches=matches.filter(m=>m.isMyH===false||(m.isMyH==null&&m.an===myName));

      if(homeMatches.length){
        const rowH=document.createElement('div');
        rowH.style.cssText='display:flex;align-items:center;gap:2px;margin-bottom:3px;';
        const lbl=document.createElement('span');
        lbl.style.cssText='font-size:var(--fs-meta);color:var(--gr);margin-right:4px;flex-shrink:0';
        lbl.textContent='🏠';
        rowH.appendChild(lbl);
        homeMatches.sort((a,b)=>(a.rnd||0)-(b.rnd||0)).forEach((m,i)=>{
          const mg=m.hg,og=m.ag; // gracz=gospodarz
          const res=mg>og?'W':mg===og?'R':'P';
          rowH.appendChild(makeDot(res,true,m.rnd||i+1,m.an,mg,og));
        });
        el.appendChild(rowH);
      }
      if(awayMatches.length){
        const rowA=document.createElement('div');
        rowA.style.cssText='display:flex;align-items:center;gap:2px;margin-bottom:3px;';
        const lbl=document.createElement('span');
        lbl.style.cssText='font-size:var(--fs-meta);color:var(--gr);margin-right:4px;flex-shrink:0';
        lbl.textContent='✈';
        rowA.appendChild(lbl);
        awayMatches.sort((a,b)=>(a.rnd||0)-(b.rnd||0)).forEach((m,i)=>{
          const mg=m.ag,og=m.hg; // gracz=gość
          const res=mg>og?'W':mg===og?'R':'P';
          rowA.appendChild(makeDot(res,false,m.rnd||i+1,m.hn,mg,og));
        });
        el.appendChild(rowA);
      }
    } else if(d._fromHist){
      // Zakończony sezon bez danych w mHist — rekonstruuj z cHist w/d/l
      const w=d.w||0,dr=d.d||0,l=d.l||0;
      const total=w+dr+l;
      if(!total){
        const nd=document.createElement('div');
        nd.style.cssText='font-size:var(--fs-body);color:var(--gr);padding:2px 0 6px';
        nd.textContent='Brak danych meczowych.';el.appendChild(nd);
      } else {
        const heat=document.createElement('div');heat.className='dc-heat';heat.style.marginBottom='4px';
        const results=[];
        for(let i=0;i<w;i++)results.push('W');
        for(let i=0;i<dr;i++)results.push('R');
        for(let i=0;i<l;i++)results.push('P');
        results.forEach(res=>{
          const dot=document.createElement('div');dot.className='dc-hdot';
          dot.style.background=COL[res];
          dot.innerHTML='<div class="dc-htip">'+LBL[res]+' · sezon '+d.season+'</div>';
          heat.appendChild(dot);
        });
        el.appendChild(heat);
      }
    } else {
      const nd=document.createElement('div');
      nd.style.cssText='font-size:var(--fs-body);color:var(--gr);padding:2px 0 6px';
      nd.textContent='Brak rozegranych meczów.';el.appendChild(nd);
    }
  });
}




