TANK.registerComponent("StarField")

.interfaces("Drawable")

.construct(function()
{
  this.zdepth = -10;
  this.stars = [];
})

.initialize(function()
{
  for (var i = 0; i < 100; ++i)
  {
    var r =
    this.stars.push(
    {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 0.01 + 0.001,
      size: Math.random() * 3 + 0.1,
      color: "rgba(" + Math.round(150 + Math.random() * 100) +
        ", " + Math.round(150 + Math.random() * 100) +
        ", " + Math.round(150 + Math.random() * 100) +
        ", " + (0.5 + Math.random() * 0.5) + ")"
    });
  }

  this.draw = function(ctx, camera)
  {
    ctx.save();
    for (var i = 0; i < this.stars.length; ++i)
    {
      var x = (this.stars[i].x - camera.x * this.stars[i].z) - window.innerWidth / 2;
      var y = (this.stars[i].y - camera.y * this.stars[i].z) - window.innerHeight / 2;
      x %= window.innerWidth;
      y %= window.innerHeight;
      while (x < -window.innerWidth / 2)
        x += window.innerWidth;
      while (y <  -window.innerHeight / 2)
        y += window.innerHeight;

      x *= TANK.RenderManager.camera.z;
      y *= TANK.RenderManager.camera.z;
      ctx.fillStyle = this.stars[i].color;
      ctx.fillRect(x, y, this.stars[i].size * TANK.RenderManager.camera.z, this.stars[i].size * TANK.RenderManager.camera.z);
    }
    ctx.restore();
  };
});
