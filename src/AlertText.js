TANK.registerComponent('AlertText')
.construct(function()
{
  this.text = 'Alert!';
  this.color = '#d55';
})
.initialize(function()
{
  this.element = document.createElement('div');
  this.element.className = 'alert-text';
  this.element.innerText = this.text;
  this.element.style.color = this.color;
  document.body.appendChild(this.element);

  this.element.addEventListener('webkitAnimationEnd', function()
  {
    this._entity._parent.removeChild(this._entity);
  }.bind(this));
})
.uninitialize(function()
{
  document.body.removeChild(this.element);
});