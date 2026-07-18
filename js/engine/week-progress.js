function advWeek(){G.week++;if(G.week>=3)G.round++;if(!G.trainFocusLock)G.trainFocusLock=0;
  // ── PUCHAR MISTRZOWSKI — sprawdź trigger ──────────────────────────────
  checkCupTrigger();
  // ── RYNEK TRANSFEROWY — ETAP 2 ───────────────────────────────────────
  {
    const _tw=isTransferWindow();

    // ── OTWARCIE OKNA ZIMOWEGO ──────────────────────────────────────────
    if(G.round===16&&G.week>2&&!G._zimowePrepared){
      G.transferMarket=[];genTransferMarket();
      G.trBoughtThisWindow=0;G.listedPlayers=[];G.pendingOffers=[];G._zimowePrepared=true;
      // AI zimowe transfery
      try{aiTransferSeason(true);}catch(e){console.warn('aiTransferSeason winter error:',e);}
      // Bezpiecznik: zimowe transfery AI mogły sprzedać jedynego bramkarza klubu — patrz state.js.
      ensureClubGoalkeepers();
      addNews(t('news_tr_winter_open'),'budget');G.news[0].action='transfers';G.news[0].actionLabel=t('news_tr_action_label');
    }

    // ── TYDZIEN 2 OKNA — OSTATNIA SZANSA ──────────────────────────────
    // Deadline letniego okna obsluzone w advWeekPrep
    // Zimowe: runda 17 (ostatni tyg zimowego okna)
    if(G.round===17&&G.week>2&&!G._deadlineZimDone){
      G._deadlineZimDone=true;
      (G.transferMarket||[]).forEach(p=>{if(p.section==='rumour'){p.section='sale';p.rumourWeeks=0;}});
      (G.transferMarket||[]).forEach(p=>p._deadline=true);
      addNews(t('news_tr_winter_deadline'),'budget');
      if(document.getElementById('tr-kup')&&document.getElementById('tr-kup').classList.contains('on'))renderBuyTab();
    }

    // ── ZAMKNIECIE OKNA — news kto odszedl ────────────────────────────
    // Zamkniecie letniego okna obsluzone w advWeekPrep
    if(G.round===18&&G.week>2&&!G._zimoweClosed){
      G._zimoweClosed=true;
      const _remained=(G.transferMarket||[]).filter(p=>p.section==='sale');
      const _gone=_remained.slice(0,Math.min(2,Math.floor(_remained.length*0.5)));
      _gone.forEach(p=>{
        const _buyer=pick((G.leagues||[]).flatMap(l=>l.clubs||[]).filter(c=>c.id!==G.myClubId));
        addNews(t('news_tr_winter_missed').replace('{name}',p.name).replace('{club}',_buyer?_buyer.n:t('news_tr_other_club')),'budget');
        G.transferMarket=(G.transferMarket||[]).filter(x=>x.id!==p.id);
      });
      // Plotki zawsze przeszly do sale przy deadline — nic do zrobienia
      addNews(t('news_tr_winter_closed'),'budget');
      G._zimowePrepared=false;
    }
    if(G.round===19&&G.week>2){G._zimoweClosed=false;G._deadlineZimDone=false;}

    // ── PLOTKI MIEDZY OKNAMI — co 4 kolejki ───────────────────────────
    if(!_tw.open&&G.round>2&&G.round<16&&G.round%4===0&&G.week>2){
      // Generuj plotkę — zapisz do poczekalni na następne okno
      const _lvls=[G.myLeague-1,G.myLeague,G.myLeague+1].filter(l=>l>=1&&l<=8);
      const _lvl=_lvls[Math.floor(Math.random()*_lvls.length)];
      const _tmp=mkPlayer(0);
      const _ovrs=LEAGUE_OVR[_lvl]||[20,35,35,50];
      const _t=r(_ovrs[0],_ovrs[3]);
      ['tec','pas','sht','def','phy','men'].forEach(a=>{_tmp[a]=Math.max(1,Math.min(99,Math.round(_t+r(-8,8))));});
      _tmp.value=calcValue(ovr(_tmp),_tmp.age);
      _tmp.salary=calcSalary(_tmp.value,null,ovr(_tmp));
      const _o2=ovr(_tmp);
      const [_mn2,_mx2]=_o2<=25?[90,115]:_o2<=45?[95,120]:_o2<=60?[100,130]:[105,140];
      _tmp.transferPrice=Math.round(_tmp.value*((_mn2+r(0,_mx2-_mn2))/100)/500)*500;
      genTransferContext(_tmp,_lvl);
      genDemands(_tmp);
      _tmp.section='sale'; // od razu dostepny gdy okno sie otworzy
      const _clubs=(G.leagues||[]).flatMap(l=>l.clubs||[]).filter(c=>c.id!==G.myClubId);
      const _club=_clubs.length?_clubs[Math.floor(Math.random()*_clubs.length)]:{n:t('week_fallback_club')};
      _tmp.prevClub=_club.n;
      if(!G.rumourPool)G.rumourPool=[];
      // Max 5 w poczekalni
      if(G.rumourPool.length<5)G.rumourPool.push(_tmp);
      (function(){const _scoutErrors={free:{min:10,max:20},local:{min:6,max:12},regional:{min:4,max:8},national:{min:2,max:6},pro:{min:1,max:4},elite:{min:1,max:2}};const _sd=scoutDef();const _err=_scoutErrors[_sd.id]||_scoutErrors.free;const _rawOvr=ovr(_tmp);const _showOvr=Math.round(_rawOvr+(Math.random()<0.5?1:-1)*(_err.min+Math.floor(Math.random()*(_err.max-_err.min+1))));addNews(t('news_tr_rumour_next').replace('{name}',_tmp.name).replace('{pos}',POS_SHORT[_tmp.pos]).replace('{ovr}',_showOvr).replace('{err}',_err.max),'rumour');})();
    }
  }
  // Odlicz oferty czasowe (zimowe okno)
  if(G.transferMarket){
    G.transferMarket.forEach(p=>{if(p._timed){p._timedWeeks=(p._timedWeeks||1)-1;if(p._timedWeeks<=0){const _lgs=(G.leagues||[]).flatMap(l=>l.clubs||[]).filter(c=>c.id!==G.myClubId);const _b=_lgs[Math.floor(Math.random()*_lgs.length)];addNews(t('news_tr_offer_expired').replace('{name}',p.name).replace('{club}',_b?_b.n:t('news_tr_other_club')),'budget');delete p._timed;p.section='gone';}}});
    G.transferMarket=G.transferMarket.filter(p=>p.section!=='gone');
  }
  // Koszt skauta: jednorazowo przy zatrudnieniu + raz na poczatku sezonu (patrz newSeason)
  // ── SKAUTING — odliczaj obserwacje ─────────────────────────────────
  if(G.scout){
    const sc=G.scout;const sd=scoutDef();
    // Tryb A — obserwacje rynku/plotek/klubów
    sc.modeA=(sc.modeA||[]).map(obs=>{
      obs.roundsLeft--;
      if(obs.roundsLeft<=0){
        // Raport gotowy
        let found=null;
        if(obs.sourceType==='market'){
          found=(G.transferMarket||[]).find(p=>p.id===obs.targetId);
          if(found){found._observed=true;}
        } else if(obs.sourceType==='rumour'||obs.sourceType==='club'){
          found=genObservedPlayer(obs.sourceType,obs.sourceId);
        }
        if(found){
          if(!G.scout.observed)G.scout.observed=[];
          const _slots=scoutDef().modeA_slots||1;
          if(G.scout.observed.length>=_slots){
            const _old=G.scout.observed.shift();
            if(_old&&G.transferMarket)G.transferMarket=G.transferMarket.filter(x=>x.id!==_old.id);
          }
          if(!G.scout.observed.find(x=>x.id===found.id)){
            found._observed=true;found.section='sale';
            if(!G.transferMarket)G.transferMarket=[];
            if(!G.transferMarket.find(x=>x.id===found.id))G.transferMarket.push(found);
            G.scout.observed.push(found);
          }
        }
        G.news=G.news||[];
        G.news.unshift({msg:t('week_notif_scout_report').replace('{name}',name),type:'scout',week:G.week,season:G.season,action:'skauci',actionLabel:t('tr_tab_scouts')});
        if(G.news.length>30)G.news.pop();
        renderNews();
        return null; // usuń z aktywnych
      }
      return obs;
    }).filter(Boolean);
    // Tryb B — szukanie talentów
    if(sc.modeB&&sc.modeB.active){
      sc.modeB.roundsLeft--;
      if(sc.modeB.roundsLeft<=0){
        sc.modeB.active=false;
        if(canScoutModeB()){
          const talent=genTalent();
          if(!sc.discovered)sc.discovered=[];
          sc.discovered.push(talent);
          addNews(t('news_scout_b_talent').replace('{name}',talent.name).replace('{pos}',POS_SHORT[talent.pos]).replace('{age}',talent.age).replace('{pot}',talent.potential),'scout');
        }
      }
    }
    // Odlicz czas decyzji dla odkrytych talentów
    sc.discovered=(sc.discovered||[]).map(p=>{
      p._talentDecisionWeeks=(p._talentDecisionWeeks||2)-1;
      if(p._talentDecisionWeeks<=0){
        addNews(t('news_scout_b_left').replace('{name}',p.name).replace('{pot}',p.potential),'scout');
        return null;
      }
      return p;
    }).filter(Boolean);
  }
  // Odlicz czas "gorącego" zawodnika
  myPl().forEach(p=>{
    if(p._hot){
      p._hotWeeks=(p._hotWeeks||1)-1;
      if(p._hotWeeks<=0){delete p._hot;delete p._hotWeeks;}
    }
  });
  // ── DYNAMICZNA WYCENA — aktualizuj co kolejkę ───────────────────────
  if(G.round>=3){
    myPl().forEach(p=>{
      const base=calcValue(ovr(p),p.age);
      const mult=calcDynamicValueMult(p);
      const newVal=Math.round(base*mult/1000)*1000||base;
      if(newVal!==p.value){p.value=newVal;}
    });
  }
  if(G.trainFocusLock>0)G.trainFocusLock--;
  // ── PRZYPOMNIENIE o braku fokusa treningowego ────────────────────────
  if(G.week>=3){
    if(G.trainFocusLock===0){
      if(!G.noFocusWeeks)G.noFocusWeeks=0;
      G.noFocusWeeks++;
      if(G.noFocusWeeks>=5&&G.noFocusWeeks<=9){
        G.news=G.news||[];G.news.unshift({msg:t('week_notif_no_focus').replace('{n}',G.noFocusWeeks),type:'err',week:G.week,season:G.season,action:'training_plan',actionLabel:t('startnews_action_plan')});renderNews();
      }
    } else {
      G.noFocusWeeks=0;
    }
  }
  // No gains without active focus
  const tOpt2=G.trainFocusLock>0?(TRAIN_OPTS.find(o=>o.k===G.training)||TRAIN_OPTS[0]):null;
  const iOpt2=INTENSITY_OPTS.find(o=>o.k===(G.trainIntensity||'NOR'))||INTENSITY_OPTS[1];
  const gainRange2=tOpt2?iOpt2.gain:[0,0];myPl().forEach(p=>{
  // ageMod na hit_prob (nie na gain) — różnicuje wiek realnie bez problemu zaokrąglenia
  const ageMod2=p.age<=20?1.2:p.age<=24?1.0:p.age<=29?0.9:p.age<=33?0.75:0.55;
  const declineRisk2=p.age>=30?0.08:0;
  if(!tOpt2)return;  // No active focus - skip
  // Profil centrum — hit_prob i synergia
  const _tcProfs=tcProfiles();
  const _focusAttrs=Object.keys((tOpt2||{attrs:{}}).attrs);
  // Synergia: ile profili centrum pokrywa atrybuty fokusu
  const _synCount=_tcProfs.filter(pid=>{
    const _tcp=TC_PROFILES.find(x=>x.id===pid);
    if(!_tcp||!_tcp.attrBonus)return false;
    return _focusAttrs.some(a=>_tcp.attrBonus[a]);
  }).length;
  // hit_prob: base 8%, ageMod na częstotliwość, +1.5% per profil, +2% per synergia (max 20%)
  const _baseHitProb=0.08;
  const _centrumHit=_tcProfs.length*0.008;  // +0.8% per profil
  const _synHit=_synCount*0.012;            // +1.2% per synergia
  const _hitProb=Math.min(0.18,_baseHitProb*ageMod2+_centrumHit+_synHit);
  Object.entries((tOpt2||{attrs:{}}).attrs).forEach(([attr])=>{
    if(Math.random()<_hitProb){
      const base=r(gainRange2[0],gainRange2[1]);
      if(base===0)return;
      const tr=p.trainRate||1.0;
      // Synergia: +15% gainu per pasujący profil centrum
      const _synGainMult=1.0+_synCount*0.15;
      const _archMult4=(p.archetype&&ARCHETYPE_META[p.archetype])?ARCHETYPE_META[p.archetype].mult[attr]||1.0:1.0;
      const gain2=Math.round(base*tr*_synGainMult*_archMult4);
      const before2=p[attr];
      if(declineRisk2>0&&Math.random()<declineRisk2){p[attr]=Math.max(1,p[attr]-r(1,2));}
      else if(gain2>0){p[attr]=Math.min(99,p[attr]+gain2);if(ovr(p)>=p.potential)p[attr]=before2;}
    }
  });
  // Profil Mentalnosc — forma
  if(_tcProfs.includes('mentalnosc'))p.form=Math.min(100,(p.form||100)+3);
  // Profil Kondycja — dodatkowe zmniejszenie zmęczenia
  if(_tcProfs.includes('kondycja'))p.fatigue=Math.max(0,(p.fatigue||0)-3);
  // Weekly form + fatigue z intensywności
  const iOpt3=INTENSITY_OPTS.find(o=>o.k===(G.trainIntensity||'NOR'))||INTENSITY_OPTS[1];
  const formDelta=iOpt3.k==='LOW'?2:iOpt3.k==='HIGH'?-3:0;
  p.form=Math.max(30,Math.min(100,p.form+formDelta+r(-1,1)));
  // Fatigue: HIGH trening zwieksza, LOW redukuje
  if(!p.fatigue)p.fatigue=0;
  // Balans zmeczenia: mecz PHY55 +7/tyg
  // NOR=-6 (netto +1/tyg → ~38% pod koniec sezonu - realistyczne)
  // LOW=-12 (regeneracja: z 50% do 0 w ~4 tyg)
  // HIGH=+8 (szybko rośnie, wymaga LOW co kilka tyg)
  if(iOpt3.k==='HIGH') p.fatigue=Math.round(Math.min(100,p.fatigue+8));
  else if(iOpt3.k==='LOW') p.fatigue=Math.round(Math.max(0,p.fatigue-(tcProfiles().includes('kondycja')?24:12)));
  else p.fatigue=Math.round(Math.max(0,p.fatigue-(tcProfiles().includes('kondycja')?12:6))); // NOR: lekka regeneracja
  // Ryzyko kontuzji treningowej z fatigue
  if(!p.injured){
    const fatRisk=p.fatigue>70?(p.fatigue-70)/400:p.fatigue>50?(p.fatigue-50)/800:0;
    const intRisk=iOpt3.k==='HIGH'?0.012:iOpt3.k==='NOR'?0.003:0;
    const injMult=(p.traits&&p.traits.includes('wytrzymaly'))?0.5:1.0;
    const _regMult=tcProfiles().includes('regeneracja')?0.85:1.0;
    if(Math.random()<(fatRisk+intRisk)*injMult*_regMult) applyInjury(p,false);
  }
  // Wysoka fatigue obniza forme i generuje news
  if(p.fatigue>80){
    p.form=Math.max(30,p.form-2);
    if(p.fatigue>85&&Math.random()<0.3&&p.clubId===G.myClubId)addNews(t('news_fatigue_warn').replace('{name}',p.name).replace('{n}',p.fatigue),'err');
  }
  // Milestone OVR dla wychowanków akademii
  if(p.fromAcademy&&p.clubId===G.myClubId){
    const _curOvr2=ovr(p);
    const _milestones=[40,50,60,70,80];
    const _prevOvr2=p._lastMilestoneOvr||0;
    _milestones.forEach(function(ms){
      if(_prevOvr2<ms&&_curOvr2>=ms){
        const _debH2=p.history?p.history.find(function(h){return h.fromAcademy;}):null;
        const _debSzn2=_debH2?_debH2.season:G.season;
        const _debOvr2=_debH2?_debH2.ovr:_curOvr2;
        addNews(t('news_academy_milestone').replace('{name}',p.name).replace('{debutSeason}',_debSzn2).replace('{debutOvr}',_debOvr2).replace('{ms}',ms).replace('{diff}',_curOvr2-_debOvr2),'academy');
      }
    });
    p._lastMilestoneOvr=_curOvr2;
  }
  // Suspension countdown for my players
  if(p.suspension>0){
    p.suspension--;
    if(p.suspension===0){notif(t('week_notif_back_suspension').replace('{name}',p.name),'ok');addNews(t('news_back_susp').replace('{name}',p.name),'back');}
  }
  // Kronika: iniekcja — po meczu forma obniżona przez 2 tygodnie
  if(p._injectPenalty>0){p._injectPenalty--;p.form=Math.max(40,(p.form||80)-5);}
  if(p.onIndCamp&&p.indCampWeeks>0){
    p.indCampWeeks--;
    if(p.indCampWeeks===0){p.onIndCamp=false;notif(t('week_notif_back_ind_camp').replace('{name}',p.name),'ok');}
  }
  if(p.injured&&p.injuryWeeks>0){
    p.injuryWeeks--;
    if(p.injuryWeeks===0){
      p.injured=false;p.injuryType=null;
      p.form=Math.max(30,p.form);
      notif(t('week_notif_back_injury').replace('{name}',p.name),'ok');
      addNews(t('news_back_inj').replace('{name}',p.name),'back');
    }
  }
});
// Suspension countdown for all other players
// Decrement camp bonus rounds each match week
  const _anyBonus=myPl().some(p=>p.campBonusRounds>0);
  myPl().forEach(p=>{if(p.campBonusRounds>0)p.campBonusRounds--;});
  if(_anyBonus&&!myPl().some(p=>p.campBonusRounds>0))addNews(t('news_camp_bonus_expired'),'info');
  G.players.filter(p=>p.clubId!==G.myClubId).forEach(p=>{
  if(p.suspension>0)p.suspension--;
  if(p.onIndCamp&&p.indCampWeeks>0){
    p.indCampWeeks--;
    if(p.indCampWeeks===0){p.onIndCamp=false;notif(t('week_notif_back_ind_camp').replace('{name}',p.name),'ok');}
  }
  if(p.injured&&p.injuryWeeks>0){p.injuryWeeks--;if(p.injuryWeeks===0){p.injured=false;p.injuryType=null;p.form=Math.max(30,p.form);}}
});processAIOffers();
  // Ostrzeżenia kadrowe
  if(G.week>=3){
    const expGK=myPl().filter(p=>p.pos==='GK'&&p.contract<=1);
    const totalGK=myPl().filter(p=>p.pos==='GK').length;
    if(expGK.length&&totalGK<=expGK.length)
      addNews(t('news_gk_contract_warn').replace('{who}',expGK.length===1?t('news_gk_warn_single').replace('{name}',expGK[0].name):t('news_gk_warn_plural').replace('{n}',expGK.length)),'err');
    const healthyPl=myPl().filter(p=>!p.injured).length;
    if(healthyPl<12)
      addNews(t('news_healthy_warn').replace('{n}',healthyPl),'err');
  }
  if(G.stadium&&G.stadium.building){
    G.stadium.building.weeksLeft--;
    if(G.stadium.building.weeksLeft<=0){
      const b=G.stadium.building;
      const _sMax=(FIN.stadMax&&FIN.stadMax[G.myLeague||8])||50000;
G.stadium.capacity=Math.min(_sMax,(G.stadium.capacity||200)+(b.seats||0));
      if(!G.stadium.hist)G.stadium.hist=[];
      G.stadium.hist.push({season:G.season,week:G.week,seats:b.seats,cost:b.cost,capAfter:G.stadium.capacity});
      G.stadium.building=null;
      pushTimeline('stadium_expand','🏗️',t('tl_stadium_expand').replace('{n}',G.stadium.capacity.toLocaleString('pl-PL')),{sentiment:'pos',weight:10});
      addNews(t('news_stad_expand_ready').replace('{n}',G.stadium.capacity.toLocaleString('pl-PL')),'club');
      notif(t('week_notif_stadium_ready').replace('{n}',G.stadium.capacity),'ok');
    }
  }
  // Odśwież aktywny tab stadionu jeśli panel jest otwarty
  {const _sp=document.getElementById('p-stadium');if(_sp&&_sp.classList.contains('open')){const _at=document.querySelector('#p-stadium .tab-pane.on');if(_at&&_at.id==='stad-rozbudowa')renderStadRozbudowa();else fillStadium();}}
  // Budowa modułu stadionu
  if(G.stadium&&G.stadium.modulBuilding){
    G.stadium.modulBuilding.weeksLeft--;
    if(G.stadium.modulBuilding.weeksLeft<=0){
      const mb=G.stadium.modulBuilding;
      const mod=STAD_MODULES[mb.key];const next=mb.next;
      if(!G.stadium.modules)G.stadium.modules={};
      G.stadium.modules[mb.key]=mb.lvl+1;
      if(next.vipWeekly!==undefined)G.stadium.vipWeekly=next.vipWeekly;
      if(next.gasBonus!==undefined)G.stadium.gasBonus=next.gasBonus;
      if(next.shopMult!==undefined)G.stadium.shopMult=next.shopMult;
      if(next.freqBonus!==undefined)G.frequency=Math.min(100,(G.frequency||50)+next.freqBonus);
      if(next.adsMult!==undefined)G.stadium.adsMult=next.adsMult;
      if(next.repBonus!==undefined)changeReputation(next.repBonus,mod.name+' L'+(mb.lvl+1));
      if(!G.stadium.hist)G.stadium.hist=[];
      G.stadium.hist.push({season:G.season,week:G.week,module:mod.name+' L'+(mb.lvl+1),cost:mb.cost,capAfter:G.stadium.capacity||200});
      G.stadium.modulBuilding=null;
      addNews(t('news_stad_module_ready').replace('{icon}',mod.icon).replace('{name}',mod.name).replace('{lvl}',mb.lvl+1).replace('{effect}',next.effect),'club');
      notif(t('week_notif_module_done').replace('{name}',mod.name).replace('{n}',mb.lvl+1),'ok');
      if(typeof renderStadModuly==='function')renderStadModuly();
    }
  }
  // Contract warnings
  if(!G.contractWarned)G.contractWarned={};
  const _expiring=myPl().filter(p=>p.contract<=1&&!G.contractWarned[p.id]);
  if(_expiring.length>0){
    _expiring.forEach(p=>G.contractWarned[p.id]=true);
    // Store player IDs for clickable links
    const _nameLinks=_expiring.map(p=>'<span data-pid="'+p.id+'" style="cursor:pointer;text-decoration:underline">'+p.name.split(' ')[1]+'</span>').join(', ');
    if(!G.news)G.news=[];
    const _exp=G.week===4?6:32;G.news.unshift({msg:t('week_news_expiring_contracts').replace('{names}',_expiring.map(p=>p.name.split(' ')[1]).join(', ')),type:'contract',week:G.week,season:G.season,pids:_expiring.map(p=>p.id),expires:_exp});
    if(G.news.length>30)G.news.pop();
    renderNews();
  }
  G.fin.salaries=myPl().reduce((s,p)=>s+p.salary,0);
  // CECHY: Szybki start / Słaby start (pierwsze 5 kolejek) — wszystkie kluby (gracz + AI),
  // nie tylko myPl(), żeby cecha działała tak samo u zawodników AI (etap 1 symetrii cech).
  if(G.round>0&&G.round<=5){
    G.players.filter(p=>p.starter).forEach(p=>{
      if(p.traits&&p.traits.includes('szybki_start'))
        p.form=Math.min(99,p.form+2);
      if(p.traits&&p.traits.includes('slaby_start'))
        p.form=Math.max(5,p.form-2);
    });
  }
  if(G.week>=3){
    const _inc=calcWeeklyIncome();
    G.budget+=_inc.total;
    G.fin.weeklyIncome=_inc;
    const _maint=Math.round(((G.stadium&&G.stadium.capacity)||200)*1000*0.005/4.3);G.budget-=_maint;G.fin.maintenance=_maint;
    // _inc.total zawiera szacunkowe bilety; zastępujemy faktycznym przychodem z meczu
    const _ticketActual=G.fin.tickets||0;
    const _incActual=_inc.total-(_inc.tickets||0)+_ticketActual;
    const _hEntry={w:G.week,inc:_incActual,cost:_maint,bal:G.budget,costMaint:_maint,costSalary:0,costTC:0,costAcad:0};
    if(G.week%4===0){const _sal=G.fin.salaries||0;_hEntry.cost+=_sal;_hEntry.costSalary=_sal;G.budget-=_sal;_hEntry.bal=G.budget;if(G.budget<0)notif(t('week_notif_negative_budget'),'err');}
    // Centrum treningowe
    if(G.trainingCenter&&G.trainingCenter.level>0&&!G.trainingCenter.building){
      const _tcUpk=tcUpkeep(G.trainingCenter.level-1);
      G.budget-=_tcUpk;G.fin.tcUpkeep=_tcUpk;
      _hEntry.cost+=_tcUpk;_hEntry.costTC=_tcUpk;_hEntry.bal=G.budget;
    }
    // Akademia
    if(G.academy&&G.academy.level>0&&!G.academy.building){
      const _alIdx=G.academy.level-1;const _upk=acadUpkeep(_alIdx);
      G.budget-=_upk;G.fin.academyUpkeep=_upk;
      _hEntry.cost+=_upk;_hEntry.costAcad=_upk;_hEntry.bal=G.budget;
      if(G.budget<0)notif(t('week_notif_negative_budget'),'err');
    }
    if(!_hEntry.season)_hEntry.season=G.season;
    G.fin.hist.push(_hEntry);
  }
  G.fin.tickets=0;genWeeklyMarket();
  // ── SKAUCI — odliczanie i raporty ──────────────────────────────────
  if(G.scout){
    const sc=G.scout;
    // Tryb A — obserwacje (ujednolicony system dla wszystkich sourceType)
    (sc.modeA||[]).forEach(obs=>{
      if(obs.done)return;
      obs.roundsLeft=(obs.roundsLeft||1)-1;
      if(obs.roundsLeft>0)return;
      obs.done=true;obs.doneRound=G.round;
      let found=null;
      const st=obs.sourceType||obs.targetType||'';
      if(st==='market'||st==='player'){
        found=(G.transferMarket||[]).find(p=>p.id===obs.targetId)||(G.rumourPool||[]).find(p=>p.id===obs.targetId);
        if(found)found._observed=true;
      }
      if(!found&&(st==='rumour'||st==='market'||st==='')){
        found=genObservedPlayer('rumour',0);
      }
      if(!found&&st==='club'){
        const _cid=obs.targetId||obs.sourceId||0;
        found=genObservedPlayer('club',_cid);
        if(found){const _cl=(G.leagues||[]).flatMap(l=>l.clubs||[]).find(c=>c.id===_cid);if(_cl)found._clubScouted=_cl.n;}
      }
      if(found){
        if(!sc.observed)sc.observed=[];
        // Ogranicz liczbę raportów gotowych do limitu slotów skauta
        const _slots=scoutDef().modeA_slots||1;
        if(sc.observed.length>=_slots){
          // Usuń najstarszy raport z transferMarket też
          const _old=sc.observed.shift();
          if(_old&&G.transferMarket)G.transferMarket=G.transferMarket.filter(x=>x.id!==_old.id);
        }
        if(!sc.observed.find(x=>x.id===found.id)){
          found._observed=true;found.section='sale';
          if(!G.transferMarket)G.transferMarket=[];
          if(!G.transferMarket.find(x=>x.id===found.id))G.transferMarket.push(found);
          sc.observed.push(found);
        }
      }
const name=found?found.name:t('week_fallback_no_candidates');
      G.news=G.news||[];
      G.news.unshift({msg:t('week_notif_scout_report').replace('{name}',name),type:'scout',week:G.week,season:G.season,action:'skauci',actionLabel:t('tr_tab_scouts')});
      if(G.news.length>30)G.news.pop();
      renderNews();
    });
    if(sc.modeA)sc.modeA=sc.modeA.filter(o=>!o.done||(G.round-(o.doneRound||G.round)<8));
    // Tryb B — szukanie talentow
    if(sc.modeB&&sc.modeB.active){
      sc.modeB.roundsLeft--;
      if(sc.modeB.roundsLeft<=0){
        sc.modeB.active=false;
        if(canScoutModeB()){
          const talent=genTalent();
          if(!sc.discovered)sc.discovered=[];
          sc.discovered.push(talent);
          addNews(t('news_scout_b_talent').replace('{name}',talent.name).replace('{pos}',POS_SHORT[talent.pos]).replace('{age}',talent.age).replace('{pot}',talent.potential),'scout');
        }
      }
    }
    // Odlicz czas decyzji dla odkrytych talentow
    sc.discovered=(sc.discovered||[]).map(p=>{
      p._talentDecisionWeeks=(p._talentDecisionWeeks||2)-1;
      if(p._talentDecisionWeeks<=0){addNews(t('news_scout_b_left').replace('{name}',p.name).replace('{pot}',p.potential),'scout');return null;}
      return p;
    }).filter(Boolean);
  }
  // ── CENTRUM SZKOLENIOWE — budowa ─────────────────────────────────────
  if(G.trainingCenter&&G.trainingCenter.building){
    G.trainingCenter.building.weeksLeft--;
    if(G.trainingCenter.building.weeksLeft<=0){
      G.trainingCenter.level=G.trainingCenter.building.levelIdx;
      const _tcName=G.trainingCenter.building.name;
      G.trainingCenter.building=null;
      addNews(t('news_tc_ready').replace('{n}',_tcName),'club');
      notif(t('week_notif_tc_done').replace('{name}',_tcName),'ok');
    }
  }
  // Utrzymanie centrum — koszt uwzględniony w bloku fin.hist powyżej
  // Odblokuj profile przy nowym oknie fokusu
  if(G.trainingCenter&&G.trainFocusLock===7){
    G.trainingCenter.profilesLocked=false;
  }
  if(G.academy&&G.academy.building){
    G.academy.building.weeksLeft--;
    if(G.academy.building.weeksLeft<=0){
      G.academy.level=G.academy.building.levelIdx;
      const _aName=G.academy.building.name;
      G.academy.building=null;
      addNews(t('news_academy_ready').replace('{name}',_aName),'academy');
      notif(t('week_notif_academy_done').replace('{name}',_aName),'ok');
    }
  }
  // Liga min — sprawdz zawodnikow
  myPl().forEach(function(p){
    if(p.leagueMin&&(G.myLeague||8)>p.leagueMin){
      if(!p._leagueWarn){p._leagueWarn=true;addNews(t('news_league_clause_warn').replace('{name}',p.name).replace('{n}',p.leagueMin),'err');p.form=Math.max(20,(p.form||100)-20);}
    } else if(p.leagueMin){p._leagueWarn=false;}
  });
  // ── KRONIKA KLUBU — aktualizacja i trigger ──────────────────────────
  if(G.week>=4&&!G.seasonEnded){kronUpdateBenchWeeks();kronTrigger();}
  // ── PAMIĘĆ KIBICÓW — niezależny, rzadki trigger ─────────────────────
  if(G.week>=4&&!G.seasonEnded){fanMemoryTrigger();}
  // ── NADCHODZĄCE WYDARZENIA — zapowiedzi rocznic/rekordów w Aktualnościach ──
  if(G.week>=4&&!G.seasonEnded){checkUpcomingEvents();}
  // ── ŻYWY ŚWIAT AI: pensje klubów AI (co 4 tygodnie, jak u gracza) ─────
  // v4: news o kryzysie finansowym usunięty świadomie (decyzja redakcyjna, nie brak danych) —
  // samo naliczanie budżetu zostaje, bo wpływa na zdolność zakupową AI w aiTransferSeason().
  if(G.leagues){
    G.leagues.forEach(lg=>{
      lg.clubs.forEach(club=>{
        if(club.id===G.myClubId||!club.ai)return;
        if(G.week%4===0){
          const squadBill=G.players.filter(p=>p.clubId===club.id).reduce((s,p)=>s+(p.salary||0),0);
          club.ai.budget=(club.ai.budget||0)-squadBill;
        }
      });
    });
  }
  // ── ŻYWY ŚWIAT AI: scalanie newsów tygodnia klubu (digest) + walka o tytuł/spadek ──
  flushAllWeeklyNews();
  checkTitleRelegationRace();
  // Akademia — koszt uwzględniony w bloku fin.hist powyżej
  finalizeSeasonEnd();
}

// ── Nagrody sezonowe zawodnika — wspólne dla klubu gracza i klubów AI ────────
// Wywoływane raz na klub na koniec sezonu z już obliczonymi flagami (mistrzostwo/awans/Puchar
// TEJ konkretnej drużyny) — zapisuje trwałe wpisy do p.awards każdego zawodnika składu. Klub
// gracza woła to niżej (finalizeSeasonEnd) z G.trophies; kluby AI — z season-summary.js, liczone
// z G.allStandings/G.cupHistory (uniwersalne, bo AI nie ma G.trophies). 'legend' pomija się
// samoistnie dla AI — G.legends/allTimeStats to system tylko dla klubu gracza, po prostu nigdy
// nie znajdzie dopasowania po p.id, nie trzeba specjalnie tego warunkować.
// season: opcjonalnie numer sezonu, który się kończy (domyślnie bieżący G.season) — MUSI być
// podany jawnie, gdy wołane po G.season++ (season-summary.js, kluby AI), inaczej nagroda
// dostaje datę już podbitego, nowego sezonu zamiast tego, w którym faktycznie została zdobyta.
function assignSeasonAwards(clubId,squad,leagueWon,cupWon,cupFin,promotionWon,season){
  if(season==null)season=G.season;
  var _topScr=squad.filter(function(p){return p.st&&(p.st.g||0)>0;}).sort(function(a,b){return (b.st.g||0)-(a.st.g||0);})[0];
  var _topRat=squad.filter(function(p){return p.seasonRatings&&p.seasonRatings.length>=5;}).sort(function(a,b){var ar=a.seasonRatings.reduce(function(s,r){return s+r;},0)/a.seasonRatings.length;var br=b.seasonRatings.reduce(function(s,r){return s+r;},0)/b.seasonRatings.length;return br-ar;})[0];
  squad.forEach(function(p){
    if(!p.awards)p.awards=[];
    // Drużynowe
    if(leagueWon)p.awards.push({type:'league',icon:'🏆',label:t('award_league_title'),tier:'gold',season:season});
    if(cupWon)p.awards.push({type:'cup_win',icon:'🥇',label:t('ht_champions_cup'),tier:'gold',season:season});
    if(cupFin&&!cupWon)p.awards.push({type:'cup_final',icon:'🥈',label:t('ht_cup_finalist'),tier:'silver',season:season});
    if(promotionWon&&!leagueWon)p.awards.push({type:'promotion',icon:'⬆️',label:t('award_promotion'),tier:'silver',season:season});
    // Indywidualne
    if(_topScr&&p.id===_topScr.id&&(_topScr.st.g||0)>0)p.awards.push({type:'top_scorer',icon:'⚽',label:t('award_top_scorer').replace('{n}',_topScr.st.g||0),tier:'indiv',season:season});
    if(_topRat&&p.id===_topRat.id&&p.seasonRatings&&p.seasonRatings.length>=5){var _ar=Math.round(_topRat.seasonRatings.reduce(function(s,r){return s+r;},0)/_topRat.seasonRatings.length*10)/10;p.awards.push({type:'best_rating',icon:'⭐',label:t('award_player_of_season').replace('{n}',_ar),tier:'indiv',season:season});}
    // MVP meczu — zagregowane per sezon (patrz match-post.js::_globalMom)
    if((p.seasonMomCount||0)>0)p.awards.push({type:'mvp_matches',icon:'⭐',label:t('award_mvp_matches').replace('{n}',p.seasonMomCount),tier:'indiv',season:season});
    // Legenda
    if(G.legends&&G.legends.find(function(l){return l.id===p.id&&l.season===season;}))p.awards.push({type:'legend',icon:'👑',label:t('award_club_legend'),tier:'legend',season:season});
    // Wierny Klubowi (One Club Man) — 5+ sezonów z minutami w tym samym klubie
    var _clubSeasons=(p.history||[]).filter(function(h){return h.clubId===clubId&&!h._placeholder&&(h.m||0)>0;});
    if(_clubSeasons.length>=5&&!p.awards.find(function(a){return a.type==='one_club_man';}))
      p.awards.push({type:'one_club_man',icon:'🎖️',label:t('leg_one_club_man')+' — '+_clubSeasons.length+' sez.',tier:'legend',season:season});
    // Ulubieniec Kibiców (Fan Favourite) — śr. ocena 7.3+ przez min. 3 sezony w klubie
    var _ratedSeasons=_clubSeasons.filter(function(h){return h.avgRat!=null;});
    if(_ratedSeasons.length>=3){
      var _favAvg=_ratedSeasons.reduce(function(s,h){return s+h.avgRat;},0)/_ratedSeasons.length;
      if(_favAvg>=7.3&&!p.awards.find(function(a){return a.type==='fan_favourite';}))
        p.awards.push({type:'fan_favourite',icon:'❤️',label:t('leg_fan_favourite')+' — '+(Math.round(_favAvg*10)/10),tier:'legend',season:season});
    }
  });
}
// ── Migracja: napraw nagrody AI błędnie oznaczone dopiero co rozpoczętym sezonem ────────────
// Pierwsza wersja assignSeasonAwards() dla klubów AI (season-summary.js) była wołana już PO
// G.season++ i nie dostawała jawnego numeru kończącego się sezonu — nagrody za sezon, który
// właśnie się skończył, zapisywały się z numerem NOWEGO sezonu (już naprawione, patrz wywołanie
// w season-summary.js). Jedyny legalny moment na wpis z season===G.season to samo wywołanie
// assignSeasonAwards() w trakcie kończenia tego sezonu — poza tym momentem (czyli zawsze, gdy ta
// migracja faktycznie działa) taki wpis może być tylko artefaktem tego błędu.
function fixMisdatedSeasonAwards(){
  if(!G||!G.players||(G.season||1)<=1)return;
  const allP=[...G.players,...(G.retiredPlayers||[]),...(G.fa||[])];
  allP.forEach(p=>{
    (p.awards||[]).forEach(a=>{
      if(!a._live&&a.season===G.season)a.season=G.season-1;
    });
  });
}

// ── PUCHAR: zakończenie sezonu ligowego jest wstrzymywane, dopóki gracz ma
// nierozegrany finał Pucharu Mistrzowskiego (ten wypada w tygodniu 33, już poza
// harmonogramem ligi — patrz match-ui.js::nextMatch, które w takiej sytuacji samo
// aktywuje czekający mecz pucharowy). Bez tej blokady advWeek() kończyłby sezon
// (G.seasonEnded=true) zanim gracz zdążyłby w ogóle zagrać finał.
function finalizeSeasonEnd(){
  if(!G||G.round<=30||G.seasonEnded)return;
  if(G.cup&&G.cup.active&&G.cup.pendingMyMatch)return; // czeka na rozegranie finału
  G.seasonEnded=true;calcSeasonValuations();updateHdr();notif(t('week_notif_season_end').replace('{n}',G.season),'ok');
  // Zapisz historię sezonu dla WSZYSTKICH zawodników — musi być TU, przed startNewSeason które resetuje p.st
  const _allForHistory=[...G.players,...(G.fa||[])];
  // Uzupełnij luki — każdy zawodnik powinien mieć wpis dla każdego sezonu od S1 do bieżącego
  _allForHistory.forEach(p=>{
    fillHistoryGaps(p); // uzupełnij S1..G.season-1
  });
  _allForHistory.forEach(p=>{
    if(!p.st)p.st={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0};
    if(!p.history)p.history=[];
    const _hClub=ALL_CLUBS.find(c=>c.id===p.clubId);
    const _clubName=_hClub?_hClub.n:(p.clubId===0?t('plr_free_agent'):'?');
    const _avgRat=p.seasonRatings&&p.seasonRatings.length?Math.round(p.seasonRatings.reduce((s,r)=>s+r,0)/p.seasonRatings.length*10)/10:null;
    // Jeśli jest wpis _current dla tego sezonu — zaktualizuj go zamiast duplikować
    const _curIdx=p.history.findIndex(h=>h._current&&h.season===G.season&&h.clubId===p.clubId);
    if(_curIdx>=0){
      p.history[_curIdx]={season:G.season,clubId:p.clubId,club:_clubName,m:p.st.m||0,g:p.st.g||0,a:p.st.a||0,yk:p.st.yk||0,rk:p.st.rk||0,cs:p.st.cs||0,ga:p.st.ga||0,ovr:ovr(p),avgRat:_avgRat,transferOut:p.history[_curIdx].transferOut,fromAcademy:p.history[_curIdx].fromAcademy||undefined,cupSt:p.cupSt&&p.cupSt.m>0?{m:p.cupSt.m,g:p.cupSt.g||0,a:p.cupSt.a||0,cs:p.cupSt.cs||0,ga:p.cupSt.ga||0,yk:p.cupSt.yk||0,rk:p.cupSt.rk||0,avgRat:p.cupSt.ratings&&p.cupSt.ratings.length?Math.round(p.cupSt.ratings.reduce((s,r)=>s+r,0)/p.cupSt.ratings.length*10)/10:null}:null};
    } else {
      p.history.push({season:G.season,clubId:p.clubId,club:_clubName,m:p.st.m||0,g:p.st.g||0,a:p.st.a||0,yk:p.st.yk||0,rk:p.st.rk||0,cs:p.st.cs||0,ga:p.st.ga||0,ovr:ovr(p),avgRat:_avgRat,cupSt:p.cupSt&&p.cupSt.m>0?{m:p.cupSt.m,g:p.cupSt.g||0,a:p.cupSt.a||0,cs:p.cupSt.cs||0,ga:p.cupSt.ga||0,yk:p.cupSt.yk||0,rk:p.cupSt.rk||0,avgRat:p.cupSt.ratings&&p.cupSt.ratings.length?Math.round(p.cupSt.ratings.reduce((s,r)=>s+r,0)/p.cupSt.ratings.length*10)/10:null}:null});
    }
  });
  const _sorted=[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
  const _pos=_sorted.findIndex(s=>parseInt(s.cid)===parseInt(G.myClubId));
  const _myStand=_sorted[_pos]||{};
  const _bonusArr=(FIN.bonus&&FIN.bonus[G.myLeague||8])||[];
  const _bonus=_bonusArr[_pos]||0;
  // Performance bonusy dla zawodnikow
  const _pos2=_pos+1;
  myPl().forEach(p=>{
    if(p.perfBonus&&p.clubId===G.myClubId){
      const earned=_pos2<=3; // TOP 3 lub awans
      if(earned){
        G.budget-=p.perfBonus;
        addNews(t('news_perf_bonus').replace('{name}',p.name).replace('{val}',fmtVal(p.perfBonus)),'err');
      }
    }
    // Loyalty: po 2 sezonach wygasa
    if(p.loyaltyGuarantee&&(G.season||1)>=p.loyaltyGuarantee){
      delete p.loyaltyGuarantee;
    }
  });
  // Awans/spadek wpływa na wartość zawodników
  const _oldLvl=G.myLeague||8;
  if(_bonus>0){G.budget+=_bonus;G.seasonBonus=_bonus;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:_bonus,cost:0,bal:G.budget,season:G.season,note:t('week_note_league_bonus').replace('{n}',_pos+1)});addNews(t('news_league_bonus').replace('{n}',_pos+1).replace('{val}',fmtVal(_bonus)),'club');}
  else{G.seasonBonus=0;}
  // Rekordy sezonowe
  if(!G.records)G.records={maxWinStreak:0,maxUnbeatenStreak:0,maxLoseStreak:0,unbeatenStreak:0,bestWin:null,maxGoalsSeason:0,maxGoalsSeason_s:0,minConcededSeason:99,minConcededSeason_s:0,minGoalsSeason:999,minGoalsSeason_s:0,maxConcededSeason:0,maxConcededSeason_s:0};
  const _gf2=_myStand.gf||0,_ga2=_myStand.ga||0;
  if(_gf2>(G.records.maxGoalsSeason||0)){G.records.maxGoalsSeason=_gf2;G.records.maxGoalsSeason_s=G.season;}
  if(_ga2<(G.records.minConcededSeason===undefined?99:G.records.minConcededSeason)){G.records.minConcededSeason=_ga2;G.records.minConcededSeason_s=G.season;}
  if(_gf2<(G.records.minGoalsSeason===undefined||G.records.minGoalsSeason===999?9999:G.records.minGoalsSeason)){G.records.minGoalsSeason=_gf2;G.records.minGoalsSeason_s=G.season;}
  if(_ga2>(G.records.maxConcededSeason||0)){G.records.maxConcededSeason=_ga2;G.records.maxConcededSeason_s=G.season;}
  if(!G.trophies)G.trophies=[];
  // Sprawdź nowe legendy (po zaktualizowaniu allTimeStats)
  if(G.allTimeStats&&G.allTimeStats.players){
    if(!G.legends)G.legends=[];
    Object.values(G.allTimeStats.players).forEach(stat=>{
      if(G.legends.find(l=>l.id===stat.id))return; // już legenda
      const allPool2=[...(G.players||[]),...(G.retiredPlayers||[]),...(G.fa||[])];
      const leagues2=(G.trophies||[]).filter(t=>t.type==='league'&&allPool2.find(x=>x.id===stat.id)?.history?.some(ph=>ph.season===t.season&&ph.clubId===G.myClubId)).length;
      const cups2=(G.trophies||[]).filter(t=>t.type==='cup'&&t.place===1&&allPool2.find(x=>x.id===stat.id)?.history?.some(ph=>ph.season===t.season&&ph.clubId===G.myClubId)).length;
      const sc=Math.round((Math.min(stat.matches*0.25,75)+Math.min(stat.goals*0.5,50)+Math.min(stat.assists*0.3,30)+leagues2*12+cups2*8)*10)/10;
      if(sc>=200){
        G.legends.push({id:stat.id,name:stat.name,score:sc,season:G.season});
        changeReputation(15,t('rep_reason_legend').replace('{name}',stat.name));
        addNews(t('news_new_legend').replace('{name}',stat.name).replace('{n}',sc),'academy');
      }
    });
  }
  // Sprawdź cele zarządu
  checkBoardGoals();
  if((_pos+1)===1){
    G.trophies.push({type:'league',league:G.myLeague||8,leagueName:LEAGUE_NAMES[G.myLeague||8],season:G.season});
    addNews(t('news_championship').replace('{league}',LEAGUE_NAMES[G.myLeague||8].toUpperCase()),'ok');
  }
  // Specjalne trofea sezonowe
  if(!G.trophies)G.trophies=[];
  // Niepokonani: 0 porażek w tym sezonie
  if((_myStand.l||0)===0&&_myStand.p>0&&!G.trophies.find(t=>t.id==='unbeaten_season'&&t.season===G.season))
    G.trophies.push({type:'special',id:'unbeaten_season',name:t('trophy_unbeaten'),season:G.season});
  if(_gf2>=80&&!G.trophies.find(t=>t.id==='strzelnica'&&t.season===G.season))
    G.trophies.push({type:'special',id:'strzelnica',name:t('trophy_sharpshooters'),season:G.season});
  if(_ga2===0&&!G.trophies.find(t=>t.id==='mur'&&t.season===G.season))
    G.trophies.push({type:'special',id:'mur',name:t('trophy_defensive_wall'),season:G.season});
  if((G.records.maxWinStreak||0)>=10&&!G.trophies.find(t=>t.id==='seria10'&&t.season===G.season))
    G.trophies.push({type:'special',id:'seria10',name:t('trophy_streak10'),season:G.season});
  if(myPl().some(p=>p.fromAcademy&&G.allTimeStats&&G.allTimeStats.players[p.id]&&G.allTimeStats.players[p.id].matches>=20)&&!G.trophies.find(t=>t.id==='odkrywca'))
    G.trophies.push({type:'special',id:'odkrywca',name:t('trophy_talent_spotter'),season:G.season});
  if(G.stadium&&G.stadium.capacity>=10000&&!G.trophies.find(t=>t.id==='budowlaniec'))
    G.trophies.push({type:'special',id:'budowlaniec',name:t('trophy_builder'),season:G.season});
  // Nagrody indywidualne zawodników — zapis do p.awards (klub gracza — dla AI patrz
  // assignSeasonAwards() niżej, wołane analogicznie z season-summary.js)
  (function(){
    var _squad=myPl();
    var _cupWon=G.trophies&&G.trophies.some(function(t){return t.type==='cup'&&t.place===1&&t.season===G.season;});
    var _cupFin=G.trophies&&G.trophies.some(function(t){return t.type==='cup'&&t.place===2&&t.season===G.season;});
    var _leagueWon=(_pos+1)===1;
    var _promotionWon=(_pos+1)<=2&&(G.myLeague||8)>1;
    assignSeasonAwards(G.myClubId,_squad,_leagueWon,_cupWon,_cupFin,_promotionWon);
  })();
  // Zapisz historię sezonu
  if(!G.cHist)G.cHist=[];
  G.cHist.push({
    season:G.season,
    league:LEAGUE_NAMES[G.myLeague||8],
    leagueLevel:G.myLeague||8,
    pos:_pos+1,
    pts:_myStand.pts||0,
    w:_myStand.w||0,
    d:_myStand.d||0,
    l:_myStand.l||0,
    p:_myStand.p||0,
    gf:_myStand.gf||0,
    ga:_myStand.ga||0,
    budget:G.budget,
    reputation:G.reputation||30,
    stadiumCap:(G.stadium&&G.stadium.capacity)||200,
    bonus:_bonus,
    table:G.standing?[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)).map((s,i)=>({cid:s.cid,n:s.n,pos:i+1,pts:s.pts||0,w:s.w||0,d:s.d||0,l:s.l||0,p:s.p||0,gf:s.gf||0,ga:s.ga||0})):[]
  });
  // Zapisz historię wszystkich lig
  if(!G.lgHist)G.lgHist={};
  if(G.leagues&&G.allStandings){
    G.leagues.forEach(lg=>{
      const _st=[...(G.allStandings[lg.level]||[])].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
      if(!_st.length)return;
      if(!G.lgHist[lg.level])G.lgHist[lg.level]=[];
      G.lgHist[lg.level].push({
        season:G.season,
        champion:_st[0]?{cid:_st[0].cid,n:_st[0].n,pts:_st[0].pts||0}:null,
        table:_st.map((s,i)=>({cid:s.cid,n:s.n,pos:i+1,pts:s.pts||0,w:s.w||0,d:s.d||0,l:s.l||0,p:s.p||0,gf:s.gf||0,ga:s.ga||0}))
      });
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU v207 — silnik wydarzeń losowych z decyzjami
// ══════════════════════════════════════════════════════════════════════════
