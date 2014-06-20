TANK.registerComponent("AIFaction")

.includes("Faction")

.construct(function()
{
  this.currentCaptureTarget = null;
  this.captureReady = false;
  this.shipsQueuedForCapture = 0;
  this.shipsAssignedForCapture = [];
  this.idleShips = [];
})

.initialize(function()
{
  var faction = this._entity.Faction;
  var that = this;

  this.calculateControlPointThreat = function(e)
  {
    // Find how many enemy ships are near the planet
    var ships = TANK.main.getChildrenWithComponent("Ship");
    var numShips = 0;
    for (var i in ships)
    {
      var dist = TANK.Math2D.pointDistancePoint([e.Pos2D.x, e.Pos2D.y], [ships[i].Pos2D.x, ships[i].Pos2D.y]);
      if (dist < 700 && ships[i].Ship.faction.team !== faction.team)
        ++numShips;
    }

    return Math.max(Math.round(numShips * 1.5), 1);
  };

  this.assignShipsToCaptureTarget = function(num)
  {
    // Assign any existing idle ships
    for (var i = 0; i < this.idleShips.length; ++i)
    {
      this.shipsAssignedForCapture.push(this.idleShips[i]);
      this.idleShips[i] = null;
    }
    console.log("AI: Assigned " + this.idleShips.length + " to target...");
    this.idleShips = this.idleShips.filter(function(val) {return val !== null;});

    // Queue ships for construction to fill remaining places
    if (this.shipsAssignedForCapture.length < num)
    {
      for (var i = 0; i < num - this.shipsAssignedForCapture.length; ++i)
      {
        ++this.shipsQueuedForCapture;
        console.log("AI: Queued ship for build...");
        faction.buyShip(function(e)
        {
          console.log("AI: ...Ship for target complete");
          that.shipsAssignedForCapture.push(e);
          if (that.shipsAssignedForCapture.length === num)
            that.captureReady = true;
        });
      }
    }


  };

  this.update = function(dt)
  {
    // If we don't have a current capture target, find one and assign ships to it
    if (!this.currentCaptureTarget)
    {
      console.log("AI: No capture target, picking a new one...");
      var controlPoints = TANK.main.getChildrenWithComponent("ControlPoint");
      for (var i in controlPoints)
      {
        var e = controlPoints[i];
        if (!e.ControlPoint.faction || e.ControlPoint.faction.team !== faction.team)
        {
          console.log("AI: Found capture target, assigning ships...");
          this.currentCaptureTarget = e;
          var threat = this.calculateControlPointThreat(this.currentCaptureTarget);
          this.assignShipsToCaptureTarget(threat);
          break;
        }
      }
    }

    // Once we have ships assigned to the task, give the order
    if (this.captureReady)
    {
      this.captureReady = false;
      for (var i = 0; i < this.shipsAssignedForCapture.length; ++i)
      {
        this.shipsAssignedForCapture[i].AIShip.giveContextOrder(this.currentCaptureTarget);
      }
    }
  };
});
