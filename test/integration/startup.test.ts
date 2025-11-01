import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const testDir = path.dirname(__filename);

describe('Server Startup Integration Tests', () => {
  let serverProcess: ChildProcess;

  afterAll(async () => {
    // 确保所有测试结束后服务器进程都被清理
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      // 等待进程真正退出
      await new Promise<void>((resolve) => {
        serverProcess.on('exit', () => resolve());
        setTimeout(resolve, 2000); // 超时保护
      });
    }
  });

  test('server should start and handle MCP initialization correctly', (done) => {
    let output = '';
    let hasStarted = false;
    let startupTimeout: NodeJS.Timeout;

    // 启动服务器进程
    serverProcess = spawn('node', [path.join(testDir, '../../dist/index.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(testDir, '../..')
    });

    // 设置超时保护
    startupTimeout = setTimeout(() => {
      if (!hasStarted) {
        serverProcess.kill('SIGTERM');
        done(new Error('Server failed to start within 10 seconds'));
      }
    }, 10000);

    // 监听 stdout 输出
    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
      console.log('Server stdout:', data.toString().trim());

      // 检查是否收到初始化响应（表示服务器正常启动并处理MCP协议）
      if (!hasStarted && output.includes('"result"') && output.includes('"protocolVersion"')) {
        hasStarted = true;
        clearTimeout(startupTimeout);
        console.log('✅ Server successfully started and responded to MCP initialization');
        done();
      }
    });

    // 监听 stderr 输出
    serverProcess.stderr?.on('data', (data) => {
      console.log('Server stderr:', data.toString().trim());
    });

    // 监听进程错误
    serverProcess.on('error', (error) => {
      clearTimeout(startupTimeout);
      console.error('Server process error:', error);
      done(error);
    });

    // 发送初始化消息
    setTimeout(() => {
      const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      serverProcess.stdin?.write(JSON.stringify(initMessage) + '\n');
    }, 100);
  }, 15000); // 增加测试超时时间到 15 秒
});