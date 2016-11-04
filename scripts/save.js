// This submodule handles saving the game
HTomb = (function(HTomb) {
  "use strict";
  let LEVELW = HTomb.Constants.LEVELW;
  let LEVELH = HTomb.Constants.LEVELH;
  let NLEVELS = HTomb.Constants.NLEVELS;
  let coord = HTomb.Utils.coord;
  // Global value for the name of the current game
  HTomb.Save.currentGame = "save";
  // a function that takes a text-or-promise-returning function, plus fetch args, and then returns a fetch promise.
  function fetchText(textFunc, url, args) {
    let val = textFunc();
    // if we got actual text...
    if (typeof(val)==="string") {
      args.body = JSON.stringify({json: val});
      console.log(url + " length is " + args.body.length);
      // ...return a fetch promise using that text
      return fetch(url, args);
    } else if (val.then) {
      // if we got a promise of text...
      return val.then(res => {
        args.body = JSON.stringify({json: res});
        // ...chain to a fetch promise
        console.log(url + " length is " + args.body.length);
        return fetch(url, args);
      });
    }
  };
  // stringifies the things list asynchronously and resolves to a text value
  function promiseThings() {
    let totalN = HTomb.World.things.length;
    return new Promise(function(resolve, reject) {
      batchMap(
        function(v, i, a) {
          return HTomb.Save.stringifyThing(v, true);
        },
        HTomb.World.things,
        {
          splitby: 1000,
          progress: function(i) {
            console.log(parseInt(100*i/totalN).toString() + "% complete (" + i + " entities.)");
            HTomb.GUI.Views.progressView(["Stringifying things:",parseInt(100*i/totalN).toString() + "% complete"]);
          },
          then: function(rslt) {
            HTomb.GUI.pushMessage("Finished stringifying " + rslt.length + " entities.");
            let things = rslt.join(',');
            things = '['.concat(things,']');
            resolve(things);
          },
          killif: function() {
            return killsave;
          }
        }
      );
    });
  };
  // synchronously stringify other stuff
  function stringifyOther() {
    let explored = HTomb.Save.stringifyThing(HTomb.World.explored, false);
    let lights = HTomb.Save.stringifyThing(HTomb.World.lights, false);
    let cycle = HTomb.Save.stringifyThing(HTomb.Time.dailyCycle, false);
    let other = '{'.concat(
                '"explored": ', explored, ", ",
                '"lights": ', lights, ", ",
                '"cycle": ', cycle,
                '}'
    );
    return other;
  }
  // returns a function that several rows of stringified tiles
  function stringifyTiles(z1,z2) {
    return function() {
      let levels = HTomb.World.tiles.slice(z1,z2);
      let tiles = HTomb.Save.stringifyThing(levels, false);
      return tiles;
    };
  };

  function stringifyCovers(z1,z2) {
    return function() {
      let levels = HTomb.World.covers.slice(z1,z2);
      let covers = HTomb.Save.stringifyThing(levels, false);
      return covers;
    };
  }

  var killsave = false;
  HTomb.Save.saveGame = function(name) {
    HTomb.Time.lockTime();
    HTomb.GUI.Contexts.locked=true;
    name = name || HTomb.Save.currentGame;
    HTomb.Save.currentGame = name;
    let headers = new Headers();
    headers.append("Content-Type", "application/json;charset=UTF-8");
    let args = {
      method: "POST",
      headers: headers
    }
    killsave = false;
    let promises = [
      fetchText(stringifyTiles(0,7),"/saves/tiles0/"+name+"/",args),
      fetchText(stringifyTiles(8,15),"/saves/tiles8/"+name+"/",args),
      fetchText(stringifyTiles(16,23),"/saves/tiles16/"+name+"/",args),
      fetchText(stringifyTiles(24,31),"/saves/tiles24/"+name+"/",args),
      fetchText(stringifyTiles(32,39),"/saves/tiles32/"+name+"/",args),
      fetchText(stringifyTiles(40,47),"/saves/tiles40/"+name+"/",args),
      fetchText(stringifyTiles(48,55),"/saves/tiles48/"+name+"/",args),
      fetchText(stringifyTiles(56,63),"/saves/tiles56/"+name+"/",args),
      fetchText(stringifyCovers(0,7),"/saves/covers0/"+name+"/",args),
      fetchText(stringifyCovers(8,15),"/saves/covers8/"+name+"/",args),
      fetchText(stringifyCovers(16,23),"/saves/covers16/"+name+"/",args),
      fetchText(stringifyCovers(24,31),"/saves/covers24/"+name+"/",args),
      fetchText(stringifyCovers(32,39),"/saves/covers32/"+name+"/",args),
      fetchText(stringifyCovers(40,47),"/saves/covers40/"+name+"/",args),
      fetchText(stringifyCovers(48,55),"/saves/covers48/"+name+"/",args),
      fetchText(stringifyCovers(56,63),"/saves/covers56/"+name+"/",args),
      fetchText(stringifyOther,"/saves/other/"+name+"/",args),
      fetchText(promiseThings,"/saves/things/"+name+"/",args)
    ];
    Promise.all(promises).then(
      values => {
        for (let i=0; i<values.length; i++) {
          if (values[i].ok===false) {
            console.log("response to " + values[i].url + " not ok");
            console.log("failed: " + reason);
            HTomb.GUI.splash(["Failed to save "+"'"+name+"'."]);
            HTomb.GUI.Contexts.locked=false;
            HTomb.Time.unlockTime();
            return;
          }
        }
        console.log("succeeded: " + values);
        HTomb.GUI.splash(["Finished saving "+"'"+name+"'."]);
        HTomb.GUI.Contexts.locked=false;
        HTomb.Time.unlockTime();
      },
      reason => {
        killsave = true;
        console.log("failed: " + reason);
        HTomb.GUI.splash(["Failed to save "+"'"+name+"'."]);
        HTomb.GUI.Contexts.locked=false;
        HTomb.Time.unlockTime();
      }
    )
  };
  // Helper function to split job and unlock DOM
  function batchMap(func, arr, options) {
    options = options || {};
    let splitby = options.splitby || 1;
    let then = options.then || function() {};
    let progress = options.progress || function(i) {console.log(i);};
    let killif = options.killif || function() {return false};
    let retn = [];
    let count = 0;
    let recurse = function() {
      for (; count<arr.length; count++) {
        if (killif()===true) {
          return;
        }
        retn.push(func(arr[count], count, arr));
        if (count>=arr.length-1) {
          then(retn);
        }
        if (count>0 && count%splitby===0) {
          progress(count);
          count++;
          setTimeout(recurse);
          break;
        }
      }
    };
    recurse();
  }
  // Custom JSON encoding
  HTomb.Save.stringifyThing = function(obj, topLevel) {
    let json = JSON.stringify(obj, function(key, val) {
      if (val===undefined) {
        //console.log("why is val undefined?");
        return undefined;
      } else if (val===null) {
        //console.log("could I just do null normally?");
        return null;
      } else if (key==="container") {
        // skip item reference to ItemContainers
        return undefined;
      }
      // if it has special instructions, use those to stringify
      if (val.stringify) {
        return val.stringify();
        // if it's from the global things table, stringify it normally
      } else if (topLevel===true && val.thingId!==undefined) {
        if (val.template==="Player") {
          console.log("hit the player.");
        }
        topLevel = false;
        let dummy = {};
        let template = HTomb.Things.templates[val.template];
        for (let p in val) {
          if (p==="template" || val[p]!==template[p]) {
            dummy[p] = val[p];
          }
        }
        if (dummy.thingId) {
          delete dummy.thingId;
        }
        return dummy;
      // if it's on the global things table, stringify its ID
      } else if (val.thingId!==undefined) {
        return {tid: val.thingId};
      } else {
        return val;
      }
    }," ");
    return json;
  };
  // End code for saving games

  // Code for listing saved games in directory
  HTomb.Save.getDir = function(callback) {
    getDir(callback);
  };
  function getDir(callback) {
    console.time("get request");
    var file = '/saves';
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (xhttp.status == 200) {
          console.log("Got our JSON, now we should do something with it.");
          console.log(xhttp.responseText);
          callback(xhttp.responseText);
          console.timeEnd("get request");
        } else if (xhttp.status == 400) {
          console.log("There was an error 400");
        } else {
          console.log("Something other than 200 was returned.");
        }
        HTomb.Time.unlockTime();
      }
    };
    xhttp.open("GET", file, true);
    xhttp.send();
  }
  // End code for listing directory contents
  function fetchThen(restoreFunc, url, args) {
    console.log("fetching "+url);
    fetch(url, args).then(res=> {
      console.log("restoring "+url);
      restoreFunc(res.body);
    });
  }
  function restoreThings(json) {
    let tids = [];
    let icontains = [];
    let player = null;
    let things = JSON.parse(json, function (key, val) {
      if (val===null) {
        return null;
      // remove this once parsing is corrected
      } else if (key==="container") {
        return undefined;
      } else if (val.Type!==undefined) {
        // should not require tracking swaps
        return HTomb.Types.templates[val.Type];
      } else if (val.tid!==undefined) {
        tids.push([this,key,val]);
        return {tid: val.tid};
      } else if (val.ItemContainer) {
        // should require tracking swaps
        let ic = new HTomb.ItemContainer();
        ic.parent = this;
        icontains.push([ic]);
        for (let i=0; i<val.ItemContainer.length; i++) {
          // I saw length get messed up sometimes but I'm not sure it still does
          if (val.ItemContainer[i]===undefined) {
            continue;
          }
          ic[i] = val.ItemContainer[i];
          // You have to set length manually it seems
          ic.length=i+1;
          icontains[icontains.length-1].push(val.ItemContainer[i]);
        }
        val.ItemContainer.swappedWith = ic;
        return ic;
      } else if (val.template) {
        let template = HTomb.Things.templates[val.template];
        let dummy = Object.create(template);
        for (let p in val) {
          if (p!=="template" || val[p]!==template[p]) {
            dummy[p] = val[p];
          }
        }
        val.swappedWith = dummy;
        return dummy;
      }
      return val;
    });
    // Swap thingIDs for things
    for (let i=0; i<tids.length; i++) {
      let tid = tids[i];
      if (tid[0].swappedWith) {
        tid[0].swappedWith[tid[1]] = saveGame.things[tid[2].tid];
      } else {
        tid[0][tid[1]] = saveGame.things[tid[2].tid];
      }
      if (tid[1]==="player") {
        player = saveGame.things[tid[2].tid];
      }
    }
    HTomb.Player = player.entity;
    // Fix ItemContainer references
    for (let i=0; i<icontains.length; i++) {
      let container = icontains[i][0];
      if (container.parent.swappedWith) {
        container.parent = container.parent.swappedWith;
      }
      for (let j=1; j<icontains[i].length; j++) {
        let item = icontains[i][j];
        if (item.tid) {
          item = saveGame.things[item.tid];
        }
        item.container = container;
      }
    }
    while(HTomb.World.things.length>0) {
      HTomb.World.things.pop();
    }
    fillListFrom(saveGame.things, things);
    var oldkeys;
    oldkeys = Object.keys(HTomb.World.creatures);
    for (let i=0; i<oldkeys.length; i++) {
      delete HTomb.World.creatures[oldkeys[i]];
    }
    oldkeys = Object.keys(HTomb.World.features);
    for (let i=0; i<oldkeys.length; i++) {
      delete HTomb.World.features[oldkeys[i]];
    }
    oldkeys = Object.keys(HTomb.World.items);
    for (let i=0; i<oldkeys.length; i++) {
      delete HTomb.World.items[oldkeys[i]];
    }
    oldkeys = Object.keys(HTomb.World.zones);
    for (let i=0; i<oldkeys.length; i++) {
      delete HTomb.World.zones[oldkeys[i]];
    }
    for (let t = 0; t<saveGame.things.length; t++) {
      let thing = saveGame.things[t];
      let x = thing.x;
      let y = thing.y;
      let z = thing.z;
      HTomb.World.things[t] = thing;
      if (thing.creature) {
        HTomb.World.creatures[coord(x,y,z)]=thing;
      }
      if (thing.feature) {
        HTomb.World.features[coord(x,y,z)]=thing;
      }
      if (thing.zone) {
        HTomb.World.zones[coord(x,y,z)]=thing;
      }
      if (thing.item) {
        if (x!==null && y!==null && z!==null) {
          // should I do this manually instead of using thing.place?
          thing.place(x,y,z);
        }
      }
    }
    console.log("successfully restored things");
  }

  function restoreTiles(z1,z2) {
    return function(json) {
      let levels = JSON.parse(json, HTomb.Types.parseTile);
      for (let i=0; i<=z2-z1; i++) {
        for (let x=0; x<LEVELW; x++) {
          for (let y=0; y<LEVELH; y++) {
            HTomb.World.tiles[i+z1][x][y] = levels[i][x][y];
          }
        }
      }
      console.log("successfully restored tiles"+z1);
    };
  }

  function restoreCovers(z1,z2) {
    return function(json) {
      let levels = JSON.parse(json, HTomb.Types.parseCover);
      for (let i=0; i<=z2-z1; i++) {
        for (let x=0; x<LEVELW; x++) {
          for (let y=0; y<LEVELH; y++) {
            HTomb.World.covers[i+z1][x][y] = levels[i][x][y];
          }
        }
      }
      console.log("successfully restored covers"+z1);
    };
  }

  function restoreOther(json) {
    let other = JSON.parse(json);
    fillGrid3dFrom(other.explored, HTomb.World.explored);
    fillListFrom(other.lights, HTomb.World.lights);
    HTomb.Time.dailyCycle.turn = other.cycle.turn;
    HTomb.Time.dailyCycle.minute = other.cycle.minute;
    HTomb.Time.dailyCycle.hour = other.cycle.hour;
    HTomb.Time.dailyCycle.day = other.cycle.day;
    console.log("successfully restored other stuff");
  }

  HTomb.Save.deleteGame = function(name) {
    HTomb.GUI.splash("Haven't added this functionality yet.");
  };

  HTomb.Save.restoreGame = function(name) {
    HTomb.Time.lockTime();
    HTomb.GUI.Contexts.locked=true;
    let headers = new Headers();
    headers.append("Content-Type", "application/json;charset=UTF-8");
    let args = {
      method: "GET",
      headers: headers
    }
    let promises = [
      fetch("/saves/tiles0/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreTiles(0,7)(res.body);}),
      fetch("/saves/tiles8/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreTiles(8,15)(res.body);}),
      fetch("/saves/tiles16/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreTiles(16,23)(res.body);}),
      fetch("/saves/tiles24/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreTiles(24,31)(res.body);}),
      fetch("/saves/tiles32/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreTiles(32,39)(res.body);}),
      fetch("/saves/tiles40/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreTiles(40,47)(res.body);}),
      fetch("/saves/tiles48/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreTiles(48,55)(res.body);}),
      fetch("/saves/tiles56/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreTiles(56,63)(res.body);}),
      fetch("/saves/covers0/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreCovers(0,7)(res.body);}),
      fetch("/saves/covers8/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreCovers(8,15)(res.body);}),
      fetch("/saves/covers16/" + name + "/", args).then(res => {console.log("fetched " + res.url); restoreCovers(16,23)(res.body);}),
      fetch("/saves/covers24/" + name + "/", args).then(res => {console.log("fetched " + res.url);restoreCovers(24,31)(res.body);}),
      fetch("/saves/covers32/" + name + "/", args).then(res => {console.log("fetched " + res.url);restoreCovers(32,39)(res.body);}),
      fetch("/saves/covers40/" + name + "/", args).then(res => {console.log("fetched " + res.url);restoreCovers(40,47)(res.body);}),
      fetch("/saves/covers48/" + name + "/", args).then(res => {console.log("fetched " + res.url);restoreCovers(48,55)(res.body);}),
      fetch("/saves/covers56/" + name + "/", args).then(res => {console.log("fetched " + res.url);restoreCovers(56,63)(res.body);}),
      fetch("/saves/things/" + name + "/", args).then(res => {console.log("fetched " + res.url);restoreThings(res.body);}),
      fetch("/saves/others/" + name + "/", args).then(res => {console.log("fetched " + res.url);restoreOther(res.body);}),
    ]
    Promise.all(promises).then(
      values => {
        for (let i=0; i<values.length; i++) {
          if (values[i].ok===false) {
            console.log("response for " + values[i].url + " not ok");
            HTomb.Time.unlockTime();
            HTomb.GUI.Contexts.locked=false;
            console.log("failed with " + values);
            return;
          }
        }
        console.log("succeeded with " + values);
        HTomb.Save.currentGame = "name";
        HTomb.FOV.resetVisible();
        if (HTomb.Player.sight) {
          HTomb.FOV.findVisible(HTomb.Player.x, HTomb.Player.y, HTomb.Player.z, HTomb.Player.sight.range);
        }
        HTomb.GUI.Panels.gameScreen.center(HTomb.Player.x,HTomb.Player.y);
        console.log("refreshed visibility");
        HTomb.Time.unlockTime();
        HTomb.GUI.Contexts.locked=false;
        HTomb.GUI.splash(["Game restored."]);
      },
      reason => {
        HTomb.Time.unlockTime();
        HTomb.GUI.Contexts.locked=false;
        console.log("failed with " + reason);
      }
    );
  };

  function fillListFrom(fromList, toList, callb) {
    // default callback is to return self
    callb = callb || function(x) {return x;};

    // if fromList is an array
    if (Array.isArray(fromList) && Array.isArray(toList)) {
      while(toList.length>0) {
        toList.pop();
      }
      for (let i=0; i<fromList.length; i++) {
        toList.push(callb(fromList[i]));
      }
    // if fromList is an associative array
    } else {
      for (let t in toList) {
        toList[t] = null;
        //delete toList[t];
      }
      for (let f in fromList) {
        toList[f] = callb(fromList[f]);
      }
    }
  };

  function fillGrid3dFrom(fromGrid, toGrid, callb) {
  // default callback is to return self
    callb = callb || function(x) {return x;};
    // pull all elements from old grid
    for (let z=0; z<NLEVELS; z++) {
      for (let x=0; x<LEVELW; x++) {
        for (let y=0; y<LEVELH; y++) {
          toGrid[z][x][y] = callb(fromGrid[z][x][y]);
        }
      }
    }
  };
  return HTomb;

})(HTomb);
