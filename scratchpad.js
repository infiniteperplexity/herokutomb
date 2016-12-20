HTomb.Types.defineRoutine({
  template: "ServeMaster",
  name: "serve master",
  act: function(ai) {
    if (ai.entity.minion===undefined) {
      return;
    }
    ///*******Newly added code here!

    if (ai.entity.worker && ai.entity.worker.task) {
      ai.entity.worker.task.ai();
    } else {
      // Otherwise, patrol around the creature's master
      // or maybe check for tasks now?
      ai.patrol(ai.entity.minion.master.x,ai.entity.minion.master.y,ai.entity.minion.master.z);
    }
  }
});

HTomb.Types.defineRoutine({
  template: "ShoppingList",
  name: "shopping list",
  act: function(ai, args) {
    var cr = ai.entity;
    var task = cr.worker.task;
    var ingredients = args || task.ingredients;
    // if no ingredients are required, skip the rest
    if (Object.keys(ingredients).length===0) {
      return false;
    }
    var x = task.zone.x;
    var y = task.zone.y;
    var z = task.zone.z;
    var f = HTomb.World.features[coord(x,y,z)];
    // no need for ingredients if construction has begun
    if (f && f.template===task.makes) {
      return false;
    }
    // check to see if we are already targeting an ingredient
    var t = cr.ai.target;
    // if the target is not an ingredient
    if (t && ingredients[t.template]===undefined) {
      cr.ai.target = null;
    }
    t = cr.ai.target;
    var needy = false;
    // cycle through ingredients to see if we have enough
    if (t===null) {
      for (var ing in ingredients) {
        var n = ingredients[ing];
        // if we lack what we need, search for items
        if (cr.inventory.items.countAll(ing)<n) {
          needy = true;
          var items = HTomb.Utils.findItems(function(v,k,i) {
            if (v.item.owned!==true) {
              return false;
            } else if (v.template===ing) {
              return true;
            }
          });
          // if we find an item we need, target it
          if (items.length>0) {
            items = HTomb.Path.closest(cr,items);
            cr.ai.target = items[0];
            break;
          }
        }
      }
    }
    t = cr.ai.target;
    // we have everything we need so skip the rest
    if (needy===false && t===null) {
      return false;
    // failed to find what we needed
    } else if (needy===true && t===null) {
      console.log("unassigned by failure to find...");
      cr.worker.task.unassign();
      cr.ai.walkRandom();
    } else if (t!==null) {
      if (t.x===cr.x && t.y===cr.y && t.z===cr.z) {
        // Does pickupSome work properly?
        cr.inventory.pickupSome(t.template,ingredients[t.template]);
        cr.ai.acted = true;
        cr.ai.target = null;
      } else {
        if (t.z===null) {
          console.log("why did this shopping list fail?");
        }
        cr.ai.walkToward(t.x,t.y,t.z);
      }
    }
  }
});

HTomb.Types.defineRoutine({
  template: "GoToWork",
  name: "go to work",
  act: function(ai, options) {
    options = options || {};
    let useLast = options.useLast || false;
    var cr = ai.entity;
    var task = cr.worker.task;
    if (cr.movement) {
      var zone = task.zone;
      var x = zone.x;
      var y = zone.y;
      var z = zone.z;
      if (z===null) {
        console.log("why go to work fail?");
      }
      var dist = HTomb.Path.distance(cr.x,cr.y,x,y);
      if (useLast===true && x===cr.x && y===cr.y && z===cr.z) {
        task.work(x,y,z);
      } else if (useLast!==true && HTomb.Tiles.isTouchableFrom(x,y,z,cr.x,cr.y,cr.z)) {
        task.work(x,y,z);
      } else if (dist>0 || cr.z!==z) {
        cr.ai.walkToward(x,y,z);
      } else if (dist===0) {
        cr.ai.walkRandom();
      } else {
        task.unassign();
        cr.ai.walkRandom();
      }
    }
  }
});



HTomb.Things.define({
  template: "Task",
  name: "task",
  parent: "Thing",
  assigner: null,
  assignee: null,
  zone: null,
  zoneTemplate: null,
  makes: null,
  target: null,
  active: true,
  ingredients: {},
  // note that this passes the behavior, not the entity
  canReachZone: function(cr) {
    var x = this.zone.x;
    var y = this.zone.y;
    var z = this.zone.z;
    var path = HTomb.Path.aStar(x,y,z,cr.x,cr.y,cr.z,{useLast: false});
    if (path!==false) {
      return true;
    } else if (z===cr.z && HTomb.Path.distance(cr.x,cr.y,x,y)<=1) {
      return true;
      // does touchability work consistently?
    } else if (HTomb.Tiles.isTouchableFrom(x,y,z,cr.x,cr.y,cr.z)) {
      return true;
    } else {
      return false;
    }
  },
  designate: function(assigner) {
    HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
      context: this,
      assigner: assigner,
      callback: this.placeZone,
      outline: false,
      bg: this.zoneTemplate.bg
    });
  },
  designateSquare: function(x,y,z, options) {
    options = options || {};
    var assigner = options.assigner;
    var callb = options.callback;
    callb.call(options.context,x,y,z,assigner);
  },
  designateSquares: function(squares, options) {
    options = options || {};
    var assigner = options.assigner;
    var callb = options.callback;
    for (var i=0; i<squares.length; i++) {
      var crd = squares[i];
      callb.call(options.context,crd[0],crd[1],crd[2],assigner);
    }
  },
  // designateBox: function(squares, options) {
  //   options = options || {};
  //   var assigner = options.assigner;
  //   var callb = options.callback;
  //   var crd = squares[0];
  //   callb.call(options.context,crd[0],crd[1],crd[2],assigner);
  // },
  placeZone: function(x,y,z,assigner) {
    var zone, t;
    if (this.canDesignateTile(x,y,z)) {
      zone = HTomb.Things[this.zoneTemplate.template]();
      zone.place(x,y,z);
      t = HTomb.Things[this.template]();
      zone.task = t;
      zone.assigner = assigner;
      t.zone = zone;
      t.assigner = assigner;
      if (assigner.master) {
        assigner.master.taskList.push(t);
      }
    }
    return zone;
  },
  onCreate: function() {
    HTomb.Events.subscribe(this,"Destroy");
    return this;
  },
  onDefine: function() {
    if (this.zoneTemplate) {
      HTomb.Things.defineZone(this.zoneTemplate);
    }
  },
  /////*******newly revised code!

  canDesignateTile: function(x,y,z) {
    return true;
  },
  assignTo: function(cr) {
    if (cr.minion===undefined) {
      HTomb.Debug.pushMessage("Problem assigning task");
    } else {
      this.assignee = cr;
      cr.worker.onAssign(this);
    }
  },
  onDestroy: function(event) {
    var cr = event.entity;
    if (cr===this.assignee) {
      this.unassign();
    } else if (cr===this.assigner) {
      this.cancel();
    }
  },
  unassign: function() {
    var cr = this.assignee;
    if (cr.worker===undefined) {
      HTomb.Debug.pushMessage("Problem unassigning task");
    } else {
      this.assignee = null;
      cr.worker.unassign();
    }
  },
  cancel: function() {
    var master = this.assigner;
    if (master) {
      var taskList = this.assigner.master.taskList;
      if (taskList.indexOf(this)!==-1) {
        taskList.splice(taskList.indexOf(this),1);
      }
    }
    if (this.assignee) {
      this.assignee.worker.unassign();
    }
    if (this.zone) {
      //prevent recursion traps
      let zone = this.zone;
      this.zone = null;
      zone.task = null;
      zone.remove();
      zone.despawn();
    }
    this.despawn();
  },
  complete: function() {
    // this generally should not get overridden
    var master = this.assigner;
    if (master) {
      var taskList = this.assigner.master.taskList;
      if (taskList.indexOf(this)!==-1) {
        taskList.splice(taskList.indexOf(this),1);
      }
    }
    if (this.assignee) {
      this.assignee.worker.unassign();
    }
    if (this.onComplete) {
      this.onComplete();
    }
    if (this.zone) {
      let zone = this.zone;
      this.zone = null;
      zone.task = null;
      zone.remove();
      zone.despawn();
    }
    this.despawn();
  },
  ai: function() {
    if (this.assignee.ai.acted===true) {
      return;
    }
    var x = this.zone.x;
    var y = this.zone.y;
    var z = this.zone.z;
    var f = HTomb.World.features[coord(x,y,z)];
    var cr = this.assignee ;
    // if there is no features, or the feature on the zone isn't the one this task makes, and some ingredients are required
    if ((f===undefined || f.makes!==this.makes) && this.ingredients!==null) {
      // run the "shopping list" routine
      HTomb.Routines.ShoppingList.act(cr.ai);
    }
    if (cr.ai.acted===true) {
      return;
    }
    // otherwise try to do work
    HTomb.Routines.GoToWork.act(cr.ai);
  },
  spend: function() {
    var items = [];
    if (this.assignee.inventory.hasAll(this.ingredients)) {
      for (var ingredient in this.ingredients) {
        var n = this.ingredients[ingredient];
        //remove n ingredients from the entity's inventory
        this.assignee.inventory.items.take(ingredient,n);
      }
      return true;
    } else {
      return false;
    }
  },
  work: function(x,y,z) {
    var f = HTomb.World.features[coord(x,y,z)];
    if (f===undefined) {
      // begin construction
      if (this.spend()===true) {
        f = HTomb.Things.IncompleteFeature();
        f.makes = this.makes;
        f.task = this;
        f.place(x,y,z);
        this.target = f;
        this.assignee.ai.acted = true;
      } else {
        return false;
      }
    } else if (f.makes===this.makes) {
      this.target = f;
      f.task = this;
      f.work();
      this.assignee.ai.acted = true;
    } else if (f.owned!==true) {
      f.feature.dismantle();
      this.assignee.ai.acted = true;
    }
  }
});

HTomb.Things.defineTask({
  template: "FarmTask",
  name: "farm",
  zoneTemplate: {
    template: "FarmZone",
    name: "farm",
    bg: "#008800"
  },
  makes: null,
  canDesignateTile: function(x,y,z) {
    var f = HTomb.World.features[coord(x,y,z)];
    // if (f && f.template!==this.assignedCrop+"Plant") {
    if (f) {
      return false;
    }
    if (HTomb.World.covers[z][x][y].liquid) {
      return false;
    }
    var t = HTomb.World.tiles[z][x][y];
    if (t===HTomb.Tiles.FloorTile) {
      return true;
    } else {
      return false;
    }
  },
  placeZone: function(x,y,z,assigner) {
    var zone, t;
    if (this.canDesignateTile(x,y,z)) {
      zone = HTomb.Things[this.zoneTemplate.template]();
      zone.place(x,y,z);
      t = HTomb.Things[this.template]();
      t.makes = this.makes;
      zone.task = t;
      var base = HTomb.Things.templates[this.makes].base;
      t.ingredents = {};
      t.ingredients[base+"Seed"] = 1;
      zone.assigner = assigner;
      t.zone = zone;
      t.assigner = assigner;
      if (assigner.master) {
        assigner.master.taskList.push(t);
      }
    },
    work: function(x,y,z) {
      var f = HTomb.World.features[coord(x,y,z)];
      if (f && f.template==="FarmFeature") {
        if (this.spend()===true) {
          if (!f.crop || f.crop.template!==this.makes) {
            f.crop = HTomb.Things.templates[this.makes]();
          }
          f.task = this;
          this.target = f;
          this.assignee.ai.acted = true;
          f.work();
        } else {
          return false;
        }
      }
    }
  });
    return zone;
  }
});

let FarmFeature = HTomb.Things.templates.FarmFeature;
FarmFeature.finish: function() {
  this.task.complete();
}
FarmFeature.work: function() {
  if (this.integrity===null || this.integrity===undefined) {
    this.integrity = -5;
  }
  this.integrity+=1;
  if (this.integrity>=0) {
    this.finish();
  }
},

HTomb.Things.defineFeature({
  template: "IncompleteFeature",
  name: "incomplete feature",
  symbol: "\u25AB",
  fg: "#BB9922",
  makes: null,
  task: null,
  onPlace: function() {
    var makes = HTomb.Things.templates[this.makes];
    this.symbol = makes.incompleteSymbol || this.symbol;
    this.fg = makes.incompleteFg || makes.fg || this.fg;
    this.name = "incomplete "+makes.name;
  },
  work: function() {
    if (this.integrity===null || this.integrity===undefined) {
      this.integrity = -5;
    }
    this.integrity+=1;
    if (this.integrity>=0) {
      this.finish();
    }
  },
  finish: function() {
    var x = this.x;
    var y = this.y;
    var z = this.z;
    this.despawn();
    var f = HTomb.Things[this.makes]();
    f.place(x,y,z);
    this.task.complete();
  }
});

HTomb.Things.defineTask({
  template: "HoardTask",
  name: "hoard",
  zoneTemplate: {
    template: "HoardZone",
    name: "hoard",
    bg: "#666600"
  },
  designate: function(assigner) {
    function myHover() {
      HTomb.GUI.Panels.menu.middle = ["%c{lime}Have minions move items to this square."];
    }
    HTomb.GUI.selectSquare(assigner.z,this.designateSquare,{
      assigner: assigner,
      context: this,
      callback: this.placeZone,
      hover: myHover
    });
  },
  canDesignateTile: function(x,y,z) {
    if (HTomb.World.tiles[z][x][y]===HTomb.Tiles.FloorTile) {
      return true;
    } else {
      return false;
    }
  },
  ai: function() {
    var cr = this.assignee;
    var t = cr.ai.target;
    if (cr.movement) {
      var zone = this.zone;
      var x = zone.x;
      var y = zone.y;
      var z = zone.z;
      var path = HTomb.Path.aStar(cr.x,cr.y,cr.z,x,y,z);
      if (path===false) {
        this.unassign();
        cr.ai.walkRandom();
      } else {
        if (cr.inventory.items.length>0) {
          if (cr.x===x && cr.y===y && cr.z===z) {
            cr.inventory.drop(cr.inventory.items[0]);
          } else {
            cr.ai.walkToward(x,y,z);
          }
        } else {
            //search for items...should shuffle them first or something
            outerLoop:
            for (var it in HTomb.World.items) {
              var items = HTomb.World.items[it];
              var zone = HTomb.World.zones[it];
              // if it's already in a hoard, skip it
              if (zone && zone.template==="HoardZone") {
                continue;
              }
              // if it's not owned, skip it
              for (var i=0; i<items.length; i++) {
                var item = items[i];
                if (item.item.owned===true) {
                  cr.ai.target = item;
                  break outerLoop;
                }
              }
            }
            // should maybe use fetch with an option to avoid things in hoards?
            if (cr.ai.target===null) {
              this.unassign();
              cr.ai.walkRandom();
            } else if (cr.x===cr.ai.target.x && cr.y===cr.ai.target.y && cr.z===cr.ai.target.z) {
              cr.inventory.pickup(item);
              cr.ai.target = null;
            } else {
              cr.ai.walkToward(cr.ai.target.x,cr.ai.target.y,cr.ai.target.z);
            }
        }
      }
    }
    cr.ai.acted = true;
  }
});


HTomb.Things.defineFeature({
  template: "IncompleteFeature",
  name: "incomplete feature",
  symbol: "\u25AB",
  fg: "#BB9922",
  makes: null,
  task: null,
  onPlace: function() {
    var makes = HTomb.Things.templates[this.makes];
    this.symbol = makes.incompleteSymbol || this.symbol;
    this.fg = makes.incompleteFg || makes.fg || this.fg;
    this.name = "incomplete "+makes.name;
  },
  work: function() {
    if (this.integrity===null || this.integrity===undefined) {
      this.integrity = -5;
    }
    this.integrity+=1;
    if (this.integrity>=0) {
      this.finish();
    }
  },
  finish: function() {
    var x = this.x;
    var y = this.y;
    var z = this.z;
    // need to swap over the stack, if necessary...
    var f = HTomb.Things[this.makes]();
    f.place(x,y,z, {featureConflict: "swap"});
    this.task.complete();
  }
});

HTomb.Things.defineBehavior({
  template: "Feature",
  name: "feature",
  yields: null,
  integrity: null,
  stackedFeatures: null,
  incomplete: 0,
  dismantled: null,
  onDefine: function(args) {
    if (args.craftable===true) {
      let item = HTomb.Utils.copy(args);
      item.template = args.template+"Item";
      delete item.behaviors.Feature;
      HTomb.Things.defineItem(item);
      let template = HTomb.Things.templates[args.template];
      // overwrite the item's ingredients
      template.ingredients = {};
      template.ingredients[args.template+"Item"] = 1;
    }
  },
  work: function() {
    if (this.integrity===null || this.integrity===undefined) {
      this.integrity = -5;
    }
    this.integrity+=1;
    if (this.integrity>=0) {
      this.finish();
    }
  },
  onPlace: function(x,y,z,options) {
    options = options || {};
    let c = coord(x,y,z);
    let f = HTomb.World.features[c];
    if (f) {
      if (options.featureConflict==="stack") {
        if (this.stackedFeatures===null) {
          this.stackedFeatures = [f];
        } else {
          this.stackedFeatures.push(f);
        }
      } else if (options.featureConflict==="swap") {
        let stacked = f.feature.stackedFeatures;
        if (this.stackedFeatures===null) {
          this.stackedFeatures = stacked;
        } else if (stacked!==null) {
          this.stackedFeatures.concat(stacked);
        }
        console.log("hit this");
        f.feature.stackedFeatures = null;
        f.remove();
        f.despawn();
      } else if (options.featureConflict==="despawn") {
        f.remove();
        f.despawn();
      } else {
        throw new Error("unhandled feature conflict!");
      }
    }
    HTomb.World.features[c] = this.entity;
  },
  onRemove: function(options) {
    let c = coord(this.entity.x,this.entity.y,this.entity.z);
    if (HTomb.World.features[c]) {
      delete HTomb.World.features[c];
    }
    if (this.stackedFeatures) {
      HTomb.World.features[c] = this.stackedFeatures.shift();
      if (this.stackedFeatures.length>0) {
        HTomb.World.features[c].feature.stackedFeatures = this.stackedFeatures;
      }
      this.stackedFeatures = null;
    }
  },
  dismantle: function(optionalTask) {
    if (this.integrity===null) {
      this.integrity=5;
    }
    this.integrity-=1;
    if (this.integrity<=0) {
      this.harvest();
      if (optionalTask) {
        optionalTask.complete();
      }
    }
  },
  harvest: function() {
    if (this.yields!==null) {
      var x = this.entity.x;
      var y = this.entity.y;
      var z = this.entity.z;
      for (var template in this.yields) {
        var n = HTomb.Utils.diceUntil(2,2);
        if (this.yields[template].nozero) {
          n = Math.max(n,1);
        }
        for (var i=0; i<n; i++) {
          var thing = HTomb.Things[template]().place(x,y,z);
        }
      }
    }
    this.entity.destroy();
  }
});

HTomb.Things.defineFeature({
  template: "Excavation",
  name: "excavation",
  incompleteSymbol: "\u2717",
  incompleteFg: HTomb.Constants.BELOW,
  onPlace: function(x,y,z) {
    var tiles = HTomb.World.tiles;
    var EmptyTile = HTomb.Tiles.EmptyTile;
    var FloorTile = HTomb.Tiles.FloorTile;
    var WallTile = HTomb.Tiles.WallTile;
    var UpSlopeTile = HTomb.Tiles.UpSlopeTile;
    var DownSlopeTile = HTomb.Tiles.DownSlopeTile;
    var t = tiles[z][x][y];
    let items = HTomb.World.items[coord(x,y,z)] || [];
    // If there is a slope below, dig out the floor
    if (tiles[z-1][x][y]===UpSlopeTile && HTomb.World.explored[z-1][x][y] && (t===WallTile || t===FloorTile)) {
      tiles[z][x][y] = DownSlopeTile;
      for (let i=0; i<items.length; i++) {
        items[i].item.owned = true;
      }
    // If it's a wall, dig a tunnel
    } else if (t===WallTile) {
      tiles[z][x][y] = FloorTile;
      for (let i=0; i<items.length; i++) {
        items[i].item.owned = true;
      }
    } else if (t===FloorTile) {
      // If it's a floor with a wall underneath dig a trench
      if (tiles[z-1][x][y]===WallTile) {
        tiles[z][x][y] = DownSlopeTile;
        tiles[z-1][x][y] = UpSlopeTile;
      // Otherwise just remove the floor
      } else {
        tiles[z][x][y] = EmptyTile;
        for (let i=0; i<items.length; i++) {
          items[i].item.owned = true;
        }
      }
    // If it's a down slope tile, remove the slopes
    } else if (t===DownSlopeTile) {
      tiles[z][x][y] = EmptyTile;
      tiles[z-1][x][y] = FloorTile;
      items = HTomb.World.items[coord(x,y,z-1)] || [];
      for (let i=0; i<items.length; i++) {
        items[i].item.owned = true;
      }
    // if it's an upward slope, remove the slope
    } else if (t===UpSlopeTile) {
      tiles[z][x][y] = FloorTile;
      if (tiles[z+1][x][y]===DownSlopeTile) {
        tiles[z+1][x][y] = EmptyTile;
        for (let i=0; i<items.length; i++) {
          items[i].item.owned = true;
        }
      }
    } else if (t===EmptyTile) {
      tiles[z-1][x][y] = FloorTile;
      items = HTomb.World.items[coord(x,y,z-1)];
      for (let i=0; i<items.length; i++) {
        items[i].item.owned = true;
      }
    }
    HTomb.World.covers[z][x][y] = HTomb.Covers.NoCover;
    if (Math.random()<0.25) {
      var rock = HTomb.Things.Rock();
      rock.item.n = 1;
      if (tiles[z][x][y]===DownSlopeTile) {
        rock.place(x,y,z-1);
      } else {
        rock.place(x,y,z);
      }
    }
    HTomb.World.validate.cleanNeighbors(x,y,z);
    this.despawn();
  }
});


HTomb.Things.defineFeature({
  template: "Construction",
  name: "construction",
  incompleteSymbol: "\u2692",
  incompleteFg: HTomb.Constants.ABOVE,
  onPlace: function(x,y,z) {
    var tiles = HTomb.World.tiles;
    var EmptyTile = HTomb.Tiles.EmptyTile;
    var FloorTile = HTomb.Tiles.FloorTile;
    var WallTile = HTomb.Tiles.WallTile;
    var UpSlopeTile = HTomb.Tiles.UpSlopeTile;
    var DownSlopeTile = HTomb.Tiles.DownSlopeTile;
    var t = tiles[z][x][y];
    HTomb.World.covers[z][x][y] = HTomb.Covers.NoCover;
    // If it's a floor, build a slope
    if (t===FloorTile) {
      tiles[z][x][y] = UpSlopeTile;
      if (tiles[z+1][x][y]===EmptyTile) {
        tiles[z+1][x][y] = DownSlopeTile;
      }
    // If it's a slope, make it into a wall
  } else if (t===UpSlopeTile) {
      tiles[z][x][y] = WallTile;
      if (tiles[z+1][x][y] === DownSlopeTile) {
        tiles[z+1][x][y] = FloorTile;
      }
    // If it's empty, add a floor
    } else if (t===DownSlopeTile || t===EmptyTile) {
      tiles[z][x][y] = FloorTile;
    }
    HTomb.World.validate.cleanNeighbors(x,y,z);
    this.despawn();
  }
});
