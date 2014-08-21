TANK.registerComponent("DustField")

.construct(function()
{
  this.zdepth = 10;
  this.stars = [];
})

.initialize(function()
{
  for (var i = 0; i < 50; ++i)
  {
    this.stars.push(
    {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() + 1,
      size: 1 + Math.random()
    });
  }

  TANK.main.Renderer2D.add(this);

  this.draw = function(ctx, camera)
  {
    ctx.save();

    ctx.fillStyle = "#ddd";

    for (var i = 0; i < this.stars.length; ++i)
    {
      var x = (this.stars[i].x - camera.x * this.stars[i].z) - window.innerWidth / 2;
      var y = (this.stars[i].y - camera.y * this.stars[i].z) - window.innerHeight / 2;
      x %= window.innerWidth;
      y %= window.innerHeight;
      while (x < 0)
        x += window.innerWidth;
      while (y < 0)
        y += window.innerHeight;

      x -= (window.innerWidth * camera.z - window.innerWidth) * (0.5 / camera.z);
      y -= (window.innerHeight * camera.z - window.innerHeight) * (0.5 / camera.z);
      x *= camera.z;
      y *= camera.z;
      ctx.fillRect(x - window.innerWidth / 2, y - window.innerHeight / 2, this.stars[i].size, this.stars[i].size);
    }

    ctx.restore();
  };
});
