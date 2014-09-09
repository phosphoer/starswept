var Spawns = {};

Spawns.civilian = function()
{
  var e = TANK.createEntity('AICivilian');
  e.Ship.shipData = new Ships.fighter();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
};

Spawns.pirate = function()
{
  var e = TANK.createEntity('AIAttackPlayer');
  e.Ship.shipData = new Ships.frigate();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
};