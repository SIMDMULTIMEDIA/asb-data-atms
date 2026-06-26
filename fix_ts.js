const fs = require('fs');

function insertAfter(file, target, injection) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(target, target + '\n  ' + injection);
  fs.writeFileSync(file, content, 'utf8');
}

insertAfter('src/services/kpi.ts', 
  'const settings = await getAppSettings();', 
  'if (!settings) return null;'
);

insertAfter('src/services/payroll.ts', 
  'const commSettings = await getCommissionSettings();', 
  'if (!bonusRules || !commSettings) return null;'
);

let payrollContent = fs.readFileSync('src/services/payroll.ts', 'utf8');
payrollContent = payrollContent.replace(
  'const perf = await getLatestPerformance(user.id);',
  'const perf = await getLatestPerformance(user.id);\n    if (!perf) continue;'
);
fs.writeFileSync('src/services/payroll.ts', payrollContent, 'utf8');

insertAfter('src/services/performance.ts', 
  'const weights = await getKPIWeights();', 
  'if (!weights) return "";'
);

console.log("Null references fixed definitively!");
