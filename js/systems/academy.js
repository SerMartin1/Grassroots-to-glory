const ACADEMY={
  costBase: [300000, 900000, 2400000, 7200000, 24000000],
  upkBase:  [1000,   4000,   12000,   36000,   110000],
  costMult: {1:5.0,2:3.0,3:1.8,4:1.2,5:0.8,6:0.5,7:0.35,8:0.25},
  upkMult:  {1:6.0,2:3.5,3:4.0,4:3.6,5:2.1,6:1.2,7:0.75,8:0.45},
  // leagueReq: twardy wymóg ligowy (G.myLeague<=leagueReq), osobny od progu reputacji (req) —
  // wcześniej sam próg reputacji potrafił zostać osiągnięty w słabszej lidze niż sugerował opis
  // w UI (np. rep 100+ w VI lidze zamiast dopiero w V), bo reputacja i awans nie są sztywno
  // powiązane. Wartości dopasowane do istniejących opisowych etykiet (acad_expand_l1/l3/l5).
  levels:[
    {cost:150000,  upkeep:150,   perSeason:1, maxPot:60, ovrMin:18, buildWeeks:8,  key:'basic',   req:0,   leagueReq:8},
    {cost:450000,  upkeep:800,   perSeason:2, maxPot:72, ovrMin:22, buildWeeks:12, key:'advanced',req:100, leagueReq:6},
    {cost:1200000, upkeep:2500,  perSeason:3, maxPot:82, ovrMin:27, buildWeeks:20, key:'pro',     req:250, leagueReq:4},
    {cost:3600000, upkeep:8000,  perSeason:5, maxPot:92, ovrMin:32, buildWeeks:32, key:'elite',   req:500, leagueReq:2},
    {cost:12000000,upkeep:25000, perSeason:2, maxPot:99, ovrMin:38, buildWeeks:52, key:'masters', req:800, ekstraOnly:true},
  ]
};
function _acadName(a){return t('acad_lvl_'+(a.key||'basic'));}
const TRAINING_CENTER={
  costBase:[160000,700000,2400000],
  upkBase: [600,2400,8000],
  costMult:{1:5.0,2:3.0,3:1.8,4:1.2,5:0.8,6:0.5,7:0.35,8:0.25},
  upkMult: {1:6.0,2:3.5,3:4.0,4:3.6,5:2.1,6:1.2,7:0.75,8:0.45},
  changeCost:{0:10000,1:30000,2:80000},
  levels:[
    {key:'basic',    profiles:1, buildWeeks:4,  req:{rep:0,  stad:0}},
    {key:'advanced', profiles:2, buildWeeks:8,  req:{rep:150,stad:1000}},
    {key:'elite',    profiles:3, buildWeeks:14, req:{rep:400,stad:5000}},
  ]
};
function _tcLvlName(lvl){return t('tc_lvl_'+(lvl.key||'basic'));}
const TC_PROFILES=[
  {id:'kondycja',   icon:'[Kond]', get name(){return t('tc_profile_kondycja');},   attrBonus:{phy:1.5}, fatBonus:true, posFilter:null,         get effect(){return t('tc_eff_kondycja');}},
  {id:'technika',   icon:'[Tech]', get name(){return t('tc_profile_technika');},   attrBonus:{tec:1.4,pas:1.4},       posFilter:null,         get effect(){return t('tc_eff_technika');}},
  {id:'atak',       icon:'[Atk]',  get name(){return t('tc_profile_atak');},       attrBonus:{sht:1.5,tec:1.5},       posFilter:['NAP'],      get effect(){return t('tc_eff_atak');}},
  {id:'obrona',     icon:'[Obr]',  get name(){return t('tc_profile_obrona');},     attrBonus:{def:1.5,men:1.5},       posFilter:['OBR','GK'], get effect(){return t('tc_eff_obrona');}},
  {id:'mentalnosc', icon:'[Men]',  get name(){return t('tc_profile_mentalnosc');}, attrBonus:{men:1.6}, formBonus:3,  posFilter:null,         get effect(){return t('tc_eff_mentalnosc');}},
  {id:'regeneracja',icon:'[Reg]',  get name(){return t('tc_profile_regeneracja');},injBonus:0.85,healBonus:0.75,      posFilter:null,         get effect(){return t('tc_eff_regeneracja');}},
];
function acadCost(lvlIdx){
  const lg=G?G.myLeague||8:8;
  const m=ACADEMY.costMult[lg]||1;
  return Math.round((ACADEMY.costBase[lvlIdx]||ACADEMY.levels[lvlIdx].cost)*m/500)*500;
}
function acadUpkeep(lvlIdx){
  const lg=G?G.myLeague||8:8;
  const m=ACADEMY.upkMult[lg]||1;
  return Math.round((ACADEMY.upkBase[lvlIdx]||ACADEMY.levels[lvlIdx].upkeep)*m/50)*50;
}
function tcCost(i){const lg=G?G.myLeague||8:8;return Math.round((TRAINING_CENTER.costBase[i]||80000)*(TRAINING_CENTER.costMult[lg]||1)/500)*500;}
function tcUpkeep(i){const lg=G?G.myLeague||8:8;return Math.round((TRAINING_CENTER.upkBase[i]||300)*(TRAINING_CENTER.upkMult[lg]||1)/50)*50;}
function tcLevel(){return(G&&G.trainingCenter&&G.trainingCenter.level)||0;}
function tcProfiles(){return(G&&G.trainingCenter&&G.trainingCenter.profiles)||[];}
function tcMaxProfiles(){const l=tcLevel();return l>0?TRAINING_CENTER.levels[l-1].profiles:0;}
function getAcadLvl(){return(G.academy&&G.academy.level)||0;}
function acadTab(tab,btn){
  document.querySelectorAll('#p-academy .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['przeglad','wychowankowie'].forEach(tr=>{const el=document.getElementById('acad-'+tr);if(el)el.classList.remove('on');});
  const el=document.getElementById('acad-'+tab);if(el)el.classList.add('on');
  if(tab==='przeglad')renderAcadPrzeglad();
  else if(tab==='wychowankowie')renderAcadWychowankowie();
}
function fillAcademy(){
  if(!G)return;
  if(!G.academy)G.academy={level:0,prospects:[],hist:[],trainees:[]};
  if(!G.academy.trainees)G.academy.trainees=[];
  renderAcadPrzeglad();
}
function renderAcadPrzeglad(){
  const el=document.getElementById('acad-przeglad');if(!el||!G)return;
  if(!G.academy)G.academy={level:0,prospects:[],hist:[],trainees:[]};
  if(!G.academy.trainees)G.academy.trainees=[];
  const lvl=getAcadLvl();
  const acad=ACADEMY.levels[lvl-1];
  const prospects=(G.academy.prospects||[]).filter(p=>p.status==='pending');
  el.innerHTML=
    '<div style="background:var(--tb);border:1px solid '+(lvl>0?'var(--gb)':'var(--gl)')+';padding:12px;margin-bottom:10px">'+
      '<div style="font-size:var(--fs-meta);color:var(--am);margin-bottom:6px">'+
        (lvl===0?t('acad_none'):t('acad_name_lvl').replace('{name}',_acadName(acad)).replace('{lvl}',lvl))+
      '</div>'+
      (lvl>0?
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:var(--fs-dense)">'+
          '<div><span style="color:var(--gr)">'+t('acad_per_season')+' </span><span style="color:var(--gb)">'+acad.perSeason+'</span></div>'+
          '<div><span style="color:var(--gr)">'+t('acad_max_pot')+' </span><span style="color:var(--am)">'+acad.maxPot+'</span></div>'+
          '<div><span style="color:var(--gr)">'+t('acad_upkeep')+' </span><span style="color:var(--rd)">-'+fmt(acadUpkeep(lvl-1))+'</span></div>'+
        '</div>'+
        (lvl<ACADEMY.levels.length?
          '<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:6px">'+t('acad_next_level')+' <span style="color:var(--am)">'+_acadName(ACADEMY.levels[lvl])+'</span> — <span style="color:var(--wh)">'+fmt(acadCost(lvl))+'</span>'+
          (ACADEMY.levels[lvl].req>0?t('acad_next_rep').replace('{n}',ACADEMY.levels[lvl].req):'')+
          '</div>'
        :'')
      :'<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('acad_no_acad_desc')+'</div>')+
      (G.academy.building?
        '<div style="margin-top:8px;padding:8px;background:#0d1f0d;border:1px solid var(--am);font-size:var(--fs-dense)">'+
          '<div style="color:var(--am)">'+t('acad_building_now').replace('{name}',G.academy.building.name)+'</div>'+
          '<div style="color:var(--gr)">'+t('acad_building_weeks').replace('{n}',G.academy.building.weeksLeft)+'</div>'+
        '</div>'
      :'')+
    '</div>'+
    (prospects.length?
      '<div style="font-size:var(--fs-dense);color:var(--am);margin-bottom:6px">'+t('acad_new_juniors')+'</div>'+
      prospects.map(function(pr){
        var trLabel=pr.trainRate>=1.5?t('acad_talent_star'):pr.trainRate>=1.1?t('acad_talent_fast'):t('acad_talent_normal');
        var trCol=pr.trainRate>=1.5?'#00e676':pr.trainRate>=1.1?'var(--am)':'var(--wh)';
        var arch5=pr.archetype&&ARCHETYPE_META[pr.archetype]?ARCHETYPE_META[pr.archetype]:null;
        var ATTRS5=['tec','pas','sht','def','phy','men'];
        var ATTR_LBL5={tec:'TEC',pas:'PAS',sht:'SHT',def:'DEF',phy:'PHY',men:'MEN'};
        var barHtml5=ATTRS5.map(function(a){
          var archM5=arch5?arch5.mult[a]||1.0:1.0;
          var total5=parseFloat((pr.trainRate*archM5).toFixed(2));
          var pct5=Math.min(100,Math.round(total5*50));
          var isHigh5=archM5>1;
          var barCol5=isHigh5?(arch5?arch5.color:'var(--am)'):'var(--gl)';
          return '<div style="flex:1;text-align:center">'+
            '<div style="font-size:var(--fs-dense);color:'+(isHigh5?(arch5?arch5.color:'var(--am)'):'var(--gr)')+'">'+ATTR_LBL5[a]+'</div>'+
            '<div style="height:18px;background:#0a0f0a;margin:2px 0;position:relative">'+
              '<div style="position:absolute;bottom:0;left:0;right:0;height:'+pct5+'%;background:'+barCol5+';opacity:0.85"></div>'+
            '</div>'+
            '<div style="font-size:var(--fs-dense);color:'+(isHigh5?(arch5?arch5.color:'var(--am)'):'var(--gr)')+'">x'+total5.toFixed(1)+'</div>'+
          '</div>';
        }).join('');
        return '<div style="background:#0d2b0d;border:1px solid var(--gb);padding:10px 12px;margin-bottom:6px">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">'+
            '<div style="font-size:var(--fs-meta);color:var(--wh)">🎓 '+pr.name+'</div>'+
            (arch5?'<span style="font-size:var(--fs-dense);color:'+arch5.color+';border:1px solid '+arch5.color+';padding:1px 5px">'+arch5.icon+' '+arch5.name+'</span>':'')+
          '</div>'+
          '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+
            (POS_SHORT[pr.pos]||pr.pos)+' • '+pr.age+'l • OVR '+pr.ovr+' • Pot: <span style="color:var(--am)">'+pr.potential+'</span>'+
          '</div>'+
          '<div style="background:#0a0f0a;border:1px solid var(--gl);padding:5px 8px;margin-bottom:6px">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:3px">'+
              '<span style="font-size:var(--fs-dense);color:var(--gr)">'+t('acad_training_speed')+'</span>'+
              '<span style="font-size:var(--fs-dense);color:'+trCol+'">'+trLabel+'</span>'+
            '</div>'+
            '<div style="display:flex;gap:2px">'+barHtml5+'</div>'+
          '</div>'+
          (arch5?'<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">'+t('acad_archetype_lbl')+' <span style="color:'+arch5.color+'">'+arch5.icon+' '+arch5.name+'</span></div>':'')+
          '<div style="display:flex;gap:6px">'+
            '<button onclick="acceptProspect('+pr.id+')" style="flex:1;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+t('acad_accept_btn')+'</button>'+
            '<button onclick="rejectProspect('+pr.id+')" style="flex:1;background:var(--gm);color:var(--rd);border:1px solid var(--rd);font-size:var(--fs-meta);padding:8px;cursor:pointer">'+t('acad_reject_btn')+'</button>'+
          '</div>'+
        '</div>';
      }).join('')
    :'<div style="font-size:var(--fs-dense);color:var(--gr);padding:8px 0">'+t('acad_no_prospects')+'</div>');
  if(lvl===0&&!G.academy.building){
    const buildDiv=document.createElement('div');
    buildDiv.innerHTML=
      '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">'+t('acad_expand_cost')+' <span style="color:var(--am)">'+fmt(acadCost(0))+'</span></div>'+
      '<button onclick="buildAcademy(0)" style="width:100%;background:var(--am);color:#000;border:none;font-size:var(--fs-body);padding:12px;cursor:pointer">'+t('acad_expand_build_btn').replace('{cost}',fmt(acadCost(0)))+'</button>';
    el.appendChild(buildDiv);
  }
  _renderAcadRozbudowaInPrzeglad();
}
function _renderAcadRozbudowaInPrzeglad(){
  const el=document.getElementById('acad-przeglad');if(!el||!G)return;
  const lvl=getAcadLvl();if(lvl===0)return;
  const rep=G.reputation||30;const lg=G.myLeague||8;
  const sec=document.createElement('div');
  sec.innerHTML=
    '<div class="fsec" style="margin:14px 0 8px">'+t('acad_expand_section')+'</div>'+
    ACADEMY.levels.map((a,i)=>{
      if(a.ekstraOnly&&lg!==1)return'';
      const isOwned=i<lvl;const isNext=i===lvl;
      const cost=acadCost(i);const upk=acadUpkeep(i);
      const reqOk=rep>=(a.req||0);const canAfford=G.budget>=cost;
      const availLine=a.ekstraOnly?t('acad_expand_premier'):a.req>=500?t('acad_expand_l1'):a.req>=250?t('acad_expand_l3'):a.req>=100?t('acad_expand_l5'):'';
      return '<div style="background:var(--tb);border:2px solid '+(isOwned?'var(--gb)':isNext?'var(--am)':'var(--gl)')+';padding:10px 12px;margin-bottom:8px">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
          '<div style="font-size:var(--fs-dense);color:'+(isOwned?'var(--gb)':isNext?'var(--am)':'var(--gr)')+'">L'+(i+1)+' — '+_acadName(a)+(a.ekstraOnly?' [Ekstra]':'')+'</div>'+
          (isOwned?'<div style="font-size:var(--fs-dense);color:var(--gb)">'+t('acad_expand_active')+'</div>':'')+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:var(--fs-dense);margin-bottom:6px">'+
          '<div><span style="color:var(--gr)">'+t('acad_expand_juniors')+'</span><span style="color:var(--wh)"> '+a.perSeason+t('acad_expand_per_season')+'</span></div>'+
          '<div><span style="color:var(--gr)">'+t('acad_expand_max_pot')+'</span><span style="color:var(--am)"> '+a.maxPot+'</span></div>'+
          '<div><span style="color:var(--gr)">'+t('acad_expand_ovr_start')+'</span><span style="color:var(--wh)"> '+(a.ovrMin||18)+'-'+a.maxPot+'</span></div>'+
          '<div><span style="color:var(--gr)">'+t('acad_expand_cost')+'</span><span style="color:var(--wh)"> '+fmt(cost)+'</span></div>'+
          '<div><span style="color:var(--gr)">'+t('acad_expand_upkeep')+'</span><span style="color:var(--rd)"> -'+fmt(upk)+'</span></div>'+
          '<div><span style="color:var(--gr)">'+t('acad_expand_build_time')+'</span><span style="color:var(--am)"> '+a.buildWeeks+' '+t('stad_weeks').replace('{n}','').trim()+'</span></div>'+
          (a.req>0?'<div><span style="color:var(--gr)">'+t('acad_expand_req_rep')+'</span><span style="color:'+(reqOk?'var(--gb)':'var(--rd)')+'"> '+(reqOk?t('acad_expand_rep_ok').replace('{n}',a.req):t('acad_expand_rep_missing').replace('{n}',a.req).replace('{diff}',a.req-rep))+'</span></div>':'')+
          (availLine?'<div><span style="color:var(--gr)">'+t('acad_expand_avail')+'</span><span style="color:var(--wh)"> '+availLine+'</span></div>':'')+
        '</div>'+
        (!isOwned&&isNext?
          (!reqOk?'<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('acad_expand_locked').replace('{req}',a.req).replace('{rep}',rep)+'</div>':
           !canAfford?'<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('acad_expand_no_funds').replace('{n}',fmt(cost-G.budget))+'</div>':
           '<button onclick="buildAcademy('+i+')" style="width:100%;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+t('acad_expand_upgrade_btn').replace('{cost}',fmt(cost))+'</button>')
        :'')+
      '</div>';
    }).join('');
  el.appendChild(sec);
}
function renderAcadWychowankowie(sub){
  const el=document.getElementById('acad-wychowankowie');if(!el||!G||!G.academy)return;
  if(!G.academy.trainees)G.academy.trainees=[];
  const activeSub=sub||el.dataset.sub||'trainees';
  el.dataset.sub=activeSub;

  // Podzakładki
  const mkSub=(id,lbl)=>'<button onclick="renderAcadWychowankowie(\''+id+'\')" style="flex:1;padding:7px 4px;background:none;border:none;border-bottom:2px solid '+(activeSub===id?'var(--gb)':'transparent')+';font-size:var(--fs-micro);color:'+(activeSub===id?'var(--gb)':'var(--gr)')+';cursor:pointer">'+lbl+'</button>';
  let html='<div style="display:flex;border-bottom:1px solid var(--gl);margin-bottom:10px">'+
    mkSub('trainees',t('acad_sub_trainees'))+
    mkSub('current',t('acad_sub_current'))+
    mkSub('history',t('acad_sub_history'))+
    mkSub('rejected',t('acad_sub_rejected'))+
  '</div>';

  if(activeSub==='trainees'){
    // Wychowankowie w trakcie treningu w akademii (jeszcze nie w kadrze seniorskiej)
    const trainees=G.academy.trainees||[];
    if(!trainees.length){
      html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:12px">'+t('acad_no_trainees')+'</div>';
    } else {
      trainees.slice().sort((a,b)=>ovr(b)-ovr(a)).forEach(p=>{
        const arch=p.archetype&&ARCHETYPE_META[p.archetype]?ARCHETYPE_META[p.archetype]:null;
        const normalEligible=(p.age||16)>=19||((p.age||16)>=18&&(p.academySeasons||0)>=1);
        html+='<div style="background:var(--tb);border:1px solid var(--gb);padding:10px 12px;margin-bottom:8px">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">'+
            '<div>'+
              '<div style="font-size:var(--fs-meta);color:var(--wh)">🎓 '+p.name+'</div>'+
              '<div style="font-size:var(--fs-dense);color:var(--gr)">'+(POS_SHORT[p.pos]||p.pos)+' • '+p.age+'l'+(p.potential?' • Pot: '+p.potential:'')+' • '+t('acad_trainee_seasons').replace('{n}',p.academySeasons||0)+'</div>'+
            '</div>'+
            '<div style="font-size:var(--fs-body);color:var(--gb)">OVR '+ovr(p)+'</div>'+
          '</div>'+
          (arch?'<div style="font-size:var(--fs-dense);color:'+arch.color+';margin-bottom:6px">'+arch.icon+' '+arch.name+'</div>':'')+
          '<div style="font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+t('acad_trainee_focus_label')+'</div>'+
          '<div style="display:flex;gap:4px;margin-bottom:8px">'+
            Object.keys(TRAINEE_FOCUS_ATTRS).map(function(fk){
              const active=p.academyFocus===fk;
              return '<button onclick="setTraineeFocus('+p.id+',\''+fk+'\')" style="flex:1;background:'+(active?'var(--gb)':'var(--gm)')+';color:'+(active?'#000':'var(--wh)')+';border:1px solid var(--gl);font-size:var(--fs-dense);padding:6px 2px;cursor:pointer">'+t('acad_trainee_focus_'+fk)+'</button>';
            }).join('')+
          '</div>'+
          '<div style="display:flex;gap:6px">'+
            '<button onclick="promoteTrainee('+p.id+','+(!normalEligible)+')" style="flex:1;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+(normalEligible?t('acad_trainee_promote_btn'):t('acad_trainee_promote_early_btn'))+'</button>'+
            '<button onclick="releaseTrainee('+p.id+')" style="flex:1;background:var(--gm);color:var(--rd);border:1px solid var(--rd);font-size:var(--fs-meta);padding:8px;cursor:pointer">'+t('acad_trainee_release_btn')+'</button>'+
          '</div>'+
          (!normalEligible?'<div style="font-size:var(--fs-dense);color:var(--am);margin-top:6px">'+t('acad_trainee_promote_early_warn')+'</div>':'')+
        '</div>';
      });
    }

  } else if(activeSub==='current'){
    // Wychowankowie aktualnie w składzie
    const graduates=myPl().filter(p=>p.fromAcademy);
    if(!graduates.length){
      html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:12px">'+t('acad_no_current')+'</div>';
    } else {
      graduates.sort((a,b)=>ovr(b)-ovr(a)).forEach(p=>{
        const arch=p.archetype&&ARCHETYPE_META[p.archetype]?ARCHETYPE_META[p.archetype]:null;
        html+='<div style="background:var(--tb);border:1px solid var(--gb);padding:10px 12px;margin-bottom:8px;cursor:pointer" onclick="showById('+p.id+')" >'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">'+
            '<div>'+
              '<div style="font-size:var(--fs-meta);color:var(--wh)">🎓 '+p.name+'</div>'+
              '<div style="font-size:var(--fs-dense);color:var(--gr)">'+(POS_SHORT[p.pos]||p.pos)+(p.potential?' • Pot: '+p.potential:'')+'</div>'+
            '</div>'+
            '<div style="font-size:var(--fs-body);color:var(--gb)">OVR '+ovr(p)+'</div>'+
          '</div>'+
          (arch?'<div style="font-size:var(--fs-dense);color:'+arch.color+'">'+arch.icon+' '+arch.name+'</div>':'')+
        '</div>';
      });
    }

  } else if(activeSub==='history'){
    // Wszyscy wychowankowie już promowani choć raz do kadry seniorskiej — oś czasu budowana z
    // p.history[] (to samo, już poprawnie zasilane źródło co renderAcadHistoryTab() na karcie
    // zawodnika), NIE z martwych pól G.academy.hist (h.ovr/h.m/h.g/h.a/h.club nigdy nie były
    // tam ustawiane — patrz diagnoza prompt #8, pkt 4 ustaleń).
    const joinedPids=[...new Set((G.academy.hist||[]).filter(h=>!h.isRejected&&h.pid&&(h.action==='Joined squad')).map(h=>h.pid))];
    const pool=(G.players||[]).concat(G.retiredPlayers||[]);
    const players=joinedPids.map(pid=>pool.find(p=>p.id===pid)).filter(Boolean);
    if(!players.length){
      html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:12px">'+t('acad_grad_none')+'</div>';
    } else {
      players.forEach(p=>{
        const cur=G.players.find(x=>x.id===p.id);
        const curOvr=cur?ovr(cur):null;
        const allHist=(p.history||[]).filter(h=>!h._placeholder).sort((a,b)=>a.season-b.season);
        html+='<div style="background:var(--tb);border:1px solid var(--gb);padding:10px 12px;margin-bottom:8px">'+
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
            '<div>'+
              '<div style="font-size:var(--fs-meta);color:var(--wh)'+(cur?';cursor:pointer" onclick="showById('+cur.id+')':'"')+'>🎓 '+p.name+'</div>'+
              '<div style="font-size:var(--fs-dense);color:var(--gr)">'+(POS_SHORT[p.pos]||p.pos)+(p.potential?' • Pot: '+p.potential:'')+'</div>'+
            '</div>'+
            (curOvr?'<div style="font-size:var(--fs-body);color:var(--gb)">OVR '+curOvr+'</div>':'')+
          '</div>';
        allHist.forEach((h,idx)=>{
          const prevH=allHist[idx-1];
          const ovrGrowth=prevH&&h.ovr&&prevH.ovr?h.ovr-prevH.ovr:0;
          const isFirst=idx===0;
          const isHighlight=ovrGrowth>=5||h.g>=5;
          const borderCol=isHighlight?'var(--gb)':'var(--gl)';
          let noteIcon='';
          if(isFirst)noteIcon=t('acad_grad_joined');
          else if(h.m>0&&prevH&&(prevH.m||0)===0)noteIcon=t('acad_grad_debut');
          else if(h.g>=5)noteIcon=t('acad_grad_goals');
          else if(ovrGrowth>=10)noteIcon=t('acad_grad_growth').replace('{n}',ovrGrowth);
          html+='<div style="background:'+(isHighlight?'#0d2b0d':'var(--tb)')+';border:1px solid '+borderCol+';padding:8px 10px;margin-bottom:4px">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
              '<div style="font-size:var(--fs-dense);color:'+(isHighlight?'var(--gb)':'var(--wh)')+'">S'+h.season+' — OVR '+(h.ovr||'?')+'</div>'+
              (ovrGrowth>0?'<div style="font-size:var(--fs-dense);color:var(--gb)">+'+ovrGrowth+' OVR</div>':'')+
            '</div>'+
            '<div style="font-size:var(--fs-dense);color:var(--gr)">'+
              t('acad_grad_matches').replace('{n}',h.m||0)+
              (h.g?t('acad_grad_goals_n').replace('{n}',h.g||0):'')+
              ((h.a||0)>0?t('acad_grad_assists').replace('{n}',h.a||0):'')+
              (h.club?' • <span style="color:var(--am)">'+h.club+'</span>':'')+
            '</div>'+
            (noteIcon?'<div style="font-size:var(--fs-dense);color:var(--am);margin-top:3px">'+noteIcon+'</div>':'')+
          '</div>';
        });
        html+='</div>';
      });
    }

  } else if(activeSub==='rejected'){
    // Odrzuceni juniorzy
    const rejected=(G.academy.hist||[]).filter(h=>h.isRejected);
    if(!rejected.length){
      html+='<div style="font-size:var(--fs-dense);color:var(--gr);padding:12px">'+t('acad_no_rejected')+'</div>';
    } else {
      rejected.slice().reverse().forEach(h=>{
        html+='<div style="background:var(--tb);border:1px solid var(--gl);padding:10px 12px;margin-bottom:6px">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">'+
            '<div>'+
              '<div style="font-size:var(--fs-meta);color:var(--gr)">'+h.name+'</div>'+
              '<div style="font-size:var(--fs-dense);color:var(--gr)">'+h.pos+' • S'+h.season+'</div>'+
            '</div>'+
            '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('acad_rejected_ovr').replace('{n}',h.releaseOvr||'?').replace('{pot}',h.pot||'?')+'</div>'+
          '</div>'+
          '<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('acad_rejected_badge')+'</div>'+
        '</div>';
      });
    }
  }

  el.innerHTML=html;
}
function renderAcadRozbudowa(){
  const el=document.getElementById('acad-rozbudowa');if(!el||!G)return;
  const lvl=getAcadLvl();const rep=G.reputation||30;const lg=G.myLeague||8;
  el.innerHTML=ACADEMY.levels.map((a,i)=>{
    if(a.ekstraOnly&&lg!==1)return'';
    const isOwned=i<lvl;const isNext=i===lvl;
    const cost=acadCost(i);const upk=acadUpkeep(i);
    const reqOk=rep>=(a.req||0);const canAfford=G.budget>=cost;
    const leagueOk=a.leagueReq==null||lg<=a.leagueReq;
    const availLine=a.ekstraOnly?t('acad_expand_premier'):a.req>=500?t('acad_expand_l1'):a.req>=250?t('acad_expand_l3'):a.req>=100?t('acad_expand_l5'):'';
    return '<div style="background:var(--tb);border:2px solid '+(isOwned?'var(--gb)':isNext?'var(--am)':'var(--gl)')+';padding:10px 12px;margin-bottom:8px">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
        '<div style="font-size:var(--fs-dense);color:'+(isOwned?'var(--gb)':isNext?'var(--am)':'var(--gr)')+'">L'+(i+1)+' — '+_acadName(a)+(a.ekstraOnly?' [Ekstra]':'')+'</div>'+
        (isOwned?'<div style="font-size:var(--fs-dense);color:var(--gb)">'+t('acad_expand_active')+'</div>':'')+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:var(--fs-dense);margin-bottom:6px">'+
        '<div><span style="color:var(--gr)">'+t('acad_expand_juniors')+'</span><span style="color:var(--wh)"> '+a.perSeason+t('acad_expand_per_season')+'</span></div>'+
        '<div><span style="color:var(--gr)">'+t('acad_expand_max_pot')+'</span><span style="color:var(--am)"> '+a.maxPot+'</span></div>'+
        '<div><span style="color:var(--gr)">'+t('acad_expand_ovr_start')+'</span><span style="color:var(--wh)"> '+(a.ovrMin||18)+'-'+a.maxPot+'</span></div>'+
        '<div><span style="color:var(--gr)">'+t('acad_expand_cost')+'</span><span style="color:var(--wh)"> '+fmt(cost)+'</span></div>'+
        '<div><span style="color:var(--gr)">'+t('acad_expand_upkeep')+'</span><span style="color:var(--rd)"> -'+fmt(upk)+'</span></div>'+
        '<div><span style="color:var(--gr)">'+t('acad_expand_build_time')+'</span><span style="color:var(--am)"> '+a.buildWeeks+' '+t('stad_weeks').replace('{n}','').trim()+'</span></div>'+
        (a.req>0?'<div><span style="color:var(--gr)">'+t('acad_expand_req_rep')+'</span><span style="color:'+(reqOk?'var(--gb)':'var(--rd)')+'"> '+(reqOk?t('acad_expand_rep_ok').replace('{n}',a.req):t('acad_expand_rep_missing').replace('{n}',a.req).replace('{diff}',a.req-rep))+'</span></div>':'')+
        (availLine?'<div><span style="color:var(--gr)">'+t('acad_expand_avail')+'</span><span style="color:var(--wh)"> '+availLine+'</span></div>':'')+
      '</div>'+
      (!isOwned&&isNext?
        (!leagueOk?'<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('acad_expand_locked_league').replace('{league}',LEAGUE_NAMES[a.leagueReq]).replace('{cur}',LEAGUE_NAMES[lg])+'</div>':
         !reqOk?'<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('acad_expand_locked').replace('{req}',a.req).replace('{rep}',rep)+'</div>':
         !canAfford?'<div style="font-size:var(--fs-dense);color:var(--rd)">'+t('acad_expand_no_funds').replace('{n}',fmt(cost-G.budget))+'</div>':
         '<button onclick="buildAcademy('+i+')" style="width:100%;background:var(--gb);color:#000;border:none;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+(lvl===0?t('acad_expand_build_btn'):t('acad_expand_upgrade_btn')).replace('{cost}',fmt(cost))+'</button>')
      :'')+
    '</div>';
  }).join('');
}
function buildAcademy(levelIdx){
  if(!G)return;
  if(!G.academy)G.academy={level:0,prospects:[],hist:[],trainees:[]};
  if(!G.academy.trainees)G.academy.trainees=[];
  const a=ACADEMY.levels[levelIdx];if(!a)return;
  if(a.ekstraOnly&&(G.myLeague||8)!==1){notif(t('acad_masters_only'),'err');return;}
  if(a.leagueReq!=null&&(G.myLeague||8)>a.leagueReq){notif(t('acad_req_league').replace('{n}',LEAGUE_NAMES[a.leagueReq]),'err');return;}
  const _cst=acadCost(levelIdx);
  if(G.budget<_cst){notif(t('acad_no_funds'),'err');return;}
  if((G.reputation||30)<(a.req||0)){notif(t('acad_req_rep').replace('{n}',a.req),'err');return;}
  G.budget-=_cst;
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:_cst,bal:G.budget,season:G.season,note:'Akademia: '+_acadName(a)});
  const _bw=a.buildWeeks||4;
  G.academy.building={levelIdx:levelIdx+1,weeksLeft:_bw,name:_acadName(a)};
  addNews(t('news_academy_build').replace('{name}',_acadName(a)).replace('{n}',_bw),'academy');
  notif(t('acad_notif_build').replace('{name}',_acadName(a)).replace('{n}',_bw),'ok');
  renderAcadPrzeglad();
}
function acceptProspect(pid){
  if(!G||!G.academy)return;
  if(!G.academy.trainees)G.academy.trainees=[];
  const pr=G.academy.prospects.find(x=>x.id===pid);if(!pr)return;
  pr.status='accepted';
  // v: prospekt NIE trafia od razu do G.players — ląduje w G.academy.trainees na fazę treningu
  // w akademii (setTraineeFocus/promoteTrainee), zanim wejdzie do kadry seniorskiej. p.history
  // celowo pusty na tym etapie: trainee nie gra meczów klubowych, pierwszy wpis history powstaje
  // dopiero przy promoteTrainee() (ten sam idiom co transfer wchodzący, kronika.js:200-206).
  const p=mkPlayer(G.myClubId);
  p.id=pr.id;p.name=pr.name;p.last=pr.name.split(' ')[1]||pr.name;
  p.pos=pr.pos;p.age=pr.age;p.trainRate=pr.trainRate;p.trainMatches=0;
  p.potential=pr.potential;p.fromAcademy=true;p.archetype=pr.archetype||null;
  ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(pr.ovr+r(-5,5))));});
  p.value=calcValue(ovr(p),p.age);p.salary=calcSalary(p.value,G.myLeague,ovr(p));
  p.history=[];
  p.academyFocus=null;p.academySeasons=0;p.academyJoinedSeason=G.season;
  G.academy.trainees.push(p);
  G.academy.hist.push({pid:p.id,season:G.season,name:pr.name,pos:POS_SHORT[pr.pos]||pr.pos,action:'Joined academy',joinedSeason:G.season,archetype:pr.archetype||null,startOvr:pr.ovr,pot:pr.potential});
  addNews(t('news_academy_joined').replace('{name}',pr.name).replace('{pot}',pr.potential),'academy');
  notif(t('acad_notif_accept').replace('{name}',pr.name),'ok');
  renderAcadPrzeglad();renderAcadWychowankowie();
}
const TRAINEE_FOCUS_ATTRS={ATK:['sht','tec'],POL:['pas','men'],OBR:['def','phy'],BAL:['tec','pas','sht','def','phy','men']};
function setTraineeFocus(pid,focusKey){
  if(!G||!G.academy)return;
  const p=(G.academy.trainees||[]).find(x=>x.id===pid);if(!p)return;
  if(!TRAINEE_FOCUS_ATTRS[focusKey])return;
  p.academyFocus=focusKey;
  notif(t('acad_notif_focus_set').replace('{name}',p.name).replace('{focus}',t('acad_trainee_focus_'+focusKey)),'ok');
  renderAcadWychowankowie();
}
// Rozliczenie sezonowego fokusu — wołane raz na koniec sezonu (season-summary.js, obok
// generateProspects()), NIE co tydzień — świadomy kompromis Wariantu B, patrz PROMPTY_ROZWOJOWE.
function applyTraineeFocusGains(){
  if(!G||!G.academy||!G.academy.trainees)return;
  G.academy.trainees.forEach(p=>{
    // Trainees siedzą poza G.players, więc nie łapie ich żadna z dwóch istniejących pętli
    // starzenia (season-summary.js myPl().forEach dla klubu gracza, match-post.js dla AI) —
    // bez tego trainee nigdy nie osiągnąłby progu autoPromoteTrainees() i utknąłby w akademii
    // na zawsze, chyba że gracz ręcznie go promuje wcześniej.
    p.age=(p.age||16)+1;
    p.academySeasons=(p.academySeasons||0)+1;
    const focusAttrs=TRAINEE_FOCUS_ATTRS[p.academyFocus]||TRAINEE_FOCUS_ATTRS.BAL;
    const arch=p.archetype&&ARCHETYPE_META[p.archetype]?ARCHETYPE_META[p.archetype]:null;
    focusAttrs.forEach(attr=>{
      const tr=p.trainRate||1.0;
      const archM=arch?(arch.mult[attr]||1.0):1.0;
      const baseGain=r(3,6);
      const gain=Math.max(1,Math.round(baseGain*tr*archM));
      const before=p[attr];
      p[attr]=Math.min(99,p[attr]+gain);
      if(ovr(p)>=p.potential)p[attr]=before;
    });
  });
}
function promoteTrainee(pid,early){
  if(!G||!G.academy||!G.academy.trainees)return;
  const idx=G.academy.trainees.findIndex(x=>x.id===pid);if(idx===-1)return;
  const p=G.academy.trainees[idx];
  if(early){
    // Kara za przedwczesną promocję: ucięcie części niewykorzystanego zapasu potencjału
    p.potential=Math.max(ovr(p)+3,p.potential-10);
  }
  G.academy.trainees.splice(idx,1);
  p.clubId=G.myClubId;p.starter=false;p.status='active';p.isFreeAgent=false;p._seasonsAtClub=0;
  p.contract=3;
  p.value=calcValue(ovr(p),p.age);p.salary=calcSalary(p.value,G.myLeague,ovr(p));
  if(!p.history.find(h=>h._current&&h.season===G.season&&h.clubId===G.myClubId)){
    p.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'?',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(p),avgRat:null,_current:true});
  }
  assignJerseyNum(p);
  G.players.push(p);
  const histEntry=G.academy.hist.find(h=>h.pid===p.id&&h.action==='Joined academy');
  // joinedSeason przestawiony na sezon PROMOCJI (nie akceptacji do akademii) — acFreshGraduate()/
  // acFirstGraduateEntry() w kronika-eventy-academy.js zakładają, że to sezon wejścia do kadry.
  if(histEntry){histEntry.action='Joined squad';histEntry.joinedSeason=G.season;}
  addNews(t('news_academy_joined').replace('{name}',p.name).replace('{pot}',p.potential),'academy');
  notif(t(early?'acad_notif_promote_early':'acad_notif_promote').replace('{name}',p.name),'ok');
  renderAcadPrzeglad();renderAcadWychowankowie();
}
function releaseTrainee(pid){
  if(!G||!G.academy||!G.academy.trainees)return;
  const idx=G.academy.trainees.findIndex(x=>x.id===pid);if(idx===-1)return;
  const p=G.academy.trainees[idx];
  G.academy.trainees.splice(idx,1);
  G.academy.hist.push({season:G.season,name:p.name,pos:POS_SHORT[p.pos]||p.pos,action:'Released (trainee)',releaseOvr:ovr(p),pot:p.potential,archetype:p.archetype||null,isRejected:true});
  notif(t('acad_notif_reject').replace('{name}',p.name),'ok');
  renderAcadWychowankowie();
}
// Promocja automatyczna — wołana raz na koniec sezonu (season-summary.js, obok
// generateProspects()). Wiek>=19: promocja wymuszona. Wiek>=18 i co najmniej 1 pełny sezon w
// akademii: promocja domyślna (gracz mógł przyspieszyć ręcznie wcześniej przez UI).
function autoPromoteTrainees(){
  if(!G||!G.academy||!G.academy.trainees)return;
  [...G.academy.trainees].forEach(p=>{
    if((p.age||16)>=19||((p.age||16)>=18&&(p.academySeasons||0)>=1))promoteTrainee(p.id,false);
  });
}
function rejectProspect(pid){
  if(!G||!G.academy)return;
  const pr=G.academy.prospects.find(x=>x.id===pid);if(!pr)return;
  pr.status='rejected';
  G.academy.hist.push({season:G.season,name:pr.name,pos:POS_SHORT[pr.pos]||pr.pos,action:'Released (junior)',releaseOvr:pr.ovr,pot:pr.potential,archetype:pr.archetype||null,isRejected:true});
  notif(t('acad_notif_reject').replace('{name}',pr.name),'ok');
  renderAcadPrzeglad();
}
function generateProspects(){
  if(!G||!G.academy||G.academy.level===0)return;
  const lvl=getAcadLvl();const acad=ACADEMY.levels[lvl-1];if(!acad)return;
  if(!G.academy.prospects)G.academy.prospects=[];
  G.academy.prospects=G.academy.prospects.filter(p=>p.status!=='pending');
  const pos=['GK','OBR','OBR','POL','POL','NAP','NAP','OBR'];
  for(let i=0;i<acad.perSeason;i++){
    const trRoll=Math.random();
    const trainRate=trRoll<0.10?(50+r(0,30))/100:trRoll<0.45?(81+r(0,29))/100:trRoll<0.75?(110+r(0,40))/100:(150+r(0,50))/100;
    const baseOvr=r(10,25);
    const potential=Math.min(acad.maxPot,baseOvr+r(20,acad.maxPot-baseOvr));
    const _arch4=['wojownik','techniczny','snajper','lider'][Math.floor(Math.random()*4)];
    G.academy.prospects.push({id:pid++,name:getUniqueName(),pos:pos[Math.floor(Math.random()*pos.length)],age:r(16,17),ovr:baseOvr,potential,trainRate,archetype:_arch4,status:'pending'});
  }
  if(!G.news)G.news=[];
  G.news.unshift({msg:t('acad_news_prospects').replace('{n}',acad.perSeason),type:'ok',week:G.week,season:G.season,action:'academy',actionLabel:t('acad_news_action')});
  renderNews();
}
function renderAcadHistoryTab(p){
  var el=document.getElementById('plr-acad-content');if(!el)return;
  var arch=p.archetype&&ARCHETYPE_META[p.archetype]?ARCHETYPE_META[p.archetype]:null;
  var hist=(p.history||[]).filter(function(h){return !h._placeholder;}).sort(function(a,b){return a.season-b.season;});
  var acadDebH=hist.find(function(h){return h.fromAcademy;})||hist[0];
  var curOvr=ovr(p);
  var debOvr=acadDebH?acadDebH.ovr:curOvr;
  var debSzn=acadDebH?acadDebH.season:G.season;
  var seasonsInClub=hist.filter(function(h){return h.clubId===G.myClubId;}).length;
  var totalM=hist.reduce(function(s,h){return s+(h.m||0);},0);
  var growth=curOvr-debOvr;
  var myPls=myPl();
  var betterThanOnDebut=myPls.filter(function(x){return ovr(x)>debOvr;}).length;
  var pctWeak=myPls.length>0?Math.round((betterThanOnDebut/myPls.length)*100):0;
  var rankNow=[...myPls].sort(function(a,b){return ovr(b)-ovr(a);}).findIndex(function(x){return x.id===p.id;})+1;

  var html='';
  html+='<div style="background:#0a1f0a;border:2px solid #9c27b0;padding:10px 12px;margin-bottom:10px">'+
    '<div style="font-size:var(--fs-dense);color:#ce93d8;margin-bottom:4px">'+t('acad_hist_graduate_badge')+'</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
      (arch?'<span style="font-size:var(--fs-dense);color:'+arch.color+';border:1px solid '+arch.color+';padding:1px 5px">'+arch.icon+' '+arch.name+'</span>':'')+
      '<span style="font-size:var(--fs-dense);color:var(--gb);border:1px solid var(--gb);padding:1px 5px">'+t('acad_hist_since').replace('{n}',debSzn)+'</span>'+
    '</div>'+
  '</div>';

  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:10px">'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 4px;text-align:center">'+
      '<div style="font-size:'+(growth>0?'var(--fs-body)':'var(--fs-meta)')+';color:'+(growth>0?'var(--gb)':'var(--gr)')+'">+'+(growth>0?growth:0)+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('acad_hist_ovr_growth')+'</div>'+
    '</div>'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 4px;text-align:center">'+
      '<div style="font-size:var(--fs-body);color:var(--am)">'+seasonsInClub+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('acad_hist_seasons_here')+'</div>'+
    '</div>'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 4px;text-align:center">'+
      '<div style="font-size:var(--fs-body);color:var(--wh)">'+totalM+'</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+t('acad_hist_matches')+'</div>'+
    '</div>'+
  '</div>';

  if(myPls.length>1){
    html+='<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 10px;margin-bottom:10px;font-size:var(--fs-dense)">'+
      '<span style="color:var(--gr)">'+t('acad_hist_worse_on_debut')+'</span><span style="color:var(--rd)">'+t('acad_hist_pct_squad').replace('{n}',pctWeak)+'</span>'+
      (rankNow>0?'<span style="color:var(--gr)">'+t('acad_hist_rank_now')+'</span><span style="color:var(--gb)">'+(rankNow===1?t('acad_hist_rank_best'):t('acad_hist_rank_nth').replace('{n}',rankNow))+'</span><span style="color:var(--gr)">'+t('acad_hist_rank_suffix')+'</span>':'')+'.'+
    '</div>';
  }

  html+='<div style="font-size:var(--fs-dense);color:var(--gr);letter-spacing:1px;border-bottom:1px solid var(--gl);padding-bottom:3px;margin-bottom:8px">'+t('acad_hist_timeline')+'</div>';
  var allHist=(p.history||[]).filter(function(h){return !h._placeholder;}).sort(function(a,b){return a.season-b.season;});
  allHist.forEach(function(h,i){
    var isFirst=i===0;
    var prevH=i>0?allHist[i-1]:null;
    var ovrGrowth=prevH&&h.ovr&&prevH.ovr?(h.ovr-prevH.ovr):0;
    var isHighlight=isFirst||(ovrGrowth>=8)||(h.g>=5)||(h.fromAcademy&&isFirst);
    var borderCol=isHighlight?'var(--gb)':'var(--gl)';
    var noteIcon='';
    if(isFirst&&h.fromAcademy)noteIcon=t('acad_grad_joined');
    else if(h.m>0&&prevH&&(prevH.m||0)===0)noteIcon=t('acad_grad_debut');
    else if(h.g>=5)noteIcon=t('acad_grad_goals');
    else if(ovrGrowth>=10)noteIcon=t('acad_grad_growth').replace('{n}',ovrGrowth);
    html+='<div style="background:'+(isHighlight?'#0d2b0d':'var(--tb)')+';border:1px solid '+borderCol+';padding:8px 10px;margin-bottom:4px">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
        '<div style="font-size:var(--fs-dense);color:'+(isHighlight?'var(--gb)':'var(--wh)')+'">S'+h.season+' — OVR '+(h.ovr||'?')+'</div>'+
        (ovrGrowth>0?'<div style="font-size:var(--fs-dense);color:var(--gb)">+'+ovrGrowth+' OVR</div>':'')+
      '</div>'+
      '<div style="font-size:var(--fs-dense);color:var(--gr)">'+
        t('acad_hist_matches_n').replace('{n}',h.m||0)+
        (h.g?t('acad_hist_goals_n').replace('{n}',h.g||0):'')+
        ((h.a||0)>0?t('acad_hist_assists_n').replace('{n}',h.a||0):'')+
        (h.club?' • '+(h.clubId?'<span style="color:var(--am);cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();openClubModal('+h.clubId+')">'+h.club+'</span>':'<span style="color:var(--am)">'+h.club+'</span>'):'')+
      '</div>'+
      (noteIcon?'<div style="font-size:var(--fs-dense);color:var(--am);margin-top:3px">'+noteIcon+'</div>':'')+
    '</div>';
  });
  el.innerHTML=html;
}
