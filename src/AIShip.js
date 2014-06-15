TANK.registerComponent("AIShip")

.includes(["Ship", "Droppable"])

.construct(function()
{
  this.actions = [];
  this.removedActions = [];
  this.aggressive = true;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;
  var ship = this._entity.Ship;

  this._entity.Droppable.selectDepth = 1;

  // Get AI behaviors from ship
  this.aggressive = ship.shipData.aggressive;

  // Only draggable if on the player team
  if (ship.faction.team === 0)
  {
    this._entity.addComponent("Draggable");
    this._entity.Draggable.selectDepth = 1;
  }

  // Always watch for enemies
  this._entity.addComponent("AIWatch");

  // Damage response
  this.listenTo(this._entity, "damaged", function(damage, dir, pos, owner)
  {
    if (owner && owner.Ship && owner.Ship.faction.team != ship.faction.team && !(this.actions[0] instanceof Action.AIAttack))
    {
      this.prependAction(new Action.AIAttack(this._entity, owner));
    }
  });

  // Reponse to being dragged onto something
  this.listenTo(this._entity, "dragend", function(dest)
  {
    if (!dest)
      return;

    // Attack an enemy ship
    if (dest.Ship && dest.Ship.faction.team != ship.faction.team)
    {
      this.prependAction(new Action.AIAttack(this._entity, dest));
    }
    // Go to a control point
    else if (dest.ControlPoint)
    {
      this.prependAction(new Action.AIApproach(this._entity, dest));
    }
  });

  this.prependAction = function(action, blocking)
  {
    if (blocking !== undefined)
      action._blocking = blocking;
    this.actions.splice(0, 0, action);
    action.start();
  };

  this.appendAction = function(action, blocking)
  {
    if (blocking !== undefined)
      action._blocking = blocking;
    this.actions.push(action);
    action.start();
  };

  this.update = function(dt)
  {
    for (var i = 0; i < this.actions.length; ++i)
    {
      var action = this.actions[i];
      if (action.update)
        action.update(dt);

      if (action._done)
        this.removedActions.push(i);

      if (action._blocking)
        break;
    };

    for (var i = 0; i < this.removedActions.length; ++i)
      this.actions.splice(this.removedActions[i], 1);
    this.removedActions = [];
  };

  this.appendAction(new Action.AIIdle(this._entity));
});