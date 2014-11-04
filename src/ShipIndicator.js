TANK.registerComponent('ShipIndicator')
.includes(['Pos2D', 'Ship'])
.construct(function()
{
  this.zdepth = 10;
})
.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;

  TANK.main.Renderer2D.add(this);

  this.draw = function(ctx, camera)
  {
    var screenPos = [t.x - camera.x, t.y - camera.y];
    var cameraTopLeft = TANK.Math2D.scale([-window.innerWidth / 2, -window.innerHeight / 2], camera.z);
    var cameraBottomRight = TANK.Math2D.scale([window.innerWidth / 2, window.innerHeight / 2], camera.z);
    var onScreen = true;
    if (screenPos[0] < cameraTopLeft[0] || screenPos[1] < cameraTopLeft[1])
      onScreen = false;
    if (screenPos[0] > cameraBottomRight[0] || screenPos[1] > cameraBottomRight[1])
      onScreen = false;

    if (!onScreen)
    {
      ctx.save();
      screenPos[0] = Math.max(cameraTopLeft[0], screenPos[0]);
      screenPos[1] = Math.max(cameraTopLeft[1], screenPos[1]);
      screenPos[0] = Math.min(cameraBottomRight[0], screenPos[0]);
      screenPos[1] = Math.min(cameraBottomRight[1], screenPos[1]);

      if (ship.iff === TANK.main.Game.player.Ship.iff)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      else
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';

      ctx.beginPath();
      ctx.arc(screenPos[0], screenPos[1], 30 * camera.z, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };
});