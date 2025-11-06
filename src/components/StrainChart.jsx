import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiService } from '../services/api'

const StrainChart = ({ itemId, isOpen, onClose, onUpdate, onDelete }) => {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // 获取应力-应变数据
  const fetchStrainStressData = async (itemId) => {
    if (!itemId) return

    setLoading(true)
    setError(null)
    try {
      const result = await apiService.strain.getStressStrain(itemId)
      
      if (result.status === 200 && result.data) {
        const { strainArray, stressArray } = result.data
        
        // 检查数据是否有效
        if (strainArray && Array.isArray(strainArray) && stressArray && Array.isArray(stressArray)) {
          // 转换数据格式为recharts需要的格式
          const formattedData = strainArray.map((strain, index) => ({
            strain: strain,
            stress: stressArray[index] || 0
          }))
          
          setChartData(formattedData)
          console.log('应力-应变数据:', formattedData)
        } else {
          setError('数据格式错误：缺少应变或应力数组')
          console.error('无效的数据格式:', { strainArray, stressArray })
        }
      } else {
        setError('获取数据失败: ' + result.message)
      }
    } catch (error) {
      console.error('获取应力-应变数据失败:', error)
      setError('获取数据失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 当弹窗打开且有itemId时获取数据
  useEffect(() => {
    if (isOpen && itemId) {
      fetchStrainStressData(itemId)
    }
  }, [isOpen, itemId])

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

      const result = await apiService.strain.uploadCsv(itemId, formData)
      
      if (result.status === 200) {
        alert(`应力-应变数据上传成功！${result.data}`)
        // 重新获取数据以显示新上传的图表
        await fetchStrainStressData(itemId)
      } else {
        alert('上传失败: ' + result.message)
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      alert('文件上传失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsUploading(false)
      // 清空文件输入
      event.target.value = ''
    }
  }

  // 处理上传按钮点击
  const handleUploadClick = () => {
    const fileInput = document.getElementById(`strain-csv-file-input-${itemId}`)
    if (fileInput) {
      fileInput.click()
    }
  }

  // 关闭弹窗时清理数据
  const handleClose = () => {
    setChartData([])
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 弹窗头部 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">应力-应变折线图</h2>
          <div className="flex items-center space-x-2">
            {/* 上传按钮 */}
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className={`p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isUploading ? "上传中..." : "上传CSV文件"}
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </button>
            {/* 删除按钮 */}
            <button
              onClick={() => onDelete && onDelete(itemId)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="删除数据"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="关闭"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 弹窗内容 */}
        <div className="p-6 h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">加载图表数据中...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500 text-center">
                <div className="text-lg font-medium mb-2">加载失败</div>
                <div className="text-sm">{error}</div>
                <button
                  onClick={() => fetchStrainStressData(itemId)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="strain" 
                    name="应变"
                    label={{ value: '应变', position: 'insideBottom', offset: -10 }}
                    tickFormatter={(value) => value.toExponential(2)}
                  />
                  <YAxis 
                    name="应力"
                    label={{ value: '应力', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => value.toExponential(2)}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'stress' ? value.toExponential(4) : value.toExponential(4),
                      name === 'stress' ? '应力' : '应变'
                    ]}
                    labelFormatter={(value) => `应变: ${value.toExponential(4)}`}
                  />
                  <Legend 
                    align="right" 
                    verticalAlign="bottom" 
                    layout="horizontal"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                   <Line 
                     type="monotone" 
                     dataKey="stress" 
                     stroke="#2563eb" 
                     strokeWidth={2}
                     dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                     name="应力-应变"
                   />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">暂无数据</div>
            </div>
          )}
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        id={`strain-csv-file-input-${itemId}`}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default StrainChart
