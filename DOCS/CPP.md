[← Back to Index](INDEX.md)

# CPP Calculator

Functions for calculating Canada Pension Plan benefits.

---

## CPP_BENEFIT

Calculates estimated monthly CPP retirement benefit.

```
=CPP_BENEFIT(averageEarnings, contributionYears, startAge, [currentYear])
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| averageEarnings | number | Average annual pensionable earnings |
| contributionYears | number | Years with CPP contributions |
| startAge | number | Age to start CPP (60-70) |
| currentYear | number | Optional: Year for YMPE reference (default 2024) |

**Returns:** Estimated monthly CPP benefit

**Key Rules Applied:**
- Early start (60-64): Reduced by 0.6% per month (7.2% per year)
- Normal age: 65
- Late start (66-70): Increased by 0.7% per month (8.4% per year)
- Maximum 39 years of contributions counted

**Examples:**
```
=CPP_BENEFIT(60000, 35, 65)     → ~$953/month (at 65 with 35 years)
=CPP_BENEFIT(60000, 35, 60)     → ~$610/month (early at 60, 36% reduction)
=CPP_BENEFIT(60000, 35, 70)     → ~$1,354/month (late at 70, 42% increase)
```

---

## CPP_BENEFIT_DETAILED

Returns a detailed breakdown of CPP benefit calculation.

```
=CPP_BENEFIT_DETAILED(averageEarnings, contributionYears, startAge)
```

**Returns:** Table showing:
- Monthly Benefit
- Annual Benefit  
- Start Age
- Adjustment Factor
- Maximum at that age
- % of Maximum
- Contribution Years Used

---

## CPP_SURVIVOR_BENEFIT

Calculates CPP survivor pension for a surviving spouse.

```
=CPP_SURVIVOR_BENEFIT(deceasedCPP, survivorAge, survivorReceivesCPP, survivorCPP)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| deceasedCPP | number | Deceased's monthly CPP amount |
| survivorAge | number | Age of the surviving spouse |
| survivorReceivesCPP | boolean | Is survivor already receiving their own CPP? |
| survivorCPP | number | Survivor's own CPP amount (if receiving) |

**Key Rules:**
- Under 65: Flat rate (~$218) + 37.5% of deceased's pension
- 65 and over: 60% of deceased's pension
- Combined with own CPP cannot exceed maximum

**Examples:**
```
=CPP_SURVIVOR_BENEFIT(1000, 55, FALSE, 0)  → ~$593/month
=CPP_SURVIVOR_BENEFIT(1000, 68, TRUE, 800) → ~$564/month (capped)
```

---

## CPP_DEATH_BENEFIT

Returns the CPP lump-sum death benefit.

```
=CPP_DEATH_BENEFIT()
```

**Returns:** $2,500 (fixed amount)

This is a one-time payment made to the estate or eligible survivor of a deceased CPP contributor.
