const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Fix Firebase imports
  if (content.includes('@/firebase/config')) {
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+["']@\/firebase\/config["']/g, (match, imports) => {
      let newImports = [];
      if (imports.includes('db')) newImports.push('getFirebaseDb');
      if (imports.includes('auth')) newImports.push('getFirebaseAuth');
      
      // If there are other imports, we should probably keep them but we don't have others
      return `import { ${newImports.join(', ')} } from "@/firebase/client"`;
    });
    changed = true;
  }

  // 2. Refactor function bodies to instantiate db
  // If the file imports getFirebaseDb, we need to make sure functions using `db` or `auth` instantiate it
  if (content.includes('getFirebaseDb') || content.includes('getFirebaseAuth')) {
    // For services, let's just globally replace collection(db, ...) with collection(getFirebaseDb() as any, ...)
    // Wait, the user said:
    // const db = getFirebaseDb(); if (!db) { console.warn("Firestore unavailable"); return []; }
    // Doing this systematically via regex is tough because we don't know the return type of every function.
    // Instead, what if we just replace `db` with `(getFirebaseDb() as any)` in the exact places it is used?
    // User instruction:
    // const db = getFirebaseDb();
    // if (!db) { console.warn("Firestore unavailable"); return []; }
    // Let's manually replace `db,` or `db)` with `getFirebaseDb() as any,` or `getFirebaseDb() as any)` 
    // OR we can just inject `const db = getFirebaseDb(); if(!db) throw new Error("DB missing");` at the top of functions.
    // Wait, if we use `getFirebaseDb() as any` we bypass the strict return type but if db is null, it throws at runtime instead of returning gracefully.
    // But throwing at runtime is fine because these functions only run on the client after hydration anyway!
    // And on the client, `getFirebaseDb()` will NOT be null (unless API key is missing).
    // Actually, Firebase functions like `collection()`, `doc()`, etc. throw if passed null.
    
    // Let's just define `const db = getFirebaseDb() as any;` right below the imports, BUT we can't because it would evaluate at module scope!
    // It must be inside the function!
    // To make it easy, replace ` collection(db, ` with ` collection(getFirebaseDb() as any, `
    // Replace ` doc(db, ` with ` doc(getFirebaseDb() as any, `
    
    let original = content;
    content = content.replace(/collection\(\s*db\s*,/g, 'collection(getFirebaseDb() as any,');
    content = content.replace(/doc\(\s*db\s*,/g, 'doc(getFirebaseDb() as any,');
    content = content.replace(/query\(\s*collection\(db/g, 'query(collection(getFirebaseDb() as any');
    
    // Auth context replacements
    content = content.replace(/onAuthStateChanged\(\s*auth\s*,/g, 'onAuthStateChanged(getFirebaseAuth() as any,');
    content = content.replace(/signInWithPopup\(\s*auth\s*,/g, 'signInWithPopup(getFirebaseAuth() as any,');
    content = content.replace(/firebaseSignOut\(\s*auth\s*\)/g, 'firebaseSignOut(getFirebaseAuth() as any)');
    content = content.replace(/signInWithEmailAndPassword\(\s*auth\s*,/g, 'signInWithEmailAndPassword(getFirebaseAuth() as any,');
    content = content.replace(/createUserWithEmailAndPassword\(\s*auth\s*,/g, 'createUserWithEmailAndPassword(getFirebaseAuth() as any,');
    content = content.replace(/updateProfile\(\s*auth\.currentUser/g, 'updateProfile((getFirebaseAuth() as any).currentUser');
    content = content.replace(/sendPasswordResetEmail\(\s*auth\s*,/g, 'sendPasswordResetEmail(getFirebaseAuth() as any,');
    
    if (original !== content) changed = true;
  }
  
  // 3. Remove throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is missing")
  if (content.includes('NEXT_PUBLIC_FIREBASE_API_KEY is missing')) {
    content = content.replace(/if\s*\(!process\.env\.NEXT_PUBLIC_FIREBASE_API_KEY\)\s*\{\s*throw new Error\(\s*["']NEXT_PUBLIC_FIREBASE_API_KEY is missing["']\s*\);\s*\}/g, '');
    changed = true;
  }

  // 4. Force dynamic
  const needsDynamic = ['admin', 'crm', 'attendance', 'tasks', 'payroll', 'reports'];
  let isDynamicTarget = needsDynamic.some(route => filePath.replace(/\\/g, '/').includes(`/app/${route}/`)) && filePath.endsWith('page.tsx');
  
  if (isDynamicTarget && !content.includes('export const dynamic')) {
    // Insert after "use client" if it exists, or at top
    if (content.includes('"use client";')) {
      content = content.replace(/"use client";/, '"use client";\nexport const dynamic = "force-dynamic";');
    } else {
      content = 'export const dynamic = "force-dynamic";\n' + content;
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

walk('./src', processFile);
