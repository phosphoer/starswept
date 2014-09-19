TANK.registerComponent('AIDerelict')
.includes('Ship')
.initialize(function()
{
  this.listenTo(TANK.main, 'derelictleave', function()
  {
    this._entity.addComponent('AICivilian');
  });
});