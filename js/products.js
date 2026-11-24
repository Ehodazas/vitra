// [DEMO] Product lines. Names, specs and texts are illustrative; replace with the client's real systems.
export const SERIES = [
  {
    id: 'norma', name: 'Norma', material: 'pvc', page: 'langai-norma.html',
    kind: 'PVC langai',
    lead: 'Kasdienis langas namui ir butui: šiltas profilis, paprasta priežiūra ir platus spalvų pasirinkimas.',
    photo: { img: 'norma-svetaine', iw: 1200, ih: 800, alt: 'Svetainė su sofa ir plačiais langais į sodą' },
    detail: { img: 'detale-rankena-langas', iw: 1000, ih: 1000, alt: 'Lango rankena ir rėmo kampas iš arti' },
    cfg: { w: 1200, h: 1400, m: 'pvc', c: 'balta', s: 2, o: ['vl', 'kr'], g: 3, q: 1 },
    specs: [
      ['Profilio gylis', '82 mm'], ['Kameros', '6'], ['Stiklo paketas', '2 arba 3 stiklų, iki 48 mm'],
      ['Šilumos perdavimas Uw', 'nuo 0,8 W/(m²K)'], ['Didžiausias langas', '3000 × 2600 mm'], ['Atidarymas', 'visi tipai, taip pat slankiojamas'],
    ],
  },
  {
    id: 'silva', name: 'Silva', material: 'mediena', page: 'langai-silva.html',
    kind: 'Mediniai langai',
    lead: 'Klijuotos pušies langai mediniams, rąstiniams ir paveldo pastatams. Dengiami lazūra arba dažais.',
    photo: { img: 'svetaine', iw: 1200, ih: 800, alt: 'Šviesi svetainė su mediniais langų rėmais ir vaizdu į mišką' },
    detail: { img: 'detale-rankena-zalvaris', iw: 1000, ih: 1000, alt: 'Žalvarinė lango rankena ant balto medinio rėmo' },
    cfg: { w: 1100, h: 1460, m: 'mediena', c: 'naturali', s: 2, o: ['vl', 'kr'], g: 3, q: 1 },
    specs: [
      ['Profilio gylis', '78 mm'], ['Mediena', 'trijų sluoksnių klijuota pušis'], ['Stiklo paketas', '2 arba 3 stiklų'],
      ['Šilumos perdavimas Uw', 'nuo 0,9 W/(m²K)'], ['Didžiausias langas', '2800 × 2600 mm'], ['Atidarymas', 'varstomi, verčiami, varstomi-verčiami'],
    ],
  },
  {
    id: 'lumen', name: 'Lumen', material: 'aliuminis', page: 'langai-lumen.html',
    kind: 'Aliuminio langai',
    lead: 'Ploni rėmai dideliems stiklams, stiklo sienoms ir slankiojamoms sistemoms.',
    photo: { img: 'lumen-siena', iw: 1200, ih: 800, alt: 'Interjeras su langais nuo grindų iki lubų ir medžiais už jų' },
    detail: { img: 'detale-stiklas', iw: 1000, ih: 1000, alt: 'Stiklo ir rėmo detalė, šviesa per matinį stiklą' },
    cfg: { w: 2400, h: 2200, m: 'aliuminis', c: 'ral7016', s: 2, o: ['s', 'n'], g: 3, q: 1 },
    specs: [
      ['Profilio gylis', '75 mm, su terminiu tilteliu'], ['Matomas rėmo plotis', 'nuo 52 mm'], ['Stiklo paketas', '3 stiklų'],
      ['Šilumos perdavimas Uw', 'nuo 1,0 W/(m²K)'], ['Didžiausias langas', '4500 × 3000 mm'], ['Atidarymas', 'visi tipai, didelės slankiojamos sistemos'],
    ],
  },
];

export const DOORS = [
  {
    id: 'porta', name: 'Porta', kind: 'Lauko durys', materials: 'Mediena arba aliuminis',
    lead: 'Šiltos lauko durys su daugiataške spyna. Paviršius – lygus, frezuotas arba su stiklo intarpu.',
    photo: { img: 'durys-medis', iw: 1200, ih: 1500, alt: 'Medinės lauko durys šviesiame fasade su augalais' },
    specs: [['Varčios storis', '78 mm'], ['Spyna', 'daugiataškė, 3 sklendės'], ['Šilumos perdavimas Ud', 'nuo 0,9 W/(m²K)']],
  },
  {
    id: 'terra', name: 'Terra', kind: 'Slankiojamos terasos durys', materials: 'Aliuminis',
    lead: 'Pakeliamos-stumdomos durys į terasą ar sodą. Žemas slenkstis, didelės stiklo plokštumos.',
    photo: { img: 'durys-slankiojamos', iw: 1200, ih: 1500, alt: 'Stiklinės slankiojamos durys į kiemą' },
    specs: [['Didžiausia varčia', '3000 × 2800 mm'], ['Slenkstis', 'nuo 20 mm'], ['Stiklo paketas', '3 stiklų']],
  },
  {
    id: 'aura', name: 'Aura', kind: 'Balkono durys', materials: 'PVC arba aliuminis',
    lead: 'Balkono ir terasos durys, suderintos su langais: tas pats profilis, spalva ir furnitūra.',
    photo: { img: 'durys-iejimas', iw: 1200, ih: 1500, alt: 'Įėjimas su stiklinėmis durimis tamsiame fasade' },
    specs: [['Atidarymas', 'varstomos arba varstomos-verčiamos'], ['Slenkstis', 'žemas aliuminio'], ['Spalvos', 'kaip langų']],
  },
];
