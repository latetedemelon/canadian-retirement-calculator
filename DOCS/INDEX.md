[← Back to README](../README.md)

# Function Documentation

This documentation provides detailed information about all functions available in the Canadian Retirement Calculator for Google Sheets.

## Documentation Pages

### Core Functions
- **[CORE-FUNCTIONS.md](CORE-FUNCTIONS.md)** - Essential retirement projection functions including `RETIREMENT_INCOME`, `LIFE_EXPECTANCY_AGE`, `PENSION_INCOME_PROJECTED`, and `RETIREMENT_TARGET_SPEND_TABLE`

### Government Benefits
- **[CPP.md](CPP.md)** - Canada Pension Plan functions: `CPP_BENEFIT`, `CPP_BENEFIT_DETAILED`, `CPP_SURVIVOR_BENEFIT`, `CPP_DEATH_BENEFIT`
- **[OAS.md](OAS.md)** - Old Age Security functions: `OAS_BENEFIT`, `OAS_CLAWBACK`, `OAS_BENEFIT_DETAILED`
- **[GIS.md](GIS.md)** - Guaranteed Income Supplement: `GIS_BENEFIT`

### RRIF & Withdrawals
- **[RRIF.md](RRIF.md)** - RRIF mandatory minimum functions: `RRIF_MIN_WITHDRAWAL`, `RRIF_MIN_PERCENTAGE`, `RRIF_SCHEDULE`
- **[WITHDRAWAL-STRATEGIES.md](WITHDRAWAL-STRATEGIES.md)** - Tax-efficient withdrawal ordering: `OPTIMAL_WITHDRAWAL_ORDER`

### Tax Calculations
- **[TAX.md](TAX.md)** - Tax estimation functions: `ESTIMATE_TAX`, `ESTIMATE_TAX_DETAILED`, `MARGINAL_TAX_RATE`
- **[NON-REGISTERED.md](NON-REGISTERED.md)** - Non-registered account functions: `TAXABLE_ACCOUNT_GROWTH`, `CAPITAL_GAINS_TAX`

### Contribution Room
- **[CONTRIBUTION-ROOM.md](CONTRIBUTION-ROOM.md)** - Contribution room tracking: `RRSP_CONTRIBUTION_ROOM`, `TFSA_CONTRIBUTION_ROOM`

### Planning Tools
- **[RETIREMENT-READINESS.md](RETIREMENT-READINESS.md)** - Readiness assessment: `RETIREMENT_SAVINGS_TARGET`, `RETIREMENT_READINESS_SCORE`, `REQUIRED_SAVINGS_RATE`
- **[VALIDATION.md](VALIDATION.md)** - Input validation: `VALIDATE_RETIREMENT_INPUTS`
- **[PENSION-SPLITTING.md](PENSION-SPLITTING.md)** - Pension income splitting: `PENSION_INCOME_SPLIT`
- **[ESTATE-PLANNING.md](ESTATE-PLANNING.md)** - Estate tax planning: `ESTATE_TAX_RRSP`
- **[NET-WORTH.md](NET-WORTH.md)** - Net worth and inflation tools: `NET_WORTH_SUMMARY`, `FUTURE_VALUE_INFLATION`, `PRESENT_VALUE_INFLATION`

### Reference
- **[EXAMPLES.md](EXAMPLES.md)** - Examples and use cases
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common errors and solutions
- **[ACCURACY.md](ACCURACY.md)** - Calculation accuracy reference (exact vs approximations)

---

## Function Quick Reference

### All 45+ Functions At a Glance

#### Core Retirement Projections
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `RETIREMENT_INCOME` | Project RRSP/TFSA monthly income | Exact math, estimated inputs |
| `RETIREMENT_TARGET_SPEND_TABLE` | Year-by-year spending plan | Exact math, estimated inputs |
| `LIFE_EXPECTANCY_AGE` | Planning age based on health | Approximation |
| `PENSION_INCOME_PROJECTED` | DB pension projection | Approximation |

#### Government Benefits
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `CPP_BENEFIT` | Monthly CPP estimate | Approximation |
| `CPP_BENEFIT_DETAILED` | CPP with breakdown | Approximation |
| `CPP_SURVIVOR_BENEFIT` | Survivor pension | Uses CRA rates |
| `CPP_DEATH_BENEFIT` | Lump sum ($2,500) | Exact |
| `OAS_BENEFIT` | Monthly OAS estimate | Approximation |
| `OAS_CLAWBACK` | Recovery tax | Exact (15% rate) |
| `OAS_BENEFIT_DETAILED` | OAS with breakdown | Approximation |
| `GIS_BENEFIT` | Guaranteed Income Supplement | Approximation |

#### RRIF & Withdrawals
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `RRIF_MIN_WITHDRAWAL` | CRA mandatory minimum | Exact |
| `RRIF_MIN_PERCENTAGE` | Minimum % by age | Exact |
| `RRIF_SCHEDULE` | Multi-year RRIF plan | Exact rates, estimated returns |
| `OPTIMAL_WITHDRAWAL_ORDER` | Tax-efficient order | Approximation |

#### Tax Calculations
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `ESTIMATE_TAX` | Federal + provincial tax | Exact brackets |
| `ESTIMATE_TAX_DETAILED` | Tax breakdown | Exact brackets |
| `MARGINAL_TAX_RATE` | Combined marginal rate | Exact |
| `CAPITAL_GAINS_TAX` | Tax on capital gains | Exact (2024 rules) |
| `PENSION_INCOME_SPLIT` | Optimal splitting | Exact tax calc |
| `ESTATE_TAX_RRSP` | Tax at death | Exact brackets |

#### Contribution Room
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `RRSP_CONTRIBUTION_ROOM` | Available RRSP room | Exact formula |
| `TFSA_CONTRIBUTION_ROOM` | Available TFSA room | Exact (historical limits) |

#### Non-Registered Accounts
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `TAXABLE_ACCOUNT_GROWTH` | Growth with tax drag | Exact math |
| `CAPITAL_GAINS_TAX` | Capital gains tax | Exact (50%/66.67% inclusion) |

#### Planning Tools
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `RETIREMENT_SAVINGS_TARGET` | How much you need | Exact formula |
| `RETIREMENT_READINESS_SCORE` | On-track score (0-100%) | Approximation |
| `REQUIRED_SAVINGS_RATE` | Annual savings needed | Exact formula |
| `NET_WORTH_SUMMARY` | Net worth breakdown | Exact math |
| `FUTURE_VALUE_INFLATION` | Inflation projection | Exact formula |
| `PRESENT_VALUE_INFLATION` | Today's dollars | Exact formula |

#### Validation & Helpers
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `VALIDATE_RETIREMENT_INPUTS` | Check inputs | N/A |
| `validateOption_` | Validate options | N/A |
| `clamp_` | Clamp values | N/A |

### Accuracy Legend

- **Exact** = Uses official CRA rates, formulas, or fixed amounts
- **Exact math** = Mathematical formula is precise; accuracy depends on input estimates
- **Approximation** = Simplified model; may differ from actual amounts
- **Uses CRA rates** = Uses some official values but simplified calculation
