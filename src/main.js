function main()
{
  TANK.addComponents("Game, StarField, InputManager, CollisionManager, RenderManager");

  TANK.RenderManager.context = document.getElementById("canvas").getContext("2d");
  TANK.InputManager.context = document.getElementById("stage");

  TANK.start();
}