const fs = require('fs');
const path = require('path');

const apiFile = path.join(__dirname, '../../frontend/src/services/api.js');
const apiContent = fs.readFileSync(apiFile, 'utf8');

// Parse methods in api object
const methodRegex = /async\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)(?=\n\s*(?:async\s+[a-zA-Z0-9_]+|[a-zA-Z0-9_]+\s*\(|getRecordingAudioUrl|\}))/g;
let m;
const apiMethods = [];

while ((m = methodRegex.exec(apiContent)) !== null) {
  const methodName = m[1];
  const params = m[2];
  const body = m[3];
  
  // Extract fetch URLs
  const urlMatch = body.match(/fetch\s*\(\s*(?:`\$\{API_BASE\}([^`]+)`|`([^`]+)`|'([^']+)'|"([^"]+)")/);
  const methodMatch = body.match(/method\s*:\s*['"]([A-Z]+)['"]/);
  const httpMethod = methodMatch ? methodMatch[1] : 'GET';
  const endpoint = urlMatch ? (urlMatch[1] || urlMatch[2] || urlMatch[3] || urlMatch[4]) : 'UNKNOWN';

  apiMethods.push({
    methodName,
    params,
    httpMethod,
    endpoint: endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`
  });
}

// Find usage in frontend/src
const srcDir = path.join(__dirname, '../../frontend/src');
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(full);
    }
  });
  return results;
}

const allSrcFiles = getFiles(srcDir);
const pageUsageMap = {};

apiMethods.forEach(apiM => {
  pageUsageMap[apiM.methodName] = [];
  allSrcFiles.forEach(file => {
    if (file.endsWith('api.js')) return;
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(path.join(__dirname, '../../frontend/src'), file).replace(/\\/g, '/');
    if (content.includes(`api.${apiM.methodName}(`) || content.includes(`api.${apiM.methodName} `)) {
      pageUsageMap[apiM.methodName].push(relFile);
    }
  });
});

console.log(`Discovered ${apiMethods.length} api service methods in frontend/src/services/api.js.`);
const report = apiMethods.map(m => ({
  ...m,
  usedInPages: pageUsageMap[m.methodName] || []
}));

fs.writeFileSync(path.join(__dirname, 'frontend_api_map.json'), JSON.stringify(report, null, 2));
console.log('Saved frontend_api_map.json');
