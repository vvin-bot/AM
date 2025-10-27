import { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/api'

// 自定义 Hook 用于 API 调用
export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const {
    immediate = true,
    method = 'GET',
    params = {},
    body = null,
  } = options

  const execute = useCallback(async (customParams = {}, customBody = null) => {
    setLoading(true)
    setError(null)

    try {
      let response
      const finalParams = { ...params, ...customParams }
      const finalBody = customBody || body

      switch (method.toUpperCase()) {
        case 'GET':
          response = await apiService.read(endpoint, finalParams)
          break
        case 'POST':
          response = await apiService.create(endpoint, finalBody)
          break
        case 'PUT':
          response = await apiService.update(endpoint, finalBody)
          break
        case 'DELETE':
          response = await apiService.delete(endpoint)
          break
        default:
          throw new Error(`不支持的 HTTP 方法: ${method}`)
      }

      setData(response)
      return response
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [endpoint, method, params, body])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    data,
    loading,
    error,
    execute,
    refetch: () => execute(),
  }
}

// 用于表单提交的 Hook
export const useApiMutation = (endpoint, method = 'POST') => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const mutate = useCallback(async (body, customEndpoint = null) => {
    setLoading(true)
    setError(null)

    try {
      let response
      const targetEndpoint = customEndpoint || endpoint

      switch (method.toUpperCase()) {
        case 'POST':
          response = await apiService.create(targetEndpoint, body)
          break
        case 'PUT':
          response = await apiService.update(targetEndpoint, body)
          break
        case 'DELETE':
          response = await apiService.delete(targetEndpoint)
          break
        default:
          throw new Error(`不支持的 HTTP 方法: ${method}`)
      }

      setData(response)
      return response
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [endpoint, method])

  return {
    mutate,
    loading,
    error,
    data,
  }
}

// 用于分页数据的 Hook
export const usePaginatedApi = (endpoint, initialParams = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.read(endpoint, {
        ...initialParams,
        ...params,
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
      })

      setData(response.data || response)
      
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [endpoint, initialParams, pagination.page, pagination.limit])

  const loadPage = useCallback((page) => {
    fetchData({ page })
  }, [fetchData])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    pagination,
    loadPage,
    refresh,
  }
}
