const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../routes');
const files = fs.readdirSync(routesDir);

const mountMap = {
  'authRoutes.js': '/api/auth',
  'userRoutes.js': '/api/users',
  'dashboardRoutes.js': '/api/dashboard',
  'learningRoutes.js': '/api/learning', // also mounted on /api/modules
  'practiceRoutes.js': '/api/practice',
  'songRoutes.js': '/api/songs',
  'adminRoutes.js': '/api/admin',
  'teacherRoutes.js': '/api/teacher',
  'breathManagementRoutes.js': '/api/breath-management',
  'cmsRoutes.js': '/api/cms'
};

const inventory = [];

files.forEach(file => {
  if (!file.endsWith('.js')) return;
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = content.split('\n');
  const mount = mountMap[file] || '/api';

  lines.forEach((line, idx) => {
    const match = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/i);
    if (match) {
      const fullPath = (mount + (match[2] === '/' ? '' : match[2])).replace(/\/+/g, '/');
      inventory.push({
        file,
        method: match[1].toUpperCase(),
        subPath: match[2],
        fullPath,
        line: idx + 1,
        raw: line.trim()
      });
    }
  });
});

// Also include health endpoints from server.js
inventory.push({ file: 'server.js', method: 'GET', subPath: '/api/health', fullPath: '/api/health', line: 127, raw: "app.get('/api/health')" });
inventory.push({ file: 'server.js', method: 'GET', subPath: '/api/health/ready', fullPath: '/api/health/ready', line: 138, raw: "app.get('/api/health/ready')" });
inventory.push({ file: 'server.js', method: 'GET', subPath: '/api/health/live', fullPath: '/api/health/live', line: 178, raw: "app.get('/api/health/live')" });
inventory.push({ file: 'server.js', method: 'GET', subPath: '/api/health/circuits', fullPath: '/api/health/circuits', line: 192, raw: "app.get('/api/health/circuits')" });

console.log(`Discovered ${inventory.length} total backend routes:`);
inventory.forEach(r => console.log(`${r.method.padEnd(6)} ${r.fullPath.padEnd(50)} [${r.file}:${r.line}]`));

fs.writeFileSync(path.join(__dirname, 'inventory.json'), JSON.stringify(inventory, null, 2));
