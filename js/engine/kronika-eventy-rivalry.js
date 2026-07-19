// ══════════════════════════════════════════════════════════════════════════
// KRONIKA KLUBU — kron_cat_rivalry (Sesja 13, odwieczny rywal na podstawie realnej historii
// meczów). Zasilane przez G.h2hHistory (trwałe, aktualizowane w engine/match-engine.js) —
// definicja wyboru rywala i "dramatyczności" meczu: getNemesisClub()/h2hIsDramaticMatch()
// w core/state.js. W ODRÓŻNIENIU od G.rival (derby losowane co sezon,
// ui/world-board-render.js::assignDerbyPairs()) ten rywal wynika wyłącznie z liczby i
// przebiegu realnych pojedynków w tym save'ie — dwa niezależne, równoległe mechanizmy.
// Plik danych ładowany PRZED engine/kronika.js (patrz index.html), scalany do KRON_EVENTS
// wewnątrz kronTrigger() — ten sam wzorzec builder-funkcji co pozostałe kategorie.
// Stan trwały ("ogłoszono?", "ostatnia świętowana rocznica?") trzymany bezpośrednio na wpisie
// G.h2hHistory[clubId] — NIE w G.kronika.flags, bo to drugie zeruje się co sezon
// (ui/season-summary.js), a h2hHistory jest z definicji trwałe przez całą karierę.
// Prefiks id: rv.
// ══════════════════════════════════════════════════════════════════════════
function buildKronRivalryEvents(){

  function rvNemesis(){return getNemesisClub();}
  function rvNemesisClub(nem){return nem?ALL_CLUBS.find(function(c){return c.id===nem.clubId;}):null;}

  return [

    // RV-01: Ogłoszenie odwiecznego rywala — jednorazowo, gdy tożsamość rywala się ustali
    // (min. 3 spotkania, patrz getNemesisClub()) i jeszcze nie została ogłoszona. Jeśli rywal
    // się kiedyś zmieni na inny klub, jego świeży wpis h2hHistory nie ma jeszcze `announced`,
    // więc event odpali się ponownie dla NOWEGO rywala.
    {id:'rv01_nemesis_named', category:t('kron_cat_rivalry'),
     weight:function(){
       var nem=rvNemesis();
       return (nem&&!nem.hist.announced)?22:0;
     },
     title:t('kron_rv01_title'),
     body:function(){
       var nem=rvNemesis();if(!nem)return '';
       var c=rvNemesisClub(nem);
       return t('kron_rv01_body').replace('{rival}',c?c.n:t('kron_fallback_rival'))
         .replace('{n}',nem.hist.matches).replace('{w}',nem.hist.w).replace('{d}',nem.hist.d).replace('{l}',nem.hist.l);
     },
     choices:[
       {label:t('kron_rv01_c1_label'),
        effect:function(){var nem=rvNemesis();if(nem)nem.hist.announced=true;myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+3);});},
        outcome:function(){return t('kron_rv01_c1_outcome');}},
       {label:t('kron_rv01_c2_label'),
        effect:function(){var nem=rvNemesis();if(nem)nem.hist.announced=true;},
        outcome:function(){return t('kron_rv01_c2_outcome');}},
       {label:t('kron_rv01_c3_label'),
        effect:function(){
          var nem=rvNemesis();var c=rvNemesisClub(nem);
          if(nem){nem.hist.announced=true;G.reputation=(G.reputation||30)+5;}
          addNews(t('kron_rv01_c3_news').replace('{rival}',c?c.n:t('kron_fallback_rival')),'club');
        },
        outcome:function(){return t('kron_rv01_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

    // RV-02: Kamień milowy rywalizacji — co 5. spotkanie z odwiecznym rywalem (5, 10, 15…).
    // `lastMilestone` na wpisie h2hHistory pilnuje jednorazowego świętowania każdego progu.
    {id:'rv02_rivalry_milestone', category:t('kron_cat_rivalry'), repeatable:true, // v234: cykliczny co 5. spotkanie — patrz komentarz wyżej
     weight:function(){
       var nem=rvNemesis();
       if(!nem||nem.hist.matches<5||nem.hist.matches%5!==0)return 0;
       return nem.hist.lastMilestone===nem.hist.matches?0:18;
     },
     title:t('kron_rv02_title'),
     body:function(){
       var nem=rvNemesis();if(!nem)return '';
       var c=rvNemesisClub(nem);
       return t('kron_rv02_body').replace('{rival}',c?c.n:t('kron_fallback_rival'))
         .replace('{n}',nem.hist.matches).replace('{w}',nem.hist.w).replace('{d}',nem.hist.d)
         .replace('{l}',nem.hist.l).replace('{drama}',nem.hist.dramatic);
     },
     choices:[
       {label:t('kron_rv02_c1_label'),
        effect:function(){var nem=rvNemesis();if(nem)nem.hist.lastMilestone=nem.hist.matches;myPl().forEach(function(p){p.form=Math.min(100,(p.form||80)+4);});},
        outcome:function(){return t('kron_rv02_c1_outcome');}},
       {label:t('kron_rv02_c2_label'),
        effect:function(){var nem=rvNemesis();if(nem)nem.hist.lastMilestone=nem.hist.matches;},
        outcome:function(){return t('kron_rv02_c2_outcome');}},
       {label:t('kron_rv02_c3_label'),
        effect:function(){var nem=rvNemesis();if(nem){nem.hist.lastMilestone=nem.hist.matches;G.reputation=(G.reputation||30)+4;}},
        outcome:function(){return t('kron_rv02_c3_outcome').replace('{rep}',G.reputation||0);}},
     ]},

  ];
}
