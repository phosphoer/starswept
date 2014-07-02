TANK.registerComponent("Game")

.construct(function()
{
  this.scaleFactor = 3;
  this.factions = [];
  this.menuOptions = [];
  this.barCommands = [];
  this.topBarItems = [];
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];
  this.lightDir = Math.random() * Math.PI * 2;

  this.currentLevel = -1;
  this.pendingLoad = false;
})

.initialize(function()
{
  // Build main menu options
  var that = this;
  for (var i = 0; i < Levels.length; ++i)
  {
    this.menuOptions.push(
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

  // Build up bar commands
  this.barCommands.push(
  {
    name: "Build Fighter",
    activate: function()
    {
      that.factions[0].buyShip("fighter");
    }
  });
  this.barCommands.push(
  {
    name: "Build Frigate",
    activate: function()
    {
      that.factions[0].buyShip("frigate");
    }
  });

  // Money counter
  this.topBarItems.push({name: ""});

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

  this.goToMainMenu = function()
  {
    TANK.main.dispatch("levelEnd");

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
  };

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

  this.loadLevelNow = function(index)
  {
    var level = Levels[index];

    // Create faction entities
    for (var i = 0; i < level.factions.length; ++i)
    {
      var e = level.factions[i].player ? TANK.createEntity("Faction") : TANK.createEntity("AIFaction");
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

    TANK.main.dispatch("levelStart");
  };

  this.goToLevel = function(index)
  {
    // Send out a message to all existing level objects to be destroyed
    TANK.main.dispatch("levelEnd");

    // Set current level marker and set a pending load
    this.currentLevel = index;
    this.pendingLoad = true;
  };

  this.listenTo(TANK.main, "levelStart", function()
  {
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
  });

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
      this.goToMainMenu();
      return;
    }

    if (lose)
    {
      this.showLoseScreen();
      return;
    }

    TANK.main.dispatchTimed(3, "scanForEndCondition");
  });

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

  this.listenTo(TANK.main, "start", function()
  {
    this.goToMainMenu();
  });

  this.update = function(dt)
  {
    // Load levels
    if (this.pendingLoad)
    {
      this.loadLevelNow(this.currentLevel);
      this.pendingLoad = false;
    }

    // Update faction money count
    if (this.factions.length > 0)
      this.topBarUI.set("items[0].name", "Funds: " + this.factions[0].money);
  };
});
