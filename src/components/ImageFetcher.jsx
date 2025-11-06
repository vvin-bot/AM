import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'

const ImageFetcher = ({ itemId, isOpen, onClose, onUpdate, onDelete }) => {
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 获取结构图数据
  const fetchStructureImage = async (itemId) => {
    if (!itemId) return

    setLoading(true)
    setError(null)
    try {
      const result = await apiService.model.getStructureImage(itemId)
      
      if (result.status === 200 && result.data) {
        setImageUrl(result.data.imageUrl)
        console.log('结构图URL:', result.data.imageUrl)
      } else {
        setError('获取图片失败: ' + result.message)
      }
    } catch (error) {
      console.error('获取结构图失败:', error)
      setError('获取图片失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 当弹窗打开且有itemId时获取数据
  useEffect(() => {
    if (isOpen && itemId) {
      fetchStructureImage(itemId)
    }
  }, [isOpen, itemId])

  // 关闭弹窗时清理数据
  const handleClose = () => {
    setImageUrl('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 弹窗头部 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">结构图</h2>
          <div className="flex items-center space-x-2">
            {/* 下载按钮 */}
            <button
              onClick={() => onUpdate && onUpdate(itemId)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="下载图片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            {/* 删除按钮 */}
            <button
              onClick={() => onDelete && onDelete(itemId)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="删除图片"
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
              <div className="text-gray-500">加载结构图中...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500 text-center">
                <div className="text-lg font-medium mb-2">加载失败</div>
                <div className="text-sm">{error}</div>
                <button
                  onClick={() => fetchStructureImage(itemId)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : imageUrl ? (
            <div className="h-full flex items-center justify-center">
              <img
                src={imageUrl}
                alt="结构图"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  console.error('图片加载失败:', imageUrl)
                  setError('图片加载失败')
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">暂无结构图</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageFetcher
