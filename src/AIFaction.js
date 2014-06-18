TANK.registerComponent("AIFaction")

.includes("Faction")

.construct(function()
{
  this.currentCaptureTarget = null;
  this.shipsBuildForCapture = [];
  this.shipsQueuedForCapture = 0;
})

.initialize(function()
{
  var faction = this._entity.Faction;

  this.update = function(dt)
  {

  };
});
