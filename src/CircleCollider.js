TANK.registerComponent('CircleCollider')

.construct(function()
{
  this.width = 10;
  this.height = 10;
  this.collisionLayer = '';
  this.collidesWith = [];

  this.radius = 5;

  this.setRadius = function(radius)
  {
    var space = this._entity.getFirstParentWithComponent('CollisionManager');
    if (this.image)
      space.CollisionManager.remove(this);

    this.radius = radius;
    this.width = radius * 2;
    this.height = this.width;

    space.CollisionManager.add(this);
  };
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.testCollision = function(other)
  {
    var selfPos = [t.x, t.y];
    var otherPos = [other._entity.Pos2D.x, other._entity.Pos2D.y];

    return TANK.Math2D.pointDistancePoint(selfPos, otherPos) <= this.radius;
  };
});