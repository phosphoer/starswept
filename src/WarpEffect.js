TANK.registerComponent('WarpEffect')
.includes(['RemoveOnLevelChange'])
.construct(function()
{
  this.et = 0;
  this.zdepth = 10;
})
.initialize(function()
{
  TANK.main.Renderer2D.add(this);

  var scale = 5;
  var context = TANK.main.Renderer2D.context;
  var pixelBuffer = new PixelBuffer();
  pixelBuffer.createBuffer(Math.floor(context.canvas.width / scale), Math.floor(context.canvas.height / scale));
  pixelBuffer.context.scale(1 / scale, 1 / scale);
  pixelBuffer.context.drawImage(context.canvas, 0, 0);

  this.draw = function(ctx, camera, dt)
  {
    ctx.save();
    this.et += dt;
    pixelBuffer.readBuffer();
    for (var y = 0; y < pixelBuffer.height; y += 1)
    {
      for (var x = 0; x < pixelBuffer.width; x += 1)
      {
        var delta = [Math.floor(-5 + Math.random() * 10), Math.floor(-5 + Math.random() * 10)];
        var sample = pixelBuffer.getPixel(x + delta[0], y + delta[1]);
        pixelBuffer.setPixel(x, y, sample);
      }
    }
    pixelBuffer.applyBuffer();

    ctx.scale(scale, scale);
    ctx.translate(-pixelBuffer.width / 2, -pixelBuffer.height / 2);
    ctx.drawImage(pixelBuffer.canvas, 0, 0);
    ctx.restore();
  };
});