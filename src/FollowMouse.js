TANK.registerComponent('FollowMouse')
.includes('Pos2D')
.initialize(function()
{
  this.update = function(dt)
  {
    this._entity.Pos2D.x = TANK.main.Game.mousePosWorld[0];
    this._entity.Pos2D.y = TANK.main.Game.mousePosWorld[1];
  };
});