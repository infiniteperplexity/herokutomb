// This submodule handles saving the game
HTomb = (function(HTomb) {
  "use strict";
  let LEVELW = HTomb.Constants.LEVELW;
  let LEVELH = HTomb.Constants.LEVELH;
  let NLEVELS = HTomb.Constants.NLEVELS;
  let coord = HTomb.Utils.coord;
  // Global value for the name of the current game
  HTomb.Save.currentGame = "test";
  // a function that takes a text-or-promise-returning function, plus fetch args, and then returns a fetch promise.
  function fetchText(textFunc, url, args) {
    args.url = url;
    let val = textFunc();
    // if we got actual text...
    if (typeof(val)==="string") {
      args.body = '{json: "' + val + '"}';
      console.log(url + " length is " + args.body.length);
      // ...return a fetch promise using that text
      return fetch(args);
    } else if (val.then) {
      // if we got a promise of text...
      return val.then(res => {
        args.body = = '{json: "' + res + '"}';
        // ...chain to a fetch promise
        console.log(url + " length is " + args.body.length);
        return fetch(args);
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

  function stringifyCovers() {
    let covers = HTomb.Save.stringifyThing(HTomb.World.covers, false);
    return covers;
  }

  HTomb.Save.saveGame = function(name) {
    HTomb.Time.lockTime();
    name = name || HTomb.Save.currentGame;
    let headers = new Headers();
    headers.append("Content-Type", "application/json;charset=UTF-8");
    let args = {
      method: "POST",
      headers: headers
    }
    let promises = [
      fetchText(stringifyTiles(0,7),"/saves/" + name + "/tiles0/",args),
      fetchText(stringifyTiles(8,15),"/saves/" + name + "/tiles8/",args),
      fetchText(stringifyTiles(16,23),"/saves/" + name + "/tiles16/",args),
      fetchText(stringifyTiles(24,31),"/saves/" + name + "/tiles24/",args),
      fetchText(stringifyTiles(32,39),"/saves/" + name + "/tiles32/",args),
      fetchText(stringifyTiles(40,47),"/saves/" + name + "/tiles40/",args),
      fetchText(stringifyTiles(48,55),"/saves/" + name + "/tiles48/",args),
      fetchText(stringifyTiles(56,63),"/saves/" + name + "/tiles56/",args),
      fetchText(stringifyCovers,"/saves/" + name + "/covers/",args),
      fetchText(stringifyOther,"/saves/" + name + "/other/",args),
      fetchText(promiseThings,"/saves/" + name + "/things/",args)
    ];
    Promise.all(promises).then(
      values => {
        console.log("succeeded: " + values);
        HTomb.GUI.splash(["Finished saving "+"'"+name+"'."]);
        HTomb.Time.unlockTime();
      },
      reason => {
        console.log("failed: " + reason);
        HTomb.GUI.splash(["Failed to save "+"'"+name+"'."]);
        HTomb.Time.unlockTime();
      }
    )
  };

  HTomb.Save.saveGameOld = function(name) {
    HTomb.Time.lockTime();
    console.time("save game");
    name = name || HTomb.Save.currentGame;
    let totalN = HTomb.World.things.length;
    batchMap(function(v, i, a) {
        return HTomb.Save.stringifyThing(v, true);
      }, HTomb.World.things,
    {
        splitby: 1000,
        progress: function(i) {
          console.log(parseInt(100*i/totalN).toString() + "% complete (" + i + " entities.)");
          HTomb.GUI.Views.progressView(["Saving game:",parseInt(100*i/totalN).toString() + "% complete"]);
        },
        then: function(rslt) {
          HTomb.GUI.pushMessage("Finished saving " + rslt.length + " entities.");
          console.timeEnd("save game");
          let things = rslt.join(',');
          things = '['.concat(things,']');
          let tiles = HTomb.Save.stringifyThing(HTomb.World.tiles, false);
          let explored = HTomb.Save.stringifyThing(HTomb.World.explored, false);
          let covers = HTomb.Save.stringifyThing(HTomb.World.covers, false);
          let lights = HTomb.Save.stringifyThing(HTomb.World.lights, false);
          let cycle = HTomb.Save.stringifyThing(HTomb.Time.dailyCycle, false);
          let json = '{'.concat(
            '"things": ', things, ", ",
            '"tiles": ', tiles, ", ",
            '"explored": ', explored, ", ",
            '"covers": ', covers, ", ",
            '"lights": ', lights, ", ",
            '"cycle": ', cycle,
            '}'
          );
          console.log("length of things is " + things.length);
          console.log("length of tiles is " + tiles.length);
          console.log("length of explored is " + explored.length);
          console.log("length of covers is " + covers.length);
          console.log("length of lights is " + lights.length);
          console.log("length of cycle is " + cycle.length);
          //console.time("complex parse");
          //HTomb.Save.restoreGame(json);
          //console.timeEnd("complex parse");
          postData(name, json);
          HTomb.GUI.splash(["Finished saving "+"'"+name+"'."]);
        }
      }
    );
  };

  // Send the XMLHTTP POST request to save game
  function postData(name, json) {
    var file = "/"+ name + '.json';
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      console.log("ready state is " + this.readyState);
    }
    xhttp.open("POST", file, true);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify({txt: json}));
    console.log("probably should have success/fail message...");
    HTomb.Time.unlockTime();
  }

  //okay...so this is how it's done...

  // Helper function to split job and unlock DOM
  function batchMap(func, arr, options) {
    options = options || {};
    let splitby = options.splitby || 1;
    let then = options.then || function() {};
    let progress = options.progress || function(i) {console.log(i);};
    let retn = [];
    let count = 0;
    let recurse = function() {
      for (; count<arr.length; count++) {
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
    var file = '/saves/';
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

  // Code for restoring games
  HTomb.Save.getData = function(name, callback) {
    HTomb.Time.lockTime();
    HTomb.GUI.Views.progressView(["Restoring '" + name + "'..."]);
    getData(name, callback);
  };
  //function getData(file) {
  function getData(name, callback) {
    name = name || currentGame;
    console.time("get request");
    var file = '/'+ name + '.json';
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (xhttp.status == 200) {
          console.log("Got our JSON, now we should do something with it.");
          console.log(xhttp.responseText.length);
          callback(xhttp.responseText);
          //let json = JSON.parse(xhttp.responseText);
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

  HTomb.Save.restoreGame = function(json) {
    let tids = [];
    let icontains = [];
    //let templates = [];
    let player = null;
    // parse while keeping a list of references to thingIds
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...parsing JSON..."
    ]);
    let saveGame = JSON.parse(json, function (key, val) {
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
        // This doesn't set correctly.
        ic.parent = this;
        console.log("parent is "+HTomb.Save.stringifyThing(this,true));
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
    fillListFrom(saveGame.things, HTomb.World.things);
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...rebuilding map..."
    ]);
    fillGrid3dFrom(saveGame.tiles, HTomb.World.tiles, HTomb.Types.parseTile);
    fillGrid3dFrom(saveGame.explored, HTomb.World.explored);
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...rebuilding entity lists..."
    ]);
    console.log(saveGame);

    while(HTomb.World.things.length>0) {
      HTomb.World.things.pop();
    }
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
    oldkeys = Object.keys(HTomb.World.covers);
    for (let i=0; i<oldkeys.length; i++) {
      delete HTomb.World.covers[oldkeys[i]];
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
    console.log("filled entities");
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...rebuilding liquids and ground cover..."
    ]);
    fillListFrom(saveGame.covers, HTomb.World.covers, HTomb.Types.parseCover);
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...rebuilding time cycle and visibility..."
    ]);
    HTomb.Time.dailyCycle.turn = saveGame.cycle.turn;
    HTomb.Time.dailyCycle.minute = saveGame.cycle.minute;
    HTomb.Time.dailyCycle.hour = saveGame.cycle.hour;
    HTomb.Time.dailyCycle.day = saveGame.cycle.day;
    HTomb.FOV.resetVisible();
    if (HTomb.Player.sight) {
      HTomb.FOV.findVisible(HTomb.Player.x, HTomb.Player.y, HTomb.Player.z, HTomb.Player.sight.range);
    }
    HTomb.GUI.Panels.gameScreen.center(HTomb.Player.x,HTomb.Player.y);
    console.log("refreshed visibility");
    HTomb.Time.unlockTime();
    HTomb.GUI.splash(["Game restored."]);
  };

  function rebuildLists(fromThings, toList, callb) {
    callb = callb || function(x) {return x;};

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
