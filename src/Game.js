TANK.registerComponent("Game")

.construct(function()
{
  this.scaleFactor = isMobile.any() ? 4 : 8;
  this.factions = [];
  this.barCommands = [];
  this.topBarItems = [];
  this.mousePosWorld = [0, 0];
})

.initialize(function()
{
  lowLag.init();

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
    name: "Build Frigate",
    activate: function()
    {
      that.factions[0].controlPoints[0].buyShip("frigate");
    }
  });
  this.barCommands.push(
  {
    name: "Build Cruiser",
    activate: function()
    {
      that.factions[0].controlPoints[0].buyShip("cruiser");
    }
  });

  this.barUI.on("activate", function(e)
  {
    e.context.activate();
  });

  // Money counter
  this.topBarItems.push({name: ""});

  this.update = function(dt)
  {
    // Update faction money count
    this.topBarUI.set("items[0].name", "Funds - " + this.factions[0].money);

    // Update mouse world position
    this.mousePosWorld = [TANK.main.Input.mousePos[0], TANK.main.Input.mousePos[1]];
    this.mousePosWorld[0] -= window.innerWidth / 2;
    this.mousePosWorld[1] -= window.innerHeight / 2;
    this.mousePosWorld[0] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[1] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[0] += TANK.main.Renderer2D.camera.x;
    this.mousePosWorld[1] += TANK.main.Renderer2D.camera.y;
  };

  this.listenTo(TANK.main, "start", function()
  {
    var e = TANK.createEntity("Faction");
    e.Faction.team = 0;
    this.factions.push(e.Faction);
    TANK.main.addChild(e);

    e = TANK.createEntity("AIFaction");
    e.Faction.team = 1;
    this.factions.push(e.Faction);
    TANK.main.addChild(e);

    e = TANK.createEntity("ControlPoint");
    this.factions[0].addControlPoint(e.ControlPoint);
    TANK.main.addChild(e);

    e = TANK.createEntity("ControlPoint");
    e.Pos2D.x = 3000;
    e.Pos2D.y = 3000;
    this.factions[1].addControlPoint(e.ControlPoint);
    TANK.main.addChild(e);

    e = TANK.createEntity("Player");
    e.Pos2D.x = 0;
    e.Pos2D.y = 0;
    e.Ship.shipData = new Ships.cruiser();
    TANK.main.addChild(e, "Player");

    this.factions[0].controlPoints[0].buyShip("frigate");
  });
});