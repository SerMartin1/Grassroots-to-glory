// ── BLOKADA MECZU ────────────────────────────────────────────────────────
// Od wejścia w analizę przedmeczową (tryOpenMatch) aż do zakończenia meczu
// (patrz match-engine.js) gracz nie może opuścić procesu meczowego żadną
// ścieżką nawigacji (dashboard, modal klubu, Wstecz przeglądarki/Androida).
// Faza 'prematch': dozwolony dostęp do taktyki/składu/wolnych agentów, ale
// ich zamknięcie zawsze wraca do p-match. Faza 'live': żadna nawigacja poza
// samym p-match nie jest dozwolona.
function isMatchLockActive(){return !!(G&&G._matchLockActive);}
function _matchLockAllowedPanel(id){
  if(!isMatchLockActive())return true;
  if(id==='p-match')return true;
  if(G._matchLockPhase==='prematch'&&(id==='p-tactics'||id==='p-squad'||id==='p-freeagents'))return true;
  return false;
}
function _returnToMatchLock(){
  // Gdy mecz faktycznie trwa, NIE wolno wołać openPanel/fillMatch — fillMatch
  // ma heurystykę czyszczącą "zawieszone" matchInProgress, która przy ponownym
  // wywołaniu w trakcie prawdziwej symulacji fałszywie zerowała flagę i
  // pozwalała uruchomić drugą, równoległą symulację tego samego meczu.
  if(matchInProgress){
    closeAllPanels('p-match');
    const el=document.getElementById('p-match');if(el)el.classList.add('open');
  } else {
    openPanel('p-match');
  }
}
function _engageMatchLock(phase){
  if(!G)return;
  G._matchLockActive=true;G._matchLockPhase=phase;
  try{history.pushState({matchLock:true},'',location.href);}catch(_){}
}
function _releaseMatchLock(){
  if(G){G._matchLockActive=false;G._matchLockPhase=null;}
  try{localStorage.removeItem('palock');}catch(_){}
}
window.addEventListener('popstate',function(){
  if(isMatchLockActive()){
    try{history.pushState({matchLock:true},'',location.href);}catch(_){}
    _returnToMatchLock();
  }
});

function go(vid){
  if(isMatchLockActive()&&vid!=='v-game'){
    notif(t('match_lock_blocked_notif'),'err');
    _returnToMatchLock();
    return;
  }
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('show'));
  const el=document.getElementById(vid);if(el)el.classList.add('show');
  // Pokaż/ukryj WRÓĆ DO GRY w menu
  if(vid==='v-menu'){
    const btn=document.getElementById('btn-resume');
    const btnSave=document.getElementById('btn-save-menu');
    const btnTut=document.getElementById('btn-tutorial-toggle');
    if(btn){
      btn.style.display=G?'block':'none';
      if(G)btn.textContent=t('nav_resume_btn').replace('{club}',G.myClub?G.myClub.n:'')+(G.season?t('nav_resume_season_info').replace('{season}',G.season).replace('{week}',G.week):'');
    }
    if(btnSave)btnSave.style.display=G?'block':'none';
    if(btnTut){
      btnTut.style.display=G?'block':'none';
      if(G){
        const off=G.tutorialOff;
        btnTut.textContent=t('nav_tutorial_label')+(off?t('tutorial_state_off'):t('tutorial_state_on'));
        btnTut.style.color=off?'var(--gr)':'var(--am)';
        btnTut.style.borderColor=off?'var(--gr)':'var(--am)';
      }
    }
  }
}
// ── STRAŻNIK JEDNEGO PANELU ──────────────────────────────────────────────
// Niezależnie od tego, KTÓRA funkcja doda klasę 'open' do panelu (nawet jeśli
// pominie closeAllPanels/openPanel), ten obserwator natychmiast zamyka
// wszystkie pozostałe panele z klasą 'open'. To twarda gwarancja na poziomie
// DOM, że nigdy nie będą widoczne dwa panele naraz (np. Tabela + Kryzys Kadrowy).
(function(){
  function enforceSinglePanel(changedEl){
    if(!changedEl||!changedEl.classList||!changedEl.classList.contains('panel'))return;
    if(!changedEl.classList.contains('open'))return;
    document.querySelectorAll('.panel.open').forEach(function(other){
      if(other!==changedEl)other.classList.remove('open');
    });
  }
  function start(){
    var panels=document.querySelectorAll('.panel');
    if(!panels.length){setTimeout(start,200);return;}
    var observer=new MutationObserver(function(mutations){
      mutations.forEach(function(m){enforceSinglePanel(m.target);});
    });
    panels.forEach(function(p){observer.observe(p,{attributes:true,attributeFilter:['class']});});
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start);
  } else {
    start();
  }
})();
function closeAllPanels(exceptId){
  // Zamyka wszystkie otwarte panele oprócz exceptId (naprawia nakładanie się np. Tabeli i Kryzysu kadrowego)
  document.querySelectorAll('.panel.open').forEach(function(el){
    if(el.id!==exceptId) el.classList.remove('open');
  });
}
function openPanel(id){
  if(!_matchLockAllowedPanel(id)){
    notif(t('match_lock_blocked_notif'),'err');
    if(id!=='p-match')_returnToMatchLock();
    return;
  }
  closeAllPanels(id); // wymusza tylko 1 aktywny panel naraz (naprawa nakładania się ekranów)
  fillPanel(id);const el=document.getElementById(id);if(el)el.classList.add('open');
}
function closePanel(id){
  const el=document.getElementById(id);
  if(el){
    el.classList.remove('open');
    if(id==='p-player'){
      el.style.zIndex='';
      // Wróć do modalu podsumowania jeśli tam byliśmy
      if(window._mssPlayerReturn){
        window._mssPlayerReturn=false;
        const mss=document.getElementById('modal-season-summary');
        if(mss)mss.style.display='flex';
      }
      // Wróć do składu klubu jeśli stamtąd przyszliśmy
      if(window._playerReturnTo==='club-squad'&&window._playerReturnClubId){
        var _retCid=window._playerReturnClubId;
        window._playerReturnTo=null;window._playerReturnClubId=null;
        setTimeout(function(){openClubModal(_retCid);setTimeout(function(){cmTab('sklad');},50);},60);
      } else {
        window._playerReturnTo=null;window._playerReturnClubId=null;
      }
    }
  }
  if(id==='p-tactics'||id==='p-squad'||id==='p-freeagents'){
    if(isMatchLockActive()){
      _returnToMatchLock();
    } else {
      const pm=document.getElementById('p-match');if(pm&&pm.classList.contains('open')&&!matchInProgress)fillMatch();
    }
  }
  if(id==='p-match'){
    const _ph=document.getElementById('p-history');
    if(_ph&&_ph.classList.contains('open'))setTimeout(fillHistory,50);
  }
  // Powrót do briefingu tutorialu jeśli był otwarty
  const _tutPanels=['p-finance','p-training','p-transfers','p-match','p-squad','p-table','p-academy','p-tactics'];
  if(G&&G._tutorialBack&&_tutPanels.includes(id)){
    G._tutorialBack=false;
    const m=document.getElementById('modal-briefing');
    showBriefingModal();
  }
}
function openModal(id){const el=document.getElementById(id);if(el)el.classList.add('open');}
function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove('open');}
function notif(msg,type){const el=document.getElementById('notif-el');if(!el)return;el.textContent=msg;el.className='notif show '+(type||'');setTimeout(()=>el.classList.remove('show'),2500);}

function matchTab(tab,btn){document.querySelectorAll('#p-match .sq-tab2-btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');['m-relacja','m-oceny'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('on');});const el=document.getElementById('m-'+tab);if(el)el.classList.add('on');const spb=document.getElementById('m-speed-btns');if(spb)spb.style.display=(tab==='relacja')?'block':'none';}

function trTab(tab,btn){document.querySelectorAll('#p-transfers .tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('#p-transfers .tab-pane').forEach(p=>p.classList.remove('on'));const el=document.getElementById('tr-'+tab);if(el)el.classList.add('on');}

function handleNextWeek(){
  if(!G)return;
  if(G.seasonEnded){showSeasonSummary();return;}
  if(G.week<3){advWeekPrep();return;}
  tryOpenMatch();
}
function advWeekPrep(){
  if(n.pids&&n.pids.length){
    let m=n.msg;
    n.pids.forEach(function(id){
      const px=G.players.find(function(x){return x.id===id;});
      if(px){const last=px.name.split(' ')[1]||px.name;m=m.replace(last,'<span style="cursor:pointer;text-decoration:underline" data-pid="'+id+'" onclick="showById(parseInt(this.dataset.pid))">'+last+'</span>');}
    });
    return m;
  }
  return newsClickable(n.msg||'');
}

function advWeekPrep(){
  if(!G)return;
  G.week++;
  // Odliczanie budowy centrum nawet w preseason
  if(G.trainingCenter&&G.trainingCenter.building){
    G.trainingCenter.building.weeksLeft--;
    if(G.trainingCenter.building.weeksLeft<=0){
      G.trainingCenter.level=G.trainingCenter.building.levelIdx;
      const _n=G.trainingCenter.building.name;
      G.trainingCenter.building=null;
      addNews&&addNews(t('news_tc_ready').replace('{n}',_n),'club');
      notif&&notif(t('nav_notif_tc_done').replace('{name}',_n),'ok');
    }
  }
  // Odliczanie rozbudowy trybun w preseason
  if(G.stadium&&G.stadium.building){
    G.stadium.building.weeksLeft--;
    if(G.stadium.building.weeksLeft<=0){
      const _b=G.stadium.building;
      const _sMax=(FIN.stadMax&&FIN.stadMax[G.myLeague||8])||50000;
      G.stadium.capacity=Math.min(_sMax,(G.stadium.capacity||200)+(_b.seats||0));
      if(!G.stadium.hist)G.stadium.hist=[];
      G.stadium.hist.push({season:G.season,week:G.week,seats:_b.seats,cost:_b.cost,capAfter:G.stadium.capacity});
      G.stadium.building=null;
      addNews&&addNews(t('news_stad_expand_ready').replace('{n}',G.stadium.capacity.toLocaleString(LANG==='en'?'en-GB':'pl-PL')),'club');
      notif&&notif(t('nav_notif_stadium_ready').replace('{n}',G.stadium.capacity),'ok');
    }
  }
  // Odliczanie budowy modułu stadionu w preseason
  if(G.stadium&&G.stadium.modulBuilding){
    G.stadium.modulBuilding.weeksLeft--;
    if(G.stadium.modulBuilding.weeksLeft<=0){
      const mb=G.stadium.modulBuilding;
      const mod=STAD_MODULES[mb.key];const next=mb.next;
      if(!G.stadium.modules)G.stadium.modules={};
      G.stadium.modules[mb.key]=mb.lvl+1;
      if(next.vipWeekly!==undefined)G.stadium.vipWeekly=next.vipWeekly;
      if(next.gasBonus!==undefined)G.stadium.gasBonus=next.gasBonus;
      if(next.shopMult!==undefined)G.stadium.shopMult=next.shopMult;
      if(next.freqBonus!==undefined)G.frequency=Math.min(100,(G.frequency||50)+next.freqBonus);
      if(next.adsMult!==undefined)G.stadium.adsMult=next.adsMult;
      if(next.repBonus!==undefined)G.reputation=Math.min(1000,(G.reputation||30)+next.repBonus);
      if(!G.stadium.hist)G.stadium.hist=[];
      G.stadium.hist.push({season:G.season,week:G.week,module:mod.name+' L'+(mb.lvl+1),cost:mb.cost,capAfter:G.stadium.capacity||200});
      G.stadium.modulBuilding=null;
      addNews(t('news_stad_module_ready').replace('{icon}',mod.icon).replace('{name}',mod.name).replace('{lvl}',mb.lvl+1).replace('{effect}',next.effect),'club');
      notif(t('nav_notif_module_done').replace('{name}',mod.name+' L'+(mb.lvl+1)),'ok');
      if(typeof renderStadModuly==='function')renderStadModuly();
    }
  }
  // Process team camp during preseason weeks
  if(G.campActive&&G.campWeeks>0){
    G.campWeeks--;
    notif(t('nav_notif_camp_week').replace('{n}',2-G.campWeeks),'ok');
    if(G.campWeeks===0){
      const posMainAttr={NAP:'sht',POL:'pas',OBR:'def',GK:'def'};
      myPl().forEach(p=>{
        p.form=100;p.fatigue=0;p.onCamp=false;
        p.campBonusRounds=G.campRoundsBonus||4;
        const targetOvr=ovr(p)+1;
        if(targetOvr<=p.potential){
          const mainAttr=posMainAttr[p.pos]||'tec';
          const before=p[mainAttr];
          p[mainAttr]=Math.min(99,p[mainAttr]+1);
          if(ovr(p)<targetOvr){
            const sec={NAP:'tec',POL:'tec',OBR:'phy',GK:'men'}[p.pos]||'phy';
            p[sec]=Math.min(99,p[sec]+1);
          }
        }
      });
      G.campActive=false;
      addNews(t('news_camp_done').replace('{n}',G.campRoundsBonus||4),'ok');
      notif(t('nav_notif_camp_done'),'ok');
    }
  }
  updateHdr();
  renderNews();
  // Utrzymanie stadionu od 1. tygodnia
  if(G.fin){
    const _maint=Math.round(((G.stadium&&G.stadium.capacity)||200)*1000*0.005/4.3);
    G.budget-=_maint;G.fin.maintenance=_maint;
    let _preCost=_maint;
    // Utrzymanie centrum szkoleniowego
    if(G.trainingCenter&&G.trainingCenter.level>0&&!G.trainingCenter.building){
      const _tcUpk=tcUpkeep(G.trainingCenter.level-1);
      G.budget-=_tcUpk;G.fin.tcUpkeep=_tcUpk;_preCost+=_tcUpk;
    }
    // Akademia
    if(G.academy&&G.academy.level>0&&!G.academy.building){
      const _aUpk=acadUpkeep(G.academy.level-1);
      G.budget-=_aUpk;G.fin.academyUpkeep=_aUpk;_preCost+=_aUpk;
    }
    // Przychody w preseason — zeruj bilety z poprzedniego sezonu
    G.fin.tickets=0;
    const _preInc=calcWeeklyIncome();
    const _preIncActual=_preInc.total-(_preInc.tickets||0); // bez szacunkowych biletów (brak meczu)
    G.budget+=_preIncActual;
    if(!G.fin.hist)G.fin.hist=[];
    G.fin.hist.push({w:G.week,inc:_preIncActual,cost:_preCost,bal:G.budget,season:G.season,costMaint:_maint,costSalary:0,costTC:G.fin.tcUpkeep||0,costAcad:G.fin.academyUpkeep||0});
  }
  // Koszt skauta: jednorazowo przy zatrudnieniu + raz na poczatku sezonu
  // Odlicz oferty czasowe
  (G.transferMarket||[]).forEach(p=>{if(p._timed){p._timedWeeks=(p._timedWeeks||1)-1;if(p._timedWeeks<=0){delete p._timed;p.section='gone';}}});
  G.transferMarket=(G.transferMarket||[]).filter(p=>p.section!=='gone');
  // ── RYNEK TRANSFEROWY w preseason (okno letnie tyg 1-2) ──────────────
  if(G.week===2&&!G._deadlineDone){
    G._deadlineDone=true;
    let _promoted=0;
    (G.transferMarket||[]).forEach(p=>{if(p.section==='rumour'){p.section='sale';p.rumourWeeks=0;_promoted++;}});
    if(_promoted>0)addNews(t('news_tr_rumours_open').replace('{n}',_promoted),'budget');
    (G.transferMarket||[]).forEach(p=>p._deadline=true);
    addNews(t('news_tr_summer_deadline'),'budget');
    if(document.getElementById('tr-kup')&&document.getElementById('tr-kup').classList.contains('on'))renderBuyTab();
  }
  if(G.week===3&&!G._letnieClosed){
    G._letnieClosed=true;
    const _rem=(G.transferMarket||[]).filter(p=>p.section==='sale');
    const _gn=_rem.slice(0,Math.min(3,Math.floor(_rem.length*0.4)));
    const _allC2=(G.leagues||[]).flatMap(l=>l.clubs||[]).filter(c=>c.id!==G.myClubId);
    _gn.forEach(p=>{
      const _b=_allC2.length?_allC2[Math.floor(Math.random()*_allC2.length)]:null;
      addNews(t('news_tr_signed_other').replace('{name}',p.name).replace('{club}',_b?_b.n:t('news_tr_other_club')),'budget');
      G.transferMarket=(G.transferMarket||[]).filter(x=>x.id!==p.id);
    });
    addNews(t('news_tr_summer_closed'),'budget');
  }
  notif(t('nav_notif_week').replace('{n}',G.week)+(G.week<3?t('nav_week_prep_suffix'):t('nav_week_match_suffix')),'ok');
}
function tryOpenMatch(){
  if(!G)return;
  if(G.week<3){notif(t('nav_notif_season_not_started'),'err');return;}
  // Wariant 1: auto-uzupełnij skład z ławki jeśli ktoś kontuzjowany/zawieszony
  const autoFixed=autoFillSquadFromBench();
  const crisis=checkSquadCrisis();
  if(crisis.hasCrisis){
    openFACrisis(crisis);
    return;
  }
  if(autoFixed.length){
    notif(t('nav_notif_auto_filled').replace('{names}',autoFixed.join(', ')),'ok');
  }
  openPanel('p-match');
  _engageMatchLock('prematch');
  saveGame('lock',true);
}

function autoFillSquadFromBench(){
  const lim=formationLimits();
  const required=1+lim.OBR+lim.POL+lim.NAP;
  const filled=[];

  // Krok 1: usuń ze składu kontuzjowanych i zawieszonych
  myPl().forEach(p=>{
    if(p.starter&&(p.injured||p.suspension>0)){p.starter=false;}
  });

  // Krok 2: dla każdej pozycji uzupełnij do limitu formacji (tylko zdrowi, niezawieszeni)
  const posOrder=['GK','OBR','POL','NAP'];
  posOrder.forEach(pos=>{
    const posLimit=lim[pos];
    const curInSt=myPl().filter(p=>p.starter&&p.pos===pos).length;
    const need=posLimit-curInSt;
    if(need<=0)return;
    const candidates=myPl().filter(p=>!p.starter&&!p.injured&&(!p.suspension||p.suspension===0)&&p.pos===pos)
      .sort((a,b)=>ovr(b)-ovr(a));
    candidates.slice(0,need).forEach(p=>{p.starter=true;filled.push(p.name+' ('+POS_SHORT[pos]+')');});
  });

  return filled;
}

function checkSquadCrisis(){
  const lim=formationLimits();
  const required=1+lim.OBR+lim.POL+lim.NAP;
  const st=mySt();
  const stCount=st.length;
  const hasGK=st.some(p=>p.pos==='GK');
  const issues=[];
  const healthyPl=myPl().filter(p=>!p.injured&&(!p.suspension||p.suspension===0));
  const anyGK=healthyPl.filter(p=>p.pos==='GK');
  // Licz brakujące pozycje względem formacji (spójne z openFACrisis)
  const needGK=Math.max(0,lim.GK-healthyPl.filter(p=>p.pos==='GK').length);
  const needOBR=Math.max(0,lim.OBR-healthyPl.filter(p=>p.pos==='OBR').length);
  const needPOL=Math.max(0,lim.POL-healthyPl.filter(p=>p.pos==='POL').length);
  const needNAP=Math.max(0,lim.NAP-healthyPl.filter(p=>p.pos==='NAP').length);
  const totalMissing=needGK+needOBR+needPOL+needNAP;
  if(!anyGK.length)issues.push(t('nav_crisis_no_gk'));
  if(totalMissing>0){
    const haveTotal=lim.GK+lim.OBR+lim.POL+lim.NAP;
    issues.push(t('nav_crisis_not_enough').replace('{have}',haveTotal-totalMissing).replace('{total}',haveTotal));
  }
  return{hasCrisis:issues.length>0,issues,stCount,required,needGK,needOBR,needPOL,needNAP,totalMissing};
}
function _faCrisisMissingHtml(crisis){
  const _miss=[];
  if((crisis.needGK||0)>0)_miss.push('<span style="color:var(--am)">'+crisis.needGK+'× GK</span>');
  if((crisis.needOBR||0)>0)_miss.push('<span style="color:var(--am)">'+crisis.needOBR+'× CB</span>');
  if((crisis.needPOL||0)>0)_miss.push('<span style="color:var(--am)">'+crisis.needPOL+'× MID</span>');
  if((crisis.needNAP||0)>0)_miss.push('<span style="color:var(--am)">'+crisis.needNAP+'× ST</span>');
  const _missHtml=_miss.length?'<div style="margin-top:6px;font-size:var(--fs-dense)">'+t('nav_crisis_missing_formation').replace('{formation}','<b>'+G.formation+'</b>').replace('{list}',_miss.join(', '))+'</div>':'';
  return crisis.issues.map(function(i){return '⚠️ '+i;}).join('<br>')+_missHtml;
}
function openFACrisis(crisis){
  if(!G)return;
  // Zamknięty świat: pokazuj dostępnych FA z G.fa pasujących do ligi gracza
  const lvl=G.myLeague||8;
  const _ovr4=LEAGUE_OVR[lvl]||[10,20,20,35];const [minO,maxO]=[_ovr4[0],_ovr4[3]];
  // Dostępni FA z globalnej puli — bez ograniczenia pozycją (gracz sam wybiera)
  const availableFA=(G.fa||[]).filter(p=>p.clubId===0&&p.status!=='retired'&&ovr(p)>=minO-8&&ovr(p)<=maxO+10)
    .sort((a,b)=>ovr(b)-ovr(a)).slice(0,15);
  const info=document.getElementById('fa-crisis-info');
  if(info)info.innerHTML=_faCrisisMissingHtml(crisis);
  const list=document.getElementById('fa-list');
  if(list){
    if(availableFA.length){
      list.innerHTML=availableFA.map(p=>{
        const o=ovr(p);
        return '<div class="tcard" style="margin-bottom:6px">'+
          '<div style="flex:1"><div class="tname">'+p.name+'</div>'+
          '<div class="tdet">'+(POS_SHORT[p.pos]||p.pos)+' • '+p.age+'l • OVR '+o+' • '+t('fa_salary_lbl').replace('{n}',fmt(p.salary))+'</div></div>'+
          '<button class="btn-buy" style="background:var(--gb);color:#000" onclick="signFreeAgent('+p.id+')">'+t('fa_sign_btn')+'</button>'+
        '</div>';
      }).join('');
    } else {
      list.innerHTML='<div style="color:var(--gr);padding:12px;text-align:center">'+t('fa_no_agents')+'</div>';
    }
  }
  closeAllPanels('p-freeagents');
  openPanel('p-freeagents');
}
function signFreeAgent(id){
  if(!G)return;
  // Szukaj w G.fa (zamknięty świat)
  const p=(G.fa||[]).find(x=>x.id===id);
  if(!p)return;
  // Dodaj wpis _current w historii
  if(!p.history)p.history=[];
  fillHistoryGaps(p);
  const _cl=ALL_CLUBS.find(c=>c.id===G.myClubId);
  if(!p.history.find(h=>h._current&&h.season===G.season&&h.clubId===G.myClubId)){
    p.history.push({season:G.season,clubId:G.myClubId,club:_cl?_cl.n:'?',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_current:true});
  }
  p.clubId=G.myClubId;p.starter=false;p.status='active';p.isFreeAgent=false;
  p.contract=1;
  if(!p.trainRate)p.trainRate=1.0;
  if(!p.trainMatches)p.trainMatches=0;
  assignJerseyNum(p);
  G.players.push(p);
  G.fa=G.fa.filter(x=>x.id!==id);
  G.fin.salaries=myPl().reduce((s,x)=>s+x.salary,0);
  addNews(t('news_wa_signed').replace('{name}',p.name),'ok');
  notif(t('nav_notif_fa_signed').replace('{name}',p.name),'ok');
  const crisis=checkSquadCrisis();
  if(crisis.hasCrisis){
    openFACrisis(crisis);
  } else {
    closeFACrisis();
  }
}
function closeFACrisis(){
  closePanel('p-freeagents');
  const pm=document.getElementById('p-match');
  if(pm&&pm.classList.contains('open')){fillMatch();}
  // W przeciwnym razie po prostu wracamy do głównego widoku (bez wymuszania Taktyki),
  // żeby nie nadpisywać panelu, z którego użytkownik faktycznie przyszedł (np. Tabela).
}
function updateHdr(){if(!G)return;
  const c=document.getElementById('h-club'),s=document.getElementById('h-season'),rn=document.getElementById('h-rnd');
  if(c)c.textContent=G.myClub.n;
  if(s)s.textContent=t('hdr_season')+' '+G.season+' • '+(LEAGUE_NAMES[G.myLeague||8]||t('league_fallback'));
  const _re=document.getElementById('h-rep');if(_re)_re.textContent=t('hdr_rep')+' '+(G.reputation||10);
  const _fr=document.getElementById('h-freq');if(_fr)_fr.textContent='👥 '+(G.frequency||40)+'%';
  if(rn)rn.textContent='';
  // Show next opponent on button
  // Safety: auto-end camp if past week 2
  if(G.campActive&&G.week>2){G.campActive=false;G.campWeeks=0;}
  const btn=document.getElementById('btn-next-match');
  if(btn){
    const nm=G.schedule.find(m=>m.rnd===G.round&&!m.done&&(m.h===G.myClubId||m.a===G.myClubId));
    const wSpan=document.getElementById('btn-next-week');
    const mSpan=document.getElementById('btn-next-match-info');
    if(G.seasonEnded){
      if(wSpan)wSpan.textContent=t('hdr_season_ended').replace('{n}',G.season);
      if(mSpan)mSpan.textContent=t('hdr_new_season');
      return;
    }
    if(nm){
      const isHome=nm.h===G.myClubId;
      const opp=ALL_CLUBS.find(c=>c.id===(isHome?nm.a:nm.h));
      const oppName=opp?opp.n:'?';
      const venue=isHome?t('hdr_home'):t('hdr_away');
      if(wSpan)wSpan.textContent=t('hdr_week')+' '+G.week+' • '+t('hdr_kol')+(G.round)+' • '+venue;
      if(mSpan)mSpan.textContent='▶ '+oppName;
    } else if(G.week<3){
      if(wSpan)wSpan.textContent=t('hdr_week')+' '+G.week;
      if(mSpan)mSpan.textContent=t('hdr_weeks_to_season').replace('{n}',3-G.week);
    } else {
      if(wSpan)wSpan.textContent=t('hdr_week')+' '+G.week;
      if(mSpan)mSpan.textContent=t('hdr_end_season');
    }
  }
  renderNews();
}

function fillPanel(id){
  if(!G)return;
  if(id==='p-squad')fillSquad();
  else if(id==='p-tactics'){fillTactics();fillTacSquad();}
  else if(id==='p-match')fillMatch();
else if(id==='p-table'){
    ['p-crisis', 'modal-crisis', 'crisis-panel', 'free-agents-crisis', 'p-fa', 'p-free-agents', 'free-agents', 'p-crisis-squad'].forEach(function(crisisId) {
      const crisisEl = document.getElementById(crisisId);
      if(crisisEl) {
        crisisEl.classList.remove('open', 'show', 'active');
        crisisEl.style.setProperty('display', 'none', 'important');
      }
    }); // <-- Zamknięcie pętli .forEach
    fillTable(); // <-- TO JEST KLUCZOWE! Bez tego tabela się nie wygeneruje
  } // <-- Zamknięcie bloku else if

  else if(id==='p-transfers')fillTransfers();
  else if(id==='p-training')fillTraining();
  else if(id==='p-finance')fillFinance();
  else if(id==='p-stadium')fillStadium();
  else if(id==='p-academy')fillAcademy();
  else if(id==='p-board')fillBoard();
  else if(id==='p-history')fillHistory();
  else if(id==='p-cup')fillCup();
  else if(id==='p-world')fillWorld();
}

function fillSquad(){
  if(!G)return;
  const all=myPl();
  const sumEl=document.getElementById('squad-summary');
  if(sumEl){
    const _avgOvr=Math.round(all.reduce((s,p)=>s+ovr(p),0)/Math.max(1,all.length));
    const _totalVal=all.reduce((s,p)=>s+(calcValue(ovr(p),p.age)||0),0);
    sumEl.textContent=t('squad_summary').replace('{n}',all.length).replace('{ovr}',_avgOvr).replace('{val}',fmtVal(_totalVal));
  }
  const activeTab=document.querySelector('#p-squad .tab-btn.active');
  const tabKey=activeTab?activeTab.getAttribute('data-i18n'):'squad_tab_stats';
  if(tabKey==='squad_tab_stats')renderSquadStats();
  else if(tabKey==='squad_tab_health')renderSquadHealth();
  else if(tabKey==='squad_tab_contracts')renderSquadContracts();
  else renderSquadStats();
}
function squadTab(tab,btn){
  document.querySelectorAll('#p-squad .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['statystyki','zdrowie','kontrakty'].forEach(t=>{const e=document.getElementById('squad-'+t);if(e)e.classList.remove('on');});
  const e=document.getElementById('squad-'+tab);if(e)e.classList.add('on');
  if(tab==='statystyki')renderSquadStats();
  else if(tab==='zdrowie')renderSquadHealth();
  else if(tab==='kontrakty')renderSquadContracts();
}
function _sqTbl(headers, rows, footer){
  return '<div style="overflow-x:auto;padding:0 14px 0 0">'+
  '<table style="width:100%;border-collapse:collapse;font-size:var(--fs-meta)">'+
    '<thead><tr>'+headers.map(h=>'<th style="padding:6px 8px 6px '+(h.right?'12px':'8px')+';border-bottom:2px solid var(--gl);color:var(--gr);text-align:'+(h.right?'right':'left')+';cursor:'+(h.sort?'pointer':'default')+'" '+(h.sort?'onclick="'+h.sort+'"':'')+'>'+h.label+(h.active?' ↓':'')+'</th>').join('')+'</tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    (footer?'<tfoot><tr><td colspan="'+headers.length+'" style="padding:6px 8px;border-top:2px solid var(--gl);color:var(--gr);font-size:var(--fs-dense)">'+footer+'</td></tr></tfoot>':'')+
  '</table></div>';
}
// Sort state per zakładka
if(!window._sqSort)window._sqSort={stats:'pos',health:'pos',contracts:'contract'};
function setSqSort(tab,field){
  const cur=window._sqSort[tab]||'';
  const curField=cur.endsWith('_asc')?cur.replace('_asc',''):cur;
  if(curField===field){
    // Toggle kierunku
    window._sqSort[tab]=cur.endsWith('_asc')?field:field+'_asc';
  } else {
    // Nowe pole - zacznij od GK→ST (bez _asc)
    window._sqSort[tab]=field;
  }
  if(tab==='stats')renderSquadStats();
  else if(tab==='health')renderSquadHealth();
  else if(tab==='contracts')renderSquadContracts();
}
function setSqFilter(tab,pos){
  if(!window._sqFilter)window._sqFilter={stats:'all',health:'all',contracts:'all'};
  window._sqFilter[tab]=pos;
  if(tab==='stats')renderSquadStats();
  else if(tab==='health')renderSquadHealth();
  else if(tab==='contracts')renderSquadContracts();
}
function _filterBar(tab){
  if(!window._sqFilter)window._sqFilter={stats:'all',health:'all',contracts:'all'};
  const cur=window._sqFilter[tab]||'all';
  const btns=[['all',t('squad_filter_all')],['GK','GK'],['OBR','CB'],['POL','MID'],['NAP','ST']];
  const html=btns.map(([v,l])=>{
    const cls='sq-filter-btn'+(cur===v?' on':'');
    return '<button class="'+cls+'" data-sqtab="'+tab+'" data-sqpos="'+v+'" onclick="window._sqf(this)">'+l+'</button>';
  }).join('');
  return '<div class="sq-filter-bar">'+html+'</div>';
}
window._sqf=function(el){
  const tab=el.getAttribute('data-sqtab');
  const pos=el.getAttribute('data-sqpos');
  setSqFilter(tab,pos);
};

function renderSquadStats(){
  const el=document.getElementById('squad-statystyki');if(!el||!G)return;
  if(!window._sqSort)window._sqSort={stats:'pos',health:'pos',contracts:'contract'};
  if(!window._sqFilter)window._sqFilter={stats:'all',health:'all',contracts:'all'};
  const sf=window._sqSort.stats||'pos';
  const asc=sf.endsWith('_asc');const field=asc?sf.replace('_asc',''):sf;
  const posF=window._sqFilter.stats||'all';
  let all=myPl().slice();
  if(posF!=='all')all=all.filter(p=>p.pos===posF);
  if(field==='pos')all.sort((a,b)=>asc?posOrd(b.pos)-posOrd(a.pos):posOrd(a.pos)-posOrd(b.pos));
  else if(field==='age')all.sort((a,b)=>asc?(a.age||0)-(b.age||0):(b.age||0)-(a.age||0));
  else if(field==='ovr')all.sort((a,b)=>asc?ovr(a)-ovr(b):ovr(b)-ovr(a));
  else if(field==='fm')all.sort((a,b)=>asc?(a.form||0)-(b.form||0):(b.form||0)-(a.form||0));
  else if(field==='g')all.sort((a,b)=>asc?(a.st.g||0)-(b.st.g||0):(b.st.g||0)-(a.st.g||0));
  else if(field==='a')all.sort((a,b)=>asc?(a.st.a||0)-(b.st.a||0):(b.st.a||0)-(a.st.a||0));
  else if(field==='m')all.sort((a,b)=>asc?(a.st.m||0)-(b.st.m||0):(b.st.m||0)-(a.st.m||0));
  else if(field==='rat')all.sort((a,b)=>asc?(a.lastMatchRating||0)-(b.lastMatchRating||0):(b.lastMatchRating||0)-(a.lastMatchRating||0));
  const isGK=p=>p.pos==='GK';
  const totM=all.reduce((s,p)=>s+(p.st.m||0),0);
  const totG=all.reduce((s,p)=>s+(p.st.g||0),0);
  const totA=all.reduce((s,p)=>s+(p.st.a||0),0);
  const avgOvr=all.length?Math.round(all.reduce((s,p)=>s+ovr(p),0)/all.length):0;
  const rows=all.map(p=>{
    const o=ovr(p);const oc=o>=70?'var(--gb)':o>=40?'var(--am)':'var(--rd)';
    const fm=p.form||75;const fc=fm>=75?'var(--gb)':fm>=50?'var(--am)':'var(--rd)';
    const sRats=p.seasonRatings||[];
    const rat=sRats.length?Math.round(sRats.reduce((s,r)=>s+r,0)/sRats.length*10)/10:null;
    const ratCol=rat>=8?'var(--am)':rat>=7?'var(--gb)':'var(--wh)';
    const ratDisp=rat?rat.toFixed(1):'—';
    const stats=isGK(p)?
      '<td style="text-align:right;color:var(--gb)">'+(p.st.cs||0)+'</td><td style="text-align:right;color:var(--rd)">'+(p.st.ga||0)+'</td><td style="text-align:right">'+(p.st.m||0)+'</td>':
      '<td style="text-align:right;color:var(--am)">'+(p.st.g||0)+'</td><td style="text-align:right;color:var(--gb)">'+(p.st.a||0)+'</td><td style="text-align:right">'+(p.st.m||0)+'</td>';
    return '<tr style="border-bottom:1px solid #0d1f0d;cursor:pointer" onclick="showById('+p.id+')">'+
      '<td style="padding:5px 8px;color:var(--gr)">'+(p.jerseyNum||'—')+'</td>'+
      '<td style="padding:5px 4px;color:var(--gr);font-size:var(--fs-dense);cursor:pointer" onclick="event.stopPropagation();setSqFilter(\'stats\',\''+p.pos+'\')" title="'+t('nav_filter_title').replace('{pos}',POS_SHORT[p.pos]||p.pos)+'">'+(POS_SHORT[p.pos]||p.pos)+'</td>'+
      '<td style="padding:5px 4px;color:var(--wh);vertical-align:middle"><span class="sq-face-slot" data-pid="'+p.id+'" style="display:inline-block;vertical-align:middle;margin-right:5px;line-height:0"></span>'+p.name+(p.fromAcademy?' <span style="color:#9c27b0;font-size:9px">🎓</span>':'')+'</td>'+
      '<td style="text-align:right;padding-right:8px;color:var(--gr)">'+(p.age||'—')+'</td>'+
      '<td style="text-align:right;padding-right:10px;color:'+oc+'">'+o+'</td>'+
      '<td style="text-align:right;padding-right:10px;color:'+fc+'">'+fm+'%</td>'+
      stats+
      '<td style="text-align:right;padding-right:10px;color:'+ratCol+'">'+ratDisp+'</td>'+
    '</tr>';
  }).join('');
  const _sf=window._sqSort&&window._sqSort.stats||'pos';
  const headers=[
    {label:'#'},{label:t('squad_col_pos'),sort:"setSqSort('stats','pos')",active:_sf==='pos'},{label:t('squad_col_player')},
    {label:t('squad_col_age'),right:true,sort:"setSqSort('stats','age')",active:_sf==='age'||_sf==='age_asc'},
    {label:t('squad_col_ovr'),right:true,sort:"setSqSort('stats','ovr')",active:_sf==='ovr'},
    {label:t('squad_col_form'),right:true,sort:"setSqSort('stats','fm')",active:_sf==='fm'},
    {label:'G',right:true,sort:"setSqSort('stats','g')",active:_sf==='g'},
    {label:'A',right:true,sort:"setSqSort('stats','a')",active:_sf==='a'},
    {label:'M',right:true,sort:"setSqSort('stats','m')",active:_sf==='m'},
    {label:t('squad_col_rating'),right:true,sort:"setSqSort('stats','rat')",active:_sf==='rat'}
  ];
  const footer=null;
  el.innerHTML=_filterBar('stats')+_sqTbl(headers,rows,footer);
  if(typeof pxFace==='function'){el.querySelectorAll('.sq-face-slot').forEach(function(sl){if(!sl.firstChild){sl.appendChild(pxFace(parseInt(sl.dataset.pid),1));}});}
}
function renderSquadHealth(){
  const el=document.getElementById('squad-zdrowie');if(!el||!G)return;
  if(!window._sqSort)window._sqSort={stats:'pos',health:'pos',contracts:'contract'};
  if(!window._sqFilter)window._sqFilter={stats:'all',health:'all',contracts:'all'};
  const sf=window._sqSort.health||'pos';
  const asc=sf.endsWith('_asc');const field=asc?sf.replace('_asc',''):sf;
  const posF=window._sqFilter.health||'all';
  let all=myPl().slice();
  if(posF!=='all')all=all.filter(p=>p.pos===posF);
  if(field==='pos')all.sort((a,b)=>asc?posOrd(b.pos)-posOrd(a.pos):posOrd(a.pos)-posOrd(b.pos));
  else if(field==='fm')all.sort((a,b)=>asc?(a.form||0)-(b.form||0):(b.form||0)-(a.form||0));
  else if(field==='fat')all.sort((a,b)=>asc?(a.fatigue||0)-(b.fatigue||0):(b.fatigue||0)-(a.fatigue||0));
  else if(field==='status')all.sort((a,b)=>{const sv=p=>p.injured?2:p.suspension>0?1:0;return asc?sv(a)-sv(b):sv(b)-sv(a);});
  const avail=all.filter(p=>!p.injured&&(!p.suspension||p.suspension===0)).length;
  const injured=all.filter(p=>p.injured).length;
  const susp=all.filter(p=>p.suspension>0).length;
  const rows=all.map(p=>{
    let status,scol;
    if(p.injured){status=t('squad_status_inj').replace('{n}',p.injuryWeeks);scol='var(--rd)';}
    else if(p.suspension>0){status=t('squad_status_susp').replace('{n}',p.suspension);scol='var(--am)';}
    else{status=t('squad_status_ok');scol='var(--gb)';}
    const fm=p.form||75;const fc=fm>=75?'var(--gb)':fm>=50?'var(--am)':'var(--rd)';
    const fat=Math.round(p.fatigue||0);
    const fatCol=fat>70?'var(--rd)':fat>50?'var(--am)':'var(--gb)';
    const fatLbl=fat>70?t('squad_fat_overloaded'):fat>50?t('squad_fat_tired'):t('squad_fat_ok');
    return '<tr style="border-bottom:1px solid #0d1f0d;cursor:pointer" onclick="showById('+p.id+')">'+
      '<td style="padding:5px 4px;color:var(--gr);font-size:var(--fs-dense);cursor:pointer" onclick="event.stopPropagation();setSqFilter(\'health\',\''+p.pos+'\')" title="'+t('nav_filter_title').replace('{pos}',POS_SHORT[p.pos]||p.pos)+'">'+(POS_SHORT[p.pos]||p.pos)+'</td>'+
      '<td style="padding:5px 4px;color:var(--wh)">'+p.name+(p.fromAcademy?' <span style="color:#9c27b0;font-size:9px">🎓</span>':'')+'</td>'+
      '<td style="text-align:right;color:'+fc+'">'+fm+'%</td>'+
      '<td style="text-align:right;color:'+fatCol+'">'+fat+'%<br><span style="font-size:var(--fs-dense)">'+fatLbl+'</span></td>'+
      '<td style="padding:5px 8px 5px 4px;padding-right:14px;color:'+scol+'">'+status+'</td>'+
    '</tr>';
  }).join('');
  const _hf=window._sqSort&&window._sqSort.health||'pos';
  const headers=[
    {label:t('squad_col_pos'),sort:"setSqSort('health','pos')",active:_hf==='pos'||_hf==='pos_asc'},{label:t('squad_col_player')},
    {label:t('squad_col_fatigue'),right:true,sort:"setSqSort('health','fat')",active:_hf==='fat'},
    {label:t('squad_col_status'),sort:"setSqSort('health','status')",active:_hf==='status'}
  ];
  const footer=t('squad_footer_avail').replace('{a}',avail).replace('{t}',all.length).replace('{i}',injured).replace('{s}',susp);
  el.innerHTML=_filterBar('health')+_sqTbl(headers,rows,footer);
}
function renderSquadContracts(){
  const el=document.getElementById('squad-kontrakty');if(!el||!G)return;
  if(!window._sqSort)window._sqSort={stats:'pos',health:'pos',contracts:'contract'};
  if(!window._sqFilter)window._sqFilter={stats:'all',health:'all',contracts:'all'};
  const sf=window._sqSort.contracts||'contract';
  const asc=sf.endsWith('_asc');const field=asc?sf.replace('_asc',''):sf;
  const posF=window._sqFilter.contracts||'all';
  let all=myPl().slice();
  if(posF!=='all')all=all.filter(p=>p.pos===posF);
  if(field==='pos')all.sort((a,b)=>asc?posOrd(b.pos)-posOrd(a.pos):posOrd(a.pos)-posOrd(b.pos));
  else if(field==='contract')all.sort((a,b)=>asc?b.contract-a.contract:a.contract-b.contract);
  else if(field==='salary')all.sort((a,b)=>asc?(a.salary||0)-(b.salary||0):(b.salary||0)-(a.salary||0));
  else if(field==='value')all.sort((a,b)=>asc?(a.value||0)-(b.value||0):(b.value||0)-(a.value||0));
  const totalSal=all.reduce((s,p)=>s+(p.salary||0),0);
  const rows=all.map(p=>{
    const cc=p.contract<=1?'var(--rd)':p.contract<=2?'var(--am)':'var(--wh)';
    const vc=p.value>=20000?'var(--gb)':p.value>=5000?'var(--am)':'var(--wh)';
    return '<tr style="border-bottom:1px solid #0d1f0d;cursor:pointer" onclick="showById('+p.id+')">'+
      '<td style="padding:5px 4px;color:var(--gr);font-size:var(--fs-dense);cursor:pointer" onclick="event.stopPropagation();setSqFilter(\'contracts\',\''+p.pos+'\')" title="'+t('nav_filter_title').replace('{pos}',POS_SHORT[p.pos]||p.pos)+'">'+(POS_SHORT[p.pos]||p.pos)+'</td>'+
      '<td style="padding:5px 4px;color:var(--wh)">'+p.name+(p.fromAcademy?' <span style="color:#9c27b0;font-size:9px">🎓</span>':'')+'</td>'+
      '<td style="text-align:right;color:var(--wh)">'+fmt(p.salary||0)+'</td>'+
      '<td style="text-align:right;color:'+cc+'">'+t('squad_contract_seasons').replace('{n}',p.contract)+(p.contract<=1?' ⚠️':'')+'</td>'+
      '<td style="text-align:right;padding-right:14px;color:'+vc+'">'+fmtVal(p.value)+'</td>'+
    '</tr>';
  }).join('');
  const _cf=window._sqSort&&window._sqSort.contracts||'contract';
  const headers=[
    {label:t('squad_col_pos'),sort:"setSqSort('contracts','pos')",active:_cf==='pos'||_cf==='pos_asc'},
    {label:t('squad_col_player')},
    {label:t('squad_col_salary'),right:true,sort:"setSqSort('contracts','salary')",active:_cf==='salary'},
    {label:t('squad_col_contract'),right:true,sort:"setSqSort('contracts','contract')",active:_cf==='contract'},
    {label:t('squad_col_value'),right:true,sort:"setSqSort('contracts','value')",active:_cf==='value'}
  ];
  const footer=t('squad_footer_salary').replace('{n}',fmt(totalSal));
  el.innerHTML=_filterBar('contracts')+_sqTbl(headers,rows,footer);
}

