/**
 * 快速入口配置
 * 包含：应用列表、快速链接等配置
 */
import type { FastEnterConfig } from '@/types/config'

const fastEnterConfig: FastEnterConfig = {
  // 显示条件（屏幕宽度）
  minWidth: 1200,
  // 应用列表
  applications: [
    {
      name: '工作台',
      description: '系统概览与数据统计',
      icon: 'ri:pie-chart-line',
      iconColor: '#377dff',
      enabled: true,
      order: 1,
      routeName: 'Console'
    },
    {
      name: '分析页',
      description: '数据分析与可视化',
      icon: 'ri:game-line',
      iconColor: '#ff3b30',
      enabled: true,
      order: 2,
      routeName: 'Analysis'
    },
    {
      name: '查看地图',
      description: '地图数据展示',
      icon: 'ri:map-pin-line',
      iconColor: '#7A7FFF',
      enabled: true,
      order: 3,
      routeName: 'DashboardMapView'
    },
    {
      name: '车轮管理',
      description: '车轮设备列表与运维',
      icon: 'ri:steering-2-line',
      iconColor: '#13DEB9',
      enabled: true,
      order: 4,
      routeName: 'WheelList'
    },
    {
      name: '门店管理',
      description: '门店列表与信息维护',
      icon: 'ri:store-2-line',
      iconColor: '#ff6b6b',
      enabled: true,
      order: 5,
      routeName: 'StoreList'
    },
    {
      name: '信标管理',
      description: '信标设备列表与运维',
      icon: 'ri:signal-tower-line',
      iconColor: '#FB7299',
      enabled: true,
      order: 6,
      routeName: 'BeaconList'
    }
  ],
  // 快速链接
  quickLinks: [
    {
      name: '登录',
      enabled: true,
      order: 1,
      routeName: 'Login'
    },
    {
      name: '忘记密码',
      enabled: true,
      order: 2,
      routeName: 'ForgetPassword'
    },
    {
      name: '个人中心',
      enabled: true,
      order: 3,
      routeName: 'UserCenter'
    }
  ]
}

export default Object.freeze(fastEnterConfig)
