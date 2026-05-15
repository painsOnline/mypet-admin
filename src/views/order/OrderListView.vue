<template>
  <div class="order-list">
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="价格区间">
          <el-input-number v-model="searchForm.minPrice" :min="0" :precision="2" placeholder="最低价" style="width:120px" />
          <span style="margin:0 4px">-</span>
          <el-input-number v-model="searchForm.maxPrice" :min="0" :precision="2" placeholder="最高价" style="width:120px" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:240px" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.orderStatus" placeholder="不限" clearable style="width:140px">
            <el-option :value="1" label="待配送" /><el-option :value="2" label="配送中" />
            <el-option :value="3" label="已收货" /><el-option :value="4" label="已完成" />
            <el-option :value="5" label="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="用户手机号" clearable style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="handleReset"><el-icon><RefreshRight /></el-icon>重置</el-button>
        </el-form-item>
      </el-form>
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-label">排序方式：</span>
          <el-select v-model="sortState.sortBy" style="width:160px" @change="handleSearch">
            <el-option value="createTime" label="下单时间" />
            <el-option value="dispatchTime" label="发货时间" />
          </el-select>
          <el-select v-model="sortState.sortOrder" style="width:120px;margin-left:8px" @change="handleSearch">
            <el-option value="desc" label="新→旧" />
            <el-option value="asc" label="旧→新" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-dropdown @command="handleBatchOp" :disabled="selectedRows.length === 0">
            <el-button type="warning" :disabled="selectedRows.length === 0">
              批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="dispatch">批量发货</el-dropdown-item>
                <el-dropdown-item command="cancel">批量取消订单</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span style="margin-left:8px;color:#909399;font-size:13px">已选 {{ selectedRows.length }} 项</span>
        </div>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table :data="tableData" border v-loading="loading" style="width:100%"
        @selection-change="onSelectionChange" ref="tableRef">
        <el-table-column type="selection" width="50" />
        <el-table-column label="订单状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.orderStatus)" size="small">{{ statusLabel(row.orderStatus) }}</el-tag>
            <el-tag v-if="row.hasRefundRequest" type="warning" size="small" style="margin-top:2px">申请退款</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单信息" min-width="200">
          <template #default="{ row }">
            <div class="info-cell">
              <div>订单编号：{{ row.orderNo || row.id }}</div>
              <div>下单时间：{{ row.createTime }}</div>
              <div v-if="row.dispatchTime">发货时间：{{ row.dispatchTime }}</div>
              <div v-if="row.receiptTime">收货时间：{{ row.receiptTime }}</div>
              <div v-if="row.orderStatus === 5 && row.cancelTime">取消时间：{{ row.cancelTime }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="买家信息" width="150">
          <template #default="{ row }">
            <div class="buyer-cell">
              <el-avatar v-if="row.memberAvatar" :src="row.memberAvatar" :size="32" />
              <el-icon v-else :size="32"><UserFilled /></el-icon>
              <div class="buyer-phone"><el-icon><Phone /></el-icon> {{ row.receiverPhone || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="180">
          <template #default="{ row }">
            <div class="amount-cell">
              <div><span class="amount-label">商品件数：</span><span class="amount-value">{{ row.totalNum ?? 0 }}件</span></div>
              <div><span class="amount-label">总金额：</span><span class="amount-value">¥{{ row.totalMoney }}</span></div>
              <div><span class="amount-label">应收金额：</span><span class="amount-value">¥{{ row.payMoney }}</span></div>
              <div><span class="amount-label">实收金额：</span><span class="amount-value">¥{{ row.actualPayMoney }}</span></div>
<div><span class="amount-label">毛利：</span><span class="amount-value" style="color:#67c23a">¥{{ row.profitMoney ?? 0 }}</span></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收货信息" min-width="220">
          <template #default="{ row }">
            <div class="info-cell">
              <div>姓名：{{ row.receiverName || '-' }}</div>
              <div>手机：{{ row.receiverPhone || '-' }}</div>
              <div>地址：{{ row.receiverAddress || '-' }}</div>
              <div v-if="row.deliveryTime">配送时间：{{ row.deliveryTime }}</div>
              <div v-if="row.buyerMessage">订单备注：{{ row.buyerMessage }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button v-if="row.orderStatus === 1" type="primary" size="small" @click="handleDispatch(row)">配送</el-button>
              <el-button v-if="row.orderStatus === 1" type="danger" size="small" @click="handleCancel(row)">取消订单</el-button>
              <el-button v-if="row.orderStatus === 2" type="success" size="small" @click="handleConfirmReceipt(row)">确认收货</el-button>
              <el-dropdown @command="(cmd: string) => handleAction(cmd, row)">
                <el-button size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">订单详情</el-dropdown-item>
                    <el-dropdown-item v-if="row.hasRefundRequest" command="approveRefund">同意退款</el-dropdown-item>
                    <el-dropdown-item v-if="row.hasRefundRequest" command="rejectRefund">拒绝退款</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[6,12,20,50]" :total="pagination.counts" layout="total,sizes,prev,pager,next,jumper"
          @size-change="handleSearch" @current-change="loadTable" />
      </div>
    </el-card>

    <!-- Order Detail Drawer -->
    <el-drawer v-model="detailVisible" direction="rtl" size="1000px" title="订单详情" @close="orderDetail = null">
      <template v-if="orderDetail">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="订单信息" name="info">
            <el-card shadow="never" class="detail-card">
              <template #header><h4>基本信息</h4></template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="订单号">{{ orderDetail.id }}</el-descriptions-item>
                <el-descriptions-item label="订单状态">
                  <el-tag :type="statusType(orderDetail.orderStatus)" size="small">{{ statusLabel(orderDetail.orderStatus) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="订单备注">{{ orderDetail.buyerMessage || '-' }}</el-descriptions-item>
                <el-descriptions-item label="卖家备注">
                  <el-input v-model="sellerMessageDraft" type="textarea" :rows="5" style="width:100%" placeholder="卖家备注" />
                  <el-button type="primary" size="small" style="margin-top:6px" @click="saveSellerMessage">保存</el-button>
                </el-descriptions-item>
                <el-descriptions-item label="配送时间">{{ orderDetail.deliveryTime || '-' }}</el-descriptions-item>
                <el-descriptions-item label="收货人姓名">{{ orderDetail.receiver?.receiver || '-' }}</el-descriptions-item>
                <el-descriptions-item label="收货人电话">{{ orderDetail.receiver?.contact || '-' }}</el-descriptions-item>
                <el-descriptions-item label="收货地址">{{ (orderDetail.receiver?.fullLocation || '') + ' ' + (orderDetail.receiver?.address || '') || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
            <el-card shadow="never" class="detail-card" style="margin-top:12px">
              <template #header><h4>金额信息</h4></template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="总金额">¥{{ orderDetail.totalMoney }}</el-descriptions-item>
                <el-descriptions-item label="应收金额">¥{{ orderDetail.payMoney }}</el-descriptions-item>
                <el-descriptions-item label="实收金额">¥{{ orderDetail.actualPayMoney }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="商品信息" name="products">
            <el-table v-if="flatSkuList.length > 0" :data="flatSkuList" border size="small" style="width:100%">
              <el-table-column label="商品信息" width="260">
                <template #default="{ row: sku }">
                  <div style="display:flex;align-items:center;gap:10px">
                    <el-image v-if="sku._productPicture" :src="sku._productPicture" fit="cover" style="width:48px;height:48px;border-radius:4px;flex-shrink:0" />
                    <span style="font-size:13px;font-weight:500;color:#303133;line-height:1.3">{{ sku._productName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="规格" min-width="130">
                <template #default="{ row: sku }">{{ sku.attrsText || '-' }}</template>
              </el-table-column>
              <el-table-column label="原价" width="85">
                <template #default="{ row: sku }"><span style="color:#c0c4cc;text-decoration:line-through;font-size:12px">¥{{ sku.oldPrice }}</span></template>
              </el-table-column>
              <el-table-column label="现价" width="80">
                <template #default="{ row: sku }"><span style="color:#f56c6c">¥{{ sku.price }}</span></template>
              </el-table-column>
              <el-table-column label="成本价" width="85">
                <template #default="{ row: sku }"><span style="color:#909399">¥{{ sku.costPrice ?? '0.00' }}</span></template>
              </el-table-column>
              <el-table-column label="数量" width="60" prop="quantity" align="center" />
              <el-table-column label="毛利" width="85">
                <template #default="{ row: sku }"><span :style="{color: (sku.profitMoney ?? 0) >= 0 ? '#67c23a' : '#f56c6c', fontWeight:'600'}">¥{{ sku.profitMoney ?? '0.00' }}</span></template>
              </el-table-column>
              <el-table-column label="总价" width="85">
                <template #default="{ row: sku }"><span style="font-weight:600">¥{{ (sku.price * sku.quantity).toFixed(2) }}</span></template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无商品信息" />
          </el-tab-pane>

          <el-tab-pane label="订单时间线" name="timeline">
            <div class="timeline">
              <div v-for="(step, idx) in computedTimeline" :key="idx" class="timeline-item">
                <div class="timeline-left">
                  <div class="timeline-node" :class="{ active: step.done }" />
                </div>
                <div class="timeline-content">
                  <div class="timeline-time">{{ step.time }}</div>
                  <div class="timeline-desc">{{ step.desc }}</div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrders, getOrderDetail, dispatchOrder, batchDispatchOrder, batchCancelOrder, confirmReceipt, approveRefund, rejectRefund, cancelOrder, updateSellerMessage } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, RefreshRight, ArrowDown, Phone, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const tableRef = ref(null)
const selectedRows = ref<any[]>([])
const detailVisible = ref(false)
const orderDetail = ref<any>(null)
const activeTab = ref('info')
const sellerMessageDraft = ref('')

const searchForm = reactive({
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  dateRange: [] as string[],
  orderStatus: undefined as number | undefined,
  phone: '',
})

const sortState = reactive({ sortBy: 'createTime', sortOrder: 'desc' })
const pagination = reactive({ page: 1, pageSize: 12, counts: 0, pages: 0 })
const tableData = ref<any[]>([])

function statusLabel(status: number) {
  const map: Record<number, string> = { 1: '待配送', 2: '配送中', 3: '已收货', 4: '已完成', 5: '已取消' }
  return map[status] || '-'
}
function statusType(status: number) {
  const map: Record<number, string> = { 1: 'info', 2: 'primary', 3: 'warning', 4: 'success', 5: 'danger' }
  return map[status] || 'info'
}

function buildSearchParams() {
  const params: any = { page: pagination.page, pageSize: pagination.pageSize }
  if (searchForm.minPrice != null) params.priceMin = searchForm.minPrice
  if (searchForm.maxPrice != null) params.priceMax = searchForm.maxPrice
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    params.createTimeStart = searchForm.dateRange[0]; params.createTimeEnd = searchForm.dateRange[1]
  }
  if (searchForm.orderStatus) params.orderStatus = searchForm.orderStatus
  if (searchForm.phone) params.userPhone = searchForm.phone
  if (sortState.sortBy) params.sortBy = sortState.sortBy
  if (sortState.sortOrder) params.sortOrder = sortState.sortOrder
  return params
}

async function loadTable() {
  loading.value = true
  try {
    const data = await getOrders(buildSearchParams())
    if (data) { tableData.value = data.items || []; pagination.counts = data.counts || 0; pagination.pages = data.pages || 0 }
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadTable() }
function handleReset() {
  Object.assign(searchForm, { minPrice: undefined, maxPrice: undefined, dateRange: [], orderStatus: undefined, phone: '' })
  sortState.sortBy = 'createTime'; sortState.sortOrder = 'desc'
  pagination.page = 1; loadTable()
}

function onSelectionChange(selection: any[]) { selectedRows.value = selection }

async function handleBatchOp(cmd: string) {
  const ids = selectedRows.value.map((r: any) => r.id)
  if (ids.length === 0) return
  try {
    if (cmd === 'dispatch') {
      const invalid = selectedRows.value.filter((r: any) => r.orderStatus !== 1)
      if (invalid.length > 0) { ElMessage.warning('批量发货只能选择待配送状态的订单'); return }
      await ElMessageBox.confirm(`确认批量发货 ${ids.length} 个订单？`, '提示', { type: 'warning' })
      await batchDispatchOrder(ids); ElMessage.success(`已批量发货 ${ids.length} 个订单`)
    } else if (cmd === 'cancel') {
      const invalid = selectedRows.value.filter((r: any) => r.orderStatus === 4 || r.orderStatus === 5)
      if (invalid.length > 0) { ElMessage.warning('部分订单已完成或已取消，无法取消'); return }
      await ElMessageBox.confirm(`确认批量取消 ${ids.length} 个订单？`, '提示', { type: 'warning' })
      await batchCancelOrder(ids); ElMessage.success(`已批量取消 ${ids.length} 个订单`)
    }
    selectedRows.value = []; loadTable()
  } catch { /* cancelled */ }
}

async function openDetail(id: string) {
  activeTab.value = 'info'
  detailVisible.value = true
  try {
    orderDetail.value = await getOrderDetail(id)
    sellerMessageDraft.value = orderDetail.value?.sellerMessage || ''
  } catch { /* ignore */ }
}

async function saveSellerMessage() {
  if (!orderDetail.value) return
  try {
    await updateSellerMessage(orderDetail.value.id, sellerMessageDraft.value)
    orderDetail.value.sellerMessage = sellerMessageDraft.value
    ElMessage.success('卖家备注已保存')
  } catch { /* ignore */ }
}

const flatSkuList = computed(() => {
  if (!orderDetail.value?.products) return []
  const list: any[] = []
  for (const prod of orderDetail.value.products) {
    for (const sku of prod.skus || []) {
      list.push({ ...sku, _productName: prod.name, _productPicture: prod.picture })
    }
  }
  return list
})

const computedTimeline = computed(() => {
  if (!orderDetail.value) return []
  const steps: { time: string; desc: string }[] = []
  steps.push({ time: orderDetail.value.createTime, desc: '创建订单', done: true })
  if (orderDetail.value.orderStatus >= 2) steps.push({ time: orderDetail.value.modifyTime, desc: '商家发货', done: orderDetail.value.orderStatus >= 3 || orderDetail.value.orderStatus === 5 })
  if (orderDetail.value.orderStatus >= 3 && orderDetail.value.orderStatus !== 5) steps.push({ time: orderDetail.value.modifyTime, desc: '客户收货', done: orderDetail.value.orderStatus >= 4 || orderDetail.value.orderStatus === 5 })
  if (orderDetail.value.orderStatus === 5) steps.push({ time: orderDetail.value.modifyTime, desc: '订单取消', done: false })
  if (orderDetail.value.orderStatus !== 5 && steps.length > 0) steps[steps.length - 1].done = false
  return steps
})

function handleAction(cmd: string, row: any) {
  switch (cmd) {
    case 'detail': openDetail(row.id); break
    case 'cancel': handleCancel(row); break
    case 'confirmReceipt': handleConfirmReceipt(row); break
    case 'approveRefund': handleApproveRefund(row); break
    case 'rejectRefund': handleRejectRefund(row); break
  }
}

async function handleDispatch(row: any) {
  try {
    await ElMessageBox.confirm('确认发货？', '提示', { type: 'warning' })
    await dispatchOrder(row.id); ElMessage.success('发货成功'); row.orderStatus = 2
  } catch { /* ignore */ }
}
async function handleConfirmReceipt(row: any) {
  try {
    await ElMessageBox.confirm('确认收货？', '提示', { type: 'warning' })
    await confirmReceipt(row.id); ElMessage.success('已确认收货'); row.orderStatus = 3
  } catch { /* ignore */ }
}
async function handleApproveRefund(row: any) {
  try {
    await ElMessageBox.confirm('确认同意退款？', '提示', { type: 'warning' })
    await approveRefund(row.id); ElMessage.success('已同意退款'); row.orderStatus = 5; row.hasRefundRequest = false
  } catch { /* ignore */ }
}
async function handleRejectRefund(row: any) {
  try {
    await ElMessageBox.confirm('确认拒绝退款？', '提示', { type: 'warning' })
    await rejectRefund(row.id); ElMessage.success('已拒绝退款'); row.hasRefundRequest = false
  } catch { /* ignore */ }
}
async function handleCancel(row: any) {
  try {
    await ElMessageBox.confirm('确认取消该订单？', '提示', { type: 'warning' })
    await cancelOrder(row.id); ElMessage.success('已取消订单'); row.orderStatus = 5
  } catch { /* ignore */ }
}

onMounted(() => { loadTable() })
</script>

<style lang="scss" scoped>
.order-list { display: flex; flex-direction: column; gap: 16px; max-width: 1400px; margin: 0 auto; }
.search-card { margin-bottom: 0; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; align-items: center; }
.toolbar-label { font-size: 13px; color: #606266; margin-right: 4px; }
.toolbar-right { display: flex; align-items: center; }
.info-cell { font-size: 13px; line-height: 1.7; color: #303133; }
.info-cell > div { white-space: nowrap; }
.buyer-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 13px; }
.buyer-cell > .el-icon { font-size: 32px; color: #c0c4cc; }
.buyer-phone { display: flex; align-items: center; gap: 2px; }
.amount-cell { font-size: 13px; line-height: 1.7; color: #303133; }
.amount-cell > div { display: flex; align-items: baseline; }
.amount-label { flex-shrink: 0; width: 70px; text-align: right; color: #909399; margin-right: 2px; }
.amount-value { text-align: left; color: #303133; }
.action-buttons { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; width: 100%; }
.action-buttons > .el-button,
.action-buttons > .el-dropdown { align-self: flex-start; margin-left: 0 !important; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

.detail-card h4 { margin: 0; font-size: 14px; color: #303133; }
.detail-card :deep(.el-descriptions__label) { width: 100px; text-align: right; }

.product-group { margin-bottom: 16px; }

.timeline { padding: 8px 0; position: relative; }
.timeline::before { content: ''; position: absolute; left: 5px; top: 14px; bottom: 14px; width: 2px; background: #e4e7ed; }
.timeline-item { display: flex; align-items: flex-start; gap: 14px; padding-bottom: 28px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-left { position: relative; width: 12px; flex-shrink: 0; display: flex; justify-content: center; padding-top: 2px; }
.timeline-node { width: 12px; height: 12px; border-radius: 50%; background: #409EFF; z-index: 1; flex-shrink: 0; }
.timeline-node:not(.active) { background: #c0c4cc; }
.timeline-content { white-space: nowrap; }
.timeline-time { font-size: 13px; color: #909399; }
.timeline-desc { font-size: 14px; color: #303133; font-weight: 500; margin-top: 2px; }
</style>
