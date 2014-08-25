TANK.registerComponent("StarField")

.construct(function()
{
  this.zdepth = -10;
  this.stars = [];
})

.initialize(function()
{
  TANK.main.Renderer2D.add(this);

  var i;
  for (i = 0; i < 100; ++i)
  {
    var r =
    this.stars.push(
    {
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.01 + 0.001,
      size: Math.random() * 3 + 0.1,
      color: "rgba(" + Math.round(150 + Math.random() * 100) +
        ", " + Math.round(150 + Math.random() * 100) +
        ", " + Math.round(150 + Math.random() * 100) +
        ", " + (0.5 + Math.random() * 0.5) + ")"
    });
  }

  this.redraw = function()
  {
    this.pixelBuffer = new PixelBuffer();
    this.pixelBuffer.createBuffer(window.innerWidth, window.innerHeight);

    for (i = 0; i < this.stars.length; ++i)
    {
      var x = (this.stars[i].x);
      var y = (this.stars[i].y);

      this.pixelBuffer.context.fillStyle = this.stars[i].color;
      this.pixelBuffer.context.fillRect(x * window.innerWidth, y * window.innerHeight, this.stars[i].size, this.stars[i].size);
    }
  }

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.scale(camera.z, camera.z);
    ctx.drawImage(this.pixelBuffer.canvas, -window.innerWidth / 2, -window.innerHeight / 2);
    ctx.restore();
  };

  window.addEventListener('resize', this.redraw.bind(this));
  this.redraw();
});
