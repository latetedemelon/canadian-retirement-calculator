/**
 * canadian-retirement-calculator – Google Sheets Apps Script core
 *
 * This file is intended to live both:
 *  - In your Google Sheet as `Code.gs`
 *  - In GitHub at e.g. google-sheets/Code.gs in
 *    https://github.com/latetedemelon/canadian-retirement-calculator
 *
 * All calculations are done in REAL terms (after inflation), so
 * amounts are expressed in today's dollars.
 *
 * License: MIT (match repository license)
 */


/**
 * ----------------------------------------------------------------------
 * SECTION 1 – Core helpers
 * ----------------------------------------------------------------------
 */

/**
 * Convert a nominal annual return to a real (after-inflation) return.
 *
 * @param {number} nominal Annual nominal rate (e.g. 0.06 for 6%)
 * @param {number} infl    Annual inflation rate (e.g. 0.02 for 2%)
 * @return {number} Real annual rate.
 */
function realReturn_(nominal, infl) {
  nominal = Number(nominal);
  infl    = Number(infl);
  if (Math.abs(1 + infl) < 1e-8) return nominal;
  return (1 + nominal) / (1 + infl) - 1;
}

/**
 * Future value with annual contributions at end of year, all in REAL terms.
 *
 * @param {number} pv    Present value
 * @param {number} pmt   Contribution each year
 * @param {number} r     Real annual rate
 * @param {number} n     Number of years
 * @return {number} Future value
 */
function futureValueReal_(pv, pmt, r, n) {
  pv  = Number(pv);
  pmt = Number(pmt);
  r   = Number(r);
  n   = Number(n);

  if (n <= 0) return pv;
  if (Math.abs(r) < 1e-8) {
    return pv + pmt * n;
  }
  var factor = Math.pow(1 + r, n);
  return pv * factor + pmt * (factor - 1) / r;
}

/**
 * Standard annuity-immediate level payment, given PV, rate, and number of periods.
 *
 * @param {number} pv      Present value
 * @param {number} r       Period rate
 * @param {number} periods Number of periods
 * @return {number} Level payment per period
 */
function annuityPayment_(pv, r, periods) {
  pv      = Number(pv);
  r       = Number(r);
  periods = Number(periods);

  if (periods <= 0 || pv <= 0) return 0;
  if (Math.abs(r) < 1e-8) return pv / periods;
  return pv * (r / (1 - Math.pow(1 + r, -periods)));
}

/**
 * Helper to coerce a boolean-like value from a sheet (TRUE / FALSE / "Y"/"N").
 *
 * @param {*} v
 * @return {boolean}
 */
function asBool_(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    var s = v.trim().toLowerCase();
    return (s === 'true' || s === 't' || s === 'yes' || s === 'y' || s === '1');
  }
  if (typeof v === 'number') return v !== 0;
  return false;
}

/**
 * Validate that a value is one of the allowed options (case-insensitive).
 *
 * @param {string} value       The value to validate
 * @param {Array} allowedList  Array of allowed string values
 * @param {string} paramName   Name of the parameter for error message
 * @return {string} The validated value in lowercase, or throws error
 */
function validateOption_(value, allowedList, paramName) {
  var v = (value || "").toString().trim().toLowerCase();
  // Pre-process allowed list to lowercase for efficient comparison
  var allowedLower = [];
  for (var i = 0; i < allowedList.length; i++) {
    allowedLower.push(allowedList[i].toLowerCase());
  }
  for (var j = 0; j < allowedLower.length; j++) {
    if (v === allowedLower[j]) {
      return v;
    }
  }
  throw new Error(paramName + " must be one of: " + allowedList.join(", ") + ". Got: " + value);
}

/**
 * Clamp a number to a min/max range.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function clamp_(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * ----------------------------------------------------------------------
 * SECTION 2 – Your original RRSP/TFSA retirement income calculator
 * (kept intact to avoid breaking existing sheets)
 * ----------------------------------------------------------------------
 */

/**
 * Estimate RRSP & TFSA at retirement and level monthly income until death.
 *
 * All returns are treated in REAL terms (after inflation) so outputs
 * are in today's dollars.
 *
 * @param {number} currentAge                Your current age (years)
 * @param {number} retirementAge             Age when you retire (years)
 * @param {number} lifeExpectancyAge         Age you want to plan income until (death age)
 * @param {number} rrspBalanceNow            Current RRSP balance
 * @param {number} tfsaBalanceNow            Current TFSA balance
 * @param {number} annualRrspContribution    Annual RRSP contribution (today's dollars)
 * @param {number} annualTfsaContribution    Annual TFSA contribution (today's dollars)
 * @param {number} preRetNominalReturn       Expected nominal return before retirement (e.g. 0.06 for 6%)
 * @param {number} postRetNominalReturn      Expected nominal return after retirement (e.g. 0.04 for 4%)
 * @param {number} inflationRate             Expected inflation rate (e.g. 0.02 for 2%)
 *
 * @return [[rrspAtRet, tfsaAtRet, totalAtRet, monthlyIncome]]
 *         rrspAtRet      – RRSP at retirement (real, today's dollars)
 *         tfsaAtRet      – TFSA at retirement (real, today's dollars)
 *         totalAtRet     – Total at retirement (real, today's dollars)
 *         monthlyIncome  – Level monthly income from retirement to death (real, today's dollars)
 *
 * Usage example in a cell:
 * =RETIREMENT_INCOME(40, 65, 90, 200000, 50000, 18000, 6000, 0.06, 0.04, 0.02)
 */
function RETIREMENT_INCOME(
  currentAge,
  retirementAge,
  lifeExpectancyAge,
  rrspBalanceNow,
  tfsaBalanceNow,
  annualRrspContribution,
  annualTfsaContribution,
  preRetNominalReturn,
  postRetNominalReturn,
  inflationRate
) {
  // Convert all to numbers
  currentAge             = Number(currentAge);
  retirementAge          = Number(retirementAge);
  lifeExpectancyAge      = Number(lifeExpectancyAge);
  rrspBalanceNow         = Number(rrspBalanceNow);
  tfsaBalanceNow         = Number(tfsaBalanceNow);
  annualRrspContribution = Number(annualRrspContribution);
  annualTfsaContribution = Number(annualTfsaContribution);
  preRetNominalReturn    = Number(preRetNominalReturn);
  postRetNominalReturn   = Number(postRetNominalReturn);
  inflationRate          = Number(inflationRate);

  var yearsToRet  = retirementAge - currentAge;
  var yearsInRet  = lifeExpectancyAge - retirementAge;

  if (yearsToRet < 0 || yearsInRet <= 0) {
    return [["ERROR: Check ages (retirement < current or life expectancy ≤ retirement)."]];
  }

  var preReal  = realReturn_(preRetNominalReturn,  inflationRate);
  var postReal = realReturn_(postRetNominalReturn, inflationRate);

  var rrspAtRet = futureValueReal_(rrspBalanceNow, annualRrspContribution, preReal, yearsToRet);
  var tfsaAtRet = futureValueReal_(tfsaBalanceNow, annualTfsaContribution, preReal, yearsToRet);
  var totalAtRet = rrspAtRet + tfsaAtRet;

  var months = yearsInRet * 12;
  var monthlyIncome;

  if (months <= 0 || totalAtRet <= 0) {
    monthlyIncome = 0;
  } else {
    var monthlyRate = Math.pow(1 + postReal, 1 / 12) - 1;
    if (Math.abs(monthlyRate) < 1e-8) {
      monthlyIncome = totalAtRet / months;
    } else {
      monthlyIncome = annuityPayment_(totalAtRet, monthlyRate, months);
    }
  }

  return [[rrspAtRet, tfsaAtRet, totalAtRet, monthlyIncome]];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 3 – Life expectancy planning age
 * ----------------------------------------------------------------------
 */

/**
 * LIFE_EXPECTANCY_AGE
 *
 * Simple heuristic for a planning age to use in retirement projections.
 * This is deliberately conservative (tends to overshoot a bit) so that
 * you are less likely to run out of money.
 *
 * @param {number} currentAge  Current age
 * @param {string} sex         "M", "F", or other (case-insensitive)
 * @param {string} health      "excellent","good","average","poor"
 * @param {boolean|string} smoker   TRUE if smoker
 * @param {string} familyLongevity  "long","average","short"
 * @return {number} suggested planning age (death age)
 *
 * Example:
 * =LIFE_EXPECTANCY_AGE(40,"M","good",FALSE,"long")
 */
function LIFE_EXPECTANCY_AGE(currentAge, sex, health, smoker, familyLongevity) {
  currentAge       = Number(currentAge);
  sex              = (sex || "").toString().trim().toUpperCase();
  health           = (health || "").toString().trim().toLowerCase();
  familyLongevity  = (familyLongevity || "").toString().trim().toLowerCase();
  var isSmoker     = asBool_(smoker);

  // Baseline planning age by sex (rough, intentionally conservative)
  var base;
  if (sex === "F") {
    base = 93;
  } else if (sex === "M") {
    base = 91;
  } else {
    base = 92;
  }

  // Health adjustment
  if (health === "excellent") {
    base += 3;
  } else if (health === "good") {
    base += 1;
  } else if (health === "poor") {
    base -= 3;
  }

  // Smoking penalty
  if (isSmoker) {
    base -= 5;
  }

  // Family longevity
  if (familyLongevity === "long") {
    base += 2;
  } else if (familyLongevity === "short") {
    base -= 2;
  }

  // Ensure we don't pick something below, say, 80 or below current age + 10
  var minPlanningAge = Math.max(80, currentAge + 10);
  if (base < minPlanningAge) base = minPlanningAge;

  return base;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 4 – Defined Benefit pension projection
 * ----------------------------------------------------------------------
 */

/**
 * PENSION_INCOME_PROJECTED
 *
 * Projects a defined-benefit (DB) pension at retirement using a typical
 * formula:
 *
 *   Annual Pension = accrualRate * YearsOfServiceAtRet * FinalAverageEarnings
 *
 * FinalAverageEarnings is computed as the average of the last N years of
 * (real) salary before retirement, with salary assumed to grow at a given
 * real rate.
 *
 * All figures are in REAL (today's) dollars.
 *
 * @param {number} currentAge          Current age
 * @param {number} retirementAge       Planned retirement age
 * @param {number} currentSalary       Current annual salary (today's dollars)
 * @param {number} realSalaryGrowth    Expected real salary growth (e.g. 0.01 = 1% above inflation)
 * @param {number} yearsServiceNow     Credited service already earned (years)
 * @param {number} accrualRate         Accrual per year of service (e.g. 0.02 = 2%)
 * @param {number} maxServiceYears     Max service counted in formula (e.g. 35)
 * @param {number} finalAverageYears   Number of final years used for FAE (e.g. 5)
 *
 * @return {number} Projected annual DB pension at retirement (real dollars).
 *
 * Example:
 * =PENSION_INCOME_PROJECTED(40, 65, 120000, 0.01, 10, 0.02, 35, 5)
 */
function PENSION_INCOME_PROJECTED(
  currentAge,
  retirementAge,
  currentSalary,
  realSalaryGrowth,
  yearsServiceNow,
  accrualRate,
  maxServiceYears,
  finalAverageYears
) {
  currentAge        = Number(currentAge);
  retirementAge     = Number(retirementAge);
  currentSalary     = Number(currentSalary);
  realSalaryGrowth  = Number(realSalaryGrowth);
  yearsServiceNow   = Number(yearsServiceNow);
  accrualRate       = Number(accrualRate);
  maxServiceYears   = Number(maxServiceYears);
  finalAverageYears = Number(finalAverageYears);

  var yearsToRet = retirementAge - currentAge;
  if (yearsToRet < 0) {
    return "ERROR: retirementAge < currentAge";
  }
  if (finalAverageYears <= 0) {
    return "ERROR: finalAverageYears must be > 0";
  }

  // Project salary path in real terms
  var salaries = [];
  for (var y = 0; y <= yearsToRet; y++) {
    var s = currentSalary * Math.pow(1 + realSalaryGrowth, y);
    salaries.push(s);
  }

  // Average of last N years before retirement
  var n = Math.min(finalAverageYears, salaries.length);
  var sum = 0;
  for (var i = salaries.length - n; i < salaries.length; i++) {
    sum += salaries[i];
  }
  var finalAverageEarnings = sum / n;

  var yearsOfServiceAtRet = yearsServiceNow + yearsToRet;
  if (yearsOfServiceAtRet > maxServiceYears) {
    yearsOfServiceAtRet = maxServiceYears;
  }
  if (yearsOfServiceAtRet < 0) yearsOfServiceAtRet = 0;

  var annualPension = accrualRate * yearsOfServiceAtRet * finalAverageEarnings;
  return annualPension;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 5 – "Other Incomes" sheet (CPP, OAS, DB, rentals, etc.)
 * ----------------------------------------------------------------------
 *
 * We treat CPP/OAS/DB/etc. as generic income streams defined on a sheet
 * named OTHER_INCOME, with columns:
 *
 *   A: Description        (text, e.g. "CPP", "OAS", "DB Pension", "Rental")
 *   B: StartAge           (number, age when income starts)
 *   C: EndAge             (number, age when income ends – inclusive; blank = life)
 *   D: AnnualAmount       (real dollars, today’s dollars)
 *   E: Taxable?           (TRUE/FALSE – whether this counts as taxable income)
 *
 * This keeps the main engine generic and lets you:
 *   - manually enter CPP/OAS from MSCA/OAS estimator for max accuracy
 *   - or use PENSION_INCOME_PROJECTED etc. to derive DB pension inputs.
 */

/**
 * Ensure OTHER_INCOME sheet exists with header row.
 */
function ensureOtherIncomeSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('OTHER_INCOME');
  if (!sheet) {
    sheet = ss.insertSheet('OTHER_INCOME');
    sheet.getRange(1, 1, 1, 5).setValues([[
      'Description',
      'StartAge',
      'EndAge',
      'AnnualAmount',
      'Taxable?'
    ]]);
  }
}

/**
 * Reads OTHER_INCOME table and returns {taxable, nonTaxable} income
 * for a given age.
 *
 * @param {number} age
 * @return {{taxable:number, nonTaxable:number}}
 */
function getOtherIncomeForAge_(age) {
  age = Number(age);
  // Ensure the OTHER_INCOME sheet exists before trying to read from it
  ensureOtherIncomeSheet_();
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('OTHER_INCOME');
  if (!sheet) {
    return { taxable: 0, nonTaxable: 0 };
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { taxable: 0, nonTaxable: 0 };
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var taxable = 0;
  var nonTaxable = 0;

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var desc        = row[0];
    var startAge    = Number(row[1]);
    var endAge      = row[2] === "" ? null : Number(row[2]);
    var annualAmt   = Number(row[3]);
    var isTaxable   = asBool_(row[4]);

    if (!annualAmt || isNaN(annualAmt)) continue;
    if (isNaN(startAge)) continue;

    if (age < startAge) continue;
    if (endAge !== null && age > endAge) continue;

    if (isTaxable) taxable += annualAmt;
    else nonTaxable += annualAmt;
  }

  return { taxable: taxable, nonTaxable: nonTaxable };
}


/**
 * ----------------------------------------------------------------------
 * SECTION 6 – Target-spend RRSP/TFSA engine with other income
 * ----------------------------------------------------------------------
 *
 * RETIREMENT_TARGET_SPEND_TABLE keeps *total cashflow* constant in real
 * terms by adjusting RRSP/TFSA withdrawals after retirement, taking
 * into account all OTHER_INCOME streams (CPP, OAS, DB, rentals, etc.).
 *
 * Pre-retirement: RRSP/TFSA grow via contributions & pre-ret real return.
 * Post-retirement: Contributions stop. Assets grow at post-ret real return,
 * and you withdraw whatever is needed to top up OTHER_INCOME to the
 * target spending level for each year.
 */

/**
 * RETIREMENT_TARGET_SPEND_TABLE
 *
 * @param {number} currentAge             Current age (years)
 * @param {number} retirementAge          Retirement age (years)
 * @param {number} lifeExpectancyAge      Planning age (end age, years)
 * @param {number} rrspBalanceNow         Current RRSP balance (real dollars)
 * @param {number} tfsaBalanceNow         Current TFSA balance (real dollars)
 * @param {number} annualRrspContribution Annual RRSP contribution (real dollars)
 * @param {number} annualTfsaContribution Annual TFSA contribution (real dollars)
 * @param {number} preRetNominalReturn    Nominal return before retirement
 * @param {number} postRetNominalReturn   Nominal return after retirement
 * @param {number} inflationRate          Inflation rate
 * @param {number} targetAnnualSpending   Target *total* annual spending in retirement (real dollars)
 *
 * @return {Array[]} Table:
 *   Age,
 *   YearOffset,
 *   RRSP_Begin,
 *   TFSA_Begin,
 *   Other_Taxable,
 *   Other_NonTaxable,
 *   Portfolio_Withdrawal,
 *   Total_Cashflow,
 *   RRSP_End,
 *   TFSA_End,
 *   Portfolio_End,
 *   Shortfall
 *
 * Usage example:
 * =RETIREMENT_TARGET_SPEND_TABLE(
 *    40, 65, 90,
 *    200000, 50000,
 *    18000, 6000,
 *    0.06, 0.04, 0.02,
 *    60000
 * )
 */
function RETIREMENT_TARGET_SPEND_TABLE(
  currentAge,
  retirementAge,
  lifeExpectancyAge,
  rrspBalanceNow,
  tfsaBalanceNow,
  annualRrspContribution,
  annualTfsaContribution,
  preRetNominalReturn,
  postRetNominalReturn,
  inflationRate,
  targetAnnualSpending
) {
  // Ensure OTHER_INCOME sheet exists before reading from it
  ensureOtherIncomeSheet_();

  currentAge             = Number(currentAge);
  retirementAge          = Number(retirementAge);
  lifeExpectancyAge      = Number(lifeExpectancyAge);
  rrspBalanceNow         = Number(rrspBalanceNow);
  tfsaBalanceNow         = Number(tfsaBalanceNow);
  annualRrspContribution = Number(annualRrspContribution);
  annualTfsaContribution = Number(annualTfsaContribution);
  preRetNominalReturn    = Number(preRetNominalReturn);
  postRetNominalReturn   = Number(postRetNominalReturn);
  inflationRate          = Number(inflationRate);
  targetAnnualSpending   = Number(targetAnnualSpending);

  if (retirementAge < currentAge) {
    return [["ERROR: retirementAge < currentAge"]];
  }
  if (lifeExpectancyAge <= retirementAge) {
    return [["ERROR: lifeExpectancyAge must be > retirementAge"]];
  }

  var preReal  = realReturn_(preRetNominalReturn,  inflationRate);
  var postReal = realReturn_(postRetNominalReturn, inflationRate);

  var results = [];
  results.push([
    "Age",
    "YearOffset",
    "RRSP_Begin",
    "TFSA_Begin",
    "Other_Taxable",
    "Other_NonTaxable",
    "Portfolio_Withdrawal",
    "Total_Cashflow",
    "RRSP_End",
    "TFSA_End",
    "Portfolio_End",
    "Shortfall"
  ]);

  var rrsp = rrspBalanceNow;
  var tfsa = tfsaBalanceNow;
  var yearOffset = 0;
  var shortfallTotal = 0;

  for (var age = currentAge; age <= lifeExpectancyAge; age++, yearOffset++) {
    var rrspBegin = rrsp;
    var tfsaBegin = tfsa;

    var otherIncome = getOtherIncomeForAge_(age);
    var otherTaxable    = otherIncome.taxable;
    var otherNonTaxable = otherIncome.nonTaxable;

    var portfolioWithdrawal = 0;
    var totalCash = 0;
    var shortfall = 0;

    if (age < retirementAge) {
      // PRE-RETIREMENT: contributions only, no withdrawals
      rrsp = futureValueReal_(rrsp, annualRrspContribution, preReal, 1);
      tfsa = futureValueReal_(tfsa, annualTfsaContribution, preReal, 1);
      totalCash = 0; // no withdrawals for spending assumed
    } else {
      // POST-RETIREMENT: no more contributions, withdrawals to meet target
      // 1. Grow portfolio first for the year at post-ret return
      rrsp = rrsp * (1 + postReal);
      tfsa = tfsa * (1 + postReal);

      var totalOther = otherTaxable + otherNonTaxable;
      var neededFromPortfolio = Math.max(targetAnnualSpending - totalOther, 0);

      var totalPortfolio = rrsp + tfsa;
      if (neededFromPortfolio > totalPortfolio) {
        // Can't fully meet target; withdraw everything, record shortfall
        portfolioWithdrawal = totalPortfolio;
        shortfall = targetAnnualSpending - (totalOther + portfolioWithdrawal);
        shortfallTotal += shortfall;
        rrsp = 0;
        tfsa = 0;
      } else {
        // Strategy: draw from RRSP first (taxable), then TFSA
        var fromRRSP = Math.min(rrsp, neededFromPortfolio);
        rrsp -= fromRRSP;

        var remainingNeeded = neededFromPortfolio - fromRRSP;
        var fromTFSA = 0;
        if (remainingNeeded > 0) {
          fromTFSA = Math.min(tfsa, remainingNeeded);
          tfsa -= fromTFSA;
        }
        portfolioWithdrawal = fromRRSP + fromTFSA;
      }

      totalCash = totalOther + portfolioWithdrawal;
    }

    var rrspEnd = rrsp;
    var tfsaEnd = tfsa;
    var portfolioEnd = rrspEnd + tfsaEnd;

    results.push([
      age,
      yearOffset,
      rrspBegin,
      tfsaBegin,
      otherTaxable,
      otherNonTaxable,
      portfolioWithdrawal,
      totalCash,
      rrspEnd,
      tfsaEnd,
      portfolioEnd,
      shortfall
    ]);
  }

  return results;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 7 – Sheet setup helpers & custom menu
 * ----------------------------------------------------------------------
 */

/**
 * Ensure an INPUTS sheet exists with a basic skeleton.
 *
 * This is just a convenience so you have a place to store the key
 * parameters you tend to pass into the functions above.
 */
function ensureInputsSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('INPUTS');
  if (!sheet) {
    sheet = ss.insertSheet('INPUTS');

    var rows = [
      ['Label',                'Value',          'Notes'],
      ['Current age',          40,               'Used by RETIREMENT_INCOME & RETIREMENT_TARGET_SPEND_TABLE'],
      ['Retirement age',       65,               'Age you plan to retire'],
      ['Planning age',         90,               'Use LIFE_EXPECTANCY_AGE or set manually'],
      ['RRSP balance now',     200000,           'Today\'s dollars'],
      ['TFSA balance now',     50000,            'Today\'s dollars'],
      ['Annual RRSP contrib',  18000,            'Real dollars'],
      ['Annual TFSA contrib',  6000,             'Real dollars'],
      ['Pre-ret nominal r',    0.06,             'Before retirement'],
      ['Post-ret nominal r',   0.04,             'After retirement'],
      ['Inflation rate',       0.02,             'Expected CPI'],
      ['Target spend (annual)',60000,            'Real, total annual spending in retirement'],
      ['(Optional) DB pension',0,                'Use PENSION_INCOME_PROJECTED and add to OTHER_INCOME'],
      ['(Optional) CPP annual',0,                'Enter CPP annual and add to OTHER_INCOME'],
      ['(Optional) OAS annual',0,                'Enter OAS annual and add to OTHER_INCOME']
    ];
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sheet.setFrozenRows(1);
  }
}

/**
 * Ensure all required sheets exist for the retirement calculator.
 * This is called automatically on open and by key functions.
 */
function ensureRequiredSheets_() {
  ensureInputsSheet_();
  ensureOtherIncomeSheet_();
}

/**
 * Creates / verifies both INPUTS and OTHER_INCOME sheets.
 */
function setupRetirementSheets() {
  ensureRequiredSheets_();
  SpreadsheetApp.getActive().toast('INPUTS and OTHER_INCOME sheets are ready.');
}

/**
 * SETUP_RETIREMENT_CALCULATOR
 *
 * Custom function to trigger setup from a cell.
 * Ensures INPUTS and OTHER_INCOME sheets exist.
 *
 * @return {string} Setup confirmation message
 * @customfunction
 *
 * Example:
 * =SETUP_RETIREMENT_CALCULATOR()
 */
function SETUP_RETIREMENT_CALCULATOR() {
  try {
    ensureRequiredSheets_();
    // Verify sheets were created successfully
    var ss = SpreadsheetApp.getActive();
    var inputsSheet = ss.getSheetByName('INPUTS');
    var otherIncomeSheet = ss.getSheetByName('OTHER_INCOME');
    if (inputsSheet && otherIncomeSheet) {
      return "Setup complete! INPUTS and OTHER_INCOME sheets are ready.";
    } else {
      return "Setup incomplete. Please try running Retirement > Setup sheets from the menu.";
    }
  } catch (e) {
    return "Setup failed: " + e.message;
  }
}

/**
 * Add a custom menu on open.
 */
function onOpen() {
  ensureRequiredSheets_();
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Retirement')
    .addItem('Setup sheets (INPUTS & OTHER_INCOME)', 'setupRetirementSheets')
    .addItem('Show CPP Comparison', 'insertCPPComparison_')
    .addItem('Show OAS Comparison', 'insertOASComparison_')
    .addSeparator()
    .addItem('Run Projection', 'runProjection')
    .addItem('Run Couple Projection', 'runCoupleProjection')
    .addSeparator()
    .addItem('Setup Goals sheet', 'setupGoalsSheet')
    .addItem('Run Lifestyle Goals', 'runLifestyleGoals')
    .addToUi();
}

/**
 * Insert CPP comparison table at cursor position.
 */
function insertCPPComparison_() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var cell = sheet.getActiveCell();
  var formula = '=CPP_START_AGE_COMPARISON(60000, 35)';
  cell.setFormula(formula);
}

/**
 * Insert OAS comparison table at cursor position.
 */
function insertOASComparison_() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var cell = sheet.getActiveCell();
  var formula = '=OAS_BREAKEVEN_AGE(40)';
  cell.setFormula(formula);
}


/**
 * ----------------------------------------------------------------------
 * SECTION 8 – CPP (Canada Pension Plan) Benefits Calculator
 * ----------------------------------------------------------------------
 *
 * Calculates CPP retirement benefits based on CRA rules.
 * Uses the 2024 CPP maximum pensionable earnings and benefit amounts.
 *
 * Key CPP Rules:
 * - Normal retirement age: 65
 * - Early start (60-64): Reduced by 0.6% per month (7.2% per year)
 * - Late start (66-70): Increased by 0.7% per month (8.4% per year)
 * - Maximum 2024 monthly benefit at age 65: $1,364.60
 * - Maximum 2024 YMPE: $68,500
 */

/**
 * CPP 2024 constants (should be updated annually).
 * These are based on official CRA/Service Canada values.
 */
var CPP_2024 = {
  MAX_MONTHLY_BENEFIT_AT_65: 1364.60,  // 2024 maximum at age 65
  YMPE: 68500,                          // Year's Maximum Pensionable Earnings 2024
  BASIC_EXEMPTION: 3500,                // Basic exemption
  EARLY_REDUCTION_PER_MONTH: 0.006,     // 0.6% reduction per month before 65
  LATE_INCREASE_PER_MONTH: 0.007,       // 0.7% increase per month after 65
  MIN_START_AGE: 60,
  NORMAL_AGE: 65,
  MAX_START_AGE: 70,
  CONTRIBUTION_YEARS_FOR_MAX: 39,       // Years of max contributions needed for full benefit
  // Survivor benefit constants
  MAX_SURVIVOR_UNDER_65: 707.95,        // Maximum monthly survivor benefit under 65
  MAX_SURVIVOR_65_PLUS: 818.76,         // Maximum monthly survivor benefit 65+
  FLAT_RATE_UNDER_65: 217.99,           // Flat-rate portion for survivors under 65
  CHILD_BENEFIT: 281.72,                // Monthly benefit per eligible child
  DEATH_BENEFIT: 2500                   // Lump-sum death benefit
};

/**
 * CPP_BENEFIT
 *
 * Calculates the estimated monthly CPP retirement benefit.
 *
 * This uses a simplified but robust calculation based on:
 * - Your average earnings as a percentage of YMPE
 * - Number of years with pensionable earnings
 * - The age at which you start receiving benefits
 *
 * @param {number} averageEarnings      Average annual pensionable earnings over career
 * @param {number} contributionYears    Number of years with CPP contributions (max 39 counted)
 * @param {number} startAge             Age to start receiving CPP (60-70)
 * @param {number} currentYear          Current year for YMPE reference (default 2024)
 *
 * @return {number} Estimated monthly CPP benefit
 *
 * Example:
 * =CPP_BENEFIT(60000, 35, 65)
 */
function CPP_BENEFIT(averageEarnings, contributionYears, startAge, currentYear) {
  averageEarnings   = Number(averageEarnings);
  contributionYears = Number(contributionYears);
  startAge          = Number(startAge);
  currentYear       = currentYear ? Number(currentYear) : 2024;

  // Input validation
  if (averageEarnings < 0) {
    return "ERROR: averageEarnings must be >= 0";
  }
  if (contributionYears < 0) {
    return "ERROR: contributionYears must be >= 0";
  }
  if (startAge < CPP_2024.MIN_START_AGE || startAge > CPP_2024.MAX_START_AGE) {
    return "ERROR: startAge must be between 60 and 70";
  }

  // Cap contribution years at the maximum counted
  var effectiveYears = Math.min(contributionYears, CPP_2024.CONTRIBUTION_YEARS_FOR_MAX);

  // Calculate earnings ratio (your average earnings vs YMPE)
  // This determines what percentage of maximum benefit you'll receive
  var earningsRatio = Math.min(averageEarnings / CPP_2024.YMPE, 1.0);

  // Years ratio (how many years you contributed vs required for max)
  var yearsRatio = effectiveYears / CPP_2024.CONTRIBUTION_YEARS_FOR_MAX;

  // Base monthly benefit at age 65
  var baseBenefit = CPP_2024.MAX_MONTHLY_BENEFIT_AT_65 * earningsRatio * yearsRatio;

  // Apply early/late adjustment
  var monthsFromNormal = (startAge - CPP_2024.NORMAL_AGE) * 12;
  var adjustment;

  if (monthsFromNormal < 0) {
    // Early (before 65): reduce by 0.6% per month
    adjustment = 1 + (monthsFromNormal * CPP_2024.EARLY_REDUCTION_PER_MONTH);
  } else if (monthsFromNormal > 0) {
    // Late (after 65): increase by 0.7% per month
    adjustment = 1 + (monthsFromNormal * CPP_2024.LATE_INCREASE_PER_MONTH);
  } else {
    adjustment = 1;
  }

  var monthlyBenefit = baseBenefit * adjustment;

  return Math.round(monthlyBenefit * 100) / 100;
}

/**
 * CPP_BENEFIT_DETAILED
 *
 * Returns detailed CPP benefit information including annual amount,
 * adjustment factor, and comparison to maximum benefit.
 *
 * @param {number} averageEarnings      Average annual pensionable earnings
 * @param {number} contributionYears    Years with CPP contributions
 * @param {number} startAge             Age to start CPP (60-70)
 *
 * @return {Array[]} Table with benefit details
 *
 * Example:
 * =CPP_BENEFIT_DETAILED(60000, 35, 65)
 */
function CPP_BENEFIT_DETAILED(averageEarnings, contributionYears, startAge) {
  averageEarnings   = Number(averageEarnings);
  contributionYears = Number(contributionYears);
  startAge          = Number(startAge);

  if (startAge < 60 || startAge > 70) {
    return [["ERROR: startAge must be between 60 and 70"]];
  }

  var monthlyBenefit = CPP_BENEFIT(averageEarnings, contributionYears, startAge);
  if (typeof monthlyBenefit === 'string') {
    return [[monthlyBenefit]];
  }

  var annualBenefit = monthlyBenefit * 12;
  var maxMonthly = CPP_2024.MAX_MONTHLY_BENEFIT_AT_65;

  // Calculate adjustment factor
  var monthsFromNormal = (startAge - 65) * 12;
  var adjustmentFactor;
  if (monthsFromNormal < 0) {
    adjustmentFactor = 1 + (monthsFromNormal * 0.006);
  } else if (monthsFromNormal > 0) {
    adjustmentFactor = 1 + (monthsFromNormal * 0.007);
  } else {
    adjustmentFactor = 1;
  }

  var maxAtStartAge = maxMonthly * adjustmentFactor;
  var percentOfMax = (monthlyBenefit / maxAtStartAge) * 100;

  return [
    ["Metric", "Value"],
    ["Monthly Benefit", monthlyBenefit],
    ["Annual Benefit", annualBenefit],
    ["Start Age", startAge],
    ["Adjustment Factor", Math.round(adjustmentFactor * 1000) / 1000],
    ["Max Monthly at Age " + startAge, Math.round(maxAtStartAge * 100) / 100],
    ["% of Maximum", Math.round(percentOfMax * 10) / 10 + "%"],
    ["Contribution Years Used", Math.min(contributionYears, 39)]
  ];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 9 – OAS (Old Age Security) Benefits Calculator
 * ----------------------------------------------------------------------
 *
 * Calculates OAS benefits based on CRA rules.
 *
 * Key OAS Rules:
 * - Minimum age: 65
 * - Deferral bonus: 0.6% per month delayed (max to age 70)
 * - Residency requirement: 40 years in Canada for full OAS
 * - Minimum 10 years residence required
 * - 2024 maximum monthly OAS: $713.34 (ages 65-74), $784.67 (75+)
 * - OAS Recovery Tax (clawback) threshold 2024: $86,912
 */

var OAS_2024 = {
  MAX_MONTHLY_65_74: 713.34,        // July-Sept 2024 rate for 65-74
  MAX_MONTHLY_75_PLUS: 784.67,      // July-Sept 2024 rate for 75+
  FULL_RESIDENCE_YEARS: 40,         // Years for full OAS
  MIN_RESIDENCE_YEARS: 10,          // Minimum years for any OAS
  MIN_AGE: 65,
  MAX_DEFERRAL_AGE: 70,
  DEFERRAL_BONUS_PER_MONTH: 0.006,  // 0.6% per month
  CLAWBACK_THRESHOLD: 86912,        // 2024 recovery tax threshold
  CLAWBACK_RATE: 0.15               // 15% recovery rate above threshold
};

/**
 * Tax credit constants for 2024
 * Used by ESTIMATE_TAX_WITH_CREDITS for senior tax credits
 */
var TAX_CREDITS_2024 = {
  FEDERAL_AGE_AMOUNT: 8396,                // Federal age amount for 65+
  FEDERAL_AGE_INCOME_THRESHOLD: 42335,     // Income threshold for age amount reduction
  FEDERAL_AGE_CLAWBACK_RATE: 0.15,         // 15% reduction above threshold
  FEDERAL_PENSION_CREDIT_MAX: 2000,        // Maximum pension income credit
  FEDERAL_LOWEST_RATE: 0.15                // Federal lowest tax bracket rate
};

/**
 * OAS_BENEFIT
 *
 * Calculates the estimated monthly OAS benefit.
 *
 * @param {number} yearsInCanada    Years of Canadian residence after age 18 (max 40)
 * @param {number} startAge         Age to start OAS (65-70)
 * @param {number} currentAge       Current age of recipient (affects 75+ bonus)
 *
 * @return {number} Estimated monthly OAS benefit
 *
 * Example:
 * =OAS_BENEFIT(40, 65, 67)
 */
function OAS_BENEFIT(yearsInCanada, startAge, currentAge) {
  yearsInCanada = Number(yearsInCanada);
  startAge      = Number(startAge);
  currentAge    = currentAge ? Number(currentAge) : startAge;

  // Input validation
  if (yearsInCanada < 0) {
    return "ERROR: yearsInCanada must be >= 0";
  }
  if (startAge < OAS_2024.MIN_AGE) {
    return "ERROR: startAge must be at least 65";
  }
  if (startAge > OAS_2024.MAX_DEFERRAL_AGE) {
    return "ERROR: startAge cannot exceed 70";
  }
  if (yearsInCanada < OAS_2024.MIN_RESIDENCE_YEARS) {
    return "ERROR: Minimum 10 years residence required for OAS";
  }

  // Calculate residence ratio
  var effectiveYears = Math.min(yearsInCanada, OAS_2024.FULL_RESIDENCE_YEARS);
  var residenceRatio = effectiveYears / OAS_2024.FULL_RESIDENCE_YEARS;

  // Base benefit depends on age (75+ gets higher amount)
  var baseBenefit;
  if (currentAge >= 75) {
    baseBenefit = OAS_2024.MAX_MONTHLY_75_PLUS * residenceRatio;
  } else {
    baseBenefit = OAS_2024.MAX_MONTHLY_65_74 * residenceRatio;
  }

  // Apply deferral bonus if starting after 65
  var deferralMonths = Math.max(0, (startAge - OAS_2024.MIN_AGE) * 12);
  var maxDeferralMonths = (OAS_2024.MAX_DEFERRAL_AGE - OAS_2024.MIN_AGE) * 12;
  deferralMonths = Math.min(deferralMonths, maxDeferralMonths);

  var deferralBonus = 1 + (deferralMonths * OAS_2024.DEFERRAL_BONUS_PER_MONTH);
  var monthlyBenefit = baseBenefit * deferralBonus;

  return Math.round(monthlyBenefit * 100) / 100;
}

/**
 * OAS_CLAWBACK
 *
 * Calculates the OAS Recovery Tax (clawback) based on net income.
 *
 * @param {number} netIncome        Annual net income for tax purposes
 * @param {number} oasAnnual        Annual OAS benefit received
 *
 * @return {number} Annual amount of OAS clawed back
 *
 * Example:
 * =OAS_CLAWBACK(100000, 8560)
 */
function OAS_CLAWBACK(netIncome, oasAnnual) {
  netIncome = Number(netIncome);
  oasAnnual = Number(oasAnnual);

  if (netIncome <= OAS_2024.CLAWBACK_THRESHOLD) {
    return 0;
  }

  var excessIncome = netIncome - OAS_2024.CLAWBACK_THRESHOLD;
  var clawback = excessIncome * OAS_2024.CLAWBACK_RATE;

  // Clawback cannot exceed OAS received
  return Math.min(clawback, oasAnnual);
}

/**
 * OAS_BENEFIT_DETAILED
 *
 * Returns detailed OAS benefit information.
 *
 * @param {number} yearsInCanada    Years of Canadian residence after age 18
 * @param {number} startAge         Age to start OAS (65-70)
 * @param {number} currentAge       Current age
 * @param {number} netIncome        Optional: net income for clawback calculation
 *
 * @return {Array[]} Table with benefit details
 */
function OAS_BENEFIT_DETAILED(yearsInCanada, startAge, currentAge, netIncome) {
  yearsInCanada = Number(yearsInCanada);
  startAge      = Number(startAge);
  currentAge    = currentAge ? Number(currentAge) : startAge;
  netIncome     = netIncome ? Number(netIncome) : 0;

  var monthlyBenefit = OAS_BENEFIT(yearsInCanada, startAge, currentAge);
  if (typeof monthlyBenefit === 'string') {
    return [[monthlyBenefit]];
  }

  var annualBenefit = monthlyBenefit * 12;
  var clawback = netIncome > 0 ? OAS_CLAWBACK(netIncome, annualBenefit) : 0;
  var netAnnual = annualBenefit - clawback;

  var deferralMonths = Math.max(0, (startAge - 65) * 12);
  var deferralBonus = deferralMonths * 0.6;

  return [
    ["Metric", "Value"],
    ["Monthly Benefit (Gross)", monthlyBenefit],
    ["Annual Benefit (Gross)", annualBenefit],
    ["Years in Canada", Math.min(yearsInCanada, 40)],
    ["Residence Ratio", (Math.min(yearsInCanada, 40) / 40 * 100) + "%"],
    ["Deferral Bonus", deferralBonus + "%"],
    ["Age Category", currentAge >= 75 ? "75+" : "65-74"],
    ["OAS Clawback", clawback],
    ["Net Annual OAS", netAnnual]
  ];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 10 – GIS (Guaranteed Income Supplement) Calculator
 * ----------------------------------------------------------------------
 *
 * GIS is a non-taxable benefit for low-income OAS recipients.
 *
 * Key GIS Rules:
 * - Must be receiving OAS
 * - Income-tested benefit (reduces as income increases)
 * - 2024 maximum monthly: $1,065.47 (single), varies for couples
 * - Income thresholds determine eligibility
 */

var GIS_2024 = {
  MAX_MONTHLY_SINGLE: 1065.47,            // July-Sept 2024 max for single
  MAX_MONTHLY_COUPLE_BOTH_OAS: 641.35,    // Each spouse if both get OAS
  INCOME_THRESHOLD_SINGLE: 21456,         // Annual income threshold (approx)
  REDUCTION_RATE: 0.50                     // GIS reduces by 50 cents per dollar of income
};

/**
 * GIS_BENEFIT
 *
 * Calculates estimated monthly GIS benefit for a single person.
 *
 * @param {number} annualIncome     Annual income (excluding OAS)
 * @param {string} maritalStatus    "single" or "married"
 * @param {boolean} spouseOAS       If married, does spouse receive OAS?
 *
 * @return {number} Estimated monthly GIS benefit
 *
 * Example:
 * =GIS_BENEFIT(12000, "single")
 */
function GIS_BENEFIT(annualIncome, maritalStatus, spouseOAS) {
  annualIncome   = Number(annualIncome);
  maritalStatus  = (maritalStatus || "single").toString().trim().toLowerCase();
  var hasSpouseOAS = asBool_(spouseOAS);

  if (annualIncome < 0) {
    return "ERROR: annualIncome must be >= 0";
  }

  var maxBenefit;
  var incomeThreshold;

  if (maritalStatus === "single" || maritalStatus === "s") {
    maxBenefit = GIS_2024.MAX_MONTHLY_SINGLE;
    incomeThreshold = GIS_2024.INCOME_THRESHOLD_SINGLE;
  } else if (maritalStatus === "married" || maritalStatus === "m" || maritalStatus === "couple") {
    if (hasSpouseOAS) {
      maxBenefit = GIS_2024.MAX_MONTHLY_COUPLE_BOTH_OAS;
      incomeThreshold = GIS_2024.INCOME_THRESHOLD_SINGLE * 1.3; // Approximate adjustment
    } else {
      maxBenefit = GIS_2024.MAX_MONTHLY_SINGLE * 0.9; // Approximate for spouse without OAS
      incomeThreshold = GIS_2024.INCOME_THRESHOLD_SINGLE * 1.5;
    }
  } else {
    return "ERROR: maritalStatus must be 'single' or 'married'";
  }

  // GIS reduces based on income
  if (annualIncome >= incomeThreshold) {
    return 0;
  }

  var reduction = (annualIncome * GIS_2024.REDUCTION_RATE) / 12;
  var monthlyBenefit = Math.max(0, maxBenefit - reduction);

  return Math.round(monthlyBenefit * 100) / 100;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 11 – RRIF Minimum Withdrawal Calculator
 * ----------------------------------------------------------------------
 *
 * After age 71, RRSPs must be converted to RRIFs with mandatory
 * minimum annual withdrawals based on CRA prescribed factors.
 *
 * Key Rules:
 * - RRSP must convert to RRIF by end of year you turn 71
 * - Minimum withdrawal based on age and account value Jan 1
 * - Withdrawal percentages increase with age
 */

/**
 * CRA RRIF minimum withdrawal percentages by age.
 * Based on the Income Tax Regulations.
 */
var RRIF_FACTORS = {
  // Under 71: 1 / (90 - age)
  // 71+: CRA prescribed percentages
  71: 0.0528, 72: 0.0540, 73: 0.0553, 74: 0.0567, 75: 0.0582,
  76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658, 80: 0.0682,
  81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808, 85: 0.0851,
  86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099, 90: 0.1192,
  91: 0.1306, 92: 0.1449, 93: 0.1634, 94: 0.1879, 95: 0.2000
  // 95+ is 20%
};

/**
 * RRIF_MIN_WITHDRAWAL
 *
 * Calculates the mandatory minimum RRIF withdrawal for the year.
 *
 * @param {number} age              Age at start of year
 * @param {number} rrifBalance      RRIF account value at January 1
 *
 * @return {number} Minimum annual withdrawal required
 *
 * Example:
 * =RRIF_MIN_WITHDRAWAL(72, 500000)
 */
function RRIF_MIN_WITHDRAWAL(age, rrifBalance) {
  age         = Number(age);
  rrifBalance = Number(rrifBalance);

  if (age < 0 || rrifBalance < 0) {
    return "ERROR: age and rrifBalance must be >= 0";
  }

  if (age < 71) {
    // Formula for under 71: 1 / (90 - age)
    // But typically you don't need to withdraw before 71
    var factor = 1 / (90 - age);
    return Math.round(rrifBalance * factor * 100) / 100;
  }

  var factor;
  if (age >= 95) {
    factor = 0.2000;  // 20% for 95 and older
  } else if (RRIF_FACTORS[age]) {
    factor = RRIF_FACTORS[age];
  } else {
    // Fallback interpolation if age not in table
    factor = 0.2000;
  }

  return Math.round(rrifBalance * factor * 100) / 100;
}

/**
 * RRIF_MIN_PERCENTAGE
 *
 * Returns the minimum withdrawal percentage for a given age.
 *
 * @param {number} age    Age at start of year
 *
 * @return {number} Minimum withdrawal percentage (e.g., 0.0528 = 5.28%)
 *
 * Example:
 * =RRIF_MIN_PERCENTAGE(72)
 */
function RRIF_MIN_PERCENTAGE(age) {
  age = Number(age);

  if (age < 71) {
    return 1 / (90 - age);
  }

  if (age >= 95) {
    return 0.2000;
  }

  return RRIF_FACTORS[age] || 0.2000;
}

/**
 * RRIF_SCHEDULE
 *
 * Projects RRIF minimum withdrawals and balances over time.
 *
 * @param {number} startAge         Age when starting RRIF
 * @param {number} endAge           Age to project until
 * @param {number} initialBalance   Starting RRIF balance
 * @param {number} nominalReturn    Expected nominal annual return
 * @param {number} inflationRate    Expected inflation rate
 *
 * @return {Array[]} Table: Age, Min %, Min Withdrawal, Year-End Balance
 *
 * Example:
 * =RRIF_SCHEDULE(71, 90, 500000, 0.05, 0.02)
 */
function RRIF_SCHEDULE(startAge, endAge, initialBalance, nominalReturn, inflationRate) {
  startAge       = Number(startAge);
  endAge         = Number(endAge);
  initialBalance = Number(initialBalance);
  nominalReturn  = Number(nominalReturn);
  inflationRate  = Number(inflationRate);

  if (startAge < 71) {
    return [["ERROR: RRIF must start at age 71 or later"]];
  }
  if (endAge < startAge) {
    return [["ERROR: endAge must be >= startAge"]];
  }

  var realReturn = realReturn_(nominalReturn, inflationRate);
  var balance = initialBalance;

  var results = [["Age", "Min %", "Min Withdrawal", "Year-End Balance"]];

  for (var age = startAge; age <= endAge; age++) {
    var minPct = RRIF_MIN_PERCENTAGE(age);
    var minWithdrawal = balance * minPct;

    // Withdraw at start of year, then grow remainder
    var afterWithdrawal = balance - minWithdrawal;
    var endBalance = afterWithdrawal * (1 + realReturn);

    results.push([
      age,
      Math.round(minPct * 10000) / 100 + "%",
      Math.round(minWithdrawal),
      Math.round(Math.max(0, endBalance))
    ]);

    balance = Math.max(0, endBalance);
    if (balance <= 0) break;
  }

  return results;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 12 – Canadian Tax Estimation
 * ----------------------------------------------------------------------
 *
 * Estimates combined federal and provincial income tax.
 * Uses 2024 tax brackets.
 *
 * Note: This is a simplified estimate. Actual taxes depend on many
 * factors including credits, deductions, and specific circumstances.
 */

/**
 * 2024 Federal tax brackets
 */
var FEDERAL_TAX_2024 = {
  brackets: [
    { min: 0,       max: 55867,   rate: 0.15 },
    { min: 55867,   max: 111733,  rate: 0.205 },
    { min: 111733,  max: 173205,  rate: 0.26 },
    { min: 173205,  max: 246752,  rate: 0.29 },
    { min: 246752,  max: Infinity, rate: 0.33 }
  ],
  basicPersonalAmount: 15705
};

/**
 * 2024 Provincial tax brackets (simplified selection)
 */
var PROVINCIAL_TAX_2024 = {
  ON: {  // Ontario
    brackets: [
      { min: 0,       max: 51446,   rate: 0.0505 },
      { min: 51446,   max: 102894,  rate: 0.0915 },
      { min: 102894,  max: 150000,  rate: 0.1116 },
      { min: 150000,  max: 220000,  rate: 0.1216 },
      { min: 220000,  max: Infinity, rate: 0.1316 }
    ],
    basicPersonalAmount: 11865
  },
  BC: {  // British Columbia
    brackets: [
      { min: 0,       max: 47937,   rate: 0.0506 },
      { min: 47937,   max: 95875,   rate: 0.077 },
      { min: 95875,   max: 110076,  rate: 0.105 },
      { min: 110076,  max: 133664,  rate: 0.1229 },
      { min: 133664,  max: 181232,  rate: 0.147 },
      { min: 181232,  max: 252752,  rate: 0.168 },
      { min: 252752,  max: Infinity, rate: 0.205 }
    ],
    basicPersonalAmount: 12580
  },
  AB: {  // Alberta
    brackets: [
      { min: 0,       max: 148269,  rate: 0.10 },
      { min: 148269,  max: 177922,  rate: 0.12 },
      { min: 177922,  max: 237230,  rate: 0.13 },
      { min: 237230,  max: 355845,  rate: 0.14 },
      { min: 355845,  max: Infinity, rate: 0.15 }
    ],
    basicPersonalAmount: 21003
  },
  QC: {  // Quebec (note: has unique tax system)
    brackets: [
      { min: 0,       max: 51780,   rate: 0.14 },
      { min: 51780,   max: 103545,  rate: 0.19 },
      { min: 103545,  max: 126000,  rate: 0.24 },
      { min: 126000,  max: Infinity, rate: 0.2575 }
    ],
    basicPersonalAmount: 18056
  },
  SK: {  // Saskatchewan
    brackets: [
      { min: 0,       max: 52057,   rate: 0.105 },
      { min: 52057,   max: 148734,  rate: 0.125 },
      { min: 148734,  max: Infinity, rate: 0.145 }
    ],
    basicPersonalAmount: 17661
  },
  MB: {  // Manitoba
    brackets: [
      { min: 0,       max: 47000,   rate: 0.108 },
      { min: 47000,   max: 100000,  rate: 0.1275 },
      { min: 100000,  max: Infinity, rate: 0.174 }
    ],
    basicPersonalAmount: 15780
  },
  NS: {  // Nova Scotia
    brackets: [
      { min: 0,       max: 29590,   rate: 0.0879 },
      { min: 29590,   max: 59180,   rate: 0.1495 },
      { min: 59180,   max: 93000,   rate: 0.1667 },
      { min: 93000,   max: 150000,  rate: 0.175 },
      { min: 150000,  max: Infinity, rate: 0.21 }
    ],
    basicPersonalAmount: 8481
  },
  NB: {  // New Brunswick
    brackets: [
      { min: 0,       max: 49958,   rate: 0.094 },
      { min: 49958,   max: 99916,   rate: 0.14 },
      { min: 99916,   max: 185064,  rate: 0.16 },
      { min: 185064,  max: Infinity, rate: 0.195 }
    ],
    basicPersonalAmount: 13044
  },
  PE: {  // Prince Edward Island
    brackets: [
      { min: 0,       max: 32656,   rate: 0.098 },
      { min: 32656,   max: 64313,   rate: 0.138 },
      { min: 64313,   max: Infinity, rate: 0.167 }
    ],
    basicPersonalAmount: 12750
  },
  NL: {  // Newfoundland and Labrador
    brackets: [
      { min: 0,       max: 43198,   rate: 0.087 },
      { min: 43198,   max: 86395,   rate: 0.145 },
      { min: 86395,   max: 154244,  rate: 0.158 },
      { min: 154244,  max: 215943,  rate: 0.178 },
      { min: 215943,  max: 275870,  rate: 0.198 },
      { min: 275870,  max: 551739,  rate: 0.208 },
      { min: 551739,  max: 1103478, rate: 0.213 },
      { min: 1103478, max: Infinity, rate: 0.218 }
    ],
    basicPersonalAmount: 10382
  },
  YT: {  // Yukon
    brackets: [
      { min: 0,       max: 55867,   rate: 0.064 },
      { min: 55867,   max: 111733,  rate: 0.09 },
      { min: 111733,  max: 173205,  rate: 0.109 },
      { min: 173205,  max: 500000,  rate: 0.128 },
      { min: 500000,  max: Infinity, rate: 0.15 }
    ],
    basicPersonalAmount: 15705
  },
  NT: {  // Northwest Territories
    brackets: [
      { min: 0,       max: 50597,   rate: 0.059 },
      { min: 50597,   max: 101198,  rate: 0.086 },
      { min: 101198,  max: 164525,  rate: 0.122 },
      { min: 164525,  max: Infinity, rate: 0.1405 }
    ],
    basicPersonalAmount: 16593
  },
  NU: {  // Nunavut
    brackets: [
      { min: 0,       max: 53268,   rate: 0.04 },
      { min: 53268,   max: 106537,  rate: 0.07 },
      { min: 106537,  max: 173205,  rate: 0.09 },
      { min: 173205,  max: Infinity, rate: 0.115 }
    ],
    basicPersonalAmount: 18767
  }
};

/**
 * Calculate tax using bracket system.
 *
 * @param {number} taxableIncome
 * @param {Array} brackets
 * @return {number} Tax amount
 */
function calculateBracketTax_(taxableIncome, brackets) {
  var tax = 0;
  var remainingIncome = taxableIncome;

  for (var i = 0; i < brackets.length && remainingIncome > 0; i++) {
    var bracket = brackets[i];
    var bracketSize = bracket.max - bracket.min;
    var taxableInBracket = Math.min(remainingIncome, bracketSize);

    if (taxableIncome > bracket.min) {
      var incomeInBracket = Math.min(taxableIncome - bracket.min, bracketSize);
      if (incomeInBracket > 0) {
        tax += incomeInBracket * bracket.rate;
      }
    }
    remainingIncome -= taxableInBracket;
  }

  return tax;
}

/**
 * ESTIMATE_TAX
 *
 * Estimates combined federal and provincial income tax.
 *
 * @param {number} taxableIncome    Taxable income
 * @param {string} province         Province code (ON, BC, AB, QC, etc.)
 *
 * @return {number} Estimated total income tax
 *
 * Example:
 * =ESTIMATE_TAX(80000, "ON")
 */
function ESTIMATE_TAX(taxableIncome, province) {
  taxableIncome = Number(taxableIncome);
  province = (province || "ON").toString().trim().toUpperCase();

  if (taxableIncome < 0) {
    return "ERROR: taxableIncome must be >= 0";
  }

  if (!PROVINCIAL_TAX_2024[province]) {
    return "ERROR: Province not supported. Use: ON, BC, AB, QC, SK, MB, NS, NB, PE, NL, YT, NT, NU";
  }

  // Federal tax
  var federalTaxable = Math.max(0, taxableIncome - FEDERAL_TAX_2024.basicPersonalAmount);
  var federalTax = calculateBracketTax_(taxableIncome, FEDERAL_TAX_2024.brackets);
  var federalCredit = FEDERAL_TAX_2024.basicPersonalAmount * 0.15;
  federalTax = Math.max(0, federalTax - federalCredit);

  // Provincial tax
  var provData = PROVINCIAL_TAX_2024[province];
  var provincialTax = calculateBracketTax_(taxableIncome, provData.brackets);
  var provincialCreditRate = provData.brackets[0].rate;
  var provincialCredit = provData.basicPersonalAmount * provincialCreditRate;
  provincialTax = Math.max(0, provincialTax - provincialCredit);

  var totalTax = federalTax + provincialTax;

  return Math.round(totalTax * 100) / 100;
}

/**
 * ESTIMATE_TAX_DETAILED
 *
 * Returns detailed tax breakdown.
 *
 * @param {number} taxableIncome    Taxable income
 * @param {string} province         Province code
 *
 * @return {Array[]} Table with tax details
 */
function ESTIMATE_TAX_DETAILED(taxableIncome, province) {
  taxableIncome = Number(taxableIncome);
  province = (province || "ON").toString().trim().toUpperCase();

  if (!PROVINCIAL_TAX_2024[province]) {
    return [["ERROR: Province not supported"]];
  }

  var totalTax = ESTIMATE_TAX(taxableIncome, province);
  if (typeof totalTax === 'string') {
    return [[totalTax]];
  }

  // Calculate components
  var federalTax = calculateBracketTax_(taxableIncome, FEDERAL_TAX_2024.brackets);
  var federalCredit = FEDERAL_TAX_2024.basicPersonalAmount * 0.15;
  var netFederal = Math.max(0, federalTax - federalCredit);

  var provData = PROVINCIAL_TAX_2024[province];
  var provincialTax = calculateBracketTax_(taxableIncome, provData.brackets);
  var provincialCreditRate = provData.brackets[0].rate;
  var provincialCredit = provData.basicPersonalAmount * provincialCreditRate;
  var netProvincial = Math.max(0, provincialTax - provincialCredit);

  var effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
  var marginalFederal = getMarginalRate_(taxableIncome, FEDERAL_TAX_2024.brackets);
  var marginalProvincial = getMarginalRate_(taxableIncome, provData.brackets);

  return [
    ["Metric", "Value"],
    ["Taxable Income", taxableIncome],
    ["Province", province],
    ["Federal Tax (Gross)", Math.round(federalTax)],
    ["Federal Basic Credit", Math.round(federalCredit)],
    ["Federal Tax (Net)", Math.round(netFederal)],
    ["Provincial Tax (Gross)", Math.round(provincialTax)],
    ["Provincial Basic Credit", Math.round(provincialCredit)],
    ["Provincial Tax (Net)", Math.round(netProvincial)],
    ["Total Tax", Math.round(totalTax)],
    ["Effective Rate", Math.round(effectiveRate * 100) / 100 + "%"],
    ["Marginal Rate (Combined)", Math.round((marginalFederal + marginalProvincial) * 10000) / 100 + "%"]
  ];
}

/**
 * Get marginal tax rate for given income level.
 */
function getMarginalRate_(income, brackets) {
  for (var i = brackets.length - 1; i >= 0; i--) {
    if (income > brackets[i].min) {
      return brackets[i].rate;
    }
  }
  return brackets[0].rate;
}

/**
 * MARGINAL_TAX_RATE
 *
 * Returns the combined marginal tax rate for a given income and province.
 *
 * @param {number} taxableIncome    Taxable income
 * @param {string} province         Province code
 *
 * @return {number} Combined marginal tax rate (e.g., 0.435 = 43.5%)
 */
function MARGINAL_TAX_RATE(taxableIncome, province) {
  taxableIncome = Number(taxableIncome);
  province = (province || "ON").toString().trim().toUpperCase();

  if (!PROVINCIAL_TAX_2024[province]) {
    return "ERROR: Province not supported";
  }

  var federalRate = getMarginalRate_(taxableIncome, FEDERAL_TAX_2024.brackets);
  var provincialRate = getMarginalRate_(taxableIncome, PROVINCIAL_TAX_2024[province].brackets);

  return federalRate + provincialRate;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 13 – Non-Registered Investment Account Support
 * ----------------------------------------------------------------------
 *
 * Handles taxable investment accounts with capital gains tracking.
 */

/**
 * TAXABLE_ACCOUNT_GROWTH
 *
 * Projects growth of a non-registered (taxable) investment account.
 * Accounts for annual capital gains taxation on realized gains.
 *
 * @param {number} currentBalance       Current account balance
 * @param {number} costBase             Adjusted cost base (ACB)
 * @param {number} annualContribution   Annual contribution
 * @param {number} years                Number of years to project
 * @param {number} nominalReturn        Expected nominal annual return
 * @param {number} inflationRate        Expected inflation rate
 * @param {number} turnoverRate         Annual portfolio turnover (triggers capital gains)
 * @param {number} marginalTaxRate      Marginal tax rate on capital gains
 *
 * @return {Array[]} Table: Year, Start Balance, Contribution, Growth, Tax, End Balance, ACB
 *
 * Example:
 * =TAXABLE_ACCOUNT_GROWTH(100000, 80000, 10000, 10, 0.06, 0.02, 0.10, 0.40)
 */
function TAXABLE_ACCOUNT_GROWTH(
  currentBalance,
  costBase,
  annualContribution,
  years,
  nominalReturn,
  inflationRate,
  turnoverRate,
  marginalTaxRate
) {
  currentBalance      = Number(currentBalance);
  costBase            = Number(costBase);
  annualContribution  = Number(annualContribution);
  years               = Number(years);
  nominalReturn       = Number(nominalReturn);
  inflationRate       = Number(inflationRate);
  turnoverRate        = Number(turnoverRate) || 0.10;
  marginalTaxRate     = Number(marginalTaxRate) || 0.40;

  if (currentBalance < 0 || costBase < 0 || years < 0) {
    return [["ERROR: Values must be non-negative"]];
  }

  var realReturn = realReturn_(nominalReturn, inflationRate);

  var results = [["Year", "Start Balance", "Contribution", "Growth", "Cap Gains Tax", "End Balance", "ACB"]];

  var balance = currentBalance;
  var acb = costBase;

  for (var year = 1; year <= years; year++) {
    var startBalance = balance;
    var startACB = acb;

    // Add contribution
    balance += annualContribution;
    acb += annualContribution;

    // Calculate growth
    var growth = startBalance * realReturn;
    balance += growth;

    // Calculate capital gains tax on realized gains (due to turnover)
    var unrealizedGain = balance - acb;
    var realizedGain = unrealizedGain * turnoverRate;
    // Capital gains inclusion rate is 50% in Canada (up to $250k)
    var taxableGain = realizedGain * 0.5;
    var capGainsTax = taxableGain * marginalTaxRate;

    // Pay tax from account
    balance -= capGainsTax;

    // When gains are realized through turnover, the ACB increases proportionally
    // to reflect that we've "sold high and bought back" at market value
    var portionRealized = turnoverRate;
    var acbRealized = acb * portionRealized;
    var proceedsFromSale = (balance + capGainsTax) * portionRealized; // Value before tax payment
    // New ACB = old ACB - ACB of sold portion + proceeds reinvested at new cost basis
    acb = acb - acbRealized + (proceedsFromSale - capGainsTax / portionRealized * portionRealized);

    results.push([
      year,
      Math.round(startBalance),
      annualContribution,
      Math.round(growth),
      Math.round(capGainsTax),
      Math.round(balance),
      Math.round(acb)
    ]);
  }

  return results;
}

/**
 * CAPITAL_GAINS_TAX
 *
 * Calculates the tax on realized capital gains.
 * Uses the 2024 capital gains inclusion rate.
 *
 * @param {number} capitalGain      Total capital gain realized
 * @param {number} marginalTaxRate  Your marginal tax rate
 *
 * @return {number} Tax payable on the capital gain
 *
 * Note: As of 2024, capital gains inclusion rate is 50% for first $250k,
 * and 66.67% above that for individuals.
 *
 * Example:
 * =CAPITAL_GAINS_TAX(100000, 0.40)
 */
function CAPITAL_GAINS_TAX(capitalGain, marginalTaxRate) {
  capitalGain     = Number(capitalGain);
  marginalTaxRate = Number(marginalTaxRate);

  if (capitalGain <= 0) {
    return 0;
  }

  var inclusionThreshold = 250000;
  var lowerInclusionRate = 0.50;
  var higherInclusionRate = 0.6667;

  var taxableGain;
  if (capitalGain <= inclusionThreshold) {
    taxableGain = capitalGain * lowerInclusionRate;
  } else {
    taxableGain = (inclusionThreshold * lowerInclusionRate) +
                  ((capitalGain - inclusionThreshold) * higherInclusionRate);
  }

  return Math.round(taxableGain * marginalTaxRate * 100) / 100;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 14 – RRSP/TFSA Contribution Room Tracking
 * ----------------------------------------------------------------------
 */

/**
 * RRSP_CONTRIBUTION_ROOM
 *
 * Calculates RRSP contribution room for a given year.
 *
 * @param {number} previousYearEarnedIncome  Earned income from previous year
 * @param {number} unusedRoom                Unused RRSP room carried forward
 * @param {number} pensionAdjustment         Pension adjustment from employer plan
 * @param {number} year                      Tax year (for RRSP limit lookup)
 *
 * @return {number} Available RRSP contribution room
 *
 * Example:
 * =RRSP_CONTRIBUTION_ROOM(100000, 50000, 5000, 2024)
 */
function RRSP_CONTRIBUTION_ROOM(previousYearEarnedIncome, unusedRoom, pensionAdjustment, year) {
  previousYearEarnedIncome = Number(previousYearEarnedIncome);
  unusedRoom               = Number(unusedRoom) || 0;
  pensionAdjustment        = Number(pensionAdjustment) || 0;
  year                     = Number(year) || 2024;

  // RRSP limits by year
  var rrspLimits = {
    2024: 31560,
    2025: 32490,
    2023: 30780,
    2022: 29210,
    2021: 27830
  };

  var maxNewRoom = rrspLimits[year] || 31560;
  var earnedIncomeRoom = previousYearEarnedIncome * 0.18;

  // New room is lesser of 18% of income or annual max, minus PA
  var newRoom = Math.min(earnedIncomeRoom, maxNewRoom) - pensionAdjustment;
  newRoom = Math.max(0, newRoom);

  // Total room includes carryforward
  var totalRoom = newRoom + unusedRoom;

  return Math.round(totalRoom * 100) / 100;
}

/**
 * TFSA_CONTRIBUTION_ROOM
 *
 * Calculates TFSA contribution room based on years of eligibility.
 *
 * @param {number} birthYear         Year of birth
 * @param {number} currentYear       Current year
 * @param {number} usedRoom          Total TFSA room already used
 * @param {number} firstResidentYear Year became Canadian resident (if not born in Canada)
 *
 * @return {number} Available TFSA contribution room
 *
 * Example:
 * =TFSA_CONTRIBUTION_ROOM(1980, 2024, 50000)
 */
function TFSA_CONTRIBUTION_ROOM(birthYear, currentYear, usedRoom, firstResidentYear) {
  birthYear         = Number(birthYear);
  currentYear       = Number(currentYear) || 2024;
  usedRoom          = Number(usedRoom) || 0;
  firstResidentYear = Number(firstResidentYear) || (birthYear + 18);

  // TFSA annual limits by year
  var tfsaLimits = {
    2009: 5000, 2010: 5000, 2011: 5000, 2012: 5000, 2013: 5500,
    2014: 5500, 2015: 10000, 2016: 5500, 2017: 5500, 2018: 5500,
    2019: 6000, 2020: 6000, 2021: 6000, 2022: 6000, 2023: 6500,
    2024: 7000, 2025: 7000
  };

  // TFSA started in 2009, must be 18+ to contribute
  var tfsaStartYear = 2009;
  var age18Year = birthYear + 18;
  var eligibleStartYear = Math.max(tfsaStartYear, age18Year, firstResidentYear);

  var totalRoom = 0;
  for (var year = eligibleStartYear; year <= currentYear; year++) {
    var annualLimit = tfsaLimits[year] || 7000; // Default to current known limit
    totalRoom += annualLimit;
  }

  var availableRoom = totalRoom - usedRoom;

  return Math.round(Math.max(0, availableRoom) * 100) / 100;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 15 – Enhanced Withdrawal Strategies
 * ----------------------------------------------------------------------
 */

/**
 * OPTIMAL_WITHDRAWAL_ORDER
 *
 * Suggests optimal withdrawal order based on tax efficiency.
 *
 * @param {number} rrspBalance       RRSP/RRIF balance
 * @param {number} tfsaBalance       TFSA balance
 * @param {number} nonRegBalance     Non-registered account balance
 * @param {number} withdrawalNeeded  Amount needed to withdraw
 * @param {number} otherIncome       Other taxable income (CPP, OAS, pension)
 * @param {string} province          Province code
 *
 * @return {Array[]} Suggested withdrawal amounts from each account
 *
 * Example:
 * =OPTIMAL_WITHDRAWAL_ORDER(500000, 100000, 200000, 50000, 30000, "ON")
 */
function OPTIMAL_WITHDRAWAL_ORDER(rrspBalance, tfsaBalance, nonRegBalance, withdrawalNeeded, otherIncome, province) {
  rrspBalance      = Number(rrspBalance);
  tfsaBalance      = Number(tfsaBalance);
  nonRegBalance    = Number(nonRegBalance);
  withdrawalNeeded = Number(withdrawalNeeded);
  otherIncome      = Number(otherIncome) || 0;
  province         = (province || "ON").toString().trim().toUpperCase();

  if (withdrawalNeeded <= 0) {
    return [["No withdrawal needed"]];
  }

  var totalAvailable = rrspBalance + tfsaBalance + nonRegBalance;
  if (withdrawalNeeded > totalAvailable) {
    return [["ERROR: Insufficient funds. Available: " + totalAvailable]];
  }

  // Strategy: Fill lower tax brackets with RRSP, use TFSA for excess
  // This is a simplified tax-efficient approach

  var results = [["Account", "Withdrawal", "Tax Impact", "Reason"]];

  var remaining = withdrawalNeeded;
  var fromRRSP = 0;
  var fromTFSA = 0;
  var fromNonReg = 0;

  // First, determine how much RRSP room we have in lower brackets
  // Target staying below ~$50k bracket if possible
  var lowBracketRoom = Math.max(0, 55867 - otherIncome);

  // Use RRSP up to lower bracket threshold
  if (remaining > 0 && rrspBalance > 0) {
    fromRRSP = Math.min(remaining, rrspBalance, lowBracketRoom);
    remaining -= fromRRSP;
  }

  // Use non-registered next (50% capital gains inclusion is tax-efficient)
  if (remaining > 0 && nonRegBalance > 0) {
    fromNonReg = Math.min(remaining, nonRegBalance);
    remaining -= fromNonReg;
  }

  // Use TFSA last (tax-free, preserve for later years)
  if (remaining > 0 && tfsaBalance > 0) {
    fromTFSA = Math.min(remaining, tfsaBalance);
    remaining -= fromTFSA;
  }

  // If still need more, take additional from RRSP
  if (remaining > 0 && rrspBalance > fromRRSP) {
    var additionalRRSP = Math.min(remaining, rrspBalance - fromRRSP);
    fromRRSP += additionalRRSP;
    remaining -= additionalRRSP;
  }

  // Calculate tax impacts
  var rrspTax = fromRRSP > 0 ? ESTIMATE_TAX(otherIncome + fromRRSP, province) - ESTIMATE_TAX(otherIncome, province) : 0;
  // Assume 50% of non-reg withdrawal is capital gain, and 50% inclusion rate
  // So taxable = withdrawal * 0.5 (gain portion) * 0.5 (inclusion) = 0.25
  var nonRegTax = fromNonReg * 0.25 * MARGINAL_TAX_RATE(otherIncome, province);
  var tfsaTax = 0;

  if (fromRRSP > 0) {
    results.push(["RRSP/RRIF", Math.round(fromRRSP), Math.round(rrspTax), "Fill lower tax bracket first"]);
  }
  if (fromNonReg > 0) {
    results.push(["Non-Registered", Math.round(fromNonReg), Math.round(nonRegTax), "50% capital gains inclusion"]);
  }
  if (fromTFSA > 0) {
    results.push(["TFSA", Math.round(fromTFSA), tfsaTax, "Tax-free - preserve for later"]);
  }

  var totalTax = (typeof rrspTax === 'number' ? rrspTax : 0) +
                 (typeof nonRegTax === 'number' ? nonRegTax : 0);

  results.push(["TOTAL", Math.round(withdrawalNeeded - remaining), Math.round(totalTax), ""]);

  return results;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 16 – Input Validation Helpers
 * ----------------------------------------------------------------------
 */

/**
 * VALIDATE_RETIREMENT_INPUTS
 *
 * Validates common retirement planning inputs and returns any errors.
 *
 * @param {number} currentAge
 * @param {number} retirementAge
 * @param {number} lifeExpectancy
 * @param {number} rrspBalance
 * @param {number} tfsaBalance
 *
 * @return {string} "OK" if valid, otherwise error message
 */
function VALIDATE_RETIREMENT_INPUTS(currentAge, retirementAge, lifeExpectancy, rrspBalance, tfsaBalance) {
  currentAge     = Number(currentAge);
  retirementAge  = Number(retirementAge);
  lifeExpectancy = Number(lifeExpectancy);
  rrspBalance    = Number(rrspBalance);
  tfsaBalance    = Number(tfsaBalance);

  var errors = [];

  if (isNaN(currentAge) || currentAge < 0 || currentAge > 120) {
    errors.push("Current age must be between 0 and 120");
  }

  if (isNaN(retirementAge) || retirementAge < currentAge) {
    errors.push("Retirement age must be >= current age");
  }

  if (retirementAge > 100) {
    errors.push("Retirement age should be <= 100");
  }

  if (isNaN(lifeExpectancy) || lifeExpectancy <= retirementAge) {
    errors.push("Life expectancy must be > retirement age");
  }

  if (lifeExpectancy > 120) {
    errors.push("Life expectancy should be <= 120");
  }

  if (isNaN(rrspBalance) || rrspBalance < 0) {
    errors.push("RRSP balance must be >= 0");
  }

  if (isNaN(tfsaBalance) || tfsaBalance < 0) {
    errors.push("TFSA balance must be >= 0");
  }

  if (errors.length === 0) {
    return "OK";
  }

  return "ERRORS: " + errors.join("; ");
}


/**
 * ----------------------------------------------------------------------
 * SECTION 17 – Retirement Readiness & Savings Target Calculator
 * ----------------------------------------------------------------------
 *
 * Calculates how much you need to save for retirement and whether
 * you're on track.
 */

/**
 * RETIREMENT_SAVINGS_TARGET
 *
 * Calculates the total savings needed at retirement to fund your
 * desired lifestyle, accounting for CPP, OAS, and other income.
 *
 * @param {number} desiredAnnualSpending   Annual spending in retirement (real dollars)
 * @param {number} retirementAge           Age at retirement
 * @param {number} lifeExpectancy          Planning age
 * @param {number} otherAnnualIncome       Annual income from CPP, OAS, pensions, etc.
 * @param {number} postRetRealReturn       Real return after retirement (e.g., 0.02)
 *
 * @return {number} Total savings needed at retirement
 *
 * Example:
 * =RETIREMENT_SAVINGS_TARGET(60000, 65, 90, 25000, 0.02)
 */
function RETIREMENT_SAVINGS_TARGET(desiredAnnualSpending, retirementAge, lifeExpectancy, otherAnnualIncome, postRetRealReturn) {
  desiredAnnualSpending = Number(desiredAnnualSpending);
  retirementAge         = Number(retirementAge);
  lifeExpectancy        = Number(lifeExpectancy);
  otherAnnualIncome     = Number(otherAnnualIncome) || 0;
  postRetRealReturn     = Number(postRetRealReturn) || 0.02;

  if (desiredAnnualSpending <= 0) {
    return "ERROR: desiredAnnualSpending must be > 0";
  }
  if (lifeExpectancy <= retirementAge) {
    return "ERROR: lifeExpectancy must be > retirementAge";
  }

  var yearsInRetirement = lifeExpectancy - retirementAge;
  var annualNeedFromSavings = Math.max(0, desiredAnnualSpending - otherAnnualIncome);

  // Calculate present value of annuity (savings needed)
  if (Math.abs(postRetRealReturn) < 1e-8) {
    return annualNeedFromSavings * yearsInRetirement;
  }

  var pvFactor = (1 - Math.pow(1 + postRetRealReturn, -yearsInRetirement)) / postRetRealReturn;
  var savingsNeeded = annualNeedFromSavings * pvFactor;

  return Math.round(savingsNeeded);
}

/**
 * RETIREMENT_READINESS_SCORE
 *
 * Calculates a retirement readiness score (0-100%) based on
 * current savings trajectory vs. target.
 *
 * @param {number} currentAge              Current age
 * @param {number} retirementAge           Planned retirement age
 * @param {number} lifeExpectancy          Planning age
 * @param {number} currentSavings          Total current retirement savings
 * @param {number} annualContribution      Annual contribution to retirement accounts
 * @param {number} desiredAnnualSpending   Target spending in retirement
 * @param {number} otherAnnualIncome       CPP, OAS, pension income expected
 * @param {number} preRetRealReturn        Real return before retirement
 * @param {number} postRetRealReturn       Real return after retirement
 *
 * @return {Array[]} Score and analysis
 *
 * Example:
 * =RETIREMENT_READINESS_SCORE(40, 65, 90, 250000, 24000, 60000, 25000, 0.04, 0.02)
 */
function RETIREMENT_READINESS_SCORE(
  currentAge, retirementAge, lifeExpectancy, currentSavings,
  annualContribution, desiredAnnualSpending, otherAnnualIncome,
  preRetRealReturn, postRetRealReturn
) {
  currentAge            = Number(currentAge);
  retirementAge         = Number(retirementAge);
  lifeExpectancy        = Number(lifeExpectancy);
  currentSavings        = Number(currentSavings);
  annualContribution    = Number(annualContribution);
  desiredAnnualSpending = Number(desiredAnnualSpending);
  otherAnnualIncome     = Number(otherAnnualIncome) || 0;
  preRetRealReturn      = Number(preRetRealReturn) || 0.04;
  postRetRealReturn     = Number(postRetRealReturn) || 0.02;

  var yearsToRetirement = retirementAge - currentAge;

  // Calculate projected savings at retirement
  var projectedSavings = futureValueReal_(currentSavings, annualContribution, preRetRealReturn, yearsToRetirement);

  // Calculate target savings needed
  var targetSavings = RETIREMENT_SAVINGS_TARGET(
    desiredAnnualSpending, retirementAge, lifeExpectancy,
    otherAnnualIncome, postRetRealReturn
  );

  if (typeof targetSavings === 'string') {
    return [[targetSavings]];
  }

  // Calculate score
  var score = Math.min(100, Math.round((projectedSavings / targetSavings) * 100));
  var surplus = projectedSavings - targetSavings;
  var status;

  if (score >= 100) {
    status = "On Track ✓";
  } else if (score >= 80) {
    status = "Nearly There";
  } else if (score >= 60) {
    status = "Needs Attention";
  } else {
    status = "Significant Gap";
  }

  return [
    ["Metric", "Value"],
    ["Readiness Score", score + "%"],
    ["Status", status],
    ["Target Savings Needed", Math.round(targetSavings)],
    ["Projected Savings", Math.round(projectedSavings)],
    ["Surplus / (Shortfall)", Math.round(surplus)],
    ["Years to Retirement", yearsToRetirement],
    ["Annual Contribution", annualContribution]
  ];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 18 – CPP Survivor Benefits Calculator
 * ----------------------------------------------------------------------
 *
 * Calculates CPP survivor pension for a surviving spouse.
 * Uses constants from CPP_2024 object for consistency.
 */

/**
 * CPP_SURVIVOR_BENEFIT
 *
 * Calculates the CPP survivor pension for a surviving spouse.
 *
 * @param {number} deceasedCPP         Deceased's CPP pension (or estimated if not receiving)
 * @param {number} survivorAge         Survivor's age
 * @param {boolean} survivorReceivesCPP  Is survivor already receiving their own CPP?
 * @param {number} survivorCPP         Survivor's own CPP amount (if receiving)
 *
 * @return {number} Monthly survivor benefit
 *
 * Example:
 * =CPP_SURVIVOR_BENEFIT(1000, 55, FALSE, 0)
 */
function CPP_SURVIVOR_BENEFIT(deceasedCPP, survivorAge, survivorReceivesCPP, survivorCPP) {
  deceasedCPP          = Number(deceasedCPP);
  survivorAge          = Number(survivorAge);
  var isReceiving      = asBool_(survivorReceivesCPP);
  survivorCPP          = Number(survivorCPP) || 0;

  if (deceasedCPP < 0 || survivorAge < 0) {
    return "ERROR: Values must be non-negative";
  }

  var survivorBenefit;

  if (survivorAge < 65) {
    // Under 65: Flat rate + 37.5% of deceased's pension
    survivorBenefit = CPP_2024.FLAT_RATE_UNDER_65 + (deceasedCPP * 0.375);
    survivorBenefit = Math.min(survivorBenefit, CPP_2024.MAX_SURVIVOR_UNDER_65);
  } else {
    // 65 and over: 60% of deceased's pension
    survivorBenefit = deceasedCPP * 0.60;
    survivorBenefit = Math.min(survivorBenefit, CPP_2024.MAX_SURVIVOR_65_PLUS);
  }

  // If survivor already receives CPP, combined benefit is capped
  if (isReceiving && survivorCPP > 0) {
    // Combined benefit cannot exceed maximum single retirement pension
    var maxRetirement = CPP_2024.MAX_MONTHLY_BENEFIT_AT_65;
    var combined = survivorCPP + survivorBenefit;
    if (combined > maxRetirement) {
      survivorBenefit = Math.max(0, maxRetirement - survivorCPP);
    }
  }

  return Math.round(survivorBenefit * 100) / 100;
}

/**
 * CPP_DEATH_BENEFIT
 *
 * Returns the CPP lump-sum death benefit.
 *
 * @return {number} Death benefit amount (fixed at $2,500)
 */
function CPP_DEATH_BENEFIT() {
  return CPP_2024.DEATH_BENEFIT;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 19 – Pension Income Splitting Calculator
 * ----------------------------------------------------------------------
 *
 * Calculates tax savings from pension income splitting between spouses.
 */

/**
 * PENSION_INCOME_SPLIT
 *
 * Calculates optimal pension income splitting between spouses
 * and potential tax savings.
 *
 * Rules:
 * - Up to 50% of eligible pension income can be split
 * - Must be 65+ for RRIF/RRSP income (or any age for DB pension)
 * - Both spouses must be Canadian residents
 *
 * @param {number} higherSpouseIncome    Higher-income spouse's total income
 * @param {number} lowerSpouseIncome     Lower-income spouse's total income
 * @param {number} eligiblePensionIncome Pension income eligible for splitting
 * @param {string} province              Province code
 *
 * @return {Array[]} Analysis of income splitting benefits
 *
 * Example:
 * =PENSION_INCOME_SPLIT(80000, 20000, 40000, "ON")
 */
function PENSION_INCOME_SPLIT(higherSpouseIncome, lowerSpouseIncome, eligiblePensionIncome, province) {
  higherSpouseIncome    = Number(higherSpouseIncome);
  lowerSpouseIncome     = Number(lowerSpouseIncome);
  eligiblePensionIncome = Number(eligiblePensionIncome);
  province              = (province || "ON").toString().trim().toUpperCase();

  if (higherSpouseIncome < 0 || lowerSpouseIncome < 0 || eligiblePensionIncome < 0) {
    return [["ERROR: Values must be non-negative"]];
  }

  // Maximum split is 50% of eligible pension income
  var maxSplit = eligiblePensionIncome * 0.50;

  // Calculate tax without splitting
  var taxWithoutSplitHigher = ESTIMATE_TAX(higherSpouseIncome, province);
  var taxWithoutSplitLower = ESTIMATE_TAX(lowerSpouseIncome, province);

  if (typeof taxWithoutSplitHigher === 'string' || typeof taxWithoutSplitLower === 'string') {
    return [["ERROR: Province not supported"]];
  }

  var totalTaxWithout = taxWithoutSplitHigher + taxWithoutSplitLower;

  // Find optimal split amount using 1% increments for accuracy
  var optimalSplit = 0;
  var minTax = totalTaxWithout;

  for (var splitPct = 0; splitPct <= 50; splitPct += 1) {
    var splitAmount = eligiblePensionIncome * (splitPct / 100);
    var newHigherIncome = higherSpouseIncome - splitAmount;
    var newLowerIncome = lowerSpouseIncome + splitAmount;

    var newTaxHigher = ESTIMATE_TAX(newHigherIncome, province);
    var newTaxLower = ESTIMATE_TAX(newLowerIncome, province);

    if (typeof newTaxHigher === 'number' && typeof newTaxLower === 'number') {
      var newTotalTax = newTaxHigher + newTaxLower;
      if (newTotalTax < minTax) {
        minTax = newTotalTax;
        optimalSplit = splitAmount;
      }
    }
  }

  var taxSavings = totalTaxWithout - minTax;

  return [
    ["Metric", "Value"],
    ["Eligible Pension Income", eligiblePensionIncome],
    ["Maximum Splittable (50%)", maxSplit],
    ["Optimal Split Amount", Math.round(optimalSplit)],
    ["Tax Without Splitting", Math.round(totalTaxWithout)],
    ["Tax With Optimal Split", Math.round(minTax)],
    ["Annual Tax Savings", Math.round(taxSavings)],
    ["Higher Spouse New Income", Math.round(higherSpouseIncome - optimalSplit)],
    ["Lower Spouse New Income", Math.round(lowerSpouseIncome + optimalSplit)]
  ];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 20 – Estate & Beneficiary Tax Calculator
 * ----------------------------------------------------------------------
 *
 * Calculates taxes owing on death for RRSP/RRIF accounts.
 */

/**
 * ESTATE_TAX_RRSP
 *
 * Calculates the tax owing when RRSP/RRIF is collapsed upon death.
 *
 * When the account holder dies:
 * - If transferred to spouse: No immediate tax (rollover)
 * - If transferred to financially dependent child/grandchild: Possible rollover
 * - Otherwise: Full balance taxed as income in final return
 *
 * @param {number} rrspBalance           RRSP/RRIF balance at death
 * @param {number} otherIncomeInYear     Other income in year of death
 * @param {string} province              Province of residence
 * @param {boolean} hasSpouse            Does deceased have a surviving spouse?
 *
 * @return {Array[]} Estate tax analysis
 *
 * Example:
 * =ESTATE_TAX_RRSP(500000, 30000, "ON", FALSE)
 */
function ESTATE_TAX_RRSP(rrspBalance, otherIncomeInYear, province, hasSpouse) {
  rrspBalance        = Number(rrspBalance);
  otherIncomeInYear  = Number(otherIncomeInYear) || 0;
  province           = (province || "ON").toString().trim().toUpperCase();
  var hasSpouseBool  = asBool_(hasSpouse);

  if (rrspBalance < 0) {
    return [["ERROR: rrspBalance must be >= 0"]];
  }

  // If spouse exists, can roll over tax-free
  if (hasSpouseBool) {
    return [
      ["Metric", "Value"],
      ["RRSP/RRIF Balance", rrspBalance],
      ["Spouse Rollover", "Available"],
      ["Immediate Tax Owing", 0],
      ["Note", "Tax-free rollover to spouse's RRSP/RRIF"]
    ];
  }

  // No spouse - full balance is taxable income
  var totalIncome = otherIncomeInYear + rrspBalance;
  var taxOnTotal = ESTIMATE_TAX(totalIncome, province);
  var taxOnOther = ESTIMATE_TAX(otherIncomeInYear, province);

  if (typeof taxOnTotal !== 'number' || typeof taxOnOther !== 'number') {
    return [["ERROR: Province not supported"]];
  }

  var taxOnRRSP = taxOnTotal - taxOnOther;
  var effectiveRate = (taxOnRRSP / rrspBalance) * 100;
  var netToEstate = rrspBalance - taxOnRRSP;

  return [
    ["Metric", "Value"],
    ["RRSP/RRIF Balance", rrspBalance],
    ["Other Income in Year", otherIncomeInYear],
    ["Total Taxable Income", totalIncome],
    ["Tax on RRSP/RRIF", Math.round(taxOnRRSP)],
    ["Effective Tax Rate", Math.round(effectiveRate * 10) / 10 + "%"],
    ["Net to Estate", Math.round(netToEstate)],
    ["Province", province]
  ];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 21 – Inflation-Adjusted Future Value Calculator
 * ----------------------------------------------------------------------
 *
 * Calculates what amounts will be worth in future or today's dollars.
 */

/**
 * FUTURE_VALUE_INFLATION
 *
 * Calculates the future nominal value needed to have the same
 * purchasing power as today's amount.
 *
 * @param {number} todayAmount     Amount in today's dollars
 * @param {number} years           Years into the future
 * @param {number} inflationRate   Expected annual inflation rate
 *
 * @return {number} Future nominal amount needed
 *
 * Example:
 * =FUTURE_VALUE_INFLATION(50000, 25, 0.02)
 * → $82,030 (what $50,000 today will need to be in 25 years)
 */
function FUTURE_VALUE_INFLATION(todayAmount, years, inflationRate) {
  todayAmount   = Number(todayAmount);
  years         = Number(years);
  inflationRate = Number(inflationRate) || 0.02;

  if (todayAmount < 0 || years < 0) {
    return "ERROR: Values must be non-negative";
  }

  return Math.round(todayAmount * Math.pow(1 + inflationRate, years) * 100) / 100;
}

/**
 * PRESENT_VALUE_INFLATION
 *
 * Calculates today's value of a future nominal amount.
 *
 * @param {number} futureAmount    Amount in future nominal dollars
 * @param {number} years           Years from now
 * @param {number} inflationRate   Expected annual inflation rate
 *
 * @return {number} Present value in today's dollars
 *
 * Example:
 * =PRESENT_VALUE_INFLATION(100000, 25, 0.02)
 * → $60,953 (what $100,000 in 25 years is worth today)
 */
function PRESENT_VALUE_INFLATION(futureAmount, years, inflationRate) {
  futureAmount  = Number(futureAmount);
  years         = Number(years);
  inflationRate = Number(inflationRate) || 0.02;

  if (futureAmount < 0 || years < 0) {
    return "ERROR: Values must be non-negative";
  }

  return Math.round(futureAmount / Math.pow(1 + inflationRate, years) * 100) / 100;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 22 – Net Worth Summary Calculator
 * ----------------------------------------------------------------------
 *
 * Provides a comprehensive net worth snapshot.
 */

/**
 * NET_WORTH_SUMMARY
 *
 * Calculates total net worth across all account types.
 *
 * @param {number} rrspBalance       RRSP/RRIF balance
 * @param {number} tfsaBalance       TFSA balance
 * @param {number} nonRegBalance     Non-registered investment balance
 * @param {number} homeEquity        Home equity (value - mortgage)
 * @param {number} otherAssets       Other assets (vehicles, etc.)
 * @param {number} debts             Total debts (excluding mortgage)
 * @param {number} marginalTaxRate   Marginal tax rate (for RRSP after-tax value)
 *
 * @return {Array[]} Net worth breakdown
 *
 * Example:
 * =NET_WORTH_SUMMARY(400000, 100000, 50000, 300000, 30000, 10000, 0.35)
 */
function NET_WORTH_SUMMARY(rrspBalance, tfsaBalance, nonRegBalance, homeEquity, otherAssets, debts, marginalTaxRate) {
  rrspBalance     = Number(rrspBalance) || 0;
  tfsaBalance     = Number(tfsaBalance) || 0;
  nonRegBalance   = Number(nonRegBalance) || 0;
  homeEquity      = Number(homeEquity) || 0;
  otherAssets     = Number(otherAssets) || 0;
  debts           = Number(debts) || 0;
  marginalTaxRate = Number(marginalTaxRate) || 0.30;

  // Calculate after-tax values
  var rrspAfterTax = rrspBalance * (1 - marginalTaxRate);
  var tfsaAfterTax = tfsaBalance;  // Tax-free
  // Non-reg: Assume 50% of balance is capital gain, with 50% inclusion rate
  // Effective tax = marginalTaxRate * 0.5 (gain portion) * 0.5 (inclusion) = 0.25 * marginalTaxRate
  var nonRegAfterTax = nonRegBalance * (1 - marginalTaxRate * 0.25);

  var totalGross = rrspBalance + tfsaBalance + nonRegBalance + homeEquity + otherAssets - debts;
  var totalAfterTax = rrspAfterTax + tfsaAfterTax + nonRegAfterTax + homeEquity + otherAssets - debts;

  // Liquid vs illiquid
  var liquidAssets = rrspBalance + tfsaBalance + nonRegBalance;
  var illiquidAssets = homeEquity + otherAssets;

  return [
    ["Category", "Gross Value", "After-Tax Value"],
    ["RRSP/RRIF", rrspBalance, Math.round(rrspAfterTax)],
    ["TFSA", tfsaBalance, tfsaBalance],
    ["Non-Registered", nonRegBalance, Math.round(nonRegAfterTax)],
    ["Home Equity", homeEquity, homeEquity],
    ["Other Assets", otherAssets, otherAssets],
    ["Less: Debts", -debts, -debts],
    ["─────────", "─────────", "─────────"],
    ["TOTAL NET WORTH", Math.round(totalGross), Math.round(totalAfterTax)],
    ["", "", ""],
    ["Liquid Assets", liquidAssets, ""],
    ["Illiquid Assets", illiquidAssets, ""]
  ];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 23 – Required Savings Rate Calculator
 * ----------------------------------------------------------------------
 *
 * Calculates how much you need to save annually to reach your goal.
 */

/**
 * REQUIRED_SAVINGS_RATE
 *
 * Calculates the annual savings needed to reach your retirement goal.
 *
 * @param {number} currentAge           Current age
 * @param {number} retirementAge        Retirement age
 * @param {number} currentSavings       Current total savings
 * @param {number} targetSavings        Target savings at retirement
 * @param {number} preRetRealReturn     Real return before retirement
 *
 * @return {number} Annual savings needed
 *
 * Example:
 * =REQUIRED_SAVINGS_RATE(40, 65, 100000, 1000000, 0.04)
 */
function REQUIRED_SAVINGS_RATE(currentAge, retirementAge, currentSavings, targetSavings, preRetRealReturn) {
  currentAge       = Number(currentAge);
  retirementAge    = Number(retirementAge);
  currentSavings   = Number(currentSavings);
  targetSavings    = Number(targetSavings);
  preRetRealReturn = Number(preRetRealReturn) || 0.04;

  var years = retirementAge - currentAge;

  if (years <= 0) {
    return "ERROR: retirementAge must be > currentAge";
  }

  // Future value of current savings
  var fvCurrent = currentSavings * Math.pow(1 + preRetRealReturn, years);

  // Gap to fill with annual contributions
  var gap = targetSavings - fvCurrent;

  if (gap <= 0) {
    return 0;  // Already on track with current savings
  }

  // PMT formula: gap = PMT * ((1+r)^n - 1) / r
  if (Math.abs(preRetRealReturn) < 1e-8) {
    return Math.round(gap / years);
  }

  var annuityFactor = (Math.pow(1 + preRetRealReturn, years) - 1) / preRetRealReturn;
  var annualSavings = gap / annuityFactor;

  return Math.round(annualSavings);
}


/**
 * ----------------------------------------------------------------------
 * SECTION 24 – Enhanced CPP Benefit (Post-2019 Enhancement)
 * ----------------------------------------------------------------------
 *
 * The CPP enhancement increases the base replacement rate from 25% to 33.33%
 * of average earnings up to the YMPE, and adds a second tier (YAMPE) covering
 * earnings between 100% and 114% of YMPE with an additional 8.33% replacement rate.
 * The enhancement is phased in for contributions after 2019 and only applies to those years.
 */

/**
 * CPP_ENHANCED_BENEFIT
 *
 * Calculates CPP including the enhanced portion for contributions after 2019.
 * The CPP enhancement increases the replacement rate from 25% to 33.33% of 
 * average earnings up to the YMPE, and adds a second tier (YAMPE) for earnings 
 * between 100% and 114% of YMPE with an additional 8.33% replacement rate.
 * The enhancement only applies to contributions made after 2019.
 *
 * Note: This is a simplified estimate. The actual CPP enhancement calculation
 * is complex and depends on your specific earnings history. For accurate 
 * estimates, use your My Service Canada Account statement.
 *
 * @param {number} averageEarnings    Average annual pensionable earnings
 * @param {number} contributionYears  Total years with CPP contributions
 * @param {number} yearsAfter2019     Years of contributions after 2019
 * @param {number} startAge           Age to start CPP (60-70)
 * @return {number} Estimated monthly CPP benefit including enhancement
 *
 * Example:
 * =CPP_ENHANCED_BENEFIT(70000, 40, 5, 65)
 */
function CPP_ENHANCED_BENEFIT(averageEarnings, contributionYears, yearsAfter2019, startAge) {
  averageEarnings   = Number(averageEarnings);
  contributionYears = Number(contributionYears);
  yearsAfter2019    = Number(yearsAfter2019);
  startAge          = Number(startAge);

  // Input validation
  if (averageEarnings < 0) {
    return "ERROR: averageEarnings must be >= 0";
  }
  if (contributionYears < 0) {
    return "ERROR: contributionYears must be >= 0";
  }
  if (yearsAfter2019 < 0) {
    return "ERROR: yearsAfter2019 must be >= 0";
  }
  if (startAge < CPP_2024.MIN_START_AGE || startAge > CPP_2024.MAX_START_AGE) {
    return "ERROR: startAge must be between 60 and 70";
  }

  // Cap contribution years
  var effectiveYears = Math.min(contributionYears, CPP_2024.CONTRIBUTION_YEARS_FOR_MAX);
  var yearsRatio = effectiveYears / CPP_2024.CONTRIBUTION_YEARS_FOR_MAX;

  // Enhanced CPP calculation - phases in over 40 years (2019-2059)
  var maxEnhancementYears = 40;
  var effectiveEnhancementYears = Math.min(yearsAfter2019, maxEnhancementYears);
  var enhancementPhaseIn = effectiveEnhancementYears / maxEnhancementYears;

  // Calculate base CPP (25% replacement rate on earnings up to YMPE)
  var earningsUpToYMPE = Math.min(averageEarnings, CPP_2024.YMPE);
  var baseReplacementRate = 0.25;
  var baseBenefitAt65 = (earningsUpToYMPE / 12) * baseReplacementRate * yearsRatio;

  // Enhanced portion: additional 8.33% (33.33% - 25%) on earnings up to YMPE
  // Only applies proportionally to years after 2019
  var enhancementRate = 0.0833 * enhancementPhaseIn;
  var enhancedPortion = (earningsUpToYMPE / 12) * enhancementRate * yearsRatio;

  // Second tier (YAMPE): 8.33% on earnings between YMPE and YAMPE (114% of YMPE)
  // This only applies to contributions after 2019
  var YAMPE = CPP_2024.YMPE * 1.14;
  var earningsInSecondTier = Math.min(Math.max(0, averageEarnings - CPP_2024.YMPE), YAMPE - CPP_2024.YMPE);
  var secondTierRate = 0.0833 * enhancementPhaseIn;
  var secondTierPortion = (earningsInSecondTier / 12) * secondTierRate * yearsRatio;

  // Total benefit at age 65
  var totalBenefitAt65 = baseBenefitAt65 + enhancedPortion + secondTierPortion;

  // Apply start age adjustment
  var monthsFromNormal = (startAge - CPP_2024.NORMAL_AGE) * 12;
  var adjustment;
  if (monthsFromNormal < 0) {
    // Early (before 65): reduce by 0.6% per month
    adjustment = 1 + (monthsFromNormal * CPP_2024.EARLY_REDUCTION_PER_MONTH);
  } else if (monthsFromNormal > 0) {
    // Late (after 65): increase by 0.7% per month
    adjustment = 1 + (monthsFromNormal * CPP_2024.LATE_INCREASE_PER_MONTH);
  } else {
    adjustment = 1;
  }

  var monthlyBenefit = totalBenefitAt65 * adjustment;

  return Math.round(monthlyBenefit * 100) / 100;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 25 – Withdrawal Schedule Calculator
 * ----------------------------------------------------------------------
 *
 * Projects portfolio withdrawals over time with inflation adjustments
 * and tracks remaining portfolio balance.
 */

/**
 * WITHDRAWAL_SCHEDULE
 *
 * Projects year-by-year withdrawals from a portfolio, tracking both
 * the withdrawal amounts (adjusted for inflation) and remaining 
 * portfolio balance. Helps visualize the sustainability of your
 * withdrawal strategy.
 *
 * @param {number} portfolioValue   Current portfolio value
 * @param {number} withdrawalRate   Initial annual withdrawal rate (e.g., 0.04 for 4%)
 * @param {number} inflationRate    Expected inflation rate
 * @param {number} nominalReturn    Expected nominal investment return
 * @param {number} years            Number of years to project
 * @return {Array[]} Year-by-year schedule with withdrawals and portfolio balance
 *
 * Example:
 * =WITHDRAWAL_SCHEDULE(1000000, 0.04, 0.02, 0.06, 30)
 */
function WITHDRAWAL_SCHEDULE(portfolioValue, withdrawalRate, inflationRate, nominalReturn, years) {
  portfolioValue = Number(portfolioValue);
  withdrawalRate = Number(withdrawalRate);
  inflationRate  = Number(inflationRate);
  nominalReturn  = Number(nominalReturn) || 0.05;
  years          = Number(years);

  // Input validation
  if (portfolioValue <= 0) {
    return [["ERROR: portfolioValue must be > 0"]];
  }
  if (withdrawalRate <= 0 || withdrawalRate > 1) {
    return [["ERROR: withdrawalRate must be between 0 and 1"]];
  }
  if (years <= 0) {
    return [["ERROR: years must be > 0"]];
  }

  var results = [["Year", "Withdrawal", "Portfolio Start", "Portfolio End", "Sustainable?"]];

  var initialWithdrawal = portfolioValue * withdrawalRate;
  var balance = portfolioValue;
  var depleted = false;
  var depletionYear = 0;

  for (var year = 1; year <= years; year++) {
    var portfolioStart = balance;
    
    // Withdrawal increases with inflation to maintain purchasing power (nominal dollars)
    var withdrawal = initialWithdrawal * Math.pow(1 + inflationRate, year - 1);
    
    // Check if portfolio is depleted
    if (balance <= 0 || depleted) {
      if (!depleted) {
        depletionYear = year;
        depleted = true;
      }
      results.push([
        year,
        0,
        0,
        0,
        "DEPLETED in year " + depletionYear
      ]);
      continue;
    }

    // Withdraw at start of year
    var actualWithdrawal = Math.min(withdrawal, balance);
    balance -= actualWithdrawal;

    // Apply investment return on remaining balance (nominal return)
    balance = balance * (1 + nominalReturn);

    var sustainable = balance > 0 ? "Yes" : "No - depleted";
    if (balance > portfolioValue) {
      sustainable = "Yes - growing";
    }

    results.push([
      year,
      Math.round(actualWithdrawal),
      Math.round(portfolioStart),
      Math.round(balance),
      sustainable
    ]);

    if (balance <= 0) {
      depleted = true;
      depletionYear = year;
    }
  }

  // Add summary
  results.push(["", "", "", "", ""]);
  if (depleted) {
    results.push(["WARNING:", "Portfolio depletes in year " + depletionYear, "", "", ""]);
    results.push(["Suggestion:", "Reduce withdrawal rate or increase returns", "", "", ""]);
  } else {
    results.push(["SUCCESS:", "Portfolio sustainable for " + years + " years", "", "", ""]);
    results.push(["Final Balance:", "$" + Math.round(balance).toLocaleString(), "", "", ""]);
  }

  return results;
}

/**
 * SAFE_WITHDRAWAL_RATE (Deprecated - use WITHDRAWAL_SCHEDULE instead)
 *
 * Simple inflation-adjusted withdrawal schedule. Does not track portfolio
 * balance or validate sustainability. For a complete analysis, use
 * WITHDRAWAL_SCHEDULE instead.
 *
 * @param {number} portfolioValue   Current portfolio value
 * @param {number} withdrawalRate   Annual withdrawal rate (e.g., 0.04 for 4%)
 * @param {number} inflationRate    Expected inflation rate
 * @param {number} years            Number of years to project
 * @return {Array[]} Year-by-year withdrawal schedule
 *
 * Example:
 * =SAFE_WITHDRAWAL_RATE(1000000, 0.04, 0.02, 30)
 */
function SAFE_WITHDRAWAL_RATE(portfolioValue, withdrawalRate, inflationRate, years) {
  portfolioValue = Number(portfolioValue);
  withdrawalRate = Number(withdrawalRate);
  inflationRate  = Number(inflationRate);
  years          = Number(years);

  // Input validation
  if (portfolioValue <= 0) {
    return [["ERROR: portfolioValue must be > 0"]];
  }
  if (withdrawalRate <= 0 || withdrawalRate > 1) {
    return [["ERROR: withdrawalRate must be between 0 and 1"]];
  }
  if (years <= 0) {
    return [["ERROR: years must be > 0"]];
  }

  var results = [["Year", "Withdrawal (Nominal)", "Withdrawal (Real)", "Cumulative Withdrawn", "Notes"]];

  var initialWithdrawal = portfolioValue * withdrawalRate;
  var cumulativeWithdrawn = 0;

  for (var year = 1; year <= years; year++) {
    // Withdrawal increases with inflation to maintain purchasing power
    var nominalWithdrawal = initialWithdrawal * Math.pow(1 + inflationRate, year - 1);
    var realWithdrawal = initialWithdrawal; // Constant in real terms
    cumulativeWithdrawn += nominalWithdrawal;

    var notes = "";
    if (year === 1) {
      notes = "Initial withdrawal: " + Math.round(withdrawalRate * 100 * 10) / 10 + "% of portfolio";
    } else if (year === 10) {
      notes = "10-year milestone";
    } else if (year === 20) {
      notes = "20-year milestone";
    } else if (year === 30) {
      notes = "30-year milestone";
    }

    results.push([
      year,
      Math.round(nominalWithdrawal),
      Math.round(realWithdrawal),
      Math.round(cumulativeWithdrawn),
      notes
    ]);
  }

  return results;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 26 – CPP/OAS Break-Even Age Calculators
 * ----------------------------------------------------------------------
 *
 * Calculates the age at which delaying CPP/OAS becomes more valuable
 * than taking it early.
 */

/**
 * CPP_BREAKEVEN_AGE
 *
 * Calculates the age at which delaying CPP becomes more valuable than
 * taking it early. Helps users decide optimal CPP start age.
 *
 * @param {number} benefit60    Monthly CPP if starting at 60
 * @param {number} benefit65    Monthly CPP if starting at 65
 * @param {number} benefit70    Monthly CPP if starting at 70
 * @return {Array[]} Break-even analysis table
 *
 * Example:
 * =CPP_BREAKEVEN_AGE(600, 1000, 1420)
 */
function CPP_BREAKEVEN_AGE(benefit60, benefit65, benefit70) {
  benefit60 = Number(benefit60);
  benefit65 = Number(benefit65);
  benefit70 = Number(benefit70);

  // Input validation
  if (benefit60 < 0 || benefit65 < 0 || benefit70 < 0) {
    return [["ERROR: All benefits must be >= 0"]];
  }

  var results = [["Comparison", "Break-Even Age", "Cumulative at Break-Even", "Notes"]];

  // Calculate break-even: Age 60 vs Age 65
  // At break-even: 60_benefit * (age - 60) * 12 = 65_benefit * (age - 65) * 12
  // Solving: age = (benefit60 * 60 - benefit65 * 65) / (benefit65 - benefit60)
  var breakeven60vs65;
  if (benefit65 > benefit60) {
    breakeven60vs65 = (benefit60 * 60 - benefit65 * 65) / (benefit65 - benefit60);
    // Check if break-even is reasonable
    if (breakeven60vs65 < 65 || breakeven60vs65 > 100) {
      results.push(["Age 60 vs 65", "N/A", "", "No break-even within reasonable lifespan"]);
    } else {
      var cumulative60at65be = benefit60 * 12 * (breakeven60vs65 - 60);
      results.push([
        "Age 60 vs 65",
        Math.round(breakeven60vs65 * 10) / 10,
        "$" + Math.round(cumulative60at65be).toLocaleString(),
        "Before this age, starting at 60 is better"
      ]);
    }
  } else {
    results.push(["Age 60 vs 65", "Never", "", "Starting at 60 always better"]);
  }

  // Calculate break-even: Age 65 vs Age 70
  var breakeven65vs70;
  if (benefit70 > benefit65) {
    breakeven65vs70 = (benefit65 * 65 - benefit70 * 70) / (benefit65 - benefit70);
    if (breakeven65vs70 < 70 || breakeven65vs70 > 100) {
      results.push(["Age 65 vs 70", "N/A", "", "No break-even within reasonable lifespan"]);
    } else {
      var cumulative65at70be = benefit65 * 12 * (breakeven65vs70 - 65);
      results.push([
        "Age 65 vs 70",
        Math.round(breakeven65vs70 * 10) / 10,
        "$" + Math.round(cumulative65at70be).toLocaleString(),
        "Before this age, starting at 65 is better"
      ]);
    }
  } else {
    results.push(["Age 65 vs 70", "Never", "", "Starting at 65 always better"]);
  }

  // Calculate break-even: Age 60 vs Age 70
  var breakeven60vs70;
  if (benefit70 > benefit60) {
    breakeven60vs70 = (benefit60 * 60 - benefit70 * 70) / (benefit70 - benefit60);
    if (breakeven60vs70 < 70 || breakeven60vs70 > 100) {
      results.push(["Age 60 vs 70", "N/A", "", "No break-even within reasonable lifespan"]);
    } else {
      var cumulative60at70be = benefit60 * 12 * (breakeven60vs70 - 60);
      results.push([
        "Age 60 vs 70",
        Math.round(breakeven60vs70 * 10) / 10,
        "$" + Math.round(cumulative60at70be).toLocaleString(),
        "Before this age, starting at 60 is better"
      ]);
    }
  } else {
    results.push(["Age 60 vs 70", "Never", "", "Starting at 60 always better"]);
  }

  // Add summary
  results.push(["", "", "", ""]);
  results.push(["Monthly Benefits:", "", "", ""]);
  results.push(["At Age 60", "$" + benefit60, "", "(36% reduction from 65)"]);
  results.push(["At Age 65", "$" + benefit65, "", "(standard amount)"]);
  results.push(["At Age 70", "$" + benefit70, "", "(42% increase from 65)"]);

  return results;
}

/**
 * OAS_BREAKEVEN_AGE
 *
 * Calculates the age at which delaying OAS becomes more valuable than
 * taking it at 65.
 *
 * @param {number} yearsInCanada    Years of Canadian residence after age 18 (max 40)
 * @return {Array[]} Break-even analysis table
 *
 * Example:
 * =OAS_BREAKEVEN_AGE(40)
 */
function OAS_BREAKEVEN_AGE(yearsInCanada) {
  yearsInCanada = Number(yearsInCanada);

  // Input validation
  if (yearsInCanada < OAS_2024.MIN_RESIDENCE_YEARS) {
    return [["ERROR: Minimum 10 years residence required for OAS"]];
  }

  // Cap years at maximum (40 years for full OAS)
  yearsInCanada = Math.min(yearsInCanada, OAS_2024.FULL_RESIDENCE_YEARS);

  // Calculate OAS at different start ages
  var benefit65 = OAS_BENEFIT(yearsInCanada, 65, 65);
  var benefit66 = OAS_BENEFIT(yearsInCanada, 66, 66);
  var benefit67 = OAS_BENEFIT(yearsInCanada, 67, 67);
  var benefit68 = OAS_BENEFIT(yearsInCanada, 68, 68);
  var benefit69 = OAS_BENEFIT(yearsInCanada, 69, 69);
  var benefit70 = OAS_BENEFIT(yearsInCanada, 70, 70);

  if (typeof benefit65 === 'string') {
    return [[benefit65]];
  }

  var results = [["Start Age", "Monthly Benefit", "Deferral Bonus", "Break-Even vs 65", "Notes"]];

  // Age 65 (baseline)
  results.push([65, "$" + Math.round(benefit65 * 100) / 100, "0%", "-", "Baseline - earliest start"]);

  // Calculate break-even for each deferral option vs 65
  var deferralAges = [66, 67, 68, 69, 70];
  var benefits = [benefit66, benefit67, benefit68, benefit69, benefit70];

  for (var i = 0; i < deferralAges.length; i++) {
    var age = deferralAges[i];
    var benefit = benefits[i];
    var deferralMonths = (age - 65) * 12;
    var deferralBonus = deferralMonths * 0.6;

    // Break-even calculation
    // At break-even: benefit65 * (breakeven - 65) * 12 = benefit * (breakeven - age) * 12
    var breakeven;
    if (benefit > benefit65) {
      breakeven = (benefit65 * 65 - benefit * age) / (benefit - benefit65);
      if (breakeven < age || breakeven > 100) {
        breakeven = "N/A";
      } else {
        breakeven = Math.round(breakeven * 10) / 10;
      }
    } else {
      breakeven = "Never";
    }

    var notes = "";
    if (age === 70) {
      notes = "Maximum deferral (36% bonus)";
    }

    results.push([
      age,
      "$" + Math.round(benefit * 100) / 100,
      deferralBonus + "%",
      breakeven,
      notes
    ]);
  }

  // Add key insight
  results.push(["", "", "", "", ""]);
  results.push(["Key Insight:", "", "", "", "If you expect to live past the break-even age, deferral is beneficial"]);

  return results;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 27 – Enhanced Tax Estimation with Senior Credits
 * ----------------------------------------------------------------------
 *
 * Enhanced tax estimation including age credit and pension income credit.
 */

/**
 * ESTIMATE_TAX_WITH_CREDITS
 *
 * Enhanced tax estimation including:
 * - Age Credit (for 65+): $8,396 federal (2024)
 * - Pension Income Credit: Up to $2,000 of eligible pension income
 *
 * @param {number} taxableIncome           Taxable income
 * @param {string} province                Province code
 * @param {number} age                     Age of taxpayer (for age credit eligibility)
 * @param {number} eligiblePensionIncome   Eligible pension income for pension credit
 * @return {number} Estimated tax after credits
 *
 * Example:
 * =ESTIMATE_TAX_WITH_CREDITS(60000, "ON", 68, 15000)
 */
function ESTIMATE_TAX_WITH_CREDITS(taxableIncome, province, age, eligiblePensionIncome) {
  taxableIncome          = Number(taxableIncome);
  province               = (province || "ON").toString().trim().toUpperCase();
  age                    = Number(age) || 0;
  eligiblePensionIncome  = Number(eligiblePensionIncome) || 0;

  if (taxableIncome < 0) {
    return "ERROR: taxableIncome must be >= 0";
  }

  if (!PROVINCIAL_TAX_2024[province]) {
    return "ERROR: Province not supported. Use: ON, BC, AB, QC, SK, MB, NS, NB, PE, NL, YT, NT, NU";
  }

  // Start with base tax calculation
  var baseTax = ESTIMATE_TAX(taxableIncome, province);
  if (typeof baseTax === 'string') {
    return baseTax;
  }

  var totalCredits = 0;

  // Age Credit (federal) - for age 65+
  if (age >= 65) {
    var ageAmount = TAX_CREDITS_2024.FEDERAL_AGE_AMOUNT;

    // Age amount is reduced if income exceeds threshold
    if (taxableIncome > TAX_CREDITS_2024.FEDERAL_AGE_INCOME_THRESHOLD) {
      var reduction = (taxableIncome - TAX_CREDITS_2024.FEDERAL_AGE_INCOME_THRESHOLD) * TAX_CREDITS_2024.FEDERAL_AGE_CLAWBACK_RATE;
      ageAmount = Math.max(0, ageAmount - reduction);
    }

    // Convert age amount to credit at lowest federal rate
    var ageCredit = ageAmount * TAX_CREDITS_2024.FEDERAL_LOWEST_RATE;
    totalCredits += ageCredit;
  }

  // Pension Income Credit (federal) - up to $2,000 of eligible pension income
  if (eligiblePensionIncome > 0) {
    var pensionCreditAmount = Math.min(eligiblePensionIncome, TAX_CREDITS_2024.FEDERAL_PENSION_CREDIT_MAX);
    var pensionCredit = pensionCreditAmount * TAX_CREDITS_2024.FEDERAL_LOWEST_RATE;
    totalCredits += pensionCredit;
  }

  var taxAfterCredits = Math.max(0, baseTax - totalCredits);

  return Math.round(taxAfterCredits * 100) / 100;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 28 – Retirement Income Summary
 * ----------------------------------------------------------------------
 *
 * Provides a comprehensive income breakdown at a specific age.
 */

/**
 * RETIREMENT_INCOME_SUMMARY
 *
 * Provides a comprehensive income breakdown at a specific age showing:
 * - CPP (estimated or from OTHER_INCOME)
 * - OAS (estimated or from OTHER_INCOME)
 * - RRIF minimum withdrawals
 * - Other income sources
 * - Total gross and after-tax income
 *
 * @param {number} age             Age to calculate income for
 * @param {number} rrspBalance     RRSP/RRIF balance
 * @param {number} tfsaBalance     TFSA balance
 * @param {string} province        Province for tax calculation
 * @return {Array[]} Detailed income breakdown
 *
 * Example:
 * =RETIREMENT_INCOME_SUMMARY(70, 500000, 100000, "ON")
 */
function RETIREMENT_INCOME_SUMMARY(age, rrspBalance, tfsaBalance, province) {
  age          = Number(age);
  rrspBalance  = Number(rrspBalance) || 0;
  tfsaBalance  = Number(tfsaBalance) || 0;
  province     = (province || "ON").toString().trim().toUpperCase();

  // Input validation
  if (age < 0 || age > 120) {
    return [["ERROR: age must be between 0 and 120"]];
  }
  if (!PROVINCIAL_TAX_2024[province]) {
    return [["ERROR: Province not supported"]];
  }

  // Ensure OTHER_INCOME sheet exists
  ensureOtherIncomeSheet_();

  // Get other income from the sheet
  var otherIncome = getOtherIncomeForAge_(age);
  var taxableOtherIncome = otherIncome.taxable;
  var nonTaxableOtherIncome = otherIncome.nonTaxable;

  // Calculate RRIF minimum withdrawal if age >= 71
  var rrifWithdrawal = 0;
  if (age >= 71 && rrspBalance > 0) {
    rrifWithdrawal = RRIF_MIN_WITHDRAWAL(age, rrspBalance);
    if (typeof rrifWithdrawal === 'string') {
      rrifWithdrawal = 0;
    }
  }

  // Total taxable income
  var totalTaxableIncome = taxableOtherIncome + rrifWithdrawal;

  // Calculate tax with senior credits
  var estimatedTax = 0;
  if (totalTaxableIncome > 0) {
    estimatedTax = ESTIMATE_TAX_WITH_CREDITS(totalTaxableIncome, province, age, rrifWithdrawal);
    if (typeof estimatedTax === 'string') {
      estimatedTax = ESTIMATE_TAX(totalTaxableIncome, province);
      if (typeof estimatedTax === 'string') {
        estimatedTax = 0;
      }
    }
  }

  // Calculate after-tax income
  var afterTaxIncome = totalTaxableIncome - estimatedTax + nonTaxableOtherIncome;

  // Build results table
  var results = [["Income Source", "Annual Amount", "Tax Status"]];

  results.push(["TAXABLE INCOME:", "", ""]);
  results.push(["Other Income (from OTHER_INCOME sheet)", Math.round(taxableOtherIncome), "Taxable"]);

  if (rrifWithdrawal > 0) {
    results.push(["RRIF Minimum Withdrawal", Math.round(rrifWithdrawal), "Taxable"]);
  }

  results.push(["─────────────────", "─────────", "─────────"]);
  results.push(["Total Taxable Income", Math.round(totalTaxableIncome), ""]);

  results.push(["", "", ""]);
  results.push(["NON-TAXABLE INCOME:", "", ""]);
  results.push(["Non-Taxable Income (from OTHER_INCOME)", Math.round(nonTaxableOtherIncome), "Tax-Free"]);
  results.push(["TFSA Available", Math.round(tfsaBalance), "(Not income)"]);

  results.push(["", "", ""]);
  results.push(["TAX CALCULATION:", "", ""]);
  results.push(["Estimated Income Tax", Math.round(estimatedTax), ""]);
  results.push(["Age for Credits", age, age >= 65 ? "(Age credit eligible)" : ""]);

  results.push(["", "", ""]);
  results.push(["SUMMARY:", "", ""]);
  results.push(["Gross Income", Math.round(totalTaxableIncome + nonTaxableOtherIncome), ""]);
  results.push(["Less: Income Tax", "(" + Math.round(estimatedTax) + ")", ""]);
  results.push(["Net After-Tax Income", Math.round(afterTaxIncome), ""]);
  results.push(["Monthly After-Tax", Math.round(afterTaxIncome / 12), ""]);

  return results;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 29 – CPP Start Age Comparison Table
 * ----------------------------------------------------------------------
 *
 * Creates a comparison table showing CPP benefits at different start ages.
 */

/**
 * CPP_START_AGE_COMPARISON
 *
 * Creates a comparison table showing CPP benefits at different start ages (60-70).
 * Helps visualize the tradeoff between early vs. delayed benefits.
 *
 * @param {number} averageEarnings      Average annual pensionable earnings
 * @param {number} contributionYears    Total years with CPP contributions
 * @return {Array[]} Table comparing benefits at each age from 60-70
 *
 * Example:
 * =CPP_START_AGE_COMPARISON(65000, 35)
 */
function CPP_START_AGE_COMPARISON(averageEarnings, contributionYears) {
  averageEarnings   = Number(averageEarnings);
  contributionYears = Number(contributionYears);

  // Input validation
  if (averageEarnings < 0) {
    return [["ERROR: averageEarnings must be >= 0"]];
  }
  if (contributionYears < 0) {
    return [["ERROR: contributionYears must be >= 0"]];
  }

  var results = [["Start Age", "Monthly Benefit", "Annual Benefit", "Adjustment", "Cumulative at 80", "Cumulative at 85", "Cumulative at 90"]];

  for (var age = 60; age <= 70; age++) {
    var monthlyBenefit = CPP_BENEFIT(averageEarnings, contributionYears, age);
    if (typeof monthlyBenefit === 'string') {
      results.push([age, monthlyBenefit, "", "", "", "", ""]);
      continue;
    }

    var annualBenefit = monthlyBenefit * 12;

    // Calculate adjustment from age 65
    var monthsFromNormal = (age - 65) * 12;
    var adjustment;
    if (monthsFromNormal < 0) {
      adjustment = Math.round(monthsFromNormal * CPP_2024.EARLY_REDUCTION_PER_MONTH * 100 * 10) / 10 + "%";
    } else if (monthsFromNormal > 0) {
      adjustment = "+" + Math.round(monthsFromNormal * CPP_2024.LATE_INCREASE_PER_MONTH * 100 * 10) / 10 + "%";
    } else {
      adjustment = "0% (base)";
    }

    // Calculate cumulative payments at different ages
    var yearsCollecting80 = Math.max(0, 80 - age);
    var yearsCollecting85 = Math.max(0, 85 - age);
    var yearsCollecting90 = Math.max(0, 90 - age);

    var cumulative80 = annualBenefit * yearsCollecting80;
    var cumulative85 = annualBenefit * yearsCollecting85;
    var cumulative90 = annualBenefit * yearsCollecting90;

    results.push([
      age,
      "$" + Math.round(monthlyBenefit),
      "$" + Math.round(annualBenefit).toLocaleString(),
      adjustment,
      "$" + Math.round(cumulative80).toLocaleString(),
      "$" + Math.round(cumulative85).toLocaleString(),
      "$" + Math.round(cumulative90).toLocaleString()
    ]);
  }

  // Add insights
  results.push(["", "", "", "", "", "", ""]);
  results.push(["Insights:", "", "", "", "", "", ""]);
  results.push(["• Early reduction:", "0.6% per month before 65 (max 36% at 60)", "", "", "", "", ""]);
  results.push(["• Late bonus:", "0.7% per month after 65 (max 42% at 70)", "", "", "", "", ""]);
  results.push(["• Break-even:", "Compare cumulative columns to find optimal start age", "", "", "", "", ""]);

  return results;
}

/**
 * ----------------------------------------------------------------------
 * SECTION 29 – Single-Scenario Retirement Workbook Flow
 * ----------------------------------------------------------------------
 *
 * This section implements a full year-by-year retirement projection
 * flow for a single scenario. Most calculations are done in Apps Script,
 * with results written to the Calcs sheet for use in Summary.
 *
 * Sheet Structure:
 * - Inputs: Contains all input parameters via named ranges
 * - CPP_Contribs: Contains historical CPP contribution data
 * - Calcs: Receives projection parameters and year-by-year projection table
 * - Summary: Uses data from Calcs for summary displays
 *
 * Key Constants (configurable):
 * - MAX_CPP_65_TODAY: Maximum CPP benefit at age 65 in today's dollars
 * - FULL_OAS_ANNUAL_TODAY: Full OAS annual benefit in today's dollars
 */

/**
 * Configuration constants for CPP/OAS estimation (in today's dollars).
 * These can be adjusted to reflect current program parameters.
 */
var PROJECTION_CONSTANTS = {
  MAX_CPP_65_TODAY: 16375,        // Annual CPP at 65 (approx $1364.60/month * 12)
  FULL_OAS_ANNUAL_TODAY: 8560,    // Annual OAS at 65 (approx $713.34/month * 12)
  CPP_EARLY_ADJUSTMENT: 0.072,    // 7.2% reduction per year before 65 (0.6% per month)
  CPP_LATE_ADJUSTMENT: 0.084,     // 8.4% increase per year after 65 (0.7% per month)
  OAS_DEFERRAL_BONUS: 0.072       // 7.2% increase per year deferred (0.6% per month)
};

/**
 * Simple progressive tax brackets for estimation (in today's dollars).
 * This is a placeholder using approximate combined federal+provincial rates.
 * TODO: Replace with province-specific calculations for better accuracy.
 */
var SIMPLE_TAX_BRACKETS_TODAY = [
  { min: 0,      max: 15000,  rate: 0.00 },   // Effectively no tax due to basic personal amount
  { min: 15000,  max: 50000,  rate: 0.20 },   // ~20% combined
  { min: 50000,  max: 100000, rate: 0.30 },   // ~30% combined
  { min: 100000, max: 155000, rate: 0.40 },   // ~40% combined
  { min: 155000, max: 220000, rate: 0.45 },   // ~45% combined
  { min: 220000, max: Infinity, rate: 0.50 }  // ~50% combined
];

/**
 * runProjection
 *
 * Main orchestration function that:
 * 1. Reads inputs from the Inputs sheet
 * 2. Reads CPP contribution history from CPP_Contribs sheet
 * 3. Computes CPP and OAS benefit estimates
 * 4. Writes global parameters to Calcs sheet
 * 5. Builds and writes year-by-year projection table to Calcs sheet
 *
 * This function is called from the "Retirement Calculator" menu.
 */
function runProjection() {
  try {
    SpreadsheetApp.getActive().toast('Starting projection...', 'Retirement Calculator', 3);
    
    // Step 1: Read inputs
    var inputs = readInputs_();
    
    // Step 2: Read CPP contribution history
    var cppRows = readCppContribs_();
    
    // Step 3: Compute CPP benefit estimate
    var cppResult = computeCppBenefit_(inputs, cppRows);
    
    // Step 4: Compute OAS benefit estimate
    var oasResult = computeOasBenefit_(inputs);
    
    // Step 5: Write global parameters to Calcs
    writeGlobals_(inputs, cppResult, oasResult);
    
    // Step 6: Build and write projection table
    runProjectionTable_(inputs, cppResult, oasResult);
    
    SpreadsheetApp.getActive().toast('Projection complete! Check the Calcs sheet.', 'Retirement Calculator', 5);
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error running projection: ' + e.message);
    throw e;
  }
}

/**
 * readInputs_
 *
 * Reads all required named ranges from the Inputs sheet and returns
 * a structured object with input parameters.
 *
 * Required named ranges on Inputs sheet:
 * - retirement_age, current_age, current_year
 * - cpp_start_age, oas_start_age
 * - province, marital_status
 * - current_income, annual_contrib
 * - rrsp_balance_now, tfsa_balance_now, taxable_balance_now
 * - real_return, inflation_rate
 * - target_net_income_today
 * - life_expectancy_age
 *
 * @return {Object} Input parameters
 * @private
 */
function readInputs_() {
  var ss = SpreadsheetApp.getActive();
  
  // Helper to read a named range
  function getNamedValue(name) {
    try {
      var range = ss.getRangeByName(name);
      if (!range) {
        throw new Error('Named range "' + name + '" not found. Please ensure it exists on the Inputs sheet.');
      }
      return range.getValue();
    } catch (e) {
      throw new Error('Error reading named range "' + name + '": ' + e.message);
    }
  }
  
  var inputs = {
    retirementAge: Number(getNamedValue('retirement_age')),
    currentAge: Number(getNamedValue('current_age')),
    currentYear: Number(getNamedValue('current_year')),
    cppStartAge: Number(getNamedValue('cpp_start_age')),
    oasStartAge: Number(getNamedValue('oas_start_age')),
    province: String(getNamedValue('province')),
    maritalStatus: String(getNamedValue('marital_status')),
    currentIncome: Number(getNamedValue('current_income')),
    annualContrib: Number(getNamedValue('annual_contrib')),
    rrspBalanceNow: Number(getNamedValue('rrsp_balance_now')),
    tfsaBalanceNow: Number(getNamedValue('tfsa_balance_now')),
    taxableBalanceNow: Number(getNamedValue('taxable_balance_now')),
    realReturnPct: Number(getNamedValue('real_return')),
    inflationRatePct: Number(getNamedValue('inflation_rate')),
    targetNetIncomeToday: Number(getNamedValue('target_net_income_today')),
    lifeExpectancyAge: Number(getNamedValue('life_expectancy_age'))
  };
  
  // Convert percentages to decimals
  inputs.realReturn = inputs.realReturnPct / 100;
  inputs.inflation = inputs.inflationRatePct / 100;

  // Optional inputs — absent named ranges fall back to sensible defaults so
  // existing workbooks keep working without any extra setup.
  function getOptionalNamedValue(name, fallback) {
    var range = ss.getRangeByName(name);
    if (!range) return fallback;
    var v = range.getValue();
    if (v === '' || v === null) return fallback;
    return v;
  }

  // Defined-benefit pension wired into the projection's "DB Pension" column.
  // Provide the annual amount in today's dollars and the age it starts. If you
  // don't yet know the amount, derive it with =PENSION_INCOME_PROJECTED(...) and
  // paste the result into the db_pension_annual_today cell.
  inputs.dbPensionAnnualToday = Number(getOptionalNamedValue('db_pension_annual_today', 0)) || 0;
  inputs.dbPensionStartAge = Number(getOptionalNamedValue('db_pension_start_age', inputs.retirementAge)) || inputs.retirementAge;

  // Whether to fold the OTHER_INCOME sheet (rentals, annuities, part-time, etc.)
  // into the projection's "Other Income" column. Defaults to true.
  inputs.includeOtherIncome = asBool_(getOptionalNamedValue('include_other_income', true));

  // Whether to apply the OAS recovery tax (clawback) when income is high.
  inputs.applyOasClawback = asBool_(getOptionalNamedValue('apply_oas_clawback', true));

  // Whether big-purchase goals from the GOALS sheet draw down the projection's
  // portfolio in the years they occur. Defaults to true (no-op if no GOALS sheet).
  inputs.includeGoals = asBool_(getOptionalNamedValue('include_goals', true));

  // Compute derived values
  inputs.totalBalanceNow = inputs.rrspBalanceNow + inputs.tfsaBalanceNow + inputs.taxableBalanceNow;
  
  // Validation
  if (inputs.currentAge >= inputs.retirementAge) {
    throw new Error('current_age must be less than retirement_age');
  }
  if (inputs.retirementAge >= inputs.lifeExpectancyAge) {
    throw new Error('retirement_age must be less than life_expectancy_age');
  }
  
  return inputs;
}

/**
 * readCppContribs_
 *
 * Reads CPP contribution history from the cpp_contribs_range named range
 * on the CPP_Contribs sheet.
 *
 * Expected columns: Year, Age, Pensionable Earnings, YMPE, Earnings/YMPE, Notes
 *
 * @return {Array} Array of contribution objects with {year, age, earnings, ympe, ratio}
 * @private
 */
function readCppContribs_() {
  var ss = SpreadsheetApp.getActive();
  
  try {
    var range = ss.getRangeByName('cpp_contribs_range');
    if (!range) {
      // CPP contribution data is optional - return empty array if not found
      Logger.log('Warning: cpp_contribs_range not found. CPP estimation will use zero contributions.');
      return [];
    }
    
    var values = range.getValues();
    var result = [];
    
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var year = row[0];
      
      // Skip blank rows (no year)
      if (!year || year === '' || year === 0) {
        continue;
      }
      
      result.push({
        year: Number(year),
        age: Number(row[1]),
        earnings: Number(row[2]),
        ympe: Number(row[3]),
        ratio: Number(row[4])
      });
    }
    
    return result;
  } catch (e) {
    // CPP contribution data is optional - return empty array if there's an error
    Logger.log('Warning: Could not read CPP contributions: ' + e.message);
    return [];
  }
}

/**
 * computeCppBenefit_
 *
 * Computes a simplified CPP benefit estimate based on contribution history.
 *
 * Logic:
 * - Computes average Earnings/YMPE ratio across all non-zero contribution years
 * - Scales MAX_CPP_65_TODAY by this average ratio
 * - Applies early/late adjustment based on cpp_start_age vs 65
 *
 * @param {Object} inputs Input parameters
 * @param {Array} cppRows CPP contribution history
 * @return {Object} {avgEarningsRatio, annualAt65Today, annualAtStartToday, startAge}
 * @private
 */
function computeCppBenefit_(inputs, cppRows) {
  var startAge = inputs.cppStartAge;
  
  // Calculate average earnings ratio
  var sumRatio = 0;
  var countYears = 0;
  
  for (var i = 0; i < cppRows.length; i++) {
    if (cppRows[i].ratio > 0) {
      sumRatio += cppRows[i].ratio;
      countYears++;
    }
  }
  
  var avgEarningsRatio = countYears > 0 ? sumRatio / countYears : 0;
  
  // Base benefit at age 65 in today's dollars
  var annualAt65Today = PROJECTION_CONSTANTS.MAX_CPP_65_TODAY * avgEarningsRatio;
  
  // Apply early/late adjustment
  var yearsFromNormal = startAge - 65;
  var adjustment = 1.0;
  
  if (yearsFromNormal < 0) {
    // Early: reduce by 7.2% per year before 65
    adjustment = 1 + (yearsFromNormal * PROJECTION_CONSTANTS.CPP_EARLY_ADJUSTMENT);
  } else if (yearsFromNormal > 0) {
    // Late: increase by 8.4% per year after 65
    adjustment = 1 + (yearsFromNormal * PROJECTION_CONSTANTS.CPP_LATE_ADJUSTMENT);
  }
  
  var annualAtStartToday = annualAt65Today * adjustment;
  
  return {
    avgEarningsRatio: avgEarningsRatio,
    annualAt65Today: annualAt65Today,
    annualAtStartToday: annualAtStartToday,
    startAge: startAge
  };
}

/**
 * computeOasBenefit_
 *
 * Computes a simplified OAS benefit estimate.
 *
 * For now, assumes full OAS eligibility (fractionFull = 1.0).
 * Applies deferral bonus if oas_start_age > 65.
 *
 * @param {Object} inputs Input parameters
 * @return {Object} {annualAtStartToday, startAge}
 * @private
 */
function computeOasBenefit_(inputs) {
  var startAge = inputs.oasStartAge;
  
  // Assume full OAS for simplicity
  var fractionFull = 1.0;
  var annualAt65Today = PROJECTION_CONSTANTS.FULL_OAS_ANNUAL_TODAY * fractionFull;
  
  // Apply deferral bonus if starting after 65
  var yearsDeferred = Math.max(0, startAge - 65);
  var adjustment = 1 + (yearsDeferred * PROJECTION_CONSTANTS.OAS_DEFERRAL_BONUS);
  
  var annualAtStartToday = annualAt65Today * adjustment;
  
  return {
    annualAtStartToday: annualAtStartToday,
    startAge: startAge
  };
}

/**
 * writeGlobals_
 *
 * Writes projection parameters and CPP/OAS summary values to the Calcs sheet
 * using named ranges.
 *
 * Named ranges on Calcs:
 * - projection_start_year
 * - projection_end_year
 * - real_return_decimal
 * - inflation_decimal
 * - cpp_annual_today
 * - cpp_annual_nominal
 * - oas_annual_today
 * - oas_annual_nominal
 *
 * @param {Object} inputs Input parameters
 * @param {Object} cppResult CPP benefit calculation result
 * @param {Object} oasResult OAS benefit calculation result
 * @private
 */
function writeGlobals_(inputs, cppResult, oasResult) {
  var ss = SpreadsheetApp.getActive();
  
  // Helper to write to a named range
  function setNamedValue(name, value) {
    var range = ss.getRangeByName(name);
    if (!range) {
      throw new Error('Named range "' + name + '" not found on Calcs sheet.');
    }
    range.setValue(value);
  }
  
  // Projection period
  var projectionStartYear = inputs.currentYear;
  var projectionEndYear = inputs.currentYear + (inputs.lifeExpectancyAge - inputs.currentAge);
  
  setNamedValue('projection_start_year', projectionStartYear);
  setNamedValue('projection_end_year', projectionEndYear);
  setNamedValue('real_return_decimal', inputs.realReturn);
  setNamedValue('inflation_decimal', inputs.inflation);
  
  // CPP values
  setNamedValue('cpp_annual_today', cppResult.annualAtStartToday);
  
  // CPP nominal value in the year it starts
  var cppStartYear = inputs.currentYear + (cppResult.startAge - inputs.currentAge);
  var cppAnnualNominal = inflateToYear_(cppResult.annualAtStartToday, inputs.currentYear, cppStartYear, inputs.inflation);
  setNamedValue('cpp_annual_nominal', cppAnnualNominal);
  
  // OAS values
  setNamedValue('oas_annual_today', oasResult.annualAtStartToday);
  
  // OAS nominal value in the year it starts
  var oasStartYear = inputs.currentYear + (oasResult.startAge - inputs.currentAge);
  var oasAnnualNominal = inflateToYear_(oasResult.annualAtStartToday, inputs.currentYear, oasStartYear, inputs.inflation);
  setNamedValue('oas_annual_nominal', oasAnnualNominal);
}

/**
 * runProjectionTable_
 *
 * Builds and writes a year-by-year projection table to the Calcs sheet.
 * The table starts at row 51 (with headers at row 50).
 *
 * Columns:
 * - Year, Age, Employment Income, CPP Income, OAS Income, DB Pension, Other Income,
 *   Gross Income, Taxes, Net Income, Start Balance, Contributions, Withdrawals,
 *   Investment Return, End Balance, Net Income (today's $)
 *
 * @param {Object} inputs Input parameters
 * @param {Object} cppResult CPP benefit calculation result
 * @param {Object} oasResult OAS benefit calculation result
 * @private
 */
function runProjectionTable_(inputs, cppResult, oasResult) {
  var ss = SpreadsheetApp.getActive();
  var calcsSheet = ss.getSheetByName('Calcs');
  
  if (!calcsSheet) {
    throw new Error('Calcs sheet not found. Please create it first.');
  }
  
  // Define column headers
  var headers = [
    'Year', 'Age', 'Employment Income', 'CPP Income', 'OAS Income', 'DB Pension', 'Other Income',
    'Gross Income', 'Taxes', 'Net Income', 'Start Balance', 'Contributions', 'Withdrawals',
    'Goal Spending', 'Investment Return', 'End Balance', 'Net Income (today\'s $)'
  ];

  // Clear existing projection table (from row 50 onwards). Clear one extra
  // column in case an older run wrote a narrower table.
  var lastRow = calcsSheet.getLastRow();
  if (lastRow >= 50) {
    calcsSheet.getRange(50, 1, lastRow - 49, headers.length + 1).clearContent();
  }

  // Write headers at row 50
  calcsSheet.getRange(50, 1, 1, headers.length).setValues([headers]);
  calcsSheet.getRange(50, 1, 1, headers.length).setFontWeight('bold');

  // Build projection rows
  var projectionData = [];
  var portfolioBalance = inputs.totalBalanceNow;

  var numYears = inputs.lifeExpectancyAge - inputs.currentAge + 1;

  // Big-purchase goals from the GOALS sheet draw down the same portfolio in the
  // years they occur (showing their drag on retirement funding). Empty/absent
  // GOALS sheet => all zeros, so this is a no-op for existing workbooks.
  var goalOutflows = inputs.includeGoals ? goalOutflowsByYearOffset_(inputs.currentYear, numYears) : [];
  
  for (var i = 0; i < numYears; i++) {
    var year = inputs.currentYear + i;
    var age = inputs.currentAge + i;
    
    // Employment income (only before retirement)
    var employmentIncome = 0;
    if (age < inputs.retirementAge) {
      // Inflate current income to this year
      employmentIncome = inflateToYear_(inputs.currentIncome, inputs.currentYear, year, inputs.inflation);
    }
    
    // CPP income (starts at cpp_start_age)
    var cppIncome = 0;
    if (age >= cppResult.startAge) {
      cppIncome = inflateToYear_(cppResult.annualAtStartToday, inputs.currentYear, year, inputs.inflation);
    }

    // OAS income (starts at oas_start_age)
    var oasIncome = 0;
    if (age >= oasResult.startAge) {
      oasIncome = inflateToYear_(oasResult.annualAtStartToday, inputs.currentYear, year, inputs.inflation);
    }

    // DB Pension — starts at its own start age, indexed with inflation.
    var dbPension = 0;
    if (inputs.dbPensionAnnualToday > 0 && age >= inputs.dbPensionStartAge) {
      dbPension = inflateToYear_(inputs.dbPensionAnnualToday, inputs.currentYear, year, inputs.inflation);
    }

    // Other income from the OTHER_INCOME sheet (rentals, annuities, part-time…).
    // CPP/OAS/DB are modelled above, so list only *additional* streams there to
    // avoid double-counting. Amounts are stored in today's $ and inflated here.
    var otherTaxable = 0;
    var otherNonTaxable = 0;
    if (inputs.includeOtherIncome) {
      var oi = getOtherIncomeForAge_(age);
      otherTaxable = inflateToYear_(oi.taxable, inputs.currentYear, year, inputs.inflation);
      otherNonTaxable = inflateToYear_(oi.nonTaxable, inputs.currentYear, year, inputs.inflation);
    }
    var otherIncome = otherTaxable + otherNonTaxable;

    // OAS recovery tax (clawback) — reduces net OAS once net income clears the
    // threshold. Based on pre-withdrawal taxable income (a documented
    // simplification that avoids a circular dependency with withdrawals). The
    // 2024 threshold is indexed forward with inflation to match this nominal
    // projection.
    var oasClawback = 0;
    if (inputs.applyOasClawback && oasIncome > 0) {
      var clawbackThreshold = inflateToYear_(OAS_2024.CLAWBACK_THRESHOLD, inputs.currentYear, year, inputs.inflation);
      var incomeForClawback = employmentIncome + cppIncome + oasIncome + dbPension + otherTaxable;
      if (incomeForClawback > clawbackThreshold) {
        oasClawback = Math.min((incomeForClawback - clawbackThreshold) * OAS_2024.CLAWBACK_RATE, oasIncome);
        oasIncome -= oasClawback;
      }
    }

    // Gross income before withdrawals (OAS already net of any clawback)
    var grossIncomeBeforeWithdrawal = employmentIncome + cppIncome + oasIncome + dbPension + otherIncome;
    
    // Contributions (only pre-retirement)
    var contributions = 0;
    if (age < inputs.retirementAge) {
      contributions = inflateToYear_(inputs.annualContrib, inputs.currentYear, year, inputs.inflation);
    }
    
    // Withdrawals (only post-retirement)
    var withdrawals = 0;
    var taxes = 0;
    var netIncome = 0;
    var grossIncome = grossIncomeBeforeWithdrawal;
    
    if (age >= inputs.retirementAge) {
      // Target net income for this year
      var targetNetThisYear = inflateToYear_(inputs.targetNetIncomeToday, inputs.currentYear, year, inputs.inflation);

      // Compute tax on income before withdrawal. Non-taxable other income is
      // excluded from the tax base but still counts toward net cashflow.
      var taxBeforeWithdrawal = computeTax_(grossIncomeBeforeWithdrawal - otherNonTaxable, inputs, year);
      var netBeforeWithdrawal = grossIncomeBeforeWithdrawal - taxBeforeWithdrawal;

      // Determine withdrawal needed to reach target net income
      var netGap = targetNetThisYear - netBeforeWithdrawal;

      if (netGap > 0 && portfolioBalance > 0) {
        // Approximate marginal tax rate for withdrawal
        var marginalRate = computeMarginalRate_(grossIncomeBeforeWithdrawal - otherNonTaxable, inputs, year);

        // Withdrawal needed: netGap / (1 - marginalRate)
        var withdrawalNeeded = netGap / (1 - marginalRate);
        withdrawalNeeded = Math.max(0, Math.min(withdrawalNeeded, portfolioBalance));

        withdrawals = withdrawalNeeded;
        grossIncome = grossIncomeBeforeWithdrawal + withdrawals;

        // Recompute taxes with withdrawal included (treated as taxable income)
        taxes = computeTax_(grossIncome - otherNonTaxable, inputs, year);
        netIncome = grossIncome - taxes;
      } else {
        grossIncome = grossIncomeBeforeWithdrawal;
        taxes = taxBeforeWithdrawal;
        netIncome = netBeforeWithdrawal;
      }
    } else {
      // Pre-retirement: simple tax calculation (non-taxable income excluded)
      taxes = computeTax_(grossIncome - otherNonTaxable, inputs, year);
      netIncome = grossIncome - taxes;
    }
    
    // Big-purchase goal spending for the year (paid from the portfolio).
    var goalSpending = goalOutflows[i] || 0;

    // Portfolio evolution
    var startBalance = portfolioBalance;
    var investmentReturn = portfolioBalance * inputs.realReturn;
    var endBalance = portfolioBalance + contributions - withdrawals - goalSpending + investmentReturn;
    endBalance = Math.max(0, endBalance);  // Can't go negative

    portfolioBalance = endBalance;

    // Net income in today's dollars
    var netIncomeToday = discountToYearZero_(netIncome, inputs.currentYear, year, inputs.inflation);

    // Build row
    projectionData.push([
      year,
      age,
      Math.round(employmentIncome),
      Math.round(cppIncome),
      Math.round(oasIncome),
      Math.round(dbPension),
      Math.round(otherIncome),
      Math.round(grossIncome),
      Math.round(taxes),
      Math.round(netIncome),
      Math.round(startBalance),
      Math.round(contributions),
      Math.round(withdrawals),
      Math.round(goalSpending),
      Math.round(investmentReturn),
      Math.round(endBalance),
      Math.round(netIncomeToday)
    ]);
  }
  
  // Write projection data starting at row 51
  if (projectionData.length > 0) {
    calcsSheet.getRange(51, 1, projectionData.length, headers.length).setValues(projectionData);
  }
}

/**
 * computeTax_
 *
 * Simplified progressive tax calculation using inflation-adjusted brackets.
 * This is a placeholder - for better accuracy, use ESTIMATE_TAX with province.
 *
 * @param {number} grossIncome Gross income for the year (nominal)
 * @param {Object} inputs Input parameters
 * @param {number} year The year for which to compute tax
 * @return {number} Estimated tax
 * @private
 */
function computeTax_(grossIncome, inputs, year) {
  if (grossIncome <= 0) return 0;
  
  var tax = 0;
  
  // Inflate brackets to the target year
  for (var i = 0; i < SIMPLE_TAX_BRACKETS_TODAY.length; i++) {
    var bracket = SIMPLE_TAX_BRACKETS_TODAY[i];
    var minInflated = inflateToYear_(bracket.min, inputs.currentYear, year, inputs.inflation);
    var maxInflated = inflateToYear_(bracket.max, inputs.currentYear, year, inputs.inflation);
    
    if (grossIncome > minInflated) {
      var taxableInBracket = Math.min(grossIncome - minInflated, maxInflated - minInflated);
      if (taxableInBracket > 0) {
        tax += taxableInBracket * bracket.rate;
      }
    }
  }
  
  return tax;
}

/**
 * computeMarginalRate_
 *
 * Computes the marginal tax rate at a given income level.
 *
 * @param {number} grossIncome Gross income (nominal)
 * @param {Object} inputs Input parameters
 * @param {number} year The year
 * @return {number} Marginal rate (0 to 1)
 * @private
 */
function computeMarginalRate_(grossIncome, inputs, year) {
  // Find which bracket the income falls into
  for (var i = 0; i < SIMPLE_TAX_BRACKETS_TODAY.length; i++) {
    var bracket = SIMPLE_TAX_BRACKETS_TODAY[i];
    var minInflated = inflateToYear_(bracket.min, inputs.currentYear, year, inputs.inflation);
    var maxInflated = inflateToYear_(bracket.max, inputs.currentYear, year, inputs.inflation);
    
    if (grossIncome >= minInflated && grossIncome < maxInflated) {
      return bracket.rate;
    }
  }
  
  // If we're above all brackets, return the highest rate
  return SIMPLE_TAX_BRACKETS_TODAY[SIMPLE_TAX_BRACKETS_TODAY.length - 1].rate;
}

/**
 * inflateToYear_
 *
 * Inflates a value from baseYear to targetYear using an inflation rate.
 *
 * @param {number} value Value in baseYear dollars
 * @param {number} baseYear Starting year
 * @param {number} targetYear Ending year
 * @param {number} inflationRate Annual inflation rate (decimal)
 * @return {number} Value in targetYear dollars
 * @private
 */
function inflateToYear_(value, baseYear, targetYear, inflationRate) {
  var years = targetYear - baseYear;
  return value * Math.pow(1 + inflationRate, years);
}

/**
 * discountToYearZero_
 *
 * Discounts a nominal value in a given year back to baseYear using inflation.
 *
 * @param {number} value Nominal value in the given year
 * @param {number} baseYear The reference year (year zero)
 * @param {number} year The year of the value
 * @param {number} inflationRate Annual inflation rate (decimal)
 * @return {number} Value in baseYear dollars
 * @private
 */
function discountToYearZero_(value, baseYear, year, inflationRate) {
  var years = year - baseYear;
  return value / Math.pow(1 + inflationRate, years);
}


/**
 * ----------------------------------------------------------------------
 * SECTION 30 – Shared annuity helpers
 * ----------------------------------------------------------------------
 */

/**
 * pmtAnnuityDue_
 *
 * Level payment made at the START of each period (annuity due) required to
 * grow from zero to a target future value.
 *
 * @param {number} rate  Periodic return (decimal)
 * @param {number} nper  Number of periods
 * @param {number} fv    Target future value (positive)
 * @return {number} Required level payment (positive)
 * @private
 */
function pmtAnnuityDue_(rate, nper, fv) {
  nper = Number(nper);
  fv = Number(fv);
  if (nper <= 0) return fv;
  if (!rate) return fv / nper;
  // FV of an annuity due = pmt * ((1+r)^n - 1)/r * (1+r)
  return fv * rate / ((Math.pow(1 + rate, nper) - 1) * (1 + rate));
}


/**
 * ----------------------------------------------------------------------
 * SECTION 31 – RESP / CESG Education Planner
 * ----------------------------------------------------------------------
 *
 * Ports the spreadsheet "RESP Planner" tab into script form. Models the 20%
 * Canada Education Savings Grant (CESG), its $500/yr and $7,200 lifetime caps,
 * and the $50,000 lifetime contribution limit, with a year-by-year schedule.
 */

var RESP_CONSTANTS = {
  CESG_MATCH_RATE: 0.20,            // 20% government grant on contributions
  CESG_ANNUAL_MAX: 500,            // Paid on the first $2,500 contributed per year
  CESG_LIFETIME_MAX: 7200,         // Lifetime grant cap per child
  CONTRIB_LIFETIME_MAX: 50000      // Lifetime contribution limit per beneficiary
};

/**
 * respFutureTarget_
 * Converts a target education cost to future dollars at the year funds are needed.
 * @private
 */
function respFutureTarget_(targetCost, targetIsTodaysDollars, years, inflationRate) {
  if (asBool_(targetIsTodaysDollars)) {
    return targetCost * Math.pow(1 + inflationRate, years);
  }
  return targetCost;
}

/**
 * respRunSchedule_
 *
 * Shared engine that runs the RESP year-by-year accumulation with CESG and the
 * lifetime caps. Returns both the rows and summary totals.
 * @private
 */
function respRunSchedule_(beneficiaryAge, ageNeeded, currentBalance, annualReturn, annualContribution, startYear) {
  var rows = [];
  var balance = Number(currentBalance) || 0;
  var cumContrib = 0;
  var cumCesg = 0;

  for (var age = beneficiaryAge; age < ageNeeded; age++) {
    var opening = balance;

    // Contribution is capped by the remaining lifetime contribution room.
    var contribRoom = Math.max(0, RESP_CONSTANTS.CONTRIB_LIFETIME_MAX - cumContrib);
    var contribution = Math.max(0, Math.min(annualContribution, contribRoom));

    // CESG = 20% of contribution, capped at $500/yr and the remaining lifetime grant.
    var grantRoom = Math.max(0, RESP_CONSTANTS.CESG_LIFETIME_MAX - cumCesg);
    var cesg = Math.min(RESP_CONSTANTS.CESG_MATCH_RATE * contribution, RESP_CONSTANTS.CESG_ANNUAL_MAX, grantRoom);

    var growth = (opening + contribution + cesg) * annualReturn;
    var closing = opening + contribution + cesg + growth;

    cumContrib += contribution;
    cumCesg += cesg;
    balance = closing;

    rows.push([
      age,
      startYear + (age - beneficiaryAge),
      Math.round(opening),
      Math.round(contribution),
      Math.round(cumContrib),
      Math.round(cesg),
      Math.round(cumCesg),
      Math.round(growth),
      Math.round(closing)
    ]);
  }

  return {
    rows: rows,
    projectedBalance: balance,
    lifetimeContrib: cumContrib,
    lifetimeCesg: cumCesg
  };
}

/**
 * RESP_SUGGESTED_CONTRIBUTION
 *
 * Suggests the level annual contribution that, together with the 20% CESG,
 * grows the current balance to the education target by the year funds are needed.
 *
 * @param {number} beneficiaryAge        Child's current age
 * @param {number} ageNeeded             Age when funds are needed (e.g. 18)
 * @param {number} targetCost            Target education cost
 * @param {boolean} targetIsTodaysDollars TRUE if targetCost is in today's $
 * @param {number} currentBalance        Current RESP balance
 * @param {number} annualReturn          Expected annual return (decimal, e.g. 0.055)
 * @param {number} inflationRate         Inflation rate (decimal, e.g. 0.025)
 *
 * @return {number} Suggested annual contribution (before grant)
 * @customfunction
 *
 * Example:
 * =RESP_SUGGESTED_CONTRIBUTION(2, 18, 120000, TRUE, 5000, 0.055, 0.025)
 */
function RESP_SUGGESTED_CONTRIBUTION(beneficiaryAge, ageNeeded, targetCost, targetIsTodaysDollars, currentBalance, annualReturn, inflationRate) {
  beneficiaryAge  = Number(beneficiaryAge);
  ageNeeded       = Number(ageNeeded);
  targetCost      = Number(targetCost);
  currentBalance  = Number(currentBalance) || 0;
  annualReturn    = Number(annualReturn);
  inflationRate   = Number(inflationRate) || 0;

  var years = Math.max(0, ageNeeded - beneficiaryAge);
  if (years <= 0) return 0;

  var futureTarget = respFutureTarget_(targetCost, targetIsTodaysDollars, years, inflationRate);
  var fvCurrent = currentBalance * Math.pow(1 + annualReturn, years);
  var gap = Math.max(0, futureTarget - fvCurrent);

  // Required level deposit of (contribution + grant) as an annuity due.
  var depositNeeded = pmtAnnuityDue_(annualReturn, years, gap);

  // Back out the contribution from "contribution + 20% grant", respecting the
  // $500/yr grant ceiling (grant stops growing past $2,500 of contribution).
  var grantCeilingDeposit = (RESP_CONSTANTS.CESG_ANNUAL_MAX / RESP_CONSTANTS.CESG_MATCH_RATE) * (1 + RESP_CONSTANTS.CESG_MATCH_RATE);
  var contribution;
  if (depositNeeded <= grantCeilingDeposit) {
    contribution = depositNeeded / (1 + RESP_CONSTANTS.CESG_MATCH_RATE);
  } else {
    contribution = depositNeeded - RESP_CONSTANTS.CESG_ANNUAL_MAX;
  }

  // Respect the lifetime contribution cap spread over the funding horizon.
  contribution = Math.min(contribution, RESP_CONSTANTS.CONTRIB_LIFETIME_MAX / years);

  return Math.round(Math.max(0, contribution));
}

/**
 * RESP_SCHEDULE
 *
 * Year-by-year RESP accumulation schedule with CESG and lifetime caps.
 *
 * @param {number} beneficiaryAge     Child's current age
 * @param {number} ageNeeded          Age when funds are needed (e.g. 18)
 * @param {number} currentBalance     Current RESP balance
 * @param {number} annualReturn       Expected annual return (decimal)
 * @param {number} annualContribution Planned annual contribution (before grant)
 * @param {number} startYear          Optional: first calendar year (defaults to this year)
 *
 * @return {Array[]} Table: Age, Year, Opening, Contribution, Cum. Contrib,
 *                    CESG, Cum. CESG, Growth, Closing
 * @customfunction
 *
 * Example:
 * =RESP_SCHEDULE(2, 18, 5000, 0.055, 2500)
 */
function RESP_SCHEDULE(beneficiaryAge, ageNeeded, currentBalance, annualReturn, annualContribution, startYear) {
  beneficiaryAge     = Number(beneficiaryAge);
  ageNeeded          = Number(ageNeeded);
  currentBalance     = Number(currentBalance) || 0;
  annualReturn       = Number(annualReturn);
  annualContribution = Number(annualContribution) || 0;
  startYear          = Number(startYear) || (new Date()).getFullYear();

  if (ageNeeded <= beneficiaryAge) {
    return [["ERROR: ageNeeded must be greater than beneficiaryAge"]];
  }

  var result = respRunSchedule_(beneficiaryAge, ageNeeded, currentBalance, annualReturn, annualContribution, startYear);
  var table = [[
    'Age', 'Year', 'Opening Balance', 'Contribution', 'Cum. Contrib.',
    'CESG (Grant)', 'Cum. CESG', 'Growth', 'Closing Balance'
  ]];
  return table.concat(result.rows);
}

/**
 * RESP_PROJECTION
 *
 * Summary of an RESP plan: projected balance vs target, lifetime grant and
 * contributions captured, and a status flag.
 *
 * @param {number} beneficiaryAge        Child's current age
 * @param {number} ageNeeded             Age when funds are needed
 * @param {number} targetCost            Target education cost
 * @param {boolean} targetIsTodaysDollars TRUE if targetCost is in today's $
 * @param {number} currentBalance        Current RESP balance
 * @param {number} annualReturn          Expected annual return (decimal)
 * @param {number} inflationRate         Inflation rate (decimal)
 * @param {number} annualContribution    Planned annual contribution (before grant)
 *
 * @return {Array[]} Two-column summary table
 * @customfunction
 *
 * Example:
 * =RESP_PROJECTION(2, 18, 120000, TRUE, 5000, 0.055, 0.025, 2500)
 */
function RESP_PROJECTION(beneficiaryAge, ageNeeded, targetCost, targetIsTodaysDollars, currentBalance, annualReturn, inflationRate, annualContribution) {
  beneficiaryAge     = Number(beneficiaryAge);
  ageNeeded          = Number(ageNeeded);
  targetCost         = Number(targetCost);
  currentBalance     = Number(currentBalance) || 0;
  annualReturn       = Number(annualReturn);
  inflationRate      = Number(inflationRate) || 0;
  annualContribution = Number(annualContribution) || 0;

  if (ageNeeded <= beneficiaryAge) {
    return [["ERROR: ageNeeded must be greater than beneficiaryAge"]];
  }

  var years = ageNeeded - beneficiaryAge;
  var futureTarget = respFutureTarget_(targetCost, targetIsTodaysDollars, years, inflationRate);
  var result = respRunSchedule_(beneficiaryAge, ageNeeded, currentBalance, annualReturn, annualContribution, (new Date()).getFullYear());

  var surplus = result.projectedBalance - futureTarget;
  var status;
  if (surplus >= 0) {
    status = 'On track';
  } else if (result.lifetimeContrib >= RESP_CONSTANTS.CONTRIB_LIFETIME_MAX - 1) {
    status = 'RESP capped — fund remainder from TFSA / non-registered';
  } else {
    status = 'Increase the annual contribution';
  }

  return [
    ['RESP Plan Summary', ''],
    ['Years until needed', years],
    ['Target (future $)', Math.round(futureTarget)],
    ['Projected balance when needed', Math.round(result.projectedBalance)],
    ['Surplus / (shortfall)', Math.round(surplus)],
    ['Lifetime CESG captured', Math.round(result.lifetimeCesg)],
    ['Lifetime contributions', Math.round(result.lifetimeContrib)],
    ['Suggested annual contribution', RESP_SUGGESTED_CONTRIBUTION(beneficiaryAge, ageNeeded, targetCost, targetIsTodaysDollars, currentBalance, annualReturn, inflationRate)],
    ['Status', status]
  ];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 32 – FHSA (First Home Savings Account) Contribution Room
 * ----------------------------------------------------------------------
 */

/**
 * FHSA_CONTRIBUTION_ROOM
 *
 * Estimates available FHSA room. Rules: $8,000 of room accrues each year from
 * the year the account is opened; unused room carries forward but the carry-
 * forward is capped at $8,000 (so the most you can contribute in any single
 * year is $16,000); the lifetime limit is $40,000.
 *
 * Note: because exact carryforward depends on each year's contribution history,
 * this uses total-contributed-to-date as an approximation and is clearly bounded
 * by the single-year ($16,000) and lifetime ($40,000) limits.
 *
 * @param {number} yearOpened             Calendar year the FHSA was opened
 * @param {number} currentYear            Current calendar year
 * @param {number} totalContributedToDate Total contributed so far (all years)
 *
 * @return {number} Estimated available FHSA contribution room this year
 * @customfunction
 *
 * Example:
 * =FHSA_CONTRIBUTION_ROOM(2023, 2026, 8000)
 */
function FHSA_CONTRIBUTION_ROOM(yearOpened, currentYear, totalContributedToDate) {
  yearOpened             = Number(yearOpened);
  currentYear            = Number(currentYear) || (new Date()).getFullYear();
  totalContributedToDate = Number(totalContributedToDate) || 0;

  var ANNUAL = 8000;
  var LIFETIME = 40000;
  var MAX_SINGLE_YEAR = ANNUAL * 2; // current-year room + one year of carryforward

  if (currentYear < yearOpened) {
    return 0;
  }

  var yearsOpen = currentYear - yearOpened + 1;
  // Room accrues at $8,000/yr but stops once the $40,000 lifetime room is granted.
  var roomAccrued = Math.min(yearsOpen, LIFETIME / ANNUAL) * ANNUAL;

  var remainingLifetime = Math.max(0, LIFETIME - totalContributedToDate);
  var remainingAccrued = Math.max(0, roomAccrued - totalContributedToDate);

  // Bounded by the single-year cap and remaining lifetime room.
  var available = Math.min(remainingAccrued, MAX_SINGLE_YEAR, remainingLifetime);

  return Math.round(Math.max(0, available) * 100) / 100;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 33 – Lifestyle goals: trip savings & vehicle planning
 * ----------------------------------------------------------------------
 *
 * Purpose-built helpers for two common recurring goals that the generic Goals
 * tab only handled as one-off lump sums: funding a yearly travel budget, and
 * planning the ongoing cost and periodic replacement of a vehicle.
 */

/**
 * TRIP_SAVINGS_REQUIRED
 *
 * Level annual contribution needed to fund a recurring yearly travel budget for
 * a number of years, drawing each trip's cost at the start of its year. When the
 * budget is in today's dollars it is inflated each year to preserve purchasing
 * power; otherwise it is treated as a fixed nominal amount.
 *
 * @param {number} annualTripBudget     Cost of one year's trip(s)
 * @param {boolean} costIsTodaysDollars TRUE to inflate the budget each year
 * @param {number} numYears             Number of years of trips to fund
 * @param {number} currentSavings       Money already set aside for trips
 * @param {number} annualReturn         Expected annual return (decimal)
 * @param {number} inflationRate        Inflation rate (decimal)
 *
 * @return {number} Required level annual contribution
 * @customfunction
 *
 * Example:
 * =TRIP_SAVINGS_REQUIRED(8000, TRUE, 20, 5000, 0.05, 0.025)
 */
function TRIP_SAVINGS_REQUIRED(annualTripBudget, costIsTodaysDollars, numYears, currentSavings, annualReturn, inflationRate) {
  annualTripBudget = Number(annualTripBudget);
  numYears         = Number(numYears);
  currentSavings   = Number(currentSavings) || 0;
  annualReturn     = Number(annualReturn);
  inflationRate    = Number(inflationRate) || 0;

  if (numYears <= 0) return 0;

  var g = asBool_(costIsTodaysDollars) ? inflationRate : 0;
  var r = annualReturn;
  var n = numYears;

  // End balance (target 0) = currentSavings*(1+r)^n
  //   + C * sum_{t=0..n-1}(1+r)^(n-t) - sum_{t}cost_t*(1+r)^(n-t)
  var growthN = Math.pow(1 + r, n);

  // Sum of (1+r)^(n-t) for t=0..n-1  ==  sum_{k=1..n}(1+r)^k
  var contribFactor;
  if (!r) {
    contribFactor = n;
  } else {
    contribFactor = (1 + r) * (growthN - 1) / r;
  }

  // Sum of cost_t*(1+r)^(n-t) where cost_t = budget*(1+g)^t
  var x = (1 + g) / (1 + r);
  var costSumGeom;
  if (Math.abs(x - 1) < 1e-12) {
    costSumGeom = n;
  } else {
    costSumGeom = (1 - Math.pow(x, n)) / (1 - x);
  }
  var costFV = annualTripBudget * growthN * costSumGeom;

  var requiredC = (costFV - currentSavings * growthN) / contribFactor;
  return Math.round(Math.max(0, requiredC));
}

/**
 * TRIP_SAVINGS_SCHEDULE
 *
 * Year-by-year travel sinking-fund schedule. If annualContribution is omitted
 * or zero, the level contribution from TRIP_SAVINGS_REQUIRED is used.
 *
 * @param {number} annualTripBudget     Cost of one year's trip(s)
 * @param {boolean} costIsTodaysDollars TRUE to inflate the budget each year
 * @param {number} numYears             Number of years of trips to fund
 * @param {number} currentSavings       Money already set aside for trips
 * @param {number} annualReturn         Expected annual return (decimal)
 * @param {number} inflationRate        Inflation rate (decimal)
 * @param {number} annualContribution   Optional: contribution to test instead
 * @param {number} startYear            Optional: first calendar year
 *
 * @return {Array[]} Table: Year, Trip Cost, Contribution, Withdrawal, End Balance
 * @customfunction
 *
 * Example:
 * =TRIP_SAVINGS_SCHEDULE(8000, TRUE, 20, 5000, 0.05, 0.025)
 */
function TRIP_SAVINGS_SCHEDULE(annualTripBudget, costIsTodaysDollars, numYears, currentSavings, annualReturn, inflationRate, annualContribution, startYear) {
  annualTripBudget   = Number(annualTripBudget);
  numYears           = Number(numYears);
  currentSavings     = Number(currentSavings) || 0;
  annualReturn       = Number(annualReturn);
  inflationRate      = Number(inflationRate) || 0;
  annualContribution = Number(annualContribution) || 0;
  startYear          = Number(startYear) || (new Date()).getFullYear();

  if (numYears <= 0) {
    return [["ERROR: numYears must be greater than 0"]];
  }

  if (!annualContribution) {
    annualContribution = TRIP_SAVINGS_REQUIRED(annualTripBudget, costIsTodaysDollars, numYears, currentSavings, annualReturn, inflationRate);
  }

  var g = asBool_(costIsTodaysDollars) ? inflationRate : 0;
  var balance = currentSavings;
  var table = [['Year', 'Trip Cost', 'Contribution', 'Withdrawal', 'End Balance']];

  for (var t = 0; t < numYears; t++) {
    var tripCost = annualTripBudget * Math.pow(1 + g, t);
    // Start of year: add contribution, take the trip, then grow the remainder.
    balance += annualContribution;
    var withdrawal = Math.min(tripCost, balance);
    balance -= withdrawal;
    balance = balance * (1 + annualReturn);

    table.push([
      startYear + t,
      Math.round(tripCost),
      Math.round(annualContribution),
      Math.round(withdrawal),
      Math.round(balance)
    ]);
  }

  return table;
}

/**
 * CAR_SINKING_FUND
 *
 * Annual and monthly amount to save now to fund the next vehicle purchase,
 * net of any trade-in and money already set aside. Mirrors the spreadsheet's
 * one-off "new car" goal but adds a trade-in offset and a monthly figure.
 *
 * @param {number} yearsUntilReplacement Years until you buy the next vehicle
 * @param {number} replacementCost       Cost of the next vehicle
 * @param {boolean} costIsTodaysDollars  TRUE if cost/trade-in are in today's $
 * @param {number} currentSavings        Money already earmarked
 * @param {number} annualReturn          Expected annual return (decimal)
 * @param {number} inflationRate         Inflation rate (decimal)
 * @param {number} tradeInValue          Optional: today's-$ trade-in/resale of current car
 *
 * @return {Array[]} Two-column summary table
 * @customfunction
 *
 * Example:
 * =CAR_SINKING_FUND(5, 40000, TRUE, 5000, 0.04, 0.025, 8000)
 */
function CAR_SINKING_FUND(yearsUntilReplacement, replacementCost, costIsTodaysDollars, currentSavings, annualReturn, inflationRate, tradeInValue) {
  yearsUntilReplacement = Number(yearsUntilReplacement);
  replacementCost       = Number(replacementCost);
  currentSavings        = Number(currentSavings) || 0;
  annualReturn          = Number(annualReturn);
  inflationRate         = Number(inflationRate) || 0;
  tradeInValue          = Number(tradeInValue) || 0;

  var inflate = asBool_(costIsTodaysDollars);
  var n = Math.max(0, yearsUntilReplacement);
  var grossCost = inflate ? replacementCost * Math.pow(1 + inflationRate, n) : replacementCost;
  var tradeIn = inflate ? tradeInValue * Math.pow(1 + inflationRate, n) : tradeInValue;
  var netCost = Math.max(0, grossCost - tradeIn);

  var fvCurrent = currentSavings * Math.pow(1 + annualReturn, n);
  var gap = Math.max(0, netCost - fvCurrent);

  var annual = (n <= 0) ? gap : pmtAnnuityDue_(annualReturn, n, gap);

  return [
    ['Car Replacement Sinking Fund', ''],
    ['Years until replacement', n],
    ['Projected replacement cost', Math.round(grossCost)],
    ['Projected trade-in / resale', Math.round(tradeIn)],
    ['Net amount to fund', Math.round(netCost)],
    ['Future value of current savings', Math.round(fvCurrent)],
    ['Funding gap', Math.round(gap)],
    ['Required annual contribution', Math.round(annual)],
    ['≈ Required monthly contribution', Math.round(annual / 12)]
  ];
}

/**
 * CAR_REPLACEMENT_SCHEDULE
 *
 * Projects when a vehicle will need replacing and the inflated cost at each
 * replacement over a planning horizon, assuming you replace on a fixed cycle.
 *
 * @param {number} currentVehicleAge      Current age of your vehicle (years)
 * @param {number} replacementIntervalYrs Years you keep a vehicle before replacing
 * @param {number} replacementCost        Cost of a replacement vehicle
 * @param {boolean} costIsTodaysDollars   TRUE if costs are in today's $
 * @param {number} inflationRate          Inflation rate (decimal)
 * @param {number} planningYears          How many years ahead to plan
 * @param {number} tradeInValue           Optional: today's-$ trade-in at each replacement
 *
 * @return {Array[]} Table: Replacement #, Years From Now, Replaced At Age,
 *                    Projected Cost, Projected Trade-In, Net Outlay
 * @customfunction
 *
 * Example:
 * =CAR_REPLACEMENT_SCHEDULE(3, 10, 40000, TRUE, 0.025, 30, 8000)
 */
function CAR_REPLACEMENT_SCHEDULE(currentVehicleAge, replacementIntervalYrs, replacementCost, costIsTodaysDollars, inflationRate, planningYears, tradeInValue) {
  currentVehicleAge     = Number(currentVehicleAge) || 0;
  replacementIntervalYrs = Number(replacementIntervalYrs);
  replacementCost       = Number(replacementCost);
  inflationRate         = Number(inflationRate) || 0;
  planningYears         = Number(planningYears);
  tradeInValue          = Number(tradeInValue) || 0;

  if (replacementIntervalYrs <= 0) {
    return [["ERROR: replacementIntervalYrs must be greater than 0"]];
  }

  var inflate = asBool_(costIsTodaysDollars);
  var table = [['Replacement #', 'Years From Now', 'Replaced At Vehicle Age', 'Projected Cost', 'Projected Trade-In', 'Net Outlay']];

  // First replacement happens when the current vehicle reaches the interval.
  var yearsToNext = Math.max(0, replacementIntervalYrs - currentVehicleAge);
  var count = 0;

  for (var y = yearsToNext; y <= planningYears; y += replacementIntervalYrs) {
    count++;
    var grossCost = inflate ? replacementCost * Math.pow(1 + inflationRate, y) : replacementCost;
    var tradeIn = inflate ? tradeInValue * Math.pow(1 + inflationRate, y) : tradeInValue;
    table.push([
      count,
      y,
      replacementIntervalYrs,
      Math.round(grossCost),
      Math.round(tradeIn),
      Math.round(Math.max(0, grossCost - tradeIn))
    ]);
  }

  if (count === 0) {
    table.push(['—', 'None within horizon', '', '', '', '']);
  }

  return table;
}

/**
 * CAR_TOTAL_COST_OF_OWNERSHIP
 *
 * Estimates the total and annualized cost of owning a vehicle over a holding
 * period, including the purchase price, recurring running costs (maintenance,
 * insurance, fuel/other), and the resale value recovered at the end.
 *
 * @param {number} purchasePrice    Up-front purchase price
 * @param {number} annualMaintenance Annual maintenance/repairs (today's $)
 * @param {number} annualInsurance  Annual insurance (today's $)
 * @param {number} annualFuelOther  Annual fuel + other running costs (today's $)
 * @param {number} ownershipYears   Years you will own the vehicle
 * @param {number} resaleValue      Expected resale value at end (today's $)
 * @param {number} inflationRate    Inflation rate for running costs (decimal)
 *
 * @return {Array[]} Two-column summary table
 * @customfunction
 *
 * Example:
 * =CAR_TOTAL_COST_OF_OWNERSHIP(40000, 1200, 1600, 2400, 10, 8000, 0.025)
 */
function CAR_TOTAL_COST_OF_OWNERSHIP(purchasePrice, annualMaintenance, annualInsurance, annualFuelOther, ownershipYears, resaleValue, inflationRate) {
  purchasePrice     = Number(purchasePrice) || 0;
  annualMaintenance = Number(annualMaintenance) || 0;
  annualInsurance   = Number(annualInsurance) || 0;
  annualFuelOther   = Number(annualFuelOther) || 0;
  ownershipYears    = Number(ownershipYears);
  resaleValue       = Number(resaleValue) || 0;
  inflationRate     = Number(inflationRate) || 0;

  if (ownershipYears <= 0) {
    return [["ERROR: ownershipYears must be greater than 0"]];
  }

  var baseAnnual = annualMaintenance + annualInsurance + annualFuelOther;
  var totalMaintenance = 0, totalInsurance = 0, totalFuel = 0;

  for (var t = 0; t < ownershipYears; t++) {
    var f = Math.pow(1 + inflationRate, t);
    totalMaintenance += annualMaintenance * f;
    totalInsurance   += annualInsurance * f;
    totalFuel        += annualFuelOther * f;
  }

  var totalRunning = totalMaintenance + totalInsurance + totalFuel;
  var depreciation = Math.max(0, purchasePrice - resaleValue);
  var totalCost = depreciation + totalRunning;
  var annualized = totalCost / ownershipYears;

  return [
    ['Total Cost of Ownership', ''],
    ['Holding period (years)', ownershipYears],
    ['Purchase price', Math.round(purchasePrice)],
    ['Resale value at end', Math.round(resaleValue)],
    ['Depreciation (price − resale)', Math.round(depreciation)],
    ['Total maintenance', Math.round(totalMaintenance)],
    ['Total insurance', Math.round(totalInsurance)],
    ['Total fuel & other', Math.round(totalFuel)],
    ['Total running costs', Math.round(totalRunning)],
    ['TOTAL cost of ownership', Math.round(totalCost)],
    ['Annualized cost', Math.round(annualized)],
    ['≈ Monthly cost', Math.round(annualized / 12)]
  ];
}


/**
 * ----------------------------------------------------------------------
 * SECTION 34 – Couple / household projection
 * ----------------------------------------------------------------------
 *
 * Extends the single-scenario projection flow to two people. Each spouse keeps
 * their own ages, balances, contributions, employment income, CPP/OAS, and DB
 * pension; tax is computed PER PERSON (the main reason couples plan together —
 * income split across two sets of brackets), and a combined household target
 * net income is met by drawing first from the lower-income spouse's portfolio.
 *
 * Person 2's inputs use the same named ranges as person 1 with a "_2" suffix
 * (e.g. current_age_2, rrsp_balance_now_2). Any missing person-2 range falls
 * back to a sensible default, so a couple only needs to fill in what differs.
 *
 * Results are written to a "Calcs_Couple" sheet (created if absent), with a
 * per-person summary block at the top and a combined year-by-year table below.
 */

/**
 * runCoupleProjection
 *
 * Menu entry point. Reads both spouses' inputs, computes CPP/OAS for each, and
 * writes a combined household projection to the Calcs_Couple sheet.
 */
function runCoupleProjection() {
  try {
    SpreadsheetApp.getActive().toast('Starting couple projection...', 'Retirement Calculator', 3);

    var p1 = readPersonInputs_('');
    var p2 = readPersonInputs_('_2');
    var household = readHouseholdInputs_(p1);

    var cpp1 = computeCppBenefit_(p1, readCppContribs_());
    var oas1 = computeOasBenefit_(p1);
    var cpp2 = computeCppBenefit_(p2, readCppContribsForSuffix_('_2'));
    var oas2 = computeOasBenefit_(p2);

    runCoupleProjectionTable_(p1, p2, household, cpp1, oas1, cpp2, oas2);

    SpreadsheetApp.getActive().toast('Couple projection complete! Check the Calcs_Couple sheet.', 'Retirement Calculator', 5);
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error running couple projection: ' + e.message);
    throw e;
  }
}

/**
 * readPersonInputs_
 *
 * Reads one person's inputs from named ranges. The suffix is '' for person 1
 * and '_2' for person 2. Shared/household-level ranges (current_year,
 * inflation_rate, real_return, target_net_income_today, province) are read from
 * the unsuffixed names for both people.
 * @private
 */
function readPersonInputs_(suffix) {
  var ss = SpreadsheetApp.getActive();

  function req(name) {
    var range = ss.getRangeByName(name);
    if (!range) {
      throw new Error('Named range "' + name + '" not found. Please add it to the Inputs sheet.');
    }
    return range.getValue();
  }
  function opt(name, fallback) {
    var range = ss.getRangeByName(name);
    if (!range) return fallback;
    var v = range.getValue();
    if (v === '' || v === null) return fallback;
    return v;
  }

  // Shared household-level ranges (always unsuffixed).
  var currentYear = Number(req('current_year'));
  var inflation = Number(req('inflation_rate')) / 100;
  var realReturn = Number(req('real_return')) / 100;

  // Person-level ranges. For person 1 (suffix '') these are required; for
  // person 2 they are optional and fall back to person-1-style defaults so a
  // couple only fills in what differs.
  function person(name, fallback) {
    if (suffix === '') return Number(req(name));
    return Number(opt(name + suffix, fallback));
  }
  function personStr(name, fallback) {
    if (suffix === '') return String(req(name));
    return String(opt(name + suffix, fallback));
  }

  var p = {
    label: suffix === '' ? 'Person 1' : 'Person 2',
    suffix: suffix,
    currentYear: currentYear,
    inflation: inflation,
    realReturn: realReturn,
    currentAge: person('current_age', 0),
    retirementAge: person('retirement_age', 65),
    lifeExpectancyAge: person('life_expectancy_age', 95),
    cppStartAge: person('cpp_start_age', 65),
    oasStartAge: person('oas_start_age', 65),
    currentIncome: person('current_income', 0),
    annualContrib: person('annual_contrib', 0),
    rrspBalanceNow: person('rrsp_balance_now', 0),
    tfsaBalanceNow: person('tfsa_balance_now', 0),
    taxableBalanceNow: person('taxable_balance_now', 0),
    province: personStr('province', 'ON'),
    dbPensionAnnualToday: person('db_pension_annual_today', 0),
    dbPensionStartAge: person('db_pension_start_age', 65)
  };
  p.totalBalanceNow = p.rrspBalanceNow + p.tfsaBalanceNow + p.taxableBalanceNow;
  p.applyOasClawback = asBool_(opt('apply_oas_clawback', true));
  return p;
}

/**
 * readHouseholdInputs_
 *
 * Household-level settings shared by both spouses.
 * @private
 */
function readHouseholdInputs_(p1) {
  var ss = SpreadsheetApp.getActive();
  function opt(name, fallback) {
    var range = ss.getRangeByName(name);
    if (!range) return fallback;
    var v = range.getValue();
    if (v === '' || v === null) return fallback;
    return v;
  }
  function req(name) {
    var range = ss.getRangeByName(name);
    if (!range) throw new Error('Named range "' + name + '" not found.');
    return range.getValue();
  }

  return {
    currentYear: p1.currentYear,
    inflation: p1.inflation,
    realReturn: p1.realReturn,
    // Combined after-tax spending target for the whole household (today's $).
    targetNetIncomeToday: Number(req('target_net_income_today'))
  };
}

/**
 * readCppContribsForSuffix_
 *
 * Reads CPP contribution history for person 2 from cpp_contribs_range_2 if it
 * exists, otherwise returns an empty history.
 * @private
 */
function readCppContribsForSuffix_(suffix) {
  var ss = SpreadsheetApp.getActive();
  var range = ss.getRangeByName('cpp_contribs_range' + suffix);
  if (!range) return [];
  var values = range.getValues();
  var result = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0] || row[0] === '' || row[0] === 0) continue;
    result.push({
      year: Number(row[0]),
      age: Number(row[1]),
      earnings: Number(row[2]),
      ympe: Number(row[3]),
      ratio: Number(row[4])
    });
  }
  return result;
}

/**
 * personYearIncome_
 *
 * Computes one person's non-portfolio income for a given calendar year/age,
 * applying OAS clawback. Returns the taxable and total (incl. non-taxable)
 * components needed downstream.
 * @private
 */
function personYearIncome_(p, cppRes, oasRes, year) {
  var age = p.currentAge + (year - p.currentYear);

  var employment = 0;
  if (age < p.retirementAge) {
    employment = inflateToYear_(p.currentIncome, p.currentYear, year, p.inflation);
  }

  var cpp = 0;
  if (age >= cppRes.startAge) {
    cpp = inflateToYear_(cppRes.annualAtStartToday, p.currentYear, year, p.inflation);
  }

  var oas = 0;
  if (age >= oasRes.startAge) {
    oas = inflateToYear_(oasRes.annualAtStartToday, p.currentYear, year, p.inflation);
  }

  var db = 0;
  if (p.dbPensionAnnualToday > 0 && age >= p.dbPensionStartAge) {
    db = inflateToYear_(p.dbPensionAnnualToday, p.currentYear, year, p.inflation);
  }

  // OAS clawback on this person's own income.
  var oasClawback = 0;
  if (p.applyOasClawback && oas > 0) {
    var threshold = inflateToYear_(OAS_2024.CLAWBACK_THRESHOLD, p.currentYear, year, p.inflation);
    var incomeForClawback = employment + cpp + oas + db;
    if (incomeForClawback > threshold) {
      oasClawback = Math.min((incomeForClawback - threshold) * OAS_2024.CLAWBACK_RATE, oas);
      oas -= oasClawback;
    }
  }

  var taxable = employment + cpp + oas + db; // all taxable streams here
  return {
    age: age,
    employment: employment,
    cpp: cpp,
    oas: oas,
    db: db,
    taxableIncome: taxable
  };
}

/**
 * drawFromPerson_
 *
 * Given a person's other taxable income, the net amount still needed from their
 * portfolio, and their available balance, returns the gross withdrawal (grossed
 * up for tax) and the actual net delivered, capped by the balance.
 * @private
 */
function drawFromPerson_(otherTaxableIncome, netNeeded, balance, currentYear, inflation, year) {
  if (netNeeded <= 0 || balance <= 0) {
    return { gross: 0, net: 0 };
  }
  var pseudoInputs = { currentYear: currentYear, inflation: inflation };
  var marginalRate = computeMarginalRate_(otherTaxableIncome, pseudoInputs, year);
  var grossNeeded = netNeeded / (1 - marginalRate);
  var gross = Math.min(grossNeeded, balance);

  // Net actually delivered, taxing the incremental withdrawal at the bracket(s).
  var taxBefore = computeTax_(otherTaxableIncome, pseudoInputs, year);
  var taxAfter = computeTax_(otherTaxableIncome + gross, pseudoInputs, year);
  var net = gross - (taxAfter - taxBefore);
  return { gross: gross, net: net };
}

/**
 * runCoupleProjectionTable_
 *
 * Builds the combined household projection and writes it to Calcs_Couple.
 * @private
 */
function runCoupleProjectionTable_(p1, p2, household, cpp1, oas1, cpp2, oas2) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Calcs_Couple');
  if (!sheet) {
    sheet = ss.insertSheet('Calcs_Couple');
  }
  sheet.clear();

  // --- Summary block ---
  var summary = [
    ['Couple / Household Projection', '', ''],
    ['', 'Person 1', 'Person 2'],
    ['Current age', p1.currentAge, p2.currentAge],
    ['Retirement age', p1.retirementAge, p2.retirementAge],
    ['CPP start age', p1.cppStartAge, p2.cppStartAge],
    ['OAS start age', p1.oasStartAge, p2.oasStartAge],
    ['CPP (today\'s $/yr)', Math.round(cpp1.annualAtStartToday), Math.round(cpp2.annualAtStartToday)],
    ['OAS (today\'s $/yr)', Math.round(oas1.annualAtStartToday), Math.round(oas2.annualAtStartToday)],
    ['DB pension (today\'s $/yr)', Math.round(p1.dbPensionAnnualToday), Math.round(p2.dbPensionAnnualToday)],
    ['Portfolio now', Math.round(p1.totalBalanceNow), Math.round(p2.totalBalanceNow)],
    ['Household target net income (today\'s $)', Math.round(household.targetNetIncomeToday), '']
  ];
  sheet.getRange(1, 1, summary.length, 3).setValues(summary);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  sheet.getRange(2, 1, 1, 3).setFontWeight('bold');

  // --- Year-by-year table ---
  var headerRow = summary.length + 2;
  var headers = [
    'Year', 'Age P1', 'Age P2',
    'Employment', 'CPP', 'OAS', 'DB Pension',
    'Gross Income', 'Withdrawals', 'Taxes', 'Net Income',
    'Target Net', 'Goal Spending', 'End Balance P1', 'End Balance P2', 'Net Income (today\'s $)'
  ];
  sheet.getRange(headerRow, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(headerRow, 1, 1, headers.length).setFontWeight('bold');

  var bal1 = p1.totalBalanceNow;
  var bal2 = p2.totalBalanceNow;

  // Project until the later of the two life expectancies.
  var endYear = Math.max(
    p1.currentYear + (p1.lifeExpectancyAge - p1.currentAge),
    p2.currentYear + (p2.lifeExpectancyAge - p2.currentAge)
  );

  // Household big-purchase goals draw down the combined portfolio (split across
  // the two spouses in proportion to their balances). No GOALS sheet => no-op.
  var coupleNumYears = endYear - household.currentYear + 1;
  var goalOutflows = goalOutflowsByYearOffset_(household.currentYear, coupleNumYears);

  var rows = [];
  for (var year = household.currentYear; year <= endYear; year++) {
    var i1 = personYearIncome_(p1, cpp1, oas1, year);
    var i2 = personYearIncome_(p2, cpp2, oas2, year);

    var bothRetired = (i1.age >= p1.retirementAge) && (i2.age >= p2.retirementAge);
    var anyRetired = (i1.age >= p1.retirementAge) || (i2.age >= p2.retirementAge);

    // Contributions while each is still working.
    var contrib1 = (i1.age < p1.retirementAge) ? inflateToYear_(p1.annualContrib, p1.currentYear, year, p1.inflation) : 0;
    var contrib2 = (i2.age < p2.retirementAge) ? inflateToYear_(p2.annualContrib, p2.currentYear, year, p2.inflation) : 0;
    bal1 += contrib1;
    bal2 += contrib2;

    // Baseline (pre-withdrawal) taxes and net income, per person.
    var tax1 = computeTax_(i1.taxableIncome, { currentYear: household.currentYear, inflation: household.inflation }, year);
    var tax2 = computeTax_(i2.taxableIncome, { currentYear: household.currentYear, inflation: household.inflation }, year);
    var netBefore = (i1.taxableIncome - tax1) + (i2.taxableIncome - tax2);

    var targetNet = inflateToYear_(household.targetNetIncomeToday, household.currentYear, year, household.inflation);

    var withdrawals = 0;
    var addedTax1 = 0, addedTax2 = 0;
    var gap = targetNet - netBefore;

    if (anyRetired && gap > 0) {
      // Draw from the lower-taxable-income spouse first (stays in lower brackets).
      var first = (i1.taxableIncome <= i2.taxableIncome)
        ? { p: p1, inc: i1, getBal: function () { return bal1; }, setBal: function (v) { bal1 = v; }, addTax: function (t) { addedTax1 += t; } }
        : { p: p2, inc: i2, getBal: function () { return bal2; }, setBal: function (v) { bal2 = v; }, addTax: function (t) { addedTax2 += t; } };
      var second = (first.p === p1)
        ? { p: p2, inc: i2, getBal: function () { return bal2; }, setBal: function (v) { bal2 = v; }, addTax: function (t) { addedTax2 += t; } }
        : { p: p1, inc: i1, getBal: function () { return bal1; }, setBal: function (v) { bal1 = v; }, addTax: function (t) { addedTax1 += t; } };

      var d1 = drawFromPerson_(first.inc.taxableIncome, gap, first.getBal(), household.currentYear, household.inflation, year);
      first.setBal(first.getBal() - d1.gross);
      first.addTax(computeTax_(first.inc.taxableIncome + d1.gross, { currentYear: household.currentYear, inflation: household.inflation }, year) - computeTax_(first.inc.taxableIncome, { currentYear: household.currentYear, inflation: household.inflation }, year));
      withdrawals += d1.gross;
      gap -= d1.net;

      if (gap > 0) {
        var d2 = drawFromPerson_(second.inc.taxableIncome, gap, second.getBal(), household.currentYear, household.inflation, year);
        second.setBal(second.getBal() - d2.gross);
        second.addTax(computeTax_(second.inc.taxableIncome + d2.gross, { currentYear: household.currentYear, inflation: household.inflation }, year) - computeTax_(second.inc.taxableIncome, { currentYear: household.currentYear, inflation: household.inflation }, year));
        withdrawals += d2.gross;
        gap -= d2.net;
      }
    }

    var totalTax = tax1 + tax2 + addedTax1 + addedTax2;
    var grossIncome = i1.taxableIncome + i2.taxableIncome + withdrawals;
    var netIncome = grossIncome - totalTax;

    // Big-purchase goal spending, split across the two portfolios by balance.
    var goalSpending = goalOutflows[year - household.currentYear] || 0;
    if (goalSpending > 0) {
      var combined = bal1 + bal2;
      if (combined > 0) {
        var share1 = goalSpending * (bal1 / combined);
        bal1 = Math.max(0, bal1 - share1);
        bal2 = Math.max(0, bal2 - (goalSpending - share1));
      }
    }

    // Grow remaining balances for the year.
    bal1 = Math.max(0, bal1 * (1 + p1.realReturn));
    bal2 = Math.max(0, bal2 * (1 + p2.realReturn));

    var netToday = discountToYearZero_(netIncome, household.currentYear, year, household.inflation);

    rows.push([
      year, i1.age, i2.age,
      Math.round(i1.employment + i2.employment),
      Math.round(i1.cpp + i2.cpp),
      Math.round(i1.oas + i2.oas),
      Math.round(i1.db + i2.db),
      Math.round(grossIncome),
      Math.round(withdrawals),
      Math.round(totalTax),
      Math.round(netIncome),
      Math.round(targetNet),
      Math.round(goalSpending),
      Math.round(bal1),
      Math.round(bal2),
      Math.round(netToday)
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(headerRow + 1, 1, rows.length, headers.length).setValues(rows);
  }
}


/**
 * ----------------------------------------------------------------------
 * SECTION 35 – Lifetime / recurring sinking funds (multi-event)
 * ----------------------------------------------------------------------
 *
 * Whereas CAR_SINKING_FUND funds the NEXT purchase and TRIP_SAVINGS_* funds a
 * yearly budget, these planners fund a long sequence of lumpy outflows with a
 * single steady savings stream — e.g. replacing a vehicle every 10 years for
 * the rest of your life, or a big trip every few years over decades.
 */

/**
 * levelContribForOutflows_
 *
 * Smallest level annual contribution (paid at the start of each year) such that
 * a fund — starting at currentSavings and growing at annualReturn — covers every
 * dated outflow without ever going negative. Solved by binary search so it works
 * for arbitrary lumpy schedules.
 *
 * @param {Array<number>} outflows  Outflow at the start of each year offset (0-based)
 * @param {number} currentSavings   Opening fund balance
 * @param {number} annualReturn     Expected annual return (decimal)
 * @param {number} numYears         Number of years to simulate
 * @return {number} Required level annual contribution
 * @private
 */
function levelContribForOutflows_(outflows, currentSavings, annualReturn, numYears) {
  function minBalance(C) {
    var bal = currentSavings;
    var lowest = Infinity;
    for (var t = 0; t < numYears; t++) {
      bal += C;
      bal -= (outflows[t] || 0);
      if (bal < lowest) lowest = bal;   // binding point is right after each outflow
      bal = bal * (1 + annualReturn);
    }
    return lowest;
  }

  var total = 0;
  for (var i = 0; i < numYears; i++) total += (outflows[i] || 0);
  if (total <= 0) return 0;
  if (minBalance(0) >= 0) return 0;     // current savings already cover everything

  var lo = 0, hi = total;
  while (minBalance(hi) < 0) hi *= 2;
  for (var k = 0; k < 100; k++) {
    var mid = (lo + hi) / 2;
    if (minBalance(mid) >= 0) hi = mid; else lo = mid;
  }
  return hi;
}

/**
 * CAR_LIFETIME_FUND
 *
 * Plans a single sinking fund that pays for EVERY vehicle replacement over a
 * long horizon (e.g. a new car every 10 years for the next 40), net of trade-in.
 * Returns the required level annual contribution and a year-by-year fund table.
 *
 * @param {number} currentVehicleAge     Age of your current vehicle (years)
 * @param {number} replacementIntervalYrs Years you keep a vehicle before replacing
 * @param {number} replacementCost        Cost of a replacement vehicle
 * @param {boolean} costIsTodaysDollars   TRUE if cost/trade-in are in today's $
 * @param {number} currentSavings         Money already earmarked for vehicles
 * @param {number} annualReturn           Expected annual return (decimal)
 * @param {number} inflationRate          Inflation rate (decimal)
 * @param {number} planningYears          Horizon to plan over (years)
 * @param {number} tradeInValue           Optional: today's-$ trade-in at each replacement
 *
 * @return {Array[]} Row 1: ['Required annual contribution', amount]; then a
 *                    blank row; then Year, Vehicle Age, Replace?, Replacement
 *                    Cost, Trade-In, Net Outlay, Contribution, Fund Balance
 * @customfunction
 *
 * Example:
 * =CAR_LIFETIME_FUND(3, 10, 40000, TRUE, 5000, 0.04, 0.025, 40, 8000)
 */
function CAR_LIFETIME_FUND(currentVehicleAge, replacementIntervalYrs, replacementCost, costIsTodaysDollars, currentSavings, annualReturn, inflationRate, planningYears, tradeInValue) {
  currentVehicleAge      = Number(currentVehicleAge) || 0;
  replacementIntervalYrs = Number(replacementIntervalYrs);
  replacementCost        = Number(replacementCost);
  currentSavings         = Number(currentSavings) || 0;
  annualReturn           = Number(annualReturn);
  inflationRate          = Number(inflationRate) || 0;
  planningYears          = Number(planningYears);
  tradeInValue           = Number(tradeInValue) || 0;

  if (replacementIntervalYrs <= 0) {
    return [["ERROR: replacementIntervalYrs must be greater than 0"]];
  }
  if (planningYears <= 0) {
    return [["ERROR: planningYears must be greater than 0"]];
  }

  var inflate = asBool_(costIsTodaysDollars);
  var startYear = (new Date()).getFullYear();
  var numYears = planningYears + 1;

  // Build the outflow at each year offset and remember which years are replacements.
  var outflows = [];
  var isReplacement = [];
  for (var t = 0; t < numYears; t++) { outflows[t] = 0; isReplacement[t] = false; }

  var yearsToNext = Math.max(0, replacementIntervalYrs - currentVehicleAge);
  for (var y = yearsToNext; y <= planningYears; y += replacementIntervalYrs) {
    var grossCost = inflate ? replacementCost * Math.pow(1 + inflationRate, y) : replacementCost;
    var tradeIn = inflate ? tradeInValue * Math.pow(1 + inflationRate, y) : tradeInValue;
    outflows[y] = Math.max(0, grossCost - tradeIn);
    isReplacement[y] = true;
  }

  var contribution = levelContribForOutflows_(outflows, currentSavings, annualReturn, numYears);

  // Build the year-by-year schedule.
  var table = [
    ['Required annual contribution', Math.round(contribution)],
    ['≈ Required monthly', Math.round(contribution / 12)],
    ['', ''],
    ['Year', 'Vehicle Age', 'Replace?', 'Replacement Cost', 'Trade-In', 'Net Outlay', 'Contribution', 'Fund Balance']
  ];

  var balance = currentSavings;
  var vAge = currentVehicleAge;
  for (var i = 0; i < numYears; i++) {
    var replacing = isReplacement[i];
    var displayAge = vAge;

    var grossCostShown = 0, tradeInShown = 0;
    if (replacing) {
      grossCostShown = inflate ? replacementCost * Math.pow(1 + inflationRate, i) : replacementCost;
      tradeInShown = inflate ? tradeInValue * Math.pow(1 + inflationRate, i) : tradeInValue;
    }

    balance += contribution;
    balance -= outflows[i];
    var balAfter = balance;
    balance = balance * (1 + annualReturn);

    if (replacing) vAge = 0;   // new vehicle this year
    vAge += 1;                 // age one year for the next row

    table.push([
      startYear + i,
      displayAge,
      replacing ? 'Yes' : '',
      Math.round(grossCostShown),
      Math.round(tradeInShown),
      Math.round(outflows[i]),
      Math.round(contribution),
      Math.round(balAfter)
    ]);
  }

  return table;
}

/**
 * TRIP_PLAN
 *
 * Funds a repeating trip over a long horizon — yearly, or on a multi-year cadence
 * (e.g. a big trip every 3 years for 30 years) — with one level annual savings
 * stream. Returns the required contribution and a year-by-year fund table.
 *
 * @param {number} tripCost             Cost of one trip
 * @param {boolean} costIsTodaysDollars TRUE to inflate each trip's cost
 * @param {number} tripIntervalYears    Years between trips (1 = every year)
 * @param {number} planningYears        Horizon to plan over (years)
 * @param {number} firstTripYearsAway   Years until the first trip (0 = this year)
 * @param {number} currentSavings       Money already set aside for trips
 * @param {number} annualReturn         Expected annual return (decimal)
 * @param {number} inflationRate        Inflation rate (decimal)
 *
 * @return {Array[]} Row 1: ['Required annual contribution', amount]; then a
 *                    blank row; then Year, Trip?, Trip Cost, Contribution, Fund Balance
 * @customfunction
 *
 * Example (a $15,000 trip every 3 years for 30 years):
 * =TRIP_PLAN(15000, TRUE, 3, 30, 0, 5000, 0.05, 0.025)
 */
function TRIP_PLAN(tripCost, costIsTodaysDollars, tripIntervalYears, planningYears, firstTripYearsAway, currentSavings, annualReturn, inflationRate) {
  tripCost           = Number(tripCost);
  tripIntervalYears  = Number(tripIntervalYears) || 1;
  planningYears      = Number(planningYears);
  firstTripYearsAway = Number(firstTripYearsAway) || 0;
  currentSavings     = Number(currentSavings) || 0;
  annualReturn       = Number(annualReturn);
  inflationRate      = Number(inflationRate) || 0;

  if (tripIntervalYears <= 0) {
    return [["ERROR: tripIntervalYears must be greater than 0"]];
  }
  if (planningYears <= 0) {
    return [["ERROR: planningYears must be greater than 0"]];
  }

  var inflate = asBool_(costIsTodaysDollars);
  var startYear = (new Date()).getFullYear();
  var numYears = planningYears + 1;

  var outflows = [];
  var isTrip = [];
  for (var t = 0; t < numYears; t++) { outflows[t] = 0; isTrip[t] = false; }

  for (var y = Math.max(0, firstTripYearsAway); y <= planningYears; y += tripIntervalYears) {
    outflows[y] = inflate ? tripCost * Math.pow(1 + inflationRate, y) : tripCost;
    isTrip[y] = true;
  }

  var contribution = levelContribForOutflows_(outflows, currentSavings, annualReturn, numYears);

  var table = [
    ['Required annual contribution', Math.round(contribution)],
    ['≈ Required monthly', Math.round(contribution / 12)],
    ['', ''],
    ['Year', 'Trip?', 'Trip Cost', 'Contribution', 'Fund Balance']
  ];

  var balance = currentSavings;
  for (var i = 0; i < numYears; i++) {
    balance += contribution;
    balance -= outflows[i];
    var balAfter = balance;
    balance = balance * (1 + annualReturn);

    table.push([
      startYear + i,
      isTrip[i] ? 'Yes' : '',
      Math.round(outflows[i]),
      Math.round(contribution),
      Math.round(balAfter)
    ]);
  }

  return table;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 36 – Generic big-purchase planners
 * ----------------------------------------------------------------------
 *
 * Reusable building blocks for any large expense the dedicated planners don't
 * name explicitly: home down payments, renovations, weddings, boats/RVs, major
 * home systems (roof, HVAC, appliances), and so on. The numeric helpers (suffix
 * "_") are shared by both the custom functions below and the GOALS sheet engine.
 */

/**
 * bigPurchaseAnnual_
 * Level annuity-due payment to reach a one-time future goal.
 * @private
 */
function bigPurchaseAnnual_(cost, inflate, years, saved, annualReturn, inflationRate) {
  var future = inflate ? cost * Math.pow(1 + inflationRate, years) : cost;
  var fvSaved = saved * Math.pow(1 + annualReturn, years);
  var gap = Math.max(0, future - fvSaved);
  return years <= 0 ? gap : pmtAnnuityDue_(annualReturn, years, gap);
}

/**
 * recurringAnnual_
 * Level contribution that funds a recurring expense (every intervalYears) over a
 * horizon, first occurring firstYearsAway from now.
 * @private
 */
function recurringAnnual_(cost, inflate, intervalYears, horizon, firstYearsAway, saved, annualReturn, inflationRate) {
  intervalYears = intervalYears > 0 ? intervalYears : 1;
  var numYears = horizon + 1;
  var outflows = [];
  for (var t = 0; t < numYears; t++) outflows[t] = 0;
  for (var y = Math.max(0, firstYearsAway); y <= horizon; y += intervalYears) {
    outflows[y] = inflate ? cost * Math.pow(1 + inflationRate, y) : cost;
  }
  return levelContribForOutflows_(outflows, saved, annualReturn, numYears);
}

/**
 * carLifetimeAnnual_
 * Level contribution that funds every vehicle replacement over a horizon.
 * @private
 */
function carLifetimeAnnual_(currentVehicleAge, intervalYears, cost, inflate, saved, annualReturn, inflationRate, horizon, tradeIn) {
  intervalYears = intervalYears > 0 ? intervalYears : 1;
  var numYears = horizon + 1;
  var outflows = [];
  for (var t = 0; t < numYears; t++) outflows[t] = 0;
  var yearsToNext = Math.max(0, intervalYears - currentVehicleAge);
  for (var y = yearsToNext; y <= horizon; y += intervalYears) {
    var g = inflate ? cost * Math.pow(1 + inflationRate, y) : cost;
    var ti = inflate ? tradeIn * Math.pow(1 + inflationRate, y) : tradeIn;
    outflows[y] = Math.max(0, g - ti);
  }
  return levelContribForOutflows_(outflows, saved, annualReturn, numYears);
}

/**
 * BIG_PURCHASE_FUND
 *
 * Generic one-time big-purchase planner — down payment, renovation, wedding,
 * boat/RV, etc. Returns the level annual and monthly savings required.
 *
 * @param {number} targetCost           Cost of the purchase
 * @param {boolean} costIsTodaysDollars TRUE if targetCost is in today's $
 * @param {number} yearsUntil           Years until the purchase
 * @param {number} currentSavings       Money already set aside
 * @param {number} annualReturn         Expected annual return (decimal)
 * @param {number} inflationRate        Inflation rate (decimal)
 *
 * @return {Array[]} Two-column summary table
 * @customfunction
 *
 * Example (home down payment):
 * =BIG_PURCHASE_FUND(80000, TRUE, 5, 20000, 0.04, 0.025)
 */
function BIG_PURCHASE_FUND(targetCost, costIsTodaysDollars, yearsUntil, currentSavings, annualReturn, inflationRate) {
  targetCost     = Number(targetCost);
  yearsUntil     = Number(yearsUntil);
  currentSavings = Number(currentSavings) || 0;
  annualReturn   = Number(annualReturn);
  inflationRate  = Number(inflationRate) || 0;

  var inflate = asBool_(costIsTodaysDollars);
  var future = inflate ? targetCost * Math.pow(1 + inflationRate, yearsUntil) : targetCost;
  var fvSaved = currentSavings * Math.pow(1 + annualReturn, yearsUntil);
  var gap = Math.max(0, future - fvSaved);
  var annual = bigPurchaseAnnual_(targetCost, inflate, yearsUntil, currentSavings, annualReturn, inflationRate);

  return [
    ['Big Purchase Plan', ''],
    ['Years until purchase', yearsUntil],
    ['Projected cost (future $)', Math.round(future)],
    ['Future value of current savings', Math.round(fvSaved)],
    ['Funding gap', Math.round(gap)],
    ['Required annual contribution', Math.round(annual)],
    ['≈ Required monthly contribution', Math.round(annual / 12)]
  ];
}

/**
 * RECURRING_EXPENSE_FUND
 *
 * Generic recurring big-expense planner — major home systems (roof, HVAC,
 * appliances), recurring travel, etc. One level contribution funds every
 * occurrence over the horizon; the fund never goes negative.
 *
 * @param {number} expenseCost          Cost of one occurrence
 * @param {boolean} costIsTodaysDollars TRUE to inflate each occurrence
 * @param {number} intervalYears        Years between occurrences (1 = every year)
 * @param {number} planningYears        Horizon to plan over (years)
 * @param {number} firstYearsAway       Years until the first occurrence
 * @param {number} currentSavings       Money already set aside
 * @param {number} annualReturn         Expected annual return (decimal)
 * @param {number} inflationRate        Inflation rate (decimal)
 *
 * @return {Array[]} Two-column summary table
 * @customfunction
 *
 * Example (replace a $15,000 roof every 25 years over 40 years):
 * =RECURRING_EXPENSE_FUND(15000, TRUE, 25, 40, 20, 0, 0.04, 0.025)
 */
function RECURRING_EXPENSE_FUND(expenseCost, costIsTodaysDollars, intervalYears, planningYears, firstYearsAway, currentSavings, annualReturn, inflationRate) {
  expenseCost    = Number(expenseCost);
  intervalYears  = Number(intervalYears) || 1;
  planningYears  = Number(planningYears);
  firstYearsAway = Number(firstYearsAway) || 0;
  currentSavings = Number(currentSavings) || 0;
  annualReturn   = Number(annualReturn);
  inflationRate  = Number(inflationRate) || 0;

  if (planningYears <= 0) {
    return [["ERROR: planningYears must be greater than 0"]];
  }

  var inflate = asBool_(costIsTodaysDollars);
  var annual = recurringAnnual_(expenseCost, inflate, intervalYears, planningYears, firstYearsAway, currentSavings, annualReturn, inflationRate);

  return [
    ['Recurring Expense Plan', ''],
    ['Cost per occurrence', Math.round(expenseCost)],
    ['Every (years)', intervalYears],
    ['First occurrence in (years)', firstYearsAway],
    ['Horizon (years)', planningYears],
    ['Required annual contribution', Math.round(annual)],
    ['≈ Required monthly contribution', Math.round(annual / 12)]
  ];
}

/**
 * HOME_MAINTENANCE_RESERVE
 *
 * Projects a home-maintenance reserve funded as a percentage of the (inflating)
 * home value each year — the common "set aside 1–3% of home value per year" rule.
 * Models the reserve building up; actual repairs draw it down as they occur.
 *
 * @param {number} homeValue        Current home value
 * @param {number} annualReservePct Annual reserve as a fraction of home value (e.g. 0.01–0.03)
 * @param {number} planningYears    Years to project
 * @param {number} currentSavings   Opening reserve balance
 * @param {number} annualReturn     Expected annual return on the reserve (decimal)
 * @param {number} inflationRate    Home-value / cost inflation (decimal)
 *
 * @return {Array[]} Table: Year, Home Value, Reserve Contribution, Reserve Balance
 * @customfunction
 *
 * Example (2% of a $600k home for 20 years):
 * =HOME_MAINTENANCE_RESERVE(600000, 0.02, 20, 0, 0.04, 0.025)
 */
function HOME_MAINTENANCE_RESERVE(homeValue, annualReservePct, planningYears, currentSavings, annualReturn, inflationRate) {
  homeValue        = Number(homeValue);
  annualReservePct = Number(annualReservePct);
  planningYears    = Number(planningYears);
  currentSavings   = Number(currentSavings) || 0;
  annualReturn     = Number(annualReturn);
  inflationRate    = Number(inflationRate) || 0;

  if (planningYears <= 0) {
    return [["ERROR: planningYears must be greater than 0"]];
  }

  var startYear = (new Date()).getFullYear();
  var balance = currentSavings;
  var table = [['Year', 'Home Value', 'Reserve Contribution', 'Reserve Balance']];

  for (var t = 0; t <= planningYears; t++) {
    var hv = homeValue * Math.pow(1 + inflationRate, t);
    var contribution = hv * annualReservePct;
    balance += contribution;
    var balAfter = balance;
    balance = balance * (1 + annualReturn);

    table.push([
      startYear + t,
      Math.round(hv),
      Math.round(contribution),
      Math.round(balAfter)
    ]);
  }

  return table;
}


/**
 * ----------------------------------------------------------------------
 * SECTION 37 – GOALS sheet (button-driven backward-funding engine)
 * ----------------------------------------------------------------------
 *
 * Ports the spreadsheet's "Goals" tab into a one-click flow: enter any number of
 * big-purchase goals as rows, hit "Run Lifestyle Goals", and the required annual
 * and monthly savings are filled in for each. Handles lump-sum, recurring, and
 * lifetime-vehicle goals through the engines above.
 */

/**
 * ensureGoalsSheet_
 * Creates the GOALS sheet with headers and example rows if it doesn't exist.
 * @private
 */
function ensureGoalsSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('GOALS');
  if (sheet) return sheet;

  sheet = ss.insertSheet('GOALS');
  var headers = [
    'Goal', 'Type', 'Cost / Target', 'Basis', 'Years Until / Veh. Age',
    'Interval (yrs)', 'Horizon (yrs)', 'Current Saved', 'Return', 'Trade-in / Resale',
    'Inflation', 'Required Annual', 'Required Monthly', 'Notes'
  ];
  var examples = [
    ['Home down payment', 'Lump sum', 80000, "Today's $", 5, '', '', 20000, 0.04, '', 0.025, '', '', ''],
    ['Kitchen renovation', 'Lump sum', 45000, "Today's $", 8, '', '', 0, 0.04, '', 0.025, '', '', ''],
    ['Wedding', 'Lump sum', 35000, "Today's $", 3, '', '', 5000, 0.03, '', 0.025, '', '', ''],
    ['Roof replacement', 'Recurring', 15000, "Today's $", 20, 25, 40, 0, 0.04, '', 0.025, '', '', ''],
    ['HVAC / furnace', 'Recurring', 9000, "Today's $", 12, 15, 40, 0, 0.04, '', 0.025, '', '', ''],
    ['Major appliances', 'Recurring', 6000, "Today's $", 8, 12, 40, 0, 0.04, '', 0.025, '', '', ''],
    ['Annual travel', 'Recurring', 8000, "Today's $", 0, 1, 25, 5000, 0.05, '', 0.025, '', '', ''],
    ['Vehicle (lifetime)', 'Vehicle', 40000, "Today's $", 3, 10, 40, 5000, 0.04, 8000, 0.025, '', '', ''],
    ['Boat / RV', 'Lump sum', 60000, "Today's $", 10, '', '', 0, 0.04, '', 0.025, '', '', '']
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.getRange(2, 1, examples.length, headers.length).setValues(examples);
  sheet.setFrozenRows(1);
  return sheet;
}

/**
 * setupGoalsSheet
 * Menu action: create/verify the GOALS sheet.
 */
function setupGoalsSheet() {
  ensureGoalsSheet_();
  SpreadsheetApp.getActive().toast('GOALS sheet is ready. Enter your goals, then run "Run Lifestyle Goals".');
}

/**
 * goalOutflowsByYearOffset_
 *
 * Reads the GOALS sheet and returns the total nominal big-purchase spending at
 * each year offset (0 = this year). Used by the projection so goals draw down
 * the same portfolio in the years they occur. Returns all-zeros if the GOALS
 * sheet is absent or empty.
 *
 * Note: spending is modelled as a capital outflow (not taxable income) — a
 * documented simplification of the pooled-portfolio model.
 *
 * @param {number} currentYear Projection's base year (offset 0)
 * @param {number} numYears    Number of year offsets to populate
 * @return {Array<number>} Nominal goal spending per year offset
 * @private
 */
function goalOutflowsByYearOffset_(currentYear, numYears) {
  var outflows = [];
  for (var t = 0; t < numYears; t++) outflows[t] = 0;

  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('GOALS');
  if (!sheet) return outflows;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return outflows;

  var data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var name = row[0];
    var type = String(row[1] || '').toLowerCase().trim();
    if (!name || !type) continue;

    var cost       = Number(row[2]) || 0;
    var inflate    = String(row[3] || '').toLowerCase().indexOf('today') >= 0;
    var yearsUntil = Number(row[4]) || 0;          // also "current vehicle age" for Vehicle
    var interval   = Number(row[5]) || 1;
    var horizon    = Number(row[6]) || 30;
    var tradeIn    = Number(row[9]) || 0;
    var infl       = (row[10] === '' || row[10] === null) ? 0.025 : Number(row[10]);
    if (interval <= 0) interval = 1;

    if (type.indexOf('lump') >= 0) {
      var off = yearsUntil;
      if (off >= 0 && off < numYears) {
        outflows[off] += inflate ? cost * Math.pow(1 + infl, off) : cost;
      }
    } else if (type.indexOf('vehicle') >= 0 || type.indexOf('car') >= 0) {
      var yearsToNext = Math.max(0, interval - yearsUntil);
      for (var y = yearsToNext; y <= horizon && y < numYears; y += interval) {
        var g = inflate ? cost * Math.pow(1 + infl, y) : cost;
        var ti = inflate ? tradeIn * Math.pow(1 + infl, y) : tradeIn;
        outflows[y] += Math.max(0, g - ti);
      }
    } else {
      // recurring / trip / home maintenance
      for (var y2 = Math.max(0, yearsUntil); y2 <= horizon && y2 < numYears; y2 += interval) {
        outflows[y2] += inflate ? cost * Math.pow(1 + infl, y2) : cost;
      }
    }
  }

  return outflows;
}

/**
 * runLifestyleGoals
 *
 * Menu action: read each goal row from the GOALS sheet, dispatch to the right
 * engine, and write the required annual/monthly savings plus a note.
 */
function runLifestyleGoals() {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ensureGoalsSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      ss.toast('Add goals to the GOALS sheet first.');
      return;
    }

    var data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    var out = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var name = row[0];
      var type = String(row[1] || '').toLowerCase().trim();

      if (!name || !type) {
        out.push(['', '', '']);
        continue;
      }

      var cost      = Number(row[2]) || 0;
      var inflate   = String(row[3] || '').toLowerCase().indexOf('today') >= 0;
      var yearsUntil = Number(row[4]) || 0;          // also "current vehicle age" for Vehicle
      var interval  = Number(row[5]) || 1;
      var horizon   = Number(row[6]) || 30;
      var saved     = Number(row[7]) || 0;
      var ret       = (row[8] === '' || row[8] === null) ? 0.04 : Number(row[8]);
      var tradeIn   = Number(row[9]) || 0;
      var infl      = (row[10] === '' || row[10] === null) ? 0.025 : Number(row[10]);

      var annual = 0;
      var note = '';

      if (type.indexOf('lump') >= 0) {
        annual = bigPurchaseAnnual_(cost, inflate, yearsUntil, saved, ret, infl);
        note = 'One-time goal in ' + yearsUntil + ' yr(s)';
      } else if (type.indexOf('vehicle') >= 0 || type.indexOf('car') >= 0) {
        annual = carLifetimeAnnual_(yearsUntil, interval, cost, inflate, saved, ret, infl, horizon, tradeIn);
        note = 'Replace every ' + interval + ' yr over ' + horizon + ' yr (current age ' + yearsUntil + ')';
      } else {
        // recurring / trip / home maintenance
        annual = recurringAnnual_(cost, inflate, interval, horizon, yearsUntil, saved, ret, infl);
        note = 'Every ' + interval + ' yr over ' + horizon + ' yr (first in ' + yearsUntil + ')';
      }

      out.push([Math.round(annual), Math.round(annual / 12), note]);
    }

    sheet.getRange(2, 12, out.length, 3).setValues(out);

    // Total of the level annual contributions.
    var total = 0;
    for (var j = 0; j < out.length; j++) total += Number(out[j][0]) || 0;
    sheet.getRange(lastRow + 2, 11, 1, 3).setValues([['TOTAL / yr →', Math.round(total), Math.round(total / 12)]]);

    ss.toast('Lifestyle goals updated — see the Required Annual / Monthly columns.');
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error running lifestyle goals: ' + e.message);
    throw e;
  }
}

/**
 * ----------------------------------------------------------------------
 * SECTION 38 – HELOC & Smith Manoeuvre calculator
 * ----------------------------------------------------------------------
 *
 * The Smith Manoeuvre is a Canadian strategy that gradually converts a
 * non-deductible mortgage into a tax-deductible investment loan using a
 * readvanceable mortgage (mortgage + HELOC). Each month the principal you pay
 * down frees an equal amount of HELOC credit, which you re-borrow and invest;
 * the HELOC interest is tax-deductible (investment purpose), and the resulting
 * tax refund can be applied back to the mortgage to accelerate it.
 *
 * Modelling choices (documented):
 *  - Fixed mortgage rate uses Canadian semi-annual compounding (converted to a
 *    monthly rate); HELOC and returns use monthly compounding.
 *  - HELOC interest is capitalized (the "self-funding" version — no out-of-pocket).
 *  - Tax refund on deductible interest is computed yearly and, if the accelerator
 *    is on, applied to the mortgage (which frees more credit to re-borrow/invest).
 *  - Leverage cuts both ways: this is an educational projection, not advice.
 */

/**
 * HELOC_AVAILABLE_CREDIT
 *
 * Estimates available HELOC room under Canadian limits: a HELOC portion is
 * capped at 65% of home value, and the HELOC + mortgage combined cannot exceed
 * 80% of home value.
 *
 * @param {number} homeValue       Current home value
 * @param {number} mortgageBalance Outstanding mortgage balance
 * @param {number} existingHeloc   HELOC already drawn (optional)
 *
 * @return {number} Estimated available HELOC credit
 * @customfunction
 *
 * Example:
 * =HELOC_AVAILABLE_CREDIT(800000, 400000, 0)
 */
function HELOC_AVAILABLE_CREDIT(homeValue, mortgageBalance, existingHeloc) {
  homeValue       = Number(homeValue);
  mortgageBalance = Number(mortgageBalance) || 0;
  existingHeloc   = Number(existingHeloc) || 0;

  var helocCap = homeValue * 0.65;                       // standalone HELOC limit
  var combinedCap = homeValue * 0.80 - mortgageBalance;  // combined LTV limit
  var available = Math.min(helocCap, combinedCap) - existingHeloc;

  return Math.round(Math.max(0, available) * 100) / 100;
}

/**
 * HELOC_INTEREST_ONLY_PAYMENT
 *
 * Monthly interest-only payment on a HELOC balance (the typical minimum).
 *
 * @param {number} balance    HELOC balance
 * @param {number} annualRate Annual interest rate (decimal)
 *
 * @return {number} Monthly interest-only payment
 * @customfunction
 *
 * Example:
 * =HELOC_INTEREST_ONLY_PAYMENT(100000, 0.065)
 */
function HELOC_INTEREST_ONLY_PAYMENT(balance, annualRate) {
  balance    = Number(balance) || 0;
  annualRate = Number(annualRate) || 0;
  return Math.round(balance * (annualRate / 12) * 100) / 100;
}

/**
 * smithManoeuvreSim_
 *
 * Month-by-month engine shared by the Smith Manoeuvre custom functions.
 * @private
 */
function smithManoeuvreSim_(o) {
  var mortgageBalance = Number(o.mortgageBalance);
  var amortMonths = Math.round(Number(o.amortizationYears) * 12);
  var months = Math.round(Number(o.projectionYears) * 12);
  var tax = Number(o.marginalTaxRate) || 0;

  // Rate conversions: fixed mortgage compounds semi-annually in Canada.
  var rM = Math.pow(1 + Number(o.mortgageRate) / 2, 1 / 6) - 1;
  var rH = Number(o.helocRate) / 12;
  var rInv = Math.pow(1 + Number(o.investmentReturn), 1 / 12) - 1;

  // Fixed monthly mortgage payment over the original amortization.
  var payment = (rM === 0)
    ? mortgageBalance / amortMonths
    : mortgageBalance * rM / (1 - Math.pow(1 + rM, -amortMonths));

  var helocBalance = Number(o.helocBalanceStart) || 0;
  var investBalance = Number(o.investBalanceStart) || 0;

  var rows = [];
  var yearDeductible = 0;
  var cumDeductible = 0, cumRefund = 0;
  var payoffMonth = null;

  for (var m = 1; m <= months; m++) {
    // --- Mortgage payment & re-borrow ---
    if (mortgageBalance > 0) {
      var mInt = mortgageBalance * rM;
      var principal = Math.min(Math.max(0, payment - mInt), mortgageBalance);
      mortgageBalance -= principal;
      helocBalance += principal;   // re-borrow freed credit
      investBalance += principal;  // …and invest it
    }

    // --- HELOC interest (capitalized, deductible) ---
    var hInt = helocBalance * rH;
    helocBalance += hInt;
    yearDeductible += hInt;

    // --- Investment growth ---
    investBalance *= (1 + rInv);

    if (payoffMonth === null && mortgageBalance <= 0.005) {
      payoffMonth = m;
      mortgageBalance = 0;
    }

    // --- Year boundary: tax refund & accelerator ---
    if (m % 12 === 0) {
      var refund = yearDeductible * tax;
      cumDeductible += yearDeductible;
      cumRefund += refund;

      if (asBool_(o.applyRefundToMortgage) && mortgageBalance > 0 && refund > 0) {
        var prepay = Math.min(refund, mortgageBalance);
        mortgageBalance -= prepay;
        helocBalance += prepay;   // freed credit re-borrowed & invested
        investBalance += prepay;
        if (payoffMonth === null && mortgageBalance <= 0.005) {
          payoffMonth = m;
          mortgageBalance = 0;
        }
      }

      rows.push({
        year: m / 12,
        mortgage: mortgageBalance,
        heloc: helocBalance,
        totalDebt: mortgageBalance + helocBalance,
        invest: investBalance,
        deductible: yearDeductible,
        refund: refund,
        netEquity: investBalance - helocBalance
      });
      yearDeductible = 0;
    }
  }

  return {
    rows: rows,
    payoffMonth: payoffMonth,
    payment: payment,
    cumDeductible: cumDeductible,
    cumRefund: cumRefund
  };
}

/**
 * SMITH_MANOEUVRE_SCHEDULE
 *
 * Year-by-year Smith Manoeuvre projection: mortgage paydown, HELOC (investment
 * loan) growth, the investment portfolio, deductible interest, and tax refunds.
 *
 * @param {number} mortgageBalance      Current (non-deductible) mortgage balance
 * @param {number} mortgageRate         Mortgage rate (decimal, e.g. 0.05)
 * @param {number} amortizationYears    Mortgage amortization (years)
 * @param {number} helocRate            HELOC rate (decimal, e.g. 0.065)
 * @param {number} investmentReturn     Expected investment return (decimal)
 * @param {number} marginalTaxRate      Marginal tax rate for the deduction (decimal)
 * @param {boolean} applyRefundToMortgage TRUE to apply the tax refund to the mortgage (accelerator)
 * @param {number} projectionYears      Years to project (optional; defaults to amortizationYears)
 *
 * @return {Array[]} Table: Year, Mortgage, HELOC, Total Debt, Investments,
 *                    Deductible Interest, Tax Refund, Net (Invest − HELOC)
 * @customfunction
 *
 * Example:
 * =SMITH_MANOEUVRE_SCHEDULE(400000, 0.05, 25, 0.065, 0.06, 0.40, TRUE, 25)
 */
function SMITH_MANOEUVRE_SCHEDULE(mortgageBalance, mortgageRate, amortizationYears, helocRate, investmentReturn, marginalTaxRate, applyRefundToMortgage, projectionYears) {
  if (!Number(projectionYears)) projectionYears = amortizationYears;

  var sim = smithManoeuvreSim_({
    mortgageBalance: mortgageBalance,
    mortgageRate: mortgageRate,
    amortizationYears: amortizationYears,
    helocRate: helocRate,
    investmentReturn: investmentReturn,
    marginalTaxRate: marginalTaxRate,
    applyRefundToMortgage: applyRefundToMortgage,
    projectionYears: projectionYears
  });

  var table = [[
    'Year', 'Mortgage', 'HELOC (invest. loan)', 'Total Debt', 'Investments',
    'Deductible Interest', 'Tax Refund', 'Net (Invest − HELOC)'
  ]];
  for (var i = 0; i < sim.rows.length; i++) {
    var r = sim.rows[i];
    table.push([
      r.year,
      Math.round(r.mortgage),
      Math.round(r.heloc),
      Math.round(r.totalDebt),
      Math.round(r.invest),
      Math.round(r.deductible),
      Math.round(r.refund),
      Math.round(r.netEquity)
    ]);
  }
  return table;
}

/**
 * SMITH_MANOEUVRE_SUMMARY
 *
 * Headline results of a Smith Manoeuvre plan, including how much sooner the
 * (non-deductible) mortgage is paid off versus a traditional amortization.
 *
 * @param {number} mortgageBalance      Current mortgage balance
 * @param {number} mortgageRate         Mortgage rate (decimal)
 * @param {number} amortizationYears    Mortgage amortization (years)
 * @param {number} helocRate            HELOC rate (decimal)
 * @param {number} investmentReturn     Expected investment return (decimal)
 * @param {number} marginalTaxRate      Marginal tax rate (decimal)
 * @param {boolean} applyRefundToMortgage TRUE to apply the tax refund (accelerator)
 * @param {number} projectionYears      Years to project (optional; defaults to amortizationYears)
 *
 * @return {Array[]} Two-column summary table
 * @customfunction
 *
 * Example:
 * =SMITH_MANOEUVRE_SUMMARY(400000, 0.05, 25, 0.065, 0.06, 0.40, TRUE, 25)
 */
function SMITH_MANOEUVRE_SUMMARY(mortgageBalance, mortgageRate, amortizationYears, helocRate, investmentReturn, marginalTaxRate, applyRefundToMortgage, projectionYears) {
  if (!Number(projectionYears)) projectionYears = amortizationYears;

  var sim = smithManoeuvreSim_({
    mortgageBalance: mortgageBalance,
    mortgageRate: mortgageRate,
    amortizationYears: amortizationYears,
    helocRate: helocRate,
    investmentReturn: investmentReturn,
    marginalTaxRate: marginalTaxRate,
    applyRefundToMortgage: applyRefundToMortgage,
    projectionYears: projectionYears
  });

  var last = sim.rows.length ? sim.rows[sim.rows.length - 1] : null;
  var payoffYears = sim.payoffMonth ? (sim.payoffMonth / 12) : null;
  var payoffText = payoffYears ? (Math.round(payoffYears * 10) / 10) : 'Not within horizon';
  var yearsSaved = payoffYears ? Math.round((Number(amortizationYears) - payoffYears) * 10) / 10 : '—';

  return [
    ['Smith Manoeuvre Summary', ''],
    ['Monthly mortgage payment', Math.round(sim.payment)],
    ['Mortgage paid off in (years)', payoffText],
    ['Traditional amortization (years)', Number(amortizationYears)],
    ['Years saved on mortgage', yearsSaved],
    ['Final investment portfolio', last ? Math.round(last.invest) : 0],
    ['Final HELOC (investment loan)', last ? Math.round(last.heloc) : 0],
    ['Net investment equity (Invest − HELOC)', last ? Math.round(last.netEquity) : 0],
    ['Total deductible interest', Math.round(sim.cumDeductible)],
    ['Total tax refunds', Math.round(sim.cumRefund)],
    ['Note', 'Leveraged strategy — investment & rate risk apply. Educational only, not advice.']
  ];
}
