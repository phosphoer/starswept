this.Action = this.Action || {};

Action.AITravel = function(e)
{
  var t = e.Pos2D;
  var ship = e.Ship;
  var targetDir = Math.atan2(0 - t.y, 0 - t.x);
  ship.heading = targetDir;
  ship.setSpeedPercent(1);

  this.update = function(dt)
  {
  };
};