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
  var gameScreen = GUI.Panels.gameScreen;
  var overlay = GUI.Panels.overlay;
  var menu = GUI.Panels.menu;
  var scroll = GUI.Panels.scroll;

  let Contexts = GUI.Contexts;
  let Commands = HTomb.Commands;
  let Views = GUI.Views = {};
  let Main = GUI.Views.Main = {};



  Main.inSurveyMode = false;
  Main.reset = function() {
    if (HTomb.GUI.autopause===false && HTomb.Time.initialPaused!==true) {
      HTomb.Time.startTime();
    }
    if (overlay.active) {
      overlay.hide();
    }
    if (Main.inSurveyMode===true) {
      Main.surveyMode();
      return;
    }
    GUI.Contexts.active = GUI.Contexts.main;
    menu.middle = menu.defaultMiddle;
    menu.bottom = menu.defaultBottom;
    menu.refresh();
    // This can be a bit annoying at times...
    let p = HTomb.Player;
    if (!GUI.getKeyCursor || gameScreen.xoffset>p.x || gameScreen.yoffset>p.y || gameScreen.xoffset<=p.x-SCREENW || gameScreen.yoffset<=p.y-SCREENW) {
      gameScreen.recenter();
    }
    GUI.render();
  };
  // **** Set default controls
  // By default, dragging the mouse outside the game screen resets the game screen
  // This clears out highlighted tiles from hovering, for example
  var oldCursor = null;
  Contexts.default.mouseOver = function() {
    if (oldCursor!==null) {
      gameScreen.refreshTile(oldCursor[0],oldCursor[1]);
    }
    oldCursor = null;
  };

  function mouseTile(x,y) {
    if (oldCursor!==null) {
      gameScreen.refreshTile(oldCursor[0],oldCursor[1]);
    }
    gameScreen.highlightTile(x,y,"#00FFFF");
    oldCursor = [x,y];
  }

  Contexts.default.mouseTile = function(x,y) {
    mouseTile(x,y);
    menu.bottom = examineSquare(x,y,gameScreen.z);
    menu.refresh();
  };

  Contexts.default.clickAt = HTomb.Time.toggleTime;
  // This is a really ad hoc thing to keep wandering creatures from grabbing focus
  let movedSinceLastWait = true;
  Contexts.default.clickTile = function(x,y) {
    // If we clicked on a creature, go to creature view
    let c = HTomb.World.creatures[coord(x,y,gameScreen.z)];
    let visible = HTomb.World.visible[coord(x,y,gameScreen.z)];
    let keyCursor = GUI.getKeyCursor();
    if (c && visible && movedSinceLastWait) {
      // In keyboard cursor mode, don't select the player; wait instead
      if (keyCursor && c===HTomb.Player) {
        Commands.wait();
        GUI.Contexts.active.mouseTile(keyCursor[0],keyCursor[1]);
        return;
      } else {
        GUI.Views.creatureView(c);
        return;
      }
    }
    // If we clicked on a workshop, go to workshop view
    let f = HTomb.World.features[coord(x,y,gameScreen.z)];
    if (f && f.structure && f.structure.isPlaced() && HTomb.World.creatures[coord(x,y,gameScreen.z)]===undefined) {
      GUI.Views.structureView(f.structure);
      return;
    }
    // In keyboard cursor mode, if you didn't click on anything interesting, wait
    if (keyCursor) {
      Commands.wait();
      GUI.Contexts.active.mouseTile(keyCursor[0],keyCursor[1]);
      movedSinceLastWait = false;
      return;
    }
    // Otherwise, toggle time
    Contexts.default.clickAt();
  }
  Contexts.default.rightClickTile = function(x,y) {
    this.clickTile(x,y);
  };

  // **** Selection and targeting methods
  GUI.selectSquareZone = function(z, callb, options) {
    options = options || {};
    let hover = options.hover || function(x, y, z, sq) {};
    //var context = Object.create(survey);
    var context = HTomb.Utils.clone(survey);
    GUI.bindKey(context, "VK_K", function() {
      HTomb.GUI.toggleKeyCursor();;
      GUI.selectSquareZone(z, callb, options);
      menu.refresh();
    });
    GUI.bindKey(context, "VK_ESCAPE", GUI.reset);
    context.menuText = [
      "%c{orange}**Esc: Cancel.**",
      //"%c{yellow}Select first corner.",
      "%c{yellow}Select first corner" + ((HTomb.GUI.getKeyCursor()) ? " with keyboard." : " with the mouse."),
      "Backspace / Delete: Center on player.",
      "K: Keyboard-only mode.",
      " ",
      "Move" + ((HTomb.GUI.getKeyCursor()) ? " cursor" : " screen") + ": NumPad / Arrows.",
      "(Control+Arrows for diagonal.)",
      "<: Up, >: Down.",
      "Click or Space: Select.",
      "Enter: Pause/Unpause."
    ];
    if (options.message) {
      context.menuText.unshift("");
      context.menuText.unshift(options.message);
    }
    Contexts.active = context;
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    context.mouseTile = function(x,y) {
      mouseTile(x,y)
      hover(x, y, gameScreen.z);
      menu.bottom = examineSquare(x,y,gameScreen.z);
      menu.refresh();
    };
    context.clickTile = function (x,y) {
      context.menuText[1] = "%c{yellow}Select second corner" + ((HTomb.GUI.getKeyCursor()) ? " with keyboard." : " with the mouse.");
      context.menuText[2] = "Move" + ((HTomb.GUI.getKeyCursor()) ? " cursor" : " screen") + ": NumPad / Arrows.";
      var context2 = HTomb.Utils.clone(survey);
      GUI.bindKey(context2, "VK_K", function() {
        HTomb.GUI.toggleKeyCursor();;
        context.clickTile(x,y);
        menu.refresh();
      });
      Contexts.active = context2;
      context2.menuText = context.menuText;
      menu.refresh();
      context2.clickTile = secondSquare(x,y);
      context2.mouseTile = drawSquareBox(x,y);
      let keyCursor2 = GUI.getKeyCursor();
      if (keyCursor2) {
        context2.mouseTile(keyCursor2[0],keyCursor2[1]);
      }
    };
    let keyCursor = GUI.getKeyCursor();
    if (keyCursor) {
      context.mouseTile(keyCursor[0],keyCursor[1]);
    }
    var drawSquareBox = function(x0,y0) {
      var bg = options.bg || "#550000";
      return function(x1,y1) {
        gameScreen.render();
        var xs = [];
        var ys = [];
        for (var i=0; i<=Math.abs(x1-x0); i++) {
          xs[i] = x0+i*Math.sign(x1-x0);
        }
        for (var j=0; j<=Math.abs(y1-y0); j++) {
          ys[j] = y0+j*Math.sign(y1-y0);
        }
        var squares = [];
        for (var x=0; x<xs.length; x++) {
          for (var y=0; y<ys.length; y++) {
            if (options.outline===true) {
              if (xs[x]===x0 || xs[x]===x1 || ys[y]===y0 || ys[y]===y1) {
                squares.push([xs[x],ys[y],gameScreen.z]);
              }
            } else {
              squares.push([xs[x],ys[y],gameScreen.z]);
            }
          }
        }
        for (var k =0; k<squares.length; k++) {
          var coord = squares[k];
          gameScreen.highlightTile(coord[0],coord[1],bg);
        }
        hover(x1, y1, gameScreen.z, squares);
        menu.bottom = examineSquare(x1,y1,gameScreen.z);
        menu.refresh();
      };
    };
    var secondSquare = function(x0,y0) {
      return function(x1,y1) {
        var xs = [];
        var ys = [];
        for (var i=0; i<=Math.abs(x1-x0); i++) {
            xs[i] = x0+i*Math.sign(x1-x0);
          }

        for (var j=0; j<=Math.abs(y1-y0); j++) {
          ys[j] = y0+j*Math.sign(y1-y0);
        }
        var squares = [];
        for (var x=0; x<xs.length; x++) {
          for (var y=0; y<ys.length; y++) {
            // If options.outline = true, use only the outline
            if (options.outline===true) {
              if (xs[x]===x0 || xs[x]===x1 || ys[y]===y0 || ys[y]===y1) {
                squares.push([xs[x],ys[y],gameScreen.z]);
              }
            } else {
              squares.push([xs[x],ys[y],gameScreen.z]);
            }
          }
        }
        // Invoke the callback function on the squares selected
        callb(squares, options);
        if (options.reset!==false) {
          GUI.reset();
        }
      };
    };
  };

  GUI.selectBox = function(width, height, z, callb, options) {
    options = options || {};
    let hover = options.hover || function(sq) {};
    var gameScreen = GUI.Panels.gameScreen;
    //var context = Object.create(survey);
    var context = HTomb.Utils.clone(survey);
    GUI.bindKey(context, "VK_K", function() {
      HTomb.GUI.toggleKeyCursor();;
      GUI.selectBox(width, height, z, callb, options);
      menu.refresh();
    });
    GUI.bindKey(context, "VK_ESCAPE", GUI.reset);
    context.menuText = [
      "%c{orange}**Esc: Cancel**.",
      "%c{yellow}Select an area" + ((HTomb.GUI.getKeyCursor()) ? " with keyboard." : " with the mouse."),
      "Backspace / Delete: Center on player.",
      "K: Keyboard-only mode.",
      " ",
      "Move" + ((HTomb.GUI.getKeyCursor()) ? " cursor" : " screen") + ": NumPad / Arrows.",
      "(Control+Arrows for diagonal.)",
      "<: Up, >: Down",
      "Click or Space: Select.",
      "Enter: Pause/Unpause."
    ];
    context.mouseTile = function(x0,y0) {
      var bg = options.bg || "#550000";
      gameScreen.render();
      var squares = [];
      for (var x=0; x<width; x++) {
        for (var y=0; y<height; y++) {
          squares.push([x0+x,y0+y,gameScreen.z]);
        }
      }
      for (var k =0; k<squares.length; k++) {
        var coord = squares[k];
        gameScreen.highlightTile(coord[0],coord[1],bg);
      }
      // maybe give the coordinates here?
      menu.bottom = [];
      hover(squares);
      menu.refresh();
    };
    Contexts.active = context;
    let keyCursor = GUI.getKeyCursor();
    if (keyCursor) {
      context.mouseTile(keyCursor[0],keyCursor[1]);
    }
    if (options.message) {
      context.menuText.unshift("");
      context.menuText.unshift(options.message);
    }
    menu.refresh();
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    context.clickTile = function(x0,y0) {
      var squares = [];
      for (var y=0; y<height; y++) {
        for (var x=0; x<width; x++) {
          squares.push([x0+x,y0+y,gameScreen.z]);
        }
      }
      callb(squares,options);
      GUI.reset();
    };
  };

  GUI.choosingMenu = function(header, items, action, format) {
    HTomb.Time.stopTime();
    var alpha = "abcdefghijklmnopqrstuvwxyz";
    var contrls = {};
    var choices = ["%c{orange}**Esc: Cancel**.","Click/Enter: Pause/Unpause.","%c{yellow}"+header];
    // there is probably a huge danger of memory leaks here
    for (var i=0; i<items.length; i++) {
      var desc;
      if (format) {
        desc = format(items[i]);
      } else if (items[i].describe) {
        desc = items[i].describe();
      } else {
        desc = items[i];
      }
      var choice = items[i];
      // Bind a callback function and its closure to each keystroke
      let func = action(choice);
      contrls["VK_" + alpha[i].toUpperCase()] = function() {
        func();
        menu.refresh();
      }
      choices.push(alpha[i]+") " + desc);
    }
    contrls.VK_ESCAPE = GUI.reset;
    contrls.VK_RETURN = HTomb.Time.toggleTime;
    Contexts.active = Contexts.new(contrls);
    Contexts.active.menuText = choices;
    menu.refresh();
  };

  // Select a single square with the mouse
  GUI.selectSquare = function(z, callb, options) {
    options = options || {};
    let hover = options.hover || function(x, y, z) {};
    //var context = Object.create(survey);
    var context = HTomb.Utils.clone(survey);
    GUI.bindKey(context, "VK_ESCAPE", GUI.reset);

    context.menuText = [
      "%c{orange}**Esc: Cancel.**",
      "%c{yellow}Select a square" + ((HTomb.GUI.getKeyCursor()) ? " with keyboard." : " with the mouse."),
      "Backspace / Delete: Center on player.",
      "K: Keyboard-only mode.",
      " ",
      "Move" + ((HTomb.GUI.getKeyCursor()) ? " cursor" : " screen") + ": NumPad / Arrows.",
      "(Control+Arrows for diagonal.)",
      "<: Up, >: Down",
      "Click or Space: Select.",
      "Enter: Pause/Unpause."
    ];
    Contexts.active = context;
    if (options.message) {
      context.menuText.unshift("");
      context.menuText.unshift(options.message);
    }
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    context.clickTile = function(x,y) {
      callb(x,y,gameScreen.z,options);
      GUI.reset();
    };
    context.mouseTile = function(x,y) {
      mouseTile(x,y);
      hover(x, y, gameScreen.z);
      menu.bottom = examineSquare(x,y,gameScreen.z);
      menu.refresh();
    }
    let keyCursor = GUI.getKeyCursor();
    if (keyCursor) {
      context.mouseTile(keyCursor[0],keyCursor[1]);
    }
    if (options.line!==undefined) {
      var x0 = options.line.x || HTomb.Player.x;
      var y0 = options.line.y || HTomb.Player.y;
      var bg = options.line.bg || "#550000";
      context.mouseTile = function(x,y) {
        gameScreen.render();
        var line = HTomb.Path.line(x0,y0,x,y);
        for (var i in line) {
          var sq = line[i];
          gameScreen.highlightSquare(sq[0],sq[1],bg);
        }
      };
    }
  };

  HTomb.GUI.helpText = [
    "Playtest questions:",
    " ",
    "1) How quickly were you able to orient yourself to what you're looking at?  In particular, how difficult was it to figure out how slopes and elevations are represented, and how difficult was it to understand how visibility is represented?",
    " ",
    "2) How quickly were you able to figure out the minimal gameplay of 'summon one or more zombies, then dig or build things?'  Is the minimal gameplay at least minimally enjoyable?",
    " ",
    "3) Do the features beyond the minimal gameplay, such as workshops, farming, and so on, distract and make it harder to figure out the basics?  If so, I might remove them from the demo, or give them prerequisites?",
    " ",
    "4) How quickly were you able to figure out how to switch between the 'player's-eye-view' (controlling the necromancer, as in a traditional roguelike) and the 'god's-eye-view' (moving the viewing window around and giving orders, as in Dwarf Fortress)?",
    " ",
    "5) Is the mixture of mouse and keyboard controls reasonably comfortable?  Did you try the keyboard-only mode?",
    " ",
    "(%c{yellow}Press Escape to return to the game.)"
  ];
  // ***** I'm not sure how to categorize this one yet...
  function examineSquare(x,y,z) {
    var square = HTomb.Tiles.getSquare(x,y,z);
    var below = HTomb.Tiles.getSquare(x,y,z-1);
    var above = HTomb.Tiles.getSquare(x,y,z+1);
    let mainColor = "%c{LightCyan}";
    let otherColor = "%c{Gainsboro}";
    let text = [];
    var next;
    text.push(mainColor + "Coord: " + square.x +"," + square.y + "," + square.z);
    if(square.explored || HTomb.Debug.explored) {
      next = mainColor + "Terrain: "+square.terrain.name;
      if (square.terrain===HTomb.Tiles.FloorTile && below.cover.liquid) {
        if (below.cover===HTomb.Covers.Water) {
          next = next + " (muddy)";
        } else if (below.cover===HTomb.Covers.Lava) {
          next = next + " (warm)";
        }
      }
      text.push(next);
      next = mainColor + "Creature: ";
      if (square.creature && (square.visible || HTomb.Debug.visible)) {
        next+=square.creature.describe({article: "indefinite"});
        text.push(next);
      }
      next = mainColor + "Items: ";
      if (square.items) {
        for (let i=0; i<square.items.length; i++) {
          next+=square.items.expose(i).describe({article: "indefinite"});
          text.push(next);
          next = "       "+mainColor;
        }
      }
      next = mainColor + "Feature: ";
      if (square.feature) {
        next+=square.feature.describe({article: "indefinite"});
        text.push(next);
      }
      next = mainColor + "Task: ";
      if (square.task) {
        next+=square.task.describe();
        text.push(next);
      }
      next = mainColor + "Cover: ";
      if (square.cover!==HTomb.Covers.NoCover) {
        next+=square.cover.describe();
        text.push(next);
      } else if (square.terrain.zview===-1 && below.cover.liquid) {
        next+=below.cover.describe();
        next+=" (surface)";
        text.push(next);
      }
      next = mainColor + "Lighting: ";
      if (square.visible || HTomb.Debug.visible) {
        next+=Math.round(HTomb.World.lit[z][x][y]);
        text.push(next);
      }
      text.push(" ");
    }
    if (square.exploredAbove || HTomb.Debug.explored) {
      next = otherColor + "Above: "+above.terrain.name;
      text.push(next);
      next = otherColor + "Creature: ";
      if (above.creature && (square.visibleAbove || HTomb.Debug.visible)) {
        next+=above.creature.describe({article: "indefinite"});
        text.push(next);
      }
      next = otherColor + "Items: ";
      if (above.items) {
        for (let i=0; i<above.items.length; i++) {
          next+=above.items.expose(i).describe({article: "indefinite"});
          text.push(next);
          next = otherColor+"       ";
        }
      }
      next = otherColor + "Feature: ";
      if (above.feature) {
        next+=above.feature.describe({article: "indefinite"});
        text.push(next);
      }
      next = otherColor + "Task: ";
      if (above.task) {
        next+=above.task.describe();
        text.push(next);
      }
      next = otherColor + "Cover: ";
      if (above.cover!==HTomb.Covers.NoCover) {
        next+=above.cover.describe();
        text.push(next);
      }
      next = otherColor + "Lighting: ";
      if (square.visibleAbove || HTomb.Debug.visible) {
        next+=Math.round(HTomb.World.lit[z+1][x][y]);
        text.push(next);
      }
      text.push(" ");
    }
    if (square.exploredBelow || HTomb.Debug.explored) {
      next = otherColor + "Below: "+below.terrain.name;
      text.push(next);
      next = otherColor + "Creature: ";
      if (below.creature && (square.visibleBelow || HTomb.Debug.visible)) {
        next+=below.creature.describe({article: "indefinite"});
        text.push(next);
      }
      next = otherColor + "Items: ";
      if (below.items) {
        for (let i=0; i<below.items.length; i++) {
          next+=below.items.expose(i).describe({article: "indefinite"});
          text.push(next);
          next = otherColor+"       ";
        }
      }
      next = otherColor + "Feature: ";
      if (below.feature) {
        next+=below.feature.describe({article: "indefinite"});
        text.push(next);
      }
      next = otherColor + "Task: ";
      if (below.task) {
        next+=below.task.describe();
        text.push(next);
      }
      next = otherColor + "Cover: ";
      if (below.cover!==HTomb.Covers.NoCover) {
        next+=below.cover.describe();
        text.push(next);
      }
      next = otherColor + "Lighting: ";
      if (square.visibleBelow || HTomb.Debug.visible) {
        next+=Math.round(HTomb.World.lit[z][x][y]);
        text.push(next);
      }
    }
    return text;
  }
  // ***** Main control context ******
  // These are the default controls
  var main = Contexts.main = Contexts.new({
    // bind number pad movement
    VK_LEFT: Commands.tryMoveWest,
    VK_RIGHT: Commands.tryMoveEast,
    VK_UP: Commands.tryMoveNorth,
    VK_DOWN: Commands.tryMoveSouth,
    // bind keyboard movement
    //VK_A: Commands.act,
    VK_NUMPAD7: Commands.tryMoveNorthWest,
    VK_NUMPAD8: Commands.tryMoveNorth,
    VK_NUMPAD9: Commands.tryMoveNorthEast,
    VK_NUMPAD4: Commands.tryMoveWest,
    VK_NUMPAD5: Commands.wait,
    VK_NUMPAD6: Commands.tryMoveEast,
    VK_NUMPAD1: Commands.tryMoveSouthWest,
    VK_NUMPAD2: Commands.tryMoveSouth,
    VK_NUMPAD3: Commands.tryMoveSouthEast,
    VK_PERIOD: Commands.tryMoveDown,
    VK_COMMA: Commands.tryMoveUp,
    VK_K: function() {
      GUI.toggleKeyCursor();
      if (GUI.getKeyCursor()) {
        Main.surveyMode();
      }
    },
    VK_G: Commands.pickup,
    VK_D: Commands.drop,
    VK_I: Commands.inventory,
    VK_J: Commands.showJobs,
    VK_Z: Commands.showSpells,
    VK_SLASH: function() {
      HTomb.GUI.splash(GUI.helpText);
    },
    VK_TAB: function() {Main.surveyMode();},
    VK_SPACE: Commands.wait,
    VK_RETURN: HTomb.Time.toggleTime,
    VK_ESCAPE: function() {Views.systemView();},
    VK_HYPHEN_MINUS: function() {
      let oldSpeed = HTomb.Time.getSpeed();
      HTomb.Time.slowDown();
      if (HTomb.Time.getSpeed()!==oldSpeed) {
        HTomb.GUI.pushMessage("Speed set to " + HTomb.Time.getSpeed() + ".");
      }
    },
    VK_EQUALS: function() {
      let oldSpeed = HTomb.Time.getSpeed();
      HTomb.Time.speedUp();
      if (HTomb.Time.getSpeed()!==oldSpeed) {
        HTomb.GUI.pushMessage("Speed set to " + HTomb.Time.getSpeed() + ".");
      }
      HTomb.Time.startTime();
    },
    VK_PAGE_UP: function() {scroll.scrollUp();},
    VK_PAGE_DOWN: function() {scroll.scrollDown();},
    VK_M: function() {
      HTomb.GUI.Views.creatureView();
    },
    VK_S: function() {
      HTomb.GUI.Views.structureView();
    },
    VK_U: function() {
      HTomb.GUI.Views.summaryView();
    },
    VK_DELETE: Commands.centerOnPlayer,
    VK_BACK_SPACE: Commands.centerOnPlayer,
    VK_A: function() {
      Main.showAchievements();
    },
    VK_F: function() {
      HTomb.GUI.Views.feedback();
    }
  });

  Main.showAchievements = function() {
    HTomb.Time.stopTime();
    let txt = ["%c{lime}Achievements:"," "];
    for (let i=0; i<HTomb.Achievements.list.length; i++) {
      let a = HTomb.Achievements.list[i];
      let s = "";
      if (!a.unlocked) {
        s+="%c{gray}";
      } else {
        s+="%c{white}";
      }
      s+=a.name;
      s+=": ";
      s+=a.description;
      txt.push(s);
    }
    HTomb.GUI.splash(txt);
  };
  // ***** Survey mode *********
  Main.surveyMode = function() {
    Main.inSurveyMode = true;
    Contexts.active = survey;
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    menu.middle = menu.defaultMiddle;
    menu.bottom = menu.defaultBottom;
    let keyCursor = GUI.getKeyCursor();
    GUI.render();
    if (keyCursor) {
      GUI.Contexts.active.mouseTile(keyCursor[0], keyCursor[1]);
    }
  };
  // Enter survey mode and save the screen's current position
  Main.surveyMove = function(dx,dy,dz) {
    var f = function() {
      movedSinceLastWait = true;
      let n = 1;
      if (HTomb.GUI.shiftDown()) {
        n = 8;
      }
      for (let i=0; i<n; i++) {
        if (gameScreen.z+dz < NLEVELS-1 && gameScreen.z+dz > 0) {
          gameScreen.z+=dz;
        }
        if (gameScreen.xoffset+dx < LEVELW-Math.floor(SCREENW/2) && gameScreen.xoffset+dx >= Math.ceil(-SCREENW/2)) {
          gameScreen.xoffset+=dx;
        }
        if (gameScreen.yoffset+dy < LEVELH-Math.floor(SCREENH/2) && gameScreen.yoffset+dy >= Math.ceil(-SCREENH/2)) {
          gameScreen.yoffset+=dy;
        }
      }
      GUI.render();
      let keyCursor = GUI.getKeyCursor();
      if (keyCursor) {
        GUI.Contexts.active.mouseTile(keyCursor[0], keyCursor[1]);
      } else {
        let gameScreen = HTomb.GUI.Panels.gameScreen;
        GUI.fakeMouseMove();
      }
    };
    // Actually this returns a custom function for each type of movement
    return f;
  };



  Main.zoomIfNotVisible = function(x,y,z) {
    if (x >= gameScreen.xoffset+SCREENW-2) {
      gameScreen.xoffset = Math.min(Math.max(0,x-parseInt(SCREENW/2)+1),LEVELW-SCREENW);
    } else if (x <= gameScreen.xoffset) {
      gameScreen.xoffset = Math.min(Math.max(0,x-1-parseInt(SCREENW/2)),LEVELW-SCREENW);;
    }
    if (y >= gameScreen.yoffset+SCREENH-2) {
      gameScreen.yoffset = Math.min(Math.max(0,y-parseInt(SCREENH/2)+1),LEVELH-SCREENH);;
    } else if (y <= gameScreen.yoffset) {
      gameScreen.yoffset = Math.min(Math.max(0,y-1-parseInt(SCREENH/2)),LEVELH-SCREENH);;
    }
    gameScreen.z = z;
    let keyCursor = GUI.getKeyCursor();
    if (keyCursor) {
      GUI.Contexts.mouseX = keyCursor[0];
      GUI.Contexts.mouseY = keyCursor[1];
    }
    gameScreen.render();
  }
  // The control context for surveying
  var survey = Contexts.survey = Contexts.new({
    VK_LEFT: Main.surveyMove(-1,0,0),
    VK_RIGHT: Main.surveyMove(+1,0,0),
    VK_UP: Main.surveyMove(0,-1,0),
    VK_DOWN: Main.surveyMove(0,+1,0),
    // bind keyboard movement
    VK_PERIOD: Main.surveyMove(0,0,-1),
    VK_COMMA: Main.surveyMove(0,0,+1),
    VK_NUMPAD7: Main.surveyMove(-1,-1,0),
    VK_NUMPAD8: Main.surveyMove(0,-1,0),
    VK_NUMPAD9: Main.surveyMove(+1,-1,0),
    VK_NUMPAD4: Main.surveyMove(-1,0,0),
    VK_NUMPAD6: Main.surveyMove(+1,0,0),
    VK_NUMPAD1: Main.surveyMove(-1,+1,0),
    VK_NUMPAD2: Main.surveyMove(0,+1,0),
    VK_NUMPAD3: Main.surveyMove(+1,+1,0),
    VK_K: GUI.toggleKeyCursor,
    VK_RETURN: HTomb.Time.toggleTime,
    // Exit survey mode and return to the original position
    VK_ESCAPE: function() {Views.systemView();},
    VK_TAB: function() {
      gameScreen.z = survey.saveZ;
      gameScreen.recenter();
      Main.inSurveyMode = false;
      GUI.reset();
    },
    VK_J: Commands.showJobs,
    VK_Z: Commands.showSpells,
    VK_HYPHEN_MINUS: function() {
      let oldSpeed = HTomb.Time.getSpeed();
      HTomb.Time.slowDown();
      if (HTomb.Time.getSpeed()!==oldSpeed) {
        HTomb.GUI.pushMessage("Speed set to " + HTomb.Time.getSpeed() + ".");
      }
    },
    VK_EQUALS: function() {
      let oldSpeed = HTomb.Time.getSpeed();
      HTomb.Time.speedUp();
      if (HTomb.Time.getSpeed()!==oldSpeed) {
        HTomb.GUI.pushMessage("Speed set to " + HTomb.Time.getSpeed() + ".");
      }
      HTomb.Time.startTime();
    },
    VK_PAGE_UP: function() {scroll.scrollUp();},
    VK_PAGE_DOWN: function() {scroll.scrollDown();},
    VK_SLASH: function() {
      HTomb.GUI.splash(GUI.helpText);
    },
    //VK_TILDE: function() {Views.summaryView();}
    VK_M: function() {
      HTomb.GUI.Views.creatureView();
    },
    VK_S: function() {
      HTomb.GUI.Views.structureView();
    },
    VK_U: function() {
      HTomb.GUI.Views.summaryView();
    },
    VK_DELETE: Commands.centerOnPlayer,
    VK_BACK_SPACE: Commands.centerOnPlayer,
    VK_SPACE: function() {
      let keyCursor = GUI.getKeyCursor();
      if (keyCursor) {
        HTomb.GUI.Contexts.active.clickTile(keyCursor[0],keyCursor[1]);
      } else if (HTomb.GUI.Contexts.active===survey) {
        Commands.wait();
      } else {
        let cursor = HTomb.GUI.getMouseCursor();
        HTomb.GUI.Contexts.active.clickTile(cursor[0],cursor[1]);
      }
    },
    VK_A: Main.showAchievements,
    VK_F: function() {
      HTomb.GUI.Views.feedback();
    }
  });

  survey.menuText =
  [ "Esc: System view.",
    "%c{yellow}*Navigation mode (Tab: Player view)*",
    "Backspace / Delete: Center on player.",
    "K: Keyboard-only mode.",
    " ",
    "Move Screen: NumPad/Arrows.",
    "(Control+Arrows for diagonal.)",
    "< / >: Up / Down.",
    " ",
    "Z: Cast spell, J: Assign job.",
    "M: Minions, S: Structures, U: Summary",
    " ",
    "Space: Wait, +/-: Change speed.",
    "Click/Enter: Enable auto-pause.",
    " ",
    "PageUp/Down to scroll messages.",
    "A: Achievements, F: Submit Feedback."
  ];

  return HTomb;
})(HTomb);
