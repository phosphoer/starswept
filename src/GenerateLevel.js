function GenerateLevel(system)
{
  var rng = new RNG(system.seed);

  // Basic info
  var level = {};
  level.lightDir = rng.uniform() * Math.PI * 2;
  level.lightDiffuse = [0.8, 1, 1];
  level.controlPoints = [];
  level.ships = [];

  // Level size
  var levelSize = 10000;

  // Min dist between planets
  var minPlanetDist = 3000;

  // Generate control point locations
  for (var i = 0; i < system.numPlanets; ++i)
  {
    var cp = {x: rng.uniform() * levelSize, y: rng.uniform() * levelSize, faction: -1};

    // Ensure points are far apart
    var angle = rng.uniform() * Math.PI * 2;
    for (;;)
    {
      var minDist = level.controlPoints.reduce(function(prev, cur)
      {
        if (cur === cp)
          return prev;
        return Math.min(prev, TANK.Math2D.pointDistancePoint([cp.x, cp.y], [cur.x, cur.y]));
      }, Infinity);

      if (minDist > minPlanetDist)
        break;

      cp.x += Math.cos(angle) * 100;
      cp.y += Math.sin(angle) * 100;
    }

    // Defender owns fortifyLevel amount of planets
    if (i < system.fortifyLevel)
      cp.faction = 0;

    level.controlPoints.push(cp);
  }

  // Assign an attacker owned planet if fortify level isn't max
  if (system.fortifyLevel < system.numPlanets)
  {
    level.attackerCP = level.controlPoints[level.controlPoints.length - 1];
    level.attackerCP.faction = 1;
  }
  // If fortifyLevel is maxed, spawn an attack force?
  else
  {
    level.ships.push({player: false, faction: 1, ship: 'frigate', x: levelSize, y: 200});
  }


  return level;
};