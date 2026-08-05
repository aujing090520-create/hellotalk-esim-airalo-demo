# HelloTalk eSIM Airalo 参考重构规格

## 0. 证据与边界

| 级别 | 来源 | 可采用内容 |
| --- | --- | --- |
| A | 用户提供的 Airalo App 截图 | 商店、我的 eSIM、目的地搜索/目录、首次引导和套餐信息层级。 |
| B | Airalo 官方帮助资料 | 购买后出现于 My eSIM、安装与连接分离、应用内/二维码/手动安装、有效期策略、符合条件时 Top up。 |
| C | Demo 补全 | Stripe 演示承接、成功、取消、失败及后台测试状态。不得表述为真实支付或截图已验证。 |

可见品牌统一为 `HelloTalk`。不使用 Airalo 品牌、图标、插图或截图像素。

## 1. 目标与范围

目标链路：

```text
找目的地 -> 选套餐 -> 结算 -> Stripe Hosted Checkout 演示
-> 成功 -> 安装 -> 连接 -> 查看用量 / 加购
```

不包含：账户资料、收件箱、会员/余额/返现、通知偏好、已保存银行卡、用户订单页、对公业务、语言设置、推荐好友、真实支付、真实订单、库存、运营商接口或 iOS 系统安装。

用户端仅保留 `商店` 与 `我的 eSIM`。用户订单记录通过 My eSIM 生命周期体现；运营人员通过后台“订单测试”查看和推进测试订单。

## 2. 信息架构

```text
商店
  首页 / 搜索 / 目的地 / 套餐 / 结算 / Stripe 演示 / 新手引导 / 帮助
我的 eSIM
  空态 / 生命周期 / 详情 / 安装 / 连接 / Top up
运营后台
  概览 / 商店与目的地 / 目录与 SKU / 订单测试 / Review
```

## 3. 数据与状态

| 实体 | 必要字段 | 规则 |
| --- | --- | --- |
| Destination | `id/name/type/flag/catalogId/enabled` | 每个目的地绑定自己的 Catalog；不能复用日本套餐。 |
| Catalog | `id/name/coverage/network/operator` | Catalog 可含多个 SKU。 |
| SKU | `id/catalogId/data/validityDays/price/unlimited/activationPolicy/topUpEnabled/enabled` | 有效期策略与 Top up 均为 SKU 级配置。 |
| Order | `id/skuId/kind/parentEsimId/status/amount/paymentProvider/createdAt` | `paymentProvider` 固定为 `stripe_demo`；付款成功才创建或更新 eSIM。 |
| MyEsim | `id/orderId/currentSkuId/status/installMethod/remainingData/startedAt/expiresAt` | 承担用户端的购买记录与服务状态。 |

状态机：

```text
paid -> pending_install -> installed -> ready_to_connect -> active -> low_data -> expired
```

禁止：`failed/cancelled -> MyEsim`、`pending_install -> active`、`expired -> active`。Top up 只在 SKU 允许且 eSIM 位于 `low_data/expired` 时进入。

## 4. 前台功能

| 规则 | 功能 / UI-layout | 描述 | 备注 |
| --- | --- | --- | --- |
| FR-A01 | 商店与目录 | 商店首页含搜索、两张教育卡、热门/本地/区域/全球目录和目的地最低价；搜索与目的地卡进入正确 Catalog。无余额、通知或个人入口。 | A |
| FR-A02 | 新手引导与设备兼容 | 引导依次确认目的地、eSIM 设备兼容性、套餐浏览；设备不支持时可浏览，但购买前必须出现兼容性确认。 | A + B |
| FR-A03 | 目的地与套餐 | 目的地展示各自 Catalog、网络、覆盖范围与 SKU；SKU 显示流量、有效期、价格、是否可加购、起算策略；详情后可进入结算。 | A + B |
| FR-A04 | Stripe 演示结算 | 结算页只显示套餐和应付金额，跳转 Stripe Hosted Checkout 演示页。成功写入 `paid/stripe_demo` Order 并创建待安装 eSIM；取消或失败返回结算且不创建 eSIM。本 Demo 不接 Stripe API、不收集卡信息。 | C |
| FR-A05 | 我的 eSIM 生命周期 | 空态可进入新手引导；已购 eSIM 支持详情、安装、连接、用量、低余量、过期、可用时 Top up。安装方式为应用内、二维码、手动；有效期遵循 SKU 起算策略。 | A + B |

## 5. 运营后台

| 规则 | 功能 / UI-layout | 描述 | 备注 |
| --- | --- | --- | --- |
| FR-A06 | 商店与目的地配置 | 管理目的地上架、类型、名称、绑定 Catalog 和首页两张教育卡；保存后前台目录与搜索同步。 | 仅浏览器 localStorage |
| FR-A07 | Catalog 与 SKU 配置 | 管理覆盖范围、网络、运营商及 SKU 的流量、有效期、价格、不限流量、起算策略、Top up、上架状态。 | 仅浏览器 localStorage |
| FR-A08 | 订单与生命周期测试 | 可创建 Stripe 演示的成功、失败、取消订单；成功订单生成 eSIM，并且只能按状态机推进。 | 用于验证前台状态 |
| FR-A09 | Linfan Review | Review 开启时，规则卡可定位页面/状态，页面编号可回到规则，桌面端显示连接线；关闭时不存在任何 Review DOM。 | 前后台双向追踪 |

## 6. 验收

| 验收点 | 通过条件 |
| --- | --- |
| 导航 | 用户端始终只有“商店”和“我的 eSIM”两个 Tab；后台始终只有五个栏目。 |
| 购买 | 从目的地到 Stripe 演示成功后，My eSIM 新增 `pending_install`；取消/失败后不新增。 |
| 生命周期 | 安装、连接、使用、低余量、过期与符合条件的 Top up 均可演示，且不允许非法跃迁。 |
| 配置 | 目的地、Catalog 和 SKU 配置影响商店、套餐、结算与 My eSIM。 |
| 支付边界 | UI 明示 Stripe Hosted Checkout 仅为演示，不收集银行卡、不执行真实支付。 |
| Review | 前后台规则双向定位有效；普通模式下 `[data-review-panel]`、`[data-review-marker]`、`[data-review-connector]` 均为 0。 |
| 质量 | `npm run build`、`git diff --check`、桌面与 `390x844` Playwright 均通过，浏览器无控制台错误、警告、失败请求或损坏图片。 |
