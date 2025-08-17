#!/bin/bash

echo "🤖 ETH Sell Bot Status Check"
echo "============================"

# Check if bot is running
BOT_PID=$(ps aux | grep "eth-sell-bot-runner" | grep -v grep | awk '{print $2}' | head -1)

if [ -n "$BOT_PID" ]; then
    echo "✅ Bot is RUNNING (PID: $BOT_PID)"
    
    # Show recent log entries
    echo ""
    echo "📋 Recent Activity (last 10 lines):"
    echo "------------------------------------"
    tail -10 eth-sell-bot.log 2>/dev/null || echo "No log file found"
    
    echo ""
    echo "📊 Process Info:"
    echo "----------------"
    ps aux | grep "eth-sell-bot-runner" | grep -v grep
    
else
    echo "❌ Bot is NOT RUNNING"
    echo ""
    echo "📋 Last Log Entries:"
    echo "-------------------"
    tail -10 eth-sell-bot.log 2>/dev/null || echo "No log file found"
fi

echo ""
echo "🔧 Commands:"
echo "------------"
echo "Start bot:  node eth-sell-bot-runner.js"
echo "Stop bot:   kill \$BOT_PID"
echo "View logs:  tail -f eth-sell-bot.log"
echo "Status:     ./check-bot-status.sh"
