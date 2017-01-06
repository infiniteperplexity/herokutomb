// This submodule handles saving the game
HTomb = (function(HTomb) {
  "use strict";
  let LEVELW = HTomb.Constants.LEVELW;
  let LEVELH = HTomb.Constants.LEVELH;
  let NLEVELS = HTomb.Constants.NLEVELS;
  let coord = HTomb.Utils.coord;
  // Global value for the name of the current game
  HTomb.Save.currentGame = "mySaveGame";
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
      return val.then(function(res) {
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
            if (parseInt(100*i/totalN)>=98) {
              HTomb.GUI.Views.progressView(["Waiting for server response..."]);
            } else {
              console.log(parseInt(100*i/totalN).toString() + "% complete (" + i + " entities.)");
              HTomb.GUI.Views.progressView(["Stringifying things:",parseInt(100*i/totalN).toString() + "% complete"]);
            }
          },
          then: function(rslt) {
            HTomb.GUI.pushMessage("Finished stringifying " + rslt.length + " entities.");
            // this is one place we could add the "depedent things concept"
            let things = rslt.join(',');
            things = '['.concat(things,']');
            //console.log(things.substr(0,100));
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
    let events = {};
    for (let i=0; i<HTomb.Events.types.length; i++) {
      events[HTomb.Events.types[i]] = HTomb.Events[HTomb.Events.types[i]];
    }
    events.types = HTomb.Events.types;
    events = HTomb.Save.stringifyThing(events);
    let other = '{'.concat(
                '"explored": ', explored, ", ",
                '"lights": ', lights, ", ",
                '"cycle": ', cycle, ", ",
                '"events": ', events,
                '}'
    );
    return other;
  }
  HTomb.Save.exposeOther = function() {
    return stringifyOther();
  }
  // returns a function that several rows of stringified tiles
  function stringifyTiles(z1,z2) {
    return function() {
      let levels = HTomb.World.tiles.slice(z1,z2+1);
      let tiles = HTomb.Save.stringifyThing(levels, false);
      return tiles;
    };
  };

  function stringifyCovers(z1,z2) {
    return function() {
      let levels = HTomb.World.covers.slice(z1,z2+1);
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
      headers: headers,
      credentials: "include"
    }
    killsave = false;
    for (let i=0; i<HTomb.World.things.length; i++) {
      HTomb.World.things[i].thingId = i;
    }
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
      function(values) {
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
        for (let i=0; i<HTomb.World.things.length; i++) {
          delete HTomb.World.things[i].thingId;
        }
        HTomb.GUI.Contexts.locked=false;
        HTomb.Time.unlockTime();
      },
      function(reason) {
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
          progress(count,retn);
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
      } else if (key==="heldby" && val===HTomb.World.items) {
        // definitely do not stringify the global items list
        return "i";
      }
      // if it has special instructions, use those to stringify
      if (val.stringify) {
        return val.stringify();
        // if it's from the global things table, stringify it normally
      } else if (topLevel===true && val.thingId!==undefined) {
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
    //}," ");
    });
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

  function restoreThings(json) {
    let tids = [];
    let icontains = [];
    let player = null;
    let things = JSON.parse(json, function (key, val) {
      if (val===null) {
        return null;
      // remove this once parsing is corrected
    } else if (key==="heldby" && val==="i") {
        // revive a reference to the global items list
        return HTomb.World.items;
      } else if (val.Type!==undefined) {
        // should not require tracking swaps
        return HTomb.Types.templates[val.Type];
      } else if (val.tid!==undefined) {
        tids.push([this,key,val]);
        return {tid: val.tid};
      } else if (val.template) {
        let template = HTomb.Things.templates[val.template];
        let dummy = Object.create(template);
        for (let p in val) {
          if (p!=="template" || val[p]!==template[p]) {
            dummy[p] = val[p];
          }
        }
        return dummy;
        if (val.template==="Team") {
          console.log(dummy);
        }
      }
      return val;
    });
    // Swap thingIDs for things
    for (let i=0; i<tids.length; i++) {
      let tid = tids[i];
      tid[0][tid[1]] = things[tid[2].tid];
      if (tid[1]==="player") {
        player = things[tid[2].tid];
      }
    }
    HTomb.Player = player.entity;
    // Fix ItemContainer references
    while(HTomb.World.things.length>0) {
      HTomb.World.things.pop();
    }
    fillListFrom(things, HTomb.World.things);
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
    oldkeys = Object.keys(HTomb.World.tasks);
    for (let i=0; i<oldkeys.length; i++) {
      delete HTomb.World.tasks[oldkeys[i]];
    }
    for (let t = 0; t<things.length; t++) {
      let thing = things[t];
      let x = thing.x;
      let y = thing.y;
      let z = thing.z;
      HTomb.World.things[t] = thing;
      // A lot of these things may need explicit placement
      if (thing.creature) {
        HTomb.World.creatures[coord(x,y,z)]=thing;
      }
      if (thing.feature) {
        HTomb.World.features[coord(x,y,z)]=thing;
      }
      if (thing.task) {
        HTomb.World.tasks[coord(x,y,z)]=thing;
      }
      if (thing.item) {
        if (x!==null && y!==null && z!==null) {
          // should I do this manually instead of using thing.place?
          thing.place(x,y,z);
        }
      }
      // Anything that refers to entities should be re
    }
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
    };
  }

  function restoreCovers(z1,z2) {
    return function(json) {
      let covers = JSON.parse(json, HTomb.Types.parseCover);
      for (let i=0; i<=z2-z1; i++) {
        for (let x=0; x<LEVELW; x++) {
          for (let y=0; y<LEVELH; y++) {
            HTomb.World.covers[i+z1][x][y] = covers[i][x][y];
          }
        }
      }

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
    let saveListeners = [];
    for (let i=0; i<HTomb.Events.types.length; i++) {
      let type = HTomb.Events.types[i];
      for (let j=0; j<HTomb.Events[type].length; j++) {
        let l = HTomb.Events[type][j];
        if (l.template===undefined) {
          saveListeners.push([l,type]);
        }
      }
    }
    HTomb.Events.reset();
    if (other.events) {
      for (let list in other.events) {
        let list1 = other.events[list];
        let list2 = HTomb.Events[list] = [];
        for (let i=0; i<list1.length; i++) {
          if (list1[i].tid!==undefined) {
            list2.push(list1[i]);
          }
        }
      }
      HTomb.Events.types = other.events.types;
    }
    for (let i=0; i<saveListeners.length; i++) {
      HTomb.Events.subscribe(saveListeners[i][0],saveListeners[i][1]);
    }
  }

  // Anything not on the Thing list that contains references to things gets processed here
  function finalSwap() {
    for (let i=0; i<HTomb.World.lights.length; i++) {
      if (HTomb.World.lights[i].tid!==undefined) {
        HTomb.World.lights[i] = HTomb.World.things[HTomb.World.lights[i].tid];
      }
    }
    for (let i=0; i<HTomb.Events.types.length; i++) {
      let type = HTomb.Events.types[i];
      for (let j=0; j<HTomb.Events[type].length; j++) {
        if (HTomb.Events[type][j].tid!==undefined) {
          HTomb.Events[type][j] = HTomb.World.things[HTomb.Events[type][j].tid]
        }
      }
    }
  }

  HTomb.Save.deleteGame = function(name) {
    let headers = new Headers();
    headers.append("Content-Type", "application/json;charset=UTF-8");
    let args = {
      method: "GET",
      headers: headers,
      credentials: "include"
    }
    fetch("/delete/" + name, args).then(
      function(res) {
        HTomb.Time.unlockTime();
        HTomb.GUI.Contexts.locked=false;
        HTomb.GUI.Views.parentView = HTomb.GUI.Views.startup;
        HTomb.GUI.splash(["'" + name + "' deleted."]);
      },
      function(reason) {
        HTomb.Time.unlockTime();
        HTomb.GUI.Contexts.locked=false;
        console.log("failed to delete with " + reason);
        HTomb.GUI.Views.parentView = HTomb.GUI.Views.Main.reset;
        HTomb.GUI.splash(["failed to delete " + name]);
      }
    );
  };

  function fetchParse(url, args, func) {
    //This is a truly ridiculous hack to pass along the response.ok = false value...
    return fetch(url, args)
      .then(function(res) {
        if (res.ok===false) {
          return res;
        }
        HTomb.GUI.Views.progressView(["Parsing saved data from " + url + "."]);
        return res.text();
      })
      .then(function(txt) {
        if (txt.ok===false) {
          return txt;
        }
        func(txt);
      });
  }
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
      fetchParse("/saves/tiles0/" + name + "/", args, restoreTiles(0,7)),
      fetchParse("/saves/tiles8/" + name + "/", args, restoreTiles(8,15)),
      fetchParse("/saves/tiles16/" + name + "/", args, restoreTiles(16,23)),
      fetchParse("/saves/tiles24/" + name + "/", args, restoreTiles(24,31)),
      fetchParse("/saves/tiles32/" + name + "/", args, restoreTiles(32,39)),
      fetchParse("/saves/tiles40/" + name + "/", args, restoreTiles(40,47)),
      fetchParse("/saves/tiles48/" + name + "/", args, restoreTiles(48,55)),
      fetchParse("/saves/tiles56/" + name + "/", args, restoreTiles(56,63)),
      fetchParse("/saves/covers0/" + name + "/", args, restoreCovers(0,7)),
      fetchParse("/saves/covers8/" + name + "/", args, restoreCovers(8,15)),
      fetchParse("/saves/covers16/" + name + "/", args, restoreCovers(16,23)),
      fetchParse("/saves/covers24/" + name + "/", args, restoreCovers(24,31)),
      fetchParse("/saves/covers32/" + name + "/", args, restoreCovers(32,39)),
      fetchParse("/saves/covers40/" + name + "/", args, restoreCovers(40,47)),
      fetchParse("/saves/covers48/" + name + "/", args, restoreCovers(48,55)),
      fetchParse("/saves/covers56/" + name + "/", args, restoreCovers(56,63)),
      fetchParse("/saves/things/" + name + "/", args, restoreThings),
      fetchParse("/saves/other/" + name + "/", args, restoreOther),
    ];
    Promise.all(promises).then(
      function(values) {
        for (let i=0; i<values.length; i++) {
          if (values[i] && values[i].ok===false) {
            console.log("response for " + values[i].url + " not ok");
            HTomb.Time.unlockTime();
            HTomb.GUI.Contexts.locked=false;
            HTomb.GUI.Views.parentView = HTomb.GUI.Views.startup;
            return;
          }
        }
        finalSwap();
        HTomb.Save.currentGame = name;
        HTomb.World.validate.reset();
        HTomb.World.validate.all();
        HTomb.FOV.resetVisible();
        if (HTomb.Player.sight) {
          HTomb.FOV.findVisible(HTomb.Player.x, HTomb.Player.y, HTomb.Player.z, HTomb.Player.sight.range);
        }
        HTomb.GUI.Panels.gameScreen.center(HTomb.Player.x,HTomb.Player.y);
        HTomb.Time.unlockTime();
        HTomb.GUI.Contexts.locked=false;
        HTomb.GUI.Views.parentView = HTomb.GUI.Views.Main.reset;
        HTomb.GUI.splash(["Game restored."]);
        HTomb.GUI.Panels.gameScreen.recenter();
        if (HTomb.GUI.Views.Main.inSurveyMode) {
          HTomb.GUI.Contexts.survey.saveX = HTomb.GUI.Panels.gameScreen.xoffset;
          HTomb.GUI.Contexts.survey.saveY = HTomb.GUI.Panels.gameScreen.yoffset;
          HTomb.GUI.Contexts.survey.saveZ = HTomb.GUI.Panels.gameScreen.z;
        }
      },
      function(reason) {
        HTomb.Time.unlockTime();
        HTomb.GUI.Contexts.locked=false;
        console.log("failed with " + reason);
        HTomb.GUI.Views.parentView = HTomb.GUI.Views.startup;
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

/*

This function can help diagnose what went wrong while saving.

function examine() {
  let seen = new Set();
  for (let i=0; i<HTomb.World.things.length; i++) {
    let t = HTomb.World.things[i].template;
    if (seen.has(t)===false) {
      console.log("First saw " + t + " at " + i);
      seen.add(t);
    }
  }
}
*/
