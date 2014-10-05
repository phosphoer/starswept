TANK.registerComponent('LightingAndDamage')

.includes(['Pos2D'])

.construct(function()
{
  this.resource = null;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.setResource = function(res)
  {
    this.resource = res;

    // Create texture buffers
    this.mainBuffer = new PixelBuffer();
    this.damageBuffer = new PixelBuffer();
    this.decalBuffer = new PixelBuffer();

    // Setup texture buffers
    this.mainBuffer.createBuffer(res.diffuse.width, res.diffuse.height);
    this.damageBuffer.createBuffer(res.diffuse.width, res.diffuse.height);
    this.decalBuffer.createBuffer(res.diffuse.width, res.diffuse.height);
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

    // Draw lighting
    var lightObj = TANK.main.getChildrenWithComponent('DirectionalLight');
    if (lightObj)
      lightObj = lightObj[Object.keys(lightObj)[0]];

    var rotation = t.rotation;
    while (rotation < 0)
      rotation += Math.PI * 2;
    rotation %= Math.PI * 2;

    var numBuffers = this.resource.lightBuffers.length;
    var angleChunk = Math.PI * 2 / numBuffers;
    var lightAngle = (Math.atan2(lightObj.Pos2D.y - t.y, t.x - lightObj.Pos2D.x) + rotation + Math.PI) % (Math.PI * 2);
    var lightDir = [Math.cos(lightAngle), Math.sin(lightAngle)];
    var indexA = Math.floor(lightAngle / angleChunk) % numBuffers;
    var indexB = Math.ceil(lightAngle / angleChunk) % numBuffers;
    var alphaA = 1 - (Math.abs(lightAngle - angleChunk * indexA) / angleChunk);
    var alphaB = 1 - alphaA;

    this.mainBuffer.context.globalCompositeOperation = 'lighter';
    this.mainBuffer.context.globalAlpha = alphaA;
    this.mainBuffer.context.drawImage(this.resource.lightBuffers[indexA], 0, 0);
    this.mainBuffer.context.globalAlpha = alphaB;
    this.mainBuffer.context.drawImage(this.resource.lightBuffers[indexB], 0, 0);

    // Draw damage buffer
    this.mainBuffer.context.globalAlpha = 1;
    this.mainBuffer.context.globalCompositeOperation = 'source-atop';
    this.mainBuffer.context.drawImage(this.decalBuffer.canvas, 0, 0);
    this.mainBuffer.context.globalCompositeOperation = 'destination-out';
    this.mainBuffer.context.drawImage(this.damageBuffer.canvas, 0, 0);

    this.mainBuffer.context.restore();
  };
});