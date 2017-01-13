// This submodule defines the templates for creature Entities
HTomb = (function(HTomb) {
  "use strict";

  var b = HTomb.Things;

  HTomb.Things.defineCreature({
      template: "Necromancer",
      name: "necromancer",
      symbol: "@",
      fg: "#DD66FF",
      behaviors: {
        Movement: {swims: true},
        Inventory: {},
        Sight: {},
        AI: {
          team: "PlayerTeam"
        },
        Master: {tasks: ["DigTask","BuildTask","ConstructTask","DismantleTask","PatrolTask","FurnishTask","ForbidTask","Undesignate"]},
        //Master: {tasks: ["DigTask","BuildTask","CraftTask","DismantleTask","PatrolTask","FarmTask","WorkshopTask","ForbidTask","HoardTask","Undesignate"]},
        SpellCaster: {spells: ["RaiseZombie","AcidBolt"]},
        Body: {
          materials: {
            Flesh: 10,
            Bone: 10
          }
        },
        Combat: {
          accuracy: 1,
          evasion: 2,
          damage: {
            Slashing: 2
          }
        }
      }
  });

  HTomb.Things.defineCreature({
    template: "Dryad",
    name: "dryad",
    symbol: "n",
    fg: "#44AA44",
    onDefine: function(args) {
      HTomb.Events.subscribe(this, "Destroy");
    },
    onDestroy: function(event) {
      let t = event.entity;
      if (t.template==="Tree") {
        let x = t.x;
        let y = t.y;
        let z = t.z;
        if (HTomb.Utils.dice(1,25)===1) {
          let trees = HTomb.Utils.where(HTomb.World.features,
            function(e) {
              let d = HTomb.Path.quickDistance(e.x,e.y,e.z,x,y,z);
              return (e.template==="Tree" && d>=5 && d<=9);
            }
          );
          if (trees.length>0) {
            let tree = HTomb.Path.closest(x,y,z,trees)[0];
            let dryad = HTomb.Things.Dryad();
            dryad.place(tree.x,tree.y,tree.z);
            HTomb.Particles.addEmitter(tree.x,tree.y,tree.z,{
              fg: "#88AA00",
              chars: ["\u2663","\u2660","\u2698","\u273F"],
              dist: 3,
              alpha: 1,
              v: -0.5,
              fade: 0.9
            });
            HTomb.GUI.sensoryEvent("An angry dryad emerges from a nearby tree!",tree.x,tree.y,tree.z,"red");
          }
        }
      }
    },
    behaviors: {
      AI: {
        team: "AngryNatureTeam"
      },
      Movement: {swims: true},
      Sight: {},
      Combat: {
        accuracy: 0,
        damage: {
          Crushing: 1
        }
      },
      Body: {
        materials: {
          Wood: 10,
          Flesh: 10,
          Bone: 10
        }
      }
    }
  });

  HTomb.Things.defineCreature({
    template: "Zombie",
    name: "zombie",
    symbol: "z",
    fg: "#99FF66",
    behaviors: {
      AI: {
        goals: ["ServeMaster"]
      },
      Movement: {swims: true},
      Sight: {},
      Worker: {},
      Inventory: {capacity: 2},
      Combat: {
        accuracy: 1,
        damage: {
          Slashing: 1,
          Crushing: 1
        }
      },
      Body: {
        materials: {
          Flesh: {
            max: 10,
            needs: 1
          },
          Bone: 10
        }
      }
    }
  });

  var totalGhouls = 0;
  HTomb.Things.defineCreature({
    template: "Ghoul",
    name: "ghoul",
    symbol: "z",
    fg: "#FF5522",
    behaviors: {
      AI: {
        team: "GhoulTeam",
        goals: ["LongRangeRoam"]
      },
      Movement: {swims: true},
      Sight: {},
      Worker: {},
      Inventory: {capacity: 2},
      Combat: {
        accuracy: 0,
        damage: {
          Slashing: 1
        }
      },
      Body: {
        materials: {
          Flesh: 10,
          Bone: 10
        }
      }
    },
    onDefine: function(args) {
      HTomb.Events.subscribe(this, "TurnBegin");
    },
    onTurnBegin: function(args) {
      if (HTomb.Utils.dice(1,120)===1) {
        let graves = HTomb.Utils.where(HTomb.World.features,function(e) {
          if (e.template==="Tombstone") {
            let x = e.x;
            let y = e.y;
            let z = e.z;
            if (HTomb.World.tasks[HTomb.Utils.coord(x,y,z)]) {
              return false;
            }
            if (HTomb.World.items[HTomb.Utils.coord(x,y,z-1)] && HTomb.World.items[HTomb.Utils.coord(x,y,z-1)].containsAny("Corpse")) {
              return true;
            }
          }
          return false;
        });
        HTomb.Utils.shuffle(graves);
        let grave = graves[0];
        let x = grave.x;
        let y = grave.y;
        let z = grave.z;
        HTomb.Particles.addEmitter(x,y,z,{fg: "red", dist: 3, alpha: 1, v: -0.5, fade: 0.9});
        grave.explode();
        HTomb.World.tiles[z-1][x][y] = HTomb.Tiles.UpSlopeTile;
        HTomb.World.tiles[z][x][y] = HTomb.Tiles.DownSlopeTile;
        let ghoul = HTomb.Things.Ghoul().place(x,y,z-1);
        HTomb.GUI.sensoryEvent("A ravenous ghoul bursts forth from its grave!",x,y,z,"red");
      }
    }
  });

  HTomb.Things.defineCreature({
    template: "Bat",
    name: "bat",
    symbol: "b",
    fg: "#999999",
    behaviors: {
      AI: {},
      Movement: {flies: true, swims: false},
      Sight: {},
      Combat: {},
      Body: {
        materials: {
          Flesh: 5,
          Bone: 2
        }
      }
    }
  });

  HTomb.Things.defineCreature({
    template: "Spider",
    name: "spider",
    symbol: "s",
    fg: "#BBBBBB",
    behaviors: {
      AI: {},
      Movement: {swims: false},
      Combat: {},
      Body: {
        materials: {
          Flesh: 5,
          Bone: 2
        }
      }
    }
  });

  HTomb.Things.defineCreature({
    template: "DeathCarp",
    name: "death carp",
    symbol: "p",
    fg: "red",
    behaviors: {
      AI: {
        team: "HungryPredatorTeam"
      },
      Movement: {swims: true, walks: false},
      Combat: {
        accuracy: 1,
        damage: {
          Slashing: 2
        }
      },
      Body: {
        materials: {
          Flesh: 10,
          Bone: 10,
          Blood: 10
        }
      }
    },
    onDefine: function() {
      HTomb.Events.subscribe(this, "TurnBegin");
    },
    onTurnBegin: function() {
      if (HTomb.Utils.dice(1,180)===1) {
        let fishes = HTomb.Utils.where(HTomb.World.creatures, function(e) {
          let x = e.x;
          let y = e.y;
          let z = e.z;
          if (HTomb.World.visible[HTomb.Utils.coord(x,y,z)]) {
            return false;
          }
          return (e.template==="Fish");
        });
        if (fishes.length>0) {
          HTomb.Utils.shuffle(fishes);
          let fish = fishes[0];
          let x = fish.x;
          let y = fish.y;
          let z = fish.z;
          fish.destroy();
          HTomb.Things.DeathCarp().place(x,y,z);
          HTomb.GUI.sensoryEvent("A peaceful-looking fish turns out to be a ravenous death carp!",x,y,z,"red");
          console.log("Death carp placed at " + x + " " + y + " " + z);
        }
      }

    }
  });

  HTomb.Things.defineCreature({
    template: "Fish",
    name: "fish",
    symbol: "p",
    fg: "#FF8888",
    behaviors: {
      AI: {},
      Movement: {swims: true, walks: false},
      Combat: {},
      Body: {
        materials: {
          Flesh: 5,
          Bone: 2
        }
      }
    }
  });

  return HTomb;
})(HTomb);
