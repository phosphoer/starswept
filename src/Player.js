TANK.registerComponent("Player")

.interfaces("Drawable")

.requires("Ship")

.construct(function()
{
  this.zdepth = 5;
  this.shakeTime = 0;
  this.shootButtonAlpha = 0;
  this.draggingShootButton = false;
})

.initialize(function()
{
  var ship = this.parent.Ship;
  var t = this.parent.Pos2D;

  this.shakeCamera = function(duration)
  {
    this.shakeTime = duration;
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

  this.addEventListener("OnGestureChange", function(e)
  {
    if (e.scale)
    {
      TANK.RenderManager.camera.z *= e.scale * 0.5;
      if (TANK.RenderManager.camera.z < 1)
        TANK.RenderManager.camera.z = 1;
    }
  });

  this.addEventListener("OnMouseButtonHeld", function(button)
  {
    if (this.draggingShootButton)
    {
      this.parent.Weapons.aimAt(TANK.InputManager.mousePosWorld);
      this.parent.Weapons.shoot();
    }
    else
    {
      ship.moveTowards(TANK.InputManager.mousePosWorld);
    }
  });

  this.addEventListener("OnMouseDown", function(button)
  {
    var dist = TANK.Math.pointDistancePoint(TANK.InputManager.mousePosWorld, [t.x, t.y]);
    if (dist < 50)
    {
      this.draggingShootButton = true;
      ship.stopUp();
    }
  });  

  this.addEventListener("OnMouseUp", function(button)
  {
    this.draggingShootButton = false;
    this.parent.Weapons.aimAt(null);
    ship.stopUp();
    ship.stopLeft();
    ship.stopRight();
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
    // Show shoot button
    var mouseDist = TANK.Math.pointDistancePoint(TANK.InputManager.mousePosWorld, [t.x, t.y]);
    if (mouseDist < 75)
    {
      this.shootButtonAlpha += dt * 2;
      if (this.shootButtonAlpha > 0.5)
        this.shootButtonAlpha = 0.5;
    }
    else if (!this.draggingShootButton)
    {
      this.shootButtonAlpha -= dt * 3;
      if (this.shootButtonAlpha < 0)
        this.shootButtonAlpha = 0;
    }

    // Camera follow
    TANK.RenderManager.camera.x = t.x;
    TANK.RenderManager.camera.y = t.y;

    // Camera shake
    if (this.shakeTime > 0)
    {
      this.shakeTime -= dt;
      TANK.RenderManager.camera.x += -5 + Math.random() * 10;
      TANK.RenderManager.camera.y += -5 + Math.random() * 10;
    }
  });

  this.draw = function(ctx, camera)
  {
    var pos = TANK.InputManager.mousePosWorld;

    // Draw shoot button
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    if (this.draggingShootButton)
      ctx.translate(pos[0] - camera.x, pos[1] - camera.y);
    ctx.scale(TANK.Game.scaleFactor, TANK.Game.scaleFactor);
    ctx.fillStyle = "rgba(255, 50, 50, " + this.shootButtonAlpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 2, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // Draw line to shoot button
    if (this.draggingShootButton)
    {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 50, 50, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x - camera.x, t.y - camera.y);
      ctx.lineTo(pos[0] - camera.x, pos[1] - camera.y);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  };
});