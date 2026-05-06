<template>
  <div class="image-uploader">
    <!-- Multi-image mode -->
    <template v-if="isArray">
      <div v-for="(url, index) in modelList" :key="index" class="image-item">
        <div v-if="url" class="image-preview-box">
          <el-image :src="url" fit="cover" class="image-preview"
            :preview-src-list="[url]" preview-teleported />
          <div class="image-actions">
            <el-button type="danger" :icon="Delete" circle size="small" @click="removeItem(index)" />
          </div>
        </div>
        <el-upload v-else
          class="upload-drop"
          drag
          :show-file-list="false"
          :http-request="(opt) => handleUpload(opt, index)"
          accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
        >
          <el-icon :size="32"><UploadFilled /></el-icon>
          <div class="upload-text">拖拽或点击上传</div>
        </el-upload>
      </div>
      <el-upload
        v-if="modelList.length < maxCount"
        class="upload-drop upload-add"
        drag
        :show-file-list="false"
        :http-request="(opt) => handleAddUpload(opt)"
        accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
      >
        <el-icon :size="28"><Plus /></el-icon>
        <div class="upload-text">添加图片</div>
      </el-upload>
    </template>

    <!-- Single image mode -->
    <template v-else>
      <div v-if="modelValue" class="image-preview-box">
        <el-image :src="modelValue" fit="cover" class="image-preview"
          :preview-src-list="[modelValue]" preview-teleported />
        <div class="image-actions">
          <el-button type="danger" :icon="Delete" circle size="small" @click="removeSingle" />
        </div>
      </div>
      <el-upload v-else
        class="upload-drop"
        drag
        :show-file-list="false"
        :http-request="handleSingleUpload"
        accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
      >
        <el-icon :size="32"><UploadFilled /></el-icon>
        <div class="upload-text">拖拽或点击上传</div>
      </el-upload>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Delete, Plus, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const props = defineProps({
  modelValue: { type: [String, Array], default: '' },
  maxCount: { type: Number, default: 10 },
})

const emit = defineEmits(['update:modelValue'])

const isArray = computed(() => Array.isArray(props.modelValue))

const modelList = computed(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue
  return []
})

const uploading = ref(false)

async function doUpload(file) {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await request({
    url: '/admin/upload/image',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp
}

async function handleUpload(opt, index) {
  try {
    const url = await doUpload(opt.file)
    const list = [...modelList.value]
    list[index] = url
    emit('update:modelValue', list)
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
}

async function handleAddUpload(opt) {
  try {
    const url = await doUpload(opt.file)
    emit('update:modelValue', [...modelList.value, url])
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
}

async function handleSingleUpload(opt) {
  try {
    const url = await doUpload(opt.file)
    emit('update:modelValue', url)
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
}

function removeItem(index) {
  const list = [...modelList.value]
  list[index] = '' // clear slot for re-upload
  if (list.every(v => !v)) {
    emit('update:modelValue', [])
  } else {
    emit('update:modelValue', list.filter(v => v))
  }
}

function removeSingle() {
  emit('update:modelValue', '')
}
</script>

<style lang="scss" scoped>
.image-uploader { width: 100%; }
.image-item { display: inline-block; margin-right: 12px; margin-bottom: 12px; vertical-align: top; }

.image-preview-box {
  position: relative;
  display: inline-block;
  width: 130px; height: 130px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}
.image-preview {
  width: 130px; height: 130px;
}
.image-actions {
  position: absolute;
  top: 4px; right: 4px;
}

.upload-drop {
  width: 130px;
}
.upload-drop :deep(.el-upload) { width: 130px; }
.upload-drop :deep(.el-upload-dragger) {
  width: 130px; height: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.upload-text {
  font-size: 12px; color: #909399; margin-top: 4px;
}
.upload-add :deep(.el-upload-dragger) {
  border-style: dashed;
}
</style>
