#!/bin/bash
echo "🔐 Opening Logto Admin Console..."
echo ""
echo "📍 Admin URL: http://192.168.10.14:4000/admin"
echo ""
echo "Opening in browser..."
xdg-open http://192.168.10.14:4000/admin 2>/dev/null || echo "Please open http://192.168.10.14:4000/admin in your browser"