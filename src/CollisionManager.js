TANK.registerComponent("CollisionManager")

.initialize(function ()
{
  this._collisionLayers = {};

  var existing = this.space.getComponentsWithInterface("Collidable");
  for (var i in existing)
  {
    var layer = existing[i].collisionLayer;
    if (!this._collisionLayers[layer])
      this._collisionLayers[layer] = {};
    this._collisionLayers[layer][existing[i].parent.id] = existing[i];
  }

  this.update = function (dt)
  {
    for (var i in this._collisionLayers)
    {
      for (var n in this._collisionLayers[i])
      {
        var c = this._collisionLayers[i][n];
        if (c.isStatic)
          continue;

        for (var j in c.collidesWith)
        {
          var layer = c.collidesWith[j];
          for (var k in this._collisionLayers[layer])
          {
            var other = this._collisionLayers[layer][k];
            if (c.ignored[other.parent.id])
              continue;
            if (c.collide(other))
            {
              c.parent.invoke("OnCollide", other.parent);
            }
          }
        }
      }
    }
  };

  this.addEventListener("OnComponentInitialized", function (c)
  {
    if (c.interfaces["Collidable"])
    {
      var layer = c.collisionLayer;
      if (!this._collisionLayers[layer])
        this._collisionLayers[layer] = {};
      this._collisionLayers[layer][c.parent.id] = c;
    }
  });

  this.addEventListener("OnComponentUninitialized", function (c)
  {
    if (c.interfaces["Collidable"])
    {
      var layer = c.collisionLayer;
      if (this._collisionLayers[layer])
        delete this._collisionLayers[layer][c.parent.id];
    }
  });
});