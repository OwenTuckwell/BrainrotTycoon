import BigNumber from "bignumber.js";

// 9 tiers × 25 base characters = 225 total characters
// Each tier multiplies base cost and BPS — creating a natural grind wall per character

const TIERS = [
  { name: "Baby",             prefix: "👶",  costMul: "1",          bpsMul: "1",          color: "#aaaaaa" },
  { name: "Weak",             prefix: "😤",  costMul: "15",         bpsMul: "12",         color: "#88cc44" },
  { name: "Adult",            prefix: "💪",  costMul: "200",        bpsMul: "150",        color: "#44aaff" },
  { name: "Strong",           prefix: "🔥",  costMul: "3000",       bpsMul: "2200",       color: "#ff8800" },
  { name: "Bronze Edition",   prefix: "🥉",  costMul: "50000",      bpsMul: "35000",      color: "#cd7f32" },
  { name: "Silver Edition",   prefix: "🥈",  costMul: "1000000",    bpsMul: "700000",     color: "#c0c0c0" },
  { name: "Gold Edition",     prefix: "🥇",  costMul: "25000000",   bpsMul: "17000000",   color: "#ffd700" },
  { name: "Platinum Edition", prefix: "💎",  costMul: "800000000",  bpsMul: "550000000",  color: "#e5e4e2" },
  { name: "Diamond Edition",  prefix: "💠",  costMul: "30000000000",bpsMul: "20000000000",color: "#b9f2ff" },
];

const BASE_CHARACTERS = [
  { id: 1,  name: "Tralalero Tralala",        emoji: "🦈", desc: "A little fish with big sigma energy",              baseCost: "10",                    baseBps: "0.1"          },
  { id: 2,  name: "Bombardino Coccodrillo",   emoji: "🐊", desc: "Drops bombs, eats bread, no thoughts",             baseCost: "100",                   baseBps: "0.5"          },
  { id: 3,  name: "Tung Tung Tung Sahur",     emoji: "🥁", desc: "Bro just drums. That's it. That's the lore.",      baseCost: "500",                   baseBps: "2"            },
  { id: 4,  name: "Ballerina Cappuccina",     emoji: "☕", desc: "Spins into your soul and your wallet",             baseCost: "2000",                  baseBps: "8"            },
  { id: 5,  name: "Cappuccino Assassino",     emoji: "🗡️", desc: "Kills you softly with espresso",                  baseCost: "8000",                  baseBps: "25"           },
  { id: 6,  name: "Brr Brr Patapim",          emoji: "🐒", desc: "Makes the noise. You know the noise.",             baseCost: "25000",                 baseBps: "75"           },
  { id: 7,  name: "La Vaca Saturno Saturnita",emoji: "🐄", desc: "A cosmic cow orbiting pure chaos",                 baseCost: "100000",                baseBps: "200"          },
  { id: 8,  name: "Glorbo Finkus",            emoji: "👾", desc: "Nobody knows what this is. It slaps.",             baseCost: "400000",                baseBps: "600"          },
  { id: 9,  name: "Frigo Camelo",             emoji: "🐪", desc: "A fridge camel from the frozen desert",            baseCost: "1500000",               baseBps: "1800"         },
  { id: 10, name: "Lirili Larila",            emoji: "🌵", desc: "Sings. Haunts. Repeats.",                          baseCost: "6000000",               baseBps: "5000"         },
  { id: 11, name: "Crocodilo Porcodilo",      emoji: "🐸", desc: "A gentleman. A menace. A goblin.",                 baseCost: "25000000",              baseBps: "15000"        },
  { id: 12, name: "Orangutan Rigoletto",      emoji: "🦧", desc: "Opera singing ape of pure brainrot",               baseCost: "100000000",             baseBps: "40000"        },
  { id: 13, name: "Pinguino Atomico",         emoji: "🐧", desc: "Tiny. Nuclear. Unstoppable.",                      baseCost: "500000000",             baseBps: "120000"       },
  { id: 14, name: "Giraffa Maleficente",      emoji: "🦒", desc: "Evil giraffe. Wears a cape. Don't ask.",           baseCost: "2000000000",            baseBps: "380000"       },
  { id: 15, name: "Elefante Robotico",        emoji: "🐘", desc: "Mechanical elephant from the future",              baseCost: "10000000000",           baseBps: "1200000"      },
  { id: 16, name: "Serpente Galactico",       emoji: "🐍", desc: "Slithers through dimensions eating stars",         baseCost: "60000000000",           baseBps: "4000000"      },
  { id: 17, name: "Orso Nucleare",            emoji: "🐻", desc: "Nuclear bear. Peak Italian brainrot.",             baseCost: "300000000000",          baseBps: "13000000"     },
  { id: 18, name: "Drago Interdimensionale",  emoji: "🐉", desc: "A dragon from every dimension at once",            baseCost: "2000000000000",         baseBps: "45000000"     },
  { id: 19, name: "Scoiattolo Cosmico",       emoji: "🐿️", desc: "Cosmic squirrel holding the universe's nuts",     baseCost: "15000000000000",        baseBps: "150000000"    },
  { id: 20, name: "Papera Quantistica",       emoji: "🦆", desc: "A quantum duck. Exists and doesn't simultaneously",baseCost: "100000000000000",       baseBps: "500000000"    },
  { id: 21, name: "Tartaruga Temporale",      emoji: "🐢", desc: "A time-travelling turtle. Very slow. Very powerful",baseCost: "1000000000000000",      baseBps: "2000000000"   },
  { id: 22, name: "Unicorno Malefico",        emoji: "🦄", desc: "Evil rainbow unicorn of absolute chaos",           baseCost: "10000000000000000",     baseBps: "7000000000"   },
  { id: 23, name: "Il Sigma Supremo",         emoji: "👑", desc: "The most sigma being in existence",                baseCost: "100000000000000000",    baseBps: "25000000000"  },
  { id: 24, name: "Omega Brainrot",           emoji: "🧠", desc: "Pure distilled brainrot energy",                  baseCost: "1000000000000000000",   baseBps: "100000000000" },
  { id: 25, name: "Il Dio del Brainrot",      emoji: "⚡", desc: "The God of Brainrot. Beyond comprehension.",       baseCost: "100000000000000000000", baseBps: "500000000000" },
];

// Generate all 225 characters sorted by effective base cost
function generateCharacters() {
  const all = [];
  let uid = 1;

  for (const tier of TIERS) {
    for (const base of BASE_CHARACTERS) {
      const cost = new BigNumber(base.baseCost).times(new BigNumber(tier.costMul)).toFixed(0);
      const bps  = new BigNumber(base.baseBps).times(new BigNumber(tier.bpsMul)).toFixed(4);
      all.push({
        id:             uid++,
        name:           `${tier.name} ${base.name}`,
        emoji:          base.emoji,
        tierPrefix:     tier.prefix,
        tierName:       tier.name,
        tierColor:      tier.color,
        description:    base.desc,
        baseCost:       cost,
        baseBps:        bps,
        costMultiplier: 1.15,
      });
    }
  }

  all.sort((a, b) => new BigNumber(a.baseCost).minus(new BigNumber(b.baseCost)).toNumber());
  return all;
}

export const CHARACTERS = generateCharacters();
