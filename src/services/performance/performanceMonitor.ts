class PerformanceMonitor {
  private markers: Map<string, number> = new Map();

  startMeasure(name: string): void {
    this.markers.set(name, Date.now());
  }

  endMeasure(name: string): number {
    const start = this.markers.get(name);
    if (!start) return 0;

    const duration = Date.now() - start;
    this.markers.delete(name);

    // Log to analytics (when implemented)
    console.log(`[Performance] ${name}: ${duration}ms`);

    return duration;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await fn();
      const duration = this.endMeasure(name);

      // Alert if exceeds threshold
      if (name === "cold_start" && duration > 3000) {
        console.warn("[Performance] Cold start exceeded 3s threshold");
      }
      if (name === "scan_to_result" && duration > 2000) {
        console.warn("[Performance] Scan to result exceeded 2s threshold");
      }

      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
