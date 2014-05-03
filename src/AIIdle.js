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

    // Stop moving
    ship.stopUp();
    ship.stopLeft();
    ship.stopRight();
    ship.stopDown();

    // Decelarate
    v.x *= 0.95;
    v.y *= 0.95;
    v.r *= 0.95;
  };

  this.stop = function()
  {
  };
};
