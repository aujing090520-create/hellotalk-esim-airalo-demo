# HelloTalk eSIM Airalo 参考重构规格

## 0. 证据边界

| 证据级别 | 来源 | 可作为实现依据的内容 |
| --- | --- | --- |
| A | 用户提供的 Airalo App 截图 | 商店、我的 eSIM、个人资料三 Tab；目的地搜索与热门/本地/区域/全球目录；首次引导；重要更新订阅；Airmoney、会员等级、个人资料信息架构。 |
| B | Airalo 官方帮助/指南 | 购买后 eSIM 出现在账户的 My eSIMs；安装、激活/连接分离；安装可走应用内、二维码或手动方式；具体有效期策略在套餐详情中展示；余量耗尽或到期后仅在可加购的套餐上提供 Top up。 |
| C | Demo 补全 | 支付完成、订单详情、支付失败、网络连接成功等未被截图直接覆盖的状态。必须采用 B 级逻辑，不可伪装为截图已验证内容。 |

品牌替换：所有可见 `Airalo`、`Airmoney` 替换为 `HelloTalk`、`HelloMoney`；不使用 Airalo 的品牌词、插图、图标或截图像素。

## 1. 目标与非目标

目标：用户可完成 `找目的地 -> 选套餐 -> 结算 -> 购买成功 -> 安装 -> 连接 -> 查看用量/加购` 的完整 eSIM 演示链路，并在账户域管理余额、会员与通知。

非目标：真实支付、运营商接口、真实 iOS 系统安装、风控、库存、跨设备登录和真实消息推送。

## 2. 信息架构

```text
商店
  首页 / 目的地搜索 / 目的地结果 / 套餐详情 / 结算 / 支付结果
  首次引导 / 重要更新订阅 / 通知中心
我的 eSIM
  空态 / 待安装 / 待连接 / 使用中 / 余量不足 / 已过期
  eSIM 详情 / 安装方式 / 连接指南 / 套餐详情 / Top up
个人资料
  账户信息 / 收件箱 / 忠诚计划与 HelloMoney / 通知偏好
  订单 / 受信任的设备 / 已保存的银行卡
运营后台
  概览 / 商店与目的地 / 目录与 SKU / 订单测试 / 安装与激活
  HelloMoney 与会员 / 通知 / 账户 / Review
```

## 3. 数据模型

| 实体 | 必要字段 | 关系与规则 |
| --- | --- | --- |
| Destination | `id/name/type/local|regional|global/flag/minPrice/enabled` | 一个目的地绑定一个 Catalog；目录分类驱动商店 Tab，不按 Klook 的“国家/地区混排”展示。 |
| Catalog | `id/name/coverage/network/operator` | 一个 Catalog 含多个 SKU；本地、区域、全球均允许独立目录。 |
| SKU | `id/catalogId/data/validityDays/price/currency/unlimited/activationPolicy/topUpEnabled/enabled` | 单独设置有效期起算规则及是否支持 Top up；不得全局共享日本 SKU。 |
| Order | `id/skuId/status/amount/helloMoneyUsed/createdAt` | `paid` 后生成 My eSIM 的 `pending_install` 条目；演示支付失败不生成 eSIM。 |
| MyEsim | `id/orderId/status/installMethod/remainingData/startedAt/expiresAt` | 状态仅允许：`pending_install`、`installed`、`ready_to_connect`、`active`、`low_data`、`expired`。 |
| HelloMoneyLedger | `id/type/amount/status/source` | 类型：`loyalty_cashback`、`redeem_code`、`purchase_spend`；只对 `available` 余额抵扣。 |
| Loyalty | `tier/totalSpend/cashbackRate/nextTierThreshold` | `paid` 订单生成待入账返现，完成后入余额和流水。 |
| NotificationPreference | `marketing/esimUsage/productUpdates` | 首次订阅弹窗只控制营销/产品更新；eSIM 即将耗尽等服务提醒保持独立。 |

## 4. 前台功能需求

| 功能 | UI/layout | 描述 | 备注 |
| --- | --- | --- | --- |
| FR-A01 商店首页 | 固定 375x812 手机画布，浅米背景、顶栏、搜索、横滑权益卡、分类 Tab、目的地卡、三 Tab 底栏 | 1. 顶栏显示问候、HelloMoney 余额入口和通知。2. 搜索框进入目的地搜索。3. 3 张横滑教育/权益卡分别进入不限流量说明、区域套餐目录、会员与 HelloMoney。4. 热门/本地/区域/全球切换时更换当前目的地集合及说明文案。5. 区域目录至少覆盖截图可见的中东和北非、亚洲、加勒比地区、北美洲、大洋洲、拉丁美洲；每项展示自己的最低可售价格。6. 目的地卡展示最低价格，点击进入 FR-A03。 | 截图已验证。 |
| FR-A02 新手引导与订阅 | 全屏引导与底部订阅弹窗 | 1. 新手引导第 1 步为目的地、兼容性、覆盖检查，输入目的地后才允许继续。2. 兼容性状态为 `unknown/supported/unsupported`；不支持时允许继续浏览，但购买前需明确“改为分享给其他设备”或确认仍购买。3. 首次进入可关闭的订阅弹窗，支持订阅或稍后再说。 | 引导结构截图已验证；“允许继续浏览”与分享路径为官方安装资料补全。 |
| FR-A03 目的地与套餐 | 搜索结果、目的地页、SKU 卡、套餐详情抽屉 | 1. 搜索匹配国家/地区/全球目录。2. 套餐按本地、区域、全球属性展示；SKU 明确 `流量、有效期、网络、覆盖、是否可加购、起算策略`。3. 支持普通与不限流量套餐切换，前提是该目录有此类 SKU。4. 点击 SKU 查看 Package details；继续进入结算。 | 目的地目录截图已验证；套餐属性和起算策略来自官方资料。 |
| FR-A04 结算与支付 | 订单摘要、HelloMoney 抵扣、支付确认、结果 | 1. 只能使用 available 的 HelloMoney，抵扣金额不超过应付金额。2. 模拟支付成功创建 Order 与 MyEsim；失败/取消不创建。3. 成功页提供“查看我的 eSIM”和“继续购物”。4. 结算优惠不采用旧版 Klook 门票券，订单返现不在支付前当作自动文案折扣。 | 支付页面为 C 级 Demo 补全。 |
| FR-A05 我的 eSIM | 空态、eSIM 卡、详情页、安装/连接清单、用量、Top up | 1. 空态使用旅行插画、`eSIM 让出行更轻松`标题、说明和“了解运作方式”入口；入口进入 FR-A02，且可返回“我的 eSIM”。2. 支付成功后卡片变为待安装。3. `Install or share -> Start installation` 提供应用内、二维码、手动三种方式；一次安装后不可重复安装。4. 安装完成进入连接指南；用户需手动确认开启线路/数据/漫游后进入 active。5. 有效期按 SKU 的 `on_install` 或 `on_network_connect` 起算。6. active 展示余量/到期时间；低余量和过期状态只对 `topUpEnabled` 的 SKU 显示 Top up。 | 安装、连接、起算、加购来自官方资料。 |
| FR-A06 个人资料与权益 | 独立标题顶栏、资料列表、收件箱、忠诚计划与 HelloMoney 页、兑换码、通知偏好、对公业务、语言 | 1. 顶栏显示“个人资料”、HelloMoney 余额入口和通知。2. 资料页保留首次使用引导、账户信息、收件箱、忠诚计划与 HelloMoney、通知、受信任设备、已保存银行卡、订单、对公业务和语言入口；每项均须可进入且可返回。3. 忠诚计划按消费额计算等级，显示下一等级门槛；HelloMoney 展示余额、流水和兑换码。4. 通知偏好独立控制营销更新和 eSIM 服务通知；语言切换只保存当前浏览器的演示状态。 | 账户页面结构截图已验证；账本规则为产品补齐。 |

## 5. 状态机

```text
draft order
  -> paid
  -> MyEsim.pending_install
  -> installed
  -> ready_to_connect
  -> active
  -> low_data
  -> expired

paid order
  -> loyalty_cashback.pending
  -> loyalty_cashback.available
```

禁止的跃迁：

1. `payment_failed/cancelled -> MyEsim`。
2. `pending_install -> active`，必须经过安装和连接确认。
3. `expired -> active`，只能购买新 eSIM 或在 `topUpEnabled=true` 的 SKU 上 Top up。
4. `unavailable HelloMoney` 参与抵扣。

## 6. 运营后台功能需求

| 功能 | UI/layout | 描述 | 备注 |
| --- | --- | --- | --- |
| FR-A07 商店与目的地 | 分类、教育卡、目的地表 | 配置首页分类、卡片启停/跳转、目的地名称、类型、最低价、绑定 Catalog 和上架状态。区域目录的中东和北非、亚洲、加勒比地区、北美洲、大洋洲、拉丁美洲必须作为独立 Destination 出现。保存后前台分类与搜索同步。 | 不能把目的地仅当日本套餐的文案入口。 |
| FR-A08 目录与 SKU | Catalog 与 SKU 配置 | 编辑目录的覆盖/网络/运营商；SKU 的流量、有效期、价格、无限套餐、Top up、激活策略和状态。每个区域 Destination 都绑定独立 Catalog 和 SKU，保存后详情、结算及 My eSIM 同步。 | `activationPolicy` 必须是 SKU 级。 |
| FR-A09 订单测试与 eSIM 生命周期 | 可执行订单表和状态面板 | 创建成功、失败、取消订单；对成功订单按合法状态机推进安装、连接、用量不足、过期和加购；不可直接跳转非法状态。 | 支持审查前台全部状态。 |
| FR-A10 HelloMoney 与会员 | 余额、账本、等级门槛 | 配置等级、返现比例、兑换码；发放/撤销账本项；结算页只能抵扣已可用余额。 | 不将返现和余额视为单纯装饰字段。 |
| FR-A11 通知配置 | 重要更新订阅、通知偏好 | 配置重要更新订阅文案；营销与产品更新由用户订阅控制，eSIM 使用提醒独立存在。 | 订阅文案保存后同步至前台首次订阅弹窗。 |
| FR-A12 Review | 前后台同一规则面板 | Review 开启后：规则卡 -> 对应页面/状态，页面编号 -> 规则卡，桌面端显示连接线；关闭后所有 Review DOM 均清空。 | 遵循 Linfan Review 规范。 |

## 7. 验收矩阵

| 验收点 | 通过条件 |
| --- | --- |
| 画布 | 桌面与移动均保持 375x812 手机逻辑画布；外页不滚动，内部页面可滚动。 |
| 目录 | 热门/本地/区域/全球可切换；搜索能进入正确 Destination。 |
| 区域同步 | 截图可见区域均有独立 Catalog 与 SKU，且前台最低价与后台配置一致。 |
| 购买 | 选 SKU、使用 HelloMoney、支付成功后 My eSIM 增加 pending_install 卡。 |
| 生命周期 | 安装、连接、激活、低余量、加购、过期均可从合法状态演示。 |
| 权益 | 订单返现写入流水并更新可用余额/等级。 |
| 后台 | 保存后影响前台预览；SKU 级 activation/top-up 配置确实改变前台。 |
| Review | 前后端各含规则定位和反向定位；普通模式零 Review 标记、面板、连接线。 |
| 质量 | `npm run build`、隔离 Playwright 桌面/390x844 流程、控制台错误和失败请求均为 0。 |
