(function()
{

TANK.registerComponent("AIFaction3")
.includes("Faction")
.construct(function()
{
  this.name = "trevor";

  this.idleShipScanTime = 5;
  this.idleShipScanTimer = 0;
  this.idleShips = [];
})
.initialize(function()
{
  var faction = this._entity.Faction;
  var that = this;

  this.calculateThreatAtPos = function(pos, radius, targetFaction)
  {
    var ships = TANK.main.getChildrenWithComponent("Ship");
    var threat = 0;
    for (var i in ships)
    {
      if (targetFaction && ships[i].Ship.faction !== targetFaction)
        continue;
      else if (!targetFaction && ships[i].Ship.faction === faction)
        continue;

      var dist = TANK.Math2D.pointDistancePoint(pos, [ships[i].Pos2D.x, ships[i].Pos2D.y]);
      if (dist < radius)
        threat += ships[i].Ship.shipData.threat;
    }

    return threat;
  };

  this.findIdleShips = function()
  {
    this.idleShips = [];
    var ships = TANK.main.getChildrenWithComponent("AIShip");
    for (var i in ships)
    {
      if (ships[i].Ship.faction === faction && ships[i].AIShip.idle)
        this.idleShips.push(ships[i]);
    }
  };

  this.say = function(message)
  {
    console.log("AI " + this.name + "(" + faction.team + "): " + message);
  };

  this.update = function(dt)
  {
    // Find idle ships
    this.idleShipScanTimer -= dt;
    if (this.idleShipScanTimer <= 0)
    {
      this.idleShipScanTimer = this.idleShipScanTime;
      this.findIdleShips();
    } 


  };
});

})();