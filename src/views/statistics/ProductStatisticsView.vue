<template>
  <div class="product-statistics">
    <!-- Date range controls -->
    <el-card class="filter-card">
      <div class="filter-bar">
        <div class="quick-btns">
          <el-button :type="quickType === '7d' ? 'primary' : ''" size="small" @click="setQuick('7d')">最近7日</el-button>
          <el-button :type="quickType === '30d' ? 'primary' : ''" size="small" @click="setQuick('30d')">最近30日</el-button>
          <el-button :type="quickType === 'week' ? 'primary' : ''" size="small" @click="setQuick('week')">本周</el-button>
          <el-button :type="quickType === 'month' ? 'primary' : ''" size="small" @click="setQuick('month')">本月</el-button>
          <el-button :type="quickType === 'lastMonth' ? 'primary' : ''" size="small" @click="setQuick('lastMonth')">上月</el-button>
          <el-button :type="quickType === 'halfYear' ? 'primary' : ''" size="small" @click="setQuick('halfYear')">半年</el-button>
        </div>
        <div class="date-range">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            @change="fetchData"
          />
        </div>
      </div>
    </el-card>

    <!-- Top 20 Table -->
    <el-card class="chart-card">
      <template #header>
        <div class="top-header">
          <h3>商品销量TOP{{ topData.length }}</h3>
          <span class="top-subtitle">按销售数量降序排列</span>
        </div>
      </template>
      <el-table :data="topData" border stripe style="width:100%" v-loading="loading">
        <el-table-column type="index" label="排名" width="80" align="center">
          <template #default="{ $index }">
            <el-tag :type="$index < 3 ? 'danger' : 'info'" size="small" effect="dark">{{ $index + 1 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="300" show-overflow-tooltip />
        <el-table-column prop="totalSales" label="销售数量" width="160" align="center" sortable>
          <template #default="{ row }">
            <span style="font-weight:600;color:#f56c6c">{{ row.totalSales }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="topData.length === 0 && !loading" class="empty-hint">暂无数据，请选择时间区间后查询</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const quickType = ref('7d')
const dateRange = ref<string[]>([])
const topData = ref<any[]>([])
const loading = ref(false)

function disabledDate(time: Date) {
  const now = Date.now()
  const yearAgo = now - 365 * 24 * 3600 * 1000
  return time.getTime() > now || time.getTime() < yearAgo
}

function setQuick(type: string) {
  quickType.value = type
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let start: Date
  switch (type) {
    case '7d':
      start = new Date(end)
      start.setDate(end.getDate() - 6)
      break
    case '30d':
      start = new Date(end)
      start.setDate(end.getDate() - 29)
      break
    case 'week': {
      const day = end.getDay() || 7
      start = new Date(end)
      start.setDate(end.getDate() - day + 1)
      break
    }
    case 'month':
      start = new Date(end.getFullYear(), end.getMonth(), 1)
      break
    case 'lastMonth': {
      const prevEnd = new Date(end.getFullYear(), end.getMonth(), 0)
      start = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1)
      dateRange.value = [fmt(start), fmt(prevEnd)]
      fetchData()
      return
    }
    case 'halfYear':
      start = new Date(end)
      start.setMonth(end.getMonth() - 6)
      break
    default:
      return
  }
  dateRange.value = [fmt(start), fmt(end)]
  fetchData()
}

function fmt(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function fetchData() {
  if (!dateRange.value || dateRange.value.length !== 2) return
  loading.value = true
  try {
    const data = await request({
      url: '/admin/statistics/product-top',
      method: 'get',
      params: { startDate: dateRange.value[0], endDate: dateRange.value[1] },
    })
    topData.value = (data && data.items) || []
  } catch { /* ignore */ }
  finally { loading.value = false }
}

onMounted(() => {
  setQuick('7d')
})
</script>

<style lang="scss" scoped>
.product-statistics { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

.filter-card { margin-bottom: 0; }
.filter-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.quick-btns { display: flex; gap: 6px; flex-wrap: wrap; }

.chart-card h3 { margin: 0; font-size: 16px; color: #303133; }
.top-header { display: flex; align-items: baseline; gap: 12px; }
.top-subtitle { font-size: 13px; color: #909399; }
.empty-hint { text-align: center; padding: 60px 0; color: #c0c4cc; font-size: 14px; }
</style>
