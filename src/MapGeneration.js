TANK.registerComponent('MapGeneration')

.construct(function()
{
  this.numLevels = 5;
  this.minPaths = 1;
  this.maxPaths = 3;
  this.map = {};
  var rng = new RNG();

  this.generateMap = function(node, currentDepth)
  {
    // Base
    if (currentDepth >= this.numLevels)
      return null;

    // Defaults
    if (!node)
      node = this.map;
    if (!currentDepth)
      currentDepth = 0;

    // Pick a location for this node to represent
    var possibleLocations = Object.keys(Locations);
    possibleLocations.splice(possibleLocations.indexOf('start'), 1);
    var index = Math.floor(Math.random() * possibleLocations.length);
    node.locationName = possibleLocations[index];
    node.depth = currentDepth;

    // Use start location if at beginning
    if (currentDepth === 0)
      node.locationName = 'start';

    // Generate child nodes recursively
    node.paths = [];
    var numPaths = rng.random(this.minPaths, this.maxPaths + 1);
    for (var i = 0; i < numPaths; ++i)
    {
      var childNode = this.generateMap({}, currentDepth + 1);
      if (childNode)
        node.paths.push(childNode);
    }

    return node;
  };

  this.generateMap();
});
