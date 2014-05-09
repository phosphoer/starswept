TANK.registerComponent("ControlPoint")

.includes(["Planet", "Droppable"])

.construct(function()
{
  this.faction = null;
  this.value = 10;
  this.moneyTime = 5;
  this.moneyTimer = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.buyShip = function(shipType)
  {
    var shipData = new Ships[shipType]();

    if (this.faction.money >= shipData.cost)
    {
      this.faction.money -= shipData.cost;

      var e = TANK.createEntity("AIShip");
      e.Ship.team = this.faction.team;
      e.Ship.shipData = shipData;
      e.Pos2D.x = t.x - 400 + Math.random() * 800;
      e.Pos2D.y = t.y - 400 + Math.random() * 800;
      TANK.main.addChild(e);
    }
  };

  this.update = function(dt)
  {
    this.moneyTimer += dt;
    if (this.moneyTimer >= this.moneyTime)
    {
      this.moneyTimer = 0;

      if (this.faction)
        this.faction.money += this.value;
    }
  };
});