HTomb = (function(HTomb) {
  "use strict";

  HTomb.Tutorial = {
    enabled: true,
    active: 0,
    tutorials: [],
    templates: {},
    finish: function() {
      this.active = this.tutorials.length-1;
    },
    reset: function() {
      this.active = 0;
      for (let i=0; i<this.tutorials.length; i++) {
        this.tutorials[i].complete = false;
        this.tutorials[i].tracking = {};
      }
    },
    onEvent: function(event) {
      if (this.tutorials[this.active].listens.indexOf(event.type)!==-1) {
        let completed = this.tutorials[this.active].trigger(event);
        if (completed) {
          console.log("Completed tutorial: "+this.tutorials[this.active].template);
          this.tutorials[this.active].onComplete();
          if (this.active<this.tutorials.length-1) {
            this.active+=1;
            this.tutorials[this.active].tracking = {};
            console.log("Beginning tutorial: "+this.tutorials[this.active].template);
            this.tutorials[this.active].onBegin();
            return;
          }
        }
      }
      if (event.type==="Command" && event.command==="MainMode" && this.tutorials[this.active].rewind) {
       console.log("Rewinding tutorial: "+this.tutorials[this.active].rewind);
       this.goto(this.tutorials[this.active].rewind);
       return;
     }
      let skip = this.templates[this.tutorials[this.active].skip];
      if (!skip) {
        return;
      }
      let index = this.tutorials.indexOf(skip);
      if (skip.listens.indexOf(event.type)!==-1 && skip.trigger(event)) {
        do {
          console.log("Skipping tutorial: "+this.tutorials[this.active].template);
          this.tutorials[this.active].onComplete();
          if (this.active<this.tutorials.length-1) {
            this.active+=1;
            this.tutorials[this.active].tracking = {};
            console.log("Beginning tutorial: "+this.tutorials[this.active].template);
            this.tutorials[this.active].onBegin();
          }
        } while (this.active<=index);
      }

    },
    getMenu: function(menu) {
      let active = this.tutorials[this.active];
      let obj = {
        controls: HTomb.Utils.copy(menu.top),
        instructions: null,
        middle: HTomb.Utils.copy(menu.middle),
        bottom: HTomb.Utils.copy(menu.bottom)
      };
      let context = HTomb.GUI.Contexts.active;
      if (active.contexts.indexOf(context.contextName)!==-1) {
        if (active.controls!==null) {
          if (typeof(active.controls)==="function") {
            let txt = obj.controls;
            txt = active.controls(txt);
            obj.controls = txt;
          } else {
            obj.controls = active.controls;
          }
        }
        if (typeof(active.instructions)==="function") {
          obj.instructions = active.instructions();
        } else {
          obj.instructions = active.instructions;
        }
        if (active.middle!==null) {
          obj.middle = active.middle;
        }
        if (active.bottom!==null) {
          obj.bottom = active.bottom;
        }
        return obj;
      } else {
        if (context.contextName==="Survey") {
          obj.instructions = ["%c{orange}You have strayed from the tutorial.  Press Tab to get back on track or ? to hide tutorial messages."];
        } else if (active.backupInstructions) {
          obj.instructions = active.backupInstructions;
        } else if (context.contextName!=="Main") {
          obj.instructions = ["%c{orange}You have strayed from the tutorial.  Press Escape to get back on track or ? to hide tutorial messages."];
        } else {
          obj.instructions = ["If you see this, something has gone wrong..."];
        }
        return obj;
      }
    },
    goto: function(arg) {
      if (typeof(arg)==="number") {
        this.active = arg;
      } else if (typeof(arg)==="string") {
        let template = this.templates[arg];
        this.active = this.tutorials.indexOf(template);
      }
    }
  };

  function Tutorial(args) {
    args = args || {};
    this.template = args.template;
    HTomb.Tutorial.tutorials.push(this);
    HTomb.Tutorial.templates[this.template] = this;
    this.contexts = args.contexts || ["Main"];
    this.controls = args.controls || null;
    this.instructions = args.instructions || null;
    this.backupInstructions = args.backupInstructions || null;
    this.skip = args.skip || null;
    this.rewind = args.rewind || null;
    this.middle = args.middle || null;
    this.bottom = args.bottom || null;
    this.listens = args.listens || [];
    this.onBegin = args.onBegin || function() {};
    this.onComplete = args.onComplete || function() {};
    this.trigger = args.trigger || function () {return false};
    this.tracking = {};
  }

  new Tutorial({
    template: "WelcomeAndMovementStepOne",
    name: "welcome and movement",
    controls: [
      "Esc: System view.",
      " ",
      "%c{cyan}Move: NumPad/Arrows.",
      "Control+Arrows for diagonal.)",
      " ",
      "%c{cyan}?: Toggle tutorial."
    ],
    instructions: [
      "%c{yellow}Welcome to HellaTomb!",
      " ",
      "%c{white}You walk amongst the tombstones of a hillside graveyard, searching for the site upon which you will build your mighty fortress.",
      " ",
      "%c{cyan}Try walking around using the numeric keypad.  If your keyboard has no keypad, use the arrow keys."
    ],
    listens: ["Command"],
    skip: "RaisingAZombieStepOne",
    onBegin: function() {
      if (HTomb.Tutorial.enabled) {
        HTomb.GUI.autopause = true;
      }
    },
    trigger: function(event) {
      if (!this.tracking.moves) {
        this.tracking.moves = 0;
      }
      if (event.command==="Move") {
        this.tracking.moves+=1;
      }
      return (this.tracking.moves>=3);
    }
  });

  new Tutorial({
    template: "WelcomeAndMovementStepTwo",
    name: "welcome and movement",
    controls: [
      "Esc: System view.",
      " ",
      "%c{cyan}Move: NumPad/Arrows.",
      "Control+Arrows for diagonal.)",
      " ",
      "%c{cyan}?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}You walk amongst the tombstones of a hillside graveyard, searching for the site upon which you will build your mighty fortress.",
      " ",
      '- Green areas with " are grass.',
      " ",
      "- Dim green areas are also grass, one elevation level below you.",
      " ",
      "- Gray areas with # are walls, but they may have walkable floors one level above you.",
      " ",
      "- Other symbols (\u2663, \u2660, \u2698) may be",
      "trees or plants.",
      " ",
      "- Letters such as 's' or 'b' are wild animals, mostly harmless for now.",
      " ",
      "%c{cyan}Try walking around using the numeric keypad.  If your keyboard has no keypad, use the arrow keys."
    ],
    listens: ["Command"],
    skip: "RaisingAZombieStepOne",
    onBegin: function() {
      if (HTomb.Tutorial.enabled) {
        HTomb.GUI.autopause = true;
      }
    },
    trigger: function(event) {
      if (!this.tracking.moves) {
        this.tracking.moves = 0;
      }
      if (event.command==="Move") {
        this.tracking.moves+=1;
      }
      return (this.tracking.moves>=7);
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
      "?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}You scramble up and down the slopes for a better view of the area.",
      " ",
      "- The \u02C4 and \u02C5 symbols are slopes.",
      " ",
      "- You can climb up or down a slope by standing on it and pressing < or >.",
      " ",
      "- If you try to walk sideways off a cliff or into a wall, you will automatically climb a slope instead if possible.",
      " ",
      "- When you climb up or down, colors change with your relative elevation.",
      " ",
      "%c{cyan}Try climbing up and down a few slopes."
    ],
    listens: ["Command"],
    skip: "RaisingAZombieStepOne",
    trigger: function(event) {
      if (this.tracking.ups===undefined && this.tracking.downs===undefined) {
        this.tracking.ups = 0;
        this.tracking.downs = 0;
      }
      if (event.command==="Move" && event.dir==='U') {
        this.tracking.ups+=1;
      } else if (event.command==="Move" && event.dir==='D') {
        this.tracking.downs+=1;
      }
      return (this.tracking.ups+this.tracking.downs>=3);
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
      "?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}Enough of this pointless wandering - it is time to summon an undead servant.",
      " ",
      "Near where you started, there should be some symbols like this: \u271D. These are tombstones.  If you want to know what a symbol represents, hover over it with the mouse and look at the bottom half of the right panel.",
      " ",
      "%c{cyan}Find a tombstone.  Then press Z to view a list of spells you can cast, and press A to choose 'raise zombie.'"
    ],
    listens: ["Command"],
    skip: "WaitingForTheZombie",
    trigger: function(event) {
      return (event.command==="ShowSpells");
    }
  });

  new Tutorial({
    template: "RaisingAZombieStepTwo",
    name: "raising a zombie",
    contexts: ["ShowSpells"],
    controls: function(txt) {
      txt[2] = "%c{cyan}" + txt[2];
      return txt;
    },
    instructions: HTomb.Tutorial.templates.RaisingAZombieStepOne.instructions,
    backupInstructions: ["%c{cyan}Find a tombstone.  Then press Z to view a list of spells you can cast, and press A to choose 'raise zombie.'"],
    listens: ["Command"],
    skip: "WaitingForTheZombie",
    rewind: "RaisingAZombieStepOne",
    trigger: function(event) {
      return (event.command==="ChooseSpell" && event.spell.template==="RaiseZombie");
    }
  });


  new Tutorial({
    template: "RaisingAZombieStepThree",
    name: "raising a zombie",
    contexts: ["CastRaiseZombie"],
    controls: [
      "%c{orange}**Esc: Cancel.**",
      "%c{yellow}Select a square with keys or mouse.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "Click / Space: Select.",
    ],
    instructions: [
      "%c{cyan}Select a tombstone using the mouse, or by navigating with the arrow keys and pressing space to select.",
      " ",
      "Notice that the bottom portion of this panel gives you information about the square you are hovering over - whether it's a valid target for your spell, what the terrain is like, and so on."
    ],
    backupInstructions: HTomb.Tutorial.templates.RaisingAZombieStepTwo.backupInstructions,
    listens: ["Cast"],
    skip: "WaitingForTheZombie",
    rewind: "RaisingAZombieStepOne",
    trigger: function(event) {
      return (event.spell.template==="RaiseZombie");
    }
  });

  new Tutorial({
    template: "AchievementsAndScrolling",
    name: "achievements and scrolling",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell.",
      " ",
      "%c{cyan}PageUp/Down: Scroll messages.",
      "%c{cyan}A: Achievements, %c{}?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}Forbidden runes swirl around you as you call forth a corpse from its grave.",
      " ",
      "You just earned an achievement, as noted on the message bar below the play area.  You can scroll messages up and down using the PageUp and PageDown keys (on a Mac, Fn+Arrows.)",
      " ",
      "%c{cyan}Press 'A' to view the achievements screen."
    ],
    listens: ["Command"],
    skip: "WaitingForTheZombie",
    trigger: function(event) {
      if (this.tracking.achievements===undefined) {
        this.tracking.achievements = false;
      }
      if (this.tracking.reset===undefined) {
        this.tracking.reset = false;
      }
      if (event.command==="ShowAchievements") {
        this.tracking.achievements = true;
      }
      if (this.tracking.achievements===true && event.command==="MainMode") {
        this.tracking.reset = true;
      }
      return (this.tracking.achievements===true && this.tracking.reset===true);
    }
  });

  new Tutorial({
    template: "WaitingForTheZombie",
    name: "waiting for the zombie",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "%c{cyan}Wait: NumPad 5 / Space.",
      " ",
      "Z: Cast spell.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}You wait, smiling grimly as your undead thrall claws its way out of its grave.",
      " ",
      "The orange background around the tombstone indicates that there is a task assigned in that square.",
      " ",
      "%c{cyan}Press 5 on the numeric keypad several times, until your zombie emerges.  If you have no numeric keypad, press Space to wait."
    ],
    listens: ["Complete"],
    skip: "AssignAJob",
    trigger: function(event) {
      return (event.task && event.task.template==="ZombieEmergeTask");
    }
  });

  new Tutorial({
    template: "UnpausingAndChangingSpeeds",
    name: "unpausing and changing speeds",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Space.",
      " ",
      "%c{cyan}Enter: Enable auto-pause.",
      "%c{cyan}+/-: Change speed.",
      " ",
      "Z: Cast spell.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}Your minion bursts forth from the ground!",
      " ",
      "Notice the word 'Paused' above the right-hand side of the message bar.  The game is currently auto-paused - one turn will pass for each action you take.",
      " ",
      "Press Enter / Return to toggle auto-pause.  If you turn it off, turns will pass in realtime.",
      " ",
      "Press + or - to make time pass faster or slower.",
      " ",
      "%c{cyan}Wait for some time to pass.  Your zombie will wander a short distance from you.  If it seems to disappear, it probably went up or down a slope."
    ],
    listens: ["TurnBegin"],
    skip: "AssignAJob",
    trigger: function(event) {
      if (!this.tracking.turns) {
        this.tracking.turns = 0;
      }
      this.tracking.turns+=1;
      let split = HTomb.Time.getSpeed().split("/");
      return ((this.tracking.turns>=10  && ((split[1]/split[0])>=1 || HTomb.GUI.autopause===true)) || this.tracking.turns>=20);
    }
  });

  new Tutorial({
    template: "AssignAJob",
    name: "assign a job",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, %c{cyan}J: Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}You close your eyes and concentrate, formulating a task for your unthinking slave.",
      " ",
      "%c{cyan}Press J to assign a job, and then press A to make your zombie dig."
    ],
    listens: ["Command"],
    skip: "WaitingForDig",
    trigger: function(event) {
      return (event.command==="ShowJobs");
    }
  });

  new Tutorial({
    template: "ChooseAJob.",
    name: "choose a job",
    contexts: ["ShowJobs"],
    controls: function(txt) {
      txt[2] = "%c{cyan}" + txt[2];
      return txt;
    },
    instructions: HTomb.Tutorial.templates.AssignAJob.instructions,
    backupInstructions: HTomb.Tutorial.templates.AssignAJob.instructions,
    listens: ["Command"],
    skip: "WaitingForDig",
    rewind: "AssignAJob",
    trigger: function(event) {
      return (event.command==="ChooseJob" && event.task && event.task.template==="DigTask");
    }
  });

  new Tutorial({
    template: "DesignateTilesForDigging",
    name: "designate tiles for digging",
    contexts: ["DesignateDigTask"],
    controls: null,
    instructions: [
      "%c{cyan}Select a rectangular area for your zombie to dig.",
      " ",
      "What 'dig' means is contextual, depending on the terrain you select:",
      " ",
      "- Digging on the floor will make a pit.",
      " ",
      "- Digging in a wall will make a tunnel.",
      " ",
      "- Digging on a slope levels the slope.",
      " ",
      "Look below this panel for a hint about what digging does in the highlighted square."
    ],
    backupInstructions: HTomb.Tutorial.templates.AssignAJob.instructions,
    listens: ["Designate"],
    skip: "WaitingForDig",
    rewind: "AssignAJob",
    trigger: function(event) {
      return (event.task && event.task.template==="DigTask");
    }
  });

  new Tutorial({
    template: "WaitingForDig",
    name: "waiting for zombie to dig",
    controls: null,
    instructions: [
      "%c{white}The zombie shuffles dutifully to complete its task.",
      " ",
      "%c{cyan}Now wait for your zombie to dig.",
      " ",
      "There is a chance that you will unlock one or more additional achievements, depending on where your zombie digs and what it finds."
    ],
    skip: "WaitForSecondZombie",
    listens: ["Complete"],
    trigger: function(event) {
      // special handling for the one tutorial you're allowed to do out of order
      if (event.task && event.task.template==="ZombieEmergeTask" && HTomb.Player.master.minions.length>=2) {
          console.log("Skipping ahead in tutorial.");
          HTomb.Tutorial.goto("NavigationModeStepOne");
          return false;
      }
      return (event.task && event.task.template==="DigTask");
    }
  });

  new Tutorial({
    template: "RaiseASecondZombie",
    name: "raise a second zombie",
    contexts: ["Main","ShowSpells","CastRaiseZombie"],
    controls: function(txt) {
      let context = HTomb.GUI.Contexts.active.contextName;
      if (context==="Main") {
        return [
          "Esc: System view.",
          " ",
          "Move: NumPad/Arrows, </>: Up/Down.",
          "(Control+Arrows for diagonal.)",
          "Wait: NumPad 5 / Space.",
          " ",
          "Enter: Enable auto-pause.",
          "+/-: Change speed.",
          " ",
          "%c{cyan}Z: Cast spell, %c{}J: Assign job.",
          " ",
          "PageUp/Down: Scroll messages.",
          "A: Achievements, ?: Toggle tutorial."
        ];
      } else if (context==="ShowSpells") {
        txt[2] = "%c{cyan}"+txt[2];
        return txt;
      } else {
        return txt;
      }
    },
    instructions: [
      "%c{white}This decaying wretch is but the beginning - soon, you will command an undead horde.",
      " ",
      "Every zombie under your control raises the mana cost of the Raise Zombie spell.  Your current mana is listed above the left-hand side of the message bar.",
      " ",
      "%c{cyan}Wait until you have 15 mana, then raise a second zombie and wait for it to emerge."
    ],
    listens: ["Cast"],
    skip: "WaitForSecondZombie",
    trigger: function(event) {
      return (event.spell.template==="RaiseZombie");
    }
  });

  new Tutorial({
    template: "WaitForSecondZombie",
    name: "raise a second zombie",
    controls: [
      "Esc: System view.",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "%c{cyan}Z: Cast spell, %c{}J: Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}This decaying wretch is but the beginning - soon, you will command an undead horde.",
      " ",
      "Every zombie under your control raises the mana cost of the Raise Zombie spell.  Your current mana is listed above the left-hand side of the message bar.",
      " ",
      "%c{cyan}Wait for your second zombie to emerge."
    ],
    listens: ["Complete"],
    skip: "WaitingForHarvest",
    trigger: function(event) {
      return (event.task && event.task.template==="ZombieEmergeTask" && HTomb.Player.master.minions.length>=2);
    }
  });

  new Tutorial({
    template: "NavigationModeStepOne",
    name: "navigation mode",
    controls: [
      "Esc: System view.",
      "%c{cyan}Avatar mode (Tab: Navigation mode)",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, J: Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial."
    ],
    instructions: [
      "%c{white}These mindless servants shall be your hands, eyes, and ears.",
      " ",
      "Once you have several zombies, there is less need for your necromancer to walk around.  You may wish to spend most of your time in 'Navigation Mode', moving the viewing window independently while your necromancer meditates on a throne or conducts research in a laboratory.",
      " ",
      "%c{cyan}Press Tab to enter Navigation Mode.",
    ],
    listens: ["Command"],
    skip: "WaitingForHarvest",
    trigger: function(event) {
      return (event.command==="SurveyMode");
    }
  });

  new Tutorial({
    template: "NavigationModeStepTwo",
    name: "navigation mode",
    contexts: ["Survey"],
    controls: [
      "Esc: System view.",
      "%c{yellow}*Navigation mode (Tab: Avatar mode)*",
      " ",
      "%c{cyan}Move: NumPad/Arrows, </>: Up/Down",
      "%c{cyan}(Control+Arrows for diagonal.)",
      "%c{cyan}Wait: NumPad 5 / Control+Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, J: Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial.",
    ],
    instructions: [
      "Now you are in navigation mode.",
      " ",
      "Move the screen around using the keypad or arrows.  Hold Shift to move multiple spaces at a time.  Also try pressing < or > to move the view up or down a level.  To wait in Navigation Mode, press 5 on the keypad, or Control+Space.",
      " ",
      "%c{cyan}Press Tab to return to 'Avatar Mode' and recenter the screen, putting you in direct control of the necromancer."
    ],
    listens: ["Command"],
    skip: "WaitingForHarvest",
    trigger: function(event) {
      return (event.command==="MainMode");
    }
  });


  new Tutorial({
    template: "HarvestResourcesStepOne",
    name: "harvest resources",
    controls: [
      "Esc: System view.",
      "%c{yellow}Avatar mode (Tab: Navigation mode)",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, %c{cyan}J: Assign job.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Toggle tutorial.",
    ],
    instructions: [
      "%c{white}The boulders of these hills will form the bones of your fortress, and the trees shall fuel its fires.",
      " ",
      "%c{cyan}Press J to assign a job, and then press D to harvest."
    ],
    listens: ["Command"],
    skip: "WaitingForHarvest",
    trigger: function(event) {
      return (event.command==="ShowJobs");
    }
  });

  new Tutorial({
    template: "HarvestResourcesStepTwo.",
    name: "harvest resources",
    contexts: ["ShowJobs","Main"],
    controls: function(txt) {
      txt[5] = "%c{cyan}" + txt[5];
      return txt;
    },
    instructions: HTomb.Tutorial.templates.HarvestResourcesStepOne.instructions,
    listens: ["Command"],
    skip: "WaitingForHarvest",
    rewind: "HarvestResourcesStepOne",
    trigger: function(event) {
      return (event.command==="ChooseJob" && event.task && event.task.template==="DismantleTask");
    }
  });

  new Tutorial({
    template: "HarvestResourcesStepThree.",
    name: "harvest resources",
    contexts: ["DesignateDismantleTask"],
    controls: null,
    instructions: [
      "The green \u2663 and \u2660 symbols on the map are trees.",
      " ",
      "%c{cyan}Select a rectangular area that includes some trees, then wait for your zombies to harvest some wood."
    ],
    listens: ["Designate"],
    skip: "WaitingForHarvest",
    rewind: "HarvestResourcesStepOne",
    trigger: function(event) {
      return (event.task && event.task.template==="DismantleTask");
    }
  });

  new Tutorial({
    template: "WaitingForHarvest",
    name: "harvest resources",
    controls: null,
    instructions: [
      "%c{cyan}Wait for your zombies to harvest some wood."
    ],
    listens: ["Complete"],
    trigger: function(event) {
      // This logic attempts to catch whether someone harvested the wrong thing
      if (event.task && event.task.template==="DismantleTask") {
        if (HTomb.Player.master.ownsAllIngredients({WoodPlank: 1})) {
          console.log(HTomb.Player.master.taskList.length);
          return true;
        } else if (HTomb.Player.master.taskList.length<=1) {
          HTomb.Tutorial.goto("HarvestResourcesStepOne");
          return false;
        }
      }
    }
  });

  new Tutorial({
    template: "PickingUpItems",
    name: "picking up items",
    contexts: ["Main","ChooseItemToPickup"],
    controls: [
      "Esc: System view.",
      "%c{yellow}Avatar mode (Tab: Navigation mode)",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, J: Assign job.",
      "%c{cyan}G: Pick Up, %c{}D: Drop, I: Inventory.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, ?: Tutorial.",
    ],
    instructions: [
      "%c{white}Your zombies chop down a tree.  You approach to examine their handiwork.",
      " ",
      "Once you build some workshops, your zombies can use this wood to craft items.  Also, you can press G, D, or I to have your necromancer pick up, drop, and examine items.",
      " ",
      "%c{cyan}Walk over to the wood and try picking it up."
    ],
    listens: ["Command"],
    trigger: function(event) {
      return (event.command==="PickUp" && event.item.template==="WoodPlank");
    }
  });

  new Tutorial({
    template: "DroppingItems",
    name: "dropping items",
    contexts: ["Main","ChooseItemToDrop"],
    controls: function(txt) {
      if (HTomb.GUI.Contexts.active.contextName==="ChooseItemToDrop") {
        return txt;
      } else {
        return [
          "Esc: System view.",
          "%c{yellow}Avatar mode (Tab: Navigation mode)",
          " ",
          "Move: NumPad/Arrows, </>: Up/Down.",
          "(Control+Arrows for diagonal.)",
          "Wait: NumPad 5 / Space.",
          " ",
          "Enter: Enable auto-pause.",
          "+/-: Change speed.",
          " ",
          "Z: Cast spell, J: Assign job.",
          "G: Pick Up, %c{cyan}D: Drop, I: Inventory.",
          " ",
          "PageUp/Down: Scroll messages.",
          "A: Achievements, ?: Tutorial."
        ];
      }
    },
    instructions: [
      "%c{white}You pick up a wooden plank.  From crude materials such as these, your servants will fashion buildings, tools...and weapons.",
      " ",
      "For the most part, you won't carry around many items in this game.  The wood you harvested, for example, is more useful lying on the ground where your zombies can get to it.  Once you build some workshops, the zombies can use the wood planks to create items or furnishings.",
      " ",
      "%c{cyan}Try dropping an item now."
    ],
    listens: ["Command"],
    trigger: function(event) {
      return (event.command==="Drop");
    }
  });


  new Tutorial({
    template: "EndOfTutorial",
    name: "end of tutorial",
    controls: [
      "Esc: System view.",
      "%c{yellow}Avatar mode (Tab: Navigation mode)",
      " ",
      "Move: NumPad/Arrows, </>: Up/Down.",
      "(Control+Arrows for diagonal.)",
      "Wait: NumPad 5 / Space.",
      " ",
      "Enter: Enable auto-pause.",
      "+/-: Change speed.",
      " ",
      "Z: Cast spell, J: Assign job.",
      "%c{cyan}M: Minions, S: Structures, U: Summary.",
      "G: Pick Up, D: Drop, I: Inventory.",
      " ",
      "PageUp/Down: Scroll messages.",
      "A: Achievements, %c{cyan}?: Tutorial.",
      "%c{cyan}F: Submit Feedback."
    ],
    instructions: [
      "%c{white}Cruel laughter wells in your throat.  Your fortress will cast a shadow of menace over all the land.  The undead under your command will become a legion, a multitude, an army.  And then all who have wronged you will pay!",
      " ",
      "Congratulations, you finished the tutorial.  Experiment with different tasks and commands.  See if you can unlock all the achievements in the demo.",
      " ",
      "%c{cyan}Press ? to dismiss these messages."
    ],
    listens: ["Command"],
    trigger: function(event) {
      return (event.command==="DisableTutorial");
    }
  });

  new Tutorial({
    template: "EndOfTutorial",
    name: "end of tutorial",
    contexts: ["Survey","Main"],
    controls: null,
    instructions: [
      "You have finished the tutorial.",
      " ",
      "%c{cyan}Press ? to dismiss these messages."
    ],
    listens: [],
    trigger: function(event) {
      return false;
    }
  });


  return HTomb;
})(HTomb);
