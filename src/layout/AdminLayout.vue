<template>
  <el-container class="h-full">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <h2>{{ shopTitle }}</h2>
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
          <el-menu-item index="/product/specs">
            <el-icon><Collection /></el-icon>
            <span>公共属性</span>
          </el-menu-item>
          <el-menu-item index="/product/brand">
            <el-icon><PriceTag /></el-icon>
            <span>品牌管理</span>
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
        <el-sub-menu index="user-group">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/user">
            <el-icon><List /></el-icon>
            <span>用户列表</span>
          </el-menu-item>
        </el-sub-menu>
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
          <span class="shop-name">{{ shopTitle }}</span>
        </div>
        <div class="header-right">
          <span class="admin-info">
            <el-icon><UserFilled /></el-icon>
            {{ authStore.adminInfo.account }}
          </span>
          <el-button type="danger" size="small" text @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view v-slot="{ Component }">
          <keep-alive :include="cachedViews">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'
import { getShopSettings } from '@/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const cachedViews = ref(['ProductList'])
const shopName = ref('')
const shopTitle = computed(() => shopName.value ? `宠物社区私域-${shopName.value}` : '宠物社区私域')

async function loadShop() {
  try {
    const shop = await getShopSettings()
    if (shop) {
      shopName.value = shop.name || ''
      document.title = shopTitle.value + ' - 店主管理后台'
    }
  } catch {}
}

onMounted(() => loadShop())

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
  }).then(() => { authStore.logout(); router.push('/login') }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.aside {
  background-color: #304156;
  overflow-y: auto;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  .logo {
    padding: 20px 12px;
    h2 {
      color: #fff;
      font-size: 16px;
      text-align: center;
    }
  }
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
}
.header-left .shop-name { font-size: 16px; font-weight: 600; }
.header-right { display: flex; align-items: center; gap: 12px; }
.shop-name { font-size: 16px; font-weight: 600; }
:deep(.el-container) { margin-left: 220px; }
</style>
