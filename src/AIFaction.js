TANK.registerComponent("AIFaction")

.requires("Faction")

.construct(function()
{
})

.initialize(function()
{
  var faction = this.parent.Faction;

  this.addEventListener("OnEnterFrame", function(dt)
  {
    if (faction.money > 30)
    {
      // Pick a control point to buy a ship at
      var controlPoint = faction.controlPoints[Math.floor(Math.random() * faction.controlPoints.length)];
      controlPoint.buyShip();
    }
  });
});