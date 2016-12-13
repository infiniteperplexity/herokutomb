HTomb = (function(HTomb) {
  "use strict";
  let coord = HTomb.Utils.coord;

  // Might like to have animations

  HTomb.Things.defineBehavior({
    template: "Structure",
    name: "structure",
    owner: null,
    height: 3,
    width: 3,
    x: null,
    y: null,
    z: null,
    features: [],
    symbols: [],
    fgs: [],
    options: {},
    ingredients: {},
    onCreate: function() {
      this.features = [];
      this.options = {};
      return this;
    },
    onPlace: function() {
      this.owner.master.structures.push(this.entity);
    },
    onRemove: function() {
      this.owner.master.structures.splice(this.owner.master.structures.indexOf(this.entity),1);
    },
    highlight: function(bg) {
      for (let i=0; i<this.features.length; i++) {
        this.features[i].highlightColor = bg;
      }
    },
    unhighlight: function() {
      for (let i=0; i<this.features.length; i++) {
        if (this.features[i].highlightColor) {
          delete this.features[i].highlightColor;
        }
      }
    },
    formatControls: function() {
      let txt = [
        "Esc: Done.",
        "%c{yellow}Structure: "+this.entity.name.substr(0,1).toUpperCase()+this.entity.name.substr(1)+" at "+this.entity.x +", "+this.entity.y+", "+this.entity.z+".",
        "Up/Down: Traverse options.",
        "Left/Right: Alter options.",
        "Tab: Next structure.",
        " "
      ];
      return txt;
    },
    formatOptions: function() {
      return [
        "[ ]: Dummy option.",
        "[X]: Dummy option.",
        "%c{gray}[ ]: Dummy option."
      ];
    },
    details: function() {
      let txt = this.formatControls();
      if (this.entity.workshop) {
        txt = this.entity.workshop.formatControls();
        txt = txt.concat(this.entity.workshop.formatGoods());
        txt.push(" ");
        txt = txt.concat(this.entity.workshop.formatQueue());
      } else {
        txt = txt.concat(this.formatOptions());
      }
      return txt;
    }
  });
  HTomb.Things.defineBehavior({
    template: "Workshop",
    name: "workshop",
    queue: null,
    task: null,
    onPlace: function() {
      this.queue = [];
    },
    onRemove: function() {
      for (let i=0; i<this.queue.length; i++) {
        this.task.cancel();
      }
    },
    nextGood: function() {
      if (this.queue.length===0) {
        return;
      } else if (HTomb.World.zones[HTomb.Utils.coord(this.entity.x,this.entity.y,this.entity.z)]) {
        HTomb.GUI.pushMessage("Workshop tried to create new task but there was already a zone.");
        return;
      }
      let zone = HTomb.Things.templates.ProduceTask.placeZone(this.entity.x,this.entity.y,this.entity.z,this.entity.structure.owner);
      this.task = zone.task;
      zone.task.makes = this.queue[0][0];
      zone.task.workshop = this.entity;
      HTomb.GUI.pushMessage("Next good is "+HTomb.Things.templates[zone.task.makes].describe({article: "indefinite"}));
      zone.name = "produce "+HTomb.Things.templates[zone.task.makes].name;
      zone.task.name = "produce "+HTomb.Things.templates[zone.task.makes].name;
      if (this.queue[0][1]==="finite") {
        this.queue[0][2]-=1;
        if (this.queue[0][2]<=0) {
          this.queue.shift();
        }
      } else if (this.queue[0][1]===parseInt(this.queue[0][1])) {
        this.queue[0][2]-=1;
        if (this.queue[0][2]<=0) {
          this.queue[0][2] = this.queue[0][1];
          this.queue.push(this.queue.shift());
        }
      } else if (this.queue[0][1]==="infinite") {
        // do nothing
        // except maybe check to see if there are enough materials???
      }
    },
    formatGoods: function() {
      let txt = [];
      let alphabet = 'abcdefghijklmnopqrstuvwxyz';
      for (let i=0; i<this.makes.length; i++) {
        let t = HTomb.Things.templates[this.makes[i]];
        txt.push(alphabet[i] + ") " + t.describe({article: "indefinite"}));
      }
      return txt;
    },
    formatQueue: function() {
      let txt = [];
      if (this.task) {
        let s = "@ " + HTomb.Things.templates[this.task.makes].describe({article: "indefinite"});
        if (this.task.assignee) {
          s+=": (active: "+this.task.assignee.describe({article: "indefinite"})+")";
        } else {
          s+=": (unassigned)";
        }
        txt.push(s);
      } else {
        txt.push("@ (none)");
      }
      for (let i=0; i<this.queue.length; i++) {
        let item = this.queue[i];
        let s = "- " + HTomb.Things.templates[item[0]].describe({article: "indefinite"}) + ": ";
        if (item[1]==="finite") {
          s+=(" (repeat " + item[2] + ")");
        } else if (item[1]==="infinite") {
          s+=" (repeat infinite)";
        } else if (item[1]===parseInt(item[1])) {
          s+=(" (cycle " + item[2] + ")");
        }
        txt.push(s);
      }
      if (txt.length>1 && HTomb.GUI.Views.Structures.structureCursor>-1) {
        let s = txt[HTomb.GUI.Views.Structures.structureCursor+1];
        s = ">" + s.substr(1);
        txt[HTomb.GUI.Views.Structures.structureCursor+1] = s;
      } else {
        let s = txt[0];
        s = ">" + s.substr(1);
        txt[0] = s;
      }
      txt.unshift("Production Queue:");
      return txt;
    },
    formatControls: function() {
      let txt = [
        "Esc: Done.",
        "%c{yellow}Workshop: "+this.entity.name.substr(0,1).toUpperCase()+this.entity.name.substr(1)+" at "+this.entity.x +", "+this.entity.y+", "+this.entity.z+".",
        "Up/Down: Traverse queue.",
        "Left/Right: Alter repeat.",
        "[/]: Alter count.",
        "a-z: Insert good below the >.",
        "Backspace/Delete: Remove good.",
        "Tab: Next structure.",
        " "
      ];
      return txt;
    },
    details: function() {
      let txt = this.formatControls();
      if (this.makes && this.makes.length>0) {
        txt = txt.concat(this.formatGoods());
        txt.push(" ")
      }
      txt = txt.concat(this.formatQueue());
      return txt;
    }
  });

  HTomb.Things.defineStructure = function(args) {
    args = args || {};
    args.behaviors = args.behaviors || {};
    let structure = {};
    if (args.height) {
      structure.height = args.height;
    }
    if (args.width) {
      structure.width = args.width;
    }
    if (args.symbols) {
      structure.symbols = HTomb.Utils.copy(args.symbols);
    }
    if (args.fgs) {
      structure.fgs = HTomb.Utils.copy(args.fgs);
    }
    if (args.ingredients) {
      structure.ingredients = HTomb.Utils.copy(args.ingredients);
    }
    if (args.formatOptions) {
      structure.formatOptions = args.formatOptions;
    }
    args.behaviors.Structure = structure;
    HTomb.Things.defineFeature({
      template: args.template+"Feature",
      name: args.name,
      position: null,
      onRemove: function() {
        let c = this.workshop;
        c.features.splice(c.features.indexOf(this),0);
        this.workshop.remove();
        if (c.features.length<=0) {
          c.despawn();
        }
      }
    });
    HTomb.Things.defineEntity(args);
  };

  HTomb.Things.defineWorkshop = function(args) {
    args = args || {};
    args.behaviors = args.behaviors || {};
    let workshop = {};
    if (args.makes) {
      workshop.makes = HTomb.Utils.copy(args.makes);
    }
    args.behaviors.Workshop = workshop;
    HTomb.Things.defineStructure(args);
  };

  HTomb.Things.defineStructure({
    template: "Farm",
    name: "farm",
    symbols: ["=","=","=","=","=","=","=","=","="],
    fgs: ["#779922","#779922","#779922","#779922","#779922","#779922","#779922","#779922","#779922"],
    options: {},
    formatOptions: function() {
      let optxt = [];
      for (let i in this.options) {
        optxt.push(i);
      }
      optxt.sort();
      let findSeeds = HTomb.Utils.getItems(function(item) {
        if (item.parent==="Seed" && item.item.isOwned()===true && item.item.onGround()===true) {
          return true;
        } else {
          return false;
        }
      });
      let allSeeds = [];
      for (let i=0; i<findSeeds.length;i++) {
        let t = findSeeds[i].template;
        if (allSeeds.indexOf(t)===-1) {
          allSeeds.push(t);
        }
      }
      let txt = ["Crops permitted:"];
      for (let i=0; i<optxt.length; i++) {
        let s = "";
        if (this.options[optxt[i]===true]) {
          s = "[X] " + optxt[i]+".";
        } else {
          s = "[ ] " + optxt[i]+".";
        }
        if (allSeeds.indexOf(opttxt[i])===-1) {
          s = "%c{gray}"+s;
        } else {
          s = "%c{white}"+s;
        }
        txt.push(s);
      }
      txt.push(" ");
      return txt;
    },
    onPlace: function(x,y,z) {
      HTomb.Things.templates.Structure.onPlace.call(this,[x,y,z]);
      HTomb.Events.subscribe(this, "TurnBegin");
      let crops = HTomb.Types.templates.Crop.types;
      for (let i=0; i<crops.length; i++) {
        this.options[crops[i].template] = false;
      }
    },
    onRemove: function() {
      HTomb.Things.templates.Structure.onPlace.call(this);
      HTomb.Events.unsubscribeAll(this);
    },
    onTurnBegin: function() {

    }
  });

  HTomb.Things.defineStructure({
    template: "Farm",
    name: "farm",
    symbols: ["=","=","=","=","=","=","=","=","="],
    fgs: ["#779922","#779922","#779922","#779922","#779922","#779922","#779922","#779922","#779922"],
    details: {}
  });



  HTomb.Things.defineStructure({
    template: "Storeroom",
    name: "storeroom",
    symbols: ["\u2554","\u2550","\u2557","\u2551","=","\u2551","\u255A","\u2550","\u255D"],
    fgs: ["#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB"]
  });

  HTomb.Things.defineWorkshop({
    template: "Mortuary",
    name: "mortuary",
    symbols: ["\u2744","\u2637","\u2744","\u2637","\u2744","\u2637","\u2744","\u2637","\u2744"],
    fgs: ["#AAAAFF","#999999","#AAAAFF","#999999","#AAAAFF","#999999","#AAAAFF","#999999","#AAAAFF"]
  });

  HTomb.Things.defineWorkshop({
    template: "BoneCarvery",
    name: "bone carvery",
    symbols: ["\u2692","\u2620","\u2692","\u2620","\u2699","\u2620","\u2692","\u2620","\u2692"],
    fgs: ["#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB"]
  });

  HTomb.Things.defineWorkshop({
    template: "Carpenter",
    name: "carpenter",
    symbols: ["\u2692","\u2261","\u2692","\u2261","\u2699","\u2261","\u2692","\u2261","\u2692"],
    fgs: ["#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922"],
    makes: ["DoorItem","TorchItem","ThroneItem"]
  });

  HTomb.Things.defineWorkshop({
    template: "Library",
    name: "library",
    symbols: ["\u270D","\u270E","\u2710","/","\u25AD","\u26B4/","\u2261","/","\u2261"],
    fgs: ["#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922"]
  });

  HTomb.Things.defineWorkshop({
    template: "Laboratory",
    name: "library",
    symbols: ["\u2609","\u263F","\u2640","\u263D","\u2641","\u2697","\u2642","\u2643","\u26A9"],
    fgs: ["#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922"]
  });


  HTomb.Things.defineTask({
    template: "ProduceTask",
    name: "produce",
    zoneTemplate: {
      template: "ProduceZone",
      name: "produce",
      bg: "#336699"
    },
    workshop: null,
    makes: null,
    steps: 10,
    started: false,
    work: function(x,y,z) {
      if (this.spend()===true || this.started===true) {
        this.started = true;
      this.steps-=1;
        this.assignee.ai.acted = true;
        if (this.steps<=0) {
          let x = this.zone.x;
          let y = this.zone.y;
          let z = this.zone.z;
          HTomb.Things[this.makes]().place(x,y,z);
          this.workshop.occupied = null;
          HTomb.GUI.pushMessage(this.assignee.describe({capitalized: true, article: "indefinite"}) + " finishes making " + HTomb.Things.templates[this.makes].describe({article: "indefinite"}));
          this.complete();
        }
      }
    },
    onDespawn: function() {
      this.workshop.workshop.task = null;
      this.workshop.workshop.nextGood();
    }
  });

  HTomb.Things.defineTask({
    template: "ConstructTask",
    name: "construct",
    zoneTemplate: {
      template: "ConstructZone",
      name: "construct",
      bg: "#553300",
      position: null
    },
    makes: null,
    structures: null,
    //workshops: ["Mortuary","BoneCarvery","Carpenter"],
    structures: ["Carpenter","Farm","Storeroom"],
    designate: function(assigner) {
      var arr = [];
      for (var i=0; i<this.structures.length; i++) {
        arr.push(HTomb.Things.templates[this.structures[i]]);
      }
      var that = this;
      HTomb.GUI.choosingMenu("Choose a structure:", arr, function(structure) {
        function placeBox(squares, options) {
          let failed = false;
          let struc = null;
          for (let i=0; i<squares.length; i++) {
            let crd = squares[i];
            let f = HTomb.World.features[coord(crd[0],crd[1],crd[2])];
            if (HTomb.World.tiles[crd[2]][crd[0]][crd[1]]!==HTomb.Tiles.FloorTile) {
              failed = true;
            // a completed, partial version of the same workshop
          } else if (f && f.template===structure.template+"Feature") {
              struc = f.structure;
              if (struc.isPlaced()===true || struc.x!==squares[0][0] || struc.y!==squares[0][1]) {
                failed = true;
              }
            // an incomplete version of the same workshop
          } else if (f && (f.template!=="IncompleteFeature" || f.makes!==structure.template+"Feature")) {
              failed = true;
            }
          }
          if (failed===true) {
            HTomb.GUI.pushMessage("Can't build there.");
            return;
          }
          let w;
          if (struc!==null) {
            w = struc;
          } else {
            w = HTomb.Things[structure.template]();
            w.structure.owner = assigner;
            let mid = Math.floor(squares.length/2);
            w.structure.x = squares[mid][0];
            w.structure.y = squares[mid][1];
            w.structure.z = squares[mid][2];
          }
          for (let i=0; i<squares.length; i++) {
            let crd = squares[i];
            if (HTomb.World.features[coord(crd[0],crd[1],crd[2])] && HTomb.World.features[coord(crd[0],crd[1],crd[2])].template===w.template+"Feature") {
              continue;
            }
            let zone = this.placeZone(crd[0],crd[1],crd[2],assigner);
            if (zone) {
              zone.task.structure = w;
              zone.task.makes = structure.template+"Feature";
              zone.task.ingredients = HTomb.Utils.clone(w.structure.ingredients);
              zone.position = i;
            }
          }
        }
        return function() {
          let s = structure.behaviorTemplate("Structure");
          HTomb.GUI.selectBox(s.width, s.height, assigner.z,that.designateBox,{
            assigner: assigner,
            context: that,
            callback: placeBox
          });
        };
      });
    },
    designateBox: function(squares, options) {
      options = options || {};
      var assigner = options.assigner;
      var callb = options.callback;
      callb.call(options.context,squares,assigner);
    },
    onComplete: function() {
      let x = this.zone.x;
      let y = this.zone.y;
      let z = this.zone.z;
      let f = HTomb.World.features[coord(x,y,z)];
      f.structure = this.structure;
      this.structure.structure.features.push(f);
      f.fg = this.structure.structure.fgs[this.zone.position];
      f.symbol = this.structure.structure.symbols[this.zone.position];
      if (this.structure.structure.features.length===this.structure.structure.height*this.structure.structure.width) {
        let w = this.structure;
        w.place(w.structure.x, w.structure.y, w.structure.z);
      }
    }
  });
  // UseWorkshopTask
    // Each workshop maintains a queue...it spawns tasks one at a time.
    // When the task finished, it tries to assign the next one to the same minion.
  // We could auto-queue a feature when we CraftTask
  // Or we can do it through stocks

  //DF workshops...
    // Bowyer, Carpenter, Jeweler, Mason, Butcher, Mechanic, Farmer, Fishery, Craftsdwarf, Siege, Furnace, Smelter, Kiln, Glass Furnace
    // Tanner, Loom, Still, Ashery, Screw Press, Kitchen, Quern, Millstone,
    // Leatherwork, Clothier, Dyer, Metalsmith, Soap

  // Goblin Camp
    // Saw Pit, Carpenter, Basket Weaver, Winery, Kitchen, Butcher, Weaver, Bone Carver, Stone Mason, Weapon Crafter,
    // Leather Crafter, Tanner, Mill, Bloomery, Blacksmith, Kiln, Oil Press, Alchemist, Armorsmith

//    -	Do X times
//    -	As many as possible (u221E)
//    -	Cycle (u27F3, u21BB, u21C4)


return HTomb;
})(HTomb);
