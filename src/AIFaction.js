TANK.registerComponent("AIFaction")

.includes("Faction")

.construct(function()
{
  this.numShips = 0;
})

.initialize(function()
{
  var faction = this._entity.Faction;

  this.update = function(dt)
  {
    if (faction.money > 30 && this.numShips < 3 && 0)
    {
      // Pick a control point to buy a ship at
      var controlPoint = faction.controlPoints[Math.floor(Math.random() * faction.controlPoints.length)];
      controlPoint.buyShip("frigate");
      ++this.numShips;
    }
  };
});