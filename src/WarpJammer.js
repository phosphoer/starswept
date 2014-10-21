TANK.registerComponent('WarpJammer')
.includes(['Life', 'RemoveOnLevelChange'])
.initialize(function()
{
  this._entity.Life.life = 90;

  this.listenTo(TANK.main, 'killwarpjammer', function()
  {
    this._entity._parent.removeChild(this._entity);
  });
});