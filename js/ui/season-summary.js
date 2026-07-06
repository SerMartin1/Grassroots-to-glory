function calcSeasonValuations(){
  if(!G)return;
  myPl().forEach(p=>{if(!p.seasonStartOvr)p.seasonStartOvr=ovr(p);});
  G._mssValSnap=myPl().map(p=>({id:p.id,name:p.name,oldVal:p.value||calcValue(ovr(p),p.age),newVal:0,diff:0}));
  myPl().forEach(p=>{
    const oldVal=p.value||calcValue(ovr(p),p.age);
    const curOvr=ovr(p);
    const base=calcValue(curOvr,p.age);
    const ovrDelta=curOvr-(p.seasonStartOvr||curOvr);
    let mFaza=1.0;
    if(p.age<=20){mFaza=ovrDelta>=1?1.20:0.85;}
    else if(p.age<=24){mFaza=1.10;}
    else if(p.age<=27){mFaza=1.00;}
    else if(p.age<=31){mFaza=0.92;if((p.st&&p.st.m||0)>=80)mFaza=1.02;}
    else{mFaza=(p.form||100)>=85?0.88:0.80;}
    let mRozwoj=1.0;
    if(ovrDelta>=5)mRozwoj=1.25;
    else if(ovrDelta>=3)mRozwoj=1.12;
    else if(ovrDelta>=1)mRozwoj=1.05;
    else if(ovrDelta===-1||ovrDelta===-2)mRozwoj=0.93;
    else if(ovrDelta<=-3)mRozwoj=0.82;
    const hist=p.history||[];
    if(hist.length>=1){
      const avgGA=hist.reduce((s,h)=>s+(h.g||0)+(h.a||0),0)/hist.length;
      const curGA=(p.st&&p.st.g||0)+(p.st&&p.st.a||0);
      if(avgGA>0&&curGA>=avgGA*2&&curGA>=4)mRozwoj=Math.min(mRozwoj*1.15,1.50);
    }
    const fm=p.form||100;
    const mForma=fm>=90?1.08:fm>=75?1.00:fm>=60?0.95:0.85;
    let bestBonus=0,worstPenalty=0;
    if(p.pos==='GK'&&(p.st&&p.st.cs||0)>=10)bestBonus=Math.max(bestBonus,0.08);
    if((p.st&&p.st.m||0)>=25)bestBonus=Math.max(bestBonus,0.05);
    if(p.injured)worstPenalty=Math.max(worstPenalty,0.12);
    if((p.st&&p.st.rk||0)>=2)worstPenalty=Math.max(worstPenalty,0.05);
    const mSezon=(1+bestBonus)*(1-worstPenalty);
    let newVal=Math.round(base*mFaza*mRozwoj*mForma*mSezon/500)*500;
    newVal=Math.max(newVal,500);
    p.value=newVal;
    const snap=G._mssValSnap.find(s=>s.id===p.id);
    if(snap){snap.newVal=newVal;snap.diff=newVal-oldVal;}
  });
}

function showSeasonSummary(){
  if(!G)return;
  const modal=document.getElementById('modal-season-summary');
  if(!modal)return;

  // Nagłówek
  const lbl=document.getElementById('mss-season-label');
  const badge=document.getElementById('mss-league-badge');
  if(lbl)lbl.textContent=t('mss_season_label').replace('{n}',G.season||1);
  if(badge)badge.textContent=(G.leagues&&G.leagues.find(l=>l.level===G.myLeague)&&G.leagues.find(l=>l.level===G.myLeague).name)||(LEAGUE_NAMES[G.myLeague||8]||'');

  // Zbierz dane
  const sorted=[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
  const myIdx=sorted.findIndex(s=>parseInt(s.cid)===parseInt(G.myClubId));
  const myS=sorted[myIdx]||{};
  const pos=myIdx+1;
  const totalClubs=sorted.length;

  // Cele zarządu — pobierz z goalsHistory (ostatni wpis)
  const lastGoals=(G.board&&G.board.goalsHistory&&G.board.goalsHistory.length)?G.board.goalsHistory[G.board.goalsHistory.length-1]:null;

  // Transfery tego sezonu
  const trSeason=(G.fin&&G.fin.transfers||[]).filter(t=>t.season===G.season);
  const trBought=trSeason.filter(t=>t.type==='buy');
  const trSold=trSeason.filter(t=>t.type==='sell');
  const trSpent=trBought.reduce((s,t)=>s+(t.val||t.fee||0),0);
  const trEarned=trSold.reduce((s,t)=>s+(t.val||t.fee||0),0);

  // Top strzelec / najlepszy gracz
  const squad=myPl();
  const topScorer=squad.slice().sort((a,b)=>(b.st&&b.st.g||0)-(a.st&&a.st.g||0))[0];
  const topRating=squad.filter(p=>p.seasonRatings&&p.seasonRatings.length>0).sort((a,b)=>{
    const ar=a.seasonRatings.reduce((s,r)=>s+r,0)/a.seasonRatings.length;
    const br=b.seasonRatings.reduce((s,r)=>s+r,0)/b.seasonRatings.length;
    return br-ar;
  })[0];

  // Finanse bieżącego sezonu
  const budgetStart=G._budgetSeasonStart!=null?G._budgetSeasonStart:null;
  // fin.hist: filtruj po sezonie; sprzedaże (note='SPR:') wyłącz z przychodów operacyjnych
  // bo są już liczone w trEarned (fin.transfers)
  const finHist=(G.fin&&G.fin.hist||[]).filter(h=>(h.season===G.season)||(h.season==null&&(h.w||0)>0&&!h._old));
  let totalInc=0,totalCost=0;
  finHist.forEach(h=>{
    const note=h.note||'';
    // Wyklucz wpisy ze sprzedaży zawodników — są w trEarned
    if(!note.startsWith('SPR:'))totalInc+=(h.inc||0);
    totalCost+=(h.cost||0);
  });
  const finBal=totalInc-totalCost;

  // Wyceny — zbierz snapshot PRZED startem nowego sezonu
  // G._mssValSnap jest zapisany przy końcu sezonu
  // Wyceny — jeśli snap pusty (np. po wczytaniu zapisu), przelicz teraz
  if(!G._mssValSnap||G._mssValSnap.length===0)calcSeasonValuations();
  const valSnap=G._mssValSnap||[];

  // ── TAB: WYNIKI ────────────────────────────────────────────
  const promRelLabel=(()=>{
    const leagueLevel=G.myLeague||8;
    if(pos===1)return '<span style="color:var(--am)">'+t('mss_champion')+'</span>';
    if(pos<=2&&leagueLevel>1)return '<span style="color:var(--gb)">'+t('mss_promoted')+'</span>';
    if(pos>=totalClubs-1&&leagueLevel<8)return '<span style="color:var(--rd)">'+t('mss_relegation_threat')+'</span>';
    return '';
  })();

  const posColor=pos===1?'var(--am)':pos<=3?'var(--gb)':pos>=totalClubs-1?'var(--rd)':'var(--wh)';

  document.getElementById('mss-wyniki').innerHTML=`
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:1px">${t('mss_league_position')}</div>
      <div style="font-size:var(--fs-dense);color:${posColor}">${pos}.</div>
      <div style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_of_clubs').replace('{n}',totalClubs)}</div>
      ${promRelLabel?'<div style="margin-top:4px;font-size:var(--fs-dense)">'+promRelLabel+'</div>':''}
    </div>
    <div style="background:#0a1a0a;border:1px solid var(--gl);padding:7px 10px;margin-bottom:8px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;text-align:center;gap:4px">
        <div><div style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_col_pts')}</div><div style="font-size:var(--fs-dense);color:var(--am)">${myS.pts||0}</div></div>
        <div><div style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_col_w')}</div><div style="font-size:var(--fs-dense);color:var(--gb)">${myS.w||0}</div></div>
        <div><div style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_col_d')}</div><div style="font-size:var(--fs-dense);color:var(--wh)">${myS.d||0}</div></div>
        <div><div style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_col_l')}</div><div style="font-size:var(--fs-dense);color:var(--rd)">${myS.l||0}</div></div>
      </div>
      <div style="text-align:center;margin-top:4px;font-size:var(--fs-dense);color:var(--wh)">${myS.gf||0}:${myS.ga||0} <span style="color:var(--gr);font-size:var(--fs-dense)">${t('mss_goals_label')}</span></div>
    </div>
    ${topScorer?`<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:2px">${t('mss_top_scorer')}</div>
    <div onclick="showById(${topScorer.id})" style="background:#0a1a0a;border:1px solid var(--am);padding:6px 10px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span style="font-size:var(--fs-dense);color:var(--am)">${topScorer.name} <span style='font-size:var(--fs-dense)'>↗</span></span>
      <span style="font-size:var(--fs-dense);color:var(--am)">${t('mss_goals_suffix').replace('{n}',topScorer.st&&topScorer.st.g||0)}</span>
    </div>`:''}
    ${topRating?`<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:2px">${t('mss_top_rating')}</div>
    <div onclick="showById(${topRating.id})" style="background:#0a1a0a;border:1px solid var(--gb);padding:6px 10px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span style="font-size:var(--fs-dense);color:var(--gb)">${topRating.name} <span style='font-size:var(--fs-dense)'>↗</span></span>
      <span style="font-size:var(--fs-dense);color:var(--gb)">${(topRating.seasonRatings.reduce((s,r)=>s+r,0)/topRating.seasonRatings.length).toFixed(1)} avg</span>
    </div>`:''}
  `;

  // ── TAB: CELE ──────────────────────────────────────────────
  let celeHtml='';
  if(lastGoals){
    const mIcon=lastGoals.mainDone?'✅':'❌';
    const mColor=lastGoals.mainDone?'var(--gb)':'var(--rd)';
    const oIcon=lastGoals.optDone===true?'✅':lastGoals.optDone===false?'❌':'—';
    const oColor=lastGoals.optDone===true?'var(--gb)':lastGoals.optDone===false?'var(--rd)':'var(--gr)';
    const ocena=lastGoals.mainDone?'<span style="color:var(--gb)">'+t('mss_board_happy')+'</span>':'<span style="color:var(--rd)">'+t('mss_board_disappointed')+'</span>';
    celeHtml=`
      <div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">${t('mss_main_goal')}</div>
      <div style="background:#0a1a0a;border:1px solid ${mColor};padding:10px 12px;margin-bottom:10px;display:flex;gap:8px;align-items:center">
        <span style="font-size:var(--fs-dense)">${mIcon}</span>
        <span style="font-size:var(--fs-dense);color:${mColor}">${lastGoals.mainGoal||'—'}</span>
      </div>
      ${lastGoals.optGoal?`<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">${t('mss_opt_goal')}</div>
      <div style="background:#0a1a0a;border:1px solid ${oColor};padding:10px 12px;margin-bottom:10px;display:flex;gap:8px;align-items:center">
        <span style="font-size:var(--fs-dense)">${oIcon}</span>
        <span style="font-size:var(--fs-dense);color:${oColor}">${lastGoals.optGoal}</span>
      </div>`:''}
      <div style="background:#111;border:1px solid var(--gl);padding:8px 12px;text-align:center;font-size:var(--fs-dense);margin-top:6px">
        ${ocena}
        ${(lastGoals.streakAfter||0)>=2?'<div style="color:var(--rd);font-size:var(--fs-dense);margin-top:3px">'+t('mss_board_pressure').replace('{n}',lastGoals.streakAfter)+'</div>':''}
      </div>`;
  } else {
    celeHtml='<div style="color:var(--gr);font-size:var(--fs-dense);text-align:center;padding:16px">'+t('mss_no_goals')+'</div>';
  }
  document.getElementById('mss-cele').innerHTML=celeHtml;

  // ── TAB: FINANSE ───────────────────────────────────────────
  {
    const _trNet=trEarned-trSpent;
    // Wynik netto = zmiana budżetu. Gdy _budgetSeasonStart brak (stary zapis),
    // rekonstruuj: budżet_start = budżet_koniec - przychody_op + wydatki_op - bilans_tr
    const _bStart=budgetStart!=null?budgetStart:(G.budget-finBal-_trNet);
    const _nettoReal=G.budget-_bStart;
    const _nettoColor=_nettoReal>=0?'var(--gb)':'var(--rd)';
    const _nettoSign=_nettoReal>=0?'+':'';
    document.getElementById('mss-finanse').innerHTML=`
    <div style="background:#0a1a0a;border:1px solid var(--gl);padding:7px 10px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_income_op')}</span>
        <span style="font-size:var(--fs-dense);color:var(--gb)">+${fmtVal(totalInc)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_cost_op')}</span>
        <span style="font-size:var(--fs-dense);color:var(--rd)">-${fmtVal(totalCost)}</span>
      </div>
      ${_trNet!==0?`<div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_transfers_label')}</span>
        <span style="font-size:var(--fs-dense);color:${_trNet>=0?'var(--gb)':'var(--rd)'}">${_trNet>=0?'+':''}${fmtVal(_trNet)}</span>
      </div>`:''}
      ${(G.seasonBonus&&G.seasonBonus>0)?`<div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_bonus_label')}</span>
        <span style="font-size:var(--fs-dense);color:var(--gb)">+${fmtVal(G.seasonBonus)}</span>
      </div>`:''}
      <div style="border-top:1px solid var(--gl);margin-top:4px;padding-top:6px;display:flex;justify-content:space-between">
        <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_sum_label')}</span>
        <span style="font-size:var(--fs-dense);color:var(--wh)">${_nettoSign}${fmtVal(totalInc-totalCost+_trNet+(G.seasonBonus||0))}</span>
      </div>
    </div>
    <div style="background:#0a1a0a;border:1px solid var(--am);padding:10px 12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_budget_start')}</span>
        <span style="font-size:var(--fs-dense);color:var(--wh)">${fmt(_bStart)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_budget_end')}</span>
        <span style="font-size:var(--fs-dense);color:var(--am)">${fmt(G.budget)}</span>
      </div>
      <div style="border-top:1px solid var(--gl);padding-top:6px;display:flex;justify-content:space-between">
        <span style="font-size:var(--fs-dense);color:var(--wh)">${t('mss_net_result')}</span>
        <span style="font-size:var(--fs-dense);color:${_nettoColor}">${_nettoSign}${fmtVal(_nettoReal)}</span>
      </div>
    </div>
  `;
  }

  // ── TAB: TRANSFERY ─────────────────────────────────────────
  let trHtml='';
  if(trSeason.length===0){
    trHtml='<div style="color:var(--gr);font-size:var(--fs-dense);text-align:center;padding:20px">'+t('mss_no_transfers')+'</div>';
  } else {
    const trBalColor=trEarned-trSpent>=0?'var(--gb)':'var(--rd)';
    const trBalSign=trEarned-trSpent>=0?'+':'';
    trHtml=`
      <div style="background:#0a1a0a;border:1px solid var(--gl);padding:10px 12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_purchases').replace('{n}',trBought.length)}</span>
          <span style="font-size:var(--fs-dense);color:var(--rd)">-${fmtVal(trSpent)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:var(--fs-dense);color:var(--gr)">${t('mss_sales').replace('{n}',trSold.length)}</span>
          <span style="font-size:var(--fs-dense);color:var(--gb)">+${fmtVal(trEarned)}</span>
        </div>
        <div style="border-top:1px solid var(--gl);padding-top:8px;display:flex;justify-content:space-between">
          <span style="font-size:var(--fs-dense);color:var(--wh)">${t('mss_balance')}</span>
          <span style="font-size:var(--fs-dense);color:${trBalColor}">${trBalSign}${fmtVal(trEarned-trSpent)}</span>
        </div>
      </div>`;
    if(trBought.length>0){
      trHtml+='<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+t('mss_acquired')+'</div>';
      trBought.forEach(t=>{
        const _nameEl=t.id?`<span onclick="showById(${t.id})" style="color:var(--gb);cursor:pointer">${t.name} <span style="font-size:var(--fs-dense)">↗</span></span>`:`<span style="color:var(--wh)">${t.name}</span>`;
        trHtml+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #1a2a1a;font-size:var(--fs-dense)">
          ${_nameEl}<span style="color:var(--rd)">-${fmtVal(t.val||t.fee||0)}</span></div>`;
      });
    }
    if(trSold.length>0){
      trHtml+='<div style="font-size:var(--fs-dense);color:var(--gr);margin:10px 0 4px">'+t('mss_sold_section')+'</div>';
      trSold.forEach(t=>{
        const _nameEl=t.id?`<span onclick="showById(${t.id})" style="color:var(--rd);cursor:pointer">${t.name} <span style="font-size:var(--fs-dense)">↗</span></span>`:`<span style="color:var(--wh)">${t.name}</span>`;
        trHtml+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #1a2a1a;font-size:var(--fs-dense)">
          ${_nameEl}<span style="color:var(--gb)">+${fmtVal(t.val||t.fee||0)}</span></div>`;
      });
    }
  }
  document.getElementById('mss-transfery').innerHTML=trHtml;

  // ── TAB: WYCENY ────────────────────────────────────────────
  let wycHtml='';
  if(valSnap.length===0){
    wycHtml='<div style="color:var(--gr);font-size:var(--fs-dense);text-align:center;padding:20px">'+t('mss_val_pending')+'</div>';
  } else {
    const risers=[...valSnap].sort((a,b)=>b.diff-a.diff).filter(v=>v.diff>0);
    const fallers=[...valSnap].sort((a,b)=>a.diff-b.diff).filter(v=>v.diff<0);
    const unchanged=valSnap.filter(v=>v.diff===0);
    wycHtml=`<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:8px">${t('mss_val_summary').replace('{n}',valSnap.length).replace('{up}',risers.length).replace('{down}',fallers.length)}</div>`;
    if(risers.length>0){
      wycHtml+='<div style="font-size:var(--fs-dense);color:var(--gb);margin-bottom:4px;letter-spacing:1px">'+t('mss_risers')+'</div>';
      risers.slice(0,8).forEach(v=>{
        wycHtml+=`<div onclick="showById(${v.id})" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1a2a1a;cursor:pointer">
          <div><div style="font-size:var(--fs-dense);color:var(--gb)">${v.name} <span style='font-size:var(--fs-dense)'>↗</span></div><div style="font-size:var(--fs-dense);color:var(--gr)">${v.oldVal>0?fmtVal(v.oldVal):'—'} → ${fmtVal(v.newVal)}</div></div>
          <span style="font-size:var(--fs-dense);color:var(--gb);min-width:44px;text-align:right">+${fmtVal(v.diff)}</span>
        </div>`;
      });
    }
    if(fallers.length>0){
      wycHtml+='<div style="font-size:var(--fs-dense);color:var(--rd);margin:10px 0 4px;letter-spacing:1px">'+t('mss_fallers')+'</div>';
      fallers.slice(0,8).forEach(v=>{
        wycHtml+=`<div onclick="showById(${v.id})" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1a2a1a;cursor:pointer">
          <div><div style="font-size:var(--fs-dense);color:var(--rd)">${v.name} <span style='font-size:var(--fs-dense)'>↗</span></div><div style="font-size:var(--fs-dense);color:var(--gr)">${fmtVal(v.oldVal)} → ${fmtVal(v.newVal)}</div></div>
          <span style="font-size:var(--fs-dense);color:var(--rd);min-width:44px;text-align:right">${fmtVal(v.diff)}</span>
        </div>`;
      });
    }
    if(!risers.length&&!fallers.length){
      wycHtml+='<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">'+t('mss_current_valuations')+'</div>';
      [...valSnap].sort((a,b)=>b.newVal-a.newVal).forEach(v=>{
        wycHtml+=`<div onclick="showById(${v.id})" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a2a1a;font-size:var(--fs-dense);cursor:pointer">
          <span style="color:var(--am)">${v.name} <span style='font-size:var(--fs-dense)'>↗</span></span>
          <span style="color:var(--am)">${fmtVal(v.newVal||v.oldVal)}</span>
        </div>`;
      });
    } else if(unchanged.length>0){
      wycHtml+='<div style="font-size:var(--fs-dense);color:var(--gr);margin:10px 0 4px">'+t('mss_unchanged')+'</div>';
      unchanged.forEach(v=>{
        wycHtml+=`<div onclick="showById(${v.id})" style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a2a1a;font-size:var(--fs-dense);cursor:pointer">
          <span style="color:var(--wh)">${v.name} <span style='font-size:var(--fs-dense)'>↗</span></span>
          <span style="color:var(--gr)">${fmtVal(v.newVal||v.oldVal)}</span>
        </div>`;
      });
    }
  }
  document.getElementById('mss-wyceny').innerHTML=wycHtml;

  // Aktywuj pierwszą zakładkę
  mssTab('wyniki', document.querySelector('.mss-tab'));

  // Pokaż modal
  modal.style.display='flex';
  modal.scrollTop=0;
}

function mssTab(name, btn){
  document.querySelectorAll('.mss-tab').forEach(b=>{
    b.style.color='var(--gr)';
    b.style.borderBottom='2px solid transparent';
  });
  document.querySelectorAll('.mss-panel').forEach(p=>p.style.display='none');
  if(btn){btn.style.color='var(--am)';btn.style.borderBottom='2px solid var(--am)';}
  const p=document.getElementById('mss-'+name);
  if(p)p.style.display='block';
}

function closeSeasSummaryAndStartNew(){
  const modal=document.getElementById('modal-season-summary');
  if(modal)modal.style.display='none';
  startNewSeason();
}

function startNewSeason(){
  if(!G||!G.seasonEnded)return;
  // ── EMERYTURA: losuj dla zawodników 32-38 lat ────────────────────────
  const retireChance={32:0.10,33:0.10,34:0.25,35:0.25,36:0.50,37:0.50,38:0.90};
  G.players.forEach(p=>{
    p.retiring=false; // reset każdy sezon
    const chance=retireChance[p.age]||(p.age>38?0.95:0);
    if(chance>0&&Math.random()<chance){
      p.retiring=true;
      if(p.clubId===G.myClubId){
        addNews(t('news_retire_announce').replace('{name}',p.name).replace('{age}',p.age),'budget');
      }
    }
  });
  // Reset statystyk dla nowego sezonu (historia już zapisana przy G.seasonEnded=true)
  G.players.forEach(p=>{
    p.st={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0};
    p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
  });
  G._budgetSeasonStart=G.budget;G.seasonEnded=false;
  G.season++;G.week=1;G.round=1;
  // Reset pucharu — nowy sezon, nowy puchar
  G.cup=null;G._cupMatchActive=null;G._cupFakeMatch=null;
  updateCupTileBadge();
  // Reset ocen sezonowych zawodników
  G.players.forEach(p=>{p.seasonRatings=[];p.lastMatchRating=null;p.fatigue=0;});
  G.schedule=G.allSchedules[G.myLeague]||buildSchedule(G.myClubId,getLeagueClubs(G.leagues,G.myLeague));
  G.mHist=[];G.news=[];G.trainLog=[];G._newsModalShown={};
  if(G.scout)G.scout.signedThisSeason=0;
  // Koszt skauta na poczatek nowego sezonu
  if(G.scout&&G.scout.level&&G.scout.level!=='free'){
    const _sdS=SCOUTS_DEF.find(s=>s.id===G.scout.level);
    if(_sdS&&_sdS.cost>0){
      if(G.budget>=_sdS.cost){
        G.budget-=_sdS.cost;
        if(!G.fin)G.fin={};
        if(!G.fin.hist)G.fin.hist=[];
        G.fin.hist.push({w:1,inc:0,cost:_sdS.cost,bal:G.budget,note:t('mss_note_scout_upkeep').replace('{name}',_sdS.label||_sdS.name)});
        addNews(t('news_scout_fee').replace('{label}',_sdS.label||_sdS.name).replace('{cost}',fmt(_sdS.cost)),'scout');
      } else {
        G.scout.level='free';
        addNews(t('news_scout_no_funds'),'scout');
      }
    }
  }
  G._letnieClosed=false;G._deadlineDone=false;G._zimoweClosed=false;G._deadlineZimDone=false;
  // Kronika Klubu — reset na nowy sezon
  if(!G.kronika)G.kronika={cooldown:0,usedThisSeason:[],flags:{}};
  G.kronika.usedThisSeason=[];G.kronika.cooldown=0;G.kronika.flags={};
  // rumourPool NIE resetujemy — zawodnicy czekają na okno letnie nowego sezonuG.trainFocusLock=0;G.completedFocuses=0;G.contractWarned={};G.noFocusWeeks=0;G.transferMarket=[];G.listedPlayers=[];G.pendingOffers=[];G.trBoughtThisWindow=0;G.trSoldThisWindow=0;G._sellOffers={};
  if(!G.reputation)G.reputation=10;
  G.reputation=Math.min(1000,G.reputation+5);
  const _fb=Math.min(80,20+(G.reputation||10)/10);
  G.frequency=Math.round(((G.frequency||40)*0.7+_fb*0.3));
  G.winStreak=0;G.loseStreak=0;G.seasonBonus=0;
  if(G.board&&G.board.ticketBonus)G.board.ticketBonus=0;
  // Dekrementuj kontrakty sponsorskie
  if(G.contracts){
    Object.keys(G.contracts).forEach(k=>{
      if(G.contracts[k]&&G.contracts[k].seasonsLeft>0){
        G.contracts[k].seasonsLeft--;
        if(G.contracts[k].seasonsLeft<=0){
          G.news=G.news||[];G.news.unshift({msg:t('mss_news_expired_contract').replace('{name}',k),type:'info',week:G.week||1,season:G.season,action:'finance',actionLabel:t('tile_finance')});renderNews();
          G.contracts[k]={weekly:0,seasonsLeft:0};
        }
      }
    });
  }
  myPl().forEach(p=>{p.seasonStartOvr=ovr(p);p.seasonStartAttrs={tec:p.tec,pas:p.pas,sht:p.sht,def:p.def,phy:p.phy,men:p.men};});
  // Wyceny obliczone już w calcSeasonValuations() przy seasonEnded
  // ─────────────────────────────────────────────────────────────────────
  // ── USUNIĘCIE EMERYTÓW po zapisie historii ──────────────────────────
  if(!G.retiredPlayers)G.retiredPlayers=[];
  const retiring=G.players.filter(p=>p.retiring);
  retiring.forEach(p=>{
    if(p.clubId===G.myClubId){
      addNews(t('news_career_end').replace('{name}',p.name).replace('{age}',p.age),'info');
    }
    // Dodaj do formerClubs
    if(!p.formerClubs)p.formerClubs=[];
    const _rc=ALL_CLUBS.find(c=>c.id===p.clubId);
    const _fce=p.formerClubs.find(x=>x.clubId===p.clubId);
    if(_fce)_fce.seasons=(_fce.seasons||0)+1;
    else if(p.clubId>0)p.formerClubs.push({clubId:p.clubId,clubName:_rc?_rc.n:'?',seasons:1});
    p.status='retired';p.retiredSeason=G.season;p.clubId=0;p.starter=false;p.retiring=false;
    G.retiredPlayers.push(p);
  });
  G.players=G.players.filter(p=>p.status!=='retired');
  // Sezonowe odświeżenie składów AI (starzenie, wzrosty, wymiana)
  aiSeasonalRefresh();
  // ── KONTRAKTY: dekrementuj i obsłuż wygasłe na końcu sezonu ────────
  // Moi zawodnicy: kontrakt -1, wygasłe odchodzą
  myPl().forEach(p=>{if(p.contract>0)p.contract--;});
  const _myExpired=myPl().filter(p=>p.contract<=0&&!(p.traits&&p.traits.includes('lojalny')));
  _myExpired.forEach(p=>{
    const targetClub=pick(ALL_CLUBS.filter(c=>c.id!==G.myClubId));
    if(targetClub){
      p.clubId=targetClub.id;p.starter=false;p.contract=r(1,3);
      G.players.push(p);
      addNews(t('news_left_expired').replace('{name}',p.name).replace('{club}',targetClub.n),'budget');
    }
  });
  G.players=G.players.filter(p=>!_myExpired.includes(p)||p.clubId!==G.myClubId);
  G.fin.salaries=myPl().reduce((s,p)=>s+p.salary,0);
  // AI: dekrementuj i obsłuż wygasłe
  aiRenewContracts();
  // Reset ostrzeżeń o kontraktach na nowy sezon
  G.contractWarned={};
  // ── AWANSE I SPADKI ──────────────────────────────────────────────────
  if(G.leagues&&G.allStandings){
    const promotionNews=[];
    for(let lvl=1;lvl<=8;lvl++){
      const st=[...(G.allStandings[lvl]||[])].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
      if(!st.length)continue;
      // Top 2 awansują (nie ma ligi wyżej niż 1)
      if(lvl>1){
        st.slice(0,2).forEach(s=>{
          const club=G.leagues.find(l=>l.level===lvl)?.clubs.find(c=>c.id===s.cid);
          if(!club)return;
          const upperLg=G.leagues.find(l=>l.level===lvl-1);
          const lowerLg=G.leagues.find(l=>l.level===lvl);
          if(upperLg&&lowerLg){
            lowerLg.clubs=lowerLg.clubs.filter(c=>c.id!==club.id);
            upperLg.clubs.push(club);
            // Popraw OVR zawodników awansującego klubu (tylko AI)
            if(club.id!==G.myClubId){
              G.players.filter(p=>p.clubId===club.id).forEach(p=>{
                ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.min(99,p[a]+r(2,5));});
                p.potential=Math.max(p.potential,calcPotential(p,lvl-1));
              });
            }
            if(club.id===G.myClubId){
              const newLvl=lvl-1;G.myLeague=newLvl;
              myPl().forEach(function(p){p.value=Math.round(calcValue(ovr(p),p.age)*1.10/1000)*1000||p.value;});
              const budgetBonus=LEAGUE_BUDGET[newLvl]-LEAGUE_BUDGET[lvl];
              if(budgetBonus>0)G.budget+=budgetBonus;
              G.fin.sponsors=LEAGUE_SPONSORS[newLvl]||G.fin.sponsors;
              promotionNews.push({mine:true,dir:'up',league:LEAGUE_NAMES[newLvl],val:fmtVal(budgetBonus)});
              G.reputation=Math.min(1000,(G.reputation||10)+50);G.frequency=Math.min(100,(G.frequency||40)+10);
            } else {
              if(lvl===G.myLeague||lvl-1===G.myLeague)promotionNews.push({mine:false,dir:'up',club:club.n,league:LEAGUE_NAMES[lvl-1]});
              // Oznacz klub AI jako awansowany
              if(club.ai)club.ai.promoted=true;
            }
          }
        });
      }
      // Bottom 2 spadają (VIII Liga — reset zamiast spadku)
      if(lvl<8){
        st.slice(-2).forEach(s=>{
          const club=G.leagues.find(l=>l.level===lvl)?.clubs.find(c=>c.id===s.cid);
          if(!club)return;
          const upperLg=G.leagues.find(l=>l.level===lvl);
          const lowerLg=G.leagues.find(l=>l.level===lvl+1);
          if(upperLg&&lowerLg){
            upperLg.clubs=upperLg.clubs.filter(c=>c.id!==club.id);
            lowerLg.clubs.push(club);
            // Osłab zawodników spadającego klubu (tylko AI)
            if(club.id!==G.myClubId){
              G.players.filter(p=>p.clubId===club.id).forEach(p=>{
                ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.max(1,p[a]-r(1,3));});
              });
            }
            if(club.id===G.myClubId){
              const newLvl=lvl+1;G.myLeague=newLvl;
              myPl().forEach(function(p){p.value=Math.round(calcValue(ovr(p),p.age)*0.87/1000)*1000||p.value;});
              G.fin.sponsors=LEAGUE_SPONSORS[newLvl]||G.fin.sponsors;
              promotionNews.push({mine:true,dir:'down',league:LEAGUE_NAMES[newLvl]});
              G.reputation=Math.max(0,(G.reputation||10)-30);G.frequency=Math.max(10,(G.frequency||40)-10);
            } else {
              if(lvl===G.myLeague||lvl+1===G.myLeague)promotionNews.push({mine:false,dir:'down',club:club.n,league:LEAGUE_NAMES[lvl+1]});
              // Oznacz klub AI jako spadkowicz
              if(club.ai)club.ai.relegated=true;
            }
          }
        });
      } else {
        // VII Liga: bottom 2 dostają reset składu
        st.slice(-2).forEach(s=>{
          G.players.filter(p=>p.clubId===s.cid).forEach(p=>{
            G.players=G.players.filter(x=>x.id!==p.id);
          });
          const club=G.leagues.find(l=>l.level===8)?.clubs.find(c=>c.id===s.cid);
          if(club){
            for(let i=0;i<18;i++){const np=mkPlayer(s.cid);np.last=np.name.split(' ')[1]||np.name;np.value=calcValue(ovr(np),np.age);np.salary=calcSalary(np.value,8,ovr(np));G.players.push(np);}
          }
        });
      }
    }
    // Zapewnij każda liga ma 16 drużyn
    G.leagues.forEach(lg=>{
      while(lg.clubs.length>16)lg.clubs.pop();
    });
    // Zaktualizuj CLUBS_B i ALL_CLUBS
    setCurrentLeague(G.leagues,G.myLeague);
    ALL_CLUBS=G.leagues.flatMap(l=>l.clubs);
    G.myClub=ALL_CLUBS.find(c=>c.id===G.myClubId)||G.myClub;
    // Przebuduj standings i harmonogramy
    G.allStandings={};G.allSchedules={};
    G.leagues.forEach(lg=>{
      G.allStandings[lg.level]=lg.clubs.map(c=>({cid:c.id,n:c.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
      G.allSchedules[lg.level]=buildSchedule(G.myClubId,lg.clubs);
    });
    G.standing=G.allStandings[G.myLeague];
    G.schedule=G.allSchedules[G.myLeague];
    // Pokaż news o awansach/spadkach
    if(promotionNews.length){
      // Wiadomość gracza osobno
      const myMsgs=promotionNews.filter(m=>m.mine);
      const aiMsgs=promotionNews.filter(m=>!m.mine);
      myMsgs.forEach(m=>addNews(m.dir==='up'?t('mss_news_promoted').replace('{league}',m.league).replace('{val}',m.val):t('mss_news_relegated').replace('{league}',m.league),'club'));
      // AI awanse/spadki z ligi gracza - jedna zbiorcza wiadomość
      const aiUp=aiMsgs.filter(m=>m.dir==='up');
      const aiDown=aiMsgs.filter(m=>m.dir==='down');
      if(aiUp.length){
        const names=aiUp.map(m=>m.club).join(', ');
        const dest=aiUp[0].league||'';
        addNews(t('mss_news_ai_promoted').replace('{league}',dest).replace('{names}',names),'info');
      }
      if(aiDown.length){
        const names=aiDown.map(m=>m.club).join(', ');
        const dest=aiDown[0].league||'';
        addNews(t('mss_news_ai_relegated').replace('{league}',dest).replace('{names}',names),'info');
      }
    }
  } else {
    G.standing=CLUBS_B.map(c=>({cid:c.id,n:c.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
  }
  assignAITactics();
  // ── AI TRANSFERY SEZONOWE ─────────────────────────────────
  try{ aiTransferSeason(false); }catch(e){ console.warn('aiTransferSeason error:',e); }
  updateHdr();
  notif(t('mss_notif_new_season').replace('{n}',G.season),'ok');
  generateProspects();
  // ── RAPORT ROCZNIKA AKADEMII ─────────────────────────────────────────
  if(G.academy&&G.academy.level>0&&G.season>1){
    var _grads11=myPl().filter(function(p){return p.fromAcademy;});
    if(_grads11.length>0){
      // Znajdź wychowanka z największym wzrostem OVR w ostatnim sezonie
      var _bestGrowth11=null;var _bestGrowthVal11=0;
      var _debutant11=null;
      _grads11.forEach(function(p){
        var _hist11=p.history||[];
        var _lastH11=_hist11.filter(function(h){return h.season===G.season-1&&!h._placeholder&&!h._current;});
        var _prevH11=_hist11.filter(function(h){return h.season===G.season-2&&!h._placeholder&&!h._current;});
        if(_lastH11.length&&_prevH11.length){
          var _g11=(_lastH11[0].ovr||ovr(p))-(_prevH11[0].ovr||0);
          if(_g11>_bestGrowthVal11){_bestGrowthVal11=_g11;_bestGrowth11=p;}
        }
        // Debiutant: miał mecze w ostatnim sezonie, nie miał wcześniej
        var _totalPrev=_hist11.filter(function(h){return h.season<G.season-1;}).reduce(function(s,h){return s+(h.m||0);},0);
        var _lastM=_lastH11.length?(_lastH11[0].m||0):0;
        if(_lastM>0&&_totalPrev===0&&!_debutant11)_debutant11=p;
      });
      var _rMsg=t('mss_academy_report_prefix').replace('{n}',G.season-1);
      if(_bestGrowth11&&_bestGrowthVal11>0)_rMsg+=t('mss_academy_growth').replace('{name}',_bestGrowth11.name).replace('{n}',_bestGrowthVal11);
      if(_debutant11)_rMsg+=t('mss_academy_debut').replace('{name}',_debutant11.name);
      if(_grads11.length>0)_rMsg+=t('mss_academy_count').replace('{n}',_grads11.length);
      if(G.academy.hist)G.academy.hist.push({season:G.season,name:t('mss_academy_report_label'),pos:'',action:_rMsg,isReport:true});
      addNews(_rMsg,'ok');
    }
  }
  genBoardGoals();
  if(!G.news)G.news=[];
  G.news.unshift({msg:t('startnews_summer_window'),type:'budget',week:1,season:G.season,expires:3,action:'transfers',actionLabel:t('tile_transfers')});
  G.news.unshift({msg:t('startnews_sponsor'),type:'club',week:G.week||1,season:G.season,action:'finance_contracts',actionLabel:t('fin_tab_contracts')});
  G.news.unshift({msg:t('startnews_camp'),type:'train',week:1,season:G.season,expires:3,action:'camp',actionLabel:t('startnews_action_camp')});
  G.news.unshift({msg:t('startnews_board_goals').replace('{season}',G.season),type:'club',week:G.week||1,season:G.season,action:'board',actionLabel:t('fin_tab_board')});
  genTransferMarket();G.trBoughtThisWindow=0;G.listedPlayers=[];G.pendingOffers=[];G.indCampUsed=0;renderNews();
}
function fillLeaguesOverview(){
  const el=document.getElementById('tbl-ligi');if(!el)return;
  if(!G||!G.leagues){el.innerHTML='<div style="color:var(--gr);padding:12px;font-size:var(--fs-dense)">'+t('tbl_no_data')+'</div>';return;}
  if(G.allStandings&&G.myLeague)G.allStandings[G.myLeague]=[...G.standing];
  el.innerHTML='';

  G.leagues.slice().sort((a,b)=>a.level-b.level).forEach(lg=>{
    const stRaw=(G.allStandings&&G.allStandings[lg.level])||lg.clubs.map(c=>({cid:c.id,n:c.n,pts:0,gf:0,ga:0,w:0,d:0,l:0,p:0}));
    const st=[...stRaw].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    const isMyLg=lg.level===G.myLeague;
    const myPos=st.findIndex(s=>s.cid===G.myClubId)+1;
    const n=st.length;
    const lvl=lg.level;

    // --- NAGŁÓWEK ---
    const hdr=document.createElement('div');
    hdr.id='lghdr'+lvl;
    hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--gl);'+(isMyLg?'background:#1a2a00;border-left:4px solid var(--am);box-shadow:inset 0 0 20px rgba(255,193,7,0.05);':'background:var(--tb);border-left:3px solid var(--gl);');
    hdr.innerHTML=
      '<div style="font-size:var(--fs-body);color:'+(isMyLg?'var(--am)':'var(--gb)')+'">'+
        (isMyLg?'★ ':'')+lg.name+
        (isMyLg&&myPos?'<span style="font-size:var(--fs-meta);color:var(--gr);margin-left:8px">'+t('tbl_pos_label').replace('{n}',myPos).replace('{total}',n)+'</span>':'')+
      '</div>'+
      '<span id="arr'+lvl+'" style="font-size:var(--fs-body);color:'+(isMyLg?'var(--am)':'var(--gr)')+'">▼</span>';

    // --- DRAWER ---
    const drawer=document.createElement('div');
    drawer.id='lgexp'+lvl;
    drawer.style.cssText='display:none;border-bottom:2px solid '+(isMyLg?'var(--am)':'var(--gl)')+';';

    // --- INLINE SUBTABS ---
    const tabIds=['tabela','wyniki','strzelcy','asysty','oceny','historia'];
    const tabLabels=[t('tbl_tab_table'),t('tbl_tab_results'),t('tbl_tab_scorers'),t('tbl_tab_assists'),t('tbl_tab_ratings'),t('tbl_tab_history')];
    const tabsBar=document.createElement('div');
    tabsBar.style.cssText='display:flex;overflow-x:auto;background:#0a1a0a;border-bottom:1px solid var(--gl);';
    tabIds.forEach((t,i)=>{
      const btn=document.createElement('button');
      btn.style.cssText='flex-shrink:0;background:transparent;border:none;border-right:1px solid var(--gl);color:'+(t==='tabela'?(isMyLg?'var(--am)':'var(--gb)'):'var(--gr)')+';font-weight:700;font-size:var(--fs-h3);padding:9px 8px;cursor:pointer;'+(t==='tabela'?'border-bottom:2px solid '+(isMyLg?'var(--am)':'var(--gb)')+';':'');
      btn.textContent=tabLabels[i];
      btn.id='lgtab'+lvl+'_'+t;
      btn.onclick=()=>lgSwitchTab(lvl,t);
      tabsBar.appendChild(btn);
    });
    drawer.appendChild(tabsBar);

    // --- PANE: TABELA ---
    const paneTabela=document.createElement('div');
    paneTabela.id='lgpane'+lvl+'_tabela';
    const top3=st.slice(0,3);
    const showMy=myPos>3?st[myPos-1]:null;
    // Strefy awansu/spadku — zgodnie z regułą z week-progress.js (top 2 awansują poza ligą I, dolne 2 spadają poza ligą VIII)
    const rowHtmlLg=(s,idx,isMy)=>{
      const gd=(s.gf||0)-(s.ga||0);
      const isUp=lvl>1&&idx<2;
      const isDown=lvl<8&&idx>=n-2;
      const zebra=idx%2===1;
      let rowBg='';
      if(isMy)rowBg='background:#1a2a00;outline:1px solid var(--am);outline-offset:-1px;';
      else if(isUp)rowBg='background:rgba(76,175,80,'+(zebra?'0.17':'0.12')+');';
      else if(isDown)rowBg='background:rgba(244,67,54,'+(zebra?'0.15':'0.10')+');';
      else if(zebra)rowBg='background:#0e230e;';
      return '<tr style="border-bottom:1px solid #0d1f0d;'+rowBg+'cursor:pointer" onclick="openClubModal('+s.cid+')">'+
      '<td style="padding:4px 6px;color:var(--gr)">'+(idx+1)+'</td>'+
      '<td style="color:'+(isMy?'var(--am)':'var(--wh)')+(isMy?';font-weight:700':'')+';vertical-align:middle"><span class="lg-crest-slot" data-cid="'+s.cid+'" style="display:inline-block;vertical-align:middle;margin-right:5px;line-height:0"></span>'+s.n+'</td>'+
      '<td style="text-align:right;color:var(--gr)">'+(s.p||s.m||0)+'</td>'+
      '<td style="text-align:right;color:var(--gb);font-weight:bold">'+(s.pts||0)+'</td>'+
      '<td style="text-align:right;color:var(--gb)">'+(s.w||0)+'</td>'+
      '<td style="text-align:right;color:var(--gr)">'+(s.d||0)+'</td>'+
      '<td style="text-align:right;color:var(--rd)">'+(s.l||0)+'</td>'+
      '<td style="text-align:right;color:var(--gr)">'+(s.gf||0)+'</td>'+
      '<td style="text-align:right;color:var(--gr)">'+(s.ga||0)+'</td>'+
      '<td style="text-align:right;padding-right:6px;color:'+(gd>=0?'var(--gb)':'var(--rd)')+'">'+(gd>0?'+':'')+gd+'</td>'+
    '</tr>';};
    const legendParts=[];
    if(lvl>1)legendParts.push('<span><span style="display:inline-block;width:8px;height:8px;border-radius:1px;margin-right:5px;vertical-align:middle;background:var(--gb)"></span>'+t('tbl_legend_zone_up')+'</span>');
    if(lvl<8)legendParts.push('<span><span style="display:inline-block;width:8px;height:8px;border-radius:1px;margin-right:5px;vertical-align:middle;background:var(--rd)"></span>'+t('tbl_legend_zone_down')+'</span>');
    const legendHtml=legendParts.length?'<div style="display:flex;gap:14px;padding:6px 10px;font-size:var(--fs-dense);color:var(--gr);border-bottom:1px solid var(--gl);background:#0a1a0a">'+legendParts.join('')+'</div>':'';
    let tblHtml=legendHtml+'<div style="overflow-x:auto;max-width:100%"><table style="width:100%;font-size:var(--fs-dense);border-collapse:collapse">'+
      '<thead><tr>'+
        '<th style="padding:4px 6px;color:var(--gr);text-align:left;font-size:var(--fs-dense)">'+t('tbl_col_num')+'</th>'+
        '<th style="color:var(--gr);text-align:left;font-size:var(--fs-dense)">'+t('tbl_col_club')+'</th>'+
        '<th style="color:var(--gr);text-align:right;font-size:var(--fs-dense)">'+t('tbl_col_m')+'</th>'+
        '<th style="color:var(--gr);text-align:right;font-size:var(--fs-dense)">'+t('tbl_col_pts')+'</th>'+
        '<th style="color:var(--gb);text-align:right;font-size:var(--fs-dense)">'+t('tbl_col_w')+'</th>'+
        '<th style="color:var(--gr);text-align:right;font-size:var(--fs-dense)">'+t('tbl_col_d')+'</th>'+
        '<th style="color:var(--rd);text-align:right;font-size:var(--fs-dense)">'+t('tbl_col_l')+'</th>'+
        '<th style="color:var(--gr);text-align:right;font-size:var(--fs-dense)">'+t('tbl_col_gf')+'</th>'+
        '<th style="color:var(--gr);text-align:right;font-size:var(--fs-dense)">'+t('tbl_col_ga')+'</th>'+
        '<th style="color:var(--gr);text-align:right;font-size:var(--fs-dense);padding-right:6px">'+t('tbl_col_gd')+'</th>'+
      '</tr></thead><tbody id="tbody'+lvl+'">'+
      top3.map((s,i)=>rowHtmlLg(s,i,s.cid===G.myClubId)).join('')+
      (showMy?'<tr><td colspan="10" style="padding:1px 6px;color:var(--gr);font-size:var(--fs-dense);text-align:center">···</td></tr>'+rowHtmlLg(showMy,myPos-1,true):'')+
      '</tbody></table></div>'+
      '<div style="text-align:center;padding:4px">'+
        '<button onclick="toggleFullTable('+lvl+')" id="btnfull'+lvl+'" style="font-size:var(--fs-dense);background:var(--gm);border:1px solid var(--gl);color:var(--gr);padding:3px 12px;cursor:pointer">'+t('tbl_full_table')+'</button>'+
      '</div>';
    paneTabela.innerHTML=tblHtml;
    if(typeof pxCrest==='function'){paneTabela.querySelectorAll('.lg-crest-slot').forEach(function(sl){var cid=parseInt(sl.dataset.cid)||0;sl.appendChild(pxCrest(cid,1));});}
    drawer.appendChild(paneTabela);

    // --- PANE: WYNIKI ---
    const paneWyniki=document.createElement('div');
    paneWyniki.id='lgpane'+lvl+'_wyniki';
    paneWyniki.style.cssText='display:none;max-height:70vh;overflow-y:auto;';
    drawer.appendChild(paneWyniki);

    // --- PANE: STRZELCY ---
    const paneStrzelcy=document.createElement('div');
    paneStrzelcy.id='lgpane'+lvl+'_strzelcy';
    paneStrzelcy.style.display='none';
    const lgClubs=new Set(lg.clubs.map(c=>c.id));
    const lgPl=G.players.filter(p=>p.clubId>0&&lgClubs.has(p.clubId));
    const topG=lgPl.filter(p=>p.st&&p.st.g>0).sort((a,b)=>b.st.g-a.st.g).slice(0,10);
    if(!topG.length){
      paneStrzelcy.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:10px 12px">'+t('tbl_no_data')+'</div>';
    } else {
      paneStrzelcy.innerHTML='<div style="font-size:var(--fs-dense);color:var(--am);padding:5px 12px;background:#0d1f0d;border-bottom:1px solid var(--gl)">'+t('tbl_top_scorers')+'</div>'+
        topG.map((p,i)=>{
          const club=ALL_CLUBS.find(c=>c.id===p.clubId);
          const isMy=p.clubId===G.myClubId;
          return '<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-bottom:1px solid #0d1f0d;'+(isMy?'background:#1a2a00;':'')+'cursor:pointer" onclick="showById('+p.id+')">'+
            '<span style="font-size:var(--fs-meta);color:var(--gr);width:18px">'+(i+1)+'</span>'+
            '<div style="flex:1"><div style="font-size:var(--fs-meta);color:'+(isMy?'var(--am)':'var(--wh)')+'">'+p.name+'</div><div style="font-size:var(--fs-dense);color:var(--gr)">'+(club?club.n:'')+'</div></div>'+
            '<span style="font-size:var(--fs-body);color:var(--am);font-weight:bold">'+p.st.g+'⚽</span>'+
          '</div>';
        }).join('');
    }
    drawer.appendChild(paneStrzelcy);

    // --- PANE: ASYSTY ---
    const paneAsysty=document.createElement('div');
    paneAsysty.id='lgpane'+lvl+'_asysty';
    paneAsysty.style.display='none';
    const topA=lgPl.filter(p=>p.st&&p.st.a>0).sort((a,b)=>b.st.a-a.st.a).slice(0,10);
    if(!topA.length){
      paneAsysty.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:10px 12px">'+t('tbl_no_data')+'</div>';
    } else {
      paneAsysty.innerHTML='<div style="font-size:var(--fs-dense);color:var(--am);padding:5px 12px;background:#0d1f0d;border-bottom:1px solid var(--gl)">'+t('tbl_top_assists')+'</div>'+
        topA.map((p,i)=>{
          const club=ALL_CLUBS.find(c=>c.id===p.clubId);
          const isMy=p.clubId===G.myClubId;
          return '<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-bottom:1px solid #0d1f0d;'+(isMy?'background:#1a2a00;':'')+'cursor:pointer" onclick="showById('+p.id+')">'+
            '<span style="font-size:var(--fs-meta);color:var(--gr);width:18px">'+(i+1)+'</span>'+
            '<div style="flex:1"><div style="font-size:var(--fs-meta);color:'+(isMy?'var(--am)':'var(--wh)')+'">'+p.name+'</div><div style="font-size:var(--fs-dense);color:var(--gr)">'+(club?club.n:'')+'</div></div>'+
            '<span style="font-size:var(--fs-body);color:var(--gb);font-weight:bold">'+p.st.a+'🎯</span>'+
          '</div>';
        }).join('');
    }
    drawer.appendChild(paneAsysty);

    // --- PANE: OCENY ---
    const paneOceny=document.createElement('div');
    paneOceny.id='lgpane'+lvl+'_oceny';
    paneOceny.style.display='none';
    const withAvg=lgPl.filter(p=>p.seasonRatings&&p.seasonRatings.length>0).map(p=>({p,avg:Math.round(p.seasonRatings.reduce((s,r)=>s+r,0)/p.seasonRatings.length*10)/10,m:p.seasonRatings.length})).sort((a,b)=>b.avg-a.avg).slice(0,10);
    if(!withAvg.length){
      paneOceny.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:10px 12px">'+t('tbl_no_ratings')+'</div>';
    } else {
      paneOceny.innerHTML='<div style="font-size:var(--fs-dense);color:var(--am);padding:5px 12px;background:#0d1f0d;border-bottom:1px solid var(--gl)">'+t('tbl_top_ratings')+'</div>'+
        withAvg.map(({p,avg,m},i)=>{
          const club=ALL_CLUBS.find(c=>c.id===p.clubId);
          const isMy=p.clubId===G.myClubId;
          const col=avg>=8?'var(--am)':avg>=7?'var(--gb)':'var(--wh)';
          return '<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-bottom:1px solid #0d1f0d;'+(isMy?'background:#1a2a00;':'')+'cursor:pointer" onclick="showById('+p.id+')">'+
            '<span style="font-size:var(--fs-meta);color:var(--gr);width:18px">'+(i+1)+'</span>'+
            '<div style="flex:1"><div style="font-size:var(--fs-meta);color:'+(isMy?'var(--am)':'var(--wh)')+'">'+p.name+'</div><div style="font-size:var(--fs-dense);color:var(--gr)">'+(club?club.n:'')+' • '+m+'M</div></div>'+
            '<span style="font-size:var(--fs-body);color:'+col+';font-weight:bold">'+avg.toFixed(1)+'⭐</span>'+
          '</div>';
        }).join('');
    }
    drawer.appendChild(paneOceny);

    // --- PANE: HISTORIA (lazy render przy kliknięciu) ---
    const paneHistoria=document.createElement('div');
    paneHistoria.id='lgpane'+lvl+'_historia';
    paneHistoria.style.display='none';
    paneHistoria.dataset.lgLvl=lvl;
    paneHistoria.dataset.needsRender='1';
    drawer.appendChild(paneHistoria);

    // --- TOGGLE NAGŁÓWKA ---
    hdr.onclick=()=>{
      const isOpen=drawer.style.display!=='none';
      drawer.style.display=isOpen?'none':'block';
      const arr=document.getElementById('arr'+lvl);
      if(arr)arr.textContent=isOpen?'▼':'▲';
    };

    // Moja liga domyślnie otwarta
    if(isMyLg){
      drawer.style.display='block';
      const arr=document.getElementById('arr'+lvl);
      if(arr)arr.textContent='▲';
    }

    el.appendChild(hdr);
    el.appendChild(drawer);
  });
}

function renderHistoria(lvl,sub){
  const pane=document.getElementById('lgpane'+lvl+'_historia');
  if(!pane)return;
  const lgHistData=(G.lgHist&&G.lgHist[lvl])||[];
  const noBrak='<div style="color:var(--gr);font-size:var(--fs-meta);padding:16px 12px;text-align:center;line-height:1.6">'+t('lg_hist_no_data')+'</div>';

  // sub-tabs bar
  const activeSub=sub||'mistrzowie';
  const subBar='<div style="display:flex;background:#0a1a0a;border-bottom:1px solid var(--gl)">'+
    ['mistrzowie','miejsca','legenda'].map(s=>{
      const lbl=s==='mistrzowie'?t('lg_hist_tab_champions'):s==='miejsca'?t('lg_hist_tab_positions'):t('lg_hist_tab_legend');
      const isOn=s===activeSub;
      return '<button onclick="renderHistoria('+lvl+',\''+s+'\')" style="flex:1;background:transparent;border:none;border-right:1px solid var(--gl);border-bottom:'+(isOn?'2px solid var(--am)':'none')+';color:'+(isOn?'var(--am)':'var(--gr)')+';font-weight:700;font-size:var(--fs-micro);padding:9px 2px;cursor:pointer">'+lbl+'</button>';
    }).join('')+
  '</div>';

  if(!lgHistData.length){
    pane.innerHTML=subBar+noBrak;
    return;
  }


  if(activeSub==='legenda'){renderLegenda(lvl,pane,subBar,lgHistData);return;}
  if(activeSub==='mistrzowie'){
    const rows=lgHistData.slice().reverse().map(h=>{
      const isMy=h.champion&&h.champion.cid===G.myClubId;
      const cid=h.champion?h.champion.cid:null;
      return '<div onclick="'+(cid?'openClubModal('+cid+')':'')+'" style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid #0d1f0d;'+(isMy?'background:#1a2a00;':'')+'cursor:'+(cid?'pointer':'default')+'">'+
        '<span style="font-size:var(--fs-meta);color:var(--gr);width:28px">S'+h.season+'</span>'+
        '<span style="font-size:15px">👑</span>'+
        '<span style="flex:1;font-size:var(--fs-body);color:'+(isMy?'var(--am)':'var(--wh)')+'">'+( h.champion?h.champion.n:'—')+'</span>'+
        '<span style="font-size:var(--fs-meta);color:var(--gr)">'+(h.champion?h.champion.pts+t('lg_hist_pts_suffix'):'')+'</span>'+
      '</div>';
    }).join('');
    pane.innerHTML=subBar+rows;
  } else {
    const allTeams=new Map();
    lgHistData.forEach(h=>{h.table.forEach(r=>{if(!allTeams.has(r.cid))allTeams.set(r.cid,r.n);});});
    const seasons=lgHistData.map(h=>h.season);
    const posColor=(pos,n)=>{
      if(pos===1)return 'background:#7a5c00;color:#ffd54f';
      if(pos===2)return 'background:#3a3a3a;color:#ccc';
      if(pos===3)return 'background:#5c3a1a;color:#d4a574';
      if(pos<=Math.floor(n*0.25))return 'background:#0d2b0d;color:var(--gb)';
      if(pos>n-2)return 'background:#2b0d0d;color:var(--rd)';
      return 'background:#111;color:var(--gr)';
    };
    const lg2=G.leagues&&G.leagues.find(l=>l.level===lvl);
    const teamRows=[...allTeams.entries()].map(([cid,name])=>{
      const isMy=cid===G.myClubId;
      const cells=lgHistData.map(h=>{
        const row=h.table.find(r=>r.cid===cid);
        const n=h.table.length;
        if(!row)return '<td style="width:24px;height:20px;text-align:center;font-size:var(--fs-dense);color:#333;border:1px solid #0d1f0d">—</td>';
        const style=posColor(row.pos,n);
        const label=row.pos===1?'👑':row.pos>n-2?'↓'+row.pos:String(row.pos);
        return '<td style="width:24px;height:20px;text-align:center;font-size:var(--fs-dense);font-weight:bold;border:1px solid #0a0a0a;'+style+'">'+label+'</td>';
      }).join('');
      return '<tr onclick="openClubModal('+cid+')" style="cursor:pointer;'+(isMy?'outline:1px solid var(--am);':'')+'">'+
        '<td style="padding:2px 8px;font-size:var(--fs-meta);color:'+(isMy?'var(--am)':'var(--wh)')+';white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis;border-bottom:1px solid #0d1f0d">'+name+'</td>'+
        cells+
      '</tr>';
    }).join('');
    const seasonHdrs=seasons.map(s=>'<th onclick="showLgSeasonTable('+lvl+','+s+')" title="'+t('lg_season_table_title').replace('{n}',s)+'" style="width:26px;font-weight:700;font-size:var(--fs-h3);color:var(--am);font-weight:normal;text-align:center;padding:3px 0;cursor:pointer;background:#0a1a0a;border:1px solid var(--gl);border-bottom:2px solid var(--am)">S'+s+'</th>').join('');
    const legend=
      '<div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;border-top:1px solid var(--gl)">'+
        '<span style="font-size:var(--fs-dense);color:var(--gr)">'+t('lg_hist_legend_label')+'</span>'+
        '<span style="background:#7a5c00;color:#ffd54f;font-size:var(--fs-dense);padding:1px 5px">'+t('lg_hist_legend_champion')+'</span>'+
        '<span style="background:#3a3a3a;color:#ccc;font-size:var(--fs-dense);padding:1px 5px">'+t('lg_hist_legend_2nd')+'</span>'+
        '<span style="background:#5c3a1a;color:#d4a574;font-size:var(--fs-dense);padding:1px 5px">'+t('lg_hist_legend_3rd')+'</span>'+
        '<span style="background:#0d2b0d;color:var(--gb);font-size:var(--fs-dense);padding:1px 5px">'+t('lg_hist_legend_top25')+'</span>'+
        '<span style="background:#2b0d0d;color:var(--rd);font-size:var(--fs-dense);padding:1px 5px">'+t('lg_hist_legend_relegation')+'</span>'+
      '</div>';
    pane.innerHTML=subBar+
      '<div style="font-size:var(--fs-dense);color:var(--am);padding:5px 12px;background:#0a1a0a;border-bottom:1px solid var(--gl)">'+t('lg_hist_click_hint')+'</div>'+
      '<div style="overflow-x:auto;padding:4px 8px">'+
        '<table style="border-collapse:collapse">'+
          '<thead><tr><th style="text-align:left;padding:2px 8px;font-size:var(--fs-dense);color:var(--gr);font-weight:normal">'+t('lg_hist_team_col')+'</th>'+seasonHdrs+'</tr></thead>'+
          '<tbody>'+teamRows+'</tbody>'+
        '</table>'+
      '</div>'+legend;
  }
}

function showLgSeasonTable(lvl,season){
  if(!G||!G.lgHist||!G.lgHist[lvl])return;
  const hist=G.lgHist[lvl].find(h=>h.season===season);
  if(!hist||!hist.table||!hist.table.length)return;
  const myId=G.myClubId;
  const lgName=(typeof LEAGUE_NAMES!=='undefined'?LEAGUE_NAMES[lvl]:t('league_fallback'))+' — '+t('hdr_season')+' '+season;
  const rows=hist.table.map(r=>{
    const isMy=parseInt(r.cid)===parseInt(myId);
    const posCol=r.pos===1?'var(--am)':r.pos<=3?'var(--gb)':'var(--wh)';
    return '<tr style="border-bottom:1px solid #0d1f0d;'+(isMy?'background:#0d2b0d;outline:1px solid var(--am)':'')+'" onclick="var m=document.getElementById(\'modal-lg-season-table\');if(m)m.remove();openClubModal('+r.cid+')" style="cursor:pointer">'+
      '<td style="padding:4px 3px;color:'+posCol+';font-size:var(--fs-meta);text-align:center">'+r.pos+'</td>'+
      '<td style="padding:4px 3px;color:'+(isMy?'var(--am)':'var(--wh)')+';font-size:var(--fs-meta);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+r.n+'</td>'+
      '<td style="padding:4px;text-align:center;font-size:var(--fs-meta);color:var(--wh)">'+(r.p||((r.w||0)+(r.d||0)+(r.l||0)))+'</td>'+
      '<td style="padding:4px;text-align:center;font-size:var(--fs-meta);color:var(--gb)">'+(r.w||0)+'</td>'+
      '<td style="padding:4px;text-align:center;font-size:var(--fs-meta);color:var(--gr)">'+(r.d||0)+'</td>'+
      '<td style="padding:4px;text-align:center;font-size:var(--fs-meta);color:var(--rd)">'+(r.l||0)+'</td>'+
      '<td style="padding:4px;text-align:center;font-size:var(--fs-meta);color:var(--gb)">'+(r.gf||0)+'</td>'+
      '<td style="padding:4px;text-align:center;font-size:var(--fs-meta);color:var(--rd)">'+(r.ga||0)+'</td>'+
      '<td style="padding:4px;text-align:center;font-size:var(--fs-meta);color:var(--am);font-weight:bold">'+(r.pts||0)+'</td>'+
    '</tr>';
  }).join('');
  let modal=document.getElementById('modal-lg-season-table');
  if(!modal){
    modal=document.createElement('div');
    modal.id='modal-lg-season-table';
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.onclick=function(e){if(e.target===modal)modal.remove();};
    document.body.appendChild(modal);
  }
  modal.innerHTML=
    '<div style="background:var(--gd);border:2px solid var(--gl);padding:14px;max-width:95vw;width:400px;max-height:85vh;overflow-y:auto;position:relative">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
        '<span style="font-weight:700;font-size:var(--fs-micro);color:var(--am)">'+lgName+'</span>'+
        '<span onclick="document.getElementById(\'modal-lg-season-table\').remove()" style="font-size:var(--fs-body);color:var(--gr);cursor:pointer;padding:2px 6px;border:1px solid var(--gl)">✕</span>'+
      '</div>'+
      '<table style="width:100%;border-collapse:collapse">'+
        '<thead><tr style="border-bottom:1px solid var(--gl);color:var(--gr)">'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:center">#</th>'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:left">'+t('tbl_col_club')+'</th>'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:center">'+t('tbl_col_m')+'</th>'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:center;color:var(--gb)">'+t('tbl_col_w')+'</th>'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:center">'+t('tbl_col_d')+'</th>'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:center;color:var(--rd)">'+t('tbl_col_l')+'</th>'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:center">'+t('tbl_col_gf')+'</th>'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:center">'+t('tbl_col_ga')+'</th>'+
          '<th style="font-size:var(--fs-dense);font-weight:normal;padding:3px;text-align:center;color:var(--am)">'+t('tbl_col_pts')+'</th>'+
        '</tr></thead>'+
        '<tbody>'+rows+'</tbody>'+
      '</table>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);text-align:center;margin-top:8px;border-top:1px solid var(--gl);padding-top:6px">'+
        t('lg_close_hint')+
      '</div>'+
    '</div>';
}

function renderLegenda(lvl,pane,subBar,lgHistData){
  // ── SEKCJA 1: LIGA — Tabela wszech czasów ──────────────────────────
  const allClubs=new Map();
  lgHistData.forEach(h=>{
    h.table.forEach(r=>{
      if(!allClubs.has(r.cid))allClubs.set(r.cid,{cid:r.cid,n:r.n,pkt:0,gf:0,ga:0,s:0,titles:0});
      const c=allClubs.get(r.cid);
      c.pkt+=r.pts||0; c.gf+=r.gf||0; c.ga+=r.ga||0; c.s++;
      if(h.champion&&h.champion.cid===r.cid)c.titles++;
    });
  });
  const ligaRanking=[...allClubs.values()].sort((a,b)=>b.pkt-a.pkt||(b.gf-b.ga)-(a.gf-a.ga));
  const ligaRows=ligaRanking.map((c,i)=>{
    const isMy=c.cid===G.myClubId;
    const pos=i+1;
    const posCol=pos===1?'var(--am)':pos<=3?'var(--gb)':'var(--wh)';
    return '<tr style="border-bottom:1px solid #0d1f0d;cursor:pointer;'+(isMy?'background:#0d2b0d;outline:1px solid var(--am);':'')+'" onclick="openClubModal('+c.cid+')">'+
      '<td style="padding:4px 2px;color:'+posCol+';font-size:var(--fs-meta)">'+pos+'</td>'+
      '<td style="padding:4px 2px;color:'+(isMy?'var(--am)':'var(--wh)')+';font-size:var(--fs-meta);max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+c.n+'</td>'+
      '<td style="padding:4px;text-align:center;color:var(--am);font-size:var(--fs-meta);font-weight:bold">'+c.pkt+'</td>'+
      '<td style="padding:4px;text-align:center;color:var(--gb);font-size:var(--fs-meta)">'+c.gf+'</td>'+
      '<td style="padding:4px;text-align:center;color:var(--rd);font-size:var(--fs-meta)">'+c.ga+'</td>'+
      '<td style="padding:4px;text-align:center;font-size:var(--fs-meta);color:var(--am)">'+( c.titles?c.titles:'—')+'</td>'+
    '</tr>';
  }).join('');
  const secLiga=
    '<div style="padding:10px 12px 4px">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
        '<span style="font-size:14px">🏆</span>'+
        '<span style="font-weight:700;font-size:var(--fs-h3);color:var(--am)">'+t('lg_alltime_table_title')+'</span>'+
      '</div>'+
      '<div style="overflow-x:auto">'+
        '<table style="width:100%;border-collapse:collapse">'+
          '<thead><tr style="border-bottom:1px solid var(--gl)">'+
            '<th style="text-align:left;padding:3px 2px;font-size:var(--fs-dense);color:var(--gr);font-weight:normal">#</th>'+
            '<th style="text-align:left;padding:3px 2px;font-size:var(--fs-dense);color:var(--gr);font-weight:normal">'+t('tbl_col_club')+'</th>'+
            '<th style="padding:3px 4px;font-size:var(--fs-dense);color:var(--am);font-weight:normal">'+t('tbl_col_pts')+'</th>'+
            '<th style="padding:3px 4px;font-size:var(--fs-dense);color:var(--gb);font-weight:normal">'+t('tbl_col_gf')+'</th>'+
            '<th style="padding:3px 4px;font-size:var(--fs-dense);color:var(--rd);font-weight:normal">'+t('tbl_col_ga')+'</th>'+
            '<th style="padding:3px 4px;font-size:var(--fs-dense);color:var(--gr);font-weight:normal">🏆</th>'+
          '</tr></thead>'+
          '<tbody>'+ligaRows+'</tbody>'+
        '</table>'+
      '</div>'+
    '</div>';

  // ── SEKCJA 2: KLUB — Ranking prestiżu ─────────────────────────────
  const myClubId=G.myClubId;
  const leagueTitles=(G.trophies||[]).filter(t=>t.type==='league').length;
  const specialTrophies=(G.trophies||[]).filter(t=>t.type==='special').length;
  const promotions=(G.cHist||[]).filter((h,i,arr)=>{ const next=arr[i+1]; return next&&next.leagueLevel<h.leagueLevel; }).length;
  const stadiumCap=(G.stadium&&G.stadium.capacity)||0;
  const prestige=leagueTitles*100+promotions*30+specialTrophies*20+Math.floor(stadiumCap/100);
  const maxPrestige=Math.max(900,prestige+100);
  const barPct=Math.min(100,Math.round((prestige/maxPrestige)*100));
  // Ranking prestiżu wszystkich klubów z lgHist tej ligi
  const klubRanking=[...allClubs.values()].map(c=>{
    const t=c.cid===myClubId?leagueTitles:c.titles;
    const p=t*100+Math.floor(c.pkt/10);
    return {cid:c.cid,n:c.n,p};
  }).sort((a,b)=>b.p-a.p);
  const myKlubPos=klubRanking.findIndex(c=>c.cid===myClubId)+1||'?';
  const myPrestigeBar=
    '<div style="background:var(--tb);height:8px;border-radius:2px;overflow:hidden;margin:6px 0 2px">'+
      '<div style="width:'+barPct+'%;height:100%;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:2px"></div>'+
    '</div>'+
    '<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense);color:var(--gr)">'+
      '<span>'+t('lg_prestige_pts_label').replace('{n}',prestige)+'</span><span>'+t('lg_prestige_max_label').replace('{n}',maxPrestige)+'</span>'+
    '</div>';
  const klubMiniRows=klubRanking.slice(0,5).map((c,i)=>{
    const isMy=c.cid===myClubId;
    const barW=Math.round((c.p/(klubRanking[0].p||1))*100);
    return '<div onclick="openClubModal('+c.cid+')" style="margin-bottom:6px;cursor:pointer">'+
      '<div style="display:flex;justify-content:space-between;font-size:var(--fs-meta);margin-bottom:2px">'+
        '<span style="color:'+(isMy?'var(--am)':'var(--wh)')+'">'+'<span style="color:'+(i===0?'var(--am)':'var(--gr)')+';font-weight:700;font-size:var(--fs-h3);margin-right:4px">#'+(i+1)+'</span>'+c.n+'</span>'+
        '<span style="color:#a78bfa">'+c.p+t('lg_hist_pts_suffix')+'</span>'+
      '</div>'+
      '<div style="background:var(--tb);height:4px;border-radius:2px;overflow:hidden">'+
        '<div style="width:'+barW+'%;height:100%;background:'+(isMy?'linear-gradient(90deg,#7c3aed,#a78bfa)':'var(--gl)')+';border-radius:2px"></div>'+
      '</div>'+
    '</div>';
  }).join('');
  const secKlub=
    '<div style="padding:10px 12px 4px;border-top:1px solid var(--gl)">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
        '<span style="font-size:var(--fs-body)">⭐</span>'+
        '<span style="font-weight:700;font-size:var(--fs-h3);color:#a78bfa">'+t('lg_prestige_title')+'</span>'+
      '</div>'+
      '<div style="background:#0d2b0d;border:1px solid var(--gb);border-left:4px solid #a78bfa;padding:10px 12px;margin-bottom:10px">'+
        '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);margin-bottom:8px">'+G.myClub.n+' • #'+myKlubPos+' / '+klubRanking.length+'</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:var(--fs-meta);margin-bottom:8px">'+
          '<div><div style="color:var(--gr)">'+t('lg_prestige_trophies')+'</div><div style="color:#a78bfa">'+leagueTitles+'</div></div>'+
          '<div><div style="color:var(--gr)">'+t('lg_prestige_promotions')+'</div><div style="color:#a78bfa">'+promotions+'</div></div>'+
          '<div><div style="color:var(--gr)">'+t('lg_prestige_achievements')+'</div><div style="color:#a78bfa">'+specialTrophies+'</div></div>'+
          '<div><div style="color:var(--gr)">'+t('lg_prestige_stadium')+'</div><div style="color:#a78bfa">'+stadiumCap.toLocaleString()+'</div></div>'+
          '<div><div style="color:var(--gr)">'+t('lg_prestige_score')+'</div><div style="color:#a78bfa">'+prestige+t('lg_hist_pts_suffix')+'</div></div>'+
        '</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px;line-height:1.4">'+
          t('lg_prestige_formula')+
        '</div>'+
        myPrestigeBar+
      '</div>'+
      '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);margin-bottom:8px">'+t('lg_prestige_top5')+'</div>'+
      klubMiniRows+
    '</div>';

  // ── SEKCJA 3: ŚWIAT — Ranking historyczny ─────────────────────────
  // Agreguje wszystkie ligi z G.lgHist i liczy łączne punkty per klub
  const worldMap=new Map();
  if(G.lgHist){
    Object.entries(G.lgHist).forEach(([lv,seasons])=>{
      const ligaName=typeof LEAGUE_NAMES!=='undefined'?LEAGUE_NAMES[parseInt(lv)]||t('league_n').replace('{n}',lv):t('league_n').replace('{n}',lv);
      seasons.forEach(h=>{
        h.table.forEach(r=>{
          if(!worldMap.has(r.cid))worldMap.set(r.cid,{cid:r.cid,n:r.n,pkt:0,titles:0,topLeague:parseInt(lv),liga:ligaName});
          const w=worldMap.get(r.cid);
          w.pkt+=r.pts||0;
          if(h.champion&&h.champion.cid===r.cid)w.titles++;
          if(parseInt(lv)<w.topLeague){w.topLeague=parseInt(lv);w.liga=ligaName;}
        });
      });
    });
  }
  // Uzupełnij własny klub jeśli nie pojawia się w lgHist
  if(!worldMap.has(myClubId))worldMap.set(myClubId,{cid:myClubId,n:G.myClub.n,pkt:prestige,titles:leagueTitles,topLeague:G.myLeague||8,liga:typeof LEAGUE_NAMES!=='undefined'?LEAGUE_NAMES[G.myLeague||8]:t('lg_fallback_your_league')});
  const worldRanking=[...worldMap.values()].sort((a,b)=>(b.titles*100+b.pkt)-(a.titles*100+a.pkt));
  const topW=worldRanking[0]?(worldRanking[0].titles*100+worldRanking[0].pkt)||1:1;
  const worldRows=worldRanking.slice(0,10).map((c,i)=>{
    const isMy=c.cid===myClubId;
    const score=c.titles*100+c.pkt;
    const barW=Math.round((score/topW)*100);
    return '<div onclick="openClubModal('+c.cid+')" style="margin-bottom:8px;cursor:pointer;'+(isMy?'background:#0d2b0d;padding:4px 6px;border-left:3px solid var(--gb);':'')+'">'+
      '<div style="display:flex;justify-content:space-between;font-size:var(--fs-meta);margin-bottom:2px">'+
        '<span style="color:'+(isMy?'var(--am)':'var(--wh)')+'">'+'<span style="font-weight:700;font-size:var(--fs-h3);color:'+(i===0?'var(--am)':'var(--gr)')+';margin-right:4px">#'+(i+1)+'</span>'+c.n+'</span>'+
        '<span style="color:var(--gb)">🏆 '+c.titles+'</span>'+
      '</div>'+
      '<div style="background:var(--tb);height:5px;border-radius:2px;overflow:hidden;margin-bottom:2px">'+
        '<div style="width:'+barW+'%;height:100%;background:'+(i===0?'linear-gradient(90deg,#b45309,var(--am))':isMy?'linear-gradient(90deg,#2d6b2d,var(--gb))':'var(--gl)')+';border-radius:2px"></div>'+
      '</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+c.liga+'</div>'+
    '</div>';
  }).join('');
  const secSwiat=
    '<div style="padding:10px 12px 12px;border-top:1px solid var(--gl)">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
        '<span style="font-size:14px">🌍</span>'+
        '<span style="font-weight:700;font-size:var(--fs-h3);color:var(--gb)">'+t('lg_world_ranking_title')+'</span>'+
      '</div>'+
      worldRows+
    '</div>';

  pane.innerHTML=subBar+
    '<div style="overflow-y:auto;max-height:calc(100vh - 200px)">'+
      secLiga+secKlub+secSwiat+
    '</div>';
}

function lgRefreshWyniki(lvl){
  const pane=document.getElementById('lgpane'+lvl+'_wyniki');
  if(!pane||!G)return;
  const sched=(G.allSchedules&&G.allSchedules[lvl])||[];
  if(!sched.length){
    pane.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:10px 12px">'+t('tbl_no_data')+'</div>';
    return;
  }
  const isMyLg=lvl===G.myLeague;
  const byRnd={};
  sched.forEach(m=>{if(!byRnd[m.rnd])byRnd[m.rnd]=[];byRnd[m.rnd].push(m);});
  const allRnds=Object.keys(byRnd).map(Number).sort((a,b)=>a-b);
  const curRnd=isMyLg?G.round:(Math.max(0,...sched.filter(m=>m.done).map(m=>m.rnd))+1);

  let html='<div id="lgwrap'+lvl+'" style="font-size:var(--fs-dense);">';

  allRnds.forEach(rnd=>{
    const matches=byRnd[rnd];
    const isDone=matches.every(m=>m.done);
    const isCurrent=rnd===curRnd&&!isDone;

    let hdrBg,hdrColor,rndIcon,rndBadge;
    if(isCurrent){
      hdrBg='#1a2d00';hdrColor='var(--am)';rndIcon='▶ ';rndBadge='<span style="color:var(--am);font-size:var(--fs-dense)">'+t('lg_round_now')+'</span>';
    } else if(isDone){
      hdrBg='#0d1f0d';hdrColor='var(--gr)';rndIcon='';rndBadge='<span style="color:var(--gr);font-size:7px">✓</span>';
    } else {
      hdrBg='#0a1a0a';hdrColor='#2a4a2a';rndIcon='· ';rndBadge='<span style="color:#1a3a1a;font-size:var(--fs-dense)">—</span>';
    }

    const anchorId=isCurrent?'lgcurr'+lvl:'';
    html+='<div'+(anchorId?' id="'+anchorId+'"':'')+'>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 12px;background:'+hdrBg+';border-bottom:1px solid var(--gl);border-top:1px solid #0a1a0a;position:sticky;top:0;z-index:2;">'+
        '<span style="color:'+hdrColor+'">'+rndIcon+t('lg_round_label').replace('{n}',rnd)+'</span>'+
        rndBadge+
      '</div>';

    matches.forEach(m=>{
      const hc=ALL_CLUBS.find(c=>c.id===m.h);
      const ac=ALL_CLUBS.find(c=>c.id===m.a);
      const hn=(hc||{n:'?'}).n;
      const an=(ac||{n:'?'}).n;
      const isMy=m.h===G.myClubId||m.a===G.myClubId;
      const myWin=isMy&&((m.h===G.myClubId&&m.hg>m.ag)||(m.a===G.myClubId&&m.ag>m.hg));
      const myDraw=isMy&&m.done&&m.hg===m.ag;
      const scoreOrVs=m.done?(m.hg+'-'+m.ag):'vs';

      let rowBg,scoreCol,borderLeft,cursor='',onclk='';
      if(isMy){
        rowBg=m.done?(myWin?'#0d2b0d':myDraw?'#1a1a00':'#2b0d0d'):(isCurrent?'#111d00':'#0c160c');
        scoreCol=m.done?'var(--am)':'#556655';
        borderLeft=m.done?(myWin?'border-left:3px solid var(--gb);':myDraw?'border-left:3px solid var(--am);':'border-left:3px solid var(--rd);'):'border-left:3px solid #3a6a3a;';
        if(m.done){
          const mHistIdx=(G.mHist||[]).findIndex(x=>x.rnd===rnd&&x.season===G.season&&((x.hn===hn)||(x.an===hn)));
          if(mHistIdx>=0){onclk=' onclick="showMatchDetail('+mHistIdx+')"';cursor='cursor:pointer;';}
        }
      } else {
        rowBg=isDone?'':(isCurrent?'':'');
        scoreCol=m.done?'var(--gb)':'#1a3a1a';
        borderLeft='border-left:3px solid transparent;';
      }

      const hColor=isMy&&m.h===G.myClubId?'var(--am)':isMy?'var(--wh)':(isDone?'var(--wh)':'#3a5a3a');
      const aColor=isMy&&m.a===G.myClubId?'var(--am)':isMy?'var(--wh)':(isDone?'var(--wh)':'#3a5a3a');

      html+='<div'+onclk+' style="'+cursor+borderLeft+'display:grid;grid-template-columns:1fr 40px 1fr;gap:4px;padding:'+(isMy?'5px':'3px')+' 12px;border-bottom:1px solid #0a1a0a;background:'+rowBg+';">'+
        '<div style="text-align:right;color:'+hColor+'">'+hn+'</div>'+
        '<div style="text-align:center;color:'+scoreCol+'">'+scoreOrVs+'</div>'+
        '<div style="text-align:left;color:'+aColor+'">'+an+'</div>'+
      '</div>';
    });

    html+='</div>';
  });

  html+='</div>';
  pane.innerHTML=html;

  // Auto-scroll to current round within the scrollable pane
  setTimeout(()=>{
    const currEl=document.getElementById('lgcurr'+lvl);
    if(currEl&&pane){
      const paneTop=pane.getBoundingClientRect().top;
      const elTop=currEl.getBoundingClientRect().top;
      pane.scrollTop+=(elTop-paneTop)-8;
    }
  },80);
}

function lgSwitchTab(lvl,tab){
  const tabs=['tabela','wyniki','strzelcy','asysty','oceny','historia'];
  const isMyLg=G&&lvl===G.myLeague;
  tabs.forEach(t=>{
    const pane=document.getElementById('lgpane'+lvl+'_'+t);
    const btn=document.getElementById('lgtab'+lvl+'_'+t);
    if(pane)pane.style.display=(t===tab)?'block':'none';
    if(btn){
      btn.style.color=(t===tab)?(isMyLg?'var(--am)':'var(--gb)'):'var(--gr)';
      btn.style.borderBottom=(t===tab)?'2px solid '+(isMyLg?'var(--am)':'var(--gb)'):'none';
    }
  });
  if(tab==='historia')renderHistoria(lvl);
  if(tab==='wyniki')lgRefreshWyniki(lvl);
}

function toggleFullTable(lvl){
  if(!G)return;
  const stRaw=(G.allStandings&&G.allStandings[lvl])||[];
  const st=[...stRaw].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
  const tbody=document.getElementById('tbody'+lvl);
  const btn=document.getElementById('btnfull'+lvl);
  if(!tbody||!btn)return;
  const isExpanded=btn.dataset.expanded==='1';
  const n=st.length;
  const rowHtml=(s,i,isMy)=>{
    const gd=(s.gf||0)-(s.ga||0);
    const isUp=lvl>1&&i<2;
    const isDown=lvl<8&&i>=n-2;
    const zebra=i%2===1;
    let rowBg='';
    if(isMy)rowBg='background:#1a2a00;outline:1px solid var(--am);outline-offset:-1px;';
    else if(isUp)rowBg='background:rgba(76,175,80,'+(zebra?'0.17':'0.12')+');';
    else if(isDown)rowBg='background:rgba(244,67,54,'+(zebra?'0.15':'0.10')+');';
    else if(zebra)rowBg='background:#0e230e;';
    return '<tr style="border-bottom:1px solid #0d1f0d;'+rowBg+'cursor:pointer" onclick="openClubModal('+s.cid+')">'+
    '<td style="padding:4px 6px;color:var(--gr)">'+(i+1)+'</td>'+
    '<td style="color:'+(isMy?'var(--am)':'var(--wh)')+(isMy?';font-weight:700':'')+';vertical-align:middle"><span class="lg-crest-slot" data-cid="'+s.cid+'" style="display:inline-block;vertical-align:middle;margin-right:5px;line-height:0"></span>'+s.n+'</td>'+
    '<td style="text-align:right;color:var(--gr)">'+(s.p||s.m||0)+'</td>'+
    '<td style="text-align:right;color:var(--gb);font-weight:bold">'+(s.pts||0)+'</td>'+
    '<td style="text-align:right;color:var(--gb)">'+(s.w||0)+'</td>'+
    '<td style="text-align:right;color:var(--gr)">'+(s.d||0)+'</td>'+
    '<td style="text-align:right;color:var(--rd)">'+(s.l||0)+'</td>'+
    '<td style="text-align:right;color:var(--gr)">'+(s.gf||0)+'</td>'+
    '<td style="text-align:right;color:var(--gr)">'+(s.ga||0)+'</td>'+
    '<td style="text-align:right;padding-right:6px;color:'+(gd>=0?'var(--gb)':'var(--rd)')+'">'+(gd>0?'+':'')+gd+'</td>'+
  '</tr>';};
  function _injectCrests(container){if(typeof pxCrest==='function'){container.querySelectorAll('.lg-crest-slot').forEach(function(sl){if(!sl.firstChild){var cid=parseInt(sl.dataset.cid)||0;sl.appendChild(pxCrest(cid,1));}});}}
  if(isExpanded){
    const myPos=st.findIndex(s=>s.cid===G.myClubId)+1;
    const top3=st.slice(0,3);
    const showMy=myPos>3?st[myPos-1]:null;
    tbody.innerHTML=top3.map((s,i)=>rowHtml(s,i,s.cid===G.myClubId)).join('')+
      (showMy?'<tr><td colspan="10" style="padding:1px 6px;color:var(--gr);font-size:var(--fs-dense)">···</td></tr>'+rowHtml(showMy,myPos-1,true):'');
    _injectCrests(tbody);
    btn.textContent=t('tbl_full_table');
    btn.dataset.expanded='0';
  } else {
    tbody.innerHTML=st.map((s,i)=>rowHtml(s,i,s.cid===G.myClubId)).join('');
    _injectCrests(tbody);
    btn.textContent=t('lg_btn_collapse_table');
    btn.dataset.expanded='1';
  }
}
// tblMainTab / tblTab zastąpione przez lgSwitchTab (Wariant C)
// fillWyniki przeniesiona do fillLeaguesOverview (inline per liga)

// fillOceny przeniesiona do fillLeaguesOverview (inline per liga)

function handleTableClick(e){
  const tr=e.target.closest('tr[data-cid]');
  if(tr){
    const cid=parseInt(tr.getAttribute('data-cid'));
    if(cid&&!isNaN(cid))openClubModal(cid);
  }
}
function fillTable(){
  if(!G)return;
  if(G.allStandings&&G.myLeague)G.allStandings[G.myLeague]=[...G.standing];
  fillLeaguesOverview();
  // Auto-scroll + auto-expand do mojej ligi po opóźnieniu dłuższym niż animacja otwarcia panelu (0.2s),
  // żeby scrollIntoView nie łapało elementu w trakcie wjeżdżania i nie przewijało strony w poziomie
  setTimeout(()=>{
    const myHdr=document.getElementById('lghdr'+G.myLeague);
    const myPanel=document.getElementById('lgexp'+G.myLeague);
    if(myPanel&&myPanel.style.display==='none'){
      myPanel.style.display='block';
      const arr=document.getElementById('arr'+G.myLeague);
      if(arr)arr.textContent='▲';
    }
    if(myHdr){
      myHdr.scrollIntoView({behavior:'smooth',block:'start',inline:'nearest'});
    }
  },220);
}

// ── TRANSFER WINDOW SYSTEM ──────────────────────────────────────────────
function isTransferWindow(){
  if(!G)return false;
  // Okno letnie: tygodnie 1-2
  if(G.week<=2)return{open:true,type:'LETNIE',weeksLeft:3-G.week};
  // Okno zimowe: tydzień po kolejce 15 (round=16)
  if(G.round===16||G.round===17)return{open:true,type:'ZIMOWE',weeksLeft:18-G.round};
  // Oblicz następne okno
  if(G.round<16)return{open:false,next:'zimowe',eta:16-G.round};
  return{open:false,next:'letnie (nowy sezon)',eta:null};
}
// DEMAND system
