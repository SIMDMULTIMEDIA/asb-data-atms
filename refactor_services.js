const fs = require('fs');
const path = require('path');

const servicesDir = './src/services';

const files = fs.readdirSync(servicesDir)
  .filter(f => f.endsWith('.ts'))
  .map(f => path.join(servicesDir, f));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // We want to match: export const funcName = async (...args): Promise<ReturnType> => {
  // and inject:
  // const db = getFirebaseDb();
  // if (!db) { console.warn("Firestore unavailable"); return FALLBACK; }
  
  // To do this robustly, let's use a regex that matches the function declaration
  const funcRegex = /export const (\w+) = (?:async\s*)?\([^)]*\)(?:\s*:\s*Promise<([^>]+)>)?\s*=>\s*\{/g;
  
  content = content.replace(funcRegex, (match, funcName, returnType) => {
    // If the function doesn't use Firebase (doesn't contain getFirebaseDb later), 
    // it's tricky to know unless we check the whole file. But injecting `getFirebaseDb` 
    // is safe as long as it's imported.
    if (!content.includes('getFirebaseDb')) return match;
    
    // Determine fallback
    let fallback = 'null';
    if (!returnType) fallback = 'null';
    else if (returnType.includes('[]')) fallback = '[]';
    else if (returnType === 'void') fallback = '';
    else if (returnType === 'string') fallback = '""';
    else if (returnType === 'boolean') fallback = 'false';
    else if (returnType.includes('null')) fallback = 'null';
    
    const injection = `
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in ${funcName}");
    return ${fallback};
  }`;

    return match + injection;
  });

  // Now replace `getFirebaseDb() as any` with `db`
  if (content.includes('getFirebaseDb() as any')) {
    content = content.replace(/getFirebaseDb\(\) as any/g, 'db');
    changed = true;
  }
  
  // In some files, getFirebaseDb() was used without `as any`
  if (content.includes('getFirebaseDb()')) {
    // Careful not to replace our newly injected `getFirebaseDb()`
    // We only replaced `getFirebaseDb() as any` above.
    // Let's just leave the rest or do a manual review if needed.
  }

  if (changed || content.includes('Firestore unavailable')) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
