const TRAIN_OPTS=[
  {k:'ATK', get l(){return t('train_opt_atk_l');}, i:'⚽', attrs:{sht:2,tec:1}, get d(){return t('train_opt_atk_d');}},
  {k:'POL', get l(){return t('train_opt_pol_l');}, i:'🎯', attrs:{pas:2,men:1}, get d(){return t('train_opt_pol_d');}},
  {k:'OBR', get l(){return t('train_opt_obr_l');}, i:'🛡️', attrs:{def:2,phy:1}, get d(){return t('train_opt_obr_d');}},
];
const INTENSITY_OPTS=[
  {k:'LOW',  get l(){return t('int_low_l');},  gain:[0,0], injRisk:0,    d1:'',get d2(){return t('int_low_d2');}},
  {k:'NOR',  get l(){return t('int_nor_l');},  gain:[1,2], injRisk:0.003,d1:'',get d2(){return t('int_nor_d2');}},
  {k:'HIGH', get l(){return t('int_high_l');}, gain:[2,3], injRisk:0.012,d1:'',get d2(){return t('int_high_d2');}},
];
function trainTab(tab,btn){
  if(tab==='postep'){G.trainFocusJustEnded=false;fillProgressPanel();}
  document.querySelectorAll('#p-training .sq-tab2-btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');
  document.querySelectorAll('#tr-plan,#tr-obozy,#tr-postep').forEach(el=>el.classList.remove('on'));
  const el=document.getElementById('tr-'+tab);if(el)el.classList.add('on');
  if(tab==='obozy')fillCampPanel();
  if(tab==='postep')fillProgressPanel();
}
function fillTraining(){
  if(!G)return;
  // Refresh progress if visible
  const pp=document.getElementById('tr-postep');
  if(pp&&pp.classList.contains('on'))fillProgressPanel();
  if(!G.training)G.training='ATK';
  if(!G.trainIntensity)G.trainIntensity='NOR';
  if(!G.trainLog)G.trainLog=[];
  const info=document.getElementById('tr-info');
  if(info){
    if(!G.trainFocusLock)G.trainFocusLock=0;
    const lockMsg=G.trainFocusLock>0?t('train_lock_info').replace('{n}',G.trainFocusLock):'';
    info.textContent=t('train_week_info').replace('{w}',G.week).replace('{r}',G.round)+lockMsg;
  }
  const el=document.getElementById('tr-opts');
  if(el)el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+
    TRAIN_OPTS.map(o=>'<div class="tropt '+(G.training===o.k?'sel':'')+'" onclick="setTrain(\''+o.k+'\')" style="padding:10px 8px">'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:var(--fs-display)">'+o.i+'</span>'+
        '<div><div class="tropt-name">'+o.l+'</div><div class="tropt-desc" style="font-size:var(--fs-dense)">'+o.d+'</div></div>'+
      '</div><div class="tropt-chk">\u2714</div></div>').join('')+
    '</div>';
  const iel=document.getElementById('tr-intensity');
  if(iel){
    const cur=INTENSITY_OPTS.find(o=>o.k===(G.trainIntensity||'NOR'))||INTENSITY_OPTS[1];
    const injCol=cur.k==='HIGH'?'var(--rd)':cur.k==='NOR'?'var(--am)':'var(--gb)';
    const injLbl=cur.k==='HIGH'?t('train_inj_high'):cur.k==='NOR'?t('train_inj_nor'):t('train_inj_low');
    const zmLbl=cur.k==='HIGH'?t('train_fat_high'):cur.k==='NOR'?t('train_fat_nor'):t('train_fat_low');
    const zmCol=cur.k==='HIGH'?'var(--rd)':cur.k==='NOR'?'var(--am)':'var(--gb)';
    iel.innerHTML=
      '<div style="display:flex;gap:6px;margin-bottom:10px">'+
        INTENSITY_OPTS.map(o=>{
          const isSel=G.trainIntensity===o.k;
          return '<button onclick="setIntensity(\'' + o.k + '\')" style="flex:1;font-size:var(--fs-meta);padding:7px 4px;cursor:pointer;border:1px solid '+(isSel?'var(--am)':'var(--gl)')+';background:'+(isSel?'var(--gm)':'var(--tb)')+';color:'+(isSel?'var(--am)':'var(--gr)')+'">'+(isSel?'\u2714 ':'')+o.l+'</button>';
            (isSel?'✔ ':'')+o.l+
          '</button>';
        }).join('')+
      '</div>'+
      '<div style="border:1px solid var(--gl);padding:10px;font-size:var(--fs-dense)">'+
        '<div style="color:var(--am);font-size:var(--fs-meta);margin-bottom:6px">'+cur.l+(G.trainIntensity===cur.k?t('train_cur_choice'):'')+'</div>'+
        '<div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;color:var(--gr)">'+
          '<span>'+t('train_gain_label')+'</span><span style="color:var(--wh)">'+t('train_gain_val').replace('{a}',cur.gain[0]).replace('{b}',cur.gain[1])+'</span>'+
          '<span>'+t('train_form_label')+'</span><span style="color:var(--wh)">'+(cur.k==='LOW'?t('train_form_low'):cur.k==='HIGH'?t('train_form_high'):t('train_form_nor'))+'</span>'+
          '<span>'+t('train_fat_label')+'</span><span style="color:'+zmCol+'">'+zmLbl+'</span>'+
          '<span>'+t('train_inj_label')+'</span><span style="color:'+injCol+'">'+injLbl+'</span>'+
        '</div>'+
        '<div style="margin-top:6px;color:var(--gr);border-top:1px solid var(--gl);padding-top:6px">'+cur.d2+'</div>'+
      '</div>';
  }
  const warn=document.getElementById('tr-injury-warn');
  if(warn)warn.style.display=G.trainIntensity==='HIGH'?'block':'none';
  // ── Centrum Szkoleniowe UI ──
  const tcEl=document.getElementById('tr-centrum');
  if(tcEl)tcEl.innerHTML=renderTCPanel();
}
function renderTCPanel(){
  if(!G)return'';
  const lvl=tcLevel();
  const tc=G.trainingCenter||{};
  // W budowie
  if(tc.building){
    return '<div style="border:1px solid var(--am);padding:10px;margin-top:10px">'+
      '<div style="color:var(--am);font-size:var(--fs-dense);margin-bottom:4px">'+t('train_tc_building')+'</div>'+
      '<div style="color:var(--gr);font-size:var(--fs-dense)">'+tc.building.name+' — '+t('train_tc_done_in').replace('{n}',tc.building.weeksLeft)+'</div>'+
      '<div style="background:#000;height:6px;margin-top:6px"><div style="height:100%;background:var(--am);width:'+Math.round((1-(tc.building.weeksLeft/tc.building.totalWeeks))*100)+'%"></div></div>'+
    '</div>';
  }
  // Brak centrum
  if(lvl===0){
    const cost0=tcCost(0);const upk0=tcUpkeep(0);
    const canBuild=G.budget>=cost0;
    return '<div style="border:1px solid var(--gl);padding:10px;margin-top:10px">'+
      '<div style="color:var(--gr);font-size:var(--fs-dense);margin-bottom:6px">'+t('train_tc_none_title')+'</div>'+
      '<div style="color:var(--gr);font-size:var(--fs-dense);margin-bottom:8px">'+t('train_tc_none_desc')+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('train_tc_cost_line').replace('{cost}',fmt(cost0)).replace('{upk}',fmt(upk0))+'</div>'+
      (canBuild?'<button onclick="buildTC(0)" style="width:100%;margin-top:8px;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+t('train_tc_build_btn').replace('{n}',fmt(cost0))+'</button>':
        '<div style="color:var(--rd);font-size:var(--fs-dense);margin-top:6px">'+t('train_tc_no_funds').replace('{n}',fmt(cost0-G.budget))+'</div>')+
    '</div>';
  }
  // Centrum aktywne
  const tcDef=TRAINING_CENTER.levels[lvl-1];
  const maxP=tcDef.profiles;
  const activeP=tc.profiles||[];
  const locked=tc.profilesLocked;
  const inFocusWindow=(G.trainFocusLock||0)>=7;
  const changeCost=TRAINING_CENTER.changeCost[lvl-1]||5000;
  let html='<div style="border:1px solid var(--gb);padding:10px;margin-top:10px">';
  html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
  html+='<div style="color:var(--gb);font-size:var(--fs-dense)">'+t('train_tc_name_hdr').replace('{name}',((tcDef&&tcDef.name)||'').toUpperCase())+'</div>';
  html+='<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('train_tc_slots').replace('{a}',activeP.length).replace('{m}',maxP)+'</div>';
  html+='</div>';
  // Profil sloty
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px">';
  TC_PROFILES.forEach(pr=>{
    const isActive=activeP.includes(pr.id);
    const canAdd=!isActive&&activeP.length<maxP&&!locked;
    const canRemove=isActive&&!locked;
    html+='<div style="border:1px solid '+(isActive?'var(--gb)':'var(--gl)')+';padding:6px;cursor:'+(canAdd||canRemove?'pointer':'default')+';background:'+(isActive?'var(--gm)':'var(--tb)')+'" data-tcid="'+pr.id+'" onclick="toggleTCProfile(this.dataset.tcid)">'+
      '<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:2px">'+pr.effect+'</div>'+
    '</div>';
  });
  html+='</div>';
  if(locked&&!inFocusWindow)html+='<div style="font-size:var(--fs-dense);color:var(--am);margin-bottom:6px">'+t('train_tc_change_hint').replace('{n}',fmt(changeCost))+'</div>';
  if(locked&&!inFocusWindow)html+='<button onclick="unlockTCProfiles()" style="width:100%;background:var(--am);color:#000;border:none;font-size:var(--fs-dense);padding:6px;cursor:pointer">'+t('train_tc_change_btn').replace('{n}',fmt(changeCost))+'</button>';
  // Ulepszenie
  if(lvl<3){
    const nc=tcCost(lvl);const nu=tcUpkeep(lvl);const nd=TRAINING_CENTER.levels[lvl];
    const canUp=G.budget>=nc&&(G.reputation||0)>=(nd.req.rep||0)&&((G.stadium&&G.stadium.capacity)||0)>=(nd.req.stad||0);
    html+='<div style="border-top:1px solid var(--gl);margin-top:8px;padding-top:8px;font-size:var(--fs-dense);color:var(--gr)">'+t('train_tc_upgrade_line').replace('{name}',nd.name).replace('{cost}',fmt(nc)).replace('{upk}',fmt(nu)).replace('{rep}',nd.req.rep).replace('{stad}',nd.req.stad)+'</div>';
    if(canUp)html+='<button onclick="buildTC('+lvl+')" style="width:100%;margin-top:6px;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('train_tc_upgrade_btn').replace('{n}',fmt(nc))+'</button>';
  }
  html+='</div>';
  return html;
}
function buildTC(lvlIdx){
  if(!G)return;
  if(!G.trainingCenter)G.trainingCenter={level:0,building:null,profiles:[],profilesLocked:false};
  const def=TRAINING_CENTER.levels[lvlIdx];if(!def)return;
  const cost=tcCost(lvlIdx);
  if(G.budget<cost){notif(t('train_no_funds'),'err');return;}
  if((G.reputation||0)<(def.req.rep||0)){notif(t('train_req_rep').replace('{n}',def.req.rep),'err');return;}
  if(((G.stadium&&G.stadium.capacity)||0)<(def.req.stad||0)){notif(t('train_req_stad').replace('{n}',def.req.stad),'err');return;}
  G.budget-=cost;
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:cost,bal:G.budget,season:G.season,note:t('stad_note_tc_built').replace('{name}',def.name)});
  G.trainingCenter.building={levelIdx:lvlIdx+1,name:def.name,weeksLeft:def.buildWeeks,totalWeeks:def.buildWeeks};
  addNews(t('news_tc_build_started').replace('{name}',def.name).replace('{n}',def.buildWeeks),'club');
  notif(t('train_tc_notif').replace('{name}',def.name).replace('{n}',def.buildWeeks),'ok');
  fillTraining();
}
function toggleTCProfile(id){
  if(!G||!G.trainingCenter)return;
  const tc=G.trainingCenter;
  if(tc.profilesLocked){
    notif(t('train_profiles_locked').replace('{n}',fmt(TRAINING_CENTER.changeCost[tcLevel()-1]||5000)),'err');
    return;
  }
  const idx=tc.profiles.indexOf(id);
  if(idx>=0){tc.profiles.splice(idx,1);}
  else if(tc.profiles.length<tcMaxProfiles()){tc.profiles.push(id);tc.profilesLocked=true;}
  else{notif(t('train_profiles_max').replace('{n}',tcMaxProfiles()),'err');return;}
  fillTraining();
}
function unlockTCProfiles(){
  if(!G||!G.trainingCenter)return;
  const cost=TRAINING_CENTER.changeCost[tcLevel()-1]||5000;
  if(G.budget<cost){notif(t('train_no_funds'),'err');return;}
  G.budget-=cost;
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:cost,bal:G.budget,season:G.season,note:t('stad_note_tc_unlock')});
  G.trainingCenter.profilesLocked=false;
  notif(t('train_profiles_unlocked'),'ok');
  fillTraining();
}
function setTrain(k){
  if(!G)return;
  if(G.trainFocusLock>0){fillTraining();return;}
  G.training=k;
  G.trainFocusLock=8;
  if(G.trainingCenter)G.trainingCenter.profilesLocked=false;
  // Save snapshot of current attrs for all my players
  G.trainSnapshot={};
  myPl().forEach(p=>{G.trainSnapshot[p.id]={ovr:ovr(p),tec:p.tec,pas:p.pas,sht:p.sht,def:p.def,phy:p.phy,men:p.men};});
  G.trainFocusStart=G.week;
  fillTraining();
  notif(t('train_focus_notif').replace('{k}',k),'ok');
  // News o wybranym fokusie
  const _fNames={ATK:t('train_opt_atk_l'),POL:t('train_opt_pol_l'),OBR:t('train_opt_obr_l')};
  const _fLabel=_fNames[k]||k;
  if(!G.news)G.news=[];
  G.news.unshift({msg:t('train_focus_news').replace('{name}',_fLabel),type:'train',week:G.week,season:G.season});
  renderNews();
}
function setIntensity(k){if(!G)return;G.trainIntensity=k;fillTraining();
  const o=INTENSITY_OPTS.find(x=>x.k===k);
  notif(t('train_intensity_notif').replace('{l}',o?o.l:k));
}
function fillCampPanel(){
  if(!G)return;
  const cs=document.getElementById('camp-status');
  if(cs){
    // Safety: auto-end camp if somehow still active after week 2
    if(G.campActive&&G.week>2){G.campActive=false;G.campWeeks=0;}
    if(G.week>2&&!G.campActive){cs.innerHTML='';}
    else if(G.campActive&&G.campWeeks>0){cs.innerHTML='';}
    else if(G.campActive&&G.campWeeks===0){G.campActive=false;cs.innerHTML='';}
    else if(G.week<=2){cs.innerHTML='<span style="color:var(--gb)">'+t('stad_camp_available')+'</span>';}
    else cs.textContent='';
  }
  // Show ind camp usage
  if(!G.indCampUsed)G.indCampUsed=0;
  const icu=document.getElementById('ind-camp-used');
  if(icu)icu.textContent=t('train_ind_used').replace('{a}',G.indCampUsed).replace('{m}',4);
  // Individual camp - show player list with checkboxes
  if(!G.indCampSelected)G.indCampSelected=[];
  const il=document.getElementById('ind-camp-list');
  if(il)il.innerHTML=myPl().map(p=>{
    const sel=G.indCampSelected.includes(p.id);
    const disabled=!sel&&G.indCampSelected.length>=4;
    return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0d1f0d;font-size:var(--fs-dense);cursor:pointer;opacity:'+(disabled?'0.4':'1')+'" onclick="toggleIndCamp('+p.id+')">'+
      '<span style="color:'+(sel?'var(--am)':'var(--gr)')+'">['+(sel?'✔':' ')+']</span>'+
      '<span style="color:var(--wh)">'+p.name+'</span>'+
      (p.fromAcademy?' <span style="color:#9c27b0;font-size:9px">🎓</span>':'')+
      '<span style="color:var(--gr);margin-left:auto">OVR '+ovr(p)+'</span>'+
      '</div>';
  }).join('');
}
function toggleIndCamp(id){
  if(!G.indCampSelected)G.indCampSelected=[];
  const idx=G.indCampSelected.indexOf(id);
  if(idx>=0)G.indCampSelected.splice(idx,1);
  else if(G.indCampSelected.length<4)G.indCampSelected.push(id);
  fillCampPanel();
}
function startTeamCamp(type){
  if(!G)return;
  if(G.week>2){notif(t('train_camp_only_week'),'err');return;}
  if(G.campActive){notif(t('train_camp_active'),'err');return;}
  const campTypes={NOR:{cost:2000,rounds:4},PRO:{cost:3000,rounds:7},ELITE:{cost:4500,rounds:10}};
  const ct=campTypes[type]||campTypes.NOR;
  const players=myPl();
  const total=ct.cost*players.length;
  if(G.budget<total){notif(t('train_camp_no_funds').replace('{n}',fmt(total)),'err');return;}
  G.budget-=total;
  if(!G.fin.transfers)G.fin.transfers=[];
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:total,bal:G.budget,season:G.season,note:t('stad_note_team_camp').replace('{type}',type).replace('{n}',myPl().length)});
  G.campActive=true;
  G.campWeeks=2;
  G.campType=type;
  G.campRoundsBonus=ct.rounds;
  G.campOvrBonus=0;
  players.forEach(p=>{p.onCamp=true;p.starter=false;});
  notif(t('train_camp_notif').replace('{type}',type).replace('{n}',fmt(total)),'ok');
  addNews(t('news_camp_started').replace('{type}',type).replace('{val}',fmt(total)),'info');
  fillCampPanel();
}
function sendIndCamp(){
  if(!G||!G.indCampSelected||!G.indCampSelected.length){notif(t('train_ind_select'),'err');return;}
  if(!G.indCampUsed)G.indCampUsed=0;
  if(G.indCampUsed+G.indCampSelected.length>4){notif(t('train_ind_max').replace('{n}',4-G.indCampUsed),'err');return;}
  const cost=G.indCampSelected.length*2000;
  if(G.budget<cost){notif(t('train_ind_no_funds').replace('{n}',fmt(cost)),'err');return;}
  G.budget-=cost;
  if(!G.fin.transfers)G.fin.transfers=[];
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:cost,bal:G.budget,season:G.season,note:t('stad_note_ind_camp').replace('{n}',G.indCampSelected.length).replace('{plural}',G.indCampSelected.length>1?(LANG==='pl'?'ów':'s'):'')});
  G.indCampUsed+=G.indCampSelected.length;
  // Ask which attr to train - use the attr selector
  const selFocus=document.getElementById('ind-camp-attr-sel');
  const chosenFocus=selFocus?selFocus.value:'ATK';
  const focusAttrsMap={ATK:['sht','tec'],POL:['pas','men'],OBR:['def','phy']};
  const focusAttrs=focusAttrsMap[chosenFocus]||['sht','tec'];
  G.indCampSelected.forEach(id=>{
    const p=G.players.find(x=>x.id===id);if(!p)return;
    // Upewnij się że mamy snapshot atrybutów z początku sezonu (potrzebny do wyświetlania postępu)
    if(!p.seasonStartAttrs)p.seasonStartAttrs={tec:p.tec,pas:p.pas,sht:p.sht,def:p.def,phy:p.phy,men:p.men};
    if(!p.seasonStartOvr)p.seasonStartOvr=ovr(p);
    p.form=100;
    const gains=[];
    focusAttrs.forEach(attr=>{
      const tr=p.trainRate||1.0;
      const baseGain=r(4,6);
      const gain=Math.max(1,Math.round(baseGain*tr));const before=p[attr];
      p[attr]=Math.min(99,p[attr]+gain);
      if(ovr(p)>=p.potential)p[attr]=before;
      const actualGain=p[attr]-before;
      if(actualGain>0)gains.push(attr.toUpperCase()+' +'+actualGain);
    });
    // Zapisz snapshot atrybutów PRZED obozem do wykrywania postępu w panelu gracza
    // (aktualizujemy seasonStartAttrs żeby nie liczyć ponownie wzrostu przy następnym obozie)
    p.onIndCamp=true;p.indCampWeeks=1;p.starter=false;
    const gainsStr=gains.length?gains.join(', '):t('train_ind_no_gain');
    addNews(t('news_camp_player_result').replace('{name}',p.name).replace('{focus}',chosenFocus).replace('{gains}',gainsStr),'ok');
  });
  G.indCampSelected=[];
  notif(t('train_ind_notif').replace('{n}',fmt(cost)),'ok');
  fillCampPanel();
}
function fillProgressPanel(){
  if(!G)return;
  const el=document.getElementById('tr-progress-list');if(!el)return;
  const tOpt=TRAIN_OPTS.find(o=>o.k===G.training)||TRAIN_OPTS[0];
  const focusAttrs=['tec','pas','sht','def','phy','men']; // show all attrs
  const attrLabel={tec:'TEC',pas:'PAS',sht:'SHT',def:t('train_attr_def'),phy:t('train_attr_phy'),men:'MEN'};
  // Header
  const ended=G.trainFocusLock===0&&G.trainFocusJustEnded!==false;
  const statusMsg=t('train_prog_season').replace('{n}',G.season)+' <b>'+tOpt.l+'</b>'+(G.trainFocusLock>0?t('train_prog_left').replace('{n}',G.trainFocusLock):t('train_prog_done'));
  const thAttrs=focusAttrs.map(a=>'<th style="color:var(--am)">'+attrLabel[a]+'</th>').join('');
  const rows=myPl().map(p=>{
    const s=p.seasonStartAttrs||{};
    const ovrDiff=ovr(p)-(p.seasonStartOvr||ovr(p));
    const ovrCol=ovrDiff>0?'var(--gb)':ovrDiff<0?'var(--rd)':'var(--gr)';
    const attrCells=focusAttrs.map(a=>{
      const old=s[a]!==undefined?s[a]:p[a];const cur=p[a];const d=cur-old;
      const col=d>0?'var(--gb)':d<0?'var(--rd)':'var(--gr)';
      return '<td style="text-align:center;color:'+col+';cursor:pointer" onclick="showById('+p.id+')">'+(d>0?'+':'')+d+'</td>';
    }).join('');
    const rc='showById('+p.id+')';
    return '<tr style="cursor:pointer" onclick="'+rc+'">'+
      '<td style="font-size:var(--fs-dense);color:var(--am);cursor:pointer" onclick="'+rc+'">'+p.name.split(' ')[1]+(p.fromAcademy?' <span style="color:#9c27b0;font-size:9px">🎓</span>':'')+'</td>'+
      attrCells+
      '<td style="text-align:center;color:'+ovrCol+';cursor:pointer" onclick="'+rc+'">'+(ovrDiff>0?'+':'')+ovrDiff+'</td>'+
    '</tr>';
  }).join('');
  el.innerHTML=
    '<div style="font-size:var(--fs-dense);color:var(--gr);padding:4px 0 8px">'+statusMsg+'</div>'+
    '<table class="rtbl"><thead><tr>'+
      '<th>'+t('train_prog_player')+'</th>'+thAttrs+
      '<th style="color:var(--gb)">OVR</th>'+
    '</tr></thead><tbody>'+rows+'</tbody></table>'+
    '<div style="font-size:var(--fs-dense);color:var(--gr);padding:8px 4px 0;line-height:1.6">'+
      '<b style="color:var(--am)">'+t('train_prog_ovr_legend')+'</b> '+t('train_prog_ovr_desc')+'<br>'+
      t('train_ovr_formula_st')+'<br>'+
      t('train_ovr_formula_mid')+'<br>'+
      t('train_ovr_formula_def')+'<br>'+
      t('train_ovr_formula_gk')+'<br>'+
      '<span style="color:var(--wh)">'+t('train_prog_ovr_note')+'</span>'+
    '</div>';
}



// ══════════════════════════════════════════════════════════
// ETAP 2+3 — STADION + MODUŁY
// ══════════════════════════════════════════════════════════
const STAD={
  costPerSeat(cap){
    if(cap<500)return 80;if(cap<2000)return 150;
    if(cap<5000)return 280;if(cap<15000)return 500;
    if(cap<30000)return 900;return 1600;
  },
  buildTime(n){
    if(n<=100)return 4;if(n<=500)return 8;if(n<=2000)return 14;
    if(n<=5000)return 24;if(n<=15000)return 40;return 60;
  },
  maxCap:{1:50000,2:40000,3:30000,4:20000,5:12000,6:8000,7:5000,8:3000},
  calcCost(cap,n){
    let cost=0,c=cap;
    for(let i=0;i<n;i++){cost+=STAD.costPerSeat(c);c++;}
    return Math.round(cost/100)*100;
  }
};
const STAD_MODULES={
  vip:{name:'Loże VIP',icon:'🎭',levels:[
    {cost:25000,effect:'+800 zł/tyg',vipWeekly:800,buildWeeks:4,req:{capacity:1000,rep:80}},
    {cost:120000,effect:'+3 000 zł/tyg',vipWeekly:3000,buildWeeks:6,req:{capacity:1000}},
    {cost:500000,effect:'+10 000 zł/tyg',vipWeekly:10000,buildWeeks:10,req:{capacity:3000}},
    {cost:2000000,effect:'+35 000 zł/tyg',vipWeekly:35000,buildWeeks:16,req:{capacity:8000}}
  ]},
  gastro:{name:'Gastronomia',icon:'🍔',levels:[
    {cost:8000,effect:'Bilety +8%',gasBonus:0.08,buildWeeks:2,req:{capacity:800}},
    {cost:45000,effect:'Bilety +20%',gasBonus:0.20,buildWeeks:5,req:{capacity:1200}},
    {cost:180000,effect:'Bilety +40%',gasBonus:0.40,buildWeeks:8,req:{capacity:2500}}
  ]},
  shop:{name:'Sklep klubowy',icon:'🛍',levels:[
    {cost:10000,effect:'Gadżety x1.5',shopMult:1.5,buildWeeks:2,req:{rep:50}},
    {cost:55000,effect:'Gadżety x2.5',shopMult:2.5,buildWeeks:4,req:{capacity:600,rep:100}},
    {cost:220000,effect:'Gadżety x4.0',shopMult:4.0,buildWeeks:6,req:{capacity:2000,rep:200}}
  ]},
  light:{name:'Oświetlenie',icon:'💡',levels:[
    {cost:20000,effect:'Frekwencja +5%',freqBonus:5,buildWeeks:5,req:{capacity:1500,rep:120}},
    {cost:100000,effect:'Frekwencja +10%, Rep +30',freqBonus:10,repBonus:30,buildWeeks:9,req:{capacity:2500}}
  ]},
  board:{name:'Tablica świetlna',icon:'📺',levels:[
    {cost:35000,effect:'Reklamy +15%, Rep +20',adsMult:1.15,repBonus:20,buildWeeks:6,req:{capacity:2000,light:1,rep:150}}
  ]}
};
function getModuleLvl(key){return(G.stadium&&G.stadium.modules&&G.stadium.modules[key])||0;}
function stadModName(key){return t('stad_mod_'+key+'_name');}
function stadModEffect(key,lvlIdx){
  if(key==='vip'){
    const lvlDef=STAD_MODULES.vip.levels[lvlIdx];
    return lvlDef?'+'+fmt(lvlDef.vipWeekly)+t('stad_per_week_suffix'):'';
  }
  return t('stad_mod_'+key+'_e'+(lvlIdx+1));
}
function checkModuleReq(req){
  if(!req)return{ok:true};
  const cap=(G.stadium&&G.stadium.capacity)||200;
  const rep=(G.reputation)||0;
  if(req.capacity&&cap<req.capacity)return{ok:false,msg:t('stad_req_capacity').replace('{n}',req.capacity.toLocaleString(LANG==='en'?'en-GB':'pl-PL'))};
  if(req.rep&&rep<req.rep)return{ok:false,msg:t('stad_req_rep').replace('{n}',req.rep)};
  if(req.light&&getModuleLvl('light')<req.light)return{ok:false,msg:t('stad_req_light').replace('{n}',req.light)};
  return{ok:true};
}
// Auto-refresh paska budowy gdy tab rozbudowa jest aktywny
setInterval(function(){
  if(!G||!G.stadium||!G.stadium.building)return;
  const el=document.getElementById('stad-rozbudowa');
  if(!el||!el.classList.contains('on'))return;
  const bar=el.querySelector('.stad-build-bar');
  if(!bar)return;
  const tw=G.stadium.building.totalWeeks||1;
  const pct=Math.min(100,Math.round((1-(G.stadium.building.weeksLeft/tw))*100));
  const done=tw-G.stadium.building.weeksLeft;
  bar.querySelector('.stad-bar-fill').style.width=pct+'%';
  bar.querySelector('.stad-bar-left').textContent=t('stad_auto_refresh').replace('{done}',done).replace('{total}',tw);
  bar.querySelector('.stad-bar-right').textContent=t('stad_pct_left').replace('{pct}',pct).replace('{n}',G.stadium.building.weeksLeft);
},500);

function stadTab(tab,btn){
  document.querySelectorAll('#p-stadium .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['przeglad','rozbudowa','moduly','historia'].forEach(t=>{
    const el=document.getElementById('stad-'+t);if(el)el.classList.remove('on');
  });
  const el=document.getElementById('stad-'+tab);if(el)el.classList.add('on');
  if(tab==='przeglad')renderStadPrzeglad();
  else if(tab==='rozbudowa')renderStadRozbudowa();
  else if(tab==='historia')renderStadHistoria();
}
function drawStadiumTopDown(cap,freq,modules){
  // Deterministyczny seed na podstawie pojemności — te same dane = ten sam układ kibiców
  let _seed=cap*1000+Math.round(freq*100);
  function rng(){_seed=(_seed*16807+0)%2147483647;return(_seed-1)/2147483646;}

  const W=280,H=200;
  const tribW=cap<400?8:cap<800?14:cap<1500?20:cap<3000?26:cap<6000?32:38;
  const px=70-tribW,py=50-tribW,pw=140+tribW*2,ph=100+tribW*2;
  const dotSz=3;
  const hasGastro=modules&&modules.gastro>0;
  const hasVip=modules&&modules.vip>0;
  const hasLight=modules&&modules.light>0;
  const hasShop=modules&&modules.shop>0;
  const hasBoard=modules&&modules.board>0;

  // Kolory kibiców: zielone + złote (barwy klubu) + szare (puste)
  const fanCols=['#4caf50cc','#4caf5099','#ffc10799','#2d7d3299','#66bb6acc'];
  const emptCol='#1a3d1a55';

  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;background:#060f06;">`;
  s+=`<defs>
    <linearGradient id="pitchTD" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e5c1e"/>
      <stop offset="50%" stop-color="#2d7d32"/>
      <stop offset="100%" stop-color="#1e5c1e"/>
    </linearGradient>
    <filter id="glowTD"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;

  // Tło trybun (beton)
  s+=`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#0d200d" rx="3"/>`;

  // Piksele kibiców — North
  for(let row=0;row<Math.min(tribW,20);row+=dotSz){
    const cols=Math.floor(pw/dotSz);
    for(let d=0;d<cols;d++){
      const filled=rng()<freq;
      const col=filled?fanCols[Math.floor(rng()*fanCols.length)]:emptCol;
      s+=`<rect x="${px+d*dotSz}" y="${py+row}" width="${dotSz-.5}" height="${dotSz-.5}" fill="${col}" rx=".4"/>`;
    }
  }
  // South
  for(let row=0;row<Math.min(tribW,20);row+=dotSz){
    const cols=Math.floor(pw/dotSz);
    for(let d=0;d<cols;d++){
      const filled=rng()<freq;
      const col=filled?fanCols[Math.floor(rng()*fanCols.length)]:emptCol;
      s+=`<rect x="${px+d*dotSz}" y="${py+ph-Math.min(tribW,20)+row}" width="${dotSz-.5}" height="${dotSz-.5}" fill="${col}" rx=".4"/>`;
    }
  }
  // West & East
  const rowsH=Math.floor(100/dotSz);
  for(let row=0;row<Math.min(tribW,20);row+=dotSz){
    for(let d=0;d<rowsH;d++){
      const fW=rng()<freq;const fE=rng()<freq;
      const cW=fW?fanCols[Math.floor(rng()*fanCols.length)]:emptCol;
      const cE=fE?fanCols[Math.floor(rng()*fanCols.length)]:emptCol;
      s+=`<rect x="${px+row}" y="${50+d*dotSz}" width="${dotSz-.5}" height="${dotSz-.5}" fill="${cW}" rx=".4"/>`;
      s+=`<rect x="${px+pw-Math.min(tribW,20)+row}" y="${50+d*dotSz}" width="${dotSz-.5}" height="${dotSz-.5}" fill="${cE}" rx=".4"/>`;
    }
  }

  // Boisko — pasy naprzemienne
  s+=`<rect x="70" y="50" width="140" height="100" fill="url(#pitchTD)" rx="2"/>`;
  for(let i=0;i<7;i++) s+=`<rect x="${70+i*20}" y="50" width="20" height="100" fill="${i%2===0?'#1e5c1ecc':'#245c2466'}"/>`;

  // Linie boiska
  s+=`<rect x="70" y="50" width="140" height="100" fill="none" stroke="#ffffff55" stroke-width=".9"/>`;
  s+=`<line x1="140" y1="50" x2="140" y2="150" stroke="#ffffff44" stroke-width=".8"/>`;
  s+=`<circle cx="140" cy="100" r="18" fill="none" stroke="#ffffff44" stroke-width=".8"/>`;
  s+=`<circle cx="140" cy="100" r="1.5" fill="#ffffff66"/>`;
  s+=`<rect x="70" y="74" width="22" height="52" fill="none" stroke="#ffffff44" stroke-width=".8"/>`;
  s+=`<rect x="70" y="85" width="10" height="30" fill="none" stroke="#ffffff44" stroke-width=".8"/>`;
  s+=`<rect x="188" y="74" width="22" height="52" fill="none" stroke="#ffffff44" stroke-width=".8"/>`;
  s+=`<rect x="200" y="85" width="10" height="30" fill="none" stroke="#ffffff44" stroke-width=".8"/>`;
  s+=`<rect x="65" y="91" width="5" height="18" fill="none" stroke="#ffffffaa" stroke-width="1.2"/>`;
  s+=`<rect x="210" y="91" width="5" height="18" fill="none" stroke="#ffffffaa" stroke-width="1.2"/>`;

  // MODUŁY — ikonki w narożnikach
  if(hasGastro) s+=`<text x="3" y="13" font-size="11" opacity=".9">🍔</text>`;
  if(hasVip)    s+=`<text x="${W-16}" y="13" font-size="11" opacity=".9">🎭</text>`;
  if(hasLight)  s+=`<text x="3" y="${H-3}" font-size="11" opacity=".9">💡</text>`;
  if(hasShop)   s+=`<text x="${W-16}" y="${H-3}" font-size="11" opacity=".9">🛍</text>`;
  if(hasBoard){
    // Tablica wynikowa nad boiskiem
    s+=`<rect x="115" y="34" width="50" height="13" fill="#000" stroke="#ffc107" stroke-width=".8" rx="1"/>`;
    s+=`<text x="140" y="44" font-size="9" fill="#ffc107" text-anchor="middle" letter-spacing="1">${t('stad_scoreboard_label')}</text>`;
  }

  // Słupy oświetlenia (cztery narożniki) gdy moduł light
  if(hasLight){
    [[px-2,py-2],[px+pw+2,py-2],[px-2,py+ph+2],[px+pw+2,py+ph+2]].forEach(([lx,ly])=>{
      s+=`<circle cx="${lx}" cy="${ly}" r="3" fill="#ffc10788" filter="url(#glowTD)"/>`;
    });
  }

  // Frekwencja label
  const viewers=Math.round(cap*freq);
  s+=`<text x="${W/2}" y="${H-2}" font-size="11" fill="#4caf5077" text-anchor="middle">${viewers.toLocaleString(LANG==='en'?'en-GB':'pl-PL')} ${t('stad_viewers').replace('{n}','').trim()}</text>`;

  s+=`</svg>`;
  return s;
}

function fillStadium(){
  if(!G)return;
  if(!G.stadium)G.stadium={capacity:200,shopMult:1,adsMult:1,vipWeekly:0,gasBonus:0,modules:{},hist:[]};
  // Odśwież aktywny tab stadionu
  const activeTab=document.querySelector('#p-stadium .tab-pane.on');
  if(activeTab){
    if(activeTab.id==='stad-rozbudowa')renderStadRozbudowa();
    else if(activeTab.id==='stad-moduly')renderStadModuly();
    else renderStadPrzeglad();
  } else renderStadPrzeglad();
}
function renderStadPrzeglad(){
  const el=document.getElementById('stad-przeglad');if(!el||!G)return;
  const s=G.stadium;const lvl=G.myLeague||8;
  const cap=s.capacity||200;const freq=(G.frequency||50)/100;
  const tp=FIN.ticketPrice[lvl]||5;
  const gasB=s.gasBonus||0;
  const perMatch=Math.round(cap*freq*tp*(1+gasB));
  const perWeek=Math.round(perMatch/2);
  const maxCap=STAD.maxCap[lvl]||2000;
  const inBuild=s.building;
  const activeMods=Object.entries(STAD_MODULES).filter(([k])=>getModuleLvl(k)>0);
  el.innerHTML=
    drawStadiumTopDown(cap,freq,s.modules||{})+
    '<div style="background:var(--tb);border:1px solid var(--gl);border-top:none;padding:7px 10px;margin-bottom:8px">'+
      '<div style="font-size:var(--fs-meta);color:var(--am);margin-bottom:6px">'+(G.myClub&&G.myClub.n||t('stad_title'))+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:var(--fs-dense)">'+
        '<div><div style="color:var(--gr)">'+t('stad_capacity')+'</div><div style="color:var(--wh);font-size:var(--fs-meta)">'+cap.toLocaleString(LANG==='en'?'en-GB':'pl-PL')+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('stad_max').replace('{league}',LEAGUE_NAMES[lvl])+'</div><div style="color:var(--gr)">'+maxCap.toLocaleString(LANG==='en'?'en-GB':'pl-PL')+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('stad_attendance')+'</div><div style="color:var(--gb)">'+(G.frequency||50)+'%</div></div>'+
        '<div><div style="color:var(--gr)">'+t('stad_fans_match')+'</div><div style="color:var(--wh)">~'+Math.round(cap*freq).toLocaleString(LANG==='en'?'en-GB':'pl-PL')+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('stad_ticket_price')+'</div><div style="color:var(--am)">'+fmt(tp)+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('stad_tickets_week')+'</div><div style="color:var(--gb)">+'+fmt(perWeek)+'</div><div style="color:var(--gr);font-size:var(--fs-dense)">'+t('stad_tickets_match').replace('{n}',fmt(perMatch))+'</div></div>'+
      '</div>'+
    '</div>'+
    '<div style="background:#000;border:1px solid var(--gl);height:10px;margin-bottom:10px;position:relative">'+
      '<div style="height:100%;background:var(--gb);width:'+Math.min(100,Math.round(cap/maxCap*100))+'%"></div>'+
      '<div style="position:absolute;right:4px;top:0;font-size:var(--fs-dense);color:var(--wh)">'+Math.min(100,Math.round(cap/maxCap*100))+'%</div>'+
    '</div>'+
    (activeMods.length?
      '<div style="font-size:var(--fs-dense);color:var(--gb);margin-bottom:4px">'+t('stad_active_modules')+'</div>'+
      activeMods.map(([k,m])=>'<div style="font-size:var(--fs-dense);color:var(--gr);padding:2px 0">'+m.icon+' '+stadModName(k)+' L'+getModuleLvl(k)+' — '+stadModEffect(k,getModuleLvl(k)-1)+'</div>').join('')+
      '<div style="margin-bottom:8px"></div>':'')+
    (!inBuild?'<button onclick="stadTab(\'rozbudowa\',document.querySelectorAll(\'#p-stadium .tab-btn\')[1])" style="width:100%;background:var(--am);color:#000;border:none;font-size:var(--fs-body);padding:12px;cursor:pointer">'+t('stad_expand_btn')+'</button>':'');
}
function renderStadRozbudowa(){
  const el=document.getElementById('stad-rozbudowa');if(!el||!G)return;
  const s=G.stadium;const lvl=G.myLeague||8;
  const cap=s.capacity||200;const maxCap=STAD.maxCap[lvl]||2000;
  // Pasek postępu budowy — zawsze na górze gdy trwa
  const buildBar=s.building?(()=>{
    const _tw=s.building.totalWeeks||s.building.weeksLeft||1;
    const pct=Math.min(100,Math.round((1-(s.building.weeksLeft/_tw))*100));
    const done=_tw-s.building.weeksLeft;
    return '<div class="stad-build-bar" style="background:#1a1000;border:2px solid var(--am);padding:10px 12px;margin-bottom:12px">'+
      '<div style="font-size:var(--fs-dense);color:var(--am);margin-bottom:6px">'+t('stad_build_progress').replace('{n}',s.building.seats.toLocaleString(LANG==='en'?'en-GB':'pl-PL'))+'</div>'+
      '<div style="background:#000;height:10px;border:1px solid var(--gl);margin-bottom:5px;position:relative">'+
        '<div class="stad-bar-fill" style="height:100%;background:var(--am);width:'+pct+'%;transition:width 0.3s"></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense)">'+
        '<span class="stad-bar-left" style="color:var(--gr)">'+t('stad_week_progress').replace('{done}',done).replace('{total}',_tw)+'</span>'+
        '<span class="stad-bar-right" style="color:var(--am)">'+t('stad_pct_left').replace('{pct}',pct).replace('{n}',s.building.weeksLeft)+'</span>'+
      '</div>'+
    '</div>';
  })():'';
  if(cap>=maxCap){
    el.innerHTML='<div style="color:var(--gr);font-size:var(--fs-dense);padding:16px;text-align:center">'+t('stad_limit_reached').replace('{league}',LEAGUE_NAMES[lvl])+'</div>'+
      '<div class="fsec" style="margin:12px 0 8px">'+t('stad_modules_title')+'</div><div id="stad-rozb-moduly"></div>';
    _renderStadModulyInRozb();return;
  }
  const maxAdd=Math.min(2000,maxCap-cap);
  if(!window._stadAdd||window._stadAdd<100)window._stadAdd=100;
  window._stadAdd=Math.max(100,Math.min(maxAdd,window._stadAdd));
  const n=window._stadAdd;
  const cost=STAD.calcCost(cap,n);const weeks=STAD.buildTime(n);
  const newCap=cap+n;const tp=FIN.ticketPrice[lvl]||5;
  const freq=(G.frequency||50)/100;const gasB=s.gasBonus||0;
  const curBil=Math.round(cap*freq*tp*(1+gasB)/2);
  const newBil=Math.round(newCap*freq*tp*(1+gasB)/4);
  const canAfford=G.budget>=cost;
  el.innerHTML=
    buildBar+
    '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:8px">'+t('stad_capacity_lbl').replace('{n}',cap.toLocaleString(LANG==='en'?'en-GB':'pl-PL')).replace('{max}',maxCap.toLocaleString(LANG==='en'?'en-GB':'pl-PL'))+'</div>'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:7px 10px;margin-bottom:8px">'+
      '<div style="font-size:var(--fs-dense);color:var(--gb);margin-bottom:8px">'+t('stad_how_many')+'</div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
        '<button onclick="changeStadAdd(-100)" style="background:var(--gm);border:1px solid var(--gl);color:var(--wh);font-size:var(--fs-display);width:40px;height:40px;cursor:pointer">-</button>'+
        '<div style="flex:1;text-align:center;font-size:var(--fs-display);color:var(--am)">'+t('stad_places').replace('{n}',n.toLocaleString(LANG==='en'?'en-GB':'pl-PL'))+'</div>'+
        '<button onclick="changeStadAdd(100)" style="background:var(--gm);border:1px solid var(--gl);color:var(--wh);font-size:var(--fs-display);width:40px;height:40px;cursor:pointer">+</button>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:var(--fs-dense);margin-bottom:10px">'+
        '<div><div style="color:var(--gr)">'+t('stad_new_capacity')+'</div><div style="color:var(--wh)">'+newCap.toLocaleString(LANG==='en'?'en-GB':'pl-PL')+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('stad_cost')+'</div><div style="color:'+(canAfford?'var(--am)':'var(--rd)')+'">'+fmt(cost)+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('stad_build_time')+'</div><div style="color:var(--wh)">'+t('stad_weeks').replace('{n}',weeks)+'</div></div>'+
        '<div><div style="color:var(--gr)">'+t('stad_tickets_after')+'</div><div style="color:var(--gb)">+'+fmt(newBil)+' (+'+fmt(newBil-curBil)+')</div></div>'+
      '</div>'+
      (s.building?
        '<button disabled style="width:100%;background:var(--gr);color:#000;border:none;font-size:var(--fs-meta);padding:12px;cursor:not-allowed;opacity:0.5">'+t('stad_building')+'</button>'
      :canAfford?
        '<button onclick="startBuild()" style="width:100%;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:12px;cursor:pointer">'+t('stad_start_build_btn').replace('{n}',fmt(cost))+'</button>'
      :'<div style="background:#3d0000;border:1px solid var(--rd);padding:8px;text-align:center;font-size:var(--fs-dense);color:var(--rd)">'+t('stad_no_funds').replace('{n}',fmt(cost-G.budget))+'</div>')+
    '</div>'+
    '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('stad_cost_per_seat').replace('{n}',(cap<500?'80':cap<2000?'150':cap<5000?'280':cap<15000?'500':'900'))+'</div>'+
    '<div class="fsec" style="margin:14px 0 8px">'+t('stad_modules_title')+'</div>'+
    '<div id="stad-rozb-moduly"></div>';
  _renderStadModulyInRozb();
}
function renderStadModuly(){
  const el=document.getElementById('stad-moduly');if(!el||!G)return;
  if(!G.stadium.modules)G.stadium.modules={};
  const mb=G.stadium.modulBuilding;
  // Pasek budowy aktywnego modułu
  let buildingHtml='';
  if(mb){
    const mod=STAD_MODULES[mb.key];
    const pct=Math.round((1-(mb.weeksLeft/mb.totalWeeks))*100);
    buildingHtml='<div style="background:#1a1000;border:2px solid var(--am);padding:10px 12px;margin-bottom:10px">'+
      '<div style="font-size:var(--fs-dense);color:var(--am);margin-bottom:4px">'+t('stad_module_building').replace('{icon}',mod?mod.icon:'').replace('{name}',mod?stadModName(mb.key):'?').replace('{lvl}',mb.lvl+1)+'</div>'+
      '<div style="background:#000;height:8px;border:1px solid var(--gl);margin-bottom:4px">'+
        '<div style="height:100%;background:var(--am);width:'+pct+'%"></div>'+
      '</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('stad_module_weeks_left').replace('{n}',mb.weeksLeft).replace('{total}',mb.totalWeeks)+'</div>'+
    '</div>';
  }
  el.innerHTML=buildingHtml+Object.entries(STAD_MODULES).map(([key,mod])=>{
    const lvl=getModuleLvl(key);const maxLvl=mod.levels.length;
    const next=mod.levels[lvl];const isMax=lvl>=maxLvl;
    const isBuilding=mb&&mb.key===key;
    const otherBuilding=mb&&mb.key!==key;
    const req=next?checkModuleReq(next.req):{ok:false,msg:''};
    const canAfford=next&&G.budget>=next.cost;
    const prog=Array.from({length:maxLvl},(_,i)=>'<div style="flex:1;height:5px;margin:0 1px;background:'+(i<lvl?'var(--gb)':isBuilding&&i===lvl?'var(--am)':'#0d1f0d')+'"></div>').join('');
    return '<div style="background:var(--tb);border:1px solid '+(isBuilding?'var(--am)':lvl>0?'var(--gb)':'var(--gl)')+';padding:10px 12px;margin-bottom:8px">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
        '<span style="font-size:var(--fs-display)">'+mod.icon+'</span>'+
        '<div style="flex:1"><div style="font-size:var(--fs-dense);color:var(--wh)">'+stadModName(key)+'</div>'+
        '<div style="font-size:var(--fs-dense);color:var(--gr)">L'+lvl+'/'+maxLvl+'</div></div>'+
        (isBuilding?'<div style="font-size:var(--fs-dense);color:var(--am)">🔨 '+mb.weeksLeft+' '+t('stad_weeks').replace('{n}','').trim()+'</div>':
         lvl>0?'<div style="font-size:var(--fs-dense);color:var(--gb)">L'+lvl+'</div>':'')+
      '</div>'+
      '<div style="display:flex;margin-bottom:6px">'+prog+'</div>'+
      (lvl>0?'<div style="font-size:var(--fs-dense);color:var(--gb);margin-bottom:4px">'+stadModEffect(key,lvl-1)+'</div>':'')+
      (isMax?'<div style="font-size:var(--fs-dense);color:var(--am);text-align:center">'+t('stad_module_max')+'</div>':
       isBuilding?'<div style="font-size:var(--fs-dense);color:var(--am)">'+t('stad_module_in_build').replace('{lvl}',lvl+1).replace('{effect}',stadModEffect(key,lvl))+'</div>':
        '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+t('stad_module_next').replace('{lvl}',lvl+1).replace('{effect}',stadModEffect(key,lvl)).replace('{cost}',fmt(next.cost)).replace('{weeks}',next.buildWeeks||1)+'</div>'+
        (otherBuilding?'<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('stad_module_other_build')+'</div>':
         !req.ok?'<div style="font-size:var(--fs-dense);color:var(--rd)">'+req.msg+'</div>':
         !canAfford?'<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('stad_no_funds').replace('{n}',fmt(next.cost-G.budget))+'</div>':
         '<button onclick="buyModule(\''+key+'\')" style="width:100%;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+t('stad_module_build_btn').replace('{cost}',fmt(next.cost)).replace('{weeks}',next.buildWeeks||1)+'</button>')
      )+
    '</div>';
  }).join('');
}
function renderStadHistoria(){
  const el=document.getElementById('stad-historia');if(!el||!G)return;
  const hist=(G.stadium&&G.stadium.hist)||[];
  el.innerHTML=hist.length?
    '<table style="width:100%;border-collapse:collapse;font-size:var(--fs-dense)">'+
    '<thead><tr>'+
      '<th style="text-align:left;padding:4px 6px;color:var(--gr);border-bottom:1px solid var(--gl)">'+t('stad_hist_col_st')+'</th>'+
      '<th style="text-align:left;padding:4px 6px;color:var(--gr);border-bottom:1px solid var(--gl)">'+t('stad_hist_col_invest')+'</th>'+
      '<th style="text-align:right;padding:4px 6px;color:var(--rd);border-bottom:1px solid var(--gl)">'+t('stad_hist_col_cost')+'</th>'+
    '</tr></thead><tbody>'+
    hist.slice().reverse().map(h=>
      '<tr style="border-bottom:1px solid #0d1f0d">'+
        '<td style="padding:4px 6px;color:var(--gr)">S'+h.season+' T'+h.week+'</td>'+
        '<td style="padding:4px 6px;color:var(--wh)">'+(h.seats?t('stad_hist_seats').replace('{n}',h.seats.toLocaleString(LANG==='en'?'en-GB':'pl-PL')):h.module||'?')+'</td>'+
        '<td style="text-align:right;padding:4px 6px;color:var(--rd)">-'+fmt(h.cost)+'</td>'+
      '</tr>'
    ).join('')+'</tbody></table>'
  :'<div style="color:var(--gr);font-size:var(--fs-dense);padding:12px">'+t('stad_hist_empty')+'</div>';
}
function changeStadAdd(delta){
  const s=G.stadium||{};const cap=s.capacity||200;
  const lvl=G.myLeague||8;const maxAdd=Math.min(1000,STAD.maxCap[lvl]-cap);
  window._stadAdd=Math.max(100,Math.min(maxAdd,(window._stadAdd||100)+delta));
  renderStadRozbudowa();
}
function _renderStadModulyInRozb(){
  const mEl=document.getElementById('stad-rozb-moduly');if(!mEl||!G)return;
  if(!G.stadium.modules)G.stadium.modules={};
  const mb=G.stadium.modulBuilding;

  let html='';
  Object.entries(STAD_MODULES).forEach(([key,mod])=>{
    const lvl=getModuleLvl(key);
    const maxLvl=mod.levels.length;
    const next=mod.levels[lvl];
    const isMax=lvl>=maxLvl;
    const isBuilding=mb&&mb.key===key;
    const otherBuilding=mb&&mb.key!==key;
    const req=next?checkModuleReq(next.req):{ok:false,msg:''};
    const canAfford=next&&G.budget>=next.cost;

    // Pasek poziomów
    const dots=Array.from({length:maxLvl},(_,i)=>{
      let col=i<lvl?'var(--gb)':(isBuilding&&i===lvl?'var(--am)':'#1a2a1a');
      return '<div style="flex:1;height:6px;border-radius:2px;margin:0 1px;background:'+col+'"></div>';
    }).join('');

    // Kolor ramki
    const border=isBuilding?'var(--am)':isMax?'#555':lvl>0?'var(--gb)':'var(--gl)';

    // Aktualny efekt (jeśli coś jest)
    const curEffect=lvl>0?stadModEffect(key,lvl-1):'—';

    // Blok statusu / akcji
    let actionHtml='';
    if(isMax){
      actionHtml='<div style="text-align:center;color:var(--am);font-size:var(--fs-dense);padding:4px 0">✓ '+t('stad_module_max')+'</div>';
    } else if(isBuilding){
      const pct=Math.round((1-(mb.weeksLeft/mb.totalWeeks))*100);
      actionHtml=
        '<div style="font-size:var(--fs-dense);color:var(--am);margin-bottom:4px">🔨 '+t('stad_module_in_build').replace('{lvl}',lvl+1).replace('{effect}',stadModEffect(key,lvl))+' — '+t('stad_module_weeks_left').replace('{n}',mb.weeksLeft).replace('{total}',mb.totalWeeks)+'</div>'+
        '<div style="background:#000;height:5px;border:1px solid var(--gl)"><div style="height:100%;background:var(--am);width:'+pct+'%"></div></div>';
    } else if(otherBuilding){
      actionHtml='<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('stad_module_other_build')+'</div>';
    } else if(!req.ok){
      actionHtml='<div style="font-size:var(--fs-dense);color:var(--gr)">🔒 '+req.msg+'</div>';
    } else if(!canAfford){
      actionHtml='<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('stad_no_funds').replace('{n}',fmt(next.cost-G.budget))+'</div>';
    } else {
      actionHtml='<button onclick="buyModule(\''+key+'\')" style="width:100%;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:7px;cursor:pointer;letter-spacing:1px">'+t('stad_module_build_btn').replace('{cost}',fmt(next.cost)).replace('{weeks}',next.buildWeeks||1)+'</button>';
    }

    html+=
      '<div style="background:var(--tb);border:1px solid '+border+';border-radius:3px;padding:10px 12px;margin-bottom:8px">'+
        // Nagłówek: ikona + nazwa + poziom
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
          '<span style="font-size:var(--fs-display);line-height:1">'+mod.icon+'</span>'+
          '<div style="flex:1">'+
            '<div style="font-size:var(--fs-meta);color:var(--wh);letter-spacing:1px">'+stadModName(key)+'</div>'+
            '<div style="font-size:var(--fs-dense);color:var(--gr)">'+
              (isMax?t('stad_module_max'):'L'+lvl+'/'+maxLvl+(next?t('stad_next_suffix').replace('{effect}',stadModEffect(key,lvl)):''))+
            '</div>'+
          '</div>'+
          '<div style="font-size:var(--fs-dense);text-align:right;color:'+(isMax?'var(--am)':'var(--gr)')+'">'+
            (lvl>0?'<div style="color:var(--gb)">'+curEffect+'</div>':'')+
          '</div>'+
        '</div>'+
        // Pasek poziomów
        '<div style="display:flex;margin-bottom:8px">'+dots+'</div>'+
        // Akcja
        actionHtml+
      '</div>';
  });
  mEl.innerHTML=html;
}
function renderStadModuly(){_renderStadModulyInRozb();}
function startBuild(){
  if(!G||!G.stadium)return;
  const s=G.stadium;const cap=s.capacity||200;
  if(s.building){notif(t('stad_pct_notif'),'err');return;}
  const lvl=G.myLeague||8;const maxAdd=Math.min(1000,STAD.maxCap[lvl]-cap);
  const n=Math.max(100,Math.min(maxAdd,window._stadAdd||100));
  const cost=STAD.calcCost(cap,n);const weeks=STAD.buildTime(n);
  if(G.budget<cost){notif(t('train_no_funds'),'err');return;}
  G.budget-=cost;
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:cost,bal:G.budget,season:G.season,note:t('stad_note_expansion').replace('{n}',n.toLocaleString(LANG==='en'?'en-GB':'pl-PL'))});
  s.building={seats:n,weeksLeft:weeks,totalWeeks:weeks,cost};
  addNews(t('news_stad_build_started').replace('{n}',n.toLocaleString(LANG==='en'?'en-GB':'pl-PL')).replace('{cost}',fmt(cost)).replace('{weeks}',weeks),'club');
  notif(t('stad_build_notif').replace('{n}',weeks),'ok');
  window._stadAdd=100;fillStadium();
}
function buyModule(key){
  if(!G||!G.stadium)return;
  if(!G.stadium.modules)G.stadium.modules={};
  const mod=STAD_MODULES[key];if(!mod)return;
  const lvl=getModuleLvl(key);
  if(lvl>=mod.levels.length){notif(t('stad_mod_max'),'err');return;}
  const next=mod.levels[lvl];
  const req=checkModuleReq(next.req);
  if(!req.ok){notif(req.msg,'err');return;}
  if(G.budget<next.cost){notif(t('stad_mod_no_funds'),'err');return;}
  if(G.stadium.modulBuilding){notif(t('stad_mod_other'),'err');return;}
  G.budget-=next.cost;
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:next.cost,bal:G.budget,season:G.season,note:t('stad_note_module_bought').replace('{icon}',mod.icon).replace('{name}',stadModName(key)).replace('{n}',lvl+1)});
  const weeks=next.buildWeeks||1;
  G.stadium.modulBuilding={key,lvl,next,cost:next.cost,weeksLeft:weeks,totalWeeks:weeks};
  addNews(t('news_stad_module_started').replace('{icon}',mod.icon).replace('{name}',stadModName(key)).replace('{lvl}',lvl+1).replace('{weeks}',weeks).replace('{cost}',fmt(next.cost)),'club');
  notif(t('stad_mod_notif').replace('{name}',stadModName(key)).replace('{lvl}',lvl+1).replace('{n}',weeks),'ok');
  renderStadModuly();
}


// ══════════════════════════════════════════════════════════
// ETAP 4 — SPONSORZY + PRAWA TV (w panelu Finanse)
// ══════════════════════════════════════════════════════════
