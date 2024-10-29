import { ThanhHoa, type IRequestContext } from '@thanhhoajs/thanhhoa';
import { heapStats } from 'bun:jsc';

const app = new ThanhHoa();

// Define a simple route to test
app.get('/test', (ctx: IRequestContext) => {
  return new Response('Hello, World!');
});

// Function to create multiple requests concurrently
async function makeRequests(numRequests: number): Promise<number[]> {
  const requests = Array.from({ length: numRequests }, async () => {
    const start = performance.now();
    try {
      await fetch('http://localhost:3000/test');
      return performance.now() - start;
    } catch {
      return Infinity; // Return a high value for failed requests
    }
  });

  return Promise.all(requests);
}

// Main function to run benchmark
async function runBenchmark() {
  const server = app.listen({ port: 3000 });

  console.log('Starting benchmark...');

  const iterations = 5;
  const requestsPerIteration = 1000;

  for (let i = 0; i < iterations; i++) {
    console.log(`Iteration ${i + 1}/${iterations}`);

    const beforeHeap = heapStats();
    const latencies = await makeRequests(requestsPerIteration);
    const afterHeap = heapStats();

    const validLatencies = latencies.filter((lat) => lat !== Infinity); // Filter out failed requests
    const avgLatency =
      validLatencies.reduce((sum, lat) => sum + lat, 0) /
        validLatencies.length || 0;
    const maxLatency = Math.max(...validLatencies, 0);
    const minLatency = Math.min(...validLatencies, Infinity);

    console.log(`  Avg Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(
      `  Min Latency: ${minLatency === Infinity ? 'N/A' : minLatency.toFixed(2)}ms`,
    );
    console.log(`  Max Latency: ${maxLatency.toFixed(2)}ms`);
    console.log(
      `  Memory Usage: ${(afterHeap.heapSize - beforeHeap.heapSize) / 1024 / 1024} MB`,
    );

    // Wait a bit between iterations to stabilize the system
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  server.stop();
  console.log('Benchmark completed.');

  process.exit(0);
}

runBenchmark().catch(console.error);
