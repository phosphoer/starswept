var Ships = {};

Ships.frigate = function()
{
  this.image = "res/shuttle.png";
  this.maxTurnSpeed = 1.5;
  this.maxSpeed = 150;
  this.health = 1;
  this.cost = 30;
  this.aggressive = true;
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
      x: 0, y: 0, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.3}
      }
    },
    {
      x: 0, y: 5, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.3}
      }
    },
    {
      x: 7, y: 0, radius: 2, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.5,
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
  this.image = "res/transport.png";
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 100;
  this.health = 1.5;
  this.cost = 50;
  this.aggressive = false;
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