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
    list: [],
    reset: function() {
      this.menuBlock = [];
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
    },
    disable: function() {
      this.enabled = false;
      HTomb.GUI.Panels.menu.refresh();
    },
    enable: function() {
      this.enabled = true;
      HTomb.GUI.Panels.menu.refresh();
    },
    enabled: true,
    top: [
      "Esc: System view.",
      " ",
      "%c{cyan}Move: NumPad/Arrows.",
      "(Control+Arrows for diagonal.)",
      " ",
      "?: Tutorial."
    ],
    text: [
    ],
    middle: [
    ],
    bottom: [
    ]

  };

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

  function Tutorial(args) {
    args = args || {};
    this.unlocked = false;
    this.template = args.template || "Tutorial";
    HTomb.Achievements.list.push(this);
    this.name = args.name || "dummy tutorial";
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
      this.finished = true;
    }
  }

  new Tutorial({
    template: "Welcome",
    name: "welcome",
    listens: ["TurnBegin","Tutorial","Command"],
    onTutorial: function(event) {
    },
    onTurnBegin: function() {
      if (HTomb.Time.dailyCycle.turn===0) {
        HTomb.Tutorial.text = ["",
          "Welcome to HellaTomb!",
          " ",
          "Try walking around using the numeric keypad.",
          " ",
          "If your keyboard has no keypad, use the arrow keys."
        ];
        this.moves = 0;
        HTomb.GUI.Panels.menu.refresh();
        HTomb.GUI.pushMessage("Welcome to HellaTomb!");
      }
    },
    onCommand: function(event) {
      if (event.command==="Move" && this.moves<5) {
        this.moves+=1;
      }
      if (this.moves>=5) {
        this.moves = undefined;
        HTomb.Tutorial.text = ["",
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
        ];
        this.ups = 0;
        this.downs = 0;
        HTomb.Tutorial.top = [
          "Esc: System view.",
          " ",
          "Move: NumPad/Arrows, %c{cyan}</>: Up/Down.",
          "(Control+Arrows for diagonal.)",
          " ",
          "?: Tutorial."
        ]
        HTomb.GUI.Panels.menu.refresh();
        return;
      }
      if (event.command==="Move" && event.dir==='U' && this.ups!==undefined) {
        this.ups+=1;
      } else if (event.command==="Move" && event.dir==='D' && this.downs!==undefined) {
        this.downs+=1;
      }
      if (this.ups>=2 && this.downs>=2) {
        HTomb.Tutorial.text = ["",
          "Good job! Now let's raise your first zombie.",
          " ",
          "Near where you started, there should be some symbols like this: \u271D",
          " ",
          "Find one.  Then press Z to view a list of spells you can cast."
        ];
        HTomb.Tutorial.top = [
          "Esc: System view.",
          " ",
          "Move: NumPad/Arrows, </>: Up/Down.",
          "(Control+Arrows for diagonal.)",
          " ",
          "%c{cyan}Z: Cast spell.",
          " ",
          "?: Tutorial."
        ]
        HTomb.GUI.Panels.menu.refresh();
        return;
      }
    }
  });


//  ,
//  "\u2663 and \u2660 are trees.",
//  "\u2698 are shrubs or herbs."



  return HTomb;
})(HTomb);
