<template>
  <div class="sku-editor">
    <div v-if="skuSpecs.length === 0" class="empty-hint">请先选择商品类型以加载规格定义</div>
    <template v-else>
      <!-- Multi-spec list table -->
      <h4 class="section-title">多规格列表</h4>
      <div class="sku-table-wrap">
        <table class="sku-table">
          <thead>
            <tr>
              <th style="width:120px">规格名称</th>
              <th>规格值</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="spec in editableSpecs" :key="spec.id">
              <td style="font-weight:500;color:#303133">{{ spec.name }}</td>
              <td style="text-align:left">
                <!-- 唯一值: single text input for manual entry -->
                <span v-if="spec.inputType === 1" class="spec-values-cell">
                  <el-input
                    :model-value="spec.inputOptions[0] || ''"
                    @update:model-value="(v: string) => { spec.inputOptions[0] = v; syncSpecToBackend(spec); generateCombinations() }"
                    size="small" style="width:200px" placeholder="请输入规格值"
                  />
                </span>
                <!-- 单选/多选: selectable value tags -->
                <span v-else class="spec-values-cell">
                  <span
                    v-for="(val, vi) in spec.inputOptions"
                    :key="vi"
                    class="spec-value-tag"
                    :class="{ 'spec-value-off': !isValueSelected(spec, val) }"
                    @click="toggleSpecValue(spec, vi)"
                    @mouseenter="spec._hoverIdx = vi"
                    @mouseleave="spec._hoverIdx = -1"
                  >
                    <el-icon v-if="isValueSelected(spec, val)" class="value-check-icon"><Check /></el-icon>
                    {{ val }}
                    <el-icon
                      v-show="spec._hoverIdx === vi"
                      class="value-delete-icon"
                      @click.stop="removeSpecValue(spec, vi)"
                    ><Close /></el-icon>
                  </span>
                  <span v-if="spec._adding" class="spec-value-add-row">
                    <el-input v-model="spec._newVal" size="small" style="width:100px" placeholder="新规格值"
                      @keyup.enter="confirmAddSpecValue(spec)" />
                    <el-button size="small" type="primary" @click="confirmAddSpecValue(spec)">确定</el-button>
                    <el-button size="small" @click="cancelAddSpecValue(spec)">取消</el-button>
                  </span>
                  <el-button v-else size="small" @click="startAddSpecValue(spec)">
                    <el-icon><Plus /></el-icon>添加规格值
                  </el-button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SKU list table -->
      <h4 class="section-title" style="margin-top:20px">SKU列表</h4>
      <div v-if="localSkus.length === 0" class="empty-hint" style="padding:20px">请选择规格值以生成SKU组合</div>
      <div v-else class="sku-table-wrap">
        <table class="sku-table">
          <thead>
            <tr>
              <th style="width:40px"></th>
              <th v-if="jieshunProduct" style="width:90px">街顺导入</th>
              <th v-for="spec in activeSpecs" :key="spec.id">{{ spec.name }}</th>
              <th>SKU图片</th>
              <th>价格</th>
              <th>原价</th>
              <th>成本价</th>
              <th>库存</th>
              <th>条形码</th>
            </tr>
          </thead>
          <tbody ref="skuTableBodyRef">
            <tr v-for="(sku, si) in localSkus" :key="si" :class="{ 'sku-active': isSkuActive(sku) }">
              <td><el-icon class="drag-handle-sku" style="cursor:grab"><Rank /></el-icon></td>
              <td v-if="jieshunProduct">
                <el-button size="small" type="success" plain @click="openSkuDrawer(si)">从街顺导入</el-button>
              </td>
              <td v-for="spec in activeSpecs" :key="spec.id">{{ sku.specMap[spec.name] }}</td>
              <td style="text-align:center">
                <div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;width:130px">
                  <!-- Show image if exists, otherwise show upload zone -->
                  <div v-if="localSkus[si].picture" style="position:relative;width:130px;height:130px;border-radius:6px;overflow:hidden;border:1px solid #dcdfe6">
                    <img :src="localSkus[si].picture" style="width:130px;height:130px;object-fit:cover" />
                    <div style="position:absolute;top:4px;right:4px">
                      <el-button type="danger" :icon="Delete" circle size="small" @click="localSkus[si].picture = ''" />
                    </div>
                  </div>
                  <el-upload v-else class="sku-drop" drag :show-file-list="false" :http-request="(opt:any) => uploadSkuImage(opt, si)" accept=".jpg,.jpeg,.png,.gif,.webp,.bmp">
                    <el-icon :size="28"><Plus /></el-icon>
                    <div class="upload-text-sku">拖拽或点击上传</div>
                  </el-upload>
                  <el-popover v-if="productPictures.length" placement="bottom" :width="500" trigger="click">
                    <template #reference>
                      <el-button size="small" type="primary" plain>从商品图片选择</el-button>
                    </template>
                    <div style="display:flex;flex-wrap:wrap;gap:8px">
                      <img v-for="(pic,i) in productPictures" :key="i" :src="pic"
                        style="width:110px;height:110px;object-fit:cover;border-radius:4px;cursor:pointer;border:2px solid transparent"
                        :style="{ borderColor: localSkus[si].picture === pic ? '#409EFF' : 'transparent' }"
                        @click="localSkus[si].picture = pic" />
                    </div>
                  </el-popover>
                </div>
              </td>
              <td>
                <el-input-number v-model="localSkus[si].price" :min="0" :precision="2" size="small"
                  controls-position="right" style="width:110px"
                  :class="{ 'is-error': isSkuActive(sku) && (!sku.price || sku.price <= 0) }" />
              </td>
              <td>
                <el-input-number v-model="localSkus[si].oldPrice" :min="0" :precision="2" size="small"
                  controls-position="right" style="width:110px"
                  :class="{ 'is-error': isSkuActive(sku) && (!sku.oldPrice || sku.oldPrice <= 0) }" />
              </td>
              <td>
                <el-input-number v-model="localSkus[si].costPrice" :min="0" :precision="2" size="small"
                  controls-position="right" style="width:110px"
                  :class="{ 'is-error': isSkuActive(sku) && (!sku.costPrice || sku.costPrice <= 0) }" />
              </td>
              <td>
                <el-input-number v-model="localSkus[si].inventory" :min="0" size="small"
                  controls-position="right" style="width:80px"
                  :class="{ 'is-error': isSkuActive(sku) && (!sku.inventory || sku.inventory <= 0) }" />
              </td>
              <td>
                <el-input v-model="localSkus[si].barcode" size="small" style="width:130px" placeholder="选填" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="sku-hint">填写价格、成本价、库存即表示该SKU有效；条形码为选填。整行留空则该SKU无效，不会被保存。</p>
    </template>

    <!-- 街顺SKU导入抽屉 -->
    <el-drawer v-if="jieshunProduct" v-model="skuDrawerVisible" title="从街顺导入SKU" direction="rtl" size="750px">
      <div v-if="jieshunProduct && jieshunProduct.skus" style="padding:0 20px">
        <el-table :data="jieshunProduct.skus" size="small" highlight-current-row :row-class-name="({row}:any)=>usedJieshunSkuIds.includes(row.id)?'jieshun-used-row':''"
          @current-change="onJieshunSkuSelect" ref="jieshunSkuTableRef" max-height="500">
          <el-table-column label="选择" width="55">
            <template #default="{ row }">
              <el-radio v-model="jieshunSelectedSkuId" :value="row.id" :disabled="usedJieshunSkuIds.includes(row.id)" />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="SKU名称" min-width="140" show-overflow-tooltip />
          <el-table-column label="零售价" width="90">
            <template #default="{ row }">¥{{ row.retail_price }}</template>
          </el-table-column>
          <el-table-column label="原价(+20%)" width="100">
            <template #default="{ row }">¥{{ (Number(row.retail_price || 0) * 1.2).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="成本价" width="90">
            <template #default="{ row }">¥{{ row.purchase_price }}</template>
          </el-table-column>
          <el-table-column prop="upc" label="条形码" width="140" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="skuDrawerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!jieshunSelectedSkuId" @click="applyJieshunSku">
          确认导入到当前SKU
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, onMounted, ref, nextTick } from 'vue'
import { Close, Plus, Check, Rank, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import Sortable from 'sortablejs'

const props = defineProps({
  specs: { type: Array, default: () => [] },
  skus: { type: Array, default: () => [] },
  jieshunProduct: { type: Object, default: null },
  productPictures: { type: Array, default: () => [] },
  productId: { type: String, default: '' },
})
const emit = defineEmits(['update:skus', 'update:specs'])

defineExpose({ generateCombinations })

const mounted = ref(false)
onMounted(() => { mounted.value = true })

const skuSpecs = computed(() => (props.specs as any[]).filter((s: any) => s.type === 1))

// Tracks which specs have selected values (for SKU table header columns)
const activeSpecs = computed(() => {
  return editableSpecs.filter((s: any) => (s._selected || []).length > 0)
})

const editableSpecs: any[] = reactive([])

function syncEditableSpecs() {
  const arr = JSON.parse(JSON.stringify(skuSpecs.value))
  arr.forEach((s: any) => {
    s._hoverIdx = -1
    s._adding = false
    s._newVal = ''
    // _selected tracks which value indices are selected (default: all)
    if (!s._selected || s._selected.length === 0) {
      s._selected = (s.inputOptions || []).map((_: any, i: number) => i)
    }
  })
  editableSpecs.splice(0, editableSpecs.length, ...arr)
}

watch(skuSpecs, () => {
  syncEditableSpecs()
  if (!mounted.value) return
  const hasBackendSkus = props.skus && (props.skus as any[]).length > 0
  if (hasBackendSkus) {
    // Edit mode: pre-select only values used by backend SKUs, then build from backend data
    applySkuSelection(props.skus as any[])
    buildSkusFromBackend(props.skus as any[])
  } else {
    // Create mode: generate all combinations from selected values
    rebuildSkus()
  }
}, { deep: true })

onMounted(() => {
  syncEditableSpecs()
  rebuildSkus()
})

// ---- Value selection ----

function isValueSelected(spec: any, val: string) {
  const idx = spec.inputOptions.indexOf(val)
  return (spec._selected || []).includes(idx)
}

function toggleSpecValue(spec: any, vi: number) {
  const selected: number[] = spec._selected || []
  const isSelected = selected.includes(vi)
  if (isSelected) {
    // Prevent unchecking the last selected value in this spec
    if (selected.length <= 1) {
      ElMessage.warning('每个规格至少需要保留一个选中值')
      return
    }
    spec._selected = selected.filter((i: number) => i !== vi)
  } else {
    spec._selected = [...selected, vi]
    // Newly added values start selected; sync to backend
    syncSpecToBackend(spec)
  }
  generateCombinations()
}

// ---- Spec value editing ----

function startAddSpecValue(spec: any) {
  spec._adding = true
  spec._newVal = ''
}

function confirmAddSpecValue(spec: any) {
  const val = spec._newVal?.trim()
  if (!val) return
  if ((spec.inputOptions || []).includes(val)) {
    ElMessage.warning('规格值已存在')
    return
  }
  spec.inputOptions.push(val)
  // New value is auto-selected
  spec._selected = [...(spec._selected || []), spec.inputOptions.length - 1]
  spec._adding = false
  spec._newVal = ''
  syncSpecToBackend(spec)
  generateCombinations()
}

function cancelAddSpecValue(spec: any) {
  spec._adding = false
  spec._newVal = ''
}

async function removeSpecValue(spec: any, index: number) {
  if (spec.inputOptions.length <= 1) return
  // Remove from selected if present, and shift indices
  const selected: number[] = spec._selected || []
  spec.inputOptions.splice(index, 1)
  spec._selected = selected
    .filter((i: number) => i !== index)
    .map((i: number) => i > index ? i - 1 : i)
  // Ensure at least one value remains selected
  if (spec._selected.length === 0) {
    spec._selected = [0]
  }
  await syncSpecToBackend(spec)
  generateCombinations()
}

// ---- SKU combination generation ----

function rebuildSkus() {
  if (!mounted.value) return
  // Only use specs with selected values
  const specsWithSelection = editableSpecs.filter((s: any) => {
    const sel: number[] = s._selected || []
    return sel.length > 0 && (s.inputOptions || []).length > 0
  })
  if (specsWithSelection.length === 0) {
    localSkus.splice(0, localSkus.length)
    return
  }
  // Build arrays of only selected values (new format with spec_id + value_id)
  const arrays = specsWithSelection.map((s: any) => {
    const sel: number[] = s._selected || []
    const vals = s.valuesList || []
    return sel.map((i: number) => ({
      spec_id: s.id,
      spec_name: s.name,
      value_name: s.inputOptions[i],
      value_id: (vals[i]) ? vals[i].id : ''
    }))
  })
  const combos = cartesianProduct(arrays)
  // Preserve existing SKU data for same spec combinations
  const oldMap = new Map()
  for (const sku of localSkus) {
    const key = specsWithSelection.map((s: any) => (sku.specMap && sku.specMap[s.name]) || '').join('||')
    oldMap.set(key, sku)
  }
  const newSkus = combos.map((combo: any[]) => {
    const specMap: Record<string, string> = {}
    combo.forEach(({ spec_name, value_name }) => { specMap[spec_name] = value_name })
    const key = specsWithSelection.map((s: any) => specMap[s.name] || '').join('||')
    const old = oldMap.get(key)
    return {
      price: old ? old.price : 0,
      oldPrice: old ? old.oldPrice : 0,
      costPrice: old ? old.costPrice : 0,
      inventory: old ? old.inventory : 0,
      barcode: old ? old.barcode : '',
      picture: old ? old.picture : '',
      specs: combo,
      specMap,
    }
  })
  localSkus.splice(0, localSkus.length, ...newSkus)
}

// Populate localSkus from backend SKU data (edit mode) — only show filled combinations
function buildSkusFromBackend(skuList: any[]) {
  if (!skuList || skuList.length === 0) { localSkus.splice(0, localSkus.length); return }
  const specsWithIds = skuSpecs.value as any[]
  const newSkus: any[] = []
  for (const bs of skuList) {
    if (!bs.specs || !Array.isArray(bs.specs) || bs.specs.length === 0) continue
    // Rebuild each spec from backend data, resolving value_name from valueId if needed
    const specs: any[] = (bs.specs as any[]).map((sp: any) => {
      let specName = ''
      let specId = sp.specId || ''
      if (!specId) {
        // Try to find specId from specName
        const specDef = specsWithIds.find((s: any) => s.name === (sp.specName || sp.spec_name || sp.name))
        if (specDef) specId = specDef.id
      }
      if (specId) {
        const specDef = specsWithIds.find((s: any) => s.id === specId)
        if (specDef) specName = specDef.name
      } else {
        specName = sp.specName || sp.spec_name || sp.name || ''
      }
      let valueName = sp.valueName || sp.value_name || sp.valueName || ''
      if (!valueName && sp.valueId && specId) {
        const specDef = specsWithIds.find((s: any) => s.id === specId)
        if (specDef && specDef.valuesList) {
          const v = specDef.valuesList.find((sv: any) => sv.id === sp.valueId)
          if (v) valueName = v.valueName
        }
      }
      return {
        spec_id: specId,
        spec_name: specName,
        value_name: valueName,
        value_id: sp.valueId || '',
      }
    })
    const specMap: Record<string, string> = {}
    specs.forEach((s: any) => { if (s.spec_name) specMap[s.spec_name] = s.value_name })
    newSkus.push({
      price: bs.price || 0,
      oldPrice: bs.oldPrice || 0,
      costPrice: bs.costPrice || 0,
      inventory: bs.inventory || 0,
      barcode: bs.barcode || '',
      picture: bs.picture || '',
      specs,
      specMap,
    })
  }
  localSkus.splice(0, localSkus.length, ...newSkus)
}

function generateCombinations() {
  const hasBackendSkus = props.skus && (props.skus as any[]).length > 0
  if (hasBackendSkus) {
    // Edit mode: merge backend SKUs with new combos from checked values
    const specsWithSelection = editableSpecs.filter((s: any) => {
      const sel: number[] = s._selected || []
      return sel.length > 0 && (s.inputOptions || []).length > 0
    })
    if (specsWithSelection.length === 0) { localSkus.splice(0, localSkus.length); return }
    // Build all possible combos from selected values
    const allCombos = allCombinations(specsWithSelection)
    // Build existing backend SKU specs for matching
    const backendSpecMaps: Record<string, any>[] = []
    for (const bs of (props.skus as any[])) {
      if (!bs.specs || !Array.isArray(bs.specs)) continue
      const sm: Record<string, string> = {}
      ;(bs.specs as any[]).forEach((sp: any) => {
        const sn = sp.specName || sp.spec_name || sp.name || ''
        if (sn) sm[sn] = sp.valueName || sp.value_name || sp.valueName || ''
      })
      backendSpecMaps.push(sm)
    }
    // Build old map from current localSkus to preserve filled data
    const oldMap = new Map()
    for (const sku of localSkus) {
      const key = specsWithSelection.map((s: any) => (sku.specMap && sku.specMap[s.name]) || '').join('||')
      oldMap.set(key, sku)
    }
    const newSkus = allCombos.map((combo: any[]) => {
      const specMap: Record<string, string> = {}
      combo.forEach(({ spec_name, value_name }) => { specMap[spec_name] = value_name })
      const key = specsWithSelection.map((s: any) => specMap[s.name] || '').join('||')
      const old = oldMap.get(key)
      // Check if this combo is in backend SKUs
      const isBackend = backendSpecMaps.some((bsm: Record<string, string>) => {
        for (const sn of Object.keys(bsm)) {
          if (specMap[sn] !== bsm[sn]) return false
        }
        return Object.keys(bsm).length > 0
      })
      return {
        price: old ? old.price : 0,
        oldPrice: old ? old.oldPrice : 0,
        costPrice: old ? old.costPrice : 0,
        inventory: old ? old.inventory : 0,
        barcode: old ? old.barcode : '',
        picture: old ? old.picture : '',
        specs: combo,
        specMap,
        _isBackend: isBackend,
      }
    })
    // Filter: only show backend SKUs + newly checked combos (not inherited from old generation)
    const keep = newSkus.filter((s: any) => s._isBackend || s.price > 0 || s.oldPrice > 0 || s.costPrice > 0 || s.inventory > 0 || s.picture || s.barcode)
    localSkus.splice(0, localSkus.length, ...(keep.length > 0 ? keep : newSkus))
  } else {
    rebuildSkus()
  }
}

/** Build all Cartesian combinations from selected spec values. */
function allCombinations(specsWithSelection: any[]) {
  const arrays = specsWithSelection.map((s: any) => {
    const sel: number[] = s._selected || []
    const vals = s.valuesList || []
    return sel.map((i: number) => ({
      spec_id: s.id,
      spec_name: s.name,
      value_name: s.inputOptions[i],
      value_id: (vals[i]) ? vals[i].id : ''
    }))
  })
  return cartesianProduct(arrays)
}

function buildSpecsFromSpecMap(specMap: Record<string, string>, existingSpecs: any[]) {
  // Build new-format specs array using spec_id/value_id from skuSpecs
  if (!existingSpecs || !Array.isArray(existingSpecs)) existingSpecs = []
  const specsWithIds = skuSpecs.value as any[]
  return Object.entries(specMap).map(([name, valueName]) => {
    const existing = existingSpecs.find((s: any) =>
      (s.spec_name === name || s.name === name) && s.value_name === valueName)
    if (existing && existing.spec_id) {
      return { spec_id: existing.spec_id, value_name: valueName, value_id: existing.value_id || '' }
    }
    // Look up from spec definitions
    const specDef = specsWithIds.find((s: any) => s.name === name)
    const specId = specDef ? specDef.id : ''
    // Find value_id from valuesList
    let valueId = ''
    if (specDef && specDef.valuesList) {
      const v = specDef.valuesList.find((sv: any) => sv.valueName === valueName)
      if (v) valueId = v.id
    }
    return { spec_id: specId, value_name: valueName, value_id: valueId }
  })
}

function cartesianProduct(arrays: any[][]) {
  return arrays.reduce((acc, curr) => {
    const result: any[] = []
    for (const a of acc) { for (const c of curr) result.push([...a, c]) }
    return result
  }, [[]] as any[][])
}

// ---- SKU data ----

const localSkus: any[] = reactive([])
const skuTableBodyRef = ref(null)

let skuSortable: any = null
function initSkuSortable() {
  nextTick(() => {
    if (skuSortable) { skuSortable.destroy(); skuSortable = null }
    const el = skuTableBodyRef.value
    if (!el || localSkus.length === 0) return
    skuSortable = Sortable.create(el as HTMLElement, {
      handle: '.drag-handle-sku', animation: 200,
      onEnd: (evt: any) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
        const moved = localSkus.splice(oldIndex, 1)[0]
        localSkus.splice(newIndex, 0, moved)
      },
    })
  })
}

watch(() => localSkus.length, () => { initSkuSortable() })

// --- 街顺SKU导入 ---
const skuDrawerVisible = ref(false)
const jieshunSelectedSkuId = ref(null)
const jieshunSkuTableRef = ref(null)
const skuDrawerTargetIndex = ref(-1)

// Track which jieshun SKU IDs are already assigned to local SKU rows
const usedJieshunSkuIds = computed(() => {
  const ids: string[] = []
  localSkus.forEach((s: any) => {
    if (s._jieshunSkuId) ids.push(s._jieshunSkuId)
  })
  return ids
})

function openSkuDrawer(skuIndex: number) {
  skuDrawerTargetIndex.value = skuIndex
  jieshunSelectedSkuId.value = null
  skuDrawerVisible.value = true
}

function onJieshunSkuSelect(row: any) {
  if (row) jieshunSelectedSkuId.value = row.id
}

function applyJieshunSku() {
  if (!jieshunSelectedSkuId.value || skuDrawerTargetIndex.value < 0) return
  if (!props.jieshunProduct || !props.jieshunProduct.skus) return

  const selectedSku = (props.jieshunProduct.skus as any[]).find(
    (s: any) => s.id === jieshunSelectedSkuId.value
  )
  if (!selectedSku) return

  // Check barcode uniqueness across all local SKUs (except the target)
  const newBarcode = selectedSku.upc || ''
  if (newBarcode) {
    const conflict = localSkus.find((s, i) => i !== skuDrawerTargetIndex.value && s.barcode === newBarcode)
    if (conflict) {
      ElMessage.warning(`条形码 ${newBarcode} 已被其他SKU使用，请选择其他SKU`)
      return
    }
  }

  const target = localSkus[skuDrawerTargetIndex.value]
  if (!target) return

  const retailPrice = Number(selectedSku.retail_price || 0)
  target.price = retailPrice
  target.oldPrice = Math.round(retailPrice * 1.2 * 100) / 100
  target.costPrice = Number(selectedSku.purchase_price || 0)
  target.barcode = newBarcode
  target.inventory = 0
  target._jieshunSkuId = selectedSku.id
  // Default SKU picture to first main product picture if not already set
  if (!target.picture && props.productPictures && props.productPictures.length > 0) {
    target.picture = props.productPictures[0]
  }

  // For unique-value specs (inputType=1), set the value to the imported SKU name
  const jieshunSkuName = selectedSku.name || ''
  if (jieshunSkuName && target.specs) {
    ;(target.specs as any[]).forEach((sp: any) => {
      const specName = sp.spec_name || sp.name || ''
      const specDef = skuSpecs.value.find((s: any) => s.name === specName)
      if (specDef && specDef.inputType === 1) {
        sp.value_name = jieshunSkuName
        sp.valueName = jieshunSkuName // backward compat
        if (target.specMap) target.specMap[specName] = jieshunSkuName
      }
    })
  }

  skuDrawerVisible.value = false
  ElMessage.success('SKU信息已从街顺导入')
}

// Pre-select only values that appear in backend SKU data (edit mode)
function applySkuSelection(skuList: any[]) {
  const usedValues: Record<string, Set<string>> = {}
  for (const spec of skuSpecs.value) {
    usedValues[spec.name] = new Set()
  }
  // Build lookup maps
  const specIdToName: Record<string, string> = {}
  const valueIdToName: Record<string, string> = {}
  const specNameToDef: Record<string, any> = {}
  for (const spec of skuSpecs.value) {
    if (spec.id) specIdToName[spec.id] = spec.name
    if (spec.name) specNameToDef[spec.name] = spec
    if (spec.valuesList) {
      for (const v of spec.valuesList) {
        if (v.id) valueIdToName[v.id] = v.valueName
      }
    }
  }
  for (const sku of skuList) {
    if (sku.specs) {
      (sku.specs as any[]).forEach((sp: any) => {
        let specName = ''
        if (sp.specId && specIdToName[sp.specId]) {
          specName = specIdToName[sp.specId]
        } else {
          specName = sp.specName || sp.spec_name || sp.name || ''
        }
        // valueName may be empty for non-unique specs; resolve from valueId
        let valName = sp.valueName || sp.value_name || ''
        if ((!valName || valName === '') && sp.valueId) {
          valName = valueIdToName[sp.valueId] || ''
        }
        if (usedValues[specName] && valName) usedValues[specName].add(valName)
      })
    }
  }
  for (const spec of editableSpecs) {
    const used = usedValues[spec.name]
    if (used && used.size > 0) {
      spec._selected = []
      ;(spec.inputOptions || []).forEach((val: string, i: number) => {
        if (used.has(val)) spec._selected.push(i)
      })
    }
    // Ensure at least one selected per spec
    if (!spec._selected || spec._selected.length === 0) {
      spec._selected = [0]
    }
  }
}

function mergeSkus(skuList: any[]) {
  if (!skuList || skuList.length === 0) return

  // Build a map from specId to spec name for matching
  const specIdToName: Record<string, string> = {}
  for (const spec of skuSpecs.value) {
    if (spec.id) specIdToName[spec.id] = spec.name
  }

  // Match backend SKUs to local SKUs by specId+valueId (most reliable) or specName+valueName
  for (const bs of skuList) {
    if (!bs.specs || !Array.isArray(bs.specs) || bs.specs.length === 0) continue
    // Find matching local SKU: compare each spec in backend SKU against each spec in local SKU
    const matchIdx = localSkus.findIndex((ls: any) => {
      const lsSpecs: any[] = ls.specs || []
      if (lsSpecs.length === 0) return false
      // Every backend spec must match a local spec
      return (bs.specs as any[]).every((bsSp: any) => {
        return lsSpecs.some((lsSp: any) => {
          // Match by specId first, then by name
          const sameSpec = (bsSp.specId && lsSp.spec_id && bsSp.specId === lsSp.spec_id)
            || (bsSp.specName && lsSp.spec_name && bsSp.specName === lsSp.spec_name)
          if (!sameSpec) return false
          // Match by valueId first (reliable), then by valueName (may be empty for non-unique)
          const bsVid = bsSp.valueId || ''
          const lsVid = lsSp.value_id || ''
          if (bsVid && lsVid && bsVid === lsVid) return true
          const bsVn = bsSp.valueName || bsSp.value_name || ''
          const lsVn = lsSp.value_name || ''
          if (bsVn && lsVn && bsVn === lsVn) return true
          return false
        })
      })
    })
    if (matchIdx >= 0) {
      localSkus[matchIdx].price = bs.price || 0
      localSkus[matchIdx].oldPrice = bs.oldPrice || 0
      localSkus[matchIdx].costPrice = bs.costPrice || 0
      localSkus[matchIdx].inventory = bs.inventory || 0
      localSkus[matchIdx].barcode = bs.barcode || ''
      localSkus[matchIdx].picture = bs.picture || ''
    }
  }
  // If no spec-based matches worked, fall back to index merging
  const anyMatched = localSkus.some((ls: any) => ls.price > 0 || ls.oldPrice > 0)
  if (!anyMatched) {
    for (let i = 0; i < Math.min(skuList.length, localSkus.length); i++) {
      const bs = skuList[i]
      localSkus[i].price = bs.price || 0
      localSkus[i].oldPrice = bs.oldPrice || 0
      localSkus[i].costPrice = bs.costPrice || 0
      localSkus[i].inventory = bs.inventory || 0
      localSkus[i].barcode = bs.barcode || ''
      localSkus[i].picture = bs.picture || ''
    }
  }
}

let mergePending = false
watch(() => props.skus, (val) => {
  if (!val || val.length === 0) return
  if (mergePending) return
  mergePending = true
  mergeSkus(val as any[])
  mergePending = false
}, { deep: true })

// ---- Backend sync ----

async function syncSpecToBackend(spec: any) {
  try {
    await request({
      url: `/admin/spec/${spec.id}/values`,
      method: 'put',
      data: { inputOptions: spec.inputOptions },
    })
  } catch { /* ignore */ }
}

// ---- Helpers ----

function isSkuActive(sku: any) {
  return !!(sku.picture || (sku.price && sku.price > 0) || (sku.oldPrice && sku.oldPrice > 0) || (sku.inventory && sku.inventory > 0))
}

async function uploadSkuImage(opt: any, si: number) {
  const formData = new FormData()
  formData.append('file', opt.file)
  let uploadUrl = '/admin/upload/image'
  const params = new URLSearchParams()
  if (props.productId) {
    params.append('type', 'product/sku')
    params.append('productId', props.productId)
  } else {
    params.append('type', 'temp/products')
  }
  const qs = params.toString()
  if (qs) uploadUrl += '?' + qs
  try {
    const url = await request({
      url: uploadUrl,
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    localSkus[si].picture = url as string
    ElMessage.success('上传成功')
  } catch { ElMessage.error('上传失败') }
}

// Clear SKU fields when a new jieshun product is fetched (re-search)
watch(() => props.jieshunProduct, (newVal) => {
  if (newVal) {
    localSkus.forEach((sku: any) => {
      sku.price = 0
      sku.oldPrice = 0
      sku.costPrice = 0
      sku.barcode = ''
      sku.inventory = 0
    })
  }
})

// Emit valid SKUs on change
let lastEmittedJson = ''
watch(localSkus, () => {
  const valid = localSkus
    .filter((sku: any) => isSkuActive(sku))
    .map(({ specMap, ...rest }: any) => ({
      ...rest,
      specs: buildSpecsFromSpecMap(specMap, rest.specs),
    }))
  const json = JSON.stringify(valid)
  if (json !== lastEmittedJson) {
    lastEmittedJson = json
    emit('update:skus', valid)
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.sku-editor { width: 100%; }
.empty-hint { padding: 40px; text-align: center; color: #909399; font-size: 14px; }
.section-title { font-size: 13px; font-weight: 400; color: #606266; margin: 0 0 8px 0; }
.spec-values-cell { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.spec-value-tag {
  position: relative; display: inline-flex; align-items: center; gap: 3px;
  padding: 4px 8px;
  background: #ecf5ff; border: 1px solid #d9ecff; border-radius: 4px;
  font-size: 13px; color: #409eff; cursor: pointer; line-height: 1.4;
  user-select: none; transition: all 0.15s;
}
.spec-value-tag:hover {
  border-color: #409eff;
}

.spec-value-tag.spec-value-off {
  background: #f5f7fa; border-color: #e4e7ed; color: #c0c4cc;
}
.spec-value-tag.spec-value-off:hover {
  border-color: #c0c4cc;
}

.value-check-icon {
  font-size: 12px; color: #409eff;
}
.spec-value-off .value-check-icon {
  display: none;
}

.value-delete-icon {
  position: absolute; top: -6px; right: -6px; font-size: 12px;
  background: #f56c6c; color: #fff; border-radius: 50%; cursor: pointer; padding: 1px;
}

.spec-value-add-row { display: flex; gap: 4px; align-items: center; }

.sku-table-wrap { overflow-x: auto; }
.sku-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.sku-table th, .sku-table td {
  border: 1px solid #ebeef5; padding: 8px 10px; text-align: center; white-space: nowrap;
}
.sku-table th { background: #f5f7fa; color: #606266; font-weight: 600; }
.sku-table td { background: #fff; }
.sku-active td { }
.is-error :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px #f56c6c inset; }

.sku-hint { margin-top: 10px; font-size: 12px; color: #909399; }
:deep(.jieshun-used-row) { background-color: #f0f0f0 !important; color: #c0c4cc; }
.sku-drop { width: 130px; }
.sku-drop :deep(.el-upload) { width: 130px; }
.sku-drop :deep(.el-upload-dragger) { width: 130px; height: 130px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; }
.upload-text-sku { font-size: 11px; color: #909399; margin-top: 2px; }
</style>