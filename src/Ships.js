var Ships = {};

Ships.frigate = function()
{
  this.image = "res/shuttle.png";
  this.maxTurnSpeed = 1.5;
  this.maxSpeed = 150;
  this.health = 1;
  this.guns =
  [
    {
      reloadTime: 0.5,
      arcAngle: 0,
      arc: Math.PI / 3,
      range: 800
    }
  ];
  this.lights =
  [
    {
      x: 0, y: 0, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
      }
    },
    {
      x: 0, y: 5, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
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

Ships.transport = function()
{
  this.image = "res/transport.png";
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 100;
  this.health = 1.5;
  this.guns =
  [
    {
      reloadTime: 0.5,
      arcAngle: Math.PI,
      arc: Math.PI / 4,
      range: 700
    }
  ];
  this.lights =
  [
    {
      x: 3, y: 0, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
      }
    },
    {
      x: 0, y: 3, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
      }
    },
    {
      x: 3, y: 7, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
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