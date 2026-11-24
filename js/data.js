// [DEMO] Example content: window schedule of a sample house and the project catalogue.
// Photos: Unsplash licence, credited on saltiniai.html. Replace with the client's real projects.

export const SCHEDULE = [
  { mark: 'L-1', room: 'Svetainė, virtuvė', cfg: { w: 1480, h: 1460, m: 'pvc', c: 'antracitas', s: 3, o: ['kl', 'n', 'kr'], g: 3, q: 4 } },
  { mark: 'L-2', room: 'Miegamieji', cfg: { w: 900, h: 1460, m: 'pvc', c: 'antracitas', s: 1, o: ['kr'], g: 3, q: 3 } },
  { mark: 'L-3', room: 'Išėjimas į terasą', cfg: { w: 2400, h: 2200, m: 'aliuminis', c: 'ral7016', s: 2, o: ['s', 'n'], g: 3, q: 1 } },
  { mark: 'L-4', room: 'Kabinetas', cfg: { w: 1100, h: 1460, m: 'mediena', c: 'naturali', s: 2, o: ['vl', 'kr'], g: 3, q: 2 } },
  { mark: 'L-5', room: 'Vonios kambarys', cfg: { w: 600, h: 600, m: 'pvc', c: 'antracitas', s: 1, o: ['v'], g: 2, q: 2 } },
];

// size: ratio key for the photo crop (w×h of the 1200px file)
export const PROJECTS = [
  { id: 'pavilnys', mark: 'P-01', title: 'Dviejų aukštų namas', place: 'Pavilnys, Vilnius', material: 'pvc', product: ['langai'], building: 'namas',
    img: 'namas-sodas', iw: 1600, ih: 1067, alt: 'Šviesus dviejų aukštų namas su tamsiais langų rėmais ir veja priekyje',
    text: 'Antracito spalvos PVC langai su trijų stiklų paketais, antrame aukšte – ištisinė langų juosta.', cfg: { w: 2800, h: 1460, m: 'pvc', c: 'antracitas', s: 3, o: ['kl', 'n', 'kr'], g: 3, q: 1 } },
  { id: 'kacergine', mark: 'P-02', title: 'Namas su stiklinėmis sienomis', place: 'Kačerginė, Kauno r.', material: 'aliuminis', product: ['langai', 'durys'], building: 'namas',
    img: 'betonas-stiklas', iw: 1200, ih: 900, alt: 'Betoninis namas su didelėmis stiklinėmis sienomis tarp medžių',
    text: 'Aliuminio sistema su slankiojamomis durimis į terasą ir nevarstomais stiklais iki lubų.', cfg: { w: 3600, h: 2400, m: 'aliuminis', c: 'ral9005', s: 3, o: ['s', 'n', 's'], g: 3, q: 1 } },
  { id: 'traku', mark: 'P-03', title: 'Sodo namelis', place: 'Trakų r.', material: 'mediena', product: ['langai'], building: 'namas',
    img: 'bokstelis', iw: 1200, ih: 1500, alt: 'Siauras medinis namelis su dideliais langais tarp medžių',
    text: 'Klijuotos pušies langai, dengti skaidria lazūra; aukšti nevarstomi stiklai ir viena verčiama varčia.', cfg: { w: 1200, h: 2200, m: 'mediena', c: 'naturali', s: 2, o: ['n', 'kr'], g: 3, q: 1 } },
  { id: 'palanga', mark: 'P-04', title: 'Baltas namas prie jūros', place: 'Palanga', material: 'pvc', product: ['langai'], building: 'namas',
    img: 'baltas-namas', iw: 1200, ih: 900, alt: 'Baltas modernus namas su horizontaliu langu, mėlynas dangus',
    text: 'Balti PVC langai; horizontalus langas virtuvėje padalytas į tris dalis.', cfg: { w: 2400, h: 900, m: 'pvc', c: 'balta', s: 3, o: ['n', 'v', 'n'], g: 3, q: 1 } },
  { id: 'zverynas', mark: 'P-05', title: 'Langų keitimas bute', place: 'Žvėrynas, Vilnius', material: 'mediena', product: ['langai'], building: 'butas',
    img: 'uzuolaidos', iw: 1200, ih: 900, alt: 'Balti mediniai langai su smulkiu skaidymu ir užuolaidomis kambaryje',
    text: 'Seni mediniai langai pakeisti naujais to paties skaidymo, dengtais balta danga.', cfg: { w: 1400, h: 1700, m: 'mediena', c: 'balta', s: 2, o: ['vl', 'kr'], g: 3, q: 1 } },
  { id: 'kaunas-holas', mark: 'P-06', title: 'Biuro pastato holas', place: 'Kaunas', material: 'aliuminis', product: ['durys'], building: 'komercinis',
    img: 'holas', iw: 1200, ih: 900, alt: 'Erdvus holas su juodais aliuminio rėmais ir augalais',
    text: 'Juodi aliuminio rėmai, įėjimo durys ir vitrinos iki lubų.', cfg: { w: 3000, h: 2600, m: 'aliuminis', c: 'ral9005', s: 3, o: ['n', 'vr', 'n'], g: 3, q: 1 } },
  { id: 'klaipeda', mark: 'P-07', title: 'Balkono durys', place: 'Klaipėda', material: 'aliuminis', product: ['durys'], building: 'butas',
    img: 'balkono-durys', iw: 1200, ih: 1500, alt: 'Stiklinės balkono durys su plonais rėmais ir vaizdu į medžius',
    text: 'Dvivėrės aliuminio balkono durys su plonais profiliais.', cfg: { w: 1600, h: 2300, m: 'aliuminis', c: 'ral7016', s: 2, o: ['vl', 'kr'], g: 3, q: 1 } },
  { id: 'moletai', mark: 'P-08', title: 'Svetainė su vaizdu į mišką', place: 'Molėtų r.', material: 'aliuminis', product: ['langai'], building: 'namas',
    img: 'svetaine', iw: 1200, ih: 800, alt: 'Šviesi svetainė su didelėmis langų sienomis į mišką',
    text: 'Aliuminio langų siena iš keturių dalių, dvi iš jų – slankiojamos.', cfg: { w: 4200, h: 2400, m: 'aliuminis', c: 'ral7016', s: 3, o: ['s', 'n', 's'], g: 3, q: 1 } },
  { id: 'senamiestis', mark: 'P-09', title: 'Skaidyti langai senamiestyje', place: 'Kauno senamiestis', material: 'mediena', product: ['langai'], building: 'butas',
    img: 'langas-tinklelis', iw: 1200, ih: 1500, alt: 'Langas su smulkiu tinkleliu ir vaizdu į žalumą',
    text: 'Medinių langų skaidymas atkurtas pagal senuosius, kad atitiktų paveldo reikalavimus.', cfg: { w: 1300, h: 1600, m: 'mediena', c: 'balta', s: 2, o: ['vl', 'kr'], g: 2, q: 1 } },
  { id: 'anyksciai', mark: 'P-10', title: 'Kaimo namo langai', place: 'Anykščių r.', material: 'mediena', product: ['langai'], building: 'namas',
    img: 'palange', iw: 1200, ih: 900, alt: 'Šviesi palangė su gėlėmis prie medinio lango',
    text: 'Natūralios spalvos mediniai langai su gilia palange.', cfg: { w: 1000, h: 1300, m: 'mediena', c: 'naturali', s: 2, o: ['vl', 'kr'], g: 3, q: 1 } },
  { id: 'nida', mark: 'P-11', title: 'Du vasarnamiai', place: 'Nida', material: 'aliuminis', product: ['langai', 'durys'], building: 'namas',
    img: 'juodi-namai', iw: 1200, ih: 800, alt: 'Du juodi namai su šlaitiniais stogais lauke',
    text: 'Juodi aliuminio langai ir durys, suderinti su tamsia fasado apdaila.', cfg: { w: 1800, h: 2200, m: 'aliuminis', c: 'ral9005', s: 2, o: ['n', 'vr'], g: 3, q: 1 } },
];

export const MATERIAL_LABEL = { pvc: 'PVC', mediena: 'Mediena', aliuminis: 'Aliuminis' };
export const PRODUCT_LABEL = { langai: 'Langai', durys: 'Durys' };
export const BUILDING_LABEL = { namas: 'Namas', butas: 'Butas', komercinis: 'Komercinis' };
