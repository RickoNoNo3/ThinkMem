import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

describe('Startup Integration Tests', () => {
  const executablePath = path.join(__dirname, '../../dist/index.js');

  describe('CLI Integration', () => {
    test('should show help', (done) => {
      const childProcess = spawn('node', [executablePath, '--help'], {
        stdio: 'pipe'
      });

      let output = '';
      childProcess.stdout?.on('data', (data: any) => {
        output += data.toString();
      });

      childProcess.on('close', (code) => {
        expect(code).toBe(0);
        expect(output).toContain('Usage:');
        expect(output).toContain('Options:');
        done();
      });

      childProcess.on('error', (error: any) => {
        done(error);
      });
    });

    test('should show version', (done) => {
      const childProcess = spawn('node', [executablePath, '--version'], {
        stdio: 'pipe'
      });

      let output = '';
      childProcess.stdout?.on('data', (data: any) => {
        output += data.toString();
      });

      childProcess.on('close', (code) => {
        expect(code).toBe(0);
        expect(output).toMatch(/\d+\.\d+\.\d+/);
        done();
      });

      childProcess.on('error', (error: any) => {
        done(error);
      });
    });

    test('should reject invalid mode', (done) => {
      const childProcess = spawn('node', [executablePath, '--mode', 'invalid'], {
        stdio: 'pipe'
      });

      let output = '';
      childProcess.stderr?.on('data', (data) => {
        output += data.toString();
      });

      childProcess.on('close', (code) => {
        expect(code).not.toBe(0);
        done();
      });

      childProcess.on('error', (error: any) => {
        done(error);
      });
    });
  });

  describe('HTTP Listening Integration', () => {
    test('should handle process startup and shutdown', (done) => {
      const childProcess = spawn('node', [executablePath, '--mode', 'http', '--port', '9999'], {
        stdio: 'pipe'
      });

      let started = false;
      let output = '';

      childProcess.stdout?.on('data', (data) => {
        output += data.toString();
        if (output.includes('running on port')) {
          started = true;
          // Give it a moment to fully start
          setTimeout(() => {
            childProcess.kill('SIGTERM');
          }, 3000);
        }
      });

      childProcess.stderr?.on('data', (data) => {
        console.error('Process stderr:', data.toString());
      });

      childProcess.on('exit', (code) => {
        expect(started).toBe(true);
        done();
      });

      childProcess.on('error', (error: any) => {
        done(error);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!started) {
          done(new Error('Process did not start within timeout'));
        }
      }, 10000);
    });
  });
});