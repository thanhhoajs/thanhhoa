export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private metrics = {
    requests: 0,
    errors: 0,
    avgResponseTime: 0,
  };

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  trackRequest(duration: number, isError = false): void {
    this.metrics.requests++;
    if (isError) this.metrics.errors++;
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (this.metrics.requests - 1) + duration) /
      this.metrics.requests;
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
}
