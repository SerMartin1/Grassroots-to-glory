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
      // Update standing for this league (liga gracza = G.standing)
      const _lvl=parseInt(lvlNum);const _myLvl=parseInt(G.myLeague||8);const st=_lvl===_myLvl?G.standing:(G.allStandings&&G.allStandings[_lvl]?G.allStandings[_lvl]:null);
      if(!st)return; // pomiń jeśli brak standings
      const h2=st.find(s=>parseInt(s.cid)===parseInt(m.h)),a2=st.find(s=>parseInt(s.cid)===parseInt(m.a));
      if(h2&&a2){h2.p++;a2.p++;h2.gf+=hG2;h2.ga+=aG2;a2.gf+=aG2;a2.ga+=hG2;if(hG2>aG2){h2.w++;a2.l++;h2.pts+=3;}else if(hG2<aG2){a2.w++;h2.l++;a2.pts+=3;}else{h2.d++;a2.d++;h2.pts++;a2.pts++;}}
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
          matchEvts2.push({scorerId:sc.id,assistId:assP?assP.id:null});
        }
      });
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
        });
        // v218: Lider/Zimna krew/Nerwowy — te same bonusy formy co w simMatch() (patrz punkt 5b),
        // teraz też dla klubów AI. Pewny siebie (seria zwycięstw) zostaje pominięty — kluby AI nie
        // mają dziś licznika winStreak (osobna decyzja, punkt 5c).
        if(won){
          if(teamPls.some(p=>p.starter&&p.traits&&p.traits.includes('lider')))
            teamPls.forEach(p=>{p.form=Math.min(99,p.form+2);});
        } else if(lost){
          teamPls.filter(p=>p.starter&&p.traits&&p.traits.includes('zimna_krew')).forEach(p=>{p.form=Math.min(99,p.form+2);});
          teamPls.filter(p=>p.starter&&p.traits&&p.traits.includes('nerwowy')).forEach(p=>{p.form=Math.max(5,p.form-2);});
        }
      });
      matchEvts2.forEach(e=>{const sc=G.players.find(x=>x.id===e.scorerId);if(sc){if(!sc.st.g)sc.st.g=0;sc.st.g++;}const as=e.assistId?G.players.find(x=>x.id===e.assistId):null;if(as){if(!as.st.a)as.st.a=0;as.st.a++;}});
    });
  });
}
function updStand(hid,aid,hg,ag){const st=G.standing;const h=st.find(s=>parseInt(s.cid)===parseInt(hid)),a=st.find(s=>parseInt(s.cid)===parseInt(aid));if(!h||!a)return;h.p++;a.p++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;if(hg>ag){h.w++;a.l++;h.pts+=3;}else if(hg<ag){a.w++;h.l++;a.pts+=3;}else{h.d++;a.d++;h.pts++;a.pts++;}}
function aiRenewContracts(){
  if(!G.retiredPlayers)G.retiredPlayers=[];
  if(!G.fa)G.fa=[];

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
    p.status='retired';p.retiredSeason=G.season;p.clubId=0;p.starter=false;
    G.retiredPlayers.push(p);
  });
  G.players=G.players.filter(p=>!retiring.includes(p));

  // ── 3. KONTRAKTY AI: contract-- ──────────────────────────────────────
  G.players.filter(p=>p.clubId!==G.myClubId).forEach(p=>{
    if(p.contract>0)p.contract--;
  });

  // ── 4. WYGASŁE KONTRAKTY → FA ────────────────────────────────────────
  const expired=G.players.filter(p=>p.clubId!==G.myClubId&&p.contract<=0&&!(p.traits&&p.traits.includes('lojalny')));
  expired.forEach(p=>{
    if(!p.formerClubs)p.formerClubs=[];
    const _hClub2=ALL_CLUBS.find(c=>c.id===p.clubId);
    const fc2=p.formerClubs.find(x=>x.clubId===p.clubId);
    if(fc2)fc2.seasons=(fc2.seasons||0)+1;
    else if(p.clubId>0)p.formerClubs.push({clubId:p.clubId,clubName:_hClub2?_hClub2.n:'?',seasons:1});
    p.starter=false;p.clubId=0;p.status='freeAgent';p.isFreeAgent=true;
    G.fa.push(p);
  });
  G.players=G.players.filter(p=>!expired.includes(p));

  // ── 5. FA UZUPEŁNIANIE: AI podpisuje do prefSize zawodników ──────────
  ALL_CLUBS.filter(c=>c.id!==G.myClubId).forEach(c=>{
    const ai=c.ai||{};
    const def=AI_TYPES[ai.type]||AI_TYPES.stabilny;
    const prefSize=24;
    const sq=G.players.filter(p=>p.clubId===c.id);
    const missing=Math.max(0,prefSize-sq.length);
    if(missing<=0||!G.fa.length)return;
    const lg=(G.leagues||[]).find(l=>l.clubs.some(x=>x.id===c.id));
    const lvl=lg?lg.level:8;
    const ovr4=LEAGUE_OVR[lvl]||[15,35,35,55];
    const available=G.fa.filter(p=>p.clubId===0&&p.status!=='retired'&&p.age<=def.maxBuyAge&&ovr(p)>=ovr4[0]-5&&ovr(p)<=ovr4[3]+10)
      .sort((a,b)=>ovr(b)-ovr(a));
    const signed=[];
    for(let i=0;i<Math.min(missing,available.length);i++){
      const p=available[i];
      if(!p.formerClubs)p.formerClubs=[];
      p.clubId=c.id;p.contract=r(1,3);p.status='active';p.isFreeAgent=false;
      p.salary=Math.round(p.salary*r(90,110)/100/50)*50;
      if(!p.history)p.history=[];
      fillHistoryGaps(p);
      // Wpis _current dla nowego sezonu
      const _s=G.season||1;
      if(!p.history.find(h=>h._current&&h.season===_s&&h.clubId===c.id)){
        const _cl=ALL_CLUBS.find(x=>x.id===c.id);
        p.history.push({season:_s,clubId:c.id,club:_cl?_cl.n:'?',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_current:true});
      }
      signed.push(p);
      G.players.push(p);
    }
    G.fa=G.fa.filter(p=>!signed.includes(p));
  });

  // ── 6. LIMIT FA: brak sztucznego limitu — zamknięty świat, FA to emeryci lub bez klubu ──────

  // ── 7. LIMIT EMERYTÓW: zachowaj max 200 (najnowsi) ───────────────────
  if(G.retiredPlayers.length>200){
    G.retiredPlayers=G.retiredPlayers.slice(-200);
  }
}

// ══════════════════════════════════════════════════════════════
// AI KLUBÓW — WARIANT B „DYNAMICZNA FILOZOFIA"
// ══════════════════════════════════════════════════════════════

const AI_TYPES={
  akademia:{
    icon:'🎓',label:t('mp_ai_akademia_label'),
    desc:t('mp_ai_akademia_desc'),
    buyRate:0.3,sellRate:0.4,juniors:[3,5],maxBuyAge:23,budgetMult:0.7
  },
  sprzedajacy:{
    icon:'💸',label:t('mp_ai_sprzedajacy_label'),
    desc:t('mp_ai_sprzedajacy_desc'),
    buyRate:0.7,sellRate:0.8,juniors:[1,2],maxBuyAge:27,budgetMult:1.0
  },
  bogaty:{
    icon:'💰',label:t('mp_ai_bogaty_label'),
    desc:t('mp_ai_bogaty_desc'),
    buyRate:0.9,sellRate:0.2,juniors:[0,0],maxBuyAge:32,budgetMult:2.0
  },
  stabilny:{
    icon:'🛡️',label:t('mp_ai_stabilny_label'),
    desc:t('mp_ai_stabilny_desc'),
    buyRate:0.3,sellRate:0.25,juniors:[1,1],maxBuyAge:30,budgetMult:1.1
  }
};
const AI_TYPES_LIST=['akademia','sprzedajacy','bogaty','stabilny'];

function initClubAI(club, leagueLevel){
  // Losuj typ z lekką preferencją (bogaty rzadszy w niższych ligach)
  let pool=['akademia','akademia','sprzedajacy','sprzedajacy','stabilny','stabilny','bogaty'];
  if(leagueLevel>=5) pool=pool.filter(t=>t!=='bogaty');
  const type=pool[Math.floor(Math.random()*pool.length)];
  const def=AI_TYPES[type];
  const baseBudget=Math.round((200000+Math.random()*800000)*def.budgetMult*(9-leagueLevel)/8/1000)*1000;
  return {
    type,
    budget:baseBudget,
    reputation:Math.round(20+(8-leagueLevel)*8+Math.random()*20),
    promoted:false,
    relegated:false,
    transferLog:[],
    juniorLog:[]
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
  for(let s=1;s<G.season;s++){
    if(!p.history.find(h=>h.season===s)){
      p.history.push({season:s,clubId:0,club:'Wolny agent',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_placeholder:true});
    }
  }
  p.history.sort((a,b)=>a.season-b.season);
}

// takeFromPool usunięty — zamknięty świat, brak G.playerPool

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
  fromClub.ai.budget=(fromClub.ai.budget||0)+price*0.7;
  toClub.ai.budget=(toClub.ai.budget||0)-price*0.8;
  return p;
}

function aiTransferSeason(isWinter){
  if(!G||!G.leagues)return;
  ensureClubsHaveAI();
  if(!G.retiredPlayers)G.retiredPlayers=[];
  if(!G.fa)G.fa=[];
  const season=G.season||1;
  const importantNews=[];

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
      const prefMax={akademia:22,sprzedajacy:24,bogaty:25,stabilny:22}[ai.type]||22;
      const winterRate=isWinter?0.5:1.0; // zimą mniej ruchów

      // Kandydaci do sprzedaży — tylko realne powody
      const typeRate=ai.type==='stabilny'?def.sellRate*0.25:ai.type==='bogaty'?def.sellRate*0.3:def.sellRate;
      const toSell=squad.filter(p=>{
        if(p.clubId===G.myClubId)return false;
        if((p._seasonsAtClub||0)===0)return false; // nie sprzedaj w pierwszym sezonie
        const o=ovr(p);
        const tooStrong=o>lgMax*1.15;
        const contractExpired=p.contract<=0;
        const overSquad=squad.length>prefMax;
        const developed=ai.type==='sprzedajacy'&&(p._seasonsAtClub||0)>=2&&o>avgOvr+5;
        return(tooStrong||contractExpired||overSquad||developed)&&Math.random()<typeRate*winterRate;
      });

      toSell.forEach(p=>{
        const price=Math.round(calcValue(ovr(p),p.age)*r(85,115)/100/1000)*1000;
        const isStar=ovr(p)>lgMax*1.10;
        // Wystaw na rynek AI — log zapisujemy dopiero w Fazie 2 gdy znamy kupca
        aiMarket.push({player:p,fromClub:club,price,lvl,isStar});
        if(!p.formerClubs)p.formerClubs=[];
        if(isStar&&(lvl===G.myLeague||lvl===G.myLeague-1||lvl===G.myLeague+1)){
          importantNews.push({msg:t('mp_news_listed').replace('{club}',club.n).replace('{name}',p.name).replace('{pos}',POS_SHORT[p.pos]||p.pos).replace('{ovr}',ovr(p)),type:'info'});
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

    // Szukaj kupca — wystarczy OVR fit, wolne miejsce i chęć zakupu
    const allBuyers=allAiClubs.filter(c=>{
      if(c.id===fromClub.id)return false;
      const cLg=G.leagues.find(l=>l.clubs.some(x=>x.id===c.id));
      const cLvl=cLg?cLg.level:99;
      const cOvr4=LEAGUE_OVR[cLvl]||[20,35,35,55];
      const lvlOk=Math.abs(cLvl-lvl)<=2;
      const ovrOk=ovr(p)>=cOvr4[0]-5&&ovr(p)<=cOvr4[3]+10;
      const hasRoom=G.players.filter(x=>x.clubId===c.id).length<25;
      const wantsBuy=Math.random()<(AI_TYPES[c.ai.type]||AI_TYPES.stabilny).buyRate*winterRate;
      return lvlOk&&ovrOk&&hasRoom&&wantsBuy;
    });

    let buyer=null;
    if(allBuyers.length){
      // Preferuj klub z największym budżetem, ale nie wymagaj minimalnego
      allBuyers.sort((a,b)=>(b.ai.budget||0)-(a.ai.budget||0));
      buyer=allBuyers[0];
    } else {
      // Ostatni fallback: dowolny klub z wolnym miejscem i pasującym OVR
      const last=allAiClubs.filter(c=>{
        if(c.id===fromClub.id)return false;
        const cLg=G.leagues.find(l=>l.clubs.some(x=>x.id===c.id));
        const cLvl=cLg?cLg.level:99;
        const cOvr4=LEAGUE_OVR[cLvl]||[20,35,35,55];
        return Math.abs(cLvl-lvl)<=2&&ovr(p)>=cOvr4[0]-5&&ovr(p)<=cOvr4[3]+12&&G.players.filter(x=>x.clubId===c.id).length<25;
      });
      if(last.length){last.sort((a,b)=>(b.ai.budget||0)-(a.ai.budget||0));buyer=last[0];}
    }

    if(buyer){
      aiTransferPlayer(p,fromClub,buyer,price,season,isWinter);
      if(!fromClub.ai.transferLog)fromClub.ai.transferLog=[];
      fromClub.ai.transferLog.unshift({type:'sell',name:p.name,pos:p.pos,ovr:ovr(p),age:p.age,price,season,playerId:p.id,toClub:buyer.n});
      if(fromClub.ai.transferLog.length>20)fromClub.ai.transferLog.pop();
      const nearMyLeague=lvl===G.myLeague||Math.abs(lvl-G.myLeague)<=1;
      if(nearMyLeague||isStar){
        importantNews.push({msg:t('mp_news_transferred').replace('{name}',p.name).replace('{pos}',POS_SHORT[p.pos]||p.pos).replace('{ovr}',ovr(p)).replace('{from}',fromClub.n).replace('{to}',buyer.n),type:'info'});
      }
    } else {
      // Naprawdę nikt nie pasuje → FA
      const fc=p.formerClubs?p.formerClubs.find(x=>x.clubId===fromClub.id):null;
      if(fc)fc.seasons=(fc.seasons||0)+1;
      else{if(!p.formerClubs)p.formerClubs=[];p.formerClubs.push({clubId:fromClub.id,clubName:fromClub.n,seasons:1});}
      p.clubId=0;p.starter=false;p.status='freeAgent';p.isFreeAgent=true;
      if(!G.fa)G.fa=[];
      G.fa.push(p);
      if(!fromClub.ai.transferLog)fromClub.ai.transferLog=[];
      fromClub.ai.transferLog.unshift({type:'sell',name:p.name,pos:p.pos,ovr:ovr(p),age:p.age,price,season,playerId:p.id,toClub:null});
      if(fromClub.ai.transferLog.length>20)fromClub.ai.transferLog.pop();
    }
  });

  // Oczyść G.players z zawodników sprzedanych do FA (clubId=0, status freeAgent)
  G.players=G.players.filter(p=>p.clubId>0);

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
      // ── ZAMKNIĘTY ŚWIAT: prefSize=24, max=40 ─────────────────────────
      const prefSize=24;
      const prefMax=40;
      const squadNow=G.players.filter(p=>p.clubId===club.id);
      const starters=squadNow.filter(p=>p.starter);
      const avgOvr=starters.length?Math.round(starters.reduce((s,p)=>s+ovr(p),0)/starters.length):lgMin;
      const winterRate=isWinter?0.5:1.0;

      // ── ZAKUPY Z FA — tylko G.fa, bez generowania nowych ──────────────
      const needsBuy=squadNow.length<prefSize||avgOvr<lgMin*0.88||(ai.promoted&&!isWinter);
      const wantsBuy=Math.random()<def.buyRate*winterRate;
      if((needsBuy||wantsBuy)&&squadNow.length<prefMax){
        const buyCount=ai.promoted&&!isWinter?r(2,3):r(1,2);
        for(let i=0;i<buyCount;i++){
          if(G.players.filter(p=>p.clubId===club.id).length>=prefMax)break;
          const faPool=(G.fa||[]).filter(p=>p.clubId===0&&p.status!=='retired'&&p.age<=def.maxBuyAge&&ovr(p)>=lgMin-5&&ovr(p)<=lgMax+10);
          if(!faPool.length)break; // brak dostępnych FA — nie generuj nowych
          faPool.sort((a,b)=>ovr(b)-ovr(a));
          const newP=faPool[0];
          if(!newP.formerClubs)newP.formerClubs=[];
          if(!newP.history)newP.history=[];
          fillHistoryGaps(newP);
          const _lhFA=newP.history[newP.history.length-1];
          if(_lhFA&&_lhFA.clubId&&_lhFA.clubId!==club.id)_lhFA.transferOut={type:'sell',toClub:club.n,toClubId:club.id,price:0,season};
          newP.clubId=club.id;newP.contract=r(2,4);newP.starter=false;
          newP.status='active';newP.isFreeAgent=false;newP._seasonsAtClub=0;
          if(!newP.history.find(h=>h._current&&h.season===season&&h.clubId===club.id)){
            newP.history.push({season,clubId:club.id,club:club.n,m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(newP),avgRat:null,_current:true});
          }
          G.fa=G.fa.filter(p=>p!==newP);
          G.players.push(newP);
          if(!ai.transferLog)ai.transferLog=[];
          ai.transferLog.unshift({type:'buy',name:newP.name,pos:newP.pos,ovr:ovr(newP),age:newP.age,price:0,season,playerId:newP.id,fromClub:'FA'});
          if(ai.transferLog.length>20)ai.transferLog.pop();
          const price2=Math.round(calcValue(ovr(newP),newP.age)*r(90,115)/100/1000)*1000;
          ai.budget=(ai.budget||0)-price2*0.7;
        }
      }

      // ── JUNIORZY — tylko latem, tylko 'akademia' i 'sprzedajacy' ──────
      if(!isWinter){
        const [jMin,jMax]=def.juniors;
        if(jMax>0&&Math.random()<0.85){
          const count=r(jMin,jMax);
          for(let j=0;j<count;j++){
            if(G.players.filter(p=>p.clubId===club.id).length>=prefMax)break;
            const juniorOvr=r(lgMin-8,lgMin+5);
            const junior=mkPlayer(club.id);
            junior.age=r(16,18);
            ['tec','pas','sht','def','phy','men'].forEach(a=>{junior[a]=Math.max(1,Math.min(99,Math.round(juniorOvr+r(-5,5))));});
            junior.potential=Math.min(99,Math.round(lgMax*0.9+r(0,10)));
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
          }
        }
      }

      // ── REGENERACJA — minimum 22 tylko z G.fa (zamknięty świat) ────────
      const finalSq=G.players.filter(p=>p.clubId===club.id);
      const missing2=Math.max(0,22-finalSq.length);
      for(let k=0;k<missing2;k++){
        const faRegen=(G.fa||[]).filter(p=>p.clubId===0&&p.status!=='retired'&&ovr(p)>=lgMin-8&&ovr(p)<=lgMax+8);
        if(!faRegen.length)break; // brak FA — nie generuj nowych
        faRegen.sort((a,b)=>ovr(b)-ovr(a));
        const rp=faRegen[0];
        fillHistoryGaps(rp);
        rp.clubId=club.id;rp.contract=r(1,3);rp.starter=false;rp.status='active';rp.isFreeAgent=false;
        rp.value=calcValue(ovr(rp),rp.age);
        rp.salary=calcSalary(rp.value,lvl,ovr(rp));
        const _lhRp=rp.history&&rp.history.length?rp.history[rp.history.length-1]:null;
        if(_lhRp&&_lhRp.clubId!==club.id)_lhRp.transferOut={type:'podpisanie',toClub:club.n,toClubId:club.id,price:0,season};
        if(!rp.history.find(h=>h._current&&h.season===season&&h.clubId===club.id)){
          rp.history.push({season,clubId:club.id,club:club.n,m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(rp),avgRat:null,_current:true});
        }
        G.fa=G.fa.filter(p=>p!==rp);
        G.players.push(rp);
      }

      // ── AKTUALIZUJ FLAGI I SEZONOWE LICZNIKI ──────────────────────────
      if(!isWinter){ai.promoted=false;ai.relegated=false;}
      ai.reputation=Math.max(10,Math.min(100,(ai.reputation||50)+(ai.type==='bogaty'?2:0)));
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

