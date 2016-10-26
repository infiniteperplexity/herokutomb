// ****** This module implements Behaviors, which are the basic units of functionality for creatures, items, and features
HTomb = (function(HTomb) {
  "use strict";
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var coord = HTomb.Utils.coord;

  HTomb.Types.define({
    template: "Routine",
    name: "routine",
    act: function(ai, args) {
      if (false) {
        ai.acted = true;
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
        cr.worker.task.unassign();
        cr.ai.walkRandom();
      } else if (t!==null) {
        if (t.x===cr.x && t.y===cr.y && t.z===cr.z) {
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

  HTomb.Types.defineRoutine({
    template: "ServeMaster",
    name: "serve master",
    act: function(ai) {
      if (ai.entity.minion===undefined) {
        return;
      }
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
    template: "WanderAimlessly",
    name: "wander aimlessly",
    act: function(ai) {
      ai.wander();
    }
  });
  HTomb.Types.defineRoutine({
    template: "CheckForHostile",
    name: "check for hostile",
    act: function(ai) {
      // this performance might be okay
      if (ai.target===null) {
        var teams = HTomb.Types.templates.Team.types;
        var hostiles = [];
        for (var i=0; i<teams.length; i++) {
          if (teams[i].isHostile(ai.team)) {
            hostiles = hostiles.concat(teams[i].members);
          }
        }
        hostiles = hostiles.filter(function(e,i,a) {
          return (HTomb.Path.quickDistance(ai.entity.x,ai.entity.y,ai.entity.z,e.x,e.y,e.z)<=10);
        });
        if (hostiles.length>0) {
          hostiles = HTomb.Path.closest(ai.entity,hostiles);
          ai.target = hostiles[0];
        }
      }
      // should this test for a valid target?
      if (ai.target && ai.isHostile(ai.target)) {
        if (HTomb.Tiles.isTouchableFrom(ai.target.x, ai.target.y,ai.target.z, ai.entity.x, ai.entity.y, ai.entity.z)) {
          ai.entity.combat.attack(ai.target);
          ai.acted = true;
        } else {
          ai.walkToward(ai.target.x,ai.target.y,ai.target.z);
        }
      }
    }
  });

  HTomb.Types.defineRoutine({
    template: "HuntDeadThings",
    name: "hunt dead things",
    act: function(ai) {
      // should this hunt in sight range first?
      if (ai.target===null) {
        var zombies = HTomb.Utils.where(HTomb.World.creatures,function(v,k,o) {
          return (v.template==="Zombie" && ai.isHostile(v) && HTomb.Tiles.isEnclosed(v.x,v.y,v.z)===false);
        });
        if (zombies.length>0) {
          var e = ai.entity;
          zombies.sort(function(a,b) {
            return HTomb.Path.quickDistance(e.x,e.y,e.z,a.x,a.y,a.z) - HTomb.Path.quickDistance(e.x,e.y,e.z,b.x,b.y,b.z);
          });
          ai.target = zombies[0];
          console.log("hunting a zombie");
          HTomb.Routines.CheckForHostile.act(ai);
        }
      }
    }
  });

  HTomb.Things.defineBehavior({
    template: "AI",
    name: "ai",
    // unimplemented
    target: null,
    // unimplemented
    team: null,
    //allegiance: null,
    acted: false,
    priority: null,
    alert: null,
    goals: null,
    fallback: null,
    onCreate: function(args) {
      let handler = {
        get: function(ai, prop) {
          if (prop==="target") {
            if (ai.target!==null && (ai.target.x===null || ai.target.y===null || ai.target.z===null)) {
              ai.target = null;
            }
          }
          return ai[prop];
        }
      }
      let proxy = new Proxy(this, handler);
      return proxy;
    },
    isHostile: function(thing) {
      if (thing.ai===undefined || thing.ai.team===undefined || this.team===undefined) {
        return false;
      } else {
        return this.team.isHostile(thing.ai.team);
      }
    },
    // We may want to save a path for the entity
    onAdd: function(){
      this.path = [];
      this.alert = HTomb.Routines.CheckForHostile;
      var goals = this.goals || [];
      this.goals = [];
      for (var i=0; i<goals.length; i++) {
        this.goals.push(HTomb.Routines[goals[i]]);
      }
      this.fallback = HTomb.Routines.WanderAimlessly;
      if (this.team===null) {
        this.setTeam(HTomb.Teams.AnimalTeam);
      } else {
        // make sure this gets set properly
        this.setTeam(HTomb.Teams[this.team]);
      }
    },
    setTeam: function(team) {
      //feeling ambivalent about tracking teams...
      this.team = team;
      HTomb.Types.templates[team.template].members.push(this.entity);
    },
    onDestroy: function(event) {
      if (event.entity===this.target) {
        this.target = null;
      }
    },
    act: function() {
      // If the entity is the player, don't choose for it...maybe this should be a Behavior?
      if (this.entity===HTomb.Player) {
        return false;
      }
      // If the creature has already acted, bail out
      if (this.acted===true) {
        this.acted = false;
        return false;
      }
      if (this.acted===false) {
        this.alert.act(this);
      }
      for (var i=0; i<this.goals.length; i++) {
        if (this.acted===false) {
          this.goals[i].act(this);
        }
      }
      if (this.acted===false) {
        this.fallback.act(this);
      }
      if (this.acted===false) {
        // console.log(this.entity);
        // HTomb.Debug.pushMessage("creature failed to act!");
      }
      // Reset activity for next turn
      this.acted = false;
    },
    // A patrolling creature tries to stay within a certain orbit of a target square
    patrol: function(x,y,z,min,max) {
      min = min || 2;
      max = max || 5;
      if (!this.entity.movement) {
        return false;
      }
      if (z===null) {
        console.log("why problem with patrol???");
      }
      var dist = HTomb.Path.distance(this.entity.x,this.entity.y,x,y);
      if (dist<min) {
        this.acted = this.walkAway(x,y,z);
      } else if (dist>max) {
        this.acted = this.walkToward(x,y,z);
      } else {
        this.acted = this.walkRandom();
      }
    },
    // A wandering creature walks randomly...so far it won't scale slopes
    wander: function() {
      if (!this.entity.movement) {
        return false;
      }
      this.acted = this.walkRandom();
    },
    walkRandom: function() {
      var r = Math.floor(Math.random()*26);
      var dx = HTomb.dirs[26][r][0];
      var dy = HTomb.dirs[26][r][1];
      var dz = HTomb.dirs[26][r][2];
      return this.tryStep(dx,dy,dz);
    },
    // Walk along a path toward the target
    walkToward: function(x,y,z) {
      var x0 = this.entity.x;
      var y0 = this.entity.y;
      var z0 = this.entity.z;
      var path = HTomb.Path.aStar(x0,y0,z0,x,y,z,{useLast: false});
      if (path!==false) {
        var square = path[0];
        if (path.length===0) {
          square = [x,y,z];
        }
        return this.tryStep(square[0]-x0,square[1]-y0,square[2]-z0);
      }
      return false;
    },
    // Walk straight away from the target
    walkAway: function(x,y) {
      var x0 = this.entity.x;
      var y0 = this.entity.y;
      var line = HTomb.Path.line(x0,y0,x,y);
      if (line.length<=1) {
        return this.walkRandom();
      }
      var dx = line[1][0] - x0;
      var dy = line[1][1] - y0;
      return this.tryStep(-dx,-dy,0);
    },
    // Try to step in a certain direction
    tryStep: function(dx, dy, dz) {
      var backoffs = HTomb.dirs.getBackoffs(dx, dy, dz);
      var x = this.entity.x;
      var y = this.entity.y;
      var z = this.entity.z;
      for (var i=0; i<backoffs.length; i++) {
        var dir = backoffs[i];
        var cr = HTomb.World.creatures[coord(x+dir[0],y+dir[1],z+dir[2])];
        // modify this to allow non-player creatures to displace
        if (this.entity.movement.canMove(x+dir[0],y+dir[1],z+dir[2])===false) {
          continue;
        } else if (cr) {
          //if (cr.ai && cr.ai.isFriendly && cr.player===undefined && cr.movement) {
          if (cr.ai && cr.ai.isHostile(this.entity)===false && cr.player===undefined && cr.movement) {
            // try displacing only half the time?
            if (Math.random()<=0.5) {
              cr.movement.displaceCreature(cr);
            } else {
              continue;
            }
          } else {
            continue;
          }
        } else {
          this.entity.movement.stepTo(x+dir[0],y+dir[1],z+dir[2]);
          return true;
        }
      }
      return false;
    },
  });


  HTomb.Types.define({
    template: "Team",
    name: "team",
    members: null,
    enemies: null,
    allies: null,
    onDefine: function() {
      this.members = this.members || [];
      this.enemies = this.enemies || [];
      this.allies = this.allies || [];
      HTomb.Events.subscribe(this,"Destroy");
    },
    onDestroy: function(event) {
      if (this.members.indexOf(event.entity)>-1) {
        this.members.splice(this.members.indexOf(event.entity),1);
      }
    },
    isHostile: function(team) {
      if (team.enemies.indexOf(this.template)>=0 || this.enemies.indexOf(team.template)>=0) {
        return true;
      } else {
        return false;
      }
    }
  });


  // the player and affiliated minions
  HTomb.Types.defineTeam({
    template: "PlayerTeam",
    name: "player"
  });

  HTomb.Types.defineTeam({
    template: "DefaultTeam",
    name: "default"
  });

  // non-aggressive animals
  HTomb.Types.defineTeam({
    template: "AnimalTeam",
    name: "animals"
  });

  HTomb.Types.defineTeam({
    template: "GhoulTeam",
    name: "ghouls",
    enemies: ["PlayerTeam"]
  });


  return HTomb;
})(HTomb);
