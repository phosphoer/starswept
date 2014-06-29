var Levels = [];

Levels[0] = 
{
  name: "Sample Level",
  factions: 
  [
    {player: true, team: 0, color: "#5d5"},
    {player: false, team: 1, color: "#d55"}
  ],
  controlPoints: 
  [
    {x: 0, y: 0, faction: 0},
    {x: 2000, y: 2000, faction: 1}
  ],
  ships:
  [
    {player: true, faction: 0, ship: "frigate", x: 0, y: 0},
    {player: false, faction: 1, ship: "frigate", x: 2000, y: 2000}
  ]
};