[← Back to Index](INDEX.md)

# RRIF Calculator

This page documents the Registered Retirement Income Fund (RRIF) calculation functions.

---

## RRIF_MIN_WITHDRAWAL

Calculates mandatory minimum RRIF withdrawal.

```
=RRIF_MIN_WITHDRAWAL(age, rrifBalance)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| age | number | Age at start of year |
| rrifBalance | number | RRIF balance at January 1 |

### Returns

Minimum annual withdrawal required

### Examples

```
=RRIF_MIN_WITHDRAWAL(72, 500000)  → $27,000 (5.40%)
=RRIF_MIN_WITHDRAWAL(80, 500000)  → $34,100 (6.82%)
=RRIF_MIN_WITHDRAWAL(90, 500000)  → $59,600 (11.92%)
```

---

## RRIF_MIN_PERCENTAGE

Returns the CRA-prescribed minimum percentage for a given age.

```
=RRIF_MIN_PERCENTAGE(age)
```

### Key Percentages

| Age | Minimum % |
|-----|-----------|
| 71 | 5.28% |
| 75 | 5.82% |
| 80 | 6.82% |
| 85 | 8.51% |
| 90 | 11.92% |
| 95+ | 20.00% |

---

## RRIF_SCHEDULE

Projects RRIF withdrawals over multiple years.

```
=RRIF_SCHEDULE(startAge, endAge, initialBalance, nominalReturn, inflationRate)
```

### Returns

Year-by-year table with Min %, Min Withdrawal, Year-End Balance
