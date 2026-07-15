function kronShowModal(ev, resolvedBody){
  const modal=document.getElementById('modal-kronika');
  if(!modal)return;
  document.getElementById('kron-category').textContent=ev.category||t('kron_cat_default');
  document.getElementById('kron-title').textContent=ev.title;
  document.getElementById('kron-body').innerHTML=resolvedBody||ev.body;
  const chEl=document.getElementById('kron-choices');
  chEl.innerHTML='';
  ev.choices.forEach(function(ch,idx){
    const btn=document.createElement('button');
    btn.style.cssText='width:100%;background:'+(idx===0?'var(--gm)':idx===1?'#0a1a0a':'#100808')+';border:none;border-top:1px solid var(--gl);color:var(--wh);font-size:var(--fs-dense);padding:12px 14px;cursor:pointer;text-align:left;line-height:1.6';
    btn.innerHTML='<span style="color:var(--am);font-weight:700;font-size:var(--fs-micro)">['+(idx===0?'A':idx===1?'B':'C')+']</span> '+ch.label;
    btn.onclick=function(){
      modal.style.display='none';
      // Kronika ma dziesiątki gałęzi efektów, każda z własnym clampem G.reputation (0-1000) —
      // zamiast podmieniać każdą z osobna, logujemy deltę centralnie tutaj (jedyne miejsce,
      // przez które przechodzi KAŻDY wybór Kroniki), żeby trafiła do modala ⭐ Rep.
      const _repBefore=G.reputation||0;
      try{ch.effect();}catch(e){console.warn('Kronika effect error:',e);}
      const outcome=ch.outcome?ch.outcome():'';
      const _repDelta=(G.reputation||0)-_repBefore;
      if(_repDelta!==0){
        if(!G.repHistory)G.repHistory=[];
        G.repHistory.unshift({delta:_repDelta,reason:ev.title+(outcome?': '+outcome:''),week:G.week,season:G.season});
        if(G.repHistory.length>60)G.repHistory.pop();
      }
      if(outcome){
        addNews('📰 '+ev.title+': '+outcome,'club');
        notif(outcome.slice(0,60),'ok');
      }
      if(KRON_TIMELINE_WORTHY.indexOf(ev.id)!==-1)
        pushTimeline('kronika_'+ev.id,'📰',ev.title+(outcome?' — '+outcome:''),{sentiment:'neutral',weight:25});
      if(idx===2&&KRON_IGNORED_WORTHY.indexOf(ev.id)!==-1)
        pushTimeline('kronika_ignored_'+ev.id,'😠',t('tl_crisis_ignored').replace('{title}',ev.title),{sentiment:'neg',weight:30});
      renderNews();updateHdr();
    };
    chEl.appendChild(btn);
  });
  modal.style.display='flex';
}

// ══════════════════════════════════════════════════════════════════════════
// PAMIĘĆ KIBICÓW — rzadkie, niezależne callbacki do milestone'ów z przeszłości
// ══════════════════════════════════════════════════════════════════════════
function fanMemoryTrigger(){
  if(!G||!G.fanMemory||G.seasonEnded||G.week<4)return;
  if(G.fanMemory.cooldown>0){G.fanMemory.cooldown--;return;}
  if(!G.timeline||!G.timeline.length)return;
  if(Math.random()>0.04)return; // ~4% szansy na tydzień
  var recalled=G.fanMemory.recalled||(G.fanMemory.recalled=[]);
  var eligible=G.timeline.filter(function(tl){
    return (G.season-tl.season)>=2&&recalled.indexOf(tl.id)===-1;
  });
  if(!eligible.length)return;
  var totalW=eligible.reduce(function(s,tl){return s+(tl.weight||15);},0);
  var r2=Math.random()*totalW;
  var chosen=null;
  for(var i=0;i<eligible.length;i++){
    r2-=(eligible[i].weight||15);
    if(r2<=0){chosen=eligible[i];break;}
  }
  if(!chosen)chosen=eligible[eligible.length-1];
  recalled.push(chosen.id);
  G.fanMemory.cooldown=3; // min. 3 tygodnie przerwy między callbackami
  var tplKey;
  if(chosen.sentiment==='neg')tplKey=pick(['tl_recall_neg1','tl_recall_neg2']);
  else if(chosen.sentiment==='pos')tplKey=pick(['tl_recall_pos1','tl_recall_pos2']);
  else tplKey='tl_recall_neutral';
  var seasonsAgo=G.season-chosen.season;
  var msg=t(tplKey).replace('{label}',chosen.label).replace('{n}',seasonsAgo);
  addNews(msg,'club');
  notif(msg.slice(0,60),'ok');
}

// ── Zamknięty świat: wydarzenia Kroniki szukają realnych kandydatów w klubach AI zamiast
// dawnej puli G.fa (usuniętej — patrz js/CLAUDE.md, PROPOZYCJA_LIKWIDACJA_FA.md). Ta sama
// logika nadwyżki/rdzenia co przy realokacji AI (match-post.js: aiCoreProtect, POS_QUOTA).
// "Okazja"/"licytacja" itp.: znajdź najlepszego kandydata z NADWYŻKI u realnego klubu AI.
function kronFindSurplusPlayer(ovrMin,ovrMax,ageMax,pos,excludeIds){
  // Ograniczone do lig w rozsądnym zasięgu własnej ligi (±2) — bez tego kandydat mógłby
  // wypaść z zupełnie innego poziomu rozgrywek (np. gwiazda Ligi 1 dla klubu z Ligi 8), z
  // ceną kompletnie oderwaną od budżetu gracza. Ta sama zasada co w aiSignReplacement().
  const myLvl=G.myLeague||8;
  const clubLevel={};G.leagues.forEach(function(l){l.clubs.forEach(function(c){clubLevel[c.id]=l.level;});});
  const squadByClub={};
  G.players.forEach(function(p){if(p.clubId>0)(squadByClub[p.clubId]||(squadByClub[p.clubId]=[])).push(p);});
  var best=null,bestClub=null;
  ALL_CLUBS.filter(function(c){
    if(c.id===G.myClubId||!c.ai)return false;
    var lvl=clubLevel[c.id];
    return lvl!=null&&Math.abs(lvl-myLvl)<=2;
  }).forEach(function(c){
    var sq=squadByClub[c.id]||[];
    var atPos=sq.filter(function(p){return(!pos||p.pos===pos)&&ovr(p)>=ovrMin&&ovr(p)<=ovrMax&&(ageMax==null||p.age<=ageMax);});
    if(!atPos.length)return;
    var core=aiCoreProtect(c,sq);
    atPos.forEach(function(p){
      if(excludeIds&&excludeIds.has(p.id))return;
      if(core.has(p.id))return;
      var posQ=POS_QUOTA[p.pos];
      if(posQ&&sq.filter(function(x){return x.pos===p.pos;}).length<=posQ.min)return; // dawca bez nadwyżki
      if(!best||ovr(p)>ovr(best)){best=p;bestClub=c;}
    });
  });
  return best?{player:best,fromClub:bestClub}:null;
}
// Cena "okazji" w wydarzeniach Kroniki — nigdy więcej niż ułamek AKTUALNEGO budżetu gracza.
// calcValue() dla realnego OVR łatwo sięga milionów niezależnie od ligi (bo skaluje się z
// OVR^4.5), kompletnie oderwane od budżetu niższych/średnich lig — bez tego capu "okazja"
// byłaby nieosiągalna dla większości graczy. Ta sama zasada co w navigation-squad.js (Etap 2).
function kronAffordablePrice(rawPrice,budgetFraction){
  return Math.min(rawPrice,Math.max(1000,Math.round((G.budget||0)*(budgetFraction||0.6)/500)*500));
}
// "Sprzedaż"/"odejście": znajdź realny klub AI z wolnym miejscem na pozycji zawodnika, żeby
// odchodzący z klubu gracza nie znikał bez śladu. opts.levelBias przesuwa cel w górę/dół
// drabinki lig (np. -1 = liga wyżej), opts.preferClub próbuje najpierw wskazanego klubu.
function kronFindDestinationClub(p,opts){
  opts=opts||{};
  if(opts.preferClub&&opts.preferClub.ai){
    var prefSq=G.players.filter(function(x){return x.clubId===opts.preferClub.id;});
    if(!POS_QUOTA[p.pos]||prefSq.filter(function(x){return x.pos===p.pos;}).length<POS_QUOTA[p.pos].max)return opts.preferClub;
  }
  var myLvl=G.myLeague||8;
  var targetLvl=opts.levelBias!=null?Math.max(1,Math.min(8,myLvl+opts.levelBias)):myLvl;
  var range=opts.levelRange!=null?opts.levelRange:2;
  var candidates=ALL_CLUBS.filter(function(c){
    if(c.id===G.myClubId||!c.ai)return false;
    var lg=G.leagues.find(function(l){return l.clubs.some(function(x){return x.id===c.id;});});
    var lvl=lg?lg.level:8;
    if(Math.abs(lvl-targetLvl)>range)return false;
    return !POS_QUOTA[p.pos]||G.players.filter(function(x){return x.clubId===c.id&&x.pos===p.pos;}).length<POS_QUOTA[p.pos].max;
  });
  if(!candidates.length)return null;
  candidates.sort(function(a,b){return(b.ai.budget||0)-(a.ai.budget||0);});
  return candidates[0];
}
// Przenosi zawodnika Z klubu gracza DO realnego klubu AI (dest) — pełna historia/log po
// stronie przyjmującego klubu, tak jak przy każdym innym transferze w grze.
function kronTransferOut(p,dest){
  if(!p.formerClubs)p.formerClubs=[];
  var _fc=p.formerClubs.find(function(x){return x.clubId===G.myClubId;});
  if(_fc)_fc.seasons=(_fc.seasons||0)+1;else p.formerClubs.push({clubId:G.myClubId,clubName:G.myClub?G.myClub.n:'?',seasons:1});
  if(!p.history)p.history=[];
  var _lastH=p.history[p.history.length-1];
  if(_lastH&&_lastH.clubId===G.myClubId)_lastH.transferOut={type:'sell',toClub:dest.n,toClubId:dest.id,price:0,season:G.season};
  p.clubId=dest.id;p.starter=false;p.contract=r(2,4);p.status='active';p.isFreeAgent=false;p._seasonsAtClub=0;
  if(!p.history.find(function(h){return h._current&&h.season===G.season&&h.clubId===dest.id;})){
    p.history.push({season:G.season,clubId:dest.id,club:dest.n,m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_current:true});
  }
  if(dest.ai){
    if(!dest.ai.transferLog)dest.ai.transferLog=[];
    dest.ai.transferLog.unshift({type:'buy',name:p.name,pos:p.pos,ovr:ovr(p),age:p.age,price:0,season:G.season,playerId:p.id,fromClub:G.myClub?G.myClub.n:'?'});
    if(dest.ai.transferLog.length>20)dest.ai.transferLog.pop();
  }
}
// Przenosi zawodnika Z realnego klubu AI DO klubu gracza (odwrotność kronTransferOut) — dla
// wydarzeń "okazja"/"licytacja" itp., gdy gracz podpisuje kandydata z kronFindSurplusPlayer.
function kronTransferIn(p,fromClub){
  if(!p.formerClubs)p.formerClubs=[];
  var _fc=p.formerClubs.find(function(x){return x.clubId===fromClub.id;});
  if(_fc)_fc.seasons=(_fc.seasons||0)+1;else p.formerClubs.push({clubId:fromClub.id,clubName:fromClub.n,seasons:1});
  if(!p.history)p.history=[];
  fillHistoryGaps(p);
  var _lastH=p.history[p.history.length-1];
  if(_lastH&&_lastH.clubId===fromClub.id)_lastH.transferOut={type:'sell',toClub:G.myClub?G.myClub.n:'?',toClubId:G.myClubId,price:0,season:G.season};
  if(fromClub.ai){
    if(!fromClub.ai.transferLog)fromClub.ai.transferLog=[];
    fromClub.ai.transferLog.unshift({type:'sell',name:p.name,pos:p.pos,ovr:ovr(p),age:p.age,price:0,season:G.season,playerId:p.id,toClub:G.myClub?G.myClub.n:'?'});
    if(fromClub.ai.transferLog.length>20)fromClub.ai.transferLog.pop();
  }
  p.clubId=G.myClubId;p.starter=false;p.status='active';p.isFreeAgent=false;p.contract=r(2,3);p._seasonsAtClub=0;
  if(!p.history.find(function(h){return h._current&&h.season===G.season&&h.clubId===G.myClubId;})){
    p.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'?',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_current:true});
  }
}

function kronTrigger(){
  if(!G||!G.kronika||G.seasonEnded||G.week<4)return;
  if(G.kronika.cooldown>0){G.kronika.cooldown--;return;}
  const kron=G.kronika;
  const my=myPl();
  const starters=my.filter(function(p){return p.starter&&!p.injured;});
  const bestP=starters.sort(function(a,b){return ovr(b)-ovr(a);})[0];
  const benchNoGame=my.filter(function(p){return !p.starter&&!p.injured&&(p._benchWeeks||0)>=4;});
  const recentInjCount=(kron.flags._injCount||0);
  const cupActive=!!(G._cupMatchActive||G.cupRound);

  // ── DEFINICJE EVENTÓW ──────────────────────────────────────────────────
  var KRON_EVENTS=[

    // K-01: Gwiazda przed finałem Pucharu
    {id:'k01_star_cup', category:t('kron_cat_cup'),
     weight:function(){return (cupActive&&bestP&&ovr(bestP)>=65)?30:0;},
     title:t('kron_k01_title'),
     body:function(){return t('kron_k01_body').replace('{name}',bestP?bestP.name:t('kron_fallback_best_player'));},
     choices:[
       {label:t('kron_k01_c1_label'),
        effect:function(){
          if(!bestP)return;
          const r2=Math.random();
          if(r2<0.60){bestP.form=Math.max(30,(bestP.form||80)-8);}
          else if(r2<0.80){applyInjury(bestP,true);}
          else{bestP.form=Math.max(20,(bestP.form||80)-20);}
        },
        outcome:function(){
          if(!bestP)return t('kron_k01_c1_outcome_noplayer');
          if(bestP.injured)return t('kron_k01_c1_outcome_injured').replace('{name}',bestP.name).replace('{type}',bestP.injuryType).replace('{weeks}',bestP.injuryWeeks||'?');
          if((bestP.form||80)<50)return t('kron_k01_c1_outcome_lowform').replace('{name}',bestP.name).replace('{form}',bestP.form);
          return t('kron_k01_c1_outcome_normal').replace('{name}',bestP.name).replace('{form}',bestP.form);
        }},
       {label:t('kron_k01_c2_label'),
        effect:function(){if(bestP){bestP.starter=false;}},
        outcome:function(){return t('kron_k01_c2_outcome').replace('{name}',bestP?bestP.name:t('kron_fallback_player'));}},
       {label:t('kron_k01_c3_label'),
        effect:function(){
          if(G.budget<8000){notif(t('kron_k01_c3_notif_nobudget'),'err');return;}
          G.budget-=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:8000,bal:G.budget,season:G.season,note:t('kron_note_k01_star_cup')});
          if(bestP){bestP._injectPenalty=2;}
        },
        outcome:function(){
          if(!bestP)return t('kron_k01_c3_outcome_noplayer');
          if(!bestP._injectPenalty)return t('kron_k01_c3_outcome_nobudget');
          return t('kron_k01_c3_outcome').replace('{name}',bestP.name);
        }}
     ]},

    // K-02: Seria kontuzji — klątwa
    {id:'k02_injury_streak', category:t('kron_cat_health'),
     weight:function(){return recentInjCount>=3?35:0;},
     title:t('kron_k02_title'),
     body:function(){return t('kron_k02_body').replace('{n}',recentInjCount);},
     choices:[
       {label:t('kron_k02_c1_label'),
        effect:function(){
          if(G.budget<15000){notif(t('kron_notif_no_budget'),'err');return;}
          G.budget-=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:15000,bal:G.budget,season:G.season,note:t('kron_note_k02_injury_streak')});kron.flags._physioHired=true;kron.flags._injCount=0;
        },
        outcome:function(){
          if(!kron.flags._physioHired)return t('kron_k02_c1_outcome_nobudget');
          return t('kron_k02_c1_outcome');
        }},
       {label:t('kron_k02_c2_label'),
        effect:function(){
          my.forEach(function(p){p.form=Math.max(40,(p.form||80)-3);});
          kron.flags._injCount=0;
        },
        outcome:function(){return t('kron_k02_c2_outcome').replace('{n}',my.length);}},
       {label:t('kron_k02_c3_label'),
        effect:function(){kron.flags._injPenaltyActive=true;},
        outcome:function(){return t('kron_k02_c3_outcome');}},
     ]},

    // K-03: Zawodnik ukrywa uraz
    {id:'k03_hidden_injury', category:t('kron_cat_health'),
     weight:function(){
       const c=starters.filter(function(p){return (p.form||80)<55&&!p.injured;});
       return c.length>=1?25:0;
     },
     title:t('kron_k03_title'),
     body:function(){
       const c=starters.filter(function(p){return (p.form||80)<55&&!p.injured;});
       const tr=c[0];
       kron.flags._k03pid=tr?tr.id:-1;
       return t('kron_k03_body').replace('{name}',tr?tr.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_k03_c1_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          if(tr){tr.injured=true;tr.injuryWeeks=1;tr.injuryType='Lekka';tr.starter=false;addNews(t('kron_k03_c1_news').replace('{name}',tr.name),'inj');}
        },
        outcome:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          return tr?t('kron_k03_c1_outcome').replace('{name}',tr.name):t('kron_k03_c1_outcome_fallback');
        }},
       {label:t('kron_k03_c2_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          if(tr){tr.injured=true;tr.injuryWeeks=2;tr.injuryType='Lekka';tr.starter=false;tr.form=Math.max(20,(tr.form||50)-10);addNews(t('kron_k03_c2_news').replace('{name}',tr.name),'inj');}
        },
        outcome:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          return tr?t('kron_k03_c2_outcome').replace('{name}',tr.name):t('kron_k03_c2_outcome_fallback');
        }},
       {label:t('kron_k03_c3_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          if(tr&&Math.random()<0.40){applyInjury(tr,false);}
        },
        outcome:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          if(!tr)return t('kron_k03_c3_outcome_noplayer');
          if(tr.injured)return t('kron_k03_c3_outcome_injured').replace('{name}',tr.name).replace('{type}',tr.injuryType).replace('{weeks}',tr.injuryWeeks);
          return t('kron_k03_c3_outcome_ok').replace('{name}',tr.name);
        }},
     ]},

    // S-01: Skandal — nocna impreza
    {id:'s01_party_scandal', category:t('kron_cat_locker'),
     weight:function(){return (G.round>3&&starters.length>=8)?20:0;},
     title:t('kron_s01_title'),
     body:function(){
       const picks=starters.slice().sort(function(){return Math.random()-0.5;}).slice(0,3);
       kron.flags._s01pids=picks.map(function(p){return p.id;});
       const names=picks.map(function(p){return p.name.split(' ')[1];}).join(', ');
       return t('kron_s01_body').replace('{names}',names);
     },
     choices:[
       {label:t('kron_s01_c1_label'),
        effect:function(){
          (kron.flags._s01pids||[]).forEach(function(id){
            const p=G.players.find(function(x){return x.id===id;});
            if(p){p.form=Math.max(20,(p.form||80)-8);G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_s01_party_scandal')});}
          });
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          const names=(kron.flags._s01pids||[]).map(function(id){const p=G.players.find(function(x){return x.id===id;});return p?p.name.split(' ')[1]:'?';}).join(', ');
          const total=(kron.flags._s01pids||[]).length*2000;
          return t('kron_s01_c1_outcome').replace('{names}',names).replace('{val}',fmtVal(total));
        }},
       {label:t('kron_s01_c2_label'),
        effect:function(){
          (kron.flags._s01pids||[]).forEach(function(id){
            const p=G.players.find(function(x){return x.id===id;});
            if(p)p.form=Math.max(30,(p.form||80)-3);
          });
        },
        outcome:function(){
          const names=(kron.flags._s01pids||[]).map(function(id){const p=G.players.find(function(x){return x.id===id;});return p?p.name.split(' ')[1]:'?';}).join(', ');
          return t('kron_s01_c2_outcome').replace('{names}',names);
        }},
       {label:t('kron_s01_c3_label'),
        effect:function(){kron.flags._s01canRepeat=true;},
        outcome:function(){return t('kron_s01_c3_outcome');}},
     ]},

    // S-04: Zawodnik żąda więcej gry
    {id:'s04_bench_protest', category:t('kron_cat_locker'),
     weight:function(){return benchNoGame.length>0?25:0;},
     title:t('kron_s04_title'),
     body:function(){
       const tr=benchNoGame.sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._s04pid=tr?tr.id:-1;
       return t('kron_s04_body').replace('{name}',tr?tr.name:t('kron_fallback_player')).replace('{ovr}',tr?ovr(tr):'?');
     },
     choices:[
       {label:t('kron_s04_c1_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          if(tr){tr.starter=true;tr._benchWeeks=0;notif(t('kron_s04_c1_notif').replace('{name}',tr.name),'ok');}
        },
        outcome:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          return tr?t('kron_s04_c1_outcome').replace('{name}',tr.name):t('kron_s04_c1_outcome_fallback');
        }},
       {label:t('kron_s04_c2_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          if(tr)tr.form=Math.max(30,(tr.form||80)-5);
          // Za 4 tygodnie może wrócić event
          kron.flags._s04repeatWeek=(G.round||1)+4;
        },
        outcome:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          return tr?t('kron_s04_c2_outcome').replace('{name}',tr.name).replace('{form}',tr.form||'?'):t('kron_s04_c2_outcome_fallback');
        }},
       {label:t('kron_s04_c3_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          if(tr)setTimeout(function(){openSellModal(tr.id);},400);
        },
        outcome:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          return t('kron_s04_c3_outcome').replace('{name}',tr?tr.name:t('kron_fallback_player'));
        }},
     ]},

    // T-01: Oferta z wyższej ligi
    {id:'t01_big_offer', category:t('kron_cat_transfers'),
     weight:function(){return (bestP&&ovr(bestP)>=60&&(G.myLeague||8)>=3)?30:0;},
     title:t('kron_t01_title'),
     body:function(){
       const val=bestP?Math.round((bestP.value||50000)*1.30/1000)*1000:0;
       kron.flags._t01pid=bestP?bestP.id:-1;
       kron.flags._t01val=val;
       return t('kron_t01_body').replace('{name}',bestP?bestP.name:t('kron_fallback_best_player')).replace('{val}',fmtVal(val));
     },
     choices:[
       {label:t('kron_t01_c1_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          if(tr){
            const val=kron.flags._t01val||0;
            G.budget+=val;
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'sell',name:tr.name,val:val,week:G.week,season:G.season});
            addNews(t('news_tr_sold').replace('{name}',tr.name).replace('{val}',fmtVal(val)),'budget');
            // Zamknięty świat: "oferta z wyższej ligi" faktycznie przenosi zawodnika do
            // realnego klubu tam wyżej, nie usuwa go bez śladu — patrz kronFindDestinationClub.
            const dest=kronFindDestinationClub(tr,{levelBias:-1,levelRange:1})||kronFindDestinationClub(tr,{});
            if(dest)kronTransferOut(tr,dest);
          }
        },
        outcome:function(){return t('kron_t01_c1_outcome').replace('{val}',fmtVal(kron.flags._t01val||0));}},
       {label:t('kron_t01_c2_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          if(tr)tr.form=Math.max(40,(tr.form||80)-8); // niezadowolony
        },
        outcome:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          return t('kron_t01_c2_outcome').replace('{name}',tr?tr.name:t('kron_fallback_player')).replace('{form}',tr?tr.form:'?');
        }},
       {label:t('kron_t01_c3_label'),
        effect:function(){
          const tr=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          if(Math.random()<0.70){
            const val2=Math.round((kron.flags._t01val||0)*1.15/1000)*1000;
            if(tr){
              G.budget+=val2;
              addNews(t('news_tr_nego_success').replace('{name}',tr.name).replace('{val}',fmtVal(val2)),'budget');
              const dest2=kronFindDestinationClub(tr,{levelBias:-1,levelRange:1})||kronFindDestinationClub(tr,{});
              if(dest2)kronTransferOut(tr,dest2);
              kron.flags._t01val=val2;
            }
          } else {
            addNews(t('news_tr_offer_withdrawn'),'budget');
            if(tr)tr.form=Math.max(35,(tr.form||80)-5);
          }
        },
        outcome:function(){
          const stillHere=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          if(!stillHere)return t('kron_t01_c3_outcome_win').replace('{val}',fmtVal(kron.flags._t01val||0));
          return t('kron_t01_c3_outcome_lose');
        }},
     ]},

    // T-04: Lokalny talent puka do drzwi
    {id:'t04_local_talent', category:t('kron_cat_transfers'),
     weight:function(){return (my.length<24&&G.round>2)?20:0;},
     title:t('kron_t04_title'),
     body:function(){
       const pos=pick(['NAP','POL','OBR']);
       const ageT=17+Math.floor(Math.random()*3);
       const ovrT=38+Math.floor(Math.random()*8);
       kron.flags._t04pos=pos;kron.flags._t04age=ageT;kron.flags._t04ovr=ovrT;
       const posLabel=pos==='NAP'?t('kron_pos_nap'):pos==='POL'?t('kron_pos_pol'):t('kron_pos_obr');
       return t('kron_t04_body').replace('{age}',ageT).replace('{pos}',posLabel).replace('{ovr}',ovrT);
     },
     choices:[
       {label:t('kron_t04_c1_label'),
        effect:function(){
          const pos2=kron.flags._t04pos||'POL';
          const ageT2=kron.flags._t04age||18;
          const ovrT2=kron.flags._t04ovr||42;
          const np=mkPlayer(G.myClubId);
          np.pos=pos2;np.age=ageT2;
          const diff=ovrT2-ovr(np);
          if(diff>0){const attrs=['tec','pas','sht','def','phy','men'];attrs.forEach(function(a){np[a]=Math.min(99,np[a]+Math.ceil(diff/6));});}
          np.contract=1;np.salary=calcSalary(np.value,G.myLeague||8,ovr(np));
          np.potential=calcPotential(np,G.myLeague||8);
          np.status='active';np.isFreeAgent=false;
          np.history=[{season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'?',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(np),avgRat:null,_current:true}];
          G.players.push(np);
          addNews(t('news_tr_joined_free').replace('{name}',np.name).replace('{pos}',pos2).replace('{age}',ageT2),'budget');
        },
        outcome:function(){
          const np=myPl().filter(function(p){return p.contract===1&&!p.fromAcademy;}).sort(function(a,b){return b.id-a.id;})[0];
          return np?t('kron_t04_c1_outcome').replace('{name}',np.name).replace('{pos}',np.pos).replace('{age}',np.age).replace('{ovr}',ovr(np)):t('kron_t04_c1_outcome_fallback');
        }},
       {label:t('kron_t04_c2_label'),
        effect:function(){
          if(!G.academy||G.academy.level<1){notif(t('kron_t04_c2_notif_noacademy'),'err');return;}
          const pos2=kron.flags._t04pos||'POL';
          const ageT2=kron.flags._t04age||18;
          const ovrT2=(kron.flags._t04ovr||42)+5;
          const np=mkPlayer(0);
          np.pos=pos2;np.age=ageT2;
          const attrs=['tec','pas','sht','def','phy','men'];
          const diff=ovrT2-ovr(np);
          if(diff>0)attrs.forEach(function(a){np[a]=Math.min(99,np[a]+Math.ceil(diff/6));});
          np.potential=Math.min(99,calcPotential(np,G.myLeague||8)+5);
          np.fromAcademy=true;np.clubId=G.myClubId;
          if(!G.academy.prospects)G.academy.prospects=[];
          G.academy.prospects.push(np);
          addNews(t('kron_t04_c2_news').replace('{name}',np.name),'academy');
        },
        outcome:function(){
          const np=(G.academy&&G.academy.prospects||[]).slice(-1)[0];
          return np?t('kron_t04_c2_outcome').replace('{name}',np.name).replace('{pos}',np.pos).replace('{pot}',np.potential):t('kron_t04_c2_outcome_fallback');
        }},
       {label:t('kron_t04_c3_label'),
        effect:function(){
          const pos2=kron.flags._t04pos||'POL';
          const np=mkPlayer(0);np.pos=pos2;
          // Zamknięty świat: odrzucony talent trafia do realnego, pobliskiego klubu — nie
          // znika w pustce puli FA (usuniętej, patrz js/CLAUDE.md).
          const dest=kronFindDestinationClub(np,{});
          if(dest){
            const destLvl=(G.leagues.find(function(l){return l.clubs.some(function(c){return c.id===dest.id;});})||{level:8}).level;
            np.clubId=dest.id;np.contract=r(1,3);np.starter=false;
            np.value=calcValue(ovr(np),np.age);np.salary=calcSalary(np.value,destLvl,ovr(np));
            if(!np.history)np.history=[];
            np.history.push({season:G.season,clubId:dest.id,club:dest.n,m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(np),avgRat:null,_current:true});
            G.players.push(np);
            if(dest.ai){
              if(!dest.ai.transferLog)dest.ai.transferLog=[];
              dest.ai.transferLog.unshift({type:'buy',name:np.name,pos:np.pos,ovr:ovr(np),age:np.age,price:0,season:G.season,playerId:np.id,fromClub:null});
              if(dest.ai.transferLog.length>20)dest.ai.transferLog.pop();
            }
          }
        },
        outcome:function(){return t('kron_t04_c3_outcome');}},
     ]},

    // M-01: Sponsor chce nazwy na stadionie
    {id:'m01_stadium_sponsor', category:t('kron_cat_club'),
     weight:function(){return (G.season>=2&&(G.reputation||0)>=80&&!kron.flags._stadSponsorDone)?15:0;},
     title:t('kron_m01_title'),
     body:function(){return t('kron_m01_body');},
     choices:[
       {label:t('kron_m01_c1_label'),
        effect:function(){
          G.budget+=50000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:50000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_m01_stadium_sponsor_a')});G.reputation=Math.max(0,(G.reputation||30)-15);
          kron.flags._stadSponsorDone=true;
          addNews(t('kron_m01_c1_news'),'budget');
        },
        outcome:function(){return t('kron_m01_c1_outcome').replace('{val}',fmtVal(G.budget)).replace('{rep}',G.reputation||0);}},
       {label:t('kron_m01_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;kron.flags._stadSponsorDone=true;},
        outcome:function(){return t('kron_m01_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_m01_c3_label'),
        effect:function(){
          kron.flags._m01budgetBefore=G.budget;
          if(Math.random()<0.70){G.budget+=30000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:30000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_m01_stadium_sponsor_b')});addNews(t('kron_m01_c3_news_win'),'budget');}
          else{addNews(t('kron_m01_c3_news_lose'),'club');}
          kron.flags._stadSponsorDone=true;
        },
        outcome:function(){
          const gotMoney=G.budget>=(kron.flags._m01budgetBefore||0)+25000;
          return gotMoney?t('kron_m01_c3_outcome_win').replace('{val}',fmtVal(G.budget)):t('kron_m01_c3_outcome_lose');
        }},
     ]},

    // SP-05: Sędzia popełnił błąd
    {id:'sp05_ref_error', category:t('kron_cat_sporting'),
     weight:function(){
       const lastM=G.mHist&&G.mHist.length?G.mHist[G.mHist.length-1]:null;
       if(!lastM)return 0;
       const myStr=tStr(G.myClubId);
       const oppStr=lastM.isMyH?tStr(lastM.an?((G.leagues||[]).flatMap(l=>l.clubs||[]).find(c=>c.n===lastM.an)||{id:0}).id:0):tStr(lastM.hn?((G.leagues||[]).flatMap(l=>l.clubs||[]).find(c=>c.n===lastM.hn)||{id:0}).id:0);
       const lost=(lastM.isMyH?(lastM.hg<lastM.ag):(lastM.ag<lastM.hg));
       return (lost&&myStr>oppStr+8)?28:0;
     },
     title:t('kron_sp05_title'),
     body:function(){
       const lastM=G.mHist&&G.mHist.length?G.mHist[G.mHist.length-1]:null;
       return t('kron_sp05_body').replace('{match}',lastM?'('+lastM.hn+' vs '+lastM.an+')':'');
     },
     choices:[
       {label:t('kron_sp05_c1_label'),
        effect:function(){
          kron.flags._sp05budgetBefore=G.budget;kron.flags._sp05repBefore=G.reputation||30;
          if(Math.random()<0.30){G.reputation=(G.reputation||30)+10;addNews(t('kron_sp05_c1_news_win'),'ok');}
          else{G.budget=Math.max(0,G.budget-3000);addNews(t('kron_sp05_c1_news_lose'),'err');}
        },
        outcome:function(){
          const repGrew=(G.reputation||0)>(kron.flags._sp05repBefore||0);
          return repGrew?t('kron_sp05_c1_outcome_win').replace('{rep}',G.reputation||0):t('kron_sp05_c1_outcome_lose').replace('{val}',fmtVal(G.budget));
        }},
       {label:t('kron_sp05_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_sp05_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_sp05_c3_label'),
        effect:function(){
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+2);});
        },
        outcome:function(){return t('kron_sp05_c3_outcome').replace('{n}',starters.length);}},
     ]},

    // SP-01: Tajemniczy skaut na treningu
    {id:'sp01_mystery_scout', category:t('kron_cat_sporting'),
     weight:function(){
       const w=my.filter(function(p){return p.fromAcademy&&ovr(p)>=52;});
       return w.length>=1?20:0;
     },
     title:t('kron_sp01_title'),
     body:function(){
       const w=my.filter(function(p){return p.fromAcademy&&ovr(p)>=52;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._sp01pid=w?w.id:-1;
       return t('kron_sp01_body').replace('{name}',w?w.name:t('kron_sp01_fallback_name')).replace('{ovr}',w?ovr(w):'?');
     },
     choices:[
       {label:t('kron_sp01_c1_label'),
        effect:function(){
          kron.flags._sp01offerWeek=(G.round||1)+2;
          addNews(t('kron_sp01_c1_news'),'scout');
        },
        outcome:function(){return t('kron_sp01_c1_outcome');}},
       {label:t('kron_sp01_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp01_c2_outcome');}},
       {label:t('kron_sp01_c3_label'),
        effect:function(){
          if(Math.random()<0.40){
            const tr=G.players.find(function(p){return p.id===kron.flags._sp01pid;});
            if(tr){
              const offerVal=Math.round((tr.value||30000)*1.20/1000)*1000;
              kron.flags._sp01autoOffer={pid:tr.id,val:offerVal};
              addNews(t('kron_sp01_c3_news').replace('{val}',fmtVal(offerVal)).replace('{name}',tr.name),'budget');
            }
          }
        },
        outcome:function(){
          if(kron.flags._sp01autoOffer){
            const tr=G.players.find(function(p){return p.id===kron.flags._sp01autoOffer.pid;});
            return t('kron_sp01_c3_outcome_offer').replace('{name}',tr?tr.name:t('kron_fallback_player')).replace('{val}',fmtVal(kron.flags._sp01autoOffer.val));
          }
          return t('kron_sp01_c3_outcome_none');
        }},
     ]},

    // K-07: Nagroda — mecz towarzyski za granicą
    {id:'sp06_friendly_abroad', category:t('kron_cat_sporting'),
     weight:function(){return (G.round>=8&&G.round<=20&&!kron.usedThisSeason.includes('sp06_friendly_abroad'))?10:0;},
     title:t('kron_sp06_title'),
     body:function(){return t('kron_sp06_body');},
     choices:[
       {label:t('kron_sp06_c1_label'),
        effect:function(){
          G.budget+=10000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:10000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_sp06_friendly_abroad_a')});
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          addNews(t('kron_sp06_c1_news'),'club');
        },
        outcome:function(){return t('kron_sp06_c1_outcome');}},
       {label:t('kron_sp06_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_sp06_c2_outcome');}},
       {label:t('kron_sp06_c3_label'),
        effect:function(){
          G.budget+=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:5000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_sp06_friendly_abroad_b')});
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+2);});
          addNews(t('kron_sp06_c3_news'),'club');
        },
        outcome:function(){return t('kron_sp06_c3_outcome');}},
     ]},

    // ── GRUPA 1 ─────────────────────────────────────────────────────────

    // S-02: Bunt kapitana
    {id:'s02_captain_dispute', category:t('kron_cat_locker'),
     weight:function(){
       const hist=G.mHist||[];
       if(hist.length<3)return 0;
       const last3=hist.slice(-3);
       const allLost=last3.every(function(m){
         return m.isMyH?(m.hg<m.ag):(m.ag<m.hg);
       });
       if(!allLost)return 0;
       const captain=starters.slice().sort(function(a,b){return ovr(b)-ovr(a);})[0];
       if(!captain||ovr(captain)<58)return 0;
       return 30;
     },
     title:t('kron_s02_title'),
     body:function(){
       const captain=starters.slice().sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._s02captainId=captain?captain.id:-1;
       const loseStr=(G.mHist||[]).slice(-3).length;
       return t('kron_s02_body').replace('{name}',captain?captain.name:t('kron_s02_fallback_captain')).replace('{ovr}',captain?ovr(captain):'?').replace('{n}',loseStr);
     },
     choices:[
       {label:t('kron_s02_c1_label'),
        effect:function(){
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          if(cap)cap.form=Math.min(100,(cap.form||80)+5);
          const midDef=starters.filter(function(p){return p.pos==='OBR'||p.pos==='POL';}).slice(0,2);
          midDef.forEach(function(p){p.form=Math.max(40,(p.form||80)-5);});
          addNews(t('kron_s02_c1_news').replace('{name}',cap?cap.name:t('kron_s02_fallback_captain_short')),'club');
        },
        outcome:function(){
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          return t('kron_s02_c1_outcome')+' '+(cap?t('kron_s02_c1_outcome_suffix').replace('{name}',cap.name):'');
        }},
       {label:t('kron_s02_c2_label'),
        effect:function(){
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          G.reputation=Math.max(0,(G.reputation||30)-10);
          if(cap){cap.form=Math.max(15,(cap.form||80)-15);cap._benchWeeks=(cap._benchWeeks||0)+2;}
          addNews(t('kron_s02_c2_news').replace('{name}',cap?cap.name:t('kron_s02_fallback_captain_dat')),'err');
        },
        outcome:function(){
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          return t('kron_s02_c2_outcome').replace('{rep}',G.reputation||0)+' '+(cap?t('kron_s02_c2_outcome_suffix').replace('{name}',cap.name).replace('{form}',cap.form):'');
        }},
       {label:t('kron_s02_c3_label'),
        effect:function(){
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          if(Math.random()<0.55){
            starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
            addNews(t('kron_s02_c3_news_win'),'ok');
            kron.flags._s02result='win';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-5);
            if(cap)cap.form=Math.min(100,(cap.form||80)+8);
            starters.filter(function(p){return p.id!==kron.flags._s02captainId;}).forEach(function(p){p.form=Math.max(40,(p.form||80)-5);});
            addNews(t('kron_s02_c3_news_lose').replace('{name}',cap?cap.name:t('kron_s02_fallback_captain_inst')),'err');
            kron.flags._s02result='lose';
          }
        },
        outcome:function(){
          if(kron.flags._s02result==='win')return t('kron_s02_c3_outcome_win');
          return t('kron_s02_c3_outcome_lose');
        }},
     ]},

    // S-03: Pożegnanie legendy
    {id:'s03_veteran_farewell', category:t('kron_cat_locker'),
     weight:function(){
       const legend=myPl().find(function(p){
         return (p.age||25)>=34&&(p._seasonsAtClub||0)>=2&&!p.injured;
       });
       return legend?20:0;
     },
     title:t('kron_s03_title'),
     body:function(){
       const legend=myPl().filter(function(p){
         return (p.age||25)>=34&&(p._seasonsAtClub||0)>=2&&!p.injured;
       }).sort(function(a,b){return (b._seasonsAtClub||0)-(a._seasonsAtClub||0);})[0];
       kron.flags._s03legendId=legend?legend.id:-1;
       const seas=legend?(legend._seasonsAtClub||2):2;
       return t('kron_s03_body').replace('{name}',legend?legend.name:t('kron_t05_fallback_name')).replace('{age}',legend?legend.age:'?').replace('{seasons}',seas);
     },
     choices:[
       {label:t('kron_s03_c1_label'),
        effect:function(){
          if(G.budget<5000){notif(t('kron_s03_c1_notif_nobudget'),'err');kron.flags._s03result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:t('kron_note_s03_veteran_farewell')});
          G.reputation=(G.reputation||30)+15;
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          if(leg)leg.form=Math.min(100,(leg.form||80)+10);
          addNews(t('kron_s03_c1_news'),'ok');
          kron.flags._s03result='ceremony';
        },
        outcome:function(){
          if(kron.flags._s03result==='noBudget')return t('kron_s03_c1_outcome_nobudget');
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          return t('kron_s03_c1_outcome').replace('{rep}',G.reputation||0)+' '+(leg?t('kron_s03_c1_outcome_suffix').replace('{name}',leg.name).replace('{form}',leg.form):'');
        }},
       {label:t('kron_s03_c2_label'),
        effect:function(){kron.flags._s03result='silent';},
        outcome:function(){
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          return t('kron_s03_c2_outcome').replace('{name}',leg?leg.name:t('kron_fallback_player'));
        }},
       {label:t('kron_s03_c3_label'),
        effect:function(){
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          if(!leg){kron.flags._s03result='noPlayer';return;}
          if(Math.random()<0.50){
            leg.contract=(leg.contract||1)+1;
            leg._seasonsAtClub=(leg._seasonsAtClub||2)+1;
            leg.form=Math.min(100,(leg.form||80)+5);
            addNews(t('news_tr_legend_extend').replace('{name}',leg.name),'ok');
            kron.flags._s03result='extended';
          } else {
            leg.form=Math.max(30,(leg.form||80)-8);
            G.reputation=Math.max(0,(G.reputation||30)-5);
            addNews(t('news_tr_legend_reject').replace('{name}',leg.name),'err');
            kron.flags._s03result='refused';
          }
        },
        outcome:function(){
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          if(kron.flags._s03result==='extended')return t('kron_s03_c3_outcome_extended').replace('{name}',leg?leg.name:t('kron_fallback_player'));
          if(kron.flags._s03result==='refused')return t('kron_s03_c3_outcome_refused').replace('{name}',leg?leg.name:t('kron_fallback_player'));
          return t('kron_s03_c3_outcome_noplayer');
        }},
     ]},

    // S-05: Przeciek z szatni
    {id:'s05_locker_room_leak', category:t('kron_cat_locker'),
     weight:function(){
       return (G.round>5&&starters.length>=8)?18:0;
     },
     title:t('kron_s05_title'),
     body:function(){
       const suspects=starters.filter(function(p){return (p._benchWeeks||0)>=1||ovr(p)<55;});
       const suspect=suspects.length?suspects[Math.floor(Math.random()*suspects.length)]:starters[Math.floor(Math.random()*starters.length)];
       kron.flags._s05suspectId=suspect?suspect.id:-1;
       return t('kron_s05_body');
     },
     choices:[
       {label:t('kron_s05_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');kron.flags._s05result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_s05_locker_room_leak')});
          G.reputation=Math.max(0,(G.reputation||30)-5);
          const suspect=G.players.find(function(p){return p.id===kron.flags._s05suspectId;});
          if(Math.random()<0.60&&suspect){
            suspect.form=Math.max(20,(suspect.form||80)-10);
            suspect.starter=false;
            addNews(t('kron_s05_c1_news_found').replace('{name}',suspect.name),'err');
            kron.flags._s05result='found';
            kron.flags._s05culpritName=suspect.name;
          } else {
            starters.forEach(function(p){p.form=Math.max(40,(p.form||80)-3);});
            addNews(t('kron_s05_c1_news_notfound'),'err');
            kron.flags._s05result='notFound';
          }
        },
        outcome:function(){
          if(kron.flags._s05result==='noBudget')return t('kron_s05_c1_outcome_nobudget');
          if(kron.flags._s05result==='found')return t('kron_s05_c1_outcome_found').replace('{name}',kron.flags._s05culpritName||'?');
          return t('kron_s05_c1_outcome_notfound');
        }},
       {label:t('kron_s05_c2_label'),
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-8);
          addNews(t('kron_s05_c2_news'),'club');
          kron.flags._s05result='ignored';
        },
        outcome:function(){
          return t('kron_s05_c2_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_s05_c3_label'),
        effect:function(){
          G.reputation=(G.reputation||30)+5;
          const suspect=G.players.find(function(p){return p.id===kron.flags._s05suspectId;});
          if(suspect)suspect.form=Math.max(30,(suspect.form||80)-5);
          addNews(t('kron_s05_c3_news'),'ok');
          kron.flags._s05result='transparent';
          kron.flags._s05culpritName=suspect?suspect.name:'';
        },
        outcome:function(){
          const name=kron.flags._s05culpritName;
          return t('kron_s05_c3_outcome').replace('{rep}',G.reputation||0)+' '+(name?t('kron_s05_c3_outcome_suffix').replace('{name}',name):'');
        }},
     ]},

    // ── GRUPA 2 ─────────────────────────────────────────────────────────

    // T-02: Agent żąda podwyżki
    {id:'t02_agent_pressure', category:t('kron_cat_transfers'),
     weight:function(){
       if((G.season||1)<2)return 0;
       const star=starters.find(function(p){return ovr(p)>=62;});
       return star?28:0;
     },
     title:t('kron_t02_title'),
     body:function(){
       const star=starters.filter(function(p){return ovr(p)>=62;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._t02starId=star?star.id:-1;
       const ask=star?Math.round((star.value||50000)*0.25/1000)*1000:15000;
       kron.flags._t02ask=ask;
       return t('kron_t02_body').replace('{name}',star?star.name:t('kron_fallback_best_player')).replace('{ovr}',star?ovr(star):'?').replace('{ask}',fmtVal(ask));
     },
     choices:[
       {label:t('kron_t02_c1_label'),
        effect:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          const ask=kron.flags._t02ask||15000;
          if(G.budget<ask){notif(t('kron_t02_notif_no_budget_raise'),'err');kron.flags._t02result='noBudget';return;}
          G.budget-=ask;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:ask,bal:G.budget,season:G.season,note:t('kron_note_t02_agent_pressure')});
          if(star){star.form=Math.min(100,(star.form||80)+5);star._loyaltyBonus=true;star.contract=Math.max(star.contract||1,3);}
          addNews(t('news_tr_signed_raise').replace('{name}',star?star.name:t('kron_fallback_player')).replace('{val}',fmtVal(ask)),'budget');
          kron.flags._t02result='paid';
        },
        outcome:function(){
          if(kron.flags._t02result==='noBudget')return t('kron_t02_c1_outcome_nobudget');
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          return t('kron_t02_c1_outcome_paid').replace('{val}',fmtVal(kron.flags._t02ask||0))+' '+(star?t('kron_t02_c1_outcome_paid_suffix').replace('{name}',star.name):'');
        }},
       {label:t('kron_t02_c2_label'),
        effect:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          if(star){star.form=Math.max(20,(star.form||80)-10);star._wantsOut=true;}
          addNews(t('kron_t02_c2_news').replace('{name}',star?star.name:t('kron_fallback_player')),'err');
          kron.flags._t02result='refused';
        },
        outcome:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          return t('kron_t02_c2_outcome').replace('{name}',star?star.name:t('kron_fallback_player')).replace('{form}',star?star.form:'?');
        }},
       {label:t('kron_t02_c3_label'),
        effect:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          if(Math.random()<0.50){
            if(star)star.form=Math.min(100,(star.form||80)+2);
            addNews(t('news_tr_bluff_works').replace('{name}',star?star.name:t('kron_fallback_player')),'ok');
            kron.flags._t02result='bluffWin';
          } else {
            if(star){star.form=Math.max(15,(star.form||80)-12);star._wantsOut=true;}
            addNews(t('news_tr_bluff_fails').replace('{name}',star?star.name:t('kron_fallback_player')),'err');
            kron.flags._t02result='bluffLose';
          }
        },
        outcome:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          if(kron.flags._t02result==='bluffWin')return t('kron_t02_c3_outcome_win').replace('{name}',star?star.name:t('kron_fallback_player'));
          return t('kron_t02_c3_outcome_lose').replace('{name}',star?star.name:t('kron_fallback_player')).replace('{form}',star?star.form:'?');
        }},
     ]},

    // T-05: Okazja — nadwyżka u rywala (zamknięty świat: zamiast anonimowego wolnego agenta,
    // konkretny nazwany zawodnik z nadwyżki realnego klubu AI — patrz kronFindSurplusPlayer).
    {id:'t05_bargain_release', category:t('kron_cat_transfers'),
     weight:function(){
       const gem=kronFindSurplusPlayer(60,99,30);
       return (gem&&G.budget>=15000)?22:0;
     },
     title:t('kron_t05_title'),
     body:function(){
       const found=kronFindSurplusPlayer(60,99,30);
       kron.flags._t05gemId=found?found.player.id:-1;
       kron.flags._t05fromClubId=found?found.fromClub.id:-1;
       const gem=found?found.player:null;
       const cost=gem?kronAffordablePrice(Math.round((gem.value||40000)*0.50/1000)*1000,0.55):20000;
       kron.flags._t05cost=cost;
       kron.flags._t05cheapCost=Math.round(cost*0.60/1000)*1000;
       return t('kron_t05_body').replace('{name}',gem?gem.name:t('kron_t05_fallback_name')).replace('{pos}',gem?gem.pos:'?').replace('{ovr}',gem?ovr(gem):'?').replace('{age}',gem?gem.age:'?').replace('{cost}',fmtVal(cost)).replace('{club}',found?found.fromClub.n:'?');
     },
     choices:[
       {label:t('kron_t05_c1_label'),
        effect:function(){
          const gem=G.players.find(function(p){return p.id===kron.flags._t05gemId;});
          const fromClub=ALL_CLUBS.find(function(c){return c.id===kron.flags._t05fromClubId;});
          const cost=kron.flags._t05cost||20000;
          if(!gem||!fromClub||gem.clubId!==fromClub.id){kron.flags._t05result='gone';return;}
          if(G.budget<cost){notif(t('kron_notif_no_budget'),'err');kron.flags._t05result='noBudget';return;}
          G.budget-=cost;
          kronTransferIn(gem,fromClub);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:gem.name,val:cost,fee:cost,week:G.week,season:G.season});
          addNews(t('news_tr_gem_signed').replace('{name}',gem.name).replace('{ovr}',ovr(gem)).replace('{val}',fmtVal(cost)),'budget');
          kron.flags._t05result='signed';kron.flags._t05name=gem.name;kron.flags._t05ovr=ovr(gem);
        },
        outcome:function(){
          if(kron.flags._t05result==='gone')return t('kron_t05_c1_outcome_gone');
          if(kron.flags._t05result==='noBudget')return t('kron_t05_c1_outcome_nobudget');
          return t('kron_t05_c1_outcome').replace('{name}',kron.flags._t05name||t('kron_fallback_player')).replace('{ovr}',kron.flags._t05ovr||'?').replace('{val}',fmtVal(kron.flags._t05cost||0));
        }},
       {label:t('kron_t05_c2_label'),
        effect:function(){
          const gem=G.players.find(function(p){return p.id===kron.flags._t05gemId;});
          const fromClub=ALL_CLUBS.find(function(c){return c.id===kron.flags._t05fromClubId;});
          const cheapCost=kron.flags._t05cheapCost||12000;
          if(!gem||!fromClub||gem.clubId!==fromClub.id){kron.flags._t05result='gone';return;}
          if(Math.random()<0.70){
            if(G.budget<cheapCost){notif(t('kron_t05_c2_notif_nobudget'),'err');kron.flags._t05result='noBudget';return;}
            G.budget-=cheapCost;
            kronTransferIn(gem,fromClub);
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'buy',name:gem.name,val:cheapCost,fee:cheapCost,week:G.week,season:G.season});
            addNews(t('news_tr_gem_nego').replace('{name}',gem.name).replace('{val}',fmtVal(cheapCost)),'budget');
            kron.flags._t05result='negotiated';kron.flags._t05name=gem.name;kron.flags._t05ovr=ovr(gem);
          } else {
            // Negocjacje padły — zawodnik zostaje u siebie, nic więcej się nie dzieje.
            addNews(t('news_tr_gem_rejected').replace('{name}',gem.name),'err');
            kron.flags._t05result='walkaway';kron.flags._t05name=gem.name;
          }
        },
        outcome:function(){
          if(kron.flags._t05result==='gone')return t('kron_t05_c23_outcome_gone');
          if(kron.flags._t05result==='noBudget')return t('kron_t05_c2_outcome_nobudget');
          if(kron.flags._t05result==='negotiated')return t('kron_t05_c2_outcome_win').replace('{name}',kron.flags._t05name||t('kron_fallback_player')).replace('{val}',fmtVal(kron.flags._t05cheapCost||0));
          return t('kron_t05_c2_outcome_lose').replace('{name}',kron.flags._t05name||t('kron_fallback_player'));
        }},
       {label:t('kron_t05_c3_label'),
        effect:function(){
          const gem=G.players.find(function(p){return p.id===kron.flags._t05gemId;});
          const fromClub=ALL_CLUBS.find(function(c){return c.id===kron.flags._t05fromClubId;});
          if(!gem||!fromClub||gem.clubId!==fromClub.id){kron.flags._t05result='gone';return;}
          if(Math.random()<0.40){
            kronTransferIn(gem,fromClub);
            gem.contract=2;
            gem.form=Math.min(100,(gem.form||80)-5);
            addNews(t('news_tr_gem_trial_ok').replace('{name}',gem.name),'ok');
            kron.flags._t05result='trial';kron.flags._t05name=gem.name;
          } else {
            addNews(t('news_tr_gem_trial_no').replace('{name}',gem.name),'err');
            kron.flags._t05result='trialFail';kron.flags._t05name=gem.name;
          }
        },
        outcome:function(){
          if(kron.flags._t05result==='gone')return t('kron_t05_c23_outcome_gone');
          if(kron.flags._t05result==='trial')return t('kron_t05_c3_outcome_win').replace('{name}',kron.flags._t05name||t('kron_fallback_player'));
          return t('kron_t05_c3_outcome_lose').replace('{name}',kron.flags._t05name||t('kron_fallback_player'));
        }},
     ]},

    // T-06: Licytacja z rywalem — nadwyżka u realnego klubu AI (patrz T-05, ta sama zasada).
    // "Przegrana" licytacja teraz faktycznie przenosi zawodnika do G.rival (realny klub), nie
    // usuwa go bez śladu.
    {id:'t06_bidding_war', category:t('kron_cat_transfers'),
     weight:function(){
       if(!G.rival)return 0;
       const target=kronFindSurplusPlayer(55,99,28);
       return (target&&G.budget>=20000)?25:0;
     },
     title:t('kron_t06_title'),
     body:function(){
       const found=kronFindSurplusPlayer(55,99,28);
       kron.flags._t06targetId=found?found.player.id:-1;
       kron.flags._t06fromClubId=found?found.fromClub.id:-1;
       const target=found?found.player:null;
       // 0.45 nie 0.6 jak w T-05: "high" (c1, poniżej) to 1.2× base, więc zostaw zapas.
       const base=target?kronAffordablePrice(Math.round((target.value||35000)*0.65/1000)*1000,0.45):25000;
       kron.flags._t06base=base;
       kron.flags._t06high=Math.round(base*1.20/1000)*1000;
       kron.flags._t06cheap=Math.round(base*0.55/1000)*1000;
       const rivalName=(G.rival&&G.rival.n)||t('kron_fallback_rival');
       return t('kron_t06_body').replace('{name}',target?target.name:t('kron_t06_fallback_name')).replace('{ovr}',target?ovr(target):'?').replace('{rival}',rivalName).replace('{base}',fmtVal(base));
     },
     choices:[
       {label:t('kron_t06_c1_label'),
        effect:function(){
          const target=G.players.find(function(p){return p.id===kron.flags._t06targetId;});
          const fromClub=ALL_CLUBS.find(function(c){return c.id===kron.flags._t06fromClubId;});
          const high=kron.flags._t06high||30000;
          if(!target||!fromClub||target.clubId!==fromClub.id){kron.flags._t06result='gone';return;}
          if(G.budget<high){notif(t('kron_t06_c1_notif_nobudget'),'err');kron.flags._t06result='noBudget';return;}
          G.budget-=high;
          kronTransferIn(target,fromClub);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:target.name,val:high,fee:high,week:G.week,season:G.season});
          addNews(t('news_tr_auction_win').replace('{name}',target.name).replace('{val}',fmtVal(high)),'budget');
          kron.flags._t06result='won';kron.flags._t06name=target.name;kron.flags._t06ovr=ovr(target);
        },
        outcome:function(){
          if(kron.flags._t06result==='gone')return t('kron_t06_c1_outcome_gone');
          if(kron.flags._t06result==='noBudget')return t('kron_t06_c1_outcome_nobudget');
          return t('kron_t06_c1_outcome_win').replace('{name}',kron.flags._t06name||t('kron_fallback_player')).replace('{ovr}',kron.flags._t06ovr||'?').replace('{val}',fmtVal(kron.flags._t06high||0));
        }},
       {label:t('kron_t06_c2_label'),
        effect:function(){
          const target=G.players.find(function(p){return p.id===kron.flags._t06targetId;});
          const fromClub=ALL_CLUBS.find(function(c){return c.id===kron.flags._t06fromClubId;});
          if(target&&fromClub&&target.clubId===fromClub.id&&G.rival&&G.rival.ai&&G.rival.id!==fromClub.id){
            const price=Math.round((target.value||35000)*0.65/1000)*1000;
            aiTransferPlayer(target,fromClub,G.rival,price,G.season,false);
            if(G.rival.strength!==undefined)G.rival.strength=(G.rival.strength||50)+3;
            addNews(t('news_tr_to_rival').replace('{name}',target.name||t('kron_t06_fallback_freeagent')).replace('{rival}',G.rival.n||t('kron_t06_fallback_rival_gen')),'err');
          }
          kron.flags._t06result='lost';kron.flags._t06name=target?target.name:t('kron_fallback_player');
        },
        outcome:function(){
          const rivalName=(G.rival&&G.rival.n)||t('kron_fallback_rival');
          return t('kron_t06_c2_outcome').replace('{name}',kron.flags._t06name||t('kron_fallback_player')).replace('{rival}',rivalName);
        }},
       {label:t('kron_t06_c3_label'),
        effect:function(){
          const target=G.players.find(function(p){return p.id===kron.flags._t06targetId;});
          const fromClub=ALL_CLUBS.find(function(c){return c.id===kron.flags._t06fromClubId;});
          const cheap=kron.flags._t06cheap||18000;
          if(!target||!fromClub||target.clubId!==fromClub.id){kron.flags._t06result='gone';return;}
          if(Math.random()<0.30){
            if(G.budget<cheap){notif(t('kron_notif_no_budget'),'err');kron.flags._t06result='noBudget';return;}
            G.budget-=cheap;
            kronTransferIn(target,fromClub);
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'buy',name:target.name,val:cheap,fee:cheap,week:G.week,season:G.season});
            addNews(t('news_tr_backstage_win').replace('{name}',target.name).replace('{val}',fmtVal(cheap)),'ok');
            kron.flags._t06result='sneaky';kron.flags._t06name=target.name;
          } else {
            if(G.rival&&G.rival.ai&&G.rival.id!==fromClub.id){
              const price=Math.round((target.value||35000)*0.65/1000)*1000;
              aiTransferPlayer(target,fromClub,G.rival,price,G.season,false);
              if(G.rival.strength!==undefined)G.rival.strength=(G.rival.strength||50)+2;
            }
            G.reputation=Math.max(0,(G.reputation||30)-5);
            addNews(t('news_tr_backstage_lose').replace('{name}',target.name||t('kron_fallback_player')),'err');
            kron.flags._t06result='sneakyFail';kron.flags._t06name=target?target.name:t('kron_fallback_player');
          }
        },
        outcome:function(){
          if(kron.flags._t06result==='gone')return t('kron_t06_c3_outcome_gone');
          if(kron.flags._t06result==='noBudget')return t('kron_t06_c3_outcome_nobudget');
          if(kron.flags._t06result==='sneaky')return t('kron_t06_c3_outcome_win').replace('{name}',kron.flags._t06name||t('kron_fallback_player')).replace('{val}',fmtVal(kron.flags._t06cheap||0));
          return t('kron_t06_c3_outcome_lose').replace('{name}',kron.flags._t06name||t('kron_fallback_player_acc')).replace('{rep}',G.reputation||0);
        }},
     ]},

    // ── PRIORYTET 1 — ŁAŃCUCHY ──────────────────────────────────────────

    // K-04: Gwiazda chce odejść (łańcuch z t02_agent_pressure / t01_big_offer)
    {id:'k04_wantsout_crisis', category:t('kron_cat_crisis'),
     weight:function(){
       // Trigger: jakikolwiek zawodnik ma flagę _wantsOut=true
       const rebel=myPl().find(function(p){return p._wantsOut;});
       return rebel?40:0;
     },
     title:t('kron_k04_title'),
     body:function(){
       const rebel=myPl().filter(function(p){return p._wantsOut;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._k04rebelId=rebel?rebel.id:-1;
       const offerVal=rebel?Math.round((rebel.value||50000)*1.30/1000)*1000:0;
       kron.flags._k04offerVal=offerVal;
       return t('kron_k04_body').replace('{name}',rebel?rebel.name:t('kron_fallback_player')).replace('{ovr}',rebel?ovr(rebel):'?').replace('{val}',fmtVal(offerVal));
     },
     choices:[
       {label:t('kron_k04_c1_label'),
        effect:function(){
          const rebel=G.players.find(function(p){return p.id===kron.flags._k04rebelId;});
          const val=kron.flags._k04offerVal||0;
          if(!rebel){kron.flags._k04result='gone';return;}
          G.budget+=val;
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'sell',name:rebel.name,val:val,week:G.week,season:G.season});
          addNews(t('kron_k04_c1_news').replace('{name}',rebel.name).replace('{val}',fmtVal(val)),'budget');
          rebel._wantsOut=false;
          // Zamknięty świat: buntownik trafia do realnego klubu, nie do puli FA.
          const rebelDest=kronFindDestinationClub(rebel,{});
          if(rebelDest)kronTransferOut(rebel,rebelDest);
          kron.flags._k04result='sold';kron.flags._k04name=rebel.name;kron.flags._k04val=val;
        },
        outcome:function(){
          if(kron.flags._k04result==='gone')return t('kron_k04_c1_outcome_gone');
          return t('kron_k04_c1_outcome').replace('{name}',kron.flags._k04name||t('kron_fallback_player')).replace('{val}',fmtVal(kron.flags._k04val||0));
        }},
       {label:t('kron_k04_c2_label'),
        effect:function(){
          const rebel=G.players.find(function(p){return p.id===kron.flags._k04rebelId;});
          if(!rebel){kron.flags._k04result='gone';return;}
          if(Math.random()<0.60){
            rebel._wantsOut=false;
            rebel.form=Math.min(100,(rebel.form||80)+10);
            rebel.contract=Math.max(rebel.contract||1,3);
            // Stary kapitan (najwyższe OVR poza rebeliantem) traci morale
            const oldCap=myPl().filter(function(p){return p.id!==rebel.id&&p.starter;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
            if(oldCap)oldCap.form=Math.max(40,(oldCap.form||80)-8);
            addNews(t('kron_k04_c2_news_win').replace('{name}',rebel.name),'ok');
            kron.flags._k04result='captain';
          } else {
            rebel.form=Math.max(10,(rebel.form||80)-15);
            addNews(t('kron_k04_c2_news_lose').replace('{name}',rebel.name),'err');
            kron.flags._k04result='captainFail';
          }
          kron.flags._k04name=rebel.name;
        },
        outcome:function(){
          const rebel=G.players.find(function(p){return p.id===kron.flags._k04rebelId;});
          if(kron.flags._k04result==='captain')return t('kron_k04_c2_outcome_win').replace('{name}',kron.flags._k04name||t('kron_fallback_player'));
          if(kron.flags._k04result==='captainFail')return t('kron_k04_c2_outcome_lose').replace('{name}',kron.flags._k04name||t('kron_fallback_player')).replace('{form}',rebel?rebel.form:'?');
          return t('kron_k04_c2_outcome_gone');
        }},
       {label:t('kron_k04_c3_label'),
        effect:function(){
          const rebel=G.players.find(function(p){return p.id===kron.flags._k04rebelId;});
          // Zatruwa atmosferę — cały skład traci formę
          myPl().forEach(function(p){p.form=Math.max(30,(p.form||80)-5);});
          if(rebel)rebel.form=Math.max(10,(rebel.form||80)-10);
          G.reputation=Math.max(0,(G.reputation||30)-8);
          addNews(t('kron_k04_c3_news').replace('{name}',rebel?rebel.name:t('kron_fallback_player')),'err');
          kron.flags._k04result='ignored';kron.flags._k04name=rebel?rebel.name:t('kron_fallback_player');
        },
        outcome:function(){
          return t('kron_k04_c3_outcome').replace('{name}',kron.flags._k04name||t('kron_fallback_player'));
        }},
     ]},

    // S-07: Impreza znowu (łańcuch z s01_party_scandal opcja C)
    {id:'s07_scandal_repeat', category:t('kron_cat_locker'),
     weight:function(){
       // Trigger: flaga _s01canRepeat ustawiona gdy gracz ignorował pierwszą imprezę
       return kron.flags._s01canRepeat?35:0;
     },
     title:t('kron_s07_title'),
     body:function(){
       // Ci sami winowajcy co poprzednio (lub losowi starterzy)
       const prev=kron.flags._s01pids||[];
       const picks=prev.length?
         prev.map(function(id){return G.players.find(function(p){return p.id===id;});}).filter(Boolean):
         starters.slice().sort(function(){return Math.random()-0.5;}).slice(0,3);
       kron.flags._s07pids=picks.map(function(p){return p.id;});
       const names=picks.map(function(p){return p.name.split(' ')[1]||p.name;}).join(', ');
       return t('kron_s07_body').replace('{names}',names);
     },
     choices:[
       {label:t('kron_s07_c1_label'),
        effect:function(){
          (kron.flags._s07pids||[]).forEach(function(id){
            const p=G.players.find(function(x){return x.id===id;});
            if(p){p.form=Math.max(10,(p.form||80)-15);p.starter=false;p._benchWeeks=(p._benchWeeks||0)+3;}
          });
          G.reputation=(G.reputation||30)+10;
          kron.flags._s01canRepeat=false;// reset — nauczka zadziałała
          addNews(t('kron_s07_c1_news'),'ok');
        },
        outcome:function(){
          const names=(kron.flags._s07pids||[]).map(function(id){
            const p=G.players.find(function(x){return x.id===id;});return p?p.name.split(' ')[1]:'?';
          }).join(', ');
          return t('kron_s07_c1_outcome').replace('{names}',names).replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_s07_c2_label'),
        effect:function(){
          if(G.budget<25000){
            notif(t('kron_s07_c2_notif_nobudget'),'err');
            // Mimo braku kasy sprawa i tak cichnie — ale reputacja spada
            G.reputation=Math.max(0,(G.reputation||30)-15);
            kron.flags._s07result='noBudget';
            return;
          }
          G.budget-=25000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:25000,bal:G.budget,season:G.season,note:t('kron_note_s07_scandal_repeat')});
          kron.flags._s01canRepeat=false;
          addNews(t('kron_s07_c2_news'),'budget');
          kron.flags._s07result='paid';
        },
        outcome:function(){
          if(kron.flags._s07result==='noBudget')return t('kron_s07_c2_outcome_nobudget').replace('{rep}',G.reputation||0);
          return t('kron_s07_c2_outcome_paid');
        }},
       {label:t('kron_s07_c3_label'),
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-20);
          myPl().forEach(function(p){p.form=Math.max(30,(p.form||80)-8);});
          // Flaga zostaje — może wrócić jeszcze raz ale z większą wagą
          addNews(t('kron_s07_c3_news'),'err');
          kron.flags._s07result='ignored';
        },
        outcome:function(){
          return t('kron_s07_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // T-07: Lojalny zawodnik (łańcuch z t02_agent_pressure opcja A — _loyaltyBonus)
    {id:'t07_loyalty_reward', category:t('kron_cat_transfers'),
     weight:function(){
       // Trigger: zawodnik z _loyaltyBonus=true i min 3 sezony w klubie
       const loyal=myPl().find(function(p){
         return p._loyaltyBonus&&(p._seasonsAtClub||0)>=3&&!p._wantsOut;
       });
       return loyal?25:0;
     },
     title:t('kron_t07_title'),
     body:function(){
       const loyal=myPl().filter(function(p){
         return p._loyaltyBonus&&(p._seasonsAtClub||0)>=3&&!p._wantsOut;
       }).sort(function(a,b){return (b._seasonsAtClub||0)-(a._seasonsAtClub||0);})[0];
       kron.flags._t07loyalId=loyal?loyal.id:-1;
       const saving=loyal?Math.round((loyal.value||30000)*0.15/1000)*1000:10000;
       kron.flags._t07saving=saving;
       return t('kron_t07_body').replace('{name}',loyal?loyal.name:t('kron_t07_fallback_name')).replace('{seasons}',loyal?loyal._seasonsAtClub||3:3).replace('{saving}',fmtVal(saving));
     },
     choices:[
       {label:t('kron_t07_c1_label'),
        effect:function(){
          const loyal=G.players.find(function(p){return p.id===kron.flags._t07loyalId;});
          const saving=kron.flags._t07saving||10000;
          G.budget+=saving;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:saving,cost:0,bal:G.budget,season:G.season,note:t('kron_note_t07_loyalty_reward_a')});
          if(loyal){
            loyal.form=Math.min(100,(loyal.form||80)+5);
            loyal._loyaltyBonus=true;// podtrzymaj flagę
            // Szatnia widzi gest — morale rośnie
            myPl().filter(function(p){return p.id!==kron.flags._t07loyalId;}).forEach(function(p){
              p.form=Math.min(100,(p.form||80)+3);
            });
          }
          addNews(t('kron_t07_c1_news').replace('{name}',loyal?loyal.name:t('kron_fallback_player')),'ok');
          kron.flags._t07result='accepted';kron.flags._t07name=loyal?loyal.name:t('kron_fallback_player');
        },
        outcome:function(){
          return t('kron_t07_c1_outcome').replace('{val}',fmtVal(kron.flags._t07saving||0)).replace('{name}',kron.flags._t07name||t('kron_fallback_player'));
        }},
       {label:t('kron_t07_c2_label'),
        effect:function(){
          const loyal=G.players.find(function(p){return p.id===kron.flags._t07loyalId;});
          G.reputation=(G.reputation||30)+5;
          if(loyal)loyal.form=Math.min(100,(loyal.form||80)+8);// docenia że nie wykorzystałeś
          addNews(t('kron_t07_c2_news'),'ok');
          kron.flags._t07result='refused';kron.flags._t07name=loyal?loyal.name:t('kron_fallback_player');
        },
        outcome:function(){
          return t('kron_t07_c2_outcome').replace('{rep}',G.reputation||0).replace('{name}',kron.flags._t07name||t('kron_fallback_player'));
        }},
       {label:t('kron_t07_c3_label'),
        effect:function(){
          const loyal=G.players.find(function(p){return p.id===kron.flags._t07loyalId;});
          const saving=kron.flags._t07saving||10000;
          G.budget+=saving;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:saving,cost:0,bal:G.budget,season:G.season,note:t('kron_note_t07_loyalty_reward_b')});
          G.reputation=(G.reputation||30)+8;
          if(loyal){
            loyal.form=Math.min(100,(loyal.form||80)+8);
            loyal._loyaltyBonus=true;
          }
          myPl().filter(function(p){return p.id!==kron.flags._t07loyalId;}).forEach(function(p){
            p.form=Math.min(100,(p.form||80)+4);
          });
          addNews(t('kron_t07_c3_news').replace('{name}',loyal?loyal.name:t('kron_fallback_player')),'ok');
          kron.flags._t07result='praised';kron.flags._t07name=loyal?loyal.name:t('kron_fallback_player');
        },
        outcome:function(){
          return t('kron_t07_c3_outcome').replace('{val}',fmtVal(kron.flags._t07saving||0)).replace('{name}',kron.flags._t07name||t('kron_fallback_player')).replace('{rep}',G.reputation||0);
        }},
     ]},

    // SP-08: Ten sam sędzia znowu (łańcuch z sp05_ref_error)
    {id:'sp08_ref_revenge', category:t('kron_cat_sporting'),
     weight:function(){
       // Trigger: sp05 już wystąpił w tym sezonie (jest w usedThisSeason)
       if(!kron.usedThisSeason.includes('sp05_ref_error'))return 0;
       // I zbliża się kolejny mecz
       const nm=G.schedule&&G.schedule.find(function(m){return m.rnd===G.round&&!m.done&&(m.h===G.myClubId||m.a===G.myClubId);});
       return nm?28:0;
     },
     title:t('kron_sp08_title'),
     body:function(){
       const nm=G.schedule&&G.schedule.find(function(m){return m.rnd===G.round&&!m.done&&(m.h===G.myClubId||m.a===G.myClubId);});
       const oppId=nm?(nm.h===G.myClubId?nm.a:nm.h):0;
       const oppClub=(G.leagues||[]).flatMap(function(l){return l.clubs||[];}).find(function(c){return c.id===oppId;});
       kron.flags._sp08oppName=oppClub?oppClub.n:t('kron_fallback_rival');
       return t('kron_sp08_body').replace('{opp}',oppClub?oppClub.n:t('kron_sp08_fallback_opp'));
     },
     choices:[
       {label:t('kron_sp08_c1_label'),
        effect:function(){
          if(Math.random()<0.30){
            G.reputation=(G.reputation||30)+5;
            addNews(t('kron_sp08_c1_news_win'),'ok');
            kron.flags._sp08result='changed';
          } else {
            G.budget=Math.max(0,G.budget-5000);
            G.reputation=Math.max(0,(G.reputation||30)-5);
            addNews(t('kron_sp08_c1_news_lose'),'err');
            kron.flags._sp08result='rejected';
          }
        },
        outcome:function(){
          if(kron.flags._sp08result==='changed')return t('kron_sp08_c1_outcome_win');
          return t('kron_sp08_c1_outcome_lose');
        }},
       {label:t('kron_sp08_c2_label'),
        effect:function(){
          // Złość motywuje — skład dostaje boost formy
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+6);});
          addNews(t('kron_sp08_c2_news'),'ok');
          kron.flags._sp08result='motivated';
        },
        outcome:function(){
          return t('kron_sp08_c2_outcome');
        }},
       {label:t('kron_sp08_c3_label'),
        effect:function(){
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
          if(Math.random()<0.40){
            // Liga ukarała za wypowiedź
            G.budget=Math.max(0,G.budget-8000);
            G.reputation=Math.max(0,(G.reputation||30)-8);
            addNews(t('kron_sp08_c3_news_punish'),'err');
            kron.flags._sp08result='punished';
          } else {
            G.reputation=(G.reputation||30)+3;
            addNews(t('kron_sp08_c3_news_praise'),'ok');
            kron.flags._sp08result='praised';
          }
        },
        outcome:function(){
          if(kron.flags._sp08result==='punished')return t('kron_sp08_c3_outcome_punish');
          return t('kron_sp08_c3_outcome_praise').replace('{rep}',G.reputation||0);
        }},
     ]},

    // ── PRIORYTET 2 — KONTEKST SEZONOWY ─────────────────────────────────

    // X-01: Pierwsze mistrzostwo (jednorazowy event)
    {id:'x01_first_title', category:t('kron_cat_history'),
     weight:function(){
       // Trigger: właśnie wygrałeś ligę po raz pierwszy (trophies ma dokładnie 1 ligowe)
       if(!G.trophies)return 0;
       const leagueTrophies=(G.trophies||[]).filter(function(t){return t.type==='league';});
       if(leagueTrophies.length!==1)return 0;// dokładnie jedno = dopiero co zdobyte
       // Nie powtarzaj w tym samym sezonie
       const justWon=leagueTrophies[0].season===G.season;
       return justWon?50:0;
     },
     title:t('kron_x01_title'),
     body:function(){
       const trophy=(G.trophies||[]).find(function(t){return t.type==='league';});
       kron.flags._x01league=trophy?trophy.leagueName:t('kron_x01_fallback_league');
       kron.flags._x01season=G.season;
       return t('kron_x01_body').replace('{season}',G.season).replace('{league}',trophy?trophy.leagueName:t('kron_x01_fallback_league'));
     },
     choices:[
       {label:t('kron_x01_c1_label'),
        effect:function(){
          if(G.budget<15000){
            notif(t('kron_x01_c1_notif_nobudget'),'err');
            G.reputation=(G.reputation||30)+10;
            kron.flags._x01result='noBudget';
            return;
          }
          G.budget-=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:15000,bal:G.budget,season:G.season,note:t('kron_note_x01_first_title')});
          G.reputation=(G.reputation||30)+25;
          // Trwały ślad — flaga na G żeby inne eventy wiedziały
          G.flags=G.flags||{};
          G.flags.firstTitleSeason=G.season;
          G.flags.firstTitleLeague=kron.flags._x01league;
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});
          addNews(t('kron_x01_c1_news'),'ok');
          kron.flags._x01result='monument';
        },
        outcome:function(){
          if(kron.flags._x01result==='noBudget')return t('kron_x01_c1_outcome_nobudget');
          return t('kron_x01_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_x01_c2_label'),
        effect:function(){
          G.reputation=(G.reputation||30)+20;
          G.flags=G.flags||{};
          G.flags.firstTitleSeason=G.season;
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+6);});
          addNews(t('kron_x01_c2_news'),'ok');
          kron.flags._x01result='parade';
        },
        outcome:function(){
          return t('kron_x01_c2_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_x01_c3_label'),
        effect:function(){
          G.budget+=5000;
          G.reputation=(G.reputation||30)+8;
          G.flags=G.flags||{};
          G.flags.firstTitleSeason=G.season;
          addNews(t('kron_x01_c3_news'),'budget');
          kron.flags._x01result='modest';
        },
        outcome:function(){
          return t('kron_x01_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // X-02: Kryzys spadkowy — ultimatum zarządu
    {id:'x02_relegation_crisis', category:t('kron_cat_crisis'),
     weight:function(){
       // Trigger: round≥15, jesteśmy w strefie spadkowej (ostatnie 3 miejsca)
       if((G.round||0)<15)return 0;
       if(!G.standing||!G.standing.length)return 0;
       const sorted=[...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
       const total=sorted.length;
       const myIdx=sorted.findIndex(function(s){return parseInt(s.cid)===parseInt(G.myClubId);});
       const myPos=myIdx+1;
       // Strefa spadkowa = ostatnie 3 miejsca
       const inRelegation=myPos>=total-2;
       return inRelegation?45:0;
     },
     title:t('kron_x02_title'),
     body:function(){
       const sorted=[...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
       const total=sorted.length;
       const myIdx=sorted.findIndex(function(s){return parseInt(s.cid)===parseInt(G.myClubId);});
       const myPos=myIdx+1;
       const ptsToSafe=sorted[total-4]?(sorted[total-4].pts-(sorted[myIdx]?sorted[myIdx].pts:0)):5;
       kron.flags._x02myPos=myPos;
       kron.flags._x02total=total;
       kron.flags._x02ptsToSafe=Math.max(1,ptsToSafe);
       const roundsLeft=(G.standing[0]?(G.standing[0].p||0):0);
       const totalRounds=(total-1)*2;
       kron.flags._x02roundsLeft=Math.max(1,totalRounds-roundsLeft);
       return t('kron_x02_body').replace('{pos}',myPos).replace('{total}',total).replace('{pts}',Math.max(1,ptsToSafe)).replace('{rounds}',kron.flags._x02roundsLeft);
     },
     choices:[
       {label:t('kron_x02_c1_label'),
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-5);
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+12);});
          addNews(t('kron_x02_c1_news'),'ok');
          kron.flags._x02result='motivated';
        },
        outcome:function(){
          return t('kron_x02_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_x02_c2_label'),
        effect:function(){
          if(G.budget<20000){
            notif(t('kron_x02_c2_notif_nobudget'),'err');
            // Mimo to szatnia dostaje małe wzmocnienie moralne
            myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
            kron.flags._x02result='noBudget';
            return;
          }
          G.budget-=20000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:20000,bal:G.budget,season:G.season,note:t('kron_note_x02_relegation_crisis')});
          // Znajdź najlepszego kandydata z nadwyżki u realnego klubu AI i podpisz (zamknięty świat).
          const found=kronFindSurplusPlayer(50,99,null);
          if(found){
            kronTransferIn(found.player,found.fromClub);
            found.player.contract=1;
            addNews(t('kron_x02_c2_news').replace('{name}',found.player.name).replace('{ovr}',ovr(found.player)),'budget');
            kron.flags._x02rescueName=found.player.name;
          }
          kron.flags._x02result='transfer';
        },
        outcome:function(){
          if(kron.flags._x02result==='noBudget')return t('kron_x02_c2_outcome_nobudget');
          return t('kron_x02_c2_outcome').replace('{name}',kron.flags._x02rescueName||t('kron_fallback_newplayer'));
        }},
       {label:t('kron_x02_c3_label'),
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-15);
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+15);});
          addNews(t('kron_x02_c3_news'),'err');
          kron.flags._x02result='rebel';
        },
        outcome:function(){
          return t('kron_x02_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // X-03: Noc przed awansem
    {id:'x03_promotion_eve', category:t('kron_cat_history'),
     weight:function(){
       // Trigger: jesteśmy na 1. miejscu w ostatnich 3 kolejkach sezonu, liga nie jest najwyższa
       if(!G.standing||!G.standing.length)return 0;
       if((G.myLeague||8)<=1)return 0;// już w najwyższej
       const sorted=[...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
       const myPos=sorted.findIndex(function(s){return parseInt(s.cid)===parseInt(G.myClubId);})+1;
       if(myPos!==1)return 0;
       // Ostatnie 3 kolejki — sprawdź ile meczów zostało
       const totalRounds=(G.standing.length-1)*2;
       const played=G.standing[0]?(G.standing[0].p||0):0;
       const roundsLeft=totalRounds-played;
       return (roundsLeft<=3&&roundsLeft>=1)?40:0;
     },
     title:t('kron_x03_title'),
     body:function(){
       const sorted=[...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
       const second=sorted[1];
       const myEntry=sorted[0];
       const lead=myEntry&&second?(myEntry.pts-second.pts):0;
       kron.flags._x03lead=lead;
       const nextLeague=LEAGUE_NAMES[(G.myLeague||8)-1]||t('kron_x03_fallback_league');
       kron.flags._x03nextLeague=nextLeague;
       const totalRounds=(G.standing.length-1)*2;
       const played=G.standing[0]?(G.standing[0].p||0):0;
       kron.flags._x03roundsLeft=(totalRounds-played);
       return t('kron_x03_body').replace('{lead}',lead).replace('{rounds}',kron.flags._x03roundsLeft).replace('{league}',nextLeague);
     },
     choices:[
       {label:t('kron_x03_c1_label'),
        effect:function(){
          if(Math.random()<0.50){
            starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+10);});
            addNews(t('kron_x03_c1_news_win'),'ok');
            kron.flags._x03result='speechWin';
          } else {
            addNews(t('kron_x03_c1_news_lose'),'club');
            kron.flags._x03result='speechFail';
          }
        },
        outcome:function(){
          if(kron.flags._x03result==='speechWin')return t('kron_x03_c1_outcome_win');
          return t('kron_x03_c1_outcome_lose');
        }},
       {label:t('kron_x03_c2_label'),
        effect:function(){
          if(G.budget<20000){
            notif(t('kron_x03_c2_notif_nobudget'),'err');
            starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});
            kron.flags._x03result='noBudget';
            return;
          }
          G.budget-=20000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:20000,bal:G.budget,season:G.season,note:t('kron_note_x03_promotion_eve_a')});
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});
          addNews(t('kron_x03_c2_news'),'budget');
          kron.flags._x03result='bonus';
        },
        outcome:function(){
          if(kron.flags._x03result==='noBudget')return t('kron_x03_c2_outcome_nobudget');
          return t('kron_x03_c2_outcome');
        }},
       {label:t('kron_x03_c3_label'),
        effect:function(){
          if(G.budget<8000){
            notif(t('kron_x03_c3_notif_nobudget'),'err');
            kron.flags._x03result='noBudget2';
            return;
          }
          G.budget-=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:8000,bal:G.budget,season:G.season,note:t('kron_note_x03_promotion_eve_b')});
          G.reputation=(G.reputation||30)+5;
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          addNews(t('kron_x03_c3_news'),'ok');
          kron.flags._x03result='trip';
        },
        outcome:function(){
          if(kron.flags._x03result==='noBudget2')return t('kron_x03_c3_outcome_nobudget');
          return t('kron_x03_c3_outcome').replace('{rep}',G.reputation||0);
        }},
     ]},

    // X-04: Rywal buduje dynastię
    {id:'x04_dynasty_threat', category:t('kron_cat_crisis'),
     weight:function(){
       // Trigger: G.rival istnieje i rywal jest znacznie silniejszy + sezon≥3
       if(!G.rival)return 0;
       if((G.season||1)<3)return 0;
       // Rywal musi być silniejszy o przynajmniej 8 pkt OVR
       const myAvgOvr=myPl().length?Math.round(myPl().reduce(function(s,p){return s+ovr(p);},0)/myPl().length):50;
       const rivalStr=G.rival.strength||50;
       return (rivalStr>myAvgOvr+8)?30:0;
     },
     title:t('kron_x04_title'),
     body:function(){
       const myAvgOvr=myPl().length?Math.round(myPl().reduce(function(s,p){return s+ovr(p);},0)/myPl().length):50;
       const rivalStr=G.rival.strength||50;
       const gap=rivalStr-myAvgOvr;
       kron.flags._x04gap=gap;
       kron.flags._x04rivalName=(G.rival&&G.rival.n)||t('kron_fallback_rival');
       return t('kron_x04_body').replace('{rival}',G.rival?G.rival.n:t('kron_fallback_rival')).replace('{years}',Math.floor(gap/3)).replace('{gap}',gap).replace('{club}',G.myClub?G.myClub.n:t('kron_x04_fallback_club'));
     },
     choices:[
       {label:t('kron_x04_c1_label'),
        effect:function(){
          G.reputation=(G.reputation||30)+5;
          addNews(t('kron_x04_c1_news'),'ok');
          kron.flags._x04result='ignored';
        },
        outcome:function(){
          return t('kron_x04_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_x04_c2_label'),
        effect:function(){
          G.reputation=(G.reputation||30)+10;
          // Wzmocnij akademię jeśli istnieje
          if(G.academy){
            if(G.academy.level!==undefined)G.academy.level=Math.min(5,(G.academy.level||0)+1);
            // Dodaj nowego prospecta jeśli jest miejsce — te same pola co generateProspects()
            // (academy.js), żeby prospekt faktycznie pojawił się na liście Akademia →
            // Przegląd (filtrowanej po status==='pending') i dał się zaakceptować/odrzucić
            // przez zwykły acceptProspect()/rejectProspect() zamiast zostać niewidocznym,
            // niekompletnym wpisem na stałe zajmującym miejsce w puli.
            if(G.academy.prospects&&G.academy.prospects.length<6){
              const trRoll=Math.random();
              const trainRate=trRoll<0.10?(50+r(0,30))/100:trRoll<0.45?(81+r(0,29))/100:trRoll<0.75?(110+r(0,40))/100:(150+r(0,50))/100;
              const youngster={
                id:pid++,
                name:getUniqueName(),
                age:15+Math.floor(Math.random()*3),
                pos:['NAP','POL','OBR'][Math.floor(Math.random()*3)],
                ovr:r(15,25),
                potential:60+Math.floor(Math.random()*20),
                trainRate,
                archetype:['wojownik','techniczny','snajper','lider'][Math.floor(Math.random()*4)],
                status:'pending'
              };
              G.academy.prospects.push(youngster);
              kron.flags._x04prodigyName=youngster.name;
            }
          }
          addNews(t('kron_x04_c2_news').replace('{extra}',kron.flags._x04prodigyName?t('kron_x04_c2_news_extra').replace('{name}',kron.flags._x04prodigyName):''),'ok');
          kron.flags._x04result='academy';
        },
        outcome:function(){
          const pName=kron.flags._x04prodigyName;
          return t('kron_x04_c2_outcome').replace('{rep}',G.reputation||0).replace('{extra}',pName?t('kron_x04_c2_outcome_extra').replace('{name}',pName):t('kron_x04_c2_outcome_extra_none'));
        }},
       {label:t('kron_x04_c3_label'),
        effect:function(){
          // Znajdź gwiazdę z nadwyżki u realnego klubu AI i podpisz drogo (zamknięty świat).
          const found=kronFindSurplusPlayer(55,99,null);
          if(!found){
            notif(t('kron_x04_c3_notif_nofa'),'err');
            kron.flags._x04result='noFA';
            return;
          }
          const star=found.player;
          const cost=kronAffordablePrice(Math.round((star.value||40000)*0.80/1000)*1000,0.6);
          if(G.budget<cost){
            notif(t('kron_x04_c3_notif_nobudget'),'err');
            kron.flags._x04result='noBudget';
            return;
          }
          G.budget-=cost;
          kronTransferIn(star,found.fromClub);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:star.name,val:cost,fee:cost,week:G.week,season:G.season});
          // Rywal słabnie psychicznie — obniż symboliczne
          if(G.rival.strength!==undefined)G.rival.strength=Math.max(0,(G.rival.strength||50)-3);
          addNews(t('kron_x04_c3_news').replace('{name}',star.name).replace('{ovr}',ovr(star)).replace('{val}',fmtVal(cost)),'budget');
          kron.flags._x04result='transfer';kron.flags._x04starName=star.name;kron.flags._x04cost=cost;
        },
        outcome:function(){
          if(kron.flags._x04result==='noFA')return t('kron_x04_c3_outcome_nofa');
          if(kron.flags._x04result==='noBudget')return t('kron_x04_c3_outcome_nobudget');
          return t('kron_x04_c3_outcome').replace('{name}',kron.flags._x04starName||t('kron_fallback_newplayer')).replace('{val}',fmtVal(kron.flags._x04cost||0));
        }},
     ]},

    // ── PRIORYTET 3 — NOWE MECHANIKI ────────────────────────────────────

    {id:'sp09_tactics_leak', category:t('kron_cat_sporting'),
     weight:function(){
       if(!G.rival)return 0;
       if((G.round||0)<8)return 0;
       const hist=G.mHist||[];
       const lostRecently=hist.slice(-6).some(function(m){
         return m.isMyH?(m.hg<m.ag):(m.ag<m.hg);
       });
       return lostRecently?20:0;
     },
     title:t('kron_sp09_title'),
     body:function(){
       kron.flags._sp09rivalName=(G.rival&&G.rival.n)||t('kron_fallback_rival');
       kron.flags._sp09formation=G.formation||'4-3-3';
       return t('kron_sp09_body').replace('{rival}',G.rival?G.rival.n:t('kron_sp09_fallback_rival_gen')).replace('{formation}',G.formation||'4-3-3');
     },
     choices:[
       {label:t('kron_sp09_c1_label'),
        effect:function(){
          const formations=['4-3-3','4-4-2','3-5-2','5-3-2','4-2-4'];
          const current=G.formation||'4-3-3';
          const alts=formations.filter(function(f){return f!==current;});
          const newForm=alts[Math.floor(Math.random()*alts.length)];
          kron.flags._sp09oldForm=current;
          kron.flags._sp09newForm=newForm;
          starters.forEach(function(p){p.form=Math.max(40,(p.form||80)-5);});
          G.formation=newForm;
          addNews(t('kron_sp09_c1_news').replace('{old}',current).replace('{new}',newForm),'club');
          kron.flags._sp09result='changed';
        },
        outcome:function(){
          return t('kron_sp09_c1_outcome').replace('{old}',kron.flags._sp09oldForm||t('kron_sp09_c1_fallback_old')).replace('{new}',kron.flags._sp09newForm||t('kron_sp09_c1_fallback_new'));
        }},
       {label:t('kron_sp09_c2_label'),
        effect:function(){
          if(G.budget<5000){notif(t('kron_notif_no_budget'),'err');kron.flags._sp09result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:t('kron_note_sp09_tactics_leak')});
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
          addNews(t('kron_sp09_c2_news'),'ok');
          kron.flags._sp09result='trained';
        },
        outcome:function(){
          if(kron.flags._sp09result==='noBudget')return t('kron_sp09_c2_outcome_nobudget');
          return t('kron_sp09_c2_outcome');
        }},
       {label:t('kron_sp09_c3_label'),
        effect:function(){
          G.reputation=(G.reputation||30)+5;
          if(G.rival&&G.rival.strength!==undefined)G.rival.strength=Math.max(0,(G.rival.strength||50)-2);
          addNews(t('kron_sp09_c3_news').replace('{rival}',kron.flags._sp09rivalName||t('kron_fallback_rival')),'ok');
          kron.flags._sp09result='bluff';
        },
        outcome:function(){
          return t('kron_sp09_c3_outcome').replace('{rep}',G.reputation||0).replace('{rival}',kron.flags._sp09rivalName||t('kron_fallback_rival'));
        }},
     ]},

    {id:'m06_naming_rights', category:t('kron_cat_finance'),
     weight:function(){
       if((G.season||1)<3)return 0;
       if((G.reputation||0)<150)return 0;
       if(kron.flags._m06sponsorActive)return 0;
       return 18;
     },
     title:t('kron_m06_title'),
     body:function(){
       kron.flags._m06annual=15000;
       return t('kron_m06_body').replace('{total}',fmtVal(45000));
     },
     choices:[
       {label:t('kron_m06_c1_label'),
        effect:function(){
          G.budget+=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:15000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_m06_naming_rights_a')});
          kron.flags._m06sponsorActive=true;
          kron.flags._m06seasonsLeft=2;
          if((G.reputation||0)>=300){
            G.reputation=Math.max(0,(G.reputation||30)-5);
            addNews(t('kron_m06_c1_news_hirep'),'budget');
          } else {
            addNews(t('kron_m06_c1_news_lowrep'),'budget');
          }
          kron.flags._m06result='signed';
        },
        outcome:function(){
          return t('kron_m06_c1_outcome').replace('{suffix}',(G.reputation||0)<300?t('kron_m06_c1_outcome_suffix_ok'):t('kron_m06_c1_outcome_suffix_rep'));
        }},
       {label:t('kron_m06_c2_label'),
        effect:function(){
          G.reputation=(G.reputation||30)+8;
          addNews(t('kron_m06_c2_news'),'ok');
          kron.flags._m06result='refused';
        },
        outcome:function(){
          return t('kron_m06_c2_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_m06_c3_label'),
        effect:function(){
          if(Math.random()<0.60){
            G.budget+=20000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:20000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_m06_naming_rights_b')});
            kron.flags._m06sponsorActive=true;
            kron.flags._m06seasonsLeft=2;
            kron.flags._m06annual=20000;
            addNews(t('kron_m06_c3_news_win'),'budget');
            kron.flags._m06result='negotiated';
          } else {
            addNews(t('kron_m06_c3_news_lose'),'err');
            kron.flags._m06result='failed';
          }
        },
        outcome:function(){
          if(kron.flags._m06result==='negotiated')return t('kron_m06_c3_outcome_win');
          return t('kron_m06_c3_outcome_lose');
        }},
     ]},

    {id:'h01_hall_of_fame', category:t('kron_cat_locker'),
     weight:function(){
       const legend=myPl().find(function(p){
         return (p.age||25)>=36&&(p._seasonsAtClub||0)>=4&&ovr(p)>=60&&!p.injured;
       });
       return legend?22:0;
     },
     title:t('kron_h01_title'),
     body:function(){
       const legend=myPl().filter(function(p){
         return (p.age||25)>=36&&(p._seasonsAtClub||0)>=4&&ovr(p)>=60&&!p.injured;
       }).sort(function(a,b){return (b._seasonsAtClub||0)-(a._seasonsAtClub||0);})[0];
       kron.flags._h01legendId=legend?legend.id:-1;
       kron.flags._h01legendName=legend?legend.name:t('kron_fallback_player');
       kron.flags._h01seasons=legend?(legend._seasonsAtClub||4):4;
       return t('kron_h01_body').replace('{name}',legend?legend.name:t('kron_fallback_player')).replace('{age}',legend?legend.age:'?').replace('{seasons}',legend?legend._seasonsAtClub||4:4).replace('{ovr}',legend?ovr(legend):'?');
     },
     choices:[
       {label:t('kron_h01_c1_label'),
        effect:function(){
          if(G.budget<5000){notif(t('kron_notif_no_budget'),'err');kron.flags._h01result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:t('kron_note_h01_hall_of_fame_a')});
          G.reputation=(G.reputation||30)+10;
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          G.flags=G.flags||{};
          if(!G.flags.hallOfFame)G.flags.hallOfFame=[];
          G.flags.hallOfFame.push({name:kron.flags._h01legendName,season:G.season,seasons:kron.flags._h01seasons});
          addNews(t('kron_h01_c1_news').replace('{name}',kron.flags._h01legendName),'ok');
          kron.flags._h01result='hallOfFame';
        },
        outcome:function(){
          if(kron.flags._h01result==='noBudget')return t('kron_h01_c1_outcome_nobudget');
          return t('kron_h01_c1_outcome').replace('{name}',kron.flags._h01legendName).replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_h01_c2_label'),
        effect:function(){
          if(G.budget<15000){notif(t('kron_h01_c2_notif_nobudget'),'err');kron.flags._h01result='noBudget2';return;}
          G.budget-=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:15000,bal:G.budget,season:G.season,note:t('kron_note_h01_hall_of_fame_b')});
          G.reputation=(G.reputation||30)+15;
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});
          G.flags=G.flags||{};
          if(!G.flags.hallOfFame)G.flags.hallOfFame=[];
          G.flags.hallOfFame.push({name:kron.flags._h01legendName,season:G.season,seasons:kron.flags._h01seasons,golden:true});
          addNews(t('kron_h01_c2_news').replace('{name}',kron.flags._h01legendName),'ok');
          kron.flags._h01result='golden';
        },
        outcome:function(){
          if(kron.flags._h01result==='noBudget2')return t('kron_h01_c2_outcome_nobudget');
          return t('kron_h01_c2_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_h01_c3_label'),
        effect:function(){kron.flags._h01result='ignored';},
        outcome:function(){return t('kron_h01_c3_outcome').replace('{name}',kron.flags._h01legendName);}},
     ]},

    {id:'tr01_training_accident', category:t('kron_cat_crisis'),
     weight:function(){
       if((G.round||0)<3||(G.round||0)>25)return 0;
       const noInjuries=myPl().every(function(p){return !p.injured;});
       return noInjuries?15:0;
     },
     title:t('kron_tr01_title'),
     body:function(){
       const atRisk=myPl().filter(function(p){return p.starter&&!p.injured;});
       const victim=atRisk.length?atRisk[Math.floor(Math.random()*atRisk.length)]:null;
       kron.flags._tr01victimId=victim?victim.id:-1;
       kron.flags._tr01victimName=victim?victim.name:t('kron_fallback_player');
       return t('kron_tr01_body').replace('{name}',victim?victim.name:t('kron_fallback_player')).replace('{pos}',victim?victim.pos:'?');
     },
     choices:[
       {label:t('kron_tr01_c1_label'),
        effect:function(){
          if(G.budget<12000){notif(t('kron_notif_no_budget'),'err');kron.flags._tr01result='noBudget';return;}
          G.budget-=12000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:12000,bal:G.budget,season:G.season,note:t('kron_note_tr01_training_accident')});
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          if(victim){victim.injured=true;victim.injuredWeeks=1+Math.floor(Math.random()*2);victim.starter=false;}
          G.flags=G.flags||{};
          G.flags.trainingUpgrade=true;
          G.flags.trainingUpgradeSeason=G.season;
          addNews(t('kron_tr01_c1_news').replace('{extra}',victim?t('kron_tr01_c1_news_extra').replace('{name}',victim.name).replace('{weeks}',victim.injuredWeeks):''),'budget');
          kron.flags._tr01result='upgraded';
        },
        outcome:function(){
          if(kron.flags._tr01result==='noBudget')return t('kron_tr01_c1_outcome_nobudget');
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          return t('kron_tr01_c1_outcome').replace('{extra}',victim?t('kron_tr01_c1_outcome_extra').replace('{name}',victim.name).replace('{weeks}',victim.injuredWeeks):'');
        }},
       {label:t('kron_tr01_c2_label'),
        effect:function(){
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          if(victim){victim.injured=true;victim.injuredWeeks=2;victim.starter=false;}
          starters.filter(function(p){return !p.injured;}).forEach(function(p){p.form=Math.max(40,(p.form||80)-3);});
          addNews(t('kron_tr01_c2_news'),'club');
          kron.flags._tr01result='insurance';
        },
        outcome:function(){
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          return t('kron_tr01_c2_outcome').replace('{extra}',victim?t('kron_tr01_c2_outcome_extra').replace('{name}',victim.name):'');
        }},
       {label:t('kron_tr01_c3_label'),
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-8);
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          if(victim){victim.form=Math.max(20,(victim.form||80)-10);victim._wantsOut=true;}
          addNews(t('kron_tr01_c3_news').replace('{name}',victim?victim.name:t('kron_fallback_player')),'err');
          kron.flags._tr01result='covered';
        },
        outcome:function(){
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          return t('kron_tr01_c3_outcome').replace('{rep}',G.reputation||0).replace('{extra}',victim?t('kron_tr01_c3_outcome_extra').replace('{name}',victim.name):'');
        }},
     ]},

    // ── PRIORYTET 4 — AKADEMIA I DC ─────────────────────────────────────

    {id:'dc01_data_breach', category:t('kron_cat_finance'),
     weight:function(){
       if((G.season||1)<3)return 0;
       const hasScout=G.scout&&G.scout.level&&G.scout.level!=='free';
       const hasObserved=G.scout&&G.scout.observed&&G.scout.observed.length>0;
       return (hasScout||hasObserved)?18:0;
     },
     title:t('kron_dc01_title'),
     body:function(){
       const obsCount=(G.scout&&G.scout.observed&&G.scout.observed.length)||0;
       kron.flags._dc01obsCount=obsCount;
       return t('kron_dc01_body').replace('{obs}',obsCount>0?t('kron_dc01_body_obs').replace('{n}',obsCount):'');
     },
     choices:[
       {label:t('kron_dc01_c1_label'),
        effect:function(){
          if(G.budget<18000){notif(t('kron_notif_no_budget'),'err');kron.flags._dc01result='noBudget';return;}
          G.budget-=18000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:18000,bal:G.budget,season:G.season,note:t('kron_note_dc01_data_breach')});
          G.flags=G.flags||{};
          G.flags.dataSecure=true;
          G.flags.dataSecureSeason=G.season;
          addNews(t('kron_dc01_c1_news'),'budget');
          kron.flags._dc01result='secured';
        },
        outcome:function(){
          if(kron.flags._dc01result==='noBudget')return t('kron_dc01_c1_outcome_nobudget');
          return t('kron_dc01_c1_outcome');
        }},
       {label:t('kron_dc01_c2_label'),
        effect:function(){
          // Zamknięty świat: "skradzione namiary" to realni kandydaci z nadwyżki u klubów AI —
          // rywal faktycznie ich przejmuje (aiTransferPlayer), nie znikają w próżni.
          const found1=kronFindSurplusPlayer(1,99,null);
          const found2=found1?kronFindSurplusPlayer(1,99,null,null,new Set([found1.player.id])):null;
          const stolen=[found1,found2].filter(Boolean);
          if(stolen.length){
            kron.flags._dc01stolenNames=stolen.map(function(s){return s.player.name;}).join(', ');
            stolen.forEach(function(s){
              if(G.rival&&G.rival.ai&&G.rival.id!==s.fromClub.id){
                const price=Math.round((s.player.value||30000)*0.5/1000)*1000;
                aiTransferPlayer(s.player,s.fromClub,G.rival,price,G.season,false);
                if(G.rival.strength!==undefined)G.rival.strength=(G.rival.strength||50)+1;
              }
            });
            addNews(t('kron_dc01_c2_news_stolen').replace('{names}',kron.flags._dc01stolenNames||t('kron_dc01_fallback_stolen')),'err');
          } else {
            addNews(t('kron_dc01_c2_news_empty'),'club');
          }
          kron.flags._dc01result='ignored';
        },
        outcome:function(){
          if(kron.flags._dc01stolenNames)return t('kron_dc01_c2_outcome_stolen').replace('{names}',kron.flags._dc01stolenNames);
          return t('kron_dc01_c2_outcome_empty');
        }},
       {label:t('kron_dc01_c3_label'),
        effect:function(){
          G.reputation=(G.reputation||30)+8;
          const found=kronFindSurplusPlayer(1,99,null);
          if(found)kron.flags._dc01lostName=found.player.name;
          addNews(t('kron_dc01_c3_news').replace('{name}',kron.flags._dc01lostName||t('kron_dc01_fallback_lost')),'ok');
          kron.flags._dc01result='reported';
        },
        outcome:function(){
          return t('kron_dc01_c3_outcome').replace('{rep}',G.reputation||0).replace('{name}',kron.flags._dc01lostName||t('kron_fallback_player'));
        }},
     ]},

  ]; // koniec KRON_EVENTS

  // ── FILTRUJ dostępne eventy ─────────────────────────────────────────
  const available=KRON_EVENTS.filter(function(ev){
    if(kron.usedThisSeason.indexOf(ev.id)>=0)return false;
    return ev.weight()>0;
  });
  if(!available.length)return;

  // ── LOSUJ event ważony ──────────────────────────────────────────────
  const totalW=available.reduce(function(s,ev){return s+ev.weight();},0);
  let rndW=Math.random()*totalW;
  let chosen=available[available.length-1];
  for(var ei=0;ei<available.length;ei++){rndW-=available[ei].weight();if(rndW<=0){chosen=available[ei];break;}}

  // ── Oznacz jako użyty, ustaw cooldown ──────────────────────────────
  kron.usedThisSeason.push(chosen.id);
  kron.cooldown=9; // v207: max 3 eventy w sezonie (~co 10 kolejek)

  // ── Rozwiąż dynamiczne body ─────────────────────────────────────────
  const resolvedBody=typeof chosen.body==='function'?chosen.body():chosen.body;

  // v230: modal NIE pokazuje się od razu — advWeek() (a więc kronTrigger()) odpala się
  // w momencie końca meczu, zanim gracz zobaczy relację/podsumowanie. Zamiast wyskakiwać
  // na ekranie meczu, event czeka jako window._pendingKronEvent (wzorzec identyczny jak
  // window._lastMatchSummary) i pokazuje się przez flushPendingKronEvent() — wywoływane
  // z continueFromMatchSummary() (match-ui.js) po realnym wyjściu z ekranu meczu, albo
  // od razu w tygodniach bez meczu (match-engine.js::simMatch(), gdzie nie ma czego opuszczać).
  window._pendingKronEvent={chosen:chosen,resolvedBody:resolvedBody};
}

function flushPendingKronEvent(){
  const pe=window._pendingKronEvent;if(!pe)return;
  window._pendingKronEvent=null;
  setTimeout(function(){kronShowModal(pe.chosen,pe.resolvedBody);},600);
}

// ── Odliczanie bench weeks co turę ──────────────────────────────────────
function kronUpdateBenchWeeks(){
  if(!G||!G.kronika)return;
  const kron=G.kronika;
  myPl().forEach(function(p){
    if(!p.starter&&!p.injured){p._benchWeeks=(p._benchWeeks||0)+1;}
    else{p._benchWeeks=0;}
  });
  // Odlicz cooldown
  if(kron.cooldown>0)kron.cooldown--;
  // Zlicz kontuzje ostatnich 4 tygodni (sliding window)
  if(!kron.flags._injHistory)kron.flags._injHistory=[];
  const newInj=myPl().filter(function(p){return p.injured&&p.injuryWeeks===p.injuryWeeks;}).length;
  kron.flags._injHistory.push(newInj);
  if(kron.flags._injHistory.length>4)kron.flags._injHistory.shift();
  kron.flags._injCount=kron.flags._injHistory.reduce(function(s,v){return s+v;},0);
  // Applyphysio bonus — redukuje szansę kontuzji o 30% (flaga sprawdzana w applyInjury override)
}

function aiSeasonalRefresh(){
  if(!G||!G.leagues)return;
  // Zamknięty świat: starzenie i naturalne wzrosty atrybutów, skalowane jakością rozwoju klubu
  // (filozofia AI + reputacja + wynik kończącego się sezonu — patrz clubDevMult niżej).
  // Zamknięty świat: uzupełnienie składu do min 22 to realokacja z nadwyżek innych klubów
  // (aiSignReplacement, match-post.js), nie pula G.fa — patrz js/CLAUDE.md.
  // Limit podpisań na sezon (aiSigningCap, match-post.js) zerowany TU — to pierwsza funkcja w
  // sekwencji zmiany sezonu (startNewSeason(): aiSeasonalRefresh → aiRenewContracts →
  // aiTransferSeason), więc podpisania z każdego z tych trzech kroków liczą się do JEDNEGO,
  // wspólnego limitu sezonowego zamiast każdy dostawać osobny, "darmowy" budżet.
  G.leagues.forEach(function(lg){lg.clubs.forEach(function(c){if(c.ai){c.ai.signingsThisSeason=0;c.ai.sellsThisSeason=0;}});});
  // G.allStandings i G.cupHistory w tym momencie startNewSeason() wciąż opisują kończący się
  // sezon (przenosiny klubów między ligami przy awansach/spadkach dzieją się DALEJ w tej funkcji,
  // patrz season-summary.js) — można ich tu bezpiecznie użyć do oceny sukcesu klubu.
  const _cupHistR=(G.cupHistory||[]).find(ch=>ch.season===G.season);
  const _cupWinnerCidR=_cupHistR&&_cupHistR.winner?_cupHistR.winner.cid:null;
  const _cupFinalCidR=_cupHistR&&_cupHistR.runnerUp?_cupHistR.runnerUp.cid:null;
  G.leagues.forEach(lg=>{
    const _ovr4r=LEAGUE_OVR[lg.level]||[20,35,35,50];
    const nClubsR=lg.clubs.length;
    const _stR=[...(G.allStandings&&G.allStandings[lg.level]||[])].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    lg.clubs.filter(c=>c.id!==G.myClubId).forEach((c,ci)=>{
      const sq=G.players.filter(p=>p.clubId===c.id);
      const ai=c.ai||{};
      const aiDef=AI_TYPES[ai.type]||AI_TYPES.stabilny;
      // Jakość rozwoju klubu: filozofia AI × reputacja × sukces kończącego się sezonu
      // (górna połowa tabeli / finał lub wygrana Pucharu) — im lepszy klub, tym szybszy
      // rozwój młodych/dojrzałych i łagodniejsze starzenie weteranów.
      const _posIdxR=_stR.findIndex(s=>s.cid===c.id);
      const _topHalfR=_posIdxR>=0&&_posIdxR<_stR.length/2;
      // Mistrzostwo ligi — osobna, wyższa stawka niż "górna połowa tabeli" (audyt stabilności
      // OVR, 14.07.2026: dziś tytuł był nieodróżnialny od zwykłego miejsca np. 6.). Dotyczy
      // wyłącznie klubów AI — ta funkcja i tak filtruje G.myClubId wyżej (lg.clubs.filter).
      const _isChampionR=_posIdxR===0;
      const _wonCupR=_cupWinnerCidR===c.id,_finalCupR=_cupFinalCidR===c.id;
      const _repTierR=(ai.reputation||0)>=500?1.10:(ai.reputation||0)>=250?1.05:(ai.reputation||0)<50?0.95:1.0;
      let _successMultR=1.0;
      // Zmniejszone 14.07.2026 (weryfikacja powdrożeniowa, AUDYT_STABILNOSC_OVR.md sekcja 9):
      // +0.20 (dwa razy więcej niż +0.10 za samą górną połowę) podbijało wzrost OVR świata w
      // 5/8 lig zamiast go stabilizować — obniżone do +0.15, wciąż wyraźnie odróżnialne od +0.10.
      if(_isChampionR)_successMultR+=0.15;else if(_topHalfR)_successMultR+=0.10;
      if(_wonCupR)_successMultR+=0.15;else if(_finalCupR)_successMultR+=0.08;
      // Tłumienie piętrzenia bonusu sukcesu (audyt stabilności OVR, 14.07.2026): symulacja
      // 100-sezonowa z realnym Pucharem pokazała, że ten bonus bez mechanizmu wygaszającego
      // odwraca kierunek dryfu OVR całego świata ze spadku na niekontrolowany wzrost (+17% do
      // +37% do sezonu 100) — sukces jednego sezonu ułatwia sukces w kolejnym (wyższy OVR →
      // wyższa pozycja → znów bonus), bez końca. Jednorazowy sukces dostaje pełną stawkę
      // (streak=0 → dampen=1.0), ale kolejne sezony sukcesu Z RZĘDU tego samego klubu dają
      // malejący bonus (nigdy nie zerowy — floor przy streak≥10). ai._successStreak persystuje
      // na club.ai między sezonami, tak jak już robi to np. ai._lastSeasonPos.
      const _successStreakR=ai._successStreak||0;
      const _streakDampR=1/(1+0.15*Math.min(10,_successStreakR));
      _successMultR=1.0+(_successMultR-1.0)*_streakDampR;
      ai._successStreak=(_isChampionR||_topHalfR||_wonCupR||_finalCupR)?_successStreakR+1:0;
      const clubDevMult=Math.max(0.7,Math.min(1.6,(aiDef.devMult||1.0)*_repTierR*_successMultR));
      const declineMult=Math.max(0.5,Math.min(1.3,2-clubDevMult));
      // 1. Starzenie: zawodnicy 28+ tracą atrybuty (wolniej w dobrze rozwijających klubach)
      sq.filter(p=>p.age>=28).forEach(p=>{
        const baseDrop=p.age>=33?r(2,4):r(1,2);
        const drop=Math.max(1,Math.round(baseDrop*declineMult));
        const attrs=['tec','pas','sht','def','phy','men'];
        for(let i=0;i<drop;i++){
          const a=attrs[Math.floor(Math.random()*attrs.length)];
          p[a]=Math.max(1,p[a]-1);
        }
        p.value=calcValue(ovr(p),p.age);
      });
      // 2. Naturalne wzrosty: zawodnicy <22 lat zyskują atrybuty. Tempo skalibrowane na
      // realny trening gracza (week-progress.js: cotygodniowy fokus, NOR, bez centrum
      // treningowego) — Monte Carlo obu ścieżek pokazał, że dawne r(1,2)/sezon dawało AI
      // ~1-1,5 pkt/sezon wobec ~8-9 pkt/sezon u gracza (4-9× wolniej), a w dekompozycji
      // sumy OVR świata trening AI netto ledwo równoważył starzenie (+70..+180 pkt/sezon
      // na ~2000 graczy) — praktycznie nie licząc się przy odpływie emerytur (patrz
      // zgłoszenie o spadającym OVR świata, symulacja 16-sezonowa). r(6,10) daje AI przy
      // clubDevMult=1,0 średnio ~8 pkt/sezon — tego samego rzędu co gracz na NOR.
      sq.filter(p=>p.age<=22).forEach(p=>{
        const gain=Math.round(r(6,10)*clubDevMult*(p.trainRate||1.0));
        const attrs=['tec','pas','sht','def','phy','men'];
        for(let i=0;i<gain;i++){
          const a=attrs[Math.floor(Math.random()*attrs.length)];
          if(ovr(p)<p.potential)p[a]=Math.min(99,p[a]+1);
        }
        p.value=calcValue(ovr(p),p.age);
      });
      // 3. Dojrzewanie w wieku 23-27: bez tego pasmo lat świetności zawodnika stało w miejscu
      // między młodzieżowym wzrostem (<=22) a starzeniem (28+) — patrz analiza spadku OVR AI.
      // r(4,8) — ta sama kalibracja co pkt. 2, lekko niżej (odpowiednik malejącego ageMod
      // gracza z wiekiem, patrz week-progress.js).
      sq.filter(p=>p.age>=23&&p.age<=27).forEach(p=>{
        const gain=Math.round(r(4,8)*clubDevMult*(p.trainRate||1.0));
        const attrs=['tec','pas','sht','def','phy','men'];
        for(let i=0;i<gain;i++){
          const a=attrs[Math.floor(Math.random()*attrs.length)];
          if(ovr(p)<p.potential)p[a]=Math.min(99,p[a]+1);
        }
        if(gain>0)p.value=calcValue(ovr(p),p.age);
      });
    });
  });
  // Uzupełnij skład do minimum 22 — realokacja bezpośrednia z nadwyżek (zamknięty świat)
  // shuffled(): losowa kolejność klubów co sezon — patrz komentarz przy analogicznym
  // uzupełnieniu w aiRenewContracts() (match-post.js). aiSignReplacement(): wspólna ścieżka
  // z priorytetem pozycji w deficycie i logiem transferu, patrz match-post.js.
  shuffled(ALL_CLUBS.filter(c=>c.id!==G.myClubId)).forEach(c=>{
    if(!c.ai)return;
    const lg=G.leagues?G.leagues.find(l=>l.clubs.some(x=>x.id===c.id)):null;
    const lvl=lg?lg.level:8;
    const _ovr4c=LEAGUE_OVR[lvl]||[20,35,35,50];
    const curSize=G.players.filter(function(p){return p.clubId===c.id;}).length;
    const cap=aiSigningCap(c,lvl);
    const remaining=Math.max(0,cap-(c.ai.signingsThisSeason||0));
    // Prawdziwy kryzys (<18) ma pierwszeństwo nad limitem sezonowym — poza tym liczy się do
    // wspólnej puli z aiRenewContracts()/aiTransferSeason() (patrz reset licznika wyżej).
    const maxCount=curSize<18?2:Math.min(2,remaining);
    if(maxCount<=0)return;
    aiSignReplacement(c,lvl,{targetSize:22,maxCount,band:[_ovr4c[0]-5,_ovr4c[3]+5]});
  });
}

// ══════════════════════════════════════════════════════════════════
// PUCHAR MISTRZOWSKI — silnik (Wariant B: 2 mecze w tygodniu)
// 64 drużyny (8 najlepszych z każdej ligi) × 6 rund
// Rundy w tygodniach: 5, 10, 15, 21, 27, 33
// ══════════════════════════════════════════════════════════════════
