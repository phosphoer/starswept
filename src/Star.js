TANK.registerComponent('Star')
.includes(['Pos2D', 'DirectionalLight'])
.construct(function()
{
  this.zdepth = 10;
  this.radius = 2000;
  this.innerColor = [255, 255, 255];
  this.outerColor = [255, 0, 255];
})
.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.draw = function(ctx, camera, dt)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);

    var grad = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius);
    grad.addColorStop(0.0, 'rgb(' + this.innerColor.join(', ') + ')');
    grad.addColorStop(0.3, 'rgba(' + this.innerColor.join(', ') + ', 0.5)');
    grad.addColorStop(1.0, 'rgba(' + this.outerColor.join(', ') + ', 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };
});