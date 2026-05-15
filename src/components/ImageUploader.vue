<template>
  <div class="image-uploader">
    <!-- Multi-image mode -->
    <template v-if="isArray">
      <div class="image-list">
        <div v-for="(url, index) in localList" :key="'img-' + index" class="image-item">
          <div class="image-preview-box">
            <el-image :src="url" fit="cover" class="image-preview"
              :preview-src-list="[url]" preview-teleported />
            <div class="image-arrows">
              <el-button v-if="index > 0" :icon="ArrowLeft" circle size="small" @click="moveItem(index, -1)" />
              <el-button v-if="index < localList.length - 1" :icon="ArrowRight" circle size="small" @click="moveItem(index, 1)" />
            </div>
            <div class="image-del">
              <el-button type="danger" :icon="Delete" circle size="small" @click="removeItem(index)" />
            </div>
            <div v-if="index === 0" class="main-badge">主图</div>
          </div>
        </div>
      </div>
      <el-upload
        v-if="localList.length < maxCount"
        class="upload-drop upload-add"
        drag
        multiple
        :show-file-list="false"
        :http-request="handleBatchUpload"
        accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
      >
        <el-icon :size="28"><Plus /></el-icon>
        <div class="upload-text">选择图片</div>
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
import { computed, ref, watch } from 'vue'
import { Delete, Plus, UploadFilled, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const props = defineProps({
  modelValue: { type: [String, Array], default: '' },
  maxCount: { type: Number, default: 10 },
  category: { type: String, default: '' },
  productId: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const isArray = computed(() => Array.isArray(props.modelValue))
const localList = ref<string[]>([])

watch(() => props.modelValue, (val) => {
  localList.value = Array.isArray(val) ? [...val] : []
}, { immediate: true })

function moveItem(index: number, direction: number) {
  const arr = [...localList.value]
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= arr.length) return
  const temp = arr[index]
  arr[index] = arr[newIndex]
  arr[newIndex] = temp
  localList.value = arr
  emit('update:modelValue', arr)
}

async function doUpload(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  let url = '/admin/upload/image'
  const params = new URLSearchParams()
  if (props.category) params.append('type', props.category)
  if (props.productId) params.append('productId', props.productId)
  const qs = params.toString()
  if (qs) url += '?' + qs
  const resp = await request({
    url,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp as string
}

async function handleBatchUpload(opt: any) {
  const file: File = opt.file
  if (localList.value.length >= props.maxCount) {
    ElMessage.warning(`最多上传${props.maxCount}张图片`)
    return
  }
  try {
    const url = await doUpload(file)
    emit('update:modelValue', [...localList.value, url])
  } catch { ElMessage.error(file.name + ' 上传失败') }
}

async function handleSingleUpload(opt: any) {
  try {
    const url = await doUpload(opt.file)
    emit('update:modelValue', url)
    ElMessage.success('上传成功')
  } catch { ElMessage.error('上传失败') }
}

function removeItem(index: number) {
  const list = [...localList.value]
  list.splice(index, 1)
  emit('update:modelValue', list.length > 0 ? list : [])
}

function removeSingle() { emit('update:modelValue', '') }
</script>

<style lang="scss" scoped>
.image-uploader { width: 100%; }
.image-list { display: flex; flex-wrap: wrap; gap: 8px; }
.image-item { display: inline-block; cursor: default; }

.image-preview-box {
  position: relative;
  display: inline-block;
  width: 130px; height: 130px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}
.image-preview { width: 130px; height: 130px; }
.image-arrows {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  pointer-events: none;
}
.image-arrows > * { pointer-events: auto; }
.image-del {
  position: absolute;
  top: 4px; right: 4px;
}

.image-actions {
  position: absolute;
  top: 4px; right: 4px;
}

.main-badge {
  position: absolute;
  top: 4px; left: 4px;
  background: #FF8833;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.upload-drop { width: 130px; }
.upload-drop :deep(.el-upload) { width: 130px; }
.upload-drop :deep(.el-upload-dragger) {
  width: 130px; height: 130px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 0;
}
.upload-text { font-size: 12px; color: #909399; margin-top: 4px; }
.upload-add :deep(.el-upload-dragger) { border-style: dashed; }
</style>
