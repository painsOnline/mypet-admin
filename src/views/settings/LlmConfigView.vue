<template>
  <div class="llm-config">
    <el-card>
      <template #header>
        <h3>AI应用配置</h3>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" size="default">
        <el-form-item label="模型提供商" prop="provider">
          <el-input v-model="form.provider" placeholder="例如: openai / deepseek / qwen" style="width: 400px" maxlength="100" />
        </el-form-item>
        <el-form-item label="API密钥" prop="apiKey">
          <el-input v-model="form.apiKey" placeholder="请输入API密钥" style="width: 400px" maxlength="100" show-password />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="例如: gpt-4o / deepseek-v3" style="width: 400px" maxlength="100" />
        </el-form-item>
        <el-form-item label="API地址" prop="baseUrl">
          <el-input v-model="form.baseUrl" placeholder="例如: https://api.openai.com/v1" style="width: 500px" maxlength="500" />
        </el-form-item>
        <el-form-item label="温度" prop="temperature">
          <el-input-number v-model="form.temperature" :min="0" :max="2" :precision="2" :step="0.1" style="width: 180px" />
          <span style="margin-left: 8px; color: #909399">取值范围 0-2，默认 0.3</span>
        </el-form-item>
        <el-form-item label="最大Token" prop="maxTokens">
          <el-input-number v-model="form.maxTokens" :min="1" :step="100" style="width: 180px" />
          <span style="margin-left: 8px; color: #909399">单次最大输出，默认 4096</span>
        </el-form-item>
        <el-form-item label="超时时间(秒)" prop="timeoutSeconds">
          <el-input-number v-model="form.timeoutSeconds" :min="1" :max="300" style="width: 180px" />
          <span style="margin-left: 8px; color: #909399">默认 60 秒</span>
        </el-form-item>
        <el-form-item label="最大重试次数" prop="maxRetries">
          <el-input-number v-model="form.maxRetries" :min="0" :max="10" style="width: 180px" />
          <span style="margin-left: 8px; color: #909399">默认 3 次</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSave">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getLlmConfig, saveLlmConfig } from '@/api'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  provider: '',
  apiKey: '',
  modelName: '',
  baseUrl: '',
  temperature: 0.3,
  maxTokens: 4096,
  timeoutSeconds: 60,
  maxRetries: 3,
})

const rules: FormRules = {
  provider: [{ required: true, message: '请输入模型提供商', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API密钥', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  baseUrl: [{ required: true, message: '请输入API地址', trigger: 'blur' }],
  temperature: [
    { required: true, message: '请输入温度', trigger: 'blur' },
    { type: 'number', min: 0, max: 2, message: '温度取值范围 0-2', trigger: 'blur' },
  ],
  maxTokens: [
    { required: true, message: '请输入最大Token', trigger: 'blur' },
    { type: 'number', min: 1, message: '最大Token必须大于0', trigger: 'blur' },
  ],
  timeoutSeconds: [
    { required: true, message: '请输入超时时间', trigger: 'blur' },
    { type: 'number', min: 1, message: '超时时间必须大于0', trigger: 'blur' },
  ],
  maxRetries: [
    { required: true, message: '请输入最大重试次数', trigger: 'blur' },
    { type: 'number', min: 0, message: '最大重试次数不能小于0', trigger: 'blur' },
  ],
}

async function loadConfig() {
  try {
    const data = await getLlmConfig()
    if (data) {
      Object.assign(form, {
        provider: data.provider || '',
        apiKey: data.apiKey || '',
        modelName: data.modelName || '',
        baseUrl: data.baseUrl || '',
        temperature: data.temperature ?? 0.3,
        maxTokens: data.maxTokens ?? 4096,
        timeoutSeconds: data.timeoutSeconds ?? 6,
        maxRetries: data.maxRetries ?? 3,
      })
    }
  } catch { /* handled */ }
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await saveLlmConfig({
      provider: form.provider,
      apiKey: form.apiKey,
      modelName: form.modelName,
      baseUrl: form.baseUrl,
      temperature: form.temperature,
      maxTokens: form.maxTokens,
      timeoutSeconds: form.timeoutSeconds,
      maxRetries: form.maxRetries,
    })
    ElMessage.success('保存成功')
  } catch { /* handled */ } finally { loading.value = false }
}

onMounted(() => { loadConfig() })
</script>

<style lang="scss" scoped>
.llm-config {
  max-width: 1400px;
  margin: 0 auto;
}
h3 { margin: 0; font-size: 18px; color: #303133; }
</style>
