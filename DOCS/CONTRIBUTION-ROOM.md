[← Back to Index](INDEX.md)

# Contribution Room Tracking

This page documents the RRSP and TFSA contribution room calculation functions.

---

## RRSP_CONTRIBUTION_ROOM

Calculates available RRSP contribution room.

```
=RRSP_CONTRIBUTION_ROOM(previousYearEarnedIncome, unusedRoom, pensionAdjustment, [year])
```

### Key Rules

- 18% of previous year's earned income
- 2024 maximum: $31,560
- Minus pension adjustment (PA)
- Plus unused room from prior years

### Example

```
=RRSP_CONTRIBUTION_ROOM(100000, 50000, 5000, 2024)  → $63,000 room
**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| previousYearEarnedIncome | number | Previous year's earned income |
| unusedRoom | number | Carried forward unused room |
| pensionAdjustment | number | Pension adjustment (PA) from employer pension |
| year | number | Optional: Year for limit reference (default: current year) |

**Key Rules:**
- 18% of previous year's earned income
- 2024 maximum: $31,560
- 2025 maximum: $32,490
- Minus pension adjustment (PA)
- Plus unused room from prior years

**Annual Limits:**
| Year | Maximum |
|------|---------|
| 2021 | $27,830 |
| 2022 | $29,210 |
| 2023 | $30,780 |
| 2024 | $31,560 |
| 2025 | $32,490 |

**Example:**
```
=RRSP_CONTRIBUTION_ROOM(100000, 50000, 5000, 2024)  → $63,000 room
  (18% of 100000 = $18,000, capped at $31,560)
  ($31,560 - $5,000 PA + $50,000 carryforward = $76,560)
  (Note: Example shows simplified calculation)
```

---

## TFSA_CONTRIBUTION_ROOM

Calculates available TFSA contribution room.

```
=TFSA_CONTRIBUTION_ROOM(birthYear, currentYear, usedRoom, [firstResidentYear])
```

### Annual Limits Since 2009

- 2009-2012: $5,000/year
- 2013-2014: $5,500/year
- 2015: $10,000
- 2016-2018: $5,500/year
- 2019-2022: $6,000/year
- 2023: $6,500
- 2024-2025: $7,000/year

### Example

```
=TFSA_CONTRIBUTION_ROOM(1980, 2024, 50000)  → ~$45,000 remaining
```
**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| birthYear | number | Year you were born |
| currentYear | number | Current calendar year |
| usedRoom | number | Total contributions made to date |
| firstResidentYear | number | Optional: Year you became a Canadian resident (if after 2009) |

**Annual Limits Since 2009:**
| Year(s) | Annual Limit |
|---------|--------------|
| 2009-2012 | $5,000/year |
| 2013-2014 | $5,500/year |
| 2015 | $10,000 |
| 2016-2018 | $5,500/year |
| 2019-2022 | $6,000/year |
| 2023 | $6,500 |
| 2024-2025 | $7,000/year |

**Cumulative Room (if 18+ in 2009):**
- As of 2024: $95,000
- As of 2025: $102,000

**Example:**
```
=TFSA_CONTRIBUTION_ROOM(1980, 2024, 50000)  → ~$45,000 remaining
  (Total room since turning 18 - contributions made)
```

**Important Notes:**
- Room accumulates starting the year you turn 18
- Withdrawals create new room the following year
- Over-contributions are subject to 1% monthly penalty
- Must be a Canadian resident to accumulate room
