#!/bin/bash

# Slither Security Analysis Script for Commerce Escrow Contracts
# This script runs Slither static analysis on the ERC20CommerceEscrowWrapper contract

# Note: We don't use 'set -e' because Slither returns exit code 1 when it finds issues

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Running Slither Security Analysis${NC}\n"

# Check if slither is installed
if ! command -v slither &> /dev/null; then
    echo -e "${RED}❌ Slither is not installed${NC}"
    echo -e "${YELLOW}Install with: pip3 install slither-analyzer${NC}"
    exit 1
fi

# Ensure we're in the smart-contracts directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
yarn install --frozen-lockfile

echo -e "${YELLOW}🔨 Compiling contracts...${NC}"
yarn build:sol

echo -e "\n${GREEN}🚀 Running Slither on ERC20CommerceEscrowWrapper...${NC}\n"

# Create output directory
mkdir -p reports/security

# Run Slither and save JSON output
echo -e "${YELLOW}Analyzing ERC20CommerceEscrowWrapper contract only...${NC}"
set +e # Temporarily disable exit on error

# Run Slither on the project, analyzing only ERC20CommerceEscrowWrapper contract
# Using --include-paths to only analyze the specific contract file
slither . \
    --hardhat-ignore-compile \
    --include-paths "src/contracts/ERC20CommerceEscrowWrapper.sol" \
    --json - \
    2>/dev/null > reports/security/slither-report.json || true

EXIT_CODE=0  # We always want to process the results

set -e # Re-enable for safety (though we don't use it at top level)

# Generate human-readable reports from JSON
echo -e "\n${YELLOW}📊 Generating reports...${NC}"

# Check if file has content
if [ ! -s reports/security/slither-report.json ]; then
    echo -e "${RED}❌ Slither JSON report is empty or missing${NC}"
    echo -e "${YELLOW}This usually means Slither encountered an error during analysis${NC}"
    exit 1
fi

python3 << 'PYTHON_SCRIPT'
import json
import sys

try:
    # Read JSON report
    with open('reports/security/slither-report.json', 'r') as f:
        data = json.loads(f.read())
    
    detectors = data.get('results', {}).get('detectors', [])
    
    # Generate human-readable text report
    with open('reports/security/slither-report.txt', 'w') as out:
        out.write("=" * 80 + "\n")
        out.write("SLITHER SECURITY ANALYSIS REPORT\n")
        out.write("=" * 80 + "\n\n")
        out.write(f"Total Findings: {len(detectors)}\n\n")
        
        # Group by severity
        by_severity = {}
        for finding in detectors:
            severity = finding['impact']
            if severity not in by_severity:
                by_severity[severity] = []
            by_severity[severity].append(finding)
        
        # Print by severity
        for severity in ['High', 'Medium', 'Low', 'Informational', 'Optimization']:
            if severity not in by_severity:
                continue
            
            findings = by_severity[severity]
            out.write("=" * 80 + "\n")
            out.write(f"{severity.upper()} SEVERITY ({len(findings)} findings)\n")
            out.write("=" * 80 + "\n\n")
            
            for i, finding in enumerate(findings, 1):
                out.write(f"[{severity[0]}-{i}] {finding['check']}\n")
                out.write(f"Confidence: {finding['confidence']}\n")
                out.write(f"\n{finding['description']}\n")
                out.write("-" * 80 + "\n\n")
    
    # Generate markdown summary
    with open('reports/security/slither-summary.md', 'w') as out:
        out.write('# Slither Security Analysis Summary\n\n')
        out.write(f'**Total Findings:** {len(detectors)}\n\n')
        
        out.write('## Findings by Impact\n\n')
        for severity in ['High', 'Medium', 'Low', 'Informational', 'Optimization']:
            count = len(by_severity.get(severity, []))
            if count > 0:
                emoji = '🔴' if severity == 'High' else '🟠' if severity == 'Medium' else '🟡' if severity == 'Low' else '🔵' if severity == 'Informational' else '⚙️'
                out.write(f'- {emoji} **{severity}:** {count}\n')
        
        # High severity findings
        high_findings = by_severity.get('High', [])
        if high_findings:
            out.write('\n## 🔴 High Severity Findings\n\n')
            for i, finding in enumerate(high_findings, 1):
                out.write(f'### {i}. {finding["check"]} ({finding["confidence"]} confidence)\n\n')
                out.write(f'{finding["description"][:300]}...\n\n')
        
        # Medium severity findings (just list check types)
        medium_findings = by_severity.get('Medium', [])
        if medium_findings:
            out.write(f'\n## 🟠 Medium Severity Findings ({len(medium_findings)} total)\n\n')
            medium_by_check = {}
            for f in medium_findings:
                check = f['check']
                medium_by_check[check] = medium_by_check.get(check, 0) + 1
            
            for check, count in sorted(medium_by_check.items(), key=lambda x: -x[1]):
                out.write(f'- **{check}:** {count} occurrence(s)\n')
        
        out.write('\n---\n\n')
        out.write('For detailed findings, see:\n')
        out.write('- `slither-report.json` - Full JSON report\n')
        out.write('- `slither-report.txt` - Full text report\n')
    
    print("✅ Reports generated successfully")
    
except Exception as e:
    print(f"❌ Error generating reports: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ Slither analysis completed successfully!${NC}"
    echo -e "${GREEN}📄 Reports saved to: reports/security/${NC}"
else
    echo -e "\n${YELLOW}⚠️  Slither found potential issues${NC}"
    echo -e "${YELLOW}📄 Check reports/security/slither-report.txt for details${NC}"
    exit $EXIT_CODE
fi

