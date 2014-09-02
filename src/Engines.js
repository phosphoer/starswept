TANK.registerComponent("Engines")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 4;
  this.engineBuffer = new PixelBuffer();
  this.color = 'rgba(255, 0, 255, 0)';
  this.size = [30, 14];
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;
  var lights = this._entity.Lights;

  TANK.main.Renderer2D.add(this);

  this.drawEngine = function()
  {
    this.engineBuffer.createBuffer(this.size[0], this.size[1]);

    var context = this.engineBuffer.context;
    var canvas = this.engineBuffer.canvas;

    var c1 = [canvas.width * 0.9, canvas.height / 2, canvas.height * 0.1];
    var c2 = [canvas.width * 0.75, canvas.height / 2, canvas.height / 2];

    var grad = context.createRadialGradient(c1[0], c1[1], c1[2], c2[0], c2[1], c2[2]);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, this.color);

    context.scale(2, 1);
    context.translate(canvas.width / -2, 0);

    context.fillStyle = grad;
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  this.draw = function(ctx, camera)
  {
    if (ship.thrustAlpha <= 0)
      return;

    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(ship.image.width / -2, ship.image.height / -2);
    ctx.globalAlpha = ship.thrustAlpha;

    for (var i = 0; i < lights.lights.length; ++i)
    {
      var light = lights.lights[i];
      if (!light.isEngine)
        continue;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(this.engineBuffer.width / -1, this.engineBuffer.height / -2);
      ctx.drawImage(this.engineBuffer.canvas, light.x + 4, light.y);
      ctx.restore();
    }

    ctx.restore();
  };

  this.drawEngine();
});