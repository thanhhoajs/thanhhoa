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
  const iterations = 5000;
  const requestsPerIteration = 2;

  // Arrays to store results
  const avgLatencies: number[] = [];
  const memoryUsages: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const beforeHeap = heapStats();
    const latencies = await makeRequests(requestsPerIteration);
    const afterHeap = heapStats();

    const validLatencies = latencies.filter((lat) => lat !== Infinity);
    const avgLatency =
      validLatencies.reduce((sum, lat) => sum + lat, 0) /
        validLatencies.length || 0;
    const memoryUsage =
      (afterHeap.heapSize - beforeHeap.heapSize) / (1024 * 1024); // MB

    avgLatencies.push(avgLatency);
    memoryUsages.push(memoryUsage);
  }

  // Calculate overall results
  const overallResults = {
    avgLatency:
      avgLatencies.reduce((sum, val) => sum + val, 0) / avgLatencies.length,
    avgMemoryUsage:
      memoryUsages.reduce((sum, val) => sum + val, 0) / memoryUsages.length,
  };

  console.log('\nOverall Benchmark Results:');
  console.log(
    `  Overall Avg Latency: ${overallResults.avgLatency.toFixed(2)}ms`,
  );
  console.log(
    `  Average Memory Usage: ${overallResults.avgMemoryUsage.toFixed(2)} MB`,
  );

  server.stop();
  process.exit(0);
}

runBenchmark().catch(console.error);
