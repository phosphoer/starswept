TANK.registerComponent("ControlPoint")

.requires("Planet")

.construct(function()
{
  this.faction = null;
  this.value = 10;
  this.moneyTime = 5;
  this.moneyTimer = 0;
})

.initialize(function()
{
  var t = this.parent.Pos2D;

  this.buyShip = function()
  {
    if (this.faction.money > 30)
    {
      this.faction.money -= 30;

      var e = TANK.createEntity("AIShip");
      e.Pos2D.x = t.x;
      e.Pos2D.y = t.y;
      TANK.addEntity(e);
    }
  };

  this.addEventListener("OnEnterFrame", function(dt)
  {
    this.moneyTimer += dt;
    if (this.moneyTimer >= this.moneyTime)
    {
      this.moneyTimer = 0;

      if (this.faction)
        this.faction.money += this.value;
    }
  });
});