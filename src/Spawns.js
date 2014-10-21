var Spawns = {};

Spawns.custom = function(obj)
{
  var e = TANK.createEntity();
  e.load(obj);
  TANK.main.addChild(e);
};

Spawns.civilian = function()
{
  var e = TANK.createEntity('AICivilian');
  e.Ship.shipData = new Ships.fighter();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
};

Spawns.warpJammer = function()
{
  var e = TANK.createEntity('WarpJammer');
  TANK.main.addChild(e);
};

Spawns.pirate = function()
{
  var ships =
  [
    'bomber',
    'frigate',
    'albatross',
    'rhino'
  ];
  var ship = ships[Math.floor(Math.random() * ships.length)];

  var e = TANK.createEntity('AIAttackPlayer');
  e.Ship.shipData = new Ships[ship]();
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
  e.Pos2D.x = 3000;
  e.Pos2D.y = 0;
  e.Pos2D.rotation = Math.random() * Math.PI * 2;
  e.Ship.shipData = new Ships.frigate();
  e.Ship.heading = e.Pos2D.rotation;
  TANK.main.addChild(e);
  e.Ship.shieldObj.Shield.disable(10000);

  e = TANK.createEntity('TriggerRadius');
  e.TriggerRadius.radius = 500;
  e.TriggerRadius.events = [{probability: 0.25, name: 'derelict_1a'}, {probability: 0.75, name: 'derelict_1b'}];
  e.Pos2D.x = 3000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);
};