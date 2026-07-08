
// ── PIXEL ART ENGINE ─────────────────────────────────────────
(function(){
  function _mlb(seed){var s=seed;return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function _rng(seed){var r=_mlb(seed*1327+9371);for(var i=0;i<5;i++)r();return r;}
  var SKIN=['#FDBCB4','#E8A882','#C68642','#8D5524','#5C3317','#FFCBA4','#3C2414','#F1C27D'];
  var HAIR=['#1a1a1a','#2c1810','#8B4513','#FFD700','#C0C0C0','#8B0000','#FF8C00','#4a4a4a'];
  var EYES=['#1a1a6e','#228B22','#8B4513','#1a1a1a','#4169E1','#808080'];
  var CCLUB=[['#CC0000','#ffffff'],['#003399','#ffffff'],['#006400','#ffffff'],['#8B0000','#FFD700'],['#000080','#ffffff'],['#FF6600','#000000'],['#660066','#ffffff'],['#003366','#FFD700'],['#CC0000','#000000'],['#006633','#ffffff'],['#1a1a1a','#ffffff'],['#990000','#0000CC'],['#003300','#FFD700'],['#CC3300','#003399'],['#660000','#FFD700'],['#336600','#ffffff'],['#003333','#FFD700'],['#660033','#ffffff'],['#330066','#FFD700'],['#333300','#ffffff']];

  function _px(ctx,x,y,col,sc){ctx.fillStyle=col;ctx.fillRect(x*sc,y*sc,sc,sc);}
  function _shade(hex,amt){var n=parseInt(hex.slice(1),16);var rr=Math.max(0,Math.min(255,(n>>16)+amt));var gg=Math.max(0,Math.min(255,((n>>8)&255)+amt));var bb=Math.max(0,Math.min(255,(n&255)+amt));return '#'+((1<<24)+(rr<<16)+(gg<<8)+bb).toString(16).slice(1);}
  function _wpick(r,w){var sum=0;for(var i=0;i<w.length;i++)sum+=w[i];var tt=r()*sum,acc=0;for(var j=0;j<w.length;j++){acc+=w[j];if(tt<acc)return j;}return w.length-1;}

  // Warstwy twarzy: kategoria->liczba wariantow, wagi mlody/mid/weteran(32+) dla cech zwiazanych z wiekiem
  var W_FACE=[40,30,30];       // ksztalt: owalna, kwadratowa, waska
  var W_BROW=[30,45,25];       // brwi: cienkie, normalne, krzaczaste
  var W_NOSE=[30,45,25];       // nos: maly, sredni, szeroki
  var W_MOUTH=[30,45,25];      // usta: waskie, srednie, szerokie (zawsze symetryczne/neutralne)
  var W_ACC=[84,10,6];         // dodatki: brak, okulary, blizna
  var W_HAIR_STYLE={young:[4,16,16,16,16,16,4,12],mid:[6,15,15,15,14,14,9,12],vet:[14,10,9,9,7,7,26,8]};
  var W_HAIR_COLOR={young:[18,18,16,12,4,10,12,10],mid:[16,16,16,10,8,8,10,16],vet:[8,8,8,4,32,4,4,32]};
  var W_BEARD={young:[60,14,18,8],mid:[50,15,20,15],vet:[28,14,26,32]};

  var _faceCache={};
  // Cechy sa losowane raz per (seed,age) i cache'owane; sc tylko skaluje rysunek, nigdy nie wplywa na dobor cech
  function _faceTraits(seed,age){
    var key=seed+'_'+(age==null?'x':age);
    if(_faceCache[key])return _faceCache[key];
    var r=_rng(seed);
    var br=age==null?'mid':(age<23?'young':(age<32?'mid':'vet'));
    var tr={
      faceShape:_wpick(r,W_FACE),
      skin:Math.floor(r()*SKIN.length),
      hairStyle:_wpick(r,W_HAIR_STYLE[br]),
      hairColor:_wpick(r,W_HAIR_COLOR[br]),
      eyebrow:_wpick(r,W_BROW),
      eyeColor:Math.floor(r()*EYES.length),
      eyeShape:Math.floor(r()*2),
      nose:_wpick(r,W_NOSE),
      mouth:_wpick(r,W_MOUTH),
      facialHair:_wpick(r,W_BEARD[br]),
      beardColor:HAIR[Math.floor(r()*HAIR.length)],
      accessory:_wpick(r,W_ACC),
      wrinkle:br==='vet'&&r()<0.4
    };
    _faceCache[key]=tr;
    return tr;
  }

  function drawFace(ctx,seed,sc,age){
    var tr=_faceTraits(seed,age);
    ctx.canvas.width=12*sc;ctx.canvas.height=14*sc;
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    var skin=SKIN[tr.skin],hair=HAIR[tr.hairColor],eye=EYES[tr.eyeColor];
    // ksztalt twarzy
    if(tr.faceShape===1){
      for(var hy=2;hy<=9;hy++)for(var hx=2;hx<=9;hx++)_px(ctx,hx,hy,skin,sc);
      _px(ctx,2,2,skin,sc);_px(ctx,9,2,skin,sc);
      for(var nx=3;nx<=8;nx++)_px(ctx,nx,1,skin,sc);
      for(var nx2=2;nx2<=9;nx2++)_px(ctx,nx2,10,skin,sc);
      for(var nx3=3;nx3<=8;nx3++)_px(ctx,nx3,11,skin,sc);
    }else if(tr.faceShape===2){
      for(var hy2=2;hy2<=5;hy2++)for(var hx2=2;hx2<=9;hx2++)_px(ctx,hx2,hy2,skin,sc);
      for(var hy3=6;hy3<=9;hy3++)for(var hx3=3;hx3<=8;hx3++)_px(ctx,hx3,hy3,skin,sc);
      _px(ctx,2,2,skin,sc);_px(ctx,9,2,skin,sc);
      for(var nx4=3;nx4<=8;nx4++)_px(ctx,nx4,1,skin,sc);
      for(var nx5=4;nx5<=7;nx5++)_px(ctx,nx5,10,skin,sc);
      _px(ctx,5,11,skin,sc);_px(ctx,6,11,skin,sc);
    }else{
      for(var hy4=2;hy4<=9;hy4++)for(var hx4=2;hx4<=9;hx4++)_px(ctx,hx4,hy4,skin,sc);
      _px(ctx,2,2,skin,sc);_px(ctx,9,2,skin,sc);
      for(var nx6=3;nx6<=8;nx6++)_px(ctx,nx6,1,skin,sc);
      for(var nx7=3;nx7<=8;nx7++)_px(ctx,nx7,10,skin,sc);
      _px(ctx,4,11,skin,sc);_px(ctx,5,11,skin,sc);_px(ctx,6,11,skin,sc);_px(ctx,7,11,skin,sc);
    }
    // fryzura (0=lysy: brak warstwy)
    if(tr.hairStyle===1){for(var a1=3;a1<=8;a1++)_px(ctx,a1,1,hair,sc);for(var a2=2;a2<=9;a2++)_px(ctx,a2,2,hair,sc);}
    else if(tr.hairStyle===2){for(var a3=3;a3<=8;a3++){_px(ctx,a3,0,hair,sc);_px(ctx,a3,1,hair,sc);}for(var a4=2;a4<=9;a4++)_px(ctx,a4,2,hair,sc);_px(ctx,2,3,hair,sc);_px(ctx,9,3,hair,sc);}
    else if(tr.hairStyle===3){for(var a5=3;a5<=8;a5++){_px(ctx,a5,0,hair,sc);_px(ctx,a5,1,hair,sc);}for(var a6=2;a6<=9;a6++)_px(ctx,a6,2,hair,sc);for(var a7=3;a7<=8;a7++){_px(ctx,2,a7,hair,sc);_px(ctx,9,a7,hair,sc);}}
    else if(tr.hairStyle===4){for(var a8=3;a8<=8;a8++)if(a8%2===0)_px(ctx,a8,0,hair,sc);for(var a9=2;a9<=9;a9++)if(a9%2===1)_px(ctx,a9,1,hair,sc);for(var a10=2;a10<=9;a10++)_px(ctx,a10,2,hair,sc);}
    else if(tr.hairStyle===5){for(var a11=2;a11<=9;a11++)_px(ctx,a11,2,hair,sc);}
    else if(tr.hairStyle===6){_px(ctx,2,2,hair,sc);_px(ctx,3,2,hair,sc);_px(ctx,8,2,hair,sc);_px(ctx,9,2,hair,sc);_px(ctx,2,3,hair,sc);_px(ctx,9,3,hair,sc);}
    else if(tr.hairStyle===7){for(var a12=4;a12<=7;a12++)_px(ctx,a12,0,hair,sc);for(var a13=3;a13<=8;a13++)_px(ctx,a13,1,hair,sc);for(var a14=2;a14<=9;a14++)_px(ctx,a14,2,hair,sc);}
    // brwi
    var browCol=_shade(hair,-10);
    if(tr.eyebrow===0){_px(ctx,4,4,browCol,sc);_px(ctx,7,4,browCol,sc);}
    else if(tr.eyebrow===1){_px(ctx,3,4,browCol,sc);_px(ctx,4,4,browCol,sc);_px(ctx,7,4,browCol,sc);_px(ctx,8,4,browCol,sc);}
    else{_px(ctx,2,4,browCol,sc);_px(ctx,3,4,browCol,sc);_px(ctx,4,4,browCol,sc);_px(ctx,7,4,browCol,sc);_px(ctx,8,4,browCol,sc);_px(ctx,9,4,browCol,sc);_px(ctx,3,3,browCol,sc);_px(ctx,8,3,browCol,sc);}
    // oczy
    if(tr.eyeShape===1){var eyeS=_shade(eye,-30);_px(ctx,3,5,eyeS,sc);_px(ctx,4,5,eyeS,sc);_px(ctx,7,5,eyeS,sc);_px(ctx,8,5,eyeS,sc);}
    else{_px(ctx,3,5,eye,sc);_px(ctx,4,5,'#000',sc);_px(ctx,7,5,eye,sc);_px(ctx,8,5,'#000',sc);}
    // nos (kolor pochodny od karnacji, nie stala barwa)
    var noseCol=_shade(skin,-40);
    if(tr.nose===0){_px(ctx,5,7,noseCol,sc);}
    else if(tr.nose===2){_px(ctx,4,7,noseCol,sc);_px(ctx,5,7,noseCol,sc);_px(ctx,6,7,noseCol,sc);_px(ctx,7,7,noseCol,sc);}
    else{_px(ctx,5,7,noseCol,sc);_px(ctx,6,7,noseCol,sc);}
    // usta - zawsze symetryczne/neutralne, rozne tylko szerokoscia (bez usmiechu/grymasu)
    if(tr.mouth===0){_px(ctx,5,8,'#8B0000',sc);_px(ctx,6,8,'#8B0000',sc);}
    else if(tr.mouth===2){_px(ctx,3,8,'#8B0000',sc);_px(ctx,4,8,'#cc3333',sc);_px(ctx,5,8,'#cc3333',sc);_px(ctx,6,8,'#cc3333',sc);_px(ctx,7,8,'#cc3333',sc);_px(ctx,8,8,'#8B0000',sc);}
    else{_px(ctx,4,8,'#8B0000',sc);_px(ctx,5,8,'#cc3333',sc);_px(ctx,6,8,'#cc3333',sc);_px(ctx,7,8,'#8B0000',sc);}
    // zarost (0=brak)
    if(tr.facialHair===1){_px(ctx,4,8,tr.beardColor,sc);_px(ctx,7,8,tr.beardColor,sc);}
    else if(tr.facialHair===2){for(var s1=3;s1<=8;s1++)_px(ctx,s1,9,tr.beardColor,sc);}
    else if(tr.facialHair===3){for(var s2=3;s2<=8;s2++){_px(ctx,s2,9,tr.beardColor,sc);_px(ctx,s2,10,tr.beardColor,sc);}for(var s3=4;s3<=7;s3++)_px(ctx,s3,11,tr.beardColor,sc);}
    // zmarszczki (tylko weterani, losowe)
    if(tr.wrinkle){var wc=_shade(skin,-25);_px(ctx,3,6,wc,sc);_px(ctx,8,6,wc,sc);}
    // dodatki (0=brak)
    if(tr.accessory===1){_px(ctx,2,5,'#222',sc);_px(ctx,9,5,'#222',sc);_px(ctx,5,6,'#222',sc);_px(ctx,6,6,'#222',sc);}
    else if(tr.accessory===2){_px(ctx,8,6,'#e8a0a0',sc);}
  }

  function _clubColors(clubId){
    var idx=(clubId||0)%CCLUB.length;
    return CCLUB[idx<0?0:idx];
  }

  function drawCrest(ctx,clubId,sc){
    var seed=clubId+5000;
    var r=_rng(seed);
    ctx.canvas.width=12*sc;ctx.canvas.height=14*sc;
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    var cols=_clubColors(clubId);
    var c1=cols[0],c2=cols[1];
    var pat=Math.floor(r()*5);
    var sym=Math.floor(r()*3);
    // shield fill
    for(var sy=0;sy<=9;sy++)for(var sx=1;sx<=10;sx++)_px(ctx,sx,sy,c1,sc);
    for(var sx2=2;sx2<=9;sx2++)_px(ctx,sx2,10,c1,sc);
    for(var sx3=3;sx3<=8;sx3++)_px(ctx,sx3,11,c1,sc);
    for(var sx4=4;sx4<=7;sx4++)_px(ctx,sx4,12,c1,sc);
    _px(ctx,5,13,c1,sc);_px(ctx,6,13,c1,sc);
    // pattern
    if(pat===0){for(var py=0;py<=13;py++)for(var px2=6;px2<=10;px2++)_px(ctx,px2,py,c2,sc);}
    else if(pat===1){for(var px3=0;px3<=11;px3++){_px(ctx,px3,3,c2,sc);_px(ctx,px3,4,c2,sc);_px(ctx,px3,5,c2,sc);}}
    else if(pat===2){for(var py2=0;py2<=13;py2++)for(var px4=0;px4<=11;px4++)if(px4+py2<9)_px(ctx,px4,py2,c2,sc);}
    else if(pat===3){for(var py3=0;py3<=5;py3++)for(var px5=6;px5<=10;px5++)_px(ctx,px5,py3,c2,sc);for(var py4=6;py4<=13;py4++)for(var px6=1;px6<=5;px6++)_px(ctx,px6,py4,c2,sc);}
    else{for(var px7=2;px7<=9;px7+=3)for(var py5=0;py5<=13;py5++)_px(ctx,px7,py5,c2,sc);}
    // border
    var bord=[[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[0,1],[11,1],[0,2],[11,2],[0,3],[11,3],[0,4],[11,4],[0,5],[11,5],[0,6],[11,6],[0,7],[11,7],[0,8],[11,8],[0,9],[11,9],[1,10],[10,10],[2,11],[9,11],[3,12],[8,12],[4,13],[7,13],[5,13],[6,13]];
    bord.forEach(function(b){_px(ctx,b[0],b[1],'#ccaa44',sc);});
    // symbol
    if(sym===0){_px(ctx,5,2,'#FFD700',sc);_px(ctx,6,2,'#FFD700',sc);for(var gx=4;gx<=7;gx++)_px(ctx,gx,3,'#FFD700',sc);_px(ctx,5,4,'#FFD700',sc);_px(ctx,6,4,'#FFD700',sc);}
    else if(sym===1){for(var cy=2;cy<=7;cy++){_px(ctx,5,cy,'#FFD700',sc);_px(ctx,6,cy,'#FFD700',sc);}for(var cx=3;cx<=8;cx++){_px(ctx,cx,4,'#FFD700',sc);_px(ctx,cx,5,'#FFD700',sc);}}
    else{_px(ctx,3,2,'#FFD700',sc);_px(ctx,5,1,'#FFD700',sc);_px(ctx,7,1,'#FFD700',sc);_px(ctx,8,2,'#FFD700',sc);for(var crx=3;crx<=8;crx++){_px(ctx,crx,3,'#FFD700',sc);_px(ctx,crx,4,'#FFD700',sc);}}
  }

  var DNUM={
    '0':[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1':[[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2':[[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3':[[1,1,1],[0,0,1],[0,1,1],[0,0,1],[1,1,1]],
    '4':[[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5':[[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6':[[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7':[[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
    '8':[[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9':[[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
    ' ':[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
  };
  function _drawNum(ctx,num,ox,oy,sc,col){
    var digits=String(num).padStart(2,' ').split('');
    ctx.fillStyle=col;
    digits.forEach(function(d,di){
      var g=DNUM[d]||DNUM[' '];
      g.forEach(function(row,ry){row.forEach(function(bit,rx){if(bit)ctx.fillRect((ox+di*4+rx)*sc,(oy+ry)*sc,sc,sc);});});
    });
  }

  // Public API
  window.pxFace=function(seed,sc,age){
    var cv=document.createElement('canvas');
    cv.style.imageRendering='pixelated';
    drawFace(cv.getContext('2d'),seed,sc||3,age);
    return cv;
  };
  window.pxCrest=function(clubId,sc){
    var cv=document.createElement('canvas');
    cv.style.imageRendering='pixelated';
    drawCrest(cv.getContext('2d'),clubId,sc||3);
    return cv;
  };
  window.pxKit=function(clubId,num,sc){
    var r2=_rng((clubId||0)+9000);
    var cols=_clubColors(clubId);
    var c1=cols[0],c2=cols[1];
    var kStyle=Math.floor(r2()*5);
    var W=14,H=18;
    var cv=document.createElement('canvas');
    cv.style.imageRendering='pixelated';
    cv.width=W*(sc||3);cv.height=H*(sc||3);
    var ctx=cv.getContext('2d');
    ctx.clearRect(0,0,cv.width,cv.height);
    var s=sc||3;
    function kpx(x,y,col){ctx.fillStyle=col;ctx.fillRect(x*s,y*s,s,s);}
    // shirt
    for(var ky=3;ky<=13;ky++)for(var kx=2;kx<=11;kx++)kpx(kx,ky,c1);
    for(var ky2=3;ky2<=7;ky2++){kpx(0,ky2,c1);kpx(1,ky2,c1);kpx(12,ky2,c1);kpx(13,ky2,c1);}
    for(var kx2=5;kx2<=8;kx2++)kpx(kx2,2,c1);
    // pattern
    if(kStyle===1){for(var kx3=2;kx3<=11;kx3+=2)for(var ky3=2;ky3<=13;ky3++)kpx(kx3,ky3,c2);}
    else if(kStyle===2){for(var kx4=0;kx4<=13;kx4++){kpx(kx4,5,c2);kpx(kx4,6,c2);kpx(kx4,7,c2);kpx(kx4,8,c2);}}
    else if(kStyle===3){for(var kd=0;kd<7;kd++){for(var ko=-1;ko<=1;ko++){var kxi=kd+2+ko,kyi=kd+3;if(kxi>=0&&kxi<14&&kyi>=3&&kyi<=13)kpx(kxi,kyi,c2);} } }
    else if(kStyle===4){for(var ky4=2;ky4<=13;ky4++)for(var kx5=7;kx5<=13;kx5++)kpx(kx5,ky4,c2);}
    // collar
    kpx(5,2,'#111');kpx(6,2,'#111');kpx(7,2,'#111');kpx(8,2,'#111');
    kpx(5,3,'#111');kpx(8,3,'#111');
    // number
    if(num){
      var digits=String(num).padStart(2,' ').split('');
      var ncol=c2==='#ffffff'?'#000000':'#ffffff';
      ctx.fillStyle=ncol;
      digits.forEach(function(d,di){var g=DNUM[d]||DNUM[' '];g.forEach(function(row,ry){row.forEach(function(bit,rx){if(bit)ctx.fillRect((4+di*4+rx)*s,(8+ry)*s,s,s);});});});
    }
    // shorts
    var sc2=c2==='#ffffff'?'#222222':c2;
    for(var ky5=14;ky5<=17;ky5++)for(var kx6=2;kx6<=11;kx6++)kpx(kx6,ky5,sc2);
    kpx(6,14,'#0a0a0a');kpx(7,14,'#0a0a0a');
    return cv;
  };
  window.pxClubColors=_clubColors;
})();
