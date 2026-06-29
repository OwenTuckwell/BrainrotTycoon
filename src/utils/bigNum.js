import BigNumber from "bignumber.js";

BigNumber.config({ EXPONENTIAL_AT: 1e9, DECIMAL_PLACES: 2 });

// Generate suffixes: K M B T, then A-Z, AA-ZZ, AAA-ZZZ
// Single: 26 suffixes (levels 5-30)
// Double: 26^2 = 676 suffixes (levels 31-706)
// Triple: 26^3 = 17,576 suffixes (levels 707-18,282)
// Total: 18,282 tiers = numbers up to 10^54,846 — never runs out
function buildSuffixes() {
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const s = ["", "K", "M", "B", "T"];
  for (const a of L) s.push(a);
  for (const a of L) for (const b of L) s.push(a + b);
  for (const a of L) for (const b of L) for (const c of L) s.push(a + b + c);
  return s;
}

const SUFFIXES = buildSuffixes();

export function fmt(value) {
  const num = new BigNumber(value);
  if (num.isNaN() || !num.isFinite()) return "MAX";
  if (num.lt(1000)) return num.toFixed(1).replace(/\.0$/, "");

  const exp = Math.floor(num.e / 3);
  const idx = Math.min(exp, SUFFIXES.length - 1);
  const scaled = num.div(new BigNumber(10).pow(idx * 3));
  return scaled.toFixed(2).replace(/\.?0+$/, "") + " " + SUFFIXES[idx];
}

export function bn(value) {
  return new BigNumber(value);
}

export function gte(a, b) {
  return new BigNumber(a).gte(new BigNumber(b));
}

export function add(a, b) {
  return new BigNumber(a).plus(new BigNumber(b)).toFixed(0);
}

export function sub(a, b) {
  return new BigNumber(a).minus(new BigNumber(b)).toFixed(0);
}

export function mul(a, b) {
  return new BigNumber(a).times(new BigNumber(b)).toFixed(0);
}

export function costForNext(baseCost, multiplier, owned) {
  return new BigNumber(baseCost)
    .times(new BigNumber(multiplier).pow(owned))
    .toFixed(0);
}
