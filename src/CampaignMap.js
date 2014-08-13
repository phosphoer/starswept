TANK.registerComponent("CampaignMap")

.construct(function()
{
  this.zdepth = 0;
  this.size = 400;
  this.minDist = 100;
})

.initialize(function()
{
  var that = this;
  TANK.main.Renderer2D.add(this);

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
  function makeEdgesFromNode(node, visited)
  {
    visited.push(node);
    var searchRadius = 100;
    var searching = true;
    while (searching)
    {
      for (var i = 0; i < that.systems.length; ++i)
      {
        var system = that.systems[i];
        if (system === node)
          continue;

        var dist = TANK.Math2D.pointDistancePoint(node.pos, system.pos);
        if (dist < searchRadius && visited.indexOf(system) < 0)
        {
          node.edges.push(system);
          system.edges.push(node);
          makeEdgesFromNode(system, visited);
          return;
        }
      }
      searchRadius += 10;

      if (visited.length === that.systems.length)
        return;
    }
  };
  makeEdgesFromNode(this.systems[0], []);

  // Move nodes away from edges
  this.systems.forEach(function(system)
  {
    system.edges.forEach(function(systemB)
    {
      this.systems.forEach(function(s)
      {
        if (s === system || s === systemB)
          return;

        var dist = TANK.Math2D.pointDistanceLine(s.pos, system.pos, systemB.pos, true);
        if (dist < 50)
        {
          s.bad = true;
        }
      }.bind(this));
    }.bind(this));
  }.bind(this));

  this.listenTo(TANK.main, 'mousedown', function(e)
  {
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      var dist = TANK.Math2D.pointDistancePoint(system.pos, TANK.main.Game.mousePosWorld);
      if (dist < system.radius)
      {
        TANK.main.Game.goToLevel(system.level);
      }
    }
  });

  this.draw = function(ctx, camera)
  {
    ctx.save();

    // Draw edges
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      for (var j = 0; j < system.edges.length; ++j)
      {
        var systemB = system.edges[j];
        ctx.beginPath();
        ctx.moveTo(system.pos[0], system.pos[1]);
        ctx.lineTo(systemB.pos[0], systemB.pos[1]);
        ctx.stroke();
        ctx.closePath();
      }
    }

    // Draw systems
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      ctx.fillStyle = system.bad ? '#f55' : '#fff';
      ctx.beginPath();
      ctx.arc(system.pos[0], system.pos[1], system.radius, Math.PI * 2, false);
      ctx.fill();
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  };
});
