TANK.registerComponent("AIShip")

.includes(["Ship"])

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

  // Get AI behaviors from ship
  this.aggressive = ship.shipData.aggressive;

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

  // Handle being given an order to do something with an object
  this.giveContextOrder = function(target)
  {
    if (!target)
      return;

    // Do something with a ship
    if (target.Ship)
    {
      // Attack the ship if it is an enemy
      if (target.Ship.faction.team != ship.faction.team)
        this.prependAction(new Action.AIAttack(this._entity, target));
    }
    // Go to a control point
    else if (target.ControlPoint)
    {
      this.prependAction(new Action.AIApproach(this._entity, target));
    }
  };

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