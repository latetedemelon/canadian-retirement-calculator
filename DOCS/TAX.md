[← Back to Index](INDEX.md)

# Tax Estimation

This page documents the tax estimation functions.

---

## ESTIMATE_TAX

Calculates combined federal + provincial income tax.

```
=ESTIMATE_TAX(taxableIncome, province)
```

### Supported Provinces

- ON (Ontario), BC (British Columbia), AB (Alberta)
- QC (Quebec), SK (Saskatchewan), MB (Manitoba)
- NS (Nova Scotia), NB (New Brunswick), PE (PEI)
- NL (Newfoundland), YT (Yukon), NT (NWT), NU (Nunavut)

### Examples

```
=ESTIMATE_TAX(80000, "ON")   → ~$17,500
=ESTIMATE_TAX(80000, "AB")   → ~$16,300 (lower provincial rates)
=ESTIMATE_TAX(80000, "QC")   → ~$19,200 (higher provincial rates)
```

---

## ESTIMATE_TAX_DETAILED

Returns complete tax breakdown.

```
=ESTIMATE_TAX_DETAILED(taxableIncome, province)
```

### Returns

Table showing:
- Federal Tax (Gross/Net)
- Provincial Tax (Gross/Net)
- Basic Credits Applied
- Effective Rate
- Marginal Rate

---

## MARGINAL_TAX_RATE

Returns combined marginal tax rate.

```
=MARGINAL_TAX_RATE(taxableIncome, province)
```

### Example

```
=MARGINAL_TAX_RATE(80000, "ON")  → 0.3148 (31.48%)
```
