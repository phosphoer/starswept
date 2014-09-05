var Locations = {};

Locations.start =
{
  text: 'Some placeholder text that should be displayed upon entering this location.',
  events: [{probability: 1, name: 'civilian'}],
  bgColor: [0, 0, 20, 1],
  lightColor: [0.7, 0.7, 1],
  lightDir: Math.PI * 2 * 0.8,
  spawns:
  [
    {components: {Pos2D: {x: 0, y: 0}, Planet: {}}}
  ]
};

Locations.test =
{
  text: 'You arrive in the test location. You feel testy.',
  name: 'A test location',
  bgColor: [0, 0, 0, 1],
  lightColor: [1, 1, 0.8],
  lightDir: Math.PI * 2 * 0.5,
  spawns: []
};