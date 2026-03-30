## 技术栈与运行方式

**框架**：Vue 3 + Vite + TypeScript

**UI**：Element Plus + Tailwind CSS（@tailwindcss/vite）

**状态**：Pinia

**路由**：Vue Router，使用 createWebHashHistory（URL 带 #）

**请求**：Axios 封装在 src/utils/http/index.ts，baseURL 来自环境变量 VITE_API_URL

**国际**化：vue-i18n，文案在 src/locales/langs/zh.json、en.json 等

**脚本**：pnpm dev / pnpm build（package.json 要求 Node ≥20.19、pnpm ≥8.8）

**入口**：src/main.ts → App.vue → <RouterView />。


---

**一、全局配置**  
文件位置：`src/config/index.ts`  
作用：这是项目的核心配置文件，主要用于定义系统的基础信息与界面表现。包括系统名称、主题风格、菜单布局方式、主色调、快速入口配置等。通过调整该文件，可以快速实现系统外观与基础信息的统一变更。

---

**二、路由模块**  
文件位置：`src/router/modules/*.ts`  
作用：业务相关的菜单和页面路由按模块拆分存放，每个模块独立管理自己的路由配置。这些模块化的路由文件最终会在 `src/router/index.ts` 中被统一汇总并注册到路由系统中。这种设计便于多人协作开发，也方便按业务模块进行路由的增删与维护。

---

**三、静态路由**  
文件位置：`src/router/routes/staticRoutes.ts`  
作用：存放不需要登录即可访问的页面路由，例如登录页、注册页、404 页面、403 页面等。这些路由在应用初始化时就会直接挂载，不依赖任何权限判断，用于处理基础访问路径和公共页面。

---

**四、动态路由**  
文件位置：`src/router/routes/asyncRoutes.ts`  
作用：负责管理需要根据用户权限动态加载的路由。该文件会引用 `src/router/modules/` 下定义的路由模块，并在用户登录后根据其角色或权限信息，筛选出允许访问的路由，动态挂载到系统中。这样可以确保不同权限的用户看到不同的菜单和页面。

---

**五、路由守卫**  
文件位置：`src/router/guards/beforeEach.ts` 及相关文件  
作用：路由守卫是权限控制的核心环节。`beforeEach.ts` 会在每次路由跳转前执行，主要功能包括：检查用户是否已登录、验证路由访问权限、显示页面加载进度条、记录路由历史等。通过守卫机制，可以集中处理所有路由跳转前的逻辑，保证系统安全性与用户体验。

---

**六、接口层（API）**  
文件位置：`src/api/*.ts`  
作用：所有与后端交互的接口请求都按模块封装在此目录下。例如 `auth.ts` 专门处理登录、登出、获取用户信息等认证相关接口；其他如 `user.ts`、`menu.ts` 等则对应不同业务模块。这种按模块划分的方式便于维护，也方便在需要时统一修改接口调用逻辑。

---

**七、页面视图**  
文件位置：`src/views/**`  
作用：存放所有业务功能页面的 Vue 组件，按业务模块划分子目录，例如 `dashboard/`（仪表盘）、`system/`（系统管理）、`example/`（示例页面）等。每个页面的代码、样式、逻辑都集中在该目录下，结构清晰，便于定位和开发。

---

**八、组件**  
文件位置：  
- 核心组件：`src/components/core/`  
- 业务组件：`src/components/business/`  

作用：可复用组件分为两类。核心组件主要负责布局、框架级功能，如侧边栏、顶栏、标签页等；业务组件则是跨页面使用的通用组件，如表单组件、表格组件、弹窗组件等。通过组件化设计，可以提升代码复用率，减少重复开发。

---

**九、Mock 数据**  
文件位置：`src/mock/**`  
作用：在开发初期或后端接口未就绪时，用于模拟接口返回数据，支持前端独立开发与调试。Mock 数据按模块组织，可以模拟各种接口响应场景。当后端接口开发完成后，可以逐步关闭或替换 Mock 配置，切换到真实接口，实现平滑过渡。

---

**十、环境变量**  
文件位置：项目根目录下的 `.env`、`.env.development`、`.env.production` 等  
作用：用于管理不同环境下的配置信息，主要包括开发服务器端口、代理地址、API 基础路径等。通过环境变量，可以在开发、测试、生产环境中使用不同的配置，无需修改代码即可灵活切换，便于部署和运维。

---

## 这个项目有什么特别的呢？

**界面设计**：现代化 UI 设计，流畅交互，以用户体验与视觉设计为核心

**极速上手**：简洁架构 + 完整文档，后端开发者也能轻松使用

**丰富组件**：内置数据展示、表单等多种高质量组件，满足不同业务场景的需求

**丝滑交互**：按钮点击、主题切换、页面过渡、图表动画，体验媲美商业产品

**高效开发**：内置 useTable、ArtForm 等实用 API，显著提升开发效率

**精简脚本**：内置一键清理脚本，可快速清理演示数据，立即得到可开发的基础项目

## 技术栈

开发框架：Vue3、TypeScript、Vite、Element-Plus、Tailwind CSS

代码规范：Eslint、Prettier、Stylelint、Husky、Lint-staged、cz-git

## 预览

<kbd><img src="https://www.qiniu.lingchen.kim/github-c1.webp" alt="浅色主题"/></kbd>

<kbd><img src="https://www.qiniu.lingchen.kim/github-c2.webp" alt="浅色主题"/></kbd>

<kbd><img src="https://www.qiniu.lingchen.kim/github-c4.webp" alt="暗黑主题"/></kbd>

<kbd><img src="https://www.qiniu.lingchen.kim/github-c5.webp" alt="暗黑主题"/></kbd>

## 快速访问

[演示地址](https://www.artd.pro) | [官方文档](https://www.artd.pro/docs) | [更新日志](./CHANGELOG.md)

## 安装运行

```bash
# 安装依赖
pnpm install

# 如果 pnpm install 安装失败，尝试使用下面的命令安装依赖
pnpm install --ignore-scripts

# 本地开发环境启动
pnpm dev

# 生产环境打包
pnpm build
```

## 精简版本

项目内置精简脚本，可快速移除项目中的演示数据，让开发者获得一个可快速开发的基础项目

```bash
pnpm clean:dev
```

## 技术支持

QQ群：<a href="https://qm.qq.com/cgi-bin/qm/qr?k=Gg6yzZLFaNgmRhK0T5Qcjf7-XcAFWWXm&jump_from=webapi&authKey=YpRKVJQyFKYbGTiKw0GJ/YQXnNF+GdXNZC5beQQqnGZTvuLlXoMO7nw5fNXvmVhA">1038930070</a>（点击链接加入群聊）

## 兼容性

支持 Chrome、Safari、Firefox 等现代主流浏览器。

## 贡献

我们真诚欢迎并感谢每一位贡献者的支持！无论您有新想法、功能建议还是代码优化，都可以通过以下方式参与：

提交 Pull Request：分享您的代码，助力项目成长。

创建 GitHub Issue：提出 bug 反馈或新功能建议，让我们一起完善。

您的每一点贡献都让这个项目更进一步！快来加入我们的开源社区吧！

## 持续优化与扩展

项目保持活跃更新，支持最新前端技术栈，兼容主流框架，确保长期稳定性和扩展性。社区驱动的反馈机制，让你的需求快速融入项目迭代。

## 捐赠

如果你觉得这个项目为你减少了开发成本、化解了工作 / 生活里的难题，可以通过以下方式支持一下～

<img src="https://www.qiniu.lingchen.kim/%E7%BB%84%202%402x%202.png" alt="捐赠二维码"/>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Daymychen/art-design-pro&type=Date)](https://www.star-history.com/#Daymychen/art-design-pro&Date)
