/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-unused-vars -- 声明合并/全局类型，名称供 TS 与业务引用，非运行时“使用” */

interface ImportMetaEnv {
  readonly VITE_TENCENT_MAP_KEY?: string
  readonly VITE_TENCENT_MAP_SCRIPT_SRC?: string
  /** 为 true 时仅用旧版 api/js（qq.maps），新 key 请用默认 GL（gljs） */
  readonly VITE_TENCENT_MAP_USE_LEGACY?: string
  readonly VITE_GOOGLE_MAP_KEY?: string
  readonly VITE_GOOGLE_MAP_SCRIPT_SRC?: string
}

declare module 'nprogress'

declare module 'crypto-js'

declare module 'vue-img-cutter'

declare module 'file-saver'

declare module 'qrcode.vue' {
  export type Level = 'L' | 'M' | 'Q' | 'H'
  export type RenderAs = 'canvas' | 'svg'
  export type GradientType = 'linear' | 'radial'
  export interface ImageSettings {
    src: string
    height: number
    width: number
    excavate: boolean
  }
  export interface QRCodeProps {
    value: string
    size?: number
    level?: Level
    background?: string
    foreground?: string
    renderAs?: RenderAs
  }
  const QrcodeVue: any
  export default QrcodeVue
}

// 全局变量声明（由 `vite.config` 的 `define` 注入，仅类型声明，运行时存在）
declare const __APP_VERSION__: string // 版本号

/** 第三方地图 SDK（动态脚本注入，运行时存在） */
declare global {
  interface Window {
    qq?: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown
        Marker: new (opts: Record<string, unknown>) => unknown
        Polyline: new (opts: Record<string, unknown>) => unknown
        event: {
          trigger: (map: unknown, evt: string) => void
          addListener: (
            map: unknown,
            evt: string,
            handler: (e: { latLng: { getLat: () => number; getLng: () => number } }) => void
          ) => unknown
          removeListener: (listener: unknown) => void
        }
      }
    }
    google?: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown
        Marker: new (opts: Record<string, unknown>) => unknown
        Polyline: new (opts: Record<string, unknown>) => unknown
        event: { trigger: (map: object, evt: string) => void }
      }
    }
    /** 腾讯地图 JavaScript API GL（仅声明本项目中用到的类） */
    TMap?: {
      LatLng: new (lat: number, lng: number) => unknown
      Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown
      MarkerStyle: new (opts: Record<string, unknown>) => unknown
      MultiMarker: new (opts: Record<string, unknown>) => unknown
      MultiPolyline: new (opts: Record<string, unknown>) => unknown
      PolylineStyle: new (opts: Record<string, unknown>) => unknown
    }
  }
}
export {}
