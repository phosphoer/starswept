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
  this.guns =
  {
    front:
    [
      {
        type: 'smallRail',
        x: 28,
        y: 21
      }
    ]
  },
  this.lights =
  [
    {
      x: 11, y: 7, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 9, y: 25, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 14, y: 35, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 23, y: 26, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: 'off', blinkTime: 1.5,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
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
  this.guns =
  {
    front:
    [
      {
        type: 'mediumRocket',
        x: 60,
        y: 60
      }
    ]
  },
  this.lights =
  [
    {
      x: 29, y: 36, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 25, y: 45, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 23, y: 75, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 80, y: 29, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: 'off', blinkTime: 1.5,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
  ];
};

Ships.frigate = function()
{
  this.name = 'Frigate';
  this.resource = 'frigate';
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.35;
  this.maxSpeed = 150;
  this.accel = 15;
  this.turnAccel = 1.2;
  this.health = 1;
  this.shield = 0.5;
  this.shieldGen = 0.01;
  this.shieldRadius = 80;
  this.warpChargeTime = 30;
  this.maxFuel = 10;
  this.optimalAngle = Math.PI / 2;
  this.engineSize = [24, 16];
  this.guns =
  {
    left:
    [
      {
        type: 'mediumRail',
        x: 85,
        y: 39
      },
      {
        type: 'mediumRail',
        x: 35,
        y: 39
      }
    ],
    front:
    [
      {
        type: 'mediumRail',
        x: 106,
        y: 69
      }
    ],
    right:
    [
      {
        type: 'mediumRail',
        x: 16,
        y: 85
      },
      {
        type: 'mediumRail',
        x: 44,
        y: 85
      }
    ],
    back:
    [
      {
        type: 'mediumRail',
        x: 36,
        y: 69
      }
    ]
  },
  this.lights =
  [
    {
      x: 14, y: 39, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 2, y: 84, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 54, y: 84, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: 'off', blinkTime: 1.5,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
  ];
};

Ships.blade = function()
{
  this.name = 'Blade';
  this.resource = 'ship-blade';
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.35;
  this.maxSpeed = 150;
  this.accel = 15;
  this.turnAccel = 1.2;
  this.health = 1;
  this.shield = 0.5;
  this.shieldGen = 0.01;
  this.shieldRadius = 80;
  this.warpChargeTime = 30;
  this.maxFuel = 10;
  this.optimalAngle = Math.PI / 2;
  this.engineSize = [48, 24];
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
  },
  this.lights =
  [
    {
      x: 17, y: 75, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 24, y: 40, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
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