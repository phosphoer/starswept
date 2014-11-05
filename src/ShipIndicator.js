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
    var indicatorAngle = null;
    if (screenPos[0] < cameraTopLeft[0])
      indicatorAngle = Math.PI;
    if (screenPos[1] < cameraTopLeft[1])
      indicatorAngle = Math.PI / -2;
    if (screenPos[0] > cameraBottomRight[0])
      indicatorAngle = 0;
    if (screenPos[1] > cameraBottomRight[1])
      indicatorAngle = Math.PI / 2;

    if (indicatorAngle !== null)
    {
      ctx.save();
      screenPos[0] = Math.max(cameraTopLeft[0], screenPos[0]);
      screenPos[1] = Math.max(cameraTopLeft[1], screenPos[1]);
      screenPos[0] = Math.min(cameraBottomRight[0], screenPos[0]);
      screenPos[1] = Math.min(cameraBottomRight[1], screenPos[1]);

      ctx.translate(screenPos[0], screenPos[1]);
      ctx.rotate(indicatorAngle);
      ctx.scale(camera.z, camera.z);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

      if (ship)
      {
        if (ship.iff === TANK.main.Game.player.Ship.iff)
          ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        else
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      }

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-40, -20);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-40, 20);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };
});