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

Spawns.police = function()
{
  var e = TANK.createEntity('AIPolice');
  e.Ship.shipData = new Ships.enforcer();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
};

Spawns.derelict = function()
{
  var e = TANK.createEntity('AIDerelict');
  e.Ship.shipData = new Ships.frigate();
  e.Pos2D.x = 3000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);

  e = TANK.createEntity('TriggerRadius');
  e.TriggerRadius.radius = 1000;
  e.TriggerRadius.events = [{probability: 0.25, name: 'derelict_1a'}, {probability: 0.75, name: 'derelict_1b'}];
  e.Pos2D.x = 3000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);
};