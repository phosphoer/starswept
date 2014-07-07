function AIProject(aiFaction)
{
  this.target = null;
  this.shipsQueued = 0;
  this.shipsRequired = [];
  this.ready = false;
  this.inProgress = false;
  this.complete = false;

  var faction = aiFaction._entity.Faction;

  this.completeCondition = function()
  {
    return false;
  };

  this.buildCombatGroup = function(threat)
  {
    var tries = 50;
    var selectedShip = null;
    do
    {
      --tries;

      // Find the ship with the closest threat level
      selectedShip = null;
      var highestThreat = 0;
      for (var i in Ships)
      {
        var shipData = new Ships[i];
        if (shipData.threat <= threat && shipData.threat > highestThreat)
        {
          highestThreat = shipData.threat;
          selectedShip = i;
        }
      }

      // Add the selected ship
      if (selectedShip)
      {
        threat -= highestThreat;
        this.shipsRequired.push({type: selectedShip});
      }
    } while (threat > 0 && selectedShip);
  };

  this.buildShipsForThreat = function(threat)
  {
    // Find current strength
    var currentStrength = 0;
    for (var i = 0; i < this.shipsRequired.length; ++i)
    {
      var shipData = new Ships[this.shipsRequired[i].type]();
      currentStrength += shipData.threat;
    }

    // Add ships to match threat
    if (currentStrength < threat)
    {
      var diff = threat - currentStrength;
      this.buildCombatGroup(diff);
    }
  };

  this.acquireShips = function()
  {
    // Assign any existing idle ships
    for (var i = 0; i < this.shipsRequired.length; ++i)
    {
      for (var j = 0; j < aiFaction.idleShips.length; ++j)
      {
        if (!this.shipsRequired[i].assignedShip && aiFaction.idleShips[j] && aiFaction.idleShips[j].Ship.shipData.type === this.shipsRequired[i].type)
        {
          this.shipsRequired[i].assignedShip = aiFaction.idleShips[j];
          aiFaction.idleShips[j] = null;
          break;
        }
      }
    }
    aiFaction.say("Found " + aiFaction.idleShips.length + " idle ships...");
    aiFaction.idleShips = aiFaction.idleShips.filter(function(val) {return val !== null;});

    // Queue ships for construction to fill remaining places
    var that = this;
    for (var i = 0; i < this.shipsRequired.length; ++i)
    {
      if (!this.shipsRequired[i].assignedShip)
      {
        ++this.shipsQueued;
        aiFaction.say("Queued ship for build...");
        aiFaction._entity.Faction.buyShip(this.shipsRequired[i].type, function(e, requiredShip)
        {
          aiFaction.say("...Ship for target complete");
          requiredShip.assignedShip = e;
        }, this.shipsRequired[i]);
      }
    }
  };

  this.refresh = function()
  {
    this.inProgress = false;
    this.ready = false;
    this.acquireShips();
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
    this.complete = this.completeCondition.call(this);
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