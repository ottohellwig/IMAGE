"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = (input) => (input && typeof input === 'object' && !Array.isArray(input));
exports.clone = (input) => (input && typeof input === 'object' ?
    JSON.parse(JSON.stringify(input)) :
    input);
//# sourceMappingURL=utilities.js.map