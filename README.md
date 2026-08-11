# HelloTalk eSIM Demo

HelloTalk eSIM 购买 Demo，前端交互参考旅行 eSIM 的信息结构与购买、安装、连接流程。

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Demo console and Review mode

桌面浏览器默认显示 Demo 控制台，位于手机画布外，可通过控制台标题栏的“收起”或“展开”切换。控制台用于复现购买、交付、安装、连接、用量、加购和设备兼容状态，不会出现在手机用户端界面。

使用 `/?review=1` 启动林凡 Review 追溯模式。宽度不小于 1260px 时，右侧增加 PRD 规则追溯；选中规则会以连线定位到页面编号。

## Included flows

- 目的地、Catalog 与 SKU 的独立配置
- 履约渠道映射：套餐 ID、履约订单、eSIM ID、ICCID 与履约状态
- Stripe Hosted Checkout 演示承接页、成功与取消返回
- Stripe 已支付、eSIM 交付中/已交付、安装指引、连接设置、用量状态、Top up 与过期生命周期
- 用户端商店与“我的 eSIM”
- 桌面 Demo 控制台：可快速复现购买、履约、安装、连接、用量、加购和设备兼容边界
- Linfan Review 追踪模式：PRD 规则追溯与页面连线定位

本 Demo 不再包含自建运营后台。生产架构应由 HelloTalk 服务端通过履约渠道适配层负责套餐同步、下单、eSIM 交付、状态回调、幂等、退款和对账；Airalo Partner Platform 为首期接入参考。支付由 HelloTalk 自己的 Stripe 账户承接。

当前演示数据仅保存在浏览器 `localStorage`。Stripe Checkout 与履约渠道均为本地模拟映射，不连接真实 API，也不会收集银行卡信息。Demo 会明确区分支付确认、eSIM 准备、安装引导、系统安装与网络可用；模拟控制只在桌面画布外的 Demo 控制台中展示，不代表真实履约渠道事件。Demo 展示银行卡和支付宝两种支付方式；实际线上可用方式由 Stripe 账户、地区、币种和支付方式配置决定。
