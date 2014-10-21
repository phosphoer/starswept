var Locations = {};

Locations.start =
{
  text: 'Here you are, at the edge of civilized space. Your destination lies deep in the heart of the galaxy, where anarchy reigns.',
  name: 'the start',
  events:
  [
    {probability: 1, name: 'start'}
  ],
  bgColor: [0, 0, 20, 1],
  lightColor: [0.7, 0.7, 1],
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
    {probability: 2.5, name: 'pirate'},
    {probability: 2, name: 'derelict'},
    {probability: 1.5, name: 'returnStolenEnforcer'},
    {probability: 1, name: 'civilian'},
    {probability: 1, name: 'shopA'},
    {probability: 0.5, name: 'police'},
  ],
  bgColor: [0, 20, 0, 1],
  lightColor: [0.8, 1, 0.8],
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
    {probability: 1.2, name: 'pirate'},
    {probability: 1, name: 'derelict'},
    {probability: 1.2, name: 'civilian'},
    {probability: 1, name: 'shopA'},
    {probability: 0.7, name: 'investigatePrototypeShip'},
    {probability: 0.5, name: 'derelictReturn'},
    {probability: 0.5, name: 'police'},
  ],
  bgColor: [20, 20, 0, 1],
  lightColor: [1, 1, 0.8],
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
    {probability: 4, name: 'pirate'},
    {probability: 0.5, name: 'empty'},
    {probability: 1, name: 'civilian'},
  ],
  bgColor: [0, 20, 20, 1],
  lightColor: [0.8, 1, 1],
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
    {probability: 100, name: 'investigatePrototypeShipEncounter'},
    {probability: 2, name: 'civilian'},
    {probability: 1, name: 'pirate'},
    {probability: 1, name: 'shopA'},
    {probability: 0.2, name: 'empty'},
    {probability: 0.5, name: 'derelictReturn'},
    {probability: 0.2, name: 'police'},
  ],
  bgColor: [0, 20, 20, 1],
  lightColor: [0.8, 1, 1],
  spawns:
  [
    {components: {Clouds: {numClouds: 30, cloudColor: [180, 255, 255]}}}
  ]
};

Locations.deepSpace =
{
  text: 'There is nothing to see here, just empty space.',
  name: 'Deep space',
  events:
  [
    {probability: 2, name: 'empty'},
    {probability: 1, name: 'civilian'},
    {probability: 1, name: 'shopA'},
    {probability: 0.5, name: 'derelictReturn'},
    {probability: 0.6, name: 'police'},
  ],
  bgColor: [0, 0, 0, 1],
  lightColor: [0.9, 0.9, 1],
  spawns: []
};

Locations.redDwarf =
{
  text: 'The red dwarf star in this system bathes the scenery in a faintly rose-colored light.',
  name: 'A red dwarf star',
  events:
  [
    {probability: 100, name: 'returnStolenEnforcerBattle'},
    {probability: 1.5, name: 'empty'},
    {probability: 1, name: 'civilian'},
    {probability: 0.5, name: 'derelictReturn'},
    {probability: 0.6, name: 'police'},
  ],
  bgColor: [10, 0, 0, 1],
  lightColor: [1, 0.8, 0.8],
  spawns: []
};

Locations.asteroidField =
{
  text: 'Here in the depths of an asteroid field, anything can happen. Watch your back.',
  name: 'An asteroid field',
  events:
  [
    {probability: 1.2, name: 'derelict'},
    {probability: 1, name: 'pirate'},
    {probability: 1, name: 'returnStolenEnforcer'},
    {probability: 0.2, name: 'empty'},
  ],
  bgColor: [30, 0, 0, 1],
  lightColor: [1, 0.7, 0.7],
  spawns:
  [
    {components: {Clouds: {numClouds: 75, cloudColor: [220, 180, 180]}}},
    {components: {AsteroidField: {numAsteroids: 40}}}
  ]
};

Locations.policeOutpost =
{
  text: 'This close to the galaxy\'s center, a police station is a rare haven for law-abiding pilots.',
  name: 'A police station',
  events:
  [
    {probability: 4, name: 'police'},
    {probability: 1, name: 'shopA'},
    {probability: 0.2, name: 'empty'},
    {probability: 1, name: 'civilian'},
  ],
  bgColor: [0, 0, 20, 1],
  lightColor: [0.8, 0.8, 1],
  spawns:
  [
    {components: {Clouds: {numClouds: 30, cloudColor: [180, 255, 255]}}}
  ]
};