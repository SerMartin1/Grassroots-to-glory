// ── NEWS SYSTEM ──────────────────────────────────────────────
function showById(id){
  var pid2=parseInt(id);
  var _allP=[...G.players,...(G.retiredPlayers||[]),...(G.fa||[])];
  var p=_allP.find(function(x){return x.id===pid2;});
  if(!p)return;
  closeModal('m-contract');
  // v223: showPlayer() sam zapamiętuje punkt powrotu (_captureReturnPoint w tactics-playercard.js)
  // — musi się to zdarzyć PRZED zamknięciem modali niżej, żeby jeszcze je "zobaczył" jako otwarte.
  showPlayer(p);
  // Modale zamykamy PO otwarciu karty (ten sam wzorzec co showPlayerFromClubModal — bez mrugania)
  var mss=document.getElementById('modal-season-summary');
  if(mss&&mss.style.display==='flex')mss.style.display='none';
  var cmAi=document.getElementById('modal-club-ai');
  if(cmAi&&cmAi.style.display==='flex'){
    // v224: to zamknięcie klubu jest tylko efektem ubocznym otwarcia karty zawodnika (powrót do
    // klubu już pilnuje _playerReturnTo) — nie licz go jako "prawdziwe" zamknięcie modalu klubu,
    // inaczej closeClubModal() błędnie odpali powrót do overlayu meczu (window._clubModalReturn).
    window._clubModalReturn=null;
    closeClubModal();
  }
  var mdOv=document.getElementById('md-overlay');
  if(mdOv)mdOv.classList.remove('open');
  var kronM=document.getElementById('modal-kronika');
  if(kronM&&kronM.style.display==='flex')kronM.style.display='none';
  var repM=document.getElementById('modal-reputation');
  if(repM&&repM.style.display==='flex')repM.style.display='none';
}
function newsAction(el){
  const panel=el.dataset&&el.dataset.panel;
  if(!panel)return;
  // Mapuj skrócone nazwy na id paneli
  const panelMap={board:'p-board',finance:'p-finance',stadium:'p-stadium',academy:'p-academy',transfers:'p-transfers',training:'p-training',world:'p-world'};
  if(panel==='camp'){openPanel('p-training');setTimeout(()=>{const btn=document.querySelector('#p-training .sq-tab2-btn:nth-child(2)');if(btn){btn.click();}},200);return;}
  if(panel==='skauci'){openPanel('p-transfers');setTimeout(()=>{const btn=document.querySelector('#p-transfers .tab-btn[onclick*="skauci"]');if(btn)btn.click();},200);return;}
  if(panel==='sell_offer'){const _pid=el.dataset&&el.dataset.pid?parseInt(el.dataset.pid):null;if(_pid){window._sellId=_pid;openSellModal(_pid);}return;}
  if(panel==='match_result'){const _midx=el.dataset&&el.dataset.midx!=null?parseInt(el.dataset.midx):null;if(_midx!=null)showMatchDetail(_midx,'mHist');return;}
  if(panel==='training_plan'){openPanel('p-training');setTimeout(()=>{const btn=document.querySelector('#p-training .sq-tab2-btn:nth-child(1)');if(btn){btn.click();}},200);return;}
  if(panel==='finance_contracts'){openPanel('p-finance');setTimeout(()=>{const btn=document.querySelector('#p-finance .tab-btn[data-tab="kontrakty"]');if(btn)btn.click();},200);return;}
  if(panel==='board'){openPanel('p-finance');setTimeout(()=>{const btn=document.querySelector('#p-finance .tab-btn[data-tab="zarzad"]');if(btn)btn.click();},200);return;}
  openPanel(panelMap[panel]||panel);
}
function addNews(msg, type){
  if(!G)return;
  if(!G.news)G.news=[];
  G.news.unshift({msg,type,week:G.week,season:G.season});
  if(G.news.length>30)G.news.pop();
  renderNews();
}
// ── REPUTACJA GRACZA: jedyne miejsce, które powinno zmieniać G.reputation ────
// (poza Kroniką — tam efekty są zbyt zróżnicowane; kronShowModal loguje deltę
// przez porównanie przed/po, patrz kronika.js)
function changeReputation(delta, reason){
  if(!G||!delta)return;
  const before=G.reputation||30;
  G.reputation=Math.max(0,before+delta);
  const actualDelta=G.reputation-before;
  if(actualDelta===0)return;
  if(!G.repHistory)G.repHistory=[];
  G.repHistory.unshift({delta:actualDelta,reason,week:G.week,season:G.season});
  if(G.repHistory.length>60)G.repHistory.pop();
}
function _repHistoryItemHtml(h){
  const isPos=h.delta>0;
  const col=isPos?'var(--gb)':'var(--rd)';
  const sign=isPos?'+':'';
  return '<div style="display:flex;align-items:stretch;border-bottom:1px solid #0a180a">'
    +'<div style="width:3px;background:'+col+';flex-shrink:0"></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 10px;flex:1">'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:var(--fs-dense);color:var(--wh)">'+linkifyNames(h.reason)+'</div>'
        +'<div style="font-size:var(--fs-micro);color:var(--gr);margin-top:2px">'+t('world_news_meta').replace('{s}',h.season).replace('{n}',h.week)+'</div>'
      +'</div>'
      +'<div style="font-size:var(--fs-body);color:'+col+';font-weight:700;flex-shrink:0">'+sign+h.delta+'</div>'
    +'</div>'
  +'</div>';
}
function renderRepHistory(){
  const el=document.getElementById('rep-history-list');if(!el||!G)return;
  const list=G.repHistory||[];
  if(!list.length){
    el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);text-align:center;padding:30px">'+t('rep_history_empty')+'</div>';
    return;
  }
  el.innerHTML=list.map(_repHistoryItemHtml).join('');
}
function openRepModal(){
  if(!G)return;
  const modal=document.getElementById('modal-reputation');if(!modal)return;
  const sub=document.getElementById('rep-subtitle');
  if(sub)sub.textContent=t('rep_current').replace('{n}',G.reputation||0);
  renderRepHistory();
  modal.style.zIndex='9999';
  modal.style.display='flex';
}
function closeRepModal(){
  const modal=document.getElementById('modal-reputation');
  if(modal)modal.style.display='none';
}
function _newsItemHtml(n,dimmed){
  const barColor={ok:'#4caf50',err:'#f44336',inj:'#f44336',card:'#ffc107',info:'#ffc107',back:'#4caf50',train:'#ffc107',budget:'#f44336',contract:'#546e54',premium:'#ffd700',rumour:'#e8f5e9',scout:'#29b6f6',academy:'#ab47bc',club:'#ff8a65'};
  const icons={ok:'🏆',err:'🚨',info:'📋',inj:'🏥',card:'🟥',back:'✅',train:'🎯',budget:'💰',contract:'📝',premium:'⭐',rumour:'💬',scout:'🔍',academy:'🎓',club:'🏟'};
  const textColor={ok:'var(--gb)',err:'var(--rd)',inj:'var(--rd)',card:'var(--am)',info:'var(--am)',back:'var(--gb)',train:'var(--am)',budget:'var(--rd)',contract:'var(--gr)',premium:'#ffd700',rumour:'var(--wh)',scout:'#29b6f6',academy:'#ab47bc',club:'#ff8a65'};
  const bar=barColor[n.type]||'#546e54';
  const col=dimmed?'var(--gr)':(textColor[n.type]||'var(--wh)');
  const ico=icons[n.type]||'▶';
  let msg='';
  if(n.pids&&n.pids.length){
    msg=n.msg;
    n.pids.forEach(function(id){
      const px=G.players.find(function(x){return x.id===id;});
      if(px){const last=px.name.split(' ')[1]||px.name;msg=msg.replace(last,'<span style="cursor:pointer;text-decoration:underline" data-pid="'+id+'" onclick="showById(parseInt(this.dataset.pid))">'+last+'</span>');}
    });
  } else {
    msg=linkifyNames(n.msg||'');
  }
  const actionHtml=(!dimmed&&n.action)
    ?'<div style="margin-top:3px"><span style="font-weight:700;font-size:var(--fs-micro);cursor:pointer;color:var(--am);border:1px solid var(--am);padding:2px 6px;background:rgba(255,193,7,0.08)" onclick="newsAction(this)" data-panel="'+n.action+'"'+(n.pid?' data-pid="'+n.pid+'"':'')+(n.midx!=null?' data-midx="'+n.midx+'"':'')+'>▶ '+(n.actionLabel||t('news_action_default'))+'</span></div>'
    :'';
  const opacity=dimmed?'opacity:0.6;':'' ;
  return '<div style="display:flex;align-items:stretch;border-bottom:1px solid #0a180a;'+opacity+'">'
    +'<div style="width:3px;background:'+(dimmed?'#2d3d2d':bar)+';flex-shrink:0"></div>'
    +'<div style="display:flex;align-items:flex-start;gap:7px;padding:6px 10px;flex:1">'
      +'<span style="font-size:var(--fs-body);flex-shrink:0;margin-top:1px">'+ico+'</span>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:var(--fs-dense);color:'+col+';line-height:1.3">'+msg+'</div>'
        +actionHtml
      +'</div>'
    +'</div>'
  +'</div>';
}

// ── AKTUALNOŚCI: ZAKŁADKI ────────────────────────────────────────────────
var _newsTab='now';

function _newsTabFilter(tab, allNews){
  // back_inj vs back_card rozróżnienie po kontekście
  const isBackInj = n => n.type==='back' && (n.msg||'').match(/kontuzj|wraca po kontuzji|injury|returns from injury/i);
  const isBackCard = n => n.type==='back' && (n.msg||'').match(/zawieszeni|wraca po zawieszeniu|suspension|returns from suspension/i);
  const maps = {
    now:      n => true,
    match:    n => ['ok','err','card'].includes(n.type) || (n.type==='info'&&(n.msg||'').match(/mecz|wynik|puchar|Remis|Wygrana|Przegrana|match|result|cup|Win |Loss |Draw /i)) || (n.type==='back'&&isBackCard(n)),
    health:   n => ['inj'].includes(n.type) || (n.type==='back'&&isBackInj(n)),
    transfer: n => ['budget','premium','rumour','contract'].includes(n.type),
    scout:    n => n.type==='scout'||n.type==='academy',
    club:     n => n.type==='club' || (n.type==='info'&&(n.msg||'').match(/zarząd|sponsor|AWANS|SPADEK|liga|board|promoted|relegated|league/i)),
    train:    n => n.type==='train' || (n.type==='back'&&!isBackInj(n)&&!isBackCard(n)),
  };
  return (maps[tab]||maps.now)(allNews);
}

function _newsBadge(tab, news){
  return news.filter(n=>_newsTabFilter(tab,n)).length;
}

function newsSetTab(tab){
  _newsTab=tab;
  renderNews();
}

function newsTogglePrev(){
  const body=document.getElementById('news-prev-body');
  const arrow=document.getElementById('news-prev-arrow');
  if(!body||!arrow)return;
  const open=body.style.display!=='none';
  body.style.display=open?'none':'block';
  arrow.textContent=open?'▶':'▼';
}

function newsFilterPrev(chip,filter){
  document.querySelectorAll('.news-fchip').forEach(c=>c.classList.remove('on'));
  chip.classList.add('on');
  _renderPrevList(filter);
}

function _renderPrevList(filter){
  const body=document.getElementById('news-prev-body');
  if(!body||!G)return;
  const prio={err:0,inj:0,budget:1,card:2,premium:3,ok:4,back:4,train:5,scout:5,academy:5,club:6,info:6,rumour:7,contract:8};
  const allNews=G.news||[];
  const weeks=[...new Set(allNews.map(n=>n.week))].sort((a,b)=>b-a);
  const currentWeek=weeks[0];
  let prevNews=allNews.filter(n=>n.week!==currentWeek&&n.season===G.season&&_newsTabFilter(_newsTab,n)).sort((a,b)=>b.week-a.week||(prio[a.type]||9)-(prio[b.type]||9));
  const prevWeeks=[...new Set(prevNews.map(n=>n.week))].sort((a,b)=>b-a);
  let html='';
  if(!prevNews.length){
    html='<div style="font-size:var(--fs-dense);color:var(--gr);padding:10px 12px">'+t('news_none_cat')+'</div>';
  } else {
    prevWeeks.forEach(w=>{
      const wNews=prevNews.filter(n=>n.week===w);
      html+='<div style="display:flex;align-items:center;gap:6px;padding:3px 12px;background:#0a130a;border-bottom:1px solid #0d1f0d">'
        +'<span style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);letter-spacing:1px">'+t('news_week_abbr').replace('{n}',w)+'</span>'
        +'<div style="flex:1;height:1px;background:#1a2d1a"></div>'
        +'</div>';
      wNews.forEach(n=>{html+=_newsItemHtml(n,false);});
    });
  }
  const listEl=document.getElementById('news-prev-list');
  if(listEl)listEl.innerHTML=html;
}

function renderNews(){
  const el=document.getElementById('news-list');if(!el)return;
  if(!G||!G.news||!G.news.length){
    el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);padding:10px 12px;border-left:3px solid var(--gl)">'+t('news_none')+'</div>';
    return;
  }
  const prio={err:0,inj:0,budget:1,card:2,premium:3,ok:4,back:4,train:5,scout:5,academy:5,club:6,info:6,rumour:7,contract:8};
  const active=G.news.filter(n=>!n.expires||n.expires>G.week);
  const weeks=[...new Set(active.map(n=>n.week))].sort((a,b)=>b-a);
  const currentWeek=weeks[0];

  // Definicja zakładek
  const TABS=[
    {id:'now',     label:t('news_tab_now'),      icon:'📌'},
    {id:'match',   label:t('news_tab_matches'),  icon:'⚽'},
    {id:'health',  label:t('news_tab_health'),   icon:'🏥'},
    {id:'transfer',label:t('news_tab_transfers'),icon:'🔄'},
    {id:'scout',   label:t('news_tab_scout'),    icon:'🔍'},
    {id:'club',    label:t('news_tab_club'),     icon:'🏟'},
    {id:'train',   label:t('news_tab_training'), icon:'🎯'},
  ];

  // Badge: liczba wiadomości bieżącego tygodnia per zakładka
  const curAll=active.filter(n=>n.week===currentWeek);
  const curFiltered=curAll.filter(n=>_newsTabFilter(_newsTab,n)).sort((a,b)=>(prio[a.type]||9)-(prio[b.type]||9));
  const prevAll=active.filter(n=>n.week!==currentWeek);

  // ── PASEK ZAKŁADEK ────────────────────────────────────────────────────
  let html='<div style="display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;background:#030f03;border-bottom:2px solid var(--gl);gap:0;flex-shrink:0">';
  TABS.forEach(t=>{
    const badge=_newsBadge(t.id, curAll);
    const isActive=_newsTab===t.id;
    const badgeHtml=badge>0
      ?'<span style="background:'+(isActive?'#000':'var(--am)')+';color:'+(isActive?'var(--am)':'#000')+';font-size:var(--fs-dense);padding:0 4px;margin-left:3px;min-width:14px;text-align:center;display:inline-block">'+badge+'</span>'
      :'';
    html+='<div onclick="newsSetTab(\''+t.id+'\')" style="'
      +'display:flex;flex-direction:column;align-items:center;gap:1px;'
      +'padding:5px 7px;cursor:pointer;white-space:nowrap;flex-shrink:0;'
      +'border-bottom:2px solid '+(isActive?'var(--gb)':'transparent')+';'
      +'background:'+(isActive?'#0a1f0a':'transparent')+';'
      +'">'
      +'<span style="font-size:var(--fs-meta)">'+t.icon+'</span>'
      +'<span style="font-weight:700;font-size:var(--fs-micro);color:'+(isActive?'var(--gb)':'var(--gr)')+'">'+t.label+badgeHtml+'</span>'
      +'</div>';
  });
  html+='</div>';

  // ── BIEŻĄCY TYDZIEŃ ───────────────────────────────────────────────────
  html+='<div style="display:flex;align-items:center;gap:8px;padding:4px 12px;background:#0a180a;border-bottom:1px solid var(--gl)">'
    +'<span style="font-weight:700;font-size:var(--fs-micro);color:var(--am);letter-spacing:1px">'+t('news_week').replace('{n}',currentWeek)+'</span>'
    +'<div style="flex:1;height:1px;background:var(--gl)"></div>'
    +'<span style="font-size:var(--fs-dense);color:var(--gr)">'+t('news_events').replace('{n}',curFiltered.length)+'</span>'
    +'</div>';

  if(curFiltered.length){
    curFiltered.forEach(n=>{html+=_newsItemHtml(n,false);});
  } else {
    html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:8px 12px">'+t('news_none_cat')+'</div>';
  }

  // ── POPRZEDNIE TYGODNIE ───────────────────────────────────────────────
  const prevFiltered=prevAll.filter(n=>_newsTabFilter(_newsTab,n));
  if(prevFiltered.length){
    html+='<div onclick="newsTogglePrev()" style="display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--gm);border-top:2px solid var(--gb);border-bottom:2px solid var(--gl);cursor:pointer;user-select:none">'
      +'<span id="news-prev-arrow" style="font-weight:700;font-size:var(--fs-h3);color:var(--am)">▶</span>'
      +'<span style="font-weight:700;font-size:var(--fs-h3);color:var(--wh);letter-spacing:1px">'+t('news_prev_weeks')+'</span>'
      +'<span style="font-size:var(--fs-dense);color:var(--gr);margin-left:auto">'+prevFiltered.length+'</span>'
      +'</div>';
    html+='<div id="news-prev-body" style="display:none">';
    html+='<div id="news-prev-list"></div>';
    html+='</div>';
  }

  el.innerHTML=html;
  if(prevFiltered.length)_renderPrevList(_newsTab);
}

function applyInjury(p, isMatch){
  const rand=Math.random();
  let type, weeks, formDrop, phyDrop=0;
  // Match: lighter injury distribution; Training: more medium
  const roll = isMatch
    ? (rand<0.70?'light':rand<0.95?'medium':'serious')
    : (rand<0.60?'light':rand<0.95?'medium':'serious');
  if(roll==='light'){type=t('inj_type_light');weeks=r(1,2);formDrop=20;}
  else if(roll==='medium'){type=t('inj_type_medium');weeks=r(3,5);formDrop=40;phyDrop=2;}
  else{type=t('inj_type_severe');weeks=r(6,12);formDrop=0;p.form=5;phyDrop=3;}
  p.injured=true;
  p.injuryWeeks=weeks;
  p.injuryType=type;
  p.starter=false;
  if(formDrop>0&&!(p.traits&&p.traits.includes('twardy')))p.form=Math.max(5,p.form-formDrop);
  if(phyDrop>0)p.phy=Math.max(1,p.phy-phyDrop);
  if(G&&p.clubId===G.myClubId){notif(t('news_notif_injury').replace('{name}',p.name).replace('{type}',type.toLowerCase()).replace('{n}',weeks),'err');addNews(t('news_inj_player').replace('{name}',p.name).replace('{type}',type).replace('{weeks}',weeks), 'inj');}
}
// ── WIĘŹ Z KLUBEM ────────────────────────────────────────────────
// Zwraca obiekt {level, name, icon, color} dla zawodnika gracza
function getBondLevel(p){
  if(!p||!G||p.clubId!==G.myClubId)return null;
  const s=p._seasonsAtClub||0;
  if(s>=8)return{level:4,name:t('bond_level_4'),icon:'❤️',color:'#e066ff',seasons:s};
  if(s>=5)return{level:3,name:t('bond_level_3'),icon:'🔵',color:'#4db8ff',seasons:s};
  if(s>=3)return{level:2,name:t('bond_level_2'),icon:'🟡',color:'#ffc107',seasons:s};
  return{level:1,name:t('bond_level_1'),icon:'—',color:'var(--gr)',seasons:s};
}
// Bonus formy do użycia w symulacji meczu — działa dla zawodników dowolnego klubu (większy u siebie)
function getBondFormBonus(p,isHome){
  const b=getBondLevel(p);
  if(!b)return 0;
  if(b.level===4)return isHome?3:1;
  if(b.level===3)return isHome?2:0;
  if(b.level===2)return isHome?1:0;
  return 0;
}
// ─────────────────────────────────────────────────────────────────

function playerStr(p){
  if(!p)return 0;
  // Bonusy cech do atrybutów w meczu
  let sht=p.sht,tec=p.tec,phy=p.phy,def=p.def,pas=p.pas,men=p.men;
  if(p.traits){
    if(p.traits.includes('sprinter'))phy=Math.min(99,phy+5);
    if(p.traits.includes('artrysta'))tec=Math.min(99,tec+5);
    if((p.pos==='NAP'||p.pos==='POL')&&p.traits.includes('snajper'))sht=Math.min(99,sht+5);
    if((p.pos==='OBR'||p.pos==='GK')&&p.traits.includes('mur'))def=Math.min(99,def+5);
  }
  if(p.pos==='NAP') return Math.round(sht*0.40+tec*0.25+phy*0.20+men*0.15);
  if(p.pos==='POL') return Math.round(pas*0.35+tec*0.25+men*0.20+phy*0.20);
  if(p.pos==='OBR') return Math.round(def*0.40+phy*0.30+men*0.20+pas*0.10);
  if(p.pos==='GK')  return Math.round(def*0.45+men*0.35+phy*0.15+pas*0.05);
  return ovr(p);
}
function capOvrAtPotential(p){const attrs=['tec','pas','sht','def','phy','men'];while(ovr(p)>=p.potential&&p.potential<99){const excess=ovr(p)-p.potential+1;const a=attrs[Math.floor(Math.random()*attrs.length)];p[a]=Math.max(1,p[a]-excess);}}


function assignAITactics(){
  const formations=['4-4-2','4-3-3','3-5-2','5-3-2','3-4-3','4-5-1'];
  const styles=['Defensywny','Zrównoważony','Ofensywny'];
  const tempos=['Wolne','Normalne','Szybkie'];
  const pressings=['Niski','Normalny','Wysoki'];
  const lines=['Niska','Normalna','Wysoka'];
  const instructions=['Posiadanie','Długie piłki','Bezpośrednia','Kontry'];
  if(!G.clubTactics)G.clubTactics={};
  ALL_CLUBS.forEach(c=>{
    if(c.id===G.myClubId)return; // skip player's club
    G.clubTactics[c.id]={
      formation:pick(formations),
      style:pick(styles),
      tempo:pick(tempos),
      pressing:pick(pressings),
      line:pick(lines),
      instruction:pick(instructions)
    };
  });
}

function buildSchedule(myId,clubs){
  if(!clubs)clubs=CLUBS_B;
  const allTeamIds=clubs.map(c=>c.id);
  const fullSch=[];
  const nRR=allTeamIds.length-1;
  // Shuffle starting order for variety each season (safe - doesn't break round-robin)
  const rrShuffle=[...allTeamIds];
  for(let i=rrShuffle.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rrShuffle[i],rrShuffle[j]]=[rrShuffle[j],rrShuffle[i]];}
  const rrRotate=[...rrShuffle];
  for(let rnd=1;rnd<=nRR;rnd++){
    for(let i=0;i<rrRotate.length/2;i++){
      const h=rrRotate[i],a=rrRotate[rrRotate.length-1-i];
      fullSch.push({h,a,rnd,done:false,hg:0,ag:0});
    }
    const fixed=rrRotate[0];
    const rot=rrRotate.slice(1);
    rot.unshift(rot.pop());
    rrRotate.length=0;
    rrRotate.push(fixed,...rot);
  }
  const fullRl=fullSch.map(m=>({...m,rnd:m.rnd+nRR,h:m.a,a:m.h}));
  const combined=[...fullSch,...fullRl].sort((a,b)=>a.rnd-b.rnd);
  // Enforce strict home/away alternation for myClub
  combined.forEach(m=>{
    if(m.h===myId||m.a===myId){
      const wantHome=(m.rnd%2===1);
      const isHome=m.h===myId;
      if(wantHome&&!isHome){const tmp=m.h;m.h=m.a;m.a=tmp;}
      else if(!wantHome&&isHome){const tmp=m.h;m.h=m.a;m.a=tmp;}
    }
  });
  return combined;
}

function assignJerseyNumbers(){
  // Assign unique jersey numbers 1-99 per club
  const clubIds=[...new Set(G.players.map(p=>p.clubId).filter(id=>id>0))];
  clubIds.forEach(cid=>{
    const squad=G.players.filter(p=>p.clubId===cid);
    const nums=[];
    for(let n=1;n<=99;n++)nums.push(n);
    // Shuffle
    for(let i=nums.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nums[i],nums[j]]=[nums[j],nums[i]];}
    squad.forEach((p,i)=>{p.jerseyNum=nums[i]||i+1;});
  });
}
function assignJerseyNum(p){
  // Przypisz wolny numer koszulki w drużynie zawodnika
  const taken=new Set(G.players.filter(x=>x.clubId===p.clubId&&x.id!==p.id).map(x=>x.jerseyNum||0));
  // GK preferuje 1, reszta 2-99
  const preferred=p.pos==='GK'?[1,12,22]:[...Array(98).keys()].map(i=>i+2);
  const all=p.pos==='GK'?[1,12,22,...[...Array(98).keys()].map(i=>i+2)]:[...Array(98).keys()].map(i=>i+2);
  for(const n of all){if(!taken.has(n)){p.jerseyNum=n;return;}}
  p.jerseyNum=Math.floor(Math.random()*99)+1;
}
// Pozycje dla 20 zawodników dopasowane do formacji
function positionsForFormation(formation){
  // Stały skład 24 zawodników: 2 GK, 8 OBR, 8 POL, 6 NAP
  const pos=['GK','GK'];
  for(let i=0;i<8;i++)pos.push('OBR');
  for(let i=0;i<8;i++)pos.push('POL');
  for(let i=0;i<6;i++)pos.push('NAP');
  return pos; // zawsze 24
}
function mkLeaguePlayers(leagues,myClubId){
  const players=[];
  leagues.forEach(lg=>{
    const ovr4=LEAGUE_OVR[lg.level]||[20,35,35,50];
    const [botMin,botMax,topMin,topMax]=ovr4.length===4?ovr4:[ovr4[0],ovr4[1],ovr4[0],ovr4[1]];
    const nClubs=lg.clubs.length;
    lg.clubs.forEach((c,ci)=>{
      const t=nClubs>1?(nClubs-1-ci)/(nClubs-1):0.5;
      const cMin=Math.round(botMin+(topMin-botMin)*t);
      const cMax=Math.round(botMax+(topMax-botMax)*t);
      const POS24=positionsForFormation(); // zawsze 24: 2GK,8OBR,8POL,6NAP
      for(let i=0;i<24;i++){
        const p=mkPlayer(c.id);p.pos=POS24[i];p.last=p.name.split(' ')[1]||p.name;
        const target=r(cMin,cMax);const attrs=['tec','pas','sht','def','phy','men'];
        attrs.forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(target+r(-8,8))));});
        p.potential=calcPotential(p,lg.level);
        p.value=calcValue(ovr(p),p.age);p.salary=calcSalary(p.value,lg.level,ovr(p));
        genPlayerHistory(p,leagues,1);
        players.push(p);
      }
      // Dodatkowa głębia składu — dawniej osobna pula 150 wolnych agentów (buildInitialFA),
      // teraz zamknięty świat: rozdzielona bezpośrednio do klubów zamiast czekać w zawieszeniu
      // (patrz js/CLAUDE.md, zasada zamkniętego świata).
      const extra=r(0,2);
      for(let i=0;i<extra;i++){
        const p=mkPlayer(c.id);p.last=p.name.split(' ')[1]||p.name;
        const target=r(cMin,cMax);const attrs=['tec','pas','sht','def','phy','men'];
        attrs.forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(target+r(-8,8))));});
        p.potential=calcPotential(p,lg.level);
        p.value=calcValue(ovr(p),p.age);p.salary=calcSalary(p.value,lg.level,ovr(p));
        genPlayerHistory(p,leagues,1);
        players.push(p);
      }
    });
  });
  return players;
}
// ── GENEROWANIE HISTORII WSTECZNEJ DLA ZAWODNIKA ─────────────────────────────
function genPlayerHistory(p,leagues,currentSeason){
  // Historia zaczyna się od S1 — brak historii wstecznej
  return;
}

function initGame(mgrName,clubId,startLeague,preLeagues){
  pid=1;NAME_POOL=buildNamePoolI18n();namePoolIdx=0;
  const leagues=preLeagues||initLeagues();
  if(!startLeague)startLeague=8;
  setCurrentLeague(leagues,startLeague);
  const players=mkLeaguePlayers(leagues,clubId);
  // Set starters for all clubs
  leagues.forEach(lg=>{
    lg.clubs.forEach(c=>{
      const sq=players.filter(p=>p.clubId===c.id);
      const gks=sq.filter(p=>p.pos==='GK'),dfs=sq.filter(p=>p.pos==='OBR'),mds=sq.filter(p=>p.pos==='POL'),fws=sq.filter(p=>p.pos==='NAP');
      if(c.id===clubId){gks.slice(0,1).forEach(p=>p.starter=true);dfs.slice(0,4).forEach(p=>p.starter=true);mds.slice(0,4).forEach(p=>p.starter=true);fws.slice(0,2).forEach(p=>p.starter=true);}
      else{if(gks.length)gks[0].starter=true;sq.filter(p=>p.pos!=='GK').slice(0,10).forEach(p=>p.starter=true);}
    });
  });
  // Build standings and schedules for all leagues
  const allStandings={};const allSchedules={};
  leagues.forEach(lg=>{
    allStandings[lg.level]=lg.clubs.map(c=>({cid:c.id,n:c.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
    allSchedules[lg.level]=buildSchedule(clubId,lg.clubs);
  });
  const myLeague=leagues.find(lg=>lg.clubs.some(c=>c.id===clubId));
  const myLeagueLevel=myLeague?myLeague.level:startLeague;
  const budget=LEAGUE_BUDGET[myLeagueLevel]||12000;
  const sponsors=LEAGUE_SPONSORS[myLeagueLevel]||200;
  G={mgrName,myClubId:parseInt(clubId),myClub:ALL_CLUBS.find(c=>c.id===clubId)||leagues.flatMap(l=>l.clubs).find(c=>c.id===clubId),
    currency:CURRENT_CURRENCY,
    season:1,week:1,round:1,budget,players,
    leagues,myLeague:myLeagueLevel,
    standing:allStandings[myLeagueLevel],
    allStandings,allSchedules,
    schedule:allSchedules[myLeagueLevel],
    weeklyMarket:[],mHist:[],_mHistAI:[],cHist:[],retiredPlayers:[],
    training:'ATK',formation:'4-4-2',style:'Zrównoważony',tempo:'Normalne',pressing:'Normalny',line:'Normalna',instruction:'Bezpośrednia',
    fin:{tickets:0,sponsors,salaries:0,hist:[],transfers:[]},
    reputation:30,frequency:50,winStreak:0,loseStreak:0,seasonBonus:0,trainingCenter:{level:0,building:null,profiles:[],profilesLocked:false},scout:{level:'free',modeA:[],modeB:{active:false,roundsLeft:0},observed:[],discovered:[],clubReports:[]},scout:null,
    records:{maxWinStreak:0,maxUnbeatenStreak:0,maxLoseStreak:0,unbeatenStreak:0,bestWin:null,maxGoalsSeason:0,maxGoalsSeason_s:0,minConcededSeason:99,minConcededSeason_s:0},
    board:{mainGoal:null,optGoal:null,goalsHistory:[]},
    trophies:[],
    allTimeStats:{players:{},bestSeller:null,bestBuyer:null},
    stadium:{capacity:200,shopMult:1,adsMult:1,vipWeekly:0,gasBonus:0,modules:{},hist:[]},
    stadium:{capacity:200,shopMult:1,adsMult:1,vipWeekly:0},
    kronika:{cooldown:0,usedThisSeason:[],flags:{}},
    timeline:[],fanMemory:{cooldown:0,recalled:[]},
    worldNews:[],_worldNewsNextId:0,repHistory:[]};
  G.fin.salaries=myPl().reduce((s,p)=>s+p.salary,0);
  genWeeklyMarket();assignJerseyNumbers();
  myPl().forEach(p=>{p.seasonStartOvr=ovr(p);p.seasonStartAttrs={tec:p.tec,pas:p.pas,sht:p.sht,def:p.def,phy:p.phy,men:p.men};if(!p.value||p.value===0)p.value=calcValue(ovr(p),p.age);});
  G.players.forEach(p=>{const curOvr=ovr(p);if(!p.potential||p.potential<=curOvr){const _lg=leagues.find(l=>l.clubs.some(c=>c.id===p.clubId));p.potential=calcPotential(p,_lg?_lg.level:8);}});
  ALL_CLUBS=leagues.flatMap(l=>l.clubs);
  assignAITactics();// v213: po ustawieniu pełnego ALL_CLUBS — wcześniej pokrywało tylko ligę gracza
  CLUBS_B=[...getLeagueClubs(leagues,myLeagueLevel)];
  leagues.flatMap(l=>l.clubs).filter(c=>c.id!==clubId).forEach(c=>aiSelectSquad(c.id));
  // ── INICJALIZUJ AI DLA WSZYSTKICH KLUBÓW ─────────────────
  leagues.forEach(lg=>lg.clubs.forEach(club=>{
    if(club.id!==clubId&&!club.ai) club.ai=initClubAI(club,lg.level);
  }));
  // ── BRAK TRANSFERÓW AI NA START SEZONU 1 ──────────────────
  // Świeżo utworzony świat: kluby AI mają już pełne składy z mkLeaguePlayers().
  // Pierwsza aktywność transferowa AI w karierze pojawia się dopiero przy
  // otwarciu okna zimowego (runda 16, patrz week-progress.js) — nie od razu
  // na starcie. Od sezonu 2 wzwyż normalne okno letnie działa jak zwykle
  // (season-summary.js woła aiTransferSeason(false) przy zmianie sezonu).
  // ── ŻYWY ŚWIAT AI: derby i bukmacherska zapowiedź na start sezonu 1 ──────
  // flushAllWeeklyNews() na końcu: season_preview z clubId trafia do bufora klubu
  // (jak każdy news z addWorldNewsEvent) i poza cotygodniowym tickiem nikt by go nie opróżnił.
  try{ assignDerbyPairs(); announceDerbies(); announceSeasonPreview(); flushAllWeeklyNews(); }
  catch(e){ console.warn('Żywy Świat AI season 1 init error:',e); }
}

function myPl(){return G.players.filter(p=>p.clubId===G.myClubId);}
function mySt(){return myPl().filter(p=>p.starter);}
function formationLimits(){const fp=G.formation.split('-').map(Number);return{GK:1,OBR:fp[0]||4,POL:fp[1]||4,NAP:fp[2]||2};}
function tStr(cid){const st=G.players.filter(p=>p.clubId===cid&&p.starter);return st.length?Math.round(st.reduce((s,p)=>s+ovr(p),0)/st.length):30;}

function saveGame(slot,silent){
  if(!G)return;
  try{
    const replacer=(key,val)=>typeof val==='function'?undefined:val;
    const J=v=>JSON.stringify(v,replacer);
    const KB=s=>Math.round(s.length/1024);

    // ── SLIM HELPERS ───────────────────────────────────────────────────
    // Gracze naszego klubu: pełny zapis
    const FULL=['id','name','last','pos','age','tec','pas','sht','def','phy','men',
      'value','salary','contract','clubId','potential','status','starter','form',
      'injured','injuryWeeks','boughtPrice','boughtSeason','transferPrice',
      'fromAcademy','traits','jerseyNum','trainRate','trainMatches','campBonusRounds',
      'seasonStartOvr','seasonStartAttrs','perfBonus','leagueMin','loyaltyGuarantee',
      'retiredSeason','retiring','formerClubs','_poolLvl','_hot','st','cupSt','awards','seasonRatings'];
    const slimFull=p=>{
      const s={};
      FULL.forEach(k=>{if(p[k]!==undefined)s[k]=p[k];});
      // Historia: bez placeholderów, bez pustych _current
      if(p.history)s.history=p.history.filter(h=>!h._placeholder&&(!h._current||(h.m||0)>0));
      if(p.seasonRatings&&p.seasonRatings.length)
        s._avgRat=+(p.seasonRatings.reduce((a,b)=>a+b,0)/p.seasonRatings.length).toFixed(1);
      return s;
    };

    // AI gracze i pool: tylko dane potrzebne do symulacji, BEZ historii
    const AI=['id','name','last','pos','age','tec','pas','sht','def','phy','men',
      'value','salary','contract','clubId','potential','status','starter','form',
      'traits','_poolLvl','retiring','retiredSeason','fromAcademy','jerseyNum','st'];
    const slimAI=p=>{
      const s={};
      AI.forEach(k=>{if(p[k]!==undefined)s[k]=p[k];});
      if(p.history&&p.history.length)
        s.history=p.history.filter(h=>!h._placeholder&&!h._current&&(h.m||0)>0);
      return s;
    };

    // Gracze z odległych lig (>2 poziomy od naszej): absolutne minimum
    const MICRO=['id','pos','age','tec','pas','sht','def','phy','men','clubId'];
    const slimMicro=p=>{const s={};MICRO.forEach(k=>{if(p[k]!==undefined)s[k]=p[k];});return s;};

    // ── ZBIERZ SAVEDATA ────────────────────────────────────────────────
    const SKIP=new Set(['players','fa','retiredPlayers',
      'allSchedules','allStandings','schedule','standing',
      '_mssValSnap','trainSnapshot','_newsModalShown','_cupMatchActive','_cupFakeMatch',
      'rumourPool','transferMarket','listedPlayers','pendingOffers','_sellOffers','weeklyMarket',
      '_mHistAI']);
    const sd={savedAt:new Date().toISOString()};
    Object.keys(G).forEach(k=>{if(!SKIP.has(k))sd[k]=G[k];});

    // Board goals: usuń funkcje
    if(sd.board){
      sd.board={...sd.board};
      delete sd.board.mainOptions;delete sd.board.optOptions;
      if(sd.board.mainGoal){sd.board.mainGoalId=sd.board.mainGoal.id;delete sd.board.mainGoal;}
      if(sd.board.optGoal){sd.board.optGoalId=sd.board.optGoal.id;delete sd.board.optGoal;}
    }

    // fin.hist: max 150 wpisów (1 na tydzień × ~30 tygodni × kilka sezonów)
    if(sd.fin&&sd.fin.hist)sd.fin={...sd.fin,hist:sd.fin.hist.slice(-150)};

    // lgHist: max 15 sezonów per liga
    if(sd.lgHist){const lh={};Object.keys(sd.lgHist).forEach(k=>{lh[k]=(sd.lgHist[k]||[]).slice(-15);});sd.lgHist=lh;}

    // cHist: max 30 sezonów
    if(sd.cHist&&sd.cHist.length>30)sd.cHist=sd.cHist.slice(-30);

    // ── GRACZE ─────────────────────────────────────────────────────────
    // Moi gracze: pełny slim
    const myId=G.myClubId;
    const myLg=G.myLeague||8;
    if(!G.players)G.players=[];
    // Pobierz poziom ligi dla każdego klubu
    const _clubLgMap={};
    if(G.leagues){G.leagues.forEach(lg=>{lg.clubs.forEach(c=>{_clubLgMap[c.id]=lg.level;});});}
    const myPlayers=G.players.filter(p=>p.clubId===myId);
    const aiPlayers=G.players.filter(p=>p.clubId!==myId);
    // Gracze z lig sąsiednich (±2): slimAI; dalsze: slimMicro
    sd.players=[...myPlayers.map(slimFull),...aiPlayers.map(p=>{
      const plg=_clubLgMap[p.clubId]||myLg;
      return Math.abs(plg-myLg)<=2?slimAI(p):slimMicro(p);
    })];

    // FA: pełny slim, max 60
    sd.fa=(G.fa||[]).slice(0,60).map(slimFull);


    // retiredPlayers: tylko Ci co grali u nas, max 80 najnowszych + legendy/rekordziści klubu
    // zawsze (link do ich karty musi działać na stałe — patrz protectedRetireeIds() w
    // core/data.js, oni i tak spełniają warunek "grał u nas" bo allTimeStats liczy tylko
    // zawodników myClubId)
    const _retiredMine=(G.retiredPlayers||[])
      .filter(p=>p.history&&p.history.some(h=>h.clubId===myId));
    const _retiredProtected=protectedRetireeIds();
    const _retiredRecentIds=new Set(_retiredMine.slice(-80).map(p=>p.id));
    sd.retiredPlayers=_retiredMine
      .filter(p=>_retiredRecentIds.has(p.id)||_retiredProtected.has(p.id))
      .map(slimFull);

    // ── STANDINGS ──────────────────────────────────────────────────────
    // Bieżąca tabela — zachowaj całą (potrzebna do wyświetlania wszystkich lig)
    // Ale ogranicz do samych liczb, bez zbędnych pól
    const slimStand=s=>({cid:s.cid,n:s.n,p:s.p||0,w:s.w||0,d:s.d||0,l:s.l||0,gf:s.gf||0,ga:s.ga||0,pts:s.pts||0});
    sd.allStandings={};
    Object.keys(G.allStandings||{}).forEach(lvl=>{
      sd.allStandings[lvl]=(G.allStandings[lvl]||[]).map(slimStand);
    });
    sd.standing=(G.standing||[]).map(slimStand);
    sd.schedule=G.schedule||[];

    // Runtime nieistotny przy loadzie
    sd.transferMarket=(G.transferMarket||[]).slice(0,30).map(slimAI);
    sd.listedPlayers=G.listedPlayers||[];
    sd.pendingOffers=G.pendingOffers||[];

    // ── SERIALIZE + DIAGNOSTYKA ────────────────────────────────────────
    const json=J(sd);
    if(!json){if(!silent)notif(t('save_err_serialize'),'err');return;}
    const total=KB(json);

    // Log rozbicia na segmenty (tylko w devtools)
    try{console.log(
      'SAVE',total,'KB\n',
      ' players:',(sd.players?KB(J(sd.players)):'?'),'KB ('+(sd.players?sd.players.length:0)+')\n',
      ' fa:',(sd.fa?KB(J(sd.fa)):'?'),'KB ('+(sd.fa?sd.fa.length:0)+')\n',
      ' retired:',(sd.retiredPlayers?KB(J(sd.retiredPlayers)):'?'),'KB ('+(sd.retiredPlayers?sd.retiredPlayers.length:0)+')\n',
      ' standings:',KB(J(sd.allStandings)),'KB\n',
      ' schedule:',KB(J(sd.schedule||[])),'KB\n',
      ' lgHist:',KB(J(sd.lgHist||{})),'KB\n',
      ' fin:',KB(J(sd.fin||{})),'KB'
    );}catch(_){}

    // Usuń legacy klucze (stary format pa_save_*)
    for(var _k=localStorage.length-1;_k>=0;_k--){var _kn=localStorage.key(_k);if(_kn&&_kn.startsWith('pa_save_'))try{localStorage.removeItem(_kn);}catch(_){}}

    // Usuń aktualny slot żeby zwolnić miejsce
    try{localStorage.removeItem('pa'+slot);}catch(_){}

    // Sprawdź ile miejsca zostało — jeśli za mało, przytnij inne sloty do minimum
    var _lsUsed=0;
    for(var _i=0;_i<localStorage.length;_i++){var _v=localStorage.getItem(localStorage.key(_i))||'';_lsUsed+=_v.length;}
    var _needed=json.length;
    var _avail=(5*1024*1024)-_lsUsed;
    if(_avail<_needed){
      // Przytnij inne sloty pa* do slim (usuń playerPool/fa/retiredPlayers z ich JSON)
      console.warn('Za mało miejsca ('+Math.round(_avail/1024)+'KB wolne, potrzeba '+Math.round(_needed/1024)+'KB) — przycinanie innych slotów');
      for(var _s=1;_s<=3;_s++){
        if(_s===slot)continue;
        var _sd=localStorage.getItem('pa'+_s);
        if(!_sd)continue;
        try{
          var _pd=JSON.parse(_sd);
          _pd.retiredPlayers=[];_pd.fa=(_pd.fa||[]).slice(0,5);
          if(_pd.players)_pd.players=_pd.players.map(function(p){var r={};['id','name','last','pos','age','tec','pas','sht','def','phy','men','value','salary','contract','clubId','potential','status'].forEach(function(k){if(p[k]!==undefined)r[k]=p[k];});return r;});
          localStorage.setItem('pa'+_s,JSON.stringify(_pd));
        }catch(_){}
      }
    }

    // Poziom 1: przytnij pool i historię graczy AI
    if(json.length>4.2*1024*1024){
      console.warn('Zapis za duży ('+total+'KB) — tryb awaryjny L1');
      // max 40 najnowszych + legendy/rekordziści (te same co przy zwykłym zapisie wyżej) —
      // nawet w trybie awaryjnym ich link do karty nie może przestać działać
      sd.retiredPlayers=(function(){
        const all=sd.retiredPlayers||[];
        const prot=protectedRetireeIds();
        const recentIds=new Set(all.slice(-40).map(p=>p.id));
        return all.filter(p=>recentIds.has(p.id)||prot.has(p.id));
      })().map(slimAI);
      sd.fa=(G.fa||[]).slice(0,20).map(slimAI);
      // przytnij historię graczy AI do 0 wpisów
      sd.players=sd.players.map(p=>{
        if(p.clubId!==myId){const{history,...rest}=p;return rest;}
        return p;
      });
      const json2=J(sd);
      // Poziom 2: wywal pool i retired całkowicie
      if(json2.length>4.2*1024*1024){
        console.warn('Zapis za duży ('+KB(json2)+'KB) — tryb awaryjny L2');
        // Nawet tu — zbiór legend/rekordzistów jest mały (zwykle <20), więc zachowanie ich
        // nie zagraża limitowi miejsca, a bez tego ich link do karty przestałby działać na stałe
        sd.retiredPlayers=(G.retiredPlayers||[]).filter(p=>protectedRetireeIds().has(p.id)).map(slimAI);
        sd.fa=(G.fa||[]).slice(0,10).map(slimAI);
        // przytnij też historię moich graczy do 3 ostatnich sezonów
        sd.players=sd.players.map(p=>{
          if(p.clubId===myId&&p.history)return{...p,history:p.history.slice(-3)};
          return p;
        });
        const json3=J(sd);
        if(json3.length>4.5*1024*1024){
          if(!silent)notif(t('save_err_too_big'),'err');
          return;
        }
        try{localStorage.setItem('pa'+slot,json3);}
        catch(e2){if(!silent)notif(t('save_err_no_space'),'err');return;}
        if(!silent)notif(t('save_ok_emergency2').replace('{n}',KB(json3)),'info');
        return;
      }
      try{localStorage.setItem('pa'+slot,json2);}
      catch(e2){if(!silent)notif(t('save_err_no_space'),'err');return;}
      if(!silent)notif(t('save_ok_emergency').replace('{n}',KB(json2)),'info');
      return;
    }

    try{localStorage.setItem('pa'+slot,json);}
    catch(e2){
      // Quota mimo wszystko — spróbuj awaryjnie
      console.warn('QuotaExceeded przy normalnym zapisie, próba awaryjna');
      sd.retiredPlayers=[];
      sd.fa=(G.fa||[]).slice(0,10).map(slimAI);
      sd.players=sd.players.map(p=>{if(p.clubId!==myId){const{history,...r}=p;return r;}return p;});
      const jFb=J(sd);
      try{localStorage.setItem('pa'+slot,jFb);if(!silent)notif(t('save_ok_emergency').replace('{n}',KB(jFb)),'info');}
      catch(e3){if(!silent)notif(t('save_err_browser_space'),'err');}
      return;
    }
    if(!silent)notif(t('save_ok').replace('{n}',total),'ok');
  }catch(e){console.error('Save error:',e);if(!silent)notif(t('save_err_generic').replace('{msg}',e.message),'err');}
}

function loadGame(slot){try{
  const d=localStorage.getItem('pa'+slot);
  if(!d)return false;
  let parsed;
  try{
    parsed=JSON.parse(d);
  }catch(parseErr){
    // Uszkodzony zapis - usuń i poinformuj
    console.error('Uszkodzony zapis w slocie '+slot+':',parseErr);
    localStorage.removeItem('pa'+slot);
    notif(t('save_corrupted').replace('{n}',slot),'err');
    return false;
  }
  G=parsed;
  if(!G.currency)G.currency='EUR';
  CURRENT_CURRENCY=G.currency;
  if(G.myClubId)G.myClubId=parseInt(G.myClubId);
  if(G.board){
    genBoardGoals(); // regeneruj opcje z funkcjami
    if(G.board.mainGoalId&&G.board.mainOptions){
      G.board.mainGoal=G.board.mainOptions.find(x=>x.id===G.board.mainGoalId)||null;
    }
    if(G.board.optGoalId&&G.board.optOptions){
      G.board.optGoal=G.board.optOptions.find(x=>x.id===G.board.optGoalId)||null;
    }
  }
  // Restore leagues structure
  if(G.leagues&&G.leagues.length){
    ALL_CLUBS=G.leagues.flatMap(l=>l.clubs);
    // Migracja: uzupełnij pola Żywego Świata AI na starych zapisach (sprzed tej sesji)
    ALL_CLUBS.forEach(c=>{
      if(c.ai){
        if(!c.ai._newsCooldown)c.ai._newsCooldown={};
        if(!c.ai._newsCountThisWeek)c.ai._newsCountThisWeek={week:0,entries:[]};
        if(!c.ai._streakRecord)c.ai._streakRecord={win:0,loss:0};
      }
      if(c.rivalId===undefined)c.rivalId=null;
    });
    CLUBS_B=[...getLeagueClubs(G.leagues,G.myLeague||8)];
    if(!G.allStandings){G.allStandings={};G.leagues.forEach(lg=>{G.allStandings[lg.level]=lg.clubs.map(c=>({cid:c.id,n:c.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));});}
    if(!G.allSchedules){G.allSchedules={};G.leagues.forEach(lg=>{G.allSchedules[lg.level]=buildSchedule(G.myClubId,lg.clubs);});}
    G.standing=G.allStandings[G.myLeague||8]||G.standing||[];
    if(!G.schedule||!G.schedule.length)G.schedule=G.allSchedules[G.myLeague||8]||[];
    // Migracja: dogeneruj brakujące retrospektywy sezonów (season_recap_club) na zapisach
    // sprzed naprawy limitu newsów per liga, który je kasował — patrz world-board-render.js.
    backfillMissingClubRecaps();
    // Migracja: dopisz wzmiankę o mistrzostwie do retrospektyw, które w starym kodzie zgubiły
    // to zdarzenie i zostały z ogólnikowym tekstem-wypełniaczem (G.lgHist zawsze wie, kto wygrał).
    fixMissingChampionInRecaps();
    // Migracja: dogeneruj bramkarza klubom AI, które (np. przez reset składu VII Ligi sprzed
    // tej naprawy) zostały bez żadnego — patrz state.js.
    ensureClubGoalkeepers();
    // Migracja: napraw nagrody AI błędnie oznaczone dopiero co rozpoczętym sezonem (karta
    // zawodnika, zakładka Nagrody) — patrz week-progress.js.
    fixMisdatedSeasonAwards();
  } else if(G.standing&&G.standing.length){
    CLUBS_B=G.standing.map(s=>({id:s.cid,n:s.n}));ALL_CLUBS=[...CLUBS_B];
  }
  // Migration: fix OVR > potential for old saves
  G.players.forEach(p=>{
    // Set season start attrs if missing
    if(!p.seasonStartAttrs)p.seasonStartAttrs={tec:p.tec,pas:p.pas,sht:p.sht,def:p.def,phy:p.phy,men:p.men};
    if(!p.campBonusRounds)p.campBonusRounds=0;
    if(!p.trainRate){const trR=Math.random();p.trainRate=trR<0.10?(50+Math.floor(Math.random()*31))/100:trR<0.45?(81+Math.floor(Math.random()*29))/100:trR<0.85?(110+Math.floor(Math.random()*40))/100:(150+Math.floor(Math.random()*51))/100;}
    if(!p.trainMatches)p.trainMatches=0;if(p.retiring===undefined)p.retiring=false;
    if(!p.traits||!p.traits.length)p.traits=genTraits(p);
    if(!G.transferMarket)G.transferMarket=[];
    if(!G.listedPlayers)G.listedPlayers=[];
    if(!G.pendingOffers)G.pendingOffers=[];
    if(!G.trBoughtThisWindow)G.trBoughtThisWindow=0;
    if(!p.seasonStartOvr)p.seasonStartOvr=ovr(p);
    if(!p.history)p.history=[];
    if(!p.st)p.st={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0};
    const curOvr=ovr(p);
    if(!p.potential||p.potential<=curOvr){
      const _lgM=G.leagues?G.leagues.find(l=>l.clubs&&l.clubs.some(c=>c.id===p.clubId)):null;
      p.potential=calcPotential(p,_lgM?_lgM.level:G.myLeague||8);
    }
  });
  // Migracja Etap 1
  if(!G.reputation||G.reputation<30)G.reputation=30;
  if(!G.stadium)G.stadium={capacity:200,shopMult:1,adsMult:1,vipWeekly:0,gasBonus:0,modules:{},hist:[]};
  if(!G.stadium.modules)G.stadium.modules={};
  if(!G.stadium.hist)G.stadium.hist=[];
  if(!G.stadium.gasBonus)G.stadium.gasBonus=0;
  if(!G.contracts)G.contracts={};
  if(!G.trophies)G.trophies=[];
  if(!G.board)G.board={mainGoal:null,optGoal:null,goalsHistory:[]};
  // Migracja: przypisz numery zawodnikom bez numerów
  G.players.forEach(p=>{if(!p.jerseyNum||p.jerseyNum===0)assignJerseyNum(p);});
  if(!G.allTimeStats)G.allTimeStats={players:{},bestSeller:null,bestBuyer:null};
  if(!G.records)G.records={maxWinStreak:0,maxUnbeatenStreak:0,maxLoseStreak:0,unbeatenStreak:0,bestWin:null,maxGoalsSeason:0,minConcededSeason:99};
  if(!G.academy)G.academy={level:0,prospects:[],hist:[]};
  if(!G.cHist)G.cHist=[];
  if(!G.frequency)G.frequency=40;
  if(!G.winStreak)G.winStreak=0;
  if(!G.loseStreak)G.loseStreak=0;
  if(!G.retiredPlayers)G.retiredPlayers=[];
  // Migracja: uzupełnij brakujące sezony S1..G.season dla wszystkich zawodników i FA
  const _allMigr=[...G.players,...(G.fa||[]),...(G.retiredPlayers||[])];
  _allMigr.forEach(p=>{
    if(!p.status)p.status=(p.clubId===0?'freeAgent':'active');
    if(!p.formerClubs)p.formerClubs=[];
    if(!p.history)p.history=[];
    // Uzupełnij brakujące sezony od S1 do G.season
    for(let s=1;s<=G.season;s++){
      const existing=p.history.find(h=>h.season===s&&!h._current);
      if(!existing){
        const _hc=ALL_CLUBS.find(c=>c.id===p.clubId);
        const isCurr=s===G.season&&!G.seasonEnded;
        p.history.push({
          season:s,
          clubId:s===G.season?p.clubId:0,
          club:s===G.season?(_hc?_hc.n:(p.clubId===0?t('plr_free_agent'):'?')):t('plr_free_agent'),
          m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,
          ovr:ovr(p),avgRat:null,
          _placeholder:!isCurr,
          _current:isCurr
        });
      }
    }
    p.history.sort((a,b)=>a.season-b.season);
  });
  if(!G.trainingCenter)G.trainingCenter={level:0,building:null,profiles:[],profilesLocked:false};
  if(!G.scout)G.scout={level:'free',modeA:[],modeB:{active:false,roundsLeft:0},observed:[],discovered:[],clubReports:[]};
  initScout();
  if(!G.kronika)G.kronika={cooldown:0,usedThisSeason:[],flags:{}}; // v207: Kronika Klubu
  if(!G.timeline)G.timeline=[]; // v266: Oś czasu klubu — milestone'y pozaligowe
  if(!G.fanMemory)G.fanMemory={cooldown:0,recalled:[]}; // v266: Pamięć kibiców
  if(!G.worldTopTransfers)G.worldTopTransfers=[]; // Rekord transferowy świata AI — cała historia kariery
  if(!G.worldNews)G.worldNews=[]; // Żywy świat AI — newsy o klubach AI, osobno od G.news
  if(G._worldNewsNextId==null){
    // Stary zapis bez id na wpisach worldNews — dolicz od najwyższego istniejącego (jeśli są)
    const _maxWnId=G.worldNews.reduce((m,n)=>Math.max(m,n.id||0),0);
    G._worldNewsNextId=_maxWnId+1;
  }
  if(!G.repHistory)G.repHistory=[]; // Historia zmian reputacji gracza (modal ⭐ Rep)
  // v240: migracja — KUP: w fin.hist mają cost=0, koszt tylko w fin.transfers
  if(G.fin&&G.fin.hist){G.fin.hist.forEach(function(h){if(h.note&&h.note.startsWith('KUP:')&&h.cost>0)h.cost=0;});}
  if(!G.seasonBonus)G.seasonBonus=0;
  if(!G.stadium)G.stadium={capacity:200,shopMult:1,adsMult:1,vipWeekly:0};
  if(!G.fin.weeklyIncome)G.fin.weeklyIncome={sponsors:0,gadgets:0,ads:0,tv:0,tickets:0,total:0};
  // Force end camp if saved with week>2
  if(G.campActive&&G.week>2){G.campActive=false;G.campWeeks=0;}
  // FIX: pid musi być wyższy niż max istniejącego ID — inaczej nowi gracze dostaną kolizję
  if(G.players&&G.players.length){
    const _maxId=Math.max(...G.players.map(p=>p.id||0));
    if(_maxId>=pid)pid=_maxId+1;
  }
  return true;}catch(e){return false;}}
function delSave(slot){try{localStorage.removeItem('pa'+slot);}catch(e){}}
function saveInfo(slot){
  try{
    const d=localStorage.getItem('pa'+slot);
    if(!d||d.length<10)return null;
    const g=JSON.parse(d);
    if(!g||!g.myClub)return null;
    return{club:g.myClub.n,season:g.season,round:g.round,savedAt:g.savedAt};
  }catch(e){
    console.warn('Uszkodzony slot '+slot+':',e.message);
    // Auto-usuń uszkodzony zapis
    try{localStorage.removeItem('pa'+slot);}catch(_){}
    return null;
  }
}

