<template>
  <div class="product-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ isCreate ? '新增商品' : '编辑商品' }}</h3>
          <el-button v-if="isCreate" type="success" @click="openJieshunDialog">
            <el-icon><Download /></el-icon> 从街顺导入商品
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
          <el-select v-model="form.productBrand" placeholder="请选择品牌" style="width:240px">
            <el-option v-for="b in brandList" :key="b.id" :label="b.brandName" :value="b.id" />
          </el-select>
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
          <ImageUploader v-model="form.mainPictures" />
          <div class="form-hint">第一张为主图，可拖拽图片排序</div>
        </el-form-item>

        <!-- 商品属性 -->
        <template v-if="displaySpecs.length > 0 || properties.length > 0">
          <h4 class="section-title">商品属性</h4>
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
        <SkuEditor v-model:skus="form.skus" :specs="skuSpecs" :jieshun-product="jieshunFetchedProduct" />

        <!-- 商品详情 -->
        <h4 class="section-title">商品详情</h4>
        <RichTextEditor v-model="form.detail" />

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
    <el-dialog v-model="jieshunDialogVisible" title="从街顺系统导入商品" width="900px" :close-on-click-modal="false" @closed="onJieshunDialogClosed">
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
            <el-input v-model="jieshunBarcode" placeholder="请输入条形码" style="width:200px" @keyup.enter="jieshunDoSearch" />
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
          <el-table-column label="商品主图" width="80">
            <template #default="{ row }">
              <img :src="row.cover_img" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />
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
          导入商品基本信息
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getProductDetail, createProduct, updateProduct, getCategories, getTypes, getBrands, jieshunSearch, jieshunDetail } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Download } from '@element-plus/icons-vue'
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
// Holds the full fetched product (with SKUs) for later SKU-level import
const jieshunFetchedProduct = ref(null)

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
      return // user cancelled
    }
  }

  jieshunDetailLoading.value = true
  try {
    const data = await jieshunDetail({
      accessToken: jieshunAccessToken.value.trim(),
      productId: String(jieshunSelectedId.value),
    })
    if (!data) return

    // Store full product for SKU-level import
    jieshunFetchedProduct.value = data

    // Fill product form
    const product = data
    form.name = product.name || ''

    // Carousel images: images[].thumb
    const pics: string[] = []
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        if (img.thumb) pics.push(img.thumb)
      })
    }
    form.mainPictures = pics
    form.picture = pics.length > 0 ? pics[0] : ''

    // Detail images: detail_images[].url as <img> tags
    const detailParts: string[] = []
    if (product.detail_images && Array.isArray(product.detail_images)) {
      product.detail_images.forEach((di: any) => {
        if (di.url) detailParts.push(`<img src="${di.url}"/>`)
      })
    }
    form.detail = detailParts.join('')

    // Price: lowest retail_price among SKUs, oldPrice = price * 1.2 (round 2 decimals)
    if (product.skus && Array.isArray(product.skus) && product.skus.length > 0) {
      const prices = product.skus.map((s: any) => Number(s.retail_price) || 0).filter((p: number) => p > 0)
      if (prices.length > 0) {
        const lowestPrice = Math.min(...prices)
        form.price = lowestPrice
        form.oldPrice = Math.round(lowestPrice * 1.2 * 100) / 100
      }
    }

    jieshunDialogVisible.value = false
    ElMessage.success('商品基本信息已从街顺导入商品，请选择商品类型后匹配SKU')
  } catch { /* handled by axios */ }
  finally { jieshunDetailLoading.value = false }
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
      p.properties.forEach((pp) => {
        const spec = displaySpecs.value.find(s => s.name === pp.name)
        const rawValue = pp.valueName || pp.value || ''
        properties.push({
          name: pp.name,
          productType: pp.productType || p.productType,
          inputType: spec ? spec.inputType : 1,
          options: spec ? (spec.inputOptions || []) : [],
          value: spec && spec.inputType === 3 && typeof rawValue === 'string'
            ? rawValue.split(',').filter(v => v) : rawValue,
        })
      })
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
</style>
