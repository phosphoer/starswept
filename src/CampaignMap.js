TANK.registerComponent("CampaignMap")

.construct(function()
{
  this.zdepth = 0;
  this.barCommands = [];
  this.currentPlayer = null;
  this.currentTurn = 0;
  this.turnsTaken = -1;
})

.initialize(function()
{
  var that = this;
  this.systems = TANK.main.MapGeneration.systems;
  TANK.main.Renderer2D.add(this);

  // Build bottom command bar ractive
  this.barCommands = [];
  this.barUI = new Ractive(
  {
    el: 'barContainer',
    template: '#barTemplate',
    data: {commands: this.barCommands}
  });

  this.barCommands.push(
  {
    name: 'Fortify System',
    active: false,
    activate: function()
    {
      that.mode = 'fortify';
    }
  });
  this.barCommands.push(
  {
    name: 'Attack System',
    active: false,
    activate: function()
    {
      that.mode = 'attack';
    }
  });
  this.barCommands.push(
  {
    name: 'Move Flagship',
    active: false,
    activate: function()
    {
      that.mode = 'move';
    }
  });
  this.barUI.on('activate', function(e)
  {
    that.barCommands.forEach(function(cmd)
    {
      cmd.active = false;
    });
    e.context.active = true;
    e.context.activate();
    that.barUI.update();
  });

  //
  // Go to next turn
  //
  this.nextTurn = function()
  {
    ++this.turnsTaken;
    this.currentTurn = this.turnsTaken % TANK.main.Game.players.length;
    this.currentPlayer = TANK.main.Game.players[this.currentTurn];
    if (!this.currentPlayer.player)
    {
      this.startAITurn();
    }
  };

  //
  // Turn taking methods
  //
  this.startAttack = function(system)
  {
    // Check that the system isn't owned by the attacker
    if (system.owner === this.currentPlayer)
    {
      return;
    }

    // Check that the system has an adjacent system owned by attacker
    var hasAdjacentOwned = false;
    for (var j = 0; j < system.edges.length; ++j)
      if (system.edges[j].owner === this.currentPlayer)
        hasAdjacentOwned = true;

    if (hasAdjacentOwned)
    {
      system.isBeingAttacked = true;
      TANK.main.dispatchTimed(2, 'completeTurn', 'attack', system);
    }
  };

  this.startFortify = function(system)
  {
    // Check that system is owned by turn taker
    if (system.owner !== this.currentPlayer)
    {
      return;
    }

    system.isBeingFortified = true;
    TANK.main.dispatchTimed(2, 'completeTurn', 'fortify', system);
  };

  this.startMove = function(system)
  {
    // Check that an adjacent system has a flagship
    var flagshipSystem;
    var flagshipIndex;
    for (var i = 0; i < system.edges.length; ++i)
    {
      if (system.edges[i].flagships[this.currentTurn])
      {
        flagshipSystem = system.edges[i];
        break;
      }
    }

    if (flagshipSystem)
    {
      flagshipSystem.flagships[this.currentTurn] = false;
      system.flagships[this.currentTurn] = true;
    }

    TANK.main.dispatchTimed(2, 'completeTurn', 'move', system);
  };

  //
  // AI Turn Logic
  //
  this.startAITurn = function()
  {
    console.log('AI Turn...');

    var modes = ['attack', 'fortify', 'move'];
    var choice = Math.floor(Math.random() * 3);
    var mode = modes[choice];

    TANK.main.dispatchTimed(2, 'takeAITurn', mode);
  };

  this.aiTurnAttack = function()
  {
    console.log('AI attacked');

    // Find a player owned node with an adjacent enemy node
    var attackSystem = null;
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      if (system.owner !== this.currentPlayer)
        continue;

      system.edges.forEach(function(s)
      {
        if (s.owner !== that.currentPlayer)
          attackSystem = s;
      });

      if (attackSystem)
        break;
    }

    if (attackSystem)
    {
      this.startAttack(attackSystem);
    }
    else
    {
      console.log('Couldn\'t find a system to attack');
    }
  };

  this.aiTurnFortify = function()
  {
    // Find AI owned systems
    var aiOwnedSystems = [];
    for (var i = 0; i < this.systems.length; ++i)
      if (this.systems[i].owner === this.currentPlayer)
        aiOwnedSystems.push(this.systems[i]);

    // No systems to fortify
    if (!aiOwnedSystems.length)
    {
      console.log('Couldn\'t find a system to fortify');
      return;
    }

    // Pick a random system and fortify it
    var system = aiOwnedSystems[Math.floor(Math.random() * aiOwnedSystems.length)];
    this.startFortify(system);
  };

  this.aiTurnMove = function()
  {
    var system = this.systems[Math.floor(Math.random() * this.systems.length)];
    this.startMove(system);
  };

  this.listenTo(TANK.main, 'takeAITurn', function(mode)
  {
    if (mode === 'attack')
      this.aiTurnAttack();
    else if (mode === 'fortify')
      this.aiTurnFortify();
    else if (mode === 'move')
      this.aiTurnMove();
  });

  this.listenTo(TANK.main, 'completeTurn', function(mode, system)
  {
    TANK.main.Renderer2D.camera.z = 1;
    TANK.main.Renderer2D.camera.x = 0;
    TANK.main.Renderer2D.camera.y = 0;

    this.barCommands.forEach(function(cmd)
    {
      cmd.active = false;
    });
    this.barUI.update();
    this.mode = '';

    if (mode === 'attack')
    {
      TANK.main.Game.goToSystemBattle(system, system.owner, this.currentPlayer);
      system.isBeingAttacked = false;
    }
    else if (mode === 'fortify')
    {
      ++system.fortifyLevel;
      system.isBeingFortified = false;
      this.nextTurn();
    }
    else if (mode === 'move')
    {
      this.nextTurn();
    }
  });

  //
  // Handle clicking on a system
  //
  this.listenTo(TANK.main, 'mousedown', function(e)
  {
    if (!this.currentPlayer.player)
      return;

    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      var dist = TANK.Math2D.pointDistancePoint(system.pos, TANK.main.Game.mousePosWorld);
      if (dist < system.radius)
      {
        if (this.mode === 'attack')
          this.startAttack(system);
        else if (this.mode === 'fortify')
          this.startFortify(system);
        else if (this.mode === 'move')
          this.startMove(system);
      }
    }
  });

  //
  // Render
  //
  this.draw = function(ctx, camera, dt)
  {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw edges
    var drawnEdges = [];
    ctx.lineWidth = 3;
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      var owner = system.owner;
      for (var j = 0; j < system.edges.length; ++j)
      {
        var systemB = system.edges[j];
        if (drawnEdges.indexOf(systemB) >= 0)
          continue;

        ctx.strokeStyle = owner.color;

        ctx.beginPath();
        ctx.moveTo(system.pos[0], system.pos[1]);
        ctx.lineTo(systemB.pos[0], systemB.pos[1]);
        ctx.stroke();
        ctx.closePath();
      }
      drawnEdges.push(system);
    }

    // Draw systems
    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      var owner = system.owner;

      // Draw attack state
      if (system.isBeingAttacked)
      {
        ctx.fillStyle = '#b22';
        ctx.beginPath();
        ctx.arc(system.pos[0], system.pos[1], system.radius * 2, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
        camera.z *= 0.99;
        camera.x = camera.x + (system.pos[0] - camera.x) * dt;
        camera.y = camera.y + (system.pos[1] - camera.y) * dt;
      }

      // Draw fortify state
      if (system.isBeingFortified)
      {
        ctx.fillStyle = '#55f';
        ctx.beginPath();
        ctx.arc(system.pos[0], system.pos[1], system.radius * 2, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
      }

      // Draw system
      ctx.fillStyle = owner.color;
      ctx.beginPath();
      ctx.arc(system.pos[0], system.pos[1], system.radius, Math.PI * 2, false);
      ctx.fill();
      ctx.closePath();

      // Draw fortify level
      ctx.fillStyle = '#fff';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(system.fortifyLevel, system.pos[0], system.pos[1]);

      // Draw flagship
      for (var j = 0; j < TANK.main.Game.players.length; ++j)
      {
        var player = TANK.main.Game.players[j];
        var flagship = system.flagships[j];
        if (flagship)
        {
          ctx.fillStyle = player.color;
          ctx.fillRect(system.pos[0] + (system.radius + 10) * (j + 1), system.pos[1] - system.radius, 20, 20);
        }
      }
    }

    ctx.restore();
  };

  //
  // Go to next turn
  //
  this.nextTurn();
})

.uninitialize(function()
{
});
