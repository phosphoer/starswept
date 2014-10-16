TANK.registerComponent('TriggerRadius')

.includes(['Pos2D'])

.construct(function()
{
  this.radius = 1000;
  this.events = [];
  this.removeOnTrigger = true;
  this.triggered = false;
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
    if (TANK.Math2D.pointDistancePoint([player.Pos2D.x, player.Pos2D.y], [t.x, t.y]) < this.radius && !this.triggered)
    {
      this.triggered = true;

      if (this.events.length)
      {
        var weights = this.events.map(function(ev) {return ev.probability;});
        var chosenIndex = TANK.main.Game.randomWeighted(weights);
        var chosenEvent = this.events[chosenIndex];
        TANK.main.Game.triggerEvent(chosenEvent.name);
      }

      this._entity.dispatch('triggerradius');

      if (this.removeOnTrigger)
        this._entity.removeComponent(this._name);
    }
  };
});