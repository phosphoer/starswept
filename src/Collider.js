TANK.registerComponent("Collider")

.interfaces("Collidable")

.requires("Pos2D")

.construct(function ()
{
  this.width = 0;
  this.height = 0;
  this.ignored = {};
  this.collisionLayer = "";
  this.collidesWith = [""];
})

.initialize(function ()
{
  this.collide = function (other)
  {
    if (this.width == 0 || this.height == 0)
    {
      return Math.pointInOBB([this.parent.Pos2D.x, this.parent.Pos2D.y],
                             [other.parent.Pos2D.x, other.parent.Pos2D.y], [other.width, other.height],
                             other.parent.Pos2D.rotation);
    }
    else if (other.width == 0 || other.height == 0)
    {
      return Math.pointInOBB([other.parent.Pos2D.x, other.parent.Pos2D.y],
                             [this.parent.Pos2D.x, this.parent.Pos2D.y], [this.width, this.height],
                             this.parent.Pos2D.rotation);
    }
    else
    {
      return Math.AABBInAABB([this.parent.Pos2D.x, this.parent.Pos2D.y], [this.width, this.height],
                             [other.parent.Pos2D.x, other.parent.Pos2D.y], [other.width, other.height]);
    }
    return false;
  };
});