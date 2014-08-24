TANK.registerComponent('ControlPoint')

.includes(['Planet', 'OrderTarget'])

.construct(function()
{
  this.zdepth = 0;
  this.faction = null;
  this.value = 5;
  this.moneyTime = 10;
  this.moneyTimer = 0;
  this.scanTimer = 0;
  this.radius = 300;
  this.pendingFaction = null;
  this.capturePercent = 0;
  this.captureDistance = 500;
  this.passiveCapture = 0.05;
  this.queuedShips = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this._entity.Clickable.radius = this._entity.Planet.radius * TANK.main.Game.scaleFactor;
  this.radius = this._entity.Planet.radius * TANK.main.Game.scaleFactor;

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

      if (oldFaction)
        oldFaction.removeControlPoint(this);
      if (this.faction)
        this.faction.addControlPoint(this);

      if (!this.faction)
        console.log('Team ' + oldFaction.team + ' lost its control point');
      else
        console.log('Team ' + this.faction.team + ' gained a control point');
    }

    // If our capture percent reaches 0, lose the pending faction
    if (this.capturePercent <= 0 && this.pendingFaction)
    {
      this.capturePercent = 0;
      this.pendingFaction = null;
    }
  };

  this.buyShip = function(shipType, callback, data)
  {
    var shipData = new Ships[shipType]();

    if (this.faction.money >= shipData.cost)
    {
      this.faction.money -= shipData.cost;
      this.queuedShips.push({shipData: shipData, time: shipData.buildTime, callback: callback, data: data});
      return true;
    }

    return false;
  };

  this.draw = function(ctx, camera)
  {
    if (camera.z >= 8)
    {
      // Draw strategic icon
      ctx.save();
      ctx.globalAlpha = Math.min(1, (camera.z - 8) / 4);
      ctx.fillStyle = this.faction ? this.faction.color : '#555';
      ctx.lineWidth = 2;
      ctx.translate(t.x - camera.x, t.y - camera.y);

      ctx.beginPath();
      ctx.arc(0, 0, this.radius, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    else if (this.faction && this.faction.team === 0)
    {
      // Draw queue
      ctx.save();
      ctx.fillStyle = '#ddd';
      ctx.font =  20 * camera.z + 'px sans-serif';
      ctx.translate(t.x - camera.x, t.y - camera.y);
      for (var i = 0; i < this.queuedShips.length; ++i)
      {
        var timeRemaining = Math.round(this.queuedShips[i].time);
        ctx.fillText(this.queuedShips[i].shipData.name + ' - ' + timeRemaining + ' seconds', 400, -400 + i * 40);
      }
      ctx.restore();
    }
  };

  this.update = function(dt)
  {
    // Lose queue if captures
    if (!this.faction)
      this.queuedShips = [];

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

    // Scan for nearby friendly ships that would prevent capturing
    this.scanTimer -= dt;
    if (this.scanTimer < 0 && this.faction)
    {
      this.scanTimer = 3;
      this.friendliesNearby = false;
      var ships = TANK.main.getChildrenWithComponent('Ship');
      for (var i in ships)
      {
        var e = ships[i];
        if (TANK.Math2D.pointDistancePoint([e.Pos2D.x, e.Pos2D.y], [t.x, t.y]) < this.captureDistance)
        {
          this.friendliesNearby = true;
          break;
        }
      }
    }

    // Process build queue
    if (this.queuedShips.length > 0)
    {
      var item = this.queuedShips[0];
      item.time -= dt;
      if (item.time <= 0)
      {
        var e = TANK.createEntity('AIShip');
        e.Ship.faction = this.faction;
        e.Ship.shipData = item.shipData;
        e.Pos2D.x = t.x - 400 + Math.random() * 800;
        e.Pos2D.y = t.y - 400 + Math.random() * 800;
        TANK.main.addChild(e);

        this.queuedShips.splice(0, 1);

        if (item.callback)
          item.callback(e, item.data);
      }
    }
  };
});