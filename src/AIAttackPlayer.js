TANK.registerComponent('AIAttackPlayer')
.includes(['Ship', 'RemoveOnLevelChange'])
.initialize(function()
{
  this.update = function(dt)
  {
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = TANK.main.Game.player;
    this._entity.removeComponent('AIAttackPlayer');
  };
});