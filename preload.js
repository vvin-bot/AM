const { contextBridge, ipcRenderer } = require('electron')

/**
 * 将FormData转换为普通对象（用于IPC传输）
 * @param {FormData} formData 
 * @returns {Object}
 */
const formDataToObject = async (formData) => {
  const obj = {}
  const entries = []
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // 处理文件：读取为ArrayBuffer
      const arrayBuffer = await value.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      entries.push({
        key,
        value: {
          type: 'file',
          name: value.name,
          buffer: Array.from(buffer),
          mimeType: value.type,
        }
      })
    } else {
      // 普通字段
      entries.push({
        key,
        value: {
          type: 'field',
          value: value,
        }
      })
    }
  }
  
  return { entries }
}

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 通过主进程发送HTTP请求
   * @param {Object} options - 请求选项
   * @param {string} options.method - HTTP方法 (GET, POST, PUT, DELETE等)
   * @param {string} options.url - 请求URL
   * @param {Object} options.data - 请求数据 (POST/PUT时使用)
   * @param {Object} options.headers - 请求头
   * @param {Object} options.params - URL参数
   * @returns {Promise<any>} 返回响应数据
   */
  request: async (options) => {
    // 如果data是FormData，需要转换
    if (options.data && typeof FormData !== 'undefined' && options.data instanceof FormData) {
      options.data = await formDataToObject(options.data)
      options.isFormData = true
    }
    
    return await ipcRenderer.invoke('http-request', options)
  },

  /**
   * 获取存储的token
   */
  getToken: () => {
    return localStorage.getItem('token')
  },

  /**
   * 设置token
   */
  setToken: (token) => {
    localStorage.setItem('token', token)
  },

  /**
   * 移除token
   */
  removeToken: () => {
    localStorage.removeItem('token')
  }
})

