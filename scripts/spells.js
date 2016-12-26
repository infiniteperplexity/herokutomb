HTomb = (function(HTomb) {
  "use strict";
  var coord = HTomb.Utils.coord;

  HTomb.Things.define({
    template: "Spell",
    name: "spell",
    getCost: function() {
      return 10;
    },
    onList: function() {
      let descrip = this.describe()+" ("+this.getCost()+")";
      if (this.getCost()>this.caster.mana) {
        descrip = "%c{gray}"+descrip;
      }
      return descrip;
    },
  });

  HTomb.Things.defineSpell({
    template: "RaiseZombie",
    name: "raise zombie",
    getCost: function() {
      let cost = [10,15,20,25,30,35,40];
      let c = this.caster.entity;
      if (c.master===undefined) {
        return cost[0];
      }
      else if (c.master.minions.length<cost.length-1) {
        return cost[c.master.minions.length];
      }
      else {
        return cost[cost.length-1];
      }
    },
    spendMana: function() {
      this.caster.mana-=this.getCost();
    },
    cast: function() {
      let caster = this.caster;
      var c = caster.entity;
      var that = this;
      var items, zombie, i;
      function raiseZombie(x,y,z) {
        if (that.validTile(x,y,z)) {
          HTomb.Particles.addEmitter(c.x,c.y,c.z,{fg: "black", dist: 1, alpha: 1, fade: 0.9,});
          //HTomb.Particles.addEmitter(x,y,z,{fg: "black", dist: 1, alpha: 1, fade: 0.9});
          HTomb.Particles.addEmitter(x,y,z,{fg: "black", dist: 4, alpha: 1, v: -0.5, fade: 0.9});
          // cast directly on a corpse
          items = HTomb.World.items[coord(x,y,z)]
          if (items) {
            if (items.containsAny("Corpse")) {
              let corpse = items.takeOne("Corpse");
              that.spendMana();
              corpse.despawn();
              zombie = HTomb.Things.Zombie();
              zombie.place(x,y,z);
              HTomb.Things.Minion().addToEntity(zombie);
              zombie.minion.setMaster(caster.entity);
              zombie.ai.setTeam(caster.entity.ai.team);
              caster.entity.master.addMinion(zombie);
              zombie.ai.acted = true;
              HTomb.GUI.sensoryEvent("The corpse stirs and rises...",x,y,z);
              HTomb.Time.turn();
              return;
            }
          }
          // if it's a tombstone
          items = HTomb.World.items[coord(x,y,z-1)];
          if (items) {
            if (items.containsAny("Corpse")) {
              let corpse = items.takeOne("Corpse");
              that.spendMana();
              corpse.despawn();
              if (HTomb.World.tiles[z-1][x][y]===HTomb.Tiles.WallTile) {
                HTomb.World.tiles[z-1][x][y]=HTomb.Tiles.UpSlopeTile;
              }
              zombie = HTomb.Things.Zombie();
              zombie.place(x,y,z-1);
              HTomb.Things.Minion().addToEntity(zombie);
              zombie.minion.setMaster(caster.entity);
              zombie.ai.setTeam(caster.entity.ai.team);
              caster.entity.master.addMinion(zombie);
              let task = HTomb.Things.ZombieEmergeTask({assigner: caster.entity}).place(x,y,z);
              task.task.assignTo(zombie);
              zombie.ai.acted = true;
              HTomb.GUI.sensoryEvent("You hear an ominous stirring below the earth...",x,y,z);
              HTomb.Time.turn();
              return;
            }
          }
        } else {
          HTomb.GUI.pushMessage("Can't cast the spell there.");
        }
      }
      function myHover(x, y, z) {
        if (HTomb.World.explored[z][x][y]!==true) {
          HTomb.GUI.Panels.menu.middle = ["%c{orange}Unexplored tile."];
          return;
        }
        if (that.validTile(x,y,z)) {
          HTomb.GUI.Panels.menu.middle = ["%c{lime}Raise a zombie here."];
        } else {
          HTomb.GUI.Panels.menu.middle = ["%c{orange}Select a tile with a tombstone or corpse."];
        }
      }
      HTomb.GUI.selectSquare(c.z,raiseZombie,{
        hover: myHover
      });
    },
    validTile: function(x,y,z) {
      if (HTomb.World.explored[z][x][y]!==true) {
        return false;
      }
      if (HTomb.World.features[coord(x,y,z)] && HTomb.World.features[coord(x,y,z)].template==="Tombstone" && HTomb.World.items[coord(x,y,z-1)] && HTomb.World.items[coord(x,y,z-1)].containsAny("Corpse")) {
        return true;
      }
      if (HTomb.World.items[coord(x,y,z)] && HTomb.World.items[coord(x,y,z)].containsAny("Corpse")) {
        return true;
      }
      return false;
    }
  });

  //Special zombie dig task?
  HTomb.Things.defineTask({
    template: "ZombieEmergeTask",
    name: "dig",
    bg: "#884400",
    validTile: function() {
      // this thing is going to be special...it should keep respawning if thwarted
      return true;
    },
    work: function(x,y,z) {
      let f = HTomb.World.features[HTomb.Utils.coord(x,y,z)];
      // There is a special case of digging upward under a tombstone...
      if (f && f.template==="Tombstone") {
        if (f.integrity===null || f.integrity===undefined) {
          f.integrity=10;
        }
        f.integrity-=1;
        this.assignee.ai.acted = true;
        if (f.integrity<=0) {
          f.explode();
          HTomb.GUI.sensoryEvent("A zombie emerges from the earth!",x,y,z);
          HTomb.World.tiles[z][x][y] = HTomb.Tiles.DownSlopeTile;
          this.completeWork(x,y,z);
          HTomb.World.validate.cleanNeighbors(x,y,z);
        }
      }
    }
  });

  return HTomb;
})(HTomb);
