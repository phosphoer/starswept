function main()
{
  LoadSounds();

  TANK.createEngine(['Input', 'CollisionManager', 'Renderer2D', 'Resources', 'Game', 'MapGeneration', 'StarField', 'DustField']);

  TANK.main.Renderer2D.context = document.querySelector('#canvas').getContext('2d');
  TANK.main.Input.context = document.querySelector('#stage');

  TANK.start();
}