// [DEMO] Product catalogue and price rates. Replace with the client's real data before launch.
// All money values are EUR excluding VAT.

export const MATERIALS = {
  pvc: {
    name: 'PVC', long: 'PVC profilis',
    rate: 190,            // €/m² of window, 2-glass unit
    frame: 68, sashFace: 44,  // visible profile widths in elevation, mm
    width: [400, 3000], height: [400, 2600],
    sash: [350, 1300],    // allowed width of one opening sash, mm
    openings: ['n', 'kl', 'kr', 'vl', 'vr', 'v', 's'],
    colours: [
      { id: 'balta', name: 'Balta RAL 9016', hex: '#F4F4F0', pct: 0 },
      { id: 'antracitas', name: 'Antracito plėvelė RAL 7016', hex: '#3B4045', pct: 0.12 },
      { id: 'azuolas', name: 'Auksinio ąžuolo plėvelė', hex: '#A8743F', pct: 0.15 },
    ],
  },
  mediena: {
    name: 'Mediena', long: 'Klijuota pušies mediena',
    rate: 340, frame: 80, sashFace: 52,
    width: [400, 2800], height: [400, 2600],
    sash: [350, 1200],
    openings: ['n', 'kl', 'kr', 'vl', 'vr', 'v'],
    colours: [
      { id: 'naturali', name: 'Natūrali, skaidri lazūra', hex: '#D9B98C', pct: 0 },
      { id: 'balta', name: 'Dengta balta', hex: '#F4F4F0', pct: 0.08 },
      { id: 'antracitas', name: 'Dengta antracitu', hex: '#3B4045', pct: 0.08 },
    ],
  },
  aliuminis: {
    name: 'Aliuminis', long: 'Aliuminis su terminiu tilteliu',
    rate: 420, frame: 52, sashFace: 36,
    width: [400, 4500], height: [400, 3000],
    sash: [350, 1600],
    openings: ['n', 'kl', 'kr', 'vl', 'vr', 'v', 's'],
    colours: [
      { id: 'ral9016', name: 'Balta RAL 9016', hex: '#F4F4F0', pct: 0 },
      { id: 'ral7016', name: 'Antracitas RAL 7016', hex: '#3B4045', pct: 0 },
      { id: 'ral9005', name: 'Juoda RAL 9005', hex: '#17181A', pct: 0.05 },
    ],
  },
};

// Opening types per sash. Symbol follows drawing convention: triangle tip on the hinge side.
export const OPENINGS = {
  n:  { name: 'Nevarstoma', short: 'nevarst.', extra: 0 },
  kl: { name: 'Varstoma ir verčiama, vyriai kairėje', short: 'varst.-verč. K', extra: 85 },
  kr: { name: 'Varstoma ir verčiama, vyriai dešinėje', short: 'varst.-verč. D', extra: 85 },
  vl: { name: 'Varstoma, vyriai kairėje', short: 'varst. K', extra: 60 },
  vr: { name: 'Varstoma, vyriai dešinėje', short: 'varst. D', extra: 60 },
  v:  { name: 'Verčiama', short: 'verč.', extra: 45 },
  s:  { name: 'Slankiojama', short: 'slank.', extra: 150 },
};

export const GLAZING = {
  2: { name: 'Dviejų stiklų paketas', extraM2: 0 },
  3: { name: 'Trijų stiklų paketas', extraM2: 28 },
};

export const RULES = {
  minArea: 0.8,          // m² billed at least
  installBase: 60,       // € per unit
  installPerimeter: 12,  // € per metre of perimeter
  vat: 0.21,
  spread: 0.15,          // ± range around the calculated total
  maxQty: 20,
  fixedMax: 2400,        // widest single fixed pane, mm
};

export const DEFAULT_CONFIG = { w: 1480, h: 1460, m: 'pvc', c: 'balta', s: 3, o: ['kl', 'n', 'kr'], g: 3, q: 1 };
