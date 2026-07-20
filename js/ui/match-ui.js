function fillMatch(){
  if(!G)return;
  // Don't reset if match is in progress
  const lastM=G.schedule.find(m=>m.rnd===G.round-1&&(m.h===G.myClubId||m.a===G.myClubId));
  if(matchInProgress&&!G._cupMatchActive&&(!lastM||lastM&&lastM.done))matchInProgress=false;
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

  // v234: mecz pucharowy nie ma już osobnej, uproszczonej ścieżki — leci tą samą
  // analizą przedmeczową co liga (nextMatch() sam tworzy G._cupFakeMatch w tym samym
  // kształcie {h,a,rnd,done} co mecz ligowy, więc dalszy kod obsługuje oba przypadki).
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
  // Frekwencja kibiców pod paskiem — 🎟️ + wizualny pasek
  const attBar=document.getElementById('m-attendance-bar');
  if(attBar){
    const _m2=nextMatch();
    if(_m2&&_m2.h===G.myClubId){
      const _cap2=(G.stadium&&G.stadium.capacity)||200;
      const _freq2=G.frequency||50;
      const _wid2=Math.round(_cap2*_freq2/100);
      const _fc2=_freq2>=75?'var(--gb)':_freq2>=50?'var(--am)':'var(--rd)';
      attBar.style.display='block';
      attBar.innerHTML='🎟️ '+t('match_attendance').replace('{pct}',_freq2).replace('{n}',_wid2.toLocaleString(LANG==='en'?'en-GB':'pl-PL')).replace('{cap}',_cap2.toLocaleString(LANG==='en'?'en-GB':'pl-PL'))+
        '<div style="height:4px;background:#1a1a1a;border:1px solid var(--gl);margin-top:3px;max-width:140px"><div style="height:100%;width:'+_freq2+'%;background:'+_fc2+'"></div></div>';
    }else{attBar.style.display='none';}
  }
  // Reset akordeonu statystyk + baneru ocen końcowych
  const _acc0=document.getElementById('m-stats-acc');if(_acc0)_acc0.classList.remove('open');
  const _accSum0=document.getElementById('acc-summary');if(_accSum0)_accSum0.textContent=t('match_possession');
  const _fb0=document.getElementById('m-final-banner');if(_fb0)_fb0.style.display='none';
  ['ls-yellow-row'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  ['ls-poss','ls-shots','ls-on','ls-fouls'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—';});
  const btn=document.getElementById('btn-sim');
  const pre=document.getElementById('m-prematch');
  const _scbar=document.getElementById('m-scorebar');
  if(!m){
    if(_scbar)_scbar.style.display='block'; // przywróć scorebar — brak meczu = po meczu
    const hn=document.getElementById('m-home-name');if(hn)hn.textContent=t('match_no_match');
    const ls=document.getElementById('m-live-score');if(ls)ls.textContent=t('match_no_score');
    const bb4=document.getElementById('btn-match-back');if(bb4){bb4.style.display='block';bb4.style.background='';bb4.style.color='';bb4.textContent=t('modal_back');}const ln2=document.getElementById('m-lock-note');if(ln2)ln2.style.display='none';if(btn)btn.style.display='none';if(pre)pre.style.display='none';return;
  }
  const isHome=m.h===G.myClubId;
  if(typeof _setBoiskoSideLabels==='function')_setBoiskoSideLabels(isHome);
  // v234: rywal pucharowy bywa spoza ALL_CLUBS (puchar łączy kluby z różnych lig,
  // a ALL_CLUBS to tylko 16 klubów AKTUALNEJ ligi gracza) — wtedy nazwa/id spada
  // na dane wbudowane w sam mecz pucharowy (G._cupMatchActive.match.h/.a.name).
  let hc,ac;
  if(G._cupMatchActive){
    const _cmM=G._cupMatchActive.match;
    hc=ALL_CLUBS.find(c=>c.id===m.h)||{id:m.h,n:_cmM.h.name};
    ac=ALL_CLUBS.find(c=>c.id===m.a)||{id:m.a,n:_cmM.a.name};
  } else {
    hc=ALL_CLUBS.find(c=>c.id===m.h);ac=ALL_CLUBS.find(c=>c.id===m.a);
  }
  // v222: nazwa drużyny jako "chip" w tych samych barwach co pasek jej akcji w relacji
  // (--am-bar/--gb-bar) — wyraźne powiązanie kolorystyczne góra↔relacja, nie tylko kolor tekstu
  const hn=document.getElementById('m-home-name');if(hn){hn.innerHTML=_teamChip(hc.n+(isHome?' ⭐':''),isHome);hn.style.cursor='pointer';hn.onclick=()=>{if(isHome){fillSquad();openPanel('p-squad');}else openClubModal(m.h);}}
  const an=document.getElementById('m-away-name');if(an){an.innerHTML=_teamChip((isHome?'':' ⭐')+ac.n,!isHome);an.style.cursor='pointer';an.onclick=()=>{if(!isHome){fillSquad();openPanel('p-squad');}else openClubModal(m.a);}}
  const ls2=document.getElementById('m-live-score');if(ls2)ls2.textContent='0 - 0';
  const inf=document.getElementById('m-info2');
  if(inf){
    inf.textContent=G._cupMatchActive?
      t('match_cup_info').replace('{round}',CUP_ROUND_LABELS[G._cupMatchActive.rIdx]):
      t('match_round').replace('{n}',m.rnd)+(isHome?(' '+t('match_home_label')):(' '+t('match_away_label')));
  }
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
  if(btn){const _playLbl=G._cupMatchActive?t('match_play_cup_btn'):t('match_play_btn');btn.style.display='block';btn.textContent=_canPlay?_playLbl:t('match_incomplete').replace('{a}',_validSt.length).replace('{b}',_req3);btn.disabled=!_canPlay;btn.style.opacity=_canPlay?'1':'0.45';btn.style.background=_canPlay?'var(--am)':'#555';btn.style.color=_canPlay?'#000':'#aaa';}
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
      '</div>'+
    '</div>';
  } else {
    _fixBaner.style.display='none';
  }
  const lockNote=document.getElementById('m-lock-note');if(lockNote){lockNote.textContent=t('match_lock_note');lockNote.style.cssText='display:block;background:#1a1300;border-top:2px solid var(--am);color:var(--am);padding:6px 14px;font-size:var(--fs-dense);text-align:center';}

  // Pre-match analysis
  // PRZED meczem: pokaż prematch, ukryj relację i tabs
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
    const _styleIcon=s=>({'Defensywny':'🛡','Zrównoważony':'⚖️','Ofensywny':'⚔️'}[s]||'⚖️');
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

    // ── BELKA PORÓWNAWCZA ATK/MID/DEF (v232) — jeden pasek na statystykę,
    // podzielony na 2 (gospodarz|gość), zamiast dwóch osobnych kart z paskami —
    // przewaga widoczna jako długość segmentu, bez czytania dwóch kolumn liczb.
    function statRow2(lbl,hVal,aVal){
      return(
        '<div style="margin-bottom:8px">'+
          '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);letter-spacing:.3px;margin-bottom:3px">'+lbl+'</div>'+
          '<div style="display:flex;height:18px;border-radius:1px;overflow:hidden">'+
            '<div style="flex:'+hVal+';background:var(--gb);color:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;font-weight:700;font-size:var(--fs-micro)">'+hVal+'</div>'+
            '<div style="flex:'+aVal+';background:var(--am);color:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;font-weight:700;font-size:var(--fs-micro)">'+aVal+'</div>'+
          '</div>'+
        '</div>'
      );
    }

    pre.innerHTML=
      // ── v232: karty klubów (herb-monogram, OVR, forma, kropki formy, pozycja) —
      // gospodarz lewo / gość prawo, każdy fakt o drużynie pokazany dokładnie raz.
      '<div style="background:#000;border-bottom:2px solid var(--gb);padding:10px 12px 8px">'+
        '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:6px">'+
          // LEWA = gospodarz
          '<div style="text-align:center">'+
            '<div class="pm-crest-slot" data-cid="'+homeId+'" style="display:flex;justify-content:center;margin-bottom:4px"></div>'+
            '<div style="font-size:var(--fs-body);color:var(--gb);line-height:1.1;'+(isHome?'cursor:pointer;text-decoration:underline':'')+'" onclick="'+(isHome?'fillSquad();var sqp=document.getElementById(\'p-squad\');if(sqp){sqp.classList.add(\'open\');}':'openClubModal('+homeId+')')+'">'+
              (isHome?'⭐ ':'')+homeClub.n+
            '</div>'+
            '<div style="font-size:var(--fs-body);font-weight:800;color:var(--wh);line-height:1;margin-top:3px">'+homeS.total+
              '<span style="font-size:9px;font-weight:700;color:var(--gr);letter-spacing:.1em;margin-left:3px">OVR</span>'+
            '</div>'+
            '<div style="font-size:var(--fs-micro);color:var(--gr);margin-top:2px">'+t('match_form_label')+' '+Math.round(homeS.formRaw||75)+'%</div>'+
            '<div style="display:flex;gap:3px;justify-content:center;margin-top:5px">'+formDots(homeId)+'</div>'+
            // v228: pozycja w tabeli TEJ konkretnej drużyny — pod jej własną kolumną, nie w osobnym pasku
            '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);margin-top:4px">'+
              (isHome?t('match_you_pos').replace('{pos}',_myPos):t('match_rival_pos').replace('{pos}',_oppPos))+
            '</div>'+
          '</div>'+
          // Środek VS
          '<div style="text-align:center;padding-top:14px">'+
            '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr)">'+t('match_vs')+'</div>'+
            '<div style="font-size:var(--fs-meta);color:'+(isHome?'var(--gb)':'var(--gr)')+'">'+
              (isHome?t('match_home_tag'):t('match_away_tag'))+
            '</div>'+
          '</div>'+
          // PRAWA = gość
          '<div style="text-align:center">'+
            '<div class="pm-crest-slot" data-cid="'+awayId+'" style="display:flex;justify-content:center;margin-bottom:4px"></div>'+
            '<div style="font-size:var(--fs-body);color:var(--am);line-height:1.1;cursor:pointer;text-decoration:underline" onclick="'+(isHome?'openClubModal('+awayId+')':'fillSquad();var sqp=document.getElementById(\'p-squad\');if(sqp){sqp.classList.add(\'open\');}')+'">'+
              awayClub.n+(isHome?'':' ⭐')+
            '</div>'+
            '<div style="font-size:var(--fs-body);font-weight:800;color:var(--wh);line-height:1;margin-top:3px">'+awayS.total+
              '<span style="font-size:9px;font-weight:700;color:var(--gr);letter-spacing:.1em;margin-left:3px">OVR</span>'+
            '</div>'+
            '<div style="font-size:var(--fs-micro);color:var(--gr);margin-top:2px">'+t('match_form_label')+' '+Math.round(awayS.formRaw||75)+'%</div>'+
            '<div style="display:flex;gap:3px;justify-content:center;margin-top:5px">'+formDots(awayId)+'</div>'+
            '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);margin-top:4px">'+
              (isHome?t('match_rival_pos').replace('{pos}',_oppPos):t('match_you_pos').replace('{pos}',_myPos))+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+

      // ── v232: belka porównawcza ATK/MID/DEF — jeden pasek, podzielony na 2
      // (gospodarz|gość), nie na 2 osobne karty z paskami dla każdej drużyny.
      '<div style="padding:10px 14px 4px">'+
        statRow2('ATK',homeS.atk,awayS.atk)+
        statRow2('MID',homeS.mid,awayS.mid)+
        statRow2('DEF',homeS.def,awayS.def)+
      '</div>'+
      // Taktyka + styl obu drużyn jako zwarte plakietki (skład/słabość pokazuje
      // już baner "uzupełnij skład" nad ekranem — nie trzeba tego powtarzać tutaj)
      '<div style="display:flex;justify-content:space-between;gap:8px;padding:2px 14px 10px;border-bottom:1px solid var(--gl)">'+
        '<div style="display:flex;gap:5px;flex-wrap:wrap">'+
          '<span style="font-size:var(--fs-micro);font-weight:700;padding:2px 7px;border-radius:3px;background:var(--gm);color:var(--gr)">'+(isHome?G.formation:oppForm)+'</span>'+
          '<span style="font-size:var(--fs-micro);font-weight:700;padding:2px 7px;border-radius:3px;background:var(--gm);color:var(--gr)">'+(isHome?_styleIcon(G.style||'Zrównoważony')+' '+_styleLabel(G.style||'Zrównoważony'):_styleIcon(oppStyle)+' '+_styleLabel(oppStyle))+'</span>'+
        '</div>'+
        '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">'+
          '<span style="font-size:var(--fs-micro);font-weight:700;padding:2px 7px;border-radius:3px;background:var(--gm);color:var(--gr)">'+(isHome?oppForm:G.formation)+'</span>'+
          '<span style="font-size:var(--fs-micro);font-weight:700;padding:2px 7px;border-radius:3px;background:var(--gm);color:var(--gr)">'+(isHome?_styleIcon(oppStyle)+' '+_styleLabel(oppStyle):_styleIcon(G.style||'Zrównoważony')+' '+_styleLabel(G.style||'Zrównoważony'))+'</span>'+
        '</div>'+
      '</div>'+

      // ── POPRAWKA 5: Szanse — pasek aktualizuje się z mood ───────
      // Segmenty paska są podpisane wprost (WYGRANA/REMIS/PRZEG.), więc
      // kolor jednoznacznie odpowiada wynikowi z perspektywy gracza —
      // nie trzeba go kojarzyć z gwiazdką przy nazwie klubu w nagłówku.
      // v231: pozycja segmentów podąża za gospodarz=lewo/gość=prawo (jak reszta
      // ekranu), a nie zawsze user=lewo — kolor/etykieta nadal opisują usera.
      // v232: nazwy drużyn nad paskiem — jasne, którego zespołu dotyczy dany koniec.
      (function(){
        const myLbl=t('match_chance_win').replace('{n}',myWin);
        const oppLbl=t('match_chance_loss').replace('{n}',oppWin);
        const leftPct=isHome?myWin:oppWin, leftLbl=isHome?myLbl:oppLbl, leftBg=isHome?'var(--gb)':'var(--rd)', leftFg=isHome?'#000':'#fff';
        const rightPct=isHome?oppWin:myWin, rightLbl=isHome?oppLbl:myLbl, rightBg=isHome?'var(--rd)':'var(--gb)', rightFg=isHome?'#fff':'#000';
        return '<div style="padding:8px 12px;border-bottom:1px solid var(--gl)">'+
          '<div style="font-weight:700;font-size:var(--fs-micro);color:var(--gr);margin-bottom:4px;letter-spacing:.3px">'+t('match_chances_title')+'</div>'+
          '<div style="display:flex;justify-content:space-between;font-size:var(--fs-micro);font-weight:700;margin-bottom:3px">'+
            '<span style="color:var(--gb)">'+homeClub.n+'</span>'+
            '<span style="color:var(--am)">'+awayClub.n+'</span>'+
          '</div>'+
          '<div style="display:flex;height:20px;border-radius:1px;overflow:hidden">'+
            '<div style="flex:'+leftPct+';background:'+leftBg+';display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;font-weight:700;font-size:var(--fs-micro);color:'+leftFg+'">'+leftLbl+'</div>'+
            '<div style="flex:'+draw+';background:var(--gl);display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;font-weight:700;font-size:var(--fs-micro);color:var(--wh)">'+t('match_chance_draw').replace('{n}',draw)+'</div>'+
            '<div style="flex:'+rightPct+';background:'+rightBg+';display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;font-weight:700;font-size:var(--fs-micro);color:'+rightFg+'">'+rightLbl+'</div>'+
          '</div>'+
        '</div>';
      })()+

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

      // ── PRZYCISK TAKTYKA ──────────────────────────────────────────
      '<div style="display:flex;gap:6px;padding:7px 12px 8px">'+
        '<button onclick="fillPanel(\'p-tactics\');openPanel(\'p-tactics\');" '+
          'style="flex:1;background:var(--tb);border:1px solid var(--gl);color:var(--gb);font-size:var(--fs-meta);padding:6px;cursor:pointer">'+t('match_tactics_link')+'</button>'+
      '</div>';
    // v233: prawdziwe herby (pixelart.js::pxCrest, ten sam generator co karta klubu
    // i tabela ligowa) zamiast monogramu — hydratacja po wstawieniu innerHTML,
    // jak w club-modal.js/season-summary.js.
    if(typeof pxCrest==='function'){
      pre.querySelectorAll('.pm-crest-slot').forEach(function(sl){
        const cid=parseInt(sl.dataset.cid)||0;
        sl.appendChild(pxCrest(cid,3));
      });
    }
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
  const _lgMatch=G.schedule.find(m=>m.rnd===G.round&&!m.done&&(m.h===G.myClubId||m.a===G.myClubId));
  if(_lgMatch)return _lgMatch;
  // Brak meczu ligowego w tej kolejce (np. finał pucharu w tygodniu poza harmonogramem ligi,
  // bo sezon ligowy już się skończył) — jeśli czeka mecz pucharowy gracza, aktywuj go teraz
  // zamiast zgłaszać brak meczu (patrz też week-progress.js::finalizeSeasonEnd).
  if(G.cup&&G.cup.pendingMyMatch&&!G._cupMatchActive){
    const _pm=G.cup.pendingMyMatch;
    const _pIsH=G.cup.pendingIsMyH;
    const _oppEnt=_pIsH?_pm.a:_pm.h;
    G._cupMatchActive={match:_pm,rIdx:G.cup.pendingRound,isMyH:_pIsH,oppCid:_oppEnt.cid};
    return nextMatch();
  }
  return undefined;
}

function updateSpeedLabel(){
  // v220: pasek sterowania pokazuje mnożnik (x1/x2/x4/x10) zamiast opisowej etykiety —
  // te same progi matchSpeed co dawniej (3000/1500/500), tylko inny zapis wyniku.
  const el=document.getElementById('m-speed-mult');if(!el)return;
  if(matchSpeed<=0){el.textContent='⚡';return;}
  el.textContent=matchSpeed>=3000?'x1':matchSpeed>=1500?'x2':matchSpeed>=500?'x4':'x10';
}
function changeSpeed(delta){
  // delta > 0 = faster (reduce delay), delta < 0 = slower (increase delay)
  matchSpeed=Math.max(100,Math.min(5000,matchSpeed-delta));
  updateSpeedLabel();
}
function setMatchSpeed(ms){
  if(!matchInProgress)return;// v220: pasek sterowania zostaje widoczny po meczu — WYNIK nie może już nic zrobić
  if(ms===0)autoSubs(); // auto-zmiany przy WYNIK
  matchSpeed=ms;
  updateSpeedLabel();
}

// v222: nazwa drużyny u góry jako "chip" w tych samych barwach co jej pasek akcji w relacji
// (--am-bar/--gb-bar z style.css) — wyraźne powiązanie kolorystyczne góra↔relacja
function _teamChip(name,isMine){
  const bg=isMine?'var(--am-bar)':'var(--gb-bar)';
  const fg=isMine?'var(--am-bar-tx)':'var(--gb-bar-tx)';
  return '<span style="background:'+bg+';color:'+fg+';padding:2px 7px;border-radius:2px;display:inline-block">'+name+'</span>';
}

// v220: rozciąga relację (#mlog) na pozostałą wysokość ekranu pod paskiem sterowania/akordeonem
function _sizeMlog(){
  const lg=document.getElementById('mlog');if(!lg)return;
  const pb=lg.closest('.panel-body');if(!pb)return;
  const avail=pb.getBoundingClientRect().bottom-lg.getBoundingClientRect().top;
  lg.style.height=Math.max(160,Math.round(avail))+'px';
}

// v220: odświeża akordeon (żółte kartki) i zakładkę BOISKO na żywo — wołane z upUI() w match-engine.js
// co każde zdarzenie. Nie liczy wyniku meczu — tylko czyta liveStats/allEvts/ratings i renderuje
// istniejącymi funkcjami (renderRatingsPitch z match-post.js), tak jak robi to postMatch() po meczu.
function _refreshLiveBoisko(min){
  _sizeMlog();
  if(!G||!matchInProgress||!window._liveRatings)return;
  const isMyH=!!window._liveIsMyH;
  const evsSoFar=(typeof allEvts!=='undefined'?allEvts:[]).filter(e=>e.min<=min);
  const _s=id=>document.getElementById(id);
  // Skrót posiadania w nagłówku akordeonu
  const _accSum=_s('acc-summary');
  if(_accSum&&typeof liveStats!=='undefined'){
    const hAct=liveStats.hAct||0,aAct=liveStats.aAct||0;
    if(hAct+aAct>0){
      const rawPoss=hAct/(hAct+aAct+1);
      const hp=Math.max(25,Math.min(75,Math.round(rawPoss*100)));
      _accSum.textContent=t('match_possession')+' '+hp+'% / '+(100-hp)+'%';
    }
  }
  // Żółte/czerwone kartki dotychczas (podział gospodarz/gość, jak reszta akordeonu)
  let hY=0,aY=0;
  evsSoFar.forEach(e=>{
    if(e.type==='yellow'||e.type==='red'||e.type==='red2y'){
      if(e.isMy===isMyH)hY++;else aY++;
    }
  });
  if(hY+aY>0){const _yr=_s('ls-yellow-row');if(_yr)_yr.style.display='flex';}
  if(_s('ls-yellow-h'))_s('ls-yellow-h').textContent=hY;
  if(_s('ls-yellow-a'))_s('ls-yellow-a').textContent=aY;
  if(_s('ls-yellow-bar-h'))_s('ls-yellow-bar-h').style.flex=hY||1;
  if(_s('ls-yellow-bar-a'))_s('ls-yellow-bar-a').style.flex=aY||1;
  // BOISKO na żywo — te same karty co po meczu (renderRatingsPitch), tylko z ocenami "w toku"
  if(typeof m_hId==='undefined'||typeof m_aId==='undefined')return;
  const _myId=G.myClubId,_oppId=m_hId===_myId?m_aId:m_hId;
  const _myPls=G.players.filter(p=>p.clubId===_myId&&window._liveRatings[p.id]!==undefined);
  const _oppPls=G.players.filter(p=>p.clubId===_oppId&&window._liveRatings[p.id]!==undefined);
  const _allLive=[..._myPls,..._oppPls];
  const _liveMom=_allLive.reduce((best,p)=>(!best||window._liveRatings[p.id].rating>window._liveRatings[best.id].rating)?p:best,null);
  const _liveMomId=_liveMom?_liveMom.id:null;
  if(isMyH){
    renderRatingsPitch(_myPls,window._liveRatings,'m-rat-home',_liveMomId,evsSoFar);
    renderRatingsPitch(_oppPls,window._liveRatings,'m-rat-away',_liveMomId,evsSoFar);
  } else {
    renderRatingsPitch(_oppPls,window._liveRatings,'m-rat-home',_liveMomId,evsSoFar);
    renderRatingsPitch(_myPls,window._liveRatings,'m-rat-away',_liveMomId,evsSoFar);
  }
}

// v228: EKRAN PODSUMOWANIA MECZU — przycisk "WRÓĆ" w nagłówku panelu meczu (#btn-match-back)
// po zakończeniu meczu zamiast od razu zamykać panel (closePanel('p-match')) otwiera ten ekran.
// window._lastMatchSummary jest ustawiane przez postMatch() (match-post.js) — obecność tego
// obiektu to sygnał "mecz właśnie się skończył, jeszcze nie kliknięto DALEJ".
function matchBackBtnClick(){
  if(window._lastMatchSummary){openMatchSummary();return;}
  closePanel('p-match');
}
function openMatchSummary(){
  const s=window._lastMatchSummary;if(!s)return;
  const _s=id=>document.getElementById(id);
  // v231: lewa strona = gospodarz, prawa = gość — zgodnie z analizą przedmeczową,
  // scorebarem live i zakładką BOISKO (patrz match-post.js::postMatch, isHome=_myIsH).
  const isHome=s.isHome;
  const leftName=isHome?s.myClubName:s.oppClubName, rightName=isHome?s.oppClubName:s.myClubName;
  const leftGoals=isHome?s.myGoals:s.oppGoals, rightGoals=isHome?s.oppGoals:s.myGoals;
  const leftScorers=isHome?s.myScorers:s.oppScorers, rightScorers=isHome?s.oppScorers:s.myScorers;
  const myNameEl=_s('ms-my-name'),oppNameEl=_s('ms-opp-name');
  if(myNameEl)myNameEl.innerHTML=_teamChip(leftName,isHome);
  if(oppNameEl)oppNameEl.innerHTML=_teamChip(rightName,!isHome);
  const scoreEl=_s('ms-score');if(scoreEl)scoreEl.textContent=leftGoals+' - '+rightGoals;
  const resTxt=s.iW?t('mp_result_win'):s.iL?t('mp_result_lose'):t('mp_result_draw');
  const resCol=s.iW?'var(--gb)':s.iL?'var(--rd)':'var(--wh)';
  const rl=_s('ms-result-label');if(rl){rl.textContent=resTxt;rl.style.color=resCol;}

  const commentEl=_s('ms-comment');if(commentEl)commentEl.textContent='💬 '+s.comment;

  const myLbl=_s('ms-scorers-my-label'),oppLbl=_s('ms-scorers-opp-label');
  if(myLbl)myLbl.textContent='⚽ '+leftName;
  if(oppLbl)oppLbl.textContent='⚽ '+rightName;
  function _scorersHtml(list){
    if(!list||!list.length)return '<div style="font-size:var(--fs-meta);color:var(--gr)">—</div>';
    return list.map(function(g){
      // v229: nazwisko strzelca klikalne — otwiera kartę zawodnika (jak MVP), powrót na ten
      // ekran już obsługuje _captureReturnPoint() (rozpoznaje v-match-summary jako .view).
      const nameHtml=g.id?'<span style="cursor:pointer;text-decoration:underline" onclick="showById('+g.id+')">'+g.name+'</span>':g.name;
      return '<div style="display:flex;justify-content:space-between;font-size:var(--fs-meta);padding:3px 0;border-bottom:1px solid #0d1f0d">'+
        '<span style="color:var(--am);font-weight:700;width:30px;flex-shrink:0">'+g.min+'\'</span>'+nameHtml+'</div>';
    }).join('');
  }
  const myScEl=_s('ms-scorers-my'),oppScEl=_s('ms-scorers-opp');
  if(myScEl)myScEl.innerHTML=_scorersHtml(leftScorers);
  if(oppScEl)oppScEl.innerHTML=_scorersHtml(rightScorers);

  function _deltaHtml(v,suffix){
    const sign=v>0?'▲ +':v<0?'▼ ':'— ';
    const col=v>0?'var(--gb)':v<0?'var(--rd)':'var(--gr)';
    return '<span style="color:'+col+'">'+sign+v+(suffix||'')+'</span>';
  }
  const repEl=_s('ms-rep-delta'),freqEl=_s('ms-freq-delta');
  if(repEl)repEl.innerHTML=_deltaHtml(s.repDelta||0,'');
  if(freqEl)freqEl.innerHTML=_deltaHtml(s.freqDelta||0,'%');

  const faceEl=_s('ms-mvp-face'),kitEl=_s('ms-mvp-kit'),nameEl=_s('ms-mvp-name'),
    metaEl=_s('ms-mvp-meta'),ratEl=_s('ms-mvp-rating'),statsEl=_s('ms-mvp-stats');
  if(s.mvp){
    if(faceEl){faceEl.innerHTML='';if(typeof pxFace==='function')faceEl.appendChild(pxFace(s.mvp.id,5,s.mvp.age));}
    if(kitEl){kitEl.innerHTML='';if(typeof pxKit==='function'&&s.mvp.clubId>0)kitEl.appendChild(pxKit(s.mvp.clubId,s.mvp.jerseyNum||0,3));}
    if(nameEl){nameEl.textContent=s.mvp.name;nameEl.onclick=function(){showById(s.mvp.id);};}
    if(metaEl)metaEl.textContent=(POS_SHORT[s.mvp.pos]||s.mvp.pos)+' · '+s.mvp.clubName;
    if(ratEl)ratEl.textContent=s.mvp.rating.toFixed(1);
    if(statsEl)statsEl.textContent=s.mvp.goals+' '+t('ms_goals_label')+' · '+s.mvp.assists+' '+t('ms_assists_label');
  }

  closePanel('p-match');
  go('v-match-summary');
}
function continueFromMatchSummary(){
  window._lastMatchSummary=null;
  _releaseMatchLock();
  // v230: dublet liga+puchar — po podsumowaniu meczu ligowego (zamiast od razu wracać
  // do v-game) aktywuj analizę przedmeczową pucharu, przeniesione z dawnego
  // setTimeout(800) w match-engine.js. Kronika NIE flushuje się tutaj — gracz jeszcze
  // nie opuszcza realnie ekranu meczu, tylko przechodzi do jego drugiej połowy.
  const _pct=window._pendingCupTransition;
  if(_pct){
    window._pendingCupTransition=null;
    notif(t('match_cup_next_notif').replace('{opp}',_pct.oppName),'ok');
    matchInProgress=false;
    fillMatch();
    openPanel('p-match');
    _engageMatchLock('prematch');
    saveGame('lock',true);
    return;
  }
  go('v-game');
  // v230: dopiero teraz gracz realnie opuszcza ekran meczu — patrz kronika.js::kronTrigger()
  if(typeof flushPendingKronEvent==='function')flushPendingKronEvent();
}
