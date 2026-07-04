function finTab(tab,btn){
  document.querySelectorAll('#p-finance .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['przeglad','kontrakty','historia','sezony','zarzad'].forEach(t=>{
    const el=document.getElementById('fin-'+t);if(el)el.classList.remove('on');
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
  el.innerHTML=`<div style="display:flex;border-bottom:1px solid var(--gl);margin-bottom:10px">${mkTab('cele','CELE')}${mkTab('historia','HISTORIA')}</div><div id="fin-zarzad-inner" style="padding:0 2px"></div>`;
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
    if(!buf){inner.innerHTML='<div style="color:var(--gr);padding:12px;font-size:var(--fs-body)">Błąd: brak bufora zarządu.</div>';return;}
    renderBoardCele();
    inner.innerHTML=buf.innerHTML;
  } else {
    const buf=document.getElementById('board-historia');
    if(!buf){inner.innerHTML='<div style="color:var(--gr);padding:12px;font-size:var(--fs-body)">Błąd: brak bufora historii zarządu.</div>';return;}
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

  function monthData(m){
    const w0=(m-1)*4+1; const w1=m*4; // T zakres miesiąca (M1=T1-T4, M2=T5-T8 itd.)
    const rows=hist.filter(h=>h.w>=w0&&h.w<=w1);
    const trRows=transfers.filter(t=>t.week>=w0&&t.week<=w1);
    const regInc=rows.filter(h=>!h.note).reduce((s,h)=>s+(h.inc||0),0);
    const salPaid=rows.filter(h=>!h.note&&h.costSalary>0).reduce((s,h)=>s+(h.costSalary||0),0);
    const maintPaid=rows.filter(h=>!h.note).reduce((s,h)=>s+(h.costMaint||0)+(h.costTC||0)+(h.costAcad||0),0);
    // Zdarzenia z fin.hist z note — ale wykluczamy SPR:/KUP: bo te są już w fin.transfers
    const nonTrRows=rows.filter(h=>h.note&&!h.note.startsWith('SPR:')&&!h.note.startsWith('KUP:'));
    const evtInc=nonTrRows.reduce((s,h)=>s+(h.inc||0),0);
    const evtCost=nonTrRows.reduce((s,h)=>s+(h.cost||0),0);
    const trSellInc=trRows.filter(t=>t.type==='sell').reduce((s,t)=>s+(t.val||0),0);
    const trBuyCost=trRows.filter(t=>t.type==='buy').reduce((s,t)=>s+(t.val||t.fee||0),0);
    const totalInc=regInc+evtInc+trSellInc;
    const totalCost=salPaid+maintPaid+evtCost+trBuyCost;
    const events=[
      ...nonTrRows.map(h=>({lbl:h.note,inc:h.inc||0,cost:h.cost||0})),
      ...trRows.filter(t=>t.type==='sell').map(t=>({lbl:'SPR: '+t.name,inc:t.val||0,cost:0})),
      ...trRows.filter(t=>t.type==='buy').map(t=>({lbl:'KUP: '+t.name,inc:0,cost:t.val||t.fee||0}))
    ];
    return{w0,w1,regInc,salPaid,maintPaid,evtInc,evtCost,trSellInc,trBuyCost,totalInc,totalCost,net:totalInc-totalCost,events};
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
    const eventsE=[
      ...histRowsE.map(h=>({lbl:h.note,inc:h.inc||0,cost:h.cost||0})),
      ...trRowsE.filter(t=>t.type==='sell').map(t=>({lbl:'SPR: '+t.name,inc:t.val||0,cost:0})),
      ...trRowsE.filter(t=>t.type==='buy').map(t=>({lbl:'KUP: '+t.name,inc:0,cost:t.val||t.fee||0}))
    ];
    // Dodaj niezaksięgowane bilety z bieżącego tygodnia (przed advWeek)
    const _pendingTickets=isCur?(G.fin.tickets||0):0;
    const regIncFinal=regInc+_pendingTickets;
    const totalInc=regIncFinal+trSellE+evtIncE;
    const totalCost=salPaid+maintPaid+trBuyE+evtCostE;
    return{w0:w0e,w1:w1e,regInc:regIncFinal,salPaid,maintPaid,evtInc:evtIncE+trSellE,evtCost:evtCostE+trBuyE,trSellInc:trSellE,trBuyCost:trBuyE,totalInc,totalCost,net:totalInc-totalCost,events:eventsE,estimated:true};
  }

  // Donut dla bieżącego miesiąca
  const curData=hist.filter(h=>weekToMonth(h.w)===curMonth&&!h.note).length>0
    ?monthData(curMonth):estimateMonth(curMonth);
  const donutInc=curData.totalInc; const donutCost=curData.totalCost;
  const donutTotal=donutInc+donutCost||1;
  const CIRC=2*Math.PI*34; // obwód r=34
  const incArc=Math.round(CIRC*donutInc/donutTotal*10)/10;
  const costArc=Math.round(CIRC*donutCost/donutTotal*10)/10;
  const netSign=curData.net>=0;

  // Bilans całego sezonu
  const allHist=hist;
  const allTr=transfers;
  // Wyklucz SPR:/KUP: z fin.hist bo te same transfery są już w fin.transfers
  const seasonInc=allHist.filter(h=>!h.note||(!h.note.startsWith('SPR:')&&!h.note.startsWith('KUP:'))).reduce((s,h)=>s+(h.inc||0),0)+allTr.filter(t=>t.type==='sell').reduce((s,t)=>s+(t.val||0),0);
  const seasonCost=allHist.filter(h=>!h.note||(!h.note.startsWith('SPR:')&&!h.note.startsWith('KUP:'))).reduce((s,h)=>s+(h.cost||0),0)+allTr.filter(t=>t.type==='buy').reduce((s,t)=>s+(t.val||t.fee||0),0);

  // Render
  let html='';

  // Donut + legenda
  html+='<div class="fc-donut-wrap">';
  html+='<div class="fc-donut">';
  html+=`<svg width="90" height="90" viewBox="0 0 90 90">`;
  html+=`<circle cx="45" cy="45" r="34" fill="none" stroke="#122412" stroke-width="12"/>`;
  if(donutCost>0)html+=`<circle cx="45" cy="45" r="34" fill="none" stroke="#f44336" stroke-width="12" stroke-dasharray="${costArc} ${CIRC-costArc}" stroke-dashoffset="0" transform="rotate(-90 45 45)" opacity="0.85"/>`;
  if(donutInc>0)html+=`<circle cx="45" cy="45" r="34" fill="none" stroke="#4caf50" stroke-width="12" stroke-dasharray="${incArc} ${CIRC-incArc}" stroke-dashoffset="${-costArc}" transform="rotate(-90 45 45)" opacity="0.85"/>`;
  html+='</svg>';
  html+=`<div class="fc-donut-center"><div class="fc-donut-amt ${netSign?'pos':'neg'}">${netSign?'+':''}${fmt(curData.net)}</div><div class="fc-donut-lbl">MIE ${curMonth}<br>BILANS</div></div>`;
  html+='</div>';
  html+='<div class="fc-legend">';
  html+=`<div class="fc-leg"><span class="fc-leg-dot" style="background:var(--gb)"></span><span class="fc-leg-lbl">Przychód</span><span class="fc-leg-val pos">+${fmt(curData.totalInc)}</span></div>`;
  html+=`<div class="fc-leg"><span class="fc-leg-dot" style="background:var(--rd)"></span><span class="fc-leg-lbl">Koszty</span><span class="fc-leg-val neg">-${fmt(curData.totalCost)}</span></div>`;
  html+=`<div style="margin-top:5px;padding-top:5px;border-top:1px solid var(--gl);font-size:var(--fs-dense);color:var(--gr)">Stan: <span style="font-weight:700;font-size:var(--fs-h2);color:${G.budget>=0?'var(--gb)':'var(--rd)'}">${fmt(G.budget)}</span></div>`;
  html+='</div></div>';

  // Lista miesięcy
  html+='<div class="fsec" style="margin:0">MIESIĘCZNE — sezon '+G.season+'</div>';

  monthNums.forEach(function(m){
    const _mw0=(m-1)*4+1; const _mw1=m*4;
    const hasHistData=hist.filter(h=>weekToMonth(h.w)===m&&!h.note).length>0;
    const hasTrData=transfers.filter(t=>t.week>=_mw0&&t.week<=_mw1).length>0;
    const hasRealData=hasHistData||hasTrData;
    const d=hasHistData?monthData(m):estimateMonth(m);
    const isCur=m===curMonth;
    html+=`<div class="fc-month">`;
    html+=`<div class="fc-month-hdr">`;
    html+=`<span class="fc-month-name">${isCur?'\u25b6 ':'\u25c6 '}MIE ${m} (T${d.w0}\u2013T${d.w1})${isCur?' BIER\u0104CY':''}${d.estimated?' \u2248':''}</span>`;
    
    html+='</div>';
    // Rozbicie przychodów regularnych z calcWeeklyIncome (bieżące stawki)
    const _wInc=calcWeeklyIncome();
    const _weeksInMonth=d.w1-d.w0+1;
    // Dla bieżącego miesiąca: skaluj przez tygodnie które minęły
    const _wScale=isCur?Math.max(1,G.week-d.w0+1):_weeksInMonth;
    const _estSpon=Math.round((_wInc.sponsors||0)*_wScale);
    const _estContr=Math.round((_wInc.contracts||0)*_wScale);
    const _estAds=Math.round((_wInc.ads||0)*_wScale);
    const _estTV=Math.round((_wInc.tv||0)*_wScale);
    const _estGad=Math.round((_wInc.gadgets||0)*_wScale);
    const _estVip=Math.round((_wInc.vip||0)*_wScale);
    // Bilety: z fin.hist (faktyczne) minus reszta
    const _estOther=_estSpon+_estContr+_estAds+_estTV+_estGad+_estVip;
    // Bilety z fin.hist (faktyczne) — sumujemy G.fin.tickets z historii tygodniowej
    // fin.hist.inc zawiera: sponsorzy+kontrakty+reklamy+TV+gadżety+VIP+bilety
    // Bilety = inc - (sponsorzy+kontrakty+reklamy+TV+gadżety+VIP) per tydzień
    let _ticketsEst=0;
    if(!d.estimated){
      // Dla zakończonych tygodni — czytaj z fin.hist
      const _histWeeks=hist.filter(h=>!h.note&&weekToMonth(h.w)===(d.w0<=2?1:Math.ceil(d.w0/4)));
      const _wIncForTicket=calcWeeklyIncome();
      const _nonTicketPerWeek=(_wIncForTicket.sponsors||0)+(_wIncForTicket.contracts||0)+
        (_wIncForTicket.ads||0)+(_wIncForTicket.tv||0)+(_wIncForTicket.gadgets||0)+(_wIncForTicket.vip||0);
      _histWeeks.forEach(function(h){
        const _t=Math.max(0,(h.inc||0)-_nonTicketPerWeek);
        _ticketsEst+=_t;
      });
      // Dodaj niezaksięgowane bilety bieżącego tygodnia
      _ticketsEst+=G.fin.tickets||0;
    } else {
      // Szacunek — bilety z G.fin.tickets (niezaksięgowane)
      _ticketsEst=G.fin.tickets||0;
    }
    html+=`<div class="fc-month-body">`;
    html+=`<div class="fc-mrow" style="border-bottom:1px solid #0a1f0a;margin-bottom:2px"><span class="fc-mrow-lbl" style="color:var(--wh)">Przychody regularne</span><span class="fc-mrow-val pos">+${fmt(d.regInc)}</span></div>`;
    if(_estSpon>0)html+=`<div class="fc-mrow" style="padding-left:8px"><span class="fc-mrow-lbl">Sponsorzy</span><span class="fc-mrow-val pos">+${fmt(_estSpon)}</span></div>`;
    if(_estContr>0)html+=`<div class="fc-mrow" style="padding-left:8px"><span class="fc-mrow-lbl">Kontrakty</span><span class="fc-mrow-val pos">+${fmt(_estContr)}</span></div>`;
    if(_estAds>0)html+=`<div class="fc-mrow" style="padding-left:8px"><span class="fc-mrow-lbl">Reklamy</span><span class="fc-mrow-val pos">+${fmt(_estAds)}</span></div>`;
    if(_estTV>0)html+=`<div class="fc-mrow" style="padding-left:8px"><span class="fc-mrow-lbl">TV</span><span class="fc-mrow-val pos">+${fmt(_estTV)}</span></div>`;
    if(_ticketsEst>0)html+=`<div class="fc-mrow" style="padding-left:8px"><span class="fc-mrow-lbl">Bilety (mecze dom.)</span><span class="fc-mrow-val pos">+${fmt(_ticketsEst)}</span></div>`;
    if(_estGad>0)html+=`<div class="fc-mrow" style="padding-left:8px"><span class="fc-mrow-lbl">Gadżety</span><span class="fc-mrow-val pos">+${fmt(_estGad)}</span></div>`;
    if(_estVip>0)html+=`<div class="fc-mrow" style="padding-left:8px"><span class="fc-mrow-lbl">VIP</span><span class="fc-mrow-val pos">+${fmt(_estVip)}</span></div>`;
    if(d.salPaid>0)html+=`<div class="fc-mrow"><span class="fc-mrow-lbl">Pensje (wyp\u0142ata)</span><span class="fc-mrow-val neg">-${fmt(d.salPaid)}</span></div>`;
    if(d.maintPaid>0)html+=`<div class="fc-mrow"><span class="fc-mrow-lbl">Stadion+Centrum+Akad.</span><span class="fc-mrow-val neg">-${fmt(d.maintPaid)}</span></div>`;
    d.events.forEach(function(ev){
      html+=`<div class="fc-mrow event"><span class="fc-mrow-lbl event">${ev.lbl}</span><span class="fc-mrow-val ${ev.inc>0?'pos':'neg'}">${ev.inc>0?'+'+fmt(ev.inc):'-'+fmt(ev.cost)}</span></div>`;
    });
    html+=`<div class="fc-mrow total"><span class="fc-mrow-lbl">BILANS</span><span class="fc-mrow-val ${d.net>=0?'pos':'neg'}">${d.net>=0?'+':''}${fmt(d.net)}</span></div>`;
    html+='</div></div>';
  });

  // Pasek sezonu
  const seasonNet=seasonInc-seasonCost;
  html+='<div class="fc-season-bar">';
  html+=`<div><div class="fc-season-lbl">PRZYCHODY S${G.season}</div><div class="fc-season-val pos">+${fmt(seasonInc)}</div></div>`;
  html+=`<div style="text-align:center"><div class="fc-season-lbl">KOSZTY S${G.season}</div><div class="fc-season-val neg">-${fmt(seasonCost)}</div></div>`;
  html+=`<div style="text-align:right"><div class="fc-season-lbl">BILANS S${G.season}</div><div class="fc-season-val ${seasonNet>=0?'pos':'neg'}">${seasonNet>=0?'+':''}${fmt(seasonNet)}</div></div>`;
  html+='</div>';

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
  if(!seasons.length){el.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:16px">Brak danych sezonowych.</div>';return;}

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
    html+=`<span style="font-weight:700;font-size:var(--fs-h2);color:${isCur?'var(--am)':'var(--wh)'}">S${s}${isCur?' \u25c4':''}</span>`;
    html+=`<span style="font-size:var(--fs-dense);color:var(--gr)">${leagueShort} \u2022 ${posStr}</span>`;
    html+='</div>';
    // Przychody / Koszty
    html+=`<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense);margin-bottom:3px">`;
    html+=`<span>\u25b2 Przychody: ${salStr}</span>`;
    html+=`<span>\u25bc Koszty: ${costStr}</span>`;
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
    html+=`<div style="text-align:right;font-weight:700;font-size:var(--fs-h2);color:${netCol}">SALDO: ${netStr}</div>`;
    html+='</div>';
  });

  // ŁĄCZNIE
  const totNet2=totNet;
  html+=`<div style="background:var(--tb);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-top:2px solid var(--gb)">`;
  html+=`<span style="font-weight:700;font-size:var(--fs-h2);color:var(--wh)">\u0141\u0104CZNIE</span>`;
  html+=`<div style="text-align:right;font-size:var(--fs-dense)">`;
  html+=`<div><span style="color:var(--gb)">+${fmt(totInc)}</span> / <span style="color:var(--rd)">-${fmt(totCost)}</span></div>`;
  html+=`<div style="font-weight:700;font-size:var(--fs-h2);color:${totNet2>=0?'var(--gb)':'var(--rd)'}">${totNet2>=0?'+':''}${fmt(totNet2)}</div>`;
  html+='</div></div>';
  html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:5px 12px 8px">\u2605 Przychody = regularne + premia + sprzeda\u017ce. Koszty = sta\u0142e + zakupy.</div>';

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
    const repMult=Math.max(0.8,Math.min(1.8,0.8+(rep||30)/1000*1.0));
    const raw=b*repMult;
    return raw<500?Math.round(raw/50)*50:Math.round(raw/500)*500;
  }

  // TV kontrakt wartość
  function tvOffer(){
    if(lvl>3&&!G.tvForced)return 0; // tylko od III Ligi
    const base={1:500000,2:150000,3:8000};
    const b=base[lvl]||0;
    return Math.round(b*(Math.max(0.5,rep/50))/100)*100;
  }

  // Wymagania
  const reqStadium=cap>=1000;
  const reqNaming=cap>=5000&&rep>=300;
  const reqTV=lvl<=3&&rep>=150;

  const sponsorTiers=[
    {minRep:0,  maxRep:49,  name:'Lokalny sklep',   color:'var(--gr)'},
    {minRep:50, maxRep:99,  name:'Regionalna firma', color:'var(--wh)'},
    {minRep:100,maxRep:199, name:'Krajowa marka',    color:'var(--am)'},
    {minRep:200,maxRep:399, name:'Duza korporacja',  color:'#4fc3f7'},
    {minRep:400,maxRep:699, name:'Sponsor premium',  color:'var(--gb)'},
    {minRep:700,maxRep:1000,name:'Globalny gigant',  color:'#ffd700'},
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
            const _repMC=Math.max(0.8,Math.min(1.8,0.8+(G.reputation||30)/1000*1.0));
            const _actual=Math.round(G.contracts[slot].weekly*_repMC);
            const _base=G.contracts[slot].weekly;
            return '<div style="font-size:var(--fs-dense);color:var(--gb)">'+fmt(_base)+'/tyg • '+seasonsLeft+' sez.</div>'+
              '<div style="font-size:var(--fs-dense);color:var(--am)">Faktycznie: <span style="color:var(--gb)">'+fmt(_actual)+'/tyg</span> (Rep ×'+_repMC.toFixed(2)+')</div>';
          })():
           '<div style="font-size:var(--fs-dense);color:var(--gr)">Brak kontraktu</div>')+
        '</div>'+
      '</div>'+
      (!hasActive?
        '<div style="font-size:var(--fs-dense);margin-bottom:3px">'+
          'Sponsor: <span style="color:'+curTier.color+'">'+curTier.name+'</span>'+
          ' <span style="color:var(--gr)">(Rep. '+curTier.minRep+'–'+curTier.maxRep+')</span>'+
        '</div>'+
        (nextTier?
          '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:5px">'+
            'Następny: <span style="color:'+nextTier.color+'">'+nextTier.name+'</span>'+
            ' przy Rep. <span style="color:var(--am)">'+nextTier.minRep+'</span>'+
            ' <span style="color:var(--gr)">(brakuje '+(nextTier.minRep-curRep)+')</span>'+
          '</div>'
        :'<div style="font-size:var(--fs-dense);color:#ffd700;margin-bottom:5px">Maksymalny poziom!</div>')
      :'')+
      (hasActive?
        '<div style="font-size:var(--fs-dense);color:var(--gb)">Aktywny kontrakt</div>'
      :!req?
        '<div style="font-size:var(--fs-dense);color:var(--rd)">'+reqMsg+'</div>'
      :weekly===0?
        '<div style="font-size:var(--fs-dense);color:var(--gr)">Brak ofert (za niska reputacja)</div>'
      :
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:5px">Oferta: <span style="color:var(--am)">+'+fmt(weekly)+'/tyg</span> • 1 sezon</div>'+
        '<button onclick="signContract(\''+slot+'\')" style="width:100%;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">PODPISZ</button>'
      )+
    '</div>';
  }
  el.innerHTML=
    '<div class="fsec">SPONSORZY</div>'+
    contractBox('shirt','Sponsor koszulki','👕',true,'',sponsorOffer('shirt'),G.contracts.shirt)+
    contractBox('stadium','Sponsor stadionu','🏟️',reqStadium,'Wymaga stadionu 1000+ miejsc',sponsorOffer('stadium'),G.contracts.stadium)+
    contractBox('naming','Naming rights','💎',reqNaming,'Wymaga 5000+ miejsc i Rep. 300+',sponsorOffer('naming'),G.contracts.naming)+
    '<div class="fsec" style="margin-top:10px">PRAWA TELEWIZYJNE</div>'+
    contractBox('tv','Kontrakt TV','📺',reqTV,lvl>3?'Dostępne od III Ligi':'Wymaga Rep. 150+',tvOffer(),G.contracts.tv);
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
  if(weekly<=0){notif('Brak ofert!','err');return;}
  G.contracts[slot]={weekly,seasonsLeft:1,slot};
  addNews(t('news_sponsor_signed').replace('{slot}',({shirt:t('sponsor_slot_shirt'),stadium:t('sponsor_slot_stadium'),naming:t('sponsor_slot_naming'),tv:t('sponsor_slot_tv')}[slot]||slot)).replace('{val}',fmt(weekly)),'club');
  notif('Kontrakt podpisany: +'+fmt(weekly)+'/tyg!','ok');
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
    if(t.type==='sell')allEvents[w].push({lbl:'\u2794 SPR: '+t.name+(t.club?' \u2192'+t.club:''),inc:t.val||0,cost:0});
    else allEvents[w].push({lbl:'\u2794 KUP: '+t.name,inc:0,cost:t.val||t.fee||0});
  });

  if(!weekly.length){el.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:16px">Brak historii \u2014 zacznij sezon aby zobaczy\u0107 dane finansowe.</div>';return;}

  let html='<div style="font-weight:700;font-size:var(--fs-h2);color:var(--gr);padding:6px 0 8px;letter-spacing:1px">SEZON '+G.season+' — '+weekly.length+' TYGODNI</div>';
  html+='<table style="width:100%;border-collapse:collapse;font-size:var(--fs-dense)">';
  html+='<thead><tr>';
  html+='<th style="text-align:left;padding:4px 5px;border-bottom:2px solid var(--gl);font-weight:700;font-size:var(--fs-h2);color:var(--gr)">TYG</th>';
  html+='<th style="text-align:right;padding:4px 5px;border-bottom:2px solid var(--gl);font-weight:700;font-size:var(--fs-h2);color:var(--gb)">PRZYCH.</th>';
  html+='<th style="text-align:right;padding:4px 5px;border-bottom:2px solid var(--gl);font-weight:700;font-size:var(--fs-h2);color:var(--rd)">KOSZTY</th>';
  html+='<th style="text-align:right;padding:4px 5px;border-bottom:2px solid var(--gl);font-weight:700;font-size:var(--fs-h2);color:var(--am)">STAN</th>';
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
      html+=`<td style="padding:4px 5px;color:var(--gr)">T${w}${isPayWeek?' <span style="color:var(--am)">\u2605</span>':''}</td>`;
      html+=`<td style="text-align:right;padding:4px 5px;color:var(--gb)">${h.inc?'+'+fmt(h.inc):'\u2014'}</td>`;
      html+=`<td style="text-align:right;padding:4px 5px;color:var(--rd)">${totalCost>0?'-'+fmt(totalCost):'\u2014'}</td>`;
      html+=`<td style="text-align:right;padding:4px 5px;color:var(--am)">${fmt(h.bal)}</td>`;
      html+='</tr>';
    }
    // Zdarzenia jednorazowe tego tygodnia
    (allEvents[w]||[]).forEach(function(ev){
      html+='<tr style="background:#080f08">';
      html+=`<td colspan="2" style="padding:2px 5px 2px 12px;color:var(--am);font-size:var(--fs-dense)">\u21b3 ${ev.lbl}</td>`;
      html+=`<td style="text-align:right;padding:2px 5px;font-size:var(--fs-dense);color:${ev.inc>0?'var(--gb)':'var(--rd)'}">${ev.inc>0?'+'+fmt(ev.inc):'-'+fmt(ev.cost)}</td>`;
      html+=`<td style="padding:2px 5px;color:var(--gr);text-align:right">\u2014</td>`;
      html+='</tr>';
    });
  });

  html+='</tbody></table>';
  html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:4px 0 8px">\u2605 = tydzie\u0144 wyp\u0142aty pensji (co 4 tyg.).</div>';
  el.innerHTML=html;
}

// ETAP 5 - AKADEMIA JUNIOROW
