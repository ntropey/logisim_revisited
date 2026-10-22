/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Module resolve hook so the site build can import the TypeScript sources of @logisim/core and the app's
 * schematic renderer directly (Node >= 22.18 strips the types). Those sources use extensionless relative
 * imports, as bundlers allow; this adds the '.ts'.
 */
export async function resolve(specifier, context, next) {
  const relative = specifier.startsWith('./') || specifier.startsWith('../');
  if (relative && context.parentURL?.endsWith('.ts') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    try {
      return await next(`${specifier}.ts`, context);
    } catch {
      // fall through to the default resolution and its error
    }
  }
  return next(specifier, context);
}
