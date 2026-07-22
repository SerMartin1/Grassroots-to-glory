function finTab(tab,btn){
  document.querySelectorAll('#p-finance .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['przeglad','kontrakty','historia','sezony','zarzad'].forEach(tr=>{
    const el=document.getElementById('fin-'+tr);if(el)el.classList.remove('on');
  });
  const el=document.getElementById('fin-'+tab);if(el)el.classList.add('on');
  if(tab==='przeglad')renderFinPrzeglad();
  else if(tab==='kontrakty')renderFinKontrakty();
  else if(tab==='historia')renderFinHistoria();
  else if(tab==='sezony')renderFinSezony();
  else if(tab==='zarzad')renderFinZarzad();
}

function renderFinZarzad(){
  const el=document.getElementById('fin-zarzad');if(!el||!G)return;
  if(!G.board)G.board={mainGoal:null,optGoal:null,goalsHistory:[]};
  const b=G.board;
  // --- sub-tabs wewnątrz zarząd ---
  const activeInner=el.dataset.inner||'cele';
  const mkTab=(id,label)=>`<button onclick="finZarzadInner('${id}',this)" style="flex:1;padding:8px 4px;background:none;border:none;border-bottom:2px solid ${activeInner===id?'var(--am)':'transparent'};font-weight:700;font-size:var(--fs-micro);color:${activeInner===id?'var(--am)':'var(--gr)'};cursor:pointer">${label}</button>`;
  el.innerHTML=`<div style="display:flex;border-bottom:1px solid var(--gl);margin-bottom:10px">${mkTab('cele',t('fin_board_goals'))}${mkTab('historia',t('fin_tab_history'))}</div><div id="fin-zarzad-inner" style="padding:0 2px"></div>`;
  renderFinZarzadInner(activeInner);
}
function finZarzadInner(tab,btn){
  const el=document.getElementById('fin-zarzad');if(!el)return;
  el.dataset.inner=tab;
  el.querySelectorAll('button').forEach(b=>{b.style.borderBottomColor='transparent';b.style.color='var(--gr)';});
  btn.style.borderBottomColor='var(--am)';btn.style.color='var(--am)';
  renderFinZarzadInner(tab);
}
function renderFinZarzadInner(tab){
  // Tymczasowo podmień target dla renderBoardCele/Historia na fin-zarzad-inner
  const inner=document.getElementById('fin-zarzad-inner');if(!inner)return;
  if(tab==='cele'){
    // Użyj board-cele jako bufor, potem przepisz
    const buf=document.getElementById('board-cele');
    if(!buf){inner.innerHTML='<div style="color:var(--gr);padding:12px;font-size:var(--fs-body)">'+t('fin_err_no_board_buffer')+'</div>';return;}
    renderBoardCele();
    inner.innerHTML=buf.innerHTML;
  } else {
    const buf=document.getElementById('board-historia');
    if(!buf){inner.innerHTML='<div style="color:var(--gr);padding:12px;font-size:var(--fs-body)">'+t('fin_err_no_board_hist_buffer')+'</div>';return;}
    renderBoardHistoria();
    inner.innerHTML=buf.innerHTML;
  }
}

function renderFinPrzeglad(){
  const el=document.getElementById('fin-przeglad');if(!el||!G)return;
  const inc=calcWeeklyIncome();
  const lvl=G.myLeague||8;
  const pos=[...G.standing].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)).findIndex(s=>parseInt(s.cid)===parseInt(G.myClubId))+1;
  const bonusArr=(FIN.bonus&&FIN.bonus[lvl])||[];
  const expBonus=bonusArr[pos-1]||0;
  const sponsorInc=(G.contracts&&G.contracts.shirt?G.contracts.shirt.weekly:0)+
                   (G.contracts&&G.contracts.stadium?G.contracts.stadium.weekly:0)+
                   (G.contracts&&G.contracts.naming?G.contracts.naming.weekly:0);
  const tvInc=(G.contracts&&G.contracts.tv?G.contracts.tv.weekly:0)||inc.tv;
  const totalIncWeekly=inc.total+sponsorInc+(tvInc-inc.tv);
  const curCap=(G.stadium&&G.stadium.capacity)||200;
  const curMaint=Math.round(curCap*1000*0.005/4.3);
  const tcCost=tcLevel()>0?tcUpkeep(tcLevel()-1):0;
  const acadCost=G.fin.academyUpkeep||0;
  const salaries=G.fin.salaries||0;

  // Grupuj fin.hist po miesiącach (co 4 tygodnie od T3: M1=T3-T6, M2=T7-T10 itd.)
  // Miesiąc = Math.ceil((week-2)/4)
  function weekToMonth(w){return Math.max(1,Math.ceil(w/4));}
  const curMonth=weekToMonth(G.week);
  const hist=(G.fin.hist||[]).filter(h=>(h.season||1)===G.season);
  const transfers=(G.fin.transfers||[]).filter(t=>t.season===G.season);

  // Zbierz miesiące które mamy dane
  // monthNums uwzględnia też miesiące z transferów (nie tylko z hist)
  const monthNums=[...new Set([
    ...hist.map(h=>weekToMonth(h.w)),
    ...transfers.map(t=>weekToMonth(t.week||1))
  ])].sort((a,b)=>b-a).slice(0,6);
  if(!monthNums.includes(curMonth))monthNums.unshift(curMonth);
  monthNums.sort((a,b)=>b-a);

  // otherEvents = zdarzenia jednorazowe BEZ transferów (bonusy zarządu, budowa stadionu itd.);
  // trEvents = same transfery (SPR:/KUP:), osobno — to jest sedno przebudowy: dawniej te dwie
  // kategorie były wymieszane w jednej liście "events" o równej wadze wizualnej, co maskowało
  // fakt że to transfery, nie działalność klubu, dominują saldo (patrz diagnoza ekonomii).
  function monthData(m){
    const w0=(m-1)*4+1; const w1=m*4; // T zakres miesiąca (M1=T1-T4, M2=T5-T8 itd.)
    const rows=hist.filter(h=>h.w>=w0&&h.w<=w1);
    const trRows=transfers.filter(t=>t.week>=w0&&t.week<=w1);
    const regInc=rows.filter(h=>!h.note).reduce((s,h)=>s+(h.inc||0),0);
    const salPaid=rows.filter(h=>!h.note&&h.costSalary>0).reduce((s,h)=>s+(h.costSalary||0),0);
    const maintPaid=rows.filter(h=>!h.note).reduce((s,h)=>s+(h.costMaint||0)+(h.costTC||0)+(h.costAcad||0),0);
    const nonTrRows=rows.filter(h=>h.note&&!h.note.startsWith('SPR:')&&!h.note.startsWith('KUP:'));
    const evtInc=nonTrRows.reduce((s,h)=>s+(h.inc||0),0);
    const evtCost=nonTrRows.reduce((s,h)=>s+(h.cost||0),0);
    const trSellInc=trRows.filter(t=>t.type==='sell').reduce((s,t)=>s+(t.val||0),0);
    const trBuyCost=trRows.filter(t=>t.type==='buy').reduce((s,t)=>s+(t.val||t.fee||0),0);
    const totalInc=regInc+evtInc+trSellInc;
    const totalCost=salPaid+maintPaid+evtCost+trBuyCost;
    const otherEvents=nonTrRows.map(h=>({lbl:h.note,inc:h.inc||0,cost:h.cost||0}));
    const trEvents=[
      ...trRows.filter(t=>t.type==='sell').map(t=>({lbl:'SPR: '+t.name,inc:t.val||0,cost:0,type:'sell'})),
      ...trRows.filter(t=>t.type==='buy').map(t=>({lbl:'KUP: '+t.name,inc:0,cost:t.val||t.fee||0,type:'buy'}))
    ];
    return{w0,w1,regInc,salPaid,maintPaid,evtInc,evtCost,trSellInc,trBuyCost,totalInc,totalCost,net:totalInc-totalCost,otherEvents,trEvents};
  }

  // Jeśli brak danych historycznych (wczesna gra) — szacuj z aktualnych stawek
  function estimateMonth(m){
    const isCur=m===curMonth;
    const w0e=(m-1)*4+1; const w1e=m*4;
    const weeksIn=isCur?Math.max(1,G.week-w0e+1):4;
    // W szacunku nie uwzględniaj biletów — mecze są nieregularne i nieznane
    const _wIncLocal=calcWeeklyIncome();
    const _wIncNoTickets=totalIncWeekly-(_wIncLocal.tickets||0);
    const regInc=_wIncNoTickets*weeksIn;
    const salPaid=salaries;
    const maintPaid=(curMaint+tcCost+acadCost)*weeksIn;
    // Transfery z fin.transfers
    const trRowsE=transfers.filter(t=>t.week>=w0e&&t.week<=w1e);
    const trSellE=trRowsE.filter(t=>t.type==='sell').reduce((s,t)=>s+(t.val||0),0);
    const trBuyE=trRowsE.filter(t=>t.type==='buy').reduce((s,t)=>s+(t.val||t.fee||0),0);
    // Zdarzenia jednorazowe z fin.hist (budowa stadionu, bonus podpisania, kronika itp.)
    const histRowsE=hist.filter(h=>h.note&&h.w>=w0e&&h.w<=w1e
      &&!h.note.startsWith('SPR:')&&!h.note.startsWith('KUP:'));
    const evtIncE=histRowsE.reduce((s,h)=>s+(h.inc||0),0);
    const evtCostE=histRowsE.reduce((s,h)=>s+(h.cost||0),0);
    const otherEventsE=histRowsE.map(h=>({lbl:h.note,inc:h.inc||0,cost:h.cost||0}));
    const trEventsE=[
      ...trRowsE.filter(t=>t.type==='sell').map(t=>({lbl:'SPR: '+t.name,inc:t.val||0,cost:0,type:'sell'})),
      ...trRowsE.filter(t=>t.type==='buy').map(t=>({lbl:'KUP: '+t.name,inc:0,cost:t.val||t.fee||0,type:'buy'}))
    ];
    // Dodaj niezaksięgowane bilety z bieżącego tygodnia (przed advWeek)
    const _pendingTickets=isCur?(G.fin.tickets||0):0;
    const regIncFinal=regInc+_pendingTickets;
    const totalInc=regIncFinal+trSellE+evtIncE;
    const totalCost=salPaid+maintPaid+trBuyE+evtCostE;
    return{w0:w0e,w1:w1e,regInc:regIncFinal,salPaid,maintPaid,evtInc:evtIncE,evtCost:evtCostE,trSellInc:trSellE,trBuyCost:trBuyE,totalInc,totalCost,net:totalInc-totalCost,otherEvents:otherEventsE,trEvents:trEventsE,estimated:true};
  }

  const curData=hist.filter(h=>weekToMonth(h.w)===curMonth&&!h.note).length>0
    ?monthData(curMonth):estimateMonth(curMonth);

  // Wynik operacyjny (BEZ transferów) — donut liczy tylko to, żeby jedna duża sprzedaż nie
  // zalewała wykresu na zielono i nie maskowała prawdziwego trendu klubu (patrz diagnoza).
  const opInc=curData.regInc;
  const opCost=curData.salPaid+curData.maintPaid;
  const opNet=opInc-opCost;
  const opTotal=opInc+opCost||1;
  const CIRC=2*Math.PI*34; // obwód r=34
  const incArc=Math.round(CIRC*opInc/opTotal*10)/10;
  const costArc=Math.round(CIRC*opCost/opTotal*10)/10;
  const opSign=opNet>=0;

  const trNet=curData.trSellInc-curData.trBuyCost;
  const trSellCount=curData.trEvents.filter(e=>e.type==='sell').length;
  const trBuyCount=curData.trEvents.filter(e=>e.type==='buy').length;
  const trCount=trSellCount+trBuyCount;

  const healthRatio=opInc>0?curData.salPaid/opInc:(curData.salPaid>0?9.9:0);
  const healthCls=healthRatio>1.3?'warn':healthRatio>1.0?'mid':'ok';

  // Bilans całego sezonu (wyklucz SPR:/KUP: z fin.hist bo te same transfery są już w fin.transfers)
  const seasonInc=hist.filter(h=>!h.note||(!h.note.startsWith('SPR:')&&!h.note.startsWith('KUP:'))).reduce((s,h)=>s+(h.inc||0),0)+transfers.filter(t=>t.type==='sell').reduce((s,t)=>s+(t.val||0),0);
  const seasonCost=hist.filter(h=>!h.note||(!h.note.startsWith('SPR:')&&!h.note.startsWith('KUP:'))).reduce((s,h)=>s+(h.cost||0),0)+transfers.filter(t=>t.type==='buy').reduce((s,t)=>s+(t.val||t.fee||0),0);
  const seasonNet=seasonInc-seasonCost;
  const seasonTrInc=transfers.filter(t=>t.type==='sell').reduce((s,t)=>s+(t.val||0),0);
  const seasonTrPct=seasonInc>0?Math.round(seasonTrInc/seasonInc*100):0;

  // Render
  let html='';

  // Bilans operacyjny (donut) — tylko przychód regularny vs koszty stałe
  html+='<div class="fsec" style="margin-top:0">'+t('fin_operating_title')+'</div>';
  html+='<div class="fc-donut-wrap">';
  html+='<div class="fc-donut">';
  html+=`<svg width="90" height="90" viewBox="0 0 90 90">`;
  html+=`<circle cx="45" cy="45" r="34" fill="none" stroke="#122412" stroke-width="12"/>`;
  if(opCost>0)html+=`<circle cx="45" cy="45" r="34" fill="none" stroke="#f44336" stroke-width="12" stroke-dasharray="${costArc} ${CIRC-costArc}" stroke-dashoffset="0" transform="rotate(-90 45 45)" opacity="0.85"/>`;
  if(opInc>0)html+=`<circle cx="45" cy="45" r="34" fill="none" stroke="#4caf50" stroke-width="12" stroke-dasharray="${incArc} ${CIRC-incArc}" stroke-dashoffset="${-costArc}" transform="rotate(-90 45 45)" opacity="0.85"/>`;
  html+='</svg>';
  html+=`<div class="fc-donut-center"><div class="fc-donut-amt ${opSign?'pos':'neg'}">${opSign?'+':''}${fmt(opNet)}</div><div class="fc-donut-lbl">${t('fin_operating_label')}</div></div>`;
  html+='</div>';
  html+='<div class="fc-legend">';
  html+=`<div class="fc-leg"><span class="fc-leg-dot" style="background:var(--gb)"></span><span class="fc-leg-lbl">${t('fin_reg_income')}</span><span class="fc-leg-val pos">+${fmt(opInc)}</span></div>`;
  html+=`<div class="fc-leg"><span class="fc-leg-dot" style="background:var(--rd)"></span><span class="fc-leg-lbl">${t('fin_fixed_costs')}</span><span class="fc-leg-val neg">-${fmt(opCost)}</span></div>`;
  html+=`<div style="margin-top:5px;padding-top:5px;border-top:1px solid var(--gl);font-size:var(--fs-dense);color:var(--gr)">${t('fin_balance_state')} <span style="font-weight:700;font-size:var(--fs-h2);color:${G.budget>=0?'var(--gb)':'var(--rd)'}">${fmt(G.budget)}</span></div>`;
  html+='</div></div>';

  // Transfery tego miesiąca — osobny chip, celowo oddzielony od donuta operacyjnego
  const trSub=trCount>0?t('fin_tr_chip_sub').replace('{a}',trSellCount).replace('{b}',trBuyCount):t('fin_tr_chip_sub_none');
  html+=`<div class="fc-tr-chip"><div class="fc-tr-chip-lbl">${t('fin_tr_chip_title')}<b>${trSub}</b></div><div class="fc-tr-chip-val ${trNet>=0?'pos':'neg'}">${trNet>=0?'+':''}${fmt(trNet)}</div></div>`;

  // Wskaźnik zdrowia: pensje / przychód regularny
  html+=`<div class="fc-health"><span class="fc-health-lbl">${t('fin_health_label')}</span><span class="fc-pill fc-pill-${healthCls}">${Math.round(healthRatio*100)}%</span></div>`;

  // Rozbicie przychodów regularnych
  const _wInc=calcWeeklyIncome();
  const _weeksInMonth=curData.w1-curData.w0+1;
  const _wScaleRaw=Math.max(1,G.week-curData.w0+1);
  const _wScale=_wScaleRaw<=_weeksInMonth?_wScaleRaw:_weeksInMonth;
  const _estSpon=Math.round((_wInc.sponsors||0)*_wScale);
  const _estContr=Math.round((_wInc.contracts||0)*_wScale);
  const _estAds=Math.round((_wInc.ads||0)*_wScale);
  const _estTV=Math.round((_wInc.tv||0)*_wScale);
  const _estGad=Math.round((_wInc.gadgets||0)*_wScale);
  const _estVip=Math.round((_wInc.vip||0)*_wScale);
  let _ticketsEst=0;
  if(!curData.estimated){
    const _histWeeks=hist.filter(h=>!h.note&&weekToMonth(h.w)===curMonth);
    const _nonTicketPerWeek=(_wInc.sponsors||0)+(_wInc.contracts||0)+(_wInc.ads||0)+(_wInc.tv||0)+(_wInc.gadgets||0)+(_wInc.vip||0);
    _histWeeks.forEach(function(h){_ticketsEst+=Math.max(0,(h.inc||0)-_nonTicketPerWeek);});
    _ticketsEst+=G.fin.tickets||0;
  } else {
    _ticketsEst=G.fin.tickets||0;
  }
  html+='<div class="fsec">'+t('fin_reg_income')+'</div>';
  if(_estSpon>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_sponsors')}</span><span class="fc-mrow-val pos">+${fmt(_estSpon)}</span></div>`;
  if(_estContr>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_contracts_inc')}</span><span class="fc-mrow-val pos">+${fmt(_estContr)}</span></div>`;
  if(_estAds>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_ads')}</span><span class="fc-mrow-val pos">+${fmt(_estAds)}</span></div>`;
  if(_estTV>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_tv')}</span><span class="fc-mrow-val pos">+${fmt(_estTV)}</span></div>`;
  if(_ticketsEst>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_tickets')}</span><span class="fc-mrow-val pos">+${fmt(_ticketsEst)}</span></div>`;
  if(_estGad>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_gadgets')}</span><span class="fc-mrow-val pos">+${fmt(_estGad)}</span></div>`;
  if(_estVip>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_vip')}</span><span class="fc-mrow-val pos">+${fmt(_estVip)}</span></div>`;
  html+=`<div class="fc-mrow total" style="padding:5px 12px"><span class="fc-mrow-lbl">${t('fin_reg_income')}</span><span class="fc-mrow-val pos">+${fmt(opInc)}</span></div>`;

  // Koszty stałe
  html+='<div class="fsec">'+t('fin_fixed_costs')+'</div>';
  if(curData.salPaid>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_salaries')}</span><span class="fc-mrow-val neg">-${fmt(curData.salPaid)}</span></div>`;
  if(curData.maintPaid>0)html+=`<div class="fc-mrow" style="padding:2px 12px"><span class="fc-mrow-lbl">${t('fin_maintenance')}</span><span class="fc-mrow-val neg">-${fmt(curData.maintPaid)}</span></div>`;
  html+=`<div class="fc-mrow total" style="padding:5px 12px"><span class="fc-mrow-lbl">${t('fin_fixed_costs')}</span><span class="fc-mrow-val neg">-${fmt(opCost)}</span></div>`;

  // Transfery — osobna, zwijana lista (nie wymieszana z resztą zdarzeń)
  html+='<div class="fsec">'+t('fin_transfers_title')+'</div>';
  if(trCount>0){
    html+=`<details class="fc-tr-details" open><summary><div><div class="fc-tr-sum-lbl">${t('fin_tr_count').replace('{n}',trCount)}</div><div class="fc-tr-sum-meta">${trSub}</div></div><div style="display:flex;align-items:center;"><span class="fc-tr-sum-val ${trNet>=0?'pos':'neg'}">${trNet>=0?'+':''}${fmt(trNet)}</span><span class="fc-tr-chev">▶</span></div></summary>`;
    html+='<div class="fc-tr-list">';
    curData.trEvents.forEach(function(ev){
      html+=`<div class="fc-tr-item"><span class="fc-tr-item-who">${ev.lbl}</span><span class="fc-tr-item-amt ${ev.inc>0?'pos':'neg'}">${ev.inc>0?'+'+fmt(ev.inc):'-'+fmt(ev.cost)}</span></div>`;
    });
    html+='</div></details>';
  } else {
    html+=`<div style="font-size:var(--fs-dense);color:var(--gr);padding:4px 12px 8px">${t('fin_tr_none')}</div>`;
  }

  // Zdarzenia jednorazowe — osobno od transferów
  if(curData.otherEvents.length){
    html+='<div class="fsec">'+t('fin_events_title')+'</div>';
    curData.otherEvents.forEach(function(ev){
      html+=`<div class="fc-mrow event" style="margin:2px 12px"><span class="fc-mrow-lbl event">${ev.lbl}</span><span class="fc-mrow-val ${ev.inc>0?'pos':'neg'}">${ev.inc>0?'+'+fmt(ev.inc):'-'+fmt(ev.cost)}</span></div>`;
    });
  }

  // Poprzednie miesiące — skrócone, tylko saldo netto
  const prevMonths=monthNums.filter(m=>m!==curMonth);
  if(prevMonths.length){
    html+='<div class="fsec">'+t('fin_prev_months_title')+'</div>';
    const prevData=prevMonths.map(function(m){
      const hasHistData=hist.filter(h=>weekToMonth(h.w)===m&&!h.note).length>0;
      return{m,d:hasHistData?monthData(m):estimateMonth(m)};
    });
    const maxAbs=Math.max(1,...prevData.map(x=>Math.abs(x.d.net)));
    prevData.forEach(function(x){
      const pct=Math.min(100,Math.round(Math.abs(x.d.net)/maxAbs*100));
      const barCol=x.d.net>=0?'var(--gb)':'var(--rd)';
      html+=`<div class="fc-prevm-row">`+
        `<span class="fc-prevm-name">${t('fin_month_label').replace('{m}',x.m).replace('{w0}',x.d.w0).replace('{w1}',x.d.w1)}</span>`+
        `<div class="fc-prevm-bar"><div class="fc-prevm-bar-fill" style="width:${pct}%;background:${barCol};opacity:.85"></div></div>`+
        `<span class="fc-prevm-val ${x.d.net>=0?'pos':'neg'}">${x.d.net>=0?'+':''}${fmt(x.d.net)}</span>`+
      `</div>`;
    });
  }

  // Pasek sezonu
  html+='<div class="fc-season-bar">';
  html+=`<div><div class="fc-season-lbl">${t('fin_season_income').replace('{n}',G.season)}</div><div class="fc-season-val pos">+${fmt(seasonInc)}</div></div>`;
  html+=`<div style="text-align:center"><div class="fc-season-lbl">${t('fin_season_costs').replace('{n}',G.season)}</div><div class="fc-season-val neg">-${fmt(seasonCost)}</div></div>`;
  html+=`<div style="text-align:right"><div class="fc-season-lbl">${t('fin_season_balance').replace('{n}',G.season)}</div><div class="fc-season-val ${seasonNet>=0?'pos':'neg'}">${seasonNet>=0?'+':''}${fmt(seasonNet)}</div></div>`;
  html+='</div>';
  if(seasonInc>0&&seasonTrPct>0)html+=`<div class="fc-season-caption">${t('fin_season_transfer_pct').replace('{n}',seasonTrPct)}</div>`;

  el.innerHTML=html;
}
function renderFinSezony(){
  const el=document.getElementById('fin-sezony');if(!el||!G)return;
  const cHist=G.cHist||[];
  const finHist=G.fin&&G.fin.hist||[];
  const finTr=G.fin&&G.fin.transfers||[];
  const LN={1:'Premier Division',2:'I Liga',3:'II Liga',4:'III Liga',5:'IV Liga',6:'V Liga',7:'VI Liga',8:'VII Liga'};

  function seasonFinData(s){
    const rows=finHist.filter(h=>(h.season||1)===s);
    const trs=finTr.filter(t=>t.season===s);
    if(!rows.length&&!trs.length)return null;
    const nonTr=rows.filter(h=>!h.note||(!h.note.startsWith('SPR:')&&!h.note.startsWith('KUP:')));
    const inc=nonTr.reduce((a,h)=>a+(h.inc||0),0)
              +trs.filter(t=>t.type==='sell').reduce((a,t)=>a+(t.val||0),0);
    const cost=nonTr.reduce((a,h)=>a+(h.cost||0),0)
               +trs.filter(t=>t.type==='buy').reduce((a,t)=>a+(t.val||t.fee||0),0);
    return{inc,cost,net:inc-cost};
  }

  const maxSeason=G.season||(cHist.length>0?Math.max(...cHist.map(c=>c.season)):1);
  const seasons=[];
  for(let s=1;s<=maxSeason;s++){
    const ch=cHist.find(c=>c.season===s);
    const fd=seasonFinData(s);
    seasons.push({s,ch,fd,isCur:s===G.season&&!G.seasonEnded});
  }
  if(!seasons.length){el.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:16px">'+t('fin_no_data')+'</div>';return;}

  const totInc=seasons.filter(r=>r.fd).reduce((a,r)=>a+(r.fd.inc||0),0);
  const totCost=seasons.filter(r=>r.fd).reduce((a,r)=>a+(r.fd.cost||0),0);
  const totNet=totInc-totCost;

  let html='';
  seasons.slice().reverse().forEach(function(r){
    const{s,ch,fd,isCur}=r;
    const leagueShort=ch?(LN[ch.leagueLevel]||ch.league||'?').replace('Premier Division','Premier Div.').replace(' Liga',' L.'):'?';
    const pos=ch?ch.pos:null;
    const isProm=pos&&pos<=2;
    const isRel=pos&&pos>14;
    const posStr=pos?(isProm?'<span style="color:#ffd700">'+pos+'. ★</span>':isRel?'<span style="color:var(--rd)">'+pos+'. ↓</span>':pos+'.'):' ?';
    const borderCol=isCur?'var(--am)':'var(--gl)';
    const bgCol=isCur?'#0a1a0a':'var(--gd)';

    // Pasek proporcji
    let incPct=50,costPct=50;
    if(fd&&(fd.inc+fd.cost)>0){
      incPct=Math.round(fd.inc/(fd.inc+fd.cost)*100);
      costPct=100-incPct;
    }
    const salStr=fd?'<span style="color:var(--gb)">+'+fmt(fd.inc)+'</span>':'<span style="color:var(--gr)">?</span>';
    const costStr=fd?'<span style="color:var(--rd)">-'+fmt(fd.cost)+'</span>':'<span style="color:var(--gr)">?</span>';
    const net=fd?fd.net:null;
    const netCol=net===null?'var(--gr)':net>=0?'var(--gb)':'var(--rd)';
    const netStr=net===null?'?':(net>=0?'+':'')+fmt(net);

    html+=`<div style="border-bottom:1px solid var(--gl);padding:8px 12px;background:${bgCol};border-left:3px solid ${borderCol}">`;
    // Nagłówek karty
    html+=`<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">`;
    html+=`<span style="font-weight:700;font-size:var(--fs-h2);color:${isCur?'var(--am)':'var(--wh)'}">S${s}${isCur?' ◄':''}</span>`;
    html+=`<span style="font-size:var(--fs-dense);color:var(--gr)">${leagueShort} • ${posStr}</span>`;
    html+='</div>';
    // Przychody / Koszty
    html+=`<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense);margin-bottom:3px">`;
    html+=`<span>▲ ${t('fin_income')}: ${salStr}</span>`;
    html+=`<span>▼ ${t('fin_costs')}: ${costStr}</span>`;
    html+='</div>';
    // Pasek
    if(fd){
      html+=`<div style="height:7px;background:#0a150a;margin-bottom:4px;position:relative;overflow:hidden">`;
      html+=`<div style="position:absolute;left:0;height:100%;width:${incPct}%;background:var(--gb);opacity:0.85"></div>`;
      html+=`<div style="position:absolute;left:${incPct}%;height:100%;width:${costPct}%;background:var(--rd);opacity:0.75"></div>`;
      html+='</div>';
    } else {
      html+='<div style="height:7px;background:#0a150a;margin-bottom:4px"></div>';
    }
    // Saldo
    html+=`<div style="text-align:right;font-weight:700;font-size:var(--fs-h2);color:${netCol}">${t('fin_saldo')} ${netStr}</div>`;
    html+='</div>';
  });

  // ŁĄCZNIE
  const totNet2=totNet;
  html+=`<div style="background:var(--tb);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-top:2px solid var(--gb)">`;
  html+=`<span style="font-weight:700;font-size:var(--fs-h2);color:var(--wh)">${t('fin_total')}</span>`;
  html+=`<div style="text-align:right;font-size:var(--fs-dense)">`;
  html+=`<div><span style="color:var(--gb)">+${fmt(totInc)}</span> / <span style="color:var(--rd)">-${fmt(totCost)}</span></div>`;
  html+=`<div style="font-weight:700;font-size:var(--fs-h2);color:${totNet2>=0?'var(--gb)':'var(--rd)'}">${totNet2>=0?'+':''}${fmt(totNet2)}</div>`;
  html+='</div></div>';
  html+=`<div style="font-size:var(--fs-dense);color:var(--gr);padding:5px 12px 8px">${t('fin_season_note')}</div>`;

  el.innerHTML=html;
}
function renderFinKontrakty(){
  const el=document.getElementById('fin-kontrakty');if(!el||!G)return;
  if(!G.contracts)G.contracts={};
  const lvl=G.myLeague||8;
  const rep=G.reputation||30;
  const cap=(G.stadium&&G.stadium.capacity)||200;

  // Oblicz wartość oferty sponsorskiej na podstawie reputacji i ligi
  function sponsorOffer(slot){
    const base={shirt:{1:300000,2:150000,3:15000,4:5000,5:2000,6:800,7:300,8:150},
                stadium:{1:150000,2:75000,3:7500,4:2500,5:1000,6:400,7:150,8:80},
                naming:{1:600000,2:300000,3:30000,4:10000,5:4000,6:1500,7:0,8:0}};
    const b=(base[slot]&&base[slot][lvl])||0;
    const repMult=repCurve(rep||30,0.8,1.0);
    const raw=b*repMult;
    return raw<500?Math.round(raw/50)*50:Math.round(raw/500)*500;
  }

  // TV kontrakt wartość
  function tvOffer(){
    if(lvl>3&&!G.tvForced)return 0; // tylko od III Ligi
    const base={1:500000,2:150000,3:8000};
    const b=base[lvl]||0;
    return Math.round(b*repCurve(rep,0.5,3.5)/100)*100;
  }

  // Wymagania
  const reqStadium=cap>=1000;
  const reqNaming=cap>=5000&&rep>=300;
  const reqTV=lvl<=3&&rep>=150;

  const sponsorTiers=[
    {minRep:0,  maxRep:49,  name:t('fin_sponsor_tier_1'), color:'var(--gr)'},
    {minRep:50, maxRep:99,  name:t('fin_sponsor_tier_2'), color:'var(--wh)'},
    {minRep:100,maxRep:199, name:t('fin_sponsor_tier_3'), color:'var(--am)'},
    {minRep:200,maxRep:399, name:t('fin_sponsor_tier_4'), color:'#4fc3f7'},
    {minRep:400,maxRep:699, name:t('fin_sponsor_tier_5'), color:'var(--gb)'},
    {minRep:700, maxRep:1499,   name:t('fin_sponsor_tier_6'), color:'#ffd700'},
    {minRep:1500,maxRep:2999,   name:t('fin_sponsor_tier_7'), color:'#ff6f00'},
    {minRep:3000,maxRep:Infinity,name:t('fin_sponsor_tier_8'), color:'#e91e63'},
  ];
  const curRep=G.reputation||30;
  const curTier=sponsorTiers.find(t=>curRep>=t.minRep&&curRep<=t.maxRep)||sponsorTiers[0];
  const nextTier=sponsorTiers.find(t=>t.minRep>curRep)||null;

  function contractBox(slot,label,icon,req,reqMsg,weekly,active){
    const hasActive=G.contracts[slot]&&G.contracts[slot].weekly>0;
    const seasonsLeft=G.contracts[slot]?G.contracts[slot].seasonsLeft:0;
    return '<div style="background:var(--tb);border:1px solid '+(hasActive?'var(--gb)':'var(--gl)')+';padding:10px 12px;margin-bottom:8px">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
        '<span style="font-size:var(--fs-display)">'+icon+'</span>'+
        '<div style="flex:1">'+
          '<div style="font-size:var(--fs-dense);color:var(--wh)">'+label+'</div>'+
          (hasActive?(function(){
            const _repMC=repCurve(G.reputation||30,0.8,1.0);
            const _actual=Math.round(G.contracts[slot].weekly*_repMC);
            const _base=G.contracts[slot].weekly;
            return '<div style="font-size:var(--fs-dense);color:var(--gb)">'+t('fin_contract_line').replace('{n}',fmt(_base)).replace('{seas}',seasonsLeft)+'</div>'+
              '<div style="font-size:var(--fs-dense);color:var(--am)">'+t('fin_actual_weekly').replace('{n}',fmt(_actual)).replace('{mult}',_repMC.toFixed(2))+'</div>';
          })():
           '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('fin_no_contract')+'</div>')+
        '</div>'+
      '</div>'+
      (!hasActive?
        '<div style="font-size:var(--fs-dense);margin-bottom:3px">'+
          t('fin_sponsor_current')+' <span style="color:'+curTier.color+'">'+curTier.name+'</span>'+
          ' <span style="color:var(--gr)">(Rep. '+curTier.minRep+'–'+curTier.maxRep+')</span>'+
        '</div>'+
        (nextTier?
          '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:5px">'+
            t('fin_sponsor_next')+' <span style="color:'+nextTier.color+'">'+nextTier.name+'</span>'+
            t('fin_sponsor_at_rep')+' <span style="color:var(--am)">'+nextTier.minRep+'</span>'+
            ' <span style="color:var(--gr)">'+t('fin_sponsor_missing').replace('{n}',nextTier.minRep-curRep)+'</span>'+
          '</div>'
        :'<div style="font-size:var(--fs-dense);color:#ffd700;margin-bottom:5px">'+t('fin_sponsor_max')+'</div>')
      :'')+
      (hasActive?
        '<div style="font-size:var(--fs-dense);color:var(--gb)">'+t('fin_active_contract')+'</div>'
      :!req?
        '<div style="font-size:var(--fs-dense);color:var(--rd)">'+reqMsg+'</div>'
      :weekly===0?
        '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('fin_no_offers')+'</div>'
      :
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:5px">'+t('fin_offer_line').replace('{n}',fmt(weekly))+'</div>'+
        '<button onclick="signContract(\''+slot+'\')" style="width:100%;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+t('fin_sign_btn')+'</button>'
      )+
    '</div>';
  }
  el.innerHTML=
    '<div class="fsec">'+t('fin_sponsors_title')+'</div>'+
    contractBox('shirt',t('fin_shirt_label'),'👕',true,'',sponsorOffer('shirt'),G.contracts.shirt)+
    contractBox('stadium',t('fin_stadium_label'),'🏟️',reqStadium,t('fin_req_stadium'),sponsorOffer('stadium'),G.contracts.stadium)+
    contractBox('naming',t('fin_naming_label'),'💎',reqNaming,t('fin_req_naming'),sponsorOffer('naming'),G.contracts.naming)+
    '<div class="fsec" style="margin-top:10px">'+t('fin_tv_title')+'</div>'+
    contractBox('tv',t('fin_tv_label'),'📺',reqTV,lvl>3?t('fin_req_tv'):t('fin_req_tv_rep'),tvOffer(),G.contracts.tv);
}

function signContract(slot){
  if(!G)return;
  if(!G.contracts)G.contracts={};
  const lvl=G.myLeague||8;const rep=G.reputation||30;
  const cap=(G.stadium&&G.stadium.capacity)||200;
  function getWeekly(s){
    const base={shirt:{1:300000,2:150000,3:15000,4:5000,5:2000,6:800,7:300,8:150},
                stadium:{1:150000,2:75000,3:7500,4:2500,5:1000,6:400,7:150,8:80},
                naming:{1:600000,2:300000,3:30000,4:10000,5:4000,6:1500,7:0,8:0},
                tv:{1:500000,2:150000,3:8000}};
    const b=(base[s]&&base[s][lvl])||0;
    const raw2=b*(Math.max(0.5,rep/50));
    return raw2<500?Math.round(raw2/50)*50:Math.round(raw2/500)*500;
  }
  const weekly=getWeekly(slot);
  if(weekly<=0){notif(t('fin_no_offers'),'err');return;}
  G.contracts[slot]={weekly,seasonsLeft:1,slot};
  addNews(t('news_sponsor_signed').replace('{slot}',({shirt:t('sponsor_slot_shirt'),stadium:t('sponsor_slot_stadium'),naming:t('sponsor_slot_naming'),tv:t('sponsor_slot_tv')}[slot]||slot)).replace('{val}',fmt(weekly)),'club');
  notif(t('fin_sign_btn')+': +'+fmt(weekly)+'/wk!','ok');
  renderFinKontrakty();
}

function renderFinHistoria(){
  const el=document.getElementById('fin-historia');if(!el||!G)return;
  const weekly=(G.fin.hist||[]).filter(h=>!h.note&&(h.season||1)===G.season).slice().reverse();
  const allEvents={};
  (G.fin.hist||[]).filter(h=>h.note&&(h.season||1)===G.season).forEach(function(h){
    if(!allEvents[h.w])allEvents[h.w]=[];
    allEvents[h.w].push({lbl:h.note,inc:h.inc||0,cost:h.cost||0});
  });
  (G.fin.transfers||[]).filter(t=>t.season===G.season).forEach(function(t){
    const w=t.week||0;
    if(!allEvents[w])allEvents[w]=[];
    if(t.type==='sell')allEvents[w].push({lbl:'➔ SPR: '+t.name+(t.club?' →'+t.club:''),inc:t.val||0,cost:0});
    else allEvents[w].push({lbl:'➔ KUP: '+t.name,inc:0,cost:t.val||t.fee||0});
  });

  if(!weekly.length){el.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:16px">'+t('fin_hist_empty')+'</div>';return;}

  let html='<div style="font-weight:700;font-size:var(--fs-h2);color:var(--gr);padding:6px 0 8px;letter-spacing:1px">'+t('fin_hist_weeks').replace('{n}',G.season).replace('{m}',weekly.length)+'</div>';
  html+='<table style="width:100%;border-collapse:collapse;font-size:var(--fs-dense)">';
  html+='<thead><tr>';
  html+='<th style="text-align:left;padding:4px 5px;border-bottom:2px solid var(--gl);font-weight:700;font-size:var(--fs-h2);color:var(--gr)">'+t('fin_hist_col_week')+'</th>';
  html+='<th style="text-align:right;padding:4px 5px;border-bottom:2px solid var(--gl);font-weight:700;font-size:var(--fs-h2);color:var(--gb)">'+t('fin_hist_col_income')+'</th>';
  html+='<th style="text-align:right;padding:4px 5px;border-bottom:2px solid var(--gl);font-weight:700;font-size:var(--fs-h2);color:var(--rd)">'+t('fin_hist_col_costs')+'</th>';
  html+='<th style="text-align:right;padding:4px 5px;border-bottom:2px solid var(--gl);font-weight:700;font-size:var(--fs-h2);color:var(--am)">'+t('fin_hist_col_balance')+'</th>';
  html+='</tr></thead><tbody>';

  // Tygodnie z wpisami tygodniowymi + tygodnie ze zdarzeniami bez wpisu (np. transfer w T1 bez meczu)
  const weeklyByW={};
  weekly.forEach(function(h){weeklyByW[h.w]=h;});
  const eventOnlyWeeks=Object.keys(allEvents).map(Number).filter(w=>!weeklyByW[w]);
  const allWeeks=[...weekly.map(h=>h.w),...eventOnlyWeeks].sort((a,b)=>b-a);

  allWeeks.forEach(function(w){
    const h=weeklyByW[w];
    const hasSplit=h&&h.costSalary!==undefined;
    const isPayWeek=h&&hasSplit?h.costSalary>0:h&&(w%4===0&&h.cost>0);
    const totalCost=h&&h.cost||0;
    const rowBg=isPayWeek?'background:#1a0800':'';
    if(h){
      html+=`<tr style="${rowBg}">`;
      html+=`<td style="padding:4px 5px;color:var(--gr)">T${w}${isPayWeek?' <span style="color:var(--am)">★</span>':''}</td>`;
      html+=`<td style="text-align:right;padding:4px 5px;color:var(--gb)">${h.inc?'+'+fmt(h.inc):'—'}</td>`;
      html+=`<td style="text-align:right;padding:4px 5px;color:var(--rd)">${totalCost>0?'-'+fmt(totalCost):'—'}</td>`;
      html+=`<td style="text-align:right;padding:4px 5px;color:var(--am)">${fmt(h.bal)}</td>`;
      html+='</tr>';
    }
    // Zdarzenia jednorazowe tego tygodnia
    (allEvents[w]||[]).forEach(function(ev){
      html+='<tr style="background:#080f08">';
      html+=`<td colspan="2" style="padding:2px 5px 2px 12px;color:var(--am);font-size:var(--fs-dense)">↳ ${ev.lbl}</td>`;
      html+=`<td style="text-align:right;padding:2px 5px;font-size:var(--fs-dense);color:${ev.inc>0?'var(--gb)':'var(--rd)'}">${ev.inc>0?'+'+fmt(ev.inc):'-'+fmt(ev.cost)}</td>`;
      html+=`<td style="padding:2px 5px;color:var(--gr);text-align:right">—</td>`;
      html+='</tr>';
    });
  });

  html+='</tbody></table>';
  html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:4px 0 8px">'+t('fin_salary_week_legend')+'</div>';
  el.innerHTML=html;
}

// ETAP 5 - AKADEMIA JUNIOROW
