TANK.registerComponent("Selectable")

.interfaces("Drawable")

.requires("Pos2D, Collider")

.construct(function()
{
  this.zdepth = 5;
  this.selected = false;
})

.initialize(function()
{
  this.addEventListener("OnMouseDown", function(e)
  {
    // Get cursor pos
    var e = TANK.createEntity("Cursor");
    TANK.addEntity(e);
    e.Cursor.updatePos();

    if (e.Collider.collide(this.parent.Collider))
    {
      this.parent.invoke("OnSelected");
      this.selected = true;
    }
    else if (this.selected)
    {
      this.parent.invoke("OnDeselected");
      this.selected = false;
    }

    TANK.removeEntity(e);
  });

  this.draw = function(ctx, camera)
  {
    if (!this.selected)
      return;

    // Size collider
    var size = [this.parent.Collider.width, this.parent.Collider.height];
    var t = this.parent.Pos2D;
    ctx.save();

    ctx.translate(t.x - camera.x, t.y - camera.y);

    ctx.strokeStyle = "#5f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(size[0] / -2, size[1] / -2, size[0], size[1]);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  };
});