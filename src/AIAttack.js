TANK.registerComponent('AIAttack')
.includes(['Ship', 'RemoveOnLevelChange'])
.construct(function()
{
  this.target = null;
  this.attackDistanceMin = 450;
  this.attackDistanceMax = 600;
  this.giveUpTimer = 5;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;
  var ship = this._entity.Ship;

  //
  // Attempt to fire guns at a given target, if it is in our sights
  //
  this.fireGunsAtTarget = function(target)
  {
    var targetPos = [target.Pos2D.x, target.Pos2D.y];
    var targetVelocity = [target.Velocity.x, target.Velocity.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // Check each gun and see if it is facing the target and in range
    // If so, fire
    for (var i in this._entity.Weapons.guns)
    {
      var guns = this._entity.Weapons.guns[i];
      for (var j = 0; j < guns.length; ++j)
      {
        if (guns[j].reloadTimer > 0)
          continue;
        var distFromGun = TANK.Math2D.pointDistancePoint(targetPos, guns[j].worldPos);
        var targetVec = TANK.Math2D.subtract(targetPos, guns[j].worldPos);
        targetVec = TANK.Math2D.scale(targetVec, 1 / distFromGun);
        var gunDir = [Math.cos(guns[j].angle + t.rotation), Math.sin(guns[j].angle + t.rotation)];
        var dot = TANK.Math2D.dot(gunDir, targetVec);
        if (Math.abs(1 - dot) < 0.05 && distFromGun < guns[j].range)
        {
          this._entity.Weapons.fireGun(j, i);
        }
      }
    }
  };

  //
  // Update
  //
  this.update = function(dt)
  {
    // Check if target still exists
    if (!this.target || !TANK.main.getChild(this.target._id))
    {
      this.giveUpTimer -= dt;
      if (this.giveUpTimer < 0)
        return true;
    }

    // Set IFF
    ship.iff = !this.target.Ship.iff;

    // Get direction to target
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetVelocity = [this.target.Velocity.x, this.target.Velocity.y];
    targetPos = TANK.Math2D.add(targetPos, TANK.Math2D.scale(targetVelocity, 1));
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // Shoot
    this.fireGunsAtTarget(this.target);

    // We should move to engage the target
    // Depending on the layout of our ship, this either means attempting
    // to line up a broadside, or aligning our fore-guns with the target
    // If we are too close we should turn to get farther away
    if (targetDist < this.attackDistanceMin)
    {
      ship.heading = targetDir + Math.PI;
      ship.setSpeedPercent(0.5);
    }
    // We want to get to a minimum distance from the target before attempting to aim at it
    else if (targetDist > this.attackDistanceMax)
    {
      ship.heading = targetDir;
      ship.setSpeedPercent(1);
    }
    else
    {
      // Aim at a right angle to the direction to the target, to target with a broadside
      ship.heading = targetDir + ship.shipData.optimalAngle;

      // Slow down to half speed while circling
      ship.setSpeedPercent(0.5);
    }
  };
});
