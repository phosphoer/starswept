TANK.registerComponent("AIShip")

.includes(["Ship", "Droppable"])

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

  // Only draggable if on the player team
  if (ship.team === 0)
  {
    this._entity.addComponent("Draggable");
  }

  // Always watch for enemies
  this._entity.addComponent("AIWatch");

  // Damage response
  this.listenTo(this._entity, "damaged", function(damage, dir, owner)
  {
    if (owner && owner.Ship && owner.Ship.team != ship.team)
    {
      this.addBehavior("AIAttack");
      this._entity.AIAttack.target = owner;
    }
  });

  // Reponse to being dragged onto something
  this.listenTo(this._entity, "dragend", function(dest)
  {
    if (!dest)
      return;

    // Attack an enemy ship
    if (dest.Ship && dest.Ship.team != ship.team)
    {
      this.addBehavior("AIAttack");
      this._entity.AIAttack.target = dest;
    }
    // Go to a control point
    else if (dest.ControlPoint)
    {
      this.addBehavior("AIApproach");
      this._entity.AIApproach.target = dest;
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