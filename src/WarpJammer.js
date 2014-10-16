TANK.registerComponent('WarpJammer')
.includes(['Life', 'RemoveOnLevelChange'])
.initialize(function()
{
  this._entity.Life.life = 60;
});