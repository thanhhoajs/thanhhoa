/**
 * Represents the next middleware function in the chain.
 * @typedef {function(): Promise<Response>} INextFunction
 * @description The next middleware function in the chain.
 * @returns {Promise<Response>} A promise of a response.
 */
export interface INextFunction {
  (): Promise<Response>;
}
