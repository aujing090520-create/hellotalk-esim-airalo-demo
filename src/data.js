export const STORE_KEY = 'hellotalk-esim-airalo-demo-v2';

export const DEVICE_COMPATIBILITY_CATALOG = [
  {
    id: 'iphone-mainland-china',
    status: 'unsupported',
    platform: 'ios',
    modelPrefixes: ['iPhone'],
    allowNumericSuffix: true,
    regions: ['CN'],
  },
  {
    id: 'iphone-xs-and-later',
    status: 'supported',
    platform: 'ios',
    modelPrefixes: [
      'iPhone XS',
      'iPhone XR',
      'iPhone 11',
      'iPhone 12',
      'iPhone 13',
      'iPhone 14',
      'iPhone 15',
      'iPhone 16',
      'iPhone 17',
      'iPhone Air',
      'iPhone SE (2nd generation)',
      'iPhone SE (3rd generation)',
      'iPhone SE 2020',
      'iPhone SE 2022',
    ],
  },
  {
    id: 'google-pixel',
    status: 'supported',
    platform: 'android',
    modelPrefixes: [
      'Google Pixel 3',
      'Google Pixel 4',
      'Google Pixel 5',
      'Google Pixel 6',
      'Google Pixel 7',
      'Google Pixel 8',
      'Google Pixel 9',
    ],
  },
  {
    id: 'samsung-galaxy',
    status: 'supported',
    platform: 'android',
    modelPrefixes: [
      'Samsung Galaxy S20',
      'Samsung Galaxy S21',
      'Samsung Galaxy S22',
      'Samsung Galaxy S23',
      'Samsung Galaxy S24',
      'Samsung Galaxy S25',
      'Samsung Galaxy Note 20',
      'Samsung Galaxy Z Fold2',
      'Samsung Galaxy Z Fold3',
      'Samsung Galaxy Z Fold4',
      'Samsung Galaxy Z Fold5',
      'Samsung Galaxy Z Flip',
    ],
  },
  {
    id: 'legacy-iphone',
    status: 'unsupported',
    platform: 'ios',
    modelPrefixes: [
      'iPhone X',
      'iPhone 8',
      'iPhone 7',
      'iPhone 6',
      'iPhone SE (1st generation)',
      'iPhone SE 2016',
    ],
  },
  {
    id: 'legacy-android',
    status: 'unsupported',
    platform: 'android',
    modelPrefixes: [
      'Google Pixel 2',
      'Samsung Galaxy S10',
      'Samsung Galaxy S9',
      'Samsung Galaxy Note 10',
      'Samsung Galaxy Note 9',
    ],
  },
];

function normalizeDeviceValue(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchesDeviceModel(deviceModel, prefix) {
  const model = normalizeDeviceValue(deviceModel);
  const normalizedPrefix = normalizeDeviceValue(prefix);
  if (!model || !normalizedPrefix || !model.startsWith(normalizedPrefix)) return false;
  const nextCharacter = model.charAt(normalizedPrefix.length);
  return !nextCharacter || !/\d/.test(nextCharacter);
}

export function inferDeviceSupport({ platform, deviceModel, deviceRegion } = {}) {
  const normalizedPlatform = String(platform || '').toLowerCase();
  const normalizedRegion = String(deviceRegion || '').trim().toUpperCase();
  const matchedRule = DEVICE_COMPATIBILITY_CATALOG.find((rule) => (
    rule.platform === normalizedPlatform
    && (!rule.regions || rule.regions.includes(normalizedRegion))
    && rule.modelPrefixes.some((prefix) => (
      matchesDeviceModel(deviceModel, prefix)
      || (rule.allowNumericSuffix && normalizeDeviceValue(deviceModel).startsWith(normalizeDeviceValue(prefix)))
    ))
  ));
  return matchedRule?.status || 'unknown';
}

export const defaultData = {
  integration: {
    provider: 'fulfillment_partner',
    providerName: '履约渠道',
    environment: 'sandbox',
    packageSource: 'partner_api',
    orderSource: 'partner_api',
    paymentProvider: 'stripe',
  },
  profile: {
    deviceModel: 'iPhone 15',
    deviceRegion: 'US',
    deviceSupport: 'supported',
    deviceSupportSource: 'catalog',
    platform: 'ios',
    osVersion: '18.5',
    onboardingCompleted: false,
    searchHistory: [],
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
      { id: 'stay-connected', title: '出境也能保持连接', copy: '用目的地流量处理导航、沟通和日常出行需求。', enabled: true, theme: 'sun' },
      { id: 'keep-your-number', title: '不必更换实体 SIM 卡', copy: '在支持 eSIM 的设备上添加旅行套餐，原有号码可继续保留。', enabled: true, theme: 'map' },
      { id: 'travel-data', title: '按目的地选择套餐', copy: '出发前比较覆盖范围、流量与有效期，到达后再使用。', enabled: true, theme: 'sun' },
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
  const platform = storedProfile.platform || defaults.profile.platform;
  const deviceModel = typeof storedProfile.deviceModel === 'string' && storedProfile.deviceModel.trim()
    ? storedProfile.deviceModel.trim()
    : defaults.profile.deviceModel;
  const deviceRegion = typeof storedProfile.deviceRegion === 'string' && storedProfile.deviceRegion.trim()
    ? storedProfile.deviceRegion.trim().toUpperCase()
    : defaults.profile.deviceRegion;
  const inferredDeviceSupport = inferDeviceSupport({ platform, deviceModel, deviceRegion });
  const storedDeviceSupport = ['unknown', 'supported', 'unsupported'].includes(storedProfile.deviceSupport)
    ? storedProfile.deviceSupport
    : 'unknown';
  const storedDeviceSupportSource = storedProfile.deviceSupportSource === 'user' ? 'user' : 'unknown';
  const deviceSupport = inferredDeviceSupport !== 'unknown'
    ? inferredDeviceSupport
    : storedDeviceSupportSource === 'user'
      ? storedDeviceSupport
      : 'unknown';
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
      deviceModel,
      deviceRegion,
      deviceSupport,
      deviceSupportSource: inferredDeviceSupport !== 'unknown'
        ? 'catalog'
        : storedDeviceSupportSource === 'user'
          ? 'user'
          : 'unknown',
      platform,
      osVersion: storedProfile.osVersion || defaults.profile.osVersion,
      onboardingCompleted: Boolean(storedProfile.onboardingCompleted),
      searchHistory: Array.isArray(storedProfile.searchHistory)
        ? storedProfile.searchHistory
          .filter((id, index, history) => typeof id === 'string' && history.indexOf(id) === index)
          .slice(0, 5)
        : defaults.profile.searchHistory,
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
        paymentStatus: order.paymentStatus || (order.status === 'paid' ? 'paid' : order.status || 'pending'),
        providerOrderId: order.providerOrderId || null,
        requestId: order.requestId || null,
        fulfillmentStatus: normalizeFulfillmentStatus(order.fulfillmentStatus, order.kind),
      }))
      : defaults.orders,
    esims: storedEsims.length
      ? storedEsims.map((esim) => ({
        ...esim,
        provider: esim.provider || defaults.integration.provider,
        airaloEsimId: esim.airaloEsimId || null,
        iccid: esim.iccid || null,
        providerOrderId: esim.providerOrderId || storedOrders.find((order) => order.id === esim.orderId)?.providerOrderId || null,
        fulfillmentStatus: normalizeFulfillmentStatus(esim.fulfillmentStatus, 'purchase'),
        installGuideStatus: esim.installGuideStatus || (esim.status === 'installed' ? 'completed' : 'not_requested'),
        connectionGuideStatus: esim.connectionGuideStatus || 'not_started',
        usageStatus: esim.usageStatus || legacyUsageStatus(esim.status),
        installationMethods: Array.isArray(esim.installationMethods) ? esim.installationMethods : ['qr', 'manual'],
        networkSetup: esim.networkSetup || { isRoaming: true, apnType: 'automatic', apnValue: null },
        topUpHistory: Array.isArray(esim.topUpHistory) ? esim.topUpHistory : [],
      }))
      : defaults.esims,
  };
}

function legacyUsageStatus(status) {
  return ({
    active: 'ACTIVE',
    low_data: 'FINISHED',
    expired: 'EXPIRED',
  })[status] || 'NOT_ACTIVE';
}

function normalizeFulfillmentStatus(status, kind) {
  if (kind === 'topup' && ['topup_applied', 'fulfilled'].includes(status)) return 'topup_applied';
  if (['fulfilled', 'ready_for_install', 'installed', 'active'].includes(status)) return 'delivered';
  if (['awaiting_airalo', 'delivery_failed', 'topup_pending', 'topup_applied', 'delivered'].includes(status)) return status;
  return kind === 'topup' ? 'topup_pending' : 'awaiting_airalo';
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

export function usageStatusLabel(status) {
  return ({
    NOT_ACTIVE: '未激活',
    ACTIVE: '使用中',
    FINISHED: '流量已用尽',
    EXPIRED: '已过期',
    RECYCLED: '已回收',
    UNKNOWN: '状态待确认',
  })[status] || '状态待确认';
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
