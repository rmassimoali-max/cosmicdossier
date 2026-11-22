/** Adjacent Enneagram wings wrap around the nine-type circle. */
export function validEnneagramWings(type: string | number | undefined): string[] {
  if (type === undefined || type === null || !/^[1-9]$/.test(String(type))) return [];
  const core = Number(type);
  return [String(core === 1 ? 9 : core - 1), String(core === 9 ? 1 : core + 1)];
}

export function isValidEnneagramWing(
  type: string | number | undefined,
  wing: string | number | undefined,
): boolean {
  return wing !== undefined && wing !== null && validEnneagramWings(type).includes(String(wing));
}
