// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_academy (Sesja 2, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec poprawiony przy
// Sesji 1: builder-funkcja zwracająca świeżą tablicę co tydzień, żeby
// title/category poprawnie reagowały na przełączenie języka — patrz
// PLAN_KRONIKA_ROZBUDOWA.txt pkt 3c). Żadnych domknięć nad my/starters/
// bestP/kron z zakresu kronTrigger() — wyłącznie globalne myPl()/ovr()/G,
// G.kronika.flags zamiast lokalnego kron.flags. Prefiks id: ac (nowy,
// jednoznaczny — patrz PLAN pkt 4.3). Ton: humor w stylu Hattricka.
//
// ac18/ac19 to pierwszy w grze PRZYKŁADOWY ŁAŃCUCH MIĘDZYSEZONOWY (decyzja
// #4, PLAN pkt 0) — stan łańcucha trzymany wyłącznie w G.flags.academyWatch
// (NIGDY w G.kronika.flags — to drugie zeruje się co sezon, patrz PLAN
// pkt 2.3/0.4), więc przeżywa zmianę sezonu tak długo, aż ac19 go rozwiąże
// i skasuje flagę.
// ══════════════════════════════════════════════════════════════════════════
function buildKronAcademyEvents(){

  function acFirstGraduateEntry(){
    var hist=(G.academy&&G.academy.hist||[]).filter(function(h){return h.action==='Joined squad'&&h.joinedSeason!=null;});
    if(!hist.length)return null;
    return hist.reduce(function(best,h){return h.joinedSeason<best.joinedSeason?h:best;},hist[0]);
  }
  function acPendingProspects(){
    return (G.academy&&G.academy.prospects||[]).filter(function(p){return p.status==='pending';});
  }
  function acFreshGraduate(){
    var hist=(G.academy&&G.academy.hist||[]).filter(function(h){return h.action==='Joined squad'&&h.joinedSeason===G.season;});
    if(!hist.length)return null;
    var byPid={};myPl().forEach(function(p){byPid[p.id]=p;});
    for(var i=0;i<hist.length;i++){if(byPid[hist[i].pid])return byPid[hist[i].pid];}
    return null;
  }
  function acYoungGraduate(minSeasons,maxSeasons){
    return myPl().find(function(p){
      return p.fromAcademy&&(p._seasonsAtClub||0)>=minSeasons&&(p._seasonsAtClub||0)<=maxSeasons;
    });
  }
  function acGrowthSpurt(){
    return myPl().find(function(p){
      return p.fromAcademy&&(p.age||99)<=19&&(ovr(p)-(p.seasonStartOvr||ovr(p)))>=6;
    });
  }
  function acHypeCandidate(){
    return myPl().find(function(p){
      return p.fromAcademy&&(p._seasonsAtClub||0)<=1&&((p.potential||0)-ovr(p))>=25;
    });
  }
  function acRejectedCount(){
    return (G.academy&&G.academy.hist||[]).filter(function(h){return h.isRejected;}).length;
  }
  function acWatchCandidate(){
    return myPl().find(function(p){
      return p.fromAcademy&&(p.age||99)<=20&&((p.potential||0)-ovr(p))>=15;
    });
  }
  function acFindAnywhere(pid){
    var pool=(G.players||[]).concat(G.retiredPlayers||[]);
    return pool.find(function(p){return p.id===pid;})||null;
  }
  function acLegacyEntry(){
    var hist=(G.academy&&G.academy.hist||[]).filter(function(h){return h.action==='Joined squad'&&h.joinedSeason!=null&&(G.season-h.joinedSeason)>=3;});
    var stillHere={};myPl().forEach(function(p){stillHere[p.id]=true;});
    for(var i=0;i<hist.length;i++){if(!stillHere[hist[i].pid])return hist[i];}
    return null;
  }
  function acSeasonRoundsLeft(){
    if(!G.standing||!G.standing.length)return 99;
    var totalRounds=(G.standing.length-1)*2;
    var played=G.standing[0]?(G.standing[0].p||0):0;
    return totalRounds-played;
  }

  return [

    // AC-01: 5 lat od pierwszego absolwenta akademii (rocznica)
    {id:'ac01_first_graduate_anniversary', category:t('kron_cat_academy'),
     weight:function(){
       var e=acFirstGraduateEntry();
       return (e&&G.season-e.joinedSeason===5)?26:0;
     },
     title:t('kron_ac01_title'),
     body:function(){
       var e=acFirstGraduateEntry();
       return t('kron_ac01_body').replace('{name}',e?e.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_ac01_c1_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac01result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_ac01_first_graduate_anniversary')});
          G.reputation=(G.reputation||30)+7;
          addNews(t('kron_ac01_c1_news'),'academy');
        },
        outcome:function(){
          if(G.kronika.flags._ac01result==='noBudget')return t('kron_ac01_c1_outcome_nobudget');
          return t('kron_ac01_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac01_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-2);},
        outcome:function(){return t('kron_ac01_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac01_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+9;addNews(t('kron_ac01_c3_news_win'),'ok');G.kronika.flags._ac01result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);addNews(t('kron_ac01_c3_news_lose'),'club');G.kronika.flags._ac01result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac01result==='win')return t('kron_ac01_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac01_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-02: Sekretariat myli teczki dwóch prospektów
    {id:'ac02_prospect_naming_chaos', category:t('kron_cat_academy'),
     weight:function(){return (G.academy&&G.academy.level>=1&&acPendingProspects().length>=2)?16:0;},
     title:t('kron_ac02_title'),
     body:function(){return t('kron_ac02_body');},
     choices:[
       {label:t('kron_ac02_c1_label'),
        effect:function(){
          if(G.budget<1500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac02result='noBudget';return;}
          G.budget-=1500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:1500,bal:G.budget,season:G.season,note:t('kron_note_ac02_prospect_naming_chaos')});
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){
          if(G.kronika.flags._ac02result==='noBudget')return t('kron_ac02_c1_outcome_nobudget');
          return t('kron_ac02_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac02_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_ac02_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac02_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;addNews(t('kron_ac02_c3_news_win'),'club');G.kronika.flags._ac02result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);addNews(t('kron_ac02_c3_news_lose'),'err');G.kronika.flags._ac02result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac02result==='win')return t('kron_ac02_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac02_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-03: Prawdziwy charakter wychowanka wychodzi na jaw po sezonie
    {id:'ac03_archetype_reveal', category:t('kron_cat_academy'),
     weight:function(){return acYoungGraduate(1,1)?18:0;},
     title:t('kron_ac03_title'),
     body:function(){
       var p=acYoungGraduate(1,1);
       var arch=p&&p.archetype&&typeof ARCHETYPE_META!=='undefined'&&ARCHETYPE_META[p.archetype]?ARCHETYPE_META[p.archetype].name:t('kron_ac03_fallback_archetype');
       G.kronika.flags._ac03pid=p?p.id:-1;
       return t('kron_ac03_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{archetype}',arch);
     },
     choices:[
       {label:t('kron_ac03_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac03result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_ac03_archetype_reveal')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._ac03pid;});
          if(p)p.form=Math.min(100,(p.form||80)+6);
        },
        outcome:function(){
          if(G.kronika.flags._ac03result==='noBudget')return t('kron_ac03_c1_outcome_nobudget');
          return t('kron_ac03_c1_outcome');
        }},
       {label:t('kron_ac03_c2_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._ac03pid;});
          if(p)p.form=Math.min(100,(p.form||80)+2);
        },
        outcome:function(){return t('kron_ac03_c2_outcome');}},
       {label:t('kron_ac03_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;addNews(t('kron_ac03_c3_news_win'),'academy');G.kronika.flags._ac03result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);addNews(t('kron_ac03_c3_news_lose'),'err');G.kronika.flags._ac03result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac03result==='win')return t('kron_ac03_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac03_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-04: Świeżo przyjęty wychowanek ma zaskakującą cechę
    {id:'ac04_trait_surprise', category:t('kron_cat_academy'),
     weight:function(){var p=acFreshGraduate();return (p&&p.traits&&p.traits.length)?20:0;},
     title:t('kron_ac04_title'),
     body:function(){
       var p=acFreshGraduate();
       G.kronika.flags._ac04pid=p?p.id:-1;
       var trait=p&&p.traits&&p.traits.length&&typeof TRAITS!=='undefined'?TRAITS[p.traits[0]]:null;
       return t('kron_ac04_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{trait}',trait?trait.name:t('kron_ac04_fallback_trait'));
     },
     choices:[
       {label:t('kron_ac04_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac04result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_ac04_trait_surprise')});
          G.reputation=(G.reputation||30)+6;
        },
        outcome:function(){
          if(G.kronika.flags._ac04result==='noBudget')return t('kron_ac04_c1_outcome_nobudget');
          return t('kron_ac04_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac04_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_ac04_c2_outcome');}},
       {label:t('kron_ac04_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;addNews(t('kron_ac04_c3_news_win'),'academy');G.kronika.flags._ac04result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);addNews(t('kron_ac04_c3_news_lose'),'club');G.kronika.flags._ac04result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac04result==='win')return t('kron_ac04_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac04_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-05: Akademia w komplecie — sześciu prospektów naraz
    {id:'ac05_prospect_overflow', category:t('kron_cat_academy'),
     weight:function(){return acPendingProspects().length>=6?18:0;},
     title:t('kron_ac05_title'),
     body:function(){return t('kron_ac05_body');},
     choices:[
       {label:t('kron_ac05_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac05result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_ac05_prospect_overflow')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._ac05result==='noBudget')return t('kron_ac05_c1_outcome_nobudget');
          return t('kron_ac05_c1_outcome');
        }},
       {label:t('kron_ac05_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_ac05_c2_outcome');}},
       {label:t('kron_ac05_c3_label'),
        effect:function(){
          var pend=acPendingProspects();
          if(pend.length&&Math.random()<0.5){
            var pick=pend[Math.floor(Math.random()*pend.length)];
            pick.ovr=Math.min(99,(pick.ovr||20)+2);
            G.kronika.flags._ac05pickName=pick.name;
            G.kronika.flags._ac05result='win';
          } else {
            G.kronika.flags._ac05result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._ac05result==='win')return t('kron_ac05_c3_outcome_win').replace('{name}',G.kronika.flags._ac05pickName||t('kron_fallback_player'));
          return t('kron_ac05_c3_outcome_lose');
        }},
     ]},

    // AC-06: Skaut kontra trener akademii — kto "odkrył" talent
    {id:'ac06_scout_vs_academy', category:t('kron_cat_academy'),
     weight:function(){
       var hasScout=G.scout&&G.scout.level&&G.scout.level!=='free';
       return (hasScout&&G.academy&&G.academy.level>=1)?16:0;
     },
     title:t('kron_ac06_title'),
     body:function(){return t('kron_ac06_body');},
     choices:[
       {label:t('kron_ac06_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac06result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_ac06_scout_vs_academy')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._ac06result==='noBudget')return t('kron_ac06_c1_outcome_nobudget');
          return t('kron_ac06_c1_outcome');
        }},
       {label:t('kron_ac06_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_ac06_c2_outcome');}},
       {label:t('kron_ac06_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;addNews(t('kron_ac06_c3_news'),'academy');},
        outcome:function(){return t('kron_ac06_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // AC-07: Zebranie rodziców wychowanków
    {id:'ac07_parents_meeting', category:t('kron_cat_academy'),
     weight:function(){return (G.academy&&G.academy.level>=1&&(G.season||1)>=2)?14:0;},
     title:t('kron_ac07_title'),
     body:function(){return t('kron_ac07_body');},
     choices:[
       {label:t('kron_ac07_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac07result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_ac07_parents_meeting')});
          G.reputation=(G.reputation||30)+6;
        },
        outcome:function(){
          if(G.kronika.flags._ac07result==='noBudget')return t('kron_ac07_c1_outcome_nobudget');
          return t('kron_ac07_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac07_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_ac07_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac07_c3_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-3);},
        outcome:function(){return t('kron_ac07_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // AC-08: Dzień otwarty akademii
    {id:'ac08_academy_open_day', category:t('kron_cat_academy'),
     weight:function(){return (G.academy&&G.academy.level>=2&&(G.reputation||0)>=80)?16:0;},
     title:t('kron_ac08_title'),
     body:function(){return t('kron_ac08_body');},
     choices:[
       {label:t('kron_ac08_c1_label'),
        effect:function(){
          if(G.budget<5000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac08result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:t('kron_note_ac08_academy_open_day')});
          G.reputation=(G.reputation||30)+10;
          addNews(t('kron_ac08_c1_news'),'academy');
        },
        outcome:function(){
          if(G.kronika.flags._ac08result==='noBudget')return t('kron_ac08_c1_outcome_nobudget');
          return t('kron_ac08_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac08_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_ac08_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac08_c3_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-6);},
        outcome:function(){return t('kron_ac08_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // AC-09: Nagły skok wzrostu wychowanka
    {id:'ac09_prospect_growth_spurt', category:t('kron_cat_academy'),
     weight:function(){return acGrowthSpurt()?20:0;},
     title:t('kron_ac09_title'),
     body:function(){
       var p=acGrowthSpurt();
       G.kronika.flags._ac09pid=p?p.id:-1;
       return t('kron_ac09_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_ac09_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac09result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_ac09_prospect_growth_spurt')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._ac09pid;});
          if(p)p.form=Math.min(100,(p.form||80)+5);
        },
        outcome:function(){
          if(G.kronika.flags._ac09result==='noBudget')return t('kron_ac09_c1_outcome_nobudget');
          return t('kron_ac09_c1_outcome');
        }},
       {label:t('kron_ac09_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_ac09_c2_outcome');}},
       {label:t('kron_ac09_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;addNews(t('kron_ac09_c3_news_win'),'academy');G.kronika.flags._ac09result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._ac09result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac09result==='win')return t('kron_ac09_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac09_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-10: Rywal ma błyszczącą nową akademię
    {id:'ac10_academy_rivalry', category:t('kron_cat_academy'),
     weight:function(){return (G.rival&&G.academy&&(G.academy.level||0)<=1)?16:0;},
     title:t('kron_ac10_title'),
     body:function(){return t('kron_ac10_body').replace('{rival}',G.rival?G.rival.n:t('kron_fallback_rival'));},
     choices:[
       {label:t('kron_ac10_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac10result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_ac10_academy_rivalry')});
          G.reputation=(G.reputation||30)+6;
        },
        outcome:function(){
          if(G.kronika.flags._ac10result==='noBudget')return t('kron_ac10_c1_outcome_nobudget');
          return t('kron_ac10_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac10_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_ac10_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac10_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._ac10result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);G.kronika.flags._ac10result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac10result==='win')return t('kron_ac10_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac10_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-11: Prasa okrzykuje wychowanka "objawieniem" bez rozegranej minuty
    {id:'ac11_prospect_media_hype', category:t('kron_cat_academy'),
     weight:function(){return acHypeCandidate()?18:0;},
     title:t('kron_ac11_title'),
     body:function(){
       var p=acHypeCandidate();
       G.kronika.flags._ac11pid=p?p.id:-1;
       return t('kron_ac11_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_ac11_c1_label'),
        effect:function(){
          G.reputation=(G.reputation||30)+5;
          var p=G.players.find(function(x){return x.id===G.kronika.flags._ac11pid;});
          if(p)p.form=Math.min(100,(p.form||80)+3);
        },
        outcome:function(){return t('kron_ac11_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac11_c2_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;G.kronika.flags._ac11result='win';}
          else{
            var p=G.players.find(function(x){return x.id===G.kronika.flags._ac11pid;});
            if(p)p.form=Math.max(40,(p.form||80)-6);
            G.kronika.flags._ac11result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._ac11result==='win')return t('kron_ac11_c2_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac11_c2_outcome_lose');
        }},
       {label:t('kron_ac11_c3_label'),
        effect:function(){G.budget+=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:2000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_ac11_prospect_media_hype')});G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_ac11_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // AC-12: Dach akademii przecieka podczas ulewy
    {id:'ac12_academy_facility_leak', category:t('kron_cat_academy'),
     weight:function(){return (G.academy&&G.academy.level>=1)?14:0;},
     title:t('kron_ac12_title'),
     body:function(){return t('kron_ac12_body');},
     choices:[
       {label:t('kron_ac12_c1_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac12result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_ac12_academy_facility_leak')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._ac12result==='noBudget')return t('kron_ac12_c1_outcome_nobudget');
          return t('kron_ac12_c1_outcome');
        }},
       {label:t('kron_ac12_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_ac12_c2_outcome');}},
       {label:t('kron_ac12_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._ac12result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._ac12result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac12result==='win')return t('kron_ac12_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac12_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-13: Weteran bierze najmłodszego wychowanka pod skrzydła
    {id:'ac13_veteran_mentor', category:t('kron_cat_academy'),
     weight:function(){
       var vet=myPl().find(function(p){return (p.age||0)>=30;});
       var young=myPl().find(function(p){return p.fromAcademy&&(p.age||99)<=19;});
       return (vet&&young)?18:0;
     },
     title:t('kron_ac13_title'),
     body:function(){
       var vet=myPl().find(function(p){return (p.age||0)>=30;});
       var young=myPl().find(function(p){return p.fromAcademy&&(p.age||99)<=19;});
       G.kronika.flags._ac13vetId=vet?vet.id:-1;
       G.kronika.flags._ac13youngId=young?young.id:-1;
       return t('kron_ac13_body').replace('{vet}',vet?vet.name:t('kron_fallback_player')).replace('{young}',young?young.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_ac13_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac13result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_ac13_veteran_mentor')});
          [G.kronika.flags._ac13vetId,G.kronika.flags._ac13youngId].forEach(function(id){
            var p=G.players.find(function(x){return x.id===id;});
            if(p)p.form=Math.min(100,(p.form||80)+4);
          });
        },
        outcome:function(){
          if(G.kronika.flags._ac13result==='noBudget')return t('kron_ac13_c1_outcome_nobudget');
          return t('kron_ac13_c1_outcome');
        }},
       {label:t('kron_ac13_c2_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._ac13youngId;});
          if(p)p.form=Math.min(100,(p.form||80)+2);
        },
        outcome:function(){return t('kron_ac13_c2_outcome');}},
       {label:t('kron_ac13_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;addNews(t('kron_ac13_c3_news'),'club');},
        outcome:function(){return t('kron_ac13_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // AC-14: Wychowanek przewraca się efektownie na treningu
    {id:'ac14_prospect_injury_scare', category:t('kron_cat_academy'),
     weight:function(){
       var p=myPl().find(function(p){return p.fromAcademy&&(p.age||99)<=20&&!p.injured;});
       return p?16:0;
     },
     title:t('kron_ac14_title'),
     body:function(){
       var p=myPl().find(function(p){return p.fromAcademy&&(p.age||99)<=20&&!p.injured;});
       G.kronika.flags._ac14pid=p?p.id:-1;
       return t('kron_ac14_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_ac14_c1_label'),
        effect:function(){
          if(G.budget<1500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac14result='noBudget';return;}
          G.budget-=1500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:1500,bal:G.budget,season:G.season,note:t('kron_note_ac14_prospect_injury_scare')});
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){
          if(G.kronika.flags._ac14result==='noBudget')return t('kron_ac14_c1_outcome_nobudget');
          return t('kron_ac14_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac14_c2_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._ac14pid;});
          if(p)p.form=Math.min(100,(p.form||80)+3);
        },
        outcome:function(){return t('kron_ac14_c2_outcome');}},
       {label:t('kron_ac14_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._ac14pid;});
          if(p)p.form=Math.max(50,(p.form||80)-1);
        },
        outcome:function(){return t('kron_ac14_c3_outcome');}},
     ]},

    // AC-15: Inspekcja związku piłkarskiego sprawdza licencję akademii
    {id:'ac15_academy_inspection', category:t('kron_cat_academy'),
     weight:function(){return (G.academy&&G.academy.level>=1&&(G.season||1)>=2)?14:0;},
     title:t('kron_ac15_title'),
     body:function(){return t('kron_ac15_body');},
     choices:[
       {label:t('kron_ac15_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac15result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_ac15_academy_inspection')});
          G.reputation=(G.reputation||30)+7;
        },
        outcome:function(){
          if(G.kronika.flags._ac15result==='noBudget')return t('kron_ac15_c1_outcome_nobudget');
          return t('kron_ac15_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac15_c2_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._ac15result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-6);G.kronika.flags._ac15result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac15result==='win')return t('kron_ac15_c2_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac15_c2_outcome_lose').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac15_c3_label'),
        effect:function(){
          if(Math.random()<0.6){G.reputation=(G.reputation||30)+3;G.kronika.flags._ac15result2='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-2);G.kronika.flags._ac15result2='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac15result2==='win')return t('kron_ac15_c3_outcome_win');
          return t('kron_ac15_c3_outcome_lose');
        }},
     ]},

    // AC-16: Dawno odrzucony prospekt odnosi sukces gdzie indziej
    {id:'ac16_prospect_rejected_regret', category:t('kron_cat_academy'),
     weight:function(){return acRejectedCount()>=1?14:0;},
     title:t('kron_ac16_title'),
     body:function(){
       var rej=(G.academy&&G.academy.hist||[]).filter(function(h){return h.isRejected;});
       var pick=rej[Math.floor(Math.random()*rej.length)];
       G.kronika.flags._ac16name=pick?pick.name:t('kron_fallback_player');
       return t('kron_ac16_body').replace('{name}',G.kronika.flags._ac16name);
     },
     choices:[
       {label:t('kron_ac16_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+6;addNews(t('kron_ac16_c1_news'),'academy');},
        outcome:function(){return t('kron_ac16_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac16_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_ac16_c2_outcome');}},
       {label:t('kron_ac16_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+3;G.kronika.flags._ac16result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);G.kronika.flags._ac16result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac16result==='win')return t('kron_ac16_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac16_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-17: Koniec sezonu — "absolutorium" dla wychowanków
    {id:'ac17_academy_graduation_ceremony', category:t('kron_cat_academy'),
     weight:function(){
       var rl=acSeasonRoundsLeft();
       var hasGrad=myPl().some(function(p){return p.fromAcademy;});
       return (rl<=2&&rl>=0&&G.academy&&G.academy.level>=1&&hasGrad)?16:0;
     },
     title:t('kron_ac17_title'),
     body:function(){return t('kron_ac17_body');},
     choices:[
       {label:t('kron_ac17_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._ac17result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_ac17_academy_graduation_ceremony')});
          G.reputation=(G.reputation||30)+6;
          myPl().filter(function(p){return p.fromAcademy;}).forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
        },
        outcome:function(){
          if(G.kronika.flags._ac17result==='noBudget')return t('kron_ac17_c1_outcome_nobudget');
          return t('kron_ac17_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_ac17_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_ac17_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac17_c3_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-3);},
        outcome:function(){return t('kron_ac17_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // AC-18: Skauci rywala obserwują wychowanka (ŁAŃCUCH — start, patrz ac19)
    {id:'ac18_prospect_scout_interest', category:t('kron_cat_academy'),
     weight:function(){
       if(G.flags&&G.flags.academyWatch)return 0;
       return (G.rival&&acWatchCandidate())?24:0;
     },
     title:t('kron_ac18_title'),
     body:function(){
       var p=acWatchCandidate();
       return t('kron_ac18_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{rival}',G.rival?G.rival.n:t('kron_fallback_rival'));
     },
     choices:[
       {label:t('kron_ac18_c1_label'),
        effect:function(){
          var p=acWatchCandidate();
          G.flags=G.flags||{};
          if(p){
            if(G.budget>=3000){
              G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_ac18_prospect_scout_interest')});
              p.contract=Math.max(p.contract||1,3);
              G.flags.academyWatch={pid:p.id,name:p.name,season:G.season,reaction:'signed'};
            } else {
              notif(t('kron_notif_no_budget'),'err');
              G.flags.academyWatch={pid:p.id,name:p.name,season:G.season,reaction:'ignored'};
            }
          }
        },
        outcome:function(){
          if(!G.flags.academyWatch)return t('kron_ac18_c1_outcome_noplayer');
          if(G.flags.academyWatch.reaction==='signed')return t('kron_ac18_c1_outcome').replace('{name}',G.flags.academyWatch.name);
          return t('kron_ac18_c1_outcome_nobudget');
        }},
       {label:t('kron_ac18_c2_label'),
        effect:function(){
          var p=acWatchCandidate();
          G.flags=G.flags||{};
          if(p)G.flags.academyWatch={pid:p.id,name:p.name,season:G.season,reaction:'ignored'};
        },
        outcome:function(){
          if(!G.flags.academyWatch)return t('kron_ac18_c2_outcome_noplayer');
          return t('kron_ac18_c2_outcome').replace('{name}',G.flags.academyWatch.name);
        }},
       {label:t('kron_ac18_c3_label'),
        effect:function(){
          var p=acWatchCandidate();
          G.flags=G.flags||{};
          if(p)G.flags.academyWatch={pid:p.id,name:p.name,season:G.season,reaction:'hyped'};
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+8;addNews(t('kron_ac18_c3_news_win'),'academy');G.kronika.flags._ac18result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._ac18result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac18result==='win')return t('kron_ac18_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac18_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-19: Rozstrzygnięcie obserwacji wychowanka (ŁAŃCUCH — zakończenie ac18)
    {id:'ac19_prospect_scout_resolution', category:t('kron_cat_academy'),
     weight:function(){
       if(!G.flags||!G.flags.academyWatch)return 0;
       return (G.season-G.flags.academyWatch.season)>=1?26:0;
     },
     title:t('kron_ac19_title'),
     body:function(){
       var w=G.flags.academyWatch;
       var p=acFindAnywhere(w.pid);
       var seasonsAgo=G.season-w.season;
       var status;
       if(!p)status='unknown';
       else if(G.retiredPlayers&&G.retiredPlayers.some(function(x){return x.id===w.pid;}))status='retired';
       else if(p.clubId===G.myClubId)status='stayed';
       else status='left';
       G.kronika.flags._ac19status=status;
       G.kronika.flags._ac19name=w.name;
       if(status==='stayed')return t('kron_ac19_body_stayed').replace('{name}',w.name).replace('{n}',seasonsAgo);
       if(status==='left')return t('kron_ac19_body_left').replace('{name}',w.name).replace('{n}',seasonsAgo).replace('{club}',p.clubId?(ALL_CLUBS.find(function(c){return c.id===p.clubId;})||{}).n||t('kron_fallback_rival'):t('kron_fallback_rival'));
       if(status==='retired')return t('kron_ac19_body_retired').replace('{name}',w.name).replace('{n}',seasonsAgo);
       return t('kron_ac19_body_unknown').replace('{name}',w.name).replace('{n}',seasonsAgo);
     },
     choices:[
       {label:t('kron_ac19_c1_label'),
        effect:function(){G.flags.academyWatch=null;G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_ac19_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac19_c2_label'),
        effect:function(){G.flags.academyWatch=null;},
        outcome:function(){return t('kron_ac19_c2_outcome');}},
       {label:t('kron_ac19_c3_label'),
        effect:function(){
          G.flags.academyWatch=null;
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;G.kronika.flags._ac19result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._ac19result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac19result==='win')return t('kron_ac19_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac19_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // AC-20: "Co u niego?" — dawny wychowanek, dziś gdzie indziej
    {id:'ac20_academy_legacy', category:t('kron_cat_academy'),
     weight:function(){return acLegacyEntry()?18:0;},
     title:t('kron_ac20_title'),
     body:function(){
       var e=acLegacyEntry();
       return t('kron_ac20_body').replace('{name}',e?e.name:t('kron_fallback_player')).replace('{n}',e?(G.season-e.joinedSeason):'?');
     },
     choices:[
       {label:t('kron_ac20_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;addNews(t('kron_ac20_c1_news'),'academy');},
        outcome:function(){return t('kron_ac20_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_ac20_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_ac20_c2_outcome');}},
       {label:t('kron_ac20_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._ac20result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);G.kronika.flags._ac20result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._ac20result==='win')return t('kron_ac20_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_ac20_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
