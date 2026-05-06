<template>
  <div class="product-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ isCreate ? '新增商品' : '编辑商品' }}</h3>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" size="default">
        <!-- Basic Info -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品描述" prop="desc">
              <el-input v-model="form.desc" placeholder="请输入商品描述" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品分类" prop="productCategory">
              <el-select v-model="form.productCategory" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="c in categories"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品类型" prop="productType">
              <el-select
                v-model="form.productType"
                placeholder="请选择类型"
                style="width: 100%"
                @change="onTypeChange"
              >
                <el-option
                  v-for="t in types"
                  :key="t.id"
                  :label="t.name"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="原价" prop="oldPrice">
              <el-input-number v-model="form.oldPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" style="width: 120px" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品主图" prop="picture">
          <ImageUploader v-model="form.picture" />
          <div style="color:#909399;font-size:12px;margin-top:4px">仅一张，用于商品列表展示</div>
        </el-form-item>
        <el-form-item label="商品轮播图" prop="mainPictures">
          <ImageUploader v-model="form.mainPictures" />
          <div style="color:#909399;font-size:12px;margin-top:4px">可上传多张图片，用于商品详情页轮播展示</div>
        </el-form-item>

        <!-- Properties (Display-only specs) — user selects which to add -->
        <template v-if="displaySpecs.length > 0">
          <el-divider content-position="left">商品属性</el-divider>
          <div v-if="availableSpecs.length > 0" style="margin-bottom:12px">
            <span style="font-size:13px;color:#909399;margin-right:8px">添加属性：</span>
            <el-button
              v-for="spec in availableSpecs"
              :key="spec.id"
              size="small"
              style="margin-right:6px;margin-bottom:4px"
              @click="addProperty(spec)"
            >
              <el-icon><Plus /></el-icon> {{ spec.name }}
            </el-button>
          </div>
          <div v-if="properties.length === 0" style="color:#c0c4cc;font-size:13px;padding:8px 0">
            暂无属性，点击上方按钮添加需要的商品属性
          </div>
          <div v-for="(prop, idx) in properties" :key="idx" class="property-group">
            <el-form-item :label="prop.name">
              <div style="display:flex;align-items:center;gap:8px">
                <template v-if="prop.inputType === 1">
                  <el-input v-model="prop.value" placeholder="请输入值" style="width:260px" />
                </template>
                <template v-else-if="prop.inputType === 2">
                  <el-select v-model="prop.value" placeholder="请选择" style="width:260px">
                    <el-option v-for="opt in (prop.options || [])" :key="opt" :label="opt" :value="opt" />
                  </el-select>
                </template>
                <template v-else-if="prop.inputType === 3">
                  <el-select v-model="prop.value" multiple placeholder="请选择" style="width:260px">
                    <el-option v-for="opt in (prop.options || [])" :key="opt" :label="opt" :value="opt" />
                  </el-select>
                </template>
                <el-button type="danger" :icon="Delete" circle size="small" @click="removeProperty(idx)" />
              </div>
            </el-form-item>
          </div>
        </template>

        <!-- SKU Management -->
        <el-divider content-position="left">SKU管理</el-divider>
        <div class="sku-section">
          <SkuEditor v-model:skus="form.skus" :specs="skuSpecs" />
        </div>

        <!-- Detail -->
        <el-divider content-position="left">商品详情</el-divider>
        <el-form-item label="详情内容" prop="detail" label-width="120px">
          <RichTextEditor v-model="form.detail" />
        </el-form-item>

        <!-- Submit -->
        <el-divider />
        <div class="form-footer">
          <el-button @click="router.back()">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ isCreate ? '创建商品' : '保存修改' }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getProductDetail, createProduct, updateProduct, getCategories, getTypes } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
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

const form = reactive({
  id: '',
  name: '',
  desc: '',
  productCategory: '',
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
  productType: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

const properties = reactive([])
const skuSpecs = ref([])
const displaySpecs = ref([])
const currentTypeId = ref('')
const typeSpecsMap = ref({})

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

  submitLoading.value = true
  try {
    const data = {
      name: form.name,
      desc: form.desc,
      productCategory: form.productCategory,
      productType: form.productType,
      price: form.price,
      oldPrice: form.oldPrice,
      mainPictures: form.mainPictures,
      picture: form.picture || '',
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
        properties.push({
          name: pp.name,
          productType: pp.productType || p.productType,
          inputType: spec ? spec.inputType : 1,
          options: spec ? (spec.inputOptions || []) : [],
          value: pp.value && spec && spec.inputType === 3 && typeof pp.value === 'string'
            ? pp.value.split(',').filter(v => v) : (pp.value || ''),
        })
      })
    }
  } catch (e) {
    console.error('loadProduct failed:', e)
  }
}

onMounted(async () => {
  try {
    const [catData, typeData] = await Promise.all([getCategories(), getTypes()])
    categories.value = catData || []
    types.value = typeData || []
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

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.sku-section {
  margin-top: 0;
}

.sku-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.form-footer {
  text-align: center;
  padding-bottom: 16px;
}

.property-group {
  margin-bottom: 0;
}
</style>
