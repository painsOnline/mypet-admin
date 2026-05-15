<template>
  <div class="rich-editor" v-if="mounted">
    <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" class="editor-toolbar" />
    <Editor
      v-model="content"
      :defaultConfig="editorConfig"
      class="editor-content"
      @onCreated="onCreated"
    />
  </div>
  <div v-else class="rich-editor-placeholder">编辑器加载中...</div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import request from '@/api/request'

const props = defineProps({
  modelValue: { type: String, default: '' },
  productId: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const mounted = ref(false)
onMounted(() => { mounted.value = true })

const content = ref(props.modelValue || '')
const editorRef = shallowRef(null)

const toolbarConfig = {
  excludeKeys: [],
}

const editorConfig = {
  placeholder: '请输入商品详情...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        const formData = new FormData()
        formData.append('file', file)
        try {
          let uploadUrl = '/admin/upload/image'
          const params = new URLSearchParams()
          if (props.productId) {
            params.append('type', 'product/detail')
            params.append('productId', props.productId)
          } else {
            params.append('type', 'temp/products')
          }
          const qs = params.toString()
          if (qs) uploadUrl += '?' + qs
          const url = await request({
            url: uploadUrl,
            method: 'post',
            data: formData,
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          insertFn(url, url, url)
        } catch {
          // upload failed
        }
      },
    },
  },
}

function onCreated(editor) {
  editorRef.value = editor
}

watch(
  () => props.modelValue,
  (val) => {
    if (val !== content.value) {
      content.value = val || ''
    }
  }
)

watch(content, (val) => {
  emit('update:modelValue', val)
})

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})
</script>

<style lang="scss" scoped>
.rich-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
}
.editor-toolbar {
  border-bottom: 1px solid #dcdfe6;
}
.editor-content {
  min-height: 350px;
}
</style>
