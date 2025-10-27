import { API_ENDPOINTS } from '../utils/config'

// 检查是否在Electron环境中
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI
}

/**
 * 通过Electron主进程发送HTTP请求（解决CORS问题）
 * @param {Object} config - 请求配置
 * @returns {Promise} 返回响应数据
 */
const request = async (config) => {
  if (!isElectron()) {
    throw new Error('当前不在Electron环境中，无法使用主进程代理')
  }

  const { method, url, data, headers = {}, params } = config

  // 构建完整URL
  let fullUrl = url
  if (!url.startsWith('http')) {
    fullUrl = `${API_ENDPOINTS.base}${url}`
  }

  // 从localStorage获取token并添加到请求头
  const token = localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // 通过IPC发送请求到主进程
  const response = await window.electronAPI.request({
    method: method || 'GET',
    url: fullUrl,
    data,
    headers,
    params,
  })

  // 处理响应
  if (response.success) {
    return response.data
  } else {
    // 处理错误
    const error = response.error
    
    if (error.status) {
      // 服务器返回了错误状态码
      switch (error.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('权限不足:', error.data?.message)
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error('请求失败:', error.data?.message || '未知错误')
      }
      
      // 抛出错误信息
      const err = new Error(error.data?.message || error.message || '请求失败')
      err.response = {
        status: error.status,
        statusText: error.statusText,
        data: error.data,
      }
      throw err
    } else if (error.type === 'network_error') {
      // 网络错误
      console.error('网络错误，请检查网络连接')
      throw new Error('网络错误，请检查网络连接')
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message)
      throw new Error(error.message || '请求配置错误')
    }
  }
}

// API 方法
export const apiService = {
  // 用户相关
  auth: {
    login: (credentials) => request({
      method: 'POST',
      url: '/user/login',
      data: credentials,
    }),
    register: (userData) => request({
      method: 'POST',
      url: '/user/register',
      data: userData,
    }),
    logout: () => request({
      method: 'POST',
      url: '/auth/logout',
    }),
    getProfile: () => request({
      method: 'GET',
      url: '/auth/profile',
    }),
    updateProfile: (userData) => request({
      method: 'PUT',
      url: '/auth/profile',
      data: userData,
    }),
  },

  // 用户管理
  users: {
    getAll: (params) => request({
      method: 'GET',
      url: '/users',
      params,
    }),
    getById: (id) => request({
      method: 'GET',
      url: `/users/${id}`,
    }),
    create: (userData) => request({
      method: 'POST',
      url: '/users',
      data: userData,
    }),
    update: (id, userData) => request({
      method: 'PUT',
      url: `/users/${id}`,
      data: userData,
    }),
    delete: (id) => request({
      method: 'DELETE',
      url: `/users/${id}`,
    }),
  },

  // 应变相关API
  strain: {
    getStressStrain: (itemId) => request({
      method: 'GET',
      url: `/strain/stress?itemId=${itemId}`,
    }),
    uploadCsv: (itemId, formData) => {
      // FormData需要特殊处理
      // 在Electron环境中，我们需要将FormData转换为普通对象
      return request({
        method: 'POST',
        url: `/strain/stress/upload-csv?itemId=${itemId}`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    // 批量上传CSV文件
    batchUploadCsv: (modelId, temperature, formData) => {
      return request({
        method: 'POST',
        url: `/strain/stress/upload/batch-csv?modelId=${modelId}&temperature=${temperature}`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    // 查询批量上传任务状态
    getBatchUploadStatus: (taskId) => request({
      method: 'GET',
      url: `/strain/stress/upload/batch-csv/status/${taskId}`,
    }),
  },

  // 模型相关API
  model: {
    getStructureImage: (itemId) => request({
      method: 'GET',
      url: `/model/structure/image?itemId=${itemId}`,
    }),
  },

  // 通用CRUD操作
  create: (endpoint, data) => request({
    method: 'POST',
    url: endpoint,
    data,
  }),
  read: (endpoint, params) => request({
    method: 'GET',
    url: endpoint,
    params,
  }),
  update: (endpoint, data) => request({
    method: 'PUT',
    url: endpoint,
    data,
  }),
  delete: (endpoint) => request({
    method: 'DELETE',
    url: endpoint,
  }),
}

// 导出request方法供直接使用
export default request
