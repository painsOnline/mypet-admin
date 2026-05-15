<template>
  <div class="product-list">
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="条形码">
          <el-input v-model="searchForm.barcode" placeholder="支持后N位模糊搜索" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="请选择分类" clearable style="width: 160px">
            <el-option
              v-for="c in categories"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.typeId" placeholder="请选择类型" clearable style="width: 160px">
            <el-option
              v-for="t in types"
              :key="t.id"
              :label="t.name"
              :value="t.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-select v-model="searchForm.brandId" placeholder="请选择品牌" clearable style="width: 160px">
            <el-option v-for="b in brandList" :key="b.id" :label="b.brandName" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input-number v-model="searchForm.minPrice" :min="0" :precision="2" placeholder="最低价" style="width: 120px" />
          <span style="margin: 0 4px">-</span>
          <el-input-number v-model="searchForm.maxPrice" :min="0" :precision="2" placeholder="最高价" style="width: 120px" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="热门">
          <el-switch v-model="searchForm.isHot" />
        </el-form-item>
        <el-form-item label="是否上架">
          <el-select v-model="searchForm.isEnable" placeholder="不限" clearable style="width:120px">
            <el-option :value="1" label="上架" />
            <el-option :value="2" label="下架" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增商品
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="tableData" border v-loading="loading" style="width: 100%" @sort-change="handleSortChange">
        <el-table-column label="主图" width="80">
          <template #default="{ row }">
            <el-image v-if="row.picture" :src="row.picture" fit="cover" style="width:50px;height:50px;border-radius:4px" preview-teleported :preview-src-list="[row.picture]" />
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="180" show-overflow-tooltip sortable="custom" />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column label="是否上架" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.isEnable === 1"
              @change="(val) => handleToggleEnable(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100" sortable="custom" />
        <el-table-column label="热门" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isHot" type="danger" size="small">热门</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" sortable="custom" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              :type="row.isHot ? 'warning' : 'success'"
              size="small"
              @click="handleToggleHot(row)"
            >
              <el-icon><Star /></el-icon>
              {{ row.isHot ? '取消热门' : '设为热门' }}
            </el-button>
            <el-popconfirm
              title="确定要删除该商品吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
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

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[6, 12, 20, 50]"
          :total="pagination.counts"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts, getCategories, getTypes, getBrands, toggleHotProduct, toggleProductEnable, deleteProduct } from '@/api'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight, Plus, Edit, Star, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)

const searchForm = reactive({
  name: '',
  categoryId: '',
  typeId: '',
  brandId: '',
  barcode: '',
  minPrice: undefined,
  maxPrice: undefined,
  dateRange: [],
  isHot: false,
  isEnable: undefined,
})

const sortState = reactive({ sortBy: '', sortOrder: '' })

const pagination = reactive({
  page: 1,
  pageSize: 12,
  counts: 0,
  pages: 0,
})

const tableData = ref([])
const categories = ref([])
const types = ref([])
const brandList = ref([])

function getCategoryName(id) {
  const found = categories.value.find((c) => c.id === id)
  return found ? found.name : '-'
}

function getTypeName(id) {
  const found = types.value.find((t) => t.id === id)
  return found ? found.name : '-'
}

function buildSearchParams() {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize,
  }
  if (searchForm.name) params.name = searchForm.name
  if (searchForm.categoryId) params.categoryIds = [searchForm.categoryId]
  if (searchForm.typeId) params.typeIds = [searchForm.typeId]
  if (searchForm.brandId) params.brandId = searchForm.brandId
  if (searchForm.barcode) params.barcode = searchForm.barcode
  if (searchForm.minPrice !== undefined && searchForm.minPrice !== null) params.minPrice = searchForm.minPrice
  if (searchForm.maxPrice !== undefined && searchForm.maxPrice !== null) params.maxPrice = searchForm.maxPrice
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    params.startDate = searchForm.dateRange[0]
    params.endDate = searchForm.dateRange[1]
  }
  if (searchForm.isHot) params.isHot = true
  if (searchForm.isEnable !== undefined && searchForm.isEnable !== null) params.isEnable = searchForm.isEnable
  if (sortState.sortBy) params.sortBy = sortState.sortBy
  if (sortState.sortOrder) params.sortOrder = sortState.sortOrder
  return params
}

async function loadTable() {
  loading.value = true
  try {
    const data = await getProducts(buildSearchParams())
    if (data) {
      tableData.value = data.items || []
      pagination.counts = data.counts || 0
      pagination.pages = data.pages || 0
      pagination.page = data.page || 1
      pagination.pageSize = data.pageSize || 12
    }
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  pagination.page = 1
  await loadTable()
}

async function handlePageChange() {
  await loadTable()
}

async function handleReset() {
  Object.assign(searchForm, {
    name: '',
    categoryId: '',
    typeId: '',
    minPrice: undefined,
    maxPrice: undefined,
    dateRange: [],
    isHot: false,
    isEnable: undefined,
  })
  sortState.sortBy = ''
  sortState.sortOrder = ''
  pagination.page = 1
  await loadTable()
}

function handleAdd() {
  router.push('/product/new')
}

function handleEdit(row) {
  router.push(`/product/${row.id}`)
}

async function handleToggleHot(row) {
  try {
    await toggleHotProduct(row.id)
    ElMessage.success(row.isHot ? '已取消热门' : '已设为热门')
    row.isHot = !row.isHot
  } catch (e) {
    // handled
  }
}

async function handleToggleEnable(row, val) {
  try {
    await toggleProductEnable(row.id)
    row.isEnable = val ? 1 : 2
    ElMessage.success(val ? '已上架' : '已下架')
  } catch (e) {
    // handled
  }
}

async function handleDelete(row) {
  try {
    await deleteProduct(row.id)
    ElMessage.success('删除成功')
    await loadTable()
  } catch (e) {
    // handled
  }
}

function handleSortChange({ prop, order }) {
  if (!order) {
    sortState.sortBy = ''
    sortState.sortOrder = ''
  } else {
    sortState.sortBy = prop
    sortState.sortOrder = order === 'ascending' ? 'asc' : 'desc'
  }
  handleSearch()
}

onMounted(async () => {
  // Apply query params from router (if navigated from category/type page)
  if (router.currentRoute.value.query.categoryId) {
    searchForm.categoryId = router.currentRoute.value.query.categoryId
  }
  if (router.currentRoute.value.query.typeId) {
    searchForm.typeId = router.currentRoute.value.query.typeId
  }
  try {
    const [catData, typeData] = await Promise.all([getCategories(), getTypes()])
    categories.value = catData || []
    types.value = typeData || []
    const brandData = await getBrands()
    brandList.value = brandData || []
  } catch (e) {
    // handled
  }
  await loadTable()
})
</script>

<style lang="scss" scoped>
.product-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.search-card {
  margin-bottom: 0;
}

.table-card {
  flex: 1;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
