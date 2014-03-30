TANK.registerComponent("AIShip")

.requires("Ship")

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

  this.addEventListener("OnEnterFrame", function(dt)
  {
  });
});