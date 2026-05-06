import request from './request'

export function listAll() {
  return request.get('/admin/product/type')
}

export function create(data) {
  return request.post('/admin/product/type', data)
}

export function update(id, data) {
  return request.put(`/admin/product/type/${id}`, data)
}

export function remove(id) {
  return request.delete(`/admin/product/type/${id}`)
}

export function getSpecs(typeId) {
  return request.get(`/admin/product/type/${typeId}/specs`)
}
