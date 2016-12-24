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
    if (overlay.active) {
      overlay.hide();
    }
    if (Main.inSurveyMode===true) {
      Main.surveyMode();
      return;
    }
    GUI.Contexts.active = GUI.Contexts.main;
    // This shoudl probably be handled a bit differently?
    menu.middle = menu.defaultMiddle;
    menu.bottom = menu.defaultBottom;
    menu.refresh(); // menu.refresh();
    gameScreen.recenter(); // gameScreen.recenter();
    GUI.render(); // Actions.render();
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
    gameScreen.highlightTile(x,y,"#0000FF");
    oldCursor = [x,y];
  }

  Contexts.default.mouseTile = function(x,y) {
    mouseTile(x,y);
    menu.bottom = examineSquare(x,y,gameScreen.z);
    menu.refresh();
  };

  Contexts.default.clickAt = function(x,y) {
    HTomb.Time.toggleTime();
  };
  Contexts.default.clickTile = function(x,y) {
    // If we clicked on a creature, go to creature view
    let c = HTomb.World.creatures[coord(x,y,gameScreen.z)];
    if (c) {
      GUI.Views.creatureView(c);
      return;
    }
    // If we clicked on a workshop, go to workshop view
    let f = HTomb.World.features[coord(x,y,gameScreen.z)];
    if (f && f.structure && f.structure.isPlaced() && HTomb.World.creatures[coord(x,y,gameScreen.z)]===undefined) {
      GUI.Views.structureView(f.structure);
      return;
    }
    // Otherwise, toggle time
    if (HTomb.Time.isPaused()) {
      HTomb.Time.startTime();
    } else {
      HTomb.Time.toggleTime();
    }
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
    GUI.bindKey(context, "VK_ESCAPE", GUI.reset);
    context.menuText = [
      "Esc: Cancel.",
      "%c{yellow}Select first corner.",
      "Move screen: NumPad / Arrows.",
      "(Shift+Arrows for diagonal.)",
      "<: Up, >: Down"
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
      context.menuText[1] = "%c{yellow}Select second corner.";
      var context2 = Contexts.new({VK_ESCAPE: GUI.reset});
      Contexts.active = context2;
      context2.menuText = context.menuText;
      context2.clickTile = secondSquare(x,y);
      context2.mouseTile = drawSquareBox(x,y);
    };
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
    GUI.bindKey(context, "VK_ESCAPE", GUI.reset);
    context.menuText = [
      "Esc: Cancel.",
      "%c{yellow}Select an area.",
      "Move screen: NumPad / Arrows.",
      "(Shift+Arrows for diagonal.)",
      "<: Up, >: Down"
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

  // Display a menu of letter-bound choices
  GUI.choosingMenu = function(s, arr, func) {
    var alpha = "abcdefghijklmnopqrstuvwxyz";
    var contrls = {};
    var choices = ["Esc: Cancel.","%c{yellow}"+s];
    // there is probably a huge danger of memory leaks here
    for (var i=0; i<arr.length; i++) {
      var desc = (arr[i].onList!==undefined) ? arr[i].onList() : arr[i];
      var choice = arr[i];
      // Bind a callback function and its closure to each keystroke
      contrls["VK_" + alpha[i].toUpperCase()] = func(choice);
      choices.push(alpha[i]+") " + desc);
    }
    contrls.VK_ESCAPE = GUI.reset;
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
      "Esc: Cancel.",
      "%c{yellow}Select a square.",
      "Move screen: NumPad / Arrows.",
      "(Shift+Arrows for diagonal.)",
      "<: Up, >: Down"
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
    "3) Do the features beyond the minimal gameplay, such as workshops, farming, and so on, distract and make it harder to figure out the basics?  If so, I might remove them from the demo, or give them prerequisites.",
    " ",
    "4) How quickly were you able to figure out how to switch between the 'player's-eye-view' (controlling the necromancer, as in a traditional roguelike) and the 'god's-eye-view' (moving the viewing window around and giving orders, as in Dwarf Fortress)?",
    " ",
    "5) Is the mixture of mouse and keyboard controls reasonably comfortable?",
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
    var text = [mainColor + "Coord: " + square.x +"," + square.y + "," + square.z];
    var next;
    var listLines, i;
    if(square.explored || HTomb.Debug.explored) {
      next = mainColor + "Terrain: "+square.terrain.name;
      text.push(next);
      next = mainColor + "Creature: ";
      if (square.creature && (square.visible || HTomb.Debug.visible)) {
        next+=square.creature.describe();
        text.push(next);
      }
      next = mainColor + "Items: ";
      if (square.items && (square.visible || HTomb.Debug.visible)) {
        square.items.forEach(function(e,a,i) {
          next+=e.describe();
          text.push(next);
          next = "       ";
        });
        //for (i=0; i<square.items.length; i++) {
        //  next+=square.items[i].describe();
        //  text.push(next);
        //  next = "       ";
        //}
      }
      next = mainColor + "Feature: ";
      if (square.feature) {
        next+=square.feature.describe();
      }
      text.push(next);
      next = mainColor + "Task: ";
      if (square.task) {
        next+=square.task.describe();
      }
      text.
      push(next);
      next = mainColor + "Cover: ";
      if (square.cover) {
        next+=square.cover.describe();
      }
      text.push(next);
      next = mainColor + "Lighting: ";
      next+=Math.round(HTomb.World.lit[z][x][y]);
      text.push(next);
      text.push(" ");
    }
    if (square.exploredAbove) {
      next = otherColor + "Above: "+above.terrain.name;
      text.push(next);
      next = otherColor + "Creature: ";
      if (above.creature && square.visibleAbove) {
        next+=above.creature.describe();
        text.push(next);
      }
      next = otherColor + "Items: ";
      if (above.items && square.visibleAbove) {
        for (i=0; i<above.items.length; i++) {
          next+=above.items[i].describe();
          text.push(next);
          next = "       ";
        }
      }
      next = otherColor + "Feature: ";
      if (above.feature) {
        next+=above.feature.describe();
      }
      text.push(next);
      next = otherColor + "Task: ";
      if (above.task) {
        next+=above.task.describe();
      }
      text.push(next);
      next = otherColor + "Cover: ";
      if (above.cover) {
        next+=above.cover.describe();
      }
      text.push(next);
      next = otherColor + "Lighting: ";
      next+=Math.round(HTomb.World.lit[z+1][x][y]);
      text.push(next);
      text.push(" ");
    }
    if (square.exploredBelow) {
      next = otherColor + "Below: "+below.terrain.name;
      text.push(next);
      next = otherColor + "Creature: ";
      if (below.creature && square.visibleBelow) {
        next+=below.creature.describe();
        text.push(next);
      }
      next = otherColor + "Items: ";
      if (below.items && square.visibleBelow) {
        for (i=0; i<below.items.length; i++) {
          next+=below.items[i].describe();
          text.push(next);
          next = "       ";
        }
      }
      next = otherColor + "Feature: ";
      if (below.feature) {
        next+=below.feature.describe();
      }
      text.push(next);
      next = otherColor + "Task: ";
      if (below.task) {
        next+=below.task.describe();
      }
      text.push(next);
      next = otherColor + "Cover: ";
      if (below.cover) {
        next+=below.cover.describe();
      }
      text.push(next);
      next = otherColor + "Lighting: ";
      next+=Math.round(HTomb.World.lit[z][x][y]);
      text.push(next);
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
    VK_RETURN: function() {
      HTomb.Time.toggleTime();
    },
    //VK_ESCAPE: HTomb.Time.stopTime,
    //VK_BACK_QUOTE: function() {Views.summaryView();},
    //VK_TILDE: function() {Views.summaryView();},
    VK_ESCAPE: function() {Views.systemView();},
    VK_HYPHEN_MINUS: function() {
      HTomb.Time.setSpeed(HTomb.Time.getSpeed()/1.25);
      HTomb.GUI.pushMessage("Speed set to " + parseInt(HTomb.Time.getSpeed()) + ".");
    },
    VK_EQUALS: function() {
      HTomb.Time.setSpeed(HTomb.Time.getSpeed()*1.25);
      HTomb.GUI.pushMessage("Speed set to " + parseInt(HTomb.Time.getSpeed()) + ".");
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
    }
  });
  // ***** Survey mode *********
  Main.surveyMode = function() {
    Main.inSurveyMode = true;
    Contexts.active = survey;
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    menu.middle = menu.defaultMiddle;
    menu.bottom = menu.defaultBottom;
    GUI.render();
  };
  // Enter survey mode and save the screen's current position
  Main.surveyMove = function(dx,dy,dz) {
    var f = function() {
      if (gameScreen.z+dz < NLEVELS || gameScreen.z+dz >= 0) {
        gameScreen.z+=dz;
      }
      if (gameScreen.xoffset+dx < LEVELW-SCREENW && gameScreen.xoffset+dx >= 0) {
        gameScreen.xoffset+=dx;
      }
      if (gameScreen.yoffset+dy < LEVELH-SCREENH && gameScreen.yoffset+dy >= 0) {
        gameScreen.yoffset+=dy;
      }
      GUI.Contexts.active.mouseTile(GUI.Contexts.mouseX, GUI.Contexts.mouseY);
      GUI.render();
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
    VK_RETURN: function() {
      HTomb.Time.toggleTime();
    },
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
      HTomb.Time.setSpeed(HTomb.Time.getSpeed()/1.25);
      HTomb.GUI.pushMessage("Speed set to " + parseInt(HTomb.Time.getSpeed()) + ".");
    },
    VK_EQUALS: function() {
      HTomb.Time.setSpeed(HTomb.Time.getSpeed()*1.25);
      HTomb.GUI.pushMessage("Speed set to " + parseInt(HTomb.Time.getSpeed()) + ".");
      HTomb.Time.startTime();
    },
    VK_SPACE: function() {
      Commands.wait();
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
    }
  });

  survey.menuText =
  [ "Esc: System view.",
    "%c{yellow}Navigation mode (Tab: Player view)",
    "Move screen: NumPad / Arrows.",
    "(Shift+Arrows for diagonal.)",
    "<: Up, >: Down, Space: Wait.",
    "Z: Cast spell, J: Assign job.",
    "M: Minions, S: Structures, U: Summary",
    "+ / -: Change speed.",
    "Click: Pause or unpause.",
    "PageUp/Down to scroll messages.",
    "%c{yellow}?: Help / Playtest notes."
  ];

  return HTomb;
})(HTomb);
