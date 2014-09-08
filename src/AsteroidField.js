TANK.registerComponent('AsteroidField')

.construct(function()
{
  this.numAsteroids = 10;
  this.size = [5000, 5000];
  this.asteroids = [];
})

.serialize(function(serializer)
{
  serializer.property(this, 'numAsteroids', 20);
  serializer.property(this, 'size', [10000, 10000]);
})

.initialize(function()
{
  var rng = new RNG();
  for (var i = 0; i < this.numAsteroids; ++i)
  {
    var e = TANK.createEntity('Asteroid');
    e.Pos2D.x = rng.random(-this.size[0] / 2, this.size[0] / 2);
    e.Pos2D.y = rng.random(-this.size[1] / 2, this.size[1] / 2);
    TANK.main.addChild(e);
    this.asteroids.push(e);
  }

  this.update = function(dt)
  {
    for (var i = 0; i < this.asteroids.length; ++i)
    {
      var e = this.asteroids[i];
      if (e.Pos2D.x > this.size[0] / 2)
        e.Pos2D.x = -this.size[0] / 2;
      else if (e.Pos2D.y > this.size[1] / 2)
        e.Pos2D.y = -this.size[1] / 2;
      else if (e.Pos2D.x < -this.size[0] / 2)
        e.Pos2D.x = this.size[0] / 2;
      else if (e.Pos2D.y < -this.size[1] / 2)
        e.Pos2D.y = this.size[1] / 2;
    }
  };
});