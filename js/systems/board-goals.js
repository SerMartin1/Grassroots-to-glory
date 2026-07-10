(function(){
  const btn=document.getElementById('btn-dev');
  if(btn)btn.style.display=DEV_MODE?'block':'none';
})();


// ══════════════════════════════════════════════════════════
// ZARZĄD — CELE SEZONOWE (Wariant 3)
// ══════════════════════════════════════════════════════════
function genBoardGoals(){
  if(!G)return;
  if(!G.board)G.board={mainGoal:null,optGoal:null,goalsHistory:[],streakFailed:0,lastOptIds:[],transferBudget:0};
  if(!G.board.streakFailed)G.board.streakFailed=0;
  if(!G.board.lastOptIds)G.board.lastOptIds=[];
  if(!G.board.transferBudget)G.board.transferBudget=0;

  const lvl=G.myLeague||8;
  const leagueName=LEAGUE_NAMES[lvl]||t('league_fallback');
  const rep=G.reputation||30;
  const budget=G.budget;
  const rewardScale=[0,500000,200000,80000,30000,12000,5000,2000,800][lvl]||800;

  // ── Kontekst historyczny ──────────────────────────────────
  const lastHist=G.cHist&&G.cHist.length?G.cHist[G.cHist.length-1]:null;
  const prevHist=G.cHist&&G.cHist.length>=2?G.cHist[G.cHist.length-2]:null;
  if(!G.board.goalsHistory)G.board.goalsHistory=[];
  const lastGoalHist=G.board.goalsHistory.length?G.board.goalsHistory[G.board.goalsHistory.length-1]:null;
  const streak=G.board.streakFailed||0;

  const relegated=lastHist&&lastHist.leagueLevel<lvl;       // właśnie spadłeś (byłeś wyżej)
  const promoted=lastHist&&lastHist.leagueLevel>lvl;        // właśnie awansowałeś
  const lastPos=lastHist?lastHist.pos:null;
  const prevPos=prevHist?prevHist.pos:null;
  const wonTitleLast=lastPos===1;
  const wonTitleTwice=lastPos===1&&prevPos===1;
  const topTwice=lastPos&&lastPos<=3&&prevPos&&prevPos<=3;
  const highRep=rep>700;

  // ── Kary: budżet oparty na rewardScale, presja tylko na rep ─
  // ratio nagroda/kara: łatwy ~2x, średni ~2.2x, trudny ~3x, ekstremalny brak kary
  const repPressMult=streak>=3?1.6:streak>=2?1.3:1.0;
  function pb(mult){return -Math.round(rewardScale*mult/500)*500;}  // penalty budget
  function pr(base){return -Math.round(base*repPressMult);}          // penalty rep (presja tylko tutaj)
  // Efekt presji na sponsorów (zamiast mnożnika budżetu)
  const sponsorPressPenalty=streak>=2?0.05:0;  // -5% sponsorzy przy presji

  // ── Kontekst rywala — najczęstszy pogromca ────────────────
  const rival=(()=>{
    if(!G.mHist||!G.mHist.length)return null;
    const losses=G.mHist.filter(m=>{const iH=m.h===G.myClubId,iA=m.a===G.myClubId;if(!iH&&!iA)return false;return(iH&&m.hg<m.ag)||(iA&&m.ag<m.hg);});
    if(!losses.length)return null;
    const freq={};losses.forEach(m=>{const opp=m.h===G.myClubId?m.a:m.h;freq[opp]=(freq[opp]||0)+1;});
    const topId=Object.keys(freq).sort((a,b)=>freq[b]-freq[a])[0];
    return ALL_CLUBS.find(c=>c.id===parseInt(topId))||null;
  })();
  const startBudget=budget;
  const startRep=rep;

  // ── Helpery do celów ─────────────────────────────────────
  const _trophies=G.trophies||[];
  const _cupWonThisSeason=()=>_trophies.some(t=>t.type==='cup'&&t.place===1&&t.season===G.season);
  const _cupFinalThisSeason=()=>_trophies.some(t=>t.type==='cup'&&(t.place===1||t.place===2)&&t.season===G.season);
  const _cupWonLastSeason=()=>_trophies.some(t=>t.type==='cup'&&t.place===1&&t.season===G.season-1);
  const _myStanding=()=>G.standing?[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)):[];
  const _getBestDefense=()=>{const st=_myStanding();return st.length&&st.reduce((b,s)=>s.ga<b.ga?s:b,st[0]).cid===G.myClubId;};
  const _getBestAttack=()=>{const st=_myStanding();return st.length&&st.reduce((b,s)=>s.gf>b.gf?s:b,st[0]).cid===G.myClubId;};
  const _hist=()=>G.cHist&&G.cHist.length?G.cHist[G.cHist.length-1]:null;
  const _neverWonLeague=!G.cHist||!G.cHist.some(h=>h.pos===1&&h.leagueLevel===lvl);
  const _myAvgAge=()=>{const pl=myPl().filter(p=>p.starter);return pl.length?pl.reduce((s,p)=>s+(p.age||22),0)/pl.length:25;};

  // ── Pula 29 celów głównych ────────────────────────────────
  const ALL_MAIN={
    stay:{id:'stay',label:t('board_stay_label'),desc:t('board_stay_desc').replace('{league}',leagueName),
      stars:2,
      check:()=>(G.myLeague||8)<=lvl,
      reward:{budget:Math.round(rewardScale*0.3),rep:5},
      penalty:{budget:pb(0.15),rep:pr(10),sponsorPenalty:sponsorPressPenalty},
      difficulty:'easy'},
    top5:{id:'top5',label:t('board_top5_label'),desc:t('board_top5_desc').replace('{league}',leagueName),
      stars:3,
      check:()=>{const p=getBoardPos();return p>=1&&p<=5;},
      reward:{budget:Math.round(rewardScale*0.55),rep:10},
      penalty:{budget:pb(0.25),rep:pr(12),sponsorPenalty:sponsorPressPenalty},
      difficulty:'medium'},
    top3:{id:'top3',label:t('board_top3_label'),desc:t('board_top3_desc').replace('{league}',leagueName),
      stars:3,
      check:()=>{const p=getBoardPos();return p>=2&&p<=3;},
      reward:{budget:Math.round(rewardScale*0.8),rep:15},
      penalty:{budget:pb(0.35),rep:pr(15),sponsorPenalty:sponsorPressPenalty},
      difficulty:'medium'},
    top1:{id:'top1',label:t('board_top1_label'),desc:t('board_top1_desc').replace('{league}',leagueName),
      stars:4,
      check:()=>getBoardPos()===1,
      reward:{budget:Math.round(rewardScale*2),rep:25},
      penalty:{budget:pb(0.60),rep:pr(20),sponsorPenalty:sponsorPressPenalty},
      difficulty:'hard'},
    top2:{id:'top2',label:t('board_top2_label'),desc:t('board_top2_desc').replace('{league}',leagueName),
      stars:3,
      check:()=>getBoardPos()===2,
      reward:{budget:Math.round(rewardScale*1.0),rep:18},
      penalty:{budget:pb(0.30),rep:pr(14),sponsorPenalty:sponsorPressPenalty},
      difficulty:'medium'},
    top8:{id:'top8',label:t('board_top8_label'),desc:t('board_top8_desc').replace('{league}',leagueName),
      stars:2,
      check:()=>{const p=getBoardPos();return p>=1&&p<=8;},
      reward:{budget:Math.round(rewardScale*0.25),rep:5},
      penalty:{budget:pb(0.10),rep:pr(8),sponsorPenalty:sponsorPressPenalty},
      difficulty:'easy'},
    return:{id:'return',label:t('board_return_label'),desc:t('board_return_desc').replace('{league}',leagueName).replace('{target}',LEAGUE_NAMES[lvl-1]||t('board_fallback_higher_league')),
      stars:4,
      check:()=>(G.myLeague||8)<lvl,
      reward:{budget:Math.round(rewardScale*1.5),rep:30,transferBudget:Math.round(rewardScale*0.5)},
      penalty:{budget:pb(0.50),rep:pr(20),transferLock:1,sponsorPenalty:sponsorPressPenalty},
      difficulty:'hard',
      context:t('board_return_context')},
    newleague:{id:'newleague',label:t('board_newleague_label'),desc:t('board_newleague_desc').replace('{league}',LEAGUE_NAMES[lvl]||leagueName),
      stars:2,
      check:()=>(G.myLeague||8)<=lvl,
      reward:{budget:Math.round(rewardScale*0.5),rep:15},
      penalty:{budget:pb(0.15),rep:pr(15),sponsorPenalty:sponsorPressPenalty},
      difficulty:'easy',
      context:t('board_newleague_context')},
    defend:{id:'defend',label:t('board_defend_label'),desc:t('board_defend_desc').replace('{league}',leagueName),
      stars:5,
      check:()=>getBoardPos()===1,
      reward:{budget:Math.round(rewardScale*2.5),rep:35,sponsorBonus:0.05},
      penalty:{budget:pb(0.30),rep:pr(15)},
      difficulty:'hard',
      context:t('board_defend_context')},
    dominate:{id:'dominate',label:t('board_dominate_label'),desc:t('board_dominate_desc'),
      stars:5,
      check:()=>{const h=_hist();return getBoardPos()===1&&h&&h.gf>=50&&h.ga<=20;},
      reward:{budget:Math.round(rewardScale*3),rep:40,sponsorBonus:0.08},
      penalty:{budget:0,rep:pr(8)},
      difficulty:'hard',
      context:t('board_dominate_context')},
    mid:{id:'mid',label:t('board_mid_label'),desc:t('board_mid_desc').replace('{league}',leagueName),
      stars:2,
      check:()=>{const p=getBoardPos();return p>=4&&p<=10;},
      reward:{budget:Math.round(rewardScale*0.3),rep:5},
      penalty:{budget:pb(0.10),rep:pr(8),sponsorPenalty:sponsorPressPenalty},
      difficulty:'easy'},
    cup_win:{id:'cup_win',label:t('board_cup_win_label'),desc:t('board_cup_win_desc'),
      stars:4,
      check:()=>_cupWonThisSeason(),
      reward:{budget:Math.round(rewardScale*1.8),rep:30,sponsorBonus:0.05},
      penalty:{budget:pb(0.20),rep:pr(12)},
      difficulty:'hard'},
    cup_final:{id:'cup_final',label:t('board_cup_final_label'),desc:t('board_cup_final_desc'),
      stars:3,
      check:()=>_cupFinalThisSeason(),
      reward:{budget:Math.round(rewardScale*0.9),rep:18},
      penalty:{budget:pb(0.15),rep:pr(10)},
      difficulty:'medium'},
    promotion:{id:'promotion',label:t('board_promotion_label'),desc:t('board_promotion_desc').replace('{target}',LEAGUE_NAMES[lvl-1]||t('board_fallback_higher_league')),
      stars:4,
      check:()=>(G.myLeague||8)<lvl,
      reward:{budget:Math.round(rewardScale*1.6),rep:28},
      penalty:{budget:pb(0.40),rep:pr(18),sponsorPenalty:sponsorPressPenalty},
      difficulty:'hard'},
    no_relegation:{id:'no_relegation',label:t('board_no_relegation_label'),desc:t('board_no_relegation_desc').replace('{league}',leagueName),
      stars:3,
      check:()=>(G.myLeague||8)<=lvl,
      reward:{budget:Math.round(rewardScale*0.6),rep:20},
      penalty:{budget:pb(0.25),rep:pr(15),sponsorPenalty:sponsorPressPenalty},
      difficulty:'medium',
      context:t('board_no_relegation_context')},
    rep500:{id:'rep500',label:t('board_rep500_label'),desc:t('board_rep500_desc'),
      stars:3,
      check:()=>(G.reputation||0)>=500,
      reward:{budget:Math.round(rewardScale*0.8),rep:20,sponsorBonus:0.05},
      penalty:{rep:pr(10)},
      difficulty:'medium'},
    rep1000:{id:'rep1000',label:t('board_rep1000_label'),desc:t('board_rep1000_desc'),
      stars:5,
      check:()=>(G.reputation||0)>=1000,
      reward:{budget:Math.round(rewardScale*2.2),rep:60,sponsorBonus:0.12},
      penalty:{rep:pr(8)},
      difficulty:'hard'},
    rep2000:{id:'rep2000',label:t('board_rep2000_label'),desc:t('board_rep2000_desc'),
      stars:5,
      check:()=>(G.reputation||0)>=2000,
      reward:{budget:Math.round(rewardScale*3),rep:80,sponsorBonus:0.15},
      penalty:{rep:pr(8)},
      difficulty:'hard'},
    rep4000:{id:'rep4000',label:t('board_rep4000_label'),desc:t('board_rep4000_desc'),
      stars:5,
      check:()=>(G.reputation||0)>=4000,
      reward:{budget:Math.round(rewardScale*5),rep:120,sponsorBonus:0.20},
      penalty:{budget:0,rep:pr(5)},
      difficulty:'hard'},
    double:{id:'double',label:t('board_double_label'),desc:t('board_double_desc'),
      stars:5,
      check:()=>getBoardPos()===1&&_cupWonThisSeason(),
      reward:{budget:Math.round(rewardScale*4),rep:60,sponsorBonus:0.12},
      penalty:{budget:0,rep:pr(5)},
      difficulty:'hard',
      context:t('board_double_context')},
    unbeaten_season:{id:'unbeaten_season',label:t('board_unbeaten_season_label'),desc:t('board_unbeaten_season_desc'),
      stars:5,
      check:()=>!G.records||(G.records.maxLoseStreak||0)===0,
      reward:{budget:Math.round(rewardScale*3),rep:50,sponsorBonus:0.10},
      penalty:{budget:0,rep:pr(5)},
      difficulty:'hard',
      context:t('board_unbeaten_season_context')},
    rebuild:{id:'rebuild',label:t('board_rebuild_label'),desc:t('board_rebuild_desc'),
      stars:3,
      check:()=>{const p=getBoardPos();return(G.myLeague||8)<=lvl&&p<=8;},
      reward:{budget:Math.round(rewardScale*0.7),rep:20},
      penalty:{budget:pb(0.20),rep:pr(12)},
      difficulty:'medium',
      context:t('board_rebuild_context')},
    young_squad:{id:'young_squad',label:t('board_young_squad_label'),desc:t('board_young_squad_desc'),
      stars:3,
      check:()=>_myAvgAge()<24,
      reward:{budget:Math.round(rewardScale*0.6),rep:15},
      penalty:{rep:pr(8)},
      difficulty:'medium'},
    sell_profit:{id:'sell_profit',label:t('board_sell_profit_label'),desc:t('board_sell_profit_desc'),
      stars:3,
      check:()=>{const tr=G.fin&&G.fin.transfers?G.fin.transfers:[];return tr.some(t=>t.type==='sell'&&t.fee>=50000&&t.fromAcademy);},
      reward:{budget:Math.round(rewardScale*0.8),rep:18,academyBoost:true},
      penalty:{rep:pr(8)},
      difficulty:'medium'},
    first_title:{id:'first_title',label:t('board_first_title_label'),desc:t('board_first_title_desc').replace('{league}',leagueName),
      stars:4,
      check:()=>getBoardPos()===1,
      reward:{budget:Math.round(rewardScale*2.2),rep:30,sponsorBonus:0.06},
      penalty:{budget:pb(0.30),rep:pr(15)},
      difficulty:'hard',
      context:t('board_first_title_context')},
    clean_sheet_10:{id:'clean_sheet_10',label:t('board_clean_sheet_10_label'),desc:t('board_clean_sheet_10_desc'),
      stars:4,
      check:()=>{const myGK=myPl().find(p=>p.pos==='GK'&&p.starter);return myGK&&(myGK.st.cs||0)>=10;},
      reward:{budget:Math.round(rewardScale*0.9),rep:20},
      penalty:{rep:pr(10)},
      difficulty:'hard'},
    back2back_cup:{id:'back2back_cup',label:t('board_back2back_cup_label'),desc:t('board_back2back_cup_desc'),
      stars:5,
      check:()=>_cupWonThisSeason(),
      reward:{budget:Math.round(rewardScale*2.5),rep:40,sponsorBonus:0.08},
      penalty:{budget:pb(0.20),rep:pr(10)},
      difficulty:'hard',
      context:t('board_back2back_cup_context')},
    rivalry_title:{id:'rivalry_title',label:t('board_rivalry_title_label'),desc:t('board_rivalry_title_desc'),
      stars:5,
      check:()=>{
        if(!rival)return false;
        const myPos=getBoardPos();if(myPos!==1)return false;
        const vsRival=G.mHist?G.mHist.filter(m=>m.season===G.season&&((m.h===G.myClubId&&m.a===rival.id)||(m.a===G.myClubId&&m.h===rival.id))):[];
        return vsRival.length>=2&&vsRival.every(m=>(m.h===G.myClubId?m.hg>m.ag:m.ag>m.hg));
      },
      reward:{budget:Math.round(rewardScale*3),rep:45,sponsorBonus:0.08},
      penalty:{rep:pr(10)},
      difficulty:'hard',
      context:t('board_rivalry_title_context')},
    budget_growth:{id:'budget_growth',label:t('board_budget_growth_label'),desc:t('board_budget_growth_desc'),
      stars:4,
      check:()=>G.budget>=(startBudget*2),
      reward:{budget:Math.round(rewardScale*1.0),rep:15,sponsorBonus:0.05},
      penalty:{rep:pr(10)},
      difficulty:'hard'},
    top_league:{id:'top_league',label:t('board_top_league_label'),desc:t('board_top_league_desc'),
      stars:5,
      check:()=>(G.myLeague||8)<=1,
      reward:{budget:Math.round(rewardScale*5),rep:80,sponsorBonus:0.15},
      penalty:{budget:0,rep:pr(5)},
      difficulty:'hard',
      context:t('board_top_league_context')},
    promotion_direct:{id:'promotion_direct',label:t('board_promotion_direct_label'),desc:t('board_promotion_direct_desc').replace('{target}',LEAGUE_NAMES[lvl-1]||t('board_fallback_higher_league')),
      stars:5,
      check:()=>(G.myLeague||8)<lvl&&getBoardPos()===1,
      reward:{budget:Math.round(rewardScale*2),rep:35,sponsorBonus:0.06},
      penalty:{budget:pb(0.45),rep:pr(20),sponsorPenalty:sponsorPressPenalty},
      difficulty:'hard'},
  };

  // ── Algorytm doboru puli celów głównych ──────────────────
  let pool=[];
  if(streak>=3){
    pool=[lvl===8?ALL_MAIN.mid:ALL_MAIN.stay];
    G.board.pressureForced=true;
  } else if(relegated){
    pool=[ALL_MAIN.return,ALL_MAIN.top3,ALL_MAIN.top5,ALL_MAIN.rebuild];
    G.board.pressureForced=false;
  } else if(promoted){
    pool=[ALL_MAIN.newleague,ALL_MAIN.top5,ALL_MAIN.top3,ALL_MAIN.cup_final];
    G.board.pressureForced=false;
  } else if(wonTitleTwice){
    pool=[ALL_MAIN.dominate,ALL_MAIN.defend,ALL_MAIN.top1,ALL_MAIN.double,ALL_MAIN.rep4000];
    G.board.pressureForced=false;
  } else if(wonTitleLast){
    pool=[ALL_MAIN.defend,ALL_MAIN.top1,ALL_MAIN.top3,ALL_MAIN.double];
    G.board.pressureForced=false;
  } else if(topTwice){
    pool=[ALL_MAIN.top1,ALL_MAIN.top3,ALL_MAIN.top5,ALL_MAIN.cup_win];
    G.board.pressureForced=false;
  } else if(_cupWonLastSeason()){
    pool=[ALL_MAIN.back2back_cup,ALL_MAIN.cup_win,ALL_MAIN.top1,ALL_MAIN.top3];
    G.board.pressureForced=false;
  } else if(highRep&&lvl<=3){
    pool=[ALL_MAIN.dominate,ALL_MAIN.top1,ALL_MAIN.top3,ALL_MAIN.double,ALL_MAIN.rep1000,ALL_MAIN.rep2000];
    G.board.pressureForced=false;
  } else if(_neverWonLeague&&rep>200){
    pool=[ALL_MAIN.first_title,ALL_MAIN.top1,ALL_MAIN.top3,ALL_MAIN.cup_win,ALL_MAIN.rep500];
    G.board.pressureForced=false;
  } else if(lvl>=6){
    pool=[ALL_MAIN.mid,ALL_MAIN.top3,ALL_MAIN.stay,ALL_MAIN.cup_final];
    G.board.pressureForced=false;
  } else {
    pool=lvl===8
      ?[ALL_MAIN.mid,ALL_MAIN.top3,ALL_MAIN.top1,ALL_MAIN.cup_final]
      :[ALL_MAIN.stay,ALL_MAIN.top3,ALL_MAIN.top1,ALL_MAIN.cup_win];
    G.board.pressureForced=false;
  }
  G.board.mainOptions=pool;

  // ── Algorytm doboru puli celów głównych — już powyżej ────

  // ── Pula 34 celów pomocniczych ────────────────────────────
  const ALL_OPT=[
    // — ATAK —
    {id:'goals40',label:t('board_goals40_label'),desc:t('board_goals40_desc'),
     check:()=>{const h=_hist();return!!(h&&h.gf>=40);},
     reward:{budget:Math.round(rewardScale*0.3),sponsorBonus:0.1},penalty:{rep:-8}},
    {id:'goals50',label:t('board_goals50_label'),desc:t('board_goals50_desc'),
     check:()=>{const h=_hist();return!!(h&&h.gf>=50);},
     reward:{budget:Math.round(rewardScale*0.5),rep:10,sponsorBonus:0.1},penalty:{rep:-8}},
    {id:'win_by3',label:t('board_win_by3_label'),desc:t('board_win_by3_desc'),
     check:()=>{
       const s=G.season;
       const bigWins=(G.mHist||[]).filter(m=>m.season===s&&((m.h===G.myClubId&&m.hg-m.ag>=3)||(m.a===G.myClubId&&m.ag-m.hg>=3)));
       return bigWins.length>=5;},
     reward:{budget:Math.round(rewardScale*0.35),rep:10},penalty:{rep:-8}},
    {id:'best_attack',label:t('board_best_attack_label'),desc:t('board_best_attack_desc'),
     check:()=>_getBestAttack(),
     reward:{budget:Math.round(rewardScale*0.4),rep:12,sponsorBonus:0.05},penalty:{rep:-8}},
    {id:'topscorer',label:t('board_topscorer_label'),desc:t('board_topscorer_desc'),
     check:()=>{
       if(!G.allTimeStats||!G.allTimeStats.players)return false;
       const myIds=new Set(myPl().map(p=>p.id));
       let best=null,bestG=0;
       Object.entries(G.allTimeStats.players).forEach(([id,s])=>{if((s.goals||0)>bestG){bestG=s.goals;best=parseInt(id);}});
       return best!==null&&myIds.has(best)&&bestG>0;},
     reward:{budget:Math.round(rewardScale*0.45),rep:15,topScorerBonus:true},penalty:{rep:-8}},
    {id:'top_assist',label:t('board_top_assist_label'),desc:t('board_top_assist_desc'),
     check:()=>{
       if(!G.allTimeStats||!G.allTimeStats.players)return false;
       const myIds=new Set(myPl().map(p=>p.id));
       let best=null,bestA=0;
       Object.entries(G.allTimeStats.players).forEach(([id,s])=>{if((s.assists||0)>bestA){bestA=s.assists;best=parseInt(id);}});
       return best!==null&&myIds.has(best)&&bestA>0;},
     reward:{budget:Math.round(rewardScale*0.35),rep:12},penalty:{rep:-8}},
    {id:'youth_scorer',label:t('board_youth_scorer_label'),desc:t('board_youth_scorer_desc'),
     check:()=>{
       const st=G.allTimeStats&&G.allTimeStats.players;
       return myPl().some(p=>p.fromAcademy&&st&&st[p.id]&&(st[p.id].goals||0)>=10);},
     reward:{budget:Math.round(rewardScale*0.3),rep:15,academyBoost:true},penalty:{rep:-8}},
    {id:'u21_hatrick',label:t('board_u21_hatrick_label'),desc:t('board_u21_hatrick_desc'),
     check:()=>{
       const s=G.season;
       return myPl().some(p=>p.age<=21&&G.mHist&&G.mHist.some(m=>m.season===s&&m.g&&m.g.filter(g=>g.s===p.id).length>=3));},
     reward:{budget:Math.round(rewardScale*0.4),rep:15},penalty:{rep:-8}},
    // — OBRONA —
    {id:'concede25',label:t('board_concede25_label'),desc:t('board_concede25_desc'),
     check:()=>{const h=_hist();return!!(h&&h.ga<25);},
     reward:{budget:Math.round(rewardScale*0.3),rep:10},penalty:{rep:-8}},
    {id:'concede15',label:t('board_concede15_label'),desc:t('board_concede15_desc'),
     check:()=>{const h=_hist();return!!(h&&h.ga<15);},
     reward:{budget:Math.round(rewardScale*0.55),rep:18},penalty:{rep:-8}},
    {id:'best_defense',label:t('board_best_defense_label'),desc:t('board_best_defense_desc'),
     check:()=>_getBestDefense(),
     reward:{budget:Math.round(rewardScale*0.4),rep:14},penalty:{rep:-8}},
    {id:'clean_sheets8',label:t('board_clean_sheets8_label'),desc:t('board_clean_sheets8_desc'),
     check:()=>{const myGK=myPl().find(p=>p.pos==='GK'&&p.starter);return!!(myGK&&(myGK.st.cs||0)>=8);},
     reward:{budget:Math.round(rewardScale*0.35),rep:12},penalty:{rep:-8}},
    {id:'no_red_cards',label:t('board_no_red_cards_label'),desc:t('board_no_red_cards_desc'),
     check:()=>{const s=G.season;return!(G.mHist||[]).some(m=>m.season===s&&m.c&&m.c.some(c=>c.t==='r'&&myPl().some(p=>p.id===c.id)));},
     reward:{budget:Math.round(rewardScale*0.25),rep:10},penalty:{rep:-5}},
    {id:'home_unbeaten',label:t('board_home_unbeaten_label'),desc:t('board_home_unbeaten_desc'),
     check:()=>{
       const s=G.season;
       const homeLosses=(G.mHist||[]).filter(m=>m.season===s&&m.h===G.myClubId&&m.hg<m.ag);
       return homeLosses.length===0;},
     reward:{budget:Math.round(rewardScale*0.4),rep:14},penalty:{rep:-8}},
    // — FORMA / SERIA —
    {id:'winstreak5',label:t('board_winstreak5_label'),desc:t('board_winstreak5_desc'),
     check:()=>!!(G.records&&G.records.maxWinStreak>=5),
     reward:{budget:Math.round(rewardScale*0.25),rep:10},penalty:{rep:-8}},
    {id:'winstreak8',label:t('board_winstreak8_label'),desc:t('board_winstreak8_desc'),
     check:()=>!!(G.records&&G.records.maxWinStreak>=8),
     reward:{budget:Math.round(rewardScale*0.5),rep:18},penalty:{rep:-8}},
    {id:'unbeaten10',label:t('board_unbeaten10_label'),desc:t('board_unbeaten10_desc'),
     check:()=>!!(G.records&&G.records.maxUnbeatenStreak>=10),
     reward:{budget:Math.round(rewardScale*0.35),rep:15},penalty:{rep:-8}},
    {id:'away_form',label:t('board_away_form_label'),desc:t('board_away_form_desc'),
     check:()=>{
       const s=G.season;
       const awayW=(G.mHist||[]).filter(m=>m.season===s&&m.a===G.myClubId&&m.ag>m.hg);
       return awayW.length>=6;},
     reward:{budget:Math.round(rewardScale*0.4),rep:14},penalty:{rep:-8}},
    {id:'nolosestreak',label:t('board_nolosestreak_label'),desc:t('board_nolosestreak_desc'),
     check:()=>!G.records||!G.records.maxLoseStreak||(G.records.maxLoseStreak<=3),
     reward:{budget:Math.round(rewardScale*0.3),rep:10},penalty:{rep:-8}},
    // — FINANSE / REPUTACJA —
    {id:'budget',label:t('board_budget_label'),desc:t('board_budget_desc'),
     check:()=>G.budget>startBudget,
     reward:{budget:Math.round(rewardScale*0.4),rep:5},penalty:{rep:-8}},
    {id:'budget_double',label:t('board_budget_double_label'),desc:t('board_budget_double_desc'),
     check:()=>G.budget>=(startBudget*2),
     reward:{budget:Math.round(rewardScale*0.7),rep:12},penalty:{rep:-8}},
    {id:'rep',label:t('board_rep_label'),desc:t('board_rep_desc'),
     check:()=>(G.reputation||30)>=startRep+20,
     reward:{rep:15,sponsorBonus:0.05},penalty:{rep:-5}},
    {id:'rep_jump30',label:t('board_rep_jump30_label'),desc:t('board_rep_jump30_desc'),
     check:()=>(G.reputation||30)>=startRep+30,
     reward:{rep:20,sponsorBonus:0.07},penalty:{rep:-5}},
    {id:'transferprofit',label:t('board_transferprofit_label'),desc:t('board_transferprofit_desc'),
     check:()=>{const tr=G.fin&&G.fin.transfers?G.fin.transfers:[];const bal=tr.reduce((s,t)=>s+(t.type==='sell'?(t.fee||0):-(t.fee||0)),0);return bal>0;},
     reward:{budget:Math.round(rewardScale*0.35),rep:8},penalty:{rep:-8}},
    {id:'sell_big',label:t('board_sell_big_label'),desc:t('board_sell_big_desc'),
     check:()=>{const tr=G.fin&&G.fin.transfers?G.fin.transfers:[];return tr.some(t=>t.type==='sell'&&t.fee>=(t.baseValue||0)*3&&(t.baseValue||0)>0);},
     reward:{budget:Math.round(rewardScale*0.5),rep:12},penalty:{rep:-8}},
    // — ZAWODNICY / SKŁAD —
    {id:'youngtalents',label:t('board_youngtalents_label'),desc:t('board_youngtalents_desc'),
     check:()=>{const st=G.allTimeStats&&G.allTimeStats.players;return myPl().filter(p=>p.age<=21&&st&&st[p.id]&&(st[p.id].matches||0)>=10).length>=3;},
     reward:{budget:Math.round(rewardScale*0.2),rep:10},penalty:{rep:-8}},
    {id:'ironxi',label:t('board_ironxi_label'),desc:t('board_ironxi_desc'),
     check:()=>{const st=G.allTimeStats&&G.allTimeStats.players;return myPl().filter(p=>st&&st[p.id]&&(st[p.id].matches||0)>=20).length>=7;},
     reward:{rep:15,formBonus:5},penalty:{rep:-5}},
    {id:'scout_find',label:t('board_scout_find_label'),desc:t('board_scout_find_desc'),
     check:()=>myPl().some(p=>ovr(p)>=70&&(p._discoveredByScount||p.scoutFind)),
     reward:{budget:Math.round(rewardScale*0.3),rep:10},penalty:{rep:-8}},
    {id:'transfer_star',label:t('board_transfer_star_label'),desc:t('board_transfer_star_desc'),
     check:()=>myPl().some(p=>p._buyOvr&&ovr(p)>=(p._buyOvr+10)),
     reward:{budget:Math.round(rewardScale*0.35),rep:12},penalty:{rep:-8}},
    // — AKADEMIA —
    {id:'academy',label:t('board_academy_label'),desc:t('board_academy_desc'),
     check:()=>{const st=G.allTimeStats&&G.allTimeStats.players;return myPl().some(p=>p.fromAcademy&&st&&st[p.id]&&(st[p.id].matches||0)>=10);},
     reward:{budget:Math.round(rewardScale*0.25),rep:12,academyBoost:true},penalty:{rep:-8}},
    // — KIBICE / STADION —
    {id:'attendance',label:t('board_attendance_label'),desc:t('board_attendance_desc'),
     check:()=>(G.frequency||50)>=80,
     reward:{budget:Math.round(rewardScale*0.3),ticketBonus:true},penalty:{rep:-8}},
    // — PUCHAR —
    {id:'cup_goals10',label:t('board_cup_goals10_label'),desc:t('board_cup_goals10_desc'),
     check:()=>{const s=G.season;const cupGoals=(G.mHist||[]).filter(m=>m.season===s&&m._isCup&&((m.h===G.myClubId)||(m.a===G.myClubId))).reduce((sum,m)=>{const myG=m.h===G.myClubId?m.hg:m.ag;return sum+myG;},0);return cupGoals>=10;},
     reward:{budget:Math.round(rewardScale*0.4),rep:12},penalty:{rep:-8}},
    // — RYWALIZACJA —
    ...(rival?[{id:'rewanz',label:t('board_rewanz_label').replace('{rival}',rival.n),desc:t('board_rewanz_desc').replace('{rival}',rival.n),
     check:()=>{
       if(!G.mHist)return false;
       const season=G.season;
       const vs=G.mHist.filter(m=>m.season===season&&((m.h===G.myClubId&&m.a===rival.id)||(m.a===G.myClubId&&m.h===rival.id)));
       if(vs.length<2)return false;
       return vs.every(m=>{const myH=m.h===G.myClubId;return myH?m.hg>m.ag:m.ag>m.hg;});},
     reward:{budget:Math.round(rewardScale*0.4),rep:12},penalty:{rep:-8}}]:[]),
  ];

  // Losuj 2 z puli, wykluczając ostatnie 2 użyte id
  const lastIds=G.board.lastOptIds||[];
  const eligible=ALL_OPT.filter(o=>!lastIds.includes(o.id));
  const pool2=eligible.length>=2?eligible:ALL_OPT; // fallback jeśli za mało
  G.board.optOptions=pool2.sort(()=>Math.random()-0.5).slice(0,2);

  G.board.mainGoal=null;
  G.board.optGoal=null;
  G.board.season=G.season;
  G.board.leagueLvlOnStart=lvl;
  G.board.budgetOnStart=budget;
  G.board.repOnStart=rep;
}

function getBoardPos(){
  if(!G||!G.standing)return 99;
  const sorted=[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
  return sorted.findIndex(s=>parseInt(s.cid)===parseInt(G.myClubId))+1;
}

function selectMainGoal(id){
  if(!G||!G.board)return;
  if(G.board.mainGoal){notif(t('board_notif_main_already'),'err');return;}
  const _id=typeof id==='string'?id:(id&&id.dataset?id.dataset.id:id);
  const g=G.board.mainOptions.find(x=>x.id===_id);
  if(!g)return;
  G.board.mainGoal=g;
  addNews(t('news_board_goal').replace('{label}',g.label).replace('{desc}',g.desc),'club');
  notif(t('board_notif_main_set').replace('{label}',g.label),'ok');
  fillBoard();
}

function selectOptGoal(id){
  if(!G||!G.board)return;
  if(G.board.optGoal){notif(t('board_notif_opt_already'),'err');return;}
  const _id=typeof id==='string'?id:(id&&id.dataset?id.dataset.id:id);
  const g=G.board.optOptions.find(x=>x.id===_id);
  if(!g)return;
  G.board.optGoal=g;
  notif(t('board_notif_opt_set').replace('{label}',g.label),'ok');
  fillBoard();
}

function checkBoardGoals(){
  if(!G||!G.board)return;
  const b=G.board;
  if(!b.mainGoal)return;
  const mainDone=b.mainGoal.check();
  const optDone=b.optGoal?b.optGoal.check():null;
  const streak=b.streakFailed||0;

  // ── CEL GŁÓWNY ────────────────────────────────────────────
  if(mainDone){
    b.streakFailed=0;
    const rw=b.mainGoal.reward;
    let msg='';
    if(rw.budget){G.budget+=rw.budget;msg+=' +'+fmt(rw.budget);}
    if(rw.rep){changeReputation(rw.rep,b.mainGoal.label);msg+=' +Rep '+rw.rep;}
    if(rw.sponsorBonus){if(!b.sponsorBonus)b.sponsorBonus=0;b.sponsorBonus+=rw.sponsorBonus;msg+=t('board_msg_sponsors').replace('{n}','+'+Math.round(rw.sponsorBonus*100));}
    if(rw.transferBudget){if(!b.transferBudget)b.transferBudget=0;b.transferBudget+=rw.transferBudget;msg+=t('board_msg_transfer_pool').replace('{val}',fmt(rw.transferBudget));}
    if(streak>=2){changeReputation(10,t('rep_reason_pressure_relief'));msg+=t('board_msg_rep_relief');}
    addNews(t('news_board_goal_done').replace('{label}',b.mainGoal.label).replace('{msg}',msg),'club');
    notif(t('board_notif_done'),'ok');
  } else {
    b.streakFailed=(b.streakFailed||0)+1;
    const pn=b.mainGoal.penalty;
    let msg='';
    if(pn.budget&&pn.budget<0){G.budget=Math.max(0,G.budget+pn.budget);msg+=' '+fmt(pn.budget);}
    if(pn.rep){changeReputation(pn.rep,b.mainGoal.label);msg+=' Rep '+pn.rep;}
    if(pn.transferLock){b.transferLockSeasons=(b.transferLockSeasons||0)+pn.transferLock;msg+=t('board_msg_transfer_lock').replace('{n}',pn.transferLock);}
    if(pn.sponsorPenalty){if(!b.sponsorPenalty)b.sponsorPenalty=0;b.sponsorPenalty+=pn.sponsorPenalty;msg+=t('board_msg_sponsors').replace('{n}','-'+Math.round(pn.sponsorPenalty*100));}
    const newStreak=b.streakFailed;
    if(newStreak>=2)msg+=t('board_msg_pressure').replace('{n}',newStreak);
    addNews(t('news_board_goal_failed').replace('{label}',b.mainGoal.label).replace('{msg}',msg),'club');
    notif(t('board_notif_failed'),'err');
  }

  // ── CEL OPCJONALNY ────────────────────────────────────────
  if(b.optGoal){
    if(optDone){
      const rw=b.optGoal.reward;
      let omsg='';
      if(rw.budget){G.budget+=rw.budget;omsg+=' +'+fmt(rw.budget);}
      if(rw.rep){changeReputation(rw.rep,b.optGoal.label);omsg+=' +Rep '+rw.rep;}
      if(rw.sponsorBonus){if(!b.sponsorBonus)b.sponsorBonus=0;b.sponsorBonus+=rw.sponsorBonus;omsg+=t('board_msg_sponsors').replace('{n}','+'+Math.round(rw.sponsorBonus*100));}
      if(rw.ticketBonus){if(!b.ticketBonus)b.ticketBonus=0;b.ticketBonus+=0.1;omsg+=t('board_msg_tickets');}
      if(rw.formBonus){myPl().forEach(p=>{p.form=Math.min(100,(p.form||70)+rw.formBonus);});omsg+=t('board_msg_form').replace('{n}',rw.formBonus);}
      if(rw.academyBoost){if(G.academy)G.academy.boostSeasons=(G.academy.boostSeasons||0)+1;omsg+=t('board_msg_academy');}
      if(rw.topScorerBonus){const best=myPl().sort((a,b2)=>(b2.st.g||0)-(a.st.g||0))[0];if(best){best.value=Math.round(best.value*1.2/500)*500;omsg+=t('board_msg_valuation').replace('{name}',best.name.split(' ')[0]);}}
      if(rw.transferBudget){if(!b.transferBudget)b.transferBudget=0;b.transferBudget+=rw.transferBudget;}
      addNews(t('news_board_bonus_done').replace('{label}',b.optGoal.label).replace('{msg}',omsg),'club');
    } else {
      // Kara za wybrany i niespełniony cel opcjonalny
      const pn=b.optGoal.penalty||{};
      if(pn.rep){changeReputation(pn.rep,b.optGoal.label);}
      addNews(t('news_board_bonus_failed').replace('{label}',b.optGoal.label).replace('{msg}',pn.rep?t('news_board_rep_suffix').replace('{n}',pn.rep):''),'club');
    }
    // Zapamiętaj id opcjonalnego by nie powtarzać
    if(!b.lastOptIds)b.lastOptIds=[];
    b.lastOptIds.push(b.optGoal.id);
    if(b.lastOptIds.length>2)b.lastOptIds.shift();
  }

  // ── HISTORIA ─────────────────────────────────────────────
  if(!b.goalsHistory)b.goalsHistory=[];
  b.goalsHistory.push({
    season:G.season,
    mainGoal:b.mainGoal.label,
    mainGoalId:b.mainGoal.id,
    mainDone,
    streakAfter:b.streakFailed,
    optGoal:b.optGoal?b.optGoal.label:null,
    optDone:b.optGoal?optDone:null,
  });
  b.mainGoal=null;b.optGoal=null;
}

function boardTab(tab,btn){
  document.querySelectorAll('#p-board .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['cele','historia'].forEach(tr=>{const e=document.getElementById('board-'+tr);if(e)e.classList.remove('on');});
  const e=document.getElementById('board-'+tab);if(e)e.classList.add('on');
  if(tab==='cele')renderBoardCele();
  else renderBoardHistoria();
}

// ══════════════════════════════════════════════
// PANEL ŚWIAT — RYNEK ŚWIATA
// ══════════════════════════════════════════════
