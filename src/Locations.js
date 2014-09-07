var Locations = {};

Locations.start =
{
  text: 'Here you are, at the edge of civilized space. Your destination lies deep in the heart of the galaxy, where anarchy reigns.',
  events: [{probability: 1, name: 'civilian'}],
  bgColor: [0, 0, 20, 1],
  lightColor: [0.7, 0.7, 1],
  lightDir: Math.PI * 2 * 0.8,
  spawns:
  [
    {components: {Pos2D: {x: 0, y: 0}, Planet: {}}}
  ]
};

Locations.abandonedOutpost =
{
  text: 'A dingy trading outpost sits ahead, listing heavily to the side.',
  name: 'An old abandoned trading outpost',
  bgColor: [0, 20, 0, 1],
  lightColor: [0.8, 1, 0.8],
  lightDir: Math.PI * 2 * 0.5,
  spawns: [{components: {Clouds: {cloudColor: [180, 255, 180]}}}]
};

Locations.deepSpace =
{
  text: 'There is nothing to see here, just empty space.',
  name: 'Deep space',
  bgColor: [0, 0, 0, 1],
  lightColor: [0.9, 0.9, 1],
  lightDir: Math.PI * 2 * 0.2,
  spawns: []
};

Locations.asteroidField =
{
  text: 'Here in the depths of an asteroid field, anything can happen. Watch your back.',
  name: 'Asteroid field',
  bgColor: [30, 0, 0, 1],
  lightColor: [1, 0.7, 0.7],
  lightDir: Math.PI * 2 * 0.2,
  spawns: [{components: {Clouds: {cloudColor: [220, 180, 180]}}}]
};