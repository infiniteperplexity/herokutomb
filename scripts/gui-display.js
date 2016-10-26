// The lowest-level GUI functionality, interacting with the DOM directly or through ROT.js.
HTomb = (function(HTomb) {
  "use strict";
  // break out constants
  var SCREENW = HTomb.Constants.SCREENW;
  var SCREENH = HTomb.Constants.SCREENH;
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var NLEVELS = HTomb.Constants.NLEVELS;
  var SCROLLH = HTomb.Constants.SCROLLH;
  var SCROLLW = HTomb.Constants.SCROLLW;
  var MENUW = HTomb.Constants.MENUW;
  var MENUH = HTomb.Constants.MENUH;
  var STATUSH = HTomb.Constants.STATUSH;
  var FONTSIZE = HTomb.Constants.FONTSIZE;
  var UNIBLOCK = HTomb.Constants.UNIBLOCK;
  var EARTHTONE = HTomb.Constants.EARTHTONE;
  var SHADOW = HTomb.Constants.SHADOW;
  var FONTFAMILY = HTomb.Constants.FONTFAMILY;
  var CHARHEIGHT = HTomb.Constants.CHARHEIGHT;
  var CHARWIDTH = HTomb.Constants.CHARWIDTH;
  var TEXTFONT = HTomb.Constants.TEXTFONT;
  var TEXTSIZE = HTomb.Constants.TEXTSIZE;
  var XSKEW = HTomb.Constants.XSKEW;
  var YSKEW = HTomb.Constants.YSKEW;
  var TEXTSPACING = HTomb.Constants.TEXTSPACING;
  var TEXTWIDTH = HTomb.Constants.TEXTWIDTH;
  var coord = HTomb.Utils.coord;
  // set up GUI and display
  var GUI = HTomb.GUI;

  let Panels = GUI.Panels;
  let gameScreen = Panels.gameScreen;
  let menu = Panels.menu;
  let menuDisplay = Panels.menu.display;
  let scroll = Panels.scroll;
  let scrollDisplay = scroll.display;
  let status = Panels.status;
  let overlay = Panels.overlay;
  let overlayDisplay = overlay.display;

  // Basic rendering of panels
  // Keep track of how many tiles it is offset from 0, 0
  gameScreen.xoffset = 0;
  gameScreen.yoffset = 0;
  // Keep track of which Z level it is on
  gameScreen.z = 1;
  gameScreen.render = function() {
    var z = gameScreen.z;
    var xoffset = gameScreen.xoffset;
    var yoffset = gameScreen.yoffset;
    for (var x = xoffset; x < xoffset+SCREENW; x++) {
      for (var y = yoffset; y < yoffset+SCREENH; y++) {
        if (gameScreen.z===undefined) {
          alert("wtf!");
        }
        // Draw every symbol in the right
        var sym = HTomb.Tiles.getSymbol(x,y,z);
        gameScreen.display.draw(this.x0+x-xoffset,this.y0+y-yoffset, sym[0], sym[1], sym[2]);
      }
    }
    gameScreen.renderParticles();
  };
  gameScreen.recenter = function() {
    var Player = HTomb.Player;
    gameScreen.z = Player.z;
    if (Player.x >= gameScreen.xoffset+SCREENW-2) {
      gameScreen.xoffset = Player.x-SCREENW+2;
    } else if (Player.x <= gameScreen.xoffset) {
      gameScreen.xoffset = Player.x-1;
    }
    if (Player.y >= gameScreen.yoffset+SCREENH-2) {
      gameScreen.yoffset = Player.y-SCREENH+2;
    } else if (Player.y <= gameScreen.yoffset) {
      gameScreen.yoffset = Player.y-1;
    }
  };
  gameScreen.center = function(x,y,z) {
    x = x-Math.floor(SCREENW/2)-1;
    y = y-Math.floor(SCREENH/2)-1;
    z = z || HTomb.Player.z;
    x = Math.max(x,Math.ceil(SCREENW/2));
    y = Math.max(y,Math.ceil(SCREENW/2));
    x = Math.min(x,Math.floor(LEVELW-1-SCREENW/2));
    y = Math.min(y,Math.floor(LEVELH-1-SCREENH/2));
    gameScreen.xoffset = x;
    gameScreen.yoffset = y;
  };
  var oldSquares;
  gameScreen.renderParticles = function() {
    var squares = {};
    var p,c,x,y,z;
    // collect the particles
    for (var j=0; j<HTomb.Particles.emitters.length; j++) {
      var emitter = HTomb.Particles.emitters[j];
      for (var i=0; i<emitter.particles.length; i++) {
        p = emitter.particles[i];
        // don't collect particles that aren't on the screen
        x = Math.round(p.x);
        if (x<gameScreen.xoffset || x>=gameScreen.xoffset+SCREENW || x>=LEVELW-1) {
          continue;
        }
        y = Math.round(p.y);
        if (y<gameScreen.yoffset || y>=gameScreen.yoffset+SCREENH || y>=LEVELH-1) {
          continue;
        }
        z = Math.round(p.z);
        // only bother with particles on the same level for now...or maybe within one level?
        //if (z!==gameScreen.z) {
        //  continue;
        //}
        c = coord(x,y,z);
        if (squares[c]===undefined) {
          squares[c] = [];
        }
        squares[c].push(p);
      }
    }
    // process the particles
    for (var s in squares) {
      if (oldSquares[s]) {
        delete oldSquares[s];
      }
      c = HTomb.Utils.decoord(s);
      x = c[0];
      y = c[1];
      z = c[2];
      var particles = squares[s];
      HTomb.Utils.shuffle(particles);
      var ch, fg;
      // if there are ever invisible particles we may need to handle this differently
      fg = HTomb.Tiles.getGlyph(x,y,z)[1];
      fg = ROT.Color.fromString(fg);
      for (var k=0; k<particles.length; k++) {
        var pfg = particles[k].fg;
        pfg[0] = Math.min(255,Math.max(pfg[0],0));
        pfg[1] = Math.min(255,Math.max(pfg[1],0));
        pfg[2] = Math.min(255,Math.max(pfg[2],0));
        //fg = HTomb.Utils.alphaHex(pfg, fg, particles[k].alpha);
        fg = HTomb.Utils.alphaHex(pfg, fg, particles[k].alpha);
      }
      fg[0] = Math.round(fg[0]);
      fg[1] = Math.round(fg[1]);
      fg[2] = Math.round(fg[2]);
      fg = ROT.Color.toHex(fg);
      ch = particles[particles.length-1].symbol;
      gameScreen.drawGlyph(x,y,ch,fg);
    }
    // clean up expired particles
    for (var o in oldSquares) {
      c = HTomb.Utils.decoord(o);
      x = c[0];
      y = c[1];
      gameScreen.refreshTile(x,y);
    }
    oldSquares = squares;
  };

  status.render = function() {
    //black out the entire line with solid blocks
    var cursor = 0;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"%c{black}"+(UNIBLOCK.repeat(SCROLLW-2)));
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"Mana:" + HTomb.Player.caster.mana + "/" + HTomb.Player.caster.maxmana);
    cursor+=12;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"X:" + HTomb.Player.x);
    cursor+=6;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"Y:" + HTomb.Player.y);
    cursor+=6;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"Z:" + gameScreen.z);
    cursor+=7;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,
      HTomb.Time.dailyCycle.getPhase().symbol + " "
      + HTomb.Time.dailyCycle.day + ":"
      + HTomb.Time.dailyCycle.hour + ":"
      + HTomb.Time.dailyCycle.minute);
    cursor+=11;
    if (HTomb.Time.isPaused()===true) {
      scrollDisplay.drawText(this.x0+cursor,this.y0+1,"Paused");
    }
  };
  scroll.buffer = [];
  scroll.render = function() {
    for (var s=0; s<this.buffer.length; s++) {
      //black out the entire line with solid blocks
      scrollDisplay.drawText(this.x0,this.y0+s+1,"%c{black}"+(UNIBLOCK.repeat(SCREENW+MENUW-2)));
      scrollDisplay.drawText(this.x0,this.y0+s+1,this.buffer[s]);
    }
  };
  menu.render = function() {
    for (var i=0; i<SCREENH+SCROLLH; i++) {
      menuDisplay.drawText(this.x0, this.y0+i, "%c{black}"+(UNIBLOCK.repeat(MENUW-2)));
      if (menu.text[i]) {
        var j = 0;
        if (menu.text[i].charAt(0)===" ") {
          for (j=0; j<menu.text[i].length; j++) {
            if (menu.text[i].charAt(j)!==" ") {
              break;
            }
          }
        }
        menuDisplay.drawText(this.x0+j, this.y0+i, menu.text[i]);
      }
    }
  };

  GUI.reset = function() {
    if (overlay.active) {
      overlay.hide();
    }
    GUI.Contexts.active = GUI.Contexts.main;
    // This shoudl probably be handled a bit differently?
    menu.refresh(); // menu.refresh();
    gameScreen.recenter(); // gameScreen.recenter();
    GUI.render(); // Actions.render();
  };
  // This should probably be an Event, not a GUI method
  GUI.sensoryEvent = function(strng,x,y,z) {
    if (HTomb.World.visible[HTomb.Utils.coord(x,y,z)]) {
      GUI.pushMessage(strng);
    }
  };
  GUI.pushMessage = function(strng) {
    scroll.buffer.push(strng);
    if (scroll.buffer.length>=SCROLLH) {
      scroll.buffer.shift();
    }
    // Render the message immediatey if the scroll is visible
    //if (GUI.panels.bottom===scroll) {
      scroll.render();
    //}
  };
  HTomb.Debug.pushMessage = function(msg) {
    if (HTomb.Debug.messages===true) {
      HTomb.GUI.pushMessage(msg);
      console.log(msg);
    }
  };

  // Render all four default panels
  GUI.render = function() {
    gameScreen.render();
    status.render();
    scroll.render();
    menu.render();
  };
  //******end defaults

  // ***** Basic right-hand menu stuff *****
  menu.defaultText = [
    "Movement: NumPad / Arrows.",
    "(Shift+Arrows for diagonal.)",
    "J: Assign Job, Z: Cast Spell.",
    "G: Pick Up, D: Drop, I: Inventory.",
    "Space: Wait, Tab: Survey Mode.",
    "PageUp / PageDown to change speed.",
    "Hover mouse to examine a square.",
    "Click to pause or unpause.",
    "Right click for detailed view.",
    "Escape for summary view."
  ];
  // This function will correctly break text into lines
  menu.update = function(arr) {
    if (arr===undefined) {
      if (HTomb.Debug.tutorial.active!==true) {
        arr = menu.defaultText;
      } else {
        let tutorialText = menu.defaultText.concat([" ","TUTORIAL:",HTomb.Debug.tutorial.getText()]);
        arr = tutorialText;
      }
    }
    var i=0;
    var br=null;
    while(i<arr.length) {
      if (arr[i].length<MENUW-2) {
        i++;
        continue;
      }
      for (var j=0; j<arr[i].length; j++) {
        if (arr[i][j]===" ") {
          br = j;
        }
        if (j>=MENUW-2) {
          var one = arr[i].substring(0,br);
          var two = arr[i].substring(br+1);
          arr[i] = one;
          arr.splice(i+1,0,two);
          break;
        }
      }
      i++;
      br = null;
    }
    menu.text = arr;
    menu.render();
  };
  menu.refresh = function() {
    menu.update(GUI.Contexts.active.menuText || undefined);
  };


  // *** Drawing on the game screen *****
  gameScreen.refreshTile = function(x,y) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    var z = gameScreen.z;
    var sym = HTomb.Tiles.getSymbol(x,y,z);
    gameScreen.display.draw(
      x-xoffset,
      y-yoffset,
      sym[0],
      sym[1],
      sym[2]
    );
  };
  // Draw a character at the appropriate X and Y tile
  gameScreen.drawTile = function(x,y,ch,fg,bg) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    fg = fg || "white"  ;
    bg = bg || "black";
    gameScreen.display.draw(
      x-xoffset,
      y-yoffset,
      ch,
      fg,
      bg
    );
  };

  gameScreen.drawGlyph = function(x,y,ch,fg) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    fg = fg || "white";
    var z = gameScreen.z;
    var bg = HTomb.Tiles.getBackground(x,y,z);
    gameScreen.display.draw(
      x-xoffset,
      y-yoffset,
      ch,
      fg,
      bg
    );
  };

  // Change the background color of the appropriate X and Y tile
  gameScreen.highlightTile = function(x,y,bg) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    var z = gameScreen.z;
    var sym = HTomb.Tiles.getGlyph(x,y,z);
    gameScreen.display.draw(
      x-xoffset,
      y-yoffset,
      sym[0],
      sym[1],
      bg
    );
  };

  overlay.update = function(arr) {
    overlay.currentLines = arr;
    HTomb.Time.stopTime();
    HTomb.Time.stopParticles();
    // we may not want to force the player to reset the GUI...but let's try it out
    for (var i=0; i<SCREENH+SCROLLH; i++) {
      overlayDisplay.drawText(1,1+i,"%c{black}"+(UNIBLOCK.repeat(SCREENW*(CHARWIDTH/TEXTWIDTH)+MENUW-2)));
    }
    for (var j=0; j<arr.length; j++) {
      var x=0;
      if (arr[j].charAt(0)===" ") {
        for (x=1; x<arr[j].length; x++) {
          if (arr[j].charAt(x)!==" ") {
            break;
          }
        }
      }
      overlayDisplay.drawText(4+x, 3+j, arr[j]);
    }
    overlay.unhide();
  }

  GUI.splash = function(arr) {
    GUI.Contexts.active = GUI.Contexts.new();
    overlay.update(arr);
  };

  return HTomb;
})(HTomb);
