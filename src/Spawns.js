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

Spawns.derelict = function()
{
  var e = TANK.createEntity(['Ship', 'Derelict']);
  e.Ship.shipData = new Ships.frigate();
  e.Pos2D.x = 4000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);

  e = TANK.createEntity('TriggerRadius');
  e.TriggerRadius.radius = 1000;
  e.TriggerRadius.events = [{probability: 1, name: 'derelict_1b'}];
  e.Pos2D.x = 4000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);
};