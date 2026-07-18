// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_transfers (Sesja 5, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec z Sesji 1: builder-
// funkcja zwracająca świeżą tablicę co tydzień). Żadnych domknięć nad
// my/starters/bestP/kron z zakresu kronTrigger() — wyłącznie globalne
// myPl()/ovr()/G, G.kronika.flags zamiast lokalnego kron.flags. Prefiks id:
// t (kontynuacja istniejącej numeracji t01/02/04/05/06/07 — patrz PLAN
// pkt 4.3, zakres t08-t19). Ton: humor w stylu Hattricka. t20/t21 (Sesja
// 12) to przykładowy ŁAŃCUCH MIĘDZYSEZONOWY nr 2 — wzorzec identyczny jak
// ac18/ac19 (Sesja 2): stan wyłącznie w G.flags (nigdy G.kronika.flags),
// wszystkie 3 wybory stage 1 ustawiają flagę (premisa dotyczy niezależnie
// od reakcji managera), stage 2 czyści flagę we wszystkich 3 wyborach.
//
// Korzysta z globalnych helperów zamkniętego świata zdefiniowanych w
// engine/kronika.js (kronFindSurplusPlayer/kronFindDestinationClub/
// kronTransferIn/kronTransferOut/kronAffordablePrice) — dostępne w runtime
// niezależnie od kolejności <script>, bo deklaracje function są w pełni
// zdefiniowane, zanim kronTrigger() kiedykolwiek się wykona (patrz index.html:
// ten plik i tak ładuje się przed kronika.js, więc kolejność jest zachowana).
// ══════════════════════════════════════════════════════════════════════════
function buildKronTransferyEvents(){

  function tfBenchPlayer(){
    return myPl().find(function(p){return !p.starter&&!p.injured;});
  }
  function tfContractRenewalCandidate(){
    return myPl().find(function(p){return p.starter&&(p.contract||1)<=2&&ovr(p)>=40&&ovr(p)<=61;});
  }
  function tfExpiringStarter(){
    return myPl().find(function(p){return p.starter&&(p.contract||1)<=1;});
  }
  function tfRumorTarget(){
    return myPl().filter(function(p){return p.starter&&ovr(p)>=55;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
  }
  function tfProdigalCandidate(){
    return G.players.find(function(p){
      return p.clubId!==G.myClubId&&p.formerClubs&&p.formerClubs.some(function(fc){return fc.clubId===G.myClubId;});
    });
  }
  function tfLoyaltyPledgeCandidate(){
    return myPl().find(function(p){return p.starter&&ovr(p)>=58&&(p.contract||1)>=2;});
  }
  function tfFindAnywhere(pid){
    var pool=(G.players||[]).concat(G.retiredPlayers||[]);
    return pool.find(function(p){return p.id===pid;})||null;
  }

  return [

    // T-08: Chaos w dniu zamknięcia okna transferowego
    {id:'t08_transfer_deadline_day_chaos', category:t('kron_cat_transfers'),
     weight:function(){
       var found=kronFindSurplusPlayer(50,99,30);
       return (found&&G.budget>=15000)?22:0;
     },
     title:t('kron_t08_title'),
     body:function(){
       var found=kronFindSurplusPlayer(50,99,30);
       var p=found?found.player:null;
       var cost=p?kronAffordablePrice(Math.round((p.value||40000)*0.85/1000)*1000,0.65):20000;
       G.kronika.flags._t08pid=p?p.id:-1;
       G.kronika.flags._t08clubId=found?found.fromClub.id:-1;
       G.kronika.flags._t08cost=cost;
       return t('kron_t08_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{ovr}',p?ovr(p):'?').replace('{club}',found?found.fromClub.n:t('kron_fallback_rival')).replace('{cost}',fmtVal(cost));
     },
     choices:[
       {label:t('kron_t08_c1_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t08pid;});
          var fromClub=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t08clubId;});
          var cost=G.kronika.flags._t08cost||20000;
          if(!p||!fromClub||p.clubId!==fromClub.id){G.kronika.flags._t08result='gone';return;}
          if(G.budget<cost){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t08result='noBudget';return;}
          G.budget-=cost;
          kronTransferIn(p,fromClub);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:p.name,val:cost,fee:cost,week:G.week,season:G.season});
          addNews(t('news_tr_gem_signed').replace('{name}',p.name).replace('{ovr}',ovr(p)).replace('{val}',fmtVal(cost)),'budget');
          G.kronika.flags._t08result='signed';G.kronika.flags._t08name=p.name;
        },
        outcome:function(){
          if(G.kronika.flags._t08result==='gone')return t('kron_t08_c1_outcome_gone');
          if(G.kronika.flags._t08result==='noBudget')return t('kron_t08_c1_outcome_nobudget');
          return t('kron_t08_c1_outcome').replace('{name}',G.kronika.flags._t08name||t('kron_fallback_player'));
        }},
       {label:t('kron_t08_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_t08_c2_outcome');}},
       {label:t('kron_t08_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t08pid;});
          var fromClub=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t08clubId;});
          if(!p||!fromClub||p.clubId!==fromClub.id){G.kronika.flags._t08result='gone';return;}
          var cheap=Math.round((G.kronika.flags._t08cost||20000)*0.65/1000)*1000;
          if(Math.random()<0.5){
            if(G.budget<cheap){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t08result='noBudget';return;}
            G.budget-=cheap;
            kronTransferIn(p,fromClub);
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'buy',name:p.name,val:cheap,fee:cheap,week:G.week,season:G.season});
            G.kronika.flags._t08result='negotiated';G.kronika.flags._t08name=p.name;G.kronika.flags._t08cheap=cheap;
          } else {
            G.kronika.flags._t08result='lost';
          }
        },
        outcome:function(){
          if(G.kronika.flags._t08result==='gone')return t('kron_t08_c3_outcome_gone');
          if(G.kronika.flags._t08result==='noBudget')return t('kron_t08_c3_outcome_nobudget');
          if(G.kronika.flags._t08result==='negotiated')return t('kron_t08_c3_outcome_win').replace('{name}',G.kronika.flags._t08name||t('kron_fallback_player')).replace('{val}',fmtVal(G.kronika.flags._t08cheap||0));
          return t('kron_t08_c3_outcome_lose');
        }},
     ]},

    // T-09: Zamieszanie na badaniach lekarskich
    {id:'t09_medical_exam_mishap', category:t('kron_cat_transfers'),
     weight:function(){
       var found=kronFindSurplusPlayer(45,99,32);
       return (found&&G.budget>=10000)?18:0;
     },
     title:t('kron_t09_title'),
     body:function(){
       var found=kronFindSurplusPlayer(45,99,32);
       var p=found?found.player:null;
       var cost=p?kronAffordablePrice(Math.round((p.value||35000)*0.55/1000)*1000,0.5):15000;
       G.kronika.flags._t09pid=p?p.id:-1;
       G.kronika.flags._t09clubId=found?found.fromClub.id:-1;
       G.kronika.flags._t09cost=cost;
       return t('kron_t09_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{ovr}',p?ovr(p):'?').replace('{club}',found?found.fromClub.n:t('kron_fallback_rival'));
     },
     choices:[
       {label:t('kron_t09_c1_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t09pid;});
          var fromClub=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t09clubId;});
          var cost=G.kronika.flags._t09cost||15000;
          if(!p||!fromClub||p.clubId!==fromClub.id){G.kronika.flags._t09result='gone';return;}
          if(G.budget<cost){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t09result='noBudget';return;}
          G.budget-=cost;
          kronTransferIn(p,fromClub);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:p.name,val:cost,fee:cost,week:G.week,season:G.season});
          addNews(t('news_tr_gem_signed').replace('{name}',p.name).replace('{ovr}',ovr(p)).replace('{val}',fmtVal(cost)),'budget');
          G.kronika.flags._t09result='signed';G.kronika.flags._t09name=p.name;
        },
        outcome:function(){
          if(G.kronika.flags._t09result==='gone')return t('kron_t09_c1_outcome_gone');
          if(G.kronika.flags._t09result==='noBudget')return t('kron_t09_c1_outcome_nobudget');
          return t('kron_t09_c1_outcome').replace('{name}',G.kronika.flags._t09name||t('kron_fallback_player'));
        }},
       {label:t('kron_t09_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_t09_c2_outcome');}},
       {label:t('kron_t09_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t09pid;});
          var fromClub=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t09clubId;});
          if(!p||!fromClub||p.clubId!==fromClub.id){G.kronika.flags._t09result='gone';return;}
          var cheap=Math.round((G.kronika.flags._t09cost||15000)*0.7/1000)*1000;
          if(Math.random()<0.5){
            if(G.budget<cheap){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t09result='noBudget';return;}
            G.budget-=cheap;
            kronTransferIn(p,fromClub);
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'buy',name:p.name,val:cheap,fee:cheap,week:G.week,season:G.season});
            G.kronika.flags._t09result='signed2';G.kronika.flags._t09name=p.name;
          } else {
            G.kronika.flags._t09result='fell_through';
          }
        },
        outcome:function(){
          if(G.kronika.flags._t09result==='gone')return t('kron_t09_c3_outcome_gone');
          if(G.kronika.flags._t09result==='noBudget')return t('kron_t09_c3_outcome_nobudget');
          if(G.kronika.flags._t09result==='signed2')return t('kron_t09_c3_outcome_win').replace('{name}',G.kronika.flags._t09name||t('kron_fallback_player'));
          return t('kron_t09_c3_outcome_lose');
        }},
     ]},

    // T-10: Nietypowa propozycja wymiany zawodników od agenta
    {id:'t10_agent_swap_deal', category:t('kron_cat_transfers'),
     weight:function(){
       var ours=tfBenchPlayer();
       var found=kronFindSurplusPlayer(40,99,30);
       return (ours&&found)?20:0;
     },
     title:t('kron_t10_title'),
     body:function(){
       var ours=tfBenchPlayer();
       var found=kronFindSurplusPlayer(40,99,30);
       var theirs=found?found.player:null;
       G.kronika.flags._t10oursId=ours?ours.id:-1;
       G.kronika.flags._t10theirsId=theirs?theirs.id:-1;
       G.kronika.flags._t10clubId=found?found.fromClub.id:-1;
       return t('kron_t10_body').replace('{ours}',ours?ours.name:t('kron_fallback_player')).replace('{theirs}',theirs?theirs.name:t('kron_fallback_player')).replace('{ovr}',theirs?ovr(theirs):'?').replace('{club}',found?found.fromClub.n:t('kron_fallback_rival'));
     },
     choices:[
       {label:t('kron_t10_c1_label'),
        effect:function(){
          var ours=G.players.find(function(x){return x.id===G.kronika.flags._t10oursId;});
          var theirs=G.players.find(function(x){return x.id===G.kronika.flags._t10theirsId;});
          var theirClub=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t10clubId;});
          if(!ours||!theirs||!theirClub||theirs.clubId!==theirClub.id||ours.clubId!==G.myClubId){G.kronika.flags._t10result='gone';return;}
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t10result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_t10_agent_swap_deal')});
          kronTransferOut(ours,theirClub);
          kronTransferIn(theirs,theirClub);
          G.kronika.flags._t10result='swapped';G.kronika.flags._t10oursName=ours.name;G.kronika.flags._t10theirsName=theirs.name;
        },
        outcome:function(){
          if(G.kronika.flags._t10result==='gone')return t('kron_t10_c1_outcome_gone');
          if(G.kronika.flags._t10result==='noBudget')return t('kron_t10_c1_outcome_nobudget');
          return t('kron_t10_c1_outcome').replace('{ours}',G.kronika.flags._t10oursName||t('kron_fallback_player')).replace('{theirs}',G.kronika.flags._t10theirsName||t('kron_fallback_player'));
        }},
       {label:t('kron_t10_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_t10_c2_outcome');}},
       {label:t('kron_t10_c3_label'),
        effect:function(){
          var ours=G.players.find(function(x){return x.id===G.kronika.flags._t10oursId;});
          var theirs=G.players.find(function(x){return x.id===G.kronika.flags._t10theirsId;});
          var theirClub=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t10clubId;});
          if(!ours||!theirs||!theirClub||theirs.clubId!==theirClub.id||ours.clubId!==G.myClubId){G.kronika.flags._t10result='gone';return;}
          if(Math.random()<0.4){
            kronTransferOut(ours,theirClub);
            kronTransferIn(theirs,theirClub);
            G.kronika.flags._t10result='freeswap';G.kronika.flags._t10oursName=ours.name;G.kronika.flags._t10theirsName=theirs.name;
          } else {
            G.kronika.flags._t10result='rejected';
          }
        },
        outcome:function(){
          if(G.kronika.flags._t10result==='gone')return t('kron_t10_c3_outcome_gone');
          if(G.kronika.flags._t10result==='freeswap')return t('kron_t10_c3_outcome_win').replace('{ours}',G.kronika.flags._t10oursName||t('kron_fallback_player')).replace('{theirs}',G.kronika.flags._t10theirsName||t('kron_fallback_player'));
          return t('kron_t10_c3_outcome_lose');
        }},
     ]},

    // T-11: Plotka o tajnej klauzuli odstępnego
    {id:'t11_release_clause_panic', category:t('kron_cat_transfers'),
     weight:function(){
       var p=myPl().find(function(p){return p.starter&&ovr(p)>=58&&(p.contract||1)>=2;});
       return p?16:0;
     },
     title:t('kron_t11_title'),
     body:function(){
       var p=myPl().filter(function(p){return p.starter&&ovr(p)>=58&&(p.contract||1)>=2;}).sort(function(a,b){return ovr(b)-ovr(a);})[0];
       G.kronika.flags._t11pid=p?p.id:-1;
       return t('kron_t11_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_t11_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t11result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_t11_release_clause_panic')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._t11result==='noBudget')return t('kron_t11_c1_outcome_nobudget');
          return t('kron_t11_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_t11_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_t11_c2_outcome');}},
       {label:t('kron_t11_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._t11result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._t11result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._t11result==='win')return t('kron_t11_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_t11_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // T-12: Niechciany prezent transferowy od sponsora
    {id:'t12_unwanted_gift_signing', category:t('kron_cat_transfers'),
     weight:function(){
       var found=kronFindSurplusPlayer(20,45,35);
       return found?16:0;
     },
     title:t('kron_t12_title'),
     body:function(){
       var found=kronFindSurplusPlayer(20,45,35);
       var p=found?found.player:null;
       G.kronika.flags._t12pid=p?p.id:-1;
       G.kronika.flags._t12clubId=found?found.fromClub.id:-1;
       return t('kron_t12_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{ovr}',p?ovr(p):'?').replace('{club}',found?found.fromClub.n:t('kron_fallback_rival'));
     },
     choices:[
       {label:t('kron_t12_c1_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t12pid;});
          var fromClub=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t12clubId;});
          if(!p||!fromClub||p.clubId!==fromClub.id){G.kronika.flags._t12result='gone';return;}
          kronTransferIn(p,fromClub);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:p.name,val:0,fee:0,week:G.week,season:G.season});
          G.kronika.flags._t12result='accepted';G.kronika.flags._t12name=p.name;
        },
        outcome:function(){
          if(G.kronika.flags._t12result==='gone')return t('kron_t12_c1_outcome_gone');
          return t('kron_t12_c1_outcome').replace('{name}',G.kronika.flags._t12name||t('kron_fallback_player'));
        }},
       {label:t('kron_t12_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_t12_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_t12_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t12pid;});
          var fromClub=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t12clubId;});
          if(Math.random()<0.5&&p&&fromClub&&p.clubId===fromClub.id){
            kronTransferIn(p,fromClub);
            if(!G.fin.transfers)G.fin.transfers=[];
            G.fin.transfers.push({type:'buy',name:p.name,val:0,fee:0,week:G.week,season:G.season});
            G.reputation=(G.reputation||30)+3;
            G.kronika.flags._t12result='acceptedGrumpy';G.kronika.flags._t12name=p.name;
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-3);
            G.kronika.flags._t12result='sponsorAngry';
          }
        },
        outcome:function(){
          if(G.kronika.flags._t12result==='acceptedGrumpy')return t('kron_t12_c3_outcome_win').replace('{name}',G.kronika.flags._t12name||t('kron_fallback_player')).replace('{rep}',G.reputation||0);
          return t('kron_t12_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // T-13: Plotka transferowa o własnym zawodniku
    {id:'t13_transfer_rumor_mill', category:t('kron_cat_transfers'),
     weight:function(){return tfRumorTarget()?16:0;},
     title:t('kron_t13_title'),
     body:function(){
       var p=tfRumorTarget();
       return t('kron_t13_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_t13_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_t13_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_t13_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_t13_c2_outcome');}},
       {label:t('kron_t13_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._t13result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);G.kronika.flags._t13result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._t13result==='win')return t('kron_t13_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_t13_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // T-14: Literówka w raporcie skautingowym
    {id:'t14_scout_report_typo', category:t('kron_cat_transfers'),
     weight:function(){return (G.scout&&G.scout.level&&G.scout.level!=='free')?14:0;},
     title:t('kron_t14_title'),
     body:function(){return t('kron_t14_body');},
     choices:[
       {label:t('kron_t14_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_t14_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_t14_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_t14_c2_outcome');}},
       {label:t('kron_t14_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_t14_c3_outcome');}},
     ]},

    // T-15: Maraton negocjacji przedłużenia kontraktu
    {id:'t15_contract_renewal_marathon', category:t('kron_cat_transfers'),
     weight:function(){return tfContractRenewalCandidate()?18:0;},
     title:t('kron_t15_title'),
     body:function(){
       var p=tfContractRenewalCandidate();
       G.kronika.flags._t15pid=p?p.id:-1;
       return t('kron_t15_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_t15_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t15result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_t15_contract_renewal_marathon')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t15pid;});
          if(p)p.contract=Math.max(p.contract||1,3);
        },
        outcome:function(){
          if(G.kronika.flags._t15result==='noBudget')return t('kron_t15_c1_outcome_nobudget');
          return t('kron_t15_c1_outcome');
        }},
       {label:t('kron_t15_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_t15_c2_outcome');}},
       {label:t('kron_t15_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t15pid;});
          if(Math.random()<0.5){
            if(p)p.contract=Math.max(p.contract||1,3);
            G.kronika.flags._t15result='win';
          } else {
            if(p)p.form=Math.max(50,(p.form||80)-4);
            G.kronika.flags._t15result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._t15result==='win')return t('kron_t15_c3_outcome_win');
          return t('kron_t15_c3_outcome_lose');
        }},
     ]},

    // T-16: Powrót syna marnotrawnego
    {id:'t16_prodigal_son_returns', category:t('kron_cat_transfers'),
     weight:function(){return (tfProdigalCandidate()&&G.budget>=8000)?22:0;},
     title:t('kron_t16_title'),
     body:function(){
       var p=tfProdigalCandidate();
       var club=p?ALL_CLUBS.find(function(c){return c.id===p.clubId;}):null;
       G.kronika.flags._t16pid=p?p.id:-1;
       G.kronika.flags._t16clubId=club?club.id:-1;
       return t('kron_t16_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{club}',club?club.n:t('kron_fallback_rival'));
     },
     choices:[
       {label:t('kron_t16_c1_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t16pid;});
          var club=ALL_CLUBS.find(function(c){return c.id===G.kronika.flags._t16clubId;});
          if(!p||!club||p.clubId!==club.id){G.kronika.flags._t16result='gone';return;}
          var cost=kronAffordablePrice(Math.round((p.value||30000)*0.60/1000)*1000,0.5);
          if(G.budget<cost){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t16result='noBudget';return;}
          G.budget-=cost;
          kronTransferIn(p,club);
          if(!G.fin.transfers)G.fin.transfers=[];
          G.fin.transfers.push({type:'buy',name:p.name,val:cost,fee:cost,week:G.week,season:G.season});
          addNews(t('news_tr_gem_signed').replace('{name}',p.name).replace('{ovr}',ovr(p)).replace('{val}',fmtVal(cost)),'budget');
          G.kronika.flags._t16result='signed';G.kronika.flags._t16name=p.name;
        },
        outcome:function(){
          if(G.kronika.flags._t16result==='gone')return t('kron_t16_c1_outcome_gone');
          if(G.kronika.flags._t16result==='noBudget')return t('kron_t16_c1_outcome_nobudget');
          return t('kron_t16_c1_outcome').replace('{name}',G.kronika.flags._t16name||t('kron_fallback_player'));
        }},
       {label:t('kron_t16_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_t16_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_t16_c3_label'),
        effect:function(){G.reputation=(G.reputation||30)+5;addNews(t('kron_t16_c3_news'),'club');},
        outcome:function(){return t('kron_t16_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // T-17: Panika przed wygaśnięciem kontraktu
    {id:'t17_bosman_panic', category:t('kron_cat_transfers'),
     weight:function(){return tfExpiringStarter()?20:0;},
     title:t('kron_t17_title'),
     body:function(){
       var p=tfExpiringStarter();
       G.kronika.flags._t17pid=p?p.id:-1;
       return t('kron_t17_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_t17_c1_label'),
        effect:function(){
          if(G.budget<1500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t17result='noBudget';return;}
          G.budget-=1500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:1500,bal:G.budget,season:G.season,note:t('kron_note_t17_bosman_panic')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t17pid;});
          if(p)p.contract=Math.max(p.contract||1,3);
        },
        outcome:function(){
          if(G.kronika.flags._t17result==='noBudget')return t('kron_t17_c1_outcome_nobudget');
          return t('kron_t17_c1_outcome');
        }},
       {label:t('kron_t17_c2_label'),
        effect:function(){},
        outcome:function(){return t('kron_t17_c2_outcome');}},
       {label:t('kron_t17_c3_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t17result='noBudget2';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_t17_bosman_panic_b')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._t17pid;});
          if(p){p.contract=Math.max(p.contract||1,3);p.form=Math.min(100,(p.form||80)+3);}
        },
        outcome:function(){
          if(G.kronika.flags._t17result==='noBudget2')return t('kron_t17_c3_outcome_nobudget');
          return t('kron_t17_c3_outcome');
        }},
     ]},

    // T-18: Groźba "kontroli transferowej" od związku
    {id:'t18_transfer_embargo_threat', category:t('kron_cat_transfers'),
     weight:function(){return (G.season||1)>=2?14:0;},
     title:t('kron_t18_title'),
     body:function(){return t('kron_t18_body');},
     choices:[
       {label:t('kron_t18_c1_label'),
        effect:function(){
          if(G.budget<3000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._t18result='noBudget';return;}
          G.budget-=3000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:3000,bal:G.budget,season:G.season,note:t('kron_note_t18_transfer_embargo_threat')});
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){
          if(G.kronika.flags._t18result==='noBudget')return t('kron_t18_c1_outcome_nobudget');
          return t('kron_t18_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_t18_c2_label'),
        effect:function(){
          if(Math.random()<0.5){G.kronika.flags._t18result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._t18result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._t18result==='win')return t('kron_t18_c2_outcome_win');
          return t('kron_t18_c2_outcome_lose').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_t18_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._t18result2='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-5);G.kronika.flags._t18result2='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._t18result2==='win')return t('kron_t18_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_t18_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // T-19: Sponsor chce prawa głosu przy transferach
    {id:'t19_sponsor_naming_clause', category:t('kron_cat_transfers'),
     weight:function(){return (G.reputation||0)>=100?14:0;},
     title:t('kron_t19_title'),
     body:function(){return t('kron_t19_body');},
     choices:[
       {label:t('kron_t19_c1_label'),
        effect:function(){
          G.budget+=8000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:8000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_t19_sponsor_naming_clause')});
          G.reputation=Math.max(0,(G.reputation||30)-4);
        },
        outcome:function(){return t('kron_t19_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_t19_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+3;},
        outcome:function(){return t('kron_t19_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_t19_c3_label'),
        effect:function(){
          if(Math.random()<0.5){
            G.budget+=4000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:4000,cost:0,bal:G.budget,season:G.season,note:t('kron_note_t19_sponsor_naming_clause_b')});
            G.reputation=(G.reputation||30)+2;
            G.kronika.flags._t19result='win';
          } else {
            G.reputation=Math.max(0,(G.reputation||30)-3);
            G.kronika.flags._t19result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._t19result==='win')return t('kron_t19_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_t19_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // T-20: Publiczna deklaracja lojalności (ŁAŃCUCH — start, patrz t21)
    {id:'t20_captain_loyalty_pledge', category:t('kron_cat_transfers'),
     weight:function(){
       if(G.flags&&G.flags.loyaltyPledge)return 0;
       return tfLoyaltyPledgeCandidate()?22:0;
     },
     title:t('kron_t20_title'),
     body:function(){
       var p=tfLoyaltyPledgeCandidate();
       return t('kron_t20_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_t20_c1_label'),
        effect:function(){
          var p=tfLoyaltyPledgeCandidate();
          G.flags=G.flags||{};
          if(p)G.flags.loyaltyPledge={pid:p.id,name:p.name,season:G.season,reaction:'encouraged'};
          G.reputation=(G.reputation||30)+5;
        },
        outcome:function(){return t('kron_t20_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_t20_c2_label'),
        effect:function(){
          var p=tfLoyaltyPledgeCandidate();
          G.flags=G.flags||{};
          if(p)G.flags.loyaltyPledge={pid:p.id,name:p.name,season:G.season,reaction:'neutral'};
        },
        outcome:function(){return t('kron_t20_c2_outcome');}},
       {label:t('kron_t20_c3_label'),
        effect:function(){
          var p=tfLoyaltyPledgeCandidate();
          G.flags=G.flags||{};
          if(p)G.flags.loyaltyPledge={pid:p.id,name:p.name,season:G.season,reaction:'skeptical'};
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._t20result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._t20result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._t20result==='win')return t('kron_t20_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_t20_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // T-21: Czy dotrzymał słowa? (ŁAŃCUCH — zakończenie t20)
    {id:'t21_captain_loyalty_resolution', category:t('kron_cat_transfers'),
     weight:function(){
       if(!G.flags||!G.flags.loyaltyPledge)return 0;
       return (G.season-G.flags.loyaltyPledge.season)>=1?26:0;
     },
     title:t('kron_t21_title'),
     body:function(){
       var w=G.flags.loyaltyPledge;
       var p=tfFindAnywhere(w.pid);
       var seasonsAgo=G.season-w.season;
       var status;
       if(!p)status='unknown';
       else if(G.retiredPlayers&&G.retiredPlayers.some(function(x){return x.id===w.pid;}))status='retired';
       else if(p.clubId===G.myClubId)status='kept';
       else status='left';
       G.kronika.flags._t21status=status;
       if(status==='kept')return t('kron_t21_body_kept').replace('{name}',w.name).replace('{n}',seasonsAgo);
       if(status==='left')return t('kron_t21_body_left').replace('{name}',w.name).replace('{n}',seasonsAgo).replace('{club}',p.clubId?(ALL_CLUBS.find(function(c){return c.id===p.clubId;})||{}).n||t('kron_fallback_rival'):t('kron_fallback_rival'));
       if(status==='retired')return t('kron_t21_body_retired').replace('{name}',w.name).replace('{n}',seasonsAgo);
       return t('kron_t21_body_unknown').replace('{name}',w.name).replace('{n}',seasonsAgo);
     },
     choices:[
       {label:t('kron_t21_c1_label'),
        effect:function(){G.flags.loyaltyPledge=null;G.reputation=(G.reputation||30)+5;},
        outcome:function(){return t('kron_t21_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_t21_c2_label'),
        effect:function(){G.flags.loyaltyPledge=null;},
        outcome:function(){return t('kron_t21_c2_outcome');}},
       {label:t('kron_t21_c3_label'),
        effect:function(){
          G.flags.loyaltyPledge=null;
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+6;G.kronika.flags._t21result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-4);G.kronika.flags._t21result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._t21result==='win')return t('kron_t21_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_t21_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

  ];
}
