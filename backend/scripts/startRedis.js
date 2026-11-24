#!/usr/bin/env node

/**
 * No Tre(ou)ble - Local Redis Server Starter
 * Automatically locates redis-server on Windows (via PATH or WinGet packages)
 * and starts it with the configured port and binding.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.REDIS_PORT || '6379';
const HOST = process.env.REDIS_HOST || '127.0.0.1';

function findRedisServerBinary() {
  // 1. Try finding in PATH
  try {
    const whereOutput = execSync('where.exe redis-server 2>nul', { encoding: 'utf8' }).trim();
    if (whereOutput) {
      const firstLine = whereOutput.split('\r\n')[0].trim();
      if (fs.existsSync(firstLine)) return firstLine;
    }
  } catch (_) {}

  // 2. Check WinGet Packages directory
  const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\HP\\AppData\\Local';
  const wingetPackages = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(wingetPackages)) {
    const entries = fs.readdirSync(wingetPackages);
    for (const entry of entries) {
      if (entry.toLowerCase().includes('redis')) {
        const candidate = path.join(wingetPackages, entry, 'redis-server.exe');
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  // 3. Check common installation directories
  const commonPaths = [
    'C:\\Program Files\\Redis\\redis-server.exe',
    'C:\\Program Files\\Memurai\\memurai.exe',
    'C:\\redis\\redis-server.exe'
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
}

const binaryPath = findRedisServerBinary();

if (!binaryPath) {
  console.error('[No Tre(ou)ble Redis Starter Error] redis-server binary not found.');
  console.error('Please install Redis via: winget install taizod1024.redis-windows-fork');
  process.exit(1);
}

console.log('====================================================');
console.log('  No Tre(ou)ble - Local Redis Service Manager        ');
console.log(`  Binary  : ${binaryPath}`);
console.log(`  Binding : ${HOST}:${PORT}`);
console.log('====================================================');

const redisProcess = spawn(binaryPath, ['--port', PORT, '--bind', HOST, '--protected-mode', 'yes'], {
  stdio: 'inherit'
});

redisProcess.on('error', (err) => {
  console.error('[Redis Manager Error]:', err.message);
  process.exit(1);
});

redisProcess.on('exit', (code, signal) => {
  console.log(`[Redis Manager] Redis process exited with code ${code} (signal: ${signal})`);
  process.exit(code || 0);
});

const cleanup = () => {
  console.log('\n[Redis Manager] Shutting down Redis server...');
  redisProcess.kill('SIGTERM');
  setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
