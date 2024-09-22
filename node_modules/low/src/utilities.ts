
export const isObject = (input: any) => (input && typeof input === 'object' && !Array.isArray(input));

export const clone = (input: any) => (
  input && typeof input === 'object' ?
  JSON.parse(JSON.stringify(input)) :
  input
);