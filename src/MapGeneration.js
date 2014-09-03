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

    // Generate the current node
    node.locationName = 'test';
    node.paths = [];
    if (currentDepth === 0)
      node.locationName = 'start';

    // Generate child nodes recursively
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
