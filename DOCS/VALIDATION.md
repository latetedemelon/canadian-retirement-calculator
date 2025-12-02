[← Back to Index](INDEX.md)

# Input Validation

This page documents the input validation function.

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
