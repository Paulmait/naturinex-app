// Custom loader to strip Flow type syntax from React Native modules
module.exports = function(source) {
  // Strip Flow type imports and annotations
  const stripped = source
    // Remove type imports: import type { X } from 'Y'
    .replace(/import\s+type\s+{[^}]*}\s+from\s+['"][^'"]*['"]/g, '')
    // Remove type from mixed imports: import X, { type Y } from 'Z'
    .replace(/,\s*{\s*type\s+([^}]*)\s*}/g, '')
    // Remove standalone type in imports: { type X }
    .replace(/{\s*type\s+([^},]*)\s*}/g, '{ $1 }')
    // Remove Flow type annotations in parameters: (param: Type)
    .replace(/:\s*\w+(?:<[^>]*>)?(?:\s*\|[^,)]*)?/g, '')
    // Remove Flow type exports: export type X = Y
    .replace(/export\s+type\s+[^=]+=\s*[^;]*;/g, '')
    // Remove type keywords in destructuring
    .replace(/\btype\s+(\w+)/g, '$1');
    
  return stripped;
};