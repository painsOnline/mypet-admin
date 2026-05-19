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
            <template v-for="(opt, oi) in (localSpecs[$index].inputOptions || [])" :key="oi">
              <span v-if="editingSpec === $index && editingOpt === oi" class="value-edit-wrapper">
                <el-input v-model="editingValue" size="small" style="width: 100px"
                  @keyup.enter="saveEditOption($index, oi)"
                  @keyup.escape="cancelEditOption()"
                  @blur="saveEditOption($index, oi)" />
                <el-button size="small" @click="saveEditOption($index, oi)"><el-icon><Check /></el-icon></el-button>
                <el-button size="small" @click="cancelEditOption()"><el-icon><Close /></el-icon></el-button>
              </span>
              <el-tag v-else @dblclick="startEditOption($index, oi)" closable
                @close="removeOption($index, oi)" size="small" class="option-tag"
                style="cursor:pointer" :title="'双击编辑'">{{ opt }}</el-tag>
            </template>
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
import { Delete, Plus, Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { renameSpecValue } from '@/api'

const props = defineProps({
  specs: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:specs'])

const localSpecs = reactive([])
const optionInputRef = ref(null)
const editingSpec = ref(-1)
const editingOpt = ref(-1)
const editingValue = ref('')

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

function startEditOption(si: number, oi: number) {
  editingSpec.value = si
  editingOpt.value = oi
  editingValue.value = localSpecs[si].inputOptions[oi] || ''
  nextTick(() => {
    const el = document.querySelector('.value-edit-wrapper .el-input__inner') as HTMLInputElement
    if (el) { el.focus(); el.select() }
  })
}

async function saveEditOption(si: number, oi: number) {
  const newName = editingValue.value.trim()
  if (!newName) { cancelEditOption(); return }
  if (newName === localSpecs[si].inputOptions[oi]) { cancelEditOption(); return }
  if (localSpecs[si].inputOptions.some((v: string, i: number) => i !== oi && v === newName)) {
    ElMessage.warning('值名重复')
    return
  }
  // If the value has an ID in valuesList, call rename API
  const vList = (localSpecs[si] as any).valuesList
  if (vList && vList.length > oi && vList[oi]?.id) {
    try { await renameSpecValue(vList[oi].id, newName) } catch { return }
    vList[oi].valueName = newName
  }
  localSpecs[si].inputOptions[oi] = newName
  cancelEditOption()
}

function cancelEditOption() {
  editingSpec.value = -1
  editingOpt.value = -1
  editingValue.value = ''
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
