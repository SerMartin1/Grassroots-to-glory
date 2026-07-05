let _devSeasons = 5;

function devGoToGame(){
  if(!G){notif('Brak gry!','err');return;}
  // Auto-skład po symulacji (startNewSeason resetuje starterów)
  autoSelectSquad();
  go('v-game');
  updateHdr();
  renderNews();
  notif('Kontynuujesz grę: '+G.myClub.n+' • Sezon '+G.season,'ok');
}
function openDevMode(){
  if(!DEV_MODE)return;
  go('v-dev');
  updateDevStatus();
}

function updateDevStatus(){
  const s=document.getElementById('dev-status');
  if(!s)return;
  if(!G){s.innerHTML='<span style="color:var(--rd)">Brak wczytanej gry. Wczytaj lub rozpocznij grę.</span>';return;}
  s.innerHTML='Klub: <span style="color:var(--am)">'+G.myClub.n+'</span> • '+
    (LEAGUE_NAMES[G.myLeague||8]||t('league_fallback'))+' • '+t('hdr_season')+' <span style="color:var(--am)">'+G.season+'</span><br>'+
    'Budżet: <span style="color:var(--gb)">'+fmt(G.budget)+'</span> • '+
    'Rep: <span style="color:var(--am)">'+(G.reputation||30)+'</span> • '+
    'Stadion: <span style="color:var(--wh)">'+(G.stadium&&G.stadium.capacity||200)+' m.</span>';
}

function changeDevSeasons(d){
  _devSeasons=Math.max(1,Math.min(50,_devSeasons+d));
  const el=document.getElementById('dev-seasons-val');
  if(el)el.textContent=_devSeasons;
}

function devLog(msg,color){
  const el=document.getElementById('dev-log');if(!el)return;
  if(el.textContent==='—')el.innerHTML='';
  el.innerHTML+='<div style="color:'+(color||'var(--gr)')+'">'+msg+'</div>';
  el.scrollTop=el.scrollHeight;
}

function runDevSim(){
  if(!G){devLog('ERROR: Brak wczytanej gry!','var(--rd)');return;}
  const btn=document.getElementById('dev-run-btn');
  if(btn){btn.disabled=true;btn.textContent='⏳ Symulacja...';}
  const el=document.getElementById('dev-log');if(el)el.innerHTML='';
  devLog('START: '+G.myClub.n+' • '+LEAGUE_NAMES[G.myLeague||8]+' • Sezon '+G.season,'var(--am)');

  setTimeout(()=>{
    try{
      for(let i=0;i<_devSeasons;i++){
        const seasonNum=G.season;
        const leagueBefore=G.myLeague;

        // Auto-wybierz skład
        autoSelectSquad();
        // AI składy
        ALL_CLUBS.filter(c=>c.id!==G.myClubId).forEach(c=>aiSelectSquad(c.id));

        // Symuluj wszystkie kolejki
        let round=1;
        const totalRounds=(CLUBS_B.length-1)*2;
        // ── PUCHAR DEV: inicjuj i zasymuluj cały puchar ──────────────────
        G.cup=null;G._cupMatchActive=null;G._cupFakeMatch=null;
        // Inicjuj puchar (top 8 per liga po OVR — G.round<5)
        G.round=2; // wymuś tryb OVR (round<5)
        initCup();
        // Zasymuluj wszystkie rundy pucharu w tym sezonie (gracz = AI)
        if(G.cup){
          let _myDevRound=-1; // ostatnia runda gracza w tym pucharze
          for(let cr=0;cr<6;cr++){
            const cmatches=G.cup.rounds[cr]||[];
            if(!cmatches.length)break;
            cmatches.forEach(m=>{
              if(m.done)return;
              const isMyMatch=m.h.cid===G.myClubId||m.a.cid===G.myClubId;
              if(isMyMatch){
                // Mecz pucharowy gracza — użyj devSimMyMatch z flagą cup
                const _fakeM={h:m.h.cid,a:m.a.cid,rnd:cr,done:false,hg:0,ag:0};
                devSimMyMatch(_fakeM,true);
                m.hg=_fakeM.hg;m.ag=_fakeM.ag;
              } else {
              const hOvr=clubAvgOvr(m.h.cid);
              const aOvr=clubAvgOvr(m.a.cid);
              const hPow=hOvr*1.05,aPow=aOvr;
              const tot=r(1,5)+r(0,3);
              const hG=Math.round(tot*hPow/(hPow+aPow)*(0.85+Math.random()*0.30));
              let aG=Math.max(0,tot-hG);
              if(hG===aG){if(Math.random()<0.5)m.hg=hG+1,m.ag=aG;else m.hg=hG,m.ag=aG+1;}
              else{m.hg=hG;m.ag=aG;}
              // Aktualizuj cupSt dla zawodników AI obu drużyn
              [m.h.cid,m.a.cid].forEach(function(cid){
                const isH=cid===m.h.cid;
                const myG2=isH?m.hg:m.ag,oppG2=isH?m.ag:m.hg;
                const won2=myG2>oppG2,lost2=myG2<oppG2;
                const teamPls2=G.players.filter(function(p){return p.clubId===cid&&p.starter;});
                const avgStr5=teamPls2.reduce(function(s,p){return s+playerStr(p);},0)/Math.max(1,teamPls2.length);
                const scorers2=teamPls2.filter(function(p){return p.pos==='NAP'||p.pos==='POL';});
                for(var g2=0;g2<myG2;g2++){
                  if(!scorers2.length)break;
                  const sc2=scorers2[Math.floor(Math.random()*scorers2.length)];
                  const ass2=teamPls2.filter(function(p){return p.id!==sc2.id;});
                  const assP2=ass2.length&&Math.random()<0.7?ass2[Math.floor(Math.random()*ass2.length)]:null;
                  if(!sc2.cupSt)sc2.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
                  sc2.cupSt.g=(sc2.cupSt.g||0)+1;
                  if(assP2){if(!assP2.cupSt)assP2.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};assP2.cupSt.a=(assP2.cupSt.a||0)+1;}
                }
                teamPls2.forEach(function(p){
                  if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
                  p.cupSt.m++;
                  if(p.pos==='GK'){p.cupSt.ga=(p.cupSt.ga||0)+oppG2;if(oppG2===0)p.cupSt.cs=(p.cupSt.cs||0)+1;}
                  var strR=playerStr(p)/Math.max(1,avgStr5);
                  var cupR=Math.min(8.5,Math.max(4.0,strR*6.5));
                  if(won2)cupR+=0.2;else if(lost2)cupR-=0.2;
                  cupR+=((Math.random()-0.5)*1.0);
                  cupR=Math.max(3.0,Math.min(10.0,Math.round(cupR*10)/10));
                  if(!p.cupSt.ratings)p.cupSt.ratings=[];
                  p.cupSt.ratings.push(cupR);
                });
              });
              }
              m.done=true;
              const wCid=m.hg>m.ag?m.h.cid:m.a.cid;
              m.winnerId=wCid;
              const lCid=m.hg>m.ag?m.a.cid:m.h.cid;
              if(!G.cup.eliminated)G.cup.eliminated={};
              G.cup.eliminated[lCid]=true;
              // Śledź rundę gracza
              if(m.h.cid===G.myClubId||m.a.cid===G.myClubId)_myDevRound=cr;
            });
            // Generuj następną rundę
            if(cr<5){
              const winners=cmatches.filter(m=>m.done&&m.winnerId!=null).map(m=>m.h.cid===m.winnerId?m.h:m.a);
              const sw=shuffle64(winners);
              const next=[];
              for(let i=0;i<Math.floor(sw.length/2);i++)next.push({h:sw[i*2],a:sw[i*2+1],hg:null,ag:null,done:false});
              G.cup.rounds[cr+1]=next;
              G.cup.currentRound=cr+1;
            } else {
              // Finał — zapisz wynik
              const fin=cmatches[0];
              if(fin&&fin.done){
                const wEntry=fin.winnerId===fin.h.cid?fin.h:fin.a;
                const lEntry=fin.winnerId===fin.h.cid?fin.a:fin.h;
                G.cup.winner=wEntry;
                G.cup.active=false;
                if(!G.cupHistory)G.cupHistory=[];
                const _myDevResult=wEntry.cid===G.myClubId||lEntry.cid===G.myClubId?_myDevRound:_myDevRound;
                G.cupHistory.push({season:seasonNum,winner:wEntry,runnerUp:lEntry,finalHg:fin.hg,finalAg:fin.ag,myResult:_myDevResult,rounds:G.cup.rounds.map(rnd=>rnd.map(m=>({h:m.h,a:m.a,hg:m.hg,ag:m.ag,done:m.done,winnerId:m.winnerId})))});
                const _isMyCupWin=wEntry.cid===G.myClubId;
                const _isMyCupFinal=lEntry.cid===G.myClubId;
                if(_isMyCupWin){
                  if(!G.trophies)G.trophies=[];
                  G.trophies.push({type:'cup',id:'cup_winner',name:t('ht_champions_cup'),season:seasonNum,place:1,clubId:G.myClubId});
                  if(!G.allTimeStats)G.allTimeStats={};
                  if(!G.allTimeStats.cupWins)G.allTimeStats.cupWins=0;
                  G.allTimeStats.cupWins++;
                } else if(_isMyCupFinal){
                  if(!G.trophies)G.trophies=[];
                  G.trophies.push({type:'cup',id:'cup_final',name:t('ht_cup_finalist'),season:seasonNum,place:2});
                }
                devLog('🥇 Puchar S'+seasonNum+': '+wEntry.name+' '+fin.hg+':'+fin.ag+' '+lEntry.name,'#FFD700');
              }
            }
          }
        }
        // ─────────────────────────────────────────────────────────────────
        while(round<=totalRounds){
          G.round=round;
          // Mecz gracza
          const myMatch=G.schedule.find(m=>m.rnd===round&&!m.done&&(m.h===G.myClubId||m.a===G.myClubId));
          if(myMatch){
            devSimMyMatch(myMatch);
          }
          // Mecze AI (wszystkie ligi)
          simOthers();
          // Tygodniowe finanse (uproszczone)
          if(round%4===0){
            const inc=calcWeeklyIncome();
            G.budget+=inc.total*4;
            G.budget-=G.fin.salaries;
          } else {
            const inc=calcWeeklyIncome();
            G.budget+=inc.total;
          }
          // Odliczanie budowy stadionu i modułów w dev loop
          if(G.stadium&&G.stadium.building){
            G.stadium.building.weeksLeft--;
            if(G.stadium.building.weeksLeft<=0){
              const _db=G.stadium.building;
              const _sMax=(FIN.stadMax&&FIN.stadMax[G.myLeague||8])||50000;
              G.stadium.capacity=Math.min(_sMax,(G.stadium.capacity||200)+(_db.seats||0));
              if(!G.stadium.hist)G.stadium.hist=[];
              G.stadium.hist.push({season:G.season,week:G.week,seats:_db.seats,cost:_db.cost,capAfter:G.stadium.capacity});
              G.stadium.building=null;
            }
          }
          if(G.stadium&&G.stadium.modulBuilding){
            G.stadium.modulBuilding.weeksLeft--;
            if(G.stadium.modulBuilding.weeksLeft<=0){
              const _mb=G.stadium.modulBuilding;
              const _next=_mb.next;
              if(!G.stadium.modules)G.stadium.modules={};
              G.stadium.modules[_mb.key]=_mb.lvl+1;
              if(_next.vipWeekly!==undefined)G.stadium.vipWeekly=_next.vipWeekly;
              if(_next.gasBonus!==undefined)G.stadium.gasBonus=_next.gasBonus;
              if(_next.shopMult!==undefined)G.stadium.shopMult=_next.shopMult;
              if(_next.freqBonus!==undefined)G.frequency=Math.min(100,(G.frequency||50)+_next.freqBonus);
              if(_next.adsMult!==undefined)G.stadium.adsMult=_next.adsMult;
              if(_next.repBonus!==undefined)G.reputation=Math.min(1000,(G.reputation||30)+_next.repBonus);
              G.stadium.modulBuilding=null;
            }
          }
          round++;
          G.week=round+2;
        }

        // Premia za miejsce
        G.seasonEnded=true;
        const pos=[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)).findIndex(s=>parseInt(s.cid)===parseInt(G.myClubId));
        const bonusArr=(FIN.bonus&&FIN.bonus[G.myLeague||8])||[];
        const bonus=bonusArr[pos]||0;
        if(bonus>0)G.budget+=bonus;

        // Log sezonu
        const myStand=[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
        const myPos=myStand.findIndex(s=>parseInt(s.cid)===parseInt(G.myClubId))+1;
        const myEntry=myStand[myPos-1]||{};

        // Zapisz do cHist przed startNewSeason (który resetuje standing)
        if(!G.cHist)G.cHist=[];
        G.cHist.push({
          season:seasonNum,
          league:LEAGUE_NAMES[leagueBefore],
          leagueLevel:leagueBefore,
          pos:myPos,
          pts:myEntry.pts||0,
          w:myEntry.w||0,
          d:myEntry.d||0,
          l:myEntry.l||0,
          p:myEntry.p||0,
          gf:myEntry.gf||0,
          ga:myEntry.ga||0,
          budget:G.budget,
          reputation:G.reputation||30,
          stadiumCap:(G.stadium&&G.stadium.capacity)||200,
          bonus:0,
          table:myStand.map((s,i)=>({cid:s.cid,n:s.n,pos:i+1,pts:s.pts||0,w:s.w||0,d:s.d||0,l:s.l||0,p:s.p||0,gf:s.gf||0,ga:s.ga||0}))
        });

        // Trofeum za 1. miejsce (DEV)
        if(myPos===1){
          if(!G.trophies)G.trophies=[];
          if(!G.trophies.find(t=>t.type==='league'&&t.season===seasonNum))
            G.trophies.push({type:'league',league:leagueBefore,leagueName:LEAGUE_NAMES[leagueBefore],season:seasonNum});
        }

        // Rekordy sezonu (DEV)
        if(!G.records)G.records={maxWinStreak:0,maxUnbeatenStreak:0,maxLoseStreak:0,unbeatenStreak:0,bestWin:null,maxGoalsSeason:0,maxGoalsSeason_s:0,minConcededSeason:99,minConcededSeason_s:0,minGoalsSeason:999,minGoalsSeason_s:0,maxConcededSeason:0,maxConcededSeason_s:0};
        const _devGf=myEntry.gf||0,_devGa=myEntry.ga||0;
        if(_devGf>(G.records.maxGoalsSeason||0)){G.records.maxGoalsSeason=_devGf;G.records.maxGoalsSeason_s=seasonNum;}
        if(_devGa<(G.records.minConcededSeason===undefined?99:G.records.minConcededSeason)){G.records.minConcededSeason=_devGa;G.records.minConcededSeason_s=seasonNum;}
        if(_devGf<(G.records.minGoalsSeason||999)){G.records.minGoalsSeason=_devGf;G.records.minGoalsSeason_s=seasonNum;}
        if(_devGa>(G.records.maxConcededSeason||0)){G.records.maxConcededSeason=_devGa;G.records.maxConcededSeason_s=seasonNum;}

        // Specjalne trofea (DEV)
        if(!G.trophies)G.trophies=[];
        // Niepokonani: 0 porażek w sezonie
        if((myEntry.l||0)===0&&(myEntry.p||0)>0&&!G.trophies.find(t=>t.id==='unbeaten_season'&&t.season===seasonNum))
          G.trophies.push({type:'special',id:'unbeaten_season',name:t('trophy_unbeaten'),season:seasonNum});
        if(_devGf>=80&&!G.trophies.find(t=>t.id==='strzelnica'&&t.season===seasonNum))
          G.trophies.push({type:'special',id:'strzelnica',name:t('trophy_sharpshooters'),season:seasonNum});
        if(_devGa===0&&!G.trophies.find(t=>t.id==='mur_obronny'&&t.season===seasonNum))
          G.trophies.push({type:'special',id:'mur',name:t('trophy_defensive_wall'),season:seasonNum});
        if((G.records.maxWinStreak||0)>=10&&!G.trophies.find(t=>t.id==='seria10'&&t.season===seasonNum))
          G.trophies.push({type:'special',id:'seria10',name:t('trophy_streak10'),season:seasonNum});
        if(G.stadium&&G.stadium.capacity>=10000&&!G.trophies.find(t=>t.id==='budowlaniec'))
          G.trophies.push({type:'special',id:'budowlaniec',name:t('trophy_builder'),season:seasonNum});

        // Zapisz lgHist dla wszystkich lig (dev)
        if(!G.lgHist)G.lgHist={};
        if(G.leagues&&G.allStandings){
          G.leagues.forEach(lg=>{
            const _st=[...(G.allStandings[lg.level]||[])].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
            if(!_st.length)return;
            if(!G.lgHist[lg.level])G.lgHist[lg.level]=[];
            G.lgHist[lg.level].push({
              season:seasonNum,
              champion:_st[0]?{cid:_st[0].cid,n:_st[0].n,pts:_st[0].pts||0}:null,
              table:_st.map((s,i)=>({cid:s.cid,n:s.n,pos:i+1,pts:s.pts||0,w:s.w||0,d:s.d||0,l:s.l||0,p:s.p||0,gf:s.gf||0,ga:s.ga||0}))
            });
          });
        }

        // Zapisz historię sezonu zawodników (DEV — advWeek nie jest wywoływane w pętli)
        const _devAllHist=[...G.players,...(G.fa||[])];
        _devAllHist.forEach(p=>{
          if(!p.st)p.st={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0};
          if(!p.history)p.history=[];
          fillHistoryGaps(p); // uzupełnij S1..seasonNum-1
          const _hClub=ALL_CLUBS.find(c=>c.id===p.clubId);
          const _clubName=_hClub?_hClub.n:(p.clubId===0?'Wolny agent':'?');
          const _avgRat=p.seasonRatings&&p.seasonRatings.length?Math.round(p.seasonRatings.reduce((s,x)=>s+x,0)/p.seasonRatings.length*10)/10:null;
          const _cupToSave=p.cupSt&&p.cupSt.m>0?{m:p.cupSt.m,g:p.cupSt.g||0,a:p.cupSt.a||0,cs:p.cupSt.cs||0,ga:p.cupSt.ga||0,yk:p.cupSt.yk||0,rk:p.cupSt.rk||0,avgRat:p.cupSt.ratings&&p.cupSt.ratings.length?Math.round(p.cupSt.ratings.reduce((s,x)=>s+x,0)/p.cupSt.ratings.length*10)/10:null}:null;
          const _curIdx=p.history.findIndex(h=>h._current&&h.season===seasonNum&&h.clubId===p.clubId);
          if(_curIdx>=0){
            p.history[_curIdx]={season:seasonNum,clubId:p.clubId,club:_clubName,m:p.st.m||0,g:p.st.g||0,a:p.st.a||0,yk:p.st.yk||0,rk:p.st.rk||0,cs:p.st.cs||0,ga:p.st.ga||0,ovr:ovr(p),avgRat:_avgRat,transferOut:p.history[_curIdx].transferOut,fromAcademy:p.history[_curIdx].fromAcademy||undefined,cupSt:_cupToSave};
          } else if(!p.history.find(h=>h.season===seasonNum&&!h._current&&!h._placeholder)){
            p.history.push({season:seasonNum,clubId:p.clubId,club:_clubName,m:p.st.m||0,g:p.st.g||0,a:p.st.a||0,yk:p.st.yk||0,rk:p.st.rk||0,cs:p.st.cs||0,ga:p.st.ga||0,ovr:ovr(p),avgRat:_avgRat,cupSt:_cupToSave});
          }
        });

        // Nagrody indywidualne (DEV)
        (function(){
          var _devSquad=G.players.filter(function(p){return p.clubId===G.myClubId;});
          var _cupWonDev=G.trophies&&G.trophies.some(function(t){return t.type==='cup'&&t.place===1&&t.season===seasonNum;});
          var _cupFinDev=G.trophies&&G.trophies.some(function(t){return t.type==='cup'&&t.place===2&&t.season===seasonNum;});
          var _lgWonDev=myPos===1;
          var _promDev=myPos<=2&&leagueBefore>1;
          var _topScrDev=_devSquad.filter(function(p){return p.st&&(p.st.g||0)>0;}).sort(function(a,b){return (b.st.g||0)-(a.st.g||0);})[0];
          var _topRatDev=_devSquad.filter(function(p){return p.seasonRatings&&p.seasonRatings.length>=5;}).sort(function(a,b){var ar=a.seasonRatings.reduce(function(s,r){return s+r;},0)/a.seasonRatings.length;var br=b.seasonRatings.reduce(function(s,r){return s+r;},0)/b.seasonRatings.length;return br-ar;})[0];
          _devSquad.forEach(function(p){
            if(!p.awards)p.awards=[];
            if(_lgWonDev)p.awards.push({type:'league',icon:'🏆',label:t('award_league_title'),tier:'gold',season:seasonNum});
            if(_cupWonDev)p.awards.push({type:'cup_win',icon:'🥇',label:t('ht_champions_cup'),tier:'gold',season:seasonNum});
            if(_cupFinDev&&!_cupWonDev)p.awards.push({type:'cup_final',icon:'🥈',label:t('ht_cup_finalist'),tier:'silver',season:seasonNum});
            if(_promDev&&!_lgWonDev)p.awards.push({type:'promotion',icon:'⬆️',label:t('award_promotion'),tier:'silver',season:seasonNum});
            if(_topScrDev&&p.id===_topScrDev.id&&(_topScrDev.st.g||0)>0)p.awards.push({type:'top_scorer',icon:'⚽',label:t('award_top_scorer').replace('{n}',p.st.g||0),tier:'indiv',season:seasonNum});
            if(_topRatDev&&p.id===_topRatDev.id){var _ar=Math.round(_topRatDev.seasonRatings.reduce(function(s,r){return s+r;},0)/_topRatDev.seasonRatings.length*10)/10;p.awards.push({type:'best_rating',icon:'⭐',label:t('award_player_of_season').replace('{n}',_ar),tier:'indiv',season:seasonNum});}
          });
        })();
        // Nowy sezon (awanse/spadki)
        startNewSeason();

        const leagueAfter=G.myLeague;
        const leagueChange=leagueAfter<leagueBefore?'⬆ AWANS do '+LEAGUE_NAMES[leagueAfter]:
                           leagueAfter>leagueBefore?'⬇ SPADEK do '+LEAGUE_NAMES[leagueAfter]:'';
        const color=leagueAfter<leagueBefore?'var(--gb)':leagueAfter>leagueBefore?'var(--rd)':'var(--wh)';

        devLog(
          'S'+seasonNum+': '+myPos+'. miejsce ('+LEAGUE_NAMES[leagueBefore]+') • '+
          (myEntry.pts||0)+' pkt • '+
          (myEntry.gf||0)+':'+( myEntry.ga||0)+' • '+
          'Bud: '+fmt(G.budget)+(leagueChange?' • <span style="color:'+color+'">'+leagueChange+'</span>':''),
          color
        );
      }

      devLog('────────────────────────────────','#333');
      devLog('KONIEC: '+G.myClub.n+' • '+LEAGUE_NAMES[G.myLeague||8]+' • Sezon '+G.season,'var(--am)');
      devLog('Budżet: '+fmt(G.budget)+' • Rep: '+(G.reputation||30)+' • Stadion: '+((G.stadium&&G.stadium.capacity)||200)+' m.','var(--gb)');

    } catch(e){
      devLog('ERROR: '+e.message,'var(--rd)');
      console.error(e);
    }

    if(btn){btn.disabled=false;btn.textContent='▶ SYMULUJ SEZONY';}
    const playBtn=document.getElementById('dev-play-btn');if(playBtn)playBtn.style.display='block';
    updateDevStatus();
  }, 50);
}

function devSimMyMatch(m,isCup){
  // v202: ten sam Poisson co simOthers — cap OVR do max ligi
  const isMyH=m.h===G.myClubId;
  function tS(cid){
    const st=G.players.filter(p=>p.clubId===cid&&p.starter);
    const avgOvr=st.length?st.reduce((s,p)=>s+ovr(p),0)/st.length:25;
    const fm=st.length?st.reduce((s,p)=>s+p.form,0)/st.length:70;
    return{total:avgOvr,form:0.85+fm/666};
  }
  const hSt=tS(m.h),aSt=tS(m.a);
  // Cap OVR do max tej ligi — zapobiega 100+ golom gracza
  const _lgOvrDev={1:[58,72,82,92],2:[45,58,70,82],3:[38,52,62,74],4:[32,45,55,67],5:[27,40,50,62],6:[22,33,44,56],7:[15,26,36,48],8:[8,20,28,42]};
  const _lgMaxDev=(_lgOvrDev[G.myLeague||8]||_lgOvrDev[8])[3];
  const hOvrC=Math.min(hSt.total,_lgMaxDev);
  const aOvrC=Math.min(aSt.total,_lgMaxDev);
  // Niezależny Poisson per drużyna (identyczny z simOthers)
  const hLam=0.35+(hOvrC/100)*1.40*(isMyH?1.07:1.0);
  const aLam=0.35+(aOvrC/100)*1.40*(isMyH?1.0:1.07);
  const _t=10;
  let hG=0,aG=0;
  for(let i=0;i<_t;i++){if(Math.random()<Math.min(0.92,hLam/_t))hG++;}
  for(let i=0;i<_t;i++){if(Math.random()<Math.min(0.92,aLam/_t))aG++;}
  m.done=true;m.hg=hG;m.ag=aG;
  if(!isCup){
  updStand(m.h,m.a,hG,aG);
  // Sync do allSchedules
  if(G.allSchedules&&G.allSchedules[G.myLeague]){
    const sm=G.allSchedules[G.myLeague].find(x=>x.rnd===m.rnd&&x.h===m.h&&x.a===m.a);
    if(sm){sm.done=true;sm.hg=hG;sm.ag=aG;}
  }
  G.mHist.push({rnd:m.rnd,season:G.season,hn:(ALL_CLUBS.find(c=>c.id===m.h)||{n:'?'}).n,an:(ALL_CLUBS.find(c=>c.id===m.a)||{n:'?'}).n,hg:hG,ag:aG,isMyH:isMyH});
  }
  // Forma
  const iW=(isMyH&&hG>aG)||(!isMyH&&aG>hG);
  const iL=(isMyH&&hG<aG)||(!isMyH&&aG<hG);
  if(!isCup){
  if(!G.reputation)G.reputation=30;if(!G.frequency)G.frequency=50;
  if(iW){G.frequency=Math.min(100,G.frequency+5);G.reputation=Math.min(1000,G.reputation+1);}
  else if(iL){G.frequency=Math.max(10,G.frequency-3);}
  // Records — serie
  if(!G.records)G.records={maxWinStreak:0,maxUnbeatenStreak:0,maxLoseStreak:0,unbeatenStreak:0,bestWin:null,maxGoalsSeason:0,minConcededSeason:99};
  if(!G.winStreak)G.winStreak=0;if(!G.loseStreak)G.loseStreak=0;
  if(iW){
    G.winStreak++;G.loseStreak=0;
    G.records.maxWinStreak=Math.max(G.records.maxWinStreak,G.winStreak);
    G.records.unbeatenStreak=(G.records.unbeatenStreak||0)+1;
    G.records.maxUnbeatenStreak=Math.max(G.records.maxUnbeatenStreak,G.records.unbeatenStreak);
    const myG3=isMyH?hG:aG,oppG3=isMyH?aG:hG;
    const opp3=ALL_CLUBS.find(c=>c.id===(isMyH?m.a:m.h));
    if(!G.records.bestWin||myG3-oppG3>G.records.bestWin.diff)
      G.records.bestWin={myG:myG3,oppG:oppG3,diff:myG3-oppG3,opp:opp3?opp3.n:'?',season:G.season,rnd:m.rnd};
  }else if(iL){
    G.loseStreak++;G.winStreak=0;
    G.records.unbeatenStreak=0;
    G.records.maxLoseStreak=Math.max(G.records.maxLoseStreak,G.loseStreak);
  }else{G.winStreak=0;G.loseStreak=0;G.records.unbeatenStreak=(G.records.unbeatenStreak||0)+1;G.records.maxUnbeatenStreak=Math.max(G.records.maxUnbeatenStreak,G.records.unbeatenStreak);}
  }
  // allTimeStats — mecze i losowe gole dla zawodników
  if(!G.allTimeStats)G.allTimeStats={players:{},bestSeller:null,bestBuyer:null};
  const myPlayers=G.players.filter(p=>p.clubId===G.myClubId&&p.starter);
  const myG3=isMyH?hG:aG;
  const oppG3=isMyH?aG:hG;
  // Rozdziel gole losowo między atakujących i pomocników
  const scorers=myPlayers.filter(p=>p.pos==='NAP'||p.pos==='POL');
  myPlayers.forEach(p=>{
    if(!G.allTimeStats.players[p.id])G.allTimeStats.players[p.id]={id:p.id,name:p.name,goals:0,assists:0,matches:0};
    if(!isCup){G.allTimeStats.players[p.id].matches++;G.allTimeStats.players[p.id].name=p.name;}
    if(!isCup){p.st.m++;if(!p.trainMatches)p.trainMatches=0;p.trainMatches++;}
    // Śledzenie cupSt
    if(isCup){
      if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
      p.cupSt.m++;
    }
    // Losowa ocena meczowa dla dev sim (baza z OVR + wynik)
    const avgStr2=myPlayers.reduce((s,pl)=>s+playerStr(pl),0)/Math.max(1,myPlayers.length);
    const strRatio2=playerStr(p)/Math.max(1,avgStr2);
    let devRat=Math.min(8.5,Math.max(4.0,strRatio2*6.5));
    if(iW)devRat+=0.2;else if(iL)devRat-=0.2;
    devRat+=((Math.random()-0.5)*1.0);
    devRat=Math.max(3.0,Math.min(10.0,Math.round(devRat*10)/10));
    if(!p.seasonRatings)p.seasonRatings=[];
    p.seasonRatings.push(devRat);
    p.lastMatchRating=devRat;
    if(isCup){if(!p.cupSt.ratings)p.cupSt.ratings=[];p.cupSt.ratings.push(devRat);}
    // GK cupSt cs/ga
    if(isCup&&p.pos==='GK'){
      if(!p.cupSt.ga)p.cupSt.ga=0;if(!p.cupSt.cs)p.cupSt.cs=0;
      p.cupSt.ga+=oppG3;if(oppG3===0)p.cupSt.cs++;
    }
  });
  // Losowo przydziel gole i asysty
  for(let i=0;i<myG3;i++){
    const sc=scorers.length?scorers[Math.floor(Math.random()*scorers.length)]:myPlayers[0];
    const as=myPlayers.filter(p=>p!==sc)[Math.floor(Math.random()*(myPlayers.length-1))];
    if(isCup){
      if(sc){if(!sc.cupSt)sc.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!sc.cupSt.g)sc.cupSt.g=0;sc.cupSt.g++;}
      if(as&&Math.random()<0.7){if(!as.cupSt)as.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!as.cupSt.a)as.cupSt.a=0;as.cupSt.a++;}
    } else {
    if(sc&&G.allTimeStats.players[sc.id])G.allTimeStats.players[sc.id].goals++;
    if(as&&G.allTimeStats.players[as.id]&&Math.random()<0.7)G.allTimeStats.players[as.id].assists++;
    }
  }
}

// Pokaż/ukryj przycisk DEV na podstawie flagi
