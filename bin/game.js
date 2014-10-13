TANK.registerComponent('AIAttack')
.includes(['Ship', 'RemoveOnLevelChange'])
.construct(function()
{
  this.target = null;
  this.attackDistanceMin = 450;
  this.attackDistanceMax = 600;
  this.giveUpTimer = 5;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;
  var ship = this._entity.Ship;

  //
  // Attempt to fire guns at a given target, if it is in our sights
  //
  this.fireGunsAtTarget = function(target)
  {
    var targetPos = [target.Pos2D.x, target.Pos2D.y];
    var targetVelocity = [target.Velocity.x, target.Velocity.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // Check each gun and see if it is facing the target and in range
    // If so, fire
    for (var i in this._entity.Weapons.guns)
    {
      var guns = this._entity.Weapons.guns[i];
      for (var j = 0; j < guns.length; ++j)
      {
        if (guns[j].reloadTimer > 0)
          continue;
        var distFromGun = TANK.Math2D.pointDistancePoint(targetPos, guns[j].worldPos);
        var targetVec = TANK.Math2D.subtract(targetPos, guns[j].worldPos);
        targetVec = TANK.Math2D.scale(targetVec, 1 / distFromGun);
        var gunDir = [Math.cos(guns[j].angle + t.rotation), Math.sin(guns[j].angle + t.rotation)];
        var dot = TANK.Math2D.dot(gunDir, targetVec);
        if (Math.abs(1 - dot) < 0.05 && distFromGun < guns[j].range)
        {
          this._entity.Weapons.fireGun(j, i);
        }
      }
    }
  };

  //
  // Update
  //
  this.update = function(dt)
  {
    // Check if target still exists
    if (!this.target || !TANK.main.getChild(this.target._id))
    {
      this.giveUpTimer -= dt;
      if (this.giveUpTimer < 0)
        return true;
    }

    // Get direction to target
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetVelocity = [this.target.Velocity.x, this.target.Velocity.y];
    targetPos = TANK.Math2D.add(targetPos, TANK.Math2D.scale(targetVelocity, 1));
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // Shoot
    this.fireGunsAtTarget(this.target);

    // We should move to engage the target
    // Depending on the layout of our ship, this either means attempting
    // to line up a broadside, or aligning our fore-guns with the target
    // If we are too close we should turn to get farther away
    if (targetDist < this.attackDistanceMin)
    {
      ship.heading = targetDir + Math.PI;
      ship.setSpeedPercent(0.5);
    }
    // We want to get to a minimum distance from the target before attempting to aim at it
    else if (targetDist > this.attackDistanceMax)
    {
      ship.heading = targetDir;
      ship.setSpeedPercent(1);
    }
    else
    {
      // Aim at a right angle to the direction to the target, to target with a broadside
      ship.heading = targetDir + ship.shipData.optimalAngle;

      // Slow down to half speed while circling
      ship.setSpeedPercent(0.5);
    }
  };
});

TANK.registerComponent('AIAttackPlayer')
.includes(['Ship', 'RemoveOnLevelChange'])
.initialize(function()
{
  this.update = function(dt)
  {
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = TANK.main.Game.player;
    this._entity.removeComponent('AIAttackPlayer');
  };
});
TANK.registerComponent('AICivilian')
.includes(['Ship', 'RemoveOnLevelChange'])
.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;
  var targetDir = Math.atan2(0 - t.y, 0 - t.x);
  ship.heading = targetDir;
  ship.setSpeedPercent(0.5);

  this.listenTo(this._entity, 'aggro', function(owner)
  {
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = owner;
    this._entity.removeComponent('AICivilian');

    Flags.attackedCivilian = true;
    Flags.wanted = true;

    TANK.main.Game.addStory('You attacked a peaceful ship.');
  });
});
TANK.registerComponent('AIDerelict')
.includes(['Ship', 'RemoveOnLevelChange'])
.initialize(function()
{
  this.listenTo(TANK.main, 'derelictleave', function()
  {
    this._entity.removeComponent('AIDerelict');
    this._entity.addComponent('AICivilian');
  });
});
TANK.registerComponent('AIPolice')
.includes(['Ship', 'RemoveOnLevelChange'])
.construct(function()
{
  this.target = null;
  this.scanDistance = 1000;
  this.patienceTime = 10;
  this.patienceTimer = 0;
  this.scanTime = 5;
  this.scanTimer = 0;

  this.gaveFirstWarning = false;
  this.gaveSecondWarning = false;
  this.waitingForStop = false;
  this.waitingForScan = false;
  this.done = false;
})
.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;

  this.listenTo(this._entity, 'aggro', function(owner)
  {
    TANK.main.Game.addEventLog('<Police>: Prepare to die, criminal!');
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = owner;
    this._entity.removeComponent('AIPolice');
  });

  this.attack = function()
  {
    TANK.main.Game.addEventLog('<Police>: Prepare to die, criminal!');
    TANK.main.Game.addStory('You got into a tangle with the police.');
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = this.target;
    this._entity.removeComponent('AIPolice');
  };

  this.update = function(dt)
  {
    this.target = TANK.main.getChildrenWithComponent('Player');
    if (!this.target)
      return;
    this.target = this.target[Object.keys(this.target)[0]];

    // Get direction to target
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetVelocity = [this.target.Velocity.x, this.target.Velocity.y];
    targetPos = TANK.Math2D.add(targetPos, TANK.Math2D.scale(targetVelocity, 1));
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // Finish scanning
    if (this.done)
    {
      ship.setSpeedPercent(0.5);
      return;
    }

    // Aim at target
    ship.heading = targetDir;

    // Move towards target if not close enough
    if (targetDist < this.scanDistance)
      ship.setSpeedPercent(0);
    else if (targetDist < this.scanDistance * 2)
      ship.setSpeedPercent(0.5);
    else if (targetDist >= this.scanDistance * 2)
      ship.setSpeedPercent(1);

    // Send warnings to target
    if (targetDist < this.scanDistance * 2)
    {
      if (!this.gaveFirstWarning)
      {
        TANK.main.Game.addEventLog('<Police>: Pilot, please stop your ship now for a random scan.');
        this.gaveFirstWarning = true;
        this.waitingForStop = true;
        this.patienceTimer = 0;
        this.scanTimer = 0;
      }
    }

    // Count down timer while waiting for player to stop
    if (this.waitingForStop)
    {
      this.patienceTimer += dt;

      // Check if player has stopped
      if (this.target.Ship.desiredSpeed < 0.01 && targetDist < this.scanDistance)
      {
        this.waitingForScan = true;
        this.scanTimer += dt;

        if (this.scanTimer >= this.scanTime)
        {
          if (Flags.wanted)
          {
            this.waitingForScan = false;
            this.waitingForStop = false;
            this.done = true;
            this.attack();
          }
          else
          {
            TANK.main.Game.addEventLog('<Police>: Alright, you\'re free to go.');
            this.waitingForScan = false;
            this.waitingForStop = false;
            this.done = true;
          }
        }
      }

      // If we run out of patience
      if (this.patienceTimer >= this.patienceTime && !this.waitingForScan)
      {
        // Give a second warning
        if (this.gaveFirstWarning && !this.gaveSecondWarning)
        {
          TANK.main.Game.addEventLog('<Police>: This is your last warning, cut your engines now.');
          this.gaveSecondWarning = true;
          this.patienceTimer = 0;
        }
        // After second warning, attack
        else if (this.gaveFirstWarning && this.gaveSecondWarning)
        {
          TANK.main.Game.addEventLog('<Police>: Time\'s up.');
          this.attack();
        }
      }
    }
  };
});
TANK.registerComponent('AIStolenEnforcer')
.includes(['Ship', 'RemoveOnLevelChange'])
.initialize(function()
{
  this.listenTo(this._entity, 'damaged', function()
  {
    if (this._entity.Ship.health <= 0.2 && this._entity.Ship.health >= 0.0)
    {
      this._entity.removeComponent('AIAttack');
      TANK.main.Game.addEventLog('Puffs of oxygen exit the ship as the pirates take to the escape pods. Looks like your work is done.');
      if (Flags['wanted'])
      {
        Flags['wanted'] = false;
        TANK.main.Game.addEventLog('Wanted status cleared.');
      }
      else
      {
        TANK.main.Game.unlockShip('enforcer');
      }
    }
  });
});
TANK.registerComponent('Asteroid')

.includes(['LightingAndDamage', 'Velocity', 'PixelCollider', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 1;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  this.resource = TANK.main.Resources.get('asteroid-01');

  // Set up collision
  this._entity.PixelCollider.collisionLayer = 'asteroids';
  this._entity.PixelCollider.collidesWith = ['bullets'];
  this._entity.PixelCollider.setImage(this.resource.diffuse);

  // Set up lighting
  this._entity.LightingAndDamage.setResource(this.resource);

  v.x = (Math.random() - 0.5) * 16;
  v.y = (Math.random() - 0.5) * 16;
  v.r = (Math.random() - 0.5) * 0.5;
  t.rotation = Math.random() * Math.PI * 2;

  //
  // Collision response
  //
  this.listenTo(this._entity, 'collide', function(obj, pixelPos)
  {
    var objPos = [obj.Pos2D.x, obj.Pos2D.y];
    var bullet = obj.Bullet;

    if (bullet && bullet.owner !== this._entity)
    {
      // Do damage
      obj.Life.life = 0;
      this._entity.LightingAndDamage.addDamage(pixelPos[0], pixelPos[1], bullet.damage * (30 + Math.random() * 30));

      // Spawn effect
      ParticleLibrary.damageMedium(objPos[0], objPos[1], obj.Pos2D.rotation + Math.PI);
    }
  });

  //
  // Draw code
  //
  this.draw = function(ctx, camera)
  {
    // Set up transform
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.resource.diffuse.width / -2, this.resource.diffuse.height / -2);

    // Draw the main buffer
    this._entity.LightingAndDamage.redraw();
    ctx.drawImage(this._entity.LightingAndDamage.mainBuffer.canvas, 0, 0);

    ctx.restore();
  };
});
TANK.registerComponent('AsteroidField')

.includes(['RemoveOnLevelChange'])

.construct(function()
{
  this.numAsteroids = 10;
  this.size = [5000, 5000];
  this.asteroids = [];
})

.serialize(function(serializer)
{
  serializer.property(this, 'numAsteroids', 20);
  serializer.property(this, 'size', [10000, 10000]);
})

.initialize(function()
{
  var rng = new RNG();
  for (var i = 0; i < this.numAsteroids; ++i)
  {
    var e = TANK.createEntity('Asteroid');
    e.Pos2D.x = rng.random(-this.size[0] / 2, this.size[0] / 2);
    e.Pos2D.y = rng.random(-this.size[1] / 2, this.size[1] / 2);
    TANK.main.addChild(e);
    this.asteroids.push(e);
  }

  this.update = function(dt)
  {
    for (var i = 0; i < this.asteroids.length; ++i)
    {
      var e = this.asteroids[i];
      if (e.Pos2D.x > this.size[0] / 2)
        e.Pos2D.x = -this.size[0] / 2;
      else if (e.Pos2D.y > this.size[1] / 2)
        e.Pos2D.y = -this.size[1] / 2;
      else if (e.Pos2D.x < -this.size[0] / 2)
        e.Pos2D.x = this.size[0] / 2;
      else if (e.Pos2D.y < -this.size[1] / 2)
        e.Pos2D.y = this.size[1] / 2;
    }
  };
});
TANK.registerComponent('Bullet')

.includes(['Pos2D', 'Velocity', 'Collider2D', 'Life'])

.construct(function()
{
  this.zdepth = 2;
  this.owner = null;
  this.damage = 0.2;
  this.trailEffect = 'mediumRailTrail';
  this.damageEffect = 'damageMedium';
  this.size = 3;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this._entity.Collider2D.collisionLayer = 'bullets';

  this.trailEmitter = ParticleLibrary[this.trailEffect]();

  TANK.main.Renderer2D.add(this);

  this.update = function(dt)
  {
    this.trailEmitter.Pos2D.x = t.x;
    this.trailEmitter.Pos2D.y = t.y;

    this._entity.Velocity.x += Math.cos(t.rotation) * this.accel * dt;
    this._entity.Velocity.y += Math.sin(t.rotation) * this.accel * dt;
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(1, 2);
    ctx.rotate(t.rotation);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, this.size, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
})

.uninitialize(function()
{
  TANK.main.removeChild(this.trailEmitter);
});
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
TANK.registerComponent('CircleCollider')

.construct(function()
{
  this.width = 10;
  this.height = 10;
  this.collisionLayer = '';
  this.collidesWith = [];

  this.radius = 5;

  this.setRadius = function(radius)
  {
    var space = this._entity.getFirstParentWithComponent('CollisionManager');
    if (this.image)
      space.CollisionManager.remove(this);

    this.radius = radius;
    this.width = radius * 2;
    this.height = this.width;

    space.CollisionManager.add(this);
  };

  this.testCollision = function(other)
  {
    var t = this._entity.Pos2D;
    var selfPos = [t.x, t.y];
    var otherPos = [other._entity.Pos2D.x, other._entity.Pos2D.y];

    return TANK.Math2D.pointDistancePoint(selfPos, otherPos) <= this.radius * TANK.main.Game.scaleFactor;
  };
})

.initialize(function()
{

});
TANK.registerComponent('Clouds')

.includes(['RemoveOnLevelChange'])

.construct(function()
{
  this.clouds = [];
  this.heightMap = [];
  this.zdepth = 5;

  this.numClouds = 1;
  this.fieldSize = [8750, 8750];
  this.cloudColor = [255, 255, 255];
  this.cloudSize = 512;
  this.cloudScale = 6;
  this.noiseFreq = 0.008 + Math.random() * 0.004;
  this.noiseAmplitude = 0.5 + Math.random() * 0.3;
  this.noisePersistence = 0.7 + Math.random() * 0.29;
  this.noiseOctaves = 2;
})

.serialize(function(serializer)
{
  serializer.property(this, 'numClouds', 100);
  serializer.property(this, 'cloudColor', [255, 255, 255]);
})

.initialize(function()
{
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(this.cloudSize, this.cloudSize);

  TANK.main.Renderer2D.add(this);

  // Iterate over every pixel
  this.forEachPixel = function(func)
  {
    for (var i = 0; i < this.cloudSize; ++i)
    {
      for (var j = 0; j < this.cloudSize; ++j)
      {
        func.apply(this, [i, j]);
      }
    }
  };

  //
  // Generate the cloud
  //

  // Fill heightmap
  for (var i = 0; i < this.cloudSize; ++i)
  {
    this.heightMap[i] = [];
    for (var j = 0; j < this.cloudSize; ++j)
      this.heightMap[i][j] = 0;
  }

  // Calculate height map
  noise.seed(Math.random());
  for (var n = 0; n < this.noiseOctaves; ++n)
  {
    this.forEachPixel(function(i, j)
    {
      this.heightMap[i][j] += noise.perlin2(i * this.noiseFreq, j * this.noiseFreq) * this.noiseAmplitude;
    });
    this.noiseAmplitude *= this.noisePersistence;
    this.noiseFreq *= 2;
  }

  // Normalize height map to [0, 1]
  this.heighestPoint = -Infinity;
  this.lowestPoint = Infinity;
  this.forEachPixel(function(i, j)
  {
    this.heighestPoint = Math.max(this.heighestPoint, this.heightMap[i][j]);
    this.lowestPoint = Math.min(this.lowestPoint, this.heightMap[i][j]);
  });
  this.forEachPixel(function(i, j)
  {
    this.heightMap[i][j] = (-this.lowestPoint + this.heightMap[i][j]) / (-this.lowestPoint + this.heighestPoint);
  });
  this.forEachPixel(function(i, j)
  {
    this.heightMap[i][j] = Math.round(this.heightMap[i][j] * 100) / 100;
  });

  // Fade out height map based on distance
  this.forEachPixel(function(i, j)
  {
    var dist = TANK.Math2D.pointDistancePoint([i, j], [this.cloudSize / 2, this.cloudSize / 2]);
    this.heightMap[i][j] *= -Math.pow((dist / (this.cloudSize / 2 + 2)) - 1, 3);
  });

  // Set pixels based on height
  this.forEachPixel(function(i, j)
  {
    var color = this.cloudColor.slice();
    color.push(Math.floor(this.heightMap[i][j] * 255));
    this.pixelBuffer.setPixel(i, j, color);
  });

  this.pixelBuffer.applyBuffer();

  //
  // Generate cloud positions
  //
  var rng = new RNG();
  for (var i = 0; i < this.numClouds; ++i)
  {
    this.clouds.push(
    {
      x: rng.random(-this.fieldSize[0] / 2, this.fieldSize[1] / 2),
      y: rng.random(-this.fieldSize[0] / 2, this.fieldSize[1] / 2),
      z: 0.2 + Math.random() * 0.8,
      r: Math.random() * Math.PI * 2
    });
  }

  this.draw = function(ctx, camera)
  {
    for (var i = 0; i < this.clouds.length; ++i)
    {
      var x = (this.clouds[i].x - camera.x * this.clouds[i].z) - window.innerWidth / 2;
      var y = (this.clouds[i].y - camera.y * this.clouds[i].z) - window.innerHeight / 2;
      while (x > this.fieldSize[0] / 2)
        x -= this.fieldSize[0];
      while (y > this.fieldSize[1] / 2)
        y -= this.fieldSize[1];
      while (x < -this.fieldSize[0] / 2)
        x += this.fieldSize[0];
      while (y < -this.fieldSize[1] / 2)
        y += this.fieldSize[1];

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(x, y);
      ctx.scale(this.cloudScale, this.cloudScale);
      ctx.rotate(this.clouds[i].r);
      ctx.translate(-this.cloudSize / 2, -this.cloudSize / 2);
      ctx.drawImage(this.pixelBuffer.canvas, 0, 0);
      ctx.restore();
    }

  };
})

.uninitialize(function()
{
});
TANK.registerComponent('DirectionalLight').includes('Pos2D');
TANK.registerComponent("DustField")

.construct(function()
{
  this.zdepth = 10;
  this.stars = [];
})

.initialize(function()
{
  for (var i = 0; i < 50; ++i)
  {
    this.stars.push(
    {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() + 1,
      size: 1 + Math.random()
    });
  }

  TANK.main.Renderer2D.add(this);

  this.draw = function(ctx, camera)
  {
    ctx.save();

    ctx.fillStyle = "#ddd";

    for (var i = 0; i < this.stars.length; ++i)
    {
      var x = (this.stars[i].x - camera.x * this.stars[i].z) - window.innerWidth / 2;
      var y = (this.stars[i].y - camera.y * this.stars[i].z) - window.innerHeight / 2;
      x %= window.innerWidth;
      y %= window.innerHeight;
      while (x < 0)
        x += window.innerWidth;
      while (y < 0)
        y += window.innerHeight;

      x -= (window.innerWidth * camera.z - window.innerWidth) * (0.5 / camera.z);
      y -= (window.innerHeight * camera.z - window.innerHeight) * (0.5 / camera.z);
      x *= camera.z;
      y *= camera.z;
      ctx.fillRect(x - window.innerWidth / 2, y - window.innerHeight / 2, this.stars[i].size, this.stars[i].size);
    }

    ctx.restore();
  };
});

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

  this.container.querySelector('.menu-options').style.height = '30%';

  // Fill out title
  if (this.won)
    this.container.querySelector('.menu-title').innerHTML = 'You made it';
  else
    this.container.querySelector('.menu-title').innerHTML = 'You died';

  // Fill out summary
  this.container.querySelector('.end-score').innerHTML = 'Final score - ' + this.score;
  this.container.querySelector('.end-summary').innerHTML = TANK.main.Game.getStoryText();

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
TANK.registerComponent('Engines')

.includes('Pos2D')

.construct(function()
{
  this.zdepth = 4;
  this.engineBuffer = new PixelBuffer();
  this.color = 'rgba(255, 0, 255, 0)';
  this.size = [30, 14];
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;

  TANK.main.Renderer2D.add(this);

  this.drawEngine = function()
  {
    this.engineBuffer.createBuffer(this.size[0], this.size[1]);

    var context = this.engineBuffer.context;
    var canvas = this.engineBuffer.canvas;

    var c1 = [canvas.width * 0.9, canvas.height / 2, canvas.height * 0.1];
    var c2 = [canvas.width * 0.75, canvas.height / 2, canvas.height / 2];

    var grad = context.createRadialGradient(c1[0], c1[1], c1[2], c2[0], c2[1], c2[2]);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, this.color);

    context.scale(2, 1);
    context.translate(canvas.width / -2, 0);

    context.fillStyle = grad;
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  this.draw = function(ctx, camera)
  {
    if (ship.thrustAlpha <= 0)
      return;

    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(ship.resource.diffuse.width / -2, ship.resource.diffuse.height / -2);
    ctx.globalAlpha = ship.thrustAlpha;

    for (var i = 0; i < ship.shipData.engines.length; ++i)
    {
      var engine = ship.shipData.engines[i];

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(this.engineBuffer.width / -1, this.engineBuffer.height / -2);
      ctx.drawImage(this.engineBuffer.canvas, engine.x, engine.y);
      ctx.restore();
    }

    ctx.restore();
  };

  this.drawEngine();
});
var Events = {};

//
// Null event
//
Events.empty =
{
  text: 'You appear to be alone.'
};

//
// Begin event
//
Events.start =
{
  story: {eventText: 'You began your journey.'}
};

//
// Civilian ship event
//
Events.civilian =
{
  text: 'Your scanners pick up the signature of a small ship nearby.',
  spawns: ['civilian']
};

//
// Pirate event
//
Events.pirate =
{
  text: 'Alarms begin sounding as soon as the warp is complete, you are under attack!',
  spawns: ['pirate', 'warpJammer'],
};

//
// Police ship event
//
Events.police =
{
  spawns: ['police', 'warpJammer'],
};

//
// Unlock Enforcer event
//
Events.returnStolenEnforcer =
{
  text: 'A police ship hails you and requests that you approach within comms distance.',
  spawns:
  [
    {
      components:
      {
        Pos2D: {x: 2000, y: 0},
        Ship: {shipType: 'enforcer'},
        RemoveOnLevelChange: {},
        TriggerRadius: {radius: 1000, events: [{probability: 1, name: 'returnStolenEnforcer_start'}]}
      }
    }
  ]
};

Events.returnStolenEnforcer_start =
{
  text: '"Greetings pilot, I\'m in a bit of trouble here. I was out on patrol with my buddy when we were ambushed by pirates! They disabled my ship and captured his. If I don\'t get that ship back I\'ll be in big trouble. They were heading towards a red dwarf star when I last saw them."',
  setFlags: ['returnStolenEnforcer'],
  script: function()
  {
    if (Flags['wanted'])
    {
      TANK.main.Game.addEventLog('"If you could shoot up the stolen ship just enough for them to abandon it, I\'ll see that your wanted status is cleared".');
    }
    else
    {
      TANK.main.Game.addEventLog('"If you could shoot up the stolen ship just enough for them to abandon it, I\'ll see that you are rewarded well."');
    }
  }
};

Events.returnStolenEnforcerBattle =
{
  text: 'Just ahead you see the stolen police cruiser. Looks like they aren\'t prepared to chat.',
  requireFlags: ['returnStolenEnforcer'],
  script: function()
  {
    var rng = new RNG();
    var spawnPos = [rng.random(-3000, 3000), rng.random(-3000, 3000)];

    var e = TANK.createEntity(['AIStolenEnforcer', 'AIAttackPlayer']);
    e.Pos2D.x = spawnPos[0];
    e.Pos2D.y = spawnPos[1];
    e.Ship.shipType = 'enforcer';
    TANK.main.addChild(e);

    var numEscorts = rng.random(1, 2);
    e = TANK.createEntity(['AIAttackPlayer']);
    e.Pos2D.x = spawnPos[0] + rng.random(-1000, 1000);
    e.Pos2D.y = spawnPos[1] + rng.random(-1000, 1000);
    e.Ship.shipType = 'fighter';
    TANK.main.addChild(e);
  }
};

//
// Unlock Blade event
//
Events.investigatePrototypeShip =
{
  text: 'The research station up ahead seems to actually be inhabited by someone.',
  script: function()
  {
    var entities = TANK.main.getChildrenWithComponent('LevelProp');
    var station;
    for (var i in entities)
      if (entities[i].LevelProp.resourceName === 'station-01')
        station = entities[i];

    var e = TANK.createEntity('TriggerRadius');
    e.TriggerRadius.radius = 1000;
    e.TriggerRadius.events = [{probability: 1, name: 'investigatePrototypeShip_start'}];
    e.Pos2D.x = station.Pos2D.x;
    e.Pos2D.y = station.Pos2D.y;
    TANK.main.addChild(e);
  }
};

Events.investigatePrototypeShip_start =
{
  script: function()
  {
    TANK.main.Game.addEventLog('As you approach the research station you are contacted by someone inside.');
    TANK.main.Game.addEventLog('"Hi there! I don\'t suppose you\'d be interested in giving me a lift? I\'m a space scientist you see, and there is some important science to be done at the old battlefield near here."');
  },
  options:
  [
    {
      text: 'Sure thing, come on in!',
      responseText: '"Thanks partner!"',
      setFlags: ['investigatePrototypeShip']
    },
    {
      text: 'Sorry, no room for scientists aboard.',
      responseText: '"Dang."'
    }
  ]
};

Events.investigatePrototypeShipEncounter =
{
  text: '"Ah ha! See that ship up ahead? That\'s what I\'m looking for. Can you get me a bit closer?"',
  requireFlags: ['investigatePrototypeShip'],
  script: function()
  {
    var rng = new RNG();
    var spawnPos = [rng.random(-3000, 3000), rng.random(-3000, 3000)];

    var e = TANK.createEntity(['Ship', 'TriggerRadius']);
    e.Pos2D.x = spawnPos[0];
    e.Pos2D.y = spawnPos[1];
    e.Ship.shipType = 'blade';
    e.TriggerRadius.radius = 700;
    e.TriggerRadius.events = [{probability: 1, name: 'investigatePrototypeShip_approach'}];
    TANK.main.addChild(e, 'PrototypeShip');
  }
};

Events.investigatePrototypeShip_approach =
{
  text: 'The scientist throws on a space suit and hops out to investigate the prototype ship.',
  script: function()
  {
    TANK.main.Game.addEventLog('"Oh jeeze! This ship is crawling with rogue bomb bots! There\'s no way I can get inside with these guys around..."');
  },
  options:
  [
    {
      text: 'Try to clear the bots by shooting at them.',
      events: [{probability: 1, name: 'investigatePrototypeShip_explode'}]
    },
    {
      text: 'Try scraping the bots off with the hull of your ship.',
      events: [{probability: 1, name: 'investigatePrototypeShip_successA'}]
    }
  ]
};

Events.investigatePrototypeShip_explode =
{
  text: 'Despite your best efforts to single out bots not near others, a chain reaction begins and the flames engulf both your ship and the mysterious prototype ship. Your ship survives with serious damage, but the prototype ship is lost.',
  script: function()
  {
    TANK.main.Game.player.Ship.health /= 2;
    for (var i = 0; i < 10; ++i)
      TANK.main.Game.player.Ship.addRandomDamage(3 + Math.random() * 6);
    var e = TANK.main.getChild('PrototypeShip');
    e.Ship.health = -1;
  }
};

Events.investigatePrototypeShip_successA =
{
  text: 'A couple bots explode as they are nudged into open space, causing minor damage to your hull, but on the whole your plan works out ok.',
  script: function()
  {
    TANK.main.Game.player.Ship.health -= TANK.main.Game.player.Ship.health / 4;
    for (var i = 0; i < 5; ++i)
      TANK.main.Game.player.Ship.addRandomDamage(2 + Math.random() * 3);
  }
};

//
// Derelict event
//
Events.derelict =
{
  text: 'Your scanners pick up the signature of a mid sized ship, but the signal is much fainter than you would expect. The signal originates from a short distance ahead.',
  spawns: ['derelict']
};

Events.derelict_1a =
{
  text: 'As you approach, a quick bio scan reveals no lifeforms. Looks like you arrived a bit too late. Or right on time, depending on your outlook.',
  story: {eventText: 'You came across a disabled ship with no crew left alive at {{location}}'}
};

Events.derelict_1b =
{
  text: 'Upon approaching, you are contacted by the ship. The captain informs you that they have been stranded for days, and pleads with you to give them 3 fuel cells so they can return home.',
  options:
  [
    {
      text: 'Decline, you need all the fuel you\'ve got.',
      responseText: 'The tension in the air as you deliver the bad news is palpable. The comms connection disconnects.',
      story: {eventText: 'You came across a disabled ship at {{location}} but refused to help them out.'}
    },
    {
      text: 'Agree to give them some fuel. Your shields must shut off completely to make the transfer.',
      events:
      [
        {probability: 0.5, name: 'derelict_2a'},
        {probability: 0.5, name: 'derelict_2b'}
      ]
    }
  ]
};

Events.derelict_2a =
{
  text: 'The captain thanks you profusely and speeds off.',
  story: {eventText: 'You came across a disabled ship at {{location}} and helped them out with some fuel.'},
  setFlags: ['rescuedDerelict'],
  dispatchEvent: 'derelictleave',
  script: function()
  {
    TANK.main.Game.takePlayerFuel(3);
  }
};

Events.derelict_2b =
{
  text: 'As soon as you disable your shields, several hostile ship signatures show up on the scanner. Looks like you are about to regret your helpful nature.',
  story: {eventText: 'You came across a disabled ship at {{location}} and were ambushed by pirates.'},
  spawns:
  [
    'pirate',
    'pirate',
    'warpJammer'
  ],
  script: function()
  {
    TANK.main.Game.killPlayerShields();
  }
};

Events.derelictReturn =
{
  text: 'Just ahead you see the same ship that you rescued earlier. The captain says they have since filled up and would be happy to transfer you some fuel as thanks if you approach closer.',
  requireFlags: ['rescuedDerelict'],
  unsetFlags: ['rescuedDerelict'],
  spawns:
  [
    {
      components:
      {
        Pos2D: {x: 1000, y: 0},
        Ship: {shipType: 'frigate'},
        AIDerelict: {},
        TriggerRadius: {radius: 500, events: [{probability: 1, name: 'derelictGiveFuel'}]}
      }
    }
  ]
};

Events.derelictGiveFuel =
{
  story: {eventText: 'You ran into the ship you previously rescued and they gave you some fuel.'},
  dispatchEvent: 'derelictleave',
  script: function()
  {
    var amount = Math.floor(1 + Math.random() * 3);
    var derelict = TANK.main.getChildrenWithComponent('AIDerelict');
    derelict = derelict[Object.keys(derelict)[0]];

    for (var i = 0; i < amount; ++i)
    {
      var e = TANK.createEntity('FuelCell');
      e.Pos2D.x = derelict.Pos2D.x;
      e.Pos2D.y = derelict.Pos2D.y;
      TANK.main.addChild(e);
    }
  }
};

//
// Test event
//
Events.test =
{
  text: 'A test event'
};
var Flags = {};


TANK.registerComponent('FollowMouse')
.includes('Pos2D')
.initialize(function()
{
  this.update = function(dt)
  {
    this._entity.Pos2D.x = TANK.main.Game.mousePosWorld[0];
    this._entity.Pos2D.y = TANK.main.Game.mousePosWorld[1];
  };
});
TANK.registerComponent('FuelCell')

.includes(['LightingAndDamage', 'Velocity', 'Collider2D', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 1;
  this.resourceName = 'fuel-cell';
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  // Set up lighting
  this.resource = TANK.main.Resources.get(this.resourceName);
  this._entity.LightingAndDamage.setResource(this.resource);

  // Set up collision
  this._entity.Collider2D.collisionLayer = 'pickups';

  // Initial velocity / rotation
  v.x = (Math.random() - 0.5) * 16;
  v.y = (Math.random() - 0.5) * 16;
  v.r = (Math.random() - 0.5) * 0.5;
  t.rotation = Math.random() * Math.PI * 2;

  //
  // Draw code
  //
  this.draw = function(ctx, camera)
  {
    // Set up transform
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.resource.diffuse.width / -2, this.resource.diffuse.height / -2);

    // Draw the main buffer
    this._entity.LightingAndDamage.redraw();
    ctx.drawImage(this._entity.LightingAndDamage.mainBuffer.canvas, 0, 0);

    ctx.restore();
  };
});
TANK.registerComponent('Game')

.construct(function()
{
  // Game scale factor
  this.scaleFactor = 2;
  this.volume = 0.5;

  // Menu options
  this.menuOptions = [];

  // Event log
  this.eventLogs = [];
  this.eventLogsTimed = [];
  this.story = [];

  // Mouse positions
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];

  // Global light direction
  this.lightDir = 0;

  // Current ship selection
  this.playerShipSelection = 'frigate';

  // Unlocked ships
  this.unlockedShips =
  {
    'frigate': true,
    'albatross': true
  };
})

.initialize(function()
{
  var that = this;
  var resources = this._entity.Resources;

  // Configure Lightr
  Lightr.minLightIntensity = 0.2;
  Lightr.lightDiffuse = [0.8, 0.8, 1];

  //
  // Load resources
  //
  function loadLighting(name, path, resources, doneCallback)
  {
    var res = {};
    res.diffuse = resources.get(name + '-diffuse');
    res.normals = resources.get(name + '-normals');
    res.lightBuffers = Lightr.bake(6, res.diffuse, res.normals);
    doneCallback(res);
  };

  resources.add('asteroid-01-diffuse', 'res/img/asteroid-01-diffuse.png');
  resources.add('asteroid-01-normals', 'res/img/asteroid-01-normals.png');
  resources.add('asteroid-01', null, ['asteroid-01-diffuse', 'asteroid-01-normals'], loadLighting);

  resources.add('fighter-diffuse', 'res/img/fighter.png');
  resources.add('fighter-normals', 'res/img/fighter-normals.png');
  resources.add('fighter', null, ['fighter-diffuse', 'fighter-normals'], loadLighting);

  resources.add('bomber-diffuse', 'res/img/bomber.png');
  resources.add('bomber-normals', 'res/img/bomber-normals.png');
  resources.add('bomber', null, ['bomber-diffuse', 'bomber-normals'], loadLighting);

  resources.add('frigate-diffuse', 'res/img/frigate.png');
  resources.add('frigate-normals', 'res/img/frigate-normals.png');
  resources.add('frigate', null, ['frigate-diffuse', 'frigate-normals'], loadLighting);

  resources.add('ship-blade-diffuse', 'res/img/ship-blade-diffuse.png');
  resources.add('ship-blade-normals', 'res/img/ship-blade-normals.png');
  resources.add('ship-blade', null, ['ship-blade-diffuse', 'ship-blade-normals'], loadLighting);

  resources.add('ship-albatross-diffuse', 'res/img/ship-albatross-diffuse.png');
  resources.add('ship-albatross-normals', 'res/img/ship-albatross-normals.png');
  resources.add('ship-albatross', null, ['ship-albatross-diffuse', 'ship-albatross-normals'], loadLighting);

  resources.add('ship-rhino-diffuse', 'res/img/ship-rhino-diffuse.png');
  resources.add('ship-rhino-normals', 'res/img/ship-rhino-normals.png');
  resources.add('ship-rhino', null, ['ship-rhino-diffuse', 'ship-rhino-normals'], loadLighting);

  resources.add('ship-enforcer-diffuse', 'res/img/ship-enforcer-diffuse.png');
  resources.add('ship-enforcer-normals', 'res/img/ship-enforcer-normals.png');
  resources.add('ship-enforcer', null, ['ship-enforcer-diffuse', 'ship-enforcer-normals'], loadLighting);

  resources.add('station-01-diffuse', 'res/img/station-01-diffuse.png');
  resources.add('station-01-normals', 'res/img/station-01-normals.png');
  resources.add('station-01', null, ['station-01-diffuse', 'station-01-normals'], loadLighting);

  resources.add('fuel-cell-diffuse', 'res/img/fuel-cell-diffuse.png');
  resources.add('fuel-cell-normals', 'res/img/fuel-cell-normals.png');
  resources.add('fuel-cell', null, ['fuel-cell-diffuse', 'fuel-cell-normals'], loadLighting);

  resources.add('ball-diffuse', 'res/img/ball-diffuse.png');
  resources.add('ball-normals', 'res/img/ball-normals.png');
  resources.add('ball', null, ['ball-diffuse', 'ball-normals'], loadLighting);

  //
  // Rebuild lighting
  //
  this.rebuildLighting = function()
  {
    var resMap = resources.getAll();
    for (var i in resMap)
    {
      var res = resMap[i];
      if (res.lightBuffers)
        res.lightBuffers = Lightr.bake(8, res.diffuse, res.normals);
    }
  };

  //
  // Save the current game
  //
  this.save = function(slot)
  {
    if (!slot)
      slot = 'main';
    var save = {unlockedShips: this.unlockedShips};
    localStorage['save-' + slot] = JSON.stringify(save);
  };

  //
  // Load a save slot
  //
  this.load = function(slot)
  {
    if (!slot)
      slot = 'main';
    var saveData = localStorage['save-' + slot];
    if (saveData)
    {
      var save = JSON.parse(saveData);
      this.unlockedShips = save.unlockedShips;
    }
  };

  //
  // Update the mouse world position
  //
  this.updateMousePos = function(pos)
  {
    this.mousePosScreen = [pos[0], pos[1]];
    this.mousePosWorld = pos;
    this.mousePosWorld[0] -= window.innerWidth / 2;
    this.mousePosWorld[1] -= window.innerHeight / 2;
    this.mousePosWorld[0] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[1] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[0] += TANK.main.Renderer2D.camera.x;
    this.mousePosWorld[1] += TANK.main.Renderer2D.camera.y;
  };

  //
  // Update light source
  //
  this.updateLightSource = function()
  {
    if (!this.lightSource)
    {
      this.lightSource = TANK.createEntity('Star');
      TANK.main.addChild(this.lightSource);
    }

    this.lightSource.Pos2D.x = Math.cos(this.lightDir) * 5000;
    this.lightSource.Pos2D.y = Math.sin(this.lightDir) * 5000;

    if (this.currentLocation)
    {
      this.lightSource.Star.outerColor = this.currentLocation.lightColor.map(function(val) {return Math.floor(val * 255);});
    }
  };

  //
  // Move to the main menu state
  //
  this.goToMainMenu = function()
  {
    TANK.main.Renderer2D.camera.z = 1;
    TANK.main.Renderer2D.camera.x = 0;
    TANK.main.Renderer2D.camera.y = 0;

    // Remove any existing objects
    this.player = null;
    TANK.main.removeAllChildren();
    this.clearEventLog();

    // Build main menu scene
    this.lightDir = Math.random() * Math.PI * 2;
    this.mainMenu = TANK.createEntity('MainMenu');
    TANK.main.addChild(this.mainMenu);

    // Create light source entity
    this.updateLightSource();

    // Handle main menu interactions
    this.listenTo(this.mainMenu, 'newgame', function()
    {
      TANK.main.removeChild(this.mainMenu);
      this.goToShipSelection();
    });

    // Remove event log
    if (this.eventLogUI)
    {
      this.eventLogUI.teardown();
      this.eventLogUI = null;
    }
  };

  //
  // Go to selection screen
  //
  this.goToShipSelection = function()
  {
    // Build menu
    this.load();
    this.shipSelection = TANK.createEntity('ShipSelection');
    TANK.main.addChild(this.shipSelection);

    // Handle interaction
    this.listenTo(this.shipSelection, 'selectionmade', function(selection)
    {
      TANK.main.removeChild(this.shipSelection);
      this.playerShipSelection = selection;
      this.goToNode(TANK.main.MapGeneration.map);
    });
  };

  //
  // Go to end screen
  //
  this.goToWinScreen = function()
  {
    this.clearEventLog();
    this.endScreen = TANK.createEntity('EndScreen');
    this.endScreen.EndScreen.won = true;
    TANK.main.addChild(this.endScreen);

    this.listenTo(this.endScreen, 'back', function()
    {
      this.goToMainMenu();
    });
  };

  this.goToLoseScreen = function()
  {
    this.clearEventLog();
    this.endScreen = TANK.createEntity('EndScreen');
    this.endScreen.EndScreen.won = false;
    TANK.main.addChild(this.endScreen);

    this.listenTo(this.endScreen, 'back', function()
    {
      this.goToMainMenu();
    });
  };

  //
  // Pick a random weighted index
  //
  this.randomWeighted = function(weights)
  {
    var weightsNoZero = weights.filter(function(val) {return val > 0;});
    var minValue = Math.min.apply(null, weightsNoZero);
    var weightsNormalized = weights.map(function(val) {return val * (1 / minValue);});
    var weightArray = [];
    for (var i = 0; i < weightsNormalized.length; ++i)
    {
      for (var j = 0; j < weightsNormalized[i]; ++j)
        weightArray.push(i);
    }

    var rng = new RNG();
    var index = rng.random(0, weightArray.length);
    return weightArray[index];
  };

  //
  // Add an event log
  //
  this.addEventLog = function(logText)
  {
    this.eventLogs.push({text: logText});
    var logContainer = document.querySelector('.event-log');
    logContainer.scrollTop = logContainer.scrollHeight;
  };

  this.addEventLogTimed = function(logText, time)
  {
    this.eventLogsTimed.push({text: logText, time: time});
  };

  //
  // Clear event log
  //
  this.clearEventLog = function()
  {
    while (this.eventLogs.length)
      this.eventLogs.pop();
  };

  //
  // Story log
  //
  this.addStory = function(eventText)
  {
    var expandMacros = function(str)
    {
      str = str.replace(/\{\{location\}\}/g, this.currentLocation.name);
      return str;
    }.bind(this);

    this.story.push(
    {
      eventText: expandMacros(eventText)
    });
  };

  this.getStoryText = function()
  {
    var storyText = '';
    for (var i = 0; i < this.story.length; ++i)
    {
      var story = this.story[i];
      storyText += story.eventText + '\n';
    }

    return storyText;
  };

  //
  // Show location options
  //
  this.showLocationOptions = function()
  {
    // Verify jump is possible
    if (!this.warpReady)
    {
      this.addEventLog('Warp drive is not fully charged');
      return;
    }
    if (this.player.Ship.fuel < 1)
    {
      this.addEventLog('No fuel.');
      return;
    }

    // Build option list
    var options = [];
    for (var i = 0; i < this.currentNode.paths.length; ++i)
    {
      var node = this.currentNode.paths[i];
      var location = Locations[node.locationName];
      var desc = (node.depth - this.currentNode.depth === 1) ? 'Direct route' : 'Indirect route';
      options.push({text: location.name + ' (' + desc + ')'});
    }

    // Show option menu
    this.choiceScreen = TANK.createEntity('ChoiceScreen');
    this.choiceScreen.ChoiceScreen.title = 'Choose destination';
    this.choiceScreen.ChoiceScreen.options = options;
    TANK.main.addChild(this.choiceScreen);
    TANK.main.pause();

    // Wait for choice
    this.listenTo(this.choiceScreen, 'choicemade', function(index)
    {
      TANK.main.unpause();
      this.player.Ship.fuel -= 1;
      this.goToNode(this.currentNode.paths[index]);
    });
  };

  //
  // Go to a new node on the map
  //
  this.goToNode = function(node)
  {
    var e = TANK.createEntity('WarpEffect');
    TANK.main.addChild(e);
    this.warping = true;
    this.warpTimer = 3;
    this.pendingNode = node;
  };

  //
  // Load a location
  //
  this.loadNewLocation = function(name)
  {
    // Clear existing objects
    TANK.main.dispatch('locationchange');

    // Grab the location object
    var location = Locations[name];
    this.currentLocation = location;

    // Generate paths
    TANK.main.MapGeneration.generateChildren(this.currentNode);

    // Set location attributes
    TANK.main.Renderer2D.clearColor = 'rgba(' + location.bgColor.join(', ') + ')';
    Lightr.lightDiffuse = location.lightColor;
    this.lightDir = Math.random() * Math.PI * 2;
    this.rebuildLighting();
    this.updateLightSource();

    // Create player entity if it doesn't exist
    if (!this.player)
    {
      this.player = TANK.createEntity('Player');
      this.player.Ship.shipData = new Ships[this.playerShipSelection]();
      TANK.main.addChild(this.player);
    }

    // Build event log ractive
    if (!this.eventLogUI)
    {
      this.eventLogUI = new Ractive(
      {
        el: 'eventLogContainer',
        template: '#eventLogTemplate',
        data: {logs: this.eventLogs}
      });
    }

    // Position player
    this.player.Pos2D.x = 0;
    this.player.Pos2D.y = 0;

    this.addEventLog('Warp complete. ' + this.player.Ship.fuel + ' fuel cells remaining.');

    // Spawn location objects
    for (var i = 0; i < location.spawns.length; ++i)
    {
      var spawn = location.spawns[i];

      // Using Spawns library
      if (typeof spawn === 'string')
      {
        Spawns[spawn]();
      }
      // Or using an object literal as a prototype
      else
      {
        var e = TANK.createEntity();
        e.load(spawn);
        TANK.main.addChild(e);
      }
    }

    // Log location text
    this.addEventLog(location.text);

    // Trigger location event
    if (location.events && location.events.length > 0)
    {
      // Map the event probabilities
      var weights = location.events.map(function(ev)
      {
        // If the event requires any flags that aren't set, modify
        // probability to 0
        if (Events[ev.name].requireFlags)
        {
          var requireFlags = Events[ev.name].requireFlags;
          for (var i = 0; i < requireFlags.length; ++i)
          {
            if (!Flags[requireFlags[i]])
              return 0;
          }
        }

        // Otherwise, return regular probability
        return ev.probability;
      });

      // Pick a random event
      var chosenIndex = this.randomWeighted(weights);
      if (typeof chosenIndex !== 'undefined')
      {
        var chosenEvent = location.events[chosenIndex];
        this.triggerEvent(chosenEvent.name);
      }
    }

    // Log default tutorial message
    this.warpReady = false;
    this.player.Ship.warpCharge = 0;
    this.addEventLog('Warp drive charging...');

    // If this node is the end node, then we win
    if (this.currentNode.depth >= TANK.main.MapGeneration.numLevels)
      this.goToWinScreen();
  };

  //
  // Trigger an event
  //
  this.triggerEvent = function(eventName)
  {
    var event = Events[eventName];
    event.spawns = event.spawns || [];
    event.options = event.options || [];

    // Show event text
    this.addEventLog(event.text);

    // Add event story
    if (event.story)
    {
      this.addStory(event.story.eventText);
    }

    // Call event script
    if (event.script)
      event.script();

    // Set any event flags
    if (event.setFlags)
    {
      for (var i = 0; i < event.setFlags.length; ++i)
        Flags[event.setFlags[i]] = true;
    }

    // Unset any event flags
    if (event.unsetFlags)
    {
      for (var i = 0; i < event.unsetFlags.length; ++i)
        Flags[event.unsetFlags[i]] = false;
    }

    // Spawn event entities
    for (var i = 0; i < event.spawns.length; ++i)
    {
      var spawn = event.spawns[i];

      // Using Spawns library
      if (typeof spawn === 'string')
      {
        Spawns[spawn]();
      }
      // Or using an object literal as a prototype
      else
      {
        var e = TANK.createEntity();
        e.load(spawn);
        TANK.main.addChild(e);
      }
    }

    // Dispatch any messages the event has
    if (event.dispatchEvent)
      TANK.main.dispatch(event.dispatchEvent);

    // If the event has options, wait for a choice to be made
    if (event.options.length > 0)
    {
      this.eventAwaitingInput = event;
      this.choiceScreen = TANK.createEntity('ChoiceScreen');
      this.choiceScreen.ChoiceScreen.options = event.options;
      TANK.main.addChild(this.choiceScreen);
      this.listenTo(this.choiceScreen, 'choicemade', this.handleOptionChoice);
      TANK.main.pause();
    }
  };

  //
  // Handle event option choice
  //
  this.handleOptionChoice = function(index)
  {
    TANK.main.unpause();

    // Show response text
    var chosenOption = this.eventAwaitingInput.options[index];
    if (chosenOption.responseText)
      this.addEventLog(chosenOption.responseText);

    // Add story
    if (chosenOption.story)
      this.addStory(chosenOption.story.eventText);

    // Set any event flags
    if (chosenOption.setFlags)
    {
      for (var i = 0; i < chosenOption.setFlags.length; ++i)
        Flags[chosenOption.setFlags[i]] = true;
    }

    // Unset any event flags
    if (chosenOption.unsetFlags)
    {
      for (var i = 0; i < chosenOption.unsetFlags.length; ++i)
        Flags[chosenOption.unsetFlags[i]] = false;
    }

    // Trigger an event, if any
    if (chosenOption.events)
    {
      var weights = chosenOption.events.map(function(ev) {return ev.probability;});
      var chosenIndex = this.randomWeighted(weights);
      var chosenEvent = chosenOption.events[chosenIndex];
      this.triggerEvent(chosenEvent.name);
    }
  };

  //
  // Player manipulation
  //
  this.givePlayerFuel = function(amount)
  {
    if (amount > 1)
      this.addEventLog('You receive ' + amount + ' fuel cells.');
    else
      this.addEventLog('You receive ' + amount + ' fuel cell.');

    this.player.Ship.fuel += amount;
  };

  this.takePlayerFuel = function(amount)
  {
    if (amount > 1)
      this.addEventLog('You lose ' + amount + ' fuel cells.');
    else
      this.addEventLog('You lose ' + amount + ' fuel cell.');

    this.player.Ship.fuel -= amount;
  };

  this.resetPlayerWarp = function()
  {
    this.player.Ship.warpCharge = 0;
    this.addEventLog('Your warp drive was jammed and the charge lost.');
  };

  this.killPlayerShields = function()
  {
    this.player.Ship.shieldObj.Shield.health = 0;
    this.player.Ship.shieldObj.Shield.burstTimer = this.player.Ship.shieldObj.Shield.burstTime;
    this.player.Ship.shieldObj.Shield.recovering = true;
    this.addEventLog('Your shields have been disabled.');
  };

  //
  // Unlock methods
  //
  this.unlockShip = function(name)
  {
    var shipData = new Ships[name]();
    this.addEventLog('You can now choose the ' + shipData.name + ' when beginning a new game.');
    this.unlockedShips[name] = true;
    this.save();
  };

  this.shipUnlocked = function(name)
  {
    return this.unlockedShips[name];
  }

  //
  // Resource load handler
  //
  this.listenTo(TANK.main, 'resourcesloaded', function()
  {
    this.goToMainMenu();
  });

  //
  // Game start handler
  //
  this.listenTo(TANK.main, 'start', function()
  {
    resources.load();
  });

  //
  // Game end handler
  //
  this.listenTo(TANK.main, 'gamewin', function()
  {
    this.goToWinScreen();
  });

  this.listenTo(TANK.main, 'gamelose', function()
  {
    this.goToLoseScreen();
  });

  //
  // Input handlers
  //
  this.listenTo(TANK.main, 'mousemove', function(e)
  {
    this.updateMousePos([e.x, e.y]);
  });

  this.listenTo(TANK.main, 'mousewheel', function(e)
  {
    if (this.warping)
      return;
    var delta = e.wheelDelta;
    TANK.main.Renderer2D.camera.z += delta * 0.005 * (TANK.main.Renderer2D.camera.z * 0.1);
    if (TANK.main.Renderer2D.camera.z < 0.5)
      TANK.main.Renderer2D.camera.z = 0.5;
    if (TANK.main.Renderer2D.camera.z > 5)
      TANK.main.Renderer2D.camera.z = 5;
  });

  this.listenTo(TANK.main, 'keydown', function(e)
  {
    // Key to begin jump
    if (e.keyCode === TANK.Key.J)
    {
      this.showLocationOptions();
    }

    // Numbered choice keys
    if (e.keyCode >= TANK.Key.NUM0 && e.keyCode <= TANK.Key.NUM9)
    {
      // 0 index choice from 1 key
      var choice = e.keyCode - TANK.Key.NUM1;

      // Choose an answer for an event
      if (this.eventAwaitingInput)
      {
        if (choice < this.eventAwaitingInput.options.length)
        {


          this.eventAwaitingInput = null;
        }
      }
    }
  });

  //
  // Update
  //
  this.update = function(dt)
  {
    // Check if player is ready to warp
    if (this.player)
    {
      if (this.player.Ship.warpCharge >= this.player.Ship.warpChargeTime && !this.warpReady)
      {
        this.addEventLog('...Warp drive charged. Press J to warp when ready.');
        this.warpReady = true;
      }
    }

    // Handle timed event logs
    for (var i = 0; i < this.eventLogsTimed.length; ++i)
    {
      var log = this.eventLogsTimed[i];
      log.time -= dt;
      if (log.time <= 0)
        this.addEventLog(log.text);
    }
    this.eventLogsTimed = this.eventLogsTimed.filter(function(val) {return val.time > 0;});

    // Handle warp logic
    if (this.warpTimer > 0)
    {
      // Countdown timer to warp
      this.warpTimer -= dt;
      if (this.warpTimer <= 0)
      {
        this.warping = false;
        this.currentNode = this.pendingNode;
        this.loadNewLocation(this.currentNode.locationName);
      }
    }
  };
});

TANK.registerComponent("Glow")

.includes(["Pos2D", "Velocity", "Life"])

.construct(function()
{
  this.zdepth = 5;
  this.radius = 3;
  this.innerRadius = 1;
  this.alpha = 1;
  this.colorA = "rgba(255, 255, 255, 0.2)";
  this.colorB = "rgba(150, 150, 255, 0.05)";
  this.colorC = "rgba(80, 80, 150, 0.0)";
  this.alphaDecay = 0;
  this.friction = 1;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  // Make buffer
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(this.radius * 2, this.radius * 2);

  TANK.main.Renderer2D.add(this);

  // Draw glow
  this.redraw = function()
  {
    var grad = this.pixelBuffer.context.createRadialGradient(this.radius, this.radius, this.innerRadius, this.radius, this.radius, this.radius);
    grad.addColorStop(0, this.colorA);
    grad.addColorStop(0.5, this.colorB);
    grad.addColorStop(1, this.colorC);
    this.pixelBuffer.context.clearRect(0, 0, this.pixelBuffer.width, this.pixelBuffer.height);
    this.pixelBuffer.context.fillStyle = grad;
    this.pixelBuffer.context.beginPath();
    this.pixelBuffer.context.arc(this.pixelBuffer.width / 2, this.pixelBuffer.height / 2, this.pixelBuffer.width / 2, Math.PI * 2, false);
    this.pixelBuffer.context.fill();
    this.pixelBuffer.context.closePath();
  }

  this.draw = function(ctx, camera, dt)
  {
    if (this.alphaDecay > 0 && this.alpha > 0)
    {
      this.alpha -= this.alphaDecay * dt;
      this.redraw();
      if (this.alpha < 0)
        this.alpha = 0;
    }
    v.x *= this.friction;
    v.y *= this.friction;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(-this.radius, -this.radius);
    ctx.drawImage(this.pixelBuffer.canvas, 0, 0);
    ctx.restore();
  };
});
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

TANK.registerComponent('LevelProp')

.includes(['LightingAndDamage', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 0;
  this.resourceName = '';
})

.serialize(function(serializer)
{
  serializer.property(this, 'zdepth', 0);
  serializer.property(this, 'resourceName', '');
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  // Set up lighting
  this.resource = TANK.main.Resources.get(this.resourceName);
  this._entity.LightingAndDamage.setResource(this.resource);

  //
  // Draw code
  //
  this.draw = function(ctx, camera)
  {
    // Set up transform
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.resource.diffuse.width / -2, this.resource.diffuse.height / -2);

    // Draw the main buffer
    this._entity.LightingAndDamage.redraw();
    ctx.drawImage(this._entity.LightingAndDamage.mainBuffer.canvas, 0, 0);

    ctx.restore();
  };
});
TANK.registerComponent("Life")

.construct(function()
{
  this.life = 5;
})

.initialize(function()
{
  this.update = function(dt)
  {
    this.life -= dt;
    if (this.life < 0)
      this._entity._parent.removeChild(this._entity);
  };
});
TANK.registerComponent('LightingAndDamage')

.includes(['Pos2D'])

.construct(function()
{
  this.resource = null;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.setResource = function(res)
  {
    this.resource = res;

    // Create texture buffers
    this.mainBuffer = new PixelBuffer();
    this.damageBuffer = new PixelBuffer();
    this.decalBuffer = new PixelBuffer();

    // Setup texture buffers
    this.mainBuffer.createBuffer(res.diffuse.width, res.diffuse.height);
    this.damageBuffer.createBuffer(res.diffuse.width, res.diffuse.height);
    this.decalBuffer.createBuffer(res.diffuse.width, res.diffuse.height);
  }

  // Add damage decals
  this.addDamage = function(x, y, radius)
  {
    // Cut out radius around damage
    this.damageBuffer.setPixelRadiusRand(x, y, radius - 2, [255, 255, 255, 255], 0.7, radius, [0, 0, 0, 0], 0.0);
    this.damageBuffer.applyBuffer();

    // Draw burnt edge around damage
    this.decalBuffer.setPixelRadius(x, y, radius - 1, [200, 100, 0, 255], radius, [0, 0, 0, 50]);
    this.decalBuffer.applyBuffer();
  };

  this.redraw = function()
  {
    this.mainBuffer.context.save();
    this.mainBuffer.context.clearRect(0, 0, this.mainBuffer.width, this.mainBuffer.height);

    // Draw lighting
    var lightObj = TANK.main.getChildrenWithComponent('DirectionalLight');
    if (lightObj)
      lightObj = lightObj[Object.keys(lightObj)[0]];

    var rotation = t.rotation;
    while (rotation < 0)
      rotation += Math.PI * 2;
    rotation %= Math.PI * 2;

    var numBuffers = this.resource.lightBuffers.length;
    var angleChunk = Math.PI * 2 / numBuffers;
    var lightAngle = (Math.atan2(lightObj.Pos2D.y - t.y, t.x - lightObj.Pos2D.x) + rotation + Math.PI) % (Math.PI * 2);
    var lightDir = [Math.cos(lightAngle), Math.sin(lightAngle)];
    var indexA = Math.floor(lightAngle / angleChunk) % numBuffers;
    var indexB = Math.ceil(lightAngle / angleChunk) % numBuffers;
    var alphaA = 1 - (Math.abs(lightAngle - angleChunk * indexA) / angleChunk);
    var alphaB = 1 - alphaA;

    this.mainBuffer.context.globalCompositeOperation = 'lighter';
    this.mainBuffer.context.globalAlpha = alphaA;
    this.mainBuffer.context.drawImage(this.resource.lightBuffers[indexA], 0, 0);
    this.mainBuffer.context.globalAlpha = alphaB;
    this.mainBuffer.context.drawImage(this.resource.lightBuffers[indexB], 0, 0);

    // Draw damage buffer
    this.mainBuffer.context.globalAlpha = 1;
    this.mainBuffer.context.globalCompositeOperation = 'source-atop';
    this.mainBuffer.context.drawImage(this.decalBuffer.canvas, 0, 0);
    this.mainBuffer.context.globalCompositeOperation = 'destination-out';
    this.mainBuffer.context.drawImage(this.damageBuffer.canvas, 0, 0);

    this.mainBuffer.context.restore();
  };
});
(function(api)
{

// The 'z' position of the light source
api.lightHeight = 0.5;

// The ambient light color
api.ambientLight = [0.1, 0.1, 0.1];

// The minimum light intensity to show
api.minLightIntensity = 0.0;

// The light source color
api.lightDiffuse = [1, 1, 1];

// Bake the lighting for a given diffuse and normal map
// Returns an array of canvases
api.bake = function(numDirs, diffuseMap, normalMap)
{
  var canvasDiffuse = createCanvas(diffuseMap.width, diffuseMap.height);
  var canvasNormals = createCanvas(normalMap.width, normalMap.height);

  var contextDiffuse = canvasDiffuse.getContext('2d');
  var contextNormals = canvasNormals.getContext('2d');

  contextDiffuse.drawImage(diffuseMap, 0, 0);
  contextNormals.drawImage(normalMap, 0, 0);

  var bufferDiffuse = contextDiffuse.getImageData(0, 0, diffuseMap.width, diffuseMap.height);
  var bufferNormals = contextNormals.getImageData(0, 0, normalMap.width, normalMap.height);

  var bakedImages = [];
  var normals = [];

  // Calculate normals of normal map
  for (var x = 0; x < bufferNormals.width; ++x)
  {
    normals[x] = [];
    for (var y = 0; y < bufferNormals.height; ++y)
    {
      normals[x][y] = [];
      var normal = normals[x][y];
      var index = (x + y * bufferNormals.width) * 4;

      // Extract normal and transform 0-255 to -1 - 1
      normal[0] = ((bufferNormals.data[index + 0] / 255) - 0.5) * 2;
      normal[1] = ((bufferNormals.data[index + 1] / 255) - 0.5) * 2;
      normal[2] = ((bufferNormals.data[index + 2] / 255) - 0.5) * 2;

      // Normalize the vector
      var len = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
      normal[0] /= len;
      normal[1] /= len;
      normal[2] /= len;
    }
  }

  function bakeDirection(dir)
  {
    // Build buffer for light map
    var canvas = createCanvas(diffuseMap.width, diffuseMap.height); 
    var context = canvas.getContext('2d');
    var buffer = context.getImageData(0, 0, canvas.width, canvas.height);

    // Build light vector
    var lightDir = [Math.cos(dir), Math.sin(dir), api.lightHeight];

    // For every pixel
    for (var x = 0; x < bufferNormals.width; ++x)
    {
      for (var y = 0; y < bufferNormals.height; ++y)
      {
        // Get normal and diffuse color
        // Diffuse rgb is normalized to 0-1 for calculations
        var normal = normals[x][y];
        var index = (x + y * bufferNormals.width) * 4;
        var diffuse = 
        [
          bufferDiffuse.data[index + 0], 
          bufferDiffuse.data[index + 1], 
          bufferDiffuse.data[index + 2], 
          bufferDiffuse.data[index + 3]
        ];
        diffuse[0] /= 255;
        diffuse[1] /= 255;
        diffuse[2] /= 255;

        // Calculate n dot l lighting component
        var intensity = normal[0] * lightDir[0] + normal[1] * lightDir[1] + normal[2] * lightDir[2];
        intensity = Math.min(1, intensity);
        intensity = Math.max(api.minLightIntensity, intensity);

        // Build output pixel
        var out = 
        [
          intensity * diffuse[0] * api.lightDiffuse[0] + api.ambientLight[0], 
          intensity * diffuse[1] * api.lightDiffuse[1] + api.ambientLight[1], 
          intensity * diffuse[2] * api.lightDiffuse[2] + api.ambientLight[2], 
          diffuse[3]
        ];

        // Rescale rgb to 0-255 range
        out[0] = Math.floor(out[0] * 255);
        out[1] = Math.floor(out[1] * 255);
        out[2] = Math.floor(out[2] * 255);

        // Set the pixel
        buffer.data[index + 0] = out[0];
        buffer.data[index + 1] = out[1];
        buffer.data[index + 2] = out[2];
        buffer.data[index + 3] = out[3];
      }
    }

    // Apply the changes and return the canvas
    context.putImageData(buffer, 0, 0);
    return canvas;
  }

  // Run the bake routine for every angle division
  for (var i = 0; i < numDirs; ++i)
  {
    var lightDir = (Math.PI * 2 / numDirs) * i;
    bakedImages.push(bakeDirection(lightDir));
  }

  return bakedImages;
}

function createCanvas(width, height)
{
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

})(this.Lightr = this.Lightr || {});
var Locations = {};

Locations.start =
{
  text: 'Here you are, at the edge of civilized space. Your destination lies deep in the heart of the galaxy, where anarchy reigns.',
  name: 'the start',
  events:
  [
    {probability: 1, name: 'start'}
  ],
  bgColor: [0, 0, 20, 1],
  lightColor: [0.7, 0.7, 1],
  spawns:
  [
    {components: {Pos2D: {x: 0, y: 0}, Planet: {}}}
  ]
};

Locations.abandonedOutpost =
{
  text: 'A dingy trading outpost sits ahead, listing heavily to the side.',
  name: 'An old abandoned trading outpost',
  events:
  [
    {probability: 2.5, name: 'pirate'},
    {probability: 2, name: 'derelict'},
    {probability: 1.5, name: 'returnStolenEnforcer'},
    {probability: 1, name: 'civilian'},
    {probability: 0.5, name: 'police'},
  ],
  bgColor: [0, 20, 0, 1],
  lightColor: [0.8, 1, 0.8],
  spawns:
  [
    {components: {Clouds: {cloudColor: [180, 255, 180]}}},
    {components: {Pos2D: {x: 1000, y: -1000}, LevelProp: {resourceName: 'station-01'}}}
  ]
};

Locations.researchStation =
{
  text: 'The research station looks like it hasn\'t been visited in years.',
  name: 'A research station',
  events:
  [
    {probability: 1.2, name: 'pirate'},
    {probability: 1, name: 'derelict'},
    {probability: 1.2, name: 'civilian'},
    {probability: 0.7, name: 'investigatePrototypeShip'},
    {probability: 0.5, name: 'derelictReturn'},
    {probability: 0.5, name: 'police'},
  ],
  bgColor: [20, 20, 0, 1],
  lightColor: [1, 1, 0.8],
  spawns:
  [
    {components: {Clouds: {numClouds: 50, cloudColor: [255, 255, 180]}}},
    {components: {Pos2D: {x: 1000, y: -1000}, LevelProp: {resourceName: 'station-01'}}}
  ]
};

Locations.pirateBase =
{
  text: 'Only pirates continue to make their home near the galaxy\'s center. You feel extremely nervous.',
  name: 'A pirate outpost',
  events:
  [
    {probability: 4, name: 'pirate'},
    {probability: 2, name: 'empty'},
    {probability: 1, name: 'civilian'},
  ],
  bgColor: [0, 20, 20, 1],
  lightColor: [0.8, 1, 1],
  spawns:
  [
    {components: {Clouds: {numClouds: 30, cloudColor: [180, 255, 255]}}}
  ]
};

Locations.oldBattlefield =
{
  text: 'This system is littered with the wrecks of ancient warships.',
  name: 'An old battlefield',
  events:
  [
    {probability: 100, name: 'investigatePrototypeShipEncounter'},
    {probability: 1, name: 'pirate'},
    {probability: 2, name: 'civilian'},
    {probability: 1, name: 'empty'},
    {probability: 0.5, name: 'derelictReturn'},
    {probability: 0.2, name: 'police'},
  ],
  bgColor: [0, 20, 20, 1],
  lightColor: [0.8, 1, 1],
  spawns:
  [
    {components: {Clouds: {numClouds: 30, cloudColor: [180, 255, 255]}}}
  ]
};

Locations.deepSpace =
{
  text: 'There is nothing to see here, just empty space.',
  name: 'Deep space',
  events:
  [
    {probability: 1, name: 'civilian'},
    {probability: 3, name: 'empty'},
    {probability: 0.5, name: 'derelictReturn'},
    {probability: 0.6, name: 'police'},
  ],
  bgColor: [0, 0, 0, 1],
  lightColor: [0.9, 0.9, 1],
  spawns: []
};

Locations.redDwarf =
{
  text: 'The red dwarf star in this system bathes the scenery in a faintly rose-colored light.',
  name: 'A red dwarf star',
  events:
  [
    {probability: 100, name: 'returnStolenEnforcerBattle'},
    {probability: 1, name: 'civilian'},
    {probability: 1.5, name: 'empty'},
    {probability: 0.5, name: 'derelictReturn'},
    {probability: 0.6, name: 'police'},
  ],
  bgColor: [10, 0, 0, 1],
  lightColor: [1, 0.8, 0.8],
  spawns: []
};

Locations.asteroidField =
{
  text: 'Here in the depths of an asteroid field, anything can happen. Watch your back.',
  name: 'An asteroid field',
  events:
  [
    {probability: 1, name: 'pirate'},
    {probability: 1, name: 'returnStolenEnforcer'},
    {probability: 1.2, name: 'derelict'},
    {probability: 0.4, name: 'empty'},
  ],
  bgColor: [30, 0, 0, 1],
  lightColor: [1, 0.7, 0.7],
  spawns:
  [
    {components: {Clouds: {numClouds: 75, cloudColor: [220, 180, 180]}}},
    {components: {AsteroidField: {numAsteroids: 40}}}
  ]
};

Locations.policeOutpost =
{
  text: 'This close to the galaxy\'s center, a police station is a rare haven for law-abiding pilots.',
  name: 'A police station',
  events:
  [
    {probability: 4, name: 'police'},
    {probability: 2, name: 'empty'},
    {probability: 1, name: 'civilian'},
  ],
  bgColor: [0, 0, 20, 1],
  lightColor: [0.8, 0.8, 1],
  spawns:
  [
    {components: {Clouds: {numClouds: 30, cloudColor: [180, 255, 255]}}}
  ]
};
TANK.registerComponent('MainMenu')

.construct(function()
{
  this.htmlText =
  [
    '<div class="main-menu">',
    '  <div class="menu-title">Starswept Voyage</div>',
    '  <div class="menu-options">',
    '    <div class="menu-option menu-option-new">New Game</div>',
    '    <div class="menu-option menu-option-options">Options</div>',
    '    <div class="menu-option menu-option-quit">Quit</div>',
    '  </div>',
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

  //
  // Handle interactions
  //
  var newGameButton = this.container.querySelector('.menu-option-new');
  newGameButton.addEventListener('click', function()
  {
    this._entity.dispatch('newgame');
  }.bind(this));

  //
  // Create scene
  //
  this.planet = TANK.createEntity('Planet');
  this.planet.Pos2D.x = 0;
  this.planet.Pos2D.y = -400;
  TANK.main.addChild(this.planet);

  this.moon = TANK.createEntity('Planet');
  this.moon.Pos2D.x = -400;
  this.moon.Pos2D.y = 400;
  this.moon.Planet.radius = 48;
  TANK.main.addChild(this.moon);

  this.ship = TANK.createEntity('Ship');
  this.ship.Pos2D.x = 400;
  this.ship.Pos2D.y = 300;
  this.ship.Ship.shipData = new Ships.bomber();
  TANK.main.addChild(this.ship);
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
  TANK.main.removeChild(this.planet);
  TANK.main.removeChild(this.moon);
  TANK.main.removeChild(this.ship);
});
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

      var currentLocations = node.paths.map(function(val) {return val.locationName;});
      var possibleLocations = Object.keys(Locations).filter(function(val) {return currentLocations.indexOf(val) === -1;});
      var childNode = this.generateNode(node.depth + childDepth, possibleLocations);
      if (childNode)
        node.paths.push(childNode);
    }
  };

  this.map = this.generateNode(0);
});

var ParticleLibrary = {};

ParticleLibrary.slowMediumFire = function()
{
  var e = TANK.createEntity('ParticleEmitter');
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = 'res/img/particle-fire-1.png';
  emitter.spawnOffsetMin = [-50, -50];
  emitter.spawnOffsetMax = [50, 50];
  emitter.spawnScaleMin = 1;
  emitter.spawnScaleMax = 10;
  emitter.spawnPerSecond = 5;
  emitter.particleLifeMin = 4;
  emitter.particleLifeMax = 7;
  emitter.particleRotateSpeedMin = -1;
  emitter.particleRotateSpeedMax = 1;
  emitter.particleAlphaDecayMin = 0.98;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.005;
  return e;
};

ParticleLibrary.explosionMedium = function(x, y)
{
  var obj = {};
  obj.fire = ParticleLibrary.explosionMediumFire(x, y);
  obj.smoke = ParticleLibrary.explosionMediumSmoke(x, y);
  obj.sparks = ParticleLibrary.explosionMediumSparks(x, y);
  obj.fireballs = ParticleLibrary.explosionMediumFireballs(x, y);
  TANK.main.addChild(obj.fire);
  TANK.main.addChild(obj.smoke);
  TANK.main.addChild(obj.sparks);
  TANK.main.addChild(obj.fireballs);
  return obj;
};

ParticleLibrary.explosionMediumFire = function(x, y)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = 'res/img/particle-fire-1.png';
  emitter.spawnOffsetMin = [-40, -40];
  emitter.spawnOffsetMax = [40, 40];
  emitter.spawnSpeedMin = 150;
  emitter.spawnSpeedMax = 250;
  emitter.spawnScaleMin = 8;
  emitter.spawnScaleMax = 14;
  emitter.spawnPerSecond = 200;
  emitter.spawnDuration = 0.2;
  emitter.spawnAlphaMin = 0.7;
  emitter.spawnAlphaMax = 0.8;
  emitter.particleLifeMin = 5;
  emitter.particleLifeMax = 8;
  emitter.particleFrictionMin = 0.95;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.5;
  emitter.particleRotateSpeedMax = 0.5;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.005;
  return e;
};

ParticleLibrary.explosionMediumFireballs = function(x, y)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = 'res/img/particle-fire-1.png';
  emitter.spawnOffsetMin = [-60, -60];
  emitter.spawnOffsetMax = [60, 60];
  emitter.spawnSpeedMin = 250;
  emitter.spawnSpeedMax = 350;
  emitter.spawnScaleMin = 2;
  emitter.spawnScaleMax = 4;
  emitter.spawnPerSecond = 700;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 6;
  emitter.particleLifeMax = 9;
  emitter.particleFrictionMin = 0.95;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.5;
  emitter.particleRotateSpeedMax = 0.5;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  return e;
};

ParticleLibrary.explosionMediumSparks = function(x, y)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = 'res/img/particle-spark-1.png';
  emitter.spawnOffsetMin = [-60, -60];
  emitter.spawnOffsetMax = [60, 60];
  emitter.spawnSpeedMin = 350;
  emitter.spawnSpeedMax = 550;
  emitter.spawnScaleMin = 1;
  emitter.spawnScaleMax = 2;
  emitter.spawnPerSecond = 700;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 6;
  emitter.particleLifeMax = 9;
  emitter.particleFrictionMin = 0.95;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.5;
  emitter.particleRotateSpeedMax = 0.5;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  return e;
};

ParticleLibrary.explosionMediumSmoke = function(x, y)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = 'source-over';
  emitter.particleImage.src = 'res/img/particle-smoke-1.png';
  emitter.spawnOffsetMin = [-70, -70];
  emitter.spawnOffsetMax = [70, 70];
  emitter.spawnSpeedMin = 50;
  emitter.spawnSpeedMax = 100;
  emitter.spawnScaleMin = 15;
  emitter.spawnScaleMax = 25;
  emitter.spawnPerSecond = 25;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 6;
  emitter.particleLifeMax = 9;
  emitter.particleFrictionMin = 0.98;
  emitter.particleFrictionMax = 0.99;
  emitter.particleRotateSpeedMin = -0.25;
  emitter.particleRotateSpeedMax = 0.25;
  emitter.particleAlphaDecayMin = 0.99;
  emitter.particleAlphaDecayMax = 0.995;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.003;
  return e;
};

ParticleLibrary.gunFireSmall = function(x, y, angle)
{
  var obj = {};
  obj.smoke = ParticleLibrary.gunFireSmallSmoke(x, y, angle);
  obj.sparks = ParticleLibrary.gunFireSmallSparks(x, y, angle);
  TANK.main.addChild(obj.smoke);
  TANK.main.addChild(obj.sparks);
  return obj;
};

ParticleLibrary.gunFireSmallSmoke = function(x, y, angle)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 8;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = 'source-over';
  emitter.particleImage.src = 'res/img/particle-smoke-1.png';
  emitter.spawnOffsetMin = [-8, -8];
  emitter.spawnOffsetMax = [8, 8];
  emitter.spawnSpeedMin = 100;
  emitter.spawnSpeedMax = 150;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 2;
  emitter.spawnScaleMax = 5;
  emitter.spawnPerSecond = 10;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 4;
  emitter.particleLifeMax = 7;
  emitter.particleFrictionMin = 0.96;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.25;
  emitter.particleRotateSpeedMax = 0.25;
  emitter.particleAlphaDecayMin = 0.99;
  emitter.particleAlphaDecayMax = 0.995;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.003;
  return e;
};

ParticleLibrary.gunFireSmallSparks = function(x, y, angle)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = 'res/img/particle-spark-1.png';
  emitter.spawnOffsetMin = [-5, -5];
  emitter.spawnOffsetMax = [5, 5];
  emitter.spawnSpeedMin = 250;
  emitter.spawnSpeedMax = 350;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 0.5;
  emitter.spawnScaleMax = 0.75;
  emitter.spawnPerSecond = 200;
  emitter.spawnDuration = 0.1;
  emitter.particleLifeMin = 1;
  emitter.particleLifeMax = 2;
  emitter.particleFrictionMin = 0.92;
  emitter.particleFrictionMax = 0.95;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  return e;
};

ParticleLibrary.gunFireMedium = function(x, y, angle)
{
  var obj = {};
  obj.smoke = ParticleLibrary.gunFireMediumSmoke(x, y, angle);
  obj.sparks = ParticleLibrary.gunFireMediumSparks(x, y, angle);
  TANK.main.addChild(obj.smoke);
  TANK.main.addChild(obj.sparks);
  return obj;
};

ParticleLibrary.gunFireMediumSmoke = function(x, y, angle)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 8;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = 'source-over';
  emitter.particleImage.src = 'res/img/particle-smoke-1.png';
  emitter.spawnOffsetMin = [-20, -20];
  emitter.spawnOffsetMax = [20, 20];
  emitter.spawnSpeedMin = 100;
  emitter.spawnSpeedMax = 150;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 10;
  emitter.spawnScaleMax = 15;
  emitter.spawnPerSecond = 15;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 6;
  emitter.particleLifeMax = 9;
  emitter.particleFrictionMin = 0.96;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.25;
  emitter.particleRotateSpeedMax = 0.25;
  emitter.particleAlphaDecayMin = 0.99;
  emitter.particleAlphaDecayMax = 0.995;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.003;
  return e;
};

ParticleLibrary.gunFireMediumSparks = function(x, y, angle)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = 'res/img/particle-spark-1.png';
  emitter.spawnOffsetMin = [-5, -5];
  emitter.spawnOffsetMax = [5, 5];
  emitter.spawnSpeedMin = 350;
  emitter.spawnSpeedMax = 550;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 1;
  emitter.spawnScaleMax = 2;
  emitter.spawnPerSecond = 700;
  emitter.spawnDuration = 0.1;
  emitter.particleLifeMin = 3;
  emitter.particleLifeMax = 5;
  emitter.particleFrictionMin = 0.92;
  emitter.particleFrictionMax = 0.95;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  return e;
};

ParticleLibrary.damageSmall = function(x, y, angle)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = 'res/img/particle-fire-1.png';
  emitter.spawnOffsetMin = [-5, -5];
  emitter.spawnOffsetMax = [5, 5];
  emitter.spawnSpeedMin = 250;
  emitter.spawnSpeedMax = 350;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 0.5;
  emitter.spawnScaleMax = 1;
  emitter.spawnPerSecond = 400;
  emitter.spawnDuration = 0.1;
  emitter.particleLifeMin = 2;
  emitter.particleLifeMax = 3;
  emitter.particleFrictionMin = 0.92;
  emitter.particleFrictionMax = 0.95;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  TANK.main.addChild(e);
  return e;
};

ParticleLibrary.damageMedium = function(x, y, angle)
{
  var e = TANK.createEntity(['ParticleEmitter', 'Life']);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = 'res/img/particle-fire-1.png';
  emitter.spawnOffsetMin = [-5, -5];
  emitter.spawnOffsetMax = [5, 5];
  emitter.spawnSpeedMin = 250;
  emitter.spawnSpeedMax = 350;
  emitter.spawnAngleMin = angle - 0.3;
  emitter.spawnAngleMax = angle + 0.3;
  emitter.spawnScaleMin = 1;
  emitter.spawnScaleMax = 2;
  emitter.spawnPerSecond = 500;
  emitter.spawnDuration = 0.1;
  emitter.particleLifeMin = 3;
  emitter.particleLifeMax = 5;
  emitter.particleFrictionMin = 0.92;
  emitter.particleFrictionMax = 0.95;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  TANK.main.addChild(e);
  return e;
};

ParticleLibrary.smallRailTrail = function()
{
  var e = TANK.createEntity(['ParticleEmitter']);
  var emitter = e.ParticleEmitter;
  emitter.particleImage.src = 'res/img/particle-spark-1.png';
  emitter.spawnPerSecond = 100;
  emitter.particleLifeMin = 0.2;
  emitter.particleLifeMax = 0.3;
  emitter.spawnScaleMin = 0.5;
  emitter.spawnScaleMax = 1;
  emitter.particleAlphaDecayMin = 0.80;
  emitter.particleAlphaDecayMax = 0.85;
  TANK.main.addChild(e);
  return e;
};

ParticleLibrary.mediumRailTrail = function()
{
  var e = TANK.createEntity(['ParticleEmitter']);
  var emitter = e.ParticleEmitter;
  emitter.particleImage.src = 'res/img/particle-spark-1.png';
  emitter.spawnPerSecond = 200;
  emitter.particleLifeMin = 0.2;
  emitter.particleLifeMax = 0.4;
  emitter.particleAlphaDecayMin = 0.80;
  emitter.particleAlphaDecayMax = 0.85;
  TANK.main.addChild(e);
  return e;
};
function PixelBuffer()
{
  this.createBuffer = function(width, height)
  {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d");
    this.buffer = this.context.getImageData(0, 0, this.width, this.height);
  };

  this.readBuffer = function()
  {
    this.buffer = this.context.getImageData(0, 0, this.width, this.height);
  };

  this.applyBuffer = function()
  {
    this.context.putImageData(this.buffer, 0, 0);
  };

  this.setPixel = function(x, y, color)
  {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height)
      return;

    var index = x * 4 + (y * this.buffer.width * 4);
    this.buffer.data[index + 0] = Math.floor(color[0]);
    this.buffer.data[index + 1] = Math.floor(color[1]);
    this.buffer.data[index + 2] = Math.floor(color[2]);
    this.buffer.data[index + 3] = Math.floor(color[3]);
  };

  this.setPixelRadius = function(centerX, centerY, radiusA, colorA, radiusB, colorB)
  {
    this.setPixelRadiusRand(centerX, centerY, radiusA, colorA, 1, radiusB, colorB, 1);
  };

  this.setPixelRadiusRand = function(centerX, centerY, radiusA, colorA, randA, radiusB, colorB, randB)
  {
    var radius = radiusB || radiusA;
    var xStart = Math.floor(centerX - radius);
    var xEnd = Math.floor(centerX + radius);
    var yStart = Math.floor(centerY - radius);
    var yEnd = Math.floor(centerY + radius);

    // Iterate over the area defined by radius
    for (var x = xStart; x < xEnd; ++x)
    {
      for (var y = yStart; y < yEnd; ++y)
      {
        // Only draw within radius
        var d = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
        if (d < radius)
        {
          if (radiusB)
          {
            // If a second color and radius specified, interpolate between colorA and B
            var t = (d - radiusA) / (radiusB - radiusA);
            var rand = randA * (1 - t) + randB * t;
            if (Math.random() >= rand)
              continue;
            var color = [];
            for (var i = 0; i < 4; ++i)
              color[i] = Math.round(colorA[i] * (1 - t) + colorB[i] * t);
            this.setPixel(x, y, color);
          }
          else if (Math.random() < randA)
          {
            // Otherwise just set the color
            this.setPixel(x, y, colorA);
          }
        }
      }
    }
  };

  this.getPixel = function(x, y)
  {
    x = Math.round(x);
    y = Math.round(y);
    x = Math.min(this.buffer.width, Math.max(0, x));
    y = Math.min(this.buffer.height, Math.max(0, y));
    var index = x * 4 + (y * this.buffer.width * 4);
    var pixel = [];
    pixel[0] = this.buffer.data[index + 0];
    pixel[1] = this.buffer.data[index + 1];
    pixel[2] = this.buffer.data[index + 2];
    pixel[3] = this.buffer.data[index + 3];
    return pixel;
  };

  this.testRay = function(rayStart, rayDir, precision)
  {
    var p = [rayStart[0], rayStart[1]];
    var len = Math.sqrt(rayDir[0] * rayDir[0] + rayDir[1] * rayDir[1]);
    var v = [rayDir[0] / len, rayDir[1] / len];
    if (typeof precision === "undefined")
      precision = 5;
    var hit = false;
    var minSteps = 10;
    while (!hit)
    {
      p[0] += v[0] * precision;
      p[1] += v[1] * precision;
      var pixel = this.getPixel(p[0], p[1]);
      if (pixel && pixel[3] > 0)
        return p;
      if (!pixel)
      {
        --minSteps;
        if (minSteps < 0)
          return null;
      }
    }
  };
}
TANK.registerComponent('PixelCollider')

.construct(function()
{
  this.width = 0;
  this.height = 0;
  this.collisionLayer = '';
  this.collidesWith = [];

  this.image = null;
  this.collisionBuffer = new PixelBuffer();
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.setImage = function(image)
  {
    var space = this._entity.getFirstParentWithComponent('CollisionManager');
    if (this.image)
      space.CollisionManager.remove(this);

    this.image = image;
    this.collisionBuffer.createBuffer(image.width, image.height);
    this.collisionBuffer.context.drawImage(this.image, 0, 0);
    this.collisionBuffer.readBuffer();
    this.width = image.width * TANK.main.Game.scaleFactor;
    this.height = image.height * TANK.main.Game.scaleFactor;

    space.CollisionManager.add(this);
  };

  this.testCollision = function(other)
  {
    var selfPos = [t.x, t.y];
    var selfSize = [this.width, this.height];
    var otherPos = [other._entity.Pos2D.x, other._entity.Pos2D.y];
    var inRect = TANK.Math2D.pointInOBB(otherPos, selfPos, selfSize, t.rotation);
    if (!inRect)
      return null;

    var selfHalfSize = TANK.Math2D.scale(selfSize, 0.5);
    otherPos = TANK.Math2D.subtract(otherPos, selfPos);
    otherPos = TANK.Math2D.rotate(otherPos, -t.rotation);
    otherPos = TANK.Math2D.add(otherPos, selfHalfSize);
    otherPos = TANK.Math2D.scale(otherPos, 1 / TANK.main.Game.scaleFactor);
    var p = this.collisionBuffer.getPixel(otherPos[0], otherPos[1]);

    return (p[3] > 0) ? otherPos : null;
  };
});
(function()
{

TANK.registerComponent('Planet')

.includes(['Pos2D', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 0;
  this.radius = 128;
  this.atmosColor =
  [
    Math.round(100 + Math.random() * 150),
    Math.round(100 + Math.random() * 150),
    Math.round(100 + Math.random() * 150),
    0.8
  ];
  this.heights = [0, 0.3, 0.5, 0.6, 1];
  this.colors =
  [
    [0, 0, 90, 255],
    [30, 30, 255, 255],
    [180, 180, 100, 255],
    [80, 150, 80, 255],
    [255, 255, 255, 255]
  ];

  this.noiseFreq = 0.004 + Math.random() * 0.004;
  this.noiseAmplitude = 0.5 + Math.random() * 0.3;
  this.noisePersistence = 0.7 + Math.random() * 0.29;
  this.noiseOctaves = 8;
})

.initialize(function()
{
  TANK.main.Renderer2D.add(this);

  // Iterate over every pixel
  this.forEachPixel = function(func)
  {
    for (var i = 0; i < this.size; ++i)
    {
      for (var j = 0; j < this.size; ++j)
      {
        if (TANK.Math2D.pointDistancePoint([i, j], [this.radius, this.radius]) < this.radius)
          func.apply(this, [i, j]);
      }
    }
  };

  // Interpolate between colors at a height
  this.getColorAtHeight = function(height)
  {
    var heightMin = 0;
    var heightMax = this.heights.length - 1;
    for (var i = 1; i < this.heights.length; ++i)
    {
      if (this.heights[i] > height)
      {
        heightMin = i - 1;
        heightMax = i;
        break;
      }
    }

    var color0 = this.colors[heightMin];
    var color1 = this.colors[heightMax];
    var y0 = this.heights[heightMin];
    var y1 = this.heights[heightMax];
    var t = (height - y0) / (y1 - y0);

    var color = [];
    for (var i = 0; i < 4; ++i)
      color[i] = Math.round(color0[i] * (1 - t) + color1[i] * t);

    return color;
  };

  var t = this._entity.Pos2D;

  // Create buffer
  this.size = this.radius * 2;
  this.lightSize = Math.floor(this.size * 1.25);
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(this.size, this.size);
  this.lightBuffer = new PixelBuffer();
  this.lightBuffer.createBuffer(this.lightSize, this.lightSize);
  this.heightMap = [];

  // Choose colors
  for (var i = 0; i < this.colors.length; ++i)
  {
    var index = Math.floor(Math.random() * PlanetColors[i].length);
    this.colors[i] = PlanetColors[i][index];
  }

  // Fill heightmap
  for (var i = 0; i < this.size; ++i)
  {
    this.heightMap[i] = [];
    for (var j = 0; j < this.size; ++j)
      this.heightMap[i][j] = 0;
  }

  // Calculate height map
  noise.seed(Math.random());
  for (var n = 0; n < this.noiseOctaves; ++n)
  {
    this.forEachPixel(function(i, j)
    {
      this.heightMap[i][j] += noise.perlin2(i * this.noiseFreq, j * this.noiseFreq) * this.noiseAmplitude;
    });
    this.noiseAmplitude *= this.noisePersistence;
    this.noiseFreq *= 2;
  }

  // Normalize height map to [0, 1]
  this.heighestPoint = -Infinity;
  this.lowestPoint = Infinity;
  this.forEachPixel(function(i, j)
  {
    this.heighestPoint = Math.max(this.heighestPoint, this.heightMap[i][j]);
    this.lowestPoint = Math.min(this.lowestPoint, this.heightMap[i][j]);
  });
  this.forEachPixel(function(i, j)
  {
    this.heightMap[i][j] = (-this.lowestPoint + this.heightMap[i][j]) / (-this.lowestPoint + this.heighestPoint);
  });

  // Set color based on height map
  this.forEachPixel(function(i, j)
  {
    var height = this.heightMap[i][j];
    var color = this.getColorAtHeight(height);
    this.pixelBuffer.setPixel(i, j, color);
  });

  this.pixelBuffer.applyBuffer();

  // Draw atmosphere
  var atmosColor = this.atmosColor[0] + ',' + this.atmosColor[1] + ',' + this.atmosColor[2];
  var atmosColorAlpha = atmosColor + ',' + this.atmosColor[3];
  this.lightBuffer.context.translate((this.lightSize) / 2, (this.lightSize) / 2);
  var grad = this.lightBuffer.context.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.1);
  grad.addColorStop(0, 'rgba(' + atmosColor + ', 0.0)');
  grad.addColorStop(0.5, 'rgba(' + atmosColor + ', 0.0)');
  grad.addColorStop(0.8, 'rgba(' + atmosColorAlpha + ')');
  grad.addColorStop(1, 'rgba(' + atmosColor + ', 0.0)');
  this.lightBuffer.context.fillStyle = grad;
  this.lightBuffer.context.beginPath();
  this.lightBuffer.context.arc(0, 0, this.radius * 1.2, 2 * Math.PI, false);
  this.lightBuffer.context.fill();
  this.lightBuffer.context.closePath();

  // Draw lighting
  var x = -this.radius;
  var y = 0;
  grad = this.lightBuffer.context.createRadialGradient(x - this.radius / 4, y, this.radius * 1.2, x, y, this.radius * 1.8);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.7)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

  this.lightBuffer.context.fillStyle = grad;
  this.lightBuffer.context.beginPath();
  this.lightBuffer.context.arc(0, 0, this.radius, 2 * Math.PI, false);
  this.lightBuffer.context.fill();
  this.lightBuffer.context.closePath();

  this.listenTo(TANK.main, 'systemBattleEnd', function()
  {
    TANK.main.removeChild(this._entity);
  });

  this.draw = function(ctx, camera, dt)
  {
    ctx.save();

    // Draw planet
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.translate(this.size / -2, this.size / -2);
    ctx.drawImage(this.pixelBuffer.canvas, 0, 0);

    // Draw lighting
    var sizeDiff = (this.lightSize - this.size) / 2;
    ctx.translate((this.lightSize) / 2 - sizeDiff, (this.lightSize) / 2 - sizeDiff);
    ctx.rotate(TANK.main.Game.lightDir + Math.PI);
    ctx.translate((this.lightSize) / -2, (this.lightSize) / -2);
    ctx.drawImage(this.lightBuffer.canvas, 0, 0);

    ctx.restore();
  };
});

var PlanetColors =
[
  // Deep water
  [
    [0, 0, 90, 255],
    [90, 0, 90, 255],
    [90, 0, 30, 255],
    [30, 0, 90, 255],
    [30, 30, 90, 255],
  ],
  // Water
  [
    [30, 30, 255, 255],
    [50, 50, 255, 255],
    [255, 30, 255, 255],
    [255, 30, 150, 255],
    [80, 60, 255, 255],
  ],
  // Beach
  [
    [180, 180, 100, 255],
    [180, 100, 180, 255],
    [100, 180, 180, 255],
    [100, 100, 100, 255],
  ],
  // Land
  [
    [80, 150, 80, 255],
    [150, 80, 80, 255],
    [80, 80, 150, 255],
  ],
  // Mountains
  [
    [255, 255, 255, 255],
    [200, 200, 200, 255],
    [200, 250, 200, 255],
    [250, 150, 150, 255],
  ]
];

}());
TANK.registerComponent('Player')

.includes(['Ship', 'ShipHud'])

.construct(function()
{
  this.zdepth = 100;
  this.shakeTime = 0;

  this.headingPos = [0, 0];
  this.headingLeft = false;
  this.headingRight = false;
  this.speedUp = false;
  this.speedDown = false;
})

.initialize(function()
{
  var ship = this._entity.Ship;
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  //
  // Camera shake
  //
  this.shakeCamera = function(duration)
  {
    this.shakeTime = duration;
  };

  //
  // Listen for player death
  //
  this.listenTo(this._entity, 'explode', function()
  {
    TANK.main.Game.addStory('You exploded.');
    TANK.main.dispatchTimed(3, 'gamelose');
  });

  //
  // Listen for collisions
  //
  this.listenTo(this._entity, 'collide', function(obj)
  {
    if (obj.Bullet && obj.Bullet.owner !== this._entity)
      this.shakeCamera(0.1);
    if (obj.FuelCell)
    {
      TANK.main.Game.givePlayerFuel(1);
      obj._parent.removeChild(obj);
    }
  });

  //
  // Camera shake message
  //
  this.listenTo(TANK.main, 'camerashake', function(duration)
  {
    this.shakeCamera(duration);
  });

  //
  // Key input
  //
  this.listenTo(TANK.main, 'keydown', function(e)
  {
    if (e.keyCode === TANK.Key.W)
      this.speedUp = true;
    if (e.keyCode === TANK.Key.S)
      this.speedDown = true;
    if (e.keyCode === TANK.Key.A)
      this.headingLeft = true;
    if (e.keyCode === TANK.Key.D)
      this.headingRight = true;
  });

  this.listenTo(TANK.main, 'keyup', function(e)
  {
    if (e.keyCode === TANK.Key.W)
      this.speedUp = false;
    if (e.keyCode === TANK.Key.S)
      this.speedDown = false;
    if (e.keyCode === TANK.Key.A)
      this.headingLeft = false;
    if (e.keyCode === TANK.Key.D)
      this.headingRight = false;
  });

  //
  // Update loop
  //
  this.update = function(dt)
  {
    // Check for warp jammer
    var warpJammers = TANK.main.getChildrenWithComponent('WarpJammer');
    if (warpJammers && Object.keys(warpJammers).length)
    {
      if (!ship.warpJammed)
      {
        ship.warpJammed = true;
        TANK.main.Game.addEventLog('Warp drive is being jammed!');
      }
      ship.warpCharge = 0;
    }
    else if (ship.warpJammed)
    {
      ship.warpJammed = false;
      TANK.main.Game.addEventLog('Warp drive is no longer jammed');
    }

    // Heading controls
    if (this.headingLeft)
      ship.heading = t.rotation - 0.3;
    if (this.headingRight)
      ship.heading = t.rotation + 0.3;

    // Speed controls
    if (this.speedUp)
      ship.desiredSpeed += dt * 80;
    if (this.speedDown)
      ship.desiredSpeed -= dt * 80;

    // Shoot
    if (TANK.main.Input.isDown(TANK.Key.LEFT_ARROW))
      this._entity.Weapons.fireGuns('left');
    if (TANK.main.Input.isDown(TANK.Key.RIGHT_ARROW))
      this._entity.Weapons.fireGuns('right');
    if (TANK.main.Input.isDown(TANK.Key.UP_ARROW))
      this._entity.Weapons.fireGuns('front');
    if (TANK.main.Input.isDown(TANK.Key.DOWN_ARROW))
      this._entity.Weapons.fireGuns('back');

    // Camera follow
    TANK.main.Renderer2D.camera.x = t.x;
    TANK.main.Renderer2D.camera.y = t.y;

    // Camera shake
    if (this.shakeTime > 0)
    {
      this.shakeTime -= dt;
      TANK.main.Renderer2D.camera.x += -5 + Math.random() * 10;
      TANK.main.Renderer2D.camera.y += -5 + Math.random() * 10;
    }
  };

  //
  // Render
  //
  this.draw = function(ctx, camera)
  {

  };
});
TANK.registerComponent('RemoveOnLevelChange')
.initialize(function()
{
  this.listenTo(TANK.main, 'locationchange', function()
  {
    TANK.main.removeChild(this._entity);
  });
});

TANK.registerComponent('Resources')
.construct(function()
{
  this._resourcesToLoad = {};
  this._resourcesLoaded = 0;
  this._resources = {};
  this._queuedResources = [];
})

.initialize(function()
{
  //
  // Add a resource to be loaded
  //
  this.add = function(name, path, dependencies, loader)
  {
    this._resourcesToLoad[name] =
    {
      name: name,
      path: path,
      dependencies: dependencies || [],
      loader: loader
    };
  };

  //
  // Get a resource by name
  //
  this.get = function(name)
  {
    return this._resources[name];
  };

  //
  // Get a map of all resources
  //
  this.getAll = function()
  {
    return this._resources;
  };

  //
  // Load all queued resources
  //
  this.load = function()
  {
    for (var i in this._resourcesToLoad)
      this._loadResource(this._resourcesToLoad[i], true);
  };

  this._resourceLoaded = function(res, loadedRes)
  {
    // Mark resource as loaded
    this._resources[res.name] = loadedRes;
    ++this._resourcesLoaded;
    res.loaded = true;

    // Dispatch done event when all resources loaded
    var numResources = Object.keys(this._resourcesToLoad).length;
    if (this._resourcesLoaded >= numResources)
    {
      this._entity.dispatch('resourcesloaded');
      return;
    }

    // Check if we can load any of our queued resources now
    for (var i = 0; i < this._queuedResources.length; ++i)
      this._loadResource(this._queuedResources[i], false);
  };

  this._loadResource = function(res, addToQueue)
  {
    // Skip if done
    if (res.loaded)
    {
      return;
    }

    // Check if all dependencies are loaded
    var dependenciesMet = true;
    for (var i = 0; i < res.dependencies.length; ++i)
    {
      var dep = this._resourcesToLoad[res.dependencies[i]];
      if (!dep.loaded)
        dependenciesMet = false;
    }

    // If not, add this resource to the queue for later
    if (!dependenciesMet)
    {
      if (addToQueue)
      {
        this._queuedResources.push(res);
      }
      return;
    }

    // Otherwise, we can now load the resource
    if (res.loader)
    {
      res.loader(res.name, res.path, this, function(loadedRes)
      {
        this._resourceLoaded(res, loadedRes);
      }.bind(this));
    }
    else if (res.path)
    {
      if (res.path.search(/(.png|.jpg|.jpeg|.gif)/) >= 0)
      {
        var img = new Image();
        img.src = res.path;
        img.onload = function()
        {
          this._resourceLoaded(res, img);
        }.bind(this);
      }
    }
  };
});
TANK.registerComponent('Shield')
.includes(['Pos2D', 'CircleCollider'])
.construct(function()
{
  this.zdepth = 5;

  this.health = 1;
  this.maxHealth = 1;
  this.regenRate = 0.1;
  this.radius = 5;
  this.burstTimer = 0;
  this.burstTime = 15;
  this.disabledTimer = 0;
  this.bubbleOpacity = 0;
  this.disabled = false;
  this.recovering = false;
})
.initialize(function()
{
  var t = this._entity.Pos2D;

  this._entity.CircleCollider.collisionLayer = 'shields';
  this._entity.CircleCollider.collidesWith = ['bullets'];
  this._entity.CircleCollider.setRadius(this.radius);

  TANK.main.Renderer2D.add(this);

  this.disable = function(time)
  {
    this.disabled = true;
    if (time > this.disabledTimer)
      this.disabledTimer = time;
  };

  this.listenTo(this._entity, 'collide', function(obj)
  {
    if (this.disabled || this.health <= 0)
      return;

    if (obj.Bullet)
    {
      obj.Life.life = 0;
      this.health -= obj.Bullet.damage;
      this.bubbleOpacity = this.health / this.maxHealth;
      if (this.health <= 0)
      {
        this.burstTimer = this.burstTime;
        this.recovering = true;
      }

      this._entity.dispatch('shielddamaged', obj.Bullet.owner);
      t.rotation = Math.atan2(obj.Pos2D.y - t.y, obj.Pos2D.x - t.x);
    }
  });

  this.update = function(dt)
  {
    if (this.disabled)
    {
      this.disabledTimer -= dt;
      if (this.disabledTimer <= 0)
      {
        this.disabled = false;
      }
      return;
    }

    if (this.bubbleOpacity > 0.01)
      this.bubbleOpacity *= 0.9;
    else
      this.bubbleOpacity = 0;

    if (this.recovering)
    {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0)
        this.recovering = false;
    }
    else
    {
      this.health += dt * this.regenRate;
      this.health = Math.min(this.health, this.maxHealth);
    }
  };

  this.draw = function(ctx, camera, dt)
  {
    if (this.disabled)
      return;

    ctx.save();

    var grad = ctx.createRadialGradient(this.radius * 0.75, 0, this.radius * 0.2, this.radius * 0.25, 0, this.radius * 0.75);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(1, 'rgba(150, 200, 255, 0.0)');

    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.globalAlpha = this.bubbleOpacity;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };
});
TANK.registerComponent('Ship')

.includes(['Pos2D', 'Velocity', 'LightingAndDamage', 'Engines', 'PixelCollider', 'Weapons', 'SoundEmitter'])

.construct(function()
{
  this.zdepth = 2;

  this.thrustOn = false;
  this.thrustAlpha = 0;
  this.heading = 0;
  this.desiredSpeed = 0;
  this.warpCharge = 0;
  this.warpChargeTime = 5;
  this.warpJammed = false;
  this.fuel = 0;
  this.shieldTimer = 5;
  this.shieldRecharging = false;

  this.dead = false;

  this.iff = 0;
  this.shipType = '';
  this.shipData = null;
  this.deadTimer = 0;
})

.serialize(function(serializer)
{
  serializer.property(this, 'shipType', '');
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  // Get some data from ship
  if (!this.shipData && this.shipType)
    this.shipData = new Ships[this.shipType]();
  this.resource = TANK.main.Resources.get(this.shipData.resource);
  this.health = this.shipData.health;
  this.fuel = this.shipData.maxFuel;
  this.width = this.resource.diffuse.width;
  this.height = this.resource.diffuse.height;

  // Set up shield
  this.shieldObj = TANK.createEntity('Shield');
  this._entity.addChild(this.shieldObj);
  this.shieldObj.Shield.health = this.shipData.shield;
  this.shieldObj.Shield.maxHealth = this.shipData.shield;
  this.shieldObj.Shield.regenRate = this.shipData.shieldGen;
  this.shieldObj.Shield.radius = this.shipData.shieldRadius;
  this.shieldObj.Pos2D.x = t.x;
  this.shieldObj.Pos2D.y = t.y;

  // Set up collision
  this._entity.PixelCollider.collisionLayer = 'ships';
  this._entity.PixelCollider.collidesWith = ['bullets', 'pickups'];
  this._entity.PixelCollider.setImage(this.resource.diffuse);

  // Set up lighting
  this._entity.LightingAndDamage.setResource(this.resource);

  // Create texture buffers
  this.mainBuffer = new PixelBuffer();
  this.damageBuffer = new PixelBuffer();
  this.decalBuffer = new PixelBuffer();

  // Set sizes for things
  this._entity.Weapons.width = this.width;
  this._entity.Weapons.height = this.height;
  this._entity.Engines.size = this.shipData.engineSize;
  this._entity.Engines.color = 'rgba(' + this.shipData.engineColor.join(', ') + ', 0)';
  this._entity.Engines.drawEngine();

  // Add weapons
  for (var gunSide in this.shipData.guns)
  {
    var guns = this.shipData.guns[gunSide];
    for (var j = 0; j < guns.length; ++j)
    {
      var gunData = guns[j];
      var gun = new Guns[gunData.type]();
      gun.x = gunData.x;
      gun.y = gunData.y;
      this._entity.Weapons.addGun(gun, gunSide);
    }
  };

  //
  // Move towards a given point
  //
  this.moveTowards = function(pos, speedPercent)
  {
    this.heading = Math.atan2(pos[1] - t.y, pos[0] - t.x);

    // Set speed
    if (typeof speedPercent === 'undefined')
      this.setSpeedPercent(1)
    else
      this.setSpeedPercent(speedPercent)

    // If not facing in the right direction just turn off engines
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, pos);
    if (Math.abs(dir) > 0.3)
      this.setSpeedPercent(0);
  };

  //
  // Set speed
  //
  this.setSpeedPercent = function(percent)
  {
    this.desiredSpeed = Math.min(this.shipData.maxSpeed, this.shipData.maxSpeed * percent);
  };

  //
  // Apply damage
  //
  this.addDamage = function(x, y, radius)
  {
    this._entity.LightingAndDamage.addDamage(x, y, radius);
    this._entity.SoundEmitter.play('hit-01');

    // Do damage to weapons on the ship
    for (var side in this._entity.Weapons.guns)
    {
      var guns = this._entity.Weapons.guns[side];
      for (var i = 0; i < guns.length; ++i)
      {
        var gun = guns[i];
        if (TANK.Math2D.pointDistancePoint([x, y], [gun.x, gun.y]) < radius)
        {
          this._entity.Weapons.removeGun(gun, side);
          i = 0;
        }
      }
    }
  };

  this.addRandomDamage = function(radius)
  {
    var x = Math.random() * this.width;
    var y = Math.random() * this.height;
    this.addDamage(x, y, radius);
  };

  //
  // Explode the ship
  //
  this.explode = function()
  {
    this._entity.dispatch('explode');

    // Remove objects
    TANK.main.removeChild(this._entity);
    TANK.main.removeChild(this.exploder);

    // Create explosion effect
    ParticleLibrary.explosionMedium(t.x, t.y);
    this._entity.SoundEmitter.play(this.shipData.explodeSound);

    // Create some fuel spawns
    var numFuelCells = Math.round(Math.random() * 2);
    for (var i = 0; i < numFuelCells; ++i)
    {
      var e = TANK.createEntity('FuelCell');
      e.Pos2D.x = t.x;
      e.Pos2D.y = t.y;
      TANK.main.addChild(e);
    }

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch('camerashake', 0.5);
  };

  //
  // Gun firing response
  //
  this.listenTo(this._entity, 'gunfired', function(gun)
  {
    this.shieldObj.Shield.disable(gun.shieldDisableTime);
  });

  //
  // Shield damage response
  //
  this.listenTo(this.shieldObj, 'shielddamaged', function(from)
  {
    this._entity.dispatch('aggro', from);
  });

  //
  // Collision response
  //
  this.listenTo(this._entity, 'collide', function(obj, pixelPos)
  {
    var objPos = [obj.Pos2D.x, obj.Pos2D.y];
    var bullet = obj.Bullet;

    if (bullet && bullet.owner !== this._entity)
    {
      // Do damage
      this.addDamage(pixelPos[0], pixelPos[1], bullet.damage * (30 + Math.random() * 30));
      this._entity.dispatch('damaged', bullet.damage, [obj.Velocity.x, obj.Velocity.y], objPos, bullet.owner);
      obj.Life.life = 0;

      // Spawn effect
      ParticleLibrary[bullet.damageEffect](objPos[0], objPos[1], obj.Pos2D.rotation + Math.PI);

      // Shake screen if on camera
      var camera = TANK.main.Renderer2D.camera;
      var dist = TANK.Math2D.pointDistancePoint(objPos, [camera.x, camera.y]);
      if (dist < 1) dist = 1;
      if (dist < window.innerWidth / 2)
        TANK.main.dispatch('camerashake', 0.1 / dist);
    }
  });

  //
  // Damage response
  //
  this.listenTo(this._entity, 'damaged', function(damage, dir, pos, owner)
  {
    // Affect trajectory
    v.x += dir[0] * damage * 0.1;
    v.y += dir[1] * damage * 0.1;
    var leftOrRight = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, [t.x + dir[0], t.y + dir[1]]);
    v.r += leftOrRight * damage;

    this.health -= damage;
    this._entity.dispatch('aggro', owner);
  });

  //
  // Update loop
  //
  this.update = function(dt)
  {
    // Update shield
    this.shieldObj.Pos2D.x = t.x;
    this.shieldObj.Pos2D.y = t.y;

    // Check if dead
    if (this.health < 0 && !this.dead)
    {
      this.deadTimer = 2.5 + Math.random() * 1.5;
      this.dead = true;
      this.exploder = ParticleLibrary.slowMediumFire();
      TANK.main.addChild(this.exploder);
    }

    // Explode after a bit of time
    if (this.deadTimer < 0)
      this.explode();
    if (this.dead)
    {
      this.exploder.Pos2D.x = t.x;
      this.exploder.Pos2D.y = t.y;
      this.deadTimer -= dt;

      if (Math.random() < 0.1)
        this.addDamage(-50 + Math.random() * 100, -50 + Math.random() * 100, 4 + Math.random() * 4);
      return;
    }

    // Apply heading logic
    var headingVec = [Math.cos(this.heading), Math.sin(this.heading)];
    var currentVec = [Math.cos(t.rotation), Math.sin(t.rotation)]
    var headingDot = TANK.Math2D.dot(headingVec, currentVec);
    var dir = TANK.Math2D.getDirectionToPoint([0, 0], t.rotation, headingVec);
    if (Math.abs(1 - headingDot) > 0.01 && dir < 0)
      v.r -= dt * this.shipData.turnAccel;
    else if (Math.abs(1 - headingDot) > 0.01 && dir > 0)
      v.r += dt * this.shipData.turnAccel;
    else
      v.r *= 0.95;

    // Calculate some values for speed logic
    this.desiredSpeed = Math.min(this.desiredSpeed, this.shipData.maxSpeed);
    this.desiredSpeed = Math.max(this.desiredSpeed, 0);
    var currentSpeed = v.getSpeed();
    var moveVec = [v.x, v.y];
    var moveAngle = Math.atan2(v.y, v.x);
    var dirToHeading = TANK.Math2D.getDirectionToPoint([0, 0], moveAngle, headingVec);
    var headingSpeedVec = TANK.Math2D.scale(headingVec, this.desiredSpeed);
    var correctionVec = TANK.Math2D.subtract(headingSpeedVec, moveVec);

    // If we are moving significantly in the wrong direction, or not fast enough,
    // then we should apply thrust
    if (this.desiredSpeed > 0 && (Math.abs(dirToHeading) > 0.1 || currentSpeed < this.desiredSpeed - 1))
    {
      v.x += Math.cos(t.rotation) * dt * this.shipData.accel;
      v.y += Math.sin(t.rotation) * dt * this.shipData.accel;
      if (!this.thrustOn)
        this._entity.dispatch('ThrustOn');
      this.thrustOn = true;
    }
    // Otherwise, turn off the thrusters
    else
    {
      if (this.thrustOn)
        this._entity.dispatch('ThrustOff');
      this.thrustOn = false;
    }
    // Slow down if moving faster than we want
    if (currentSpeed > this.desiredSpeed + 1)
    {
      v.x *= 0.99;
      v.y *= 0.99;
    }
    // Correct trajectory
    v.x += correctionVec[0] * dt * 0.07;
    v.y += correctionVec[1] * dt * 0.07;

    // Cap movement
    if (Math.abs(v.r) > this.shipData.maxTurnSpeed)
      v.r *= 0.95;
    if (currentSpeed > this.shipData.maxSpeed)
    {
      var moveAngle = Math.atan2(v.y, v.x);
      v.x = Math.cos(moveAngle) * this.shipData.maxSpeed;
      v.y = Math.sin(moveAngle) * this.shipData.maxSpeed;
    }

    // Timers
    this.reloadTimer -= dt;
    this.warpCharge += dt;

    // Handle engine alpha
    if (this.thrustOn)
      this.thrustAlpha += dt;
    else
      this.thrustAlpha -= dt;
    this.thrustAlpha = Math.max(0, this.thrustAlpha);
    this.thrustAlpha = Math.min(1, this.thrustAlpha);
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();

    // Set up transform
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.resource.diffuse.width / -2, this.resource.diffuse.height / -2);

    // Draw the main ship buffer
    this._entity.LightingAndDamage.redraw();
    ctx.drawImage(this._entity.LightingAndDamage.mainBuffer.canvas, 0, 0);

    ctx.restore();
  };
});
TANK.registerComponent('ShipHud')

.construct(function()
{
  this.htmlText =
  [
    '<div class="console-window ship-hud">',
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Speed</div>',
    ' <div class="ship-hud-value ship-hud-speed"></div>',
    '</div>',
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Armor</div>',
    ' <div class="ship-hud-value ship-hud-armor"></div>',
    '</div>',
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Shield</div>',
    ' <div class="ship-hud-value ship-hud-shield"></div>',
    '</div>',
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Fore</div>',
    ' <div class="ship-hud-value ship-hud-fore"></div>',
    '</div>',
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Starboard</div>',
    ' <div class="ship-hud-value ship-hud-starboard"></div>',
    '</div>',
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Aft</div>',
    ' <div class="ship-hud-value ship-hud-aft"></div>',
    '</div>',
    '<div class="ship-hud-item">',
    ' <div class="ship-hud-label">Port</div>',
    ' <div class="ship-hud-value ship-hud-port"></div>',
    '</div>',
    '</div>'
  ].join('\n');

  this.barSize = 10;
  this.fillChar = '=';
  this.emptyChar = '-';
})

.initialize(function()
{
  var ship = this._entity.Ship;
  var weapons = this._entity.Weapons;
  var shield = ship.shieldObj.Shield;

  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container);

  //
  // Get UI handles
  //
  this.speedValue = this.container.querySelector('.ship-hud-speed');
  this.armorValue = this.container.querySelector('.ship-hud-armor');
  this.shieldValue = this.container.querySelector('.ship-hud-shield');
  this.foreValue = this.container.querySelector('.ship-hud-fore');
  this.starboardValue = this.container.querySelector('.ship-hud-starboard');
  this.aftValue = this.container.querySelector('.ship-hud-aft');
  this.portValue = this.container.querySelector('.ship-hud-port');

  this.buildBarText = function(percent)
  {
    var chars = [];
    var fillNum = Math.round(this.barSize * percent);
    for (var i = 0; i < this.barSize; ++i)
      chars.push(i < fillNum ? this.fillChar : this.emptyChar);
    return chars.join('');
  };

  this.update = function(dt)
  {
    this.speedValue.innerHTML = this.buildBarText(ship.desiredSpeed / ship.shipData.maxSpeed);
    this.armorValue.innerHTML = this.buildBarText(ship.health / ship.shipData.health);
    this.shieldValue.innerHTML = this.buildBarText(shield.health / ship.shipData.shield);

    this.foreValue.innerHTML = this.buildBarText(weapons.reloadPercent('front'));
    this.starboardValue.innerHTML = this.buildBarText(weapons.reloadPercent('right'));
    this.aftValue.innerHTML = this.buildBarText(weapons.reloadPercent('back'));
    this.portValue.innerHTML = this.buildBarText(weapons.reloadPercent('left'));
  };
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
});
TANK.registerComponent('ShipSelection')

.construct(function()
{
  this.htmlText =
  [
    '<div class="main-menu">',
    '  <div class="menu-title">Select a Ship</div>',
    '  <div class="ship-select ship-select-left">&lt;</div>',
    '  <div class="ship-select ship-select-right">&gt;</div>',
    '  <div class="menu-options">',
    '    <div class="menu-option menu-option-go">Start</div>',
    '  </div>',
    '</div>'
  ].join('\n');

  this.ships = [];
  this.selection = 0;
})

.initialize(function()
{
  //
  // Create UI
  //
  this.container = document.createElement('div');
  this.container.innerHTML = this.htmlText;
  document.body.appendChild(this.container)

  this.container.querySelector('.menu-options').style.height = '30%';

  //
  // Handle interactions
  //
  this.container.querySelector('.ship-select-left').addEventListener('click', function()
  {
    this.shiftSelection(-1);
  }.bind(this));
  this.container.querySelector('.ship-select-right').addEventListener('click', function()
  {
    this.shiftSelection(1);
  }.bind(this));
  this.container.querySelector('.menu-option-go').addEventListener('click', function()
  {
    this._entity.dispatch('selectionmade', this.ships[this.selection].shipType);
  }.bind(this));

  //
  // Create scene
  //
  var x = 0;
  for (var i in Ships)
  {
    var ship = new Ships[i]();
    if (!ship.playable || !TANK.main.Game.shipUnlocked(i))
      continue;

    var e = TANK.createEntity(['Ship', 'ShipStats']);
    e.Pos2D.x = x;
    e.Pos2D.y = -100;
    e.Ship.shipData = ship;
    e.shipType = i;
    TANK.main.addChild(e);
    this.ships.push(e);
    x += 500;
  }

  //
  // Move selection
  //
  this.shiftSelection = function(amount)
  {
    this.selection += amount;
    this.selection = Math.max(0, this.selection);
    this.selection = Math.min(this.ships.length - 1, this.selection);
  };

  //
  // Update
  //
  this.update = function(dt)
  {
    for (var i = 0; i < this.ships.length; ++i)
    {
      var dist = i - this.selection;
      var desiredPos = dist * 500;
      var t = this.ships[i].Pos2D;
      t.x = t.x + (desiredPos - t.x) * 0.2;
    }
  };
})

.uninitialize(function()
{
  document.body.removeChild(this.container);
  for (var i = 0; i < this.ships.length; ++i)
    TANK.main.removeChild(this.ships[i]);
  this.ship = [];
});
TANK.registerComponent('ShipStats')

.construct(function()
{
  this.zdepth = 10;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;

  TANK.main.Renderer2D.add(this);

  var stats =
  [
    {name: 'Name', property: 'name'},
    {name: 'Starting fuel', property: 'maxFuel'},
    {name: 'Max speed', property: 'maxSpeed'},
    {name: 'Armor', property: 'health'},
    {name: 'Shield', property: 'shield'},
    {name: 'Shield regen', property: 'shieldGen'},
  ];

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);

    ctx.fillStyle = '#ddd';
    ctx.font = '10px space-frigate';

    // Draw stats
    for (var i = 0; i < stats.length; ++i)
    {
      ctx.fillText(stats[i].name + ' - ' + ship.shipData[stats[i].property], ship.width / -2, ship.height / 2 + i * 12 - 5);
    };

    ctx.restore();
  };
});
var Ships = {};

Ships.fighter = function()
{
  this.name = 'Fighter';
  this.resource = 'fighter';
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 250;
  this.accel = 35;
  this.turnAccel = 2.0;
  this.health = 0.2;
  this.shield = 0.2;
  this.shieldGen = 0.01;
  this.shieldRadius = 30;
  this.maxFuel = 5;
  this.optimalAngle = 0;
  this.engineSize = [18, 8];
  this.engineColor = [50, 100, 255];
  this.guns =
  {
    front:
    [
      {type: 'smallRail', x: 28, y: 21}
    ]
  };
  this.engines =
  [
    {x: 11, y: 7},
    {x: 9, y: 25},
    {x: 14, y: 35}
  ];
};

Ships.bomber = function()
{
  this.name = 'Bomber';
  this.resource = 'bomber';
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.8;
  this.maxSpeed = 200;
  this.accel = 35;
  this.turnAccel = 1.6;
  this.health = 0.4;
  this.shield = 0.4;
  this.shieldGen = 0.01;
  this.shieldRadius = 50;
  this.maxFuel = 7;
  this.optimalAngle = 0;
  this.engineSize = [24, 12];
  this.engineColor = [50, 100, 255];
  this.guns =
  {
    front:
    [
      {type: 'mediumRocket', x: 60, y: 60}
    ]
  };
  this.engines =
  [
    {x: 29, y: 36},
    {x: 25, y: 45},
    {x: 23, y: 75}
  ];
};

Ships.frigate = function()
{
  this.name = 'Frigate';
  this.resource = 'frigate';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.35;
  this.maxSpeed = 120;
  this.accel = 12;
  this.turnAccel = 1.2;
  this.health = 1;
  this.shield = 0.5;
  this.shieldGen = 0.01;
  this.shieldRadius = 80;
  this.maxFuel = 10;
  this.optimalAngle = Math.PI / 2;
  this.engineSize = [24, 16];
  this.engineColor = [50, 100, 255];
  this.guns =
  {
    left:
    [
      {type: 'mediumRail', x: 85, y: 39},
      {type: 'mediumRail', x: 35, y: 39}
    ],
    front:
    [
      {type: 'mediumRail', x: 106, y: 69}
    ],
    right:
    [
      {type: 'mediumRail', x: 16, y: 85},
      {type: 'mediumRail', x: 44, y: 85}
    ],
    back:
    [
      {type: 'mediumRail', x: 36, y: 69}
    ]
  };
  this.engines =
  [
    {x: 18, y: 39},
    {x: 6, y: 84},
  ];
};

Ships.blade = function()
{
  this.name = 'Blade';
  this.resource = 'ship-blade';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.30;
  this.maxSpeed = 150;
  this.accel = 16;
  this.turnAccel = 1.1;
  this.health = 1.5;
  this.shield = 0.25;
  this.shieldGen = 0.015;
  this.shieldRadius = 85;
  this.maxFuel = 7;
  this.optimalAngle = Math.PI / 2;
  this.engineSize = [48, 24];
  this.engineColor = [50, 100, 255];
  this.guns =
  {
    left:
    [
      {type: 'mediumRail', x: 45, y: 55},
      {type: 'mediumRail', x: 90, y: 64},
    ],
    right:
    [
      {type: 'mediumRail', x: 45, y: 94},
      {type: 'mediumRail', x: 90, y: 86},
    ],
    front:
    [
      {type: 'smallRail', x: 136, y: 69},
      {type: 'smallRail', x: 136, y: 79},
    ]
  };
  this.engines =
  [
    {x: 21, y: 75},
    {x: 28, y: 40}
  ];
};

Ships.albatross = function()
{
  this.name = 'Albatross';
  this.resource = 'ship-albatross';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.40;
  this.maxSpeed = 100;
  this.accel = 10;
  this.turnAccel = 1.2;
  this.health = 0.5;
  this.shield = 1;
  this.shieldGen = 0.01;
  this.shieldRadius = 80;
  this.maxFuel = 13;
  this.optimalAngle = 0;
  this.engineSize = [36, 20];
  this.engineColor = [255, 100, 255];
  this.guns =
  {
    left:
    [
      {type: 'smallRail', x: 50, y: 44},
      {type: 'smallRail', x: 101, y: 35},
    ],
    right:
    [
      {type: 'smallRail', x: 45, y: 85},
      {type: 'smallRail', x: 91, y: 91},
    ],
    front:
    [
      {type: 'mediumRocket', x: 96, y: 50},
      {type: 'mediumRocket', x: 96, y: 76},
    ],
    back:
    [
      {type: 'mediumRail', x: 44, y: 64}
    ]
  };
  this.engines =
  [
    {x: 16, y: 45},
    {x: 37, y: 63},
    {x: 85, y: 90}
  ];
};

Ships.rhino = function()
{
  this.name = 'Rhino';
  this.resource = 'ship-rhino';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.25;
  this.maxSpeed = 100;
  this.accel = 10;
  this.turnAccel = 1.2;
  this.health = 1;
  this.shield = 0.5;
  this.shieldGen = 0.01;
  this.shieldRadius = 80;
  this.maxFuel = 10;
  this.optimalAngle = 0;
  this.engineSize = [36, 16];
  this.engineColor = [100, 255, 100];
  this.guns =
  {
    left:
    [
      {type: 'smallRail', x: 100, y: 60},
      {type: 'smallRail', x: 67, y: 68},
    ],
    right:
    [
      {type: 'smallRail', x: 100, y: 88},
      {type: 'smallRail', x: 67, y: 81},
    ],
    front:
    [
      {type: 'mediumRail', x: 139, y: 67},
      {type: 'mediumRail', x: 139, y: 81},
    ],
  };
  this.engines =
  [
    {x: 26, y: 76},
    {x: 121, y: 48},
  ];
};

Ships.enforcer = function()
{
  this.name = 'Enforcer';
  this.resource = 'ship-enforcer';
  this.playable = true;
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.45;
  this.maxSpeed = 175;
  this.accel = 18;
  this.turnAccel = 1.4;
  this.health = 0.3;
  this.shield = 1.5;
  this.shieldGen = 0.012;
  this.shieldRadius = 80;
  this.maxFuel = 6;
  this.optimalAngle = 0;
  this.engineSize = [32, 16];
  this.engineColor = [100, 255, 255];
  this.guns =
  {
    front:
    [
      {type: 'mediumRocket', x: 97, y: 67},
      {type: 'smallRail', x: 116, y: 64},
      {type: 'smallRail', x: 46, y: 114},
    ],
  };
  this.engines =
  [
    {x: 32, y: 11},
    {x: 17, y: 45},
    {x: 5, y: 78},
  ];
};

// Ships.alien = function()
// {
//   this.name = 'Alien';
//   this.maxTurnSpeed = 0.35;
//   this.maxSpeed = 150;
//   this.accel = 15;
//   this.turnAccel = 1.2;
//   this.health = 1;
//   this.cost = 30;
//   this.buildTime = 15;
//   this.threat = 10;
//   this.optimalAngle = Math.PI / 2;
//   this.guns =
//   {
//   },
//   this.lights =
//   [
//     {
//       x: 10, y: 33, colorA: [255, 200, 255], colorB: [255, 140, 255], state: 'off', isEngine: true,
//       states:
//       {
//         on: {radius: 10, alpha: 0.8},
//         off: {radius: 6, alpha: 0.3}
//       }
//     }
//   ];
// };
function LoadSounds()
{
  var sounds =
  [
    'small-rail-01',
    'medium-rail-01',
    'explode-01',
    'blip-01',
    'hit-01'
  ];

  for (var i = 0; i < sounds.length; ++i)
  {
    var name = sounds[i];
    var fileName = 'res/snd/' + name + '.wav';
    Wave.load(fileName, name);
  }
}
TANK.registerComponent('SoundEmitter')

.includes(['Pos2D'])

.construct(function()
{
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var ear = TANK.main.Renderer2D.camera;
  var earRange = 600;

  this.play = function(name)
  {
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [ear.x, ear.y]);
    var volume = Math.min(1, earRange / dist) * TANK.main.Game.volume;
    Wave.play(name, volume);
  };
});
var Spawns = {};

Spawns.civilian = function()
{
  var e = TANK.createEntity('AICivilian');
  e.Ship.shipData = new Ships.fighter();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
};

Spawns.warpJammer = function()
{
  var e = TANK.createEntity('WarpJammer');
  TANK.main.addChild(e);
};

Spawns.pirate = function()
{
  var ships =
  [
    'bomber',
    'frigate',
    'blade',
    'albatross',
    'rhino'
  ];
  var ship = ships[Math.floor(Math.random() * ships.length)];

  var e = TANK.createEntity('AIAttackPlayer');
  e.Ship.shipData = new Ships[ship]();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
};

Spawns.police = function()
{
  var e = TANK.createEntity('AIPolice');
  e.Ship.shipData = new Ships.enforcer();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
};

Spawns.derelict = function()
{
  var e = TANK.createEntity('AIDerelict');
  e.Ship.shipData = new Ships.frigate();
  e.Pos2D.x = 3000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);

  e = TANK.createEntity('TriggerRadius');
  e.TriggerRadius.radius = 1000;
  e.TriggerRadius.events = [{probability: 0.25, name: 'derelict_1a'}, {probability: 0.75, name: 'derelict_1b'}];
  e.Pos2D.x = 3000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);
};
TANK.registerComponent('Star')
.includes(['Pos2D', 'DirectionalLight'])
.construct(function()
{
  this.zdepth = 10;
  this.radius = 2000;
  this.innerColor = [255, 255, 255];
  this.outerColor = [255, 0, 255];
})
.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.draw = function(ctx, camera, dt)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);

    var grad = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius);
    grad.addColorStop(0.0, 'rgb(' + this.innerColor.join(', ') + ')');
    grad.addColorStop(0.3, 'rgba(' + this.innerColor.join(', ') + ', 0.5)');
    grad.addColorStop(0.8, 'rgba(' + this.outerColor.join(', ') + ', 0.1)');
    grad.addColorStop(1.0, 'rgba(' + this.outerColor.join(', ') + ', 0.0)');

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };
});
TANK.registerComponent("StarField")

.construct(function()
{
  this.zdepth = -10;
  this.stars = [];
})

.initialize(function()
{
  TANK.main.Renderer2D.add(this);

  var i;
  for (i = 0; i < 100; ++i)
  {
    var r =
    this.stars.push(
    {
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.01 + 0.001,
      size: Math.random() * 3 + 0.1,
      color: "rgba(" + Math.round(150 + Math.random() * 100) +
        ", " + Math.round(150 + Math.random() * 100) +
        ", " + Math.round(150 + Math.random() * 100) +
        ", " + (0.5 + Math.random() * 0.5) + ")"
    });
  }

  this.redraw = function()
  {
    this.pixelBuffer = new PixelBuffer();
    this.pixelBuffer.createBuffer(window.innerWidth, window.innerHeight);

    for (i = 0; i < this.stars.length; ++i)
    {
      var x = (this.stars[i].x);
      var y = (this.stars[i].y);

      this.pixelBuffer.context.fillStyle = this.stars[i].color;
      this.pixelBuffer.context.fillRect(x * window.innerWidth, y * window.innerHeight, this.stars[i].size, this.stars[i].size);
    }
  }

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.scale(camera.z, camera.z);
    ctx.drawImage(this.pixelBuffer.canvas, -window.innerWidth / 2, -window.innerHeight / 2);
    ctx.restore();
  };

  window.addEventListener('resize', this.redraw.bind(this));
  this.redraw();
});

TANK.registerComponent('TriggerRadius')

.includes(['Pos2D'])

.construct(function()
{
  this.radius = 1000;
  this.events = [];
  this.removeOnTrigger = true;
})

.serialize(function(serializer)
{
  serializer.property(this, 'radius', 1000);
  serializer.property(this, 'events', []);
  serializer.property(this, 'removeOnTrigger', true);
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.update = function(dt)
  {
    // Check if player comes within a certain range
    var player = TANK.main.Game.player;
    if (TANK.Math2D.pointDistancePoint([player.Pos2D.x, player.Pos2D.y], [t.x, t.y]) < this.radius)
    {
      var weights = this.events.map(function(ev) {return ev.probability;});
      var chosenIndex = TANK.main.Game.randomWeighted(weights);
      var chosenEvent = this.events[chosenIndex];
      TANK.main.Game.triggerEvent(chosenEvent.name);

      if (this.removeOnTrigger)
        this._entity.removeComponent(this._name);
    }
  };
});
TANK.registerComponent('WarpEffect')
.includes(['RemoveOnLevelChange'])
.construct(function()
{
  this.et = 1;
  this.zdepth = 10;
})
.initialize(function()
{
  TANK.main.Renderer2D.add(this);
  // this.oldClearColor = TANK.main.Renderer2D.clearColor;
  // TANK.main.Renderer2D.clearColor = [0, 0, 0, 0];

  var scale = 2;
  var context = TANK.main.Renderer2D.context;
  var pixelBuffer = new PixelBuffer();
  pixelBuffer.createBuffer(Math.floor(context.canvas.width / scale), Math.floor(context.canvas.height / scale));
  pixelBuffer.context.scale(1 / scale, 1 / scale);
  pixelBuffer.context.drawImage(context.canvas, 0, 0);

  var pixelBufferCopy = new PixelBuffer();
  pixelBufferCopy.createBuffer(Math.floor(context.canvas.width / scale), Math.floor(context.canvas.height / scale));
  pixelBufferCopy.context.scale(1 / scale, 1 / scale);
  pixelBufferCopy.context.drawImage(context.canvas, 0, 0);
  pixelBufferCopy.readBuffer();

  this.draw = function(ctx, camera, dt)
  {
    camera.z = 1;

    ctx.save();
    this.et += dt;
    pixelBuffer.readBuffer();
    for (var i = 0; i < 3000; ++i)
    {
      var point = [Math.random() * pixelBuffer.width, Math.random() * pixelBuffer.height];
      var vec = TANK.Math2D.scale(TANK.Math2D.normalize(TANK.Math2D.subtract([pixelBuffer.width / 2, pixelBuffer.height / 2], point)), this.et * this.et * 2);
      var sample = pixelBuffer.getPixel(Math.floor(point[0]), Math.floor(point[1])).map(function(v) {return v * 1.1;});
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0]), Math.floor(point[1] + vec[1]), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 2), Math.floor(point[1] + vec[1] * 2), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] * 1.5), Math.floor(point[1] + vec[1] * 1.5), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] / 2), Math.floor(point[1] + vec[1] / 2), sample);
      pixelBuffer.setPixel(Math.floor(point[0] + vec[0] / 4), Math.floor(point[1] + vec[1] / 4), sample);
    }
    pixelBuffer.applyBuffer();

    ctx.scale(scale, scale);
    ctx.translate(-pixelBuffer.width / 2, -pixelBuffer.height / 2);
    ctx.drawImage(pixelBuffer.canvas, 0, 0);
    ctx.restore();
  };
})

.uninitialize(function()
{
  // TANK.main.Renderer2D.clearColor = this.oldClearColor;
});
TANK.registerComponent('WarpJammer')
.includes(['Life', 'RemoveOnLevelChange'])
.initialize(function()
{
  this._entity.Life.life = 60;
});
TANK.registerComponent('Weapons')

.includes('Pos2D')

.construct(function()
{
  this.zdepth = 3;
  this.guns =
  {
    left: [],
    right: [],
    front: [],
    back: []
  };
  this.height = 10;
  this.width = 5;
  this.maxRange = 0;

  this.pendingFires = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  this.addGun = function(gunObj, gunSide)
  {
    var angle;
    if (gunSide === 'front')
      angle = 0;
    else if (gunSide === 'back')
      angle = Math.PI;
    else if (gunSide === 'left')
      angle = Math.PI / -2;
    else if (gunSide === 'right')
      angle = Math.PI / 2;

    gunObj.angle = angle;
    this.guns[gunSide].push(gunObj);
  };

  this.removeGun = function(gunObj, gunSide)
  {
    for (var i = 0; i < this.guns[gunSide].length; ++i)
    {
      if (this.guns[gunSide][i] === gunObj)
      {
        this.guns[gunSide].splice(i, 1);
        return true;
      }
    }

    return false;
  };

  this.reloadPercent = function(gunSide)
  {
    if (this.guns[gunSide].length === 0)
      return 0;
    var gun = this.guns[gunSide][0];
    return 1 - gun.reloadTimer / gun.reloadTime;
  };

  this.fireGun = function(gunIndex, gunSide)
  {
    var gun = this.guns[gunSide][gunIndex];
    if (!gun || gun.reloadTimer > 0)
      return;
    gun.reloadTimer = gun.reloadTime;
    this._entity.dispatch('gunfired', gun);

    var pos = gun.worldPos;

    // Fire bullet
    var e = TANK.createEntity('Bullet');
    e.Pos2D.x = pos[0];
    e.Pos2D.y = pos[1];
    e.Pos2D.rotation = t.rotation + gun.angle;
    e.Velocity.x = v.x + Math.cos(t.rotation + gun.angle) * gun.projectileSpeed;
    e.Velocity.y = v.y + Math.sin(t.rotation + gun.angle) * gun.projectileSpeed;
    e.Life.life = gun.projectileLife || gun.range / gun.projectileSpeed;
    e.Bullet.owner = this._entity;
    e.Bullet.damage = gun.damage;
    e.Bullet.trailEffect = gun.trailEffect;
    e.Bullet.damageEffect = gun.damageEffect;
    e.Bullet.size = gun.projectileSize;
    e.Bullet.accel = gun.projectileAccel;
    TANK.main.addChild(e);

    // Create effect
    ParticleLibrary[gun.shootEffect](pos[0], pos[1], t.rotation + gun.angle);

    // Play sound
    this._entity.SoundEmitter.play(gun.shootSound);

    // Recoil
    v.x -= Math.cos(t.rotation + gun.angle) * gun.recoil;
    v.y -= Math.sin(t.rotation + gun.angle) * gun.recoil;
    v.r += -gun.recoil * 0.05 + Math.random() * gun.recoil * 0.1;

    // Shake screen
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < 1) dist = 1;
    if (dist < window.innerWidth / 2 && gun.screenShake > 0)
      TANK.main.dispatch('camerashake', gun.screenShake / (dist * 5));
  };

  this.fireGunDelayed = function(gunIndex, gunSide, delay)
  {
    this.pendingFires.push({gunIndex: gunIndex, gunSide: gunSide, delay: delay});
  };

  this.fireGuns = function(gunSide)
  {
    var guns = this.guns[gunSide];
    for (var i = 0; i < guns.length; ++i)
      this.fireGunDelayed(i, gunSide, (i * 0.15) * (1 + Math.random() * 0.25));
  };

  this.update = function(dt)
  {
    // Update all guns
    this.maxRange = 0;
    for (var i in this.guns)
    {
      var guns = this.guns[i];
      for (var j = 0; j < guns.length; ++j)
      {
        // Reload timer
        guns[j].reloadTimer -= dt;
        if (guns[j].reloadTimer < 0)
          guns[j].reloadTimer = 0;

        // Calculate world position of gun
        var pos = [guns[j].x, guns[j].y];
        pos = TANK.Math2D.subtract(pos, [this.width / 2, this.height / 2]);
        pos = TANK.Math2D.rotate(pos, t.rotation);
        pos = TANK.Math2D.scale(pos, TANK.main.Game.scaleFactor);
        pos = TANK.Math2D.add(pos, [t.x, t.y]);
        guns[j].worldPos = pos;

        // Find max range
        this.maxRange = Math.max(this.maxRange, guns[j].range);
      }
    }

    // Fire queued shots
    for (var i = 0; i < this.pendingFires.length; ++i)
    {
      var pending = this.pendingFires[i];
      pending.delay -= dt;
      if (pending.delay <= 0)
      {
        this.fireGun(pending.gunIndex, pending.gunSide);
      }
    }

    this.pendingFires = this.pendingFires.filter(function(val) {return val.delay > 0;});
  };

  this.draw = function(ctx, camera)
  {
    if (camera.z > 6)
      return;

    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.width / -2, this.height / -2);

    for (var gunSide in this.guns)
    {
      for (var i = 0; i < this.guns[gunSide].length; ++i)
      {
        var gun = this.guns[gunSide][i];
        ctx.save();
        ctx.translate(gun.x, gun.y);
        ctx.rotate(gun.angle);

        if (!gun.image)
        {
          ctx.fillStyle = '#fff';
          ctx.fillRect(-2.5, -2.5, 5, 5);
        }
        else
        {
          ctx.scale(0.5, 0.5);
          ctx.translate(gun.image.width / -2, gun.image.height / -2);
          ctx.drawImage(gun.image, 0, 0);
        }
        ctx.restore();
      }
    }

    ctx.restore();
  };
});

function main()
{
  LoadSounds();

  TANK.createEngine(['Input', 'CollisionManager', 'Renderer2D', 'Resources', 'Game', 'MapGeneration', 'StarField', 'DustField']);

  TANK.main.Renderer2D.context = document.querySelector('#canvas').getContext('2d');
  TANK.main.Input.context = document.querySelector('#stage');

  TANK.start();
}