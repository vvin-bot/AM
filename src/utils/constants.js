// API 相关常量
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
  },
  
  // 用户管理
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    GET_BY_ID: (id) => `/users/${id}`,
  },
  
  // 其他业务端点可以在这里添加
  // PRODUCTS: {
  //   LIST: '/products',
  //   CREATE: '/products',
  //   UPDATE: (id) => `/products/${id}`,
  //   DELETE: (id) => `/products/${id}`,
  //   GET_BY_ID: (id) => `/products/${id}`,
  // },
}

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
}

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
}

// 分页默认配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
}

// 表单验证规则
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNAUTHORIZED: '未授权访问，请重新登录',
  FORBIDDEN: '权限不足，无法执行此操作',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '输入数据格式不正确',
  UNKNOWN_ERROR: '未知错误，请联系管理员',
}

// 成功消息
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
  REGISTER_SUCCESS: '注册成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  CREATE_SUCCESS: '创建成功',
}

// 应用配置
export const APP_CONFIG = {
  NAME: '我的应用',
  VERSION: '1.0.0',
  DESCRIPTION: 'React + Tailwind CSS 纯前端项目',
  AUTHOR: '开发者',
  REPOSITORY: 'https://github.com/username/repo',
}
