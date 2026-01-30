#!/bin/bash

# Echidna Fuzzing Test Script for Commerce Escrow Contracts
# This script runs Echidna property-based fuzzing tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔬 Running Echidna Fuzzing Tests${NC}\n"

# Check if echidna is installed
if ! command -v echidna &> /dev/null; then
    echo -e "${RED}❌ Echidna is not installed${NC}"
    echo -e "${YELLOW}Install with:${NC}"
    echo -e "  ${BLUE}macOS:${NC} brew install echidna"
    echo -e "  ${BLUE}Ubuntu:${NC} sudo apt-get install echidna"
    echo -e "  ${BLUE}Docker:${NC} docker pull trailofbits/echidna"
    echo -e "  ${BLUE}From source:${NC} https://github.com/crytic/echidna#installation"
    exit 1
fi

# Check if solc is installed and install if needed
if ! command -v solc &> /dev/null; then
    echo -e "${YELLOW}⚠️  solc not found, installing via solc-select...${NC}"
    
    # Check if solc-select is installed
    if ! command -v solc-select &> /dev/null; then
        echo -e "${YELLOW}Installing solc-select...${NC}"
        pip3 install solc-select 2>/dev/null || {
            echo -e "${RED}❌ Failed to install solc-select${NC}"
            echo -e "${YELLOW}Please install solc-select manually:${NC}"
            echo -e "  pip3 install solc-select"
            echo -e "  solc-select install 0.8.9"
            echo -e "  solc-select use 0.8.9"
            exit 1
        }
    fi
    
    # Install and use solc 0.8.9
    echo -e "${YELLOW}Installing solc 0.8.9...${NC}"
    solc-select install 0.8.9 2>/dev/null || true
    solc-select use 0.8.9
    
    # Verify installation
    if ! command -v solc &> /dev/null; then
        echo -e "${RED}❌ solc installation failed${NC}"
        echo -e "${YELLOW}Please add solc to your PATH or install manually${NC}"
        exit 1
    fi
fi

# Verify solc version
SOLC_VERSION=$(solc --version | grep "Version:" | sed -E 's/.*Version: ([0-9]+\.[0-9]+\.[0-9]+).*/\1/')
echo -e "${BLUE}📌 Using solc version: ${SOLC_VERSION}${NC}"

# Ensure we're in the smart-contracts directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
yarn install --frozen-lockfile

echo -e "${YELLOW}🔨 Compiling contracts...${NC}"
yarn build:sol

# Create output directories
mkdir -p reports/security
mkdir -p corpus

# Parse command line arguments
TEST_LIMIT=100000
TIMEOUT=300
MODE="quick"

while [[ $# -gt 0 ]]; do
    case $1 in
        --thorough)
            MODE="thorough"
            TEST_LIMIT=500000
            TIMEOUT=3600
            shift
            ;;
        --ci)
            MODE="ci"
            TEST_LIMIT=50000
            TIMEOUT=180
            shift
            ;;
        --test-limit)
            TEST_LIMIT="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--thorough|--ci] [--test-limit N] [--timeout N]"
            exit 1
            ;;
    esac
done

echo -e "\n${BLUE}📊 Testing Mode: ${MODE}${NC}"
echo -e "${BLUE}   Test Limit: ${TEST_LIMIT}${NC}"
echo -e "${BLUE}   Timeout: ${TIMEOUT}s${NC}\n"

echo -e "${GREEN}🚀 Running Echidna Fuzzing...${NC}\n"

# Get the absolute path for remapping (OpenZeppelin is at the monorepo root)
CONTRACTS_DIR=$(pwd)
MONOREPO_ROOT=$(cd ../.. && pwd)

# Run Echidna with OpenZeppelin remapping
# Use absolute path for local execution (relative path ../../node_modules also works)
echidna src/contracts/test/EchidnaERC20CommerceEscrowWrapper.sol \
    --contract EchidnaERC20CommerceEscrowWrapper \
    --config echidna.config.yml \
    --test-limit $TEST_LIMIT \
    --timeout $TIMEOUT \
    --format text \
    --crytic-args="--solc-remaps @openzeppelin/=$MONOREPO_ROOT/node_modules/@openzeppelin/" \
    | tee reports/security/echidna-report.txt

EXIT_CODE=${PIPESTATUS[0]}

# Check results
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ All Echidna invariants held!${NC}"
    echo -e "${GREEN}📄 Report saved to: reports/security/echidna-report.txt${NC}"
    echo -e "${GREEN}💾 Corpus saved to: corpus/${NC}"
else
    echo -e "\n${RED}❌ Echidna found invariant violations!${NC}"
    echo -e "${YELLOW}📄 Check reports/security/echidna-report.txt for details${NC}"
    exit $EXIT_CODE
fi

# Display coverage information if available
if [ -f "coverage.txt" ]; then
    echo -e "\n${BLUE}📊 Coverage Report:${NC}"
    cat coverage.txt
    mv coverage.txt reports/security/echidna-coverage.txt
fi

