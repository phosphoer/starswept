var Spawns = {};

Spawns.civilian = function()
{
  var e = TANK.createEntity('AIShip');
  e.Ship.shipData = new Ships.fighter();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
  e.AIShip.addOrder(new Action.AITravel(e));
};