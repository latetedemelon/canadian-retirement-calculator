[← Back to Index](INDEX.md)

# Estate Planning

This page documents the estate tax planning function.

---

## ESTATE_TAX_RRSP

Calculates taxes owing when RRSP/RRIF is collapsed upon death.

```
=ESTATE_TAX_RRSP(rrspBalance, otherIncomeInYear, province, hasSpouse)
```

### Key Rules

- Transfer to spouse: Tax-free rollover
- No spouse: Full balance taxed as income in final return

### Example

```
=ESTATE_TAX_RRSP(500000, 30000, "ON", FALSE)
→ Shows ~$220,000 tax (44% effective rate on large balance)
```
