TANK.registerComponent("AIAttack")

.includes("AIShip")

.construct(function()
{
  this.target = null;
  this.maxTurnSpeed = 1;
  this.optimalDistance = 500;
  this.giveUpTimer = 5;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;
  var ship = this._entity.Ship;

  this._entity.AIShip.addBehavior("AIApproach");

  this.update = function(dt)
  {
    this._entity.AIApproach.target = this.target;
    if (!this.target || !TANK.main.getChild(this.target._id))
    {
      this.giveUpTimer -= dt;
      if (this.giveUpTimer < 0)
        this._entity.AIShip.removeBehavior("AIAttack");
      return;
    }

    // Get direction to player
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);

    // Shoot randomly
    this._entity.Weapons.aimAt(targetPos);
    if (Math.random() < 0.05 && this._entity.Weapons.aimingAtTarget && targetDist < 1500)
    {
      this._entity.Weapons.shoot();
    }
  };
})

.uninitialize(function()
{
  this._entity.AIShip.removeBehavior("AIApproach");
});