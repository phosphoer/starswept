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

  this.draw = function(ctx, camera)
  {
    if (this.disabled)
      return;

    ctx.save();

    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);

    ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
    ctx.globalAlpha = this.bubbleOpacity;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };
});