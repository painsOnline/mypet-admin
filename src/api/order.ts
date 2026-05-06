import request from './request'

export function getPending() {
  return request.get('/admin/order/pending')
}

export function getList(params) {
  return request.get('/admin/order', { params })
}

export function getDetail(id) {
  return request.get(`/admin/order/${id}`)
}

export function dispatch(id) {
  return request.put(`/admin/order/${id}/delivery`)
}

export function confirmReceipt(id) {
  return request.put(`/admin/order/${id}/receipt`)
}

export function approveRefund(id) {
  return request.put(`/admin/order/${id}/refund/approve`)
}

export function rejectRefund(id) {
  return request.put(`/admin/order/${id}/refund/reject`)
}

export function cancel(id) {
  return request.put(`/admin/order/${id}/cancel`)
}
