[← Back to Index](INDEX.md)

# Tax Estimation

Functions for calculating federal and provincial income taxes.

---

## ESTIMATE_TAX

Calculates combined federal + provincial income tax.

```
=ESTIMATE_TAX(taxableIncome, province)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| taxableIncome | number | Annual taxable income |
| province | string | Two-letter province code |

**Supported Provinces:**
- ON (Ontario), BC (British Columbia), AB (Alberta)
- QC (Quebec), SK (Saskatchewan), MB (Manitoba)
- NS (Nova Scotia), NB (New Brunswick), PE (PEI)
- NL (Newfoundland), YT (Yukon), NT (NWT), NU (Nunavut)

**Examples:**
```
=ESTIMATE_TAX(80000, "ON")   → ~$17,500
=ESTIMATE_TAX(80000, "AB")   → ~$16,300 (lower provincial rates)
=ESTIMATE_TAX(80000, "QC")   → ~$19,200 (higher provincial rates)
```

**Note:** These calculations use 2024 tax brackets and basic personal amounts. Actual taxes may differ based on:
- Tax credits (age, pension, disability, etc.)
- Deductions (medical, charitable, etc.)
- Provincial-specific credits

---

## ESTIMATE_TAX_DETAILED

Returns complete tax breakdown.

```
=ESTIMATE_TAX_DETAILED(taxableIncome, province)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| taxableIncome | number | Annual taxable income |
| province | string | Two-letter province code |

**Returns:** Table showing:
- Federal Tax (Gross)
- Federal Tax (Net after credits)
- Provincial Tax (Gross)
- Provincial Tax (Net after credits)
- Basic Credits Applied
- Effective Rate
- Marginal Rate

---

## MARGINAL_TAX_RATE

Returns combined marginal tax rate.

```
=MARGINAL_TAX_RATE(taxableIncome, province)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| taxableIncome | number | Annual taxable income |
| province | string | Two-letter province code |

**Returns:** Combined federal + provincial marginal rate as decimal (e.g., 0.3148)

**Example:**
```
=MARGINAL_TAX_RATE(80000, "ON")  → 0.3148 (31.48%)
```

**Use Cases:**
- Calculating tax on additional income
- RRSP contribution benefit analysis
- Pension income splitting calculations
- Capital gains tax estimation
