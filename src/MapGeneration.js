TANK.registerComponent('MapGeneration')

.construct(function()
{
  this.numLevels = 6;
  this.numPaths = 3;
  this.map = {};
  var rng = new RNG();

  this.generateNode = function(depth, possibleLocations)
  {
    var node = {};

    // Pick a location for this node to represent
    if (!possibleLocations)
      possibleLocations = Object.keys(Locations);
    possibleLocations.splice(possibleLocations.indexOf('start'), 1);
    var index = Math.floor(Math.random() * possibleLocations.length);
    node.locationName = possibleLocations[index];
    node.depth = depth;

    // Use start location if at beginning
    if (depth === 0)
      node.locationName = 'start';

    return node;
  };

  this.generateChildren = function(node)
  {
    node.paths = [];
    for (var i = 0; i < this.numPaths; ++i)
    {
      var childDepth = 0.5;
      if (i === 1)
        childDepth = 1;

      var possibleLocations = Object.keys(Locations).filter(function(val) {return node.paths.indexOf(val) === -1;});
      var childNode = this.generateNode(node.depth + childDepth, possibleLocations);
      if (childNode)
        node.paths.push(childNode);
    }
  };

  this.map = this.generateNode(0);
});
