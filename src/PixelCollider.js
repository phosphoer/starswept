TANK.registerComponent('PixelCollider')

.construct(function()
{
  this.width = 0;
  this.height = 0;
  this.collisionLayer = '';
  this.collidesWith = [];

  this.image = null;
  this.collisionBuffer = new PixelBuffer();
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.setImage = function(image)
  {
    var space = this._entity.getFirstParentWithComponent('CollisionManager');
    if (this.image)
      space.CollisionManager.remove(this);

    this.image = image;
    this.collisionBuffer.createBuffer(image.width, image.height);
    this.collisionBuffer.context.drawImage(this.image, 0, 0);
    this.collisionBuffer.readBuffer();
    this.width = image.width * TANK.main.Game.scaleFactor;
    this.height = image.height * TANK.main.Game.scaleFactor;

    space.CollisionManager.add(this);
  };

  this.testCollision = function(other)
  {
    var selfPos = [t.x, t.y];
    var selfSize = [this.width, this.height];
    var otherPos = [other._entity.Pos2D.x, other._entity.Pos2D.y];
    var inRect = TANK.Math2D.pointInOBB(otherPos, selfPos, selfSize, t.rotation);
    if (!inRect)
      return null;

    var selfHalfSize = TANK.Math2D.scale(selfSize, 0.5);
    otherPos = TANK.Math2D.subtract(otherPos, selfPos);
    otherPos = TANK.Math2D.rotate(otherPos, -t.rotation);
    otherPos = TANK.Math2D.add(otherPos, selfHalfSize);
    otherPos = TANK.Math2D.scale(otherPos, 1 / TANK.main.Game.scaleFactor);
    var p = this.collisionBuffer.getPixel(otherPos[0], otherPos[1]);

    return (p[3] > 0) ? otherPos : null;
  };
});