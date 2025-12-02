[← Back to Index](INDEX.md)

# Withdrawal Strategies

This page documents the withdrawal strategy optimization function.

---

## OPTIMAL_WITHDRAWAL_ORDER

Suggests tax-efficient withdrawal order across accounts.

```
=OPTIMAL_WITHDRAWAL_ORDER(rrspBalance, tfsaBalance, nonRegBalance, 
                          withdrawalNeeded, otherIncome, province)
```

### Returns

Table with recommended withdrawal from each account type and tax impact

### Strategy Applied

1. Fill lower tax brackets with RRSP first
2. Use non-registered next (favorable capital gains treatment)
3. Preserve TFSA for later (tax-free)

### Example

```
=OPTIMAL_WITHDRAWAL_ORDER(500000, 100000, 200000, 50000, 30000, "ON")
```
