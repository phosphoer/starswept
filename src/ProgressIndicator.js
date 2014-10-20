TANK.registerComponent('ProgressIndicator')

.construct(function()
{
  this.htmlText =
  [
    '<div class="console-window progress-indicator">',
    ' <span class="progress-indicator-begin">&lt;</span>',
    ' <span class="progress-indicator-value"></span>',
    ' <span class="progress-indicator-end">&gt;</span>',
    '</div>'
  ].join('\n');

  this.indicatorChar = 'x';
})

.initialize(function()
{
  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container);

  //
  // Get UI handles
  //
  this.valueUI = this.container.querySelector('.progress-indicator-value');

  //
  // Update display
  //
  this.updateDisplay = function()
  {
    var currentNode = TANK.main.Game.currentNode;
    var display = '';
    for (var i = 0; i < TANK.main.MapGeneration.numLevels; i += 0.5)
    {
      if (i < currentNode.depth)
        display += '-';
      else if (i > currentNode.depth)
        display += '=';
      else
        display += this.indicatorChar;
    }
    this.valueUI.innerHTML = display;
  };

  //
  // Listen for location changes
  //
  this.listenTo(TANK.main, 'locationchange', this.updateDisplay);

  this.updateDisplay();
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
});