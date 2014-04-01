TANK.registerComponent("Game")

.construct(function()
{
  this.scaleFactor = isMobile.any() ? 4 : 8;
  this.factions = [];
})

.initialize(function()
{
  lowLag.init();

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
  e.Pos2D.x = 5000;
  e.Pos2D.y = 5000;
  this.factions[1].addControlPoint(e.ControlPoint);
  TANK.addEntity(e);

  e = TANK.createEntity("Player");
  e.Pos2D.x = 0;
  e.Pos2D.y = 0;
  TANK.addEntity(e, "Player");

  this.factions[0].controlPoints[0].buyShip();
});