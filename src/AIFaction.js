TANK.registerComponent("AIFaction")

.includes("Faction")

.construct(function()
{
})

.initialize(function()
{
  var faction = this._entity.Faction;

  this.update = function(dt)
  {
    if (faction.money > 30)
    {
      // Pick a control point to buy a ship at
      var controlPoint = faction.controlPoints[Math.floor(Math.random() * faction.controlPoints.length)];
      controlPoint.buyShip();
    }
  };
});