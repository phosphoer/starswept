TANK.registerComponent("CampaignMap")

.construct(function()
{
  this.zdepth = 0;
  this.size = 400;
  this.minDist = 100;
  this.systems = [];
  this.islands = [];
})

.initialize(function()
{
  var that = this;
  TANK.main.Renderer2D.add(this);

  this.generateMap = function()
  {
    this.systems = [];

    // Generate systems
    for (var i = 0; i < 10; ++i)
    {
      this.systems.push(
      {
        level: Levels[0],
        pos:
        [
          -this.size + Math.random() * this.size * 2,
          -this.size + Math.random() * this.size * 2
        ],
        radius: 20,
        edges: [],
        owned: false
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
    this.systems[0].owned = true;

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

    this.mapGenerated = true;
  };

  if (!this.mapGenerated)
    this.generateMap();

  // Handle clicking on a system
  this.listenTo(TANK.main, 'mousedown', function(e)
  {
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      if (system.owned)
        continue;

      var hasAdjacentOwned = false;
      for (var j = 0; j < system.edges.length; ++j)
        if (system.edges[j].owned)
          hasAdjacentOwned = true;

      if (!hasAdjacentOwned)
        continue;

      var dist = TANK.Math2D.pointDistancePoint(system.pos, TANK.main.Game.mousePosWorld);
      if (dist < system.radius)
      {
        TANK.main.Game.goToSystemBattle(system);
      }
    }
  });

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw edges
    var drawnEdges = [];
    ctx.lineWidth = 3;
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      for (var j = 0; j < system.edges.length; ++j)
      {
        var systemB = system.edges[j];
        if (drawnEdges.indexOf(systemB) >= 0)
          continue;

        if (systemB.owned || system.owned)
          ctx.strokeStyle = '#7c7';
        else
          ctx.strokeStyle = '#c77';

        ctx.beginPath();
        ctx.moveTo(system.pos[0], system.pos[1]);
        ctx.lineTo(systemB.pos[0], systemB.pos[1]);
        ctx.stroke();
        ctx.closePath();
      }
      drawnEdges.push(system);
    }

    // Draw systems
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      ctx.fillStyle = system.owned ? '#5f5' : '#f55';
      ctx.beginPath();
      ctx.arc(system.pos[0], system.pos[1], system.radius, Math.PI * 2, false);
      ctx.fill();
      ctx.closePath();
    }

    ctx.restore();
  };
});
