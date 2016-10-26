// The FOV submodule contains vision algorithms, which should be highly optimized
HTomb = (function(HTomb) {
  "use strict";
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var NLEVELS = HTomb.Constants.NLEVELS;
  var coord = HTomb.Utils.coord;
  var grid;
  var x0,y0,z0,r0;

  var passlight = function(x,y) {
      //constrain to the grid
      if (x<=0 || x>=LEVELW-1 || y<=0 || y>=LEVELH-1) {
        return false;
      }
      //curve the edges
      if (Math.sqrt((x-x0)*(x-x0)+(y-y0)*(y-y0)) > r0) {
        return false;
      }
      //only opaque tiles block light
      //if this ever changes use a different FOV
      if (grid[x][y].opaque===true) {
        return false;
      }
      var f = HTomb.World.features[coord(x,y,z0)];
      if (f && f.opaque===true) {
        return false;
      }
      return true;
  };

  var show = function(x,y,r,v) {
    var visible = HTomb.World.visible;
    var explored = HTomb.World.explored;
    visible[coord(x,y,z0)] = true;
    explored[z0][x][y] = true;
    if (grid[x][y].zview===+1) {
      explored[z0+1][x][y] = true;
    } else if (grid[x][y].zview===-1) {
      explored[z0-1][x][y] = true;
    }
  };

  var caster = new ROT.FOV.PreciseShadowcasting(passlight);

  HTomb.FOV.resetVisible = function() {
    var visible = HTomb.World.visible;
    for (var crd in visible) {
      delete visible[crd];
    }
  };
  HTomb.FOV.findVisible = function(x,y,z,r) {
    x0 = x;
    y0 = y;
    r0 = r;
    z0 = z;
    grid = HTomb.World.tiles[z];
    caster.compute(x,y,r,show);
  };

  // pass the ambient light level
  HTomb.FOV.ambientLight = function(light) {
    for (var x=1; x<LEVELW-1; x++) {
      for (var y=1; y<LEVELH-1; y++) {
        var blocked = false;
        for (var z=NLEVELS-2; z>0; z--) {
          z0 = z;
          grid = HTomb.World.tiles[z];
          if (blocked===false) {
            HTomb.World.lit[z][x][y] = -light;
            for (var i=0; i<4; i++) {
              // illuminate neighboring squares if unblocked
              var d = ROT.DIRS[4][i];
              var dx = d[0];
              var dy = d[1];
              if (passlight(x+dx,y+dy)) {
                // illuminate it halfway unless
                if (HTomb.World.lit[z][x+dx][y+dy]===undefined) {
                  HTomb.World.lit[z][x+dx][y+dy] = 0;
                }
                HTomb.World.lit[z][x+dx][y+dy] = Math.min(HTomb.World.lit[z][x+dx][y+dy],-0.75*light);
              }
            }
            if (HTomb.World.tiles[z][x][y].zview!==-1) {
              blocked = true;
            }
          } else {
            // maybe not have zero as the lowest light level?
            var darkest = 64;
            if (HTomb.World.lit[z][x][y]===undefined) {
              HTomb.World.lit[z][x][y] = 0;
            }
            HTomb.World.lit[z][x][y] = Math.min(HTomb.World.lit[z][x][y],-darkest);
          }
        }
      }
    }
  };

  var lightLevel = 255;
  HTomb.FOV.pointLights = function() {
    for (var l=0; l<HTomb.World.lights.length; l++) {
      var light = HTomb.World.lights[l];
      var x = light.point.x;
      var y = light.point.y;
      var z = light.point.z;
      if (light.point.item ) {
        let cont = light.point.item.containerXYZ();
        if (cont[0]!==null) {
          x = cont[0];
          y = cont[1];
          z = cont[2];
        }
      }
      lightLevel = light.level;
      illuminate(x,y,z,light.range); //all lights 10 for now
    }
  };

  // we need some way for the light to fade over time...
  function illuminate(x,y,z,r) {
    x0 = x;
    y0 = y;
    r0 = r;
    z0 = z;
    grid = HTomb.World.tiles[z];
    caster.compute(x,y,r,light);
  }

  function light(x,y,r,v) {
    var d = Math.sqrt((x-x0)*(x-x0)+(y-y0)*(y-y0));
    var thisLevel = (r) ? Math.min(-lightLevel+(d*10),-1) : -lightLevel;
    HTomb.World.lit[z0][x][y] = Math.min(HTomb.World.lit[z0][x][y],thisLevel);
    if (HTomb.World.tiles[z0+1][x][y].zview===-1) {
      HTomb.World.lit[z0+1][x][y] = Math.min(HTomb.World.lit[z0+1][x][y],thisLevel);
    }
    if (grid[x][y].zview===-1) {
      HTomb.World.lit[z0-1][x][y] = Math.min(HTomb.World.lit[z0-1][x][y],thisLevel);
    }
  }

  HTomb.FOV.resolveLights = function() {
    for (var x=1; x<LEVELW-1; x++) {
      for (var y=1; y<LEVELH-1; y++) {
        for (var z=1; z<NLEVELS-1; z++) {
          HTomb.World.lit[z][x][y] = -Math.round(HTomb.World.lit[z][x][y]);
        }
      }
    }
  };

  HTomb.World.validate.lighting = function() {
    HTomb.FOV.ambientLight(HTomb.Time.dailyCycle.lightLevel());
    HTomb.FOV.pointLights();
    HTomb.FOV.resolveLights();
  };

  HTomb.FOV.shade = function(color,x,y,z) {
    var light = HTomb.World.lit[z][x][y];
    var c = ROT.Color.fromString(color);
    c[0] = Math.max(0,Math.round(c[0]-255+light));
    c[1] = Math.max(0,Math.round(c[1]-255+light));
    c[2] = Math.max(0,Math.round(c[2]-255+light));
    c = ROT.Color.toHex(c);
    return c;
  };

  return HTomb;
})(HTomb
);
