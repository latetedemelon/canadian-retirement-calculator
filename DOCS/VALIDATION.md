[← Back to Index](INDEX.md)

# Input Validation

This page documents the input validation function.
Functions for validating retirement planning inputs.

---

## VALIDATE_RETIREMENT_INPUTS

Validates common retirement planning inputs.

```
=VALIDATE_RETIREMENT_INPUTS(currentAge, retirementAge, lifeExpectancy, rrspBalance, tfsaBalance)
```

### Returns

"OK" if valid, or error message describing issues

### Checks

- Age ranges (0-120)
- Retirement age >= current age
- Life expectancy > retirement age
- Balances are non-negative
**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| currentAge | number | Your current age |
| retirementAge | number | Planned retirement age |
| lifeExpectancy | number | Planning age (life expectancy) |
| rrspBalance | number | Current RRSP/RRIF balance |
| tfsaBalance | number | Current TFSA balance |

**Returns:** 
- "OK" if all inputs are valid
- Error message describing specific issues if invalid

**Validation Checks:**

| Check | Rule |
|-------|------|
| Age ranges | All ages must be between 0 and 120 |
| Retirement age | Must be ≥ current age |
| Life expectancy | Must be > retirement age |
| Balances | Must be non-negative (≥ 0) |

**Examples:**
```
=VALIDATE_RETIREMENT_INPUTS(40, 65, 90, 200000, 50000)
→ "OK"

=VALIDATE_RETIREMENT_INPUTS(65, 60, 90, 200000, 50000)
→ "ERROR: retirementAge must be >= currentAge"

=VALIDATE_RETIREMENT_INPUTS(40, 65, 60, 200000, 50000)
→ "ERROR: lifeExpectancy must be > retirementAge"

=VALIDATE_RETIREMENT_INPUTS(40, 65, 90, -5000, 50000)
→ "ERROR: rrspBalance must be >= 0"
```

**Best Practice:**
Use this function in a cell to validate your INPUTS sheet before running projections:
```
=IF(VALIDATE_RETIREMENT_INPUTS(B2,B3,B4,B5,B6)="OK", "✓ Inputs valid", VALIDATE_RETIREMENT_INPUTS(B2,B3,B4,B5,B6))
```
