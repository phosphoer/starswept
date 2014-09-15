TANK.registerComponent('RemoveOnLevelChange')
.initialize(function()
{
  this.listenTo(TANK.main, 'locationchange', function()
  {
    TANK.main.removeChild(this._entity);
  });
});
