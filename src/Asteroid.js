TANK.registerComponent('Asteroid')

.includes(['LightingAndDamage', 'Velocity', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 2;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  this.resource = TANK.main.Resources.get('asteroid-01');
  this._entity.LightingAndDamage.setResource(this.resource);

  v.x = (Math.random() - 0.5) * 16;
  v.y = (Math.random() - 0.5) * 16;
  v.r = (Math.random() - 0.5) * 0.5;
  t.r = Math.random() * Math.PI * 2;

  this.draw = function(ctx, camera)
  {
    ctx.save();

    // Set up transform
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