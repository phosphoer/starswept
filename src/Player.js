TANK.registerComponent("Player")

.requires("Ship")

.construct(function()
{
  this.shakeTime = 0;
})

.initialize(function()
{
  var ship = this.parent.Ship;
  var t = this.parent.Pos2D;

  this.shakeCamera = function(duration)
  {
    this.shakeTime = duration;
  };

  this.checkSelect = function()
  {
    for (var i in 
  };

  this.OnCollide = function(obj)
  {
    this.shakeCamera(0.1);
  };

  this.addEventListener("OnCameraShake", function(duration)
  {
    this.shakeCamera(duration);
  });

  this.addEventListener("OnMouseWheel", function(delta)
  {
    TANK.RenderManager.camera.z += delta * 0.005 * (TANK.RenderManager.camera.z * 0.1);
    if (TANK.RenderManager.camera.z < 1)
      TANK.RenderManager.camera.z = 1;
  });

  this.addEventListener("OnMouseDown", function(button)
  {
  });

  this.addEventListener("OnKeyPress", function(keyCode)
  {
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

    if (this.shakeTime > 0)
    {
      this.shakeTime -= dt;
      TANK.RenderManager.camera.x += -5 + Math.random() * 10;
      TANK.RenderManager.camera.y += -5 + Math.random() * 10;
    }
  });
});