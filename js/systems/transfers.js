const DEMAND_TYPES=[
  {id:'salary',    icon:'[PLN]', labelKey:'tr_demand_salary_label',      descFn:function(p,G2){const min=Math.round((p.salary*1.15)/50)*50;return{text:t('tr_demand_salary_text').replace('{min}',fmt(min)),met:(p._ofS||0)>=min};}},
  {id:'contract',  icon:'[KNT]', labelKey:'tr_demand_contract_label',    descFn:function(p,G2){const min=p.age<=25?3:2;return{text:t('tr_demand_contract_text').replace('{n}',min),met:(p._ofC||0)>=min};}},
  {id:'starter',   icon:'[GRA]', labelKey:'tr_demand_starter_label',    descFn:function(p,G2){return{text:t('tr_demand_starter_text'),met:!!(p._ofSt)};}},
  {id:'ambition',  icon:'[AMB]', labelKey:'tr_demand_ambition_label',     descFn:function(p,G2){const need=Math.max(1,(G2.myLeague||8)-1);return{text:t('tr_demand_ambition_text').replace('{n}',need),met:(G2.myLeague||8)<=need+1};}},
  {id:'develop',   icon:'[CEN]', labelKey:'tr_demand_develop_label',     descFn:function(p,G2){return{text:t('tr_demand_develop_text'),met:!!(G2.trainingCenter&&G2.trainingCenter.level>0)};}},
  {id:'reputation',icon:'[REP]', labelKey:'tr_demand_reputation_label',   descFn:function(p,G2){return{text:t('tr_demand_reputation_text').replace('{n}',p._repNeed),met:(G2.reputation||30)>=(p._repNeed||50)};}},
  // TOP4 nowe warunki
  {id:'signing',   icon:'[SIG]', labelKey:'tr_demand_signing_label', descFn:function(p,G2){const bon=Math.round(p.salary*2/500)*500;return{text:t('tr_demand_signing_text').replace('{val}',fmt(bon)),met:!!(p._ofSig),bonus:bon};}},
  {id:'league_min',icon:'[LIG]', labelKey:'tr_demand_league_min_label',   descFn:function(p,G2){const need=Math.max(1,(p._ligaNeed||Math.min(7,G2.myLeague||8)));return{text:t('tr_demand_league_min_text').replace('{n}',need),met:(G2.myLeague||8)<=need};}},
  {id:'bonus_perf',icon:'[BON]', labelKey:'tr_demand_bonus_perf_label',descFn:function(p,G2){const bon=Math.round(p.salary*0.5/50)*50;return{text:t('tr_demand_bonus_perf_text').replace('{val}',fmt(bon)),met:!!(p._ofBonus),bonus:bon};}},
  {id:'loyalty',   icon:'[LOY]', labelKey:'tr_demand_loyalty_label',   descFn:function(p,G2){return{text:t('tr_demand_loyalty_text'),met:!!(p._ofLoyalty)};}},
];
DEMAND_TYPES.forEach(d=>Object.defineProperty(d,'label',{get(){return t(d.labelKey);},enumerable:true}));
function genDemands(p){
  if(!p._repNeed)p._repNeed=Math.round((50+Math.random()*250)/50)*50;
  if(!p._ligaNeed)p._ligaNeed=Math.max(1,Math.min(7,(G&&G.myLeague)||8));
  const pool=['salary','contract','starter','ambition','develop','reputation','signing','league_min','bonus_perf','loyalty'];
  // Starsi zawodnicy (30+) preferuja lojalnosc i ligamin
  // Mlodzi preferuja ambicje i centrum
  let weights={salary:3,contract:2,starter:2,ambition:2,develop:1,reputation:1,signing:2,league_min:2,bonus_perf:2,loyalty:2};
  if(p.age>=30){weights.loyalty=4;weights.league_min=3;weights.ambition=0;weights.develop=0;}
  if(p.age<=23){weights.ambition=4;weights.develop=3;weights.loyalty=0;weights.bonus_perf=1;}
  // Buduj wazowany pool
  const wpool=[];
  Object.entries(weights).forEach(([id,w])=>{for(let i=0;i<w;i++)wpool.push(id);});
  const chosen=[];const used=new Set();
  while(chosen.length<3&&wpool.length){
    const i=Math.floor(Math.random()*wpool.length);
    const id=wpool[i];
    if(!used.has(id)){chosen.push(id);used.add(id);}
    wpool.splice(i,1);
  }
  if(!chosen.includes('salary')&&chosen.length>=3){chosen[2]='salary';}
  p.demands=chosen;return p;
}
function getDemandResults(p,ofS,ofC,ofSt,ofSig,ofBonus,ofLoyalty){
  p._ofS=ofS;p._ofC=ofC;p._ofSt=ofSt;p._ofSig=ofSig;p._ofBonus=ofBonus;p._ofLoyalty=ofLoyalty;
  const res=p.demands.map(id=>{const dt=DEMAND_TYPES.find(x=>x.id===id);if(!dt)return{id,met:false,text:'?'};const r=dt.descFn(p,G||{});return{id,met:r.met,text:r.text,icon:dt.icon,label:dt.label};});
  delete p._ofS;delete p._ofC;delete p._ofSt;return res;
}
function demandsHtmlInteractive(p,o){
  // Wersja z checkboxami dla modalu zakupu
  if(!p.demands)return'';
  p._ofS=o.salary;p._ofC=o.contract;p._ofSt=o.starter;
  p._ofSig=o.signing;p._ofBonus=o.bonus;p._ofLoyalty=o.loyalty;
  const html=p.demands.map(id=>{
    const dt=DEMAND_TYPES.find(x=>x.id===id);if(!dt)return'';
    const r2=dt.descFn(p,G||{});
    const met=r2.met;
    // Warunki wymagające checkbox (aktywna zgoda gracza)
    const needsChk=['starter','signing','bonus_perf','loyalty'].includes(id);
    const autoMet=['salary','contract','ambition','develop','reputation','league_min'].includes(id);
    let chk='';
    if(needsChk){
      const field=id==='bonus_perf'?'bonus':id==='signing'?'signing':id==='starter'?'starter':'loyalty';
      const checked=(id==='starter'?o.starter:id==='signing'?o.signing:id==='bonus_perf'?o.bonus:o.loyalty)?'checked':'';
      chk='<input type="checkbox" '+checked+' data-f="'+field+'" onclick="toggleBuyOffer(this,this.dataset.f)" style="cursor:pointer;margin:0"> ';
    }
    return '<div style="display:flex;align-items:center;gap:5px;padding:4px 0;border-bottom:1px solid var(--gl);font-size:var(--fs-dense)">'+
      '<span style="color:'+(met?'var(--gb)':'var(--rd)')+';">'+(met?'OK':t('tr_demand_not_met'))+'</span>'+
      chk+
      '<span style="color:var(--gr)">'+dt.icon+' '+dt.label+':</span>'+
      '<span style="color:'+(met?'var(--gb)':'var(--wh)')+'">'+r2.text+'</span>'+
    '</div>';
  }).join('');
  delete p._ofS;delete p._ofC;delete p._ofSt;delete p._ofSig;delete p._ofBonus;delete p._ofLoyalty;
  return html;
}
function demandsHtml(p,ofS,ofC,ofSt,ofSig,ofBonus,ofLoyalty){
  if(!p.demands)return'';
  const res=getDemandResults(p,ofS,ofC,ofSt,ofSig,ofBonus,ofLoyalty);
  return res.map(r=>'<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:var(--fs-dense)">'+
    '<span style="color:'+(r.met?'var(--gb)':'var(--rd)')+';">'+(r.met?'OK':t('tr_demand_not_met'))+'</span>'+
    '<span style="color:var(--gr)">'+r.icon+' '+r.label+':</span>'+
    '<span style="color:'+(r.met?'var(--gb)':'var(--wh)')+'">'+r.text+'</span></div>').join('');
}
function demandsMetCount(p,ofS,ofC,ofSt,ofSig,ofBonus,ofLoyalty){
  if(!p.demands)return 3;
  return getDemandResults(p,ofS,ofC,ofSt,ofSig,ofBonus,ofLoyalty).filter(r=>r.met).length;
}
function applyDemandEffect(p,met){
  if(met<=0)return false;
  if(met===1){p.form=Math.max(30,(p.form||100)-15);if(p.trainRate)p.trainRate=Math.max(0.3,p.trainRate-0.1);p._demandPenalty=2;}
  if(met===3){p.form=Math.min(100,(p.form||100)+10);if(p.trainRate)p.trainRate=Math.min(2.5,p.trainRate+0.15);p._demandBonus=2;}
  return true;
}
// ── SYSTEM SKAUTÓW ──────────────────────────────────────────────────
function scoutDef(){
  if(!G||!G.scout)return SCOUTS_DEF[0];
  return SCOUTS_DEF.find(s=>s.id===G.scout.level)||SCOUTS_DEF[0];
}
function scoutLevel(){return G&&G.scout&&G.scout.level||'free';}
function canScoutModeB(){
  // Tryb B wymaga akademii
  return G&&G.academy&&G.academy.level>0;
}
function acadMaxTalents(){
  if(!G||!G.academy)return 0;
  const lvl=G.academy.level||0;
  return [0,2,4,6,8,99][Math.min(lvl,5)];
}
function genTalent(){
  // Generuj juniora dla Trybu B
  const sd=scoutDef();
  const myLvl=G.myLeague||8;
  const age=r(sd.modeB_minAge,Math.min(20,sd.modeB_minAge+3));
  const p=mkPlayer(0);
  p.age=age;p.last=p.name.split(' ')[1]||p.name;
  // Niskie OVR, wysoki potencjał
  const baseOvr=r(22,42);
  const pot=r(55,sd.modeB_maxPot);
  ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(baseOvr+r(-6,6))));});
  p.potential=Math.min(99,pot);
  p.value=calcValue(ovr(p),p.age);
  p.salary=Math.round(calcSalary(p.value,null,ovr(p))*0.3/50)*50; // juniorzy taniej
  p.salary=Math.max(100,p.salary);
  // Koszt podpisania 0-30k, zależy od potencjału
  p.signingCost=pot>=85?r(15,30)*1000:pot>=75?r(5,15)*1000:r(0,5)*1000;
  p.signingCost=Math.round(p.signingCost/1000)*1000;
  // Skąd pochodzi
  const lgs=(G.leagues||[]).flatMap(l=>l.clubs||[]);
  const nearClubs=lgs.filter(c=>c.id!==G.myClubId);
  const srcClub=nearClubs.length&&Math.random()<0.6?nearClubs[Math.floor(Math.random()*nearClubs.length)]:null;
  p.prevClub=srcClub?srcClub.n:t('tr_fallback_no_club');
  p.prevLeague=srcClub?myLvl:0;
  p._isTalent=true;
  p._talentDecisionWeeks=2; // gracz ma 2 kolejki na decyzję
  p.contract=1;
  return p;
}
function genObservedPlayer(sourceType, sourceId){
  // Generuj pełny raport dla Trybu A
  const myLvl=G.myLeague||8;
  const lvls=[myLvl-1,myLvl,myLvl+1].filter(l=>l>=1&&l<=8);
  const lvl=sourceType==='club'&&sourceId?
    ((G.leagues||[]).find(l=>l.clubs&&l.clubs.find(c=>c.id===sourceId))||{level:myLvl}).level:
    lvls[Math.floor(Math.random()*lvls.length)];
  const ovrs=LEAGUE_OVR[lvl]||[25,40,40,60];
  const p=mkPlayer(0);
  p.pos=['GK','OBR','OBR','POL','POL','NAP','NAP'][Math.floor(Math.random()*7)];
  p.last=p.name.split(' ')[1]||p.name;
  const target=r(ovrs[0],ovrs[3]);
  ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(target+r(-7,7))));});
  p.potential=calcPotential(p,lvl);
  p.value=calcValue(ovr(p),p.age);
  p.salary=calcSalary(p.value,null,ovr(p));
  const _o=ovr(p);const[_mn,_mx]=_o<=45?[95,120]:_o<=60?[100,130]:[105,145];
  p.transferPrice=Math.round(p.value*((_mn+r(0,_mx-_mn))/100)/500)*500;
  genTransferContext(p,lvl);
  genDemands(p);
  p._observed=true; // pełne dane
  return p;
}
function getMarketClubName(lvl){
  // Bierz nazwy z AI klubów w grze, z ligi ±1
  const lgs=G&&G.leagues?G.leagues:[];
  const candidates=lgs.filter(l=>Math.abs(l.level-lvl)<=1).flatMap(l=>l.clubs||[]).filter(c=>c.id!==G.myClubId).map(c=>c.n);
  if(candidates.length)return candidates[Math.floor(Math.random()*candidates.length)];
  // Fallback do ALL_CLUBS jeśli brak
  const ac=(ALL_CLUBS||[]).filter(c=>c.id!==G.myClubId);
  return ac.length?ac[Math.floor(Math.random()*ac.length)].n:t('tr_fallback_unknown_club');
}
const TRANSFER_REASONS=[
  {id:'contract_end',labelKey:'tr_reason_contract_end',priceMult:0.80,icon:'[WYG]'},
  {id:'conflict',    labelKey:'tr_reason_conflict',priceMult:0.90,icon:'[KON]'},
  {id:'wants_more',  labelKey:'tr_reason_wants_more',   priceMult:0.95,icon:'[CZG]'},
  {id:'financial',   labelKey:'tr_reason_financial', priceMult:0.75,icon:'[FIN]'},
  {id:'overpriced',  labelKey:'tr_reason_overpriced',   priceMult:1.20,icon:'[AMB]'},
  {id:'surplus',     labelKey:'tr_reason_surplus', priceMult:0.85,icon:'[NAD]'},
  {id:'new_chapter', labelKey:'tr_reason_new_chapter',      priceMult:1.00,icon:'[NOW]'},
];
TRANSFER_REASONS.forEach(r=>Object.defineProperty(r,'label',{get(){return t(r.labelKey);},enumerable:true}));
const LEAGUE_NAMES_TR=new Proxy({},{get(target,prop){return _leagueNamesMap()[prop];}});
function genTransferContext(p,lvl){
  p.prevClub=getMarketClubName(lvl);
  p.prevLeague=lvl;
  // Powód sprzedaży
  let rPool=TRANSFER_REASONS.slice();
  if(p.age>=30)rPool=rPool.filter(x=>x.id!=='wants_more');
  if((p.contract||2)>1)rPool=rPool.filter(x=>x.id!=='contract_end');
  const reason=rPool[Math.floor(Math.random()*rPool.length)];
  p.transferReason=reason;
  // Statystyki
  const matches=r(10,30);
  const isAtt=['NAP','POL'].includes(p.pos);const isGK=p.pos==='GK';
  p.lastSeason={m:matches,
    g:isGK?0:isAtt?r(0,Math.floor(matches*0.45)):r(0,Math.floor(matches*0.18)),
    a:isGK?0:r(0,Math.floor(matches*0.28)),
    cs:isGK?r(0,Math.floor(matches*0.4)):0};
  // Sekcja
  p.section=Math.random()<0.15?'rumour':'sale';
  if(p.section==='rumour')p.rumourWeeks=1;
  // Oferta czasowa — zawodnicy z [FIN] lub [WYG] (20% szans)
  if((reason.id==='financial'||reason.id==='contract_end')&&Math.random()<0.20&&p.section==='sale'){
    p._timed=true;p._timedWeeks=1;
  }
  return p;
}
function sectionBadge(p){
  const s=p.section||'sale';
  if(s==='sale')return '<span style="font-size:var(--fs-dense);color:var(--rd);border:1px solid var(--rd);padding:1px 4px">'+t('tr_badge_for_sale')+'</span>';
  return '<span style="font-size:var(--fs-dense);color:var(--am);border:1px solid var(--am);padding:1px 4px">'+t('tr_badge_rumour').replace('{n}',p.rumourWeeks||2)+'</span>';
}
function lastSeasonHtml(p){
  if(!p.lastSeason)return'';const s=p.lastSeason;
  return '<span style="font-size:var(--fs-dense);color:var(--gr)">'+(p.pos==='GK'?s.m+'M '+s.cs+'CS':s.m+'M '+s.g+'G '+s.a+'A')+'</span>';
}
function transferReasonHtml(p){
  if(!p.transferReason)return'';const rr=p.transferReason;
  return '<span style="font-size:var(--fs-dense);color:var(--gr)">'+rr.icon+' '+rr.label+'</span>';
}
function genTransferMarket(){
  if(!G)return;
  const tw=isTransferWindow();
  const size=tw.type==='LETNIE'?15:8;
  const myLvl=G.myLeague||8;
  // Zawodnicy z ligi gracza ±1
  const lvls=[myLvl-1,myLvl,myLvl+1].filter(l=>l>=1&&l<=8);
  const pos=['GK','OBR','OBR','OBR','POL','POL','POL','POL','NAP','NAP','NAP','OBR','POL','NAP','GK'];
  G.transferMarket=[];
  // Dodaj zawodnikow z poczekalni plotek
  if(G.rumourPool&&G.rumourPool.length){
    G.transferMarket.push(...G.rumourPool);
    if(G.rumourPool.length)addNews(t('news_tr_rumours_market').replace('{n}',G.rumourPool.length),'budget');
    G.rumourPool=[];
  }
  // ── PULA PRAWDZIWYCH GRACZY AI z lig ±1 ─────────────────────────────
  // Zbieramy kandydatów: gracze AI z odpowiednich lig, nie w naszym klubie,
  // nie już wystawieni, skład klubu > 18 (żeby klub nie był zbyt osłabiony)
  const _aiCandidates=(function(){
    const result=[];
    lvls.forEach(lvl=>{
      const lgClubs=(G.leagues||[]).find(l=>l.level===lvl);
      if(!lgClubs)return;
      lgClubs.clubs.forEach(club=>{
        if(club.id===G.myClubId)return;
        const sq=G.players.filter(p=>p.clubId===club.id);
        if(sq.length<=20)return; // zostaw min 20 w klubie
        // Gracze nie będący już na rynku
        const onMarket=new Set((G.transferMarket||[]).map(x=>x.id));
        const eligible=sq.filter(p=>!onMarket.has(p.id)&&!p._listedForSale);
        // Preferuj zawodników z wygasającym kontraktem lub za mocnych na ligę
        const ovr4=LEAGUE_OVR[lvl]||[20,35,35,55];
        const lgMax=ovr4[3];
        eligible.forEach(p=>{
          const weight=p.contract<=1?3:ovr(p)>lgMax*1.1?2:1;
          for(let w=0;w<weight;w++) result.push({p,club,lvl});
        });
      });
    });
    // Shuffle
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  })();

  // Wybierz do size unikalnych zawodników
  const _picked=new Set();
  for(let i=0;i<_aiCandidates.length&&_picked.size<size;i++){
    const {p,club,lvl}=_aiCandidates[i];
    if(_picked.has(p.id))continue;
    _picked.add(p.id);
    // Sklonuj gracza na rynek (oryginał zostaje w klubie do czasu zakupu)
    const mp=Object.assign({},p);
    mp._realPlayerId=p.id;   // ID oryginalnego gracza w G.players
    mp._fromClubId=club.id;  // Klub sprzedający
    mp.prevClub=club.n;
    mp.prevLeague=lvl;
    // Powód sprzedaży
    let rPool=TRANSFER_REASONS.slice();
    if(mp.age>=30)rPool=rPool.filter(x=>x.id!=='wants_more');
    if((mp.contract||2)>1)rPool=rPool.filter(x=>x.id!=='contract_end');
    const reason=rPool[Math.floor(Math.random()*rPool.length)];
    mp.transferReason=reason;
    // Statystyki z bieżącego sezonu (jeśli są)
    if(!mp.lastSeason){
      const matches=mp.st?mp.st.m||0:r(10,25);
      const isAtt=['NAP','POL'].includes(mp.pos);const isGK=mp.pos==='GK';
      mp.lastSeason={m:matches,g:isGK?0:isAtt?mp.st&&mp.st.g||0:mp.st&&mp.st.g||0,a:isGK?0:mp.st&&mp.st.a||0,cs:isGK?mp.st&&mp.st.cs||0:0};
    }
    mp.section='sale';
    // Cena
    const _o=ovr(mp);
    const [_mn,_mx]=_o<=25?[90,115]:_o<=45?[95,120]:_o<=60?[100,130]:[105,140];
    const _baseMult=(_mn+r(0,_mx-_mn))/100;
    const _reasonMult=reason.priceMult||1.0;
    mp.transferPrice=Math.round(calcValue(_o,mp.age)*_baseMult*_reasonMult*(mp.contract<=1?0.7:1)/500)*500;
    if(!mp.demands||!mp.demands.length)genDemands(mp);
    G.transferMarket.push(mp);
  }

  // Dopełnij fikcyjnymi jeśli za mało prawdziwych graczy
  const _missing=Math.max(0,size-_picked.size);
  for(let i=0;i<_missing;i++){
    const lvl=lvls[Math.floor(Math.random()*lvls.length)];
    const _ovr4b=LEAGUE_OVR[lvl]||[20,35,35,50];const [minO,maxO]=[_ovr4b[0],_ovr4b[3]];
    const p=mkPlayer(0);
    p.pos=pos[i%pos.length];
    p.last=p.name.split(' ')[1]||p.name;
    const target=r(minO,maxO);
    ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(target+r(-8,8))));});
    p.potential=calcPotential(p,lvl);
    p.value=calcValue(ovr(p),p.age);
    p.salary=calcSalary(p.value,null,ovr(p));
    const _o=ovr(p);
    const [_mn,_mx]=_o<=25?[90,115]:_o<=45?[95,120]:_o<=60?[100,130]:[105,140];
    p.transferPrice=Math.round(calcValueDynamic(p)*(_mn+r(0,_mx-_mn))/100/500)*500;
    genTransferContext(p,lvl);
    if(p.transferReason)p.transferPrice=Math.round(p.transferPrice*(p.transferReason.priceMult||1)/500)*500;
    genDemands(p);
    G.transferMarket.push(p);
  }
  // Wystawieni na sprzedaż przez gracza (reset przy nowym oknie)
  if(!G.listedPlayers)G.listedPlayers=[];
  G.transferWindowOpened=G.week;
  // ── OFERTA DEDYKOWANA — pasuje do słabej pozycji w składzie ──────────
  (function(){
    const myP=myPl();if(!myP.length)return;
    const posAvg={GK:0,OBR:0,POL:0,NAP:0};const posCount={GK:0,OBR:0,POL:0,NAP:0};
    myP.forEach(p=>{if(posAvg[p.pos]!==undefined){posAvg[p.pos]+=ovr(p);posCount[p.pos]++;}});
    let weakPos=null;let weakOvr=999;
    Object.keys(posAvg).forEach(pos=>{if(posCount[pos]>0){const avg=posAvg[pos]/posCount[pos];if(avg<weakOvr){weakOvr=avg;weakPos=pos;}}});
    if(!weakPos)return;
    const lvl=myLvl;const _ovr4b=LEAGUE_OVR[lvl]||[20,35,35,50];
    const p=mkPlayer(0);p.pos=weakPos;p.last=p.name.split(' ')[1]||p.name;
    const target=Math.round(weakOvr)+r(10,16);
    ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(target+r(-5,5))));});
    genTransferContext(p,lvl);
    p.value=calcValue(ovr(p),p.age);p.salary=calcSalary(p.value,null,ovr(p));
    const _o=ovr(p);const [_mn,_mx]=_o<=45?[95,120]:_o<=60?[100,130]:[105,140];
    p.transferPrice=Math.round(p.value*((_mn+r(0,_mx-_mn))/100)/500)*500;
    p.section='sale';p._dedicated=true;p._weakOvr=Math.round(weakOvr);
    genDemands(p);
    G.transferMarket.unshift(p); // na górę listy

  })();
  // ── OFERTA PREMIUM — raz na sezon, tylko letnie okno ─────────────────
  if((G.season||1)!==(G._premiumSeason||0)&&(G.transferWindowOpened||0)<=2){
    (function(){
      const higherLvl=Math.max(1,myLvl-1);
      const _ovr4b=LEAGUE_OVR[higherLvl]||[30,45,50,65];
      const p=mkPlayer(0);
      const pos=['NAP','POL','OBR'][Math.floor(Math.random()*3)];p.pos=pos;p.last=p.name.split(' ')[1]||p.name;
      const target=r(_ovr4b[2],_ovr4b[3]);
      ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(target+r(-5,5))));});
      genTransferContext(p,higherLvl);
      p.potential=calcPotential(p,higherLvl);
      p.value=calcValue(ovr(p),p.age);p.salary=calcSalary(p.value,null,ovr(p));
      p.transferPrice=Math.round(p.value*1.35/500)*500;
      p.section='sale';p._premium=true;
      genDemands(p);
      G.transferMarket.splice(1,0,p); // na drugiej pozycji (po dedykowanej)
      G._premiumSeason=G.season||1;
      (function(){const _scoutErrors={free:{min:10,max:20},local:{min:6,max:12},regional:{min:4,max:8},national:{min:2,max:6},pro:{min:1,max:4},elite:{min:1,max:2}};const _sd=scoutDef();const _err=_scoutErrors[_sd.id]||_scoutErrors.free;const _rawOvr=ovr(p);const _showOvr=Math.round(_rawOvr+(Math.random()<0.5?1:-1)*(_err.min+Math.floor(Math.random()*(_err.max-_err.min+1))));addNews(t('news_tr_premium').replace('{name}',p.name).replace('{pos}',POS_SHORT[p.pos]).replace('{ovr}',_showOvr).replace('{err}',_err.max),'premium');G.news[0].action='transfers';G.news[0].actionLabel=t('news_tr_action_label');})();
    })();
  }
  // Newsy o plotkach
  (G.transferMarket||[]).filter(p=>p.section==='rumour').forEach(p=>{(function(){const _scoutErrors={free:{min:10,max:20},local:{min:6,max:12},regional:{min:4,max:8},national:{min:2,max:6},pro:{min:1,max:4},elite:{min:1,max:2}};const _sd=scoutDef();const _err=_scoutErrors[_sd.id]||_scoutErrors.free;const _rawOvr=ovr(p);const _showOvr=Math.round(_rawOvr+(Math.random()<0.5?1:-1)*(_err.min+Math.floor(Math.random()*(_err.max-_err.min+1))));addNews(t('news_tr_rumour').replace('{name}',p.name).replace('{pos}',POS_SHORT[p.pos]).replace('{ovr}',_showOvr).replace('{err}',_err.max).replace('{n}',p.rumourWeeks||2),'rumour');})();});
}
function genWeeklyMarket(){
  // Legacy - używamy nowego systemu
  if(!G.transferMarket)G.transferMarket=[];
}
function applyFilters(){fillTransfers();}
function trTab(tab,btn){
  document.querySelectorAll('#p-transfers .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#tr-kup,#tr-sprzedaj,#tr-skauci,#tr-historia,#tr-analityka').forEach(el=>el.classList.remove('on'));
  const el=document.getElementById('tr-'+tab);if(el)el.classList.add('on');
  if(tab==='kup')renderBuyTab();
  else if(tab==='sprzedaj')renderSellTab();
  else if(tab==='skauci')renderScoutsTab();
  else if(tab==='historia')renderHistoriaTab();
  else if(tab==='analityka')renderAnalitykaTab();
}
function renderBuyTab(){
  const el=document.getElementById('tr-kup');if(!el||!G)return;
  const tw=isTransferWindow();
  // Okno zamknięte — pokazuj rynek ale blokuj kupno, umożliwiaj obserwację
  const _windowClosed=!tw.open;
  if(!G.transferMarket||!G.transferMarket.length)genTransferMarket();
  const bought=G.trBoughtThisWindow||0;
  // ── FILTRY I SORTOWANIE ───────────────────────────────────────────────
  if(!G._trFilters)G._trFilters={pos:'',sortBy:'ovr',sortDir:1};
  const _f=G._trFilters;
  // Pozycja + sortowanie z toggle kierunku
  const _posOpts=['','GK','OBR','POL','NAP'];
  const _posLbls={'':t('tr_filter_all'),'GK':POS_SHORT.GK,'OBR':POS_SHORT.OBR,'POL':POS_SHORT.POL,'NAP':POS_SHORT.NAP};
  const _sortOpts=['ovr','age','price','demands'];
  const _sortLbls={ovr:'OVR',age:t('tr_sort_age'),price:t('tr_sort_price'),demands:t('tr_sort_demands')};
  const _arrow=_f.sortDir>0?'\u2193':'\u2191'; // ↓ lub ↑
  const _filterBar=
    '<div style="font-size:var(--fs-dense);margin-bottom:8px;border-bottom:1px solid var(--gl);padding-bottom:8px">'+
    '<div style="display:flex;gap:3px;flex-wrap:wrap;align-items:center;margin-bottom:5px">'+
      '<span style="color:var(--gr);margin-right:2px">'+t('tr_filter_pos_label')+'</span>'+
      _posOpts.map(v=>'<button data-key="pos" data-val="'+v+'" onclick="setTrFilter(this.dataset.key,this.dataset.val)" style="font-size:var(--fs-dense);padding:1px 7px;border:1px solid '+(_f.pos===v?'var(--am)':'var(--gl)')+';background:'+(_f.pos===v?'var(--am)':'var(--tb)')+';color:'+(_f.pos===v?'#000':'var(--gr)')+';cursor:pointer">'+(_posLbls[v]||v)+'</button>').join('')+
    '</div>'+
    '<div style="display:flex;gap:3px;flex-wrap:wrap;align-items:center">'+
      '<span style="color:var(--gr);margin-right:2px">'+t('tr_sort_label')+'</span>'+
      _sortOpts.map(v=>'<button data-val="'+v+'" onclick="toggleTrSort(this.dataset.val)" style="font-size:var(--fs-dense);padding:1px 7px;border:1px solid '+(_f.sortBy===v?'var(--gb)':'var(--gl)')+';background:'+(_f.sortBy===v?'var(--gm)':'var(--tb)')+';color:'+(_f.sortBy===v?'var(--gb)':'var(--gr)')+';cursor:pointer">'+(_sortLbls[v]||v)+(_f.sortBy===v?' '+_arrow:'')+  '</button>').join('')+
    '</div>'+
    '</div>';
  // Zastosuj filtry
  let _mkt=(G.transferMarket||[]).slice();
  if(_f.pos)_mkt=_mkt.filter(p=>p.pos===_f.pos);
  // Sortowanie z kierunkiem
  const _dir=_f.sortDir>0?1:-1;
  _mkt.sort((a,b)=>{
    let d=0;
    if(_f.sortBy==='ovr')d=ovr(b)-ovr(a);
    else if(_f.sortBy==='age')d=a.age-b.age;
    else if(_f.sortBy==='price')d=(a.transferPrice||0)-(b.transferPrice||0);
    else if(_f.sortBy==='demands')d=demandsMetCount(b,Math.round(b.salary*1.15/50)*50,2,false)-demandsMetCount(a,Math.round(a.salary*1.15/50)*50,2,false);
    return d*_dir;
  });
  const _sale=_mkt.filter(p=>p.section==='sale'||!p.section);
  const _rum=_mkt.filter(p=>p.section==='rumour');
  function _sh(lbl,cnt,c){return cnt?'<div style="font-size:var(--fs-dense);color:'+c+';margin:8px 0 4px;border-bottom:1px solid '+c+';padding-bottom:2px">'+lbl+' ('+cnt+')</div>':'';}
  function _tcard(p,bought){
    const _isObs=!!(p._observed||(G&&G.scout&&(G.scout.observed||[]).find(x=>x.id===p.id)));
    const _isWatching=!_isObs&&G&&G.scout&&(G.scout.modeA||[]).find(x=>x.targetId===p.id);
    const _rawOvr=ovr(p);
    // Blad OVR i trafnosc potencjalu zalezna od poziomu skauta
    const _sd2=scoutDef();
    const _scoutErrors={free:{min:10,max:20},local:{min:6,max:12},regional:{min:4,max:8},national:{min:2,max:6},pro:{min:1,max:4},elite:{min:1,max:2}};
    const _potErrors={regional:10,national:5,pro:3,elite:2};
    const _err=_scoutErrors[_sd2.id]||_scoutErrors.free;
    const _ovrErr=_err.min+Math.floor(Math.random()*(_err.max-_err.min+1));
    const _showOvr=_isObs?_rawOvr:Math.round(_rawOvr+(Math.random()<0.5?1:-1)*_ovrErr);
    const _potErr=_potErrors[_sd2.id]||null;
    const _showPot=_isObs?p.potential:(_potErr!=null?Math.round(p.potential+(Math.random()<0.5?1:-1)*Math.floor(Math.random()*(_potErr+1))):null);
    const _ovrLabel=_isObs?('OVR '+_rawOvr):('OVR ~'+_showOvr+' ±'+_err.max);
    const col=_showOvr>=60?'#4caf50':_showOvr>=40?'#ffc107':'#ef9a9a';
    const isRum=p.section==='rumour';
    const bdr=p._dedicated?'var(--gb)':p._premium?'#ffd700':p._timed?'var(--rd)':isRum?'var(--am)':'var(--rd)';
    // Cena z niepewnością
    const showPrice=_isObs?fmtVal(p.transferPrice):'~'+fmtVal(Math.round(p.transferPrice*(0.85+Math.random()*0.30)/1000)*1000);
    const showSal=_isObs?fmt(p.salary):'~'+fmt(Math.round(p.salary*(0.85+Math.random()*0.30)/50)*50);
    return '<div class="tcard" style="margin-bottom:8px;border-left:3px solid '+bdr+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">'+
        (p._dedicated?'<span style="font-size:var(--fs-dense);color:var(--gb);border:1px solid var(--gb);padding:1px 4px">'+t('tr_badge_fits_squad').replace('{pos}',POS_SHORT[p.pos]).replace('{n}',p._weakOvr)+'</span>':
         p._premium?'<span style="font-size:var(--fs-dense);color:#ffd700;border:1px solid #ffd700;padding:1px 4px">'+t('tr_badge_premium')+'</span>':
         p._timed?'<span style="font-size:var(--fs-dense);color:var(--rd);border:1px solid var(--rd);padding:1px 4px">'+t('tr_badge_expires')+'</span>':
         sectionBadge(p))+
        (p._deadline&&!p._timed&&!p._dedicated&&!p._premium?'<span style="font-size:var(--fs-dense);color:var(--am)">'+t('tr_badge_last_chance')+'</span>':'')+
        (p.prevClub?(p._fromClubId?'<span style="font-size:var(--fs-dense);color:var(--am);cursor:pointer;text-decoration:underline" onclick="openClubModal('+p._fromClubId+')">'+p.prevClub+' • '+(LEAGUE_NAMES_TR[p.prevLeague]||t('league_fallback'))+'</span>':'<span style="font-size:var(--fs-dense);color:var(--gr)">'+p.prevClub+' • '+(LEAGUE_NAMES_TR[p.prevLeague]||t('league_fallback'))+'</span>'):'')+
      '</div>'+
      '<div style="flex:1">'+
        '<div style="display:flex;align-items:center;gap:6px">'+
          '<span class="tr-face-slot" data-pid="'+p.id+'" style="display:inline-block;vertical-align:middle;line-height:0;flex-shrink:0"></span>'+
          '<div class="tname">'+p.name+'</div>'+
          (_isObs?'<span style="font-size:var(--fs-dense);color:var(--gb)">'+t('tr_watched_badge')+'</span>':'') +
          (_isWatching?'<span style="font-size:var(--fs-dense);color:var(--am)">'+t('tr_watching_badge')+'</span>':'')+
          (p._hot?'<span style="font-size:var(--fs-dense);color:var(--gb)">[HOT]</span>':'')+
        '</div>'+
        '<div class="tdet">'+(POS_SHORT[p.pos]||p.pos)+' • '+p.age+t('tr_age_suffix')+' • <span style="color:'+col+'">'+_ovrLabel+'</span> • '+t('tr_pot_label')+' '+(_isObs?p.potential:(_showPot!=null?'~'+_showPot:'???'))+'</div>'+
        '<div style="display:flex;gap:8px;margin-top:2px">'+lastSeasonHtml(p)+'&nbsp;'+transferReasonHtml(p)+'</div>'+
        '<div class="tdet" style="color:var(--gr)">'+t('tr_value_label')+fmtVal(calcValueDynamic(p))+(p._hot?' [HOT +20%]':'')+'</div>'+
        (isRum?'<div class="tdet" style="color:var(--am)">'+t('tr_available_in').replace('{n}',p.rumourWeeks||1)+'</div>':
          '<div class="tdet" style="color:var(--am)">'+t('tr_price_salary_line').replace('{price}','<b>'+showPrice+'</b>').replace('{sal}',showSal)+'</div>')+
        '<div>'+getDemandPreview(p)+'</div>'+
      '</div>'+
      '<div style="text-align:right;margin-left:8px">'+
        (isRum?'<div style="font-size:var(--fs-dense);color:var(--am)">'+t('tr_soon')+'</div>':
          '<div style="display:flex;flex-direction:column;gap:3px;align-items:flex-end">'+
            '<button class="btn-buy" onclick="buyTransfer('+p.id+')" '+(_windowClosed||bought>=3?'disabled style="opacity:0.4"':'')+'>'+(_windowClosed?t('tr_window_closed_short'):t('tr_btn_buy_short'))+'</button>'+
            (!_isObs&&!_isWatching?'<button onclick="sendScoutModeA(\'market\','+p.id+',0)" style="font-size:var(--fs-dense);padding:2px 4px;border:1px solid var(--am);background:var(--tb);color:var(--am);cursor:pointer">'+t('tr_watch_btn')+'</button>':'')+
          '</div>')+
      '</div></div>';
  }
  const _closedBanner=_windowClosed?'<div style="background:var(--tb);border:1px solid var(--gl);padding:6px 10px;margin-bottom:8px;font-size:var(--fs-dense);text-align:center;color:var(--gr)">'+
    t('tr_window_closed_prefix')+'<span style="color:var(--wh)">'+tw.next+'</span>'+(tw.eta?t('tr_window_closed_eta').replace('{n}',tw.eta):'')+
    t('tr_window_closed_suffix')+'</div>':'';
  el.innerHTML=_closedBanner+_filterBar+'<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:8px">'+((!_windowClosed)?t('tr_bought_count').replace('{n}','<span style="color:'+(bought>=3?'var(--rd)':'var(--am)')+'">'+bought+'</span>'):t('tr_browsing_locked'))+'</div>'+
    _sh(t('tr_badge_for_sale'),_sale.length,'var(--rd)')+_sale.map(p=>_tcard(p,bought)).join('')+
    _sh(t('tr_section_rumours'),_rum.length,'var(--am)')+_rum.map(p=>_tcard(p,bought)).join('')+
    (!_sale.length&&!_rum.length?'<div style="color:var(--gr);font-size:var(--fs-dense)">'+t('tr_no_players')+'</div>':'')+
    '<div style="margin-top:14px;border-top:1px solid var(--gl);padding-top:10px;font-size:var(--fs-dense);color:var(--gr)">'+
      '<div style="color:var(--am);margin-bottom:5px">'+t('tr_legend_title')+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:3px">'+
        '<div style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:10px;height:12px;border-left:3px solid var(--rd);flex-shrink:0"></span>'+t('tr_legend_for_sale')+'</div>'+
        '<div style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:10px;height:12px;border-left:3px solid var(--am);flex-shrink:0"></span>'+t('tr_legend_rumour')+'</div>'+
        '<div style="margin-top:3px">'+t('tr_legend_stats')+'</div>'+
        '<div>'+t('tr_legend_reasons1')+'</div>'+
        '<div>'+t('tr_legend_reasons2')+'</div>'+
        '<div style="margin-top:3px">'+t('tr_legend_demands')+'</div>'+
      '</div>'+
    '</div>';
  if(typeof pxFace==='function'){el.querySelectorAll('.tr-face-slot').forEach(function(sl){if(!sl.firstChild){sl.appendChild(pxFace(parseInt(sl.dataset.pid),2));}});}
}
function renderSellTab(){
  const el=document.getElementById('tr-sprzedaj');if(!el||!G)return;
  const tw=isTransferWindow();
  const listed=G.listedPlayers||[];
  // Oferty AI za wystawionych zawodników
  let offerHtml='';
  if(G.pendingOffers&&G.pendingOffers.length){
    offerHtml='<div style="font-size:var(--fs-dense);color:var(--am);margin-bottom:6px;border-bottom:1px solid var(--gl);padding-bottom:4px">'+t('tr_offers_ai_title')+'</div>'+
    G.pendingOffers.map(o=>{
      const p=G.players.find(x=>x.id===o.pid);if(!p)return'';
      return '<div style="background:#1a1a00;border:1px solid var(--am);padding:8px 10px;margin-bottom:6px;font-size:var(--fs-dense)">'+
        '<div style="color:var(--wh)">'+t('tr_offer_line').replace('{club}',o.clubName).replace('{price}','<b style="color:var(--am)">'+fmtVal(o.price)+'</b>').replace('{name}',p.name)+'</div>'+
        '<div style="color:var(--gr);margin-top:2px">'+t('tr_offer_value_line').replace('{value}',fmtVal(p.value)).replace('{pct}',Math.round(o.price/p.value*100))+'</div>'+
        '<div style="display:flex;gap:6px;margin-top:6px">'+
          '<button class="btn-buy" style="background:var(--gb);flex:1" onclick="acceptOffer('+o.pid+')">'+t('tr_accept_btn')+'</button>'+
          '<button class="btn-buy" style="background:#3d0000;border:1px solid var(--rd);color:var(--rd);flex:1" onclick="rejectOffer('+o.pid+')">'+t('tr_reject_btn')+'</button>'+
        '</div></div>';
    }).join('')+'<hr style="border-color:var(--gl);margin:8px 0">';
  }
  if(!tw.open){
    el.innerHTML=offerHtml+'<div style="background:var(--tb);border:1px solid var(--gl);padding:12px;text-align:center;font-size:var(--fs-dense);color:var(--gr)">'+t('tr_sell_window_closed')+'</div>'+
      '<div style="margin-top:12px;font-size:var(--fs-dense);color:var(--gb)">'+t('tr_my_squad_title')+'</div>'+
      myPl().map(p=>'<div class="tcard" style="margin-top:4px"><div class="tname">'+p.name+'</div><div class="tdet">'+(POS_SHORT[p.pos]||p.pos)+' • '+p.age+t('tr_age_suffix')+' • OVR '+ovr(p)+' • '+fmtVal(p.value)+'</div></div>').join('');
    return;
  }
  const tw2=isTransferWindow();
  const sold2=G.trSoldThisWindow||0;
  el.innerHTML=offerHtml+
    '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:8px">'+
      (tw2.open?t('tr_sell_window_open').replace('{type}',tw2.type==='LETNIE'?t('window_summer'):t('window_winter')):t('tr_sell_window_closed_price'))+
      (tw2.open?t('tr_sold_count').replace('{n}','<span style="color:'+(sold2>=3?'var(--rd)':'var(--am)')+'">'+sold2+'</span>'):'')+
    '</div>'+
    myPl().sort((a,b)=>ovr(b)-ovr(a)).map(p=>{
      return '<div class="tcard" style="margin-bottom:4px">'+
        '<div style="flex:1"><div class="tname">'+p.name+'</div>'+
        '<div class="tdet">'+(POS_SHORT[p.pos]||p.pos)+' • '+p.age+t('tr_age_suffix')+' • OVR '+ovr(p)+'</div>'+
        '<div class="tdet" style="color:var(--gr)">'+t('tr_market_value_label')+fmtVal(p.value)+'</div></div>'+
        '<button class="btn-buy" style="background:var(--rd);color:#fff" onclick="openSellModal('+p.id+')">'+t('tr_btn_sell')+'</button></div>';
    }).join('');
}
function renderHistoriaTab(){
  const el=document.getElementById('tr-historia');if(!el||!G)return;
  const hist=(G.fin&&G.fin.transfers)||[];
  const wydano=hist.filter(t=>t.type==='buy').reduce((s,t)=>s+t.val,0);
  const zarobiono=hist.filter(t=>t.type==='sell').reduce((s,t)=>s+t.val,0);
  el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px;font-size:var(--fs-dense)"><div style="color:var(--gr)">'+t('tr_spent_label')+'</div><div style="color:var(--rd)">'+fmtVal(wydano)+'</div></div>'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px;font-size:var(--fs-dense)"><div style="color:var(--gr)">'+t('tr_earned_label')+'</div><div style="color:var(--gb)">'+fmtVal(zarobiono)+'</div></div>'+
  '</div>'+
  (hist.length?hist.slice().reverse().map(tr=>
    '<div style="border-bottom:1px solid var(--gm);padding:6px 0;font-size:var(--fs-dense)">'+
      '<span style="color:'+(tr.type==='buy'?'var(--rd)':'var(--gb)')+'">'+( tr.type==='buy'?t('tr_log_buy'):t('tr_log_sell'))+'</span> '+
      '<span style="color:var(--wh)">'+tr.name+'</span> '+
      '<span style="color:var(--am)">'+fmtVal(tr.val)+'</span>'+
      (tr.club?' <span style="color:var(--gr)">← '+tr.club+'</span>':'')+
      ' <span style="color:var(--gr)">S'+tr.season+' T'+tr.week+'</span>'+
    '</div>'
  ).join(''):'<div style="color:var(--gr);font-size:var(--fs-dense);padding:12px 0">'+t('tr_no_transactions')+'</div>');
}
// ── ANALITYKA TRANSFEROWA ─────────────────────────────────────────────────
let _analSubTab='rankingi';
function analTab(sub,btn){
  document.querySelectorAll('#tr-analityka .anal-tab-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  _analSubTab=sub;
  renderAnalitykaContent();
}
function renderAnalitykaTab(){
  const el=document.getElementById('tr-analityka');if(!el||!G)return;
  el.innerHTML=
    '<div style="display:flex;border-bottom:2px solid var(--gl)">'+
      '<button class="anal-tab-btn sq-tab2-btn on" onclick="analTab(\'rankingi\',this)">'+t('tr_anal_tab_rankings')+'</button>'+
      '<button class="anal-tab-btn sq-tab2-btn" onclick="analTab(\'statystyki\',this)">'+t('tr_anal_tab_stats')+'</button>'+
    '</div>'+
    '<div id="anal-content" style="padding:10px 12px;overflow-y:auto"></div>';
  renderAnalitykaContent();
}
function renderAnalitykaContent(){
  const el=document.getElementById('anal-content');if(!el||!G)return;
  const hist=(G.fin&&G.fin.transfers)||[];
  const buys =hist.filter(t=>t.type==='buy');
  const sells=hist.filter(t=>t.type==='sell');
  // Połącz kupno ze sprzedażą po id (gdy dostępne) lub po nazwie
  function matchPair(sell){
    const byId=sell.id?buys.find(b=>b.id===sell.id):null;
    return byId||buys.find(b=>b.name===sell.name)||null;
  }
  function roiCalc(buyVal,sellVal){
    if(!buyVal||buyVal===0) return sellVal>0?999:0;
    return Math.round((sellVal-buyVal)/buyVal*100);
  }
  function roiCol(r){return r>=50?'var(--gb)':r>=0?'var(--am)':'var(--rd)';}
  const pairs=sells.map(s=>{
    const b=matchPair(s);
    return {name:s.name,pos:s.pos||'—',buyPrice:b?b.val:s.boughtPrice||0,sellPrice:s.val,
      buySeason:b?b.season:s.boughtSeason||'?',sellSeason:s.season,isAcad:!!(s.isAcad||(b&&b.isAcad))};
  });
  const paired=pairs.filter(p=>p.sellPrice>0);
  const byRoi=[...paired].sort((a,b)=>roiCalc(b.buyPrice,b.sellPrice)-roiCalc(a.buyPrice,a.sellPrice));
  const totalNet=paired.reduce((s,t)=>s+(t.sellPrice-t.buyPrice),0);
  const avgProfit=paired.length?Math.round(totalNet/paired.length):0;
  const avgBuyAge=buys.length?(buys.reduce((s,b)=>s+(b.buyAge||0),0)/buys.length).toFixed(1):0;
  const acadsSprzedani=paired.filter(t=>t.isAcad).length;
  // Bilans per sezon
  const seasons=[...new Set([...buys.map(b=>b.season),...sells.map(s=>s.season)])].sort();
  function fv(v){if(!v&&v!==0)return'—';const n=v*curRate();if(v>=1000000)return(n/1000000).toFixed(1)+'M '+curSym();if(v>=1000)return Math.round(n/1000)+'K '+curSym();return Math.round(n)+' '+curSym();}

  if(_analSubTab==='rankingi'){
    if(!paired.length){el.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);padding:16px 0;text-align:center">'+t('tr_anal_no_completed')+'</div>';return;}
    const best=byRoi.slice(0,3);
    const worst=[...byRoi].reverse().slice(0,Math.min(2,byRoi.length));
    const medals=['🥇','🥈','🥉'];
    let h='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gb);margin:0 0 8px;letter-spacing:1px">'+t('tr_anal_best_title')+'</div>';
    h+=best.map((t,i)=>{
      const r=roiCalc(t.buyPrice,t.sellPrice);
      const profit=t.sellPrice-t.buyPrice;
      return '<div style="background:var(--tb);border:2px solid var(--gb);border-left:4px solid var(--gb);padding:10px 12px;margin-bottom:6px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
          '<span style="font-weight:700;font-size:var(--fs-micro);color:var(--wh)">'+medals[i]+' '+t.name+'</span>'+
          '<span style="font-weight:700;font-size:var(--fs-h3);color:'+roiCol(r)+'">'+
            (r===999?'∞':(r>0?'+':'')+r+'%')+
          '</span>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense)">'+
          '<span style="color:var(--gr)">'+(t.pos||'—')+' • S'+t.buySeason+'→S'+t.sellSeason+(t.isAcad?' 🌱':'')+'</span>'+
          '<span style="color:'+(profit>=0?'var(--gb)':'var(--rd)')+'">'+(profit>=0?'+':'')+fv(profit)+'</span>'+
        '</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:2px">'+
          (t.buyPrice===0?t('tr_anal_free'):fv(t.buyPrice))+' → '+fv(t.sellPrice)+
        '</div>'+
      '</div>';
    }).join('');
    h+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--rd);margin:12px 0 8px;letter-spacing:1px">'+t('tr_anal_worst_title')+'</div>';
    h+=worst.map((t,i)=>{
      const r=roiCalc(t.buyPrice,t.sellPrice);
      const profit=t.sellPrice-t.buyPrice;
      return '<div style="background:var(--tb);border:2px solid var(--rd);border-left:4px solid var(--rd);padding:10px 12px;margin-bottom:6px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
          '<span style="font-weight:700;font-size:var(--fs-micro);color:var(--wh)">#'+(i+1)+' '+t.name+'</span>'+
          '<span style="font-weight:700;font-size:var(--fs-h3);color:var(--rd)">'+r+'%</span>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense)">'+
          '<span style="color:var(--gr)">'+(t.pos||'—')+' • S'+t.buySeason+'→S'+t.sellSeason+'</span>'+
          '<span style="color:var(--rd)">'+fv(profit)+'</span>'+
        '</div>'+
      '</div>';
    }).join('');
    // Bar chart bilans per sezon
    if(seasons.length){
      h+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gb);margin:12px 0 8px;letter-spacing:1px">'+t('tr_anal_season_net_title')+'</div>';
      const seasonNets=seasons.map(s=>{
        const nb=buys.filter(b=>b.season===s).reduce((x,b)=>x+b.val,0);
        const ns=sells.filter(sl=>sl.season===s).reduce((x,sl)=>x+sl.val,0);
        return {s,net:ns-nb};
      });
      const maxAbs=Math.max(1,...seasonNets.map(x=>Math.abs(x.net)));
      h+=seasonNets.map(x=>{
        const w=Math.round(Math.abs(x.net)/maxAbs*100);
        const col=x.net>=0?'var(--gb)':'var(--rd)';
        return '<div style="margin-bottom:9px">'+
          '<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense);margin-bottom:3px">'+
            '<span style="color:var(--gr)">'+t('tr_anal_season_label').replace('{n}',x.s)+'</span>'+
            '<span style="font-weight:700;font-size:var(--fs-h3);color:'+col+'">'+(x.net>=0?'+':'')+fv(x.net)+'</span>'+
          '</div>'+
          '<div style="height:10px;background:#000;border:1px solid var(--gl)">'+
            '<div style="height:100%;width:'+w+'%;background:'+col+'"></div>'+
          '</div>'+
        '</div>';
      }).join('');
    }
    el.innerHTML=h;

  } else {
    // ── STATYSTYKI ──
    let h='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gb);margin:0 0 8px;letter-spacing:1px">'+t('tr_anal_key_metrics')+'</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">'+
      [
        {icon:'💰',lbl:t('tr_anal_net_balance'),val:(totalNet>=0?'+':'')+fv(totalNet),col:totalNet>=0?'var(--gb)':'var(--rd)'},
        {icon:'📊',lbl:t('tr_anal_avg_profit'),val:(avgProfit>=0?'+':'')+fv(avgProfit),col:avgProfit>=0?'var(--gb)':'var(--rd)'},
        {icon:'🎂',lbl:t('tr_anal_avg_buy_age'),val:avgBuyAge+t('tr_years_suffix'),col:'var(--am)'},
        {icon:'🌱',lbl:t('tr_anal_academy_grads'),val:acadsSprzedani+t('tr_anal_sold_suffix'),col:'var(--gb)'},
      ].map(b=>
        '<div style="background:var(--tb);border:1px solid var(--gl);padding:10px;text-align:center">'+
          '<div style="font-size:var(--fs-display);margin-bottom:4px">'+b.icon+'</div>'+
          '<div style="font-weight:700;font-size:var(--fs-h3);color:'+b.col+'">'+b.val+'</div>'+
          '<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:2px">'+b.lbl+'</div>'+
        '</div>'
      ).join('')+
    '</div>';
    // ROI per zawodnik
    if(byRoi.length){
      h+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gb);margin:0 0 8px;letter-spacing:1px">'+t('tr_anal_roi_title')+'</div>';
      h+='<table style="width:100%;border-collapse:collapse;font-size:var(--fs-dense);margin-bottom:12px">'+
        '<thead><tr style="border-bottom:1px solid var(--gl)">'+
          '<th style="text-align:left;padding:5px 4px;color:var(--am);font-weight:700;font-size:var(--fs-h3)">'+t('tr_anal_col_player')+'</th>'+
          '<th style="text-align:right;padding:5px 4px;color:var(--am);font-weight:700;font-size:var(--fs-h3)">'+t('tr_anal_col_bought')+'</th>'+
          '<th style="text-align:right;padding:5px 4px;color:var(--am);font-weight:700;font-size:var(--fs-h3)">'+t('tr_anal_col_sold')+'</th>'+
          '<th style="text-align:right;padding:5px 4px;color:var(--am);font-weight:700;font-size:var(--fs-h3)">'+t('tr_anal_col_roi')+'</th>'+
        '</tr></thead><tbody>'+
        byRoi.map(t=>{
          const r=roiCalc(t.buyPrice,t.sellPrice);
          return '<tr style="border-bottom:1px solid #0d1f0d">'+
            '<td style="padding:6px 4px;color:'+(t.isAcad?'var(--gb)':'var(--wh)')+'">'+t.name+(t.isAcad?' 🌱':'')+'</td>'+
            '<td style="text-align:right;padding:6px 4px;color:var(--gr)">'+(t.buyPrice===0?'—':fv(t.buyPrice))+'</td>'+
            '<td style="text-align:right;padding:6px 4px;color:var(--gb)">'+fv(t.sellPrice)+'</td>'+
            '<td style="text-align:right;padding:6px 4px;font-weight:700;font-size:var(--fs-h3);color:'+roiCol(r)+'">'+(r===999?'∞':(r>0?'+':'')+r+'%')+'</td>'+
          '</tr>';
        }).join('')+
        '</tbody></table>';
    }
    // Bilans wg pozycji
    const posG={};
    paired.forEach(t=>{
      if(!t.pos||t.pos==='—')return;
      if(!posG[t.pos])posG[t.pos]={count:0,net:0};
      posG[t.pos].count++;posG[t.pos].net+=t.sellPrice-t.buyPrice;
    });
    if(Object.keys(posG).length){
      h+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gb);margin:0 0 8px;letter-spacing:1px">'+t('tr_anal_by_position')+'</div>';
      h+=Object.entries(posG).map(([pos,d])=>{
        const avg=Math.round(d.net/d.count);
        const posColors={NAP:'var(--rd)',POL:'var(--am)',OBR:'var(--gb)',GK:'#64b5f6'};
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 6px;border-bottom:1px solid #0d1f0d;font-size:var(--fs-dense)">'+
          '<span><span style="background:'+(posColors[pos]||'var(--gr)')+';color:#000;padding:1px 5px;margin-right:6px">'+pos+'</span>'+
          '<span style="color:var(--gr)">×'+d.count+'</span></span>'+
          '<span style="color:'+(avg>=0?'var(--gb)':'var(--rd)')+'">'+t('tr_anal_avg_per_transfer').replace('{val}',(avg>=0?'+':'')+fv(avg))+'</span>'+
        '</div>';
      }).join('');
    }
    // Ocena dyrektora
    h+='<div style="margin-top:14px;background:#0d1f0d;border:1px solid var(--am);padding:10px 12px">'+
      '<div style="font-weight:700;font-size:var(--fs-h3);color:var(--am);margin-bottom:6px">'+t('tr_anal_director_title')+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--wh);line-height:1.6">'+
        (paired.length===0?t('tr_anal_director_none'):
          totalNet>0?t('tr_anal_director_positive').replace('{val}',fv(totalNet)):
          t('tr_anal_director_negative'))+
      '</div>'+
    '</div>';
    el.innerHTML=h;
  }
}
// ─────────────────────────────────────────────────────────────────────────────
let _buyOffer={salary:0,contract:2,starter:false,signing:false,bonus:false,loyalty:false};
function buyTransfer(id){
  if(!G)return;
  const p=(G.transferMarket||[]).find(x=>String(x.id)===String(id));
  if(!p)return;
  if((G.trBoughtThisWindow||0)>=3){notif(t('tr_notif_limit3'),'err');return;}
  if(G.budget<p.transferPrice){notif(t('tr_notif_no_money'),'err');return;}
  if(!p.demands)genDemands(p);
  buyId=id;
  _buyOffer={salary:Math.round(p.salary*1.15/50)*50,contract:2,starter:false,signing:false,bonus:false,loyalty:false};
  renderBuyModal(p);
  openModal('m-buy');
}
function renderBuyModal(p){
  const mt=document.getElementById('mb-text');if(!mt)return;
  const o=_buyOffer;
  const met=demandsMetCount(p,o.salary,o.contract,o.starter,o.signing,o.bonus,o.loyalty);
  const metCol=met>=3?'var(--gb)':met>=2?'var(--am)':'var(--rd)';
  const metLbl=met>=3?t('tr_met_motivated'):met>=2?t('tr_met_neutral'):met===1?t('tr_met_unhappy'):t('tr_met_refuse');
  // OVR z niepewnością — taka sama logika jak na karcie zawodnika
  const _isObs=!!(p._observed||(G&&G.scout&&(G.scout.observed||[]).find(x=>x.id===p.id)));
  const _rawOvr=ovr(p);
  const _scoutErrors={free:{min:10,max:20},local:{min:6,max:12},regional:{min:4,max:8},national:{min:2,max:6},pro:{min:1,max:4},elite:{min:1,max:2}};
  const _err=_scoutErrors[(scoutDef&&scoutDef()||{id:'free'}).id]||_scoutErrors.free;
  const _ovrErr=_err.min+Math.floor(Math.random()*(_err.max-_err.min+1));
  const _showOvr=_isObs?_rawOvr:Math.round(_rawOvr+(Math.random()<0.5?1:-1)*_ovrErr);
  const _ovrLabel=_isObs?('OVR '+_rawOvr):('OVR ~'+_showOvr+' ±'+_err.max);
  mt.innerHTML=
    '<div style="">'+
    '<div style="font-size:var(--fs-dense);color:var(--wh);margin-bottom:4px">'+p.name+' ('+POS_SHORT[p.pos]+', '+p.age+t('tr_age_suffix')+', '+_ovrLabel+')</div>'+
    (function(){
      const _bon=o.signing&&p.demands&&p.demands.includes('signing')?Math.round(Math.max(p.salary,o.salary||p.salary)*2/500)*500:0;
      const _total=p.transferPrice+_bon;
      return '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:2px">'+t('tr_buy_price_label')+'<b style="color:var(--am)">'+fmt(p.transferPrice)+'</b></div>'+
        (_bon>0?'<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:2px">'+t('tr_signing_bonus_label')+'<b style="color:var(--rd)">'+fmtVal(_bon)+'</b></div>'+
          '<div style="font-size:var(--fs-dense);color:var(--wh);margin-bottom:8px;border-top:1px solid var(--gl);padding-top:4px">'+t('tr_total_cost_label')+'<b style="color:var(--rd)">'+fmtVal(_total)+'</b></div>'
        :'<div style="margin-bottom:8px"></div>');
    })()+
    '<div style="border:1px solid var(--gl);padding:8px;margin-bottom:8px">'+
      '<div style="font-size:var(--fs-dense);color:var(--am);margin-bottom:4px">'+t('tr_player_demands_title').replace('{n}',met)+'</div>'+
      demandsHtmlInteractive(p,o)+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;font-size:var(--fs-dense)">'+
      '<div style="border:1px solid var(--gl);padding:6px">'+
        '<div style="color:var(--gr);margin-bottom:3px">'+t('tr_salary_month_label')+'</div>'+
        '<div style="display:flex;gap:3px">'+
          '<button onclick="adjOffer(this.dataset.f,+this.dataset.v)" data-f="salary" data-v="-500" style="background:var(--gm);border:none;color:var(--wh);font-size:var(--fs-dense);padding:2px 6px;cursor:pointer">-</button>'+
          '<span id="o-sal" style="color:var(--am);flex:1;text-align:center">'+fmt(o.salary)+'</span>'+
          '<button onclick="adjOffer(this.dataset.f,+this.dataset.v)" data-f="salary" data-v="500" style="background:var(--gm);border:none;color:var(--wh);font-size:var(--fs-dense);padding:2px 6px;cursor:pointer">+</button>'+
        '</div></div>'+
      '<div style="border:1px solid var(--gl);padding:6px">'+
        '<div style="color:var(--gr);margin-bottom:3px">'+t('tr_contract_seasons_label')+'</div>'+
        '<div style="display:flex;gap:3px">'+
          '<button onclick="adjOffer(this.dataset.f,+this.dataset.v)" data-f="contract" data-v="-1" style="background:var(--gm);border:none;color:var(--wh);font-size:var(--fs-dense);padding:2px 6px;cursor:pointer">-</button>'+
          '<span id="o-con" style="color:var(--am);flex:1;text-align:center">'+o.contract+'</span>'+
          '<button onclick="adjOffer(this.dataset.f,+this.dataset.v)" data-f="contract" data-v="1" style="background:var(--gm);border:none;color:var(--wh);font-size:var(--fs-dense);padding:2px 6px;cursor:pointer">+</button>'+
        '</div></div>'+
    '</div>'+

    '<div style="border:1px solid '+metCol+';padding:6px;font-size:var(--fs-dense);color:'+metCol+'">'+
      t('tr_result_label').replace('{n}','<b>'+met+'</b>').replace('{label}',metLbl)+
    '</div>'+
    '</div>';
}
function toggleBuyOffer(el,field){
  const _f=field||el.dataset.f;
  _buyOffer[_f]=el.checked;
  const p=(G.transferMarket||[]).find(x=>String(x.id)===String(buyId));
  if(p)renderBuyModal(p);
}
function adjOffer(field,delta){
  if(field==='salary')_buyOffer.salary=Math.max(0,_buyOffer.salary+delta);
  if(field==='contract')_buyOffer.contract=Math.max(1,Math.min(5,_buyOffer.contract+delta));
  const p=(G.transferMarket||[]).find(x=>String(x.id)===String(buyId));
  if(p)renderBuyModal(p);
}
function doBuy(){
  const p=(G.transferMarket||[]).find(x=>String(x.id)===String(buyId));
  if(!p){closeModal('m-buy');return;}
  // Sprawdz demands
  const o=_buyOffer;
  const _sigBon=o.signing&&p.demands&&p.demands.includes('signing')?Math.round(Math.max(p.salary,o.salary||p.salary)*2/500)*500:0;
  if(G.budget<p.transferPrice+_sigBon){notif(t('tr_notif_no_money_total').replace('{val}',fmtVal(p.transferPrice+_sigBon)),'err');closeModal('m-buy');return;}
  const met=demandsMetCount(p,o.salary,o.contract,o.starter);
  if(met<=0){notif(t('tr_notif_refuses'),'err');return;}
  if(p.transferPrice>0)G.budget-=p.transferPrice;
  p.clubId=G.myClubId;
  p.contract=o.contract||2;
  p.salary=Math.max(p.salary,o.salary);
  applyDemandEffect(p,met);
  // Zapisz sezon zakupu (blokada sprzedaży przez 1 sezon + podatek)
  p.boughtSeason=G.season||1;
  p.boughtPrice=p.transferPrice||0;
  // Zapisz transfer i hist KUP od razu po cenie — przed bonusem żeby bal był poprawny
  if(!G.fin.transfers)G.fin.transfers=[];
  G.fin.transfers.push({type:'buy',name:p.name,val:p.transferPrice,season:G.season,week:G.week,id:p.id,buyAge:p.age,isAcad:!!(p._isTalent||p.fromAcademy)});
  G.fin.hist.push({w:G.week,inc:0,cost:0,bal:G.budget,note:'KUP: '+p.name,season:G.season}); // koszt w fin.transfers.val
  // Signing bonus — jednorazowy koszt
  if(o.signing&&p.demands&&p.demands.includes('signing')){
    const bon=_sigBon||Math.round(p.salary*2/500)*500;
    G.budget-=bon;
    G.fin.hist.push({w:G.week,inc:0,cost:bon,bal:G.budget,season:G.season,note:t('tr_note_signing_bonus').replace('{name}',p.name)});
    addNews(t('news_signing_bonus').replace('{name}',p.name).replace('{val}',fmtVal(bon)),'err');
  }
  // Loyalty — zapisz gwarancję
  if(o.loyalty&&p.demands&&p.demands.includes('loyalty')){
    p.loyaltyGuarantee=(G.season||1)+2;
  }
  // Performance bonus — zapisz
  if(o.bonus&&p.demands&&p.demands.includes('bonus_perf')){
    p.perfBonus=Math.round(p.salary*0.5/50)*50;
  }
  // Liga min — zapisz
  if(p.demands&&p.demands.includes('league_min')){
    p.leagueMin=p._ligaNeed||(G.myLeague||8);
  }
  p.last=p.last||p.name.split(' ')[1]||p.name;
  if(!p.trainRate){const trR=Math.random();p.trainRate=trR<0.10?(50+Math.floor(Math.random()*31))/100:trR<0.45?(81+Math.floor(Math.random()*29))/100:trR<0.85?(110+Math.floor(Math.random()*40))/100:(150+Math.floor(Math.random()*51))/100;}
  if(!p.trainMatches)p.trainMatches=0;
  // Jeśli to prawdziwy gracz AI — usuń go z klubu AI (nie duplikuj w G.players)
  if(p._realPlayerId){
    const _orig=G.players.find(x=>x.id===p._realPlayerId);
    if(_orig){
      // Przenieś dane oryginału do kupionego obiektu (historia, statystyki)
      p.id=_orig.id;
      p.history=_orig.history||[];
      p.st=_orig.st||{m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0};
      p.seasonRatings=_orig.seasonRatings||[];
      // Usuń oryginał z G.players
      G.players=G.players.filter(x=>x.id!==_orig.id);
    }
    delete p._realPlayerId;
    delete p._fromClubId;
  }
  G.transferMarket=G.transferMarket.filter(x=>String(x.id)!==String(buyId));
  assignJerseyNum(p);
  // Zapisz info o transferze w ostatnim sezonie historii (skąd przyszedł)
  if(!p.history)p.history=[];
  const _lastHBuy=p.history[p.history.length-1];
  if(_lastHBuy&&_lastHBuy.clubId&&_lastHBuy.clubId!==G.myClubId){
    _lastHBuy.transferOut={type:'buy',toClub:G.myClub?G.myClub.n:'?',toClubId:G.myClubId,price:p.transferPrice||0,season:G.season};
  }
  // Dodaj wpis bieżącego sezonu jeśli go brak — żeby strzałka transferu była widoczna od razu
  const _hasCurrentSeason=p.history.find(h=>h.season===G.season&&h.clubId===G.myClubId);
  if(!_hasCurrentSeason){
    p.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'?',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_current:true});
  }
  if(!p.formerClubs)p.formerClubs=[];
  const _fcBuy=p.formerClubs.find(x=>x.clubId===p.clubId);
  if(!_fcBuy&&p.clubId>0){const _fcc=ALL_CLUBS.find(c=>c.id===p.clubId);p.formerClubs.push({clubId:p.clubId,clubName:_fcc?_fcc.n:'?',seasons:0});}
  G.players.push(p);
  if(!G.trBoughtThisWindow)G.trBoughtThisWindow=0;
  G.trBoughtThisWindow++;
  G.fin.salaries=myPl().reduce((s,x)=>s+x.salary,0);
  // fin.transfers i fin.hist KUP już zapisane wyżej (przed bonusem podpisania)
  if(!G.allTimeStats)G.allTimeStats={players:{},bestSeller:null,bestBuyer:null};
  if(!G.allTimeStats.bestBuyer||p.transferPrice>G.allTimeStats.bestBuyer.val)G.allTimeStats.bestBuyer={id:p.id,name:p.name,val:p.transferPrice,season:G.season};
  if(G.allTimeStats.bestBuyer&&G.allTimeStats.bestBuyer.id===p.id){
    if(!p.awards)p.awards=[];
    if(!p.awards.find(function(a){return a.type==='record_transfer_bought';})){
      p.awards.push({type:'record_transfer_bought',icon:'💸',label:t('leg_record_bought')+' — '+fmtVal(p.transferPrice),tier:'legend',season:G.season});
      pushTimeline('record_bought','💸',t('tl_record_bought').replace('{name}',p.name).replace('{val}',fmtVal(p.transferPrice)),{pid:p.id,sentiment:'pos',weight:15});
    }
  }
  closeModal('m-buy');fillTransfers();updateHdr();
  notif(t('tr_notif_bought').replace('{name}',p.name).replace('{val}',fmtVal(p.transferPrice)),'ok');
  addNews(t('news_tr_bought').replace('{name}',p.name).replace('{val}',fmtVal(p.transferPrice)).replace('{n}',p.contract),'ok');
}
function toggleListed(id){
  if(!G)return;
  if(!G.listedPlayers)G.listedPlayers=[];
  if(G.listedPlayers.includes(id)){
    G.listedPlayers=G.listedPlayers.filter(x=>x!==id);
  } else {
    if(G.listedPlayers.length>=3){notif(t('tr_notif_max_sell'),'err');return;}
    // v212: Więź z Klubem — ostrzeżenie przy wystawieniu
    const _lp=G.players.find(x=>x.id===id);
    if(_lp){
      const _bond=getBondLevel(_lp);
      if(_bond&&_bond.level>=2){
        notif(t('tr_notif_bond_warn').replace('{icon}',_bond.icon).replace('{name}',_lp.name).replace('{bond}',_bond.name).replace('{n}',_bond.seasons),'');
      } else {
        notif(t('tr_notif_listed'),'ok');
      }
    } else {
      notif(t('tr_notif_listed'),'ok');
    }
    G.listedPlayers.push(id);
  }
  renderSellTab();
}
function acceptOffer(pid){
  if(!G||!G.pendingOffers)return;
  const o=G.pendingOffers.find(x=>x.pid===pid);if(!o)return;
  const p=G.players.find(x=>x.id===pid);if(!p){G.pendingOffers=G.pendingOffers.filter(x=>x.pid!==pid);notif(t('tr_notif_already_sold'),'err');renderSellTab();return;}
  if(p.clubId!==G.myClubId){G.pendingOffers=G.pendingOffers.filter(x=>x.pid!==pid);notif(t('tr_notif_not_in_club'),'err');renderSellTab();return;}
  G.budget+=o.price;
  // Zapisz transfer w ostatnim wpisie historii
  if(!p.history)p.history=[];
  const _lastHSell=p.history[p.history.length-1];
  if(_lastHSell&&_lastHSell.clubId===G.myClubId){
    _lastHSell.transferOut={type:'sell',toClub:o.clubName||'?',toClubId:o.clubId||0,price:o.price,season:G.season};
  }
  if(!p.formerClubs)p.formerClubs=[];
  const _fcSell=p.formerClubs.find(x=>x.clubId===G.myClubId);
  if(_fcSell)_fcSell.seasons=(_fcSell.seasons||0)+1;
  else p.formerClubs.push({clubId:G.myClubId,clubName:G.myClub?G.myClub.n:'?',seasons:1});
  p.clubId=0;p.starter=false;
  G.players=G.players.filter(x=>x.id!==pid);
  G.fin.salaries=myPl().reduce((s,x)=>s+x.salary,0);
  if(!G.fin.transfers)G.fin.transfers=[];
  G.fin.transfers.push({type:'sell',name:p.name,val:o.price,club:o.clubName,season:G.season,week:G.week,id:p.id,boughtPrice:p.boughtPrice||0,boughtSeason:p.boughtSeason||G.season,soldAge:p.age,isAcad:!!(p._isTalent||p.fromAcademy)});
  G.fin.hist.push({w:G.week,inc:o.price,cost:0,bal:G.budget,season:G.season,note:'SPR: '+p.name});
  G.pendingOffers=G.pendingOffers.filter(x=>x.pid!==pid);
  G.listedPlayers=(G.listedPlayers||[]).filter(x=>x!==pid);
  // Aktualizuj G.academy.hist gdy wychowanek jest sprzedany
  if(p.fromAcademy&&G.academy){
    if(!G.academy.hist)G.academy.hist=[];
    var _ahSell=G.academy.hist.find(function(h){return h.pid===p.id;});
    var _peakOvr8=Math.max.apply(null,(p.history||[]).map(function(h){return h.ovr||0;}).concat([ovr(p)]));
    if(_ahSell){_ahSell.soldTo=o.clubName;_ahSell.fee=o.price;_ahSell.soldAge=p.age;_ahSell.peakOvr=_peakOvr8;_ahSell.action=t('tr_academy_action_sold').replace('{club}',o.clubName);}
    else{G.academy.hist.push({pid:p.id,season:G.season,name:p.name,pos:POS_SHORT[p.pos]||p.pos,action:t('tr_academy_action_sold').replace('{club}',o.clubName),soldTo:o.clubName,fee:o.price,soldAge:p.age,peakOvr:_peakOvr8,archetype:p.archetype||null,joinedSeason:p.history&&p.history.find(function(h){return h.fromAcademy;})?p.history.find(function(h){return h.fromAcademy;}).season:G.season});}
  }
  addNews(t('news_sold_to').replace('{name}',p.name).replace('{club}',o.clubName).replace('{val}',fmtVal(o.price)),'ok');
  notif(t('tr_notif_sold_for').replace('{name}',p.name).replace('{val}',fmtVal(o.price)),'ok');
  fillTransfers();updateHdr();
}
function rejectOffer(pid){
  if(!G||!G.pendingOffers)return;
  G.pendingOffers=G.pendingOffers.filter(x=>x.pid!==pid);
  notif(t('tr_notif_offer_rejected'),'ok');
  renderSellTab();
}
function processAIOffers(){
  // Wywoływane z advWeek — generuj oferty AI
  if(!G)return;
  if(!G.pendingOffers)G.pendingOffers=[];
  const tw=isTransferWindow();
  // Oferty w oknie za wystawionych zawodników (po 1 tygodniu)
  if(tw.open&&G.listedPlayers&&G.listedPlayers.length){
    G.listedPlayers.forEach(pid=>{
      if(G.pendingOffers.find(o=>o.pid===pid))return; // już ma ofertę
      const p=G.players.find(x=>x.id===pid);if(!p)return;
      if(Math.random()<0.75){ // 75% szansa na ofertę
        // v212: Więź z Klubem — AI musi zapłacić więcej za wiernych zawodników
        const _bond=getBondLevel(p);
        const _bondMult=_bond?(_bond.level>=4?1.40:_bond.level>=3?1.25:_bond.level>=2?1.10:1.0):1.0;
        const mult=(80+r(0,50))/100; // 80-130% wartości w oknie
        const price=Math.round(p.value*mult*_bondMult/500)*500;
        const club=pick(ALL_CLUBS.filter(c=>c.id!==G.myClubId));
        G.pendingOffers.push({pid,price,clubName:club?club.n:t('tr_fallback_unknown_club2')});
        addNews(t('news_tr_sell_offer').replace('{name}',p.name).replace('{val}',fmtVal(price)).replace('{club}',club?club.n:t('news_tr_other_club')),'info');G.news[0].action='sell_offer';G.news[0].actionLabel=t('news_tr_action_sell');G.news[0].pid=p.id;
      }
    });
    G.listedPlayers=[];
  }
  // Oferty poza oknem co 5 kolejek (premium 110-180%)
  if(!tw.open&&G.round%5===0){
    const mySquad=myPl().filter(p=>!p.injured&&p.starter);
    if(mySquad.length&&Math.random()<0.4){
      const target=pick(mySquad);
      // v212: Więź z Klubem — oferty spontaniczne rzadsze dla wiernych zawodników
      const _bondT=getBondLevel(target);
      if(_bondT&&_bondT.level>=3&&Math.random()<0.6)return; // 60% szans że oferta w ogóle nie wpłynie
      const _bondMultT=_bondT?(_bondT.level>=4?1.40:_bondT.level>=3?1.25:_bondT.level>=2?1.10:1.0):1.0;
      const mult=(110+r(0,70))/100; // 110-180%
      const price=Math.round(target.value*mult*_bondMultT/500)*500;
      const club=pick(ALL_CLUBS.filter(c=>c.id!==G.myClubId));
      if(!G.pendingOffers.find(o=>o.pid===target.id)){
        G.pendingOffers.push({pid:target.id,price,clubName:club?club.n:t('tr_fallback_unknown_club2')});
        addNews(t('news_tr_sell_offer_surprise').replace('{name}',target.name).replace('{val}',fmtVal(price)).replace('{club}',club?club.n:t('news_tr_other_club')),'info');G.news[0].action='sell_offer';G.news[0].actionLabel=t('news_tr_action_sell');G.news[0].pid=target.id;
      }
    }
  }
}
function getDemandPreview(p){
  if(!p.demands||!G)return'';
  const met=demandsMetCount(p,Math.round(p.salary*1.15/50)*50,2,false);
  const col=met>=3?'var(--gb)':met>=2?'var(--am)':'var(--rd)';
  return '<span style="font-size:var(--fs-dense);color:'+col+'">'+t('tr_demand_preview').replace('{n}',met)+'</span>';
}
function setTrFilter(key,val){
  if(!G)return;
  if(!G._trFilters)G._trFilters={pos:'',sortBy:'ovr',sortDir:1};
  G._trFilters[key]=val;
  renderBuyTab();
}
function toggleTrSort(field){
  if(!G)return;
  if(!G._trFilters)G._trFilters={pos:'',sortBy:'ovr',sortDir:1};
  if(G._trFilters.sortBy===field){
    G._trFilters.sortDir*=-1; // toggle kierunku
  } else {
    G._trFilters.sortBy=field;
    G._trFilters.sortDir=1; // reset do domyslnego
  }
  renderBuyTab();
}
function scoutObserveMarket(pid){
  if(!G)return;initScout();
  const def=getScoutDef();
  const active=(G.scout.modeA||[]).filter(o=>!o.done);
  if(active.length>=def.modeA_slots){notif(t('tr_notif_obs_limit_n').replace('{n}',def.modeA_slots),'err');return;}
  const p=(G.transferMarket||[]).find(x=>x.id===pid)||(G.rumourPool||[]).find(x=>x.id===pid);
  if(!p){notif(t('tr_notif_player_unavailable'),'err');return;}
  if(G.scout.observed&&G.scout.observed[pid]){notif(t('tr_notif_already_watched'),'err');return;}
  G.scout.modeA=G.scout.modeA||[];
  G.scout.modeA.push({targetId:pid,targetType:'player',name:p.name,roundsLeft:def.time,done:false});
  addNews(t('news_scout_obs_started').replace('{name}',p.name).replace('{n}',def.time),'scout');
  notif(t('tr_notif_watching').replace('{name}',p.name).replace('{n}',def.time),'ok');
  fillTransfers();
}
function scoutObserveClub(clubId){
  if(!G)return;initScout();
  const def=getScoutDef();
  const active=(G.scout.modeA||[]).filter(o=>!o.done);
  if(active.length>=def.modeA_slots){notif(t('tr_notif_obs_limit'),'err');return;}
  G.scout.modeA=G.scout.modeA||[];
  G.scout.modeA.push({targetId:clubId,targetType:'club',roundsLeft:def.time+1,done:false});
  const cl=(G.leagues||[]).flatMap(l=>l.clubs||[]).find(c=>c.id===clubId);
  notif(t('tr_notif_watching_club').replace('{name}',cl?cl.n:'?').replace('{n}',def.time+1),'ok');
  renderScoutsTab();
}
function scoutSearchTalent(pos){
  if(!G)return;initScout();
  const def=getScoutDef();
  const acadLvl=getAcadLvl();
  if(acadLvl===0){notif(t('tr_notif_need_academy'),'err');return;}
  const maxT=[0,2,4,6,8][acadLvl]||2;
  const signedThisSeason=(G.scout.signedThisSeason||0);
  if(signedThisSeason>=maxT){notif(t('tr_notif_talent_limit_n').replace('{n}',maxT),'err');return;}
  const active=(G.scout.modeB||[]).filter(o=>!o.done);
  if(active.length>=1){notif(t('tr_notif_scout_busy_talent'),'err');return;}
  G.scout.modeB=G.scout.modeB||[];
  const myLvl=G.myLeague||8;
  const range=def.modeB_range||1;
  const region=t('league_fallback')+' '+(myLvl-range)+'-'+(myLvl+range);
  G.scout.modeB.push({pos:pos||'',region,roundsLeft:def.time,done:false});
  notif(t('tr_notif_scout_searching').replace('{n}',def.time),'ok');
  renderScoutsTab();
}
function signTalent(idx){
  if(!G||!G.scout||!G.scout.discovered)return;
  const d=G.scout.discovered[idx];if(!d)return;
  const p=d.player;
  const cost=p._signingCost||0;
  if(G.budget<cost){notif(t('tr_notif_no_funds_cost').replace('{cost}',fmt(cost)),'err');return;}
  const acadLvl=getAcadLvl();
  const maxT=[0,2,4,6,8][acadLvl]||2;
  if((G.scout.signedThisSeason||0)>=maxT){notif(t('tr_notif_talent_limit'),'err');return;}
  G.budget-=cost;
  if(cost>0){if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:cost,bal:G.budget,season:G.season,note:t('tr_note_talent_a').replace('{name}',p.name)});}
  p.clubId=G.myClubId;p.starter=false;p.contract=p.contract||2;
  p.boughtSeason=G.season||1;p.boughtPrice=0;
  G.players.push(p);
  G.scout.discovered.splice(idx,1);
  G.scout.signedThisSeason=(G.scout.signedThisSeason||0)+1;
  addNews(t('news_scout_talent_signed').replace('{name}',p.name).replace('{pos}',POS_SHORT[p.pos]).replace('{age}',p.age).replace('{pot}',p.potential).replace('{cost}',cost>0?t('news_scout_cost_suffix').replace('{val}',fmt(cost)):''),'scout');
  notif(t('tr_notif_signed').replace('{name}',p.name),'ok');
  renderScoutsTab();
}
function rejectTalent(idx){
  if(!G||!G.scout||!G.scout.discovered)return;
  const d=G.scout.discovered[idx];if(!d)return;
  addNews(t('news_scout_rejected').replace('{name}',d.player.name),'scout');
  G.scout.discovered.splice(idx,1);
  renderScoutsTab();
}
function upgradeScouta(id){
  if(!G)return;initScout();
  const def=SCOUTS_DEF.find(s=>s.id===id);if(!def)return;
  if(G.budget<def.cost){notif(t('tr_notif_no_funds'),'err');return;}
  G.budget-=def.cost;G.scout.level=id;
  notif(t('tr_notif_scout_upgraded').replace('{name}',t('scout_name_'+def.id)),'ok');
  addNews(t('news_scout_hired').replace('{name}',t('scout_name_'+def.id)).replace('{val}',fmt(def.cost)),'ok');
  renderScoutsTab();
}
function renderScoutsTab(){
  const el=document.getElementById('tr-skauci');if(!el||!G)return;
  if(!G.scout)G.scout={level:'free',modeA:[],modeB:{active:false,roundsLeft:0},observed:[],discovered:[],clubReports:[]};
  const sc=G.scout;const sd=scoutDef();const acadLvl=getAcadLvl();
  const canB=canScoutModeB();
  let html='<div style="font-size:var(--fs-dense)">';
  // ── POZIOM SKAUTA ───────────────────────────────────────────────────
  html+='<div style="border:1px solid var(--am);padding:8px;margin-bottom:8px">'+
    '<div style="color:var(--am);margin-bottom:4px">'+t('tr_scout_level_label').replace('{name}',t('scout_name_'+sd.id).toUpperCase())+'</div>'+
    '<div style="color:var(--gr)">'+t('tr_mode_a_info').replace('{n}',sd.modeA_slots).replace('{t}',sd.time)+'</div>'+
    '<div style="color:var(--gr)">'+t('tr_mode_b_info').replace('{age}',sd.modeB_minAge||17).replace('{pot}',sd.modeB_maxPot||75).replace('{t}',sd.time)+'</div>'+
    (sd.cost>0?'<div style="color:var(--rd);margin-top:3px">'+t('tr_scout_cost_recurring').replace('{cost}',fmt(sd.cost))+'</div>':'<div style="color:var(--gb);margin-top:3px">'+t('tr_scout_cost_free')+'</div>');
  // Lista wszystkich poziomów do odblokowania
  const myLvl=G.myLeague||8;
  const upgradeOptions=SCOUTS_DEF.filter(s=>s.id!=='free'&&s.id!==sd.id);
  if(upgradeOptions.length){
    html+='<div style="margin-top:6px;color:var(--gr);font-size:var(--fs-dense);letter-spacing:1px">'+t('tr_available_levels')+'</div>';
    upgradeOptions.forEach(opt=>{
      const isActive=opt.id===sd.id;
      const leagueOk=myLvl<=opt.minLeague;// np. minLeague:6 = dostępny od VI ligi wzwyż (myLvl 1-6)
      const budgetOk=G.budget>=opt.cost;
      if(leagueOk){
        if(budgetOk){
          html+='<button data-sid="'+opt.id+'" onclick="upgradeScout(this.dataset.sid)" style="width:100%;margin-top:4px;background:var(--am);color:#000;border:none;font-size:var(--fs-dense);padding:6px;cursor:pointer;text-align:left">'+
            t('tr_upgrade_btn').replace('{name}',t('scout_name_'+opt.id)).replace('{cost}',fmt(opt.cost))+'</button>';
        } else {
          html+='<div style="margin-top:4px;background:var(--tb);border:1px solid var(--gl);padding:5px;font-size:var(--fs-dense);color:var(--rd)">'+
            t('tr_upgrade_missing').replace('{name}',t('scout_name_'+opt.id)).replace('{cost}',fmt(opt.cost-G.budget))+'</div>';
        }
      } else {
        const reqName=LEAGUE_NAMES[opt.minLeague]||t('league_n').replace('{n}',opt.minLeague);
        html+='<div style="margin-top:4px;background:var(--tb);border:1px solid var(--gl);padding:5px;font-size:var(--fs-dense);color:var(--gr)">'+
          t('tr_upgrade_locked').replace('{name}',t('scout_name_'+opt.id)).replace('{league}',reqName)+'</div>';
      }
    });
  }
  html+='</div>';
  // ── TRYB A — aktywne obserwacje ─────────────────────────────────────
  html+='<div style="color:var(--am);margin-bottom:4px">'+t('tr_mode_a_title')+'</div>';
  const actA=sc.modeA||[];
  if(actA.length){
    actA.forEach(obs=>{
      const src=obs.sourceType==='market'?t('tr_src_market'):obs.sourceType==='rumour'?t('tr_src_rumour'):t('tr_src_club');
      html+='<div style="border:1px solid var(--gl);padding:6px;margin-bottom:4px">'+
        '<div style="color:var(--wh)">'+t('tr_obs_report_eta').replace('{src}',src).replace('{n}','<b>'+obs.roundsLeft+'</b>')+'</div>'+
        '</div>';
    });
  } else {
    html+='<div style="color:var(--gr);margin-bottom:4px">'+t('tr_no_active_obs')+'</div>';
  }
  if(actA.length<sd.modeA_slots){
    const slotsLeft=sd.modeA_slots-actA.length;
    const _p1=LANG==='pl'?(slotsLeft>1?'ów':''):(slotsLeft>1?'s':'');
    const _p2=LANG==='pl'?(slotsLeft>1?'ch':''):'';
    html+='<div style="margin-bottom:8px">'
      +'<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);letter-spacing:1px;margin-bottom:6px">'+t('tr_send_obs_title').replace('{n}',slotsLeft).replace('{p1}',_p1).replace('{p2}',_p2)+'</div>'
      // Karta: Z plotki
      +'<div onclick="sendScoutModeA(\'rumour\',0,0)" style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--tb);border:2px solid var(--gl);border-left:4px solid var(--am);margin-bottom:6px;cursor:pointer" onmouseover="this.style.background=\'var(--gm)\'" onmouseout="this.style.background=\'var(--tb)\'">'
        +'<span style="font-size:var(--fs-display);flex-shrink:0">💬</span>'
        +'<div style="flex:1">'
          +'<div style="font-weight:700;font-size:var(--fs-h3);color:var(--am);margin-bottom:3px">'+t('tr_from_rumour_title')+'</div>'
          +'<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('tr_from_rumour_desc')+'</div>'
        +'</div>'
        +'<span style="font-weight:700;font-size:var(--fs-h3);color:var(--am)">▶</span>'
      +'</div>'
      // Karta: Konkretny klub
      +'<div onclick="sendScoutModeA(\'club\',0,0)" style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--tb);border:2px solid var(--gl);border-left:4px solid var(--gb);margin-bottom:6px;cursor:pointer" onmouseover="this.style.background=\'var(--gm)\'" onmouseout="this.style.background=\'var(--tb)\'">'
        +'<span style="font-size:var(--fs-display);flex-shrink:0">🔍</span>'
        +'<div style="flex:1">'
          +'<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gb);margin-bottom:3px">'+t('tr_specific_club_title')+'</div>'
          +'<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('tr_specific_club_desc')+'</div>'
        +'</div>'
        +'<span style="font-weight:700;font-size:var(--fs-h3);color:var(--gb)">▶</span>'
      +'</div>'
      +'<div style="font-size:var(--fs-dense);color:var(--gr);padding:0 2px">'+t('tr_obs_hint')+'</div>'
    +'</div>';
  } else {
    html+='<div style="color:var(--gr);font-size:var(--fs-dense);margin-bottom:8px">'+t('tr_all_slots_taken').replace('{a}',actA.length).replace('{b}',sd.modeA_slots)+'</div>';
  }
  // Wyniki obserwacji A (obserwowani)
  const obsv=sc.observed||[];
  if(obsv.length){
    html+='<div style="color:var(--gb);margin-bottom:4px">'+t('tr_reports_ready').replace('{n}',obsv.length)+'</div>';
    obsv.forEach((p,idx)=>{
      html+='<div style="border:1px solid var(--gb);padding:6px;margin-bottom:4px">'+
        '<div style="color:var(--gb)">'+p.name+' ✓</div>'+
        '<div style="color:var(--gr)">'+POS_SHORT[p.pos]+' • '+p.age+t('tr_age_suffix')+' • OVR '+ovr(p)+' • '+t('tr_pot_label')+' '+p.potential+'</div>'+
        '<div style="color:var(--gr)">'+t('tr_prev_club_price').replace('{club}',p.prevClub).replace('{price}',fmtVal(p.transferPrice))+'</div>'+
        '<div style="color:var(--gb);font-size:8px">'+t('tr_available_in_buy_tab')+'</div>'+
      '</div>';
    });
  }
  // ── TRYB B — talenty ────────────────────────────────────────────────
  html+='<div style="border-top:1px solid var(--gl);margin-top:8px;padding-top:8px">'+
    '<div style="color:var(--am);margin-bottom:4px">'+t('tr_mode_b_title')+'</div>';
  if(!canB){
    html+='<div style="border:1px solid var(--gl);padding:8px;color:var(--gr)">'+
      '<div style="color:var(--am);margin-bottom:4px">'+t('tr_mode_b_unavailable')+'</div>'+
      '<div>'+t('tr_mode_b_need_academy')+'</div>'+
      '<div style="font-size:var(--fs-dense);margin-top:4px">'+t('tr_academy_basic_info')+'<br>'+
      t('tr_academy_elite_info')+'</div>'+
    '</div>';
  } else {
    const maxT=acadMaxTalents();
    const curT=myPl().filter(p=>p._isTalent).length;
    html+='<div style="color:var(--gr);margin-bottom:4px">'+t('tr_signed_talents').replace('{cur}',curT).replace('{max}',maxT).replace('{lvl}',acadLvl)+'</div>';
    if(sc.modeB&&sc.modeB.active){
      html+='<div style="border:1px solid var(--am);padding:6px;margin-bottom:6px">'+
        '<div style="color:var(--am)">'+t('tr_scout_in_field').replace('{n}',sc.modeB.roundsLeft)+'</div>'+
        '<div style="color:var(--gr);font-size:var(--fs-dense)">'+t('tr_scout_region').replace('{n}',sd.modeB_range).replace('{age}',sd.modeB_minAge)+'</div></div>';
    } else if(curT<maxT){
      html+='<div style="color:var(--gr);margin-bottom:4px">'+t('tr_send_scout_label')+'</div>'+
        '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">'+
        ['','GK','OBR','POL','NAP'].map(pos=>'<button data-pos="'+pos+'" onclick="sendScoutModeB(this.dataset.pos)" style="font-size:var(--fs-dense);padding:2px 7px;border:1px solid var(--gl);background:var(--tb);color:var(--gr);cursor:pointer">'+(pos?POS_SHORT[pos]:t('tr_pos_any'))+'</button>').join('')+
        '</div>';
    } else {
      html+='<div style="color:var(--rd)">'+t('tr_talent_limit_reached')+'</div>';
    }
    // Odkryci talenci do decyzji
    const disc=sc.discovered||[];
    if(disc.length){
      html+='<div style="color:var(--gb);margin-bottom:4px">'+t('tr_discovered_title').replace('{n}',disc.length)+'</div>';
      disc.forEach((p,idx)=>{
        const cost=p.signingCost||0;
        html+='<div style="border:1px solid var(--gb);padding:8px;margin-bottom:6px">'+
          '<div style="display:flex;justify-content:space-between">'+
            '<div style="color:var(--gb)">'+p.name+'</div>'+
            '<div style="color:var(--rd);font-size:var(--fs-dense)">'+t('tr_decision_weeks').replace('{n}',p._talentDecisionWeeks)+'</div>'+
          '</div>'+
          '<div style="color:var(--gr)">'+POS_SHORT[p.pos]+' • '+p.age+t('tr_age_suffix')+' • OVR '+ovr(p)+' • <b style="color:var(--am)">'+t('tr_pot_label')+' '+p.potential+'</b></div>'+
          '<div style="color:var(--gr)">'+p.prevClub+'</div>'+
          '<div style="color:var(--am)">'+t('tr_signing_cost_label')+(cost>0?fmt(cost):t('tr_free_amateur'))+'</div>'+
          '<div style="display:flex;gap:4px;margin-top:6px">'+
            '<button onclick="signTalent('+idx+')" style="flex:1;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('tr_sign_btn')+'</button>'+
            '<button onclick="dismissTalent('+idx+')" style="flex:1;background:var(--gm);color:var(--gr);border:1px solid var(--gl);font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('tr_reject_talent_btn')+'</button>'+
          '</div></div>';
      });
    }
  }
  html+='</div></div>';
  el.innerHTML=html;
}
function upgradeScout(id){
  if(!G)return;
  const def=SCOUTS_DEF.find(s=>s.id===id);if(!def)return;
  const myLvl=G.myLeague||8;
  if(myLvl>def.minLeague){notif(t('tr_upgrade_higher_league').replace('{league}',LEAGUE_NAMES[def.minLeague]||t('board_fallback_higher_league')),'err');return;}
  if(G.budget<def.cost){notif(t('tr_notif_no_funds2'),'err');return;}
  G.budget-=def.cost;
  if(!G.scout)G.scout={level:'free',modeA:[],modeB:{active:false,roundsLeft:0},observed:[],discovered:[],clubReports:[]};
  G.scout.level=id;
  const _defName=t('scout_name_'+def.id);
  // Koszt w finansach
  if(!G.fin)G.fin={};
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:def.cost,bal:G.budget,note:t('tr_note_scout_hired').replace('{name}',_defName)});
  addNews(t('news_scout_hired_once').replace('{name}',_defName).replace('{val}',fmt(def.cost)),'ok');
  notif(t('tr_notif_scout_hired').replace('{name}',_defName),'ok');
  renderScoutsTab();
}
function scoutAddToMarket(idx){
  if(!G||!G.scout||!G.scout.clubReports)return;
  const p=G.scout.clubReports[idx];if(!p)return;
  if(!G.transferMarket)G.transferMarket=[];
  if(!G.scout.observed)G.scout.observed={};
  G.scout.observed[p.id]=true;
  G.transferMarket.push(p);
  G.scout.clubReports.splice(idx,1);
  notif(t('tr_notif_added_to_market').replace('{name}',p.name),'ok');
  renderScoutsTab();fillTransfers();
}
function showClubPicker(){
  if(!G)return;
  const def=getScoutDef();
  const active=(G.scout.modeA||[]).filter(o=>!o.done);
  if(active.length>=def.modeA_slots){notif(t('tr_notif_obs_limit'),'err');return;}
  const myLvl=G.myLeague||8;
  const clubs=(G.leagues||[]).filter(l=>Math.abs(l.level-myLvl)<=1).flatMap(l=>l.clubs||[]).filter(c=>c.id!==G.myClubId);
  const el=document.getElementById('tr-skauci');if(!el)return;
  const picker='<div style="border:1px solid var(--am);padding:8px;margin-top:6px;font-size:var(--fs-dense)">'+
    '<div style="color:var(--am);margin-bottom:4px">'+t('tr_pick_club_title')+'</div>'+
    clubs.slice(0,12).map(c=>'<button onclick="scoutObserveClub('+c.id+')" style="display:block;width:100%;text-align:left;border:none;border-bottom:1px solid var(--gl);background:transparent;color:var(--gr);font-size:var(--fs-dense);padding:4px 0;cursor:pointer">'+c.n+'</button>').join('')+
  '</div>';
  el.insertAdjacentHTML('beforeend',picker);
}
function sendScoutModeA(sourceType, targetId, sourceId){
  if(!G||!G.scout)return;
  const sd=scoutDef();
  if((G.scout.modeA||[]).length>=sd.modeA_slots){
    notif(t('tr_notif_scout_busy_max').replace('{n}',sd.modeA_slots),'err');return;
  }
  const obs={sourceType,targetId:targetId||0,sourceId:sourceId||0,roundsLeft:sd.time};
  if(!G.scout.modeA)G.scout.modeA=[];
  G.scout.modeA.push(obs);
  const label=sourceType==='market'?t('tr_label_market'):sourceType==='rumour'?t('tr_label_rumour'):t('tr_label_random_club');
  addNews(t('news_scout_a_sent').replace('{label}',label).replace('{n}',sd.time),'scout');
  notif(t('tr_notif_scout_sent'),'ok');
  fillTransfers();
}
function sendScoutModeB(pos){
  if(!G||!G.scout)return;
  if(!canScoutModeB()){notif(t('tr_notif_need_academy_b'),'err');return;}
  if(G.scout.modeB&&G.scout.modeB.active){notif(t('tr_notif_already_searching'),'err');return;}
  const sd=scoutDef();
  G.scout.modeB={active:true,roundsLeft:sd.time,pos:pos||''};
  addNews(t('news_scout_b_sent').replace('{pos}',pos?t('news_scout_b_sent_pos').replace('{pos}',POS_SHORT[pos]):'').replace('{n}',sd.time),'scout');
  notif(t('tr_notif_scout_departed'),'ok');
  fillTransfers();
}
function signTalent(idx){
  if(!G||!G.scout||!G.scout.discovered)return;
  const p=G.scout.discovered[idx];if(!p)return;
  const cost=p.signingCost||0;
  if(cost>0&&G.budget<cost){notif(t('tr_notif_no_funds_need').replace('{cost}',fmt(cost)),'err');return;}
  const maxT=acadMaxTalents();
  const curT=myPl().filter(x=>x._isTalent).length;
  if(curT>=maxT&&maxT>0){notif(t('tr_talent_limit_academy').replace('{max}',maxT),'err');return;}
  if(cost>0){G.budget-=cost;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:cost,bal:G.budget,season:G.season,note:t('tr_note_talent_b').replace('{name}',p.name)});}
  p.clubId=G.myClubId;p.contract=r(2,4);p.starter=false;
  G.players.push(p);
  G.scout.discovered.splice(idx,1);
  addNews(t('news_scout_b_signed').replace('{name}',p.name).replace('{pos}',POS_SHORT[p.pos]).replace('{age}',p.age).replace('{pot}',p.potential).replace('{cost}',cost>0?t('news_scout_b_cost').replace('{val}',fmt(cost)):t('news_scout_b_free')),'scout');
  notif(t('tr_notif_signed2').replace('{name}',p.name),'ok');
  fillTransfers();
}
function dismissTalent(idx){
  if(!G||!G.scout||!G.scout.discovered)return;
  const p=G.scout.discovered[idx];if(!p)return;
  G.scout.discovered.splice(idx,1);
  notif(t('tr_notif_rejected').replace('{name}',p.name),'info');
  fillTransfers();
}
function observeFromMarket(pid){
  if(!G)return;
  const p=(G.transferMarket||[]).find(x=>String(x.id)===String(pid));
  if(!p){notif(t('tr_notif_player_not_found'),'err');return;}
  sendScoutModeA('market',pid,0);
}
function fillTransfers(){
  if(!G)return;
  const tb=document.getElementById('tr-budget');
  if(tb)tb.textContent=t('tr_budget').replace('{n}',fmt(G.budget));
  // Window bar
  const wb=document.getElementById('tr-window-bar');
  if(wb){
    const tw=isTransferWindow();
    if(tw.open){
      wb.innerHTML='<span style="color:var(--gb)">'+t('tr_window_open').replace('{type}',tw.type==='LETNIE'?t('window_summer'):t('window_winter'))+'</span> • '+t('tr_window_left').replace('{n}',tw.weeksLeft);
    } else {
      wb.innerHTML='<span style="color:var(--rd)">'+t('tr_window_closed')+'</span>'+(tw.eta?' • '+t('tr_window_eta').replace('{n}',tw.eta):' • '+tw.next);
    }
  }
  // Render active tab
  const activeTab=document.querySelector('#p-transfers .tab-btn.active');
  const tabKey=activeTab?activeTab.getAttribute('data-i18n'):'tr_tab_buy';
  if(tabKey==='tr_tab_buy')renderBuyTab();
  else if(tabKey==='tr_tab_sell')renderSellTab();
  else if(tabKey==='tr_tab_scouts')renderScoutsTab();
  else if(tabKey==='tr_tab_history')renderHistoriaTab();
}
function renderMarket(pls){const el=document.getElementById('tr-market');if(!el)return;el.innerHTML=pls.length?pls.map(p=>'<div class="tcard"><div><div class="tname">'+p.name+'</div><div class="tdet">'+(POS_SHORT[p.pos]||p.pos)+' \u2022 '+p.age+'l \u2022 OVR '+ovr(p)+' \u2022 '+fmtVal(p.value)+'</div><button class="btn-buy" onclick="buyMP(\''+p.id+'\')">'+t('tr_btn_buy').replace('{n}',fmtVal(p.value))+'</button></div><div class="t-ovr">'+ovr(p)+'</div></div>').join(''):'<div style="color:var(--gr);padding:12px;font-size:var(--fs-dense)">'+t('tr_no_players')+'</div>';}
function sellPlayer(id){openSellModal(id);}

// ══════════════════════════════════════════════════════════════
// MODAL KARTY KLUBU AI
// ══════════════════════════════════════════════════════════════

