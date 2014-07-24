TANK.registerComponent("Faction")

.construct(function()
{
  this.team = 0;
  this.color = "#666";
  this.money = 10;
  this.controlPoints = [];
  this.shipsToBuy = [];
})

.initialize(function()
{
  this.listenTo(TANK.main, "levelEnd", function()
  {
    TANK.main.removeChild(this._entity);
  });
  
  this.listenTo(this._entity, "buyship", function(ship, callback, data)
  {
    this.buyShip(ship, callback, data);
  });

  this.buyShip = function(type, callback, data)
  {
    // Find a control point with small queue
    var shortestQueueLength = Infinity;
    var chosenControlPoint = null;
    for (var i = 0; i < this.controlPoints.length; ++i)
    {
      if (this.controlPoints[i].queuedShips.length < shortestQueueLength)
      {
        shortestQueueLength = this.controlPoints[i].queuedShips.length;
        chosenControlPoint = this.controlPoints[i];
      }
    }

    if (chosenControlPoint) 
    {
      if (!chosenControlPoint.buyShip(type, callback, data))
      {
        this._entity.dispatchTimed(5, "buyship", type, callback, data);
      }
    }
  };

  this.addControlPoint = function(controlPoint)
  {
    controlPoint.faction = this;
    this.controlPoints.push(controlPoint);
  };

  this.removeControlPoint = function(controlPoint)
  {
    for (var i = 0; i < this.controlPoints.length; ++i)
    {
      if (this.controlPoints[i] === controlPoint)
      {
        this.controlPoints.splice(i, 1);
        break;
      }
    }
  };
});