function r(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
// Fisher-Yates: kolejność losowa co wywołanie — używane tam, gdzie kolejność iteracji po klubach
// AI decyduje o pierwszeństwie do wspólnej puli (np. podpisywanie z G.fa), żeby nie faworyzować
// systematycznie tych samych klubów przez stałą kolejność ALL_CLUBS.
function shuffled(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
// Waluta bazowa gry to EUR (rate 1). USD/PLN są przeliczane wyłącznie na potrzeby wyświetlania.
const CURRENCY_RATES={USD:1.09,EUR:1,PLN:4.3};
const CURRENCY_SYMBOLS={USD:'$',EUR:'€',PLN:'zł'};
let CURRENT_CURRENCY='EUR';
function curRate(){return CURRENCY_RATES[CURRENT_CURRENCY]||1;}
function curSym(){return CURRENCY_SYMBOLS[CURRENT_CURRENCY]||'€';}
function fmt(v){const n=Math.round((v||0)*curRate());const s=n.toLocaleString('pl-PL');return CURRENT_CURRENCY==='USD'?curSym()+s:s+' '+curSym();}
function posOrd(p){return{GK:0,OBR:1,POL:2,NAP:3}[p]||4;}
function fmtVal(v){const n=(v||0)*curRate();if(n>=1000000){const m=n/1000000;return(m>=10?Math.round(m):m.toFixed(1).replace(/\.0$/,''))+' mln '+curSym();}if(n>=1000)return Math.round(n/1000)+'k '+curSym();return Math.round(n)+' '+curSym();}
// Wariant fmtVal() dla tabel porównawczych (np. worldTab → Aktywne Kluby): tylko dwa progi
// (mln / k), bez trzeciego "gołych euro" — inaczej w jednej kolumnie mieszałyby się 3 jednostki
// naraz przy porównywaniu klubów z różnych lig.
function fmtMln(v){const n=(v||0)*curRate();if(Math.abs(n)>=1000000){const m=n/1000000;return(Math.abs(m)>=10?Math.round(m):m.toFixed(1).replace(/\.0$/,''))+' mln '+curSym();}return Math.round(n/1000)+'k '+curSym();}
// ── OŚ CZASU KLUBU — milestone'y pozaligowe (Sesja 2) ─────────────────
function pushTimeline(type,icon,label,opts){
  if(!G)return;
  if(!G.timeline)G.timeline=[];
  opts=opts||{};
  if(G._tlNextId==null)G._tlNextId=1;
  G.timeline.push({id:G._tlNextId++,season:G.season,week:G.week,type:type,icon:icon,label:label,pid:opts.pid||null,sentiment:opts.sentiment||'neutral',weight:opts.weight!=null?opts.weight:15});
}
const KRON_TIMELINE_WORTHY=['x01_first_title','x02_relegation_crisis','x03_promotion_eve','x04_dynasty_threat','h01_hall_of_fame','k04_wantsout_crisis',
  // Sesja 1 (kron_cat_history): rocznice (hs01-hs08) + jednorazowe osiągnięcia klubowe (hs09, hs11)
  'hs01_first_title_anniversary','hs02_hall_of_fame_anniversary','hs03_training_upgrade_anniversary','hs04_data_secure_anniversary',
  'hs05_manager_anniversary','hs06_first_promotion_anniversary','hs07_worst_season_anniversary','hs08_record_signing_anniversary',
  'hs09_club_museum','hs11_statue_proposal',
  // Sesja 2 (kron_cat_academy): rocznica pierwszego absolwenta + łańcuch międzysezonowy ac18/ac19
  'ac01_first_graduate_anniversary','ac18_prospect_scout_interest','ac19_prospect_scout_resolution',
  // Sesja 3 (kron_cat_sporting): rocznice sportowe (najlepsze zwycięstwo/atak/obrona)
  'sp10_best_win_anniversary','sp11_best_attack_anniversary','sp12_best_defense_anniversary',
  // Sesja 5 (kron_cat_transfers): powrót byłego zawodnika do klubu — realny transfer, warty pamięci
  't16_prodigal_son_returns',
  // Sesja 7 (kron_cat_club): założenie oficjalnego fanklubu — jednorazowe osiągnięcie klubowe
  'cl02_fan_club_founding',
  // Sesja 8 (kron_cat_crisis): kryzysy o skali porównywalnej z już wpisanymi k04/x02 — dramatyczne
  // momenty warte pamięci, spójnie z istniejącym wzorcem tej kategorii.
  'cr01_budget_crisis','cr04_board_ultimatum',
  // Sesja 10 (kron_cat_cup): rocznica zdobycia Pucharu i głęboki bieg pucharowy jako outsider
  'cp01_cup_winner_anniversary','cp03_giant_slayer_run',
  // Sesja 11 (PLAN_KRONIKA_ROZBUDOWA.txt pkt 3b/2): tr01/dc01 ustawiają trwałe G.flags.* (czytane
  // przez hs03/hs04 z Sesji 1), ale dotąd nie trafiały do G.timeline — dodane, żeby fanMemoryTrigger()
  // też mógł je czasem przypomnieć (osobny, lżejszy mechanizm niż dedykowana rocznica hs03/hs04).
  'tr01_training_accident','dc01_data_breach',
  // Sesja 12: 3 nowe przykładowe łańcuchy międzysezonowe (oba etapy każdego, patrz PLAN pkt 4
  // "Gotowe do Sesji 12") — dodane na wzór ac18/ac19, żeby też stały się materiałem fanMemoryTrigger()
  't20_captain_loyalty_pledge','t21_captain_loyalty_resolution',
  'cr09_rival_prediction','cr10_rival_prediction_resolution',
  'cl10_city_stadium_promise','cl11_city_stadium_promise_resolution',
  // Sesja 13 (odwieczny rywal na podstawie historii meczów, G.h2hHistory): ogłoszenie tożsamości
  // rywala to jednorazowe, warte pamięci wydarzenie klubowe — spójnie z cl02/hs09/hs11. rv02
  // (cykliczna rocznica co 5. spotkanie) świadomie NIE trafia tutaj, bo powtarza się w nieskończoność.
  'rv01_nemesis_named',
  // Sesja 14 (Akademia Wariant B — faza trainee, kronika-eventy-academy.js): promocja z treningu
  // w akademii do kadry seniorskiej to duży, jednorazowy moment na zawodnika, spójnie z ac01.
  'ac28_trainee_graduation'];
const KRON_IGNORED_WORTHY=['s01_party_scandal','k02_injury_streak'];
function ovr(p){const t=p.tec,pa=p.pas,sh=p.sht,de=p.def,ph=p.phy,me=p.men;if(p.pos==='GK')return Math.round(de*0.35+me*0.35+ph*0.10+pa*0.10+t*0.05+sh*0.05);if(p.pos==='OBR')return Math.round(de*0.35+ph*0.35+me*0.10+pa*0.10+t*0.05+sh*0.05);if(p.pos==='POL')return Math.round(pa*0.35+t*0.35+me*0.10+ph*0.10+de*0.05+sh*0.05);if(p.pos==='NAP')return Math.round(sh*0.35+t*0.35+me*0.10+ph*0.10+pa*0.05+de*0.05);return Math.round((t+pa+sh+de+ph+me)/6);}
const AGE_MULT={16:2.2,17:2.1,18:2.0,19:1.9,20:1.8,21:1.7,22:1.6,23:1.5,24:1.4,25:1.3,26:1.2,27:1.1,28:1.0,29:0.95,30:0.9,31:0.85,32:0.8,33:0.75,34:0.7,35:0.65,36:0.6,37:0.55};
function ageMult(age){return AGE_MULT[age]!==undefined?AGE_MULT[age]:(age<=15?2.2:0.5);}
// ── SYSTEM SKAUTÓW ───────────────────────────────────────────────────
const SCOUTS_DEF=[
  {id:'free',    name:'Skaut amator',      cost:0,      hireCost:0,      minLeague:8, modeA_slots:1, modeB_range:1, modeB_minAge:17, modeB_maxPot:72, time:6},
  {id:'local',   name:'Skaut lokalny',     cost:10000,  hireCost:10000,  minLeague:8, modeA_slots:2, modeB_range:2, modeB_minAge:16, modeB_maxPot:78, time:4},
  {id:'regional',name:'Skaut regionalny',  cost:36000,  hireCost:36000,  minLeague:6, modeA_slots:2, modeB_range:2, modeB_minAge:16, modeB_maxPot:84, time:4},
  {id:'national',name:'Skaut krajowy',     cost:100000, hireCost:100000, minLeague:4, modeA_slots:3, modeB_range:3, modeB_minAge:15, modeB_maxPot:90, time:3},
  {id:'pro',     name:'Skaut profesjonalny',cost:240000,hireCost:240000, minLeague:2, modeA_slots:3, modeB_range:3, modeB_minAge:14, modeB_maxPot:95, time:3},
  {id:'elite',   name:'Skaut elitarny',    cost:600000, hireCost:600000, minLeague:1, modeA_slots:4, modeB_range:0, modeB_minAge:14, modeB_maxPot:99, time:3},
];
function getScoutDef(){
  if(!G||!G.scout)return SCOUTS_DEF[0];
  return SCOUTS_DEF.find(s=>s.id===G.scout.level)||SCOUTS_DEF[0];
}
function scoutModeASlots(){return getScoutDef().modeA_slots;}
function initScout(){
  if(!G.scout)G.scout={
    level:'free',
    modeA:[], // obserwacje rynku [{pid, targetId, targetType, name, roundsLeft, done, report}]
    modeB:[], // szukanie talentów [{region, pos, roundsLeft, done}]
    discovered:[], // znalezione talenty czekające na decyzję [{player, roundsLeft}]
    observed:{}, // {id: fullPlayerData} — gotowe raporty
    clubWatching:null, // obserwowany klub AI
  };
}
function calcDynamicValueMult(p){
  // Zwraca mnożnik wartości zawodnika na podstawie formy, serii, kontuzji
  let mult=1.0;
  // Forma
  const fm=p.form||100;
  if(fm>80)mult*=1.08;
  else if(fm>60)mult*=1.0;
  else if(fm>40)mult*=0.92;
  else mult*=0.88;
  // Kontuzja
  if(p.injured)mult*=0.85;
  // "Gorący" zawodnik (ostatni mecz 3+ gole/asysty)
  if(p._hot)mult*=1.20;
  // Reputacja klubu wpływa na cenę sprzedaży
  if(G){
    const rep=G.reputation||30;
    if(rep>=500)mult*=1.10;
    else if(rep>=250)mult*=1.05;
    else if(rep<50)mult*=0.95;
  }
  // Seria wygranych klubu
  if(G){
    const ws=G.winStreak||0;const ls=G.loseStreak||0;
    if(ws>=5)mult*=1.08;
    else if(ws>=3)mult*=1.04;
    else if(ls>=4)mult*=0.92;
    else if(ls>=2)mult*=0.96;
  }
  return Math.max(0.5,Math.min(2.0,mult));
}
function calcValueDynamic(p){
  // Wartość bazowa × mnożniki dynamiczne
  const base=calcValue(ovr(p),p.age);
  return Math.round(base*calcDynamicValueMult(p)/1000)*1000||base;
}
function calcValue(o,age){
  if(o<=0)return 50;
  const m=ageMult(age);
  let v=Math.pow(o/99,4.5)*2500000*m;
  v=Math.max(50,v);
  // Zaokrąglenie do czytelnych progów
  if(v<500)v=Math.round(v/50)*50;
  else if(v<5000)v=Math.round(v/100)*100;
  else if(v<50000)v=Math.round(v/500)*500;
  else if(v<500000)v=Math.round(v/5000)*5000;
  else v=Math.round(v/50000)*50000;
  return v;
}
// Pensja = bezpośrednia proporcja wartości (stała krotność value/salary per liga), zamiast
// niezależnej tabeli SAL_MIN/SAL_MAX — poprzedni dwuparametrowy projekt dawał krotność wahającą
// się od 3x do 2800x w obrębie jednej ligi (liniowa interpolacja nie nadążała za wykładniczą
// krzywą calcValue). WAGE_MULT kalibrowane tak, by krotność value/salary (opłata transferowa ÷
// miesięczna pensja) odpowiadała realnym proporcjom czołowych klubów świata (Neymar/Ronaldo/
// Haaland itd.: rząd wielkości 30x-100x) — 50x w Premier Division rosnąco do 70x w VII Lidze
// (im niżej w piramidzie, tym relatywnie tańsze utrzymanie zawodnika względem jego wartości).
function calcSalary(val,lvl,ovr_val){
  const _lvl=lvl||(G?G.myLeague:8)||8;
  const WAGE_MULT={1:1.000,2:0.946,3:0.897,4:0.854,5:0.814,6:0.778,7:0.745,8:0.714};
  const wm=WAGE_MULT[_lvl]||0.714;
  return Math.max(50,Math.round((val||0)/50*wm/50)*50);
}
function mkAttrs(pos,minO,maxO){for(let a=0;a<40;a++){const b=r(minO,maxO),s=15;const t=Math.max(1,Math.min(99,b+r(-s,s))),pa=Math.max(1,Math.min(99,b+r(-s,s))),sh=Math.max(1,Math.min(99,b+r(-s,s))),de=Math.max(1,Math.min(99,b+r(-s,s))),ph=Math.max(1,Math.min(99,b+r(-s,s))),me=Math.max(1,Math.min(99,b+r(-s,s)));const tmp={pos,tec:t,pas:pa,sht:sh,def:de,phy:ph,men:me};if(ovr(tmp)>=minO&&ovr(tmp)<=maxO)return{tec:t,pas:pa,sht:sh,def:de,phy:ph,men:me};}const m=Math.round((minO+maxO)/2);return{tec:m,pas:m,sht:m,def:m,phy:m,men:m};}
let pid=1;
function mkPlayer(clubId){const pos=pick(['GK','OBR','OBR','OBR','POL','POL','POL','NAP']);const rng=Math.random()*100;const[minO,maxO]=rng<55?[5,25]:rng<95?[26,40]:[41,55];const at=mkAttrs(pos,minO,maxO);const age=r(17,35);const _tmpOvr=ovr({pos,...at});const val=calcValue(_tmpOvr,age);const sal=calcSalary(val,null,_tmpOvr);const name=getUniqueName();
// Ukryty talent treningowy: 0.5-2.0 (wolno/normalnie/szybko/elitarnie)
const trRoll=Math.random();
const trainRate=trRoll<0.10?r(50,80)/100:trRoll<0.45?r(81,109)/100:trRoll<0.85?r(110,149)/100:r(150,200)/100;
const _p2={id:pid++,clubId,name,last:name.split(' ')[1]||name,age,pos,...at,potential:(function(){const curOvr=ovr({pos,...at});return Math.min(99,curOvr+Math.max(5,r(10,55)));;})(),form:100,value:val,salary:sal,contract:r(1,3),starter:false,injured:false,birthWeek:r(1,30),birthSeason:1,jerseyNum:0,contractChangedSeason:0,trainRate,trainMatches:0,st:{m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0},history:[],formerClubs:[],status:'active'};
// Jeśli gra trwa — dodaj wpis _current dla bieżącego sezonu
if(typeof G!=='undefined'&&G&&G.season&&clubId>0){
  const _hc=typeof ALL_CLUBS!=='undefined'?ALL_CLUBS.find(c=>c.id===clubId):null;
  _p2.history.push({season:G.season,clubId,club:_hc?_hc.n:'?',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(_p2),avgRat:null,_current:true});
}
_p2.traits=genTraits(_p2);if(!_p2.demands)genDemands(_p2);return _p2;}

// ── Bezpiecznik: żaden klub AI nie może zostać bez bramkarza ────────────────
// mkPlayer() losuje pozycję z 8 opcji (1/8 szans na GK) bez żadnej gwarancji rozkładu — przy
// generowaniu wielu zawodników naraz (reset składu dołu VII Ligi, patrz season-summary.js) jest
// realna szansa (~9% przy 18 zawodnikach) na zero bramkarzy. Wygasłe kontrakty/transfery AI też
// mogą teoretycznie wyzerować pozycję. Wołane po każdej operacji, która mogła zmienić składy
// klubów AI (season-summary.js przy zmianie sezonu, week-progress.js przy zimowym oknie).
function ensureClubGoalkeepers(){
  if(!G||!G.leagues)return;
  G.leagues.forEach(lg=>(lg.clubs||[]).forEach(club=>{
    if(club.id===G.myClubId)return; // klub gracza pilnuje składu sam (alert o brakach)
    if(G.players.some(p=>p.clubId===club.id&&p.pos==='GK'))return;
    const np=mkPlayer(club.id);np.pos='GK';np.last=np.name.split(' ')[1]||np.name;
    np.value=calcValue(ovr(np),np.age);np.salary=calcSalary(np.value,lg.level,ovr(np));
    G.players.push(np);
  }));
}

// ── ODWIECZNY RYWAL — bilans h2h trwały przez całą karierę save'a (G.h2hHistory, patrz
// engine/match-engine.js, gdzie jest aktualizowany po każdym meczu klubu gracza — ligowym i
// pucharowym, bo oba to realne spotkania z przeciwnikiem). W odróżnieniu od G.rival (derby
// losowane od nowa co sezon, ui/world-board-render.js::assignDerbyPairs() — "arbitralne, brak
// danych geograficznych") ten rywal wynika WYŁĄCZNIE z policzalnej historii pojedynków.
//
// Kryteria wyboru — ścisłe sortowanie leksykograficzne, każde kolejne tylko rozstrzyga remis
// poprzedniego (bez wag wymyślonych na miejscu):
//  1) najwięcej rozegranych meczów — to dosłowna treść słowa "odwieczny" (częstość/długość
//     rywalizacji); bez tego jednorazowy dramatyczny mecz z klubem spotkanym raz mógłby
//     wygrać tytuł wbrew nazwie.
//  2) przy remisie: najwięcej "dramatycznych" wyników (patrz h2hIsDramaticMatch niżej).
//  3) przy kolejnym remisie: najbardziej wyrównany bilans (najmniejsze |w-l|) — rywalizacja
//     to względna równowaga sił, nie jednostronna dominacja.
// Próg min. 3 spotkań — mniej nie uzasadnia miana "odwieczny".
function getNemesisClub(){
  if(!G||!G.h2hHistory)return null;
  const entries=Object.entries(G.h2hHistory).filter(function(e){return e[1].matches>=3;});
  if(!entries.length)return null;
  entries.sort(function(a,b){
    const ha=a[1],hb=b[1];
    if(hb.matches!==ha.matches)return hb.matches-ha.matches;
    if(hb.dramatic!==ha.dramatic)return hb.dramatic-ha.dramatic;
    return Math.abs(ha.w-ha.l)-Math.abs(hb.w-hb.l);
  });
  return {clubId:parseInt(entries[0][0]),hist:entries[0][1]};
}
// "Dramatyczny" mecz — dwie policzalne, niezależne reguły z minutowego przebiegu goli (bez
// trzymania pełnej historii minut na zawsze — liczone raz, w chwili końca meczu):
//  a) remis wyrównany w doliczonym czasie (ostatni gol meczu pada w min>=90, wynik = remis),
//  b) odwrócenie wyniku (strona, która w dowolnym momencie meczu prowadziła, kończy mecz
//     bez zwycięstwa — remisem lub porażką). Spełnienie któregokolwiek liczy się jako 1.
function h2hIsDramaticMatch(hg,ag,goals){
  if(!goals||!goals.length)return false;
  const sorted=goals.slice().sort(function(a,b){return a.min-b.min;});
  let rh=0,ra=0,everLedH=false,everLedA=false,lastMin=null;
  sorted.forEach(function(g){
    if(g.isH)rh++;else ra++;
    if(rh>ra)everLedH=true;
    if(ra>rh)everLedA=true;
    lastMin=g.min;
  });
  const lateDraw=hg===ag&&lastMin!=null&&lastMin>=90;
  const reversal=(everLedH&&hg<=ag)||(everLedA&&ag<=hg);
  return lateDraw||reversal;
}
let G=null,selClubId=null,buyId=null,m_hId=0,m_aId=0,liveStats={},matchSpeed=1500,allEvts=[],matchInProgress=false;
let NAME_POOL=[],namePoolIdx=0;
