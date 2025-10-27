const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')

// 保持对窗口对象的全局引用，避免被垃圾回收
let mainWindow

// 创建axios实例用于主进程的HTTP请求
const httpClient = axios.create({
  timeout: 10000,
})

/**
 * 将序列化的FormData对象重建为FormData实例
 * @param {Object} serializedFormData 
 * @returns {FormData}
 */
const rebuildFormData = (serializedFormData) => {
  const formData = new FormData()
  
  if (serializedFormData && serializedFormData.entries) {
    for (const entry of serializedFormData.entries) {
      const { key, value } = entry
      
      if (value.type === 'file') {
        // 重建文件
        const buffer = Buffer.from(value.buffer)
        formData.append(key, buffer, {
          filename: value.name,
          contentType: value.mimeType,
        })
      } else if (value.type === 'field') {
        // 添加普通字段
        formData.append(key, value.value)
      }
    }
  }
  
  return formData
}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,  // 更安全：禁用node集成
      contextIsolation: true,   // 更安全：启用上下文隔离
      preload: path.join(__dirname, 'preload.js')  // 加载预加载脚本
    }
  })  // 设置 Content Security Policy（解决安全警告）
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https: http:; " +
          "connect-src 'self' http://localhost:* ws://localhost:* https:;"
        ]
      }
    })
  })

  // 加载应用的 index.html
  const isDev = !app.isPackaged
  
  if (isDev) {
    // 开发环境
    mainWindow.loadFile('dist/index.html')
    // 打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
  }

  // 当窗口被关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow)

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC处理器：处理来自渲染进程的HTTP请求
ipcMain.handle('http-request', async (event, options) => {
  try {
    const { method, url, data, headers, params, isFormData } = options
    
    // 打印请求信息
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📤 主进程收到HTTP请求:')
    console.log('  方法:', method || 'GET')
    console.log('  URL:', url)
    console.log('  请求头:', JSON.stringify(headers, null, 2))
    console.log('  请求数据:', JSON.stringify(data, null, 2))
    
    // 构建完整的请求配置
    const config = {
      method: method || 'GET',
      url: url,
      headers: headers || {},
      timeout: 10000,
    }

    // 添加请求数据（POST、PUT等）
    if (data) {
      // 如果是FormData，需要重建
      if (isFormData) {
        const formData = rebuildFormData(data)
        config.data = formData
        // 合并FormData的headers（包含boundary）
        config.headers = {
          ...config.headers,
          ...formData.getHeaders(),
        }
      } else {
        config.data = data
      }
    }

    // 添加URL参数
    if (params) {
      config.params = params
    }

    // 发送HTTP请求
    const response = await httpClient(config)
    
    console.log('✅ 请求成功:', response.status, response.statusText)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // 返回响应数据
    return {
      success: true,
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  } catch (error) {
    // 处理错误
    console.log('❌ 主进程HTTP请求错误:', error.message)
    
    if (error.response) {
      // 服务器返回了错误状态码
      console.log('  状态码:', error.response.status)
      console.log('  响应数据:', JSON.stringify(error.response.data, null, 2))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return {
        success: false,
        error: {
          message: error.message,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        }
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.log('  类型: 网络错误')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return {
        success: false,
        error: {
          message: '网络错误，请检查网络连接',
          type: 'network_error',
        }
      }
    } else {
      // 请求配置错误
      console.log('  类型: 配置错误')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return {
        success: false,
        error: {
          message: error.message,
          type: 'request_error',
        }
      }
    }
  }
})

// 在这个文件中，你可以包含应用程序的其余特定主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。
