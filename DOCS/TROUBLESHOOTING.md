[← Back to Index](INDEX.md)

# Troubleshooting

This page covers common errors and solutions when using the Canadian Retirement Calculator.

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `#NAME?` | Function not recognized | Reload sheet after saving script |
| `ERROR: retirementAge < currentAge` | Invalid age inputs | Check your age parameters |
| `ERROR: Province not supported` | Invalid province code | Use: ON, BC, AB, QC, SK, MB, NS, NB, PE, NL, YT, NT, NU |
| `ERROR: startAge must be between 60 and 70` | Invalid CPP start age | CPP can only start between 60-70 |
| Authorization error | Script not authorized | Follow authorization steps in Installation section |

---

## Tips

1. **All amounts are in real (today's) dollars** – The calculator adjusts for inflation automatically

2. **Returns are entered as decimals** – Use 0.06 for 6%, not 6

3. **Use cell references** – Instead of hardcoding values, reference the INPUTS sheet

4. **Refresh calculations** – If values seem stale, press Ctrl+Shift+E to recalculate

5. **Check the OTHER_INCOME sheet** – Many functions read from this sheet automatically
