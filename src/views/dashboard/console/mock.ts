export interface CoreKpiItem {
  label: string
  value: number
  unit?: string
  icon: string
  /** 字段说明（展示在卡片底部） */
  description: string
  /** 环比增长（较上周/上月），与主指标同卡展示，正为升、负为降 */
  momChangePercent?: number
  momPeriodLabel?: string
  /** 车轮卡片：在线率（在使用数 / 车轮总数） */
  onlineRatePercent?: number
}

export interface DeviceStatusItem {
  label: string
  value: number
  color: string
}

export const dashboardMock = {
  coreKpis: [
    {
      label: '合作商总数',
      value: 128,
      icon: 'ri:team-line',
      description: '当前系统中合作商总数量',
      momChangePercent: 8.6,
      momPeriodLabel: '较上月'
    },
    {
      label: '区域总数',
      value: 56,
      icon: 'ri:map-pin-2-line',
      description: '当前系统中区域总数量',
      momChangePercent: 6.1,
      momPeriodLabel: '较上月'
    },
    {
      label: '门店总数',
      value: 734,
      icon: 'ri:store-2-line',
      description: '所有合作商下的门店总数量',
      momChangePercent: 4.2,
      momPeriodLabel: '较上月'
    },
    {
      label: '车轮总数',
      value: 1200,
      icon: 'ri:steering-2-line',
      description: '系统中车轮设备总数量',
      onlineRatePercent: 82.2
    },
    {
      label: '信标总数',
      value: 468,
      icon: 'ri:radar-line',
      description: '当前系统中信标总数量',
      momChangePercent: 5.4,
      momPeriodLabel: '较上月'
    },
    {
      label: '告警工单总数',
      value: 89,
      icon: 'ri:alarm-warning-line',
      description: '本月由车轮告警自动生成的工单数量',
      momChangePercent: 12.4,
      momPeriodLabel: '较上月'
    },
    {
      label: '待处理工单数',
      value: 56,
      icon: 'ri:file-warning-line',
      description: '由告警生成且当前未完成的工单数量'
    }
  ] as CoreKpiItem[],

  deviceStatus: [
    { label: '在使用车轮数', value: 986, color: '#34d399' },
    { label: '报废车轮数', value: 92, color: '#9ca3af' },
    { label: '丢失车轮数', value: 38, color: '#f59e0b' },
    { label: '告警车轮数', value: 84, color: '#ef4444' }
  ] as DeviceStatusItem[],

  workOrder: {
    /** 本月告警工单（与 KPI 卡片同口径） */
    monthAlertOrdersTotal: 89,
    monthAlertOrdersMomPercent: 12.4,
    /** 本月工单处理进度：已完成 / 本月工单总数 */
    monthCompleted: 33,
    monthTotal: 89,
    pendingOrders: 56,
    todos: [
      '分配高优先级告警工单',
      '复核丢失车轮定位记录',
      '处理离线门店设备巡检任务',
      '同步合作商新增门店档案'
    ]
  }
}
