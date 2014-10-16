TANK.registerComponent('WarpEffect')
.includes(['RemoveOnLevelChange'])
.construct(function()
{
  this.et = 1;
  this.blackAlpha = 0;
  this.zdepth = 10;
})
.initialize(function()
{
  TANK.main.Renderer2D.add(this);

  var scale = 2;
  var context = TANK.main.Renderer2D.context;
  var pixelBuffer = new PixelBuffer();
  pixelBuffer.createBuffer(Math.floor(context.canvas.width / scale), Math.floor(context.canvas.height / scale));
  pixelBuffer.context.scale(1 / scale, 1 / scale);
  pixelBuffer.context.drawImage(context.canvas, 0, 0);

  this.draw = function(ctx, camera, dt)
  {
    this.et += dt;
    this.blackAlpha += dt;

    camera.z = 1;

    ctx.save();
    pixelBuffer.readBuffer();
    for (var i = 0; i < 8000; ++i)
    {
      var point = [Math.random() * pixelBuffer.width, Math.random() * pixelBuffer.height];
      var dist = Math.sqrt(Math.pow(point[0] - pixelBuffer.width / 2, 2) + Math.pow(point[1] - pixelBuffer.height / 2, 2));
      var vec = TANK.Math2D.scale(TANK.Math2D.subtract([pixelBuffer.width / 2, pixelBuffer.height / 2], point), this.et * this.et * 0.05);
      var sample = pixelBuffer.getPixel(Math.floor(point[0]), Math.floor(point[1])).map(function(v) {return v * 1.1;});

      pixelBuffer.setPixel(Math.floor(point[0]), Math.floor(point[1]), [0, 0, 0, 255]);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0]), Math.floor(point[1] + vec[1]), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 0.9), Math.floor(point[1] + vec[1] * 0.9), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 0.8), Math.floor(point[1] + vec[1] * 0.8), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 0.7), Math.floor(point[1] + vec[1] * 0.7), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 0.6), Math.floor(point[1] + vec[1] * 0.6), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 0.5), Math.floor(point[1] + vec[1] * 0.5), sample);
    }
    pixelBuffer.applyBuffer();

    ctx.scale(scale, scale);
    ctx.translate(-pixelBuffer.width / 2, -pixelBuffer.height / 2);
    ctx.drawImage(pixelBuffer.canvas, 0, 0);
    ctx.globalAlpha = this.blackAlpha / 3;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, pixelBuffer.width, pixelBuffer.height);
    ctx.restore();
  };
})

.uninitialize(function()
{
});