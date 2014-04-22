TANK.registerComponent("AIAttack")

.includes("AIShip")

.construct(function()
{
  this.target = null;
  this.maxTurnSpeed = 1;
  this.optimalDistance = 400;
  this.giveUpTimer = 5;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;
  var ship = this._entity.Ship;

  this.update = function(dt)
  {
    if (!this.target || !TANK.main.getChild(this.target._id))
    {
      this.giveUpTimer -= dt;
      if (this.giveUpTimer < 0)
        this._entity.AIShip.removeBehavior("AIAttack");
      return;
    }

    // Get direction to player
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetVel = this.target.Velocity;
    targetPos[0] += targetVel.x * 1;
    targetPos[1] += targetVel.y * 1;
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, targetPos);
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);

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

    this._entity.Weapons.aimAt(targetPos);

    if (targetDist > this.optimalDistance)
    {
      ship.startUp();
    }
    else
    {
      ship.stopUp();
    }

    // Shoot randomly
    if (Math.random() < 0.05 && this._entity.Weapons.aimingAtTarget && targetDist < 1500)
    {
      this._entity.Weapons.shoot();
    }

    // Cap movement
    if (Math.abs(v.r) > this.maxTurnSpeed)
      v.r *= 0.95;
  };
});