TANK.registerComponent("Weapons")

.interfaces("Drawable")

.requires("Pos2D")

.construct(function()
{
  this.reloadTime = 0.5;
  this.reloadTimer = 0;
  this.arcAngle = 0;
  this.arc = Math.PI / 3;
  this.angle = 0;
  this.range = 800;
  this.destAngle = 0;
})

.initialize(function()
{
  var t = this.parent.Pos2D;

  this.shoot = function()
  {
    if (this.reloadTimer < 0)
    {
      this.reloadTimer = this.reloadTime;
      var e = TANK.createEntity("Bullet");
      e.Pos2D.x = t.x + Math.cos(t.rotation + this.angle + this.arcAngle) * 75;
      e.Pos2D.y = t.y + Math.sin(t.rotation + this.angle + this.arcAngle) * 75;
      e.Velocity.x = Math.cos(t.rotation + this.angle + this.arcAngle) * 800;
      e.Velocity.y = Math.sin(t.rotation + this.angle + this.arcAngle) * 800;
      e.Life.life = 5;
      TANK.addEntity(e);
    }
  };

  this.aimAt = function(pos)
  {
    if (pos)
      this.targetPos = [pos[0], pos[1]];
    else
      this.targetPos = null;
  };

  this.addEventListener("OnEnterFrame", function(dt)
  {
    this.reloadTimer -= dt;

    if (this.targetPos)
    {
      var dir = Math.getDirectionToPoint([t.x, t.y], t.rotation + this.angle + this.arcAngle, this.targetPos);
      if (dir < -0.01)
      {
        this.angle -= dt * 0.5;
      }
      else if (dir > 0.01)
      {
        this.angle += dt * 0.5;
      }
    }

    if (this.angle < this.arc / -2)
      this.angle = this.arc / -2;
    if (this.angle > this.arc / 2)
      this.angle = this.arc / 2;
  });

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.rotate(t.rotation);
    ctx.strokeStyle = "rgba(100, 255, 100, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(this.arcAngle + this.angle) * this.range, Math.sin(this.arcAngle + this.angle) * this.range);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(this.arcAngle - this.arc / 2) * this.range, Math.sin(this.arcAngle - this.arc / 2) * this.range);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(this.arcAngle + this.arc / 2) * this.range, Math.sin(this.arcAngle + this.arc / 2) * this.range);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(0, 0, this.range, this.arcAngle - this.arc / 2, this.arcAngle + this.arc / 2);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };
});