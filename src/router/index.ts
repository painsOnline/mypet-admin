import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'product',
        name: 'ProductList',
        component: () => import('@/views/product/ProductListView.vue'),
      },
      {
        path: 'product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/product/ProductDetailView.vue'),
        props: true,
      },
      {
        path: 'product/category',
        name: 'CategoryList',
        component: () => import('@/views/product/CategoryListView.vue'),
      },
      {
        path: 'product/type',
        name: 'TypeList',
        component: () => import('@/views/product/TypeListView.vue'),
      },
      {
        path: 'product/brand',
        name: 'BrandList',
        component: () => import('@/views/product/BrandListView.vue'),
      },
      {
        path: 'order/pending',
        name: 'PendingOrder',
        component: () => import('@/views/order/PendingOrderView.vue'),
      },
      {
        path: 'order',
        name: 'OrderList',
        component: () => import('@/views/order/OrderListView.vue'),
      },
      {
        path: 'order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetailView.vue'),
        props: true,
      },
      {
        path: 'statistics/sales',
        name: 'SalesStatistics',
        component: () => import('@/views/statistics/SalesStatisticsView.vue'),
      },
      {
        path: 'statistics/products',
        name: 'ProductStatistics',
        component: () => import('@/views/statistics/ProductStatisticsView.vue'),
      },
      {
        path: 'user',
        name: 'UserList',
        component: () => import('@/views/user/UserListView.vue'),
      },
      {
        path: 'shop/settings',
        name: 'ShopSettings',
        component: () => import('@/views/settings/ShopSettingsView.vue'),
      },
      {
        path: 'shop/hot-products',
        name: 'HotProducts',
        component: () => import('@/views/settings/HotProductsView.vue'),
      },
      {
        path: 'settings/password',
        name: 'Password',
        component: () => import('@/views/settings/PasswordView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
