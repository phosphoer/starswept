TANK.registerComponent("Player")

.requires("Ship")

.construct(function()
{
})

.initialize(function()
{
  var ship = this.parent.Ship;
  var t = this.parent.Pos2D;

  this.addEventListener("OnMouseWheel", function(delta)
  {
    TANK.RenderManager.camera.z += delta * 0.005 * (TANK.RenderManager.camera.z * 0.1);
    if (TANK.RenderManager.camera.z < 1)
      TANK.RenderManager.camera.z = 1;
  });

  this.addEventListener("OnKeyPress", function(keyCode)
  {
    if (keyCode === TANK.Key.SPACE)
      ship.shoot();
    if (keyCode === TANK.Key.W)
      ship.startUp();
    if (keyCode === TANK.Key.S)
      ship.startDown();
    if (keyCode === TANK.Key.A)
      ship.startLeft();
    if (keyCode === TANK.Key.D)
      ship.startRight();
  });

  this.addEventListener("OnKeyRelease", function(keyCode)
  {
    if (keyCode === TANK.Key.W)
      ship.stopUp();
    if (keyCode === TANK.Key.S)
      ship.stopDown();
    if (keyCode === TANK.Key.A)
      ship.stopLeft();
    if (keyCode === TANK.Key.D)
      ship.stopRight();
  });

  this.addEventListener("OnEnterFrame", function(dt)
  {
    TANK.RenderManager.camera.x = t.x;
    TANK.RenderManager.camera.y = t.y;
  });
});