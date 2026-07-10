// v221: pomocnicza funkcja do puli 10 wariantów komentarza (klucze i18n "prefix_1".."prefix_10")
// — używana razem z istniejącym pick() (core/state.js) zamiast pisać tablicę ręcznie za każdym razem.
function _t10(prefix){return [1,2,3,4,5,6,7,8,9,10].map(function(i){return t(prefix+'_'+i);});}
// v227: pick() z puli 10 wariantów danej kategorii (prefix i18n), ale bez powtarzania tekstu,
// który padł NIEDAWNO w tej samej kategorii w tym samym meczu — np. "miss"/"narracja" mogą
// wystąpić kilkadziesiąt razy w jednym meczu, więc pilnujemy TYLKO ostatnich (10-1) użyć danej
// kategorii (przesuwne okno), zamiast permanentnie blokować całą pulę — inaczej pula i tak by się
// szybko wyczerpała i wróciłybyśmy do powtórek. To gwarantuje, że te same 10 wariantów nie może
// się powtórzyć „zaraz obok" (np. w tej samej minucie), a jednocześnie tekst naturalnie wraca do
// puli po kilku innych wariantach. Historia per-kategoria resetowana na start KAŻDEGO meczu
// (patrz window._matchTextHistory w _buildMatchPhases()).
function _pickVar(prefix){
  const pool=_t10(prefix);
  if(!window._matchTextHistory)window._matchTextHistory={};
  const hist=window._matchTextHistory[prefix]||(window._matchTextHistory[prefix]=[]);
  const fresh=pool.filter(function(x){return hist.indexOf(x)===-1;});
  const chosen=pick(fresh.length?fresh:pool);
  hist.push(chosen);
  if(hist.length>=pool.length)hist.shift();// nie blokuj na stałe — trzymaj tylko ostatnie użycia
  return chosen;
}
// v216: siła drużyny (playerStr — więc cechy i forma wliczone), taktyka klubu i jej modyfikatory —
// funkcje współdzielone przez pełną symulację zdarzeniową (_buildMatchPhases, mecz gracza) i
// odchudzony rdzeń dla masowych meczów AI-AI (_buildMatchLite, simOthers() w match-post.js).
function tS(cid){
  const st=G.players.filter(p=>p.clubId===cid&&p.starter);
  const avgStr=a=>a.length?Math.round(a.reduce((s,p)=>s+playerStr(p),0)/a.length):25;
  const gk=st.filter(p=>p.pos==='GK'),def=st.filter(p=>p.pos==='OBR');
  const mid=st.filter(p=>p.pos==='POL'),att=st.filter(p=>p.pos==='NAP');
  const fmRaw=st.length?st.reduce((s,p)=>s+p.form,0)/st.length:75;
  const fm=0.85+fmRaw/666;
  const avgOvr2=st.length?Math.round(st.reduce((s,p)=>s+ovr(p),0)/st.length):30;
  // Mentality bonus: high average men gives small boost to all stats
  const avgMen=st.length?st.reduce((s,p)=>s+p.men,0)/st.length:50;
  const menBonus=1+(avgMen-50)/500;
  return{
    atk:Math.round((avgStr(att)*0.7+avgStr(mid)*0.3)*menBonus),
    mid:Math.round((avgStr(mid)*0.6+avgStr(att)*0.2+avgStr(def)*0.2)*menBonus),
    def:Math.round((avgStr(def)*0.7+avgStr(gk)*0.3)*menBonus),
    gkOvr:avgStr(gk),
    form:fm,total:avgOvr2
  };
}
// Taktyka konkretnego klubu: gracz czyta G.*, AI czyta G.clubTactics (z fallbackiem na neutralne wartości —
// stare zapisy sprzed tej zmiany i kluby spoza ligi gracza, patrz notatka do Kroku 2)
function _clubTactic(clubId){
  if(clubId===G.myClubId){
    if(!G.pressing)G.pressing='Normalny';
    if(!G.line)G.line='Normalna';
    if(!G.instruction||G.instruction==='Bezpośrednia')G.instruction='Długie piłki';
    return{formation:G.formation,style:G.style,tempo:G.tempo,pressing:G.pressing,line:G.line,instruction:G.instruction};
  }
  const ct=(G.clubTactics&&G.clubTactics[clubId])||{};
  return{
    formation:ct.formation||'4-4-2',style:ct.style||'Zrównoważony',tempo:ct.tempo||'Normalne',
    pressing:ct.pressing||'Normalny',line:ct.line||'Normalna',instruction:ct.instruction||'Bezpośrednia'
  };
}
function _tacticMods(tac){
  const formMod={
    '4-4-2':{atk:1.0, mid:1.0, def:1.0},
    '4-3-3':{atk:1.15,mid:0.95,def:0.90},
    '3-5-2':{atk:1.0, mid:1.15,def:0.90},
    '5-3-2':{atk:0.90,mid:0.95,def:1.15},
    '3-4-3':{atk:1.20,mid:1.0, def:0.80},
    '4-5-1':{atk:0.85,mid:1.20,def:1.0},
  }[tac.formation]||{atk:1.0,mid:1.0,def:1.0};
  const styleMod={
    'Defensywny':  {actions:0.85,shotChance:0.85,foul:0.7},
    'Zrównoważony':{actions:1.0, shotChance:1.0, foul:1.0},
    'Ofensywny':   {actions:1.15,shotChance:1.15,foul:1.3},
  }[tac.style]||{actions:1.0,shotChance:1.0,foul:1.0};
  const tempoMod={'Wolne':0.80,'Normalne':1.0,'Szybkie':1.20}[tac.tempo]||1.0;
  const pressMod={
    'Niski':   {oppAct:-0.10,myFouls:-0.15,myDef:+0.08},
    'Normalny':{oppAct:0,    myFouls:0,    myDef:0     },
    'Wysoki':  {oppAct:+0.15,myFouls:+0.35,myDef:-0.05},
  }[tac.pressing]||{oppAct:0,myFouls:0,myDef:0};
  const lineMod={
    'Niska':   {def:+0.12,atk:-0.08,offsideRisk:0   },
    'Normalna':{def:0,    atk:0,    offsideRisk:0   },
    'Wysoka':  {def:-0.10,atk:+0.10,offsideRisk:0.15},
  }[tac.line]||{def:0,atk:0,offsideRisk:0};
  const instrMod={
    'Posiadanie':   {mid:+0.15,atk:-0.05,counterBonus:0.8 },
    'Długie piłki': {mid:-0.05,atk:+0.10,counterBonus:1.1 },
    'Bezpośrednia': {mid:0,    atk:0,    counterBonus:1.0 },
    'Kontry':       {mid:-0.10,atk:-0.10,counterBonus:1.6 },
  }[tac.instruction]||{mid:0,atk:0,counterBonus:1.0};
  return{formMod,styleMod,tempoMod,pressMod,lineMod,instrMod};
}
// Zastosuj formację/linię/instrukcję/pressing symetrycznie do obu drużyn (mutuje hSt/aSt w miejscu)
function _applyTacticsToStrength(hSt,aSt,hMods,aMods){
  hSt.atk=Math.round(hSt.atk*hMods.formMod.atk*(1+hMods.lineMod.atk+hMods.instrMod.atk));
  hSt.mid=Math.round(hSt.mid*hMods.formMod.mid*(1+hMods.instrMod.mid));
  hSt.def=Math.round(hSt.def*hMods.formMod.def*(1+hMods.lineMod.def+hMods.pressMod.myDef));
  aSt.atk=Math.round(aSt.atk*aMods.formMod.atk*(1+aMods.lineMod.atk+aMods.instrMod.atk));
  aSt.mid=Math.round(aSt.mid*aMods.formMod.mid*(1+aMods.instrMod.mid));
  aSt.def=Math.round(aSt.def*aMods.formMod.def*(1+aMods.lineMod.def+aMods.pressMod.myDef));
}

// v216: rdzeń "lite" dla masowych meczów AI-AI (simOthers() w match-post.js) — ta sama baza siły
// (playerStr, więc cechy+forma), taktyka i jeden spójny home advantage co mecz gracza, ale bez
// pętli zdarzeniowej (wydajność): jedno przybliżenie Poissona zamiast dziesiątek prób na akcję.
// Współczynnik atak/(atak+obrona) jest z konstrukcji ograniczony do 0..1, więc nie trzeba już
// osobnego capa ligowego OVR jak w starym wzorze — to samoograniczające się.
function _buildMatchLite(m){
  const hSt=tS(m.h),aSt=tS(m.a);
  const hTac=_clubTactic(m.h),aTac=_clubTactic(m.a);
  const hMods=_tacticMods(hTac),aMods=_tacticMods(aTac);
  _applyTacticsToStrength(hSt,aSt,hMods,aMods);
  const hRatio=hSt.atk/(hSt.atk+aSt.def+1);
  const aRatio=aSt.atk/(aSt.atk+hSt.def+1);
  // Home advantage — zawsze realny gospodarz m.h, tak samo jak w pełnej symulacji.
  // v217: amplituda open-play i mnożnik 1.373 skalibrowane Monte Carlo tak, by łączna
  // liczba goli/mecz (~2.75-2.8) i stosunek gospodarz/gość (~1.37x) zgadzały się
  // z _buildMatchPhases (bldEvs+saveChance intercept 0.325) — patrz diagnoza asymetrii goli.
  // v218: _spLam = odpowiednik śr. wkładu bldSetPieces (rożne+wolne+karne) z pełnego silnika —
  // bez bonusu za własne boisko, tak jak w bldSetPieces. Amplituda open-play obniżona z 2.35 do
  // 2.03, żeby po doliczeniu _spLam łączna liczba goli została na tym samym ~2.76/mecz.
  const _spLam=0.19;
  const hLam=Math.max(0.15,hRatio*2.03)*hSt.form*1.373+_spLam;
  const aLam=Math.max(0.15,aRatio*2.03)*aSt.form+_spLam;
  const _t=10;
  let hG=0,aG=0;
  for(let i=0;i<_t;i++){if(Math.random()<Math.min(0.92,hLam/_t))hG++;}
  for(let i=0;i<_t;i++){if(Math.random()<Math.min(0.92,aLam/_t))aG++;}
  return{hG,aG};
}

// v215: rdzeń liczenia meczu (siła drużyn, taktyka, nastawienie, zdarzenia) — bez DOM/UI.
// Współdzielony przez simMatch() (mecz gracza na żywo) i devSimMyMatch() (dev-mode, bez animacji).
function _buildMatchPhases(m){
  liveStats={hShots:0,aShots:0,hOn:0,aOn:0,hFouls:0,aFouls:0,hAct:0,aAct:0};
  window._matchTextHistory={};// v227: historia tekstów per-kategoria resetowana na start KAŻDEGO meczu
  const ratings={};G.players.filter(p=>(p.clubId===m.h||p.clubId===m.a)&&p.starter).forEach(p=>{ratings[p.id]={goals:0,assists:0,shots:0,accurateShots:0,saves:0,clearances:0,keyPasses:0,cards:0,rating:6.0};});
  const hSt=tS(m.h),aSt=tS(m.a);

  // ── TACTICAL MODIFIERS — te same zasady dla obu drużyn (v213) ────────
  const isMyH=m.h===G.myClubId;
  const hTac=_clubTactic(m.h),aTac=_clubTactic(m.a);
  const hMods=_tacticMods(hTac),aMods=_tacticMods(aTac);
  _applyTacticsToStrength(hSt,aSt,hMods,aMods);

  // ── NASTAWIENIE (mood) — gracz wybiera ręcznie, AI dobiera wg względnej siły (v214) ──
  const myTacSt=isMyH?hSt:aSt;
  const oppTacSt=isMyH?aSt:hSt;
  function _applyMoodTo(tacSt,mood){
    if(mood==='atak'){
      tacSt.atk=Math.round(tacSt.atk*1.08);
      tacSt.mid=Math.round(tacSt.mid*1.04);
      tacSt.def=Math.round(tacSt.def*0.95);
    } else if(mood==='blok'){
      tacSt.def=Math.round(tacSt.def*1.08);
      tacSt.mid=Math.round(tacSt.mid*1.03);
      tacSt.atk=Math.round(tacSt.atk*0.95);
    }
  }
  function _moodActMods(mood){
    return{own:(mood==='atak')?1.08:(mood==='blok')?0.93:1.0,opp:(mood==='atak')?1.05:(mood==='blok')?0.96:1.0};
  }
  const _mood=G._matchMood||'balans';
  _applyMoodTo(myTacSt,_mood);
  const _myMoodAct=_moodActMods(_mood);

  // AI dobiera nastawienie raz na mecz: underdog częściej atakuje, faworyt częściej broni, plus losowość
  function _pickAIMood(aiStrength,oppStrength){
    const diff=aiStrength-oppStrength;
    let atakP=0.30,blokP=0.30;
    if(diff<=-8){atakP=0.55;blokP=0.15;}
    else if(diff>=8){atakP=0.15;blokP=0.55;}
    const roll=Math.random();
    if(roll<atakP)return'atak';
    if(roll<atakP+blokP)return'blok';
    return'balans';
  }
  const _aiMood=_pickAIMood(oppTacSt.total||30,myTacSt.total||30);
  _applyMoodTo(oppTacSt,_aiMood);
  const _aiMoodAct=_moodActMods(_aiMood);

  // Siła całkowita obu drużyn — do dominacji fazy 2 (już nie do doboru kontr-formacji AI, AI ma teraz własną stałą taktykę)
  const hStrTot=hSt.total||30;
  const aStrTot=aSt.total||30;

  // MID kontroluje posiadanie
  const midDiff=(hSt.mid-aSt.mid)/250;

  // Home advantage — zawsze realny gospodarz (hSt=m.h, aSt=m.a), niezależnie od tego kto jest klubem gracza
  const hPow2=(hSt.total||30)*hSt.form*1.07;
  const aPow2=(aSt.total||30)*aSt.form;
  const baseTot=Math.round(r(38,46)*((hMods.tempoMod+aMods.tempoMod)/2)*((hMods.styleMod.actions+aMods.styleMod.actions)/2));// v213: tempo/styl obu drużyn wpływa na tempo meczu
  const tot=Math.max(10,baseTot);
  // v202: hs asymetryczna — lider u siebie dominuje bardziej (0.42) niż na wyjeździe (0.28)
  const _rawHs=(hPow2-aPow2)/(hPow2+aPow2);
  const hs=0.5+_rawHs*(_rawHs>0?0.42:0.28);
  let hA=Math.max(4,Math.round(tot*hs*r(85,115)/100)),aA=Math.max(4,tot-hA);
  // Mood modyfikuje podział akcji (dodatkowo, po obliczeniu bazowych sił) — obie drużyny, własne nastawienie + lekki wpływ na rywala
  if(isMyH){
    hA=Math.max(4,Math.round(hA*_myMoodAct.own*_aiMoodAct.opp));
    aA=Math.max(4,Math.round(aA*_aiMoodAct.own*_myMoodAct.opp));
  } else {
    aA=Math.max(4,Math.round(aA*_myMoodAct.own*_aiMoodAct.opp));
    hA=Math.max(4,Math.round(hA*_aiMoodAct.own*_myMoodAct.opp));
  }

  // Pressing — obie drużyny redukują akcje rywala swoim własnym pressingiem
  aA=Math.max(3,Math.round(aA*(1-hMods.pressMod.oppAct)));
  hA=Math.max(3,Math.round(hA*(1-aMods.pressMod.oppAct)));
  hA=Math.max(3,Math.round(hA*(1+midDiff)));
  aA=Math.max(3,Math.round(aA*(1-midDiff)));
  // v219: cap po wszystkich mnożnikach (tempo/styl/hs/mood/pressing/midDiff) — bez tego skumulowane
  // bonusy potrafiły wygenerować >30 akcji jednej stronie i nierealistyczne 20+ strzałów w meczu
  hA=Math.min(32,hA);
  aA=Math.min(32,aA);

  // Zmęczenie PHY — faza 3 (61-90')
  const myStarters=G.players.filter(p=>p.clubId===G.myClubId&&p.starter);
  const avgPhy=myStarters.length?myStarters.reduce((s,p)=>s+(p.phy||50),0)/myStarters.length:50;
  const staminaFactor=0.90+(avgPhy/500); // PHY50=1.0, PHY30=0.96, PHY70=1.04
  // v198: avgPhy obu drużyn (AI zawodnicy używają OVR jako proxy)
  const oppStarters=G.players.filter(p=>p.clubId===(isMyH?m.a:m.h)&&p.starter);
  const avgPhyOpp=oppStarters.length?oppStarters.reduce((s,p)=>s+(p.phy||50),0)/oppStarters.length:50;
  const staminaFactorOpp=0.90+(avgPhyOpp/500); // v218: to samo co staminaFactor, ale dla realnego rywala (był na sztywno 1.0)
  // _fatigueSavePenalty(min, avgPhyDef): im niższy PHY obrony i im później, tym mniej broni GK
  function _fatigueSavePenalty(min,phyAvg){
    if(min<65)return 0;
    const tired=Math.max(0,(100-phyAvg)/100); // 0=superkondycja,1=bez kondycji
    return tired*(min-65)/25*0.10; // max -10% saveChance przy PHY=0 w 90'
  }
  // v218: Więź z Klubem w meczu — działa dla OBU stron na bazie _seasonsAtClub (już liczone dla
  // wszystkich klubów, patrz match-post.js aiTransferSeason). getBondLevel()/getBondFormBonus()
  // (news-bootstrap.js) zostają nietknięte — używane też w UI karty zawodnika i w transferach,
  // celowo tylko dla mojego klubu (patrz tactics-playercard.js "tylko własni").
  function _matchBondFormBonus(p,isHome){
    const s=(p&&p._seasonsAtClub)||0;
    let level=1;
    if(s>=8)level=4; else if(s>=5)level=3; else if(s>=3)level=2;
    if(level===4)return isHome?3:1;
    if(level===3)return isHome?2:0;
    if(level===2)return isHome?1:0;
    return 0;
  }

  // Podziel akcje na 3 fazy
  const h1=Math.round(hA*0.30), h2=Math.round(hA*0.35), h3=Math.max(2,hA-h1-h2);
  const a1=Math.round(aA*0.30), a2=Math.round(aA*0.35), a3=Math.max(2,aA-a1-a2);
  const h3f=Math.round(h3*(isMyH?staminaFactor:staminaFactorOpp));
  const a3f=Math.round(a3*(isMyH?staminaFactorOpp:staminaFactor));

  // v214: taktyczny shift w 46' — gracz wybiera ręcznie (UI), AI dobiera automatycznie wg wyniku po 2. fazie.
  // Definicje współdzielone z przyciskami wyboru gracza (patrz _tBtns niżej).
  const TACTICAL_SHIFT_DEFS={attack:{shotMod:1.20,saveMod:0.85},counter:{shotMod:1.25,saveMod:1.05},defend:{shotMod:0.85,saveMod:1.12},press:{shotMod:0.92,saveMod:1.00}};
  window._tacticalShift=window._tacticalShift||{actMod:1.0,shotMod:1.0,saveMod:1.0,used:false};
  window._tacticalShiftUsed=false;
const hSc=G.players.filter(p=>p.clubId===m.h&&p.starter&&p.pos!=='GK'),aSc=G.players.filter(p=>p.clubId===m.a&&p.starter&&p.pos!=='GK');
function bldEvs(act,atk,def,gk,sc,isH,phase,minMin){const evts=[],mins=[];
  // v222: 10 wariantów narracji (było 4) — reużywa _t10() z i18n zamiast ręcznej tablicy _1.._4
  const _npPrefix=phase==='early'?'match_narr_early':phase==='late'?'match_narr_late':'match_narr_mid';
  const _nn=Math.floor(act/4);
  for(let _ni=0;_ni<_nn;_ni++){
    const _nm=phase==='early'?r(5,28):phase==='mid'?r(32,58):r(62,88);
    evts.push({min:_nm,type:'narration',text:_pickVar(_npPrefix),isH});
  }// FIX 3: More actions in 2nd half - distribute 40% in 1-45, 60% in 46-90
  // v222: minMin — gdy podany i >45 (faza 3, dobudowana po przerwie), zdarzenia dostają wyłącznie
  // minuty z drugiej połowy; bez tego mogły trafić np. 20', mimo że mecz jest już po przerwie —
  // stąd zgłoszony błąd "45' a zaraz potem 39'" w relacji (chronologia po dogenerowaniu fazy 3).
for(let i=0;i<act;i++){
  const min=(minMin&&minMin>45)?r(minMin,90):(Math.random()<0.4?r(1,45):r(46,90));
  mins.push(min);
}
mins.sort((a,b)=>a-b);
let _momSnapIdx=0;// v199: licznik dla snapshotu co 3 akcje
mins.forEach(min=>{if(isH)liveStats.hAct++;else liveStats.aAct++;const scMod=isH?hMods.styleMod.shotChance:aMods.styleMod.shotChance;
// HYBRID ENGINE v197: ovrDiffBoost + MOMENTUM + CZAS MECZU
const _ovrDiffBoost=Math.max(0.0,Math.min(0.08,(atk-def)/280));
_momDecay();// v199: momentum powoli wraca do 0 między golami
_momSnapIdx++;
if(_momSnapIdx%3===0){// co 3 akcje — zapisz snapshot (animuje igłę)
  evts.push({min,type:'momupdate',isH,_momSnap:{h:_momentum[true],a:_momentum[false]}});
}
const _mBoost=_momBoost(isH);// momentum: silna drużyna po golu strzela lepiej
const _tMod=_timeMod(min);   // czas: końcówka meczu bardziej dynamiczna
// v214: taktyczny shift (gracz + AI, niezależne) + derby factor — strzelająca strona używa WŁASNEGO shiftu
const _myTacSh=window._tacticalShift||{shotMod:1.0,saveMod:1.0};
const _aiTacSh=window._aiTacticalShift||{shotMod:1.0,saveMod:1.0};
const _shooterTacSh=(isH===isMyH)?_myTacSh:_aiTacSh;
// v219: clamp na CAŁOŚCI (nie tylko bazie) — bez tego scMod*_tMod*shotMod*derbyFactor potrafiły
// przebić 100% szansy na strzał z każdej akcji
// v221: intercept 0.14→0.11 — mniej, ale celniejszych strzałów (razem z accuracyChance/saveChance
// niżej), żeby podnieść %celne bez zmiany łącznej liczby goli — patrz analiza celności per liga
const baseShot=Math.max(0.10,Math.min(0.75,((atk/(atk+def+1))*0.58+0.11+_ovrDiffBoost+_mBoost)*scMod*_tMod*(_shooterTacSh.shotMod||1.0)*(_derbyFactor||1.0)));
if(Math.random()>baseShot){
  // Akcja zakończona obroną — losowy obrońca dostaje clearance
  const defTeam=G.players.filter(p=>p.clubId===(isH?m.a:m.h)&&(p.pos==='OBR'||p.pos==='GK')&&p.starter);
  if(defTeam.length){
    const defW=defTeam.map(p=>p.pos==='OBR'?p.def||30:5);
    const defT=defW.reduce((s,v)=>s+v,0);let dRnd=Math.random()*defT;
    let defPick=defTeam[defTeam.length-1];
    for(let di=0;di<defTeam.length;di++){dRnd-=defW[di];if(dRnd<=0){defPick=defTeam[di];break;}}
    if(ratings[defPick.id])ratings[defPick.id].clearances=(ratings[defPick.id].clearances||0)+1;
  }
  return;
}
// FIX 2: Defensive style gives counterattack bonus to goal chance — sprawdzamy styl drużyny, która akurat strzela
const _instrCB=isH?hMods.instrMod.counterBonus:aMods.instrMod.counterBonus;const _shooterStyle=isH?hTac.style:aTac.style;const counterMod=(_shooterStyle==='Defensywny')?1.25*_instrCB:_instrCB;// Weighted scorer: NAP=1.0, POL=0.5, OBR=0.2
function wpick(arr){
  // FIX 4: Use sht attribute + position weight, squared (not cubed)
  // NAP with high sht is primary scorer
  const posW={NAP:6.0,POL:1.8,OBR:0.3,GK:0.02};
  const getW=p=>(posW[p.pos]||0.5)*Math.pow((p.sht||ovr(p))/45,2);
  const total=arr.reduce((s,p)=>s+getW(p),0);
  let rnd=Math.random()*total;
  for(const p of arr){rnd-=getW(p);if(rnd<=0)return p;}
  return arr[arr.length-1];
}
const sc2=sc.length?wpick(sc):{last:'???',id:-1,pos:'NAP'};if(isH)liveStats.hShots++;else liveStats.aShots++;if(ratings[sc2.id])ratings[sc2.id].shots++;// Fazy: celność strzału + obrona bramkarza z uwzględnieniem relStrength
const shtAttr=sc2&&sc2.sht?sc2.sht:atk;
const gkPlayer=G.players.find(p=>p.clubId===(isH?m.a:m.h)&&p.pos==='GK'&&p.starter);
const gkDef=gkPlayer?gkPlayer.def:gk;
// Faza 1: Celność strzału
const homeBonus=isH?1.10:0.93;// v196: wzmocniona przewaga domowa (10%→18% asymetria)
// v212/v218: Więź z Klubem — bonus formy, większy u siebie (realny gospodarz, nie klub gracza),
// działa symetrycznie dla obu stron (_matchBondFormBonus, nie getBondFormBonus — patrz notatka wyżej)
const _bondFB=_matchBondFormBonus(sc2,isH);
const _bondShtMod=_bondFB>0?1+((_bondFB*2)/100):1.0;
// v198: hot streak napastnika daje bonus do celności (+5% za serię ≥3, +12% za ≥5)
const _streakB=(sc2&&sc2.goalStreak>=5)?1.12:(sc2&&sc2.goalStreak>=3)?1.05:1.0;
// v219: clamp na CAŁOŚCI (nie tylko bazie) — counterMod (do 2.0 dla Defensywny+Kontry) i inne mnożniki
// potrafiły przebić 100% celności, patrz diagnoza niespójności między meczami
// v220: intercept 0.19→0.14 — rekalibracja pod realne losowe pary (nie idealne równe drużyny),
// razem ze saveChance niżej, na podstawie runDiagStatsSample() — patrz diagnoza "full" vs "lite"
// v221: intercept 0.14→0.17 — podniesienie %celne (razem z niższym baseShot wyżej i wyższym
// saveChance niżej, żeby łączna liczba goli została nietknięta) — patrz analiza celności per liga
const accuracyChance=Math.max(0.30,Math.min(0.65,((shtAttr/100)*0.36+0.17)*counterMod*homeBonus*_streakB*_bondShtMod));// v208: więcej celnych (3-4/mecz) żeby obrony były widoczne
// Faza 2: Obrona bramkarza — floor niższy przy amatorach (więcej bramek L3-L8), sufit wyższy przy elicie (więcej remisów L1-L2)
const saveChanceMod=isH?0.97:1.03;// v196: mniejsza asymetria GK → mniej wygranych gości
const _relStr=Math.min(1.4,gkDef/Math.max(10,shtAttr));
const _scFloor=Math.max(0.55,Math.min(0.65,0.50+(gkDef/100)*0.18));// v208: floor 0.55 — GK broni min 55% celnych, widoczne obrony
// v202: scCeil uwzględnia przewagę GK nad napastnikiem — lider traci mniej
const _gkAdvantage=Math.max(0,(gkDef-shtAttr)/100);
const _scCeil=Math.max(0.80,Math.min(0.92,0.78+(gkDef/100)*0.10+_gkAdvantage*0.12));// v208: wyższy ceil
// v198: zmęczenie obrony redukuje saveChance od 65'
const _defPhyAvg=isH?(isMyH?avgPhyOpp:avgPhy):(isMyH?avgPhy:avgPhyOpp);
const _fatPen=_fatigueSavePenalty(min,_defPhyAvg);
// v214: taktyczny saveMod — broniąca strona używa WŁASNEGO shiftu (był bug: dawniej zawsze neutralny, patrz notatka) + derby (w derbym obrona też popełnia więcej błędów)
const _defenderTacSh=(isH===isMyH)?_aiTacSh:_myTacSh;
const _tacSaveMod=_defenderTacSh.saveMod||1.0;
const _derbySaveMod=(_derbyFactor||1.0)>1.0?0.97:1.0;// derby: GK troszkę gorzej broni
// v219: clamp na CAŁOŚCI (nie tylko bazie) — saveChanceMod/_tacSaveMod/_derbySaveMod mnożone poza
// oryginalnym clampem potrafiły zejść poniżej/wyjść powyżej sensownego zakresu
// v220: intercept 0.28→0.38 — rekalibracja średniej goli (nie tylko ogona rozkładu) na
// podstawie runDiagStatsSample(): "full" silnik na losowych parach dawał +25-70% goli
// więcej niż "lite" (simOthers) we wszystkich 8 ligach — rozłożone na 2 dźwignie
// (razem z accuracyChance wyżej), żeby nie zdusić konwersji do nierealistycznych wartości
// v221: intercept 0.38→0.42 — kompensuje podniesione accuracyChance/obniżone baseShot wyżej,
// żeby łączna liczba goli została nietknięta mimo wyższej celności
const saveChance=Math.max(0.40,Math.min(0.95,(Math.max(_scFloor,Math.min(_scCeil,_relStr*0.35+0.42))*saveChanceMod-_fatPen)*_tacSaveMod*_derbySaveMod));
const isAccurate=Math.random()<accuracyChance;
if(isAccurate){if(isH)liveStats.hOn++;else liveStats.aOn++;if(ratings[sc2.id])ratings[sc2.id].accurateShots=(ratings[sc2.id].accurateShots||0)+1;}
if(isAccurate&&(Math.random()>(saveChance))){if(ratings[sc2.id]){ratings[sc2.id].goals++;ratings[sc2.id].rating+=1.5;}
// Assist: POL=1.0, NAP=0.5, OBR=0.15
const assistCandidates=sc.filter(p=>p.id!==sc2.id);
const aWeights={POL:1.0,NAP:0.5,OBR:0.15,GK:0.02};
let assister=null;
if(assistCandidates.length&&Math.random()<0.85){
  // FIX 4+5: Use pas attribute for assists, squared
  const getAW=p=>(aWeights[p.pos]||0.3)*Math.pow((p.pas||ovr(p))/45,2);
  const aTotal=assistCandidates.reduce((s,p)=>s+getAW(p),0);
  let aRnd=Math.random()*aTotal;
  for(const p of assistCandidates){aRnd-=getAW(p);if(aRnd<=0){assister=p;break;}}
  if(!assister)assister=assistCandidates[0];
  if(ratings[assister.id]){ratings[assister.id].assists=(ratings[assister.id].assists||0)+1;ratings[assister.id].keyPasses=(ratings[assister.id].keyPasses||0)+1;}
}
_applyMomentum(isH,min);// v197: aktualizuj momentum PRZED zapisem snapshotu
evts.push({min,type:'goal',sid:sc2.id,isH,scorer:sc2.last,scorerName:sc2.name||sc2.last,assister:assister?assister.last:null,assisterName:assister?(assister.name||assister.last):null,assisterId:assister?assister.id:null,_momSnap:{h:_momentum[true],a:_momentum[false]}});// v199: snapshot momentum
}else{
  // v230: save liczymy TYLKO gdy strzał był celny (isAccurate) — wcześniej gk.saves rosło
  // też przy strzałach niecelnych (obok/nad bramką), co sztucznie zawyżało statystykę obron
  // bramkarza (patrz diagnoza asymetrii MVP GK vs zawodnicy z pola).
  if(isAccurate){
    // Strzał celny, ale obroniony — prawdziwa obrona bramkarza
    if(gkPlayer&&ratings[gkPlayer.id])ratings[gkPlayer.id].saves=(ratings[gkPlayer.id].saves||0)+1;
    // Strzał celny ale obroniony → keyPass dla przypadkowego asystenta
    const kpCandidates=sc.filter(p=>p.id!==sc2.id&&(p.pos==='POL'||p.pos==='NAP'));
    if(kpCandidates.length&&Math.random()<0.5){
      const kpPick=kpCandidates[Math.floor(Math.random()*kpCandidates.length)];
      if(ratings[kpPick.id])ratings[kpPick.id].keyPasses=(ratings[kpPick.id].keyPasses||0)+1;
    }
  }
  const _stxt=isAccurate?_pickVar('match_shot_saved').replace('{scorer}',sc2.last).replace(/\{gk\}/g,gkPlayer?gkPlayer.last:'GK'):(sc2.last+' - '+_pickVar('match_miss'));
  evts.push({min,type:'shot',text:_stxt,isH,pid:sc2.id,onTarget:isAccurate});
}});return evts;}
function bldSetPieces(sc, isH){
  const evts=[];
  if(!sc||!sc.length)return evts;
  const myId=isH?m.h:m.a;
  const allSt=G.players.filter(p=>p.clubId===myId&&p.starter&&p.pos!=='GK');
  if(!allSt.length)return evts;
  const fkTaker=[...allSt].sort((a,b)=>(b.sht||0)-(a.sht||0))[0];
  const crnTaker=[...allSt].sort((a,b)=>(b.pas||0)-(a.pas||0))[0];
  const headers=allSt.filter(p=>p.pos==='OBR'||p.pos==='NAP').sort((a,b)=>(b.phy||0)-(a.phy||0));
  const headerP=headers[0]||fkTaker;
  const oppGK=G.players.find(p=>p.clubId===(isH?m.a:m.h)&&p.pos==='GK'&&p.starter);
  const oppGkDef=oppGK?oppGK.def:40;

  // Rozne: 2-4 per mecz
  const nCorners=r(2,4);
  for(let i=0;i<nCorners;i++){
    const min=r(10,88);
    const gc=Math.max(0.02,Math.min(0.05,((crnTaker.pas||50)/100)*0.03+((headerP.phy||50)/100)*0.02));// v206: corner→gol 2-5% zamiast 4-9%
    if(isH)liveStats.hShots++;else liveStats.aShots++;
    if(Math.random()<gc){
      if(isH)liveStats.hOn++;else liveStats.aOn++;
      if(ratings[headerP.id])ratings[headerP.id].goals=(ratings[headerP.id].goals||0)+1;
      if(ratings[headerP.id])ratings[headerP.id].shots=(ratings[headerP.id].shots||0)+1;
      if(ratings[headerP.id])ratings[headerP.id].accurateShots=(ratings[headerP.id].accurateShots||0)+1;
      if(ratings[crnTaker.id]){ratings[crnTaker.id].assists=(ratings[crnTaker.id].assists||0)+1;ratings[crnTaker.id].keyPasses=(ratings[crnTaker.id].keyPasses||0)+1;}
      evts.push({min,type:'goal',sid:headerP.id,isH,scorer:headerP.last,scorerName:headerP.name,assister:crnTaker.last,assisterName:crnTaker.name,assisterId:crnTaker.id,setpiece:'corner'});_applyMomentum(isH,min);
if(evts.length)evts[evts.length-1]._momSnap={h:_momentum[true],a:_momentum[false]};
    } else {
      // Część chybionych cornerów trafia w ręce bramkarza (celny ale obroniony)
      if(Math.random()<0.35){if(isH)liveStats.hOn++;else liveStats.aOn++;if(oppGK&&ratings[oppGK.id])ratings[oppGK.id].saves=(ratings[oppGK.id].saves||0)+1;}
      evts.push({min,type:'corner',text:_pickVar('match_corner_text').replace('{taker}',crnTaker.last).replace('{result}',Math.random()<0.5?_pickVar('match_corner_header_saved'):_pickVar('match_corner_out')),isH});
    }
  }

  // Rzuty wolne: 1-2 per mecz
  const nFKs=r(1,2);
  for(let i=0;i<nFKs;i++){
    const min=r(8,85);
    const dist=r(18,28);
    const gc=Math.max(0.05,Math.min(0.13,((fkTaker.sht||50)/100)*0.13*(1-(dist-18)/40)));
    const sc2=Math.max(0.47,Math.min(0.78,(oppGkDef/100)*0.55+0.26));
    if(isH)liveStats.hShots++;else liveStats.aShots++;
    if(Math.random()<gc&&Math.random()>sc2){
      if(isH)liveStats.hOn++;else liveStats.aOn++;
      if(ratings[fkTaker.id])ratings[fkTaker.id].goals=(ratings[fkTaker.id].goals||0)+1;
      if(ratings[fkTaker.id])ratings[fkTaker.id].shots=(ratings[fkTaker.id].shots||0)+1;
      if(ratings[fkTaker.id])ratings[fkTaker.id].accurateShots=(ratings[fkTaker.id].accurateShots||0)+1;
      evts.push({min,type:'goal',sid:fkTaker.id,isH,scorer:fkTaker.last,scorerName:fkTaker.name,assister:null,assisterId:null,setpiece:'freekick'});_applyMomentum(isH,min);
if(evts.length)evts[evts.length-1]._momSnap={h:_momentum[true],a:_momentum[false]};
    } else {
      // Część wolnych trafia w bramkarza (celny obroniony) zamiast w mur/obok
      if(Math.random()<0.40){if(isH)liveStats.hOn++;else liveStats.aOn++;if(oppGK&&ratings[oppGK.id])ratings[oppGK.id].saves=(ratings[oppGK.id].saves||0)+1;}
      evts.push({min,type:'freekick',text:_pickVar('match_freekick_text').replace('{taker}',fkTaker.last).replace('{dist}',dist).replace('{result}',Math.random()<0.5?_pickVar('match_freekick_wall'):_pickVar('match_freekick_saved')),isH});
    }
  }

  // Karne: 0-1 per mecz (12%)
  if(Math.random()<0.12){
    const min=r(20,88);
    const pgc=Math.max(0.65,Math.min(0.83,(fkTaker.sht||50)/100*0.47+0.40));
    if(isH)liveStats.hShots++;else liveStats.aShots++;
    if(Math.random()<pgc){
      if(isH)liveStats.hOn++;else liveStats.aOn++;
      if(ratings[fkTaker.id])ratings[fkTaker.id].goals=(ratings[fkTaker.id].goals||0)+1;
      if(ratings[fkTaker.id])ratings[fkTaker.id].shots=(ratings[fkTaker.id].shots||0)+1;
      if(ratings[fkTaker.id])ratings[fkTaker.id].accurateShots=(ratings[fkTaker.id].accurateShots||0)+1;
      evts.push({min,type:'goal',sid:fkTaker.id,isH,scorer:fkTaker.last,scorerName:fkTaker.name,assister:null,assisterId:null,setpiece:'penalty'});_applyMomentum(isH,min);// v197: momentum po karnym
// v199: zapisz snapshot momentum po set-piece golu
if(evts.length)evts[evts.length-1]._momSnap={h:_momentum[true],a:_momentum[false]};
    } else {
      if(oppGK&&ratings[oppGK.id]){
        ratings[oppGK.id].saves=(ratings[oppGK.id].saves||0)+1;
        // v231: obroniony karny liczony też osobno (penaltiesSaved) — w ocenie meczowej
        // dostaje mocniejszą premię niż zwykła obrona.
        ratings[oppGK.id].penaltiesSaved=(ratings[oppGK.id].penaltiesSaved||0)+1;
      }
      // v231: niewykorzystany karny dla egzekutora — osobna statystyka do dotkliwej kary w ocenie
      if(ratings[fkTaker.id])ratings[fkTaker.id].penaltyMissed=(ratings[fkTaker.id].penaltyMissed||0)+1;
      evts.push({min,type:'penalty_saved',text:_pickVar('match_penalty_saved').replace('{taker}',fkTaker.last).replace(/\{gk\}/g,oppGK?oppGK.last:''),isH});
    }
  }
  return evts;
}
function bldCards(pls){
  const evts=[];
  // Track yellow cards per player in this match
  const yellows={};
  pls.forEach(p=>{
    const isMy=p.clubId===G.myClubId;
    const isPH=p.clubId===m.h;
    const pMods=isPH?hMods:aMods;
    // Yellow card chance — styl i pressing WŁASNEJ drużyny zawodnika (dowolnej, nie tylko gracza)
    const foulMod=pMods.styleMod.foul*(1+pMods.pressMod.myFouls);if(Math.random()<0.05*foulMod){
      if(isPH)liveStats.hFouls++;else liveStats.aFouls++;
      yellows[p.id]=(yellows[p.id]||0)+1;
      if(ratings[p.id])ratings[p.id].cards=(ratings[p.id].cards||0)+1;
      evts.push({min:r(5,85),type:'yellow',text:_pickVar('match_yellow_card').replace('{name}',p.last),sid:p.id,isMy});
      // 2nd yellow = red card
      if(yellows[p.id]>=2){
        if(ratings[p.id])ratings[p.id].redCard=true;// v231: do dotkliwej kary w ocenie meczowej
        evts.push({min:r(86,89),type:'red2y',text:_pickVar('match_red_card_2y').replace('{name}',p.last),sid:p.id,isMy});
      }
    }
    // Direct red card chance
    if(Math.random()<0.007){
      if(ratings[p.id])ratings[p.id].redCard=true;// v231: do dotkliwej kary w ocenie meczowej
      evts.push({min:r(10,85),type:'red',text:_pickVar('match_red_card').replace('{name}',p.last),sid:p.id,isMy:p.clubId===G.myClubId});
    }
  });
  return evts;
}
const allPl=G.players.filter(p=>(p.clubId===m.h||p.clubId===m.a)&&p.starter);
// 3 fazy meczu z różnymi parametrami i nowe zdarzenia
// ── PRESJA PSYCHOLOGICZNA — DERBY (v198) ────────────────────────
// Derby = rywal w top 3 tabeli LUB duża różnica prestiżu → zmienność wyników
const _oppClubId=isMyH?m.a:m.h;
const _oppStanding=G.standing?G.standing.find(s=>s.cid===_oppClubId):null;
const _oppPos=_oppStanding?([...G.standing].sort((a,b)=>b.pts-a.pts).indexOf(_oppStanding)+1):8;
const _myPos2=G.standing?([...G.standing].sort((a,b)=>b.pts-a.pts).findIndex(s=>s.cid===G.myClubId)+1):8;
const _isDerby=(_oppPos<=3||_myPos2<=3)||Math.abs(_oppPos-_myPos2)<=1;
// W derbach: baseShot *1.08 ale saveChance też *1.04 — więcej goli PO OBU stronach
// Efekt: mecze kończą się wyraźnym wynikiem częściej niż remisem
const _derbyFactor=_isDerby?1.08:1.0;
if(_isDerby&&!window._derbyNotified){
  window._derbyNotified=true;
}
// ── MOMENTUM + CZAS MECZU (v197) ─────────────────────────────────
// momentum[true]=gospodarz, momentum[false]=gość
// Zakres: -10 do +10. Start: 0. Aktualizowane po każdym golu.
// timeFactor: bramki w końcówce (76-90) są ~30% bardziej prawdopodobne.
window._momentum={true:0,false:0};const _momentum=window._momentum;
const _momEvts=[];// zdarzenia narracyjne generowane przez momentum
function _applyMomentum(isScorer,evtMin){
  _momentum[isScorer]=Math.min(10,_momentum[isScorer]+2.5);
  _momentum[!isScorer]=Math.max(-10,_momentum[!isScorer]-1.5);
  // Narracja gdy momentum wysoki (>6)
  if(_momentum[isScorer]>=6){
    _momEvts.push({min:Math.min(89,(evtMin||1)+2),type:'narration',
      text:_pickVar('match_mom_high'),isH:isScorer});
  }
  if(_momentum[!isScorer]<=-6){
    _momEvts.push({min:Math.min(89,(evtMin||1)+3),type:'narration',
      text:_pickVar('match_mom_low'),isH:!isScorer});
  }
}
function _momBoost(isH){ return _momentum[isH]*0.008; } // max ±8% na baseShot
function _momDecay(){
  // Po każdej akcji bez gola: momentum maleje o 0.18 w stronę zera
  const decay=0.18;
  if(_momentum[true]>0)_momentum[true]=Math.max(0,_momentum[true]-decay);
  else if(_momentum[true]<0)_momentum[true]=Math.min(0,_momentum[true]+decay);
  if(_momentum[false]>0)_momentum[false]=Math.max(0,_momentum[false]-decay);
  else if(_momentum[false]<0)_momentum[false]=Math.min(0,_momentum[false]+decay);
}
function _timeMod(min){
  // Bazowo 1.0; rośnie od 70', spike w 85-90'
  if(min<=15) return 0.90;   // zimny start -10%
  if(min<=70) return 1.00;   // środek meczu neutralny
  if(min<=84) return 1.00+(min-70)/70*0.25; // 70-84': +0 do +25%
  return 1.25+(min-85)/5*0.10;              // 85-90': +25 do +35%
}
// ── KONIEC INIT MOMENTUM + CZAS MECZU ─────────────────────────────

// v202: cap atk/def przed bldEvs — formMod*instrMod*lineMod nie może przekroczyć bazy
// max atk = OVR_MAX_LIGI * 1.15 — gracz nie może mieć wyższego ataku niż top liga na to pozwala
const _lgMaxOvr2=(LEAGUE_OVR&&LEAGUE_OVR[G.myLeague||8]?LEAGUE_OVR[G.myLeague||8][3]:92)*0.7;
const _atkCap=Math.round(_lgMaxOvr2*1.15);
hSt.atk=Math.min(hSt.atk,_atkCap);
aSt.atk=Math.min(aSt.atk,_atkCap);
hSt.def=Math.min(hSt.def,_atkCap);
aSt.def=Math.min(aSt.def,_atkCap);
// Faza 1: 1-30' (neutralna)
const ph1H=bldEvs(h1,hSt.atk,aSt.def,aSt.gkOvr,hSc,true,'early');
const ph1A=bldEvs(a1,aSt.atk,hSt.def,hSt.gkOvr,aSc,false,'early');
// Faza 2: 31-60' (lepsza drużyna dominuje — dowolna, nie tylko klub gracza)
const domMod=Math.max(hStrTot,aStrTot)/(Math.min(hStrTot,aStrTot)+1);
const ph2HAtk=Math.round(hSt.atk*(hStrTot>aStrTot?1.0+domMod*0.03:1.0));
const ph2AAtk=Math.round(aSt.atk*(aStrTot>hStrTot?1.0+domMod*0.03:1.0));
const ph2H=bldEvs(h2,ph2HAtk,aSt.def,aSt.gkOvr,hSc,true,'mid');
const ph2A=bldEvs(a2,ph2AAtk,hSt.def,hSt.gkOvr,aSc,false,'mid');
// v198: CZERWONA KARTKA — oblicz h3fAdj/a3fAdj PRZED bldEvs fazy 3
const _allEarlyEvts=[...ph1H,...ph1A,...ph2H,...ph2A,...bldCards(allPl)];
const _redH=_allEarlyEvts.some(e=>(e.type==='red'||e.type==='red2y')&&e.isH===true);
const _redA=_allEarlyEvts.some(e=>(e.type==='red'||e.type==='red2y')&&e.isH===false);
const h3fAdj=_redH?Math.max(2,Math.round(h3f*0.80)):h3f;
const a3fAdj=_redA?Math.max(2,Math.round(a3f*0.80)):a3f;
// v214: AI dobiera zmianę taktyczną w 46' NATYCHMIAST, na podstawie wyniku po fazie 1+2 (przegrywa→attack, wygrywa→defend, remis→losowo counter/press)
const _halfHG=[...ph1H,...ph2H].filter(e=>e.type==='goal').length;
const _halfAG=[...ph1A,...ph2A].filter(e=>e.type==='goal').length;
const _aiHalfGoals=isMyH?_halfAG:_halfHG,_oppHalfGoals=isMyH?_halfHG:_halfAG;
function _pickAIShiftKey(aiGoals,oppGoals){
  if(aiGoals<oppGoals)return'attack';
  if(aiGoals>oppGoals)return'defend';
  return Math.random()<0.5?'counter':'press';
}
const _aiShiftKey=_pickAIShiftKey(_aiHalfGoals,_oppHalfGoals);
window._aiTacticalShift={...TACTICAL_SHIFT_DEFS[_aiShiftKey],key:_aiShiftKey,used:true};
// Faza 3 (61-90') NIE jest jeszcze budowana — czeka na rozstrzygnięcie zmiany taktycznej gracza
// (klik / timeout w next(), patrz _finalizeSecondHalf niżej). Bez tego shotMod/saveMod z wyboru
// w 46. minucie nigdy by nie trafiły do wyniku meczu — cały mecz był już rozstrzygnięty wcześniej.
let _ph3Built=false;
// v232: consumedCount — liczba zdarzeń już odtworzonych przez next() (idx2 w chwili wywołania).
// Dawny pełny resort CAŁEJ tablicy allEvts (już pokazane + jeszcze nie) potrafił po dołożeniu
// fazy 3 przesunąć nieodtworzone jeszcze zdarzenia PRZED wskaźnik idx2 (gol nigdy nieodtworzony
// na żywo, mimo że liczony w wyniku końcowym) albo pokazane zdarzenie z powrotem ZA idx2
// (duplikat w relacji) — patrz diagnoza rozjazdu wyniku "na boisku" vs w relacji pomeczowej.
// Zachowując prefiks 0..consumedCount-1 nietknięty, next() zawsze kończy z tym samym zestawem
// zdarzeń, na którym liczony jest wynik końcowy. Wywołania synchroniczne bez animacji
// (devSimMyMatch, diagnostyka w dev-mode.js) nie podają argumentu — 0 daje dawne zachowanie
// (nic nie zostało jeszcze "pokazane", więc pełny resort jest bezpieczny).
function _finalizeSecondHalf(consumedCount){
  if(_ph3Built)return;_ph3Built=true;
  const ph3H=bldEvs(h3fAdj,hSt.atk,aSt.def,aSt.gkOvr,hSc,true,'late',46);
  const ph3A=bldEvs(a3fAdj,aSt.atk,hSt.def,hSt.gkOvr,aSc,false,'late',46);
  const _cut=consumedCount||0;
  const _already=allEvts.slice(0,_cut);
  const _rest=allEvts.slice(_cut).concat(ph3H,ph3A).sort((a,b)=>a.min-b.min);
  allEvts=_already.concat(_rest);
  let hG3=0,aG3=0;allEvts.forEach(e=>{if(e.type==='goal'){if(e.isH)hG3++;else aG3++;}});
  fHG=hG3;fAG=aG3;
}
// Zdarzenia specjalne
const specialEvts=[];
// Narracja
if(_isDerby)specialEvts.push({min:r(5,15),type:'narration',
  text:_pickVar('match_derby_text'),isH:isMyH});
if(_redH)specialEvts.push({min:r(62,75),type:'narration',text:_pickVar('match_down_home'),isH:true});
if(_redA)specialEvts.push({min:r(62,75),type:'narration',text:_pickVar('match_down_away'),isH:false});
// Zmęczenie w 3. fazie — komunikat
if(avgPhy<45&&isMyH)specialEvts.push({min:r(65,80),type:'narration',text:_pickVar('match_fatigue_text'),isH:false});
// v198: TAKTYCZNA DECYZJA W POŁOWIE — event w 46. minucie
window._tacticalShift={actMod:1.0,shotMod:1.0,saveMod:1.0,used:false};
specialEvts.push({min:46,type:'tacticalChoice',isH:isMyH,
  text:t('match_halftime_narr')});
// Kontra gdy któraś z drużyn ma Instrukcję=Kontry (własna, nie tylko gracza)
if(hTac.instruction==='Kontry'&&Math.random()<0.3){
  const cScorer=hSc.length?hSc[Math.floor(Math.random()*hSc.length)]:null;
  if(cScorer)specialEvts.push({min:r(55,85),type:'narration',text:_pickVar('match_counter_text').replace('{name}',cScorer.last),isH:true});
}
if(aTac.instruction==='Kontry'&&Math.random()<0.3){
  const cScorer=aSc.length?aSc[Math.floor(Math.random()*aSc.length)]:null;
  if(cScorer)specialEvts.push({min:r(55,85),type:'narration',text:_pickVar('match_counter_text').replace('{name}',cScorer.last),isH:false});
}
// Pressing — dodatkowe faule (u drużyny, która faktycznie ma Wysoki pressing)
if(hTac.pressing==='Wysoki'&&Math.random()<0.4)specialEvts.push({min:r(20,70),type:'narration',text:_pickVar('match_press_text'),isH:true});
if(aTac.pressing==='Wysoki'&&Math.random()<0.4)specialEvts.push({min:r(20,70),type:'narration',text:_pickVar('match_press_text'),isH:false});
// Linia wysoka — spalony (u drużyny, która faktycznie ma Wysoką linię)
if(hMods.lineMod.offsideRisk>0&&Math.random()<hMods.lineMod.offsideRisk){
  const offsAtt=hSc.length?hSc[Math.floor(Math.random()*hSc.length)]:null;
  if(offsAtt)specialEvts.push({min:r(25,65),type:'narration',text:_pickVar('match_offside_text').replace('{name}',offsAtt.last),isH:true});
}
if(aMods.lineMod.offsideRisk>0&&Math.random()<aMods.lineMod.offsideRisk){
  const offsAtt=aSc.length?aSc[Math.floor(Math.random()*aSc.length)]:null;
  if(offsAtt)specialEvts.push({min:r(25,65),type:'narration',text:_pickVar('match_offside_text').replace('{name}',offsAtt.last),isH:false});
}
const spH=bldSetPieces(hSc,true);const spA=bldSetPieces(aSc,false);
// v214: faza 3 (ph3H/ph3A) dochodzi później przez _finalizeSecondHalf(), po rozstrzygnięciu zmiany taktycznej w 46'
allEvts=[...ph1H,...ph1A,...ph2H,...ph2A,...bldCards(allPl),...specialEvts,...spH,...spA,..._momEvts].sort((a,b)=>a.min-b.min);// v197: _momEvts = zdarzenia narracyjne momentum
// v232: fHG/fAG NIE są tu już liczone — w tym miejscu allEvts nie zawiera jeszcze fazy 3 (61-90'),
// więc byłby to wynik cząstkowy i tak zaraz nadpisywany przez _finalizeSecondHalf() (jedyne
// miejsce liczące wynik końcowy, patrz notatka v232 wyżej) — patrz diagnoza rozjazdu wyniku.
return{ratings,hSt,aSt,isMyH,hA,aA,finalizeSecondHalf:_finalizeSecondHalf,TACTICAL_SHIFT_DEFS};
}
function simMatch(){if(!G)return;const m=nextMatch();if(!m){advWeek();if(typeof flushPendingKronEvent==='function')flushPendingKronEvent();notif(t('match_notif_no_match_week'),'info');_releaseMatchLock();closePanel('p-match');fillMatch&&fillMatch();return;}const stC=mySt().length,lim=formationLimits(),req=1+lim.OBR+lim.POL+lim.NAP;if(stC<req){notif(t('match_notif_select_squad').replace('{n}',req-stC),'err');return;}const injuredStarters=mySt().filter(p=>p.injured||p.suspension>0);if(injuredStarters.length){injuredStarters.forEach(p=>{p.starter=false;});notif(t('match_notif_removed_injured').replace('{names}',injuredStarters.map(p=>p.name).join(', ')),'err');fillTacSquad();fillSquad();return;}
  // Ukryj przycisk taktyki pucharowej gdy mecz startuje
  var _ctb=document.getElementById('cup-tac-btn');if(_ctb)_ctb.style.display='none';
  const btn=document.getElementById('btn-sim');btn.disabled=true;matchInProgress=true;_engageMatchLock('live');saveGame('lock',true);document.getElementById('m-lock-note')&&(document.getElementById('m-lock-note').style.display='none');btn.style.display='none';btn.textContent=t('match_in_progress');const _mls3=document.getElementById('m-live-stats');if(_mls3)_mls3.style.display='block';const _s0=id=>document.getElementById(id);if(_s0('ls-poss-h')){_s0('ls-poss-h').textContent='50%';_s0('ls-poss-a').textContent='50%';}if(_s0('ls-poss-bar-h')){_s0('ls-poss-bar-h').style.flex='50';_s0('ls-poss-bar-a').style.flex='50';}if(_s0('ls-shots-h')){_s0('ls-shots-h').textContent='0';_s0('ls-shots-a').textContent='0';}if(_s0('ls-on-h')){_s0('ls-on-h').textContent='0';_s0('ls-on-a').textContent='0';}if(_s0('ls-fouls-h')){_s0('ls-fouls-h').textContent='0';_s0('ls-fouls-a').textContent='0';}// Ukryj wiersze statystyk — pojawią się przy pierwszej akcji
// v227: usunięty martwy zapis starego widżetu momentum (ls-momentum-row/ls-mom-h/ls-mom-a/
// ls-mom-label/ls-mom-needle/ls-events-chips) — te elementy nie istnieją już w index.html
// (usunięte przy przebudowie widoku meczu), więc to były bezużyteczne odwołania co mecz.
// window._momentum (DANE momentum, nie widżet) zostaje — nadal napędza narrację/kolory.
['ls-shots-row','ls-on-row','ls-fouls-row'].forEach(function(rid){var _rr=_s0(rid);if(_rr)_rr.style.display='none';});window._momentum={true:0,false:0};const _tbReset=_s0('ls-tactic-box');if(_tbReset)_tbReset.style.display='none';const _tnReset=_s0('ls-tactic-name');if(_tnReset)_tnReset.textContent='—';window._matchSubsOut=[];window._matchInjured=[];// v199: śledzenie zmian i kontuzji
const mlog=document.getElementById('mlog');if(mlog){mlog.innerHTML='';
  const _startD=document.createElement('div');
  _startD.className='mlog-e mlog-full summary-ev';
  _startD.innerHTML='<span class="mlog-min2">1&#x27;</span><span class="mlog-icon">&#9654;</span><span class="mlog-txt">'+_pickVar('match_start_label')+'</span>';
  mlog.appendChild(_startD);
}_subsLeft=3;const bsub=document.getElementById('btn-sub');if(bsub)bsub.style.opacity='1';
  // W TRAKCIE: ukryj prematch i tabs, pokaż tylko relację
  const _pre2=document.getElementById('m-prematch');if(_pre2)_pre2.style.display='none';
  // Przywróć górny scorebar
  const _scbar2=document.getElementById('m-scorebar');if(_scbar2)_scbar2.style.display='block';
  // v220: zakładki RELACJA/BOISKO widoczne już w trakcie meczu (BOISKO pokazuje oceny na żywo)
  const _tabs2=document.getElementById('m-tabs');if(_tabs2)_tabs2.style.display='flex';
  const _rel2=document.getElementById('m-relacja');if(_rel2){_rel2.classList.remove('on');_rel2.style.display='none';}
  const _oce2=document.getElementById('m-oceny');if(_oce2)_oce2.classList.remove('on');const mls2=document.getElementById('m-live-stats');if(mls2)mls2.style.display='block';const spb=document.getElementById('m-speed-btns');if(spb)spb.style.display='block';matchSpeed=3000;updateSpeedLabel();if(typeof _sizeMlog==='function')_sizeMlog();
// Upewnij się że przeciwnik ma wybrany skład
const _oppId2=m.h===G.myClubId?m.a:m.h;aiSelectSquad(_oppId2);
const hc=ALL_CLUBS.find(c=>c.id===m.h),ac=ALL_CLUBS.find(c=>c.id===m.a);m_hId=m.h;m_aId=m.a;
liveStats={hShots:0,aShots:0,hOn:0,aOn:0,hFouls:0,aFouls:0,hAct:0,aAct:0};
function upUI(min,hG,aG){
  const ls=document.getElementById('m-live-score');if(ls)ls.textContent=hG+' - '+aG;
  const pr=document.getElementById('m-progress');if(pr)pr.style.width=Math.round(min/90*100)+'%';
  const mi=document.getElementById('m-minute');if(mi)mi.textContent=min+"'"; 
  const rawPoss=liveStats.hAct/(liveStats.hAct+liveStats.aAct+1);
  const hp=Math.max(25,Math.min(75,Math.round(rawPoss*100)));
  const ap=100-hp;
  // v199: aktualizuj Wariant B dashboard stats
  const _s=id=>document.getElementById(id);
  // Posiadanie — pokaż dopiero gdy jest jakakolwiek akcja
  if((liveStats.hAct||0)+(liveStats.aAct||0)>0){var _pr=_s('ls-poss-row');if(_pr)_pr.style.display='block';}
  if(_s('ls-poss-h'))_s('ls-poss-h').textContent=hp+'%';
  if(_s('ls-poss-a'))_s('ls-poss-a').textContent=ap+'%';
  if(_s('ls-poss-bar-h'))_s('ls-poss-bar-h').style.flex=hp;
  if(_s('ls-poss-bar-a'))_s('ls-poss-bar-a').style.flex=ap;
  // Strzały
  const sh=liveStats.hShots||0,sa=liveStats.aShots||0,st=sh+sa||1;
  if(sh+sa>0){var _shr=_s('ls-shots-row');if(_shr)_shr.style.display='flex';}
  if(_s('ls-shots-h'))_s('ls-shots-h').textContent=sh;
  if(_s('ls-shots-a'))_s('ls-shots-a').textContent=sa;
  if(_s('ls-shots-bar-h'))_s('ls-shots-bar-h').style.flex=sh||1;
  if(_s('ls-shots-bar-a'))_s('ls-shots-bar-a').style.flex=sa||1;
  // Celne
  const oh=liveStats.hOn||0,oa=liveStats.aOn||0;
  if(oh+oa>0){var _onr=_s('ls-on-row');if(_onr)_onr.style.display='flex';}
  if(_s('ls-on-h'))_s('ls-on-h').textContent=oh;
  if(_s('ls-on-a'))_s('ls-on-a').textContent=oa;
  if(_s('ls-on-bar-h'))_s('ls-on-bar-h').style.flex=oh||1;
  if(_s('ls-on-bar-a'))_s('ls-on-bar-a').style.flex=oa||1;
  // Faule
  const fh=liveStats.hFouls||0,fa=liveStats.aFouls||0;
  if(fh+fa>0){var _fur=_s('ls-fouls-row');if(_fur)_fur.style.display='flex';}
  if(_s('ls-fouls-h'))_s('ls-fouls-h').textContent=fh;
  if(_s('ls-fouls-a'))_s('ls-fouls-a').textContent=fa;
  if(_s('ls-fouls-bar-h'))_s('ls-fouls-bar-h').style.flex=fh||1;
  if(_s('ls-fouls-bar-a'))_s('ls-fouls-bar-a').style.flex=fa||1;
  // Momentum (jeśli zainicjalizowany)
  if(window._momentum){
    const mh=window._momentum[true]||0,ma=window._momentum[false]||0;
    const mRow=_s('ls-momentum-row');
    if(mRow)mRow.style.display='block';
    // Wartości liczbowe — kolor zależny od siły
    const _mhCol=mh>=5?'var(--gb)':mh>=2?'#8ab88a':mh<=-5?'#888':mh<=-2?'#666':'var(--gr)';
    const _maCol=ma>=5?'var(--rd)':ma>=2?'#c06060':ma<=-5?'#888':ma<=-2?'#666':'var(--gr)';
    if(_s('ls-mom-h')){_s('ls-mom-h').textContent=(mh>=0?'+':'')+mh.toFixed(1);_s('ls-mom-h').style.color=_mhCol;}
    if(_s('ls-mom-a')){_s('ls-mom-a').textContent=(ma>=0?'+':'')+ma.toFixed(1);_s('ls-mom-a').style.color=_maCol;}
    // Igła — 50%=neutralna, mh > 0 przesuwa w prawo (mój klub), mh < 0 w lewo (rywal)
    const needlePos=50+mh*4;// każdy pkt = 4%, zakres -10..+10 → 10%..90%
    const _needle=_s('ls-mom-needle');
    if(_needle){
      _needle.style.left=Math.max(5,Math.min(95,needlePos))+'%';
      // Kolor igły zależny od strefy
      const _nc=mh>=5?'var(--gb)':mh<=-5?'var(--rd)':'var(--am)';
      _needle.style.background=_nc;
      _needle.style.boxShadow='0 0 5px '+_nc;
    }
    // Etykieta dynamiczna (Propozycja 2)
    const _lbl=_s('ls-mom-label');
    if(_lbl){
      let _lt,_lc;
      if(mh>=7){_lt=t('match_mom_dominates').replace('{club}',_s('m-home-name')?_s('m-home-name').textContent.replace(' ⭐',''):t('match_my_club_fallback'));_lc='var(--gb)';}
      else if(mh>=3){_lt=t('match_mom_leading').replace('{club}',_s('m-home-name')?_s('m-home-name').textContent.replace(' ⭐',''):t('match_my_club_fallback'));_lc='#8ab88a';}
      else if(mh<=-7){_lt=t('match_mom_opp_dominates');_lc='var(--rd)';}
      else if(mh<=-3){_lt=t('match_mom_opp_leading');_lc='#c06060';}
      else{_lt=t('match_momentum_even');_lc='var(--gr)';}
      _lbl.textContent=_lt;
      _lbl.style.color=_lc;
    }
  }
  // Kompatybilność wsteczna ze starymi IDs
  if(_s('ls-poss'))_s('ls-poss').textContent=hp+'% - '+ap+'%';
  if(_s('ls-shots'))_s('ls-shots').textContent=(liveStats.hShots||0)+' - '+(liveStats.aShots||0);
  if(_s('ls-on'))_s('ls-on').textContent=(liveStats.hOn||0)+' - '+(liveStats.aOn||0);
  if(_s('ls-fouls'))_s('ls-fouls').textContent=(liveStats.hFouls||0)+' - '+(liveStats.aFouls||0);
  // v220: odśwież akordeon statystyk + boisko z ocenami na żywo (ui/match-ui.js)
  if(typeof _refreshLiveBoisko==='function')_refreshLiveBoisko(min);
}
const VIVID=['Strata pi\u0142ki.','Przechwycone podanie!','Gro\u017ane do\u015brodkowanie!','Obro\u0144ca wybija pi\u0142k\u0119.','Szybki kontratak!','Zmiana rytmu gry.','Dobra obrona!','Kr\u00f3tka kombinacja.'];
const _mb=_buildMatchPhases(m);
const {ratings,hSt,aSt,isMyH,hA,aA,finalizeSecondHalf:_finalizeSecondHalf,TACTICAL_SHIFT_DEFS}=_mb;
// v220: ujawnij oceny na żywo — zakładka BOISKO w trakcie meczu (ui/match-ui.js) czyta je stąd
window._liveRatings=ratings;window._liveIsMyH=isMyH;
const lg=document.getElementById('mlog');let idx2=0;hG=0;aG=0;
// Reset liveStats — były wypełniane podczas bldEvs, teraz zerujemy
// i będą inkrementowane sukcesywnie w pętli next() przez bldEvs snapshoty
liveStats={hShots:0,aShots:0,hOn:0,aOn:0,hFouls:0,aFouls:0,hAct:0,aAct:0};
function next(){if(idx2>=allEvts.length){m.done=true;m.hg=fHG;m.ag=fAG;if(!m._isCup)updStand(m.h,m.a,fHG,fAG);// Injuries during match
  G.players.filter(p=>(p.clubId===m.h||p.clubId===m.a)&&p.starter&&!p.injured).forEach(p=>{
    const injMult=(p.traits&&p.traits.includes('wytrzymaly'))?0.7:1.0;
    const chance=0.01*(1+(100-p.phy)/100)*injMult;
    if(Math.random()<chance){
    applyInjury(p,true);
    if(!window._matchInjured)window._matchInjured=[];
    window._matchInjured.push(p.id);// v199: zapamiętaj kontuzję
  }
  });
  // Stats for ALL players in this match (my club + opponent)
  const _isCupMatch=!!(G._cupMatchActive);
  const matchClubs=[m.h, m.a];
  matchClubs.forEach(cid=>{
    G.players.filter(p=>p.clubId===cid&&p.starter).forEach(p=>{
      if(!_isCupMatch)p.st.m++;
      if(_isCupMatch&&p.clubId===G.myClubId){
        if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
        p.cupSt.m++;
      }
      if(p.clubId===G.myClubId){
        if(!p.trainMatches)p.trainMatches=0;p.trainMatches++;
        // Narastające zmeczenie po meczu
        if(!p.fatigue)p.fatigue=0;
        const phyBonus=(p.phy||50)/200; // wyzszy PHY = mniejsze zmeczenie
        p.fatigue=Math.round(Math.min(100,p.fatigue+Math.max(3,10-phyBonus*10)));
      }
    });
  });
  // Nalicz gole i asysty z allEvts (mecz gracza używa sid/assisterId)
  allEvts.filter(e=>e.type==='goal').forEach(e=>{
    const sc=G.players.find(x=>x.id===e.sid);
    if(sc){
      if(!_isCupMatch){if(!sc.st.g)sc.st.g=0;sc.st.g++;}
      if(_isCupMatch&&sc.clubId===G.myClubId){if(!sc.cupSt)sc.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!sc.cupSt.g)sc.cupSt.g=0;sc.cupSt.g++;}
    }
    const as=e.assisterId?G.players.find(x=>x.id===e.assisterId):null;
    if(as){
      if(!_isCupMatch){if(!as.st.a)as.st.a=0;as.st.a++;}
      if(_isCupMatch&&as.clubId===G.myClubId){if(!as.cupSt)as.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!as.cupSt.a)as.cupSt.a=0;as.cupSt.a++;}
    }
  });
  // v198: aktualizuj goalStreak dla zawodników mojego klubu
  if(!_isCupMatch){
    const _scorersThisMatch=new Set(allEvts.filter(e=>e.type==='goal').map(e=>e.sid));
    myPl().filter(p=>p.starter).forEach(p=>{
      if(_scorersThisMatch.has(p.id)){
        p.goalStreak=(p.goalStreak||0)+1;
      } else {
        p.goalStreak=0; // reset serii gdy mecz bez gola
      }
    });
  }
  // GK clean sheets for both teams
  const oppClubId=isMyH?m.a:m.h;
  const oppGK=G.players.find(p=>p.clubId===oppClubId&&p.pos==='GK'&&p.starter);
  if(oppGK){
    if(!oppGK.st.ga)oppGK.st.ga=0;if(!oppGK.st.cs)oppGK.st.cs=0;
    const oppGA=isMyH?fHG:fAG;
    oppGK.st.ga+=oppGA;if(oppGA===0)oppGK.st.cs++;
  }
  // Match skill growth: one random attr from active focus, age-based chance
  {
    const _matchGrowths=[];
    const tOpt4=G.trainFocusLock>0?TRAIN_OPTS.find(o=>o.k===G.training):null;
    const focusKeys=tOpt4?Object.keys(tOpt4.attrs):['sht','pas','def'];
    myPl().filter(p=>p.starter&&!p.injured).forEach(p=>{
      const chance=p.age<=20?0.20:p.age<=26?0.08:p.age<=29?0.03:0;
      if(chance>0&&Math.random()<chance){
        const attr=focusKeys[Math.floor(Math.random()*focusKeys.length)];
        const before=p[attr];
        const tr=(p.trainRate||1.0)+((p.traits&&p.traits.includes('pojety'))?0.2:0);
        // trainRate < 1.0 daje szansę poniżej 100% na gain +1
        if(Math.random()<tr){p[attr]=Math.min(99,p[attr]+1);}
        if(!p.trainMatches)p.trainMatches=0;p.trainMatches++;
        if(ovr(p)>=p.potential)p[attr]=before;
        else _matchGrowths.push({id:p.id,last:p.name.split(' ')[1],attr:attr});
      }
    });
    if(_matchGrowths.length>0){
      const msg=t('match_growth_msg').replace('{list}',_matchGrowths.map(g=>g.last+' +'+t('attr_'+g.attr)).join(', '));
      if(!G.news)G.news=[];
      G.news.unshift({msg,type:'ok',week:G.week,season:G.season,pids:_matchGrowths.map(g=>g.id)});
      if(G.news.length>30)G.news.pop();
      renderNews();
    }
  }
  allEvts.filter(e=>['yellow','red','red2y'].includes(e.type)&&e.isMy).forEach(e=>{
  const p=G.players.find(x=>x.id===e.sid);if(!p)return;
  if(e.type==='yellow'){
    if(!_isCupMatch){if(!p.st.yk)p.st.yk=0;p.st.yk++;}
    if(_isCupMatch){if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!p.cupSt.yk)p.cupSt.yk=0;p.cupSt.yk++;}
  }
  if(e.type==='red'||e.type==='red2y'){
    if(!_isCupMatch){if(!p.st.rk)p.st.rk=0;p.st.rk++;}
    if(_isCupMatch){if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!p.cupSt.rk)p.cupSt.rk=0;p.cupSt.rk++;}    // Remove from field for rest of match
    p.starter=false;
    // Reduce team strength after red card (-15% to all stats)
    const redSt=p.clubId===m.h?hSt:aSt;
    redSt.atk=Math.round(redSt.atk*0.85);
    redSt.mid=Math.round(redSt.mid*0.85);
    redSt.def=Math.round(redSt.def*0.85);
    redSt.total=Math.round((redSt.total||30)*0.85);
    // Suspension: 1-3 matches
    const susGames=r(1,3);
    if(!p.suspension)p.suspension=0;
    p.suspension+=susGames;
    notif(t('match_notif_suspended').replace('{name}',p.name).replace('{n}',susGames),'err');addNews(t('news_red_card').replace('{name}',p.name).replace('{n}',susGames),'card');
  }
  });
if(m.h===G.myClubId){const inc=r(200,800);G.budget+=inc;G.fin.tickets+=inc;}
const iW=(m.h===G.myClubId&&fHG>fAG)||(m.a===G.myClubId&&fAG>fHG),iL=(m.h===G.myClubId&&fHG<fAG)||(m.a===G.myClubId&&fAG<fHG);
if(!G.records)G.records={maxWinStreak:0,maxUnbeatenStreak:0,maxLoseStreak:0,unbeatenStreak:0,bestWin:null,maxGoalsSeason:0,minConcededSeason:99};
// Aktualizuj serie PRZED zapisem rekordu
if(iW){
  if(!G.winStreak)G.winStreak=0;G.winStreak++;G.loseStreak=0;
  if(!G.results)G.results=[];G.results.push('W');if(G.results.length>10)G.results.shift();
  G.records.maxWinStreak=Math.max(G.records.maxWinStreak||0,G.winStreak);
  G.records.unbeatenStreak=(G.records.unbeatenStreak||0)+1;
  G.records.maxUnbeatenStreak=Math.max(G.records.maxUnbeatenStreak||0,G.records.unbeatenStreak);
}else if(iL){
  if(!G.loseStreak)G.loseStreak=0;G.loseStreak++;G.winStreak=0;
  if(!G.results)G.results=[];G.results.push('L');if(G.results.length>10)G.results.shift();
  G.records.unbeatenStreak=0;
  G.records.maxLoseStreak=Math.max(G.records.maxLoseStreak||0,G.loseStreak);
}else{
  G.winStreak=0;G.loseStreak=0;
  if(!G.results)G.results=[];G.results.push('D');if(G.results.length>10)G.results.shift();
  G.records.unbeatenStreak=(G.records.unbeatenStreak||0)+1;
  G.records.maxUnbeatenStreak=Math.max(G.records.maxUnbeatenStreak||0,G.records.unbeatenStreak);
}
const myG2=m.h===G.myClubId?fHG:fAG,oppG2=m.h===G.myClubId?fAG:fHG;
const oppClub2=ALL_CLUBS.find(c=>c.id===(m.h===G.myClubId?m.a:m.h));
if(iW&&(!G.records.bestWin||myG2-oppG2>G.records.bestWin.diff))G.records.bestWin={myG:myG2,oppG:oppG2,diff:myG2-oppG2,opp:oppClub2?oppClub2.n:'?',season:G.season,rnd:m.rnd};
if(!G.allTimeStats)G.allTimeStats={players:{},bestSeller:null,bestBuyer:null};
allEvts.filter(ev=>ev.type==='goal').forEach(ev=>{
  // Gole
  const sc3=G.players.find(x=>x.id===ev.sid);
  if(sc3&&sc3.clubId===G.myClubId){
    if(!G.allTimeStats.players[sc3.id])G.allTimeStats.players[sc3.id]={id:sc3.id,name:sc3.name,goals:0,assists:0,matches:0};
    G.allTimeStats.players[sc3.id].id=sc3.id;
    G.allTimeStats.players[sc3.id].goals++;G.allTimeStats.players[sc3.id].name=sc3.name;
  }
  // Asysty
  if(ev.assisterId){
    const as3=G.players.find(x=>x.id===ev.assisterId);
    if(as3&&as3.clubId===G.myClubId){
      if(!G.allTimeStats.players[as3.id])G.allTimeStats.players[as3.id]={id:as3.id,name:as3.name,goals:0,assists:0,matches:0};
      G.allTimeStats.players[as3.id].id=as3.id;
      G.allTimeStats.players[as3.id].assists++;G.allTimeStats.players[as3.id].name=as3.name;
    }
  }
});
myPl().filter(p=>p.starter&&!p.injured).forEach(p=>{
  if(!G.allTimeStats.players[p.id])G.allTimeStats.players[p.id]={id:p.id,name:p.name,goals:0,assists:0,matches:0};
  const _isAcadDebut=p.fromAcademy&&G.allTimeStats.players[p.id].matches===0;
  G.allTimeStats.players[p.id].matches++;
  G.allTimeStats.players[p.id].name=p.name;
  if(_isAcadDebut)pushTimeline('academy_debut','🎓',t('tl_academy_debut').replace('{name}',p.name),{pid:p.id,sentiment:'pos',weight:20});
});
if(!G.reputation)G.reputation=10;if(!G.frequency)G.frequency=40;
// v228: snapshot PRZED zmianą — do wyświetlenia delty na ekranie podsumowania meczu
const _repBefore0=G.reputation,_freqBefore0=G.frequency;
// winStreak/loseStreak już zaktualizowane wyżej - tylko frekwencja i reputacja
if(iW){G.frequency=Math.min(100,G.frequency+5);
  // Lider: forma drużyny +2
  if(myPl().some(p=>p.starter&&p.traits&&p.traits.includes('lider')))
    myPl().forEach(p=>{p.form=Math.min(99,p.form+2);});
  // Pewny siebie: OVR bonus przy serii
  if(G.winStreak>=3)
    myPl().filter(p=>p.starter&&p.traits&&p.traits.includes('pewny_siebie')).forEach(p=>{p.form=Math.min(99,p.form+2);});
  if(G.winStreak>=3){G.frequency=Math.min(100,G.frequency+5);changeReputation(2,t('rep_reason_match_win_streak'));}
  else{changeReputation(1,t('rep_reason_match_win'));}}
else if(iL){G.frequency=Math.max(10,G.frequency-3);if(G.loseStreak>=3)G.frequency=Math.max(10,G.frequency-5);
  // Zimna krew: mniejszy spadek formy
  myPl().filter(p=>p.starter&&p.traits&&p.traits.includes('zimna_krew')).forEach(p=>{p.form=Math.min(99,p.form+2);});
  // Nerwowy: dodatkowy spadek
  myPl().filter(p=>p.starter&&p.traits&&p.traits.includes('nerwowy')).forEach(p=>{p.form=Math.max(5,p.form-2);});
}
else{G.frequency=Math.min(100,G.frequency+1);}
// v228: delta reputacji/frekwencji z TEGO meczu — czyta ekran podsumowania (postMatch() w match-post.js)
window._matchRepDelta=G.reputation-_repBefore0;window._matchFreqDelta=G.frequency-_freqBefore0;
// Form update for BOTH teams after match
  const hWon2=fHG>fAG,aWon2=fAG>fHG;
  G.players.filter(p=>p.clubId===m.h&&p.starter).forEach(p=>{
    if(hWon2)p.form=Math.min(100,p.form+1);else if(aWon2)p.form=Math.max(30,p.form-1);
  });
  G.players.filter(p=>p.clubId===m.a&&p.starter).forEach(p=>{
    if(aWon2)p.form=Math.min(100,p.form+1);else if(hWon2)p.form=Math.max(30,p.form-1);
  });
  // ── ŻYWY ŚWIAT AI: forma i seria wyników rywala, gdy gra z graczem ───────
  (function(){
    const aiClub=(m.h===G.myClubId)?ac:hc;
    if(!aiClub||!aiClub.ai)return;
    const cai=aiClub.ai;
    const aiWon=(m.h===G.myClubId)?aWon2:hWon2;
    const aiLost=(m.h===G.myClubId)?hWon2:aWon2;
    cai.form=Math.max(0,Math.min(100,(typeof cai.form==='number'?cai.form:50)+(aiWon?3:aiLost?-3:0)));
    if(!cai._streak)cai._streak=0;
    if(aiWon)cai._streak=cai._streak>0?cai._streak+1:1;
    else if(aiLost)cai._streak=cai._streak<0?cai._streak-1:-1;
    else cai._streak=0;
    if(Math.abs(cai._streak)===4){
      const isWinStreak=cai._streak>=4;
      const key=isWinStreak?'world_news_win_streak':'world_news_loss_streak';
      addWorldNews(t(key).replace('{club}',aiClub.n).replace('{n}',Math.abs(cai._streak)),isWinStreak?'streak_win':'streak_loss',aiClub.id);
    }
  })();
  simOthers();
  if(!G._cupMatchActive){
    calcFinalRatings(ratings,iW,iL,fHG,fAG,false);
    G.mHist.push({rnd:m.rnd,season:G.season,hn:hc.n,an:ac.n,hg:fHG,ag:fAG,isMyH:isMyH,g:allEvts.filter(e=>e.type==='goal').map(e=>({m:e.min,s:e.sid,a:e.assisterId,h:e.isH?1:0})),c:allEvts.filter(e=>['yellow','red','red2y'].includes(e.type)).map(e=>({m:e.min,id:e.sid,t:e.type==='yellow'?'y':'r'})),st:[liveStats.hShots||0,liveStats.aShots||0,liveStats.hOn||0,liveStats.aOn||0],r:Object.fromEntries(myPl().filter(p=>p.starter).map(p=>[p.id,Math.round(((ratings&&ratings[p.id]&&ratings[p.id].rating)||6)*10)/10]))});
    if(document.getElementById('dc-klub')&&document.getElementById('dc-klub').style.display!=='none')dcRenderKlub();
    postMatch(hc,ac,fHG,fAG,iW,iL,ratings,hA,aA,false,true);
  }
  // ── PUCHAR: jeśli to tydzień pucharowy i gracz ma pending mecz pucharowy ─
  if(G.cup&&G.cup.pendingMyMatch&&!G._cupMatchActive){
    // Mecz ligowy skończony — teraz aktywuj mecz pucharowy
    const _pm=G.cup.pendingMyMatch;
    const _prIdx=G.cup.pendingRound;
    const _pIsH=G.cup.pendingIsMyH;
    const _oppEnt=_pIsH?_pm.a:_pm.h;
    const _oppC=ALL_CLUBS.find(c=>c.id===_oppEnt.cid)||{n:_oppEnt.name};
    G._cupMatchActive={match:_pm,rIdx:_prIdx,isMyH:_pIsH,oppCid:_oppEnt.cid};
    upUI(90,fHG,fAG);btn.style.display='block';btn.textContent=t('match_finished_btn');btn.style.opacity='0.5';matchInProgress=false;G._matchJustFinished=true;
    const mtabsEnd=document.getElementById('m-tabs');if(mtabsEnd)mtabsEnd.style.display='flex';// v199: log zostaje w #mlog wewnątrz m-speed-btns — zostaje widoczny po meczu
    // v220: po meczu widok zostaje na RELACJI — nie przełączamy automatycznie na BOISKO
    // v230: mecz ligowy w tygodniu z dubletem (liga+puchar) dostaje TAKIE SAMO podsumowanie
    // jak każdy inny mecz — zamiast auto-przejścia po setTimeout, gracz klika WRÓĆ→DALEJ
    // (continueFromMatchSummary() w match-ui.js), która dopiero wtedy aktywuje analizę
    // przedmeczową pucharu (window._pendingCupTransition). window._lastMatchSummary jest
    // już ustawione przez postMatch() wyżej (linia 962) — tu tylko pokazujemy WRÓĆ i czekamy.
    const bb1=document.getElementById('btn-match-back');if(bb1){bb1.style.display='block';bb1.style.background='var(--gb)';bb1.style.color='#000';bb1.textContent=t('match_end_btn');}
    window._pendingCupTransition={oppName:_oppC.n};
    _engageMatchLock('summary');
    return;
  }
  // ── FIX v255: po meczu pucharowym symuluj pominięty mecz ligowy gracza ──
  // Gdy gracz grał puchar bez wcześniejszego meczu ligowego w tej rundzie,
  // mecz ligowy na G.round pozostaje done:false — trzeba go rozegrać za gracza
  // jako mecz AI (walkower/symulacja), żeby tabela miała równą liczbę meczy.
  if(G._cupMatchActive){
    const _skippedLg=G.schedule&&G.schedule.find(function(mx){return mx.rnd===G.round&&!mx.done&&(mx.h===G.myClubId||mx.a===G.myClubId);});
    if(_skippedLg){
      // Symuluj jako mecz AI (obie strony traktowane jak AI)
      const _shSq=G.players.filter(function(p){return p.clubId===_skippedLg.h&&p.starter;});
      const _saSq=G.players.filter(function(p){return p.clubId===_skippedLg.a&&p.starter;});
      const _shOvr=_shSq.length?_shSq.reduce(function(s,p){return s+ovr(p);},0)/_shSq.length:25;
      const _saOvr=_saSq.length?_saSq.reduce(function(s,p){return s+ovr(p);},0)/_saSq.length:25;
      const _sLam=function(o){return 0.35+(Math.min(o,85)/100)*1.40;};
      const _sPois=function(lam){var g=0,p=Math.exp(-lam),s=p;var u=Math.random();while(u>s&&g<12){g++;p*=lam/g;s+=p;}return g;};
      const _shG=_sPois(_sLam(_shOvr)*1.07);
      const _saG=_sPois(_sLam(_saOvr));
      _skippedLg.hg=_shG;_skippedLg.ag=_saG;_skippedLg.done=true;
      // Aktualizuj standing ligi gracza
      const _sst=G.standing||G.allStandings[G.myLeague];
      if(_sst){
        const _shSt=_sst.find(function(e){return e.cid===_skippedLg.h;});
        const _saSt=_sst.find(function(e){return e.cid===_skippedLg.a;});
        if(_shSt&&_saSt){
          _shSt.p++;_saSt.p++;_shSt.gf+=_shG;_shSt.ga+=_saG;_saSt.gf+=_saG;_saSt.ga+=_shG;
          if(_shG>_saG){_shSt.w++;_shSt.pts+=3;_saSt.l++;}
          else if(_shG<_saG){_saSt.w++;_saSt.pts+=3;_shSt.l++;}
          else{_shSt.d++;_saSt.d++;_shSt.pts++;_saSt.pts++;}
        }
      }
      addNews(t('news_league_skipped').replace('{hg}',_skippedLg.hg).replace('{ag}',_skippedLg.ag).replace('{n}',G.round),'info');
    }
  }
  advWeek();upUI(90,fHG,fAG);btn.style.display='block';btn.textContent=t('match_finished_btn');btn.style.opacity='0.5';matchInProgress=false;G._matchJustFinished=true;// v199: blokuj auto-reload fillMatch
  // ── PUCHAR: rozstrzygnij mecz gracza jeśli aktywny (mecz pucharowy) ──
  const _wasCupMatch=!!(G._cupMatchActive);
  if(G._cupMatchActive){
    const _cmyG=isMyH?fHG:fAG,_coppG=isMyH?fAG:fHG;
    resolveCupMyMatch(_cmyG,_coppG);
    // FIX: finał pucharu rozegrany poza harmonogramem ligi (tydzień 33) — advWeek()
    // powyżej wstrzymał koniec sezonu, bo mecz był jeszcze nierozstrzygnięty
    // (patrz week-progress.js::finalizeSeasonEnd). Teraz, gdy wynik jest już znany,
    // trzeba domknąć sezon od razu — kolejny advWeek() może się już nie zdarzyć.
    finalizeSeasonEnd();
  }
  // PO MECZU: pokaż zakładki RELACJA + BOISKO — v220: zostajemy na RELACJI, bez auto-przełączania
  const mtabsEnd=document.getElementById('m-tabs');if(mtabsEnd)mtabsEnd.style.display='flex';// v199: log zostaje w #mlog wewnątrz m-speed-btns — zostaje widoczny po meczu
  // Zapisz gole/asysty z meczu i oznacz gorących zawodników
  myPl().forEach(function(p){
    const rat=ratings&&ratings[p.id];
    if(rat){p.matchGoals=rat.goals||0;p.matchAssists=rat.assists||0;}
    const contrib=(p.matchGoals||0)+(p.matchAssists||0);
    if(contrib>=3&&!p.injured){
      p._hot=true;p._hotWeeks=2;
      // HOT: jeśli okno transferowe otwarte — generuj niespodziewaną ofertę zamiast pustego newsa
      if(isTransferWindow&&isTransferWindow().open){
        const _clubs=(G.leagues||[]).flatMap(l=>l.clubs||[]).filter(c=>c.id!==G.myClubId);
        const _buyer=_clubs[Math.floor(Math.random()*_clubs.length)];
        const _hotPrice=Math.round(calcValueDynamic(p)*1.20/500)*500;
        if(_buyer&&(!G.pendingOffers||!G.pendingOffers.find(x=>x.pid===p.id))){
          if(!G.pendingOffers)G.pendingOffers=[];
          G.pendingOffers.push({pid:p.id,price:_hotPrice,clubId:_buyer.id,clubName:_buyer.n});
          addNews(t('news_tr_hot_offer').replace('{name}',p.name).replace('{price}',fmtVal(_hotPrice)).replace('{buyer}',_buyer.n),'info');
          G.news[0].action='sell_offer';G.news[0].actionLabel=t('news_tr_action_sell');G.news[0].pid=p.id;
        }
      }
      // poza oknem — cichy wzrost wartości, bez newsa
    }
  });
  const _relEnd=document.getElementById('m-relacja');if(_relEnd&&!_relEnd.classList.contains('on')){}const bb2=document.getElementById('btn-match-back');if(bb2){bb2.style.display='block';bb2.style.background='var(--gb)';bb2.style.color='#000';bb2.textContent=t('match_end_btn');}
  // v228: blokada wyjścia z meczu zostaje aktywna przez ekran podsumowania — zwalniana dopiero
  // przyciskiem "DALEJ" na tym ekranie (continueFromMatchSummary() w match-ui.js), nie tutaj.
  _engageMatchLock('summary');
  updateHdr();if(_wasCupMatch){postMatch(hc,ac,fHG,fAG,iW,iL,ratings,hA,aA,true);}const _myPos=G.standing?([...G.standing].sort((a,b)=>b.pts-a.pts).findIndex(s=>s.cid===G.myClubId)+1):0;const _opp=isMyH?ac.n:hc.n;addNews((iW?t('news_match_win'):iL?t('news_match_loss'):t('news_match_draw')).replace('{score}',fHG+'-'+fAG).replace('{opp}',_opp).replace('{pos}',_myPos),iW?'ok':iL?'err':'info');notif((iW?t('match_toast_win'):iL?t('match_toast_loss'):t('match_toast_draw'))+' '+fHG+'-'+fAG,iW?'ok':iL?'err':'');return;}
const ev=allEvts[idx2++];
      // Inkrementuj liveStats sukcesywnie dla każdego zdarzenia
      const _isH=ev.isH;
      // Strzały: shot(niecelny/obroniony) + goal + set-pieces
      if(ev.type==='shot'){if(_isH){liveStats.hShots++;if(ev.onTarget)liveStats.hOn++;}else{liveStats.aShots++;if(ev.onTarget)liveStats.aOn++;}}
      if(ev.type==='goal'){if(_isH){liveStats.hShots++;liveStats.hOn++;hG++;}else{liveStats.aShots++;liveStats.aOn++;aG++;}}
      // Faule: kartki
      if(ev.type==='yellow'||ev.type==='red'||ev.type==='red2y'){const _isMy=ev.isMy;if(_isMy)liveStats.hFouls++;else liveStats.aFouls++;}
      // Akcje (posiadanie): każde zdarzenie z przypisaną drużyną
      if(_isH!==undefined&&ev.type!=='momupdate'){if(_isH)liveStats.hAct++;else liveStats.aAct++;}
      // v199: odtwarzaj snapshot momentum z momentu generowania
      if(ev._momSnap&&window._momentum){
        window._momentum[true]=ev._momSnap.h;
        window._momentum[false]=ev._momSnap.a;
      }
      upUI(ev.min,hG,aG);
      const premEl2=document.getElementById('m-prematch');if(premEl2)premEl2.style.display='none';
      if(lg){
        const isMy=ev.isH===isMyH;
        const d=document.createElement('div');
        // Dobierz klasę CSS per typ i drużyna
        // v199: momupdate to cichy event — tylko aktualizuje igłę, nie wchodzi do logu
        if(ev.type==='momupdate'){setTimeout(next,matchSpeed===0?1:50);return;}
        let cls='mlog-e ';
        let sideCls='mlog-full';// v: dwutorowa oś czasu — RYWAL=lewa kolumna, TY=prawa; wiersze bez jednoznacznej strony (gole, systemowe) zostają na pełną szerokość
        let icon='▶'; let txt=ev.text||'';
        if(ev.type==='goal'){
          cls+=isMy?'goal-my':'goal-opp';
          icon=isMy?'⚽':'⚽';
          const scorerP=G.players.find(x=>x.id===ev.sid);
          const _acadScorer=scorerP&&scorerP.fromAcademy;const _acadDebH3=_acadScorer&&scorerP.history?scorerP.history.find(function(h){return h.fromAcademy;}):null;const scorerSpan=scorerP?'<span style="cursor:pointer;text-decoration:underline;color:'+(isMy?'var(--gb)':'var(--rd)')+'" onclick="event.stopPropagation();showById('+ev.sid+')">'+ev.scorer+(_acadScorer?' <span style="color:#9c27b0">🎓</span>':'')+'</span>':ev.scorer;
          let assistStr='';
          if(ev.assister){
            // v221: dopisek asysty sformalizowany do klucza i18n match_assist_suffix
            // (dawniej literał "(as. ...)" na sztywno, tylko PL) — {name} zastępujemy linkiem do gracza
            const assP=ev.assisterId?G.players.find(x=>x.id===ev.assisterId):null;
            const _assLinked=assP?'<span style="cursor:pointer;text-decoration:underline;color:var(--wh)" onclick="event.stopPropagation();showById('+assP.id+')">'+ev.assister+'</span>':ev.assister;
            const _assParts=t('match_assist_suffix').split('{name}');
            assistStr=' <span style="color:var(--gr)">'+_assParts[0]+_assLinked+(_assParts[1]||'')+'</span>';
          }
          const spLabel=ev.setpiece==='corner'?' <span style="color:var(--gr)">'+t('match_sp_corner')+'</span>':ev.setpiece==='freekick'?' <span style="color:var(--gr)">'+t('match_sp_freekick')+'</span>':ev.setpiece==='penalty'?' <span style="color:var(--gr)">'+t('match_sp_penalty')+'</span>':'';
          txt='<b>'+_pickVar('match_goal_label')+' '+hG+'-'+aG+'</b> '+scorerSpan+assistStr+spLabel+(_acadScorer&&isMy&&_acadDebH3?'<div style="font-size:var(--fs-dense);color:#9c27b0;margin-top:2px">'+t('match_academy_debut_badge').replace('{season}',_acadDebH3.season).replace('{a}',_acadDebH3.ovr).replace('{b}',ovr(scorerP))+'</div>':'');
        } else if(ev.type==='shot'){
          sideCls=isMy?'mlog-mine':'mlog-opp';
          cls+=isMy?'shot-my':'shot-opp'; icon=isMy?'→':'←';
        } else if(ev.type==='narration'){
          sideCls=isMy?'mlog-mine':'mlog-opp';
          cls+=isMy?'narr-my':'narr-opp'; icon=isMy?'●':'●';
        } else if(ev.type==='corner'||ev.type==='freekick'){
          sideCls=isMy?'mlog-mine':'mlog-opp';
          cls+=isMy?'setpiece-my':'setpiece-opp'; icon='🚩';
        } else if(ev.type==='penalty_saved'){
          sideCls=isMy?'mlog-opp':'mlog-mine';
          cls+=isMy?'setpiece-opp':'setpiece-my'; icon='🧤';
        } else if(ev.type==='yellow'){
          sideCls=ev.isMy?'mlog-mine':'mlog-opp';
          cls+='card-ev'; icon='🟡';
        } else if(ev.type==='red'||ev.type==='red2y'){
          sideCls=ev.isMy?'mlog-mine':'mlog-opp';
          cls+='card-red'; icon='🔴';
        } else if(ev.type==='tacticalChoice'&&!window._tacticalShift.used&&matchSpeed>0){
          cls+='narr-my'; icon='⚙️';
          const _tBtns=[
            {key:'attack', label:t('match_tac_attack_label'), desc:t('match_tac_attack_desc'), ...TACTICAL_SHIFT_DEFS.attack},
            {key:'counter',label:t('match_tac_counter_label'),desc:t('match_tac_counter_desc'),...TACTICAL_SHIFT_DEFS.counter},
            {key:'defend', label:t('match_tac_defend_label'), desc:t('match_tac_defend_desc'), ...TACTICAL_SHIFT_DEFS.defend},
            {key:'press',  label:t('match_tac_press_label'),  desc:t('match_tac_press_desc'),  ...TACTICAL_SHIFT_DEFS.press}
          ];
          const _tacId='tac-countdown-'+Date.now();
          txt='<span style="color:var(--am);font-weight:700;font-size:var(--fs-micro)">'+t('match_halftime_title')+'</span><br><span style="font-size:var(--fs-dense);color:var(--gr)">'+t('match_halftime_subtitle')+'</span>'
            +'<div style="display:flex;align-items:center;gap:8px;margin:5px 0">'
            +'<div style="flex:1;height:4px;background:#1a1a1a;border:1px solid var(--gl)"><div id="'+_tacId+'-bar" style="height:100%;background:var(--am);width:100%;transition:width 1s linear"></div></div>'
            +'<span style="font-size:var(--fs-body);color:var(--am);min-width:28px;text-align:right"><b id="'+_tacId+'-sec">10</b>s</span>'
            +'</div>'
            +'<div style="display:flex;flex-wrap:wrap;gap:4px">'+ 
            _tBtns.map(b=>'<button id="tbtn-'+b.key+'" onclick="_applyTactic(\''+b.key+'\','+b.shotMod+','+b.saveMod+')" style="padding:6px 10px;font-size:var(--fs-meta);background:#0d1f0d;color:var(--am);border:1px solid var(--gl);border-radius:2px;cursor:pointer;text-align:left;min-width:140px">'+b.label+'<br><span style=\"color:#8ab88a;font-size:var(--fs-dense)\">'+b.desc+'</span></button>').join('')
            +'</div>';
          // Uruchom odliczanie po wyrenderowaniu
          window._tacTimerId=setTimeout(function _startTacTimer(){
            const _secEl=document.getElementById(_tacId+'-sec');
            const _barEl=document.getElementById(_tacId+'-bar');
            if(!_secEl)return;
            let _secs=10;
            if(_barEl)_barEl.style.width='100%';
            window._tacCountdown=setInterval(function(){
              if(window._tacticalShift&&window._tacticalShift.used){
                clearInterval(window._tacCountdown);return;
              }
              _secs--;
              if(_secEl)_secEl.textContent=_secs;
              if(_barEl)_barEl.style.width=(_secs*10)+'%';
              if(_secs<=0){
                clearInterval(window._tacCountdown);
                // Czas minął — neutralna taktyka i kontynuuj mecz
                if(!window._tacticalShift.used){
                  window._tacticalShift={shotMod:1.0,saveMod:1.0,used:true};
                  const mlog2=document.getElementById('mlog');
                  if(mlog2){const _d2=document.createElement('div');_d2.style.cssText='padding:3px 14px;font-size:var(--fs-dense);color:var(--gr);border-bottom:1px solid #0d1f0d';_d2.textContent=t('match_halftime_over');mlog2.prepend(_d2);}
                }
                window._tacResumeNext&&window._tacResumeNext();
              }
            },1000);
          },50);
        }
        d.className=cls+' '+sideCls;
        d.innerHTML=sideCls==='mlog-full'
          ? '<span class="mlog-min2">'+ev.min+'\'</span><span class="mlog-icon">'+icon+'</span><span class="mlog-txt">'+txt+'</span>'
          : '<span class="mlog-min2">'+ev.min+'\'</span><span class="mlog-side"><span class="mlog-icon">'+icon+'</span><span class="mlog-txt">'+txt+'</span></span>';
        // v220: relacja najnowsze na górze — dokładamy na początek, nie na koniec
        lg.prepend(d);
        lg.scrollTop=0;
        // v199: chipsy na prawej karcie — dodaj TERAZ (sync z logiem)
        if(ev.type==='goal'){
          _addEventChip(ev.isH===isMyH,'⚽',ev.min);// v199: isMyH=czy mój klub jest gospodarzem
        } else if(ev.type==='yellow'){
          _addEventChip(ev.isMy,'🟡',ev.min);
        } else if(ev.type==='red'||ev.type==='red2y'){
          _addEventChip(ev.isMy,'🟥',ev.min);
        } else if(ev.type==='sub'){
          _addEventChip(ev.isMy,'🔄',ev.min);
        } else if(ev.type==='tacticalChoice'){
          _addEventChip(true,'⚙️',ev.min);
        }
      }
// v198/v214: tacticalChoice wstrzymuje mecz na 10s odliczania — a po rozstrzygnięciu (klik/timeout)
// dopiero teraz budujemy fazę 3, żeby wybrany shotMod/saveMod faktycznie wpłynął na wynik
if(ev.type==='tacticalChoice'&&!window._tacticalShift.used&&matchSpeed>0){
  // Zapisz callback — odliczanie wywoła go po 10s lub po wyborze gracza
  window._tacResumeNext=function(){window._tacResumeNext=null;_finalizeSecondHalf(idx2);setTimeout(next,matchSpeed===0?1:300);};
  // NIE wywołuj setTimeout(next,...) — czekamy na odliczanie
} else if(ev.type==='tacticalChoice'){
  // Tryb "pomiń" (matchSpeed===0) — bez UI, neutralny wybór gracza (jeśli jeszcze nierozstrzygnięty), buduj fazę 3 od razu
  if(!window._tacticalShift.used)window._tacticalShift={shotMod:1.0,saveMod:1.0,used:true};
  _finalizeSecondHalf(idx2);
  setTimeout(next,matchSpeed===0?1:matchSpeed*0.7);
} else {
  setTimeout(next,matchSpeed===0?1:ev.type==='goal'?matchSpeed*1.5:
  ev.type==='red'?matchSpeed*1.2:ev.type==='yellow'?matchSpeed:matchSpeed*0.7);
}}
setTimeout(next,300);}

