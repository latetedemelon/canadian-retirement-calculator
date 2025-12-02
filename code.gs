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
 * Creates / verifies both INPUTS and OTHER_INCOME sheets.
 */
function setupRetirementSheets() {
  ensureInputsSheet_();
  ensureOtherIncomeSheet_();
  SpreadsheetApp.getActive().toast('INPUTS and OTHER_INCOME sheets are ready.');
}

/**
 * Add a custom menu on open.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Retirement')
    .addItem('Setup sheets (INPUTS & OTHER_INCOME)', 'setupRetirementSheets')
    .addToUi();
}