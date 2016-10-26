HTomb = (function(HTomb) {
  "use strict";
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var coord = HTomb.Utils.coord;

  // should we maybe allow a queue of zones???  probably not
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
    tryAssign: function(cr) {
      if (this.canReachZone(cr)) {
        this.assignTo(cr);
        return true;
      } else {
        return false;
      }
    },
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
      if ((f===undefined || f.makes!==this.makes) && this.ingredients!==null) {
        HTomb.Routines.ShoppingList.act(cr.ai);
      }
      if (cr.ai.acted===true) {
        return;
      }
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
    template: "DigTask",
    name: "dig",
    zoneTemplate: {
      template: "DigZone",
      name: "dig",
      bg: "#884400"
    },
    makes: "Excavation",
    canDesignateTile: function(x,y,z) {
      var t = HTomb.World.tiles[z][x][y];
      var tb = HTomb.World.tiles[z-1][x][y];
      // this is the special part for DigTask
      if (HTomb.World.explored[z][x][y]!==true) {
        return true;
      }
      if (t===HTomb.Tiles.VoidTile) {
        return false;
      } else if (HTomb.World.features[coord(x,y,z)] && HTomb.World.features[coord(x,y,z)].owned!==false) {
        return false;
      } else if (t===HTomb.Tiles.FloorTile && tb===HTomb.Tiles.VoidTile) {
        return false;
      } else if (t===HTomb.Tiles.EmptyTile && (tb===HTomb.Tiles.EmptyTile || tb===HTomb.Tiles.FloorTile)) {
        return false;
      }
      return true;
    },
    // experiment with a filter to dig only one level at a time
    designateSquares: function(squares, options) {
      var tallest = -1;
      for (var j=0; j<squares.length; j++) {
        var s = squares[j];
        let tile = HTomb.World.tiles[s[2]][s[0]][s[1]];
        if (tile===HTomb.Tiles.WallTile) {
          tallest = Math.max(tallest,1);
        } else if (tile===HTomb.Tiles.UpSlopeTile) {
          tallest = Math.max(tallest,1);
        } else if (tile===HTomb.Tiles.FloorTile) {
          tallest = Math.max(tallest,0);
        }
      }
      if (tallest===1) {
        squares = squares.filter(function(e,i,a) {
          return (HTomb.World.tiles[e[2]][e[0]][e[1]]===HTomb.Tiles.UpSlopeTile
                  || HTomb.World.tiles[e[2]][e[0]][e[1]]===HTomb.Tiles.WallTile);
        });
      } else if (tallest===0) {
        squares = squares.filter(function(e,i,a) {
          return (HTomb.World.tiles[e[2]][e[0]][e[1]]===HTomb.Tiles.FloorTile);
        });
      }
      HTomb.Things.templates.Task.designateSquares.call(this, squares, options);
    },
    work: function(x,y,z) {
      // If this was initially placed illegally in unexplored territory, remove it now
      var t = (HTomb.World.tiles[z][x][y]);
      var tb = HTomb.World.tiles[z-1][x][y];
      var f = HTomb.World.features[coord(x,y,z)];
      if (t===HTomb.Tiles.VoidTile) {
        this.cancel();
        return;
      } else if (f && f.owned!==false && f.makes!=="Excavation") {
        this.cancel();
        return;
      } else if (t===HTomb.Tiles.FloorTile && tb===HTomb.Tiles.VoidTile) {
        this.cancel();
        return;
      } else if (t===HTomb.Tiles.EmptyTile && (tb===HTomb.Tiles.EmptyTile || tb===HTomb.Tiles.FloorTile)) {
        this.cancel();
        return;
      }
      if (f && f.template==="Tombstone") {
        if (f.integrity===null || f.integrity===undefined) {
          f.integrity=10;
        }
        f.integrity-=1;
        this.assignee.ai.acted = true;
        if (f.integrity<=0) {
          f.explode();
          HTomb.World.tiles[z][x][y] = HTomb.Tiles.DownSlopeTile;
          this.complete();
          HTomb.World.validate.cleanNeighbors(x,y,z);
        }
      } else {
        HTomb.Things.templates.Task.work.call(this,x,y,z);
      }
    }
  });

  HTomb.Things.defineTask({
    template: "BuildTask",
    name: "build",
    zoneTemplate: {
      template: "BuildZone",
      name: "build",
      //magenta
      bg: "#440088"
    },
    makes: "Construction",
    ingredients: {Rock: 1},
    canDesignateTile: function(x,y,z) {
      //shouldn't be able to build surrounded by emptiness
      var t = HTomb.World.tiles[z][x][y];
      if (t===HTomb.Tiles.VoidTile || t===HTomb.Tiles.WallTile) {
        return false;
      } else if (HTomb.World.features[coord(x,y,z)] && HTomb.World.features[coord(x,y,z)].owned!==false) {
        return false;
      } else {
        return true;
      }
    },
    // experiment with a filter to build only one level at a time
    designateSquares: function(squares, options) {
      var lowest = 1;
      for (var j=0; j<squares.length; j++) {
        var s = squares[j];
        let tile = HTomb.World.tiles[s[2]][s[0]][s[1]];
        if (tile===HTomb.Tiles.EmptyTile || tile===HTomb.Tiles.DownSlopeTile) {
          lowest = Math.min(lowest,-1);
        } else if (tile===HTomb.Tiles.FloorTile) {
          lowest = Math.min(lowest,0);
        }
      }
      if (lowest===-1) {
        squares = squares.filter(function(e,i,a) {
          return (HTomb.World.tiles[e[2]][e[0]][e[1]]===HTomb.Tiles.EmptyTile
                  || HTomb.World.tiles[e[2]][e[0]][e[1]]===HTomb.Tiles.DownSlopeTile);
        });
      } else if (lowest===0) {
        squares = squares.filter(function(e,i,a) {
          return (HTomb.World.tiles[e[2]][e[0]][e[1]]===HTomb.Tiles.FloorTile);
        });
      }
      HTomb.Things.templates.Task.designateSquares.call(this, squares, options);
    },
    designate: function(assigner) {
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: this.placeZone,
        outline: true,
        bg: this.zoneTemplate.bg
      });
    }
  });

  HTomb.Things.defineTask({
    template: "Undesignate",
    name: "undesignate",
    allowedTiles: "all",
    designate: function(assigner) {
      var deleteZones = function(x,y,z, assigner) {
        var zn = HTomb.World.zones[coord(x,y,z)];
        if (zn && zn.task && zn.assigner===assigner) {
          zn.task.cancel();
        }
        var c = HTomb.World.creatures[coord(x,y,z)];
        if (c && c.minion && c.minion.master===assigner && c.worker && c.worker.task) {
          c.worker.task.unassign();
        }
      };
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: deleteZones
      });
    }
  });

  HTomb.Things.defineTask({
    template: "PatrolTask",
    name: "patrol",
    zoneTemplate: {
      template: "PatrolZone",
      name: "patrol",
      bg: "#880088"
    },
    designate: function(assigner) {
      HTomb.GUI.selectSquare(assigner.z,this.designateSquare,{
        assigner: assigner,
        context: this,
        callback: this.placeZone
      });
    },
    ai: function() {
      var cr = this.assignee;
      cr.ai.patrol(this.zone.x,this.zone.y,this.zone.z);
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
  HTomb.Things.defineTask({
    template: "ForbidTask",
    name: "forbid",
    zoneTemplate: {
      template: "ForbiddenZone",
      name: "forbidden",
      bg: "#880000"
    },
    // this task will never be assigned...
    tryAssign: function() {
      return false;
    }
  });

  HTomb.Things.defineTask({
    template: "DismantleTask",
    name: "harvest/dismantle",
    zoneTemplate: {
      template: "DismantleZone",
      name: "dismantle",
      bg: "#446600"
    },
    finish: function(f) {
      f.feature.harvest();
      this.complete();
    },
    canDesignateTile: function(x,y,z) {
      if (HTomb.World.features[coord(x,y,z)] || (HTomb.World.covers[coord(x,y,z)] && HTomb.World.covers[coord(x,y,z)].liquid!==true)) {
        return true;
      } else {
        return false;
      }
    },
    // filter depending on whether we are removing features or covers
    designateSquares: function(squares, options) {
      var anyf = false;
      for (var j=0; j<squares.length; j++) {
        var s = squares[j];
        if (HTomb.World.features[coord(s[0],s[1],s[2])]) {
          anyf = true;
        }
      }
      if (anyf===true) {
        squares = squares.filter(function(e,i,a) {
          return (HTomb.World.features[coord(e[0],e[1],e[2])]!==undefined);
        });
      }
      HTomb.Things.templates.Task.designateSquares.call(this, squares, options);
    },
    work: function(x,y,z) {
      var f = HTomb.World.features[coord(x,y,z)];
      if (f) {
        f.feature.dismantle(this);
        this.assignee.ai.acted = true;
      } else {
        f = HTomb.World.covers[coord(x,y,z)];
        if (f) {
          delete HTomb.World.covers[coord(x,y,z)];
          this.complete();
        }
      }
    }
  });

  HTomb.Things.defineTask({
    template: "CraftTask",
    name: "craft",
    zoneTemplate: {
      template: "CraftZone",
      name: "craft",
      bg: "#553300"
    },
    makes: null,
    features: ["Door","Throne","ScryingGlass","Torch"],
    canDesignateTile: function(x,y,z) {
      var square = HTomb.Tiles.getSquare(x,y,z);
      if (square.terrain===HTomb.Tiles.FloorTile && HTomb.World.features[coord(x,y,z)]===undefined) {
        return true;
      } else {
        return false;
      }
    },
    designate: function(assigner) {
      var arr = [];
      for (var i=0; i<this.features.length; i++) {
        arr.push(HTomb.Things.templates[this.features[i]]);
      }
      var that = this;
      HTomb.GUI.choosingMenu("Choose a feature:", arr, function(feature) {
        return function() {
          function createZone(x,y,z) {
            var zone = that.placeZone(x,y,z, assigner);
            if (zone) {
              zone.task.makes = feature.template;
              if (feature.ingredients) {
                zone.task.ingredients = HTomb.Utils.clone(feature.ingredients);
              }
            }
          }
          HTomb.GUI.selectSquare(assigner.z,that.designateSquare,{
            assigner: assigner,
            context: that,
            callback: createZone
          });
        };
      });
    },
    work: function(x,y,z) {
      var f = HTomb.World.features[coord(x,y,z)];
      if (f && f.template===this.makes && f.makes!==this.makes) {
        f.dismantle();
      } else {
        HTomb.Things.templates.Task.work.call(this,x,y,z);
        // kind of a weird way to do it...
        f = HTomb.World.features[coord(x,y,z)];
        if (f.template===this.makes) {
          // does this still do anything?
          f.makes = this.choice;
        }
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
    designate: function(assigner) {
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: this.placeZone,
        outline: false,
        bg: this.zoneTemplate.bg,
        reset: false
      });
    },
    designateSquares: function(squares, options) {
      options = options || {};
      var assigner = options.assigner;
      var callb = options.callback;
      var seeds = HTomb.Utils.findItems(function(v,k,i) {return (v.parent==="Seed" && v.item.owned!==false);});
      var types = [];
      for (var i=0; i<seeds.length; i++) {
        if (types.indexOf(seeds[i].base)===-1) {
          types.push(seeds[i].base);
        }
      }
      if (types.length===0) {
        HTomb.GUI.pushMessage("No seeds available.");
        HTomb.GUI.reset();
      } else if (types.length===1) {
         HTomb.GUI.pushMessage("Assigning " + types[0]);
         options.context.makes = types[0]+"Sprout";
         HTomb.Things.templates.Task.designateSquares(squares,options);
         HTomb.GUI.reset();
      } else {
        HTomb.GUI.choosingMenu("Choose a crop:", types, function(crop) {
          return function() {
            options.context.makes = crop+"Sprout";
            HTomb.Things.templates.Task.designateSquares(squares,options);
            HTomb.GUI.reset();
          };
        });
      }
    },
    tryAssign: function(cr) {
      var x = this.zone.x;
      var y = this.zone.y;
      var z = this.zone.z;
      var f = HTomb.World.features[coord(x,y,z)];
      if (f===undefined && this.canReachZone(cr)) {
        this.assignTo(cr);
        return true;
      }
      return false;
    },
    canDesignateTile: function(x,y,z) {
      var f = HTomb.World.features[coord(x,y,z)];
      // if (f && f.template!==this.assignedCrop+"Plant") {
      if (f) {
        return false;
      }
      if (HTomb.World.covers[coord(x,y,z)] && HTomb.World.covers[coord(x,y,z)].liquid) {
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
      }
      return zone;
    }
  });

  return HTomb;
})(HTomb);
