function openSaveModal(){
  if(!G)return;
  const el=document.getElementById('save-slots-list');
  if(!el)return;
  el.innerHTML=[1,2,3].map(s=>{
    const i=saveInfo(s);
    const info=i?'<div style="font-size:var(--fs-dense);color:var(--gr)">'+i.club+' • '+t('saves_season')+' '+i.season+' • '+t('saves_round')+' '+i.round+'</div>':'<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('saves_empty')+'</div>';
    return '<div style="background:var(--tb);border:1px solid var(--gl);padding:10px 12px;margin-bottom:8px;cursor:pointer" onclick="doSaveSlot('+s+')">'+
      '<div style="font-size:var(--fs-dense);color:var(--am);margin-bottom:4px">'+t('saves_slot')+' '+s+(i?' ✔':'')+'</div>'+
      info+'</div>';
  }).join('');
  openModal('m-save');
}

function doSaveSlot(slot){
  saveGame(slot);
  closeModal('m-save');
}

function goSaves(){const el=document.getElementById('saves-list');if(el)el.innerHTML=[1,2,3].map(s=>{const i=saveInfo(s);if(!i)return'<div class="save-slot empty"><div class="save-slot-title">'+t('saves_slot')+' '+s+'</div><div class="save-slot-info" style="font-size:var(--fs-dense)">'+t('saves_empty')+'</div></div>';return'<div class="save-slot"><div class="save-slot-title">'+t('saves_slot')+' '+s+' \u2014 '+i.club+'</div><div class="save-slot-info" style="font-size:var(--fs-dense)">'+t('saves_season')+' '+i.season+' \u2022 '+t('saves_round')+' '+i.round+'</div><div class="save-slot-date">'+new Date(i.savedAt).toLocaleString(LANG==='en'?'en-GB':'pl-PL')+'</div><div class="save-slot-btns"><div class="ssb" onclick="doLoad('+s+')">'+t('saves_load')+'</div><div class="ssb del" onclick="doDel('+s+')">'+t('saves_delete')+'</div></div></div>';}).join('');go('v-saves');}
function doLoad(s){if(loadGame(s)){go('v-game');updateHdr();notif(t('saves_loaded_ok').replace('{name}',G.myClub.n),'ok');}else notif(t('saves_loaded_err'),'err');}
function doDel(s){delSave(s);goSaves();}
// Wyczysc uszkodzone zapisy przy starcie
(function(){
  for(var _i=localStorage.length-1;_i>=0;_i--){var _k=localStorage.key(_i);if(_k&&_k.startsWith('pa_save_'))try{localStorage.removeItem(_k);}catch(_){}}
  [1,2,3].forEach(function(s){
    try{const d=localStorage.getItem('pa'+s);if(d&&d.length>0){JSON.parse(d);}}
    catch(e){console.warn('Auto-usunieto uszkodzony zapis slot '+s);localStorage.removeItem('pa'+s);}
  });
})();


function resumeGame(){
  if(!G)return;
  go('v-game');
  updateHdr();
}

// Wznowienie blokady meczu po restarcie aplikacji (kill/relaunch w trakcie
// analizy przedmeczowej lub trwania meczu) — zapis 'lock' jest jednorazowym
// biletem: odczytany i skasowany przy pierwszym starcie, niezależnie od wyniku.
function tryResumeMatchLock(){
  var raw;
  try{raw=localStorage.getItem('palock');}catch(_){raw=null;}
  if(!raw)return false;
  var parsed;
  try{parsed=JSON.parse(raw);}catch(_){parsed=null;}
  var wasLocked=!!(parsed&&parsed._matchLockActive);
  var phase=parsed&&parsed._matchLockPhase;
  if(!wasLocked){try{localStorage.removeItem('palock');}catch(_){}return false;}
  var ok=loadGame('lock');
  try{localStorage.removeItem('palock');}catch(_){}
  if(!ok||!G||!nextMatch()){_releaseMatchLock();return false;}
  go('v-game');updateHdr();
  openPanel('p-match');
  if(phase==='live'){
    matchInProgress=false;// świeży load — animacja sprzed restartu i tak nie istnieje
    setMatchSpeed(0);
    simMatch();
  } else {
    _engageMatchLock('prematch');
  }
  return true;
}

function goSetup(){
  if(G){
    // Pokaż własny modal zamiast confirm()
    const modal=document.getElementById('modal-newgame');
    if(modal){modal.style.display='flex';return;}
  }
  _startNewGameFlow();
}
function _startNewGameFlow(){
  const tmpLeagues=initLeagues();window._setupLeagues=tmpLeagues;
  CURRENT_CURRENCY='EUR';
  _syncCurrencyButtons();
  go('v-setup');
  setTimeout(()=>drawRandomClub(),50);
}

// Przełącznik waluty wyświetlania — niezależny od wyboru języka.
// Dostępny na ekranie tworzenia kariery ORAZ w menu głównym (także w trakcie aktywnej gry).
function setCurrency(cur){
  if(!CURRENCY_RATES[cur])return;
  CURRENT_CURRENCY=cur;
  if(G)G.currency=cur;
  _syncCurrencyButtons();
  const budEl=document.getElementById('setup-budget');
  if(budEl)budEl.textContent=fmt(LEAGUE_BUDGET[8]||12000);
  if(G){
    updateHdr();
    _refreshOpenPanels();
  }
}
function _syncCurrencyButtons(){
  ['USD','EUR','PLN'].forEach(c=>{
    ['cur-btn-','cur-menu-btn-'].forEach(prefix=>{
      const b=document.getElementById(prefix+c.toLowerCase());
      if(!b)return;
      const on=CURRENT_CURRENCY===c;
      b.style.borderWidth=on?'2px':'1px';
      b.style.borderColor=on?'var(--am)':'var(--gr)';
      b.style.color=on?'var(--am)':'var(--gr)';
    });
  });
}

function drawRandomClub(){
  const clubs=getLeagueClubs(window._setupLeagues,8);
  const c=clubs[Math.floor(Math.random()*clubs.length)];
  selClubId=c.id;

  // OVR z gradientu
  const pos0=clubs.indexOf(c);
  const t7=clubs.length>1?(clubs.length-1-pos0)/(clubs.length-1):0.5;
  const ovrLo=LEAGUE_OVR[8]?LEAGUE_OVR[8][0]:8;
  const ovrHi=LEAGUE_OVR[8]?LEAGUE_OVR[8][3]:42;
  const cMin=Math.round(ovrLo+(ovrHi-ovrLo)*t7*0.7);
  const cMax=Math.round(ovrLo+(ovrHi-ovrLo)*t7)+8;
  const avgOvr=Math.round(ovrLo+(ovrHi-ovrLo)*t7);

  // Tymczasowi zawodnicy do pokazania najlepszego/najslabszego
  const _POS18=['GK','GK','OBR','OBR','OBR','OBR','OBR','OBR','POL','POL','POL','POL','POL','POL','NAP','NAP','NAP','NAP'];
  const tmpPls=_POS18.map(pos=>{
    const tgt=r(Math.max(1,cMin),Math.min(99,cMax));
    return{pos,tec:tgt,pas:tgt,sht:tgt,def:tgt,phy:tgt,men:tgt,name:(NAME_POOL&&NAME_POOL.length?NAME_POOL[Math.floor(Math.random()*NAME_POOL.length)]:'Jan Kowalski')};
  });
  const srt=[...tmpPls].sort((a,b)=>ovr(b)-ovr(a));
  const best=srt[0], worst=srt[srt.length-1];
  const bestName=typeof best.name==='object'?best.name.first+' '+best.name.last:best.name;
  const worstName=typeof worst.name==='object'?worst.name.first+' '+worst.name.last:worst.name;

  // Aktualizuj karte
  window._customClubName=null; // reset niestandardowej nazwy przy prze-losowaniu
  const nameEl=document.getElementById('setup-club-name');
  if(nameEl)nameEl.textContent=c.n;
  const crestEl=document.getElementById('setup-club-crest');
  if(crestEl&&typeof pxCrest==='function'){crestEl.innerHTML='';crestEl.appendChild(pxCrest(c.id,3));}
  _updateSetupPreview();
  const barEl=document.getElementById('setup-ovr-bar');
  if(barEl)barEl.style.width=Math.round(avgOvr/99*100)+'%';
  const valEl=document.getElementById('setup-ovr-val');
  if(valEl)valEl.textContent='OVR '+avgOvr;
  const budEl=document.getElementById('setup-budget');
  if(budEl)budEl.textContent=fmt(LEAGUE_BUDGET[8]||12000);
  const bestEl=document.getElementById('setup-best');
  if(bestEl)bestEl.textContent=bestName+' ('+ovr(best)+')';
  const worstEl=document.getElementById('setup-worst');
  if(worstEl)worstEl.textContent=worstName+' ('+ovr(worst)+')';

  _updateRerollBtn();
}

function rerollClub(){
  drawRandomClub();
}

function editClubName(){
  const inp=document.getElementById('setup-club-name-input');
  const nameEl=document.getElementById('setup-club-name');
  if(!inp||!nameEl)return;
  inp.value=nameEl.textContent;
  inp.style.display='block';
  inp.focus();inp.select();
  nameEl.style.display='none';
}

function saveClubName(){
  const inp=document.getElementById('setup-club-name-input');
  const nameEl=document.getElementById('setup-club-name');
  if(!inp||!nameEl)return;
  const newName=inp.value.trim();
  if(newName){
    nameEl.textContent=newName;
    window._customClubName=newName; // tylko zapamiętaj, nie zmieniaj AI
  }
  inp.style.display='none';
  nameEl.style.display='';
  _updateSetupPreview();
}

function selClub(id,el){document.querySelectorAll('.club-opt').forEach(e=>e.classList.remove('sel'));el.classList.add('sel');selClubId=id;}

// ── FILOZOFIA SKŁADU (Talent/Wiek) + NATURALNY SZUM — Krok 1/2 przed startem sezonu ──
let _philTalent='star', _philAge='young', _philChosenIds=[], _squadRolled=false;

function goToPhilosophyStep(){
  if(!selClubId){notif(t('setup_no_club_err'),'err');return;}
  document.getElementById('setup-step0').style.display='none';
  document.getElementById('setup-start-btn').style.display='none';
  document.getElementById('panel-philosophy').style.display='block';
}

// Podgląd na żywo (nazwa managera + nazwa/herb klubu) w Kroku 0 — wołane przy wpisywaniu
// nazwy managera (oninput na #mgr-name) oraz przy losowaniu/zmianie nazwy klubu.
function _updateSetupPreview(){
  const mgrEl=document.getElementById('mgr-name');
  const mgrVal=mgrEl?mgrEl.value.trim():'';
  const nameEl=document.getElementById('setup-preview-name');
  if(nameEl){
    const clubNameEl=document.getElementById('setup-club-name');
    nameEl.textContent=(clubNameEl?clubNameEl.textContent:'—')||'—';
  }
  const mgrPreview=document.getElementById('setup-preview-mgr');
  if(mgrPreview)mgrPreview.textContent='trener: '+(mgrVal||'—');
  const crestEl=document.getElementById('setup-preview-crest');
  if(crestEl&&selClubId&&typeof pxCrest==='function'){crestEl.innerHTML='';crestEl.appendChild(pxCrest(selClubId,2));}
}

function selectTalent(value,el){
  if(_squadRolled)return; // zablokowane po losowaniu — nie da się już zmienić Talentu
  el.parentElement.querySelectorAll('.club-opt').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel');
  _philTalent=value;
}
function selectAge(value,el){
  if(_squadRolled)return; // zablokowane po losowaniu — nie da się już zmienić Wieku
  el.parentElement.querySelectorAll('.club-opt').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel');
  _philAge=value;
}

// Wspólny punkt wejścia do initGame() dla nowego flow — idempotentny (bezpieczny, gdyby
// startGame() zostało kiedyś wywołane bez przejścia przez Krok 1/2 Talent/Wiek/Losowanie).
function _ensureCareerInitialized(){
  if(G)return true;
  const name=(document.getElementById('mgr-name')||{value:t('setup_mgr_default')}).value.trim()||t('setup_mgr_default');
  if(!selClubId){notif(t('setup_no_club_err'),'err');return false;}
  const startLg=parseInt(document.getElementById('start-league-sel')?.value||'8');
  initGame(name,selClubId,startLg,window._setupLeagues);
  return true;
}

// Przesuwa OVR 1 (Gwiazda) lub 2 (Fundament) losowych zawodników składu gracza w górę,
// kompensując resztę w dół — suma OVR całego 24-osobowego składu się nie zmienia (dodanie
// stałej delty do wszystkich 6 atrybutów przesuwa ovr() dokładnie o tę deltę, bo wagi w ovr()
// sumują się do 1). Wiek wzmocnionego zawodnika zawężony wg Wieku (Młodzieżowa 17-20 /
// Doświadczona 29-33) — calcPotential() już dziś różnicuje sufit rozwoju po wieku, nic tu nie
// trzeba dublować, wystarczy podstawić inny wiek.
function applySquadPhilosophy(){
  if(!G)return;
  const squad=myPl();
  if(!squad.length)return;
  const n=_philTalent==='star'?1:2;
  const boostEach=_philTalent==='star'?(_philAge==='veteran'?14:8):(_philAge==='veteran'?7:4);
  const ageRange=_philAge==='veteran'?[29,33]:[17,20];
  const pool=shuffled(squad);
  const chosen=[];
  pool.forEach(p=>{
    if(chosen.length>=n)return;
    if(n===2&&chosen.length===1&&chosen[0].pos===p.pos)return; // Fundament: wymuś różne pozycje
    chosen.push(p);
  });
  if(chosen.length<n)return;
  const attrs=['tec','pas','sht','def','phy','men'];
  const totalBoost=boostEach*chosen.length;
  chosen.forEach(p=>{
    p.age=r(ageRange[0],ageRange[1]);
    attrs.forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(p[a]+boostEach)));});
    p.potential=calcPotential(p,G.myLeague||8);
    p.value=calcValue(ovr(p),p.age);
    p.salary=calcSalary(p.value,G.myLeague||8,ovr(p));
  });
  const rest=squad.filter(p=>chosen.indexOf(p)===-1);
  if(rest.length){
    const perPlayer=totalBoost/rest.length;
    rest.forEach(p=>{
      attrs.forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(p[a]-perPlayer)));});
      p.potential=calcPotential(p,G.myLeague||8);
      p.value=calcValue(ovr(p),p.age);
      p.salary=calcSalary(p.value,G.myLeague||8,ovr(p));
    });
  }
  _philChosenIds=chosen.map(p=>p.id);
  myPl().forEach(p=>{p.seasonStartOvr=ovr(p);p.seasonStartAttrs={tec:p.tec,pas:p.pas,sht:p.sht,def:p.def,phy:p.phy,men:p.men};});
  G.fin.salaries=myPl().reduce((s,p)=>s+p.salary,0);
}

let _squadRollZone='mid';

// Naturalny Szum — jeden wspólny czynnik -10%/+15% na CAŁĄ resztę składu (bez zawodników
// wzmocnionych filozofią) naraz, nie osobno per zawodnik — korelowane, więc nie znosi się
// przez uśrednianie. Jednorazowe: druga i kolejne próby nic nie robią (_squadRolled). Kształt
// i Wiek muszą być już wybrane na tym samym ekranie — dopiero to jedno kliknięcie inicjalizuje
// karierę (jeśli jeszcze nie), stosuje filozofię składu i losuje wariancję razem.
function rollNaturalnySzum(){
  if(_squadRolled)return;
  if(!_ensureCareerInitialized())return;
  applySquadPhilosophy();
  const squad=myPl();
  const chosenSet=new Set(_philChosenIds);
  const factor=0.90+Math.random()*0.25;
  _squadRollZone=factor<0.97?'low':factor>1.06?'high':'mid';
  const attrs=['tec','pas','sht','def','phy','men'];
  squad.forEach(p=>{
    if(chosenSet.has(p.id))return;
    attrs.forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(p[a]*factor)));});
    p.potential=calcPotential(p,G.myLeague||8);
    p.value=calcValue(ovr(p),p.age);
    p.salary=calcSalary(p.value,G.myLeague||8,ovr(p));
  });
  myPl().forEach(p=>{p.seasonStartOvr=ovr(p);p.seasonStartAttrs={tec:p.tec,pas:p.pas,sht:p.sht,def:p.def,phy:p.phy,men:p.men};});
  G.fin.salaries=myPl().reduce((s,p)=>s+p.salary,0);
  _squadRolled=true;
  document.querySelectorAll('#panel-philosophy .club-grid').forEach(g=>g.classList.add('locked'));
  const rollBtn=document.getElementById('btn-roll-squad');
  rollBtn.disabled=true;rollBtn.style.opacity='0.5';rollBtn.textContent=t('setup_roll_done_btn');
  const finalBtn=document.getElementById('btn-final-start');
  finalBtn.disabled=false;finalBtn.style.opacity='1';
  _renderSquadRollChart();
}

function _renderSquadRollChart(){
  if(!G)return;
  const squad=[...myPl()].sort((a,b)=>ovr(b)-ovr(a));
  const chosenSet=new Set(_philChosenIds);
  const maxScale=Math.max(42,...squad.map(p=>ovr(p)));
  const bars=document.getElementById('squad-roll-bars');
  bars.innerHTML=squad.map(p=>{
    const isHi=chosenSet.has(p.id);
    const ov=ovr(p);
    const h=Math.round((ov/maxScale)*78)+18; // 18% zarezerwowane na podpis liczbowy nad słupkiem
    return '<div style="flex:1;min-width:3px;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end">'
      +'<span style="font-size:6.5px;line-height:1;color:'+(isHi?'var(--am)':'var(--gr)')+';margin-bottom:2px">'+ov+'</span>'
      +'<div style="width:100%;height:'+h+'%;background:'+(isHi?'var(--am)':'var(--gb)')+';opacity:'+(isHi?1:0.55)+'"></div>'
    +'</div>';
  }).join('');
  const avg=squad.reduce((s,p)=>s+ovr(p),0)/squad.length;
  document.getElementById('squad-roll-avg').textContent='śr. '+avg.toFixed(1);
  document.getElementById('squad-roll-chart').style.display='block';
}

function _posLabelForPress(pos){
  const map={GK:'pos_label_gk',OBR:'pos_label_obr',POL:'pos_label_pol',NAP:'pos_label_nap'};
  return t(map[pos]||'pos_label_obr');
}

// Średnia OVR ligi wynikająca wprost z LEAGUE_OVR[lvl] ([botMin,botMax,topMin,topMax]) —
// średnia środka dołu tabeli i środka szczytu tabeli, ta sama formuła którą liczyłem ręcznie
// przy diagnozie VII Ligi (band 8/20/28/42 → 24.5).
function _leagueAvgOvr(lvl){
  const b=LEAGUE_OVR[lvl]||LEAGUE_OVR[8];
  return ((b[0]+b[1])/2+(b[2]+b[3])/2)/2;
}

function confirmSeasonStart(){
  if(!_squadRolled)return;
  showPressModal(function(){startGame();});
}

// Modal "Prasa przed sezonem" — ten sam wzorzec co showBriefingModal() (dynamicznie tworzony
// overlay, bez osobnego pliku HTML). Tekst losowany z puli 10 wariantów na kombinację
// Talent×Wiek oraz osobno 10 na próg wyniku Naturalnego Szumu (press_* w core/i18n.js).
function showPressModal(onClose){
  const existing=document.getElementById('modal-press');
  if(existing)existing.remove();
  const comboKey='press_'+_philTalent+'_'+_philAge+'_';
  const comboText=t(comboKey+r(1,10));
  const rollKey='press_roll_'+_squadRollZone+'_';
  const rollText=t(rollKey+r(1,10));
  const chosen=(G.players||[]).filter(p=>_philChosenIds.indexOf(p.id)!==-1);
  const shapeIcon=_philTalent==='star'?'★':'▦';
  const playersHtml=chosen.map(p=>
    '<div style="display:flex;align-items:center;gap:10px;border-left:2px solid var(--am);background:var(--tb);padding:8px 10px;margin-bottom:6px">'
    +'<span class="press-face-slot" data-pid="'+p.id+'" data-age="'+p.age+'" style="width:28px;height:28px;border-radius:50%;overflow:hidden;background:var(--gm);border:1px solid var(--am);display:flex;align-items:center;justify-content:center;flex-shrink:0"></span>'
    +'<div style="font-size:var(--fs-dense)"><b style="color:var(--am)">'+shapeIcon+' '+p.name+'</b><br>'
    +'<span style="color:var(--gr)">'+_posLabelForPress(p.pos)+' · OVR '+ovr(p)+'</span></div></div>'
  ).join('');
  const clubDisplay=(G.myClub&&G.myClub.n)||'—';
  const squadAvg=myPl().reduce((s,p)=>s+ovr(p),0)/(myPl().length||1);
  const delta=Math.round(squadAvg-_leagueAvgOvr(G.myLeague||8));
  const deltaCol=delta>0?'var(--gb)':delta<0?'var(--rd)':'var(--gr)';
  const deltaTxt=(delta>0?'+':'')+delta+' OVR';
  const mgrDisplay=(G.mgrName||'').trim()||t('setup_mgr_default');
  const m=document.createElement('div');
  m.id='modal-press';
  m.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:10150;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;padding:20px';
  m.innerHTML='<div style="width:100%;max-width:380px;border:2px solid var(--gb);background:#0a130a;padding:16px">'
    +'<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gb);text-align:center;margin-bottom:12px">'+t('press_modal_title')+'</div>'
    +'<div id="press-club-crest" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px"><b style="color:var(--am);font-size:var(--fs-body)">'+clubDisplay+'</b></div>'
    +'<div style="font-size:var(--fs-dense);color:var(--wh);margin-bottom:8px;font-style:italic">🎲 '+rollText+'</div>'
    +'<div style="font-size:var(--fs-dense);color:var(--wh);text-align:center;background:var(--tb);border:1px solid var(--gl);padding:6px 8px;margin-bottom:12px">Średnia OVR składu: <b style="color:var(--wh)">'+squadAvg.toFixed(1)+'</b> (<b style="color:'+deltaCol+'">'+deltaTxt+'</b> od średniej ligi)</div>'
    +'<div style="font-size:var(--fs-dense);color:var(--wh);margin-bottom:12px;font-style:italic">📰 '+comboText+'</div>'
    +playersHtml
    +'<div style="font-size:var(--fs-dense);color:var(--gr);margin:10px 0">👔 '+t('press_mgr_line').replace('{mgr}',mgrDisplay).replace('{club}',clubDisplay)+'</div>'
    +'<button class="btn-start" style="margin-top:4px" id="btn-press-close">'+t('press_modal_close')+'</button>'
    +'</div>';
  document.body.appendChild(m);
  const crestSlot=document.getElementById('press-club-crest');
  if(crestSlot&&typeof pxCrest==='function'&&G.myClubId){const cv=pxCrest(G.myClubId,2);crestSlot.insertBefore(cv,crestSlot.firstChild);}
  if(typeof pxFace==='function'){
    m.querySelectorAll('.press-face-slot').forEach(function(sl){
      sl.appendChild(pxFace(parseInt(sl.dataset.pid),2,parseInt(sl.dataset.age)||undefined));
    });
  }
  document.getElementById('btn-press-close').addEventListener('click',function(){m.remove();if(onClose)onClose();});
}

function startGame(){if(!_ensureCareerInitialized())return;if(window._customClubName&&G&&G.myClub){G.myClub.n=window._customClubName;const mc=G.leagues&&G.leagues.flatMap(l=>l.clubs).find(c=>c.id===G.myClubId);if(mc)mc.n=window._customClubName;const sc=G.standing&&G.standing.find(s=>parseInt(s.cid)===G.myClubId);if(sc)sc.n=window._customClubName;window._customClubName=null;}go('v-game');updateHdr();notif(t('setup_welcome').replace('{club}',G.myClub.n).replace('{league}',LEAGUE_NAMES[G.myLeague]),'ok');G.news=[
  {msg:t('startnews_training_focus'),type:'train',week:G.week,season:G.season,expires:G.week+1,action:'training_plan',actionLabel:t('startnews_action_plan')},
  {msg:t('startnews_camp'),type:'train',week:G.week,season:G.season,expires:3,action:'camp',actionLabel:t('startnews_action_camp')},
  {msg:t('startnews_sponsor'),type:'club',week:G.week||1,season:G.season,action:'finance_contracts',actionLabel:t('fin_tab_contracts')},
  {msg:t('startnews_summer_window'),type:'budget',week:G.week,season:G.season,expires:3,action:'transfers',actionLabel:t('news_tr_action_label')}
];genTransferMarket();genBoardGoals();if(G.news)G.news.unshift({msg:t('startnews_board_goals').replace('{season}',G.season),type:'club',week:G.week||1,season:G.season,action:'board',actionLabel:t('fin_tab_board')});renderNews();G.tutorialOff=false;showBriefingModal();}


function showBriefingModal(){
  if(!G)return;
  const existing=document.getElementById('modal-briefing');
  if(existing)existing.remove();
  const club=G.myClub?G.myClub.n:t('briefing_club_fallback');
  const liga=LEAGUE_NAMES[G.myLeague||8]||t('league_fallback');
  const bud=G.budget?fmt(G.budget):'—';

  // ── STANY UKOŃCZENIA ─────────────────────────────────────────────────
  var _doneBoard=!!(G.board&&G.board.mainGoal);
  var _doneContracts=!!(G.contracts&&Object.keys(G.contracts).length>0);
  var _doneFocus=!!(G.trainFocusLock>0);
  var _doneScout=!!(G.scout&&((G.scout.modeA&&G.scout.modeA.length>0)||(G.scout.modeB&&G.scout.modeB.active)||(G.scout.observed&&(Array.isArray(G.scout.observed)?G.scout.observed.length>0:Object.keys(G.scout.observed).length>0))));
  var _doneCamp=!!(G.campActive||G.indCampUsed>0);
  var _doneTransfers=!!(G.trBoughtThisWindow>0);

  function _row(done,icon,title,desc,btnLabel,panel,action){
    var borderCol=done?'#4caf50':'var(--gb)';
    var titleCol=done?'#4caf50':'var(--wh)';
    var checkMark=done?'<span style="color:#4caf50;margin-left:6px;">✓</span>':'';
    var q='"';
    var btnHtml=(!done&&btnLabel)
      ?('<button onclick='+q+'tutorialOpenPanel(\'' +panel+ '\',\'' +action+ '\')'+q+' style='+q+'font-size:var(--fs-meta);background:rgba(255,193,7,0.08);border:1px solid var(--am);color:var(--am);padding:2px 8px;cursor:pointer'+q+'>▶ '+btnLabel+'</button>')
      :'';
    var descHtml=desc?('<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px;">'+desc+'</div>'):'';
    return '<div style="border-left:2px solid '+borderCol+';padding-left:10px;margin-bottom:10px;">'
      +'<div style="font-size:var(--fs-meta);color:'+titleCol+';margin-bottom:2px;">'+icon+' '+title+checkMark+'</div>'
      +descHtml
      +btnHtml
      +'</div>';
  }

  function _infoRow(icon,title,desc,btnLabel,panel,action){
    var q='"';
    var btnHtml=btnLabel
      ?('<button onclick='+q+'tutorialOpenPanel(\'' +panel+ '\',\'' +action+ '\')'+q+' style='+q+'font-size:var(--fs-meta);background:rgba(255,193,7,0.08);border:1px solid var(--am);color:var(--am);padding:2px 8px;cursor:pointer'+q+'>▶ '+btnLabel+'</button>')
      :'';
    var descHtml=desc?('<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px;">'+desc+'</div>'):'';
    return '<div style="border-left:2px solid #1a2d1a;padding-left:10px;margin-bottom:10px;">'
      +'<div style="font-size:var(--fs-meta);color:var(--wh);margin-bottom:2px;">'+icon+' '+title+'</div>'
      +descHtml
      +btnHtml
      +'</div>';
  }

  var bodyHtml=''
    +'<div style="color:var(--am);font-size:var(--fs-dense);letter-spacing:1px;margin:8px 0 10px;">'+t('briefing_phase_prep')+'</div>'
    +_row(_doneBoard,'📋',t('briefing_board_title'),t('briefing_board_desc'),t('fin_tab_board'),'p-finance','board')
    +_row(_doneContracts,'💰',t('briefing_contracts_title'),t('briefing_contracts_desc'),t('fin_tab_contracts'),'p-finance','finance_contracts')
    +_row(_doneFocus,'🎯',t('briefing_focus_title'),t('briefing_focus_desc'),t('tile_training'),'p-training','training_plan')
    +_row(_doneScout,'🔍',t('briefing_scout_title'),'',t('briefing_btn_scouts'),'p-transfers','skauci')
    +_infoRow('🏕',t('briefing_camp_title'),t('briefing_camp_desc'),t('briefing_btn_camp'),'p-training','camp')
    +_infoRow('🔓',t('briefing_transfers_title'),t('briefing_transfers_desc'),t('tile_transfers'),'p-transfers','transfers')
    +'<div style="color:var(--am);font-size:var(--fs-dense);letter-spacing:1px;margin:12px 0 10px;">'+t('briefing_phase_season')+'</div>'
    +_infoRow('⚽',t('briefing_tactics_title'),t('briefing_tactics_desc'),t('tile_tactics'),'p-tactics','tactics')
    +_infoRow('👥',t('briefing_squad_title'),t('briefing_squad_desc'),t('tile_squad'),'p-squad','squad')
    +_infoRow('📊',t('briefing_table_title'),'',t('tile_table'),'p-table','table')
    +'<div style="color:var(--am);font-size:var(--fs-dense);letter-spacing:1px;margin:12px 0 10px;">'+t('briefing_phase_winter')+'</div>'
    +_infoRow('🔓',t('briefing_winter_transfers_title'),'',t('tile_transfers'),'p-transfers','transfers')
    +'<div style="color:var(--am);font-size:var(--fs-dense);letter-spacing:1px;margin:12px 0 10px;">'+t('briefing_phase_academy')+'</div>'
    +_infoRow('🎓',t('briefing_academy_title'),'',t('tile_academy'),'p-academy','academy');

  const m=document.createElement('div');
  m.id='modal-briefing';
  m.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:10100;background:rgba(0,0,0,0.93);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;';
  m.innerHTML=
    '<div style="color:var(--wh);width:100%;max-width:420px;padding:16px 12px 24px;">'
    +'<div style="border:1px solid var(--gb);background:#030f03;padding:10px 12px;margin-bottom:10px;font-size:var(--fs-dense);color:var(--gr);line-height:1.8;">'
    +'<span style="color:var(--gb)">&gt; '+t('briefing_init_line')+' <span style="color:var(--gb)">'+t('briefing_ok')+'</span></span><br>'
    +'<span style="color:var(--gb)">&gt; '+t('briefing_club_label')+' <span style="color:var(--wh)">'+club+'</span></span><br>'
    +'<span style="color:var(--gb)">&gt; '+t('briefing_league_label')+' <span style="color:var(--wh)">'+liga+'</span></span><br>'
    +'<span style="color:var(--gb)">&gt; '+t('briefing_budget_label')+' <span style="color:var(--am)">'+bud+'</span></span>'
    +'</div>'
    +'<div style="border:2px solid var(--gb);background:#050f05;">'
    +'<div style="background:var(--gb);padding:6px 12px;">'
    +'<span style="font-weight:700;font-size:var(--fs-h3);color:#000;letter-spacing:1px;">'+t('briefing_title')+'</span>'
    +'</div>'
    +'<div style="padding:10px 12px;">'+bodyHtml+'</div>'
    +'<div style="font-size:var(--fs-dense);color:var(--gr);padding:8px 12px;border-top:1px solid var(--gl);text-align:center;line-height:1.8;">'+t('briefing_footer_note')+'<br>'+'<span onclick="showGuideModal()" style="color:var(--am);text-decoration:none;cursor:pointer;">'+t('briefing_guide_link')+'</span>'+'</div>'+'<div style="display:flex;gap:8px;padding:10px 12px;">'
    +'<button onclick="tutorialDisable()" style="flex:1;font-weight:700;font-size:var(--fs-micro);background:#0a0a0a;border:1px solid var(--gr);color:var(--gr);padding:8px 4px;cursor:pointer;">'+t('briefing_btn_disable')+'</button>'
    +'<button onclick="tutorialClose()" style="flex:1;font-weight:700;font-size:var(--fs-micro);background:#0a1f0a;border:2px solid var(--gb);color:var(--gb);padding:8px 4px;cursor:pointer;">'+t('briefing_btn_start')+'</button>'
    +'</div>'
    +'</div>'
    +'</div>';
  document.body.appendChild(m);
  if(G._tutorialScrollY){m.scrollTop=G._tutorialScrollY;G._tutorialScrollY=0;}
}

function tutorialClose(){
  const m=document.getElementById('modal-briefing');
  if(m)m.remove();
  G._tutorialBack=false;
  G.tutorialOff=true;
  notif(t('tutorial_available_menu'),'info');
}

function tutorialDisable(){
  if(G)G.tutorialOff=true;
  const m=document.getElementById('modal-briefing');
  if(m)m.remove();
  G._tutorialBack=false;
  notif(t('tutorial_disabled_menu'),'info');
}

function tutorialOpenPanel(panelId, action){
  const m=document.getElementById('modal-briefing');
  if(m){G._tutorialScrollY=m.scrollTop;m.style.display='none';}
  G._tutorialBack=true;
  // użyj istniejącej logiki newsAction dla specjalnych paneli
  if(action==='board'){openPanel('p-finance');setTimeout(()=>{const btn=document.querySelector('#p-finance .tab-btn[data-tab="zarzad"]');if(btn)btn.click();},200);return;}
  if(action==='finance_contracts'){openPanel('p-finance');setTimeout(()=>{const btn=document.querySelector('#p-finance .tab-btn:nth-child(3)');if(btn)btn.click();},200);return;}
  if(action==='training_plan'){openPanel('p-training');setTimeout(()=>{const btn=document.querySelector('#p-training .sq-tab2-btn:nth-child(1)');if(btn)btn.click();},200);return;}
  if(action==='camp'){openPanel('p-training');setTimeout(()=>{const btn=document.querySelector('#p-training .sq-tab2-btn:nth-child(2)');if(btn)btn.click();},200);return;}
  if(action==='skauci'){openPanel('p-transfers');setTimeout(()=>{const btn=document.querySelector('#p-transfers .tab-btn[onclick*="skauci"]');if(btn)btn.click();},200);return;}
  if(action==='transfers'){openPanel('p-transfers');setTimeout(()=>{const btn=document.querySelector('#p-transfers .tab-btn[onclick*="kup"]');if(btn)btn.click();},200);return;}
  openPanel(panelId);
}

function toggleTutorial(){
  if(!G)return;
  G.tutorialOff=!G.tutorialOff;
  const btnTut=document.getElementById('btn-tutorial-toggle');
  if(btnTut){
    const off=G.tutorialOff;
    btnTut.textContent=t('nav_tutorial_label')+(off?t('tutorial_state_off'):t('tutorial_state_on'));
    btnTut.style.color=off?'var(--gr)':'var(--am)';
    btnTut.style.borderColor=off?'var(--gr)':'var(--am)';
  }
  if(!G.tutorialOff){
    // włączono ponownie — pokaż modal
    resumeGame();
    setTimeout(()=>showBriefingModal(),100);
  } else {
    notif(t('tutorial_disabled_short'),'info');
  }
}



function showGuideModal(){
  var existing=document.getElementById('modal-guide');
  if(existing){existing.style.display='flex';return;}
  var guideStyle="\n  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');\n  :root{\n    --bg:#0a0a0a;--gd:#050f05;--gb:#4caf50;--gl:#1a3d1a;--gm:#0d1a0d;\n    --am:#ffc107;--rd:#f44336;--wh:#e8f5e9;--gr:#546e54;--tb:#080f08;\n  }\n  *{box-sizing:border-box;margin:0;padding:0;}\n  body{background:var(--bg);color:var(--wh);font-family:'JetBrains Mono',monospace;font-size:var(--fs-body);line-height:1.6;max-width:680px;margin:0 auto;padding:16px 12px 40px;}\n  h1{font-weight:700;font-size:var(--fs-h2);color:var(--gb);letter-spacing:2px;text-align:center;padding:16px 0 4px;}\n  .subtitle{font-size:var(--fs-meta);color:var(--gr);text-align:center;margin-bottom:20px;}\n  h2{font-weight:700;font-size:var(--fs-micro);color:var(--am);letter-spacing:1px;margin:24px 0 10px;padding:6px 10px;border-left:3px solid var(--am);background:rgba(255,193,7,0.05);}\n  h3{font-weight:700;font-size:var(--fs-micro);color:var(--gb);letter-spacing:1px;margin:14px 0 6px;}\n  p{color:var(--wh);margin-bottom:8px;font-size:var(--fs-body);}\n  .tip{background:#030f03;border-left:3px solid var(--gb);padding:8px 10px;margin:10px 0;font-size:var(--fs-meta);color:#a5d6a7;}\n  .tip b{color:var(--gb);}\n  .warn{background:#0f0303;border-left:3px solid var(--rd);padding:8px 10px;margin:10px 0;font-size:var(--fs-meta);color:#ef9a9a;}\n  .warn b{color:var(--rd);}\n  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:var(--fs-meta);}\n  th{background:var(--gm);color:var(--am);padding:5px 8px;text-align:left;border-bottom:1px solid var(--gl);font-weight:700;font-size:var(--fs-micro);}\n  td{padding:5px 8px;border-bottom:1px solid #0d1a0d;color:var(--wh);}\n  td.gr{color:var(--gr);}\n  td.gb{color:var(--gb);}\n  td.am{color:var(--am);}\n  td.rd{color:var(--rd);}\n  .divider{height:1px;background:var(--gl);margin:20px 0;}\n  .tag{display:inline-block;padding:1px 6px;border:1px solid;font-size:var(--fs-dense);margin-right:4px;}\n  .tag-gb{border-color:var(--gb);color:var(--gb);}\n  .tag-am{border-color:var(--am);color:var(--am);}\n  .tag-rd{border-color:var(--rd);color:var(--rd);}\n  ul{margin:6px 0 10px 16px;}\n  li{margin-bottom:4px;font-size:var(--fs-body);}\n  .toc{background:var(--gm);border:1px solid var(--gl);padding:10px 14px;margin-bottom:20px;}\n  .toc a{color:var(--am);text-decoration:none;font-size:var(--fs-meta);display:block;padding:2px 0;}\n  .toc a:hover{color:var(--gb);}\n  .season-bar{display:flex;gap:0;margin:10px 0;font-size:var(--fs-dense);}\n  .sb{padding:4px 6px;text-align:center;flex:1;}\n  .sb-prep{background:#0d1f0d;border:1px solid var(--gl);color:var(--gb);}\n  .sb-season{background:#0a130a;border:1px solid #1a2d1a;color:var(--wh);}\n  .sb-winter{background:#0f0f03;border:1px solid #2d2d0d;color:var(--am);}\n  .sb-end{background:#0f0303;border:1px solid #2d0d0d;color:var(--rd);}\n";
  var guideBody="<h1>GRASSROOTS TO GLORY</h1>\n<div class=\"subtitle\">\u2014 PRZEWODNIK GRACZA \u2014</div>\n\n<div class=\"toc\">\n  <div style=\"font-weight:700;font-size:var(--fs-micro);color:var(--gr);margin-bottom:8px;\">SPIS TRE\u015aCI</div>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-sezon');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">1. Struktura sezonu</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-liga');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">2. Liga i awans</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-budzet');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">3. Bud\u017cet i finanse</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-skad');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">4. Sk\u0142ad i zawodnicy</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-trening');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">5. Trening i Centrum Szkoleniowe</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-transfery');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">6. Transfery i okna</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-skaut');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">7. Skaut</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-stadion');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">8. Stadion i modu\u0142y</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-akademia');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">9. Akademia</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-zarzad');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">10. Zarz\u0105d i cele</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-reputacja');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">11. Reputacja i frekwencja</a>\n  <a href=\"javascript:void(0)\" onclick=\"var el=document.getElementById('g-puchar');if(el)el.scrollIntoView();\" style=\"cursor:pointer\">12. Puchar Mistrzowski</a>\n</div>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<h2 id=\"g-sezon\">1. STRUKTURA SEZONU</h2>\n\n<p>Sezon trwa ok. 34 tygodnie. Ka\u017cdy tydzie\u0144 to jedna kolejka \u2014 jedno dzia\u0142anie (mecz lub przygotowania).</p>\n\n<div class=\"season-bar\">\n  <div class=\"sb sb-prep\">T1\u20132<br>Przygot.</div>\n  <div class=\"sb sb-season\">T3\u201315<br>Runda I</div>\n  <div class=\"sb sb-winter\">T16\u201317<br>Okno</div>\n  <div class=\"sb sb-season\">T18\u201332<br>Runda II</div>\n  <div class=\"sb sb-end\">T33\u201334<br>Koniec</div>\n</div>\n\n<h3>TYGODNIE 1\u20132: PRZYGOTOWANIA</h3>\n<p>Przed startem sezonu nie grasz mecz\u00f3w. To czas na:</p>\n<ul>\n  <li>Wyb\u00f3r <b>celu zarz\u0105du</b> (wymagany) i celu bonusowego</li>\n  <li>Podpisanie <b>kontrakt\u00f3w sponsorskich</b> (koszulki, stadion, TV)</li>\n  <li>Ustawienie <b>fokusa treningowego</b></li>\n  <li>Wys\u0142anie <b>skauta</b> na obserwacj\u0119</li>\n  <li>Opcjonalny <b>ob\u00f3z przygotowawczy</b> (tylko T1\u20132)</li>\n  <li>Zakupy na <b>letnim oknie transferowym</b> (T1\u20132)</li>\n</ul>\n\n<h3>TYGODNIE 3\u201332: SEZON REGULARNY</h3>\n<p>Jeden mecz na tydzie\u0144. Po ka\u017cdym meczu mo\u017cesz zarz\u0105dza\u0107 sk\u0142adem, treningiem i transferami (gdy okno otwarte).</p>\n\n<h3>TYGODNIE 16\u201317: ZIMOWE OKNO</h3>\n<p>Kr\u00f3tkie okno transferowe w \u015brodku sezonu. Obowi\u0105zuje \u0142\u0105czny limit 3 zakup\u00f3w na sezon (letnie + zimowe razem).</p>\n\n<h3>TYGODNIE 33\u201334: KONIEC SEZONU</h3>\n<p>Rozliczenie cel\u00f3w zarz\u0105du, premie lub kary, awans/spadek, podsumowanie sezonu. Nowy sezon startuje automatycznie.</p>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-liga\">2. LIGA I AWANS</h2>\n\n<p>Gr\u0119 zaczynasz zawsze w <b>VII Lidze</b> (najni\u017cszy poziom). Celem jest awansowanie przez kolejne poziomy a\u017c do Ekstraklasy. Ka\u017cda liga to wy\u017csze dochody, lepsi rywale i wy\u017cszy pu\u0142ap dla zawodnik\u00f3w.</p>\n\n<table>\n  <tr><th>POZIOM</th><th>LIGA</th><th>DOCH\u00d3D SPONSOR\u00d3W/TYG</th><th>MAX POT. ZAWODNIKA</th></tr>\n  <tr><td class=\"rd\">8</td><td class=\"rd\">VII Liga (START)</td><td>~200 z\u0142</td><td>~42</td></tr>\n  <tr><td>7</td><td>VI Liga</td><td>~300 z\u0142</td><td>~52</td></tr>\n  <tr><td>6</td><td>V Liga</td><td>~500 z\u0142</td><td>~60</td></tr>\n  <tr><td>5</td><td>IV Liga</td><td>~800 z\u0142</td><td>~68</td></tr>\n  <tr><td>4</td><td>III Liga</td><td>~1 500 z\u0142</td><td>~76</td></tr>\n  <tr><td>3</td><td>II Liga</td><td>~3 000 z\u0142</td><td>~84</td></tr>\n  <tr><td>2</td><td>I Liga</td><td>~8 000 z\u0142</td><td>~92</td></tr>\n  <tr><td class=\"am\">1</td><td class=\"am\">Premier Division</td><td class=\"am\">~20 000 z\u0142</td><td class=\"am\">99</td></tr>\n</table>\n\n<p><span class=\"tag tag-gb\">\u25b2 AWANS</span> TOP 2 w tabeli awansuje. Po awansie bud\u017cet jest uzupe\u0142niany do progu nowej ligi.</p>\n<p><span class=\"tag tag-rd\">\u25bc SPADEK</span> Ostatnie 2 miejsca w tabeli spadaj\u0105 do ni\u017cszej ligi.</p>\n\n<div class=\"tip\"><b>Zale\u017cno\u015b\u0107:</b> Liga okre\u015bla potencja\u0142 zawodnik\u00f3w \u2014 w VII Lidze \u017caden zawodnik nie przekroczy ~42 OVR bez wzgl\u0119du na trening. Awans odblokowuje wy\u017cszy pu\u0142ap rozwoju ca\u0142ego sk\u0142adu.</div>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-budzet\">3. BUD\u017bET I FINANSE</h2>\n\n<h3>\u0179R\u00d3D\u0141A DOCHODU (cotygodniowe)</h3>\n<ul>\n  <li><b>Kontrakty sponsorskie</b> \u2014 trzy niezale\u017cne kontrakty: koszulki, prawa do nazwy stadionu, TV. Podpisuj na pocz\u0105tku ka\u017cdego sezonu \u2014 nie mo\u017cna tego zrobi\u0107 p\u00f3\u017aniej. Kwoty zale\u017c\u0105 od ligi i reputacji.</li>\n  <li><b>Bilety</b> \u2014 doch\u00f3d po ka\u017cdym meczu domowym. Zale\u017cy od: pojemno\u015bci stadionu \u00d7 frekwencja \u00d7 cena biletu (ustalana przez lig\u0119). Gastronomia na stadionie zwi\u0119ksza przych\u00f3d z bilet\u00f3w.</li>\n  <li><b>Gad\u017cety</b> \u2014 procent z bilet\u00f3w, mno\u017cony przez poziom Sklepu Klubowego. Sklep L3 to 4\u00d7 wi\u0119cej ni\u017c bez sklepu.</li>\n  <li><b>Reklamy</b> \u2014 sta\u0142y tygodniowy doch\u00f3d, zwi\u0119kszany przez Tablic\u0119 \u015awietln\u0105 na stadionie.</li>\n  <li><b>Lo\u017ce VIP</b> \u2014 sta\u0142y cotygodniowy bonus z modu\u0142u VIP na stadionie. Nie zale\u017cy od meczu.</li>\n  <li><b>Sprzeda\u017c zawodnik\u00f3w</b> \u2014 jednorazowy przych\u00f3d. Uwaga na podatek 25% od zysku przy szybkiej odsprzeda\u017cy.</li>\n  <li><b>Premie zarz\u0105du</b> \u2014 za wykonanie celu g\u0142\u00f3wnego i bonusowego na koniec sezonu.</li>\n  <li><b>Puchar</b> \u2014 nagrody za kolejne rundy.</li>\n</ul>\n\n<h3>WP\u0141YW REPUTACJI NA DOCHODY</h3>\n<p>Reputacja (\u2b50) bezpo\u015brednio mno\u017cy trzy strumienie przychod\u00f3w:</p>\n<ul>\n  <li><b>Sponsorzy</b> \u2014 mno\u017cnik 0.7\u00d7 (Rep 0) do 1.5\u00d7 (Rep 1000). Przy Rep 30 (start) dostajesz 72% maksymalnej kwoty.</li>\n  <li><b>Reklamy</b> \u2014 mno\u017cnik 0.6\u00d7 do 2.0\u00d7. Najbardziej czu\u0142y na reputacj\u0119 \u2014 Rep 1000 to dwukrotny doch\u00f3d z reklam.</li>\n  <li><b>Kontrakty sponsorskie</b> \u2014 mno\u017cnik 0.8\u00d7 do 1.8\u00d7. Wy\u017csza rep = lepsze oferty kontrakt\u00f3w.</li>\n</ul>\n<p>Reputacja wp\u0142ywa te\u017c na <b>frekwencj\u0119</b> (mno\u017cnik 0.9\u00d7 do 1.3\u00d7) i <b>warto\u015b\u0107 sprzedawanych zawodnik\u00f3w</b> (+10% przy Rep 500+).</p>\n\n<div class=\"tip\"><b>Priorytet:</b> Budowanie reputacji przez wyniki i wykonywanie cel\u00f3w zarz\u0105du to najszybsza droga do wyra\u017anego wzrostu dochod\u00f3w \u2014 szczeg\u00f3lnie z reklam i kontrakt\u00f3w.</div>\n\n<h3>KOSZTY STA\u0141E</h3>\n<ul>\n  <li><b>Pensje zawodnik\u00f3w</b> \u2014 p\u0142acone tygodniowo. Pilnuj \u017ceby sk\u0142ad nie by\u0142 za drogi dla aktualnej ligi.</li>\n  <li><b>Utrzymanie stadionu</b> \u2014 ok. 0,5% warto\u015bci pojemno\u015bci tygodniowo. Du\u017cy stadion = du\u017ce utrzymanie.</li>\n  <li><b>Skaut</b> \u2014 jednorazowa op\u0142ata przy zatrudnieniu + odnawiana co sezon.</li>\n  <li><b>Akademia</b> \u2014 tygodniowy koszt utrzymania zale\u017cny od poziomu akademii i ligi.</li>\n  <li><b>Centrum Szkoleniowe</b> \u2014 tygodniowy koszt utrzymania po wybudowaniu.</li>\n</ul>\n\n<div class=\"warn\"><b>Uwaga:</b> Je\u015bli zapomnisz podpisa\u0107 kontrakty sponsorskie na pocz\u0105tku sezonu, tracisz ten doch\u00f3d na ca\u0142y rok. Nie mo\u017cna ich podpisa\u0107 retroaktywnie.</div>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-skad\">4. SK\u0141AD I ZAWODNICY</h2>\n\n<h3>OVR \u2014 OCENA OG\u00d3LNA</h3>\n<p>Ka\u017cdy zawodnik ma 6 atrybut\u00f3w: <b>TEC</b> (technika), <b>PAS</b> (podania), <b>SHT</b> (strza\u0142), <b>DEF</b> (obrona), <b>PHY</b> (fizyczno\u015b\u0107), <b>MEN</b> (mentalno\u015b\u0107). OVR to wa\u017cona \u015brednia zale\u017cna od pozycji:</p>\n<ul>\n  <li><b>GK</b> \u2014 DEF + MEN (g\u0142\u00f3wne)</li>\n  <li><b>OBR</b> \u2014 DEF + PHY</li>\n  <li><b>POL</b> \u2014 PAS + TEC</li>\n  <li><b>NAP</b> \u2014 SHT + TEC</li>\n</ul>\n\n<h3>POTENCJA\u0141</h3>\n<p>Ka\u017cdy zawodnik ma ukryty potencja\u0142 \u2014 maksymalny OVR jaki mo\u017ce osi\u0105gn\u0105\u0107. Potencja\u0142 jest ograniczony przez poziom ligi w kt\u00f3rej grasz. Awans do wy\u017cszej ligi odblokowuje wy\u017cszy pu\u0142ap dla ca\u0142ego sk\u0142adu.</p>\n\n<div class=\"tip\"><b>Strategia:</b> Kupuj zawodnik\u00f3w z wysokim potencja\u0142em gdy jeste\u015b w ni\u017cszej lidze \u2014 rozwijaj\u0105 si\u0119 razem z tob\u0105 i b\u0119d\u0105 wart znacznie wi\u0119cej po awansie.</div>\n\n<h3>FORMA I ZM\u0118CZENIE</h3>\n<p>Forma (0\u2013100) wp\u0142ywa na skuteczno\u015b\u0107 w meczu i warto\u015b\u0107 rynkow\u0105. Spada po przegranej i przy wysokiej intensywno\u015bci treningu. Zm\u0119czenie kumuluje si\u0119 przy intensywnym treningu \u2014 przy zm\u0119czeniu powy\u017cej 85% ro\u015bnie ryzyko kontuzji.</p>\n\n<h3>KONTRAKTY ZAWODNIK\u00d3W</h3>\n<p>Zawodnicy maj\u0105 kontrakty na 1\u20134 sezony. Przed wyga\u015bni\u0119ciem dostajesz ostrze\u017cenie w aktualno\u015bciach. Szczeg\u00f3lnie pilnuj bramkarzy \u2014 bez GK nie mo\u017cesz rozgrywa\u0107 mecz\u00f3w.</p>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-trening\">5. TRENING I CENTRUM SZKOLENIOWE</h2>\n\n<h3>FOKUS TRENINGOWY</h3>\n<p>Wybierasz jeden z trzech profili atrybut\u00f3w na 8 kolejek. Bez aktywnego fokusa zawodnicy <b>nie rozwijaj\u0105 atrybut\u00f3w</b> \u2014 to podstawowy mechanizm rozwoju sk\u0142adu.</p>\n\n<table>\n  <tr><th>FOKUS</th><th>ATRYBUTY</th><th>NAJLEPSZY DLA</th></tr>\n  <tr><td class=\"am\">\u26bd ATAK</td><td>SHT +2, TEC +1</td><td>Napastnicy, pomocnicy ofensywni</td></tr>\n  <tr><td class=\"am\">\ud83c\udfaf POMOC</td><td>PAS +2, MEN +1</td><td>Pomocnicy, rozgrywaj\u0105cy</td></tr>\n  <tr><td class=\"am\">\ud83d\udee1 OBRONA</td><td>DEF +2, PHY +1</td><td>Obro\u0144cy, bramkarze</td></tr>\n</table>\n\n<h3>INTENSYWNO\u015a\u0106 TRENINGU</h3>\n<p>Niezale\u017cnie od fokusa wybierasz intensywno\u015b\u0107 \u2014 wp\u0142ywa na tempo wzrostu i ryzyko kontuzji:</p>\n\n<table>\n  <tr><th>POZIOM</th><th>WZROST ATRYB.</th><th>EFEKT NA FORM\u0118</th><th>RYZYKO</th></tr>\n  <tr><td>NISKA</td><td class=\"rd\">brak</td><td class=\"gb\">Forma +2/tyg, zm\u0119czenie -15/tyg</td><td class=\"gb\">zero \u2014 czysta regeneracja</td></tr>\n  <tr><td>NORMALNA</td><td class=\"gb\">+1\u20132/tyg</td><td class=\"gr\">zm\u0119czenie -3/tyg</td><td class=\"gb\">niskie (0,3%/tyg)</td></tr>\n  <tr><td class=\"rd\">WYSOKA</td><td class=\"gb\">+2\u20133/tyg</td><td class=\"rd\">zm\u0119czenie +8/tyg</td><td class=\"rd\">ro\u015bnie ze zm\u0119czeniem (1,2%/tyg)</td></tr>\n</table>\n\n<div class=\"tip\"><b>Taktyka:</b> Wysoka intensywno\u015b\u0107 przed oknami transferowymi zwi\u0119ksza OVR i warto\u015b\u0107 zawodnik\u00f3w. Niska intensywno\u015b\u0107 po serii mecz\u00f3w szybko regeneruje form\u0119 i zm\u0119czenie.</div>\n\n<h3>CENTRUM SZKOLENIOWE</h3>\n<p>Budynek kt\u00f3ry zwi\u0119ksza efekty treningu. Budujesz go w zak\u0142adce TRENING. Po wybudowaniu odblokowujesz <b>profile treningowe</b> \u2014 specjalizacje nak\u0142adaj\u0105ce si\u0119 na aktywny fokus.</p>\n\n<table>\n  <tr><th>POZIOM</th><th>NAZWA</th><th>PROFILE</th><th>WYMAGANIA</th></tr>\n  <tr><td>1</td><td>Podstawowe</td><td>1 profil</td><td>brak</td></tr>\n  <tr><td>2</td><td>Zaawansowane</td><td>2 profile</td><td>Rep 150, Stadion 1000+</td></tr>\n  <tr><td class=\"am\">3</td><td class=\"am\">Elitarne</td><td class=\"am\">3 profile</td><td class=\"am\">Rep 400, Stadion 5000+</td></tr>\n</table>\n\n<h3>PROFILE CENTRUM SZKOLENIOWEGO</h3>\n<p>Ka\u017cdy wybudowany poziom CS odblokowuje dodatkowy slot na profil. Profile aktywujesz w zak\u0142adce <b>TRENING \u2192 PLAN</b> \u2014 dzia\u0142aj\u0105 r\u00f3wnolegle z fokusem atrybut\u00f3w:</p>\n\n<table>\n  <tr><th>PROFIL</th><th>EFEKT</th><th>DLA KOGO</th></tr>\n  <tr><td class=\"am\">Kondycja</td><td>PHY +50%, zm\u0119czenie odpada 2\u00d7 szybciej</td><td>ca\u0142y sk\u0142ad</td></tr>\n  <tr><td class=\"am\">Technika</td><td>TEC i PAS +40% szybciej</td><td>ca\u0142y sk\u0142ad</td></tr>\n  <tr><td class=\"am\">Atak</td><td>SHT i TEC +50% (tylko NAP)</td><td>napastnicy</td></tr>\n  <tr><td class=\"am\">Obrona</td><td>DEF i MEN +50% (tylko OBR/GK)</td><td>obro\u0144cy, bramkarze</td></tr>\n  <tr><td class=\"am\">Mentalno\u015b\u0107</td><td>MEN +60%, Forma +3/tyg</td><td>ca\u0142y sk\u0142ad</td></tr>\n  <tr><td class=\"am\">Regeneracja</td><td>kontuzje -15%, leczenie -25% czasu</td><td>ca\u0142y sk\u0142ad</td></tr>\n</table>\n\n<h3>OB\u00d3Z PRZYGOTOWAWCZY</h3>\n<p>Dost\u0119pny tylko w tygodniach 1\u20132 sezonu (zak\u0142adka TRENING \u2192 OBOZY). Kosztuje bud\u017cet, ale daje: forma wszystkich \u2192 100%, OVR +1 dla ka\u017cdego zawodnika przez 4 kolejki. Op\u0142aca si\u0119 przed trudnym startem sezonu.</p>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-transfery\">6. TRANSFERY I OKNA</h2>\n\n<h3>OKNA TRANSFEROWE</h3>\n<ul>\n  <li><b>Letnie</b> \u2014 tygodnie 1\u20132 ka\u017cdego sezonu</li>\n  <li><b>Zimowe</b> \u2014 tygodnie 16\u201317</li>\n  <li><b>Limit:</b> max 3 zakupy \u0142\u0105cznie w sezonie (letnie + zimowe razem)</li>\n</ul>\n\n<h3>RODZAJE OFERT NA RYNKU</h3>\n<ul>\n  <li><b>Plotki</b> \u2014 zawodnicy niedost\u0119pni od razu, pojawi\u0105 si\u0119 w nast\u0119pnym oknie</li>\n  <li><b>PREMIUM \u2b50</b> \u2014 zawodnicy z wy\u017cszej ligi, wy\u017cszy OVR, wy\u017csza cena</li>\n  <li><b>Oferta czasowa</b> \u2014 ograniczony czas na decyzj\u0119, potem zawodnik odchodzi</li>\n</ul>\n\n<h3>WARTO\u015a\u0106 ZAWODNIKA</h3>\n<p>Na cen\u0119 wp\u0142ywa: OVR, wiek, forma, status HOT (3+ gole/asysty w meczu), reputacja twojego klubu. Sprzedaj\u0105c z zyskiem pami\u0119taj o <b>podatku 25%</b> je\u015bli sprzedajesz rok po zakupie.</p>\n\n<div class=\"warn\"><b>Blokada odsprzeda\u017cy:</b> Nie mo\u017cesz sprzeda\u0107 zawodnika w tym samym sezonie w kt\u00f3rym go kupi\u0142e\u015b. Planuj transfery z wyprzedzeniem.</div>\n\n<h3>WOLNI AGENCI</h3>\n<p>Zawodnicy bez klubu \u2014 dost\u0119pni zawsze, bez op\u0142aty transferowej (p\u0142acisz tylko pensj\u0119). Przydatni w nag\u0142ych sytuacjach kadrowych, np. przy braku zdrowego bramkarza.</p>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-skaut\">7. SKAUT</h2>\n\n<h3>TRYB A \u2014 OBSERWACJA ZAWODNIKA</h3>\n<p>Wysy\u0142asz skauta na obserwacj\u0119 konkretnego zawodnika z rynku, plotki lub losowego z klubu. Po kilku kolejkach dostajesz raport z dok\u0142adniejszym OVR. Bez skauta OVR na rynku jest ukryty lub obarczony du\u017cym b\u0142\u0119dem \u2014 kupujesz w ciemno.</p>\n\n<h3>TRYB B \u2014 SZUKANIE TALENT\u00d3W</h3>\n<p>Wymaga zbudowanej Akademii. Skaut szuka m\u0142odych zawodnik\u00f3w z wysokim potencja\u0142em. Po znalezieniu masz 2 kolejki na decyzj\u0119 \u2014 potem talent odchodzi do innego klubu.</p>\n\n<h3>POZIOMY SKAUT\u00d3W</h3>\n<table>\n  <tr><th>SKAUT</th><th>KOSZT/ROK</th><th>B\u0141\u0104D OVR</th><th>SLOTY OBS.</th><th>DOST\u0118PNY OD</th></tr>\n  <tr><td>Amator</td><td class=\"gb\">darmowy</td><td class=\"rd\">\u00b120</td><td>1</td><td>zawsze</td></tr>\n  <tr><td>Lokalny</td><td>5 000 z\u0142</td><td class=\"rd\">\u00b112</td><td>2</td><td>VII Liga</td></tr>\n  <tr><td>Regionalny</td><td>18 000 z\u0142</td><td class=\"am\">\u00b18</td><td>2</td><td>V Liga</td></tr>\n  <tr><td>Krajowy</td><td>50 000 z\u0142</td><td class=\"am\">\u00b16</td><td>3</td><td>III Liga</td></tr>\n  <tr><td>Profesjonalny</td><td>120 000 z\u0142</td><td class=\"gb\">\u00b14</td><td>3</td><td>I Liga</td></tr>\n  <tr><td class=\"am\">Elitarny</td><td class=\"am\">300 000 z\u0142</td><td class=\"gb\">\u00b12</td><td>4</td><td>Premier Division</td></tr>\n</table>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-stadion\">8. STADION I MODU\u0141Y</h2>\n\n<p>Stadion startuje z pojemno\u015bci\u0105 200 miejsc. Rozbudowujesz go kupuj\u0105c nowe trybuny i modu\u0142y w zak\u0142adce STADION.</p>\n\n<h3>DOCH\u00d3D Z BILET\u00d3W</h3>\n<p>Zale\u017cy od: pojemno\u015b\u0107 \u00d7 frekwencja \u00d7 cena biletu. Frekwencja zale\u017cy od wynik\u00f3w, serii wygranych i reputacji. Doch\u00f3d z bilet\u00f3w to baza dla gad\u017cet\u00f3w (sklep) i gastronomii.</p>\n\n<h3>MODU\u0141Y STADIONU</h3>\n<table>\n  <tr><th>MODU\u0141</th><th>EFEKT</th><th>WYMAGA</th></tr>\n  <tr><td>\ud83c\udfad Lo\u017ce VIP (L1\u2013L4)</td><td class=\"gb\">+800 do +35 000 z\u0142/tyg sta\u0142e</td><td>Stadion 1000+</td></tr>\n  <tr><td>\ud83c\udf54 Gastronomia (L1\u2013L3)</td><td class=\"gb\">Bilety +8% do +40%</td><td>Stadion 500+</td></tr>\n  <tr><td>\ud83d\udecd Sklep klubowy (L1\u2013L3)</td><td class=\"gb\">Gad\u017cety \u00d71.5 do \u00d74.0</td><td>brak</td></tr>\n  <tr><td>\ud83d\udca1 O\u015bwietlenie (L1\u2013L2)</td><td class=\"gb\">Frekwencja +5\u201310%, Rep +30</td><td>Stadion 1500+</td></tr>\n  <tr><td>\ud83d\udcfa Tablica \u015bwietlna (L1)</td><td class=\"gb\">Reklamy +15%, Rep +20</td><td>Stadion 1500+, O\u015bw. L1</td></tr>\n</table>\n\n<div class=\"tip\"><b>Priorytet modu\u0142\u00f3w:</b> Gastronomia L1 (8000 z\u0142) jest najta\u0144szym i najszybszym sposobem na zwi\u0119kszenie dochodu \u2014 od razu podnosi przych\u00f3d z ka\u017cdego meczu domowego o 8%. Sklep L1 te\u017c tani i szybki do zbudowania.</div>\n\n<div class=\"tip\"><b>Zale\u017cno\u015b\u0107:</b> Akademia wy\u017cszych poziom\u00f3w wymaga minimalnej pojemno\u015bci stadionu. Stadion 1000+ = Akademia L2, Stadion 5000+ = Akademia L3 (Elitarne CS).</div>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-akademia\">9. AKADEMIA</h2>\n\n<p>Akademia produkuje wychowank\u00f3w \u2014 m\u0142odych zawodnik\u00f3w kt\u00f3rzy rosn\u0105 razem z klubem. Budujesz j\u0105 w zak\u0142adce AKADEMIA.</p>\n\n<table>\n  <tr><th>POZIOM</th><th>NAZWA</th><th>MAX POTENCJA\u0141</th><th>WYCHOWANK\u00d3W/SEZ</th></tr>\n  <tr><td>1</td><td>Podstawowa</td><td>60</td><td>1</td></tr>\n  <tr><td>2</td><td>Rozwini\u0119ta</td><td>72</td><td>2</td></tr>\n  <tr><td>3</td><td>Zaawansowana</td><td>82</td><td>3</td></tr>\n  <tr><td>4</td><td>Elitarna</td><td>92</td><td>5</td></tr>\n  <tr><td class=\"am\">5</td><td class=\"am\">Mistrz\u00f3w (Premier Division)</td><td class=\"am\">99</td><td class=\"am\">2</td></tr>\n</table>\n\n<p>Na starcie ka\u017cdego sezonu mo\u017cesz <b>dobra\u0107 juniora</b> odkrytego przez Skauta B. Juniorzy maj\u0105 niskie OVR (16\u201322 lat) ale wysoki potencja\u0142 \u2014 inwestycja d\u0142ugoterminowa. Masz 2 kolejki na decyzj\u0119.</p>\n\n<div class=\"tip\"><b>Legenda Klubu:</b> Wychowanek kt\u00f3ry osi\u0105gnie wystarczaj\u0105cy presti\u017c (mecze, gole, wzrost OVR) staje si\u0119 Legend\u0105 Klubu \u2014 trwa\u0142y bonus do reputacji.</div>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-zarzad\">10. ZARZ\u0104D I CELE</h2>\n\n<h3>CEL G\u0141\u00d3WNY</h3>\n<p>Wybierasz jeden cel na sezon na pocz\u0105tku ka\u017cdego sezonu w zak\u0142adce FINANSE \u2192 ZARZ\u0104D. Zarz\u0105d dobiera pul\u0119 cel\u00f3w do twojej sytuacji \u2014 po awansie dostaniesz trudniejsze, po serii pora\u017cek \u0142atwiejsze. Wykonanie = premia bud\u017cetowa. Niewykonanie = kara (utrata reputacji, ewentualnie blokada transfer\u00f3w).</p>\n\n<h3>CEL BONUSOWY</h3>\n<p>Dodatkowy opcjonalny cel. Nagroda to punkty reputacji lub bonus sponsorski. Kara za niewykonanie jest mniejsza ni\u017c przy celu g\u0142\u00f3wnym.</p>\n\n<div class=\"warn\"><b>Presja zarz\u0105du:</b> 3 sezony z rz\u0119du bez wykonania celu = zarz\u0105d narzuca cel przymusowy (naj\u0142atwiejszy dost\u0119pny). Unikaj d\u0142ugich serii niewykonanych cel\u00f3w.</div>\n\n<h3>PRZYK\u0141ADOWE CELE</h3>\n<ul>\n  <li>Utrzymanie w lidze / TOP 5 / TOP 3 / Mistrzostwo</li>\n  <li>Strzeli\u0107 40+ goli w sezonie</li>\n  <li>Zwi\u0119kszy\u0107 reputacj\u0119 o 20 pkt.</li>\n  <li>Wype\u0142ni\u0107 stadion powy\u017cej 80% frekwencji</li>\n  <li>Pokona\u0107 najwi\u0119kszego rywala w sezonie</li>\n</ul>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-reputacja\">11. REPUTACJA I FREKWENCJA</h2>\n\n<h3>REPUTACJA \u2b50</h3>\n<p>Miara presti\u017cu klubu (0\u20131000). Ro\u015bnie po: wygranych meczach, awansie, wykonaniu cel\u00f3w zarz\u0105du, milestones wychowank\u00f3w, zdobyciu Pucharu, budowie stadionu (O\u015bwietlenie, Tablica). Spada po: pora\u017ckach, niewykonaniu cel\u00f3w, spadku z ligi.</p>\n<p>Wp\u0142ywa bezpo\u015brednio na: wysoko\u015b\u0107 dochod\u00f3w z reklam i sponsor\u00f3w, dost\u0119pno\u015b\u0107 wy\u017cszych poziom\u00f3w Akademii i Centrum Szkoleniowego, warto\u015b\u0107 sprzedawanych zawodnik\u00f3w (+10% przy Rep 500+).</p>\n\n<h3>FREKWENCJA \ud83d\udc65</h3>\n<p>Procent wype\u0142nienia stadionu na meczach domowych. Zale\u017cy od: bazy frekwencji dla ligi, wynik\u00f3w ostatnich 5 mecz\u00f3w, serii wygranych/przegranych i reputacji. Bezpo\u015brednio mno\u017cy doch\u00f3d z bilet\u00f3w \u2014 i tym samym z gad\u017cet\u00f3w i gastronomii.</p>\n\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n<div class=\"divider\"></div>\n<h2 id=\"g-puchar\">12. PUCHAR MISTRZOWSKI</h2>\n\n<p>64 dru\u017cyny z wszystkich 8 lig (8 najlepszych z ka\u017cdej ligi) graj\u0105 w rozgrywkach pucharowych r\u00f3wnolegle z lig\u0105.</p>\n\n<table>\n  <tr><th>RUNDA</th><th>TYDZIE\u0143</th><th>DRU\u017bYNY</th></tr>\n  <tr><td>Runda 1</td><td>5</td><td>64 \u2192 32</td></tr>\n  <tr><td>Runda 2</td><td>10</td><td>32 \u2192 16</td></tr>\n  <tr><td>\u0106wier\u0107fina\u0142y</td><td>15</td><td>16 \u2192 8</td></tr>\n  <tr><td>P\u00f3\u0142fina\u0142y</td><td>21</td><td>8 \u2192 4</td></tr>\n  <tr><td>P\u00f3\u0142fina\u0142y</td><td>27</td><td>4 \u2192 2</td></tr>\n  <tr><td class=\"am\">Fina\u0142</td><td class=\"am\">33</td><td class=\"am\">2 \u2192 1</td></tr>\n</table>\n\n<p>Mecze pucharowe rozgrywasz po meczu ligowym \u2014 w zak\u0142adce MECZ pojawi si\u0119 osobny przycisk gdy nadejdzie twoja runda.</p>\n\n<div class=\"tip\"><b>Nagrody:</b> Ka\u017cda runda to premia finansowa i punkty reputacji. Zwyci\u0119stwo w Pucharze to osobne trofeum w historii klubu i znaczny bonus do reputacji.</div>\n\n<div class=\"divider\"></div>\n<div style=\"text-align:center;color:var(--gr);font-size:var(--fs-meta);padding:16px 0;\">\n  GRASSROOTS TO GLORY \u2014 PRZEWODNIK GRACZA<br>\n  <span style=\"font-size:var(--fs-dense);\">Wr\u00f3\u0107 do gry i zacznij pisa\u0107 histori\u0119 swojego klubu.</span>\n</div>";
  var m=document.createElement('div');
  m.id='modal-guide';
  m.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;background:#0a0a0a;display:flex;flex-direction:column;';
  var styleEl=document.createElement('style');
  styleEl.id='guide-style';
  styleEl.textContent='#modal-guide-body{'+guideStyle.replace(/body\s*\{/g,'#modal-guide-body{').replace(/:root\s*\{[^}]*\}/,'')+'}'
    +'#modal-guide-body{background:#0a0a0a;color:#e8f5e9;font-size:var(--fs-body);line-height:1.6;padding:16px 12px 40px;--bg:#0a0a0a;--gd:#050f05;--gb:#4caf50;--gl:#1a3d1a;--gm:#0d1a0d;--am:#ffc107;--rd:#f44336;--wh:#e8f5e9;--gr:#546e54;--tb:#080f08;}';
  document.head.appendChild(styleEl);
  m.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#050f05;border-bottom:2px solid #1a3d1a;flex-shrink:0;">'
    +'<span style="font-weight:700;font-size:var(--fs-h3);color:#4caf50;letter-spacing:1px;">&#9654; PRZEWODNIK GRACZA</span>'
    +'<button onclick="var mg=document.getElementById(\'modal-guide\');if(mg)mg.style.display=\'none\';" style="font-size:var(--fs-body);background:none;border:1px solid #546e54;color:#546e54;padding:2px 10px;cursor:pointer;">&#10005; ZAMKNIJ</button>'
    +'</div>'
    +'<div id="modal-guide-body" style="flex:1;overflow-y:auto;max-width:680px;width:100%;margin:0 auto;box-sizing:border-box;">'+guideBody+'</div>';
  document.body.appendChild(m);
}

