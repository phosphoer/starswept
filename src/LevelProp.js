TANK.registerComponent('LevelProp')

.includes(['LightingAndDamage', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 0;
  this.resourceName = '';
})

.serialize(function(serializer)
{
  serializer.property(this, 'zdepth', 0);
  serializer.property(this, 'resourceName', '');
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  // Set up lighting
  this.resource = TANK.main.Resources.get(this.resourceName);
  this._entity.LightingAndDamage.setResource(this.resource);

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