function PixelBuffer()
{
  this.createBuffer = function(width, height)
  {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d");
    this.buffer = this.context.getImageData(0, 0, this.width, this.height);
  };

  this.readBuffer = function()
  {
    this.buffer = this.context.getImageData(0, 0, this.width, this.height);
  };

  this.applyBuffer = function()
  {
    this.context.putImageData(this.buffer, 0, 0);
  };

  this.setPixel = function(x, y, color)
  {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height)
      return;

    var index = x * 4 + (y * this.buffer.width * 4);
    this.buffer.data[index + 0] = Math.floor(color[0]);
    this.buffer.data[index + 1] = Math.floor(color[1]);
    this.buffer.data[index + 2] = Math.floor(color[2]);
    this.buffer.data[index + 3] = Math.floor(color[3]);
  };

  this.setPixelRadius = function(centerX, centerY, radiusA, colorA, radiusB, colorB)
  {
    this.setPixelRadiusRand(centerX, centerY, radiusA, colorA, 1, radiusB, colorB, 1);
  };

  this.setPixelRadiusRand = function(centerX, centerY, radiusA, colorA, randA, radiusB, colorB, randB)
  {
    var radius = radiusB || radiusA;
    var xStart = Math.floor(centerX - radius);
    var xEnd = Math.floor(centerX + radius);
    var yStart = Math.floor(centerY - radius);
    var yEnd = Math.floor(centerY + radius);

    // Iterate over the area defined by radius
    for (var x = xStart; x < xEnd; ++x)
    {
      for (var y = yStart; y < yEnd; ++y)
      {
        // Only draw within radius
        var d = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
        if (d < radius)
        {
          if (radiusB)
          {
            // If a second color and radius specified, interpolate between colorA and B
            var t = (d - radiusA) / (radiusB - radiusA);
            var rand = randA * (1 - t) + randB * t;
            if (Math.random() >= rand)
              continue;
            var color = [];
            for (var i = 0; i < 4; ++i)
              color[i] = Math.round(colorA[i] * (1 - t) + colorB[i] * t);
            this.setPixel(x, y, color);
          }
          else if (Math.random() < randA)
          {
            // Otherwise just set the color
            this.setPixel(x, y, colorA);
          }
        }
      }
    }
  };

  this.getPixel = function(x, y)
  {
    x = Math.round(x);
    y = Math.round(y);
    x = Math.min(this.buffer.width, Math.max(0, x));
    y = Math.min(this.buffer.height, Math.max(0, y));
    var index = x * 4 + (y * this.buffer.width * 4);
    var pixel = [];
    pixel[0] = this.buffer.data[index + 0];
    pixel[1] = this.buffer.data[index + 1];
    pixel[2] = this.buffer.data[index + 2];
    pixel[3] = this.buffer.data[index + 3];
    return pixel;
  };

  this.testRay = function(rayStart, rayDir, precision)
  {
    var p = [rayStart[0], rayStart[1]];
    var len = Math.sqrt(rayDir[0] * rayDir[0] + rayDir[1] * rayDir[1]);
    var v = [rayDir[0] / len, rayDir[1] / len];
    if (typeof precision === "undefined")
      precision = 5;
    var hit = false;
    var minSteps = 10;
    while (!hit)
    {
      p[0] += v[0] * precision;
      p[1] += v[1] * precision;
      var pixel = this.getPixel(p[0], p[1]);
      if (pixel && pixel[3] > 0)
        return p;
      if (!pixel)
      {
        --minSteps;
        if (minSteps < 0)
          return null;
      }
    }
  };
}