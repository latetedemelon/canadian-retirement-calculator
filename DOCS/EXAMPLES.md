[← Back to Index](INDEX.md)

# Examples & Use Cases

This page provides practical examples and common scenarios for using the Canadian Retirement Calculator.

---

## Example 1: Basic Retirement Projection

**Scenario:** 40 years old, planning to retire at 65, with $200K RRSP and $50K TFSA

```
Cell A1: =LIFE_EXPECTANCY_AGE(40, "M", "good", FALSE, "average")
→ Returns: 92

Cell A2: =RETIREMENT_INCOME(40, 65, 92, 200000, 50000, 18000, 6000, 0.06, 0.04, 0.02)
→ Returns: [RRSP at retirement, TFSA, Total, Monthly Income]
```

---

## Example 2: CPP/OAS Planning

**Scenario:** Deciding when to start CPP and OAS

```
=CPP_BENEFIT(65000, 38, 60)   → $XXX (early)
=CPP_BENEFIT(65000, 38, 65)   → $XXX (normal)
=CPP_BENEFIT(65000, 38, 70)   → $XXX (deferred)
```

Compare the cumulative amounts to find your break-even point!

---

## Example 3: Tax-Efficient Withdrawal

**Scenario:** Retired with $400K RRSP, $150K TFSA, need $60K/year

```
=OPTIMAL_WITHDRAWAL_ORDER(400000, 150000, 0, 60000, 25000, "ON")
```

This shows how to minimize taxes while meeting your spending needs.

---

## Example 4: Complete Retirement Plan

Set up a comprehensive model:

1. **INPUTS sheet** with all your parameters
2. **OTHER_INCOME sheet** with:
   - CPP (use `=CPP_BENEFIT()` to calculate)
   - OAS (use `=OAS_BENEFIT()` to calculate)
   - Any pensions (use `=PENSION_INCOME_PROJECTED()`)
3. **Projection sheet** with:
   - `=RETIREMENT_TARGET_SPEND_TABLE()` for year-by-year view
   - `=RRIF_SCHEDULE()` for RRIF minimum tracking
