<template>
  <div class="order-list">
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
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
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.orderStatus" placeholder="请选择" clearable style="width: 130px">
            <el-option :value="1" label="待配送" />
            <el-option :value="2" label="配送中" />
            <el-option :value="3" label="已收货" />
            <el-option :value="4" label="已完成" />
            <el-option :value="5" label="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="收货人手机号" clearable style="width: 160px" />
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
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="订单号" width="160" show-overflow-tooltip />
        <el-table-column label="订单状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.orderStatus)" size="small">
              {{ statusLabel(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单信息" min-width="180">
          <template #default="{ row }">
            <div class="info-cell">
              <div>下单：{{ row.createTime }}</div>
              <div>发货：{{ row.dispatchTime || '-' }}</div>
              <div>收货：{{ row.receiptTime || '-' }}</div>
              <div v-if="row.orderStatus === 5">取消：{{ row.cancelTime || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="买家信息" width="140">
          <template #default="{ row }">
            <div class="info-cell">
              <div class="buyer-row">
                <el-avatar v-if="row.memberAvatar" :src="row.memberAvatar" :size="24" />
                <span v-else style="color:#c0c4cc;font-size:20px">⚪</span>
                <span style="margin-left:4px">{{ row.memberMobile || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="160">
          <template #default="{ row }">
            <div class="info-cell">
              <div>总：{{ row.totalMoney }}</div>
              <div>应：{{ row.payMoney }}</div>
              <div>实：{{ row.actualPayMoney }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收货信息" min-width="200">
          <template #default="{ row }">
            <div class="info-cell">
              <div>{{ row.receiverName || '-' }} {{ row.receiverPhone || '-' }}</div>
              <div style="font-size:12px;color:#909399">{{ row.receiverAddress || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleViewDetail(row)">详情</el-button>
              <el-button v-if="row.orderStatus === 1" type="success" size="small" @click="handleDispatch(row)">发货</el-button>
              <el-button v-if="row.orderStatus === 2" type="warning" size="small" @click="handleConfirmReceipt(row)">确认收货</el-button>
              <el-popconfirm v-if="row.orderStatus !== 4 && row.orderStatus !== 5" title="确定要取消该订单吗？" @confirm="handleCancel(row)">
                <template #reference>
                  <el-button type="danger" size="small">取消</el-button>
                </template>
              </el-popconfirm>
            </div>
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
          @size-change="handleSearch"
          @current-change="loadTable"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getOrders,
  dispatchOrder,
  confirmReceipt,
  approveRefund,
  rejectRefund,
  cancelOrder,
} from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, RefreshRight } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)

const searchForm = reactive({
  minPrice: undefined,
  maxPrice: undefined,
  dateRange: [],
  orderStatus: '',
  phone: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  counts: 0,
  pages: 0,
})

const tableData = ref([])

function statusLabel(status) {
  const map = { 1: '待配送', 2: '配送中', 3: '已收货', 4: '已完成', 5: '已取消' }
  return map[status] || '未知'
}

function statusType(status) {
  const map = { 1: 'info', 2: 'primary', 3: 'warning', 4: 'success', 5: 'danger' }
  return map[status] || 'info'
}

function buildSearchParams() {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize,
  }
  if (searchForm.minPrice !== undefined && searchForm.minPrice !== null) params.minPrice = searchForm.minPrice
  if (searchForm.maxPrice !== undefined && searchForm.maxPrice !== null) params.maxPrice = searchForm.maxPrice
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    params.startDate = searchForm.dateRange[0]
    params.endDate = searchForm.dateRange[1]
  }
  if (searchForm.orderStatus) params.orderStatus = searchForm.orderStatus
  if (searchForm.phone) params.phone = searchForm.phone
  return params
}

async function loadTable() {
  loading.value = true
  try {
    const data = await getOrders(buildSearchParams())
    if (data) {
      tableData.value = data.items || []
      pagination.counts = data.counts || 0
      pagination.pages = data.pages || 0
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

async function handleReset() {
  Object.assign(searchForm, {
    minPrice: undefined,
    maxPrice: undefined,
    dateRange: [],
    orderStatus: '',
    phone: '',
  })
  pagination.page = 1
  await loadTable()
}

function handleViewDetail(row) {
  router.push(`/order/${row.id}`)
}

async function handleDispatch(row) {
  try {
    await ElMessageBox.confirm('确认发货？', '提示', { type: 'warning' })
    await dispatchOrder(row.id)
    ElMessage.success('发货成功')
    row.orderStatus = 2
  } catch (e) {
    // cancelled or error
  }
}

async function handleConfirmReceipt(row) {
  try {
    await ElMessageBox.confirm('确认收货？', '提示', { type: 'warning' })
    await confirmReceipt(row.id)
    ElMessage.success('已确认收货')
    row.orderStatus = 3
  } catch (e) {
    // cancelled or error
  }
}

async function handleApproveRefund(row) {
  try {
    await ElMessageBox.confirm('确定同意退款？退款需线下处理。', '提示', { type: 'warning' })
    await approveRefund(row.id)
    ElMessage.success('已同意退款')
    row.orderStatus = 5
  } catch (e) {
    // cancelled or error
  }
}

async function handleRejectRefund(row) {
  try {
    await ElMessageBox.confirm('确定拒绝退款？', '提示', { type: 'warning' })
    await rejectRefund(row.id)
    ElMessage.success('已拒绝退款')
    row.hasRefundRequest = false
  } catch (e) {
    // cancelled or error
  }
}

async function handleCancel(row) {
  try {
    await cancelOrder(row.id)
    ElMessage.success('订单已取消')
    row.orderStatus = 5
  } catch (e) {
    // handled
  }
}

onMounted(() => {
  loadTable()
})
</script>

<style lang="scss" scoped>
.order-list {
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

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.info-cell { line-height: 1.6; font-size: 13px; }
.buyer-row { display: flex; align-items: center; }

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
