// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_history (Sesja 1, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B: bez zmiany silnika,
// żadnych domknięć nad my/starters/bestP/kron z zakresu kronTrigger() —
// każdy event tu poniżej odwołuje się wyłącznie do globalnych helperów
// (myPl(), ovr(), G, t(), G.kronika.flags zamiast lokalnego kron.flags).
// Prefiks id: hs (nowy, jednoznaczny — patrz PLAN pkt 4.3). Ton: humor w
// stylu Hattricka — sucha, biurokratyczno-lokalna ironia, bez slapsticku.
// ══════════════════════════════════════════════════════════════════════════
// ── Pomocnicze wyszukiwania w trwałych danych (G.cHist/G.fin.transfers/G.flags) —
// wyniesione na poziom pliku (były lokalne w buildKronHistoryEvents()), żeby mogły
// być reużyte poza Kroniką — patrz engine/milestones.js (zapowiedzi nadchodzących
// rocznic). Liczone na nowo przy każdym wywołaniu, tak jak reszta silnika.
function hsFirstPromotionSeason(){
  var ch=G.cHist||[];
  for(var i=1;i<ch.length;i++){
    if(ch[i].leagueLevel<ch[i-1].leagueLevel)return ch[i].season;
  }
  return null;
}
function hsWorstSeasonEntry(){
  var ch=(G.cHist||[]).filter(function(c){return c.pos&&c.pos!=='?';});
  if(!ch.length)return null;
  return ch.reduce(function(worst,c){return c.pos>worst.pos?c:worst;},ch[0]);
}
function hsRecordSigning(){
  var txns=(G.fin&&G.fin.transfers||[]).filter(function(x){return x.type==='buy'&&x.val>0;});
  if(!txns.length)return null;
  return txns.reduce(function(best,x){return x.val>best.val?x:best;},txns[0]);
}
function hsHallOfFameAnniversary(){
  var hof=(G.flags&&G.flags.hallOfFame)||[];
  return hof.find(function(hf){return (G.season-hf.season)===5;})||null;
}
function hsSeasonRoundsLeft(){
  if(!G.standing||!G.standing.length)return 99;
  var totalRounds=(G.standing.length-1)*2;
  var played=G.standing[0]?(G.standing[0].p||0):0;
  return totalRounds-played;
}

function buildKronHistoryEvents(){

  return [

    // ── ROCZNICE (próg: 5 sezonów, PLAN pkt 3b) ───────────────────────

    // HS-01: 5 lat od pierwszego tytułu
    {id:'hs01_first_title_anniversary', category:t('kron_cat_history'),
     weight:function(){
       if(!G.flags||!G.flags.firstTitleSeason)return 0;
       return (G.season-G.flags.firstTitleSeason===5)?35:0;
     },
     title:t('kron_hs01_title'),
     body:function(){
       var trp=(G.trophies||[]).find(function(x){return x.type==='league'&&x.season===G.flags.firstTitleSeason;});
       return t('kron_hs01_body').replace('{league}',trp?trp.leagueName:t('kron_hs01_fallback_league')).replace('{n}',5);
     },
     choices:[
       {label:t('kron_hs01_c1_label'),
        effect:function(){
          if(G.budget<6000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs01result='noBudget';return;}
          G.budget-=6000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:6000,bal:G.budget,season:G.season,note:t('kron_note_hs01_first_title_anniversary')});
          G.reputation=(G.reputation||30)+10;
          addNews(t('kron_hs01_c1_news'),'ok');
          G.kronika.flags._hs01result='corrected';
        },
        outcome:function(){
          if(G.kronika.flags._hs01result==='noBudget')return t('kron_hs01_c1_outcome_nobudget');
          return t('kron_hs01_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs01_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_hs01_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs01_c3_label'),
        effect:function(){
          if(Math.random()<0.60){
            G.reputation=(G.reputation||30)+12;
            addNews(t('kron_hs01_c3_news_win'),'ok');
            G.kronika.flags._hs01result='viral';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-4);
            addNews(t('kron_hs01_c3_news_lose'),'err');
            G.kronika.flags._hs01result='flop';
          }
        },
        outcome:function(){
          if(G.kronika.flags._hs01result==='viral')return t('kron_hs01_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hs01_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-02: 5 lat od wpisu do Alei Sław
    {id:'hs02_hall_of_fame_anniversary', category:t('kron_cat_history'),
     weight:function(){return hsHallOfFameAnniversary()?25:0;},
     title:t('kron_hs02_title'),
     body:function(){
       var hf=hsHallOfFameAnniversary();
       return t('kron_hs02_body').replace('{name}',hf?hf.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_hs02_c1_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs02result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_hs02_hall_of_fame_anniversary')});
          G.reputation=(G.reputation||30)+8;
          addNews(t('kron_hs02_c1_news'),'ok');
        },
        outcome:function(){
          if(G.budget<0)return t('kron_hs02_c1_outcome_nobudget');
          return t('kron_hs02_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs02_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hs02_c2_outcome');}},
       {label:t('kron_hs02_c3_label'),
        effect:function(){
          if(G.budget<10000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs02result='noBudget2';return;}
          G.budget-=10000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:10000,bal:G.budget,season:G.season,note:t('kron_note_hs02_hall_of_fame_anniversary_b')});
          G.reputation=(G.reputation||30)+15;
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});
          addNews(t('kron_hs02_c3_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs02result==='noBudget2')return t('kron_hs02_c3_outcome_nobudget');
          return t('kron_hs02_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-03: 5 lat od modernizacji treningu — sprzęt już nie taki nowy
    {id:'hs03_training_upgrade_anniversary', category:t('kron_cat_history'),
     weight:function(){
       if(!G.flags||!G.flags.trainingUpgradeSeason)return 0;
       return (G.season-G.flags.trainingUpgradeSeason===5)?25:0;
     },
     title:t('kron_hs03_title'),
     body:function(){return t('kron_hs03_body');},
     choices:[
       {label:t('kron_hs03_c1_label'),
        effect:function(){
          if(G.budget<12000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs03result='noBudget';return;}
          G.budget-=12000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:12000,bal:G.budget,season:G.season,note:t('kron_note_hs03_training_upgrade_anniversary')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+6);});
          G.flags.trainingUpgradeSeason=G.season;
          addNews(t('kron_hs03_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs03result==='noBudget')return t('kron_hs03_c1_outcome_nobudget');
          return t('kron_hs03_c1_outcome');
        }},
       {label:t('kron_hs03_c2_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs03result='noBudget2';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_hs03_training_upgrade_anniversary_b')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+2);});
          addNews(t('kron_hs03_c2_news'),'club');
        },
        outcome:function(){
          if(G.kronika.flags._hs03result==='noBudget2')return t('kron_hs03_c2_outcome_nobudget');
          return t('kron_hs03_c2_outcome');
        }},
       {label:t('kron_hs03_c3_label'),
        effect:function(){
          myPl().forEach(function(p){p.form=Math.max(40,(p.form||80)-2);});
          addNews(t('kron_hs03_c3_news'),'club');
        },
        outcome:function(){return t('kron_hs03_c3_outcome');}},
     ]},

    // HS-04: 5 lat od "wielkiego zabezpieczenia danych"
    {id:'hs04_data_secure_anniversary', category:t('kron_cat_history'),
     weight:function(){
       if(!G.flags||!G.flags.dataSecureSeason)return 0;
       return (G.season-G.flags.dataSecureSeason===5)?22:0;
     },
     title:t('kron_hs04_title'),
     body:function(){return t('kron_hs04_body');},
     choices:[
       {label:t('kron_hs04_c1_label'),
        effect:function(){
          if(G.budget<9000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs04result='noBudget';return;}
          G.budget-=9000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:9000,bal:G.budget,season:G.season,note:t('kron_note_hs04_data_secure_anniversary')});
          G.flags.dataSecureSeason=G.season;
          G.reputation=(G.reputation||30)+5;
          addNews(t('kron_hs04_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs04result==='noBudget')return t('kron_hs04_c1_outcome_nobudget');
          return t('kron_hs04_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs04_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-2);},
        outcome:function(){return t('kron_hs04_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs04_c3_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs04result='noBudget2';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_hs04_data_secure_anniversary_b')});
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.flags.dataSecureSeason=G.season;addNews(t('kron_hs04_c3_news_win'),'ok');G.kronika.flags._hs04result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-6);addNews(t('kron_hs04_c3_news_lose'),'err');G.kronika.flags._hs04result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hs04result==='noBudget2')return t('kron_hs04_c3_outcome_nobudget');
          if(G.kronika.flags._hs04result==='win')return t('kron_hs04_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hs04_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-05: 5-lecie objęcia klubu przez gracza
    {id:'hs05_manager_anniversary', category:t('kron_cat_history'),
     weight:function(){return (G.season===6)?30:0;},
     title:t('kron_hs05_title'),
     body:function(){return t('kron_hs05_body').replace('{club}',G.myClub?G.myClub.n:t('kron_hs05_fallback_club'));},
     choices:[
       {label:t('kron_hs05_c1_label'),
        effect:function(){
          if(G.budget<7000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs05result='noBudget';return;}
          G.budget-=7000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:7000,bal:G.budget,season:G.season,note:t('kron_note_hs05_manager_anniversary')});
          G.reputation=(G.reputation||30)+10;
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          addNews(t('kron_hs05_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs05result==='noBudget')return t('kron_hs05_c1_outcome_nobudget');
          return t('kron_hs05_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs05_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_hs05_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs05_c3_label'),
        effect:function(){
          if(Math.random()<0.55){G.reputation=(G.reputation||30)+9;addNews(t('kron_hs05_c3_news_win'),'ok');G.kronika.flags._hs05result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);addNews(t('kron_hs05_c3_news_lose'),'club');G.kronika.flags._hs05result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hs05result==='win')return t('kron_hs05_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hs05_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-06: 5 lat od pierwszego awansu
    {id:'hs06_first_promotion_anniversary', category:t('kron_cat_history'),
     weight:function(){
       var s=hsFirstPromotionSeason();
       return (s!=null&&G.season-s===5)?25:0;
     },
     title:t('kron_hs06_title'),
     body:function(){return t('kron_hs06_body').replace('{n}',5);},
     choices:[
       {label:t('kron_hs06_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs06result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_hs06_first_promotion_anniversary')});
          G.reputation=(G.reputation||30)+7;
          addNews(t('kron_hs06_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs06result==='noBudget')return t('kron_hs06_c1_outcome_nobudget');
          return t('kron_hs06_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs06_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-3);},
        outcome:function(){return t('kron_hs06_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs06_c3_label'),
        effect:function(){
          if(G.budget<8000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs06result='noBudget2';return;}
          G.budget-=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:8000,bal:G.budget,season:G.season,note:t('kron_note_hs06_first_promotion_anniversary_b')});
          G.reputation=(G.reputation||30)+12;
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          addNews(t('kron_hs06_c3_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs06result==='noBudget2')return t('kron_hs06_c3_outcome_nobudget');
          return t('kron_hs06_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-07: 5 lat od najgorszego sezonu
    {id:'hs07_worst_season_anniversary', category:t('kron_cat_history'),
     weight:function(){
       var e=hsWorstSeasonEntry();
       return (e&&G.season-e.season===5)?22:0;
     },
     title:t('kron_hs07_title'),
     body:function(){
       var e=hsWorstSeasonEntry();
       return t('kron_hs07_body').replace('{pos}',e?e.pos:'?').replace('{league}',e?e.league:t('kron_hs01_fallback_league'));
     },
     choices:[
       {label:t('kron_hs07_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+8;addNews(t('kron_hs07_c1_news'),'ok');},
        outcome:function(){return t('kron_hs07_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs07_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hs07_c2_outcome');}},
       {label:t('kron_hs07_c3_label'),
        effect:function(){
          if(Math.random()<0.45){
            G.reputation=(G.reputation||30)+10;
            addNews(t('kron_hs07_c3_news_win'),'ok');
            G.kronika.flags._hs07result='win';
          } else {
            G.budget=Math.max(0,G.budget-3000);
            G.reputation=Math.max(0,(G.reputation||30)-6);
            addNews(t('kron_hs07_c3_news_lose'),'err');
            G.kronika.flags._hs07result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._hs07result==='win')return t('kron_hs07_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hs07_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-08: 5 lat od rekordowego transferu
    {id:'hs08_record_signing_anniversary', category:t('kron_cat_history'),
     weight:function(){
       var e=hsRecordSigning();
       return (e&&G.season-e.season===5)?22:0;
     },
     title:t('kron_hs08_title'),
     body:function(){
       var e=hsRecordSigning();
       return t('kron_hs08_body').replace('{name}',e?e.name:t('kron_fallback_player')).replace('{val}',e?fmtVal(e.val):fmtVal(0));
     },
     choices:[
       {label:t('kron_hs08_c1_label'),
        effect:function(){
          if(G.budget<5000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs08result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:t('kron_note_hs08_record_signing_anniversary')});
          G.reputation=(G.reputation||30)+8;
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
          addNews(t('kron_hs08_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs08result==='noBudget')return t('kron_hs08_c1_outcome_nobudget');
          return t('kron_hs08_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs08_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_hs08_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs08_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;addNews(t('kron_hs08_c3_news_win'),'ok');G.kronika.flags._hs08result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);addNews(t('kron_hs08_c3_news_lose'),'club');G.kronika.flags._hs08result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hs08result==='win')return t('kron_hs08_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hs08_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // ── HISTORIA / TRADYCJA KLUBOWA (bez progu rocznicowego) ──────────

    // HS-09: Propozycja klubowego muzeum (jednorazowe osiągnięcie)
    {id:'hs09_club_museum', category:t('kron_cat_history'),
     weight:function(){return ((!G.flags||!G.flags.museumBuilt)&&(G.reputation||0)>=100&&(G.season||1)>=3)?18:0;},
     title:t('kron_hs09_title'),
     body:function(){return t('kron_hs09_body');},
     choices:[
       {label:t('kron_hs09_c1_label'),
        effect:function(){
          if(G.budget<10000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs09result='noBudget';return;}
          G.budget-=10000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:10000,bal:G.budget,season:G.season,note:t('kron_note_hs09_club_museum')});
          G.flags=G.flags||{};G.flags.museumBuilt=true;G.flags.museumSeason=G.season;
          G.reputation=(G.reputation||30)+15;
          addNews(t('kron_hs09_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs09result==='noBudget')return t('kron_hs09_c1_outcome_nobudget');
          return t('kron_hs09_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs09_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-3);},
        outcome:function(){return t('kron_hs09_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs09_c3_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs09result='noBudget2';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_hs09_club_museum_b')});
          G.reputation=(G.reputation||30)+6;
          addNews(t('kron_hs09_c3_news'),'club');
        },
        outcome:function(){
          if(G.kronika.flags._hs09result==='noBudget2')return t('kron_hs09_c3_outcome_nobudget');
          return t('kron_hs09_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-10: List od najstarszego kibica
    {id:'hs10_veteran_fan_letter', category:t('kron_cat_history'),
     weight:function(){return ((G.season||1)>=3&&(G.round||0)>5)?16:0;},
     title:t('kron_hs10_title'),
     body:function(){return t('kron_hs10_body');},
     choices:[
       {label:t('kron_hs10_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+6;addNews(t('kron_hs10_c1_news'),'ok');},
        outcome:function(){return t('kron_hs10_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs10_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-4);},
        outcome:function(){return t('kron_hs10_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs10_c3_label'),
        effect:function(){
          if(G.budget<1500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs10result='noBudget';return;}
          G.budget-=1500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:1500,bal:G.budget,season:G.season,note:t('kron_note_hs10_veteran_fan_letter')});
          G.reputation=(G.reputation||30)+9;
          addNews(t('kron_hs10_c3_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs10result==='noBudget')return t('kron_hs10_c3_outcome_nobudget');
          return t('kron_hs10_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-11: Propozycja pomnika/ławeczki (jednorazowe osiągnięcie)
    {id:'hs11_statue_proposal', category:t('kron_cat_history'),
     weight:function(){return ((!G.flags||!G.flags.statueBuilt)&&(G.reputation||0)>=200)?16:0;},
     title:t('kron_hs11_title'),
     body:function(){return t('kron_hs11_body').replace('{club}',G.myClub?G.myClub.n:t('kron_hs05_fallback_club'));},
     choices:[
       {label:t('kron_hs11_c1_label'),
        effect:function(){
          if(G.budget<20000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs11result='noBudget';return;}
          G.budget-=20000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:20000,bal:G.budget,season:G.season,note:t('kron_note_hs11_statue_proposal')});
          G.flags=G.flags||{};G.flags.statueBuilt=true;G.flags.statueSeason=G.season;
          G.reputation=(G.reputation||30)+25;
          addNews(t('kron_hs11_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs11result==='noBudget')return t('kron_hs11_c1_outcome_nobudget');
          return t('kron_hs11_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs11_c2_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs11result='noBudget2';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_hs11_statue_proposal_b')});
          G.reputation=(G.reputation||30)+8;
          addNews(t('kron_hs11_c2_news'),'club');
        },
        outcome:function(){
          if(G.kronika.flags._hs11result==='noBudget2')return t('kron_hs11_c2_outcome_nobudget');
          return t('kron_hs11_c2_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs11_c3_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-5);},
        outcome:function(){return t('kron_hs11_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // HS-12: Kapsuła czasu na koniec sezonu
    {id:'hs12_time_capsule', category:t('kron_cat_history'),
     weight:function(){var rl=hsSeasonRoundsLeft();return (rl<=2&&rl>=0)?14:0;},
     title:t('kron_hs12_title'),
     body:function(){return t('kron_hs12_body');},
     choices:[
       {label:t('kron_hs12_c1_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});addNews(t('kron_hs12_c1_news'),'club');},
        outcome:function(){return t('kron_hs12_c1_outcome');}},
       {label:t('kron_hs12_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hs12_c2_outcome');}},
       {label:t('kron_hs12_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;addNews(t('kron_hs12_c3_news'),'ok');},
        outcome:function(){return t('kron_hs12_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // HS-13: Lokalny kronikarz-amator chce spisać historię klubu
    {id:'hs13_local_historian', category:t('kron_cat_history'),
     weight:function(){return (G.season||1)>=2?14:0;},
     title:t('kron_hs13_title'),
     body:function(){return t('kron_hs13_body');},
     choices:[
       {label:t('kron_hs13_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs13result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_hs13_local_historian')});
          G.reputation=(G.reputation||30)+7;
          addNews(t('kron_hs13_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs13result==='noBudget')return t('kron_hs13_c1_outcome_nobudget');
          return t('kron_hs13_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs13_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hs13_c2_outcome');}},
       {label:t('kron_hs13_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=Math.max(0,(G.reputation||30)-5);addNews(t('kron_hs13_c3_news_lose'),'err');G.kronika.flags._hs13result='lose';}
          else{G.reputation=(G.reputation||30)+5;addNews(t('kron_hs13_c3_news_win'),'club');G.kronika.flags._hs13result='win';}
        },
        outcome:function(){
          if(G.kronika.flags._hs13result==='win')return t('kron_hs13_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hs13_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HS-14: Rywal wydaje "księgę historii klubu"
    {id:'hs14_rival_history_book', category:t('kron_cat_history'),
     weight:function(){return G.rival?16:0;},
     title:t('kron_hs14_title'),
     body:function(){return t('kron_hs14_body').replace('{rival}',G.rival?G.rival.n:t('kron_fallback_rival'));},
     choices:[
       {label:t('kron_hs14_c1_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs14result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_hs14_rival_history_book')});
          G.reputation=(G.reputation||30)+8;
          addNews(t('kron_hs14_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs14result==='noBudget')return t('kron_hs14_c1_outcome_nobudget');
          return t('kron_hs14_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs14_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hs14_c2_outcome');}},
       {label:t('kron_hs14_c3_label'),
        effect:function(){
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          if(G.rival&&G.rival.strength!==undefined)G.rival.strength=Math.max(0,(G.rival.strength||50)-2);
          addNews(t('kron_hs14_c3_news').replace('{rival}',G.rival?G.rival.n:t('kron_fallback_rival')),'ok');
        },
        outcome:function(){return t('kron_hs14_c3_outcome');}},
     ]},

    // HS-15: Na strychu magazynu znaleziono stare stroje (jednorazowe)
    {id:'hs15_old_kit_found', category:t('kron_cat_history'),
     weight:function(){return ((!G.flags||!G.flags.retroKitFound)&&(G.season||1)>=2)?14:0;},
     title:t('kron_hs15_title'),
     body:function(){return t('kron_hs15_body');},
     choices:[
       {label:t('kron_hs15_c1_label'),
        effect:function(){
          if(G.budget<3500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs15result='noBudget';return;}
          G.budget-=3500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3500,bal:G.budget,season:G.season,note:t('kron_note_hs15_old_kit_found')});
          G.flags=G.flags||{};G.flags.retroKitFound=true;
          G.reputation=(G.reputation||30)+9;
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
          addNews(t('kron_hs15_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs15result==='noBudget')return t('kron_hs15_c1_outcome_nobudget');
          return t('kron_hs15_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs15_c2_label'),
        effect:function(){G.flags=G.flags||{};G.flags.retroKitFound=true;G.budget+=1000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:1000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_hs15_old_kit_found_b')});addNews(t('kron_hs15_c2_news'),'budget');},
        outcome:function(){return t('kron_hs15_c2_outcome');}},
       {label:t('kron_hs15_c3_label'),
        effect:function(){G.flags=G.flags||{};G.flags.retroKitFound=true;},
        outcome:function(){return t('kron_hs15_c3_outcome');}},
     ]},

    // HS-16: Spór o (żenujący) hymn klubowy (jednorazowe rozstrzygnięcie)
    {id:'hs16_anthem_debate', category:t('kron_cat_history'),
     weight:function(){return ((!G.flags||!G.flags.newAnthem)&&(G.season||1)>=2&&(G.reputation||0)>=50)?14:0;},
     title:t('kron_hs16_title'),
     body:function(){return t('kron_hs16_body');},
     choices:[
       {label:t('kron_hs16_c1_label'),
        effect:function(){
          if(G.budget<6000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hs16result='noBudget';return;}
          G.budget-=6000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:6000,bal:G.budget,season:G.season,note:t('kron_note_hs16_anthem_debate')});
          G.flags=G.flags||{};G.flags.newAnthem='new';
          G.reputation=(G.reputation||30)+10;
          addNews(t('kron_hs16_c1_news'),'ok');
        },
        outcome:function(){
          if(G.kronika.flags._hs16result==='noBudget')return t('kron_hs16_c1_outcome_nobudget');
          return t('kron_hs16_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hs16_c2_label'),
        effect:function(){G.flags=G.flags||{};G.flags.newAnthem='old';G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_hs16_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hs16_c3_label'),
        effect:function(){
          G.flags=G.flags||{};G.flags.newAnthem='vote';
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;addNews(t('kron_hs16_c3_news_win'),'ok');G.kronika.flags._hs16result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);addNews(t('kron_hs16_c3_news_lose'),'err');G.kronika.flags._hs16result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hs16result==='win')return t('kron_hs16_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hs16_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
