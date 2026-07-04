function fillMatch(){
  if(!G)return;
  // Don't reset if match is in progress
  const lastM=G.schedule.find(m=>m.rnd===G.round-1&&(m.h===G.myClubId||m.a===G.myClubId));
  if(matchInProgress&&(!lastM||lastM&&lastM.done))matchInProgress=false;
  if(matchInProgress)return;
  // Blokuj auto-refresh tylko gdy nowa kolejka jeszcze nie wystartowała
  if(G._matchJustFinished){
    // Jeśli nextMatch() zwraca mecz nowej kolejki — pozwól odświeżyć
    const _nm=nextMatch();
    if(_nm&&!_nm.done){
      G._matchJustFinished=false;// nowa kolejka — odświeżamy
    } else {
      G._matchJustFinished=false;
      return;// stara kolejka zakończona — gracz ogląda oceny
    }
  }

  // ── PUCHAR: jeśli aktywny mecz pucharowy — zawsze pokaż go ──────────────
  if(G._cupMatchActive){
    const _cm=G._cupMatchActive;
    const _myId=G.myClubId;
    const _hCid=_cm.match.h.cid,_aCid=_cm.match.a.cid;
    const _hClub=ALL_CLUBS.find(c=>c.id===_hCid)||{n:_cm.match.h.name,id:_hCid};
    const _aClub=ALL_CLUBS.find(c=>c.id===_aCid)||{n:_cm.match.a.name,id:_aCid};
    const _isHome=_hCid===_myId;
    // Reset UI
    const _rc=id=>document.getElementById(id);
    const mlog=_rc('mlog');if(mlog)mlog.innerHTML='';
    const relDiv=_rc('m-relacja');if(relDiv){relDiv.classList.add('on');}
    const ocenyDiv=_rc('m-oceny');if(ocenyDiv){ocenyDiv.classList.remove('on');}
    const _rh2=_rc('m-rat-home');if(_rh2)_rh2.innerHTML='';
    const _ra2=_rc('m-rat-away');if(_ra2)_ra2.innerHTML='';
    const mstats=_rc('m-live-stats');if(mstats)mstats.style.display='none';
    const mtabs=_rc('m-tabs');if(mtabs)mtabs.style.display='none';
    const mspb=_rc('m-speed-btns');if(mspb)mspb.style.display='none';
    const mtbl=_rc('m-stat-table');if(mtbl)mtbl.innerHTML='';
    const _ec2=_rc('ls-events-chips');if(_ec2)_ec2.innerHTML='';
    const _tb2=_rc('ls-tactic-box');if(_tb2)_tb2.style.display='none';
    const _ml2=_rc('ls-mom-label');if(_ml2){_ml2.textContent=t('match_momentum_even');_ml2.style.color='var(--gr)';}
    const _mn2=_rc('ls-mom-needle');if(_mn2){_mn2.style.left='50%';_mn2.style.background='var(--am)';}
    const pr=document.getElementById('m-progress');if(pr)pr.style.width='0%';
    const mi=document.getElementById('m-minute');if(mi)mi.textContent="0'";
    const mls=document.getElementById('m-live-score');if(mls)mls.textContent='0 - 0';
    document.getElementById('m-attendance-bar')&&(document.getElementById('m-attendance-bar').style.display='none');
    const hn=document.getElementById('m-home-name');if(hn){hn.textContent=_hClub.n+(_isHome?' ⭐':'');hn.style.cursor='default';}
    const an=document.getElementById('m-away-name');if(an){an.textContent=(_isHome?'':' ⭐')+_aClub.n;an.style.cursor='default';}
    const inf=document.getElementById('m-info2');if(inf)inf.textContent=t('match_cup_info').replace('{round}',CUP_ROUND_LABELS[_cm.rIdx]);
    const _cupBanner=document.getElementById('m-cup-banner');
    if(_cupBanner){_cupBanner.style.display='block';_cupBanner.textContent=t('match_cup_banner').replace('{round}',CUP_ROUND_LABELS[_cm.rIdx]);}
    const bb4=document.getElementById('btn-match-back');if(bb4)bb4.style.display='none';
    const ln2=document.getElementById('m-lock-note');if(ln2)ln2.style.display='block';
    const btn=document.getElementById('btn-sim');
    if(btn){btn.style.display='block';btn.textContent=t('match_play_cup_btn');btn.disabled=false;btn.style.opacity='1';}
    const pre=document.getElementById('m-prematch');if(pre)pre.style.display='none';
    // Pokaż przycisk taktyki przed meczem pucharowym
    const _cupTacBtn=document.getElementById('cup-tac-btn');
    if(_cupTacBtn)_cupTacBtn.style.display='block';
    // Ustaw _cupFakeMatch żeby simMatch wiedział że to puchar
    G._cupFakeMatch={h:_hCid,a:_aCid,rnd:0,done:false,hg:0,ag:0,_isCup:true};
    return;
  }

  const m=nextMatch();
  // Ukryj przycisk taktyki pucharowej dla normalnych meczy
  const _ctbH=document.getElementById('cup-tac-btn');if(_ctbH)_ctbH.style.display='none';
  // v199: PEŁNY RESET UI dla nowego meczu
  const _r=id=>document.getElementById(id);
  // Wyczyść log relacji
  const mlog=_r('mlog');if(mlog)mlog.innerHTML='';
  // Ukryj statystyki, zakładki, pasek przycisków, oceny
  const mstats=_r('m-live-stats');if(mstats)mstats.style.display='none';
  const mtabs=_r('m-tabs');if(mtabs)mtabs.style.display='none';
  const mspb=_r('m-speed-btns');if(mspb)mspb.style.display='none';
  const mtbl=_r('m-stat-table');if(mtbl)mtbl.innerHTML='';
  // Ukryj oceny pomeczowe i wyczyść ich zawartość
  const ocenyDiv=_r('m-oceny');if(ocenyDiv){ocenyDiv.classList.remove('on');}
  const _rh=_r('m-rat-home');if(_rh)_rh.innerHTML='';
  const _ra=_r('m-rat-away');if(_ra)_ra.innerHTML='';
  // Przywróć zakładkę RELACJA jako aktywną
  const relDiv=_r('m-relacja');if(relDiv){relDiv.classList.add('on');}
  const _rBtn=document.querySelector('#m-tabs .sq-tab2-btn:first-child');
  const _oBtn=document.querySelector('#m-tabs .sq-tab2-btn:nth-child(2)');
  if(_rBtn){_rBtn.classList.add('on');} if(_oBtn){_oBtn.classList.remove('on');}
  // Wyczyść kartę prawą (chipsy, taktyka, momentum)
  const _ec=_r('ls-events-chips');if(_ec)_ec.innerHTML='';
  const _tb=_r('ls-tactic-box');if(_tb)_tb.style.display='none';
  const _ml=_r('ls-mom-label');if(_ml){_ml.textContent=t('match_momentum_even');_ml.style.color='var(--gr)';}
  const _mn=_r('ls-mom-needle');if(_mn){_mn.style.left='50%';_mn.style.background='var(--am)';}
  if(_r('ls-mom-h'))_r('ls-mom-h').textContent='+0.0';
  if(_r('ls-mom-a'))_r('ls-mom-a').textContent='+0.0';
  // Przywróć btn-sim
  const _btn=_r('btn-sim');if(_btn){_btn.style.display='block';_btn.style.opacity='1';_btn.disabled=false;_btn.textContent=t('match_play_btn');}
  // Ukryj przycisk WRÓĆ (pojawia się po meczu)
  const _bb=_r('btn-match-back');if(_bb){_bb.style.background='';_bb.style.color='';_bb.textContent=t('modal_back');}
  const pr=document.getElementById('m-progress');if(pr)pr.style.width='0%';
  const mi=document.getElementById('m-minute');if(mi)mi.textContent="0'";
  const mls=document.getElementById('m-live-score');if(mls)mls.textContent='0 - 0';
  // Frekwencja kibiców pod paskiem
  const attBar=document.getElementById('m-attendance-bar');
  if(attBar){
    const _m2=nextMatch();
    if(_m2&&_m2.h===G.myClubId){
      const _cap2=(G.stadium&&G.stadium.capacity)||200;
      const _freq2=G.frequency||50;
      const _wid2=Math.round(_cap2*_freq2/100);
      const _fc2=_freq2>=75?'var(--gb)':_freq2>=50?'var(--am)':'var(--rd)';
      attBar.style.display='block';
      attBar.innerHTML=t('match_attendance').replace('{pct}',_freq2).replace('{n}',_wid2.toLocaleString('pl-PL')).replace('{cap}',_cap2.toLocaleString('pl-PL'));
    }else{attBar.style.display='none';}
  }
  ['ls-poss','ls-shots','ls-on','ls-fouls'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—';});
  const btn=document.getElementById('btn-sim');
  const pre=document.getElementById('m-prematch');
  if(!m){
    if(_scbar)_scbar.style.display='block'; // przywróć scorebar — brak meczu = po meczu
    const hn=document.getElementById('m-home-name');if(hn)hn.textContent=t('match_no_match');
    const ls=document.getElementById('m-live-score');if(ls)ls.textContent=t('match_no_score');
    const bb4=document.getElementById('btn-match-back');if(bb4){bb4.style.display='block';bb4.style.background='';bb4.style.color='';bb4.textContent=t('modal_back');}const ln2=document.getElementById('m-lock-note');if(ln2)ln2.style.display='none';if(btn)btn.style.display='none';if(pre)pre.style.display='none';return;
  }
  const isHome=m.h===G.myClubId;
  const hc=ALL_CLUBS.find(c=>c.id===m.h),ac=ALL_CLUBS.find(c=>c.id===m.a);
  const hn=document.getElementById('m-home-name');if(hn){hn.textContent=hc.n+(isHome?' ⭐':'');hn.style.cursor='pointer';hn.onclick=()=>{if(isHome){fillSquad();const sqp=document.getElementById('p-squad');if(sqp){sqp.classList.add('open');};}else openClubModal(m.h);}}
  const an=document.getElementById('m-away-name');if(an){an.textContent=(isHome?'':' ⭐')+ac.n;an.style.cursor='pointer';an.onclick=()=>{if(!isHome){fillSquad();const sqp=document.getElementById('p-squad');if(sqp){sqp.classList.add('open');};}else openClubModal(m.a);}}
  const ls2=document.getElementById('m-live-score');if(ls2)ls2.textContent='0 - 0';
  const inf=document.getElementById('m-info2');if(inf)inf.textContent=t('match_round').replace('{n}',m.rnd)+(isHome?(' '+t('match_home_label')):(' '+t('match_away_label')));
  // ── PUCHAR: banner jeśli to mecz pucharowy ────────────────────────────
  const _cupBanner=document.getElementById('m-cup-banner');
  if(G._cupMatchActive&&_cupBanner){
    const _rLbl=CUP_ROUND_LABELS[G._cupMatchActive.rIdx]||t('cup_short');
    _cupBanner.style.display='block';
    _cupBanner.textContent=t('match_cup_banner').replace('{round}',_rLbl);
  } else if(_cupBanner){
    _cupBanner.style.display='none';
  }
  // Sprawdź czy skład jest gotowy do meczu
  const _validSt=mySt().filter(function(p){return !p.injured&&(!p.suspension||p.suspension<=0);});
  const _lim3=formationLimits();const _req3=1+_lim3.OBR+_lim3.POL+_lim3.NAP;
  const _canPlay=_validSt.length>=_req3;
  if(btn){btn.style.display='block';btn.textContent=_canPlay?t('match_play_btn'):t('match_incomplete').replace('{a}',_validSt.length).replace('{b}',_req3);btn.disabled=!_canPlay;btn.style.opacity=_canPlay?'1':'0.45';btn.style.background=_canPlay?'var(--am)':'#555';btn.style.color=_canPlay?'#000':'#aaa';}
  // Gdy skład niekompletny — pokaż WRÓĆ i linki do uzupełnienia
  const bb3=document.getElementById('btn-match-back');
  if(bb3)bb3.style.display=_canPlay?'none':'block';
  // Baner "uzupełnij skład" — pokaż/ukryj
  let _fixBaner=document.getElementById('m-fix-squad-baner');
  if(!_fixBaner){_fixBaner=document.createElement('div');_fixBaner.id='m-fix-squad-baner';const _mp=document.getElementById('m-prematch');if(_mp)_mp.parentNode.insertBefore(_fixBaner,_mp);}
  if(!_canPlay){
    _fixBaner.style.display='block';
    _fixBaner.innerHTML='<div style="background:#3d0000;border:1px solid var(--rd);padding:10px 14px;margin:0 0 6px;font-size:var(--fs-dense);color:var(--rd)">'+
      t('match_fix_squad_warn').replace('{a}',_validSt.length).replace('{b}',_req3)+'<br>'+
      '<div style="display:flex;gap:6px;margin-top:6px">'+
        '<button onclick="fillPanel(\'p-tactics\');openPanel(\'p-tactics\');" style="flex:1;background:var(--tb);border:1px solid var(--am);color:var(--am);font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('match_tactics_btn')+'</button>'+
        '<button onclick="openFACrisis(checkSquadCrisis())" style="flex:1;background:var(--tb);border:1px solid var(--rd);color:var(--rd);font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('match_free_agents_btn')+'</button>'+
      '</div>'+
    '</div>';
  } else {
    _fixBaner.style.display='none';
  }
  const lockNote=document.getElementById('m-lock-note');if(lockNote)lockNote.style.display='block';

  // Pre-match analysis
  // PRZED meczem: pokaż prematch, ukryj relację i tabs
  const _scbar=document.getElementById('m-scorebar');

  if(pre){
    pre.style.display='block';
    if(_scbar)_scbar.style.display='none'; // ukryj tylko gdy prematch
    function tSt2(cid){
      const st=G.players.filter(p=>p.clubId===cid&&p.starter);
      const avgStr2=a=>a.length?Math.round(a.reduce((s,p)=>s+playerStr(p),0)/a.length):25;
      const gk=st.filter(p=>p.pos==='GK'),def=st.filter(p=>p.pos==='OBR');
      const mid=st.filter(p=>p.pos==='POL'),att=st.filter(p=>p.pos==='NAP');
      const fmRaw=st.length?Math.round(st.reduce((s,p)=>s+p.form+(getBondFormBonus(p,cid===m.h)),0)/st.length):75;
      const fm=0.85+fmRaw/666;
      const avgMen=st.length?st.reduce((s,p)=>s+p.men,0)/st.length:50;
      const menBonus=1+(avgMen-50)/500;
      const atkR=Math.round((avgStr2(att)*0.7+avgStr2(mid)*0.3)*menBonus);
      const midR=Math.round((avgStr2(mid)*0.6+avgStr2(att)*0.2+avgStr2(def)*0.2)*menBonus);
      const defR=Math.round((avgStr2(def)*0.7+avgStr2(gk)*0.3)*menBonus);
      const avgOvr=st.length?Math.round(st.reduce((s,p)=>s+ovr(p),0)/st.length):30;
      return{atk:atkR,mid:midR,def:defR,form:fm,formRaw:fmRaw,total:avgOvr};
    }
    const hS=tSt2(m.h),aS=tSt2(m.a);
    const homeBonus=isHome?7:0;
    // Dane taktyki rywala
    const oppId=isHome?m.a:m.h;
    const oppTac=(G.clubTactics&&G.clubTactics[oppId])||{formation:'4-4-2',style:'Zrównoważony',tempo:'Normalne'};
    const oppForm=oppTac.formation||'4-4-2';
    const oppStyle=oppTac.style||'Zrównoważony';
    const oppTempo=oppTac.tempo||'Normalne';
    const styleIcon={'Defensywny':'🛡','Zrównoważony':'⚖️','Ofensywny':'⚔️'}[oppStyle]||'⚖️';
    // Siły obu drużyn
    // Lewa = gospodarz, prawa = gość (jak w scorebar)
    const homeS=hS, awayS=aS;
    const homeClub=hc, awayClub=ac;
    const homeId=m.h, awayId=m.a;
    // mySt2/oppSt dla zgodności z resztą kodu (szanse, badge)
    const mySt2=isHome?hS:aS;
    const oppSt=isHome?aS:hS;
    if(!G._matchMood)G._matchMood='balans';
    // Opisy nastawienia ze wszystkimi efektami
    const moods=[
      {k:'blok',  lbl:'🛡️ '+t('match_mood_block'),   sub:''},
      {k:'balans',lbl:'⚖️ '+t('match_mood_balance'), sub:''},
      {k:'atak',  lbl:'⚔️ '+t('match_mood_attack'),   sub:''}
    ];
    // Skład
    const stCount=mySt().length;
    const lim2=formationLimits();
    const req2=1+lim2.OBR+lim2.POL+lim2.NAP;
    const squadOk=stCount>=req2;

    // ── SZANSE z uwzględnieniem mood (poprawka 5) ───────────────
    // Szanse — stałe, bez wpływu nastawienia (żeby nie sugerować wyboru)
    const _myPow2=(mySt2.total*(1+(isHome?7:0)/100))*(mySt2.form/100);
    const _opPow2=oppSt.total*(oppSt.form/100);
    const _tot2=_myPow2+_opPow2;
    const myWin=Math.max(5,Math.min(90,Math.round(_myPow2/_tot2*70+5)));
    const oppWin=Math.max(5,Math.min(90,Math.round(_opPow2/_tot2*70+5)));
    const draw=Math.max(5,100-myWin-oppWin);

    // ── POZYCJA W TABELI ────────────────────────────────────────
    // Pozycja w tabeli — G.standing posortowane po pts
    const _tblSorted=[...(G.standing||[])].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    const _myPos=(()=>{const i=_tblSorted.findIndex(r=>parseInt(r.cid)===parseInt(G.myClubId));return i>=0?(i+1)+'.':'—';})();
    const _oppPos=(()=>{const i=_tblSorted.findIndex(r=>parseInt(r.cid)===parseInt(oppId));return i>=0?(i+1)+'.':'—';})();

    // ── FORMA — 5 ostatnich meczy ────────────────────────────────
    function formDots(cid){
      const last5=(G.schedule||[]).filter(x=>x.done&&(x.h===cid||x.a===cid)).slice(-5);
      return last5.map(x=>{
        const isH=x.h===cid;
        const gf=isH?x.hg:x.ag,ga=isH?x.ag:x.hg;
        const col=gf>ga?'#4caf50':gf===ga?'#ffc107':'#f44336';
        return '<div style="width:9px;height:9px;border-radius:1px;background:'+col+'"></div>';
      }).join('');
    }

    // ── MINIBAR ──────────────────────────────────────────────────
    const BMAX=Math.max(mySt2.atk,mySt2.mid,mySt2.def,oppSt.atk,oppSt.mid,oppSt.def,1);
    function miniBar(val,col){
      const w=Math.round(val/BMAX*100);
      return '<div style="height:4px;background:var(--gm);border-radius:1px;margin-top:2px;overflow:hidden">'+
             '<div style="height:100%;width:'+w+'%;background:'+col+';border-radius:1px"></div></div>';
    }

    // ── WIERSZ STAT w karcie ─────────────────────────────────────
    function cardStatRow(lbl,myVal,oppVal){
      const better=myVal>oppVal,equal=myVal===oppVal;
      const myC=better?'var(--gb)':equal?'var(--wh)':'var(--am)';
      const triC=better?'var(--gb)':equal?'var(--gr)':'var(--am)';
      const triCh=better?'▲':equal?'':'▽';
      const mw=Math.round(myVal/BMAX*100);
      return(
        '<div style="margin-bottom:6px">'+
          '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);letter-spacing:.3px;margin-bottom:1px">'+lbl+'</div>'+
          '<div style="display:flex;justify-content:space-between;align-items:center">'+
            '<div style="flex:1;height:4px;background:var(--gm);border-radius:1px;overflow:hidden;margin-right:6px">'+
              '<div style="height:100%;width:'+mw+'%;background:'+myC+';border-radius:1px"></div>'+
            '</div>'+
            '<span style="font-size:var(--fs-body);color:'+myC+'">'+myVal+'</span>'+
            '<span style="font-size:var(--fs-body);color:'+triC+';margin-left:2px">'+triCh+'</span>'+
          '</div>'+
        '</div>'
      );
    }
    function cardStatRowOpp(lbl,oppVal,myVal){
      const stronger=oppVal>myVal,equal=oppVal===myVal;
      const opC=stronger?'var(--rd)':equal?'var(--wh)':'var(--gr)';
      const triCh2=stronger?'▲':equal?'':'▽';
      const ow=Math.round(oppVal/BMAX*100);
      const barC=stronger?'var(--rd)':equal?'var(--gl)':'var(--gm)';
      return(
        '<div style="margin-bottom:6px">'+
          '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);letter-spacing:.3px;margin-bottom:1px">'+lbl+'</div>'+
          '<div style="display:flex;justify-content:space-between;align-items:center">'+
            '<span style="font-size:var(--fs-body);color:'+opC+';margin-right:2px">'+triCh2+'</span>'+
            '<span style="font-size:var(--fs-body);color:'+opC+'">'+oppVal+'</span>'+
            '<div style="flex:1;height:4px;background:var(--gm);border-radius:1px;overflow:hidden;margin-left:6px;display:flex;justify-content:flex-end">'+
              '<div style="height:100%;width:'+ow+'%;background:'+barC+';border-radius:1px"></div>'+
            '</div>'+
          '</div>'+
        '</div>'
      );
    }

    pre.innerHTML=
      // ── POPRAWKA 2: Nagłówek z OVR i Formą (zamiast wyniku) ────
      '<div style="background:#000;border-bottom:2px solid var(--gb);padding:8px 12px 6px">'+
        '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px">'+
          // LEWA = gospodarz
          '<div>'+
            '<div style="font-size:var(--fs-body);color:var(--gb);line-height:1.1;'+(isHome?'cursor:pointer;text-decoration:underline':'')+'" onclick="'+(isHome?'fillSquad();var sqp=document.getElementById(\'p-squad\');if(sqp){sqp.classList.add(\'open\');}':'openClubModal('+homeId+')')+'">'+
              (isHome?'⭐ ':'')+homeClub.n+
            '</div>'+
            '<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:1px">'+
              'OVR '+homeS.total+' • Forma '+Math.round(homeS.formRaw||75)+'%'+
            '</div>'+
            '<div style="display:flex;gap:3px;margin-top:4px">'+formDots(homeId)+'</div>'+
          '</div>'+
          // Środek VS
          '<div style="text-align:center">'+
            '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr)">'+t('match_vs')+'</div>'+
            '<div style="font-size:var(--fs-meta);color:'+(isHome?'var(--gb)':'var(--gr)')+'">'+
              (isHome?t('match_home_tag'):t('match_away_tag'))+
            '</div>'+
          '</div>'+
          // PRAWA = gość
          '<div style="text-align:right">'+
            '<div style="font-size:var(--fs-body);color:var(--am);line-height:1.1;cursor:pointer;text-decoration:underline" onclick="'+(isHome?'openClubModal('+awayId+')':'fillSquad();var sqp=document.getElementById(\'p-squad\');if(sqp){sqp.classList.add(\'open\');}')+'">'+
              awayClub.n+(isHome?'':' ⭐')+
            '</div>'+
            '<div style="font-size:var(--fs-dense);color:var(--gr);margin-top:1px">'+
              'OVR '+awayS.total+' • Forma '+Math.round(awayS.formRaw||75)+'%'+
            '</div>'+
            '<div style="display:flex;gap:3px;justify-content:flex-end;margin-top:4px">'+formDots(awayId)+'</div>'+
          '</div>'+
        '</div>'+
      '</div>'+

      // ── POPRAWKA 3: Badge strip — miejsce + bonus dom ───────────
      '<div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;padding:5px 12px;border-bottom:1px solid var(--gl);background:#080f08">'+
        '<div style="font-weight:700;font-size:var(--fs-micro);padding:2px 5px;border:1px solid var(--gl);color:var(--gr)">'+
          t('match_you_pos').replace('{pos}',_myPos)+
        '</div>'+
        '<div style="font-weight:700;font-size:var(--fs-micro);padding:2px 5px;border:1px solid var(--gl);color:var(--gr)">'+
          t('match_rival_pos').replace('{pos}',_oppPos)+
        '</div>'+
        (isHome?'<div style="font-weight:700;font-size:var(--fs-micro);padding:2px 5px;border:1px solid var(--gb);color:var(--gb)">'+t('match_home_bonus')+'</div>':'')+
      '</div>'+

      // ── POPRAWKA 4: Dwie oddzielne karty TY | RYWAL ─────────────
      '<div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--gl)">'+
        // Karta LEWA — GOSPODARZ
        '<div style="padding:8px 10px;border-right:1px solid var(--gl)">'+
          '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gb);border-bottom:1px solid var(--gm);padding-bottom:3px;margin-bottom:6px">'+(isHome?t('match_you_label'):t('match_host_label'))+' 🏠</div>'+
          cardStatRow('ATK',homeS.atk,awayS.atk)+
          cardStatRow('MID',homeS.mid,awayS.mid)+
          cardStatRow('DEF',homeS.def,awayS.def)+
          '<div style="border-top:1px solid var(--gm);margin-top:5px;padding-top:5px">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+t('match_tactic_lbl')+'</span>'+
              '<span style="font-weight:700;font-size:var(--fs-h3);color:var(--wh)">'+(isHome?G.formation:oppForm)+'</span>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+t('match_style_lbl')+'</span>'+
              '<span style="font-size:var(--fs-meta);color:var(--gb)">'+(isHome?_styleLabel(G.style||'Zrównoważony'):_styleLabel(oppStyle))+'</span>'+
            '</div>'+
            (isHome?'<div style="display:flex;justify-content:space-between">'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+t('match_squad_lbl')+'</span>'+
              '<span style="font-size:var(--fs-meta);color:'+(squadOk?'var(--gb)':'var(--rd)')+'">'+
                (squadOk?'✅ '+stCount+'/'+req2:'⚠ '+stCount+'/'+req2)+
              '</span></div>':'<div style="display:flex;justify-content:space-between">'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+t('match_weakness_lbl')+'</span>'+
              '<span style="font-size:var(--fs-meta);color:var(--rd)">'+(homeS.atk<=homeS.def?'⚠ ATK':'⚠ DEF')+'</span></div>')+
          '</div>'+
        '</div>'+
        // Karta PRAWA — GOŚĆ
        '<div style="padding:8px 10px">'+
          '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--am);border-bottom:1px solid var(--gm);padding-bottom:3px;margin-bottom:6px;text-align:right">'+(isHome?t('match_rival_label'):t('match_you_label_r'))+' ✈</div>'+
          cardStatRowOpp('ATK',awayS.atk,homeS.atk)+
          cardStatRowOpp('MID',awayS.mid,homeS.mid)+
          cardStatRowOpp('DEF',awayS.def,homeS.def)+
          '<div style="border-top:1px solid var(--gm);margin-top:5px;padding-top:5px">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+t('match_tactic_lbl')+'</span>'+
              '<span style="font-weight:700;font-size:var(--fs-h3);color:var(--wh)">'+(isHome?oppForm:G.formation)+'</span>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+t('match_style_lbl')+'</span>'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+(isHome?styleIcon+' '+_styleLabel(oppStyle):_styleLabel(G.style||'Zrównoważony'))+'</span>'+
            '</div>'+
            (isHome?'<div style="display:flex;justify-content:space-between">'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+t('match_weakness_lbl')+'</span>'+
              '<span style="font-size:var(--fs-meta);color:var(--rd)">'+(awayS.atk<=awayS.def?'⚠ ATK':'⚠ DEF')+'</span></div>':'<div style="display:flex;justify-content:space-between">'+
              '<span style="font-size:var(--fs-meta);color:var(--gr)">'+t('match_squad_lbl')+'</span>'+
              '<span style="font-size:var(--fs-meta);color:'+(squadOk?'var(--gb)':'var(--rd)')+'">'+
                (squadOk?'✅ '+stCount+'/'+req2:'⚠ '+stCount+'/'+req2)+'</span></div>')+
          '</div>'+
        '</div>'+
      '</div>'+

      // ── POPRAWKA 5: Szanse — pasek aktualizuje się z mood ───────
      '<div style="padding:6px 12px;border-bottom:1px solid var(--gl)">'+
        '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);margin-bottom:4px;letter-spacing:.3px">'+t('match_chances_title')+'</div>'+
        '<div style="display:flex;height:8px;border-radius:1px;overflow:hidden;margin-bottom:4px">'+
          '<div style="flex:'+myWin+';background:var(--gb)"></div>'+
          '<div style="flex:'+draw+';background:var(--gl)"></div>'+
          '<div style="flex:'+oppWin+';background:var(--rd)"></div>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:var(--fs-dense)">'+
          '<span style="color:var(--gb)">'+t('match_chance_win').replace('{n}',myWin)+'</span>'+
          '<span style="color:var(--gr)">'+t('match_chance_draw').replace('{n}',draw)+'</span>'+
          '<span style="color:var(--rd)">'+t('match_chance_loss').replace('{n}',oppWin)+'</span>'+
        '</div>'+
      '</div>'+

      // ── NASTAWIENIE ──────────────────────────────────────────────
      '<div style="padding:6px 12px;border-bottom:1px solid var(--gl)">'+
        '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);margin-bottom:5px;letter-spacing:.3px">'+t('match_mood_title')+'</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px">'+
        moods.map(md=>{
          const sel=G._matchMood===md.k;
          const lines=md.sub.split('\n');
          return '<div onclick="G._matchMood=\''+md.k+'\';fillMatch()" '+
            'style="padding:7px 4px;text-align:center;cursor:pointer;'+
            'background:'+(sel?'#1a2a00':'var(--tb)')+';'+
            'border:2px solid '+(sel?'var(--am)':'var(--gm)')+'">'+
            '<div style="font-size:var(--fs-body);line-height:1">'+md.lbl.split(' ')[0]+'</div>'+
            '<div style="font-weight:700;font-size:var(--fs-micro);color:'+(sel?'var(--am)':'var(--gr)')+';margin-top:3px">'+md.lbl.split(' ')[1]+'</div>'+
            lines.map(l=>'<div style="font-size:var(--fs-dense);color:'+(sel?'var(--gb)':'#444')+';margin-top:1px;line-height:1.1">'+l+'</div>').join('')+
          '</div>';
        }).join('')+
        '</div>'+
      '</div>'+

      // ── PRZYCISKI TAKTYKA + SKŁAD ────────────────────────────────
      '<div style="display:flex;gap:6px;padding:7px 12px 8px">'+
        '<button onclick="fillPanel(\'p-tactics\');openPanel(\'p-tactics\');" '+
          'style="flex:1;background:var(--tb);border:1px solid var(--gl);color:var(--gb);font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('match_tactics_link')+'</button>'+
        '<button onclick="fillPanel(\'p-squad\');openPanel(\'p-squad\');" '+
          'style="flex:1;background:var(--tb);border:1px solid var(--gl);color:var(--gb);font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('match_squad_link')+'</button>'+
      '</div>';
  }
}
function nextMatch(){
  // Jeśli aktywny mecz pucharowy — zawsze zwróć fake match pucharowy
  if(G._cupMatchActive){
    if(!G._cupFakeMatch||G._cupFakeMatch.done){
      const _cm=G._cupMatchActive;
      G._cupFakeMatch={h:_cm.match.h.cid,a:_cm.match.a.cid,rnd:0,done:false,hg:0,ag:0,_isCup:true};
    }
    if(!G._cupFakeMatch.done)return G._cupFakeMatch;
  }
  if(G._cupFakeMatch&&!G._cupFakeMatch.done)return G._cupFakeMatch;
  return G.schedule.find(m=>m.rnd===G.round&&!m.done&&(m.h===G.myClubId||m.a===G.myClubId));
}

function updateSpeedLabel(){
  const el=document.getElementById('m-speed-label');if(!el)return;
  if(matchSpeed<=0){el.textContent=t('match_speed_result');return;}
  const totalSec=Math.round(matchSpeed*20/1000);
  const mins=Math.floor(totalSec/60),secs=totalSec%60;
  const timeStr=mins>0?mins+':'+(secs<10?'0':'')+secs:secs+'s';
  const label=matchSpeed>=3000?t('match_speed_slow'):matchSpeed>=1500?t('match_speed_normal'):matchSpeed>=500?t('match_speed_fast'):t('match_speed_express');
  el.textContent=label+' '+timeStr;
}
function changeSpeed(delta){
  // delta > 0 = faster (reduce delay), delta < 0 = slower (increase delay)
  matchSpeed=Math.max(100,Math.min(5000,matchSpeed-delta));
  updateSpeedLabel();
}
function setMatchSpeed(ms){
  if(ms===0)autoSubs(); // auto-zmiany przy WYNIK
  matchSpeed=ms;
  updateSpeedLabel();
}
