TANK.registerComponent("Game")

.construct(function()
{
  this.scaleFactor = 3;
  this.factions = [];
  this.barCommands = [];
  this.topBarItems = [];
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];
  this.lightDir = Math.random() * Math.PI * 2;
})

.initialize(function()
{
  this.barUI = new Ractive(
  {
    el: "barContainer",
    template: "#barTemplate",
    data: {commands: this.barCommands}
  });

  this.topBarUI = new Ractive(
  {
    el: "topBarContainer",
    template: "#topBarTemplate",
    data: {items: this.topBarItems}
  });

  var that = this;
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

  this.barUI.on("activate", function(e)
  {
    e.context.activate();
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
    var e = TANK.createEntity("Faction");
    e.Faction.team = 0;
    e.Faction.color = "#5d5";
    this.factions.push(e.Faction);
    TANK.main.addChild(e);

    e = TANK.createEntity("Faction");
    e.Faction.team = 1;
    e.Faction.color = "#d55";
    this.factions.push(e.Faction);
    TANK.main.addChild(e);

    e = TANK.createEntity("ControlPoint");
    this.factions[0].addControlPoint(e.ControlPoint);
    TANK.main.addChild(e);

    e = TANK.createEntity("ControlPoint");
    e.Pos2D.x = 2000;
    e.Pos2D.y = 2000;
    this.factions[1].addControlPoint(e.ControlPoint);
    TANK.main.addChild(e);

    e = TANK.createEntity("Player");
    e.Pos2D.x = 0;
    e.Pos2D.y = 0;
    e.Ship.shipData = new Ships.frigate();
    e.Ship.faction = this.factions[0];
    TANK.main.addChild(e);
  });

  this.update = function(dt)
  {
    // Update faction money count
    this.topBarUI.set("items[0].name", "Funds: " + this.factions[0].money);
  };
});
