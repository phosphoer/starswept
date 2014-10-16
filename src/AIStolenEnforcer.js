TANK.registerComponent('AIStolenEnforcer')
.includes(['Ship', 'RemoveOnLevelChange'])
.initialize(function()
{
  this.listenTo(this._entity, 'damaged', function()
  {
    if (this._entity.Ship.health <= 0.2 && this._entity.Ship.health >= 0.0)
    {
      this._entity.removeComponent('AIAttack');
      TANK.main.Game.addEventLog('Puffs of oxygen exit the ship as the pirates take to the escape pods. Looks like your work is done.');
      if (Flags['wanted'])
      {
        Flags['wanted'] = false;
        TANK.main.Game.addEventLog('Wanted status cleared.');
      }
      else
      {
        TANK.main.Game.unlockShip('enforcer');
      }
    }
  });
});