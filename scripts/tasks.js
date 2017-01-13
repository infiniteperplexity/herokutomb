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
    dormant: 0,
    dormancy: [2,6],
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
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      if (HTomb.World.tiles[z][x][y]!==HTomb.Tiles.FloorTile) {
        return false;
      }
      let f = HTomb.World.features[coord(x,y,z)];
      if (f===undefined || (f.template==="IncompleteFeature" && f.makes.template===this.makes)) {
        return true;
      }
      else {
        return false;
      }
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
      if (this.validTile(x,y,z) && HTomb.Tiles.isReachableFrom(cr.x,cr.y,cr.z,x,y,z,{
        searcher: cr,
        searchee: this.entity,
        searchTimeout: 10
      }) && cr.inventory.canFindAll(this.ingredients)) {
        return true;
      } else {
        return false;
      }
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
        if (taskList.indexOf(this.entity)!==-1) {
          taskList.splice(taskList.indexOf(this.entity),1);
        }
      }
      if (this.assignee) {
        this.assignee.worker.unassign();
      }
    },
    workBegun: function() {
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      let f = HTomb.World.features[coord(x,y,z)];
      if (f && f.template==="IncompleteFeature" && f.makes.template===this.makes) {
        return true;
      } else {
        return false;
      }
    },
    beginWork: function() {
      // could handle auto-dismantling here...
      // will this work?  or should we check for ingredients before taking?
      if (this.assignee.inventory.items.hasAll(this.ingredients)!==true) {
        throw new Error("shouldn't reach this due to AI");
      }
      let items = this.assignee.inventory.items.takeItems(this.ingredients);
      for (let i=0; i<items.length; i++) {
        items[i].despawn();
      }
      let f = HTomb.Things.IncompleteFeature({makes: HTomb.Things[this.makes]()});
      f.place(this.entity.x,this.entity.y,this.entity.z);
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
      if (this.workBegun()!==true) {
        this.beginWork();
      } else {
        f.work();
        this.assignee.ai.acted = true;
      }
      if (f && f.finished) {
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
      var cr = this.assignee;
      if (this.workBegun()!==true && Object.keys(this.ingredients).length>0) {
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
    dormancy: [0,0],
    validTile: function(x,y,z) {
      if (HTomb.World.explored[z][x][y]!==true) {
        return true;
      }
      var t = HTomb.World.tiles[z][x][y];
      var tb = HTomb.World.tiles[z-1][x][y];
      // this is the special part for DigTask
      let f = HTomb.World.features[coord(x,y,z)];
      if (t===HTomb.Tiles.VoidTile) {
        return false;
      } else if (f && (f.template!=="IncompleteFeature" || this.makes!==f.makes.template)) {
        return false;
      } else if (t===HTomb.Tiles.FloorTile && tb===HTomb.Tiles.VoidTile) {
        return false;
      } else if (t===HTomb.Tiles.EmptyTile && (tb===HTomb.Tiles.EmptyTile || tb===HTomb.Tiles.FloorTile)) {;
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
      let that = this;
      function myHover(x, y, z, squares) {
        if (squares===undefined) {
          if (HTomb.World.explored[z][x][y]!==true) {
            menu.middle = ["%c{orange}Unexplored tile."];
            return;
          }
          if (that.validTile(x,y,z)!==true) {
            menu.middle = ["%c{orange}Cannot dig here."];
            return;
          }
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
    designateTile: function(x,y,z,assigner) {
      if (this.validTile(x,y,z) || HTomb.World.explored[z][x][y]!==true) {
        let t = HTomb.Things[this.template]({assigner: assigner}).place(x,y,z);
        return t;
      }
    },
  });

  HTomb.Things.defineTask({
    template: "BuildTask",
    name: "build",
    bg: "#440088",
    makes: "Construction",
    //ingredients: {Rock: 1},
    validTile: function(x,y,z) {
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      //shouldn't be able to build surrounded by emptiness
      var t = HTomb.World.tiles[z][x][y];
      let f = HTomb.World.features[coord(x,y,z)];
      if (t===HTomb.Tiles.VoidTile || t===HTomb.Tiles.WallTile) {
        return false;
      } else if (f && (f.template!=="IncompleteFeature" || this.makes!==f.makes.template)) {
        return false;
      } else {
        return true;
      }
    },
    designateSquares: function(squares, options) {
      var tallest = -1;
      for (var j=0; j<squares.length; j++) {
        var s = squares[j];
        let tile = HTomb.World.tiles[s[2]][s[0]][s[1]];
        if (tile===HTomb.Tiles.UpSlopeTile) {
          tallest = Math.max(tallest,1);
        } else if (tile===HTomb.Tiles.FloorTile) {
          tallest = Math.max(tallest,0);
        }
      }
      if (tallest===1) {
        squares = squares.filter(function(e,i,a) {
          return (HTomb.World.tiles[e[2]][e[0]][e[1]]===HTomb.Tiles.UpSlopeTile);
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
      let that = this;
      function myHover(x, y, z, squares) {
        if (squares===undefined) {
          if (HTomb.World.explored[z][x][y]!==true) {
            menu.middle = ["%c{orange}Unexplored tile."];
            return;
          }
          if (that.validTile(x,y,z)!==true) {
            menu.middle = ["%c{orange}Cannot build here."];
            return;
          }
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
        var tallest = -2;
        for (var j=0; j<squares.length; j++) {
          var s = squares[j];
          let tile = HTomb.World.tiles[s[2]][s[0]][s[1]];
          if (tile===HTomb.Tiles.UpSlopeTile) {
            tallest = Math.max(tallest,1);
          } else if (tile===HTomb.Tiles.FloorTile) {
            tallest = Math.max(tallest,0);
          } else if (tile===HTomb.Tiles.DownSlopeTile || tile===HTomb.Tiles.EmptyTile) {
            tallest = Math.max(tallest,-1);
          }
        }
        if (tallest===1) {
          menu.middle = ["%c{lime}Construct new walls in this area."];
        } else if (tallest===0) {
          menu.middle = ["%c{lime}Construct new slopes in this area."];
        } else if (tallest===-1) {
          menu.middle = ["%c{lime}Construct new floors in this area."];
        } else {
          menu.middle = ["%c{orange}Can't build in this area."];
        }
      };
      HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
        context: this,
        assigner: assigner,
        callback: this.designateTile,
        outline: true,
        bg: this.bg,
        hover: myHover
      });
    }
  });

  HTomb.Things.defineTask({
    template: "Undesignate",
    name: "undesignate",
    allowedTiles: "all",
    validTile: function() {
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      return true;
    },
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
    validTile: function(x,y,z) {
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      return true;
    },
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
      cr.ai.patrol(this.entity.x,this.entity.y,this.entity.z, {
        searcher: cr,
        searchee: this.entity,
        searchTimeout: 10
      });
    }
  });

  HTomb.Things.defineTask({
    template: "ForbidTask",
    name: "forbid",
    bg: "#880000",
    validTile: function(x,y,z) {
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      return true;
    },
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
    canAssign: function() {
      return false;
    }
  });

  HTomb.Things.defineTask({
    template: "DismantleTask",
    name: "harvest/dismantle",
    bg: "#446600",
    validTile: function(x,y,z) {
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      if (HTomb.World.features[coord(x,y,z)] || (HTomb.World.covers[z][x][y].liquid!==true && HTomb.World.covers[z][x][y]!==HTomb.Covers.NoCover)) {
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
        if (f.isPlaced()===false) {
          this.completeWork();
        }
      } else {
        f = HTomb.World.covers[z][x][y];
        if (f!==HTomb.Covers.NoCover) {
          HTomb.World.covers[z][x][y] = HTomb.Covers.NoCover;
          this.assignee.ai.acted = true;
          this.completeWork();
        }
      }
    }
  });

  HTomb.Things.defineTask({
    template: "FurnishTask",
    name: "furnish",
    bg: "#553300",
    features: ["Door","Throne","ScryingGlass","Torch"],
    designate: function(assigner) {
      var arr = [];
      for (var i=0; i<this.features.length; i++) {
        arr.push(HTomb.Things.templates[this.features[i]]);
      }
      var that = this;
      HTomb.GUI.choosingMenu("Choose a feature:", arr, function(feature) {
        return function() {
          function createZone(x,y,z) {
            var task = that.designateTile(x,y,z,assigner);
            if (task) {
              task.task.makes = feature.template;
              if (feature.ingredients) {
                task.task.ingredients = HTomb.Utils.clone(feature.ingredients);
              }
              task.name = task.name + " " + HTomb.Things.templates[feature.template].name;
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
      },
      function(feature) {
        let g = feature.describe();
        let ings = [];
        for (let ing in feature.ingredients) {
          ings.push([ing, feature.ingredients[ing]]);
        }
        let hasAll = true;
        if (ings.length>0) {
          g+=" ($: ";
          for (let i=0; i<ings.length; i++) {
            g+=ings[i][1];
            g+=" ";
            g+=HTomb.Things.templates[ings[i][0]].name;
            if (i<ings.length-1) {
              g+=", ";
            } else {
              g+=")";
            }
            if (assigner.master) {
              let has = false;
              for (let j=0; j<assigner.master.ownedItems.length; j++) {
                if (assigner.master.ownedItems[j].template===ings[i][0]) {
                  has = true;
                }
              }
              if (has===false) {
                hasAll = false;
              }
            }
          }
        }
        if (hasAll!==true) {
          g = "%c{gray}"+g;
        }
        return g;
      });
      HTomb.GUI.Panels.menu.middle = ["%c{orange}Choose a feature before placing it."];
    }
  });

  return HTomb;
})(HTomb);
