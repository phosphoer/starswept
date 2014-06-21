(function()
{

TANK.registerComponent("AIFaction")
.includes("Faction")
.construct(function()
{
  this.currentCaptureTarget = null;
  this.projects = [];

  this.idleShipScanTime = 5;
  this.idleShipScanTimer = 0;
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

  this.update = function(dt)
  {
    // Find idle ships
    this.idleShipScanTimer -= dt;
    if (this.idleShipScanTimer <= 0)
    {
      this.idleShips = [];
      this.idleShipScanTimer = this.idleShipScanTime;
      var ships = TANK.main.getChildrenWithComponent("AIShip");
      for (var i in ships)
      {
        if (ships[i].AIShip.idle)
          this.idleShips.push(ships[i]);
      }
    } 

    // If we don't have a current capture target, find one and create a project for it
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
          var captureProject = new AIProject(this);
          captureProject.target = e;
          captureProject.order = "AIDefend";
          captureProject.buildCombatGroup(threat);
          captureProject.acquireShips();
          captureProject.completeCondition = function()
          {
            return e.ControlPoint.faction === faction;
          };
          this.projects.push(captureProject);
          break;
        }
      }
    }

    // Update existing projects
    for (var i = 0; i < this.projects.length; ++i)
    {
      this.projects[i].update(dt);
      if (this.projects[i].complete)
        this.projects[i] = null;
    }
    this.projects = this.projects.filter(function(val) {return val !== null;});
  };
});

function AIProject(aiFaction)
{
  this.target = null;
  this.order = "";
  this.shipsQueued = 0;
  this.shipsRequired = [];
  this.ready = false;
  this.inProgress = false;
  this.complete = false;

  this.completeCondition = function()
  {
    return false;
  };

  this.buildCombatGroup = function(num)
  {
    this.shipsRequired = [];
    for (var i = 0; i < num; ++i)
    {
      var ship = {type: "frigate"};
      this.shipsRequired.push(ship);
    }
  };

  this.acquireShips = function()
  {
    // Assign any existing idle ships
    for (var i = 0; i < this.shipsRequired.length; ++i)
    {
      for (var j = 0; j < aiFaction.idleShips.length; ++j)
      {
        if (aiFaction.idleShips[j].Ship.shipData.type === this.shipsRequired[i].type)
        {
          this.shipsRequired[i].assignedShip = aiFaction.idleShips[j];
          aiFaction.idleShips[j] = null;
          break;
        }
      }
    }
    console.log("AI: Found " + aiFaction.idleShips.length + " idle ships...");
    aiFaction.idleShips = aiFaction.idleShips.filter(function(val) {return val !== null;});

    // Queue ships for construction to fill remaining places
    var that = this;
    for (var i = 0; i < this.shipsRequired.length; ++i)
    {
      if (!this.shipsRequired[i].assignedShip)
      {
        ++this.shipsQueued;
        console.log("AI: Queued ship for build...");
        aiFaction._entity.Faction.buyShip(this.shipsRequired[i].type, function(e, requiredShip)
        {
          console.log("AI: ...Ship for target complete");
          requiredShip.assignedShip = e;
        }, this.shipsRequired[i]);
      }
    }
  };

  this.update = function(dt)
  {
    // Check if the project is ready
    if (!this.inProgress && this.shipsRequired.length > 0)
    {
      this.ready = true;
      for (var i = 0; i < this.shipsRequired.length; ++i)
      {
        if (!this.shipsRequired[i].assignedShip)
          this.ready = false;
      }
    }

    // Once the project is ready, assign allocated ships to the target
    if (this.ready && !this.inProgress)
    {
      this.inProgress = true;
      for (var i = 0; i < this.shipsRequired.length; ++i)
      {
        this.shipsRequired[i].assignedShip.AIShip.giveContextOrder(this.target);
      }
    }

    // Check if the project is complete
    this.complete = this.completeCondition();
    if (this.complete)
    {
      // If so, cancel all orders for the assigned ships
      for (var i = 0; i < this.shipsRequired.length; ++i)
      {
        var item = this.shipsRequired[i];
        if (item.assignedShip && TANK.main.getChild(item.assignedShip._id))
        {
          item.assignedShip.AIShip.clearOrders();
        }
      }
    }
  };
};

})();