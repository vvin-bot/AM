import { test, expect } from '@playwright/test';

test.describe('增材制造平台测试', () => {
  test('登录页面加载测试', async ({ page }) => {
    // 访问首页（登录页）
    await page.goto('/');

    // 检查页面标题
    await expect(page.getByRole('heading', { name: '增材制造平台' })).toBeVisible();

    // 检查登录表单元素是否存在
    await expect(page.getByText('登录', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('请输入手机号')).toBeVisible();
    await expect(page.getByPlaceholder('请输入密码')).toBeVisible();
  });

  test('登录和注册表单切换', async ({ page }) => {
    await page.goto('/');

    // 默认应该显示登录表单
    await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible();

    // 点击注册选项卡
    await page.getByRole('button', { name: '注册' }).first().click();

    // 检查注册表单是否显示
    await expect(page.getByPlaceholder('请输入昵称')).toBeVisible();
    await expect(page.getByPlaceholder('请再次输入密码')).toBeVisible();

    // 点击返回登录
    await page.getByRole('button', { name: '登录' }).first().click();

    // 检查是否回到登录表单
    await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible();
  });

  test('表单输入功能测试', async ({ page }) => {
    await page.goto('/');

    // 在登录表单中输入数据
    const phoneInput = page.getByPlaceholder('请输入手机号');
    const passwordInput = page.getByPlaceholder('请输入密码');

    await phoneInput.fill('13800138000');
    await passwordInput.fill('testpassword123');

    // 验证输入的值
    await expect(phoneInput).toHaveValue('13800138000');
    await expect(passwordInput).toHaveValue('testpassword123');
  });

  test('注册表单验证码按钮测试', async ({ page }) => {
    await page.goto('/');

    // 切换到注册表单
    await page.getByRole('button', { name: '注册' }).first().click();

    // 检查发送验证码按钮是否存在
    const sendCodeButton = page.getByRole('button', { name: '发送验证码' });
    await expect(sendCodeButton).toBeVisible();

    // 填写手机号
    await page.getByPlaceholder('请输入手机号').fill('13800138000');

    // 点击发送验证码
    await sendCodeButton.click();

    // 验证按钮状态变化（倒计时）
    await expect(page.getByRole('button', { name: /\d+s/ })).toBeVisible();
  });

  test('忘记密码功能测试', async ({ page }) => {
    await page.goto('/');

    // 点击忘记密码按钮
    await page.getByRole('button', { name: '忘记密码' }).click();

    // 检查是否显示重置密码表单
    await expect(page.getByPlaceholder('请输入新密码')).toBeVisible();
    await expect(page.getByPlaceholder('请再次输入新密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '重置密码' })).toBeVisible();

    // 点击返回登录
    await page.getByRole('button', { name: '返回登录' }).click();

    // 检查是否回到登录表单
    await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible();
  });

  test('响应式设计测试 - 移动端视图', async ({ page }) => {
    // 设置移动端视口大小
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 检查页面是否正常显示
    await expect(page.getByRole('heading', { name: '增材制造平台' })).toBeVisible();
    await expect(page.getByPlaceholder('请输入手机号')).toBeVisible();
  });

  test('欢迎语区域显示测试', async ({ page }) => {
    await page.goto('/');

    // 检查右侧欢迎语是否显示
    await expect(page.getByRole('heading', { name: '欢迎探索增材制造' })).toBeVisible();
    await expect(page.getByText('以数字为基，创实体之新')).toBeVisible();
  });
});
