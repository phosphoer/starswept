var Locations = {};

Locations.start =
{
  text: 'Here you are, at the edge of civilized space. Your destination lies deep in the heart of the galaxy, where anarchy reigns.',
  events: [],
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
  events:
  [
    {probability: 0.5, name: 'pirate'},
    {probability: 0.5, name: 'derelict'}
  ],
  bgColor: [0, 20, 0, 1],
  lightColor: [0.8, 1, 0.8],
  lightDir: Math.PI * 2 * 0.5,
  spawns:
  [
    {components: {Clouds: {cloudColor: [180, 255, 180]}}},
    {components: {Pos2D: {x: 1000, y: -1000}, LevelProp: {resourceName: 'station-01'}}}
  ]
};

Locations.researchStation =
{
  text: 'The research station looks like it hasn\'t been visited in years.',
  name: 'A research station',
  events:
  [
    {probability: 0.5, name: 'pirate'},
    {probability: 0.5, name: 'derelict'}
  ],
  bgColor: [20, 20, 0, 1],
  lightColor: [1, 1, 0.8],
  lightDir: Math.PI * 2 * 0.2,
  spawns:
  [
    {components: {Clouds: {numClouds: 50, cloudColor: [255, 255, 180]}}},
    {components: {Pos2D: {x: 1000, y: -1000}, LevelProp: {resourceName: 'station-01'}}}
  ]
};

Locations.pirateBase =
{
  text: 'Only pirates continue to make their home near the galaxy\'s center. You feel extremely nervous.',
  name: 'A pirate outpost',
  events:
  [
    {probability: 0.75, name: 'pirate'},
    {probability: 0.25, name: 'empty'}
  ],
  bgColor: [0, 20, 20, 1],
  lightColor: [0.8, 1, 1],
  lightDir: Math.PI * 2 * 0.9,
  spawns:
  [
    {components: {Clouds: {numClouds: 30, cloudColor: [180, 255, 255]}}}
  ]
};

Locations.oldBattlefield =
{
  text: 'This system is littered with the wrecks of ancient warships.',
  name: 'An old battlefield',
  events:
  [
    {probability: 0.5, name: 'pirate'},
    {probability: 0.5, name: 'empty'}
  ],
  bgColor: [0, 20, 20, 1],
  lightColor: [0.8, 1, 1],
  lightDir: Math.PI * 2 * 0.9,
  spawns:
  [
    {components: {Clouds: {numClouds: 30, cloudColor: [180, 255, 255]}}}
  ]
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

Locations.redDwarf =
{
  text: 'A red dwarf in this system bathes the scenery in a faintly rose-colored light.',
  name: 'Red dwarf star',
  bgColor: [10, 0, 0, 1],
  lightColor: [1, 0.8, 0.8],
  lightDir: Math.PI * 2 * 0.7,
  spawns: []
};

Locations.asteroidField =
{
  text: 'Here in the depths of an asteroid field, anything can happen. Watch your back.',
  name: 'Asteroid field',
  events:
  [
    {probability: 0.4, name: 'pirate'},
    {probability: 0.6, name: 'derelict'}
  ],
  bgColor: [30, 0, 0, 1],
  lightColor: [1, 0.7, 0.7],
  lightDir: Math.PI * 2 * 0.2,
  spawns:
  [
    {components: {Clouds: {numClouds: 75, cloudColor: [220, 180, 180]}}},
    {components: {AsteroidField: {numAsteroids: 40}}}
  ]
};