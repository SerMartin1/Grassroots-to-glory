// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_crisis (Sesja 8, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec z Sesji 1: builder-
// funkcja zwracająca świeżą tablicę co tydzień). Żadnych domknięć nad
// my/starters/bestP/kron z zakresu kronTrigger() — wyłącznie globalne
// myPl()/ovr()/G, G.kronika.flags zamiast lokalnego kron.flags. Prefiks id:
// cr (nowy, jednoznaczny — dzisiejsze k04/x02/x04/tr01 mają prefiks dzielony
// z innymi kategoriami, patrz PLAN pkt 4.3, zakres cr01-cr08). Wyższa
// stawka niż flavor z poprzednich sesji (to prawdziwy kryzys, nie codzienna
// anegdota) — koszty/skutki bliższe skali istniejących k04/x02/s07. Ton:
// humor w stylu Hattricka, mimo poważniejszych konsekwencji. cr09/cr10
// (Sesja 12) to przykładowy ŁAŃCUCH MIĘDZYSEZONOWY nr 3 — odmiana wzorca
// ac18/ac19/t20/t21 BEZ śledzenia konkretnego zawodnika: stan to abstrakcyjny
// "zakład" (poziom ligi w momencie przepowiedni), rozstrzygany przez
// porównanie z bieżącym stanem gry — bez ryzyka "zawodnik nie istnieje",
// bo nic nie trzeba wyszukiwać w zamkniętym świecie.
// ══════════════════════════════════════════════════════════════════════════
function buildKronCrisisEvents(){

  function crSuspendedCount(){
    return myPl().filter(function(p){return (p.suspension||0)>0;}).length;
  }
  function crInjuredCount(){
    return myPl().filter(function(p){return p.injured;}).length;
  }
  function crLowFormStartersCount(){
    return myPl().filter(function(p){return p.starter&&(p.form||80)<50;}).length;
  }
  function crLastCupLoss(){
    var cupMatches=(G.mHist||[]).filter(function(m){return m._isCup;});
    if(!cupMatches.length)return null;
    var last=cupMatches[cupMatches.length-1];
    if(!(last.hn===G.myClub.n||last.an===G.myClub.n))return null;
    var isH=last.hn===G.myClub.n;
    var lost=isH?last.hg<last.ag:last.ag<last.hg;
    if(!lost)return null;
    var oppName=isH?last.an:last.hn;
    var oppClub=ALL_CLUBS.find(function(c){return c.n===oppName;});
    if(!oppClub||!G.leagues)return null;
    var oppLg=G.leagues.find(function(l){return l.clubs.some(function(c){return c.id===oppClub.id;});});
    if(!oppLg)return null;
    var myLg=G.myLeague||8;
    if(oppLg.level-myLg<2)return null;
    return {oppName:oppName};
  }

  return [

    // CR-01: Kryzys budżetowy
    {id:'cr01_budget_crisis', category:t('kron_cat_crisis'),
     weight:function(){return (G.budget||0)<=2000?30:0;},
     title:t('kron_cr01_title'),
     body:function(){return t('kron_cr01_body');},
     choices:[
       {label:t('kron_cr01_c1_label'),
        effect:function(){
          G.budget+=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:8000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_cr01_budget_crisis')});
          G.reputation=Math.max(0,(G.reputation||30)-8);
        },
        outcome:function(){return t('kron_cr01_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr01_c2_label'),
        effect:function(){
          if(Math.random()<0.5){
            G.budget+=10000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:10000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_cr01_budget_crisis_b')});
            G.kronika.flags._cr01result='win';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-10);
            G.kronika.flags._cr01result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._cr01result==='win')return t('kron_cr01_c2_outcome_win');
          return t('kron_cr01_c2_outcome_lose').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cr01_c3_label'),
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-3);
          myPl().forEach(function(p){p.form=Math.max(40,(p.form||80)-3);});
        },
        outcome:function(){return t('kron_cr01_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // CR-02: Kryzys dyscyplinarny (kilku zawodników zawieszonych naraz)
    {id:'cr02_discipline_crisis', category:t('kron_cat_crisis'),
     weight:function(){return crSuspendedCount()>=3?26:0;},
     title:t('kron_cr02_title'),
     body:function(){return t('kron_cr02_body').replace('{n}',crSuspendedCount());},
     choices:[
       {label:t('kron_cr02_c1_label'),
        effect:function(){
          if(G.budget<8000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cr02result='noBudget';return;}
          G.budget-=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:8000,bal:G.budget,season:G.season,note:t('kron_note_cr02_discipline_crisis')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._cr02result==='noBudget')return t('kron_cr02_c1_outcome_nobudget');
          return t('kron_cr02_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cr02_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-5);},
        outcome:function(){return t('kron_cr02_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr02_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});G.kronika.flags._cr02result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(40,(p.form||80)-5);});G.kronika.flags._cr02result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cr02result==='win')return t('kron_cr02_c3_outcome_win');
          return t('kron_cr02_c3_outcome_lose');
        }},
     ]},

    // CR-03: Kryzys kontuzji (kilku zawodników jednocześnie kontuzjowanych)
    {id:'cr03_injury_crisis', category:t('kron_cat_crisis'),
     weight:function(){return crInjuredCount()>=4?26:0;},
     title:t('kron_cr03_title'),
     body:function(){return t('kron_cr03_body').replace('{n}',crInjuredCount());},
     choices:[
       {label:t('kron_cr03_c1_label'),
        effect:function(){
          if(G.budget<10000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cr03result='noBudget';return;}
          G.budget-=10000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:10000,bal:G.budget,season:G.season,note:t('kron_note_cr03_injury_crisis')});
          myPl().filter(function(p){return !p.injured;}).forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});
        },
        outcome:function(){
          if(G.kronika.flags._cr03result==='noBudget')return t('kron_cr03_c1_outcome_nobudget');
          return t('kron_cr03_c1_outcome');
        }},
       {label:t('kron_cr03_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_cr03_c2_outcome');}},
       {label:t('kron_cr03_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._cr03result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-8);G.kronika.flags._cr03result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cr03result==='win')return t('kron_cr03_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cr03_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CR-04: Ultimatum zarządu (patrz systems/board-goals.js: G.board.streakFailed)
    {id:'cr04_board_ultimatum', category:t('kron_cat_crisis'),
     weight:function(){return ((G.board&&G.board.streakFailed||0)>=3)?32:0;},
     title:t('kron_cr04_title'),
     body:function(){return t('kron_cr04_body').replace('{n}',(G.board&&G.board.streakFailed)||0);},
     choices:[
       {label:t('kron_cr04_c1_label'),
        effect:function(){
          if(G.budget<15000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cr04result='noBudget';return;}
          G.budget-=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:15000,bal:G.budget,season:G.season,note:t('kron_note_cr04_board_ultimatum')});
          G.reputation=(G.reputation||30)+10;
        },
        outcome:function(){
          if(G.kronika.flags._cr04result==='noBudget')return t('kron_cr04_c1_outcome_nobudget');
          return t('kron_cr04_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cr04_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-12);},
        outcome:function(){return t('kron_cr04_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr04_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+8;G.kronika.flags._cr04result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-15);G.kronika.flags._cr04result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cr04result==='win')return t('kron_cr04_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cr04_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CR-05: Medialna nagonka (bardzo niska reputacja)
    {id:'cr05_media_pile_on', category:t('kron_cat_crisis'),
     weight:function(){return (G.reputation||30)<=20?26:0;},
     title:t('kron_cr05_title'),
     body:function(){return t('kron_cr05_body');},
     choices:[
       {label:t('kron_cr05_c1_label'),
        effect:function(){
          if(G.budget<6000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cr05result='noBudget';return;}
          G.budget-=6000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:6000,bal:G.budget,season:G.season,note:t('kron_note_cr05_media_pile_on')});
          G.reputation=(G.reputation||30)+8;
        },
        outcome:function(){
          if(G.kronika.flags._cr05result==='noBudget')return t('kron_cr05_c1_outcome_nobudget');
          return t('kron_cr05_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cr05_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-3);},
        outcome:function(){return t('kron_cr05_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr05_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+10;G.kronika.flags._cr05result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-10);G.kronika.flags._cr05result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cr05result==='win')return t('kron_cr05_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cr05_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CR-06: Załamanie morale w szatni
    {id:'cr06_squad_morale_collapse', category:t('kron_cat_crisis'),
     weight:function(){return crLowFormStartersCount()>=6?28:0;},
     title:t('kron_cr06_title'),
     body:function(){return t('kron_cr06_body').replace('{n}',crLowFormStartersCount());},
     choices:[
       {label:t('kron_cr06_c1_label'),
        effect:function(){
          if(G.budget<10000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cr06result='noBudget';return;}
          G.budget-=10000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:10000,bal:G.budget,season:G.season,note:t('kron_note_cr06_squad_morale_collapse')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+10);});
        },
        outcome:function(){
          if(G.kronika.flags._cr06result==='noBudget')return t('kron_cr06_c1_outcome_nobudget');
          return t('kron_cr06_c1_outcome');
        }},
       {label:t('kron_cr06_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_cr06_c2_outcome');}},
       {label:t('kron_cr06_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});G.kronika.flags._cr06result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(30,(p.form||80)-5);});G.kronika.flags._cr06result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cr06result==='win')return t('kron_cr06_c3_outcome_win');
          return t('kron_cr06_c3_outcome_lose');
        }},
     ]},

    // CR-07: Kompromitujące odpadnięcie z pucharu
    {id:'cr07_cup_humiliation_exit', category:t('kron_cat_crisis'),
     weight:function(){return crLastCupLoss()?24:0;},
     title:t('kron_cr07_title'),
     body:function(){
       var e=crLastCupLoss();
       return t('kron_cr07_body').replace('{opp}',e?e.oppName:t('kron_fallback_rival'));
     },
     choices:[
       {label:t('kron_cr07_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_cr07_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr07_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-6);},
        outcome:function(){return t('kron_cr07_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr07_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._cr07result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-8);G.kronika.flags._cr07result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cr07result==='win')return t('kron_cr07_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cr07_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CR-08: Groźba wycofania się sponsora
    {id:'cr08_sponsor_withdrawal_threat', category:t('kron_cat_crisis'),
     weight:function(){return ((G.reputation||30)<=40&&G.fin&&G.fin.sponsors>0)?24:0;},
     title:t('kron_cr08_title'),
     body:function(){return t('kron_cr08_body');},
     choices:[
       {label:t('kron_cr08_c1_label'),
        effect:function(){
          if(G.budget<8000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cr08result='noBudget';return;}
          G.budget-=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:8000,bal:G.budget,season:G.season,note:t('kron_note_cr08_sponsor_withdrawal_threat')});
          G.reputation=(G.reputation||30)+6;
        },
        outcome:function(){
          if(G.kronika.flags._cr08result==='noBudget')return t('kron_cr08_c1_outcome_nobudget');
          return t('kron_cr08_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cr08_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-8);},
        outcome:function(){return t('kron_cr08_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr08_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+8;G.kronika.flags._cr08result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-10);G.kronika.flags._cr08result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cr08result==='win')return t('kron_cr08_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cr08_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CR-09: Rywal przepowiada Wasz kryzys (ŁAŃCUCH — start, patrz cr10)
    {id:'cr09_rival_prediction', category:t('kron_cat_crisis'),
     weight:function(){
       if(G.flags&&G.flags.rivalPrediction)return 0;
       return G.rival?20:0;
     },
     title:t('kron_cr09_title'),
     body:function(){return t('kron_cr09_body').replace('{rival}',G.rival?G.rival.n:t('kron_fallback_rival'));},
     choices:[
       {label:t('kron_cr09_c1_label'),
        effect:function(){
          G.flags=G.flags||{};
          G.flags.rivalPrediction={season:G.season,leagueAtPrediction:G.myLeague||8,rivalName:G.rival?G.rival.n:t('kron_fallback_rival'),reaction:'ignored'};
        },
        outcome:function(){return t('kron_cr09_c1_outcome');}},
       {label:t('kron_cr09_c2_label'),
        effect:function(){
          G.flags=G.flags||{};
          G.flags.rivalPrediction={season:G.season,leagueAtPrediction:G.myLeague||8,rivalName:G.rival?G.rival.n:t('kron_fallback_rival'),reaction:'defiant'};
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){return t('kron_cr09_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr09_c3_label'),
        effect:function(){
          G.flags=G.flags||{};
          G.flags.rivalPrediction={season:G.season,leagueAtPrediction:G.myLeague||8,rivalName:G.rival?G.rival.n:t('kron_fallback_rival'),reaction:'motivated'};
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
        },
        outcome:function(){return t('kron_cr09_c3_outcome');}},
     ]},

    // CR-10: Czy przepowiednia rywala się sprawdziła? (ŁAŃCUCH — zakończenie cr09)
    {id:'cr10_rival_prediction_resolution', category:t('kron_cat_crisis'),
     weight:function(){
       if(!G.flags||!G.flags.rivalPrediction)return 0;
       return (G.season-G.flags.rivalPrediction.season)>=1?26:0;
     },
     title:t('kron_cr10_title'),
     body:function(){
       var w=G.flags.rivalPrediction;
       var seasonsAgo=G.season-w.season;
       var nowLvl=G.myLeague||8;
       var status;
       if(nowLvl>w.leagueAtPrediction)status='right';
       else if(nowLvl<w.leagueAtPrediction)status='wrong';
       else status='neutral';
       G.kronika.flags._cr10status=status;
       if(status==='wrong')return t('kron_cr10_body_wrong').replace('{rival}',w.rivalName).replace('{n}',seasonsAgo);
       if(status==='right')return t('kron_cr10_body_right').replace('{rival}',w.rivalName).replace('{n}',seasonsAgo);
       return t('kron_cr10_body_neutral').replace('{rival}',w.rivalName).replace('{n}',seasonsAgo);
     },
     choices:[
       {label:t('kron_cr10_c1_label'),
        effect:function(){G.flags.rivalPrediction=null;G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_cr10_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cr10_c2_label'),
        effect:function(){G.flags.rivalPrediction=null;},
        outcome:function(){return t('kron_cr10_c2_outcome');}},
       {label:t('kron_cr10_c3_label'),
        effect:function(){
          G.flags.rivalPrediction=null;
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._cr10result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cr10result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cr10result==='win')return t('kron_cr10_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cr10_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
