# 增材制造平台 Playwright 测试

## 测试概述

本测试套件使用 Playwright 对增材制造平台的前端功能进行自动化测试。

## 测试内容

### 1. 登录页面加载测试
- 验证页面标题正确显示
- 验证登录表单元素是否存在

### 2. 登录和注册表单切换
- 测试登录/注册选项卡切换功能
- 验证表单内容正确显示

### 3. 表单输入功能测试
- 测试手机号和密码输入框
- 验证输入值是否正确保存

### 4. 注册表单验证码按钮测试
- 测试验证码发送功能
- 验证倒计时功能

### 5. 忘记密码功能测试
- 测试忘记密码流程
- 验证表单切换功能

### 6. 响应式设计测试
- 测试移动端视图显示

### 7. 欢迎语区域显示测试
- 验证右侧欢迎语内容

## 运行测试

### 前提条件
确保已安装所有依赖：
```bash
npm install
```

### 运行所有测试
```bash
npx playwright test
```

### 运行测试并查看报告
```bash
npx playwright test --reporter=html
npx playwright show-report
```

### 运行特定测试
```bash
npx playwright test example.spec.ts
```

### 使用 UI 模式运行（推荐用于调试）
```bash
npx playwright test --ui
```

### 调试模式
```bash
npx playwright test --debug
```

### 在特定浏览器中运行
```bash
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari
npx playwright test --project=webkit
```

## 配置说明

测试配置位于 `playwright.config.ts` 文件中：
- **baseURL**: `http://localhost:3000` - 本地开发服务器地址
- **webServer**: 自动启动开发服务器
- **支持的浏览器**: Chromium, Firefox, WebKit

## 注意事项

1. 测试会自动启动开发服务器（`npm run dev`）
2. 如果开发服务器已经在运行，测试会重用现有服务器
3. 测试在 CI 环境中会自动进行重试（最多2次）
4. 所有测试会生成 HTML 报告，保存在 `playwright-report` 目录中

## 故障排查

如果测试失败：
1. 确保开发服务器能够正常启动
2. 检查 `http://localhost:3000` 是否可访问
3. 运行 `npx playwright test --debug` 进行调试
4. 查看测试报告获取详细错误信息

