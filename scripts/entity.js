HTomb = (function(HTomb) {
  "use strict";
  var coord = HTomb.Utils.coord;
  // Define a generic entity that occupies a tile space
  HTomb.Things.define({
    template: "Entity",
    name: "entity",
    parent: "Thing",
    x: null,
    y: null,
    z: null,
    behaviors: {},
    place: function(x,y,z,options) {
      if (this.isPlaced()) {
        this.remove();
      }
      this.x = x;
      this.y = y;
      this.z = z;
      if (this.isPlaced()) {
        var beh = this.getBehaviors();
        for (var i=0; i<beh.length; i++) {
          if (beh[i].onPlace) {
            beh[i].onPlace(x,y,z,options);
          }
        }
      }
      if (this.onPlace) {
        this.onPlace(x,y,z,options);
      }
      return this;
    },
    isPlaced: function() {
      if (this.x===null || this.y===null || this.z===null) {
        return false;
      } else {
        return true;
      }
    },
    getBehaviors: function() {
      var behaviors = [];
      for (let i=0; i<HTomb.Things.behaviors.length; i++) {
        let b = HTomb.Things.behaviors[i];
        if (this[b]!==undefined) {
          behaviors.push(this[b]);
        }
      }
      return behaviors;
    },
    behaviorTemplate: function(beh) {
      let beh1 = HTomb.Utils.copy(this.behaviors[beh]);
      let beh2 = HTomb.Utils.clone(HTomb.Things.templates[beh]);
      for (let v in beh1) {
        beh2[v] = beh1[v];
      }
      return beh2;
    },
    remove: function(options) {
      var beh = this.getBehaviors();
      for (var i=0; i<beh.length; i++) {
        if (beh[i].onRemove) {
          beh[i].onRemove(options);
        }
      }
      if (this.onRemove) {
        this.onRemove(options);
      }
      this.x = null;
      this.y = null;
      this.z = null;
    },
    destroy: function() {
      var beh = this.getBehaviors();
      for (var i=0; i<beh.length; i++) {
        var b = beh[i];
        if (b.destroy) {
          b.destroy();
        }
        b.despawn();
      }
      HTomb.Events.publish({type: "Destroy", entity: this});
      this.despawn();
    },
    onDespawn: function() {
      if (this.isPlaced()) {
        this.remove();
      }
    },
    fall: function() {
      var g = HTomb.Tiles.groundLevel(this.x,this.y,this.z);
      if (this.creature) {
        if (HTomb.World.creatures[coord(this.x,this.y,g)]) {
          alert("haven't decided how to handle falling creature collisions");
        } else {
          HTomb.GUI.sensoryEvent(this.describe({capitalized: true, article: "indefinite"}) + " falls " + (this.z-g) + " stories!",this.x,this.y,this.z);
          this.place(this.x,this.y,g);
        }
      }
      if (this.item) {
        HTomb.GUI.sensoryEvent(this.describe({capitalized: true, article: "indefinite"}) + " falls " + (this.z-g) + " stories!",this.x,this.y,this.z);
        this.place(this.x,this.y,g);
      }
      HTomb.GUI.render();
    },
    onCreate: function() {
      // Add behaviors to entity
      for (var b in this.behaviors) {
        if (typeof(HTomb.Things[b])!=="function") {
            console.log("Problem with behavior " + b + " for " + this.describe());
        }
        var beh = HTomb.Things[b](this.behaviors[b] || {});
        beh.addToEntity(this);
      }
      // Randomly choose symbol if necessary
      if (Array.isArray(this.symbol)) {
        this.symbol = this.symbol[Math.floor(Math.random()*this.symbol.length)];
      }
      // Randomly choose  color if necessary
      if (Array.isArray(this.fg)) {
        this.fg = this.fg[Math.floor(Math.random()*this.fg.length)];
      }
      // Randomly perturb color, if necessary
      if (this.randomColor>0 && this.fg) {
        if (this.fg) {
          var c = ROT.Color.fromString(this.fg);
          c = ROT.Color.randomize(c,[this.randomColor, this.randomColor, this.randomColor]);
          c = ROT.Color.toHex(c);
          this.fg = c;
        }
      }
      return this;
    }
  });

  // Define a generic behavior that gets attached to entities
  HTomb.Things.define({
    template: "Behavior",
    name: "behavior",
    parent: "Thing",
    entity: null,
    addToEntity: function(ent) {
      this.entity = ent;
      ent[this.name] = this;
      if (this.onAdd) {
        this.onAdd(this.options);
      }
    },
    onDefine: function(args) {
      HTomb.Things.behaviors.push(args.name);
    }
  });
  HTomb.Things.behaviors = [];

  HTomb.Things.defineBehavior({
    template: "Creature",
    name: "creature",
    maxhp: 10,
    hp: 10,
    die: function() {
      //maybe check to see if the parent entity has a different "die" function
      // sometimes things can "multi-die"...how should that be handled?
      if (this.entity.x!==null && this.entity.y!==null && this.entity.z!==null) {
        HTomb.GUI.sensoryEvent(this.entity.describe({capitalized: true, article: "indefinite"}) + " dies.",this.entity.x,this.entity.y,this.entity.z);
        this.entity.destroy();
      }
    },
    onPlace: function(x,y,z) {
      let c = coord(x,y,z);
      if (HTomb.World.creatures[c]) {
        HTomb.Debug.pushMessage("Overwrote a creature!");
        HTomb.World.creatures[c].remove();
        HTomb.World.creatures[c].despawn();
      }
      HTomb.World.creatures[c] = this.entity;
    },
    onRemove: function() {
      delete HTomb.World.creatures[coord(this.entity.x, this.entity.y, this.entity.z)];
    }
  });

  HTomb.Things.defineBehavior({
    template: "Item",
    name: "item",
    stackable: false,
    n: 1,
    maxn: 10,
    container: null,
    owned: true,
    bulk: 10,
    isOwned: function() {
      return this.owned;
    },
    isOnGround: function() {
      let parent = this.container.parent;
      if (parent===HTomb.World.items) {
        return true;
      } else {
        return false;
      }
    },
    inStructure: function() {
      if (this.entity.x===null) {
        return false;
      }
      let x = this.entity.x;
      let y = this.entity.y;
      let z = this.entity.z;
      let f = HTomb.World.features(HTomb.Utils.coord(x,y,z));
      if (f && f.structure && f.structure.owner===HTomb.Player) {
        return true;
      }
      return false;
    },
    carriedByMinion: function() {
      let parent = this.container.parent;
      if (parent.entity && HTomb.Player.master.minions.indexOf(parent.entity)) {
        return true;
      } else {
        return false;
      }
    },
    carriedByCreature: function() {
      let parent = this.container.parent;
      if (parent.entity && parent.entity.creature) {
        return true;
      } else {
        return false;
      }
    },
    onPlace: function(x,y,z) {
      let c = coord(x,y,z);
      var pile = HTomb.World.items[c] || ItemContainer();
      pile.push(this.entity);
      if (pile.length>0) {
        HTomb.World.items[c] = pile;
        pile.parent = HTomb.World.items;
      }
    },
    onRemove: function() {
      let c = coord(this.entity.x,this.entity.y,this.entity.z);
      var pile = HTomb.World.items[c];
      // remove it from the old pile
      if (pile) {
        if (pile.contains(this.entity)) {
          pile.remove(this.entity);
        }
        if (pile.length===0) {
          delete HTomb.World.items[c];
        }
      }
    },
    onDescribe: function(options) {
      if (this.stackable && this.n>1) {
        options.plural = true;
        options.article = this.n;
      }
      return options;
    },
    makeStack: function() {
      if (this.stackable) {
        this.n = 1+HTomb.Utils.diceUntil(3,3);
      }
    },
    containerXYZ: function() {
      if (this.container && this.container.parent && this.container.parent.entity) {
        let e = this.container.parent.entity;
        return [e.x,e.y,e.z];
      } else {
        return [null,null,null];
      }
    }
  });

  HTomb.Things.defineBehavior({
    template: "Feature",
    name: "feature",
    yields: null,
    integrity: null,
    stackedFeatures: null,
    onDefine: function(args) {
      if (args.craftable===true) {
        let item = HTomb.Utils.copy(args);
        item.template = args.template+"Item";
        delete item.behaviors.Feature;
        HTomb.Things.defineItem(item);
        let template = HTomb.Things.templates[args.template];
        // overwrite the item's ingredients
        template.ingredients = {};
        template.ingredients[args.template+"Item"] = 1;
      }
    },
    onPlace: function(x,y,z,options) {
      options = options || {};
      let c = coord(x,y,z);
      if (options.stackFeatures) {
        // presumably I will need to fire onRemove with some options
        // I also need to do some graphical stuff
        let stacked = HTomb.World.features[c];
        HTomb.World.features[c] = this.entity;
        if (this.stackedFeatures===null) {
          this.stackedFeatures = [stacked];
        } else {
          this.stackedFeatures.push(stacked);
        }
      } else {
        if (HTomb.World.features[c]) {
          HTomb.Debug.pushMessage("Overwrote a feature!");
          HTomb.World.features[c].remove();
          HTomb.World.features[c].despawn();
        }
        HTomb.World.features[c] = this.entity;
      }
    },
    onRemove: function(options) {
      let c = coord(this.entity.x,this.entity.y,this.entity.z);
      if (HTomb.World.features[c]) {
        delete HTomb.World.features[c];
      }
      if (this.stackedFeatures) {
        HTomb.World.features[c] = this.stackedFeatures.shift();
        if (this.stackedFeatures.length>0) {
          HTomb.World.features[c].feature.stackedFeatures = this.stackedFeatures;
        }
        this.stackedFeatures = null;
      }
    },
    dismantle: function(optionalTask) {
      if (this.integrity===null) {
        this.integrity=5;
      }
      this.integrity-=1;
      if (this.integrity<=0) {
        this.harvest();
        if (optionalTask) {
          optionalTask.complete();
        }
      }
    },
    harvest: function() {
      if (this.yields!==null) {
        var x = this.entity.x;
        var y = this.entity.y;
        var z = this.entity.z;
        for (var template in this.yields) {
          var n = HTomb.Utils.diceUntil(2,2);
          if (this.yields[template].nozero) {
            n = Math.max(n,1);
          }
          for (var i=0; i<n; i++) {
            var thing = HTomb.Things[template]().place(x,y,z);
          }
        }
      }
      this.entity.destroy();
    }
  });
  HTomb.Things.defineBehavior({
    template: "Zone",
    name: "zone",
    onPlace: function(x,y,z) {
      let c = coord(x,y,z);
      let zones = HTomb.World.zones;
      if (zones[c]) {
        let zn = zones[c];
        HTomb.Debug.pushMessage("Overwrote a zone!");
        zn.remove();
        zn.despawn();
      }
      zones[c] = this.entity;
    },
    onRemove: function() {
      let c = coord(this.entity.x, this.entity.y, this.entity.z);
      delete HTomb.World.zones[c];
      // sloppy placement of task!
      //if (this.task) {
      if (this.entity.task) {
        //let task = this.task;
        //this.task = null;
        let task = this.entity.task;
        this.entity.task = null;
        task.zone = null;
        task.cancel();
      }
    },
    onDescribe: function(options) {
      options.article = "none";
      return options;
    }
  });

  HTomb.Things.defineByProxy("Creature","Entity");
  HTomb.Things.defineByProxy("Item","Entity");
  HTomb.Things.defineByProxy("Feature","Entity");
  HTomb.Things.defineByProxy("Zone","Entity");

  function ItemContainer(args) {
    var container = Object.create(Array.prototype);
    for (var method in ItemContainer.prototype) {
      if (ItemContainer.prototype.hasOwnProperty(method)) {
        container[method] = ItemContainer.prototype[method];
      }
    }
    if (Array.isArray(args)) {
      for (var i=0; i<args.length; i++) {
        container.push(args[i]);
      }
    }
    return container;
  }
  HTomb.ItemContainer = ItemContainer;
  ItemContainer.prototype = {
    parent: null,
    stringify: function() {
      let a = [];
      for (let i=0; i<this.length; i++) {
        a.push(this[i]);
      }
      return {"ItemContainer" : a};
    },
    getParent: function() {
      if (parent===HTomb.World.items) {
        for (key in HTomb.World.items) {
          if (HTomb.World.items[key]===this) {
            return c = HTomb.Utils.decoord(key);
          }
        }
      } else {
        return parent;
      }
    },
    absorbStack: function(item) {
      var one;
      var two;
      for (var i=0; i<this.length; i++) {
        if ((this[i].template===item.template) && (this[i].item.n<this[i].item.maxn)) {
          one = item.item.n;
          two = this[i].item.n;
          if ((one+two)>item.item.maxn) {
            this[i].item.n = item.item.maxn;
            item.item.n = one+two-item.item.maxn;
          } else {
            this[i].item.n = one+two;
            item.item.n = 0;
          }
        }
      }
      if (item.item.n>0) {
        Array.prototype.push.call(this,item)
        item.item.container = this;
      } else {
        item.despawn();
      }
    },
    push: function(item) {
      if (item.item.stackable) {
        this.absorbStack(item);
      } else {
        Array.prototype.push.call(this,item);
        item.item.container = this;
      }
    },
    unshift: function(item) {
      if (item.item.stackable) {
        this.absorbStack(item);
      } else {
        Array.prototype.unshift.call(this,arg);
        item.item.container = this;
      }
    },
    contains: function(item) {
      var indx = this.indexOf(item);
      if (indx>-1) {
        return true;
      } else {
        return false;
      }
    },
    containsAny: function(template) {
      for (var i=0; i<this.length; i++) {
        if (this[i].template===template) {
          return true;
        }
      }
      return false;
    },
    countAll: function(template) {
      var tally = 0;
      for (var i=0; i<this.length; i++) {
        if (this[i].template===template) {
          tally+=this[i].item.n;
        }
      }
      return tally;
    },
    getFirst: function(template) {
      for (var i=0; i<this.length; i++) {
        if (this[i].template===template) {
          return this[i];
        }
      }
      return null;
    },
    getLast: function(template) {
      for (var i=this.length-1; i>=0; i--) {
        if (this[i].template===template) {
          return this[i];
        }
      }
      return null;
    },
    takeOne: function(i_or_t) {
      if (typeof(i_or_t)!=="string" && i_or_t.template) {
        i_or_t = i_or_t.template;
      }
      if (HTomb.Things.templates[i_or_t].stackable!==true) {
        return this.getFirst(i_or_t);
      } else {
        var last = this.getLast(i_or_t);
        if (last.item.n===1) {
          this.remove(last);
          return last;
        } else {
          last.item.n-=1;
          var single = HTomb.Things[last.template]();
          single.item.n = 1;
          return single;
        }
      }
    },
    take: function(i_or_t, n) {
      n = n || 1;
      if (typeof(i_or_t)!=="string" && i_or_t.template) {
        i_or_t = i_or_t.template;
      }
      if (HTomb.Things.templates[i_or_t].stackable!==true) {
        return this.getFirst(i_or_t);
      } else {
        var last = this.getLast(i_or_t);
        if (last.item.n<=n) {
          this.remove(last);
          return last;
        } else {
          last.item.n-=n;
          var taken = HTomb.Things[last.template]();
          taken.item.n = n;
          return taken;
        }
      }
    },
    shift: function() {
      var item = Array.prototype.shift.call(this);
      item.item.container = null;
      return item;
    },
    pop: function() {
      var item = Array.prototype.pop.call(this);
      item.item.container = null;
      return item;
    },
    remove: function(item) {
      var indx = this.indexOf(item);
      if (indx>-1) {
        item.item.container = null;
        this.splice(indx,1);
        // should this only happen if it's on the ground?
        item.remove();
        return item;
      }
    },
    list: function() {
      var mesg = "";
      for (var i = 0; i<this.length; i++) {
        if (i>0) {
          mesg+=" ";
        }
        mesg+=this[i].describe({article: "indefinite"});
        if (i===this.length-2) {
          mesg = mesg + ", and";
        } else if (i<this.length-1) {
          mesg = mesg + ",";
        }
      }
      return mesg;
    },
    lineList: function(spacer) {
      var buffer = [];
      for (var i = 0; i<this.length; i++) {
        buffer.push([spacer,this[i].describe({article: "indefinite"})]);
      }
      return buffer;
    },
    head: function() {
      return this[0];
    },
    tail: function() {
      return this[this.length-1];
    }
  };

return HTomb;
})(HTomb);
