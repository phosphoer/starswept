TANK.registerComponent('Bullet')

.includes(['Pos2D', 'Velocity', 'Collider2D', 'Life'])

.construct(function()
{
  this.zdepth = 2;
  this.owner = null;
  this.damage = 0.2;
  this.trailEffect = 'mediumRailTrail';
  this.damageEffect = 'damageMedium';
  this.size = 3;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this._entity.Collider2D.collisionLayer = 'bullets';
  this.trailEmitter = ParticleLibrary[this.trailEffect]();

  TANK.main.Renderer2D.add(this);

  this.update = function(dt)
  {
    this.trailEmitter.Pos2D.x = t.x;
    this.trailEmitter.Pos2D.y = t.y;

    this._entity.Velocity.x += Math.cos(t.rotation) * this.accel * dt;
    this._entity.Velocity.y += Math.sin(t.rotation) * this.accel * dt;
  };

  this.draw = function(ctx, camera, dt)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.rotate(t.rotation);
    ctx.scale(2, 1);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, this.size, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
})

.uninitialize(function()
{
  TANK.main.removeChild(this.trailEmitter);
});