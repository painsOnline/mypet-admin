<template>
  <div class="hot-products">
    <el-card>
      <template #header>
        <div class="hot-header">
          <h3>热门商品管理</h3>
          <el-button type="primary" @click="showProductSelector = true">
            <el-icon><Plus /></el-icon>
            添加热门商品
          </el-button>
        </div>
      </template>

      <el-table
        ref="hotTableRef"
        :data="hotProducts"
        border
        style="width: 100%"
        row-key="productId"
      >
        <el-table-column label="排序" width="80" align="center">
          <template #default>
            <el-icon class="drag-handle" style="cursor:grab"><Rank /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="商品略图" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.picture"
              :src="row.picture"
              fit="cover"
              style="width:60px;height:60px;border-radius:4px"
              :preview-src-list="[row.picture]"
              preview-teleported
            />
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="商品名称" prop="productName" min-width="200" />
        <el-table-column label="商品价格" width="180" align="center">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;justify-content:center;gap:8px">
              <span style="color:#f56c6c;font-weight:600">¥{{ row.price }}</span>
              <span v-if="row.oldPrice" style="color:#c0c4cc;font-size:12px;text-decoration:line-through">
                ¥{{ row.oldPrice }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ $index }">
            <el-popconfirm title="确定移除该热门商品？" @confirm="removeHot($index)">
              <template #reference>
                <el-button type="danger" size="small">
                  <el-icon><Delete /></el-icon>
                  移除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Product Selector Dialog -->
    <el-dialog
      v-model="showProductSelector"
      title="选择商品添加到热门"
      width="960px"
      @open="onSelectorOpen"
    >
      <el-form :model="selectorSearch" inline class="selector-search-form">
        <el-form-item label="名称">
          <el-input v-model="selectorSearch.name" placeholder="商品名称" clearable style="width:160px" @keyup.enter="searchProducts" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="selectorSearch.categoryIds" placeholder="不限" multiple collapse-tags clearable style="width:180px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="selectorSearch.typeIds" placeholder="不限" multiple collapse-tags clearable style="width:180px">
            <el-option v-for="t in types" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="selectorSearch.priceMin" :min="0" :precision="2" placeholder="最低" style="width:100px" />
          <span style="margin:0 4px">-</span>
          <el-input-number v-model="selectorSearch.priceMax" :min="0" :precision="2" placeholder="最高" style="width:100px" />
        </el-form-item>
        <el-form-item label="上架时间">
          <el-date-picker
            v-model="selectorSearch.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width:220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchProducts(true)">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="availableProducts"
        border
        v-loading="productSearchLoading"
        style="width: 100%"
        @selection-change="onProductSelectionChange"
        ref="selectorTableRef"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="商品略图" width="90" align="center">
          <template #default="{ row }">
            <el-image v-if="row.picture" :src="row.picture" fit="cover" style="width:50px;height:50px;border-radius:4px" :preview-src-list="[row.picture]" preview-teleported />
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="商品价格" width="180" align="center">
          <template #default="{ row }">
            <span style="color:#f56c6c;font-weight:600">¥{{ row.price }}</span>
            <span v-if="row.oldPrice" style="color:#c0c4cc;font-size:12px;text-decoration:line-through;margin-left:6px">¥{{ row.oldPrice }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <el-pagination
          v-model:current-page="selectorPage.page"
          v-model:page-size="selectorPage.pageSize"
          :page-sizes="[20]"
          :total="selectorPage.counts"
          layout="total, prev, pager, next"
          @current-change="searchProducts"
        />
      </div>

      <template #footer>
        <el-button @click="showProductSelector = false">取消</el-button>
        <el-button type="primary" :disabled="selectedProducts.length === 0" @click="confirmAddProducts">
          添加选中商品 ({{ selectedProducts.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getHotProducts, saveHotProducts, getProducts, getCategories, getTypes } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Search, Rank } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'

const hotProducts = ref([])
const hotTableRef = ref(null)

const showProductSelector = ref(false)
const productSearchLoading = ref(false)
const availableProducts = ref([])
const selectedProducts = ref([])
const selectorTableRef = ref(null)
const categories = ref([])
const types = ref([])

const selectorSearch = reactive({
  name: '',
  categoryIds: [],
  typeIds: [],
  priceMin: undefined,
  priceMax: undefined,
  dateRange: [],
})

const selectorPage = reactive({
  page: 1,
  pageSize: 20,
  counts: 0,
})

async function loadHotProducts() {
  try {
    const hotData = await getHotProducts()
    hotProducts.value = (hotData || []).map((hp, idx) => ({
      ...hp,
      _sort: idx,
    }))
    await nextTick()
    initHotSortable()
  } catch (e) {
    // handled
  }
}

function initHotSortable() {
  const el = hotTableRef.value?.$el?.querySelector('.el-table__body-wrapper tbody')
  if (!el) return
  Sortable.create(el, {
    handle: '.drag-handle',
    animation: 200,
    onEnd: async (evt) => {
      const { oldIndex, newIndex } = evt
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
      const arr = [...hotProducts.value]
      const moved = arr.splice(oldIndex, 1)[0]
      arr.splice(newIndex, 0, moved)
      hotProducts.value = arr
      try {
        const data = arr.map((hp, idx) => ({ productId: hp.productId, sort: idx }))
        await saveHotProducts({ items: data })
      } catch { /* reload on failure */ }
    },
  })
}

function removeHot(index) {
  hotProducts.value.splice(index, 1)
  saveHotProducts({ items: hotProducts.value.map((hp, idx) => ({ productId: hp.productId, sort: idx })) }).catch(() => {})
}

async function onSelectorOpen() {
  if (categories.value.length === 0) {
    try {
      const [catData, typeData] = await Promise.all([getCategories(), getTypes()])
      categories.value = catData || []
      types.value = typeData || []
    } catch { /* ignore */ }
  }
  selectorPage.page = 1
  searchProducts()
}

async function searchProducts(resetPage = false) {
  if (resetPage) selectorPage.page = 1
  productSearchLoading.value = true
  try {
    const params: any = {
      page: selectorPage.page,
      pageSize: selectorPage.pageSize,
    }
    params.isEnable = 1 // Only show enabled products
    if (selectorSearch.name) params.name = selectorSearch.name
    if (selectorSearch.categoryIds && selectorSearch.categoryIds.length > 0) params.categoryIds = selectorSearch.categoryIds
    if (selectorSearch.typeIds && selectorSearch.typeIds.length > 0) params.typeIds = selectorSearch.typeIds
    if (selectorSearch.priceMin !== undefined && selectorSearch.priceMin !== null) params.priceMin = selectorSearch.priceMin
    if (selectorSearch.priceMax !== undefined && selectorSearch.priceMax !== null) params.priceMax = selectorSearch.priceMax
    if (selectorSearch.dateRange && selectorSearch.dateRange.length === 2) {
      params.createTimeStart = selectorSearch.dateRange[0]
      params.createTimeEnd = selectorSearch.dateRange[1]
    }
    const data = await getProducts(params)
    if (data) {
      availableProducts.value = data.items || []
      selectorPage.counts = data.counts || 0
    }
  } catch { /* ignore */ }
  finally {
    productSearchLoading.value = false
  }
}

function onProductSelectionChange(selection) {
  selectedProducts.value = selection
}

function confirmAddProducts() {
  const existingIds = new Set(hotProducts.value.map((hp) => hp.productId))
  for (const p of selectedProducts.value) {
    if (!existingIds.has(p.id)) {
      hotProducts.value.push({
        productId: p.id,
        productName: p.name,
        picture: p.picture || '',
        price: p.price,
        oldPrice: p.oldPrice,
        sort: hotProducts.value.length,
      })
    }
  }
  showProductSelector.value = false
  availableProducts.value = []
  selectedProducts.value = []
  ElMessage.success('已添加选中商品')
  saveHotProducts({ items: hotProducts.value.map((hp, idx) => ({ productId: hp.productId, sort: idx })) }).catch(() => {})
}

onMounted(() => {
  loadHotProducts()
})
</script>

<style lang="scss" scoped>
.hot-products {
  max-width: 1400px;
  margin: 0 auto;
}

.hot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hot-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.selector-search-form {
  margin-bottom: 12px;
}
.selector-search-form :deep(.el-form-item) {
  margin-bottom: 8px;
}
</style>
