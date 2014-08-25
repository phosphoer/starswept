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