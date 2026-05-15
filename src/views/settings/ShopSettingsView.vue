<template>
  <div class="shop-settings">
    <el-card>
      <template #header>
        <h3>店铺设置</h3>
      </template>

      <el-form ref="shopFormRef" :model="shopForm" :rules="shopRules" label-width="140px" size="default">
        <el-form-item label="店铺名称" prop="name">
          <el-input v-model="shopForm.name" placeholder="请输入店铺名称" style="width: 400px" />
        </el-form-item>
        <el-form-item label="店铺Logo" prop="logo">
          <ImageUploader v-model="shopForm.logo" category="logo" />
        </el-form-item>
        <el-form-item label="起配金额" prop="freeShippingAmount">
          <el-input-number v-model="shopForm.freeShippingAmount" :min="0" :precision="2" style="width: 200px" />
          <span style="margin-left: 8px; color: #909399">订单满此金额起配</span>
        </el-form-item>
        <el-form-item label="首页广告轮播图">
          <div style="margin-bottom:8px">
            <el-button size="small" type="primary" @click="addBannerItem">
              <el-icon><Plus /></el-icon>添加Banner
            </el-button>
          </div>
          <div ref="bannerListRef" style="width:100%">
            <div v-for="(item, idx) in bannerItems" :key="idx" class="banner-row">
              <el-icon class="banner-drag" style="cursor:grab;margin-right:4px"><Rank /></el-icon>
              <div class="banner-pic">
                <img v-if="item.imgUrl" :src="item.imgUrl" class="banner-img" />
                <el-upload v-else class="banner-upload" drag :show-file-list="false" :http-request="(opt:any) => uploadBanner(opt, idx)" accept=".jpg,.jpeg,.png,.gif,.webp,.bmp">
                  <el-icon :size="22"><Plus /></el-icon>
                </el-upload>
              </div>
              <el-input v-model="item.hrefUrl" placeholder="跳转链接" style="width:360px" />
              <el-input-number v-model="item.sort" :min="0" style="width:100px" controls-position="right" />
              <el-button type="danger" @click="removeBannerItem(idx)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
          <div v-if="bannerItems.length === 0" class="form-hint">暂无Banner，点击"添加Banner"按钮添加</div>
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getShopSettings, saveShopSettings } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Rank } from '@element-plus/icons-vue'
import ImageUploader from '@/components/ImageUploader.vue'
import request from '@/api/request'
import Sortable from 'sortablejs'

const shopFormRef = ref(null)
const shopSaveLoading = ref(false)
const bannerListRef = ref(null)

const shopForm = reactive({ name: '', logo: '', freeShippingAmount: 20, banners: '' })
const shopRules = {
  freeShippingAmount: [
    { required: true, message: '请输入起配金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '起配金额不能小于0', trigger: 'blur' },
  ],
}

interface BannerItem { imgUrl: string; hrefUrl: string; sort: number }
const bannerItems = ref<BannerItem[]>([])

function addBannerItem() {
  bannerItems.value.push({ imgUrl: '', hrefUrl: '', sort: bannerItems.value.length })
  nextTick(() => initSortable())
}

function removeBannerItem(idx: number) {
  bannerItems.value.splice(idx, 1)
  bannerItems.value.forEach((b, i) => b.sort = i)
}

async function uploadBanner(opt: any, idx: number) {
  const formData = new FormData(); formData.append('file', opt.file)
  try {
    const url = await request({ url: '/admin/upload/image?type=banner', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } }) as string
    bannerItems.value[idx].imgUrl = url
  } catch { ElMessage.error('上传失败') }
}

let bannerSortable: any = null
function initSortable() {
  nextTick(() => {
    if (bannerSortable) bannerSortable.destroy()
    const el = bannerListRef.value
    if (!el) return
    bannerSortable = Sortable.create(el as HTMLElement, {
      handle: '.banner-drag', animation: 200,
      onEnd: (evt: any) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
        const moved = bannerItems.value.splice(oldIndex, 1)[0]
        bannerItems.value.splice(newIndex, 0, moved)
        bannerItems.value.forEach((b, i) => b.sort = i)
      },
    })
  })
}

async function loadShopSettings() {
  try {
    const s = await getShopSettings()
    if (s) {
      Object.assign(shopForm, { name: s.name || '', logo: s.logo || '', freeShippingAmount: s.freeShippingAmount || 0, banners: s.banners || '' })
      // Parse banners JSON
      try {
        const arr = typeof s.banners === 'string' ? JSON.parse(s.banners) : (s.banners || [])
        bannerItems.value = Array.isArray(arr) ? arr.map((b: any) => ({
          imgUrl: b.imgUrl || '', hrefUrl: b.hrefUrl || '', sort: b.sort || 0
        })) : []
      } catch { bannerItems.value = [] }
      initSortable()
    }
  } catch (e) { /* handled */ }
}

async function handleSaveShop() {
  const valid = await shopFormRef.value.validate().catch(() => false)
  if (!valid) return
  shopSaveLoading.value = true
  try {
    await saveShopSettings({
      name: shopForm.name, logo: shopForm.logo,
      freeShippingAmount: shopForm.freeShippingAmount,
      banners: JSON.stringify(bannerItems.value.map(b => ({ imgUrl: b.imgUrl, hrefUrl: b.hrefUrl, type: 1, sort: b.sort }))),
    })
    ElMessage.success('保存成功')
  } catch (e) { /* handled */ } finally { shopSaveLoading.value = false }
}

onMounted(() => { loadShopSettings() })
</script>

<style lang="scss" scoped>
.shop-settings {
  max-width: 1400px;
  margin: 0 auto;
}

h3 { margin: 0; font-size: 18px; color: #303133; }
.banner-row { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; padding: 8px 12px; background: #fafafa; border-radius: 6px; }
.banner-pic { width: 100px; height: 100px; flex-shrink: 0; }
.banner-img { width: 100px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #ebeef5; }
.banner-upload { width: 100px; }
.banner-upload :deep(.el-upload) { width: 100px; }
.banner-upload :deep(.el-upload-dragger) { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; padding: 0; }
.form-hint { color: #909399; font-size: 12px; margin-top: 4px; }
</style>
