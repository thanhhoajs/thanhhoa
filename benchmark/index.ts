import { ThanhHoa, type IRequestContext } from '@thanhhoajs/thanhhoa';
import { heapStats } from 'bun:jsc';

const app = new ThanhHoa();

// Define a simple route to test
app.get('/test', (ctx: IRequestContext) => {
  return new Response('Hello, World!');
});

// Function to create multiple requests at the same time
async function makeRequests(numRequests: number): Promise<number[]> {
  const start = performance.now();
  const requests = Array(numRequests)
    .fill(0)
    .map(() => fetch('http://localhost:3000/test'));
  const responses = await Promise.all(requests);
  const end = performance.now();

  const latencies = responses.map((_, index) => {
    const requestEnd = performance.now();
    return requestEnd - start;
  });

  return latencies;
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

    const avgLatency =
      latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);

    console.log(`  Avg Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`  Min Latency: ${minLatency.toFixed(2)}ms`);
    console.log(`  Max Latency: ${maxLatency.toFixed(2)}ms`);
    console.log(
      `  Memory Usage: ${(afterHeap.heapSize - beforeHeap.heapSize) / 1024 / 1024} MB`,
    );

    // Wait a bit between iterations so the system can stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  server.stop();
  console.log('Benchmark completed.');
}

runBenchmark().catch(console.error);
