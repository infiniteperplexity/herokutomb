// This module provides optional debugging functionality
HTomb = (function(HTomb) {
  "use strict";
  var Debug = HTomb.Debug;
  HTomb.Debug.tutorial = {
    active: true,
    getText: function() {
      for (let i=0; i<this.steps.length; i++) {
        if (this.steps[i].complete) {
          continue;
        } else if (this.steps[i].check()) {
          this.steps[i].complete = true;
          continue;
        } else {
          return this.steps[i].message;
        }
      }
      return "(tutorial complete)";
    },
    steps: [
      {
        message: "Press Z, then A, and finally click on a tombstone to summon a zombie.",
        check: function() {
          return (HTomb.Player.master.minions.length>0);
        },
        complete: false
      }
      // ,
      // {
      //   message: "Press J, then assign a zombie to dig to find rocks for building.",
      //   check: function() {
      //     return (HTomb.Utils.findItems(function(v,k,i) {
      //       return (v.template==="Rock" && v.item.owned!==false);
      //     }).length>0);
      //   },
      //   complete: false
      // }
    ]
  };

  ROT.Display.Rect.cache = true;
  //Debug.explored = true;
  //Debug.visible = true;
  //Debug.mobility = true;
  //Debug.showpaths = true; //not yet implemented
  //Debug.messages = true;
  //Debug.faster = true;
  //Debug.paused = true;
  //Debug.peaceful = true;

  HTomb.World.init = function() {
    HTomb.World.fillTiles();
    HTomb.World.generators.bestSoFar();
  };
  return HTomb;
})(HTomb);
