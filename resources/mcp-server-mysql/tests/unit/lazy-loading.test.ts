import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Lazy Loading Implementation', () => {
  // Read the source file directly to check the implementation
  const sourceCode = fs.readFileSync(path.resolve(__dirname, '../../index.ts'), 'utf8');

  it('should use lazy loading pattern for Server', () => {
    // Check that the source code contains the lazy loading pattern for server
    expect(sourceCode).toContain('let serverInstance: Promise<Server> | null = null');
    expect(sourceCode).toContain('const getServer = (): Promise<Server> =>');
    expect(sourceCode).toContain('if (!serverInstance) {');
    expect(sourceCode).toContain('serverInstance = new Promise<Server>');
  });

  it('should use lazy loading pattern for MySQL pool', () => {
    // Check that the source code contains the lazy loading pattern for pool
    expect(sourceCode).toContain('let poolPromise: Promise<mysql2.Pool>');
    expect(sourceCode).toContain('const getPool = (): Promise<mysql2.Pool> =>');
    expect(sourceCode).toContain('if (!poolPromise) {');
    expect(sourceCode).toContain('poolPromise = new Promise<mysql2.Pool>');
  });
  
  it('should reuse the serverInstance/poolPromise between calls', () => {
    // Check that the source only initializes once
    expect(sourceCode).not.toContain('serverInstance = null');
    expect(sourceCode).not.toContain('poolPromise = null');
    
    // The getter functions should only create a new instance if not already created
    // If these patterns exist, the implementation is correctly lazy-loading
    const poolPattern = /if \(!poolPromise\) \{[^}]+\}/s;
    const serverPattern = /if \(!serverInstance\) \{[^}]+\}/s;
    
    expect(poolPattern.test(sourceCode)).toBeTruthy();
    expect(serverPattern.test(sourceCode)).toBeTruthy();
  });
});

describe('Code Structure Analysis for Lazy Loading', () => {
  // Read the source file directly to analyze
  const sourceCode = fs.readFileSync(path.resolve(__dirname, '../../index.ts'), 'utf8');
  
  it('should verify that the server startup process is lazy loaded', () => {
    // Check that runServer only calls getServer/getPool when needed
    const serverStartupCode = sourceCode.match(/async function runServer\(\)[^}]+}/s)?.[0] || '';
    expect(serverStartupCode).toContain('await getPool()');
    expect(serverStartupCode).toContain('await getServer()');
  });
  
  it('should confirm that executeQuery uses getPool to get connections', () => {
    // Check that executeQuery uses getPool
    const executeQueryCode = sourceCode.match(/async function executeQuery[^}]+}/s)?.[0] || '';
    expect(executeQueryCode).toContain('getPool');
    expect(executeQueryCode).toContain('await getPool()');
  });

  it('should confirm that query functions use getPool', () => {
    // Instead of regex, which is having issues, check overall sourceCode
    // These functions should use getPool at some point
    expect(sourceCode).toContain('async function executeReadOnlyQuery');
    expect(sourceCode).toContain('async function executeWriteQuery');
    
    // Verify getPool is used somewhere in these functions
    const readOnlyPattern = /executeReadOnlyQuery[^{]*{(.|\n)*?const pool = await getPool\(\)(.|\n)*?}/ms;
    const writePattern = /executeWriteQuery[^{]*{(.|\n)*?const pool = await getPool\(\)(.|\n)*?}/ms;
    
    expect(readOnlyPattern.test(sourceCode)).toBeTruthy();
    expect(writePattern.test(sourceCode)).toBeTruthy();
  });
  
  it('should confirm that exported functions use lazy-loaded modules', () => {
    // The export pattern should include the lazy-loading functions
    expect(sourceCode).toContain('export { executeQuery, executeReadOnlyQuery, executeWriteQuery, getServer }');
  });
}); 