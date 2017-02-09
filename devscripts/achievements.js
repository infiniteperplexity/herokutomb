HTomb = (function(HTomb) {
  "use strict";
  var coord = HTomb.Utils.coord;
  HTomb.Achievements = {
    list: [],
    reset: function() {
      for (let i=0; i<this.list.length; i++) {
        let a = this.list[i];
        a.unlocked = false;
        for (let j=0; j<a.listens.length; j++) {
          if (!HTomb.Events[a.listens[j]] || HTomb.Events[a.listens[j]].indexOf(a)===-1) {
            HTomb.Events.subscribe(a, a.listens[j]);
          }
        }
      }
    },
    resubscribe: function() {
      for (let i=0; i<this.list.length; i++) {
        let a = this.list[i];
        if (a.unlocked===false) {
          for (let j=0; j<a.listens.length; j++) {
            if (HTomb.Events[a.listens[j]].indexOf(a)===-1) {
              HTomb.Events.subscribe(a, a.listens[j]);
            }
          }
        } else {
          HTomb.Events.unsubscribeAll(a);
        }
      }
    }
  };
  function Achievement(args) {
    args = args || {};
    this.unlocked = false;
    this.template = args.template || "Achievement";
    HTomb.Achievements.list.push(this);
    this.name = args.name || "dummy achievement";
    this.description = args.description || "did something cool.";
    this.listens = args.listens || [];
    for (let arg in args) {
      if (arg.substr(0,2)==="on") {
        this[arg] = args[arg];
      }
    }
    for (let i=0; i<args.listens.length; i++) {
      HTomb.Events.subscribe(this, args.listens[i]);
    }
    this.achieve = function() {
      this.unlocked = true;
      HTomb.GUI.pushMessage("%c{lime}%b{purple}"+this.description);
      HTomb.GUI.pushMessage("%c{lime}%b{purple}Achievement: " + this.name);
      HTomb.Events.unsubscribeAll(this);
    }
  }

  new Achievement({
    template: "BringOutYourDead",
    name: "Bring Out Your Dead!",
    description: "(raise one zombie.)",
    listens: ["Cast"],
    onCast: function(event) {
      if (event.spell.template==="RaiseZombie") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "ArmyOfTheDead",
    name: "Army Of The Dead",
    description: "(raise three zombies - the initial maximum.)",
    listens: ["Cast"],
    onCast: function(event) {
      if (event.spell.template==="RaiseZombie") {
        if (HTomb.Player.master.minions.length>=2) {
          this.achieve();
        }
      }
    }
  });
  new Achievement({
    template: "ScratchingTheSurface",
    name: "Scratching The Surface",
    description: "(dig a corridor.)",
    listens: ["Complete"],
    onComplete: function(event) {
      let t = event.task;
      let x = t.entity.x;
      let y = t.entity.y;
      let z = t.entity.z;
      if (t.template==="DigTask" && HTomb.World.tiles[z][x][y]===HTomb.Tiles.FloorTile && HTomb.World.tiles[z+1][x][y].zview!==-1) {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "AnotherBrickInTheWall",
    name: "Another Brick In The Wall",
    description: "(upgrade a slope into a wall.)",
    listens: ["Complete"],
    onComplete: function(event) {
      let t = event.task;
      let x = t.entity.x;
      let y = t.entity.y;
      let z = t.entity.z;
      if (t.template==="BuildTask" && HTomb.World.tiles[z][x][y]===HTomb.Tiles.WallTile) {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "ExclusiveOre",
    name: "Exclusive Ore",
    description: "(mine some ore.)",
    listens: ["Complete"],
    onComplete: function(event) {
      let t = event.task;
      if (t.template!=="DigTask") {
        return;
      }
      let x = t.entity.x;
      let y = t.entity.y;
      let z = t.entity.z;
      let items = HTomb.World.items[coord(x,y,z)] || HTomb.Things.Container();
      items = items.exposeItems();
      let anyOre = false;
      for (let i=0; i<items.length; i++) {
        if (items[i].item.tags.indexOf("Minerals")!==-1 && items[i].template!=="Rock") {
          anyOre=true;
        }
      }
      if (anyOre) {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "IntoTheWoods",
    name: "Into The Woods",
    description: "(harvest wood from a tree.)",
    listens: ["Complete"],
    onComplete: function(event) {
      let t = event.task;
      if (t.template!=="DismantleTask") {
        return;
      }
      let x = t.entity.x;
      let y = t.entity.y;
      let z = t.entity.z;
      let items = HTomb.World.items[coord(x,y,z)] || HTomb.Things.Container();
      items = items.exposeItems();
      let anyWood = false;
      for (let i=0; i<items.length; i++) {
        if (items[i].item.tags.indexOf("Wood")!==-1) {
          anyWood=true;
        }
      }
      if (anyWood) {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "RibbonCutting",
    name: "Ribbon Cutting",
    description: "(complete a structure.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="ConstructTask" && event.task.structure.isPlaced()) {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "ToolsOfTheTrade",
    name: "Tools Of The Trade",
    description: "(produce a good in a workshop.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="ProduceTask") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "AllTheFixings",
    name: "All The Fixings",
    description: "(furnish a fixture.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="FurnishTask") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "GoingToSeed",
    name: "Going To Seed",
    description: "(plant a seed or spore in a farm.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="FarmTask") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "ReapWhatYouSow",
    name: "Reap What You Sow",
    description: "(harvest a crop from a farm.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="HarvestFarmTask") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "TakingStock",
    name: "Taking Stock",
    description: "(have a minion place an item in a stockpile.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="StockpileTask") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "FirstBlood",
    name: "First Blood",
    description: "(witness the death of a hostile creature.)",
    listens: ["Destroy"],
    onDestroy: function(event) {
      let e = event.entity;
      if (e.creature && HTomb.World.visible[coord(e.x, e.y, e.z)] && e.ai && e.ai.isHostile(HTomb.Player)) {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "TodayWasAGoodDay",
    name: "Today Was A Good Day",
    description: "(survive until nightfall.)",
    listens: ["TurnBegin"],
    onTurnBegin: function() {
      if (HTomb.Time.dailyCycle.hour===HTomb.Time.dailyCycle.times.dusk) {
          this.achieve();
      }
    }
  });
  new Achievement({
    template: "TheDarkestHour",
    name: "The Darkest Hour",
    description: "(survive until dawn.)",
    listens: ["TurnBegin"],
    onTurnBegin: function() {
      if (HTomb.Time.dailyCycle.hour===HTomb.Time.dailyCycle.times.dawn) {
          this.achieve();
      }
    }
  });
  new Achievement({
    template: "FullyFurnished",
    name: "Fully Furnished",
    description: "(furnish three different fixtures.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="FurnishTask") {
        let throne = HTomb.Utils.where(HTomb.World.features, function(e) {return (e.template==="Throne");});
        let torch = HTomb.Utils.where(HTomb.World.features, function(e) {return (e.template==="Torch");});
        let door = HTomb.Utils.where(HTomb.World.features, function(e) {return (e.template==="Door");});
        if (throne.length>0 && torch.length>0 && door.length>0) {
          this.achieve();
        }
      }
    }
  });
  new Achievement({
    template: "AMonumentalTask",
    name: "A Monumental Task",
    description: "(build four different structures.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="ConstructTask") {
        let structures = {};
        for (let i=0; i<HTomb.Player.master.structures.length; i++) {
          let s = HTomb.Player.master.structures[i];
          structures[s.template] = true;
        }
        if (Object.keys(structures).length===4) {
          this.achieve();
        }
      }
    }
  });
  new Achievement({
    template: "Digging Deeper",
    name: "Digging Deeper",
    description: "(dig below the water table.)",
    listens: ["Complete"],
    onComplete: function(event) {
      let t = event.task;
      let z = t.entity.z;
      if (t.template==="DigTask" && z<44) {
        this.achieve();
      }
    }
  });




  HTomb.Tutorial = {
    enabled: true,
    active: 0,
    tutorials: [],
    templates: {},
    reset: function() {
      this.active = 0;
      for (let i=0; i<this.tutorials.length; i++) {
        this.tutorials[i].complete = false;
      }
    },
    onEvent: function(event) {
      if (this.tutorials[this.active].listens.indexOf(event.type)!==-1) {
        let completed = this.tutorials[this.active].trigger(event);
        if (completed) {
          console.log("Completed tutorial: "+this.tutorials[this.active].template);
          this.tutorials[this.active].onComplete();
          if (this.active<this.tutorials.length-1) {
            this.active+=1;
            this.tutorials[this.active].tracking = {};
            console.log("Beginning tutorial: "+this.tutorials[this.active].template);
            this.tutorials[this.active].onBegin();
            return;
          }
        }
      }
      let skip = this.templates[this.tutorials[this.active].skip];
      if (!skip) {
        return;
      }
      let index = this.tutorials.indexOf(skip);
      if (skip.trigger(event)) {
        do {
          console.log("Skipping tutorial: "+this.tutorials[this.active].template);
          this.tutorials[this.active].onComplete();
          if (this.active<this.tutorials.length-1) {
            this.active+=1;
            this.tutorials[this.active].tracking = {};
            console.log("Beginning tutorial: "+this.tutorials[this.active].template);
            this.tutorials[this.active].onBegin();
          }
        } while (this.active<=index);
      }
    },
    getMenu: function(menu) {
      let active = this.tutorials[this.active];
      let obj = {
        controls: HTomb.Utils.copy(menu.top),
        instructions: null,
        middle: HTomb.Utils.copy(menu.middle),
        bottom: HTomb.Utils.copy(menu.bottom)
      };
      if (active.controls!==null) {
        if (typeof(active.controls)==="function") {
          let txt = obj.controls;
          txt = active.controls(txt);
          obj.controls = txt;
        } else {
          obj.controls = active.controls;
        }
      }
      obj.instructions = active.instructions;
      if (active.middle!==null) {
        obj.middle = active.middle;
      }
      if (active.bottom!==null) {
        obj.bottom = active.bottom;
      }
      return obj;
    },
    goto: function(arg) {
      if (typeof(arg)==="number") {
        this.active = arg;
      } else if (typeof(arg)==="string") {
        let template = this.templates[arg];
        this.active = this.tutorials.indexOf(template);
      }
    }
  };

  function Tutorial(args) {
    args = args || {};
    this.template = args.template;
    HTomb.Tutorial.tutorials.push(this);
    HTomb.Tutorial.templates[this.template] = this;
    this.completed = false;
    this.controls = args.controls || null;
    this.instructions = args.instructions || null;
    this.skip = args.skip || null;
    this.middle = args.middle || null;
    this.bottom = args.bottom || null;
    //this.prereqs = args.prereqs || [];
    this.listens = args.listens || [];
    this.onBegin = args.onBegin || function() {};
    this.onComplete = args.onComplete || function() {};
    this.trigger = args.trigger || function () {return false};
    this.tracking = {};
  }

  new Tutorial({
    template: "WelcomeAndMovement",
    name: "welcome and movement",
    controls: [
      "Esc: System view.",
      " ",
      "%c{cyan}Move: NumPad/Arrows.",
      "(Control+Arrows for diagonal.)",
      " ",
      "?: Toggle tutorial."
    ],
    instructions: [
      "",
      "Welcome to HellaTomb!",
      " ",
      "Try walking around using the numeric keypad.",
      " ",
      "If your keyboard has no keypad, use the arrow keys."
    ],
    listens: ["Command"],
    skip: "RaisingAZombieStepOne",
    onBegin: function() {
      if (HTomb.Tutorial.enabled) {
        HTomb.GUI.autopause = true;
      }
    },
    trigger: function(event) {
      if (!this.tracking.moves) {
        this.tracking.moves = 0;
      }
      if (event.command==="Move") {
        this.tracking.moves+=1;
      }
      return (this.tracking.moves>=5);
    }
  });

  new Tutorial({
    template: "ClimbingSlopes",
    name: "climbing slopes",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, %c{cyan}</>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "?: Toggle tutorial."
    ],
    instructions: ["",
      "You may see different colors and symbols representing elevation.",
      " ",
      'Green areas with " are grass.',
      " ",
      'Dark green areas with \u02C5 are downward slopes.  Dark green areas with " are grass one level below you.',
      " ",
      "\u02C4 symbols are upward slopes.  Gray areas with # are walls, but they may have floors above them.",
      " ",
      "You can climb up or down a slope by pressing < or >, or automatically by trying to walk against the slope.",
      " ",
      "When you climb up or down, colors change with your relative elevation.",
      " ",
      "Try climbing up and down a few slopes."
    ],
    listens: ["Command"],
    skip: "RaisingAZombieStepOne",
    trigger: function(event) {
      if (this.tracking.ups===undefined && this.tracking.downs===undefined) {
        this.tracking.ups = 0;
        this.tracking.downs = 0;
      }
      if (event.command==="Move" && event.dir==='U') {
        this.tracking.ups+=1;
      } else if (event.command==="Move" && event.dir==='D') {
        this.tracking.downs+=1;
      }
      return (this.tracking.ups+this.tracking.downs>=3);
    }
  });

  new Tutorial({
    template: "RaisingAZombieStepOne",
    name: "raising a zombie",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "%c{cyan}Z: Cast spell.",
      " ",
      "?: Toggle tutorial."
    ],
    instructions: ["",
      "In many games, wandering around and exploring would be a good idea.",
      "However, in this game, you should probably stay close to where you started and build a fortress.",
      " ",
      "Let's get started on that raising our first zombie.",
      " ",
      "Near where you started, there should be some symbols like this: \u271D",
      "These are tombstones.  By the way, if you want to know what a symbol represents, hover over it with the mouse and look at the bottom half of the right panel.",
      " ",
      "Find a tombstone.  Then press Z to view a list of spells you can cast, and press A to choose 'Raise Zombie.'"
    ],
    listens: ["Command"],
    skip: "WaitingForTheZombie",
    trigger: function(event) {
      return (event.command==="ShowSpells");
    }
  });

  new Tutorial({
    template: "RaisingAZombieStepTwo",
    name: "raising a zombie",
    controls: function(txt) {
      txt[2] = "%c{cyan}" + txt[2];
      return txt;
    },
    instructions: HTomb.Tutorial.templates.RaisingAZombieStepOne.instructions,
    listens: ["Command"],
    skip: "WaitingForTheZombie",
    trigger: function(event) {
      return (event.command==="ChooseSpell" && event.spell.template==="RaiseZombie");
    }
  });


  new Tutorial({
    template: "RaisingAZombieStepThree",
    name: "raising a zombie",
    controls: [
      "%c{orange}**Esc: Cancel.**",
      "%c{yellow}Select a square with keys or mouse.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "Click / Space: Select.",
    ],
    instructions: [
      "Select a tombstone using the mouse, or by navigating with the arrow keys and pressing space to select.",
      " ",
      "Notice that the bottom portion of this panel gives you information about the square you are hovering over - whether it's a valid target for your spell, what the terrain is like, what creatures are there, and so on."
    ],
    listens: ["Cast"],
    skip: "WaitingForTheZombie",
    trigger: function(event) {
      return (event.spell.template==="RaiseZombie");
    }
    //,checkpoint: function() {
    //  return (HTomb.Player.master.minions.length>0);
    //}
  });

  new Tutorial({
    template: "AchievementsAndScrolling",
    name: "achievements and scrolling",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell.",
      " ",
      "%c{cyan}PageUp/Down: Scroll messages.",
      "%c{cyan}A: Achievements, %c{}?: Toggle tutorial."
    ],
    instructions: [
      "Great job!  You just raised your first zombie.",
      " ",
      "In addition, the scroll below the play area tells you that just earned your first achievement.",
      "(You can scroll messages up and down using the PageUp and PageDown keys.)",
      " ",
      "Press 'A' to view the achievements screen."
    ],
    listens: ["Command","Special"],
    skip: "WaitingForTheZombie",
    trigger: function(event) {
      if (this.tracking.achievements===undefined) {
        this.tracking.achievements = false;
      }
      if (this.tracking.reset===undefined) {
        this.tracking.reset = false;
      }
      if (event.command==="ShowAchievements") {
        this.tracking.achievements = true;
      }
      if (this.tracking.achievements===true && event.details==="Reset") {
        this.tracking.reset = true;
      }
      return (this.tracking.achievements===true && this.tracking.reset===true);
    }
    //,checkpoint: function() {
    //  return (HTomb.Player.master.minions.length>0 && (HTomb.Player.master.minions[0].worker.task===null || HTomb.Player.master.minions[0].worker.task.template!=="ZombieEmergeTask");
    //}
  });

  new Tutorial({
    template: "WaitingForTheZombie",
    name: "waiting for the zombie",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "%c{cyan}Wait: NumPad 5 / Control+Space.",
      " ",
      "Z: Cast spell.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "Most of those achievements require that you order your zombie around.  We'll learn how that works soon, but for now, you can't even see your zombie yet!",
      " ",
      "Your zombie is still buried in its grave, digging its way out.  The orange background around the tombstone indicates that there is a task assigned in that square.",
      " ",
      "Press 5 on the numeric keypad several times, until your zombie emerges.",
      "If you have no numeric keypad, press Control+SpaceBar to wait (actually, you can usually just press Space, but in some situations the SpaceBar has other functions.)"
    ],
    listens: ["Complete"],
    skip: "AssignAJob",
    trigger: function(event) {
      return (event.task && event.task.template==="ZombieEmergeTask");
    }
  });

  new Tutorial({
    template: "UnpausingAndChangingSpeeds",
    name: "unpausing and changing speeds",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Control+Space.",
      " ",
      "%c{cyan}Enter: Enable auto-pause.",
      "%c{cyan}+/-: Change speed.",
      " ",
      "Z: Cast spell.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "Your zombie has emerged!",
      " ",
      "Don't want to press a key just to make time pass?  Try turning off auto-pause by pressing Enter/Return.",
      " ",
      "Time will begin passing on its own.  Press Enter/Return again if you want to turn auto-pause back on, or press + or - to make time pass faster or slower.",
      " ",
      "Wait for some time to pass..."
    ],
    listens: ["TurnBegin"],
    skip: "AssignAJob",
    trigger: function(event) {
      if (!this.tracking.turns) {
        this.tracking.turns = 0;
      }
      this.tracking.turns+=1;
      return (this.tracking.turns>=10);
    }
  });

  new Tutorial({
    template: "AssignAJob",
    name: "assign a job",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Control+Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, J: %c{cyan}Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "Now let's put that lazy zombie to work!",
      " ",
      "Press J to assign a job, and then press A to make your zombie dig."
    ],
    listens: ["Command"],
    skip: "WaitingForDig",
    trigger: function(event) {
      return (event.command==="ShowJobs");
    }
  });

  new Tutorial({
    template: "ChooseAJob.",
    name: "choose a job",
    controls: function(txt) {
      txt[2] = "%c{cyan}" + txt[2];
      return txt;
    },
    instructions: HTomb.Tutorial.templates.AssignAJob.instructions,
    listens: ["Command"],
    skip: "WaitingForDig",
    trigger: function(event) {
      return (event.command==="ChooseJob" && event.task && event.task.template==="DigTask");
    }
  });

  new Tutorial({
    template: "DesignateTilesForDigging",
    name: "designate tiles for digging",
    controls: null,
    instructions: [
      "Now select a rectangular area for your zombie to dig.",
      "What 'digging' means depends on what kind of terrain you select:",
      " ",
      "- Digging on the floor will make a shallow pit.",
      "- Digging in a wall will make a corridor or tunnel.",
      "- Digging on a slope will level the slope."
    ],
    listens: ["Designate"],
    skip: "WaitingForDig",
    trigger: function(event) {
      //even if you skip ahead, it'll trigger when the task completes
      return (event.task && event.task.template==="DigTask");
    }
  });

  new Tutorial({
    template: "WaitingForDig",
    name: "waiting for zombie to dig",
    controls: null,
    instructions: [
      "Now wait for your zombie to dig."
    ],
    skip: "RaiseASecondZombie",
    listens: ["Complete"],
    trigger: function(event) {
      return (event.task && event.task.template==="DigTask");
    }
  });

  new Tutorial({
    template: "RaiseASecondZombie",
    name: "raise a second zombie",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Control+Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "%c{cyan}Z: Cast spell, %c{}J: Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "Every zombie under your control raises the mana cost of the Raise Dead spell.",
      "The first zombie costs 10, the second costs 15, and the third costs 20 (the most you can get with your starting mana.)",
      " ",
      "By now you should might be back up to 15 mana.  If not, pass time until you have 15, then raise a second zombie."
    ],
    listens: ["Complete"],
    trigger: function(event) {
      return (event.task && event.task.template==="ZombieEmergeTask" && HTomb.Player.master.minions.length>=2);
    }
  });

  new Tutorial({
    template: "NavigationModeStepOne",
    name: "navigation mode",
    controls: [
      "Esc: System view.",
      "%c{cyan}Avatar mode (Tab: Move viewing window)",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Control+Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, J: Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Tutorial."
    ],
    instructions: [
      "Once you have several zombies, there is less need for the necromancer to walk around.  Eventually, the necromancer might sit on a throne or study in a library while the zombies do all the work.",
      " ",
      "You can move the game view without moving the necromancer by pressing Tab to enter 'Navigation Mode.'",
    ],
    listens: ["Command"],
    trigger: function(event) {
      return (event.command==="SurveyMode");
    }
  });

  new Tutorial({
    template: "NavigationModeStepTwo",
    name: "navigation mode",
    controls: [
      "Esc: System view.",
      "%c{yellow}*Navigation mode (Tab: Player view)*",
      " ",
      "%c{cyan}Move: NumPad/Arrows, </>: Up/Down",
      "%c{cyan}(Control+Arrows for diagonal.)",
      "%c{cyan}Wait: NumPad 5 / Control+Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, J: Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial.",
    ],
    instructions: [
      "Now you are in navigation mode.",
      " ",
      "Move the screen around using the keypad or arrows.  Press < or > to look up or down a level.  Hold Shift to move multiple spaces at a time.",
    ],
    listens: ["Command"],
    trigger: function(event) {
      if (event.command==="SurveyMove") {
        if (this.tracking.moves===undefined) {
          this.tracking.moves = 0;
        }
        this.tracking.moves+=1;
        return (this.tracking.moves>=10);
      }
    }
  });


  new Tutorial({
    template: "EndOfTutorial",
    name: "end of tutorial",
    controls: [
      "Esc: System view.",
      "%c{yellow}Avatar mode (Tab: Move viewing window)",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Control+Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, J: Assign job.",
      "M: Minions, S: Structures, U: Summary.",
      "G: Pick Up, D: Drop, I: Inventory.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Tutorial.",
      "%c{cyan}F: Submit Feedback."
    ],
    instructions: [
      "Congratulations, you have finished the tutorial!",
      " ",
      "Continue experimenting with assigning different tasks.  See if you can unlock all the achievements in the demo.",
      " ",
      "Press F at any time to submit feedback."
    ],
    listens: ["Command"],
    trigger: function(event) {
      return (event.command==="DisableTutorial");
    }
  });


  let fullThing = [
    "Esc: System view.",
    "%c{yellow}Avatar mode (Tab: Move viewing window)",
    " ",
    "Move: NumPad/Arrows, </>: Up/Down.",
    "(Control+Arrows for diagonal.)",
    "Wait: NumPad 5 / Control+Space.",
    " ",
    "Enter: Enable auto-pause.",
    "+/-: Change speed.",
    " ",
    "Z: Cast spell, J: Assign job.",
    "M: Minions, S: Structures, U: Summary.",
    "G: Pick Up, D: Drop, I: Inventory.",
    " ",
    "PageUp/Down: Scroll messages.",
    "A: Achievements, ?: Tutorial.",
    "F: Submit Feedback."
  ];

  return HTomb;
})(HTomb);
