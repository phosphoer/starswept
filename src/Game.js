TANK.registerComponent('Game')

.includes(['MapGeneration'])

.construct(function()
{
  // Game scale factor
  this.scaleFactor = 3;

  // Current existing factions
  this.players =
  [
    {
      player: true,
      color: '#3c3',
      battleAI: 'Faction',
      team: 0,
    },
    {
      player: false,
      color: '#d55',
      battleAI: 'AIFaction2',
      team: 1
    }
  ];
  this.player = this.players[0];

  // Menu options
  this.menuOptions = [];
  this.levelOptions = [];
  this.menuObjects = [];

  // Command options
  this.barCommands = [];
  this.topBarItems = [];

  // Mouse positions
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];

  // Global light direction
  this.lightDir = 0;

  // Level settings
  this.currentSystem = null;
  this.pendingLoad = false;

  this.aiArenaMode = false;
})

.initialize(function()
{
  var that = this;

  //
  // Build up bar commands
  //
  for (var i in Ships)
  {
    var shipData = new Ships[i]();
    this.barCommands.push(
    {
      name: 'Build ' + shipData.name,
      shipType: i,
      activate: function()
      {
        that.player.faction.buyShip(this.shipType);
      }
    });
  }

  // Money counter
  this.topBarItems.push({name: ''});

  //
  // Save the current game
  //
  this.save = function(slot)
  {
    var save = {};
    save.currentTurn = this.campaignObject.CampaignMap.currentTurn;
    save.turnsTaken = this.campaignObject.CampaignMap.turnsTaken;
    save.systems = TANK.main.MapGeneration.save();
    localStorage['save-' + slot] = JSON.stringify(save);
  };

  //
  // Load the current game
  //
  this.load = function(slot)
  {
    var save = JSON.parse(localStorage['save-' + slot]);
    this.currentTurn = save.currentTurn;
    this.turnsTaken = save.turnsTaken;
    TANK.main.MapGeneration.load(save.systems);
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
    if (this.campaignObject)
      TANK.main.removeChild(this.campaignObject);

    var save = localStorage['save'];

    // Build menu options
    this.menuOptions = [];
    this.menuOptions.push(
    {
      name: 'New Game',
      activate: function()
      {
        that.menuUI.teardown();
        TANK.main.MapGeneration.generateMap();
        that.goToCampaignMap();
        that.menuObjects.forEach(function(obj)
        {
          TANK.main.removeChild(obj);
        });
        that.menuObjects = [];
      }
    });
    this.menuOptions.push(
    {
      name: 'Options',
      activate: function()
      {
      }
    });
    this.menuOptions.push(
    {
      name: 'Quit',
      activate: function()
      {
      }
    });

    // Build main menu ractive
    this.menuUI = new Ractive(
    {
      el: 'menuContainer',
      template: '#menuTemplate',
      data: {options: this.menuOptions}
    });

    // Set ractive event listeners
    this.menuUI.on('activate', function(e)
    {
      e.context.activate();
    });

    // Build main menu scene
    this.lightDir = Math.random() * Math.PI * 2;

    var planet = TANK.createEntity('Planet');
    planet.Pos2D.x = 0;
    planet.Pos2D.y = -400;
    TANK.main.addChild(planet);
    this.menuObjects.push(planet);

    var moon = TANK.createEntity('Planet');
    moon.Pos2D.x = -400;
    moon.Pos2D.y = 400;
    moon.Planet.radius = 48;
    TANK.main.addChild(moon);
    this.menuObjects.push(moon);

    var ship = TANK.createEntity('Ship');
    ship.Pos2D.x = 400;
    ship.Pos2D.y = 300;
    ship.Ship.shipData = new Ships.bomber();
    ship.Ship.faction = null;
    TANK.main.addChild(ship);
    this.menuObjects.push(ship);

    // ship = TANK.createEntity('Ship');
    // ship.Pos2D.x = 300;
    // ship.Pos2D.y = 100;
    // ship.Ship.shipData = new Ships.frigate();
    // ship.Ship.faction = null;
    // TANK.main.addChild(ship);
    // this.menuObjects.push(ship);

    // ship = TANK.createEntity('Ship');
    // ship.Pos2D.x = 200;
    // ship.Pos2D.y = 300;
    // ship.Ship.shipData = new Ships.fighter();
    // ship.Ship.faction = null;
    // TANK.main.addChild(ship);
    // this.menuObjects.push(ship);
  };

  //
  // Show the win screen menu
  //
  this.showWinScreen = function()
  {
    if (this.popupUI)
      this.popupUI.teardown();

    this.popupUI = new Ractive(
    {
      el: 'popupContainer',
      template: '#winTemplate',
    });

    this.popupUI.on('back', function()
    {
      that.popupUI.teardown();
      that.popupUI = null;
      TANK.main.dispatch('systemBattleEnd');
      that.goToCampaignMap();
    });
  };

  //
  // Show the lose screen menu
  //
  this.showLoseScreen = function()
  {
    if (this.popupUI)
      this.popupUI.teardown();

    this.popupUI = new Ractive(
    {
      el: 'popupContainer',
      template: '#loseTemplate',
    });

    this.popupUI.on('back', function()
    {
      that.popupUI.teardown();
      that.popupUI = null;
      TANK.main.dispatch('systemBattleEnd');
      that.goToCampaignMap();
    });
  };

  //
  // Load a new level
  //
  this.loadLevelNow = function(system)
  {
    var players = [this.currentSystemDefender, this.currentSystemAttacker];

    // Generate a level
    var level = {};
    level.lightDir = 1.5;
    level.lightDiffuse = [0.8, 1, 1];
    level.controlPoints = [];
    level.ships = [];
    level.controlPoints.push({x: 0, y: 0, faction: 0});
    level.controlPoints.push({x: 4000, y: 4000, faction: 1});
    level.ships.push({player: players[0].player, faction: 0, ship: "frigate", x: 0, y: 0});
    level.ships.push({player: players[1].player, faction: 1, ship: "frigate", x: 4000, y: 4000});

    // Create faction entities
    for (var i = 0; i < players.length; ++i)
    {
      var e = TANK.createEntity(players[i].battleAI);
      e.Faction.team = players[i].team;
      e.Faction.color = players[i].color;
      players[i].faction = e.Faction;
      TANK.main.addChild(e);
    }

    // Create control points
    for (var i = 0; i < level.controlPoints.length; ++i)
    {
      var cp = level.controlPoints[i];
      e = TANK.createEntity('ControlPoint');
      e.Pos2D.x = cp.x;
      e.Pos2D.y = cp.y;
      if (cp.faction >= 0)
        players[cp.faction].faction.addControlPoint(e.ControlPoint);
      TANK.main.addChild(e);
    }

    // Create ships
    for (var i = 0; i < level.ships.length; ++i)
    {
      e = level.ships[i].player ? TANK.createEntity('Player') : TANK.createEntity('AIShip');
      e.Pos2D.x = level.ships[i].x;
      e.Pos2D.y = level.ships[i].y;
      e.Ship.shipData = new Ships[level.ships[i].ship];
      e.Ship.faction = players[level.ships[i].faction].faction;
      TANK.main.addChild(e);
    }

    // Other level attributes
    this.lightDir = level.lightDir;
    Lightr.lightDiffuse = level.lightDiffuse;
    bakeShipLighting();

    TANK.main.dispatch('systemBattleStart', system);
  };

  //
  // Begin a real time system battle
  //
  this.goToSystemBattle = function(system, defender, attacker)
  {
    // Send out a message to all existing level objects to be destroyed
    TANK.main.removeChild(this.campaignObject);

    // Set current level marker and set a pending load
    this.currentSystem = system;
    this.currentSystemDefender = defender;
    this.currentSystemAttacker = attacker;
    this.pendingLoad = true;
  };

  //
  // Go to campaign map
  //
  this.goToCampaignMap = function()
  {
    TANK.main.Renderer2D.camera.x = 0;
    TANK.main.Renderer2D.camera.y = 0;

    if (!this.campaignObject)
      this.campaignObject = TANK.createEntity('CampaignMap');

    TANK.main.addChild(this.campaignObject);
  };

  //
  // Game start handler
  //
  this.listenTo(TANK.main, 'start', function()
  {
    this.goToMainMenu();
  });

  //
  // Level start handler
  //
  this.listenTo(TANK.main, 'systemBattleStart', function(system)
  {
    // Build bottom command bar ractive
    this.barUI = new Ractive(
    {
      el: 'barContainer',
      template: '#barTemplate',
      data: {commands: this.barCommands}
    });

    // Build top command bar ractive
    this.topBarUI = new Ractive(
    {
      el: 'topBarContainer',
      template: '#topBarTemplate',
      data: {items: this.topBarItems}
    });

    // Set ractive event listeners
    this.barUI.on('activate', function(e)
    {
      e.context.activate();
    });

    TANK.main.dispatchTimed(3, 'scanForEndCondition');
  });

  //
  // Level end handler
  //
  this.listenTo(TANK.main, 'systemBattleEnd', function()
  {
    // Remove command bars
    if (this.topBarUI)
      this.topBarUI.teardown();
    if (this.barUI)
      this.barUI.teardown();
    this.topBarUI = null;
    this.barUI = null;
  });

  //
  // Look for a ship for player to transfer to while dead
  //
  this.listenTo(TANK.main, 'scanforplayership', function(faction, pos)
  {
    console.log('Looking for ship to transfer to...');
    var ships = TANK.main.getChildrenWithComponent('Ship');
    var closestShip = null;
    var minDist = Infinity;
    if (!pos)
      pos = [0, 0];
    for (var i in ships)
    {
      if (ships[i].Ship.faction !== faction)
        continue;

      var shipPos = [ships[i].Pos2D.x, ships[i].Pos2D.y];
      var dist = TANK.Math2D.pointDistancePoint(pos, shipPos);
      if (dist < minDist)
      {
        minDist = dist;
        closestShip = ships[i];
        console.log('Found ship ' + i);
      }
    }

    if (closestShip)
    {
      console.log('Transferring to ship ' + closestShip._id);
      // Transfer control to closest ship
      closestShip.removeComponent('AIShip');
      closestShip.removeComponent('AIWatch');
      closestShip.addComponent('Player');
    }
    else
    {
      // If we couldn't find a ship to transfer control to, inform the game to wait for
      // a new ship to be built
      TANK.main.dispatchTimed(3, 'scanforplayership', faction, pos);
    }
  });

  //
  // Check for level end condition
  //
  this.listenTo(TANK.main, 'scanForEndCondition', function()
  {
    var attackerWin = true;
    var defenderWin = true;

    // Check if the attacker owns any or all control points
    var controlPoints = TANK.main.getChildrenWithComponent('ControlPoint');
    for (var i in controlPoints)
    {
      if (controlPoints[i].ControlPoint.faction === this.currentSystemDefender.faction)
        attackerWin = false;
      else
        defenderWin = false;
    }

    // Check if there are any friendly or enemy ships left
    var ships = TANK.main.getChildrenWithComponent('Ship');
    for (var i in ships)
    {
      if (ships[i].Ship.faction === this.currentSystemDefender.faction)
        attackerWin = false;
      else
        defenderWin = false;
    }

    var winner;
    if (attackerWin)
      winner = this.currentSystemAttacker;
    if (defenderWin)
      winner = this.currentSystemDefender;

    if (winner)
    {
      this.currentSystem.owner = winner;
      if (winner.player)
        this.showWinScreen();
      else
        this.showLoseScreen();
      return;
    }

    TANK.main.dispatchTimed(3, 'scanForEndCondition');
  });

  //
  // Input handlers
  //
  this.listenTo(TANK.main, 'mousemove', function(e)
  {
    this.updateMousePos([e.x, e.y]);
  });

  this.listenTo(TANK.main, 'touchmove', function(e)
  {
    this.updateMousePos([e.touches[0].clientX, e.touches[0].clientY]);
  });
  this.listenTo(TANK.main, 'touchstart', function(e)
  {
    this.updateMousePos([e.touches[0].clientX, e.touches[0].clientY]);
  });

  this.listenTo(TANK.main, 'mousewheel', function(e)
  {
    var delta = e.wheelDelta;
    TANK.main.Renderer2D.camera.z += delta * 0.005 * (TANK.main.Renderer2D.camera.z * 0.1);
    if (TANK.main.Renderer2D.camera.z < 0.5)
      TANK.main.Renderer2D.camera.z = 0.5;
    if (TANK.main.Renderer2D.camera.z > 12)
      TANK.main.Renderer2D.camera.z = 12;
  });

  this.listenTo(TANK.main, 'gesturechange', function(e)
  {
    if (e.scale)
    {
      this.zooming = true;
      var scale = 1 / e.scale;
      scale = Math.min(scale, 1.1);
      scale = Math.max(scale, 0.9);
      TANK.main.Renderer2D.camera.z *= scale;
      if (TANK.main.Renderer2D.camera.z < 1)
        TANK.main.Renderer2D.camera.z = 1;
      if (TANK.main.Renderer2D.camera.z > 100)
        TANK.main.Renderer2D.camera.z = 100;
    }
  });

  //
  // Update
  //
  this.update = function(dt)
  {
    // Load levels
    if (this.pendingLoad)
    {
      this.loadLevelNow(this.currentSystem);
      this.pendingLoad = false;
    }

    // Update faction money count
    if (this.players[0] && this.players[0].faction && this.topBarUI)
      this.topBarUI.set('items[0].name', 'Funds: ' + this.players[0].faction.money);
  };
});
