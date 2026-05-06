import request from './request'

// ---- Dashboard ----
export function getDashboardStats() {
  return request({ url: '/admin/dashboard/stats', method: 'get' })
}

// ---- Product ----
export function getProducts(params) {
  return request({ url: '/admin/product', method: 'get', params })
}

export function getProductDetail(id) {
  return request({ url: `/admin/product/${id}`, method: 'get' })
}

export function createProduct(data) {
  return request({ url: '/admin/product', method: 'post', data })
}

export function updateProduct(id, data) {
  return request({ url: `/admin/product/${id}`, method: 'put', data })
}

export function deleteProduct(id) {
  return request({ url: `/admin/product/${id}`, method: 'delete' })
}

export function toggleHotProduct(id) {
  return request({ url: `/admin/product/${id}/hot`, method: 'put' })
}

export function toggleProductEnable(id) {
  return request({ url: `/admin/product/${id}/enable`, method: 'put' })
}

export function generateSkus(productTypeId) {
  return request({ url: `/admin/product/generateSkus/${productTypeId}`, method: 'get' })
}

// ---- Category ----
export function getCategories() {
  return request({ url: '/admin/category', method: 'get' })
}

export function createCategory(data) {
  return request({ url: '/admin/category', method: 'post', data })
}

export function updateCategory(id, data) {
  return request({ url: `/admin/category/${id}`, method: 'put', data })
}

export function deleteCategory(id) {
  return request({ url: `/admin/category/${id}`, method: 'delete' })
}

// ---- Product Type ----
export function getTypes() {
  return request({ url: '/admin/type', method: 'get' })
}

export function createType(data) {
  return request({ url: '/admin/type', method: 'post', data })
}

export function updateType(id, data) {
  return request({ url: `/admin/type/${id}`, method: 'put', data })
}

export function deleteType(id) {
  return request({ url: `/admin/type/${id}`, method: 'delete' })
}

export function getTypeSpecs(typeId) {
  return request({ url: `/admin/type/${typeId}/specs`, method: 'get' })
}

export function createSpec(data) {
  return request({ url: '/admin/spec', method: 'post', data })
}

export function updateSpec(id, data) {
  return request({ url: `/admin/spec/${id}`, method: 'put', data })
}

export function deleteSpec(id) {
  return request({ url: `/admin/spec/${id}`, method: 'delete' })
}

// ---- Order ----
export function getOrders(params) {
  return request({ url: '/admin/order', method: 'get', params })
}

export function getPendingOrders(params) {
  return request({ url: '/admin/order/pending', method: 'get', params })
}

export function getOrderDetail(id) {
  return request({ url: `/admin/order/${id}`, method: 'get' })
}

export function dispatchOrder(id) {
  return request({ url: `/admin/order/${id}/dispatch`, method: 'put' })
}

export function batchDispatchOrder(ids) {
  return request({ url: '/admin/order/batch/dispatch', method: 'put', data: ids })
}

export function batchCancelOrder(ids) {
  return request({ url: '/admin/order/batch/cancel', method: 'put', data: ids })
}

export function confirmReceipt(id) {
  return request({ url: `/admin/order/${id}/confirmReceipt`, method: 'put' })
}

export function approveRefund(id) {
  return request({ url: `/admin/order/${id}/approveRefund`, method: 'put' })
}

export function rejectRefund(id) {
  return request({ url: `/admin/order/${id}/rejectRefund`, method: 'put' })
}

export function cancelOrder(id) {
  return request({ url: `/admin/order/${id}/cancel`, method: 'put' })
}

// ---- User ----
export function getUsers(params) {
  return request({ url: '/admin/user', method: 'get', params })
}

// ---- Shop Settings ----
export function getShopSettings() {
  return request({ url: '/admin/shop', method: 'get' })
}

export function saveShopSettings(data) {
  return request({ url: '/admin/shop', method: 'put', data })
}

export function getHotProducts() {
  return request({ url: '/admin/hot', method: 'get' })
}

export function saveHotProducts(data) {
  return request({ url: '/admin/hot/sort', method: 'put', data })
}
