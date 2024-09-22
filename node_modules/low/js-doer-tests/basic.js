/** @module Basic **/
exports = {
  Basic: {
    /** @type {import('../src').JSModuleFunction} **/
    async main(env, context, parameters) {
      const test1 = 'TEST';
      const test2 = `<div id="TEST"></div>`;

      return [test1, test2];
    }
  }
}