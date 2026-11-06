// Andreani a domicilio (paquete de hasta 1 kg). Se cobra el valor más alto de cada zona.
// Para cambiar una tarifa, editá los números de abajo.
export const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

const NOA = ['Catamarca', 'Tucumán', 'Salta', 'Jujuy', 'Santiago del Estero', 'La Rioja'];
const PATAGONIA = ['Río Negro', 'Neuquén', 'Tierra del Fuego', 'Chubut', 'Santa Cruz'];

export const RATES = { noa: 10500, centro: 13000, patagonia: 17500 };

export function shippingCost(province) {
  if (!province) return null;
  if (NOA.includes(province)) return RATES.noa;
  if (PATAGONIA.includes(province)) return RATES.patagonia;
  return RATES.centro;
}
