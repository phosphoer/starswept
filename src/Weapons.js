TANK.registerComponent("Weapons")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 10;
  this.guns = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.addGun = function()
  {
    var gun = {};
    gun.reloadTime = 0.5;
    gun.reloadTimer = 0;
    gun.arcAngle = 0;
    gun.arc = Math.PI / 3;
    gun.angle = 0;
    gun.range = 800;
    this.guns.push(gun);
  };

  this.shoot = function()
  {
    if (!this.targetPos)
    {
      console.warn("Tried to shoot with no target!");
      return;
    }

    for (var i = 0; i < this.guns.length; ++i)
    {
      var gun = this.guns[i];

      // Don't shoot if gun is aiming outside arc
      var dirLeft = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation + gun.arcAngle - gun.arc / 2, this.targetPos);
      var dirRight = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation + gun.arcAngle + gun.arc / 2, this.targetPos);
      if (dirLeft < 0 || dirRight > 0)
        continue;

      if (gun.reloadTimer < 0)
      {
        gun.reloadTimer = gun.reloadTime;
        var e = TANK.createEntity("Bullet");
        e.Pos2D.x = t.x + Math.cos(t.rotation + gun.angle + gun.arcAngle) * 75;
        e.Pos2D.y = t.y + Math.sin(t.rotation + gun.angle + gun.arcAngle) * 75;
        e.Velocity.x = Math.cos(t.rotation + gun.angle + gun.arcAngle) * 800;
        e.Velocity.y = Math.sin(t.rotation + gun.angle + gun.arcAngle) * 800;
        e.Life.life = 5;
        e.Bullet.owner = this._entity;
        TANK.main.addChild(e);
      }
    }
  };

  this.aimAt = function(pos)
  {
    if (pos)
      this.targetPos = [pos[0], pos[1]];
    else
      this.targetPos = null;
  };

  this.update = function(dt)
  {
    this.aimingAtTarget = false;
    for (var i = 0; i < this.guns.length; ++i)
    {
      var gun = this.guns[i];
      gun.reloadTimer -= dt;

      if (this.targetPos)
      {
        gun.aimingAtTarget = false;
        var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation + gun.angle + gun.arcAngle, this.targetPos);
        if (dir < -0.01)
        {
          gun.angle -= dt * 0.5;
        }
        else if (dir > 0.01)
        {
          gun.angle += dt * 0.5;
        }
        else
        {
          gun.aimingAtTarget = true;
          this.aimingAtTarget = true;
        }
      }

      if (gun.angle < gun.arc / -2)
        gun.angle = gun.arc / -2;
      if (gun.angle > gun.arc / 2)
        gun.angle = gun.arc / 2;
    }

  };

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.rotate(t.rotation);
    ctx.strokeStyle = "rgba(100, 255, 100, 0.25)";
    ctx.lineWidth = 2;

    for (var i = 0; i < this.guns.length; ++i)
    {
      var gun = this.guns[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(gun.arcAngle + gun.angle) * gun.range, Math.sin(gun.arcAngle + gun.angle) * gun.range);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(gun.arcAngle - gun.arc / 2) * gun.range, Math.sin(gun.arcAngle - gun.arc / 2) * gun.range);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(gun.arcAngle + gun.arc / 2) * gun.range, Math.sin(gun.arcAngle + gun.arc / 2) * gun.range);
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.arc(0, 0, gun.range, gun.arcAngle - gun.arc / 2, gun.arcAngle + gun.arc / 2);
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();
  };

  this.addGun();
  this.addGun();
  this.guns[1].arcAngle = Math.PI / 2;
  this.guns[1].arc = Math.PI / 4;
});