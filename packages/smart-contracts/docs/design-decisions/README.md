# Design Decisions Documentation

This directory contains architectural design documentation for the Request Network smart contracts, focusing on key design decisions, trade-offs, and future extensibility paths.

## Documents

### [Fee Mechanism Design](./FEE_MECHANISM_DESIGN.md)

**Contract**: `ERC20CommerceEscrowWrapper`

Comprehensive documentation of the fee mechanism architecture:

- **Fee Type**: Request Network platform fees vs Commerce Escrow protocol fees
- **Fee Payer Model**: Merchant-pays vs payer-pays alternatives
- **Fee Recipients**: Single recipient with fee-splitting contract strategies
- **Fee Distribution**: ERC20FeeProxy integration for event compatibility
- **Security Considerations**: Fee validation, overflow protection, rounding behavior
- **Future Enhancements**: Dynamic fee tiers, fee oracles, multi-currency fees
- **Integration Guidelines**: How to implement fee splitting for multi-party scenarios

**Related Files**:

- Contract: [`src/contracts/ERC20CommerceEscrowWrapper.sol`](../../src/contracts/ERC20CommerceEscrowWrapper.sol)
- Tests: [`test/contracts/ERC20CommerceEscrowWrapper.test.ts`](../../test/contracts/ERC20CommerceEscrowWrapper.test.ts)

---

## Purpose

Design decision documents serve multiple purposes:

1. **Architectural Clarity**: Document WHY decisions were made, not just WHAT was implemented
2. **Future Context**: Preserve reasoning for future maintainers and auditors
3. **Alternative Evaluation**: Record alternatives considered and reasons for rejection
4. **Extensibility Planning**: Define clear upgrade paths for future enhancements
5. **Integration Guidance**: Help integrators understand constraints and best practices

## When to Create a Design Document

Consider creating a design document when:

- ✅ Multiple implementation approaches exist with significant trade-offs
- ✅ The decision has long-term architectural implications
- ✅ Security or economic considerations drive the design
- ✅ The implementation intentionally differs from common patterns
- ✅ Future extensibility requires understanding current constraints
- ✅ Integration requires understanding architectural decisions
- ✅ Auditors/reviewers frequently ask "why was it done this way?"

## Document Template

```markdown
# [Feature Name] Design

## Overview

Brief summary of the feature and its purpose

## Design Principles

Core principles driving the design

## Current Implementation

How it works now, with code examples

## Design Decisions

### Decision 1: [Choice Made]

- **Options Considered**: A, B, C
- **Choice**: B
- **Rationale**: Why B was chosen over A and C
- **Trade-offs**: What we gained/lost

### Decision 2: [Another Choice]

...

## Security Considerations

Security implications and mitigations

## Future Enhancements

Potential upgrades and their paths

## References

Related contracts, tests, docs
```

---

## Contributing

When adding new design documents:

1. Use clear, descriptive filenames (e.g., `FEE_MECHANISM_DESIGN.md`, not `fees.md`)
2. Update this README with a summary and links
3. Cross-reference from contract NatSpec comments
4. Include code examples and test references
5. Document both the "happy path" and edge cases
6. Explain WHY, not just WHAT
7. Keep documents up-to-date as implementation evolves

---

**Last Updated**: 2025-11-18
