import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../utils/config'
import { apiService } from '../services/api'

const Login = () => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true) // true为登录，false为注册
  const [isForgotPassword, setIsForgotPassword] = useState(false) // 是否为忘记密码
  const [formData, setFormData] = useState({
    phone: '',
    verificationCode: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSendCode = () => {
    if (!formData.phone) {
      alert('请先输入手机号')
      return
    }
    
    // 开始倒计时
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // 这里可以调用发送验证码的API
    // 默认验证码是123456
    console.log('发送验证码到:', formData.phone)
    console.log('验证码是: 123456')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('表单数据:', formData)
    
    if (isForgotPassword) {
      // 忘记密码逻辑
      await handleForgotPassword()
    } else if (isLogin) {
      // 登录逻辑
      await handleLogin()
    } else {
      // 注册逻辑
      await handleRegister()
    }
  }

  // 处理登录
  const handleLogin = async () => {
    if (!formData.phone || !formData.password) {
      alert('请填写手机号和密码')
      return
    }

    setIsLoading(true)
    try {
      // 使用 IPC 代理服务发送请求
      console.log('发送验证码到:', formData.phone)
      console.log('验证码是: 123456')
      console.log('表单数据:', {
        phoneNumber: formData.phone,
        verificationCode: formData.verificationCode,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        nickname: formData.nickname
      })
      
      const result = await apiService.auth.login({
        phoneNumber: formData.phone,
        verificationCode: formData.verificationCode,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        nickname: formData.nickname
      })

      console.log('登录响应:', result)
      
      if (result.status === 200 && result.data && result.data.token) {
        // 存储token到localStorage
        localStorage.setItem('token', result.data.token)
        localStorage.setItem('tokenType', result.data.tokenType)
        localStorage.setItem('user', JSON.stringify({ phone: formData.phone }))
        
        alert('登录成功！')
        console.log('登录成功，token已保存')
        navigate('/dashboard')
      } else {
        alert('登录失败: ' + (result.message || '未知错误'))
      }
    } catch (error) {
      console.error('登录请求失败:', error)
      alert('登录请求失败: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理注册
  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('两次输入的密码不一致')
      return
    }
    if (!formData.phone || !formData.verificationCode || !formData.password || !formData.nickname) {
      alert('请填写完整信息')
      return
    }

    setIsLoading(true)
    try {
      // 使用 IPC 代理服务发送请求
      const result = await apiService.auth.register({
        phoneNumber: formData.phone,
        password: formData.password,
        nickname: formData.nickname
      })

      console.log('注册响应:', result)

      if (result.status === 200) {
        alert('注册成功！请登录')
        console.log('注册成功')
        // 注册成功后跳转到登录页面
        setIsLogin(true)
        setFormData({ phone: '', verificationCode: '', password: '', confirmPassword: '', nickname: '' })
      } else {
        alert('注册失败: ' + (result.message || '未知错误'))
      }
    } catch (error) {
      console.error('注册请求失败:', error)
      alert('注册请求失败: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理忘记密码
  const handleForgotPassword = async () => {
    if (formData.newPassword !== formData.confirmNewPassword) {
      alert('两次输入的新密码不一致')
      return
    }
    if (!formData.phone || !formData.verificationCode || !formData.newPassword) {
      alert('请填写完整信息')
      return
    }

    setIsLoading(true)
    try {
      // 获取存储的token
      const token = localStorage.getItem('token')
      const tokenType = localStorage.getItem('tokenType') || 'Bearer'
      
      const response = await fetch(`${API_ENDPOINTS.api}/user/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*',
          'Authorization': `${tokenType} ${token}`
        },
        body: JSON.stringify({
          phoneNumber: formData.phone,
          newPassword: formData.newPassword
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 200) {
          alert('密码重置成功！请使用新密码登录')
          console.log('密码重置成功')
          // 重置密码成功后跳转到登录页面
          setIsForgotPassword(false)
          setIsLogin(true)
          setFormData({ phone: '', verificationCode: '', password: '', confirmPassword: '', nickname: '', newPassword: '', confirmNewPassword: '' })
        } else {
          alert('密码重置失败: ' + (result.message || '未知错误'))
        }
      } else {
        let errorMessage = `密码重置失败 (${response.status})`
        try {
          const errorResult = await response.json()
          errorMessage += `: ${errorResult.message || '未知错误'}`
        } catch (e) {
          console.error('无法解析错误响应:', e)
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('密码重置请求失败:', error)
      alert('密码重置请求失败: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理忘记密码按钮点击
  const handleForgotPasswordClick = () => {
    setIsForgotPassword(true)
    setIsLogin(false)
    setFormData({ phone: '', verificationCode: '', password: '', confirmPassword: '', nickname: '', newPassword: '', confirmNewPassword: '' })
  }

  // 处理返回登录按钮点击
  const handleBackToLoginClick = () => {
    setIsForgotPassword(false)
    setIsLogin(true)
    setFormData({ phone: '', verificationCode: '', password: '', confirmPassword: '', nickname: '', newPassword: '', confirmNewPassword: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3">
            <img 
              src="./AM.jpg" 
              alt="增材制造" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <h1 className="text-2xl font-bold text-blue-600">增材制造平台</h1>
          </div>
        </div>

        {/* 主卡片 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex">
            {/* 左侧表单 */}
            <div className="flex-1 p-8">
              {/* 登录/注册选项卡 */}
              {!isForgotPassword && (
                <div className="flex mb-6">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative ${
                      isLogin
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    登录
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 transition-colors ${
                      isLogin ? 'bg-blue-600' : 'bg-transparent'
                    }`}></div>
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative ${
                      !isLogin
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    注册
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 transition-colors ${
                      !isLogin ? 'bg-blue-600' : 'bg-transparent'
                    }`}></div>
                  </button>
                </div>
              )}

              {isForgotPassword ? (
                // 忘记密码表单
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 手机号输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      手机号
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="请输入手机号"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 验证码输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      验证码
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        name="verificationCode"
                        value={formData.verificationCode}
                        onChange={handleInputChange}
                        placeholder="请输入验证码"
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          countdown > 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {countdown > 0 ? `${countdown}s` : '发送验证码'}
                      </button>
                    </div>
                  </div>

                  {/* 新密码输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="请输入新密码"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 确认新密码输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleInputChange}
                      placeholder="请再次输入新密码"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 重置密码按钮 */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      isLoading
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        重置中...
                      </>
                    ) : (
                      '重置密码'
                    )}
                  </button>

                  {/* 返回登录按钮 */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleBackToLoginClick}
                      className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                    >
                      返回登录
                    </button>
                  </div>
                </form>
              ) : isLogin ? (
                // 登录表单
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 手机号输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      手机号
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="请输入手机号"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 密码输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密码
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="请输入密码"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 用户协议 */}
                  <div className="text-sm text-gray-600">
                    <p>
                      登录即代表已阅读并同意我们的
                      <a href="#" className="text-blue-600 hover:underline">用户协议</a>
                      与
                      <a href="#" className="text-blue-600 hover:underline">隐私政策</a>
                    </p>
                  </div>

                  {/* 登录按钮 */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      isLoading
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        登录中...
                      </>
                    ) : (
                      '登录'
                    )}
                  </button>

                  {/* 忘记密码按钮 */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                    >
                      忘记密码
                    </button>
                  </div>
                </form>
              ) : (
                // 注册表单
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 手机号输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      手机号
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="请输入手机号"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 昵称输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      昵称
                    </label>
                    <input
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleInputChange}
                      placeholder="请输入昵称"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 验证码输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      验证码
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        name="verificationCode"
                        value={formData.verificationCode}
                        onChange={handleInputChange}
                        placeholder="请输入验证码"
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0}
                        className={`ml-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                          countdown > 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {countdown > 0 ? `${countdown}s` : '发送验证码'}
                      </button>
                    </div>
                  </div>

                  {/* 密码输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密码
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="请输入密码"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 确认密码输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认密码
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="请再次输入密码"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* 用户协议 */}
                  <div className="text-sm text-gray-600">
                    <p>
                      注册即代表已阅读并同意我们的
                      <a href="#" className="text-blue-600 hover:underline">用户协议</a>
                      与
                      <a href="#" className="text-blue-600 hover:underline">隐私政策</a>
                    </p>
                  </div>

                  {/* 注册按钮 */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      isLoading
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        注册中...
                      </>
                    ) : (
                      '注册'
                    )}
                  </button>

                  {/* 返回登录按钮 */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      返回登录
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 右侧欢迎语区域 */}
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  欢迎探索增材制造
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  以数字为基，创实体之新
                </p>
                
                <div className="mt-8 text-sm text-gray-500">
                  <p>开启您的智能制造之旅</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Login
