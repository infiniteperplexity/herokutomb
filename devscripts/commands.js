// The Commands submodule defines the various things a player can do
HTomb = (function(HTomb) {
  "use strict";
  var Commands = HTomb.Commands;
  var Controls = HTomb.Controls;
  var GUI = HTomb.GUI;
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var coord = HTomb.Utils.coord;
  Commands.tryMoveWest = function() {Commands.tryMove('W');};
  Commands.tryMoveNorth = function() {Commands.tryMove('N');};
  Commands.tryMoveEast = function() {Commands.tryMove('E');};
  Commands.tryMoveSouth = function() {Commands.tryMove('S');};
  Commands.tryMoveNorthWest = function() {Commands.tryMove('NW');};
  Commands.tryMoveNorthEast = function() {Commands.tryMove('NE');};
  Commands.tryMoveSouthWest = function() {Commands.tryMove('SW');};
  Commands.tryMoveSouthEast = function() {Commands.tryMove('SE');};
  Commands.tryMoveUp = function() {Commands.tryMove('U');};
  Commands.tryMoveDown = function() {Commands.tryMove('D');};
  Commands.tryMove = function(dir) {
    var x = HTomb.Player.x;
    var y = HTomb.Player.y;
    var z = HTomb.Player.z;
    var newx = x;
    var newy = y;
    var newz = z;
    if (dir==='N') {
      newy-=1;
    } else if (dir==='NW') {
      newx-=1;
      newy-=1;
    } else if (dir==='NE') {
      newx+=1;
      newy-=1;
    } else if (dir==='S') {
      newy+=1;
    } else if (dir==='SW') {
      newx-=1;
      newy+=1;
    } else if (dir==='SE') {
      newx+=1;
      newy+=1;
    } else if (dir==='W') {
      newx-=1;
    } else if (dir==='E') {
      newx+=1;
    } else if (dir==='U') {
      newz+=1;
    } else if (dir==='D') {
      newz-=1;
    }
    var square = HTomb.Tiles.getSquare(newx,newy,newz);
    if (HTomb.Player.movement===undefined) {
      HTomb.GUI.pushMessage("You can't move!");
    // attack a touchable, hostile creature
    } else if (square.creature && square.creature.ai && square.creature.ai.isHostile(HTomb.Player) && HTomb.Tiles.isTouchableFrom(newx, newy, newz, x, y, z)) {
    //} else if (square.creature && square.creature.ai && square.creature.ai.hostile && HTomb.Tiles.isTouchableFrom(newx, newy, newz, x, y, z)) {
      HTomb.Player.combat.attack(square.creature);
      HTomb.Time.resumeActors();
      return;
    // if you can move, either move or displace
    } else if (HTomb.Player.movement.canMove(newx,newy,newz)) {
      if (square.creature && square.creature.ai && square.creature.ai.isHostile(HTomb.Player)===false) {
        HTomb.Events.publish({type: "Command", command: "Move", dir: dir});
        Commands.displaceCreature(newx,newy,newz);
        HTomb.GUI.pushMessage("You displace " + square.creature.describe({article: "indefinite"}) + ".");
        return;
      } else {
        HTomb.Events.publish({type: "Command", command: "Move", dir: dir});
        Commands.movePlayer(newx,newy,newz);
        return;
      }
    // open a door, etc.
    } else if (square.feature && square.feature.activate) {
      square.feature.activate();
      return;
    } else if (HTomb.Debug.mobility===true && square.creature===undefined) {
      HTomb.Events.publish({type: "Command", command: "Move", dir: dir});
      Commands.movePlayer(newx,newy,newz);
      return;
    } else if (newz===z) {
      if (HTomb.World.tiles[z][x][y].zmove===+1) {
        Commands.tryMoveUp();
        return;
      } else if (HTomb.World.tiles[z][x][y].zmove===-1) {
        Commands.tryMoveDown();
        return;
      }
    }
    HTomb.GUI.pushMessage("Can't go that way.");
  };

  Commands.act = function() {
    function activate(x,y,z) {
      var f = HTomb.World.features[coord(x,y,z)];
      if (f && f.activate) {
        f.activate();
        HTomb.Time.resumeActors();
      }
    }
    HTomb.GUI.pickDirection(activate);
  }
  // Do nothing
  Commands.wait = function() {
    HTomb.Player.ai.acted = true;
    HTomb.Player.ai.actionPoints-=16;
    HTomb.Time.resumeActors();
    if (HTomb.GUI.mouseMovedLast || HTomb.GUI.Contexts.active===HTomb.GUI.Contexts.main) {
      let gameScreen = HTomb.GUI.Panels.gameScreen;
      GUI.Contexts.active.mouseTile(GUI.Contexts.mouseX+gameScreen.xoffset, GUI.Contexts.mouseY+gameScreen.yoffset);
    } else {
      let keyCursor = GUI.getKeyCursor();
      GUI.Contexts.active.mouseTile(keyCursor[0], keyCursor[1]);
    }
  };

  HTomb.Debug.teleport = function(x,y,z) {
    HTomb.Player.remove();
    HTomb.Player.place(x,y,z);
    HTomb.Time.resumeActors();
  }

  Commands.centerOnPlayer = function() {
    let p = HTomb.Player;
    HTomb.GUI.Panels.gameScreen.center(p.x,p.y,p.z);
    HTomb.GUI.Panels.gameScreen.render();
    let keyCursor = HTomb.GUI.getKeyCursor();
    if (keyCursor) {
      HTomb.GUI.Contexts.active.mouseTile(keyCursor[0],keyCursor[1]);
    }
  };
  // Describe creatures, items, and features in this square and adjoined slopes
  // This method may be obsolete now that we have "hover"
  Commands.look = function(square) {
    if (square.creature) {
      HTomb.GUI.pushMessage("There is " + square.creature.describe({article: "indefinite"}) + " here.");
    }
    if (square.feature) {
      var seeSquare = null;
      var mesg = null;
      var i;
      if (square.feature.zView===+1) {
        seeSquare = HTomb.Tiles.getSquare(square.x,square.y,square.z+1);
        if (seeSquare.creature) {
          HTomb.GUI.pushMessage("There is " + square.creature.describe({article: "indefinite"}) + " above here.");
        }
        if (seeSquare.items) {
          mesg = "The square above contains";
          for (i = 0; i<seeSquare.items.length; i++) {
            mesg = mesg + " " + seeSquare.items[i].describe({article: "indefinite"});
            if (i===seeSquare.items.length-2) {
              mesg = mesg + ", and";
            } else if (i<seeSquare.items.length-1) {
              mesg = mesg + ",";
            }
          }
          HTomb.GUI.pushMessage(mesg+".");
        }
      } else if (square.feature.zView===-1) {
        seeSquare = HTomb.Tiles.getSquare(square.x,square.y,square.z-1);
        if (seeSquare.creature) {
          HTomb.GUI.pushMessage("There is " + square.creature.describe({article: "indefinite"}) + " below here.");
        }
        if (seeSquare.items) {
          mesg = "The square below contains";
          for (i = 0; i<seeSquare.items.length; i++) {
            mesg = mesg + " " + seeSquare.items[i].describe({article: "indefinite"});
            if (i===seeSquare.items.length-2) {
              mesg = mesg + ", and";
            } else if (i<seeSquare.items.length-1) {
              mesg = mesg + ",";
            }
          }
          HTomb.GUI.pushMessage(mesg+".");
        }
      }
    }
    HTomb.GUI.pushMessage(square.terrain.name + " square at " + square.x +", " + square.y + ", " + square.z + ".");
    Commands.glance(square);
  };
  // A quick glance for when the player enters the square
  Commands.glance = function(square) {
    if (square.items) {
      // This should use the listItems method
      var mesg = square.items.list();
      HTomb.GUI.pushMessage("You see " + mesg + " here.");
    }
    if (square.feature) {
      HTomb.GUI.pushMessage("There is " + square.feature.describe({article: "indefinite"}) + " here.");
    }
  };
  // Move the player, glance, and spend an action
  Commands.movePlayer = function(x,y,z) {
    var x0 = HTomb.Player.x;
    var y0 = HTomb.Player.y;
    var z0 = HTomb.Player.z;
    if (z===z0+1) {
      HTomb.GUI.pushMessage("You scramble up the slope.");
    } else if (z===z0-1) {
      HTomb.GUI.pushMessage("You scramble down the slope.");
    }
    HTomb.Player.movement.stepTo(x,y,z);
    //HTomb.Player.place(x,y,z);
    var square = HTomb.Tiles.getSquare(x,y,z);
    Commands.glance(square);
    HTomb.Time.resumeActors();
  };
  Commands.displaceCreature = function(x,y,z) {
    var p = HTomb.Player;
    var x0 = HTomb.Player.x;
    var y0 = HTomb.Player.y;
    var z0 = HTomb.Player.z;
    var cr = HTomb.World.creatures[coord(x,y,z)];
    HTomb.Player.movement.displaceCreature(cr);
    Commands.glance(HTomb.Tiles.getSquare(x,y,z));
    HTomb.Time.resumeActors();

  };
  // Try to pick up items
  Commands.pickup = function() {
    var p = HTomb.Player;
    var square = HTomb.Tiles.getSquare(p.x,p.y,p.z);
    if (!square.items) {
      HTomb.GUI.pushMessage("Nothing here to pick up.");
    } else if (!HTomb.Player.inventory) {
      HTomb.GUI.pushMessage("You cannot carry items.");
    } else if (HTomb.Player.inventory.n >= HTomb.Player.inventory.capacity) {
      HTomb.GUI.pushMessage("You cannot carry any more items.");
    } else {
      if (square.items.length===1) {
        let item = square.items.head();
        HTomb.Events.publish({type: "Command", command: "PickUp", item: item});
        HTomb.Player.inventory.pickup(item);
        HTomb.Time.resumeActors();
      } else {
        // If there are multiple items, display a menu
        GUI.choosingMenu("Choose an item:",square.items.exposeArray(),
          function(item) {
            return function() {
              HTomb.Events.publish({type: "Command", command: "PickUp", item: item});
              HTomb.Player.inventory.pickup(item);
              HTomb.Time.resumeActors();
              HTomb.GUI.reset();
            };
          },
          {
            contextName: "ChooseItemToPickup"
          }
        );
      }
    }
  };
  // Try to drop an item
  Commands.drop = function() {
    var p = HTomb.Player;
    if (!p.inventory) {
      HTomb.GUI.pushMessage("You cannot carry items.");
    } else if (p.inventory.items.length===0) {
      HTomb.GUI.pushMessage("You have no items.");
    } else {
      if (p.inventory.items.length===1) {
        let item = p.inventory.items.head();
        p.inventory.drop(item);
        HTomb.Events.publish({type: "Command", command: "Drop", item: item});
        HTomb.Time.resumeActors();
      } else {
        // If the player has multiple items, display a menu
        GUI.choosingMenu("Choose an item:",p.inventory.items.exposeItems(),
          function(item) {
            return function() {
              HTomb.Player.inventory.drop(item);
              HTomb.Events.publish({type: "Command", command: "Drop", item: item});
              HTomb.Time.resumeActors();
              HTomb.GUI.reset();
            };
          },
          {
            contextName: "ChooseItemToDrop"
          }
        );
      }
    }
  };
  Commands.inventory = function() {
    var p = HTomb.Player;
    if (!p.inventory) {
      HTomb.GUI.pushMessage("You cannot carry items.");
    } else if (p.inventory.items.length===0) {
      HTomb.GUI.pushMessage("You have no items.");
    } else {
        // If the player has multiple items, display a menu
      GUI.choosingMenu("You are carrying:",p.inventory.items.exposeArray(),
        function(item) {
          return function() {
            HTomb.GUI.reset();
          };
        },
        {
          contextName: "ViewInventory"
        }
      );
    }
  };
  // Show a menu of the spells the player can cast
  Commands.showSpells = function() {
    HTomb.Events.publish({type: "Command", command: "ShowSpells"});
    GUI.choosingMenu("Choose a spell (mana cost):", HTomb.Player.caster.spells,
      function(sp) {
        return function() {
          if (HTomb.Player.caster.mana>=sp.getCost()) {
            HTomb.GUI.Panels.menu.middle = [];
            HTomb.GUI.Panels.menu.refresh();
            HTomb.Events.publish({type: "Command", command: "ChooseSpell", spell: sp});
            HTomb.Player.caster.cast(sp);
          } else {
            HTomb.GUI.Panels.menu.middle = ["%c{orange}Not enough mana."];
            HTomb.GUI.Panels.menu.refresh();
            HTomb.GUI.pushMessage("Not enough mana!");
          }
        };
      },
      {
        format: function(spell) {
          let descrip = spell.describe()+" ("+spell.getCost()+")";
          if (spell.getCost()>spell.caster.mana) {
            descrip = "%c{gray}"+descrip;
          }
          return descrip;
        },
        contextName: "ShowSpells"
      }
    );
  };
  // Show a menu of the tasks the player can assign
  Commands.showJobs = function() {
    HTomb.Events.publish({type: "Command", command: "ShowJobs"});
    GUI.choosingMenu("Choose a task:", HTomb.Player.master.listTasks(),
      function(task) {
        return function() {
          HTomb.Events.publish({type: "Command", command: "ChooseJob", task: task})
          HTomb.Player.master.designate(task);
          //HTomb.Time.resumeActors();
        };
      },
      {
        format: function(task) {
          let name = task.longName;
          return (name.substr(0,1).toUpperCase() + name.substr(1)+".");
        },
        contextName: "ShowJobs"
      }
    );
  };
  return HTomb;
})(HTomb);
