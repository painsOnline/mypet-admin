import request from './request'

export function getList(params) {
  return request.get('/admin/product', { params })
}

export function getDetail(id) {
  return request.get(`/admin/product/${id}`)
}

export function create(data) {
  return request.post('/admin/product', data)
}

export function update(id, data) {
  return request.put(`/admin/product/${id}`, data)
}

export function remove(id) {
  return request.delete(`/admin/product/${id}`)
}

export function toggleHot(id) {
  return request.put(`/admin/product/${id}/hot`)
}

export function getSkus(productId) {
  return request.get(`/admin/product/${productId}/sku`)
}

export function saveSku(productId, data) {
  return request.post(`/admin/product/${productId}/sku`, data)
}

export function updateSku(skuId, data) {
  return request.put(`/admin/product/${data.productId}/sku/${skuId}`, data)
}

export function deleteSku(productId, skuId) {
  return request.delete(`/admin/product/${productId}/sku/${skuId}`)
}

export function generateSkus(productId, typeId) {
  return request.post(`/admin/product/${productId}/sku/generate`, null, { params: { typeId } })
}
