<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    :width="720"
    align-center
    destroy-on-close
    class="el-dialog-border role-permission-dialog"
    @close="handleClose"
    @closed="handleClosed"
  >
    <div class="role-permission-dialog__inner px-5 md:px-6">
      <p
        v-if="props.roleData?.roleName"
        class="mb-3 text-sm leading-relaxed text-g-600 dark:text-g-500"
      >
        当前角色：<span class="font-medium text-g-800 dark:text-g-200">{{
          props.roleData.roleName
        }}</span>
      </p>
      <div
        v-loading="loading"
        class="role-permission-dialog__panel min-h-[220px] rounded-lg border border-solid border-g-200 bg-g-50/80 px-2 py-3 dark:border-g-700 dark:bg-g-900/40"
      >
        <ElScrollbar max-height="58vh">
          <ElTree
            v-if="menuTree.length"
            class="role-permission-tree"
            :data="menuTree"
            node-key="id"
            :expand-on-click-node="false"
            :props="{ children: 'children', label: 'menuName' }"
            default-expand-all
          >
            <template #default="{ data }">
              <div class="flex w-full flex-wrap items-center justify-between gap-2 py-1 pr-1">
                <span
                  class="text-sm"
                  :class="
                    data.type === 1
                      ? 'font-medium text-g-800 dark:text-g-200'
                      : 'text-g-700 dark:text-g-300'
                  "
                >
                  {{ treeNodeLabel(data) }}
                </span>
                <div v-if="data.type === 2" class="flex shrink-0 items-center gap-4" @click.stop>
                  <ElCheckbox
                    :model-value="perm[data.id]?.canRead ?? false"
                    @update:model-value="(v) => setPerm(data.id, 'canRead', !!v)"
                  >
                    读
                  </ElCheckbox>
                  <ElCheckbox
                    :model-value="perm[data.id]?.canWrite ?? false"
                    @update:model-value="(v) => setPerm(data.id, 'canWrite', !!v)"
                  >
                    写
                  </ElCheckbox>
                </div>
              </div>
            </template>
          </ElTree>
          <div
            v-else-if="!loading"
            class="flex min-h-[160px] items-center justify-center px-4 py-10 text-center text-sm text-g-500"
          >
            暂无菜单数据
          </div>
        </ElScrollbar>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer flex justify-end gap-3">
        <ElButton @click="handleClose">取 消</ElButton>
        <ElButton type="primary" :loading="saving" v-ripple @click="savePermission">
          保 存
        </ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import {
    fetchAssignRoleMenus,
    fetchGetMenuTree,
    fetchGetRoleMenuByRoleIdList
  } from '@/api/system-manage'

  type RoleListItem = Api.SystemManage.RoleListItem
  type MenuTreeItem = Api.SystemManage.MenuTreeItem
  type RoleMenuByRoleItem = Api.SystemManage.RoleMenuByRoleItem

  interface Props {
    modelValue: boolean
    roleData?: RoleListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    roleData: undefined
  })

  const emit = defineEmits<Emits>()

  const { locale } = useI18n()

  /** 与菜单管理一致：优先中英文名字段，回退 menuName */
  function treeNodeLabel(node: MenuTreeItem): string {
    const isEn = locale.value?.toLowerCase().startsWith('en')
    if (isEn && node.menuNameEn?.trim()) return node.menuNameEn.trim()
    if (!isEn && node.menuNameZh?.trim()) return node.menuNameZh.trim()
    return node.menuName ?? ''
  }

  const menuTree = ref<MenuTreeItem[]>([])
  /** 仅 type===2 菜单：读/写 */
  const perm = ref<Record<number, { canRead: boolean; canWrite: boolean }>>({})
  const loading = ref(false)
  const saving = ref(false)

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const dialogTitle = computed(() => {
    const name = props.roleData?.roleName?.trim()
    return name ? `菜单权限（${name}）` : '菜单权限'
  })

  function initPermFromTreeAndAssigned(
    tree: MenuTreeItem[],
    assigned: RoleMenuByRoleItem[]
  ): Record<number, { canRead: boolean; canWrite: boolean }> {
    const map = new Map(assigned.map((a) => [a.menuId, a]))
    const out: Record<number, { canRead: boolean; canWrite: boolean }> = {}
    const walk = (nodes: MenuTreeItem[]) => {
      nodes.forEach((n) => {
        if (n.type === 2) {
          const a = map.get(n.id)
          out[n.id] = {
            canRead: a ? a.canRead === 1 : false,
            canWrite: a ? a.canWrite === 1 : false
          }
        }
        if (n.children?.length) walk(n.children)
      })
    }
    walk(tree)
    return out
  }

  /** 读：可单独勾选；取消读时顺带取消写。写：勾选时同时勾选读；取消写只取消写。 */
  function setPerm(id: number, key: 'canRead' | 'canWrite', val: boolean) {
    const cur = perm.value[id] ?? { canRead: false, canWrite: false }
    if (key === 'canRead') {
      perm.value = {
        ...perm.value,
        [id]: { canRead: val, canWrite: val ? cur.canWrite : false }
      }
      return
    }
    if (val) {
      perm.value = {
        ...perm.value,
        [id]: { canRead: true, canWrite: true }
      }
    } else {
      perm.value = {
        ...perm.value,
        [id]: { canRead: cur.canRead, canWrite: false }
      }
    }
  }

  function collectMenuPermissions(tree: MenuTreeItem[]) {
    const list: Api.SystemManage.AssignRoleMenusPayload['menuPermissions'] = []
    const walk = (nodes: MenuTreeItem[]) => {
      nodes.forEach((n) => {
        if (n.type === 2) {
          const p = perm.value[n.id]
          list.push({
            menuId: n.id,
            canRead: p?.canRead ? 1 : 0,
            canWrite: p?.canWrite ? 1 : 0
          })
        }
        if (n.children?.length) walk(n.children)
      })
    }
    walk(tree)
    return list
  }

  async function loadPermissionData() {
    const roleId = props.roleData?.roleId
    if (roleId == null) return
    loading.value = true
    perm.value = {}
    try {
      const [tree, assigned] = await Promise.all([
        fetchGetMenuTree(),
        fetchGetRoleMenuByRoleIdList(roleId)
      ])
      menuTree.value = tree
      perm.value = initPermFromTreeAndAssigned(tree, assigned)
    } catch {
      menuTree.value = []
      ElMessage.error('加载菜单权限失败')
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.modelValue,
    async (open) => {
      if (open && props.roleData?.roleId != null) await loadPermissionData()
    }
  )

  const handleClose = () => {
    visible.value = false
  }

  const handleClosed = () => {
    perm.value = {}
    menuTree.value = []
  }

  const savePermission = async () => {
    const roleId = props.roleData?.roleId
    if (roleId == null) return
    saving.value = true
    try {
      await fetchAssignRoleMenus({
        roleId,
        menuPermissions: collectMenuPermissions(menuTree.value)
      })
      ElMessage.success('权限保存成功')
      emit('success')
      handleClose()
    } catch {
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped lang="scss">
  .role-permission-tree {
    background: transparent;
  }

  .role-permission-tree :deep(.el-tree-node__content) {
    min-height: 36px;
    padding: 4px 8px;
    border-radius: calc(var(--custom-radius) / 2);
    transition: background-color 0.15s ease;

    &:hover {
      background-color: var(--art-el-active-color);
    }
  }

  .role-permission-tree :deep(.el-checkbox) {
    --el-checkbox-height: 22px;
  }
</style>
