function kronShowModal(ev, resolvedBody){
  const modal=document.getElementById('modal-kronika');
  if(!modal)return;
  document.getElementById('kron-category').textContent=ev.category||'WYDARZENIE';
  document.getElementById('kron-title').textContent=ev.title;
  document.getElementById('kron-body').innerHTML=resolvedBody||ev.body;
  const chEl=document.getElementById('kron-choices');
  chEl.innerHTML='';
  ev.choices.forEach(function(ch,idx){
    const btn=document.createElement('button');
    btn.style.cssText='width:100%;background:'+(idx===0?'var(--gm)':idx===1?'#0a1a0a':'#100808')+';border:none;border-top:1px solid var(--gl);color:var(--wh);font-size:var(--fs-dense);padding:12px 14px;cursor:pointer;text-align:left;line-height:1.6';
    btn.innerHTML='<span style="color:var(--am);font-weight:700;font-size:var(--fs-micro)">['+(idx===0?'A':idx===1?'B':'C')+']</span> '+ch.label;
    btn.onclick=function(){
      modal.style.display='none';
      try{ch.effect();}catch(e){console.warn('Kronika effect error:',e);}
      const outcome=ch.outcome?ch.outcome():'';
      if(outcome){
        addNews('📰 '+ev.title+': '+outcome,'club');
        notif(outcome.slice(0,60),'ok');
      }
      if(KRON_TIMELINE_WORTHY.indexOf(ev.id)!==-1)
        pushTimeline('kronika_'+ev.id,'📰',ev.title+(outcome?' — '+outcome:''),{sentiment:'neutral',weight:25});
      if(idx===2&&KRON_IGNORED_WORTHY.indexOf(ev.id)!==-1)
        pushTimeline('kronika_ignored_'+ev.id,'😠',t('tl_crisis_ignored').replace('{title}',ev.title),{sentiment:'neg',weight:30});
      renderNews();updateHdr();
    };
    chEl.appendChild(btn);
  });
  modal.style.display='flex';
}

// ══════════════════════════════════════════════════════════════════════════
// PAMIĘĆ KIBICÓW — rzadkie, niezależne callbacki do milestone'ów z przeszłości
// ══════════════════════════════════════════════════════════════════════════
function fanMemoryTrigger(){
  if(!G||!G.fanMemory||G.seasonEnded||G.week<4)return;
  if(G.fanMemory.cooldown>0){G.fanMemory.cooldown--;return;}
  if(!G.timeline||!G.timeline.length)return;
  if(Math.random()>0.04)return; // ~4% szansy na tydzień
  var recalled=G.fanMemory.recalled||(G.fanMemory.recalled=[]);
  var eligible=G.timeline.filter(function(tl){
    return (G.season-tl.season)>=2&&recalled.indexOf(tl.id)===-1;
  });
  if(!eligible.length)return;
  var totalW=eligible.reduce(function(s,tl){return s+(tl.weight||15);},0);
  var r2=Math.random()*totalW;
  var chosen=null;
  for(var i=0;i<eligible.length;i++){
    r2-=(eligible[i].weight||15);
    if(r2<=0){chosen=eligible[i];break;}
  }
  if(!chosen)chosen=eligible[eligible.length-1];
  recalled.push(chosen.id);
  G.fanMemory.cooldown=3; // min. 3 tygodnie przerwy między callbackami
  var tplKey;
  if(chosen.sentiment==='neg')tplKey=pick(['tl_recall_neg1','tl_recall_neg2']);
  else if(chosen.sentiment==='pos')tplKey=pick(['tl_recall_pos1','tl_recall_pos2']);
  else tplKey='tl_recall_neutral';
  var seasonsAgo=G.season-chosen.season;
  var msg=t(tplKey).replace('{label}',chosen.label).replace('{n}',seasonsAgo);
  addNews(msg,'club');
  notif(msg.slice(0,60),'ok');
}

function kronTrigger(){
  if(!G||!G.kronika||G.seasonEnded||G.week<4)return;
  if(G.kronika.cooldown>0){G.kronika.cooldown--;return;}
  const kron=G.kronika;
  const my=myPl();
  const starters=my.filter(function(p){return p.starter&&!p.injured;});
  const bestP=starters.sort(function(a,b){return ovr(b)-ovr(a);})[0];
  const benchNoGame=my.filter(function(p){return !p.starter&&!p.injured&&(p._benchWeeks||0)>=4;});
  const recentInjCount=(kron.flags._injCount||0);
  const cupActive=!!(G._cupMatchActive||G.cupRound);

  // ── DEFINICJE EVENTÓW ──────────────────────────────────────────────────
  var KRON_EVENTS=[

    // K-01: Gwiazda przed finałem Pucharu
    {id:'k01_star_cup', category:'🏆 PUCHAR',
     weight:function(){return (cupActive&&bestP&&ovr(bestP)>=65)?30:0;},
     title:'Gwiazda przed wielkim meczem',
     body:function(){return (bestP?bestP.name:'Twój najlepszy zawodnik')+' skręcił kostkę na treningu tuż przed pucharowym starciem. Lekarz prosi o decyzję.';},
     choices:[
       {label:'Ryzykujesz — wchodzi do składu (60% OK, 20% pogłębienie)',
        effect:function(){
          if(!bestP)return;
          const r2=Math.random();
          if(r2<0.60){bestP.form=Math.max(30,(bestP.form||80)-8);}
          else if(r2<0.80){applyInjury(bestP,true);}
          else{bestP.form=Math.max(20,(bestP.form||80)-20);}
        },
        outcome:function(){
          if(!bestP)return 'Ryzyko podjęte.';
          if(bestP.injured)return bestP.name+' doznał urazu ('+bestP.injuryType+', '+(bestP.injuryWeeks||'?')+' tyg.). Zły zakład.';
          if((bestP.form||80)<50)return bestP.name+' zagrał z bólem. Forma mocno spadła ('+bestP.form+'%).';
          return bestP.name+' zagrał z bólem. Forma: '+bestP.form+'%.';
        }},
       {label:'Oszczędzasz go — siada na ławce',
        effect:function(){if(bestP){bestP.starter=false;}},
        outcome:function(){return (bestP?bestP.name:'Zawodnik')+' zostaje na ławce. Skład wymaga korekty przed meczem.';}},
       {label:'Iniekcja znieczulająca ($8 000)',
        effect:function(){
          if(G.budget<8000){notif('Brak budżetu na iniekcję!','err');return;}
          G.budget-=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:8000,bal:G.budget,season:G.season,note:'Kronika: iniekcja znieczulająca'});
          if(bestP){bestP._injectPenalty=2;}
        },
        outcome:function(){
          if(!bestP)return 'Brak zawodnika.';
          if(!bestP._injectPenalty)return 'Brak budżetu — iniekcja niewykonana!';
          return bestP.name+' zagra. Koszt: 8 000 zł. Przez 2 kolejki po meczu forma będzie obniżona.';
        }}
     ]},

    // K-02: Seria kontuzji — klątwa
    {id:'k02_injury_streak', category:'🏥 ZDROWIE',
     weight:function(){return recentInjCount>=3?35:0;},
     title:'Klątwa kontuzji',
     body:function(){return 'W ciągu ostatnich kilku tygodni '+recentInjCount+' zawodników wypadło z gry. Szatnia mówi o "klątwie". Sztab medyczny czeka na decyzję.';},
     choices:[
       {label:'Zatrudnij fizjoterapeutę ($15 000)',
        effect:function(){
          if(G.budget<15000){notif('Brak budżetu!','err');return;}
          G.budget-=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:15000,bal:G.budget,season:G.season,note:'Kronika: fizjoterapeuta'});kron.flags._physioHired=true;kron.flags._injCount=0;
        },
        outcome:function(){
          if(!kron.flags._physioHired)return 'Brak budżetu — fizjoterapeuta niezatrudniony!';
          return 'Fizjoterapeuta zatrudniony. Budżet: -15 000 zł. Ryzyko kontuzji zredukowane do końca sezonu.';
        }},
       {label:'Zmień plan treningowy (forma -3 każdy)',
        effect:function(){
          my.forEach(function(p){p.form=Math.max(40,(p.form||80)-3);});
          kron.flags._injCount=0;
        },
        outcome:function(){return 'Plan treningowy złagodzony. '+my.length+' zawodników straciło 3% formy. Ryzyko kontuzji spada.';}},
       {label:'Ignorujesz — to przypadek',
        effect:function(){kron.flags._injPenaltyActive=true;},
        outcome:function(){return 'Trening bez zmian. Aktywna flaga — kolejna kontuzja potrwa dłużej.';}},
     ]},

    // K-03: Zawodnik ukrywa uraz
    {id:'k03_hidden_injury', category:'🏥 ZDROWIE',
     weight:function(){
       const c=starters.filter(function(p){return (p.form||80)<55&&!p.injured;});
       return c.length>=1?25:0;
     },
     title:'Ukrywany uraz',
     body:function(){
       const c=starters.filter(function(p){return (p.form||80)<55&&!p.injured;});
       const t=c[0];
       kron.flags._k03pid=t?t.id:-1;
       return (t?t.name:'Zawodnik')+' od kilku tygodni trenuje z widocznym bólem, ale milczy. Scout zgłasza podejrzenia.';
     },
     choices:[
       {label:'Rozmawiasz z nim — szczera rozmowa',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          if(t){t.injured=true;t.injuryWeeks=1;t.injuryType='Lekka';t.starter=false;addNews(t.name+' przyznał się do urazu — 1 tydzień przerwy.','inj');}
        },
        outcome:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          return t?t.name+' przyznał się. 1 tydzień przerwy — forma po powrocie będzie pełna.':'Zawodnik przyznał się do urazu.';
        }},
       {label:'Wpisujesz na listę chorych bez pytania',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          if(t){t.injured=true;t.injuryWeeks=2;t.injuryType='Lekka';t.starter=false;t.form=Math.max(20,(t.form||50)-10);addNews(t.name+' trafił na listę chorych.','inj');}
        },
        outcome:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          return t?t.name+' na liście chorych (2 tyg.). Forma -10, ale urazu się nie pogłębi.':'Zawodnik na liście chorych.';
        }},
       {label:'Zostawiasz go — sam zdecyduje',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          if(t&&Math.random()<0.40){applyInjury(t,false);}
        },
        outcome:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._k03pid;});
          if(!t)return 'Decyzja podjęta.';
          if(t.injured)return t.name+' doznał kontuzji ('+t.injuryType+', '+t.injuryWeeks+' tyg.). Ryzyko się zmaterializowało.';
          return t.name+' gra dalej. Tym razem się udało — ale ryzyko wróci.';
        }},
     ]},

    // S-01: Skandal — nocna impreza
    {id:'s01_party_scandal', category:'😤 SZATNIA',
     weight:function(){return (G.round>3&&starters.length>=8)?20:0;},
     title:'Nocna impreza',
     body:function(){
       const picks=starters.slice().sort(function(){return Math.random()-0.5;}).slice(0,3);
       kron.flags._s01pids=picks.map(function(p){return p.id;});
       return 'Tabloid donosi: '+picks.map(function(p){return p.name.split(' ')[1];}).join(', ')+' bawili się do 3 w nocy przed meczem. Kibice żądają reakcji.';
     },
     choices:[
       {label:'Karzesz publicznie ($2 000 każdy, forma -8)',
        effect:function(){
          (kron.flags._s01pids||[]).forEach(function(id){
            const p=G.players.find(function(x){return x.id===id;});
            if(p){p.form=Math.max(20,(p.form||80)-8);G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:'Kronika: nocna impreza (mandat)'});}
          });
          G.reputation=Math.min(1000,(G.reputation||30)+5);
        },
        outcome:function(){
          const names=(kron.flags._s01pids||[]).map(function(id){const p=G.players.find(function(x){return x.id===id;});return p?p.name.split(' ')[1]:'?';}).join(', ');
          const total=(kron.flags._s01pids||[]).length*2000;
          return names+' ukarani. Budżet: -'+fmtVal(total)+'. Reputacja +5.';
        }},
       {label:'Rozmawiasz prywatnie — bez kary publicznej',
        effect:function(){
          (kron.flags._s01pids||[]).forEach(function(id){
            const p=G.players.find(function(x){return x.id===id;});
            if(p)p.form=Math.max(30,(p.form||80)-3);
          });
        },
        outcome:function(){
          const names=(kron.flags._s01pids||[]).map(function(id){const p=G.players.find(function(x){return x.id===id;});return p?p.name.split(' ')[1]:'?';}).join(', ');
          return 'Rozmowa z '+names+'. Forma -3, brak kary finansowej.';
        }},
       {label:'Ignorujesz — bo co tam',
        effect:function(){kron.flags._s01canRepeat=true;},
        outcome:function(){return 'Brak reakcji. Mogą spróbować znowu...';}},
     ]},

    // S-04: Zawodnik żąda więcej gry
    {id:'s04_bench_protest', category:'😤 SZATNIA',
     weight:function(){return benchNoGame.length>0?25:0;},
     title:'Protest rezerwowego',
     body:function(){
       const t=benchNoGame.sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._s04pid=t?t.id:-1;
       return (t?t.name:'Zawodnik')+' (OVR '+(t?ovr(t):'?')+') nie gra od ponad miesiąca. Agent zgłosił niezadowolenie i żąda miejsca w składzie.';
     },
     choices:[
       {label:'Dajesz mu miejsce w składzie',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          if(t){t.starter=true;t._benchWeeks=0;notif(t.name+' wraca do składu!','ok');}
        },
        outcome:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          return t?t.name+' wraca do składu. Bench weeks zresetowane.':'Zawodnik wraca do składu.';
        }},
       {label:'Tłumaczysz sytuację taktyczną',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          if(t)t.form=Math.max(30,(t.form||80)-5);
          // Za 4 tygodnie może wrócić event
          kron.flags._s04repeatWeek=(G.round||1)+4;
        },
        outcome:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          return t?t.name+' wysłuchał. Forma: '+(t.form||'?')+'%. Event może wrócić za 4 kolejki.':'Tymczasowa cisza.';
        }},
       {label:'Wystawiasz go na sprzedaż',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          if(t)setTimeout(function(){openSellModal(t.id);},400);
        },
        outcome:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._s04pid;});
          return (t?t.name:' Zawodnik')+' wystawiony na sprzedaż. Otwarto panel sprzedaży.';
        }},
     ]},

    // T-01: Oferta z wyższej ligi
    {id:'t01_big_offer', category:'💰 TRANSFERY',
     weight:function(){return (bestP&&ovr(bestP)>=60&&(G.myLeague||8)>=3)?30:0;},
     title:'Oferta z wyższej ligi',
     body:function(){
       const val=bestP?Math.round((bestP.value||50000)*1.30/1000)*1000:0;
       kron.flags._t01pid=bestP?bestP.id:-1;
       kron.flags._t01val=val;
       return 'Klub z wyższej ligi składa oficjalną ofertę za '+(bestP?bestP.name:'Twojego najlepszego zawodnika')+'. Proponowana kwota: '+fmtVal(val)+'. Zarząd czeka na decyzję.';
     },
     choices:[
       {label:'Sprzedajesz — bierzesz kasę',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          if(t){
            const val=kron.flags._t01val||0;
            G.budget+=val;
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'sell',name:t.name,val:val,week:G.week,season:G.season});
            addNews('[Transfer] '+t.name+' sprzedany za '+fmtVal(val)+'.','budget');
            t.clubId=0;t.starter=false;t.status='freeAgent';t.isFreeAgent=true;
            G.players=G.players.filter(function(p){return p.id!==t.id;});
            if(!G.fa)G.fa=[];G.fa.push(t);
          }
        },
        outcome:function(){return 'Sprzedany za '+fmtVal(kron.flags._t01val||0)+'.';}},
       {label:'Odrzucasz ofertę — zostaje z wami',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          if(t)t.form=Math.max(40,(t.form||80)-8); // niezadowolony
        },
        outcome:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          return (t?t.name:' Zawodnik')+' zostaje. Forma: '+(t?t.form:'?')+'% — jest niezadowolony.';
        }},
       {label:'Negocjujesz — próbujesz wyciągnąć 150%',
        effect:function(){
          const t=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          if(Math.random()<0.70){
            const val2=Math.round((kron.flags._t01val||0)*1.15/1000)*1000;
            if(t){
              G.budget+=val2;
              addNews('[Transfer] Negocjacje udane! '+t.name+' sprzedany za '+fmtVal(val2)+'.','budget');
              t.clubId=0;t.starter=false;t.status='freeAgent';t.isFreeAgent=true;
              G.players=G.players.filter(function(p){return p.id!==t.id;});
              if(!G.fa)G.fa=[];G.fa.push(t);
              kron.flags._t01val=val2;
            }
          } else {
            addNews('[Transfer] Klub wycofał ofertę po negocjacjach.','budget');
            if(t)t.form=Math.max(35,(t.form||80)-5);
          }
        },
        outcome:function(){
          const stillHere=G.players.find(function(p){return p.id===kron.flags._t01pid;});
          if(!stillHere)return 'Negocjacje udane! Sprzedany za '+fmtVal(kron.flags._t01val||0)+'.';
          return 'Klub wycofał ofertę. Zawodnik zostaje, ale jest niezadowolony.';
        }},
     ]},

    // T-04: Lokalny talent puka do drzwi
    {id:'t04_local_talent', category:'💰 TRANSFERY',
     weight:function(){return (my.length<24&&G.round>2)?20:0;},
     title:'Lokalny talent',
     body:function(){
       const pos=pick(['NAP','POL','OBR']);
       const ageT=17+Math.floor(Math.random()*3);
       const ovrT=38+Math.floor(Math.random()*8);
       kron.flags._t04pos=pos;kron.flags._t04age=ageT;kron.flags._t04ovr=ovrT;
       return ageT+'-letni '+(pos==='NAP'?'napastnik':pos==='POL'?'pomocnik':'obrońca')+' z lokalnej drużyny sam zgłosił się na trening. OVR ~'+ovrT+', potencjał nieznany. Chce spróbować.';
     },
     choices:[
       {label:'Dajesz mu szansę — darmowy transfer',
        effect:function(){
          const pos2=kron.flags._t04pos||'POL';
          const ageT2=kron.flags._t04age||18;
          const ovrT2=kron.flags._t04ovr||42;
          const np=mkPlayer(G.myClubId);
          np.pos=pos2;np.age=ageT2;
          const diff=ovrT2-ovr(np);
          if(diff>0){const attrs=['tec','pas','sht','def','phy','men'];attrs.forEach(function(a){np[a]=Math.min(99,np[a]+Math.ceil(diff/6));});}
          np.contract=1;np.salary=calcSalary(np.value,G.myLeague||8,ovr(np));
          np.potential=calcPotential(np,G.myLeague||8);
          np.status='active';np.isFreeAgent=false;
          np.history=[{season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'?',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(np),avgRat:null,_current:true}];
          G.players.push(np);
          addNews('[Transfer] '+np.name+' ('+pos2+', '+ageT2+'l) dołączył do klubu za darmo!','budget');
        },
        outcome:function(){
          const np=myPl().filter(function(p){return p.contract===1&&!p.fromAcademy;}).sort(function(a,b){return b.id-a.id;})[0];
          return np?np.name+' ('+np.pos+', '+np.age+'l, OVR '+ovr(np)+') dołączył za darmo. Kontrakt: 1 sezon.':'Nowy zawodnik w składzie.';
        }},
       {label:'Odsyłasz do akademii (+5 OVR start)',
        effect:function(){
          if(!G.academy||G.academy.level<1){notif('Brak akademii — nie można odesłać!','err');return;}
          const pos2=kron.flags._t04pos||'POL';
          const ageT2=kron.flags._t04age||18;
          const ovrT2=(kron.flags._t04ovr||42)+5;
          const np=mkPlayer(0);
          np.pos=pos2;np.age=ageT2;
          const attrs=['tec','pas','sht','def','phy','men'];
          const diff=ovrT2-ovr(np);
          if(diff>0)attrs.forEach(function(a){np[a]=Math.min(99,np[a]+Math.ceil(diff/6));});
          np.potential=Math.min(99,calcPotential(np,G.myLeague||8)+5);
          np.fromAcademy=true;np.clubId=G.myClubId;
          if(!G.academy.prospects)G.academy.prospects=[];
          G.academy.prospects.push(np);
          addNews('[Akademia] '+np.name+' trafił do akademii z bonusem +5 OVR!','academy');
        },
        outcome:function(){
          const np=(G.academy&&G.academy.prospects||[]).slice(-1)[0];
          return np?np.name+' ('+np.pos+', Pot:'+np.potential+') w akademii z bonusem +5 potencjału.':'Talent trafił do akademii.';
        }},
       {label:'Ignorujesz — nie ma miejsca',
        effect:function(){
          const pos2=kron.flags._t04pos||'POL';
          const np=mkPlayer(0);np.pos=pos2;
          if(!G.fa)G.fa=[];G.fa.push(np);
        },
        outcome:function(){return 'Zawodnik odszedł. Może trafić do rywala.';}},
     ]},

    // M-01: Sponsor chce nazwy na stadionie
    {id:'m01_stadium_sponsor', category:'🏟️ KLUB',
     weight:function(){return (G.season>=2&&(G.reputation||0)>=80&&!kron.flags._stadSponsorDone)?15:0;},
     title:'Sponsor nazwy stadionu',
     body:function(){return 'Firma "ProSport Solutions" składa propozycję: 50 000 zł za prawo do nazwy stadionu przez sezon. Kibice mogą być niezadowoleni.';},
     choices:[
       {label:'Przyjmujesz — 50 000 zł do kasy',
        effect:function(){
          G.budget+=50000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:50000,cost:0,bal:G.budget,season:G.season,note:'Kronika: sponsor stadionu'});G.reputation=Math.max(0,(G.reputation||30)-15);
          kron.flags._stadSponsorDone=true;
          addNews('[Sponsor] ProSport Solutions na tablicy stadionu. +50 000 zł, reputacja -15.','budget');
        },
        outcome:function(){return '+50 000 zł (budżet: '+fmtVal(G.budget)+'). Reputacja: '+(G.reputation||0)+' (-15).';}},
       {label:'Odrzucasz — stadion zostaje wasz',
        effect:function(){G.reputation=Math.min(1000,(G.reputation||30)+5);kron.flags._stadSponsorDone=true;},
        outcome:function(){return 'Oferta odrzucona. Reputacja: '+(G.reputation||0)+' (+5). Kibice zadowoleni.';}},
       {label:'Negocjujesz — koszulki zamiast stadionu (30 000 zł)',
        effect:function(){
          kron.flags._m01budgetBefore=G.budget;
          if(Math.random()<0.70){G.budget+=30000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:30000,cost:0,bal:G.budget,season:G.season,note:'Kronika: umowa sponsorska (koszulki)'});addNews('[Sponsor] Umowa na koszulki: +30 000 zł.','budget');}
          else{addNews('[Sponsor] Firma odrzuciła kontrpropozycję.','club');}
          kron.flags._stadSponsorDone=true;
        },
        outcome:function(){
          const gotMoney=G.budget>=(kron.flags._m01budgetBefore||0)+25000;
          return gotMoney?'+30 000 zł za umowę koszulkową (budżet: '+fmtVal(G.budget)+'). Bez kary reputacji.':'Firma odrzuciła kontrpropozycję. Brak przychodu.';
        }},
     ]},

    // SP-05: Sędzia popełnił błąd
    {id:'sp05_ref_error', category:'⚽ SPORTOWE',
     weight:function(){
       const lastM=G.mHist&&G.mHist.length?G.mHist[G.mHist.length-1]:null;
       if(!lastM)return 0;
       const myStr=tStr(G.myClubId);
       const oppStr=lastM.isMyH?tStr(lastM.an?((G.leagues||[]).flatMap(l=>l.clubs||[]).find(c=>c.n===lastM.an)||{id:0}).id:0):tStr(lastM.hn?((G.leagues||[]).flatMap(l=>l.clubs||[]).find(c=>c.n===lastM.hn)||{id:0}).id:0);
       const lost=(lastM.isMyH?(lastM.hg<lastM.ag):(lastM.ag<lastM.hg));
       return (lost&&myStr>oppStr+8)?28:0;
     },
     title:'Kontrowersyjna decyzja sędziego',
     body:function(){
       const lastM=G.mHist&&G.mHist.length?G.mHist[G.mHist.length-1]:null;
       return 'Analiza wideo ostatniego meczu '+(lastM?'('+lastM.hn+' vs '+lastM.an+')':'')+' potwierdza: sędzia popełnił oczywisty błąd, który kosztował was punkty. Prasa pyta o stanowisko.';
     },
     choices:[
       {label:'Oficjalna skarga do związku (ryzyko kary)',
        effect:function(){
          kron.flags._sp05budgetBefore=G.budget;kron.flags._sp05repBefore=G.reputation||30;
          if(Math.random()<0.30){G.reputation=Math.min(1000,(G.reputation||30)+10);addNews('[Skarga] Związek przyznał rację! Reputacja +10.','ok');}
          else{G.budget=Math.max(0,G.budget-3000);addNews('[Skarga] Skarga odrzucona. Kara: 3 000 zł za "atak na sędziego".','err');}
        },
        outcome:function(){
          const repGrew=(G.reputation||0)>(kron.flags._sp05repBefore||0);
          return repGrew?'Związek przyznał rację! Reputacja +10 (teraz: '+(G.reputation||0)+').':'Skarga odrzucona. Kara: -3 000 zł (budżet: '+fmtVal(G.budget)+').';
        }},
       {label:'Kampania medialna — prasa po waszej stronie',
        effect:function(){G.reputation=Math.min(1000,(G.reputation||30)+5);},
        outcome:function(){return 'Media nagłośniły sprawę. Reputacja: '+(G.reputation||0)+' (+5). Wynik meczu bez zmian.';}},
       {label:'Milczysz — szatnia cię szanuje za spokój',
        effect:function(){
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+2);});
        },
        outcome:function(){return 'Spokój i klasa. '+starters.length+' zawodników z formy +2. Szatnia szanuje decyzję.';}},
     ]},

    // SP-01: Tajemniczy skaut na treningu
    {id:'sp01_mystery_scout', category:'⚽ SPORTOWE',
     weight:function(){
       const w=my.filter(function(p){return p.fromAcademy&&ovr(p)>=52;});
       return w.length>=1?20:0;
     },
     title:'Tajemniczy skaut na treningu',
     body:function(){
       const w=my.filter(function(p){return p.fromAcademy&&ovr(p)>=52;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._sp01pid=w?w.id:-1;
       return 'Na trybunach treningowych siedzi nieznajomy z notatnikiem. Agent twierdzi, że to skaut z wyższej ligi, zainteresowany '+(w?w.name:'Twoim wychowankiem')+' (OVR '+(w?ovr(w):'?')+').';
     },
     choices:[
       {label:'Zapraszasz go — bezpośredni kontakt',
        effect:function(){
          kron.flags._sp01offerWeek=(G.round||1)+2;
          addNews('[Skaut] Tajemniczy skaut umówiony na rozmowę. Oferta może nadejść za 2 kolejki.','scout');
        },
        outcome:function(){return 'Kontakt nawiązany. Czekaj na ofertę.';}},
       {label:'Prosisz o odejście — chronisz taktykę',
        effect:function(){},
        outcome:function(){return 'Skaut opuścił trening. Informacje taktyczne bezpieczne.';}},
       {label:'Ignorujesz — sam zdecyduje',
        effect:function(){
          if(Math.random()<0.40){
            const t=G.players.find(function(p){return p.id===kron.flags._sp01pid;});
            if(t){
              const offerVal=Math.round((t.value||30000)*1.20/1000)*1000;
              kron.flags._sp01autoOffer={pid:t.id,val:offerVal};
              addNews('[Transfer] Niezapowiedziana oferta: '+fmtVal(offerVal)+' za '+t.name+'. Sprawdź transfery!','budget');
            }
          }
        },
        outcome:function(){
          if(kron.flags._sp01autoOffer){
            const t=G.players.find(function(p){return p.id===kron.flags._sp01autoOffer.pid;});
            return (t?t.name:'Zawodnik')+': niezapowiedziana oferta '+fmtVal(kron.flags._sp01autoOffer.val)+' w newsach!';
          }
          return 'Skaut odszedł bez kontaktu. Tym razem nic się nie wydarzyło.';
        }},
     ]},

    // K-07: Nagroda — mecz towarzyski za granicą
    {id:'sp06_friendly_abroad', category:'⚽ SPORTOWE',
     weight:function(){return (G.round>=8&&G.round<=20&&!kron.usedThisSeason.includes('sp06_friendly_abroad'))?10:0;},
     title:'Zaproszenie na mecz zagraniczny',
     body:function(){return 'Klub z Czech zaprasza na towarzyski mecz. Oferują 10 000 zł honorarium, lot i hotel. Stracisz 2 dni treningu, ale drużyna zobaczy nowe środowisko.';},
     choices:[
       {label:'Jedziesz — 10 000 zł i mecz towarzyski',
        effect:function(){
          G.budget+=10000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:10000,cost:0,bal:G.budget,season:G.season,note:'Kronika: mecz za granicą'});
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          addNews('[Klub] Towarzyski za granicą! +10 000 zł, morale rośnie.','club');
        },
        outcome:function(){return '+10 000 zł. Forma składu +5. Drużyna zintegrowała się.';}},
       {label:'Odrzucasz — skupiasz się na sezonie',
        effect:function(){},
        outcome:function(){return 'Zaproszenie odrzucone. Pełny fokus na ligę.';}},
       {label:'Proponujesz mecz u siebie za 5 000 zł',
        effect:function(){
          G.budget+=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:5000,cost:0,bal:G.budget,season:G.season,note:'Kronika: mecz za granicą (opcja B)'});
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+2);});
          addNews('[Klub] Towarzyski na własnym stadionie. +5 000 zł.','club');
        },
        outcome:function(){return '+5 000 zł. Krótka stymulacja formy.';}},
     ]},

    // ── GRUPA 1 ─────────────────────────────────────────────────────────

    // S-02: Bunt kapitana
    {id:'s02_captain_dispute', category:'😤 SZATNIA',
     weight:function(){
       const hist=G.mHist||[];
       if(hist.length<3)return 0;
       const last3=hist.slice(-3);
       const allLost=last3.every(function(m){
         return m.isMyH?(m.hg<m.ag):(m.ag<m.hg);
       });
       if(!allLost)return 0;
       const captain=starters.slice().sort(function(a,b){return ovr(b)-ovr(a);})[0];
       if(!captain||ovr(captain)<58)return 0;
       return 30;
     },
     title:'Bunt kapitana',
     body:function(){
       const captain=starters.slice().sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._s02captainId=captain?captain.id:-1;
       const loseStr=(G.mHist||[]).slice(-3).length;
       return (captain?captain.name:'Kapitan składu')+' (OVR '+(captain?ovr(captain):'?')+') zebrał szatnię za Twoimi plecami. Po '+loseStr+' porażkach z rzędu publicznie kwestionuje Twoje decyzje taktyczne. Atmosfera jest napięta.';
     },
     choices:[
       {label:'Rozmawiasz twarzą w twarz — dajesz mu rację (morale +8, obrona/pomoc forma -5)',
        effect:function(){
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          if(cap)cap.form=Math.min(100,(cap.form||80)+5);
          const midDef=starters.filter(function(p){return p.pos==='OBR'||p.pos==='POL';}).slice(0,2);
          midDef.forEach(function(p){p.form=Math.max(40,(p.form||80)-5);});
          addNews('['+(cap?cap.name:'Kapitan')+'] uspokoił sytuację po rozmowie z trenerem.','club');
        },
        outcome:function(){
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          return 'Rozmowa przyniosła efekt. Skład forma +8. '+(cap?cap.name+' zadowolony.':'');
        }},
       {label:'Odbierasz opaskę kapitańską publicznie (rep -10, kapitan forma -15)',
        effect:function(){
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          G.reputation=Math.max(0,(G.reputation||30)-10);
          if(cap){cap.form=Math.max(15,(cap.form||80)-15);cap._benchWeeks=(cap._benchWeeks||0)+2;}
          addNews('[Szatnia] Opaska odebrana '+(cap?cap.name:'kapitanowi')+'. Napięcie w szatni wzrosło.','err');
        },
        outcome:function(){
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          return 'Opaska odebrana. Reputacja: '+(G.reputation||0)+' (-10). '+(cap?cap.name+' forma: '+cap.form+'%.':'');
        }},
       {label:'Organizujesz głosowanie szatni — demokracja (55/45)',
        effect:function(){
          const cap=G.players.find(function(p){return p.id===kron.flags._s02captainId;});
          if(Math.random()<0.55){
            starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
            addNews('[Szatnia] Głosowanie: szatnia po stronie trenera. Jedność wróciła.','ok');
            kron.flags._s02result='win';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-5);
            if(cap)cap.form=Math.min(100,(cap.form||80)+8);
            starters.filter(function(p){return p.id!==kron.flags._s02captainId;}).forEach(function(p){p.form=Math.max(40,(p.form||80)-5);});
            addNews('[Szatnia] Głosowanie: szatnia za '+(cap?cap.name:'kapitanem')+'. Autorytet trenera nadszarpnięty.','err');
            kron.flags._s02result='lose';
          }
        },
        outcome:function(){
          if(kron.flags._s02result==='win')return 'Głosowanie wygrałeś — drużyna za tobą. Forma +5 dla składu.';
          return 'Głosowanie przegrałeś. Reputacja -5. Skład forma -5, kapitan +8.';
        }},
     ]},

    // S-03: Pożegnanie legendy
    {id:'s03_veteran_farewell', category:'😤 SZATNIA',
     weight:function(){
       const legend=myPl().find(function(p){
         return (p.age||25)>=34&&(p._seasonsAtClub||0)>=2&&!p.injured;
       });
       return legend?20:0;
     },
     title:'Pożegnanie legendy',
     body:function(){
       const legend=myPl().filter(function(p){
         return (p.age||25)>=34&&(p._seasonsAtClub||0)>=2&&!p.injured;
       }).sort(function(a,b){return (b._seasonsAtClub||0)-(a._seasonsAtClub||0);})[0];
       kron.flags._s03legendId=legend?legend.id:-1;
       const seas=legend?(legend._seasonsAtClub||2):2;
       return (legend?legend.name:'Doświadczony zawodnik')+' ('+(legend?legend.age:'?')+' lat, '+seas+' sezony w klubie) sygnalizuje przez agenta, że to może być jego ostatni sezon. Media pytają o ceremonię pożegnalną.';
     },
     choices:[
       {label:'Organizujesz uroczystość pożegnalną (-5 000 zł, rep +15, morale +5)',
        effect:function(){
          if(G.budget<5000){notif('Brak budżetu na ceremonię!','err');kron.flags._s03result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:'Kronika: galeria sław'});
          G.reputation=Math.min(1000,(G.reputation||30)+15);
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          if(leg)leg.form=Math.min(100,(leg.form||80)+10);
          addNews('[Klub] Ceremonia pożegnalna. Reputacja +15, morale drużyny wzrosło.','ok');
          kron.flags._s03result='ceremony';
        },
        outcome:function(){
          if(kron.flags._s03result==='noBudget')return 'Brak budżetu — ceremonia się nie odbyła. Legenda odchodzi bez słowa.';
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          return 'Ceremonia z pompą! -5 000 zł. Reputacja: '+(G.reputation||0)+' (+15). '+(leg?leg.name+' forma: '+leg.form+'%':'');
        }},
       {label:'Cichy odejście — nie robisz z tego tematu',
        effect:function(){kron.flags._s03result='silent';},
        outcome:function(){
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          return (leg?leg.name:'Zawodnik')+' odchodzi spokojnie. Bez kary, bez premii.';
        }},
       {label:'Proponujesz przedłużenie o 1 sezon (50/50 — może odmówić)',
        effect:function(){
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          if(!leg){kron.flags._s03result='noPlayer';return;}
          if(Math.random()<0.50){
            leg.contract=(leg.contract||1)+1;
            leg._seasonsAtClub=(leg._seasonsAtClub||2)+1;
            leg.form=Math.min(100,(leg.form||80)+5);
            addNews('[Transfer] '+leg.name+' przedłużył kontrakt o 1 sezon! Legenda zostaje.','ok');
            kron.flags._s03result='extended';
          } else {
            leg.form=Math.max(30,(leg.form||80)-8);
            G.reputation=Math.max(0,(G.reputation||30)-5);
            addNews('[Transfer] '+leg.name+' odrzucił przedłużenie. Odejdzie na koniec sezonu.','err');
            kron.flags._s03result='refused';
          }
        },
        outcome:function(){
          const leg=G.players.find(function(p){return p.id===kron.flags._s03legendId;});
          if(kron.flags._s03result==='extended')return (leg?leg.name:'Zawodnik')+' zostaje! Kontrakt +1 sezon. Forma +5.';
          if(kron.flags._s03result==='refused')return (leg?leg.name:'Zawodnik')+' odmówił. Forma -8, reputacja -5.';
          return 'Zawodnik nie istnieje w składzie.';
        }},
     ]},

    // S-05: Przeciek z szatni
    {id:'s05_locker_room_leak', category:'😤 SZATNIA',
     weight:function(){
       return (G.round>5&&starters.length>=8)?18:0;
     },
     title:'Przeciek z szatni',
     body:function(){
       const suspects=starters.filter(function(p){return (p._benchWeeks||0)>=1||ovr(p)<55;});
       const suspect=suspects.length?suspects[Math.floor(Math.random()*suspects.length)]:starters[Math.floor(Math.random()*starters.length)];
       kron.flags._s05suspectId=suspect?suspect.id:-1;
       return 'Dziennikarz z lokalnej gazety opublikował szczegóły taktyczne i cytaty z zamkniętego spotkania przed meczem. Ktoś z szatni rozmawiał z mediami. Atmosfera jest lodowata.';
     },
     choices:[
       {label:'Dochodzenie wewnętrzne (-3 000 zł, 60% szans na znalezienie winnego)',
        effect:function(){
          if(G.budget<3000){notif('Brak budżetu!','err');kron.flags._s05result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:'Kronika: odwołanie od sędziego'});
          G.reputation=Math.max(0,(G.reputation||30)-5);
          const suspect=G.players.find(function(p){return p.id===kron.flags._s05suspectId;});
          if(Math.random()<0.60&&suspect){
            suspect.form=Math.max(20,(suspect.form||80)-10);
            suspect.starter=false;
            addNews('[Szatnia] Dochodzenie: '+suspect.name+' odsunięty od składu za przeciek.','err');
            kron.flags._s05result='found';
            kron.flags._s05culpritName=suspect.name;
          } else {
            starters.forEach(function(p){p.form=Math.max(40,(p.form||80)-3);});
            addNews('[Szatnia] Dochodzenie bez rezultatu. Napięcie rośnie.','err');
            kron.flags._s05result='notFound';
          }
        },
        outcome:function(){
          if(kron.flags._s05result==='noBudget')return 'Brak budżetu — dochodzenie wstrzymane.';
          if(kron.flags._s05result==='found')return 'Winny: '+(kron.flags._s05culpritName||'?')+'. Odsunięty od składu. Rep -5, budżet -3 000 zł.';
          return 'Winnego nie znaleziono. Cały skład forma -3. Budżet -3 000 zł.';
        }},
       {label:'Zamrażasz temat — media się uspokoją (rep -8)',
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-8);
          addNews('[Szatnia] Klub nie komentuje przecieku. Kibice niezadowoleni.','club');
          kron.flags._s05result='ignored';
        },
        outcome:function(){
          return 'Temat zamrożony. Reputacja: '+(G.reputation||0)+' (-8). Zero kosztów.';
        }},
       {label:'Transparentność — przyznajesz otwarcie (rep +5, jeden zawodnik forma -5)',
        effect:function(){
          G.reputation=Math.min(1000,(G.reputation||30)+5);
          const suspect=G.players.find(function(p){return p.id===kron.flags._s05suspectId;});
          if(suspect)suspect.form=Math.max(30,(suspect.form||80)-5);
          addNews('[Szatnia] Trener przyznał — transparentność doceniona przez media.','ok');
          kron.flags._s05result='transparent';
          kron.flags._s05culpritName=suspect?suspect.name:'';
        },
        outcome:function(){
          const name=kron.flags._s05culpritName;
          return 'Transparentność popłaciła. Reputacja: '+(G.reputation||0)+' (+5). '+(name?name+' forma -5.':'');
        }},
     ]},

    // ── GRUPA 2 ─────────────────────────────────────────────────────────

    // T-02: Agent żąda podwyżki
    {id:'t02_agent_pressure', category:'💰 TRANSFERY',
     weight:function(){
       if((G.season||1)<2)return 0;
       const star=starters.find(function(p){return ovr(p)>=62;});
       return star?28:0;
     },
     title:'Agent żąda podwyżki',
     body:function(){
       const star=starters.filter(function(p){return ovr(p)>=62;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._t02starId=star?star.id:-1;
       const ask=star?Math.round((star.value||50000)*0.25/1000)*1000:15000;
       kron.flags._t02ask=ask;
       return 'Agent '+(star?star.name:'Twojego najlepszego zawodnika')+' (OVR '+(star?ovr(star):'?')+') zadzwonił: jego klient chce podwyżki o '+fmtVal(ask)+'. "Albo teraz, albo szukamy innych opcji" — powiedział dosłownie.';
     },
     choices:[
       {label:'Dajesz podwyżkę (forma +5, kontrakt przedłużony)',
        effect:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          const ask=kron.flags._t02ask||15000;
          if(G.budget<ask){notif('Brak budżetu na podwyżkę!','err');kron.flags._t02result='noBudget';return;}
          G.budget-=ask;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:ask,bal:G.budget,season:G.season,note:'Kronika: negocjacje sponsorskie'});
          if(star){star.form=Math.min(100,(star.form||80)+5);star._loyaltyBonus=true;star.contract=Math.max(star.contract||1,3);}
          addNews('[Transfer] '+(star?star.name:'Zawodnik')+' podpisał nowy kontrakt. Budżet: -'+fmtVal(ask)+'.','budget');
          kron.flags._t02result='paid';
        },
        outcome:function(){
          if(kron.flags._t02result==='noBudget')return 'Brak budżetu — podwyżka niemożliwa. Agent wychodzi zdenerwowany.';
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          return 'Podwyżka wypłacona. Budżet -'+fmtVal(kron.flags._t02ask||0)+'. '+(star?star.name+' forma +5, kontrakt przedłużony.':'');
        }},
       {label:'Odmawiasz — za dużo żąda (gracz forma -10, ryzyko odejścia)',
        effect:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          if(star){star.form=Math.max(20,(star.form||80)-10);star._wantsOut=true;}
          addNews('[Transfer] '+(star?star.name:'Zawodnik')+' niezadowolony po odmowie podwyżki.','err');
          kron.flags._t02result='refused';
        },
        outcome:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          return (star?star.name:'Zawodnik')+' forma: '+(star?star.form:'?')+'% (-10). Jeśli wpłynie oferta transferowa, trudniej go zatrzymać.';
        }},
       {label:'Blefujesz — "inny klub już pyta o ciebie" (50/50)',
        effect:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          if(Math.random()<0.50){
            if(star)star.form=Math.min(100,(star.form||80)+2);
            addNews('[Transfer] Blef zadziałał — '+(star?star.name:'zawodnik')+' odpuścił temat podwyżki.','ok');
            kron.flags._t02result='bluffWin';
          } else {
            if(star){star.form=Math.max(15,(star.form||80)-12);star._wantsOut=true;}
            addNews('[Transfer] '+(star?star.name:'Zawodnik')+' przejrzał blef i jest wściekły. Forma -12.','err');
            kron.flags._t02result='bluffLose';
          }
        },
        outcome:function(){
          const star=G.players.find(function(p){return p.id===kron.flags._t02starId;});
          if(kron.flags._t02result==='bluffWin')return 'Blef zadziałał! '+(star?star.name:'Zawodnik')+' odpuścił. Forma +2.';
          return 'Blef spalony. '+(star?star.name:'Zawodnik')+' forma: '+(star?star.form:'?')+'% (-12). Ryzyko odejścia wzrosło.';
        }},
     ]},

    // T-05: Okazja — wolny agent z klasą
    {id:'t05_bargain_release', category:'💰 TRANSFERY',
     weight:function(){
       if(!G.fa||!G.fa.length)return 0;
       const gem=G.fa.find(function(p){return ovr(p)>=60&&(p.age||25)<=30;});
       return (gem&&G.budget>=15000)?22:0;
     },
     title:'Okazja — wolny agent z klasą',
     body:function(){
       const gem=G.fa.filter(function(p){return ovr(p)>=60&&(p.age||25)<=30;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._t05gemId=gem?gem.id:-1;
       const cost=gem?Math.round((gem.value||40000)*0.50/1000)*1000:20000;
       kron.flags._t05cost=cost;
       kron.flags._t05cheapCost=Math.round(cost*0.60/1000)*1000;
       return (gem?gem.name:'Doświadczony zawodnik')+' ('+(gem?gem.pos:'?')+', OVR '+(gem?ovr(gem):'?')+', '+(gem?gem.age:'?')+' lat) jest bez klubu po wygaśnięciu kontraktu. Agent sygnalizuje zainteresowanie — cena niższa niż rynkowa: '+fmtVal(cost)+'.';
     },
     choices:[
       {label:'Podpisujesz natychmiast',
        effect:function(){
          const gem=G.fa.find(function(p){return p.id===kron.flags._t05gemId;});
          const cost=kron.flags._t05cost||20000;
          if(!gem){kron.flags._t05result='gone';return;}
          if(G.budget<cost){notif('Brak budżetu!','err');kron.flags._t05result='noBudget';return;}
          G.budget-=cost;
          fillHistoryGaps(gem);
          gem.clubId=G.myClubId;gem.starter=false;gem.status='active';gem.isFreeAgent=false;gem.contract=r(2,3);gem._seasonsAtClub=0;
          gem.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'Twój klub',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(gem),avgRat:null,_current:true});
          G.fa=G.fa.filter(function(p){return p.id!==gem.id;});
          G.players.push(gem);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:gem.name,val:cost,fee:cost,week:G.week,season:G.season});
          addNews('[Transfer] '+gem.name+' (OVR '+ovr(gem)+') podpisał kontrakt! Budżet: -'+fmtVal(cost)+'.','budget');
          kron.flags._t05result='signed';kron.flags._t05name=gem.name;kron.flags._t05ovr=ovr(gem);
        },
        outcome:function(){
          if(kron.flags._t05result==='gone')return 'Zawodnik odszedł do innego klubu zanim zdążyłeś zareagować.';
          if(kron.flags._t05result==='noBudget')return 'Brak budżetu — transfer niemożliwy.';
          return (kron.flags._t05name||'Zawodnik')+' (OVR '+(kron.flags._t05ovr||'?')+') w drużynie! Budżet -'+fmtVal(kron.flags._t05cost||0)+'.';
        }},
       {label:'Negocjujesz cenę — próbujesz zejść do 60% (70% szans)',
        effect:function(){
          const gem=G.fa.find(function(p){return p.id===kron.flags._t05gemId;});
          const cheapCost=kron.flags._t05cheapCost||12000;
          if(!gem){kron.flags._t05result='gone';return;}
          if(Math.random()<0.70){
            if(G.budget<cheapCost){notif('Brak budżetu nawet po negocjacjach!','err');kron.flags._t05result='noBudget';return;}
            G.budget-=cheapCost;
            fillHistoryGaps(gem);
            gem.clubId=G.myClubId;gem.starter=false;gem.status='active';gem.isFreeAgent=false;gem.contract=r(2,3);gem._seasonsAtClub=0;
            gem.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'Twój klub',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(gem),avgRat:null,_current:true});
            G.fa=G.fa.filter(function(p){return p.id!==gem.id;});
            G.players.push(gem);
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'buy',name:gem.name,val:cheapCost,fee:cheapCost,week:G.week,season:G.season});
            addNews('[Transfer] Negocjacje udane! '+gem.name+' za '+fmtVal(cheapCost)+'.','budget');
            kron.flags._t05result='negotiated';kron.flags._t05name=gem.name;kron.flags._t05ovr=ovr(gem);
          } else {
            G.fa=G.fa.filter(function(p){return p.id!==gem.id;});
            addNews('[Transfer] '+gem.name+' odrzucił kontrpropozycję i wybrał inny klub.','err');
            kron.flags._t05result='walkaway';kron.flags._t05name=gem.name;
          }
        },
        outcome:function(){
          if(kron.flags._t05result==='gone')return 'Zawodnik odszedł zanim zdążyłeś zareagować.';
          if(kron.flags._t05result==='noBudget')return 'Negocjacje udane, ale brakuje budżetu.';
          if(kron.flags._t05result==='negotiated')return (kron.flags._t05name||'Zawodnik')+' za '+fmtVal(kron.flags._t05cheapCost||0)+'! Zaoszczędziłeś na negocjacjach.';
          return (kron.flags._t05name||'Zawodnik')+' odszedł po nieudanych negocjacjach.';
        }},
       {label:'Zapraszasz na próbny trening — za darmo (40% szans)',
        effect:function(){
          const gem=G.fa.find(function(p){return p.id===kron.flags._t05gemId;});
          if(!gem){kron.flags._t05result='gone';return;}
          if(Math.random()<0.40){
            fillHistoryGaps(gem);
            gem.clubId=G.myClubId;gem.starter=false;gem.status='active';gem.isFreeAgent=false;gem.contract=2;gem._seasonsAtClub=0;
            gem.form=Math.min(100,(gem.form||80)-5);
            gem.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'Twój klub',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(gem),avgRat:null,_current:true});
            G.fa=G.fa.filter(function(p){return p.id!==gem.id;});
            G.players.push(gem);
            addNews('[Transfer] '+gem.name+' zaimponowany próbnym treningiem! Podpisuje za darmo.','ok');
            kron.flags._t05result='trial';kron.flags._t05name=gem.name;
          } else {
            addNews('[Transfer] '+gem.name+' nie był przekonany — odszedł.','err');
            kron.flags._t05result='trialFail';kron.flags._t05name=gem.name;
          }
        },
        outcome:function(){
          if(kron.flags._t05result==='gone')return 'Zawodnik odszedł zanim zdążyłeś zareagować.';
          if(kron.flags._t05result==='trial')return (kron.flags._t05name||'Zawodnik')+' podpisał za darmo po próbnym treningu! Forma -5.';
          return (kron.flags._t05name||'Zawodnik')+' odrzucił ofertę po treningu.';
        }},
     ]},

    // T-06: Licytacja z rywalem
    {id:'t06_bidding_war', category:'💰 TRANSFERY',
     weight:function(){
       if(!G.rival)return 0;
       if(!G.fa||!G.fa.length)return 0;
       const target=G.fa.find(function(p){return ovr(p)>=55&&(p.age||25)<=28;});
       return (target&&G.budget>=20000)?25:0;
     },
     title:'Licytacja z rywalem',
     body:function(){
       const target=G.fa.filter(function(p){return ovr(p)>=55&&(p.age||25)<=28;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._t06targetId=target?target.id:-1;
       const base=target?Math.round((target.value||35000)*0.65/1000)*1000:25000;
       kron.flags._t06base=base;
       kron.flags._t06high=Math.round(base*1.20/1000)*1000;
       kron.flags._t06cheap=Math.round(base*0.55/1000)*1000;
       const rivalName=(G.rival&&G.rival.n)||'Rywal';
       return 'Agent '+(target?target.name:'wolnego agenta')+' (OVR '+(target?ovr(target):'?')+') poinformował, że '+rivalName+' złożył ofertę. Macie 24h na decyzję. Cena bazowa: '+fmtVal(base)+'.';
     },
     choices:[
       {label:'Podbijasz cenę — wygrywasz licytację (cena +20%)',
        effect:function(){
          const target=G.fa.find(function(p){return p.id===kron.flags._t06targetId;});
          const high=kron.flags._t06high||30000;
          if(!target){kron.flags._t06result='gone';return;}
          if(G.budget<high){notif('Brak budżetu na licytację!','err');kron.flags._t06result='noBudget';return;}
          G.budget-=high;
          fillHistoryGaps(target);
          target.clubId=G.myClubId;target.starter=false;target.status='active';target.isFreeAgent=false;target.contract=r(2,3);target._seasonsAtClub=0;
          target.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'Twój klub',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(target),avgRat:null,_current:true});
          G.fa=G.fa.filter(function(p){return p.id!==target.id;});
          G.players.push(target);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:target.name,val:high,fee:high,week:G.week,season:G.season});
          addNews('[Transfer] Licytacja wygrana! '+target.name+' za '+fmtVal(high)+'. Rywal bez wzmocnienia.','budget');
          kron.flags._t06result='won';kron.flags._t06name=target.name;kron.flags._t06ovr=ovr(target);
        },
        outcome:function(){
          if(kron.flags._t06result==='gone')return 'Zawodnik zniknął z rynku przed finalizacją.';
          if(kron.flags._t06result==='noBudget')return 'Brak budżetu — przegrałeś licytację z rywalem.';
          return 'Licytacja wygrana! '+(kron.flags._t06name||'Zawodnik')+' (OVR '+(kron.flags._t06ovr||'?')+') Twój za '+fmtVal(kron.flags._t06high||0)+'.';
        }},
       {label:'Odpuszczasz — rywal go bierze (rival.strength +3)',
        effect:function(){
          const target=G.fa.find(function(p){return p.id===kron.flags._t06targetId;});
          if(target&&G.rival){
            target.isFreeAgent=false;target.status='active';
            G.fa=G.fa.filter(function(p){return p.id!==target.id;});
            if(G.rival.strength!==undefined)G.rival.strength=(G.rival.strength||50)+3;
            addNews('[Transfer] '+(target.name||'Wolny agent')+' trafił do '+(G.rival.n||'Rywala')+'. Rival wzmocniony.','err');
          }
          kron.flags._t06result='lost';kron.flags._t06name=target?target.name:'Zawodnik';
        },
        outcome:function(){
          const rivalName=(G.rival&&G.rival.n)||'Rywal';
          return (kron.flags._t06name||'Zawodnik')+' w drużynie '+rivalName+'. Ich siła +3.';
        }},
       {label:'Podkopujesz agenta rywala — ryzykowna gra (30% szans, tańszy transfer)',
        effect:function(){
          const target=G.fa.find(function(p){return p.id===kron.flags._t06targetId;});
          const cheap=kron.flags._t06cheap||18000;
          if(!target){kron.flags._t06result='gone';return;}
          if(Math.random()<0.30){
            if(G.budget<cheap){notif('Brak budżetu!','err');kron.flags._t06result='noBudget';return;}
            G.budget-=cheap;
            fillHistoryGaps(target);
            target.clubId=G.myClubId;target.starter=false;target.status='active';target.isFreeAgent=false;target.contract=r(2,3);target._seasonsAtClub=0;
            target.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'Twój klub',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(target),avgRat:null,_current:true});
            G.fa=G.fa.filter(function(p){return p.id!==target.id;});
            G.players.push(target);
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'buy',name:target.name,val:cheap,fee:cheap,week:G.week,season:G.season});
            addNews('[Transfer] Zakulisowe manewry zadziałały! '+target.name+' za '+fmtVal(cheap)+'.','ok');
            kron.flags._t06result='sneaky';kron.flags._t06name=target.name;
          } else {
            G.fa=G.fa.filter(function(p){return p.id!==target.id;});
            if(G.rival&&G.rival.strength!==undefined)G.rival.strength=(G.rival.strength||50)+2;
            G.reputation=Math.max(0,(G.reputation||30)-5);
            addNews('[Transfer] Zakulisowe próby spalone. '+(target.name||'Zawodnik')+' trafił do rywala. Reputacja -5.','err');
            kron.flags._t06result='sneakyFail';kron.flags._t06name=target?target.name:'Zawodnik';
          }
        },
        outcome:function(){
          if(kron.flags._t06result==='gone')return 'Zawodnik zniknął z rynku.';
          if(kron.flags._t06result==='noBudget')return 'Zakulisowa akcja udana, ale brak budżetu.';
          if(kron.flags._t06result==='sneaky')return 'Udało się! '+(kron.flags._t06name||'Zawodnik')+' za '+fmtVal(kron.flags._t06cheap||0)+'. Rywal nic nie wie.';
          return 'Plany wyszły na jaw. Rywal zabrał '+(kron.flags._t06name||'Zawodnika')+'. Reputacja: '+(G.reputation||0)+' (-5).';
        }},
     ]},

    // ── PRIORYTET 1 — ŁAŃCUCHY ──────────────────────────────────────────

    // K-04: Gwiazda chce odejść (łańcuch z t02_agent_pressure / t01_big_offer)
    {id:'k04_wantsout_crisis', category:'💥 KRYZYS',
     weight:function(){
       // Trigger: jakikolwiek zawodnik ma flagę _wantsOut=true
       const rebel=myPl().find(function(p){return p._wantsOut;});
       return rebel?40:0;
     },
     title:'Gwiazda chce odejść',
     body:function(){
       const rebel=myPl().filter(function(p){return p._wantsOut;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       kron.flags._k04rebelId=rebel?rebel.id:-1;
       const offerVal=rebel?Math.round((rebel.value||50000)*1.30/1000)*1000:0;
       kron.flags._k04offerVal=offerVal;
       return (rebel?rebel.name:'Zawodnik')+' (OVR '+(rebel?ovr(rebel):'?')+') dał ultimatum przez agenta: albo odejdzie w zimowym oknie, albo będzie sabotował atmosferę w szatni. Klub z wyższej ligi oferuje '+fmtVal(offerVal)+'. Zarząd czeka na Twoją decyzję.';
     },
     choices:[
       {label:'Sprzedajesz — bierzesz 130% wartości',
        effect:function(){
          const rebel=G.players.find(function(p){return p.id===kron.flags._k04rebelId;});
          const val=kron.flags._k04offerVal||0;
          if(!rebel){kron.flags._k04result='gone';return;}
          G.budget+=val;
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'sell',name:rebel.name,val:val,week:G.week,season:G.season});
          addNews('[Transfer] '+rebel.name+' sprzedany za '+fmtVal(val)+'. Szatnia może odetchnąć.','budget');
          rebel.clubId=0;rebel.starter=false;rebel.status='freeAgent';rebel.isFreeAgent=true;rebel._wantsOut=false;
          G.players=G.players.filter(function(p){return p.id!==rebel.id;});
          if(!G.fa)G.fa=[];G.fa.push(rebel);
          kron.flags._k04result='sold';kron.flags._k04name=rebel.name;kron.flags._k04val=val;
        },
        outcome:function(){
          if(kron.flags._k04result==='gone')return 'Zawodnik już nie ma go w składzie.';
          return (kron.flags._k04name||'Zawodnik')+' sprzedany za '+fmtVal(kron.flags._k04val||0)+'. Budżet wzrósł.';
        }},
       {label:'Dajesz mu opaskę kapitańską — próba zatrzymania (forma +10, ryzyko)',
        effect:function(){
          const rebel=G.players.find(function(p){return p.id===kron.flags._k04rebelId;});
          if(!rebel){kron.flags._k04result='gone';return;}
          if(Math.random()<0.60){
            rebel._wantsOut=false;
            rebel.form=Math.min(100,(rebel.form||80)+10);
            rebel.contract=Math.max(rebel.contract||1,3);
            // Stary kapitan (najwyższe OVR poza rebeliantem) traci morale
            const oldCap=myPl().filter(function(p){return p.id!==rebel.id&&p.starter;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
            if(oldCap)oldCap.form=Math.max(40,(oldCap.form||80)-8);
            addNews('[Szatnia] '+rebel.name+' nowym kapitanem. Zostaje w klubie.','ok');
            kron.flags._k04result='captain';
          } else {
            rebel.form=Math.max(10,(rebel.form||80)-15);
            addNews('[Szatnia] '+rebel.name+' odrzucił propozycję. Sytuacja eskaluje.','err');
            kron.flags._k04result='captainFail';
          }
          kron.flags._k04name=rebel.name;
        },
        outcome:function(){
          const rebel=G.players.find(function(p){return p.id===kron.flags._k04rebelId;});
          if(kron.flags._k04result==='captain')return (kron.flags._k04name||'Zawodnik')+' nowym kapitanem! Forma +10, zostaje. Poprzedni kapitan forma -8.';
          if(kron.flags._k04result==='captainFail')return (kron.flags._k04name||'Zawodnik')+' odrzucił opaskę. Forma: '+(rebel?rebel.form:'?')+'% (-15). Kryzys trwa.';
          return 'Zawodnik nie istnieje w składzie.';
        }},
       {label:'Ignorujesz ultimatum — niech sabotuje (cały skład forma -5 przez presję)',
        effect:function(){
          const rebel=G.players.find(function(p){return p.id===kron.flags._k04rebelId;});
          // Zatruwa atmosferę — cały skład traci formę
          myPl().forEach(function(p){p.form=Math.max(30,(p.form||80)-5);});
          if(rebel)rebel.form=Math.max(10,(rebel.form||80)-10);
          G.reputation=Math.max(0,(G.reputation||30)-8);
          addNews('[Szatnia] '+(rebel?rebel.name:'Zawodnik')+' otwarcie krytykuje klub w mediach. Atmosfera toksyczna.','err');
          kron.flags._k04result='ignored';kron.flags._k04name=rebel?rebel.name:'Zawodnik';
        },
        outcome:function(){
          return 'Ignorowanie kryzysu kosztuje: cały skład forma -5, '+(kron.flags._k04name||'zawodnik')+' forma -10, reputacja -8.';
        }},
     ]},

    // S-07: Impreza znowu (łańcuch z s01_party_scandal opcja C)
    {id:'s07_scandal_repeat', category:'😤 SZATNIA',
     weight:function(){
       // Trigger: flaga _s01canRepeat ustawiona gdy gracz ignorował pierwszą imprezę
       return kron.flags._s01canRepeat?35:0;
     },
     title:'Impreza znowu — tym razem z dowodem',
     body:function(){
       // Ci sami winowajcy co poprzednio (lub losowi starterzy)
       const prev=kron.flags._s01pids||[];
       const picks=prev.length?
         prev.map(function(id){return G.players.find(function(p){return p.id===id;});}).filter(Boolean):
         starters.slice().sort(function(){return Math.random()-0.5;}).slice(0,3);
       kron.flags._s07pids=picks.map(function(p){return p.id;});
       const names=picks.map(function(p){return p.name.split(' ')[1]||p.name;}).join(', ');
       return 'Tabloid opublikował zdjęcia: '+names+' znowu bawili się do świtu przed meczem. Tym razem media mają twarde dowody i tytuł "BAŁAGAN W KLUBIE". Zarząd czeka na natychmiastową reakcję.';
     },
     choices:[
       {label:'Zawieszasz ich publicznie — zero tolerancji (forma -15, rep +10)',
        effect:function(){
          (kron.flags._s07pids||[]).forEach(function(id){
            const p=G.players.find(function(x){return x.id===id;});
            if(p){p.form=Math.max(10,(p.form||80)-15);p.starter=false;p._benchWeeks=(p._benchWeeks||0)+3;}
          });
          G.reputation=Math.min(1000,(G.reputation||30)+10);
          kron.flags._s01canRepeat=false;// reset — nauczka zadziałała
          addNews('[Szatnia] Zawieszenie po skandalu. Zero tolerancji. Reputacja +10.','ok');
        },
        outcome:function(){
          const names=(kron.flags._s07pids||[]).map(function(id){
            const p=G.players.find(function(x){return x.id===id;});return p?p.name.split(' ')[1]:'?';
          }).join(', ');
          return names+' zawieszeni. Forma -15, odsunięci od składu. Reputacja: '+(G.reputation||0)+' (+10).';
        }},
       {label:'Wykupujesz milczenie mediów (-25 000 zł, sprawa znika)',
        effect:function(){
          if(G.budget<25000){
            notif('Brak budżetu na wykupienie milczenia!','err');
            // Mimo braku kasy sprawa i tak cichnie — ale reputacja spada
            G.reputation=Math.max(0,(G.reputation||30)-15);
            kron.flags._s07result='noBudget';
            return;
          }
          G.budget-=25000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:25000,bal:G.budget,season:G.season,note:'Kronika: wykup milczenia (skandal)'});
          kron.flags._s01canRepeat=false;
          addNews('[Szatnia] Sprawa wyciszona. Budżet: -25 000 zł.','budget');
          kron.flags._s07result='paid';
        },
        outcome:function(){
          if(kron.flags._s07result==='noBudget')return 'Brak budżetu — milczenia nie wykupiono. Reputacja: '+(G.reputation||0)+' (-15). Skandal żyje.';
          return 'Milczenie wykupione za 25 000 zł. Sprawa znika z mediów. Winni grają dalej.';
        }},
       {label:'Ignorujesz po raz drugi — szatnia traci respekt (rep -20, skład forma -8)',
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-20);
          myPl().forEach(function(p){p.form=Math.max(30,(p.form||80)-8);});
          // Flaga zostaje — może wrócić jeszcze raz ale z większą wagą
          addNews('[Szatnia] Brak reakcji na powtórny skandal. Klub stał się pośmiewiskiem ligi.','err');
          kron.flags._s07result='ignored';
        },
        outcome:function(){
          return 'Brak reakcji. Reputacja: '+(G.reputation||0)+' (-20). Cały skład forma -8. Klub w mediach jako przykład bałaganu.';
        }},
     ]},

    // T-07: Lojalny zawodnik (łańcuch z t02_agent_pressure opcja A — _loyaltyBonus)
    {id:'t07_loyalty_reward', category:'💰 TRANSFERY',
     weight:function(){
       // Trigger: zawodnik z _loyaltyBonus=true i min 3 sezony w klubie
       const loyal=myPl().find(function(p){
         return p._loyaltyBonus&&(p._seasonsAtClub||0)>=3&&!p._wantsOut;
       });
       return loyal?25:0;
     },
     title:'Lojalny zawodnik — niezwykła propozycja',
     body:function(){
       const loyal=myPl().filter(function(p){
         return p._loyaltyBonus&&(p._seasonsAtClub||0)>=3&&!p._wantsOut;
       }).sort(function(a,b){return (b._seasonsAtClub||0)-(a._seasonsAtClub||0);})[0];
       kron.flags._t07loyalId=loyal?loyal.id:-1;
       const saving=loyal?Math.round((loyal.value||30000)*0.15/1000)*1000:10000;
       kron.flags._t07saving=saving;
       return (loyal?loyal.name:'Twój lojalny zawodnik')+' ('+(loyal?loyal._seasonsAtClub||3:3)+' sezony w klubie) sam przyszedł z propozycją: obniży sobie pensję o '+fmtVal(saving)+' na sezon, żebyś mógł kupić wzmocnienie. "Ten klub to mój dom" — powiedział.';
     },
     choices:[
       {label:'Przyjmujesz — oszczędzasz budżet (+saving zł, jego forma +5)',
        effect:function(){
          const loyal=G.players.find(function(p){return p.id===kron.flags._t07loyalId;});
          const saving=kron.flags._t07saving||10000;
          G.budget+=saving;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:saving,cost:0,bal:G.budget,season:G.season,note:'Kronika: oszczędność pensji (lojalny zawodnik)'});
          if(loyal){
            loyal.form=Math.min(100,(loyal.form||80)+5);
            loyal._loyaltyBonus=true;// podtrzymaj flagę
            // Szatnia widzi gest — morale rośnie
            myPl().filter(function(p){return p.id!==kron.flags._t07loyalId;}).forEach(function(p){
              p.form=Math.min(100,(p.form||80)+3);
            });
          }
          addNews('[Szatnia] '+(loyal?loyal.name:'Zawodnik')+' obniżył pensję dla dobra klubu. Morale szatni +3.','ok');
          kron.flags._t07result='accepted';kron.flags._t07name=loyal?loyal.name:'Zawodnik';
        },
        outcome:function(){
          return 'Gest przyjęty. Budżet +'+fmtVal(kron.flags._t07saving||0)+'. '+(kron.flags._t07name||'Zawodnik')+' forma +5. Cały skład morale +3.';
        }},
       {label:'Odrzucasz — nie chcesz go obciążać (rep +5, nic finansowo)',
        effect:function(){
          const loyal=G.players.find(function(p){return p.id===kron.flags._t07loyalId;});
          G.reputation=Math.min(1000,(G.reputation||30)+5);
          if(loyal)loyal.form=Math.min(100,(loyal.form||80)+8);// docenia że nie wykorzystałeś
          addNews('[Szatnia] Trener odrzucił propozycję — nie chciał wykorzystywać lojalności. Reputacja +5.','ok');
          kron.flags._t07result='refused';kron.flags._t07name=loyal?loyal.name:'Zawodnik';
        },
        outcome:function(){
          return 'Odmówiłeś obniżki. Reputacja: '+(G.reputation||0)+' (+5). '+(kron.flags._t07name||'Zawodnik')+' forma +8 — szanuje Twoją decyzję.';
        }},
       {label:'Przyjmujesz i publicznie go chwalisz (+saving zł, rep +8, forma +8)',
        effect:function(){
          const loyal=G.players.find(function(p){return p.id===kron.flags._t07loyalId;});
          const saving=kron.flags._t07saving||10000;
          G.budget+=saving;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:saving,cost:0,bal:G.budget,season:G.season,note:'Kronika: oszczędność pensji (lojalny zawodnik, z chwałą)'});
          G.reputation=Math.min(1000,(G.reputation||30)+8);
          if(loyal){
            loyal.form=Math.min(100,(loyal.form||80)+8);
            loyal._loyaltyBonus=true;
          }
          myPl().filter(function(p){return p.id!==kron.flags._t07loyalId;}).forEach(function(p){
            p.form=Math.min(100,(p.form||80)+4);
          });
          addNews('[Szatnia] '+(loyal?loyal.name:'Zawodnik')+' bohaterem szatni po publicznej pochwale trenera. Reputacja +8.','ok');
          kron.flags._t07result='praised';kron.flags._t07name=loyal?loyal.name:'Zawodnik';
        },
        outcome:function(){
          return 'Publiczna pochwała! Budżet +'+fmtVal(kron.flags._t07saving||0)+'. '+(kron.flags._t07name||'Zawodnik')+' forma +8. Cały skład +4. Reputacja: '+(G.reputation||0)+' (+8).';
        }},
     ]},

    // SP-08: Ten sam sędzia znowu (łańcuch z sp05_ref_error)
    {id:'sp08_ref_revenge', category:'⚽ SPORTOWE',
     weight:function(){
       // Trigger: sp05 już wystąpił w tym sezonie (jest w usedThisSeason)
       if(!kron.usedThisSeason.includes('sp05_ref_error'))return 0;
       // I zbliża się kolejny mecz
       const nm=G.schedule&&G.schedule.find(function(m){return m.rnd===G.round&&!m.done&&(m.h===G.myClubId||m.a===G.myClubId);});
       return nm?28:0;
     },
     title:'Ten sam sędzia — znowu',
     body:function(){
       const nm=G.schedule&&G.schedule.find(function(m){return m.rnd===G.round&&!m.done&&(m.h===G.myClubId||m.a===G.myClubId);});
       const oppId=nm?(nm.h===G.myClubId?nm.a:nm.h):0;
       const oppClub=(G.leagues||[]).flatMap(function(l){return l.clubs||[];}).find(function(c){return c.id===oppId;});
       kron.flags._sp08oppName=oppClub?oppClub.n:'Rywal';
       return 'Liga właśnie ogłosiła obsadę sędziowską. Sędzia z kontrowersyjnego meczu prowadzi Wasze starcie z '+(oppClub?oppClub.n:'rywalem')+'. Media już piszą o "zemście w stroju sędziowskim". Co robisz przed meczem?';
     },
     choices:[
       {label:'Oficjalny protest do ligi przed meczem (30% szans na zmianę sędziego)',
        effect:function(){
          if(Math.random()<0.30){
            G.reputation=Math.min(1000,(G.reputation||30)+5);
            addNews('[Liga] Protest przyjęty — sędzia zmieniony. Reputacja +5.','ok');
            kron.flags._sp08result='changed';
          } else {
            G.budget=Math.max(0,G.budget-5000);
            G.reputation=Math.max(0,(G.reputation||30)-5);
            addNews('[Liga] Protest odrzucony. Kara 5 000 zł za "zakłócanie porządku".','err');
            kron.flags._sp08result='rejected';
          }
        },
        outcome:function(){
          if(kron.flags._sp08result==='changed')return 'Protest przyjęty! Sędzia zmieniony. Reputacja +5.';
          return 'Protest odrzucony. Budżet -5 000 zł, reputacja -5. Sędzia prowadzi mecz.';
        }},
       {label:'Skupiasz się na grze — motywujesz drużynę przez złość (forma +6)',
        effect:function(){
          // Złość motywuje — skład dostaje boost formy
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+6);});
          addNews('[Szatnia] Trener zamienił frustrację w motywację. Drużyna zmobilizowana.','ok');
          kron.flags._sp08result='motivated';
        },
        outcome:function(){
          return 'Złość zamieniona w energię. Cały skład forma +6. Czas pokazać im na boisku.';
        }},
       {label:'Publicznie ostrzegasz sędziego w mediach (ryzyko kary, skład forma +3)',
        effect:function(){
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
          if(Math.random()<0.40){
            // Liga ukarała za wypowiedź
            G.budget=Math.max(0,G.budget-8000);
            G.reputation=Math.max(0,(G.reputation||30)-8);
            addNews('[Liga] Kara za wypowiedź medialna: -8 000 zł, reputacja -8. Ale drużyna nabuzowana.','err');
            kron.flags._sp08result='punished';
          } else {
            G.reputation=Math.min(1000,(G.reputation||30)+3);
            addNews('[Media] Wypowiedź trenera zrobiła furorę. Reputacja +3, skład forma +3.','ok');
            kron.flags._sp08result='praised';
          }
        },
        outcome:function(){
          if(kron.flags._sp08result==='punished')return 'Liga ukarała za wypowiedź: -8 000 zł, reputacja -8. Skład forma +3.';
          return 'Media po Twojej stronie. Reputacja: '+(G.reputation||0)+' (+3). Skład forma +3.';
        }},
     ]},

    // ── PRIORYTET 2 — KONTEKST SEZONOWY ─────────────────────────────────

    // X-01: Pierwsze mistrzostwo (jednorazowy event)
    {id:'x01_first_title', category:'🏆 HISTORIA',
     weight:function(){
       // Trigger: właśnie wygrałeś ligę po raz pierwszy (trophies ma dokładnie 1 ligowe)
       if(!G.trophies)return 0;
       const leagueTrophies=(G.trophies||[]).filter(function(t){return t.type==='league';});
       if(leagueTrophies.length!==1)return 0;// dokładnie jedno = dopiero co zdobyte
       // Nie powtarzaj w tym samym sezonie
       const justWon=leagueTrophies[0].season===G.season;
       return justWon?50:0;
     },
     title:'Pierwsze mistrzostwo!',
     body:function(){
       const trophy=(G.trophies||[]).find(function(t){return t.type==='league';});
       kron.flags._x01league=trophy?trophy.leagueName:'Liga';
       kron.flags._x01season=G.season;
       return 'Koniec sezonu '+G.season+'. Twój klub po raz pierwszy w historii zdobył tytuł mistrza — '+(trophy?trophy.leagueName:'ligi')+'! Media szaleją, kibice na ulicach. Jak przejdziecie do historii?';
     },
     choices:[
       {label:'Sala sławy i tablica pamiątkowa na stadionie (-15 000 zł, rep +25)',
        effect:function(){
          if(G.budget<15000){
            notif('Brak budżetu na upamiętnienie!','err');
            G.reputation=Math.min(1000,(G.reputation||30)+10);
            kron.flags._x01result='noBudget';
            return;
          }
          G.budget-=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:15000,bal:G.budget,season:G.season,note:'Kronika: sala sław (pierwsze mistrzostwo)'});
          G.reputation=Math.min(1000,(G.reputation||30)+25);
          // Trwały ślad — flaga na G żeby inne eventy wiedziały
          G.flags=G.flags||{};
          G.flags.firstTitleSeason=G.season;
          G.flags.firstTitleLeague=kron.flags._x01league;
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});
          addNews('[Historia] Sala sławy otwarta! Pierwsze mistrzostwo uwiecznione na stadionie. Reputacja +25.','ok');
          kron.flags._x01result='monument';
        },
        outcome:function(){
          if(kron.flags._x01result==='noBudget')return 'Brak budżetu — bez tablicy. Reputacja i tak +10 za sam tytuł.';
          return 'Sala sławy i tablica gotowe! -15 000 zł. Reputacja: '+(G.reputation||0)+' (+25). Skład forma +8.';
        }},
       {label:'Wielka parada miejska — oddajesz chwałę kibicom (rep +20, bez kosztów)',
        effect:function(){
          G.reputation=Math.min(1000,(G.reputation||30)+20);
          G.flags=G.flags||{};
          G.flags.firstTitleSeason=G.season;
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+6);});
          addNews('[Historia] Parada przez miasto! Tysiące kibiców świętuje pierwsze mistrzostwo.','ok');
          kron.flags._x01result='parade';
        },
        outcome:function(){
          return 'Parada była legendarna. Reputacja: '+(G.reputation||0)+' (+20). Skład forma +6.';
        }},
       {label:'Skromna uroczystość — pieniądze na wzmocnienia (sponsor daje +5 000 zł, rep +8)',
        effect:function(){
          G.budget+=5000;
          G.reputation=Math.min(1000,(G.reputation||30)+8);
          G.flags=G.flags||{};
          G.flags.firstTitleSeason=G.season;
          addNews('[Historia] Skromne świętowanie — klub myśli już o kolejnym sezonie. Sponsor nagrodził +5 000 zł.','budget');
          kron.flags._x01result='modest';
        },
        outcome:function(){
          return 'Skromnie ale konkretnie. Budżet +5 000 zł, reputacja: '+(G.reputation||0)+' (+8). Oczy na przód.';
        }},
     ]},

    // X-02: Kryzys spadkowy — ultimatum zarządu
    {id:'x02_relegation_crisis', category:'💥 KRYZYS',
     weight:function(){
       // Trigger: round≥15, jesteśmy w strefie spadkowej (ostatnie 3 miejsca)
       if((G.round||0)<15)return 0;
       if(!G.standing||!G.standing.length)return 0;
       const sorted=[...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
       const total=sorted.length;
       const myIdx=sorted.findIndex(function(s){return parseInt(s.cid)===parseInt(G.myClubId);});
       const myPos=myIdx+1;
       // Strefa spadkowa = ostatnie 3 miejsca
       const inRelegation=myPos>=total-2;
       return inRelegation?45:0;
     },
     title:'Zarząd stawia ultimatum',
     body:function(){
       const sorted=[...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
       const total=sorted.length;
       const myIdx=sorted.findIndex(function(s){return parseInt(s.cid)===parseInt(G.myClubId);});
       const myPos=myIdx+1;
       const ptsToSafe=sorted[total-4]?(sorted[total-4].pts-(sorted[myIdx]?sorted[myIdx].pts:0)):5;
       kron.flags._x02myPos=myPos;
       kron.flags._x02total=total;
       kron.flags._x02ptsToSafe=Math.max(1,ptsToSafe);
       const roundsLeft=(G.standing[0]?(G.standing[0].p||0):0);
       const totalRounds=(total-1)*2;
       kron.flags._x02roundsLeft=Math.max(1,totalRounds-roundsLeft);
       return 'Miejsce '+myPos+' na '+total+'. Brakuje '+Math.max(1,ptsToSafe)+' pkt do bezpiecznej strefy. Zarząd wezwał Cię na pilne spotkanie: "Masz '+kron.flags._x02roundsLeft+' kolejek. Albo wyniki, albo zmiany."';
     },
     choices:[
       {label:'Akceptujesz presję — mowa motywacyjna do szatni (skład morale +12, rep -5)',
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-5);
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+12);});
          addNews('[Zarząd] Ultimatum przyjęte. Trener zmobilizował szatnię — wszyscy walczą o przetrwanie.','ok');
          kron.flags._x02result='motivated';
        },
        outcome:function(){
          return 'Szatnia zmobilizowana. Cały skład forma +12. Reputacja: '+(G.reputation||0)+' (-5). Teraz czas na punkty.';
        }},
       {label:'Rezygnujesz z części budżetu na wzmocnienia (-20 000 zł, możesz kupić z FA)',
        effect:function(){
          if(G.budget<20000){
            notif('Niewystarczający budżet!','err');
            // Mimo to szatnia dostaje małe wzmocnienie moralne
            myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
            kron.flags._x02result='noBudget';
            return;
          }
          G.budget-=20000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:20000,bal:G.budget,season:G.season,note:'Kronika: kryzysowy transfer (zarząd)'});
          // Znajdź najlepszego dostępnego FA i podpisz
          if(G.fa&&G.fa.length){
            const rescue=G.fa.filter(function(p){return ovr(p)>=50;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
            if(rescue){
              fillHistoryGaps(rescue);
              rescue.clubId=G.myClubId;rescue.starter=false;rescue.status='active';
              rescue.isFreeAgent=false;rescue.contract=1;rescue._seasonsAtClub=0;
              rescue.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'Twój klub',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(rescue),avgRat:null,_current:true});
              G.fa=G.fa.filter(function(p){return p.id!==rescue.id;});
              G.players.push(rescue);
              addNews('[Ratunek] '+rescue.name+' (OVR '+ovr(rescue)+') podpisał kontrakt kryzysowy! -20 000 zł.','budget');
              kron.flags._x02rescueName=rescue.name;
            }
          }
          kron.flags._x02result='transfer';
        },
        outcome:function(){
          if(kron.flags._x02result==='noBudget')return 'Brak budżetu na wzmocnienie. Skład morale +5. Musisz sobie poradzić tym co masz.';
          return 'Kryzysowy transfer wykonany! '+(kron.flags._x02rescueName||'Nowy zawodnik')+' dołącza. Budżet -20 000 zł.';
        }},
       {label:'Kontratak — publicznie krytykujesz zarząd (rep -15, skład forma +15)',
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-15);
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+15);});
          addNews('[Kryzys] Trener stanął murem za drużyną, atakując zarząd publicznie. Szatnia zjednoczona.','err');
          kron.flags._x02result='rebel';
        },
        outcome:function(){
          return 'Odwaga kosztuje. Reputacja: '+(G.reputation||0)+' (-15). Ale szatnia forma +15 — grają dla trenera, nie dla zarządu.';
        }},
     ]},

    // X-03: Noc przed awansem
    {id:'x03_promotion_eve', category:'🏆 HISTORIA',
     weight:function(){
       // Trigger: jesteśmy na 1. miejscu w ostatnich 3 kolejkach sezonu, liga nie jest najwyższa
       if(!G.standing||!G.standing.length)return 0;
       if((G.myLeague||8)<=1)return 0;// już w najwyższej
       const sorted=[...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
       const myPos=sorted.findIndex(function(s){return parseInt(s.cid)===parseInt(G.myClubId);})+1;
       if(myPos!==1)return 0;
       // Ostatnie 3 kolejki — sprawdź ile meczów zostało
       const totalRounds=(G.standing.length-1)*2;
       const played=G.standing[0]?(G.standing[0].p||0):0;
       const roundsLeft=totalRounds-played;
       return (roundsLeft<=3&&roundsLeft>=1)?40:0;
     },
     title:'Noc przed awansem',
     body:function(){
       const sorted=[...G.standing].sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga);});
       const second=sorted[1];
       const myEntry=sorted[0];
       const lead=myEntry&&second?(myEntry.pts-second.pts):0;
       kron.flags._x03lead=lead;
       const nextLeague=LEAGUE_NAMES[(G.myLeague||8)-1]||'wyższa liga';
       kron.flags._x03nextLeague=nextLeague;
       const totalRounds=(G.standing.length-1)*2;
       const played=G.standing[0]?(G.standing[0].p||0):0;
       kron.flags._x03roundsLeft=(totalRounds-played);
       return 'Prowadzisz tabele o '+lead+' pkt. Do końca sezonu zostały '+kron.flags._x03roundsLeft+' kolejki. Jeden dobry wynik może dać awans do '+nextLeague+'. Jak motywujesz drużynę przed decydującymi meczami?';
     },
     choices:[
       {label:'Wielka mowa motywacyjna — "gramy dla historii" (50/50: forma +10 lub bez efektu)',
        effect:function(){
          if(Math.random()<0.50){
            starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+10);});
            addNews('[Szatnia] Mowa trenera przeszła do legendy. Drużyna nabuzowana przed decydującymi meczami.','ok');
            kron.flags._x03result='speechWin';
          } else {
            addNews('[Szatnia] Mowa trenera nie trafiła w serca. Drużyna skupiona, ale bez dodatkowego ognia.','club');
            kron.flags._x03result='speechFail';
          }
        },
        outcome:function(){
          if(kron.flags._x03result==='speechWin')return 'Mowa trafiła w serce! Cały skład forma +10. Czas na historię.';
          return 'Mowa nie zapaliła. Brak efektu. Drużyna gra swoje — może wystarczy.';
        }},
       {label:'Premia za awans dla każdego zawodnika (-20 000 zł, forma +8 gwarantowane)',
        effect:function(){
          if(G.budget<20000){
            notif('Brak budżetu na premię!','err');
            starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});
            kron.flags._x03result='noBudget';
            return;
          }
          G.budget-=20000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:20000,bal:G.budget,season:G.season,note:'Kronika: premia przed awansem'});
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});
          addNews('[Szatnia] Premia awansowa ogłoszona. Każdy zawodnik wie co walczy. Forma rośnie.','budget');
          kron.flags._x03result='bonus';
        },
        outcome:function(){
          if(kron.flags._x03result==='noBudget')return 'Brak budżetu na premię. Skład forma +4 — sam entuzjazm.';
          return 'Premia ogłoszona! Budżet -20 000 zł. Cały skład forma +8. Motywacja finansowa działa.';
        }},
       {label:'Wyjazd integracyjny dzień przed meczem (-8 000 zł, forma +5, rep +5)',
        effect:function(){
          if(G.budget<8000){
            notif('Brak budżetu na wyjazd!','err');
            kron.flags._x03result='noBudget2';
            return;
          }
          G.budget-=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:8000,bal:G.budget,season:G.season,note:'Kronika: kara za protest (sędzia)'});
          G.reputation=Math.min(1000,(G.reputation||30)+5);
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          addNews('[Szatnia] Wyjazd integracyjny przed decydującymi meczami. Jedność drużyny na poziomie.','ok');
          kron.flags._x03result='trip';
        },
        outcome:function(){
          if(kron.flags._x03result==='noBudget2')return 'Brak budżetu na wyjazd.';
          return 'Wyjazd udany! -8 000 zł. Skład forma +5, reputacja: '+(G.reputation||0)+' (+5).';
        }},
     ]},

    // X-04: Rywal buduje dynastię
    {id:'x04_dynasty_threat', category:'💥 KRYZYS',
     weight:function(){
       // Trigger: G.rival istnieje i rywal jest znacznie silniejszy + sezon≥3
       if(!G.rival)return 0;
       if((G.season||1)<3)return 0;
       // Rywal musi być silniejszy o przynajmniej 8 pkt OVR
       const myAvgOvr=myPl().length?Math.round(myPl().reduce(function(s,p){return s+ovr(p);},0)/myPl().length):50;
       const rivalStr=G.rival.strength||50;
       return (rivalStr>myAvgOvr+8)?30:0;
     },
     title:'Rywal buduje dynastię',
     body:function(){
       const myAvgOvr=myPl().length?Math.round(myPl().reduce(function(s,p){return s+ovr(p);},0)/myPl().length):50;
       const rivalStr=G.rival.strength||50;
       const gap=rivalStr-myAvgOvr;
       kron.flags._x04gap=gap;
       kron.flags._x04rivalName=(G.rival&&G.rival.n)||'Rywal';
       return (G.rival?G.rival.n:'Rywal')+' dominuje ligę od '+Math.floor(gap/3)+' sezonów. Ich średnia OVR przewyższa Twoją o '+gap+' punktów. Media pytają: "Czy to już koniec ery '+( G.myClub?G.myClub.n:'Twojego klubu')+'?" Jak odpowiadasz?';
     },
     choices:[
       {label:'Ignorujesz — skupiasz się na własnej grze (rep +5, nic więcej)',
        effect:function(){
          G.reputation=Math.min(1000,(G.reputation||30)+5);
          addNews('[Media] Trener odmawia komentarza o rywalu: "Skupiamy się na sobie." Media doceniają spokój.','ok');
          kron.flags._x04result='ignored';
        },
        outcome:function(){
          return 'Spokój jako odpowiedź. Reputacja: '+(G.reputation||0)+' (+5). Czas pokaże kto miał rację.';
        }},
       {label:'Inwestujesz w akademię — odpowiedź długoterminowa (rep +10, akademia awansuje)',
        effect:function(){
          G.reputation=Math.min(1000,(G.reputation||30)+10);
          // Wzmocnij akademię jeśli istnieje
          if(G.academy){
            if(G.academy.level!==undefined)G.academy.level=Math.min(5,(G.academy.level||0)+1);
            // Dodaj nowego prospecta jeśli jest miejsce
            if(G.academy.prospects&&G.academy.prospects.length<6){
              const youngster={
                id:Date.now()+Math.floor(Math.random()*1000),
                name:tStr('first')+' '+tStr('last'),
                age:15+Math.floor(Math.random()*3),
                pos:['NAP','POL','OBR'][Math.floor(Math.random()*3)],
                potential:60+Math.floor(Math.random()*20),
                stars:2+Math.floor(Math.random()*2),
                seasonsInAcademy:0,
                fromAcademy:true,
                _dynastyResponse:true
              };
              G.academy.prospects.push(youngster);
              kron.flags._x04prodigyName=youngster.name;
            }
          }
          addNews('[Akademia] Inwestycja w przyszłość jako odpowiedź na dominację rywala. '+(kron.flags._x04prodigyName?kron.flags._x04prodigyName+' dołącza do akademii.':''),'ok');
          kron.flags._x04result='academy';
        },
        outcome:function(){
          const pName=kron.flags._x04prodigyName;
          return 'Akademia wzmocniona! Reputacja: '+(G.reputation||0)+' (+10). '+(pName?pName+' to nowy prospect.':'Poziom akademii wzrósł.');
        }},
       {label:'Wielki transfer — odpowiadasz siłą (+OVR, kosztowne)',
        effect:function(){
          // Znajdź najlepszego FA i podpisz drogo
          if(!G.fa||!G.fa.length){
            notif('Brak wolnych agentów na rynku!','err');
            kron.flags._x04result='noFA';
            return;
          }
          const star=G.fa.filter(function(p){return ovr(p)>=55;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
          if(!star){kron.flags._x04result='noFA';return;}
          const cost=Math.round((star.value||40000)*0.80/1000)*1000;
          if(G.budget<cost){
            notif('Brak budżetu na gwiazdorski transfer!','err');
            kron.flags._x04result='noBudget';
            return;
          }
          G.budget-=cost;
          fillHistoryGaps(star);
          star.clubId=G.myClubId;star.starter=false;star.status='active';
          star.isFreeAgent=false;star.contract=r(2,3);star._seasonsAtClub=0;
          star.history.push({season:G.season,clubId:G.myClubId,club:G.myClub?G.myClub.n:'Twój klub',m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(star),avgRat:null,_current:true});
          G.fa=G.fa.filter(function(p){return p.id!==star.id;});
          G.players.push(star);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:star.name,val:cost,fee:cost,week:G.week,season:G.season});
          // Rywal słabnie psychicznie — obniż symboliczne
          if(G.rival.strength!==undefined)G.rival.strength=Math.max(0,(G.rival.strength||50)-3);
          addNews('[Transfer] '+star.name+' (OVR '+ovr(star)+') odpowiedzią na dynastię rywala! Budżet: -'+fmtVal(cost)+'.','budget');
          kron.flags._x04result='transfer';kron.flags._x04starName=star.name;kron.flags._x04cost=cost;
        },
        outcome:function(){
          if(kron.flags._x04result==='noFA')return 'Brak odpowiednich graczy na rynku. Dynastia rywala trwa.';
          if(kron.flags._x04result==='noBudget')return 'Brak budżetu na gwiazdę. Musisz znaleźć inną odpowiedź.';
          return (kron.flags._x04starName||'Nowy zawodnik')+' w drużynie! Budżet -'+fmtVal(kron.flags._x04cost||0)+'. Rywal siła -3.';
        }},
     ]},

    // ── PRIORYTET 3 — NOWE MECHANIKI ────────────────────────────────────

    {id:'sp09_tactics_leak', category:'⚽ SPORTOWE',
     weight:function(){
       if(!G.rival)return 0;
       if((G.round||0)<8)return 0;
       const hist=G.mHist||[];
       const lostRecently=hist.slice(-6).some(function(m){
         return m.isMyH?(m.hg<m.ag):(m.ag<m.hg);
       });
       return lostRecently?20:0;
     },
     title:'Rywal zna Twoją taktykę',
     body:function(){
       kron.flags._sp09rivalName=(G.rival&&G.rival.n)||'Rywal';
       kron.flags._sp09formation=G.formation||'4-3-3';
       return 'Analityk '+(G.rival?G.rival.n:'Rywala')+' opublikował w mediach szczegółową rozbiorkę Twojej formacji '+(G.formation||'4-3-3')+'. Schematy pressingu, ustawienia przy stałych fragmentach, rotacje — wszystko ujawnione. Jak reagujesz?';
     },
     choices:[
       {label:'Zmieniasz formację — element zaskoczenia (forma -5)',
        effect:function(){
          const formations=['4-3-3','4-4-2','3-5-2','5-3-2','4-2-4'];
          const current=G.formation||'4-3-3';
          const alts=formations.filter(function(f){return f!==current;});
          const newForm=alts[Math.floor(Math.random()*alts.length)];
          kron.flags._sp09oldForm=current;
          kron.flags._sp09newForm=newForm;
          starters.forEach(function(p){p.form=Math.max(40,(p.form||80)-5);});
          G.formation=newForm;
          addNews('[Taktyka] Formacja zmieniona z '+current+' na '+newForm+'. Skład forma -5.','club');
          kron.flags._sp09result='changed';
        },
        outcome:function(){
          return 'Formacja: '+(kron.flags._sp09oldForm||'stara')+' → '+(kron.flags._sp09newForm||'nowa')+'. Skład forma -5. Rywal dezorientowany.';
        }},
       {label:'Podwajasz trening taktyczny (-5 000 zł, forma +3)',
        effect:function(){
          if(G.budget<5000){notif('Brak budżetu!','err');kron.flags._sp09result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:'Kronika: podwójny trening taktyczny'});
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
          addNews('[Trening] Intensywna analiza taktyczna. Skład forma +3.','ok');
          kron.flags._sp09result='trained';
        },
        outcome:function(){
          if(kron.flags._sp09result==='noBudget')return 'Brak budżetu na dodatkowy trening.';
          return 'Trening taktyczny wykonany. -5 000 zł. Skład forma +3.';
        }},
       {label:'Blefujesz w mediach — dajesz fałszywy plan (rep +5, rywal siła -2)',
        effect:function(){
          G.reputation=Math.min(1000,(G.reputation||30)+5);
          if(G.rival&&G.rival.strength!==undefined)G.rival.strength=Math.max(0,(G.rival.strength||50)-2);
          addNews('[Media] Trener podał mediom fałszywy plan taktyczny. '+(kron.flags._sp09rivalName||'Rywal')+' się pomyli.','ok');
          kron.flags._sp09result='bluff';
        },
        outcome:function(){
          return 'Blef w mediach! Reputacja: '+(G.reputation||0)+' (+5). '+(kron.flags._sp09rivalName||'Rywal')+' siła -2.';
        }},
     ]},

    {id:'m06_naming_rights', category:'💰 FINANSE',
     weight:function(){
       if((G.season||1)<3)return 0;
       if((G.reputation||0)<150)return 0;
       if(kron.flags._m06sponsorActive)return 0;
       return 18;
     },
     title:'Sponsor koszulkowy — oferta',
     body:function(){
       kron.flags._m06annual=15000;
       return 'Firma "MaxBet Plus" oferuje umowę na 3 sezony: 15 000 zł rocznie za umieszczenie logo na koszulkach. Łącznie '+fmtVal(45000)+'. Część kibiców może protestować zależnie od Twojej reputacji.';
     },
     choices:[
       {label:'Podpisujesz umowę (+15 000 zł, pierwsza rata od razu)',
        effect:function(){
          G.budget+=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:15000,cost:0,bal:G.budget,season:G.season,note:'Kronika: kontrakt sponsorski koszulki'});
          kron.flags._m06sponsorActive=true;
          kron.flags._m06seasonsLeft=2;
          if((G.reputation||0)>=300){
            G.reputation=Math.max(0,(G.reputation||30)-5);
            addNews('[Sponsor] Kontrakt koszulkowy: +15 000 zł. Część kibiców niezadowolona — rep -5.','budget');
          } else {
            addNews('[Sponsor] Kontrakt koszulkowy podpisany! +15 000 zł. Kibice rozumieją.','budget');
          }
          kron.flags._m06result='signed';
        },
        outcome:function(){
          return 'Umowa podpisana! +15 000 zł. '+((G.reputation||0)<300?'Kibice ok.':'Rep -5 — bogaci kibice nie lubią reklam.');
        }},
       {label:'Odrzucasz — niezależność klubu (rep +8)',
        effect:function(){
          G.reputation=Math.min(1000,(G.reputation||30)+8);
          addNews('[Klub] Oferta sponsorska odrzucona. Wartości nad pieniądzem. Rep +8.','ok');
          kron.flags._m06result='refused';
        },
        outcome:function(){
          return 'Oferta odrzucona. Reputacja: '+(G.reputation||0)+' (+8). Wizerunek czysty.';
        }},
       {label:'Negocjujesz 20 000 zł/sezon (60% szans)',
        effect:function(){
          if(Math.random()<0.60){
            G.budget+=20000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:20000,cost:0,bal:G.budget,season:G.season,note:'Kronika: premia za wyniki (zarząd)'});
            kron.flags._m06sponsorActive=true;
            kron.flags._m06seasonsLeft=2;
            kron.flags._m06annual=20000;
            addNews('[Sponsor] Negocjacje udane! 20 000 zł/sezon. Budżet +20 000 zł.','budget');
            kron.flags._m06result='negotiated';
          } else {
            addNews('[Sponsor] Negocjacje nieudane — firma wybrała inny klub.','err');
            kron.flags._m06result='failed';
          }
        },
        outcome:function(){
          if(kron.flags._m06result==='negotiated')return 'Negocjacje udane! 20 000 zł/sezon. Budżet +20 000 zł.';
          return 'Negocjacje spaliły na panewce. Okazja stracona.';
        }},
     ]},

    {id:'h01_hall_of_fame', category:'😤 SZATNIA',
     weight:function(){
       const legend=myPl().find(function(p){
         return (p.age||25)>=36&&(p._seasonsAtClub||0)>=4&&ovr(p)>=60&&!p.injured;
       });
       return legend?22:0;
     },
     title:'Legenda odchodzi na emeryturę',
     body:function(){
       const legend=myPl().filter(function(p){
         return (p.age||25)>=36&&(p._seasonsAtClub||0)>=4&&ovr(p)>=60&&!p.injured;
       }).sort(function(a,b){return (b._seasonsAtClub||0)-(a._seasonsAtClub||0);})[0];
       kron.flags._h01legendId=legend?legend.id:-1;
       kron.flags._h01legendName=legend?legend.name:'Zawodnik';
       kron.flags._h01seasons=legend?(legend._seasonsAtClub||4):4;
       return (legend?legend.name:'Zawodnik')+' ('+(legend?legend.age:'?')+' lat, '+(legend?legend._seasonsAtClub||4:4)+' sezony w klubie, OVR '+(legend?ovr(legend):'?')+') ogłasza koniec kariery. Liga proponuje wpis do galerii sław. Jak go żegnasz?';
     },
     choices:[
       {label:'Wspierasz wpis do galerii sław ligi (-5 000 zł, rep +10, morale +5)',
        effect:function(){
          if(G.budget<5000){notif('Brak budżetu!','err');kron.flags._h01result='noBudget';return;}
          G.budget-=5000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:5000,bal:G.budget,season:G.season,note:'Kronika: wyjazd integracyjny'});
          G.reputation=Math.min(1000,(G.reputation||30)+10);
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});
          G.flags=G.flags||{};
          if(!G.flags.hallOfFame)G.flags.hallOfFame=[];
          G.flags.hallOfFame.push({name:kron.flags._h01legendName,season:G.season,seasons:kron.flags._h01seasons});
          addNews('[Historia] '+kron.flags._h01legendName+' w galerii sław ligi! Rep +10.','ok');
          kron.flags._h01result='hallOfFame';
        },
        outcome:function(){
          if(kron.flags._h01result==='noBudget')return 'Brak budżetu — bez wpisu do galerii.';
          return kron.flags._h01legendName+' w galerii sław! -5 000 zł. Rep: '+(G.reputation||0)+' (+10). Morale składu +5.';
        }},
       {label:'Złota odprawa klubowa (-15 000 zł, morale +8, rep +15)',
        effect:function(){
          if(G.budget<15000){notif('Brak budżetu na odprawę!','err');kron.flags._h01result='noBudget2';return;}
          G.budget-=15000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:15000,bal:G.budget,season:G.season,note:'Kronika: złota odprawa (legenda)'});
          G.reputation=Math.min(1000,(G.reputation||30)+15);
          starters.forEach(function(p){p.form=Math.min(100,(p.form||80)+8);});
          G.flags=G.flags||{};
          if(!G.flags.hallOfFame)G.flags.hallOfFame=[];
          G.flags.hallOfFame.push({name:kron.flags._h01legendName,season:G.season,seasons:kron.flags._h01seasons,golden:true});
          addNews('[Historia] '+kron.flags._h01legendName+' otrzymał złotą odprawę. Legenda klubu.','ok');
          kron.flags._h01result='golden';
        },
        outcome:function(){
          if(kron.flags._h01result==='noBudget2')return 'Brak budżetu na odprawę. Legenda odchodzi bez należytego pożegnania.';
          return 'Złota odprawa! -15 000 zł. Rep: '+(G.reputation||0)+' (+15). Skład morale +8.';
        }},
       {label:'Nie angażujesz się — odejdzie sam po sezonie (nic)',
        effect:function(){kron.flags._h01result='ignored';},
        outcome:function(){return kron.flags._h01legendName+' odchodzi cicho. Bez kosztów, bez premii.';}},
     ]},

    {id:'tr01_training_accident', category:'💥 KRYZYS',
     weight:function(){
       if((G.round||0)<3||(G.round||0)>25)return 0;
       const noInjuries=myPl().every(function(p){return !p.injured;});
       return noInjuries?15:0;
     },
     title:'Wypadek na treningu',
     body:function(){
       const atRisk=myPl().filter(function(p){return p.starter&&!p.injured;});
       const victim=atRisk.length?atRisk[Math.floor(Math.random()*atRisk.length)]:null;
       kron.flags._tr01victimId=victim?victim.id:-1;
       kron.flags._tr01victimName=victim?victim.name:'Zawodnik';
       return (victim?victim.name:'Zawodnik')+' ('+(victim?victim.pos:'?')+') skręcił kostkę podczas rozgrzewki. Lekarz: "To wina zużytego sprzętu na boisku treningowym." Bez wymiany infrastruktury podobne wypadki będą się powtarzać.';
     },
     choices:[
       {label:'Inwestujesz w nowy sprzęt treningowy (-12 000 zł, bezpieczeństwo wzrasta)',
        effect:function(){
          if(G.budget<12000){notif('Brak budżetu!','err');kron.flags._tr01result='noBudget';return;}
          G.budget-=12000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:12000,bal:G.budget,season:G.season,note:'Kronika: nowy sprzęt bezpieczeństwa'});
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          if(victim){victim.injured=true;victim.injuredWeeks=1+Math.floor(Math.random()*2);victim.starter=false;}
          G.flags=G.flags||{};
          G.flags.trainingUpgrade=true;
          G.flags.trainingUpgradeSeason=G.season;
          addNews('[Trening] Nowy sprzęt zamówiony! -12 000 zł. '+(victim?victim.name+' kontuzja '+victim.injuredWeeks+' tyg.':'')+' Bezpieczeństwo wzrosło.','budget');
          kron.flags._tr01result='upgraded';
        },
        outcome:function(){
          if(kron.flags._tr01result==='noBudget')return 'Brak budżetu — sprzęt bez zmian. Ryzyko pozostaje.';
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          return 'Sprzęt wymieniony! -12 000 zł. '+(victim?victim.name+' kontuzja '+victim.injuredWeeks+' tyg. ':'')+' Ryzyko kontuzji niższe w tym sezonie.';
        }},
       {label:'Zgłaszasz do ubezpieczyciela — darmowe, 3 tyg. przestoju (forma -3)',
        effect:function(){
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          if(victim){victim.injured=true;victim.injuredWeeks=2;victim.starter=false;}
          starters.filter(function(p){return !p.injured;}).forEach(function(p){p.form=Math.max(40,(p.form||80)-3);});
          addNews('[Ubezpieczenie] Sprawa zgłoszona. Treningi ograniczone 3 tyg. Skład forma -3.','club');
          kron.flags._tr01result='insurance';
        },
        outcome:function(){
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          return 'Ubezpieczyciel przejmuje sprawę. Bez kosztów, ale '+(victim?victim.name+' kontuzja 2 tyg., ':'')+' skład forma -3.';
        }},
       {label:'Zatuszowujesz — "tak miało być" (rep -8, ofiara forma -10, _wantsOut)',
        effect:function(){
          G.reputation=Math.max(0,(G.reputation||30)-8);
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          if(victim){victim.form=Math.max(20,(victim.form||80)-10);victim._wantsOut=true;}
          addNews('[Kryzys] Wypadek zatuszowany. '+(victim?victim.name:'Zawodnik')+' czuje się zdradzony. Rep -8.','err');
          kron.flags._tr01result='covered';
        },
        outcome:function(){
          const victim=G.players.find(function(p){return p.id===kron.flags._tr01victimId;});
          return 'Zatuszowane. Rep: '+(G.reputation||0)+' (-8). '+(victim?victim.name+' forma -10, _wantsOut=true.':'');
        }},
     ]},

    // ── PRIORYTET 4 — AKADEMIA I DC ─────────────────────────────────────

    {id:'a05_prospect_burnout', category:'🎓 AKADEMIA',
     weight:function(){
       if(!G.academy||!G.academy.prospects||!G.academy.prospects.length)return 0;
       const burnout=G.academy.prospects.find(function(p){
         return (p.potential||0)>=75&&(p.seasonsInAcademy||0)>=2;
       });
       return burnout?20:0;
     },
     title:'Wypalenie talentu',
     body:function(){
       const burnout=(G.academy.prospects||[]).filter(function(p){
         return (p.potential||0)>=75&&(p.seasonsInAcademy||0)>=2;
       }).sort(function(a,b){return (b.potential||0)-(a.potential||0);})[0];
       kron.flags._a05prospectIdx=G.academy.prospects.indexOf(burnout);
       kron.flags._a05prospectName=burnout?burnout.name:'Talent';
       kron.flags._a05potential=burnout?(burnout.potential||75):75;
       return (burnout?burnout.name:'Twój talent')+' (potential '+(burnout?burnout.potential||75:75)+') sygnalizuje przez rodziców że potrzebuje przerwy. Trenuje bez przerwy od '+(burnout?burnout.seasonsInAcademy||2:2)+' sezonów i jest wyczerpany psychicznie.';
     },
     choices:[
       {label:'Dajesz mu wolne — przerwa 3 tygodnie (potential -2, wróci forma +15)',
        effect:function(){
          const p=G.academy.prospects[kron.flags._a05prospectIdx];
          if(p){p.potential=Math.max(50,(p.potential||75)-2);p._onBreak=true;p._breakWeeks=3;}
          addNews('[Akademia] '+kron.flags._a05prospectName+' dostał przerwę. Potential -2, wróci zmotywowany.','ok');
          kron.flags._a05result='break';
        },
        outcome:function(){
          return kron.flags._a05prospectName+' na urlopie. Potential: '+(kron.flags._a05potential-2)+' (-2). Wraca za 3 tygodnie forma +15.';
        }},
       {label:'Ignorujesz — "talent musi cierpieć" (30% szans potential -5)',
        effect:function(){
          const p=G.academy.prospects[kron.flags._a05prospectIdx];
          if(Math.random()<0.30&&p){
            p.potential=Math.max(40,(p.potential||75)-5);
            addNews('[Akademia] '+kron.flags._a05prospectName+' wypalił się. Potential -5.','err');
            kron.flags._a05result='burnout';
          } else {
            addNews('[Akademia] '+kron.flags._a05prospectName+' przetrwał presję. Na razie.','club');
            kron.flags._a05result='survived';
          }
        },
        outcome:function(){
          if(kron.flags._a05result==='burnout')return kron.flags._a05prospectName+' wypalił się! Potential: '+(kron.flags._a05potential-5)+' (-5).';
          return kron.flags._a05prospectName+' przetrwał presję. Brak strat tym razem.';
        }},
       {label:'Wysyłasz do psychologa sportowego (-8 000 zł, potential +1)',
        effect:function(){
          if(G.budget<8000){notif('Brak budżetu!','err');kron.flags._a05result='noBudget';return;}
          G.budget-=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:8000,bal:G.budget,season:G.season,note:'Kronika: psycholog sportowy'});
          const p=G.academy.prospects[kron.flags._a05prospectIdx];
          if(p){p.potential=Math.min(99,(p.potential||75)+1);p._psychSupport=true;}
          addNews('[Akademia] '+kron.flags._a05prospectName+' pod opieką psychologa. Potential +1.','ok');
          kron.flags._a05result='psych';
        },
        outcome:function(){
          if(kron.flags._a05result==='noBudget')return 'Brak budżetu na psychologa.';
          return kron.flags._a05prospectName+' po sesjach. -8 000 zł. Potential: '+(kron.flags._a05potential+1)+' (+1).';
        }},
     ]},

    {id:'dc01_data_breach', category:'💰 FINANSE',
     weight:function(){
       if((G.season||1)<3)return 0;
       const hasScout=G.scout&&G.scout.level&&G.scout.level!=='free';
       const hasObserved=G.scout&&G.scout.observed&&G.scout.observed.length>0;
       return (hasScout||hasObserved)?18:0;
     },
     title:'Atak hakerski na dane skautingowe',
     body:function(){
       const obsCount=(G.scout&&G.scout.observed&&G.scout.observed.length)||0;
       kron.flags._dc01obsCount=obsCount;
       return 'Klub otrzymał alert bezpieczeństwa: nieznany haker wykradł dane skautingowe. '+(obsCount>0?'Obserwowałeś '+obsCount+' zawodników — ':'')+' Twoje raporty i rankingi są teraz jawne. Rywal może wiedzieć kogo planujesz kupić.';
     },
     choices:[
       {label:'Płacisz za zabezpieczenie systemu (-18 000 zł, dane bezpieczne)',
        effect:function(){
          if(G.budget<18000){notif('Brak budżetu!','err');kron.flags._dc01result='noBudget';return;}
          G.budget-=18000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:18000,bal:G.budget,season:G.season,note:'Kronika: zabezpieczenie systemu IT'});
          G.flags=G.flags||{};
          G.flags.dataSecure=true;
          G.flags.dataSecureSeason=G.season;
          addNews('[Bezpieczeństwo] System zabezpieczony. -18 000 zł. Dane skautingowe chronione.','budget');
          kron.flags._dc01result='secured';
        },
        outcome:function(){
          if(kron.flags._dc01result==='noBudget')return 'Brak budżetu — system niezabezpieczony.';
          return 'System zabezpieczony! -18 000 zł. Dane skautingowe znowu prywatne.';
        }},
       {label:'Ignorujesz — rywal przejmuje listę obserwowanych (FA traci 2 najlepszych)',
        effect:function(){
          if(G.fa&&G.fa.length>=2){
            const sorted=[...G.fa].sort(function(a,b){return ovr(b)-ovr(a);});
            const stolen=sorted.slice(0,2);
            kron.flags._dc01stolenNames=stolen.map(function(p){return p.name;}).join(', ');
            stolen.forEach(function(p){
              G.fa=G.fa.filter(function(x){return x.id!==p.id;});
              if(G.rival&&G.rival.strength!==undefined)G.rival.strength=(G.rival.strength||50)+1;
            });
            addNews('[Haker] Rywal przejął dane i podpisał '+(kron.flags._dc01stolenNames||'najlepszych FA')+'!','err');
          } else {
            addNews('[Haker] Dane wyciekły, FA był pusty. Brak bezpośredniej straty.','club');
          }
          kron.flags._dc01result='ignored';
        },
        outcome:function(){
          if(kron.flags._dc01stolenNames)return 'Rywal wykorzystał wyciek: '+(kron.flags._dc01stolenNames)+' znikli z FA. Rywal silniejszy.';
          return 'Dane wyciekły, FA był pusty. Tym razem miałeś szczęście.';
        }},
       {label:'Zgłaszasz do ligi — transparentność (rep +8, jeden FA i tak przepada)',
        effect:function(){
          G.reputation=Math.min(1000,(G.reputation||30)+8);
          if(G.fa&&G.fa.length){
            const lost=[...G.fa].sort(function(a,b){return ovr(b)-ovr(a);})[0];
            if(lost){G.fa=G.fa.filter(function(p){return p.id!==lost.id;});kron.flags._dc01lostName=lost.name;}
          }
          addNews('[Liga] Incydent zgłoszony. Rep +8. Dane i tak wyciekły — '+(kron.flags._dc01lostName||'jeden zawodnik')+' stracony.','ok');
          kron.flags._dc01result='reported';
        },
        outcome:function(){
          return 'Zgłoszenie do ligi: rep: '+(G.reputation||0)+' (+8). '+(kron.flags._dc01lostName||'Zawodnik')+' z FA przepadł.';
        }},
     ]},

  ]; // koniec KRON_EVENTS

  // ── FILTRUJ dostępne eventy ─────────────────────────────────────────
  const available=KRON_EVENTS.filter(function(ev){
    if(kron.usedThisSeason.indexOf(ev.id)>=0)return false;
    return ev.weight()>0;
  });
  if(!available.length)return;

  // ── LOSUJ event ważony ──────────────────────────────────────────────
  const totalW=available.reduce(function(s,ev){return s+ev.weight();},0);
  let rndW=Math.random()*totalW;
  let chosen=available[available.length-1];
  for(var ei=0;ei<available.length;ei++){rndW-=available[ei].weight();if(rndW<=0){chosen=available[ei];break;}}

  // ── Oznacz jako użyty, ustaw cooldown ──────────────────────────────
  kron.usedThisSeason.push(chosen.id);
  kron.cooldown=9; // v207: max 3 eventy w sezonie (~co 10 kolejek)

  // ── Rozwiąż dynamiczne body ─────────────────────────────────────────
  const resolvedBody=typeof chosen.body==='function'?chosen.body():chosen.body;

  // ── Pokaż modal ─────────────────────────────────────────────────────
  setTimeout(function(){kronShowModal(chosen,resolvedBody);},600);
}

// ── Odliczanie bench weeks co turę ──────────────────────────────────────
function kronUpdateBenchWeeks(){
  if(!G||!G.kronika)return;
  const kron=G.kronika;
  myPl().forEach(function(p){
    if(!p.starter&&!p.injured){p._benchWeeks=(p._benchWeeks||0)+1;}
    else{p._benchWeeks=0;}
  });
  // Odlicz cooldown
  if(kron.cooldown>0)kron.cooldown--;
  // Zlicz kontuzje ostatnich 4 tygodni (sliding window)
  if(!kron.flags._injHistory)kron.flags._injHistory=[];
  const newInj=myPl().filter(function(p){return p.injured&&p.injuryWeeks===p.injuryWeeks;}).length;
  kron.flags._injHistory.push(newInj);
  if(kron.flags._injHistory.length>4)kron.flags._injHistory.shift();
  kron.flags._injCount=kron.flags._injHistory.reduce(function(s,v){return s+v;},0);
  // Applyphysio bonus — redukuje szansę kontuzji o 30% (flaga sprawdzana w applyInjury override)
}

function aiSeasonalRefresh(){
  if(!G||!G.leagues)return;
  // Zamknięty świat: tylko starzenie i naturalne wzrosty atrybutów.
  // Brak wymiany zawodników z puli — uzupełnienie składu do min 22 odbywa się tylko z G.fa.
  G.leagues.forEach(lg=>{
    const _ovr4r=LEAGUE_OVR[lg.level]||[20,35,35,50];
    const nClubsR=lg.clubs.length;
    lg.clubs.filter(c=>c.id!==G.myClubId).forEach((c,ci)=>{
      const sq=G.players.filter(p=>p.clubId===c.id);
      // 1. Starzenie: zawodnicy 28+ tracą atrybuty
      sq.filter(p=>p.age>=28).forEach(p=>{
        const drop=p.age>=33?r(2,4):r(1,2);
        const attrs=['tec','pas','sht','def','phy','men'];
        for(let i=0;i<drop;i++){
          const a=attrs[Math.floor(Math.random()*attrs.length)];
          p[a]=Math.max(1,p[a]-1);
        }
        p.value=calcValue(ovr(p),p.age);
      });
      // 2. Naturalne wzrosty: zawodnicy <22 lat zyskują atrybuty
      sq.filter(p=>p.age<=22).forEach(p=>{
        const gain=r(1,2);
        const attrs=['tec','pas','sht','def','phy','men'];
        for(let i=0;i<gain;i++){
          const a=attrs[Math.floor(Math.random()*attrs.length)];
          if(ovr(p)<p.potential)p[a]=Math.min(99,p[a]+1);
        }
        p.value=calcValue(ovr(p),p.age);
      });
    });
  });
  // Uzupełnij skład do minimum 22 — tylko z G.fa (zamknięty świat)
  ALL_CLUBS.filter(c=>c.id!==G.myClubId).forEach(c=>{
    const sq=G.players.filter(p=>p.clubId===c.id);
    const missing=Math.max(0,22-sq.length);
    if(!missing)return;
    const lg=G.leagues?G.leagues.find(l=>l.clubs.some(x=>x.id===c.id)):null;
    const _ovr4c=lg?LEAGUE_OVR[lg.level]||[20,35,35,50]:[20,35,35,50];
    const [minO,maxO]=[_ovr4c[0],_ovr4c[3]];
    const season=G.season||1;
    for(let i=0;i<missing;i++){
      const faPool=(G.fa||[]).filter(p=>p.clubId===0&&p.status!=='retired'&&ovr(p)>=minO-5&&ovr(p)<=maxO+5);
      if(!faPool.length)break;
      faPool.sort((a,b)=>ovr(b)-ovr(a));
      const np=faPool[0];
      fillHistoryGaps(np);
      np.clubId=c.id;np.contract=r(1,3);np.starter=false;np.status='active';np.isFreeAgent=false;
      np.value=calcValue(ovr(np),np.age);np.salary=calcSalary(np.value,lg?lg.level:null,ovr(np));
      if(!np.history.find(h=>h._current&&h.season===season&&h.clubId===c.id)){
        np.history.push({season,clubId:c.id,club:c.n,m:0,g:0,a:0,yk:0,rk:0,cs:0,ga:0,ovr:ovr(np),avgRat:null,_current:true});
      }
      G.fa=G.fa.filter(p=>p!==np);
      G.players.push(np);
    }
  });
}

// ══════════════════════════════════════════════════════════════════
// PUCHAR MISTRZOWSKI — silnik (Wariant B: 2 mecze w tygodniu)
// 64 drużyny (8 najlepszych z każdej ligi) × 6 rund
// Rundy w tygodniach: 5, 10, 15, 21, 27, 33
// ══════════════════════════════════════════════════════════════════
