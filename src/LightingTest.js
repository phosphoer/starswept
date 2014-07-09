TANK.registerComponent("LightingTest")

.includes(["Pos2D"])

.construct(function()
{
  this.zdepth = 2;
  this.image = new Image();
  this.normal = new Image();
  this.image.src = "res/lighting-test-diffuse.png";
  this.normal.src = "res/lighting-test-normal.png";
  this.numDirs = 8;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  var that = this;
  this.image.onload = function()
  {
    that.buffers = Lightr.bake(that.image, that.normal, that.numDirs);
  };

  this.update = function(dt)
  {
    t.rotation += dt * 0.5;
  };

  this.draw = function(ctx, camera)
  {
    if (!this.buffers)
      return;

    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.rotate(t.rotation);
    ctx.translate(this.image.width / -2, this.image.height / -2);

    var lightDir = [Math.cos(TANK.main.Game.lightDir), Math.sin(TANK.main.Game.lightDir)];;
    for (var i = 0; i < this.numDirs; ++i)
    {
      var lightDirOffset = (Math.PI * 2 / this.numDirs) * i;
      ctx.globalAlpha = Math.max(0, TANK.Math2D.dot(lightDir, [Math.cos(t.rotation + lightDirOffset), Math.sin(t.rotation + lightDirOffset)]));
      ctx.drawImage(this.buffers[i], 0, 0);
    }

    ctx.restore();
  };
})

.uninitialize(function()
{
  TANK.main.removeChild(this.trailEmitter);
});