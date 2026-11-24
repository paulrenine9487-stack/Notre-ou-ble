const fs = require('fs');
const path = require('path');

const backendInventory = JSON.parse(fs.readFileSync(path.join(__dirname, 'inventory.json'), 'utf8'));
const frontendMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'frontend_api_map.json'), 'utf8'));

// Helper to convert express route to regex
function routeToRegex(route) {
  const pattern = route
    .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
    .replace(/\//g, '\\/');
  return new RegExp(`^${pattern}$`);
}

const backendEndpoints = backendInventory.map(b => ({
  ...b,
  regex: routeToRegex(b.fullPath)
}));

const discrepancies = [];
const matched = [];

frontendMap.forEach(f => {
  // Normalize endpoint
  const endpoint = f.endpoint.split('?')[0];
  const found = backendEndpoints.find(b => b.method === f.httpMethod && b.regex.test(endpoint));
  if (found) {
    matched.push({ frontend: f, backend: found });
  } else {
    // Check if path exists under different method
    const methodMismatch = backendEndpoints.find(b => b.regex.test(endpoint));
    discrepancies.push({
      frontend: f,
      issue: methodMismatch ? `METHOD_MISMATCH (Frontend: ${f.httpMethod}, Backend: ${methodMismatch.method})` : 'ENDPOINT_NOT_FOUND_IN_BACKEND'
    });
  }
});

console.log(`Matched: ${matched.length}`);
console.log(`Discrepancies: ${discrepancies.length}`);
discrepancies.forEach(d => {
  console.log(`[${d.issue}] ${d.frontend.httpMethod} ${d.frontend.endpoint} (${d.frontend.methodName}) used in: ${d.frontend.usedInPages.join(', ') || 'NONE'}`);
});

fs.writeFileSync(path.join(__dirname, 'route_reconciliation.json'), JSON.stringify({ matched, discrepancies }, null, 2));
