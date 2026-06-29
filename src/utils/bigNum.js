import BigNumber from "bignumber.js";

BigNumber.config({ EXPONENTIAL_AT: 1e9, DECIMAL_PLACES: 2 });

const SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "UDc", "DDc", "TDc", "QaDc", "QiDc", "SxDc", "SpDc", "OcDc", "NoDc",
  "Vg", "UVg", "DVg", "TVg", "QaVg", "QiVg", "SxVg", "SpVg", "OcVg", "NoVg",
  "Tg", "∞"
];

export function fmt(value) {
  const bn = new BigNumber(value);
  if (bn.isNaN() || !bn.isFinite()) return "∞";
  if (bn.lt(1000)) return bn.toFixed(1).replace(/\.0$/, "");

  const exp = Math.floor(bn.e / 3);
  const idx = Math.min(exp, SUFFIXES.length - 1);
  const scaled = bn.div(new BigNumber(10).pow(idx * 3));
  return scaled.toFixed(2).replace(/\.?0+$/, "") + SUFFIXES[idx];
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
