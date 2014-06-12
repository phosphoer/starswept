var Guns = {};

Guns.mediumRail = function()
{
  this.image = new Image();
  this.image.src = "res/medium-rail.png";
  this.reloadTime = 5;
  this.reloadTimer = 0;
  this.range = 800;
  this.damage = 0.1;
  this.projectileSpeed = 800;
  this.recoil = 7;
  this.x = 0;
  this.y = 0;
};
