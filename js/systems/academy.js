const ACADEMY={
  costBase: [150000, 450000, 1200000, 3600000, 12000000],
  upkBase:  [500,    2000,   6000,    18000,   55000],
  costMult: {1:5.0,2:3.0,3:1.8,4:1.2,5:0.8,6:0.5,7:0.35,8:0.25},
  upkMult:  {1:6.0,2:3.5,3:4.0,4:3.6,5:2.1,6:1.2,7:0.75,8:0.45},
  levels:[
    {cost:150000, upkeep:150,  perSeason:1, maxPot:60, ovrMin:18, buildWeeks:8,  name:'Podstawowa',   req:0},
    {cost:450000, upkeep:800,  perSeason:2, maxPot:72, ovrMin:22, buildWeeks:12, name:'Rozwinęta',   req:100},
    {cost:1200000,upkeep:2500, perSeason:3, maxPot:82, ovrMin:27, buildWeeks:20, name:'Zaawansowana', req:250},
    {cost:3600000,upkeep:8000, perSeason:5, maxPot:92, ovrMin:32, buildWeeks:32, name:'Elitarna',     req:500},
    {cost:12000000,upkeep:25000,perSeason:2,maxPot:99, ovrMin:38, buildWeeks:52, name:'Mistrzów',     req:800, ekstraOnly:true},
  ]
};
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
const TRAINING_CENTER={
  costBase:[80000,350000,1200000],
  upkBase: [300,1200,4000],
  costMult:{1:5.0,2:3.0,3:1.8,4:1.2,5:0.8,6:0.5,7:0.35,8:0.25},
  upkMult: {1:6.0,2:3.5,3:4.0,4:3.6,5:2.1,6:1.2,7:0.75,8:0.45},
  changeCost:{0:5000,1:15000,2:40000},
  levels:[
    {name:'Podstawowe',  profiles:1,buildWeeks:4, req:{rep:0,  stad:0}},
    {name:'Zaawansowane',profiles:2,buildWeeks:8, req:{rep:150,stad:1000}},
    {name:'Elitarne',    profiles:3,buildWeeks:14,req:{rep:400,stad:5000}},
  ]
};
const TC_PROFILES=[
  {id:'kondycja',   icon:'[Kond]', name:'Kondycja',    attrBonus:{phy:1.5}, fatBonus:true,  posFilter:null,    effect:'Zmęczenie -2x szybciej, PHY +50%'},
  {id:'technika',   icon:'[Tech]', name:'Technika',    attrBonus:{tec:1.4,pas:1.4},         posFilter:null,    effect:'TEC i PAS +40% szybciej'},
  {id:'atak',       icon:'[Atk]',  name:'Atak',        attrBonus:{sht:1.5,tec:1.5},         posFilter:['NAP'], effect:'SHT i TEC +50% (NAP)'},
  {id:'obrona',     icon:'[Obr]',  name:'Obrona',      attrBonus:{def:1.5,men:1.5},         posFilter:['OBR','GK'], effect:'OBR i MEN +50% (OBR/GK)'},
  {id:'mentalnosc', icon:'[Men]',  name:'Mentalność',attrBonus:{men:1.6}, formBonus:3, posFilter:null,effect:'MEN +60%, Forma +3/tyg'},
  {id:'regeneracja',icon:'[Reg]',  name:'Regeneracja', injBonus:0.85, healBonus:0.75,       posFilter:null,    effect:'Kontuzje -15%, leczenie -25%'},
];
function tcCost(i){const lg=G?G.myLeague||8:8;return Math.round((TRAINING_CENTER.costBase[i]||80000)*(TRAINING_CENTER.costMult[lg]||1)/500)*500;}
function tcUpkeep(i){const lg=G?G.myLeague||8:8;return Math.round((TRAINING_CENTER.upkBase[i]||300)*(TRAINING_CENTER.upkMult[lg]||1)/50)*50;}
function tcLevel(){return(G&&G.trainingCenter&&G.trainingCenter.level)||0;}
function tcProfiles(){return(G&&G.trainingCenter&&G.trainingCenter.profiles)||[];}
function tcMaxProfiles(){const l=tcLevel();return l>0?TRAINING_CENTER.levels[l-1].profiles:0;}
function getAcadLvl(){return(G.academy&&G.academy.level)||0;}
function acadTab(tab,btn){
  document.querySelectorAll('#p-academy .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['przeglad','wychowankowie'].forEach(t=>{const el=document.getElementById('acad-'+t);if(el)el.classList.remove('on');});
  const el=document.getElementById('acad-'+tab);if(el)el.classList.add('on');
  if(tab==='przeglad')renderAcadPrzeglad();
  else if(tab==='wychowankowie')renderAcadWychowankowie();
}
function fillAcademy(){
  if(!G)return;
  if(!G.academy)G.academy={level:0,prospects:[],hist:[]};
  renderAcadPrzeglad();
}
function renderAcadPrzeglad(){
  const el=document.getElementById('acad-przeglad');if(!el||!G)return;
  if(!G.academy)G.academy={level:0,prospects:[],hist:[]};
  const lvl=getAcadLvl();
  const acad=ACADEMY.levels[lvl-1];
  const prospects=(G.academy.prospects||[]).filter(p=>p.status==='pending');
  el.innerHTML=
    '<div style="background:var(--tb);border:1px solid '+(lvl>0?'var(--gb)':'var(--gl)')+';padding:12px;margin-bottom:10px">'+
      '<div style="font-family:VT323,monospace;font-size:var(--fs-meta);color:var(--am);margin-bottom:6px">'+
        (lvl===0?'Brak Akademii':'Akademia '+acad.name+' (L'+lvl+')')+
      '</div>'+
      (lvl>0?
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-family:VT323,monospace;font-size:var(--fs-dense)">'+
          '<div><span style="color:var(--gr)">Juniorzy/sez: </span><span style="color:var(--gb)">'+acad.perSeason+'</span></div>'+
          '<div><span style="color:var(--gr)">Max pot: </span><span style="color:var(--am)">'+acad.maxPot+'</span></div>'+
          '<div><span style="color:var(--gr)">Utrzym/tyg: </span><span style="color:var(--rd)">-'+fmt(acadUpkeep(lvl-1))+'</span></div>'+
        '</div>'+
        (lvl<ACADEMY.levels.length?
          '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);margin-top:6px">Nast. poziom: <span style="color:var(--am)">'+ACADEMY.levels[lvl].name+'</span> — <span style="color:var(--wh)">'+fmt(acadCost(lvl))+' zł</span>'+
          (ACADEMY.levels[lvl].req>0?' (Rep: '+ACADEMY.levels[lvl].req+')':'')+
          '</div>'
        :'')
      :'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">Zbuduj akademię aby co sezon pojawiał się utalentowany junior.</div>')+
    '</div>'+
    (prospects.length?
      '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--am);margin-bottom:6px">NOWI JUNIORZY</div>'+
      prospects.map(function(pr){
        var trLabel=pr.trainRate>=1.5?'🌟 Talent':pr.trainRate>=1.1?'⚡ Szybki':'📊 Normalny';
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
            '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+(isHigh5?(arch5?arch5.color:'var(--am)'):'var(--gr)')+'">'+ATTR_LBL5[a]+'</div>'+
            '<div style="height:18px;background:#0a0f0a;margin:2px 0;position:relative">'+
              '<div style="position:absolute;bottom:0;left:0;right:0;height:'+pct5+'%;background:'+barCol5+';opacity:0.85"></div>'+
            '</div>'+
            '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+(isHigh5?(arch5?arch5.color:'var(--am)'):'var(--gr)')+'">×'+total5.toFixed(1)+'</div>'+
          '</div>';
        }).join('');
        return '<div style="background:#0d2b0d;border:1px solid var(--gb);padding:10px 12px;margin-bottom:6px">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">'+
            '<div style="font-family:VT323,monospace;font-size:var(--fs-meta);color:var(--wh)">🎓 '+pr.name+'</div>'+
            (arch5?'<span style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+arch5.color+';border:1px solid '+arch5.color+';padding:1px 5px">'+arch5.icon+' '+arch5.name+'</span>':'')+
          '</div>'+
          '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);margin-bottom:4px">'+
            (POS_SHORT[pr.pos]||pr.pos)+' • '+pr.age+'l • OVR '+pr.ovr+' • Pot: <span style="color:var(--am)">'+pr.potential+'</span>'+
          '</div>'+
          '<div style="background:#0a0f0a;border:1px solid var(--gl);padding:5px 8px;margin-bottom:6px">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:3px">'+
              '<div style="font-family:VT323,monospace;font-size:var(--fs-dense)"><span style="color:var(--gr)">Talent: </span><span style="color:'+trCol+'">'+trLabel+'</span></div>'+
              '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">×'+pr.trainRate.toFixed(2)+' ogólny</div>'+
            '</div>'+
            (arch5?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);font-style:italic">"'+arch5.desc+'"</div>':'')+
            '<div style="display:flex;gap:3px;margin-top:5px;padding-top:4px;border-top:1px solid var(--gl)">'+barHtml5+'</div>'+
          '</div>'+
          '<div style="display:flex;gap:6px">'+
            '<button onclick="acceptProspect('+pr.id+')" style="flex:1;background:var(--gb);color:#000;border:none;font-family:VT323,monospace;font-size:var(--fs-meta);padding:8px;cursor:pointer">✓ PRZYJMIJ</button>'+
            '<button onclick="rejectProspect('+pr.id+')" style="flex:1;background:#3d0000;border:1px solid var(--rd);color:var(--rd);font-family:VT323,monospace;font-size:var(--fs-meta);padding:8px;cursor:pointer">✗ ZWOLNIJ</button>'+
          '</div>'+
        '</div>';
      }).join('')
    :lvl>0?
      '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);padding:12px;text-align:center">Juniorzy pojawią się na początku nowego sezonu.</div>'
    :
      '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);margin-bottom:6px">Koszt budowy: <span style="color:var(--am)">'+fmt(acadCost(0))+'</span> zł</div>'+
      '<button onclick="buildAcademy(0)" style="width:100%;background:var(--am);color:#000;border:none;font-family:VT323,monospace;font-size:var(--fs-body);padding:12px;cursor:pointer">ZBUDUJ AKADEMIĘ</button>'
    );
  // Sekcja rozbudowy
  _renderAcadRozbudowaInPrzeglad();
}
function _renderAcadRozbudowaInPrzeglad(){
  const el=document.getElementById('acad-przeglad');if(!el||!G)return;
  const lvl=getAcadLvl();const rep=G.reputation||30;const lg=G.myLeague||8;
  const sec=document.createElement('div');
  sec.innerHTML=
    '<div class="fsec" style="margin:14px 0 8px">ROZBUDOWA AKADEMII</div>'+
    ACADEMY.levels.map((a,i)=>{
      if(a.ekstraOnly&&lg!==1)return'';
      const isOwned=i<lvl;const isNext=i===lvl;
      const cost=acadCost(i);const upk=acadUpkeep(i);
      const reqOk=rep>=(a.req||0);const canAfford=G.budget>=cost;
      return '<div style="background:var(--tb);border:2px solid '+(isOwned?'var(--gb)':isNext?'var(--am)':'var(--gl)')+';padding:10px 12px;margin-bottom:8px">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
          '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+(isOwned?'var(--gb)':isNext?'var(--am)':'var(--gr)')+'">L'+(i+1)+' — '+a.name+(a.ekstraOnly?' [Ekstra]':'')+'</div>'+
          (isOwned?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gb)">AKTYWNA</div>':'')+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-family:VT323,monospace;font-size:var(--fs-dense);margin-bottom:6px">'+
          '<div><span style="color:var(--gr)">Juniorzy: </span><span style="color:var(--wh)">'+a.perSeason+'/sez.</span></div>'+
          '<div><span style="color:var(--gr)">Max pot.: </span><span style="color:var(--am)">'+a.maxPot+'</span></div>'+
          '<div><span style="color:var(--gr)">OVR start: </span><span style="color:var(--wh)">'+(a.ovrMin||18)+'-'+a.maxPot+'</span></div>'+
          '<div><span style="color:var(--gr)">Koszt: </span><span style="color:var(--wh)">'+fmt(cost)+'</span></div>'+
          '<div><span style="color:var(--gr)">Utrzym/tyg: </span><span style="color:var(--rd)">-'+fmt(upk)+'</span></div>'+
          '<div><span style="color:var(--gr)">Czas budowy: </span><span style="color:var(--am)">'+a.buildWeeks+' tyg.</span></div>'+
          (a.req>0?'<div><span style="color:var(--gr)">Wymaga rep: </span><span style="color:'+(reqOk?'var(--gb)':'var(--rd)')+'">'+a.req+(reqOk?' OK':' brakuje '+(a.req-rep))+'</span></div>':'')+
        '</div>'+
        (!isOwned&&isNext?
          (!reqOk?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--rd)">[zablok.] Wymaga Rep '+a.req+' (masz '+rep+')</div>':
           !canAfford?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--rd)">Brakuje '+fmt(cost-G.budget)+'</div>':
           '<button onclick="buildAcademy('+i+')" style="width:100%;background:var(--gb);color:#000;border:none;font-family:VT323,monospace;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+(lvl===0?'ZBUDUJ':'ULEPSZ')+' — '+fmt(cost)+'</button>')
        :'')+
      '</div>';
    }).join('');
  el.appendChild(sec);
}
function renderAcadWychowankowie(){
  var el=document.getElementById('acad-wychowankowie');if(!el||!G)return;
  // Subtabs state
  if(!window._acadWychTab)window._acadWychTab='sklad';
  var tab=window._acadWychTab;
  var grads=myPl().filter(function(p){return p.fromAcademy;});
  var hist=(G.academy&&G.academy.hist)||[];
  var absolwenci=hist.filter(function(h){return !h.isRejected&&h.pid&&!myPl().find(function(p){return p.id===h.pid;})&&h.soldTo;});
  var odpuszczeni=hist.filter(function(h){return h.isRejected;});

  function mkSubTab(id,label,active){
    return '<button onclick="window._acadWychTab=\''+id+'\';renderAcadWychowankowie()" style="font-family:VT323,monospace;font-size:var(--fs-dense);padding:5px 8px;background:'+(active?'var(--gb)':'var(--tb)')+';color:'+(active?'#000':'var(--gr)')+';border:1px solid '+(active?'var(--gb)':'var(--gl)')+';cursor:pointer;text-transform:uppercase">'+label+'</button>';
  }

  var html='<div style="display:flex;gap:4px;margin-bottom:10px">'+
    mkSubTab('sklad','W składzie ('+grads.length+')',tab==='sklad')+
    mkSubTab('absolwenci','Absolwenci ('+absolwenci.length+')',tab==='absolwenci')+
    mkSubTab('odpuszczeni','Odpuszczeni ('+odpuszczeni.length+')',tab==='odpuszczeni')+
  '</div>';

  if(tab==='sklad'){
    if(grads.length){
      html+=grads.map(function(p){
        var arch9=p.archetype&&ARCHETYPE_META[p.archetype]?ARCHETYPE_META[p.archetype]:null;
        var debH9=p.history?p.history.find(function(h){return h.fromAcademy;}):null;
        var growth9=debH9?ovr(p)-debH9.ovr:0;
        var tal9=p.trainRate>=1.5?'🌟 Talent':p.trainRate>=1.1?'⚡ Szybki':'📊 Normalny';
        var talCol9=p.trainRate>=1.5?'var(--gb)':p.trainRate>=1.1?'var(--am)':'var(--wh)';
        return '<div style="background:var(--tb);border:1px solid var(--gb);padding:8px 12px;margin-bottom:4px;cursor:pointer" onclick="showById('+p.id+')">'+
          '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
            '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--wh)">🎓 '+p.name+'</div>'+
            (arch9?'<span style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+arch9.color+'">'+arch9.icon+' '+arch9.name+'</span>':'')+
          '</div>'+
          '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">'+
            (POS_SHORT[p.pos]||p.pos)+' • '+p.age+'l • OVR <span style="color:var(--wh)">'+ovr(p)+'</span> • Pot: <span style="color:var(--am)">'+p.potential+'</span>'+
          '</div>'+
          '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);margin-top:2px">'+
            '<span style="color:var(--gr)">Talent: </span><span style="color:'+talCol9+'">'+tal9+'</span>'+
            (debH9&&growth9>0?' <span style="color:var(--gr)"> • Wzrost: </span><span style="color:var(--gb)">+'+growth9+' OVR</span>':'')+ 
            (debH9?' <span style="color:var(--gr)"> od S'+debH9.season+'</span>':'')+
          '</div>'+
        '</div>';
      }).join('');
    } else {
      html+='<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);padding:12px;text-align:center">Brak wychowanków w składzie</div>';
    }
  } else if(tab==='absolwenci'){
    if(absolwenci.length){
      html+=absolwenci.slice().reverse().map(function(h){
        var arch9b=h.archetype&&ARCHETYPE_META[h.archetype]?ARCHETYPE_META[h.archetype]:null;
        return '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 12px;margin-bottom:4px">'+
          '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
            '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">🎓 '+h.name+' <span style="font-size:var(--fs-dense);color:#555">(odszedł)</span></div>'+
            (arch9b?'<span style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+arch9b.color+'">'+arch9b.icon+' '+arch9b.name+'</span>':'')+
          '</div>'+
          '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">'+
            h.pos+
            (h.joinedSeason?' • dołączył S'+h.joinedSeason:'')+
            (h.peakOvr?' • Szczyt OVR: <span style="color:var(--am)">'+h.peakOvr+'</span>':'')+
          '</div>'+
          (h.soldTo?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);margin-top:2px"><span style="color:var(--gr)">Sprzedany do: </span><span style="color:var(--wh)">'+h.soldTo+'</span>'+(h.fee?' <span style="color:var(--gb)">za '+fmtVal(h.fee)+'</span>':'')+'</div>':'')+
        '</div>';
      }).join('');
    } else {
      html+='<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);padding:12px;text-align:center">Żaden wychowanek jeszcze nie odszedł.</div>';
    }
  } else if(tab==='odpuszczeni'){
    if(odpuszczeni.length){
      html+=odpuszczeni.slice().reverse().map(function(h){
        var arch9c=h.archetype&&ARCHETYPE_META[h.archetype]?ARCHETYPE_META[h.archetype]:null;
        return '<div style="background:var(--tb);border:1px solid #3d0000;padding:8px 12px;margin-bottom:4px">'+
          '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
            '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:#888">🎓 '+h.name+' <span style="color:var(--rd);font-size:9px">✗ zwolniony</span></div>'+
            (arch9c?'<span style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+arch9c.color+'">'+arch9c.icon+' '+arch9c.name+'</span>':'')+
          '</div>'+
          '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">'+
            h.pos+' • S'+h.season+
            (h.releaseOvr?' • OVR przy zwolnieniu: <span style="color:#888">'+h.releaseOvr+'</span>':'')+
            (h.pot?' • Pot było: <span style="color:var(--am)">'+h.pot+'</span>':'')+
          '</div>'+
          '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:#555;margin-top:3px;font-style:italic">Czy to była dobra decyzja?</div>'+
        '</div>';
      }).join('');
    } else {
      html+='<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);padding:12px;text-align:center">Żaden junior nie został odpuszczony.</div>';
    }
  }

  el.innerHTML=html;
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
  var totalG=hist.reduce(function(s,h){return s+(h.g||0);},0);
  var totalA=hist.reduce(function(s,h){return s+(h.a||0);},0);
  var growth=curOvr-debOvr;
  // Znajdź % składu słabszych na debiucie
  var myPls=myPl();
  var betterThanOnDebut=myPls.filter(function(x){return ovr(x)>debOvr;}).length;
  var pctWeak=myPls.length>0?Math.round((betterThanOnDebut/myPls.length)*100):0;
  var rankNow=[...myPls].sort(function(a,b){return ovr(b)-ovr(a);}).findIndex(function(x){return x.id===p.id;})+1;

  var html='';
  // Nagłówek wychowanka
  html+='<div style="background:#0a1f0a;border:2px solid #9c27b0;padding:10px 12px;margin-bottom:10px">'+
    '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:#ce93d8;margin-bottom:4px">🎓 WYCHOWANEK AKADEMII</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
      (arch?'<span style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+arch.color+';border:1px solid '+arch.color+';padding:1px 5px">'+arch.icon+' '+arch.name+'</span>':'')+
      '<span style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gb);border:1px solid var(--gb);padding:1px 5px">W Akademii od S'+debSzn+'</span>'+
    '</div>'+
  '</div>';

  // Statystyki kluczowe
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:10px">'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 4px;text-align:center">'+
      '<div style="font-family:VT323,monospace;font-size:'+(growth>0?'16px':'12px')+';color:'+(growth>0?'var(--gb)':'var(--gr)')+'">+'+(growth>0?growth:0)+'</div>'+
      '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">wzrost OVR</div>'+
    '</div>'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 4px;text-align:center">'+
      '<div style="font-family:VT323,monospace;font-size:var(--fs-body);color:var(--am)">'+seasonsInClub+'</div>'+
      '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">sez. u nas</div>'+
    '</div>'+
    '<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 4px;text-align:center">'+
      '<div style="font-family:VT323,monospace;font-size:var(--fs-body);color:var(--wh)">'+totalM+'</div>'+
      '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">mecze</div>'+
    '</div>'+
  '</div>';

  // Porównanie
  if(myPls.length>1){
    html+='<div style="background:var(--tb);border:1px solid var(--gl);padding:8px 10px;margin-bottom:10px;font-family:VT323,monospace;font-size:var(--fs-dense)">'+
      '<span style="color:var(--gr)">Na debiucie był gorszy od </span><span style="color:var(--rd)">'+pctWeak+'% składu</span>'+
      (rankNow>0?'<span style="color:var(--gr)">. Dziś jest </span><span style="color:var(--gb)">'+(rankNow===1?'najlepszym':''+rankNow+'.')+'</span><span style="color:var(--gr)"> zawodnikiem drużyny</span>':'')+'.'+
    '</div>';
  }

  // Oś czasu sezonów
  html+='<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr);letter-spacing:1px;border-bottom:1px solid var(--gl);padding-bottom:3px;margin-bottom:8px">OŚ CZASU</div>';
  var allHist=(p.history||[]).filter(function(h){return !h._placeholder;}).sort(function(a,b){return a.season-b.season;});
  allHist.forEach(function(h,i){
    var isFirst=i===0;
    var prevH=i>0?allHist[i-1]:null;
    var ovrGrowth=prevH&&h.ovr&&prevH.ovr?(h.ovr-prevH.ovr):0;
    var isHighlight=isFirst||(ovrGrowth>=8)||(h.g>=5)||(h.fromAcademy&&isFirst);
    var borderCol=isHighlight?'var(--gb)':'var(--gl)';
    // Autodetekcja eventu
    var noteIcon='';
    if(isFirst&&h.fromAcademy)noteIcon='🎓 Przyjęty z Akademii';
    else if(h.m>0&&prevH&&(prevH.m||0)===0)noteIcon='⚡ Debiut w składzie';
    else if(h.g>=5)noteIcon='🔥 Świetny sezon strzelecki';
    else if(ovrGrowth>=10)noteIcon='📈 Przełomowy sezon (+'+ovrGrowth+' OVR)';
    html+='<div style="background:'+(isHighlight?'#0d2b0d':'var(--tb)')+';border:1px solid '+borderCol+';padding:8px 10px;margin-bottom:4px">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
        '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+(isHighlight?'var(--gb)':'var(--wh)')+'">S'+h.season+' — OVR '+(h.ovr||'?')+'</div>'+
        (ovrGrowth>0?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gb)">+'+ovrGrowth+' OVR</div>':'')+
      '</div>'+
      '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gr)">'+
        (h.m||0)+' meczów'+(h.g?(' • '+(h.g||0)+' goli'):'')+((h.a||0)>0?(' • '+(h.a||0)+' asyst'):'')+
        (h.club?' • <span style="color:var(--am)">'+h.club+'</span>':'')+
      '</div>'+
      (noteIcon?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--am);margin-top:3px">'+noteIcon+'</div>':'')+
    '</div>';
  });

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
    return '<div style="background:var(--tb);border:2px solid '+(isOwned?'var(--gb)':isNext?'var(--am)':'var(--gl)')+';padding:10px 12px;margin-bottom:8px">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
        '<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:'+(isOwned?'var(--gb)':isNext?'var(--am)':'var(--gr)')+'">L'+(i+1)+' — '+a.name+(a.ekstraOnly?' [Ekstra]':'')+'</div>'+
        (isOwned?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--gb)">AKTYWNA</div>':'')+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-family:VT323,monospace;font-size:var(--fs-dense);margin-bottom:6px">'+
        '<div><span style="color:var(--gr)">Juniorzy: </span><span style="color:var(--wh)">'+a.perSeason+'/sez.</span></div>'+
        '<div><span style="color:var(--gr)">Max pot.: </span><span style="color:var(--am)">'+a.maxPot+'</span></div>'+
        '<div><span style="color:var(--gr)">OVR start: </span><span style="color:var(--wh)">'+(a.ovrMin||18)+'-'+a.maxPot+'</span></div>'+
        '<div><span style="color:var(--gr)">Koszt: </span><span style="color:var(--wh)">'+fmt(cost)+'</span></div>'+
        '<div><span style="color:var(--gr)">Utrzym/tyg: </span><span style="color:var(--rd)">-'+fmt(upk)+'</span></div>'+
        '<div><span style="color:var(--gr)">Czas budowy: </span><span style="color:var(--am)">'+a.buildWeeks+' tyg.</span></div>'+
        (a.req>0?'<div><span style="color:var(--gr)">Wymaga rep: </span><span style="color:'+(reqOk?'var(--gb)':'var(--rd)')+'">'+a.req+(reqOk?' OK':' brakuje '+(a.req-rep))+'</span></div>':'')+
        (a.ekstraOnly?'<div><span style="color:var(--gr)">Liga: </span><span style="color:var(--am)">Tylko Premier Division</span></div>':a.req>=500?'<div><span style="color:var(--gr)">Dostępna od: </span><span style="color:var(--wh)">I Ligi (rep 500+)</span></div>':a.req>=250?'<div><span style="color:var(--gr)">Dostępna od: </span><span style="color:var(--wh)">III Ligi (rep 250+)</span></div>':a.req>=100?'<div><span style="color:var(--gr)">Dostępna od: </span><span style="color:var(--wh)">V Ligi (rep 100+)</span></div>':'')+
      '</div>'+
      (!isOwned&&isNext?
        (!reqOk?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--rd)">[zablok.] Wymaga Rep '+a.req+' (masz '+rep+')</div>':
         !canAfford?'<div style="font-family:VT323,monospace;font-size:var(--fs-dense);color:var(--rd)">Brakuje '+fmt(cost-G.budget)+'</div>':
         '<button onclick="buildAcademy('+i+')" style="width:100%;background:var(--gb);color:#000;border:none;font-family:VT323,monospace;font-size:var(--fs-meta);padding:8px;cursor:pointer">'+(lvl===0?'ZBUDUJ':'ULEPSZ')+' — '+fmt(cost)+'</button>')
      :'')+
    '</div>';
  }).join('');
}
function buildAcademy(levelIdx){
  if(!G)return;
  if(!G.academy)G.academy={level:0,prospects:[],hist:[]};
  const a=ACADEMY.levels[levelIdx];if(!a)return;
  if(a.ekstraOnly&&(G.myLeague||8)!==1){notif('Akademia Mistrzów tylko dla Ekstraklasy!','err');return;}
  const _cst=acadCost(levelIdx);
  if(G.budget<_cst){notif('Za mało środków!','err');return;}
  if((G.reputation||30)<(a.req||0)){notif('Wymaga Reputacji '+a.req+'!','err');return;}
  G.budget-=_cst;
  if(!G.fin.hist)G.fin.hist=[];
  G.fin.hist.push({w:G.week,inc:0,cost:_cst,bal:G.budget,season:G.season,note:'Akademia: '+a.name});
  const _bw=a.buildWeeks||4;
  G.academy.building={levelIdx:levelIdx+1,weeksLeft:_bw,name:a.name};
  addNews(t('news_academy_build').replace('{name}',a.name).replace('{n}',_bw),'academy');
  notif('Budowa '+a.name+' (+'+_bw+' tyg)','ok');
  renderAcadPrzeglad();
}
function acceptProspect(pid){
  if(!G||!G.academy)return;
  const pr=G.academy.prospects.find(x=>x.id===pid);if(!pr)return;
  pr.status='accepted';
  const p=mkPlayer(G.myClubId);
  p.id=pr.id;p.name=pr.name;p.last=pr.name.split(' ')[1]||pr.name;
  p.pos=pr.pos;p.age=pr.age;p.trainRate=pr.trainRate;p.trainMatches=0;
  p.potential=pr.potential;p.fromAcademy=true;p.archetype=pr.archetype||null;
  ['tec','pas','sht','def','phy','men'].forEach(a=>{p[a]=Math.max(1,Math.min(99,Math.round(pr.ovr+r(-5,5))));});
  p.value=calcValue(ovr(p),p.age);p.salary=calcSalary(p.value,G.myLeague,ovr(p));
  p.contract=3;p.starter=false;
  assignJerseyNum(p);
  G.players.push(p);
  G.academy.hist.push({pid:p.id,season:G.season,name:pr.name,pos:POS_SHORT[pr.pos]||pr.pos,action:'Dołączył do składu',joinedSeason:G.season,archetype:pr.archetype||null,startOvr:pr.ovr,pot:pr.potential});
  addNews(t('news_academy_joined').replace('{name}',pr.name).replace('{pot}',pr.potential),'academy');
  notif(pr.name+' dołączył!','ok');
  renderAcadPrzeglad();renderAcadWychowankowie();
}
function rejectProspect(pid){
  if(!G||!G.academy)return;
  const pr=G.academy.prospects.find(x=>x.id===pid);if(!pr)return;
  pr.status='rejected';
  G.academy.hist.push({season:G.season,name:pr.name,pos:POS_SHORT[pr.pos]||pr.pos,action:'Odpuszczony (junior)',releaseOvr:pr.ovr,pot:pr.potential,archetype:pr.archetype||null,isRejected:true});
  notif(pr.name+' zwolniony','ok');
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
  G.news.unshift({msg:'🎓 Akademia wykształciła '+acad.perSeason+' nowych juniora! Oceń ich i zdecyduj kogo przyjąć.',type:'ok',week:G.week,season:G.season,action:'academy',actionLabel:'AKADEMIA'});
  renderNews();
}


// ══════════════════════════════════════════════════════════
// TRYB DEWELOPERSKI
// ══════════════════════════════════════════════════════════
