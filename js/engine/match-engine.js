function simMatch(){if(!G)return;const m=nextMatch();if(!m){advWeek();notif(t('match_notif_no_match_week'),'info');closePanel('p-match');fillMatch&&fillMatch();return;}const stC=mySt().length,lim=formationLimits(),req=1+lim.OBR+lim.POL+lim.NAP;if(stC<req){notif(t('match_notif_select_squad').replace('{n}',req-stC),'err');return;}const injuredStarters=mySt().filter(p=>p.injured||p.suspension>0);if(injuredStarters.length){injuredStarters.forEach(p=>{p.starter=false;});notif(t('match_notif_removed_injured').replace('{names}',injuredStarters.map(p=>p.name).join(', ')),'err');fillTacSquad();fillSquad();return;}
  // Ukryj przycisk taktyki pucharowej gdy mecz startuje
  var _ctb=document.getElementById('cup-tac-btn');if(_ctb)_ctb.style.display='none';
  const btn=document.getElementById('btn-sim');btn.disabled=true;matchInProgress=true;document.getElementById('m-lock-note')&&(document.getElementById('m-lock-note').style.display='none');btn.style.display='none';btn.textContent=t('match_in_progress');const _mls3=document.getElementById('m-live-stats');if(_mls3)_mls3.style.display='block';const _s0=id=>document.getElementById(id);if(_s0('ls-poss-h')){_s0('ls-poss-h').textContent='50%';_s0('ls-poss-a').textContent='50%';}if(_s0('ls-poss-bar-h')){_s0('ls-poss-bar-h').style.flex='50';_s0('ls-poss-bar-a').style.flex='50';}if(_s0('ls-shots-h')){_s0('ls-shots-h').textContent='0';_s0('ls-shots-a').textContent='0';}if(_s0('ls-on-h')){_s0('ls-on-h').textContent='0';_s0('ls-on-a').textContent='0';}if(_s0('ls-fouls-h')){_s0('ls-fouls-h').textContent='0';_s0('ls-fouls-a').textContent='0';}// Ukryj wiersze statystyk — pojawią się przy pierwszej akcji
['ls-shots-row','ls-on-row','ls-fouls-row'].forEach(function(rid){var _rr=_s0(rid);if(_rr)_rr.style.display='none';});window._momentum={true:0,false:0};const _mRow=_s0('ls-momentum-row');if(_mRow)_mRow.style.display='block';if(_s0('ls-mom-h')){_s0('ls-mom-h').textContent='+0.0';_s0('ls-mom-h').style.color='var(--gr)';}if(_s0('ls-mom-a')){_s0('ls-mom-a').textContent='+0.0';_s0('ls-mom-a').style.color='var(--gr)';}if(_s0('ls-mom-label')){_s0('ls-mom-label').textContent=t('match_momentum_even');_s0('ls-mom-label').style.color='var(--gr)';}const _nReset=_s0('ls-mom-needle');if(_nReset){_nReset.style.left='50%';_nReset.style.background='var(--am)';_nReset.style.boxShadow='0 0 5px var(--am)';}const _ecReset=_s0('ls-events-chips');if(_ecReset)_ecReset.innerHTML='';const _tbReset=_s0('ls-tactic-box');if(_tbReset)_tbReset.style.display='none';const _tnReset=_s0('ls-tactic-name');if(_tnReset)_tnReset.textContent='—';window._matchSubsOut=[];window._matchInjured=[];// v199: śledzenie zmian i kontuzji
const mlog=document.getElementById('mlog');if(mlog){mlog.innerHTML='';
  const _startD=document.createElement('div');
  _startD.className='mlog-e narr-my';
  _startD.innerHTML='<span class="mlog-min2">1&#x27;</span><span class="mlog-icon">&#9654;</span><span class="mlog-txt">'+t('match_start_label')+'</span>';
  mlog.appendChild(_startD);
}_subsLeft=3;const bsub=document.getElementById('btn-sub');if(bsub)bsub.style.opacity='1';
  // W TRAKCIE: ukryj prematch i tabs, pokaż tylko relację
  const _pre2=document.getElementById('m-prematch');if(_pre2)_pre2.style.display='none';
  // Przywróć górny scorebar
  const _scbar2=document.getElementById('m-scorebar');if(_scbar2)_scbar2.style.display='block';
  const _tabs2=document.getElementById('m-tabs');if(_tabs2)_tabs2.style.display='none';
  const _rel2=document.getElementById('m-relacja');if(_rel2){_rel2.classList.remove('on');_rel2.style.display='none';}
  const _oce2=document.getElementById('m-oceny');if(_oce2)_oce2.classList.remove('on');const mls2=document.getElementById('m-live-stats');if(mls2)mls2.style.display='block';const spb=document.getElementById('m-speed-btns');if(spb)spb.style.display='block';matchSpeed=3000;updateSpeedLabel();
// Upewnij się że przeciwnik ma wybrany skład
const _oppId2=m.h===G.myClubId?m.a:m.h;aiSelectSquad(_oppId2);
const hc=ALL_CLUBS.find(c=>c.id===m.h),ac=ALL_CLUBS.find(c=>c.id===m.a);m_hId=m.h;m_aId=m.a;
liveStats={hShots:0,aShots:0,hOn:0,aOn:0,hFouls:0,aFouls:0,hAct:0,aAct:0};
const ratings={};G.players.filter(p=>(p.clubId===m.h||p.clubId===m.a)&&p.starter).forEach(p=>{ratings[p.id]={goals:0,assists:0,shots:0,accurateShots:0,saves:0,clearances:0,keyPasses:0,cards:0,rating:6.0};});
function upUI(min,hG,aG){
  const ls=document.getElementById('m-live-score');if(ls)ls.textContent=hG+' - '+aG;
  const pr=document.getElementById('m-progress');if(pr)pr.style.width=Math.round(min/90*100)+'%';
  const mi=document.getElementById('m-minute');if(mi)mi.textContent=min+"'"; 
  const rawPoss=liveStats.hAct/(liveStats.hAct+liveStats.aAct+1);
  const hp=Math.max(25,Math.min(75,Math.round(rawPoss*100)));
  const ap=100-hp;
  // v199: aktualizuj Wariant B dashboard stats
  const _s=id=>document.getElementById(id);
  // Posiadanie — pokaż dopiero gdy jest jakakolwiek akcja
  if((liveStats.hAct||0)+(liveStats.aAct||0)>0){var _pr=_s('ls-poss-row');if(_pr)_pr.style.display='block';}
  if(_s('ls-poss-h'))_s('ls-poss-h').textContent=hp+'%';
  if(_s('ls-poss-a'))_s('ls-poss-a').textContent=ap+'%';
  if(_s('ls-poss-bar-h'))_s('ls-poss-bar-h').style.flex=hp;
  if(_s('ls-poss-bar-a'))_s('ls-poss-bar-a').style.flex=ap;
  // Strzały
  const sh=liveStats.hShots||0,sa=liveStats.aShots||0,st=sh+sa||1;
  if(sh+sa>0){var _shr=_s('ls-shots-row');if(_shr)_shr.style.display='flex';}
  if(_s('ls-shots-h'))_s('ls-shots-h').textContent=sh;
  if(_s('ls-shots-a'))_s('ls-shots-a').textContent=sa;
  if(_s('ls-shots-bar-h'))_s('ls-shots-bar-h').style.flex=sh||1;
  if(_s('ls-shots-bar-a'))_s('ls-shots-bar-a').style.flex=sa||1;
  // Celne
  const oh=liveStats.hOn||0,oa=liveStats.aOn||0;
  if(oh+oa>0){var _onr=_s('ls-on-row');if(_onr)_onr.style.display='flex';}
  if(_s('ls-on-h'))_s('ls-on-h').textContent=oh;
  if(_s('ls-on-a'))_s('ls-on-a').textContent=oa;
  if(_s('ls-on-bar-h'))_s('ls-on-bar-h').style.flex=oh||1;
  if(_s('ls-on-bar-a'))_s('ls-on-bar-a').style.flex=oa||1;
  // Faule
  const fh=liveStats.hFouls||0,fa=liveStats.aFouls||0;
  if(fh+fa>0){var _fur=_s('ls-fouls-row');if(_fur)_fur.style.display='flex';}
  if(_s('ls-fouls-h'))_s('ls-fouls-h').textContent=fh;
  if(_s('ls-fouls-a'))_s('ls-fouls-a').textContent=fa;
  if(_s('ls-fouls-bar-h'))_s('ls-fouls-bar-h').style.flex=fh||1;
  if(_s('ls-fouls-bar-a'))_s('ls-fouls-bar-a').style.flex=fa||1;
  // Momentum (jeśli zainicjalizowany)
  if(window._momentum){
    const mh=window._momentum[true]||0,ma=window._momentum[false]||0;
    const mRow=_s('ls-momentum-row');
    if(mRow)mRow.style.display='block';
    // Wartości liczbowe — kolor zależny od siły
    const _mhCol=mh>=5?'var(--gb)':mh>=2?'#8ab88a':mh<=-5?'#888':mh<=-2?'#666':'var(--gr)';
    const _maCol=ma>=5?'var(--rd)':ma>=2?'#c06060':ma<=-5?'#888':ma<=-2?'#666':'var(--gr)';
    if(_s('ls-mom-h')){_s('ls-mom-h').textContent=(mh>=0?'+':'')+mh.toFixed(1);_s('ls-mom-h').style.color=_mhCol;}
    if(_s('ls-mom-a')){_s('ls-mom-a').textContent=(ma>=0?'+':'')+ma.toFixed(1);_s('ls-mom-a').style.color=_maCol;}
    // Igła — 50%=neutralna, mh > 0 przesuwa w prawo (mój klub), mh < 0 w lewo (rywal)
    const needlePos=50+mh*4;// każdy pkt = 4%, zakres -10..+10 → 10%..90%
    const _needle=_s('ls-mom-needle');
    if(_needle){
      _needle.style.left=Math.max(5,Math.min(95,needlePos))+'%';
      // Kolor igły zależny od strefy
      const _nc=mh>=5?'var(--gb)':mh<=-5?'var(--rd)':'var(--am)';
      _needle.style.background=_nc;
      _needle.style.boxShadow='0 0 5px '+_nc;
    }
    // Etykieta dynamiczna (Propozycja 2)
    const _lbl=_s('ls-mom-label');
    if(_lbl){
      let _lt,_lc;
      if(mh>=7){_lt=t('match_mom_dominates').replace('{club}',_s('m-home-name')?_s('m-home-name').textContent.replace(' ⭐',''):t('match_my_club_fallback'));_lc='var(--gb)';}
      else if(mh>=3){_lt=t('match_mom_leading').replace('{club}',_s('m-home-name')?_s('m-home-name').textContent.replace(' ⭐',''):t('match_my_club_fallback'));_lc='#8ab88a';}
      else if(mh<=-7){_lt=t('match_mom_opp_dominates');_lc='var(--rd)';}
      else if(mh<=-3){_lt=t('match_mom_opp_leading');_lc='#c06060';}
      else{_lt=t('match_momentum_even');_lc='var(--gr)';}
      _lbl.textContent=_lt;
      _lbl.style.color=_lc;
    }
  }
  // Kompatybilność wsteczna ze starymi IDs
  if(_s('ls-poss'))_s('ls-poss').textContent=hp+'% - '+ap+'%';
  if(_s('ls-shots'))_s('ls-shots').textContent=(liveStats.hShots||0)+' - '+(liveStats.aShots||0);
  if(_s('ls-on'))_s('ls-on').textContent=(liveStats.hOn||0)+' - '+(liveStats.aOn||0);
  if(_s('ls-fouls'))_s('ls-fouls').textContent=(liveStats.hFouls||0)+' - '+(liveStats.aFouls||0);
}
const VIVID=['Strata pi\u0142ki.','Przechwycone podanie!','Gro\u017ane do\u015brodkowanie!','Obro\u0144ca wybija pi\u0142k\u0119.','Szybki kontratak!','Zmiana rytmu gry.','Dobra obrona!','Kr\u00f3tka kombinacja.'];
function tS(cid){
  const st=G.players.filter(p=>p.clubId===cid&&p.starter);
  const avgStr=a=>a.length?Math.round(a.reduce((s,p)=>s+playerStr(p),0)/a.length):25;
  const gk=st.filter(p=>p.pos==='GK'),def=st.filter(p=>p.pos==='OBR');
  const mid=st.filter(p=>p.pos==='POL'),att=st.filter(p=>p.pos==='NAP');
  const fmRaw=st.length?st.reduce((s,p)=>s+p.form,0)/st.length:75;
  const fm=0.85+fmRaw/666;
  const avgOvr2=st.length?Math.round(st.reduce((s,p)=>s+ovr(p),0)/st.length):30;
  // Mentality bonus: high average men gives small boost to all stats
  const avgMen=st.length?st.reduce((s,p)=>s+p.men,0)/st.length:50;
  const menBonus=1+(avgMen-50)/500;
  return{
    atk:Math.round((avgStr(att)*0.7+avgStr(mid)*0.3)*menBonus),
    mid:Math.round((avgStr(mid)*0.6+avgStr(att)*0.2+avgStr(def)*0.2)*menBonus),
    def:Math.round((avgStr(def)*0.7+avgStr(gk)*0.3)*menBonus),
    gkOvr:avgStr(gk),
    form:fm,total:avgOvr2
  };
}
const hSt=tS(m.h),aSt=tS(m.a);

  // ── TACTICAL MODIFIERS ──────────────────────────────────────
  const isMyH=m.h===G.myClubId;
  const myTacSt=isMyH?hSt:aSt;
  const oppTacSt=isMyH?aSt:hSt;
  if(!G.pressing)G.pressing='Normalny';
  if(!G.line)G.line='Normalna';
  if(!G.instruction||G.instruction==='Bezpośrednia')G.instruction='Długie piłki';

  // Formation modifier
  const formMod={
    '4-4-2':{atk:1.0, mid:1.0, def:1.0},
    '4-3-3':{atk:1.15,mid:0.95,def:0.90},
    '3-5-2':{atk:1.0, mid:1.15,def:0.90},
    '5-3-2':{atk:0.90,mid:0.95,def:1.15},
    '3-4-3':{atk:1.20,mid:1.0, def:0.80},
    '4-5-1':{atk:0.85,mid:1.20,def:1.0},
  }[G.formation]||{atk:1.0,mid:1.0,def:1.0};

  // Style modifier
  const styleMod={
    'Defensywny':  {actions:0.85,shotChance:0.85,foul:0.7},
    'Zrównoważony':{actions:1.0, shotChance:1.0, foul:1.0},
    'Ofensywny':   {actions:1.15,shotChance:1.15,foul:1.3},
  }[G.style]||{actions:1.0,shotChance:1.0,foul:1.0};

  // Tempo modifier
  const tempoMod={'Wolne':0.80,'Normalne':1.0,'Szybkie':1.20}[G.tempo]||1.0;

  // Pressing modifier
  const pressMod={
    'Niski':   {oppAct:-0.10,myFouls:-0.15,myDef:+0.08},
    'Normalny':{oppAct:0,    myFouls:0,    myDef:0     },
    'Wysoki':  {oppAct:+0.15,myFouls:+0.35,myDef:-0.05},
  }[G.pressing]||{oppAct:0,myFouls:0,myDef:0};

  // Line modifier
  const lineMod={
    'Niska':   {def:+0.12,atk:-0.08,offsideRisk:0   },
    'Normalna':{def:0,    atk:0,    offsideRisk:0   },
    'Wysoka':  {def:-0.10,atk:+0.10,offsideRisk:0.15},
  }[G.line]||{def:0,atk:0,offsideRisk:0};

  // Instruction modifier
  const instrMod={
    'Posiadanie':   {mid:+0.15,atk:-0.05,counterBonus:0.8 },
    'Długie piłki': {mid:-0.05,atk:+0.10,counterBonus:1.1 },
    'Bezpośrednia': {mid:0,    atk:0,    counterBonus:1.0 },
    'Kontry':       {mid:-0.10,atk:-0.10,counterBonus:1.6 },
  }[G.instruction]||{mid:0,atk:0,counterBonus:1.0};

  // Kontr-formacje AI
  function pickAIFormation(myForm, oppStr, myStr){
    const counters={'4-4-2':'4-3-3','4-3-3':'5-3-2','3-5-2':'4-3-3','5-3-2':'4-3-3','3-4-3':'4-4-2','4-5-1':'3-4-3'};
    const counterAdv={'4-3-3':{'4-4-2':0.07,'5-3-2':0.09},'5-3-2':{'4-3-3':0.07,'3-4-3':0.10},'4-4-2':{'3-4-3':0.07},'3-4-3':{'5-3-2':0.08,'4-5-1':0.07}};
    if(oppStr < myStr-10) return '5-3-2'; // słabszy gra defensywnie
    if(oppStr > myStr+10) return '4-3-3'; // silniejszy gra ofensywnie
    return counters[myForm]||'4-4-2';
  }
  const myStrTot=myTacSt.total||30;
  const oppStrTot=oppTacSt.total||30;
  const aiForm=pickAIFormation(G.formation,oppStrTot,myStrTot);
  const aiFormMod={'4-4-2':{atk:1.0,mid:1.0,def:1.0},'4-3-3':{atk:1.15,mid:0.95,def:0.90},'3-5-2':{atk:1.0,mid:1.15,def:0.90},'5-3-2':{atk:0.90,mid:0.95,def:1.15},'3-4-3':{atk:1.20,mid:1.0,def:0.80},'4-5-1':{atk:0.85,mid:1.20,def:1.0}}[aiForm]||{atk:1.0,mid:1.0,def:1.0};

  // Apply formation + taktyki do myClub
  myTacSt.atk=Math.round(myTacSt.atk*formMod.atk*(1+lineMod.atk+instrMod.atk));
  myTacSt.mid=Math.round(myTacSt.mid*formMod.mid*(1+instrMod.mid));
  myTacSt.def=Math.round(myTacSt.def*formMod.def*(1+lineMod.def+pressMod.myDef));
  // ── NASTAWIENIE (mood) ────────────────────────────────────────────
  const _mood=G._matchMood||'balans';
  if(_mood==='atak'){
    myTacSt.atk=Math.round(myTacSt.atk*1.08);
    myTacSt.mid=Math.round(myTacSt.mid*1.04);
    myTacSt.def=Math.round(myTacSt.def*0.95);
  } else if(_mood==='blok'){
    myTacSt.def=Math.round(myTacSt.def*1.08);
    myTacSt.mid=Math.round(myTacSt.mid*1.03);
    myTacSt.atk=Math.round(myTacSt.atk*0.95);
  }
  // Mood wpływa też na podział akcji ofensywnych
  window._moodActMod=(_mood==='atak')?1.08:(_mood==='blok')?0.93:1.0;
  window._moodOppActMod=(_mood==='atak')?1.05:(_mood==='blok')?0.96:1.0;

  // Apply AI formation do oppClub
  oppTacSt.atk=Math.round(oppTacSt.atk*aiFormMod.atk);
  oppTacSt.mid=Math.round(oppTacSt.mid*aiFormMod.mid);
  oppTacSt.def=Math.round(oppTacSt.def*aiFormMod.def);

  // MID kontroluje posiadanie
  const midDiff=(myTacSt.mid-oppTacSt.mid)/250;

  const hPow2=(hSt.total||30)*hSt.form*(isMyH?1.07:1.0);
  const aPow2=(aSt.total||30)*aSt.form*(isMyH?1.0:1.07);
  const baseTot=Math.round(r(38,46)*tempoMod*styleMod.actions);// v208: więcej akcji → więcej strzałów i widocznych obron
  const tot=Math.max(10,baseTot);
  // v202: hs asymetryczna — lider u siebie dominuje bardziej (0.42) niż na wyjeździe (0.28)
  const _rawHs=(hPow2-aPow2)/(hPow2+aPow2);
  const hs=0.5+_rawHs*(_rawHs>0?0.42:0.28);
  let hA=Math.max(4,Math.round(tot*hs*r(85,115)/100)),aA=Math.max(4,tot-hA);
  // Mood modyfikuje podział akcji (dodatkowo, po obliczeniu bazowych sił)
  const _mAct=window._moodActMod||1.0;
  const _oAct=window._moodOppActMod||1.0;
  if(isMyH){ hA=Math.max(4,Math.round(hA*_mAct)); aA=Math.max(4,Math.round(aA*_oAct)); }
  else      { aA=Math.max(4,Math.round(aA*_mAct)); hA=Math.max(4,Math.round(hA*_oAct)); }

  // Pressing — rywal ma mniej/więcej akcji
  if(isMyH){
    aA=Math.max(3,Math.round(aA*(1-pressMod.oppAct)));
    hA=Math.max(3,Math.round(hA*(1+midDiff)));
    aA=Math.max(3,Math.round(aA*(1-midDiff)));
  } else {
    hA=Math.max(3,Math.round(hA*(1-pressMod.oppAct)));
    aA=Math.max(3,Math.round(aA*(1+midDiff)));
    hA=Math.max(3,Math.round(hA*(1-midDiff)));
  }

  // Zmęczenie PHY — faza 3 (61-90')
  const myStarters=G.players.filter(p=>p.clubId===G.myClubId&&p.starter);
  const avgPhy=myStarters.length?myStarters.reduce((s,p)=>s+(p.phy||50),0)/myStarters.length:50;
  const staminaFactor=0.90+(avgPhy/500); // PHY50=1.0, PHY30=0.96, PHY70=1.04
  // v198: avgPhy obu drużyn (AI zawodnicy używają OVR jako proxy)
  const oppStarters=G.players.filter(p=>p.clubId===(isMyH?m.a:m.h)&&p.starter);
  const avgPhyOpp=oppStarters.length?oppStarters.reduce((s,p)=>s+(p.phy||50),0)/oppStarters.length:50;
  // _fatigueSavePenalty(min, avgPhyDef): im niższy PHY obrony i im później, tym mniej broni GK
  function _fatigueSavePenalty(min,phyAvg){
    if(min<65)return 0;
    const tired=Math.max(0,(100-phyAvg)/100); // 0=superkondycja,1=bez kondycji
    return tired*(min-65)/25*0.10; // max -10% saveChance przy PHY=0 w 90'
  }

  // Podziel akcje na 3 fazy
  const h1=Math.round(hA*0.30), h2=Math.round(hA*0.35), h3=Math.max(2,hA-h1-h2);
  const a1=Math.round(aA*0.30), a2=Math.round(aA*0.35), a3=Math.max(2,aA-a1-a2);
  const h3f=Math.round(h3*(isMyH?staminaFactor:1.0));
  const a3f=Math.round(a3*(isMyH?1.0:staminaFactor));

  // counterBonus z instrukcji
  window._matchCounterBonus=instrMod.counterBonus;
  // offsideRisk z linii
  window._matchOffsideRisk=lineMod.offsideRisk;
  // v198: taktyczny shift (ustawiany przez UI w połowie meczu)
  window._tacticalShift=window._tacticalShift||{actMod:1.0,shotMod:1.0,saveMod:1.0,used:false};
  window._tacticalShiftUsed=false;
  // pressFouls
  window._matchPressFouls=pressMod.myFouls;
const hSc=G.players.filter(p=>p.clubId===m.h&&p.starter&&p.pos!=='GK'),aSc=G.players.filter(p=>p.clubId===m.a&&p.starter&&p.pos!=='GK');
function bldEvs(act,atk,def,gk,sc,isH,phase){const evts=[],mins=[];
  const _narr_e=[t('match_narr_early_1'),t('match_narr_early_2'),t('match_narr_early_3'),t('match_narr_early_4')];
  const _narr_m=[t('match_narr_mid_1'),t('match_narr_mid_2'),t('match_narr_mid_3'),t('match_narr_mid_4')];
  const _narr_l=[t('match_narr_late_1'),t('match_narr_late_2'),t('match_narr_late_3'),t('match_narr_late_4')];
  const _np=phase==='early'?_narr_e:phase==='late'?_narr_l:_narr_m;
  const _nn=Math.floor(act/4);
  for(let _ni=0;_ni<_nn;_ni++){
    const _nm=phase==='early'?r(5,28):phase==='mid'?r(32,58):r(62,88);
    evts.push({min:_nm,type:'narration',text:pick(_np),isH});
  }// FIX 3: More actions in 2nd half - distribute 40% in 1-45, 60% in 46-90
for(let i=0;i<act;i++){
  const min=Math.random()<0.4?r(1,45):r(46,90);
  mins.push(min);
}
mins.sort((a,b)=>a-b);
let _momSnapIdx=0;// v199: licznik dla snapshotu co 3 akcje
mins.forEach(min=>{if(isH)liveStats.hAct++;else liveStats.aAct++;const scMod=(isH===isMyH)?styleMod.shotChance:1.0;
// HYBRID ENGINE v197: ovrDiffBoost + MOMENTUM + CZAS MECZU
const _ovrDiffBoost=Math.max(0.0,Math.min(0.08,(atk-def)/280));
_momDecay();// v199: momentum powoli wraca do 0 między golami
_momSnapIdx++;
if(_momSnapIdx%3===0){// co 3 akcje — zapisz snapshot (animuje igłę)
  evts.push({min,type:'momupdate',isH,_momSnap:{h:_momentum[true],a:_momentum[false]}});
}
const _mBoost=_momBoost(isH);// momentum: silna drużyna po golu strzela lepiej
const _tMod=_timeMod(min);   // czas: końcówka meczu bardziej dynamiczna
// v198: taktyczny shift + derby factor
const _tacSh=(isH===isMyH)?(window._tacticalShift||{shotMod:1.0,saveMod:1.0}):({shotMod:1.0,saveMod:1.0});
const baseShot=((atk/(atk+def+1))*0.58+0.14+_ovrDiffBoost+_mBoost)*scMod*_tMod*(_tacSh.shotMod||1.0)*(_derbyFactor||1.0);
if(Math.random()>baseShot){
  // Akcja zakończona obroną — losowy obrońca dostaje clearance
  const defTeam=G.players.filter(p=>p.clubId===(isH?m.a:m.h)&&(p.pos==='OBR'||p.pos==='GK')&&p.starter);
  if(defTeam.length){
    const defW=defTeam.map(p=>p.pos==='OBR'?p.def||30:5);
    const defT=defW.reduce((s,v)=>s+v,0);let dRnd=Math.random()*defT;
    let defPick=defTeam[defTeam.length-1];
    for(let di=0;di<defTeam.length;di++){dRnd-=defW[di];if(dRnd<=0){defPick=defTeam[di];break;}}
    if(ratings[defPick.id])ratings[defPick.id].clearances=(ratings[defPick.id].clearances||0)+1;
  }
  return;
}
// FIX 2: Defensive style gives counterattack bonus to goal chance
const _instrCB=window._matchCounterBonus||1.0;const counterMod=(isH===isMyH&&G.style==='Defensywny')?1.25*_instrCB:_instrCB;// Weighted scorer: NAP=1.0, POL=0.5, OBR=0.2
function wpick(arr){
  // FIX 4: Use sht attribute + position weight, squared (not cubed)
  // NAP with high sht is primary scorer
  const posW={NAP:6.0,POL:1.8,OBR:0.3,GK:0.02};
  const getW=p=>(posW[p.pos]||0.5)*Math.pow((p.sht||ovr(p))/45,2);
  const total=arr.reduce((s,p)=>s+getW(p),0);
  let rnd=Math.random()*total;
  for(const p of arr){rnd-=getW(p);if(rnd<=0)return p;}
  return arr[arr.length-1];
}
const sc2=sc.length?wpick(sc):{last:'???',id:-1,pos:'NAP'};if(isH)liveStats.hShots++;else liveStats.aShots++;if(ratings[sc2.id])ratings[sc2.id].shots++;// Fazy: celność strzału + obrona bramkarza z uwzględnieniem relStrength
const shtAttr=sc2&&sc2.sht?sc2.sht:atk;
const gkPlayer=G.players.find(p=>p.clubId===(isH?m.a:m.h)&&p.pos==='GK'&&p.starter);
const gkDef=gkPlayer?gkPlayer.def:gk;
// Faza 1: Celność strzału
const homeBonus=isH?1.10:0.93;// v196: wzmocniona przewaga domowa (10%→18% asymetria)
// v212: Więź z Klubem — bonus formy dla własnych zawodników
const _bondFB=getBondFormBonus(sc2,isH===isMyH);
const _bondShtMod=_bondFB>0?1+((_bondFB*2)/100):1.0;
// v198: hot streak napastnika daje bonus do celności (+5% za serię ≥3, +12% za ≥5)
const _streakB=(sc2&&sc2.goalStreak>=5)?1.12:(sc2&&sc2.goalStreak>=3)?1.05:1.0;
const accuracyChance=Math.max(0.38,Math.min(0.55,(shtAttr/100)*0.36+0.19))*counterMod*homeBonus*_streakB*_bondShtMod;// v208: więcej celnych (3-4/mecz) żeby obrony były widoczne
// Faza 2: Obrona bramkarza — floor niższy przy amatorach (więcej bramek L3-L8), sufit wyższy przy elicie (więcej remisów L1-L2)
const saveChanceMod=isH?0.97:1.03;// v196: mniejsza asymetria GK → mniej wygranych gości
const _relStr=Math.min(1.4,gkDef/Math.max(10,shtAttr));
const _scFloor=Math.max(0.55,Math.min(0.65,0.50+(gkDef/100)*0.18));// v208: floor 0.55 — GK broni min 55% celnych, widoczne obrony
// v202: scCeil uwzględnia przewagę GK nad napastnikiem — lider traci mniej
const _gkAdvantage=Math.max(0,(gkDef-shtAttr)/100);
const _scCeil=Math.max(0.80,Math.min(0.92,0.78+(gkDef/100)*0.10+_gkAdvantage*0.12));// v208: wyższy ceil
// v198: zmęczenie obrony redukuje saveChance od 65'
const _defPhyAvg=isH?(isMyH?avgPhyOpp:avgPhy):(isMyH?avgPhy:avgPhyOpp);
const _fatPen=_fatigueSavePenalty(min,_defPhyAvg);
// v198: taktyczny saveMod + derby (w derbym obrona też popełnia więcej błędów)
const _tacSaveMod=(isH!==isMyH)?(_tacSh.saveMod||1.0):1.0;
const _derbySaveMod=(_derbyFactor||1.0)>1.0?0.97:1.0;// derby: GK troszkę gorzej broni
const saveChance=(Math.max(_scFloor,Math.min(_scCeil,_relStr*0.35+0.28))*saveChanceMod-_fatPen)*_tacSaveMod*_derbySaveMod;
const isAccurate=Math.random()<accuracyChance;
if(isAccurate){if(isH)liveStats.hOn++;else liveStats.aOn++;if(ratings[sc2.id])ratings[sc2.id].accurateShots=(ratings[sc2.id].accurateShots||0)+1;}
if(isAccurate&&(Math.random()>(saveChance))){if(ratings[sc2.id]){ratings[sc2.id].goals++;ratings[sc2.id].rating+=1.5;}
// Assist: POL=1.0, NAP=0.5, OBR=0.15
const assistCandidates=sc.filter(p=>p.id!==sc2.id);
const aWeights={POL:1.0,NAP:0.5,OBR:0.15,GK:0.02};
let assister=null;
if(assistCandidates.length&&Math.random()<0.85){
  // FIX 4+5: Use pas attribute for assists, squared
  const getAW=p=>(aWeights[p.pos]||0.3)*Math.pow((p.pas||ovr(p))/45,2);
  const aTotal=assistCandidates.reduce((s,p)=>s+getAW(p),0);
  let aRnd=Math.random()*aTotal;
  for(const p of assistCandidates){aRnd-=getAW(p);if(aRnd<=0){assister=p;break;}}
  if(!assister)assister=assistCandidates[0];
  if(ratings[assister.id]){ratings[assister.id].assists=(ratings[assister.id].assists||0)+1;ratings[assister.id].keyPasses=(ratings[assister.id].keyPasses||0)+1;}
}
_applyMomentum(isH,min);// v197: aktualizuj momentum PRZED zapisem snapshotu
evts.push({min,type:'goal',sid:sc2.id,isH,scorer:sc2.last,scorerName:sc2.name||sc2.last,assister:assister?assister.last:null,assisterName:assister?(assister.name||assister.last):null,assisterId:assister?assister.id:null,_momSnap:{h:_momentum[true],a:_momentum[false]}});// v199: snapshot momentum
}else{
  // Strzał obroniony — GK dostaje save
  if(gkPlayer&&ratings[gkPlayer.id])ratings[gkPlayer.id].saves=(ratings[gkPlayer.id].saves||0)+1;
  // Strzał celny ale obroniony → keyPass dla przypadkowego asystenta
  if(isAccurate){
    const kpCandidates=sc.filter(p=>p.id!==sc2.id&&(p.pos==='POL'||p.pos==='NAP'));
    if(kpCandidates.length&&Math.random()<0.5){
      const kpPick=kpCandidates[Math.floor(Math.random()*kpCandidates.length)];
      if(ratings[kpPick.id])ratings[kpPick.id].keyPasses=(ratings[kpPick.id].keyPasses||0)+1;
    }
  }
  const _stxt=isAccurate?t('match_shot_saved').replace('{scorer}',sc2.last).replace('{gk}',gkPlayer?gkPlayer.last:'GK'):(sc2.last+' - '+[t('match_miss_1'),t('match_miss_2'),t('match_miss_3'),t('match_miss_4')][Math.floor(Math.random()*4)]);
  evts.push({min,type:'shot',text:_stxt,isH,pid:sc2.id,onTarget:isAccurate});
}});return evts;}
function bldSetPieces(sc, isH){
  const evts=[];
  if(!sc||!sc.length)return evts;
  const myId=isH?m.h:m.a;
  const allSt=G.players.filter(p=>p.clubId===myId&&p.starter&&p.pos!=='GK');
  if(!allSt.length)return evts;
  const fkTaker=[...allSt].sort((a,b)=>(b.sht||0)-(a.sht||0))[0];
  const crnTaker=[...allSt].sort((a,b)=>(b.pas||0)-(a.pas||0))[0];
  const headers=allSt.filter(p=>p.pos==='OBR'||p.pos==='NAP').sort((a,b)=>(b.phy||0)-(a.phy||0));
  const headerP=headers[0]||fkTaker;
  const oppGK=G.players.find(p=>p.clubId===(isH?m.a:m.h)&&p.pos==='GK'&&p.starter);
  const oppGkDef=oppGK?oppGK.def:40;

  // Rozne: 2-4 per mecz
  const nCorners=r(2,4);
  for(let i=0;i<nCorners;i++){
    const min=r(10,88);
    const gc=Math.max(0.02,Math.min(0.05,((crnTaker.pas||50)/100)*0.03+((headerP.phy||50)/100)*0.02));// v206: corner→gol 2-5% zamiast 4-9%
    if(isH)liveStats.hShots++;else liveStats.aShots++;
    if(Math.random()<gc){
      if(isH)liveStats.hOn++;else liveStats.aOn++;
      if(ratings[headerP.id])ratings[headerP.id].goals=(ratings[headerP.id].goals||0)+1;
      if(ratings[headerP.id])ratings[headerP.id].shots=(ratings[headerP.id].shots||0)+1;
      if(ratings[headerP.id])ratings[headerP.id].accurateShots=(ratings[headerP.id].accurateShots||0)+1;
      if(ratings[crnTaker.id]){ratings[crnTaker.id].assists=(ratings[crnTaker.id].assists||0)+1;ratings[crnTaker.id].keyPasses=(ratings[crnTaker.id].keyPasses||0)+1;}
      evts.push({min,type:'goal',sid:headerP.id,isH,scorer:headerP.last,scorerName:headerP.name,assister:crnTaker.last,assisterName:crnTaker.name,assisterId:crnTaker.id,setpiece:'corner'});_applyMomentum(isH,min);
if(evts.length)evts[evts.length-1]._momSnap={h:_momentum[true],a:_momentum[false]};
    } else {
      // Część chybionych cornerów trafia w ręce bramkarza (celny ale obroniony)
      if(Math.random()<0.35){if(isH)liveStats.hOn++;else liveStats.aOn++;if(oppGK&&ratings[oppGK.id])ratings[oppGK.id].saves=(ratings[oppGK.id].saves||0)+1;}
      evts.push({min,type:'corner',text:t('match_corner_text').replace('{taker}',crnTaker.last).replace('{result}',Math.random()<0.5?t('match_corner_header_saved'):t('match_corner_out')),isH});
    }
  }

  // Rzuty wolne: 1-2 per mecz
  const nFKs=r(1,2);
  for(let i=0;i<nFKs;i++){
    const min=r(8,85);
    const dist=r(18,28);
    const gc=Math.max(0.05,Math.min(0.13,((fkTaker.sht||50)/100)*0.13*(1-(dist-18)/40)));
    const sc2=Math.max(0.47,Math.min(0.78,(oppGkDef/100)*0.55+0.26));
    if(isH)liveStats.hShots++;else liveStats.aShots++;
    if(Math.random()<gc&&Math.random()>sc2){
      if(isH)liveStats.hOn++;else liveStats.aOn++;
      if(ratings[fkTaker.id])ratings[fkTaker.id].goals=(ratings[fkTaker.id].goals||0)+1;
      if(ratings[fkTaker.id])ratings[fkTaker.id].shots=(ratings[fkTaker.id].shots||0)+1;
      if(ratings[fkTaker.id])ratings[fkTaker.id].accurateShots=(ratings[fkTaker.id].accurateShots||0)+1;
      evts.push({min,type:'goal',sid:fkTaker.id,isH,scorer:fkTaker.last,scorerName:fkTaker.name,assister:null,assisterId:null,setpiece:'freekick'});_applyMomentum(isH,min);
if(evts.length)evts[evts.length-1]._momSnap={h:_momentum[true],a:_momentum[false]};
    } else {
      // Część wolnych trafia w bramkarza (celny obroniony) zamiast w mur/obok
      if(Math.random()<0.40){if(isH)liveStats.hOn++;else liveStats.aOn++;if(oppGK&&ratings[oppGK.id])ratings[oppGK.id].saves=(ratings[oppGK.id].saves||0)+1;}
      evts.push({min,type:'freekick',text:t('match_freekick_text').replace('{taker}',fkTaker.last).replace('{dist}',dist).replace('{result}',Math.random()<0.5?t('match_freekick_wall'):t('match_freekick_saved')),isH});
    }
  }

  // Karne: 0-1 per mecz (12%)
  if(Math.random()<0.12){
    const min=r(20,88);
    const pgc=Math.max(0.65,Math.min(0.83,(fkTaker.sht||50)/100*0.47+0.40));
    if(isH)liveStats.hShots++;else liveStats.aShots++;
    if(Math.random()<pgc){
      if(isH)liveStats.hOn++;else liveStats.aOn++;
      if(ratings[fkTaker.id])ratings[fkTaker.id].goals=(ratings[fkTaker.id].goals||0)+1;
      if(ratings[fkTaker.id])ratings[fkTaker.id].shots=(ratings[fkTaker.id].shots||0)+1;
      if(ratings[fkTaker.id])ratings[fkTaker.id].accurateShots=(ratings[fkTaker.id].accurateShots||0)+1;
      evts.push({min,type:'goal',sid:fkTaker.id,isH,scorer:fkTaker.last,scorerName:fkTaker.name,assister:null,assisterId:null,setpiece:'penalty'});_applyMomentum(isH,min);// v197: momentum po karnym
// v199: zapisz snapshot momentum po set-piece golu
if(evts.length)evts[evts.length-1]._momSnap={h:_momentum[true],a:_momentum[false]};
    } else {
      if(oppGK&&ratings[oppGK.id])ratings[oppGK.id].saves=(ratings[oppGK.id].saves||0)+1;
      evts.push({min,type:'penalty_saved',text:t('match_penalty_saved').replace('{taker}',fkTaker.last).replace('{gk}',oppGK?oppGK.last:''),isH});
    }
  }
  return evts;
}
function bldCards(pls){
  const evts=[];
  // Track yellow cards per player in this match
  const yellows={};
  pls.forEach(p=>{
    const isMy=p.clubId===G.myClubId;
    // Yellow card chance
    const myFoulMod=(p.clubId===G.myClubId)?styleMod.foul:1.0;if(Math.random()<0.05*myFoulMod){
      if(isMy)liveStats.hFouls++;else liveStats.aFouls++;
      yellows[p.id]=(yellows[p.id]||0)+1;
      if(ratings[p.id])ratings[p.id].cards=(ratings[p.id].cards||0)+1;
      evts.push({min:r(5,85),type:'yellow',text:t('match_yellow_card').replace('{name}',p.last),sid:p.id,isMy});
      // 2nd yellow = red card
      if(yellows[p.id]>=2){
        evts.push({min:r(86,89),type:'red2y',text:t('match_red_card_2y').replace('{name}',p.last),sid:p.id,isMy});
      }
    }
    // Direct red card chance
    if(Math.random()<0.007){
      evts.push({min:r(10,85),type:'red',text:t('match_red_card').replace('{name}',p.last),sid:p.id,isMy:p.clubId===G.myClubId});
    }
  });
  return evts;
}
const allPl=G.players.filter(p=>(p.clubId===m.h||p.clubId===m.a)&&p.starter);
// 3 fazy meczu z różnymi parametrami i nowe zdarzenia
const _cB=window._matchCounterBonus||1.0;
const _oR=window._matchOffsideRisk||0;
const _pF=window._matchPressFouls||0;
// ── PRESJA PSYCHOLOGICZNA — DERBY (v198) ────────────────────────
// Derby = rywal w top 3 tabeli LUB duża różnica prestiżu → zmienność wyników
const _oppClubId=isMyH?m.a:m.h;
const _oppStanding=G.standing?G.standing.find(s=>s.cid===_oppClubId):null;
const _oppPos=_oppStanding?([...G.standing].sort((a,b)=>b.pts-a.pts).indexOf(_oppStanding)+1):8;
const _myPos2=G.standing?([...G.standing].sort((a,b)=>b.pts-a.pts).findIndex(s=>s.cid===G.myClubId)+1):8;
const _isDerby=(_oppPos<=3||_myPos2<=3)||Math.abs(_oppPos-_myPos2)<=1;
// W derbach: baseShot *1.08 ale saveChance też *1.04 — więcej goli PO OBU stronach
// Efekt: mecze kończą się wyraźnym wynikiem częściej niż remisem
const _derbyFactor=_isDerby?1.08:1.0;
if(_isDerby&&!window._derbyNotified){
  window._derbyNotified=true;
}
// ── MOMENTUM + CZAS MECZU (v197) ─────────────────────────────────
// momentum[true]=gospodarz, momentum[false]=gość
// Zakres: -10 do +10. Start: 0. Aktualizowane po każdym golu.
// timeFactor: bramki w końcówce (76-90) są ~30% bardziej prawdopodobne.
window._momentum={true:0,false:0};const _momentum=window._momentum;
const _momEvts=[];// zdarzenia narracyjne generowane przez momentum
function _applyMomentum(isScorer,evtMin){
  _momentum[isScorer]=Math.min(10,_momentum[isScorer]+2.5);
  _momentum[!isScorer]=Math.max(-10,_momentum[!isScorer]-1.5);
  // v199: jednorazowy onboarding przy pierwszej zmianie momentum
  if(!G.momentumTutorialSeen){
    G.momentumTutorialSeen=true;
    setTimeout(function(){
      notif(t('match_momentum_tutorial'),'info');
    },800);
  }
  // Narracja gdy momentum wysoki (>6)
  if(_momentum[isScorer]>=6){
    const _mTxt=[t('match_mom_high_1'),t('match_mom_high_2'),t('match_mom_high_3')];
    _momEvts.push({min:Math.min(89,(evtMin||1)+2),type:'narration',
      text:_mTxt[Math.floor(Math.random()*_mTxt.length)],isH:isScorer});
  }
  if(_momentum[!isScorer]<=-6){
    const _dTxt=[t('match_mom_low_1'),t('match_mom_low_2')];
    _momEvts.push({min:Math.min(89,(evtMin||1)+3),type:'narration',
      text:_dTxt[Math.floor(Math.random()*_dTxt.length)],isH:!isScorer});
  }
}
function _momBoost(isH){ return _momentum[isH]*0.008; } // max ±8% na baseShot
function _momDecay(){
  // Po każdej akcji bez gola: momentum maleje o 0.18 w stronę zera
  const decay=0.18;
  if(_momentum[true]>0)_momentum[true]=Math.max(0,_momentum[true]-decay);
  else if(_momentum[true]<0)_momentum[true]=Math.min(0,_momentum[true]+decay);
  if(_momentum[false]>0)_momentum[false]=Math.max(0,_momentum[false]-decay);
  else if(_momentum[false]<0)_momentum[false]=Math.min(0,_momentum[false]+decay);
}
function _timeMod(min){
  // Bazowo 1.0; rośnie od 70', spike w 85-90'
  if(min<=15) return 0.90;   // zimny start -10%
  if(min<=70) return 1.00;   // środek meczu neutralny
  if(min<=84) return 1.00+(min-70)/70*0.25; // 70-84': +0 do +25%
  return 1.25+(min-85)/5*0.10;              // 85-90': +25 do +35%
}
// ── KONIEC INIT MOMENTUM + CZAS MECZU ─────────────────────────────

// v202: cap atk/def przed bldEvs — formMod*instrMod*lineMod nie może przekroczyć bazy
// max atk = OVR_MAX_LIGI * 1.15 — gracz nie może mieć wyższego ataku niż top liga na to pozwala
const _lgMaxOvr2=(LEAGUE_OVR&&LEAGUE_OVR[G.myLeague||8]?LEAGUE_OVR[G.myLeague||8][3]:92)*0.7;
const _atkCap=Math.round(_lgMaxOvr2*1.15);
hSt.atk=Math.min(hSt.atk,_atkCap);
aSt.atk=Math.min(aSt.atk,_atkCap);
hSt.def=Math.min(hSt.def,_atkCap);
aSt.def=Math.min(aSt.def,_atkCap);
// Faza 1: 1-30' (neutralna)
const ph1H=bldEvs(h1,hSt.atk,aSt.def,aSt.gkOvr,hSc,true,'early');
const ph1A=bldEvs(a1,aSt.atk,hSt.def,hSt.gkOvr,aSc,false,'early');
// Faza 2: 31-60' (lepsza drużyna dominuje)
const domMod=Math.max(myStrTot,oppStrTot)/(Math.min(myStrTot,oppStrTot)+1);
const ph2HAtk=Math.round(hSt.atk*(isMyH&&myStrTot>oppStrTot?1.0+domMod*0.03:1.0));
const ph2AAtk=Math.round(aSt.atk*(!isMyH&&myStrTot>oppStrTot?1.0+domMod*0.03:1.0));
const ph2H=bldEvs(h2,ph2HAtk,aSt.def,aSt.gkOvr,hSc,true,'mid');
const ph2A=bldEvs(a2,ph2AAtk,hSt.def,hSt.gkOvr,aSc,false,'mid');
// v198: CZERWONA KARTKA — oblicz h3fAdj/a3fAdj PRZED bldEvs fazy 3
const _allEarlyEvts=[...ph1H,...ph1A,...ph2H,...ph2A,...bldCards(allPl)];
const _redH=_allEarlyEvts.some(e=>(e.type==='red'||e.type==='red2y')&&e.isH===true);
const _redA=_allEarlyEvts.some(e=>(e.type==='red'||e.type==='red2y')&&e.isH===false);
const h3fAdj=_redH?Math.max(2,Math.round(h3f*0.80)):h3f;
const a3fAdj=_redA?Math.max(2,Math.round(a3f*0.80)):a3f;
// Faza 3: 61-90' (zmęczenie + kara za czerwoną kartkę v198)
const ph3H=bldEvs(h3fAdj,hSt.atk,aSt.def,aSt.gkOvr,hSc,true,'late');
const ph3A=bldEvs(a3fAdj,aSt.atk,hSt.def,hSt.gkOvr,aSc,false,'late');
// Zdarzenia specjalne
const specialEvts=[];
// Narracja
if(_isDerby)specialEvts.push({min:r(5,15),type:'narration',
  text:t('match_derby_text'),isH:isMyH});
if(_redH)specialEvts.push({min:r(62,75),type:'narration',text:t('match_down_home'),isH:true});
if(_redA)specialEvts.push({min:r(62,75),type:'narration',text:t('match_down_away'),isH:false});
// Zmęczenie w 3. fazie — komunikat
if(avgPhy<45&&isMyH)specialEvts.push({min:r(65,80),type:'narration',text:t('match_fatigue_text'),isH:false});
// v198: TAKTYCZNA DECYZJA W POŁOWIE — event w 46. minucie
window._tacticalShift={actMod:1.0,shotMod:1.0,saveMod:1.0,used:false};
specialEvts.push({min:46,type:'tacticalChoice',isH:isMyH,
  text:t('match_halftime_narr')});
// Kontra gdy Instrukcja=Kontry
if(G.instruction==='Kontry'&&Math.random()<0.3){
  const cScorer=hSc.length?hSc[Math.floor(Math.random()*hSc.length)]:null;
  if(cScorer)specialEvts.push({min:r(55,85),type:'narration',text:t('match_counter_text').replace('{name}',cScorer.last),isH:isMyH});
}
// Pressing — dodatkowe faule
if(G.pressing==='Wysoki'&&Math.random()<0.4)specialEvts.push({min:r(20,70),type:'narration',text:t('match_press_text'),isH:isMyH});
// Linia wysoka — spalony
if(_oR>0&&Math.random()<_oR){
  const offsAtt=aSc.length?aSc[Math.floor(Math.random()*aSc.length)]:null;
  if(offsAtt)specialEvts.push({min:r(25,65),type:'narration',text:t('match_offside_text').replace('{name}',offsAtt.last),isH:false});
}
const spMy=bldSetPieces(isMyH?hSc:aSc,isMyH);const spOp=bldSetPieces(isMyH?aSc:hSc,!isMyH);
allEvts=[...ph1H,...ph1A,...ph2H,...ph2A,...ph3H,...ph3A,...bldCards(allPl),...specialEvts,...spMy,...spOp,..._momEvts].sort((a,b)=>a.min-b.min);// v197: _momEvts = zdarzenia narracyjne momentum
let hG=0,aG=0;allEvts.forEach(ev=>{if(ev.type==='goal'){if(ev.isH)hG++;else aG++;}});
const fHG=hG,fAG=aG;const lg=document.getElementById('mlog');let idx2=0;hG=0;aG=0;
// Reset liveStats — były wypełniane podczas bldEvs, teraz zerujemy
// i będą inkrementowane sukcesywnie w pętli next() przez bldEvs snapshoty
liveStats={hShots:0,aShots:0,hOn:0,aOn:0,hFouls:0,aFouls:0,hAct:0,aAct:0};
function next(){if(idx2>=allEvts.length){m.done=true;m.hg=fHG;m.ag=fAG;if(!m._isCup)updStand(m.h,m.a,fHG,fAG);// Injuries during match
  G.players.filter(p=>(p.clubId===m.h||p.clubId===m.a)&&p.starter&&!p.injured).forEach(p=>{
    const injMult=(p.traits&&p.traits.includes('wytrzymaly'))?0.7:1.0;
    const chance=0.01*(1+(100-p.phy)/100)*injMult;
    if(Math.random()<chance){
    applyInjury(p,true);
    if(!window._matchInjured)window._matchInjured=[];
    window._matchInjured.push(p.id);// v199: zapamiętaj kontuzję
  }
  });
  // Stats for ALL players in this match (my club + opponent)
  const _isCupMatch=!!(G._cupMatchActive);
  const matchClubs=[m.h, m.a];
  matchClubs.forEach(cid=>{
    G.players.filter(p=>p.clubId===cid&&p.starter).forEach(p=>{
      if(!_isCupMatch)p.st.m++;
      if(_isCupMatch&&p.clubId===G.myClubId){
        if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};
        p.cupSt.m++;
      }
      if(p.clubId===G.myClubId){
        if(!p.trainMatches)p.trainMatches=0;p.trainMatches++;
        // Narastające zmeczenie po meczu
        if(!p.fatigue)p.fatigue=0;
        const phyBonus=(p.phy||50)/200; // wyzszy PHY = mniejsze zmeczenie
        p.fatigue=Math.round(Math.min(100,p.fatigue+Math.max(3,10-phyBonus*10)));
      }
    });
  });
  // Nalicz gole i asysty z allEvts (mecz gracza używa sid/assisterId)
  allEvts.filter(e=>e.type==='goal').forEach(e=>{
    const sc=G.players.find(x=>x.id===e.sid);
    if(sc){
      if(!_isCupMatch){if(!sc.st.g)sc.st.g=0;sc.st.g++;}
      if(_isCupMatch&&sc.clubId===G.myClubId){if(!sc.cupSt)sc.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!sc.cupSt.g)sc.cupSt.g=0;sc.cupSt.g++;}
    }
    const as=e.assisterId?G.players.find(x=>x.id===e.assisterId):null;
    if(as){
      if(!_isCupMatch){if(!as.st.a)as.st.a=0;as.st.a++;}
      if(_isCupMatch&&as.clubId===G.myClubId){if(!as.cupSt)as.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!as.cupSt.a)as.cupSt.a=0;as.cupSt.a++;}
    }
  });
  // v198: aktualizuj goalStreak dla zawodników mojego klubu
  if(!_isCupMatch){
    const _scorersThisMatch=new Set(allEvts.filter(e=>e.type==='goal').map(e=>e.sid));
    myPl().filter(p=>p.starter).forEach(p=>{
      if(_scorersThisMatch.has(p.id)){
        p.goalStreak=(p.goalStreak||0)+1;
      } else {
        p.goalStreak=0; // reset serii gdy mecz bez gola
      }
    });
  }
  // GK clean sheets for both teams
  const oppClubId=isMyH?m.a:m.h;
  const oppGK=G.players.find(p=>p.clubId===oppClubId&&p.pos==='GK'&&p.starter);
  if(oppGK){
    if(!oppGK.st.ga)oppGK.st.ga=0;if(!oppGK.st.cs)oppGK.st.cs=0;
    const oppGA=isMyH?fHG:fAG;
    oppGK.st.ga+=oppGA;if(oppGA===0)oppGK.st.cs++;
  }
  // Match skill growth: one random attr from active focus, age-based chance
  {
    const _matchGrowths=[];
    const tOpt4=G.trainFocusLock>0?TRAIN_OPTS.find(o=>o.k===G.training):null;
    const focusKeys=tOpt4?Object.keys(tOpt4.attrs):['sht','pas','def'];
    myPl().filter(p=>p.starter&&!p.injured).forEach(p=>{
      const chance=p.age<=20?0.20:p.age<=26?0.08:p.age<=29?0.03:0;
      if(chance>0&&Math.random()<chance){
        const attr=focusKeys[Math.floor(Math.random()*focusKeys.length)];
        const before=p[attr];
        const tr=(p.trainRate||1.0)+((p.traits&&p.traits.includes('pojety'))?0.2:0);
        // trainRate < 1.0 daje szansę poniżej 100% na gain +1
        if(Math.random()<tr){p[attr]=Math.min(99,p[attr]+1);}
        if(!p.trainMatches)p.trainMatches=0;p.trainMatches++;
        if(ovr(p)>=p.potential)p[attr]=before;
        else _matchGrowths.push({id:p.id,last:p.name.split(' ')[1],attr:attr});
      }
    });
    if(_matchGrowths.length>0){
      const msg=t('match_growth_msg').replace('{list}',_matchGrowths.map(g=>g.last+' +'+t('attr_'+g.attr)).join(', '));
      if(!G.news)G.news=[];
      G.news.unshift({msg,type:'ok',week:G.week,season:G.season,pids:_matchGrowths.map(g=>g.id)});
      if(G.news.length>30)G.news.pop();
      renderNews();
    }
  }
  allEvts.filter(e=>['yellow','red','red2y'].includes(e.type)&&e.isMy).forEach(e=>{
  const p=G.players.find(x=>x.id===e.sid);if(!p)return;
  if(e.type==='yellow'){
    if(!_isCupMatch){if(!p.st.yk)p.st.yk=0;p.st.yk++;}
    if(_isCupMatch){if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!p.cupSt.yk)p.cupSt.yk=0;p.cupSt.yk++;}
  }
  if(e.type==='red'||e.type==='red2y'){
    if(!_isCupMatch){if(!p.st.rk)p.st.rk=0;p.st.rk++;}
    if(_isCupMatch){if(!p.cupSt)p.cupSt={m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ratings:[]};if(!p.cupSt.rk)p.cupSt.rk=0;p.cupSt.rk++;}    // Remove from field for rest of match
    p.starter=false;
    // Reduce team strength after red card (-15% to all stats)
    const redSt=p.clubId===m.h?hSt:aSt;
    redSt.atk=Math.round(redSt.atk*0.85);
    redSt.mid=Math.round(redSt.mid*0.85);
    redSt.def=Math.round(redSt.def*0.85);
    redSt.total=Math.round((redSt.total||30)*0.85);
    // Suspension: 1-3 matches
    const susGames=r(1,3);
    if(!p.suspension)p.suspension=0;
    p.suspension+=susGames;
    notif(t('match_notif_suspended').replace('{name}',p.name).replace('{n}',susGames),'err');addNews(t('news_red_card').replace('{name}',p.name).replace('{n}',susGames),'card');
  }
  });
if(m.h===G.myClubId){const inc=r(200,800);G.budget+=inc;G.fin.tickets+=inc;}
const iW=(m.h===G.myClubId&&fHG>fAG)||(m.a===G.myClubId&&fAG>fHG),iL=(m.h===G.myClubId&&fHG<fAG)||(m.a===G.myClubId&&fAG<fHG);
if(!G.records)G.records={maxWinStreak:0,maxUnbeatenStreak:0,maxLoseStreak:0,unbeatenStreak:0,bestWin:null,maxGoalsSeason:0,minConcededSeason:99};
// Aktualizuj serie PRZED zapisem rekordu
if(iW){
  if(!G.winStreak)G.winStreak=0;G.winStreak++;G.loseStreak=0;
  if(!G.results)G.results=[];G.results.push('W');if(G.results.length>10)G.results.shift();
  G.records.maxWinStreak=Math.max(G.records.maxWinStreak||0,G.winStreak);
  G.records.unbeatenStreak=(G.records.unbeatenStreak||0)+1;
  G.records.maxUnbeatenStreak=Math.max(G.records.maxUnbeatenStreak||0,G.records.unbeatenStreak);
}else if(iL){
  if(!G.loseStreak)G.loseStreak=0;G.loseStreak++;G.winStreak=0;
  if(!G.results)G.results=[];G.results.push('L');if(G.results.length>10)G.results.shift();
  G.records.unbeatenStreak=0;
  G.records.maxLoseStreak=Math.max(G.records.maxLoseStreak||0,G.loseStreak);
}else{
  G.winStreak=0;G.loseStreak=0;
  if(!G.results)G.results=[];G.results.push('D');if(G.results.length>10)G.results.shift();
  G.records.unbeatenStreak=(G.records.unbeatenStreak||0)+1;
  G.records.maxUnbeatenStreak=Math.max(G.records.maxUnbeatenStreak||0,G.records.unbeatenStreak);
}
const myG2=m.h===G.myClubId?fHG:fAG,oppG2=m.h===G.myClubId?fAG:fHG;
const oppClub2=ALL_CLUBS.find(c=>c.id===(m.h===G.myClubId?m.a:m.h));
if(iW&&(!G.records.bestWin||myG2-oppG2>G.records.bestWin.diff))G.records.bestWin={myG:myG2,oppG:oppG2,diff:myG2-oppG2,opp:oppClub2?oppClub2.n:'?',season:G.season,rnd:m.rnd};
if(!G.allTimeStats)G.allTimeStats={players:{},bestSeller:null,bestBuyer:null};
allEvts.filter(ev=>ev.type==='goal').forEach(ev=>{
  // Gole
  const sc3=G.players.find(x=>x.id===ev.sid);
  if(sc3&&sc3.clubId===G.myClubId){
    if(!G.allTimeStats.players[sc3.id])G.allTimeStats.players[sc3.id]={id:sc3.id,name:sc3.name,goals:0,assists:0,matches:0};
    G.allTimeStats.players[sc3.id].id=sc3.id;
    G.allTimeStats.players[sc3.id].goals++;G.allTimeStats.players[sc3.id].name=sc3.name;
  }
  // Asysty
  if(ev.assisterId){
    const as3=G.players.find(x=>x.id===ev.assisterId);
    if(as3&&as3.clubId===G.myClubId){
      if(!G.allTimeStats.players[as3.id])G.allTimeStats.players[as3.id]={id:as3.id,name:as3.name,goals:0,assists:0,matches:0};
      G.allTimeStats.players[as3.id].id=as3.id;
      G.allTimeStats.players[as3.id].assists++;G.allTimeStats.players[as3.id].name=as3.name;
    }
  }
});
myPl().filter(p=>p.starter&&!p.injured).forEach(p=>{
  if(!G.allTimeStats.players[p.id])G.allTimeStats.players[p.id]={id:p.id,name:p.name,goals:0,assists:0,matches:0};
  const _isAcadDebut=p.fromAcademy&&G.allTimeStats.players[p.id].matches===0;
  G.allTimeStats.players[p.id].matches++;
  G.allTimeStats.players[p.id].name=p.name;
  if(_isAcadDebut)pushTimeline('academy_debut','🎓',t('tl_academy_debut').replace('{name}',p.name),{pid:p.id,sentiment:'pos',weight:20});
});
if(!G.reputation)G.reputation=10;if(!G.frequency)G.frequency=40;
// winStreak/loseStreak już zaktualizowane wyżej - tylko frekwencja i reputacja
if(iW){G.frequency=Math.min(100,G.frequency+5);G.reputation=Math.min(1000,G.reputation+1);
  // Lider: forma drużyny +2
  if(myPl().some(p=>p.starter&&p.traits&&p.traits.includes('lider')))
    myPl().forEach(p=>{p.form=Math.min(99,p.form+2);});
  // Pewny siebie: OVR bonus przy serii
  if(G.winStreak>=3)
    myPl().filter(p=>p.starter&&p.traits&&p.traits.includes('pewny_siebie')).forEach(p=>{p.form=Math.min(99,p.form+2);});if(G.winStreak>=3){G.frequency=Math.min(100,G.frequency+5);G.reputation=Math.min(1000,G.reputation+1);}}
else if(iL){G.frequency=Math.max(10,G.frequency-3);if(G.loseStreak>=3)G.frequency=Math.max(10,G.frequency-5);
  // Zimna krew: mniejszy spadek formy
  myPl().filter(p=>p.starter&&p.traits&&p.traits.includes('zimna_krew')).forEach(p=>{p.form=Math.min(99,p.form+2);});
  // Nerwowy: dodatkowy spadek
  myPl().filter(p=>p.starter&&p.traits&&p.traits.includes('nerwowy')).forEach(p=>{p.form=Math.max(5,p.form-2);});
}
else{G.frequency=Math.min(100,G.frequency+1);}// Form update for BOTH teams after match
  const hWon2=fHG>fAG,aWon2=fAG>fHG;
  G.players.filter(p=>p.clubId===m.h&&p.starter).forEach(p=>{
    if(hWon2)p.form=Math.min(100,p.form+1);else if(aWon2)p.form=Math.max(30,p.form-1);
  });
  G.players.filter(p=>p.clubId===m.a&&p.starter).forEach(p=>{
    if(aWon2)p.form=Math.min(100,p.form+1);else if(hWon2)p.form=Math.max(30,p.form-1);
  });
  simOthers();
  if(!G._cupMatchActive){
    calcFinalRatings(ratings,iW,iL,fHG,fAG,false);
    G.mHist.push({rnd:m.rnd,season:G.season,hn:hc.n,an:ac.n,hg:fHG,ag:fAG,isMyH:isMyH,g:allEvts.filter(e=>e.type==='goal').map(e=>({m:e.min,s:e.sid,a:e.assisterId,h:e.isH?1:0})),c:allEvts.filter(e=>['yellow','red','red2y'].includes(e.type)).map(e=>({m:e.min,id:e.sid,t:e.type==='yellow'?'y':'r'})),st:[liveStats.hShots||0,liveStats.aShots||0,liveStats.hOn||0,liveStats.aOn||0],r:Object.fromEntries(myPl().filter(p=>p.starter).map(p=>[p.id,Math.round(((ratings&&ratings[p.id]&&ratings[p.id].rating)||6)*10)/10]))});
    if(document.getElementById('dc-klub')&&document.getElementById('dc-klub').style.display!=='none')dcRenderKlub();
    postMatch(hc,ac,fHG,fAG,iW,iL,ratings,hA,aA,false,true);
  }
  // ── PUCHAR: jeśli to tydzień pucharowy i gracz ma pending mecz pucharowy ─
  if(G.cup&&G.cup.pendingMyMatch&&!G._cupMatchActive){
    // Mecz ligowy skończony — teraz aktywuj mecz pucharowy
    const _pm=G.cup.pendingMyMatch;
    const _prIdx=G.cup.pendingRound;
    const _pIsH=G.cup.pendingIsMyH;
    const _oppEnt=_pIsH?_pm.a:_pm.h;
    const _oppC=ALL_CLUBS.find(c=>c.id===_oppEnt.cid)||{n:_oppEnt.name};
    G._cupMatchActive={match:_pm,rIdx:_prIdx,isMyH:_pIsH,oppCid:_oppEnt.cid};
    upUI(90,fHG,fAG);btn.style.display='block';btn.textContent=t('match_finished_btn');btn.style.opacity='0.5';matchInProgress=false;G._matchJustFinished=true;
    const mtabsEnd=document.getElementById('m-tabs');if(mtabsEnd)mtabsEnd.style.display='flex';// v199: log zostaje w #mlog wewnątrz m-speed-btns — zostaje widoczny po meczu
    const ocenyBtn=document.querySelector('#m-tabs .sq-tab2-btn:nth-child(2)');
    if(ocenyBtn)matchTab('oceny',ocenyBtn);
    // Po chwili — otwórz mecz pucharowy (gracz może ustawić skład przez przycisk w panelu meczu)
    setTimeout(()=>{
      notif(t('match_cup_next_notif').replace('{opp}',_oppC.n),'ok');
      matchInProgress=false;
      fillMatch();
      openPanel('p-match');
    },800);
    return;
  }
  // ── FIX v255: po meczu pucharowym symuluj pominięty mecz ligowy gracza ──
  // Gdy gracz grał puchar bez wcześniejszego meczu ligowego w tej rundzie,
  // mecz ligowy na G.round pozostaje done:false — trzeba go rozegrać za gracza
  // jako mecz AI (walkower/symulacja), żeby tabela miała równą liczbę meczy.
  if(G._cupMatchActive){
    const _skippedLg=G.schedule&&G.schedule.find(function(mx){return mx.rnd===G.round&&!mx.done&&(mx.h===G.myClubId||mx.a===G.myClubId);});
    if(_skippedLg){
      // Symuluj jako mecz AI (obie strony traktowane jak AI)
      const _shSq=G.players.filter(function(p){return p.clubId===_skippedLg.h&&p.starter;});
      const _saSq=G.players.filter(function(p){return p.clubId===_skippedLg.a&&p.starter;});
      const _shOvr=_shSq.length?_shSq.reduce(function(s,p){return s+ovr(p);},0)/_shSq.length:25;
      const _saOvr=_saSq.length?_saSq.reduce(function(s,p){return s+ovr(p);},0)/_saSq.length:25;
      const _sLam=function(o){return 0.35+(Math.min(o,85)/100)*1.40;};
      const _sPois=function(lam){var g=0,p=Math.exp(-lam),s=p;var u=Math.random();while(u>s&&g<12){g++;p*=lam/g;s+=p;}return g;};
      const _shG=_sPois(_sLam(_shOvr)*1.07);
      const _saG=_sPois(_sLam(_saOvr));
      _skippedLg.hg=_shG;_skippedLg.ag=_saG;_skippedLg.done=true;
      // Aktualizuj standing ligi gracza
      const _sst=G.standing||G.allStandings[G.myLeague];
      if(_sst){
        const _shSt=_sst.find(function(e){return e.cid===_skippedLg.h;});
        const _saSt=_sst.find(function(e){return e.cid===_skippedLg.a;});
        if(_shSt&&_saSt){
          _shSt.p++;_saSt.p++;_shSt.gf+=_shG;_shSt.ga+=_saG;_saSt.gf+=_saG;_saSt.ga+=_shG;
          if(_shG>_saG){_shSt.w++;_shSt.pts+=3;_saSt.l++;}
          else if(_shG<_saG){_saSt.w++;_saSt.pts+=3;_shSt.l++;}
          else{_shSt.d++;_saSt.d++;_shSt.pts++;_saSt.pts++;}
        }
      }
      addNews(t('news_league_skipped').replace('{hg}',_skippedLg.hg).replace('{ag}',_skippedLg.ag).replace('{n}',G.round),'info');
    }
  }
  advWeek();upUI(90,fHG,fAG);btn.style.display='block';btn.textContent=t('match_finished_btn');btn.style.opacity='0.5';matchInProgress=false;G._matchJustFinished=true;// v199: blokuj auto-reload fillMatch
  // ── PUCHAR: rozstrzygnij mecz gracza jeśli aktywny (mecz pucharowy) ──
  const _wasCupMatch=!!(G._cupMatchActive);
  if(G._cupMatchActive){
    const _cmyG=isMyH?fHG:fAG,_coppG=isMyH?fAG:fHG;
    resolveCupMyMatch(_cmyG,_coppG);
  }
  // PO MECZU: pokaż zakładki RELACJA + OCENY, przełącz na OCENY
  const mtabsEnd=document.getElementById('m-tabs');if(mtabsEnd)mtabsEnd.style.display='flex';// v199: log zostaje w #mlog wewnątrz m-speed-btns — zostaje widoczny po meczu
  const ocenyBtn=document.querySelector('#m-tabs .sq-tab2-btn:nth-child(2)');
  if(ocenyBtn)matchTab('oceny',ocenyBtn);
  // Upewnij się że relacja pozostaje widoczna przy przełączeniu na zakładkę
  // Zapisz gole/asysty z meczu i oznacz gorących zawodników
  myPl().forEach(function(p){
    const rat=ratings&&ratings[p.id];
    if(rat){p.matchGoals=rat.goals||0;p.matchAssists=rat.assists||0;}
    const contrib=(p.matchGoals||0)+(p.matchAssists||0);
    if(contrib>=3&&!p.injured){
      p._hot=true;p._hotWeeks=2;
      // HOT: jeśli okno transferowe otwarte — generuj niespodziewaną ofertę zamiast pustego newsa
      if(isTransferWindow&&isTransferWindow().open){
        const _clubs=(G.leagues||[]).flatMap(l=>l.clubs||[]).filter(c=>c.id!==G.myClubId);
        const _buyer=_clubs[Math.floor(Math.random()*_clubs.length)];
        const _hotPrice=Math.round(calcValueDynamic(p)*1.20/500)*500;
        if(_buyer&&(!G.pendingOffers||!G.pendingOffers.find(x=>x.pid===p.id))){
          if(!G.pendingOffers)G.pendingOffers=[];
          G.pendingOffers.push({pid:p.id,price:_hotPrice,clubId:_buyer.id,clubName:_buyer.n});
          addNews(t('news_tr_hot_offer').replace('{name}',p.name).replace('{price}',fmtVal(_hotPrice)).replace('{buyer}',_buyer.n),'info');
          G.news[0].action='sell_offer';G.news[0].actionLabel=t('news_tr_action_sell');G.news[0].pid=p.id;
        }
      }
      // poza oknem — cichy wzrost wartości, bez newsa
    }
  });
  const _relEnd=document.getElementById('m-relacja');if(_relEnd&&!_relEnd.classList.contains('on')){}const bb2=document.getElementById('btn-match-back');if(bb2){bb2.style.display='block';bb2.style.background='var(--gb)';bb2.style.color='#000';bb2.textContent=t('modal_back');}updateHdr();if(_wasCupMatch){postMatch(hc,ac,fHG,fAG,iW,iL,ratings,hA,aA,true);}const _myPos=G.standing?([...G.standing].sort((a,b)=>b.pts-a.pts).findIndex(s=>s.cid===G.myClubId)+1):0;const _opp=isMyH?ac.n:hc.n;addNews((iW?t('news_match_win'):iL?t('news_match_loss'):t('news_match_draw')).replace('{score}',fHG+'-'+fAG).replace('{opp}',_opp).replace('{pos}',_myPos),iW?'ok':iL?'err':'info');notif((iW?t('match_toast_win'):iL?t('match_toast_loss'):t('match_toast_draw'))+' '+fHG+'-'+fAG,iW?'ok':iL?'err':'');return;}
const ev=allEvts[idx2++];
      // Inkrementuj liveStats sukcesywnie dla każdego zdarzenia
      const _isH=ev.isH;
      // Strzały: shot(niecelny/obroniony) + goal + set-pieces
      if(ev.type==='shot'){if(_isH){liveStats.hShots++;if(ev.onTarget)liveStats.hOn++;}else{liveStats.aShots++;if(ev.onTarget)liveStats.aOn++;}}
      if(ev.type==='goal'){if(_isH){liveStats.hShots++;liveStats.hOn++;hG++;}else{liveStats.aShots++;liveStats.aOn++;aG++;}}
      // Faule: kartki
      if(ev.type==='yellow'||ev.type==='red'||ev.type==='red2y'){const _isMy=ev.isMy;if(_isMy)liveStats.hFouls++;else liveStats.aFouls++;}
      // Akcje (posiadanie): każde zdarzenie z przypisaną drużyną
      if(_isH!==undefined&&ev.type!=='momupdate'){if(_isH)liveStats.hAct++;else liveStats.aAct++;}
      // v199: odtwarzaj snapshot momentum z momentu generowania
      if(ev._momSnap&&window._momentum){
        window._momentum[true]=ev._momSnap.h;
        window._momentum[false]=ev._momSnap.a;
      }
      upUI(ev.min,hG,aG);
      const premEl2=document.getElementById('m-prematch');if(premEl2)premEl2.style.display='none';
      if(lg){
        const isMy=ev.isH===isMyH;
        const d=document.createElement('div');
        // Dobierz klasę CSS per typ i drużyna
        // v199: momupdate to cichy event — tylko aktualizuje igłę, nie wchodzi do logu
        if(ev.type==='momupdate'){setTimeout(next,matchSpeed===0?1:50);return;}
        let cls='mlog-e ';
        let icon='▶'; let txt=ev.text||'';
        if(ev.type==='goal'){
          cls+=isMy?'goal-my':'goal-opp';
          icon=isMy?'⚽':'⚽';
          const scorerP=G.players.find(x=>x.id===ev.sid);
          const _acadScorer=scorerP&&scorerP.fromAcademy;const _acadDebH3=_acadScorer&&scorerP.history?scorerP.history.find(function(h){return h.fromAcademy;}):null;const scorerSpan=scorerP?'<span style="cursor:pointer;text-decoration:underline;color:'+(isMy?'var(--gb)':'var(--rd)')+'" onclick="event.stopPropagation();showById('+ev.sid+')">'+ev.scorer+(_acadScorer?' <span style="color:#9c27b0">🎓</span>':'')+'</span>':ev.scorer;
          let assistStr='';
          if(ev.assister){
            const assP=ev.assisterId?G.players.find(x=>x.id===ev.assisterId):null;
            assistStr=assP?' <span style="color:var(--gr)">(as. <span style="cursor:pointer;text-decoration:underline;color:var(--wh)" onclick="event.stopPropagation();showById('+assP.id+')">'+ev.assister+'</span>)</span>':' <span style="color:var(--gr)">(as. '+ev.assister+')</span>';
          }
          const spLabel=ev.setpiece==='corner'?' <span style="color:var(--gr)">'+t('match_sp_corner')+'</span>':ev.setpiece==='freekick'?' <span style="color:var(--gr)">'+t('match_sp_freekick')+'</span>':ev.setpiece==='penalty'?' <span style="color:var(--gr)">'+t('match_sp_penalty')+'</span>':'';
          txt='<b>'+t('match_goal_label')+' '+hG+'-'+aG+'</b> '+scorerSpan+assistStr+spLabel+(_acadScorer&&isMy&&_acadDebH3?'<div style="font-size:var(--fs-dense);color:#9c27b0;margin-top:2px">'+t('match_academy_debut_badge').replace('{season}',_acadDebH3.season).replace('{a}',_acadDebH3.ovr).replace('{b}',ovr(scorerP))+'</div>':'');
        } else if(ev.type==='shot'){
          cls+=isMy?'shot-my':'shot-opp'; icon=isMy?'→':'←';
        } else if(ev.type==='narration'){
          cls+=isMy?'narr-my':'narr-opp'; icon=isMy?'●':'●';
        } else if(ev.type==='corner'||ev.type==='freekick'){
          cls+=isMy?'setpiece-my':'setpiece-opp'; icon='🚩';
        } else if(ev.type==='penalty_saved'){
          cls+=isMy?'setpiece-opp':'setpiece-my'; icon='🧤';
        } else if(ev.type==='yellow'){
          cls+='card-ev'; icon='🟡';
        } else if(ev.type==='red'||ev.type==='red2y'){
          cls+='card-red'; icon='🔴';
        } else if(ev.type==='tacticalChoice'&&!window._tacticalShift.used&&matchSpeed>0){
          cls+='narr-my'; icon='⚙️';
          const _tBtns=[{key:'attack',label:t('match_tac_attack_label'),desc:t('match_tac_attack_desc'),shotMod:1.20,saveMod:0.85},{key:'counter',label:t('match_tac_counter_label'),desc:t('match_tac_counter_desc'),shotMod:1.25,saveMod:1.05},{key:'defend',label:t('match_tac_defend_label'),desc:t('match_tac_defend_desc'),shotMod:0.85,saveMod:1.12},{key:'press',label:t('match_tac_press_label'),desc:t('match_tac_press_desc'),shotMod:0.92,saveMod:1.00}];
          const _tacId='tac-countdown-'+Date.now();
          txt='<span style="color:var(--am);font-weight:700;font-size:var(--fs-micro)">'+t('match_halftime_title')+'</span><br><span style="font-size:var(--fs-dense);color:var(--gr)">'+t('match_halftime_subtitle')+'</span>'
            +'<div style="display:flex;align-items:center;gap:8px;margin:5px 0">'
            +'<div style="flex:1;height:4px;background:#1a1a1a;border:1px solid var(--gl)"><div id="'+_tacId+'-bar" style="height:100%;background:var(--am);width:100%;transition:width 1s linear"></div></div>'
            +'<span style="font-size:var(--fs-body);color:var(--am);min-width:28px;text-align:right"><b id="'+_tacId+'-sec">10</b>s</span>'
            +'</div>'
            +'<div style="display:flex;flex-wrap:wrap;gap:4px">'+ 
            _tBtns.map(b=>'<button id="tbtn-'+b.key+'" onclick="_applyTactic(\''+b.key+'\','+b.shotMod+','+b.saveMod+')" style="padding:6px 10px;font-size:var(--fs-meta);background:#0d1f0d;color:var(--am);border:1px solid var(--gl);border-radius:2px;cursor:pointer;text-align:left;min-width:140px">'+b.label+'<br><span style=\"color:#8ab88a;font-size:var(--fs-dense)\">'+b.desc+'</span></button>').join('')
            +'</div>';
          // Uruchom odliczanie po wyrenderowaniu
          window._tacTimerId=setTimeout(function _startTacTimer(){
            const _secEl=document.getElementById(_tacId+'-sec');
            const _barEl=document.getElementById(_tacId+'-bar');
            if(!_secEl)return;
            let _secs=10;
            if(_barEl)_barEl.style.width='100%';
            window._tacCountdown=setInterval(function(){
              if(window._tacticalShift&&window._tacticalShift.used){
                clearInterval(window._tacCountdown);return;
              }
              _secs--;
              if(_secEl)_secEl.textContent=_secs;
              if(_barEl)_barEl.style.width=(_secs*10)+'%';
              if(_secs<=0){
                clearInterval(window._tacCountdown);
                // Czas minął — neutralna taktyka i kontynuuj mecz
                if(!window._tacticalShift.used){
                  window._tacticalShift={shotMod:1.0,saveMod:1.0,used:true};
                  const mlog2=document.getElementById('mlog');
                  if(mlog2){const _d2=document.createElement('div');_d2.style.cssText='padding:3px 14px;font-size:var(--fs-dense);color:var(--gr);border-bottom:1px solid #0d1f0d';_d2.textContent=t('match_halftime_over');mlog2.appendChild(_d2);}
                }
                window._tacResumeNext&&window._tacResumeNext();
              }
            },1000);
          },50);
        }
        d.className=cls;
        d.innerHTML='<span class="mlog-min2">'+ev.min+'\'</span><span class="mlog-icon">'+icon+'</span><span class="mlog-txt">'+txt+'</span>';
        lg.appendChild(d);
        lg.scrollTop=lg.scrollHeight;// v199: scroll do najnowszego wpisu
        // v199: chipsy na prawej karcie — dodaj TERAZ (sync z logiem)
        if(ev.type==='goal'){
          _addEventChip(ev.isH===isMyH,'⚽',ev.min);// v199: isMyH=czy mój klub jest gospodarzem
        } else if(ev.type==='yellow'){
          _addEventChip(ev.isMy,'🟡',ev.min);
        } else if(ev.type==='red'||ev.type==='red2y'){
          _addEventChip(ev.isMy,'🟥',ev.min);
        } else if(ev.type==='sub'){
          _addEventChip(ev.isMy,'🔄',ev.min);
        } else if(ev.type==='tacticalChoice'){
          _addEventChip(true,'⚙️',ev.min);
        }
      }
// v198: tacticalChoice wstrzymuje mecz na 10s odliczania
if(ev.type==='tacticalChoice'&&!window._tacticalShift.used&&matchSpeed>0){
  // Zapisz callback — odliczanie wywoła go po 10s lub po wyborze gracza
  window._tacResumeNext=function(){window._tacResumeNext=null;setTimeout(next,matchSpeed===0?1:300);};
  // NIE wywołuj setTimeout(next,...) — czekamy na odliczanie
} else {
  setTimeout(next,matchSpeed===0?1:ev.type==='goal'?matchSpeed*1.5:
  ev.type==='red'?matchSpeed*1.2:ev.type==='yellow'?matchSpeed:matchSpeed*0.7);
}}
setTimeout(next,300);}

