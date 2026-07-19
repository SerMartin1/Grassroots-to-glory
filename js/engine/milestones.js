// ══════════════════════════════════════════════════════════════════════════
// NADCHODZĄCE WYDARZENIA — jednorazowe zapowiedzi w Aktualnościach
// (zapowiedź zbliżających się rocznic klubowych i rekordów, bez osobnej sekcji
// w Gabinecie — patrz decyzja z sesji projektowej). Wołane raz na tydzień z
// advWeek() (engine/week-progress.js), analogicznie do kronTrigger()/
// fanMemoryTrigger(). Wykorzystuje wyłącznie dane, które już istnieją w G —
// zero nowych pól poza G.flags.upcomingAnnounced (leniwie tworzone, jak
// G.flags.hallOfFame — patrz initGame()/migracja w ui/news-bootstrap.js).
// ══════════════════════════════════════════════════════════════════════════

// Ile sezonów naprzód pokazujemy zapowiedź rocznicy (dokładnie 3/2/1 sezony przed).
var UE_SEASON_LOOKAHEAD = [1, 2, 3];
// Progi (w latach/sezonach) sprawdzane dla stażu menedżera.
var UE_TENURE_THRESHOLDS = [5, 10, 15, 20, 25, 30];
// Progi dla rocznic zakotwiczonych w konkretnym sezonie z przeszłości.
var UE_ANNIV_THRESHOLDS = [5, 10, 15, 20, 25, 30];
// Luka do klubowego rekordu (goli/asyst/meczów), przy której ogłaszamy "zbliża się".
var UE_RECORD_GAP = 10;

function checkUpcomingEvents(){
  if(!G)return;
  if(!G.flags)G.flags={};
  if(!G.flags.upcomingAnnounced)G.flags.upcomingAnnounced={};
  var seen=G.flags.upcomingAnnounced;

  // ── A) Rocznice liczone sezonami (staż + zakotwiczone w przeszłym sezonie) ──
  _ueCheckAnniversary(seen,'tenure',1,UE_TENURE_THRESHOLDS,function(n,diff){
    addNews(t('news_ue_tenure').replace('{n}',diff).replace('{y}',n),'club');
  });

  var promoS=hsFirstPromotionSeason();
  if(promoS!=null){
    _ueCheckAnniversary(seen,'promo',promoS,UE_ANNIV_THRESHOLDS,function(n,diff){
      addNews(t('news_ue_promo').replace('{n}',diff).replace('{y}',n),'club');
    });
  }

  var worstEntry=hsWorstSeasonEntry();
  if(worstEntry){
    _ueCheckAnniversary(seen,'worst',worstEntry.season,UE_ANNIV_THRESHOLDS,function(n,diff){
      addNews(t('news_ue_worst').replace('{n}',diff).replace('{y}',n),'club');
    });
  }

  var signing=hsRecordSigning();
  if(signing){
    _ueCheckAnniversary(seen,'signing',signing.season,UE_ANNIV_THRESHOLDS,function(n,diff){
      addNews(t('news_ue_signing').replace('{n}',diff).replace('{y}',n).replace('{name}',signing.name||t('kron_fallback_player')),'club');
    });
  }

  var hof=(G.flags&&G.flags.hallOfFame)||[];
  hof.forEach(function(hf,idx){
    _ueCheckAnniversary(seen,'hof'+idx,hf.season,UE_ANNIV_THRESHOLDS,function(n,diff){
      addNews(t('news_ue_hof').replace('{n}',diff).replace('{y}',n).replace('{name}',hf.name||t('kron_fallback_player')),'club');
    });
  });

  // ── B) Zbliżanie się do klubowych rekordów (przeliczane co tydzień) ──
  // Dopiero od 2. sezonu: w sezonie 1 rekord (max z G.allTimeStats.players) jest
  // z natury śladowy (np. 2 gole), więc "zbliża się do rekordu" byłoby absurdalne.
  if(G.season>=2){
    _ueCheckRecordProximity(seen,'goals',function(name,gap,rec){
      addNews(t('news_ue_record_goals').replace('{name}',name).replace('{n}',gap).replace('{rec}',rec),'academy');
    });
    _ueCheckRecordProximity(seen,'assists',function(name,gap,rec){
      addNews(t('news_ue_record_assists').replace('{name}',name).replace('{n}',gap).replace('{rec}',rec),'academy');
    });
    _ueCheckRecordProximity(seen,'matches',function(name,gap,rec){
      addNews(t('news_ue_record_matches').replace('{name}',name).replace('{n}',gap).replace('{rec}',rec),'academy');
    });
  }

  // ── C) Rozbudowa stadionu — konkretny, tygodniowy odliczany próg ──
  if(G.stadium&&G.stadium.building){
    var b=G.stadium.building;
    var weeksLeft=b.weeksLeft||0;
    var futureCap=(G.stadium.capacity||0)+(b.seats||0);
    var roundThresholds=[1000,2000,5000,10000,20000,30000,50000];
    var crossed=roundThresholds.find(function(th){return (G.stadium.capacity||0)<th&&futureCap>=th;});
    if(crossed&&weeksLeft>0&&weeksLeft<=3){
      var fk='stadium_'+crossed+'_'+weeksLeft;
      if(!seen[fk]){
        seen[fk]=true;
        addNews(t('news_ue_stadium').replace('{n}',weeksLeft).replace('{cap}',crossed.toLocaleString('pl-PL')),'club');
      }
    }
  }
}

// n = próg (np. 10 lat), diff = ile sezonów zostało (1/2/3). Ogłasza dokładnie raz
// na każdą parę (klucz, n, diff) — G.season tylko rośnie, więc to jest z natury
// niepowtarzalne (ten sam wzorzec co eventy hs05-hs08 w kronika-eventy-history.js).
function _ueCheckAnniversary(seen,key,anchorSeason,thresholds,cb){
  var elapsed=G.season-anchorSeason;
  thresholds.forEach(function(n){
    var diff=n-elapsed;
    if(UE_SEASON_LOOKAHEAD.indexOf(diff)===-1)return;
    var fk=key+'_'+n+'_'+diff;
    if(seen[fk])return;
    seen[fk]=true;
    cb(n,diff);
  });
}

// Rekord = maksimum danej statystyki w G.allTimeStats.players (trwałe, nigdy nie
// przycinane — patrz core/data.js::protectedRetireeIds). Ogłasza raz na (statystyka,
// zawodnik), dopóki różnica względem rekordu mieści się w UE_RECORD_GAP. Jeśli
// zawodnik dogoni/wyprzedzi rekord, flaga jest czyszczona (na wypadek, gdyby inny
// zawodnik później znów zbliżał się do tego samego, przesuniętego rekordu).
function _ueCheckRecordProximity(seen,statKey,cb){
  var at=(G.allTimeStats&&G.allTimeStats.players)||{};
  var stats=Object.values(at);
  if(!stats.length)return;
  var record=0;
  stats.forEach(function(s){if((s[statKey]||0)>record)record=s[statKey]||0;});
  if(record<=0)return;
  myPl().forEach(function(p){
    var s=at[p.id];
    var fk='rec_'+statKey+'_'+p.id;
    if(!s){return;}
    var val=s[statKey]||0;
    var gap=record-val;
    if(gap>0&&gap<=UE_RECORD_GAP&&val>0){
      if(!seen[fk]){seen[fk]=true;cb(s.name||p.name,gap,record);}
    } else if(gap<=0){
      delete seen[fk];
    }
  });
}
