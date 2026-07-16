// ── EKRAN STARTOWY (Wariant B) ───────────────────────────────────────────
// Dashboard bez własnej pozycji na pasku — to, co widać po zamknięciu dowolnego panelu:
// skrót celu zarządu + aktualności. Newsy renderują się bez zmian przez renderNews()/
// #news-list (news-bootstrap.js) — ten plik dokłada tylko skrót celu zarządu nad nimi.
function renderGabinetBoardGoal(){
  const el=document.getElementById('gabinet-board-goal');if(!el||!G)return;
  const b=G.board;
  if(!b||!b.mainGoal){
    el.innerHTML='<div class="gab-goal-pending">'+t('board_goals_pending')+'</div>';
    return;
  }
  const g=b.mainGoal;
  const stars='★'.repeat(g.stars||3)+'☆'.repeat(5-(g.stars||3));
  el.innerHTML='<div class="gab-goal-card" onclick="_goToBoardTab()">'
    +'<div class="gab-goal-hdr"><span>'+t('gab_goal_label')+'</span><span style="color:var(--am)">'+stars+'</span></div>'
    +'<div class="gab-goal-lbl">'+g.label+'</div>'
    +'<div class="gab-goal-desc">'+g.desc+'</div>'
  +'</div>';
}
// Zarząd nie ma osobnej głównej zakładki — zostaje wyłącznie wewnątrz Finansów (jak dziś).
function _goToBoardTab(){
  openPanel('p-finance');
  setTimeout(()=>{const btn=document.querySelector('#p-finance .tab-btn[data-tab="zarzad"]');if(btn)btn.click();},200);
}

// ── PASEK GŁÓWNY ─────────────────────────────────────────────────────────
// Pasek jest widoczny wyłącznie na ekranie startowym (tak jak dawny tile-grid) — każda
// pozycja otwiera realny, pełnoekranowy panel, który przykrywa pasek dokładnie tak, jak
// dziś robią to kafelki. Dlatego pasek nie potrzebuje śledzenia aktywnej pozycji — ekran
// startowy (aktualności) nie ma tu odpowiednika i to jedyny stan, w którym pasek widać.
function goNav(id){
  if(id==='kalendarz'){openPanel('p-kalendarz');return;}
  if(id==='sklad'){openPanel('p-squad');return;}
  if(id==='tabela'){openPanel('p-table');return;}
}
function openMoreSheet(){
  const sh=document.getElementById('navbar-sheet'),sc=document.getElementById('navbar-sheet-scrim');
  if(sh)sh.classList.add('show');
  if(sc)sc.classList.add('show');
}
function closeMoreSheet(){
  const sh=document.getElementById('navbar-sheet'),sc=document.getElementById('navbar-sheet-scrim');
  if(sh)sh.classList.remove('show');
  if(sc)sc.classList.remove('show');
}
function pickMoreTile(panelId){
  closeMoreSheet();
  openPanel(panelId);
}

// ── KALENDARZ (Wariant B) — terminarz ligowy + pucharowy, w miejsce GABINETU na pasku ──
// Łączy G.schedule (mecze ligowe, {h,a,rnd,done,hg,ag}) z G.cup.rounds (mecze pucharowe,
// h/a to obiekty {cid,name,...} — inny kształt niż w G.schedule, patrz initCup() w
// cup-engine.js) w jedną listę posortowaną po przybliżonym tygodniu. Runda ligowa 1
// zawsze wypada w tygodniu 3 (G.round rośnie o 1 od tygodnia 3 — advWeek() w
// week-progress.js), więc week=rnd+2; tygodnie rund pucharowych są stałe (CUP_WEEKS).
function fillKalendarz(){
  if(!G)return;
  const rows=_kalBuildRows();
  const nextRow=rows.find(r=>!r.done);
  _kalRenderNext(nextRow);
  _kalRenderList(rows);
}
function _kalBuildRows(){
  const rows=[];
  (G.schedule||[]).forEach(m=>{
    if(m.h!==G.myClubId&&m.a!==G.myClubId)return;
    const isHome=m.h===G.myClubId;
    const opp=(ALL_CLUBS||[]).find(c=>c.id===(isHome?m.a:m.h));
    rows.push({week:m.rnd+2,cup:false,opp:opp?opp.n:'?',isHome,done:m.done,hg:m.hg,ag:m.ag});
  });
  if(G.cup&&G.cup.rounds&&typeof CUP_WEEKS!=='undefined'){
    G.cup.rounds.forEach((rnd,idx)=>{
      const m=(rnd||[]).find(x=>x&&x.h&&x.a&&(x.h.cid===G.myClubId||x.a.cid===G.myClubId));
      if(!m)return;
      const isHome=m.h.cid===G.myClubId;
      const opp=isHome?m.a:m.h;
      rows.push({week:CUP_WEEKS[idx]||(idx*5+5),cup:true,opp:opp.name,isHome,done:m.done,hg:m.hg,ag:m.ag});
    });
  }
  rows.sort((a,b)=>a.week-b.week);
  return rows;
}
function _kalResultClass(r){
  if(!r.done||r.hg==null||r.ag==null)return '';
  const my=r.isHome?r.hg:r.ag,opp=r.isHome?r.ag:r.hg;
  return my>opp?'win':my<opp?'loss':'draw';
}
function _kalRowHtml(r,clickable){
  const venue=r.isHome?t('hdr_home'):t('hdr_away');
  const cupTag=r.cup?'<span class="kal-cup-tag">'+t('kal_cup_tag')+'</span> ':'';
  const scoreHtml=r.done
    ?'<span class="kal-score '+_kalResultClass(r)+'">'+r.hg+':'+r.ag+'</span>'
    :(clickable?'<span class="kal-score next">▶</span>':'<span class="kal-score">—</span>');
  const cls=clickable?'kal-row next':'kal-row';
  const click=clickable?' onclick="handleNextWeek()"':'';
  return '<div class="'+cls+'"'+click+'>'
    +'<div class="kal-mid"><div class="kal-opp">'+cupTag+r.opp+'</div><div class="kal-venue">'+venue+'</div></div>'
    +scoreHtml
  +'</div>';
}
function _kalRenderNext(row){
  const el=document.getElementById('kal-next');if(!el)return;
  el.innerHTML=row?_kalRowHtml(row,true):'<div class="kal-empty">'+t('kal_none_next')+'</div>';
}
function _kalRenderList(rows){
  const el=document.getElementById('kal-list');if(!el)return;
  el.innerHTML=rows.length?rows.map(r=>_kalRowHtml(r,false)).join(''):'<div class="kal-empty">'+t('kal_none')+'</div>';
}
