TANK.registerComponent("CampaignMap")

.construct(function()
{
  this.zdepth = 0;
})

.initialize(function()
{
  TANK.main.Renderer2D.add(this);

  this.systems = [];
  this.systems[0] = 
  {
    level: Levels[0],
    pos: [0, 0],
    radius: 30,
    owned: true
  };
  this.systems[1] = 
  {
    level: Levels[1],
    pos: [0, -100],
    radius: 30,
    owned: false
  };

  this.systems[0].edges = [this.systems[1]];
  this.systems[1].edges = [this.systems[0]];

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
    ctx.beginPath();
    ctx.moveTo(this.systems[0].pos[0], this.systems[0].pos[1]);
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      ctx.lineTo(system.pos[0], system.pos[1]);
    }
    ctx.stroke();
    ctx.closePath();

    // Draw systems
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      ctx.beginPath();
      ctx.arc(system.pos[0], system.pos[1], system.radius, Math.PI * 2, false);
      system.owned ? ctx.fill() : ctx.stroke();
      ctx.closePath();
    }

    ctx.restore();
  };
});
