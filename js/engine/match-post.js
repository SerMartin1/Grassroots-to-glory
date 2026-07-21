let _subsLeft=3,_subOutId=null;
function openSubs(){
  if(!matchInProgress){notif(t('mp_match_over_no_subs'),'err');return;}
  if(_subsLeft<=0){notif(t('mp_no_subs_left'),'err');return;}
  const panel=document.getElementById('m-sub-panel');if(!panel)return;
  document.getElementById('m-subs-left').textContent='('+_subsLeft+'/3)';
  // v199: info o zmęczeniu (PHY = kondycja fizyczna zawodnika)
  const _subHdr=document.getElementById('m-sub-out-list');
  // nagłówek kolumn będzie w innerHTML poniżej
  const st=myPl().filter(p=>p.starter&&!p.injured);
  const ol=document.getElementById('m-sub-out-list');
  if(ol)ol.innerHTML=st.map(p=>{var _phyCol=(p.phy||50)<35?'var(--rd)':(p.phy||50)<50?'var(--am)':'var(--gr)';var _fmCol=p.form<50?'var(--rd)':p.form<75?'var(--am)':'var(--wh)';return '<div style="padding:5px 0;border-bottom:1px solid var(--gl);cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="selectSubOut('+p.id+')">'+'<span style="color:'+_fmCol+'">'+( POS_SHORT[p.pos]||p.pos)+' '+p.name+'</span>'+'<span style="font-size:var(--fs-dense);display:flex;gap:6px">'+'<span style="color:'+_fmCol+'">fm:'+p.form+'%</span>'+'<span style="color:'+_phyCol+'">phy:'+(p.phy||50)+'</span>'+'</span>'+'</div>';}).join('');
  document.getElementById('m-sub-in-section').style.display='none';
  panel.style.display='flex';_subOutId=null;
}
function selectSubOut(pid){
  _subOutId=pid;
  const pOut=G.players.find(x=>x.id===pid);
  // Filtruj ławkę — ta sama pozycja
  const bench=myPl().filter(x=>!x.starter&&!x.injured&&x.pos===(pOut?pOut.pos:'NAP')).sort((a,b)=>ovr(b)-ovr(a));
  const anyBench=bench.length?bench:myPl().filter(x=>!x.starter&&!x.injured).sort((a,b)=>ovr(b)-ovr(a));
  const il=document.getElementById('m-sub-in-list');
  const posLabel=pOut?(POS_SHORT[pOut.pos]||pOut.pos):'';
  if(il)il.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);margin-bottom:4px">'+t('mp_sub_in_label').replace('{pos}',posLabel).replace('{pos}',posLabel)+'</div>'+(anyBench.length?anyBench.map(x=>'<div style="padding:5px 0;border-bottom:1px solid var(--gl);cursor:pointer;display:flex;justify-content:space-between" onclick="confirmSub('+pid+','+x.id+')"><span style="color:var(--gb)">'+(POS_SHORT[x.pos]||x.pos)+' '+x.name+'</span><span style="color:var(--am)">OVR '+ovr(x)+'</span></div>').join(''):'<div style="color:var(--rd)">'+t('mp_no_players_position')+'</div>');
  document.getElementById('m-sub-in-section').style.display='block';
}
function confirmSub(outId,inId){
  const pOut=G.players.find(x=>x.id===outId),pIn=G.players.find(x=>x.id===inId);
  if(!pOut||!pIn)return;
  pOut.starter=false;pIn.starter=true;_subsLeft--;
  if(!window._matchSubsOut)window._matchSubsOut=[];
  window._matchSubsOut.push(pOut.id);// v199: zapamiętaj kto zszedł
  closeSubs();
  const mlog=document.getElementById('mlog');
  if(mlog){const d=document.createElement('div');d.style.cssText='padding:3px 14px;font-size:var(--fs-meta);color:var(--am);border-bottom:1px solid #0d1f0d';d.textContent=t('mp_sub_log').replace('{out}',pOut.name).replace('{in}',pIn.name).replace('{left}',_subsLeft);mlog.prepend(d);}
  notif(t('mp_sub_notif').replace('{out}',pOut.name).replace('{in}',pIn.name),'ok');
  document.getElementById('m-subs-left').textContent='('+_subsLeft+'/3)';
  if(_subsLeft<=0){const b=document.getElementById('btn-sub');if(b)b.style.opacity='0.3';}
}
function closeSubs(){const p=document.getElementById('m-sub-panel');if(p){p.style.display='none';document.getElementById('m-sub-in-section').style.display='none';}}
// v198: TAKTYCZNY SHIFT — wywołany przez przycisk w logu meczu
// v199: dodaj chip zdarzenia na prawej karcie Wariantu B
function _addEventChip(isH,icon,min){
  var ec=document.getElementById('ls-events-chips');
  if(!ec)return;
  var ch=document.createElement('span');
  // Kolor zależy od ikony i przynależności
  var col;
  if(icon==='⚽') col=isH?'var(--gb)':'var(--rd)';
  else if(icon==='🟡') col='#e6c000';
  else if(icon==='🟥') col='var(--rd)';
  else if(icon==='🔄') col='var(--gb)';
  else col='#00bcd4';
  ch.style.cssText='background:#050f05;border:1px solid '+col+';color:'+col
    +';font-size:var(--fs-dense);padding:1px 4px;white-space:nowrap';
  ch.textContent=icon+' '+min+String.fromCharCode(39);
  ec.appendChild(ch);
}
function _applyTactic(key,shotMod,saveMod){
  if(window._tacticalShift&&window._tacticalShift.used)return;
  window._tacticalShift={shotMod:shotMod,saveMod:saveMod,used:true};
  // Zatrzymaj countdown
  if(window._tacCountdown)clearInterval(window._tacCountdown);
  if(window._tacTimerId)clearTimeout(window._tacTimerId);
  const labels={attack:t('mp_tac_attack'),counter:t('mp_tac_counter'),defend:t('mp_tac_defend'),press:t('mp_tac_press')};
  notif(t('mp_tac_notif').replace('{label}',labels[key]||key),'ok');const _tb2=document.getElementById('ls-tactic-box');const _tn=document.getElementById('ls-tactic-name');if(_tb2)_tb2.style.display='block';const _tacDescs={attack:t('mp_tac_desc_attack'),counter:t('mp_tac_desc_counter'),defend:t('mp_tac_desc_defend'),press:t('mp_tac_desc_press')};const _tacBonus={attack:t('mp_tac_bonus_attack'),counter:t('mp_tac_bonus_counter'),defend:t('mp_tac_bonus_defend'),press:t('mp_tac_bonus_press')};if(_tn)_tn.innerHTML='<span style="font-size:var(--fs-dense);color:var(--gb)">'+(_tacDescs[key]||key)+'</span><br><span style="font-size:var(--fs-dense);color:var(--gr)">'+(_tacBonus[key]||'')+'</span>';
  const mlog=document.getElementById('mlog');
  if(mlog){const d=document.createElement('div');d.style.cssText='padding:3px 14px;font-size:var(--fs-meta);color:var(--am);border-bottom:1px solid #0d1f0d';d.textContent=t('mp_tac_log').replace('{label}',labels[key]||key);mlog.prepend(d);}
  // Wznów mecz natychmiast po wyborze
  if(window._tacResumeNext){window._tacResumeNext();}
}
function autoSubs(){
  if(_subsLeft<=0)return;
  const slabi=myPl().filter(p=>p.starter&&p.form<45).sort((a,b)=>a.form-b.form);
  const bench=myPl().filter(p=>!p.starter&&!p.injured).sort((a,b)=>ovr(b)-ovr(a));
  let done=0;
  for(const pOut of slabi){
    if(done>=Math.min(_subsLeft,2))break;
    // Ta sama pozycja — obowiązkowo
    const pIn=bench.find(x=>x.pos===pOut.pos);
    if(!pIn)continue; // brak na tej pozycji — pomijamy
    pOut.starter=false;pIn.starter=true;bench.splice(bench.indexOf(pIn),1);_subsLeft--;done++;
  }
}
function ratTab(side,btn){
  document.querySelectorAll('#m-oceny-tabs .sq-tab2-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  ['m-rat-home','m-rat-away'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('on');});
  const e=document.getElementById('m-rat-'+side);if(e)e.classList.add('on');
}
// v220: etykiety zakładki BOISKO — zawsze MOJA DRUŻYNA / RYWAL (AI), niezależnie od tego kto gra u siebie
function _setBoiskoSideLabels(isMyHome){
  const _btn1=document.getElementById('m-rat-btn-home');
  const _btn2=document.getElementById('m-rat-btn-away');
  const _txtMe=t('match_side_mine'),_txtRv=t('match_side_rival');
  if(_btn1)_btn1.textContent=isMyHome?_txtMe:_txtRv;
  if(_btn2)_btn2.textContent=isMyHome?_txtRv:_txtMe;
}

function renderRatingsPitch(players, ratings, containerId, globalMomId, matchEvts){
  const el=document.getElementById(containerId);
  if(!el)return;
  // v199: pokaż wszystkich którzy grali — ratings[] zawiera tylko tych którzy startowali
  const st=players.filter(p=>ratings&&ratings[p.id]!==undefined).sort((a,b)=>posOrd(a.pos)-posOrd(b.pos));
  // v220: prosta 3-progowa skala koloru oceny (zielony ≥7 / bursztyn 6–6.9 / czerwony <6)
  const starCol=r=>r>=7?'var(--gb)':r>=6?'var(--am)':'var(--rd)';

  // MOM tej drużyny
  // MOM globalny — przekazany z zewnątrz

  function pitchRow(pls, label){
    if(!pls.length)return '';
    return '<div style="text-align:center;font-size:var(--fs-dense);color:rgba(255,255,255,0.3);margin-top:4px">'+label+'</div>'+
      '<div class="pitch-row">'+pls.map(p=>{
        const r=ratings[p.id];
        const rat=r?r.rating:null;
        const col=rat?starCol(rat):'var(--gr)';
        const isMom=globalMomId&&p.id===globalMomId;
        const ratDisp=rat?rat.toFixed(1)+(isMom?' ⭐':''):'—';
        const goalBalls=r&&r.goals>0?'<span style="font-size:var(--fs-dense);display:block;line-height:1">'+'⚽'.repeat(Math.min(r.goals,4))+'</span>':'';
        const assistIcon=r&&r.assists>0?'<span style="font-size:var(--fs-dense);display:block;line-height:1">'+'🅰️'.repeat(Math.min(r.assists,4))+'</span>':'';
        const mvpTag=isMom?'<span class="fs-micro" style="display:block;color:var(--am);letter-spacing:.06em;line-height:1.3">'+t('match_mvp_tag')+'</span>':'';
        // v199: ikony zdarzeń — kartki z allEvts, zmiany/kontuzje z window
        var _evI='';
        if(matchEvts){
          var _yk=matchEvts.filter(function(e){return e.sid===p.id&&e.type==='yellow';}).length;
          var _rk=matchEvts.some(function(e){return e.sid===p.id&&(e.type==='red'||e.type==='red2y');});
          if(_yk>=1)_evI+='<span style="font-size:9px">🟡</span>';
          if(_yk>=2)_evI+='<span style="font-size:9px">🟡</span>';
          if(_rk)_evI+='<span style="font-size:9px">🟥</span>';
        }
        if(window._matchSubsOut&&window._matchSubsOut.indexOf(p.id)>=0)_evI+='<span style="font-size:9px">🔄</span>';
        if(window._matchInjured&&window._matchInjured.indexOf(p.id)>=0)_evI+='<span style="font-size:9px">🚑</span>';
        var _evBlock=_evI?'<span style="display:block;line-height:1.2">'+_evI+'</span>':'';
        return '<div class="pp" style="cursor:pointer;'+(isMom?'border-color:var(--am);':'')+'" onclick="showById('+p.id+')">'+
          '<span class="pp-name">'+(p.name?p.name.split(' ').pop().substring(0,8):p.last||'?')+'</span>'+
          goalBalls+
          assistIcon+
          _evBlock+
          '<span class="pp-rat" style="color:'+col+'">'+ratDisp+'</span>'+
          mvpTag+
          (p.fromAcademy?'<span class="pp-acad-badge">🎓</span>':'')+
        '</div>';
      }).join('')+'</div>';
  }

  // v220: pasek "TAKTYKA NA MECZ" tej drużyny — te same dane co widok przedmeczowy w fillMatch()
  var _tacHtml='';
  if(st.length){
    var _clubId=st[0].clubId;
    var _isMineTac=_clubId===G.myClubId;
    var _tac=_isMineTac?{formation:G.formation,style:G.style||'Zrównoważony'}:((G.clubTactics&&G.clubTactics[_clubId])||{formation:'4-4-2',style:'Zrównoważony'});
    var _tacIcon={'Defensywny':'🛡','Zrównoważony':'⚖️','Ofensywny':'⚔️'}[_tac.style]||'⚖️';
    _tacHtml='<div class="tacinfo '+(_isMineTac?'me':'rv')+'">'+
      '<span class="tlab">'+t('match_tactic_on_match')+'</span>'+
      '<span class="tval">'+_tac.formation+' · '+_styleLabel(_tac.style)+' '+_tacIcon+'</span>'+
    '</div>';
  }

  el.innerHTML=_tacHtml+
    '<div style="background:#1a3d1a;min-height:200px;padding:8px 4px;border-bottom:1px solid var(--gl)">'+
    pitchRow(st.filter(p=>p.pos==='NAP'),t('mp_pos_forwards'))+
    pitchRow(st.filter(p=>p.pos==='POL'),t('mp_pos_midfielders'))+
    pitchRow(st.filter(p=>p.pos==='OBR'),t('mp_pos_defenders'))+
    pitchRow(st.filter(p=>p.pos==='GK'),t('mp_pos_goalkeeper'))+
    '</div>';
}

// v231: malejące przychody krańcowe — kolejne wystąpienia tej samej akcji w meczu (szereg
// harmoniczny: waga, waga/2, waga/3...) liczą się coraz mniej, żeby np. trzeci gol napastnika
// w meczu wygranym wysoko nie dominował oceny tak samo jak pierwszy. Stosowane tylko do
// powtarzalnych akcji ofensywno-kreacyjnych (gole/asysty/strzały celne/kluczowe podania) —
// NIE do obron/wybić (to praca defensywna "na sztuki", nie powinna być karana za częstość).
function _diminish(weight,n){
  let total=0;
  for(let i=1;i<=n;i++)total+=weight/i;
  return total;
}
// v231: premia "clutch" — gol, który wyrównuje lub daje prowadzenie (nie zwykłe dobicie już
// wygranego meczu), tym większa im później w meczu. Wykorzystuje dane już zapisane w allEvts
// (min, isH, sid — te same, z których budowany jest komentarz meczowy), więc nie trzeba
// dokładać żadnej nowej struktury. Kształt późnej fazy meczu świadomie zgodny z _timeMod()
// (match-engine.js) — inna funkcja bo tamta moduluje żywą szansę na strzał, nie ocenę pomeczową.
function _clutchBonusMap(evts){
  const bonus={};
  if(!evts)return bonus;
  const goals=evts.filter(e=>e.type==='goal').slice().sort((a,b)=>a.min-b.min);
  let hTally=0,aTally=0;
  goals.forEach(e=>{
    const before=e.isH?hTally:aTally, oppBefore=e.isH?aTally:hTally;
    if(before<=oppBefore){
      const lateMult=e.min<=70?1.0:e.min<=84?1.0+(e.min-70)/70*0.5:1.5+(Math.min(90,e.min)-85)/5*0.3;
      bonus[e.sid]=(bonus[e.sid]||0)+0.4*lateMult;
    }
    if(e.isH)hTally++;else aTally++;
  });
  return bonus;
}
function calcFinalRatings(ratings, iW, iL, hG, aG, _wasCupMatch){
  // Wariant 3: pełna symulacja per-zawodnik, obie drużyny
  const bothTeams=G.players.filter(p=>(p.clubId===m_hId||p.clubId===m_aId)&&p.starter);
  // v231: allEvts to globalna zmienna z match-engine.js (ta sama, z której korzysta już
  // renderRatingsPitch/openMatchSummary w tym pliku) — brak allEvts (np. stary zapis) = brak
  // premii clutch, reszta oceny liczy się normalnie.
  const _clutchMap=_clutchBonusMap(typeof allEvts!=='undefined'?allEvts:null);

  bothTeams.forEach(p=>{
    const r=ratings[p.id];if(!r)return;
    const isH=p.clubId===m_hId;
    const myGoals=isH?hG:aG;
    const oppGoals=isH?aG:hG;
    const won=myGoals>oppGoals,lost=myGoals<oppGoals;

    // v231: ocena bazowa 6.0 dla pełnego meczu (skala 1.0-10.0 bez zmian) — jakość zawodnika
    // wybija się teraz przez realny wkład w mecz, nie przez samą siłę na papierze.
    let base=6.0;

    const g=r.goals||0,a=r.assists||0,sv=r.saves||0;
    const cl=r.clearances||0,kp=r.keyPasses||0;
    const sh=r.shots||0,ash=r.accurateShots||0,c=r.cards||0;
    const penSv=r.penaltiesSaved||0,penMiss=r.penaltyMissed||0;

    if(p.pos==='GK'){
      // v230/v231: sv to prawdziwe obrony (patrz poprawka match-engine.js) — bonus czystego
      // konta skalowany liczbą obron, żeby "darmowe" czyste konto (drużyna zdominowała, GK
      // bierny) nie dawało tego samego bonusu co wypracowane (dużo realnych interwencji).
      // sv liczone liniowo (praca defensywna "na sztuki", bez malejących przychodów).
      const svTier=sv>=5?1.9:sv>=3?0.95:0.25;
      base+=Math.min(2.3,sv*0.7+(oppGoals===0?svTier:0));
      if(oppGoals>0)base-=oppGoals*0.45;
      base+=penSv*1.5; // obroniony karny — mocno dodatnio, poza sufitem zwykłych obron
    }else if(p.pos==='OBR'){
      // v230/v231: obrońca też dostaje bonus za czyste konto, skalowany liczbą wybić —
      // wybicia liniowo (praca "na sztuki"), gole/asysty/kluczowe podania z malejącymi
      // przychodami (rzadkie u obrońcy, ale traktowane spójnie z POL/NAP).
      const clTier=cl>=5?0.85:cl>=3?0.42:0.11;
      base+=_diminish(1.2,g)+_diminish(0.8,a)+cl*0.25+_diminish(0.3,kp)+(oppGoals===0?clTier:0);
      if(won)base+=0.3;
    }else if(p.pos==='POL'){
      // v230/v231: wagi podniesione względem NAP, żeby zrównoważyć rzadsze okazje strzeleckie
      // pomocnika w silniku zdarzeń (patrz diagnoza rozkładu strzałów/goli per pozycja).
      base+=_diminish(2.2,g)+_diminish(1.65,a)+_diminish(0.53,kp)+_diminish(0.33,ash);
    }else if(p.pos==='NAP'){
      base+=_diminish(1.5,g)+_diminish(0.78,a)+_diminish(0.24,ash)+_diminish(0.09,sh);
    }
    base-=c*0.5;                    // żółte kartki (liczone jak dotąd)
    if(r.redCard)base-=2.0;         // v231: czerwona kartka (bezpośrednia lub druga żółta) — dotkliwa, osobno od żółtek
    if(penMiss)base-=penMiss*0.8;   // v231: niewykorzystany karny — dotkliwa kara dla egzekutora
    if(won)base+=0.2;else if(lost)base-=0.2;
    base+=_clutchMap[p.id]||0;      // v231: premia za gole decydujące o wyniku, tym większa im później w meczu
    r.rating=Math.max(3.0,Math.min(10.0,Math.round(base*10)/10));

    // Zapisz ocenę dla wszystkich zawodników (własnych i AI)
    if(!p.seasonRatings)p.seasonRatings=[];
    p.seasonRatings.push(r.rating);
    p.lastMatchRating=r.rating;
    if(p.clubId===G.myClubId&&_wasCupMatch){
      if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
      if(!p.cupSt.ratings)p.cupSt.ratings=[];
      p.cupSt.ratings.push(r.rating);
    }
    if(p.clubId===G.myClubId){
      if(!G.allTimeStats)G.allTimeStats={players:{},bestSeller:null,bestBuyer:null};
      if(!G.allTimeStats.players[p.id])G.allTimeStats.players[p.id]={id:p.id,name:p.name,goals:0,assists:0,matches:0};
    }
  });
}
function postMatch(hc,ac,hG,aG,iW,iL,ratings,hA,aA,_wasCupMatch,_skipCalc){
  if(!_skipCalc)calcFinalRatings(ratings,iW,iL,hG,aG,_wasCupMatch);
  // Safe access to liveStats
  const LS=liveStats||{};
  const hAct=LS.hAct||0, aAct=LS.aAct||0;
  const hShots=LS.hShots||0, aShots=LS.aShots||0;
  const hOn=LS.hOn||0, aOn=LS.aOn||0;
  const hFouls=LS.hFouls||0, aFouls=LS.aFouls||0;
  const rawPoss=hAct/(hAct+aAct+1);
  const hPoss=Math.max(25,Math.min(75,Math.round(rawPoss*100)));
  const aPoss=100-hPoss;
  // Home always left, away always right
  const isMyHome=m_hId===G.myClubId;
  // v220: baner "OCENY KOŃCOWE" nad boiskiem (zakładka BOISKO — na żywo go nie ma)
  const _fbEl=document.getElementById('m-final-banner');if(_fbEl)_fbEl.style.display='block';
  // v222: po meczu widok zostaje na RELACJI (patrz v220), ale akordeon statystyk rozwija się sam
  const _accEnd=document.getElementById('m-stats-acc');if(_accEnd)_accEnd.classList.add('open');
  if(typeof _sizeMlog==='function')_sizeMlog();

  // Goal scorers
  const myGoalScorers={}, oppGoalScorers={};
  (allEvts||[]).filter(e=>e.type==='goal').forEach(e=>{
    const p=G.players.find(x=>x.id===e.sid);if(!p)return;
    const dict=p.clubId===G.myClubId?myGoalScorers:oppGoalScorers;
    dict[e.scorer]=(dict[e.scorer]||0)+1;
  });
  function scorerList(dict,isHome2){
    const entries=Object.entries(dict||{});
    if(!entries.length)return '';
    return entries.map(([n,g])=>{
      const p=G.players.find(x=>x.last===n&&(x.clubId===G.myClubId||(allEvts||[]).some(e=>e.type==='goal'&&e.sid===x.id)));
      const style='color:var(--wh);cursor:pointer;text-decoration:underline';
      const click=p?'onclick="showById('+p.id+')"':'';
      return '<span style="'+style+'" '+click+'>'+n+(g>1?' x'+g:'')+'</span>';
    }).join(', ');
  }

  const pre=document.getElementById('m-prematch');
  if(!pre)return;
  pre.style.display='block';

  // Left=home team, right=away team
  const lCol=isMyHome?'var(--gb)':'var(--am)';
  const rCol=isMyHome?'var(--am)':'var(--gb)';
  const lScorers=isMyHome?myGoalScorers:oppGoalScorers;
  const rScorers=isMyHome?oppGoalScorers:myGoalScorers;

  function row(lbl,lv,rv){
    return '<tr>'+
      '<td style="text-align:center;padding:3px 0;color:'+lCol+'">'+lv+'</td>'+
      '<td style="text-align:center;color:var(--gr)">'+lbl+'</td>'+
      '<td style="text-align:center;color:'+rCol+'">'+rv+'</td>'+
    '</tr>';
  }

  const resultTxt=iW?t('mp_result_win'):iL?t('mp_result_lose'):t('mp_result_draw');
  const resultColor=iW?'var(--gb)':iL?'var(--rd)':'var(--wh)';

  pre.innerHTML='';
  // v199: blok ANALIZA PO MECZU usunięty

  const tbl=document.getElementById('m-stat-table');if(tbl)tbl.innerHTML='';
  // Komentarz podsumowujący
  // v228: _sumTxtForSummaryScreen — ten sam wylosowany tekst trafia też na ekran podsumowania
  // meczu (patrz window._lastMatchSummary niżej) — losujemy go RAZ, tutaj, żeby ekran i relacja
  // zawsze pokazywały identyczny komentarz zamiast dwóch osobnych losowań.
  let _sumTxtForSummaryScreen='';
  const _mlog2=document.getElementById('mlog');
  if(_mlog2){
    const _summaries={
      win:_t10('mp_sum_win'),
      win_away:_t10('mp_sum_win_away'),
      win_home:_t10('mp_sum_win_home'),
      draw:_t10('mp_sum_draw'),
      lose:_t10('mp_sum_lose'),
    };
    const _isMyH2=m_hId===G.myClubId;
    const _myG=_isMyH2?hG:aG, _oppG=_isMyH2?aG:hG;
    let _pool;
    if(_myG>_oppG) _pool=_isMyH2?[..._summaries.win,..._summaries.win_home]:[..._summaries.win,..._summaries.win_away];
    else if(_myG<_oppG) _pool=_summaries.lose;
    else _pool=_summaries.draw;
    const _sumTxt=_pool[Math.floor(Math.random()*_pool.length)];
    _sumTxtForSummaryScreen=_sumTxt;
    // v220: relacja najnowsze na górze — komentarz najpierw (trafia niżej), potem separator
    // "koniec meczu" (trafia na sam wierzch, bo prepend odwraca kolejność wstawiania)
    const _sum=document.createElement('div');
    _sum.className='mlog-e mlog-full summary-ev';
    _sum.innerHTML='<span class="mlog-min2"></span><span class="mlog-icon">💬</span><span class="mlog-txt">'+_sumTxt+'</span>';
    _mlog2.prepend(_sum);
    const _sep=document.createElement('div');
    _sep.className='mlog-e mlog-full summary-ev';
    _sep.innerHTML='<span class="mlog-min2">90\'</span><span class="mlog-icon">⛳</span><span class="mlog-txt"><b>'+pick(_t10('mp_match_end'))+' '+hG+'-'+aG+'</b></span>';
    _mlog2.prepend(_sep);
    _mlog2.scrollTop=0;
  }
  // Boisko z ocenami — obie drużyny
  // v199: użyj ratings[p.id] żeby pokazać WSZYSTKICH którzy grali (zmiennicy, czerwone kartki też)
  const myTeamPls=G.players.filter(p=>p.clubId===G.myClubId&&ratings[p.id]!==undefined);
  const oppId=G.myClubId===m_hId?m_aId:m_hId;
  const oppTeamPls=G.players.filter(p=>p.clubId===oppId&&ratings[p.id]!==undefined);
  // MOM — jeden zawodnik z całego meczu o najwyższej ocenie
  const _allMatch=G.players.filter(p=>(p.clubId===G.myClubId||p.clubId===oppId)&&ratings[p.id]!==undefined);
  const _globalMom=_allMatch.reduce((best,p)=>(!best||ratings[p.id].rating>ratings[best.id].rating)?p:best,null);
  const _momId=_globalMom?_globalMom.id:null;
  // v230: licznik MVP w sezonie — podstawa nagrody 'mvp_matches' przyznawanej na koniec
  // sezonu (week-progress.js/dev-mode.js), reset w startNewSeason() (season-summary.js)
  if(_globalMom)_globalMom.seasonMomCount=(_globalMom.seasonMomCount||0)+1;
  // v228: dane do ekranu podsumowania meczu (ui/match-ui.js::openMatchSummary()) — reużywa
  // dokładnie tych samych zmiennych, które ta funkcja już policzyła wyżej (ratings/_globalMom/
  // _sumTxtForSummaryScreen/hc/ac), plus deltę reputacji/frekwencji zapisaną w match-engine.js
  // tuż przed wywołaniem postMatch(). Zero nowego losowania, zero nowego liczenia MVP/ocen.
  (function(){
    const _myIsH=m_hId===G.myClubId;
    const _myGoals=_myIsH?hG:aG,_oppGoals=_myIsH?aG:hG;
    function _goalsFor(clubId){
      return (allEvts||[]).filter(function(e){return e.type==='goal';}).filter(function(e){
        const p=G.players.find(function(x){return x.id===e.sid;});
        return p&&p.clubId===clubId;
      }).map(function(e){return {min:e.min,name:e.scorer,id:e.sid};}).sort(function(a,b){return a.min-b.min;});
    }
    const _mvpR=_momId?ratings[_momId]:null;
    window._lastMatchSummary={
      isHome:_myIsH,
      myClubName:G.myClub?G.myClub.n:'',
      oppClubName:(_myIsH?ac:hc).n,
      myGoals:_myGoals,oppGoals:_oppGoals,iW:iW,iL:iL,
      comment:_sumTxtForSummaryScreen,
      myScorers:_goalsFor(G.myClubId),
      oppScorers:_goalsFor(oppId),
      mvp:_globalMom?{
        id:_globalMom.id,name:_globalMom.name,pos:_globalMom.pos,age:_globalMom.age,
        clubId:_globalMom.clubId,clubName:(_globalMom.clubId===G.myClubId?G.myClub.n:(_myIsH?ac:hc).n),
        jerseyNum:_globalMom.jerseyNum||0,
        rating:_mvpR?_mvpR.rating:6,goals:_mvpR?(_mvpR.goals||0):0,assists:_mvpR?(_mvpR.assists||0):0
      }:null,
      repDelta:window._matchRepDelta||0,freqDelta:window._matchFreqDelta||0
    };
  })();
  // Bohater Meczu — wychowanek (po deklaracji _globalMom)
  if(_globalMom&&_globalMom.fromAcademy&&_globalMom.clubId===G.myClubId){
    var _bD2=_globalMom.history?_globalMom.history.find(function(h){return h.fromAcademy;}):null;
    var _archBH=_globalMom.archetype&&ARCHETYPE_META[_globalMom.archetype]?ARCHETYPE_META[_globalMom.archetype]:null;
    var _bohatHtml='<div style="background:#0a1f0a;border:2px solid #9c27b0;padding:8px 14px;font-size:var(--fs-dense)">'+
      '<div style="color:#ce93d8;margin-bottom:2px">'+t('mp_hero_academy')+'</div>'+
      '<div style="color:var(--gb);font-size:11px">🎓 '+_globalMom.name+'</div>'+
      (_bD2?'<div style="color:var(--gr);margin-top:2px">'+t('mp_academy_since').replace('{season}',_bD2.season).replace('{ovr}',_bD2.ovr).replace('{ovr2}',ovr(_globalMom))+'</div>':'')+
      (_archBH?'<div style="color:'+_archBH.color+';margin-top:2px">'+_archBH.icon+' '+_archBH.name+'</div>':'')+
    '</div>';
    pre.innerHTML=_bohatHtml+pre.innerHTML;
  }
  // Ustal kto gra u siebie (zgodnie ze scorebarem)
  const _isMyHome=m_hId===G.myClubId;
  // Lewa zakładka = gospodarz, prawa = gość (jak scorebar)
  if(_isMyHome){
    renderRatingsPitch(myTeamPls,ratings,'m-rat-home',_momId,allEvts);
    renderRatingsPitch(oppTeamPls,ratings,'m-rat-away',_momId,allEvts);
  } else {
    renderRatingsPitch(oppTeamPls,ratings,'m-rat-home',_momId,allEvts);
    renderRatingsPitch(myTeamPls,ratings,'m-rat-away',_momId,allEvts);
  }
  // Etykiety zakładek = MOJA DRUŻYNA / RYWAL (AI), niezależnie od tego kto gra u siebie
  _setBoiskoSideLabels(_isMyHome);
  const _btn1=document.getElementById('m-rat-btn-home');
  const _btn2=document.getElementById('m-rat-btn-away');
  // Aktywna zakładka = moja drużyna
  const _myBtn=_isMyHome?_btn1:_btn2;
  const _oppBtn=_isMyHome?_btn2:_btn1;
  if(_myBtn){_myBtn.classList.add('on');}
  if(_oppBtn){_oppBtn.classList.remove('on');}
  const _myPane=_isMyHome?'m-rat-home':'m-rat-away';
  const _oppPane=_isMyHome?'m-rat-away':'m-rat-home';
  document.getElementById(_myPane).classList.add('on');
  document.getElementById(_oppPane).classList.remove('on');
}


function aiSelectSquad(clubId){
  // Auto-select best 11 for AI team based on formation
  const tac=(G.clubTactics&&G.clubTactics[clubId])||{formation:'4-4-2'};
  const fp=tac.formation.split('-').map(Number);
  const lim={GK:1,OBR:fp[0]||4,POL:fp[1]||4,NAP:fp[2]||2};
  const pl=G.players.filter(p=>p.clubId===clubId&&!p.injured&&(!p.suspension||p.suspension<=0));
  pl.forEach(p=>p.starter=false);
  function best(pos,n){return pl.filter(p=>p.pos===pos).sort((a,b)=>ovr(b)-ovr(a)).slice(0,n);}
  [...best('GK',1),...best('OBR',lim.OBR),...best('POL',lim.POL),...best('NAP',lim.NAP)].forEach(p=>p.starter=true);
}

function simOthers(){
  // Symuluj mecze wszystkich lig (nie tylko ligi gracza)
  const allScheds=G.allSchedules||{[G.myLeague]:G.schedule};
  Object.entries(allScheds).forEach(([lvl,sched])=>{
    const lvlNum=parseInt(lvl);
    sched.filter(m=>m.rnd===G.round&&!m.done).forEach(m=>{
      if(m.h===G.myClubId||m.a===G.myClubId)return; // mecz gracza pomijamy
      // Upewnij się że AI ma wybrany skład
      if(m.h!==G.myClubId)aiSelectSquad(m.h);
      if(m.a!==G.myClubId)aiSelectSquad(m.a);
      // v216: rdzeń "lite" — ta sama baza siły (playerStr/cechy/forma) + taktyka + home advantage co mecz gracza
      const _liteRes=_buildMatchLite(m);
      const hG2=_liteRes.hG,aG2=_liteRes.aG;
      m.done=true;m.hg=hG2;m.ag=aG2;
      // v: Kontuzje w trakcie meczu (etap 3 symetrii cech) — ten sam wzór co next() w match-engine.js
      // i devSimMyMatch() (etap 2), teraz też dla meczów AI-AI symulowanych zbiorczo w simOthers().
      // Bezpiecznik: pomijamy losowanie dla klubu, który ma mniej niż 16 zdrowych (niekontuzjowanych)
      // zawodników — żeby nie powtórzyć znanego już problemu klubów AI zostających bez obsady na
      // pozycji (patrz ensureClubGoalkeepers() w core/state.js).
      [m.h,m.a].forEach(cid=>{
        const healthyCount=G.players.filter(p=>p.clubId===cid&&!p.injured).length;
        if(healthyCount<16)return;
        G.players.filter(p=>p.clubId===cid&&p.starter&&!p.injured).forEach(p=>{
          const injMult=(p.traits&&p.traits.includes('wytrzymaly'))?0.7:1.0;
          const chance=0.01*(1+(100-p.phy)/100)*injMult;
          if(Math.random()<chance)applyInjury(p,true);
        });
      });
      // Update standing for this league (liga gracza = G.standing)
      const _lvl=parseInt(lvlNum);const _myLvl=parseInt(G.myLeague||8);const st=_lvl===_myLvl?G.standing:(G.allStandings&&G.allStandings[_lvl]?G.allStandings[_lvl]:null);
      if(!st)return; // pomiń jeśli brak standings
      const h2=st.find(s=>parseInt(s.cid)===parseInt(m.h)),a2=st.find(s=>parseInt(s.cid)===parseInt(m.a));
      if(h2&&a2){h2.p++;a2.p++;h2.gf+=hG2;h2.ga+=aG2;a2.gf+=aG2;a2.ga+=hG2;if(hG2>aG2){h2.w++;a2.l++;h2.pts+=3;}else if(hG2<aG2){a2.w++;h2.l++;a2.pts+=3;}else{h2.d++;a2.d++;h2.pts++;a2.pts++;}}
      // ── ŻYWY ŚWIAT AI: forma i seria wyników klubu po meczu AI↔AI ────────
      [{cid:m.h,my:hG2,opp:aG2},{cid:m.a,my:aG2,opp:hG2}].forEach(({cid,my,opp})=>{
        const _fClub=ALL_CLUBS.find(c=>c.id===cid);
        if(!_fClub||!_fClub.ai)return;
        const cai=_fClub.ai;
        const won=my>opp,lost=my<opp;
        cai.form=Math.max(0,Math.min(100,(typeof cai.form==='number'?cai.form:50)+(won?3:lost?-3:0)));
        if(!cai._streak)cai._streak=0;
        if(won)cai._streak=cai._streak>0?cai._streak+1:1;
        else if(lost)cai._streak=cai._streak<0?cai._streak-1:-1;
        else cai._streak=0;
        const rec=_checkStreakRecord(_fClub,cai._streak);
        if(rec.isNewRecord||rec.isAmbient){
          addWorldNewsEvent(cai._streak>0?'streak_win':'streak_loss',{
            clubId:_fClub.id, leagueLevel:_lvl, isRecord:rec.isNewRecord,
            vars:{club:_fClub.n, n:Math.abs(cai._streak)}
          });
        }
      });
      // ── ŻYWY ŚWIAT AI: derby (para rywali z assignDerbyPairs(), sekcja 11) ──
      (function(){
        const hClub=ALL_CLUBS.find(c=>c.id===m.h),aClub=ALL_CLUBS.find(c=>c.id===m.a);
        if(!hClub||!aClub||hG2===aG2)return;
        const winClub=hG2>aG2?hClub:aClub, loseClub=hG2>aG2?aClub:hClub;
        const winG=Math.max(hG2,aG2), loseG=Math.min(hG2,aG2);
        checkDerbyResult(winClub,loseClub,winG,loseG,_lvl);
      })();
      // Goal stats for AI players
      const matchEvts2=[];
      [m.h,m.a].forEach(cid=>{
        const scorers=G.players.filter(p=>p.clubId===cid&&p.starter&&p.pos!=='GK');
        const goals=cid===m.h?hG2:aG2;
        for(let g=0;g<goals;g++){
          if(!scorers.length)break;
          const sc=scorers[Math.floor(Math.random()*scorers.length)];
          const ass=scorers.filter(p=>p.id!==sc.id);
          const assP=ass.length&&Math.random()<0.8?ass[Math.floor(Math.random()*ass.length)]:null;
          matchEvts2.push({scorerId:sc.id,assistId:assP?assP.id:null,min:r(3,88),isHome:cid===m.h});
        }
      });
      // Kartki + oceny per zawodnik — lekki odpowiednik bldCards()/calcFinalRatings() z match-engine.js,
      // tylko do podglądu meczu w karcie klubu (WYNIKI), patrz G._mHistAI niżej
      const matchCards2=[];
      const matchRatings2={};
      // Aktualizuj mecze i oceny sezonowe dla zawodników AI
      [m.h,m.a].forEach(cid=>{
        const isHTeam=cid===m.h;
        const myGoals=isHTeam?hG2:aG2;
        const oppGoals=isHTeam?aG2:hG2;
        const won=myGoals>oppGoals,lost=myGoals<oppGoals;
        const teamPls=G.players.filter(p=>p.clubId===cid&&p.starter);
        const avgStr3=teamPls.reduce((s,p)=>s+playerStr(p),0)/Math.max(1,teamPls.length);
        teamPls.forEach(p=>{
          p.st.m++;
          const strRatio3=playerStr(p)/Math.max(1,avgStr3);
          let aiRat=Math.min(8.5,Math.max(4.0,strRatio3*6.5));
          if(won)aiRat+=0.2;else if(lost)aiRat-=0.2;
          aiRat+=((Math.random()-0.5)*1.0);
          aiRat=Math.max(3.0,Math.min(10.0,Math.round(aiRat*10)/10));
          if(!p.seasonRatings)p.seasonRatings=[];
          p.seasonRatings.push(aiRat);
          p.lastMatchRating=aiRat;
          matchRatings2[p.id]=aiRat;
          // Kartki — te same bazowe prawdopodobieństwa co bldCards() w match-engine.js (0.05/0.007),
          // bez modyfikatorów taktyki (uproszczenie B-lekki)
          if(Math.random()<0.05)matchCards2.push({m:r(5,85),id:p.id,t:'y'});
          if(Math.random()<0.007)matchCards2.push({m:r(10,85),id:p.id,t:'r'});
        });
        // v218: Lider/Zimna krew/Nerwowy — te same bonusy formy co w simMatch() (patrz punkt 5b),
        // teraz też dla klubów AI. Pewny siebie (etap 1 symetrii cech): zamiast osobnego licznika
        // winStreak (którego kluby AI nie mają), wykorzystujemy już istniejący cai._streak
        // (dodatni = seria zwycięstw, patrz sekcja "Żywy Świat AI" wyżej w tej pętli rund).
        if(won){
          if(teamPls.some(p=>p.starter&&p.traits&&p.traits.includes('lider')))
            teamPls.forEach(p=>{p.form=Math.min(99,p.form+2);});
          const _aiClubForStreak=ALL_CLUBS.find(c=>c.id===cid);
          if(_aiClubForStreak&&_aiClubForStreak.ai&&_aiClubForStreak.ai._streak>=3)
            teamPls.filter(p=>p.starter&&p.traits&&p.traits.includes('pewny_siebie')).forEach(p=>{p.form=Math.min(99,p.form+2);});
        } else if(lost){
          teamPls.filter(p=>p.starter&&p.traits&&p.traits.includes('zimna_krew')).forEach(p=>{p.form=Math.min(99,p.form+2);});
          teamPls.filter(p=>p.starter&&p.traits&&p.traits.includes('nerwowy')).forEach(p=>{p.form=Math.max(5,p.form-2);});
          // Kapitan AI: kluby AI nie mają wybieranej opaski jak gracz (G.captainId) — kapitanem
          // meczu jest po prostu starter z najwyższym MEN, liczony na bieżąco (bez trwałego pola).
          const _aiCaptain=teamPls.length?teamPls.slice().sort((a,b)=>b.men-a.men)[0]:null;
          if(_aiCaptain)_aiCaptain.form=Math.min(99,_aiCaptain.form+2);
        }
      });
      matchEvts2.forEach(e=>{const sc=G.players.find(x=>x.id===e.scorerId);if(sc){if(!sc.st.g)sc.st.g=0;sc.st.g++;}const as=e.assistId?G.players.find(x=>x.id===e.assistId):null;if(as){if(!as.st.a)as.st.a=0;as.st.a++;}});
      // Zapis meczu do podglądu w karcie klubu (zakładka WYNIKI) — runtime-only, bieżący sezon,
      // celowo POMIJANY w saveGame() (patrz SKIP w news-bootstrap.js) żeby nie obciążać zapisu
      if(!G._mHistAI)G._mHistAI=[];
      G._mHistAI.push({
        rnd:m.rnd,season:G.season,
        hn:(ALL_CLUBS.find(c=>c.id===m.h)||{n:'?'}).n,an:(ALL_CLUBS.find(c=>c.id===m.a)||{n:'?'}).n,
        hg:hG2,ag:aG2,
        g:matchEvts2.map(e=>({m:e.min,s:e.scorerId,a:e.assistId,h:e.isHome?1:0})),
        c:matchCards2,
        r:matchRatings2
      });
    });
  });
}
function updStand(hid,aid,hg,ag){const st=G.standing;const h=st.find(s=>parseInt(s.cid)===parseInt(hid)),a=st.find(s=>parseInt(s.cid)===parseInt(aid));if(!h||!a)return;h.p++;a.p++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;if(hg>ag){h.w++;a.l++;h.pts+=3;}else if(hg<ag){a.w++;h.l++;a.pts+=3;}else{h.d++;a.d++;h.pts++;a.pts++;}}
function aiRenewContracts(){
  if(!G.retiredPlayers)G.retiredPlayers=[];

  // ── 1. STARZENIE — age++ dla wszystkich zawodników AI ────────────────
  G.players.filter(p=>p.clubId!==G.myClubId).forEach(p=>{p.age++;});

  // ── 2. EMERYTURA — zawodnicy AI w odpowiednim wieku ─────────────────
  const retireChance={32:0.05,33:0.10,34:0.20,35:0.35,36:0.55,37:0.70,38:0.90};
  const retiring=G.players.filter(p=>{
    if(p.clubId===G.myClubId)return false;
    if(p.age<32)return false; // nigdy przed 32 rokiem życia
    const baseChance=retireChance[p.age]||(p.age>38?0.95:0);
    return baseChance>0&&Math.random()<baseChance;
  });
  retiring.forEach(p=>{
    const _hClub=ALL_CLUBS.find(c=>c.id===p.clubId);
    if(!p.formerClubs)p.formerClubs=[];
    const fc=p.formerClubs.find(x=>x.clubId===p.clubId);
    if(fc)fc.seasons=(fc.seasons||0)+1;
    else if(p.clubId>0)p.formerClubs.push({clubId:p.clubId,clubName:_hClub?_hClub.n:'?',seasons:1});
    // Ślad w logu klubu i w historii zawodnika — club-modal.js renderuje "→ 🏁" po fladze
    // retired:true. Nie polegamy już na wyszukiwaniu żywego obiektu gracza po playerId —
    // G.retiredPlayers jest przy zapisie gry przycinane do zawodników, którzy grali w klubie
    // gracza (news-bootstrap.js), więc AI-owy emeryt po wczytaniu zapisu potrafił "zniknąć"
    // z danych i log mylnie pokazywał "→ FA" zamiast 🏁.
    if(_hClub&&_hClub.ai){
      if(!_hClub.ai.transferLog)_hClub.ai.transferLog=[];
      _hClub.ai.transferLog.unshift({type:'sell',name:p.name,pos:p.pos,ovr:ovr(p),age:p.age,price:0,season:G.season,playerId:p.id,toClub:null,retired:true});
      if(_hClub.ai.transferLog.length>20)_hClub.ai.transferLog.pop();
    }
    const _lhRet=p.history&&p.history.length?p.history[p.history.length-1]:null;
    if(_lhRet&&_lhRet.clubId===p.clubId)_lhRet.transferOut={type:'sell',toClub:null,price:0,season:G.season};
    p.status='retired';p.retiredSeason=G.season;p.clubId=0;p.starter=false;
    G.retiredPlayers.push(p);
  });
  G.players=G.players.filter(p=>!retiring.includes(p));

  // ── 3. KONTRAKTY AI: contract-- ──────────────────────────────────────
  G.players.filter(p=>p.clubId!==G.myClubId).forEach(p=>{
    if(p.contract>0)p.contract--;
  });

  // ── 3.5 PRÓBA ODNOWIENIA — chronieni gracze (rdzeń/wychowankowie) dostają szansę na
  // przedłużenie kontraktu PRZED trafieniem do kroku 4, żeby klub nie tracił gwiazd do FA
  // bez żadnej decyzji z jego strony. Zwykli gracze — dużo mniejsza szansa (0.4× typu).
  G.leagues.forEach(lg=>{
    lg.clubs.forEach(club=>{
      if(club.id===G.myClubId||!club.ai)return;
      const def=AI_TYPES[club.ai.type]||AI_TYPES.stabilny;
      const squad=G.players.filter(p=>p.clubId===club.id);
      const expiring=squad.filter(p=>p.contract<=0&&!(p.traits&&p.traits.includes('lojalny')));
      if(!expiring.length)return;
      const core=aiCoreProtect(club,squad);
      expiring.forEach(p=>{
        const chance=core.has(p.id)?def.renewChance:def.renewChance*0.4;
        if(Math.random()<chance)p.contract=r(2,4);
      });
    });
  });

  // ── 4. WYGASŁE KONTRAKTY: bez odnowienia → bezpośrednie przeniesienie do klubu z wolnym
  // miejscem na tej pozycji (zamknięty świat: nikt nie zawisa bez klubu, patrz js/CLAUDE.md).
  // Brak takiego klubu LUB brak zapasu w limicie sezonowym (dawcy/biorcy) LUB brak funduszy
  // na symboliczną opłatę u żadnego kandydata LUB odejście złamałoby SQUAD_SIZE.min/POS_QUOTA.min
  // klubu źródłowego LUB żaden kandydat nie ma OVR pasującego do swojej ligi → kontrakt zostaje
  // automatycznie przedłużony, zawodnik zostaje — inaczej ta ścieżka omijała aiSigningCap/
  // aiSellingCap całkowicie i generowała nielimitowany ruch (patrz zgłoszenie o nadmiarze
  // transferów mimo limitów w aiTransferSeason()), albo podpisywała zawodnika mimo braku
  // pokrycia w budżecie, albo drenowała słabsze kluby (zgłoszenie o klubach VII ligi spadających
  // do ~14 zawodników po kilku sezonach), albo importowała zawodników poniżej poziomu ligi
  // docelowej (zgłoszenie o spadającym OVR świata — symulacja: ta ścieżka to >50% wolumenu
  // wszystkich transferów AI i była głównym źródłem spadku).
  const expired=G.players.filter(p=>p.clubId!==G.myClubId&&p.contract<=0&&!(p.traits&&p.traits.includes('lojalny')));
  const _clubLevel4={};G.leagues.forEach(l=>l.clubs.forEach(c=>{_clubLevel4[c.id]=l.level;}));
  // Liczniki rozmiaru/pozycji per klub, aktualizowane na bieżąco przy przenosinach — bez
  // ponownego skanowania całego G.players za każdym wygasłym kontraktem osobno (zbyt wolne
  // dla całego świata AI, kilkaset wygasłych kontraktów na sezon).
  const _sizeByClub={},_posByClub={};
  G.players.forEach(p=>{
    if(p.clubId<=0)return;
    _sizeByClub[p.clubId]=(_sizeByClub[p.clubId]||0)+1;
    if(!_posByClub[p.clubId])_posByClub[p.clubId]={};
    _posByClub[p.clubId][p.pos]=(_posByClub[p.clubId][p.pos]||0)+1;
  });
  expired.forEach(p=>{
    const oldClubId=p.clubId;
    const fromClub=ALL_CLUBS.find(c=>c.id===oldClubId);
    const fromLvl=_clubLevel4[oldClubId]||8;
    const fromCapOk=!fromClub||!fromClub.ai||(fromClub.ai.sellsThisSeason||0)<aiSellingCap(fromClub,fromLvl);
    // Klub źródłowy nie może zejść poniżej SQUAD_SIZE.min ani poniżej POS_QUOTA.min na tej
    // pozycji — w odróżnieniu od dobrowolnej sprzedaży (aiEvaluateSale, chroni to samo) ta
    // ścieżka nie miała żadnej ochrony, mimo że to najbardziej masowy odpływ zawodników AI
    // (patrz zgłoszenie o klubach VII ligi spadających do ~14 zawodników po kilku sezonach).
    const fromSizeAfter=(_sizeByClub[oldClubId]||0)-1;
    const fromPosQ=POS_QUOTA[p.pos];
    const fromPosAfter=((_posByClub[oldClubId]||{})[p.pos]||0)-1;
    const fromFloorOk=fromSizeAfter>=SQUAD_SIZE.min&&(!fromPosQ||fromPosAfter>=fromPosQ.min);
    // Symboliczna opłata (10-20% wartości, podłoga 500) zamiast sztywnego 0 — realny wolny
    // transfer bez odstępnego wciąż istnieje w futbolu jako pojęcie, ale tu ma być zawsze
    // walutowy: nowy klub płaci niewielką premię za podpisanie, nie robi transferu za darmo.
    const price=Math.max(500,Math.round(calcValue(ovr(p),p.age)*r(10,20)/100/1000)*1000);
    // Dopasowanie OVR do ligi docelowej — ta sama tolerancja (dolna granica ligi -5) co band[]
    // w aiSignReplacement(). Bez tego kandydat był dobierany wyłącznie po zasięgu poziomu ligi
    // (±2), wielkości składu i budżecie: zawodnik poniżej core (stąd w ogóle wygasły kontrakt,
    // zwykle słabszy niż średnia własnej ligi) mógł wylądować nawet 2 ligi wyżej, systemowo
    // ciągnąc w dół OVR ligi docelowej. To pojedynczy najbardziej masowy kanał transferów AI
    // (>50% wolumenu światowego w symulacji) — patrz zgłoszenie o spadającym OVR świata.
    const _ovrOk=c=>{
      const destOvr4=LEAGUE_OVR[_clubLevel4[c.id]||8]||[20,35,35,55];
      return ovr(p)>=destOvr4[0]-5;
    };
    const candidates=(fromCapOk&&fromFloorOk)?ALL_CLUBS.filter(c=>c.id!==oldClubId&&c.id!==G.myClubId&&c.ai
      &&Math.abs((_clubLevel4[c.id]||8)-fromLvl)<=2
      &&(_sizeByClub[c.id]||0)<SQUAD_SIZE.max
      &&(!POS_QUOTA[p.pos]||((_posByClub[c.id]||{})[p.pos]||0)<POS_QUOTA[p.pos].max)
      &&(c.ai.signingsThisSeason||0)<aiSigningCap(c,_clubLevel4[c.id]||8)
      &&(c.ai.budget||0)>=price*0.5
      &&_ovrOk(c)):[];
    if(candidates.length){
      candidates.sort((a,b)=>(b.ai.budget||0)-(a.ai.budget||0));
      const dest=candidates[0];
      // ── ŻYWY ŚWIAT AI: kontrakt — zawodnik na szczycie pasma OVR swojej ligi zmienia klub ──
      if(fromClub&&fromClub.ai&&ovr(p)>=(LEAGUE_OVR[fromLvl]||[20,35,35,55])[3]){
        addWorldNewsEvent('contract',{clubId:fromClub.id,leagueLevel:fromLvl,playerId:p.id,
          vars:{name:p.name,club:fromClub.n}});
      }
      aiTransferPlayer(p,fromClub,dest,price,G.season,false);
      _sizeByClub[oldClubId]=(_sizeByClub[oldClubId]||1)-1;
      _posByClub[oldClubId][p.pos]=(_posByClub[oldClubId][p.pos]||1)-1;
      _sizeByClub[dest.id]=(_sizeByClub[dest.id]||0)+1;
      if(!_posByClub[dest.id])_posByClub[dest.id]={};
      _posByClub[dest.id][p.pos]=(_posByClub[dest.id][p.pos]||0)+1;
    } else {
      p.contract=r(1,3); // nikt nie ma miejsca — kontrakt zostaje automatycznie przedłużony
    }
  });

  // ── 5. UZUPEŁNIANIE SKŁADU: usunięte — czysta duplikacja z aiSeasonalRefresh() (kronika.js),
  // która wypełnia do minimum 22 TUŻ PRZED wywołaniem tej funkcji (patrz season-summary.js:
  // aiSeasonalRefresh() → aiRenewContracts()). Ewentualny niedobór z kroków 1-4 powyżej i tak
  // domyka aiTransferSeason() chwilę później w tej samej zmianie sezonu. Osobny, w pełni
  // powielony przebieg co sezon dla każdego klubu był jedną z przyczyn nadmiarowej liczby
  // transferów AI (patrz zgłoszenie — "kilkanaście transferów na drużynę na sezon" zamiast
  // kilku wg AI_TYPES.maxAnnualSignings).

  // ── 6. LIMIT EMERYTÓW: zachowaj max 200 najnowszych + legendy/rekordzistów klubu — ich
  // karta musi być dostępna przez link na stałe, nawet jeśli emeryturę mają za sobą dawno
  // (patrz protectedRetireeIds() w core/data.js, G.allTimeStats.players nigdy nie jest
  // przycinane, więc bez tego wyjątku link do rekordzisty stawał się martwy) ────────────
  if(G.retiredPlayers.length>200){
    const _protectedIds=protectedRetireeIds();
    const _recentIds=new Set(G.retiredPlayers.slice(-200).map(p=>p.id));
    G.retiredPlayers=G.retiredPlayers.filter(p=>_recentIds.has(p.id)||_protectedIds.has(p.id));
  }
}

// ══════════════════════════════════════════════════════════════
// AI KLUBÓW — WARIANT B „DYNAMICZNA FILOZOFIA"
// ══════════════════════════════════════════════════════════════

// minUpgradeDelta: próg OVR ponad najsłabszego na pozycji, żeby transfer się liczył jako
// poprawa (może być ujemny — "bogaty" akceptuje lekki spadek OVR pod potencjał/reputację).
// maxAnnualSignings: twardy limit podpisań na sezon (rynek+FA), skalowany LEAGUE_AI_TUNING.
// maxAnnualSells: twardy limit SPRZEDAŻY na sezon (symetryczny do maxAnnualSignings — bez
// niego klub mógł kupować zdyscyplinowanie, a i tak generować dużo ruchu jako częsty "dawca"
// w cudzych realokacjach, patrz zgłoszenie o nadmiarze transferów).
// coreProtectSize: ilu najlepszych wg OVR jest chronionych przed przypadkową sprzedażą.
// renewChance: szansa na proaktywne przedłużenie kontraktu chronionemu graczowi przed wygaśnięciem.
const AI_TYPES={
  akademia:{
    icon:'🎓',label:t('mp_ai_akademia_label'),
    desc:t('mp_ai_akademia_desc'),
    buyRate:0.3,sellRate:0.4,juniors:[3,5],maxBuyAge:23,budgetMult:0.7,devMult:1.3,
    minUpgradeDelta:1,maxAnnualSignings:3,maxAnnualSells:2,coreProtectSize:4,renewChance:0.75
  },
  sprzedajacy:{
    icon:'💸',label:t('mp_ai_sprzedajacy_label'),
    desc:t('mp_ai_sprzedajacy_desc'),
    buyRate:0.7,sellRate:0.8,juniors:[1,2],maxBuyAge:27,budgetMult:1.0,devMult:1.15,
    minUpgradeDelta:0,maxAnnualSignings:5,maxAnnualSells:5,coreProtectSize:2,renewChance:0.50
  },
  bogaty:{
    icon:'💰',label:t('mp_ai_bogaty_label'),
    desc:t('mp_ai_bogaty_desc'),
    buyRate:0.9,sellRate:0.2,juniors:[0,0],maxBuyAge:32,budgetMult:2.0,devMult:0.85,
    minUpgradeDelta:-1,maxAnnualSignings:6,maxAnnualSells:1,coreProtectSize:5,renewChance:0.85
  },
  stabilny:{
    icon:'🛡️',label:t('mp_ai_stabilny_label'),
    desc:t('mp_ai_stabilny_desc'),
    // Doprecyzowane 14.07.2026 (audyt stabilności OVR) — najbliższy typ "stawia na
    // doświadczenie": wyższy maxBuyAge, rzadszy nabór juniorów, kupuje tylko realnie lepszych,
    // chętniej przedłuża sprawdzone kontrakty. Tożsamość/nazwa/ikona bez zmian na Twoją prośbę
    // (doprecyzowanie istniejącego typu zamiast nowego wpisu w AI_TYPES).
    buyRate:0.3,sellRate:0.25,juniors:[0,1],maxBuyAge:33,budgetMult:1.1,devMult:1.0,
    minUpgradeDelta:2,maxAnnualSignings:3,maxAnnualSells:2,coreProtectSize:4,renewChance:0.80
  }
};
const AI_TYPES_LIST=['akademia','sprzedajacy','bogaty','stabilny'];

function initClubAI(club, leagueLevel){
  // Losuj typ z lekką preferencją (bogaty rzadszy w niższych ligach)
  let pool=['akademia','akademia','sprzedajacy','sprzedajacy','stabilny','stabilny','bogaty'];
  if(leagueLevel>=5) pool=pool.filter(t=>t!=='bogaty');
  const type=pool[Math.floor(Math.random()*pool.length)];
  const def=AI_TYPES[type];
  // Skala jak u gracza (LEAGUE_BUDGET), skorygowana filozofią klubu i losowym rozrzutem ±30%
  const baseBudget=Math.round((LEAGUE_BUDGET[leagueLevel]||12000)*def.budgetMult*(0.8+Math.random()*0.5)/1000)*1000;
  return {
    type,
    budget:baseBudget,
    // Ta sama skala 0-1000 co reputacja gracza (G.reputation) — liga wyżej = więcej prestiżu na
    // start, ale z zapasem miejsca na wzrost (awanse, Puchar, cele zarządu), tak jak u gracza.
    reputation:Math.round(10+(8-leagueLevel)*30+Math.random()*60),
    promoted:false,
    relegated:false,
    transferLog:[],
    juniorLog:[],
    form:50,
    _streak:0,
    boardGoal:null,
    _newsCooldown:{},
    _newsCountThisWeek:{week:0,entries:[]},
    _streakRecord:{win:0,loss:0}
  };
}

function ensureClubsHaveAI(){
  if(!G||!G.leagues)return;
  G.leagues.forEach(lg=>{
    lg.clubs.forEach(club=>{
      if(!club.ai) club.ai=initClubAI(club,lg.level);
    });
  });
}

// ── Helper: przenieś zawodnika między klubami AI (aktualizuje formerClubs i historię) ──
// ── POBIERANIE Z PULI ZAMIAST mkPlayer ───────────────────────────────────────
function fillHistoryGaps(p){
  if(!p||!G||!G.season)return;
  if(!p.history)p.history=[];
  // Zawodnik wchodzi do świata dopiero w sezonie swojego pierwszego prawdziwego wpisu (junior
  // albo pula startowa initGame()) — nie wolno domyślać luk PRZED tym sezonem, inaczej dostaje
  // fikcyjną przeszłość jako "wolny agent" zanim w ogóle powstał. Patrz zasada zamkniętego świata w CLAUDE.md.
  const realSeasons=p.history.filter(h=>!h._placeholder).map(h=>h.season);
  if(!realSeasons.length)return; // brak jeszcze żadnego prawdziwego wpisu — nie ma punktu odniesienia
  const entrySeason=Math.min.apply(null,realSeasons);
  for(let s=entrySeason;s<G.season;s++){
    if(!p.history.find(h=>h.season===s)){
      p.history.push({season:s,clubId:0,club:t('plr_free_agent'),m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_placeholder:true});
    }
  }
  p.history.sort((a,b)=>a.season-b.season);
}

// takeFromPool usunięty — zamknięty świat, brak G.playerPool

// Rekord transferowy świata AI — cała historia kariery (max 100, sort po cenie)
function _recordWorldTransfer(entry){
  if(!G.worldTopTransfers)G.worldTopTransfers=[];
  G.worldTopTransfers.push(entry);
  G.worldTopTransfers.sort((a,b)=>b.price-a.price);
  if(G.worldTopTransfers.length>100)G.worldTopTransfers.length=100;
}

// ── DECYZJE TRANSFEROWE AI — bramka jakości i zasadności (zamiast czystej losowości) ──────
// Rdzeń składu: najlepsi wg OVR (coreProtectSize) + wychowankowie w pierwszych 3 sezonach —
// chronieni przed przypadkową sprzedażą, patrz aiEvaluateSale.
function aiCoreProtect(club,squad){
  const def=AI_TYPES[club.ai&&club.ai.type]||AI_TYPES.stabilny;
  const byOvr=[...squad].sort((a,b)=>ovr(b)-ovr(a)).slice(0,def.coreProtectSize).map(p=>p.id);
  const youngAcademy=squad.filter(p=>p.fromAcademy&&(p._seasonsAtClub||0)<3).map(p=>p.id);
  return new Set([...byOvr,...youngAcademy]);
}
// Czy sprzedać zawodnika: konkretny powód, nie rzut kostką. core = Set id chronionych (aiCoreProtect).
function aiEvaluateSale(p,club,squad,core,lgMax,prefMax,avgOvr){
  const posQ=POS_QUOTA[p.pos];
  if(posQ&&squad.filter(x=>x.pos===p.pos).length<=posQ.min)return false; // nigdy poniżej minimum na pozycji
  if(core.has(p.id))return ovr(p)>lgMax*1.25; // rdzeń — tylko wyjątkowa oferta
  if(p.contract<=0)return true; // wygasły kontrakt — decyzja poza kontrolą klubu (patrz aiTryRenewContracts)
  const o=ovr(p);
  if(o>lgMax*1.15){
    const hasReplacement=squad.some(x=>x.id!==p.id&&x.pos===p.pos&&ovr(x)>=lgMax*0.7);
    if(hasReplacement)return true; // sprzedaż "za dobrego na ligę" tylko z planem zastępstwa
  }
  if(squad.length>prefMax){
    const atPos=squad.filter(x=>x.pos===p.pos);
    const weakest=atPos.reduce((m,x)=>ovr(x)<ovr(m)?x:m,atPos[0]);
    if(weakest&&weakest.id===p.id)return true; // przycinanie nadwyżki: zawsze najsłabszy na pozycji
  }
  if(club.ai.type==='sprzedajacy'&&(p._seasonsAtClub||0)>=2&&o>avgOvr+5)return true; // model: rozwiń i sprzedaj
  return false;
}
// Czy kupić kandydata: musi być lepszy/porównywalny do najsłabszego na pozycji w składzie,
// z wyjątkiem młodych wysokopotencjałowych (kupno pod przyszłość, nie pod dziś).
function aiEvaluateSigning(cand,pos,squad,club,lgLevel,lgMin){
  const posQ=POS_QUOTA[pos];
  if(posQ&&squad.filter(x=>x.pos===pos).length>=posQ.max)return false; // pozycja już pełna
  const def=AI_TYPES[club.ai&&club.ai.type]||AI_TYPES.stabilny;
  const tuning=LEAGUE_AI_TUNING[lgLevel]||LEAGUE_AI_TUNING[4];
  const atPos=squad.filter(x=>x.pos===pos);
  const weakestOvr=atPos.length?Math.min(...atPos.map(x=>ovr(x))):lgMin;
  const required=weakestOvr+Math.max(-2,def.minUpgradeDelta+(tuning.strictnessMult-1)*3);
  if(ovr(cand)>=required)return true;
  if(cand.age<=21&&cand.potential>=required+5&&(club.ai.type==='akademia'||club.ai.type==='sprzedajacy'))return true;
  return false;
}
// Limit podpisań na sezon (rynek+FA), skalowany typem klubu i ligą.
function aiSigningCap(club,lgLevel){
  const def=AI_TYPES[club.ai&&club.ai.type]||AI_TYPES.stabilny;
  const tuning=LEAGUE_AI_TUNING[lgLevel]||LEAGUE_AI_TUNING[4];
  return Math.max(1,Math.round(def.maxAnnualSignings*tuning.churnMult));
}
// Limit sprzedaży na sezon — symetryczny do aiSigningCap, tą samą skalą ligi (churnMult), ale
// osobną bazą (maxAnnualSells) — bez tego klub mógł kupować zdyscyplinowanie, a i tak
// generować dużo ruchu jako częsty "dawca" w cudzych realokacjach.
function aiSellingCap(club,lgLevel){
  const def=AI_TYPES[club.ai&&club.ai.type]||AI_TYPES.stabilny;
  const tuning=LEAGUE_AI_TUNING[lgLevel]||LEAGUE_AI_TUNING[4];
  return Math.max(1,Math.round(def.maxAnnualSells*tuning.churnMult));
}
// ── Realokacja bezpośrednia między klubami — zamknięty świat: nikt nie zawisa bez klubu
// (patrz js/CLAUDE.md), więc uzupełnienie składu szuka klubu z NADWYŻKĄ na danej pozycji
// (dawca zostaje z >= POS_QUOTA.min po oddaniu, nie oddaje chronionego rdzenia —
// aiCoreProtect) i przenosi zawodnika przez aiTransferPlayer() — ta sama historia/log co
// zwykły transfer AI-AI. Zastępuje dawną pulę G.fa w 4 miejscach (aiRenewContracts krok 5,
// aiSeasonalRefresh uzupełnienie do min 22, aiTransferSeason FAZA 3 zakupy+regeneracja).
// opts: targetSize (domyślnie 22), maxCount (limit w tym wywołaniu), band [min,max] OVR,
// maxAge, requireQuality (aiEvaluateSigning), requireBudget (ai.budget).
function aiSignReplacement(club,lgLevel,opts){
  opts=opts||{};
  const ai=club.ai;if(!ai)return;
  const ovr4=LEAGUE_OVR[lgLevel]||[20,35,35,55];
  const targetSize=opts.targetSize||22;
  const [bandMin,bandMax]=opts.band||[ovr4[0]-5,ovr4[3]+5];
  const season=G.season||1;
  const clubLevel={};G.leagues.forEach(l=>l.clubs.forEach(c=>{clubLevel[c.id]=l.level;}));
  let signed=0;
  while(true){
    const squad=G.players.filter(p=>p.clubId===club.id);
    if(squad.length>=targetSize)break;
    if(opts.maxCount!=null&&signed>=opts.maxCount)break;
    const cnt={GK:0,OBR:0,POL:0,NAP:0};
    squad.forEach(p=>{if(cnt[p.pos]!=null)cnt[p.pos]++;});
    // Składy i chronione rdzenie WSZYSTKICH klubów liczone raz na tę iterację pętli (nie per
    // kandydat) — inaczej O(kandydaci × rozmiar_klubu) przy każdym podpisaniu, zbyt wolne dla
    // całego świata AI.
    const squadByClub={};
    G.players.forEach(p=>{if(p.clubId>0)(squadByClub[p.clubId]||(squadByClub[p.clubId]=[])).push(p);});
    const donorPosCnt={};
    Object.keys(squadByClub).forEach(cid=>{
      const cc={};squadByClub[cid].forEach(p=>{cc[p.pos]=(cc[p.pos]||0)+1;});
      donorPosCnt[cid]=cc;
    });
    const coreCache={};
    function coreOf(cid){
      if(coreCache[cid])return coreCache[cid];
      const donor=ALL_CLUBS.find(c=>c.id===cid);
      const s=donor&&donor.ai?aiCoreProtect(donor,squadByClub[cid]||[]):new Set();
      coreCache[cid]=s;return s;
    }
    let pool=G.players.filter(p=>{
      if(p.clubId===club.id||p.clubId===G.myClubId||p.clubId<=0)return false;
      if(opts.maxAge!=null&&p.age>opts.maxAge)return false;
      const o=ovr(p);if(o<bandMin||o>bandMax)return false;
      if(POS_QUOTA[p.pos]&&cnt[p.pos]>=POS_QUOTA[p.pos].max)return false;
      const donorLvl=clubLevel[p.clubId];
      if(donorLvl==null||Math.abs(donorLvl-lgLevel)>2)return false;
      // Dawca musi mieć nadwyżkę na TEJ pozycji (zostaje z >= min po oddaniu) i to nie może
      // być jego chroniony rdzeń.
      if(POS_QUOTA[p.pos]&&(donorPosCnt[p.clubId]||{})[p.pos]<=POS_QUOTA[p.pos].min)return false;
      // Dawca musi też mieścić się w SWOIM limicie sprzedaży na sezon (aiSellingCap) — inaczej
      // klub omijałby własny limit, będąc częstym "dawcą" w cudzych realokacjach.
      const donorClub=ALL_CLUBS.find(c=>c.id===p.clubId);
      if(donorClub&&donorClub.ai){
        const donorCap=aiSellingCap(donorClub,donorLvl);
        if((donorClub.ai.sellsThisSeason||0)>=donorCap)return false;
      }
      return !coreOf(p.clubId).has(p.id);
    });
    if(opts.requireQuality)pool=pool.filter(p=>aiEvaluateSigning(p,p.pos,squad,club,lgLevel,ovr4[0]));
    if(!pool.length)break;
    // Priorytet: pozycje w deficycie (poniżej POS_QUOTA.min) najpierw, potem najwyższy OVR.
    pool.sort((a,b)=>{
      const da=POS_QUOTA[a.pos]?Math.max(0,POS_QUOTA[a.pos].min-cnt[a.pos]):0;
      const db=POS_QUOTA[b.pos]?Math.max(0,POS_QUOTA[b.pos].min-cnt[b.pos]):0;
      if(da!==db)return db-da;
      return ovr(b)-ovr(a);
    });
    const p=pool[0];
    const donor=ALL_CLUBS.find(c=>c.id===p.clubId);
    // Cena nigdy nie przekracza połowy AKTUALNEGO budżetu kupującego — calcValue() dla
    // realnego OVR łatwo sięga milionów niezależnie od ligi, kompletnie oderwane od budżetów
    // klubów AI (LEAGUE_BUDGET startuje od 12k). Bez tego nawet bezpiecznik minimalnego składu
    // (wywołania bez requireBudget) potrafił wpędzić klub w dziesiątki milionów długu.
    // Podłoga 500 na obu członach — bez niej zaokrąglenie do pełnych tysięcy potrafiło
    // zjechać do 0 dla słabych/starszych zawodników, dając pozornie "darmowe" transfery.
    const estPrice=Math.min(
      Math.max(500,Math.round(calcValue(ovr(p),p.age)*r(60,90)/100/1000)*1000),
      Math.max(500,Math.round((ai.budget||0)*0.5/500)*500)
    );
    if(opts.requireBudget&&(ai.budget||0)<estPrice*0.7)break;
    aiTransferPlayer(p,donor,club,estPrice,season,false);
    signed++;
  }
}

function aiTransferPlayer(p,fromClub,toClub,price,season,isWinter){
  if(!p.formerClubs)p.formerClubs=[];
  const fc=p.formerClubs.find(x=>x.clubId===fromClub.id);
  if(fc)fc.seasons=(fc.seasons||0)+1;
  else p.formerClubs.push({clubId:fromClub.id,clubName:fromClub.n,seasons:1});
  // Zapisz transfer w ostatnim wpisie historii
  if(!p.history)p.history=[];
  const _lastH=p.history[p.history.length-1];
  if(_lastH&&_lastH.clubId===fromClub.id){
    _lastH.transferOut={type:'sell',toClub:toClub.n,toClubId:toClub.id,price,season};
  }
  p.clubId=toClub.id;p.starter=false;p.contract=r(2,4);
  p.status='active';p.isFreeAgent=false;p._seasonsAtClub=0;
  // Usuń stary _current jeśli istnieje (transfer w tym samym sezonie)
  if(!p.history)p.history=[];
  p.history=p.history.filter(h=>!(h._current&&h.season===season&&h.clubId!==toClub.id));
  // Dodaj _current dla nowego klubu
  const _hasC=p.history.find(h=>h._current&&h.season===season&&h.clubId===toClub.id);
  if(!_hasC){p.history.push({season,clubId:toClub.id,club:toClub.n,m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_current:true});}
  // Log po stronie kupującego
  if(!toClub.ai.transferLog)toClub.ai.transferLog=[];
  toClub.ai.transferLog.unshift({type:'buy',name:p.name,pos:p.pos,ovr:ovr(p),age:p.age,price,season,playerId:p.id,fromClub:fromClub.n});
  if(toClub.ai.transferLog.length>20)toClub.ai.transferLog.pop();
  // Statystyki za całą historię kariery (nieprzycinane, w odróżnieniu od transferLog)
  toClub.ai.totalSpent=(toClub.ai.totalSpent||0)+price;
  toClub.ai.totalBuys=(toClub.ai.totalBuys||0)+1;
  toClub.ai.signingsThisSeason=(toClub.ai.signingsThisSeason||0)+1;
  if(price>0)_recordWorldTransfer({name:p.name,pos:p.pos,ovr:ovr(p),age:p.age,price,season,fromClub:fromClub.n,toClub:toClub.n,type:'ai',clubId:toClub.id,playerId:p.id});
  // Log po stronie sprzedającego — symetrycznie do kupującego. Jedyne miejsce, przez które
  // przechodzi KAŻDY transfer AI (FAZA 2, aiSignReplacement, wydarzenia Kroniki), więc licząc
  // to tutaj (a nie osobno u każdego wołającego) każda sprzedaż zawsze poprawnie się liczy.
  if(!fromClub.ai.transferLog)fromClub.ai.transferLog=[];
  fromClub.ai.transferLog.unshift({type:'sell',name:p.name,pos:p.pos,ovr:ovr(p),age:p.age,price,season,playerId:p.id,toClub:toClub.n});
  if(fromClub.ai.transferLog.length>20)fromClub.ai.transferLog.pop();
  fromClub.ai.totalEarned=(fromClub.ai.totalEarned||0)+price;
  fromClub.ai.totalSells=(fromClub.ai.totalSells||0)+1;
  fromClub.ai.sellsThisSeason=(fromClub.ai.sellsThisSeason||0)+1;
  fromClub.ai.budget=(fromClub.ai.budget||0)+price*0.7;
  toClub.ai.budget=(toClub.ai.budget||0)-price*0.8;
  return p;
}

function aiTransferSeason(isWinter){
  if(!G||!G.leagues)return;
  ensureClubsHaveAI();
  if(!G.retiredPlayers)G.retiredPlayers=[];
  const season=G.season||1;
  const importantNews=[];
  // Limit podpisań (aiSigningCap) liczony narastająco przez oba okna tego samego sezonu —
  // zerowanie PRZENIESIONE do aiSeasonalRefresh() (kronika.js), pierwszej funkcji w sekwencji
  // zmiany sezonu: gdyby zerować dopiero tutaj (jak dawniej), podpisania z aiSeasonalRefresh()
  // i aiRenewContracts() — obie wołane WCZEŚNIEJ w tej samej sekwencji — nigdy nie liczyłyby
  // się do limitu, a FAZA 3 dostawałaby pełny limit jeszcze raz od zera. Stąd kluby AI robiły
  // kilkanaście transferów/sezon zamiast kilku wg AI_TYPES.maxAnnualSignings.

  // ═══════════════════════════════════════════════════════════
  // FAZA 1: SPRZEDAŻ (do FA lub rynku AI)
  // ═══════════════════════════════════════════════════════════
  const aiMarket=[]; // zawodnicy wystawieni przez AI do sprzedaży między klubami

  G.leagues.forEach(lg=>{
    const lvl=lg.level;
    const ovr4=LEAGUE_OVR[lvl]||[20,35,35,55];
    const lgMin=ovr4[0],lgMax=ovr4[3];

    lg.clubs.forEach(club=>{
      if(club.id===G.myClubId)return;
      const ai=club.ai;
      if(!ai)return;
      const def=AI_TYPES[ai.type]||AI_TYPES.stabilny;
      const squad=G.players.filter(p=>p.clubId===club.id);
      const starters=squad.filter(p=>p.starter);
      const avgOvr=starters.length?Math.round(starters.reduce((s,p)=>s+ovr(p),0)/starters.length):lgMin;
      // Próg przycinania nadwyżki, osobny per typ klubu (filozofia: akademia trzyma szczuplej,
      // bogaty trzyma więcej) — zawsze poniżej twardego sufitu SQUAD_SIZE.max (data.js).
      const prefMax={akademia:22,sprzedajacy:24,bogaty:25,stabilny:22}[ai.type]||22;
      const winterRate=isWinter?0.5:1.0; // zimą mniej ruchów

      // Kandydaci do sprzedaży — konkretny powód (aiEvaluateSale) + ochrona rdzenia składu,
      // nie luźny zbiór warunków za losową kostką jak dawniej. sellRate typu to już tylko
      // tempo transakcji, nie selekcja — selekcja jest w aiEvaluateSale.
      const core=aiCoreProtect(club,squad);
      const sellCandidates=squad.filter(p=>{
        if((p._seasonsAtClub||0)===0)return false; // nie sprzedaj w pierwszym sezonie
        if(!aiEvaluateSale(p,club,squad,core,lgMax,prefMax,avgOvr))return false;
        return Math.random()<def.sellRate*winterRate;
      });
      // Limit sprzedaży na sezon (aiSellingCap) — symetryczny do limitu kupna (aiSigningCap).
      // Wygasły kontrakt (p.contract<=0) ma pierwszeństwo nad limitem — to nie decyzja klubu,
      // tylko wymuszona okoliczność (rzadkie tu — aiRenewContracts to zwykle już rozwiązał na
      // starcie sezonu, zanim to okno w ogóle się otworzy).
      const _forcedSell=sellCandidates.filter(p=>p.contract<=0);
      const _voluntarySell=sellCandidates.filter(p=>p.contract>0);
      const _remainingSells=Math.max(0,aiSellingCap(club,lvl)-(ai.sellsThisSeason||0));
      const toSell=_forcedSell.concat(_voluntarySell.slice(0,_remainingSells));

      toSell.forEach(p=>{
        // Podłoga 500 — calcValue() sama nigdy nie schodzi poniżej 500, ale zaokrąglenie
        // do pełnych tysięcy po przemnożeniu potrafiło zjechać do 0 dla słabych/starszych
        // zawodników blisko tej podłogi, dając pozornie "darmowe" transfery w logu klubu.
        const price=Math.max(500,Math.round(calcValue(ovr(p),p.age)*r(85,115)/100/1000)*1000);
        const isStar=ovr(p)>lgMax*1.10;
        // Wystaw na rynek AI — log zapisujemy dopiero w Fazie 2 gdy znamy kupca
        aiMarket.push({player:p,fromClub:club,price,lvl,isStar});
        if(!p.formerClubs)p.formerClubs=[];
        if(isStar&&(lvl===G.myLeague||lvl===G.myLeague-1||lvl===G.myLeague+1)){
          importantNews.push({msg:t('mp_news_listed').replace('{club}',club.n).replace('{name}',p.name).replace('{pos}',POS_SHORT[p.pos]||p.pos).replace('{ovr}',ovr(p)),type:'info'});
        }
        // ── ŻYWY ŚWIAT AI: plotka transferowa — próg niższy niż transfer (zapowiedź, nie transakcja) ──
        if(ovr(p)>lgMax*0.95){
          addWorldNewsEvent('rumour',{clubId:club.id,leagueLevel:lvl,playerId:p.id,
            vars:{club:club.n,name:p.name}});
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // FAZA 2: TRANSFERY AI↔AI (bezpośrednie — oba okna)
  // ═══════════════════════════════════════════════════════════
  const allAiClubs=G.leagues.flatMap(l=>l.clubs).filter(c=>c.id!==G.myClubId&&c.ai);

  // Przetasuj aiMarket dla losowości
  aiMarket.sort(()=>Math.random()-0.5);

  aiMarket.forEach(({player:p,fromClub,price,lvl,isStar})=>{
    if(p.clubId!==fromClub.id)return;
    const winterRate=isWinter?0.5:1.0;

    // Szukaj kupca — bramka jakości (aiEvaluateSigning: tylko lepszy/porównywalny na tej
    // pozycji), limit podpisań na sezon, wolne miejsce i chęć zakupu.
    const allBuyers=allAiClubs.filter(c=>{
      if(c.id===fromClub.id)return false;
      const cLg=G.leagues.find(l=>l.clubs.some(x=>x.id===c.id));
      const cLvl=cLg?cLg.level:99;
      const cOvr4=LEAGUE_OVR[cLvl]||[20,35,35,55];
      const lvlOk=Math.abs(cLvl-lvl)<=2;
      const cSquad=G.players.filter(x=>x.clubId===c.id);
      const hasRoom=cSquad.length<SQUAD_SIZE.max;
      const wantsBuy=Math.random()<(AI_TYPES[c.ai.type]||AI_TYPES.stabilny).buyRate*winterRate;
      const canAfford=(c.ai.budget||0)>=price*0.8;
      const underCap=(c.ai.signingsThisSeason||0)<aiSigningCap(c,cLvl);
      const qualityOk=aiEvaluateSigning(p,p.pos,cSquad,c,cLvl,cOvr4[0]);
      return lvlOk&&hasRoom&&wantsBuy&&canAfford&&underCap&&qualityOk;
    });

    let buyer=null;
    if(allBuyers.length){
      // Preferuj klub z największym budżetem, ale nie wymagaj minimalnego
      allBuyers.sort((a,b)=>(b.ai.budget||0)-(a.ai.budget||0));
      buyer=allBuyers[0];
    } else {
      // Ostatni fallback: dowolny klub z wolnym miejscem, pasującym OVR i wciąż pod bramką jakości
      const last=allAiClubs.filter(c=>{
        if(c.id===fromClub.id)return false;
        const cLg=G.leagues.find(l=>l.clubs.some(x=>x.id===c.id));
        const cLvl=cLg?cLg.level:99;
        const cOvr4=LEAGUE_OVR[cLvl]||[20,35,35,55];
        const cSquad=G.players.filter(x=>x.clubId===c.id);
        return Math.abs(cLvl-lvl)<=2&&cSquad.length<SQUAD_SIZE.max&&(c.ai.budget||0)>=price*0.8
          &&(c.ai.signingsThisSeason||0)<aiSigningCap(c,cLvl)&&aiEvaluateSigning(p,p.pos,cSquad,c,cLvl,cOvr4[0]);
      });
      if(last.length){last.sort((a,b)=>(b.ai.budget||0)-(a.ai.budget||0));buyer=last[0];}
    }

    if(buyer){
      // Log obu stron (buy/sell, totalEarned/totalSells) — liczony wewnątrz aiTransferPlayer().
      aiTransferPlayer(p,fromClub,buyer,price,season,isWinter);
      const nearMyLeague=lvl===G.myLeague||Math.abs(lvl-G.myLeague)<=1;
      if(nearMyLeague||isStar){
        importantNews.push({msg:t('mp_news_transferred').replace('{name}',p.name).replace('{pos}',POS_SHORT[p.pos]||p.pos).replace('{ovr}',ovr(p)).replace('{from}',fromClub.n).replace('{to}',buyer.n),type:'info'});
      }
      // ── ŻYWY ŚWIAT AI: news transferowy per liga — próg to wartość zawodnika na szczycie
      // pasma OVR ligi sprzedającego (calcValue), nie mnożnik isStar (dla ligi 1 był nieosiągalny) ──
      const _buyerLg=G.leagues.find(l=>l.clubs.some(x=>x.id===buyer.id));
      const _buyerLvl=_buyerLg?_buyerLg.level:lvl;
      const _bigTransferThreshold=calcValue((LEAGUE_OVR[lvl]||[20,35,35,55])[3],25);
      const _trVars={name:p.name,from:fromClub.n,to:buyer.n,val:fmtVal(price)};
      if(price>=_bigTransferThreshold){
        addWorldNewsEvent('transfer',{clubId:fromClub.id,leagueLevel:lvl,playerId:p.id,vars:_trVars});
        if(_buyerLvl!==lvl)addWorldNewsEvent('transfer',{clubId:buyer.id,leagueLevel:_buyerLvl,playerId:p.id,vars:_trVars});
      }
      // ── ŻYWY ŚWIAT AI: rekord — transfer w TOP 10 wszech czasów (G.worldTopTransfers) ──
      const _wtRank=(G.worldTopTransfers||[]).findIndex(e=>e.playerId===p.id&&e.season===season);
      if(_wtRank>=0&&_wtRank<10){
        addWorldNewsEvent('record',{clubId:buyer.id,leagueLevel:_buyerLvl,playerId:p.id,vars:_trVars});
      }
    }
    // Brak kupca → transakcja nie dochodzi do skutku, zawodnik zostaje w klubie (zamknięty
    // świat: nikt nie zawisa bez klubu, patrz js/CLAUDE.md).
  });

  // ═══════════════════════════════════════════════════════════
  // FAZA 3: ZAKUPY Z FA + JUNIORZY + REGENERACJA
  // ═══════════════════════════════════════════════════════════
  G.leagues.forEach(lg=>{
    const lvl=lg.level;
    const ovr4=LEAGUE_OVR[lvl]||[20,35,35,55];
    const lgMin=ovr4[0],lgMax=ovr4[3];

    lg.clubs.forEach(club=>{
      if(club.id===G.myClubId)return;
      const ai=club.ai;
      if(!ai)return;
      const def=AI_TYPES[ai.type]||AI_TYPES.stabilny;
      // ── ZAMKNIĘTY ŚWIAT: patrz SQUAD_SIZE (data.js) — jedno wspólne źródło prawdy ──────
      const prefSize=SQUAD_SIZE.target;
      const prefMax=SQUAD_SIZE.max;
      const squadNow=G.players.filter(p=>p.clubId===club.id);
      const starters=squadNow.filter(p=>p.starter);
      const avgOvr=starters.length?Math.round(starters.reduce((s,p)=>s+ovr(p),0)/starters.length):lgMin;
      const winterRate=isWinter?0.5:1.0;

      // ── ZAKUPY: realokacja bezpośrednia z nadwyżek innych klubów ──────
      // aiSignReplacement(): priorytet pozycji w deficycie (POS_QUOTA), zawsze log transferu.
      // Limit podpisań na sezon (aiSigningCap) obowiązuje TU już od razu — nie tylko w drugim,
      // "opcjonalnym" kroku niżej — bo to właśnie brak tego liczyło się w każdym kroku osobno
      // i dawało kilkanaście transferów/sezon zamiast kilku wg AI_TYPES.maxAnnualSignings.
      // Wyjątek: prawdziwy kryzys składu (<18) zawsze ma pierwszeństwo nad limitem —
      // i jako jedyny przypadek wolno mu podpisać zawodnika mimo braku funduszy
      // (requireBudget pominięty), żeby klub AI nie został bez możliwości wystawienia
      // drużyny meczowej. Poza tym kryzysem "za darmo" transferów nie ma: klub bez
      // pokrycia w budżecie po prostu nie robi transferu (requireBudget:true niżej).
      const signingCap=aiSigningCap(club,lvl);
      if(squadNow.length<prefSize){
        if(squadNow.length<SQUAD_SIZE.min){
          // maxCount domyka faktyczny deficyt do SQUAD_SIZE.min (nie sztywne 2) — inaczej
          // klub głęboko poniżej minimum nigdy nie odrabiał różnicy, bo pętla w
          // aiSignReplacement i tak zatrzymuje się na targetSize, więc wyższy maxCount tu
          // nie ryzykuje przesady, tylko pozwala faktycznie dobić do minimum w jednym sezonie.
          aiSignReplacement(club,lvl,{targetSize:SQUAD_SIZE.min,maxCount:Math.max(2,SQUAD_SIZE.min-squadNow.length),maxAge:def.maxBuyAge,band:[lgMin-5,lgMax+10]});
        }
        const squadAfterCrisis=G.players.filter(p=>p.clubId===club.id);
        if(squadAfterCrisis.length<prefSize){
          const remaining0=Math.max(0,signingCap-(ai.signingsThisSeason||0));
          const mc0=Math.min(2,remaining0);
          if(mc0>0)aiSignReplacement(club,lvl,{targetSize:prefSize,maxCount:mc0,maxAge:def.maxBuyAge,band:[lgMin-5,lgMax+10],requireBudget:true});
        }
      }
      const needsBuy=squadNow.length<prefSize||avgOvr<lgMin*0.88||(ai.promoted&&!isWinter);
      const wantsBuy=Math.random()<def.buyRate*winterRate;
      const curSizeAfterMin=G.players.filter(p=>p.clubId===club.id).length;
      if((needsBuy||wantsBuy)&&curSizeAfterMin<prefMax&&(ai.signingsThisSeason||0)<signingCap){
        const buyCount=ai.promoted&&!isWinter?r(2,3):r(1,2);
        const capLeft=Math.min(buyCount,signingCap-(ai.signingsThisSeason||0),prefMax-curSizeAfterMin);
        aiSignReplacement(club,lvl,{targetSize:curSizeAfterMin+capLeft,maxCount:capLeft,maxAge:def.maxBuyAge,
          band:[lgMin-5,lgMax+10],requireQuality:true,requireBudget:true});
      }

      // ── JUNIORZY — tylko latem, tylko 'akademia' i 'sprzedajacy' ──────
      if(!isWinter){
        const [jMin,jMaxBase]=def.juniors;
        // Ligi 1-2: większe zaplecze skautingowe czołowych klubów — +1 do górnego limitu.
        const jMax=(lvl<=2&&(ai.type==='akademia'||ai.type==='sprzedajacy'))?jMaxBase+1:jMaxBase;
        // Wcześniej Math.random()<0.85 (część klubów pomijała nabór): dopływ juniorów musi
        // domykać się z odpływem emerytów (patrz analiza kurczącej się populacji świata) —
        // nawet po usunięciu podwójnej loterii emerytalnej brakowało ~18% dopływu; usunięcie
        // tego losowego pominięcia daje +17,6% naboru, prawie dokładnie tyle ile brakowało.
        if(jMax>0){
          const count=r(jMin,jMax);
          for(let j=0;j<count;j++){
            const curSquadJ=G.players.filter(p=>p.clubId===club.id);
            if(curSquadJ.length>=prefMax)break;
            // Pozycja juniora: priorytet deficytu wg POS_QUOTA, nigdy ponad max (mkPlayer()
            // sam losuje pozycję z ustalonych proporcji 1GK/3OBR/3POL/1NAP, bez wiedzy o
            // składzie klubu — nadpisujemy jej wybór poniżej).
            const cntJ={GK:0,OBR:0,POL:0,NAP:0};
            curSquadJ.forEach(p=>{if(cntJ[p.pos]!=null)cntJ[p.pos]++;});
            const deficitPos=Object.keys(POS_QUOTA).filter(pos=>cntJ[pos]<POS_QUOTA[pos].min);
            const openPos=Object.keys(POS_QUOTA).filter(pos=>cntJ[pos]<POS_QUOTA[pos].max);
            if(!openPos.length)break; // wszystkie pozycje pełne — koniec naboru w tym oknie
            // Start juniora podniesiony TYLKO dla klubów wyraźnie mocniejszych niż typowy dla
            // ligi (avgOvr — średnia jedenastki wyjściowej klubu, policzona wyżej), nie dla
            // całej ligi jednolicie. Diagnoza (rozkład OVR starterzy/ławka w symulacji
            // 40-sezonowej): w resztkowej luce Premier Division/I Ligi starterzy trzymali się
            // dobrze, ale ŁAWKA/głębia składu spadała wszędzie o 9-11,5 pkt — bo sezon 1
            // (mkLeaguePlayers, news-bootstrap.js) przydziela OVR całym 24-osobowym składom wg
            // klasy klubu (gradient słaby→mocny klub), a odtąd każdy klub, niezależnie od
            // własnej siły, rekrutuje juniora z tego samego, płaskiego pasma ligi — mocne kluby
            // tracą tę przewagę w głębi składu, gdy ich sezon-1 kohorta się starzeje. Słabe/
            // średnie kluby (avgOvr blisko lgMin) dostają dokładnie to samo pasmo co wcześniej —
            // to NIE jest jednolite podniesienie całej ligi (które w poprzedniej próbie zalewało
            // świat i podbijało OVR ponad sezon 1), tylko przywrócenie różnicy między klubami.
            const _juniorFloor=Math.max(lgMin-3,avgOvr-25);
            const _juniorCeil=Math.max(lgMin+10,avgOvr-10);
            // Reputacja → jakość juniora (audyt stabilności OVR, 14.07.2026): NOWA, dodatkowa
            // rola reputacji, obok istniejących (przychody w calcWeeklyIncome, tempo rozwoju w
            // aiSeasonalRefresh, cele zarządu) — żadna z nich nie jest tu ruszana. Ten sam próg
            // co _repTierR w aiSeasonalRefresh (kronika.js), żeby nie wprowadzać drugiego wzorca
            // obok istniejącego.
            const _repJuniorBonus=(ai.reputation||0)>=500?6:(ai.reputation||0)>=250?3:(ai.reputation||0)<50?-2:0;
            const juniorOvr=r(_juniorFloor,_juniorCeil)+_repJuniorBonus;
            const junior=mkPlayer(club.id);
            junior.pos=deficitPos.length?pick(deficitPos):pick(openPos);
            junior.age=r(16,18);
            ['tec','pas','sht','def','phy','men'].forEach(a=>{junior[a]=Math.max(1,Math.min(99,Math.round(juniorOvr+r(-5,5))));});
            // Potencjał liczony OSOBNO od calcPotential()/LEAGUE_POT (data.js) — ta funkcja jest
            // wspólna dla całego świata (sezon 1 w mkLeaguePlayers, transfery), więc poszerzenie
            // jej bonusu podbijałoby też potencjał już dojrzałej populacji startowej zamiast
            // tylko juniorów (to również zmierzone i odrzucone — ten sam efekt nadmiernego
            // wzrostu). Bonus r(10,18) (szerszy niż wąski LEAGUE_POT per liga, np. VIII liga
            // 3-10) daje juniorowi realną przestrzeń do wzrostu przy obecnym tempie treningu,
            // bez zalewania świata graczami bliskimi sufitu. Sufit = LEAGUE_POT[lvl].max, ten
            // sam co dla reszty ligi.
            const _potCap=(LEAGUE_POT[lvl]||LEAGUE_POT[8]).max;
            junior.potential=Math.min(_potCap,ovr(junior)+r(10,18));
            junior.contract=r(2,3);junior.starter=false;junior.fromAcademy=true;
            junior.status='active';junior._seasonsAtClub=0;
            junior.value=calcValue(ovr(junior),junior.age);
            junior.salary=calcSalary(junior.value,lvl,ovr(junior));
            if(!junior.history)junior.history=[];
            junior.history.push({season,clubId:club.id,club:club.n,m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(junior),avgRat:null,_current:true,fromAcademy:true});
            G.players.push(junior);
            if(!ai.juniorLog)ai.juniorLog=[];
            ai.juniorLog.unshift({name:junior.name,pos:junior.pos,ovr:ovr(junior),pot:junior.potential,season,id:junior.id});
            if(ai.juniorLog.length>8)ai.juniorLog.pop();
            if(junior.potential>=75){
              addWorldNewsEvent('academy',{clubId:club.id,leagueLevel:lvl,playerId:junior.id,
                vars:{club:club.n,name:junior.name,pos:POS_SHORT[junior.pos]||junior.pos,pot:junior.potential}});
            }
          }
        }
      }

      // ── REGENERACJA: usunięta — czysta duplikacja z kroku "ZAKUPY" kilka linii wyżej
      // (ten sam docelowy rozmiar, ta sama funkcja), patrz komentarz przy kroku 5
      // aiRenewContracts() (match-post.js) — jeden z kilku redundantnych przebiegów, które
      // razem dawały kilkanaście transferów/sezon zamiast kilku.

      // ── ŻYWY ŚWIAT AI: przychód sezonowy + cel zarządu (tylko latem) ──────
      // Liczone TU, na końcu FAZA 3 — po sprzedażach, zakupach i juniorach — żeby przychód
      // odpowiadał faktycznemu, ostatecznemu składowi na sezon, a nie temu sprzed transferów
      // (inaczej przychód systematycznie nie nadążał za funduszem płac po dokupieniu zawodników).
      // Przychód i premia za cel są zakotwiczone we własnym funduszu płac klubu (nie w
      // LEAGUE_BUDGET) — to gwarantuje spójną skalę niezależnie od ligi i siły składu.
      if(!isWinter){
        const finalSquad=G.players.filter(p=>p.clubId===club.id);
        const finalStarters=finalSquad.filter(p=>p.starter);
        const finalAvgOvr=finalStarters.length?Math.round(finalStarters.reduce((s,p)=>s+ovr(p),0)/finalStarters.length):lgMin;
        const paymentCycles=Math.max(1,Math.round(2*(lg.clubs.length-1)/4));
        const squadWageBillPerSeason=finalSquad.reduce((s,p)=>s+(p.salary||0),0)*paymentCycles;
        ai._wageBillPerSeason=squadWageBillPerSeason; // do cotygodniowego poboru pensji i progu kryzysu

        // Mnożnik wg miejsca w tabeli z zakończonego właśnie sezonu (0,7× ostatni – 1,4× lider);
        // brak historii (pierwszy sezon klubu) = wartość neutralna (środek tabeli)
        const lastPos=ai._lastSeasonPos||Math.ceil(lg.clubs.length/2);
        const lastN=ai._lastSeasonClubCount||lg.clubs.length;
        const posRatio=lastN>1?1-(lastPos-1)/(lastN-1):0.5;
        const positionMult=0.7+posRatio*0.7;
        const seasonIncome=Math.round(squadWageBillPerSeason*positionMult/1000)*1000;
        ai.budget=(ai.budget||0)+seasonIncome;

        // Cel zarządu na nadchodzący sezon
        const relStrength=finalAvgOvr/Math.max(1,(lgMin+lgMax)/2);
        let goalType,targetPos;
        if(relStrength>1.08){
          goalType=lvl===1?'title':'promotion';
          targetPos=2;
        } else if(relStrength<0.92||ai.relegated){
          goalType='survival';
          targetPos=lg.clubs.length-2;
        } else {
          goalType='midtable';
          targetPos=lg.clubs.length-2;
        }
        // Premia za cel zarządu to reputacja (skala 0-1000, jak u gracza), nie pieniądze —
        // porównywalna z nagrodami z board-goals.js (rep 5-60 zależnie od trudności celu).
        const reward=(goalType==='title'||goalType==='promotion')?45:15;
        ai.boardGoal={type:goalType,targetPos,reward,achieved:null,season:G.season,clubCount:lg.clubs.length};
      }
      // ── AKTUALIZUJ FLAGI I SEZONOWE LICZNIKI ──────────────────────────
      if(!isWinter){ai.promoted=false;ai.relegated=false;}
      ai.reputation=Math.max(0,(ai.reputation||50)+(ai.type==='bogaty'?2:0));
      G.players.filter(p=>p.clubId===club.id).forEach(p=>{
        p._seasonsAtClub=(p._seasonsAtClub||0)+(isWinter?0:1);
      });
    });
  });

  // ── WIĘŹ Z KLUBEM: inkrementuj _seasonsAtClub dla zawodników gracza ──
  if(!isWinter){
    G.players.filter(p=>p.clubId===G.myClubId).forEach(p=>{
      p._seasonsAtClub=(p._seasonsAtClub||0)+1;
    });
  }

  // Pokaż ważne newsy (max 4)
  importantNews.slice(0,4).forEach(n=>addNews(n.msg,n.type));
}

