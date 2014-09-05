TANK.registerComponent('MainMenu')

.construct(function()
{
  this.htmlText =
  [
    '<div class="main-menu">',
    '  <div class="menu-title">Starswept Admiral</div>',
    '  <div class="menu-options">',
    '    <div class="menu-option menu-option-new">New Game</div>',
    '    <div class="menu-option menu-option-options">Options</div>',
    '    <div class="menu-option menu-option-quit">Quit</div>',
    '  </div>',
    '</div>'
  ].join('\n');
})

.initialize(function()
{
  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container);

  //
  // Handle interactions
  //
  var newGameButton = this.container.querySelector('.menu-option-new');
  newGameButton.addEventListener('click', function()
  {
    this._entity.dispatch('newgame');
  }.bind(this));

  //
  // Create scene
  //
  this.planet = TANK.createEntity('Planet');
  this.planet.Pos2D.x = 0;
  this.planet.Pos2D.y = -400;
  TANK.main.addChild(this.planet);

  this.moon = TANK.createEntity('Planet');
  this.moon.Pos2D.x = -400;
  this.moon.Pos2D.y = 400;
  this.moon.Planet.radius = 48;
  TANK.main.addChild(this.moon);

  this.ship = TANK.createEntity('Ship');
  this.ship.Pos2D.x = 400;
  this.ship.Pos2D.y = 300;
  this.ship.Ship.shipData = new Ships.bomber();
  TANK.main.addChild(this.ship);
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
  TANK.main.removeChild(this.planet);
  TANK.main.removeChild(this.moon);
  TANK.main.removeChild(this.ship);
});