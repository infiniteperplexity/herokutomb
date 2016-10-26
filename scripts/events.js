// The Events submodule, thus far unused, handles events and messaging
HTomb = (function(HTomb) {
  "use strict";

  var events = ["TURNEVENT"];
  var Events = HTomb.Events;
  Events.types = [];
  Events.subscribe = function(listener, etype) {
    if (Events[etype] === undefined) {
      Events[etype] = [];
      Events.types.push(etype);
    }
    Events[etype].push(listener);
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
      listeners[j]["on"+event.type](event);
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

  return HTomb;
})(HTomb);
