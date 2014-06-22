var Guns = {};


Guns.smallRail = function()
{
  this.image = new Image();
  this.image.src = "res/small-rail.png";
  this.shootEffect = "gunFireSmall";
  this.trailEffect = "smallRailTrail";
  this.screenShake = 0;
  this.reloadTime = 1;
  this.reloadTimer = 0;
  this.range = 500;
  this.damage = 0.1;
  this.projectileSpeed = 900;
  this.projectileSize = 1;
  this.recoil = 2;
  this.x = 0;
  this.y = 0;
};

Guns.mediumRail = function()
{
  this.image = new Image();
  this.image.src = "res/medium-rail.png";
  this.shootEffect = "gunFireMedium";
  this.trailEffect = "mediumRailTrail";
  this.screenShake = 0.5;
  this.reloadTime = 5;
  this.reloadTimer = 0;
  this.range = 800;
  this.damage = 0.1;
  this.projectileSpeed = 800;
  this.projectileSize = 3;
  this.recoil = 7;
  this.x = 0;
  this.y = 0;
};
