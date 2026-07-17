let _cmClubId=null;
const CM_HIST_WIN=12; // liczba sezonów widocznych jednocześnie na wykresach historii klubu
let _cmHistCache={}; // clubId -> {entries,minO,maxO,maxPts,winMaxStart} — zasila suwak sezonów

function openClubModal(clubId){
  clubId=Number(clubId)||clubId;
  if(!G)return;
  if(isMatchLockActive()&&G._matchLockPhase!=='prematch'){
    notif(t('match_lock_blocked_notif'),'err');
    _returnToMatchLock();
    return;
  }
  // Jeśli to nasz klub — otwórz modal z zakładką SKŁAD (działa wewnątrz panelu ligi)
  if(clubId===G.myClubId){
    _cmClubId=clubId;
    const modal=document.getElementById('modal-club-ai');
    if(!modal)return;
    const myClub=G.myClub||{n:t('cm_fallback_myclub'),id:G.myClubId};
    document.getElementById('cm-title').textContent=myClub.n.toUpperCase();
    document.getElementById('cm-subtitle').textContent=t('cm_your_club')+' • '+(LEAGUE_NAMES[G.myLeague]||'');
    var _cmCr=document.getElementById('cm-px-crest');if(_cmCr&&typeof pxCrest==='function'){_cmCr.innerHTML='';_cmCr.appendChild(pxCrest(G.myClubId,4));}
    // KARTA KLUBU: te same dane co u klubu AI (statystyki, transfery), ale bez losowej
    // "filozofii" AI — klubem gracza zarządza gracz, więc zamiast typu pokazujemy stałą etykietę.
    const myAi=Object.assign({},myClub.ai,{reputation:G.reputation||0,transferLog:_myClubTransferLog()});
    const myDef={icon:'',desc:t('cm_managed_by_you')};
    _renderClubCard(myClub,myAi,myDef,[]);
    // Pokaż od razu zakładkę SKŁAD
    cmTab('sklad');
    modal.style.zIndex='9999';
    modal.style.display='flex';
    document.body.appendChild(modal);
    return;
  }
  _cmClubId=clubId;
  const modal=document.getElementById('modal-club-ai');
  if(!modal)return;
  // Znajdź klub
  const club=ALL_CLUBS.find(c=>c.id===clubId)||
    (G.leagues||[]).flatMap(l=>l.clubs).find(c=>c.id===clubId)||
    {id:clubId,n:(G.standing||[]).find(s=>s.cid===clubId)?.n||t('briefing_club_fallback')};
  // Liga i pozycja
  const lg=(G.leagues||[]).find(l=>l.clubs.some(c=>c.id===clubId));
  const lgName=lg?(LEAGUE_NAMES[lg.level]||lg.name):'';
  const lgSt=G.allStandings&&lg?[...(G.allStandings[lg.level]||[])].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)):[];
  const pos=lgSt.findIndex(s=>s.cid===clubId)+1;
  const ai=club.ai||{type:'stabilny',budget:0,reputation:30,transferLog:[],juniorLog:[]};
  const def=AI_TYPES[ai.type]||AI_TYPES.stabilny;
  // Nagłówek
  document.getElementById('cm-title').textContent=club.n.toUpperCase();
  document.getElementById('cm-subtitle').textContent=def.icon+(lgName?' • '+lgName:'')+(pos>0?' • '+t('cm_position_label').replace('{pos}',pos):'');
  var _cmCr2=document.getElementById('cm-px-crest');if(_cmCr2&&typeof pxCrest==='function'){_cmCr2.innerHTML='';_cmCr2.appendChild(pxCrest(clubId,4));}
  // Domyślna zakładka
  cmTab('karta');
  modal.style.zIndex='9999';
  modal.style.display='flex';
  document.body.appendChild(modal);
  _renderClubCard(club,ai,def,lgSt);
}

function closeClubModal(){
  const modal=document.getElementById('modal-club-ai');
  if(modal){modal.style.display='none';modal.style.zIndex='900';}
  _cmClubId=null;
  const _ret=window._clubModalReturn;
  window._clubModalReturn=null;
  // v224: powrót do overlayu szczegółów meczu, jeśli stamtąd przyszliśmy (patrz traits-history.js)
  if(_ret&&_ret.modalId==='md-overlay'&&_ret.extra){
    showMatchDetail(_ret.extra.idx,_ret.extra.src);
  } else if(_ret&&_ret.modalId==='p-player'&&_ret.extra){
    // powrót do karty zawodnika, z której otwarto ten klub (link do klubu w tactics-playercard.js)
    const _pid=_ret.extra.pid;
    const _p=(G.players||[]).find(x=>x.id===_pid)||(G.retiredPlayers||[]).find(x=>x.id===_pid)||(G.fa||[]).find(x=>x.id===_pid);
    if(_p)showPlayer(_p);
  }
}

function cmTab(tab){
  var tabs=['karta','sklad','wyniki','historia','newsy'];
  tabs.forEach(function(t){
    var btn=document.getElementById('cm-tab-'+t);
    var pane=document.getElementById('cm-pane-'+t);
    if(btn){btn.style.background=tab===t?'var(--gm)':'var(--tb)';btn.style.color=tab===t?'var(--am)':'var(--gr)';btn.style.borderBottom=tab===t?'2px solid var(--am)':'2px solid transparent';}
    if(pane)pane.style.display=tab===t?'block':'none';
  });
  if(tab==='sklad'&&_cmClubId)_renderClubSquad(_cmClubId);
  if(tab==='wyniki'&&_cmClubId)_renderClubMatches(_cmClubId);
  if(tab==='historia'&&_cmClubId)_renderClubHistory(_cmClubId);
  if(tab==='newsy'&&_cmClubId)_renderClubNews(_cmClubId);
}

function clubStarPlayer(squad){
  return squad.length?squad.reduce((b,p)=>ovr(p)>ovr(b)?p:b,squad[0]):null;
}

// Log transferów gracza (G.fin.transfers) przemapowany do formatu ai.transferLog klubów AI,
// żeby KARTA KLUBU mogła użyć tego samego renderowania (_renderClubCard) dla własnego klubu.
function _myClubTransferLog(){
  const allPl=[...G.players,...(G.retiredPlayers||[]),...(G.fa||[])];
  return (G.fin&&G.fin.transfers||[]).map(tr=>{
    const pl=allPl.find(x=>x.id===tr.id);
    return {
      type:tr.type,name:tr.name,pos:pl?pl.pos:'',
      age:tr.buyAge||tr.soldAge||(pl?pl.age:null),
      price:tr.val||0,season:tr.season,playerId:tr.id,
      fromClub:tr.type==='buy'?t('world_market'):undefined,
      toClub:tr.type==='sell'?(tr.club||t('world_market')):undefined
    };
  }).slice(-20).reverse();
}

function _renderClubCard(club,ai,def,lgSt){
  const el=document.getElementById('cm-pane-karta');if(!el)return;
  const squad=G.players.filter(p=>p.clubId===club.id);
  const starters=squad.filter(p=>p.starter);
  const avgOvr=starters.length?Math.round(starters.reduce((s,p)=>s+ovr(p),0)/starters.length):0;
  // Realna dyspozycja zespołu — średnia forma zawodników wyjściowej 11, ta sama wartość co wpływa na moc drużyny w meczu (patrz tSt2() w match-ui.js)
  const avgForm=starters.length?Math.round(starters.reduce((s,p)=>s+(p.form||100),0)/starters.length):(squad.length?Math.round(squad.reduce((s,p)=>s+(p.form||100),0)/squad.length):null);
  const avgAge=squad.length?Math.round(squad.reduce((s,p)=>s+(p.age||0),0)/squad.length*10)/10:null;
  const star=clubStarPlayer(squad);
  const squadValue=squad.reduce((s,p)=>s+(p.value||0),0);
  // Reputacja: ta sama skala 0-1000 co u gracza (G.reputation)
  const repVal=Math.max(0,ai.reputation||0);
  function row2(label,val){
    return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #0d1f0d;font-size:var(--fs-dense)">'+
      '<span style="color:var(--gr)">'+label+'</span><span style="color:var(--wh)">'+val+'</span></div>';
  }
  // Log transferów
  const log=ai.transferLog||[];
  const logHtml=log.length?log.map(tr=>{
    const isBuy=tr.type==='buy';
    const icon=isBuy?'<span style="color:var(--gb)">'+t('tr_log_buy')+'</span>':'<span style="color:var(--rd)">'+t('tr_log_sell')+'</span>';
    const priceStr=tr.price>0?fmtVal(tr.price):'—';
    // Szukaj zawodnika po ID, potem po nazwie (starsze wpisy bez playerId)
    const allPl=[...G.players,...(G.retiredPlayers||[]),...(G.fa||[])];
    const livePl=tr.playerId
      ?allPl.find(x=>x.id===tr.playerId)
      :allPl.find(x=>x.name===tr.name);
    const nameHtml=livePl
      ? '<span style="color:var(--am);cursor:pointer;text-decoration:underline" onclick="showById('+livePl.id+')">'+tr.name+'</span>'
      : tr.playerId
        ? '<span style="color:var(--gr);cursor:pointer;text-decoration:underline" title="'+t('cm_player_retired_title')+'" onclick="showById('+tr.playerId+')">'+tr.name+'</span>'
        : '<span style="color:var(--wh)">'+tr.name+'</span>';
    const ageStr=livePl?(livePl.age+'l'):(tr.age?tr.age+'l':'—');
    // Klikalny link do klubu źródłowego/docelowego
    function clubLink(name,key){
      if(!name||name==='FA')return name==='FA'?'← FA':'';
      const c=(G.leagues||[]).flatMap(l=>l.clubs).find(x=>x.n===name);
      if(c)return (isBuy?'← ':'→ ')+'<span style="cursor:pointer;text-decoration:underline;color:var(--am)" onclick="event.stopPropagation();openClubModal('+c.id+')">'+name+'</span>';
      return (isBuy?'← ':'→ ')+name;
    }
    // retired:true jest jawnie zapisane na wpisie (match-post.js) — nie zależy od tego, czy
    // zawodnik nadal istnieje w danych (G.retiredPlayers jest przy zapisie gry przycinane,
    // patrz news-bootstrap.js). livePl.status pozostaje jako fallback dla starszych zapisów
    // sprzed wprowadzenia tej flagi.
    const dirStr=isBuy
      ?(tr.fromClub?clubLink(tr.fromClub):'← FA')
      :(tr.toClub?clubLink(tr.toClub):((tr.retired||(livePl&&livePl.status==='retired'))?'→ 🏁':'→ FA'));
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #0d1f0d;font-size:var(--fs-dense)">'+
      '<div style="display:flex;flex-direction:column;gap:1px;flex:1;min-width:0">'+
        '<div style="display:flex;gap:6px;align-items:center">'+icon+nameHtml+'</div>'+
        '<div style="color:var(--gr);font-size:var(--fs-dense)">'+(POS_SHORT[tr.pos]||tr.pos)+' • '+ageStr+' • <span style="color:var(--am)">'+dirStr+'</span></div>'+
      '</div>'+
      '<div style="text-align:right;flex-shrink:0;margin-left:8px">'+
        '<div style="color:'+(isBuy?'var(--rd)':'var(--gb)')+'">'+priceStr+'</div>'+
        '<div style="color:var(--gr);font-size:var(--fs-dense)">S'+tr.season+'</div>'+
      '</div>'+
    '</div>';
  }).join(''):'<div style="color:var(--gr);font-size:var(--fs-dense);padding:8px 0">'+t('tr_no_history')+'</div>';

  const isMyClub=club.id===G.myClubId;
  // ── ŻYWY ŚWIAT AI: bilans bezpośrednich starć z graczem ──────────────
  // Uwaga: G.mHist zapisuje kluby przez nazwę (hn/an), nie przez id — dopasowanie po nazwie,
  // spójnie z istniejącym clubLink() w logu transferów poniżej.
  const h2h=(()=>{
    if(isMyClub||!G.mHist||!G.mHist.length)return null;
    const games=G.mHist.filter(m=>m.isMyH?m.an===club.n:m.hn===club.n);
    if(!games.length)return null;
    let w=0,d=0,l=0;
    games.forEach(m=>{
      const myGoals=m.isMyH?m.hg:m.ag,oppGoals=m.isMyH?m.ag:m.hg;
      if(myGoals>oppGoals)w++;else if(myGoals<oppGoals)l++;else d++;
    });
    const last=games[games.length-1];
    const lastScore=last.isMyH?(last.hg+':'+last.ag):(last.ag+':'+last.hg);
    return{w,d,l,lastScore,lastSeason:last.season};
  })();
  // ── ŻYWY ŚWIAT AI: cel zarządu na bieżący sezon ───────────────────────
  const goal=ai.boardGoal;
  const goalHtml=(goal&&!isMyClub)?
    '<div style="background:var(--tb);border:1px solid '+(goal.achieved===true?'var(--gb)':goal.achieved===false?'var(--rd)':'var(--gl)')+';padding:8px 12px;margin-bottom:10px">'+
      '<div style="font-weight:700;font-size:var(--fs-h3);color:var(--am);letter-spacing:1px;margin-bottom:6px">'+t('cm_board_goal_title')+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--wh);margin-bottom:2px">'+t('world_goal_'+goal.type)+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+t('cm_board_goal_reward').replace('{val}','⭐ +'+goal.reward)+'</div>'+
      '<div style="font-size:var(--fs-dense);color:'+(goal.achieved===true?'var(--gb)':goal.achieved===false?'var(--rd)':'var(--am)')+'">'+
        (goal.achieved===true?t('cm_board_goal_done'):goal.achieved===false?t('cm_board_goal_failed'):t('cm_board_goal_pending'))+
      '</div>'+
    '</div>'
    :'';
  const h2hHtml=h2h?
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 12px;margin-bottom:10px">'+
      '<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gb);letter-spacing:1px;margin-bottom:6px">'+t('cm_h2h_title')+'</div>'+
      '<div style="display:flex;gap:10px;font-size:var(--fs-dense);margin-bottom:4px">'+
        '<span style="color:var(--gb)">'+t('cm_h2h_wins').replace('{n}',h2h.w)+'</span>'+
        '<span style="color:var(--gr)">'+t('cm_h2h_draws').replace('{n}',h2h.d)+'</span>'+
        '<span style="color:var(--rd)">'+t('cm_h2h_losses').replace('{n}',h2h.l)+'</span>'+
      '</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cm_h2h_last').replace('{score}',h2h.lastScore).replace('{season}',h2h.lastSeason)+'</div>'+
    '</div>'
    :'';
  el.innerHTML=
    // ── FILOZOFIA ──
    '<div style="background:#0d2b0d;border:1px solid var(--gb);padding:10px 12px;margin-bottom:10px">'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);line-height:1.4">'+def.icon+' '+def.desc+'</div>'+
    '</div>'+
    // ── STATYSTYKI (skrócone) ──
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 12px;margin-bottom:10px">'+
      (function(){const _tac=G.clubTactics&&G.clubTactics[club.id];return _tac?row2(t('cm_row_formation'),_tac.formation):'';})()+
      (avgOvr?row2(t('cm_row_avg_ovr'),avgOvr):'')+
      (avgAge!=null?row2(t('cm_row_avg_age'),t('cm_age_years').replace('{n}',avgAge)):'')+
      row2(t('cm_row_players'),squad.length)+
      (star?row2(t('cm_row_star'),'⭐ '+star.name+' ('+(POS_SHORT[star.pos]||star.pos)+')'):'')+
      (avgForm!=null?row2(t('cm_row_form'),avgForm+'%'):'')+
      row2(t('cm_row_squad_value'),fmtVal(squadValue))+
      row2(t('cm_row_reputation'),'⭐ '+repVal)+
    '</div>'+
    goalHtml+
    h2hHtml+
    // ── TRANSFERY ──
    (()=>{
      const seasons=log.map(t=>t.season).filter(Boolean);
      const sMin=seasons.length?Math.min(...seasons):null;
      const sMax=seasons.length?Math.max(...seasons):null;
      const range=sMin&&sMax?(sMin===sMax?' • S'+sMin:' • S'+sMin+'–S'+sMax):'';
      return '<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gb);letter-spacing:1px;margin-bottom:6px">'+t('cm_recent_transfers')+'<span style="color:var(--gr)">'+range+'</span></div>';
    })()+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:10px 12px">'+logHtml+'</div>';
}

function _renderClubSquad(clubId){
  const el=document.getElementById('cm-pane-sklad');if(!el||!G)return;
  const squad=G.players.filter(p=>p.clubId===clubId).sort((a,b)=>posOrd(a.pos)-posOrd(b.pos)||ovr(b)-ovr(a));
  if(!squad.length){el.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:12px">'+t('tr_no_players')+'</div>';return;}
  const starId=clubStarPlayer(squad).id;
  const club=ALL_CLUBS.find(c=>c.id===clubId)||{n:'?'};
  let html=
    '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#0d2b0d;border-bottom:2px solid var(--gb);cursor:pointer" onclick="openClubModal('+clubId+')">'+
      '<div style="font-size:var(--fs-meta);color:var(--am)">⬅ '+club.n+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">• '+t('cm_players_count').replace('{n}',squad.length)+'</div>'+
    '</div>';
  POS_GROUPS.forEach(pg=>{
    const grp=squad.filter(p=>p.pos===pg.key);if(!grp.length)return;
    html+='<div style="font-size:var(--fs-dense);color:var(--gb);background:#0d1f0d;padding:6px 12px;border-left:3px solid var(--gb);letter-spacing:2px">'+pg.short+' — '+t('posgrp_'+pg.key.toLowerCase())+'</div>';
    grp.forEach(p=>{
      const isStar=p.id===starId;
      html+='<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid #0d1f0d;'+(isStar?'background:#0d2b0d;':'')+'cursor:pointer" onclick="showById('+p.id+');">'+
        '<span class="cms-face-slot" data-pid="'+p.id+'" data-age="'+p.age+'" style="display:inline-block;line-height:0;flex-shrink:0"></span>'+
        '<div style="font-size:var(--fs-dense);color:var(--gr);width:28px;flex-shrink:0">'+(POS_SHORT[p.pos]||p.pos)+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:var(--fs-meta);color:'+(isStar?'var(--am)':'var(--wh)')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+
            (isStar?'⭐ ':'')+p.name+
          '</div>'+
          '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cm_age_years').replace('{n}',p.age)+'</div>'+
        '</div>'+
      '</div>';
    });
  });
  el.innerHTML=html;
  if(typeof pxFace==='function'){el.querySelectorAll('.cms-face-slot').forEach(function(sl){if(!sl.firstChild){sl.appendChild(pxFace(parseInt(sl.dataset.pid),2,parseInt(sl.dataset.age)||undefined));}});}
}

// Wyniki klubu z BIEŻĄCEGO sezonu — mecze gracza z G.mHist (trwałe) + mecze AI-AI z G._mHistAI
// (runtime-only, nieszczędny do zapisu — patrz SKIP w saveGame(), news-bootstrap.js)
function _renderClubMatches(clubId){
  const el=document.getElementById('cm-pane-wyniki');if(!el||!G)return;
  clubId=Number(clubId)||clubId;
  const club=ALL_CLUBS.find(c=>c.id===clubId)||{n:'?'};
  const rows=[];
  (G.mHist||[]).forEach((m,idx)=>{if(m.hn===club.n||m.an===club.n)rows.push({m,idx,src:'mHist'});});
  (G._mHistAI||[]).forEach((m,idx)=>{if(m.hn===club.n||m.an===club.n)rows.push({m,idx,src:'ai'});});
  if(!rows.length){el.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:12px">'+t('cm_matches_empty')+'</div>';return;}
  rows.sort((a,b)=>b.m.rnd-a.m.rnd);
  el.innerHTML=rows.map(row=>{
    const m=row.m;
    const isHome=m.hn===club.n;
    const oppName=isHome?m.an:m.hn;
    const oppClub=ALL_CLUBS.find(c=>c.n===oppName);
    const oppNameHtml=oppClub
      ?'<span style="cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();openClubModal('+oppClub.id+')">'+oppName+'</span>'
      :oppName;
    const myG=isHome?m.hg:m.ag,oppG=isHome?m.ag:m.hg;
    const resCol=myG>oppG?'var(--gb)':myG<oppG?'var(--rd)':'var(--am)';
    return '<div onclick="closeClubModal();showMatchDetail('+row.idx+',\''+row.src+'\')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-left:3px solid '+resCol+';border-bottom:1px solid #0d1f0d;cursor:pointer">'+
      '<span style="font-size:var(--fs-dense);color:var(--gr);width:52px;flex-shrink:0">'+t('lg_round_label').replace('{n}',m.rnd)+'</span>'+
      '<span style="font-size:var(--fs-dense);color:var(--gr);width:52px;flex-shrink:0">'+(isHome?t('hdr_home'):t('hdr_away'))+'</span>'+
      '<span style="flex:1;min-width:0;font-size:var(--fs-meta);color:var(--wh);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+oppNameHtml+'</span>'+
      '<span style="font-size:var(--fs-meta);color:'+resCol+';font-weight:700;flex-shrink:0">'+myG+'–'+oppG+'</span>'+
    '</div>';
  }).join('');
}

// Rysuje SVG wykresu OVR-w-czasie dla podanego okna sezonów (skala minO/maxO stała, niezależna od okna)
function _cmOvrChartSvg(clubId,winEntries,minO,maxO){
  var W=310,H=80,pL=26,pR=6,pT=8,pB=18;
  var iW=W-pL-pR,iH=H-pT-pB;
  function xO(i){return winEntries.length>1?pL+Math.round(i/(winEntries.length-1)*iW):pL+Math.round(iW/2);}
  function yO(v){return pT+Math.round((1-(v-minO)/(maxO-minO))*iH);}
  var svgO='';
  [minO,Math.round((minO+maxO)/2),maxO].forEach(function(v){
    var y=yO(v);
    svgO+='<line x1="'+pL+'" y1="'+y+'" x2="'+(W-pR)+'" y2="'+y+'" stroke="#1a2a1a" stroke-width="1"/>';
    svgO+='<text x="'+(pL-3)+'" y="'+(y+3)+'" fill="#3a5a3a" font-size="8" text-anchor="end">'+v+'</text>';
  });
  if(winEntries.length){
    var pts=winEntries.map(function(e,i){return xO(i)+','+yO(e.ovr);}).join(' ');
    svgO+='<polyline points="'+pts+'" fill="none" stroke="#4caf50" stroke-width="2" stroke-linejoin="round"/>';
    winEntries.forEach(function(e,i){
      var cx=xO(i),cy=yO(e.ovr);
      svgO+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="#81c784" stroke="var(--gd)" stroke-width="1"/>';
      svgO+='<text x="'+cx+'" y="'+(cy-5)+'" fill="#a5d6a7" font-size="9" text-anchor="middle">'+e.ovr+'</text>';
      svgO+='<text x="'+cx+'" y="'+(H-3)+'" fill="#3a5a3a" font-size="7" text-anchor="middle">S'+e.season+'</text>';
    });
  }
  return '<svg id="cm-ovr-svg-'+clubId+'" width="'+W+'" height="'+H+'" style="display:block;min-width:'+W+'px">'+svgO+'</svg>';
}

// Rysuje SVG wykresu punktów-per-sezon dla podanego okna sezonów (skala maxPts stała, niezależna od okna)
function _cmPtsChartSvg(clubId,winEntries,maxPts){
  var Wp=310,Hp=80,pLp=28,pRp=6,pTp=8,pBp=18;
  var iWp=Wp-pLp-pRp,iHp=Hp-pTp-pBp;
  var n=Math.max(1,winEntries.length);
  var barWp=Math.max(4,Math.floor(iWp/n)-2);
  var svgP='';
  [0,Math.round(maxPts/2),maxPts].forEach(function(v){
    var y=pTp+Math.round((1-v/maxPts)*iHp);
    svgP+='<line x1="'+pLp+'" y1="'+y+'" x2="'+(Wp-pRp)+'" y2="'+y+'" stroke="#1a2a1a" stroke-width="1"/>';
    svgP+='<text x="'+(pLp-3)+'" y="'+(y+3)+'" fill="#3a5a3a" font-size="8" text-anchor="end">'+v+'</text>';
  });
  winEntries.forEach(function(e,i){
    var x=pLp+Math.round(i/n*iWp)+(Math.round(iWp/n)-barWp)/2;
    var bH=Math.max(2,Math.round((e.pts||0)/maxPts*iHp));
    var y=pTp+iHp-bH;
    var col=e.pos===1?'#ffd700':e.pos<=3?'#4caf50':'#1565c0';
    svgP+='<rect x="'+Math.round(x)+'" y="'+y+'" width="'+barWp+'" height="'+bH+'" fill="'+col+'" opacity="0.85"/>';
    svgP+='<text x="'+(Math.round(x)+barWp/2)+'" y="'+(y-2)+'" fill="#ccc" font-size="9" text-anchor="middle">'+(e.pts||0)+'</text>';
    svgP+='<text x="'+(Math.round(x)+barWp/2)+'" y="'+(Hp-4)+'" fill="#3a5a3a" font-size="7" text-anchor="middle">S'+e.season+'</text>';
  });
  return '<svg id="cm-pts-svg-'+clubId+'" width="'+Wp+'" height="'+Hp+'" style="display:block;min-width:'+Wp+'px">'+svgP+'</svg>';
}

// Rysuje SVG wykresu transferów-per-sezon dla podanej listy sezonów (skala maxVal stała, niezależna od okna)
function _cmTfrChartSvg(clubId,seasonList,tfrBySeason,maxVal){
  var Wt=310,Ht=90,pLt=8,pRt=6,pTt=8,pBt=18;
  var iWt=Wt-pLt-pRt,iHt=(Ht-pTt-pBt)/2;
  var midY=pTt+iHt;
  var n=Math.max(1,seasonList.length);
  var barWt=Math.max(4,Math.floor(iWt/n)-2);
  var svgT='';
  svgT+='<line x1="'+pLt+'" y1="'+midY+'" x2="'+(Wt-pRt)+'" y2="'+midY+'" stroke="#2a4a2a" stroke-width="1"/>';
  seasonList.forEach(function(s,i){
    var x=pLt+Math.round(i/n*iWt)+(Math.round(iWt/n)-barWt)/2;
    var d=tfrBySeason[s]||{spent:0,earned:0};
    var hSpent=Math.max(2,Math.round(d.spent/maxVal*iHt));
    svgT+='<rect x="'+Math.round(x)+'" y="'+(midY-hSpent)+'" width="'+Math.round(barWt*0.45)+'" height="'+hSpent+'" fill="#f44336" opacity="0.85"/>';
    var hEarned=Math.max(2,Math.round(d.earned/maxVal*iHt));
    svgT+='<rect x="'+(Math.round(x)+Math.round(barWt*0.5))+'" y="'+midY+'" width="'+Math.round(barWt*0.45)+'" height="'+hEarned+'" fill="#4caf50" opacity="0.85"/>';
    svgT+='<text x="'+(Math.round(x)+barWt/2)+'" y="'+(Ht-4)+'" fill="#3a5a3a" font-size="7" text-anchor="middle">S'+s+'</text>';
  });
  return '<svg id="cm-tfr-svg-'+clubId+'" width="'+Wt+'" height="'+Ht+'" style="display:block;min-width:'+Wt+'px">'+svgT+'</svg>';
}

// Handler suwaka sezonów (oninput na <input type="range">) — przesuwa okno widoczne na wszystkich wykresach historii klubu
function _cmHistSlide(clubId,val){
  clubId=Number(clubId)||clubId;
  var c=_cmHistCache[clubId];if(!c)return;
  var start=Math.max(0,Math.min(parseInt(val,10)||0,c.winMaxStart));
  var win=c.entries.slice(start,start+CM_HIST_WIN);
  if(!win.length)return;
  var ovrWin=win.filter(function(e){return e.ovr>0;});
  var ovrEl=document.getElementById('cm-ovr-svg-'+clubId);
  if(ovrEl)ovrEl.outerHTML=_cmOvrChartSvg(clubId,ovrWin,c.minO,c.maxO);
  var ptsEl=document.getElementById('cm-pts-svg-'+clubId);
  if(ptsEl)ptsEl.outerHTML=_cmPtsChartSvg(clubId,win,c.maxPts);
  var tfrEl=document.getElementById('cm-tfr-svg-'+clubId);
  if(tfrEl&&c.tfrSeasons){
    var seasonFrom=win[0].season,seasonTo=win[win.length-1].season;
    var tfrWin=c.tfrSeasons.filter(function(s){return s>=seasonFrom&&s<=seasonTo;});
    tfrEl.outerHTML=_cmTfrChartSvg(clubId,tfrWin,c.tfrBySeason,c.tfrMaxVal);
  }
  var lbl=document.getElementById('cm-hist-range-'+clubId);
  if(lbl)lbl.textContent='S'+win[0].season+'–S'+win[win.length-1].season;
}

// ── Komponenty historii klubu współdzielone z panelem Historii gracza (traits-history.js:
// renderHistSezony/renderHistDynastia) — jeden wygląd karty klubu (Historia→Przegląd) i
// panelu gracza (Historia→Dynastia/Sezony), bez dwóch osobnych implementacji do pilnowania.
function _cmSecHead(icon,label,col){
  return '<div style="font-weight:700;font-size:var(--fs-h3);color:'+(col||'var(--gb)')+';letter-spacing:1px;margin:12px 0 6px">'+icon+' '+label+'</div>';
}

function _cmSquadOvrForSeason(clubId,season){
  var allP=[].concat(G.players||[],G.retiredPlayers||[],G.fa||[]);
  var members=allP.filter(function(p){
    return p.history&&p.history.some(function(hh){
      return hh.season===season&&hh.clubId===clubId&&!hh._placeholder;
    });
  });
  if(!members.length)return 0;
  var ovrSum=members.reduce(function(s,p){
    var ph=p.history.find(function(hh){return hh.season===season&&hh.clubId===clubId;});
    return s+(ph&&ph.ovr?ph.ovr:ovr(p));
  },0);
  return Math.round(ovrSum/members.length);
}

function _cmSeasonSliderHtml(clubId,windowEntries,winMaxStart,winStart){
  if(!windowEntries.length)return '';
  return '<div style="margin:10px 0 6px;padding:6px 8px;background:var(--tb);border:1px solid var(--gl)">'+
      '<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+
        '<span>'+t('cm_season_slider_label')+'</span>'+
        '<span id="cm-hist-range-'+clubId+'" style="color:var(--am);font-weight:700">S'+windowEntries[0].season+'–S'+windowEntries[windowEntries.length-1].season+'</span>'+
      '</div>'+
      '<input type="range" min="0" max="'+winMaxStart+'" step="1" value="'+winStart+'" oninput="_cmHistSlide('+clubId+',this.value)" style="width:100%;accent-color:var(--gb)">'+
    '</div>';
}

function _cmStatsRowHtml(leagueTitles,cupWins,promotions,relegations){
  function statBox(label,val,col){
    return '<div style="flex:1;min-width:0;background:var(--tb);border:1px solid var(--gl);padding:8px 6px;text-align:center">'+
      '<div style="font-size:var(--fs-display);color:'+(col||'var(--am)')+'">'+val+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);line-height:1.3;white-space:pre-line">'+label+'</div>'+
    '</div>';
  }
  return '<div style="display:flex;gap:5px;margin-bottom:6px">'+
      statBox(t('cm_stat_league_titles'),leagueTitles,'var(--am)')+
      statBox(t('cm_stat_cups'),cupWins,'#e040fb')+
      statBox(t('cm_stat_promotions'),promotions,'var(--gb)')+
      statBox(t('cm_stat_relegations'),relegations,'var(--rd)')+
    '</div>';
}

// entries: [{season,w,d,l,...}] — bilans liczony tylko z meczów ligowych (spójnie z tabelą sezonów)
function _cmRecordHtml(entries){
  var totW=0,totD=0,totL=0;
  entries.forEach(function(e){totW+=e.w||0;totD+=e.d||0;totL+=e.l||0;});
  var totM=totW+totD+totL;
  if(totM<=0)return '';
  var pW=Math.round(totW/totM*100),pD=Math.round(totD/totM*100),pL=100-pW-pD;
  return _cmSecHead('⚔',t('cm_record_title'),'var(--gb)')+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:9px 10px;margin-bottom:4px">'+
      '<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense);margin-bottom:8px">'+
        '<div style="text-align:center;flex:1"><div style="font-weight:700;color:var(--gb)">'+t('cm_h2h_wins').replace('{n}',totW)+'</div><div style="color:var(--gr);font-size:var(--fs-dense)">'+pW+'%</div></div>'+
        '<div style="text-align:center;flex:1"><div style="font-weight:700;color:var(--gr)">'+t('cm_h2h_draws').replace('{n}',totD)+'</div><div style="color:var(--gr);font-size:var(--fs-dense)">'+pD+'%</div></div>'+
        '<div style="text-align:center;flex:1"><div style="font-weight:700;color:var(--rd)">'+t('cm_h2h_losses').replace('{n}',totL)+'</div><div style="color:var(--gr);font-size:var(--fs-dense)">'+pL+'%</div></div>'+
      '</div>'+
      '<div style="height:10px;display:flex;overflow:hidden;border:1px solid #0d1f0d">'+
        '<span style="width:'+pW+'%;background:var(--gb)"></span>'+
        '<span style="width:'+pD+'%;background:var(--gr)"></span>'+
        '<span style="width:'+pL+'%;background:var(--rd)"></span>'+
      '</div>'+
      '<div style="margin-top:6px;font-size:var(--fs-dense);color:var(--gr);text-align:right">'+t('cm_record_total').replace('{n}',totM).replace('{from}',entries[0].season).replace('{to}',entries[entries.length-1].season)+'</div>'+
    '</div>';
}

// allTrophies: [{type:'league'|'cup',season,lg}] — lg (poziom ligi) tylko dla type==='league'
function _cmTrophyTimelineHtml(allTrophies){
  if(!allTrophies.length)return '';
  var bySeason={};
  allTrophies.forEach(function(tr){
    if(!bySeason[tr.season])bySeason[tr.season]=[];
    bySeason[tr.season].push(tr);
  });
  var trophySeasons=Object.keys(bySeason).map(Number).sort(function(a,b){return b-a;});
  var tlRows='';
  trophySeasons.forEach(function(season,idx){
    var trs=bySeason[season];
    var isTop=trs.some(function(tr){return tr.type==='league'&&Number(tr.lg)===1;});
    var isDouble=trs.length>1;
    var dotCol=trs.some(function(tr){return tr.type==='league';})?'var(--am)':'#e040fb';
    var cardBorder=isTop?'var(--am)':'var(--gl)';
    var linesHtml=trs.map(function(tr){
      var icon=tr.type==='cup'?'🥇':'👑';
      var label=tr.type==='cup'?t('cm_trophy_cup'):(t('cm_legend_champion')+(tr.lg?' '+(LEAGUE_NAMES[tr.lg]||''):''));
      return '<div style="color:'+(isTop?'var(--am)':'var(--wh)')+'">'+icon+' '+label+'</div>';
    }).join('');
    tlRows+='<div style="position:relative;padding-bottom:11px">'+
      '<div style="position:absolute;left:-15px;top:2px;width:10px;height:10px;border-radius:50%;background:var(--gd);border:2px solid '+dotCol+'"></div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:2px">S'+season+'</div>'+
      '<div style="background:var(--tb);border:1px solid '+cardBorder+';padding:5px 8px;font-size:var(--fs-dense);display:flex;justify-content:space-between;align-items:center;gap:6px">'+
        '<div>'+linesHtml+'</div>'+
        (isDouble?'<span style="font-size:9px;color:var(--gd);background:var(--gb);padding:1px 5px;font-weight:700;flex-shrink:0">'+t('cm_trophy_double')+'</span>':'')+
      '</div>'+
    '</div>';
    var nextSeason=trophySeasons[idx+1];
    if(nextSeason!=null&&season-nextSeason>1){
      var gapFrom=nextSeason+1,gapTo=season-1;
      var gapLabel=gapFrom===gapTo?
        t('cm_trophy_gap_single').replace('{n}',gapFrom):
        t('cm_trophy_gap_range').replace('{a}',gapFrom).replace('{b}',gapTo);
      tlRows+='<div style="padding-bottom:11px;font-size:var(--fs-dense);color:var(--gr);font-style:italic">— '+gapLabel+' —</div>';
    }
  });
  return _cmSecHead('🏆',t('cm_trophies'),'var(--am)')+
    '<div style="position:relative;padding-left:20px">'+
      '<div style="position:absolute;left:5px;top:4px;bottom:4px;width:1px;background:var(--gl)"></div>'+
      tlRows+
    '</div>';
}

function _renderClubHistory(clubId){
  var el=document.getElementById('cm-pane-historia');if(!el||!G)return;
  clubId=Number(clubId)||clubId;
  // Własny klub: te same dane teraz mieszkają w panelu Historia gracza — wykresy OVR/punkty
  // na górze zakładki Sezony, a Dynastia wygląda tak jak ten Przegląd (patrz traits-history.js:
  // renderHistSezony/renderHistDynastia). Zamiast dublować, od razu tam przenosimy.
  if(Number(clubId)===Number(G.myClubId)){
    _cmGoToPlayerHistory(clubId);
    return;
  }

  // ── Zbierz dane z lgHist ────────────────────────────────────────────
  var entries=[];
  if(G.lgHist){
    Object.keys(G.lgHist).forEach(function(lvl){
      (G.lgHist[lvl]||[]).forEach(function(h){
        var row=h.table&&h.table.find(function(r){return r.cid===clubId;});
        if(row){
          entries.push({season:h.season,pos:row.pos,total:h.table.length,pts:row.pts||0,
            w:row.w||0,d:row.d||0,l:row.l||0,gf:row.gf||0,ga:row.ga||0,
            lg:Number(lvl),ovr:_cmSquadOvrForSeason(clubId,h.season)});
        }
      });
    });
  }
  entries.sort(function(a,b){return a.season-b.season;});

  // ── Okno sezonów widoczne na wykresach OVR/punkty + suwak (od S1, gdy sezonów dużo) ──
  var ovrEntriesAll=entries.filter(function(e){return e.ovr>0;});
  var winMaxStart=Math.max(0,entries.length-CM_HIST_WIN);
  var hasHistSlider=entries.length>CM_HIST_WIN;
  var winStart=winMaxStart; // domyślnie: najnowsze sezony, suwak cofa do S1
  var windowEntries=hasHistSlider?entries.slice(winStart,winStart+CM_HIST_WIN):entries;
  _cmHistCache[clubId]={entries:entries,minO:null,maxO:null,maxPts:null,winMaxStart:winMaxStart};

  var sliderHtml=hasHistSlider?_cmSeasonSliderHtml(clubId,windowEntries,winMaxStart,winStart):'';

  // ── 1. Wykres OVR w czasie ──────────────────────────────────────────
  var ovrHtml='';
  if(ovrEntriesAll.length>=2){
    var minO=Math.max(10,Math.min.apply(null,ovrEntriesAll.map(function(e){return e.ovr;}))-3);
    var maxO=Math.min(99,Math.max.apply(null,ovrEntriesAll.map(function(e){return e.ovr;}))+3);
    _cmHistCache[clubId].minO=minO;
    _cmHistCache[clubId].maxO=maxO;
    var ovrWindowEntries=windowEntries.filter(function(e){return e.ovr>0;});
    ovrHtml=_cmSecHead('📈',t('cm_chart_ovr_time'),'var(--gb)')+
      '<div style="background:var(--tb);border:1px solid var(--gl);padding:6px 4px;overflow-x:auto">'+
        _cmOvrChartSvg(clubId,ovrWindowEntries,minO,maxO)+
      '</div>';
  }

  // ── 2. Wykres punktów per sezon ─────────────────────────────────────
  var ptsHtml='';
  if(entries.length>=2){
    var maxPts=Math.max.apply(null,entries.map(function(e){return e.pts||0;}));
    if(maxPts<1)maxPts=1;
    _cmHistCache[clubId].maxPts=maxPts;
    ptsHtml=_cmSecHead('🏅',t('cm_chart_pts_season'),'var(--am)')+
      '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+
        '<span style="color:#ffd700">■</span> '+t('cm_legend_champion')+' &nbsp;<span style="color:#4caf50">■</span> '+t('cm_legend_podium')+' &nbsp;<span style="color:#1565c0">■</span> '+t('cm_legend_other')+
      '</div>'+
      '<div style="background:var(--tb);border:1px solid var(--gl);padding:6px 4px;overflow-x:auto">'+
        _cmPtsChartSvg(clubId,windowEntries,maxPts)+
      '</div>';
  }

  // ── Trofea klubu ──────────────────────────────────────────────────────
  // Ligowe z entries (lgHist, zawiera wszystkie kluby), pucharowe z G.cupHistory (zawiera wszystkich zwyciezców)
  var leagueTrophiesFromHistory=entries
    .filter(function(e){return e.pos===1;})
    .map(function(e){return {type:'league',place:1,season:e.season,lg:e.lg};});
  var cupTrophiesFromHistory=(G.cupHistory||[])
    .filter(function(h){return h.winner&&parseInt(h.winner.cid)===parseInt(clubId);})
    .map(function(h){return {type:'cup',place:1,season:h.season};});
  var allTrophies=leagueTrophiesFromHistory.concat(cupTrophiesFromHistory);

  // ── Statystyki + bilans meczów ────────────────────────────────────────
  var leagueTitles=entries.filter(function(e){return e.pos===1;}).length;
  var cupWins=allTrophies.filter(function(t){return t.type==='cup';}).length;
  var promotions=0,relegations=0;
  for(var _ei=1;_ei<entries.length;_ei++){
    if(entries[_ei].lg<entries[_ei-1].lg)promotions++;
    if(entries[_ei].lg>entries[_ei-1].lg)relegations++;
  }
  var statsHtml=_cmStatsRowHtml(leagueTitles,cupWins,promotions,relegations);
  var recordHtml=_cmRecordHtml(entries);

  // ── 3. Mapa transferów ──────────────────────────────────────────────
  var tfrHtml='';
  var clubObj=G.clubs&&G.clubs.find(function(c){return c.id===clubId;});
  var tLog=(clubObj&&clubObj.ai&&clubObj.ai.transferLog)||[];
  if(tLog.length>=2){
    var tfrBySeason={};
    tLog.forEach(function(t){
      var s=t.season||0;
      if(!tfrBySeason[s])tfrBySeason[s]={spent:0,earned:0};
      if(t.type==='buy')tfrBySeason[s].spent+=t.price||0;
      if(t.type==='sell')tfrBySeason[s].earned+=t.price||0;
    });
    var tfrSeasons=Object.keys(tfrBySeason).map(Number).sort(function(a,b){return a-b;});
    if(tfrSeasons.length>=2){
      var maxVal=Math.max.apply(null,tfrSeasons.map(function(s){return Math.max(tfrBySeason[s].spent,tfrBySeason[s].earned);}));
      if(maxVal<1)maxVal=1;
      _cmHistCache[clubId].tfrBySeason=tfrBySeason;
      _cmHistCache[clubId].tfrSeasons=tfrSeasons;
      _cmHistCache[clubId].tfrMaxVal=maxVal;
      // Ogranicz do tego samego okna sezonów co wykresy OVR/punkty (gdy dostępne)
      var tfrWindow=tfrSeasons;
      if(windowEntries.length){
        var seasonFrom=windowEntries[0].season,seasonTo=windowEntries[windowEntries.length-1].season;
        tfrWindow=tfrSeasons.filter(function(s){return s>=seasonFrom&&s<=seasonTo;});
      }
      tfrHtml=_cmSecHead('💸',t('cm_chart_transfers_season'),'#e040fb')+
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+
          '<span style="color:#f44336">■</span> '+t('cm_legend_spent')+' &nbsp;<span style="color:#4caf50">■</span> '+t('cm_legend_earned')+
        '</div>'+
        '<div style="background:var(--tb);border:1px solid var(--gl);padding:6px 4px;overflow-x:auto">'+
          _cmTfrChartSvg(clubId,tfrWindow,tfrBySeason,maxVal)+
        '</div>';
    }
  }

  // ── 4. Legendy klubu ────────────────────────────────────────────────
  var legendsHtml='';
  var allPlayers=[].concat(G.players||[],G.retiredPlayers||[],G.fa||[]);
  var clubLegends=[];
  allPlayers.forEach(function(p){
    var clubSeasons=(p.history||[]).filter(function(h){
      return h.clubId===clubId&&!h._placeholder&&(h.m||0)>0;
    });
    if(clubSeasons.length>0){
      var totalM=clubSeasons.reduce(function(s,h){return s+(h.m||0);},0);
      var totalG=clubSeasons.reduce(function(s,h){return s+(h.g||0);},0);
      var totalA=clubSeasons.reduce(function(s,h){return s+(h.a||0);},0);
      // trofea zdobyte w tym klubie
      var lgWins=clubSeasons.filter(function(h){
        return entries.some(function(e){return e.season===h.season&&e.pos===1;});
      }).length;
      var cupWinsP=(G.trophies||[]).filter(function(t){
        return t.type==='cup'&&t.place===1&&(
          t.clubId===clubId||(t.clubName&&(function(){var c=ALL_CLUBS.find(function(x){return x.id===clubId;});return c&&c.n===t.clubName;})())
        )&&clubSeasons.some(function(h){return h.season===t.season;});
      }).length;
      var score=Math.round((
        Math.min(totalM*LEG_W,75)+
        Math.min(totalG*LEG_G,50)+
        Math.min(totalA*LEG_A,30)+
        lgWins*LEG_M+
        cupWinsP*LEG_P
      )*10)/10;
      if(score>0)clubLegends.push({name:p.name,id:p.id,score:score});
    }
  });
  clubLegends.sort(function(a,b){return b.score-a.score;});
  var trueLegends=clubLegends.filter(function(p){return p.score>=LEG_THRESHOLD;});
  legendsHtml=_cmSecHead('⭐',t('cm_club_legends'),'var(--am)');
  if(trueLegends.length){
    legendsHtml+='<div style="background:var(--tb);border:1px solid var(--gl);padding:6px 10px">'+
      trueLegends.slice(0,5).map(function(p,idx){
        var medal=idx===0?'🥇 ':idx===1?'🥈 ':idx===2?'🥉 ':'';
        return '<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #0d1f0d">'+
          '<div style="display:flex;justify-content:space-between;align-items:baseline">'+
            '<span style="font-size:var(--fs-meta);color:var(--am);cursor:pointer" onclick="showById('+p.id+')">'+medal+p.name+' ⭐</span>'+
            '<span style="font-size:var(--fs-meta);color:var(--am)">'+t('dc_klub_pts_suffix').replace('{n}',p.score)+'</span>'+
          '</div>'+
        '</div>';
      }).join('')+
      '</div>';
  } else {
    legendsHtml+='<div style="background:var(--tb);border:1px solid var(--gl);padding:10px 12px;color:var(--gr);font-size:var(--fs-meta)">'+t('cm_no_legends')+'</div>';
  }

  // ── Trofea — oś czasu (najnowsze u góry, dublety liga+puchar w jednym sezonie łączone) ──
  var trophyHtml=_cmTrophyTimelineHtml(allTrophies);

  // ── Tabela ostatnich sezonów ─────────────────────────────────────────
  var tableHtml='';
  if(entries.length){
    var rows=entries.slice(); // od S1, wszystkie sezony
    tableHtml=_cmSecHead('📋',t('cm_recent_seasons'),'var(--gb)')+
      '<div style="background:var(--tb);border:1px solid var(--gl)">'+
      '<div style="display:grid;grid-template-columns:32px 28px 1fr 36px 36px 36px;font-size:var(--fs-dense);color:var(--gr);padding:4px 8px;border-bottom:1px solid var(--gl)">'+
        '<span>'+t('cm_th_season')+'</span><span>'+t('dc_kadra_col_pos')+'</span><span>'+t('plr_hist_league')+'</span><span style="text-align:center">M</span><span style="text-align:center">G</span><span style="text-align:center">'+t('tbl_col_pts')+'</span>'+
      '</div>'+
      rows.map(function(e){
        var posCol=e.pos===1?'var(--am)':e.pos<=3?'var(--gb)':e.pos>=e.total-1?'var(--rd)':'var(--wh)';
        var lgShort=_leagueNamesShortMap()[e.lg]||('L'+e.lg);
        var trophy=e.pos===1?'👑':'';
        return '<div style="display:grid;grid-template-columns:32px 28px 1fr 36px 36px 36px;font-size:var(--fs-dense);padding:5px 8px;border-bottom:1px solid #0d1f0d;align-items:center">'+
          '<span style="color:var(--gr)">S'+e.season+'</span>'+
          '<span style="color:'+posCol+';font-weight:bold">'+trophy+e.pos+'.</span>'+
          '<span style="color:var(--gr);font-size:var(--fs-dense);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">'+lgShort+'</span>'+
          '<span style="text-align:center;color:var(--wh)">'+(e.w+e.d+e.l)+'</span>'+
          '<span style="text-align:center;color:var(--gr)">'+(e.gf||0)+':'+(e.ga||0)+'</span>'+
          '<span style="text-align:center;color:var(--am)">'+(e.pts||0)+'</span>'+
        '</div>';
      }).join('')+
      '</div>';
  }

  function innerTabBtn(id,icon,label,active){
    return '<button id="cm-htab-'+id+'" onclick="_cmHistInnerTab(\''+id+'\')" style="flex:1;padding:8px 4px;background:none;border:none;border-bottom:2px solid '+(active?'var(--am)':'transparent')+';font-weight:700;font-size:var(--fs-micro);color:'+(active?'var(--am)':'var(--gr)')+';cursor:pointer">'+icon+' '+label+'</button>';
  }

  var overviewHtml=statsHtml+recordHtml+trophyHtml+legendsHtml;
  var seasonsHtml=sliderHtml+ovrHtml+ptsHtml+tfrHtml+tableHtml;

  el.innerHTML=
    '<div style="display:flex;border-bottom:1px solid var(--gl);margin-bottom:10px">'+
      innerTabBtn('przeglad','🏆',t('cm_tab_overview'),true)+
      innerTabBtn('sezony','📅',t('cm_recent_seasons'),false)+
    '</div>'+
    '<div id="cm-hist-pane-przeglad" style="display:block">'+overviewHtml+'</div>'+
    '<div id="cm-hist-pane-sezony" style="display:none">'+seasonsHtml+'</div>';
}

// Przełącznik podzakładek Przegląd/Sezony wewnątrz zakładki Historia (klub AI) — chowa/pokazuje
// gotowe drzewo DOM zamiast przerenderowywać, żeby nie gubić stanu suwaka sezonów.
function _cmHistInnerTab(id){
  ['przeglad','sezony'].forEach(function(k){
    var btn=document.getElementById('cm-htab-'+k);
    var pane=document.getElementById('cm-hist-pane-'+k);
    var active=(k===id);
    if(btn){btn.style.borderBottom=active?'2px solid var(--am)':'2px solid transparent';btn.style.color=active?'var(--am)':'var(--gr)';}
    if(pane)pane.style.display=active?'block':'none';
  });
}

// Przekierowanie z zakładki Historia własnego klubu (karta drużyny) do panelu Historii gracza,
// od razu na Dynastię — patrz wczesny return w _renderClubHistory() dla własnego klubu.
// Zapamiętuje punkt powrotu (window._historyPanelReturn, konsumowany w closePanel() —
// navigation-squad.js), żeby przycisk WRÓĆ w panelu Historii wrócił do karty klubu, z której
// przyszliśmy, zamiast do dashboardu — ten sam wzorzec co window._clubModalReturn/
// _playerReturnTo używane gdzie indziej w tym pliku.
// UWAGA: zakładka powrotu MUSI być inna niż 'historia' — dla własnego klubu ta zakładka nie
// renderuje już nic, tylko wywołuje TĘ funkcję (patrz _renderClubHistory), więc powrót na
// 'historia' natychmiast odpalałby przekierowanie drugi raz i zamykał panel, który właśnie
// otworzyliśmy (zgłoszony bug: "z Dynastii WRÓĆ nigdzie nie wraca" — pętla cmTab('historia')
// → _cmGoToPlayerHistory() → closeClubModal()+openPanel('p-history') w kółko).
function _cmGoToPlayerHistory(clubId){
  closeClubModal();
  openPanel('p-history');
  var btn=document.querySelector('#p-history .tab-btn[data-tab="dynastia"]');
  if(btn)histTab('dynastia',btn);
  window._historyPanelReturn={clubId:clubId,tab:'karta'};
}

function _renderClubNews(clubId){
  const el=document.getElementById('cm-pane-newsy');if(!el||!G)return;
  clubId=Number(clubId)||clubId;
  const list=(G.worldNews||[]).filter(n=>n.clubId===clubId);
  if(!list.length){
    el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);text-align:center;padding:20px">'+t('cm_news_empty')+'</div>';
    return;
  }
  el.innerHTML=list.map(_worldNewsItemHtml).join('');
}

function openClubSquad(clubId){
  clubId=Number(clubId)||clubId;
  const club=ALL_CLUBS.find(c=>c.id==clubId)||(G.standing&&G.standing.find(s=>s.cid==clubId)&&{id:clubId,n:G.standing.find(s=>s.cid==clubId).n});
  if(!club)return;
  const starters=G.players.filter(p=>p.clubId==clubId&&p.starter);
  const avgOvr=starters.length?Math.round(starters.reduce((s,p)=>s+ovr(p),0)/starters.length):0;
  document.getElementById('cs-title').textContent=club.n.toUpperCase()+(avgOvr?' • OVR '+avgOvr:'');
  document.getElementById('cs-club-name').textContent=club.n;
  // Aktualna liga i miejsce
  let infoBar=document.getElementById('cs-info-bar');
  if(!infoBar){
    infoBar=document.createElement('div');
    infoBar.id='cs-info-bar';
    infoBar.style.cssText='font-size:var(--fs-meta);padding:5px 12px;background:#0d1f0d;border-bottom:1px solid var(--gl);';
    const topBar=document.querySelector('#p-club-squad .sq-top-bar');
    if(topBar)topBar.parentNode.insertBefore(infoBar,topBar);
  }
  const lg=G.leagues&&G.leagues.find(l=>l.clubs.some(c=>c.id==clubId));
  const lgName=lg?(LEAGUE_NAMES[lg.level]||lg.name):'';
  const lgSt=G.allStandings&&lg?[...(G.allStandings[lg.level]||[])].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)):[];
  const stRow=lgSt.find(s=>s.cid==clubId);
  const pos=lgSt.findIndex(s=>s.cid==clubId)+1;
  if(lgName&&pos>0){
    infoBar.style.display='block';
    infoBar.innerHTML='<span style="color:var(--gb)">'+lgName+'</span> &nbsp;•&nbsp; <span style="color:var(--am)">'+t('cm_position_label').replace('{pos}',pos)+'</span>';
  } else {
    infoBar.style.display='none';
  }
  const players=G.players.filter(p=>p.clubId==clubId).sort((a,b)=>posOrd(a.pos)-posOrd(b.pos));
  document.getElementById('cs-count').textContent=t('cm_players_count').replace('{n}',players.length);
  const con=document.getElementById('cs-all');
  con.innerHTML='';
  POS_GROUPS.forEach(pg=>{
    const grp=players.filter(p=>p.pos===pg.key);if(!grp.length)return;
    const hdr=document.createElement('div');hdr.className='sq-pos-hdr2';
    hdr.innerHTML='<span style="font-size:var(--fs-dense)">'+pg.short+' — '+t('posgrp_'+pg.key.toLowerCase())+'</span>';
    con.appendChild(hdr);
    grp.forEach(p=>{
      const d=document.createElement('div');
      d.className='pcard2 '+(p.starter?'st':'bn');
      const o=ovr(p);
      d.innerHTML='<div style="flex:1;min-width:0">'+
        '<div class="pc2-name-text">'+p.name+'</div>'+
        '<div class="pc2-row2">'+t('cm_age_years').replace('{n}',p.age)+' • <span class="pc2-ovr-green">OVR '+o+'</span></div>'+
        '</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--gr);white-space:nowrap">'+
          (p.pos==='GK'?'📅 '+p.st.m+' 🛡️ '+(p.st.cs||0):'📅 '+p.st.m+' ⚽ '+p.st.g+' 🤝 '+p.st.a)+
        '</div>';
      d.onclick=()=>{showPlayer(p);};
      con.appendChild(d);
    });
  });
  const csp=document.getElementById('p-club-squad');
  if(csp){csp.classList.add('open');}
}


