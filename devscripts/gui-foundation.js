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

  let GUI = HTomb.GUI;
  /// ***************Handle DOM interaction, directly or through ROT.js************
  var display = new ROT.Display({
    width: SCREENW,
    height: SCREENH,
    fontSize: FONTSIZE,
    fontFamily: FONTFAMILY,
    forceSquareRatio: true
  });
  console.log("Aspect ratio is "+display._backend._spacingX + "x"+display._backend._spacingY+".");
  let canv = display.getContainer();
  console.log("Screen dimensions are "+canv.width + "x" + canv.height+".");

  var scrollDisplay = new ROT.Display({
    width: SCROLLW,
    height: STATUSH+SCROLLH,
    fontSize: TEXTSIZE,
    fontFamily: TEXTFONT,
    spacing: TEXTSPACING
  });
  var menuDisplay = new ROT.Display({
    width: MENUW,
    height: MENUH,
    fontSize: TEXTSIZE,
    fontFamily: TEXTFONT,
    spacing: TEXTSPACING
  });
  //HTomb.GUI.Panels.gameScreen.display._context.canvas.width
  var overlayDisplay = new ROT.Display({
    width: SCREENW*CHARWIDTH/(TEXTWIDTH-TEXTSPACING)+MENUW,
    height: MENUH,
    fontSize: TEXTSIZE,
    fontFamily: TEXTFONT,
    spacing: TEXTSPACING
  });
  GUI.domInit = function() {
    var body = document.body;
    var div = document.createElement("div");
    div.id = "main";
    var game = document.createElement("div");
    game.id = "game";
    var menu = document.createElement("div");
    menu.id = "menu";
    var scroll = document.createElement("div");
    scroll.id = "scroll";
    var overlay = document.createElement("div");
    overlay.id = "overlay";
    body.appendChild(div);
    div.appendChild(game);
    div.appendChild(menu);
    div.appendChild(scroll);
    div.appendChild(overlay);
    game.appendChild(display.getContainer());
    menu.appendChild(menuDisplay.getContainer());
    scroll.appendChild(scrollDisplay.getContainer());
    overlay.appendChild(overlayDisplay.getContainer());
  };

  // Attach input events
  var controlArrow = null;
  var shiftDown = null;
  var keydown = function(key) {
    key.preventDefault();
    // VK_RETURN is often used to toggle time, and stopping time first breaks that
    if (key.keyCode!==ROT.VK_RETURN) {
      HTomb.Time.stopTime();
    }
    if (GUI.Contexts.locked===true) {
      return;
    }
    if (key.shiftKey) {
      shiftDown = true;
    }
    // Pass the keystroke to the current control context
    var diagonal = null;
    if (key.ctrlKey && [ROT.VK_UP,ROT.VK_DOWN,ROT.VK_LEFT,ROT.VK_RIGHT].indexOf(key.keyCode)>-1) {
      if (controlArrow===null) {
        controlArrow = key.keyCode;
      } else if (controlArrow===ROT.VK_UP) {
        if (key.keyCode===ROT.VK_LEFT) {
          diagonal = ROT.VK_NUMPAD7;
        } else if (key.keyCode===ROT.VK_RIGHT) {
          diagonal = ROT.VK_NUMPAD9;
        } else {
          controlArrow = key.keyCode;
        }
      } else if (controlArrow===ROT.VK_DOWN) {
        if (key.keyCode===ROT.VK_LEFT) {
          diagonal = ROT.VK_NUMPAD1;
        } else if (key.keyCode===ROT.VK_RIGHT) {
          diagonal = ROT.VK_NUMPAD3;
        } else {
          controlArrow = key.keyCode;
        }
      } else if (controlArrow===ROT.VK_LEFT) {
        if (key.keyCode===ROT.VK_UP) {
          diagonal = ROT.VK_NUMPAD7;
        } else if (key.keyCode===ROT.VK_DOWN) {
          diagonal = ROT.VK_NUMPAD1;
        } else {
          controlArrow = key.keyCode;
        }
      } else if (controlArrow===ROT.VK_RIGHT) {
        if (key.keyCode===ROT.VK_UP) {
          diagonal = ROT.VK_NUMPAD9;
        } else if (key.keyCode===ROT.VK_DOWN) {
          diagonal = ROT.VK_NUMPAD3;
        } else {
          controlArrow = key.keyCode;
        }
      }
      if (diagonal!==null) {
        GUI.Contexts.active.keydown({keyCode: diagonal});
      }
    } else {
      GUI.Contexts.active.keydown(key);
    }
  };
  function keyup(key) {
    if (key.keyCode===controlArrow) {
      controlArrow=null;
    } else if (key.shiftKey) {
      shiftDown = false;
    }
  }
  HTomb.GUI.shiftDown = function() {
    return shiftDown;
  };
  var keyCursor = false;
  HTomb.GUI.toggleKeyCursor = function() {
    keyCursor = !keyCursor;
    //HTomb.GUI.reset();
    if (keyCursor) {
      let k = HTomb.GUI.getKeyCursor();
      HTomb.GUI.Contexts.active.mouseTile(k[0],k[1]);
    }
    HTomb.GUI.Panels.menu.refresh();
  };
  HTomb.GUI.getKeyCursor = function() {
    if (keyCursor) {
      return [HTomb.GUI.Panels.gameScreen.xoffset+Math.floor(HTomb.Constants.SCREENW/2),HTomb.GUI.Panels.gameScreen.yoffset+Math.floor(HTomb.Constants.SCREENH/2)];
    } else {
      return false;
    }
  };

  // this may change a bit if I add click functionality to other canvases
  var mousedown = function(click) {
    click.preventDefault();
    if (GUI.Contexts.locked===true) {
      return;
    }
    if (GUI.getKeyCursor()) {
      return;
    }
    // Convert X and Y from pixels to characters
    var x = Math.floor((click.clientX+XSKEW)/CHARWIDTH-1);
    var y = Math.floor((click.clientY+YSKEW)/CHARHEIGHT-1);
    var gameScreen = GUI.Panels.gameScreen;
    if (x+gameScreen.xoffset>=LEVELW || x+gameScreen.xoffset<0 || y+gameScreen.yoffset>=LEVELH || y+gameScreen.yoffset<0) {
      GUI.Contexts.active.mouseOver();
    }
    if (click.button===2) {
      GUI.Contexts.active.rightClickTile(x+gameScreen.xoffset,y+gameScreen.yoffset);
    } else {
      GUI.Contexts.active.clickTile(x+gameScreen.xoffset,y+gameScreen.yoffset);
    }
  };
  var mousemove = function(move) {
    if (GUI.Contexts.locked===true) {
      return;
    }
    if (GUI.getKeyCursor()) {
      return;
    }
    // Convert X and Y from pixels to characters
    var x = Math.floor((move.clientX+XSKEW)/CHARWIDTH-1);
    var y = Math.floor((move.clientY+YSKEW)/CHARHEIGHT-1);
      // If the hover is on the game screen, pass the X and Y tile coordinates
    var gameScreen = GUI.Panels.gameScreen;
    GUI.Contexts.mouseX = x;
    GUI.Contexts.mouseY = y;
    if (x+gameScreen.xoffset>=LEVELW || x+gameScreen.xoffset<0 || y+gameScreen.yoffset>=LEVELH || y+gameScreen.yoffset<0) {
      GUI.Contexts.active.mouseOver();
    } else {
      GUI.Contexts.active.mouseTile(x+gameScreen.xoffset,y+gameScreen.yoffset);
    }
  };
  // Bind a ROT.js keyboard constant to a function for a particular context
  var bindKey = GUI.bindKey = function(target, key, func) {
    target.boundKeys[ROT[key]] = func;
  };
  // Set up event listeners
  setTimeout(function() {
    window.addEventListener("keydown",keydown);
    window.addEventListener("keyup",keyup);
    display.getContainer().addEventListener("mousedown",mousedown);
    display.getContainer().addEventListener("mousemove",mousemove);
    window.oncontextmenu = function(e) {if (e && e.stopPropagation) {e.stopPropagation();} return false;};
    menuDisplay.getContainer().addEventListener("mousemove",function() {GUI.Contexts.active.mouseOver();});
    scrollDisplay.getContainer().addEventListener("mousemove",function() {GUI.Contexts.active.mouseOver();});
    ///!!!! Maybe get rid of the next line....
    overlayDisplay.getContainer().addEventListener("mousedown",function() {GUI.Contexts.active.clickOverlay();});
    console.log("adding event listeners");
  },500);

  //************* Define the basic panels and how they access the DOM *********;
  GUI.Panels = {};
  function Panel(leftx, topy, display, element, active) {
    this.x0 = leftx;
    this.y0 = topy;
    this.display = display;
    this.element = element;
    if (active===false) {
      this.active = active;
    } else {
      this.active = true;
    }

    this.render = function() {};
  }
  Panel.prototype.width = function() {
    return this.display._context.canvas.width;
  }
  Panel.prototype.hide = function() {
    document.getElementById(this.element).style.display = "none";
    this.active = false;
  }
  Panel.prototype.unhide = function() {
    document.getElementById(this.element).style.display = "initial";
    this.active = true;
  }

  GUI.Panels.gameScreen = new Panel(0,0,display);
  GUI.Panels.status = new Panel(1,0,scrollDisplay);
  GUI.Panels.scroll = new Panel(1,STATUSH,scrollDisplay);
  GUI.Panels.menu = new Panel(0,1,menuDisplay);
  GUI.Panels.overlay = new Panel(0,0,overlayDisplay,"overlay",false);

  //******* Define the abstract control context *******
  GUI.Contexts = {};
  GUI.Contexts.mouseX = 0;
  GUI.Contexts.mouseY = 0;
  GUI.Contexts.locked = false;

  function Context(bindings) {
    // Pass a map of keystroke / function bindings
    if (bindings===undefined) {
      this.keydown = GUI.reset;
    } else {
      this.boundKeys = [];
      for (var b in bindings) {
        bindKey(this,b,bindings[b]);
      }
    }
  }
  Context.prototype.bindKey = function(k, f) {
    bindKey(this,k,f);
  };
  Context.prototype.keydown = function(key) {
    if (  this.boundKeys[key.keyCode]===undefined) {
      HTomb.Debug.pushMessage("No binding for " + key.keyCode);
    } else {
      this.boundKeys[key.keyCode]();
    }
  };
  Context.prototype.clickOverlay = function() {
    GUI.reset();
  }

  GUI.Contexts.new = function(args) {
    return new Context(args);
  }
  // I don't think this line works...
  GUI.Contexts.default = Context.prototype;

  return HTomb;
})(HTomb);