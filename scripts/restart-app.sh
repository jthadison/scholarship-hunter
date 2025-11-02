#!/bin/bash
# Restart Application Script (Bash)
# Stops any running Next.js dev servers and restarts the application

echo "=== Scholarship Hunter - Application Restart ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Function to stop processes on a specific port
stop_process_on_port() {
    local port=$1
    echo -e "${YELLOW}Checking for processes on port $port...${NC}"

    # Find PIDs using the port
    local pids=$(lsof -ti:$port 2>/dev/null)

    if [ -n "$pids" ]; then
        for pid in $pids; do
            local proc_name=$(ps -p $pid -o comm= 2>/dev/null)
            echo -e "  ${RED}Stopping process '$proc_name' (PID: $pid)${NC}"
            kill -9 $pid 2>/dev/null
            if [ $? -eq 0 ]; then
                echo -e "  ${GREEN}Process stopped successfully${NC}"
            else
                echo -e "  ${RED}Failed to stop process $pid${NC}"
            fi
        done
    else
        echo -e "  ${GRAY}No process found on port $port${NC}"
    fi
}

# Function to kill Node.js processes related to the app
stop_node_processes() {
    echo -e "${YELLOW}Stopping all Node.js development processes...${NC}"

    # Find node processes running next dev
    local pids=$(pgrep -f "next dev" 2>/dev/null)

    if [ -n "$pids" ]; then
        for pid in $pids; do
            echo -e "  ${RED}Stopping Node process (PID: $pid)${NC}"
            kill -9 $pid 2>/dev/null
        done
        echo -e "  ${GREEN}Node processes stopped${NC}"
    else
        echo -e "  ${GRAY}No Node.js processes found${NC}"
    fi
}

# Step 1: Stop processes on default Next.js port (3000)
stop_process_on_port 3000

# Step 2: Stop any other Node.js processes
stop_node_processes

# Wait a moment for cleanup
echo ""
echo -e "${YELLOW}Waiting for cleanup...${NC}"
sleep 2

# Step 3: Start the application
echo ""
echo -e "${GREEN}Starting application...${NC}"
echo -e "${CYAN}Running: pnpm dev${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Start the dev server
pnpm dev
