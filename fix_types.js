const fs = require('fs');

const fixTypes = (file, typesToFix) => {
  let content = fs.readFileSync(file, 'utf8');
  for (const t of typesToFix) {
    // replace `Promise<T>` with `Promise<T | null>`
    const regex = new RegExp(`Promise<${t}>`, 'g');
    content = content.replace(regex, `Promise<${t} | null>`);
  }
  fs.writeFileSync(file, content, 'utf8');
};

fixTypes('src/services/kpi.ts', ['AppSettings', 'KPIScore']);
fixTypes('src/services/payroll.ts', ['EmployeeCompensation', 'PayrollGenerationLog']);
fixTypes('src/services/performance.ts', ['EmployeePerformance']);
fixTypes('src/services/settings.ts', ['CompanySettings', 'KPIWeights', 'CommissionSettings', 'PerformanceBonusRules']);

console.log("Types fixed!");
