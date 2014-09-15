TANK.registerComponent('ShipSelection')

.construct(function()
{
  this.htmlText =
  [
    '<div class="main-menu">',
    '  <div class="menu-title">Select a Ship</div>',
    '  <div class="ship-select ship-select-left">&lt;</div>',
    '  <div class="ship-select ship-select-right">&gt;</div>',
    '  <div class="menu-options">',
    '    <div class="menu-option menu-option-go">Start</div>',
    '  </div>',
    '</div>'
  ].join('\n');

  this.ships = [];
  this.selection = 0;
})

.initialize(function()
{
  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container)

  this.container.querySelector('.menu-options').style.height = '30%';

  //
  // Handle interactions
  //
  this.container.querySelector('.ship-select-left').addEventListener('click', function()
  {
    this.shiftSelection(-1);
  }.bind(this));
  this.container.querySelector('.ship-select-right').addEventListener('click', function()
  {
    this.shiftSelection(1);
  }.bind(this));
  this.container.querySelector('.menu-option-go').addEventListener('click', function()
  {
    this._entity.dispatch('selectionmade', this.ships[this.selection].shipType);
  }.bind(this));

  //
  // Create scene
  //
  var x = 0;
  for (var i in Ships)
  {
    var ship = new Ships[i]();
    if (!ship.playable)
      continue;

    var e = TANK.createEntity('Ship');
    e.Pos2D.x = x;
    e.Pos2D.y = 0;
    e.Ship.shipData = ship;
    e.shipType = i;
    TANK.main.addChild(e);
    this.ships.push(e);
    x += 500;
  }

  //
  // Move selection
  //
  this.shiftSelection = function(amount)
  {
    this.selection += amount;
    this.selection = Math.max(0, this.selection);
    this.selection = Math.min(this.ships.length - 1, this.selection);
  };

  //
  // Update
  //
  this.update = function(dt)
  {
    for (var i = 0; i < this.ships.length; ++i)
    {
      var dist = i - this.selection;
      var desiredPos = dist * 500;
      var t = this.ships[i].Pos2D;
      t.x = t.x + (desiredPos - t.x) * 0.2;
    }
  };
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
  for (var i = 0; i < this.ships.length; ++i)
    TANK.main.removeChild(this.ships[i]);
  this.ship = [];
});