// The Events submodule, thus far unused, handles events and messaging
HTomb = (function(HTomb) {
  "use strict";

  var Events = HTomb.Events;
  Events.types = [];
  Events.subscribe = function(listener, etype) {
    if (Events[etype] === undefined) {
      Events[etype] = [];
      Events.types.push(etype);
    }
    if (Events[etype].indexOf(listener)===-1) {
      Events[etype].push(listener);
    }
  };
  Events.publish = function(event) {
    if (typeof(event)==="string") {
      event = {type: event};
    }
    if (Events[event.type] === undefined) {
      Events[event.type] = [];
      Events.types.push(event.type);
    }
    var listeners = Events[event.type] || [];
    for (var j=0; j<listeners.length; j++) {
      try {
        listeners[j]["on"+event.type](event);
      } catch(e) {
        console.log(listeners[j]);
      }
      //listeners[j].onEvent(event);
    }
  };
  Events.unsubscribeAll = function(listener) {
    for (var i=0; i<Events.types.length; i++) {
      Events.unsubscribe(listener, Events.types[i]);
    }
  };
  Events.unsubscribe = function(listener, etype) {
    if (Events[etype] === undefined) {
      Events[etype] = [];
      Events.types.push(etype);
    }
    if (Events[etype].indexOf(listener)!==-1) {
      Events[etype].splice(Events[etype].indexOf(listener),1);
    }
  };
  Events.reset = function() {
    for (let i=0; i<this.types.length; i++) {
      delete this[this.types[i]];
    }
  }

  return HTomb;
})(HTomb);
