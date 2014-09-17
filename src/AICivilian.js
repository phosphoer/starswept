TANK.registerComponent('AICivilian')
.includes(['Ship', 'RemoveOnLevelChange'])
.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;
  var targetDir = Math.atan2(0 - t.y, 0 - t.x);
  ship.heading = targetDir;
  ship.setSpeedPercent(0.5);

  this.listenTo(this._entity, 'aggro', function(owner)
  {
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = owner;
    this._entity.removeComponent('AICivilian');
  });
});