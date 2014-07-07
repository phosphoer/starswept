(function()
{

TANK.registerComponent("AIFaction2")
.includes("Faction")
.construct(function()
{
  this.name = "new";
  this.projects = [];

  this.idleShipScanTime = 5;
  this.idleShipScanTimer = 0;
  this.idleShips = [];

  this.attackTarget = null;
  this.attackStrength = 1;
  this.attackTime = 10;
  this.attackTimer = 0;

  this.defenseIncreaseTimer = 25;
  this.defenseTime = 5;
  this.defenseTimer = 0;
  this.defenseStrength = 1;
  this.defenseProjects = {};
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
    // We should have a defense project for each owned control point
    this.defenseTimer -= dt;
    if (this.defenseTimer <= 0)
    {
      this.defenseTimer = this.defenseTime;
      for (var i = 0; i < faction.controlPoints.length; ++i)
      {
        var cp = faction.controlPoints[i];
        
        // If there isn't a project for this point, create one
        if (!this.defenseProjects[cp._entity._id])
        {
          var project = new AIProject(this);
          project.target = cp._entity;
          project.buildCombatGroup(this.defenseStrength);
          project.acquireShips();
          var that = this;
          project.completeCondition = function()
          {
            if (!TANK.main.getChild(this.target._id) || this.target.ControlPoint.faction !== faction)
            {
              delete that.defenseProjects[this.target._id];
              return true;
            }
            return false;
          };
          this.projects.push(project);
          this.defenseProjects[cp._entity._id] = project;
        }
        // Otherwise, update the project with the current defense strength
        else
        {
          this.defenseProjects[cp._entity._id].buildShipsForThreat(this.defenseStrength);
          this.defenseProjects[cp._entity._id].refresh();
        }
      }
    }

    // Increase defense strength over time
    this.defenseIncreaseTimer -= dt;
    if (this.defenseIncreaseTimer < 0)
    {
      var choice = Math.random();
      if (choice < 0.5)
        this.defenseStrength += Math.random() * 5;
      else
        this.defenseStrength += 10 * (Math.random() * 3.1);
      this.defenseIncreaseTimer = (15 + Math.random() * 15) * this.defenseStrength;
    }

    // Find idle ships
    this.idleShipScanTimer -= dt;
    if (this.idleShipScanTimer <= 0)
    {
      this.idleShipScanTimer = this.idleShipScanTime;
      this.findIdleShips();
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