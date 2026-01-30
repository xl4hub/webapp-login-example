"use strict";
// Client-side TypeScript code
class App {
    constructor() {
        this.init();
    }
    async init() {
        // Check authentication status first
        await this.checkAuth();
        // Load initial data
        await this.loadSystemInfo();
        await this.loadHealthStatus();
        await this.loadItems();
        // Setup event listeners
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshAll();
        });
        // Auto-refresh health status every 30 seconds
        setInterval(() => this.loadHealthStatus(), 30000);
    }
    async checkAuth() {
        try {
            const response = await fetch('/api/me');
            const nav = document.querySelector('nav .flex.justify-between');
            const rightDiv = nav?.querySelector('.flex.items-center.space-x-4');
            if (!rightDiv)
                return;
            if (response.ok) {
                const data = await response.json();
                // Clear existing content
                rightDiv.innerHTML = '';
                // User info
                const userSpan = document.createElement('span');
                userSpan.className = 'text-gray-700';
                userSpan.textContent = `Logged in as: ${data.user.name || data.user.email}`;
                rightDiv.appendChild(userSpan);
                // Dashboard button
                const dashboardBtn = document.createElement('a');
                dashboardBtn.href = '/dashboard';
                dashboardBtn.className = 'btn-primary';
                dashboardBtn.textContent = 'Dashboard';
                rightDiv.appendChild(dashboardBtn);
                // Logout button
                const logoutBtn = document.createElement('a');
                logoutBtn.href = '/logout';
                logoutBtn.className = 'text-red-600 hover:text-red-800';
                logoutBtn.textContent = 'Logout';
                rightDiv.appendChild(logoutBtn);
            }
            else {
                // Show login button
                const existingRefresh = rightDiv.querySelector('#refreshBtn');
                if (!rightDiv.querySelector('.login-btn')) {
                    const loginBtn = document.createElement('a');
                    loginBtn.href = '/auth/logto';
                    loginBtn.className = 'btn-primary login-btn';
                    loginBtn.textContent = 'Login with logto';
                    if (existingRefresh) {
                        rightDiv.insertBefore(loginBtn, existingRefresh);
                    }
                    else {
                        rightDiv.appendChild(loginBtn);
                    }
                }
            }
        }
        catch (error) {
            console.error('Auth check failed:', error);
        }
    }
    async loadSystemInfo() {
        try {
            const response = await fetch('/api/info');
            const data = await response.json();
            const infoDiv = document.getElementById('systemInfo');
            if (infoDiv) {
                infoDiv.innerHTML = `
                    <p><span class="font-semibold">App:</span> ${data.app}</p>
                    <p><span class="font-semibold">Version:</span> ${data.version}</p>
                    <p><span class="font-semibold">Node:</span> ${data.node}</p>
                    <p><span class="font-semibold">Platform:</span> ${data.platform}/${data.arch}</p>
                    <p><span class="font-semibold">Auth:</span> ${data.authConfigured ? 'logto configured' : 'logto not configured'}</p>
                `;
            }
            // Show configuration notice if logto isn't configured
            const configNotice = document.getElementById('configNotice');
            if (configNotice && !data.authConfigured) {
                configNotice.innerHTML = `
                    <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                        <h3 class="font-semibold text-yellow-900 mb-2">🔐 logto Authentication Not Configured</h3>
                        <p class="text-yellow-800 mb-4">To enable user authentication and access protected content, you need to configure logto OAuth settings.</p>
                        <a href="/configure.html" class="btn-primary inline-block">
                            Configure logto Authentication →
                        </a>
                    </div>
                `;
            }
        }
        catch (error) {
            console.error('Failed to load system info:', error);
        }
    }
    async loadHealthStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            const healthDiv = document.getElementById('healthStatus');
            if (healthDiv) {
                const uptime = this.formatUptime(data.uptime);
                healthDiv.innerHTML = `
                    <p><span class="font-semibold">Status:</span> 
                        <span class="text-green-600">● ${data.status}</span>
                    </p>
                    <p><span class="font-semibold">Uptime:</span> ${uptime}</p>
                    <p class="text-xs text-gray-500 mt-2">Last check: ${new Date().toLocaleTimeString()}</p>
                `;
            }
        }
        catch (error) {
            console.error('Failed to load health status:', error);
            const healthDiv = document.getElementById('healthStatus');
            if (healthDiv) {
                healthDiv.innerHTML = '<p class="text-red-600">Connection error</p>';
            }
        }
    }
    async loadItems() {
        try {
            const response = await fetch('/api/items');
            const itemsDiv = document.getElementById('itemsList');
            if (!itemsDiv)
                return;
            if (response.ok) {
                const items = await response.json();
                itemsDiv.innerHTML = items.map(item => `
                    <div class="bg-gray-50 p-4 rounded-md hover:bg-gray-100 transition-colors">
                        <h3 class="font-semibold">${item.name}</h3>
                        <p class="text-gray-600 text-sm">${item.description}</p>
                    </div>
                `).join('');
            }
            else {
                itemsDiv.innerHTML = `
                    <div class="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                        <p class="text-yellow-800">🔒 Authentication required to view items</p>
                        <a href="/auth/logto" class="text-blue-600 hover:underline text-sm mt-2 inline-block">Login with logto →</a>
                    </div>
                `;
            }
        }
        catch (error) {
            console.error('Failed to load items:', error);
        }
    }
    async refreshAll() {
        const btn = document.getElementById('refreshBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Refreshing...';
        }
        await Promise.all([
            this.loadSystemInfo(),
            this.loadHealthStatus(),
            this.loadItems()
        ]);
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Refresh Data';
        }
    }
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        else {
            return `${secs}s`;
        }
    }
}
// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
