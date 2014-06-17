var Ships = {};

Ships.frigate = function()
{
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

Ships.cruiser = function()
{
  this.image = "res/cruiser.png";
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 100;
  this.health = 1.5;
  this.cost = 50;
  this.guns =
  {
    left:
    {
      count: 3,
      damage: 0.1,
      range: 800,
      time: 5
    },
    right:
    {
      count: 3,
      damage: 0.1,
      range: 800,
      time: 5
    },
    front:
    {
      count: 2,
      damage: 0.1,
      range: 600,
      time: 3
    },
    back:
    {
      count: 1,
      damage: 0.1,
      range: 600,
      time: 3
    }
  },
  this.lights =
  [
    {
      x: 3, y: 0, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.3}
      }
    },
    {
      x: 0, y: 3, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.3}
      }
    },
    {
      x: 3, y: 7, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.3}
      }
    },
    {
      x: 7, y: 5, radius: 2, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.25,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
  ];
};
