TANK.registerComponent("Game")

.construct(function()
{
  // Game scale factor
  this.scaleFactor = 3;

  // Current existing factions
  this.factions = [];

  // Menu options
  this.menuOptions = [];
  this.levelOptions = [];

  // Command options
  this.barCommands = [];
  this.topBarItems = [];

  // Mouse positions
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];

  // Global light direction
  this.lightDir = 0;

  // Level settings
  this.currentLevel = -1;
  this.pendingLoad = false;

  this.aiArenaMode = true;
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
      name: "Build " + shipData.name,
      shipType: i,
      activate: function()
      {
        that.factions[0].buyShip(this.shipType);
      }
    });
  }

  // Money counter
  this.topBarItems.push({name: ""});

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
    TANK.main.dispatch("levelEnd");

    var save = localStorage["save"];

    // Build menu options
    this.menuOptions.push(
    {
      name: "New Game",
      activate: function()
      {
        that.menuUI.teardown();
        that.goToLevel(0);
      }
    });
    if (save)
    {
      this.menuOptions.push(
      {
        name: "Continue",
        activate: function()
        {
          var saveData = JSON.parse(save);
          that.menuUI.teardown();
          that.goToLevel(saveData.currentLevel);
        }
      });
      this.menuOptions.push(
      {
        name: "Level Select",
        activate: function()
        {
          that.menuUI.teardown();
          that.goToLevelSelect();
        }
      });
    }
    this.menuOptions.push(
    {
      name: "Options",
      activate: function()
      {
      }
    });
    this.menuOptions.push(
    {
      name: "Quit",
      activate: function()
      {
      }
    });

    // Build main menu ractive
    this.menuUI = new Ractive(
    {
      el: "menuContainer",
      template: "#menuTemplate",
      data: {options: this.menuOptions}
    });

    // Set ractive event listeners
    this.menuUI.on("activate", function(e)
    {
      e.context.activate();
    });

    // Build main menu scene
    this.lightDir = Math.random() * Math.PI * 2;

    var planet = TANK.createEntity("Planet");
    planet.Pos2D.x = 0;
    planet.Pos2D.y = -400;
    TANK.main.addChild(planet);

    var moon = TANK.createEntity("Planet");
    moon.Pos2D.x = -400;
    moon.Pos2D.y = 400;
    moon.Planet.radius = 48;
    TANK.main.addChild(moon);

    var ship = TANK.createEntity("Ship");
    ship.Pos2D.x = 300;
    ship.Pos2D.y = 200;
    ship.Ship.shipData = new Ships.bomber();
    ship.Ship.faction = null;
    TANK.main.addChild(ship);
  };

  //
  // Move to level select screen
  //
  this.goToLevelSelect = function()
  {
    var save = JSON.parse(localStorage["save"]);

    // Build level options
    for (var i = 0; i <= +save.currentLevel; ++i)
    {
      this.levelOptions.push(
      {
        name: Levels[i].name,
        index: i,
        activate: function()
        {
          that.menuUI.teardown();
          that.goToLevel(this.index);
        }
      });
    }

    // Build level select
    this.menuUI = new Ractive(
    {
      el: "menuContainer",
      template: "#levelTemplate",
      data: {options: this.levelOptions}
    });

    // Set ractive event listeners
    this.menuUI.on("activate", function(e)
    {
      e.context.activate();
    });
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
      el: "popupContainer",
      template: "#winTemplate",
    });

    this.popupUI.on("mainMenu", function()
    {
      that.popupUI.teardown();
      that.popupUI = null;
      that.goToMainMenu();
    });

    this.popupUI.on("nextLevel", function()
    {
      that.popupUI.teardown();
      that.popupUI = null;
      that.goToLevel(that.currentLevel + 1);
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
      el: "popupContainer",
      template: "#loseTemplate",
    });

    this.popupUI.on("mainMenu", function()
    {
      that.popupUI.teardown();
      that.popupUI = null;
      that.goToMainMenu();
    });

    this.popupUI.on("retry", function()
    {
      that.popupUI.teardown();
      that.popupUI = null;
      that.goToLevel(that.currentLevel);
    });
  };

  //
  // Load a new level
  //
  this.loadLevelNow = function(index)
  {
    var level = Levels[index];

    // Create faction entities
    for (var i = 0; i < level.factions.length; ++i)
    {
      var e = TANK.createEntity(level.factions[i].ai);
      e.Faction.team = level.factions[i].team;
      e.Faction.color = level.factions[i].color;
      this.factions.push(e.Faction);
      TANK.main.addChild(e);
    }

    // Create control points
    for (var i = 0; i < level.controlPoints.length; ++i)
    {
      var cp = level.controlPoints[i];
      e = TANK.createEntity("ControlPoint");
      e.Pos2D.x = cp.x;
      e.Pos2D.y = cp.y;
      if (cp.faction >= 0)
        this.factions[cp.faction].addControlPoint(e.ControlPoint);
      TANK.main.addChild(e);
    }

    // Create ships
    for (var i = 0; i < level.ships.length; ++i)
    {
      e = level.ships[i].player ? TANK.createEntity("Player") : TANK.createEntity("AIShip");
      e.Pos2D.x = level.ships[i].x;
      e.Pos2D.y = level.ships[i].y;
      e.Ship.shipData = new Ships[level.ships[i].ship];
      e.Ship.faction = this.factions[level.ships[i].faction];
      TANK.main.addChild(e);
    }

    // Other level attributes
    this.lightDir = level.lightDir;
    Lightr.lightDiffuse = level.lightDiffuse;
    bakeShipLighting();

    TANK.main.dispatch("levelStart", index);
  };

  // 
  // Begin transition to new level
  //
  this.goToLevel = function(index)
  {
    // Go to main menu if level is outside range
    if (index >= Levels.length)
    {
      this.goToMainMenu();
      return;
    }

    // Send out a message to all existing level objects to be destroyed
    TANK.main.dispatch("levelEnd");

    // Set current level marker and set a pending load
    this.currentLevel = index;
    this.pendingLoad = true;
  };

  //
  // Game start handler
  //
  this.listenTo(TANK.main, "start", function()
  {
    if (this.aiArenaMode)
      this.goToLevel(1);
    else
      this.goToMainMenu();
  });

  //
  // Level start handler
  //
  this.listenTo(TANK.main, "levelStart", function(index)
  {
    if (!this.aiArenaMode)
    {
      // Save the game
      if (!localStorage["save"])
      {
        var save = {};
        save.currentLevel = index;
        localStorage["save"] = JSON.stringify(save);
      }
      else
      {
        var save = JSON.parse(localStorage["save"]);
        save.currentLevel = Math.max(save.currentLevel, this.currentLevel);
        localStorage["save"] = JSON.stringify(save);
      }

      // Build bottom command bar ractive
      this.barUI = new Ractive(
      {
        el: "barContainer",
        template: "#barTemplate",
        data: {commands: this.barCommands}
      });

      // Build top command bar ractive
      this.topBarUI = new Ractive(
      {
        el: "topBarContainer",
        template: "#topBarTemplate",
        data: {items: this.topBarItems}
      });

      // Set ractive event listeners
      this.barUI.on("activate", function(e)
      {
        e.context.activate();
      });

      TANK.main.dispatchTimed(3, "scanForEndCondition");
    }
  });

  //
  // Level end handler
  //
  this.listenTo(TANK.main, "levelEnd", function()
  {
    this.factions = [];

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
  this.listenTo(TANK.main, "scanforplayership", function(faction, pos)
  {
    console.log("Looking for ship to transfer to...");
    var ships = TANK.main.getChildrenWithComponent("Ship");
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
        console.log("Found ship " + i);
      }
    }

    if (closestShip)
    {
      console.log("Transferring to ship " + closestShip._id);
      // Transfer control to closest ship
      closestShip.removeComponent("AIShip");
      closestShip.removeComponent("AIWatch");
      closestShip.addComponent("Player");
    }
    else
    {
      // If we couldn't find a ship to transfer control to, inform the game to wait for
      // a new ship to be built
      TANK.main.dispatchTimed(3, "scanforplayership", faction, pos);
    }
  });

  // 
  // Check for level end condition
  //
  this.listenTo(TANK.main, "scanForEndCondition", function()
  {
    var win = true;
    var lose = true;

    // Check if the player owns any or all control points
    var controlPoints = TANK.main.getChildrenWithComponent("ControlPoint");
    for (var i in controlPoints)
    {
      if (controlPoints[i].ControlPoint.faction === this.factions[0])
        lose = false;
      else
        win = false;
    }

    // Check if there are any friendly or enemy ships left
    var ships = TANK.main.getChildrenWithComponent("Ship");
    for (var i in ships)
    {
      if (ships[i].Ship.faction === this.factions[0])
        lose = false;
      else
        win = false;
    }

    if (win)
    {
      this.showWinScreen();
      return;
    }

    if (lose)
    {
      this.showLoseScreen();
      return;
    }

    TANK.main.dispatchTimed(3, "scanForEndCondition");
  });

  //
  // Input handlers
  //
  this.listenTo(TANK.main, "mousemove", function(e)
  {
    this.updateMousePos([e.x, e.y]);
  });

  this.listenTo(TANK.main, "touchmove", function(e)
  {
    this.updateMousePos([e.touches[0].clientX, e.touches[0].clientY]);
  });
  this.listenTo(TANK.main, "touchstart", function(e)
  {
    this.updateMousePos([e.touches[0].clientX, e.touches[0].clientY]);
  });

  this.listenTo(TANK.main, "mousewheel", function(e)
  {
    var delta = e.wheelDelta;
    TANK.main.Renderer2D.camera.z += delta * 0.005 * (TANK.main.Renderer2D.camera.z * 0.1);
    if (TANK.main.Renderer2D.camera.z < 1)
      TANK.main.Renderer2D.camera.z = 1;
  });

  this.listenTo(TANK.main, "gesturechange", function(e)
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
      this.loadLevelNow(this.currentLevel);
      this.pendingLoad = false;
    }

    // Update faction money count
    if (this.factions.length > 0 && this.topBarUI)
      this.topBarUI.set("items[0].name", "Funds: " + this.factions[0].money);

    if (this.aiArenaMode)
    {
      if (TANK.main.Input.isDown(TANK.Key.W))
        TANK.main.Renderer2D.camera.y -= dt * 1000;
      if (TANK.main.Input.isDown(TANK.Key.S))
        TANK.main.Renderer2D.camera.y += dt * 1000;
      if (TANK.main.Input.isDown(TANK.Key.A))
        TANK.main.Renderer2D.camera.x -= dt * 1000;
      if (TANK.main.Input.isDown(TANK.Key.D))
        TANK.main.Renderer2D.camera.x += dt * 1000;
    }
  };
});
