export function maskCnr(cnr: string | null | undefined) {
  if (!cnr) return "No CNR";

  const value = cnr.replace(/\s+/g, "").toUpperCase();

  if (value.length <= 4) return value;

  return `${value.slice(0, 4)}********${value.slice(-4)}`;
}
