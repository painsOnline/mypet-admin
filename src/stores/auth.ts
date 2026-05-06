import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const tenantCode = ref('')
  const adminInfo = ref({
    account: '',
    lastLoginTime: ''
  })

  const isLoggedIn = computed(() => !!token.value)

  async function login(tCode, account, password) {
    tenantCode.value = tCode
    const data = await loginApi(account, password)
    token.value = data.token
    adminInfo.value = {
      account: data.adminName || data.account || account,
      lastLoginTime: data.lastLoginTime || ''
    }
  }

  function logout() {
    token.value = ''
    tenantCode.value = ''
    adminInfo.value = { account: '', lastLoginTime: '' }
  }

  return { token, tenantCode, adminInfo, isLoggedIn, login, logout }
}, {
  persist: true
})
