TANK.registerComponent("Bullet")

.interfaces("Drawable")

.requires("Pos2D, Velocity, Collider")

.construct(function()
{
  this.zdepth = 2;
  this.life = 5;
})

.initialize(function()
{
  var t = this.parent.Pos2D;

  this.parent.Collider.collisionLayer = "Bullets";
  this.parent.Collider.collidesWith = ["Ships"];

  // Make buffer
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(1, 1);

  // Predraw shape
  this.pixelBuffer.context.fillStyle = "#fff";
  this.pixelBuffer.context.fillRect(0, 0, 1, 1);

  this.addEventListener("OnEnterFrame", function(dt)
  {
    this.life -= dt;
    if (this.life < 0)
      TANK.removeEntity(this.parent);
  });

  this.OnCollide = function(obj)
  {
    TANK.removeEntity(this.parent);
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.Game.scaleFactor, TANK.Game.scaleFactor);
    ctx.drawImage(this.pixelBuffer.canvas, 0, 0);
    ctx.restore();
  };
});