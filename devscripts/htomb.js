// This is the object whose scope will enclose all the tools used by the game
var HTomb = (function() {

"use strict";
  // Set a number of useful constants
  var Constants = {};
  // Dimensions of the playing area
  var LEVELW = Constants.LEVELW = 256;
  var LEVELH = Constants.LEVELH = 256;
  var NLEVELS = Constants.NLEVELS = 64;
  // Frequently-used colors and characters...not sure this should be here
  var UNIBLOCK = Constants.UNIBLOCK = '\u2588';

  try{eval("let letSupported = true;");} catch(e) {alert("Please update to a newer browser version.");}


  if (document.cookie==="") {
    fetch("/cookie",{credentials: "include"}).then(function(res) {console.log("Cookie: " + document.cookie);});
  }
  // Begin the game
  var init = function() {
    // Initialize the DOM
    GUI.domInit();
    GUI.Views.startup();
  };
  // Set up the various submodules that will be used
  var World = {};
  var Player = {};
  var FOV = {};
  var Path = {};
  var Events = {};
  var GUI = {};
  var Controls = {};
  var Commands = {};
  var Tasks = {};
  var Tiles = {};
  var Debug = {};
  var Save = {};
  var Things = {};
  var Types = {};
  var Particles = {};
  var Utils = {};
  var Time = {};
  // Allow public access to the submodules
  World.newGame = function() {
    GUI.Views.progressView(["Building world..."]);
    setTimeout(function() {
      console.time("worldInit");
      // Initialize the world
      World.init();
      GUI.quietUnload = false;
      console.timeEnd("worldInit");
      // Prepare the GUI and throw up an intro screen
      GUI.Views.parentView = GUI.Views.Main.reset;
      GUI.Panels.scroll.reset();
      GUI.reset();
      GUI.Panels.gameScreen.center(HTomb.Player.x,HTomb.Player.y);
      GUI.render();
      HTomb.Time.stopTime();
      HTomb.Time.initialPaused = true;
      HTomb.Time.turn();
      GUI.delaySplash([
        "%c{yellow}Welcome to HellaTomb!",
        " ",
        "You are a necromancer: A despised sorceror who reanimates the dead to do your bidding.  Cast out from society, you flee to the hills to plot your revenge and pursue the forbidden secrets of immortality.",
        " ",
        "Cast spells, raise zombies from their graves, and command them to harvest resources and build you a fortress.  Control the necromancer directly in avatar mode, or switch to navigation mode to survey your domain. But beware: The forces of good will not long stand for your vile ways...",
        " ",
        "...except that this is the playtest demo, so the forces of good won't actually show up.",
        " ",
        "Good luck!",
        " ",
        "Note: This is a so-called 'rogue-like' game inspired by Dwarf Fortress.  It uses Unicode characters instead of graphical art.  Hover with the mouse to find out what a particular symbol means.",
        " ",
        "This symbol is you: %c{magenta}@",
        " ",
        "%c{yellow}(Click or press any key to continue.)"
      ]);
    }, 500);
  };
  return {
    Constants: Constants,
    init: init,
    Controls: Controls,
    Commands: Commands,
    World: World,
    FOV: FOV,
    Path: Path,
    Events: Events,
    GUI: GUI,
    get Player () {return Player;},
    set Player (p) {Player = p;},
    Tiles: Tiles,
    Debug: Debug,
    Save: Save,
    Types: Types,
    Things: Things,
    Particles: Particles,
    Utils: Utils,
    Time: Time
  };
})();
// Start the game when the window loads
window.onload = HTomb.init;
