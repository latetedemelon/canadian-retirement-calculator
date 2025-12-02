[← Back to Index](INDEX.md)

# GIS Calculator

This page documents the Guaranteed Income Supplement (GIS) calculation function.

---

## GIS_BENEFIT

Calculates Guaranteed Income Supplement for low-income seniors.

```
=GIS_BENEFIT(annualIncome, maritalStatus, [spouseOAS])
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| annualIncome | number | Annual income (excluding OAS) |
| maritalStatus | string | "single" or "married" |
| spouseOAS | boolean | Does spouse receive OAS? |

### Key Rules

- Must be receiving OAS
- Income-tested (reduces as income increases)
- 2024 maximum: ~$1,065/month (single)

### Example

```
=GIS_BENEFIT(12000, "single")  → ~$565/month
```
