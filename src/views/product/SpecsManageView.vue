<template>
  <div class="specs-manage">
    <el-card>
      <div class="toolbar">
        <el-dropdown @command="handleAddSpec">
          <el-button type="primary">
            <el-icon><Plus /></el-icon> 新增属性<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="global">新增全局属性</el-dropdown-item>
              <el-dropdown-item command="shared">新增共享属性</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span class="toolbar-hint">全局属性对所有商品类型生效；共享属性可被商品类型引用</span>
      </div>

      <el-table :data="tableData" border v-loading="loading" style="width:100%" row-key="id" class="specs-table">
        <el-table-column label="" width="50">
          <template #default><el-icon class="drag-handle" style="cursor:grab"><Rank /></el-icon></template>
        </el-table-column>
        <el-table-column label="属性名称" min-width="150">
          <template #default="{ row }">
            <div>{{ row.name }}</div>
            <div v-if="row.desc" style="color:#909399;font-size:12px">（{{ row.desc }}）</div>
          </template>
        </el-table-column>
        <el-table-column label="属性值" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="(opt, idx) in (row.inputOptions || [])" :key="idx" size="small" style="margin:2px">
              {{ opt }}
            </el-tag>
            <span v-if="!row.inputOptions || row.inputOptions.length===0" style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="属性类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type===1?'primary':'success'" size="small">
              {{ row.type===1?'SKU规格':'展示属性' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已关联商品类型" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="t in (row.linkedTypeNames||[])" :key="t" size="small" type="info" style="margin:2px">{{ t }}</el-tag>
            <span v-if="!(row.linkedTypeNames||[]).length" style="color:#c0c4cc">未关联</span>
          </template>
        </el-table-column>
        <el-table-column label="作用域" width="90">
          <template #default="{ row }">
            <el-tag :type="scopeTag(row.scope)" size="small">{{ scopeLabel(row.scope) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)"><el-icon><Edit /></el-icon>修改</el-button>
            <el-popconfirm title="确定删除该属性？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" size="small"><el-icon><Delete /></el-icon>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="650px" @close="resetForm">
      <div style="max-height:60vh;overflow-y:auto;padding-right:8px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="属性名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入属性名称" />
        </el-form-item>
        <el-form-item label="属性类型" prop="type">
          <el-select v-model="form.type" style="width:100%" disabled>
            <el-option :value="2" label="展示属性" />
          </el-select>
        </el-form-item>
        <el-form-item label="输入类型" prop="inputType">
          <el-select v-model="form.inputType" style="width:100%">
            <el-option :value="1" label="唯一值(Unique)" />
            <el-option :value="2" label="单选项(Single)" />
            <el-option :value="3" label="多选(Multi)" />
          </el-select>
        </el-form-item>
        <el-form-item label="选项值" prop="inputOptions">
          <div v-if="form.inputType===1" class="opt-editor">
            <el-input v-model="form._singleVal" placeholder="请输入默认值" style="width:200px"
              @input="syncSingleVal" />
          </div>
          <div v-else class="opt-editor">
            <el-tag v-for="(opt,idx) in form.inputOptions" :key="idx" closable @close="removeOpt(idx)"
              style="margin:2px">{{ opt }}</el-tag>
            <el-input v-model="form._batchOptions" type="textarea" :rows="4"
              placeholder="每行一个值，或用中英文逗号分隔多个值" style="width:100%"
              @blur="parseBatchOptions" />
            <div class="form-hint">每行一个值，或用逗号分隔批量添加（支持中英文逗号）</div>
          </div>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width:130px" />
        </el-form-item>
        <el-form-item label="简介" prop="desc">
          <el-input v-model="form.desc" placeholder="可选" />
        </el-form-item>
      </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { getSpecsByScope, createSpec, updateSpec, deleteSpec } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, ArrowDown, Rank } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'

const loading = ref(false)
const tableData = ref<any[]>([])

// Load specs (global + shared) with linked type names
async function loadData() {
  loading.value = true
  try {
    const [globalSpecs, sharedSpecs] = await Promise.all([
      getSpecsByScope(0),
      getSpecsByScope(1),
    ])
    const all = [...(globalSpecs||[]), ...(sharedSpecs||[])]
    tableData.value = all
    initSortable()
  } catch { /* handled */ }
  finally { loading.value = false }
}

// Dialog
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const currentScope = ref(0)
const formRef = ref(null)
const submitLoading = ref(false)

const form = reactive<any>({
  name: '', type: 2, inputType: 1, inputOptions: [] as string[],
  sort: 0, desc: '', scope: 0, _batchOptions: '', _singleVal: '',
})

const dialogTitle = computed(() => {
  if (isEdit.value) return '修改属性'
  return currentScope.value === 0 ? '新增全局属性' : '新增共享属性'
})

const rules = {
  name: [{ required: true, message: '请输入属性名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择属性类型', trigger: 'change' }],
  inputType: [{ required: true, message: '请选择输入类型', trigger: 'change' }],
}

function resetForm() {
  Object.assign(form, {
    name: '', type: 2, inputType: 1, inputOptions: [], sort: 0, desc: '',
    scope: 0, _batchOptions: '', _singleVal: '',
  })
  isEdit.value = false; editId.value = ''; currentScope.value = 0
  formRef.value?.resetFields()
}

function syncSingleVal() {
  form.inputOptions = form._singleVal ? [form._singleVal] : []
}

function parseBatchOptions() {
  const raw = form._batchOptions?.trim()
  if (!raw) return
  const vals = raw.split(/[\n,，]+/).map((v:string) => v.trim()).filter((v:string) => v)
  vals.forEach((v:string) => { if (!form.inputOptions.includes(v)) form.inputOptions.push(v) })
}

function addOpt() {
  const raw = form._newOpt?.trim()
  if (!raw) return
  const vals = raw.split(/[,，]/).map((v:string) => v.trim()).filter((v:string) => v)
  vals.forEach((v:string) => { if (!form.inputOptions.includes(v)) form.inputOptions.push(v) })
  form._newOpt = ''
}

function removeOpt(idx: number) {
  if (form.inputOptions.length <= 1) { ElMessage.warning('至少需要一个选项值'); return }
  form.inputOptions.splice(idx, 1)
}

function handleAddSpec(cmd: string) {
  isEdit.value = false
  currentScope.value = cmd === 'global' ? 0 : 1
  Object.assign(form, {
    name: '', type: 2, inputType: 1, inputOptions: [], sort: 0, desc: '',
    scope: currentScope.value, _batchOptions: '', _singleVal: '',
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true; editId.value = row.id; currentScope.value = row.scope
  const opts = [...(row.inputOptions||[])]
  Object.assign(form, {
    name: row.name, type: row.type, inputType: row.inputType,
    inputOptions: opts, sort: row.sort||0, desc: row.desc||'', scope: row.scope,
    _batchOptions: row.inputType !== 1 ? opts.join('\n') : '',
    _singleVal: row.inputType===1 ? (opts[0]||'') : '',
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const data: any = {
    name: form.name, type: form.type, inputType: form.inputType,
    inputOptions: form.inputOptions, sort: form.sort, desc: form.desc, scope: form.scope,
  }
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateSpec(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createSpec(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch { /* handled */ }
  finally { submitLoading.value = false }
}

async function handleDelete(row: any) {
  try {
    await deleteSpec(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch { /* handled */ }
}

function scopeTag(v: number) { return v===0?'danger':v===1?'warning':'info' }
function scopeLabel(v: number) { return v===0?'全局':v===1?'共享':'私有' }

let specSortable: any = null

function initSortable() {
  nextTick(() => {
    const el = document.querySelector('.specs-table .el-table__body-wrapper tbody')
    if (!el) return
    if (specSortable) specSortable.destroy()
    specSortable = Sortable.create(el as HTMLElement, {
      handle: '.drag-handle', animation: 200,
      onEnd: async (evt: any) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
        const arr = [...tableData.value]
        const moved = arr.splice(oldIndex, 1)[0]
        arr.splice(newIndex, 0, moved)
        tableData.value = arr
        // Batch update sort order
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].sort !== i) {
            arr[i].sort = i
            await updateSpec(arr[i].id, { ...arr[i], sort: i, type: arr[i].type, inputType: arr[i].inputType, inputOptions: arr[i].inputOptions })
          }
        }
      },
    })
  })
}

onMounted(async () => {
  await loadData()
  initSortable()
})
</script>

<style lang="scss" scoped>
.specs-manage { max-width:1400px; margin:0 auto; }
.toolbar { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.toolbar-hint { color:#909399; font-size:12px; }
.opt-editor { width:100%; }
.form-hint { color:#909399; font-size:12px; margin-top:4px; }
</style>
