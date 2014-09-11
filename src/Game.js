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

  // Mouse positions
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];

  // Global light direction
  this.lightDir = 0;

  this.playerShipSelection = 'frigate';
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
    res.lightBuffers = Lightr.bake(8, res.diffuse, res.normals);
    doneCallback(res);
  };

  resources.add('asteroid-01-diffuse', 'res/img/asteroid-01.png');
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

  // Build event log ractive
  this.eventLogUI = new Ractive(
  {
    el: 'eventLogContainer',
    template: '#eventLogTemplate',
    data: {logs: this.eventLogs}
  });

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
    var save = {};
    localStorage['save-' + slot] = JSON.stringify(save);
  };

  //
  // Load a save slot
  //
  this.load = function(slot)
  {
    var save = JSON.parse(localStorage['save-' + slot]);
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

    // Handle main menu interactions
    this.listenTo(this.mainMenu, 'newgame', function()
    {
      TANK.main.removeChild(this.mainMenu);
      this.goToShipSelection();
    });
  };

  //
  // Go to selection screen
  //
  this.goToShipSelection = function()
  {
    // Build menu
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
    var rand = Math.random();
    var intervals = [];
    var min = 0;
    var max = 0;
    for (var i = 0; i < weights.length; ++i)
    {
      max = min + weights[i];
      if (rand >= min && rand <= max)
        return i;
      min += weights[i];
    }
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

  //
  // Clear event log
  //
  this.clearEventLog = function()
  {
    while (this.eventLogs.length)
      this.eventLogs.pop();
  };

  //
  // Show location options
  //
  this.showLocationOptions = function()
  {
    for (var i = 0; i < this.currentNode.paths.length; ++i)
    {
      var node = this.currentNode.paths[i];
      var location = Locations[node.locationName];
      this.addEventLog((i + 1) + '. ' + location.name);
    }

    this.waitingForJump = true;
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

    // Set location attributes
    TANK.main.Renderer2D.clearColor = 'rgba(' + location.bgColor.join(', ') + ')';
    Lightr.lightDiffuse = location.lightColor;
    this.lightDir = location.lightDir;
    this.rebuildLighting();

    // Create player entity if it doesn't exist
    if (!this.player)
    {
      this.player = TANK.createEntity('Player');
      this.player.Ship.shipData = new Ships[this.playerShipSelection]();
      TANK.main.addChild(this.player);
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
    if (location.events)
    {
      var weights = location.events.map(function(ev) {return ev.probability;});
      var chosenIndex = this.randomWeighted(weights);
      var chosenEvent = location.events[chosenIndex];
      this.triggerEvent(chosenEvent.name);
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
      this.waitingForJump = false;
      for (var i = 0; i < event.options.length; ++i)
        this.addEventLog((i + 1) + '. ' + event.options[i].text);
    }
  };

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

      // Choose to jump to a location
      if (this.waitingForJump)
      {
        this.waitingForJump = false;

        if (!this.warpReady)
        {
          var timeRemaining = this.player.Ship.shipData.warpChargeTime - this.player.Ship.warpCharge;
          this.addEventLog('Warp drive charged in ' + Math.round(timeRemaining) + ' seconds.');
          return;
        }

        if (this.player.Ship.fuel < 1)
        {
          this.addEventLog('No fuel.');
          return;
        }

        if (choice < this.currentNode.paths.length)
        {
          this.player.Ship.fuel -= 1;
          this.goToNode(this.currentNode.paths[choice]);
        }
      }
      // Choose an answer for an event
      else if (this.eventAwaitingInput)
      {
        if (choice < this.eventAwaitingInput.options.length)
        {
          // Show response text
          var chosenOption = this.eventAwaitingInput.options[choice];
          if (chosenOption.responseText)
            this.addEventLog(chosenOption.responseText);

          // Trigger an event, if any
          if (chosenOption.events)
          {
            var weights = chosenOption.events.map(function(ev) {return ev.probability;});
            var chosenIndex = this.randomWeighted(weights);
            var chosenEvent = chosenOption.events[chosenIndex];
            this.triggerEvent(chosenEvent.name);
          }

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
      if (this.player.Ship.warpCharge >= this.player.Ship.shipData.warpChargeTime && !this.warpReady)
      {
        this.addEventLog('...Warp drive charged. Press J to warp when ready.');
        this.warpReady = true;
      }
    }

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
