const TRAITS={
  wytrzymaly:  {id:'wytrzymaly', icon:'💪', name:'Wytrzymały',   desc:'Kontuzje rzadsze o 30%',            color:'#4caf50'},
  zimna_krew:  {id:'zimna_krew', icon:'🧊', name:'Zimna krew',   desc:'Forma po porażce spada o 1 zamiast 3', color:'#4fc3f7'},
  szybki_start:{id:'szybki_start',icon:'⚡',name:'Szybki start', desc:'Wysoka forma w pierwszych 5 kol.',   color:'#ffd700'},
  slaby_start: {id:'slaby_start', icon:'🌙', name:'Słaby start',  desc:'Niska forma w pierwszych 5 kol.',    color:'#9e9e9e'},
  lider:       {id:'lider',       icon:'🏆', name:'Lider',        desc:'Wygrana daje +2 formy drużynie',     color:'#ffc107'},
  zadny_kasy:  {id:'zadny_kasy',  icon:'💰', name:'Żądny kasy',  desc:'Żąda o 20% wyższej pensji',          color:'#ff9800'},
  pojety:      {id:'pojety',      icon:'🎓', name:'Pojętny',      desc:'Trening przebiega szybciej',         color:'#ce93d8'},
  lojalny:     {id:'lojalny',     icon:'❤️', name:'Lojalny',      desc:'Nie odejdzie przy wygasaniu kontraktu', color:'#ef5350'},
  twardy:      {id:'twardy',      icon:'😤', name:'Twardy',       desc:'Forma nie spada po kontuzji',        color:'#795548'},
  pewny_siebie:{id:'pewny_siebie',icon:'🦁', name:'Pewny siebie', desc:'OVR +3 przy serii 3+ wygranych',    color:'#ff7043'},
  nerwowy:     {id:'nerwowy',     icon:'😰', name:'Nerwowy',      desc:'Forma spada przy serii porażek',     color:'#78909c'},
  profesjonalista:{id:'profesjonalista',icon:'📋',name:'Profesjonalista',desc:'Forma utrzymuje się stabilniej',color:'#26c6da'},
  sprinter:    {id:'sprinter',    icon:'🏃', name:'Sprinter',     desc:'PHY efektywnie +5 w meczu',          color:'#66bb6a'},
  artrysta:    {id:'artrysta',    icon:'🎨', name:'Artysta',      desc:'TEC efektywnie +5 w meczu',          color:'#ab47bc'},
  snajper:     {id:'snajper',     icon:'🎯', name:'Snajper',      desc:'SHT efektywnie +5 w meczu (NAP/POL)',color:'#ef5350'},
  mur:         {id:'mur',         icon:'🧱', name:'Mur',          desc:'DEF efektywnie +5 w meczu (OBR/GK)', color:'#8d6e63'},
};
const TRAIT_KEYS=Object.keys(TRAITS);

function genTraits(p){
  // Każdy zawodnik dostaje 3 losowe cechy (bez powtórzeń)
  // Niektóre cechy są bardziej prawdopodobne per pozycja
  const posWeights={
    GK:  {mur:3,wytrzymaly:2,zimna_krew:2,profesjonalista:2,twardy:2},
    OBR: {mur:3,wytrzymaly:2,twardy:2,lider:2,zimna_krew:1},
    POL: {artrysta:2,lider:2,profesjonalista:2,pojety:2,pewny_siebie:2},
    NAP: {snajper:3,szybki_start:2,pewny_siebie:2,artrysta:2,sprinter:2},
  };
  const weights=posWeights[p.pos]||{};
  // Stwórz ważoną pulę
  const pool=[];
  TRAIT_KEYS.forEach(k=>{
    const w=weights[k]||1;
    for(let i=0;i<w;i++)pool.push(k);
  });
  // Wybierz 3 unikalne
  const chosen=[];
  const shuffled=[...pool].sort(()=>Math.random()-0.5);
  for(const k of shuffled){
    if(!chosen.includes(k))chosen.push(k);
    if(chosen.length===3)break;
  }
  return chosen;
}

function getTraitEffect(p, traitId){
  // Zwraca aktywny efekt cechy (modyfikatory)
  switch(traitId){
    case 'wytrzymaly':   return{injMult:0.7};
    case 'zimna_krew':   return{loseFormDrop:1};
    case 'szybki_start': return{earlyBonus:10};
    case 'slaby_start':  return{earlyPenalty:-10};
    case 'lider':        return{teamWinBonus:2};
    case 'zadny_kasy':   return{salaryMult:1.2};
    case 'pojety':       return{trainBonus:0.2};
    case 'lojalny':      return{noLeave:true};
    case 'twardy':       return{injFormKeep:true};
    case 'pewny_siebie': return{streakOvrBonus:3};
    case 'nerwowy':      return{loseStreakPenalty:-2};
    case 'profesjonalista':return{formStable:true};
    case 'sprinter':     return{phyBonus:5};
    case 'artrysta':     return{tecBonus:5};
    case 'snajper':      return{shtBonus:5};
    case 'mur':          return{defBonus:5};
    default: return{};
  }
}

function fillFinance(){if(!G)return;
  const fb=document.getElementById('fin-bal');if(fb)fb.textContent=t('fin_balance')+' '+fmt(G.budget);
  const activeTab=document.querySelector('#p-finance .tab-btn.active');
  const tabName=activeTab?activeTab.dataset.tab:'przeglad';
  if(tabName==='przeglad')renderFinPrzeglad();
  else if(tabName==='kontrakty')renderFinKontrakty();
  else if(tabName==='historia')renderFinHistoria();
  else if(tabName==='sezony')renderFinSezony();
  else renderFinPrzeglad();
  const inc=calcWeeklyIncome();
  const fi=document.getElementById('fin-inc');
  if(fi)fi.innerHTML=
    '<div class="fsec">'+t('ht_fin_income_weekly')+'</div>'+
    '<div class="frow"><span class="flbl">'+t('fin_sponsors')+'</span><span class="fpos">+'+fmt(inc.sponsors)+'</span></div>'+
    '<div class="frow"><span class="flbl">'+t('ht_fin_tickets')+'</span><span class="fpos">+'+fmt(inc.tickets)+'</span></div>'+
    '<div class="frow"><span class="flbl">'+t('fin_gadgets')+'</span><span class="fpos">+'+fmt(inc.gadgets)+'</span></div>'+
    '<div class="frow"><span class="flbl">'+t('fin_ads')+'</span><span class="fpos">+'+fmt(inc.ads)+'</span></div>'+
    (inc.tv>0?'<div class="frow"><span class="flbl">'+t('ht_fin_tv')+'</span><span class="fpos">+'+fmt(inc.tv)+'</span></div>':'')+
    (inc.vip>0?'<div class="frow"><span class="flbl">'+t('ht_fin_vip')+'</span><span class="fpos">+'+fmt(inc.vip)+'</span></div>':'')+
    '<div class="frow" style="border-top:1px solid var(--gb);margin-top:2px"><span class="flbl" style="color:var(--gb)">'+t('ht_fin_total_week')+'</span><span class="fpos" style="color:var(--gb)">+'+fmt(inc.total)+'</span></div>'+
    '<div style="color:var(--gr);font-size:var(--fs-dense);padding:4px 0">'+t('ht_fin_summary').replace('{rep}',G.reputation||10).replace('{mult}',(Math.round((G.reputation||10)/50*100)/100).toFixed(2)).replace('{freq}',G.frequency||40).replace('{cap}',(G.stadium&&G.stadium.capacity)||200)+'</div>';
  const fc=document.getElementById('fin-cost');
  if(fc)fc.innerHTML=
    '<div class="fsec">'+t('fin_hist_col_costs')+'</div>'+
    '<div class="frow"><span class="flbl">'+t('ht_fin_salary')+'</span><span class="fneg">-'+fmt(G.fin.salaries||0)+'</span></div>';
  const fs=document.getElementById('fin-sum');
  if(fs){
    const _st=[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    const _pos=_st.findIndex(s=>parseInt(s.cid)===parseInt(G.myClubId))+1;
    const _bArr=(FIN.bonus&&FIN.bonus[G.myLeague||8])||[];
    const _exp=_bArr[_pos-1]||0;
    fs.innerHTML=
      '<div class="fsec">'+t('ht_fin_balance_bonus')+'</div>'+
      '<div class="frow"><span>'+t('ht_fin_balance_bare')+'</span><span class="'+(G.budget>=0?'fpos':'fneg')+'">'+fmt(G.budget)+'</span></div>'+
      '<div class="frow"><span class="flbl">'+t('ht_fin_table_pos')+'</span><span style="color:var(--am)">'+_pos+'.</span></div>'+
      '<div class="frow"><span class="flbl">'+t('ht_fin_bonus_forecast')+'</span><span class="fpos">+'+fmt(_exp)+'</span></div>'+
      (G.seasonBonus>0?'<div class="frow"><span class="flbl">'+t('ht_fin_bonus_last')+'</span><span class="fpos">+'+fmt(G.seasonBonus)+'</span></div>':'');
  }
  const fh=document.getElementById('fin-hist');
  if(fh){
    const rows=G.fin.hist.slice(-8).reverse();
    fh.innerHTML='<div class="fsec">'+t('fin_tab_history')+'</div>'+
      (rows.length?
        '<table style="width:100%;border-collapse:collapse;font-size:var(--fs-dense)">'+
        '<thead><tr>'+
          '<th style="text-align:left;padding:4px 6px;color:var(--gr);border-bottom:1px solid var(--gl)">'+t('fin_hist_col_week')+'</th>'+
          '<th style="text-align:right;padding:4px 6px;color:var(--gb);border-bottom:1px solid var(--gl)">'+t('ht_fin_income_col')+'</th>'+
          '<th style="text-align:right;padding:4px 6px;color:var(--rd);border-bottom:1px solid var(--gl)">'+t('fin_hist_col_costs')+'</th>'+
          '<th style="text-align:right;padding:4px 6px;color:var(--am);border-bottom:1px solid var(--gl)">'+t('fin_hist_col_balance')+'</th>'+
        '</tr></thead>'+
        '<tbody>'+rows.map(h=>
          '<tr style="border-bottom:1px solid #0d1f0d">'+
            '<td style="padding:4px 6px;color:var(--gr)">T'+h.w+'</td>'+
            '<td style="text-align:right;padding:4px 6px;color:var(--gb)">'+(h.inc?'+'+fmt(h.inc):'—')+'</td>'+
            '<td style="text-align:right;padding:4px 6px;color:var(--rd)">'+(h.cost?'-'+fmt(h.cost):'—')+'</td>'+
            '<td style="text-align:right;padding:4px 6px;color:var(--am)">'+fmt(h.bal)+'</td>'+
          '</tr>'
        ).join('')+
        '</tbody></table>'
      :'<div style="color:var(--gr);padding:8px;font-size:var(--fs-dense)">'+t('ht_fin_no_history')+'</div>');
  }
}

function fillHistory(){
  if(!G)return;
  const hc=document.getElementById('hist-club');
  if(hc)hc.textContent=G.myClub.n+t('ht_club_season_suffix').replace('{n}',G.season);
  if(!G.cHist)G.cHist=[];
  if(!G.trophies)G.trophies=[];
  if(!G.allTimeStats)G.allTimeStats={players:{},bestSeller:null,bestBuyer:null};
  if(!G.records)G.records={maxWinStreak:0,maxUnbeatenStreak:0,maxLoseStreak:0,unbeatenStreak:0,bestWin:null,maxGoalsSeason:0,minConcededSeason:99};
  if(G.cHist.length===0&&G.mHist&&G.mHist.length>0){
    const seasons=[...new Set(G.mHist.map(m=>m.season).filter(Boolean))].sort((a,b)=>a-b);
    seasons.forEach(s=>{
      const mm=G.mHist.filter(m=>m.season===s&&(m.hn===G.myClub.n||m.an===G.myClub.n));
      let w=0,d=0,gf=0,ga=0;
      mm.forEach(m=>{const isH=m.hn===G.myClub.n;const mg=isH?m.hg:m.ag,og=isH?m.ag:m.hg;gf+=mg;ga+=og;if(mg>og)w++;else if(mg===og)d++;});
      if(!G.cHist.find(h=>h.season===s))
        G.cHist.push({season:s,league:LEAGUE_NAMES[G.myLeague||8],leagueLevel:G.myLeague||8,pos:'?',pts:w*3+d,gf,ga,budget:0,reputation:G.reputation||30,stadiumCap:(G.stadium&&G.stadium.capacity)||200,bonus:0,reconstructed:true});
    });
  }
  const activeTab=document.querySelector('#p-history .tab-btn.active');
  const tab=activeTab?activeTab.dataset.tab:'sezony';
  if(tab==='sezony')renderHistSezony();
  else if(tab==='rekordy')renderHistRekordy();
  else if(tab==='zawodnicy')renderHistZawodnicy();
  else if(tab==='dynastia')renderHistDynastia();
  else if(tab==='dc'){const activeBtn=document.querySelector('.dc-sub-btn.active');dcRender(activeBtn?activeBtn.id.replace('dcsub-',''):'wzrost');}
  else renderHistSezony();
}

const TROPHY_CUPS={8:{color:'#8B7355',filter:'sepia(1) hue-rotate(10deg) saturate(0.6)',label:'VII Liga'},7:{color:'#CD7F32',filter:'sepia(1) hue-rotate(15deg) saturate(1.2)',label:'VI Liga'},6:{color:'#C0C0C0',filter:'grayscale(0.3) brightness(1.4)',label:'V Liga'},5:{color:'#DAA520',filter:'sepia(1) saturate(1.5)',label:'IV Liga'},4:{color:'#FFD700',filter:'sepia(1) saturate(2) brightness(1.1)',label:'III Liga'},3:{color:'#E5E4E2',filter:'grayscale(0.1) brightness(1.8)',label:'II Liga'},2:{color:'#4FC3F7',filter:'hue-rotate(180deg) brightness(1.5) saturate(2)',label:'I Liga'},1:{color:'#FFD700',filter:'none',label:'Premier Division',crown:true}};
const SPECIAL_TROPHIES=[{id:'unbeaten_season',name:'Niepokonani',icon:'\uD83D\uDEE1',desc:'Sezon bez porazki'},{id:'strzelnica',name:'Strzelnica',icon:'\u26BD',desc:'80+ goli w sezonie'},{id:'mur',name:'Mur Obronny',icon:'\uD83E\uDDF1',desc:'0 goli straconych'},{id:'seria10',name:'Seria 10',icon:'\uD83D\uDD25',desc:'10 wygranych z rzedu'},{id:'odkrywca',name:'Odkrywca',icon:'\uD83C\uDF93',desc:'Wychowanek 20+ mecz.'},{id:'budowlaniec',name:'Budowlaniec',icon:'\uD83C\uDFD7',desc:'Stadion 10 000+ m.'}];

function histTab(tab,btn){
  document.querySelectorAll('#p-history .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['sezony','rekordy','zawodnicy','dynastia','dc'].forEach(t=>{const e=document.getElementById('hist-'+t);if(e)e.classList.remove('on');});
  const e=document.getElementById('hist-'+tab);if(e)e.classList.add('on');
  // pokaż/ukryj rząd sub-zakładek DC
  const sub=document.getElementById('hist-dc-subtabs');
  if(sub)sub.style.display=(tab==='dc')?'flex':'none';
  if(tab==='sezony')renderHistSezony();
  else if(tab==='rekordy')renderHistRekordy();
  else if(tab==='zawodnicy')renderHistZawodnicy();
  else if(tab==='dynastia')renderHistDynastia();
  else if(tab==='dc'){
    const activeBtn=document.querySelector('.dc-sub-btn.active');
    const activeName=activeBtn?activeBtn.id.replace('dcsub-',''):'wzrost';
    dcRender(activeName);
  }
}
function renderHistSezony(){
  const el=document.getElementById('hist-sezony');if(!el||!G)return;
  if(!G.cHist||!G.cHist.length){el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);padding:12px">'+t('ht_no_seasons_history')+'</div>';return;}
  el.innerHTML=G.cHist.slice().reverse().map((h,ri)=>{
    const myName=G.myClub.n;
    const oi=G.cHist.indexOf(h);
    const next=G.cHist[oi+1]; // następny sezon (chronologicznie) — awans/spadek dotyczy tego sezonu
    const isP=next&&next.leagueLevel<h.leagueLevel; // po tym sezonie awansowaliśmy (następny wyżej)
    const isR=next&&next.leagueLevel>h.leagueLevel; // po tym sezonie spadliśmy
    const pc=h.pos==='?'?'var(--gr)':h.pos<=3?'var(--am)':h.pos<=6?'var(--gb)':'var(--wh)';
    const hasTable=h.table&&h.table.length>0;
    return '<div class="hentry" style="border-color:'+(isP?'var(--gb)':isR?'var(--rd)':'var(--gl)')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
        '<div class="hentry-s">'+t('ht_season_label').replace('{n}',h.season||'?')+(h.reconstructed?' *':'')+'</div>'+
        '<div style="display:flex;gap:6px;align-items:center">'+
          '<div style="font-size:var(--fs-dense);color:var(--gr)">'+(h.league||'?')+'</div>'+
          (hasTable?'<div onclick="showSeasonTable('+oi+')" style="font-size:var(--fs-dense);color:var(--am);cursor:pointer;border:1px solid var(--am);padding:1px 4px">'+t('ht_table_btn')+'</div>':'')+
        '</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:var(--fs-dense)">'+
        '<div><div style="color:var(--gr)">'+t('ht_row_position')+'</div><div style="color:'+pc+'">'+(h.pos||'?')+(isP?' ⬆':isR?' ⬇':'')+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('ht_row_points')+'</div><div style="color:var(--wh)">'+(h.pts||0)+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('ht_row_goals')+'</div><div style="color:var(--wh)">'+(h.gf||0)+':'+(h.ga||0)+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('ht_row_matches')+'</div><div style="color:var(--wh)">'+(h.p||((h.w||0)+(h.d||0)+(h.l||0)))+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('ht_row_wins')+'</div><div style="color:var(--gb)">'+(h.w||0)+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('ht_row_draws')+'</div><div style="color:var(--gr)">'+(h.d||0)+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('ht_row_losses')+'</div><div style="color:var(--rd)">'+(h.l||0)+'</div></div>'+
        (h.budget>0?'<div><div style="color:var(--gr)">'+t('ht_row_budget')+'</div><div style="color:var(--am)">'+fmt(h.budget)+'</div></div>':'<div></div>')+
        '<div><div style="color:var(--gr)">'+t('ht_row_reputation')+'</div><div style="color:var(--wh)">'+(h.reputation||'?')+'</div></div>'+
        (h.bonus>0?'<div><div style="color:var(--gr)">'+t('ht_row_bonus')+'</div><div style="color:var(--gb)">+'+fmt(h.bonus)+'</div></div>':'<div></div>')+
      '</div>'+
      (isP?'<div style="color:var(--gb);font-size:var(--fs-dense);margin-top:4px">'+t('ht_promotion')+'</div>':isR?'<div style="color:var(--rd);font-size:var(--fs-dense);margin-top:4px">'+t('ht_relegation')+'</div>':'')+
    '</div>';
  }).join('')+(G.cHist.some(h=>h.reconstructed)?'<div style="font-size:var(--fs-dense);color:var(--gr);padding:6px">'+t('ht_reconstructed_note')+'</div>':'');
}

function showMatchDetail(mHistIdx,src){
  const arr=src==='ai'?(G._mHistAI||[]):(G.mHist||[]);
  const m=arr[mHistIdx];if(!m)return;
  // v223: zapamiętane dla _captureReturnPoint() w tactics-playercard.js — pozwala karcie
  // zawodnika wrócić do WŁAŚCIWEGO meczu po zamknięciu (jeden mechanizm powrotu)
  window._curMatchDetailIdx=mHistIdx;
  window._curMatchDetailSrc=src;
  const myName=G.myClub.n;
  // Mecz AI-AI (src='ai') nigdy nie dotyczy klubu gracza — framing "wygrana/przegrana" byłby
  // wtedy mylący, więc dla takich meczów pokazujemy neutralnie kto wygrał (gospodarz/gość).
  const involvesMe=m.hn===myName||m.an===myName;
  const isMyH=involvesMe?(m.isMyH!=null?m.isMyH:(m.hn===myName)):null;
  const hWon=m.hg>m.ag,aWon=m.ag>m.hg;
  let resClass,resTxt;
  if(involvesMe){
    const myG=isMyH?m.hg:m.ag,oppG=isMyH?m.ag:m.hg;
    const iW=myG>oppG,iL=myG<oppG;
    resClass=iW?'win':iL?'loss':'draw';
    resTxt=iW?t('ht_result_win'):iL?t('ht_result_lose'):t('ht_result_draw');
  } else {
    resClass=hWon?'win':aWon?'loss':'draw';
    resTxt=hWon?t('ht_result_home_win'):aWon?t('ht_result_away_win'):t('ht_result_draw');
  }
  // Szukaj cid drużyn żeby otworzyć kartę klubu
  const hClub=ALL_CLUBS.find(c=>c.n===m.hn);
  const aClub=ALL_CLUBS.find(c=>c.n===m.an);
  // v224: powrót do overlayu meczu po zamknięciu modalu klubu — patrz window._clubModalReturn,
  // odczytywane w closeClubModal() (club-modal.js). Ten sam wzorzec co _playerReturnTo dla karty
  // zawodnika, tylko dla zamknięcia modalu klubu.
  const _retExtra='{idx:'+mHistIdx+',src:'+(src?"'"+src+"'":'undefined')+'}';
  const hClick=hClub?'style="cursor:pointer;text-decoration:underline" onclick="window._clubModalReturn={modalId:\'md-overlay\',extra:'+_retExtra+'};document.getElementById(\'md-overlay\').classList.remove(\'open\');openClubModal('+hClub.id+')"':'';
  const aClick=aClub?'style="cursor:pointer;text-decoration:underline" onclick="window._clubModalReturn={modalId:\'md-overlay\',extra:'+_retExtra+'};document.getElementById(\'md-overlay\').classList.remove(\'open\');openClubModal('+aClub.id+')"':'';
  // Scoreboard
  let html='<div class="md-ph"><div class="md-ph-title">'+t('ht_match_details_title')+'</div><button class="md-close" onclick="document.getElementById(\'md-overlay\').classList.remove(\'open\')">✕</button></div>';
  html+='<div class="md-scoreboard">';
  html+='<div class="md-round">'+t('ht_round_season').replace('{rnd}',m.rnd).replace('{season}',m.season||'?')+(m._isCup?t('ht_cup_suffix'):'')+'</div>';
  html+='<div class="md-teams">';
  html+='<div class="md-team home'+(involvesMe&&isMyH?' my':'')+'" '+hClick+'>'+m.hn+'</div>';
  html+='<div class="md-score">'+m.hg+'–'+m.ag+'</div>';
  html+='<div class="md-team away'+(involvesMe&&!isMyH?' my':'')+'" '+aClick+'>'+m.an+'</div>';
  html+='</div>';
  html+='<div class="md-result '+resClass+'">'+resTxt+'</div>';
  html+='</div>';
  // Statystyki (jeśli dostępne)
  if(m.st&&m.st.length===4){
    const hSh=m.st[0],aSh=m.st[1],hOn=m.st[2],aOn=m.st[3];
    const totSh=hSh+aSh||1,totOn=hOn+aOn||1;
    html+='<div class="md-stats">';
    html+='<div class="md-sval home">'+hSh+'</div><div class="md-slbl">'+t('ht_shots')+'</div><div class="md-sval away">'+aSh+'</div>';
    html+='<div class="md-sbar"><div class="md-sbar-h" style="width:'+Math.round(hSh/totSh*100)+'%"></div><div class="md-sbar-a" style="width:'+Math.round(aSh/totSh*100)+'%"></div></div>';
    html+='<div class="md-sval home">'+hOn+'</div><div class="md-slbl">'+t('ht_shots_on_target')+'</div><div class="md-sval away">'+aOn+'</div>';
    html+='<div class="md-sbar"><div class="md-sbar-h" style="width:'+Math.round(hOn/totOn*100)+'%"></div><div class="md-sbar-a" style="width:'+Math.round(aOn/totOn*100)+'%"></div></div>';
    html+='</div>';
  }
  // Timeline (gole + kartki zmiksowane po minucie)
  if(m.g||m.c){
    const allPl=G.players.concat(G.retiredPlayers||[]);
    const evts=[];
    (m.g||[]).forEach(e=>{
      const sc=allPl.find(p=>p.id===e.s);
      const as=e.a?allPl.find(p=>p.id===e.a):null;
      evts.push({min:e.m,type:'goal',isH:e.h===1,sid:sc?sc.id:null,scorer:sc?sc.name.split(' ')[1]||sc.name:'?',aid:as?as.id:null,assister:as?as.name.split(' ')[1]||as.name:null});
    });
    (m.c||[]).forEach(e=>{
      const p=allPl.find(x=>x.id===e.id);
      evts.push({min:e.m,type:'card',cardType:e.t,cid:p?p.id:null,name:p?p.name.split(' ')[1]||p.name:'?'});
    });
    evts.sort((a,b)=>a.min-b.min);
    html+='<div class="md-timeline"><div class="md-tl-hdr">'+t('ht_match_timeline')+'</div>';
    evts.forEach(e=>{
      if(e.type==='goal'){
        const isMy=involvesMe&&((isMyH&&e.isH)||(!isMyH&&!e.isH));
        const scorerLink=e.sid?'<span class="md-scorer-link" onclick="document.getElementById(\'md-overlay\').classList.remove(\'open\');showById('+e.sid+')">'+e.scorer+'</span>':'<span class="md-scorer">'+e.scorer+'</span>';
        const assLink=e.aid&&e.assister?'<span class="md-assist-link" onclick="document.getElementById(\'md-overlay\').classList.remove(\'open\');showById('+e.aid+')">'+e.assister+'</span>':'<span style="color:var(--gl)">'+(e.assister||t('ht_no_assist'))+'</span>';
        html+='<div class="md-tl-ev">';
        html+='<div class="md-tl-min">'+e.min+'\'</div>';
        html+='<div class="md-tl-icon">⚽</div>';
        html+='<div class="md-tl-txt">'+scorerLink+(involvesMe?'<span class="md-tag '+(isMy?'my':'opp')+'">'+(isMy?t('ht_tag_my'):t('ht_tag_rival'))+'</span>':'');
        html+='<div class="md-assist"><span style="font-size:10px">🅰️</span>'+assLink+'</div></div>';
        html+='</div>';
      } else {
        const icon=e.cardType==='y'?'🟨':'🟥';
        const cls=e.cardType==='y'?'md-card-y':'md-card-r';
        const cardLink=e.cid?'<span class="'+cls+'" style="cursor:pointer;text-decoration:underline" onclick="document.getElementById(\'md-overlay\').classList.remove(\'open\');showById('+e.cid+')">'+e.name+'</span>':'<span class="'+cls+'">'+e.name+'</span>';
        html+='<div class="md-tl-ev"><div class="md-tl-min">'+e.min+'\'</div><div class="md-tl-icon">'+icon+'</div><div class="md-tl-txt">'+cardLink+'</div></div>';
      }
    });
    html+='</div>';
  }
  // Oceny zawodników
  if(m.r&&Object.keys(m.r).length){
    const allPl=G.players.concat(G.retiredPlayers||[]);
    const POS_ORDER=['GK','OBR','POL','NAP'];
    const entries=Object.entries(m.r).map(([id,rat])=>{
      const p=allPl.find(x=>x.id===parseInt(id));
      return p?{id:p.id,pos:p.pos,name:p.name.split(' ')[1]||p.name,rat}:null;
    }).filter(Boolean);
    entries.sort((a,b)=>(POS_ORDER.indexOf(a.pos)-POS_ORDER.indexOf(b.pos))||b.rat-a.rat);
    html+='<div class="md-ratings"><div class="md-rat-hdr">'+t('ht_ratings_title')+'</div><div class="md-rat-grid">';
    entries.forEach(e=>{
      const cls=e.rat>=8?'am':e.rat>=7?'gb':e.rat>=6?'wh':'rd';
      html+='<div class="md-rat-card" onclick="document.getElementById(\'md-overlay\').classList.remove(\'open\');showById('+e.id+')"><span><span class="md-rat-pos">'+e.pos+'</span><span class="md-rat-name">'+e.name+'</span></span><span class="md-rat-val '+cls+'">'+e.rat.toFixed(1)+'</span></div>';
    });
    html+='</div></div>';
  }
  const ov=document.getElementById('md-overlay');
  if(ov){ov.querySelector('.md-modal').innerHTML=html;ov.classList.add('open');}
}

function showSeasonTable(histIdx){
  const h=G.cHist&&G.cHist[histIdx];
  if(!h||!h.table||!h.table.length)return;
  const myId=G.myClubId;
  let html='<div style="font-size:var(--fs-meta);color:var(--am);margin-bottom:8px">'+t('ht_season_table_title').replace('{season}',h.season).replace('{league}',h.league)+'</div>'+
    '<table style="width:100%;border-collapse:collapse;font-size:var(--fs-dense)">'+
    '<thead><tr style="color:var(--gr);border-bottom:1px solid var(--gl)">'+
      '<th style="text-align:left;padding:3px 2px">#</th><th style="text-align:left;padding:3px 2px">'+t('plr_hist_col_club')+'</th>'+
      '<th style="padding:3px 4px">M</th><th style="padding:3px 4px;color:var(--gb)">W</th><th style="padding:3px 4px">R</th><th style="padding:3px 4px;color:var(--rd)">P</th>'+
      '<th style="padding:3px 4px">GF</th><th style="padding:3px 4px">GA</th><th style="padding:3px 4px;color:var(--am)">'+t('tbl_col_pts')+'</th>'+
    '</tr></thead><tbody>'+
    h.table.map(r=>{
      const isMe=parseInt(r.cid)===parseInt(myId);
      const pc=r.pos<=3?'var(--am)':r.pos<=6?'var(--gb)':'var(--wh)';
      return '<tr style="border-bottom:1px solid #0d1f0d;'+(isMe?'background:#0a1f0a':'')+'">'+
        '<td style="padding:3px 2px;color:'+pc+'">'+r.pos+'</td>'+
        '<td style="padding:3px 2px;color:'+(isMe?'var(--am)':'var(--wh)')+'">'+r.n+'</td>'+
        '<td style="padding:3px 4px;text-align:center">'+(r.p||((r.w||0)+(r.d||0)+(r.l||0)))+'</td>'+
        '<td style="padding:3px 4px;text-align:center;color:var(--gb)">'+(r.w||0)+'</td>'+
        '<td style="padding:3px 4px;text-align:center">'+(r.d||0)+'</td>'+
        '<td style="padding:3px 4px;text-align:center;color:var(--rd)">'+(r.l||0)+'</td>'+
        '<td style="padding:3px 4px;text-align:center">'+(r.gf||0)+'</td>'+
        '<td style="padding:3px 4px;text-align:center">'+(r.ga||0)+'</td>'+
        '<td style="padding:3px 4px;text-align:center;color:var(--am);font-weight:bold">'+(r.pts||0)+'</td>'+
      '</tr>';
    }).join('')+'</tbody></table>';
  // Użyj istniejącego modala lub utwórz prosty overlay
  let modal=document.getElementById('modal-season-table');
  if(!modal){
    modal=document.createElement('div');modal.id='modal-season-table';
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.onclick=function(e){if(e.target===modal)modal.remove();};
    document.body.appendChild(modal);
  }
  modal.innerHTML='<div style="background:var(--bg);border:2px solid var(--gl);padding:16px;max-width:95vw;width:380px;max-height:85vh;overflow-y:auto;position:relative">'+
    '<div onclick="document.getElementById(\'modal-season-table\').remove()" style="position:absolute;top:8px;right:12px;cursor:pointer;font-size:var(--fs-body);color:var(--gr)">✕</div>'+
    html+'</div>';
  modal.style.display='flex';
}
function renderHistRekordy(){
  const el=document.getElementById('hist-rekordy');if(!el||!G)return;
  const h=G.cHist||[];const rec=G.records||{};
  const vp=h.filter(x=>x.pos&&x.pos!=='?');
  const bp=vp.length?vp.reduce((b,x)=>x.pos<b.pos?x:b,vp[0]):null;
  const budg=h.filter(x=>x.budget>0);const bb=budg.length?budg.reduce((b,x)=>x.budget>b.budget?x:b,budg[0]):null;
  const tl=h.length?h.reduce((b,x)=>x.leagueLevel<b.leagueLevel?x:b,h[0]):null;
  const prom=h.filter((x,i)=>i>0&&x.leagueLevel<h[i-1].leagueLevel).length;
  const rel=h.filter((x,i)=>i>0&&x.leagueLevel>h[i-1].leagueLevel).length;
  const ms=h.length?Math.max(...h.map(x=>x.stadiumCap||200)):200;
  const mr=h.length?Math.max(...h.map(x=>x.reputation||30)):G.reputation||30;
  // Mecze ligowe
  const totM=h.reduce((s,x)=>s+(x.p||(x.w||0)+(x.d||0)+(x.l||0)),0);
  const totW=h.reduce((s,x)=>s+(x.w||0),0);
  const totD=h.reduce((s,x)=>s+(x.d||0),0);
  const totL=h.reduce((s,x)=>s+(x.l||0),0);
  // Mecze pucharowe z G.cupHistory
  var cupW=0,cupD=0,cupL=0;
  (G.cupHistory||[]).forEach(function(ch){
    (ch.rounds||[]).forEach(function(rnd){
      rnd.forEach(function(m){
        if(!m.done)return;
        // h i a mogą być obiektami {cid,...} lub plain id
        var hId=(m.h&&m.h.cid!=null)?m.h.cid:m.h;
        var aId=(m.a&&m.a.cid!=null)?m.a.cid:m.a;
        var isMy=(hId===G.myClubId||aId===G.myClubId);
        if(!isMy)return;
        var myG=(hId===G.myClubId)?m.hg:m.ag;
        var oppG=(hId===G.myClubId)?m.ag:m.hg;
        if(myG>oppG)cupW++; else if(myG===oppG)cupD++; else cupL++;
      });
    });
  });
  const totCupM=cupW+cupD+cupL;
  const totCupWins=(G.trophies||[]).filter(t=>t.type==='cup'&&t.place===1).length;
  const totCupFinals=(G.trophies||[]).filter(t=>t.type==='cup'&&t.place===2).length;
  function row(lbl,val,col){return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #0d1f0d;font-size:var(--fs-dense)"><span style="color:var(--gr)">'+lbl+'</span><span style="color:'+(col||'var(--wh)')+'">'+val+'</span></div>';}
  el.innerHTML=
    '<div style="font-size:var(--fs-meta);color:var(--am);margin-bottom:8px">'+t('ht_records_title')+'</div>'+
    row(t('ht_best_league'),tl?tl.league:'?','var(--gb)')+
    row(t('ht_best_position'),bp?bp.pos+'. (S'+bp.season+')':'?','var(--am)')+
    row(t('ht_promotions'),prom,'var(--gb)')+
    row(t('ht_relegations'),rel,'var(--rd)')+
    row(t('ht_max_budget'),bb?fmt(bb.budget)+' (S'+bb.season+')':'?','var(--am)')+
    row(t('ht_max_stadium'),ms+t('ht_seats_suffix'))+
    row(t('ht_max_reputation'),mr,'var(--am)')+
    row(t('ht_champions_cup'),totCupWins?totCupWins+'x 🥇':'—','var(--am)')+
    row(t('ht_cup_finalist'),totCupFinals?totCupFinals+'x 🥈':'—','var(--gr)')+
    '<div style="font-size:var(--fs-meta);color:var(--am);margin:10px 0 4px">'+t('ht_match_balance')+'</div>'+
    row(t('ht_total_matches'),totM+totCupM+(totCupM?' (liga: '+totM+' | puchar: '+totCupM+')':''))+
    row(t('ht_row_wins'),totW+cupW+(totCupM?' ('+totW+'+'+cupW+')':''),'var(--gb)')+
    row(t('ht_row_draws'),totD+cupD+(totCupM?' ('+totD+'+'+cupD+')':''),'var(--gr)')+
    row(t('ht_row_losses'),totL+cupL+(totCupM?' ('+totL+'+'+cupL+')':''),'var(--rd)')+
    '<div style="font-size:var(--fs-meta);color:var(--am);margin:10px 0 4px">'+t('ht_match_records')+'</div>'+
    row(t('ht_win_streak'),(rec.maxWinStreak||0),'var(--gb)')+
    row(t('ht_unbeaten_streak'),(rec.maxUnbeatenStreak||0),'var(--gb)')+
    row(t('ht_lose_streak'),(rec.maxLoseStreak||0),'var(--rd)')+
    row(t('ht_best_win'),rec.bestWin?rec.bestWin.myG+':'+rec.bestWin.oppG+' vs '+rec.bestWin.opp:'?','var(--gb)')+
    '<div style="font-size:var(--fs-meta);color:var(--am);margin:10px 0 4px">'+t('ht_goal_records')+'</div>'+
    (()=>{
      // Oblicz z cHist jako fallback jeśli records nie ma danych
      const ch=G.cHist||[];
      const maxGf=ch.length?Math.max(...ch.map(x=>x.gf||0)):0;
      const minGf=ch.length?Math.min(...ch.map(x=>x.gf||0)):0;
      const minGa=ch.length?Math.min(...ch.map(x=>x.ga||0)):0;
      const maxGa=ch.length?Math.max(...ch.map(x=>x.ga||0)):0;
      const maxGfS=ch.length?(ch.find(x=>(x.gf||0)===maxGf)||{}).season:'';
      const minGfS=ch.length?(ch.find(x=>(x.gf||0)===minGf)||{}).season:'';
      const minGaS=ch.length?(ch.find(x=>(x.ga||0)===minGa)||{}).season:'';
      const maxGaS=ch.length?(ch.find(x=>(x.ga||0)===maxGa)||{}).season:'';
      const rMaxGf=rec.maxGoalsSeason_s?rec.maxGoalsSeason:maxGf;
      const rMinGf=rec.minGoalsSeason_s?rec.minGoalsSeason:minGf;
      const rMinGa=rec.minConcededSeason_s?rec.minConcededSeason:minGa;
      const rMaxGa=rec.maxConcededSeason_s?rec.maxConcededSeason:maxGa;
      const sMaxGf=rec.maxGoalsSeason_s||maxGfS;
      const sMinGf=rec.minGoalsSeason_s||minGfS;
      const sMinGa=rec.minConcededSeason_s||minGaS;
      const sMaxGa=rec.maxConcededSeason_s||maxGaS;
      return row(t('ht_max_goals_season'),ch.length?(rMaxGf+(sMaxGf?' (S'+sMaxGf+')':'')):'?','var(--gb)')+
        row(t('ht_min_goals_season'),ch.length?(rMinGf+(sMinGf?' (S'+sMinGf+')':'')):'?','var(--rd)')+
        row(t('ht_min_conceded_season'),ch.length?(rMinGa+(sMinGa?' (S'+sMinGa+')':'')):'?','var(--gb)')+
        row(t('ht_max_conceded_season'),ch.length?(rMaxGa+(sMaxGa?' (S'+sMaxGa+')':'')):'?','var(--rd)');
    })();
}
function renderHistZawodnicy(){
  const el=document.getElementById('hist-zawodnicy');if(!el||!G)return;
  const players=Object.values((G.allTimeStats&&G.allTimeStats.players)||{});
  function plrLink(p){
    // Szukaj we wszystkich pulach: aktywni (wszystkie kluby), FA, pool, emeryci
    const allPool=[
      ...(G.players||[]),
      ...(G.fa||[]),
      ...(G.retiredPlayers||[])
    ];
    const found=p.id!=null
      ? allPool.find(x=>x.id===p.id)
      : allPool.find(x=>x.name===p.name);
    if(found){
      const isRetired=!!(G.retiredPlayers&&G.retiredPlayers.some(x=>x.id===found.id));
      return '<span style="color:var(--am);cursor:pointer;text-decoration:underline" onclick="showById('+found.id+')">'+p.name+'</span>'
        +(isRetired?' <span style="font-size:var(--fs-meta);color:var(--gr);background:#1a1a1a;border:1px solid var(--gr);padding:0 3px">'+t('ht_retired_tag')+'</span>':'');
    }
    // Naprawdę brak obiektu (wpisy bez id ze starszych wersji) — szukaj jeszcze po nazwie w players
    const byName=(G.players||[]).find(x=>x.name===p.name);
    if(byName){
      return '<span style="color:var(--am);cursor:pointer;text-decoration:underline" onclick="showById('+byName.id+')">'+p.name+'</span>';
    }
    return '<span style="color:var(--am);opacity:0.5">'+p.name+'</span>';
  }
  function top5(key,icon){
    const s=players.filter(p=>p[key]>0).sort((a,b)=>b[key]-a[key]).slice(0,5);
    if(!s.length)return '<div style="color:var(--gr);font-size:var(--fs-dense)">'+t('ht_no_data')+'</div>';
    return s.map((p,i)=>'<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #0d1f0d;font-size:var(--fs-dense)"><span><span style="color:var(--gr)">'+(i+1)+'. </span>'+plrLink(p)+'</span><span style="color:var(--am)">'+p[key]+' '+icon+'</span></div>').join('');
  }
  const at=G.allTimeStats||{};
  el.innerHTML=
    '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin-bottom:8px;border-left:3px solid var(--am);padding-left:8px">'+t('ht_top_scorer')+'</div>'+top5('goals',t('ht_goals_suffix'))+
    '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin:12px 0 8px;border-left:3px solid var(--am);padding-left:8px">'+t('ht_top_assister')+'</div>'+top5('assists',t('ht_assists_suffix'))+
    '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin:12px 0 8px;border-left:3px solid var(--am);padding-left:8px">'+t('ht_most_matches')+'</div>'+top5('matches',t('ht_matches_suffix'))+
    '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin:12px 0 8px;border-left:3px solid var(--am);padding-left:8px">'+t('ht_transfer_records')+'</div>'+
    (at.bestSeller?'<div style="font-size:var(--fs-dense);padding:5px 0;border-bottom:1px solid #0d1f0d"><span style="color:var(--gr)">'+t('ht_sold_label')+'</span>'+plrLink({id:at.bestSeller.id,name:at.bestSeller.name})+' <span style="color:var(--gb)">'+fmt(at.bestSeller.val)+'</span> <span style="color:var(--gr)">(S'+at.bestSeller.season+')</span></div>':'<div style="color:var(--gr);font-size:var(--fs-dense)">'+t('ht_no_data')+'</div>')+
    (at.bestBuyer?'<div style="font-size:var(--fs-dense);padding:5px 0"><span style="color:var(--gr)">'+t('ht_bought_label')+'</span>'+plrLink({id:at.bestBuyer.id,name:at.bestBuyer.name})+' <span style="color:var(--rd)">'+fmt(at.bestBuyer.val)+'</span> <span style="color:var(--gr)">(S'+at.bestBuyer.season+')</span></div>':'');
}
function renderHistDynastia(){
  const el=document.getElementById('hist-dynastia');if(!el||!G)return;
  const tr=G.trophies||[];
  const lt=tr.filter(t=>t.type==='league');
  const ct=tr.filter(t=>t.type==='cup');
  const ctWon=ct.filter(t=>t.place===1);
  const ctFin=ct.filter(t=>t.place===2);
  const cHist=(G.cHist||[]).slice().sort((a,b)=>b.season-a.season);
  const rec=G.records||{};
  const allStats=G.allTimeStats||{};
  const maxRep=cHist.length?Math.max(...cHist.map(h=>h.reputation||0)):G.reputation||30;
  const maxStad=cHist.length?Math.max(...cHist.map(h=>h.stadiumCap||200)):((G.stadium&&G.stadium.capacity)||200);
  const totalSeasons=cHist.length||G.season||1;
  const LNAMES=_leagueNamesMap();

  // GABLOTA TROFEOW
  let html='<div class="dyn-hero">';
  html+='<div class="dyn-clubname">'+(G.myClub?G.myClub.n.toUpperCase():t('ht_fallback_myclub'))+'</div>';
  html+='<div class="dyn-sub">'+t('ht_seasons_history_pl').replace('{n}',totalSeasons).replace('{suffix}',totalSeasons===1?'':'\u00f3w').replace('{league}',LNAMES[G.myLeague||8]||t('league_fallback'))+'</div>';
  html+='</div>';
  const hasAnyTrophy=lt.length>0||ctWon.length>0||ctFin.length>0;
  html+='<div style="border-bottom:2px solid var(--gl)">';
  html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);padding:8px 12px 5px;letter-spacing:1px;background:#0d1a0d">'+t('ht_trophy_case')+'</div>';
  if(!hasAnyTrophy){
    html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:10px 12px 12px">'+t('ht_no_trophies')+'</div>';
  } else {
    if(lt.length>0){
      [1,2,3,4,5,6,7,8].forEach(function(lvl){
        const won=lt.filter(function(t){return t.league===lvl||t.league===String(lvl);});
        if(!won.length)return;
        const cup=TROPHY_CUPS[lvl]||{color:'var(--am)',label:t('league_fallback'),filter:''};
        html+='<div style="display:flex;align-items:center;gap:10px;padding:7px 12px;border-bottom:1px solid #0d1f0d">';
        html+='<div style="display:flex;gap:3px;flex-shrink:0">';
        won.forEach(function(){html+='<span style="font-size:22px;display:inline-block;filter:'+cup.filter+'">&#127942;</span>';});
        html+='</div>';
        html+='<div style="flex:1">';
        html+='<div style="font-weight:700;font-size:var(--fs-h3);color:'+cup.color+';margin-bottom:3px">'+(LNAMES[lvl]||cup.label).toUpperCase()+'</div>';
        html+='<div style="font-size:var(--fs-dense);color:var(--gr)">'+won.map(function(t){return 'S'+t.season;}).join(' \u2022 ')+'</div>';
        html+='</div>';
        if(won.length>1)html+='<div style="font-weight:700;font-size:var(--fs-h1);color:'+cup.color+'">\u00d7'+won.length+'</div>';
        html+='</div>';
      });
    }
    if(ctWon.length>0||ctFin.length>0){
      html+='<div style="display:flex;align-items:center;gap:10px;padding:7px 12px">';
      html+='<div style="display:flex;gap:3px;flex-shrink:0">';
      ctWon.forEach(function(){html+='<span style="font-size:22px">&#127942;</span>';});
      ctFin.forEach(function(){html+='<span style="font-size:22px;filter:grayscale(0.5) brightness(1.3)">&#129352;</span>';});
      html+='</div>';
      html+='<div style="flex:1">';
      html+='<div style="font-weight:700;font-size:var(--fs-h3);color:var(--am);margin-bottom:3px">'+t('ht_champions_cup_title')+'</div>';
      html+='<div style="font-size:var(--fs-dense);color:var(--gr)">';
      if(ctWon.length>0)html+=t('ht_won_label')+ctWon.map(function(t){return 'S'+t.season;}).join(' \u2022 ');
      if(ctFin.length>0)html+=(ctWon.length?' \u2022 ':'')+t('ht_finals_label')+ctFin.map(function(t){return 'S'+t.season;}).join(' \u2022 ');
      html+='</div></div>';
      if(ctWon.length>1)html+='<div style="font-weight:700;font-size:var(--fs-h1);color:var(--am)">\u00d7'+ctWon.length+'</div>';
      html+='</div>';
    }
  }
  html+='</div>';
    // ── OŚ CZASU ──
  html+='<div class="dyn-tl">';
  html+='<div class="dyn-tl-hdr">'+t('ht_timeline_header')+'</div>';

  if(!cHist.length){
    html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:8px 0">'+t('ht_no_seasons_history')+'</div>';
  } else {
    cHist.forEach(function(h,i){
      const isLast=i===cHist.length-1;
      const pos=h.pos;
      const leagueLvl=h.leagueLevel||8;
      const lname=(LNAMES[leagueLvl]||h.league||t('league_fallback')).replace(' '+t('league_fallback'),' L.').replace('Premier Division','Premier Div.');
      // Sprawdź awans/spadek względem poprzedniego sezonu
      const prev=cHist[i+1]; // poprzedni (cHist jest malejący)
      const next=cHist[i-1]; // następny sezon (wyższy numer)
      const wasPromo=next&&(next.leagueLevel||8)<leagueLvl; // następny sezon był w wyższej lidze → awans w tym
      const wasRel=next&&(next.leagueLevel||8)>leagueLvl;   // następny sezon był w niższej lidze → spadek w tym
      const isTitle=pos===1&&lt.some(t=>t.season===h.season);
      const isCup=ctWon.some(t=>t.season===h.season);
      const isCupFin=ctFin.some(t=>t.season===h.season);

      // Typ punktu na osi
      let dotType='normal', dotSymbol=String(pos||'?');
      if(isTitle){dotType='title';dotSymbol='\u2605';}
      else if(wasPromo){dotType='promo';dotSymbol='\u2191';}
      else if(wasRel){dotType='rel';dotSymbol='\u2193';}
      else if(pos===1){dotType='title';dotSymbol='\u2605';}
      else if(isCup){dotType='cup';dotSymbol='\u25ce';}

      // Tekst wyniku
      let resultClass='normal', resultText='';
      if(isTitle)         {resultClass='gold';resultText=t('ht_league_title_won');}
      else if(wasPromo)   {resultClass='promo';const nl=LNAMES[(next.leagueLevel||8)];resultText=t('ht_promoted_to').replace('{league}',(nl||t('ht_fallback_higher')).replace(' Liga',' L.'));}
      else if(wasRel)     {resultClass='rel';const nl=LNAMES[(next.leagueLevel||8)];resultText=t('ht_relegated_to').replace('{league}',(nl||t('ht_fallback_lower')).replace(' Liga',' L.'));}
      else if(pos===2)    {resultClass='normal';resultText=t('ht_position_runner_up');}
      else if(pos<=3)     {resultClass='normal';resultText=t('ht_position_podium').replace('{pos}',pos);}
      else                {resultClass='normal';resultText=t('ht_position_plain').replace('{pos}',pos);}

      // Detail
      const detail=t('ht_pts_detail').replace('{pts}',h.pts||'?').replace('{gf}',h.gf).replace('{ga}',h.ga).replace('{repPart}',h.reputation?t('ht_rep_detail').replace('{rep}',h.reputation):'');

      html+='<div class="dyn-item">';
      html+='<div class="dyn-dot-col">';
      html+='<div class="dyn-dot '+dotType+'">'+dotSymbol+'</div>';
      if(!isLast)html+='<div class="dyn-line"></div>';
      html+='</div>';
      html+='<div class="dyn-content">';
      html+='<div class="dyn-s-hdr"><span class="dyn-s-num">S'+h.season+'</span><span class="dyn-s-league">'+lname+'</span></div>';
      html+='<div class="dyn-s-result '+resultClass+'">'+resultText+'</div>';
      html+='<div class="dyn-s-detail">'+detail+'</div>';
      if(isCup||isCupFin||isTitle){
        html+='<div class="dyn-badges">';
        if(isCup)html+='<span class="dyn-badge cup">'+t('ht_badge_cup')+'</span>';
        if(isCupFin)html+='<span class="dyn-badge fin">'+t('ht_badge_final')+'</span>';
        if(rec.maxWinStreak>=8&&h.season===cHist[0].season)html+='<span class="dyn-badge rec">'+t('ht_badge_streak').replace('{n}',rec.maxWinStreak)+'</span>';
        html+='</div>';
      }
      // Milestone'y pozaligowe tego sezonu (Sesja 2: stadion, akademia, transfery, Kronika)
      var _tlSeason=(G.timeline||[]).filter(function(tl){return tl.season===h.season;}).sort(function(a,b){return (a.week||0)-(b.week||0);});
      if(_tlSeason.length){
        html+='<div class="dyn-milestones" style="margin-top:5px">';
        _tlSeason.forEach(function(tl){
          var _clickable=tl.pid!=null;
          var _style='font-size:var(--fs-dense);color:'+(_clickable?'var(--am)':'var(--gr)')+';padding:2px 0;display:flex;gap:5px'+(_clickable?';cursor:pointer':'');
          var _click=_clickable?' onclick="showById('+tl.pid+')"':'';
          html+='<div style="'+_style+'"'+_click+'><span>'+tl.icon+'</span><span>'+tl.label+(_clickable?' ↗':'')+'</span></div>';
        });
        html+='</div>';
      }
      html+='</div></div>';
    });
  }

  html+='</div>'; // dyn-tl
  el.innerHTML=html;
}

// ════════════════════════════════════════════════════════
//  DATA CENTER — funkcje renderujące
// ════════════════════════════════════════════════════════
