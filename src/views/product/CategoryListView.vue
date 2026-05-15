<template>
  <div class="category-list">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="handleOpenAdd">
          <el-icon><Plus /></el-icon>
          添加分类
        </el-button>
      </div>

      <el-table ref="tableRef" :data="tableData" border v-loading="loading" style="width: 100%" row-key="id">
        <el-table-column label="" width="50">
          <template #default>
            <el-icon class="drag-handle" style="cursor:grab"><Rank /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="分类图片" width="100">
          <template #default="{ row }">
            <el-image v-if="row.picture" :src="row.picture" fit="cover" style="width:60px;height:60px;border-radius:4px" :preview-src-list="[row.picture]" preview-teleported />
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="分类名称" min-width="180" sortable="custom" />
        <el-table-column prop="sort" label="排序" width="80" sortable="custom" />
        <el-table-column label="商品数量" width="100" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="goToProductsByCategory(row)">{{ row.productCount }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleOpenEdit(row)"><el-icon><Edit /></el-icon>编辑</el-button>
            <el-popconfirm title="确定要删除该分类吗？如果分类下有商品将无法删除。" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" size="small"><el-icon><Delete /></el-icon></el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '添加分类'" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类图片" prop="picture">
          <ImageUploader v-model="form.picture" category="category" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width: 120px" />
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Rank } from '@element-plus/icons-vue'
import ImageUploader from '@/components/ImageUploader.vue'
import Sortable from 'sortablejs'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const tableRef = ref(null)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref(null)

const form = reactive({ name: '', picture: '', sort: 0 })
const rules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }

function resetForm() {
  Object.assign(form, { name: '', picture: '', sort: 0 })
  isEdit.value = false
  editId.value = ''
  formRef.value?.resetFields()
}

async function loadData() {
  loading.value = true
  try {
    const data = await getCategories()
    tableData.value = data || []
    await nextTick()
    initSortable()
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

function initSortable() {
  const el = tableRef.value?.$el?.querySelector('.el-table__body-wrapper tbody')
  if (!el) return
  Sortable.create(el, {
    handle: '.drag-handle',
    animation: 200,
    onEnd: async (evt) => {
      const { oldIndex, newIndex } = evt
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
      const arr = [...tableData.value]
      const moved = arr.splice(oldIndex, 1)[0]
      arr.splice(newIndex, 0, moved)
      tableData.value = arr
      // Auto-save sort order to DB
      try {
        for (let i = 0; i < arr.length; i++) {
          const cat = arr[i]
          await updateCategory(cat.id, { name: cat.name, picture: cat.picture || '', sort: i })
        }
      } catch (e) {
        // reload on failure
        await loadData()
      }
    },
  })
}

function handleOpenAdd() { isEdit.value = false; dialogVisible.value = true }
function handleOpenEdit(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, { name: row.name, picture: row.picture || '', sort: row.sort || 0 })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data = { ...form }
    if (isEdit.value) {
      await updateCategory(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createCategory(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (e) {
    // handled
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    // handled
  }
}

function goToProductsByCategory(row) {
  router.push({ path: '/product', query: { categoryId: row.id } })
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.category-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}
.toolbar { margin-bottom: 16px; }
</style>
