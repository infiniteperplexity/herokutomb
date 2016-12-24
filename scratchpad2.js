HTomb.Things.define({
  template: "Task",
  name: "task",
  parent: "Thing",
  assigner: null,
  assignee: null,
  bg: "red",
  makes: ????,
  ingredients: {},
  designate: function() {},
  designateSquare: function() {},
});

HTomb.Things.define({
  template: "Task",
  name: "task",
  parent: "Thing",
  assigner: null,
  assignee: null,
  zone: null,
  zoneTemplate: null,
  makes: null,
  target: null,
  active: true,
  ingredients: {},
  // note that this passes the behavior, not the entity
  canReachZone: function(cr) {
    var x = this.zone.x;
    var y = this.zone.y;
    var z = this.zone.z;
    var path = HTomb.Path.aStar(x,y,z,cr.x,cr.y,cr.z,{useLast: false});
    if (path!==false) {
      return true;
    } else if (z===cr.z && HTomb.Path.distance(cr.x,cr.y,x,y)<=1) {
      return true;
      // does touchability work consistently?
    } else if (HTomb.Tiles.isTouchableFrom(x,y,z,cr.x,cr.y,cr.z)) {
      return true;
    } else {
      return false;
    }
  },
  designate: function(assigner) {
    HTomb.GUI.selectSquareZone(assigner.z,this.designateSquares,{
      context: this,
      assigner: assigner,
      callback: this.placeZone,
      outline: false,
      bg: this.zoneTemplate.bg
    });
  },
  designateSquare: function(x,y,z, options) {
    options = options || {};
    var assigner = options.assigner;
    var callb = options.callback;
    callb.call(options.context,x,y,z,assigner);
  },
  designateSquares: function(squares, options) {
    options = options || {};
    var assigner = options.assigner;
    var callb = options.callback;
    for (var i=0; i<squares.length; i++) {
      var crd = squares[i];
      callb.call(options.context,crd[0],crd[1],crd[2],assigner);
    }
  },
  placeZone: function(x,y,z,assigner) {
    var zone, t;
    if (this.canDesignateTile(x,y,z)) {
      zone = HTomb.Things[this.zoneTemplate.template]();
      zone.place(x,y,z);
      t = HTomb.Things[this.template]();
      zone.task = t;
      zone.assigner = assigner;
      t.zone = zone;
      t.assigner = assigner;
      if (assigner.master) {
        assigner.master.taskList.push(t);
      }
    }
    return zone;
  },
  onCreate: function() {
    HTomb.Events.subscribe(this,"Destroy");
    return this;
  },
  onDefine: function() {
    if (this.zoneTemplate) {
      HTomb.Things.defineZone(this.zoneTemplate);
    }
  },
  canPlaceFeature: function() {
    let f = HTomb.World.features[coord(this.zone.x, this.zone.y, this.zone.z)];
    if (f===undefined || (f.template==="IncompleteFeature" && f.makes===this.makes)) {
      return true;
    } else {
      return false;
    }
  },
  tryAssign: function(cr) {
    let f = HTomb.World.features[coord(this.zone.x, this.zone.y, this.zone.z)];
    // if there is not an incomplete feature there already started, search for ingredients
    if (this.canPlaceFeature()) {
      let ing = [];
      for (let i in this.ingredients) {
        ing.push([i,this.ingredients[i]]);
      }
      for (let i=0; i<ing.length; i++) {
        let items = HTomb.Utils.findItem(function(it) {
          if (it.template===this.ing[i] && it.isOwned() && it.isOnGround()) {
            return true;
          } else {
            return false;
          }
        });
        if (items.length===0) {
          // if any ingredients are missing, do not assign
          return false;
        }
      }
    }
    if (this.canReachZone(cr)) {
      this.assignTo(cr);
      return true;
    } else {
      return false;
    }
  },
  canDesignateTile: function(x,y,z) {
    return true;
  },
  assignTo: function(cr) {
    if (cr.minion===undefined) {
      HTomb.Debug.pushMessage("Problem assigning task");
    } else {
      this.assignee = cr;
      cr.worker.onAssign(this);
    }
  },
  onDestroy: function(event) {
    var cr = event.entity;
    if (cr===this.assignee) {
      this.unassign();
    } else if (cr===this.assigner) {
      this.cancel();
    }
  },
  unassign: function() {
    var cr = this.assignee;
    if (cr.worker===undefined) {
      HTomb.Debug.pushMessage("Problem unassigning task");
    } else {
      this.assignee = null;
      cr.worker.unassign();
    }
  },
  cancel: function() {
    var master = this.assigner;
    if (master) {
      var taskList = this.assigner.master.taskList;
      if (taskList.indexOf(this)!==-1) {
        taskList.splice(taskList.indexOf(this),1);
      }
    }
    if (this.assignee) {
      this.assignee.worker.unassign();
    }
    if (this.zone) {
      //prevent recursion traps
      let zone = this.zone;
      this.zone = null;
      zone.task = null;
      zone.remove();
      zone.despawn();
    }
    this.despawn();
  },
  complete: function() {
    // this generally should not get overridden
    var master = this.assigner;
    if (master) {
      var taskList = this.assigner.master.taskList;
      if (taskList.indexOf(this)!==-1) {
        taskList.splice(taskList.indexOf(this),1);
      }
    }
    if (this.assignee) {
      this.assignee.worker.unassign();
    }
    if (this.onComplete) {
      this.onComplete();
    }
    if (this.zone) {
      let zone = this.zone;
      this.zone = null;
      zone.task = null;
      zone.remove();
      zone.despawn();
    }
    this.despawn();
  },
  ai: function() {
    if (this.assignee.ai.acted===true) {
      return;
    }
    var x = this.zone.x;
    var y = this.zone.y;
    var z = this.zone.z;
    var f = HTomb.World.features[coord(x,y,z)];
    var cr = this.assignee ;
    if ((f===undefined || f.makes!==this.makes) && this.ingredients!==null) {
      HTomb.Routines.ShoppingList.act(cr.ai);
    }
    if (cr.ai.acted===true) {
      return;
    }
    HTomb.Routines.GoToWork.act(cr.ai);
  },
  spend: function() {
    var items = [];
    if (this.assignee.inventory.hasAll(this.ingredients)) {
      for (var ingredient in this.ingredients) {
        var n = this.ingredients[ingredient];
        //remove n ingredients from the entity's inventory
        this.assignee.inventory.items.take(ingredient,n);
      }
      return true;
    } else {
      return false;
    }
  },
  work: function(x,y,z) {
    let f = HTomb.World.features[coord(x,y,z)];
    if (this.canPlaceFeature()) {
      if (f && f.template==="IncompleteFeature" && f.makes===this.makes) {
        this.target = f;
        f.task = this;
        f.work();
        this.assignee.ai.acted = true;
      } else if (f && f.owned!==true) {
        f.feature.dismantle();
        this.assignee.ai.acted = true;
      } else {
        if (this.spend()===true) {
          f = HTomb.Things.IncompleteFeature();
          f.makes = this.makes;
          f.task = this;
          f.place(x,y,z, {featureConflict: "stack"});
          this.target = f;
          this.assignee.ai.acted = true;
        } else {
          return false;
        }
      }
    }
  }
});

HTomb.Things.defineFeature({
  template: "IncompleteFeature",
  name: "incomplete feature",
  symbol: "\u25AB",
  fg: "#BB9922",
  makes: null,
  steps: 5,
  onCreate: function(args) {
    let makes = HTomb.Things[args.makes](args);
    this.makes = makes;
    this.symbol = makes.incompleteSymbol || this.symbol;
    this.fg = makes.incompleteFg || makes.fg || this.fg;
    this.name = "incomplete "+makes.name;
  },
  work: function() {
    if (this.steps>0) {
      this.steps-=1;
    }
    if (this.makes.onWork) {
      this.makes.onWork(this);
    },
    if (this.steps<=0) {
      this.finished = true;
      this.makes.place(this.x, this.y, this.z, {featureConflict: "swap"});
      this.makes.onComplete(this);
    }
  },
  onDespawn: function() {
    this.makes.despawn();
  }
});

HTomb.Things.defineThing({
  template: "Container",
  name: "container",
  bulk: 10,
  push:,
  pop:,
  shift:,
  unshift:,
  _items: [],
  onDefine: function() {set properties 1-100 to throw warnings.}
});


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
