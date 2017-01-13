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
      var x = task.x;
      var y = task.y;
      var z = task.z;
      var f = HTomb.World.features[coord(x,y,z)];
      // no need for ingredients if construction has begun
      if (task.workBegun()) {
        return false;
      }
      //if (f && f.makes.template===task.makes) {
      //  return false;
      //}
      // check to see if we are already targeting an ingredient
      if (cr.ai.target && cr.ai.target.isPlaced()!==true) {
        cr.ai.target = null;
      }
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
            var items = task.assigner.master.ownedItems.filter(function(v) {
            //var items = HTomb.Utils.findItems(function(v) {
              //if (v.item.isOwned()!==true || v.item.isOnGround()!==true) {
              if (v.item.isOnGround()!==true) {
                return false;
              } else if (v.template===ing) {
                if (HTomb.Tiles.isReachableFrom(cr.x,cr.y,cr.z,v.x,v.y,v.z, {
                  searcher: cr,
                  searchee: v,
                  searchTimeout: 10
                })) {
                  return true;
                }
              }
              return false;
            });
            // if we find an item we need, target it
            if (items.length>0) {
              items = HTomb.Path.closest(cr.x,cr.y,cr.z,items);
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
          cr.ai.walkToward(t.x,t.y,t.z, {
            searcher: cr,
            searchee: t,
            searchTimeout: 10
          });
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
        var x = task.entity.x;
        var y = task.entity.y;
        var z = task.entity.z;
        if (z===null) {
          console.log("why go to work fail?");
        }
        var dist = HTomb.Path.distance(cr.x,cr.y,x,y);
        // Should I instead check for "beginWork"?
        if (useLast===true && x===cr.x && y===cr.y && z===cr.z) {
          task.work(x,y,z);
        } else if (useLast!==true && HTomb.Tiles.isTouchableFrom(x,y,z,cr.x,cr.y,cr.z)) {
          task.work(x,y,z);
        } else if (dist>0 || cr.z!==z) {
          cr.ai.walkToward(x,y,z, {
            searcher: cr,
            searchee: task.entity,
            searchTimeout: 10
          });
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
      let cr = ai.entity;
      // Drop items not relevant to current task
      if (cr.inventory) {
        let items = cr.inventory.items;
        for (let i=0; i<items.length; i++) {
          // drop any item that is not relevant to the current task
          // ...eventually we'll want to keep equipment and certain other items
          // For now just drop items if there is no task at all?
          if (!cr.worker.task || cr.worker.task.template==="PatrolTask") {
            console.log("dropping an unneeded item");
            cr.inventory.drop(items.expose(i));
            ai.acted = true;
            break;
          }
        }
      }
      if (cr.worker && cr.worker.task) {
        ai.entity.worker.task.ai();
      } else {
        // Otherwise, patrol around the creature's master
        // or maybe check for tasks now?
        ai.patrol(ai.entity.minion.master.x,ai.entity.minion.master.y,ai.entity.minion.master.z, {
          searcher: ai.entity,
          searchee: ai.entity.minion.master,
          searchTimeout: 10
        });
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
      if (ai.team===undefined) {
        console.log("what in the world???");
      }
      if (ai.target===null || ai.target.creature===undefined || ai.isHostile(ai.target)!==true) {
        var teams = HTomb.Types.templates.Team.types;
        var hostiles = [];
        for (let i=0; i<teams.length; i++) {
          if (teams[i].isHostile(ai.team)) {
            hostiles = hostiles.concat(teams[i].members);
          }
        }
        hostiles = hostiles.filter(function(e,i,a) {
          return (
            HTomb.Path.quickDistance(ai.entity.x,ai.entity.y,ai.entity.z,e.x,e.y,e.z)<=10
            && HTomb.Tiles.isReachableFrom(e.x,e.y,e.z,ai.entity.x,ai.entity.y,ai.entity.z,
            { canPass: HTomb.Utils.bind(ai.entity.movement,"canMove"),
              searcher: ai.entity,
              searchee: e,
              searchTimeout: 10
            })
          );
        });
        if (hostiles.length>0) {
          hostiles = HTomb.Path.closest(ai.entity.x,ai.entity.y,ai.entity.z,hostiles);
          ai.target = hostiles[0];
        }
      }
      // should this test for a valid target?
      if (ai.target && ai.isHostile(ai.target)) {
        if (HTomb.Tiles.isTouchableFrom(ai.target.x, ai.target.y,ai.target.z, ai.entity.x, ai.entity.y, ai.entity.z)) {
          ai.entity.combat.attack(ai.target);
          ai.acted = true;
        } else {
          ai.walkToward(ai.target.x,ai.target.y,ai.target.z,{
            searcher: ai.entity,
            searchee: ai.target,
            searchTimeout: 10
          });
        }
      }
    }
  });

  HTomb.Types.defineRoutine({
    template: "LongRangeRoam",
    name: "long range roam",
    act: function(ai) {
      if (ai.target===null) {
        let x = HTomb.Utils.dice(1,LEVELW-2);
        let y = HTomb.Utils.dice(1,LEVELH-2);
        let z = HTomb.Tiles.groundLevel(x,y);
        let cr = ai.entity;
        if (HTomb.Tiles.isReachableFrom(x,y,z,cr.x,cr.y,cr.z)) {
          // is this allowed?
          ai.target = {x: x, y: y, z: z, template: "Square"};
        }
      }
      if (HTomb.Tiles.isTouchableFrom(ai.target.x, ai.target.y, ai.target.z, ai.entity.x, ai.entity.y, ai.entity.z)) {
        ai.target = null;
        return;
      }
      if (ai.target!==null) {
        ai.walkToward(ai.target.x, ai.target.y, ai.target.z);
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
    team: "AnimalTeam",
    //allegiance: null,
    acted: false,
    priority: null,
    alert: null,
    goals: null,
    fallback: null,
    isHostile: function(thing) {
      if (thing.ai===undefined || thing.ai.team===null || this.team===null) {
        return false;
      } else {
        return HTomb.Types.templates[this.team].isHostile(thing.ai.team);
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
      HTomb.Events.subscribe(this,"Destroy");
      this.fallback = HTomb.Routines.WanderAimlessly;
      this.setTeam(this.team);
    },
    setTeam: function(team) {
      this.team = team;
      let myTeam = HTomb.Types.templates.Team.teams[team];
      if (myTeam===undefined) {
        console.log(team);
      }
      if (myTeam.members.indexOf(this.entity)===-1) {
        myTeam.members.push(this.entity);
      }
    },
    onDespawn: function() {
      let myTeam = HTomb.Types.templates.Team.teams[this.team];
      if (myTeam.members.indexOf(this.entity)!==-1) {
        myTeam.members.splice(myTeam.members.indexOf(this.entity),1);
      }
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
    patrol: function(x,y,z,min,max,options) {
      options = options || {};
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
        this.acted = this.walkToward(x,y,z, {
          searcher: options.searcher,
          searchee: options.searchee,
          searchTimeout: options.searchTimeout
        });
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
    walkToward: function(x,y,z,options) {
      options = options || {};
      var x0 = this.entity.x;
      var y0 = this.entity.y;
      var z0 = this.entity.z;
      if (options.approxAfter && HTomb.Path.quickDistance(x0,y0,z0,x,y,z)>=options.approxAfter) {
        let dx = x-x0;
        if (dx>0) {
          dx = 1;
        } else if (dx<0) {
          dx = -1;
        }
        let dy = y-y0;
        if (dy>0) {
          dy = 1;
        } else if (dy<0) {
          dy = -1;
        }
        return this.tryStep(dx, dy, 0);
      }
      //var path = HTomb.Path.aStar(x0,y0,z0,x,y,z,{useLast: false});
      var path = HTomb.Path.aStar(x0,y0,z0,x,y,z,{
        canPass: HTomb.Utils.bind(this.entity.movement,"canMove"),
        useLast: false,
        searcher: options.searcher,
        searchee: options.searchee,
        searchTimeout: options.searchTimeout
      });
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
    xenophobic: false,
    berserk: false,
    teams: {},
    onDefine: function() {
      this.members = this.members || [];
      this.enemies = this.enemies || [];
      this.allies = this.allies || [];
      HTomb.Events.subscribe(this,"Destroy");
      HTomb.Types.templates.Team.teams[this.template] = this;
    },
    onDestroy: function(event) {
      if (this.members.indexOf(event.entity)>-1) {
        this.members.splice(this.members.indexOf(event.entity),1);
      }
    },
    isHostile: function(team) {
      if (team===undefined) {
        return false;
      }
      if (typeof(team)==="string") {
        team = HTomb.Types.templates[team];
      }
      if (this.berserk || team.berserk) {
        return true;
      } else if ((this.xenophobic || team.xenophobic) && (this!==team)) {
        return true;
      } else if (team.enemies.indexOf(this.template)>=0 || this.enemies.indexOf(team.template)>=0) {
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

  HTomb.Types.defineTeam({
    template: "HungryPredatorTeam",
    name: "predators",
    xenophobic: true
  });

  HTomb.Types.defineTeam({
    template: "AngryNatureTeam",
    name: "angryNature",
    enemies: ["PlayerTeam","GhoulTeam"]
  });

  return HTomb;
})(HTomb);
