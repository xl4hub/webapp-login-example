interface SystemInfo {
    app: string;
    version: string;
    node: string;
    platform: string;
    arch: string;
}
interface HealthStatus {
    status: string;
    timestamp: string;
    uptime: number;
}
interface Item {
    id: number;
    name: string;
    description: string;
}
declare class App {
    constructor();
    init(): Promise<void>;
    loadSystemInfo(): Promise<void>;
    loadHealthStatus(): Promise<void>;
    loadItems(): Promise<void>;
    refreshAll(): Promise<void>;
    formatUptime(seconds: number): string;
}
//# sourceMappingURL=app.d.ts.map