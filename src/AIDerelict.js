TANK.registerComponent('AIDerelict')
.includes(['Ship', 'RemoveOnLevelChange'])
.initialize(function()
{
  this.listenTo(TANK.main, 'derelictleave', function()
  {
    this._entity.removeComponent('AIDerelict');
    this._entity.addComponent('AICivilian');
  });
});