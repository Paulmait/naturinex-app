const fs = require('fs');
const path = require('path');

const files = [
  'src/web/components/WebNavigation.js',
  'src/web/pages/WebDashboard.js',
  'src/web/pages/WebHistory.js',
  'src/web/pages/WebPayment.js',
  'src/web/pages/WebProfile.js',
  'src/web/pages/WebScan.js',
  'src/web/pages/WebSubscription.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove getAuth from imports
  content = content.replace(/import { getAuth([^}]*)} from 'firebase\/auth';/g, (match, rest) => {
    const cleaned = rest.replace(/, getAuth|getAuth,\s*/g, '');
    return `import {${cleaned}} from 'firebase/auth';`;
  });
  
  // Add auth to firebase.web import if db is already imported
  content = content.replace(/import { db } from '\.\.\/\.\.\/firebase\.web';/g, 
    "import { auth, db } from '../../firebase.web';");
  
  // Add auth import if not already importing from firebase.web
  if (!content.includes("from '../../firebase.web'")) {
    content = content.replace(/import {[^}]+} from 'firebase\/auth';/g, (match) => {
      return match + "\nimport { auth } from '../../firebase.web';";
    });
  }
  
  // Remove the const auth = getAuth() line
  content = content.replace(/\s*const auth = getAuth\(\);/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('All files updated!');