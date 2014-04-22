TANK.registerComponent("Draggable")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 8;
  this.dragging = false;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.listenTo(this._entity, "dragstart", function()
  {
    this.dragging = true;
  });

  this.listenTo(this._entity, "dragend", function(dest)
  {
    this.dragging = false;
  });

  this.draw = function(ctx, camera)
  {
    if (!this.dragging)
      return;

    var mousePos = TANK.main.Game.mousePosWorld;
    ctx.save();
    ctx.strokeStyle = "#5f5";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(t.x - camera.x, t.y - camera.y);
    ctx.lineTo(mousePos[0] - camera.x, mousePos[1] - camera.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };
});

TANK.registerComponent("Droppable");