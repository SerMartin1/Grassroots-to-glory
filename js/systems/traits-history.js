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
  const fb=document.getElementById('fin-bal');if(fb)fb.textContent='STAN KONTA: '+fmt(G.budget);
  const activeTab=document.querySelector('#p-finance .tab-btn.active');
  const tabName=activeTab?activeTab.textContent.trim():'PRZEGLĄD';
  if(tabName==='PRZEGLĄD')renderFinPrzeglad();
  else if(tabName==='KONTRAKTY')renderFinKontrakty();
  else if(tabName==='HISTORIA')renderFinHistoria();
  else if(tabName==='SEZONY')renderFinSezony();
  else renderFinPrzeglad();
  const inc=calcWeeklyIncome();
  const fi=document.getElementById('fin-inc');
  if(fi)fi.innerHTML=
    '<div class="fsec">PRZYCHODY TYGODNIOWE</div>'+
    '<div class="frow"><span class="flbl">Sponsorzy</span><span class="fpos">+'+fmt(inc.sponsors)+'</span></div>'+
    '<div class="frow"><span class="flbl">Bilety</span><span class="fpos">+'+fmt(inc.tickets)+'</span></div>'+
    '<div class="frow"><span class="flbl">Gadżety</span><span class="fpos">+'+fmt(inc.gadgets)+'</span></div>'+
    '<div class="frow"><span class="flbl">Reklamy</span><span class="fpos">+'+fmt(inc.ads)+'</span></div>'+
    (inc.tv>0?'<div class="frow"><span class="flbl">Telewizja</span><span class="fpos">+'+fmt(inc.tv)+'</span></div>':'')+
    (inc.vip>0?'<div class="frow"><span class="flbl">Loże VIP</span><span class="fpos">+'+fmt(inc.vip)+'</span></div>':'')+
    '<div class="frow" style="border-top:1px solid var(--gb);margin-top:2px"><span class="flbl" style="color:var(--gb)">RAZEM/TYG</span><span class="fpos" style="color:var(--gb)">+'+fmt(inc.total)+'</span></div>'+
    '<div style="color:var(--gr);font-size:var(--fs-dense);padding:4px 0">⭐ Rep: '+(G.reputation||10)+' • Mn: ×'+(Math.round((G.reputation||10)/50*100)/100).toFixed(2)+' • Frekw: '+(G.frequency||40)+'% • Stadion: '+((G.stadium&&G.stadium.capacity)||200)+' m.</div>';
  const fc=document.getElementById('fin-cost');
  if(fc)fc.innerHTML=
    '<div class="fsec">KOSZTY</div>'+
    '<div class="frow"><span class="flbl">Pensje (co 4 tyg.)</span><span class="fneg">-'+fmt(G.fin.salaries||0)+'</span></div>';
  const fs=document.getElementById('fin-sum');
  if(fs){
    const _st=[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    const _pos=_st.findIndex(s=>parseInt(s.cid)===parseInt(G.myClubId))+1;
    const _bArr=(FIN.bonus&&FIN.bonus[G.myLeague||8])||[];
    const _exp=_bArr[_pos-1]||0;
    fs.innerHTML=
      '<div class="fsec">BILANS I PREMIA</div>'+
      '<div class="frow"><span>STAN KONTA</span><span class="'+(G.budget>=0?'fpos':'fneg')+'">'+fmt(G.budget)+'</span></div>'+
      '<div class="frow"><span class="flbl">Miejsce w tabeli</span><span style="color:var(--am)">'+_pos+'.</span></div>'+
      '<div class="frow"><span class="flbl">Premia prognozowana</span><span class="fpos">+'+fmt(_exp)+'</span></div>'+
      (G.seasonBonus>0?'<div class="frow"><span class="flbl">Ostatnia premia</span><span class="fpos">+'+fmt(G.seasonBonus)+'</span></div>':'');
  }
  const fh=document.getElementById('fin-hist');
  if(fh){
    const rows=G.fin.hist.slice(-8).reverse();
    fh.innerHTML='<div class="fsec">HISTORIA</div>'+
      (rows.length?
        '<table style="width:100%;border-collapse:collapse;font-size:var(--fs-dense)">'+
        '<thead><tr>'+
          '<th style="text-align:left;padding:4px 6px;color:var(--gr);border-bottom:1px solid var(--gl)">TYG</th>'+
          '<th style="text-align:right;padding:4px 6px;color:var(--gb);border-bottom:1px solid var(--gl)">PRZYCHÓD</th>'+
          '<th style="text-align:right;padding:4px 6px;color:var(--rd);border-bottom:1px solid var(--gl)">KOSZTY</th>'+
          '<th style="text-align:right;padding:4px 6px;color:var(--am);border-bottom:1px solid var(--gl)">STAN</th>'+
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
      :'<div style="color:var(--gr);padding:8px;font-size:var(--fs-dense)">Brak historii</div>');
  }
}

function fillHistory(){
  if(!G)return;
  const hc=document.getElementById('hist-club');
  if(hc)hc.textContent=G.myClub.n+' \u2022 Sezon '+G.season;
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
  const tab=activeTab?activeTab.textContent.trim():'SEZONY';
  if(tab==='SEZONY')renderHistSezony();
  else if(tab==='REKORDY')renderHistRekordy();
  else if(tab==='ZAWODNICY')renderHistZawodnicy();
  else if(tab==='TROFEA')renderHistDynastia();
  else if(tab==='📊 DATA'){const activeBtn=document.querySelector('.dc-sub-btn.active');dcRender(activeBtn?activeBtn.id.replace('dcsub-',''):'wzrost');}
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
  if(!G.cHist||!G.cHist.length){el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);padding:12px">Historia pojawi sie po zakonczeniu pierwszego sezonu.</div>';return;}
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
        '<div class="hentry-s">SEZON '+(h.season||'?')+(h.reconstructed?' *':'')+'</div>'+
        '<div style="display:flex;gap:6px;align-items:center">'+
          '<div style="font-size:var(--fs-dense);color:var(--gr)">'+(h.league||'?')+'</div>'+
          (hasTable?'<div onclick="showSeasonTable('+oi+')" style="font-size:var(--fs-dense);color:var(--am);cursor:pointer;border:1px solid var(--am);padding:1px 4px">TABELA</div>':'')+
        '</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:var(--fs-dense)">'+
        '<div><div style="color:var(--gr)">Miejsce</div><div style="color:'+pc+'">'+(h.pos||'?')+(isP?' ⬆':isR?' ⬇':'')+'</div></div>'+
        '<div><div style="color:var(--gr)">Punkty</div><div style="color:var(--wh)">'+(h.pts||0)+'</div></div>'+
        '<div><div style="color:var(--gr)">Bramki</div><div style="color:var(--wh)">'+(h.gf||0)+':'+(h.ga||0)+'</div></div>'+
        '<div><div style="color:var(--gr)">Mecze</div><div style="color:var(--wh)">'+(h.p||((h.w||0)+(h.d||0)+(h.l||0)))+'</div></div>'+
        '<div><div style="color:var(--gr)">Wygrane</div><div style="color:var(--gb)">'+(h.w||0)+'</div></div>'+
        '<div><div style="color:var(--gr)">Remisy</div><div style="color:var(--gr)">'+(h.d||0)+'</div></div>'+
        '<div><div style="color:var(--gr)">Porażki</div><div style="color:var(--rd)">'+(h.l||0)+'</div></div>'+
        (h.budget>0?'<div><div style="color:var(--gr)">Budzet</div><div style="color:var(--am)">'+fmt(h.budget)+'</div></div>':'<div></div>')+
        '<div><div style="color:var(--gr)">Reputacja</div><div style="color:var(--wh)">'+(h.reputation||'?')+'</div></div>'+
        (h.bonus>0?'<div><div style="color:var(--gr)">Premia</div><div style="color:var(--gb)">+'+fmt(h.bonus)+'</div></div>':'<div></div>')+
      '</div>'+
      (isP?'<div style="color:var(--gb);font-size:var(--fs-dense);margin-top:4px">⬆ AWANS</div>':isR?'<div style="color:var(--rd);font-size:var(--fs-dense);margin-top:4px">⬇ SPADEK</div>':'')+
    '</div>';
  }).join('')+(G.cHist.some(h=>h.reconstructed)?'<div style="font-size:var(--fs-dense);color:var(--gr);padding:6px">* dane zrekonstruowane</div>':'');
}

function showMatchDetail(mHistIdx){
  const m=G.mHist&&G.mHist[mHistIdx];if(!m)return;
  const myName=G.myClub.n;
  const isMyH=m.isMyH!=null?m.isMyH:(m.hn===myName);
  const myG=isMyH?m.hg:m.ag,oppG=isMyH?m.ag:m.hg;
  const iW=myG>oppG,iL=myG<oppG;
  const resClass=iW?'win':iL?'loss':'draw';
  const resTxt=iW?'★ WYGRANA':iL?'✕ PRZEGRANA':'— REMIS';
  // Szukaj cid drużyn żeby otworzyć kartę klubu
  const hClub=ALL_CLUBS.find(c=>c.n===m.hn);
  const aClub=ALL_CLUBS.find(c=>c.n===m.an);
  const hClick=hClub?'style="cursor:pointer;text-decoration:underline" onclick="window._matchDetailReturn='+mHistIdx+';document.getElementById(\'md-overlay\').classList.remove(\'open\');setTimeout(()=>openClubModal('+hClub.id+'),60)"':'';
  const aClick=aClub?'style="cursor:pointer;text-decoration:underline" onclick="window._matchDetailReturn='+mHistIdx+';document.getElementById(\'md-overlay\').classList.remove(\'open\');setTimeout(()=>openClubModal('+aClub.id+'),60)"':'';
  // Scoreboard
  let html='<div class="md-ph"><div class="md-ph-title">⚽ SZCZEGÓŁY MECZU</div><button class="md-close" onclick="document.getElementById(\'md-overlay\').classList.remove(\'open\')">✕</button></div>';
  html+='<div class="md-scoreboard">';
  html+='<div class="md-round">KOLEJKA '+m.rnd+' · SEZON '+(m.season||'?')+(m._isCup?' · 🏆 PUCHAR':'')+'</div>';
  html+='<div class="md-teams">';
  html+='<div class="md-team home'+(isMyH?' my':'')+'" '+hClick+'>'+m.hn+'</div>';
  html+='<div class="md-score">'+m.hg+'–'+m.ag+'</div>';
  html+='<div class="md-team away'+(!isMyH?' my':'')+'" '+aClick+'>'+m.an+'</div>';
  html+='</div>';
  html+='<div class="md-result '+resClass+'">'+resTxt+'</div>';
  html+='</div>';
  // Statystyki (jeśli dostępne)
  if(m.st&&m.st.length===4){
    const hSh=m.st[0],aSh=m.st[1],hOn=m.st[2],aOn=m.st[3];
    const totSh=hSh+aSh||1,totOn=hOn+aOn||1;
    html+='<div class="md-stats">';
    html+='<div class="md-sval home">'+hSh+'</div><div class="md-slbl">strzały</div><div class="md-sval away">'+aSh+'</div>';
    html+='<div class="md-sbar"><div class="md-sbar-h" style="width:'+Math.round(hSh/totSh*100)+'%"></div><div class="md-sbar-a" style="width:'+Math.round(aSh/totSh*100)+'%"></div></div>';
    html+='<div class="md-sval home">'+hOn+'</div><div class="md-slbl">celne</div><div class="md-sval away">'+aOn+'</div>';
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
    html+='<div class="md-timeline"><div class="md-tl-hdr">PRZEBIEG MECZU</div>';
    evts.forEach(e=>{
      if(e.type==='goal'){
        const isMy=(isMyH&&e.isH)||(!isMyH&&!e.isH);
        const scorerLink=e.sid?'<span class="md-scorer-link" onclick="window._matchDetailReturn='+mHistIdx+';document.getElementById(\'md-overlay\').classList.remove(\'open\');showById('+e.sid+')">'+e.scorer+'</span>':'<span class="md-scorer">'+e.scorer+'</span>';
        const assLink=e.aid&&e.assister?'<span class="md-assist-link" onclick="window._matchDetailReturn='+mHistIdx+';document.getElementById(\'md-overlay\').classList.remove(\'open\');showById('+e.aid+')">'+e.assister+'</span>':'<span style="color:var(--gl)">'+(e.assister||'bez asysty')+'</span>';
        html+='<div class="md-tl-ev">';
        html+='<div class="md-tl-min">'+e.min+'\'</div>';
        html+='<div class="md-tl-icon">⚽</div>';
        html+='<div class="md-tl-txt">'+scorerLink+'<span class="md-tag '+(isMy?'my':'opp')+'">'+(isMy?'MY':'RYWAL')+'</span>';
        html+='<div class="md-assist"><span style="font-size:10px">🅰️</span>'+assLink+'</div></div>';
        html+='</div>';
      } else {
        const icon=e.cardType==='y'?'🟨':'🟥';
        const cls=e.cardType==='y'?'md-card-y':'md-card-r';
        const cardLink=e.cid?'<span class="'+cls+'" style="cursor:pointer;text-decoration:underline" onclick="window._matchDetailReturn='+mHistIdx+';document.getElementById(\'md-overlay\').classList.remove(\'open\');showById('+e.cid+')">'+e.name+'</span>':'<span class="'+cls+'">'+e.name+'</span>';
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
    html+='<div class="md-ratings"><div class="md-rat-hdr">OCENY ZAWODNIKÓW</div><div class="md-rat-grid">';
    entries.forEach(e=>{
      const cls=e.rat>=8?'am':e.rat>=7?'gb':e.rat>=6?'wh':'rd';
      html+='<div class="md-rat-card" onclick="window._matchDetailReturn='+mHistIdx+';document.getElementById(\'md-overlay\').classList.remove(\'open\');showById('+e.id+')"><span><span class="md-rat-pos">'+e.pos+'</span><span class="md-rat-name">'+e.name+'</span></span><span class="md-rat-val '+cls+'">'+e.rat.toFixed(1)+'</span></div>';
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
  let html='<div style="font-size:var(--fs-meta);color:var(--am);margin-bottom:8px">TABELA — SEZON '+h.season+' — '+h.league+'</div>'+
    '<table style="width:100%;border-collapse:collapse;font-size:var(--fs-dense)">'+
    '<thead><tr style="color:var(--gr);border-bottom:1px solid var(--gl)">'+
      '<th style="text-align:left;padding:3px 2px">#</th><th style="text-align:left;padding:3px 2px">KLUB</th>'+
      '<th style="padding:3px 4px">M</th><th style="padding:3px 4px;color:var(--gb)">W</th><th style="padding:3px 4px">R</th><th style="padding:3px 4px;color:var(--rd)">P</th>'+
      '<th style="padding:3px 4px">GF</th><th style="padding:3px 4px">GA</th><th style="padding:3px 4px;color:var(--am)">PKT</th>'+
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
    '<div style="font-size:var(--fs-meta);color:var(--am);margin-bottom:8px">REKORDY DRUZYNY</div>'+
    row('Najlepsza liga',tl?tl.league:'?','var(--gb)')+
    row('Najlepsze miejsce',bp?bp.pos+'. (S'+bp.season+')':'?','var(--am)')+
    row('Awanse',prom,'var(--gb)')+
    row('Spadki',rel,'var(--rd)')+
    row('Max budzet',bb?fmt(bb.budget)+' (S'+bb.season+')':'?','var(--am)')+
    row('Max stadion',ms+' miejsc')+
    row('Max reputacja',mr,'var(--am)')+
    row('Puchar Mistrzowski',totCupWins?totCupWins+'x 🥇':'—','var(--am)')+
    row('Finalista Pucharu',totCupFinals?totCupFinals+'x 🥈':'—','var(--gr)')+
    '<div style="font-size:var(--fs-meta);color:var(--am);margin:10px 0 4px">BILANS MECZOWY</div>'+
    row('Razem meczów',totM+totCupM+(totCupM?' (liga: '+totM+' | puchar: '+totCupM+')':''))+
    row('Wygrane',totW+cupW+(totCupM?' ('+totW+'+'+cupW+')':''),'var(--gb)')+
    row('Remisy',totD+cupD+(totCupM?' ('+totD+'+'+cupD+')':''),'var(--gr)')+
    row('Porażki',totL+cupL+(totCupM?' ('+totL+'+'+cupL+')':''),'var(--rd)')+
    '<div style="font-size:var(--fs-meta);color:var(--am);margin:10px 0 4px">REKORDY MECZOWE</div>'+
    row('Seria wygranych',(rec.maxWinStreak||0),'var(--gb)')+
    row('Seria bez porazki',(rec.maxUnbeatenStreak||0),'var(--gb)')+
    row('Seria porazek',(rec.maxLoseStreak||0),'var(--rd)')+
    row('Najwyzsza wygrana',rec.bestWin?rec.bestWin.myG+':'+rec.bestWin.oppG+' vs '+rec.bestWin.opp:'?','var(--gb)')+
    '<div style="font-size:var(--fs-meta);color:var(--am);margin:10px 0 4px">REKORDY BRAMKOWE</div>'+
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
      return row('Max goli w sez.',ch.length?(rMaxGf+(sMaxGf?' (S'+sMaxGf+')':'')):'?','var(--gb)')+
        row('Min goli w sez.',ch.length?(rMinGf+(sMinGf?' (S'+sMinGf+')':'')):'?','var(--rd)')+
        row('Min stracone w sez.',ch.length?(rMinGa+(sMinGa?' (S'+sMinGa+')':'')):'?','var(--gb)')+
        row('Max stracone w sez.',ch.length?(rMaxGa+(sMaxGa?' (S'+sMaxGa+')':'')):'?','var(--rd)');
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
        +(isRetired?' <span style="font-size:var(--fs-meta);color:var(--gr);background:#1a1a1a;border:1px solid var(--gr);padding:0 3px">EMERYT</span>':'');
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
    if(!s.length)return '<div style="color:var(--gr);font-size:var(--fs-dense)">Brak danych</div>';
    return s.map((p,i)=>'<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #0d1f0d;font-size:var(--fs-dense)"><span><span style="color:var(--gr)">'+(i+1)+'. </span>'+plrLink(p)+'</span><span style="color:var(--am)">'+p[key]+' '+icon+'</span></div>').join('');
  }
  const at=G.allTimeStats||{};
  el.innerHTML=
    '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin-bottom:8px;border-left:3px solid var(--am);padding-left:8px">KRÓL STRZELCÓW</div>'+top5('goals','goli')+
    '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin:12px 0 8px;border-left:3px solid var(--am);padding-left:8px">KRÓL ASYSTENTÓW</div>'+top5('assists','asyst')+
    '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin:12px 0 8px;border-left:3px solid var(--am);padding-left:8px">NAJWIĘCEJ MECZÓW</div>'+top5('matches','mecz.')+
    '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin:12px 0 8px;border-left:3px solid var(--am);padding-left:8px">REKORDY TRANSFEROWE</div>'+
    (at.bestSeller?'<div style="font-size:var(--fs-dense);padding:5px 0;border-bottom:1px solid #0d1f0d"><span style="color:var(--gr)">Sprzedany: </span>'+plrLink({id:at.bestSeller.id,name:at.bestSeller.name})+' <span style="color:var(--gb)">'+fmt(at.bestSeller.val)+'</span> <span style="color:var(--gr)">(S'+at.bestSeller.season+')</span></div>':'<div style="color:var(--gr);font-size:var(--fs-dense)">Brak danych</div>')+
    (at.bestBuyer?'<div style="font-size:var(--fs-dense);padding:5px 0"><span style="color:var(--gr)">Kupiony: </span>'+plrLink({id:at.bestBuyer.id,name:at.bestBuyer.name})+' <span style="color:var(--rd)">'+fmt(at.bestBuyer.val)+'</span> <span style="color:var(--gr)">(S'+at.bestBuyer.season+')</span></div>':'');
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
  html+='<div class="dyn-clubname">'+(G.myClub?G.myClub.n.toUpperCase():'MOJ KLUB')+'</div>';
  html+='<div class="dyn-sub">'+totalSeasons+' sezon'+(totalSeasons===1?'':'\u00f3w')+' historii \u2022 Aktualnie: '+(LNAMES[G.myLeague||8]||t('league_fallback'))+'</div>';
  html+='</div>';
  const hasAnyTrophy=lt.length>0||ctWon.length>0||ctFin.length>0;
  html+='<div style="border-bottom:2px solid var(--gl)">';
  html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);padding:8px 12px 5px;letter-spacing:1px;background:#0d1a0d">GABLOTA TROFE\u00d3W</div>';
  if(!hasAnyTrophy){
    html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:10px 12px 12px">Brak trofe\u00f3w \u2014 buduj dynasti\u0119!</div>';
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
        html+='<div style="font-weight:700;font-size:var(--fs-h3);color:'+cup.color+';margin-bottom:3px">'+cup.label.toUpperCase()+'</div>';
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
      html+='<div style="font-weight:700;font-size:var(--fs-h3);color:var(--am);margin-bottom:3px">PUCHAR MISTRZOWSKI</div>';
      html+='<div style="font-size:var(--fs-dense);color:var(--gr)">';
      if(ctWon.length>0)html+='Wygrany: '+ctWon.map(function(t){return 'S'+t.season;}).join(' \u2022 ');
      if(ctFin.length>0)html+=(ctWon.length?' \u2022 ':'')+' Fina\u0142y: '+ctFin.map(function(t){return 'S'+t.season;}).join(' \u2022 ');
      html+='</div></div>';
      if(ctWon.length>1)html+='<div style="font-weight:700;font-size:var(--fs-h1);color:var(--am)">\u00d7'+ctWon.length+'</div>';
      html+='</div>';
    }
  }
  html+='</div>';
    // ── OŚ CZASU ──
  html+='<div class="dyn-tl">';
  html+='<div class="dyn-tl-hdr">OŚ CZASU — SEZON PO SEZONIE</div>';

  if(!cHist.length){
    html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:8px 0">Historia pojawi się po zakończeniu pierwszego sezonu.</div>';
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
      if(isTitle)         {resultClass='gold';resultText='\u2605 MISTRZOSTWO LIGI';}
      else if(wasPromo)   {resultClass='promo';const nl=LNAMES[(next.leagueLevel||8)];resultText='\u2191 AWANS \u2192 '+(nl||'wyżej').replace(' Liga',' L.');}
      else if(wasRel)     {resultClass='rel';const nl=LNAMES[(next.leagueLevel||8)];resultText='\u2193 SPADEK \u2192 '+(nl||'niżej').replace(' Liga',' L.');}
      else if(pos===2)    {resultClass='normal';resultText='2. miejsce (wicemistrz)';}
      else if(pos<=3)     {resultClass='normal';resultText=pos+'. miejsce (podium)';}
      else                {resultClass='normal';resultText=pos+'. miejsce';}

      // Detail
      const detail='Pkt: '+(h.pts||'?')+' \u2022 '+h.gf+'–'+h.ga+(h.reputation?' \u2022 Rep: '+h.reputation:'');

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
        if(isCup)html+='<span class="dyn-badge cup">\uD83C\uDFC6 PUCHAR</span>';
        if(isCupFin)html+='<span class="dyn-badge fin">\uD83E\uDD48 FINA\u0141</span>';
        if(rec.maxWinStreak>=8&&h.season===cHist[0].season)html+='<span class="dyn-badge rec">\u26a1 SERIA '+rec.maxWinStreak+'W</span>';
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
