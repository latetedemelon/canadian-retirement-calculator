[← Back to Index](INDEX.md)

# Estate Planning

Functions for estate tax planning.

---

## ESTATE_TAX_RRSP

Calculates taxes owing when RRSP/RRIF is collapsed upon death.

```
=ESTATE_TAX_RRSP(rrspBalance, otherIncomeInYear, province, hasSpouse)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| rrspBalance | number | RRSP/RRIF balance at death |
| otherIncomeInYear | number | Other income in year of death |
| province | string | Two-letter province code |
| hasSpouse | boolean | TRUE if spouse/common-law partner survives |

**Key Rules:**
- **Transfer to spouse:** Tax-free rollover to spouse's RRSP/RRIF
- **No spouse:** Full balance taxed as income in final return

**Example:**
```
=ESTATE_TAX_RRSP(500000, 30000, "ON", FALSE)
→ Shows ~$220,000 tax (44% effective rate on large balance)
```

**Returns:** Table showing:
- Total income in final return
- Federal tax
- Provincial tax
- Total tax owing
- Effective tax rate
- Net to estate

**Important Notes:**

### Spouse Rollover
When there is a surviving spouse or common-law partner:
- RRSP/RRIF can roll to their registered account
- No immediate tax is payable
- Tax deferred until spouse withdraws

### No Spouse Scenarios
The entire RRSP/RRIF balance is:
1. Added to income in the final tax return
2. Taxed at applicable marginal rates
3. Can result in very high effective rates

### Planning Strategies

**Gradual Drawdown:**
- Withdraw more during lifetime to reduce balance
- Fill lower tax brackets each year
- Consider converting to RRIF early

**Life Insurance:**
- Purchase insurance to cover expected tax
- Provides liquidity for estate

**Charitable Giving:**
- Donate from RRSP to registered charity
- Receive tax credit to offset inclusion

**Qualified Beneficiaries:**
Special rules for:
- Financially dependent children/grandchildren
- Infirm dependants

### Example Tax Impact

| RRSP Balance | Other Income | Province | Approximate Tax | Effective Rate |
|--------------|--------------|----------|-----------------|----------------|
| $200,000 | $30,000 | ON | ~$75,000 | ~33% |
| $500,000 | $30,000 | ON | ~$220,000 | ~41% |
| $1,000,000 | $30,000 | ON | ~$480,000 | ~47% |
