# HelloTalk eSIM Demo

HelloTalk eSIM 购买 Demo，前端交互参考 Airalo 的信息结构与购买、安装、连接流程。

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Included flows

- 目的地、Catalog 与 SKU 的独立配置
- Airalo Partner Platform 供应侧映射：套餐 ID、供应订单、eSIM ID、ICCID 与履约状态
- Stripe Hosted Checkout 演示承接页、成功与取消返回
- 安装、连接、流量不足、Top up 与过期生命周期
- 用户端商店与“我的 eSIM”
- Linfan Review 追踪模式，仅用于验收前端需求规则

本 Demo 不再包含自建运营后台。生产架构应由 HelloTalk 服务端接入 Airalo Partner Platform，负责套餐同步、下单、eSIM 交付、状态回调、幂等、退款和对账；支付由 HelloTalk 自己的 Stripe 账户承接。

当前演示数据仅保存在浏览器 `localStorage`。Stripe Checkout 和 Airalo Partner Platform 均为本地模拟映射，不连接真实 API，也不会收集银行卡信息。
