// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_finance (Sesja 6, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec z Sesji 1: builder-
// funkcja zwracająca świeżą tablicę co tydzień). Żadnych domknięć nad
// my/starters/bestP/kron z zakresu kronTrigger() — wyłącznie globalne
// myPl()/ovr()/G, G.kronika.flags zamiast lokalnego kron.flags. Prefiks id:
// fn (nowy, jednoznaczny — dzisiejsze m01/m06/dc01 mają prefiks dzielony
// z innymi kategoriami, patrz PLAN pkt 4.3, zakres fn01-fn12). Ton: humor
// w stylu Hattricka.
// ══════════════════════════════════════════════════════════════════════════
function buildKronFinanceEvents(){

  function fnModuleLevel(key){
    return (G.stadium&&G.stadium.modules&&G.stadium.modules[key])||0;
  }
  function fnAnyModuleBuilt(){
    return ['vip','gastro','shop','light','board'].some(function(k){return fnModuleLevel(k)>0;});
  }

  return [

    // FN-01: Cierpliwość zarządu na wyczerpaniu (cele zarządu — patrz systems/board-goals.js)
    {id:'fn01_board_pressure_streak', category:t('kron_cat_finance'), repeatable:true, // v234: reaguje na bieżącą presję zarządu, może wrócić przy kolejnej serii niepowodzeń
     weight:function(){return ((G.board&&G.board.streakFailed||0)>=2)?22:0;},
     title:t('kron_fn01_title'),
     body:function(){return t('kron_fn01_body').replace('{n}',(G.board&&G.board.streakFailed)||0);},
     choices:[
       {label:t('kron_fn01_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_fn01_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn01_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+1;},
        outcome:function(){return t('kron_fn01_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn01_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;G.kronika.flags._fn01result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-6);G.kronika.flags._fn01result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn01result==='win')return t('kron_fn01_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_fn01_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // FN-02: Wpadka z logo sponsora na strojach
    {id:'fn02_sponsor_logo_mishap', category:t('kron_cat_finance'),
     weight:function(){return (G.fin&&G.fin.sponsors>0)?16:0;},
     title:t('kron_fn02_title'),
     body:function(){return t('kron_fn02_body');},
     choices:[
       {label:t('kron_fn02_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._fn02result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_fn02_sponsor_logo_mishap')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._fn02result==='noBudget')return t('kron_fn02_c1_outcome_nobudget');
          return t('kron_fn02_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_fn02_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-3);},
        outcome:function(){return t('kron_fn02_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn02_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._fn02result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._fn02result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn02result==='win')return t('kron_fn02_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_fn02_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // FN-03: Debata o cenach biletów
    {id:'fn03_ticket_price_debate', category:t('kron_cat_finance'),
     weight:function(){return (G.season||1)>=2?16:0;},
     title:t('kron_fn03_title'),
     body:function(){return t('kron_fn03_body');},
     choices:[
       {label:t('kron_fn03_c1_label'),
        effect:function(){
          G.budget+=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:2500,cost:0,bal:G.budget,season:G.season,note:t('kron_note_fn03_ticket_price_debate')});
          G.reputation=Math.max(0,(G.reputation||30)-3);
        },
        outcome:function(){return t('kron_fn03_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn03_c2_label'),
        effect:function(){G.budget+=800;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:800,cost:0,bal:G.budget,season:G.season,note:t('kron_note_fn03_ticket_price_debate')});},
        outcome:function(){return t('kron_fn03_c2_outcome');}},
       {label:t('kron_fn03_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_fn03_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // FN-04: Awaria modułu stadionowego
    {id:'fn04_stadium_module_malfunction', category:t('kron_cat_finance'),
     weight:function(){return fnAnyModuleBuilt()?18:0;},
     title:t('kron_fn04_title'),
     body:function(){return t('kron_fn04_body');},
     choices:[
       {label:t('kron_fn04_c1_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._fn04result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_fn04_stadium_module_malfunction')});
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){
          if(G.kronika.flags._fn04result==='noBudget')return t('kron_fn04_c1_outcome_nobudget');
          return t('kron_fn04_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_fn04_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-4);},
        outcome:function(){return t('kron_fn04_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn04_c3_label'),
        effect:function(){
          if(Math.random()<0.5){
            if(G.budget>=2000){G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_fn04_stadium_module_malfunction_b')});}
            G.reputation=(G.reputation||30)+3;
            G.kronika.flags._fn04result2='win';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-5);
            G.kronika.flags._fn04result2='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._fn04result2==='win')return t('kron_fn04_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_fn04_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // FN-05: Niedobór sprzętu treningowego
    {id:'fn05_kit_supply_shortage', category:t('kron_cat_finance'),
     weight:function(){return myPl().length>=16?16:0;},
     title:t('kron_fn05_title'),
     body:function(){return t('kron_fn05_body');},
     choices:[
       {label:t('kron_fn05_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._fn05result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_fn05_kit_supply_shortage')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
        },
        outcome:function(){
          if(G.kronika.flags._fn05result==='noBudget')return t('kron_fn05_c1_outcome_nobudget');
          return t('kron_fn05_c1_outcome');
        }},
       {label:t('kron_fn05_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+1);});},
        outcome:function(){return t('kron_fn05_c2_outcome');}},
       {label:t('kron_fn05_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});G.kronika.flags._fn05result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-3);});G.kronika.flags._fn05result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn05result==='win')return t('kron_fn05_c3_outcome_win');
          return t('kron_fn05_c3_outcome_lose');
        }},
     ]},

    // FN-06: Niespodziewana kontrola skarbowa
    {id:'fn06_unexpected_tax_audit', category:t('kron_cat_finance'),
     weight:function(){return (G.budget||0)>=20000?16:0;},
     title:t('kron_fn06_title'),
     body:function(){return t('kron_fn06_body');},
     choices:[
       {label:t('kron_fn06_c1_label'),
        effect:function(){
          if(G.budget<5000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._fn06result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:t('kron_note_fn06_unexpected_tax_audit')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._fn06result==='noBudget')return t('kron_fn06_c1_outcome_nobudget');
          return t('kron_fn06_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_fn06_c2_label'),
        effect:function(){
          if(Math.random()<0.5){G.kronika.flags._fn06result2='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._fn06result2='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn06result2==='win')return t('kron_fn06_c2_outcome_win');
          return t('kron_fn06_c2_outcome_lose').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_fn06_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._fn06result3='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);G.kronika.flags._fn06result3='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn06result3==='win')return t('kron_fn06_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_fn06_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // FN-07: Skarga na catering w loży VIP
    {id:'fn07_vip_catering_complaint', category:t('kron_cat_finance'),
     weight:function(){return fnModuleLevel('vip')>=1?16:0;},
     title:t('kron_fn07_title'),
     body:function(){return t('kron_fn07_body');},
     choices:[
       {label:t('kron_fn07_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._fn07result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_fn07_vip_catering_complaint')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._fn07result==='noBudget')return t('kron_fn07_c1_outcome_nobudget');
          return t('kron_fn07_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_fn07_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-3);},
        outcome:function(){return t('kron_fn07_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn07_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._fn07result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._fn07result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn07result==='win')return t('kron_fn07_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_fn07_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // FN-08: Niespodziewany hit sklepiku klubowego
    {id:'fn08_gadget_bestseller', category:t('kron_cat_finance'),
     weight:function(){return (G.season||1)>=1?14:0;},
     title:t('kron_fn08_title'),
     body:function(){return t('kron_fn08_body');},
     choices:[
       {label:t('kron_fn08_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._fn08result='noBudget';return;}
          G.budget-=2000;
          G.budget+=5000;
          if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:5000,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_fn08_gadget_bestseller')});
        },
        outcome:function(){
          if(G.kronika.flags._fn08result==='noBudget')return t('kron_fn08_c1_outcome_nobudget');
          return t('kron_fn08_c1_outcome');
        }},
       {label:t('kron_fn08_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_fn08_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn08_c3_label'),
        effect:function(){
          if(Math.random()<0.5){
            G.budget+=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:3000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_fn08_gadget_bestseller_b')});
            G.kronika.flags._fn08result='win';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-3);
            G.kronika.flags._fn08result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._fn08result==='win')return t('kron_fn08_c3_outcome_win');
          return t('kron_fn08_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // FN-09: Nadwyżka budżetowa
    {id:'fn09_budget_surplus_windfall', category:t('kron_cat_finance'),
     weight:function(){return (G.budget||0)>=80000?18:0;},
     title:t('kron_fn09_title'),
     body:function(){return t('kron_fn09_body');},
     choices:[
       {label:t('kron_fn09_c1_label'),
        effect:function(){
          G.budget-=Math.min(G.budget,10000);
          if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:10000,bal:G.budget,season:G.season,note:t('kron_note_fn09_budget_surplus_windfall')});
          G.reputation=(G.reputation||30)+8;
        },
        outcome:function(){return t('kron_fn09_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn09_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_fn09_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn09_c3_label'),
        effect:function(){
          G.budget-=Math.min(G.budget,6000);
          if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:6000,bal:G.budget,season:G.season,note:t('kron_note_fn09_budget_surplus_windfall_b')});
          G.reputation=Math.max(0,(G.reputation||30)-5);
        },
        outcome:function(){return t('kron_fn09_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // FN-10: Specjalny fundusz transferowy zarządu (patrz systems/board-goals.js: G.board.transferBudget)
    {id:'fn10_transfer_pool_windfall', category:t('kron_cat_finance'),
     weight:function(){return ((G.board&&G.board.transferBudget||0)>=5000)?18:0;},
     title:t('kron_fn10_title'),
     body:function(){return t('kron_fn10_body').replace('{val}',fmtVal((G.board&&G.board.transferBudget)||0));},
     choices:[
       {label:t('kron_fn10_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_fn10_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn10_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_fn10_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_fn10_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;addNews(t('kron_fn10_c3_news').replace('{val}',fmtVal((G.board&&G.board.transferBudget)||0)),'budget');},
        outcome:function(){return t('kron_fn10_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // FN-11: Wizyta komisji finansowej zarządu
    {id:'fn11_finance_committee_visit', category:t('kron_cat_finance'),
     weight:function(){return (G.season||1)>=2?14:0;},
     title:t('kron_fn11_title'),
     body:function(){return t('kron_fn11_body');},
     choices:[
       {label:t('kron_fn11_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._fn11result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_fn11_finance_committee_visit')});
          G.reputation=(G.reputation||30)+6;
        },
        outcome:function(){
          if(G.kronika.flags._fn11result==='noBudget')return t('kron_fn11_c1_outcome_nobudget');
          return t('kron_fn11_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_fn11_c2_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+3;G.kronika.flags._fn11result2='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);G.kronika.flags._fn11result2='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn11result2==='win')return t('kron_fn11_c2_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_fn11_c2_outcome_lose').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_fn11_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._fn11result3='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._fn11result3='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn11result3==='win')return t('kron_fn11_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_fn11_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // FN-12: Kampania odnowienia karnetów sezonowych
    {id:'fn12_season_ticket_renewal_drive', category:t('kron_cat_finance'),
     weight:function(){return ((G.round||0)<=3&&(G.season||1)>=2)?16:0;},
     title:t('kron_fn12_title'),
     body:function(){return t('kron_fn12_body');},
     choices:[
       {label:t('kron_fn12_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._fn12result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_fn12_season_ticket_renewal_drive')});
          G.reputation=(G.reputation||30)+6;
        },
        outcome:function(){
          if(G.kronika.flags._fn12result==='noBudget')return t('kron_fn12_c1_outcome_nobudget');
          return t('kron_fn12_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_fn12_c2_label'),
        effect:function(){G.budget+=600;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:600,cost:0,bal:G.budget,season:G.season,note:t('kron_note_fn12_season_ticket_renewal_drive')});},
        outcome:function(){return t('kron_fn12_c2_outcome');}},
       {label:t('kron_fn12_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._fn12result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._fn12result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._fn12result==='win')return t('kron_fn12_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_fn12_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
