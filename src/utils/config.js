// API 配置文件
// 统一管理后端服务地址

// 从环境变量获取后端地址，如果没有则使用默认值
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// 导出各个服务的完整 URL
export const API_ENDPOINTS = {
  // 基础 URL
  base: API_BASE_URL,
  
  // API 路径
  api: `${API_BASE_URL}`,
  
  // 应变相关 API
  strain: `${API_BASE_URL}/strain`,
  
  // 模型相关 API
  model: `${API_BASE_URL}/model`
}

// 导出默认配置
export default {
  API_BASE_URL,
  API_ENDPOINTS
}

