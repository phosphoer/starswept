function main()
{
  TANK.createEngine(["Input", "Renderer2D", "Game", "StarField"]);

  TANK.main.Renderer2D.context = document.getElementById("canvas").getContext("2d");

  TANK.start();
}