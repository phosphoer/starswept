TANK.registerComponent('EndScreen')

.construct(function()
{
  this.htmlText =
  [
    '<div class="main-menu">',
    '  <div class="menu-title">You made it</div>',
    '  <div class="end-score"></div>',
    '  <div class="end-summary">',
    '  </div>',
    '  <div class="menu-options">',
    '    <div class="menu-option menu-option-back">Back</div>',
    '  </div>',
    '</div>'
  ].join('\n');

  this.won = true;
  this.score = 0;
})

.initialize(function()
{
  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container);

  // Fill out title
  if (this.won)
    this.container.querySelector('.menu-title').innerHTML = 'You made it';
  else
    this.container.querySelector('.menu-title').innerHTML = 'You died';

  // Fill out summary
  this.container.querySelector('.end-score').innerHTML = 'Final score - ' + this.score;
  this.container.querySelector('.end-summary').innerHTML = 'A summary how the game went.';

  //
  // Handle interactions
  //
  var backButton = this.container.querySelector('.menu-option-back');
  backButton.addEventListener('click', function()
  {
    this._entity.dispatch('back');
  }.bind(this));
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
});