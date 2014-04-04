TANK.registerComponent("AIShip")

.interfaces("Draggable, Droppable")

.requires("Ship, Draggable")

.construct(function()
{
  this.behaviors = {};
  this.numBehaviors = 0;
})

.initialize(function()
{
  var t = this.parent.Pos2D;
  var v = this.parent.Velocity;
  var ship = this.parent.Ship;

  // Damage response
  this.OnDamaged = function(damage, dir, owner)
  {
    if (owner && owner.Ship && owner.Ship.team != ship.team)
    {
      this.addBehavior("AIAttack");
      this.parent.AIAttack.target = owner;
    }
  };

  this.OnDragEnd = function(dest)
  {
    if (dest && dest.Ship)
    {
      if (dest.Ship.team != ship.team)
      {
        this.addBehavior("AIAttack");
        this.parent.AIAttack.target = dest;
      }
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
});