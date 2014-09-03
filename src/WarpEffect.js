TANK.registerComponent('WarpEffect')
.includes(['RemoveOnLevelChange'])
.construct(function()
{
  this.et = 1;
  this.zdepth = 10;
})
.initialize(function()
{
  TANK.main.Renderer2D.add(this);
  // this.oldClearColor = TANK.main.Renderer2D.clearColor;
  // TANK.main.Renderer2D.clearColor = [0, 0, 0, 0];

  var scale = 2;
  var context = TANK.main.Renderer2D.context;
  var pixelBuffer = new PixelBuffer();
  pixelBuffer.createBuffer(Math.floor(context.canvas.width / scale), Math.floor(context.canvas.height / scale));
  pixelBuffer.context.scale(1 / scale, 1 / scale);
  pixelBuffer.context.drawImage(context.canvas, 0, 0);

  var pixelBufferCopy = new PixelBuffer();
  pixelBufferCopy.createBuffer(Math.floor(context.canvas.width / scale), Math.floor(context.canvas.height / scale));
  pixelBufferCopy.context.scale(1 / scale, 1 / scale);
  pixelBufferCopy.context.drawImage(context.canvas, 0, 0);
  pixelBufferCopy.readBuffer();

  this.draw = function(ctx, camera, dt)
  {
    camera.z = 1;

    ctx.save();
    this.et += dt;
    pixelBuffer.readBuffer();
    for (var i = 0; i < 3000; ++i)
    {
      var point = [Math.random() * pixelBuffer.width, Math.random() * pixelBuffer.height];
      var vec = TANK.Math2D.scale(TANK.Math2D.normalize(TANK.Math2D.subtract([pixelBuffer.width / 2, pixelBuffer.height / 2], point)), this.et * this.et * 2);
      var sample = pixelBuffer.getPixel(Math.floor(point[0]), Math.floor(point[1])).map(function(v) {return v * 1.1;});
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0]), Math.floor(point[1] + vec[1]), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 2), Math.floor(point[1] + vec[1] * 2), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 1.5), Math.floor(point[1] + vec[1] * 1.5), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] / 2), Math.floor(point[1] + vec[1] / 2), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] / 4), Math.floor(point[1] + vec[1] / 4), sample);
    }
    pixelBuffer.applyBuffer();

    ctx.scale(scale, scale);
    ctx.translate(-pixelBuffer.width / 2, -pixelBuffer.height / 2);
    ctx.drawImage(pixelBuffer.canvas, 0, 0);
    ctx.restore();
  };
})

.uninitialize(function()
{
  // TANK.main.Renderer2D.clearColor = this.oldClearColor;
});