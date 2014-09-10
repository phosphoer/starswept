TANK.registerComponent('TriggerRadius')

.includes(['Pos2D'])

.construct(function()
{
  this.radius = 1000;
  this.events = [];
  this.removeOnTrigger = true;
})

.serialize(function(serializer)
{
  serializer.property(this, 'radius', 1000);
  serializer.property(this, 'events', []);
  serializer.property(this, 'removeOnTrigger', true);
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.update = function(dt)
  {
    // Check if player comes within a certain range
    var player = TANK.main.Game.player;
    if (TANK.Math2D.pointDistancePoint([player.Pos2D.x, player.Pos2D.y], [t.x, t.y]) < this.radius)
    {
      var weights = this.events.map(function(ev) {return ev.probability;});
      var chosenIndex = TANK.main.Game.randomWeighted(weights);
      var chosenEvent = this.events[chosenIndex];
      TANK.main.Game.triggerEvent(chosenEvent.name);

      if (this.removeOnTrigger)
        this._entity._parent.removeChild(this._entity);
    }
  };
});