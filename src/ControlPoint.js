TANK.registerComponent("ControlPoint")

.includes(["Planet", "OrderTarget"])

.construct(function()
{
  this.zdepth = 0;
  this.faction = null;
  this.value = 10;
  this.moneyTime = 5;
  this.moneyTimer = 0;
  this.pendingFaction = null;
  this.capturePercent = 0;
  this.captureDistance = 500;
  this.passiveCapture = 0.05
  this.queuedShips = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this._entity.Clickable.radius = this._entity.Planet.radius * TANK.main.Game.scaleFactor;

  this.tryCapture = function(faction, amount)
  {
    // If no one is trying to capture us currently, start being captured by them
    if (!this.pendingFaction)
      this.pendingFaction = faction;

    // If the faction is currently trying to capture us, then increase their capture percent
    if (this.pendingFaction === faction)
      this.capturePercent += amount;

    // If the faction is trying to restore us, then decrease the capture percent
    if (this.pendingFaction && this.pendingFaction.team !== faction.team)
      this.capturePercent -= amount;

    // If our capture percent reaches 1, transition ownerships
    if (this.capturePercent >= 1)
    {
      this.capturePercent = 0;

      var oldFaction = this.faction;

      // If we are currently owned, move to neutral state
      // Otherwise, we are now owned by pending faction
      if (this.faction)
        this.faction = null;
      else
        this.faction = this.pendingFaction;

      this.pendingFaction = null;

      if (!this.faction)
        console.log("Team " + oldFaction.team + " lost its control point");
      else
        console.log("Team " + this.faction.team + " gained a control point");
    }

    // If our capture percent reaches 0, lose the pending faction
    if (this.capturePercent <= 0 && this.pendingFaction)
    {
      this.capturePercent = 0;
      this.pendingFaction = null;
    }
  };

  this.buyShip = function(shipType, callback)
  {
    var shipData = new Ships[shipType]();

    if (this.faction.money >= shipData.cost)
    {
      this.faction.money -= shipData.cost;
      this.queuedShips.push({shipData: shipData, time: shipData.buildTime, callback: callback});
    }
  };

  this.draw = function(ctx, camera)
  {
    if (camera.z >= 8)
    {
      // Draw strategic icon
      ctx.save();
      ctx.fillStyle = this.faction ? this.faction.color : "#555";
      ctx.lineWidth = 2;
      ctx.translate(t.x - camera.x, t.y - camera.y);

      ctx.beginPath();
      ctx.arc(0, 0, 300, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    else if (this.faction.team === 0)
    {
      // Draw queue
      ctx.save();
      ctx.fillStyle = "#ddd";
      ctx.font =  20 * camera.z + "px sans-serif";
      ctx.translate(t.x - camera.x, t.y - camera.y);
      for (var i = 0; i < this.queuedShips.length; ++i)
      {
        var timeRemaining = Math.round(this.queuedShips[i].time);
        ctx.fillText(this.queuedShips[i].shipData.name + " - " + timeRemaining + " seconds", 400, -400 + i * 40);
      }
      ctx.restore();
    }
  };

  this.update = function(dt)
  {
    // Passively re-capture self
    if (this.capturePercent > 0 && this.faction)
      this.tryCapture(this.faction, this.passiveCapture * dt);

    // Earn money
    this.moneyTimer += dt;
    if (this.moneyTimer >= this.moneyTime)
    {
      this.moneyTimer = 0;

      if (this.faction)
        this.faction.money += this.value;
    }

    // Process build queue
    for (var i = 0; i < this.queuedShips.length; ++i)
    {
      var item = this.queuedShips[i];
      item.time -= dt;
      if (item.time <= 0)
      {
        var e = TANK.createEntity("AIShip");
        e.Ship.faction = this.faction;
        e.Ship.shipData = item.shipData;
        e.Pos2D.x = t.x - 400 + Math.random() * 800;
        e.Pos2D.y = t.y - 400 + Math.random() * 800;
        TANK.main.addChild(e);

        this.queuedShips.splice(i, 1);
        --i;

        if (item.callback)
          item.callback(e);
      }
    }
  };
});