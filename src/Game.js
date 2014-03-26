TANK.registerComponent("Game")

.construct(function()
{
  this.scaleFactor = 8;
})

.initialize(function()
{
  lowLag.init();

  var e = TANK.createEntity("Planet");
  e.Planet.radius = 12;
  e.Pos2D.x = -200;
  e.Pos2D.y = -150;
  TANK.addEntity(e);

  e = TANK.createEntity("Planet");
  e.Planet.radius = 30;
  e.Pos2D.x = 200;
  e.Pos2D.y = -250;
  TANK.addEntity(e);

  e = TANK.createEntity("Planet");
  e.Planet.radius = 36;
  e.Pos2D.x = 0;
  e.Pos2D.y = 300;
  TANK.addEntity(e);

  e = TANK.createEntity("Player");
  e.Pos2D.x = 0;
  e.Pos2D.y = 0;
  TANK.addEntity(e, "Player");

  e = TANK.createEntity("Ship");
  e.Pos2D.x = 400;
  e.Pos2D.y = 200;
  TANK.addEntity(e);
});