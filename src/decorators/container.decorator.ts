/**
 * Dependency injection container
 * @class Container
 */
export class Container {
  private providers: Map<string, any> = new Map();
  private singletons: Map<string, any> = new Map();

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
   * @param {object} options - Options for provider registration
   * @param {boolean} [options.singleton] - Whether the provider should be a singleton
   * @template T
   */
  register<T>(
    token: string,
    provider: Constructor<T> | T,
    options: { singleton?: boolean } = {},
  ) {
    if (options.singleton && !this.singletons.has(token)) {
      this.singletons.set(
        token,
        this.isConstructor(provider) ? new provider() : provider,
      );
    }
    this.providers.set(token, provider);
  }

  private isConstructor(provider: any): provider is Constructor<any> {
    return typeof provider === 'function' && provider.prototype;
  }

  /**
   * Resolve a provider from the container
   * @param {string} token - Provider token
   * @returns {T} Provider instance
   * @template T
   * @throws {Error} When provider is not found
   */
  resolve<T>(token: string): T {
    // Check singleton instances first
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`Provider not found for token: ${token}`);
    }

    // Lazy instantiation for class providers
    if (this.isConstructor(provider)) {
      const instance = new provider();
      return instance as T;
    }

    return provider as T;
  }

  /**
   * Get all provider tokens in the container
   * @returns {string[]} Provider tokens
   */
  getAllKeys(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Constructor type definition if not already imported
type Constructor<T = any> = new (...args: any[]) => T;

export const container = new Container();
