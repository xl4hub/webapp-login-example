#!/bin/bash
# Service monitor script - checks and restarts services if needed

check_service() {
    local port=$1
    local name=$2
    local start_cmd=$3
    local start_dir=$4
    
    if ! lsof -i :$port > /dev/null 2>&1; then
        echo "❌ $name (port $port) is NOT running. Restarting..."
        cd "$start_dir"
        eval "$start_cmd"
        sleep 3
        if lsof -i :$port > /dev/null 2>&1; then
            echo "✅ $name restarted successfully"
        else
            echo "⚠️  Failed to restart $name"
        fi
    else
        echo "✅ $name (port $port) is running"
    fi
}

echo "=== Service Monitor ==="
echo "Time: $(date)"
echo ""

# Check each service
check_service 4000 "Logto Auth Server" "nohup node server.js > /tmp/logto.log 2>&1 &" "/mnt/usb/projects/webapp/auth-server"
check_service 8000 "Casdoor" "nohup ./casdoor > /tmp/casdoor.log 2>&1 &" "/mnt/usb/projects/casdoor"
check_service 3000 "Web App" "nohup npm start > /tmp/webapp.log 2>&1 &" "/mnt/usb/projects/webapp"

echo ""
echo "=== Current Status ==="
netstat -tlnp 2>/dev/null | grep -E "(3000|4000|8000)" | sort || echo "Run as root for process details"

# To run this automatically every 5 minutes, add to crontab:
# */5 * * * * /mnt/usb/projects/webapp/monitor-services.sh >> /tmp/service-monitor.log 2>&1