HTomb = (function(HTomb) {
  "use strict";

  var Time = HTomb.Time;

  var timePassing = null;
  var speed = 1000;
  var timeLocked = false;
  HTomb.Time.setSpeed = function(spd) {
    speed = Math.min(Math.max(100,spd),5000);
  };
  HTomb.Time.getSpeed = function() {
    return speed;
  };
  HTomb.Time.lockTime = function() {
    console.log("Note that we haven't actually locked the interface yet...");
    HTomb.Time.stopTime();
    timeLocked = true;
  };
  HTomb.Time.unlockTime = function() {
    console.log("time unlocked");
    timeLocked = false;
  };
  HTomb.Time.startTime = function() {
    if (timeLocked===true) {
      return;
    }
    timePassing = setInterval(HTomb.Time.passTime,speed);
    HTomb.GUI.Panels.status.render();
  };
  HTomb.Time.stopTime = function() {
    clearInterval(timePassing);
    timePassing = null;
    HTomb.GUI.Panels.status.render();
  };
  HTomb.Time.toggleTime = function() {
    if (timePassing===null) {
      HTomb.Time.startTime();
    } else {
      HTomb.Time.stopTime();
    }
  };
  HTomb.Time.passTime = function() {
    HTomb.Time.turn();
  };
  var particleTime;
  var particleSpeed = 50;
  HTomb.Time.startParticles = function() {
    if (particleTime===undefined) {
      particleTime = setInterval(function() {
        //console.log("updating particles");
        HTomb.Particles.update(particleSpeed);
        HTomb.GUI.Panels.gameScreen.renderParticles();
      },particleSpeed);
    }
  };
  HTomb.Time.isPaused = function() {
    return (timePassing===null);
  };
  HTomb.Time.stopParticles = function() {
    clearInterval(particleTime);
    particleTime = undefined;
  };

  // Process a turn of play
  HTomb.Time.turn = function() {
    if (timeLocked===true) {
      return;
    }
    HTomb.Time.startParticles();
    HTomb.Events.publish({type: "TurnBegin"});
    HTomb.Time.stopTime();
    var Player = HTomb.Player;
    // Assign tasks to minions
    if (Player.master) {
      HTomb.Utils.shuffle(Player.master.taskList);
      Player.master.assignTasks();
    }
    // Run the AI for each creature...should I deal with action points here?
    var creatureDeck = [];
    for (var creature in HTomb.World.creatures) {
      creatureDeck.push(HTomb.World.creatures[creature]);
    }
    HTomb.Utils.shuffle(creatureDeck);
    for (var c=0; c<creatureDeck.length; c++) {
      let cr = creatureDeck[c];
      if (cr.x===null || cr.y===null || cr.z===null) {
        continue;
      }
      if (cr.ai) {
        cr.ai.act();
      }
    }
    // Calculate visibility
    HTomb.FOV.resetVisible();
    if (Player.sight) {
      HTomb.FOV.findVisible(Player.x, Player.y, Player.z, Player.sight.range);
    }
    if (Player.master) {
      for (var i=0; i<Player.master.minions.length; i++) {
        var cr = Player.master.minions[i];
        if (cr.sight) {
          HTomb.FOV.findVisible(cr.x,cr.y,cr.z, cr.sight.range);
        }
      }
    }
    // Recenter the GUI on the player
    HTomb.GUI.Panels.gameScreen.recenter();
    // Render the GUI
    HTomb.GUI.render();
    if (HTomb.Debug.paused!==true) {
      HTomb.Time.startTime();
    }
    if (HTomb.Encounters.check()) {
        HTomb.Encounters.roll();
    }
    HTomb.Time.dailyCycle.onTurnBegin();
    HTomb.Events.publish({type: "TurnEnd"});
  };


  HTomb.Constants.STARTHOUR = 8;
  //HTomb.Constants.STARTHOUR = 16;
  HTomb.Constants.DAWN = 6;
  HTomb.Constants.DUSK = 17;
  HTomb.Constants.MONTH = 12;

  HTomb.Time.dailyCycle = {
    hour: HTomb.Constants.STARTHOUR,
    minute: 0,
    day: 0,
    turn: 0,
    onTurnBegin: function() {
      this.turn+=1;
      this.minute+=1;
      if (this.minute>=60) {
        this.minute = 0;
        this.hour+=1;
        if (this.hour===this.times.dawn) {
          HTomb.GUI.pushMessage("The sun is coming up.");
          HTomb.World.validate.lighting();
        } else if (this.hour===this.times.dusk) {
          HTomb.GUI.pushMessage("Night is falling.");
          HTomb.World.validate.lighting();
        }
        if (this.hour>=24) {
          this.hour = 0;
          this.day+=1;
        }
      }
      if ((this.hour>=this.times.dawn && this.hour<this.times.dawn+2)
        || (this.hour>=this.times.dusk && this.hour<this.times.dusk+2)) {
        if (this.turn%5===0) {
          HTomb.World.validate.lighting();
        }
      }
    },
    sunlight: {symbol: "\u263C"},
    waning: {symbol: "\u263E", light: 32},
    twilight: {symbol: "\u25D2"},
    fullMoon: {symbol: "\u26AA", light: 64},
    waxing: {symbol: "\u263D", light: 32},
    newMoon: {symbol: "\u25CF", light: 1},
    times: {
      dawn: HTomb.Constants.DAWN,
      dusk: HTomb.Constants.DUSK,
      waxing: 2,
      fullMoon: 5,
      waning: 8,
      newMoon: 11,
      order: ["waxing","fullMoon","waning","newMoon"]
    },
    getPhase: function() {
      if (this.hour<this.times.dusk && this.hour>=this.times.dawn+1) {
        return this.sunlight;
      } else if (this.hour<this.times.dusk+1 && this.hour>=this.times.dawn) {
        return this.twilight;
      } else {
        return this.getMoon();
      }
      console.log(["how did we reach this?",this.day,this.tally]);
    },
    getMoon: function() {
      var phase = this.day%HTomb.Constants.MONTH;
      var tally = 0;
      for (var i=0; i<this.times.order.length; i++) {
        tally+=this.times[this.times.order[i]];
        if (phase<=tally) {
          return this[this.times.order[i]];
        }
      }
    },
    lightLevel: function() {
      var dawn = HTomb.Constants.DAWN;
      var dusk = HTomb.Constants.DUSK;
      var darkest = 64;
      var light, moonlight;
      if (this.hour < dawn || this.hour >= dusk+1) {
        moonlight = this.getMoon().light;
        return Math.round(darkest+moonlight);
      } else if (this.hour < dawn+1) {
        moonlight = this.getMoon().light;
        light = Math.min(255,(this.minute/60)*(255-darkest)+darkest+moonlight);
        return Math.round(light);
      } else if (this.hour >= dusk) {
        moonlight = this.getMoon().light;
        light = Math.min(255,((60-this.minute)/60)*(255-darkest)+darkest+moonlight);
        return Math.round(light);
      } else {
        return 255;
      }
    }
  };

  return HTomb;
})(HTomb);
