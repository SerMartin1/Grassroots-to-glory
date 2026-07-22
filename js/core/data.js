const CLUBS_POOL=[
  "KS Zalesie",
  "LKS Brzeziny",
  "Grom Wysoka",
  "Orzeł Dębina",
  "Sokół Grabów",
  "Pogoń Radlin",
  "Naprzód Kamień",
  "Sparta Jastrzębie",
  "Huragan Lipiny",
  "Błękitni Krzyżanowice",
  "Stal Borowa",
  "Włókniarz Książenice",
  "Iskra Łęki",
  "Victoria Górki",
  "Polonia Rudniki",
  "Unia Łagów",
  "Start Cegłów",
  "Zryw Kłoda",
  "Olimpia Rzeczyca",
  "Czarni Wola",
  "Piast Młynów",
  "Lechia Dąbrowa",
  "Korona Stare Pole",
  "Tęcza Brzoza",
  "Płomień Czernica",
  "Burza Kozłów",
  "Rolnik Borki",
  "Gwiazda Kamionka",
  "Hetman Łazy",
  "Jurand Siedlec",
  "Odra Chobienia",
  "Noteć Lubasz",
  "Bug Mierzwice",
  "Pilica Belsk",
  "Narew Tykocin",
  "Wisła Kępa",
  "Bzura Piątek",
  "San Mokre",
  "Warta Olszówka",
  "Drawa Ostrowice",
  "Cukrownik Tuczno",
  "Kolejarz Brzezie",
  "Górnik Ruda",
  "Hutnik Dąbie",
  "Chemik Sarnów",
  "Energetyk Zawada",
  "Mechanik Głuchów",
  "Budowlani Krosno",
  "Metalowiec Żarki",
  "Ceramika Rzeczenica",
  "Tarpan Wólka",
  "Znicz Wierzbica",
  "Jutrzenka Księginice",
  "Pogoń Bielawy",
  "Orkan Trzebień",
  "Gryf Kruszyna",
  "Błękitni Wodzisław",
  "Sokół Wielowieś",
  "Orzeł Kobyla",
  "Naprzód Książki",
  "Piast Łubowo",
  "Stal Grodzisko",
  "Grom Żytno",
  "Iskra Pszczółki",
  "Victoria Lubomia",
  "Unia Sławno",
  "Sparta Biała",
  "Start Wyszków",
  "Olimpia Turośń",
  "Polonia Chmielnik",
  "Czarni Olszanka",
  "Płomień Gozdnica",
  "Zryw Rudnik",
  "Huragan Dębowiec",
  "Tęcza Liszki",
  "Leśnik Osiek",
  "Rolnik Miedzna",
  "Gwiazda Ruda",
  "Błękitni Targowisko",
  "Sokół Złotniki",
  "Orzeł Niegowa",
  "Naprzód Siedliska",
  "Piast Ruda",
  "Stal Łętownia",
  "Grom Czarna",
  "Iskra Koniusza",
  "Victoria Kaczory",
  "Unia Janikowo",
  "Sparta Łopuszno",
  "Start Dobroń",
  "Olimpia Szczytna",
  "Polonia Kłomnice",
  "Czarni Trzciana",
  "Pogoń Złoty Potok",
  "Hetman Byczyna",
  "Włókniarz Moszczenica",
  "Chemik Brójce",
  "Budowlani Przybyszówka",
  "Motor Zakrzówek",
  "GKS Zawisze",
  "LZS Zieloni Dąbrowice",
  "KS Iskra Nowiny",
  "GKS Błękitni Sadowo",
  "LKS Orzeł Kruszewo",
  "MKS Sokół Grabów",
  "KS Wicher Brzozówka",
  "LZS Czarni Łęki",
  "Grom Wólka Wielka",
  "Unia Stare Pole",
  "Płomień Dębiny",
  "Victoria Kamionka",
  "Start Rzeczyca",
  "Zryw Chmielów",
  "Piast Rudniki",
  "Huragan Kępa",
  "Sparta Borki",
  "Polonia Gajewo",
  "Tęcza Młynary",
  "Orkan Żarnów",
  "Błękitni Słupiec",
  "Znicz Długosiodło",
  "GKS Rolnik Strzelce",
  "LKS Wilga Ciechów",
  "Korona Stawiska",
  "Jutrzenka Lipowiec",
  "LZS Zorza Karszyn",
  "Włókniarz Cegłów",
  "Cukrownik Brzezice"
];
// 16 random clubs drawn from pool at game start
// Liga definitions
const DEV_MODE=true; // ustaw false w wersji produkcyjnej
function _leagueNamesMap(){
  return {1:t('league_1'),2:t('league_2'),3:t('league_3'),4:t('league_4'),5:t('league_5'),6:t('league_6'),7:t('league_7'),8:t('league_8')};
}
function _leagueNamesShortMap(){
  return {1:t('league_1_short'),2:t('league_2_short'),3:t('league_3_short'),4:t('league_4_short'),5:t('league_5_short'),6:t('league_6_short'),7:t('league_7_short'),8:t('league_8_short')};
}
const LEAGUE_NAMES=new Proxy({},{get(target,prop){return _leagueNamesMap()[prop];}});
const LEAGUE_OVR={
  1:[58,72,82,92],  // Premier Division: ogon 58-72, lider 82-92, spread=30+
  2:[45,58,70,82],  // I Liga: ogon 45-58, lider 70-82
  3:[38,52,62,74],  // II Liga: ogon 38-52, lider 62-74
  4:[32,45,55,67],  // III Liga: ogon 32-45, lider 55-67
  5:[27,40,50,62],  // IV Liga: ogon 27-40, lider 50-62
  6:[22,33,44,56],  // V Liga: ogon 22-33, lider 44-56
  7:[15,26,36,48],  // VI Liga: ogon 15-26, lider 36-48
  8:[8,20,28,42],   // VII Liga: ogon 8-20, lider 28-42
};
// Potencjał per liga: [maxPot, bonusMin, bonusMax]
// maxPot = sufit potencjału dla ligi; bonus = ile ponad OVR może sięgać
// UWAGA: ta stała/calcPotential() jest wspólna dla CAŁEGO świata — sezon 1 (mkLeaguePlayers,
// news-bootstrap.js), transferów (transfers.js) i juniorów AI (match-post.js). Poszerzenie
// bMin/bMax TU podnosi potencjał również już dojrzałej, wysoko postawionej populacji startowej
// (sezon 1), nie tylko młodych juniorów, którzy realnie potrzebują szerszego pasma do wzrostu —
// zmierzone w symulacji: podbija to równowagę świata o +4 do +9 pkt PONAD sezon 1 zamiast ją
// ustabilizować. Właściwe miejsce na szerszy bonus to WYŁĄCZNIE generator juniora AI
// (match-post.js, `junior.potential=...`), osobno od tej stałej — patrz komentarz tam.
const LEAGUE_POT={
  1:{max:99,bMin:5, bMax:20}, // Premier Division: gwiazdy blisko sufitu
  2:{max:90,bMin:8, bMax:25}, // I Liga: solidni zawodowcy
  3:{max:82,bMin:10,bMax:28}, // II Liga: półzawodowcy
  4:{max:74,bMin:8, bMax:22}, // III Liga: amatorzy wyższej klasy
  5:{max:66,bMin:6, bMax:18}, // IV Liga: regionalni gracze
  6:{max:58,bMin:5, bMax:15}, // V Liga: amatorzy
  7:{max:50,bMin:4, bMax:12}, // VI Liga: masówka
  8:{max:42,bMin:3, bMax:10}, // VII Liga: niski amator
};
function calcPotential(p,lgLevel){
  const lp=LEAGUE_POT[lgLevel]||LEAGUE_POT[8];
  const curOvr=ovr(p);
  const bonus=r(lp.bMin,lp.bMax);
  let pot=Math.min(lp.max,curOvr+bonus);
  // Korekta wiekowa: im starszy, tym mniej przestrzeni
  if(p.age>=32)pot=Math.min(pot,curOvr+2);
  else if(p.age>=28)pot=Math.min(pot,curOvr+5);
  return Math.max(curOvr+1,pot); // zawsze przynajmniej 1 ponad OVR
}
// Strojenie decyzji transferowych AI per liga (aiEvaluateSale/aiEvaluateSigning, match-post.js):
// churnMult skaluje limit podpisań na sezon (niższe ligi = więcej naturalnego ruchu składu),
// strictnessMult skaluje próg "czy kandydat jest realną poprawą" (wyższe ligi = ostrzejsza
// selekcja, mniejsze = odrobinę luźniejsza, ale nigdy zakup/sprzedaż bez powodu).
const LEAGUE_AI_TUNING={
  1:{churnMult:0.8,strictnessMult:1.3},
  2:{churnMult:0.9,strictnessMult:1.2},
  3:{churnMult:1.0,strictnessMult:1.1},
  4:{churnMult:1.0,strictnessMult:1.0},
  5:{churnMult:1.1,strictnessMult:0.95},
  6:{churnMult:1.2,strictnessMult:0.9},
  7:{churnMult:1.3,strictnessMult:0.85},
  8:{churnMult:1.4,strictnessMult:0.8},
};
// Limity liczby zawodników na pozycję w składzie klubu AI — egzekwowane przy sprzedaży
// (aiEvaluateSale: nie schodź poniżej min) i zakupie (aiEvaluateSigning/aiSignFromFA: nie
// przekraczaj max), żeby kluby nie gromadziły np. 8 bramkarzy i 0 napastników.
const POS_QUOTA={
  GK: {min:2, max:4},
  OBR:{min:6, max:10},
  POL:{min:6, max:10},
  NAP:{min:4, max:7},
};
// Jedno wspólne źródło prawdy dla rozmiaru składu — zastępuje rozrzucone po match-post.js
// literały (25/40/22-25 zależnie od miejsca). min = suma POS_QUOTA.min (nigdy nie łamana
// przez żadną ścieżkę odpływu AI — sprzedaż, wygasły kontrakt), target = preferowany rozmiar
// przy zwykłych zakupach, max = twardy sufit (AI i gracz, patrz doBuy()/signTalent()/
// kronTransferIn()). min egzekwowany też przy sprzedaży klubu gracza (POS_QUOTA per pozycja,
// patrz openSellModal() w tactics-playercard.js) — zastąpiło dawny system "kryzysu kadrowego".
const SQUAD_SIZE={min:18, target:24, max:30};
const LEAGUE_BUDGET={1:4000000,2:1600000,3:600000,4:240000,5:120000,6:60000,7:36000,8:24000};
const LEAGUE_SPONSORS={1:40000,2:16000,3:6000,4:3000,5:1600,6:1000,7:600,8:400};
const FIN={
  sponsors:{1:160000,2:60000,3:56000,4:16000,5:7000,6:3600,7:2000,8:1200},
  gadgets: {1:100000,2:40000,3:10000,4:3000,5:1400,6:600,7:300,8:120},   // gadCap start (dynamiczne)
  ads:     {1:90000,2:36000,3:12000,4:7000,5:2000,6:800,7:600,8:240},
  tv:      {1:120000,2:50000,3:16000,4:0,5:0,6:0,7:0,8:0},
  ticketPrice:{1:60,2:40,3:30,4:24,5:20,6:16,7:12,8:10},
  gadRate: {1:0.25,2:0.22,3:0.18,4:0.15,5:0.12,6:0.10,7:0.08,8:0.06},
  gadCap:  {1:100000,2:40000,3:10000,4:3000,5:1400,6:600,7:300,8:120},
  gadCapMax:{1:400000,2:240000,3:120000,4:50000,5:16000,6:5600,7:2200,8:600},
  stadMax: {1:100000,2:80000,3:60000,4:40000,5:24000,6:16000,7:10000,8:6000},
  salMin:{1:30000,2:10000,3:3500,4:1500,5:700,6:350,7:180,8:100},
  salMax:{1:150000,2:45000,3:13000,4:5000,5:2200,6:950,7:500,8:280},
  // Premia za zajęte miejsce: 16 pozycji (16 klubów/liga), krzywa front-loaded — 1./2./3. miejsce
  // to 100%/70%/50% mistrzostwa (podium wyraźnie oddzielone), a 4.–16. miejsce liniowo w dół
  // z 50% do 10% mistrzostwa. Mistrzostwo = LEAGUE_BUDGET ligi × 2,5 (Premier Division: 10 mln,
  // I Liga: 4 mln). Dawniej tylko miejsca 1.–4./5. płaciły cokolwiek (reszta zero) i rozjazd
  // Premier Division/VII Liga na 1. miejscu sięgał 4000× — teraz płaci każde miejsce, rozjazd
  // 1. miejsca to ~167× (10 000 000/60 000), zgodnie z rozjazdem budżetów startowych lig.
  bonus:{
    1:[10000000,7000000,5000000,4692500,4384500,4077000,3769000,3461500,3154000,2846000,2538500,2231000,1923000,1615500,1307500,1000000],
    2:[4000000,2800000,2000000,1877000,1754000,1631000,1507500,1384500,1261500,1138500,1015500,892500,769000,646000,523000,400000],
    3:[1500000,1050000,750000,704000,657500,611500,565500,519000,473000,427000,381000,334500,288500,242500,196000,150000],
    4:[600000,420000,300000,281500,263000,244500,226000,207500,189000,171000,152500,134000,115500,97000,78500,60000],
    5:[300000,210000,150000,141000,131500,122500,113000,104000,94500,85500,76000,67000,57500,48500,39000,30000],
    6:[150000,105000,75000,70500,66000,61000,56500,52000,47500,42500,38000,33500,29000,24000,19500,15000],
    7:[90000,63000,45000,42000,39500,36500,34000,31000,28500,25500,23000,20000,17500,14500,12000,9000],
    8:[60000,42000,30000,28000,26500,24500,22500,21000,19000,17000,15000,13500,11500,9500,8000,6000]
  }
};
// Reputacja bez górnego limitu — krzywa nasycająca zamiast liniowego mnożnika z twardym sufitem.
// Zbliża się asymptotycznie do (base+range), ale nigdy go nie osiąga: więcej reputacji zawsze
// daje trochę więcej, z malejącymi zyskami, bez ściany przy 1000. K dobrane tak, by wartości przy
// typowej wczesnej reputacji (~30-100) były zbliżone do starych, liniowych do 1000 formuł.
function repCurve(rep,base,range,K){
  const r=Math.max(0,rep||0);
  const kk=K||400;
  return base+range*r/(r+kk);
}
function calcWeeklyIncome(){
  if(!G)return{sponsors:0,gadgets:0,ads:0,tv:0,tickets:0,total:0};
  const lvl=G.myLeague||8;
  const _rep=G.reputation||30;
  const repMultSpon = repCurve(_rep, 0.7, 0.8);
  const repMultAds  = repCurve(_rep, 0.6, 1.4);
  const repMultContr= repCurve(_rep, 0.8, 1.0);
  const sponsors=Math.round((FIN.sponsors[lvl]||300)*repMultSpon);
  const ads=Math.round((FIN.ads[lvl]||80)*(G.stadium&&G.stadium.adsMult||1)*repMultAds);
  const tv=Math.round((FIN.tv[lvl]||0));
  const cap=(G.stadium&&G.stadium.capacity)||200;
  const tp=FIN.ticketPrice[lvl]||5;

  // Dynamiczna frekwencja
  const BASE_FREQ={1:0.62,2:0.55,3:0.48,4:0.42,5:0.37,6:0.32,7:0.28,8:0.25};
  const bf=BASE_FREQ[lvl]||0.30;
  // Wyniki ostatnie 5 meczów
  const last5=((G.results||[]).slice(-5));
  const pts5=last5.reduce((s,r)=>s+(r==='W'?3:r==='D'?1:0),0);
  const wynikMod=pts5<=3?0.70:pts5<=6?0.85:pts5<=9?1.00:pts5<=12?1.15:1.30;
  // Seria
  const ws=G.winStreak||0; const ls=G.loseStreak||0;
  const seriaMod=ws>=6?1.20:ws>=4?1.12:ws>=2?1.05:ls>=3?0.88:1.00;
  // Reputacja
  const repMod=repCurve(G.reputation||30, 0.90, 0.40);
  const freq=Math.max(0.10,Math.min(0.95,bf*wynikMod*seriaMod*repMod));
  G.frequency=Math.round(freq*100); // zapisz dla UI

  const gasB=(G.stadium&&G.stadium.gasBonus)||0;
  const ticketBoardBonus=(G.board&&G.board.ticketBonus)||0;
  const perMatch=Math.round(cap*freq*tp*(1+gasB+ticketBoardBonus));
  const tickets=Math.round(perMatch/2);

  // Gadżety: % biletów z capem (zależy od rozbudowy sklepu)
  const gadRate=FIN.gadRate[lvl]||0.08;
  const shopMult=(G.stadium&&G.stadium.shopMult)||1;
  const gadCapBase=FIN.gadCap[lvl]||60;
  const gadCapFull=FIN.gadCapMax[lvl]||300;
  const gadCap=Math.round(gadCapBase+(gadCapFull-gadCapBase)*Math.min(1,(shopMult-1)/3));
  const gadgets=Math.min(gadCap,Math.round(tickets*gadRate*shopMult));

  const vip=(G.stadium&&G.stadium.vipWeekly)||0;
  const contr=G.contracts||{};
  const contrTotal=Math.round(((contr.shirt?contr.shirt.weekly:0)+(contr.stadium?contr.stadium.weekly:0)+(contr.naming?contr.naming.weekly:0))*repMultContr)+(contr.tv?contr.tv.weekly:0);
  return{sponsors,gadgets,ads,tv,tickets,vip,contracts:contrTotal,total:sponsors+gadgets+ads+tv+tickets+vip+contrTotal};
}
// G.leagues = array of 8 liga objects: {level, name, clubs:[{id,n}], standing:[...], schedule:[...]}
let CLUBS_B=[];
let ALL_CLUBS=[];
function initLeagues(){
  // Shuffle CLUBS_POOL and assign 16 unique clubs per league
  // Używa getClubsPool() — zwraca EN lub PL zależnie od LANG
  const shuffled=[...getClubsPool()];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const leagues=[];
  let clubId=1;
  for(let lvl=1;lvl<=8;lvl++){
    const clubs=shuffled.slice((lvl-1)*16,lvl*16).map(n=>({id:clubId++,n}));
    leagues.push({level:lvl,name:LEAGUE_NAMES[lvl],clubs});
  }
  return leagues;
}
function getLeagueClubs(leagues,level){return (leagues.find(l=>l.level===level)||{clubs:[]}).clubs;}
function setCurrentLeague(leagues,level){
  CLUBS_B=[...getLeagueClubs(leagues,level)];
  ALL_CLUBS=[...CLUBS_B];
}
// Odnośnik do karty klubu/zawodnika wewnątrz dowolnego tekstu (news, Kronika, historia reputacji,
// oś czasu) — stopPropagation, bo wpis bywa sam w sobie klikalny (np. n.clubId w world-newsach,
// tl.pid na osi czasu) — bez tego klik w link wewnątrz tekstu odpalałby zamiast niego akcję całego
// wiersza.
function _clubLink(c){
  return '<span onclick="event.stopPropagation();openClubModal('+c.id+')" style="cursor:pointer;text-decoration:underline">'+c.n+'</span>';
}
function _playerLink(p){
  return '<span onclick="event.stopPropagation();showById('+p.id+')" style="cursor:pointer;text-decoration:underline">'+p.name+'</span>';
}
// Zamienia KAŻDE wystąpienie nazwy klubu i pełnego imienia+nazwiska zawodnika w tekście na klikalny
// link do jego karty (Etap B: każda wzmianka drużyny/zawodnika musi linkować do jej/jego karty).
// Wołane jedynie przy RENDERZE (news, Kronika, historia reputacji, oś czasu) — surowy tekst w
// G.news/outcome/timeline zostaje zawsze czystym stringiem, dzięki czemu notif() (jedyne miejsce
// renderujące przez textContent) nigdy nie dostaje HTML-a i nie wymaga osobnego "odlinkowania".
// Pomija teksty, które już mają linki (np. zapowiedź sezonu buduje je sama), żeby nie zagnieżdżać
// <span> w <span>. Sortowanie po długości nazwy — zabezpieczenie przed literalnym podciągiem.
function linkifyNames(msg){
  if(!msg||msg.indexOf('openClubModal(')!==-1||msg.indexOf('showById(')!==-1)return msg;
  const clubs=(ALL_CLUBS||[]).filter(c=>c&&c.n).slice().sort((a,b)=>b.n.length-a.n.length);
  clubs.forEach(c=>{
    if(msg.indexOf(c.n)===-1)return;
    msg=msg.split(c.n).join(_clubLink(c));
  });
  const players=[...(typeof G!=='undefined'&&G&&G.players||[]),...(typeof G!=='undefined'&&G&&G.retiredPlayers||[]),...(typeof G!=='undefined'&&G&&G.fa||[])]
    .filter(p=>p&&p.name).slice().sort((a,b)=>b.name.length-a.name.length);
  players.forEach(p=>{
    if(msg.indexOf(p.name)===-1)return;
    msg=msg.split(p.name).join(_playerLink(p));
  });
  return msg;
}
const FIRST=["Adam","Bartosz","Cezary","Dariusz","Filip","Grzegorz","Henryk","Jacek","Krzysztof","Leszek","Marek","Paweł","Rafał","Sławomir","Tomasz","Piotr","Michał","Andrzej","Robert","Mariusz","Łukasz","Mateusz","Kamil","Marcin","Sebastian","Wojciech","Damian","Radosław","Janusz","Artur","Hubert","Konrad","Łukasz","Maciej","Norbert","Oskar","Patryk","Ryszard","Stanisław","Tadeusz","Waldemar","Zbigniew","Aleksander","Bernard","Dawid","Edward","Feliks","Gerard","Igor","Jurek"];
const LAST=[
  "Kowalski",
  "Nowak",
  "Wiśniewski",
  "Wójcik",
  "Kowalczyk",
  "Kamiński",
  "Lewandowski",
  "Zieliński",
  "Szymański",
  "Woźniak",
  "Dąbrowski",
  "Kozłowski",
  "Jankowski",
  "Mazur",
  "Krawczyk",
  "Piotrowski",
  "Grabowski",
  "Pawłowski",
  "Michalski",
  "Zając",
  "Król",
  "Wieczorek",
  "Jabłoński",
  "Wróbel",
  "Nowicki",
  "Majewski",
  "Olszewski",
  "Stępień",
  "Jaworski",
  "Malinowski",
  "Adamczyk",
  "Dudek",
  "Walczak",
  "Sikora",
  "Baran",
  "Tomaszewski",
  "Rutkowski",
  "Szewczyk",
  "Pietrzak",
  "Marciniak",
  "Włodarczyk",
  "Kubiak",
  "Wilk",
  "Lis",
  "Czarnecki",
  "Sawicki",
  "Kaczmarek",
  "Borkowski",
  "Chmielewski",
  "Szczepański",
  "Urban",
  "Kurek",
  "Brzeziński",
  "Górski",
  "Jasiński",
  "Kalinowski",
  "Maciejewski",
  "Sadowski",
  "Musiał",
  "Kania",
  "Błaszczyk",
  "Cieślak",
  "Gajda",
  "Ptak",
  "Bednarek",
  "Bąk",
  "Rogowski",
  "Olejnik",
  "Chojnacki",
  "Kosiński",
  "Sobczak",
  "Zawadzki",
  "Kucharski",
  "Tomczak",
  "Wrona",
  "Duda",
  "Kaźmierczak",
  "Krupa",
  "Kaczor",
  "Matusiak",
  "Wesołowski",
  "Sowa",
  "Kołodziej",
  "Górecki",
  "Borowski",
  "Witek",
  "Piekarski",
  "Kędziora",
  "Koper",
  "Bieliński",
  "Biernacki",
  "Mikołajczyk",
  "Polak",
  "Banasik",
  "Kalisz",
  "Kwiatkowski",
  "Kula",
  "Milewski",
  "Rybak",
  "Romanowski",
  "Czapla",
  "Dudziak",
  "Mrozek",
  "Żurek",
  "Kurecki",
  "Turek",
  "Kaczanowski",
  "Domański",
  "Cichy",
  "Kłos",
  "Piwowarczyk",
  "Orłowski",
  "Kaczmarczyk",
  "Makowski",
  "Rosiński",
  "Świątek",
  "Słowik",
  "Głowacki",
  "Ratajczak",
  "Janik",
  "Pająk",
  "Filipiak",
  "Kędzierski",
  "Jurek",
  "Cegielski",
  "Wysocki",
  "Rybicki",
  "Drozd",
  "Dybowski",
  "Chrzanowski",
  "Kurekowski",
  "Płatek",
  "Sarnowski",
  "Żak",
  "Czubak",
  "Antczak",
  "Kubicki",
  "Białek",
  "Nizioł",
  "Frankowski",
  "Kłosowski",
  "Kordas",
  "Tymiński",
  "Białas",
  "Cichocki",
  "Cholewa",
  "Osiński",
  "Żurawski",
  "Piwko",
  "Chrobak",
  "Jarosz",
  "Kędra",
  "Twardowski",
  "Kaniacki",
  "Mielczarek",
  "Gacek",
  "Bednarz",
  "Kordowski",
  "Warchoł",
  "Banach",
  "Przybylski",
  "Kaczka",
  "Szpak",
  "Koral",
  "Książek",
  "Rusek",
  "Burek",
  "Mróz",
  "Stasiak",
  "Klimczak",
  "Fijałkowski",
  "Chaberski",
  "Urbaniak",
  "Sroka",
  "Mielnik",
  "Płonka",
  "Wnuk",
  "Wierzbicki",
  "Kocur",
  "Góral",
  "Pudełko",
  "Pustułka",
  "Pater",
  "Jagiełło",
  "Wawrzyniak",
  "Piskorz",
  "Kaczorek",
  "Tokarski",
  "Chojnowski",
  "Tylka",
  "Bilski",
  "Niewiadomski",
  "Kędziorek",
  "Socha",
  "Paterak",
  "Rojek",
  "Błachut",
  "Wicher",
  "Dębski",
  "Kustra",
  "Miler",
  "Czajka",
  "Talar",
  "Kopernik",
  "Rydz",
  "Bury",
  "Bryła",
  "Szulc",
  "Rakowski",
  "Pawlak",
  "Łuczak",
  "Puchalski",
  "Kogut",
  "Jarzębski",
  "Okrasa",
  "Kotas",
  "Kapała",
  "Noga",
  "Kwiecień",
  "Pękala",
  "Żmuda",
  "Stolarz",
  "Kocjan",
  "Koniarz",
  "Bolek",
  "Warda",
  "Bączek",
  "Pajączek",
  "Mroczek",
  "Śledź",
  "Piszczek",
  "Chudzik",
  "Kuc",
  "Kijowski",
  "Kędzior",
  "Kozak",
  "Turecki",
  "Szeliga",
  "Pakuła",
  "Wypych",
  "Chmura",
  "Szymczak",
  "Mądry",
  "Dobrowolski",
  "Prus",
  "Młynarczyk",
  "Bielecki",
  "Dziuba",
  "Olech",
  "Pałka",
  "Koterba",
  "Piwowar",
  "Czaplicki",
  "Dyl",
  "Radecki",
  "Chyła",
  "Chudy",
  "Stachura",
  "Chruściel",
  "Biskup",
  "Szeląg",
  "Wilczek",
  "Dziadek",
  "Kozioł",
  "Tracz",
  "Kopeć",
  "Wdowiak",
  "Foryś",
  "Chmiel",
  "Drobniak",
  "Rzepecki",
  "Kubala",
  "Włosek",
  "Dudzik",
  "Łabędzki",
  "Pustuła",
  "Dworak",
  "Wroński",
  "Zielonka",
  "Zięba",
  "Rosiak",
  "Chruścik",
  "Szot",
  "Łysy",
  "Sobota",
  "Kulej",
  "Kurowski",
  "Dymek",
  "Stawicki",
  "Mirek",
  "Gondek",
  "Madera",
  "Kuczera",
  "Grzelak",
  "Płaczek",
  "Chaber",
  "Rydel",
  "Mroziński",
  "Zych",
  "Długosz",
  "Wójtowicz",
  "Gromek",
  "Czuba",
  "Ficek",
  "Ryś",
  "Głaz",
  "Pawlica",
  "Błaszczak",
  "Gawron",
  "Mikołajek",
  "Szarek",
  "Tabor",
  "Piórek",
  "Cebula",
  "Migdał",
  "Głowa",
  "Rusecki",
  "Krawiec",
  "Drabik",
  "Malarz",
  "Pióro",
  "Łukasik",
  "Banaszek",
  "Flis",
  "Matuszewski",
  "Rataj",
  "Łoś",
  "Kukuła",
  "Kruczek",
  "Furtak",
  "Kocot",
  "Młotek",
  "Sęk",
  "Bryk",
  "Toporek",
  "Wyrwa"
];
// Pre-generate 400 unique full names pool
function buildNamePool(){
  // Build pool by combining ALL first names with ALL last names randomly
  const pool=[];
  const used=new Set();
  // Create all combinations and shuffle
  const allCombos=[];
  for(const f of FIRST){
    for(const l of LAST){
      allCombos.push(f+' '+l);
    }
  }
  // Fisher-Yates shuffle for maximum randomness
  for(let i=allCombos.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [allCombos[i],allCombos[j]]=[allCombos[j],allCombos[i]];
  }
  for(const name of allCombos){
    if(!used.has(name)){used.add(name);pool.push(name);}
    if(pool.length>=2000)break;
  }
  return pool;
}
function getUniqueName(){
  if(namePoolIdx>=NAME_POOL.length){NAME_POOL=buildNamePoolI18n();namePoolIdx=0;}
  return NAME_POOL[namePoolIdx++];
}

const POS_GROUPS=[{key:'GK',label:'BRAMKARZE',short:'GK'},{key:'OBR',label:'OBROŃCY',short:'CB'},{key:'POL',label:'POMOCNICY',short:'MID'},{key:'NAP',label:'NAPASTNICY',short:'ST'}];
const POS_SHORT={GK:'GK',OBR:'CB',POL:'MID',NAP:'ST'};
const ARCHETYPE_META={
  wojownik:{icon:'⚔️',name:'Wojownik',color:'#ef5350',desc:'Rośnie w siłę i twardość.',mult:{phy:1.4,def:1.4,tec:1.0,pas:1.0,sht:1.0,men:1.0}},
  techniczny:{icon:'🎯',name:'Techniczny',color:'#2196f3',desc:'Buduje grę przez podania.',mult:{tec:1.4,pas:1.4,phy:1.0,def:1.0,sht:1.0,men:1.0}},
  snajper:{icon:'🔫',name:'Snajper',color:'#ffc107',desc:'Instynkt strzelecki, dla NAP.',mult:{sht:1.6,tec:1.1,pas:1.0,def:1.0,phy:1.0,men:1.0}},
  lider:{icon:'👑',name:'Lider',color:'#9c27b0',desc:'Prowadzi innych w trudnych chwilach.',mult:{men:1.5,tec:1.0,pas:1.0,sht:1.0,def:1.0,phy:1.0}},
};

// ── LEGENDY ─────────────────────────────────────────────
// Przeniesione z data-center.js — musi być wczytane przed news-bootstrap.js (zapis gry) i
// match-post.js (przycinanie G.retiredPlayers co sezon), żeby protectedRetireeIds() niżej
// mogła z nich korzystać. data-center.js nadal używa LEG_THRESHOLD/legScore/legTrophies
// (są w globalnym zasięgu, ten sam wzorzec co reszta projektu — brak modułów/importów).
const LEG_THRESHOLD=200;
const LEG_W=0.25,LEG_G=0.5,LEG_A=0.3,LEG_M=12,LEG_P=8;
// Próg "weterana" — Historia klubu→Zawodnicy, sekcja "Zawodnicy, którzy odeszli" (traits-history.js).
// 100 meczów w barwach klubu bez goli/asyst/tytułów daje tylko 25/200 pkt legScore, więc bez
// osobnej ochrony taki zawodnik mógłby wypaść z limitu G.retiredPlayers mimo spełniania progu tej
// listy — patrz protectedRetireeIds() niżej.
const VETERAN_MATCHES_THRESHOLD=100;

function legScore(stat,trophyCount,cupCount){
  const pts=
    Math.min(stat.matches*LEG_W, 75)+
    Math.min(stat.goals*LEG_G,   50)+
    Math.min(stat.assists*LEG_A, 30)+
    trophyCount*LEG_M+
    cupCount*LEG_P;
  return Math.round(pts*10)/10;
}

function legTrophies(playerId){
  // Mistrzostwa: sprawdź czy zawodnik był w klubie gracza w danym sezonie
  const h=G.cHist||[];
  const allPool=[...(G.players||[]),...(G.retiredPlayers||[]),...(G.fa||[])];
  const p=allPool.find(x=>x.id===playerId);
  if(!p)return{leagues:0,cups:0};
  const leagues=(G.trophies||[]).filter(t=>t.type==='league'&&
    p.history&&p.history.some(ph=>ph.season===t.season&&ph.clubId===G.myClubId)).length;
  const cups=(G.trophies||[]).filter(t=>t.type==='cup'&&t.place===1&&
    p.history&&p.history.some(ph=>ph.season===t.season&&ph.clubId===G.myClubId)).length;
  return{leagues,cups};
}

// Zbiór id zawodników, którzy NIE MOGĄ zniknąć z G.retiredPlayers przez limit "najnowsi N"
// (match-post.js aiRenewContracts, news-bootstrap.js zapis gry) — legendy klubu (wg tego
// samego progu co lista w data-center.js), rekordziści (top 5 strzelców/asystentów/
// liczby meczów, najdroższy sprzedany/kupiony, ta sama pula co renderHistZawodnicy w
// traits-history.js) oraz weterani (VETERAN_MATCHES_THRESHOLD+ meczów — sekcja "Zawodnicy,
// którzy odeszli" w tym samym pliku). G.allTimeStats.players nigdy nie jest przycinane, więc
// bez tej ochrony wpis rekordu/weterana przeżywa, a karta zawodnika (i link do niej) — nie.
function protectedRetireeIds(){
  const ids=new Set();
  const at=G.allTimeStats&&G.allTimeStats.players?G.allTimeStats.players:{};
  const stats=Object.values(at);
  if(!stats.length)return ids;
  stats.forEach(stat=>{
    if(stat.id==null)return;
    const{leagues,cups}=legTrophies(stat.id);
    if(legScore(stat,leagues,cups)>=LEG_THRESHOLD)ids.add(stat.id);
  });
  ['goals','assists','matches'].forEach(key=>{
    stats.filter(s=>s[key]>0).sort((a,b)=>b[key]-a[key]).slice(0,5)
      .forEach(s=>{if(s.id!=null)ids.add(s.id);});
  });
  stats.filter(s=>(s.matches||0)>=VETERAN_MATCHES_THRESHOLD)
    .forEach(s=>{if(s.id!=null)ids.add(s.id);});
  if(G.allTimeStats){
    if(G.allTimeStats.bestSeller&&G.allTimeStats.bestSeller.id!=null)ids.add(G.allTimeStats.bestSeller.id);
    if(G.allTimeStats.bestBuyer&&G.allTimeStats.bestBuyer.id!=null)ids.add(G.allTimeStats.bestBuyer.id);
  }
  return ids;
}
