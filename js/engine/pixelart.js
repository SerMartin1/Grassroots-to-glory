
// ── PIXEL ART ENGINE ─────────────────────────────────────────
(function(){
  function _mlb(seed){var s=seed;return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function _rng(seed){var r=_mlb(seed*1327+9371);for(var i=0;i<5;i++)r();return r;}
  var SKIN=['#FDBCB4','#E8A882','#C68642','#8D5524','#5C3317','#FFCBA4'];
  var HAIR=['#1a1a1a','#2c1810','#8B4513','#FFD700','#C0C0C0','#8B0000','#FF8C00','#4a4a4a'];
  var EYES=['#1a1a6e','#228B22','#8B4513','#1a1a1a','#4169E1','#808080'];
  var CCLUB=[['#CC0000','#ffffff'],['#003399','#ffffff'],['#006400','#ffffff'],['#8B0000','#FFD700'],['#000080','#ffffff'],['#FF6600','#000000'],['#660066','#ffffff'],['#003366','#FFD700'],['#CC0000','#000000'],['#006633','#ffffff'],['#1a1a1a','#ffffff'],['#990000','#0000CC'],['#003300','#FFD700'],['#CC3300','#003399'],['#660000','#FFD700'],['#336600','#ffffff'],['#003333','#FFD700'],['#660033','#ffffff'],['#330066','#FFD700'],['#333300','#ffffff']];

  function _px(ctx,x,y,col,sc){ctx.fillStyle=col;ctx.fillRect(x*sc,y*sc,sc,sc);}

  function drawFace(ctx,seed,sc){
    var r=_rng(seed);
    ctx.canvas.width=12*sc;ctx.canvas.height=14*sc;
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    var skin=SKIN[Math.floor(r()*SKIN.length)];
    var hair=HAIR[Math.floor(r()*HAIR.length)];
    var eye=EYES[Math.floor(r()*EYES.length)];
    var beardRoll=r();
    var beardCol=HAIR[Math.floor(r()*HAIR.length)];
    var hStyle=Math.floor(r()*4);
    var mood=Math.floor(r()*3);
    // head fill
    for(var hy=2;hy<=9;hy++)for(var hx=2;hx<=9;hx++)_px(ctx,hx,hy,skin,sc);
    _px(ctx,2,2,skin,sc);_px(ctx,9,2,skin,sc);
    for(var nx=3;nx<=8;nx++){_px(ctx,nx,1,skin,sc);}
    for(var nx2=3;nx2<=8;nx2++){_px(ctx,nx2,10,skin,sc);}
    _px(ctx,4,11,skin,sc);_px(ctx,5,11,skin,sc);_px(ctx,6,11,skin,sc);_px(ctx,7,11,skin,sc);
    // hair
    if(hStyle===0){for(var hx2=3;hx2<=8;hx2++)_px(ctx,hx2,1,hair,sc);for(var hx3=2;hx3<=9;hx3++)_px(ctx,hx3,2,hair,sc);}
    else if(hStyle===1){for(var hx4=3;hx4<=8;hx4++){_px(ctx,hx4,0,hair,sc);_px(ctx,hx4,1,hair,sc);}for(var hx5=2;hx5<=9;hx5++)_px(ctx,hx5,2,hair,sc);_px(ctx,2,3,hair,sc);_px(ctx,9,3,hair,sc);}
    else if(hStyle===2){for(var hx6=3;hx6<=8;hx6++){_px(ctx,hx6,0,hair,sc);_px(ctx,hx6,1,hair,sc);}for(var hx7=2;hx7<=9;hx7++)_px(ctx,hx7,2,hair,sc);for(var hy2=3;hy2<=8;hy2++){_px(ctx,2,hy2,hair,sc);_px(ctx,9,hy2,hair,sc);}}
    // eyes
    _px(ctx,3,5,eye,sc);_px(ctx,4,5,'#000',sc);
    _px(ctx,7,5,eye,sc);_px(ctx,8,5,'#000',sc);
    // nose
    _px(ctx,5,7,'#b06050',sc);_px(ctx,6,7,'#b06050',sc);
    // mouth
    if(mood===0){_px(ctx,4,8,'#8B0000',sc);_px(ctx,5,8,'#cc3333',sc);_px(ctx,6,8,'#cc3333',sc);_px(ctx,7,8,'#8B0000',sc);}
    else if(mood===1){for(var mx=4;mx<=7;mx++)_px(ctx,mx,8,'#8B0000',sc);}
    else{_px(ctx,3,8,'#8B0000',sc);for(var mx2=4;mx2<=7;mx2++)_px(ctx,mx2,8,'#cc3333',sc);_px(ctx,8,8,'#8B0000',sc);}
    // beard
    if(beardRoll>0.6){for(var bx=3;bx<=8;bx++){_px(ctx,bx,9,beardCol,sc);_px(ctx,bx,10,beardCol,sc);}for(var bx2=4;bx2<=7;bx2++)_px(ctx,bx2,11,beardCol,sc);}
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
  window.pxFace=function(seed,sc){
    var cv=document.createElement('canvas');
    cv.style.imageRendering='pixelated';
    drawFace(cv.getContext('2d'),seed,sc||3);
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
