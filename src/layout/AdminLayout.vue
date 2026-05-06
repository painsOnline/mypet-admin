<template>
  <el-container class="h-full">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <h2>宠物用品社区店</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-sub-menu index="statistics-group">
          <template #title>
            <el-icon><DataLine /></el-icon>
            <span>数据统计</span>
          </template>
          <el-menu-item index="/statistics/sales">
            <el-icon><TrendCharts /></el-icon>
            <span>销售额统计</span>
          </el-menu-item>
          <el-menu-item index="/statistics/products">
            <el-icon><PieChart /></el-icon>
            <span>商品统计</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="product-group">
          <template #title>
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </template>
          <el-menu-item index="/product">
            <el-icon><List /></el-icon>
            <span>商品列表</span>
          </el-menu-item>
          <el-menu-item index="/product/category">
            <el-icon><CollectionTag /></el-icon>
            <span>商品分类</span>
          </el-menu-item>
          <el-menu-item index="/product/type">
            <el-icon><Setting /></el-icon>
            <span>商品类型</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="order-group">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/order/pending">
            <el-icon><Clock /></el-icon>
            <span>待处理订单</span>
          </el-menu-item>
          <el-menu-item index="/order">
            <el-icon><List /></el-icon>
            <span>订单列表</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-sub-menu index="shop-group">
          <template #title>
            <el-icon><Shop /></el-icon>
            <span>店铺管理</span>
          </template>
          <el-menu-item index="/shop/settings">
            <el-icon><Setting /></el-icon>
            <span>店铺设置</span>
          </el-menu-item>
          <el-menu-item index="/shop/hot-products">
            <el-icon><Star /></el-icon>
            <span>热门商品</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/settings/password">
          <el-icon><Lock /></el-icon>
          <span>修改密码</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="shop-name">宠物用品社区店</span>
        </div>
        <div class="header-right">
          <span class="admin-info">
            <el-icon><UserFilled /></el-icon>
            {{ authStore.adminInfo?.account || '管理员' }}
          </span>
          <el-button type="danger" size="small" @click="handleLogout" text>
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    authStore.logout()
    router.push('/login')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.h-full {
  height: 100vh;
}

.aside {
  background-color: #304156;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.logo h2 {
  color: #fff;
  font-size: 16px;
  margin: 0;
  white-space: nowrap;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.shop-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.el-menu {
  border-right: none;
}
</style>
