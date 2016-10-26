HTomb = (function(HTomb) {
  "use strict";
  var coord = HTomb.Utils.coord;

  var thing = {
    template: "Thing",
    spawn: function() {
      // Add to the global things table
      HTomb.World.things.push(this);
      if (this.onSpawn) {
        this.onSpawn();
      }
    },
    isSpawned: function() {
      if (HTomb.World.things.indexOf(this)===-1) {
        return false;
      } else {
        return true;
      }
    },
    despawn: function() {
    // remove from the global things table
      //if (HTomb.World.things.indexOf(this)===-1) {
      //  return;
      //}
      HTomb.World.things.splice(this.thingId,1);
      HTomb.Events.unsubscribeAll(this);
      if (this.onDespawn) {
        this.onDespawn();
      }
    },
    get thingId () {
      // Calculate thingId dynamically
      return HTomb.World.things.indexOf(this);
    },
    set thingId (arg) {
      // not allowed
      HTomb.Debug.pushMessage("Not allowed to set thingId");
    },
    // Describe for an in-game message
    describe: function() {
      return this.name;
    },
    // Describe for an in-game list
    onList: function() {
      return this.describe();
    },
    details: function() {
      return ["This is " + this.describe() + "."];
    }
  };
  // The global list of known templates
  HTomb.Things.templates = {Thing: thing};

  // define a template for creating things
  HTomb.Things.define = function(args) {
    if (args===undefined || args.template===undefined) {
      //HTomb.Debug.pushMessage("invalid template definition");
      return;
    }
    // Create based on generic thing
    var t;
    if (args.parent===undefined || (args.parent!=="Thing" && HTomb.Things.templates[args.parent]===undefined)) {
      args.parent = "Thing";
    }
    if (args.parent==="Thing") {
      t = Object.create(thing);
      // Create a new function...maybe not the best way to do this
      HTomb.Things["define" + args.template] = function(opts) {
        opts.parent = opts.parent || args.template;
        return HTomb.Things.define(opts);
      };
    } else {
      t = Object.create(HTomb.Things.templates[args.parent]);

      HTomb.Things[args.template] = function(opts) {
        // Create a shortcut function to create it
        return HTomb.Things.create(args.template, opts);
      };
    }
    // Add the arguments to the template
    for (var arg in args) {
      t[arg] = args[arg];
    }
    // Add to the list of templates
    HTomb.Things.templates[args.template] = t;
    // Don't fire onDefine for the top-level thing
    if (t.onDefine && args.parent!=="Thing") {
      t.onDefine(args);
    }
  };



  // Create a new object based on the template
  HTomb.Things.create = function(template, args) {
    if (HTomb.Things.templates[template]===undefined) {
      console.log([template,args]);
    }
    var t = Object.create(HTomb.Things.templates[template]);
    // Copy the arguments onto the thing
    // here's where we went wrong...
    for (var arg in args) {
      t[arg] = args[arg];
    }
    // Do all "on spawn" tasks
    t.spawn();
    if (t.onCreate) {
      return t.onCreate(args);
    }
    // return the thing
    return t;
  };

return HTomb;
})(HTomb);
