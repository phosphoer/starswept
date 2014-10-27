TANK.registerComponent('ShipHud')

.construct(function()
{
  this.htmlText =
  [
    '<div class="console-window ship-hud">',
    // Speed
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Speed</div>',
    ' <div class="ship-hud-value ship-hud-speed"></div>',
    '</div>',
    // Armor
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Armor</div>',
    ' <div class="ship-hud-value ship-hud-armor"></div>',
    '</div>',
    // Shield
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Shield</div>',
    ' <div class="ship-hud-value ship-hud-shield"></div>',
    '</div>',
    // Gun front
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Fore</div>',
    ' <div class="ship-hud-value ship-hud-fore"></div>',
    '</div>',
    // Gun right
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Starboard</div>',
    ' <div class="ship-hud-value ship-hud-starboard"></div>',
    '</div>',
    // Gun left
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Aft</div>',
    ' <div class="ship-hud-value ship-hud-aft"></div>',
    '</div>',
    // Gun back
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Port</div>',
    ' <div class="ship-hud-value ship-hud-port"></div>',
    '</div>',
    // Warp charge
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Warp</div>',
    ' <div class="ship-hud-value ship-hud-warp"></div>',
    '</div>',
    // Fuel counter
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Fuel</div>',
    ' <div class="ship-hud-value ship-hud-fuel"></div>',
    '</div>',
    // Shop indicator
    '<div class="ship-hud-item ship-hud-shop">',
    'Press E to open shop',
    '</div>',
    '</div>'
  ].join('\n');

  this.barSize = 10;
  this.fillChar = '=';
  this.emptyChar = '-';
})

.initialize(function()
{
  var ship = this._entity.Ship;
  var weapons = this._entity.Weapons;
  var shield = ship.shieldObj.Shield;

  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container);

  //
  // Get UI handles
  //
  this.speedValue = this.container.querySelector('.ship-hud-speed');
  this.armorValue = this.container.querySelector('.ship-hud-armor');
  this.shieldValue = this.container.querySelector('.ship-hud-shield');
  this.foreValue = this.container.querySelector('.ship-hud-fore');
  this.starboardValue = this.container.querySelector('.ship-hud-starboard');
  this.aftValue = this.container.querySelector('.ship-hud-aft');
  this.portValue = this.container.querySelector('.ship-hud-port');
  this.warpValue = this.container.querySelector('.ship-hud-warp');
  this.fuelValue = this.container.querySelector('.ship-hud-fuel');
  this.shopLabel = this.container.querySelector('.ship-hud-shop');

  //
  // Show the shop option
  //
  this.showShopOption = function()
  {
    this.shopLabel.style.display = 'block';
  };

  this.hideShopOption = function()
  {
    this.shopLabel.style.display = 'none';
  };
  this.hideShopOption();

  //
  // Helper to build bar ui
  //
  this.buildBarText = function(percent)
  {
    var chars = [];
    var fillNum = Math.round(this.barSize * percent);
    for (var i = 0; i < this.barSize; ++i)
      chars.push(i < fillNum ? this.fillChar : this.emptyChar);
    return chars.join('');
  };

  //
  // Update
  //
  this.update = function(dt)
  {
    this.speedValue.innerHTML = this.buildBarText(ship.desiredSpeed / ship.shipData.maxSpeed);
    this.armorValue.innerHTML = this.buildBarText(ship.health / ship.shipData.health);
    this.shieldValue.innerHTML = this.buildBarText(shield.health / ship.shipData.shield);

    this.foreValue.innerHTML = this.buildBarText(weapons.reloadPercent('front'));
    this.starboardValue.innerHTML = this.buildBarText(weapons.reloadPercent('right'));
    this.aftValue.innerHTML = this.buildBarText(weapons.reloadPercent('back'));
    this.portValue.innerHTML = this.buildBarText(weapons.reloadPercent('left'));

    this.warpValue.innerHTML = this.buildBarText(ship.warpCharge / ship.warpChargeTime);
    this.fuelValue.innerHTML = ship.fuel;
  };
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
});