TANK.registerComponent("AIAttack")

.requires("AIShip")

.construct(function()
{
  this.target = null;
  this.maxTurnSpeed = 1;
  this.optimalDistance = 400;
})

.initialize(function()
{
  var t = this.parent.Pos2D;
  var v = this.parent.Velocity;
  var ship = this.parent.Ship;

  this.target = TANK.getEntity("Player");

  this.addEventListener("OnEnterFrame", function(dt)
  {
    if (!this.target || !TANK.getEntity(this.target.id))
      return;

    // Get direction to player
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetVel = this.target.Velocity;
    targetPos[0] += targetVel.x * 1;
    targetPos[1] += targetVel.y * 1;
    var dir = Math.getDirectionToPoint([t.x, t.y], t.rotation, targetPos);
    var targetDist = TANK.Math.pointDistancePoint([t.x, t.y], targetPos);

    // Target is to the left
    var aimingAtTarget = false;
    if (dir < -0.1)
    {
      ship.startLeft();
      ship.stopRight();
    }
    // Target is to the right
    else if (dir > 0.1)
    {
      ship.startRight();
      ship.stopLeft();
    }
    // Aiming at target
    else
    {
      aimingAtTarget = true;
      ship.stopRight();
      ship.stopLeft();
      v.r *= 0.95;
    }

    if (aimingAtTarget && targetDist > this.optimalDistance)
    {
      ship.startUp();
    }
    else
    {
      ship.stopUp();
    }

    // Shoot randomly
    if (Math.random() < 0.05 && aimingAtTarget && targetDist < 1000)
    {
      ship.shoot();
    }

    // Cap movement
    if (Math.abs(v.r) > this.maxTurnSpeed)
      v.r *= 0.95;
  });
});