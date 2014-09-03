function main()
{
  LoadSounds();

  TANK.createEngine(['Input', 'Renderer2D', 'Game', 'MapGeneration', 'StarField', 'DustField']);

  TANK.main.Renderer2D.context = document.querySelector('#canvas').getContext('2d');
  TANK.main.Input.context = document.querySelector('#stage');

  TANK.start();
}