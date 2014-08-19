TANK.registerComponent("CampaignMap")

.construct(function()
{
  this.zdepth = 0;
  this.size = 400;
  this.minDist = 100;
  this.systems = [];
  this.islands = [];
  this.barCommands = [];
  this.isPlayerTurn = true;
})

.initialize(function()
{
  var that = this;
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
  // Map generation logic
  //
  this.generateMap = function()
  {
    this.systems = [];

    // Generate systems
    for (var i = 0; i < 10; ++i)
    {
      this.systems.push(
      {
        index: i,
        level: Levels[0],
        pos:
        [
          -this.size + Math.random() * this.size * 2,
          -this.size + Math.random() * this.size * 2
        ],
        radius: 20,
        edges: [],
        owned: false,
        fortifyLevel: 0
      });

      // Ensure systems are far apart
      var system = this.systems[i];
      var angle = Math.random() * Math.PI * 2;
      for (;;)
      {
        var minDist = this.systems.reduce(function(prev, cur)
        {
          if (cur === system)
            return prev;
          return Math.min(prev, TANK.Math2D.pointDistancePoint(system.pos, cur.pos));
        }, Infinity);

        if (minDist > this.minDist)
          break;

        system.pos[0] += Math.cos(angle) * 10;
        system.pos[1] += Math.sin(angle) * 10;
      }
    }

    // Make edges
    this.systems.forEach(function(system)
    {
      // Get systems in distance order
      var systemsOrdered = this.systems.slice();
      systemsOrdered.sort(function(a, b)
      {
        var distA = TANK.Math2D.pointDistancePoint(system.pos, a.pos);
        var distB = TANK.Math2D.pointDistancePoint(system.pos, b.pos);
        return distA > distB;
      });
      systemsOrdered.splice(0, 1);

      // Connect to closest system
      var closest = systemsOrdered[0];
      system.edges.push(closest);
      closest.edges.push(system);
      systemsOrdered.splice(0, 1);

      // Find the next closest system that is not inline with the previous
      var closestVec = TANK.Math2D.normalize(TANK.Math2D.subtract(closest.pos, system.pos));
      var nextClosest = null;
      for (var i = 0; i < systemsOrdered.length; ++i)
      {
        var s= systemsOrdered[i];
        var systemVec = TANK.Math2D.normalize(TANK.Math2D.subtract(s.pos, system.pos));
        var dot = TANK.Math2D.dot(closestVec, systemVec);
        if (Math.abs(1 - dot) > 0.1)
        {
          nextClosest = s;
          break;
        }
      };

      if (nextClosest)
      {
        system.edges.push(nextClosest);
        nextClosest.edges.push(system);
      }

    }.bind(this));

    // Make the first node owned
    this.systems[0].owned = true;

    // Helper to recursively explore a graph
    var exploreNode = function(node, islandNodes)
    {
      if (node.visited)
        return false;

      // Visit the node
      node.visited = true;
      islandNodes.push(node);

      // Explore each adjacent node
      for (var i = 0; i < node.edges.length; ++i)
        exploreNode(node.edges[i], islandNodes);

      return true;
    };

    // Helper to connect two islands
    var connectIslands = function(a, b)
    {
      // Find the two closest nodes between the islands
      var minDist = Infinity;
      var nodeA = null;
      var nodeB = null;

      for (var i = 0; i < a.length; ++i)
      {
        for (var j = 0; j < b.length; ++j)
        {
          var dist = TANK.Math2D.pointDistancePoint(a[i].pos, b[j].pos);
          if (dist < minDist)
          {
            minDist = dist;
            nodeA = a[i];
            nodeB = b[j];
          }
        }
      }

      nodeA.edges.push(nodeB);
      nodeB.edges.push(nodeA);
    };

    // Explore every node to find islands
    this.islands = [];
    for (var i = 0; i < this.systems.length; ++i)
    {
      var node = this.systems[i];
      var island = [];
      if (exploreNode(node, island))
        this.islands.push(island);
    }

    // Connect each island to the next
    for (var i = 1; i < this.islands.length; ++i)
    {
      var islandA = this.islands[i - 1];
      var islandB = this.islands[i];
      connectIslands(islandA, islandB);
    }
  };

  //
  // Save the current game
  //
  this.save = function(slot)
  {
    var save = {};
    save.systems = [];
    save.isPlayerTurn = this.isPlayerTurn;

    for (var i = 0; i < this.systems.length; ++i)
    {
      var system = this.systems[i];
      var systemSave = {};
      systemSave.index = system.index;
      systemSave.pos = system.pos;
      systemSave.radius = system.radius;
      systemSave.owned = system.owned;
      systemSave.fortifyLevel = system.fortifyLevel
      systemSave.edges = [];
      system.edges.forEach(function(s)
      {
        systemSave.edges.push(s.index);
      });
      save.systems.push(systemSave);
    }

    localStorage['save-' + slot] = JSON.stringify(save);
  };

  //
  // Load the current game
  //
  this.load = function(slot)
  {
    var save = JSON.parse(localStorage['save-' + slot]);
    this.isPlayerTurn = save.isPlayerTurn;

    this.systems = [];
    for (var i = 0; i < save.systems.length; ++i)
    {
      var systemSave = save.systems[i];
      var system = {};
      system.index = systemSave.index;
      system.pos = systemSave.pos;
      system.radius = systemSave.radius;
      system.owned = systemSave.owned;
      system.fortifyLevel = systmsa.fortifyLevel;
      system.level = Levels[0];
      system.edges = [];
      this.systems.push(system);
    }

    for (var i = 0; i < this.systems.length; ++i)
    {
      var systemSave = save.systems[i];
      var system = this.systems[i];
      systemSave.edges.forEach(function(systemIndex)
      {
        system.edges.push(that.systems[systemIndex]);
      });
    }
  };

  //
  // Turn taking methods
  //
  this.startAttack = function(system)
  {
    // Check that the system isn't owned by the attacker
    if (system.owned === this.isPlayerTurn)
    {
      return;
    }

    // Check that the system has an adjacent system owned by attacker
    var hasAdjacentOwned = false;
    for (var j = 0; j < system.edges.length; ++j)
      if (system.edges[j].owned === this.isPlayerTurn)
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
    if (system.owned !== this.isPlayerTurn)
    {
      return;
    }

    system.isBeingFortified = true;
    TANK.main.dispatchTimed(2, 'completeTurn', 'fortify', system);
  };

  this.startMove = function(system)
  {
    console.log('moved to ', system);
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
      if (system.owned)
        continue;

      system.edges.forEach(function(s)
      {
        if (s.owned)
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
      if (!this.systems[i].owned)
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

    this.isPlayerTurn = !this.isPlayerTurn;

    if (mode === 'attack')
    {
      TANK.main.Game.goToSystemBattle(system);
      system.isBeingAttacked = false;
    }
    else if (mode === 'fortify')
    {
      ++system.fortifyLevel;
      system.isBeingFortified = false;
      if (!this.isPlayerTurn)
        this.startAITurn();
    }
    else if (mode === 'move')
    {
      if (!this.isPlayerTurn)
        this.startAITurn();
    }
  });

  //
  // Handle clicking on a system
  //
  this.listenTo(TANK.main, 'mousedown', function(e)
  {
    if (!this.isPlayerTurn)
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
      for (var j = 0; j < system.edges.length; ++j)
      {
        var systemB = system.edges[j];
        if (drawnEdges.indexOf(systemB) >= 0)
          continue;

        if (systemB.owned || system.owned)
          ctx.strokeStyle = '#7c7';
        else
          ctx.strokeStyle = '#c77';

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
      ctx.fillStyle = system.owned ? '#3c3' : '#f55';
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
    }

    ctx.restore();
  };

  //
  // Generate the map or load it
  //
  if (!this.inGame)
    this.generateMap();
  else
    this.load('temp');

  //
  // Run AI turn if his turn
  //
  if (!this.isPlayerTurn)
  {
    this.startAITurn();
  }

  this.inGame = true;
})

.uninitialize(function()
{
  // Always save a temp game before closing the campaign map
  this.save('temp');
});
