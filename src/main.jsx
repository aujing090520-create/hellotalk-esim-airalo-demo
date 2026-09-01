import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  Download,
  Globe2,
  Info,
  MessageCircle,
  MoreHorizontal,
  Package,
  QrCode,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Signal,
  Smartphone,
  Wifi,
  X,
} from 'lucide-react';
import {
  STORE_KEY,
  cloneDefaultData,
  dateLabel,
  getCatalog,
  getDestination,
  getSku,
  hydrateData,
  inferDeviceSupport,
  minCatalogPrice,
  money,
  planStartCopy,
  skuLabel,
  usageStatusLabel,
} from './data';
import './styles.css';

const RULES = {
  'FR-002': { title: '目的地发现与搜索', pages: ['store', 'search'], surface: 'app' },
  'FR-003': { title: '套餐详情与价格', pages: ['plan', 'destination'], surface: 'app' },
  'FR-004': { title: '设备兼容性提示', pages: ['onboarding', 'compatibility-checkout'], surface: 'app' },
  'FR-005': { title: '确认订单与 Stripe Checkout', pages: ['checkout', 'stripe-checkout'], surface: 'app' },
  'FR-006': { title: '支付确认与 eSIM 交付', pages: ['success', 'my-esims'], surface: 'app' },
  'FR-007': { title: '我的 eSIM 列表与详情', pages: ['my-esims', 'esim-detail'], surface: 'app' },
  'FR-008': { title: 'eSIM 安装', pages: ['install'], surface: 'app' },
  'FR-009': { title: '抵达后连接与故障引导', pages: ['connect', 'support'], surface: 'app' },
  'FR-010': { title: '有效期、用量与状态刷新', pages: ['esim-detail', 'my-esims'], surface: 'app' },
  'FR-011': { title: 'Top up 加购', pages: ['plan', 'destination', 'checkout'], surface: 'app' },
  'FR-012': { title: '帮助、退款与异常告知', pages: ['support', 'support-topic', 'support-article', 'support-request'], surface: 'app' },
};

const PAGE_IDS = new Set([
  'store',
  'search',
  'destination',
  'plan',
  'device-check',
  'compatibility-checkout',
  'checkout',
  'stripe-checkout',
  'success',
  'my-esims',
  'esim-detail',
  'install',
  'install-progress',
  'connect',
  'onboarding',
  'support',
  'support-topic',
  'support-article',
  'support-request',
]);

const PAGE_BACK_FALLBACKS = {
  search: 'store',
  destination: 'store',
  plan: 'destination',
  'device-check': 'plan',
  'compatibility-checkout': 'plan',
  checkout: 'plan',
  'stripe-checkout': 'checkout',
  success: 'my-esims',
  'esim-detail': 'my-esims',
  install: 'esim-detail',
  'install-progress': 'install',
  connect: 'esim-detail',
  onboarding: 'store',
  support: 'store',
  'support-topic': 'support',
  'support-article': 'support-topic',
  'support-request': 'support',
};

const DEMO_DEVICE_PROFILES = [
  { id: 'iphone-15', label: 'iPhone 15 · 支持', platform: 'ios', deviceModel: 'iPhone 15', deviceRegion: 'US', osVersion: '18.5' },
  { id: 'iphone-8', label: 'iPhone 8 · 不支持', platform: 'ios', deviceModel: 'iPhone 8', deviceRegion: 'US', osVersion: '16.7' },
  { id: 'fairphone-5', label: 'Fairphone 5 · 待确认', platform: 'android', deviceModel: 'Fairphone 5', deviceRegion: 'DE', osVersion: '14' },
];

const DEMO_SCENARIOS = [
  { id: 'store', label: '初始商店', detail: '没有 eSIM，回到购买入口。' },
  { id: 'awaiting-airalo', label: '已支付，交付中', detail: 'Stripe 已确认，正在准备 eSIM。' },
  { id: 'pending-install', label: '已交付，待安装', detail: '已获得 eSIM，但尚未打开安装指引。' },
  { id: 'installed', label: '已安装，待连接', detail: '系统已添加 eSIM，尚未完成网络设置。' },
  { id: 'ready-to-connect', label: '已设置，待验证', detail: '已完成连接引导，等待套餐状态更新。' },
  { id: 'active', label: '正常可用', detail: '套餐状态已更新为可使用。' },
  { id: 'finished', label: '流量已用尽', detail: '可进入加购链路。' },
  { id: 'expired', label: '套餐已过期', detail: '可进入加购链路，具体资格以当前套餐为准。' },
  { id: 'topup-pending', label: '加购同步中', detail: 'Stripe 已确认加购，等待按 ICCID 同步。' },
  { id: 'delivery-failed', label: '交付异常', detail: '支付已确认，但 eSIM 暂未准备完成。' },
  { id: 'install-capacity', label: '安装受限：SIM 容量不足', detail: '系统要求先停用一张线路。' },
  { id: 'install-interrupted', label: '安装已中断', detail: '用户取消或离开系统安装流程，可再次开始。' },
  { id: 'install-failed', label: '安装失败', detail: '系统返回不可恢复安装失败，需要重试或联系支持。' },
  { id: 'installing', label: '正在添加到设备', detail: '系统正在下载并添加 eSIM。' },
];

const INSTALL_FLOW_OPTIONS = [
  ['idle', '未开始'],
  ['starting', '正在开始安装'],
  ['capacity_blocked', 'SIM 容量不足'],
  ['system_permission', '等待系统授权'],
  ['adding', '正在添加到设备'],
  ['interrupted', '安装已中断'],
  ['failed', '安装失败'],
  ['installed_confirmed', '安装成功待确认'],
  ['complete', '已确认安装'],
];

function demoNow() {
  return new Date().toISOString();
}

function ensureDemoIdentifiers(esim) {
  return {
    ...esim,
    airaloEsimId: esim.airaloEsimId || `demo-simulated-airalo-esim-${esim.id}`,
    iccid: esim.iccid || `demo-simulated-iccid-${esim.id}`,
    providerOrderId: esim.providerOrderId || `demo-simulated-airalo-order-${esim.orderId}`,
    simulated: true,
  };
}

function createDemoPurchase(data) {
  const sku = data.skus.find((item) => item.id === 'jp-3' && item.enabled)
    || data.skus.find((item) => item.enabled);
  const now = demoNow();
  const orderId = `demo-order-${Date.now()}`;
  const esimId = `demo-esim-${Date.now()}`;
  const requestId = `demo-request-${orderId}`;
  return {
    order: {
      id: orderId,
      skuId: sku.id,
      airaloPackageId: sku.airaloPackageId,
      kind: 'purchase',
      parentEsimId: null,
      esimId,
      airaloEsimId: null,
      iccid: null,
      status: 'paid',
      paymentStatus: 'paid',
      amount: sku.price,
      paymentProvider: 'stripe_demo',
      provider: 'airalo_partner',
      providerOrderId: null,
      requestId,
      fulfillmentStatus: 'awaiting_airalo',
      createdAt: now,
    },
    esim: {
      id: esimId,
      orderId,
      currentSkuId: sku.id,
      airaloEsimId: null,
      iccid: null,
      provider: 'airalo_partner',
      providerOrderId: null,
      requestId,
      status: 'pending_install',
      fulfillmentStatus: 'awaiting_airalo',
      installGuideStatus: 'not_requested',
      installFlowState: 'idle',
      connectionGuideStatus: 'not_started',
      usageStatus: 'NOT_ACTIVE',
      installMethod: null,
      installationMethods: ['direct', 'qr', 'manual'],
      networkSetup: { isRoaming: true, apnType: 'manual', apnValue: 'wbdata' },
      remainingData: sku.unlimited ? null : sku.data,
      startedAt: null,
      expiresAt: null,
      topUpHistory: [],
      topUpEligible: true,
      simulated: true,
    },
  };
}

function ensureScenarioEsim(next) {
  if (next.esims.length) return next.esims[0];
  const created = createDemoPurchase(next);
  next.orders.unshift(created.order);
  next.esims.unshift(created.esim);
  return created.esim;
}

function setDemoUsage(target, sku, usageStatus) {
  const now = new Date();
  target.usageStatus = usageStatus;
  if (usageStatus === 'ACTIVE') {
    target.status = 'active';
    target.remainingData = sku.unlimited ? null : target.remainingData === '0 MB' ? sku.data : (target.remainingData || sku.data);
    if (!target.startedAt) {
      target.startedAt = now.toISOString();
      target.expiresAt = new Date(now.getTime() + sku.validityDays * 86400000).toISOString();
    }
  }
  if (usageStatus === 'FINISHED') {
    target.status = 'low_data';
    target.remainingData = '0 MB';
  }
  if (usageStatus === 'EXPIRED') target.status = 'expired';
  if (usageStatus === 'RECYCLED') target.status = 'expired';
  target.lastSyncedAt = now.toISOString();
}

function topUpSyncState(data, esim) {
  if (!esim) return '';
  if (esim.fulfillmentStatus === 'topup_pending') return 'topup_pending';
  const topUpOrder = data.orders.find((order) => (
    order.kind === 'topup'
      && (order.parentEsimId === esim.id || order.esimId === esim.id)
      && order.fulfillmentStatus === 'topup_applied'
  ));
  return topUpOrder || (esim.topUpHistory || []).length ? 'topup_applied' : '';
}

function applyDemoScenario(current, scenarioId) {
  if (scenarioId === 'store') {
    return { data: cloneDefaultData(), page: 'store', esimId: null, destinationId: 'japan', skuId: null, checkoutMode: 'purchase' };
  }
  const next = structuredClone(current);
  const target = ensureScenarioEsim(next);
  const sku = currentEsimSku(next, target);
  const destination = next.destinations.find((item) => item.catalogId === sku.catalogId && item.enabled);
  const now = new Date();
  const clearTopUpState = () => {
    next.orders = next.orders.filter((order) => !(
      order.kind === 'topup'
      && (order.parentEsimId === target.id || order.esimId === target.id)
    ));
    target.pendingTopUpOrderId = null;
    target.topUpHistory = [];
  };
  const delivered = () => {
    clearTopUpState();
    Object.assign(target, ensureDemoIdentifiers(target), {
      fulfillmentStatus: 'delivered',
      status: 'pending_install',
      installGuideStatus: 'not_requested',
      installFlowState: 'idle',
      connectionGuideStatus: 'not_started',
      networkSetup: { isRoaming: true, apnType: 'manual', apnValue: 'wbdata' },
      usageStatus: 'NOT_ACTIVE',
      remainingData: sku.unlimited ? null : sku.data,
      startedAt: null,
      expiresAt: null,
    });
  };

  if (scenarioId === 'awaiting-airalo') {
    clearTopUpState();
    Object.assign(target, {
      airaloEsimId: null,
      iccid: null,
      providerOrderId: null,
      fulfillmentStatus: 'awaiting_airalo',
      status: 'pending_install',
      installGuideStatus: 'not_requested',
      installFlowState: 'idle',
      connectionGuideStatus: 'not_started',
      usageStatus: 'NOT_ACTIVE',
      startedAt: null,
      expiresAt: null,
    });
  }
  if (scenarioId === 'pending-install') delivered();
  if (scenarioId === 'installed') {
    delivered();
    target.status = 'installed';
    target.installGuideStatus = 'completed';
    target.installFlowState = 'complete';
  }
  if (scenarioId === 'ready-to-connect') {
    delivered();
    target.status = 'ready_to_connect';
    target.installGuideStatus = 'completed';
    target.installFlowState = 'complete';
    target.connectionGuideStatus = 'completed';
  }
  if (scenarioId === 'active') {
    delivered();
    target.installGuideStatus = 'completed';
    target.installFlowState = 'complete';
    target.connectionGuideStatus = 'completed';
    setDemoUsage(target, sku, 'ACTIVE');
  }
  if (scenarioId === 'finished' || scenarioId === 'expired') {
    delivered();
    target.installGuideStatus = 'completed';
    target.installFlowState = 'complete';
    target.connectionGuideStatus = 'completed';
    setDemoUsage(target, sku, scenarioId === 'finished' ? 'FINISHED' : 'EXPIRED');
  }
  if (scenarioId === 'delivery-failed') {
    clearTopUpState();
    Object.assign(target, {
      airaloEsimId: null,
      iccid: null,
      providerOrderId: null,
      fulfillmentStatus: 'delivery_failed',
      status: 'pending_install',
      installGuideStatus: 'not_requested',
      installFlowState: 'idle',
      connectionGuideStatus: 'not_started',
      usageStatus: 'NOT_ACTIVE',
      startedAt: null,
      expiresAt: null,
    });
  }
  if (['install-capacity', 'install-interrupted', 'install-failed', 'installing'].includes(scenarioId)) {
    delivered();
    target.installGuideStatus = 'opened';
    target.installFlowState = ({
      'install-capacity': 'capacity_blocked',
      'install-interrupted': 'interrupted',
      'install-failed': 'failed',
      installing: 'adding',
    })[scenarioId];
  }
  if (scenarioId === 'topup-pending') {
    delivered();
    target.installGuideStatus = 'completed';
    target.installFlowState = 'complete';
    target.connectionGuideStatus = 'completed';
    setDemoUsage(target, sku, 'FINISHED');
    const existing = next.orders.find((order) => order.id === target.pendingTopUpOrderId);
    if (!existing) {
      const topUpOrderId = `demo-topup-${Date.now()}`;
      next.orders.unshift({
        id: topUpOrderId,
        skuId: sku.id,
        airaloPackageId: sku.airaloPackageId,
        kind: 'topup',
        parentEsimId: target.id,
        esimId: target.id,
        airaloEsimId: target.airaloEsimId,
        iccid: target.iccid,
        status: 'paid',
        paymentStatus: 'paid',
        amount: sku.price,
        paymentProvider: 'stripe_demo',
        provider: 'airalo_partner',
        providerOrderId: null,
        requestId: `demo-request-${topUpOrderId}`,
        fulfillmentStatus: 'topup_pending',
        createdAt: now.toISOString(),
      });
      target.pendingTopUpOrderId = topUpOrderId;
    } else {
      existing.fulfillmentStatus = 'topup_pending';
    }
    target.fulfillmentStatus = 'topup_pending';
  }

  return {
    data: next,
    page: ['install-capacity', 'installing'].includes(scenarioId) ? 'install-progress' : ['install-interrupted', 'install-failed'].includes(scenarioId) ? 'install' : 'esim-detail',
    esimId: target.id,
    destinationId: destination?.id || 'japan',
    skuId: sku.id,
    checkoutMode: scenarioId === 'topup-pending' ? 'topup' : 'purchase',
  };
}

function usePersistedData() {
  const [data, setData] = useState(() => {
    try {
      const parsed = localStorage.getItem(STORE_KEY);
      return parsed ? hydrateData(JSON.parse(parsed)) : cloneDefaultData();
    } catch {
      return cloneDefaultData();
    }
  });
  useEffect(() => localStorage.setItem(STORE_KEY, JSON.stringify(data)), [data]);
  return [data, setData];
}

function IconButton({ label, children, onClick, className = '', disabled = false }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>;
}

function PageHeader({ title, back, right, rule, secondaryRule, review, onRule }) {
  return <header className="page-header">
    <div className="header-side">{back && <IconButton label="返回" onClick={() => back()}><ChevronLeft /></IconButton>}</div>
    <h1>{title}</h1>
    <div className="header-side">{right}</div>
    <RuleMarker id={rule} review={review} onClick={onRule} />
    <RuleMarker id={secondaryRule} review={review} onClick={onRule} className="secondary-rule-marker" />
  </header>;
}

function TabHeader({ title, rule, review, onRule }) {
  return <header className="tab-title-header">
    <h1>{title}</h1>
    <RuleMarker id={rule} review={review} onClick={() => onRule(rule)} />
  </header>;
}

function RuleMarker({ id, review, onClick, className = '' }) {
  if (!review || !id) return null;
  return <button className={`rule-marker ${className}`} data-review-marker={id} onClick={() => onClick?.(id)} title={`定位 ${id}`}>{id.replace('FR-', '')}</button>;
}

function Toast({ toast }) {
  if (!toast) return null;
  return <div className="toast" role="status">{toast}</div>;
}

function lowDataAmount(sku) {
  const dataInGb = Number.parseFloat(sku.data);
  if (!Number.isFinite(dataInGb) || sku.unlimited) return null;
  const remainingInGb = Number((dataInGb * 0.1).toFixed(2));
  return remainingInGb >= 1 ? `${remainingInGb} GB` : `${remainingInGb * 1000} MB`;
}

function remainingDataLabel(esim, sku) {
  if (['EXPIRED', 'RECYCLED'].includes(esim.usageStatus)) return '不可用';
  if (esim.usageStatus === 'FINISHED') return '0 MB';
  if (sku.unlimited) return '不限流量';
  if (esim.usageStatus === 'UNKNOWN') return '暂不可查';
  return esim.remainingData || sku.data;
}

function currentEsimSku(data, esim) {
  const purchaseOrder = data.orders.find((order) => order.id === esim.orderId);
  return getSku(data, esim.currentSkuId || purchaseOrder?.skuId);
}

function linkedEsimForOrder(data, order) {
  return data.esims.find((item) => item.id === order.parentEsimId || item.orderId === order.id);
}

function isDelivered(esim) {
  return ['delivered', 'topup_pending', 'topup_applied'].includes(esim?.fulfillmentStatus);
}

function deliveryLabel(status) {
  return ({
    awaiting_airalo: '交付中',
    delivered: '待安装',
    delivery_failed: '交付异常',
    topup_pending: '加购同步中',
    topup_applied: '已同步',
  })[status] || '待确认';
}

function directInstallEligible(profile) {
  if (profile?.platform !== 'ios') return false;
  const version = Number.parseFloat(profile.osVersion);
  return Number.isFinite(version) && version >= 17.4;
}

function devicePlatformLabel(profile) {
  return profile?.platform === 'android' ? 'Android' : 'iPhone';
}

function deviceSupportCopy(status, source) {
  return ({
    supported: {
      tone: 'supported',
      label: '此设备支持 eSIM',
      detail: source === 'catalog'
        ? '已根据设备型号完成判断。请同时确认设备已解锁，并有可用的 eSIM 容量。'
        : '设备支持 eSIM。请同时确认设备已解锁，并有可用的 eSIM 容量。',
    },
    unsupported: {
      tone: 'unsupported',
      label: '此设备不支持 eSIM',
      detail: source === 'catalog'
        ? '已根据设备型号完成判断。本设备无法完成安装，你仍可为其他兼容设备购买。'
        : '本设备无法完成安装，你仍可为其他兼容设备购买。',
    },
    unknown: {
      tone: 'unknown',
      label: '尚未确认此设备兼容性',
      detail: '先确认设备是否支持 eSIM，再继续购买。',
    },
  })[status] || deviceSupportCopy('unknown');
}

function DeviceCompatibilitySummary({ data, onAction, actionLabel = '确认设备' }) {
  const status = data.profile?.deviceSupport || 'unknown';
  const copy = deviceSupportCopy(status, data.profile?.deviceSupportSource);
  const deviceModel = data.profile?.deviceModel || devicePlatformLabel(data.profile);
  return <section className={`compatibility-summary ${copy.tone}`} aria-label="设备兼容性">
    <div className="compatibility-summary-icon">
      {copy.tone === 'supported' ? <ShieldCheck /> : copy.tone === 'unsupported' ? <AlertTriangle /> : <CircleHelp />}
    </div>
    <div className="compatibility-summary-copy">
      <strong>{copy.label}</strong>
      <small>{deviceModel} · {data.profile?.osVersion || '系统版本未知'}</small>
      <p>{copy.detail}</p>
    </div>
    {onAction && <button onClick={onAction}>{actionLabel}</button>}
  </section>;
}

function recordDestinationSearch(updateData, destinationId) {
  updateData((current) => {
    const history = Array.isArray(current.profile?.searchHistory) ? current.profile.searchHistory : [];
    return {
      ...current,
      profile: {
        ...current.profile,
        searchHistory: [destinationId, ...history.filter((id) => id !== destinationId)].slice(0, 5),
      },
    };
  });
}

function DestinationHistory({ data, onSelect, compact = false }) {
  const history = (data.profile.searchHistory || [])
    .map((id) => getDestination(data, id))
    .filter((destination) => destination?.enabled);
  if (!history.length) return null;
  return <section className={`destination-history${compact ? ' compact' : ''}`} aria-label="最近搜索">
    <div className="destination-history-heading"><Clock3 /><h2>最近搜索</h2></div>
    <div className="destination-history-list">
      {history.map((destination) => <button key={destination.id} onClick={() => onSelect(destination)}>
        <span>{destination.flag}</span><strong>{destination.name}</strong>
      </button>)}
    </div>
  </section>;
}

function DestinationRecommendations({ data, destinations, onSelect, selectedId, heading = '推荐目的地' }) {
  return <section className="destination-recommendations" aria-label={heading}>
    <h2>{heading}</h2>
    <div className="result-list">
      {destinations.map((destination) => {
        const catalog = getCatalog(data, destination.catalogId);
        return <button
          key={destination.id}
          className={`search-result${selectedId === destination.id ? ' selected' : ''}`}
          onClick={() => onSelect(destination)}
        >
          <span>{destination.flag}</span>
          <div><strong>{destination.name}</strong><small>{catalog.coverage}</small></div>
          {selectedId === destination.id ? <Check /> : <ChevronRight />}
        </button>;
      })}
    </div>
  </section>;
}

function BottomTabs({ active, onChange }) {
  const tabs = [
    ['store', '商店', ShoppingBag],
    ['my-esims', '我的 eSIM', Package],
  ];
  return <nav className="bottom-tabs">{tabs.map(([id, label, Icon]) => (
    <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)}>
      <Icon /><span>{label}</span>
    </button>
  ))}</nav>;
}

function AppShell() {
  const [data, setData] = usePersistedData();
  const initial = new URLSearchParams(location.search);
  const [page, setPage] = useState('store');
  const [navHistory, setNavHistory] = useState([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState('japan');
  const [selectedSkuId, setSelectedSkuId] = useState(null);
  const [selectedEsimId, setSelectedEsimId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('popular');
  const [checkoutMode, setCheckoutMode] = useState('purchase');
  const [topUpEsimId, setTopUpEsimId] = useState(null);
  const [purchaseOnOtherDevice, setPurchaseOnOtherDevice] = useState(false);
  const [compatibilityReturnPage, setCompatibilityReturnPage] = useState('plan');
  const [supportTopic, setSupportTopic] = useState('install');
  const [supportArticleId, setSupportArticleId] = useState('install-start');
  const [supportContextEsimId, setSupportContextEsimId] = useState(null);
  const [supportRequestIssue, setSupportRequestIssue] = useState('installation');
  const [supportRequestSubmitted, setSupportRequestSubmitted] = useState(false);
  const [supportRequestId, setSupportRequestId] = useState('');
  const [supportRequestDuplicate, setSupportRequestDuplicate] = useState(false);
  const [supportRequestSimulation, setSupportRequestSimulation] = useState('success');
  const review = initial.get('review') === '1';
  const [toast, setToast] = useState('');
  const [activeRule, setActiveRule] = useState(initial.get('review') === '1' ? 'FR-002' : null);

  function updateData(updater) {
    setData((current) => typeof updater === 'function' ? updater(current) : updater);
  }

  function flash(message) {
    setToast(message);
    window.clearTimeout(flash.timeout);
    flash.timeout = window.setTimeout(() => setToast(''), 2200);
  }

  function go(next, options = {}) {
    const target = PAGE_IDS.has(next) ? next : 'store';
    if (target === page) return;
    if (!options.replace) {
      setNavHistory((stack) => [...stack, page].filter((item) => PAGE_IDS.has(item)).slice(-20));
    }
    setPage(target);
  }
  function back(fallback) {
    setNavHistory((stack) => {
      const next = [...stack];
      let previous = null;
      while (next.length && !previous) {
        const candidate = next.pop();
        if (PAGE_IDS.has(candidate) && candidate !== page) previous = candidate;
      }
      const requestedFallback = typeof fallback === 'string' && PAGE_IDS.has(fallback) ? fallback : null;
      setPage(previous || requestedFallback || PAGE_BACK_FALLBACKS[page] || 'store');
      return next;
    });
  }
  function goRule(ruleId) {
    if (!RULES[ruleId]) return;
    setActiveRule(ruleId);
    const selectPurchaseContext = () => {
      const sku = data.skus.find((item) => item.enabled && item.catalogId === selectedDestination?.catalogId)
        || data.skus.find((item) => item.enabled);
      const destination = sku && data.destinations.find((item) => item.catalogId === sku.catalogId && item.enabled);
      if (!sku || !destination) return null;
      setSelectedDestinationId(destination.id);
      setSelectedSkuId(sku.id);
      setCheckoutMode('purchase');
      setTopUpEsimId(null);
      setPurchaseOnOtherDevice(false);
      return { sku, destination };
    };
    const applyRuleScenario = (scenarioId) => {
      const result = applyDemoScenario(data, scenarioId);
      updateData(result.data);
      setSelectedEsimId(result.esimId);
      setSelectedDestinationId(result.destinationId);
      setSelectedSkuId(result.skuId);
      setCheckoutMode(result.checkoutMode);
      setTopUpEsimId(result.checkoutMode === 'topup' ? result.esimId : null);
      setPurchaseOnOtherDevice(false);
      return result;
    };
    let targetPage = RULES[ruleId].pages[0];

    if (ruleId === 'FR-003' || ruleId === 'FR-005') {
      selectPurchaseContext();
    }
    if (ruleId === 'FR-004') {
      const profile = DEMO_DEVICE_PROFILES.find((item) => item.id === 'fairphone-5');
      const next = structuredClone(data);
      Object.assign(next.profile, {
        platform: profile.platform,
        deviceModel: profile.deviceModel,
        deviceRegion: profile.deviceRegion,
        osVersion: profile.osVersion,
        deviceSupport: 'unknown',
        deviceSupportSource: 'unknown',
      });
      updateData(next);
      setCheckoutMode('purchase');
      setPurchaseOnOtherDevice(false);
    }
    if (ruleId === 'FR-006') {
      applyRuleScenario('awaiting-airalo');
    }
    if (ruleId === 'FR-007' || ruleId === 'FR-008') {
      applyRuleScenario('pending-install');
    }
    if (ruleId === 'FR-009') {
      applyRuleScenario('installed');
    }
    if (ruleId === 'FR-010') {
      applyRuleScenario('active');
    }
    if (ruleId === 'FR-011') {
      const result = applyRuleScenario('finished');
      setSelectedEsimId(result.esimId);
      setTopUpEsimId(result.esimId);
      setCheckoutMode('topup');
      setPurchaseOnOtherDevice(false);
    }
    if (ruleId === 'FR-012') {
      setSupportContextEsimId(null);
      setSupportRequestSubmitted(false);
      setSupportRequestId('');
      setSupportRequestDuplicate(false);
    }
    setNavHistory([]);
    setPage(targetPage);
  }

  function applyScenario(scenarioId) {
    const result = applyDemoScenario(data, scenarioId);
    updateData(result.data);
    setNavHistory([]);
    setPage(result.page);
    setSelectedEsimId(result.esimId);
    setSelectedDestinationId(result.destinationId);
    setSelectedSkuId(result.skuId);
    setCheckoutMode(result.checkoutMode);
    setTopUpEsimId(result.checkoutMode === 'topup' ? result.esimId : null);
    setPurchaseOnOtherDevice(false);
    flash(`已切换到「${DEMO_SCENARIOS.find((item) => item.id === scenarioId)?.label || '演示状态'}」`);
  }

  function applyDeviceProfile(profileId) {
    const profile = DEMO_DEVICE_PROFILES.find((item) => item.id === profileId);
    if (!profile) return;
    const { platform, deviceModel, deviceRegion, osVersion } = profile;
    const deviceSupport = inferDeviceSupport({ platform, deviceModel, deviceRegion, osVersion });
    updateData((current) => ({
      ...current,
      profile: {
        ...current.profile,
        platform,
        deviceModel,
        deviceRegion,
        osVersion,
        deviceSupport,
        deviceSupportSource: deviceSupport === 'unknown' ? 'unknown' : 'catalog',
      },
    }));
    flash(`当前设备已切换为 ${profile.label}`);
  }

  const selectedDestination = getDestination(data, selectedDestinationId);
  const selectedSku = selectedSkuId ? getSku(data, selectedSkuId) : null;
  const selectedEsim = selectedEsimId ? data.esims.find((entry) => entry.id === selectedEsimId) : null;
  const topUpEsim = topUpEsimId ? data.esims.find((entry) => entry.id === topUpEsimId) : null;

  const shared = {
    data, updateData, page, go, back, flash, review, onRule: goRule,
    selectedDestination, setSelectedDestinationId, selectedSku, setSelectedSkuId,
    selectedEsim, setSelectedEsimId, searchTerm, setSearchTerm,
    category, setCategory,
    checkoutMode, setCheckoutMode, topUpEsim, setTopUpEsimId,
    purchaseOnOtherDevice, setPurchaseOnOtherDevice,
    compatibilityReturnPage, setCompatibilityReturnPage,
    supportTopic, setSupportTopic, supportArticleId, setSupportArticleId,
    supportContextEsimId, setSupportContextEsimId,
    supportRequestIssue, setSupportRequestIssue, supportRequestSubmitted, setSupportRequestSubmitted,
    supportRequestId, setSupportRequestId, supportRequestDuplicate, setSupportRequestDuplicate,
    supportRequestSimulation,
  };

  return (
    <main className={`workbench ${review ? 'review-workbench' : ''}`} data-review-mode={review ? 'on' : 'off'}>
      <aside className="workbench-panel demo-console-panel no-print">
        <DemoConsole
          data={data}
          updateData={updateData}
          selectedEsimId={selectedEsimId}
          setSelectedEsimId={setSelectedEsimId}
          setSelectedDestinationId={setSelectedDestinationId}
          setSelectedSkuId={setSelectedSkuId}
          setCheckoutMode={setCheckoutMode}
          setTopUpEsimId={setTopUpEsimId}
          go={go}
          applyScenario={applyScenario}
          applyDeviceProfile={applyDeviceProfile}
          supportRequestSimulation={supportRequestSimulation}
          setSupportRequestSimulation={setSupportRequestSimulation}
          onReset={() => {
            updateData(cloneDefaultData());
            setNavHistory([]);
            setPage('store');
            setSelectedEsimId(null);
            setSelectedDestinationId('japan');
            setSelectedSkuId(null);
            setCheckoutMode('purchase');
            setTopUpEsimId(null);
            flash('已恢复初始演示数据');
          }}
          flash={flash}
        />
      </aside>
      <section className="device-stage"><PhoneCanvas {...shared} /></section>
      {review && <ReviewPanel activeRule={activeRule} onRule={goRule} />}
      {review && <ReviewConnector activeRule={activeRule} />}
      <Toast toast={toast} />
    </main>
  );
}

function DemoConsole({
  data,
  updateData,
  selectedEsimId,
  setSelectedEsimId,
  setSelectedDestinationId,
  setSelectedSkuId,
  setCheckoutMode,
  setTopUpEsimId,
  go,
  applyScenario,
  applyDeviceProfile,
  supportRequestSimulation,
  setSupportRequestSimulation,
  onReset,
  flash,
}) {
  const [expanded, setExpanded] = useState(true);
  const controlledEsim = data.esims.find((item) => item.id === selectedEsimId) || data.esims[0] || null;
  const controlledSku = controlledEsim ? currentEsimSku(data, controlledEsim) : null;
  const currentDeviceProfile = DEMO_DEVICE_PROFILES.find((item) => (
    item.platform === data.profile.platform
      && item.deviceModel === data.profile.deviceModel
      && item.deviceRegion === data.profile.deviceRegion
  ))?.id || 'custom';
  const hasDeliveredEsim = Boolean(controlledEsim && isDelivered(controlledEsim));
  const canUpdateFulfillment = Boolean(controlledEsim && ['awaiting_airalo', 'delivered', 'delivery_failed'].includes(controlledEsim.fulfillmentStatus));
  const canUpdateInstallGuide = Boolean(hasDeliveredEsim && ['pending_install', 'installed'].includes(controlledEsim.status));
  const canUpdateInstallStatus = Boolean(hasDeliveredEsim && ['pending_install', 'installed'].includes(controlledEsim.status));
  const canUpdateInstallFlow = Boolean(hasDeliveredEsim && controlledEsim.status === 'pending_install');
  const canUpdateConnection = Boolean(hasDeliveredEsim && ['installed', 'ready_to_connect'].includes(controlledEsim.status));
  const currentTopUpState = topUpSyncState(data, controlledEsim);
  const canUpdateTopUp = Boolean(
    hasDeliveredEsim
      && controlledSku?.topUpEnabled
      && controlledEsim?.topUpEligible !== false
      && (
        currentTopUpState === 'topup_pending'
        || (!currentTopUpState && ['FINISHED', 'EXPIRED'].includes(controlledEsim?.usageStatus))
      )
  );
  const fulfillmentSelectValue = controlledEsim?.fulfillmentStatus === 'topup_pending'
    ? 'delivered'
    : controlledEsim?.fulfillmentStatus || '';

  function updateEsim(mutator, message) {
    if (!controlledEsim) return;
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((item) => item.id === controlledEsim.id);
      if (!target) return current;
      mutator(next, target, currentEsimSku(next, target));
      return next;
    });
    if (message) flash(message);
  }

  function updateFulfillment(status) {
    updateEsim((next, target, sku) => {
      if (status === 'delivered') {
        Object.assign(target, ensureDemoIdentifiers(target), {
          fulfillmentStatus: 'delivered',
          status: ['active', 'low_data', 'expired'].includes(target.status) ? target.status : 'pending_install',
          usageStatus: target.usageStatus || 'NOT_ACTIVE',
          remainingData: sku.unlimited ? null : (target.remainingData || sku.data),
        });
      }
      if (status === 'awaiting_airalo' || status === 'delivery_failed') {
        Object.assign(target, {
          fulfillmentStatus: status,
          airaloEsimId: null,
          iccid: null,
          providerOrderId: null,
          status: 'pending_install',
          installGuideStatus: 'not_requested',
          connectionGuideStatus: 'not_started',
          usageStatus: 'NOT_ACTIVE',
          startedAt: null,
          expiresAt: null,
        });
      }
    }, '已更新交付状态');
  }

  function updateInstallGuide(status) {
    updateEsim((next, target) => {
      if (!isDelivered(target)) return;
      target.installGuideStatus = status;
    }, '已更新安装引导状态');
  }

  function updateInstallFlow(flow) {
    updateEsim((next, target) => {
      if (!isDelivered(target) || target.status !== 'pending_install') return;
      target.installFlowState = flow;
      target.installGuideStatus = flow === 'idle' ? 'not_requested' : 'opened';
      if (flow === 'installed_confirmed') {
        target.status = 'installed';
        target.installGuideStatus = 'completed';
      }
    }, '已更新系统安装交接状态');
  }

  function updateInstallStatus(status) {
    updateEsim((next, target) => {
      if (!isDelivered(target) || !['pending_install', 'installed'].includes(target.status)) return;
      target.status = status;
      if (status === 'pending_install') {
        target.installFlowState = 'idle';
        target.usageStatus = 'NOT_ACTIVE';
        target.connectionGuideStatus = 'not_started';
        target.startedAt = null;
        target.expiresAt = null;
      }
      if (status === 'installed') {
        target.usageStatus = 'NOT_ACTIVE';
        target.installFlowState = 'complete';
      }
    }, '已更新系统安装状态');
  }

  function updateConnection(status) {
    updateEsim((next, target) => {
      if (!isDelivered(target) || !['installed', 'ready_to_connect'].includes(target.status)) return;
      if (status === 'not_started' && target.status !== 'installed') return;
      target.connectionGuideStatus = status;
      if (status === 'completed' && target.status === 'installed') {
        target.status = 'ready_to_connect';
      }
    }, '已更新连接引导状态');
  }

  function updateUsage(status) {
    updateEsim((next, target, sku) => {
      if (!isDelivered(target)) return;
      setDemoUsage(target, sku, status);
    }, '已更新用量状态');
  }

  function setTopUpState(status) {
    updateEsim((next, target, sku) => {
      if (!isDelivered(target) || !sku.topUpEnabled) return;
      let order = next.orders.find((item) => item.id === target.pendingTopUpOrderId);
      const hasPendingTopUp = target.fulfillmentStatus === 'topup_pending' || Boolean(order);
      const canStartTopUp = target.topUpEligible !== false && ['FINISHED', 'EXPIRED'].includes(target.usageStatus);
      if (status === 'topup_pending' && !hasPendingTopUp && !canStartTopUp) return;
      if (status === 'topup_applied' && !hasPendingTopUp) return;
      if (status === 'topup_pending' && !order) {
        const orderId = `demo-topup-${Date.now()}`;
        order = {
          id: orderId,
          skuId: sku.id,
          airaloPackageId: sku.airaloPackageId,
          kind: 'topup',
          parentEsimId: target.id,
          esimId: target.id,
          airaloEsimId: target.airaloEsimId,
          iccid: target.iccid,
          status: 'paid',
          paymentStatus: 'paid',
          amount: sku.price,
          paymentProvider: 'stripe_demo',
          provider: 'airalo_partner',
          providerOrderId: null,
          requestId: `demo-request-${orderId}`,
          fulfillmentStatus: 'topup_pending',
          createdAt: demoNow(),
        };
        next.orders.unshift(order);
        target.pendingTopUpOrderId = orderId;
      }
      if (status === 'topup_pending') {
        order.fulfillmentStatus = 'topup_pending';
        target.fulfillmentStatus = 'topup_pending';
        setDemoUsage(target, sku, 'FINISHED');
      }
      if (status === 'topup_applied') {
        const alreadyApplied = (target.topUpHistory || []).some((entry) => (
          entry.orderId && next.orders.some((item) => item.id === entry.orderId && item.kind === 'topup' && item.fulfillmentStatus === 'topup_applied')
        ));
        if (alreadyApplied) return;
        if (!order) {
          const orderId = `demo-topup-${Date.now()}`;
          order = {
            id: orderId,
            skuId: sku.id,
            airaloPackageId: sku.airaloPackageId,
            kind: 'topup',
            parentEsimId: target.id,
            esimId: target.id,
            airaloEsimId: target.airaloEsimId,
            iccid: target.iccid,
            status: 'paid',
            paymentStatus: 'paid',
            amount: sku.price,
            paymentProvider: 'stripe_demo',
            provider: 'airalo_partner',
            providerOrderId: `demo-simulated-airalo-topup-${orderId}`,
            requestId: `demo-request-${orderId}`,
            fulfillmentStatus: 'topup_applied',
            createdAt: demoNow(),
          };
          next.orders.unshift(order);
        } else {
          order.fulfillmentStatus = 'topup_applied';
          order.providerOrderId = order.providerOrderId || `demo-simulated-airalo-topup-${order.id}`;
        }
        target.pendingTopUpOrderId = null;
        target.fulfillmentStatus = 'delivered';
        if (!(target.topUpHistory || []).some((entry) => entry.orderId === order.id)) {
          target.topUpHistory = [...(target.topUpHistory || []), { orderId: order.id, skuId: order.skuId, appliedAt: demoNow() }];
        }
        target.currentSkuId = order.skuId;
        setDemoUsage(target, sku, 'ACTIVE');
      }
    }, status === 'topup_pending' ? '已模拟加购同步中' : '已模拟加购同步完成');
  }

  function navigate(page) {
    if (['esim-detail', 'install', 'connect'].includes(page) && !controlledEsim) {
      flash('请先通过场景预设创建一张 eSIM');
      return;
    }
    if (page === 'install' && controlledEsim?.status !== 'pending_install') {
      flash('当前状态不可进入安装，请先切换到“已交付，待安装”场景');
      return;
    }
    if (page === 'connect' && !['installed', 'ready_to_connect'].includes(controlledEsim?.status)) {
      flash('当前状态不可进入连接设置，请先切换到“已安装，待连接”场景');
      return;
    }
    if (controlledEsim) {
      const sku = currentEsimSku(data, controlledEsim);
      const destination = data.destinations.find((item) => item.catalogId === sku?.catalogId);
      setSelectedEsimId(controlledEsim.id);
      setTopUpEsimId(controlledEsim.id);
      setSelectedSkuId(sku?.id || null);
      setSelectedDestinationId(destination?.id || 'japan');
    }
    go(page, { replace: true });
  }

  return <section className="demo-console" data-demo-console aria-label="Demo 控制台">
    <div className="demo-console-heading">
      <div><SlidersHorizontal /><span>Demo 控制台</span></div>
      <button className="console-collapse" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{expanded ? '收起' : '展开'}</button>
    </div>
    {expanded && <div className="demo-console-body">
      <p className="demo-console-note">仅用于 Demo 评审，不代表服务端或 Stripe 的实时状态。</p>
      <label className="console-field">
        <span>场景预设</span>
        <select defaultValue="" onChange={(event) => {
          if (event.target.value) {
            applyScenario(event.target.value);
            event.target.value = '';
          }
        }}>
          <option value="" disabled>选择状态场景</option>
          {DEMO_SCENARIOS.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.label}</option>)}
        </select>
      </label>
      <div className="scenario-presets">
        {DEMO_SCENARIOS.slice(0, 5).map((scenario) => <button key={scenario.id} title={scenario.detail} onClick={() => applyScenario(scenario.id)}>{scenario.label}</button>)}
      </div>
      <label className="console-field">
        <span>当前设备</span>
        <select value={currentDeviceProfile} onChange={(event) => applyDeviceProfile(event.target.value)}>
          {DEMO_DEVICE_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
          {currentDeviceProfile === 'custom' && <option value="custom" disabled>{data.profile.deviceModel} · 自定义</option>}
        </select>
      </label>
      <label className="console-field">
        <span>当前 eSIM</span>
        <select value={controlledEsim?.id || ''} disabled={!data.esims.length} onChange={(event) => setSelectedEsimId(event.target.value)}>
          {!data.esims.length && <option value="">暂无 eSIM</option>}
          {data.esims.map((esim) => {
            const sku = currentEsimSku(data, esim);
            const destination = data.destinations.find((item) => item.catalogId === sku?.catalogId);
            return <option key={esim.id} value={esim.id}>{destination?.name || '旅行'} · {sku ? skuLabel(sku) : esim.id}</option>;
          })}
        </select>
      </label>
      <div className="console-state-grid">
        <label className="console-field">
          <span>支持请求</span>
          <select value={supportRequestSimulation} onChange={(event) => setSupportRequestSimulation(event.target.value)}>
            <option value="success">正常提交</option>
            <option value="failed">模拟提交失败</option>
          </select>
        </label>
        <label className="console-field">
          <span>交付状态</span>
          <select value={fulfillmentSelectValue} disabled={!canUpdateFulfillment} onChange={(event) => updateFulfillment(event.target.value)}>
            {!controlledEsim && <option value="" disabled>暂无 eSIM</option>}
            <option value="awaiting_airalo">交付中</option>
            <option value="delivered">已交付</option>
            <option value="delivery_failed">交付异常</option>
          </select>
        </label>
        <label className="console-field">
          <span>安装引导</span>
          <select value={controlledEsim?.installGuideStatus || ''} disabled={!canUpdateInstallGuide} onChange={(event) => updateInstallGuide(event.target.value)}>
            {!controlledEsim && <option value="" disabled>暂无 eSIM</option>}
            <option value="not_requested">未请求</option>
            <option value="opened">已打开</option>
            <option value="completed">已完成系统操作</option>
          </select>
        </label>
        <label className="console-field">
          <span>系统安装</span>
          <select value={controlledEsim && ['pending_install', 'installed'].includes(controlledEsim.status) ? controlledEsim.status : ''} disabled={!canUpdateInstallStatus} onChange={(event) => updateInstallStatus(event.target.value)}>
            <option value="" disabled>{controlledEsim ? '已进入连接/使用阶段' : '暂无 eSIM'}</option>
            <option value="pending_install">待安装</option>
            <option value="installed">已确认安装</option>
          </select>
        </label>
        <label className="console-field">
          <span>系统安装交接</span>
          <select value={controlledEsim?.installFlowState || ''} disabled={!canUpdateInstallFlow} onChange={(event) => updateInstallFlow(event.target.value)}>
            {!controlledEsim && <option value="" disabled>暂无 eSIM</option>}
            {INSTALL_FLOW_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="console-field">
          <span>连接引导</span>
          <select value={controlledEsim?.connectionGuideStatus || ''} disabled={!canUpdateConnection} onChange={(event) => updateConnection(event.target.value)}>
            {!controlledEsim && <option value="" disabled>暂无 eSIM</option>}
            {controlledEsim?.status !== 'ready_to_connect' && <option value="not_started">未开始</option>}
            <option value="completed">已完成</option>
          </select>
        </label>
        <label className="console-field">
          <span>用量状态</span>
          <select value={controlledEsim?.usageStatus || ''} disabled={!hasDeliveredEsim} onChange={(event) => updateUsage(event.target.value)}>
            {!controlledEsim && <option value="" disabled>暂无 eSIM</option>}
            <option value="NOT_ACTIVE">未激活</option>
            <option value="ACTIVE">可使用</option>
            <option value="FINISHED">流量已用尽</option>
            <option value="EXPIRED">已过期</option>
            <option value="RECYCLED">已回收</option>
            <option value="UNKNOWN">待确认</option>
          </select>
        </label>
        <label className="console-field">
          <span>加购同步</span>
          <select value={currentTopUpState} disabled={!canUpdateTopUp} onChange={(event) => {
            if (event.target.value) setTopUpState(event.target.value);
          }}>
            {!controlledEsim && <option value="" disabled>暂无 eSIM</option>}
            <option value="">未同步</option>
            <option value="topup_pending">同步中</option>
            <option value="topup_applied">已同步</option>
          </select>
        </label>
      </div>
      <div className="console-navigation" aria-label="快速跳转">
        <button onClick={() => navigate('store')}>商店</button>
        <button onClick={() => navigate('my-esims')}>我的 eSIM</button>
        <button onClick={() => navigate('esim-detail')} disabled={!controlledEsim}>详情</button>
        <button onClick={() => navigate('install')} disabled={controlledEsim?.status !== 'pending_install'}>安装</button>
        <button onClick={() => navigate('connect')} disabled={!['installed', 'ready_to_connect'].includes(controlledEsim?.status)}>连接</button>
        <button onClick={() => navigate('support')}>帮助</button>
      </div>
      <button className="console-reset" onClick={onReset}>重置全部演示数据</button>
    </div>}
  </section>;
}

function ReviewPanel({ activeRule, onRule }) {
  const entries = Object.entries(RULES);
  return <aside className="review-panel" data-review-panel aria-label="PRD 需求追溯">
    <div className="review-panel-heading">
      <span>林凡 Review</span>
      <b>需求追溯</b>
    </div>
    <p className="review-panel-help">点击规则定位到对应 Demo 界面，页面中的编号可反向定位当前规则。</p>
    <nav>
      {entries.map(([id, item]) => <button key={id} data-review-rule={id} className={activeRule === id ? 'focus' : ''} onClick={() => onRule(id)}>
        <b>{id}</b>
        <span>{item.title}</span>
      </button>)}
    </nav>
  </aside>;
}

function ReviewConnector({ activeRule }) {
  const [line, setLine] = useState(null);
  useLayoutEffect(() => {
    let frame = 0;
    function measure() {
      if (!activeRule) return setLine(null);
      const workbench = document.querySelector('.workbench');
      const rule = document.querySelector(`[data-review-rule="${activeRule}"]`);
      const marker = document.querySelector(`[data-review-marker="${activeRule}"]`);
      if (!workbench || !rule || !marker) return setLine(null);
      const base = workbench.getBoundingClientRect();
      const from = rule.getBoundingClientRect();
      const to = marker.getBoundingClientRect();
      setLine({
        x1: from.left - base.left,
        y1: from.top - base.top + from.height / 2,
        x2: to.right - base.left,
        y2: to.top - base.top + to.height / 2,
      });
    }
    function revealMarker() {
      const marker = document.querySelector(`[data-review-marker="${activeRule}"]`);
      const phoneContent = document.querySelector('.phone-content');
      if (!marker || !phoneContent) return;
      const markerBox = marker.getBoundingClientRect();
      const contentBox = phoneContent.getBoundingClientRect();
      const safeTop = contentBox.top + 42;
      const safeBottom = contentBox.bottom - 42;
      if (markerBox.top < safeTop || markerBox.bottom > safeBottom) {
        phoneContent.scrollTop += markerBox.top - contentBox.top - (phoneContent.clientHeight / 2) + (markerBox.height / 2);
      }
    }
    revealMarker();
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const phoneContent = document.querySelector('.phone-content');
    phoneContent?.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    const workbench = document.querySelector('.workbench');
    const rule = document.querySelector(`[data-review-rule="${activeRule}"]`);
    const marker = document.querySelector(`[data-review-marker="${activeRule}"]`);
    [workbench, rule, marker, phoneContent].filter(Boolean).forEach((element) => observer.observe(element));
    const timer = window.setTimeout(() => {
      revealMarker();
      measure();
    }, 100);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      phoneContent?.removeEventListener('scroll', measure);
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [activeRule]);
  if (!line) return null;
  const midX = line.x2 + Math.max(42, (line.x1 - line.x2) * 0.42);
  return <svg className="review-connector" data-review-connector aria-hidden="true">
    <path d={`M ${line.x1} ${line.y1} L ${midX} ${line.y1} L ${midX} ${line.y2} L ${line.x2} ${line.y2}`} />
    <circle cx={line.x2} cy={line.y2} r="4" />
  </svg>;
}

function resolveRenderablePage(page, { data, selectedDestination, selectedSku, selectedEsim }) {
  if (!PAGE_IDS.has(page)) return 'store';

  const hasDestination = Boolean(selectedDestination && getCatalog(data, selectedDestination.catalogId));
  const hasMatchingPackage = Boolean(
    hasDestination
      && selectedSku
      && selectedSku.enabled
      && selectedSku.catalogId === selectedDestination.catalogId
  );
  const hasSelectedEsim = Boolean(selectedEsim && currentEsimSku(data, selectedEsim));

  if (page === 'destination') return hasDestination ? page : 'store';
  if (page === 'plan') return hasMatchingPackage ? page : hasDestination ? 'destination' : 'store';
  if (page === 'device-check') return hasDestination ? page : 'store';
  if (page === 'compatibility-checkout') return hasDestination ? page : 'store';
  if (page === 'checkout') return hasMatchingPackage ? page : hasDestination ? 'destination' : 'store';
  if (page === 'stripe-checkout') return hasMatchingPackage ? page : hasDestination ? 'checkout' : 'store';
  if (['esim-detail', 'install', 'install-progress', 'connect'].includes(page)) return hasSelectedEsim ? page : 'my-esims';
  return page;
}

function PhoneCanvas(props) {
  const { page, go, back, review, onRule } = props;
  const renderPage = resolveRenderablePage(page, props);
  const tabRoot = ['store', 'my-esims'].includes(renderPage);
  useEffect(() => {
    if (renderPage !== page) go(renderPage, { replace: true });
  }, [go, page, renderPage]);

  return <div className="phone-frame">
    <div className="phone-screen">
      <div className="statusbar"><span>9:41</span><span><Signal size={15}/><Wifi size={15}/><span className="battery">83</span></span></div>
      <div className={`phone-content ${tabRoot ? 'tab-root' : ''}`}>
        {renderPage === 'store' && <StorePage {...props} />}
        {renderPage === 'search' && <SearchPage {...props} />}
        {renderPage === 'destination' && <DestinationPage {...props} />}
        {renderPage === 'plan' && <PlanPage {...props} />}
        {renderPage === 'device-check' && <DeviceCompatibilityPage {...props} />}
        {renderPage === 'compatibility-checkout' && <CompatibilityCheckoutPage {...props} />}
        {renderPage === 'checkout' && <CheckoutPage {...props} />}
        {renderPage === 'stripe-checkout' && <StripeCheckoutPage {...props} />}
        {renderPage === 'success' && <SuccessPage {...props} />}
        {renderPage === 'my-esims' && <MyEsimsPage {...props} />}
        {renderPage === 'esim-detail' && <EsimDetailPage {...props} />}
        {renderPage === 'install' && <InstallPage {...props} />}
        {renderPage === 'install-progress' && <InstallProgressPage {...props} />}
        {renderPage === 'connect' && <ConnectPage {...props} />}
        {renderPage === 'onboarding' && <OnboardingPage {...props} />}
        {renderPage === 'support' && <SupportPage {...props} />}
        {renderPage === 'support-topic' && <SupportTopicPage {...props} />}
        {renderPage === 'support-article' && <SupportArticlePage {...props} />}
        {renderPage === 'support-request' && <SupportRequestPage {...props} />}
      </div>
      {tabRoot && <BottomTabs active={renderPage} onChange={(next) => go(next, { replace: true })} />}
    </div>
  </div>;
}

function TopHome({ review, onRule, onGuide }) {
  return <div className="home-top">
    <div><p>你好，Yiyi!</p><small>为下一段旅程保持连接</small></div>
    <IconButton label="eSIM 使用指南" onClick={onGuide} className="home-guide-button"><Info /></IconButton>
    <RuleMarker id="FR-002" review={review} onClick={() => onRule('FR-002')} />
  </div>;
}

function StorePage(props) {
  const { data, go, category, setCategory, setSelectedDestinationId, setCheckoutMode, setTopUpEsimId, setPurchaseOnOtherDevice, review, onRule } = props;
  const [activeCard, setActiveCard] = useState(0);
  const [failedCardImages, setFailedCardImages] = useState({});
  const catalogTypes = {
    popular: { label: '热门', description: '探索最受欢迎的 eSIM，价格从下列套餐起。', ids: ['usa', 'japan', 'france', 'singapore'] },
    local: { label: '本地', description: '单个目的地的本地连接套餐。', ids: data.destinations.filter((d) => d.type === 'local').map((d) => d.id) },
    regional: { label: '区域', description: '一次购买，覆盖多个国家和地区。', ids: data.destinations.filter((d) => d.type === 'regional').map((d) => d.id) },
    global: { label: '全球', description: '跨越多个地区的全球连接套餐。', ids: data.destinations.filter((d) => d.type === 'global').map((d) => d.id) },
  };
  const current = catalogTypes[category];
  const entries = current.ids.map((id) => getDestination(data, id)).filter(Boolean).filter((d) => d.enabled);
  const cards = (data.settings.homeCards || []).filter((card) => card.enabled);
  const carouselCardBasis = cards.length > 1 ? `calc(${100 / cards.length}% - 18px)` : '100%';
  const carouselTransform = activeCard === 0
    ? 'translateX(0)'
    : `translateX(calc(-${activeCard * (100 / cards.length)}% + ${activeCard * 18}px))`;
  useEffect(() => {
    if (cards.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveCard((current) => (current + 1) % cards.length), 5000);
    return () => window.clearInterval(timer);
  }, [cards.length]);

  return <div className="store-page">
    <TopHome {...props} onGuide={() => go('onboarding')} />
    <button className="search-hero" onClick={() => go('search')}><Search /><span>您需要哪里的 eSIM？</span></button>
    {cards.length > 0 && <section className="home-carousel" aria-label="eSIM 出行说明" aria-roledescription="carousel">
      <div className="carousel-track" style={{ width: `${cards.length * 100}%`, transform: carouselTransform }}>
        {cards.map((card) => <div className={`benefit-card theme-${card.theme}`} key={card.id} style={{ flexBasis: carouselCardBasis }}>
          <article className="benefit-card-main">
            {failedCardImages[card.id]
              ? <span className="benefit-graphic" aria-hidden="true"><Globe2 /></span>
              : <img className="benefit-illustration" src="/hello-esim-travelers.png" alt="" onError={() => setFailedCardImages((current) => ({ ...current, [card.id]: true }))} />}
            <div className="benefit-copy"><span className="eyebrow">HelloTalk eSIM</span><h2>{card.title}</h2><p>{card.copy}</p></div>
          </article>
        </div>)}
      </div>
      <div className="pager-dots">{cards.map((card, index) => <button key={card.id} aria-label={`切换至：${card.title}`} aria-current={activeCard === index ? 'true' : undefined} className={activeCard === index ? 'active' : ''} onClick={() => setActiveCard(index)}><i /></button>)}</div>
    </section>}
    <div className="catalog-tabs">{Object.entries(catalogTypes).map(([id, item]) => <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)}>{item.label}</button>)}</div>
    <p className="catalog-description">{current.description}</p>
    <div className="destination-list">
      {entries.map((destination) => {
        const minPrice = minCatalogPrice(data, destination.catalogId);
        return <button key={destination.id} className="destination-row" onClick={() => { setCheckoutMode('purchase'); setTopUpEsimId(null); setPurchaseOnOtherDevice(false); setSelectedDestinationId(destination.id); go('destination'); }}>
          <span className="destination-flag">{destination.flag}</span><strong>{destination.name}</strong><span className="price-from">{minPrice === null ? '暂不可售' : `${money(minPrice)} 起`}</span><ChevronRight />
        </button>;
      })}
    </div>
    <button className="support-fab" aria-label="帮助与支持" title="帮助与支持" onClick={() => { props.setSupportContextEsimId(null); props.go('support'); }}><MessageCircle /></button>
  </div>;
}

function SearchPage({ data, updateData, go, back, searchTerm, setSearchTerm, setSelectedDestinationId, setCheckoutMode, setTopUpEsimId, setPurchaseOnOtherDevice, review, onRule }) {
  const normalized = searchTerm.trim().toLowerCase();
  const results = data.destinations.filter((destination) => destination.enabled && (!normalized || destination.name.toLowerCase().includes(normalized)));
  const hasSearchHistory = data.profile.searchHistory?.length > 0;
  function selectDestination(destination) {
    recordDestinationSearch(updateData, destination.id);
    setCheckoutMode('purchase');
    setTopUpEsimId(null);
    setPurchaseOnOtherDevice(false);
    setSelectedDestinationId(destination.id);
    go('destination');
  }
  return <div className="detail-page">
    <PageHeader title="选择目的地" back={back} rule="FR-002" review={review} onRule={onRule} />
    <div className="search-input"><Search /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索国家或地区" /><button onClick={() => setSearchTerm('')}><X /></button></div>
    <p className="form-help">输入国家、地区或全球套餐。</p>
    {!normalized && hasSearchHistory && <DestinationHistory data={data} onSelect={selectDestination} />}
    {results.length > 0
      ? <DestinationRecommendations data={data} destinations={results} onSelect={selectDestination} heading={normalized ? '搜索结果' : '推荐目的地'} />
      : <p className="search-empty">暂未找到该目的地。</p>}
  </div>;
}

function DestinationPage({ data, selectedDestination, checkoutMode, go, back, setSelectedSkuId, flash, review, onRule }) {
  const catalog = getCatalog(data, selectedDestination.catalogId);
  const skus = data.skus.filter((sku) => sku.catalogId === catalog.id && sku.enabled);
  return <div className="detail-page">
    <PageHeader title={checkoutMode === 'topup' ? `加购 ${selectedDestination.name}` : selectedDestination.name} back={back} rule={checkoutMode === 'topup' ? 'FR-011' : 'FR-002'} review={review} onRule={onRule} right={<IconButton label="套餐说明" onClick={() => flash('套餐详情包含覆盖范围、有效期、网络和加购条件。')}><MoreHorizontal /></IconButton>} />
    <section className="destination-hero"><span>{selectedDestination.flag}</span><div><p>{catalog.coverage}</p><small>{catalog.network} · {catalog.operator}</small></div></section>
    <div className="section-heading"><div><h2>{checkoutMode === 'topup' ? '选择加购套餐' : '选择套餐'}</h2><p>{checkoutMode === 'topup' ? '仅显示当前 eSIM 所在目录的可售套餐。' : `每个套餐仅适用于 ${selectedDestination.name}`}</p></div><Globe2 /></div>
    <div className="plan-list">{skus.map((sku) => <button key={sku.id} className="plan-card" onClick={() => { setSelectedSkuId(sku.id); go('plan'); }}>
      <div><span className={sku.unlimited ? 'unlimited-tag' : 'data-tag'}>{sku.unlimited ? '不限流量' : sku.data}</span><h3>{skuLabel(sku)}</h3><p>{planStartCopy(sku)}</p></div>
      <div className="plan-price"><strong>{money(sku.price)}</strong><ChevronRight /></div>
    </button>)}</div>
    <section className="quiet-note"><Info /><p>{checkoutMode === 'topup' ? '加购成功后会回到当前 eSIM；不支持加购的套餐不会显示此入口。' : '购买后可在“我的 eSIM”中完成安装和连接。'}</p></section>
  </div>;
}

function PlanPage({ data, selectedDestination, selectedSku, checkoutMode, setCompatibilityReturnPage, go, back, review, onRule }) {
  const catalog = getCatalog(data, selectedSku.catalogId);
  function continueCheckout() {
    if (checkoutMode === 'purchase' && data.profile.deviceSupport === 'unknown') {
      setCompatibilityReturnPage('plan');
      go('device-check');
      return;
    }
    if (checkoutMode === 'purchase' && data.profile.deviceSupport === 'unsupported') {
      go('compatibility-checkout');
      return;
    }
    go('checkout');
  }
  return <div className="detail-page plan-detail">
    <PageHeader title="套餐详情" back={back} rule={checkoutMode === 'topup' ? 'FR-011' : 'FR-003'} review={review} onRule={onRule} />
    <section className="plan-detail-card"><span className="large-flag">{selectedDestination.flag}</span><div><h2>{selectedDestination.name} eSIM</h2><p>{catalog.network}</p></div></section>
    <section className="package-grid">
      <div><span>流量</span><strong>{selectedSku.data}</strong></div>
      <div><span>有效期</span><strong>{selectedSku.validityDays} 天</strong></div>
      <div><span>网络</span><strong>{catalog.network}</strong></div>
      <div><span>加购</span><strong>{selectedSku.topUpEnabled ? '支持' : '不支持'}</strong></div>
    </section>
    {checkoutMode === 'purchase' && <DeviceCompatibilitySummary
      data={data}
      onAction={data.profile.deviceSupport === 'unknown' ? () => {
        setCompatibilityReturnPage('plan');
        go('device-check');
      } : null}
    />}
    <section className="detail-section"><h3>有效期</h3><p>{planStartCopy(selectedSku)}。{selectedSku.activationPolicy === 'on_network_connect' ? '请在到达目的地后连接支持网络再开始使用。' : '安装完成后请尽快开始行程。'}</p></section>
    <section className="detail-section"><h3>覆盖范围</h3><p>{catalog.coverage}</p></section>
    <section className="detail-section"><h3>{checkoutMode === 'topup' ? '加购说明' : '安装方式'}</h3><p>{checkoutMode === 'topup' ? '这笔加购仅关联到当前 eSIM；付款确认后会同步加购结果。' : '购买完成后仅展示适用于当前设备的安装方式。'}</p></section>
    <footer className="sticky-cta"><div><small>{checkoutMode === 'topup' ? '加购价格' : '总价'}</small><strong>{money(selectedSku.price)}</strong></div><button onClick={continueCheckout}>{checkoutMode === 'topup' ? '继续加购' : '继续'}</button></footer>
  </div>;
}

function DeviceCompatibilityPage({ data, updateData, compatibilityReturnPage, setPurchaseOnOtherDevice, go, back, selectedDestination, review, onRule }) {
  const [compatibility, setCompatibility] = useState(data.profile.deviceSupport || 'unknown');
  function selectCompatibility(value) {
    setCompatibility(value);
    setPurchaseOnOtherDevice(false);
    updateData((current) => ({
      ...current,
      profile: {
        ...current.profile,
        deviceSupport: value,
        deviceSupportSource: 'user',
        onboardingCompleted: true,
      },
    }));
    go(compatibilityReturnPage || 'plan', { replace: true });
  }
  return <div className="onboarding-page">
    <PageHeader title="确认设备" back={back} rule="FR-004" review={review} onRule={onRule} />
    <section className="onboarding-card">
      <span className="onboarding-step-label">购买前确认</span>
      <h1>确认您的设备</h1>
      <p>暂未在兼容目录中识别 {data.profile?.deviceModel || '此设备'}。请选择当前设备的情况。</p>
      {selectedDestination && <div className="compatibility-destination"><span>{selectedDestination.flag}</span><strong>{selectedDestination.name} eSIM</strong></div>}
      <div className="compatibility-choice"><Smartphone /><div><strong>此设备是否支持 eSIM？</strong><small>兼容设备也需要确认运营商解锁和可用容量。</small></div></div>
      <div className="compatibility-options">
        {[['unknown', '不确定'], ['supported', '支持'], ['unsupported', '不支持']].map(([value, label]) => (
          <button key={value} className={compatibility === value ? 'selected' : ''} onClick={() => selectCompatibility(value)}>{label}</button>
        ))}
      </div>
    </section>
  </div>;
}

function CompatibilityCheckoutPage({ go, back, setPurchaseOnOtherDevice, selectedDestination, review, onRule }) {
  return <div className="detail-page compatibility-checkout-page">
    <PageHeader title="确认设备" back={back} rule="FR-004" review={review} onRule={onRule} />
    <section className="install-hero"><AlertTriangle /><h2>当前设备不支持 eSIM</h2><p>你可以继续为其他兼容设备购买。付款后，请在那台设备的“我的 eSIM”中完成安装。</p></section>
    <section className="quiet-note"><Info /><p>{selectedDestination.name} 的套餐仍可查看；本设备不能进行系统安装。</p></section>
    <button className="outline-action" onClick={() => back('plan')}>返回套餐</button>
    <button className="primary-action full" onClick={() => { setPurchaseOnOtherDevice(true); go('checkout'); }}>为兼容设备继续购买</button>
  </div>;
}

function CheckoutPage({ data, selectedDestination, selectedSku, checkoutMode, topUpEsim, purchaseOnOtherDevice, setCompatibilityReturnPage, go, back, review, onRule }) {
  if (!selectedDestination || !selectedSku) {
    return <div className="detail-page checkout-page">
      <PageHeader title="确认订单" back={back} rule="FR-005" review={review} onRule={onRule} />
      <section className="install-hero"><Info /><h2>请先选择套餐</h2><p>从目的地页面选择可售套餐后，才能进入 Stripe Checkout。</p></section>
      <button className="primary-action full" onClick={() => go('destination', { replace: true })}>选择套餐</button>
    </div>;
  }
  const topUpSku = topUpEsim && currentEsimSku(data, topUpEsim);
  const isTopUp = checkoutMode === 'topup' && topUpSku?.catalogId === selectedSku.catalogId;
  const purchaseNeedsCompatibility = !isTopUp && !purchaseOnOtherDevice && data.profile.deviceSupport !== 'supported';
  function continueToPayment() {
    if (purchaseOnOtherDevice) {
      go('stripe-checkout');
      return;
    }
    if (data.profile.deviceSupport === 'unknown') {
      setCompatibilityReturnPage('checkout');
      go('device-check');
      return;
    }
    if (data.profile.deviceSupport === 'unsupported') {
      go('compatibility-checkout');
      return;
    }
    go('stripe-checkout');
  }
  return <div className="detail-page checkout-page">
    <PageHeader title={isTopUp ? '确认加购' : '确认订单'} back={back} rule={isTopUp ? 'FR-011' : 'FR-005'} review={review} onRule={onRule} />
    <section className="order-card"><div><span>{selectedDestination.flag}</span><div><h2>{selectedDestination.name} eSIM</h2><p>{isTopUp ? `加购 · ${skuLabel(selectedSku)}` : skuLabel(selectedSku)}</p></div></div><strong>{money(selectedSku.price)}</strong></section>
    {!isTopUp && <DeviceCompatibilitySummary
      data={data}
      onAction={data.profile.deviceSupport === 'unknown' ? () => {
        setCompatibilityReturnPage('checkout');
        go('device-check');
      } : null}
    />}
    <section className="checkout-section"><div className="line-title"><ShieldCheck /><span>安全结算</span></div><p>付款将跳转至 Stripe Hosted Checkout。HelloTalk 不保存银行卡或支付账户信息，可用支付方式以 Stripe 页面展示为准。</p></section>
    <section className="price-summary"><div><span>套餐</span><strong>{money(selectedSku.price)}</strong></div><div className="total"><span>应付</span><strong>{money(selectedSku.price)}</strong></div></section>
    <footer className="sticky-cta"><div><small>应付</small><strong>{money(selectedSku.price)}</strong></div><button onClick={isTopUp ? () => go('stripe-checkout') : continueToPayment}>{isTopUp ? '前往 Stripe 加购' : purchaseNeedsCompatibility ? '确认设备后付款' : '前往 Stripe 付款'}</button></footer>
  </div>;
}

function StripeCheckoutPage({ data, updateData, selectedSku, selectedDestination, checkoutMode, topUpEsim, setSelectedEsimId, go, back, flash, review, onRule }) {
  const topUpSku = topUpEsim && currentEsimSku(data, topUpEsim);
  const isTopUp = checkoutMode === 'topup' && topUpEsim && topUpSku?.catalogId === selectedSku.catalogId;
  const [paymentMethod, setPaymentMethod] = useState('card');
  function complete(status) {
    if (status !== 'paid') {
      flash(status === 'cancelled' ? '已取消 Stripe 付款，未创建订单' : 'Stripe 付款未完成，未创建订单');
      go('checkout', { replace: true });
      return;
    }
    const now = new Date().toISOString();
    const orderId = `ord-${Date.now()}`;
    const esimId = `esim-${Date.now()}`;
    const requestId = `demo-request-${orderId}`;
    updateData((current) => {
      const next = structuredClone(current);
      next.orders.unshift({
        id: orderId,
        skuId: selectedSku.id,
        airaloPackageId: selectedSku.airaloPackageId,
        kind: isTopUp ? 'topup' : 'purchase',
        parentEsimId: isTopUp ? topUpEsim.id : null,
        esimId: isTopUp ? topUpEsim.id : esimId,
        airaloEsimId: isTopUp ? topUpEsim.airaloEsimId : null,
        iccid: isTopUp ? topUpEsim.iccid : null,
        status: 'paid',
        paymentStatus: 'paid',
        amount: selectedSku.price,
        paymentProvider: 'stripe_demo',
        provider: 'airalo_partner',
        providerOrderId: null,
        requestId,
        fulfillmentStatus: isTopUp ? 'topup_pending' : 'awaiting_airalo',
        createdAt: now,
      });
      if (isTopUp) {
        const target = next.esims.find((item) => item.id === topUpEsim.id);
        if (target) {
          target.pendingTopUpOrderId = orderId;
          target.fulfillmentStatus = 'topup_pending';
        }
      } else {
        next.esims.unshift({
          id: esimId,
          orderId,
          currentSkuId: selectedSku.id,
          airaloEsimId: null,
          iccid: null,
          provider: 'airalo_partner',
          providerOrderId: null,
          requestId,
          status: 'pending_install',
          fulfillmentStatus: 'awaiting_airalo',
          installGuideStatus: 'not_requested',
          installFlowState: 'idle',
          connectionGuideStatus: 'not_started',
          usageStatus: 'NOT_ACTIVE',
          installMethod: null,
          installationMethods: ['direct', 'qr', 'manual'],
          networkSetup: { isRoaming: true, apnType: 'manual', apnValue: 'wbdata' },
          remainingData: selectedSku.unlimited ? null : selectedSku.data,
          startedAt: null,
          expiresAt: null,
          topUpHistory: [],
        });
      }
      return next;
    });
    setSelectedEsimId(isTopUp ? topUpEsim.id : esimId);
    go('success');
  }
  return <div className="detail-page stripe-checkout-page">
    <PageHeader title="Stripe Checkout" back={back} rule={isTopUp ? 'FR-011' : 'FR-005'} review={review} onRule={onRule} />
    <section className="stripe-brand"><strong>stripe</strong><span>Hosted Checkout</span></section>
    <section className="payment-amount"><span>{isTopUp ? '加购应付金额' : '应付金额'}</span><strong>{money(selectedSku.price)}</strong><small>{isTopUp ? '为当前 eSIM 加购流量包' : `${selectedDestination.name} eSIM`}</small></section>
    <section className="stripe-order" aria-label="套餐信息">
      <span className="stripe-order-title">套餐信息</span>
      <div><span>适用地区</span><strong>{selectedDestination.name}</strong></div>
      <div><span>流量包</span><strong>{selectedSku.unlimited ? '不限流量' : selectedSku.data}</strong></div>
      <div><span>有效期</span><strong>{selectedSku.validityDays} 天</strong></div>
    </section>
    <section className="stripe-payment-methods" aria-label="支付方式">
      <span>支付方式</span>
      <button className={paymentMethod === 'card' ? 'selected' : ''} onClick={() => setPaymentMethod('card')}><div><strong>银行卡</strong><small>由 Stripe 安全处理</small></div>{paymentMethod === 'card' && <Check />}</button>
      <button className={paymentMethod === 'alipay' ? 'selected' : ''} onClick={() => setPaymentMethod('alipay')}><div><strong>支付宝</strong><small>跳转支付宝完成付款</small></div>{paymentMethod === 'alipay' && <Check />}</button>
    </section>
    <section className="quiet-note"><ShieldCheck /><p>付款完成后，HelloTalk 会确认付款并处理 eSIM 准备或加购同步。支付回跳不等于 eSIM 已可安装。</p></section>
    <div className="payment-actions"><button className="secondary-action" onClick={() => complete('cancelled')}>取消付款</button><button className="primary-action" onClick={() => complete('paid')}>{paymentMethod === 'alipay' ? `前往支付宝支付 ${money(selectedSku.price)}` : `支付 ${money(selectedSku.price)}`}</button></div>
  </div>;
}

function SuccessPage({ data, checkoutMode, topUpEsim, selectedEsim, go, review, onRule }) {
  const latest = checkoutMode === 'topup' ? (selectedEsim || topUpEsim) : data.esims[0];
  const isTopUp = checkoutMode === 'topup' && latest;
  return <div className="success-page">
    <div className="success-symbol"><ShieldCheck /></div><h1>付款已确认</h1><p>{isTopUp ? '加购订单正在同步到当前 eSIM，完成后会更新套餐历史和可用流量。' : '订单正在处理，eSIM 准备完成后将显示安装入口。'}</p>
    <div className="success-ticket"><Package /><div><strong>{isTopUp ? '加购同步中' : '交付中'}</strong><small>{latest ? (isTopUp ? '可在 eSIM 详情中查看加购进度' : '可在“我的 eSIM”中查看订单进度') : ''}</small></div></div>
    <button className="primary-action" onClick={() => go(isTopUp ? 'esim-detail' : 'my-esims', { replace: true })}>{isTopUp ? '查看我的 eSIM' : '查看我的 eSIM'}</button>
    <button className="text-action" onClick={() => go('store', { replace: true })}>继续购物</button>
    <RuleMarker id={isTopUp ? 'FR-011' : 'FR-006'} review={review} onClick={() => onRule(isTopUp ? 'FR-011' : 'FR-006')} />
  </div>;
}

function MyEsimsPage({ data, updateData, go, setSelectedEsimId, review, onRule }) {
  const completedInstall = data.esims.find((esim) => esim.installFlowState === 'installed_confirmed' && esim.status === 'installed');
  function openEsim(esim) {
    setSelectedEsimId(esim.id);
    go('esim-detail');
  }
  function confirmInstall(nextPage) {
    if (!completedInstall) return;
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((item) => item.id === completedInstall.id);
      if (target) target.installFlowState = 'complete';
      return next;
    });
    setSelectedEsimId(completedInstall.id);
    go(nextPage, { replace: true });
  }
  return <div className="my-esims-page">
    <TabHeader title="我的 eSIM" rule="FR-007" review={review} onRule={onRule} />
    {data.esims.length === 0 ? <div className="empty-esim"><img src="/hello-esim-empty-state.png" alt="" /><h2>eSIM 让出行更轻松</h2><p>提前为下一段旅程准备连接，抵达后即可按指引完成安装与使用。</p><button className="primary-action" onClick={() => go('onboarding')}>了解运作方式</button></div> :
      <div className="esim-list">{data.esims.map((esim) => {
        const sku = currentEsimSku(data, esim);
        const destination = sku && data.destinations.find((entry) => entry.catalogId === sku.catalogId);
        const delivered = isDelivered(esim);
        const action = !delivered
          ? null
          : esim.status === 'pending_install'
            ? ['安装 eSIM', 'install']
            : esim.status === 'installed'
              ? ['进行连接', 'connect']
              : ['查看详细信息', 'esim-detail'];
        return <article className={`esim-card ${esim.status}`} key={esim.id}>
          <button className="esim-card-top" onClick={() => openEsim(esim)}>
            <span>{destination?.flag || '🌐'}</span><div><h2>{destination?.name || '旅行'} eSIM</h2><p>{sku ? skuLabel(sku) : ''}</p></div><ChevronRight />
          </button>
          <div className="esim-card-metrics"><div><span>流量</span><strong>{delivered ? remainingDataLabel(esim, sku) : '准备中'}</strong></div><div><span>有效期</span><strong>{esim.startedAt ? `${dateLabel(esim.expiresAt)} 到期` : sku ? `${sku.validityDays} 天` : '--'}</strong></div></div>
          <div className="esim-status"><span>{esim.fulfillmentStatus === 'topup_pending' ? '加购同步中' : delivered ? statusLabel(esim.status, esim.usageStatus) : deliveryLabel(esim.fulfillmentStatus)}</span><strong>{delivered ? (esim.status === 'installed' ? '请按连接指引完成系统设置' : esim.status === 'pending_install' ? '可开始安装' : '') : '正在准备 eSIM'}</strong></div>
          {action && <button className={`esim-card-action ${action[1] === 'install' ? 'primary' : ''}`} onClick={() => { setSelectedEsimId(esim.id); go(action[1]); }}>{action[0]}</button>}
        </article>;
      })}</div>}
    {completedInstall && <div className="install-complete-overlay" role="dialog" aria-modal="true" aria-label="eSIM 已安装">
      <div className="install-complete-modal"><div className="install-complete-symbol"><CheckCircle2 /></div><h2>你的 eSIM 已安装</h2><p>进入覆盖区域后，按说明完成连接设置即可使用。</p><div className="install-complete-tip"><Info />不要从设备中删除这张 eSIM。</div><button className="primary-action" onClick={() => confirmInstall('my-esims')}>好的，知道了</button><button className="outline-action" onClick={() => confirmInstall('connect')}>如何连接</button></div>
    </div>}
  </div>;
}

function statusLabel(status, usageStatus) {
  if (['active', 'low_data', 'expired'].includes(status) && usageStatus) return usageStatusLabel(usageStatus);
  return ({ pending_install: '待安装', installed: '已安装', ready_to_connect: '等待连接' })[status] || status || '状态待确认';
}

function EsimDetailPage({ data, selectedEsim, go, back, flash, setSelectedEsimId, setSelectedDestinationId, setCheckoutMode, setTopUpEsimId, setSupportContextEsimId, setSupportRequestSubmitted, setSupportRequestId, setSupportRequestDuplicate, review, onRule }) {
  if (!selectedEsim) return <MyEsimsPage data={data} go={go} setSelectedEsimId={setSelectedEsimId} review={review} onRule={onRule} />;
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const sku = currentEsimSku(data, selectedEsim);
  const destination = data.destinations.find((item) => item.catalogId === sku.catalogId);
  const catalog = getCatalog(data, sku.catalogId);
  const delivered = isDelivered(selectedEsim);
  const topUpPending = selectedEsim.fulfillmentStatus === 'topup_pending';
  const canTopUp = delivered && !topUpPending && selectedEsim.topUpEligible !== false && sku.topUpEnabled && ['FINISHED', 'EXPIRED'].includes(selectedEsim.usageStatus);
  const installFlow = selectedEsim.installFlowState || 'idle';
  const maskedIccid = selectedEsim.iccid ? `${selectedEsim.iccid.slice(0, 4)}••••••••${selectedEsim.iccid.slice(-4)}` : '交付后显示';
  const installAction = selectedEsim.status === 'pending_install' ? '安装 eSIM' : selectedEsim.status === 'installed' ? '进行连接' : selectedEsim.status === 'ready_to_connect' ? '检查连接' : null;
  function copyIccid() {
    navigator.clipboard?.writeText(maskedIccid).catch(() => {});
    flash('已复制脱敏 ICCID');
  }
  return <div className="detail-page esim-detail">
    <PageHeader title={destination.name} back={back} rule="FR-007" secondaryRule="FR-010" review={review} onRule={onRule} />
    {delivered && selectedEsim.status === 'installed' && <section className="installed-banner"><CheckCircle2 /><p>你的 eSIM 已安装。请勿从设备中删除。</p></section>}
    {installFlow === 'failed' && <section className="install-state-banner error"><AlertTriangle /><div><strong>eSIM 未安装</strong><p>安装出错了，请重新开始；如仍无法安装，请联系支持。</p></div></section>}
    {installFlow === 'interrupted' && <section className="install-state-banner warning"><AlertTriangle /><div><strong>eSIM 未安装</strong><p>安装已中断。别担心，你可以随时重新开始。</p></div></section>}
    <section className={`esim-identity-card ${selectedEsim.status}`}><div className="esim-identity-heading"><span>{destination.flag}</span><h2>{destination.name}</h2><MoreHorizontal /></div><div className="network-line"><Signal /><strong>{catalog?.network || '网络信息待确认'}</strong><span>{catalog?.operator || ''}</span></div><div className="iccid-row"><div><span>ICCID</span><strong>{maskedIccid}</strong></div><button aria-label="复制脱敏 ICCID" onClick={copyIccid}><Copy /></button></div><button className="package-detail-trigger" aria-expanded={showPackageDetails} onClick={() => setShowPackageDetails((value) => !value)}><Package />套餐详细信息<ChevronDown /></button>{showPackageDetails && <div className="package-detail-list"><div><span>适用地区</span><strong>{catalog?.coverage || destination.name}</strong></div><div><span>网络</span><strong>{catalog?.network || '以当地可用网络为准'}</strong></div><div><span>套餐类型</span><strong>{sku.unlimited ? '不限流量' : '总流量'}</strong></div><div><span>生效方式</span><strong>{planStartCopy(sku)}</strong></div></div>}</section>
    <section className="package-overview"><h3>套餐</h3><div className="package-overview-grid"><div><span>流量</span><strong>{delivered ? remainingDataLabel(selectedEsim, sku) : sku.data}</strong></div><div><span>有效期</span><strong>{selectedEsim.startedAt ? `${dateLabel(selectedEsim.expiresAt)} 到期` : `${sku.validityDays} 天`}</strong></div></div></section>
    {!delivered && selectedEsim.fulfillmentStatus === 'awaiting_airalo' && <section className="quiet-note"><Info /><p>支付已确认，正在准备 eSIM。此阶段不会展示安装入口。</p></section>}
    {!delivered && selectedEsim.fulfillmentStatus === 'delivery_failed' && <section className="quiet-note"><AlertTriangle /><p>eSIM 暂未准备完成。请稍后查看状态；如长时间未恢复，可联系支持核验订单。</p></section>}
    {delivered && selectedEsim.status === 'ready_to_connect' && <section className="quiet-note"><RefreshCw /><p>正在等待网络状态更新。请在目的地覆盖范围内稍后查看。</p></section>}
    {topUpPending && <section className="quiet-note"><Info /><p>付款已确认，正在同步加购结果。</p></section>}
    {(selectedEsim.topUpHistory || []).length > 0 && <section className="history-row"><Clock3 /><div><strong>套餐历史记录</strong><small>已完成 {(selectedEsim.topUpHistory || []).length} 次加购</small></div><ChevronRight /></section>}
    <section className="detail-section"><h3>安装与连接</h3><p>安装和连接步骤以当前套餐提供的内容为准。HelloTalk 只引导你在手机系统中操作，并以服务端最近一次同步结果展示状态。</p></section>
    <button className="support-link" onClick={() => { setSupportContextEsimId(selectedEsim.id); setSupportRequestSubmitted(false); setSupportRequestId(''); setSupportRequestDuplicate(false); go('support-request'); }}>联系支持</button>
    {installAction && <footer className="detail-sticky-cta"><button className="primary-action" onClick={() => go(selectedEsim.status === 'pending_install' ? 'install' : 'connect')}>{installAction}</button></footer>}
    {canTopUp && <footer className="detail-sticky-cta"><button className="primary-action" onClick={() => { setSelectedEsimId(selectedEsim.id); setTopUpEsimId(selectedEsim.id); setCheckoutMode('topup'); setSelectedDestinationId(destination.id); go('destination'); }}>加购流量</button></footer>}
  </div>;
}

function InstallPage({ data, selectedEsim, updateData, go, back, flash, review, onRule }) {
  const methods = (selectedEsim.installationMethods || ['qr', 'manual'])
    .filter((method) => method !== 'direct' || directInstallEligible(data.profile));
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [method, setMethod] = useState(methods[0] || 'qr');
  const installFlow = selectedEsim.installFlowState || 'idle';
  const steps = [
    ['direct', '直接安装', Download, '在当前 iPhone 上继续系统安装。'],
    ['qr', '使用二维码', QrCode, '用另一台设备扫描安装二维码。'],
    ['manual', '手动安装', Settings2, '在系统设置中输入本次提供的安装信息。'],
  ].filter(([id]) => methods.includes(id));
  function setInstallFlow(flow, nextPage = null) {
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((item) => item.id === selectedEsim.id);
      if (!target || !isDelivered(target) || target.status !== 'pending_install') return current;
      target.installGuideStatus = 'opened';
      target.installFlowState = flow;
      target.installMethod = method;
      return next;
    });
    if (nextPage) go(nextPage);
  }
  return <div className="detail-page install-page">
    <PageHeader title="安装 eSIM" back={back} rule="FR-008" review={review} onRule={onRule} />
    {installFlow === 'failed' && <section className="install-state-banner error"><AlertTriangle /><div><strong>eSIM 未安装</strong><p>出错了，请重试。如果仍然无法安装，请联系支持。</p></div></section>}
    {installFlow === 'interrupted' && <section className="install-state-banner warning"><AlertTriangle /><div><strong>eSIM 未安装</strong><p>安装已中断。别担心，你可以随时重新开始。</p></div></section>}
    <section className="install-intro"><img src="/hello-esim-travelers.png" alt="" /><h2>你可以直接在此设备上安装 eSIM</h2><p>这个过程通常需要几分钟。请在稳定的网络环境下继续，并在系统提示时确认添加。</p><ul><li><Wifi />保持连接到互联网</li><li><X />请勿退出或中断安装过程</li><li><Smartphone />为新的 eSIM 设置一个易识别的标签</li><li><Signal />选择用于流量的新 eSIM</li></ul></section>
    {showAlternatives && <section className="install-alternatives"><h3>其他安装方式</h3>{steps.map(([id, label, Icon, description]) => <button key={id} className={`install-method ${method === id ? 'selected' : ''}`} onClick={() => setMethod(id)}><Icon /><div><strong>{label}</strong><small>{description}</small></div><span className="radio" /></button>)}{method === 'qr' && <div className="qr-placeholder"><QrCode /><span>安装二维码</span></div>}{method === 'manual' && <div className="manual-code"><span>SM-DP+ 地址</span><strong>仅当前会话展示</strong><span>激活码</span><strong>仅当前会话展示</strong></div>}<p>二维码、直装链接和手动安装信息仅在本次查看期间展示，请勿转发或提交到支持请求。</p></section>}
    <footer className="install-action-footer"><button className="primary-action" disabled={steps.length === 0} onClick={() => setInstallFlow('starting', 'install-progress')}>开始安装</button><button className="outline-action" onClick={() => setShowAlternatives((value) => !value)}>{showAlternatives ? '收起其他方式' : '其他安装方式'}</button></footer>
  </div>;
}

function InstallProgressPage({ selectedEsim, updateData, go }) {
  const flow = selectedEsim.installFlowState || 'starting';
  function updateFlow(nextFlow, options = {}) {
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((item) => item.id === selectedEsim.id);
      if (!target) return current;
      target.installFlowState = nextFlow;
      if (options.installed) {
        target.status = 'installed';
        target.installGuideStatus = 'completed';
      }
      return next;
    });
  }
  useEffect(() => {
    if (flow !== 'starting' && flow !== 'adding') return undefined;
    const timer = window.setTimeout(() => {
      if (flow === 'starting') updateFlow('system_permission');
      if (flow === 'adding') {
        updateFlow('installed_confirmed', { installed: true });
        go('my-esims', { replace: true });
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [flow]);
  const isAdding = flow === 'adding';
  return <div className="install-progress-page">
    <div className="install-progress-logo"><i /><i /><i /></div>
    <h1>{isAdding ? '正在添加到设备...' : '正在开始安装...'}</h1>
    <p>请留在此界面，该流程可能需要几分钟。</p>
    <div className="install-progress-track"><i style={{ width: isAdding ? '60%' : '16%' }} /></div>
    <div className="install-progress-tips"><span><Wifi />保持连接到互联网</span><span><Smartphone />请勿关闭或退出应用</span></div>
    {flow === 'capacity_blocked' && <div className="system-sheet"><h2>需要关闭一张 SIM 才能继续</h2><p>这台设备当前可同时使用的线路已满。关闭一张 SIM 不会取消其服务。</p><button onClick={() => updateFlow('system_permission')}>关闭主卡并继续</button><button onClick={() => { updateFlow('interrupted'); go('install', { replace: true }); }}>取消</button></div>}
    {flow === 'system_permission' && <div className="system-sheet"><h2>允许运营商设置 eSIM 吗？</h2><p>eSIM 下载后将立即用于安装。系统可能会继续请求确认。</p><div><button onClick={() => { updateFlow('interrupted'); go('install', { replace: true }); }}>暂不</button><button className="system-confirm" onClick={() => updateFlow('adding')}>允许</button></div></div>}
  </div>;
}

function ConnectPage({ data, selectedEsim, updateData, go, back, flash, review, onRule }) {
  const setup = selectedEsim.networkSetup || { isRoaming: true, apnType: 'automatic' };
  const steps = [
    ['line', '确保 eSIM 已开启', '转到“蜂窝网络”，选择这张旅行 eSIM 并启用“打开此号码”。'],
    ['data', '选择用于数据的 eSIM', '将蜂窝数据切换到新的 eSIM，并关闭蜂窝数据切换，避免其他线路使用数据流量。'],
    ...(setup.apnType === 'manual' ? [['apn', '添加 APN 详细信息', '复制 APN 后前往系统设置中的“蜂窝数据网络”，添加并确认选中该 APN。']] : []),
    ...(setup.isRoaming ? [['roaming', '开启数据漫游', '转到“连接 > 移动网络”，然后打开数据漫游。']] : []),
  ];
  const [openStep, setOpenStep] = useState(steps[0]?.[0] || null);
  const [checking, setChecking] = useState(false);
  function copyApn() {
    navigator.clipboard?.writeText(setup.apnValue || '').catch(() => {});
    flash('APN 已复制');
  }
  function connect() {
    if (checking) return;
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      flash('正在检查连接状态，请稍后查看结果');
      go('esim-detail', { replace: true });
    }, 650);
  }
  return <div className="detail-page connect-page">
    <PageHeader title="连接 eSIM" back={back} rule="FR-009" review={review} onRule={onRule} />
    <section className="connect-intro"><div><CheckCircle2 /></div><h2>让我们帮您连接网络</h2><p>请按下方说明在系统设置中完成配置，再检查连接状态。</p></section>
    <section className="connect-accordion">{steps.map(([id, label, body], index) => {
      const expanded = openStep === id;
      return <article className={`connect-step-card ${expanded ? 'expanded' : ''}`} key={id}><button onClick={() => setOpenStep(expanded ? null : id)}><strong>{index + 1}. {label}</strong><ChevronDown /></button>{expanded && <div className="connect-step-body"><p>{body}</p>{id === 'line' && <div className="connect-tip"><Info />为新的 eSIM 选择一个标签，使其区别于设备上的其他线路。</div>}{id === 'data' && <div className="connect-tip"><Info />关闭蜂窝数据切换，以确保其他 SIM 不会使用数据流量。</div>}{id === 'apn' && <><div className="apn-card"><div><span>APN</span><strong>{setup.apnValue || '以套餐提供的值为准'}</strong></div><button aria-label="复制 APN" onClick={copyApn}><Copy /></button></div><button className="settings-button" onClick={() => flash('请在系统设置中添加 APN')}>打开 APN 设置</button></>}{id === 'roaming' && <><div className="connect-tip"><Info />请确认这张 eSIM 已选择用于蜂窝数据。</div><button className="settings-button" onClick={() => flash('请在系统设置中开启数据漫游')}>打开设置</button></>}</div>}</article>;
    })}</section>
    <section className="connection-check"><Wifi /><div><h3>检查你的连接</h3><p>检查结果以当前网络和服务状态同步为准，不会将页面操作视为已完成设置。</p></div></section>
    <footer className="sticky-cta"><span /><button disabled={checking} onClick={connect}>{checking ? '正在检查...' : '检查连接'}</button></footer>
  </div>;
}

const SUPPORT_TOPICS = [
  {
    id: 'install',
    title: '安装 eSIM',
    description: '开始安装、二维码和手动安装。',
    issue: 'installation',
    articles: [
      { id: 'install-start', title: '如何开始安装 eSIM', summary: '从“我的 eSIM”打开已交付的套餐并选择安装方式。', steps: ['确认这张 eSIM 显示为待安装或安装指引可用。', '在“我的 eSIM”打开对应套餐，选择可用的安装方式。', '完成系统引导后回到 HelloTalk，继续查看连接设置。'], note: '打开安装指引或点击系统安装，不代表 eSIM 已添加或已经可以联网。', action: 'install' },
      { id: 'install-methods', title: '二维码或手动安装时需要注意什么', summary: '二维码需要在另一块屏幕打开；安装信息不可分享。', steps: ['二维码请在另一块屏幕打开后扫描；同一设备无法直接扫描自身屏幕。', '手动安装仅使用本次会话中显示的配置数据。', '二维码、激活码和手动安装信息不要截图、转发或提交到客服请求中。'], note: '若指引过期、无法打开或系统报错，请提交支持请求重新核验。' },
    ],
  },
  {
    id: 'connect',
    title: '连接与使用',
    description: '抵达后启用数据线路并排查网络问题。',
    issue: 'connection',
    articles: [
      { id: 'connect-arrival', title: '抵达目的地后如何连接', summary: '在系统设置中使用旅行 eSIM 作为蜂窝数据线路。', steps: ['在系统设置中确认旅行 eSIM 已启用。', '将蜂窝数据切换到旅行 eSIM，主卡保留通话和短信。', '按该 eSIM 指引决定是否打开数据漫游，并在覆盖范围内刷新状态。'], note: 'HelloTalk 不会读取或替你修改系统中的线路、APN、漫游或网络选择。', action: 'connect' },
      { id: 'connect-troubleshoot', title: '已完成设置但无法联网', summary: '依次核对安装、数据线路、漫游、APN 和目的地覆盖。', steps: ['确认 eSIM 已在系统中添加，且未超过安装期限。', '确认蜂窝数据正在使用旅行 eSIM，并按套餐要求核对数据漫游。', '只有在该 eSIM 指引要求时才配置 APN 或手动网络选择；随后刷新连接状态。'], note: '飞行模式、未抵达覆盖范围、无网络或状态查询失败时，可能暂时无法验证连接状态。', action: 'connect' },
    ],
  },
  {
    id: 'usage',
    title: '流量、有效期与加购',
    description: '查看用量、有效期和可加购资格。',
    issue: 'usage',
    articles: [
      { id: 'usage-status', title: '为什么暂时没有实时流量', summary: '用量以最近同步结果为准，不承诺秒级更新。', steps: ['在“我的 eSIM”打开对应套餐，查看最近一次同步的流量和有效期。', '刷新时会优先读取服务端缓存，避免重复请求。', '若当前套餐不支持实时用量，会明确显示暂不支持查询。'], note: '没有可验证的用量数据时，不会用本地估算值代替真实用量。', action: 'detail' },
      { id: 'usage-topup', title: '为什么没有“加购流量”入口', summary: '加购只在当前 eSIM 返回可售加购包时展示。', steps: ['加购资格由当前 eSIM 的服务状态和可售加购包决定。', '同一目的地的其他新购套餐不会被当作加购套餐展示。', '套餐过期、已回收或不支持加购时，不会显示加购入口。'], note: '如你认为套餐资格异常，可带着该 eSIM 的上下文提交支持请求。', action: 'topup' },
    ],
  },
  {
    id: 'payment',
    title: '付款、订单与退款',
    description: '支付、交付中、异常订单和退款申请。',
    issue: 'payment',
    articles: [
      { id: 'payment-delivery', title: '付款后暂未看到 eSIM', summary: '支付确认和 eSIM 准备是两段独立流程。', steps: ['支付完成后，等待服务端确认 Stripe 付款结果。', '确认后服务端会处理 eSIM 准备；交付中不会显示可安装入口。', '若长时间未交付或出现异常，请提交支持请求核验订单状态。'], note: '支付回跳页不作为付款成功或 eSIM 已交付的依据。', action: 'detail' },
      { id: 'payment-refund', title: '退款、重复扣款或套餐不符', summary: '退款由 HelloTalk 售后流程处理，不会在客户端直接发起退款。', steps: ['选择付款、订单与退款问题并说明遇到的情况。', '系统会随请求附带必要的内部订单和 eSIM 上下文。', '处理状态会在相关 eSIM 的服务信息中更新。'], note: '请勿在描述中填写银行卡号、二维码、激活码或其他安装敏感信息。', action: 'request' },
    ],
  },
  {
    id: 'compatibility',
    title: '设备兼容',
    description: '确认设备、运营商锁和安装条件。',
    issue: 'compatibility',
    articles: [
      { id: 'compatibility-check', title: '购买前需要确认什么', summary: '设备支持 eSIM、已解锁且有可用 eSIM 容量是不同条件。', steps: ['确认设备型号和系统版本支持 eSIM。', '确认设备没有运营商锁，并保留可添加 eSIM 的容量。', '即使设备兼容，目的地网络可用、安装和激活仍需以实际交付结果为准。'], note: '兼容性检查不会替代支付后的 eSIM 准备或系统安装验证。', action: 'store' },
    ],
  },
];

function resolveSupportEsim(data, supportContextEsimId) {
  return supportContextEsimId ? data.esims.find((item) => item.id === supportContextEsimId) || null : null;
}

function SupportPage({ data, supportContextEsimId, setSupportContextEsimId, setSelectedEsimId, setSupportTopic, setSupportArticleId, setSupportRequestIssue, setSupportRequestSubmitted, setSupportRequestId, setSupportRequestDuplicate, go, back, review, onRule }) {
  const esim = resolveSupportEsim(data, supportContextEsimId);
  const sku = esim && currentEsimSku(data, esim);
  const destination = sku && data.destinations.find((item) => item.catalogId === sku.catalogId);
  const quickAction = esim?.status === 'pending_install'
    ? { label: '继续安装', page: 'install' }
    : ['installed', 'ready_to_connect'].includes(esim?.status)
      ? { label: '查看连接设置', page: 'connect' }
      : esim ? { label: '查看 eSIM 详情', page: 'esim-detail' } : null;
  function openTopic(topic) {
    setSupportTopic(topic.id);
    setSupportArticleId(topic.articles[0].id);
    setSupportRequestIssue(topic.issue);
    go('support-topic');
  }
  function openRequest() {
    setSupportRequestSubmitted(false);
    setSupportRequestId('');
    setSupportRequestDuplicate(false);
    go('support-request');
  }
  return <div className="detail-page support-page">
    <PageHeader title="帮助与支持" back={back} rule="FR-012" review={review} onRule={onRule} />
    <section className="support-intro"><h2>需要帮助吗？</h2><p>先查看与安装、连接、用量、加购和付款相关的指引。</p></section>
    {esim && <section className="support-esim-context">
      <div><span>{destination?.flag || '🌐'}</span><div><strong>{destination?.name || '旅行'} eSIM</strong><small>{sku ? skuLabel(sku) : '当前 eSIM'} · {isDelivered(esim) ? statusLabel(esim.status, esim.usageStatus) : deliveryLabel(esim.fulfillmentStatus)}</small></div></div>
      <button onClick={() => { setSelectedEsimId(esim.id); setSupportContextEsimId(esim.id); go(quickAction.page); }}>{quickAction.label}<ChevronRight /></button>
    </section>}
    <h2 className="help-section-title">常见问题</h2>
    <div className="help-list">{SUPPORT_TOPICS.map((topic) => <button key={topic.id} onClick={() => openTopic(topic)}><CircleHelp /><div><strong>{topic.title}</strong><small>{topic.description}</small></div><ChevronRight /></button>)}</div>
    <section className="support-contact">
      <MessageCircle /><div><strong>仍然无法解决？</strong><small>{esim ? '提交请求时会附带该 eSIM 的必要订单上下文。' : '提交请求后，可补充与你的问题有关的信息。'}</small></div>
      <button className="support-link" onClick={openRequest}>联系支持</button>
    </section>
  </div>;
}

function SupportTopicPage({ supportTopic, setSupportArticleId, go, back, review, onRule }) {
  const topic = SUPPORT_TOPICS.find((item) => item.id === supportTopic) || SUPPORT_TOPICS[0];
  return <div className="detail-page support-topic-page">
    <PageHeader title={topic.title} back={back} rule="FR-012" review={review} onRule={onRule} />
    <section className="support-intro compact"><h2>{topic.title}</h2><p>{topic.description}</p></section>
    <div className="article-list">{topic.articles.map((article) => <button key={article.id} onClick={() => { setSupportArticleId(article.id); go('support-article'); }}><div><strong>{article.title}</strong><small>{article.summary}</small></div><ChevronRight /></button>)}</div>
  </div>;
}

function SupportArticlePage({ data, supportContextEsimId, supportArticleId, setSelectedEsimId, setSelectedDestinationId, setCheckoutMode, setTopUpEsimId, setSupportContextEsimId, setSupportRequestIssue, setSupportRequestSubmitted, setSupportRequestId, setSupportRequestDuplicate, go, back, review, onRule }) {
  const topic = SUPPORT_TOPICS.find((item) => item.articles.some((article) => article.id === supportArticleId)) || SUPPORT_TOPICS[0];
  const article = topic.articles.find((item) => item.id === supportArticleId) || topic.articles[0];
  const esim = resolveSupportEsim(data, supportContextEsimId);
  const sku = esim && currentEsimSku(data, esim);
  const destination = sku && data.destinations.find((item) => item.catalogId === sku.catalogId);
  const canInstall = article.action === 'install' && esim?.status === 'pending_install';
  const canConnect = article.action === 'connect' && ['installed', 'ready_to_connect'].includes(esim?.status);
  const canTopUp = article.action === 'topup' && sku?.topUpEnabled && ['low_data', 'expired'].includes(esim?.status);
  const opensSupportRequest = article.action === 'request' || (article.action === 'detail' && !esim);
  function openRequest() {
    setSupportRequestIssue(topic.issue);
    setSupportRequestSubmitted(false);
    setSupportRequestId('');
    setSupportRequestDuplicate(false);
    go('support-request');
  }
  function openAction() {
    if (opensSupportRequest) {
      openRequest();
      return;
    }
    if (canInstall) {
      setSelectedEsimId(esim.id);
      setSupportContextEsimId(esim.id);
      go('install');
      return;
    }
    if (canConnect) {
      setSelectedEsimId(esim.id);
      setSupportContextEsimId(esim.id);
      go('connect');
      return;
    }
    if (canTopUp) {
      setSelectedEsimId(esim.id);
      setTopUpEsimId(esim.id);
      setCheckoutMode('topup');
      setSelectedDestinationId(destination.id);
      go('destination');
      return;
    }
    if (article.action === 'store') {
      go('store');
      return;
    }
    if (article.action === 'detail' && !esim) {
      openRequest();
      return;
    }
    if (esim) {
      setSelectedEsimId(esim.id);
      setSupportContextEsimId(esim.id);
      go('esim-detail');
      return;
    }
    go('my-esims');
  }
  const actionLabel = opensSupportRequest ? '联系支持'
    : canInstall ? '继续安装'
    : canConnect ? '打开连接设置'
      : canTopUp ? '查看可加购套餐'
        : article.action === 'store' ? '前往商店'
          : article.action === 'detail' && !esim ? '请求订单核验'
          : esim ? '查看我的 eSIM' : '前往我的 eSIM';
  return <div className="detail-page support-article-page">
    <PageHeader title="帮助文章" back={back} rule="FR-012" review={review} onRule={onRule} />
    <article className="article-content">
      <span className="article-topic">{topic.title}</span>
      <h2>{article.title}</h2>
      <p className="article-summary">{article.summary}</p>
      <ol>{article.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <div className="article-note"><AlertTriangle /><p>{article.note}</p></div>
    </article>
    {opensSupportRequest ? (
      <button className="support-link full" onClick={openRequest}>联系支持</button>
    ) : (
      <>
        <button className="primary-action full" onClick={openAction}>{actionLabel}</button>
        <button className="support-link" onClick={openRequest}>联系支持</button>
      </>
    )}
  </div>;
}

function SupportRequestPage({ data, updateData, supportContextEsimId, supportRequestIssue, setSupportRequestIssue, supportRequestSubmitted, setSupportRequestSubmitted, supportRequestId, setSupportRequestId, supportRequestDuplicate, setSupportRequestDuplicate, supportRequestSimulation, go, back, review, onRule }) {
  const esim = resolveSupportEsim(data, supportContextEsimId);
  const sku = esim && currentEsimSku(data, esim);
  const destination = sku && data.destinations.find((item) => item.catalogId === sku.catalogId);
  const [description, setDescription] = useState('');
  const [formState, setFormState] = useState('idle');
  const issues = [
    ['installation', '安装 eSIM'],
    ['connection', '连接与网络'],
    ['usage', '流量、有效期或加购'],
    ['payment', '付款、订单或退款'],
    ['compatibility', '设备兼容'],
  ];
  function hasSensitiveContent(value) {
    return /(二维码|激活码|SM-DP\+|SM-DP|ICCID|银行卡|卡号|CVV|CVC|\b(?:\d[ -]?){13,19}\b)/i.test(value);
  }
  function submitRequest(event) {
    event.preventDefault();
    const normalizedDescription = description.trim();
    if (!normalizedDescription) {
      setFormState('empty');
      return;
    }
    if (hasSensitiveContent(normalizedDescription)) {
      setFormState('sensitive');
      return;
    }
    const now = Date.now();
    const existing = (data.supportRequests || []).find((request) => (
      request.esimId === (esim?.id || null)
        && request.issue === supportRequestIssue
        && request.description === normalizedDescription
        && now - new Date(request.createdAt).getTime() < 10 * 60 * 1000
    ));
    if (existing) {
      setSupportRequestId(existing.id);
      setSupportRequestDuplicate(true);
      setSupportRequestSubmitted(true);
      return;
    }
    setFormState('submitting');
    window.setTimeout(() => {
      if (supportRequestSimulation === 'failed') {
        setFormState('failed');
        return;
      }
      const requestId = `HTS-${Date.now().toString().slice(-8)}`;
      updateData((current) => ({
        ...current,
        supportRequests: [{
          id: requestId,
          esimId: esim?.id || null,
          issue: supportRequestIssue,
          description: normalizedDescription,
          createdAt: new Date().toISOString(),
        }, ...(current.supportRequests || [])],
      }));
      setSupportRequestId(requestId);
      setSupportRequestDuplicate(false);
      setSupportRequestSubmitted(true);
    }, 450);
  }
  if (supportRequestSubmitted) return <div className="detail-page support-request-page">
    <PageHeader title="支持请求" back={back} rule="FR-012" review={review} onRule={onRule} />
    <section className="support-submitted"><ShieldCheck /><h2>支持请求已记录</h2><p>{supportRequestDuplicate ? '已记录相同问题，请等待支持团队跟进。' : (esim ? '相关 eSIM 的必要订单信息已随请求附带。' : '已记录你的问题，你可返回商店继续浏览。')}</p>{supportRequestId && <strong className="support-request-id">请求编号：{supportRequestId}</strong>}<small>我们会通过 HelloTalk 支持团队跟进。</small></section>
    <button className="primary-action full" onClick={() => go(esim ? 'esim-detail' : 'store', { replace: true })}>{esim ? '返回我的 eSIM' : '返回商店'}</button>
    <button className="text-action support-store-link" onClick={() => go('support', { replace: true })}>返回帮助与支持</button>
  </div>;
  return <div className="detail-page support-request-page">
    <PageHeader title="联系支持" back={back} rule="FR-012" review={review} onRule={onRule} />
    <section className="support-intro compact"><h2>告诉我们遇到的问题</h2><p>不要填写银行卡信息、二维码、激活码或其他安装敏感内容。</p></section>
    {esim && <section className="support-request-context"><span>{destination?.flag || '🌐'}</span><div><strong>{destination?.name || '旅行'} eSIM</strong><small>{sku ? skuLabel(sku) : '当前 eSIM'} · {isDelivered(esim) ? statusLabel(esim.status, esim.usageStatus) : deliveryLabel(esim.fulfillmentStatus)}</small></div><ShieldCheck /></section>}
    <form className="support-form" onSubmit={submitRequest}>
      <label>问题类型<select value={supportRequestIssue} onChange={(event) => setSupportRequestIssue(event.target.value)}>{issues.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>问题描述<textarea value={description} onBlur={() => { if (!description.trim()) setFormState('empty'); }} onChange={(event) => { setDescription(event.target.value); setFormState('idle'); }} placeholder="请描述你看到的情况、目的地和已尝试的步骤。" maxLength="500" /></label>
      <small>内部订单和 eSIM 上下文会自动附带；不会显示或提交敏感安装信息。</small>
      {formState === 'empty' && <p className="support-form-status error">请填写问题描述后提交。</p>}
      {formState === 'sensitive' && <p className="support-form-status error">内容包含敏感安装或支付信息，请删除后再提交。</p>}
      {formState === 'failed' && <p className="support-form-status error">暂时无法提交支持请求，请稍后重试。</p>}
      {formState === 'submitting' && <p className="support-form-status">正在提交支持请求，请勿重复操作。</p>}
      <button className="primary-action" type="submit" disabled={formState === 'submitting'}>{formState === 'failed' ? '重新提交' : '提交支持请求'}</button>
    </form>
  </div>;
}

function OnboardingPage({ data, updateData, go, back, setSelectedDestinationId, setPurchaseOnOtherDevice, review, onRule }) {
  const [destination, setDestination] = useState('');
  const [step, setStep] = useState(1);
  const [compatibility, setCompatibility] = useState(data.profile.deviceSupport);
  const normalizedDestination = destination.trim().toLowerCase();
  const destinationResults = data.destinations.filter((item) => item.enabled && (
    !normalizedDestination || item.name.toLowerCase().includes(normalizedDestination)
  ));
  function selectOnboardingDestination(item) {
    recordDestinationSearch(updateData, item.id);
    setPurchaseOnOtherDevice(false);
    setSelectedDestinationId(item.id);
    if (data.profile.deviceSupport !== 'unknown') {
      updateData((current) => ({
        ...current,
        profile: { ...current.profile, onboardingCompleted: true },
      }));
      go('destination', { replace: true });
      return;
    }
    setStep(2);
  }
  function selectCompatibility(value) {
    setCompatibility(value);
    setPurchaseOnOtherDevice(false);
    updateData((current) => ({
      ...current,
      profile: {
        ...current.profile,
        deviceSupport: value,
        deviceSupportSource: 'user',
        onboardingCompleted: true,
      },
    }));
    go('destination', { replace: true });
  }
  return <div className="onboarding-page">
    <PageHeader title={step === 1 ? '选择目的地' : '确认设备'} back={back} rule="FR-004" review={review} onRule={onRule} right={<IconButton label="关闭" onClick={() => back('store')}><X /></IconButton>} />
    {step === 1 && <section className="onboarding-selection">
      <p className="onboarding-step-label">第 1 步，共 2 步</p>
      <div className="search-input"><Search /><input autoFocus value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="搜索国家或地区" /><button onClick={() => setDestination('')}><X /></button></div>
      <p className="form-help">输入国家、地区或全球套餐。</p>
      {data.profile.searchHistory?.length > 0 && <DestinationHistory data={data} onSelect={selectOnboardingDestination} />}
      {destinationResults.length > 0
        ? <DestinationRecommendations data={data} destinations={destinationResults} onSelect={selectOnboardingDestination} />
        : <p className="search-empty">暂未找到该目的地。</p>}
    </section>}
    {step === 2 && <section className="onboarding-card">
      <span className="onboarding-step-label">第 2 步，共 2 步</span>
      <h1>确认您的设备</h1>
      <p>暂未在兼容目录中识别 {data.profile?.deviceModel || '此设备'}。请选择当前设备的情况。</p>
      <div className="compatibility-choice"><Smartphone /><div><strong>此设备是否支持 eSIM？</strong><small>可稍后在购买前重新确认。</small></div></div>
      <div className="compatibility-options">
        {[['unknown', '不确定'], ['supported', '支持'], ['unsupported', '不支持']].map(([value, label]) => (
          <button key={value} className={compatibility === value ? 'selected' : ''} onClick={() => selectCompatibility(value)}>{label}</button>
        ))}
      </div>
    </section>}
  </div>;
}

createRoot(document.getElementById('root')).render(<AppShell />);
