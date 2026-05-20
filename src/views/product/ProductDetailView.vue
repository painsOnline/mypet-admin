<template>
  <div class="product-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ isCreate ? '新增商品' : '编辑商品' }}</h3>
          <el-button type="success" @click="openJieshunDialog">
            <el-icon><Download /></el-icon> {{ isCreate ? '从街顺导入商品' : '从街顺同步商品' }}
          </el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="default">

        <!-- 基本信息 -->
        <h4 class="section-title">基本信息</h4>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" style="max-width:500px" />
        </el-form-item>
        <el-form-item label="商品描述" prop="desc">
          <el-input v-model="form.desc" placeholder="请输入商品描述" style="max-width:500px" />
        </el-form-item>
        <el-form-item label="商品品牌" prop="productBrand">
          <div style="display:flex;gap:6px">
            <el-select v-model="form.productBrand" placeholder="请选择品牌" style="width:240px" filterable>
              <el-option v-for="b in brandList" :key="b.id" :label="b.brandName" :value="b.id" />
            </el-select>
            <el-input v-model="newBrandName" placeholder="输入新品牌名称" style="width:180px" @keyup.enter="quickAddBrand" />
            <el-button type="primary" :disabled="!newBrandName.trim()" @click="quickAddBrand">快速添加</el-button>
          </div>
        </el-form-item>
        <el-form-item label="商品分类" prop="productCategory">
          <el-select v-model="form.productCategory" placeholder="请选择分类" style="width:240px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品类型" prop="productType">
          <el-select v-model="form.productType" placeholder="请选择类型" style="width:240px" @change="onTypeChange">
            <el-option v-for="t in types" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width:200px" />&nbsp;元
        </el-form-item>
        <el-form-item label="原价" prop="oldPrice">
          <el-input-number v-model="form.oldPrice" :min="0" :precision="2" style="width:200px" />&nbsp;元
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width:120px" />
        </el-form-item>
        <el-form-item label="商品图片">
          <ImageUploader v-model="form.mainPictures" :category="isCreate ? 'temp/products' : 'product/main'" :product-id="isCreate ? '' : props.id" />
          <div class="form-hint">第一张为主图，可拖拽图片排序</div>
        </el-form-item>

        <!-- 商品属性 -->
        <template v-if="displaySpecs.length > 0 || properties.length > 0">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <h4 class="section-title" style="border:none;margin:0;padding:0">商品属性</h4>
            <el-button v-if="jieshunFetchedProduct" size="small" type="success" @click="matchJieshunAttrs">
              从街顺匹配属性
            </el-button>
          </div>
          <div v-if="availableSpecs.length > 0" class="property-add-bar">
            <span class="property-add-label">添加属性：</span>
            <el-button v-for="spec in availableSpecs" :key="spec.id" size="small" @click="addProperty(spec)">
              <el-icon><Plus /></el-icon> {{ spec.name }}
            </el-button>
          </div>
          <div v-if="properties.length === 0" class="form-hint">暂无属性，点击上方按钮添加需要的商品属性</div>
          <div v-for="(prop, idx) in properties" :key="idx" class="property-row">
            <el-form-item :label="prop.name">
              <div class="property-input-row">
                <el-input v-if="prop.inputType === 1" v-model="prop.value" placeholder="请输入值" style="width:260px" />
                <el-select v-else-if="prop.inputType === 2" v-model="prop.value" placeholder="请选择" style="width:260px">
                  <el-option v-for="opt in (prop.options || [])" :key="opt" :label="opt" :value="opt" />
                </el-select>
                <el-select v-else-if="prop.inputType === 3" v-model="prop.value" multiple placeholder="请选择" style="width:260px">
                  <el-option v-for="opt in (prop.options || [])" :key="opt" :label="opt" :value="opt" />
                </el-select>
                <el-button type="danger" :icon="Delete" circle size="small" @click="removeProperty(idx)" />
              </div>
            </el-form-item>
          </div>
        </template>

        <!-- SKU管理 -->
        <h4 class="section-title">SKU管理</h4>
        <SkuEditor v-model:skus="form.skus" :specs="skuSpecs" :jieshun-product="jieshunFetchedProduct" :product-pictures="form.mainPictures" :product-id="isCreate ? '' : props.id" />

        <!-- 商品详情 -->
        <h4 class="section-title">商品详情</h4>
        <RichTextEditor v-model="form.detail" :product-id="isCreate ? '' : props.id" />

        <!-- 提交 -->
        <div class="form-footer">
          <el-button @click="router.back()">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ isCreate ? '创建商品' : '保存修改' }}
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 街顺商品导入弹窗 -->
    <el-dialog v-model="jieshunDialogVisible" :title="isCreate ? '从街顺系统导入商品' : '从街顺系统同步商品'" width="900px" :close-on-click-modal="false" @closed="onJieshunDialogClosed" @opened="nextTick(() => jieshunBarcodeRef?.focus())">
      <el-alert type="warning" :closable="false" style="margin-bottom:16px">
        <template #title>
          需要先登录<a href="https://s.waisongbang.com/#/account/ac_manage" target="_blank" style="color:#409EFF">街顺系统后台</a>，否则无法获取商品数据
        </template>
      </el-alert>

      <el-form size="default" label-width="100px">
        <el-form-item label="access_token">
          <el-input v-model="jieshunAccessToken" placeholder="请输入access_token" style="width:400px" />
        </el-form-item>
        <el-form-item label="店铺ID">
          <el-input v-model="jieshunStoreId" placeholder="店铺ID" style="width:200px" />
        </el-form-item>
        <el-form-item label="品牌ID">
          <el-input v-model="jieshunVendorId" placeholder="品牌ID" style="width:200px" />
        </el-form-item>
        <el-form-item label="条形码">
          <div style="display:flex;align-items:center;gap:8px">
            <el-input ref="jieshunBarcodeRef" v-model="jieshunBarcode" placeholder="请输入条形码" style="width:200px" @keyup.enter="jieshunDoSearch" />
            <span style="color:#909399;font-size:12px">（对应街顺UPC）</span>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="jieshunSearchLoading" @click="jieshunDoSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <!-- Search Results -->
      <div v-if="jieshunSearchResults.length > 0" style="margin-top:8px">
        <el-table :data="jieshunSearchResults" size="small" highlight-current-row
          @current-change="onJieshunSelectRow" ref="jieshunTableRef" max-height="320">
          <el-table-column label="选择" width="55">
            <template #default="{ row }">
              <el-radio v-model="jieshunSelectedId" :value="row.id" />
            </template>
          </el-table-column>
          <el-table-column label="商品主图" width="120">
            <template #default="{ row }">
              <img :src="row.cover_img" style="width:100px;height:100px;object-fit:cover;border-radius:4px" />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="220" show-overflow-tooltip />
          <el-table-column label="成本价" width="90">
            <template #default="{ row }">¥{{ row.lowest_purchase_price }}</template>
          </el-table-column>
          <el-table-column label="推荐零售价" width="100">
            <template #default="{ row }">¥{{ row.lowest_retail_price }}</template>
          </el-table-column>
          <el-table-column prop="specs" label="规格简介" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>

      <template #footer>
        <el-button @click="jieshunDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!jieshunSelectedId" :loading="jieshunDetailLoading"
          @click="jieshunFetchDetail">
          {{ isCreate ? '导入商品基本信息' : '同步商品基本信息' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 从街顺同步商品 - 覆盖模块选择 -->
    <el-dialog v-model="jieshunSyncDialogVisible" title="选择覆盖模块" width="500px" :close-on-click-modal="false">
      <div style="margin-bottom:12px;color:#606266">请选择需要用街顺数据覆盖的模块：</div>
      <el-checkbox-group v-model="jieshunSyncModules">
        <el-checkbox v-for="m in jieshunSyncModuleOptions" :key="m.key" :label="m.key" :disabled="m.disabled" style="display:block;margin-bottom:10px">
          {{ m.label }}<span v-if="m.disabled" style="color:#909399;font-size:12px">（新增时不覆盖此项）</span>
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="jieshunSyncDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmJieshunSync">确认覆盖</el-button>
      </template>
    </el-dialog>

    <!-- 街顺属性匹配侧边栏 -->
    <div v-if="jieshunFetchedProduct && jieshunMatchPanelVisible" class="jieshun-match-panel">
      <div class="jieshun-match-toggle" @click="jieshunMatchPanelVisible = false">
        <el-icon :size="18"><DArrowRight /></el-icon>
      </div>
      <div class="jieshun-match-header">
        <span>街顺属性匹配</span>
        <el-button size="small" type="primary" @click="matchJieshunAttrs">执行匹配</el-button>
      </div>
      <div class="jieshun-match-body">
        <el-table :data="jieshunMatchList" size="small" style="width:100%">
          <el-table-column label="序号" type="index" width="55" />
          <el-table-column prop="attr_name" label="属性名称" min-width="120" show-overflow-tooltip />
          <el-table-column label="属性值" min-width="200">
            <template #default="{ row }">
              <el-tooltip :content="row.rawJson" placement="top" :show-after="300">
                <div style="display:inline-flex;flex-wrap:wrap;gap:2px;cursor:default">
                  <el-tag v-for="(v,i) in (row.value||[])" :key="i" size="small">{{ v }}</el-tag>
                </div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="是否匹配" width="80" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.matched" color="#67C23A" :size="20"><SuccessFilled /></el-icon>
              <el-icon v-else-if="row.emptyValue" color="#909399" :size="20"><WarningFilled /></el-icon>
              <el-icon v-else-if="row.nameMatched" color="#E6A23C" :size="20"><WarningFilled /></el-icon>
              <el-icon v-else color="#F56C6C" :size="20"><CircleCloseFilled /></el-icon>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getProductDetail, createProduct, updateProduct, getCategories, getTypes, getBrands, createBrand, jieshunSearch, jieshunDetail } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Download, DArrowRight, SuccessFilled, CircleCloseFilled, WarningFilled } from '@element-plus/icons-vue'
import ImageUploader from '@/components/ImageUploader.vue'
import SkuEditor from '@/components/SkuEditor.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
})

const router = useRouter()

const isCreate = computed(() => !props.id || props.id === 'new')
const formRef = ref(null)
const submitLoading = ref(false)

const categories = ref([])
const types = ref([])
const brandList = ref([])

const form = reactive({
  id: '',
  name: '',
  desc: '',
  productCategory: '',
  productBrand: '',
  productType: '',
  price: 0,
  oldPrice: 0,
  mainPictures: [],
  picture: '',
  detail: '',
  sort: 0,
  skus: [],
  properties: [],
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  productCategory: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  productBrand: [{ required: true, message: '请选择商品品牌', trigger: 'change' }],
  productType: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

const properties = reactive([])
const skuSpecs = ref([])
const displaySpecs = ref([])

// Product price follows the lowest SKU price (one-way)
let syncingPriceFromSkus = false
watch(() => form.skus, () => {
  if (syncingPriceFromSkus) return
  const skus = form.skus as any[]
  if (!skus || skus.length === 0) return
  const activeSkus = skus.filter((s: any) => s.price > 0 || s.oldPrice > 0 || s.inventory > 0 || s.picture)
  if (activeSkus.length === 0) return
  const lowestPrice = Math.min(...activeSkus.map((s: any) => Number(s.price) || 0).filter((p: number) => p > 0))
  const lowestOldPrice = Math.min(...activeSkus.map((s: any) => Number(s.oldPrice) || 0).filter((p: number) => p > 0))
  if (lowestPrice > 0 && lowestPrice !== Infinity) {
    syncingPriceFromSkus = true
    form.price = lowestPrice
    if (lowestOldPrice > 0 && lowestOldPrice !== Infinity) form.oldPrice = lowestOldPrice
    syncingPriceFromSkus = false
  }
}, { deep: true })
const currentTypeId = ref('')
const typeSpecsMap = ref({})

// --- 街顺系统导入 ---
const JIESHUN_TOKEN_KEY = 'jieshun_access_token'
const JIESHUN_TOKEN_EXPIRY = 4 * 60 * 60 * 1000

const jieshunDialogVisible = ref(false)
const jieshunAccessToken = ref('')
const jieshunStoreId = ref('1289567')
const jieshunVendorId = ref('5406')
const jieshunBarcode = ref('')
const jieshunSearchResults = ref([])
const jieshunSelectedId = ref(null)
const jieshunSearchLoading = ref(false)
const jieshunDetailLoading = ref(false)
const jieshunTableRef = ref(null)
const jieshunBarcodeRef = ref(null)
// Holds the full fetched product (with SKUs) for later SKU-level import
const jieshunFetchedProduct = ref(null)
const jieshunMatchPanelVisible = ref(false)
const jieshunMatchList = ref<any[]>([])

// Sync dialog for edit mode
const jieshunSyncDialogVisible = ref(false)
const jieshunSyncModules = ref<string[]>(['name', 'pictures', 'attrs', 'detail'])
const jieshunSyncModuleOptions = [
  { key: 'name', label: '商品名称', disabled: false },
  { key: 'price', label: '商品价格', disabled: false },
  { key: 'pictures', label: '商品轮播图', disabled: false },
  { key: 'attrs', label: '商品属性', disabled: false },
  { key: 'detail', label: '商品详情', disabled: false },
]

function getJieshunCachedToken() {
  const stored = localStorage.getItem(JIESHUN_TOKEN_KEY)
  if (stored) {
    try {
      const { token, timestamp } = JSON.parse(stored)
      if (Date.now() - timestamp <= JIESHUN_TOKEN_EXPIRY) return token
    } catch { /* ignore */ }
  }
  // Try reading from browser's existing access_token key (街顺 stores it as JSON with 'content' field)
  const raw = localStorage.getItem('access_token')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed.content) {
        saveJieshunToken(parsed.content)
        return parsed.content
      }
    } catch { /* ignore */ }
  }
  return null
}

function saveJieshunToken(token) {
  localStorage.setItem(JIESHUN_TOKEN_KEY, JSON.stringify({ token, timestamp: Date.now() }))
}

function openJieshunDialog() {
  const cached = getJieshunCachedToken()
  if (cached) jieshunAccessToken.value = cached
  jieshunStoreId.value = '1289567'
  jieshunVendorId.value = '5406'
  jieshunBarcode.value = ''
  // Edit mode: pre-fill barcode from first SKU
  if (!isCreate.value) {
    const skus = form.skus as any[]
    if (skus && skus.length > 0 && skus[0].barcode) {
      jieshunBarcode.value = skus[0].barcode
    }
  }
  jieshunSearchResults.value = []
  jieshunSelectedId.value = null
  jieshunDialogVisible.value = true
}

async function jieshunDoSearch() {
  if (!jieshunAccessToken.value.trim()) {
    ElMessage.warning('请输入access_token')
    return
  }
  if (!jieshunBarcode.value.trim()) {
    ElMessage.warning('请输入条形码')
    return
  }
  jieshunSearchLoading.value = true
  try {
    const data = await jieshunSearch({
      accessToken: jieshunAccessToken.value.trim(),
      storeId: jieshunStoreId.value.trim(),
      vendorId: jieshunVendorId.value.trim(),
      kw: jieshunBarcode.value.trim(),
    })
    saveJieshunToken(jieshunAccessToken.value.trim())
    jieshunSearchResults.value = (data && data.lists) ? data.lists : []
    jieshunSelectedId.value = null
    if (jieshunSearchResults.value.length === 0) {
      ElMessage.info('未搜索到匹配的商品')
    }
  } catch { /* handled by axios */ }
  finally { jieshunSearchLoading.value = false }
}

function onJieshunSelectRow(row) {
  if (row) jieshunSelectedId.value = row.id
}

async function jieshunFetchDetail() {
  if (!jieshunSelectedId.value) return

  // Warn if product info was already imported
  if (jieshunFetchedProduct.value) {
    try {
      await ElMessageBox.confirm(
        '已导入的商品基本信息及SKU配置将会被覆盖，确定重新导入吗？',
        '提示',
        { confirmButtonText: '确定覆盖', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
  }

  jieshunDetailLoading.value = true
  try {
    const data = await jieshunDetail({
      accessToken: jieshunAccessToken.value.trim(),
      productId: String(jieshunSelectedId.value),
    })
    if (!data) return

    jieshunFetchedProduct.value = data
    jieshunMatchPanelVisible.value = false
    jieshunMatchList.value = []
    jieshunDialogVisible.value = false

    if (isCreate.value) {
      // Create mode: auto-apply and open match panel
      applyJieshunData(data, ['name', 'price', 'pictures', 'detail'])
      matchJieshunAttrs()
      ElMessage.success('已从街顺导入商品信息，请选择商品类型后匹配SKU')
    } else {
      // Edit mode: show sync module selection dialog
      jieshunSyncModules.value = ['name', 'pictures', 'attrs', 'detail']
      jieshunSyncDialogVisible.value = true
    }
  } catch { /* handled by axios */ }
  finally { jieshunDetailLoading.value = false }
}

function applyJieshunData(data: any, modules: string[]) {
  // Auto-match brand
  if (data.dynamic_attrs && Array.isArray(data.dynamic_attrs)) {
    const brandAttr = data.dynamic_attrs.find((a: any) => a.attr_name === '品牌')
    if (brandAttr) {
      const values = (brandAttr.value && Array.isArray(brandAttr.value))
        ? brandAttr.value.map((v: any) => typeof v === 'object' ? String(v.value || '') : String(v)).filter((s: string) => s.trim())
        : []
      if (values.length > 0) {
        const brandName = values[0]
        const existing = brandList.value.find((b: any) => b.brandName === brandName)
        if (existing) {
          form.productBrand = existing.id
        } else {
          newBrandName.value = brandName
          ElMessage.info(`街顺品牌"${brandName}"不存在，已填入快速新增框，请确认后点击添加`)
        }
      }
    }
  }

  // Name
  if (modules.includes('name')) {
    form.name = data.name || ''
  }

  // Pictures
  if (modules.includes('pictures')) {
    const pics: string[] = []
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((img: any) => { if (img.thumb) pics.push(img.thumb) })
    }
    form.mainPictures = pics
    form.picture = pics.length > 0 ? pics[0] : ''
  }

  // Detail
  if (modules.includes('detail')) {
    const detailParts: string[] = []
    if (data.detail_images && Array.isArray(data.detail_images)) {
      data.detail_images.forEach((di: any) => { if (di.url) detailParts.push(`<img src="${di.url}"/>`) })
    }
    form.detail = detailParts.join('')
  }

  // Price
  if (modules.includes('price')) {
    if (data.skus && Array.isArray(data.skus) && data.skus.length > 0) {
      const prices = data.skus.map((s: any) => Number(s.retail_price) || 0).filter((p: number) => p > 0)
      if (prices.length > 0) {
        form.price = Math.min(...prices)
        form.oldPrice = Math.round(form.price * 1.2 * 100) / 100
      }
    }
  }
}

function confirmJieshunSync() {
  if (!jieshunFetchedProduct.value) return
  const modules = jieshunSyncModules.value
  applyJieshunData(jieshunFetchedProduct.value, modules)
  if (modules.includes('attrs')) {
    matchJieshunAttrs()
  }
  jieshunSyncDialogVisible.value = false
  ElMessage.success('已按选择同步商品信息')
}

function onJieshunDialogClosed() {
  jieshunSearchResults.value = []
  jieshunSelectedId.value = null
}

async function loadTypeSpecs(typeId) {
  if (!typeId) {
    skuSpecs.value = []
    displaySpecs.value = []
    return
  }
  try {
    const type = types.value.find((t) => t.id === typeId)
    if (type && type.specs) {
      const specs = type.specs || []
      skuSpecs.value = specs.filter((s) => s.type === 1)
      displaySpecs.value = specs.filter((s) => s.type === 2)
    }
  } catch (e) {
    // handled
  }
}

const availableSpecs = computed(() => {
  const addedNames = new Set(properties.map(p => p.name))
  return displaySpecs.value.filter(s => !addedNames.has(s.name))
})

function onTypeChange(typeId) {
  currentTypeId.value = typeId
  loadTypeSpecs(typeId)
  properties.splice(0, properties.length)
}

const newBrandName = ref('')

async function quickAddBrand() {
  const name = newBrandName.value.trim()
  if (!name) return
  // Check duplicate
  if (brandList.value.find((b: any) => b.brandName === name)) {
    ElMessage.warning('该品牌已存在')
    return
  }
  try {
    const newBrand = await createBrand({ brandName: name, brandLogo: '', sort: 0 })
    brandList.value.push(newBrand)
    form.productBrand = newBrand.id
    newBrandName.value = ''
    ElMessage.success(`已添加品牌：${name}`)
  } catch { /* handled */ }
}

function addProperty(spec) {
  properties.push({
    name: spec.name,
    productType: currentTypeId.value,
    inputType: spec.inputType,
    options: spec.inputOptions || [],
    value: spec.inputType === 3 ? [] : '',
  })
}

function removeProperty(idx) {
  properties.splice(idx, 1)
}

function matchJieshunAttrs() {
  if (!jieshunFetchedProduct.value) return
  const attrs = jieshunFetchedProduct.value.dynamic_attrs
  if (!attrs || !Array.isArray(attrs)) {
    ElMessage.info('街顺商品没有可匹配的属性')
    return
  }
  let autoAdded = 0
  let matchedCount = 0
  const list: any[] = []

  attrs.forEach((a: any) => {
    if (!a.attr_name) return
    const rawValues = (a.value && Array.isArray(a.value)) ? a.value.map((v: any) => typeof v === 'object' ? String(v.value || '') : String(v)) : []
    const values = rawValues.filter((v: string) => v.trim() !== '')
    const rawJson = JSON.stringify(a)

    const spec = displaySpecs.value.find((s: any) => s.name === a.attr_name)
    if (!spec) {
      list.push({ attr_name: a.attr_name, value: values, matched: false, nameMatched: false, emptyValue: false, rawJson })
      return
    }
    // If jieshun values are all empty after trim, skip - don't add property
    if (values.length === 0) {
      list.push({ attr_name: a.attr_name, value: [], matched: false, nameMatched: true, emptyValue: true, rawJson })
      return
    }
    // Auto-add property if not already present
    let prop = (properties as any[]).find((p: any) => p.name === a.attr_name)
    if (!prop) {
      addProperty(spec)
      prop = (properties as any[]).find((p: any) => p.name === a.attr_name)
      if (prop) autoAdded++
    }
    if (!prop) { list.push({ attr_name: a.attr_name, value: values, matched: false, nameMatched: true, emptyValue: false, rawJson }); return }
    // Match values
    const localOptions: string[] = spec.inputOptions || []
    let matched = false
    if (spec.inputType === 1) {
      prop.value = values.join(',')
      matched = true
    } else if (spec.inputType === 2) {
      const m = values.find((v: string) => localOptions.includes(v))
      if (m) { prop.value = m; matched = true }
    } else if (spec.inputType === 3) {
      const matches = values.filter((v: string) => localOptions.includes(v))
      if (matches.length > 0) { prop.value = matches; matched = true }
    }
    if (matched) matchedCount++
    list.push({ attr_name: a.attr_name, value: values, matched, nameMatched: true, emptyValue: false, rawJson })
  })

  jieshunMatchList.value = list
  jieshunMatchPanelVisible.value = true
  const msg = autoAdded > 0 ? `自动添加了 ${autoAdded} 个属性，匹配了 ${matchedCount} 个属性值` : `匹配了 ${matchedCount} 个属性值`
  ElMessage.success(msg)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!form.mainPictures || form.mainPictures.length === 0) {
    ElMessage.warning('请至少上传一张商品图片')
    return
  }

  submitLoading.value = true
  try {
    const data = {
      name: form.name,
      desc: form.desc,
      productCategory: form.productCategory,
      productBrand: form.productBrand,
      productType: form.productType,
      price: form.price,
      oldPrice: form.oldPrice,
      mainPictures: form.mainPictures,
      picture: form.mainPictures && form.mainPictures.length > 0 ? form.mainPictures[0] : '',
      detail: form.detail,
      sort: form.sort,
      skus: form.skus,
      properties: [...properties]
        .filter((p) => {
          const v = p.value
          return v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
        })
        .map((p) => ({
          name: p.name,
          valueName: Array.isArray(p.value) ? p.value.join(',') : p.value,
        })),
    }

    if (isCreate.value) {
      await createProduct(data)
      ElMessage.success('创建成功')
    } else {
      await updateProduct(form.id, data)
      ElMessage.success('更新成功')
    }
    router.push('/product')
  } catch (e) {
    // handled
  } finally {
    submitLoading.value = false
  }
}

async function loadProduct(id) {
  if (!id) return
  try {
    const p = await getProductDetail(id)
    if (!p) return

    currentTypeId.value = p.productType || ''

    // Set ALL form fields BEFORE loading specs so SkuEditor has skus data when its watchers fire
    form.id = p.id || ''
    form.name = p.name || ''
    form.desc = p.desc || ''
    form.productBrand = p.productBrand || ''
    form.productCategory = p.productCategory || ''
    form.productType = p.productType || ''
    form.price = p.price || 0
    form.oldPrice = p.oldPrice || 0
    form.mainPictures = Array.isArray(p.mainPictures) ? [...p.mainPictures] : []
    form.picture = p.picture || ''
    form.detail = p.detail || ''
    form.sort = p.sort || 0
    form.skus = Array.isArray(p.skus) ? [...p.skus] : []

    // Ensure Vue has rendered the form values before triggering SkuEditor watchers
    await nextTick()
    await loadTypeSpecs(p.productType)

    properties.splice(0, properties.length)
    if (p.properties && p.properties.length > 0) {
      // Group multi-select properties by specName
      const grouped: Record<string, { specName: string; valueNames: string[]; spec: any }> = {}
      for (const pp of p.properties) {
        const specName = pp.specName || pp.name || ''
        const spec = displaySpecs.value.find(s => s.name === specName)
        const isMulti = spec && spec.inputType === 3
        const key = specName || (pp.specId || '')
        if (!grouped[key]) {
          grouped[key] = { specName, valueNames: [], spec }
        }
        const vn = pp.valueName || pp.value || ''
        if (vn) grouped[key].valueNames.push(vn)
      }
      for (const g of Object.values(grouped)) {
        const spec = g.spec
        const isMulti = spec && spec.inputType === 3
        properties.push({
          name: g.specName,
          productType: p.productType,
          inputType: spec ? spec.inputType : 1,
          options: spec ? (spec.inputOptions || []) : [],
          value: isMulti ? g.valueNames : (g.valueNames[0] || ''),
        })
      }
    }
  } catch (e) {
    console.error('loadProduct failed:', e)
  }
}

onMounted(async () => {
  try {
    const [catData, typeData, brandData] = await Promise.all([getCategories(), getTypes(), getBrands()])
    categories.value = catData || []
    types.value = typeData || []
    brandList.value = brandData || []
  } catch (e) {
    // handled
  }

  if (!isCreate.value) {
    await loadProduct(props.id)
  }
})
</script>

<style lang="scss" scoped>
.product-detail {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 24px 0 10px 0;
  padding: 0 0 8px 0;
  border-bottom: 1px solid #ebeef5;
}
.section-title:first-of-type {
  margin-top: 8px;
}

.form-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

.property-add-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.property-add-label {
  font-size: 13px;
  color: #909399;
  margin-right: 2px;
}

.property-row {
  margin-bottom: 0;
}
.property-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-footer {
  position: fixed;
  bottom: 0;
  left: 220px;
  right: 0;
  background: #fff;
  z-index: 10;
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
  text-align: center;
  box-shadow: 0 -2px 8px rgba(0,0,0,.06);
}

// 街顺属性匹配侧边栏
.jieshun-match-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 33.33%;
  height: 100vh;
  background: #fff;
  box-shadow: -2px 0 12px rgba(0,0,0,.12);
  z-index: 100;
  display: flex;
  flex-direction: column;
}
.jieshun-match-toggle {
  position: absolute;
  left: -28px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 60px;
  background: #409EFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
}
.jieshun-match-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  font-size: 15px;
  font-weight: 600;
}
.jieshun-match-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
</style>
