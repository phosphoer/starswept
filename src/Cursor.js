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

    t.x = TANK.InputManager.mousePos[0];
    t.y = TANK.InputManager.mousePos[1];
    t.x -= window.innerWidth / 2;
    t.y -= window.innerHeight / 2;
    t.x *= TANK.RenderManager.camera.z;
    t.y *= TANK.RenderManager.camera.z;
    t.x += TANK.RenderManager.camera.x;
    t.y += TANK.RenderManager.camera.y;
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
