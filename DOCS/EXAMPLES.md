[← Back to Index](INDEX.md)

# Examples & Use Cases

This page provides practical examples of using the Canadian Retirement Calculator functions.

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

**Break-even Analysis:**
- Early start (60) vs normal (65): Break-even around age 74
- Normal (65) vs late (70): Break-even around age 82

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

---

## Example 5: Readiness Check

**Scenario:** Am I on track for retirement?

```
Step 1: Calculate your target
=RETIREMENT_SAVINGS_TARGET(60000, 65, 90, 25000, 0.02)
→ ~$700,000 needed

Step 2: Check your readiness
=RETIREMENT_READINESS_SCORE(40, 65, 90, 250000, 24000, 60000, 25000, 0.04, 0.02)
→ Shows score and gap analysis

Step 3: If needed, find required savings
=REQUIRED_SAVINGS_RATE(40, 65, 250000, 700000, 0.04)
→ Annual savings needed to reach goal
```

---

## Example 6: Pension Income Splitting

**Scenario:** Couple with income disparity wanting to minimize taxes

```
=PENSION_INCOME_SPLIT(80000, 20000, 40000, "ON")
→ Optimal split and potential savings
```

---

## Example 7: Estate Planning

**Scenario:** Estimating taxes on RRSP at death

```
=ESTATE_TAX_RRSP(500000, 30000, "ON", FALSE)
→ Tax estimate for estate planning
```

---

## Example 8: Full Year-by-Year Projection

**Scenario:** Complete retirement projection with annual details

```
=RETIREMENT_TARGET_SPEND_TABLE(40, 65, 90, 200000, 50000, 18000, 6000, 0.06, 0.04, 0.02, 60000)
```

This creates a comprehensive table showing:
- Every year from current age to planning age
- Beginning and ending balances
- Withdrawals needed
- Any shortfalls

---

## Example 9: RRIF Minimum Planning

**Scenario:** Understanding mandatory withdrawals

```
=RRIF_SCHEDULE(71, 95, 500000, 0.04, 0.02)
```

Shows year-by-year:
- Minimum percentages
- Minimum withdrawal amounts
- Remaining balance

---

## Example 10: Contribution Room Check

**Scenario:** How much room do I have?

```
RRSP:
=RRSP_CONTRIBUTION_ROOM(100000, 45000, 5000, 2024)
→ Available RRSP room

TFSA:
=TFSA_CONTRIBUTION_ROOM(1985, 2024, 60000)
→ Available TFSA room
```
