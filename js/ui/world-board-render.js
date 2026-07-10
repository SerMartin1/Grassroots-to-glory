function fillWorld(){
  if(!G)return;
  renderWorldTransfers();
}

function worldTab(tab,btn){
  document.querySelectorAll('#p-world .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['transfers','clubs','news'].forEach(tb=>{const e=document.getElementById('world-'+tb);if(e)e.classList.remove('on');});
  const e=document.getElementById('world-'+tab);if(e)e.classList.add('on');
  if(tab==='transfers')renderWorldTransfers();
  else if(tab==='clubs')renderWorldClubs();
  else renderWorldNews();
}

function buildWorldTransferLog(){
  const all=[];
  const leagues=G.leagues||[];
  // Transfery AI↔AI z logów klubów
  leagues.forEach(lg=>{
    (lg.clubs||[]).forEach(club=>{
      const log=(club.ai&&club.ai.transferLog)||[];
      log.forEach(t=>{
        if((t.price||0)>0){
          all.push({
            name:t.name,pos:t.pos||'?',ovr:t.ovr||0,age:t.age||0,
            price:t.price,season:t.season||1,
            fromClub:t.type==='buy'?(t.fromClub||'?'):club.n,
            toClub:t.type==='buy'?club.n:(t.toClub||'?'),
            type:'ai',clubId:club.id,playerId:t.playerId||null
          });
        }
      });
    });
  });
  // Transfery gracza z G.fin.transfers
  (G.fin&&G.fin.transfers||[]).forEach(tr=>{
    if((tr.val||0)>0){
      const myName=G.myClub?G.myClub.n:t('world_my_club');
      all.push({
        name:tr.name,pos:tr.pos||'',ovr:0,age:tr.buyAge||tr.soldAge||0,
        price:tr.val,season:tr.season||1,
        fromClub:tr.type==='buy'?(tr.fromClub||t('world_market')):myName,
        toClub:tr.type==='buy'?myName:(tr.club||'?'),
        type:tr.type,mine:true,playerId:tr.id||null
      });
    }
  });
  // Jeśli po powyższym nadal brak danych — zbierz z historii zawodników (formerClubs)
  if(all.length===0){
    const allPl=[...G.players,...(G.retiredPlayers||[])];
    allPl.forEach(p=>{
      (p.formerClubs||[]).forEach(fc=>{
        if((fc.soldFor||0)>0){
          all.push({
            name:p.name,pos:p.pos||'?',ovr:fc.ovr||ovr(p),age:fc.age||p.age,
            price:fc.soldFor,season:fc.season||1,
            fromClub:fc.from||'?',toClub:fc.to||'?',
            type:'ai',playerId:p.id
          });
        }
      });
    });
  }
  // Sortuj po cenie malejąco, deduplikuj
  const seen=new Set();
  return all
    .filter(t=>{
      if(!t.playerId)return true;
      const key=t.playerId+'_'+t.season+'_'+t.price;
      if(seen.has(key))return false;
      seen.add(key);return true;
    })
    .sort((a,b)=>b.price-a.price)
    .slice(0,100);
}

function renderWorldTransfers(){
  const el=document.getElementById('world-transfers');if(!el||!G)return;
  const F='font-size:var(--fs-dense);';
  const Fs='font-size:var(--fs-dense);';
  const list=buildWorldTransferLog();
  if(!list.length){
    el.innerHTML=`<div style="${F}color:var(--gr);text-align:center;padding:30px">${t('world_no_data')}</div>`;
    return;
  }
  const top3=list.slice(0,3);
  const rest=list.slice(3);

  // ── PODIUM ──
  const podiumOrder=[1,0,2];
  const podiumColors=['#c0c0c0','#ffd700','#cd7f32'];
  const podiumHeights=['75px','100px','60px'];
  const podiumMedals=['🥈','🥇','🥉'];
  const podiumRanks=[2,1,3];

  let h=`<div style="background:#050f05;border-bottom:2px solid var(--gl);padding:12px 8px 0">`;
  h+=`<div style="${F}color:var(--gr);text-align:center;letter-spacing:1px;margin-bottom:10px">${t('world_top100_title')}</div>`;
  h+=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;align-items:flex-end">`;
  podiumOrder.forEach((idx,col)=>{
    const tr=top3[idx];if(!tr)return;
    const c=podiumColors[col];
    const rank=podiumRanks[col];
    const shortName=(tr.name||'?').split(' ').map((w,i)=>i===0?(w[0]||'?')+'.':w).join(' ');
    const shortFrom=(tr.fromClub||'?').substring(0,9);
    const shortTo=(tr.toClub||'?').substring(0,9);
    const clickAttr=tr.playerId?`onclick="showById(${tr.playerId})" style="cursor:pointer;text-align:center"`:'style="text-align:center"';
    const faceSlot=tr.playerId?`<span class="wt-face-slot" data-pid="${tr.playerId}" data-age="${tr.age||''}" style="display:inline-block;vertical-align:middle;line-height:0;margin-right:4px"></span>`:'';
    h+=`<div ${clickAttr}>
      <div style="${F}color:${c};margin-bottom:2px;display:flex;align-items:center;justify-content:center;gap:3px">${faceSlot}#${rank} ${shortName}</div>
      <div style="${Fs}color:${c}99;margin-bottom:3px">${shortFrom}→${shortTo}</div>
      <div style="background:${c}18;border:1px solid ${c};border-bottom:none;height:${podiumHeights[col]};display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:8px">
        <div style="font-size:var(--fs-display)">${podiumMedals[col]}</div>
        <div style="${F}color:${c};margin-top:2px">${fmtVal(tr.price)}</div>
        ${tr.mine?`<div style="${Fs}color:#000;background:var(--am);padding:1px 5px;margin-top:2px">${t('world_badge_mine')}</div>`:''}
      </div>
    </div>`;
  });
  h+=`</div></div>`;

  // ── LISTA #4–100 ──
  h+=`<div style="padding:6px 10px">`;
  rest.forEach((tr,i)=>{
    const rank=i+4;
    const isMine=tr.mine;
    const leftColor=isMine?(tr.type==='buy'?'var(--rd)':'var(--gb)'):'var(--gl)';
    const _fC=tr.fromClub||'?';const shortFrom=_fC.length>10?_fC.substring(0,10)+'…':_fC;
    const _tC=tr.toClub||'?';const shortTo=_tC.length>10?_tC.substring(0,10)+'…':_tC;
    const clickAttr=tr.playerId?`onclick="showById(${tr.playerId})" style="cursor:pointer"`:'';
    const myBadge=isMine?`<span style="${Fs}color:#000;background:${tr.type==='buy'?'var(--rd)':'var(--gb)'};padding:0 4px;margin-left:4px">${tr.type==='buy'?t('world_badge_buy'):t('world_badge_sell')}</span>`:'';
    const faceSlotRow=tr.playerId?`<span class="wt-face-slot" data-pid="${tr.playerId}" data-age="${tr.age||''}" style="display:inline-block;vertical-align:middle;line-height:0;margin-right:6px;flex-shrink:0"></span>`:'';
    h+=`<div ${clickAttr} style="display:flex;align-items:center;border-bottom:1px solid #0d1f0d;padding:5px 0;${isMine?'border-left:2px solid '+leftColor+';padding-left:5px;background:rgba(255,193,7,0.03)':''}">
      <div style="${F}color:var(--gr);min-width:30px;text-align:right;margin-right:8px;flex-shrink:0">#${rank}</div>
      ${faceSlotRow}
      <div style="flex:1;min-width:0">
        <div style="${F}color:var(--wh);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tr.name}${tr.pos?` <span style="color:var(--gr)">${tr.pos}</span>`:''}${myBadge}</div>
        <div style="${Fs}color:var(--gr)">${shortFrom} → ${shortTo} · S${tr.season}</div>
      </div>
      <div style="${F}color:var(--am);text-align:right;flex-shrink:0;margin-left:8px">${fmtVal(tr.price)}</div>
    </div>`;
  });
  h+=`</div>`;
  el.innerHTML=h;
  if(typeof pxFace==='function'){el.querySelectorAll('.wt-face-slot').forEach(function(sl){if(!sl.firstChild){sl.appendChild(pxFace(parseInt(sl.dataset.pid),1,parseInt(sl.dataset.age)||undefined));}});}
}

function renderWorldClubs(sortBy){
  const el=document.getElementById('world-clubs');if(!el||!G)return;
  const sort=sortBy||el.dataset.sort||'spent';
  el.dataset.sort=sort;
  const F='font-size:var(--fs-dense);';
  const leagues=G.leagues||[];

  // Zbierz statsy per klub
  const clubStats=[];
  leagues.forEach(lg=>{
    (lg.clubs||[]).forEach(club=>{
      const ai=club.ai||{};
      const log=ai.transferLog||[];
      const isMe=club.id===G.myClubId;
      let spent=0,earned=0,buys=0,sells=0;
      log.forEach(t=>{
        if(t.price>0){
          if(t.type==='buy'){spent+=t.price;buys++;}
          else{earned+=t.price;sells++;}
        }
      });
      if(isMe){
        (G.fin&&G.fin.transfers||[]).forEach(t=>{
          if(t.type==='buy'){spent+=t.val||0;buys++;}
          else{earned+=t.val||0;sells++;}
        });
      }
      const saldo=earned-spent;
      const squad=G.players.filter(p=>p.clubId===club.id);
      const squadValue=squad.reduce((s,p)=>s+(p.value||0),0);
      const philoMap={akademia:t('world_philo_academy'),sprzedajacy:t('world_philo_seller'),bogaty:t('world_philo_rich'),stabilny:t('world_philo_stable')};
      clubStats.push({name:club.n,id:club.id,isMe,
        philo:philoMap[ai.type||'stabilny']||t('world_philo_stable'),
        spent,earned,saldo,buys,sells,lgLevel:lg.level||8,
        squadValue,
        reputation:isMe?(G.reputation||0):(ai.reputation||0)});
    });
  });

  // Sortowanie wg wybranej podstawy
  if(sort==='earned') clubStats.sort((a,b)=>b.earned-a.earned);
  else if(sort==='saldo') clubStats.sort((a,b)=>b.saldo-a.saldo);
  else if(sort==='value') clubStats.sort((a,b)=>b.squadValue-a.squadValue);
  else if(sort==='reputation') clubStats.sort((a,b)=>b.reputation-a.reputation);
  else clubStats.sort((a,b)=>b.spent-a.spent);

  // Wartość bazowa do paska — zawsze wartość sortowanej kolumny
  const getVal=c=>sort==='earned'?c.earned:sort==='saldo'?c.saldo:sort==='value'?c.squadValue:sort==='reputation'?c.reputation:c.spent;
  const maxVal=Math.max(...clubStats.map(c=>Math.abs(getVal(c))),1);

  const mkBtn=(id,label,col)=>{
    const on=sort===id;
    return `<button onclick="renderWorldClubs('${id}')" style="${F}padding:5px 8px;border:1px solid ${on?col:'var(--gl)'};background:${on?col+'22':'var(--tb)'};color:${on?col:'var(--gr)'};cursor:pointer;flex:1">${label}</button>`;
  };

  // ── NAGŁÓWEK Z PRZEŁĄCZNIKAMI ──
  let h=`<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">`;
  h+=mkBtn('spent',t('world_sort_spent'),'var(--rd)');
  h+=mkBtn('earned',t('world_sort_earned'),'var(--gb)');
  h+=mkBtn('saldo',t('world_sort_saldo'),'var(--am)');
  h+=mkBtn('value',t('world_sort_value'),'#ffd700');
  h+=mkBtn('reputation',t('world_sort_reputation'),'#29b6f6');
  h+=`</div>`;

  // ── LEGENDA ──
  h+=`<div style="${F}color:var(--gr);border:1px solid #0d2f0d;padding:5px 8px;margin-bottom:10px;background:#060f06">`;
  h+=`<span style="color:var(--rd)">${t('world_sort_spent')}</span>  <span style="color:var(--gb)">${t('world_sort_earned')}</span>  <span style="color:${sort==='saldo'&&'var(--am)'||'var(--gr)'}">${t('world_sort_saldo')}</span>`;
  h+=`${t('world_ranking_by')}<span style="color:${sort==='spent'?'var(--rd)':sort==='earned'?'var(--gb)':sort==='saldo'?'var(--am)':sort==='value'?'#ffd700':'#29b6f6'}">`;
  h+=sort==='spent'?t('world_sort_spent_gen'):sort==='earned'?t('world_sort_earned_gen'):sort==='saldo'?t('world_sort_saldo_gen'):sort==='value'?t('world_sort_value_gen'):t('world_sort_reputation_gen');
  h+=`</span></div>`;

  if(!clubStats.length){
    h+=`<div style="${F}color:var(--gr);text-align:center;padding:20px">${t('world_no_club_data')}</div>`;
    el.innerHTML=h;return;
  }

  clubStats.forEach((c,i)=>{
    const rank=i+1;
    const rankColor=rank===1?'#ffd700':rank===2?'#c0c0c0':rank===3?'#cd7f32':'var(--gr)';
    const rankLabel=rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'#'+rank;
    const val=getVal(c);
    const barW=maxVal>0?Math.round((Math.abs(val)/maxVal)*100):0;
    const barColor=sort==='spent'?'var(--rd)':sort==='earned'?'var(--gb)':sort==='value'?'#ffd700':sort==='reputation'?'#29b6f6':(c.saldo>=0?'var(--gb)':'var(--rd)');
    const isLeader=rank===1;
    const myBadge=c.isMe?`<span style="${F}color:#000;background:var(--am);padding:0 4px;margin-left:5px">${t('world_badge_yours')}</span>`:'';
    const leadBadge=isLeader?`<span style="${F}color:var(--am);border:1px solid var(--am);padding:0 4px;margin-left:4px">${t('world_badge_dominates')}</span>`:'';
    const saldoColor=c.saldo>=0?'var(--gb)':'var(--rd)';
    const saldoSign=c.saldo>=0?'+':'-';
    // podświetl aktywną kolumnę
    const spentStyle=sort==='spent'?`color:var(--rd);border-bottom:1px solid var(--rd)`:`color:var(--rd)`;
    const earnedStyle=sort==='earned'?`color:var(--gb);border-bottom:1px solid var(--gb)`:`color:var(--gb)`;
    const saldoStyle=sort==='saldo'?`color:${saldoColor};border-bottom:1px solid ${saldoColor}`:`color:${saldoColor}`;
    const extraColor=sort==='value'?'#ffd700':sort==='reputation'?'#29b6f6':'var(--gr)';
    const extraStyle=(sort==='value'||sort==='reputation')?`color:${extraColor};border-bottom:1px solid ${extraColor}`:`color:var(--gr)`;
    h+=`<div onclick="openClubModal(${c.id})" style="cursor:pointer;border-bottom:1px solid #0d1f0d;padding:7px 0;${c.isMe?'border-left:3px solid var(--am);padding-left:6px;background:rgba(255,193,7,0.03)':''}">
      <div style="display:flex;align-items:center">
        <div style="${F}color:${rankColor};min-width:34px;text-align:right;margin-right:8px;flex-shrink:0">${rankLabel}</div>
        <div style="flex:1;min-width:0">
          <div style="${F}color:${c.isMe?'var(--am)':'var(--wh)'}">${c.name}${myBadge}${leadBadge}</div>
          <div style="${F}color:var(--gr)">${t('world_club_stats').replace('{philo}',c.philo).replace('{buys}',c.buys).replace('{sells}',c.sells).replace('{lvl}',c.lgLevel)}</div>
          <div style="height:4px;background:#0d1f0d;margin-top:4px;position:relative">
            <div style="position:absolute;left:0;top:0;height:100%;width:${barW}%;background:${barColor}"></div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:10px;line-height:1.5">
          <div style="${F}${spentStyle}">▼${fmtMln(c.spent)}</div>
          <div style="${F}${earnedStyle}">▲${fmtMln(c.earned)}</div>
          <div style="${F}${saldoStyle}">${saldoSign}${fmtMln(Math.abs(c.saldo))}</div>
          <div style="${F}${extraStyle}">💎${fmtMln(c.squadValue)} · ⭐${c.reputation}</div>
        </div>
      </div>
    </div>`;
  });

  el.innerHTML=h;
}

// ══════════════════════════════════════════════════════════════
// ŻYWY ŚWIAT AI — NEWSY O KLUBACH AI (osobno od G.news gracza)
// ══════════════════════════════════════════════════════════════

function addWorldNews(msg,type,clubId,leagueLevel){
  if(!G)return;
  if(!G.worldNews)G.worldNews=[];
  G.worldNews.unshift({msg,type,week:G.week,season:G.season,clubId:clubId||null,leagueLevel:leagueLevel||null});
  if(G.worldNews.length>60)G.worldNews.pop();
}

function _worldNewsItemHtml(n){
  const barColor={promotion:'#4caf50',relegation:'#f44336',cup:'#ffd700',academy:'#ab47bc',streak_win:'#4caf50',streak_loss:'#f44336',crisis:'#f44336',goal:'#29b6f6'};
  const icons={promotion:'⬆️',relegation:'⬇️',cup:'🏆',academy:'🎓',streak_win:'🔥',streak_loss:'📉',crisis:'💸',goal:'🎯'};
  const bar=barColor[n.type]||'#546e54';
  const ico=icons[n.type]||'📰';
  const clickable=!!n.clubId;
  const clickAttr=clickable?' onclick="openClubModal('+n.clubId+')" style="cursor:pointer"':'';
  return '<div'+clickAttr+' style="display:flex;align-items:stretch;border-bottom:1px solid #0a180a">'
    +'<div style="width:3px;background:'+bar+';flex-shrink:0"></div>'
    +'<div style="display:flex;align-items:flex-start;gap:7px;padding:6px 10px;flex:1">'
      +'<span style="font-size:var(--fs-body);flex-shrink:0;margin-top:1px">'+ico+'</span>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:var(--fs-dense);color:var(--wh);line-height:1.3">'+n.msg+'</div>'
        +'<div style="font-size:var(--fs-micro);color:var(--gr);margin-top:2px">'+t('world_news_meta').replace('{s}',n.season).replace('{n}',n.week)+'</div>'
      +'</div>'
    +'</div>'
  +'</div>';
}

function renderWorldNews(){
  const el=document.getElementById('world-news');if(!el||!G)return;
  const list=G.worldNews||[];
  if(!list.length){
    el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);text-align:center;padding:30px">'+t('world_news_empty')+'</div>';
    return;
  }
  el.innerHTML=list.map(_worldNewsItemHtml).join('');
}

function fillBoard(){
  if(!G)return;
  if(!G.board)G.board={mainGoal:null,optGoal:null,goalsHistory:[]};
  renderBoardCele();
  // Odśwież fin-zarzad jeśli widoczny
  const fz=document.getElementById('fin-zarzad');
  if(fz&&fz.classList.contains('on'))renderFinZarzad();
}

function renderBoardCele(){
  const el=document.getElementById('board-cele');if(!el||!G)return;
  const b=G.board;
  if(!b||!b.mainOptions){
    el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);padding:12px;text-align:center">'+t('board_goals_pending')+'</div>';
    return;
  }
  const streak=b.streakFailed||0;
  const diffColor={hard:'var(--rd)',medium:'var(--am)',easy:'var(--gb)'};
  const starsHtml=n=>'★'.repeat(n)+'☆'.repeat(5-n);

  // Baner PRESJI
  const pressBanner=streak>=2?
    '<div style="background:#2e0000;border:2px solid var(--rd);padding:8px 12px;margin-bottom:10px;font-size:var(--fs-dense);color:var(--rd)">'+
    t('board_pressure_banner').replace('{n}',streak)+
    (streak>=3?t('board_pressure_forced_note'):t('board_pressure_penalty_note').replace('{mult}',(streak>=3?'1.6':'1.3')))+
    '</div>':'';

  // Kontekst historyczny (po awansie, spadku, tytule)
  const lastHist=G.cHist&&G.cHist.length?G.cHist[G.cHist.length-1]:null;
  let contextBanner='';
  if(lastHist){
    const ctx=b.mainOptions[0]&&b.mainOptions[0].context;
    if(ctx)contextBanner='<div style="background:#0d2200;border-left:3px solid var(--gb);padding:6px 10px;margin-bottom:8px;font-size:var(--fs-dense);color:var(--gr)">'+
      t('board_context_banner').replace('{ctx}',ctx).replace('{pos}',lastHist.pos).replace('{gf}',lastHist.gf).replace('{ga}',lastHist.ga)+'</div>';
  }

  // Cel główny
  const mainHtml=b.mainGoal?
    '<div style="background:var(--tb);border:2px solid var(--gb);padding:10px 12px;margin-bottom:12px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
        '<div style="font-size:var(--fs-dense);color:var(--wh)">'+b.mainGoal.label+'</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--am)">'+starsHtml(b.mainGoal.stars||3)+'</div>'+
      '</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">'+b.mainGoal.desc+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:var(--fs-dense)">'+
        '<div><div style="color:var(--gr)">'+t('board_reward_label')+'</div><div style="color:var(--gb)">'+
          (b.mainGoal.reward.budget?'+'+fmt(b.mainGoal.reward.budget):'')+(b.mainGoal.reward.rep?' +Rep '+b.mainGoal.reward.rep:'')+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('board_penalty_label')+'</div><div style="color:var(--rd)">'+
          (b.mainGoal.penalty.budget&&b.mainGoal.penalty.budget<0?fmt(b.mainGoal.penalty.budget):'')+(b.mainGoal.penalty.rep?' Rep '+b.mainGoal.penalty.rep:'')+(b.mainGoal.penalty.transferLock?t('board_lock_short'):'')+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('board_position_label')+'</div><div style="color:var(--am)">'+t('board_place_suffix').replace('{n}',getBoardPos())+'</div></div>'+
      '</div>'+
    '</div>'
  :
    b.mainOptions.map(g=>{
      const forced=b.pressureForced;
      return '<div style="background:var(--tb);border:1px solid '+(forced?'var(--rd)':'var(--gl)')+';padding:10px 12px;margin-bottom:6px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
          '<div style="font-size:var(--fs-dense);color:var(--wh)">'+g.label+'</div>'+
          '<div style="font-size:var(--fs-dense);color:'+(g.difficulty==='hard'?'var(--rd)':g.difficulty==='medium'?'var(--am)':'var(--gb)')+'">'+starsHtml(g.stars||3)+'</div>'+
        '</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">'+g.desc+'</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:var(--fs-dense);margin-bottom:6px">'+
          '<div><div style="color:var(--gr)">'+t('board_reward_label')+'</div><div style="color:var(--gb)">'+
            (g.reward.budget?'+'+fmt(g.reward.budget):'')+(g.reward.rep?' +Rep '+g.reward.rep:'')+(g.reward.transferBudget?t('board_transfer_short').replace('{val}',fmt(g.reward.transferBudget)):'')+'</div></div>'+
          '<div><div style="color:var(--gr)">'+t('board_penalty_label')+'</div><div style="color:var(--rd)">'+
            (g.penalty.budget&&g.penalty.budget<0?fmt(g.penalty.budget):'')+(g.penalty.rep?' Rep '+g.penalty.rep:'')+(g.penalty.transferLock?t('board_lock_short'):'')+'</div></div>'+
        '</div>'+
        '<button onclick="selectMainGoal(this.dataset.id)" data-id="'+g.id+'" style="width:100%;background:'+(forced?'var(--rd)':'var(--gb)')+';color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+
          (forced?t('board_forced_btn'):t('board_choose_btn'))+
        '</button>'+
      '</div>';
    }).join('');

  // Cel opcjonalny
  const optHtml=b.optGoal?
    '<div style="background:var(--tb);border:1px solid var(--gb);padding:8px 12px">'+
      '<div style="font-size:var(--fs-dense);color:var(--wh);margin-bottom:2px">'+b.optGoal.label+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+b.optGoal.desc+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gb)">'+t('board_bonus_label')+' '+
        (b.optGoal.reward.budget?'+'+fmt(b.optGoal.reward.budget):'')+(b.optGoal.reward.rep?' +Rep '+b.optGoal.reward.rep:'')+(b.optGoal.reward.sponsorBonus?t('board_sponsors_pct').replace('{n}',Math.round(b.optGoal.reward.sponsorBonus*100)):'')+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('board_opt_penalty').replace('{n}',(b.optGoal.penalty&&b.optGoal.penalty.rep?b.optGoal.penalty.rep:'-8'))+'</div>'+
    '</div>'
  :
    (b.optOptions||[]).map(g=>
      '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 12px;margin-bottom:6px">'+
        '<div style="font-size:var(--fs-dense);color:var(--wh);margin-bottom:2px">'+g.label+'</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+g.desc+'</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--gb);margin-bottom:2px">'+t('board_bonus_label')+' '+
          (g.reward.budget?'+'+fmt(g.reward.budget):'')+(g.reward.rep?' +Rep '+g.reward.rep:'')+(g.reward.sponsorBonus?t('board_sponsors_pct').replace('{n}',Math.round(g.reward.sponsorBonus*100)):'')+(g.reward.formBonus?t('board_form_bonus').replace('{n}',g.reward.formBonus):'')+'</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--rd);margin-bottom:6px">'+t('board_opt_penalty').replace('{n}',(g.penalty&&g.penalty.rep?g.penalty.rep:'-8'))+'</div>'+
        '<button onclick="selectOptGoal(this.dataset.id)" data-id="'+g.id+'" style="width:100%;background:var(--gm);border:1px solid var(--am);color:var(--am);font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('board_take_challenge_btn')+'</button>'+
      '</div>'
    ).join('');

  el.innerHTML=
    pressBanner+contextBanner+
    '<div style="font-size:var(--fs-meta);color:var(--am);margin-bottom:8px">'+t('board_main_title').replace('{n}',G.season)+'</div>'+
    '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">'+
      (b.mainGoal?t('board_selected_prefix')+'<span style="color:var(--gb)">'+b.mainGoal.label+'</span>':
       b.pressureForced?'<span style="color:var(--rd)">'+t('board_forced_no_choice')+'</span>':t('board_choose_one'))+
    '</div>'+mainHtml+
    '<div style="font-size:var(--fs-meta);color:var(--am);margin:10px 0 8px">'+t('board_opt_title')+'</div>'+
    '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">'+
      (b.optGoal?t('board_selected_prefix')+'<span style="color:var(--gb)">'+b.optGoal.label+'</span>':
      t('board_opt_challenge_prompt'))+
    '</div>'+optHtml+
    (streak>=1?'<div style="font-size:var(--fs-dense);color:var(--rd);margin-top:8px;padding:6px;border-top:1px solid #3d0000">'+t('board_streak_footer').replace('{n}',streak)+(streak>=2?t('board_streak_mult_suffix').replace('{mult}',(streak>=3?'1.6':'1.3')):'')+'</div>':'');
}

function renderBoardHistoria(){
  const el=document.getElementById('board-historia');if(!el||!G)return;
  const hist=(G.board&&G.board.goalsHistory)||[];
  if(!hist.length){
    el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);padding:12px">'+t('board_hist_empty')+'</div>';
    return;
  }
  // Streak info na górze
  const streak=G.board&&G.board.streakFailed||0;
  const streakBanner=streak>=2?
    '<div style="background:#2e0000;border:1px solid var(--rd);padding:6px 10px;margin-bottom:8px;font-size:var(--fs-dense);color:var(--rd)">'+t('board_hist_streak_banner').replace('{n}',streak)+'</div>':'';

  el.innerHTML=streakBanner+hist.slice().reverse().map((h,i)=>{
    const prev=hist.slice().reverse()[i+1];
    const trend=prev===undefined?'→':h.mainDone&&!prev.mainDone?'↑':!h.mainDone&&prev.mainDone?'↓':h.mainDone?'→↑':'→↓';
    const trendCol=trend.includes('↑')?'var(--gb)':trend.includes('↓')?'var(--rd)':'var(--gr)';
    return '<div style="background:var(--tb);border:1px solid '+(h.mainDone?'var(--gb)':'var(--rd)')+';padding:10px 12px;margin-bottom:8px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
        '<div style="font-size:var(--fs-dense);color:var(--wh)">'+t('board_hist_season').replace('{n}',h.season)+
          ' <span style="color:'+trendCol+'">'+trend+'</span></div>'+
        '<div style="font-size:var(--fs-dense);color:'+(h.mainDone?'var(--gb)':'var(--rd)')+'">'+
          (h.mainDone?t('board_hist_done'):t('board_hist_failed'))+
        '</div>'+
      '</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('board_hist_goal_label')+'<span style="color:var(--wh)">'+h.mainGoal+'</span></div>'+
      (h.optGoal?'<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('board_bonus_label')+' <span style="color:'+(h.optDone?'var(--gb)':'var(--rd)')+'">'+h.optGoal+(h.optDone?' ✓':' ✗')+'</span></div>':
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('board_bonus_label')+' <span style="color:var(--gr)">'+t('board_hist_not_selected')+'</span></div>')+
      (h.streakAfter&&h.streakAfter>=2?'<div style="font-size:var(--fs-dense);color:var(--rd);margin-top:4px">'+t('board_hist_pressure').replace('{n}',h.streakAfter)+'</div>':'')+
    '</div>';
  }).join('');
}


// ══════════════════════════════════════════════════════════
// OSOBOWOŚCI ZAWODNIKÓW — Wariant 2
// ══════════════════════════════════════════════════════════
