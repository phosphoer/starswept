TANK.registerComponent("Weapons")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 1;
  this.bulletSpeed = 800;
  this.guns =
  {
    left: {
      count: 2,
      damage: 0.1,
      range: 800,
      timer: 0,
      time: 5,
      angle: Math.PI * -0.5
    },
    right: {
      count: 2,
      damage: 0.1,
      range: 800,
      timer: 0,
      time: 5,
      angle: Math.PI * 0.5
    },
    front: {
      count: 1,
      damage: 0.1,
      range: 600,
      timer: 0,
      time: 3,
      angle: 0
    },
    back: {
      count: 1,
      damage: 0.1,
      range: 600,
      timer: 0,
      time: 5,
      angle: Math.PI
    }
  };
  this.height = 10;
  this.width = 5;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  // TANK.main.Renderer2D.add(this);

  this.reloadPercent = function(gunSide)
  {
    var gun = this.guns[gunSide];
    return 1 - gun.timer / gun.time;
  };

  this.fireGun = function(gunIndex, gunSide)
  {
    var gun = this.guns[gunSide];
    var pos = [0, 0];
    gunIndex += (1 / gun.count) / 2;
    if (gunSide === "front")
      pos = [this.width / 2, (gunIndex / gun.count) * this.height - this.height / 2];
    else if (gunSide === "back")
      pos = [-this.width / 2, (gunIndex / gun.count) * this.height - this.height / 2];
    else if (gunSide === "left")
      pos = [(gunIndex / gun.count) * this.width - this.width / 2, -this.height / 2];
    else if (gunSide === "right")
      pos = [(gunIndex / gun.count) * this.width - this.width / 2, this.height / 2];

    pos = TANK.Math2D.rotate(pos, t.rotation);
    pos = TANK.Math2D.add(pos, [t.x, t.y]);

    // Fire bullet
    var e = TANK.createEntity("Bullet");
    e.Pos2D.x = pos[0];
    e.Pos2D.y = pos[1];
    e.Pos2D.rotation = t.rotation + gun.angle;
    e.Velocity.x = Math.cos(t.rotation + gun.angle) * this.bulletSpeed;
    e.Velocity.y = Math.sin(t.rotation + gun.angle) * this.bulletSpeed;
    e.Life.life = gun.range / this.bulletSpeed;
    e.Bullet.owner = this._entity;
    e.Bullet.damage = gun.damage;
    TANK.main.addChild(e);

    // Create effect
    ParticleLibrary.gunFireMedium(pos[0], pos[1], t.rotation + gun.angle);
  };

  this.fireGuns = function(gunSide)
  {
    var gun = this.guns[gunSide];
    if (gun.timer > 0)
      return;

    gun.timer = gun.time;
    for (var i = 0; i < this.guns[gunSide].count; ++i)
    {
      this.fireGun(i, gunSide);
    }

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < 1) dist = 1;
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch("camerashake", 0.1 / (dist * 5));
  };

  this.update = function(dt)
  {
    for (var i in this.guns)
    {
      var gun = this.guns[i];
      gun.timer -= dt;
      if (gun.timer < 0)
        gun.timer = 0;
    }
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.rotate(t.rotation);
    ctx.strokeStyle = "rgba(100, 255, 100, 0.25)";
    ctx.lineWidth = 2;

    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.restore();
  };
});