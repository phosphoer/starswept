TANK.registerComponent('AIPolice')
.includes(['Ship', 'RemoveOnLevelChange'])
.construct(function()
{
  this.target = null;
  this.scanDistance = 500;
  this.patienceTime = 10;
  this.patienceTimer = 0;
  this.scanTime = 5;
  this.scanTimer = 0;

  this.gaveFirstWarning = false;
  this.gaveSecondWarning = false;
  this.waitingForStop = false;
  this.waitingForScan = false;
  this.done = false;
})
.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;

  this.listenTo(this._entity, 'aggro', function(owner)
  {
    TANK.main.Game.addEventLog('<Police>: Prepare to die, criminal!');
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = owner;
    this._entity.removeComponent('AIPolice');
  });

  this.attack = function()
  {
    TANK.main.Game.addEventLog('<Police>: Prepare to die, criminal!');
    TANK.main.Game.addStory('You got into a tangle with the police.');
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = this.target;
    this._entity.removeComponent('AIPolice');
  };

  this.update = function(dt)
  {
    this.target = TANK.main.getChildrenWithComponent('Player');
    if (!this.target)
      return;
    this.target = this.target[Object.keys(this.target)[0]];

    // Get direction to target
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetVelocity = [this.target.Velocity.x, this.target.Velocity.y];
    targetPos = TANK.Math2D.add(targetPos, TANK.Math2D.scale(targetVelocity, 1));
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // Finish scanning
    if (this.done)
    {
      ship.setSpeedPercent(0.5);
      return;
    }

    // Aim at target
    ship.heading = targetDir;

    // Move towards target if not close enough
    if (targetDist < this.scanDistance)
      ship.setSpeedPercent(0);
    else if (targetDist < this.scanDistance * 2)
      ship.setSpeedPercent(0.5);
    else if (targetDist >= this.scanDistance * 2)
      ship.setSpeedPercent(1);

    // Send warnings to target
    if (targetDist < this.scanDistance * 2)
    {
      if (!this.gaveFirstWarning)
      {
        TANK.main.Game.addEventLog('<Police>: Pilot, please stop your ship now for a random scan.');
        this.gaveFirstWarning = true;
        this.waitingForStop = true;
        this.patienceTimer = 0;
        this.scanTimer = 0;
      }
    }

    // Count down timer while waiting for player to stop
    if (this.waitingForStop)
    {
      this.patienceTimer += dt;

      // Check if player has stopped
      if (targetDist < this.scanDistance)
      {
        this.waitingForScan = true;
        this.scanTimer += dt;

        if (this.scanTimer >= this.scanTime)
        {
          if (Flags.wanted)
          {
            this.waitingForScan = false;
            this.waitingForStop = false;
            this.done = true;
            this.attack();
          }
          else
          {
            TANK.main.Game.addEventLog('<Police>: Alright, you\'re free to go.');
            this.waitingForScan = false;
            this.waitingForStop = false;
            this.done = true;
          }
        }
      }

      if (this.target.Ship.desiredSpeed < 0.01)
      {
        this.waitingForScan = true;
      }
      else
      {
        this.waitingForScan = false;
      }

      // If we run out of patience
      if (this.patienceTimer >= this.patienceTime && !this.waitingForScan)
      {
        // Give a second warning
        if (this.gaveFirstWarning && !this.gaveSecondWarning)
        {
          TANK.main.Game.addEventLog('<Police>: This is your last warning, cut your engines now.');
          this.gaveSecondWarning = true;
          this.patienceTimer = 0;
        }
        // After second warning, attack
        else if (this.gaveFirstWarning && this.gaveSecondWarning)
        {
          TANK.main.Game.addEventLog('<Police>: Time\'s up.');
          this.attack();
        }
      }
    }
  };
});