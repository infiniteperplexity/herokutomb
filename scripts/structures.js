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
    options: [],
    ingredients: {},
    cursor: -1,
    onDefine: function(args) {
      HTomb.Things.templates.Behavior.onDefine.call(this,args);
      HTomb.Things.defineFeature({template: args.template+"Feature", name: args.name});
    },
    onCreate: function() {
      this.features = [];
      this.options = HTomb.Utils.copy(this.options);
      return this;
    },
    onPlace: function() {
      this.owner.master.structures.push(this.entity);
      if (this.onTurnBegin) {
        HTomb.Events.subscribe(this,"TurnBegin");
      }
    },
    onRemove: function() {
      this.owner.master.structures.splice(this.owner.master.structures.indexOf(this.entity),1);
      HTomb.Events.unsubscribeAll(this);
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
    headerText: function() {
      return "%c{yellow}Structure: "+this.entity.name.substr(0,1).toUpperCase()+this.entity.name.substr(1)+" at "+this.entity.x +", "+this.entity.y+", "+this.entity.z+".";
    },
    detailsText: function() {
      let txt = this.commandsText();
      txt.concat(this.optionsText());
      return txt;
    },
    commandsText: function() {
      let txt = [
        "Esc: Done.",
        this.headerText(),
        "a-z: Toggle option.",
        "Tab: Next structure.",
        " "
      ];
      txt = txt.concat(this.optionsText());
      return txt;
    },
    updateOptions: function() {

    },
    optionsHeading: function() {

    },
    noOptionsText: function() {
      return "(No options.)";
    },
    optionsText: function() {
      this.updateOptions();
      if (this.options.length===0) {
        return this.noOptionsText();
      }
      let txt = [this.optionsHeading()];
      let alphabet = "abcdefghijklmnopqrstuvwxyz";
      for (let i=0; i<this.options.length; i++) {
        let opt = this.options[i];
        let s = "";
        if (opt.active) {
          s = "%c{white}";
        } else {
          s = "%c{gray}";
        }
        s+=alphabet[i];
        s+=") ";
        if (opt.selected) {
          s += "[X] ";
        } else {
          s += "[ ] ";
        }
        s+=opt.text;
        s+=".";
        txt.push(s);
      }
      return txt;
    },
    choiceCommand: function(i) {
      if (this.options[i]!==undefined) {
        this.options[i].selected = !this.options[i].selected;
      }
    },
    upCommand: function() {
    },
    downCommand: function() {
    },
    leftCommand: function() {
    },
    rightCommand: function() {
    },
    moreCommand: function() {
    },
    lessCommand: function() {
    },
    cancelCommand: function() {
    }
  });

  HTomb.Things.defineStructure({
    template: "Workshop",
    makes: [],
    queue: null,
    task: null,
    onPlace: function(x,y,z) {
      HTomb.Things.templates.Structure.onPlace.call(this,x,y,z);
      this.queue = [];
    },
    onRemove: function() {
      HTomb.Things.templates.Structure.onRemove.call(this);
      for (let i=0; i<this.queue.length; i++) {
        this.task.cancel();
      }
    },
    choiceCommand: function(i) {
      if (this.makes.length<=i) {
        return;
      }
      this.queue.splice(this.cursor+1,0,[this.makes[i],"finite",1]);
      if (this.task===null) {
        this.nextGood();
      }
      if (this.cursor<this.queue.length-1) {
        this.cursor+=1;
      }
    },
    upCommand: function() {
      this.cursor-=1;
      if (this.cursor<-1) {
        this.cursor = this.queue.length-1;
      }
    },
    downCommand: function() {
      this.cursor+=1;
      if (this.cursor>this.queue.length-1) {
        this.cursor = -1;
      }
    },
    rightCommand: function() {
      let i = this.cursor;
      if (i===-1 || this.queue.length===0) {
        return;
      }
      if (this.queue[i][1]==="finite") {
        this.queue[i][1]=1;
      } else if (parseInt(this.queue[i][1])===this.queue[i][1]) {
        this.queue[i][1]="infinite";
      } else if (this.queue[i][1]==="infinite") {
        this.queue[i][1] = "finite";
      }
    },
    leftCommand: function() {
      let i = this.cursor;
      if (i===-1 || this.queue.length===0) {
        return;
      }
      if (this.queue[i][1]==="finite") {
        this.queue[i][1]="infinite";
      } else if (parseInt(this.queue[i][1])===this.queue[i][1]) {
        this.queue[i][1] = "finite";
      } else if (this.queue[i][1]==="infinite") {
        this.queue[i][1]=1;
      }
    },
    moreCommand: function() {
      let i = this.cursor;
      if (i===-1 || this.queue.length===0) {
        return;
      }
      if (this.queue[i][1]==="finite") {
        this.queue[i][2]+=1;
      } else if (parseInt(this.queue[i][1])===this.queue[i][1]) {
        this.queue[i][1]+=1;
        this.queue[i][2]+=1;
      }
    },
    lessCommand: function() {
      let i = this.cursor;
      if (i===-1 || this.queue.length===0) {
        return;
      }
      if (this.queue[i][1]==="finite" && this.queue[i][2]>1) {
        this.queue[i][2]-=1;
      } else if (parseInt(this.queue[i][1])===this.queue[i][1] && this.queue[i][1]>1) {
        this.queue[i][1]-=1;
        if (this.queue[i][2]>this.queue[i][1]) {
          this.queue[i][2] = this.queue[i][1];
        }
      }
    },
    cancelCommand: function() {
      if (this.cursor===-1) {
        if (this.task) {
          this.task.task.cancel();
        }
      } else if (this.queue.length>0 && this.cursor>=0) {
        this.queue.splice(this.cursor,1);
      }
      if (this.cursor>=this.queue.length) {
        this.cursor = this.queue.length-1;
      }
    },
    nextGood: function() {
      if (this.queue.length===0) {
        return;
      } else if (HTomb.World.tasks[HTomb.Utils.coord(this.x,this.y,this.z)]) {
        HTomb.GUI.pushMessage("Workshop tried to create new task but there was already a zone.");
        return;
      }
      let task = HTomb.Things.templates.ProduceTask.designateTile(this.x,this.y,this.z,this.owner);
      this.task = task;
      task.task.makes = this.queue[0][0];
      task.task.workshop = this;
      HTomb.GUI.pushMessage("Next good is "+HTomb.Things.templates[task.task.makes].describe({article: "indefinite"}));
      task.name = "produce "+HTomb.Things.templates[task.task.makes].name;
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
    detailsText: function() {
      let txt = [
        "Esc: Done.",
        "%c{yellow}Workshop: "+this.name.substr(0,1).toUpperCase()+this.name.substr(1)+" at "+this.x +", "+this.y+", "+this.z+".",
        "Up/Down: Traverse queue.",
        "Left/Right: Alter repeat.",
        "[/]: Alter count.",
        "a-z: Insert good below the >.",
        "Backspace/Delete: Remove good.",
        "Tab: Next structure.",
        " ",
        "Goods:"
      ];
      let alphabet = 'abcdefghijklmnopqrstuvwxyz';
      for (let i=0; i<this.makes.length; i++) {
        let t = HTomb.Things.templates[this.makes[i]];
        txt.push(alphabet[i] + ") " + t.describe({article: "indefinite"}));
      }
      txt.push(" ");
      txt.push("Production Queue:");
      let startQueue = txt.length;
      if (this.task) {
        let s = "@ " + HTomb.Things.templates[this.task.task.makes].describe({article: "indefinite"});
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
      if (this.queue.length>0 && this.cursor>-1) {
        let s = txt[this.cursor+1+startQueue];
        s = ">" + s.substr(1);
        txt[this.cursor+1+startQueue] = s;
      } else {
        let s = txt[startQueue];
        s = ">" + s.substr(1);
        txt[startQueue] = s;
      }
      return txt;
    }
  });

  HTomb.Things.defineStructure({
    template: "Farm",
    name: "farm",
    symbols: ["=","=","=","=","=","=","=","=","="],
    fgs: ["#779922","#779922","#779922","#779922","#779922","#779922","#779922","#779922","#779922"],
    onDefine: function(args) {
      HTomb.Things.templates.Structure.onDefine.call(this,args);
      HTomb.Things.templates.FarmFeature.bg = "#443322";
    },
    onPlace: function(x,y,z) {
      HTomb.Things.templates.Structure.onPlace.call(this,x,y,z);
      let crops = HTomb.Types.templates.Crop.types;
      for (let i=0; i<crops.length; i++) {
        this.options.push({
          text: crops[i].template,
          selected: false,
          active: false
        });
      }
    },
    allSeeds: function() {
      let findSeeds = HTomb.Utils.findItems(function(item) {
        if (item.parent==="Seed" && item.item.isOwned()===true && item.item.isOnGround()===true) {
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
      return allSeeds;
    },
    optionsHeading: function() {
      return "Crops permitted:";
    },
    noOptionsText: function() {
      return "(No crops defined?)";
    },
    updateOptions: function() {
      let allSeeds = this.allSeeds();
      for (let i=0; i<this.options.length; i++) {
        let opt = this.options[i];
        if (allSeeds.indexOf(opt.text+"Seed")===-1) {
          opt.active = false;
        } else {
          opt.active = true;
        }
      }
    },
    onTurnBegin: function() {
      let seeds = [];
      let all = this.allSeeds();
      for (let i=0; i<this.options.length; i++) {
        let o = this.options[i];
        if (o.selected && all.indexOf(o.text+"Seed")!==-1) {
          seeds.push(o.text);
        }
      }
      if (seeds.length===0) {
        return;
      }
      for (let i=0; i<this.features.length; i++) {
        let f = this.features[i];
        let task = HTomb.World.tasks[coord(f.x,f.y,f.z)];
        if (!task && !f.growing) {
          HTomb.Utils.shuffle(seeds);
          let seed = seeds[0];
          let t = HTomb.Things.FarmTask({makes: seed, assigner: this.owner}).place(f.x,f.y,f.z,this.owner);
          t.task.ingredients = {};
          t.task.ingredients[seed+"Seed"] = 1;
        }
      }
    }
  });
  HTomb.Things.defineTask({
    template: "FarmTask",
    name: "farm",
    bg: "#225511",
    makes: null,
    validTile: function(x,y,z) {
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      let f = HTomb.World.features[coord(x,y,z)];
      if (f && f.template==="FarmFeature" && !f.growing && (!f.makes || f.makes.template===this.makes+"Sprout")) {
        return true;
      } else {
        return false;
      }
    },
    designateTile: function(x,y,z,assigner) {
      let t = HTomb.Things.templates.Task.designateTile(x,y,z,assigner);
      return t;
    },
    workBegun: function() {
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      let f = HTomb.World.features[coord(x,y,z)];
      if (f && f.template==="FarmFeature" && f.makes && f.makes.template===this.makes+"Sprout") {
        return true;
      } else {
        return false;
      }
    },
    beginWork: function() {
      // could handle auto-dismantling here...
      // will this work?  or should we check for ingredients before taking?
      if (this.assignee.inventory.items.hasAll(this.ingredients)!==true) {
        throw new Error("Shoudl never reach this due to AI");
      }
      let items = this.assignee.inventory.items.takeItems(this.ingredients);
      for (let i=0; i<items.length; i++) {
        items[i].despawn();
      }
      //let's avoid the incompleteFeature entirely?
      let c = HTomb.Things[this.makes+"Sprout"]();
      let f = HTomb.World.features[coord(this.entity.x,this.entity.y,this.entity.z)];
      f.makes = c;
      f.steps = -5;
      f.symbol = c.incompleteSymbol;
      f.fg = c.fg;
      this.assignee.ai.acted = true;
    },
    work: function() {
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      if (this.validTile(x,y,z)!==true) {
        this.cancel();
      }
      //do I want to make demolishing unowned features the default?
      let f = HTomb.World.features[coord(x,y,z)];
      // we could also handle the dismantling in "beginWork"...
      // Somehow we manage to start this task without having the proper ingredients
      if (this.workBegun()!==true) {
        this.beginWork();
      } else {
        f.steps+=1;
        this.assignee.ai.acted = true;
      }
      if (f && f.steps>=0) {
        f.growing = f.makes;
        f.makes = null;
        f.symbol = f.growing.symbol;
        this.completeWork();
      }
    }
  });

  HTomb.Things.defineWorkshop({
    template: "Carpenter",
    name: "carpenter",
    symbols: ["\u2692","\u2261","\u2692","\u2261","\u2699","\u2261","\u2692","\u2261","\u2692"],
    fgs: ["#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922"],
    makes: [
      "DoorItem",
      "TorchItem",
      "ThroneItem"
    ]
  });

  HTomb.Things.defineStructure({
    template: "Warehouse",
    name: "warehouse",
    symbols: ["\u2554","\u2550","\u2557","\u2551","=","\u2551","\u255A","\u2550","\u255D"],
    fgs: ["#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB"],
    options: [
      {text: "Minerals", selected: false, active: false},
      {text: "Wood", selected: false, active: false},
      {text: "Seeds", selected: false, active: false},
      {text: "Herbs", selected: false, active: false},
      {text: "Furnishings", selected: false, active: false}
    ],
    optionsHeading: function() {
      return "Store items:";
    },
    onTurnBegin: function() {
      let types = [];
      for (let o in this.options) {
        if (this.options[o].selected===true) {
          types.push(this.options[o].text);
        }
      }
      if (types.length===0) {
        return;
      }
      for (let i=0; i<this.features.length; i++) {
        let f = this.features[i];
        let z = HTomb.World.tasks[coord(f.x,f.y,f.z)];
        if (z===undefined) {
          z = HTomb.Things.StockpileTask({
            assigner: this.owner,
            allows: HTomb.Utils.copy(types)
          });
          z.place(f.x,f.y,f.z);
        } else if (z.template==="Stockpile") {
          z.task.allows = HTomb.Utils.copy(types);
        }
      }
    }
  });
  HTomb.Things.defineTask({
    template: "StockpileTask",
    name: "stockpile",
    bg: "#666600",
    allows: [],
    validTile: function(x,y,z) {
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      if (HTomb.World.tiles[z][x][y]===HTomb.Tiles.FloorTile) {
        return true;
      } else {
        return false;
      }
    },
    canAssign: function(cr) {
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      if (this.validTile(x,y,z) && HTomb.Tiles.isReachableFrom(cr.x,cr.y,cr.z,x,y,z) && this.getSomeValidItem()) {
        return true;
      } else {
        return false;
      }
    },
    itemAllowed: function(item) {
      for (let i=0; i<this.allows.length; i++) {
        for (let j=0; j<item.item.tags.length; j++) {
          if (this.allows[i]===item.item.tags[j]) {
            return true;
          }
        }
      }
      return false;
    },
    getSomeValidItem: function(cr) {
      // right now we ignore the creature argument
      let pile = HTomb.World.items[coord(this.x,this.y,this.z)] || HTomb.Things.Container();
      for (var it in HTomb.World.items) {
        var items = HTomb.World.items[it];
        var task = HTomb.World.tasks[it];
        // if it's already in a stockpile, skip it
        if (task && task.task.template==="StockpileTask") {
          continue;
        }
        let xyz = HTomb.Utils.decoord(it);
        for (var i=0; i<items.length; i++) {
          var item = items.expose(i);
          if (item.item.owned===true
              && pile.canFit(item)>=1
              && this.itemAllowed(item)
              && HTomb.Tiles.isReachableFrom(this.entity.x,this.entity.y,this.entity.z,xyz[0],xyz[1],xyz[2])) {
            return item;
          }
        }
      }
      return null;
    },
    ai: function() {
      var cr = this.assignee;
      var t = cr.ai.target;
      if (cr.movement) {
        var x = this.entity.x;
        var y = this.entity.y;
        var z = this.entity.z;
        var path = HTomb.Path.aStar(cr.x,cr.y,cr.z,x,y,z);
        if (path===false) {
          this.unassign();
          cr.ai.walkRandom();
        } else {
          let carrying = false;
          for (let j=0; j<cr.inventory.items.length; j++) {
            let item = cr.inventory.items.expose(j);
            if (this.itemAllowed(item)) {
              carrying=true;
              if (cr.x===x && cr.y===y && cr.z===z) {
                cr.inventory.drop(item);
                cr.ai.target = null;
                this.unassign();
              } else {
                cr.ai.walkToward(x,y,z);
              }
              break;
            }
          }
          if (carrying===false) {
            cr.ai.target = this.getSomeValidItem(cr);
            // should maybe use fetch with an option to avoid things in hoards?
            if (cr.ai.target===null) {
              this.unassign();
              cr.ai.walkRandom();
            } else if (cr.x===cr.ai.target.x && cr.y===cr.ai.target.y && cr.z===cr.ai.target.z) {
              let pile = HTomb.World.items[coord(this.x,this.y,this.z)] || HTomb.Things.Container();
              let item = cr.ai.target;
              let n = Math.min(pile.canFit(item),item.item.n);
              if (n===0) {
                this.unassign();
                cr.ai.walkRandom();
              } else {
                cr.inventory.pickupSome(item.template,n);
                cr.ai.target = null;
              }
            } else {
              cr.ai.walkToward(cr.ai.target.x,cr.ai.target.y,cr.ai.target.z);
            }
          }
        }
      }
      cr.ai.acted = true;
    }
  });

  HTomb.Things.defineStructure({
    template: "Monument",
    name: "monument",
    symbols: ["@"],
    fgs: ["gray"],
    height: 1,
    width: 1,
    cancelCommand: function() {
      if (this.cursor===0) {
        let code = prompt("Enter a unicode value.",this.features[0].symbol.charCodeAt());
        code = code.substr(0,4).toUpperCase();
        let pat = /[A-F0-9]{1,4}/;
        let match = pat.exec(code);
        if (match===null) {
          alert("Invalid Unicode value.");
        } else {
          this.features[0].symbol = String.fromCharCode(parseInt(code,16));
        }
      } else if (this.cursor===1) {
        let code = prompt("Enter an 16-bit hex value for red.",ROT.Color.fromString(this.features[0].fg)[0]);
        code = code.toUpperCase();
        let pat = /[A-F0-9]{1,2}/;
        let match = pat.exec(code);
        if (match===null) {
          alert("Invalid 16-bit hex value.");
        } else {
          let fg = this.features[0].fg;
          this.features[0].fg = "#" + code + fg.substr(3,4);
        }
      } else if (this.cursor===2) {
        let code = prompt("Enter an 16-bit hex value for green.",ROT.Color.fromString(this.features[0].fg)[1]);
        code = code.toUpperCase();
        let pat = /[A-F0-9]{1,2}/;
        let match = pat.exec(code);
        if (match===null) {
          alert("Invalid 16-bit hex value.");
        } else {
          let fg = this.features[0].fg;
          this.features[0].fg = "#" + fg.substr(1,2) + code + fg.substr(5,2);
        }
      } else if (this.cursor===3) {
        let code = prompt("Enter an 16-bit hex value for blue.",ROT.Color.fromString(this.features[0].fg)[2]);
        code = code.toUpperCase();
        let pat = /[A-F0-9]{1,2}/;
        let match = pat.exec(code);
        if (match===null) {
          alert("Invalid 16-bit hex value.");
        } else {
          let fg = this.features[0].fg;
          this.features[0].fg = "#" + fg.substr(3,4) + code;
        }
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    upCommand: function() {
      this.cursor-=1;
      if (this.cursor<0) {
        this.cursor = 3;
      }
    },
    downCommand: function() {
      this.cursor+=1;
      if (this.cursor>=4) {
        this.cursor = 0;
      }
    },
    moreCommand: function() {
      if (this.cursor===0) {
        let code = this.features[0].symbol.charCodeAt();
        code+=16;
        if (code>0xFFFF) {
          code-=0xFFFF;
        }
        this.features[0].symbol = String.fromCharCode(code);
      } else if (this.cursor===1) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[0];
        n+=16;
        if (n>=256) {
          n-=256;
        }
        this.features[0].fg = ROT.Color.toHex([n,c[1],c[2]]);
      } else if (this.cursor===2) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[1];
        n+=16;
        if (n>=256) {
          n-=256;
        }
        this.features[0].fg = ROT.Color.toHex([c[0],n,c[2]]);
      } else if (this.cursor===3) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[2];
        n+=16;
        if (n>=256) {
          n-=256;
        }
        this.features[0].fg = ROT.Color.toHex([c[0],c[1],n]);
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    lessCommand: function() {
      if (this.cursor===0) {
        let code = this.features[0].symbol.charCodeAt();
        code-=16;
        if (code<0) {
          code+=0xFFFF;
        }
        this.features[0].symbol = String.fromCharCode(code);
      } else if (this.cursor===1) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[0];
        n-=16;
        if (n<0) {
          n+=256;
        }
        this.features[0].fg = ROT.Color.toHex([n,c[1],c[2]]);
      } else if (this.cursor===2) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[1];
        n-=16;
        if (n<0) {
          n+=256;
        }
        this.features[0].fg = ROT.Color.toHex([c[0],n,c[2]]);
      } else if (this.cursor===3) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[2];
        n-=16;
        if (n<0) {
          n+=256;
        }
        this.features[0].fg = ROT.Color.toHex([c[0],c[1],n]);
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    rightCommand: function() {
      if (this.cursor===0) {
        let code = this.features[0].symbol.charCodeAt();
        code+=1;
        if (code>0xFFFF) {
          code-=0xFFFF;
        }
        this.features[0].symbol = String.fromCharCode(code);
      } else if (this.cursor===1) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[0];
        n+=1;
        if (n>=256) {
          n-=256;
        }
        this.features[0].fg = ROT.Color.toHex([n,c[1],c[2]]);
      } else if (this.cursor===2) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[1];
        n+=1;
        if (n>=256) {
          n-=256;
        }
        this.features[0].fg = ROT.Color.toHex([c[0],n,c[2]]);
      } else if (this.cursor===3) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[2];
        n+=1;
        if (n>=256) {
          n-=256;
        }
        this.features[0].fg = ROT.Color.toHex([c[0],c[1],n]);
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    leftCommand: function() {
      if (this.cursor===0) {
        let code = this.features[0].symbol.charCodeAt();
        code-=1;
        if (code<0) {
          code+=0xFFFF;
        }
        this.features[0].symbol = String.fromCharCode(code);
      } else if (this.cursor===1) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[0];
        n-=1;
        if (n<0) {
          n+=256;
        }
        this.features[0].fg = ROT.Color.toHex([n,c[1],c[2]]);
      } else if (this.cursor===2) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[1];
        n-=1;
        if (n<0) {
          n+=256;
        }
        this.features[0].fg = ROT.Color.toHex([c[0],n,c[2]]);
      } else if (this.cursor===3) {
        let c = ROT.Color.fromString(this.features[0].fg);
        let n = c[2];
        n-=1;
        if (n<0) {
          n+=256;
        }
        this.features[0].fg = ROT.Color.toHex([c[0],c[1],n]);
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    detailsText: function() {
      let txt = [
        "Esc: Done.",
        "%c{yellow}Structure: "+this.name.substr(0,1).toUpperCase()+this.name.substr(1)+" at "+this.x +", "+this.y+", "+this.z+".",
        "Up/Down: Choose property.",
        "Left/Right: Up or down by 1.",
        "[/]: Up or down by 16.",
        "Backspace/Delete: Enter value using prompt.",
        "Tab: Next structure.",
        " ",
        "Properties:"
      ];
      if (this.cursor===-1) {
        this.cursor = 0;
      }
      let opts = [
        ["  Unicode",this.features[0].symbol.charCodeAt().toString(16).toUpperCase()],
        ["  Red (0-255)",ROT.Color.fromString(this.features[0].fg)[0]],
        ["  Green (0-255)",ROT.Color.fromString(this.features[0].fg)[1]],
        ["  Blue (0-255)",ROT.Color.fromString(this.features[0].fg)[2]]
      ];
      opts[this.cursor][0] = ">"+opts[this.cursor][0].substr(1);
      for (let i=0; i<opts.length; i++) {
        txt.push(opts[i][0] + ": " + opts[i][1]);
      }
      return txt;
    }
  });

  HTomb.Things.defineStructure({
    template: "Mortuary",
    name: "mortuary",
    symbols: ["\u2744","\u2637","\u2744","\u2637","\u2744","\u2637","\u2744","\u2637","\u2744"],
    fgs: ["#AAAAFF","#999999","#AAAAFF","#999999","#AAAAFF","#999999","#AAAAFF","#999999","#AAAAFF"]
  });

  HTomb.Things.defineStructure({
    template: "BoneCarvery",
    name: "bone carvery",
    symbols: ["\u2692","\u2620","\u2692","\u2620","\u2699","\u2620","\u2692","\u2620","\u2692"],
    fgs: ["#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB"]
  });

  HTomb.Things.defineStructure({
    template: "Library",
    name: "library",
    symbols: ["\u270D","\u270E","\u2710","/","\u25AD","\u26B4/","\u2261","/","\u2261"],
    fgs: ["#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922"]
  });

  HTomb.Things.defineStructure({
    template: "Laboratory",
    name: "library",
    symbols: ["\u2609","\u263F","\u2640","\u263D","\u2641","\u2697","\u2642","\u2643","\u26A9"],
    fgs: ["#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922","#BB9922"]
  });


  HTomb.Things.defineTask({
    template: "ProduceTask",
    name: "produce",
    bg: "#336699",
    workshop: null,
    makes: null,
    steps: 10,
    started: false,
    validTile: function(x,y,z) {
      return true;
    },
    workBegun: function() {
      return this.started;
    },
    beginWork: function() {
      let test = this.assignee.inventory.items.takeItems(this.ingredients);
      this.started = true;
    },
    work: function(x,y,z) {
      if (this.workBegun()!==true) {
        this.beginWork();
      }
      this.steps-=1;
      this.assignee.ai.acted = true;
      if (this.steps<=0) {
        this.completeWork();
      }
    },
    completeWork: function() {
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      HTomb.Things[this.makes]().place(x,y,z);
      this.workshop.occupied = null;
      HTomb.GUI.pushMessage(this.assignee.describe({capitalized: true, article: "indefinite"}) + " finishes making " + HTomb.Things.templates[this.makes].describe({article: "indefinite"}));
      this.entity.despawn();
    },
    onDespawn: function() {
      HTomb.Things.templates.Task.onDespawn.call(this);
      this.workshop.task = null;
      this.workshop.nextGood();
    }
  });

  HTomb.Things.defineTask({
    template: "ConstructTask",
    name: "construct",
    bg: "#553300",
    makes: null,
    //workshops: ["Mortuary","BoneCarvery","Carpenter"],
    structures: ["Carpenter","Farm","Warehouse","Monument"],
    designate: function(assigner) {
      var arr = [];
      for (var i=0; i<this.structures.length; i++) {
        //should be pushing the entity, not the structure?
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
          } else if (f && (f.template!=="IncompleteFeature" || f.feature.makes!==structure.template+"Feature")) {
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
            let task = this.designateTile(crd[0],crd[1],crd[2],assigner);
            if (task) {
              task.task.structure = w;
              task.task.makes = structure.template+"Feature";
              task.task.ingredients = HTomb.Utils.clone(w.structure.ingredients);
              task.task.position = i;
            }
          }
        }
        return function() {
          HTomb.GUI.selectBox(structure.width, structure.height, assigner.z,that.designateBox,{
            assigner: assigner,
            context: that,
            callback: placeBox
          });
        };
      });
    },
    beginWork: function() {
      HTomb.Things.templates.Task.beginWork.call(this);
      let i = this.position;
      let f = HTomb.World.features[coord(this.entity.x, this.entity.y, this.entity.z)];
      f.fg = this.structure.structure.fgs[i];
      f.makes.fg = this.structure.structure.fgs[i];
      f.makes.symbol = this.structure.structure.symbols[i];
    },
    completeWork: function() {
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      let f = HTomb.World.features[coord(x,y,z)];
      f.structure = this.structure;
      this.structure.structure.features[this.position] = f;
      for (let i=0; i<this.structure.structure.height*this.structure.structure.width; i++) {
        if (!this.structure.structure.features[i]) {
          break;
        }
        if (i===this.structure.structure.height*this.structure.structure.width-1) {
          let w = this.structure;
          w.place(w.structure.x, w.structure.y, w.structure.z);
        }
      }
      HTomb.Things.templates.Task.completeWork.call(this);
    },
    designateBox: function(squares, options) {
      options = options || {};
      var assigner = options.assigner;
      var callb = options.callback;
      callb.call(options.context,squares,assigner);
    },
    work: function(x,y,z) {
      HTomb.Things.templates.Task.work.call(this,x,y,z);
      let f = HTomb.World.features[HTomb.Utils.coord(x,y,z)];
      if (f && this.zone && f.makes===this.structure.template+"Feature") {
        f.fg = this.structure.structure.fgs[this.zone.position];
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
