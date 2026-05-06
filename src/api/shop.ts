import request from './request'

export function getConfig() {
  return request.get('/admin/shop')
}

export function updateConfig(data) {
  return request.put('/admin/shop', data)
}

export function getHotProducts() {
  return request.get('/admin/hot')
}

export function updateHotSort(data) {
  return request.put('/admin/hot/sort')
}
