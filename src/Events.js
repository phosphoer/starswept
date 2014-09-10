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
  text: 'Upon approaching, you are contacted by the ship. The captain informs you that they have been stranded for days, and pleads with you to give them 3 fuels so they can return home.',
  options:
  [
    {
      text: 'Decline, you need all the fuel you\'ve got.',
      responseText: 'The tension in the air as you deliver the bad news is palpable. The comms connection disconnects.'
    },
    {
      text: 'Agree to give them some fuel.',
      events:
      [
        {probability: 0.5, name: 'test'},
        {probability: 0.5, name: 'test'}
      ]
    }
  ]
};

Events.test =
{
  text: 'A test event'
};