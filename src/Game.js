TANK.registerComponent("Game")

.construct(function()
{
  this.scaleFactor = isMobile.any() ? 4 : 8;
  this.factions = [];
  this.barCommands = [];
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

  this.barUI.on("activate", function(e)
  {
  });

  this.update = function(dt)
  {
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
    e.Pos2D.x = 1000;
    e.Pos2D.y = 1000;
    this.factions[1].addControlPoint(e.ControlPoint);
    TANK.main.addChild(e);

    e = TANK.createEntity("Player");
    e.Pos2D.x = 0;
    e.Pos2D.y = 0;
    TANK.main.addChild(e, "Player");

    this.factions[0].controlPoints[0].buyShip();
  });
});