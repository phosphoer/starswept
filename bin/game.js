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
    var targetVelocity = [this.target.Velocity.x, this.target.Velocity.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
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

  this.listenTo(this._entity, 'damaged', function(amount, direction, position, owner)
  {
    this._entity.addComponent('AIAttack');
    this._entity.AIAttack.target = owner;
    this._entity.removeComponent('AICivilian');
  });
});
TANK.registerComponent('Asteroid')

.includes(['LightingAndDamage', 'Velocity', 'PixelCollider', 'RemoveOnLevelChange'])

.construct(function()
{
  this.zdepth = 2;
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
  t.r = Math.random() * Math.PI * 2;

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
  this.cloudScale = 3;
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
    this.heightMap[i][j] *= 1 - (dist / (this.cloudSize / 2 + 2));
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
TANK.registerComponent('Derelict')
.initialize(function()
{
  this.listenTo(TANK.main, 'derelictleave', function()
  {
    this._entity.addComponent('AICivilian');
  });
});
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
TANK.registerComponent("Engines")

.includes("Pos2D")

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
  var lights = this._entity.Lights;

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

    for (var i = 0; i < lights.lights.length; ++i)
    {
      var light = lights.lights[i];
      if (!light.isEngine)
        continue;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(this.engineBuffer.width / -1, this.engineBuffer.height / -2);
      ctx.drawImage(this.engineBuffer.canvas, light.x + 4, light.y);
      ctx.restore();
    }

    ctx.restore();
  };

  this.drawEngine();
});
var Events = {};

Events.civilian =
{
  text: 'Your scanners pick up the signature of a small ship nearby',
  spawns: ['civilian']
};

Events.pirate =
{
  text: 'Alarms begin sounding as soon as the warp is complete, you are under attack!',
  spawns: ['pirate']
};

Events.derelict =
{
  text: 'Your scanners pick up the signature of a mid sized ship, but the signal is much fainter than you would expect. The signal originates from a short distance ahead.',
  spawns: ['derelict']
};

Events.derelict_1a =
{
  text: 'As you approach, a quick bio scan reveals no lifeforms. Looks like you arrived a bit too late. Or right on time, depending on your outlook.'
};

Events.derelict_1b =
{
  text: 'Upon approaching, you are contacted by the ship. The captain informs you that they have been stranded for days, and pleads with you to give them 3 fuel cells so they can return home.',
  options:
  [
    {
      text: 'Decline, you need all the fuel you\'ve got.',
      responseText: 'The tension in the air as you deliver the bad news is palpable. The comms connection disconnects.'
    },
    {
      text: 'Agree to give them some fuel. Your shields must shut off completely to make the transfer.',
      events:
      [
        {probability: 0.5, name: 'derelict_2b'},
        {probability: 0.5, name: 'derelict_2b'}
      ]
    }
  ]
};

Events.derelict_2a =
{
  text: 'The captain thanks you profusely and speeds off.',
  dispatchEvent: 'derelictleave'
};

Events.derelict_2b =
{
  text: 'As soon as you disable your shields, several hostile ship signatures show up on the scanner. Looks like you are about to regret your helpful nature.',
  spawns:
  [
    'pirate',
    'pirate'
  ]
};

Events.test =
{
  text: 'A test event'
};
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

  // Mouse positions
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];

  // Global light direction
  this.lightDir = 0;

  this.playerShipSelection = 'frigate';
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
    res.lightBuffers = Lightr.bake(8, res.diffuse, res.normals);
    doneCallback(res);
  };

  resources.add('asteroid-01-diffuse', 'res/img/asteroid-01.png');
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

  // Build event log ractive
  this.eventLogUI = new Ractive(
  {
    el: 'eventLogContainer',
    template: '#eventLogTemplate',
    data: {logs: this.eventLogs}
  });

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
    var save = {};
    localStorage['save-' + slot] = JSON.stringify(save);
  };

  //
  // Load a save slot
  //
  this.load = function(slot)
  {
    var save = JSON.parse(localStorage['save-' + slot]);
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

    // Handle main menu interactions
    this.listenTo(this.mainMenu, 'newgame', function()
    {
      TANK.main.removeChild(this.mainMenu);
      this.goToShipSelection();
    });
  };

  //
  // Go to selection screen
  //
  this.goToShipSelection = function()
  {
    // Build menu
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
    var rand = Math.random();
    var intervals = [];
    var min = 0;
    var max = 0;
    for (var i = 0; i < weights.length; ++i)
    {
      max = min + weights[i];
      if (rand >= min && rand <= max)
        return i;
      min += weights[i];
    }
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

  //
  // Clear event log
  //
  this.clearEventLog = function()
  {
    while (this.eventLogs.length)
      this.eventLogs.pop();
  };

  //
  // Show location options
  //
  this.showLocationOptions = function()
  {
    for (var i = 0; i < this.currentNode.paths.length; ++i)
    {
      var node = this.currentNode.paths[i];
      var location = Locations[node.locationName];
      this.addEventLog((i + 1) + '. ' + location.name);
    }

    this.waitingForJump = true;
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

    // Set location attributes
    TANK.main.Renderer2D.clearColor = 'rgba(' + location.bgColor.join(', ') + ')';
    Lightr.lightDiffuse = location.lightColor;
    this.lightDir = location.lightDir;
    this.rebuildLighting();

    // Create player entity if it doesn't exist
    if (!this.player)
    {
      this.player = TANK.createEntity('Player');
      this.player.Ship.shipData = new Ships[this.playerShipSelection]();
      TANK.main.addChild(this.player);
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
    if (location.events)
    {
      var weights = location.events.map(function(ev) {return ev.probability;});
      var chosenIndex = this.randomWeighted(weights);
      var chosenEvent = location.events[chosenIndex];
      this.triggerEvent(chosenEvent.name);
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
      this.waitingForJump = false;
      for (var i = 0; i < event.options.length; ++i)
        this.addEventLog((i + 1) + '. ' + event.options[i].text);
    }
  };

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

      // Choose to jump to a location
      if (this.waitingForJump)
      {
        this.waitingForJump = false;

        if (!this.warpReady)
        {
          var timeRemaining = this.player.Ship.shipData.warpChargeTime - this.player.Ship.warpCharge;
          this.addEventLog('Warp drive charged in ' + Math.round(timeRemaining) + ' seconds.');
          return;
        }

        if (this.player.Ship.fuel < 1)
        {
          this.addEventLog('No fuel.');
          return;
        }

        if (choice < this.currentNode.paths.length)
        {
          this.player.Ship.fuel -= 1;
          this.goToNode(this.currentNode.paths[choice]);
        }
      }
      // Choose an answer for an event
      else if (this.eventAwaitingInput)
      {
        if (choice < this.eventAwaitingInput.options.length)
        {
          // Show response text
          var chosenOption = this.eventAwaitingInput.options[choice];
          if (chosenOption.responseText)
            this.addEventLog(chosenOption.responseText);

          // Trigger an event, if any
          if (chosenOption.events)
          {
            var weights = chosenOption.events.map(function(ev) {return ev.probability;});
            var chosenIndex = this.randomWeighted(weights);
            var chosenEvent = chosenOption.events[chosenIndex];
            this.triggerEvent(chosenEvent.name);
          }

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
      if (this.player.Ship.warpCharge >= this.player.Ship.shipData.warpChargeTime && !this.warpReady)
      {
        this.addEventLog('...Warp drive charged. Press J to warp when ready.');
        this.warpReady = true;
      }
    }

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
  this.screenShake = 0;
  this.reloadTime = 0.5;
  this.reloadTimer = 0;
  this.range = 700;
  this.damage = 0.03;
  this.projectileSpeed = 900;
  this.projectileAccel = 0;
  this.projectileSize = 1;
  this.recoil = 2;
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
  this.screenShake = 0.5;
  this.reloadTime = 5;
  this.reloadTimer = 0;
  this.range = 1200;
  this.damage = 0.1;
  this.projectileSpeed = 800;
  this.projectileAccel = 0;
  this.projectileSize = 3;
  this.recoil = 7;
  this.x = 0;
  this.y = 0;
};

Guns.mediumRocket = function()
{
  this.image = new Image();
  this.image.src = 'res/img/small-rail.png';
  this.shootSound = 'medium-rail-01';
  this.shootEffect = 'gunFireMedium';
  this.trailEffect = 'mediumRailTrail';
  this.screenShake = 0.5;
  this.reloadTime = 3;
  this.reloadTimer = 0;
  this.range = 800;
  this.damage = 0.2;
  this.projectileLife = 7;
  this.projectileSpeed = 200;
  this.projectileAccel = 50;
  this.projectileSize = 3;
  this.recoil = 7;
  this.x = 0;
  this.y = 0;
};

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
    this.mainBuffer.context.drawImage(this.resource.diffuse, 0, 0);

    // Draw lighting
    var lightDir = [Math.cos(TANK.main.Game.lightDir), Math.sin(TANK.main.Game.lightDir)];
    for (var i = 0; i < this.resource.lightBuffers.length; ++i)
    {
      var lightDirOffset = (Math.PI * 2 / this.resource.lightBuffers.length) * i - Math.PI / 2;
      this.mainBuffer.context.globalAlpha = Math.max(0, -TANK.Math2D.dot(lightDir, [Math.cos(t.rotation + lightDirOffset), Math.sin(t.rotation + lightDirOffset)]));
      if (this.mainBuffer.context.globalAlpha > 0)
        this.mainBuffer.context.drawImage(this.resource.lightBuffers[i], 0, 0);
    }

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
TANK.registerComponent("Lights")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 4;
  this.width = 0;
  this.height = 0;
  this.lights = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  // Refresh lights function
  this.redrawLights = function()
  {
    for (var i = 0; i < this.lights.length; ++i)
    {
      var light = this.lights[i];
      for (var j in light.states[light.state])
        light[j] = light.states[light.state][j];

      // Draw light glows
      light.buffer = new PixelBuffer();
      light.buffer.createBuffer(light.radius * 2, light.radius * 2);

      // Draw light glows
      var grad = light.buffer.context.createRadialGradient(light.radius, light.radius, 1, light.radius, light.radius, light.radius);
      var colorA = light.colorA.join(",");
      var colorB = light.colorB.join(",");
      grad.addColorStop(0, "rgba(" + colorA + ", " + light.alpha + ")");
      grad.addColorStop(0.5, "rgba(" + colorB + ", " + (light.alpha / 3) + ")");
      grad.addColorStop(1, "rgba(" + colorB + ", 0.0)");
      light.buffer.context.fillStyle = grad;
      light.buffer.context.beginPath();
      light.buffer.context.arc(light.buffer.width / 2, light.buffer.height / 2, light.buffer.width / 2, Math.PI * 2, false);
      light.buffer.context.fill();
      light.buffer.context.closePath();
    }
  };

  this.update = function(dt)
  {
    for (var i = 0; i < this.lights.length; ++i)
    {
      var light = this.lights[i];
      if (light.blinkTime)
      {
        if (!light.blinkTimer)
          light.blinkTimer = 0;
        light.blinkTimer += dt;
        if (light.blinkTimer > light.blinkTime)
        {
          if (light.state === "on")
            light.state = "off";
          else if (light.state === "off")
            light.state = "on";
          light.blinkTimer = 0;
          this.redrawLights();
        }
      }
    }
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

    for (var i = 0; i < this.lights.length; ++i)
    {
      var light = this.lights[i];
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(-light.radius + 0.5, -light.radius + 0.5);
      ctx.drawImage(light.buffer.canvas, light.x, light.y);
      ctx.restore();
    }

    ctx.restore();
  };
});
var Locations = {};

Locations.start =
{
  text: 'Here you are, at the edge of civilized space. Your destination lies deep in the heart of the galaxy, where anarchy reigns.',
  events: [{probability: 1, name: 'derelict'}],
  bgColor: [0, 0, 20, 1],
  lightColor: [0.7, 0.7, 1],
  lightDir: Math.PI * 2 * 0.8,
  spawns:
  [
    {components: {Pos2D: {x: 0, y: 0}, Planet: {}}}
  ]
};

Locations.abandonedOutpost =
{
  text: 'A dingy trading outpost sits ahead, listing heavily to the side.',
  name: 'An old abandoned trading outpost',
  events: [{probability: 0.5, name: 'pirate'}, {probability: 0.5, name: 'derelict'}],
  bgColor: [0, 20, 0, 1],
  lightColor: [0.8, 1, 0.8],
  lightDir: Math.PI * 2 * 0.5,
  spawns: [{components: {Clouds: {cloudColor: [180, 255, 180]}}}]
};

Locations.deepSpace =
{
  text: 'There is nothing to see here, just empty space.',
  name: 'Deep space',
  bgColor: [0, 0, 0, 1],
  lightColor: [0.9, 0.9, 1],
  lightDir: Math.PI * 2 * 0.2,
  spawns: []
};

Locations.asteroidField =
{
  text: 'Here in the depths of an asteroid field, anything can happen. Watch your back.',
  name: 'Asteroid field',
  events: [{probability: 0.4, name: 'pirate'}, {probability: 0.6, name: 'derelict'}],
  bgColor: [30, 0, 0, 1],
  lightColor: [1, 0.7, 0.7],
  lightDir: Math.PI * 2 * 0.2,
  spawns: [
    {components: {Clouds: {cloudColor: [220, 180, 180]}}},
    {components: {AsteroidField: {numAsteroids: 50}}}
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

    // Pick a location for this node to represent
    var possibleLocations = Object.keys(Locations);
    possibleLocations.splice(possibleLocations.indexOf('start'), 1);
    var index = Math.floor(Math.random() * possibleLocations.length);
    node.locationName = possibleLocations[index];
    node.depth = currentDepth;

    // Use start location if at beginning
    if (currentDepth === 0)
      node.locationName = 'start';

    // Generate child nodes recursively
    node.paths = [];
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

var ParticleLibrary = {};

ParticleLibrary.slowMediumFire = function()
{
  var e = TANK.createEntity("ParticleEmitter");
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = "res/img/particle-fire-1.png";
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
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = "res/img/particle-fire-1.png";
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
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = "res/img/particle-fire-1.png";
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
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = "res/img/particle-spark-1.png";
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
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = "source-over";
  emitter.particleImage.src = "res/img/particle-smoke-1.png";
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
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 8;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = "source-over";
  emitter.particleImage.src = "res/img/particle-smoke-1.png";
  emitter.spawnOffsetMin = [-8, -8];
  emitter.spawnOffsetMax = [8, 8];
  emitter.spawnSpeedMin = 100;
  emitter.spawnSpeedMax = 150;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 2;
  emitter.spawnScaleMax = 5;
  emitter.spawnPerSecond = 15;
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
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = "res/img/particle-spark-1.png";
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
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 8;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = "source-over";
  emitter.particleImage.src = "res/img/particle-smoke-1.png";
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
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = "res/img/particle-spark-1.png";
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

ParticleLibrary.damageMedium = function(x, y, angle)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = "res/img/particle-fire-1.png";
  emitter.spawnOffsetMin = [-5, -5];
  emitter.spawnOffsetMax = [5, 5];
  emitter.spawnSpeedMin = 250;
  emitter.spawnSpeedMax = 350;
  emitter.spawnAngleMin = angle - 0.3;
  emitter.spawnAngleMax = angle + 0.3;
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
  TANK.main.addChild(e);
  return e;
};

ParticleLibrary.smallRailTrail = function()
{
  var e = TANK.createEntity(["ParticleEmitter"]);
  var emitter = e.ParticleEmitter;
  emitter.particleImage.src = "res/img/particle-spark-1.png";
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
  var e = TANK.createEntity(["ParticleEmitter"]);
  var emitter = e.ParticleEmitter;
  emitter.particleImage.src = "res/img/particle-spark-1.png";
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
TANK.registerComponent("Player")

.includes("Ship")

.construct(function()
{
  this.zdepth = 5;
  this.shakeTime = 0;

  this.headingPos = [0, 0];
  this.headingLeft = false;
  this.headingRight = false;
  this.speedUp = false;
  this.speedDown = false;
  this.fireButtons = [];
})

.initialize(function()
{
  var ship = this._entity.Ship;
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.clearSelection = function()
  {
    for (var i = 0; i < this.selectedShips.length; ++i)
      this.selectedShips[i].Ship.selected = false;
    this.selectedShips = [];
  };

  this.shakeCamera = function(duration)
  {
    this.shakeTime = duration;
  };

  this.mouseDownHandler = function(e)
  {
    this.mouseDown = true;

    // Handle tapping a fire button
    var mousePos = TANK.Math2D.subtract(TANK.main.Game.mousePosScreen, [window.innerWidth / 2, window.innerHeight / 2]);
    for (var i = 0; i < this.fireButtons.length; ++i)
    {
      var pos = TANK.Math2D.scale(this.fireButtons[i].pos, TANK.main.Game.scaleFactor);
      pos = TANK.Math2D.add(pos, this.headingPos);
      var dist = TANK.Math2D.pointDistancePoint(pos, mousePos);
      if (dist < this.fireButtons[i].radius * TANK.main.Game.scaleFactor)
      {
        this.fireButtonDown = true;
        this._entity.Weapons.fireGuns(this.fireButtons[i].side);
        return;
      }
    }
  };

  this.mouseUpHandler = function(e)
  {
    this.mouseDown = false;
    this.fireButtonDown = false;
  };

  this.mouseMoveHandler = function(e)
  {
    // Handle changing heading
    if (this.mouseDown && !this.fireButtonDown && !this.selecting && !this.pendingTarget)
    {
      var mousePos = TANK.Math2D.subtract(TANK.main.Game.mousePosScreen, [window.innerWidth / 2, window.innerHeight / 2]);

      var dist = TANK.Math2D.pointDistancePoint(this.headingPos, mousePos);
      if (dist < this.headingRadiusScaled)
      {
        // Ignore if we are too close to center
        if (dist > this.headingRadiusScaled * 0.1)
        {
          // Get heading
          var newHeading = Math.atan2(mousePos[1] - this.headingPos[1], mousePos[0] - this.headingPos[0]);
          ship.heading = newHeading;

          // Get speed
          ship.desiredSpeed = (dist / this.headingRadiusScaled) * ship.shipData.maxSpeed;
        }
        else
          ship.desiredSpeed = 0;
      }
    }
  };

  this.listenTo(this._entity, 'explode', function()
  {
    TANK.main.dispatchTimed(3, 'gamelose');
  });

  this.listenTo(this._entity, "collide", function(obj)
  {
    if (obj.Bullet && obj.Bullet.owner !== this._entity)
      this.shakeCamera(0.1);
  });

  this.listenTo(TANK.main, "camerashake", function(duration)
  {
    this.shakeCamera(duration);
  });

  this.listenTo(TANK.main, "mousedown", this.mouseDownHandler);
  this.listenTo(TANK.main, "mouseup", this.mouseUpHandler);
  this.listenTo(TANK.main, "mousemove", this.mouseMoveHandler);

  this.listenTo(TANK.main, "keydown", function(e)
  {
    if (e.keyCode === TANK.Key.W)
      this.speedUp = true;
    if (e.keyCode === TANK.Key.S)
      this.speedDown = true;
    if (e.keyCode === TANK.Key.A)
      this.headingLeft = true;
    if (e.keyCode === TANK.Key.D)
      this.headingRight = true;

    if (e.keyCode === TANK.Key.LEFT_ARROW)
      this._entity.Weapons.fireGuns("left");
    if (e.keyCode === TANK.Key.RIGHT_ARROW)
      this._entity.Weapons.fireGuns("right");
    if (e.keyCode === TANK.Key.UP_ARROW)
      this._entity.Weapons.fireGuns("front");
    if (e.keyCode === TANK.Key.DOWN_ARROW)
      this._entity.Weapons.fireGuns("back");
  });

  this.listenTo(TANK.main, "keyup", function(e)
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

  this.update = function(dt)
  {
    // Calculate HUD size
    this.headingRadius = 50;
    this.headingRadiusScaled = this.headingRadius * TANK.main.Game.scaleFactor;
    this.headingPos = [window.innerWidth / 2 - this.headingRadiusScaled - 30, window.innerHeight / 2 - this.headingRadiusScaled - 60];
    this.fireButtons =
    [
      {side: "left", pos: [0, -this.headingRadius * 0.75], radius: 6},
      {side: "right", pos: [0, this.headingRadius * 0.75], radius: 6},
      {side: "front", pos: [this.headingRadius * 0.75, 0], radius: 6},
      {side: "back", pos: [-this.headingRadius * 0.75, 0], radius: 6},
    ];

    // Heading controls
    if (this.headingLeft)
      ship.heading -= dt * 3;
    if (this.headingRight)
      ship.heading += dt * 3;

    // Speed controls
    if (this.speedUp)
      ship.desiredSpeed += dt * 80;
    if (this.speedDown)
      ship.desiredSpeed -= dt * 80;

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

  this.draw = function(ctx, camera)
  {
    // Draw player HUD
    ctx.save();
    ctx.scale(camera.z, camera.z);
    ctx.translate(this.headingPos[0], this.headingPos[1]);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);

    // Draw compass
    // Outer circle
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.headingRadius, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, this.headingRadius * 0.1, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();

    // Heading line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ship.heading) * this.headingRadius, Math.sin(ship.heading) * this.headingRadius);
    ctx.closePath();
    ctx.stroke();

    // Speed line
    ctx.strokeStyle = "rgba(100, 100, 250, 0.8)";
    ctx.lineWidth = 1.5;
    var speedPercent = ship.desiredSpeed / ship.shipData.maxSpeed;
    var startPos = [Math.cos(ship.heading), Math.sin(ship.heading)];
    ctx.beginPath();
    ctx.moveTo(startPos[0], startPos[1]);
    ctx.lineTo(startPos[0] + Math.cos(ship.heading) * (this.headingRadius) * speedPercent,
               startPos[1] + Math.sin(ship.heading) * (this.headingRadius) * speedPercent);
    ctx.closePath();
    ctx.stroke();

    var that = this;
    function drawGun(gun)
    {
      ctx.beginPath();
      ctx.moveTo(gun.pos[0], gun.pos[1]);
      ctx.arc(gun.pos[0], gun.pos[1], gun.radius, that._entity.Weapons.reloadPercent(gun.side) * Math.PI * -2, false);
      ctx.lineTo(gun.pos[0], gun.pos[1]);
      ctx.closePath();
      ctx.fill();
    }

    // Draw weapon buttons
    ctx.fillStyle = "rgba(255, 80, 80, 0.5)";
    for (var i = 0; i < this.fireButtons.length; ++i)
    {
      drawGun(this.fireButtons[i]);
    }

    ctx.restore();
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
TANK.registerComponent('Ship')

.includes(['Pos2D', 'Velocity', 'LightingAndDamage', 'Lights', 'Engines', 'PixelCollider', 'Weapons', 'SoundEmitter'])

.construct(function()
{
  this.zdepth = 2;

  this.thrustOn = false;
  this.thrustAlpha = 0;
  this.heading = 0;
  this.desiredSpeed = 0;
  this.warpCharge = 0;
  this.fuel = 0;
  this.shieldTimer = 5;
  this.shieldRecharging = false;

  this.dead = false;

  this.iff = 0;
  this.shipData = null;
  this.deadTimer = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  // Get some data from ship
  this.resource = TANK.main.Resources.get(this.shipData.resource);
  this.health = this.shipData.health;
  this.shield = this.shipData.shield;
  this.fuel = this.shipData.maxFuel;
  this.width = this.resource.diffuse.width;
  this.height = this.resource.diffuse.height;

  // Set up collision
  this._entity.PixelCollider.collisionLayer = 'ships';
  this._entity.PixelCollider.collidesWith = ['bullets'];
  this._entity.PixelCollider.setImage(this.resource.diffuse);

  // Set up lighting
  this._entity.LightingAndDamage.setResource(this.resource);

  // Create texture buffers
  this.mainBuffer = new PixelBuffer();
  this.damageBuffer = new PixelBuffer();
  this.decalBuffer = new PixelBuffer();

  // Set sizes for things
  this._entity.Lights.lights = this.shipData.lights;
  this._entity.Lights.width = this.width;
  this._entity.Lights.height = this.height;
  this._entity.Lights.redrawLights();
  this._entity.Weapons.width = this.width;
  this._entity.Weapons.height = this.height;
  this._entity.Engines.size = this.shipData.engineSize;

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

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch('camerashake', 0.5);
  };

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
      if (this.shield <= 0)
        this.addDamage(pixelPos[0], pixelPos[1], bullet.damage * (30 + Math.random() * 30));
      this._entity.dispatch('damaged', bullet.damage, [obj.Velocity.x, obj.Velocity.y], objPos, bullet.owner);
      obj.Life.life = 0;

      // Spawn effect
      ParticleLibrary.damageMedium(objPos[0], objPos[1], obj.Pos2D.rotation + Math.PI);

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
    v.x += dir[0] * 0.02;
    v.y += dir[1] * 0.02;
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, [t.x + dir[0], t.y + dir[1]]);
    v.r += dir * 0.5;

    // Do damage
    if (this.shield > 0)
    {
      this.shield -= damage;
      if (this.shield <= 0)
      {
        this.shieldTimer = 5;
        this.shieldRecharging = false;
      }
    }
    else
      this.health -= damage;
  });

  //
  // Handle thrust on / off states
  //
  this.listenTo(this._entity, 'thrustOn', function()
  {
    for (var i = 0; i < this.shipData.lights.length; ++i)
      if (this.shipData.lights[i].isEngine)
        this.shipData.lights[i].state = 'on';
    this._entity.Lights.redrawLights();
  });

  this.listenTo(this._entity, 'thrustOff', function()
  {
    for (var i = 0; i < this.shipData.lights.length; ++i)
      if (this.shipData.lights[i].isEngine)
        this.shipData.lights[i].state = 'off';
    this._entity.Lights.redrawLights();
  });

  //
  // Update loop
  //
  this.update = function(dt)
  {
    // Recharge shield
    if (this.shield <= 0 && this.shieldTimer > 0)
    {
      this.shieldTimer -= dt;
      this.shield = 0;
      if (this.shieldTimer <= 0)
        this.shieldRecharging = true;
    }
    if (this.shieldRecharging)
      this.shield += dt * this.shipData.shieldGen;
    this.shield = Math.min(this.shipData.shield, this.shield);

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
    var e = TANK.createEntity('Ship');
    e.Pos2D.x = x;
    e.Pos2D.y = 0;
    e.Ship.shipData = new Ships[i]();
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
  this.warpChargeTime = 10;
  this.maxFuel = 5;
  this.optimalAngle = 0;
  this.engineSize = [18, 8];
  this.guns =
  {
    front:
    [
      {
        type: 'smallRail',
        x: 28,
        y: 21
      }
    ]
  },
  this.lights =
  [
    {
      x: 11, y: 7, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 9, y: 25, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 14, y: 35, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 23, y: 26, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: 'off', blinkTime: 1.5,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
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
  this.warpChargeTime = 15;
  this.maxFuel = 7;
  this.optimalAngle = 0;
  this.engineSize = [24, 12];
  this.guns =
  {
    front:
    [
      {
        type: 'mediumRocket',
        x: 60,
        y: 60
      }
    ]
  },
  this.lights =
  [
    {
      x: 29, y: 36, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 25, y: 45, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 23, y: 75, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 80, y: 29, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: 'off', blinkTime: 1.5,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
  ];
};

Ships.frigate = function()
{
  this.name = 'Frigate';
  this.resource = 'frigate';
  this.explodeSound = 'explode-01';
  this.maxTurnSpeed = 0.35;
  this.maxSpeed = 150;
  this.accel = 15;
  this.turnAccel = 1.2;
  this.health = 1;
  this.shield = 0.5;
  this.shieldGen = 0.01;
  this.warpChargeTime = 30;
  this.maxFuel = 10;
  this.optimalAngle = Math.PI / 2;
  this.engineSize = [24, 16];
  this.guns =
  {
    left:
    [
      {
        type: 'mediumRail',
        x: 85,
        y: 39
      },
      {
        type: 'mediumRail',
        x: 35,
        y: 39
      }
    ],
    front:
    [
      {
        type: 'mediumRail',
        x: 106,
        y: 69
      }
    ],
    right:
    [
      {
        type: 'mediumRail',
        x: 16,
        y: 85
      },
      {
        type: 'mediumRail',
        x: 44,
        y: 85
      }
    ],
    back:
    [
      {
        type: 'mediumRail',
        x: 36,
        y: 69
      }
    ]
  },
  this.lights =
  [
    {
      x: 14, y: 39, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 2, y: 84, colorA: [210, 210, 255], colorB: [150, 150, 255], state: 'off', isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 54, y: 84, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: 'off', blinkTime: 1.5,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
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

Spawns.pirate = function()
{
  var e = TANK.createEntity('AIAttackPlayer');
  e.Ship.shipData = new Ships.frigate();
  e.Pos2D.x = -2000 + Math.random() * 4000;
  e.Pos2D.y = -2000 + Math.random() * 4000;
  TANK.main.addChild(e);
};

Spawns.derelict = function()
{
  var e = TANK.createEntity(['Ship', 'Derelict']);
  e.Ship.shipData = new Ships.frigate();
  e.Pos2D.x = 4000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);

  e = TANK.createEntity('TriggerRadius');
  e.TriggerRadius.radius = 1000;
  e.TriggerRadius.events = [{probability: 1, name: 'derelict_1b'}];
  e.Pos2D.x = 4000;
  e.Pos2D.y = 0;
  TANK.main.addChild(e);
};
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
        this._entity._parent.removeChild(this._entity);
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
TANK.registerComponent("Weapons")

.includes("Pos2D")

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
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.addGun = function(gunObj, gunSide)
  {
    var angle;
    if (gunSide === "front")
      angle = 0;
    else if (gunSide === "back")
      angle = Math.PI;
    else if (gunSide === "left")
      angle = Math.PI / -2;
    else if (gunSide === "right")
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
    if (gun.reloadTimer > 0)
      return;
    gun.reloadTimer = gun.reloadTime;

    var pos = gun.worldPos;

    // Fire bullet
    var e = TANK.createEntity("Bullet");
    e.Pos2D.x = pos[0];
    e.Pos2D.y = pos[1];
    e.Pos2D.rotation = t.rotation + gun.angle;
    e.Velocity.x = Math.cos(t.rotation + gun.angle) * gun.projectileSpeed;
    e.Velocity.y = Math.sin(t.rotation + gun.angle) * gun.projectileSpeed;
    e.Life.life = gun.projectileLife || gun.range / gun.projectileSpeed;
    e.Bullet.owner = this._entity;
    e.Bullet.damage = gun.damage;
    e.Bullet.trailEffect = gun.trailEffect;
    e.Bullet.size = gun.projectileSize;
    e.Bullet.accel = gun.projectileAccel;
    TANK.main.addChild(e);

    // Create effect
    ParticleLibrary[gun.shootEffect](pos[0], pos[1], t.rotation + gun.angle);

    // Play sound
    this._entity.SoundEmitter.play(gun.shootSound);

    // Recoil
    this._entity.Velocity.x -= Math.cos(t.rotation + gun.angle) * gun.recoil;
    this._entity.Velocity.y -= Math.sin(t.rotation + gun.angle) * gun.recoil;
    this._entity.Velocity.r += -gun.recoil * 0.05 + Math.random() * gun.recoil * 0.1;

    // Shake screen
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < 1) dist = 1;
    if (dist < window.innerWidth / 2 && gun.screenShake > 0)
      TANK.main.dispatch("camerashake", gun.screenShake / (dist * 5));
  };

  this.fireGuns = function(gunSide)
  {
    var guns = this.guns[gunSide];
    for (var i = 0; i < guns.length; ++i)
      this.fireGun(i, gunSide);
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
          ctx.fillStyle = "#fff";
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