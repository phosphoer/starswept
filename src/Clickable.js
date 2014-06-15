TANK.registerComponent("Clickable")

.includes("Pos2D")

.construct(function()
{
  this.width = 0;
  this.height = 0;
  this.radius = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.checkClick = function(pos)
  {
    if (this.radius)
    {
      return TANK.Math2D.pointDistancePoint(pos, [t.x, t.y]) < this.radius;
    }

    return TANK.Math2D.pointInAABB(pos, [t.x, t.y], [width, height]);
  };
});