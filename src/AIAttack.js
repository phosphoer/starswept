this.Action = this.Action || {};

Action.AIAttack = function(e, target)
{
  this.target = target;
  this.attackDistanceMin = 350;
  this.attackDistanceMax = 550;
  this.giveUpTimer = 5;
  this._blocking = true;

  this.start = function()
  {
  };

  this.update = function(dt)
  {
    var t = e.Pos2D;
    var v = e.Velocity;
    var ship = e.Ship;

    // Check if target still exists
    if (!this.target || !TANK.main.getChild(this.target._id))
    {
      this.giveUpTimer -= dt;
      if (this.giveUpTimer < 0)
        this._done = true;
      return;
    }

    // Get direction to player
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // If we are aggressive, we should move to engage the target
    // Depending on the layout of our ship, this either means attempting
    // to line up a broadside, or aligning our fore-guns with the target
    if (e.AIShip.aggressive)
    {
      // If we are too close we should turn to get farther away
      if (targetDist < this.attackDistanceMin)
      {
        ship.heading = targetDir + Math.PI;
        ship.setSpeedPercent(1);
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
        ship.heading = targetDir + Math.PI / 2;

        // Slow down to half speed while circling
        ship.setSpeedPercent(0.5);
      }
    }

    // Check each gun and see if it is facing the target and in range
    // If so, fire
    for (var i in e.Weapons.guns)
    {
      var guns = e.Weapons.guns[i];
      for (var j = 0; j < guns.length; ++j)
      {
        if (guns[j].reloadTimer > 0)
          continue;
        var targetVec = TANK.Math2D.subtract(targetPos, [t.x, t.y]);
        targetVec = TANK.Math2D.scale(targetVec, 1 / targetDist);
        var gunDir = [Math.cos(guns[j].angle + t.rotation), Math.sin(guns[j].angle + t.rotation)];
        var dot = TANK.Math2D.dot(gunDir, targetVec);
        if (Math.abs(1 - dot) < 0.05 && targetDist < guns[j].range)
        {
          e.Weapons.fireGun(j, i);
        }
      }
    }
  };

  this.stop = function()
  {
  };
};