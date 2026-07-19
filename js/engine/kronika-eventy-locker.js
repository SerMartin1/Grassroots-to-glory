// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_locker (Sesja 4, PLAN_KRONIKA_ROZBUDOWA.txt pkt 4)
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html) — scalany
// do KRON_EVENTS wewnątrz kronTrigger() (opcja B, wzorzec z Sesji 1: builder-
// funkcja zwracająca świeżą tablicę co tydzień). Żadnych domknięć nad
// my/starters/bestP/kron z zakresu kronTrigger() — wyłącznie globalne
// myPl()/ovr()/G, G.kronika.flags zamiast lokalnego kron.flags. Prefiks id:
// s (kontynuacja istniejącej numeracji s01-s05/s07 — patrz PLAN pkt 4.3,
// zakres s08-s20; h01 zostaje legacy wyjątkiem, nie wzorcem). Ton: humor
// w stylu Hattricka.
// ══════════════════════════════════════════════════════════════════════════
function buildKronLockerEvents(){

  function lkStarters(){
    return myPl().filter(function(p){return p.starter&&!p.injured;});
  }
  function lkBirthdayPlayer(){
    return myPl().find(function(p){return p.birthWeek===G.week;});
  }
  function lkVeteran(minAge){
    return myPl().find(function(p){return (p.age||0)>=minAge;});
  }
  function lkRookie(maxAge){
    return myPl().find(function(p){return (p.age||99)<=maxAge;});
  }
  function lkHomesickYoungster(){
    return myPl().find(function(p){return (p.age||99)<=19&&(p._seasonsAtClub||0)<=1;});
  }
  function lkNewSigning(){
    return myPl().find(function(p){return (p.age||0)>=20&&!p.fromAcademy&&(p._seasonsAtClub||0)===0;});
  }
  function lkPayGap(){
    var withSalary=myPl().filter(function(p){return p.starter&&(p.salary||0)>0;});
    if(withSalary.length<2)return null;
    var max=withSalary.reduce(function(a,b){return (a.salary||0)>(b.salary||0)?a:b;});
    var min=withSalary.reduce(function(a,b){return (a.salary||0)<(b.salary||0)?a:b;});
    if(min.id===max.id)return null;
    return (max.salary>=min.salary*3)?{max:max,min:min}:null;
  }
  function lkRetirementCandidate(){
    return myPl().find(function(p){return (p.age||0)>=33&&(p._seasonsAtClub||0)>=1&&!p.injured;});
  }

  return [

    // S-08: Spór o numer na koszulce
    {id:'s08_jersey_number_dispute', category:t('kron_cat_locker'),
     weight:function(){return myPl().length>=16?16:0;},
     title:t('kron_s08_title'),
     body:function(){
       var sq=myPl();
       var picks=sq.slice().sort(function(){return Math.random()-0.5;}).slice(0,2);
       G.kronika.flags._s08pids=picks.map(function(p){return p.id;});
       var names=picks.map(function(p){return p.name.split(' ')[1]||p.name;});
       return t('kron_s08_body').replace('{a}',names[0]||t('kron_fallback_player')).replace('{b}',names[1]||t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_s08_c1_label'),
        effect:function(){
          if(G.budget<1500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._s08result='noBudget';return;}
          G.budget-=1500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:1500,bal:G.budget,season:G.season,note:t('kron_note_s08_jersey_number_dispute')});
          G.reputation=(G.reputation||30)+3;
        },
        outcome:function(){
          if(G.kronika.flags._s08result==='noBudget')return t('kron_s08_c1_outcome_nobudget');
          return t('kron_s08_c1_outcome');
        }},
       {label:t('kron_s08_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+1;},
        outcome:function(){return t('kron_s08_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_s08_c3_label'),
        effect:function(){
          var pids=G.kronika.flags._s08pids||[];
          if(Math.random()<0.5){
            pids.forEach(function(id){var p=G.players.find(function(x){return x.id===id;});if(p)p.form=Math.min(100,(p.form||80)+3);});
            G.kronika.flags._s08result='win';
          } else {
            pids.forEach(function(id){var p=G.players.find(function(x){return x.id===id;});if(p)p.form=Math.max(50,(p.form||80)-4);});
            G.kronika.flags._s08result='lose';
          }
        },
        outcome:function(){
          if(G.kronika.flags._s08result==='win')return t('kron_s08_c3_outcome_win');
          return t('kron_s08_c3_outcome_lose');
        }},
     ]},

    // S-09: Debata o opasce kapitańskiej (poza kryzysem, patrz s02)
    {id:'s09_captain_armband_debate', category:t('kron_cat_locker'),
     weight:function(){return ((G.round||0)<=4&&lkStarters().length>=8)?16:0;},
     title:t('kron_s09_title'),
     body:function(){
       var cap=lkStarters().slice().sort(function(a,b){return ovr(b)-ovr(a);})[0];
       G.kronika.flags._s09capId=cap?cap.id:-1;
       return t('kron_s09_body').replace('{name}',cap?cap.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_s09_c1_label'),
        effect:function(){
          var cap=G.players.find(function(x){return x.id===G.kronika.flags._s09capId;});
          if(cap)cap.form=Math.min(100,(cap.form||80)+4);
          G.reputation=(G.reputation||30)+3;
        },
        outcome:function(){return t('kron_s09_c1_outcome');}},
       {label:t('kron_s09_c2_label'),
        effect:function(){lkStarters().forEach(function(p){p.form=Math.min(100,(p.form||80)+1);});},
        outcome:function(){return t('kron_s09_c2_outcome');}},
       {label:t('kron_s09_c3_label'),
        effect:function(){
          lkStarters().forEach(function(p){p.form=Math.min(100,(p.form||80)+2);});
          G.reputation=(G.reputation||30)+2;
        },
        outcome:function(){return t('kron_s09_c3_outcome');}},
     ]},

    // S-10: Urodziny zawodnika w szatni
    {id:'s10_birthday_party', category:t('kron_cat_locker'),
     weight:function(){return lkBirthdayPlayer()?18:0;},
     title:t('kron_s10_title'),
     body:function(){
       var p=lkBirthdayPlayer();
       G.kronika.flags._s10pid=p?p.id:-1;
       return t('kron_s10_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_s10_c1_label'),
        effect:function(){
          if(G.budget<1200){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._s10result='noBudget';return;}
          G.budget-=1200;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:1200,bal:G.budget,season:G.season,note:t('kron_note_s10_birthday_party')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});
        },
        outcome:function(){
          if(G.kronika.flags._s10result==='noBudget')return t('kron_s10_c1_outcome_nobudget');
          return t('kron_s10_c1_outcome');
        }},
       {label:t('kron_s10_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+1);});},
        outcome:function(){return t('kron_s10_c2_outcome');}},
       {label:t('kron_s10_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s10pid;});
          if(p)p.form=Math.min(100,(p.form||80)+6);
          G.reputation=(G.reputation||30)+3;
        },
        outcome:function(){return t('kron_s10_c3_outcome');}},
     ]},

    // S-11: Wojna psikusów w szatni
    {id:'s11_prank_war', category:t('kron_cat_locker'),
     weight:function(){return ((G.round||0)>8&&lkStarters().length>=8)?16:0;},
     title:t('kron_s11_title'),
     body:function(){return t('kron_s11_body');},
     choices:[
       {label:t('kron_s11_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+2;},
        outcome:function(){return t('kron_s11_c1_outcome');}},
       {label:t('kron_s11_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_s11_c2_outcome');}},
       {label:t('kron_s11_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+5);});G.kronika.flags._s11result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-3);});G.kronika.flags._s11result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._s11result==='win')return t('kron_s11_c3_outcome_win');
          return t('kron_s11_c3_outcome_lose');
        }},
     ]},

    // S-12: Bunt przeciwko klubowej diecie
    {id:'s12_diet_rebellion', category:t('kron_cat_locker'),
     weight:function(){return ((G.round||0)>5&&myPl().length>=16)?16:0;},
     title:t('kron_s12_title'),
     body:function(){return t('kron_s12_body');},
     choices:[
       {label:t('kron_s12_c1_label'),
        effect:function(){
          if(G.budget<2500){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._s12result='noBudget';return;}
          G.budget-=2500;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2500,bal:G.budget,season:G.season,note:t('kron_note_s12_diet_rebellion')});
          myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});
        },
        outcome:function(){
          if(G.kronika.flags._s12result==='noBudget')return t('kron_s12_c1_outcome_nobudget');
          return t('kron_s12_c1_outcome');
        }},
       {label:t('kron_s12_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-3);});},
        outcome:function(){return t('kron_s12_c2_outcome');}},
       {label:t('kron_s12_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+4;G.kronika.flags._s12result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-4);});G.kronika.flags._s12result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._s12result==='win')return t('kron_s12_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_s12_c3_outcome_lose');
        }},
     ]},

    // S-13: Spór o muzykę w szatni przed meczem
    {id:'s13_music_dispute', category:t('kron_cat_locker'),
     weight:function(){return (G.round||0)>3?14:0;},
     title:t('kron_s13_title'),
     body:function(){return t('kron_s13_body');},
     choices:[
       {label:t('kron_s13_c1_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+2);});},
        outcome:function(){return t('kron_s13_c1_outcome');}},
       {label:t('kron_s13_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+1);});},
        outcome:function(){return t('kron_s13_c2_outcome');}},
       {label:t('kron_s13_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});G.kronika.flags._s13result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-2);});G.kronika.flags._s13result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._s13result==='win')return t('kron_s13_c3_outcome_win');
          return t('kron_s13_c3_outcome_lose');
        }},
     ]},

    // S-14: Młody zawodnik walczy z tęsknotą za domem
    {id:'s14_homesick_youngster', category:t('kron_cat_locker'),
     weight:function(){return lkHomesickYoungster()?18:0;},
     title:t('kron_s14_title'),
     body:function(){
       var p=lkHomesickYoungster();
       G.kronika.flags._s14pid=p?p.id:-1;
       return t('kron_s14_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_s14_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._s14result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_s14_homesick_youngster')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s14pid;});
          if(p)p.form=Math.min(100,(p.form||80)+7);
        },
        outcome:function(){
          if(G.kronika.flags._s14result==='noBudget')return t('kron_s14_c1_outcome_nobudget');
          return t('kron_s14_c1_outcome');
        }},
       {label:t('kron_s14_c2_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s14pid;});
          if(p)p.form=Math.min(100,(p.form||80)+3);
        },
        outcome:function(){return t('kron_s14_c2_outcome');}},
       {label:t('kron_s14_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s14pid;});
          if(p)p.form=Math.max(40,(p.form||80)-5);
        },
        outcome:function(){return t('kron_s14_c3_outcome');}},
     ]},

    // S-15: Szemranie o różnicach w pensjach
    {id:'s15_pay_disparity_grumbling', category:t('kron_cat_locker'),
     weight:function(){return lkPayGap()?18:0;},
     title:t('kron_s15_title'),
     body:function(){
       var gap=lkPayGap();
       return t('kron_s15_body').replace('{max}',gap?gap.max.name:t('kron_fallback_player')).replace('{min}',gap?gap.min.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_s15_c1_label'),
        effect:function(){G.reputation=(G.reputation||30)+4;},
        outcome:function(){return t('kron_s15_c1_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_s15_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-2);});},
        outcome:function(){return t('kron_s15_c2_outcome');}},
       {label:t('kron_s15_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});G.kronika.flags._s15result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-4);});G.kronika.flags._s15result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._s15result==='win')return t('kron_s15_c3_outcome_win');
          return t('kron_s15_c3_outcome_lose');
        }},
     ]},

    // S-16: Chaos podczas dnia zdjęć drużynowych
    {id:'s16_squad_photo_mishap', category:t('kron_cat_locker'),
     weight:function(){return ((G.round||0)>=1&&(G.round||0)<=6)?14:0;},
     title:t('kron_s16_title'),
     body:function(){return t('kron_s16_body');},
     choices:[
       {label:t('kron_s16_c1_label'),
        effect:function(){
          if(G.budget<1800){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._s16result='noBudget';return;}
          G.budget-=1800;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:1800,bal:G.budget,season:G.season,note:t('kron_note_s16_squad_photo_mishap')});
          G.reputation=(G.reputation||30)+4;
        },
        outcome:function(){
          if(G.kronika.flags._s16result==='noBudget')return t('kron_s16_c1_outcome_nobudget');
          return t('kron_s16_c1_outcome').replace('{rep}',G.reputation||0);
        }},
       {label:t('kron_s16_c2_label'),
        effect:function(){G.reputation=(G.reputation||30)+1;},
        outcome:function(){return t('kron_s16_c2_outcome').replace('{rep}',G.reputation||0);}},
       {label:t('kron_s16_c3_label'),
        effect:function(){
          if(Math.random()<0.5){G.reputation=(G.reputation||30)+5;G.kronika.flags._s16result='win';}
          else{G.reputation=Math.max(0,(G.reputation||30)-3);G.kronika.flags._s16result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._s16result==='win')return t('kron_s16_c3_outcome_win').replace('{rep}',G.reputation||0);
          return t('kron_s16_c3_outcome_lose').replace('{rep}',G.reputation||0);
        }},
     ]},

    // S-17: Integracja nowego nabytku z szatnią
    {id:'s17_new_signing_integration', category:t('kron_cat_locker'),
     weight:function(){return lkNewSigning()?18:0;},
     title:t('kron_s17_title'),
     body:function(){
       var p=lkNewSigning();
       G.kronika.flags._s17pid=p?p.id:-1;
       return t('kron_s17_body').replace('{name}',p?p.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_s17_c1_label'),
        effect:function(){
          if(G.budget<2000){notif(t('kron_notif_no_budget'),'err');G.kronika.flags._s17result='noBudget';return;}
          G.budget-=2000;if(!G.fin.hist)G.fin.hist=[];G.fin.hist.push({w:G.week,inc:0,cost:2000,bal:G.budget,season:G.season,note:t('kron_note_s17_new_signing_integration')});
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s17pid;});
          if(p)p.form=Math.min(100,(p.form||80)+6);
        },
        outcome:function(){
          if(G.kronika.flags._s17result==='noBudget')return t('kron_s17_c1_outcome_nobudget');
          return t('kron_s17_c1_outcome');
        }},
       {label:t('kron_s17_c2_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s17pid;});
          if(p)p.form=Math.min(100,(p.form||80)+2);
        },
        outcome:function(){return t('kron_s17_c2_outcome');}},
       {label:t('kron_s17_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s17pid;});
          if(p)p.form=Math.max(40,(p.form||80)-5);
        },
        outcome:function(){return t('kron_s17_c3_outcome');}},
     ]},

    // S-18: Niepisana hierarchia szatni
    {id:'s18_locker_room_hierarchy', category:t('kron_cat_locker'),
     weight:function(){return (lkVeteran(28)&&lkRookie(20))?16:0;},
     title:t('kron_s18_title'),
     body:function(){
       var vet=lkVeteran(28);
       var rookie=lkRookie(20);
       G.kronika.flags._s18vetId=vet?vet.id:-1;
       G.kronika.flags._s18rookieId=rookie?rookie.id:-1;
       return t('kron_s18_body').replace('{vet}',vet?vet.name:t('kron_fallback_player')).replace('{rookie}',rookie?rookie.name:t('kron_fallback_player'));
     },
     choices:[
       {label:t('kron_s18_c1_label'),
        effect:function(){
          var rookie=G.players.find(function(x){return x.id===G.kronika.flags._s18rookieId;});
          if(rookie)rookie.form=Math.min(100,(rookie.form||80)+4);
        },
        outcome:function(){return t('kron_s18_c1_outcome');}},
       {label:t('kron_s18_c2_label'),
        effect:function(){
          var vet=G.players.find(function(x){return x.id===G.kronika.flags._s18vetId;});
          if(vet)vet.form=Math.min(100,(vet.form||80)+3);
        },
        outcome:function(){return t('kron_s18_c2_outcome');}},
       {label:t('kron_s18_c3_label'),
        effect:function(){
          [G.kronika.flags._s18vetId,G.kronika.flags._s18rookieId].forEach(function(id){
            var p=G.players.find(function(x){return x.id===id;});
            if(p)p.form=Math.min(100,(p.form||80)+3);
          });
          G.reputation=(G.reputation||30)+2;
        },
        outcome:function(){return t('kron_s18_c3_outcome');}},
     ]},

    // S-19: Rytuał przesądny formuje się w szatni
    {id:'s19_superstition_ritual', category:t('kron_cat_locker'), repeatable:true, // v234: reaguje na bieżącą serię, może wrócić przy każdej kolejnej
     weight:function(){return (G.winStreak||0)>=2?16:0;},
     title:t('kron_s19_title'),
     body:function(){return t('kron_s19_body');},
     choices:[
       {label:t('kron_s19_c1_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+2);});},
        outcome:function(){return t('kron_s19_c1_outcome');}},
       {label:t('kron_s19_c2_label'),
        effect:function(){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+1);});},
        outcome:function(){return t('kron_s19_c2_outcome');}},
       {label:t('kron_s19_c3_label'),
        effect:function(){
          if(Math.random()<0.5){myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});G.kronika.flags._s19result='win';}
          else{myPl().forEach(function(p){p.form=Math.max(50,(p.form||80)-3);});G.kronika.flags._s19result='lose';}
        },
        outcome:function(){
          if(G.kronika.flags._s19result==='win')return t('kron_s19_c3_outcome_win');
          return t('kron_s19_c3_outcome_lose');
        }},
     ]},

    // S-20: Plotki o emeryturze weterana
    {id:'s20_retirement_rumor', category:t('kron_cat_locker'),
     weight:function(){return lkRetirementCandidate()?16:0;},
     title:t('kron_s20_title'),
     body:function(){
       var p=lkRetirementCandidate();
       G.kronika.flags._s20pid=p?p.id:-1;
       return t('kron_s20_body').replace('{name}',p?p.name:t('kron_fallback_player')).replace('{age}',p?p.age:'?');
     },
     choices:[
       {label:t('kron_s20_c1_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s20pid;});
          if(p)p.form=Math.min(100,(p.form||80)+5);
          G.reputation=(G.reputation||30)+3;
        },
        outcome:function(){return t('kron_s20_c1_outcome');}},
       {label:t('kron_s20_c2_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s20pid;});
          if(p)p.form=Math.max(50,(p.form||80)-2);
        },
        outcome:function(){return t('kron_s20_c2_outcome');}},
       {label:t('kron_s20_c3_label'),
        effect:function(){
          var p=G.players.find(function(x){return x.id===G.kronika.flags._s20pid;});
          if(p)p.form=Math.max(40,(p.form||80)-6);
          G.reputation=Math.max(0,(G.reputation||30)-3);
        },
        outcome:function(){return t('kron_s20_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

  ];
}
