// Polyfill for next/dist/build/swc — adds isWasm() compat shim removed in Next.js 16
const swc = require('next/dist/build/swc');

if (typeof swc.isWasm !== 'function') {
  swc.isWasm = async function () {
    try {
      const bindings = await swc.loadBindings();
      return bindings.isWasm === true;
    } catch {
      return false;
    }
  };
}

module.exports = swc;
