var Ships = {};

Ships.fighter = function()
{
  this.type = "fighter";
  this.name = "Fighter";
  this.image = "res/fighter.png";
  this.imageEngine = "res/fighter-engine.png";
  this.imageLighting =
  {
    left: "res/fighter-lit-left.png",
    right: "res/fighter-lit-right.png",
    front: "res/fighter-lit-front.png",
    back: "res/fighter-lit-back.png"
  };
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 250;
  this.accel = 35;
  this.turnAccel = 2.0;
  this.health = 0.2;
  this.cost = 5;
  this.buildTime = 5;
  this.threat = 1;
  this.guns =
  {
    front:
    [
      {
        type: "smallRail",
        x: 19,
        y: 14
      }
    ]
  },
  this.lights =
  [
    {
      x: 3, y: 6, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 2, y: 15, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 4, y: 22, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 13, y: 15, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.5,
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
  this.type = "bomber";
  this.name = "Bomber";
  this.image = "res/bomber.png";
  this.imageEngine = "res/bomber-engine.png";
  this.imageNormals = "res/bomber-normals.png";
  this.imageLighting =
  {
    left: "res/bomber-lit-left.png",
    right: "res/bomber-lit-right.png",
    front: "res/bomber-lit-front.png",
    back: "res/bomber-lit-back.png"
  };
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 250;
  this.accel = 35;
  this.turnAccel = 2.0;
  this.health = 0.2;
  this.cost = 5;
  this.buildTime = 5;
  this.threat = 1;
  this.guns =
  {
  },
  this.lights =
  [
    {
      x: 16, y: 20, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 9, y: 24, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 15, y: 38, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 49, y: 23, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.5,
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
  this.type = "frigate";
  this.name = "Frigate";
  this.image = "res/frigate.png";
  this.imageEngine = "res/frigate-engine.png";
  this.imageLighting =
  {
    left: "res/frigate-lit-left.png",
    right: "res/frigate-lit-right.png",
    front: "res/frigate-lit-front.png",
    back: "res/frigate-lit-back.png"
  };
  this.maxTurnSpeed = 0.35;
  this.maxSpeed = 150;
  this.accel = 15;
  this.turnAccel = 1.2;
  this.health = 1;
  this.cost = 30;
  this.buildTime = 15;
  this.threat = 10;
  this.guns =
  {
    left:
    [
      {
        type: "mediumRail",
        x: 20,
        y: 3
      },
      {
        type: "mediumRail",
        x: 40,
        y: 3
      }
    ],
    front:
    [
      {
        type: "mediumRail",
        x: 78,
        y: 28
      }
    ],
    right:
    [
      {
        type: "mediumRail",
        x: 20,
        y: 45
      },
      {
        type: "mediumRail",
        x: 40,
        y: 45
      }
    ],
    back:
    [
      {
        type: "mediumRail",
        x: 23,
        y: 30
      }
    ]
  },
  this.lights =
  [
    {
      x: 6, y: 3, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 6, y: 43, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 49, y: 3, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.5,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
  ];
};
