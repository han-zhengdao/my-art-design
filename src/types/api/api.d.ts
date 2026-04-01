/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.UserInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author Art Design Pro Team
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }

    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      avatar?: string
      /** 合作商管理员绑定的合作商 ID（后端返回时用于数据范围） */
      partnerId?: number
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      /** 对应资产名称（公司/企业名等） */
      assetName?: string
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Api.Common.CommonSearchParams & {
        /** 用户名或邮箱模糊搜索 */
        keyword?: string
        /** 对应角色 */
        role?: string
        /** 状态（正常/注销） */
        status?: string
        /** 注销时间范围：开始、结束 */
        logoutTimeRange?: [string, string]
      }
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
      /** 操作人（创建人/维护人） */
      operatorName?: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          startTime: string | null
          endTime: string | null
        }
    >
  }

  /** 合作商管理 */
  namespace Partner {
    interface PartnerListItem {
      id: number
      /** 关联用户昵称 */
      userNickName?: string
      /** 关联用户登录邮箱 */
      loginEmail?: string
      partnerName: string
      country: string
      countryCode: string
      iotToken: string
      tenantId: string
      dcBalance: number
      contactName: string
      phone: string
      enterpriseAddress: string
      regionCount: number
      storeCount: number
      wheelCount: number
      beaconCount: number
      operatorName: string
      createTime: string
    }

    type PartnerList = Api.Common.PaginatedResponse<PartnerListItem>

    type PartnerSearchParams = Partial<
      Api.Common.CommonSearchParams & {
        partnerName?: string
        countryCode?: string
      }
    >
  }

  /** 区域管理 */
  namespace Region {
    interface RegionListItem {
      id: number
      /** 区域管理员账户昵称（列表展示） */
      userNickName?: string
      /** 区域管理员登录邮箱（列表展示） */
      loginEmail?: string
      regionName: string
      regionAddress: string
      regionContactName: string
      regionPhone: string
      partnerId: number
      partnerName: string
      country: string
      countryCode: string
      dcBalance: number
      storeCount: number
      wheelCount: number
      beaconCount: number
      pendingTicketCount: number
      createTime: string
      operatorName: string
    }

    type RegionList = Api.Common.PaginatedResponse<RegionListItem>

    type RegionSearchParams = Partial<
      Api.Common.CommonSearchParams & {
        regionName?: string
        /** 必选：筛选该国家下的区域 */
        countryCode?: string
        partnerId?: number
      }
    >
  }

  /** 门店管理 */
  namespace Store {
    type MapProvider = 'TENCENT' | 'GOOGLE'

    interface GeoPoint {
      lng: number
      lat: number
    }

    interface StoreListItem {
      id: number
      /** 门店管理员账户昵称（列表展示） */
      userNickName?: string
      /** 门店管理员登录邮箱（列表展示） */
      loginEmail?: string
      storeName: string
      storeAddress: string
      contactName: string
      phone: string
      regionId?: number
      regionName?: string
      partnerId: number
      partnerName: string
      country: string
      countryCode: string
      mapProvider: MapProvider
      storeCoordinate: GeoPoint
      geofence: GeoPoint[]
      timezone: string
      dcBalance: number
      wheelCount: number
      beaconCount: number
      pendingTicketCount: number
      createTime: string
      operatorName: string
    }

    type StoreList = Api.Common.PaginatedResponse<StoreListItem>

    type StoreSearchParams = Partial<
      Api.Common.CommonSearchParams & {
        storeName?: string
        countryCode?: string
        partnerId?: number
        /** NONE 表示查询无区域 */
        regionId?: number | 'NONE'
      }
    >
  }
}
