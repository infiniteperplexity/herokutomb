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
        SpellCaster: {spells: ["RaiseZombie"]},
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
    fg: "#55AA00",
    onDefine: function(args) {
      HTomb.Events.subscribe(this, "Destroy");
    },
    onDestroy: function(event) {
      let t = event.entity;
      if (t.template==="Tree") {
        let x = t.x;
        let y = t.y;
        let z = t.z;
        if (HTomb.Utils.dice(1,5)===1) {
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
              fg: "#55AA00",
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

  HTomb.Things.defineCreature({
    template: "Ghoul",
    name: "ghoul",
    symbol: "z",
    fg: "#FF5522",
    behaviors: {
      AI: {
        team: "GhoulTeam",
        goals: ["HuntDeadThings"]
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
    }
  });

  HTomb.Things.defineCreature({
    template: "Bat",
    name: "bat",
    symbol: "b",
    fg: "#999999",
    behaviors: {
      AI: {},
      Movement: {flies: true},
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
      Movement: {},
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
