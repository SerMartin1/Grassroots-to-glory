// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_health (Sesja 9, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec z Sesji 1: builder-
// funkcja zwracająca świeżą tablicę co tydzień). Żadnych domknięć nad
// my/starters/bestP/kron z zakresu kronTrigger() — wyłącznie globalne
// myPl()/ovr()/G, G.kronika.flags zamiast lokalnego kron.flags. Prefiks id:
// hl (nowy, jednoznaczny — dzisiejsze k02/k03 mają prefiks dzielony z cup/
// crisis, patrz PLAN pkt 4.3, zakres hl01-hl08). Pierwsza sesja sięgająca
// po p.fatigue (system zmęczenia, week-progress.js/match-engine.js) —
// zweryfikowane pole, dotąd nieużywane w żadnym evencie Kroniki. Ton:
// humor w stylu Hattricka.
// ══════════════════════════════════════════════════════════════════════════
function buildKronHealthEvents(){

  function hlTiredStarter(){
    return myPl().find(function(p){return p.starter&&!p.injured&&(p.fatigue||0)>=70;});
  }

  return [

    // HL-01: Ostrzeżenie o wysokim zmęczeniu (patrz p.fatigue, week-progress.js/match-engine.js)
    {id:'hl01_fatigue_warning', category:t('kron_cat_health'),
     weight:function(){return hlTiredStarter()?22:0;},
     title:t('kron_hl01_title'),
     body:function(){
       var p=hlTiredStarter();
       G.kronika.flags._hl01pid=p?p.id:-1;
       return t('kron_hl01_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{n}',p?Math.round(p.fatigue):'?');
     },
     choices:[
       {label:t('kron_hl01_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hl01result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_hl01_fatigue_warning')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._hl01pid;});
          if(p){p.fatigue=Math.max(0,(p.fatigue||0)-30);p.form=Math.min(100,(p.form||80)+3);}
        },
        outcome:function(){
          if(G.kronika.flags._hl01result==='noBudget')return t('kron_hl01_c1_outcome_nobudget');
          return t('kron_hl01_c1_outcome');
        }},
       {label:t('kron_hl01_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hl01_c2_outcome');}},
       {label:t('kron_hl01_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._hl01pid;});
          if(Math.random()<0.5){
            if(p){p.fatigue=Math.max(0,(p.fatigue||0)-20);p.form=Math.min(100,(p.form||80)+2);}
            G.kronika.flags._hl01result='win';
          } else {
            if(p)p.form=Math.max(40,(p.form||80)-8);
            G.kronika.flags._hl01result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._hl01result==='win')return t('kron_hl01_c3_outcome_win');
          return t('kron_hl01_c3_outcome_lose');
        }},
     ]},

    // HL-02: Inwestycja w salę regeneracji
    {id:'hl02_recovery_room_upgrade', category:t('kron_cat_health'),
     weight:function(){return (G.season||1)>=2?16:0;},
     title:t('kron_hl02_title'),
     body:function(){return t('kron_hl02_body');},
     choices:[
       {label:t('kron_hl02_c1_label'),
        effect:function(){
          if(G.budget<6000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hl02result='noBudget';return;}
          G.budget-=6000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:6000,bal:G.budget,season:G.season,note:t('kron_note_hl02_recovery_room_upgrade')});
          myPl().forEach(function(p){p.fatigue=Math.max(0,(p.fatigue||0)-20);});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._hl02result==='noBudget')return t('kron_hl02_c1_outcome_nobudget');
          return t('kron_hl02_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hl02_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hl02_c2_outcome');}},
       {label:t('kron_hl02_c3_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hl02result2='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_hl02_recovery_room_upgrade_b')});
          myPl().forEach(function(p){p.fatigue=Math.max(0,(p.fatigue||0)-10);});
          G.reputation=(G.reputation||30)+2;
        },
        outcome:function(){
          if(G.kronika.flags._hl02result2==='noBudget')return t('kron_hl02_c3_outcome_nobudget');
          return t('kron_hl02_c3_outcome');
        }},
     ]},

    // HL-03: Wyniki okresowych badań lekarskich
    {id:'hl03_medical_checkup_findings', category:t('kron_cat_health'),
     weight:function(){return myPl().length>=16?14:0;},
     title:t('kron_hl03_title'),
     body:function(){return t('kron_hl03_body');},
     choices:[
       {label:t('kron_hl03_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hl03result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_hl03_medical_checkup_findings')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
        },
        outcome:function(){
          if(G.kronika.flags._hl03result==='noBudget')return t('kron_hl03_c1_outcome_nobudget');
          return t('kron_hl03_c1_outcome');
        }},
       {label:t('kron_hl03_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hl03_c2_outcome');}},
       {label:t('kron_hl03_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._hl03result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._hl03result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hl03result==='win')return t('kron_hl03_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hl03_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HL-04: Autorska metoda klubowego lekarza
    {id:'hl04_team_doctor_personality', category:t('kron_cat_health'),
     weight:function(){return (G.season||1)>=1?14:0;},
     title:t('kron_hl04_title'),
     body:function(){return t('kron_hl04_body');},
     choices:[
       {label:t('kron_hl04_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hl04result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_hl04_team_doctor_personality')});
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){
          if(G.kronika.flags._hl04result==='noBudget')return t('kron_hl04_c1_outcome_nobudget');
          return t('kron_hl04_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hl04_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hl04_c2_outcome');}},
       {label:t('kron_hl04_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._hl04result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._hl04result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hl04result==='win')return t('kron_hl04_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hl04_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HL-05: Fala przeziębienia w szatni
    {id:'hl05_flu_outbreak', category:t('kron_cat_health'),
     weight:function(){return (G.round||0)>3?16:0;},
     title:t('kron_hl05_title'),
     body:function(){return t('kron_hl05_body');},
     choices:[
       {label:t('kron_hl05_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hl05result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_hl05_flu_outbreak')});
          myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-1);});
        },
        outcome:function(){
          if(G.kronika.flags._hl05result==='noBudget')return t('kron_hl05_c1_outcome_nobudget');
          return t('kron_hl05_c1_outcome');
        }},
       {label:t('kron_hl05_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.max(45,(p.form||80)-4);});},
        outcome:function(){return t('kron_hl05_c2_outcome');}},
       {label:t('kron_hl05_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.max(55,(p.form||80)-2);});G.kronika.flags._hl05result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(40,(p.form||80)-6);});G.kronika.flags._hl05result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hl05result==='win')return t('kron_hl05_c3_outcome_win');
          return t('kron_hl05_c3_outcome_lose');
        }},
     ]},

    // HL-06: Incydent w wannie z lodem
    {id:'hl06_ice_bath_incident', category:t('kron_cat_health'),
     weight:function(){return (G.round||0)>5?14:0;},
     title:t('kron_hl06_title'),
     body:function(){return t('kron_hl06_body');},
     choices:[
       {label:t('kron_hl06_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_hl06_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hl06_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hl06_c2_outcome');}},
       {label:t('kron_hl06_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._hl06result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._hl06result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hl06result==='win')return t('kron_hl06_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hl06_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HL-07: Moda na monitorowanie snu zawodników
    {id:'hl07_sleep_science_fad', category:t('kron_cat_health'),
     weight:function(){return (G.season||1)>=2?14:0;},
     title:t('kron_hl07_title'),
     body:function(){return t('kron_hl07_body');},
     choices:[
       {label:t('kron_hl07_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hl07result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_hl07_sleep_science_fad')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});
        },
        outcome:function(){
          if(G.kronika.flags._hl07result==='noBudget')return t('kron_hl07_c1_outcome_nobudget');
          return t('kron_hl07_c1_outcome');
        }},
       {label:t('kron_hl07_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_hl07_c2_outcome');}},
       {label:t('kron_hl07_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._hl07result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._hl07result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hl07result==='win')return t('kron_hl07_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hl07_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // HL-08: Kontrowersyjna oferta suplementów
    {id:'hl08_supplement_controversy', category:t('kron_cat_health'),
     weight:function(){return (G.season||1)>=2?14:0;},
     title:t('kron_hl08_title'),
     body:function(){return t('kron_hl08_body');},
     choices:[
       {label:t('kron_hl08_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_hl08_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_hl08_c2_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._hl08result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_hl08_supplement_controversy')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          G.reputation=Math.max(0,(G.reputation||30)-3);
        },
        outcome:function(){
          if(G.kronika.flags._hl08result==='noBudget')return t('kron_hl08_c2_outcome_nobudget');
          return t('kron_hl08_c2_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_hl08_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._hl08result2='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-6);G.kronika.flags._hl08result2='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._hl08result2==='win')return t('kron_hl08_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_hl08_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
