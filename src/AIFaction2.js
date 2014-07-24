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

  this.attackProject = null;
  this.attackTarget = null;
  this.attackStrength = 1;
  this.attackTime = 40;
  this.attackTimer = 0;

  this.defenseIncreaseTimer = 25;
  this.defenseTime = 25;
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
          this.say('defense project created');
          var project = new AIProject(this);
          project.target = cp._entity;
          project.buildCombatGroup(this.defenseStrength);
          project.acquireShips();
          this.projects.push(project);
          this.defenseProjects[cp._entity._id] = project;

          // End the project if the control point no longer exists
          var that = this;
          project.completeCondition = function()
          {
            if (!TANK.main.getChild(this.target._id) || this.target.ControlPoint.faction !== faction)
            {
              that.say('defense project over');
              delete that.defenseProjects[this.target._id];
              return true;
            }
            return false;
          };
        }
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
      this.defenseIncreaseTimer = (60 + Math.random() * 60) * this.defenseStrength;
      this.defenseStrength = Math.round(this.defenseStrength);
      this.say('increasing defenses to ' + this.defenseStrength);
    }

    // Find an attack target with low defense
    if (!this.attackTarget)
    {
      this.say('searching for target');
      var controlPoints = TANK.main.getChildrenWithComponent("ControlPoint");
      var minThreat = Infinity;
      for (var i in controlPoints)
      {
        var e = controlPoints[i];
        if (!e.ControlPoint.faction || e.ControlPoint.faction.team !== faction.team)
        {
          var threat = this.calculateThreatAtPos([e.Pos2D.x, e.Pos2D.y], 600);
          if (!e.ControlPoint.faction)
            threat = -1;
          if (threat < minThreat)
          {
            minThreat = threat;
            this.attackTarget = e;
          }
        }
      }
      
      if (this.attackTarget)
        this.say('target found'); 
    }
    // Make an attack project if we don't have one
    else if (this.attackTarget && !this.attackProject)
    {
      this.say('attack project created');
      this.attackProject = new AIProject(this);
      this.attackProject.target = this.attackTarget;
      var that = this;
      this.attackProject.completeCondition = function()
      {
        var complete = that.attackTarget.ControlPoint.faction === faction;
        if (complete) 
        {
          that.say('attack project complete');
          that.attackProject = null;
          that.attackTarget = null;
        }
        return complete;
      };
      this.projects.push(this.attackProject);
    }
    // Update attack project
    else if (this.attackTarget && this.attackProject)
    {
      this.attackTimer += dt;
      if (this.attackTimer > this.attackTime)
      {
        this.say('attack group queued');
        this.attackTimer = 0;
        this.attackProject.buildShipsForThreat(this.attackStrength);
        this.attackProject.refresh();
        if (Math.random() < 0.5)
          this.attackStrength += Math.random() * 5;
        else
          this.attackStrength += 10 * (Math.random() * 3.1);
        this.attackTime *= 1.1;
        this.attackTime += Math.random() * 20;
        this.attackTime = Math.round(this.attackTime);
        this.attackStrength = Math.round(this.attackStrength);
        this.say('next attack in ' + this.attackTime + ' seconds with strength ' + this.attackStrength);
      }
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