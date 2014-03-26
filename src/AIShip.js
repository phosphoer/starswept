TANK.registerComponent("AIShip")

.requires("Ship")

.construct(function()
{
  this.target = null;
})

.initialize(function()
{
  var t = this.parent.Pos2D;

  this.target = TANK.getEntity("Player");

  this.addEventListener("OnEnterFrame", function(dt)
  {
    // Get direction to player
    var targetPos = this.target.Pos2D;
    var dir = Math.getDirectionToPoint([t.x, t.y], t.rotation, [targetPos.x, targetPos.y]);

    // Target is to the left
    if (dir < 0)
    {
    }
    // Target is to the right
    if (dir > 0)
    {
    }
  });
});