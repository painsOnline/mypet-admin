<template>
  <div class="pending-order">
    <el-card>
      <h3 class="page-subtitle">待处理订单（待配送 + 退款申请）</h3>

      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="订单号" width="160" show-overflow-tooltip />
        <el-table-column label="订单状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="pendingStatusType(row)" size="small">
              {{ pendingStatusLabel(row) }}
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
            <div class="buyer-row">
              <el-avatar v-if="row.memberAvatar" :src="row.memberAvatar" :size="24" />
              <span v-else style="color:#c0c4cc;font-size:20px">⚪</span>
              <span style="margin-left:4px">{{ row.memberMobile || '-' }}</span>
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleViewDetail(row)">详情</el-button>
              <el-button v-if="row.orderStatus === 1" type="success" size="small" @click="handleDispatch(row)">发货</el-button>
              <el-button v-if="row.orderStatus === 3 && row.hasRefundRequest" type="success" size="small" @click="handleApproveRefund(row)">同意退款</el-button>
              <el-button v-if="row.orderStatus === 3 && row.hasRefundRequest" type="danger" size="small" @click="handleRejectRefund(row)">拒绝退款</el-button>
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
          @size-change="loadTable"
          @current-change="loadTable"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPendingOrders, dispatchOrder, approveRefund, rejectRefund } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 12,
  counts: 0,
  pages: 0,
})

const tableData = ref([])

function pendingStatusLabel(row) {
  if (row.hasRefundRequest) return '待退款'
  if (row.orderStatus === 1) return '待配送'
  return '-'
}

function pendingStatusType(row) {
  if (row.hasRefundRequest) return 'warning'
  if (row.orderStatus === 1) return 'info'
  return 'info'
}

async function loadTable() {
  loading.value = true
  try {
    const data = await getPendingOrders({
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
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

function handleViewDetail(row) {
  router.push(`/order/${row.id}`)
}

async function handleDispatch(row) {
  try {
    await ElMessageBox.confirm('确认发货？', '提示', { type: 'warning' })
    await dispatchOrder(row.id)
    ElMessage.success('发货成功')
    await loadTable()
  } catch (e) {
    // cancelled or error
  }
}

async function handleApproveRefund(row) {
  try {
    await ElMessageBox.confirm('确定同意退款？退款需线下处理。', '提示', { type: 'warning' })
    await approveRefund(row.id)
    ElMessage.success('已同意退款')
    await loadTable()
  } catch (e) {
    // cancelled or error
  }
}

async function handleRejectRefund(row) {
  try {
    await ElMessageBox.confirm('确定拒绝退款？', '提示', { type: 'warning' })
    await rejectRefund(row.id)
    ElMessage.success('已拒绝退款')
    await loadTable()
  } catch (e) {
    // cancelled or error
  }
}

onMounted(() => {
  loadTable()
})
</script>

<style lang="scss" scoped>
.pending-order {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.info-cell { line-height: 1.6; font-size: 13px; }
.buyer-row { display: flex; align-items: center; }
.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
