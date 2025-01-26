/**
 * Dependency injection container
 * @class Container
 */
export class Container {
  private providers: Map<string, any> = new Map();

  /**
   * Check if a provider exists in the container
   * @param {string} token - Provider token
   * @returns {boolean} True if provider exists, false otherwise
   */
  has(token: string): boolean {
    return this.providers.has(token);
  }

  /**
   * Register a provider in the container
   * @param {string} token - Provider token
   * @param {T} provider - Provider instance
   * @template T
   */
  register<T>(token: string, provider: T) {
    this.providers.set(token, provider);
  }

  /**
   * Resolve a provider from the container
   * @param {string} token - Provider token
   * @returns {T} Provider instance
   * @template T
   * @throws {Error} When provider is not found
   */
  resolve<T>(token: string): T {
    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`Provider not found for token: ${token}`);
    }
    return provider as T;
  }
}

export const container = new Container();
