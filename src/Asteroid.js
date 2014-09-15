TANK.registerComponent('Asteroid')

.includes(['LightingAndDamage', 'Velocity', 'PixelCollider', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 1;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  this.resource = TANK.main.Resources.get('asteroid-01');

  // Set up collision
  this._entity.PixelCollider.collisionLayer = 'asteroids';
  this._entity.PixelCollider.collidesWith = ['bullets'];
  this._entity.PixelCollider.setImage(this.resource.diffuse);

  // Set up lighting
  this._entity.LightingAndDamage.setResource(this.resource);

  v.x = (Math.random() - 0.5) * 16;
  v.y = (Math.random() - 0.5) * 16;
  v.r = (Math.random() - 0.5) * 0.5;
  t.r = Math.random() * Math.PI * 2;

  //
  // Collision response
  //
  this.listenTo(this._entity, 'collide', function(obj, pixelPos)
  {
    var objPos = [obj.Pos2D.x, obj.Pos2D.y];
    var bullet = obj.Bullet;

    if (bullet && bullet.owner !== this._entity)
    {
      // Do damage
      obj.Life.life = 0;
      this._entity.LightingAndDamage.addDamage(pixelPos[0], pixelPos[1], bullet.damage * (30 + Math.random() * 30));

      // Spawn effect
      ParticleLibrary.damageMedium(objPos[0], objPos[1], obj.Pos2D.rotation + Math.PI);
    }
  });

  //
  // Draw code
  //
  this.draw = function(ctx, camera)
  {
    // Set up transform
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.resource.diffuse.width / -2, this.resource.diffuse.height / -2);

    // Draw the main buffer
    this._entity.LightingAndDamage.redraw();
    ctx.drawImage(this._entity.LightingAndDamage.mainBuffer.canvas, 0, 0);

    ctx.restore();
  };
});