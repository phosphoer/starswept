TANK.registerComponent("Cursor")

// .interfaces("Drawable")

.requires("Pos2D, Collider")

.construct(function()
{
  this.zdepth = 5;
})

.initialize(function()
{
  this.addEventListener("OnEnterFrame", function(dt)
  {
    this.updatePos();
  });

  this.updatePos = function()
  {
    var t = this.parent.Pos2D;

    t.x = TANK.InputManager.mousePosWorld[0];
    t.y = TANK.InputManager.mousePosWorld[1];
  };

  this.draw = function(ctx, camera)
  {
    var t = this.parent.Pos2D;
    ctx.save();

    ctx.fillStyle = "#fff";
    ctx.fillRect(t.x - camera.x - 25, t.y - camera.y - 25, 50, 50);

    ctx.restore();
  };
});
