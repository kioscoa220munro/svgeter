/* Web Worker for Nazer π Lab. Exact BigInt block encoding avoids Number precision loss. */
const STOP = "STOP";

function cleanDigits(raw) {
  return [...raw].filter(c => c >= "0" && c <= "9").join("");
}

function reverseCode(code, length) {
  let out = 0n;
  let x = code;
  for (let i = 0; i < length; i++) {
    out = out * 10n + (x % 10n);
    x /= 10n;
  }
  return out;
}

function formatCode(code, length) {
  return code.toString().padStart(length, "0");
}

function analyze(data, constant, n, length) {
  const prefix = data.slice(0, n);
  const windows = prefix.length - length + 1;
  if (windows <= 0 || prefix.length < n) {
    return {
      constant, n, l: length, windows: 0, distinct: 0, palindromic: 0,
      nonpalindromic: 0, unilateral: 0, closed_pairs: 0, reversal_pairs: 0,
      coverage_blocks: 0, coverage_pairs: 0, first_block: "",
      first_reverse: "", first_position: null, status: "INSUFFICIENT_DATA"
    };
  }

  const started = performance.now();
  const blocks = new Map();
  const firstDigits = prefix.slice(0, length);
  let code = 0n;
  for (const c of firstDigits) code = code * 10n + BigInt(c);
  const power = 10n ** BigInt(length - 1);
  blocks.set(code, 0);

  for (let i = 1; i < windows; i++) {
    code = (code % power) * 10n + BigInt(prefix.charCodeAt(i + length - 1) - 48);
    if (!blocks.has(code)) blocks.set(code, i);
  }

  let palindromic = 0, unilateral = 0, closedPairs = 0;
  const paired = new Set();
  const unilateralItems = [];

  for (const [block, position] of blocks) {
    const reverse = reverseCode(block, length);
    if (reverse === block) { palindromic++; continue; }
    const key = block < reverse ? block : reverse;
    if (paired.has(key)) continue;
    paired.add(key);
    if (blocks.has(reverse)) closedPairs++;
    else { unilateral++; unilateralItems.push([block, reverse, position]); }
  }

  unilateralItems.sort((a, b) => formatCode(a[0], length).localeCompare(formatCode(b[0], length)));
  const first = unilateralItems[0];
  const nonpalindromic = blocks.size - palindromic;
  const reversalPairs = closedPairs + unilateral;
  return {
    constant, n, l: length, windows, distinct: blocks.size,
    palindromic, nonpalindromic, unilateral, closed_pairs: closedPairs,
    reversal_pairs: reversalPairs,
    coverage_blocks: nonpalindromic ? (2 * closedPairs) / nonpalindromic : 1,
    coverage_pairs: reversalPairs ? closedPairs / reversalPairs : 1,
    first_block: first ? formatCode(first[0], length) : "",
    first_reverse: first ? formatCode(first[1], length) : "",
    first_position: first ? first[2] : null,
    status: unilateral ? "UNILATERAL" : "CLOSED",
    seconds: (performance.now() - started) / 1000
  };
}

function rngFactory(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function weightedDigit(rng, weights) {
  let total = weights.reduce((a, b) => a + b, 0);
  if (!total) return Math.floor(rng() * 10);
  let r = rng() * total;
  for (let d = 0; d < 10; d++) { r -= weights[d]; if (r < 0) return d; }
  return 9;
}

function marginalWeights(source) {
  const w = Array(10).fill(0);
  for (const c of source) w[c.charCodeAt(0) - 48]++;
  return w;
}

function generateNull(model, source, n, rng) {
  if (model === "iid-uniform") {
    let out = "";
    for (let i = 0; i < n; i++) out += Math.floor(rng() * 10);
    return out;
  }

  const marginal = marginalWeights(source);
  if (model === "iid-marginal") {
    let out = "";
    for (let i = 0; i < n; i++) out += weightedDigit(rng, marginal);
    return out;
  }

  const trans = Array.from({length:10}, () => Array(10).fill(0));
  const triple = new Map();
  for (let i = 0; i + 1 < source.length; i++) trans[source.charCodeAt(i)-48][source.charCodeAt(i+1)-48]++;
  if (model === "markov2") {
    for (let i = 0; i + 2 < source.length; i++) {
      const key = source.slice(i, i + 2);
      if (!triple.has(key)) triple.set(key, Array(10).fill(0));
      triple.get(key)[source.charCodeAt(i+2)-48]++;
    }
  }

  let out = String(weightedDigit(rng, marginal));
  if (n === 1) return out;
  out += String(weightedDigit(rng, marginal));

  for (let i = 2; i < n; i++) {
    let weights = model === "markov2" ? triple.get(out.slice(-2)) : null;
    if (!weights || weights.every(v => v === 0)) {
      weights = trans[out.charCodeAt(out.length - 1) - 48];
    }
    if (!weights || weights.every(v => v === 0)) weights = marginal;
    out += String(weightedDigit(rng, weights));
  }
  return out;
}

self.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === "analyze") {
    const rows = [];
    for (const ds of msg.datasets) {
      for (let n of msg.ns) {
        n = Math.max(1, n);
        if (ds.digits.length < n) {
          rows.push({constant: ds.name, n, l: null, status: "INSUFFICIENT_DATA"});
          continue;
        }
        const limit = Math.min(n, msg.lmax);
        for (let l = 1; l <= limit; l++) {
          const row = analyze(ds.digits, ds.name, n, l);
          rows.push(row);
          if (msg.mode === "first" && row.status === "UNILATERAL") break;
        }
      }
    }
    self.postMessage({type: "analysis", rows});
  }

  if (msg.type === "null") {
    const rows = [];
    const rng = rngFactory(msg.seed);
    for (const ds of msg.datasets) {
      for (const n of msg.ns) {
        if (ds.digits.length < n) continue;
        const source = ds.digits.slice(0, n);
        const observed = new Map();
        const limit = Math.min(n, msg.lmax);
        for (let l = 1; l <= limit; l++) observed.set(l, analyze(source, ds.name, n, l));

        const distributions = new Map();
        for (let rep = 0; rep < msg.reps; rep++) {
          const sample = generateNull(msg.model, source, n, rng);
          for (let l = 1; l <= limit; l++) {
            const r = analyze(sample, ds.name, n, l);
            if (!distributions.has(l)) distributions.set(l, []);
            distributions.get(l).push(r.unilateral);
          }
        }

        for (let l = 1; l <= limit; l++) {
          const values = distributions.get(l) || [];
          const obs = observed.get(l).unilateral;
          const mean = values.length ? values.reduce((a,b)=>a+b,0) / values.length : null;
          const ge = values.filter(v => v >= obs).length;
          const sorted = [...values].sort((a,b)=>a-b);
          const quantile = q => {
            if (!sorted.length) return null;
            const p = q * (sorted.length - 1);
            const lo = Math.floor(p), hi = Math.ceil(p);
            return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi]-sorted[lo])*(p-lo);
          };
          rows.push({
            constant: ds.name, n, l, model: msg.model, reps: msg.reps,
            observed_unilateral: obs, null_mean_unilateral: mean,
            p_ge_observed: values.length ? (1 + ge) / (values.length + 1) : null,
            null_q025: quantile(0.025), null_q50: quantile(0.5), null_q975: quantile(0.975)
          });
        }
      }
    }
    self.postMessage({type: "null", rows});
  }
};
