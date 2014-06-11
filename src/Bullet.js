TANK.registerComponent("Bullet")

.includes(["Pos2D", "Velocity", "Collider2D", "Life", "ParticleEmitter"])

.construct(function()
{
  this.zdepth = 2;
  this.owner = null;
  this.damage = 0.2;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this._entity.Collider2D.collisionLayer = "bullets";
  this._entity.Collider2D.collidesWith = ["ships"];

  var emitter = this._entity.ParticleEmitter;
  emitter.particleImage.src = "res/particle-spark-1.png";
  emitter.spawnPerSecond = 200;
  emitter.particleLifeMin = 0.2;
  emitter.particleLifeMax = 0.4;
  emitter.particleAlphaDecayMin = 0.80;
  emitter.particleAlphaDecayMax = 0.85;

  TANK.main.Renderer2D.add(this);

  this.listenTo(this._entity, "collide", function(obj)
  {
    if (this.owner === obj)
      return;

    // Special ship collision logic
    var hit = true;
    if (obj.Ship)
    {
      hit = false;
      var testPos = [t.x, t.y];
      var shipPos = [obj.Pos2D.x, obj.Pos2D.y];
      var shipHalfSize = TANK.Math2D.scale([obj.Ship.collisionBuffer.width / 2, obj.Ship.collisionBuffer.height / 2], TANK.main.Game.scaleFactor);
      testPos = TANK.Math2D.subtract(testPos, shipPos);
      testPos = TANK.Math2D.rotate(testPos, -obj.Pos2D.rotation);
      testPos = TANK.Math2D.add(testPos, shipHalfSize);
      testPos = TANK.Math2D.scale(testPos, 1 / TANK.main.Game.scaleFactor);
      var p = obj.Ship.collisionBuffer.getPixel(testPos[0], testPos[1]);
      if (p[3] > 0)
      {
        // Do damage
        obj.dispatch("damaged", this.damage, [this._entity.Velocity.x, this._entity.Velocity.y], [t.x, t.y], this.owner);
        TANK.main.removeChild(this._entity);
        this.stopListeningTo(this._entity, "collide");
        obj.Ship.addDamage(testPos[0], testPos[1], 3 + Math.random() * 3);

        // Spawn effect
        ParticleLibrary.damageMedium(t.x, t.y, t.rotation + Math.PI);
        hit = true;
      }
    }

    if (!hit)
      return;

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < 1) dist = 1;
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch("camerashake", 0.1 / dist);
  });

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.globalCompositeOperation = "lighten";
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(1, 2);
    ctx.rotate(t.rotation);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, 3, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
});