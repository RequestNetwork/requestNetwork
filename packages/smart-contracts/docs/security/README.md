# Security Documentation

This directory contains security-related documentation and reports for Request Network's smart contracts.

## Contents

- **SECURITY_TESTING.md** - Comprehensive guide to security testing tools (Slither & Echidna)
- **Reports** - Generated security analysis reports (auto-generated, not in git)

## Security Analysis Reports

Security reports are generated automatically by CI/CD pipelines and are available as workflow artifacts.

### Slither Reports

Static analysis reports from Slither:

- `slither-report.txt` - Human-readable findings
- `slither-report.json` - Machine-readable (for tooling)
- `slither.sarif` - GitHub Security tab format

**Location:** Workflow artifacts or `packages/smart-contracts/reports/security/`

### Echidna Reports

Fuzzing test reports from Echidna:

- `echidna-report.txt` - Property test results
- `echidna-coverage.txt` - Coverage information
- `counterexamples.txt` - Failing sequences (if any)

**Location:** Workflow artifacts or `packages/smart-contracts/reports/security/`

### Corpus

Echidna saves interesting test sequences in the corpus directory for reuse across runs.

**Location:** `packages/smart-contracts/corpus/` (cached in CI)

## Quick Links

- [Security Testing Guide](../SECURITY_TESTING.md)
- [Fee Mechanism Design](../design-decisions/FEE_MECHANISM_DESIGN.md)
- [GitHub Security Tab](https://github.com/RequestNetwork/requestNetwork/security/code-scanning)

## Security Contacts

For security issues or questions:

- **Internal:** Tag `@RequestNetwork/security-team` in issues
- **External:** security@request.network
- **Bug Bounty:** https://immunefi.com/bounty/requestnetwork/

## Responsible Disclosure

If you discover a security vulnerability, please follow our responsible disclosure process:

1. **DO NOT** open a public GitHub issue
2. Email security@request.network with details
3. Wait for confirmation and further instructions
4. Give team reasonable time to patch before disclosure

Thank you for helping keep Request Network secure! 🔒
