HTomb.Path.zones = grid3d();

function combinations(a) {
    let fn = function(n, src, got, all) {
        if (n == 0) {
            if (got.length > 0) {
                all[all.length] = got;
            }
            return;
        }
        for (let j = 0; j < src.length; j++) {
            fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
        }
        return;
    }
    let all = [];
    for (let i = 0; i < a.length; i++) {
        fn(i, a, [], all);
    }
    all.push(a);
    return all;
}
HTomb.Path.Regions = {};
HTomb.Path.Regions.reset = function() {
  this.modes = ["walks","flies","swims","climbs"];
  let combos = combinations(this.modes);
  this.templates = [];
  this.canMove = HTomb.World.templates.movement.canMove;
  for (let i=0; i<combos.length; i++) {
    let template = {};
    for (let j=0; j<this.modes.length; j++) {
      let mode = this.modes[j];
      if (combos[i].indexOf(j)!==-1) {
        template[mode] = true;
      } else {
        template[mode] = false;
      }
    }
    templates.push(template);
  }
  this.maps = [];
  for (let i=0; i<this.templates.length; i++) {

  }
  // might also toggle whether we respect forbidden zones?
};
HTomb.Path.Regions.validate = function() {

  for (let i=0; i<this.templates.length; i++) {

  }
}

HTomb.Path.flood = function(x,y,z,callb) {
  let c = coord(x,y,z);
  let tocheck = [c];
  let checked = {};
  let dirs = HTomb.dirs[26];
  let squares = [];
  while (tocheck.length>0) {
    let next = tocheck.pop();
    if (checked[next]) {
      continue;
    }
    checked[next] = true;
    let xyz = decoord(next);
    squares.push(xyz);
    for (let i=0; i<dirs.length; i++) {
      let square = [xyz[0]+dirs[i][0],xyz[1]+dirs[i][1],xyz[2]+dirs[i][2]];
      if (callb(...square) {
        tocheck.push(coord(...square));
      }
    }
  }
  return squares;
};

HTomb.Path.floodRegions = function(callb) {
  console.time("floodFill");
  let coord = HTomb.Utils.coord;
  let decoord = HTomb.Utils.decoord;
  let LEVELW = HTomb.Constants.LEVELW;
  let LEVELH = HTomb.Constants.LEVELH;
  let NLEVELS = HTomb.Constants.NLEVELS;
  function defaultPassable(x,y,z) {
    if (x<0 || x>=LEVELW || y<0 || y>=LEVELH || z<0 || z>=NLEVELS) {
      return false;
    }
    let t = HTomb.World.tiles[z][x][y];
    return (t.solid===undefined && t.fallable===undefined);
  }
  callb = callb || defaultPassable;
  let checked = {};
  let regions = {};
  let inverse = [];
  let region = 0;
  let regionSize = 0;
  let dirs = HTomb.dirs[26];
  for (let x=1; x<LEVELW-1; x++) {
    for (let y=1; y<LEVELH-1; y++) {
      for (let z=1; z<NLEVELS-1; z++) {
        let c = coord(x,y,z);
        if (checked[c]) {
          continue;
        }
        if (callb(x,y,z,x,y,z)===false) {
          continue;
        }
        if (regionSize) {
          console.log("region " + region + " contains " + regionSize + " squares.");
        }
        regionSize = 0;
        region+=1;
        inverse.push([]);
        let tocheck = [c];
        while (tocheck.length>0) {
          let next = tocheck.pop();
          if (checked[next]) {
            continue;
          }
          regions[next] = region;
          inverse[region].push(next);
          regionSize+=1;
          checked[next] = true;
          let xyz = decoord(next);
          for (let i=0; i<dirs.length; i++) {
            let square = [xyz[0]+dirs[i][0],xyz[1]+dirs[i][1],xyz[2]+dirs[i][2]];
            if (callb(...square,...xyz)) {
              tocheck.push(coord(...square));
            }
          }
        }
      }
    }
  }
  console.log("region " + region + " contains " + regionSize + " squares.");
  console.timeEnd("floodFill");
  return [regions,inverse];
};

HTomb.Path.testRegions(x,y,z,regions,callb) {
  squares = [];
  for (let i=0; i<dirs.length; i++) {
    squares.push([x+dirs[i][0],y+dirs[i][1],z+dirs[i][2]]);
    }
  }
  let merges = [];
  let splits = {};
  for (let i=0; i<squares.length-1; i++) {
    for (let j=i+1; j<squares.length; j++) {
      let one = squares[i];
      let two = squares[j];
      let c1 = coord(...one);
      let c2 = coord(...two);
      let path = HTomb.Path.aStar(one[0],one[1],one[2],two[0],two[1],two[2],callb);
      if (!path && regions[c1]===regions[c2]) {
        splits[c1] = true;
        splits[c2] = true;
        //we need a "dirtified" flood fill method
      } else if (path && regions[c1]===regions[c2]) {
        merges.push([rec1,c2]);
        // a simple set of swaps
      }
    }
  }
};
