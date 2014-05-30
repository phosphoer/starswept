this.Action = this.Action || {};

Action.AIIdle = function(e)
{
  this._blocking = true;

  this.start = function()
  {
  };

  this.update = function(dt)
  {
    var v = e.Velocity;
    var ship = e.Ship;

    // Decelarate
    ship.desiredSpeed = 0;
  };

  this.stop = function()
  {
  };
};
