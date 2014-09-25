TANK.registerComponent('ShipStats')

.construct(function()
{
  this.zdepth = 10;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;

  TANK.main.Renderer2D.add(this);

  var stats =
  [
    {name: 'Name', property: 'name'},
    {name: 'Starting fuel', property: 'maxFuel'},
    {name: 'Warp charge time', property: 'warpChargeTime'},
    {name: 'Max speed', property: 'maxSpeed'},
    {name: 'Armor', property: 'health'},
    {name: 'Shield', property: 'shield'},
    {name: 'Shield regen', property: 'shieldGen'},
  ];

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);

    ctx.fillStyle = '#ddd';
    ctx.font = '10px space-frigate';

    // Draw stats
    for (var i = 0; i < stats.length; ++i)
    {
      ctx.fillText(stats[i].name + ' - ' + ship.shipData[stats[i].property], ship.width / -2, ship.height / 2 + i * 12 - 5);
    };

    ctx.restore();
  };
});