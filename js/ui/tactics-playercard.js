function mkCard(p){const o=ovr(p);const isSt=p.starter;const susp=p.suspension&&p.suspension>0;const d=document.createElement('div');d.className='pcard2 '+(isSt?'st':'bn');if(susp||p.injured)d.style.borderLeft='4px solid var(--rd)';
d.innerHTML='<div style="flex:1;min-width:0"><div class="pc2-name-text '+(isSt?'':'bn')+'">'+p.name+'</div><div class="pc2-row2">'+p.age+t('tr_age_suffix')+' • <span class="pc2-ovr-green">OVR '+o+'</span></div><div class="pc2-row2"><span class="pc2-value">'+fmtVal(p.value)+'</span> • '+t('mkcard_contract_line').replace('{n}',p.contract)+'</div></div><div style="text-align:right;font-size:var(--fs-dense);color:var(--gr);white-space:nowrap;flex-shrink:0">'+
(p.pos==='GK'?'📅 <b style="color:var(--wh)">'+p.st.m+'</b> 🛡️ <b style="color:var(--gb)">'+(p.st.cs||0)+'</b> 🔴 <b style="color:var(--rd)">'+(p.st.ga||0)+'</b>':'📅 <b style="color:var(--wh)">'+p.st.m+'</b> ⚽ <b style="color:var(--am)">'+p.st.g+'</b> 🤝 <b style="color:var(--gb)">'+p.st.a+'</b>')+'</div>';
d.onclick=()=>showPlayer(p);return d;}

function tacTab(tab,btn){
  document.querySelectorAll('#p-tactics .sq-tab2-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  ['tac-pane-ustawienia','tac-pane-sklad'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.classList.remove('on');
  });
  const el=document.getElementById('tac-pane-'+tab);if(el)el.classList.add('on');
  if(tab==='sklad')fillTacSquad();
  if(tab==='ustawienia'){fillTactics();fillPitch();}
}

function calcReadiness(p){
  const o=ovr(p);
  const fm=p.form||75;
  const fat=p.fatigue||0;
  return Math.round((o/99*0.5 + fm/100*0.3 + (100-fat)/100*0.2)*100);
}

function mkTacCard(p){
  const o=ovr(p);const isSt=p.starter;
  const susp=p.suspension&&p.suspension>0;
  const fat=Math.round(p.fatigue||0);
  const fm=p.form||75;
  const ready=calcReadiness(p);
  // Gotowość: kolor i ikona
  const readyCol=ready>=70?'var(--gb)':ready>=50?'var(--am)':'var(--rd)';
  const readyIcon=p.injured?'🔴':susp?'🟡':fat>70?'🔴':fat>50?'🟡':fm<50?'🔴':fm<65?'🟡':'🟢';
  const readyLbl=p.injured?t('tac_status_injured_weeks').replace('{n}',p.injuryWeeks):susp?t('tac_status_suspended'):fat>70?t('tac_status_exhausted'):fat>50?t('tac_status_tired'):fm<50?t('tac_status_poor_form'):'';
  // Pasek gotowości
  const barFill=Math.max(0,Math.min(100,ready));
  const barCol=ready>=70?'var(--gb)':ready>=50?'var(--am)':'var(--rd)';
  const fmCol=fm>=80?'var(--gb)':fm>=65?'var(--am)':'var(--rd)';
  const fatCol=fat>70?'var(--rd)':fat>50?'var(--am)':'var(--gb)';

  const d=document.createElement('div');
  d.className='pcard2 '+(isSt?'st':'bn');
  d.style.cssText+='position:relative;padding:8px 10px;';
  if(p.injured||susp)d.style.borderLeft='4px solid var(--rd)';
  else if(fat>50||fm<65)d.style.borderLeft='4px solid var(--am)';

  d.innerHTML=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
      '<div style="display:flex;align-items:center;gap:6px">'+
        '<span style="font-size:var(--fs-body)">'+readyIcon+'</span>'+
        '<div>'+
          '<div class="pc2-name-text '+(isSt?'':'bn')+'">'+p.name+'</div>'+
          '<div style="font-size:var(--fs-dense);color:var(--gr)">'+
            (POS_SHORT[p.pos]||p.pos)+' • '+p.age+t('tr_age_suffix')+' • OVR '+o+
          '</div>'+
        '</div>'+
      '</div>'+
      '<button class="btog2 '+(isSt?'add':'rem')+'" onclick="event.stopPropagation();togSt('+p.id+');fillTacSquad()">'+(isSt?t('tac_squad_badge_in'):t('tac_squad_badge_add'))+'</button>'+
    '</div>'+
    // Statystyki w jednej linii
    '<div style="display:flex;gap:10px;font-size:var(--fs-dense);margin-bottom:4px">'+
      '<span style="color:var(--gr)">'+t('tac_fm_label')+' <span style="color:'+fmCol+'">'+fm+'%</span></span>'+
      '<span style="color:var(--gr)">'+t('tac_fat_label')+' <span style="color:'+fatCol+'">'+fat+'%</span></span>'+
      (readyLbl?'<span style="color:var(--rd)">'+readyLbl+'</span>':'')+
    '</div>'+
    // Pasek gotowości
    '<div style="display:flex;align-items:center;gap:6px">'+
      '<div style="flex:1;height:5px;background:#0d1f0d;border:1px solid var(--gl)">'+
        '<div style="height:100%;background:'+barCol+';width:'+barFill+'%"></div>'+
      '</div>'+
      '<span style="font-size:var(--fs-dense);color:'+readyCol+';min-width:32px;text-align:right">'+ready+'%</span>'+
    '</div>';

  d.onclick=()=>showPlayer(p);return d;
}

function togSt(id){const p=G.players.find(x=>x.id===id);if(!p)return;if(p.onCamp||p.onIndCamp){notif(t('tac_notif_on_camp').replace('{name}',p.name),'err');return;}if(p.injured){notif(t('tac_notif_injured').replace('{name}',p.name).replace('{type}',p.injuryType).replace('{n}',p.injuryWeeks),'err');return;}if(p.suspension>0){notif(t('tac_notif_suspended').replace('{name}',p.name).replace('{n}',p.suspension),'err');return;}if(p.starter){p.starter=false;}else{const lim=formationLimits();const st=myPl().filter(x=>x.starter);if(st.filter(x=>x.pos===p.pos).length>=lim[p.pos]){notif(t('tac_notif_pos_limit').replace('{pos}',POS_SHORT[p.pos]),'err');return;}if(st.length>=11){notif(t('tac_notif_squad_full'),'err');return;}p.starter=true;}updateHdr();}

function fillTacSquad(){
  if(!G)return;
  const all=myPl();
  const st=all.filter(p=>p.starter).length;
  const lim=formationLimits();
  const se=document.getElementById('sq-st-count');if(se)se.textContent=st+'/11';
  const sc2=document.getElementById('tac-sklad-count');if(sc2)sc2.textContent=st+'/11';
  const te=document.getElementById('sq-total-count2');if(te)te.textContent=all.length;
  const slots=[['sq-slot-gk','GK×1'],['sq-slot-cb','OBR×'+lim.OBR],['sq-slot-mid','POL×'+lim.POL],['sq-slot-st','NAP×'+lim.NAP]];
  slots.forEach(([id,txt])=>{const el=document.getElementById(id);if(el)el.textContent=txt;});
  const con=document.getElementById('tac-sq-all');if(!con)return;
  con.innerHTML='';
  const tbl=document.createElement('table');
  tbl.style.cssText='width:100%;border-collapse:collapse;font-size:var(--fs-dense)';
  const thead=document.createElement('thead');
  thead.innerHTML='<tr style="border-bottom:1px solid var(--gl)">'+
    '<th style="padding:5px 14px;color:var(--gr);text-align:left;font-size:var(--fs-dense)">'+t('tac_col_player')+'</th>'+
    '<th style="color:var(--gr);text-align:right;font-size:var(--fs-dense)">'+t('tac_col_ovr')+'</th>'+
    '<th style="color:var(--gr);text-align:right;font-size:var(--fs-dense)">'+t('tac_col_fm')+'</th>'+
    '<th style="color:var(--gr);text-align:right;padding-right:6px;font-size:var(--fs-dense)">'+t('tac_col_fat')+'</th>'+
    '<th style="color:var(--gr);text-align:center;padding-right:10px;font-size:var(--fs-dense)"></th>'+
  '</tr>';
  tbl.appendChild(thead);
  const fl=all.slice().sort((a,b)=>posOrd(a.pos)-posOrd(b.pos)||calcReadiness(b)-calcReadiness(a));
  POS_GROUPS.forEach(pg=>{
    const grp=fl.filter(p=>p.pos===pg.key);
    if(!grp.length)return;
    const stI=grp.filter(p=>p.starter).length;
    const gHdr=document.createElement('tr');
    gHdr.innerHTML='<td colspan="5" style="padding:6px 14px 3px;font-size:var(--fs-dense);color:var(--am);background:#0d1f0d;border-bottom:1px solid var(--gl)">'+t('posgrp_'+pg.key.toLowerCase()).toUpperCase()+' '+t('tac_in_squad').replace('{n}',stI).replace('{m}',lim[pg.key])+'</td>';
    tbl.appendChild(gHdr);
    grp.forEach(p=>{
      const o=ovr(p);const fm=p.form||75;const fat=Math.round(p.fatigue||0);
      const isSt=p.starter;const susp=p.suspension>0;
      const fmCol=fm>=80?'var(--gb)':fm>=65?'var(--am)':'var(--rd)';
      const fatCol=fat>70?'var(--rd)':fat>50?'var(--am)':'var(--gb)';
      const ovrCol=o>=70?'var(--gb)':o>=50?'var(--am)':'var(--wh)';
      const rowBg=p.injured||susp?'#1a0000':fat>70||fm<50?'#1a1000':'';
      const icon=p.injured?'[K]':susp?'[Z]':fat>70?'[P]':fat>50||fm<65?'[!]':'[OK]';
      const iconCol=p.injured||fat>70?'var(--rd)':fat>50||fm<65?'var(--am)':'var(--gb)';
      const tr=document.createElement('tr');
      tr.style.cssText='border-bottom:1px solid #0d1f0d;cursor:pointer;'+(rowBg?'background:'+rowBg+';':'');
      tr.innerHTML=
        '<td style="padding:5px 14px">'+
          '<span style="color:'+iconCol+';margin-right:4px;font-size:var(--fs-dense)">'+icon+'</span>'+
          '<span style="color:'+(isSt?'var(--wh)':'var(--gr)')+'">'+p.name+'</span>'+
          (isSt?'<span style="color:var(--am);font-size:var(--fs-dense);margin-left:4px">✔</span>':'')+
        '</td>'+
        '<td style="text-align:right;color:'+ovrCol+'">'+o+'</td>'+
        '<td style="text-align:right;color:'+fmCol+'">'+fm+'%</td>'+
        '<td style="text-align:right;color:'+fatCol+';padding-right:6px">'+fat+'%</td>'+
        '<td style="text-align:center;padding-right:10px">'+
          (p.injured?'<span style="font-size:var(--fs-dense);color:var(--rd)">'+t('tac_injured')+'</span>':
           susp?'<span style="font-size:var(--fs-dense);color:var(--rd)">'+t('tac_suspended')+'</span>':
          '<button onclick="event.stopPropagation();togSt('+p.id+');fillTacSquad()" '+
            'style="font-size:var(--fs-dense);padding:2px 8px;cursor:pointer;'+
            'background:'+(isSt?'var(--gm)':'var(--tb)')+';'+
            'border:1px solid '+(isSt?'var(--gb)':'var(--gl)')+';'+
            'color:'+(isSt?'var(--gb)':'var(--gr)')+'">'+
            (isSt?t('tac_btn_in'):t('tac_btn_add'))+
          '</button>')+
        '</td>';
      tr.onclick=()=>showPlayer(p);
      tbl.appendChild(tr);
    });
  });
  con.appendChild(tbl);
  fillPitch();
}

function autoSelectSquad(){if(!G)return;const lim=formationLimits();const pl=myPl();pl.forEach(p=>p.starter=false);function best(pos,n){return pl.filter(p=>p.pos===pos&&!p.injured&&(!p.suspension||p.suspension<=0)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,n);}[...best('GK',1),...best('OBR',lim.OBR),...best('POL',lim.POL),...best('NAP',lim.NAP)].forEach(p=>p.starter=true);fillTacSquad();fillSquad();updateHdr();notif(t('tac_auto_squad_notif').replace('{f}',G.formation),'ok');}

function fillPitch(){if(!G)return;const st=myPl().filter(p=>p.starter).sort((a,b)=>posOrd(a.pos)-posOrd(b.pos));const avg=st.length?Math.round(st.reduce((s,p)=>s+ovr(p),0)/st.length):0;const po=document.getElementById('pitch-ovr');if(po){
    const hasCamp=mySt().some(p=>p.campBonusRounds>0);
    if(hasCamp){
      po.innerHTML=t('tac_avg_ovr_camp').replace('{n}',avg)+'<span style="color:var(--am)">'+t('tac_camp_bonus')+'</span>';
    } else {
      po.textContent=t('tac_avg_ovr_camp').replace('{n}',avg);
    }
  }const field=document.getElementById('pitch-field');if(!field)return;field.innerHTML='';if(!st.length){field.innerHTML='<div style="color:var(--gr);text-align:center;padding:20px;font-size:var(--fs-dense)">'+t('tac_no_players')+'</div>';return;}function row(pl,cls,lbl){if(!pl.length)return;const ld=document.createElement('div');ld.style.cssText="text-align:center;font-size:var(--fs-dense);color:rgba(255,255,255,0.3);margin-top:4px";ld.textContent=lbl;field.appendChild(ld);const rd=document.createElement('div');rd.className='pitch-row';pl.forEach(p=>{const el=document.createElement('div');el.className='pp '+(cls||'');el.style.cursor='pointer';el.innerHTML='<span class="pp-name">'+p.name.split(' ')[1].substring(0,8)+'</span><span class="pp-ovr">OVR '+ovr(p)+'</span>';el.onclick=()=>showPlayer(p);rd.appendChild(el);});field.appendChild(rd);}
row(st.filter(p=>p.pos==='NAP'),'',t('tac_row_strikers'));row(st.filter(p=>p.pos==='POL'),'',t('tac_row_mids'));row(st.filter(p=>p.pos==='OBR'),'',t('tac_row_defs'));row(st.filter(p=>p.pos==='GK'),'gk',t('tac_row_gk'));}

function _styleLabel(s){
  return {'Defensywny':t('tac_style_def'),'Zrównoważony':t('tac_style_bal'),'Ofensywny':t('tac_style_off')}[s]||s;
}
function fillTactics(){if(!G)return;
  if(!G.pressing)G.pressing='Normalny';
  if(!G.line)G.line='Normalna';
  if(!G.instruction||G.instruction==='Bezpośrednia')G.instruction='Długie piłki';
  const fms=['4-4-2','4-3-3','3-5-2','5-3-2','3-4-3','4-5-1'];
  const sts=['Defensywny','Zrównoważony','Ofensywny'];
  const stsLbl={'Defensywny':_styleLabel('Defensywny'),'Zrównoważony':_styleLabel('Zrównoważony'),'Ofensywny':_styleLabel('Ofensywny')};
  const prs=['Niski','Normalny','Wysoki'];
  const prsLbl={'Niski':t('tac_press_low'),'Normalny':t('tac_press_normal'),'Wysoki':t('tac_press_high')};
  const lns=['Niska','Normalna','Wysoka'];
  const lnsLbl={'Niska':t('tac_line_low'),'Normalna':t('tac_line_normal'),'Wysoka':t('tac_line_high')};
  const ins=['Posiadanie','Długie piłki','Kontry'];
  const insLbl={'Posiadanie':t('tac_instr_poss'),'Długie piłki':t('tac_instr_long'),'Kontry':t('tac_instr_counter')};
  const fg=document.getElementById('form-grid');if(fg)fg.innerHTML=fms.map(f=>'<div class="formation-option '+(G.formation===f?'selected':'')+'" onclick="setForm(\''+f+'\')">'+f+'</div>').join('');
  const sg=document.getElementById('style-grid');if(sg)sg.innerHTML=sts.map(s=>'<div class="style-option '+(G.style===s?'selected':'')+'" onclick="setSty(\''+s+'\',this)">'+stsLbl[s]+'</div>').join('');
  const tg=document.getElementById('tempo-grid');if(tg)tg.style.display='none';const tgp=document.getElementById('sect-tempo');if(tgp)tgp.style.display='none';
  const pg=document.getElementById('press-grid');if(pg)pg.innerHTML=prs.map(p=>'<div class="style-option '+(G.pressing===p?'selected':'')+'" onclick="setPres(\''+p+'\',this)">'+prsLbl[p]+'</div>').join('');
  const lg=document.getElementById('line-grid');if(lg)lg.innerHTML=lns.map(l=>'<div class="style-option '+(G.line===l?'selected':'')+'" onclick="setLine(\''+l+'\',this)">'+lnsLbl[l]+'</div>').join('');
  const ig=document.getElementById('instr-grid');if(ig)ig.innerHTML=ins.map(i=>'<div class="style-option '+(G.instruction===i?'selected':'')+'" onclick="setInstr(\''+i+'\',this)">'+insLbl[i]+'</div>').join('');
}
function setForm(f){if(!G||G.formation===f)return;G.formation=f;autoSelectSquad();fillTactics();updateHdr();}
function setPres(v,el){if(!G)return;G.pressing=v;document.querySelectorAll('#press-grid .style-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function setLine(v,el){if(!G)return;G.line=v;document.querySelectorAll('#line-grid .style-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function setInstr(v,el){if(!G)return;G.instruction=v;document.querySelectorAll('#instr-grid .style-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function setSty(s,el){if(!G)return;G.style=s;document.querySelectorAll('#style-grid .style-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function setTem(t,el){if(!G)return;G.tempo=t;document.querySelectorAll('#tempo-grid .style-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function setPress(p,el){if(!G)return;G.pressing=p;document.querySelectorAll('#press-grid .style-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function setLine(l,el){if(!G)return;G.line=l;document.querySelectorAll('#line-grid .style-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function setInstr(i,el){if(!G)return;G.instruction=i;document.querySelectorAll('#instr-grid .style-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}

function showPlayerFromClubModal(pid){
  // Otwiera kartę zawodnika bez mrugania — modal klubu zamykany PO otwarciu panelu gracza
  const p=G.players.find(x=>x.id===pid);
  if(!p)return;
  showPlayer(p);
  // Ustaw z-index panelu gracza wyżej niż modal klubu, zamknij modal
  const pp=document.getElementById('p-player');
  // zIndex panelu usunięty - wyłączność panelu pilnuje MutationObserver
  closeClubModal();
}
function _traitLabel(id){return t('trait_'+id+'_name')||TRAITS[id]&&TRAITS[id].name||id;}
function _traitDesc(id){return t('trait_'+id+'_desc')||TRAITS[id]&&TRAITS[id].desc||'';}
// v223: jeden, ogólny mechanizm powrotu z karty zawodnika — zastępuje 4 osobne flagi
// (_playerReturnTo/'club-squad', _mssPlayerReturn, _playerReturnToClub, _matchDetailReturn).
// Wywoływane automatycznie z showPlayer() — pojedyncze miejsce w kodzie, żadne z ~20 miejsc
// otwierających kartę zawodnika nie musi już samo pamiętać o zapisaniu punktu powrotu.
function _captureReturnPoint(){
  const mdOv=document.getElementById('md-overlay');
  if(mdOv&&mdOv.classList.contains('open')&&window._curMatchDetailIdx!=null){
    return{modalId:'md-overlay',extra:{idx:window._curMatchDetailIdx,src:window._curMatchDetailSrc}};
  }
  const mss=document.getElementById('modal-season-summary');
  if(mss&&mss.style.display==='flex'){
    return{modalId:'modal-season-summary'};
  }
  const cmAi=document.getElementById('modal-club-ai');
  if(cmAi&&cmAi.style.display==='flex'&&typeof _cmClubId!=='undefined'&&_cmClubId){
    let _tab='karta';
    ['karta','sklad','historia'].forEach(function(tb){
      const pane=document.getElementById('cm-pane-'+tb);
      if(pane&&pane.style.display==='block')_tab=tb;
    });
    return{modalId:'modal-club-ai',extra:{clubId:_cmClubId,tab:_tab}};
  }
  const openPanelEl=document.querySelector('.panel.open');
  if(openPanelEl&&openPanelEl.id!=='p-player'){
    return{panelId:openPanelEl.id};
  }
  // v228: klik na MVP na ekranie podsumowania meczu — to osobny .view, nie panel/modal
  const msView=document.getElementById('v-match-summary');
  if(msView&&msView.classList.contains('show')){
    return{viewId:'v-match-summary'};
  }
  return null;
}
function showPlayer(p){
  if(!p)return;
  // v223: zapamiętaj skąd wchodzimy — tylko przy pierwszym otwarciu, nie przy odświeżeniu
  // już otwartej karty (np. po zmianie języka w applyLang(), patrz core/i18n.js)
  const _pEl0=document.getElementById('p-player');
  if(!(_pEl0&&_pEl0.classList.contains('open'))){
    window._playerReturnTo=_captureReturnPoint();
  }
  if(!p.name)p.name=t('plr_fallback_unknown');
  window._plrId=p.id;
  const o=ovr(p);
  const isOwn=p.clubId===G.myClubId;
  const plrClub=p.clubId>0?ALL_CLUBS.find(c=>c.id===p.clubId):null;
  p.value=calcValue(o,p.age);
  if(p.age<=22&&(p.potential-o)>10)p.value=Math.round(p.value*1.2);

  const plrTitle=document.getElementById('plr-panel-title');if(plrTitle)plrTitle.textContent=p.name.toUpperCase();
  // PIXEL FACE + KIT
  var _pxFaceEl=document.getElementById('plr-px-face');
  if(_pxFaceEl&&typeof pxFace==='function'){
    _pxFaceEl.innerHTML='';
    var _fcv=pxFace(p.id,4,p.age);
    _fcv.title='ID: '+p.id;
    _pxFaceEl.appendChild(_fcv);
  }
  var _pxKitEl=document.getElementById('plr-px-kit');
  if(_pxKitEl&&typeof pxKit==='function'){
    _pxKitEl.innerHTML='';
    if(p.clubId>0){_pxKitEl.appendChild(pxKit(p.clubId,p.jerseyNum||0,2));}
  }

  // STATUS
  const statusBar=document.getElementById('plr-status-bar');
  if(statusBar){
    let stxt,scol;
    if(p.injured){stxt=t('plr_status_injured').replace('{n}',p.injuryWeeks);scol='var(--rd)';}
    else if(p.suspension>0){stxt=t('plr_status_suspended').replace('{n}',p.suspension);scol='var(--am)';}
    else if(p.contract<=0){stxt=t('plr_status_nocontract');scol='var(--rd)';}
    else{stxt=t('plr_status_available');scol='var(--gb)';}
    const _fat2=p.fatigue||0;
    const _fatCol2=_fat2>70?'var(--rd)':_fat2>50?'var(--am)':'var(--gb)';
    const _fatLbl2=_fat2>70?t('plr_fat_exhausted'):_fat2>50?t('plr_fat_tired'):t('plr_fat_ok');
    statusBar.innerHTML='<span style="color:'+scol+'">'+stxt+'</span><div style="margin-top:3px;font-size:var(--fs-dense);color:var(--gr)">'+t('plr_fat_label')+' <span style="color:'+_fatCol2+'">'+_fat2+'% '+_fatLbl2+'</span></div><div style="height:4px;background:#111;margin-top:2px"><div style="height:100%;background:'+_fatCol2+';width:'+_fat2+'%"></div></div>';
  }
  // IMIĘ
  const nameEl=document.getElementById('plr-name');
  if(nameEl)nameEl.innerHTML=p.name.toUpperCase()+(p.jerseyNum?' #'+p.jerseyNum:'')+(p.status==='retired'?' <span style="color:var(--gr);font-size:var(--fs-body)">'+t('plr_retired_badge')+'</span>':'');

  // KLUB + POZYCJA + WIEK
  const clubLine=document.getElementById('plr-club-line');
  if(clubLine){
    const retiredNote=p.status==='retired'?t('plr_retired_since').replace('{n}',p.retiredSeason||'?'):'';
    const acadBadge=p.fromAcademy?' 🎓':'';
    var _arch6=p.archetype&&ARCHETYPE_META[p.archetype]?ARCHETYPE_META[p.archetype]:null;
    clubLine.innerHTML=(plrClub?'<span style="cursor:pointer;text-decoration:underline;color:var(--gb)" onclick="closePanel(\'p-player\');setTimeout(function(){openClubModal('+plrClub.id+');},220);">'+plrClub.n+'</span>':p.status==='retired'?t('plr_retired_label'):t('plr_free_agent'))+' • '+(POS_SHORT[p.pos]||p.pos)+' • '+p.age+' '+t('mkcard_age_years')+acadBadge+retiredNote+(_arch6?' <span style="font-size:var(--fs-dense);color:'+_arch6.color+'">&nbsp;'+_arch6.icon+' '+t('arch_'+p.archetype)+'</span>':'');
  }
  // TRAITS ICONS - ukryte (przeniesione do CHARAKTER)
  const traitsIcons=document.getElementById('plr-traits-icons');
  if(traitsIcons)traitsIcons.style.display='none';

  // SPRZEDAJ + WARTOŚĆ
  const sellBar=document.getElementById('plr-sell-bar');
  if(sellBar)sellBar.style.display=isOwn?'flex':'none';
  const valLine=document.getElementById('plr-value-line');
  if(valLine)valLine.textContent=t('plr_value_label').replace('{n}',fmtVal(p.value));

  // KONTRAKT
  const contractLine=document.getElementById('plr-contract-line');
  if(contractLine){
    const cCol=p.contract<=1?'var(--rd)':p.contract<=2?'var(--am)':'var(--wh)';
    contractLine.innerHTML='<span style="color:'+cCol+'">'+ t('plr_contract_seasons').replace('{n}',p.contract)+'</span>'+t('plr_contract_salary').replace('{n}',fmt(p.salary||0))+(p.contract<=0?' ⚠️':'');
  }
  const extSection=document.getElementById('plr-ext-section');
  if(extSection)extSection.style.display=isOwn?'block':'none';
  if(isOwn)renderExt(p);

  // PROFIL — OVR/POT/FORMA/WIEK
  // OVR i POT ukryte dla zawodników AI (odkrywane przez skauta)
  const _isObserved=p._observed||p._isTalent||(G.scout&&G.scout.observed&&G.scout.observed.find&&G.scout.observed.find(x=>x.id===p.id));
  const ovrEl=document.getElementById('plr-ovr-val');
  if(ovrEl){
    if(isOwn||_isObserved){
      ovrEl.textContent=o;
      ovrEl.style.color='var(--gb)';
    } else {
      ovrEl.textContent='?';
      ovrEl.style.color='var(--gr)';
      ovrEl.title=t('plr_ovr_hint');
    }
  }
  const potEl=document.getElementById('plr-pot-val');
  if(potEl){
    if(isOwn||_isObserved){
      potEl.textContent=p.potential;
      potEl.style.color='var(--am)';
    } else {
      potEl.textContent='?';
      potEl.style.color='var(--gr)';
      potEl.title=t('plr_pot_hint');
    }
  }
  const formEl=document.getElementById('plr-form-val');
  if(formEl){const fc=p.form>=75?'var(--gb)':p.form>=50?'var(--am)':'var(--rd)';formEl.innerHTML='<span style="color:'+fc+'">'+p.form+'%</span>';}
  const ageEl=document.getElementById('plr-age-val');if(ageEl)ageEl.textContent=p.age;
  const _potLbl=document.getElementById('plr-pot-label');if(_potLbl)_potLbl.textContent=t('plr_pot_title');
  const _formLbl=document.getElementById('plr-form-label');if(_formLbl)_formLbl.textContent=t('plr_form_title');
  const _charLbl=document.getElementById('plr-charakter-label');if(_charLbl)_charLbl.textContent=t('plr_charakter_label');
  const _histSznLbl=document.getElementById('plr-hist-season-lbl');if(_histSznLbl)_histSznLbl.textContent=t('plr_hist_season_label');
  const _histSeasonLbl=document.getElementById('plr-hist-seasons-lbl');if(_histSeasonLbl)_histSeasonLbl.textContent=t('plr_hist_seasons_label');
  const posLine=document.getElementById('plr-pos-line');
  if(posLine)posLine.textContent=p.retiring?t('plr_retiring_soon'):'';

  // CHARAKTER
  const charDiv=document.getElementById('plr-charakter');
  if(charDiv){
    const traits=p.traits||[];
    const discovered=(p.trainMatches||0)>=5;
    const tr=p.trainRate||1.0;
    const talentLabel=tr<0.85?t('plr_talent_slow'):tr<1.10?t('plr_talent_normal'):tr<1.50?t('plr_talent_fast'):t('plr_talent_star');
    const talentCol=tr<0.85?'var(--rd)':tr<1.10?'var(--wh)':tr<1.50?'var(--am)':'#00e676';
    charDiv.innerHTML=
      '<div style="color:var(--gr);margin-bottom:6px">'+t('plr_talent_label')+' <span style="color:'+(discovered?talentCol:'var(--gr)')+'">'+(discovered?talentLabel:t('plr_talent_unknown').replace('{n}',p.trainMatches||0))+'</span></div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">'+
      traits.map(tid=>{
        const tr2=TRAITS[tid];if(!tr2)return'';
        return '<div style="text-align:center;flex:1">'+
          '<div style="font-size:var(--fs-display)">'+tr2.icon+'</div>'+
          '<div style="color:'+tr2.color+'">'+_traitLabel(tid)+'</div>'+
          '<div style="color:var(--gr);margin-top:2px">'+_traitDesc(tid)+'</div>'+
        '</div>';
      }).join('')+
      '</div>';
  }

  // INFO EXTRA
  const infoExtra=document.getElementById('plr-info-extra');
  if(infoExtra){
    let extras=[];
    if(p.campBonusRounds>0)extras.push(t('plr_camp_bonus').replace('{n}',p.campBonusRounds));
    infoExtra.innerHTML=extras.map(e=>'<div style="font-size:var(--fs-meta);color:var(--am);margin-top:4px">'+e+'</div>').join('');
  }

  // ATRYBUTY — ukryte dla AI (tylko własni i obserwowani przez skauta)
  const icns=['⚽','🎯','⚡','🛡','💪','🧠'];
  const attrs=[{name:t('attr_tec'),key:'tec'},{name:t('attr_pas'),key:'pas'},{name:t('attr_sht'),key:'sht'},{name:t('attr_def'),key:'def'},{name:t('attr_phy'),key:'phy'},{name:t('attr_men'),key:'men'}];
  const _attrBarEl=document.getElementById('plr-attr-bars');
  if(!isOwn&&!_isObserved){
    _attrBarEl.innerHTML='<div style="font-size:var(--fs-dense);color:var(--gr);padding:16px 0;text-align:center">'+
      t('plr_attrs_hidden')+'<br><span style="font-size:var(--fs-dense)">'+t('plr_attrs_hint')+'</span></div>';
  } else {
    _attrBarEl.innerHTML=attrs.map((a,i)=>{
      const v=p[a.key]||0;
      const seasonSnap=p.seasonStartAttrs||null;
      const base=seasonSnap&&seasonSnap[a.key]!==undefined?seasonSnap[a.key]:v;
      const d=v-base;
      const c=v>=70?'#4caf50':v>=40?'#ffc107':'#f44336';
      const gainCol=d>0?'#00e676':'#ff1744';
      const barHtml=d>0
        ?'<div class="plr2-attr-fill" style="width:'+base+'%;background:'+c+'"></div><div style="width:'+d+'%;background:'+gainCol+';height:100%;opacity:0.85"></div>'
        :d<0
        ?'<div class="plr2-attr-fill" style="width:'+v+'%;background:'+c+'"></div><div style="width:'+Math.abs(d)+'%;background:#ff1744;height:100%;opacity:0.5"></div>'
        :'<div class="plr2-attr-fill" style="width:'+v+'%;background:'+c+'"></div>';
      const dStr=d>0?'<span style="color:#00e676"> +'+d+'</span>':d<0?'<span style="color:#ff1744"> '+d+'</span>':'';
      return '<div class="plr2-attr-row"><span class="plr2-attr-icon">'+icns[i]+'</span><div class="plr2-attr-fill-wrap"><div class="plr2-attr-label">'+a.name+'</div><div class="plr2-attr-bar" style="display:flex;overflow:hidden">'+barHtml+'</div></div><span class="plr2-attr-val" style="color:'+c+'">'+v+dStr+'</span></div>';
    }).join('');
  }

  // STATYSTYKI BIEŻĄCE — renderowane przez renderPlayerHistory (razem z przełącznikiem widoku)
  window._plrHistView='all';

  // HISTORIA — renderuj przez wspólną funkcję (też aktualizuje plr-cur-stats)
  renderPlayerHistory(p);

  // Pokaż/ukryj zakładkę WYCHOWANEK
  var _acadTabBtn=document.getElementById('plr-acad-tab-btn');
  if(_acadTabBtn)_acadTabBtn.style.display=p.fromAcademy?'':'none';
  openPanel('p-player');
}

function plrTab(tab,btn){
  document.querySelectorAll('#p-player .sq-tab2-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  ['plr-profil','plr-attrs','plr-hist','plr-acad','plr-nagr'].forEach(function(id){var e=document.getElementById(id);if(e)e.classList.remove('on');});
  var e=document.getElementById('plr-'+tab);if(e)e.classList.add('on');
  if(tab==='hist'&&window._plrId){
    var p7=G&&G.players&&G.players.find(function(x){return x.id===window._plrId;});
    if(p7) renderPlayerHistory(p7);
  }
  if(tab==='nagr'&&window._plrId){
    var p7n=G&&G.players&&G.players.find(function(x){return x.id===window._plrId;});
    if(p7n) renderPlayerAwards(p7n);
  }
  if(tab==='acad'&&window._plrId){
    var p7a=G&&G.players&&G.players.find(function(x){return x.id===window._plrId;});
    if(p7a) renderAcadHistoryTab(p7a);
  }
}

function renderPlayerHistory(p){
  const htbl=document.getElementById('plr-hist-stats');
  if(!htbl)return;
  const isGK=p.pos==='GK';
  const hist=(p.history||[]).filter(h=>{
    if(h._placeholder){
      const real=(p.history||[]).find(x=>x.season===h.season&&!x._placeholder&&!x._current&&(x.m||0)>0);
      return !real;
    }
    if(h._current){
      const real=(p.history||[]).find(x=>x.season===h.season&&x.clubId===h.clubId&&!x._current&&!x._placeholder);
      return !real;
    }
    if(h.season===G.season&&!G.seasonEnded&&(h.m||0)===0)return false;
    return true;
  }).sort((a,b)=>a.season-b.season);
  const ratCol=r=>r>=8?'var(--am)':r>=7?'var(--gb)':r>=6?'var(--wh)':'var(--rd)';

  // ── Przełącznik widoku ────────────────────────────────────────
  var _hView=window._plrHistView||'all';
  var _switcherHtml='<div style="display:flex;border-bottom:1px solid var(--gl);background:#0d1f0d;margin-bottom:0">';
  [['all',t('plr_hist_all')],['lg',t('plr_hist_league')],['cup',t('plr_hist_cup')]].forEach(function(v){
    var isOn=_hView===v[0];
    _switcherHtml+='<button onclick="window._plrHistView=\''+v[0]+'\';var _pp=G&&G.players&&G.players.find(function(x){return x.id===window._plrId;});if(_pp)renderPlayerHistory(_pp);" style="flex:1;padding:7px 2px;background:'+(isOn?'var(--gm)':'none')+';border:none;border-bottom:2px solid '+(isOn?(v[0]==='cup'?'#c8a800':'var(--am)'):'transparent')+';color:'+(isOn?(v[0]==='cup'?'#c8a800':'var(--am)'):'var(--gr)')+';font-weight:700;font-size:var(--fs-micro);cursor:pointer;letter-spacing:0.3px">'+v[1]+'</button>';
  });
  _switcherHtml+='</div>';

  var _sw0=document.getElementById('plr-hist-switcher');
  if(_sw0)_sw0.innerHTML=_switcherHtml;

  // ── Aktualizuj sekcję BIEŻĄCY SEZON — zawsze, niezależnie od hist ──
  const _isMyPlayer=p.clubId===G.myClubId||(G.myClub&&p.clubId===G.myClub.id);
  const _cur=document.getElementById('plr-cur-stats');
  if(_cur){
    const _cst={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,...(p.st||{})};
    const _cup=p.cupSt||{m:0,g:0,a:0,cs:0,ga:0,yk:0,rk:0,ratings:[]};
    const _seasonRatings=p.seasonRatings||[];
    const _avgRat=_seasonRatings.length?Math.round(_seasonRatings.reduce((s,r)=>s+r,0)/_seasonRatings.length*10)/10:null;
    const _last5=_seasonRatings.slice(-5);
    const _ratCol=r=>r>=8?'var(--am)':r>=7?'var(--gb)':r>=6?'var(--wh)':'var(--rd)';
    const _last5str=_last5.length?_last5.map(r=>'<span style="color:'+_ratCol(r)+'">'+r.toFixed(1)+'</span>').join('<span style="color:var(--gr)">-</span>'):'<span style="color:var(--gr)">—</span>';
    const _avgStr=_avgRat?'<span style="color:var(--am)">'+_avgRat.toFixed(1)+'</span>':'<span style="color:var(--gr)">—</span>';
    const _cupAvgRat=_cup.ratings&&_cup.ratings.length?Math.round(_cup.ratings.reduce((s,r)=>s+r,0)/_cup.ratings.length*10)/10:null;
    const _cupAvgStr=_cupAvgRat?'<span style="color:'+_ratCol(_cupAvgRat)+'">'+_cupAvgRat.toFixed(1)+'</span>':'<span style="color:var(--gr)">—</span>';

    var _curHtml='';
    if(_hView==='all'){
      // Suma liga + puchar
      const _tM=_cst.m+(_cup.m||0), _tG=(_cst.g||0)+(_cup.g||0), _tA=(_cst.a||0)+(_cup.a||0);
      const _tCS=(_cst.cs||0)+(_cup.cs||0), _tGA=(_cst.ga||0)+(_cup.ga||0);
      if(isGK)
        _curHtml='<thead><tr><th>M</th><th style="color:var(--gb)">CS</th><th style="color:var(--rd)">'+t('plr_hist_col_ga')+'</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th></tr></thead><tbody><tr class="hi"><td>'+_tM+'</td><td style="color:var(--gb)">'+_tCS+'</td><td style="color:var(--rd)">'+_tGA+'</td><td style="color:var(--am)">'+_cst.yk+'</td><td style="color:var(--rd)">'+_cst.rk+'</td></tr></tbody>';
      else
        _curHtml='<thead><tr><th>M</th><th>G</th><th>A</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th></tr></thead><tbody><tr class="hi"><td>'+_tM+'</td><td>'+_tG+'</td><td>'+_tA+'</td><td style="color:var(--am)">'+_cst.yk+'</td><td style="color:var(--rd)">'+_cst.rk+'</td></tr></tbody>';
      _curHtml+='<tbody>'+(_avgRat?'<tr><td colspan="2" style="color:var(--gr);font-size:var(--fs-dense)">'+t('plr_hist_avg_season')+'</td><td colspan="3">'+_avgStr+'</td></tr>':'')+'</tbody>';
    } else if(_hView==='cup'){
      // Tylko puchar
      if(isGK)
        _curHtml='<thead><tr><th style="color:#c8a800">M</th><th style="color:#4a8a40">CS</th><th style="color:#8a3020">'+t('plr_hist_col_ga')+'</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th></tr></thead><tbody><tr class="hi"><td style="color:#ffd700">'+(_cup.m||0)+'</td><td style="color:var(--gb)">'+(_cup.cs||0)+'</td><td style="color:var(--rd)">'+(_cup.ga||0)+'</td><td style="color:var(--am)">'+(_cup.yk||0)+'</td><td style="color:var(--rd)">'+(_cup.rk||0)+'</td></tr></tbody>';
      else
        _curHtml='<thead><tr><th style="color:#c8a800">M</th><th style="color:#c8a800">G</th><th style="color:#c8a800">A</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th></tr></thead><tbody><tr class="hi"><td style="color:#ffd700">'+(_cup.m||0)+'</td><td style="color:#ffd700">'+(_cup.g||0)+'</td><td style="color:#ffd700">'+(_cup.a||0)+'</td><td style="color:var(--am)">'+(_cup.yk||0)+'</td><td style="color:var(--rd)">'+(_cup.rk||0)+'</td></tr></tbody>';
      if(_cupAvgRat)_curHtml+='<tbody><tr><td colspan="2" style="color:var(--gr);font-size:var(--fs-dense)">'+t('plr_hist_avg_cup')+'</td><td colspan="3">'+_cupAvgStr+'</td></tr></tbody>';
    } else {
      // Tylko liga
      if(isGK)
        _curHtml='<thead><tr><th>M</th><th style="color:var(--gb)">CS</th><th style="color:var(--rd)">'+t('plr_hist_col_ga')+'</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th></tr></thead><tbody><tr class="hi"><td>'+_cst.m+'</td><td style="color:var(--gb)">'+(_cst.cs||0)+'</td><td style="color:var(--rd)">'+(_cst.ga||0)+'</td><td style="color:var(--am)">'+_cst.yk+'</td><td style="color:var(--rd)">'+_cst.rk+'</td></tr></tbody>';
      else
        _curHtml='<thead><tr><th>M</th><th>G</th><th>A</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th></tr></thead><tbody><tr class="hi"><td>'+_cst.m+'</td><td>'+(_cst.g||0)+'</td><td>'+(_cst.a||0)+'</td><td style="color:var(--am)">'+_cst.yk+'</td><td style="color:var(--rd)">'+_cst.rk+'</td></tr></tbody>';
      _curHtml+='<tbody>'+
        (_last5.length?'<tr><td colspan="2" style="color:var(--gr);font-size:var(--fs-dense)">'+t('plr_hist_avg_label')+'</td><td colspan="3" style="font-size:var(--fs-dense)">'+_last5str+'</td></tr>':'')+
        (_avgRat?'<tr><td colspan="2" style="color:var(--gr);font-size:var(--fs-dense)">'+t('plr_hist_avg_season')+'</td><td colspan="3">'+_avgStr+'</td></tr>':'')+
        '</tbody>';
    }
    _cur.innerHTML=_curHtml;
  }

  if(!hist.length){
    htbl.innerHTML='<tbody><tr><td colspan="9" style="color:var(--gr);padding:12px;font-size:var(--fs-meta);text-align:center">'+t('plr_no_history')+'</td></tr></tbody>';
    return;
  }

  // ── Sumy ─────────────────────────────────────────────────────
  const totLgM=hist.reduce((s,h)=>s+(h.m||0),0);
  const totLgG=hist.reduce((s,h)=>s+(h.g||0),0);
  const totLgA=hist.reduce((s,h)=>s+(h.a||0),0);
  const totLgCS=hist.reduce((s,h)=>s+(h.cs||0),0);
  const totLgGA=hist.reduce((s,h)=>s+(h.ga||0),0);
  const totLgYK=hist.reduce((s,h)=>s+(h.yk||0),0);
  const totLgRK=hist.reduce((s,h)=>s+(h.rk||0),0);
  const totCpM=hist.reduce((s,h)=>s+(h.cupSt&&h.cupSt.m||0),0);
  const totCpG=hist.reduce((s,h)=>s+(h.cupSt&&h.cupSt.g||0),0);
  const totCpA=hist.reduce((s,h)=>s+(h.cupSt&&h.cupSt.a||0),0);
  const totCpCS=hist.reduce((s,h)=>s+(h.cupSt&&h.cupSt.cs||0),0);
  const totCpGA=hist.reduce((s,h)=>s+(h.cupSt&&h.cupSt.ga||0),0);

  const showLg=_hView!=='cup';
  const showCup=_hView!=='lg';

  const clubCell=h=>h.clubId?'<td style="font-size:var(--fs-dense)"><span style="color:var(--am);cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();openClubModal('+h.clubId+');var _mc=document.getElementById(\'modal-club-ai\');if(_mc)_mc.style.zIndex=\'1000\';">'+(h.club||'?')+'</span></td>':'<td style="color:var(--gr);font-size:var(--fs-dense)">'+(h.club||'?')+'</td>';

  function transferRow(h,nextH){
    if(!nextH)return'';
    const idChanged=h.clubId&&nextH.clubId&&h.clubId!==nextH.clubId;
    const nameChanged=!idChanged&&h.club&&nextH.club&&h.club!==nextH.club;
    if(!idChanged&&!nameChanged)return'';
    const tr=h.transferOut||null;
    const priceStr=tr&&tr.price>0?(' • <span style="color:var(--am)">'+fmtVal(tr.price)+'</span>'):'';
    return '<tr style="background:#0a1a0a"><td colspan="9" style="padding:3px 4px 3px 10px;border-left:2px solid var(--gl)"><span style="font-size:var(--fs-dense);color:var(--gr)">↓ '+(h.club||'?')+' → <span style="color:var(--wh)">'+(nextH.club||'?')+'</span>'+priceStr+'</span></td></tr>';
  }

  // ── Nagłówek tabeli ───────────────────────────────────────────
  var thFields='';
  if(_hView==='all'){
    // WSZYSTKO: suma liga+puchar w jednych kolumnach
    if(isGK) thFields='<th>M</th><th style="color:var(--gb)">CS</th><th style="color:var(--rd)">'+t('plr_hist_col_ga')+'</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th>';
    else     thFields='<th>M</th><th>G</th><th>A</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th>';
  } else if(_hView==='lg'){
    if(isGK) thFields='<th>M</th><th style="color:var(--gb)">CS</th><th style="color:var(--rd)">'+t('plr_hist_col_ga')+'</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th>';
    else     thFields='<th>M</th><th>G</th><th>A</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th>';
  } else {
    // PUCHAR
    if(isGK) thFields='<th style="color:#c8a800">M</th><th style="color:#4a8a40">CS</th><th style="color:#8a3020">'+t('plr_hist_col_ga')+'</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th>';
    else     thFields='<th style="color:#c8a800">M</th><th style="color:#c8a800">G</th><th style="color:#c8a800">A</th><th style="color:var(--am)">'+t('plr_hist_col_yk')+'</th><th style="color:var(--rd)">'+t('plr_hist_col_rk')+'</th>';
  }
  const header='<thead><tr><th>'+t('plr_hist_col_season')+'</th><th>'+t('plr_hist_col_club')+'</th>'+(_isMyPlayer?'<th>'+t('plr_hist_col_ovr')+'</th>':'')+thFields+'<th style="color:var(--am)">'+t('plr_hist_col_avg')+'</th></tr></thead>';

  // ── Wiersze ───────────────────────────────────────────────────
  const seasonRows=hist.map((h,i)=>{
    const ovrC=h.ovr>=70?'var(--gb)':h.ovr>=50?'var(--am)':'var(--rd)';
    const cup=h.cupSt||null;
    var _dispRat, tdFields='';
    if(_hView==='all'){
      // Suma liga + puchar
      const tM=(h.m||0)+(cup&&cup.m||0);
      const tG=(h.g||0)+(cup&&cup.g||0);
      const tA=(h.a||0)+(cup&&cup.a||0);
      const tCS=(h.cs||0)+(cup&&cup.cs||0);
      const tGA=(h.ga||0)+(cup&&cup.ga||0);
      const tYK=(h.yk||0)+(cup&&cup.yk||0);
      const tRK=(h.rk||0)+(cup&&cup.rk||0);
      if(isGK) tdFields='<td>'+tM+'</td><td style="color:var(--gb)">'+tCS+'</td><td style="color:var(--rd)">'+tGA+'</td><td style="color:var(--am)">'+tYK+'</td><td style="color:var(--rd)">'+tRK+'</td>';
      else     tdFields='<td>'+tM+'</td><td>'+tG+'</td><td>'+tA+'</td><td style="color:var(--am)">'+tYK+'</td><td style="color:var(--rd)">'+tRK+'</td>';
      _dispRat=h.avgRat;
    } else if(_hView==='lg'){
      if(isGK) tdFields='<td>'+(h.m||0)+'</td><td style="color:var(--gb)">'+(h.cs||0)+'</td><td style="color:var(--rd)">'+(h.ga||0)+'</td><td style="color:var(--am)">'+(h.yk||0)+'</td><td style="color:var(--rd)">'+(h.rk||0)+'</td>';
      else     tdFields='<td>'+(h.m||0)+'</td><td>'+(h.g||0)+'</td><td>'+(h.a||0)+'</td><td style="color:var(--am)">'+(h.yk||0)+'</td><td style="color:var(--rd)">'+(h.rk||0)+'</td>';
      _dispRat=h.avgRat;
    } else {
      // PUCHAR
      if(cup&&cup.m>0){
        if(isGK) tdFields='<td style="color:#ffd700">'+cup.m+'</td><td style="color:var(--gb)">'+(cup.cs||0)+'</td><td style="color:var(--rd)">'+(cup.ga||0)+'</td><td style="color:var(--am)">'+(cup.yk||0)+'</td><td style="color:var(--rd)">'+(cup.rk||0)+'</td>';
        else     tdFields='<td style="color:#ffd700">'+cup.m+'</td><td style="color:#ffd700">'+(cup.g||0)+'</td><td style="color:#ffd700">'+(cup.a||0)+'</td><td style="color:var(--am)">'+(cup.yk||0)+'</td><td style="color:var(--rd)">'+(cup.rk||0)+'</td>';
      } else {
        tdFields='<td style="color:var(--gr)">—</td><td style="color:var(--gr)">—</td><td style="color:var(--gr)">—</td><td style="color:var(--gr)">—</td><td style="color:var(--gr)">—</td>';
      }
      _dispRat=cup&&cup.avgRat?cup.avgRat:null;
    }
    const ratStr=_dispRat?'<span style="color:'+ratCol(_dispRat)+'">'+_dispRat.toFixed(1)+'</span>':'<span style="color:var(--gr)">—</span>';
    const nextH=hist[i+1]||null;
    const isCurrent=!!(h._current&&!G.seasonEnded);
    const rowStyle=isCurrent?' style="opacity:0.75"':'';
    const isAcad=!!(h.fromAcademy);
    const sBadge=(isAcad||isCurrent)?'<tr style="background:#0a1a0a"><td colspan="9" style="padding:2px 4px 2px 10px;font-size:var(--fs-dense);border-left:2px solid '+(isAcad?'var(--gb)':'var(--am)')+'">'+
      (isAcad?'<span style="color:var(--gb)">'+t('plr_academy_badge')+'</span>':'<span style="color:var(--am)">'+t('plr_current_badge')+'</span>')+
    '</td></tr>':'';
    const seasonLabel='<span style="color:var(--am)">'+h.season+'</span>';
    return sBadge+'<tr'+rowStyle+'><td>'+seasonLabel+'</td>'+clubCell(h)+(_isMyPlayer?'<td style="color:'+ovrC+'">'+(h.ovr||'—')+'</td>':'')+tdFields+'<td>'+ratStr+'</td></tr>'+transferRow(h,nextH);
  }).join('');

  // ── Wiersz sumy ───────────────────────────────────────────────
  var tdSumFields='';
  if(_hView==='all'){
    const sM=totLgM+totCpM, sG=totLgG+totCpG, sA=totLgA+totCpA;
    const sCS=totLgCS+totCpCS, sGA=totLgGA+totCpGA, sYK=totLgYK, sRK=totLgRK;
    if(isGK) tdSumFields='<td><b>'+sM+'</b></td><td style="color:var(--gb)"><b>'+sCS+'</b></td><td style="color:var(--rd)"><b>'+sGA+'</b></td><td style="color:var(--am)"><b>'+sYK+'</b></td><td style="color:var(--rd)"><b>'+sRK+'</b></td>';
    else     tdSumFields='<td><b>'+sM+'</b></td><td><b>'+sG+'</b></td><td><b>'+sA+'</b></td><td style="color:var(--am)"><b>'+sYK+'</b></td><td style="color:var(--rd)"><b>'+sRK+'</b></td>';
  } else if(_hView==='lg'){
    if(isGK) tdSumFields='<td><b>'+totLgM+'</b></td><td style="color:var(--gb)"><b>'+totLgCS+'</b></td><td style="color:var(--rd)"><b>'+totLgGA+'</b></td><td style="color:var(--am)"><b>'+totLgYK+'</b></td><td style="color:var(--rd)"><b>'+totLgRK+'</b></td>';
    else     tdSumFields='<td><b>'+totLgM+'</b></td><td><b>'+totLgG+'</b></td><td><b>'+totLgA+'</b></td><td style="color:var(--am)"><b>'+totLgYK+'</b></td><td style="color:var(--rd)"><b>'+totLgRK+'</b></td>';
  } else {
    if(isGK) tdSumFields='<td style="color:#ffd700"><b>'+totCpM+'</b></td><td style="color:var(--gb)"><b>'+totCpCS+'</b></td><td style="color:var(--rd)"><b>'+totCpGA+'</b></td><td>—</td><td>—</td>';
    else     tdSumFields='<td style="color:#ffd700"><b>'+totCpM+'</b></td><td style="color:#ffd700"><b>'+totCpG+'</b></td><td style="color:#ffd700"><b>'+totCpA+'</b></td><td>—</td><td>—</td>';
  }
  const sumRow='<tr style="border-top:2px solid var(--gb);background:var(--gm)"><td style="color:var(--am)">Σ</td><td style="color:var(--gr);font-size:var(--fs-dense)">'+t('plr_hist_sum_label')+'</td>'+(_isMyPlayer?'<td>—</td>':'')+tdSumFields+'<td>—</td></tr>';

  htbl.innerHTML=header+'<tbody>'+seasonRows+sumRow+'</tbody>';

  // v212: Więź z Klubem — badge nad tabelą historii (tylko własni, aktywni)
  var _bondBadgeEl=document.getElementById('plr-bond-badge');
  if(_bondBadgeEl){
    const _b=getBondLevel(p);
    if(_b&&p.status!=='retired'&&p.status!=='freeAgent'){
      const _bondColors={4:'#e066ff',3:'#4db8ff',2:'#ffc107',1:'var(--gr)'};
      const _bondDesc={4:t('plr_bond_desc_4'),3:t('plr_bond_desc_3'),2:t('plr_bond_desc_2')};
      if(_b.level>=2){
        const _seasTxt=_b.seasons===1?'1 sez.':_b.seasons+'sez.';
        const _effTxt=(_b.level>=3)?'<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gr);margin-top:4px;line-height:1.8">'+t('plr_bond_home_form').replace('{n}',(_b.level===4)?3:2)+((_b.level===4)?t('plr_bond_away_form'):'')+t('plr_bond_offers').replace('{n}',(_b.level===4)?'40':(_b.level===3)?'25':'10')+'</div>':'<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gr);margin-top:4px;line-height:1.8">'+t('plr_bond_home_form').replace('{n}',1)+t('plr_bond_offers').replace('{n}','10')+'</div>';
        _bondBadgeEl.innerHTML='<div style="background:#0a1a0a;border:1px solid '+_b.color+';border-left:3px solid '+_b.color+';padding:7px 10px;margin-bottom:10px;display:flex;align-items:center;gap:8px">'
          +'<span style="font-size:var(--fs-display)">'+_b.icon+'</span>'
          +'<div><div style="font-weight:700;font-size:var(--fs-micro);color:'+_b.color+';letter-spacing:0.5px;margin-bottom:3px">'+t('plr_bond_title')+'</div>'
          +'<div style="font-weight:700;font-size:var(--fs-h3);color:var(--wh);margin-bottom:3px">'+_bondDesc[_b.level]+' • '+t('plr_bond_seasons').replace('{n}',_b.seasons)+'</div>'
          +_effTxt
          +'</div></div>';
      } else {
        const _brakuje=3-(_b.seasons);
        const _brakujeTxt=_brakuje===1?t('plr_bond_missing1'):t('plr_bond_missingN').replace('{n}',_brakuje);
        _bondBadgeEl.innerHTML='<div style="background:#0a1a0a;border:1px solid var(--gl);border-left:3px solid var(--gr);padding:7px 10px;margin-bottom:10px;display:flex;align-items:center;gap:8px">'
          +'<span style="font-size:var(--fs-display);color:var(--gr)">·</span>'
          +'<div><div style="font-weight:700;font-size:var(--fs-h3);color:var(--gr);letter-spacing:0.5px;margin-bottom:5px">'+t('plr_bond_title')+'</div>'
          +'<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gr);margin-bottom:5px">'+(_b.seasons>0?t('plr_bond_seasons').replace('{n}',_b.seasons):t('plr_bond_first'))+'</div>'
          +'<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gr);line-height:1.8">'+_brakujeTxt+t('plr_bond_goal')+'</div>'
          +'</div></div>';
      }
    } else {
      _bondBadgeEl.innerHTML='';
    }
  }

  if(p.status==='retired'){
    htbl.innerHTML+='<tbody><tr><td colspan="9" style="padding:8px 0;color:var(--gr);font-size:var(--fs-dense);text-align:center">'+t('plr_retired_hist').replace('{n}',p.retiredSeason||'?')+'</td></tr></tbody>';
  }
}

function toggleTraitDesc(tid){
  const el=document.getElementById('trait-desc-'+tid);
  if(el)el.style.display=el.style.display==='none'?'block':'none';
}



function calcContractSalary(p,years){
  const base=p.salary||calcSalary(p.value,G.myLeague||8,ovr(p));
  const yearMult={1:1.20,2:1.00,3:0.88,4:0.78}[years]||1.00;
  const ageMult=p.age<=20?0.88:p.age<=26?1.00:p.age<=30?0.95:1.05;
  const formMult=(p.form||70)/10<6.5?1.00:(p.form||70)/10<7.5?1.08:1.15;
  return Math.max(1,Math.round(base*yearMult*ageMult*formMult/50)*50);
}
function playerDemand(p){
  const minYears=p.age<=20?1:p.age<=26?2:p.age<=30?2:1;
  const mult=(85+r(0,30))/100;
  const kasaMult=(p.traits&&p.traits.includes('zadny_kasy'))?1.20:1.0;
  const minSalary=Math.round(calcContractSalary(p,2)*mult*kasaMult/50)*50;
  return{minYears,minSalary};
}
function acceptChance(offeredSalary,demand){
  const ratio=offeredSalary/demand.minSalary;
  if(ratio<0.80)return 0;
  if(ratio<0.90)return 30;
  if(ratio<1.00)return 65;
  if(ratio<1.10)return 85;
  return 100;
}
function renderPlayerAwards(p){
  var el=document.getElementById('plr-nagr-content');if(!el)return;
  var awards=(p.awards||[]).slice();
  // v230: MVP bieżącego sezonu — nie czeka na koniec sezonu jak inne nagrody
  // indywidualne (week-progress.js), tylko czyta p.seasonMomCount na żywo
  // (inkrementowany w match-post.js po każdym meczu). Znika sam, gdy na koniec
  // sezonu week-progress.js zapisze prawdziwy wpis 'mvp_matches' do p.awards.
  var _liveMomN=p.seasonMomCount||0;
  var _hasSeasonMvpAward=awards.some(function(a){return a.type==='mvp_matches'&&a.season===G.season;});
  if(_liveMomN>0&&!_hasSeasonMvpAward){
    awards.push({type:'mvp_matches',icon:'⭐',label:t('award_mvp_matches').replace('{n}',_liveMomN),tier:'live',season:G.season,_live:true});
  }
  var tierColor={gold:'#ffd700',silver:'#c0c0c0',indiv:'#4db8ff',legend:'#e066ff',live:'#ffc107'};
  var tierBg={gold:'#120e00',silver:'#0e0e0e',indiv:'#040d14',legend:'#0d040d',live:'#1a1400'};
  var tierBorder={gold:'#ffd700',silver:'#666',indiv:'#1a4a6a',legend:'#6a1a6a',live:'#7a5a00'};

  // Zapisz nagrody na window żeby onclick miał do nich dostęp
  window._plrAwards=awards;

  // ── Gablocie emoji ────────────────────────────────────────────
  var shelfHtml='<div style="background:#080f08;border-bottom:2px solid var(--gb);padding:4px 14px 10px">';
  shelfHtml+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);padding:6px 0 8px;letter-spacing:1px">'+t('plr_awards_shelf')+'</div>';
  if(!awards.length){
    shelfHtml+='<div style="font-weight:700;font-size:var(--fs-h3);color:#2a3a2a;text-align:center;padding:16px 0">'+t('plr_awards_none')+'</div>';
  } else {
    shelfHtml+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    awards.forEach(function(a,i){
      var tc=tierColor[a.tier]||'var(--am)';
      var seasonTag=a._live?t('plr_award_in_progress'):'S'+a.season;
      var itemStyle=a._live?'border:1px dashed '+tc+';border-radius:2px;padding:3px 0':'';
      shelfHtml+='<div onclick="showAwardDetail('+i+')" style="text-align:center;width:52px;cursor:pointer;'+itemStyle+'">';
      shelfHtml+='<div style="font-size:26px;line-height:1">'+a.icon+'</div>';
      shelfHtml+='<div style="font-weight:700;font-size:var(--fs-micro);color:'+tc+';margin-top:3px;line-height:1.5">'+seasonTag+'</div>';
      shelfHtml+='</div>';
    });
    shelfHtml+='</div>';
  }
  shelfHtml+='</div>';
  shelfHtml+='<div id="plr-award-detail" style="display:none;margin:6px 10px 2px"></div>';

  // ── Chronologiczna lista ──────────────────────────────────────
  var listHtml='<div style="font-weight:700;font-size:var(--fs-h3);color:var(--gr);padding:7px 14px 4px;letter-spacing:1px;border-bottom:1px solid var(--gl)">'+t('plr_awards_chrono')+'</div>';
  if(!awards.length){
    listHtml+='<div style="font-weight:700;font-size:var(--fs-h3);color:#2a3a2a;text-align:center;padding:20px 14px">'+t('plr_awards_none_chrono')+'</div>';
  } else {
    var sorted=awards.slice().sort(function(a,b){return a.season-b.season||(a._live?1:0)-(b._live?1:0);});
    sorted.forEach(function(a,i){
      var tc=tierColor[a.tier]||'var(--am)';
      var bg=i%2===0?'#0a1a0a':'transparent';
      var seasonTag=a._live?t('plr_award_in_progress'):'S'+a.season;
      var rowStyle=a._live?'border:1px dashed '+tc+';border-bottom:1px dashed '+tc:'border-bottom:1px solid #0d1f0d';
      listHtml+='<div style="display:flex;align-items:center;gap:10px;padding:6px 14px;'+rowStyle+';background:'+bg+'">';
      listHtml+='<span style="font-size:var(--fs-display);width:22px;text-align:center">'+a.icon+'</span>';
      listHtml+='<div style="flex:1;font-size:var(--fs-body);color:'+tc+'">'+a.label+'</div>';
      listHtml+='<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr)">'+seasonTag+'</div>';
      listHtml+='</div>';
    });
  }

  el.innerHTML=shelfHtml+listHtml;
}
function showAwardDetail(idx){
  var awards=window._plrAwards||[];
  var a=awards[idx];if(!a)return;
  var tierColor={gold:'#ffd700',silver:'#c0c0c0',indiv:'#4db8ff',legend:'#e066ff',live:'#ffc107'};
  var tierBg={gold:'#120e00',silver:'#0e0e0e',indiv:'#040d14',legend:'#0d040d',live:'#1a1400'};
  var tierBorder={gold:'#ffd700',silver:'#666',indiv:'#1a4a6a',legend:'#6a1a6a',live:'#7a5a00'};
  var tc=tierColor[a.tier]||'#ffd700';
  var _d=document.getElementById('plr-award-detail');if(!_d)return;
  if(_d.style.display==='block'&&_d.dataset.idx==idx){_d.style.display='none';return;}
  _d.dataset.idx=idx;
  _d.style.display='block';
  _d.innerHTML='<div style="display:flex;gap:10px;align-items:center;padding:8px 12px;border:1px '+(a._live?'dashed':'solid')+' '+tierBorder[a.tier||'gold']+';background:'+tierBg[a.tier||'gold']+'">'+
    '<span style="font-size:26px">'+a.icon+'</span>'+
    '<div>'+
      '<div style="font-weight:700;font-size:var(--fs-h3);color:'+tc+';margin-bottom:4px">'+a.label+'</div>'+
      '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr)">'+(a._live?t('plr_award_in_progress'):t('plr_award_season').replace('{n}',a.season))+'</div>'+
    '</div>'+
  '</div>';
}
function renderExt(p){
  const c=document.getElementById('plr-ext-dyn');if(!c)return;
  window._plrId=p.id;
  if(!window._plrDemand||window._plrDemand._pid!==p.id)
    window._plrDemand={...playerDemand(p),_pid:p.id};
  // Karta zawodnika pokazuje tylko przycisk
  const alr=p.contractChangedSeason===G.season;
  c.innerHTML=
    (alr?'<div style="color:var(--rd);font-size:var(--fs-dense);margin-bottom:6px">'+t('plr_extended_warn')+'</div>':'')+
    (alr?'':
      '<button onclick="openContractModal()" style="width:100%;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:10px;cursor:pointer">'+t('plr_extend_btn')+'</button>'
    );
}
function openContractModal(){
  const p=G.players.find(x=>x.id===window._plrId);if(!p)return;
  // Upewnij się że karta zawodnika jest otwarta (nie wywoływane z newsa)
  const playerPanel=document.getElementById('p-player');
  if(!playerPanel||!playerPanel.classList.contains('open'))return;
  window._plrContractSel={years:2};
  window._mcOfferedSalary=calcContractSalary(p,2);
  _renderContractModal(p);
  openModal('m-contract');
}
function _renderContractModal(p){
  const demand=window._plrDemand||playerDemand(p);
  const years=(window._plrContractSel||{years:2}).years;
  const sal=window._mcOfferedSalary||calcContractSalary(p,years);
  const chance=acceptChance(sal,demand);
  const salOk=sal>=demand.minSalary;
  const yearsOk=years>=demand.minYears;
  const chCol=chance===0?'var(--rd)':chance<70?'var(--am)':'var(--gb)';
  const title=document.getElementById('mc-title');
  if(title)title.textContent=t('plr_negot_title').replace('{name}',p.name).replace('{ovr}',ovr(p)).replace('{age}',p.age);
  const body=document.getElementById('mc-body');
  if(!body)return;
  body.innerHTML=
    // Żądania
    '<div style="background:#1a1a00;border:1px solid var(--am);padding:8px;margin-bottom:10px">'+
      '<div style="color:var(--am);margin-bottom:4px">'+t('plr_negot_demands')+'</div>'+
      '<div style="display:flex;justify-content:space-between"><span style="color:var(--gr)">'+t('plr_negot_length')+'</span><span style="color:var(--wh)">'+t('plr_negot_min_seasons').replace('{n}',demand.minYears)+'</span></div>'+
      '<div style="display:flex;justify-content:space-between"><span style="color:var(--gr)">'+t('plr_negot_salary')+'</span><span style="color:var(--wh)">'+fmt(demand.minSalary)+'/mc</span></div>'+
    '</div>'+
    (p.demands?'<div style="background:var(--tb);border:1px solid var(--gl);padding:8px;margin-bottom:8px">'+
      '<div style="color:var(--am);font-size:var(--fs-dense);margin-bottom:4px">'+t('plr_negot_demands_extra')+'</div>'+
      demandsHtmlInteractive(p,{salary:sal,contract:years,starter:true,signing:p._ofSig||false,bonus:p._ofBonus||false,loyalty:p._ofLoyalty||false})+
    '</div>':'')+
    (p.demands?'<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">'+t('plr_negot_met').replace('{n}',demandsMetCount(p,sal,years,true))+'</div>':'')+
    // Wybór lat
    '<div style="color:var(--gr);margin-bottom:4px">'+t('plr_negot_offer')+'</div>'+
    '<div style="display:flex;gap:4px;margin-bottom:10px">'+
    [1,2,3,4].map(y=>
      '<button onclick="selContractYears('+y+')" style="flex:1;padding:6px 2px;border:2px solid '+(y===years?'var(--gb)':'var(--gl)')+';background:'+(y===years?'var(--gb)':' var(--tb)')+';color:'+(y===years?'#000':'var(--wh)')+';font-size:var(--fs-dense);cursor:pointer">'+(y===1?t('plr_negot_year').replace('{n}',y):t('plr_negot_years').replace('{n}',y))+'</button>'
    ).join('')+
    '</div>'+
    // Pensja z strzałkami
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;background:var(--tb);border:1px solid var(--gl);padding:8px">'+
      '<span style="color:var(--gr);font-size:var(--fs-dense)">'+t('plr_negot_salary')+'</span>'+
      '<div style="display:flex;align-items:center;gap:4px;flex:1;justify-content:center">'+
        '<button onclick="changeMCSalary(-50)" style="background:var(--gm);border:1px solid var(--gl);color:var(--wh);font-size:var(--fs-body);width:28px;height:28px;cursor:pointer">▼</button>'+
        '<span style="font-size:var(--fs-body);color:var(--am);min-width:80px;text-align:center">'+fmt(sal)+'</span>'+
        '<button onclick="changeMCSalary(50)" style="background:var(--gm);border:1px solid var(--gl);color:var(--wh);font-size:var(--fs-body);width:28px;height:28px;cursor:pointer">▲</button>'+
      '</div>'+
      '<span style="color:var(--gr);font-size:var(--fs-dense)">/mc</span>'+
    '</div>'+
    // Status akceptacji
    '<div style="background:var(--tb);border:1px solid '+(chance===0?'var(--rd)':'var(--gl)')+';padding:8px">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px">'+
        '<span style="color:var(--gr);font-size:var(--fs-dense)">'+t('plr_negot_accept_label')+'</span>'+
        '<span style="color:'+(salOk&&yearsOk?'var(--gb)':'var(--rd)')+';font-size:var(--fs-dense)">'+(salOk&&yearsOk?t('plr_negot_ok'):t('plr_negot_low'))+'</span>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between">'+
        '<span style="color:var(--gr);font-size:var(--fs-dense)">'+t('plr_negot_accept_chance')+'</span>'+
        '<span style="color:'+chCol+';font-size:var(--fs-dense)">'+chance+'%</span>'+
      '</div>'+
      (sal>demand.minSalary*1.10?'<div style="color:var(--gb);font-size:var(--fs-dense);margin-top:3px">'+t('plr_negot_form_bonus')+'</div>':'')+
    '</div>';
  const btn=document.getElementById('mc-submit-btn');
  if(btn)btn.style.background=chance===0?'#3d0000':'var(--gb)';
}
function selContractYears(y){
  window._plrContractSel=window._plrContractSel||{years:2};
  window._plrContractSel.years=y;
  const p=G.players.find(x=>x.id===window._plrId);if(!p)return;
  // Przelicz pensję na nowe lata
  window._mcOfferedSalary=calcContractSalary(p,y);
  _renderContractModal(p);
}
function changeMCSalary(delta){
  window._mcOfferedSalary=Math.max(50,(window._mcOfferedSalary||0)+delta);
  const p=G.players.find(x=>x.id===window._plrId);if(!p)return;
  _renderContractModal(p);
}

function doExt(){
  const p=G.players.find(x=>x.id===window._plrId);if(!p)return;
  if(p.clubId!==G.myClubId){notif(t('plr_notif_not_your_player'),'err');return;}
  if(p.contractChangedSeason===G.season){notif(t('plr_notif_already_extended'),'err');closeModal('m-contract');return;}
  const years=(window._plrContractSel||{years:2}).years;
  const demand=window._plrDemand||playerDemand(p);
  const newSal=window._mcOfferedSalary||calcContractSalary(p,years);
  const chance=acceptChance(newSal,demand);
  const accepted=Math.random()*100<(years>=demand.minYears?chance:chance*0.5);
  closeModal('m-contract');
  if(!accepted){
    notif(t('plr_notif_offer_rejected').replace('{name}',p.name),'err');
    addNews(t('news_tr_offer_rejected').replace('{name}',p.name),'err');
    window._plrDemand=null;return;
  }
  p.contract=Math.min(p.contract+years,6);p.salary=newSal;
  if(p.demands){const dm=demandsMetCount(p,newSal,years,true);applyDemandEffect(p,Math.max(1,dm));}
  p.contractChangedSeason=G.season;
  if(newSal>demand.minSalary*1.10){
    p.form=Math.min(99,(p.form||70)+(newSal>demand.minSalary*1.25?10:5));
    notif(t('plr_notif_contract_happy').replace('{name}',p.name).replace('{n}',years),'ok');
  }else{
    notif(t('plr_notif_contract_ext').replace('{name}',p.name).replace('{n}',years),'ok');
  }
  G.fin.salaries=myPl().reduce((s,x)=>s+x.salary,0);
  window._plrDemand=null;window._mcOfferedSalary=null;
  showPlayer(p);
}

function calcSellPrice(p, forceMarket){
  const tw=isTransferWindow();
  const o=ovr(p);
  // Przedziały w oknie: [min,max]
  const inWindow=o<=25?[70,100]:o<=45?[80,110]:o<=60?[90,120]:[95,130];
  // Przedziały poza oknem (gracz wystawia sam — zniżka)
  const outWindow=o<=25?[50,75]:o<=45?[60,85]:o<=60?[70,95]:[80,110];
  // forceMarket=true: oferta AI — zawsze cena rynkowa bez zniżki
  const [mn,mx]=(tw.open||forceMarket)?inWindow:outWindow;
  const mult=(mn+r(0,mx-mn))/100;
  const contractPenalty=p.contract<=1?0.85:1.0;
  return Math.max(500,Math.round(p.value*mult*contractPenalty/500)*500);
}
function openSellModal(id){
  const _lp=G&&G.players&&G.players.find(x=>x.id===id);
  if(_lp&&_lp.loyaltyGuarantee&&(G.season||1)<_lp.loyaltyGuarantee){
    notif(t('plr_notif_loyalty_block').replace('{name}',_lp.name).replace('{n}',_lp.loyaltyGuarantee),'err');
    addNews(t('news_sell_loyalty_block').replace('{name}',_lp.name).replace('{n}',_lp.loyaltyGuarantee),'err');
    return;
  }
  // Blokada odsprzedaży przez 1 sezon od zakupu
  if(_lp&&_lp.boughtSeason&&(G.season||1)<=_lp.boughtSeason){
    notif(t('plr_notif_resale_block').replace('{name}',_lp.name).replace('{n}',_lp.boughtSeason),'err');
    addNews(t('news_sell_resale_block').replace('{name}',_lp.name).replace('{bought}',_lp.boughtSeason).replace('{next}',_lp.boughtSeason+1),'err');
    return;
  }
  if((G.trSoldThisWindow||0)>=3){notif(t('plr_notif_sell_limit'),'err');return;}
  const p=G.players.find(x=>x.id===parseInt(id)||x.id===id);
  if(!p||p.clubId!==G.myClubId)return;
  // ── LIMIT SKŁADU: min 22 zawodników po sprzedaży ─────────────────────
  const _sqAfter=myPl().filter(x=>x.id!==p.id);
  if(_sqAfter.length<22){notif(t('plr_notif_min_squad'),'err');return;}
  // ── MIN 2 BRAMKARZY ───────────────────────────────────────────────────
  if(p.pos==='GK'&&_sqAfter.filter(x=>x.pos==='GK').length<2){notif(t('plr_notif_min_gk'),'err');return;}
  window._sellId=p.id;
  const tw=isTransferWindow();
  // Użyj zapamiętanej oferty lub wygeneruj nową (1 oferta na zawodnika)
  if(!G._sellOffers)G._sellOffers={};
  if(!G._sellOffers[p.id]){
    // Sprawdź czy jest oferta AI (z pendingOffers) - użyj jej ceny bez przeliczania
    const _pending=G.pendingOffers&&G.pendingOffers.find(o=>o.pid===p.id);
    const price=_pending?_pending.price:calcSellPrice(p);
    const buyer=_pending?ALL_CLUBS.find(c=>c.n===_pending.clubName)||pick(ALL_CLUBS.filter(c=>c.id!==G.myClubId)):
      (pick(ALL_CLUBS.filter(c=>c.id!==G.myClubId&&(function(){
        if(!G.leagues)return true;
        const buyerLg=G.leagues.find(l=>l.clubs.some(x=>x.id===c.id));
        return buyerLg&&buyerLg.level<=(G.myLeague||8);
      })()))||pick(ALL_CLUBS.filter(c=>c.id!==G.myClubId)));
    G._sellOffers[p.id]={price,buyerId:buyer?buyer.id:null,buyerName:buyer?buyer.n:(_pending?_pending.clubName:t('plr_fallback_random_club')),isAI:!!_pending};
  }
  const offer=G._sellOffers[p.id];
  const price=offer.price;
  const buyer=offer.buyerId?ALL_CLUBS.find(c=>c.id===offer.buyerId):null;
  window._sellBuyer=buyer||{n:offer.buyerName,id:offer.buyerId};
  const mt=document.getElementById('ms-text');
  if(mt)mt.innerHTML=
    '<b style="color:var(--wh)">'+p.name+'</b><br>'+
    '<span style="color:var(--gr)">'+(POS_SHORT[p.pos]||p.pos)+' • '+p.age+t('tr_age_suffix')+' • OVR '+ovr(p)+'</span><br><br>'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 10px;margin:6px 0;font-size:var(--fs-dense)">'+
      '<div style="color:var(--gr);margin-bottom:4px">'+t('plr_sell_dynamic_value')+'<span style="color:var(--wh)">'+fmtVal(calcValueDynamic(p))+'</span>'+
      (p._hot?' <span style="color:var(--am)">'+t('plr_sell_hot_badge')+'</span>':'')+(p.injured?' <span style="color:var(--rd)">'+t('plr_sell_injured_badge')+'</span>':'')+'<br><span style="font-size:var(--fs-dense);color:var(--gr)">'+t('plr_sell_base_label')+fmtVal(calcValue(ovr(p),p.age))+'</span></div>'+
      '<div style="color:var(--gr);margin-bottom:4px">'+t('plr_sell_window_label')+'<span style="color:'+(tw.open?'var(--gb)':'var(--rd)')+'">'+(tw.open?t('plr_sell_window_open_badge').replace('{type}',tw.type==='LETNIE'?t('window_summer'):t('window_winter')):t('plr_sell_window_closed_badge'))+'</span></div>'+
      (p.contract<=1?'<div style="color:var(--am);margin-bottom:4px">'+t('plr_sell_expiring_contract')+'</div>':'')+
      (p.boughtSeason&&(G.season||1)===p.boughtSeason+1&&p.boughtPrice&&price>p.boughtPrice?
        '<div style="color:var(--am);margin-bottom:4px">'+t('plr_sell_profit_tax').replace('{a}',fmtVal(price-p.boughtPrice)).replace('{b}',fmtVal(Math.round((price-p.boughtPrice)*0.25/500)*500))+'</div>':'')+
      '<div style="color:var(--gb);font-size:var(--fs-meta);margin-top:4px">'+t('plr_sell_offer_price')+'<b>'+fmt(price)+'</b>'+(tw.open?t('plr_sell_in_window_pct'):offer&&offer.isAI?'':t('plr_sell_out_window_pct'))+'</div>'+
      (function(){
        const _profit=price-(p.boughtPrice||0);
        const _tax=(p.boughtSeason&&(G.season||1)===p.boughtSeason+1&&p.boughtPrice&&_profit>0)?Math.round(_profit*0.25/500)*500:0;
        const _net=price-_tax;
        return _tax>0?'<div style="color:var(--wh);font-size:var(--fs-meta);margin-top:2px">'+t('plr_sell_net_receive')+'<b style="color:var(--gb)">'+fmt(_net)+'</b></div>':'';
      })()+
    '</div>'+
    t('plr_sell_buyer_label')+'<b style="color:var(--am)">'+(buyer?buyer.n:t('plr_fallback_random_club'))+'</b>';
  window._sellPrice=price; // z cache
  openModal('m-sell');
}
function doSell(){
  const p=G.players.find(x=>x.id===window._sellId);
  if(!p||p.clubId!==G.myClubId){closeModal('m-sell');return;}
  const price=window._sellPrice||calcSellPrice(p);
  const buyer=window._sellBuyer;
  G.budget+=price;
  p.clubId=buyer?buyer.id:0;
  p.starter=false;
  if(buyer)G.players.push(p);
  G.players=G.players.filter(x=>x.id!==p.id||x.clubId!==G.myClubId);
  G.fin.salaries=myPl().reduce((s,x)=>s+x.salary,0);
  if(!G.fin.transfers)G.fin.transfers=[];
  // Podatek od zysku jeśli sprzedajesz w sezonie tuż po blokadzie (boughtSeason+1)
  let _sellNet=price;
  if(p.boughtSeason&&p.boughtPrice&&(G.season||1)===p.boughtSeason+1){
    const _profit=price-(p.boughtPrice||0);
    if(_profit>0){
      const _tax=Math.round(_profit*0.25/500)*500; // 25% podatku od zysku
      _sellNet=price-_tax;
      G.budget-=_tax;
      addNews(t('news_sell_resale_tax').replace('{name}',p.name).replace('{tax}',fmtVal(_tax)).replace('{profit}',fmtVal(_profit)),'err');
    }
  }
  G.fin.transfers.push({type:'sell',name:p.name,val:_sellNet,club:buyer?buyer.n:'',season:G.season,week:G.week,id:p.id});
  G.fin.hist.push({w:G.week,inc:_sellNet,cost:0,bal:G.budget,season:G.season,note:'SPR: '+p.name});
  if(!G.allTimeStats)G.allTimeStats={players:{},bestSeller:null,bestBuyer:null};
  if(!G.allTimeStats.bestSeller||price>G.allTimeStats.bestSeller.val)G.allTimeStats.bestSeller={id:p.id,name:p.name,val:price,season:G.season};
  if(G.allTimeStats.bestSeller&&G.allTimeStats.bestSeller.id===p.id){
    if(!p.awards)p.awards=[];
    if(!p.awards.find(function(a){return a.type==='record_transfer_sold';})){
      p.awards.push({type:'record_transfer_sold',icon:'💰',label:t('leg_record_sold')+' — '+fmtVal(price),tier:'legend',season:G.season});
      pushTimeline('record_sold','💰',t('tl_record_sold').replace('{name}',p.name).replace('{val}',fmtVal(price)),{pid:p.id,sentiment:'pos',weight:15});
    }
  }
  // Sprzedaż ulubieńca kibiców — silne, negatywne wspomnienie na przyszłość
  if((p.awards||[]).some(function(a){return a.type==='legend'||a.type==='fan_favourite'||a.type==='one_club_man';}))
    pushTimeline('fan_favourite_sold','💔',t('tl_fan_favourite_sold').replace('{name}',p.name),{pid:p.id,sentiment:'neg',weight:40});
  addNews(t('news_sold_to').replace('{name}',p.name).replace('{club}',buyer?buyer.n:t('news_tr_other_club')).replace('{val}',fmtVal(price)),'ok');
  if(G._sellOffers)delete G._sellOffers[p.id];
  if(G.pendingOffers)G.pendingOffers=G.pendingOffers.filter(x=>x.pid!==p.id);
  if(!G.trSoldThisWindow)G.trSoldThisWindow=0;
  G.trSoldThisWindow++;
  closeModal('m-sell');
  closePanel('p-player');
  fillSquad();fillTransfers();updateHdr();
  notif(t('tr_notif_sold_for').replace('{name}',p.name).replace('{val}',fmtVal(price)),'ok');
}
function doSellFromPanelTop(){openSellModal(window._plrId);}

