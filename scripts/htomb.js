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

  // Begin the game
  var init = function() {
    // Initialize the DOM
    GUI.domInit();
    console.time("worldInit");
    // Initialize the world
    World.init();
    console.timeEnd("worldInit");
    // Prepare the GUI and throw up an intro screen
    GUI.reset();
    HTomb.GUI.Panels.gameScreen.center(HTomb.Player.x,HTomb.Player.y);
    //HTomb.GUI.center(HTomb.Player.x,HTomb.Player.y);
    GUI.splash(["Welcome to HellaTomb!"]);
    HTomb.GUI.render();

    //HTomb.GUI.recenter();
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
