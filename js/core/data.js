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
const LEAGUE_BUDGET={1:2000000,2:800000,3:300000,4:120000,5:60000,6:30000,7:18000,8:12000};
const LEAGUE_SPONSORS={1:20000,2:8000,3:3000,4:1500,5:800,6:500,7:300,8:200};
const FIN={
  sponsors:{1:80000,2:30000,3:28000,4:8000,5:3500,6:1800,7:1000,8:600},
  gadgets: {1:50000,2:20000,3:5000,4:1500,5:700,6:300,7:150,8:60},   // gadCap start (dynamiczne)
  ads:     {1:45000,2:18000,3:6000,4:3500,5:1000,6:400,7:300,8:120},
  tv:      {1:60000,2:25000,3:8000,4:0,5:0,6:0,7:0,8:0},
  ticketPrice:{1:30,2:20,3:15,4:12,5:10,6:8,7:6,8:5},
  gadRate: {1:0.25,2:0.22,3:0.18,4:0.15,5:0.12,6:0.10,7:0.08,8:0.06},
  gadCap:  {1:50000,2:20000,3:5000,4:1500,5:700,6:300,7:150,8:60},
  gadCapMax:{1:200000,2:120000,3:60000,4:25000,5:8000,6:2800,7:1100,8:300},
  stadMax: {1:50000,2:40000,3:30000,4:20000,5:12000,6:8000,7:5000,8:3000},
  salMin:{1:30000,2:10000,3:3500,4:1500,5:700,6:350,7:180,8:100},
  salMax:{1:150000,2:45000,3:13000,4:5000,5:2200,6:950,7:500,8:280},
  bonus:{
    1:[12000000,5000000,1500000,500000,0,0,0,0,0,0,0,0,0,0,0,0],
    2:[2000000,800000,200000,50000,10000,0,0,0,0,0,0,0,0,0,0,0],
    3:[500000,200000,50000,10000,0,0,0,0,0,0,0,0,0,0,0,0],
    4:[120000,50000,15000,5000,1000,0,0,0,0,0,0,0,0,0,0,0],
    5:[40000,15000,5000,1000,0,0,0,0,0,0,0,0,0,0,0,0],
    6:[15000,6000,2000,500,0,0,0,0,0,0,0,0,0,0,0,0],
    7:[6000,2500,800,200,0,0,0,0,0,0,0,0,0,0,0,0],
    8:[3000,1200,400,100,0,0,0,0,0,0,0,0,0,0,0,0]
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
