TANK.registerComponent('Clouds')

.includes(['RemoveOnLevelChange'])

.construct(function()
{
  this.clouds = [];
  this.heightMap = [];
  this.zdepth = 5;

  this.numClouds = 1;
  this.fieldSize = [8750, 8750];
  this.cloudColor = [255, 255, 255];
  this.cloudSize = 512;
  this.cloudScale = 3;
  this.noiseFreq = 0.008 + Math.random() * 0.004;
  this.noiseAmplitude = 0.5 + Math.random() * 0.3;
  this.noisePersistence = 0.7 + Math.random() * 0.29;
  this.noiseOctaves = 2;
})

.serialize(function(serializer)
{
  serializer.property(this, 'numClouds', 100);
  serializer.property(this, 'cloudColor', [255, 255, 255]);
})

.initialize(function()
{
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(this.cloudSize, this.cloudSize);

  TANK.main.Renderer2D.add(this);

  // Iterate over every pixel
  this.forEachPixel = function(func)
  {
    for (var i = 0; i < this.cloudSize; ++i)
    {
      for (var j = 0; j < this.cloudSize; ++j)
      {
        func.apply(this, [i, j]);
      }
    }
  };

  //
  // Generate the cloud
  //

  // Fill heightmap
  for (var i = 0; i < this.cloudSize; ++i)
  {
    this.heightMap[i] = [];
    for (var j = 0; j < this.cloudSize; ++j)
      this.heightMap[i][j] = 0;
  }

  // Calculate height map
  noise.seed(Math.random());
  for (var n = 0; n < this.noiseOctaves; ++n)
  {
    this.forEachPixel(function(i, j)
    {
      this.heightMap[i][j] += noise.perlin2(i * this.noiseFreq, j * this.noiseFreq) * this.noiseAmplitude;
    });
    this.noiseAmplitude *= this.noisePersistence;
    this.noiseFreq *= 2;
  }

  // Normalize height map to [0, 1]
  this.heighestPoint = -Infinity;
  this.lowestPoint = Infinity;
  this.forEachPixel(function(i, j)
  {
    this.heighestPoint = Math.max(this.heighestPoint, this.heightMap[i][j]);
    this.lowestPoint = Math.min(this.lowestPoint, this.heightMap[i][j]);
  });
  this.forEachPixel(function(i, j)
  {
    this.heightMap[i][j] = (-this.lowestPoint + this.heightMap[i][j]) / (-this.lowestPoint + this.heighestPoint);
  });
  this.forEachPixel(function(i, j)
  {
    this.heightMap[i][j] = Math.round(this.heightMap[i][j] * 100) / 100;
  });

  // Fade out height map based on distance
  this.forEachPixel(function(i, j)
  {
    var dist = TANK.Math2D.pointDistancePoint([i, j], [this.cloudSize / 2, this.cloudSize / 2]);
    this.heightMap[i][j] *= 1 - (dist / (this.cloudSize / 2 + 2));
  });

  // Set pixels based on height
  this.forEachPixel(function(i, j)
  {
    var color = this.cloudColor.slice();
    color.push(Math.floor(this.heightMap[i][j] * 255));
    this.pixelBuffer.setPixel(i, j, color);
  });

  this.pixelBuffer.applyBuffer();

  //
  // Generate cloud positions
  //
  var rng = new RNG();
  for (var i = 0; i < this.numClouds; ++i)
  {
    this.clouds.push(
    {
      x: rng.random(-this.fieldSize[0] / 2, this.fieldSize[1] / 2),
      y: rng.random(-this.fieldSize[0] / 2, this.fieldSize[1] / 2),
      z: 0.2 + Math.random() * 0.8,
      r: Math.random() * Math.PI * 2
    });
  }

  this.draw = function(ctx, camera)
  {
    for (var i = 0; i < this.clouds.length; ++i)
    {
      var x = (this.clouds[i].x - camera.x * this.clouds[i].z) - window.innerWidth / 2;
      var y = (this.clouds[i].y - camera.y * this.clouds[i].z) - window.innerHeight / 2;
      while (x > this.fieldSize[0] / 2)
        x -= this.fieldSize[0];
      while (y > this.fieldSize[1] / 2)
        y -= this.fieldSize[1];
      while (x < -this.fieldSize[0] / 2)
        x += this.fieldSize[0];
      while (y < -this.fieldSize[1] / 2)
        y += this.fieldSize[1];

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(x, y);
      ctx.scale(this.cloudScale, this.cloudScale);
      ctx.rotate(this.clouds[i].r);
      ctx.translate(-this.cloudSize / 2, -this.cloudSize / 2);
      ctx.drawImage(this.pixelBuffer.canvas, 0, 0);
      ctx.restore();
    }

  };
})

.uninitialize(function()
{
});