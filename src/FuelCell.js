TANK.registerComponent('FuelCell')

.includes(['LightingAndDamage', 'Velocity', 'Collider2D', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 1;
  this.resourceName = 'fuel-cell';
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  // Set up lighting
  this.resource = TANK.main.Resources.get(this.resourceName);
  this._entity.LightingAndDamage.setResource(this.resource);

  // Set up collision
  this._entity.Collider2D.collisionLayer = 'pickups';

  // Initial velocity / rotation
  v.x = (Math.random() - 0.5) * 16;
  v.y = (Math.random() - 0.5) * 16;
  v.r = (Math.random() - 0.5) * 0.5;
  t.rotation = Math.random() * Math.PI * 2;

  //
  // Draw code
  //
  this.draw = function(ctx, camera)
  {
    // Set up transform
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.resource.diffuse.width / -2, this.resource.diffuse.height / -2);

    // Draw the main buffer
    this._entity.LightingAndDamage.redraw();
    ctx.drawImage(this._entity.LightingAndDamage.mainBuffer.canvas, 0, 0);

    ctx.restore();
  };
});