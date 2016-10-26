// The Events submodule, thus far unused, handles events and messaging
HTomb = (function(HTomb) {
  "use strict";
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var NLEVELS = HTomb.Constants.NLEVELS;

  HTomb.Utils.where = function(obj,callb) {
    var result = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key) && callb(obj[key],key,obj)) {
        result.push(obj[key]);
      }
    }
    return result;
  };

  HTomb.Utils.findItems = function(callb) {
    var selected = [];
    for (var k in HTomb.World.items) {
      var items = HTomb.World.items[k] || [];
      for (var i=0; i<items.length; i++) {
        var v = items[i];
        if (callb===undefined || callb(v,k,i)===true) {
          selected.push(v);
        }
      }
    }
    return selected;
  };

  // like clone but don't keep the prototype
  HTomb.Utils.copy = function(obj) {
    if (typeof(obj)==="object") {
      if (obj===null) {
        return null;
      }
      // recursively copy arrays and objects
      var nobj = {};
      if (Array.isArray(obj)) {
        for (var i=0; i<obj.length; i++) {
          nobj[i].push(HTomb.Utils.copy(obj[i]));
        }
      } else {
        for (var key in obj) {
          nobj[key] = HTomb.Utils.copy(obj[key]);
        }
      }
      return nobj;
    // pass primitives by value and functions by reference
    } else {
      return obj;
    }
  };
  // clone actually uses the same prototype
  HTomb.Utils.clone = function(obj) {
    if (typeof(obj)==="object") {
      if (obj===null) {
        return null;
      }
      // recursively copy arrays and objects
      var nobj = Object.create(obj);
      if (Array.isArray(obj)) {
        for (var i=0; i<obj.length; i++) {
          nobj[i].push(HTomb.Utils.clone(obj[i]));
        }
      } else {
        for (var key in obj) {
          nobj[key] = HTomb.Utils.clone(obj[key]);
        }
      }
      return nobj;
    // pass primitives by value and functions by reference
    } else {
      return obj;
    }
  };

  HTomb.Utils.shuffle = function(arr) {
    //Fisher-Yates
    var i = arr.length;
    if ( i == 0 ) return false;
    while ( --i ) {
       var j = Math.floor( Math.random() * ( i + 1 ) );
       var tempi = arr[i];
       var tempj = arr[j];
       arr[i] = tempj;
       arr[j] = tempi;
     }
     return arr;
  };

  HTomb.Utils.coord = function(x,y,z) {
    return z*LEVELH*LEVELW + x*LEVELH + y;
  }
  //useful for parsing
  HTomb.Utils.decoord = function(c) {
    var x=0, y=0, z=0;
    while(c-LEVELH*LEVELW>=0) {
      c-=LEVELH*LEVELW;
      z+=1;
    }
    while(c-LEVELH>=0) {
      c-=LEVELH;
      x+=1;
    }
    y = parseInt(c);
    return [x,y,z];
  }

  HTomb.Utils.dicePlusMinus = function(d) {
    return Math.floor(Math.random()*d)-Math.floor(Math.random()*d);
  };

  HTomb.Utils.dice = function(n,d) {
    var tally = 0;
    for (var i=0; i<n; i++) {
      tally+=Math.floor(Math.random()*d)+1;
    }
    return tally;
  };

  HTomb.Utils.diceUntil = function(d,n) {
    if (n>d) {
      return 0;
    }
    var tally = 0;
    while (true) {
      var roll=Math.floor(Math.random()*d)+1;
      if (roll>=n) {
        break;
      } else {
        tally+=1;
      }
    }
    return tally;
  };

  HTomb.Utils.arrayInArray = function(c, a) {
    for (var i=0; i<a.length; i++) {
      for (var j=0; j<c.length; j++) {
        if (c[j]!==a[i][j]) {
          break;
        } else if(j===c.length-1) {
          return i;
        }
      }
    }
    return -1;
  };

  HTomb.Utils.maxIndex = function(arr) {
    return arr.reduce(function(iMax,x,i,a) {return x>a[iMax] ? i : iMax;}, 0);
  };

  HTomb.Utils.alphaHex = function(newc,oldc,alpha) {
    var combined = [];
    for (var i=0; i<3; i++) {
      combined[i] = alpha*newc[i]+(1-alpha)*oldc[i];
    }
    return combined;
  }

  HTomb.Utils.alphaString = function(newc,oldc,alpha) {
    var oldc = ROT.Color.fromString(oldc);
    var newc = ROT.Color.fromString(newc);
    var combined = [];
    for (var i=0; i<3; i++) {
      combined[i] = alpha*newc[i]+(1-alpha)*oldc[i];
    }
    combined = ROT.Color.toHex(combined);
    return combined;
  }


  return HTomb;
})(HTomb);
