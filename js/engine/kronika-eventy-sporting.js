// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_sporting (Sesja 3, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec z Sesji 1: builder-
// funkcja zwracająca świeżą tablicę co tydzień). Żadnych domknięć nad
// my/starters/bestP/kron z zakresu kronTrigger() — wyłącznie globalne
// myPl()/ovr()/G, G.kronika.flags zamiast lokalnego kron.flags. Prefiks id:
// sp (kontynuacja istniejącej numeracji sp01/05/06/08/09 — patrz PLAN
// pkt 4.3, zakres sp10-sp24). Ton: humor w stylu Hattricka.
// ══════════════════════════════════════════════════════════════════════════
function buildKronSportingEvents(){

  function spSeasonRoundsLeft(){
    if(!G.standing||!G.standing.length)return 99;
    var totalRounds=(G.standing.length-1)*2;
    var played=G.standing[0]?(G.standing[0].p||0):0;
    return totalRounds-played;
  }
  function spSortedStanding(){
    if(!G.standing)return [];
    return [...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
  }
  function spMyPos(){
    var sorted=spSortedStanding();
    var idx=sorted.findIndex(function(s){return parseInt(s.cid)===parseInt(G.myClubId);});
    return idx+1;
  }
  function spRivalHeadToHead(){
    if(!G.rival||!G.mHist)return [];
    return G.mHist.filter(function(m){
      var names=[m.hn,m.an];
      return names.indexOf(G.myClub.n)!==-1&&names.indexOf(G.rival.n)!==-1;
    });
  }
  function spLastMatch(){
    return G.mHist&&G.mHist.length?G.mHist[G.mHist.length-1]:null;
  }
  function spTraitStarter(traitId){
    return myPl().find(function(p){return p.starter&&p.traits&&p.traits.indexOf(traitId)!==-1;});
  }
  function spHotScorer(){
    return myPl().find(function(p){return (p.st&&p.st.g||0)>=8;});
  }
  function spNextRivalMatch(){
    if(!G.rival||!G.schedule)return null;
    for(var i=0;i<3;i++){
      var rnd=G.round+i;
      var m=G.schedule.find(function(x){return x.rnd===rnd&&!x.done&&(x.h===G.myClubId||x.a===G.myClubId)&&(x.h===G.rival.id||x.a===G.rival.id);});
      if(m)return m;
    }
    return null;
  }

  return [

    // SP-10: 5 lat od najlepszego zwycięstwa w historii klubu (rocznica)
    {id:'sp10_best_win_anniversary', category:t('kron_cat_sporting'),
     weight:function(){
       var bw=G.records&&G.records.bestWin;
       return (bw&&bw.season&&(G.season-bw.season===5))?26:0;
     },
     title:t('kron_sp10_title'),
     body:function(){
       var bw=G.records.bestWin;
       return t('kron_sp10_body').replace('{myg}',bw.myG).replace('{oppg}',bw.oppG).replace('{opp}',bw.opp||t('kron_fallback_rival'));
     },
     choices:[
       {label:t('kron_sp10_c1_label'),
        effect:function(){
          if(G.budget<3500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._sp10result='noBudget';return;}
          G.budget-=3500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3500,bal:G.budget,season:G.season,note:t('kron_note_sp10_best_win_anniversary')});
          G.reputation=(G.reputation||30)+7;
        },
        outcome:function(){
          if(G.kronika.flags._sp10result==='noBudget')return t('kron_sp10_c1_outcome_nobudget');
          return t('kron_sp10_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_sp10_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-2);},
        outcome:function(){return t('kron_sp10_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp10_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+9;addNews(t('kron_sp10_c3_news_win'),'ok');G.kronika.flags._sp10result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._sp10result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._sp10result==='win')return t('kron_sp10_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp10_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // SP-11: 5 lat od rekordowej ofensywy sezonu (rocznica)
    {id:'sp11_best_attack_anniversary', category:t('kron_cat_sporting'),
     weight:function(){
       var r=G.records;
       return (r&&r.maxGoalsSeason_s&&r.maxGoalsSeason>0&&(G.season-r.maxGoalsSeason_s===5))?24:0;
     },
     title:t('kron_sp11_title'),
     body:function(){return t('kron_sp11_body').replace('{n}',G.records.maxGoalsSeason);},
     choices:[
       {label:t('kron_sp11_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+6;addNews(t('kron_sp11_c1_news'),'ok');},
        outcome:function(){return t('kron_sp11_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp11_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp11_c2_outcome');}},
       {label:t('kron_sp11_c3_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._sp11result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_sp11_best_attack_anniversary')});
          G.reputation=(G.reputation||30)+9;
          myPl().forEach(function(p){if(p.pos==='NAP')p.form=Math.min(100,(p.form||80)+4);});
        },
        outcome:function(){
          if(G.kronika.flags._sp11result==='noBudget')return t('kron_sp11_c3_outcome_nobudget');
          return t('kron_sp11_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // SP-12: 5 lat od rekordowej defensywy sezonu (rocznica)
    {id:'sp12_best_defense_anniversary', category:t('kron_cat_sporting'),
     weight:function(){
       var r=G.records;
       return (r&&r.minConcededSeason_s&&r.minConcededSeason<99&&(G.season-r.minConcededSeason_s===5))?24:0;
     },
     title:t('kron_sp12_title'),
     body:function(){return t('kron_sp12_body').replace('{n}',G.records.minConcededSeason);},
     choices:[
       {label:t('kron_sp12_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+6;addNews(t('kron_sp12_c1_news'),'ok');},
        outcome:function(){return t('kron_sp12_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp12_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp12_c2_outcome');}},
       {label:t('kron_sp12_c3_label'),
        effect:function(){
          if(G.budget<4000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._sp12result='noBudget';return;}
          G.budget-=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:4000,bal:G.budget,season:G.season,note:t('kron_note_sp12_best_defense_anniversary')});
          G.reputation=(G.reputation||30)+9;
          myPl().forEach(function(p){if(p.pos==='OBR'||p.pos==='GK')p.form=Math.min(100,(p.form||80)+4);});
        },
        outcome:function(){
          if(G.kronika.flags._sp12result==='noBudget')return t('kron_sp12_c3_outcome_nobudget');
          return t('kron_sp12_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // SP-13: Presja mediów podczas serii zwycięstw
    {id:'sp13_win_streak_pressure', category:t('kron_cat_sporting'),
     weight:function(){return (G.winStreak||0)>=5?22:0;},
     title:t('kron_sp13_title'),
     body:function(){return t('kron_sp13_body').replace('{n}',G.winStreak);},
     choices:[
       {label:t('kron_sp13_c1_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_sp13_c1_outcome');}},
       {label:t('kron_sp13_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp13_c2_outcome');}},
       {label:t('kron_sp13_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+8;addNews(t('kron_sp13_c3_news_win'),'ok');G.kronika.flags._sp13result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-4);});G.kronika.flags._sp13result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._sp13result==='win')return t('kron_sp13_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp13_c3_outcome_lose');
        }},
     ]},

    // SP-14: Medialna panika podczas serii porażek
    {id:'sp14_lose_streak_media_panic', category:t('kron_cat_sporting'),
     weight:function(){return (G.loseStreak||0)>=4?24:0;},
     title:t('kron_sp14_title'),
     body:function(){return t('kron_sp14_body').replace('{n}',G.loseStreak);},
     choices:[
       {label:t('kron_sp14_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;addNews(t('kron_sp14_c1_news'),'ok');},
        outcome:function(){return t('kron_sp14_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp14_c2_label'),
        effect:function(){G.reputation=Math.max(0,(G.reputation||30)-5);},
        outcome:function(){return t('kron_sp14_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp14_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});G.kronika.flags._sp14result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-6);G.kronika.flags._sp14result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._sp14result==='win')return t('kron_sp14_c3_outcome_win');
          return t('kron_sp14_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // SP-15: Bilans historyczny z lokalnym rywalem
    {id:'sp15_rival_head_to_head', category:t('kron_cat_sporting'),
     weight:function(){return (G.rival&&spRivalHeadToHead().length>=2)?18:0;},
     title:t('kron_sp15_title'),
     body:function(){
       var h2h=spRivalHeadToHead();
       var w=0,d=0,l=0;
       h2h.forEach(function(m){
         var isH=m.hn===G.myClub.n;
         var mg=isH?m.hg:m.ag,og=isH?m.ag:m.hg;
         if(mg>og)w++;else if(mg===og)d++;else l++;
       });
       return t('kron_sp15_body').replace('{rival}',G.rival.n).replace('{w}',w).replace('{d}',d).replace('{l}',l);
     },
     choices:[
       {label:t('kron_sp15_c1_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});},
        outcome:function(){return t('kron_sp15_c1_outcome');}},
       {label:t('kron_sp15_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp15_c2_outcome');}},
       {label:t('kron_sp15_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;addNews(t('kron_sp15_c3_news').replace('{rival}',G.rival.n),'club');},
        outcome:function(){return t('kron_sp15_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // SP-16: Pogromca faworyta — wygrana z drużyną dużo wyżej w tabeli
    {id:'sp16_giant_killing', category:t('kron_cat_sporting'),
     weight:function(){
       var lm=spLastMatch();
       if(!lm)return 0;
       var isH=lm.hn===G.myClub.n;
       if(!(lm.hn===G.myClub.n||lm.an===G.myClub.n))return 0;
       var won=isH?lm.hg>lm.ag:lm.ag>lm.hg;
       if(!won)return 0;
       var sorted=spSortedStanding();
       var myIdx=sorted.findIndex(function(s){return parseInt(s.cid)===parseInt(G.myClubId);});
       var oppName=isH?lm.an:lm.hn;
       var oppIdx=sorted.findIndex(function(s){return s.n===oppName;});
       if(myIdx<0||oppIdx<0)return 0;
       return (myIdx-oppIdx>=5)?26:0;
     },
     title:t('kron_sp16_title'),
     body:function(){
       var lm=spLastMatch();
       var isH=lm.hn===G.myClub.n;
       var oppName=isH?lm.an:lm.hn;
       return t('kron_sp16_body').replace('{opp}',oppName);
     },
     choices:[
       {label:t('kron_sp16_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+10;addNews(t('kron_sp16_c1_news'),'ok');},
        outcome:function(){return t('kron_sp16_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp16_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_sp16_c2_outcome');}},
       {label:t('kron_sp16_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;G.kronika.flags._sp16result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._sp16result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._sp16result==='win')return t('kron_sp16_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp16_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // SP-17: Cecha zawodnika w centrum uwagi podczas serii zwycięstw
    {id:'sp17_trait_spotlight', category:t('kron_cat_sporting'),
     weight:function(){return ((G.winStreak||0)>=3&&spTraitStarter('pewny_siebie'))?20:0;},
     title:t('kron_sp17_title'),
     body:function(){
       var p=spTraitStarter('pewny_siebie');
       return t('kron_sp17_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_sp17_c1_label'),
        effect:function(){
          var p=spTraitStarter('pewny_siebie');
          if(p)p.form=Math.min(100,(p.form||80)+5);
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){return t('kron_sp17_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp17_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp17_c2_outcome');}},
       {label:t('kron_sp17_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._sp17result='win';}
          else{
            var p=spTraitStarter('pewny_siebie');
            if(p)p.form=Math.max(50,(p.form||80)-5);
            G.kronika.flags._sp17result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._sp17result==='win')return t('kron_sp17_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp17_c3_outcome_lose');
        }},
     ]},

    // SP-18: Przesąd o ustawieniu podczas serii zwycięstw
    {id:'sp18_formation_superstition', category:t('kron_cat_sporting'),
     weight:function(){return (G.winStreak||0)>=3?18:0;},
     title:t('kron_sp18_title'),
     body:function(){return t('kron_sp18_body').replace('{formation}',G.formation||'4-4-2');},
     choices:[
       {label:t('kron_sp18_c1_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_sp18_c1_outcome');}},
       {label:t('kron_sp18_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp18_c2_outcome');}},
       {label:t('kron_sp18_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;addNews(t('kron_sp18_c3_news'),'club');},
        outcome:function(){return t('kron_sp18_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // SP-19: Snajper w gorącej formie
    {id:'sp19_hot_scorer', category:t('kron_cat_sporting'),
     weight:function(){return spHotScorer()?20:0;},
     title:t('kron_sp19_title'),
     body:function(){
       var p=spHotScorer();
       G.kronika.flags._sp19pid=p?p.id:-1;
       return t('kron_sp19_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{n}',p&&p.st?p.st.g:0);
     },
     choices:[
       {label:t('kron_sp19_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._sp19result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_sp19_hot_scorer')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._sp19pid;});
          if(p)p.form=Math.min(100,(p.form||80)+5);
        },
        outcome:function(){
          if(G.kronika.flags._sp19result==='noBudget')return t('kron_sp19_c1_outcome_nobudget');
          return t('kron_sp19_c1_outcome');
        }},
       {label:t('kron_sp19_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp19_c2_outcome');}},
       {label:t('kron_sp19_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;addNews(t('kron_sp19_c3_news_win'),'ok');G.kronika.flags._sp19result='win';}
          else{
            var p=G.players.find(function(x){return x.id===G.kronika.flags._sp19pid;});
            if(p)p.form=Math.max(50,(p.form||80)-5);
            G.kronika.flags._sp19result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._sp19result==='win')return t('kron_sp19_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp19_c3_outcome_lose');
        }},
     ]},

    // SP-20: Zbliża się derby z lokalnym rywalem
    {id:'sp20_derby_hype', category:t('kron_cat_sporting'),
     weight:function(){return spNextRivalMatch()?22:0;},
     title:t('kron_sp20_title'),
     body:function(){return t('kron_sp20_body').replace('{rival}',G.rival?G.rival.n:t('kron_fallback_rival'));},
     choices:[
       {label:t('kron_sp20_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._sp20result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_sp20_derby_hype')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._sp20result==='noBudget')return t('kron_sp20_c1_outcome_nobudget');
          return t('kron_sp20_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_sp20_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp20_c2_outcome');}},
       {label:t('kron_sp20_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+8;addNews(t('kron_sp20_c3_news_win'),'ok');G.kronika.flags._sp20result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);G.kronika.flags._sp20result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._sp20result==='win')return t('kron_sp20_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp20_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // SP-21: Presja faworyta przed meczem pucharowym
    {id:'sp21_cup_upset_pressure', category:t('kron_cat_sporting'),
     weight:function(){
       var cupActive=!!(G._cupMatchActive||G.cupRound);
       var best=myPl().filter(function(p){return p.starter&&!p.injured;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       return (cupActive&&best&&ovr(best)>=55)?18:0;
     },
     title:t('kron_sp21_title'),
     body:function(){return t('kron_sp21_body');},
     choices:[
       {label:t('kron_sp21_c1_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_sp21_c1_outcome');}},
       {label:t('kron_sp21_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp21_c2_outcome');}},
       {label:t('kron_sp21_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._sp21result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-4);});G.kronika.flags._sp21result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._sp21result==='win')return t('kron_sp21_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp21_c3_outcome_lose');
        }},
     ]},

    // SP-22: Ciasna walka o awans w końcówce sezonu
    {id:'sp22_promotion_race_tight', category:t('kron_cat_sporting'),
     weight:function(){
       if((G.myLeague||8)<=1)return 0;
       var rl=spSeasonRoundsLeft();
       if(rl>5||rl<0)return 0;
       var myPos=spMyPos();
       if(myPos<2||myPos>4)return 0;
       var sorted=spSortedStanding();
       var promoSpot=sorted[1];
       var me=sorted[myPos-1];
       if(!promoSpot||!me)return 0;
       return (Math.abs(promoSpot.pts-me.pts)<=3)?24:0;
     },
     title:t('kron_sp22_title'),
     body:function(){return t('kron_sp22_body').replace('{pos}',spMyPos());},
     choices:[
       {label:t('kron_sp22_c1_label'),
        effect:function(){
          if(G.budget<5000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._sp22result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:t('kron_note_sp22_promotion_race_tight')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+6);});
        },
        outcome:function(){
          if(G.kronika.flags._sp22result==='noBudget')return t('kron_sp22_c1_outcome_nobudget');
          return t('kron_sp22_c1_outcome');
        }},
       {label:t('kron_sp22_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp22_c2_outcome');}},
       {label:t('kron_sp22_c3_label'),
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-5);
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+9);});
          addNews(t('kron_sp22_c3_news'),'err');
        },
        outcome:function(){return t('kron_sp22_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // SP-23: Dziwaczny, kuriozalny gol z ostatniej kolejki
    {id:'sp23_bizarre_blooper', category:t('kron_cat_sporting'),
     weight:function(){return (G.round||0)>5?12:0;},
     title:t('kron_sp23_title'),
     body:function(){return t('kron_sp23_body');},
     choices:[
       {label:t('kron_sp23_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;addNews(t('kron_sp23_c1_news'),'ok');},
        outcome:function(){return t('kron_sp23_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp23_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp23_c2_outcome');}},
       {label:t('kron_sp23_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._sp23result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._sp23result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._sp23result==='win')return t('kron_sp23_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp23_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // SP-24: Podchwytliwe pytanie na konferencji prasowej
    {id:'sp24_press_conference_gotcha', category:t('kron_cat_sporting'),
     weight:function(){return (G.round||0)>3?12:0;},
     title:t('kron_sp24_title'),
     body:function(){return t('kron_sp24_body');},
     choices:[
       {label:t('kron_sp24_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_sp24_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp24_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp24_c2_outcome');}},
       {label:t('kron_sp24_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+7;G.kronika.flags._sp24result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-6);G.kronika.flags._sp24result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._sp24result==='win')return t('kron_sp24_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_sp24_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
