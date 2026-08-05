export const STORE_KEY = 'hellotalk-esim-airalo-demo-v2';

export const defaultData = {
  integration: {
    provider: 'airalo_partner',
    providerName: 'Airalo Partner Platform',
    environment: 'sandbox',
    packageSource: 'partner_api',
    orderSource: 'partner_api',
    paymentProvider: 'stripe',
  },
  profile: {
    deviceSupport: 'supported',
    onboardingCompleted: false,
  },
  destinations: [
    { id: 'japan', name: '日本', flag: '🇯🇵', type: 'local', catalogId: 'cat-japan', enabled: true },
    { id: 'usa', name: '美国', flag: '🇺🇸', type: 'local', catalogId: 'cat-usa', enabled: true },
    { id: 'france', name: '法国', flag: '🇫🇷', type: 'local', catalogId: 'cat-france', enabled: true },
    { id: 'singapore', name: '新加坡', flag: '🇸🇬', type: 'local', catalogId: 'cat-singapore', enabled: true },
    { id: 'asia', name: '亚洲', flag: '🌏', type: 'regional', catalogId: 'cat-asia', enabled: true },
    { id: 'europe', name: '欧洲', flag: '🗺️', type: 'regional', catalogId: 'cat-europe', enabled: true },
    { id: 'mena', name: '中东和北非', flag: '🕌', type: 'regional', catalogId: 'cat-mena', enabled: true },
    { id: 'caribbean', name: '加勒比地区', flag: '🏝️', type: 'regional', catalogId: 'cat-caribbean', enabled: true },
    { id: 'north-america', name: '北美洲', flag: '🌎', type: 'regional', catalogId: 'cat-north-america', enabled: true },
    { id: 'oceania', name: '大洋洲', flag: '🌊', type: 'regional', catalogId: 'cat-oceania', enabled: true },
    { id: 'latin-america', name: '拉丁美洲', flag: '🌎', type: 'regional', catalogId: 'cat-latin-america', enabled: true },
    { id: 'global', name: '全球', flag: '🌐', type: 'global', catalogId: 'cat-global', enabled: true },
  ],
  catalogs: [
    { id: 'cat-japan', name: '日本', coverage: '日本全国', network: 'KDDI / SoftBank', operator: '多网自动切换' },
    { id: 'cat-usa', name: '美国', coverage: '美国本土', network: 'T-Mobile', operator: 'T-Mobile' },
    { id: 'cat-france', name: '法国', coverage: '法国', network: 'Orange', operator: 'Orange' },
    { id: 'cat-singapore', name: '新加坡', coverage: '新加坡', network: 'Singtel', operator: 'Singtel' },
    { id: 'cat-asia', name: '亚洲', coverage: '13 个亚洲国家和地区', network: '4G / 5G', operator: '区域合作网络' },
    { id: 'cat-europe', name: '欧洲', coverage: '39 个欧洲国家和地区', network: '4G / 5G', operator: '区域合作网络' },
    { id: 'cat-mena', name: '中东和北非', coverage: '14 个中东和北非国家和地区', network: '4G / 5G', operator: '区域合作网络' },
    { id: 'cat-caribbean', name: '加勒比地区', coverage: '24 个加勒比目的地', network: '4G / LTE', operator: '区域合作网络' },
    { id: 'cat-north-america', name: '北美洲', coverage: '美国、加拿大和墨西哥', network: '4G / 5G', operator: '区域合作网络' },
    { id: 'cat-oceania', name: '大洋洲', coverage: '8 个大洋洲国家和地区', network: '4G / LTE', operator: '区域合作网络' },
    { id: 'cat-latin-america', name: '拉丁美洲', coverage: '18 个拉丁美洲国家和地区', network: '4G / LTE', operator: '区域合作网络' },
    { id: 'cat-global', name: '全球', coverage: '136 个国家和地区', network: '4G / 5G', operator: '全球合作网络' },
  ],
  skus: [
    { id: 'jp-1', airaloPackageId: 'kallur-digital-7days-1gb', catalogId: 'cat-japan', data: '1 GB', validityDays: 7, price: 4.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'jp-3', airaloPackageId: 'kallur-digital-15days-3gb', catalogId: 'cat-japan', data: '3 GB', validityDays: 15, price: 8, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'jp-unlimited', airaloPackageId: 'kallur-digital-10days-unlimited', catalogId: 'cat-japan', data: '不限流量', validityDays: 10, price: 22, currency: 'USD', unlimited: true, activationPolicy: 'on_install', topUpEnabled: false, enabled: true },
    { id: 'us-1', airaloPackageId: 'change-7days-1gb', catalogId: 'cat-usa', data: '1 GB', validityDays: 7, price: 4.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'us-5', airaloPackageId: 'change-30days-5gb', catalogId: 'cat-usa', data: '5 GB', validityDays: 30, price: 16, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'fr-3', airaloPackageId: 'change-15days-3gb', catalogId: 'cat-france', data: '3 GB', validityDays: 15, price: 8.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'sg-3', airaloPackageId: 'change-15days-3gb', catalogId: 'cat-singapore', data: '3 GB', validityDays: 15, price: 7, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'asia-3', airaloPackageId: 'change-30days-3gb', catalogId: 'cat-asia', data: '3 GB', validityDays: 30, price: 12, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'asia-10', airaloPackageId: 'change-30days-10gb', catalogId: 'cat-asia', data: '10 GB', validityDays: 30, price: 28, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'eu-5', airaloPackageId: 'change-europe-30days-5gb', catalogId: 'cat-europe', data: '5 GB', validityDays: 30, price: 18, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'mena-1', airaloPackageId: 'change-mena-7days-1gb', catalogId: 'cat-mena', data: '1 GB', validityDays: 7, price: 5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'mena-3', airaloPackageId: 'change-mena-30days-3gb', catalogId: 'cat-mena', data: '3 GB', validityDays: 30, price: 13, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'caribbean-1', airaloPackageId: 'change-caribbean-7days-1gb', catalogId: 'cat-caribbean', data: '1 GB', validityDays: 7, price: 9, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'caribbean-3', airaloPackageId: 'change-caribbean-30days-3gb', catalogId: 'cat-caribbean', data: '3 GB', validityDays: 30, price: 22, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'na-1', airaloPackageId: 'change-north-america-7days-1gb', catalogId: 'cat-north-america', data: '1 GB', validityDays: 7, price: 7, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'na-5', airaloPackageId: 'change-north-america-30days-5gb', catalogId: 'cat-north-america', data: '5 GB', validityDays: 30, price: 24, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'oceania-1', airaloPackageId: 'change-oceania-7days-1gb', catalogId: 'cat-oceania', data: '1 GB', validityDays: 7, price: 6.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'oceania-3', airaloPackageId: 'change-oceania-30days-3gb', catalogId: 'cat-oceania', data: '3 GB', validityDays: 30, price: 16, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'latam-1', airaloPackageId: 'change-latin-america-7days-1gb', catalogId: 'cat-latin-america', data: '1 GB', validityDays: 7, price: 7.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'latam-3', airaloPackageId: 'change-latin-america-30days-3gb', catalogId: 'cat-latin-america', data: '3 GB', validityDays: 30, price: 19, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'world-3', airaloPackageId: 'change-global-15days-3gb', catalogId: 'cat-global', data: '3 GB', validityDays: 15, price: 18, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
  ],
  orders: [],
  esims: [],
  settings: {
    homeCards: [
      { id: 'unlimited', title: '不限流量，轻松出行', copy: '需要持续连接时，优先查看不限流量套餐与适用规则。', action: 'store-unlimited', enabled: true, theme: 'sun' },
      { id: 'regional', title: '一次覆盖多个目的地', copy: '跨国行程可从区域和全球套餐中选择覆盖范围。', action: 'store-regional', enabled: true, theme: 'map' },
    ],
  },
};

export function cloneDefaultData() {
  return JSON.parse(JSON.stringify(defaultData));
}

function mergeRecords(defaultRecords, storedRecords = []) {
  const storedById = new Map(storedRecords.filter((item) => item?.id).map((item) => [item.id, item]));
  const defaultIds = new Set(defaultRecords.map((item) => item.id));
  return [
    ...defaultRecords.map((item) => ({ ...item, ...(storedById.get(item.id) || {}) })),
    ...storedRecords.filter((item) => item?.id && !defaultIds.has(item.id)),
  ];
}

function normalizeSku(sku) {
  if (!sku?.id) return sku;
  return {
    ...sku,
    airaloPackageId: sku.airaloPackageId || `demo-${sku.catalogId || 'catalog'}-${sku.id}`,
  };
}

export function hydrateData(storedData) {
  const defaults = cloneDefaultData();
  if (!storedData || typeof storedData !== 'object') return defaults;
  const storedProfile = storedData.profile || {};
  const storedSettings = storedData.settings || {};
  const storedOrders = Array.isArray(storedData.orders) ? storedData.orders : [];
  const storedEsims = Array.isArray(storedData.esims) ? storedData.esims : [];
  const {
    referral: _referral,
    ledger: _ledger,
    loyalty: _loyalty,
    ...storedWithoutRemovedFeatures
  } = storedData;
  const {
    welcomeCard: _welcomeCard,
    referralReward: _referralReward,
    onboardingEnabled: _onboardingEnabled,
    subscribeSheetEnabled: _subscribeSheetEnabled,
    cashbackDelay: _cashbackDelay,
    notificationCopy: _notificationCopy,
    ...storedSettingsWithoutRemovedFeatures
  } = storedSettings;
  return {
    ...defaults,
    ...storedWithoutRemovedFeatures,
    integration: {
      ...defaults.integration,
      ...(storedData.integration || {}),
    },
    profile: {
      ...defaults.profile,
      deviceSupport: ['unknown', 'supported', 'unsupported'].includes(storedProfile.deviceSupport)
        ? storedProfile.deviceSupport
        : defaults.profile.deviceSupport,
      onboardingCompleted: Boolean(storedProfile.onboardingCompleted),
    },
    destinations: mergeRecords(defaults.destinations, storedData.destinations),
    catalogs: mergeRecords(defaults.catalogs, storedData.catalogs),
    skus: mergeRecords(defaults.skus, storedData.skus).map(normalizeSku),
    settings: {
      ...defaults.settings,
      ...storedSettingsWithoutRemovedFeatures,
      homeCards: mergeRecords(defaults.settings.homeCards, storedSettings.homeCards)
        .filter((card) => defaults.settings.homeCards.some((defaultCard) => defaultCard.id === card.id)),
    },
    orders: storedOrders.length
      ? storedOrders.map((order) => ({
        ...order,
        provider: order.provider || defaults.integration.provider,
        paymentProvider: order.paymentProvider || 'stripe_demo',
        airaloPackageId: order.airaloPackageId || null,
        providerOrderId: order.providerOrderId || `demo-airalo-order-${order.id}`,
        fulfillmentStatus: order.fulfillmentStatus || (order.kind === 'topup' ? 'topup_applied' : 'fulfilled'),
      }))
      : defaults.orders,
    esims: storedEsims.length
      ? storedEsims.map((esim) => ({
        ...esim,
        provider: esim.provider || defaults.integration.provider,
        airaloEsimId: esim.airaloEsimId || `demo-airalo-esim-${esim.id}`,
        iccid: esim.iccid || `demo-iccid-${esim.id}`,
        providerOrderId: esim.providerOrderId || storedOrders.find((order) => order.id === esim.orderId)?.providerOrderId || `demo-airalo-order-${esim.orderId || esim.id}`,
      }))
      : defaults.esims,
  };
}

export function getCatalog(data, catalogId) {
  return data.catalogs.find((catalog) => catalog.id === catalogId);
}

export function getDestination(data, id) {
  return data.destinations.find((destination) => destination.id === id);
}

export function getSku(data, id) {
  return data.skus.find((sku) => sku.id === id);
}

export function money(value) {
  return `US$${Number(value).toFixed(2)}`;
}

export function dateLabel(value) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export function skuLabel(sku) {
  return `${sku.data} / ${sku.validityDays} 天`;
}

export function validTransitions(esim) {
  const transitions = {
    pending_install: ['installed'],
    installed: ['ready_to_connect'],
    ready_to_connect: ['active'],
    active: ['low_data', 'expired'],
    low_data: ['expired'],
    expired: [],
  };
  return transitions[esim.status] || [];
}

export function minCatalogPrice(data, catalogId) {
  const prices = data.skus
    .filter((sku) => sku.catalogId === catalogId && sku.enabled)
    .map((sku) => Number(sku.price))
    .filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : null;
}

export function planStartCopy(sku) {
  return sku.activationPolicy === 'on_install' ? '安装后开始计算有效期' : '首次连接支持网络后开始计算';
}
