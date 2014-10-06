TANK.registerComponent('ChoiceScreen')

.construct(function()
{
  this.htmlText =
  [
    '<div class="main-menu">',
    '  <div class="menu-title">Make a choice</div>',
    '  <div class="menu-options">',
    '  </div>',
    '</div>'
  ].join('\n');

  this.title = 'Make a choice';
  this.options = [];
})

.initialize(function()
{
  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container);
  this.container.querySelector('.menu-title').innerText = this.title;
  this.container.querySelector('.menu-options').style.height = '70%';

  //
  // Fill out menu options
  //
  var optionsContainer = this.container.querySelector('.menu-options');
  for (var i = 0; i < this.options.length; ++i)
  {
    var optionUI = document.createElement('div');
    optionUI.className = 'menu-option';
    optionUI.innerText = this.options[i].text;
    optionUI.setAttribute('data-index', i);
    optionsContainer.appendChild(optionUI);
  }

  //
  // Handle interactions
  //
  this.container.querySelector('.menu-options').addEventListener('click', function(e)
  {
    if (!e.target.classList.contains('menu-option'))
      return;

    this._entity.dispatch('choicemade', e.target.getAttribute('data-index'));
    this._entity._parent.removeChild(this._entity);
  }.bind(this));
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
});