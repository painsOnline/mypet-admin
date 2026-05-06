<template>
  <div class="user-list">
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="注册时间">
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
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar v-if="row.avatar" :src="row.avatar" :size="40" />
            <el-avatar v-else :size="40">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="createTime" label="注册时间" width="170" />
        <el-table-column label="订单数" width="90" align="center">
          <template #default="{ row }">
            {{ row.orderCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="消费总额" width="110">
          <template #default="{ row }">
            {{ row.totalAmount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="平均消费" width="110">
          <template #default="{ row }">
            {{ row.avgAmount || 0 }}
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
import { getUsers } from '@/api'
import { Search, RefreshRight } from '@element-plus/icons-vue'

const loading = ref(false)

const searchForm = reactive({
  phone: '',
  dateRange: [],
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  counts: 0,
  pages: 0,
})

const tableData = ref([])

function buildSearchParams() {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize,
  }
  if (searchForm.phone) params.phone = searchForm.phone
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    params.startDate = searchForm.dateRange[0]
    params.endDate = searchForm.dateRange[1]
  }
  return params
}

async function loadTable() {
  loading.value = true
  try {
    const data = await getUsers(buildSearchParams())
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
  Object.assign(searchForm, { phone: '', dateRange: [] })
  pagination.page = 1
  await loadTable()
}

onMounted(() => {
  loadTable()
})
</script>

<style lang="scss" scoped>
.user-list {
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

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
