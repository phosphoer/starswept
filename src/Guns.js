var Guns = {};

Guns.smallRail = function()
{
  this.image = new Image();
  this.image.src = 'res/img/small-rail.png';
  this.shootSound = 'small-rail-01';
  this.shootEffect = 'gunFireSmall';
  this.trailEffect = 'smallRailTrail';
  this.damageEffect = 'damageSmall';
  this.screenShake = 0;
  this.reloadTime = 0.3;
  this.reloadTimer = 0;
  this.range = 700;
  this.damage = 0.01;
  this.projectileSpeed = 900;
  this.projectileAccel = 0;
  this.projectileSize = 1;
  this.shieldDisableTime = 0.25;
  this.recoil = 1;
  this.x = 0;
  this.y = 0;
};

Guns.mediumRail = function()
{
  this.image = new Image();
  this.image.src = 'res/img/medium-rail.png';
  this.shootSound = 'medium-rail-01';
  this.shootEffect = 'gunFireMedium';
  this.trailEffect = 'mediumRailTrail';
  this.damageEffect = 'damageMedium';
  this.screenShake = 0.5;
  this.reloadTime = 5;
  this.reloadTimer = 0;
  this.range = 1200;
  this.damage = 0.1;
  this.projectileSpeed = 800;
  this.projectileAccel = 0;
  this.projectileSize = 3;
  this.shieldDisableTime = 0.25;
  this.recoil = 7;
  this.x = 0;
  this.y = 0;
};

Guns.mediumRocket = function()
{
  this.image = new Image();
  this.image.src = 'res/img/medium-rocket.png';
  this.shootSound = 'medium-rail-01';
  this.shootEffect = 'gunFireMedium';
  this.trailEffect = 'mediumRailTrail';
  this.damageEffect = 'damageMedium';
  this.screenShake = 0.5;
  this.reloadTime = 6;
  this.reloadTimer = 0;
  this.range = 800;
  this.damage = 0.2;
  this.projectileLife = 7;
  this.projectileSpeed = 200;
  this.projectileAccel = 50;
  this.projectileSize = 3;
  this.shieldDisableTime = 0.75;
  this.recoil = 7;
  this.x = 0;
  this.y = 0;
};
