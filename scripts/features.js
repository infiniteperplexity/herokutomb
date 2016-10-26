// Features are large, typically immobile objects
HTomb = (function(HTomb) {
  "use strict";
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var coord = HTomb.Utils.coord;

  HTomb.Things.defineFeature({
    template: "Tombstone",
    name: "tombstone",
    symbol: ["\u271D", "\u271E","\u271F","\u2670","\u2671"],
    fg: "#AAAAAA",
    randomColor: 5,
    onPlace: function(x,y,z) {
      // Bury a corpse beneath the tombstone
      HTomb.Things.create("Corpse").place(x,y,z-1);
    },
    explode: function() {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      this.destroy();
      var t = HTomb.World.covers[coord(x,y,z)];
      if (t) {
        delete HTomb.World.covers[coord(x,y,z)];
      }
      var cr = HTomb.World.creatures[coord(x,y,z-1)];
      if (cr) {
        HTomb.GUI.sensoryEvent(cr.describe() + " bursts forth from the ground!",x,y,z);
      }
      for (var i=0; i<ROT.DIRS[8].length; i++) {
        var x1 = ROT.DIRS[8][i][0]+x;
        var y1 = ROT.DIRS[8][i][1]+y;
        if (HTomb.World.tiles[z][x1][y1].solid!==true) {
          if (Math.random()<0.4) {
            var rock = HTomb.Things.Rock();
            rock.item.n = 1;
            rock.place(x1,y1,z);
          }
        }
      }
    }
  });

  HTomb.Things.defineFeature({
    template: "Tree",
    name: "tree",
    //symbol: "\u2663",
    symbol: ["\u2663","\u2660"],
    fg: "#77BB00",
    randomColor: 10,
    yields: {WoodPlank: {n: 2, nozero: true}}
  });

  HTomb.Things.defineFeature({
    template: "Shrub",
    name: "shrub",
    symbol: "\u2698",
    fg: "#779922",
    randomColor: 15
  });

  HTomb.Things.defineFeature({
    template: "Seaweed",
    name: "seaweed",
    plural: true,
    symbol: ["\u2648","\u2724","\u060F"],
    fg: "#779922",
    randomColor: 20
  });

  HTomb.Things.defineFeature({
    template: "Puddle",
    name: "puddle",
    symbol: "~",
    fg: "#0088DD",
    randomColor: 20
  });

  HTomb.Things.defineFeature({
    template: "Throne",
    name: "throne",
    craftable: true,
    //symbol: "\u2655",
    symbol: "\u265B",
    fg: "#CCAA00",
    ingredients: {GoldOre: 1}
  });

  HTomb.Things.defineFeature({
    template: "ScryingGlass",
    craftable: true,
    name: "scrying glass",
    symbol: "\u25CB",
    fg: "cyan",
    ingredients: {Moonstone: 1}
  });

  HTomb.Things.defineFeature({
    template: "Torch",
    name: "torch",
    craftable: true,
    symbol: "\u2AEF",
    fg: "yellow",
    behaviors: {PointLight: {}},
    ingredients: {WoodPlank: 1}
  });

  HTomb.Things.defineFeature({
    template: "Door",
    name: "door",
    locked: false,
    symbol: "\u25A5",
    fg: "#BB9922",
    craftable: true,
    activate: function() {
      if (this.locked) {
        HTomb.GUI.sensoryEvent("Unlocked " + this.describe()+".",this.x, this.y, this.z);
        this.locked = false;
        this.solid = false;
        this.name = "door";
        this.symbol = "\u25A5";
      } else {
        HTomb.GUI.sensoryEvent("Locked " + this.describe()+".",this.x,this.y,this.z);
        this.locked = true;
        this.solid = true;
        this.name = "locked door";
        this.symbol = "\u26BF";
      }
      HTomb.GUI.reset();
    },
    solid: false,
    opaque: true,
    ingredients: {WoodPlank: 1}
  });

  HTomb.Things.defineFeature({
    template: "Excavation",
    name: "excavation",
    incompleteSymbol: "\u2717",
    incompleteFg: HTomb.Constants.BELOW,
    onPlace: function(f) {
      var tiles = HTomb.World.tiles;
      var EmptyTile = HTomb.Tiles.EmptyTile;
      var FloorTile = HTomb.Tiles.FloorTile;
      var WallTile = HTomb.Tiles.WallTile;
      var UpSlopeTile = HTomb.Tiles.UpSlopeTile;
      var DownSlopeTile = HTomb.Tiles.DownSlopeTile;
      var x = this.x;
      var y = this.y;
      var z = this.z;
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
      if(HTomb.World.covers[coord(x,y,z)]) {
        delete HTomb.World.covers[coord(x,y,z)];
      }
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
    onPlace: function() {
      var tiles = HTomb.World.tiles;
      var EmptyTile = HTomb.Tiles.EmptyTile;
      var FloorTile = HTomb.Tiles.FloorTile;
      var WallTile = HTomb.Tiles.WallTile;
      var UpSlopeTile = HTomb.Tiles.UpSlopeTile;
      var DownSlopeTile = HTomb.Tiles.DownSlopeTile;
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var t = tiles[z][x][y];
      var cover = HTomb.World.covers[coord(x,y,z)];
      if (cover) {
        delete HTomb.World.covers[coord(x,y,z)];
      }
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

  HTomb.Types.define({
    template: "Cover",
    name: "cover",
    liquid: false,
    stringify: function() {
      return HTomb.Types.templates[this.parent].types.indexOf(this);
    },
    shimmer: function() {
      var bg = ROT.Color.fromString(this.bg);
      bg = ROT.Color.randomize(bg,[bg[0]/16, bg[1]/16, bg[2]/16]);
      bg = ROT.Color.toHex(bg);
      return bg;
    },
    darken: function() {
      var bg = ROT.Color.fromString(this.bg);
      bg = ROT.Color.multiply(bg,[72,128,192]);
      bg = ROT.Color.toHex(bg);
      return bg;
    },
    flood: function(x,y,z) {
      var t = HTomb.World.covers[coord(x,y,z-1)];
      var water;
      if (HTomb.World.tiles[z-1][x][y].solid!==true && t.liquid===undefined) {
        HTomb.World.covers[coord(x,y,z)] = this;
        this.flood(x,y,z);
        // if we flood below, don't flood to the sides...should this happen each turn?
        return;
      }
      var neighbors = HTomb.Tiles.neighbors(x,y,4);
      for (var i=0; i<neighbors.length; i++) {
        x = neighbors[i][0];
        y = neighbors[i][1];
        t = HTomb.World.covers[coord(x,y,z)];
        if (HTomb.World.tiles[z][x][y].solid===true || (t && t.liquid)) {
          continue;
        }
        HTomb.World.covers = this;
        this.flood(x,y,z);
      }
    }
  });

  HTomb.Types.defineCover({
    template: "Water",
    name: "water",
    symbol: "~",
    flowSymbol: "\u2248",
    liquid: true,
    fg: HTomb.Constants.WATERFG || "#3388FF",
    bg: HTomb.Constants.WATERBG || "#1144BB"
  });

  HTomb.Types.defineCover({
    template: "Lava",
    name: "lava",
    symbol: "~",
    flowSymbol: "\u2248",
    liquid: true,
    fg: "#FF8833",
    bg: "#DD4411"
  });

  HTomb.Types.defineCover({
    template: "Grass",
    name: "grass",
    symbol: '"',
    fg: HTomb.Constants.GRASSFG ||"#668844",
    bg: HTomb.Constants.GRASSBG || "#334422"
  });

  HTomb.Types.defineCover({
    template: "Road",
    name: "road",
    symbol: '\u25CB',
    fg: HTomb.Constants.WALLFG,
    bg: HTomb.Constants.WALLBG
  });

  return HTomb;
})(HTomb);
