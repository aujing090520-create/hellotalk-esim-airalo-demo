# HelloTalk eSIM Demo

HelloTalk eSIM 购买与运营配置 Demo，前台交互参考 Airalo 的信息结构与使用流程。

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
- Stripe Hosted Checkout 演示承接页、成功与取消返回
- 安装、连接、流量不足、Top up 与过期生命周期
- 用户端商店与“我的 eSIM”
- 运营后台及 Linfan Review 追踪模式

所有数据仅保存在浏览器 `localStorage`。本项目不连接真实 Stripe、支付、订单、库存或运营商服务，也不会收集银行卡信息。
