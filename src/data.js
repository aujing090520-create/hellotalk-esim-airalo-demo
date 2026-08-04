export const STORE_KEY = 'hellotalk-esim-airalo-demo-v2';

export const defaultData = {
  profile: {
    name: 'Yiyi',
    email: 'yiyi@hellotalk.com',
    language: '简体中文',
    deviceSupport: 'supported',
    onboardingCompleted: false,
    subscribePromptSeen: false,
    trustedDevices: [
      { id: 'device-current', name: 'iPhone 15 Pro', detail: '当前设备 · 最近使用', current: true, trusted: true },
    ],
    savedCards: [
      { id: 'card-demo', brand: 'Visa', last4: '4242', expiry: '12/28', default: true },
    ],
    notificationPreference: {
      marketing: false,
      esimUsage: true,
      productUpdates: false,
    },
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
    { id: 'jp-1', catalogId: 'cat-japan', data: '1 GB', validityDays: 7, price: 4.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'jp-3', catalogId: 'cat-japan', data: '3 GB', validityDays: 15, price: 8, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'jp-unlimited', catalogId: 'cat-japan', data: '不限流量', validityDays: 10, price: 22, currency: 'USD', unlimited: true, activationPolicy: 'on_install', topUpEnabled: false, enabled: true },
    { id: 'us-1', catalogId: 'cat-usa', data: '1 GB', validityDays: 7, price: 4.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'us-5', catalogId: 'cat-usa', data: '5 GB', validityDays: 30, price: 16, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'fr-3', catalogId: 'cat-france', data: '3 GB', validityDays: 15, price: 8.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'sg-3', catalogId: 'cat-singapore', data: '3 GB', validityDays: 15, price: 7, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'asia-3', catalogId: 'cat-asia', data: '3 GB', validityDays: 30, price: 12, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'asia-10', catalogId: 'cat-asia', data: '10 GB', validityDays: 30, price: 28, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'eu-5', catalogId: 'cat-europe', data: '5 GB', validityDays: 30, price: 18, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'mena-1', catalogId: 'cat-mena', data: '1 GB', validityDays: 7, price: 5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'mena-3', catalogId: 'cat-mena', data: '3 GB', validityDays: 30, price: 13, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'caribbean-1', catalogId: 'cat-caribbean', data: '1 GB', validityDays: 7, price: 9, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'caribbean-3', catalogId: 'cat-caribbean', data: '3 GB', validityDays: 30, price: 22, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'na-1', catalogId: 'cat-north-america', data: '1 GB', validityDays: 7, price: 7, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'na-5', catalogId: 'cat-north-america', data: '5 GB', validityDays: 30, price: 24, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'oceania-1', catalogId: 'cat-oceania', data: '1 GB', validityDays: 7, price: 6.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'oceania-3', catalogId: 'cat-oceania', data: '3 GB', validityDays: 30, price: 16, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'latam-1', catalogId: 'cat-latin-america', data: '1 GB', validityDays: 7, price: 7.5, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'latam-3', catalogId: 'cat-latin-america', data: '3 GB', validityDays: 30, price: 19, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
    { id: 'world-3', catalogId: 'cat-global', data: '3 GB', validityDays: 15, price: 18, currency: 'USD', unlimited: false, activationPolicy: 'on_network_connect', topUpEnabled: true, enabled: true },
  ],
  orders: [],
  esims: [],
  ledger: [
    { id: 'seed-reward', type: 'redeem_code', amount: 3, status: 'available', source: '欢迎奖励', createdAt: '2026-08-04T09:00:00.000Z' },
  ],
  loyalty: { tier: '旅行者', totalSpend: 0, cashbackRate: 0.05, nextTierThreshold: 50 },
  referral: { code: 'YIYI-TRAVEL', rewardPerReferral: 3, referralCount: 0, rewardedAmount: 0, counterpartRewardEvents: [] },
  settings: {
    onboardingEnabled: true,
    subscribeSheetEnabled: true,
    welcomeCard: 'referral',
    referralReward: 3,
    cashbackDelay: 'instant',
    notificationCopy: '通过电子邮件接收优惠、eSIM 使用提示和流量提醒。',
    homeCards: [
      { id: 'unlimited', title: '不限流量，轻松出行', copy: '需要持续连接时，优先查看不限流量套餐与适用规则。', action: 'store-unlimited', enabled: true, theme: 'sun' },
      { id: 'regional', title: '一次覆盖多个目的地', copy: '跨国行程可从区域和全球套餐中选择覆盖范围。', action: 'store-regional', enabled: true, theme: 'map' },
      { id: 'referral', title: '推荐好友，赚取 HelloMoney', copy: '好友首单完成后，双方获得旅行余额。', action: 'referral', enabled: true, theme: 'referral' },
      { id: 'loyalty', title: '旅行越多，回馈越多', copy: '通过订单累计消费，并查看会员返现与余额。', action: 'wallet', enabled: true, theme: 'loyalty' },
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

export function hydrateData(storedData) {
  const defaults = cloneDefaultData();
  if (!storedData || typeof storedData !== 'object') return defaults;
  const storedProfile = storedData.profile || {};
  const storedSettings = storedData.settings || {};
  return {
    ...defaults,
    ...storedData,
    profile: {
      ...defaults.profile,
      ...storedProfile,
      notificationPreference: {
        ...defaults.profile.notificationPreference,
        ...(storedProfile.notificationPreference || {}),
      },
      trustedDevices: storedProfile.trustedDevices || defaults.profile.trustedDevices,
      savedCards: storedProfile.savedCards || defaults.profile.savedCards,
    },
    destinations: mergeRecords(defaults.destinations, storedData.destinations),
    catalogs: mergeRecords(defaults.catalogs, storedData.catalogs),
    skus: mergeRecords(defaults.skus, storedData.skus),
    settings: {
      ...defaults.settings,
      ...storedSettings,
      homeCards: mergeRecords(defaults.settings.homeCards, storedSettings.homeCards),
    },
    orders: storedData.orders || defaults.orders,
    esims: storedData.esims || defaults.esims,
    ledger: storedData.ledger || defaults.ledger,
    loyalty: { ...defaults.loyalty, ...(storedData.loyalty || {}) },
    referral: { ...defaults.referral, ...(storedData.referral || {}) },
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

export function availableMoney(data) {
  return data.ledger
    .filter((entry) => entry.status === 'available')
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function money(value) {
  return `$${Number(value).toFixed(2)}`;
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
