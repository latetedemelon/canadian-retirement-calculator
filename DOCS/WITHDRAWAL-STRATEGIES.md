[← Back to Index](INDEX.md)

# Withdrawal Strategies

Functions for tax-efficient retirement withdrawals.

---

## OPTIMAL_WITHDRAWAL_ORDER

Suggests tax-efficient withdrawal order across accounts.

```
=OPTIMAL_WITHDRAWAL_ORDER(rrspBalance, tfsaBalance, nonRegBalance, 
                          withdrawalNeeded, otherIncome, province)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| rrspBalance | number | Current RRSP/RRIF balance |
| tfsaBalance | number | Current TFSA balance |
| nonRegBalance | number | Current non-registered balance |
| withdrawalNeeded | number | Annual withdrawal needed |
| otherIncome | number | Other taxable income (CPP, OAS, pension) |
| province | string | Two-letter province code |

**Returns:** Table with:
- Recommended withdrawal from each account type
- Tax impact of the strategy
- Comparison to naive withdrawal approach

**Strategy Applied:**
1. Fill lower tax brackets with RRSP first
2. Use non-registered next (favorable capital gains treatment)
3. Preserve TFSA for later (tax-free)

**Example:**
```
=OPTIMAL_WITHDRAWAL_ORDER(500000, 100000, 200000, 50000, 30000, "ON")
```

**Key Considerations:**

### Why RRSP First (Often)
- Fills lower tax brackets
- Reduces OAS clawback risk
- Avoids large taxable estate on death

### When to Use Non-Registered
- Capital gains have preferential treatment
- Can realize gains strategically
- Use capital losses to offset

### Why Preserve TFSA
- Tax-free growth continues
- Withdrawals don't affect OAS clawback
- Most flexible for emergencies
- Can be passed to spouse tax-free

### RRIF Minimum Considerations
- Must withdraw minimum from RRIF
- Strategy accounts for mandatory minimums
- Consider spouse's age for lower minimums
