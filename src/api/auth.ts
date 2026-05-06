import request from './request'

export function login(account, password) {
  return request({
    url: '/admin/login',
    method: 'post',
    data: { account, password }
  })
}

export function changePassword(data) {
  return request({
    url: '/admin/password',
    method: 'put',
    data
  })
}
