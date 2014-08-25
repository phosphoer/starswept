function GenerateLevel(system)
{
  // Basic info
  var level = {};
  level.lightDir = Math.random() * Math.PI * 2;
  level.lightDiffuse = [0.8, 1, 1];
  level.controlPoints = [];
  level.ships = [];

  // Number of control points
  var numControlPoints = Math.round(Math.sqrt(Math.random()) * 5) + 2;

  // Level size
  var levelSize = 10000;

  // Min dist between planets
  var minPlanetDist = 3000;

  // Generate control point locations
  for (var i = 0; i < numControlPoints; ++i)
  {
    var cp = {x: Math.random() * levelSize, y: Math.random() * levelSize, faction: -1};

    // Ensure points are far apart
    var angle = Math.random() * Math.PI * 2;
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

    level.controlPoints.push(cp);
  }

  // Assign factions to control points
  level.controlPoints[0].faction = 0;
  level.controlPoints[1].faction = 1;

  return level;
};