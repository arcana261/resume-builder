#!/usr/bin/env bash

# LinkedIn Scraper - Shell Wrapper
# This script builds the TypeScript code and runs it with all provided arguments

set -e  # Exit on error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the script directory
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be >= 18.0.0 (current: $(node --version))"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "Dependencies not installed. Installing..."
    npm install
fi

# Check if dist directory exists or if source files are newer than dist
if [ ! -d "dist" ] || [ "$(find src -type f -newer dist 2>/dev/null | wc -l)" -gt 0 ]; then
    print_info "Building TypeScript code..."
    npm run build

    if [ $? -eq 0 ]; then
        print_info "Build successful!"
    else
        print_error "Build failed!"
        exit 1
    fi
else
    print_info "Using existing build (use --rebuild to force rebuild)"
fi

# Check for --rebuild flag
if [[ "$*" == *"--rebuild"* ]]; then
    print_info "Forcing rebuild..."
    npm run build

    # Remove --rebuild from arguments before passing to the app
    set -- "${@/--rebuild/}"
fi

# Run the compiled JavaScript with all arguments
print_info "Running linkedin-scraper..."
exec node dist/index.js "$@"
