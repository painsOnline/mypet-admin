<template>
  <div class="specs-editor">
    <el-table :data="localSpecs" border size="small" style="width: 100%">
      <el-table-column label="名称" min-width="150">
        <template #default="{ row, $index }">
          <el-input v-model="localSpecs[$index].name" placeholder="规格名称" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="类型" width="140">
        <template #default="{ row, $index }">
          <el-select v-model="localSpecs[$index].type" size="small" style="width: 100%">
            <el-option :value="1" label="SKU规格" />
            <el-option :value="2" label="展示属性" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="输入类型" width="150">
        <template #default="{ row, $index }">
          <el-select v-model="localSpecs[$index].inputType" size="small" style="width: 100%">
            <el-option :value="1" label="唯一值(Unique)" />
            <el-option :value="2" label="单选项(Single)" />
            <el-option :value="3" label="多选(Multi)" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="选项值" min-width="300">
        <template #default="{ row, $index }">
          <div class="options-editor">
            <el-tag
              v-for="(opt, oi) in (localSpecs[$index].inputOptions || [])"
              :key="oi"
              closable
              size="small"
              @close="removeOption($index, oi)"
              class="option-tag"
            >
              {{ opt }}
            </el-tag>
            <el-input
              v-if="localSpecs[$index]._inputVisible"
              ref="optionInputRef"
              v-model="localSpecs[$index]._inputValue"
              size="small"
              style="width: 80px"
              @keyup.enter="confirmOption($index)"
              @blur="confirmOption($index)"
            />
            <el-button
              v-else
              size="small"
              @click="showOptionInput($index)"
            >
              + 添加选项
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="排序" width="80">
        <template #default="{ row, $index }">
          <el-input-number v-model="localSpecs[$index].sort" :min="0" size="small" controls-position="right" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row, $index }">
          <el-button type="danger" size="small" @click="removeSpec($index)" :icon="Delete" circle />
        </template>
      </el-table-column>
    </el-table>
    <el-button type="primary" link style="margin-top: 8px" @click="addSpec">
      <el-icon><Plus /></el-icon>
      添加规格
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  specs: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:specs'])

const localSpecs = reactive([])
const optionInputRef = ref(null)

function deepCopy(val) {
  return JSON.parse(JSON.stringify(val || []))
}

watch(
  () => props.specs,
  (val) => {
    localSpecs.splice(0, localSpecs.length, ...deepCopy(val).map((s) => ({
      ...s,
      _inputVisible: false,
      _inputValue: '',
      inputOptions: Array.isArray(s.inputOptions) ? [...s.inputOptions] : [],
    })))
  },
  { immediate: true, deep: true }
)

watch(
  localSpecs,
  () => {
    const cleaned = localSpecs.map(({ _inputVisible, _inputValue, ...rest }) => ({
      ...rest,
      inputOptions: Array.isArray(rest.inputOptions) ? [...rest.inputOptions] : [],
    }))
    emit('update:specs', cleaned)
  },
  { deep: true }
)

function addSpec() {
  localSpecs.push({
    name: '',
    type: 1,
    inputType: 1,
    inputOptions: [],
    sort: localSpecs.length,
    _inputVisible: false,
    _inputValue: '',
  })
}

function removeSpec(index) {
  localSpecs.splice(index, 1)
}

function showOptionInput(index) {
  localSpecs[index]._inputVisible = true
  localSpecs[index]._inputValue = ''
  nextTick(() => {
    if (optionInputRef.value) {
      const el = Array.isArray(optionInputRef.value) ? optionInputRef.value[0] : optionInputRef.value
      el?.focus?.()
    }
  })
}

function confirmOption(index) {
  const val = localSpecs[index]._inputValue
  if (val && val.trim()) {
    if (!Array.isArray(localSpecs[index].inputOptions)) {
      localSpecs[index].inputOptions = []
    }
    localSpecs[index].inputOptions.push(val.trim())
  }
  localSpecs[index]._inputVisible = false
  localSpecs[index]._inputValue = ''
}

function removeOption(specIndex, optIndex) {
  localSpecs[specIndex].inputOptions.splice(optIndex, 1)
}
</script>

<style lang="scss" scoped>
.specs-editor {
  width: 100%;
}

.options-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.option-tag {
  margin: 0;
}
</style>
