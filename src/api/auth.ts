import request from './request'

export function login(account, password, captchaToken?, captchaInput?) {
  return request({
    url: '/admin/login',
    method: 'post',
    data: { account, password, captchaToken, captchaInput }
  })
}

export function getCaptcha() {
  return request({
    url: '/admin/captcha',
    method: 'get'
  })
}

export function changePassword(data) {
  return request({
    url: '/admin/password',
    method: 'put',
    data
  })
}
