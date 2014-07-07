(function()
{

TANK.registerComponent("AIFaction")
.includes("Faction")
.construct(function()
{
  this.name = "original";
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

    // If we don't have a current capture target, find one and create a project for it
    if (!this.currentCaptureTarget)
    {
      this.say("No capture target, picking a new one...");
      var controlPoints = TANK.main.getChildrenWithComponent("ControlPoint");
      for (var i in controlPoints)
      {
        var e = controlPoints[i];
        if (!e.ControlPoint.faction || e.ControlPoint.faction.team !== faction.team)
        {
          this.say("Found capture target, assigning ships...");
          this.currentCaptureTarget = e;
          var pos = [this.currentCaptureTarget.Pos2D.x, this.currentCaptureTarget.Pos2D.y];
          var threat = this.calculateThreatAtPos(pos, 700, e.ControlPoint.faction);
          var captureProject = new AIProject(this);
          captureProject.target = e;
          captureProject.buildCombatGroup((threat + 1) * 1.5);
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

})();