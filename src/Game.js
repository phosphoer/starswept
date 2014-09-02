TANK.registerComponent('Game')

.construct(function()
{
  // Game scale factor
  this.scaleFactor = 2;
  this.volume = 0.5;

  // Menu options
  this.menuOptions = [];
  this.menuObjects = [];

  // Mouse positions
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];

  // Global light direction
  this.lightDir = 0;
})

.initialize(function()
{
  var that = this;

  //
  // Save the current game
  //
  this.save = function(slot)
  {
    var save = {};
    localStorage['save-' + slot] = JSON.stringify(save);
  };

  //
  // Load a save slot
  //
  this.load = function(slot)
  {
    var save = JSON.parse(localStorage['save-' + slot]);
  };

  //
  // Update the mouse world position
  //
  this.updateMousePos = function(pos)
  {
    this.mousePosScreen = [pos[0], pos[1]];
    this.mousePosWorld = pos;
    this.mousePosWorld[0] -= window.innerWidth / 2;
    this.mousePosWorld[1] -= window.innerHeight / 2;
    this.mousePosWorld[0] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[1] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[0] += TANK.main.Renderer2D.camera.x;
    this.mousePosWorld[1] += TANK.main.Renderer2D.camera.y;
  };

  //
  // Move to the main menu state
  //
  this.goToMainMenu = function()
  {
    // Build menu options
    this.menuOptions = [];
    this.menuOptions.push(
    {
      name: 'New Game',
      activate: function()
      {
        that.menuUI.teardown();
        that.menuObjects.forEach(function(obj)
        {
          TANK.main.removeChild(obj);
        });
        that.menuObjects = [];

        var player = TANK.createEntity('Player');
        player.Ship.shipData = new Ships.frigate();
        TANK.main.addChild(player, 'player');
      }
    });
    this.menuOptions.push(
    {
      name: 'Options',
      activate: function()
      {
      }
    });
    this.menuOptions.push(
    {
      name: 'Quit',
      activate: function()
      {
      }
    });

    // Build main menu ractive
    this.menuUI = new Ractive(
    {
      el: 'menuContainer',
      template: '#menuTemplate',
      data: {options: this.menuOptions}
    });

    // Set ractive event listeners
    this.menuUI.on('activate', function(e)
    {
      e.context.activate();
    });

    // Build main menu scene
    this.lightDir = Math.random() * Math.PI * 2;

    var planet = TANK.createEntity('Planet');
    planet.Pos2D.x = 0;
    planet.Pos2D.y = -400;
    TANK.main.addChild(planet);
    this.menuObjects.push(planet);

    var moon = TANK.createEntity('Planet');
    moon.Pos2D.x = -400;
    moon.Pos2D.y = 400;
    moon.Planet.radius = 48;
    TANK.main.addChild(moon);
    this.menuObjects.push(moon);

    var ship = TANK.createEntity('Ship');
    ship.Pos2D.x = 400;
    ship.Pos2D.y = 300;
    ship.Ship.shipData = new Ships.bomber();
    TANK.main.addChild(ship);
    this.menuObjects.push(ship);
  };

  //
  // Game start handler
  //
  this.listenTo(TANK.main, 'start', function()
  {
    this.goToMainMenu();
  });

  //
  // Input handlers
  //
  this.listenTo(TANK.main, 'mousemove', function(e)
  {
    this.updateMousePos([e.x, e.y]);
  });

  this.listenTo(TANK.main, 'mousewheel', function(e)
  {
    var delta = e.wheelDelta;
    TANK.main.Renderer2D.camera.z += delta * 0.005 * (TANK.main.Renderer2D.camera.z * 0.1);
    if (TANK.main.Renderer2D.camera.z < 0.5)
      TANK.main.Renderer2D.camera.z = 0.5;
    if (TANK.main.Renderer2D.camera.z > 20)
      TANK.main.Renderer2D.camera.z = 20;
  });

  //
  // Update
  //
  this.update = function(dt)
  {
  };
});
