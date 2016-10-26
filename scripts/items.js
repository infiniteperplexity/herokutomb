HTomb = (function(HTomb) {
  "use strict";

  HTomb.Things.defineItem({
    template: "Rock",
    name: "rock",
    symbol: "\u2022",
    fg: "#999999",
    stackable: true,
    maxn: 10,
    randomColor: 15
  });

  HTomb.Things.defineItem({
    template: "FlintStone",
    name: "flint stone",
    symbol: "\u2022",
    fg: "#AAAAAA",
    stackable: true,
    maxn: 10,
    randomColor: 15
  });

  HTomb.Things.defineItem({
    template: "Corpse",
    name: "corpse",
    symbol: "%",
    //symbol: "\u2620",
    fg: "brown",
    randomColor: 10
  });

  HTomb.Things.defineItem({
    template: "Stick",
    name: "stick",
    symbol: "-",
    fg: "brown",
    randomColor: 20
  });

  HTomb.Things.defineItem({
    template: "Bloodstone",
    name: "bloodstone",
    symbol: "\u2234",
    fg: "red",
    stackable: true,
    maxn: 10,
    randomColor: 10
  });

  HTomb.Things.defineItem({
    template: "IronOre",
    name: "iron ore",
    symbol: "\u2234",
    fg: "gray",
    stackable: true,
    maxn: 10,
    plural: true,
    randomColor: 10
  });

  HTomb.Things.defineItem({
    template: "GoldOre",
    name: "gold ore",
    symbol: "\u2234",
    fg: "yellow",
    stackable: true,
    maxn: 10,
    plural: true,
    randomColor: 10
  });

  HTomb.Things.defineItem({
    template: "Moonstone",
    name: "moonstone",
    symbol: "\u2234",
    fg: "cyan",
    stackable: true,
    maxn: 10,
    randomColor: 10
  });

  HTomb.Things.defineItem({
    template: "Jade",
    name: "jade",
    symbol: "\u2234",
    fg: "green",
    stackable: true,
    maxn: 10,
    plural: true,
    randomColor: 10
  });

  HTomb.Things.defineItem({
    template: "WoodPlank",
    name: "wooden plank",
    symbol: "=",
    fg: "#BB9922",
    stackable: true,
    maxn: 10
  });


  return HTomb;
})(HTomb);
