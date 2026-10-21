// @ts-check
// Alcanzabilidad: ¿se puede sumar exactamente N unidades de piscina con las
// porciones disponibles? Programación dinámica sobre unidades de piscina.

/**
 * @param {{chunks: {a:number}[]}[]} cands
 * @param {number} pool
 * @param {number} units
 * @returns {Uint8Array} reach[u] = 1 si u unidades son alcanzables
 */
export function reachable(cands, pool, units) {
  const amounts = new Set();
  for (const c of cands) for (const ch of c.chunks) amounts.add(Math.round(ch.a / pool));
  const list = Array.from(amounts).filter((a) => a > 0).sort((a, b) => a - b);
  const reach = new Uint8Array(units + 1);
  reach[0] = 1;
  for (let r = 1; r <= units; r++) {
    for (const a of list) {
      if (a > r) break;
      if (reach[r - a]) { reach[r] = 1; break; }
    }
  }
  return reach;
}
