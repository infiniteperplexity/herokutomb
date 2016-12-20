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
      HTomb.Things.defineFeature({template: args.template+"Feature", name: args.name});
    },
    onCreate: function() {
      this.features = [];
      this.options = HTomb.Utils.copy(this.options);
      return this;
    },
    onPlace: function() {
      this.owner.master.structures.push(this.entity);
      if (this.entity.structureTurnBegin) {
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
    showHeaderText: function() {
      if (this.entity.getHeaderText) {
        return this.entity.getHeaderText();
      } else {
        return "%c{yellow}Structure: "+this.entity.name.substr(0,1).toUpperCase()+this.entity.name.substr(1)+" at "+this.entity.x +", "+this.entity.y+", "+this.entity.z+".";
      }
    },
    onTurnBegin: function() {
      if (this.entity.structureTurnBegin) {
        this.entity.structureTurnBegin();
      }
    },
    showDetailsText: function() {
      if (this.entity.getDetailsText) {
        return this.entity.getDetailsText();
      } else {
        let txt = this.showCommandsText();
        txt.concat(this.showOptions());
        return txt;
      }
    },
    showCommandsText: function() {
      if (this.entity.getCommandsText) {
        return this.entity.getCommandsText();
      } else {
        let txt = [
          "Esc: Done.",
          this.showHeaderText(),
          "a-z: Toggle option.",
          "Tab: Next structure.",
          " "
        ];
        txt = txt.concat(this.showOptions());
        return txt;
      }
    },
    fireUpdateOptions: function() {
      if (this.entity.updateOptions) {
        this.entity.updateOptions();
      }
    },
    showOptionsHeading: function() {
      if (this.entity.getOptionsHeading) {
        return this.entity.getOptionsHeading();
      }
    },
    showNoOptions: function() {
      if (this.entity.getNoOptions) {
        return this.entity.getNoOptions();
      } else {
        return "(No options.)";
      }
    },
    showOptions: function() {
      this.fireUpdateOptions();
      if (this.options.length===0) {
        return this.showNoOptions();
      }
      if (this.entity.getOptions) {
        return this.entity.getOptions();
      } else {
        let txt = [this.showOptionsHeading()];
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
      }
    },
    fireChoiceCommand: function(i) {
      if (this.entity.structureChoice) {
        this.entity.structureChoice(i);
      } else if (i < this.options.length) {
        this.options[i].selected = !this.options[i].selected;
      }
    },
    fireUpCommand: function() {
      if (this.entity.structureUp) {
        this.entity.structureUp();
      } else {

      }
    },
    fireDownCommand: function() {
      if (this.entity.structureDown) {
        this.entity.structureDown();
      } else {

      }
    },
    fireLeftCommand: function() {
      if (this.entity.structureLeft) {
        this.entity.structureLeft();
      } else {

      }
    },
    fireRightCommand: function() {
      if (this.entity.structureRight) {
        this.entity.structureRight();
      } else {

      }
    },
    fireMoreCommand: function() {
      if (this.entity.structureMore) {
        this.entity.structureMore();
      } else {

      }
    },
    fireLessCommand: function() {
      if (this.entity.structureLess) {
        this.entity.structureLess();
      } else {

      }
    },
    fireCancelCommand: function() {
      if (this.entity.structureCancel) {
        this.entity.structureCancel();
      } else {

      }
    }
  });
  HTomb.Things.defineByProxy("Structure","Entity");

  HTomb.Things.defineStructure({
    template: "Workshop",
    makes: [],
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
    structureChoice: function(i) {
      if (this.makes.length<=i) {
        return;
      }
      this.queue.splice(this.structure.cursor+1,0,[this.makes[i],"finite",1]);
      if (this.task===null) {
        this.nextGood();
      }
      if (this.structure.cursor<this.queue.length-1) {
        this.structure.cursor+=1;
      }
    },
    structureUp: function() {
      this.structure.cursor-=1;
      if (this.structure.cursor<-1) {
        this.structure.cursor = this.queue.length-1;
      }
    },
    structureDown: function() {
      this.structure.cursor+=1;
      if (this.structure.cursor>this.queue.length-1) {
        this.structure.cursor = -1;
      }
    },
    structureRight: function() {
      let i = this.structure.cursor;
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
    structureLeft: function() {
      let i = this.structure.cursor;
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
    structureMore: function() {
      let i = this.structure.cursor;
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
    structureLess: function() {
      let i = this.structure.cursor;
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
    structureCancel: function() {
      if (this.structure.cursor===-1) {
        if (this.task) {
          this.task.cancel();
        }
      } else if (this.queue.length>0 && this.structure.cursor>=0) {
        this.queue.splice(this.structure.cursor,1);
      }
      if (this.structure.cursor>=this.queue.length) {
        this.structure.cursor = this.queue.length-1;
      }
    },
    nextGood: function() {
      if (this.queue.length===0) {
        return;
      } else if (HTomb.World.zones[HTomb.Utils.coord(this.x,this.y,this.z)]) {
        HTomb.GUI.pushMessage("Workshop tried to create new task but there was already a zone.");
        return;
      }
      let zone = HTomb.Things.templates.ProduceTask.placeZone(this.x,this.y,this.z,this.structure.owner);
      this.task = zone.task;
      zone.task.makes = this.queue[0][0];
      zone.task.workshop = this;
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
    getDetailsText: function() {
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
      if (this.queue.length>0 && this.structure.cursor>-1) {
        let s = txt[this.structure.cursor+1+startQueue];
        s = ">" + s.substr(1);
        txt[this.structure.cursor+1+startQueue] = s;
      } else {
        let s = txt[startQueue];
        s = ">" + s.substr(1);
        txt[startQueue] = s;
      }
      return txt;
    }
  });
  HTomb.Things.defineWorkshop = function(opts) {
    opts.parent = "Workshop";
    return HTomb.Things.defineStructure(opts);
  };

  HTomb.Things.defineStructure({
    template: "Farm",
    name: "farm",
    symbols: ["=","=","=","=","=","=","=","=","="],
    fgs: ["#779922","#779922","#779922","#779922","#779922","#779922","#779922","#779922","#779922"],
    onDefine: function() {
      let f = HTomb.Things.templates.FarmFeature;
      f.work = function() {};
      f.finish = function() {};
    },
    onPlace: function() {
      let crops = HTomb.Types.templates.Crop.types;
      for (let i=0; i<crops.length; i++) {
        this.structure.options.push({
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
    getOptionsHeading: function() {
      return "Crops permitted:";
    },
    getNoOptions: function() {
      return "(No crops defined?)";
    },
    updateOptions: function() {
      let allSeeds = this.allSeeds();
      for (let i=0; i<this.structure.options.length; i++) {
        let opt = this.structure.options[i];
        if (allSeeds.indexOf(opt.text)===-1) {
          opt.active = false;
        } else {
          opt.active = true;
        }
      }
    },
    structureTurnBegin: function() {
      if (this.allSeeds().length===0) {
        return;
      }
      for (let i=0; i<this.structure.features.length; i++) {
        let f = this.structure.features[i];
        let z = HTomb.World.zones[coord(f.x,f.y,f.z)];
        if (z && z.template==="FarmTask" && z.task.makes /*this will eventually be a check of what crop*/) {
          continue;
        } else {
          let seeds = this.allSeeds();
          HTomb.Utils.shuffle(seeds);
          HTomb.Things.templates.FarmTask.makes = seeds[0];
          z = HTomb.Things.templates.FarmTask.placeZone(f.x,f.y,f.z,this.structure.owner);
          console.log(z);
        }
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

  //HTomb.Types.defineType({
  //  template: "ItemTag",
  //  name: "itemtag",
  //  filter: function() {
  //    o
  //  }
  //});
  HTomb.Things.defineStructure({
    template: "Storeroom",
    name: "storeroom",
    symbols: ["\u2554","\u2550","\u2557","\u2551","=","\u2551","\u255A","\u2550","\u255D"],
    fgs: ["#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB","#BBBBBB"],
    options: [
      {text: "Minerals", selected: false, active: false},
      {text: "Wood", selected: false, active: false},
      {text: "Seeds", selected: false, active: false},
      {text: "Herbs", selected: false, active: false}
    ],
    getOptionsHeading: function() {
      return "Store items:";
    },
    structureTurnBegin: function() {
      for (let i=0; i<this.structure.features.length; i++) {
        let f = this.structure.features[i];
        let z = HTomb.World.zones[coord(f.x,f.y,f.z)];
        if (z===undefined) {
          z = HTomb.Things.templates.HoardTask.placeZone(f.x,f.y,f.z,this.structure.owner);
        }
      }
    }
  });

  HTomb.Things.defineStructure({
    template: "Monument",
    name: "monument",
    symbols: ["@"],
    fgs: ["gray"],
    height: 1,
    width: 1,
    structureCancel: function() {
      console.log("testing");
      if (this.structure.cursor===0) {
        let code = prompt("Enter a unicode value.",this.structure.features[0].symbol.charCodeAt());
        code = code.substr(0,4).toUpperCase();
        let pat = /[A-F0-9]{1,4}/;
        let match = pat.exec(code);
        if (match===null) {
          alert("Invalid Unicode value.");
        } else {
          this.structure.features[0].symbol = String.fromCharCode(parseInt(code,16));
        }
      } else if (this.structure.cursor===1) {
        let code = prompt("Enter an 16-bit hex value for red.",ROT.Color.fromString(this.structure.features[0].fg)[0]);
        code = code.toUpperCase();
        let pat = /[A-F0-9]{1,2}/;
        let match = pat.exec(code);
        if (match===null) {
          alert("Invalid 16-bit hex value.");
        } else {
          let fg = this.structure.features[0].fg;
          this.structure.features[0].fg = "#" + code + fg.substr(3,4);
        }
      } else if (this.structure.cursor===2) {
        let code = prompt("Enter an 16-bit hex value for green.",ROT.Color.fromString(this.structure.features[0].fg)[1]);
        code = code.toUpperCase();
        let pat = /[A-F0-9]{1,2}/;
        let match = pat.exec(code);
        if (match===null) {
          alert("Invalid 16-bit hex value.");
        } else {
          let fg = this.structure.features[0].fg;
          this.structure.features[0].fg = "#" + fg.substr(1,2) + code + fg.substr(5,2);
        }
      } else if (this.structure.cursor===3) {
        let code = prompt("Enter an 16-bit hex value for blue.",ROT.Color.fromString(this.structure.features[0].fg)[2]);
        code = code.toUpperCase();
        let pat = /[A-F0-9]{1,2}/;
        let match = pat.exec(code);
        if (match===null) {
          alert("Invalid 16-bit hex value.");
        } else {
          let fg = this.structure.features[0].fg;
          this.structure.features[0].fg = "#" + fg.substr(3,4) + code;
        }
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    structureUp: function() {
      this.structure.cursor-=1;
      if (this.structure.cursor<0) {
        this.structure.cursor = 3;
      }
    },
    structureDown: function() {
      this.structure.cursor+=1;
      if (this.structure.cursor>=4) {
        this.structure.cursor = 0;
      }
    },
    structureMore: function() {
      if (this.structure.cursor===0) {
        let code = this.structure.features[0].symbol.charCodeAt();
        code+=16;
        if (code>0xFFFF) {
          code-=0xFFFF;
        }
        this.structure.features[0].symbol = String.fromCharCode(code);
      } else if (this.structure.cursor===1) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[0];
        n+=16;
        if (n>=256) {
          n-=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([n,c[1],c[2]]);
      } else if (this.structure.cursor===2) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[1];
        n+=16;
        if (n>=256) {
          n-=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([c[0],n,c[2]]);
      } else if (this.structure.cursor===3) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[2];
        n+=16;
        if (n>=256) {
          n-=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([c[0],c[1],n]);
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    structureLess: function() {
      if (this.structure.cursor===0) {
        let code = this.structure.features[0].symbol.charCodeAt();
        code-=16;
        if (code<0) {
          code+=0xFFFF;
        }
        this.structure.features[0].symbol = String.fromCharCode(code);
      } else if (this.structure.cursor===1) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[0];
        n-=16;
        if (n<0) {
          n+=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([n,c[1],c[2]]);
      } else if (this.structure.cursor===2) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[1];
        n-=16;
        if (n<0) {
          n+=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([c[0],n,c[2]]);
      } else if (this.structure.cursor===3) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[2];
        n-=16;
        if (n<0) {
          n+=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([c[0],c[1],n]);
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    structureRight: function() {
      if (this.structure.cursor===0) {
        let code = this.structure.features[0].symbol.charCodeAt();
        code+=1;
        if (code>0xFFFF) {
          code-=0xFFFF;
        }
        this.structure.features[0].symbol = String.fromCharCode(code);
      } else if (this.structure.cursor===1) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[0];
        n+=1;
        if (n>=256) {
          n-=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([n,c[1],c[2]]);
      } else if (this.structure.cursor===2) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[1];
        n+=1;
        if (n>=256) {
          n-=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([c[0],n,c[2]]);
      } else if (this.structure.cursor===3) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[2];
        n+=1;
        if (n>=256) {
          n-=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([c[0],c[1],n]);
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    structureLeft: function() {
      if (this.structure.cursor===0) {
        let code = this.structure.features[0].symbol.charCodeAt();
        code-=1;
        if (code<0) {
          code+=0xFFFF;
        }
        this.structure.features[0].symbol = String.fromCharCode(code);
      } else if (this.structure.cursor===1) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[0];
        n-=1;
        if (n<0) {
          n+=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([n,c[1],c[2]]);
      } else if (this.structure.cursor===2) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[1];
        n-=1;
        if (n<0) {
          n+=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([c[0],n,c[2]]);
      } else if (this.structure.cursor===3) {
        let c = ROT.Color.fromString(this.structure.features[0].fg);
        let n = c[2];
        n-=1;
        if (n<0) {
          n+=256;
        }
        this.structure.features[0].fg = ROT.Color.toHex([c[0],c[1],n]);
      }
      HTomb.GUI.Panels.gameScreen.redraw(this.x, this.y);
    },
    getDetailsText: function() {
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
      if (this.structure.cursor===-1) {
        this.structure.cursor = 0;
      }
      let opts = [
        ["  Unicode",this.structure.features[0].symbol.charCodeAt().toString(16).toUpperCase()],
        ["  Red (0-255)",ROT.Color.fromString(this.structure.features[0].fg)[0]],
        ["  Green (0-255)",ROT.Color.fromString(this.structure.features[0].fg)[1]],
        ["  Blue (0-255)",ROT.Color.fromString(this.structure.features[0].fg)[2]]
      ];
      opts[this.structure.cursor][0] = ">"+opts[this.structure.cursor][0].substr(1);
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
      this.workshop.task = null;
      this.workshop.nextGood();
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
    structures: ["Carpenter","Farm","Storeroom","Monument"],
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
