// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_cup (Sesja 10, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec z Sesji 1: builder-
// funkcja zwracająca świeżą tablicę co tydzień). Żadnych domknięć nad
// my/starters/bestP/kron z zakresu kronTrigger() — wyłącznie globalne
// myPl()/ovr()/G, G.kronika.flags zamiast lokalnego kron.flags. Prefiks id:
// cp (nowy, jednoznaczny — dzisiejsze k01 ma prefiks dzielony z health/
// crisis, patrz PLAN pkt 4.3, zakres cp01-cp07). Świadomie bez powielania
// sp05/sp08 (sędzia), sp06 (mecz towarzyski), sp09 (wyciek taktyki), sp21
// (presja faworyta z Sesji 3) i cr07 (kompromitujące odpadnięcie z Sesji 8)
// — ten plik dotyczy oprawy/kontekstu samego turnieju, nie pojedynczego
// meczu. Ton: humor w stylu Hattricka.
// ══════════════════════════════════════════════════════════════════════════
function buildKronCupEvents(){

  function cpFirstCupWin(){
    var wins=(G.cupHistory||[]).filter(function(h){return h.winner&&h.winner.cid===G.myClubId;});
    if(!wins.length)return null;
    return wins.reduce(function(best,h){return h.season<best.season?h:best;},wins[0]);
  }
  function cpNarrowCupEscape(){
    var cupMatches=(G.mHist||[]).filter(function(m){return m._isCup;});
    if(!cupMatches.length)return null;
    var last=cupMatches[cupMatches.length-1];
    if(!(last.hn===G.myClub.n||last.an===G.myClub.n))return null;
    var isH=last.hn===G.myClub.n;
    var myG=isH?last.hg:last.ag,oppG=isH?last.ag:last.hg;
    if(myG-oppG!==1)return null;
    var oppName=isH?last.an:last.hn;
    var oppClub=ALL_CLUBS.find(function(c){return c.n===oppName;});
    if(!oppClub||!G.leagues)return null;
    var oppLg=G.leagues.find(function(l){return l.clubs.some(function(c){return c.id===oppClub.id;});});
    if(!oppLg)return null;
    var myLg=G.myLeague||8;
    if(oppLg.level-myLg<1)return null;
    return {oppName:oppName};
  }

  return [

    // CP-01: 5 lat od zdobycia Pucharu (rocznica)
    {id:'cp01_cup_winner_anniversary', category:t('kron_cat_cup'),
     weight:function(){
       var e=cpFirstCupWin();
       return (e&&G.season-e.season===5)?26:0;
     },
     title:t('kron_cp01_title'),
     body:function(){return t('kron_cp01_body');},
     choices:[
       {label:t('kron_cp01_c1_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cp01result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_cp01_cup_winner_anniversary')});
          G.reputation=(G.reputation||30)+8;
        },
        outcome:function(){
          if(G.kronika.flags._cp01result==='noBudget')return t('kron_cp01_c1_outcome_nobudget');
          return t('kron_cp01_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cp01_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-2);},
        outcome:function(){return t('kron_cp01_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp01_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+9;G.kronika.flags._cp01result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cp01result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cp01result==='win')return t('kron_cp01_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cp01_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CP-02: Ceremonia losowania kolejnej rundy
    {id:'cp02_cup_draw_ceremony', category:t('kron_cat_cup'),
     weight:function(){return (G.cup&&G.cup.active)?18:0;},
     title:t('kron_cp02_title'),
     body:function(){return t('kron_cp02_body');},
     choices:[
       {label:t('kron_cp02_c1_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_cp02_c1_outcome');}},
       {label:t('kron_cp02_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+1;},
        outcome:function(){return t('kron_cp02_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp02_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._cp02result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cp02result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cp02result==='win')return t('kron_cp02_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cp02_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CP-03: Marsz pogromcy faworytów przez rozgrywki pucharowe
    {id:'cp03_giant_slayer_run', category:t('kron_cat_cup'),
     weight:function(){return (G.cup&&G.cup.active&&(G.cup.myRound||0)>=3&&(G.myLeague||8)>=5)?24:0;},
     title:t('kron_cp03_title'),
     body:function(){
       var lbl=typeof CUP_ROUND_LABELS!=='undefined'?CUP_ROUND_LABELS[G.cup.myRound]:null;
       return t('kron_cp03_body').replace('{round}',lbl||t('kron_cp03_fallback_round'));
     },
     choices:[
       {label:t('kron_cp03_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+8;addNews(t('kron_cp03_c1_news'),'ok');},
        outcome:function(){return t('kron_cp03_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp03_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});},
        outcome:function(){return t('kron_cp03_c2_outcome');}},
       {label:t('kron_cp03_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._cp03result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._cp03result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cp03result==='win')return t('kron_cp03_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cp03_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CP-04: Kibice proszą o replikę pucharu do oglądania
    {id:'cp04_replica_trophy_request', category:t('kron_cat_cup'),
     weight:function(){return (G.trophies&&G.trophies.some(function(tr){return tr.type==='cup';}))?16:0;},
     title:t('kron_cp04_title'),
     body:function(){return t('kron_cp04_body');},
     choices:[
       {label:t('kron_cp04_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cp04result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_cp04_replica_trophy_request')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._cp04result==='noBudget')return t('kron_cp04_c1_outcome_nobudget');
          return t('kron_cp04_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cp04_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-2);},
        outcome:function(){return t('kron_cp04_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp04_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._cp04result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cp04result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cp04result==='win')return t('kron_cp04_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cp04_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CP-05: Szał biletowy przed finałem Pucharu
    {id:'cp05_cup_final_ticket_frenzy', category:t('kron_cat_cup'),
     weight:function(){return (G.cup&&G.cup.active&&(G.cup.myRound||0)===4)?28:0;},
     title:t('kron_cp05_title'),
     body:function(){return t('kron_cp05_body');},
     choices:[
       {label:t('kron_cp05_c1_label'),
        effect:function(){
          G.budget+=6000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:6000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_cp05_cup_final_ticket_frenzy')});
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){return t('kron_cp05_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp05_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+6;},
        outcome:function(){return t('kron_cp05_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp05_c3_label'),
        effect:function(){
          if(Math.random()<0.5){
            G.budget+=9000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:9000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_cp05_cup_final_ticket_frenzy_b')});
            G.kronika.flags._cp05result='win';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-5);
            G.kronika.flags._cp05result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._cp05result==='win')return t('kron_cp05_c3_outcome_win');
          return t('kron_cp05_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CP-06: Lokalna telewizja chce transmitować Wasz puchar
    {id:'cp06_cup_broadcast_deal', category:t('kron_cat_cup'),
     weight:function(){return (G.cup&&G.cup.active&&(G.reputation||0)>=60)?18:0;},
     title:t('kron_cp06_title'),
     body:function(){return t('kron_cp06_body');},
     choices:[
       {label:t('kron_cp06_c1_label'),
        effect:function(){
          G.budget+=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:4000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_cp06_cup_broadcast_deal')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){return t('kron_cp06_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp06_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_cp06_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp06_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.budget+=6000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:6000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_cp06_cup_broadcast_deal_b')});G.kronika.flags._cp06result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._cp06result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cp06result==='win')return t('kron_cp06_c3_outcome_win');
          return t('kron_cp06_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CP-07: Ledwie ocalałe zwycięstwo pucharowe
    {id:'cp07_narrow_cup_escape', category:t('kron_cat_cup'),
     weight:function(){return cpNarrowCupEscape()?20:0;},
     title:t('kron_cp07_title'),
     body:function(){
       var e=cpNarrowCupEscape();
       return t('kron_cp07_body').replace('{opp}',e?e.oppName:t('kron_fallback_rival'));
     },
     choices:[
       {label:t('kron_cp07_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_cp07_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cp07_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_cp07_c2_outcome');}},
       {label:t('kron_cp07_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._cp07result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._cp07result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cp07result==='win')return t('kron_cp07_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cp07_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
