<template>
  <div class="order-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>订单详情</h3>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>

      <div v-if="!order.id && !loading" class="empty-state">
        <el-empty description="订单不存在" />
      </div>

      <template v-if="order.id">
        <el-divider content-position="left">客户信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="收货人">
            {{ order.receiverName || order.receiver || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ order.receiverPhone || order.contact || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ order.receiverAddress || order.address || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">订单信息</el-divider>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="订单ID">
            {{ order.id }}
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="statusType(order.orderStatus)" size="small">
              {{ statusLabel(order.orderStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">
            {{ order.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="商品总价">
            {{ order.totalMoney || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="实付金额">
            {{ order.actualPayMoney || order.payMoney || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="运费">
            {{ order.totalMoney && order.actualPayMoney ? (order.totalMoney - order.actualPayMoney).toFixed(2) : '0.00' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">商品明细</el-divider>
        <el-table :data="order.products || []" border style="width: 100%">
          <el-table-column label="商品名称" min-width="180">
            <template #default="{ row: product }">
              <div style="display: flex; align-items: center; gap: 8px">
                <el-image
                  v-if="product.picture"
                  :src="product.picture"
                  fit="cover"
                  style="width: 48px; height: 48px; border-radius: 4px; flex-shrink: 0"
                />
                <span>{{ product.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="SKU规格" min-width="180">
            <template #default="{ row: product }">
              <div v-if="product.specs" style="display: flex; flex-wrap: wrap; gap: 4px">
                <el-tag
                  v-for="(spec, si) in (Array.isArray(product.specs) ? product.specs : [])"
                  :key="si"
                  size="small"
                >
                  {{ spec.name }}: {{ spec.valueName }}
                </el-tag>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="100">
            <template #default="{ row: product }">
              {{ product.price }}
            </template>
          </el-table-column>
          <el-table-column label="数量" width="80">
            <template #default="{ row: product }">
              {{ product.inventory || product.count || 1 }}
            </template>
          </el-table-column>
          <el-table-column label="小计" width="110">
            <template #default="{ row: product }">
              {{ ((product.price || 0) * (product.inventory || product.count || 1)).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderDetail } from '@/api'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
})

const router = useRouter()
const loading = ref(false)

const order = reactive({
  id: '',
  orderStatus: 0,
  createTime: '',
  totalMoney: 0,
  actualPayMoney: 0,
  payMoney: 0,
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  products: [],
})

function statusLabel(status) {
  const map = { 1: '待配送', 2: '配送中', 3: '已收货', 4: '已完成', 5: '已取消' }
  return map[status] || '未知'
}

function statusType(status) {
  const map = { 1: 'info', 2: 'primary', 3: 'warning', 4: 'success', 5: 'danger' }
  return map[status] || 'info'
}

async function loadOrder(id) {
  loading.value = true
  try {
    const data = await getOrderDetail(id)
    if (data) {
      Object.assign(order, data)
    }
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.id) {
    loadOrder(props.id)
  }
})
</script>

<style lang="scss" scoped>
.order-detail {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.empty-state {
  padding: 40px 0;
}
</style>
