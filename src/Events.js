var Events = {};

//
// Null event
//
Events.empty =
{
  script: function()
  {
    TANK.main.Game.addEventLog('You appear to be alone.');
  }
};

//
// Begin event
//
Events.start =
{
  script: function()
  {
    TANK.main.Game.addStory('You began your journey.');
  }
};

//
// Civilian ship event
//
Events.civilian =
{
  script: function()
  {
    TANK.main.Game.addEventLog('Your scanners pick up the signature of a small ship nearby.');
    Spawns.civilian();
  }
};

//
// Pirate event
//
Events.pirate =
{
  script: function()
  {
    TANK.main.Game.addEventLog('Alarms begin sounding as soon as the warp is complete, you are under attack!');
    Spawns.pirate();
    Spawns.warpJammer();
  }
};

//
// Police ship event
//
Events.police =
{
  script: function()
  {
    Spawns.police();
    Spawns.warpJammer();
  }
};

//
// Unlock Enforcer event
//
Events.returnStolenEnforcer =
{
  script: function()
  {
    TANK.main.Game.addEventLog('A police ship hails you and requests that you approach within comms distance.');

    var spawn =
    {
      components:
      {
        Pos2D: {x: 2000, y: 0},
        Ship: {shipType: 'enforcer'},
        RemoveOnLevelChange: {},
        TriggerRadius: {radius: 500, events: [{probability: 1, name: 'returnStolenEnforcer_start'}]}
      }
    };

    Spawns.custom(spawn);
  }
};

Events.returnStolenEnforcer_start =
{
  script: function()
  {
    TANK.main.Game.addEventLog('"Greetings pilot, I\'m in a bit of trouble here. I was out on patrol with my buddy when we were ambushed by pirates! They disabled my ship and captured his. If I don\'t get that ship back I\'ll be in big trouble. They were heading towards a red dwarf star when I last saw them."');

    Flags['returnStolenEnforcer'] = true;

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
  requireFlags: ['returnStolenEnforcer'],
  script: function()
  {
    TANK.main.Game.addEventLog('Just ahead you see the stolen police cruiser. Looks like they aren\'t prepared to chat.');

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
  script: function()
  {
    TANK.main.Game.addEventLog('The research station up ahead seems to actually be inhabited by someone.');

    var entities = TANK.main.getChildrenWithComponent('LevelProp');
    var station;
    for (var i in entities)
      if (entities[i].LevelProp.resourceName === 'station-01')
        station = entities[i];

    var e = TANK.createEntity('TriggerRadius');
    e.TriggerRadius.radius = 500;
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
    var options = [];
    options.push(
    {
      text: 'Sure thing, come on in!',
      script: function()
      {
        TANK.main.Game.addEventLog('"Thanks partner!"');
        Flags['investigatePrototypeShip'] = true;
      }
    });

    options.push(
    {
      text: 'Sorry, no room for scientists aboard.',
      script: function()
      {
        TANK.main.Game.addEventLog('"Dang."');
      }
    });

    TANK.main.Game.addEventLog('As you approach the research station you are contacted by someone inside.');
    TANK.main.Game.triggerPlayerChoice('"Hi there! I don\'t suppose you\'d be interested in giving me a lift? I\'m a space scientist you see, and there is some important science to be done at the old battlefield near here."', options);
  }
};

Events.investigatePrototypeShipEncounter =
{
  requireFlags: ['investigatePrototypeShip'],
  script: function()
  {
    TANK.main.Game.addEventLog('"Ah ha! See that ship up ahead? That\'s what I\'m looking for. Can you get me a bit closer?"');

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
  script: function()
  {
    var options = [];
    options.push(
    {
      text: 'Try to clear the bots by shooting at them.',
      script: function()
      {
        TANK.main.Game.triggerEvent('investigatePrototypeShip_explode');
      }
    });

    options.push(
    {
      text: 'Try scraping the bots off with the hull of your ship.',
      script: function()
      {
        TANK.main.Game.triggerEvent('investigatePrototypeShip_successA');
      }
    });

    TANK.main.Game.addEventLog('The scientist throws on a space suit and hops out to investigate the prototype ship.');
    TANK.main.Game.triggerPlayerChoice('"Oh jeeze! This ship is crawling with rogue bomb bots! There\'s no way I can get inside with these guys around..."', options);
  }
};

Events.investigatePrototypeShip_explode =
{
  script: function()
  {
    TANK.main.Game.addEventLog('Despite your best efforts to single out bots not near others, a chain reaction begins and the flames engulf both your ship and the mysterious prototype ship. Your ship survives with serious damage, but the prototype ship is lost.');
    TANK.main.Game.player.Ship.health /= 2;
    for (var i = 0; i < 10; ++i)
      TANK.main.Game.player.Ship.addRandomDamage(3 + Math.random() * 6);
    var e = TANK.main.getChild('PrototypeShip');
    e.Ship.health = -1;
  }
};

Events.investigatePrototypeShip_successA =
{
  script: function()
  {
    TANK.main.Game.addEventLog('A couple bots explode as they are nudged into open space, causing minor damage to your hull, but on the whole your plan works out ok.');
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
  script: function()
  {
    TANK.main.Game.addEventLog('Your scanners pick up the signature of a mid sized ship, but the signal is much fainter than you would expect. The signal originates from a short distance ahead.');
    Spawns.derelict();
  }
};

Events.derelict_1a =
{
  script: function()
  {
    TANK.main.Game.addEventLog('As you approach, a quick bio scan reveals no lifeforms. Looks like you arrived a bit too late. Or right on time, depending on your outlook.');
    TANK.main.Game.addStory('You came across a disabled ship with no crew left alive at {{location}}');
  }
};

Events.derelict_1b =
{
  script: function()
  {
    var options = [];
    options.push(
    {
      text: 'Decline, you need all the fuel you\'ve got.',
      script: function()
      {
        TANK.main.Game.addEventLog('The tension in the air as you deliver the bad news is palpable. The comms connection disconnects.');
        TANK.main.Game.addStory('You came across a disabled ship at {{location}} but refused to help them out.');
      }
    });

    options.push(
    {
      text: 'Agree to give them some fuel. Your shields must shut off completely to make the transfer.',
      script: function()
      {
        var name = TANK.main.Game.pickRandomNamedOption(
        [
          {probability: 0.5, name: 'derelict_2a'},
          {probability: 0.5, name: 'derelict_2b'}
        ]);
        TANK.main.Game.triggerEvent(name);
      }
    });

    TANK.main.Game.triggerPlayerChoice('Upon approaching, you are contacted by the ship. The captain informs you that they have been stranded for days, and pleads with you to give them 3 fuel cells so they can return home.', options);
  }
};

Events.derelict_2a =
{
  script: function()
  {
    TANK.main.Game.addEventLog('The captain thanks you profusely and speeds off.');
    TANK.main.Game.addStory('You came across a disabled ship at {{location}} and helped them out with some fuel.');
    TANK.main.Game.takePlayerFuel(3);
    TANK.main.dispatch('derelictleave');
    Flags['rescuedDerelict'] = true;
  }
};

Events.derelict_2b =
{
  script: function()
  {
    Spawns.pirate();
    Spawns.pirate();
    Spawns.warpJammer();
    TANK.main.Game.addEventLog('As soon as you disable your shields, several hostile ship signatures show up on the scanner. Looks like you are about to regret your helpful nature.');
    TANK.main.Game.addStory('You came across a disabled ship at {{location}} and were ambushed by pirates.');
    TANK.main.Game.killPlayerShields();
  }
};

Events.derelictReturn =
{
  requireFlags: ['rescuedDerelict'],
  script: function()
  {
    TANK.main.Game.addEventLog('Just ahead you see the same ship that you rescued earlier. The captain says they have since filled up and would be happy to transfer you some fuel as thanks if you approach closer.');

    Flags['rescuedDerelict'] = false;

    var spawn =
    {
      components:
      {
        Pos2D: {x: 1000, y: 0},
        Ship: {shipType: 'frigate'},
        AIDerelict: {},
        TriggerRadius: {radius: 500, events: [{probability: 1, name: 'derelictGiveFuel'}]}
      }
    };

    Spawns.custom(spawn);
  }
};

Events.derelictGiveFuel =
{
  script: function()
  {
    TANK.main.Game.addStory('You ran into the ship you previously rescued and they gave you some fuel.');
    TANK.main.dispatch('derelictleave');

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
// Shop events
//
Events.shopA =
{
  perks:
  [
    {probability: 1, name: 'gunReloadTime'}
  ],
  script: function()
  {
    TANK.main.Game.addEventLog('A cargo ship here has been modified into a somewhat mobile shop. A grizzled voice hails you over the comms and invites you to check out the selection.');

    var e = TANK.createEntity(['AIShop', 'Ship']);
    e.AIShop.availableItems = this.perks;
    e.Pos2D.x = -2000 + Math.random() * 2000;
    e.Pos2D.y = -2000 + Math.random() * 2000;
    e.Pos2D.rotation = Math.random() * Math.PI * 2;
    e.Ship.shipType = 'rhino';
    TANK.main.addChild(e);
  }
};

//
// Test event
//
Events.test =
{
  script: function()
  {
    TANK.main.Game.addEventLog('A test event');
  }
};