HTomb = (function(HTomb) {
  "use strict";
  var coord = HTomb.Utils.coord;

  HTomb.Achievements = {};
  function Achievement(args) {
    args = args || {};
    this.template = args.template || "Achievement";
    HTomb.Achievements[this.template] = false;
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
      HTomb.Achievements[this.template] = true;
      HTomb.GUI.pushMessage("%c{lime}%b{purple}"+this.description);
      HTomb.GUI.pushMessage("%c{lime}%b{purple}Achievement: " + this.name);
      HTomb.Events.unsubscribeAll(this);
    }
  }

  new Achievement({
    template: "BringOutYourDead",
    name: "Bring Out Your Dead!",
    description: "(raised one zombie.)",
    listens: ["Complete","Cast"],
    onComplete: function(event) {
      if (event.task.template==="ZombieEmergeTask") {
        this.achieve();
      }
    },
    onCast: function(event) {
      if (event.spell.template==="RaiseZombie") {
        let x = event.x;
        let y = event.y;
        let z = event.z;
        let f = HTomb.World.features[coord(x,y,z+1)];
        if (!f || f.template!=="Tombstone") {
          this.achieve();
        }
      }
    }
  });
  new Achievement({
    template: "ArmyOfTheDead",
    name: "Army Of The Dead.",
    description: "(raised maximum initial number of zombies.)",
    listens: ["Complete","Cast"],
    onComplete: function(event) {
      if (event.task.template==="ZombieEmergeTask") {
        if (HTomb.Player.master.minions.length>=3) {
          this.achieve();
        }
      }
    },
    onCast: function(event) {
      if (event.spell.template==="RaiseZombie") {
        let x = event.x;
        let y = event.y;
        let z = event.z;
        let f = HTomb.World.features[coord(x,y,z+1)];
        if (!f || f.template!=="Tombstone") {
          if (HTomb.Player.master.minions.length>=2) {
            this.achieve();
          }
        }
      }
    }
  });
  new Achievement({
    template: "TodayWasAGoodDay",
    name: "Today Was A Good Day.",
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
    name: "The Darkest Hour.",
    description: "(survive until dawn.)",
    listens: ["TurnBegin"],
    onTurnBegin: function() {
      if (HTomb.Time.dailyCycle.hour===HTomb.Time.dailyCycle.times.dawn) {
          this.achieve();
      }
    }
  });
  new Achievement({
    template: "FirstBlood",
    name: "First Blood.",
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
    template: "BreakingNewGround",
    name: "Breaking New Ground.",
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
    name: "Another Brick In The Wall.",
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
    name: "Exclusive Ore.",
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
        if (items[i].item.tags.indexOf("Minerals")!==-1) {
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
    name: "Into The Woods.",
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
    template: "GoToSeed",
    name: "Go To Seed.",
    description: "(plant a seed or spore in a farm.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="FarmTask") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "AllTheFixings",
    name: "All The Fixings.",
    description: "(furnish a fixture.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="FurnishTask") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "ReapWhatYouSow",
    name: "Reap What You Sow.",
    description: "(harvest a crop from a farm.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="FarmHarvestTask") {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "RibbonCutting",
    name: "Ribbon Cutting.",
    description: "(complete a structure.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="ConstructTask" && event.task.structure.isPlaced()) {
        this.achieve();
      }
    }
  });
  new Achievement({
    template: "SaveOneForLater",
    name: "Save One For Later.",
    description: "(have a minion place an item in a storeroom.)",
    listens: ["Complete"],
    onComplete: function(event) {
      if (event.task.template==="StockpileTask") {
        this.achieve();
      }
    }
  });

  // harvest a crop


  return HTomb;
})(HTomb);