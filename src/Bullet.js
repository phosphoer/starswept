TANK.registerComponent("Bullet")

.includes(["Pos2D", "Velocity", "Collider2D", "Life"])

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

  // Make buffer
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(1, 1);

  // Predraw shape
  this.pixelBuffer.context.fillStyle = "#fff";
  this.pixelBuffer.context.fillRect(0, 0, 1, 1);

  TANK.main.Renderer2D.add(this);

  this.listenTo(this._entity, "collide", function(obj)
  {
    if (this.owner === obj)
      return;

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < 1) dist = 1;
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch("camerashake", 0.1 / dist);

    // Do damage
    obj.dispatch("damaged", this.damage, [this._entity.Velocity.x, this._entity.Velocity.y], this.owner);
    TANK.main.removeChild(this._entity);
    this.stopListeningTo(this._entity, "collide");
  });

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.drawImage(this.pixelBuffer.canvas, 0, 0);
    ctx.restore();
  };
});