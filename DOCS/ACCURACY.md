[← Back to Index](INDEX.md)

# Calculation Accuracy Reference

This section clearly identifies which calculations use **exact CRA rules** versus **approximations**. Understanding this helps you know when to cross-reference with official sources.

---

## ✅ Exact Calculations (Using Official CRA Rules)

These functions use **actual CRA formulas, rates, and thresholds** as published:

| Function | Basis | Source |
|----------|-------|--------|
| `RRIF_MIN_WITHDRAWAL` | CRA prescribed factors for ages 71-95+ | Income Tax Regulations |
| `RRIF_MIN_PERCENTAGE` | Exact CRA minimum percentages | Income Tax Regulations |
| `OAS_CLAWBACK` | 15% recovery rate, $86,912 threshold (2024) | Service Canada |
| `ESTIMATE_TAX` | 2024 federal + all 13 provincial/territorial brackets | CRA Tax Tables |
| `MARGINAL_TAX_RATE` | Exact bracket rates from CRA | CRA Tax Tables |
| `CAPITAL_GAINS_TAX` | 50% inclusion (≤$250k), 66.67% (>$250k) | 2024 Budget |
| `CPP_DEATH_BENEFIT` | Fixed $2,500 lump sum | Service Canada |
| `TFSA_CONTRIBUTION_ROOM` | Historical annual limits 2009-2025 | CRA |
| `RRSP_CONTRIBUTION_ROOM` | 18% rule, annual limits 2021-2025 | CRA |

---

## ⚠️ Approximations (Simplified Models)

These functions use **simplified formulas** that provide reasonable estimates but may differ from actual amounts:

| Function | What's Approximated | Why |
|----------|---------------------|-----|
| `CPP_BENEFIT` | Uses average earnings × years ratio | Actual CPP uses complex YMPE history and dropout provisions |
| `OAS_BENEFIT` | Based on years of residence only | Doesn't account for international agreements or partial years |
| `GIS_BENEFIT` | Simplified income test | Actual GIS has complex spouse income calculations |
| `LIFE_EXPECTANCY_AGE` | Heuristic adjustments | Based on general health factors, not actuarial tables |
| `PENSION_INCOME_PROJECTED` | Average of final years | Doesn't account for plan-specific rules |
| `RETIREMENT_READINESS_SCORE` | Percentage-based scoring | Subjective interpretation of "readiness" |
| `OPTIMAL_WITHDRAWAL_ORDER` | Fills brackets sequentially | Doesn't optimize across multiple years |

---

## 📊 Hybrid Calculations (Exact Formula, Estimated Inputs)

These use **exact formulas** but results depend on your input estimates:

| Function | Exact Part | Your Estimate |
|----------|------------|---------------|
| `RETIREMENT_INCOME` | Annuity math | Future returns, inflation |
| `RETIREMENT_TARGET_SPEND_TABLE` | Withdrawal calculations | Returns, spending needs |
| `RETIREMENT_SAVINGS_TARGET` | Present value formula | Future income, returns |
| `TAXABLE_ACCOUNT_GROWTH` | Capital gains math | Returns, turnover rate |
| `ESTATE_TAX_RRSP` | Tax bracket application | Other income in year of death |
| `PENSION_INCOME_SPLIT` | Tax optimization | Income levels |
| `NET_WORTH_SUMMARY` | After-tax calculations | Marginal rate assumption |

---

## Key Accuracy Notes

1. **CPP Benefits**: For the most accurate CPP estimate, use your [My Service Canada Account](https://www.canada.ca/en/employment-social-development/services/my-account.html) statement.

2. **OAS Benefits**: Actual OAS depends on residence history. See [Service Canada OAS estimator](https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html).

3. **Tax Estimates**: These use basic bracket math. Actual taxes depend on:
   - Tax credits (age, pension, disability, etc.)
   - Deductions (medical, charitable, etc.)
   - Provincial-specific credits

4. **GIS**: Eligibility requires OAS receipt. For accurate amounts, see [Service Canada GIS tables](https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html).

5. **All Projections**: Future projections (10+ years) have increasing uncertainty. Consider running scenarios with different assumptions.

---

## Accuracy Legend

- **Exact** = Uses official CRA rates, formulas, or fixed amounts
- **Exact math** = Mathematical formula is precise; accuracy depends on input estimates
- **Approximation** = Simplified model; may differ from actual amounts
- **Uses CRA rates** = Uses some official values but simplified calculation
