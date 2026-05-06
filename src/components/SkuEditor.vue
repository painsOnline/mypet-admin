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
              <th>规格值（点击切换选中/取消）</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="spec in editableSpecs" :key="spec.id">
              <td style="font-weight:500;color:#303133">{{ spec.name }}</td>
              <td style="text-align:left">
                <span class="spec-values-cell">
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
              <th v-for="spec in activeSpecs" :key="spec.id">{{ spec.name }}</th>
              <th>SKU图片</th>
              <th>价格</th>
              <th>原价</th>
              <th>库存</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sku, si) in localSkus" :key="si" :class="{ 'sku-active': isSkuActive(sku) }">
              <td v-for="spec in activeSpecs" :key="spec.id">{{ sku.specMap[spec.name] }}</td>
              <td>
                <ImageUploader v-model="localSkus[si].picture" />
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
                <el-input-number v-model="localSkus[si].inventory" :min="0" size="small"
                  controls-position="right" style="width:80px"
                  :class="{ 'is-error': isSkuActive(sku) && (!sku.inventory || sku.inventory <= 0) }" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="sku-hint">填写任意字段（图片/价格/原价/库存）即表示该SKU有效，所有字段均需填写完整；整行留空则该SKU无效，不会被保存。</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, onMounted, ref } from 'vue'
import { Close, Plus, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ImageUploader from '@/components/ImageUploader.vue'
import request from '@/api/request'

const props = defineProps({
  specs: { type: Array, default: () => [] },
  skus: { type: Array, default: () => [] },
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
  if (mounted.value) {
    // For edit mode: pre-select only values used in existing backend SKUs
    if (props.skus && (props.skus as any[]).length > 0) {
      applySkuSelection(props.skus as any[])
    }
    rebuildSkus()
    mergeSkus(props.skus)
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
  // Build arrays of only selected values
  const arrays = specsWithSelection.map((s: any) => {
    const sel: number[] = s._selected || []
    return sel.map((i: number) => ({ name: s.name, valueName: s.inputOptions[i] }))
  })
  const combos = cartesianProduct(arrays)
  // Preserve existing SKU data for same spec combinations
  const oldMap = new Map()
  for (const sku of localSkus) {
    const key = specsWithSelection.map((s: any) => sku.specMap[s.name] || '').join('||')
    oldMap.set(key, sku)
  }
  const newSkus = combos.map((combo: any[]) => {
    const specMap: Record<string, string> = {}
    combo.forEach(({ name, valueName }) => { specMap[name] = valueName })
    const key = specsWithSelection.map((s: any) => specMap[s.name] || '').join('||')
    const old = oldMap.get(key)
    return {
      price: old ? old.price : 0,
      oldPrice: old ? old.oldPrice : 0,
      inventory: old ? old.inventory : 0,
      picture: old ? old.picture : '',
      specs: combo,
      specMap,
    }
  })
  localSkus.splice(0, localSkus.length, ...newSkus)
}

function generateCombinations() {
  rebuildSkus()
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

// Pre-select only values that appear in backend SKU data (edit mode)
function applySkuSelection(skuList: any[]) {
  const usedValues: Record<string, Set<string>> = {}
  for (const spec of skuSpecs.value) {
    usedValues[spec.name] = new Set()
  }
  for (const sku of skuList) {
    if (sku.specs) {
      (sku.specs as any[]).forEach((sp: any) => {
        if (usedValues[sp.name]) usedValues[sp.name].add(sp.valueName)
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
  if (skuSpecs.value.length === 0) return

  // Merge specific values into generated combinations
  for (const backendSku of skuList) {
    const specMap: Record<string, string> = {}
    if (backendSku.specs) {
      (backendSku.specs as any[]).forEach((sp: any) => { specMap[sp.name] = sp.valueName || sp.valueName })
    }
    const key = skuSpecs.value.map((s: any) => specMap[s.name] || '').join('||')
    for (let i = 0; i < localSkus.length; i++) {
      const localKey = skuSpecs.value.map((s: any) => localSkus[i].specMap[s.name] || '').join('||')
      if (localKey === key) {
        localSkus[i].price = backendSku.price || 0
        localSkus[i].oldPrice = backendSku.oldPrice || 0
        localSkus[i].inventory = backendSku.inventory || 0
        localSkus[i].picture = backendSku.picture || ''
        break
      }
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

// Emit valid SKUs on change
let lastEmittedJson = ''
watch(localSkus, () => {
  const valid = localSkus
    .filter((sku: any) => isSkuActive(sku))
    .map(({ specMap, ...rest }: any) => ({
      ...rest,
      specs: Object.entries(specMap).map(([name, valueName]) => ({ name, valueName })),
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
.section-title { font-size: 14px; font-weight: 600; color: #303133; margin: 0 0 12px 0; }
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
</style>
