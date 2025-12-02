[← Back to Index](INDEX.md)

# Troubleshooting

Common errors and solutions for the Canadian Retirement Calculator.

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

---

## Function Not Found (#NAME? Error)

If you see `#NAME?` when using a function:

1. **Check the script is saved**
   - Open Extensions → Apps Script
   - Ensure code is present
   - Click Save (💾)

2. **Reload the spreadsheet**
   - Close the browser tab
   - Reopen the spreadsheet
   - Or press Ctrl+Shift+E

3. **Check function spelling**
   - Functions are case-insensitive
   - But check for typos

---

## Authorization Issues

If the script won't authorize:

1. **Clear browser cache**
   - Try incognito/private mode
   
2. **Check Google account**
   - Ensure you're signed in
   - Try a different browser

3. **Re-authorize**
   - Extensions → Apps Script
   - Run any function manually
   - Complete authorization flow

---

## Calculation Not Updating

If values don't update when inputs change:

1. **Force recalculation**
   - Press Ctrl+Shift+E (Windows)
   - Press Cmd+Shift+E (Mac)

2. **Check circular references**
   - File → Spreadsheet settings → Calculation
   - Ensure "Iterative calculation" settings are appropriate

3. **Refresh the page**
   - Sometimes a full refresh is needed

---

## Province Code Errors

Valid province/territory codes (case-insensitive):

| Code | Province/Territory |
|------|-------------------|
| ON | Ontario |
| BC | British Columbia |
| AB | Alberta |
| QC | Quebec |
| SK | Saskatchewan |
| MB | Manitoba |
| NS | Nova Scotia |
| NB | New Brunswick |
| PE | Prince Edward Island |
| NL | Newfoundland & Labrador |
| YT | Yukon |
| NT | Northwest Territories |
| NU | Nunavut |

---

## Performance Issues

If the spreadsheet is slow:

1. **Reduce volatile functions**
   - Avoid functions that recalculate on every change
   
2. **Limit projection years**
   - Shorter projection periods calculate faster

3. **Split into multiple sheets**
   - Move complex calculations to separate sheets

---

## Getting Help

If you encounter issues not covered here:

1. **Check the function documentation**
   - Review parameter requirements
   - Ensure correct data types

2. **Validate inputs first**
   - Use `=VALIDATE_RETIREMENT_INPUTS()` to check basic inputs

3. **Test with simple values**
   - Try the function with simple, known values
   - Compare results to examples in documentation

4. **Check for updates**
   - Ensure you have the latest version of the script
