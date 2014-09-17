TANK.registerComponent('Shield')
.includes(['Pos2D', 'CircleCollider'])
.construct(function()
{
  this.zdepth = 5;

  this.health = 1;
  this.maxHealth = 1;
  this.regenRate = 0.1;
  this.radius = 5;
  this.burstTimer = 0;
  this.burstTime = 5;
  this.disabledTimer = 0;
  this.bubbleOpacity = 0;
  this.disabled = false;
  this.recovering = false;
})
.initialize(function()
{
  var t = this._entity.Pos2D;

  this._entity.CircleCollider.collisionLayer = 'shields';
  this._entity.CircleCollider.collidesWith = ['bullets'];
  this._entity.CircleCollider.setRadius(this.radius);

  TANK.main.Renderer2D.add(this);

  this.disable = function(time)
  {
    this.disabled = true;
    if (time > this.disabledTimer)
      this.disabledTimer = time;
  };

  this.listenTo(this._entity, 'collide', function(obj)
  {
    if (this.disabled || this.health <= 0)
      return;

    if (obj.Bullet)
    {
      obj.Life.life = 0;
      this.health -= obj.Bullet.damage;
      this.bubbleOpacity = this.health / this.maxHealth;
      if (this.health <= 0)
      {
        this.burstTimer = this.burstTime;
        this.recovering = true;
      }

      this._entity.dispatch('shielddamaged', obj.Bullet.owner);
      t.rotation = Math.atan2(obj.Pos2D.y - t.y, obj.Pos2D.x - t.x);
    }
  });

  this.update = function(dt)
  {
    if (this.disabled)
    {
      this.disabledTimer -= dt;
      if (this.disabledTimer <= 0)
      {
        this.disabled = false;
      }
      return;
    }

    if (this.bubbleOpacity > 0.01)
      this.bubbleOpacity *= 0.9;
    else
      this.bubbleOpacity = 0;

    if (this.recovering)
    {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0)
        this.recovering = false;
    }
    else
    {
      this.health += dt * this.regenRate;
      this.health = Math.min(this.health, this.maxHealth);
    }
  };

  this.draw = function(ctx, camera, dt)
  {
    if (this.disabled)
      return;

    ctx.save();

    var grad = ctx.createRadialGradient(this.radius * 0.75, 0, this.radius * 0.2, this.radius * 0.25, 0, this.radius * 0.75);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(1, 'rgba(150, 200, 255, 0.0)');

    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.globalAlpha = this.bubbleOpacity;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };
});