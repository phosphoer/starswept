TANK.registerComponent('AIShop')
.includes(['Pos2D', 'RemoveOnLevelChange', 'TriggerRadius'])
.construct(function()
{
  this.availableItems = [];
  this.items = [];
  this.numItems = 3;
})
.initialize(function()
{
  this._entity.TriggerRadius.radius = 500;
  this._entity.TriggerRadius.removeOnTrigger = false;

  //
  // Chose which items to sell
  //
  for (var i = 0; i < this.numItems; ++i)
  {
    var weights = this.availableItems.map(function(val) {return val.probability;});
    var chosenIndex = TANK.main.Game.randomWeighted(weights);
    var chosenItem = this.availableItems[chosenIndex];
    this.items.push(chosenItem.name);
  }

  //
  // Listen for trigger
  //
  this.listenTo(this._entity, 'triggerRadiusEnter', function()
  {
    TANK.main.Game.makeShopAvailable(this.items);
  });
  this.listenTo(this._entity, 'triggerRadiusLeave', function()
  {
    TANK.main.Game.makeShopUnavailable();
  });
});