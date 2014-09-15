var Ships = {};

Ships.fighter = function()
{
  this.name = 'Fighter';
  this.resource = 'fighter';
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 250;
  this.accel = 35;
  this.turnAccel = 2.0;
  this.health = 0.2;
  this.shield = 0.2;
  this.shieldGen = 0.01;
  this.shieldRadius = 30;
  this.warpChargeTime = 10;
  this.maxFuel = 5;
  this.optimalAngle = 0;
  this.engineSize = [18, 8];
  this.engineColor = [50, 100, 255];
  this.guns =
  {
    front:
    [
      {type: 'smallRail', x: 28, y: 21}
    ]
  };
  this.engines =
  [
    {x: 11, y: 7},
    {x: 9, y: 25},
    {x: 14, y: 35}
  ];
};

Ships.bomber = function()
{
  this.name = 'Bomber';
  this.resource = 'bomber';
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.8;
  this.maxSpeed = 200;
  this.accel = 35;
  this.turnAccel = 1.6;
  this.health = 0.4;
  this.shield = 0.4;
  this.shieldGen = 0.01;
  this.shieldRadius = 50;
  this.warpChargeTime = 15;
  this.maxFuel = 7;
  this.optimalAngle = 0;
  this.engineSize = [24, 12];
  this.engineColor = [50, 100, 255];
  this.guns =
  {
    front:
    [
      {type: 'mediumRocket', x: 60, y: 60}
    ]
  };
  this.engines =
  [
    {x: 29, y: 36},
    {x: 25, y: 45},
    {x: 23, y: 75}
  ];
};

Ships.frigate = function()
{
  this.name = 'Frigate';
  this.resource = 'frigate';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.35;
  this.maxSpeed = 120;
  this.accel = 12;
  this.turnAccel = 1.2;
  this.health = 1;
  this.shield = 0.5;
  this.shieldGen = 0.01;
  this.shieldRadius = 80;
  this.warpChargeTime = 60;
  this.maxFuel = 10;
  this.optimalAngle = Math.PI / 2;
  this.engineSize = [24, 16];
  this.engineColor = [50, 100, 255];
  this.guns =
  {
    left:
    [
      {type: 'mediumRail', x: 85, y: 39},
      {type: 'mediumRail', x: 35, y: 39}
    ],
    front:
    [
      {type: 'mediumRail', x: 106, y: 69}
    ],
    right:
    [
      {type: 'mediumRail', x: 16, y: 85},
      {type: 'mediumRail', x: 44, y: 85}
    ],
    back:
    [
      {type: 'mediumRail', x: 36, y: 69}
    ]
  };
  this.engines =
  [
    {x: 18, y: 39},
    {x: 6, y: 84},
  ];
};

Ships.blade = function()
{
  this.name = 'Blade';
  this.resource = 'ship-blade';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.30;
  this.maxSpeed = 150;
  this.accel = 16;
  this.turnAccel = 1.1;
  this.health = 1.5;
  this.shield = 0.25;
  this.shieldGen = 0.015;
  this.shieldRadius = 85;
  this.warpChargeTime = 30;
  this.maxFuel = 7;
  this.optimalAngle = Math.PI / 2;
  this.engineSize = [48, 24];
  this.engineColor = [50, 100, 255];
  this.guns =
  {
    left:
    [
      {type: 'mediumRail', x: 45, y: 55},
      {type: 'mediumRail', x: 90, y: 64},
    ],
    right:
    [
      {type: 'mediumRail', x: 45, y: 94},
      {type: 'mediumRail', x: 90, y: 86},
    ],
    front:
    [
      {type: 'smallRail', x: 136, y: 69},
      {type: 'smallRail', x: 136, y: 79},
    ]
  };
  this.engines =
  [
    {x: 21, y: 75},
    {x: 28, y: 40}
  ];
};

Ships.albatross = function()
{
  this.name = 'Albatross';
  this.resource = 'ship-albatross';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.40;
  this.maxSpeed = 100;
  this.accel = 10;
  this.turnAccel = 1.2;
  this.health = 0.5;
  this.shield = 1;
  this.shieldGen = 0.01;
  this.shieldRadius = 80;
  this.warpChargeTime = 60;
  this.maxFuel = 13;
  this.optimalAngle = 0;
  this.engineSize = [36, 20];
  this.engineColor = [255, 100, 255];
  this.guns =
  {
    left:
    [
      {type: 'smallRail', x: 50, y: 44},
      {type: 'smallRail', x: 101, y: 35},
    ],
    right:
    [
      {type: 'smallRail', x: 45, y: 85},
      {type: 'smallRail', x: 91, y: 91},
    ],
    front:
    [
      {type: 'mediumRocket', x: 96, y: 50},
      {type: 'mediumRocket', x: 96, y: 76},
    ],
    back:
    [
      {type: 'mediumRail', x: 44, y: 64}
    ]
  };
  this.engines =
  [
    {x: 16, y: 45},
    {x: 37, y: 63},
    {x: 85, y: 90}
  ];
};

Ships.rhino = function()
{
  this.name = 'Rhino';
  this.resource = 'ship-rhino';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.25;
  this.maxSpeed = 100;
  this.accel = 10;
  this.turnAccel = 1.2;
  this.health = 1;
  this.shield = 0.5;
  this.shieldGen = 0.01;
  this.shieldRadius = 80;
  this.warpChargeTime = 60;
  this.maxFuel = 10;
  this.optimalAngle = 0;
  this.engineSize = [36, 16];
  this.engineColor = [100, 255, 100];
  this.guns =
  {
    left:
    [
      {type: 'smallRail', x: 100, y: 60},
      {type: 'smallRail', x: 67, y: 68},
    ],
    right:
    [
      {type: 'smallRail', x: 100, y: 88},
      {type: 'smallRail', x: 67, y: 81},
    ],
    front:
    [
      {type: 'mediumRail', x: 139, y: 67},
      {type: 'mediumRail', x: 139, y: 81},
    ],
  };
  this.engines =
  [
    {x: 26, y: 76},
    {x: 121, y: 48},
  ];
};

// Ships.alien = function()
// {
//   this.name = 'Alien';
//   this.maxTurnSpeed = 0.35;
//   this.maxSpeed = 150;
//   this.accel = 15;
//   this.turnAccel = 1.2;
//   this.health = 1;
//   this.cost = 30;
//   this.buildTime = 15;
//   this.threat = 10;
//   this.optimalAngle = Math.PI / 2;
//   this.guns =
//   {
//   },
//   this.lights =
//   [
//     {
//       x: 10, y: 33, colorA: [255, 200, 255], colorB: [255, 140, 255], state: 'off', isEngine: true,
//       states:
//       {
//         on: {radius: 10, alpha: 0.8},
//         off: {radius: 6, alpha: 0.3}
//       }
//     }
//   ];
// };