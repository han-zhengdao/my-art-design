/**
 * 车轮录入（前端 mock，对接后端时替换）
 */

let WHEEL_ENTRY_MOCK: Api.WheelEntry.WheelEntryItem[] = [
  {
    id: 1,
    packagingNo: 'PKG-202604-0001',
    productModel: 'WHL-X1',
    bluetoothPassword: 'BTPWD001',
    deviceEui: 'EUI00112233445566',
    joinEui: '70B3D57ED0051111',
    joinMethod: 'OTAA',
    applicationKey: 'APPKEY-111111111111',
    deviceAddress: '26011AAA',
    networkSessionKey: 'NWSKEY-AAAA1111',
    applicationSessionKey: 'APSKEY-AAAA1111',
    packagingTime: '2026-04-10 10:12:33',
    batchId: 'BATCH-202604-A',
    productionLineId: 'LINE-01',
    factoryId: 'FAC-SH-01',
    operatorId: 'OP-1001'
  },
  {
    id: 2,
    packagingNo: 'PKG-202604-0002',
    productModel: 'WHL-X1',
    bluetoothPassword: 'BTPWD002',
    deviceEui: 'EUI00112233445567',
    joinEui: '70B3D57ED0051111',
    joinMethod: 'ABP',
    applicationKey: 'APPKEY-222222222222',
    deviceAddress: '26011AAB',
    networkSessionKey: 'NWSKEY-BBBB2222',
    applicationSessionKey: 'APSKEY-BBBB2222',
    packagingTime: '2026-04-10 10:20:11',
    batchId: 'BATCH-202604-A',
    productionLineId: 'LINE-01',
    factoryId: 'FAC-SH-01',
    operatorId: 'OP-1002'
  },
  {
    id: 3,
    packagingNo: 'PKG-202604-0101',
    productModel: 'WHL-PRO',
    bluetoothPassword: 'BTPWD101',
    deviceEui: 'EUI88AABBCCDDEE01',
    joinEui: '70B3D57ED0052222',
    joinMethod: 'OTAA',
    applicationKey: 'APPKEY-333333333333',
    deviceAddress: '26011AAC',
    networkSessionKey: 'NWSKEY-CCCC3333',
    applicationSessionKey: 'APSKEY-CCCC3333',
    packagingTime: '2026-04-11 09:08:02',
    batchId: 'BATCH-202604-B',
    productionLineId: 'LINE-02',
    factoryId: 'FAC-CD-02',
    operatorId: 'OP-2001'
  }
]

export function fetchWheelEntryList(
  params: Api.WheelEntry.WheelEntrySearchParams
): Promise<Api.WheelEntry.WheelEntryList> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let list = [...WHEEL_ENTRY_MOCK]
      const eui = params.deviceEui?.trim().toLowerCase()
      const model = params.productModel?.trim().toLowerCase()
      if (eui) {
        list = list.filter((r) => r.deviceEui.toLowerCase().includes(eui))
      }
      if (model) {
        list = list.filter((r) => r.productModel.toLowerCase().includes(model))
      }
      const current = params.current ?? 1
      const size = params.size ?? 20
      const start = (current - 1) * size
      resolve({
        records: list.slice(start, start + size),
        current,
        size,
        total: list.length
      })
    }, 220)
  })
}

export function deleteWheelEntry(id: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      WHEEL_ENTRY_MOCK = WHEEL_ENTRY_MOCK.filter((r) => r.id !== id)
      resolve()
    }, 180)
  })
}
