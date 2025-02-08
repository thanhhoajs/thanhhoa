import { describe, expect, it } from 'bun:test';
import {
  Controller,
  Get,
  Module,
  Provider,
  Inject,
  ThanhHoa,
} from '@thanhhoajs/thanhhoa';

describe('ThanhHoa', () => {
  it('should register and handle modules', async () => {
    const app = new ThanhHoa();

    @Controller('/api')
    class TestController {
      @Get('/hello')
      async hello() {
        return new Response('Hello World');
      }
    }

    @Module({
      controllers: [TestController],
    })
    class TestModule {}

    app.listen({ port: 3000 }, [TestModule]);

    const response = await fetch('http://localhost:3000/api/hello');
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe('Hello World');
  });

  it('should handle static files', async () => {
    const app = new ThanhHoa();

    app.listen({
      port: 3001,
      staticDirectories: [
        {
          path: '/static',
          directory: 'test/fixtures',
        },
      ],
    });

    const response = await fetch('http://localhost:3001/static/test.txt');
    const text = (await response.text()).trim(); // Trim whitespace and line endings

    expect(response.status).toBe(200);
    expect(text).toBe('Hello ThanhHoa!');
  });

  it('should handle module exports and imports', async () => {
    const app = new ThanhHoa();

    @Provider()
    class SharedService {
      getData() {
        return 'shared data';
      }
    }

    @Controller('/feature')
    class FeatureController {
      constructor(
        @Inject(SharedService.name) private sharedService: SharedService,
      ) {}

      @Get('/data')
      async getData() {
        return new Response(this.sharedService.getData());
      }
    }

    @Module({
      providers: [SharedService],
      exports: [SharedService],
    })
    class SharedModule {}

    @Module({
      imports: [SharedModule],
      controllers: [FeatureController],
    })
    class FeatureModule {}

    app.listen({ port: 3002 }, [FeatureModule]);

    const response = await fetch('http://localhost:3002/feature/data');
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe('shared data');
  });
});
