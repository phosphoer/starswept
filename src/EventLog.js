TANK.registerComponent('EventLog')
.construct(function()
{
  this.htmlText =
  [
    '<div class="console-window event-log">',
    '</div>'
  ].join('\n');
})
.initialize(function()
{
  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container);
  this.logContainer = this.container.querySelector('.event-log');

  //
  // Log functions
  //
  this.add = function(text)
  {
    var log = document.createElement('div');
    log.className = 'event-log-item';
    log.innerText = text;
    this.logContainer.appendChild(log);
    this.scrollToBottom();
  };

  this.clear = function()
  {
    this.logContainer.innerHTML = '';
  };

  this.scrollToBottom = function()
  {
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  };

  //
  // Display options
  //
  this.showOptions = function(prompt, options)
  {
    this.logContainer.classList.add('event-log-expanded');

    // Create container
    var optionsContainer = document.createElement('div');
    optionsContainer.className = 'event-log-options';

    // Create prompt
    var promptUI = document.createElement('div');
    promptUI.className = 'event-log-prompt';
    promptUI.innerText = prompt;
    optionsContainer.appendChild(promptUI);

    // Add options
    for (var i = 0; i < options.length; ++i)
    {
      var optionUI = document.createElement('div');
      optionUI.className = 'event-log-option';
      optionUI.innerText = '> ' + options[i].text;
      optionUI.setAttribute('data-index', i);
      if (options[i].disabled)
        optionUI.classList.add('disabled');
      optionsContainer.appendChild(optionUI);
    }
    this.logContainer.appendChild(optionsContainer);

    // Set up interactions
    optionsContainer.addEventListener('click', function(e)
    {
      if (!e.target.classList.contains('event-log-option'))
        return;
      if (e.target.classList.contains('disabled'))
        return;

      var index = +e.target.getAttribute('data-index');
      this._entity.dispatch('choicemade', index);
      if (options[index].script)
        options[index].script();

      this.logContainer.removeChild(optionsContainer);
      this.logContainer.classList.remove('event-log-expanded');
    }.bind(this));

    // Scroll to bottom
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  };
})
.uninitialize(function()
{
  document.body.removeChild(this.container);
});