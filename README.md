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
- eSIM 购买、HelloMoney 抵扣、模拟付款
- 安装、连接、流量不足、Top up 与过期生命周期
- 个人资料与订单入口
- 运营后台及 Linfan Review 追踪模式

所有数据仅保存在浏览器 `localStorage`，不连接真实库存、订单或支付服务。
