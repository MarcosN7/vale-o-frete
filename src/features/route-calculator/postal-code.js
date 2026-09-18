// Only a standalone Brazilian postal code is expanded; ordinary address text is preserved.
export function parsePostalQuery(value) {
  const query = value.trim();
  if (/^\d{5}-?\d{3}$/.test(query)) return { kind: 'cep', cep: query.replace('-', '') };
  if (/^[\d\s-]+$/.test(query)) return { kind: 'invalid' };
  return { kind: 'address' };
}
