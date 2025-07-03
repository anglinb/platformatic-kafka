type RegistryContentType = 'application/openmetrics-text; version=1.0.0; charset=utf-8' | 'text/plain; version=0.0.4; charset=utf-8';
export interface Metric {
    name?: string;
    get(): Promise<unknown>;
    reset: () => void;
    labels(labels: any): any;
}
export interface Counter extends Metric {
    inc: (value?: number) => void;
}
export interface Gauge extends Metric {
    inc: (value?: number) => void;
    dec: (value?: number) => void;
}
export interface Histogram {
}
export interface Summary {
}
export interface Registry {
    getSingleMetric: (name: string) => Counter | Gauge | any;
    metrics(): Promise<string>;
    clear(): void;
    resetMetrics(): void;
    registerMetric(metric: Metric): void;
    getMetricsAsJSON(): Promise<any>;
    getMetricsAsArray(): any[];
    removeSingleMetric(name: string): void;
    setDefaultLabels(labels: object): void;
    getSingleMetricAsString(name: string): Promise<string>;
    readonly contentType: RegistryContentType;
    setContentType(contentType: RegistryContentType): void;
}
export interface Prometheus {
    Counter: new (options: {
        name: string;
        help: string;
        registers: Registry[];
        labelNames?: string[];
    }) => Counter;
    Gauge: new (options: {
        name: string;
        help: string;
        registers: Registry[];
        labelNames?: string[];
    }) => Gauge;
    Registry: new (contentType?: string) => Registry;
}
export interface Metrics {
    registry: Registry;
    client: Prometheus;
    labels?: Record<string, any>;
}
export declare function ensureMetric<MetricType extends Metric>(metrics: Metrics, type: 'Gauge' | 'Counter', name: string, help: string): MetricType;
export {};
