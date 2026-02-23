/**
 * Represents the next middleware function in the chain.
 */
export interface INextFunction {
  (): Promise<Response>;
}
