const CUP_WEEKS=[5,10,15,21,27,33]; // tygodnie rund 1-6
const CUP_ROUND_NAMES=[t('cup_rlabel_r1'),t('cup_rlabel_r2'),t('cup_rlabel_qf'),t('cup_rlabel_sf1'),t('cup_rlabel_sf2'),t('cup_rlabel_final')];
// Poprawka: rundy 0-5 → 64→32→16→8→4→2→1
function _cupRoundLabels(){
  return [t('cup_rlabel_r1'),t('cup_rlabel_r2'),t('cup_rlabel_qf'),t('cup_rlabel_sf1'),t('cup_rlabel_sf2'),t('cup_rlabel_final')];
}
const CUP_ROUND_LABELS=new Proxy([],{get(target,prop){const arr=_cupRoundLabels();return arr[prop];}});
const CUP_REWARDS=[
  {rnd:0,labelKey:'cup_reward_r1',cash:5000,rep:2},
  {rnd:1,labelKey:'cup_reward_r2',cash:15000,rep:4},
  {rnd:2,labelKey:'cup_reward_qf',cash:50000,rep:8},
  {rnd:3,labelKey:'cup_reward_sf',cash:150000,rep:15},
  {rnd:4,labelKey:'cup_reward_sf',cash:150000,rep:15},
  {rnd:5,labelKey:'cup_reward_finalist',cash:400000,rep:25},
];
CUP_REWARDS.forEach(r=>Object.defineProperty(r,'label',{get(){return t(r.labelKey);},enumerable:true}));
const CUP_REWARD_WIN={cash:1000000,rep:50};
Object.defineProperty(CUP_REWARD_WIN,'label',{get(){return t('cup_reward_win');},enumerable:true});
function grantCupReward(rIdx,won){
  if(!won||!G)return;
  const isFinale=rIdx===5;
  const reward=isFinale?CUP_REWARD_WIN:(CUP_REWARDS[rIdx]||null);
  if(!reward)return;
  G.budget+=reward.cash;
  changeReputation(reward.rep,t('cup_note_prefix')+reward.label);
  if(!G.fin)G.fin={};
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:reward.cash,cost:0,bal:G.budget,note:t('cup_note_prefix')+reward.label});
  addNews(t('news_cup_reward_round').replace('{label}',reward.label).replace('{cash}',fmt(reward.cash)).replace('{rep}',reward.rep),'budget');
}

function initCup(){
  if(!G||!G.leagues||!G.allStandings)return;
  const USE_OVR=G.round<5; // za mało kolejek — standings nie miarodajne
  const participants=[];
  G.leagues.forEach(lg=>{
    const lvl=lg.level;
    let top8;
    if(USE_OVR){
      // Sortuj kluby po średnim OVR składu
      const clubs=lg.clubs||[];
      const ranked=clubs.map(c=>{
        const sq=G.players.filter(p=>p.clubId===c.id);
        const avgOvr=sq.length?Math.round(sq.reduce((s,p)=>s+ovr(p),0)/sq.length):0;
        return{cid:parseInt(c.id),name:c.n,league:lvl,pts:avgOvr};
      }).sort((a,b)=>b.pts-a.pts);
      top8=ranked.slice(0,8);
    } else {
      const st=(lvl===G.myLeague?G.standing:(G.allStandings&&G.allStandings[lvl]))||[];
      const sorted=[...st].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
      top8=sorted.slice(0,8).map(entry=>{
        const club=ALL_CLUBS.find(c=>parseInt(c.id)===parseInt(entry.cid));
        return{cid:parseInt(entry.cid),name:club?club.n:t('cup_fallback_club').replace('{id}',entry.cid),league:lvl,pts:entry.pts};
      });
    }
    participants.push(...top8);
  });
  // Losowanie: podział na pary (64 drużyn → 32 meczów w rundzie 1)
  // Zasiew: najlepsze drużyny z Ekstraklasy (liga 1) NIE spotkają się w R1
  const shuffled=shuffle64(participants);
  const r1matches=[];
  for(let i=0;i<32;i++){
    r1matches.push({h:shuffled[i*2],a:shuffled[i*2+1],hg:null,ag:null,done:false});
  }
  G.cup={
    season:G.season,
    active:true,
    currentRound:0, // 0=R1..5=Finał
    rounds:[r1matches,[],[],[],[],[]],
    eliminated:{}, // cid→true
    winner:null,
    myRound:-1, // ostatnia runda w której gracz grał
  };
  addNews(t('news_cup_started').replace('{n}',participants.length).replace('{week}',CUP_WEEKS[0]),'ok');
  G.news[0].noRecap=true; // zapowiedź startu Pucharu (sezon), nie wydarzenie z historii klubu — pomiń w retrospektywie sezonu (season-summary.js)
  updateCupTileBadge();
}

function shuffle64(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function simCupRound(){
  if(!G||!G.cup||!G.cup.active)return;
  const rIdx=G.cup.currentRound;
  if(rIdx>5)return;
  const matches=G.cup.rounds[rIdx]||[];
  const myId=G.myClubId;
  let myMatch=null;

  matches.forEach(m=>{
    if(m.done)return;
    const isMyMatch=(m.h.cid===myId||m.a.cid===myId);
    if(isMyMatch){myMatch=m;return;} // mecz gracza — pomijamy, gracz zagra interaktywnie
    // Symulacja AI
    const hOvr=clubAvgOvr(m.h.cid);
    const aOvr=clubAvgOvr(m.a.cid);
    const hPow=hOvr*1.05,aPow=aOvr;
    const tot=r(1,5)+r(0,3);
    const hG=Math.round(tot*hPow/(hPow+aPow)*(0.85+Math.random()*0.30));
    const aG=Math.max(0,tot-hG);
    // Dogrywka przy remisie — losuj karnego
    let fhG=hG,faG=aG;
    if(hG===aG){if(Math.random()<0.5)fhG++;else faG++;}
    m.hg=fhG;m.ag=faG;m.done=true;
    const winner=fhG>faG?m.h:m.a;
    const loser=fhG>faG?m.a:m.h;
    G.cup.eliminated[loser.cid]=true;
    m.winnerId=winner.cid;
    // Zdarzenia meczu (gole/kartki/oceny) — do wspólnej historii (showMatchDetail/openClubModal),
    // ten sam kształt co G._mHistAI w simOthers() (match-post.js), patrz push niżej.
    const matchEvtsCup=[],matchCardsCup=[],matchRatingsCup={};
    // Aktualizuj cupSt dla zawodników AI obu drużyn
    [m.h.cid,m.a.cid].forEach(cid=>{
      const isH=cid===m.h.cid;
      const myG=isH?fhG:faG,oppG=isH?faG:fhG;
      const won=myG>oppG,lost=myG<oppG;
      const teamPls=G.players.filter(p=>p.clubId===cid&&p.starter);
      const avgStr4=teamPls.reduce((s,p)=>s+playerStr(p),0)/Math.max(1,teamPls.length);
      // Losowe gole między atakujących
      const scorers=teamPls.filter(p=>p.pos==='NAP'||p.pos==='POL');
      for(let g=0;g<myG;g++){
        if(!scorers.length)break;
        const sc=scorers[Math.floor(Math.random()*scorers.length)];
        const ass=teamPls.filter(p=>p.id!==sc.id);
        const assP=ass.length&&Math.random()<0.7?ass[Math.floor(Math.random()*ass.length)]:null;
        if(!sc.cupSt)sc.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
        if(!sc.cupSt.g)sc.cupSt.g=0;sc.cupSt.g++;
        if(assP){if(!assP.cupSt)assP.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!assP.cupSt.a)assP.cupSt.a=0;assP.cupSt.a++;}
        matchEvtsCup.push({m:r(3,88),s:sc.id,a:assP?assP.id:null,h:isH?1:0});
      }
      teamPls.forEach(p=>{
        if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
        p.cupSt.m++;
        // GK cs/ga
        if(p.pos==='GK'){if(!p.cupSt.ga)p.cupSt.ga=0;if(!p.cupSt.cs)p.cupSt.cs=0;p.cupSt.ga+=oppG;if(oppG===0)p.cupSt.cs++;}
        // Losowa ocena
        const strRatio4=playerStr(p)/Math.max(1,avgStr4);
        let cupRat=Math.min(8.5,Math.max(4.0,strRatio4*6.5));
        if(won)cupRat+=0.2;else if(lost)cupRat-=0.2;
        cupRat+=((Math.random()-0.5)*1.0);
        cupRat=Math.max(3.0,Math.min(10.0,Math.round(cupRat*10)/10));
        if(!p.cupSt.ratings)p.cupSt.ratings=[];
        p.cupSt.ratings.push(cupRat);
        matchRatingsCup[p.id]=cupRat;
        // Kartki — te same bazowe prawdopodobieństwa co w simOthers() (match-post.js)
        if(Math.random()<0.05){if(!p.cupSt.yk)p.cupSt.yk=0;p.cupSt.yk++;matchCardsCup.push({m:r(5,85),id:p.id,t:'y'});}
        if(Math.random()<0.007){if(!p.cupSt.rk)p.cupSt.rk=0;p.cupSt.rk++;matchCardsCup.push({m:r(10,85),id:p.id,t:'r'});}
      });
    });
    // Zapis do podglądu w karcie klubu (WYNIKI) + linku z widoku Puchar→Drzewko — runtime-only,
    // ten sam mechanizm co mecze ligowe AI-AI (patrz G._mHistAI w simOthers(), match-post.js).
    if(!G._mHistAI)G._mHistAI=[];
    G._mHistAI.push({rnd:CUP_WEEKS[rIdx]||(rIdx*5+5),season:G.season,hn:m.h.name,an:m.a.name,hg:fhG,ag:faG,g:matchEvtsCup,c:matchCardsCup,r:matchRatingsCup,_isCup:true,cupRound:rIdx});
    m.mHistIdx=G._mHistAI.length-1;
    m.mHistSrc='ai';
  });

  // Mecz gracza — jeśli gracz jest w tej rundzie i jeszcze nie zagrał
  if(myMatch&&!myMatch.done){
    // Gracz zagra interaktywnie — ustawiamy flagę
    G.cup.pendingMyMatch=myMatch;
    G.cup.pendingRound=rIdx;
    openCupMatchPanel(myMatch,rIdx);
    return; // nie przechodzimy do następnej rundy — czekamy na wynik gracza
  }

  // Generuj następną rundę (po tym jak wszystkie mecze tej rundy done)
  const allDone=matches.every(m=>m.done);
  if(allDone) advanceCupRound(rIdx);
}

function openCupMatchPanel(m,rIdx){
  if(!m)return;
  const myId=G.myClubId;
  const isMyH=m.h.cid===myId;
  const oppEntry=isMyH?m.a:m.h;
  const oppClub=ALL_CLUBS.find(c=>c.id===oppEntry.cid)||{n:oppEntry.name};
  // Zapisz pending — zostanie aktywowany DOPIERO po meczu ligowym tego tygodnia
  G.cup.pendingMyMatch=m;
  G.cup.pendingRound=rIdx;
  G.cup.pendingIsMyH=isMyH;
  addNews(t('news_cup_your_match').replace('{n}',rIdx+1).replace('{h}',isMyH?G.myClub.n:oppClub.n).replace('{a}',isMyH?oppClub.n:G.myClub.n),'ok');
  updateCupTileBadge();
}

function resolveCupMyMatch(myGoals,oppGoals){
  // Wywoływane po zakończeniu meczu gracza z simMatch()
  if(!G||!G._cupMatchActive)return;
  const {match,rIdx,isMyH}=G._cupMatchActive;
  let hg,ag;
  if(isMyH){hg=myGoals;ag=oppGoals;}else{hg=oppGoals;ag=myGoals;}
  // Dogrywka przy remisie
  if(hg===ag){if(Math.random()<0.5)hg++;else ag++;}
  match.hg=hg;match.ag=ag;match.done=true;
  const myWon=(isMyH&&hg>ag)||(!isMyH&&ag>hg);
  // Aktualizuj cupSt GK gracza (cs/ga)
  const _cupGK=myPl().find(p=>p.pos==='GK'&&p.starter);
  if(_cupGK){
    if(!_cupGK.cupSt)_cupGK.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
    if(!_cupGK.cupSt.ga)_cupGK.cupSt.ga=0;
    if(!_cupGK.cupSt.cs)_cupGK.cupSt.cs=0;
    _cupGK.cupSt.ga+=oppGoals;
    if(oppGoals===0)_cupGK.cupSt.cs++;
  }
  const winnerId=hg>ag?match.h.cid:match.a.cid;
  const loserId=hg>ag?match.a.cid:match.h.cid;
  match.winnerId=winnerId;
  G.cup.eliminated[loserId]=true;
  G.cup.myRound=rIdx;
  G._cupMatchActive=null;
  G.cup.pendingMyMatch=null;
  G._cupFakeMatch=null;
  var _ctbR=document.getElementById('cup-tac-btn');if(_ctbR)_ctbR.remove();
  if(myWon){
    grantCupReward(rIdx,true);
    addNews(t('cup_advance').replace('{hg}',hg).replace('{ag}',ag).replace('{round}',CUP_ROUND_LABELS[rIdx]),'ok');
  } else {
    addNews(t('cup_eliminated').replace('{round}',CUP_ROUND_LABELS[rIdx]).replace('{hg}',hg).replace('{ag}',ag),'err');
    G.cup.active=false;
  }
  // Sprawdź czy wszystkie mecze tej rundy done
  const allDone=(G.cup.rounds[rIdx]||[]).every(m=>m.done);
  if(allDone)advanceCupRound(rIdx);
  updateCupTileBadge();
}

function advanceCupRound(rIdx){
  if(rIdx>=5){
    // Finał rozstrzygnięty
    const finalMatch=(G.cup.rounds[5]||[])[0];
    if(finalMatch&&finalMatch.done){
      const winEntry=finalMatch.winnerId===finalMatch.h.cid?finalMatch.h:finalMatch.a;
      const loseEntry=finalMatch.winnerId===finalMatch.h.cid?finalMatch.a:finalMatch.h;
      G.cup.winner=winEntry;
      G.cup.active=false;
      // Zapisz w historii pucharów
      if(!G.cupHistory)G.cupHistory=[];
      G.cupHistory.push({
        season:G.season,
        winner:winEntry,
        runnerUp:loseEntry,
        finalHg:finalMatch.hg,
        finalAg:finalMatch.ag,
        myResult:G.cup.myRound,
        rounds:G.cup.rounds.map(rnd=>rnd.map(m=>({h:m.h,a:m.a,hg:m.hg,ag:m.ag,done:m.done,winnerId:m.winnerId})))
      });
      const isMyWin=winEntry.cid===G.myClubId;
      const isMyFinal=loseEntry.cid===G.myClubId;
      if(isMyWin){
        grantCupReward(5,true); // nagroda za zwycięstwo
        addNews(t('news_cup_won'),'ok');
        if(!G.allTimeStats)G.allTimeStats={};
        if(!G.allTimeStats.cupWins)G.allTimeStats.cupWins=0;
        G.allTimeStats.cupWins++;
        if(!G.trophies)G.trophies=[];
        G.trophies.push({type:'cup',id:'cup_winner',name:t('ht_champions_cup'),season:G.season,place:1,clubId:G.myClubId});
      } else if(isMyFinal){
        // Nagroda za finał (przegrana)
        const _fReward=CUP_REWARDS[5];
        if(_fReward&&G){
          G.budget+=_fReward.cash;
          changeReputation(_fReward.rep,t('cup_note_prefix')+t('ht_cup_finalist'));
          if(!G.fin)G.fin={};if(!G.fin.hist)G.fin.hist=[];
          G.fin.hist.push({w:G.week,inc:_fReward.cash,cost:0,bal:G.budget,note:t('cup_note_prefix')+t('ht_cup_finalist')});
          addNews(t('news_cup_final_reward').replace('{cash}',fmt(_fReward.cash)).replace('{rep}',_fReward.rep),'budget');
        }
        addNews(t('news_cup_final_loss').replace('{score}',finalMatch.hg+':'+finalMatch.ag),'info');
        if(!G.trophies)G.trophies=[];
        G.trophies.push({type:'cup',id:'cup_final',name:t('ht_cup_finalist'),season:G.season,place:2});
      } else {
        const _cupWonByMsg=t('news_cup_won_by').replace('{name}',winEntry.name);
        addNews(_cupWonByMsg,'info');
        const _winLg=G.leagues&&G.leagues.find(l=>l.clubs.some(c=>c.id===winEntry.cid));
        addWorldNewsEvent('cup',{clubId:winEntry.cid,leagueLevel:_winLg?_winLg.level:null,
          vars:{club:winEntry.name}});
        // Reputacja AI za Puchar — te same wartości co gracz (zwycięzca/finalista)
        const _winClub=ALL_CLUBS.find(c=>c.id===winEntry.cid);
        if(_winClub&&_winClub.ai)_winClub.ai.reputation=Math.max(0,(_winClub.ai.reputation||0)+CUP_REWARD_WIN.rep);
        const _loseClub=ALL_CLUBS.find(c=>c.id===loseEntry.cid);
        if(_loseClub&&_loseClub.ai)_loseClub.ai.reputation=Math.max(0,(_loseClub.ai.reputation||0)+CUP_REWARDS[5].rep);
      }
    }
    updateCupTileBadge();
    return;
  }
  // Zbierz zwycięzców i generuj pary następnej rundy
  const winners=[];
  (G.cup.rounds[rIdx]||[]).forEach(m=>{
    if(m.done&&m.winnerId!=null){
      const entry=m.h.cid===m.winnerId?m.h:m.a;
      winners.push(entry);
    }
  });
  const shuffledW=shuffle64(winners);
  const nextMatches=[];
  for(let i=0;i<Math.floor(shuffledW.length/2);i++){
    nextMatches.push({h:shuffledW[i*2],a:shuffledW[i*2+1],hg:null,ag:null,done:false});
  }
  G.cup.rounds[rIdx+1]=nextMatches;
  G.cup.currentRound=rIdx+1;
  updateCupTileBadge();
}

function clubAvgOvr(cid){
  const pl=G.players.filter(p=>p.clubId===cid&&p.starter);
  if(!pl.length)return 30;
  return pl.reduce((s,p)=>s+ovr(p),0)/pl.length;
}

function updateCupTileBadge(){
  const tile=document.getElementById('tile-cup');
  if(!tile)return;
  let badge=tile.querySelector('.cup-tile-badge');
  if(!G||!G.cup){if(badge)badge.remove();return;}
  const rIdx=G.cup.currentRound;
  const label=G.cup.winner?t('cup_badge_done'):G.cup.active?'R'+(rIdx+1):t('cup_badge_out');
  if(!badge){badge=document.createElement('div');badge.className='cup-tile-badge';tile.appendChild(badge);}
  badge.textContent=label;
}

function cupTab(tab,btn){
  document.querySelectorAll('#p-cup .sq-tab2-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  ['cup-drzewko','cup-zwyciezcy'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  const e=document.getElementById('cup-'+tab);if(e)e.style.display='block';
  if(tab==='drzewko')renderCupDrzewko();
  else renderCupZwyciezcy();
}

function fillCup(){
  const tabs=document.getElementById('cup-tabs');
  const drzewko=document.getElementById('cup-drzewko');
  const zwyciezcy=document.getElementById('cup-zwyciezcy');
  if(!tabs||!drzewko||!zwyciezcy)return;
  // Zawsze aktywna pierwsza zakładka
  const activeBtn=document.querySelector('#p-cup .sq-tab2-btn.on');
  const activeTab=activeBtn?activeBtn.dataset.tab:'drzewko';
  if(activeTab==='drzewko')renderCupDrzewko();
  else renderCupZwyciezcy();
}

function renderCupDrzewko(){
  const el=document.getElementById('cup-drzewko');
  if(!el)return;

  // Ustal dostępne sezony: bieżący (G.cup) + poprzednie (cupHistory)
  const hist=G&&G.cupHistory||[];
  const hasCurrent=G&&G.cup&&G.cup.season===G.season;
  const seasons=[]; // {season, cup/hist}
  hist.forEach(h=>seasons.push({season:h.season,src:'hist',data:h}));
  if(hasCurrent)seasons.push({season:G.season,src:'live',data:G.cup});
  seasons.sort((a,b)=>b.season-a.season);

  if(!seasons.length){
    el.innerHTML='<div style="padding:20px;text-align:center;color:var(--gr)">'+t('cup_not_started').replace('{n}',CUP_WEEKS[0])+'</div>';
    return;
  }

  // Aktywny sezon (indeks w tablicy seasons)
  if(el._cupSeasonIdx===undefined||el._cupSeasonIdx>=seasons.length)el._cupSeasonIdx=0;
  const idx=el._cupSeasonIdx;
  const cur=seasons[idx];
  const myId=G&&G.myClubId;

  let html='';

  // ── NAWIGATOR SEZONÓW ───────────────────────────────────────────
  html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:var(--gm);border-bottom:1px solid var(--gl)">';
  html+='<button onclick="cupDrzewkoNav(-1)" style="background:none;border:1px solid var(--gl);color:'+(idx<seasons.length-1?'var(--gb)':'#333')+';font-size:var(--fs-body);padding:2px 10px;cursor:'+(idx<seasons.length-1?'pointer':'default')+'">◀</button>';
  html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am)">'+t('cup_season_label').replace('{n}',cur.season)+(cur.src==='live'?t('cup_season_live'):'')+'</div>';
  html+='<button onclick="cupDrzewkoNav(1)" style="background:none;border:1px solid var(--gl);color:'+(idx>0?'var(--gb)':'#333')+';font-size:var(--fs-body);padding:2px 10px;cursor:'+(idx>0?'pointer':'default')+'">▶</button>';
  html+='</div>';

  // Pobierz rundy
  const rounds=cur.src==='live'?cur.data.rounds:cur.data.rounds||[];
  const winner=cur.src==='live'?cur.data.winner:cur.data.winner;

  // ── ZDOBYWCA ────────────────────────────────────────────────────
  if(winner){
    const isMyWin=winner.cid===myId;
    html+='<div style="background:'+(isMyWin?'#1a2a00':'var(--tb)')+';border:2px solid '+(isMyWin?'var(--am)':'#8B6914')+';padding:10px 14px;margin:10px 14px;text-align:center">';
    html+='<div style="font-weight:700;font-size:var(--fs-h3);color:var(--am);margin-bottom:4px">'+t('cup_winner_title')+'</div>';
    html+='<div style="font-size:var(--fs-body);color:'+(isMyWin?'var(--am)':'var(--wh)')+'">'+(isMyWin?'★ ':'')+
      '<span onclick="openClubModal('+winner.cid+')" style="cursor:pointer;text-decoration:underline;color:inherit">'+winner.name+'</span></div>';
    if(cur.data.finalHg!=null)html+='<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:2px">'+t('cup_final_score').replace('{hg}',cur.data.finalHg).replace('{ag}',cur.data.finalAg).replace('{opp}',(cur.data.runnerUp?cur.data.runnerUp.name:'?'))+'</div>';
    html+='</div>';
  }

  // ── RUNDY — od finału do R1 ─────────────────────────────────────
  const roundsToShow=Math.min(rounds.length,6);
  for(let ri=roundsToShow-1;ri>=0;ri--){
    const rmatches=rounds[ri]||[];
    if(!rmatches.length)continue;
    const isLowRound=ri<=1; // R1 i R2 zwijamy
    const label=CUP_ROUND_LABELS[ri]||t('cup_round_n').replace('{n}',ri+1);
    const collapseId='cup-r-'+cur.season+'-'+ri;
    const collapsed=el['_col'+ri]===undefined?isLowRound:el['_col'+ri];

    // Sprawdź czy gracz brał udział w tej rundzie
    const myMatchInRound=rmatches.find(m=>m.h.cid===myId||m.a.cid===myId);

    html+='<div style="margin:0 0 2px">';
    // Nagłówek rundy — klikalny
    html+='<div onclick="cupToggleRound('+ri+','+cur.season+')" style="display:flex;justify-content:space-between;align-items:center;padding:6px 14px;background:#0d1f0d;cursor:pointer;border-left:3px solid '+(myMatchInRound?'var(--am)':'var(--gl)')+'">';
    html+='<div style="font-weight:700;font-size:var(--fs-h3);color:'+(myMatchInRound?'var(--am)':'var(--gr)')+'">'+label+'</div>';
    html+='<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cup_round_match').replace('{n}',rmatches.length).replace('{suffix}',rmatches.length===1?'':'y')+' '+(collapsed?'▶':'▼')+'</div>';
    html+='</div>';

    if(!collapsed){
      rmatches.forEach(m=>{
        const isMyMatch=m.h.cid===myId||m.a.cid===myId;
        const myWon=isMyMatch&&m.done&&m.winnerId===myId;
        const myLost=isMyMatch&&m.done&&m.winnerId!=null&&m.winnerId!==myId;
        const hWin=m.done&&m.winnerId===m.h.cid;
        const aWin=m.done&&m.winnerId===m.a.cid;
        let bdr=isMyMatch?(myWon?'var(--gb)':myLost?'var(--rd)':'var(--am)'):'var(--gl)';
        // Link do szczegółów meczu — tylko bieżący sezon (cur.src==='live'): G.mHist/G._mHistAI są
        // czyszczone na starcie nowego sezonu (season-summary.js), więc dla archiwalnych sezonów
        // (cupHistory) mHistIdx byłby martwym wskaźnikiem — tam zostają same linki do drużyn.
        const canOpenMatch=cur.src==='live'&&m.done&&m.mHistIdx!=null&&m.mHistSrc;
        const rowAttrs=canOpenMatch
          ?' onclick="showMatchDetail('+m.mHistIdx+',\''+m.mHistSrc+'\')" style="cursor:pointer;background:var(--tb);border-left:3px solid '+bdr+';padding:6px 14px 6px 16px;border-bottom:1px solid #0d1f0d"'
          :' style="background:var(--tb);border-left:3px solid '+bdr+';padding:6px 14px 6px 16px;border-bottom:1px solid #0d1f0d"';
        html+='<div'+rowAttrs+'>';
        html+='<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense);color:'+(hWin?'var(--wh)':m.done?'var(--gr)':'var(--gr)')+'">';
        html+='<span onclick="event.stopPropagation();openClubModal('+m.h.cid+')" style="cursor:pointer;text-decoration:underline">'+(m.h.cid===myId?'<span style="color:var(--am)">★ </span>':'')+m.h.name+'</span>';
        html+='<span style="font-weight:700;font-size:var(--fs-micro);color:'+(hWin?'var(--am)':'var(--gr)')+'">'+(m.done?m.hg:'—')+'</span>';
        html+='</div>';
        html+='<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense);margin-top:2px;color:'+(aWin?'var(--wh)':m.done?'var(--gr)':'var(--gr)')+'">';
        html+='<span onclick="event.stopPropagation();openClubModal('+m.a.cid+')" style="cursor:pointer;text-decoration:underline">'+(m.a.cid===myId?'<span style="color:var(--am)">★ </span>':'')+m.a.name+'</span>';
        html+='<span style="font-weight:700;font-size:var(--fs-micro);color:'+(aWin?'var(--am)':'var(--gr)')+'">'+(m.done?m.ag:'—')+'</span>';
        html+='</div>';
        if(!m.done&&isMyMatch)html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin-top:3px">'+t('cup_your_match')+'</div>';
        html+='</div>';
      });
    }
    html+='</div>';
  }

  el.innerHTML=html;
}

function cupDrzewkoNav(dir){
  const el=document.getElementById('cup-drzewko');
  if(!el)return;
  const hist=G&&G.cupHistory||[];
  const hasCurrent=G&&G.cup&&G.cup.season===G.season;
  const total=hist.length+(hasCurrent?1:0);
  el._cupSeasonIdx=Math.max(0,Math.min(total-1,(el._cupSeasonIdx||0)-dir));
  renderCupDrzewko();
}

function cupToggleRound(ri,season){
  const el=document.getElementById('cup-drzewko');
  if(!el)return;
  el['_col'+ri]=!el['_col'+ri];
  renderCupDrzewko();
}

function renderCupZwyciezcy(){
  const el=document.getElementById('cup-zwyciezcy');
  if(!el)return;
  const hist=G&&G.cupHistory||[];
  const myId=G&&parseInt(G.myClubId);
  let html='';

  // ── NAGRODY ─────────────────────────────────────────────────────
  html+='<div style="padding:8px 14px;border-bottom:1px solid var(--gl)">';
  html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin-bottom:8px">'+t('cup_rewards_title')+'</div>';
  const allRewards=[...CUP_REWARDS,{label:t('cup_reward_win'),cash:CUP_REWARD_WIN.cash,rep:CUP_REWARD_WIN.rep}];
  allRewards.forEach((rw,i)=>{
    const isWin=i===6;
    const isLast=i===allRewards.length-1;
    html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid '+(isLast?'var(--am)':'#0d1f0d')+';'+(isLast?'margin-top:2px':'')+'">'+
      '<div style="font-size:var(--fs-dense);color:'+(isLast?'var(--am)':'var(--wh)')+'">'+rw.label+'</div>'+
      '<div style="display:flex;gap:10px;align-items:center">'+
        '<span style="font-size:var(--fs-dense);color:var(--gb)">+'+fmt(rw.cash)+'</span>'+
        '<span style="font-size:var(--fs-dense);color:var(--am)">+'+rw.rep+' rep</span>'+
      '</div>'+
    '</div>';
  });
  html+='<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:5px">'+
    t('cup_total_title').replace('{cash}','<span style="color:var(--gb)">'+fmt(CUP_REWARDS.reduce((s,r)=>s+r.cash,0)+CUP_REWARD_WIN.cash)+'</span>').replace('{rep}','<span style="color:var(--am)">+'+(CUP_REWARDS.reduce((s,r)=>s+r.rep,0)+CUP_REWARD_WIN.rep)+' rep</span>')+
  '</div>';
  html+='</div>';

  // ── BILANS GRACZA ───────────────────────────────────────────────
  const myWins=hist.filter(h=>h.winner.cid===myId);
  const myFinals=hist.filter(h=>h.runnerUp&&h.runnerUp.cid===myId);
  const myRounds=hist.map(h=>h.myResult).filter(r=>r!=null&&r>=0);
  const furthest=myRounds.length?Math.max(...myRounds):-1;
  // Etykiety odpowiadają indeksom rund 0-5, plus osobna obsługa tytułu
  const ROUND_LABELS_SHORT=[t('cup_round1'),t('cup_round2'),t('cup_qf'),t('cup_sf'),t('cup_sf'),t('cup_final')];
  let furthestLabel='—';
  if(furthest>=0){
    const wonTitle=hist.some(h=>h.winner.cid===myId);
    if(furthest===5&&wonTitle)furthestLabel=t('cup_title_won');
    else furthestLabel=ROUND_LABELS_SHORT[furthest]||'—';
  }

  html+='<div style="padding:12px 14px;border-bottom:1px solid var(--gl)">';
  html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin-bottom:8px">'+t('cup_your_record')+'</div>';
  html+='<div style="display:flex;gap:6px;margin-bottom:8px">';
  // Ikonki trofeów
  myWins.forEach(h=>{html+='<div style="text-align:center"><div style="font-size:26px">🥇</div><div style="font-weight:700;font-size:var(--fs-micro);color:var(--am)">S'+h.season+'</div></div>';});
  myFinals.forEach(h=>{html+='<div style="text-align:center"><div style="font-size:26px;filter:grayscale(0.3)">🥈</div><div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr)">S'+h.season+'</div></div>';});
  if(!myWins.length&&!myFinals.length)html+='<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cup_no_trophies')+'</div>';
  html+='</div>';
  // Statystyki tekstowe
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">';
  html+='<div style="background:var(--tb);border:1px solid var(--gl);padding:6px;text-align:center"><div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cup_stat_part')+'</div><div style="font-size:var(--fs-meta);color:var(--wh)">'+hist.length+'</div></div>';
  html+='<div style="background:var(--tb);border:1px solid '+(myWins.length?'#FFD700':'var(--gl)')+';padding:6px;text-align:center"><div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cup_stat_titles')+'</div><div style="font-size:var(--fs-meta);color:'+(myWins.length?'var(--am)':'var(--wh)')+'">'+myWins.length+'</div></div>';
  html+='<div style="background:var(--tb);border:1px solid var(--gl);padding:6px;text-align:center"><div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cup_stat_furthest')+'</div><div style="font-size:var(--fs-dense);color:var(--wh)">'+furthestLabel+'</div></div>';
  html+='</div>';
  html+='</div>';

  // ── HALL OF FAME ─────────────────────────────────────────────────
  html+='<div style="padding:12px 14px;border-bottom:1px solid var(--gl)">';
  html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin-bottom:10px">'+t('cup_hof_title')+'</div>';
  if(!hist.length){
    html+='<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cup_hof_empty')+'</div>';
  } else {
    const wins={};
    hist.forEach(h=>{
      const k=h.winner.cid;
      if(!wins[k])wins[k]={name:h.winner.name,cid:k,count:0,isMy:k===myId,seasons:[]};
      wins[k].count++;wins[k].seasons.push(h.season);
    });
    const ranked=Object.values(wins).sort((a,b)=>b.count-a.count);
    const maxCount=ranked[0]?ranked[0].count:1;
    ranked.forEach((entry,i)=>{
      const barW=Math.round(entry.count/maxCount*100);
      const isMy=entry.isMy;
      const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
      html+='<div style="font-size:var(--fs-body);min-width:18px">'+(medal||('<span style="font-size:var(--fs-dense);color:var(--gr)">'+(i+1)+'.</span>'))+'</div>';
      html+='<div style="flex:1">';
      html+='<div style="font-size:var(--fs-dense);color:'+(isMy?'var(--am)':'var(--wh)')+';">'+(isMy?'★ ':'')+
        '<span onclick="openClubModal('+entry.cid+')" style="cursor:pointer;text-decoration:underline;color:inherit">'+entry.name+'</span>'+
      '</div>';
      html+='<div style="height:4px;background:var(--gm);margin-top:3px;border-radius:2px">';
      html+='<div style="height:100%;width:'+barW+'%;background:'+(isMy?'var(--am)':i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--gb)')+'"></div>';
      html+='</div>';
      html+='<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:1px">S'+entry.seasons.join(' S')+'</div>';
      html+='</div>';
      html+='<div style="font-weight:700;font-size:var(--fs-micro);color:'+(isMy?'var(--am)':i===0?'#FFD700':'var(--wh)')+'">'+entry.count+'x</div>';
      html+='</div>';
    });
  }
  html+='</div>';

  // ── HISTORIA FINAŁÓW ─────────────────────────────────────────────
  html+='<div style="padding:12px 14px">';
  html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin-bottom:8px">'+t('cup_finals_history')+'</div>';
  if(!hist.length){
    html+='<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('cup_finals_empty')+'</div>';
  } else {
    [...hist].reverse().forEach(h=>{
      const myW=h.winner.cid===myId;
      const myL=h.runnerUp&&h.runnerUp.cid===myId;
      html+='<div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid #0d1f0d">';
      html+='<div style="font-size:var(--fs-body)">'+(myW?'🥇':myL?'🥈':'🏆')+'</div>';
      html+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);min-width:20px">S'+h.season+'</div>';
      html+='<div style="flex:1;font-size:var(--fs-dense)">';
      html+='<span onclick="openClubModal('+h.winner.cid+')" style="cursor:pointer;text-decoration:underline;color:'+(myW?'var(--am)':'var(--wh)')+'">'+h.winner.name+'</span>';
      html+=' <span style="color:var(--gr)">'+h.finalHg+':'+h.finalAg+'</span> ';
      html+='<span onclick="openClubModal('+(h.runnerUp?h.runnerUp.cid:0)+')" style="cursor:pointer;text-decoration:underline;color:'+(myL?'var(--am)':'var(--gr)')+'">'+(h.runnerUp?h.runnerUp.name:'?')+'</span>';
      html+='</div>';
      html+='</div>';
    });
  }
  html+='</div>';

  el.innerHTML=html;
}

// ── INTEGRACJA Z advWeek — trigger rund pucharowych ─────────────
function checkCupTrigger(){
  if(!G||G.week<3)return;
  const wk=G.week;
  const rIdx=CUP_WEEKS.indexOf(wk);
  if(rIdx<0)return; // nie tydzień pucharowy
  if(rIdx===0&&(!G.cup||G.cup.season!==G.season)){
    // Inicjuj puchar na początku sezonu (runda 1 w tygodniu 5)
    initCup();
    simCupRound();
    return;
  }
  if(!G.cup||G.cup.season!==G.season||!G.cup.active)return;
  if(G.cup.currentRound!==rIdx)return; // nie ta runda
  simCupRound();
}

// ══════════════════════════════════════════════
// MODAL: PODSUMOWANIE SEZONU
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// WYCENA SEZONOWA — wywoływana przy seasonEnded=true
// ══════════════════════════════════════════════
