TANK.registerComponent('LightingAndDamage')

.includes(['Pos2D'])

.construct(function()
{
  this.image = null;
  this.lightBuffers = null;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.setImage = function(image, lightBuffers)
  {
    this.image = image;
    this.lightBuffers = lightBuffers;

    // Create texture buffers
    this.mainBuffer = new PixelBuffer();
    this.damageBuffer = new PixelBuffer();
    this.decalBuffer = new PixelBuffer();

    // Setup texture buffers
    this.mainBuffer.createBuffer(this.image.width, this.image.height);
    this.damageBuffer.createBuffer(this.image.width, this.image.height);
    this.decalBuffer.createBuffer(this.image.width, this.image.height);
  }

  // Add damage decals
  this.addDamage = function(x, y, radius)
  {
    // Cut out radius around damage
    this.damageBuffer.setPixelRadiusRand(x, y, radius - 2, [255, 255, 255, 255], 0.7, radius, [0, 0, 0, 0], 0.0);
    this.damageBuffer.applyBuffer();

    // Draw burnt edge around damage
    this.decalBuffer.setPixelRadius(x, y, radius - 1, [200, 100, 0, 255], radius, [0, 0, 0, 50]);
    this.decalBuffer.applyBuffer();
  };

  this.redraw = function()
  {
    this.mainBuffer.context.save();
    this.mainBuffer.context.clearRect(0, 0, this.mainBuffer.width, this.mainBuffer.height);
    this.mainBuffer.context.drawImage(this.image, 0, 0);

    // Draw lighting
    var lightDir = [Math.cos(TANK.main.Game.lightDir), Math.sin(TANK.main.Game.lightDir)];
    for (var i = 0; i < this.lightBuffers.length; ++i)
    {
      var lightDirOffset = (Math.PI * 2 / this.lightBuffers.length) * i - Math.PI / 2;
      this.mainBuffer.context.globalAlpha = Math.max(0, -TANK.Math2D.dot(lightDir, [Math.cos(t.rotation + lightDirOffset), Math.sin(t.rotation + lightDirOffset)]));
      if (this.mainBuffer.context.globalAlpha > 0)
        this.mainBuffer.context.drawImage(this.lightBuffers[i], 0, 0);
    }

    // Draw damage buffer
    this.mainBuffer.context.globalAlpha = 1;
    this.mainBuffer.context.globalCompositeOperation = 'source-atop';
    this.mainBuffer.context.drawImage(this.decalBuffer.canvas, 0, 0);
    this.mainBuffer.context.globalCompositeOperation = 'destination-out';
    this.mainBuffer.context.drawImage(this.damageBuffer.canvas, 0, 0);
    this.mainBuffer.context.restore();
  };
});