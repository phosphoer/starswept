TANK.registerComponent("MapGeneration")

.construct(function()
{
  this.size = 400;
  this.minDist = 100;
  this.systems = [];
  this.islands = [];
})

.initialize(function()
{
  var that = this;

  //
  // Map generation logic
  //
  this.generateMap = function()
  {
    this.systems = [];

    // Generate systems
    for (var i = 0; i < 10; ++i)
    {
      this.systems.push(
      {
        index: i,
        pos:
        [
          -this.size + Math.random() * this.size * 2,
          -this.size + Math.random() * this.size * 2
        ],
        radius: 20,
        edges: [],
        owner: TANK.main.Game.players[1],
        flagships: [],
        fortifyLevel: 0
      });

      // Ensure systems are far apart
      var system = this.systems[i];
      var angle = Math.random() * Math.PI * 2;
      for (;;)
      {
        var minDist = this.systems.reduce(function(prev, cur)
        {
          if (cur === system)
            return prev;
          return Math.min(prev, TANK.Math2D.pointDistancePoint(system.pos, cur.pos));
        }, Infinity);

        if (minDist > this.minDist)
          break;

        system.pos[0] += Math.cos(angle) * 10;
        system.pos[1] += Math.sin(angle) * 10;
      }
    }

    // Center map on screen
    var minPos = [Infinity, Infinity];
    var maxPos = [-Infinity, -Infinity];
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      minPos[0] = Math.min(minPos[0], system.pos[0]);
      minPos[1] = Math.min(minPos[1], system.pos[1]);
      maxPos[0] = Math.max(maxPos[0], system.pos[0]);
      maxPos[1] = Math.max(maxPos[1], system.pos[1]);
    }
    var center = [minPos[0] + (maxPos[0] - minPos[0]) / 2, minPos[1] + (maxPos[1] - minPos[1]) / 2];
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      system.pos[0] -= center[0];
      system.pos[1] -= center[1];
    }

    // Make edges
    this.systems.forEach(function(system)
    {
      // Get systems in distance order
      var systemsOrdered = this.systems.slice();
      systemsOrdered.sort(function(a, b)
      {
        var distA = TANK.Math2D.pointDistancePoint(system.pos, a.pos);
        var distB = TANK.Math2D.pointDistancePoint(system.pos, b.pos);
        return distA > distB;
      });
      systemsOrdered.splice(0, 1);

      // Connect to closest system
      var closest = systemsOrdered[0];
      system.edges.push(closest);
      closest.edges.push(system);
      systemsOrdered.splice(0, 1);

      // Find the next closest system that is not inline with the previous
      var closestVec = TANK.Math2D.normalize(TANK.Math2D.subtract(closest.pos, system.pos));
      var nextClosest = null;
      for (var i = 0; i < systemsOrdered.length; ++i)
      {
        var s= systemsOrdered[i];
        var systemVec = TANK.Math2D.normalize(TANK.Math2D.subtract(s.pos, system.pos));
        var dot = TANK.Math2D.dot(closestVec, systemVec);
        if (Math.abs(1 - dot) > 0.1)
        {
          nextClosest = s;
          break;
        }
      };

      if (nextClosest)
      {
        system.edges.push(nextClosest);
        nextClosest.edges.push(system);
      }

    }.bind(this));

    // Make the first node owned
    this.systems[0].owner = TANK.main.Game.players[0];

    // Init flagships
    this.systems[0].flagships[0] = true;
    this.systems[1].flagships[1] = true;

    // Helper to recursively explore a graph
    var exploreNode = function(node, islandNodes)
    {
      if (node.visited)
        return false;

      // Visit the node
      node.visited = true;
      islandNodes.push(node);

      // Explore each adjacent node
      for (var i = 0; i < node.edges.length; ++i)
        exploreNode(node.edges[i], islandNodes);

      return true;
    };

    // Helper to connect two islands
    var connectIslands = function(a, b)
    {
      // Find the two closest nodes between the islands
      var minDist = Infinity;
      var nodeA = null;
      var nodeB = null;

      for (var i = 0; i < a.length; ++i)
      {
        for (var j = 0; j < b.length; ++j)
        {
          var dist = TANK.Math2D.pointDistancePoint(a[i].pos, b[j].pos);
          if (dist < minDist)
          {
            minDist = dist;
            nodeA = a[i];
            nodeB = b[j];
          }
        }
      }

      nodeA.edges.push(nodeB);
      nodeB.edges.push(nodeA);
    };

    // Explore every node to find islands
    this.islands = [];
    for (var i = 0; i < this.systems.length; ++i)
    {
      var node = this.systems[i];
      var island = [];
      if (exploreNode(node, island))
        this.islands.push(island);
    }

    // Connect each island to the next
    for (var i = 1; i < this.islands.length; ++i)
    {
      var islandA = this.islands[i - 1];
      var islandB = this.islands[i];
      connectIslands(islandA, islandB);
    }
  };

  this.save = function()
  {
    var systems = [];
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      var systemSave = {};
      systemSave.index = system.index;
      systemSave.pos = system.pos;
      systemSave.radius = system.radius;
      systemSave.owner = TANK.main.Game.players.indexOf(system.owner);
      systemSave.fortifyLevel = system.fortifyLevel;
      systemSave.edges = [];
      system.edges.forEach(function(s)
      {
        systemSave.edges.push(s.index);
      });
      systems.push(systemSave);
    }

    return systems;
  };

  this.load = function(systems)
  {
    this.systems = [];
    this.islands = [];

    for (var i = 0; i < systems.length; ++i)
    {
      var systemSave = systems[i];
      var system = {};
      system.index = systemSave.index;
      system.pos = systemSave.pos;
      system.radius = systemSave.radius;
      system.owner = TANK.main.Game.players[systemSave.owner];
      system.fortifyLevel = systemSave.fortifyLevel;
      system.edges = [];
      this.systems.push(system);
    }

    for (var i = 0; i < this.systems.length; ++i)
    {
      var systemSave = systems[i];
      var system = this.systems[i];
      systemSave.edges.forEach(function(systemIndex)
      {
        system.edges.push(that.systems[systemIndex]);
      });
    }
  };
});