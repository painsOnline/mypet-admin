<template>
  <div class="shop-settings">
    <el-card>
      <template #header>
        <h3>店铺设置</h3>
      </template>

      <el-form ref="shopFormRef" :model="shopForm" label-width="140px" size="default">
        <el-form-item label="店铺名称" prop="name">
          <el-input v-model="shopForm.name" placeholder="请输入店铺名称" style="width: 400px" />
        </el-form-item>
        <el-form-item label="店铺Logo" prop="logo">
          <ImageUploader v-model="shopForm.logo" />
        </el-form-item>
        <el-form-item label="包邮金额" prop="freeShippingAmount">
          <el-input-number v-model="shopForm.freeShippingAmount" :min="0" :precision="2" style="width: 200px" />
          <span style="margin-left: 8px; color: #909399">订单满此金额免运费</span>
        </el-form-item>
        <el-form-item label="首页广告轮播图">
          <ImageUploader v-model="shopForm.banners" />
          <div style="color:#909399;font-size:12px;margin-top:4px">可上传多张图片，用于首页顶部轮播广告</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="shopSaveLoading" @click="handleSaveShop">
            保存设置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getShopSettings, saveShopSettings } from '@/api'
import { ElMessage } from 'element-plus'
import ImageUploader from '@/components/ImageUploader.vue'

const shopFormRef = ref(null)
const shopSaveLoading = ref(false)

const shopForm = reactive({
  name: '',
  logo: '',
  freeShippingAmount: 0,
  banners: [],
})

async function loadShopSettings() {
  try {
    const s = await getShopSettings()
    if (s) {
      Object.assign(shopForm, {
        name: s.name || '',
        logo: s.logo || '',
        freeShippingAmount: s.freeShippingAmount || 0,
        banners: Array.isArray(s.banners) ? [...s.banners] : [],
      })
    }
  } catch (e) {
    // handled
  }
}

async function handleSaveShop() {
  shopSaveLoading.value = true
  try {
    await saveShopSettings({
      name: shopForm.name,
      logo: shopForm.logo,
      freeShippingAmount: shopForm.freeShippingAmount,
      banners: shopForm.banners,
    })
    ElMessage.success('保存成功')
  } catch (e) {
    // handled
  } finally {
    shopSaveLoading.value = false
  }
}

onMounted(() => {
  loadShopSettings()
})
</script>

<style lang="scss" scoped>
.shop-settings {
  max-width: 1400px;
  margin: 0 auto;
}

h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}
</style>
