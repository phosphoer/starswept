TANK.registerComponent("AIShip")

.interfaces("Selectable")

.requires("Ship, Selectable")

.construct(function()
{
  this.team = 0;
  this.behaviors = {};
  this.numBehaviors = 0;
})

.initialize(function()
{
  var t = this.parent.Pos2D;
  var v = this.parent.Velocity;
  var ship = this.parent.Ship;

  this.target = TANK.getEntity("Player");

  this.OnSelected = function()
  {
    TANK.Game.barCommands.splice(0, TANK.Game.barCommands.length);
    TANK.Game.barCommands.push({name: "Follow Me", id: "follow", entity: this.parent});
    TANK.Game.barCommands.push({name: "Self Destruct", id: "destruct", entity: this.parent});
  };

  this.OnContextButton = function(command)
  {
    if (command.id === "follow")
    {
      this.clearBehaviors();
      this.addBehavior("AIFollow");
      this.parent.AIFollow.target = TANK.getEntity("Player");
    }
    else if (command.id === "destruct")
    {
      TANK.removeEntity(this.parent);
    }
  };

  this.addBehavior = function(name)
  {
    if (this.parent[name])
      return;
    this.parent.addComponent(name);
    this.behaviors[name] = true;
    ++this.numBehaviors;
  };

  this.removeBehavior = function(name)
  {
    if (!this.parent[name])
      return;
    this.parent.removeComponent(name);
    delete this.behaviors[name];
    --this.numBehaviors;
  };

  this.clearBehaviors = function()
  {
    for (var i in this.behaviors)
      this.removeBehavior(i);
  };

  this.addEventListener("OnEnterFrame", function(dt)
  {
  });
})

.destruct(function()
{
  var player = TANK.getEntity("Player");
  if (this.parent.Selectable.selected && player)
    player.Player.fillCommands();
});