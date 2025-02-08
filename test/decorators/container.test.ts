import { describe, expect, it } from 'bun:test';
import { Container } from '@thanhhoajs/thanhhoa';

describe('Container', () => {
  it('should register and resolve providers', () => {
    const container = new Container();
    class TestService {
      getData() {
        return 'test data';
      }
    }

    container.register('TestService', new TestService());
    const provider = container.resolve<TestService>('TestService');

    expect(provider).toBeInstanceOf(TestService);
    expect(provider.getData()).toBe('test data');
  });

  it('should throw error when resolving non-existent provider', () => {
    const container = new Container();

    expect(() => {
      container.resolve('NonExistentService');
    }).toThrow('Provider not found for token: NonExistentService');
  });
});
