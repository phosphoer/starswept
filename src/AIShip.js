TANK.registerComponent("AIShip")

.includes(["Ship", "Draggable", "Droppable"])

.construct(function()
{
  this.behaviors = {};
  this.numBehaviors = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;
  var ship = this._entity.Ship;

  // Damage response
  this.listenTo(this._entity, "damaged", function(damage, dir, owner)
  {
    if (owner && owner.Ship && owner.Ship.team != ship.team)
    {
      this.addBehavior("AIAttack");
      this._entity.AIAttack.target = owner;
    }
  });

  this.listenTo(this._entity, "dragend", function(dest)
  {
    if (dest && dest.Ship)
    {
      if (dest.Ship.team != ship.team)
      {
        this.addBehavior("AIAttack");
        this._entity.AIAttack.target = dest;
      }
    }
  });

  this.addBehavior = function(name)
  {
    if (this._entity[name])
      return;
    this._entity.addComponent(name);
    this.behaviors[name] = true;
    ++this.numBehaviors;
  };

  this.removeBehavior = function(name)
  {
    if (!this._entity[name])
      return;
    this._entity.removeComponent(name);
    delete this.behaviors[name];
    --this.numBehaviors;
  };

  this.clearBehaviors = function()
  {
    for (var i in this.behaviors)
      this.removeBehavior(i);
  };
});