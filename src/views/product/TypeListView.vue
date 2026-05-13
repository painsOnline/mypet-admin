<template>
  <div class="type-list">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="handleOpenAddType">
          <el-icon><Plus /></el-icon>
          添加类型
        </el-button>
      </div>

      <el-table :data="tableData" border v-loading="loading" style="width: 100%" row-key="id" @expand-change="onExpandChange">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <!-- SKU列表 -->
              <div class="spec-section">
                <div class="spec-section-header">
                  <span class="expand-title">SKU列表</span>
                  <el-button type="primary" size="small" @click="handleOpenAddSku(row)">
                    <el-icon><Plus /></el-icon>新增SKU
                  </el-button>
                </div>
                <el-table :data="getSkuSpecs(row)" border size="small" style="width:100%" row-key="id" :class="`sku-table-${row.id}`">
                  <el-table-column label="" width="50">
                    <template #default><el-icon class="drag-handle" style="cursor:grab"><Rank /></el-icon></template>
                  </el-table-column>
                  <el-table-column prop="name" label="SKU名称" min-width="140" />
                  <el-table-column label="输入类型" width="120">
                    <template #default="{ row: spec }">{{ inputTypeLabel(spec.inputType) }}</template>
                  </el-table-column>
                  <el-table-column label="选项值" min-width="200">
                    <template #default="{ row: spec }">
                      <el-tag v-for="(opt,i) in (spec.inputOptions||[])" :key="i" size="small" style="margin:2px">{{ opt }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="sort" label="排序" width="70" />
                  <el-table-column label="操作" width="140" fixed="right">
                    <template #default="{ row: spec }">
                      <el-button type="primary" size="small" @click="handleOpenEditSpec(spec,row)"><el-icon><Edit /></el-icon>编辑</el-button>
                      <el-popconfirm v-if="canDeleteSkuSpec(row,spec)" title="确定删除？" @confirm="handleDeleteSpec(spec)">
                        <template #reference>
                          <el-button type="danger" size="small"><el-icon><Delete /></el-icon>删除</el-button>
                        </template>
                      </el-popconfirm>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 属性列表 -->
              <div class="spec-section" style="margin-top:16px">
                <div class="spec-section-header">
                  <span class="expand-title">属性列表</span>
                  <el-dropdown @command="(cmd:string)=>handleAddProperty(cmd,row)">
                    <el-button type="success" size="small">
                      <el-icon><Plus /></el-icon>添加属性<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="shared">引用共享属性</el-dropdown-item>
                        <el-dropdown-item command="private">添加私有属性</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <el-table :data="getDisplaySpecs(row)" border size="small" style="width:100%" row-key="id" :class="`prop-table-${row.id}`">
                  <el-table-column label="" width="50">
                    <template #default><el-icon class="drag-handle" style="cursor:grab"><Rank /></el-icon></template>
                  </el-table-column>
                  <el-table-column prop="name" label="属性名称" min-width="140" />
                  <el-table-column label="输入类型" width="120">
                    <template #default="{ row: spec }">{{ inputTypeLabel(spec.inputType) }}</template>
                  </el-table-column>
                  <el-table-column label="属性值" min-width="180">
                    <template #default="{ row: spec }">
                      <el-tag v-for="(opt,i) in (spec.inputOptions||[])" :key="i" size="small" style="margin:2px">{{ opt }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="作用域" width="80">
                    <template #default="{ row: spec }">
                      <el-tag :type="spec.scope===0?'danger':spec.scope===1?'warning':'info'" size="small">
                        {{ spec.scope===0?'全局':spec.scope===1?'共享':'私有' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="sort" label="排序" width="70" />
                  <el-table-column label="操作" width="140" fixed="right">
                    <template #default="{ row: spec }">
                      <el-button type="primary" size="small" @click="handleOpenEditSpec(spec,row)"><el-icon><Edit /></el-icon>编辑</el-button>
                      <el-popconfirm v-if="canDeletePropSpec(row,spec)" title="确定删除？" @confirm="handleDeleteSpec(spec)">
                        <template #reference>
                          <el-button type="danger" size="small"><el-icon><Delete /></el-icon>删除</el-button>
                        </template>
                      </el-popconfirm>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
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
          <el-input-number v-model="typeForm.sort" :min="0" style="width: 130px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="typeSubmitLoading" @click="handleTypeSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Shared Spec Reference Dialog -->
    <el-dialog v-model="sharedSpecDialogVisible" title="引用共享属性" width="550px">
      <el-table :data="sharedSpecList" size="small" highlight-current-row @current-change="(r:any)=>{if(r)sharedSpecSelectedId=r.id}">
        <el-table-column label="选择" width="55">
          <template #default="{row}"><el-radio v-model="sharedSpecSelectedId" :value="row.id"/></template>
        </el-table-column>
        <el-table-column label="属性名称" min-width="150">
          <template #default="{row}">
            <div>{{ row.name }}</div>
            <div v-if="row.desc" style="color:#909399;font-size:12px">（{{ row.desc }}）</div>
          </template>
        </el-table-column>
        <el-table-column label="输入类型" width="100">
          <template #default="{row}">{{ inputTypeLabel(row.inputType) }}</template>
        </el-table-column>
        <el-table-column label="选项值" min-width="150">
          <template #default="{row}">
            <el-tag v-for="(o,i) in (row.inputOptions||[])" :key="i" size="small" style="margin:2px">{{o}}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="sharedSpecDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmSharedSpec">确认引用</el-button>
      </template>
    </el-dialog>

    <!-- Spec Dialog -->
    <el-dialog
      v-model="specDialogVisible"
      :title="specDialogTitle"
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
          <div v-if="specForm.inputType === 1" class="spec-options-editor">
            <el-input v-model="specForm._newOption" placeholder="请输入默认值" size="small" style="width:200px"
              @input="specForm.inputOptions = specForm._newOption ? [specForm._newOption] : []" />
          </div>
          <div v-else class="spec-options-editor">
            <el-tag
              v-for="(opt, idx) in specForm.inputOptions"
              :key="idx"
              :closable="!isOptionUsed(opt)"
              @close="removeSpecOption(idx)"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ opt }}
            </el-tag>
            <el-input
              v-model="specForm._batchOptions"
              type="textarea"
              :rows="4"
              placeholder="每行一个值，或用中英文逗号分隔多个值"
              style="width:100%"
              @blur="parseBatchOptions"
            />
            <div class="form-hint">每行一个值，或用逗号分隔批量添加（支持中英文逗号）</div>
          </div>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="specForm.sort" :min="0" style="width: 130px" />
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getTypes, createType, updateType, deleteType, createSpec, updateSpec, deleteSpec, getSpecsByScope, linkSpecToType } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Rank, ArrowDown } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'

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
const specDialogMode = ref<'sku'|'prop'>('sku') // tracks SKU vs property mode

const specDialogTitle = computed(() => {
  if (specIsEdit.value) return specDialogMode.value === 'sku' ? '编辑SKU' : '编辑属性'
  return specDialogMode.value === 'sku' ? '添加SKU' : '添加私有属性'
})

const specForm = reactive({
  name: '',
  type: 1,
  inputType: 1,
  inputOptions: [] as string[],
  sort: 0,
  _newOption: '',
  _batchOptions: '',
  _usedOptions: [] as string[],
})

const specRules = {
  name: [{ required: true, message: '请输入规格名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规格类型', trigger: 'change' }],
  inputType: [{ required: true, message: '请选择输入类型', trigger: 'change' }],
}

function resetSpecForm() {
  Object.assign(specForm, { name: '', type: 1, inputType: 1, inputOptions: [], sort: 0, _newOption: '', _batchOptions: '', _usedOptions: [] })
  specIsEdit.value = false; specEditId.value = ''; currentTypeId.value = ''
  specTypeDisabled.value = false; specDialogMode.value = 'sku'
  specFormRef.value?.resetFields()
}

// SKU dialog helpers
function handleOpenAddSku(typeRow: any) {
  specIsEdit.value = false; specDialogMode.value = 'sku'
  currentTypeId.value = typeRow.id
  specTypeDisabled.value = true // type locked to SKU
  specForm.type = 1; specForm.inputType = 1; specForm.inputOptions = []
  specForm._newOption = ''; specForm.sort = getSkuSpecs(typeRow).length
  specDialogVisible.value = true
}

// Property add: shared or private
function handleOpenAddProp(typeRow: any) {
  specIsEdit.value = false; specDialogMode.value = 'prop'
  currentTypeId.value = typeRow.id
  specTypeDisabled.value = true // type locked to display
  specForm.type = 2; specForm.inputType = 1; specForm.inputOptions = []
  specForm._newOption = ''; specForm.sort = getDisplaySpecs(typeRow).length
  specDialogVisible.value = true
}

function handleOpenEditSpec(spec: any, typeRow: any) {
  specIsEdit.value = true; specEditId.value = spec.id
  specDialogMode.value = spec.type === 1 ? 'sku' : 'prop'
  specTypeDisabled.value = true // always disabled in edit to prevent type change
  const options = Array.isArray(spec.inputOptions) ? [...spec.inputOptions] : []
  Object.assign(specForm, {
    name: spec.name, type: spec.type, inputType: spec.inputType,
    inputOptions: options, sort: spec.sort || 0,
    _newOption: spec.inputType === 1 ? (options[0] || '') : '',
    _batchOptions: spec.inputType !== 1 ? (options||[]).join('\n') : '',
    _usedOptions: spec.usedOptions || [],
  })
  specDialogVisible.value = true
}

function parseBatchOptions() {
  const raw = specForm._batchOptions?.trim()
  if (!raw) return
  // Split by newlines and commas (both Chinese and English)
  const vals = raw.split(/[\n,，]+/).map((v: string) => v.trim()).filter((v: string) => v)
  vals.forEach((v: string) => { if (!specForm.inputOptions.includes(v)) specForm.inputOptions.push(v) })
}

function addSpecOption() {
  const raw = specForm._newOption?.trim()
  if (!raw) return
  const vals = raw.split(/[,，]/).map((v: string) => v.trim()).filter((v: string) => v)
  vals.forEach((v: string) => { if (!specForm.inputOptions.includes(v)) specForm.inputOptions.push(v) })
  specForm._newOption = ''
}

function removeSpecOption(index: number) {
  if (specForm.inputOptions.length <= 1) { ElMessage.warning('规格值至少需要一个'); return }
  if (isOptionUsed(specForm.inputOptions[index])) { ElMessage.warning('该规格值已被商品SKU使用，无法删除'); return }
  specForm.inputOptions.splice(index, 1)
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

function inputTypeLabel(val) { const m: any={1:'唯一值',2:'单选项',3:'多选'}; return m[val]||'-' }

// Split specs into SKU (type=1) and display (type=2)
function getSkuSpecs(row: any) { return (row.specs||[]).filter((s:any)=>s.type===1) }
function getDisplaySpecs(row: any) { return (row.specs||[]).filter((s:any)=>s.type===2) }

function isOnlySkuSpec(typeRow: any, spec: any) {
  if (spec.type!==1) return false
  return getSkuSpecs(typeRow).length <= 1
}

function canDeleteSkuSpec(typeRow: any, spec: any) {
  if (isOnlySkuSpec(typeRow, spec)) return false
  if (spec.type===1 && typeRow.productCount>0) return false
  return true
}

function canDeletePropSpec(_typeRow: any, spec: any) {
  // Global specs can't be deleted from type page (they're shared)
  if (spec.scope===0) return false
  return true
}

// SKU dialog helpers
// Property add: shared or private
const sharedSpecDialogVisible = ref(false)
const sharedSpecList = ref<any[]>([])
const sharedSpecSelectedId = ref('')

async function handleAddProperty(cmd: string, typeRow: any) {
  if (cmd === 'private') {
    handleOpenAddProp(typeRow)
  } else {
    // 引用共享属性
    currentTypeId.value = typeRow.id
    sharedSpecSelectedId.value = ''
    try { sharedSpecList.value = await getSpecsByScope(1) || [] }
    catch { sharedSpecList.value = [] }
    sharedSpecDialogVisible.value = true
  }
}

async function confirmSharedSpec() {
  if (!sharedSpecSelectedId.value) { ElMessage.warning('请选择一个共享属性'); return }
  try {
    await linkSpecToType({ typeId: currentTypeId.value, specsId: sharedSpecSelectedId.value })
    ElMessage.success('已引用共享属性')
    sharedSpecDialogVisible.value = false
    await loadData()
  } catch { /* handled */ }
}

function isOptionUsed(value: string) {
  return specForm._usedOptions.includes(value)
}

const specSortables = new Map<string, any[]>()

function onExpandChange(row: any, expandedRows: any[]) {
  if (!expandedRows.includes(row)) {
    const arr = specSortables.get(row.id)
    if (arr) { arr.forEach(s=>s.destroy()); specSortables.delete(row.id) }
    return
  }
  nextTick(() => {
    const sortables: any[] = []
    // SKU table
    const skuEl = document.querySelector(`.sku-table-${row.id} .el-table__body-wrapper tbody`)
    if (skuEl) {
      sortables.push(Sortable.create(skuEl as HTMLElement, {
        handle: '.drag-handle', animation: 200,
        onEnd: (evt:any) => reorderSpecs(row, getSkuSpecs(row), evt),
      }))
    }
    // Property table
    const propEl = document.querySelector(`.prop-table-${row.id} .el-table__body-wrapper tbody`)
    if (propEl) {
      sortables.push(Sortable.create(propEl as HTMLElement, {
        handle: '.drag-handle', animation: 200,
        onEnd: (evt:any) => reorderSpecs(row, getDisplaySpecs(row), evt),
      }))
    }
    if (sortables.length) specSortables.set(row.id, sortables)
  })
}

async function reorderSpecs(row: any, section: any[], evt: any) {
  const { oldIndex, newIndex } = evt
  if (oldIndex===undefined||newIndex===undefined||oldIndex===newIndex) return
  const moved = section.splice(oldIndex, 1)[0]
  section.splice(newIndex, 0, moved)
  for (let i=0; i<section.length; i++) {
    if (section[i].sort !== i) {
      section[i].sort = i
      await updateSpec(section[i].id, { ...section[i], productType: row.id, sort: i })
    }
  }
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

.spec-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-right: 4px;
}

.expand-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.spec-section .el-button + .el-button { margin-left: 2px; }

.spec-options-editor {
  width: 100%;
}
</style>
