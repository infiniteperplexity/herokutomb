HTomb = (function(HTomb) {
  "use strict";
  // alright
  let width = 64;
  let height = 32;
  let z = 1;
  let map = [];
  let zombies = [];
  let necro = null;

  HTomb.Intro = {};

  HTomb.Intro.setup = function() {
    HTomb.World.fillTiles();
    for (let x=1; x<width+1; x++) {
      for (let y=1; y<height+1; y++) {
        HTomb.World.tiles[z][x][y] = HTomb.Tiles.WallTile;
      }
    }
    // only works well if height and width are odd...let's leave that for now
    let maze = new ROT.Map.EllerMaze(width,height);
    maze.create(function(x,y,val) {
      if (val===0) {
        HTomb.Things.DigTask().place(z,x+1,y+1);
        //HTomb.World.tiles[z][x+1][y+1] = HTomb.Tiles.FloorTile;
      }
    });
    let roomWidth = 9;
    let roomHeight = 7;
    for (let x=0; x<roomWidth; x++) {
      for (let y=0; y<roomHeight; y++) {
        HTomb.World.tiles[z][Math.ceil(x+width/2-roomWidth/2)][Math.ceil(y+height/2-roomHeight/2)] = HTomb.Tiles.FloorTile;
      }
    }
    necro = HTomb.Things.Necromancer();
    necro.place(Math.floor(width/2),Math.floor(height/2),z);
    for (let i=0; i<4; i++) {
      let zombie = HTomb.Things.Zombie();
      zombies.push(zombie);
      let xyz = HTomb.Tiles.randomEmptyNeighbor(necro.x,necro.y,necro.z);
      zombie.place(xyz[0],xyz[1],xyz[2]);
    }
  };
  HTomb.Intro.getTiles = function() {
    let grid = [];
    for (let y=1; y<height; y++) {
      let line = [];
      for (let x=1; x<width; x++) {
        let t = HTomb.World.tiles[z][x][y];
        let c = HTomb.World.creatures[HTomb.Utils.coord(x,y,z)];
        if (c) {
          line.push([c.symbol, c.fg, "black"]);
        } else {
          line.push([t.symbol, t.fg, "black"]);
        }
      }
      grid.push(line);
    }
    return grid;
  };
  HTomb.Intro.tick = function() {
  };
  HTomb.Intro.reset = function() {
  };

  return HTomb;
})(HTomb);
  /*var maze = new ROT.Map.EllerMaze(width,height);
  maze.create(function(x0,y0,val) {
    if (val===0) {
      HTomb.World.tiles[z][x+x0][y+y0] = HTomb.Tiles.FloorTile;
      HTomb.World.validate.dirtify(x+x0,y+y0,z);
    }
  });

  let graphic = [];
  for (let i=0; i<16; i++) {
    graphic.push("");
    for (let j=0; j<64; j++) {
      let sym = " ";
      if (i===8 && j===32) {
        let necro = HTomb.Things.templates.Necromancer;
        sym = "%c{"+necro.fg+"}"+necro.symbol;
      }
      if ((i===4 && j===10)) {
        let zombie = HTomb.Things.templates.Zombie;
        sym = "%c{"+zombie.fg+"}"+zombie.symbol;
      }
      graphic[i]+=sym;
    }
  }*/
