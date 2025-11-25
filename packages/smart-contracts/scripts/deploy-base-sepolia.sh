#!/bin/bash

# Base Sepolia Deployment Script
# This script helps deploy ERC20FeeProxy and ERC20CommerceEscrowWrapper to Base Sepolia

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Base Sepolia Deployment Helper Script                  ║"
echo "║   Request Network - ERC20 Commerce Escrow Wrapper        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load .env file if it exists
if [ -f .env ]; then
    echo -e "${BLUE}Loading .env file...${NC}"
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    echo ""
fi

# Check if private key is set
if [ -z "$DEPLOYMENT_PRIVATE_KEY" ] && [ -z "$ADMIN_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: No private key found!${NC}"
    echo ""
    echo "Please set either DEPLOYMENT_PRIVATE_KEY or ADMIN_PRIVATE_KEY environment variable:"
    echo ""
    echo -e "${YELLOW}export DEPLOYMENT_PRIVATE_KEY=your_private_key_here${NC}"
    echo ""
    echo "OR"
    echo ""
    echo -e "${YELLOW}export ADMIN_PRIVATE_KEY=your_private_key_here${NC}"
    echo ""
    echo "⚠️  Make sure to fund your wallet with Base Sepolia ETH:"
    echo "   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    exit 1
fi

echo -e "${GREEN}✓${NC} Private key found"
echo ""

# Network information
echo -e "${BLUE}Network Information:${NC}"
echo "  Name:      Base Sepolia"
echo "  Chain ID:  84532"
echo "  RPC URL:   https://sepolia.base.org"
echo "  Explorer:  https://sepolia.basescan.org/"
echo ""

# Check if contracts are built
if [ ! -d "build" ]; then
    echo -e "${YELLOW}⚠️  Contracts not built. Building now...${NC}"
    yarn build:sol
    echo ""
fi

echo -e "${BLUE}Deployment Plan:${NC}"
echo "  1. Deploy ERC20FeeProxy"
echo "  2. Use official AuthCaptureEscrow: 0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff"
echo "  3. Deploy ERC20CommerceEscrowWrapper"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Starting deployment...${NC}"
echo ""

# Run deployment
yarn hardhat deploy-erc20-commerce-escrow-wrapper --network base-sepolia

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deployment Complete!                                    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Update the deployed addresses in these files:"
echo "   - packages/smart-contracts/src/lib/artifacts/ERC20FeeProxy/index.ts"
echo "   - packages/smart-contracts/src/lib/artifacts/ERC20CommerceEscrowWrapper/index.ts"
echo ""
echo "2. Rebuild the packages:"
echo "   cd packages/smart-contracts && yarn build"
echo ""
echo "3. Verify contracts were verified on Basescan:"
echo "   https://sepolia.basescan.org/"
echo ""
echo -e "${BLUE}ℹ️  For more information, see BASE_SEPOLIA_DEPLOYMENT_GUIDE.md${NC}"
echo ""

