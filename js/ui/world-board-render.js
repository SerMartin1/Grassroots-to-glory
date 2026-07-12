function fillWorld(){
  if(!G)return;
  renderWorldTransfers();
}

function worldTab(tab,btn){
  document.querySelectorAll('#p-world .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['transfers','clubs'].forEach(tb=>{const e=document.getElementById('world-'+tb);if(e)e.classList.remove('on');});
  const e=document.getElementById('world-'+tab);if(e)e.classList.add('on');
  if(tab==='transfers')renderWorldTransfers();
  else renderWorldClubs();
}

function buildWorldTransferLog(){
  const all=[];
  const leagues=G.leagues||[];
  // Transfery AI↔AI — rekord za całą historię kariery (nieprzycinany, w odróżnieniu od transferLog per klub)
  (G.worldTopTransfers||[]).forEach(tr=>{
    if((tr.price||0)>0)all.push({...tr});
  });
  // + świeże dane z logów klubów (uzupełnienie, gdyby rekord jeszcze nie zdążył ich objąć — deduplikacja niżej)
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
  h+=`<div style="${F}color:var(--gr);text-align:center;letter-spacing:1px">${t('world_top100_title')}</div>`;
  h+=`<div style="${Fs}color:var(--gb);text-align:center;margin-bottom:10px">${t('world_top100_subtitle')}</div>`;
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
      if(isMe){
        (G.fin&&G.fin.transfers||[]).forEach(t=>{
          if(t.type==='buy'){spent+=t.val||0;buys++;}
          else{earned+=t.val||0;sells++;}
        });
      } else {
        // Liczniki za całą historię kariery (nieprzycinane). Stare zapisy jeszcze ich nie mają —
        // jednorazowo zainicjuj je z dostępnego (okrojonego do 20 wpisów) transferLog, żeby nic nie "zniknęło" po aktualizacji.
        if(ai.totalSpent===undefined){
          let seedSpent=0,seedEarned=0,seedBuys=0,seedSells=0;
          log.forEach(t=>{
            if(t.price>0){
              if(t.type==='buy'){seedSpent+=t.price;seedBuys++;}
              else{seedEarned+=t.price;seedSells++;}
            }
          });
          ai.totalSpent=seedSpent;ai.totalEarned=seedEarned;ai.totalBuys=seedBuys;ai.totalSells=seedSells;
        }
        spent=ai.totalSpent||0;earned=ai.totalEarned||0;buys=ai.totalBuys||0;sells=ai.totalSells||0;
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
  h+=`<div style="${F}color:var(--gb);text-align:center;margin-bottom:6px">${t('world_clubs_subtitle')}</div>`;

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

const LEAGUE_TAB_MIN_PRIORITY=50;

// Sufiksy a..j wspólne dla wszystkich puli szablonów newsów (10 wariantów zamiast 3) —
// unika przepisywania tej samej listy liter przy każdym typie w WORLD_NEWS_TYPES.
const _NEWS_VARIANTS=['a','b','c','d','e','f','g','h','i','j'];
function _newsTemplates(prefix){return _NEWS_VARIANTS.map(v=>prefix+'_'+v);}
const WORLD_NEWS_TYPES={
  champion:   {priority:95, icon:'👑', color:'#ffd700',
               templates:_newsTemplates('world_news_champion')},
  record:     {priority:90, icon:'⭐', color:'#ffd700',
               templates:_newsTemplates('world_news_record'),
               dedupKey:'type+playerId'},
  promotion:  {priority:85, icon:'⬆️', color:'#4caf50',
               templates:_newsTemplates('world_news_promoted')},
  relegation: {priority:85, icon:'⬇️', color:'#f44336',
               templates:_newsTemplates('world_news_relegated')},
  cup:        {priority:80, icon:'🏆', color:'#ffd700',
               templates:_newsTemplates('world_news_cup')},
  title_race:      {priority:75, icon:'⚔️', color:'#dba24a',
                    templates:_newsTemplates('world_news_title_race')},
  relegation_race: {priority:75, icon:'⚠️', color:'#c2665c',
                    templates:_newsTemplates('world_news_relegation_race')},
  transfer:   {priority:70, icon:'💰', color:'#4db8ff',
               templates:_newsTemplates('world_news_transfer'),
               dedupKey:'type+playerId'},
  derby_result:   {priority:65, icon:'🔥', color:'#e05252',
                   templates:_newsTemplates('world_news_derby_result'),
                   dedupKey:'type'},
  goal_summary: {priority:55, icon:'🎯', color:'#29b6f6',
                 templates:_newsTemplates('world_news_goal_summary')},
  // goal: priorytet POD progiem zakładki ligi (celowo, jak season_recap_club) — szczegóły „jaki
  // cel" zostają tylko w karcie klubu; zbiorcze „kto wykonał cel + ile reputacji" bez szczegółu
  // celu trafia do ligi jako goal_summary (budowany raz na ligę na tydzień, patrz season-summary.js).
  goal:       {priority:45, icon:'🎯', color:'#29b6f6',
               templates:_newsTemplates('world_news_goal')},
  streak_win: {priority:55, icon:'🔥', color:'#4caf50',
               templates:_newsTemplates('world_news_win_streak'),
               cooldownWeeks:3, dedupKey:'type',
               recordPriority:85,
               recordTemplates:_newsTemplates('world_news_win_record')},
  streak_loss:{priority:55, icon:'📉', color:'#f44336',
               templates:_newsTemplates('world_news_loss_streak'),
               cooldownWeeks:3, dedupKey:'type',
               recordPriority:85,
               recordTemplates:_newsTemplates('world_news_loss_record')},
  derby_announce: {priority:50, icon:'🆚', color:'#dba24a',
                   templates:_newsTemplates('world_news_derby_announce')},
  contract:   {priority:40, icon:'📄', color:'#8a9a84',
               templates:_newsTemplates('world_news_contract'),
               dedupKey:'type+playerId'},
  academy:    {priority:35, icon:'🎓', color:'#ab47bc',
               templates:_newsTemplates('world_news_academy'),
               dedupKey:'type+playerId'},
  rumour:     {priority:20, icon:'💬', color:'#e8f5e9',
               templates:_newsTemplates('world_news_rumour'),
               dedupKey:'type+playerId'},
  // typy „meta" — treść budowana (flushWeeklyNews/generateSeasonRecaps/announceSeasonPreview),
  // nie losowana z templates
  digest:              {icon:'📰', color:'#8a9a84'},
  season_recap_club:   {icon:'📖', color:'#ab47bc'},
  season_recap_league: {icon:'📖', color:'#ffd700'},
  season_preview:      {priority:65, icon:'📊', color:'#4db8ff'},
};

// ── Punkt wejścia dla wszystkich detektorów zdarzeń ─────────────────────────
// ctx: {clubId, leagueLevel, playerId, vars:{...podstawienia}, priorityBonus, isRecord,
//       season, week} — season/week opcjonalnie nadpisują znakowanie wpisu (np. zdarzenia
//       końca sezonu generowane w startNewSeason() już PO G.season++, patrz season-summary.js)
function addWorldNewsEvent(type,ctx){
  const def=WORLD_NEWS_TYPES[type];
  if(!def||!G)return;
  ctx=ctx||{};
  // Newsy bez clubId (ligowe — walka o tytuł, zapowiedź sezonu, ogłoszenie derbów) pomijają
  // bufor/dedup per-klub (sekcja 09/10 dokumentu) — nie ma jednego klubu, do którego by je przypiąć.
  if(!ctx.clubId){
    const gkey=pick(def.templates);
    let gmsg=t(gkey);
    Object.keys(ctx.vars||{}).forEach(k=>{gmsg=gmsg.replace('{'+k+'}',ctx.vars[k]);});
    addWorldNews(gmsg,type,null,ctx.leagueLevel||null,ctx.playerId||null,def.priority||30,ctx.season,ctx.week);
    return;
  }
  const club=ALL_CLUBS.find(c=>c.id===ctx.clubId);
  if(!club||!club.ai)return;
  if(!club.ai._newsCooldown)club.ai._newsCooldown={};

  const dedupKey=(def.dedupKey==='type+playerId')?type+'_'+(ctx.playerId||0):type;

  // Rekord (np. seria klubu) omija cooldown — to rzadkie i zawsze warte pokazania.
  const isRecord=!!ctx.isRecord&&def.recordTemplates;
  const readyWeek=club.ai._newsCooldown[dedupKey]||0;
  const absWeek=(G.season*100)+G.week;
  if(def.cooldownWeeks&&!isRecord&&absWeek<readyWeek)return;

  const basePriority=isRecord?(def.recordPriority||def.priority):def.priority;
  const priority=Math.min(100,(basePriority||30)+(ctx.priorityBonus||0));

  const key=pick(isRecord?def.recordTemplates:def.templates);
  let msg=t(key);
  Object.keys(ctx.vars||{}).forEach(k=>{msg=msg.replace('{'+k+'}',ctx.vars[k]);});

  // Nie zapisuj od razu — dołóż do bufora tygodnia tego klubu; flushWeeklyNews()
  // (wołane z week-progress.js i season-summary.js) scali >=2 zdarzenia w jeden digest.
  if(!club.ai._newsCountThisWeek||club.ai._newsCountThisWeek.week!==G.week){
    club.ai._newsCountThisWeek={week:G.week,entries:[]};
  }
  club.ai._newsCountThisWeek.entries.push({type,msg,priority,leagueLevel:ctx.leagueLevel||null,playerId:ctx.playerId||null});

  if(def.cooldownWeeks)club.ai._newsCooldown[dedupKey]=absWeek+def.cooldownWeeks;
}

// ── Warstwa zapisu — priority-aware eviction per liga ───────────────────────
// season/week: opcjonalne nadpisanie znakowania wpisu (domyślnie bieżący G.season/G.week) —
// potrzebne dla zdarzeń końca sezonu wołanych już po G.season++ (patrz startNewSeason()).
function addWorldNews(msg,type,clubId,leagueLevel,playerId,priority,season,week){
  if(!G)return;
  if(!G.worldNews)G.worldNews=[];
  if(G._worldNewsNextId==null)G._worldNewsNextId=0;
  const lvl=leagueLevel||null;
  G.worldNews.unshift({
    id:G._worldNewsNextId++, msg, type, priority:priority||30,
    week:week!=null?week:G.week, season:season!=null?season:G.season,
    clubId:clubId||null, leagueLevel:lvl, playerId:playerId||null
  });
  // Limit per liga (nie globalny): moja liga — więcej miejsca, pozostałe ligi — mniej.
  // Retrospektywy (season_recap_club/league) są WYŁĄCZONE z tego limitu — mają być trwałą
  // kroniką (season_recap_club w karcie klubu za każdy sezon od S1, season_recap_league do
  // czasu następnej retrospektywy, patrz purgeSeasonToRecapOnly). Bez wyjątku niski priorytet
  // season_recap_club (40, pod progiem zakładki ligi) sprawiał, że kasowały się jako pierwsze —
  // przy ~15 klubach w lidze same coroczne retrospektywy przekraczały limit 30/60 i znikały,
  // zanim ktokolwiek zdążył je zobaczyć w karcie klubu.
  const RECAP_TYPES=new Set(['season_recap_club','season_recap_league']);
  const cap=(lvl===G.myLeague)?60:30;
  const sameLeague=(n)=>n.leagueLevel===lvl&&!RECAP_TYPES.has(n.type);
  let count=G.worldNews.filter(sameLeague).length;
  while(count>cap){
    // najpierw kasuj najstarszy o niskim priorytecie; dopiero gdy takich brak — najstarszy w ogóle
    let idx=-1;
    for(let i=G.worldNews.length-1;i>=0;i--){
      if(sameLeague(G.worldNews[i])&&G.worldNews[i].priority<LEAGUE_TAB_MIN_PRIORITY){idx=i;break;}
    }
    if(idx===-1){
      for(let i=G.worldNews.length-1;i>=0;i--){
        if(sameLeague(G.worldNews[i])){idx=i;break;}
      }
    }
    if(idx===-1)break;
    G.worldNews.splice(idx,1);
    count--;
  }
}

// ── Rekord serii klubu — wołane z match-post.js (AI↔AI) i match-engine.js (mecz gracza) ────
function _checkStreakRecord(club,streak){
  if(!club||!club.ai)return{isNewRecord:false,isAmbient:false};
  if(!club.ai._streakRecord)club.ai._streakRecord={win:0,loss:0};
  const abs=Math.abs(streak);
  const key=streak>0?'win':'loss';
  const isNewRecord=abs>=4&&abs>club.ai._streakRecord[key];
  if(isNewRecord)club.ai._streakRecord[key]=abs;
  // isAmbient: zwykłe „dokładnie 4", ale NIE nowy rekord (inaczej dubluje się z isNewRecord)
  return {isNewRecord, isAmbient:abs===4&&!isNewRecord};
}

// ── Scalanie newsów tygodnia jednego klubu w jeden „digest" ─────────────────
// season/week: opcjonalne nadpisanie znakowania CAŁEGO flusha (domyślnie bieżący G.season/
// G.week). Używane przez startNewSeason() — bufor klubu w tym momencie może jeszcze zawierać
// niespłukane zdarzenia z OSTATNIEGO tygodnia kończącego się sezonu (np. seria porażek, wynik
// derbów), a G.season/G.week są już podbite na nowy sezon. Bez nadpisania takie zaległe wpisy
// dostałyby błędną datę nowego sezonu zamiast tego, który właśnie się kończy.
function flushWeeklyNews(club,season,week){
  if(!club||!club.ai||!club.ai._newsCountThisWeek)return;
  const bucket=club.ai._newsCountThisWeek;
  if(!bucket.entries||!bucket.entries.length)return;
  const entries=bucket.entries.slice().sort((a,b)=>b.priority-a.priority).slice(0,4);
  if(entries.length===1){
    const e=entries[0];
    addWorldNews(e.msg,e.type,club.id,e.leagueLevel,e.playerId,e.priority,season,week);
  } else {
    const msg=t('world_news_digest_prefix').replace('{club}',club.n)+entries.map(e=>e.msg).join(' • ');
    const maxPriority=Math.max(...entries.map(e=>e.priority));
    addWorldNews(msg,'digest',club.id,entries[0].leagueLevel,null,maxPriority,season,week);
  }
  bucket.entries=[];
}
function flushAllWeeklyNews(season,week){
  if(!G||!G.leagues)return;
  G.leagues.forEach(lg=>(lg.clubs||[]).forEach(club=>{
    if(club.id!==G.myClubId&&club.ai)flushWeeklyNews(club,season,week);
  }));
}

// ── Walka o tytuł / o utrzymanie — 3 kolejki przed końcem sezonu ────────────
function checkTitleRelegationRace(){
  if(!G||!G.leagues||!G.allStandings)return;
  G.leagues.forEach(lg=>{
    const lvl=lg.level;
    const nClubs=(lg.clubs||[]).length;
    if(nClubs<3)return;
    const totalRounds=2*(nClubs-1);
    if(G.round!==totalRounds-2)return; // dokładnie raz, 3 kolejki do końca
    const remaining=totalRounds-G.round;
    const margin=remaining*3;
    const st=[...(G.allStandings[lvl]||[])].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    if(!st.length)return;
    const n=st.length;

    const leaderPts=st[0].pts;
    const titleContenders=st.filter(s=>leaderPts-(s.pts||0)<=margin);
    if(titleContenders.length>=2){
      const names=titleContenders.slice(0,4).map(s=>s.n).join(', ');
      addWorldNewsEvent('title_race',{leagueLevel:lvl,
        vars:{league:LEAGUE_NAMES[lvl],n:titleContenders.length,clubs:names}});
    }

    if(lvl<8){
      const safePts=st[Math.max(0,n-3)].pts||0;
      const relCandidates=st.filter((s,idx)=>idx>=Math.max(0,n-4)&&safePts-(s.pts||0)<=margin);
      if(relCandidates.length>=2){
        const names=relCandidates.slice(-4).map(s=>s.n).join(', ');
        addWorldNewsEvent('relegation_race',{leagueLevel:lvl,
          vars:{league:LEAGUE_NAMES[lvl],clubs:names}});
      }
    }
  });
}

// ── Bukmacherska zapowiedź sezonu — raz na ligę, na starcie sezonu ──────────
// Bukmacherskie szanse — softmax po tStr() znormalizowanym w obrębie ligi (0..1), więc kształt
// rozkładu (lider ~20-25%, outsider kilka %) jest ten sam niezależnie od bezwzględnej skali OVR
// danej ligi. invert=true liczy „ryzyko" (najsłabszy dostaje najwyższy %) — użyte do spadku.
function _bookmakerOdds(clubs,invert){
  const vals=clubs.map(c=>tStr(c.id));
  const min=Math.min(...vals),max=Math.max(...vals);
  const range=Math.max(1,max-min);
  const SCALE=3.2;
  const weighted=clubs.map((c,i)=>{
    const norm=(vals[i]-min)/range;
    const x=invert?(1-norm):norm;
    return {c,w:Math.exp(x*SCALE)};
  });
  const total=weighted.reduce((s,x)=>s+x.w,0);
  return weighted.map(({c,w})=>({c,pct:Math.max(1,Math.round(100*w/total))}))
    .sort((a,b)=>b.pct-a.pct);
}
function _oddsPct(odds,clubId){
  const found=odds&&odds.find(o=>o.c.id===clubId);
  return found?found.pct:1;
}
// Odnośnik do karty klubu wewnątrz tekstu newsa (news sam nie ma clubId — dotyczy całej ligi).
// stopPropagation: wpis newsa bywa sam w sobie klikalny (n.clubId, patrz _worldNewsItemHtml) —
// bez tego klik w link klubu wewnątrz tekstu otwierałby zamiast niego kartę klubu z całego wiersza.
function _clubLink(c){
  return '<span onclick="event.stopPropagation();openClubModal('+c.id+')" style="cursor:pointer;text-decoration:underline">'+c.n+'</span>';
}
// Zamienia KAŻDE wystąpienie nazwy klubu w tekście newsa na klikalny link do jego karty — dotyczy
// wszystkich klubów wymienionych w treści (nie tylko tego, do którego news jest przypięty przez
// n.clubId — np. rywal w wyniku derbów, obie strony transferu, lista klubów w walce o tytuł).
// Pomija wiadomości, które już mają linki (np. bukmacherska zapowiedź sezonu buduje je sama),
// żeby nie zagnieżdżać <span> w <span>. Sortowanie po długości nazwy — zabezpieczenie na wypadek,
// gdyby jedna nazwa klubu była literalnym podciągiem innej.
function _linkifyClubNames(msg){
  if(!msg||msg.indexOf('openClubModal(')!==-1)return msg;
  const clubs=(ALL_CLUBS||[]).filter(c=>c&&c.n).slice().sort((a,b)=>b.n.length-a.n.length);
  clubs.forEach(c=>{
    if(msg.indexOf(c.n)===-1)return;
    msg=msg.split(c.n).join(_clubLink(c));
  });
  return msg;
}
// Buduje wieloliniowy news ligowy: TOP 3 kandydatów do tytułu/awansu i TOP 3 zagrożonych spadkiem
// (liga VIII nie ma spadku — reset składu zamiast tego, patrz startNewSeason()).
function _buildSeasonPreviewMsg(lg){
  const lvl=lg.level;
  const clubs=lg.clubs||[];
  const titleOdds=_bookmakerOdds(clubs,false);
  const relOdds=lvl<8?_bookmakerOdds(clubs,true):null;
  const titleLabel=lvl===1?t('season_preview_title_label'):t('season_preview_promo_label');
  let msg=t('world_news_season_preview_header').replace('{league}',LEAGUE_NAMES[lvl]);
  msg+='<br>'+titleLabel;
  titleOdds.slice(0,3).forEach((o,i)=>{msg+='<br>'+(i+1)+'. '+_clubLink(o.c)+' — '+o.pct+'%';});
  if(relOdds){
    msg+='<br>'+t('season_preview_relegation_label');
    relOdds.slice(0,3).forEach((o,i)=>{msg+='<br>'+(i+1)+'. '+_clubLink(o.c)+' — '+o.pct+'%';});
  }
  return {msg,titleOdds,relOdds};
}
function announceSeasonPreview(){
  if(!G||!G.leagues)return;
  G.leagues.forEach(lg=>{
    const lvl=lg.level;
    const clubs=lg.clubs||[];
    if(clubs.length<3)return;
    // Zapowiedź jest teraz o CAŁEJ lidze (TOP 3 + TOP 3), nie o jednym klubie — zawsze bez
    // clubId (nie wchodzi do bufora/digestu jednego klubu, patrz sekcja 09 architektury).
    const {msg,titleOdds,relOdds}=_buildSeasonPreviewMsg(lg);
    addWorldNews(msg,'season_preview',null,lvl,null,WORLD_NEWS_TYPES.season_preview.priority);
    // ── Twój klub: dedykowany news w G.news (nie tylko world-news ligi) z własnymi szansami ──
    if(lvl===G.myLeague&&G.myClubId){
      const myTitlePct=_oddsPct(titleOdds,G.myClubId);
      const key=lvl===1?'startnews_odds_title':(relOdds?'startnews_odds_promo_rel':'startnews_odds_promo_only');
      let myMsg=t(key).replace('{titlePct}',myTitlePct);
      if(relOdds)myMsg=myMsg.replace('{relPct}',_oddsPct(relOdds,G.myClubId));
      addNews(myMsg,'club');
    }
  });
}

// ── Derby: parowanie (arbitralne, brak danych geograficznych) + ogłoszenie ──
function assignDerbyPairs(){
  if(!G||!G.leagues)return;
  G.leagues.forEach(lg=>{
    const clubs=lg.clubs||[];
    clubs.forEach(c=>{c.rivalId=null;}); // reset — większość klubów nie ma rywala
    // Tylko 2 pary derbowe na ligę (nie wszystkie kluby) — losowe, ale spośród wszystkich,
    // więc każdy klub (łącznie z klubem gracza) ma szansę trafić do puli w danym sezonie.
    const shuffled=[...clubs];
    for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    const pairsToPick=Math.min(2,Math.floor(shuffled.length/2));
    for(let i=0;i<pairsToPick;i++){
      const a=shuffled[i*2],b=shuffled[i*2+1];
      if(a&&b){a.rivalId=b.id;b.rivalId=a.id;}
    }
  });
  // Ożywia dziś martwe G.rival (engine/kronika.js) — bez zmian w tamtym pliku.
  if(G.myClub)G.rival=ALL_CLUBS.find(c=>c.id===G.myClub.rivalId)||null;
}
function announceDerbies(){
  if(!G||!G.leagues)return;
  G.leagues.forEach(lg=>{
    const lvl=lg.level;
    const clubs=lg.clubs||[];
    const seen=new Set();
    const pairs=[];
    clubs.forEach(c=>{
      if(c.rivalId&&!seen.has(c.id)&&!seen.has(c.rivalId)){
        const rival=clubs.find(x=>x.id===c.rivalId);
        if(rival){pairs.push(c.n+' – '+rival.n);seen.add(c.id);seen.add(c.rivalId);}
      }
    });
    if(!pairs.length)return;
    addWorldNewsEvent('derby_announce',{leagueLevel:lvl,
      vars:{league:LEAGUE_NAMES[lvl],pairs:pairs.join(', ')}});
  });
}
// Wołane po każdym meczu z hooków streak (match-post.js AI↔AI, match-engine.js mecz gracza).
// Pomija remisy — derby news tylko przy rozstrzygnięciu.
function checkDerbyResult(winnerClub,loserClub,winnerGoals,loserGoals,leagueLevel){
  if(!winnerClub||!loserClub||winnerGoals===loserGoals)return;
  if(winnerClub.rivalId!==loserClub.id)return;
  addWorldNewsEvent('derby_result',{clubId:winnerClub.id,leagueLevel,
    vars:{club:winnerClub.n,rival:loserClub.n,score:winnerGoals+':'+loserGoals}});
}

// ── Retrospektywa sezonu — klub AI + liga, redakcyjny render nad G.worldNews ─
// digest LICZY SIĘ jako pojedynczy materiał (to już zbiorczy news tego tygodnia) — gdyby go
// wykluczyć, klub, którego zdarzenia w tym samym tygodniu scaliły się w jeden digest, nigdy nie
// przekroczyłby progu 2 pozycji i retrospektywa by dla niego nigdy nie powstała.
// season_preview/derby_announce to zapowiedzi z TYGODNIA 1 tego samego sezonu (bukmacherski typ,
// pary derbowe) — mają wysoki priorytet więc łatwo wskakują do top 5/4 po zdarzeniach, ale nie są
// tym, co się w sezonie WYDARZYŁO, więc nie mają czego szukać w retrospektywie „sezon w skrócie".
function _seasonRecapEligible(n,season){
  return n.season===season&&n.type!=='season_recap_club'&&n.type!=='season_recap_league'
    &&n.type!=='season_preview'&&n.type!=='derby_announce';
}
// digest ma własny nagłówek „Tydzień {club}: " — sensowny w logu tygodniowym, ale myląco
// zagnieżdżony w retrospektywie sezonu („sezon w skrócie" pokazujący „tydzień X" w środku).
// Przy wklejaniu do recapu ściągamy ten nagłówek, zostawiając samą treść zdarzeń.
function _stripDigestPrefix(n){
  if(n.type!=='digest')return n.msg;
  const club=ALL_CLUBS.find(c=>c.id===n.clubId);
  if(!club)return n.msg;
  const prefix=t('world_news_digest_prefix').replace('{club}',club.n);
  return n.msg.indexOf(prefix)===0?n.msg.slice(prefix.length):n.msg;
}
function generateSeasonRecaps(season,week){
  if(!G||!G.leagues)return;
  G.leagues.forEach(lg=>{
    const lvl=lg.level;
    (lg.clubs||[]).forEach(club=>{
      if(club.id===G.myClubId||!club.ai)return;
      const items=(G.worldNews||[])
        .filter(n=>_seasonRecapEligible(n,season)&&n.clubId===club.id)
        .sort((a,b)=>b.priority-a.priority).slice(0,4);
      // Retrospektywa klubu powstaje KAŻDY sezon dla KAŻDEGO klubu AI — nawet gdy sezon był
      // wyjątkowo spokojny (brak zdarzeń nad progiem), żeby w karcie klubu nie brakowało wpisu
      // za dany sezon. Priorytet 40: celowo POD progiem zakładki ligi (LEAGUE_TAB_MIN_PRIORITY=50)
      // — retrospektywa klubu ma być widoczna tylko w jego karcie, nie duplikować się w newsach
      // całej ligi (tam jest już season_recap_league, budowany osobno z tych samych „surowców").
      const body=items.length?items.map(x=>_stripDigestPrefix(x)).join(' • '):t('world_news_season_recap_club_empty');
      const msg=t('world_news_season_recap_club_prefix').replace('{club}',club.n)+body;
      addWorldNews(msg,'season_recap_club',club.id,lvl,null,40,season,week);
    });
    // W VII Lidze (poziom 8, najniższa) 'relegation' oznacza kluby PRZYCHODZĄCE tam z VI Ligi
    // (news trafia do ligi docelowej) — dla samego klubu to sensowna historia (zostaje w jego
    // retrospektywie wyżej), ale w retrospektywie CAŁEJ VII Ligi brzmi myląco, jakby dało się
    // spaść jeszcze niżej. Wykluczone tylko stąd, nie z bieżących newsów ligi ani karty klubu.
    const leagueItems=(G.worldNews||[])
      .filter(n=>_seasonRecapEligible(n,season)&&n.leagueLevel===lvl&&!(lvl===8&&n.type==='relegation'))
      .sort((a,b)=>b.priority-a.priority).slice(0,5);
    if(leagueItems.length<2)return;
    const lmsg=t('world_news_season_recap_league_prefix').replace('{league}',LEAGUE_NAMES[lvl])+leagueItems.map(x=>_stripDigestPrefix(x)).join(' • ');
    addWorldNews(lmsg,'season_recap_league',null,lvl,null,85,season,week);
  });
}
// ── Migracja zapisów sprzed naprawy retrospektywy (kasowanej limitem per liga/progiem
// „wydarzeniowości", lub — dla klubu gracza — nigdy nie generowanej, bo klub gracza nie ma
// club.ai i nie przechodzi przez addWorldNewsEvent) — dogenerowuje brakujące season_recap_club
// dla KAŻDEGO zakończonego sezonu (S1..G.season-1) i KAŻDEGO klubu, gracza włącznie, żeby karta
// klubu miała wpis za każdy sezon od S1. Wołane przy każdym wczytaniu zapisu (news-bootstrap.js
// loadGame) — bezpieczne przy wielokrotnym uruchomieniu, bo sprawdza czy wpis już istnieje zanim
// go doda. Nie zna szczegółów zdarzeń z utraconych sezonów (te dane już nie istnieją — G.news
// klubu gracza jest czyszczone co sezon, G.worldNews klubów AI miało próg/limit), więc wstawia
// ogólny tekst zamiast ich zmyślać.
function backfillMissingClubRecaps(){
  if(!G||!G.leagues)return;
  const lastCompleted=(G.season||1)-1;
  if(lastCompleted<1)return;
  G.leagues.forEach(lg=>{
    const lvl=lg.level;
    (lg.clubs||[]).forEach(club=>{
      if(!club.ai&&club.id!==G.myClubId)return;
      for(let s=1;s<=lastCompleted;s++){
        const has=(G.worldNews||[]).some(n=>n.type==='season_recap_club'&&n.clubId===club.id&&n.season===s);
        if(has)continue;
        const msg=t('world_news_season_recap_club_prefix').replace('{club}',club.n)+t('world_news_season_recap_club_backfill');
        addWorldNews(msg,'season_recap_club',club.id,lvl,null,40,s,33);
      }
    });
  });
}
// ── Napraw retrospektywy, w których zgubiło się mistrzostwo ─────────────────
// G.lgHist (tabele końcowe każdej ligi/sezonu — niezależne źródło, to z niego liczy się trofeum
// w karcie klubu) zawsze poprawnie wie, kto był mistrzem. Ale retrospektywy (season_recap_club)
// z sezonów sprzed naprawy potoku newsów (kolejność G.season++, limit per liga, brak ścieżki dla
// klubu gracza — wszystko już naprawione wyżej) mogły w tamtym czasie zgubić samo zdarzenie
// „mistrzostwo" i zostać z ogólnikowym tekstem-wypełniaczem. Naprawiamy TYLKO wypełniacze
// (Spokojny sezon / Brak szczegółowych danych) — jeśli retrospektywa ma już jakąkolwiek realną
// treść, zakładamy że mistrzostwo tam jest (albo celowo go tam nie ma) i jej nie ruszamy, żeby
// nie zdublować wzmianki w świeżo poprawnie wygenerowanych wpisach.
function fixMissingChampionInRecaps(){
  if(!G||!G.lgHist||!G.worldNews)return;
  const FILLER=new Set([t('world_news_season_recap_club_empty'),t('world_news_season_recap_club_backfill')]);
  Object.keys(G.lgHist).forEach(lvl=>{
    (G.lgHist[lvl]||[]).forEach(h=>{
      if(!h.champion||h.champion.cid==null)return;
      const cid=h.champion.cid,season=h.season;
      const entry=G.worldNews.find(n=>n.type==='season_recap_club'&&n.clubId===cid&&n.season===season);
      if(!entry)return;
      const prefix=t('world_news_season_recap_club_prefix').replace('{club}',h.champion.n||'');
      const body=entry.msg.indexOf(prefix)===0?entry.msg.slice(prefix.length):entry.msg;
      if(!FILLER.has(body))return;
      const leagueName=LEAGUE_NAMES[Number(lvl)]||'';
      entry.msg=prefix+t('world_news_champion_recap_fallback').replace('{league}',leagueName);
    });
  });
}
// Po zbudowaniu retrospektywy surowe wpisy minionych sezonów są już zbędne — zostały wchłonięte
// przez season_recap_club/league. Czyścimy je, żeby historia zawierała tylko podsumowania, a
// bieżący (dopiero co rozpoczęty) sezon zaczynał się czysto od derby/zapowiedzi bukmacherów.
// Uwaga: to musi być reguła oparta o numer sezonu (>=G.season), nie o wyliczankę typów „do
// zachowania" — inaczej każdy nowy typ newsa bez clubId (jak goal_summary) trzeba by pamiętać
// dopisać do takiej listy, a zapomnienie kasowałoby go natychmiast po utworzeniu.
// endedSeason: numer sezonu, który się właśnie skończył. Retrospektywa LIGI (season_recap_league,
// zakładka światowa) jest tam pokazywana tylko dla ostatniego zakończonego sezonu — starsze (S1,
// S0… przy przejściu do S3) znikają z listy. Retrospektywa KLUBU (season_recap_club) zostaje
// za to na zawsze — to jest kronika widoczna w karcie klubu, tam ma być pełna historia sezonów.
function purgeSeasonToRecapOnly(endedSeason){
  if(!G||!G.worldNews)return;
  G.worldNews=G.worldNews.filter(n=>{
    if(n.type==='season_recap_club')return true;
    if(n.type==='season_recap_league')return endedSeason==null||n.season>=endedSeason;
    return n.season>=G.season;
  });
}

function _worldNewsItemHtml(n){
  const def=WORLD_NEWS_TYPES[n.type]||{};
  const bar=def.color||'#546e54';
  const clickable=!!n.clubId;
  const clickAttr=clickable?' onclick="openClubModal('+n.clubId+')" style="cursor:pointer"':'';
  // Ikona NIE jest dublowana tutaj — każdy szablon newsa (i18n.js) już zaczyna się od
  // własnej ikony, więc osobny znacznik ikony tylko powielałby to, co jest w n.msg.
  return '<div'+clickAttr+' style="display:flex;align-items:stretch;border-bottom:1px solid #0a180a">'
    +'<div style="width:3px;background:'+bar+';flex-shrink:0"></div>'
    +'<div style="display:flex;align-items:flex-start;gap:7px;padding:6px 10px;flex:1">'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:var(--fs-dense);color:var(--wh);line-height:1.3">'+_linkifyClubNames(n.msg)+'</div>'
        +'<div style="font-size:var(--fs-micro);color:var(--gr);margin-top:2px">'+t('world_news_meta').replace('{s}',n.season).replace('{n}',n.week)+'</div>'
      +'</div>'
    +'</div>'
  +'</div>';
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
