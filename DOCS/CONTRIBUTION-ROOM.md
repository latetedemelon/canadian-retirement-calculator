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
