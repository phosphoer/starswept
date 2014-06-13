TANK.registerComponent("Weapons")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 3;
  this.guns =
  {
    left: [],
    right: [],
    front: [],
    back: []
  };
  this.height = 10;
  this.width = 5;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.addGun = function(gunObj, gunSide)
  {
    var angle;
    if (gunSide === "front")
      angle = 0;
    else if (gunSide === "back")
      angle = Math.PI;
    else if (gunSide === "left")
      angle = Math.PI / -2;
    else if (gunSide === "right")
      angle = Math.PI / 2;

    gunObj.angle = angle;
    this.guns[gunSide].push(gunObj);
  };

  this.removeGun = function(gunObj, gunSide)
  {
    for (var i = 0; i < this.guns[gunSide].length; ++i)
    {
      if (this.guns[gunSide][i] === gunObj)
      {
        this.guns[gunSide].splice(i, 1);
        return true;
      }
    }

    return false;
  };

  this.reloadPercent = function(gunSide)
  {
    if (this.guns[gunSide].length === 0)
      return 0;
    var gun = this.guns[gunSide][0]; 
    return 1 - gun.reloadTimer / gun.reloadTime;
  };

  this.fireGun = function(gunIndex, gunSide)
  {
    var gun = this.guns[gunSide][gunIndex];
    if (gun.reloadTimer > 0)
      return;
    gun.reloadTimer = gun.reloadTime;

    var pos = [gun.x, gun.y];
    pos = TANK.Math2D.subtract(pos, [this.width / 2, this.height / 2]);
    pos = TANK.Math2D.rotate(pos, t.rotation);
    pos = TANK.Math2D.scale(pos, TANK.main.Game.scaleFactor);
    pos = TANK.Math2D.add(pos, [t.x, t.y]);

    // Fire bullet
    var e = TANK.createEntity("Bullet");
    e.Pos2D.x = pos[0];
    e.Pos2D.y = pos[1];
    e.Pos2D.rotation = t.rotation + gun.angle;
    e.Velocity.x = Math.cos(t.rotation + gun.angle) * gun.projectileSpeed;
    e.Velocity.y = Math.sin(t.rotation + gun.angle) * gun.projectileSpeed;
    e.Life.life = gun.range / gun.projectileSpeed;
    e.Bullet.owner = this._entity;
    e.Bullet.damage = gun.damage;
    TANK.main.addChild(e);

    // Create effect
    ParticleLibrary.gunFireMedium(pos[0], pos[1], t.rotation + gun.angle);

    // Recoil
    this._entity.Velocity.x -= Math.cos(t.rotation + gun.angle) * gun.recoil;
    this._entity.Velocity.y -= Math.sin(t.rotation + gun.angle) * gun.recoil;
    this._entity.Velocity.r += -gun.recoil * 0.05 + Math.random() * gun.recoil * 0.1;
  };

  this.fireGuns = function(gunSide)
  {
    // Shake screen if on camera
    if (this.reloadPercent(gunSide) >= 1)
    {
      var camera = TANK.main.Renderer2D.camera;
      var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
      if (dist < 1) dist = 1;
      if (dist < window.innerWidth / 2)
        TANK.main.dispatch("camerashake", 0.1 / (dist * 5));
    }
    
    var guns = this.guns[gunSide];
    for (var i = 0; i < guns.length; ++i)
      this.fireGun(i, gunSide);

  };

  this.update = function(dt)
  {
    for (var i in this.guns)
    {
      var guns = this.guns[i];
      for (var j = 0; j < guns.length; ++j)
      {
        guns[j].reloadTimer -= dt;
        if (guns[j].reloadTimer < 0)
          guns[j].reloadTimer = 0;
      }
    }
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.width / -2, this.height / -2);

    for (var gunSide in this.guns)
    {
      for (var i = 0; i < this.guns[gunSide].length; ++i)
      {
        var gun = this.guns[gunSide][i];
        ctx.save();
        ctx.translate(gun.x, gun.y);
        ctx.rotate(gun.angle);

        if (!gun.image)
        {
          ctx.fillStyle = "#fff";
          ctx.fillRect(-2.5, -2.5, 5, 5);
        }
        else
        {
          ctx.scale(0.5, 0.5);
          ctx.translate(gun.image.width / -2, gun.image.height / -2);
          ctx.drawImage(gun.image, 0, 0);
        }
        ctx.restore();
      }
    }

    ctx.restore();
  };
});
