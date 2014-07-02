var Levels = [];

Levels[0] = 
{
  name: "Sample Level",
  lightDir: 1.5,
  factions: 
  [
    {ai: "Faction", team: 0, color: "#5d5"},
    {ai: "AIFaction", team: 1, color: "#d55"}
  ],
  controlPoints: 
  [
    {x: 0, y: 0, faction: 0},
    {x: 4000, y: 4000, faction: 1}
  ],
  ships:
  [
    {player: true, faction: 0, ship: "frigate", x: 0, y: 0},
    {player: false, faction: 1, ship: "frigate", x: 4000, y: 4000}
  ]
};

Levels[1] = 
{
  name: "Triangle",
  lightDir: 0.5,
  factions: 
  [
    {ai: "AIFaction", team: 0, color: "#5d5"},
    {ai: "AIFaction", team: 1, color: "#d55"}
  ],
  controlPoints: 
  [
    {x: 0, y: 0, faction: 0},
    {x: 5000, y: 5000, faction: 1},
    {x: 5000, y: 0, faction: -1}
  ],
  ships:
  [
  ]
};