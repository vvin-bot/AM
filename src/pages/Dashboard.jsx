import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StrainChart from '../components/StrainChart'
import ImageFetcher from '../components/ImageFetcher'
import { API_ENDPOINTS } from '../utils/config'
import { apiService } from '../services/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState('dashboard')
  
  // 获取认证头
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    const tokenType = localStorage.getItem('tokenType') || 'Bearer'
    return {
      'Content-Type': 'application/json',
      'Authorization': `${tokenType} ${token}`
    }
  }

  // 获取认证头（用于GET请求，包含accept头）
  const getAuthHeadersForGet = () => {
    const token = localStorage.getItem('token')
    const tokenType = localStorage.getItem('tokenType') || 'Bearer'
    return {
      'accept': '*/*',
      'Authorization': `${tokenType} ${token}`
    }
  }

  // 获取认证头（用于文件上传，不包含Content-Type）
  const getAuthHeadersForUpload = () => {
    const token = localStorage.getItem('token')
    const tokenType = localStorage.getItem('tokenType') || 'Bearer'
    return {
      'Authorization': `${tokenType} ${token}`
    }
  }
  const [isSummaryActive, setIsSummaryActive] = useState(true)
  const [selectedModel, setSelectedModel] = useState(null)
  const [modelList, setModelList] = useState([])
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState({
    totalSamples: null,
    totalModels: null,
    totalDataPoints: null
  })
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [modelData, setModelData] = useState({
    attributeDataPoints: null,
    performanceDataPoints: null,
    samples: [],
    sampleRecordCount: null
  })
  const [modelDataLoading, setModelDataLoading] = useState(false)
  const [fieldList, setFieldList] = useState([])
  const [fieldAttributionIdList, setFieldAttributionIdList] = useState([])
  const [fieldListLoading, setFieldListLoading] = useState(false)
  const [sampleData, setSampleData] = useState({
    totalPages: 0,
    pageData: [],
    currentPage: 1,
    pageSize: 10
  })
  const [sampleDataLoading, setSampleDataLoading] = useState(false)
  const [showAddSampleModal, setShowAddSampleModal] = useState(false)
  const [newSampleData, setNewSampleData] = useState({
    sampleNumber: '',
    attributeValues: {}
  })
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterConditions, setFilterConditions] = useState({
    sampleNumber: '',
    attributeRanges: {},
    hasImage: '', // 结构图筛选：'' 表示不筛选，1 表示查看，0 表示上传
    hasCurve: ''  // 应力-应变折线图筛选：'' 表示不筛选，1 表示查看，0 表示上传
  })
  const [isFiltered, setIsFiltered] = useState(false)
  const [editingCell, setEditingCell] = useState(null) // { rowIndex, fieldIndex, value }
  const [editValue, setEditValue] = useState('')
  const [showEditAttributeModal, setShowEditAttributeModal] = useState(false)
  const [editingAttributeNames, setEditingAttributeNames] = useState({})
  const [editableAttributes, setEditableAttributes] = useState([])
  const [editableAttributesLoading, setEditableAttributesLoading] = useState(false)
  const [showStrainChart, setShowStrainChart] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [showStructureImage, setShowStructureImage] = useState(false)
  const [selectedStructureItemId, setSelectedStructureItemId] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingCSV, setIsUploadingCSV] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
  const [batchDeleteData, setBatchDeleteData] = useState({
    startDateTime: '',
    endDateTime: ''
  })
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)
  const [showColumnVisibilityModal, setShowColumnVisibilityModal] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({})
  
  // 批量上传结构图相关状态
  const [showBatchUploadStructureModal, setShowBatchUploadStructureModal] = useState(false)
  const [isUploadingStructure, setIsUploadingStructure] = useState(false)
  const [uploadTaskId, setUploadTaskId] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({
    status: '',
    totalFiles: 0,
    processedFiles: 0,
    successCount: 0,
    failureCount: 0,
    failureDetails: {},
    finalMessage: ''
  })
  const [uploadProgressInterval, setUploadProgressInterval] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState(null)

  // 批量上传CSV相关状态
  const [showBatchUploadCsvModal, setShowBatchUploadCsvModal] = useState(false)
  const [isUploadingCsv, setIsUploadingCsv] = useState(false)
  const [csvUploadTaskId, setCsvUploadTaskId] = useState(null)
  const [csvUploadProgress, setCsvUploadProgress] = useState({
    status: '',
    totalFiles: 0,
    processedFiles: 0,
    successCount: 0,
    failureCount: 0,
    failureDetails: {},
    finalMessage: ''
  })
  const [csvUploadProgressInterval, setCsvUploadProgressInterval] = useState(null)
  const [selectedCsvFiles, setSelectedCsvFiles] = useState(null)
  const [csvTemperature, setCsvTemperature] = useState('')

  // 用户信息状态
  const [userInfo, setUserInfo] = useState({
    phone: '',
    nickname: '',
    loading: true
  })

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      // 这里可以清除本地存储的登录信息
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 跳转到登录页面
      navigate('/')
    }
  }

  const handleSummaryClick = () => {
    setIsSummaryActive(true)
    setSelectedModel(null)
    // 每次点击总览按钮都刷新统计数据，以获取最新数据
    fetchSummaryData()
  }

  const handleModelClick = (model) => {
    setSelectedModel(model)
    setIsSummaryActive(false)
    fetchModelData(model.modelId)
    fetchFieldList(model.modelId)
    fetchSampleData(model.modelId, 1, 10)
  }

  // 获取统计数据
  const fetchSummaryData = async () => {
    setSummaryLoading(true)
    try {
      // 并行获取所有统计数据，使用Promise.allSettled避免单个失败影响整体
      const [samplesResult, modelsResult, attributionResult] = await Promise.allSettled([
        fetch(`${API_ENDPOINTS.api}/material/records/count`, {
          method: 'GET',
          headers: getAuthHeadersForGet()
        }),
        fetch(`${API_ENDPOINTS.api}/material/model/list`, {
          method: 'GET',
          headers: getAuthHeadersForGet()
        }),
        fetch(`${API_ENDPOINTS.api}/material/model/attribution/number?modelId=0`, {
          method: 'GET',
          headers: getAuthHeadersForGet()
        })
      ])

      let totalSamples = null
      let totalModels = null
      let totalDataPoints = null

      // 处理样品总数
      if (samplesResult.status === 'fulfilled' && samplesResult.value.ok) {
        try {
          const samplesData = await samplesResult.value.json()
          if (samplesData.status === 200) {
            totalSamples = samplesData.data
          }
        } catch (error) {
          console.warn('样品总数数据解析失败:', error)
        }
      } else {
        console.warn('样品总数API调用失败:', samplesResult.reason || samplesResult.value?.status)
      }

      // 处理模型总数（最后一个modelId的值）
      if (modelsResult.status === 'fulfilled' && modelsResult.value.ok) {
        try {
          const modelsData = await modelsResult.value.json()
          if (modelsData.status === 200 && modelsData.data && modelsData.data.length > 0) {
            // 获取最后一个modelId作为模型总数
            const lastModel = modelsData.data[modelsData.data.length - 1]
            totalModels = lastModel.modelId
          }
        } catch (error) {
          console.warn('模型列表数据解析失败:', error)
        }
      } else {
        console.warn('模型列表API调用失败:', modelsResult.reason || modelsResult.value?.status)
      }

      // 处理模型属性数据点（inputModelAttributionNumber）
      if (attributionResult.status === 'fulfilled' && attributionResult.value.ok) {
        try {
          const attributionData = await attributionResult.value.json()
          if (attributionData.status === 200 && attributionData.data) {
            totalDataPoints = attributionData.data.inputModelAttributionNumber
          }
        } catch (error) {
          console.warn('模型属性数据解析失败:', error)
        }
      } else {
        console.warn('模型属性数据点API调用失败:', attributionResult.reason || attributionResult.value?.status)
        // API失败时设置为null，不影响其他数据显示
        totalDataPoints = null
      }

      setSummaryData({
        totalSamples: totalSamples,
        totalModels: totalModels,
        totalDataPoints: totalDataPoints
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
      setSummaryData({
        totalSamples: null,
        totalModels: null,
        totalDataPoints: null
      })
    } finally {
      setSummaryLoading(false)
    }
  }

  // 获取模型列表数据
  const fetchModelList = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.api}/material/model/list`, {
        method: 'GET',
        headers: getAuthHeadersForGet()
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          setModelList(result.data || [])
        } else {
          console.error('API返回错误:', result.message)
          setModelList([])
        }
      } else {
        console.error('请求失败:', response.status)
        setModelList([])
      }
    } catch (error) {
      console.error('获取模型列表失败:', error)
      setModelList([])
    } finally {
      setLoading(false)
    }
  }

  // 获取样品数据名称列表
  const fetchFieldList = async (modelId) => {
    setFieldListLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.api}/material/model/attribution/list?modelId=${modelId}`, {
        method: 'GET',
        headers: getAuthHeadersForGet()
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('字段列表API响应:', result)
          if (result.status === 200 && result.data && result.data.fieldList) {
            setFieldList(result.data.fieldList)
            setFieldAttributionIdList(result.data.fieldAttributionIdList || [])
            console.log('字段列表加载成功:', {
              fieldList: result.data.fieldList,
              fieldAttributionIdList: result.data.fieldAttributionIdList
            })
          } else {
            console.error('API返回错误:', result.message)
            setFieldList([])
            setFieldAttributionIdList([])
          }
      } else {
        console.error('请求失败:', response.status)
        setFieldList([])
        setFieldAttributionIdList([])
      }
    } catch (error) {
      console.error('获取样品数据名称失败:', error)
      setFieldList([])
      setFieldAttributionIdList([])
    } finally {
      setFieldListLoading(false)
    }
  }

  // 将valueList转换为表格行数据
  const convertValueListToRowData = (valueList) => {
    const rowData = {}
    valueList.forEach(item => {
      rowData[`item_${item.itemAttributeId}`] = item.itemValue
    })
    return rowData
  }

  // 处理添加样品记录
  const handleAddSample = () => {
    setShowAddSampleModal(true)
    // 初始化属性值对象，过滤掉样品编号
    const initialValues = {}
    fieldList
      .filter(fieldName => fieldName !== '样品编号')
      .forEach((fieldName, index) => {
      initialValues[fieldName] = ''
    })
    setNewSampleData({
      sampleNumber: '',
      attributeValues: initialValues
    })
  }

  // 处理取消添加样品
  const handleCancelAddSample = () => {
    setShowAddSampleModal(false)
    setNewSampleData({
      sampleNumber: '',
      attributeValues: {}
    })
  }

  // 处理确认添加样品
  const handleConfirmAddSample = async () => {
    if (!selectedModel) {
      alert('请先选择一个模型')
      return
    }

    // 验证样品编号是否填写
    if (!newSampleData.sampleNumber.trim()) {
      alert('请输入样品编号')
      return
    }

    // 验证是否有属性值输入
    const hasAttributeValues = Object.values(newSampleData.attributeValues).some(value => value && value.trim() !== '')
    if (!hasAttributeValues) {
      alert('请至少输入一个属性值')
      return
    }

    try {
      // 构建请求数据
      const strItemAttributionList = []
      const numberItemAttributionList = []

      // 遍历属性值，根据数据类型分别添加到不同的数组中
      Object.keys(newSampleData.attributeValues).forEach((fieldName) => {
        const value = newSampleData.attributeValues[fieldName]
        if (value && value.trim() !== '') {
          // 找到对应的attributionId
          const fieldIndex = fieldList.findIndex(field => field === fieldName)
          const attributionId = fieldAttributionIdList[fieldIndex]
          
          console.log(`处理字段: ${fieldName}, 值: ${value}, 索引: ${fieldIndex}, attributionId: ${attributionId}`)
          
          if (attributionId) {
            // 判断是否为数字类型
            const isNumber = !isNaN(parseFloat(value)) && isFinite(parseFloat(value))
            
            if (isNumber) {
              numberItemAttributionList.push({
                itemAttributionId: attributionId,
                value: parseFloat(value)
              })
              console.log(`添加到数字列表: ${fieldName} = ${parseFloat(value)}`)
            } else {
              strItemAttributionList.push({
                itemAttributionId: attributionId,
                value: value.trim()
              })
              console.log(`添加到字符串列表: ${fieldName} = ${value.trim()}`)
            }
          } else {
            console.warn(`未找到字段 ${fieldName} 对应的 attributionId`)
          }
        }
      })

      // 添加样品编号到字符串属性列表
      const sampleNumberFieldIndex = fieldList.findIndex(field => field === '样品编号')
      if (sampleNumberFieldIndex !== -1) {
        const sampleNumberAttributionId = fieldAttributionIdList[sampleNumberFieldIndex]
        if (sampleNumberAttributionId) {
          strItemAttributionList.push({
            itemAttributionId: sampleNumberAttributionId,
            value: newSampleData.sampleNumber.trim()
          })
        }
      }

      const requestBody = {
        modelId: selectedModel.modelId,
        itemId: null, // 新增记录时itemId为null
        strItemAttributionList: strItemAttributionList,
        numberItemAttributionList: numberItemAttributionList
      }

      console.log('fieldList:', fieldList)
      console.log('fieldAttributionIdList:', fieldAttributionIdList)
      console.log('newSampleData.attributeValues:', newSampleData.attributeValues)
      console.log('添加样品记录请求:', requestBody)

      const response = await fetch(`${API_ENDPOINTS.api}/material/model/record`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          console.log('添加样品记录成功:', result.data)
          alert('样品记录添加成功！')
          
    // 关闭弹窗
    setShowAddSampleModal(false)
          
          // 重置表单数据
          setNewSampleData({
            sampleNumber: '',
            attributeValues: {}
          })
          
    // 重新获取样品数据，跳转到第一页以显示新添加的记录
          if (isFiltered) {
            // 对于筛选状态，先重置到第一页再刷新
            setSampleData(prev => ({ ...prev, currentPage: 1 }))
            await refreshFilteredData()
          } else {
            // 对于普通状态，直接获取第一页数据
            await fetchSampleData(selectedModel.modelId, 1, sampleData.pageSize)
          }
        } else {
          console.error('添加样品记录失败:', result.message)
          alert('添加样品记录失败: ' + result.message)
        }
      } else {
        // 获取详细的错误信息
        let errorMessage = `请求失败 (${response.status})`
        try {
          const errorResult = await response.json()
          console.error('详细错误信息:', errorResult)
          errorMessage += `: ${errorResult.message || errorResult.error || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        console.error('添加样品记录请求失败:', response.status, errorMessage)
        alert('添加样品记录请求失败: ' + errorMessage)
      }
    } catch (error) {
      console.error('添加样品记录失败:', error)
      alert('添加样品记录失败: ' + error.message)
    }
  }

  // 处理属性值输入变化
  const handleAttributeValueChange = (fieldName, value) => {
    setNewSampleData(prev => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [fieldName]: value
      }
    }))
  }

  // 处理设置筛选
  const handleSetFilter = () => {
    setShowFilterModal(true)
    // 初始化筛选条件
    const initialRanges = {}
    fieldList
      .filter(fieldName => fieldName !== '模型名称' && fieldName !== '样品编号')
      .forEach((fieldName) => {
        initialRanges[fieldName] = { min: '', max: '' }
      })
    setFilterConditions({
      sampleNumber: '',
      attributeRanges: initialRanges,
      hasImage: '',
      hasCurve: ''
    })
  }

  // 处理取消筛选
  const handleCancelFilter = () => {
    setShowFilterModal(false)
    setFilterConditions({
      sampleNumber: '',
      attributeRanges: {},
      hasImage: '',
      hasCurve: ''
    })
  }

  // 处理确认筛选
  const handleConfirmFilter = async () => {
    if (!selectedModel) return
    
    // 验证字段列表是否已加载
    if (fieldListLoading) {
      console.error('字段列表正在加载中，请稍后重试')
      alert('字段列表正在加载中，请稍后重试')
      return
    }
    
    if (fieldList.length === 0 || fieldAttributionIdList.length === 0) {
      console.error('字段列表或属性ID列表未加载，无法进行筛选')
      alert('字段列表未加载，请稍后重试')
      return
    }
    
    setSampleDataLoading(true)
    try {
      // 构建筛选条件
      const numberItemAttributionList = []
      
      // 处理属性范围筛选
      Object.keys(filterConditions.attributeRanges).forEach((fieldName) => {
        // 过滤掉不能筛选的字段
        if (fieldName === '模型名称' || fieldName === '样品编号') {
          return
        }
        
        const range = filterConditions.attributeRanges[fieldName]
        // 找到对应的attributionId
        const fieldIndex = fieldList.findIndex(field => field === fieldName)
        const attributionId = fieldAttributionIdList[fieldIndex]
        
        if (range.min !== '' || range.max !== '') {
          const values = []
          if (range.min !== '') values.push(parseFloat(range.min))
          if (range.max !== '') values.push(parseFloat(range.max))
          
          if (values.length > 0) {
            numberItemAttributionList.push({
              itemAttributionId: attributionId,
              value: values
            })
          }
        }
      })
      
      const requestBody = {
        modelId: selectedModel.modelId,
        pageNumber: 1,
        pageSize: sampleData.pageSize,
        numberItemAttributionList: numberItemAttributionList,
        strItemAttributionList: []
      }
      
      // 添加 hasImage 和 hasCurve 筛选条件
      if (filterConditions.hasImage !== '') {
        requestBody.hasImage = parseInt(filterConditions.hasImage)
      }
      if (filterConditions.hasCurve !== '') {
        requestBody.hasCurve = parseInt(filterConditions.hasCurve)
      }
      
      // 如果有样品编号筛选，添加到strItemAttributionList
      if (filterConditions.sampleNumber.trim() !== '') {
        // 假设样品编号对应的attributionId是第二个（索引1）
        const sampleNumberAttributionId = fieldAttributionIdList[1] // 根据实际情况调整
        if (sampleNumberAttributionId !== undefined) {
          requestBody.strItemAttributionList.push({
            itemAttributionId: sampleNumberAttributionId,
            value: filterConditions.sampleNumber.trim()
          })
          console.log('添加样品编号筛选条件:', {
            itemAttributionId: sampleNumberAttributionId,
            value: filterConditions.sampleNumber.trim()
          })
        } else {
          console.warn('样品编号的 attributionId 未找到')
        }
      }
      
      // 验证请求体
      console.log('最终请求体:', requestBody)
      console.log('字段列表:', fieldList)
      console.log('属性ID列表:', fieldAttributionIdList)
      
      console.log('筛选请求:', requestBody)
      
      const response = await fetch(`${API_ENDPOINTS.api}/material/model/value`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('筛选API响应:', result)
        if (result.status === 200 && result.data) {
          setSampleData({
            totalPages: result.data.totalPages,
            pageData: result.data.pageData,
            currentPage: 1,
            pageSize: sampleData.pageSize
          })
          setIsFiltered(true)
          console.log('筛选结果:', result.data)
        } else {
          console.error('筛选API返回错误:', result.message || result)
          console.error('完整响应:', result)
          // 筛选失败时直接显示空表格，不显示错误信息
          setSampleData({
            totalPages: 0,
            pageData: [],
            currentPage: 1,
            pageSize: sampleData.pageSize
          })
          setIsFiltered(true)
        }
      } else {
        const errorText = await response.text()
        console.error('筛选请求失败:', response.status, response.statusText)
        console.error('错误响应内容:', errorText)
        // 筛选请求失败时直接显示空表格，不显示错误信息
        setSampleData({
          totalPages: 0,
          pageData: [],
          currentPage: 1,
          pageSize: sampleData.pageSize
        })
        setIsFiltered(true)
      }
    } catch (error) {
      console.error('筛选失败:', error)
      // 网络错误时也直接显示空表格，不显示错误信息
      setSampleData({
        totalPages: 0,
        pageData: [],
        currentPage: 1,
        pageSize: sampleData.pageSize
      })
      setIsFiltered(true)
    } finally {
      setSampleDataLoading(false)
      setShowFilterModal(false)
    }
  }

  // 处理属性范围输入变化
  const handleAttributeRangeChange = (fieldName, type, value) => {
    setFilterConditions(prev => ({
      ...prev,
      attributeRanges: {
        ...prev.attributeRanges,
        [fieldName]: {
          ...prev.attributeRanges[fieldName],
          [type]: value
        }
      }
    }))
  }

  // 处理单元格双击开始编辑
  const handleCellDoubleClick = (rowIndex, fieldIndex, currentValue) => {
    setEditingCell({ rowIndex, fieldIndex, value: currentValue })
    setEditValue(currentValue)
  }

  // 处理编辑值变化
  const handleEditValueChange = (value) => {
    setEditValue(value)
  }

  // 处理保存编辑
  const handleSaveEdit = async () => {
    if (!selectedModel || !editingCell) return

    const { rowIndex, fieldIndex } = editingCell
    const pageItem = sampleData.pageData[rowIndex]
    const itemId = pageItem.valueList[0]?.itemId
    const fieldName = fieldList[fieldIndex]
    const attributionId = fieldAttributionIdList[fieldIndex]

    if (!itemId || !attributionId) {
      console.error('缺少必要的ID信息')
      return
    }

    try {
      // 判断数据类型
      const isNumber = !isNaN(parseFloat(editValue)) && isFinite(editValue)
      
      const requestBody = {
        modelId: selectedModel.modelId,
        itemId: itemId,
        strItemAttributionList: [],
        numberItemAttributionList: []
      }

      if (isNumber) {
        // 数字类型
        requestBody.numberItemAttributionList.push({
          itemAttributionId: attributionId,
          value: parseFloat(editValue)
        })
      } else {
        // 字符串类型
        requestBody.strItemAttributionList.push({
          itemAttributionId: attributionId,
          value: editValue
        })
      }

      console.log('更新请求:', requestBody)

      const response = await fetch(`${API_ENDPOINTS.api}/material/model/record`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          console.log('更新成功:', result.data)
          // 更新成功后重新获取数据
          if (isFiltered) {
            await refreshFilteredData()
          } else {
            await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
          }
        } else {
          console.error('更新失败:', result.message)
          alert('更新失败: ' + result.message)
        }
      } else {
        console.error('更新请求失败:', response.status)
        alert('更新请求失败')
      }
    } catch (error) {
      console.error('更新数据失败:', error)
      alert('更新数据失败')
    } finally {
      // 清除编辑状态
      setEditingCell(null)
      setEditValue('')
    }
  }

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // 获取可编辑的属性列表
  const fetchEditableAttributes = async (modelId) => {
    setEditableAttributesLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.api}/model/indicator?modelId=${modelId}`, {
        method: 'GET',
        headers: getAuthHeadersForGet()
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status === 200 && result.data) {
          setEditableAttributes(result.data)
          console.log('可编辑属性列表:', result.data)
          
          // 立即初始化编辑状态（输入框为空）
          const initialNames = {}
          result.data.forEach((attribute) => {
            initialNames[attribute.itemAttributionName] = ''
          })
          setEditingAttributeNames(initialNames)
        } else {
          console.error('获取可编辑属性列表失败:', result.message)
          setEditableAttributes([])
        }
      } else {
        console.error('获取可编辑属性列表请求失败:', response.status)
        setEditableAttributes([])
      }
    } catch (error) {
      console.error('获取可编辑属性列表失败:', error)
      setEditableAttributes([])
    } finally {
      setEditableAttributesLoading(false)
    }
  }

  // 处理修改模型属性名称
  const handleEditAttributeNames = async () => {
    if (!selectedModel) {
      alert('请先选择一个模型')
      return
    }
    
    setShowEditAttributeModal(true)
    
    // 获取可编辑的属性列表（会自动初始化编辑状态）
    await fetchEditableAttributes(selectedModel.modelId)
  }

  // 当可编辑属性列表更新时，初始化编辑状态（输入框为空）
  React.useEffect(() => {
    if (editableAttributes.length > 0 && showEditAttributeModal) {
      const initialNames = {}
      editableAttributes.forEach((attribute) => {
        initialNames[attribute.itemAttributionName] = ''
      })
      setEditingAttributeNames(initialNames)
    }
  }, [editableAttributes, showEditAttributeModal])

  // 处理取消修改属性名称
  const handleCancelEditAttributeNames = () => {
    setShowEditAttributeModal(false)
    setEditingAttributeNames({})
  }

  // 处理属性名称输入变化
  const handleAttributeNameChange = (oldName, newName) => {
    setEditingAttributeNames(prev => ({
      ...prev,
      [oldName]: newName
    }))
  }

  // 处理确认修改属性名称
  const handleConfirmEditAttributeNames = async () => {
    if (!selectedModel) return

    try {
      // 检查是否有属性名称被修改
      const hasChanges = Object.keys(editingAttributeNames).some(oldName => {
        const newName = editingAttributeNames[oldName]
        return newName && newName.trim() !== ''
      })

      if (!hasChanges) {
        alert('请至少输入一个属性名称')
        return
      }

      // 构建需要修改的属性列表
      const attributeUpdates = []
      Object.keys(editingAttributeNames).forEach(oldName => {
        const newName = editingAttributeNames[oldName]
        if (newName && newName.trim() !== '') {
          // 找到对应的itemAttributionId
          const attribute = editableAttributes.find(attr => attr.itemAttributionName === oldName)
          if (attribute) {
            attributeUpdates.push({
              itemAttributionId: attribute.itemAttributionId,
              oldName: oldName,
              newName: newName.trim()
            })
          }
        }
      })

      if (attributeUpdates.length === 0) {
        alert('请至少输入一个属性名称')
        return
      }

      // 逐个调用API修改属性名称
      let successCount = 0
      let errorCount = 0
      const errors = []

      for (const update of attributeUpdates) {
        try {
          const requestBody = {
            modelId: selectedModel.modelId,
            modelIndicatorIndex: update.itemAttributionId,
            modelIndicatorChineseName: update.newName
          }

          console.log('修改属性名称请求:', requestBody)

          const response = await fetch(`${API_ENDPOINTS.api}/model/indicator`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
          })

          if (response.ok) {
            const result = await response.json()
            if (result.status === 200) {
              successCount++
              console.log(`属性 "${update.oldName}" 修改成功:`, result.data)
            } else {
              errorCount++
              errors.push(`${update.oldName}: ${result.message}`)
              console.error(`属性 "${update.oldName}" 修改失败:`, result.message)
            }
          } else {
            errorCount++
            let errorMessage = `请求失败 (${response.status})`
            try {
              const errorResult = await response.json()
              errorMessage += `: ${errorResult.message || errorResult.error || '未知错误'}`
            } catch (e) {
              console.error('无法解析错误响应:', e)
            }
            errors.push(`${update.oldName}: ${errorMessage}`)
            console.error(`属性 "${update.oldName}" 修改请求失败:`, response.status, errorMessage)
          }
        } catch (error) {
          errorCount++
          errors.push(`${update.oldName}: ${error.message}`)
          console.error(`属性 "${update.oldName}" 修改失败:`, error)
        }
      }

      // 显示结果
      if (successCount > 0 && errorCount === 0) {
        alert(`属性名称修改成功！共修改了 ${successCount} 个属性。`)
      } else if (successCount > 0 && errorCount > 0) {
        alert(`部分属性修改成功！成功: ${successCount} 个，失败: ${errorCount} 个。\n失败详情:\n${errors.join('\n')}`)
      } else {
        alert(`属性名称修改失败！\n失败详情:\n${errors.join('\n')}`)
        return
      }
      
      // 关闭弹窗
      setShowEditAttributeModal(false)
      setEditingAttributeNames({})
      
      // 重新获取字段列表以更新显示
      await fetchFieldList(selectedModel.modelId)
      
      // 重新获取样品数据以更新表格显示
      await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
      
    } catch (error) {
      console.error('修改属性名称失败:', error)
      alert('修改属性名称失败: ' + error.message)
    }
  }

  // 处理重置筛选
  const handleResetFilter = async () => {
    if (!selectedModel) return
    
    setIsFiltered(false)
    setFilterConditions({
      sampleNumber: '',
      attributeRanges: {},
      hasImage: '',
      hasCurve: ''
    })
    
    // 重新获取所有数据
    await fetchSampleData(selectedModel.modelId, 1, sampleData.pageSize)
  }

  // 处理查看图表按钮点击
  const handleViewChart = (itemId) => {
    setSelectedItemId(itemId)
    setShowStrainChart(true)
  }

  // 处理关闭图表弹窗
  const handleCloseChart = () => {
    setShowStrainChart(false)
    setSelectedItemId(null)
  }


  // 处理删除应力-应变数据
  const handleDeleteStrainData = async (itemId) => {
    if (window.confirm(`确定要删除样品ID ${itemId} 的应力-应变数据吗？此操作不可撤销。`)) {
      try {
        const response = await fetch(`${API_ENDPOINTS.api}/strain/stress?itemId=${itemId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })

        if (response.ok) {
          const result = await response.json()
          if (result.status === 200) {
            alert('应力-应变数据删除成功')
            // 关闭弹窗
            setShowStrainChart(false)
            setSelectedItemId(null)
            // 刷新表格数据
            if (isFiltered) {
              await refreshFilteredData()
            } else {
              await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
            }
          } else {
            alert('删除失败: ' + result.message)
          }
        } else {
          alert(`删除失败: ${response.status}`)
        }
      } catch (error) {
        console.error('删除应力-应变数据失败:', error)
        alert('删除应力-应变数据失败: ' + error.message)
      }
    }
  }

  // 处理查看结构按钮点击
  const handleViewStructure = (itemId) => {
    setSelectedStructureItemId(itemId)
    setShowStructureImage(true)
  }

  // 处理上传文件按钮点击
  const handleUploadFile = (itemId) => {
    const fileInput = document.getElementById('strain-csv-file-input')
    if (fileInput) {
      // 设置当前要上传的itemId
      fileInput.setAttribute('data-item-id', itemId)
      fileInput.click()
    }
  }

  // 处理应力-应变CSV文件上传
  const handleStrainCSVUpload = async (event) => {
    const file = event.target.files[0]
    const itemId = event.target.getAttribute('data-item-id')
    
    if (!file || !itemId) return

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('请选择CSV文件')
      return
    }

    // 检查文件大小 (限制为50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      alert('CSV文件大小不能超过50MB')
      return
    }

    setIsUploadingCSV(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_ENDPOINTS.api}/strain/stress/upload-csv?itemId=${itemId}`, {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          alert('应力-应变数据上传成功！')
          // 重新获取样品数据以更新显示
          if (isFiltered) {
            await refreshFilteredData()
          } else {
            await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
          }
        } else {
          alert('上传失败: ' + result.message)
        }
      } else {
        let errorMessage = `上传失败 (${response.status})`
        try {
          const errorResult = await response.json()
          errorMessage += `: ${errorResult.message || errorResult.error || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('CSV文件上传失败:', error)
      alert('CSV文件上传失败: ' + error.message)
    } finally {
      setIsUploadingCSV(false)
      // 清空文件输入
      event.target.value = ''
      event.target.removeAttribute('data-item-id')
    }
  }

  // 处理上传图片按钮点击
  const handleUploadImage = (itemId) => {
    const fileInput = document.getElementById('image-file-input')
    if (fileInput) {
      // 设置当前要上传的itemId
      fileInput.setAttribute('data-item-id', itemId)
      fileInput.click()
    }
  }

  // 处理图片文件上传
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    const itemId = event.target.getAttribute('data-item-id')
    
    if (!file || !itemId) return

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp']
    if (!allowedTypes.includes(file.type)) {
      alert('请选择图片文件 (支持格式: JPG, PNG, GIF, BMP)')
      return
    }

    // 检查文件大小 (限制为10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('图片文件大小不能超过10MB')
      return
    }

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${API_ENDPOINTS.api}/model/structure/image/upload?itemId=${itemId}`, {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          alert('结构图片上传成功！')
          // 重新获取样品数据以更新显示
          if (isFiltered) {
            await refreshFilteredData()
          } else {
            await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
          }
        } else {
          alert('上传失败: ' + result.message)
        }
      } else {
        let errorMessage = `上传失败 (${response.status})`
        try {
          const errorResult = await response.json()
          errorMessage += `: ${errorResult.message || errorResult.error || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      alert('图片上传失败: ' + error.message)
    } finally {
      setIsUploadingImage(false)
      // 清空文件输入
      event.target.value = ''
      event.target.removeAttribute('data-item-id')
    }
  }

  // 检查是否有应力-应变数据
  const hasStrainData = (pageItem) => {
    if (!pageItem || !pageItem.valueList) return false
    // 查找itemAttributeId为99的数据
    const strainData = pageItem.valueList.find(item => item.itemAttributeId === 99)
    return strainData && strainData.itemValue === 1
  }

  // 检查是否有结构图数据
  const hasStructureData = (pageItem) => {
    if (!pageItem || !pageItem.valueList) return false
    // 查找itemAttributeId为100的数据
    const structureData = pageItem.valueList.find(item => item.itemAttributeId === 100)
    return structureData && structureData.itemValue === 1
  }

  // 处理关闭结构图弹窗
  const handleCloseStructure = () => {
    setShowStructureImage(false)
    setSelectedStructureItemId(null)
  }

  // 处理下载结构图
  const handleDownloadStructureImage = async (itemId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.api}/model/structure/image/download/${itemId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/octet-stream',
          'Authorization': `${localStorage.getItem('tokenType') || 'Bearer'} ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        // 获取文件名，如果没有则使用默认名称
        const contentDisposition = response.headers.get('content-disposition')
        let filename = `structure_image_${itemId}.jpg`
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '')
          }
        }

        // 创建blob并下载
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        alert('结构图下载成功')
      } else if (response.status === 404) {
        console.warn('结构图文件不存在，无法下载')
        alert('该样品的结构图文件不存在，无法下载')
      } else {
        console.warn(`结构图下载失败 (${response.status})`)
        let errorMessage = `下载失败 (${response.status})`
        try {
          const errorResult = await response.text()
          errorMessage += `: ${errorResult || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('下载结构图失败:', error)
      alert('下载结构图失败: ' + error.message)
    }
  }

  // 处理删除结构图
  const handleDeleteStructureImage = async (itemId) => {
    if (window.confirm(`确定要删除样品ID ${itemId} 的结构图吗？此操作不可撤销。`)) {
      try {
        const response = await fetch(`${API_ENDPOINTS.api}/model/structure/image?itemId=${itemId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })

        if (response.ok) {
          const result = await response.json()
          if (result.status === 200) {
            alert('结构图删除成功')
            // 关闭弹窗
            setShowStructureImage(false)
            setSelectedStructureItemId(null)
            // 刷新表格数据
            if (isFiltered) {
              await refreshFilteredData()
            } else {
              await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
            }
          } else {
            alert('删除失败: ' + result.message)
          }
        } else {
          let errorMessage = `删除失败 (${response.status})`
          try {
            const errorResult = await response.json()
            errorMessage += `: ${errorResult.message || errorResult.error || '未知错误'}`
          } catch (e) {
            console.error('无法解析错误响应:', e)
          }
          alert(errorMessage)
        }
      } catch (error) {
        console.error('删除结构图失败:', error)
        alert('删除结构图失败: ' + error.message)
      }
    }
  }

  // 处理CSV文件上传
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('请选择CSV文件')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_ENDPOINTS.api}/material/upload/csv`, {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          alert(`文件上传成功！${result.data}`)
          // 重新获取模型列表
          await fetchModelList()
          // 如果当前在总览页面，也重新获取统计数据
          if (isSummaryActive) {
            await fetchSummaryData()
          }
          // 如果当前在查看某个模型详情，刷新该模型的样品数据
          if (selectedModel && !isSummaryActive) {
            await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
            // 也刷新模型数据
            await fetchModelData(selectedModel.modelId)
          }
          // 关闭添加样品记录弹窗
          setShowAddSampleModal(false)
          // 重置表单数据
          setNewSampleData({
            sampleNumber: '',
            attributeValues: {}
          })
        } else {
          alert('上传失败: ' + result.message)
        }
      } else {
        let errorMessage = `上传失败 (${response.status})`
        try {
          const errorResult = await response.json()
          errorMessage += `: ${errorResult.message || errorResult.error || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      alert('文件上传失败: ' + error.message)
    } finally {
      setIsUploading(false)
      // 清空文件输入
      event.target.value = ''
    }
  }

  // 处理上传按钮点击
  const handleUploadClick = () => {
    const fileInput = document.getElementById('csv-file-input')
    if (fileInput) {
      fileInput.click()
    }
  }

  // 处理导出按钮点击
  const handleExportClick = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.api}/material/download/material/data`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `${localStorage.getItem('tokenType') || 'Bearer'} ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        // 获取文件名，如果没有则使用默认名称
        const contentDisposition = response.headers.get('content-disposition')
        let filename = 'material_data.csv'
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '')
          }
        }

        // 创建blob并下载
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        alert('数据导出成功！')
      } else {
        let errorMessage = `导出失败 (${response.status})`
        try {
          const errorResult = await response.text()
          errorMessage += `: ${errorResult || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('导出数据失败:', error)
      alert('导出数据失败: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  // 处理批量删除按钮点击
  const handleBatchDeleteClick = () => {
    setShowBatchDeleteModal(true)
    // 初始化日期时间为当前时间
    const now = new Date()
    const currentDateTime = now.toISOString().slice(0, 16) // 格式: YYYY-MM-DDTHH:MM
    setBatchDeleteData({
      startDateTime: currentDateTime,
      endDateTime: currentDateTime
    })
  }

  // 处理批量删除弹窗关闭
  const handleCloseBatchDeleteModal = () => {
    setShowBatchDeleteModal(false)
    setBatchDeleteData({
      startDateTime: '',
      endDateTime: ''
    })
  }

  // 处理日期时间输入变化
  const handleDateTimeChange = (field, value) => {
    setBatchDeleteData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 处理确认批量删除
  const handleConfirmBatchDelete = async () => {
    if (!batchDeleteData.startDateTime || !batchDeleteData.endDateTime) {
      alert('请选择开始时间和结束时间')
      return
    }

    if (new Date(batchDeleteData.startDateTime) > new Date(batchDeleteData.endDateTime)) {
      alert('开始时间不能晚于结束时间')
      return
    }

    // 格式化显示时间
    const formatDateTime = (dateTimeStr) => {
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
    }

    if (!window.confirm(`确定要删除 ${formatDateTime(batchDeleteData.startDateTime)} 到 ${formatDateTime(batchDeleteData.endDateTime)} 时间段内的所有数据吗？此操作不可撤销。`)) {
      return
    }

    setIsBatchDeleting(true)
    try {
      const requestBody = {
        startDate: new Date(batchDeleteData.startDateTime).toISOString(),
        endDate: new Date(batchDeleteData.endDateTime).toISOString()
      }

      const response = await fetch(`${API_ENDPOINTS.api}/material/by/date`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          alert('批量删除成功！')
          // 关闭弹窗
          setShowBatchDeleteModal(false)
          setBatchDeleteData({
            startDateTime: '',
            endDateTime: ''
          })
          // 重新获取数据
          await fetchModelList()
          if (isSummaryActive) {
            await fetchSummaryData()
          }
        } else {
          alert('删除失败: ' + result.message)
        }
      } else {
        let errorMessage = `删除失败 (${response.status})`
        try {
          const errorResult = await response.json()
          errorMessage += `: ${errorResult.message || errorResult.error || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      alert('批量删除失败: ' + error.message)
    } finally {
      setIsBatchDeleting(false)
    }
  }

  // 处理批量上传结构图按钮点击
  const handleBatchUploadStructureClick = () => {
    if (!selectedModel) {
      alert('请先选择一个模型')
      return
    }
    setShowBatchUploadStructureModal(true)
    setSelectedFiles(null)
    setUploadTaskId(null)
    setUploadProgress({
      status: '',
      totalFiles: 0,
      processedFiles: 0,
      successCount: 0,
      failureCount: 0,
      failureDetails: {},
      finalMessage: ''
    })
  }

  // 处理批量结构图文件选择
  const handleBatchStructureFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFiles(files)
    }
  }

  // 处理取消批量上传结构图
  const handleCancelBatchUploadStructure = () => {
    setShowBatchUploadStructureModal(false)
    setSelectedFiles(null)
    setIsUploadingStructure(false)
    setUploadTaskId(null)
    setUploadProgress({
      status: '',
      totalFiles: 0,
      processedFiles: 0,
      successCount: 0,
      failureCount: 0,
      failureDetails: {},
      finalMessage: ''
    })
    // 清除定时器
    if (uploadProgressInterval) {
      clearInterval(uploadProgressInterval)
      setUploadProgressInterval(null)
    }
  }

  // 处理确认批量上传结构图
  const handleConfirmBatchUploadStructure = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('请选择要上传的文件')
      return
    }

    setIsUploadingStructure(true)
    
    try {
      // 创建FormData
      const formData = new FormData()
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i])
      }

      // 调用上传API（通过代理）
      const response = await fetch(`${API_ENDPOINTS.api}/model/structure/image/upload/batch?modelId=${selectedModel.modelId}`, {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200 && result.data && result.data.taskId) {
          setUploadTaskId(result.data.taskId)
          // 开始轮询进度
          startProgressPolling(result.data.taskId)
        } else {
          alert('上传失败: ' + (result.message || '未知错误'))
          setIsUploadingStructure(false)
        }
      } else {
        let errorMessage = `上传失败 (${response.status})`
        try {
          const errorResult = await response.json()
          errorMessage += `: ${errorResult.message || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
        setIsUploadingStructure(false)
      }
    } catch (error) {
      console.error('批量上传结构图失败:', error)
      alert('批量上传结构图失败: ' + error.message)
      setIsUploadingStructure(false)
    }
  }

  // 开始进度轮询
  const startProgressPolling = (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.api}/model/structure/image/upload/batch/status/${taskId}`, {
          method: 'GET',
          headers: getAuthHeadersForGet()
        })

        if (response.ok) {
          const result = await response.json()
          if (result.status === 200 && result.data) {
            const data = result.data
            setUploadProgress({
              status: data.status,
              totalFiles: data.totalFiles,
              processedFiles: data.processedFiles,
              successCount: data.successCount,
              failureCount: data.failureCount,
              failureDetails: data.failureDetails || {},
              finalMessage: data.finalMessage || ''
            })

            // 如果任务完成，停止轮询并刷新表格
            if (data.status === 'COMPLETED' || data.status === 'FAILED') {
              clearInterval(interval)
              setUploadProgressInterval(null)
              
              // 任务完成后自动刷新表格数据
              if (selectedModel) {
                if (isFiltered) {
                  await refreshFilteredData()
                } else {
                  await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('获取上传进度失败:', error)
      }
    }, 100) // 每0.1秒轮询一次

    setUploadProgressInterval(interval)
  }

  // 处理关闭批量上传结构图
  const handleCloseBatchUploadStructure = async () => {
    setShowBatchUploadStructureModal(false)
    setSelectedFiles(null)
    setIsUploadingStructure(false)
    setUploadTaskId(null)
    setUploadProgress({
      status: '',
      totalFiles: 0,
      processedFiles: 0,
      successCount: 0,
      failureCount: 0,
      failureDetails: {},
      finalMessage: ''
    })
    // 清除定时器
    if (uploadProgressInterval) {
      clearInterval(uploadProgressInterval)
      setUploadProgressInterval(null)
    }
    
    // 刷新表格数据以显示最新内容
    if (selectedModel) {
      if (isFiltered) {
        await refreshFilteredData()
      } else {
        await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
      }
    }
  }

  // ========== 批量上传CSV相关函数 ==========
  
  // 处理批量上传CSV按钮点击
  const handleBatchUploadCsvClick = () => {
    if (!selectedModel) {
      alert('请先选择一个模型')
      return
    }
    setShowBatchUploadCsvModal(true)
    setSelectedCsvFiles(null)
    setCsvTemperature('')
    setCsvUploadTaskId(null)
    setCsvUploadProgress({
      status: '',
      totalFiles: 0,
      processedFiles: 0,
      successCount: 0,
      failureCount: 0,
      failureDetails: {},
      finalMessage: ''
    })
  }

  // 处理CSV文件选择
  const handleBatchCsvFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // 验证文件类型
      let allValid = true
      for (let i = 0; i < files.length; i++) {
        if (!files[i].name.toLowerCase().endsWith('.csv')) {
          allValid = false
          break
        }
      }
      
      if (!allValid) {
        alert('请只选择CSV文件')
        e.target.value = ''
        return
      }
      
      setSelectedCsvFiles(files)
    }
  }

  // 处理取消批量上传CSV
  const handleCancelBatchUploadCsv = () => {
    setShowBatchUploadCsvModal(false)
    setSelectedCsvFiles(null)
    setCsvTemperature('')
    setIsUploadingCsv(false)
    setCsvUploadTaskId(null)
    setCsvUploadProgress({
      status: '',
      totalFiles: 0,
      processedFiles: 0,
      successCount: 0,
      failureCount: 0,
      failureDetails: {},
      finalMessage: ''
    })
    // 清除定时器
    if (csvUploadProgressInterval) {
      clearInterval(csvUploadProgressInterval)
      setCsvUploadProgressInterval(null)
    }
  }

  // 处理确认批量上传CSV
  const handleConfirmBatchUploadCsv = async () => {
    if (!selectedCsvFiles || selectedCsvFiles.length === 0) {
      alert('请选择要上传的CSV文件')
      return
    }

    if (!csvTemperature || csvTemperature.trim() === '') {
      alert('请输入温度值')
      return
    }

    // 验证温度是否为有效数字
    const tempValue = parseFloat(csvTemperature)
    if (isNaN(tempValue)) {
      alert('请输入有效的温度数值')
      return
    }

    setIsUploadingCsv(true)
    
    try {
      // 创建FormData
      const formData = new FormData()
      for (let i = 0; i < selectedCsvFiles.length; i++) {
        formData.append('files', selectedCsvFiles[i])
      }

      // 调用上传API（通过代理）
      const response = await fetch(
        `${API_ENDPOINTS.api}/strain/stress/upload/batch-csv?modelId=${selectedModel.modelId}&temperature=${tempValue}`,
        {
          method: 'POST',
          headers: getAuthHeadersForUpload(),
          body: formData
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200 && result.data && result.data.taskId) {
          setCsvUploadTaskId(result.data.taskId)
          // 开始轮询进度
          startCsvProgressPolling(result.data.taskId)
        } else {
          alert('上传失败: ' + (result.message || '未知错误'))
          setIsUploadingCsv(false)
        }
      } else {
        let errorMessage = `上传失败 (${response.status})`
        try {
          const errorResult = await response.json()
          errorMessage += `: ${errorResult.message || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
        setIsUploadingCsv(false)
      }
    } catch (error) {
      console.error('批量上传CSV失败:', error)
      alert('批量上传CSV失败: ' + error.message)
      setIsUploadingCsv(false)
    }
  }

  // 开始CSV进度轮询
  const startCsvProgressPolling = (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.api}/strain/stress/upload/batch-csv/status/${taskId}`, {
          method: 'GET',
          headers: getAuthHeadersForGet()
        })

        if (response.ok) {
          const result = await response.json()
          if (result.status === 200 && result.data) {
            const data = result.data
            setCsvUploadProgress({
              status: data.status,
              totalFiles: data.totalFiles,
              processedFiles: data.processedFiles,
              successCount: data.successCount,
              failureCount: data.failureCount,
              failureDetails: data.failureDetails || {},
              finalMessage: data.finalMessage || ''
            })

            // 如果任务完成，停止轮询并刷新表格
            if (data.status === 'COMPLETED' || data.status === 'FAILED') {
              clearInterval(interval)
              setCsvUploadProgressInterval(null)
              
              // 任务完成后自动刷新表格数据
              if (selectedModel) {
                if (isFiltered) {
                  await refreshFilteredData()
                } else {
                  await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('获取CSV上传进度失败:', error)
      }
    }, 100) // 每0.1秒轮询一次

    setCsvUploadProgressInterval(interval)
  }

  // 处理关闭批量上传CSV
  const handleCloseBatchUploadCsv = async () => {
    setShowBatchUploadCsvModal(false)
    setSelectedCsvFiles(null)
    setCsvTemperature('')
    setIsUploadingCsv(false)
    setCsvUploadTaskId(null)
    setCsvUploadProgress({
      status: '',
      totalFiles: 0,
      processedFiles: 0,
      successCount: 0,
      failureCount: 0,
      failureDetails: {},
      finalMessage: ''
    })
    // 清除定时器
    if (csvUploadProgressInterval) {
      clearInterval(csvUploadProgressInterval)
      setCsvUploadProgressInterval(null)
    }
    
    // 刷新表格数据以显示最新内容
    if (selectedModel) {
      if (isFiltered) {
        await refreshFilteredData()
      } else {
        await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
      }
    }
  }

  // 处理显示/隐藏模型属性按钮点击
  const handleToggleColumnVisibility = () => {
    setShowColumnVisibilityModal(true)
    // 每次打开弹窗都重新初始化可见列状态，默认所有列都显示
    const initialVisibility = {}
    // 固定列：应力-应变折线图和结构图
    initialVisibility['应力-应变折线图'] = true
    initialVisibility['结构图'] = true
    // 动态列：从fieldList获取
    fieldList.forEach(fieldName => {
      initialVisibility[fieldName] = true
    })
    setVisibleColumns(initialVisibility)
  }

  // 处理列可见性切换
  const handleColumnVisibilityChange = (columnName, isVisible) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: isVisible
    }))
  }

  // 处理关闭列可见性弹窗
  const handleCloseColumnVisibilityModal = () => {
    setShowColumnVisibilityModal(false)
  }

  // 处理确认列可见性设置
  const handleConfirmColumnVisibility = () => {
    setShowColumnVisibilityModal(false)
  }

  // 处理全选/取消全选
  const handleSelectAll = (isSelected) => {
    const newVisibility = {}
    // 图标列
    newVisibility['应力-应变折线图'] = isSelected
    newVisibility['结构图'] = isSelected
    // 动态列
    fieldList.forEach(fieldName => {
      newVisibility[fieldName] = isSelected
    })
    setVisibleColumns(newVisibility)
  }

  // 检查是否全选
  const isAllSelected = () => {
    const allColumns = ['应力-应变折线图', '结构图', ...fieldList]
    return allColumns.every(column => visibleColumns[column] === true)
  }

  // 处理删除模型
  const handleDeleteModel = async (modelId, modelName) => {
    if (window.confirm(`确定要删除模型"${modelName}"吗？此操作不可撤销。`)) {
      try {
        const response = await fetch(`${API_ENDPOINTS.api}/material?modelId=${modelId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })

        if (response.ok) {
          const result = await response.json()
          if (result.status === 200) {
            alert('模型删除成功')
            // 重新获取模型列表
            fetchModelList()
            // 如果删除的是当前选中的模型，则切换到总览
            if (selectedModel && selectedModel.modelId === modelId) {
              setIsSummaryActive(true)
              setSelectedModel(null)
            }
          } else {
            alert('删除失败: ' + result.message)
          }
        } else {
          alert(`删除失败: ${response.status}`)
        }
      } catch (error) {
        console.error('删除模型失败:', error)
        alert('删除模型失败: ' + error.message)
      }
    }
  }

  // 下载案例CSV文件
  const handleDownloadSampleCSV = () => {
    try {
      // 示例CSV数据内容
      const csvContent = `Unnamed: 0,strain [1],stress [MPa],D
0,0.0,0.0,0.0
1,0.001,12.79871933053066,0.334
2,0.002,25.59743866106136,0.668
3,0.003,38.3961579915921,1.002
4,0.004,51.19487732212269,1.336
5,0.005,63.9935966526533,1.67
6,0.006,76.79231598318418,2.004
7,0.007,89.59094860543311,2.338
8,0.008,102.3890364648336,2.672
9,0.009,115.1845787263007,3.005
10,0.01,127.977253266937,3.339
11,0.011,140.7632223586488,3.673
12,0.012,153.5466094920023,4.006
13,0.013,166.3211085370223,4.34
14,0.014,179.0818201489035,4.673
15,0.015,191.8110462450414,5.005
16,0.016,204.5023571775862,5.336
17,0.017,217.1436386808824,5.666
18,0.018,229.7387280340015,5.994
19,0.019,242.2436516301429,6.321
20,0.02,254.6061027557052,6.643
21,0.021,266.7910676099619,6.961
22,0.022,278.7682165678386,7.274
23,0.023,290.5167310918373,7.58
24,0.024,301.96660657734,7.879
25,0.025,313.1876563604811,8.172
26,0.026,324.1696963275388,8.458
27,0.027,334.8958401068469,8.738
28,0.028,345.345604459145,9.011
29,0.029,355.5082489950193,9.276
30,0.03,365.3876690648795,9.534
`
      
      // 创建Blob对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '2x2x2-1.2-.stp.csv'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
      
      console.log('CSV文件下载成功')
    } catch (error) {
      console.error('下载文件时出错:', error)
      alert('下载文件失败，请稍后重试')
    }
  }

  // 处理删除样品记录
  const handleDeleteRecord = async (itemId) => {
    if (!selectedModel) return
    
    // 确认删除
    if (!window.confirm('确定要删除这条样品记录吗？')) {
      return
    }
    
    try {
      const response = await fetch(`${API_ENDPOINTS.api}/material/model/record?modelId=${selectedModel.modelId}&itemId=${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          console.log('删除成功:', result.data)
          // 删除成功后重新获取数据
          if (isFiltered) {
            // 如果当前是筛选状态，重新应用筛选（保持当前页码）
            await refreshFilteredData()
          } else {
            // 如果当前是普通状态，重新获取所有数据
            await fetchSampleData(selectedModel.modelId, sampleData.currentPage, sampleData.pageSize)
          }
        } else {
          console.error('删除失败:', result.message)
          alert('删除失败: ' + result.message)
        }
      } else {
        console.error('删除请求失败:', response.status)
        alert('删除请求失败')
      }
    } catch (error) {
      console.error('删除样品记录失败:', error)
      alert('删除样品记录失败')
    }
  }

  // 刷新筛选数据（保持当前页码）
  const refreshFilteredData = async () => {
    if (!selectedModel) return
    
    setSampleDataLoading(true)
    try {
      // 构建筛选条件
      const numberItemAttributionList = []
      
      // 处理属性范围筛选
      Object.keys(filterConditions.attributeRanges).forEach((fieldName) => {
        // 过滤掉不能筛选的字段
        if (fieldName === '模型名称' || fieldName === '样品编号') {
          return
        }
        
        const range = filterConditions.attributeRanges[fieldName]
        // 找到对应的attributionId
        const fieldIndex = fieldList.findIndex(field => field === fieldName)
        const attributionId = fieldAttributionIdList[fieldIndex]
        
        if (range.min !== '' || range.max !== '') {
          const values = []
          if (range.min !== '') values.push(parseFloat(range.min))
          if (range.max !== '') values.push(parseFloat(range.max))
          
          if (values.length > 0) {
            numberItemAttributionList.push({
              itemAttributionId: attributionId,
              value: values
            })
          }
        }
      })
      
      const requestBody = {
        modelId: selectedModel.modelId,
        pageNumber: sampleData.currentPage, // 保持当前页码
        pageSize: sampleData.pageSize,
        numberItemAttributionList: numberItemAttributionList,
        strItemAttributionList: []
      }
      
      // 添加 hasImage 和 hasCurve 筛选条件
      if (filterConditions.hasImage !== '') {
        requestBody.hasImage = parseInt(filterConditions.hasImage)
      }
      if (filterConditions.hasCurve !== '') {
        requestBody.hasCurve = parseInt(filterConditions.hasCurve)
      }
      
      // 如果有样品编号筛选，添加到strItemAttributionList
      if (filterConditions.sampleNumber.trim() !== '') {
        const sampleNumberAttributionId = fieldAttributionIdList[1]
        requestBody.strItemAttributionList.push({
          itemAttributionId: sampleNumberAttributionId,
          value: filterConditions.sampleNumber.trim()
        })
      }
      
      const response = await fetch(`${API_ENDPOINTS.api}/material/model/value`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status === 200 && result.data) {
          setSampleData({
            totalPages: result.data.totalPages,
            pageData: result.data.pageData,
            currentPage: sampleData.currentPage, // 保持当前页码
            pageSize: sampleData.pageSize
          })
        } else {
          // 筛选失败时直接显示空表格，不显示错误信息
          console.error('刷新筛选数据API返回错误:', result.message || result)
          setSampleData({
            totalPages: 0,
            pageData: [],
            currentPage: sampleData.currentPage,
            pageSize: sampleData.pageSize
          })
        }
      } else {
        // 请求失败时直接显示空表格，不显示错误信息
        console.error('刷新筛选数据请求失败:', response.status, response.statusText)
        setSampleData({
          totalPages: 0,
          pageData: [],
          currentPage: sampleData.currentPage,
          pageSize: sampleData.pageSize
        })
      }
    } catch (error) {
      console.error('刷新筛选数据失败:', error)
      // 网络错误时也直接显示空表格，不显示错误信息
      setSampleData({
        totalPages: 0,
        pageData: [],
        currentPage: sampleData.currentPage,
        pageSize: sampleData.pageSize
      })
    } finally {
      setSampleDataLoading(false)
    }
  }

  // 处理分页（支持筛选和普通模式）
  const handlePageChange = async (pageNumber, pageSize = sampleData.pageSize) => {
    if (!selectedModel) return
    
    setSampleDataLoading(true)
    try {
      if (isFiltered) {
        // 筛选模式：使用筛选API
        const numberItemAttributionList = []
        
        Object.keys(filterConditions.attributeRanges).forEach((fieldName) => {
          // 过滤掉不能筛选的字段
          if (fieldName === '模型名称' || fieldName === '样品编号') {
            return
          }
          
          const range = filterConditions.attributeRanges[fieldName]
          // 找到对应的attributionId
          const fieldIndex = fieldList.findIndex(field => field === fieldName)
          const attributionId = fieldAttributionIdList[fieldIndex]
          
          if (range.min !== '' || range.max !== '') {
            const values = []
            if (range.min !== '') values.push(parseFloat(range.min))
            if (range.max !== '') values.push(parseFloat(range.max))
            
            if (values.length > 0) {
              numberItemAttributionList.push({
                itemAttributionId: attributionId,
                value: values
              })
            }
          }
        })
        
        const requestBody = {
          modelId: selectedModel.modelId,
          pageNumber: pageNumber,
          pageSize: pageSize,
          numberItemAttributionList: numberItemAttributionList,
          strItemAttributionList: []
        }
        
        // 添加 hasImage 和 hasCurve 筛选条件
        if (filterConditions.hasImage !== '') {
          requestBody.hasImage = parseInt(filterConditions.hasImage)
        }
        if (filterConditions.hasCurve !== '') {
          requestBody.hasCurve = parseInt(filterConditions.hasCurve)
        }
        
        if (filterConditions.sampleNumber.trim() !== '') {
          const sampleNumberAttributionId = fieldAttributionIdList[1]
          requestBody.strItemAttributionList.push({
            itemAttributionId: sampleNumberAttributionId,
            value: filterConditions.sampleNumber.trim()
          })
        }
        
        const response = await fetch(`${API_ENDPOINTS.api}/material/model/value`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(requestBody)
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.status === 200 && result.data) {
            setSampleData({
              totalPages: result.data.totalPages,
              pageData: result.data.pageData,
              currentPage: pageNumber,
              pageSize: pageSize
            })
          }
        }
      } else {
        // 普通模式：使用普通API
        await fetchSampleData(selectedModel.modelId, pageNumber, pageSize)
      }
    } catch (error) {
      console.error('分页失败:', error)
    } finally {
      setSampleDataLoading(false)
    }
  }

  // 生成分页页码数组
  const generatePageNumbers = (currentPage, totalPages) => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数少于等于5页，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 如果总页数大于5页，显示省略号
      if (currentPage <= 3) {
        // 当前页在前3页
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // 当前页在后3页
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  // 获取样品数据
  const fetchSampleData = async (modelId, pageNumber = 1, pageSize = 10) => {
    setSampleDataLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.api}/material/model/value`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          modelId: modelId,
          pageNumber: pageNumber,
          pageSize: pageSize,
          numberItemAttributionList: [],
          strItemAttributionList: []
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status === 200 && result.data) {
          setSampleData({
            totalPages: result.data.totalPages,
            pageData: result.data.pageData,
            currentPage: pageNumber,
            pageSize: pageSize
          })
        } else {
          console.error('API返回错误:', result.message)
          setSampleData({
            totalPages: 0,
            pageData: [],
            currentPage: 1,
            pageSize: 10
          })
        }
      } else {
        console.error('请求失败:', response.status)
        setSampleData({
          totalPages: 0,
          pageData: [],
          currentPage: 1,
          pageSize: 10
        })
      }
    } catch (error) {
      console.error('获取样品数据失败:', error)
      setSampleData({
        totalPages: 0,
        pageData: [],
        currentPage: 1,
        pageSize: 10
      })
    } finally {
      setSampleDataLoading(false)
    }
  }

  // 获取模型数据
  const fetchModelData = async (modelId) => {
    setModelDataLoading(true)
    try {
      // 并行获取模型属性数据点、样品数据和样品记录数量
      const [attributionResult, samplesResult, sampleRecordResult] = await Promise.allSettled([
        fetch(`${API_ENDPOINTS.api}/material/model/attribution/number?modelId=${modelId}`, {
          method: 'GET',
          headers: getAuthHeadersForGet()
        }),
        fetch(`${API_ENDPOINTS.api}/material/records/list?modelId=${modelId}`, {
          method: 'GET',
          headers: getAuthHeadersForGet()
        }),
        fetch(`${API_ENDPOINTS.api}/material/model/value`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            modelId: modelId,
            pageNumber: 1,
            pageSize: 1,
            strItemAttributionList: [],
            numberItemAttributionList: [],
            hasImage: null,
            hasCurve: null
          })
        })
      ])

      let attributeDataPoints = null
      let performanceDataPoints = null
      let samples = []
      let sampleRecordCount = null

      // 处理模型属性数据点
      if (attributionResult.status === 'fulfilled' && attributionResult.value.ok) {
        try {
          const attributionData = await attributionResult.value.json()
          if (attributionData.status === 200 && attributionData.data) {
            attributeDataPoints = attributionData.data.inputModelAttributionNumber
            performanceDataPoints = attributionData.data.outputModelAttributionNumber
          }
        } catch (error) {
          console.warn('模型属性数据解析失败:', error)
        }
      } else {
        console.warn('模型属性数据点API调用失败:', attributionResult.reason || attributionResult.value?.status)
      }

      // 处理样品数据
      if (samplesResult.status === 'fulfilled' && samplesResult.value.ok) {
        try {
          const samplesData = await samplesResult.value.json()
          if (samplesData.status === 200 && samplesData.data) {
            samples = samplesData.data || []
          }
        } catch (error) {
          console.warn('样品数据解析失败:', error)
        }
      } else {
        console.warn('样品数据API调用失败:', samplesResult.reason || samplesResult.value?.status)
      }

      // 处理样品记录数量
      if (sampleRecordResult.status === 'fulfilled' && sampleRecordResult.value.ok) {
        try {
          const sampleRecordData = await sampleRecordResult.value.json()
          if (sampleRecordData.status === 200 && sampleRecordData.data) {
            sampleRecordCount = sampleRecordData.data.totalNumber
          }
        } catch (error) {
          console.warn('样品记录数量解析失败:', error)
        }
      } else {
        console.warn('样品记录数量API调用失败:', sampleRecordResult.reason || sampleRecordResult.value?.status)
      }

      setModelData({
        attributeDataPoints: attributeDataPoints,
        performanceDataPoints: performanceDataPoints,
        samples: samples,
        sampleRecordCount: sampleRecordCount
      })
    } catch (error) {
      console.error('获取模型数据失败:', error)
      setModelData({
        attributeDataPoints: null,
        performanceDataPoints: null,
        samples: [],
        sampleRecordCount: null
      })
    } finally {
      setModelDataLoading(false)
    }
  }

  // 组件挂载时获取数据
  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const result = await apiService.auth.getProfile()
        if (result.status === 200 && result.data) {
          setUserInfo({
            phone: result.data.phoneNumber || '',
            nickname: result.data.nickname || '用户',
            loading: false
          })
        } else {
          // 如果API失败，尝试从localStorage获取
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            setUserInfo({
              phone: userData.phone || '',
              nickname: userData.nickname || '用户',
              loading: false
            })
          } else {
            setUserInfo({
              phone: '',
              nickname: '用户',
              loading: false
            })
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 如果API失败，尝试从localStorage获取
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUserInfo({
            phone: userData.phone || '',
            nickname: userData.nickname || '用户',
            loading: false
          })
        } else {
          setUserInfo({
            phone: '',
            nickname: '用户',
            loading: false
          })
        }
      }
    }

    fetchUserInfo()
  }, [])

  useEffect(() => {
    fetchModelList()
    // 如果总结按钮默认激活，获取统计数据
    if (isSummaryActive) {
      fetchSummaryData()
    }
  }, [])

  // 初始化列可见性状态，默认所有列都显示
  useEffect(() => {
    if (fieldList.length > 0) {
      setVisibleColumns(prev => {
        // 如果是第一次初始化（visibleColumns为空），则全部设为true
        if (Object.keys(prev).length === 0) {
          const initialVisibility = {}
          // 固定列：应力-应变折线图和结构图
          initialVisibility['应力-应变折线图'] = true
          initialVisibility['结构图'] = true
          // 动态列：从fieldList获取
          fieldList.forEach(fieldName => {
            initialVisibility[fieldName] = true
          })
          return initialVisibility
        } else {
          // 如果已经有可见性设置，则只添加新的列，保持现有设置
          const updatedVisibility = { ...prev }
          fieldList.forEach(fieldName => {
            if (!(fieldName in updatedVisibility)) {
              updatedVisibility[fieldName] = true
            }
          })
          return updatedVisibility
        }
      })
    }
  }, [fieldList])

  const navigationItems = []

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (uploadProgressInterval) {
        clearInterval(uploadProgressInterval)
      }
    }
  }, [uploadProgressInterval])

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      {/* 左侧导航栏 */}
      <div className="w-64 flex flex-col h-screen" style={{backgroundColor: '#f8f7fa', boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)'}}>
        {/* 顶部Logo区域 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img 
              src="./AM.jpg" 
              alt="增材制造" 
              className="w-8 h-8 rounded object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-800">增材制造平台</h1>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">DASHBOARD</span>
            </div>
          </div>
        </div>

        {/* 导航内容 */}
        <div className="navigation-content flex-1 overflow-y-auto py-4">
          {/* 总览按钮部分 */}
          <div className="px-6 mb-4">
            <div className="flex items-center">
              <button 
                onClick={handleSummaryClick}
                className={`flex-1 flex items-center px-4 py-3 transition-colors duration-200 font-medium ${
                  isSummaryActive 
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                总览
              </button>
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isUploading ? "上传中..." : "上传CSV文件"}
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </button>
              <button 
                onClick={handleExportClick}
                disabled={isExporting}
                className={`p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 ${
                  isExporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isExporting ? "导出中..." : "导出数据"}
              >
                {isExporting ? (
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </button>
              <button 
                onClick={handleBatchDeleteClick}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="批量删除"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 模型列表区域 */}
          <div className="model-list px-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500">加载中...</div>
              </div>
            ) : modelList.length > 0 ? (
              <div className="space-y-2">
                {modelList.map((model) => (
                  <div
                    key={model.modelId}
                    className={`flex items-center px-4 py-2 transition-colors duration-200 text-sm rounded-lg ${
                      selectedModel && selectedModel.modelId === model.modelId
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => handleModelClick(model)}
                      className="flex-1 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {model.modelName}
                  </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteModel(model.modelId, model.modelName)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                      title="删除模型"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* 用户信息部分 */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">用</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{userInfo.nickname}</p>
              <p className="text-xs text-gray-500">{userInfo.loading ? '加载中...' : userInfo.phone || '未设置'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="退出登录"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-gray-500">
            以数字为基，创实体之新
          </div>
        </div>
      </div>

      {/* 右侧主要内容区域 */}
      <div className="flex-1 flex flex-col p-4">
        {/* 主内容区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="bg-white h-full w-full overflow-hidden rounded-lg shadow-sm">
            {isSummaryActive ? (
              /* 总览仪表盘内容 */
              <div className="p-8">
                {/* 标题 */}
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-blue-800">增材制造-机械模型数据管理系统</h1>
                </div>
                
                {/* 统计卡片 */}
                <div className="grid grid-cols-3 gap-6">
                  {/* 样品总数卡片 */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">样品总数</div>
                    <div className="text-3xl font-bold text-gray-800">
                      {summaryLoading ? (
                        <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                      ) : summaryData.totalSamples !== null ? (
                        summaryData.totalSamples
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                  
                  {/* 模型总数卡片 */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h10" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">模型总数</div>
                    <div className="text-3xl font-bold text-gray-800">
                      {summaryLoading ? (
                        <div className="animate-pulse bg-gray-300 h-8 w-8 rounded"></div>
                      ) : summaryData.totalModels !== null ? (
                        summaryData.totalModels
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                  
                  {/* 模型属性数据点卡片 */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">模型属性数据点</div>
                    <div className="text-3xl font-bold text-gray-800">
                      {summaryLoading ? (
                        <div className="animate-pulse bg-gray-300 h-8 w-12 rounded"></div>
                      ) : summaryData.totalDataPoints !== null ? (
                        summaryData.totalDataPoints
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedModel ? (
              /* 模型详情页面内容 */
              <div className="h-full flex flex-col overflow-hidden">
                {/* 固定部分 - 标题 */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 overflow-hidden" style={{width: '1200px'}}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1"></div>
                    <h1 className="text-2xl font-bold text-gray-800 text-center truncate flex-1">
                      {selectedModel.modelName} 模型样品数据
                    </h1>
                    <div className="flex-1 flex justify-end">
                      <button
                        onClick={handleDownloadSampleCSV}
                        className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                        title="下载案例CSV文件"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        下载折线图样例
                      </button>
                    </div>
                  </div>
                </div>

                {/* 固定部分 - 模型数据点信息 */}
                <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 overflow-hidden" style={{width: '1200px'}}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">模型数据点信息</span>
                    </div>
                    <div className="flex space-x-8">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">样品记录数量</div>
                        <div className="text-xl font-bold text-blue-600">
                          {modelDataLoading ? (
                            <div className="animate-pulse bg-gray-300 h-5 w-8 rounded"></div>
                          ) : modelData.sampleRecordCount !== null ? (
                            modelData.sampleRecordCount
                          ) : (
                            '-'
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">模型属性数据点</div>
                        <div className="text-xl font-bold text-blue-600">
                          {modelDataLoading ? (
                            <div className="animate-pulse bg-gray-300 h-5 w-8 rounded"></div>
                          ) : modelData.attributeDataPoints !== null ? (
                            modelData.attributeDataPoints
                          ) : (
                            '-'
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">模型表现数据点</div>
                        <div className="text-xl font-bold text-blue-600">
                          {modelDataLoading ? (
                            <div className="animate-pulse bg-gray-300 h-5 w-8 rounded"></div>
                          ) : modelData.performanceDataPoints !== null ? (
                            modelData.performanceDataPoints
                          ) : (
                            '-'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 固定部分 - 操作按钮 */}
                <div className="flex-shrink-0 p-3 border-b border-gray-200 overflow-x-auto" style={{width: '1200px'}}>
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleToggleColumnVisibility}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      显示/隐藏模型属性
                    </button>
                    <button 
                      onClick={handleSetFilter}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      设置筛选
                    </button>
                    <button 
                      onClick={handleResetFilter}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      重置筛选
                    </button>
                    <button 
                      onClick={handleAddSample}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      添加样品记录
                    </button>
                    <button 
                      onClick={handleEditAttributeNames}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      修改模型属性名称
                    </button>
                    <button 
                      onClick={handleBatchUploadCsvClick}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      批量上传应力-应变折线图
                    </button>
                    <button 
                      onClick={handleBatchUploadStructureClick}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      批量上传结构图
                    </button>
                  </div>
                </div>

                {/* 动态部分 - 样品数据容器 */}
                <div className="sample-data-container flex-1 overflow-x-auto" style={{width: '1200px'}}>
                {/* 数据表格 */}
                  <div className="min-h-64">
                    {sampleDataLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-gray-500">加载中...</div>
                    </div>
                    ) : sampleData.pageData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                        <thead className="bg-blue-600 text-white">
                          <tr>
                              {visibleColumns['应力-应变折线图'] && (
                                <th className="px-4 py-2 text-left whitespace-nowrap">应力-应变折线图</th>
                              )}
                              {visibleColumns['结构图'] && (
                                <th className="px-4 py-2 text-left whitespace-nowrap">结构图</th>
                              )}
                              {fieldList.map((fieldName, index) => (
                                visibleColumns[fieldName] && (
                                  <th key={index} className="px-4 py-2 text-left whitespace-nowrap">{fieldName}</th>
                                )
                              ))}
                              <th className="px-4 py-2 text-left whitespace-nowrap bg-blue-600 sticky right-0 z-10">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                            {sampleData.pageData.map((pageItem, pageIndex) => {
                              const rowData = convertValueListToRowData(pageItem.valueList)
                              return (
                                <tr key={pageIndex} className={pageIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {/* 应力-应变折线图列 */}
                                  {visibleColumns['应力-应变折线图'] && (
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                                      {hasStrainData(pageItem) ? (
                                        <button 
                                          onClick={() => handleViewChart(pageItem.valueList[0]?.itemId)}
                                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs"
                                        >
                                          查看图表
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => handleUploadFile(pageItem.valueList[0]?.itemId)}
                                          disabled={isUploadingCSV}
                                          className={`px-3 py-1 rounded transition-colors text-xs ${
                                            isUploadingCSV 
                                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                          }`}
                                        >
                                          {isUploadingCSV ? '上传中...' : '上传文件'}
                                        </button>
                                      )}
                                    </td>
                                  )}
                                  {/* 结构图列 */}
                                  {visibleColumns['结构图'] && (
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                                      {hasStructureData(pageItem) ? (
                                        <button 
                                          onClick={() => handleViewStructure(pageItem.valueList[0]?.itemId)}
                                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs"
                                        >
                                          查看结构
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => handleUploadImage(pageItem.valueList[0]?.itemId)}
                                          disabled={isUploadingImage}
                                          className={`px-3 py-1 rounded transition-colors text-xs ${
                                            isUploadingImage 
                                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                          }`}
                                        >
                                          {isUploadingImage ? '上传中...' : '上传图片'}
                                        </button>
                                      )}
                                    </td>
                                  )}
                                  {fieldList.map((fieldName, fieldIndex) => {
                                    // 根据fieldList的索引找到对应的itemValue
                                    const itemValue = pageItem.valueList[fieldIndex]?.itemValue || '-'
                                    const isEditing = editingCell && editingCell.rowIndex === pageIndex && editingCell.fieldIndex === fieldIndex
                                    
                                    // 只渲染可见的列
                                    if (!visibleColumns[fieldName]) {
                                      return null
                                    }
                                    
                                    return (
                                      <td 
                                        key={fieldIndex} 
                                        className="px-4 py-2 text-sm whitespace-nowrap relative"
                                        onDoubleClick={() => handleCellDoubleClick(pageIndex, fieldIndex, itemValue)}
                                      >
                                        {isEditing ? (
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="text"
                                              value={editValue}
                                              onChange={(e) => handleEditValueChange(e.target.value)}
                                              className="px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleSaveEdit()
                                                } else if (e.key === 'Escape') {
                                                  handleCancelEdit()
                                                }
                                              }}
                                            />
                                            <button
                                              onClick={handleSaveEdit}
                                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                            >
                                              保存
                                </button>
                                            <button
                                              onClick={handleCancelEdit}
                                              className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                            >
                                              取消
                                </button>
                                          </div>
                                        ) : (
                                          <span className="cursor-pointer hover:bg-blue-50 px-1 py-1 rounded">
                                            {itemValue}
                                          </span>
                                        )}
                              </td>
                                    )
                                  })}
                                  <td className={`px-4 py-2 whitespace-nowrap sticky right-0 z-10 ${
                                    pageIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  }`}>
                                    <button 
                                      onClick={() => handleDeleteRecord(pageItem.valueList[0]?.itemId)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-gray-500">暂无样品数据</div>
                    </div>
                  )}
                  </div>
                </div>

                {/* 固定部分 - 分页控件 */}
                <div className="flex-shrink-0 p-3 border-t border-gray-200 overflow-hidden" style={{width: '1200px'}}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <button 
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        disabled={sampleData.currentPage <= 1}
                        onClick={() => handlePageChange(sampleData.currentPage - 1)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {generatePageNumbers(sampleData.currentPage, sampleData.totalPages).map((page, index) => (
                        page === '...' ? (
                          <span key={index} className="px-2 text-gray-500">...</span>
                        ) : (
                          <button
                            key={index}
                            className={`w-6 h-6 rounded-full text-xs transition-colors ${
                              page === sampleData.currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        )
                      ))}
                      <button 
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        disabled={sampleData.currentPage >= sampleData.totalPages}
                        onClick={() => handlePageChange(sampleData.currentPage + 1)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600">跳转到</span>
                        <input 
                          type="number" 
                          className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs"
                          placeholder="页码"
                          min="1"
                          max={sampleData.totalPages}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const page = parseInt(e.target.value)
                              if (page >= 1 && page <= sampleData.totalPages) {
                                handlePageChange(page)
                              }
                            }
                          }}
                        />
                        <button 
                          className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                          onClick={() => {
                            const input = document.querySelector('input[type="number"]')
                            const page = parseInt(input.value)
                            if (page >= 1 && page <= sampleData.totalPages) {
                              handlePageChange(page)
                            }
                          }}
                        >
                          跳转
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600">每页:</span>
                        <select 
                          className="px-1 py-0.5 border border-gray-300 rounded text-xs"
                          value={sampleData.pageSize}
                          onChange={(e) => {
                            const newPageSize = parseInt(e.target.value)
                            handlePageChange(1, newPageSize)
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={30}>30</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 空白内容区域 */
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">请选择左侧模型查看详情</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加样品记录弹窗 */}
      {showAddSampleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-gray-800">添加样品记录</h2>
                <button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className={`p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={isUploading ? "上传中..." : "上传CSV文件"}
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={handleCancelAddSample}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6">
              {/* 样品编号输入 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  样品编号
                </label>
                <input
                  type="text"
                  value={newSampleData.sampleNumber}
                  onChange={(e) => setNewSampleData(prev => ({ ...prev, sampleNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入样品编号"
                />
              </div>

              {/* 属性值输入 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  属性值
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldList
                    .filter(fieldName => fieldName !== '样品编号')
                    .map((fieldName, index) => (
                    <div key={index} className="flex flex-col">
                      <label className="text-sm text-gray-600 mb-1">
                        {fieldName}
                      </label>
                      <input
                        type="text"
                        value={newSampleData.attributeValues[fieldName] || ''}
                        onChange={(e) => handleAttributeValueChange(fieldName, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`请输入${fieldName}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelAddSample}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddSample}
                className="px-6 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 设置筛选条件弹窗 */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">设置筛选条件</h2>
              <button
                onClick={handleCancelFilter}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6">
              {/* 样品编号筛选 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  样品编号
                </label>
                <input
                  type="text"
                  value={filterConditions.sampleNumber}
                  onChange={(e) => setFilterConditions(prev => ({ ...prev, sampleNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="精确查找"
                />
              </div>

              {/* 应力-应变折线图筛选 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  应力-应变折线图
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCurve"
                      value=""
                      checked={filterConditions.hasCurve === ''}
                      onChange={(e) => setFilterConditions(prev => ({ ...prev, hasCurve: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">全部</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCurve"
                      value="1"
                      checked={filterConditions.hasCurve === '1'}
                      onChange={(e) => setFilterConditions(prev => ({ ...prev, hasCurve: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">查看图表</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCurve"
                      value="0"
                      checked={filterConditions.hasCurve === '0'}
                      onChange={(e) => setFilterConditions(prev => ({ ...prev, hasCurve: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">上传文件</span>
                  </label>
                </div>
              </div>

              {/* 结构图筛选 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结构图
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasImage"
                      value=""
                      checked={filterConditions.hasImage === ''}
                      onChange={(e) => setFilterConditions(prev => ({ ...prev, hasImage: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">全部</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasImage"
                      value="1"
                      checked={filterConditions.hasImage === '1'}
                      onChange={(e) => setFilterConditions(prev => ({ ...prev, hasImage: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">查看结构</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasImage"
                      value="0"
                      checked={filterConditions.hasImage === '0'}
                      onChange={(e) => setFilterConditions(prev => ({ ...prev, hasImage: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">上传图片</span>
                  </label>
                </div>
              </div>

              {/* 属性范围筛选 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  属性筛选
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fieldList
                    .filter(fieldName => fieldName !== '模型名称' && fieldName !== '样品编号')
                    .map((fieldName, index) => (
                    <div key={index} className="flex flex-col">
                      <label className="text-sm text-gray-600 mb-2">
                        {fieldName}
                      </label>
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={filterConditions.attributeRanges[fieldName]?.min || ''}
                            onChange={(e) => handleAttributeRangeChange(fieldName, 'min', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="最小值"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={filterConditions.attributeRanges[fieldName]?.max || ''}
                            onChange={(e) => handleAttributeRangeChange(fieldName, 'max', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="最大值"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelFilter}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmFilter}
                className="px-6 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                筛选
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改模型属性名称弹窗 */}
      {showEditAttributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-800">修改模型属性名称</h2>
                <span className="ml-3 text-sm text-gray-500">(输入新的属性名称)</span>
              </div>
              <button
                onClick={handleCancelEditAttributeNames}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6">
              {editableAttributesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">加载可编辑属性列表...</div>
                </div>
              ) : editableAttributes.length > 0 ? (
                <div className="space-y-6">
                  {editableAttributes.map((attribute, index) => (
                    <div key={attribute.itemAttributionId} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          当前属性名称: {attribute.itemAttributionName}
                        </label>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editingAttributeNames[attribute.itemAttributionName] || ''}
                          onChange={(e) => handleAttributeNameChange(attribute.itemAttributionName, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="输入新的属性名称"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">该模型没有可编辑的属性</div>
                </div>
              )}
            </div>

            {/* 弹窗底部按钮 */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelEditAttributeNames}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmEditAttributeNames}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 应力-应变折线图弹窗 */}
      <StrainChart 
        itemId={selectedItemId}
        isOpen={showStrainChart}
        onClose={handleCloseChart}
        onDelete={handleDeleteStrainData}
      />

      {/* 结构图弹窗 */}
      <ImageFetcher 
        itemId={selectedStructureItemId}
        isOpen={showStructureImage}
        onClose={handleCloseStructure}
        onUpdate={handleDownloadStructureImage}
        onDelete={handleDeleteStructureImage}
      />

      {/* 列可见性设置弹窗 */}
      {showColumnVisibilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">显示/隐藏模型属性</h2>
              <button
                onClick={handleCloseColumnVisibilityModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">选择要在表格中显示的列：</p>
                {/* 全选选项 */}
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected()}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">全选</span>
                  </label>
                </div>
                <div className="space-y-3">
                  {/* 图标列 */}
                  <div className="border-b border-gray-200 pb-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">图标列</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visibleColumns['应力-应变折线图'] || false}
                          onChange={(e) => handleColumnVisibilityChange('应力-应变折线图', e.target.checked)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">应力-应变折线图</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visibleColumns['结构图'] || false}
                          onChange={(e) => handleColumnVisibilityChange('结构图', e.target.checked)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">结构图</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* 动态列 */}
                  {fieldList.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">模型属性列</h3>
                      <div className="space-y-2">
                        {fieldList.map((fieldName, index) => (
                          <label key={index} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={visibleColumns[fieldName] || false}
                              onChange={(e) => handleColumnVisibilityChange(fieldName, e.target.checked)}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{fieldName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {fieldList.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">暂无模型属性数据</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseColumnVisibilityModal}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmColumnVisibility}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除弹窗 */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-md">
            {/* 弹窗头部 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">批量删除数据</h2>
              <button
                onClick={handleCloseBatchDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">请选择要删除数据的时间范围：</p>
                
                <div className="space-y-4">
                  {/* 开始时间 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始时间
                    </label>
                    <input
                      type="datetime-local"
                      value={batchDeleteData.startDateTime}
                      onChange={(e) => handleDateTimeChange('startDateTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* 结束时间 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束时间
                    </label>
                    <input
                      type="datetime-local"
                      value={batchDeleteData.endDateTime}
                      onChange={(e) => handleDateTimeChange('endDateTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-700">
                      警告：此操作将永久删除指定时间段内的所有数据，无法恢复！
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseBatchDeleteModal}
                disabled={isBatchDeleting}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                disabled={isBatchDeleting}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                  isBatchDeleting 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isBatchDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量上传结构图弹窗 */}
      {showBatchUploadStructureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">批量上传结构图</h2>
              <button
                onClick={handleCancelBatchUploadStructure}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6">
              {!isUploadingStructure ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择结构图文件
                    </label>
                    <input
                      id="batch-structure-file-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBatchStructureFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      支持批量选择多个图片文件
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancelBatchUploadStructure}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmBatchUploadStructure}
                      disabled={!selectedFiles || selectedFiles.length === 0}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        !selectedFiles || selectedFiles.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      开始上传
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">正在上传结构图...</h3>
                    <p className="text-sm text-gray-600">请稍候，文件正在后台处理中</p>
                  </div>
                  
                  {/* 上传进度信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">任务状态：</span>
                        <span className={`font-medium ${
                          uploadProgress.status === 'COMPLETED' ? 'text-green-600' :
                          uploadProgress.status === 'FAILED' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {uploadProgress.status === 'COMPLETED' ? '已完成' :
                           uploadProgress.status === 'FAILED' ? '失败' :
                           uploadProgress.status === 'PROCESSING' ? '处理中' :
                           '等待中'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">总文件数：</span>
                        <span className="font-medium">{uploadProgress.totalFiles}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">已处理：</span>
                        <span className="font-medium">{uploadProgress.processedFiles}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">成功：</span>
                        <span className="font-medium text-green-600">{uploadProgress.successCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">失败：</span>
                        <span className="font-medium text-red-600">{uploadProgress.failureCount}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">进度：</span>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: uploadProgress.totalFiles > 0 
                                ? `${(uploadProgress.processedFiles / uploadProgress.totalFiles) * 100}%` 
                                : '0%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {uploadProgress.finalMessage && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">{uploadProgress.finalMessage}</p>
                      </div>
                    )}
                  </div>
                  
                  {uploadProgress.status === 'COMPLETED' && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleCloseBatchUploadStructure}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        完成
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 批量上传CSV弹窗 */}
      {showBatchUploadCsvModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">批量上传应力-应变折线图CSV</h2>
              <button
                onClick={handleCancelBatchUploadCsv}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6">
              {!isUploadingCsv ? (
                <div className="space-y-6">
                  {/* 温度输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      温度 (Temperature) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={csvTemperature}
                      onChange={(e) => setCsvTemperature(e.target.value)}
                      placeholder="请输入温度值，例如：20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      请输入温度数值
                    </p>
                  </div>

                  {/* 文件选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择CSV文件 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="batch-csv-file-input"
                      type="file"
                      accept=".csv"
                      multiple
                      onChange={handleBatchCsvFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      支持批量选择多个CSV文件
                    </p>
                    {selectedCsvFiles && selectedCsvFiles.length > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        已选择 {selectedCsvFiles.length} 个文件
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancelBatchUploadCsv}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmBatchUploadCsv}
                      disabled={!selectedCsvFiles || selectedCsvFiles.length === 0 || !csvTemperature}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        !selectedCsvFiles || selectedCsvFiles.length === 0 || !csvTemperature
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      开始上传
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 上传进度信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">任务状态：</span>
                        <span className={`font-medium ${
                          csvUploadProgress.status === 'COMPLETED' ? 'text-green-600' :
                          csvUploadProgress.status === 'FAILED' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {csvUploadProgress.status === 'COMPLETED' ? '已完成' :
                           csvUploadProgress.status === 'FAILED' ? '失败' :
                           csvUploadProgress.status === 'PROCESSING' ? '处理中' :
                           '等待中'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">总文件数：</span>
                        <span className="font-medium">{csvUploadProgress.totalFiles}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">已处理：</span>
                        <span className="font-medium">{csvUploadProgress.processedFiles}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">成功：</span>
                        <span className="font-medium text-green-600">{csvUploadProgress.successCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">失败：</span>
                        <span className="font-medium text-red-600">{csvUploadProgress.failureCount}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">进度：</span>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: csvUploadProgress.totalFiles > 0 
                                ? `${(csvUploadProgress.processedFiles / csvUploadProgress.totalFiles) * 100}%` 
                                : '0%' 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {csvUploadProgress.totalFiles > 0 
                            ? `${Math.round((csvUploadProgress.processedFiles / csvUploadProgress.totalFiles) * 100)}%` 
                            : '0%'}
                        </p>
                      </div>
                    </div>
                    
                    {csvUploadProgress.finalMessage && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">{csvUploadProgress.finalMessage}</p>
                      </div>
                    )}

                    {/* 显示失败详情 */}
                    {csvUploadProgress.failureCount > 0 && Object.keys(csvUploadProgress.failureDetails).length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg max-h-40 overflow-y-auto">
                        <p className="text-sm font-medium text-red-800 mb-2">失败详情：</p>
                        <ul className="text-xs text-red-700 space-y-1">
                          {Object.entries(csvUploadProgress.failureDetails).map(([filename, error]) => (
                            <li key={filename}>
                              <span className="font-medium">{filename}:</span> {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {csvUploadProgress.status === 'COMPLETED' && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleCloseBatchUploadCsv}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        完成
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        id="csv-file-input"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      {/* 隐藏的图片文件输入 */}
      <input
        id="image-file-input"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      
      {/* 隐藏的批量结构图文件输入 */}
      <input
        id="batch-structure-file-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleBatchStructureFileSelect}
        style={{ display: 'none' }}
      />
      
      {/* 隐藏的应力-应变CSV文件输入 */}
      <input
        id="strain-csv-file-input"
        type="file"
        accept=".csv"
        onChange={handleStrainCSVUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default Dashboard
