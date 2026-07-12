let _cmClubId=null;

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
    const myClub=G.myClub||{n:t('cm_fallback_myclub')};
    document.getElementById('cm-title').textContent=myClub.n.toUpperCase();
    document.getElementById('cm-subtitle').textContent=t('cm_your_club')+' • '+(LEAGUE_NAMES[G.myLeague]||'');
    var _cmCr=document.getElementById('cm-px-crest');if(_cmCr&&typeof pxCrest==='function'){_cmCr.innerHTML='';_cmCr.appendChild(pxCrest(G.myClubId,4));}
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
    const dirStr=isBuy
      ?(tr.fromClub?clubLink(tr.fromClub):'← FA')
      :(tr.toClub?clubLink(tr.toClub):(livePl&&livePl.status==='retired'?'→ 🏁':'→ FA'));
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
    const myG=isHome?m.hg:m.ag,oppG=isHome?m.ag:m.hg;
    const resCol=myG>oppG?'var(--gb)':myG<oppG?'var(--rd)':'var(--am)';
    return '<div onclick="closeClubModal();showMatchDetail('+row.idx+',\''+row.src+'\')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-left:3px solid '+resCol+';border-bottom:1px solid #0d1f0d;cursor:pointer">'+
      '<span style="font-size:var(--fs-dense);color:var(--gr);width:52px;flex-shrink:0">'+t('lg_round_label').replace('{n}',m.rnd)+'</span>'+
      '<span style="font-size:var(--fs-dense);color:var(--gr);width:52px;flex-shrink:0">'+(isHome?t('hdr_home'):t('hdr_away'))+'</span>'+
      '<span style="flex:1;min-width:0;font-size:var(--fs-meta);color:var(--wh);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+oppName+'</span>'+
      '<span style="font-size:var(--fs-meta);color:'+resCol+';font-weight:700;flex-shrink:0">'+myG+'–'+oppG+'</span>'+
    '</div>';
  }).join('');
}

function _renderClubHistory(clubId){
  var el=document.getElementById('cm-pane-historia');if(!el||!G)return;
  clubId=Number(clubId)||clubId;

  // ── Zbierz dane z lgHist ────────────────────────────────────────────
  var entries=[];
  if(G.lgHist){
    Object.keys(G.lgHist).forEach(function(lvl){
      (G.lgHist[lvl]||[]).forEach(function(h){
        var row=h.table&&h.table.find(function(r){return r.cid===clubId;});
        if(row){
          var squadOvr=0;
          var allP=[].concat(G.players||[],G.retiredPlayers||[],G.fa||[]);
          var members=allP.filter(function(p){
            return p.history&&p.history.some(function(hh){
              return hh.season===h.season&&hh.clubId===clubId&&!hh._placeholder;
            });
          });
          if(members.length){
            var ovrSum=members.reduce(function(s,p){
              var ph=p.history.find(function(hh){return hh.season===h.season&&hh.clubId===clubId;});
              return s+(ph&&ph.ovr?ph.ovr:ovr(p));
            },0);
            squadOvr=Math.round(ovrSum/members.length);
          }
          entries.push({season:h.season,pos:row.pos,total:h.table.length,pts:row.pts||0,
            w:row.w||0,d:row.d||0,l:row.l||0,gf:row.gf||0,ga:row.ga||0,
            lg:Number(lvl),ovr:squadOvr});
        }
      });
    });
  }
  entries.sort(function(a,b){return a.season-b.season;});

  // ── Trofea klubu ────────────────────────────────────────────────────
  // Ligowe z entries (lgHist, zawiera wszystkie kluby), pucharowe z G.cupHistory (zawiera wszystkich zwyciezców)
  var leagueTrophiesFromHistory=entries
    .filter(function(e){return e.pos===1;})
    .map(function(e){return {type:'league',place:1,season:e.season,lg:e.lg};});
  var cupTrophiesFromHistory=(G.cupHistory||[])
    .filter(function(h){return h.winner&&parseInt(h.winner.cid)===parseInt(clubId);})
    .map(function(h){return {type:'cup',place:1,season:h.season};});
  var allTrophies=leagueTrophiesFromHistory.concat(cupTrophiesFromHistory);

  // ── Statystyki ──────────────────────────────────────────────────────
  var bestPos=entries.length?Math.min.apply(null,entries.map(function(e){return e.pos;})):null;
  var worstPos=entries.length?Math.max.apply(null,entries.map(function(e){return e.pos;})):null;
  var leagueTitles=entries.filter(function(e){return e.pos===1;}).length;
  var cupWins=allTrophies.filter(function(t){return t.type==='cup';}).length;
  var promotions=0,relegations=0;
  for(var _ei=1;_ei<entries.length;_ei++){
    if(entries[_ei].lg<entries[_ei-1].lg)promotions++;
    if(entries[_ei].lg>entries[_ei-1].lg)relegations++;
  }

  function statBox(label,val,col){
    return '<div style="flex:1;min-width:0;background:var(--tb);border:1px solid var(--gl);padding:8px 6px;text-align:center">'+
      '<div style="font-size:var(--fs-display);color:'+(col||'var(--am)')+'">'+val+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);line-height:1.3;white-space:pre-line">'+label+'</div>'+
    '</div>';
  }
  function secHead(icon,label,col){
    return '<div style="font-weight:700;font-size:var(--fs-h3);color:'+(col||'var(--gb)')+';letter-spacing:1px;margin:12px 0 6px">'+icon+' '+label+'</div>';
  }

  var statsHtml=
    '<div style="display:flex;gap:5px;margin-bottom:6px">'+
      statBox(t('cm_stat_best_pos'),bestPos?bestPos+'.':'—','var(--gb)')+
      statBox(t('cm_stat_worst_pos'),worstPos?worstPos+'.':'—','var(--gr)')+
      statBox(t('cm_stat_league_titles'),leagueTitles,'var(--am)')+
    '</div>'+
    '<div style="display:flex;gap:5px;margin-bottom:4px">'+
      statBox(t('cm_stat_cups'),cupWins,'#e040fb')+
      statBox(t('cm_stat_promotions'),promotions,'var(--gb)')+
      statBox(t('cm_stat_relegations'),relegations,'var(--rd)')+
    '</div>';

  // ── 1. Wykres OVR w czasie ──────────────────────────────────────────
  var ovrHtml='';
  var ovrEntries=entries.filter(function(e){return e.ovr>0;});
  if(ovrEntries.length>=2){
    var W=310,H=80,pL=26,pR=6,pT=8,pB=18;
    var iW=W-pL-pR,iH=H-pT-pB;
    var minO=Math.max(20,Math.min.apply(null,ovrEntries.map(function(e){return e.ovr;}))-3);
    var maxO=Math.min(99,Math.max.apply(null,ovrEntries.map(function(e){return e.ovr;}))+3);
    function xO(i){return pL+Math.round(i/(ovrEntries.length-1)*iW);}
    function yO(v){return pT+Math.round((1-(v-minO)/(maxO-minO))*iH);}
    var svgO='';
    [minO,Math.round((minO+maxO)/2),maxO].forEach(function(v){
      var y=yO(v);
      svgO+='<line x1="'+pL+'" y1="'+y+'" x2="'+(W-pR)+'" y2="'+y+'" stroke="#1a2a1a" stroke-width="1"/>';
      svgO+='<text x="'+(pL-3)+'" y="'+(y+3)+'" fill="#3a5a3a" font-size="8" text-anchor="end">'+v+'</text>';
    });
    var pts=ovrEntries.map(function(e,i){return xO(i)+','+yO(e.ovr);}).join(' ');
    svgO+='<polyline points="'+pts+'" fill="none" stroke="#4caf50" stroke-width="2" stroke-linejoin="round"/>';
    ovrEntries.forEach(function(e,i){
      var cx=xO(i),cy=yO(e.ovr);
      svgO+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="#81c784" stroke="var(--gd)" stroke-width="1"/>';
      svgO+='<text x="'+cx+'" y="'+(cy-5)+'" fill="#a5d6a7" font-size="9" text-anchor="middle">'+e.ovr+'</text>';
      svgO+='<text x="'+cx+'" y="'+(H-3)+'" fill="#3a5a3a" font-size="7" text-anchor="middle">S'+e.season+'</text>';
    });
    ovrHtml=secHead('📈',t('cm_chart_ovr_time'),'var(--gb)')+
      '<div style="background:var(--tb);border:1px solid var(--gl);padding:6px 4px;overflow-x:auto">'+
        '<svg width="'+W+'" height="'+H+'" style="display:block;min-width:'+W+'px">'+svgO+'</svg>'+
      '</div>';
  }

  // ── 2. Wykres punktów per sezon ─────────────────────────────────────
  var ptsHtml='';
  if(entries.length>=2){
    var Wp=310,Hp=80,pLp=28,pRp=6,pTp=8,pBp=18;
    var iWp=Wp-pLp-pRp,iHp=Hp-pTp-pBp;
    var maxPts=Math.max.apply(null,entries.map(function(e){return e.pts||0;}));
    if(maxPts<1)maxPts=1;
    var recentP=entries.slice(-12);
    var barWp=Math.max(4,Math.floor(iWp/recentP.length)-2);
    var svgP='';
    [0,Math.round(maxPts/2),maxPts].forEach(function(v){
      var y=pTp+Math.round((1-v/maxPts)*iHp);
      svgP+='<line x1="'+pLp+'" y1="'+y+'" x2="'+(Wp-pRp)+'" y2="'+y+'" stroke="#1a2a1a" stroke-width="1"/>';
      svgP+='<text x="'+(pLp-3)+'" y="'+(y+3)+'" fill="#3a5a3a" font-size="8" text-anchor="end">'+v+'</text>';
    });
    recentP.forEach(function(e,i){
      var x=pLp+Math.round(i/recentP.length*iWp)+(Math.round(iWp/recentP.length)-barWp)/2;
      var bH=Math.max(2,Math.round((e.pts||0)/maxPts*iHp));
      var y=pTp+iHp-bH;
      var col=e.pos===1?'#ffd700':e.pos<=3?'#4caf50':'#1565c0';
      svgP+='<rect x="'+Math.round(x)+'" y="'+y+'" width="'+barWp+'" height="'+bH+'" fill="'+col+'" opacity="0.85"/>';
      svgP+='<text x="'+(Math.round(x)+barWp/2)+'" y="'+(y-2)+'" fill="#ccc" font-size="9" text-anchor="middle">'+(e.pts||0)+'</text>';
      svgP+='<text x="'+(Math.round(x)+barWp/2)+'" y="'+(Hp-4)+'" fill="#3a5a3a" font-size="7" text-anchor="middle">S'+e.season+'</text>';
    });
    ptsHtml=secHead('🏅',t('cm_chart_pts_season'),'var(--am)')+
      '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+
        '<span style="color:#ffd700">■</span> '+t('cm_legend_champion')+' &nbsp;<span style="color:#4caf50">■</span> '+t('cm_legend_podium')+' &nbsp;<span style="color:#1565c0">■</span> '+t('cm_legend_other')+
      '</div>'+
      '<div style="background:var(--tb);border:1px solid var(--gl);padding:6px 4px;overflow-x:auto">'+
        '<svg width="'+Wp+'" height="'+Hp+'" style="display:block;min-width:'+Wp+'px">'+svgP+'</svg>'+
      '</div>';
  }

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
      var Wt=310,Ht=90,pLt=8,pRt=6,pTt=8,pBt=18;
      var iWt=Wt-pLt-pRt,iHt=(Ht-pTt-pBt)/2;
      var midY=pTt+iHt;
      var maxVal=Math.max.apply(null,tfrSeasons.map(function(s){return Math.max(tfrBySeason[s].spent,tfrBySeason[s].earned);}));
      if(maxVal<1)maxVal=1;
      var barWt=Math.max(4,Math.floor(iWt/tfrSeasons.length)-2);
      var svgT='';
      svgT+='<line x1="'+pLt+'" y1="'+midY+'" x2="'+(Wt-pRt)+'" y2="'+midY+'" stroke="#2a4a2a" stroke-width="1"/>';
      tfrSeasons.forEach(function(s,i){
        var x=pLt+Math.round(i/tfrSeasons.length*iWt)+(Math.round(iWt/tfrSeasons.length)-barWt)/2;
        var d=tfrBySeason[s];
        var hSpent=Math.max(2,Math.round(d.spent/maxVal*iHt));
        svgT+='<rect x="'+Math.round(x)+'" y="'+(midY-hSpent)+'" width="'+Math.round(barWt*0.45)+'" height="'+hSpent+'" fill="#f44336" opacity="0.85"/>';
        var hEarned=Math.max(2,Math.round(d.earned/maxVal*iHt));
        svgT+='<rect x="'+(Math.round(x)+Math.round(barWt*0.5))+'" y="'+midY+'" width="'+Math.round(barWt*0.45)+'" height="'+hEarned+'" fill="#4caf50" opacity="0.85"/>';
        svgT+='<text x="'+(Math.round(x)+barWt/2)+'" y="'+(Ht-4)+'" fill="#3a5a3a" font-size="7" text-anchor="middle">S'+s+'</text>';
      });
      tfrHtml=secHead('💸',t('cm_chart_transfers_season'),'#e040fb')+
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+
          '<span style="color:#f44336">■</span> '+t('cm_legend_spent')+' &nbsp;<span style="color:#4caf50">■</span> '+t('cm_legend_earned')+
        '</div>'+
        '<div style="background:var(--tb);border:1px solid var(--gl);padding:6px 4px;overflow-x:auto">'+
          '<svg width="'+Wt+'" height="'+Ht+'" style="display:block;min-width:'+Wt+'px">'+svgT+'</svg>'+
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
  legendsHtml=secHead('⭐',t('cm_club_legends'),'var(--am)');
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

  // ── Trofea ──────────────────────────────────────────────────────────
  var trophyHtml='';
  if(allTrophies.length){
    trophyHtml=secHead('🏆',t('cm_trophies'),'var(--am)')+
      '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 10px;margin-bottom:4px;display:flex;flex-wrap:wrap;gap:6px">'+
      allTrophies.map(function(tr){
        var icon=tr.type==='cup'?'🥇':'👑';
        var label=tr.type==='cup'?t('cm_trophy_cup'):(t('cm_legend_champion')+(tr.lg?' '+(LEAGUE_NAMES[tr.lg]||''):''));
        return '<div style="font-size:var(--fs-dense);background:#0d2b0d;border:1px solid var(--gb);padding:4px 8px;text-align:center">'+
          '<div>'+icon+' '+label+'</div>'+
          '<div style="color:var(--gr);font-size:var(--fs-dense)">S'+tr.season+'</div>'+
        '</div>';
      }).join('')+
      '</div>';
  }

  // ── Tabela ostatnich sezonów ─────────────────────────────────────────
  var tableHtml='';
  if(entries.length){
    var rows=entries.slice().reverse().slice(0,10);
    tableHtml=secHead('📋',t('cm_recent_seasons'),'var(--gb)')+
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

  el.innerHTML=statsHtml+ovrHtml+ptsHtml+tfrHtml+legendsHtml+trophyHtml+tableHtml;
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


