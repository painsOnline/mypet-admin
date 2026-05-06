import request from './request'

export function listAll() {
  return request.get('/admin/category')
}

export function create(data) {
  return request.post('/admin/category', data)
}

export function update(id, data) {
  return request.put(`/admin/category/${id}`, data)
}

export function remove(id) {
  return request.delete(`/admin/category/${id}`)
}
