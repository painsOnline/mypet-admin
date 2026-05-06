<template>
  <div class="type-list">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="handleOpenAddType">
          <el-icon><Plus /></el-icon>
          添加类型
        </el-button>
      </div>

      <el-table :data="tableData" border v-loading="loading" style="width: 100%" row-key="id">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <div class="expand-toolbar">
                <span class="expand-title">规格列表</span>
                <el-button type="primary" size="small" @click="handleOpenAddSpec(row)">
                  <el-icon><Plus /></el-icon>
                  添加规格
                </el-button>
              </div>
              <el-table :data="row.specs || []" border size="small" style="width: 100%">
                <el-table-column prop="name" label="规格名称" min-width="150" />
                <el-table-column label="类型" width="120">
                  <template #default="{ row: spec }">
                    <el-tag :type="spec.type === 1 ? 'primary' : 'success'" size="small">
                      {{ spec.type === 1 ? 'SKU规格' : '展示属性' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="输入类型" width="130">
                  <template #default="{ row: spec }">
                    <span>{{ inputTypeLabel(spec.inputType) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="选项值" min-width="200">
                  <template #default="{ row: spec }">
                    <el-tag
                      v-for="(opt, idx) in (spec.inputOptions || [])"
                      :key="idx"
                      size="small"
                      style="margin-right: 4px; margin-bottom: 2px"
                    >
                      {{ opt }}
                    </el-tag>
                    <span v-if="!spec.inputOptions || spec.inputOptions.length === 0" style="color: #c0c4cc">暂无选项</span>
                  </template>
                </el-table-column>
                <el-table-column prop="sort" label="排序" width="80" />
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row: spec }">
                    <el-button type="primary" size="small" @click="handleOpenEditSpec(spec, row)">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                    <el-popconfirm v-if="!isOnlySkuSpec(row, spec)" title="确定删除该规格？" @confirm="handleDeleteSpec(spec)">
                      <template #reference>
                        <el-button type="danger" size="small">
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-button>
                      </template>
                    </el-popconfirm>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="类型名称" min-width="200" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="商品数量" width="100" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="goToProductsByType(row)">{{ row.productCount }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleOpenEditType(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除该类型吗？如果类型下有商品将无法删除。"
              @confirm="handleDeleteType(row)"
            >
              <template #reference>
                <el-button type="danger" size="small">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Type Dialog -->
    <el-dialog
      v-model="typeDialogVisible"
      :title="typeIsEdit ? '编辑类型' : '添加类型'"
      width="500px"
      @close="resetTypeForm"
    >
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="100px">
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="typeForm.name" placeholder="请输入类型名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="typeForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="typeSubmitLoading" @click="handleTypeSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Spec Dialog -->
    <el-dialog
      v-model="specDialogVisible"
      :title="specIsEdit ? '编辑规格' : '添加规格'"
      width="600px"
      @close="resetSpecForm"
    >
      <el-form ref="specFormRef" :model="specForm" :rules="specRules" label-width="100px">
        <el-form-item label="规格名称" prop="name">
          <el-input v-model="specForm.name" placeholder="请输入规格名称" />
        </el-form-item>
        <el-form-item label="规格类型" prop="type">
          <el-select v-model="specForm.type" style="width: 100%" :disabled="specTypeDisabled">
            <el-option :value="1" label="SKU规格" />
            <el-option :value="2" label="展示属性" />
          </el-select>
        </el-form-item>
        <el-form-item label="输入类型" prop="inputType">
          <el-select v-model="specForm.inputType" style="width: 100%">
            <el-option :value="1" label="唯一值(Unique)" />
            <el-option :value="2" label="单选项(Single)" />
            <el-option :value="3" label="多选(Multi)" />
          </el-select>
        </el-form-item>
        <el-form-item label="选项值">
          <!-- 唯一值: single text input -->
          <div v-if="specForm.inputType === 1" class="spec-options-editor">
            <el-input v-model="specForm._newOption" placeholder="请输入默认值" size="small" style="width:200px"
              @input="specForm.inputOptions = specForm._newOption ? [specForm._newOption] : []" />
          </div>
          <!-- 单选/多选: tag-based multi-value editor -->
          <div v-else class="spec-options-editor">
            <el-tag
              v-for="(opt, idx) in specForm.inputOptions"
              :key="idx"
              closable
              @close="removeSpecOption(idx)"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ opt }}
            </el-tag>
            <div style="display: flex; gap: 4px">
              <el-input
                v-model="specForm._newOption"
                placeholder="输入选项后按添加"
                size="small"
                style="width: 160px"
                @keyup.enter="addSpecOption"
              />
              <el-button size="small" @click="addSpecOption">添加</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="specForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="specDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="specSubmitLoading" @click="handleSpecSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTypes, createType, updateType, deleteType, createSpec, updateSpec, deleteSpec } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])

// ---- Type form ----
const typeDialogVisible = ref(false)
const typeIsEdit = ref(false)
const typeEditId = ref('')
const typeFormRef = ref(null)
const typeSubmitLoading = ref(false)
const typeForm = reactive({ name: '', sort: 0 })
const typeRules = {
  name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
}

function resetTypeForm() {
  Object.assign(typeForm, { name: '', sort: 0 })
  typeIsEdit.value = false
  typeEditId.value = ''
  typeFormRef.value?.resetFields()
}

function handleOpenAddType() {
  typeIsEdit.value = false
  typeDialogVisible.value = true
}

function handleOpenEditType(row) {
  typeIsEdit.value = true
  typeEditId.value = row.id
  Object.assign(typeForm, { name: row.name, sort: row.sort || 0 })
  typeDialogVisible.value = true
}

async function handleTypeSubmit() {
  const valid = await typeFormRef.value.validate().catch(() => false)
  if (!valid) return
  typeSubmitLoading.value = true
  try {
    if (typeIsEdit.value) {
      await updateType(typeEditId.value, { ...typeForm })
      ElMessage.success('更新成功')
    } else {
      await createType({ ...typeForm })
      ElMessage.success('创建成功')
    }
    typeDialogVisible.value = false
    await loadData()
  } catch (e) {
    // handled
  } finally {
    typeSubmitLoading.value = false
  }
}

async function handleDeleteType(row) {
  try {
    await deleteType(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    // handled
  }
}

// ---- Spec form ----
const specDialogVisible = ref(false)
const specIsEdit = ref(false)
const specEditId = ref('')
const currentTypeId = ref('')
const specFormRef = ref(null)
const specSubmitLoading = ref(false)
const specTypeDisabled = ref(false)
const specForm = reactive({
  name: '',
  type: 1,
  inputType: 1,
  inputOptions: [],
  sort: 0,
  _newOption: '',
})

const specRules = {
  name: [{ required: true, message: '请输入规格名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规格类型', trigger: 'change' }],
  inputType: [{ required: true, message: '请选择输入类型', trigger: 'change' }],
}

function resetSpecForm() {
  Object.assign(specForm, { name: '', type: 1, inputType: 1, inputOptions: [], sort: 0, _newOption: '' })
  specIsEdit.value = false
  specEditId.value = ''
  currentTypeId.value = ''
  specTypeDisabled.value = false
  specFormRef.value?.resetFields()
}

function addSpecOption() {
  const val = specForm._newOption?.trim()
  if (!val) return
  specForm.inputOptions.push(val)
  specForm._newOption = ''
}

function removeSpecOption(index) {
  if (specForm.inputOptions.length <= 1) {
    ElMessage.warning('规格值至少需要一个')
    return
  }
  specForm.inputOptions.splice(index, 1)
}

function handleOpenAddSpec(typeRow) {
  specIsEdit.value = false
  currentTypeId.value = typeRow.id
  specForm.sort = (typeRow.specs || []).length
  specDialogVisible.value = true
}

function handleOpenEditSpec(spec, typeRow) {
  specIsEdit.value = true
  specEditId.value = spec.id
  specTypeDisabled.value = spec.type === 1 && (typeRow.specs || []).filter((s: any) => s.type === 1).length <= 1
  const options = Array.isArray(spec.inputOptions) ? [...spec.inputOptions] : []
  Object.assign(specForm, {
    name: spec.name,
    type: spec.type,
    inputType: spec.inputType,
    inputOptions: options,
    sort: spec.sort || 0,
    _newOption: spec.inputType === 1 ? (options[0] || '') : '',
  })
  specDialogVisible.value = true
}

async function handleSpecSubmit() {
  const valid = await specFormRef.value.validate().catch(() => false)
  if (!valid) return
  if (!specForm.inputOptions || specForm.inputOptions.length === 0) {
    ElMessage.warning('规格值至少需要一个')
    return
  }
  specSubmitLoading.value = true
  try {
    const data = {
      name: specForm.name,
      type: specForm.type,
      inputType: specForm.inputType,
      inputOptions: specForm.inputOptions,
      sort: specForm.sort,
      productType: currentTypeId.value,
    }
    if (specIsEdit.value) {
      await updateSpec(specEditId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createSpec(data)
      ElMessage.success('创建成功')
    }
    specDialogVisible.value = false
    await loadData()
  } catch (e) {
    // handled
  } finally {
    specSubmitLoading.value = false
  }
}

async function handleDeleteSpec(spec) {
  try {
    await deleteSpec(spec.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    // handled
  }
}

function inputTypeLabel(val) {
  const map = { 1: '唯一值', 2: '单选项', 3: '多选' }
  return map[val] || '-'
}

function isOnlySkuSpec(typeRow, spec) {
  if (spec.type !== 1) return false
  const skuSpecs = (typeRow.specs || []).filter((s: any) => s.type === 1)
  return skuSpecs.length <= 1
}

async function loadData() {
  loading.value = true
  try {
    const data = await getTypes()
    tableData.value = data || []
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

function goToProductsByType(row) {
  router.push({ path: '/product', query: { typeId: row.id } })
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.type-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.toolbar {
  margin-bottom: 16px;
}

.expand-content {
  padding: 12px 24px;
  background: #fafafa;
}

.expand-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.expand-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.spec-options-editor {
  width: 100%;
}
</style>
