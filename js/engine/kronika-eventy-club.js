// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_club (Sesja 7, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec z Sesji 1: builder-
// funkcja zwracająca świeżą tablicę co tydzień). Żadnych domknięć nad
// my/starters/bestP/kron z zakresu kronTrigger() — wyłącznie globalne
// myPl()/ovr()/G, G.kronika.flags zamiast lokalnego kron.flags. Prefiks id:
// cl (nowy, jednoznaczny — dzisiejsze m01 ma prefiks dzielony z finance,
// patrz PLAN pkt 4.3, zakres cl01-cl09). Ton: humor w stylu Hattricka.
// cl10/cl11 (Sesja 12) to przykładowy ŁAŃCUCH MIĘDZYSEZONOWY nr 1 —
// kolejna odmiana wzorca ac18/ac19 BEZ śledzenia zawodnika: stan to
// zapamiętana pojemność stadionu w chwili obietnicy władz miasta, a
// rozstrzygnięcie w cr10-podobny sposób porównuje ją z bieżącym
// G.stadium.capacity (deterministyczne, nie losowe — pokazuje, że
// rozstrzygnięcie łańcucha nie musi być rzutem monetą, może czytać
// realną zmianę stanu gry).
// ══════════════════════════════════════════════════════════════════════════
function buildKronClubEvents(){

  function clFirstStadiumExpansion(){
    var hist=(G.stadium&&G.stadium.hist||[]).filter(function(h){return h.seats>0;});
    if(!hist.length)return null;
    return hist.reduce(function(best,h){return h.season<best.season?h:best;},hist[0]);
  }

  return [

    // CL-01: 5 lat od rozbudowy stadionu (rocznica)
    {id:'cl01_stadium_capacity_anniversary', category:t('kron_cat_club'),
     weight:function(){
       var e=clFirstStadiumExpansion();
       return (e&&G.season-e.season===5)?24:0;
     },
     title:t('kron_cl01_title'),
     body:function(){
       var e=clFirstStadiumExpansion();
       return t('kron_cl01_body').replace('{seats}',e?e.seats:'?');
     },
     choices:[
       {label:t('kron_cl01_c1_label'),
        effect:function(){
          if(G.budget<3500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cl01result='noBudget';return;}
          G.budget-=3500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3500,bal:G.budget,season:G.season,note:t('kron_note_cl01_stadium_capacity_anniversary')});
          G.reputation=(G.reputation||30)+7;
        },
        outcome:function(){
          if(G.kronika.flags._cl01result==='noBudget')return t('kron_cl01_c1_outcome_nobudget');
          return t('kron_cl01_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cl01_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-2);},
        outcome:function(){return t('kron_cl01_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl01_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+9;G.kronika.flags._cl01result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cl01result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cl01result==='win')return t('kron_cl01_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl01_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CL-02: Kibice zakładają oficjalny fanklub (jednorazowe osiągnięcie)
    {id:'cl02_fan_club_founding', category:t('kron_cat_club'),
     weight:function(){return ((!G.flags||!G.flags.fanClubFounded)&&(G.season||1)>=2&&(G.reputation||0)>=50)?20:0;},
     title:t('kron_cl02_title'),
     body:function(){return t('kron_cl02_body');},
     choices:[
       {label:t('kron_cl02_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cl02result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_cl02_fan_club_founding')});
          G.flags=G.flags||{};G.flags.fanClubFounded=true;G.flags.fanClubSeason=G.season;
          G.reputation=(G.reputation||30)+10;
        },
        outcome:function(){
          if(G.kronika.flags._cl02result==='noBudget')return t('kron_cl02_c1_outcome_nobudget');
          return t('kron_cl02_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cl02_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-3);},
        outcome:function(){return t('kron_cl02_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl02_c3_label'),
        effect:function(){
          if(Math.random()<0.5){
            G.flags=G.flags||{};G.flags.fanClubFounded=true;G.flags.fanClubSeason=G.season;
            G.reputation=(G.reputation||30)+8;
            G.kronika.flags._cl02result='win';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-4);
            G.kronika.flags._cl02result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._cl02result==='win')return t('kron_cl02_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl02_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CL-03: Rywalizacja o prestiż w mieście
    {id:'cl03_city_rivalry_prestige', category:t('kron_cat_club'),
     weight:function(){return G.rival?18:0;},
     title:t('kron_cl03_title'),
     body:function(){return t('kron_cl03_body').replace('{rival}',G.rival?G.rival.n:t('kron_fallback_rival'));},
     choices:[
       {label:t('kron_cl03_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cl03result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_cl03_city_rivalry_prestige')});
          G.reputation=(G.reputation||30)+6;
        },
        outcome:function(){
          if(G.kronika.flags._cl03result==='noBudget')return t('kron_cl03_c1_outcome_nobudget');
          return t('kron_cl03_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cl03_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_cl03_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl03_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;G.kronika.flags._cl03result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._cl03result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cl03result==='win')return t('kron_cl03_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl03_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CL-04: Spór o maskotkę klubową
    {id:'cl04_mascot_debate', category:t('kron_cat_club'),
     weight:function(){return (G.season||1)>=1?14:0;},
     title:t('kron_cl04_title'),
     body:function(){return t('kron_cl04_body');},
     choices:[
       {label:t('kron_cl04_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cl04result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_cl04_mascot_debate')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._cl04result==='noBudget')return t('kron_cl04_c1_outcome_nobudget');
          return t('kron_cl04_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cl04_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_cl04_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl04_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._cl04result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._cl04result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cl04result==='win')return t('kron_cl04_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl04_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CL-05: Stadion pęka w szwach (wysoka frekwencja)
    {id:'cl05_frequency_milestone', category:t('kron_cat_club'),
     weight:function(){return (G.frequency||0)>=90?18:0;},
     title:t('kron_cl05_title'),
     body:function(){return t('kron_cl05_body').replace('{n}',G.frequency||0);},
     choices:[
       {label:t('kron_cl05_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+6;},
        outcome:function(){return t('kron_cl05_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl05_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_cl05_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl05_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_cl05_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // CL-06: Lokalna telewizja kręci reportaż o klubie
    {id:'cl06_local_media_feature', category:t('kron_cat_club'),
     weight:function(){return (G.reputation||0)>=80?16:0;},
     title:t('kron_cl06_title'),
     body:function(){return t('kron_cl06_body');},
     choices:[
       {label:t('kron_cl06_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cl06result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_cl06_local_media_feature')});
          G.reputation=(G.reputation||30)+7;
        },
        outcome:function(){
          if(G.kronika.flags._cl06result==='noBudget')return t('kron_cl06_c1_outcome_nobudget');
          return t('kron_cl06_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cl06_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_cl06_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl06_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+8;G.kronika.flags._cl06result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cl06result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cl06result==='win')return t('kron_cl06_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl06_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CL-07: Kibice proponują żartobliwe przezwisko stadionu
    {id:'cl07_stadium_naming_suggestion', category:t('kron_cat_club'),
     weight:function(){return ((G.stadium&&G.stadium.capacity||0)>=1000)?14:0;},
     title:t('kron_cl07_title'),
     body:function(){return t('kron_cl07_body');},
     choices:[
       {label:t('kron_cl07_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_cl07_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl07_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_cl07_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl07_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._cl07result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cl07result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cl07result==='win')return t('kron_cl07_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl07_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CL-08: Dzień otwarty dla lokalnej społeczności
    {id:'cl08_community_event', category:t('kron_cat_club'),
     weight:function(){return (G.season||1)>=2?16:0;},
     title:t('kron_cl08_title'),
     body:function(){return t('kron_cl08_body');},
     choices:[
       {label:t('kron_cl08_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._cl08result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_cl08_community_event')});
          G.reputation=(G.reputation||30)+8;
        },
        outcome:function(){
          if(G.kronika.flags._cl08result==='noBudget')return t('kron_cl08_c1_outcome_nobudget');
          return t('kron_cl08_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cl08_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_cl08_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl08_c3_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-4);},
        outcome:function(){return t('kron_cl08_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // CL-09: Transparent kibiców zawisł do góry nogami
    {id:'cl09_flag_banner_incident', category:t('kron_cat_club'),
     weight:function(){return (G.round||0)>5?14:0;},
     title:t('kron_cl09_title'),
     body:function(){return t('kron_cl09_body');},
     choices:[
       {label:t('kron_cl09_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_cl09_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl09_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_cl09_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl09_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._cl09result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cl09result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cl09result==='win')return t('kron_cl09_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl09_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // CL-10: Obietnica władz miasta (ŁAŃCUCH — start, patrz cl11)
    {id:'cl10_city_stadium_promise', category:t('kron_cat_club'),
     weight:function(){
       if(G.flags&&G.flags.cityStadiumPromise)return 0;
       return (G.season||1)>=2?18:0;
     },
     title:t('kron_cl10_title'),
     body:function(){return t('kron_cl10_body');},
     choices:[
       {label:t('kron_cl10_c1_label'),
        effect:function(){
          G.flags=G.flags||{};
          G.flags.cityStadiumPromise={season:G.season,capacityAtPromise:(G.stadium&&G.stadium.capacity)||200,reaction:'thanked'};
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){return t('kron_cl10_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl10_c2_label'),
        effect:function(){
          G.flags=G.flags||{};
          G.flags.cityStadiumPromise={season:G.season,capacityAtPromise:(G.stadium&&G.stadium.capacity)||200,reaction:'pressed'};
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._cl10result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._cl10result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cl10result==='win')return t('kron_cl10_c2_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl10_c2_outcome_lose').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_cl10_c3_label'),
        effect:function(){
          G.flags=G.flags||{};
          G.flags.cityStadiumPromise={season:G.season,capacityAtPromise:(G.stadium&&G.stadium.capacity)||200,reaction:'skeptical'};
        },
        outcome:function(){return t('kron_cl10_c3_outcome');}},
     ]},

    // CL-11: Czy miasto dotrzymało słowa? (ŁAŃCUCH — zakończenie cl10)
    {id:'cl11_city_stadium_promise_resolution', category:t('kron_cat_club'),
     weight:function(){
       if(!G.flags||!G.flags.cityStadiumPromise)return 0;
       return (G.season-G.flags.cityStadiumPromise.season)>=1?24:0;
     },
     title:t('kron_cl11_title'),
     body:function(){
       var w=G.flags.cityStadiumPromise;
       var seasonsAgo=G.season-w.season;
       var kept=((G.stadium&&G.stadium.capacity)||200)>w.capacityAtPromise;
       G.kronika.flags._cl11kept=kept;
       return kept?t('kron_cl11_body_kept').replace('{n}',seasonsAgo):t('kron_cl11_body_notkept').replace('{n}',seasonsAgo);
     },
     choices:[
       {label:t('kron_cl11_c1_label'),
        effect:function(){G.flags.cityStadiumPromise=null;G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_cl11_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_cl11_c2_label'),
        effect:function(){G.flags.cityStadiumPromise=null;},
        outcome:function(){return t('kron_cl11_c2_outcome');}},
       {label:t('kron_cl11_c3_label'),
        effect:function(){
          G.flags.cityStadiumPromise=null;
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._cl11result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._cl11result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._cl11result==='win')return t('kron_cl11_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_cl11_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
