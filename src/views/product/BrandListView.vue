<template>
  <div class="brand-list">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="handleOpenAdd"><el-icon><Plus /></el-icon>添加品牌</el-button>
      </div>
      <el-table :data="tableData" border v-loading="loading" style="width:100%">
        <el-table-column label="品牌Logo" width="100">
          <template #default="{ row }">
            <el-image v-if="row.brandLogo" :src="row.brandLogo" fit="cover" style="width:60px;height:60px;border-radius:4px" />
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="brandName" label="品牌名称" min-width="140" />
        <el-table-column prop="brandEn" label="英文名" min-width="120" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleOpenEdit(row)"><el-icon><Edit /></el-icon></el-button>
            <el-popconfirm title="确定删除该品牌？有商品关联则无法删除。" @confirm="handleDelete(row)">
              <template #reference><el-button type="danger" size="small"><el-icon><Delete /></el-icon></el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑品牌' : '添加品牌'" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="品牌名称" prop="brandName">
          <el-input v-model="form.brandName" placeholder="请输入品牌名称" />
        </el-form-item>
        <el-form-item label="英文名称" prop="brandEn">
          <el-input v-model="form.brandEn" placeholder="选填" />
        </el-form-item>
        <el-form-item label="品牌Logo" prop="brandLogo">
          <ImageUploader v-model="form.brandLogo" category="brand" />
        </el-form-item>
        <el-form-item label="品牌简介" prop="brandDesc">
          <el-input v-model="form.brandDesc" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width:120px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import ImageUploader from '@/components/ImageUploader.vue'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref(null)
const form = reactive({ brandName: '', brandEn: '', brandLogo: '', brandDesc: '', sort: 0 })
const rules = { brandName: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }] }

function resetForm() {
  Object.assign(form, { brandName: '', brandEn: '', brandLogo: '', brandDesc: '', sort: 0 })
  isEdit.value = false; editId.value = ''
  formRef.value?.resetFields()
}

async function loadData() {
  loading.value = true
  try { tableData.value = await getBrands() || [] } catch {} finally { loading.value = false }
}

function handleOpenAdd() { isEdit.value = false; dialogVisible.value = true }
function handleOpenEdit(row: any) {
  isEdit.value = true; editId.value = row.id
  Object.assign(form, { brandName: row.brandName, brandEn: row.brandEn || '', brandLogo: row.brandLogo || '', brandDesc: row.brandDesc || '', sort: row.sort || 0 })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) { await updateBrand(editId.value, { ...form }); ElMessage.success('更新成功') }
    else { await createBrand({ ...form }); ElMessage.success('创建成功') }
    dialogVisible.value = false; await loadData()
  } catch {} finally { submitLoading.value = false }
}

async function handleDelete(row: any) {
  try { await deleteBrand(row.id); ElMessage.success('删除成功'); await loadData() } catch {}
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.brand-list { display: flex; flex-direction: column; gap: 16px; max-width: 1400px; margin: 0 auto; }
.toolbar { margin-bottom: 16px; }
</style>
