TANK.registerComponent("Game")

.construct(function()
{
  this.scaleFactor = isMobile.any() ? 4 : 8;
  this.factions = [];
  this.barCommands = [];
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

  this.barCommands.length = 0;

  var e = TANK.createEntity("Faction");
  e.Faction.team = 0;
  this.factions.push(e.Faction);
  TANK.addEntity(e);

  e = TANK.createEntity("AIFaction");
  e.Faction.team = 1;
  this.factions.push(e.Faction);
  TANK.addEntity(e);

  e = TANK.createEntity("ControlPoint");
  this.factions[0].addControlPoint(e.ControlPoint);
  TANK.addEntity(e);

  e = TANK.createEntity("ControlPoint");
  e.Pos2D.x = 500;
  e.Pos2D.y = 500;
  this.factions[1].addControlPoint(e.ControlPoint);
  TANK.addEntity(e);

  e = TANK.createEntity("Player");
  e.Pos2D.x = 0;
  e.Pos2D.y = 0;
  TANK.addEntity(e, "Player");

  this.factions[0].controlPoints[0].buyShip();
});