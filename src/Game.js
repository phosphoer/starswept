TANK.registerComponent('Game')

.construct(function()
{
  // Game scale factor
  this.scaleFactor = 2;
  this.volume = 0.5;

  // Menu options
  this.menuOptions = [];

  // Event log
  this.eventLogs = [];
  this.eventLogsTimed = [];
  this.story = [];

  // Mouse positions
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];

  // Global light direction
  this.lightDir = 0;

  // Current ship selection
  this.playerShipSelection = 'frigate';

  // Unlocked ships
  this.unlockedShips =
  {
    'frigate': true,
    'albatross': true
  };
})

.initialize(function()
{
  var that = this;
  var resources = this._entity.Resources;

  // Configure Lightr
  Lightr.minLightIntensity = 0.2;
  Lightr.lightDiffuse = [0.8, 0.8, 1];

  //
  // Load resources
  //
  function loadLighting(name, path, resources, doneCallback)
  {
    var res = {};
    res.diffuse = resources.get(name + '-diffuse');
    res.normals = resources.get(name + '-normals');
    res.lightBuffers = Lightr.bake(6, res.diffuse, res.normals);
    doneCallback(res);
  };

  resources.add('asteroid-01-diffuse', 'res/img/asteroid-01-diffuse.png');
  resources.add('asteroid-01-normals', 'res/img/asteroid-01-normals.png');
  resources.add('asteroid-01', null, ['asteroid-01-diffuse', 'asteroid-01-normals'], loadLighting);

  resources.add('fighter-diffuse', 'res/img/fighter.png');
  resources.add('fighter-normals', 'res/img/fighter-normals.png');
  resources.add('fighter', null, ['fighter-diffuse', 'fighter-normals'], loadLighting);

  resources.add('bomber-diffuse', 'res/img/bomber.png');
  resources.add('bomber-normals', 'res/img/bomber-normals.png');
  resources.add('bomber', null, ['bomber-diffuse', 'bomber-normals'], loadLighting);

  resources.add('frigate-diffuse', 'res/img/frigate.png');
  resources.add('frigate-normals', 'res/img/frigate-normals.png');
  resources.add('frigate', null, ['frigate-diffuse', 'frigate-normals'], loadLighting);

  resources.add('ship-blade-diffuse', 'res/img/ship-blade-diffuse.png');
  resources.add('ship-blade-normals', 'res/img/ship-blade-normals.png');
  resources.add('ship-blade', null, ['ship-blade-diffuse', 'ship-blade-normals'], loadLighting);

  resources.add('ship-albatross-diffuse', 'res/img/ship-albatross-diffuse.png');
  resources.add('ship-albatross-normals', 'res/img/ship-albatross-normals.png');
  resources.add('ship-albatross', null, ['ship-albatross-diffuse', 'ship-albatross-normals'], loadLighting);

  resources.add('ship-rhino-diffuse', 'res/img/ship-rhino-diffuse.png');
  resources.add('ship-rhino-normals', 'res/img/ship-rhino-normals.png');
  resources.add('ship-rhino', null, ['ship-rhino-diffuse', 'ship-rhino-normals'], loadLighting);

  resources.add('ship-enforcer-diffuse', 'res/img/ship-enforcer-diffuse.png');
  resources.add('ship-enforcer-normals', 'res/img/ship-enforcer-normals.png');
  resources.add('ship-enforcer', null, ['ship-enforcer-diffuse', 'ship-enforcer-normals'], loadLighting);

  resources.add('station-01-diffuse', 'res/img/station-01-diffuse.png');
  resources.add('station-01-normals', 'res/img/station-01-normals.png');
  resources.add('station-01', null, ['station-01-diffuse', 'station-01-normals'], loadLighting);

  resources.add('fuel-cell-diffuse', 'res/img/fuel-cell-diffuse.png');
  resources.add('fuel-cell-normals', 'res/img/fuel-cell-normals.png');
  resources.add('fuel-cell', null, ['fuel-cell-diffuse', 'fuel-cell-normals'], loadLighting);

  resources.add('ball-diffuse', 'res/img/ball-diffuse.png');
  resources.add('ball-normals', 'res/img/ball-normals.png');
  resources.add('ball', null, ['ball-diffuse', 'ball-normals'], loadLighting);

  //
  // Rebuild lighting
  //
  this.rebuildLighting = function()
  {
    var resMap = resources.getAll();
    for (var i in resMap)
    {
      var res = resMap[i];
      if (res.lightBuffers)
        res.lightBuffers = Lightr.bake(8, res.diffuse, res.normals);
    }
  };

  //
  // Save the current game
  //
  this.save = function(slot)
  {
    if (!slot)
      slot = 'main';
    var save = {unlockedShips: this.unlockedShips};
    localStorage['save-' + slot] = JSON.stringify(save);
  };

  //
  // Load a save slot
  //
  this.load = function(slot)
  {
    if (!slot)
      slot = 'main';
    var saveData = localStorage['save-' + slot];
    if (saveData)
    {
      var save = JSON.parse(saveData);
      this.unlockedShips = save.unlockedShips;
    }
  };

  //
  // Update the mouse world position
  //
  this.updateMousePos = function(pos)
  {
    this.mousePosScreen = [pos[0], pos[1]];
    this.mousePosWorld = pos;
    this.mousePosWorld[0] -= window.innerWidth / 2;
    this.mousePosWorld[1] -= window.innerHeight / 2;
    this.mousePosWorld[0] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[1] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[0] += TANK.main.Renderer2D.camera.x;
    this.mousePosWorld[1] += TANK.main.Renderer2D.camera.y;
  };

  //
  // Update light source
  //
  this.updateLightSource = function()
  {
    if (!this.lightSource)
    {
      this.lightSource = TANK.createEntity('Star');
      TANK.main.addChild(this.lightSource);
    }

    this.lightSource.Pos2D.x = Math.cos(this.lightDir) * 5000;
    this.lightSource.Pos2D.y = Math.sin(this.lightDir) * 5000;

    if (this.currentLocation)
    {
      this.lightSource.Star.outerColor = this.currentLocation.lightColor.map(function(val) {return Math.floor(val * 255);});
    }
  };

  //
  // Move to the main menu state
  //
  this.goToMainMenu = function()
  {
    TANK.main.Renderer2D.camera.z = 1;
    TANK.main.Renderer2D.camera.x = 0;
    TANK.main.Renderer2D.camera.y = 0;

    // Remove any existing objects
    this.player = null;
    TANK.main.removeAllChildren();
    this.clearEventLog();

    // Build main menu scene
    this.lightDir = Math.random() * Math.PI * 2;
    this.mainMenu = TANK.createEntity('MainMenu');
    TANK.main.addChild(this.mainMenu);

    // Create light source entity
    this.updateLightSource();

    // Handle main menu interactions
    this.listenTo(this.mainMenu, 'newgame', function()
    {
      TANK.main.removeChild(this.mainMenu);
      this.goToShipSelection();
    });

    // Remove event log
    if (this.eventLogUI)
    {
      this.eventLogUI.teardown();
      this.eventLogUI = null;
    }
  };

  //
  // Go to selection screen
  //
  this.goToShipSelection = function()
  {
    // Build menu
    this.load();
    this.shipSelection = TANK.createEntity('ShipSelection');
    TANK.main.addChild(this.shipSelection);

    // Handle interaction
    this.listenTo(this.shipSelection, 'selectionmade', function(selection)
    {
      TANK.main.removeChild(this.shipSelection);
      this.playerShipSelection = selection;
      this.goToNode(TANK.main.MapGeneration.map);
    });
  };

  //
  // Go to end screen
  //
  this.goToWinScreen = function()
  {
    this.clearEventLog();
    this.endScreen = TANK.createEntity('EndScreen');
    this.endScreen.EndScreen.won = true;
    TANK.main.addChild(this.endScreen);

    this.listenTo(this.endScreen, 'back', function()
    {
      this.goToMainMenu();
    });
  };

  this.goToLoseScreen = function()
  {
    this.clearEventLog();
    this.endScreen = TANK.createEntity('EndScreen');
    this.endScreen.EndScreen.won = false;
    TANK.main.addChild(this.endScreen);

    this.listenTo(this.endScreen, 'back', function()
    {
      this.goToMainMenu();
    });
  };

  //
  // Pick a random weighted index
  //
  this.randomWeighted = function(weights)
  {
    var weightsNoZero = weights.filter(function(val) {return val > 0;});
    var minValue = Math.min.apply(null, weightsNoZero);
    var weightsNormalized = weights.map(function(val) {return val * (1 / minValue);});
    var weightArray = [];
    for (var i = 0; i < weightsNormalized.length; ++i)
    {
      for (var j = 0; j < weightsNormalized[i]; ++j)
        weightArray.push(i);
    }

    var rng = new RNG();
    var index = rng.random(0, weightArray.length);
    return weightArray[index];
  };

  //
  // Add an event log
  //
  this.addEventLog = function(logText)
  {
    this.eventLogs.push({text: logText});
    var logContainer = document.querySelector('.event-log');
    logContainer.scrollTop = logContainer.scrollHeight;
  };

  this.addEventLogTimed = function(logText, time)
  {
    this.eventLogsTimed.push({text: logText, time: time});
  };

  //
  // Clear event log
  //
  this.clearEventLog = function()
  {
    while (this.eventLogs.length)
      this.eventLogs.pop();
  };

  //
  // Story log
  //
  this.addStory = function(eventText)
  {
    var expandMacros = function(str)
    {
      str = str.replace(/\{\{location\}\}/g, this.currentLocation.name);
      return str;
    }.bind(this);

    this.story.push(
    {
      eventText: expandMacros(eventText)
    });
  };

  this.getStoryText = function()
  {
    var storyText = '';
    for (var i = 0; i < this.story.length; ++i)
    {
      var story = this.story[i];
      storyText += story.eventText + '\n';
    }

    return storyText;
  };

  //
  // Show location options
  //
  this.showLocationOptions = function()
  {
    // Verify jump is possible
    if (!this.warpReady)
    {
      this.addEventLog('Warp drive is not fully charged');
      return;
    }
    if (this.player.Ship.fuel < 1)
    {
      this.addEventLog('No fuel.');
      return;
    }

    // Build option list
    var options = [];
    for (var i = 0; i < this.currentNode.paths.length; ++i)
    {
      var node = this.currentNode.paths[i];
      var location = Locations[node.locationName];
      var desc = (node.depth - this.currentNode.depth === 1) ? 'Direct route' : 'Indirect route';
      options.push({text: location.name + ' (' + desc + ')'});
    }

    // Show option menu
    this.choiceScreen = TANK.createEntity('ChoiceScreen');
    this.choiceScreen.ChoiceScreen.title = 'Choose destination';
    this.choiceScreen.ChoiceScreen.options = options;
    TANK.main.addChild(this.choiceScreen);
    TANK.main.pause();

    // Wait for choice
    this.listenTo(this.choiceScreen, 'choicemade', function(index)
    {
      TANK.main.unpause();
      this.player.Ship.fuel -= 1;
      this.goToNode(this.currentNode.paths[index]);
    });
  };

  //
  // Go to a new node on the map
  //
  this.goToNode = function(node)
  {
    var e = TANK.createEntity('WarpEffect');
    TANK.main.addChild(e);
    this.warping = true;
    this.warpTimer = 3;
    this.pendingNode = node;
  };

  //
  // Load a location
  //
  this.loadNewLocation = function(name)
  {
    // Clear existing objects
    TANK.main.dispatch('locationchange');

    // Grab the location object
    var location = Locations[name];
    this.currentLocation = location;

    // Generate paths
    TANK.main.MapGeneration.generateChildren(this.currentNode);

    // Set location attributes
    TANK.main.Renderer2D.clearColor = 'rgba(' + location.bgColor.join(', ') + ')';
    Lightr.lightDiffuse = location.lightColor;
    this.lightDir = Math.random() * Math.PI * 2;
    this.rebuildLighting();
    this.updateLightSource();

    // Create player entity if it doesn't exist
    if (!this.player)
    {
      this.player = TANK.createEntity('Player');
      this.player.Ship.shipData = new Ships[this.playerShipSelection]();
      TANK.main.addChild(this.player);
    }

    // Build event log ractive
    if (!this.eventLogUI)
    {
      this.eventLogUI = new Ractive(
      {
        el: 'eventLogContainer',
        template: '#eventLogTemplate',
        data: {logs: this.eventLogs}
      });
    }

    // Position player
    this.player.Pos2D.x = 0;
    this.player.Pos2D.y = 0;

    this.addEventLog('Warp complete. ' + this.player.Ship.fuel + ' fuel cells remaining.');

    // Spawn location objects
    for (var i = 0; i < location.spawns.length; ++i)
    {
      var spawn = location.spawns[i];

      // Using Spawns library
      if (typeof spawn === 'string')
      {
        Spawns[spawn]();
      }
      // Or using an object literal as a prototype
      else
      {
        var e = TANK.createEntity();
        e.load(spawn);
        TANK.main.addChild(e);
      }
    }

    // Log location text
    this.addEventLog(location.text);

    // Trigger location event
    if (location.events && location.events.length > 0)
    {
      // Map the event probabilities
      var weights = location.events.map(function(ev)
      {
        // If the event requires any flags that aren't set, modify
        // probability to 0
        if (Events[ev.name].requireFlags)
        {
          var requireFlags = Events[ev.name].requireFlags;
          for (var i = 0; i < requireFlags.length; ++i)
          {
            if (!Flags[requireFlags[i]])
              return 0;
          }
        }

        // Otherwise, return regular probability
        return ev.probability;
      });

      // Pick a random event
      var chosenIndex = this.randomWeighted(weights);
      if (typeof chosenIndex !== 'undefined')
      {
        var chosenEvent = location.events[chosenIndex];
        this.triggerEvent(chosenEvent.name);
      }
    }

    // Log default tutorial message
    this.warpReady = false;
    this.player.Ship.warpCharge = 0;
    this.addEventLog('Warp drive charging...');

    // If this node is the end node, then we win
    if (this.currentNode.depth >= TANK.main.MapGeneration.numLevels)
      this.goToWinScreen();
  };

  //
  // Trigger an event
  //
  this.triggerEvent = function(eventName)
  {
    var event = Events[eventName];
    event.spawns = event.spawns || [];
    event.options = event.options || [];

    // Show event text
    this.addEventLog(event.text);

    // Add event story
    if (event.story)
    {
      this.addStory(event.story.eventText);
    }

    // Call event script
    if (event.script)
      event.script();

    // Set any event flags
    if (event.setFlags)
    {
      for (var i = 0; i < event.setFlags.length; ++i)
        Flags[event.setFlags[i]] = true;
    }

    // Unset any event flags
    if (event.unsetFlags)
    {
      for (var i = 0; i < event.unsetFlags.length; ++i)
        Flags[event.unsetFlags[i]] = false;
    }

    // Spawn event entities
    for (var i = 0; i < event.spawns.length; ++i)
    {
      var spawn = event.spawns[i];

      // Using Spawns library
      if (typeof spawn === 'string')
      {
        Spawns[spawn]();
      }
      // Or using an object literal as a prototype
      else
      {
        var e = TANK.createEntity();
        e.load(spawn);
        TANK.main.addChild(e);
      }
    }

    // Dispatch any messages the event has
    if (event.dispatchEvent)
      TANK.main.dispatch(event.dispatchEvent);

    // If the event has options, wait for a choice to be made
    if (event.options.length > 0)
    {
      this.eventAwaitingInput = event;
      this.choiceScreen = TANK.createEntity('ChoiceScreen');
      this.choiceScreen.ChoiceScreen.options = event.options;
      TANK.main.addChild(this.choiceScreen);
      this.listenTo(this.choiceScreen, 'choicemade', this.handleOptionChoice);
      TANK.main.pause();
    }
  };

  //
  // Handle event option choice
  //
  this.handleOptionChoice = function(index)
  {
    TANK.main.unpause();

    // Show response text
    var chosenOption = this.eventAwaitingInput.options[index];
    if (chosenOption.responseText)
      this.addEventLog(chosenOption.responseText);

    // Add story
    if (chosenOption.story)
      this.addStory(chosenOption.story.eventText);

    // Set any event flags
    if (chosenOption.setFlags)
    {
      for (var i = 0; i < chosenOption.setFlags.length; ++i)
        Flags[chosenOption.setFlags[i]] = true;
    }

    // Unset any event flags
    if (chosenOption.unsetFlags)
    {
      for (var i = 0; i < chosenOption.unsetFlags.length; ++i)
        Flags[chosenOption.unsetFlags[i]] = false;
    }

    // Trigger an event, if any
    if (chosenOption.events)
    {
      var weights = chosenOption.events.map(function(ev) {return ev.probability;});
      var chosenIndex = this.randomWeighted(weights);
      var chosenEvent = chosenOption.events[chosenIndex];
      this.triggerEvent(chosenEvent.name);
    }
  };

  //
  // Player manipulation
  //
  this.givePlayerFuel = function(amount)
  {
    if (amount > 1)
      this.addEventLog('You receive ' + amount + ' fuel cells.');
    else
      this.addEventLog('You receive ' + amount + ' fuel cell.');

    this.player.Ship.fuel += amount;
  };

  this.takePlayerFuel = function(amount)
  {
    if (amount > 1)
      this.addEventLog('You lose ' + amount + ' fuel cells.');
    else
      this.addEventLog('You lose ' + amount + ' fuel cell.');

    this.player.Ship.fuel -= amount;
  };

  this.resetPlayerWarp = function()
  {
    this.player.Ship.warpCharge = 0;
    this.addEventLog('Your warp drive was jammed and the charge lost.');
  };

  this.killPlayerShields = function()
  {
    this.player.Ship.shieldObj.Shield.health = 0;
    this.player.Ship.shieldObj.Shield.burstTimer = this.player.Ship.shieldObj.Shield.burstTime;
    this.player.Ship.shieldObj.Shield.recovering = true;
    this.addEventLog('Your shields have been disabled.');
  };

  //
  // Unlock methods
  //
  this.unlockShip = function(name)
  {
    var shipData = new Ships[name]();
    this.addEventLog('You can now choose the ' + shipData.name + ' when beginning a new game.');
    this.unlockedShips[name] = true;
    this.save();
  };

  this.shipUnlocked = function(name)
  {
    return this.unlockedShips[name];
  }

  //
  // Resource load handler
  //
  this.listenTo(TANK.main, 'resourcesloaded', function()
  {
    this.goToMainMenu();
  });

  //
  // Game start handler
  //
  this.listenTo(TANK.main, 'start', function()
  {
    resources.load();
  });

  //
  // Game end handler
  //
  this.listenTo(TANK.main, 'gamewin', function()
  {
    this.goToWinScreen();
  });

  this.listenTo(TANK.main, 'gamelose', function()
  {
    this.goToLoseScreen();
  });

  //
  // Input handlers
  //
  this.listenTo(TANK.main, 'mousemove', function(e)
  {
    this.updateMousePos([e.x, e.y]);
  });

  this.listenTo(TANK.main, 'mousewheel', function(e)
  {
    if (this.warping)
      return;
    var delta = e.wheelDelta;
    TANK.main.Renderer2D.camera.z += delta * 0.005 * (TANK.main.Renderer2D.camera.z * 0.1);
    if (TANK.main.Renderer2D.camera.z < 0.5)
      TANK.main.Renderer2D.camera.z = 0.5;
    if (TANK.main.Renderer2D.camera.z > 5)
      TANK.main.Renderer2D.camera.z = 5;
  });

  this.listenTo(TANK.main, 'keydown', function(e)
  {
    // Key to begin jump
    if (e.keyCode === TANK.Key.J)
    {
      this.showLocationOptions();
    }

    // Numbered choice keys
    if (e.keyCode >= TANK.Key.NUM0 && e.keyCode <= TANK.Key.NUM9)
    {
      // 0 index choice from 1 key
      var choice = e.keyCode - TANK.Key.NUM1;

      // Choose an answer for an event
      if (this.eventAwaitingInput)
      {
        if (choice < this.eventAwaitingInput.options.length)
        {


          this.eventAwaitingInput = null;
        }
      }
    }
  });

  //
  // Update
  //
  this.update = function(dt)
  {
    // Check if player is ready to warp
    if (this.player)
    {
      if (this.player.Ship.warpCharge >= this.player.Ship.warpChargeTime && !this.warpReady)
      {
        this.addEventLog('...Warp drive charged. Press J to warp when ready.');
        this.warpReady = true;
      }
    }

    // Handle timed event logs
    for (var i = 0; i < this.eventLogsTimed.length; ++i)
    {
      var log = this.eventLogsTimed[i];
      log.time -= dt;
      if (log.time <= 0)
        this.addEventLog(log.text);
    }
    this.eventLogsTimed = this.eventLogsTimed.filter(function(val) {return val.time > 0;});

    // Handle warp logic
    if (this.warpTimer > 0)
    {
      // Countdown timer to warp
      this.warpTimer -= dt;
      if (this.warpTimer <= 0)
      {
        this.warping = false;
        this.currentNode = this.pendingNode;
        this.loadNewLocation(this.currentNode.locationName);
      }
    }
  };
});
