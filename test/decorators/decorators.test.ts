import { describe, expect, it } from 'bun:test';
import {
  Controller,
  Get,
  Post,
  Module,
  INJECT_METADATA_KEY,
  Inject,
} from '@thanhhoajs/thanhhoa';

describe('Decorators', () => {
  describe('Controller Decorator', () => {
    it('should set controller metadata with path', () => {
      @Controller('/test')
      class TestController {}

      const metadata = Reflect.getMetadata('controller', TestController);
      expect(metadata).toBe('/test');
    });

    it('should set empty path when no path provided', () => {
      @Controller()
      class TestController {}

      const metadata = Reflect.getMetadata('controller', TestController);
      expect(metadata).toBe('');
    });
  });

  describe('Route Decorators', () => {
    it('should set route metadata for GET method', () => {
      class TestController {
        @Get('/users')
        getUsers() {}
      }

      const metadata = Reflect.getMetadata(
        'route',
        TestController.prototype,
        'getUsers',
      );
      expect(metadata).toEqual({ path: '/users', method: 'GET' });
    });

    it('should set route metadata for POST method', () => {
      class TestController {
        @Post('/users')
        createUser() {}
      }

      const metadata = Reflect.getMetadata(
        'route',
        TestController.prototype,
        'createUser',
      );
      expect(metadata).toEqual({ path: '/users', method: 'POST' });
    });
  });

  describe('Module Decorator', () => {
    it('should set module metadata with providers and controllers', () => {
      class TestService {}
      class TestController {}

      @Module({
        providers: [TestService],
        controllers: [TestController],
      })
      class TestModule {}

      const metadata = Reflect.getMetadata('module', TestModule);
      expect(metadata).toEqual({
        providers: [TestService],
        controllers: [TestController],
      });
    });

    it('should set module metadata with exports', () => {
      class TestService {}
      class SharedService {}

      @Module({
        providers: [TestService],
        controllers: [],
        exports: [SharedService],
      })
      class TestModule {}

      const metadata = Reflect.getMetadata('module', TestModule);
      expect(metadata).toEqual({
        providers: [TestService],
        controllers: [],
        exports: [SharedService],
      });
    });

    it('should allow importing modules with exported providers', () => {
      class SharedService {}
      class DependentService {
        constructor(private sharedService: SharedService) {}
      }

      @Module({
        providers: [SharedService],
        exports: [SharedService],
      })
      class SharedModule {}

      @Module({
        imports: [SharedModule],
        providers: [DependentService],
      })
      class FeatureModule {}

      const sharedMetadata = Reflect.getMetadata('module', SharedModule);
      const featureMetadata = Reflect.getMetadata('module', FeatureModule);

      expect(sharedMetadata.exports).toContain(SharedService);
      expect(featureMetadata.imports).toContain(SharedModule);
    });
  });

  describe('Inject Decorator', () => {
    it('should set injection metadata', () => {
      class TestService {}

      class TestController {
        constructor(@Inject('TestService') private provider: any) {}
      }

      // Get metadata from the prototype
      const metadata = Reflect.getMetadata(
        INJECT_METADATA_KEY,
        TestController.prototype,
        'constructor',
      );
      expect(metadata).toEqual(['TestService']);

      // Should also be accessible from the constructor
      const constructorMetadata = Reflect.getMetadata(
        INJECT_METADATA_KEY,
        TestController,
      );
      expect(constructorMetadata).toEqual(['TestService']);
    });

    it('should handle multiple injections', () => {
      class TestController {
        constructor(
          @Inject('Service1') private service1: any,
          @Inject('Service2') private service2: any,
        ) {}
      }

      const metadata = Reflect.getMetadata(
        INJECT_METADATA_KEY,
        TestController.prototype,
        'constructor',
      );
      expect(metadata).toEqual(['Service1', 'Service2']);
    });
  });
});
