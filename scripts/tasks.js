HTomb = (function(HTomb) {
  "use strict";
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var coord = HTomb.Utils.coord;
  // should we maybe allow a queue of zones???  probably not
  HTomb.Things.defineBehavior({
    template: "Task",
    name: "task",
    assigner: null,
    assignee: null,
    makes: null,
    feature: null,
    ingredients: {},
    onCreate: function(args) {
      HTomb.Events.subscribe(this,"Destroy");
      return this;
    },
    onPlace: function(x,y,z,args) {
      if (this.assigner && this.assigner.master) {
        this.assigner.master.taskList.push(this.entity);
      }
      let t = HTomb.World.tasks[coord(x,y,z)];
      if (t) {
        // not sure how I plan on handling such conflicts...
        if (false) {
          throw new Error("Unhandled task placement conflict!");
        }
        t.remove();
        t.despawn();
      }
      HTomb.World.tasks[coord(x,y,z)] = this.entity;
    },
    designate: function(assigner) {
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: this.designateTile,
        outline: false,
        bg: this.bg
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
    validTile: function(x,y,z) {
      let f = HTomb.World.features[coord(x,y,z)];
      //also check owner?
      if (f===undefined || (f.template==="IncompleteFeature" && f.makes===this.makes)) {
        return true;
      }
      else return false;
    },
    designateTile: function(x,y,z,assigner) {
      if (this.validTile(x,y,z)) {
        let t = HTomb.Things[this.template]({assigner: assigner}).place(x,y,z);
        return t;
      }
    },
    canAssign: function(cr) {
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      if (this.validTile(x,y,z) && cr.inventory.canFindAll(this.ingredients)) {
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
    // this is on destruction of a creature, not the task
    onDestroy: function(event) {
      var cr = event.entity;
      if (cr===this.assignee) {
        this.unassign();
      } else if (cr===this.assigner) {
        this.despawn();
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
      this.entity.despawn();
    },
    onRemove: function() {
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      delete HTomb.World.tasks[coord(x,y,z)];
    },
    onDespawn: function() {
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
    },
    workBegun: function() {
      console.log(".workBegun()");
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      let f = HTomb.World.features[coord(x,y,z)];
      if (f && f.template==="IncompleteFeature" && f.makes===this.makes) {
        return true;
      } else {
        return false;
      }
    },
    beginWork: function() {
      console.log(".beginWork()");
      // could handle auto-dismantling here...
      let test = this.assignee.inventory.items.takeItems(this.ingredients);
      console.log(test);
      let f = HTomb.Things.IncompleteFeature({makes: HTomb.Things[this.makes]()});
      f.place(this.entity.x,this.entity.y,this.entity.z);
      this.assignee.ai.acted = true;
    },
    work: function() {
      console.log(".work()");
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      //do I want to make demolishing unowned features the default?
      let f = HTomb.World.features[coord(x,y,z)];
      //if (f && (f.template!=="IncompleteFeature" || f.makes!==this.makes) {
      //  f.dismantle();
      //}
      // we could also handle the dismantling in "beginWork"...
      if (this.workBegun()!==true) {
        this.beginWork();
      } else {
        f.work();
      }
      if (f.finished) {
        this.completeWork();
      }
    },
    completeWork: function(x,y,z) {
      this.entity.despawn();
    },
    ai: function() {
      if (this.assignee.ai.acted===true) {
        return;
      }
      var x = this.entity.x;
      var y = this.entity.y;
      var z = this.entity.z;
      var f = HTomb.World.features[coord(x,y,z)];
      var cr = this.assignee ;
      if ((f===undefined || f.makes!==this.makes) && this.ingredients!==null) {
        HTomb.Routines.ShoppingList.act(cr.ai);
      }
      if (cr.ai.acted===true) {
        return;
      }
      HTomb.Routines.GoToWork.act(cr.ai);
    }
  });

  HTomb.Things.defineTask({
    template: "DigTask",
    name: "dig",
    bg: "#884400",
    makes: "Excavation",
    validTile: function(x,y,z) {
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
    designate: function(assigner) {
      let menu = HTomb.GUI.Panels.menu;
      function myHover(x, y, z, squares) {
        if (squares===undefined) {
          let tile = HTomb.World.tiles[z][x][y];
          if (tile===HTomb.Tiles.DownSlopeTile) {
            menu.middle = ["%c{lime}Digging here will excavate the slope on the level below."];
          } else if (tile===HTomb.Tiles.UpSlopeTile) {
            menu.middle = ["%c{lime}Digging here will remove the slope."];
          } else if (tile===HTomb.Tiles.FloorTile) {
            menu.middle = ["%c{lime}Digging here will excavate a slope to a lower level."];
          } else if (tile===HTomb.Tiles.WallTile) {
            menu.middle = ["%c{lime}Digging here will dig a roofed tunnel."];
          } else {
            menu.middle["%c{orange}Cannot dig here."];
          }
          return;
        }
        var tallest = -2;
        for (var j=0; j<squares.length; j++) {
          var s = squares[j];
          let tile = HTomb.World.tiles[s[2]][s[0]][s[1]];
          if (tile===HTomb.Tiles.WallTile) {
            tallest = Math.max(tallest,1);
          } else if (tile===HTomb.Tiles.UpSlopeTile) {
            tallest = Math.max(tallest,1);
          } else if (tile===HTomb.Tiles.FloorTile) {
            tallest = Math.max(tallest,0);
          } else if (tile===HTomb.Tiles.DownSlopeTile) {
            tallest = Math.max(tallest,-1);
          }
        }
        if (tallest===1) {
          menu.middle = ["%c{lime}Dig tunnels and level slopes in this area."];
        } else if (tallest===0) {
          menu.middle = ["%c{lime}Dig downward slopes in this area."];
        } else if (tallest===-1) {
          menu.middle = ["%c{lime}Level downward slopes below this area."];
        } else {
          menu.middle = ["%c{orange}Can't dig in this area."];
        }
      };
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: this.designateTile,
        bg: this.bg,
        hover: myHover
      });
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
      // There is a special case of digging upward under a tombstone...
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
    bg: "#440088",
    makes: "Construction",
    //ingredients: {Rock: 1},
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
      let menu = HTomb.GUI.Panels.menu;
      function myHover(x, y, z, squares) {
        if (squares===undefined) {
          let tile = HTomb.World.tiles[z][x][y];
          if (tile===HTomb.Tiles.EmptyTile || tile===HTomb.Tiles.DownSlopeTile) {
            menu.middle = ["%c{lime}Building here will construct a floor over empty space."];
          } else if (tile===HTomb.Tiles.UpSlopeTile) {
            menu.middle = ["%c{lime}Building here will convert this slope into a wall."];
          } else if (tile===HTomb.Tiles.FloorTile) {
            menu.middle = ["%c{lime}Building here will construct a slope to a higher level."];
          } else {
            menu.middle = ["%c{orange}Can't build on this tile."];
          }
          return;
        }
        var lowest = 2;
        for (var j=0; j<squares.length; j++) {
          var s = squares[j];
          let tile = HTomb.World.tiles[s[2]][s[0]][s[1]];
          if (tile===HTomb.Tiles.EmptyTile || tile===HTomb.Tiles.DownSlopeTile) {
            lowest = Math.min(lowest,-1);
          } else if (tile===HTomb.Tiles.FloorTile) {
            lowest = Math.min(lowest,0);
          } else if (tile===HTomb.Tiles.UpSlopeTile) {
            lowest = Math.min(lowest,1);
          }
        }
        if (lowest===-1) {
          menu.middle = ["%c{lime}Construct new floors in this area."];
        } else if (lowest===0) {
          menu.middle = ["%c{lime}Construct new slopes in this area."];
        } else if (lowest===1){
          menu.middle = ["%c{lime}Construct new walls in this area."];
        } else {
          menu.middle = ["%c{orange}Can't build in this area."];
        }
      };
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: this.placeZone,
        outline: true,
        bg: this.zoneTemplate.bg,
        hover: myHover
      });
    }
  });

  HTomb.Things.defineTask({
    template: "Undesignate",
    name: "undesignate",
    allowedTiles: "all",
    designate: function(assigner) {
      var deleteTasks = function(x,y,z, assigner) {
        var zn = HTomb.World.tasks[coord(x,y,z)];
        if (zn && zn.task.assigner===assigner) {
          zn.task.cancel();
        }
      };
      function myHover() {
        HTomb.GUI.Panels.menu.middle["%c{lime}Remove all designations in this area."];
      }
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: deleteTasks,
        hover: myHover
      });
    }
  });

  HTomb.Things.defineTask({
    template: "PatrolTask",
    name: "patrol",
    bg: "#880088",
    designate: function(assigner) {
      function myHover() {
        HTomb.GUI.Panels.menu.middle = ["%c{lime}Assign a minion to patrol this square."];
      }
      HTomb.GUI.selectSquare(assigner.z,this.designateSquare,{
        assigner: assigner,
        context: this,
        callback: this.designateTile,
        hover: myHover
      });
    },
    ai: function() {
      var cr = this.assignee;
      cr.ai.patrol(this.entity.x,this.entity.y,this.entity.z);
    }
  });

  HTomb.Things.defineTask({
    template: "HoardTask",
    name: "hoard",
    bg: "#666600",
    designate: function(assigner) {
      function myHover() {
        HTomb.GUI.Panels.menu.middle = ["%c{lime}Have minions move items to this square."];
      }
      HTomb.GUI.selectSquare(assigner.z,this.designateSquare,{
        assigner: assigner,
        context: this,
        callback: this.designateTile,
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
        var x = this.entity.x;
        var y = this.entity.y;
        var z = this.entity.z;
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
                var task = HTomb.World.task[it];
                // if it's already in a hoard, skip it
                if (task && task.template==="HoardTask") {
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
    bg: "#880000",
    designate: function(assigner) {
      function myHover() {
        HTomb.GUI.Panels.menu.middle = ["%c{lime}Forbid minions from entering this square."];
      }
      HTomb.GUI.selectSquare(assigner.z,this.designateSquare,{
        assigner: assigner,
        context: this,
        callback: this.designateTile,
        hover: myHover
      });
    },
    // this task will never be assigned...
    tryAssign: function() {
      return false;
    }
  });

  HTomb.Things.defineTask({
    template: "DismantleTask",
    name: "harvest/dismantle",
    bg: "#446600",
    finish: function(f) {
      f.feature.harvest();
      this.complete();
    },
    canDesignateTile: function(x,y,z) {
      if (HTomb.World.features[coord(x,y,z)] || (HTomb.World.covers[z][x][y].liquid!==true)) {
        return true;
      } else {
        return false;
      }
    },
    // filter depending on whether we are removing features or covers
    designateSquares: function(squares, options) {
      let anyf = false;
      for (let j=0; j<squares.length; j++) {
        let s = squares[j];
        if (HTomb.World.features[coord(s[0],s[1],s[2])]) {
          anyf = true;
        }
      }
      if (anyf===true) {
        squares = squares.filter(function(e,i,a) {
          return (HTomb.World.features[coord(e[0],e[1],e[2])]);
        });
      }
      HTomb.Things.templates.Task.designateSquares.call(this, squares, options);
    },
    designate: function(assigner) {
      let menu = HTomb.GUI.Panels.menu;
      function myHover(x, y, z, squares) {
        if (squares===undefined) {
          let feature = HTomb.World.features[coord(x,y,z)];
          let cover = HTomb.World.covers[z][x][y];
          if (feature) {
            menu.middle = ["%c{lime}Dismantle "+feature.describe({article: "indefinite"})+"."];
          } else if (cover!==HTomb.Covers.NoCover) {
            menu.middle = ["%c{lime}Remove "+cover.describe()+"."];
          } else {
            menu.middle = ["%c{orange}Nothing to remove here."];
          }
        } else {
          let anyf = false;
          for (let j=0; j<squares.length; j++) {
            let s = squares[j];
            if (HTomb.World.features[coord(s[0],s[1],s[2])]!==undefined) {
              anyf = true;
            }
          }
          if (anyf===true) {
            menu.middle = ["%c{lime}Dismantle features in this area."];
          } else {
            menu.middle = ["%c{lime}Remove covers in this area."];
          }
        }
      }
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: this.designateTile,
        bg: this.bg,
        hover: myHover
      });
    },
    work: function(x,y,z) {
      var f = HTomb.World.features[coord(x,y,z)];
      if (f) {
        f.feature.dismantle(this);
        this.assignee.ai.acted = true;
      } else {
        f = HTomb.World.covers[z][x][y];
        if (f!==HTomb.Covers.NoCover) {
          HTomb.World.covers[z][x][y] = HTomb.Covers.NoCover;
          this.complete();
        }
      }
    }
  });

  HTomb.Things.defineTask({
    template: "FurnishTask",
    name: "furnish",
    bg: "#553300",
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
          function myHover(x,y,z) {
            HTomb.GUI.Panels.menu.middle = ["%c{lime}Furnish " + feature.describe({article: "indefinite"}) + " here."];
          }
          HTomb.GUI.selectSquare(assigner.z,that.designateSquare,{
            assigner: assigner,
            context: that,
            callback: createZone,
            hover: myHover
          });
        };
      });
      HTomb.GUI.Panels.menu.middle = ["%c{orange}Choose a feature before placing it."];
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
    bg: "#008800",
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
    canPlaceFeature: function() {
      let f = HTomb.World.features[coord(this.zone.x, this.zone.y, this.zone.z)];
      // maybe allow overwriting of current crops as well?
      if (f===undefined || (f.template==="IncompleteFeature" && f.makes===this.makes)
          || (f.template==="FarmFeature" && f.feature.owner===this.assigner)) {
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
