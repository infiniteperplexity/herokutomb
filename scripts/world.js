HTomb = (function(HTomb) {
  "use strict";
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var NLEVELS = HTomb.Constants.NLEVELS;
  var coord = HTomb.Utils.coord;

  function grid3d() {
    var grid = [];
    for (let k=0; k<NLEVELS; k++) {
      grid.push([]);
      for (let i=0; i<LEVELW; i++) {
        grid[k].push([]);
      }
    }
    return grid;
  }

  HTomb.World.things = [];
  HTomb.World.tiles = grid3d();
  HTomb.World.explored = grid3d();
  HTomb.World.lit = grid3d();
  HTomb.World.lights = [];
  HTomb.World.visible = {};
  HTomb.World.creatures = {};
  HTomb.World.items = {};
  HTomb.World.features = {};
  HTomb.World.zones = {};
  HTomb.World.portals = {};
  HTomb.World.covers = {};
  console.timeEnd("lists");

  HTomb.World.init = function() {
    HTomb.World.fillTiles();
    HTomb.World.generators.bestSoFar();
  };

  // Add void tiles to the boundaries of the level
  HTomb.World.fillTiles = function() {
    for (var x=0; x<LEVELW; x++) {
      for (var y=0; y<LEVELH; y++) {
        for (var z=0; z<NLEVELS; z++) {
          if (x===0 || x===LEVELW-1 || y===0 || y===LEVELH-1 || z===0 || z===NLEVELS-1) {
            HTomb.World.tiles[z][x][y] = HTomb.Tiles.VoidTile;
          } else {
            HTomb.World.tiles[z][x][y] = HTomb.Tiles.EmptyTile;
          }
        }
      }
    }
  };
  // Run this to make sure the basic rules of adjacent terrain are followed

  HTomb.World.validate = {
    dirty: {},
    cleaned: {}
  };
  HTomb.World.validate.clean = function() {
    //lighting can only be done all at once?
    HTomb.World.validate.lighting();
    for (var crd in this.dirty) {
      if (this.cleaned[crd]) {
        continue;
      }
      var d = HTomb.Utils.decoord(crd);
      var x = d[0];
      var y = d[1];
      var z = d[2];
      this.square(x,y,z);
    }
    this.dirty = {};
    this.cleaned = {};
  };
  HTomb.World.validate.square = function(x,y,z) {
    this.slopes(x,y,z);
    this.floors(x,y,z);
    this.falling(x,y,z);
    this.liquids(x,y,z);
    this.cleaned[coord(x,y,z)] = true;
  }
  HTomb.World.validate.all = function() {
    this.dirty = {};
    for (var x=1; x<LEVELW-1; x++) {
      for (var y=1; y<LEVELH-1; y++) {
        for (var z=1; z<NLEVELS-1; z++) {
          this.square(x,y,z);
        }
      }
    }
  };
  HTomb.World.validate.dirtify = function(x,y,z) {
    this.dirty[coord(x,y,z)]===true;
  };
  HTomb.World.validate.dirtyNeighbors = function(x,y,z) {
    this.dirtify(x,y,z);
    var dx;
    var dy;
    var dz;
    var dirs = HTomb.dirs[26];
    for (var i=0; i<dirs.length; i++) {
      dx = x+dirs[i][0];
      dy = y+dirs[i][1];
      dz = z+dirs[i][2];
      this.dirtify(dx,dy,dz);
    }
  }
  HTomb.World.validate.cleanNeighbors = function(x,y,z) {
    this.dirtyNeighbors(x,y,z);
    this.clean();
  }
  HTomb.World.validate.slopes = function(x,y,z) {
    // validate.all slopes
    var t = HTomb.World.tiles[z][x][y];
    if (t===HTomb.Tiles.UpSlopeTile) {
      if (HTomb.World.tiles[z+1][x][y].fallable===true) {
        HTomb.World.tiles[z+1][x][y] = HTomb.Tiles.DownSlopeTile;
      }
    } else if (t===HTomb.Tiles.DownSlopeTile) {
      t = HTomb.World.tiles[z-1][x][y];
      if (t!==HTomb.Tiles.UpSlopeTile) {
        if (t.solid) {
          HTomb.World.tiles[z][x][y] = HTomb.Tiles.FloorTile;
        } else {
          HTomb.World.tiles[z][x][y] = HTomb.Tiles.EmptyTile;
        }
      }
    }
  };
  HTomb.World.validate.floors = function(x,y,z) {
    if (HTomb.World.tiles[z][x][y]===HTomb.Tiles.EmptyTile && HTomb.World.tiles[z-1][x][y].solid) {
      HTomb.World.tiles[z][x][y] = HTomb.Tiles.FloorTile;
    }
  };
  HTomb.World.validate.falling = function(x,y,z) {
    if (HTomb.World.tiles[z][x][y].fallable) {
      var creature = HTomb.World.creatures[coord(x,y,z)];
      if (creature && creature.movement.flies!==true) {
        creature.fall();
      }
      var items = HTomb.World.items[coord(x,y,z)] || [];
      while (items && items.length>0) {
        items[0].fall();
      }
    }
  };
  HTomb.World.validate.liquids = function(x,y,z) {
    var t = HTomb.World.covers[coord(x,y,z)];
    if (t && t.liquid) {
      t.liquid.flood(x,y,z);
    }
  };


  //callback is optional
  HTomb.World.creaturesWithin = function(x,y,z,r,callb) {
    var creatures = [];
    for (var c in HTomb.World.creatures) {
      var cr = HTomb.World.creatures[c];
      if (callb && callb(cr)===false) {
        continue;
      } else {
        if (HTomb.Path.distance(x,y,cr.x,cr.y) && Math.abs(z-cr.z)<=1) {
          creatures.push(cr);
        }
      }
    }
    return creatures;
  };

   HTomb.World.creaturesWithin = function(x,y,z,r,callb) {
     var creatures = [];
     for (var i=-r; i<=r; i++) {
       for (var j=-r; j<=r; j++) {
         var cr = HTomb.World.creatures[coord(x+i,y+j,z)];
         if (cr && (callb===undefined || callb(cr))) {
           creatures.push(cr);
         }
       }
     }
     return creatures;
   };



  return HTomb;
})(HTomb);
