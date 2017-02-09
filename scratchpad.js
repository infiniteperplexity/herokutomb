  HTomb.Tutorial = {
    enabled: true,
    active: 0,
    tutorials: [],
    templates: {},
    reset: function() {
      this.active = 0;
      for (let i=0; i<this.tutorials.length; i++) {
        this.tutorials[i].complete = false;
      }
    },
    onEvent: function(event) {
      if (this.tutorials[active]["on" + event.type]) {
        this.tutorials[active]["on" + event.type](event);
      }
    },
  };

  function Tutorial(args) {
    args = args || {};
    this.template = args.template;
    this.completed = false;
    this.controls = args.controls || null;
    this.top = args.top || null;
    this.middle = args.middle || null;
    this.bottom = args.bottom || null;
    this.prereqs = args.prereqs || [];
    this.listens = args.listens || [];
    this.trigger = args.trigger || function () {return false};
    this.tracking = {};
  }

  new Tutorial({
    template: "WelcomeAndMovement",
    name: "welcome and movement",
    controls: [
      "Esc: System view.",
      " ",
      "%c{cyan}Move: NumPad/Arrows.",
      "(Control+Arrows for diagonal.)",
      " ",
      "?: Tutorial."
    ]
    top: [
      "",
      "Welcome to HellaTomb!",
      " ",
      "Try walking around using the numeric keypad.",
      " ",
      "If your keyboard has no keypad, use the arrow keys."
    ],
    listens: ["Command"],
    trigger: function(event) {
      if (!this.tracking.moves) {
        this.tracking.moves = 0;
      }
      if (event.command==="Move") {
        this.tracking.moves+=1;
      }
      return (this.tracking.moves>=5);
    }
  });

  new Tutorial({
    template: "ClimbingSlopes",
    name: "climbing slopes",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, %c{cyan}</>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "?: Tutorial."
    ],
    top: ["",
      "You may see different colors and symbols representing elevation.",
      " ",
      'Green areas with " are grass.',
      " ",
      'Dark green areas with \u02C5 are downward slopes.  Dark green areas with " are grass one level below you.',
      " ",
      "\u02C4 symbols are upward slopes.  Gray areas with # are walls, but they may have floors above them.",
      " ",
      "You can climb up or down a slope by pressing < or >, or automatically by trying to walk against the slope.",
      " ",
      "When you climb up or down, colors change with your relative elevation.",
      " ",
      "Try climbing up and down a few slopes."
    ],
    listens: ["Command"],
    trigger: function(event) {
      if (!this.tracking.ups || !this.tracking.downs) {
        this.tracking.ups = 0;
        this.tracking.downs = 0;
      }
      if (event.command==="Move" && event.dir==='U') {
        this.tracking.ups+=1;
      } else if (event.command==="Move" && event.dir==='D') {
        this.tracking.downs+=1;
      }
      return (this.tracking.ups>=2 && this.tracking.downs>=2);
    }
  });

  new Tutorial({
    template: "RaisingAZombieStepOne",
    name: "raising a zombie",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "%c{cyan}Z: Cast spell.",
      " ",
      "?: Tutorial."
    ],
    top: ["",
      "In many games, wandering around and exploring would be a good idea.",
      "However, in this game, you should probably stay close to where you started and build a fortress.",
      " ",
      "Let's get started on that raising our first zombie.",
      " ",
      "Near where you started, there should be some symbols like this: \u271D",
      "These are tombstones.  By the way, if you want to know what a symbol represents, hover over it with the mouse and look at the bottom half of the right panel.",
      " ",
      "Find a tombstone.  Then press Z to view a list of spells you can cast, and press A to choose 'Raise Zombie.'"
    ];
    listens: ["Command"]
    trigger: function(event) {
      return (event.command==="ShowSpells");
    }
  });

  new Tutorial({
    template: "RaisingAZombieStepTwo",
    name: "raising a zombie",
    controls: function(controls) {
      let txt = HTomb.Utils.copy(controls);
      txt[2] = "%c{cyan}" + txt[2];
      return txt;
    },
    top: HTomb.Tutorial.templates.RaisingAZombieStepOne.top,
    listens: ["Command"]
    trigger: function(event) {
      return (event.command==="ChooseSpell" && event.spell==="RaiseZombie");
    }
  });


  new Tutorial({
    template: "RaisingAZombieStepThree",
    name: "raising a zombie",
    controls: [
      "%c{orange}**Esc: Cancel.**",
      "%c{yellow}Select a square with keys or mouse.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "Click / Space: Select.",
    ],
    top: [
      "Select a tombstone using the mouse, or by navigating with the arrow keys and pressing space to select.",
      " ",
      "Notice that the bottom portion of this panel gives you information about the square you are hovering over - whether it's a valid target for your spell, what the terrain is like, what creatures are there, and so on."
    ],
    listens: ["Command"]
    trigger: function(event) {
      return (event.command==="CastSpell" && event.spell==="RaiseZombie");
    }
  });
