TANK.registerComponent('SoundEmitter')

.includes(['Pos2D'])

.construct(function()
{
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var ear = TANK.main.Renderer2D.camera;
  var earRange = 600;

  this.play = function(name)
  {
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [ear.x, ear.y]);
    var volume = Math.min(1, earRange / dist) * TANK.main.Game.volume;
    Wave.play(name, volume);
  };
});