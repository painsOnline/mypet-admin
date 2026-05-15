<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>宠物用品社区店 - 店主管理后台</h2>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="租户代码" prop="tenantCode">
          <el-input v-model="form.tenantCode" placeholder="请输入租户代码" />
        </el-form-item>
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item v-if="showCaptcha" label="验证码" prop="captchaInput">
          <div class="captcha-row">
            <el-input v-model="form.captchaInput" placeholder="请输入验证码" style="flex:1" />
            <img v-if="captchaImage" :src="captchaImage" class="captcha-img" @click="refreshCaptcha" title="点击刷新验证码" />
            <el-button circle :icon="RefreshRight" size="small" @click="refreshCaptcha" title="刷新验证码" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getCaptcha } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const showCaptcha = ref(false)
const captchaImage = ref('')
const captchaToken = ref('')

const form = reactive({
  tenantCode: '',
  account: '',
  password: '',
  captchaInput: '',
})

const rules = {
  tenantCode: [{ required: true, message: '请输入租户代码', trigger: 'blur' }],
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function refreshCaptcha() {
  try {
    const data = await getCaptcha()
    captchaToken.value = data.token
    captchaImage.value = data.image
    form.captchaInput = ''
  } catch { /* ignore */ }
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login(
      form.tenantCode, form.account, form.password,
      showCaptcha.value ? captchaToken.value : undefined,
      showCaptcha.value ? form.captchaInput : undefined
    )
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e: any) {
    if (e?.code === '429') {
      // Captcha now required (5+ failures in 1 min for this tenant+account)
      showCaptcha.value = true
      refreshCaptcha()
    } else if (e?.code === '423') {
      ElMessage.error('账户已被锁定，请10分钟后再试')
    }
    // For 401 (wrong credentials), the interceptor already shows the error message.
    // If captcha was already visible, refresh it for the next attempt.
    if (showCaptcha.value && e?.code !== '429') {
      refreshCaptcha()
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 460px;
  border-radius: 8px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.captcha-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.captcha-img {
  height: 40px;
  width: 100px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  object-fit: contain;
}
</style>
