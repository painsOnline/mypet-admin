<template>
  <div class="sales-statistics">
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

    <!-- Order Volume Trend -->
    <el-card class="chart-card">
      <template #header><h3>订单量趋势图</h3></template>
      <v-chart :option="volumeOption" style="height:360px" autoresize />
    </el-card>

    <!-- Order Amount Trend -->
    <el-card class="chart-card" style="margin-top:16px">
      <template #header><h3>订单金额趋势图</h3></template>
      <v-chart :option="amountOption" style="height:360px" autoresize />
    </el-card>

    <!-- Profit Trend -->
    <el-card class="chart-card" style="margin-top:16px">
      <template #header><h3>毛利润趋势图</h3></template>
      <v-chart :option="profitOption" style="height:360px" autoresize />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import request from '@/api/request'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const quickType = ref('7d')
const dateRange = ref<string[]>([])
const trendData = ref<any[]>([])

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
  try {
    const data = await request({
      url: '/admin/statistics/order-trend',
      method: 'get',
      params: { startDate: dateRange.value[0], endDate: dateRange.value[1] },
    })
    trendData.value = (data && data.points) || []
  } catch { /* ignore */ }
}

const volumeOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 60, right: 30, top: 30, bottom: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: trendData.value.map((p) => p.dateKey),
    axisLabel: { rotate: trendData.value.length > 31 ? 45 : 0 },
  },
  yAxis: { type: 'value', name: '订单量' },
  series: [{
    name: '订单量',
    type: 'line',
    data: trendData.value.map((p) => p.orderCount),
    smooth: true,
    areaStyle: { opacity: 0.15 },
    itemStyle: { color: '#409EFF' },
  }],
}))

const amountOption = computed(() => ({
  tooltip: { trigger: 'axis', valueFormatter: (val) => '¥' + (Number(val) || 0).toFixed(2) },
  grid: { left: 80, right: 30, top: 30, bottom: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: trendData.value.map((p) => p.dateKey),
    axisLabel: { rotate: trendData.value.length > 31 ? 45 : 0 },
  },
  yAxis: { type: 'value', name: '金额(元)' },
  series: [{
    name: '实付金额',
    type: 'line',
    data: trendData.value.map((p) => p.totalAmount),
    smooth: true,
    areaStyle: { opacity: 0.15 },
    itemStyle: { color: '#67C23A' },
  }],
}))

const profitOption = computed(() => ({
  tooltip: { trigger: 'axis', valueFormatter: (val: any) => '¥' + (Number(val) || 0).toFixed(2) },
  grid: { left: 80, right: 30, top: 30, bottom: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: trendData.value.map((p: any) => p.dateKey),
    axisLabel: { rotate: trendData.value.length > 31 ? 45 : 0 },
  },
  yAxis: { type: 'value', name: '利润(元)' },
  series: [{
    name: '毛利润',
    type: 'line',
    data: trendData.value.map((p: any) => p.profitAmount || 0),
    smooth: true,
    areaStyle: { opacity: 0.15 },
    itemStyle: { color: '#E6A23C' },
  }],
}))

onMounted(() => {
  setQuick('7d')
})
</script>

<style lang="scss" scoped>
.sales-statistics { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

.filter-card { margin-bottom: 0; }
.filter-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.quick-btns { display: flex; gap: 6px; flex-wrap: wrap; }

.chart-card h3 { margin: 0; font-size: 16px; color: #303133; }
</style>
