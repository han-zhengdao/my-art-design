import { ref } from 'vue'
import {
  fetchListPartnerOptions,
  fetchListRegionOptions,
  fetchListStoreOptions
} from '@/api/org-options'

/** 联动表单需包含的字段（partner / region / store 的 id） */
export interface OrgCascadeFormSlice {
  partnerId?: number
  regionId?: number
  storeId?: number
}

/**
 * 合作商 → 区域 → 门店 三级联动下拉数据与加载逻辑。
 * 传入同一表单对象（如 reactive 的 formData），在「合作商 / 区域」的 @change 里调用对应 handle 方法；
 * 打开弹窗或需要回填时调用 hydrateFromForm。
 */
export function useOrgCascadeOptions(form: OrgCascadeFormSlice) {
  const partnerOptions = ref<Api.Org.OptionItem[]>([])
  const regionOptions = ref<Api.Org.OptionItem[]>([])
  const storeOptions = ref<Api.Org.OptionItem[]>([])

  const loadingPartner = ref(false)
  const loadingRegion = ref(false)
  const loadingStore = ref(false)

  const hasPartner = () => form.partnerId != null && form.partnerId > 0
  const hasRegion = () => form.regionId != null && form.regionId > 0

  async function loadPartners() {
    loadingPartner.value = true
    try {
      const list = await fetchListPartnerOptions()
      partnerOptions.value = Array.isArray(list) ? list : []
    } finally {
      loadingPartner.value = false
    }
  }

  async function loadRegions(partnerId: number) {
    regionOptions.value = []
    storeOptions.value = []
    if (partnerId <= 0) return
    loadingRegion.value = true
    try {
      const list = await fetchListRegionOptions(partnerId)
      regionOptions.value = Array.isArray(list) ? list : []
    } finally {
      loadingRegion.value = false
    }
  }

  async function loadStores(partnerId: number, regionId: number) {
    storeOptions.value = []
    if (partnerId <= 0 || regionId <= 0) return
    loadingStore.value = true
    try {
      const list = await fetchListStoreOptions({ partnerId, regionId })
      storeOptions.value = Array.isArray(list) ? list : []
    } finally {
      loadingStore.value = false
    }
  }

  /** 用户切换合作商：清空下级并拉区域 */
  function handlePartnerChange() {
    form.regionId = undefined
    form.storeId = undefined
    regionOptions.value = []
    storeOptions.value = []
    if (hasPartner()) {
      void loadRegions(form.partnerId!)
    }
  }

  /** 用户切换区域：清空门店并拉门店列表 */
  function handleRegionChange() {
    form.storeId = undefined
    storeOptions.value = []
    if (hasPartner() && hasRegion()) {
      void loadStores(form.partnerId!, form.regionId!)
    }
  }

  /**
   * 根据当前表单中的 id 回填三级选项（先拉合作商，再按 id 逐级拉子级）。
   * 用于弹窗打开、编辑回填。
   */
  async function hydrateFromForm() {
    await loadPartners()
    if (!hasPartner()) {
      regionOptions.value = []
      storeOptions.value = []
      return
    }
    await loadRegions(form.partnerId!)
    if (!hasRegion()) {
      storeOptions.value = []
      return
    }
    await loadStores(form.partnerId!, form.regionId!)
  }

  return {
    partnerOptions,
    regionOptions,
    storeOptions,
    loadingPartner,
    loadingRegion,
    loadingStore,
    loadPartners,
    loadRegions,
    loadStores,
    handlePartnerChange,
    handleRegionChange,
    hydrateFromForm
  }
}
