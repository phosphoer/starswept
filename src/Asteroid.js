TANK.registerComponent('Asteroid')

.includes(['LightingAndDamage', 'Velocity'])

.construct(function()
{
  this.zdepth = 2;

  this.imageDiffuse = new Image();
  this.imageNormals = new Image();
  this.imageDiffuse.src = 'res/img/asteroid-01.png';
  this.imageNormals.src = 'res/img/asteroid-01-normals.png';
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  this.imageDiffuse.onload = function()
  {
    this.imageNormals.onload = function()
    {
      this.lightBuffers = Lightr.bake(8, this.imageDiffuse, this.imageNormals);
      this._entity.LightingAndDamage.setImage(this.imageDiffuse, this.lightBuffers);
    }.bind(this);
  }.bind(this);

  v.x = (Math.random() - 0.5) * 16;
  v.y = (Math.random() - 0.5) * 16;
  v.r = (Math.random() - 0.5) * 0.5;

  this.update = function(dt)
  {
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();

    // Set up transform
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.imageDiffuse.width / -2, this.imageDiffuse.height / -2);

    // Draw the main buffer
    this._entity.LightingAndDamage.redraw();
    ctx.drawImage(this._entity.LightingAndDamage.mainBuffer.canvas, 0, 0);

    ctx.restore();
  };
});