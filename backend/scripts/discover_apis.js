const fs = require('fs');
const path = require('path');

const routesDir = path.resolve(__dirname, '../routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

// Route mounts from server.js
const mountPoints = {
  'authRoutes.js': '/api/auth',
  'userRoutes.js': '/api/users',
  'dashboardRoutes.js': '/api/dashboard',
  'learningRoutes.js': '/api/learning',
  'practiceRoutes.js': '/api/practice',
  'songRoutes.js': '/api/songs',
  'adminRoutes.js': '/api/admin',
  'teacherRoutes.js': '/api/teacher',
  'breathManagementRoutes.js': '/api/breath-management',
  'cmsRoutes.js': '/api/cms'
};

const inventory = [];

routeFiles.forEach(file => {
  const mount = mountPoints[file] || '/api';
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, lineNum) => {
    const match = line.match(/router\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/);
    if (match) {
      const method = match[1].toUpperCase();
      const subPath = match[2];
      const fullPath = (subPath === '/' ? mount : `${mount}${subPath}`).replace(/\/+/g, '/');
      inventory.push({
        file,
        line: lineNum + 1,
        method,
        subPath,
        fullPath,
        lineText: line.trim()
      });
    }
  });
});

console.log(`Discovered ${inventory.length} backend API endpoints across ${routeFiles.length} router files:`);
inventory.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.method}] ${item.fullPath} (File: ${item.file}:${item.line})`);
});

// Also scan frontend api.js
const apiJsPath = path.resolve(__dirname, '../../frontend/src/services/api.js');
const apiJsContent = fs.readFileSync(apiJsPath, 'utf8');
const feEndpoints = [];
const apiJsLines = apiJsContent.split('\n');
apiJsLines.forEach((line, idx) => {
  const fetchMatch = line.match(/fetch\(`?\$\{API_BASE\}([^`'\"]+)/);
  if (fetchMatch) {
    feEndpoints.push({
      line: idx + 1,
      path: fetchMatch[1]
    });
  }
});
console.log(`\nDiscovered ${feEndpoints.length} API client calls in frontend/src/services/api.js`);
