import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  Globe2,
  Info,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  Package,
  QrCode,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Signal,
  Smartphone,
  Store,
  ToggleLeft,
  ToggleRight,
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
  minCatalogPrice,
  money,
  planStartCopy,
  skuLabel,
  validTransitions,
} from './data';
import './styles.css';

const RULES = {
  'FR-A01': { title: '商店与目录', pages: ['store', 'search'], surface: 'app' },
  'FR-A02': { title: '新手引导与设备兼容', pages: ['onboarding', 'compatibility-checkout'], surface: 'app' },
  'FR-A03': { title: '目的地与套餐', pages: ['destination', 'plan'], surface: 'app' },
  'FR-A04': { title: 'Stripe 结算与支付', pages: ['checkout', 'stripe-checkout', 'success'], surface: 'app' },
  'FR-A05': { title: '我的 eSIM', pages: ['my-esims', 'esim-detail', 'install', 'connect'], surface: 'app' },
  'FR-A06': { title: '商店与目的地配置', pages: ['admin-overview', 'admin-destinations'], surface: 'admin' },
  'FR-A07': { title: '目录与 SKU 配置', pages: ['admin-catalog'], surface: 'admin' },
  'FR-A08': { title: '订单与生命周期测试', pages: ['admin-orders'], surface: 'admin' },
  'FR-A09': { title: '双向 Review', pages: ['admin-review'], surface: 'admin' },
};

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

function PageHeader({ title, back, right, rule, review, onRule }) {
  return <header className="page-header">
    <div className="header-side">{back && <IconButton label="返回" onClick={back}><ChevronLeft /></IconButton>}</div>
    <h1>{title}</h1>
    <div className="header-side">{right}</div>
    <RuleMarker id={rule} review={review} onClick={onRule} />
  </header>;
}

function TabHeader({ title, rule, review, onRule }) {
  return <header className="tab-title-header">
    <h1>{title}</h1>
    <RuleMarker id={rule} review={review} onClick={() => onRule(rule)} />
  </header>;
}

function RuleMarker({ id, review, onClick }) {
  if (!review || !id) return null;
  return <button className="rule-marker" data-review-marker={id} onClick={onClick} title={`定位 ${id}`}>{id.replace('FR-A', '')}</button>;
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
  if (esim.status === 'expired') return '不可用';
  if (sku.unlimited) return '不限流量';
  return esim.remainingData || sku.data;
}

function currentEsimSku(data, esim) {
  const purchaseOrder = data.orders.find((order) => order.id === esim.orderId);
  return getSku(data, esim.currentSkuId || purchaseOrder?.skuId);
}

function linkedEsimForOrder(data, order) {
  return data.esims.find((item) => item.id === order.parentEsimId || item.orderId === order.id);
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
  const initialAdminTab = ['overview', 'destinations', 'catalog', 'orders', 'review'].includes(initial.get('tab'))
    ? initial.get('tab')
    : 'overview';
  const [mode, setMode] = useState(initial.get('mode') === 'admin' ? 'admin' : 'app');
  const [page, setPage] = useState(initial.get('mode') === 'admin' ? `admin-${initialAdminTab}` : 'store');
  const [navHistory, setNavHistory] = useState([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState('japan');
  const [selectedSkuId, setSelectedSkuId] = useState(null);
  const [selectedEsimId, setSelectedEsimId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('popular');
  const [checkoutMode, setCheckoutMode] = useState('purchase');
  const [topUpEsimId, setTopUpEsimId] = useState(null);
  const [review, setReview] = useState(initial.get('review') === '1');
  const [toast, setToast] = useState('');
  const [activeRule, setActiveRule] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams();
    if (mode === 'admin') query.set('mode', 'admin');
    if (review) query.set('review', '1');
    if (page.startsWith('admin-')) query.set('tab', page.replace('admin-', ''));
    history.replaceState(null, '', `${location.pathname}${query.toString() ? `?${query}` : ''}`);
  }, [mode, review, page]);

  function updateData(updater) {
    setData((current) => typeof updater === 'function' ? updater(current) : updater);
  }

  function flash(message) {
    setToast(message);
    window.clearTimeout(flash.timeout);
    flash.timeout = window.setTimeout(() => setToast(''), 2200);
  }

  function go(next, options = {}) {
    if (!options.replace) setNavHistory((stack) => [...stack, page]);
    setPage(next);
  }
  function back(fallback = 'store') {
    setNavHistory((stack) => {
      const next = [...stack];
      setPage(next.pop() || fallback);
      return next;
    });
  }
  function goRule(ruleId) {
    setActiveRule(ruleId);
    if (ruleId === 'FR-A04') {
      const sku = data.skus.find((item) => item.enabled && item.catalogId === selectedDestination?.catalogId)
        || data.skus.find((item) => item.enabled);
      const destination = sku && data.destinations.find((item) => item.catalogId === sku.catalogId && item.enabled);
      if (sku && destination) {
        setSelectedDestinationId(destination.id);
        setSelectedSkuId(sku.id);
        setCheckoutMode('purchase');
        setTopUpEsimId(null);
      }
    }
    const target = RULES[ruleId]?.pages?.[0] || 'store';
    if (target.startsWith('admin-')) {
      setMode('admin');
      setPage(target);
    } else {
      setMode('app');
      setPage(target);
    }
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
  };

  return (
    <main className="workbench">
      <aside className="workbench-panel no-print">
        <div className="brand-lockup"><span className="brand-dot">H</span><div><strong>HelloTalk</strong><small>eSIM Demo</small></div></div>
        <div className="control-label">预览模式</div>
        <div className="segmented-control">
          <button className={mode === 'app' ? 'selected' : ''} onClick={() => { setMode('app'); go('store', { replace: true }); }}><Smartphone />用户端</button>
          <button className={mode === 'admin' ? 'selected' : ''} onClick={() => { setMode('admin'); go('admin-overview', { replace: true }); }}><LayoutDashboard />后台</button>
        </div>
        <button className={`review-switch ${review ? 'on' : ''}`} onClick={() => setReview((enabled) => !enabled)}>
          {review ? <ToggleRight /> : <ToggleLeft />} Linfan Review
        </button>
        <div className="scenario-card">
          <strong>演示状态</strong>
          <span>{data.esims.length ? `${data.esims.length} 张 eSIM` : '未购买 eSIM'}</span>
          <span>支付方式：Stripe Hosted Checkout 演示</span>
          <button onClick={() => { updateData(cloneDefaultData()); flash('已恢复初始演示数据'); }}>重置演示数据</button>
        </div>
        {review && <ReviewPanel activeRule={activeRule} onRule={goRule} mode={mode} />}
      </aside>
      <section className={`device-stage ${mode === 'admin' ? 'admin-stage' : ''}`}>
        {mode === 'app'
          ? <PhoneCanvas {...shared} />
          : <AdminConsole {...shared} setMode={setMode} setReview={setReview} />}
      </section>
      {review && <ReviewConnector activeRule={activeRule} />}
      <Toast toast={toast} />
    </main>
  );
}

function ReviewPanel({ activeRule, onRule, mode }) {
  const entries = Object.entries(RULES).filter(([, item]) => item.surface === mode);
  return <section className="review-panel" data-review-panel>
    <div className="panel-title"><BookOpenCheck />需求规则</div>
    {entries.map(([id, item]) => <button key={id} data-review-rule={id} className={activeRule === id ? 'focus' : ''} onClick={() => onRule(id)}>
      <span>{id}</span><small>{item.title}</small>
    </button>)}
  </section>;
}

function ReviewConnector({ activeRule }) {
  const [line, setLine] = useState(null);
  useLayoutEffect(() => {
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
        x1: from.right - base.left,
        y1: from.top - base.top + from.height / 2,
        x2: to.left - base.left + to.width / 2,
        y2: to.top - base.top + to.height / 2,
      });
    }
    measure();
    window.addEventListener('resize', measure);
    const timer = window.setTimeout(measure, 80);
    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(timer);
    };
  }, [activeRule]);
  if (!line) return null;
  const midX = line.x1 + Math.max(42, (line.x2 - line.x1) * 0.42);
  return <svg className="review-connector" data-review-connector aria-hidden="true">
    <path d={`M ${line.x1} ${line.y1} L ${midX} ${line.y1} L ${midX} ${line.y2} L ${line.x2} ${line.y2}`} />
    <circle cx={line.x2} cy={line.y2} r="4" />
  </svg>;
}

function PhoneCanvas(props) {
  const { page, go, back, review, onRule } = props;
  const tabRoot = ['store', 'my-esims'].includes(page);
  return <div className="phone-frame">
    <div className="phone-screen">
      <div className="statusbar"><span>9:41</span><span><Signal size={15}/><Wifi size={15}/><span className="battery">83</span></span></div>
      <div className={`phone-content ${tabRoot ? 'tab-root' : ''}`}>
        {page === 'store' && <StorePage {...props} />}
        {page === 'search' && <SearchPage {...props} />}
        {page === 'destination' && <DestinationPage {...props} />}
        {page === 'plan' && <PlanPage {...props} />}
        {page === 'compatibility-checkout' && <CompatibilityCheckoutPage {...props} />}
        {page === 'checkout' && <CheckoutPage {...props} />}
        {page === 'stripe-checkout' && <StripeCheckoutPage {...props} />}
        {page === 'success' && <SuccessPage {...props} />}
        {page === 'my-esims' && <MyEsimsPage {...props} />}
        {page === 'esim-detail' && <EsimDetailPage {...props} />}
        {page === 'install' && <InstallPage {...props} />}
        {page === 'connect' && <ConnectPage {...props} />}
        {page === 'onboarding' && <OnboardingPage {...props} />}
        {page === 'support' && <SupportPage {...props} />}
      </div>
      {tabRoot && <BottomTabs active={page} onChange={(next) => go(next, { replace: true })} />}
    </div>
  </div>;
}

function TopHome({ review, onRule }) {
  return <div className="home-top">
    <div><p>为下一段旅程保持连接</p></div>
    <RuleMarker id="FR-A01" review={review} onClick={() => onRule('FR-A01')} />
  </div>;
}

function StorePage(props) {
  const { data, go, category, setCategory, setSelectedDestinationId, setCheckoutMode, setTopUpEsimId, review, onRule } = props;
  const [activeCard, setActiveCard] = useState(0);
  const catalogTypes = {
    popular: { label: '热门', description: '探索最受欢迎的 eSIM，价格从下列套餐起。', ids: ['usa', 'japan', 'france', 'singapore'] },
    local: { label: '本地', description: '单个目的地的本地连接套餐。', ids: data.destinations.filter((d) => d.type === 'local').map((d) => d.id) },
    regional: { label: '区域', description: '一次购买，覆盖多个国家和地区。', ids: data.destinations.filter((d) => d.type === 'regional').map((d) => d.id) },
    global: { label: '全球', description: '跨越多个地区的全球连接套餐。', ids: data.destinations.filter((d) => d.type === 'global').map((d) => d.id) },
  };
  const current = catalogTypes[category];
  const entries = current.ids.map((id) => getDestination(data, id)).filter(Boolean).filter((d) => d.enabled);
  const cards = (data.settings.homeCards || []).filter((card) => card.enabled);
  function openCard(card) {
    setCheckoutMode('purchase');
    setTopUpEsimId(null);
    setCategory(card.action === 'store-regional' ? 'regional' : 'popular');
    go('store', { replace: true });
  }
  return <div className="store-page">
    <TopHome {...props} />
    <button className="search-hero" onClick={() => go('search')}><Search /><span>您需要哪里的 eSIM？</span></button>
    <button className="onboard-strip store-onboard-strip" onClick={() => go('onboarding')}><Info />第一次使用 eSIM？了解如何开始<ChevronRight /></button>
    {cards.length > 0 && <section className="home-carousel" aria-label="出行权益">
      <div className="carousel-track" style={{ transform: `translateX(-${activeCard * (100 / cards.length)}%)` }}>
        {cards.map((card, index) => <button className={`benefit-card theme-${card.theme}`} key={card.id} onClick={() => openCard(card)} aria-hidden={activeCard !== index}>
          <img className="benefit-illustration" src="/hello-esim-travelers.png" alt="" />
          <div className="benefit-copy"><span className="eyebrow">HelloTalk eSIM</span><h2>{card.title}</h2><p>{card.copy}</p></div>
          <CircleHelp className="benefit-icon" />
        </button>)}
      </div>
      <div className="pager-dots">{cards.map((card, index) => <button key={card.id} aria-label={`查看${card.title}`} className={activeCard === index ? 'active' : ''} onClick={() => setActiveCard(index)}><i /></button>)}</div>
    </section>}
    <div className="catalog-tabs">{Object.entries(catalogTypes).map(([id, item]) => <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)}>{item.label}</button>)}</div>
    <p className="catalog-description">{current.description}</p>
    <div className="destination-list">
      {entries.map((destination) => {
        const minPrice = minCatalogPrice(data, destination.catalogId);
        return <button key={destination.id} className="destination-row" onClick={() => { setCheckoutMode('purchase'); setTopUpEsimId(null); setSelectedDestinationId(destination.id); go('destination'); }}>
          <span className="destination-flag">{destination.flag}</span><strong>{destination.name}</strong><span className="price-from">{minPrice === null ? '暂不可售' : `起 ${money(minPrice)}`}</span><ChevronRight />
        </button>;
      })}
    </div>
    <button className="support-fab" aria-label="联系客服" title="联系客服" onClick={() => props.go('support')}><MessageCircle /></button>
  </div>;
}

function SearchPage({ data, go, back, searchTerm, setSearchTerm, setSelectedDestinationId, setCheckoutMode, setTopUpEsimId, review, onRule }) {
  const normalized = searchTerm.trim().toLowerCase();
  const results = data.destinations.filter((destination) => destination.enabled && (!normalized || destination.name.toLowerCase().includes(normalized)));
  return <div className="detail-page">
    <PageHeader title="选择目的地" back={back} rule="FR-A01" review={review} onRule={onRule} />
    <div className="search-input"><Search /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索国家或地区" /><button onClick={() => setSearchTerm('')}><X /></button></div>
    <p className="form-help">输入国家、地区或全球套餐。</p>
    <div className="result-list">{results.map((destination) => {
      const catalog = getCatalog(data, destination.catalogId);
      return <button key={destination.id} className="search-result" onClick={() => { setCheckoutMode('purchase'); setTopUpEsimId(null); setSelectedDestinationId(destination.id); go('destination'); }}>
        <span>{destination.flag}</span><div><strong>{destination.name}</strong><small>{catalog.coverage}</small></div><ChevronRight />
      </button>;
    })}</div>
  </div>;
}

function DestinationPage({ data, selectedDestination, checkoutMode, go, back, setSelectedSkuId, flash, review, onRule }) {
  const catalog = getCatalog(data, selectedDestination.catalogId);
  const skus = data.skus.filter((sku) => sku.catalogId === catalog.id && sku.enabled);
  return <div className="detail-page">
    <PageHeader title={checkoutMode === 'topup' ? `加购 ${selectedDestination.name}` : selectedDestination.name} back={back} rule="FR-A03" review={review} onRule={onRule} right={<IconButton label="套餐说明" onClick={() => flash('套餐详情包含覆盖范围、有效期、网络和加购条件。')}><MoreHorizontal /></IconButton>} />
    <section className="destination-hero"><span>{selectedDestination.flag}</span><div><p>{catalog.coverage}</p><small>{catalog.network} · {catalog.operator}</small></div></section>
    <div className="section-heading"><div><h2>{checkoutMode === 'topup' ? '选择加购套餐' : '选择套餐'}</h2><p>{checkoutMode === 'topup' ? '仅显示当前 eSIM 所在目录的可售套餐。' : `每个套餐仅适用于 ${selectedDestination.name}`}</p></div><Globe2 /></div>
    <div className="plan-list">{skus.map((sku) => <button key={sku.id} className="plan-card" onClick={() => { setSelectedSkuId(sku.id); go('plan'); }}>
      <div><span className={sku.unlimited ? 'unlimited-tag' : 'data-tag'}>{sku.unlimited ? '不限流量' : sku.data}</span><h3>{skuLabel(sku)}</h3><p>{planStartCopy(sku)}</p></div>
      <div className="plan-price"><strong>{money(sku.price)}</strong><ChevronRight /></div>
    </button>)}</div>
    <section className="quiet-note"><Info /><p>{checkoutMode === 'topup' ? '加购成功后会回到当前 eSIM；不支持加购的套餐不会显示此入口。' : '购买后可在“我的 eSIM”中完成安装和连接。'}</p></section>
  </div>;
}

function PlanPage({ data, selectedDestination, selectedSku, checkoutMode, go, back, review, onRule }) {
  const catalog = getCatalog(data, selectedSku.catalogId);
  function continueCheckout() {
    if (checkoutMode === 'purchase' && data.profile.deviceSupport === 'unsupported') {
      go('compatibility-checkout');
      return;
    }
    go('checkout');
  }
  return <div className="detail-page plan-detail">
    <PageHeader title="套餐详情" back={back} rule="FR-A03" review={review} onRule={onRule} />
    <section className="plan-detail-card"><span className="large-flag">{selectedDestination.flag}</span><div><h2>{selectedDestination.name} eSIM</h2><p>{catalog.network}</p></div></section>
    <section className="package-grid">
      <div><span>流量</span><strong>{selectedSku.data}</strong></div>
      <div><span>有效期</span><strong>{selectedSku.validityDays} 天</strong></div>
      <div><span>网络</span><strong>{catalog.network}</strong></div>
      <div><span>加购</span><strong>{selectedSku.topUpEnabled ? '支持' : '不支持'}</strong></div>
    </section>
    <section className="detail-section"><h3>有效期</h3><p>{planStartCopy(selectedSku)}。{selectedSku.activationPolicy === 'on_network_connect' ? '请在到达目的地后连接支持网络再开始使用。' : '安装完成后请尽快开始行程。'}</p></section>
    <section className="detail-section"><h3>覆盖范围</h3><p>{catalog.coverage}</p></section>
    <section className="detail-section"><h3>{checkoutMode === 'topup' ? '加购说明' : '安装方式'}</h3><p>{checkoutMode === 'topup' ? '这笔加购仅关联到当前 eSIM，付款完成后从“我的 eSIM”继续查看。' : '购买完成后支持应用内安装、二维码和手动安装。'}</p></section>
    <footer className="sticky-cta"><div><small>{checkoutMode === 'topup' ? '加购价格' : '总价'}</small><strong>{money(selectedSku.price)}</strong></div><button onClick={continueCheckout}>{checkoutMode === 'topup' ? '继续加购' : '继续'}</button></footer>
  </div>;
}

function CompatibilityCheckoutPage({ go, back, selectedDestination, review, onRule }) {
  return <div className="detail-page compatibility-checkout-page">
    <PageHeader title="确认设备" back={back} rule="FR-A02" review={review} onRule={onRule} />
    <section className="install-hero"><AlertTriangle /><h2>当前设备不支持 eSIM</h2><p>你可以继续为其他兼容设备购买。付款后，请在那台设备的“我的 eSIM”中完成安装。</p></section>
    <section className="quiet-note"><Info /><p>{selectedDestination.name} 的套餐仍可查看；本设备不能进行系统安装。</p></section>
    <button className="outline-action" onClick={() => back('plan')}>返回套餐</button>
    <button className="primary-action full" onClick={() => go('checkout')}>为兼容设备继续购买</button>
  </div>;
}

function CheckoutPage({ data, selectedDestination, selectedSku, checkoutMode, topUpEsim, go, back, review, onRule }) {
  if (!selectedDestination || !selectedSku) {
    return <div className="detail-page checkout-page">
      <PageHeader title="确认订单" back={back} rule="FR-A04" review={review} onRule={onRule} />
      <section className="install-hero"><Info /><h2>请先选择套餐</h2><p>从目的地页面选择可售套餐后，才能进入 Stripe Checkout。</p></section>
      <button className="primary-action full" onClick={() => go('destination', { replace: true })}>选择套餐</button>
    </div>;
  }
  const topUpSku = topUpEsim && currentEsimSku(data, topUpEsim);
  const isTopUp = checkoutMode === 'topup' && topUpSku?.catalogId === selectedSku.catalogId;
  return <div className="detail-page checkout-page">
    <PageHeader title={isTopUp ? '确认加购' : '确认订单'} back={back} rule="FR-A04" review={review} onRule={onRule} />
    <section className="order-card"><div><span>{selectedDestination.flag}</span><div><h2>{selectedDestination.name} eSIM</h2><p>{isTopUp ? `加购 · ${skuLabel(selectedSku)}` : skuLabel(selectedSku)}</p></div></div><strong>{money(selectedSku.price)}</strong></section>
    <section className="checkout-section"><div className="line-title"><ShieldCheck /><span>安全结算</span></div><p>付款将跳转至 Stripe Hosted Checkout。HelloTalk 不保存银行卡或支付账户信息。</p></section>
    <section className="price-summary"><div><span>套餐</span><strong>{money(selectedSku.price)}</strong></div><div className="total"><span>应付</span><strong>{money(selectedSku.price)}</strong></div></section>
    <footer className="sticky-cta"><div><small>应付</small><strong>{money(selectedSku.price)}</strong></div><button onClick={() => go('stripe-checkout')}>{isTopUp ? '前往 Stripe 加购' : '前往 Stripe 付款'}</button></footer>
  </div>;
}

function StripeCheckoutPage({ data, updateData, selectedSku, selectedDestination, checkoutMode, topUpEsim, setSelectedEsimId, go, back, flash, review, onRule }) {
  const topUpSku = topUpEsim && currentEsimSku(data, topUpEsim);
  const isTopUp = checkoutMode === 'topup' && topUpEsim && topUpSku?.catalogId === selectedSku.catalogId;
  function complete(status) {
    if (status !== 'paid') {
      flash(status === 'cancelled' ? '已取消 Stripe 付款，未创建 eSIM' : 'Stripe 付款未完成，未创建 eSIM');
      go('checkout', { replace: true });
      return;
    }
    const now = new Date().toISOString();
    const orderId = `ord-${Date.now()}`;
    const esimId = `esim-${Date.now()}`;
    updateData((current) => {
      const next = structuredClone(current);
      next.orders.unshift({ id: orderId, skuId: selectedSku.id, kind: isTopUp ? 'topup' : 'purchase', parentEsimId: isTopUp ? topUpEsim.id : null, status: 'paid', amount: selectedSku.price, paymentProvider: 'stripe_demo', createdAt: now });
      if (isTopUp) {
        const target = next.esims.find((item) => item.id === topUpEsim.id);
        if (target) {
          const start = new Date();
          target.status = 'active';
          target.currentSkuId = selectedSku.id;
          target.remainingData = selectedSku.unlimited ? null : selectedSku.data;
          target.startedAt = start.toISOString();
          target.expiresAt = new Date(start.getTime() + selectedSku.validityDays * 86400000).toISOString();
        }
      } else {
        next.esims.unshift({ id: esimId, orderId, currentSkuId: selectedSku.id, status: 'pending_install', installMethod: null, remainingData: selectedSku.unlimited ? null : selectedSku.data, startedAt: null, expiresAt: null });
      }
      return next;
    });
    setSelectedEsimId(isTopUp ? topUpEsim.id : esimId);
    go('success');
  }
  return <div className="detail-page stripe-checkout-page">
    <PageHeader title="Stripe Checkout" back={back} rule="FR-A04" review={review} onRule={onRule} />
    <section className="stripe-brand"><strong>stripe</strong><span>Hosted Checkout</span></section>
    <section className="payment-amount"><span>{isTopUp ? '加购应付金额' : '应付金额'}</span><strong>{money(selectedSku.price)}</strong><small>HelloTalk eSIM · {selectedDestination.name} · {isTopUp ? `加购 ${skuLabel(selectedSku)}` : skuLabel(selectedSku)}</small></section>
    <section className="stripe-order"><div><span>商户</span><strong>HelloTalk eSIM</strong></div><div><span>订单内容</span><strong>{isTopUp ? `加购 ${skuLabel(selectedSku)}` : skuLabel(selectedSku)}</strong></div></section>
    <section className="quiet-note"><ShieldCheck /><p>这是 Stripe Hosted Checkout 的演示承接页。此 Demo 不连接 Stripe API，也不会收集或处理真实支付信息。</p></section>
    <div className="payment-actions"><button className="secondary-action" onClick={() => complete('cancelled')}>取消付款</button><button className="primary-action" onClick={() => complete('paid')}>支付 {money(selectedSku.price)}</button></div>
  </div>;
}

function SuccessPage({ data, checkoutMode, topUpEsim, selectedEsim, go, review, onRule }) {
  const latest = checkoutMode === 'topup' ? (selectedEsim || topUpEsim) : data.esims[0];
  const isTopUp = checkoutMode === 'topup' && latest;
  return <div className="success-page">
    <div className="success-symbol"><ShieldCheck /></div><h1>{isTopUp ? '加购成功' : '购买成功'}</h1><p>{isTopUp ? '新的流量包已关联到当前 eSIM，可返回查看使用状态。' : '你的 eSIM 已添加到“我的 eSIM”。下一步请完成安装与连接。'}</p>
    <div className="success-ticket"><Package /><div><strong>{isTopUp ? '已更新 eSIM 流量' : '待安装'}</strong><small>{latest ? (isTopUp ? '可在我的 eSIM 中查看新的有效期和余量' : '安装前不会开始使用流量') : ''}</small></div></div>
    <button className="primary-action" onClick={() => go(isTopUp ? 'esim-detail' : 'my-esims', { replace: true })}>{isTopUp ? '查看我的 eSIM' : '查看我的 eSIM'}</button>
    <button className="text-action" onClick={() => go('store', { replace: true })}>继续购物</button>
    <RuleMarker id="FR-A04" review={review} onClick={() => onRule('FR-A04')} />
  </div>;
}

function MyEsimsPage({ data, go, setSelectedEsimId, review, onRule }) {
  return <div className="my-esims-page">
    <TabHeader title="我的 eSIM" rule="FR-A05" review={review} onRule={onRule} />
    {data.esims.length === 0 ? <div className="empty-esim"><img src="/hello-esim-empty-state.png" alt="" /><h2>eSIM 让出行更轻松</h2><p>提前为下一段旅程准备连接，抵达后即可按指引完成安装与使用。</p><button className="primary-action" onClick={() => go('onboarding')}>了解运作方式</button></div> :
      <div className="esim-list">{data.esims.map((esim) => {
        const sku = currentEsimSku(data, esim);
        const destination = sku && data.destinations.find((entry) => entry.catalogId === sku.catalogId);
        return <button className={`esim-card ${esim.status}`} key={esim.id} onClick={() => { setSelectedEsimId(esim.id); go('esim-detail'); }}>
          <div className="esim-card-top"><span>{destination?.flag || '🌐'}</span><div><h2>{destination?.name || '旅行'} eSIM</h2><p>{sku ? skuLabel(sku) : ''}</p></div><ChevronRight /></div>
          <div className="esim-status"><span>{statusLabel(esim.status)}</span><strong>{esim.status === 'active' || esim.status === 'low_data' || esim.status === 'expired' ? remainingDataLabel(esim, sku) : '等待下一步'}</strong></div>
        </button>;
      })}</div>}
  </div>;
}

function statusLabel(status) {
  return ({ pending_install: '待安装', installed: '已安装', ready_to_connect: '等待连接', active: '使用中', low_data: '流量不足', expired: '已过期' })[status] || status;
}

function EsimDetailPage({ data, selectedEsim, go, back, setSelectedEsimId, setSelectedDestinationId, setCheckoutMode, setTopUpEsimId, updateData, flash, review, onRule }) {
  if (!selectedEsim) return <MyEsimsPage data={data} go={go} setSelectedEsimId={setSelectedEsimId} review={review} onRule={onRule} />;
  const sku = currentEsimSku(data, selectedEsim);
  const destination = data.destinations.find((item) => item.catalogId === sku.catalogId);
  const canTopUp = sku.topUpEnabled && ['low_data', 'expired'].includes(selectedEsim.status);
  function consume() {
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((entry) => entry.id === selectedEsim.id);
      if (target.status === 'active' && !sku.unlimited) {
        target.status = 'low_data';
        target.remainingData = lowDataAmount(sku);
      }
      return next;
    });
    flash('已模拟流量不足状态');
  }
  function expire() {
    updateData((current) => {
      const next = structuredClone(current);
      next.esims.find((entry) => entry.id === selectedEsim.id).status = 'expired';
      return next;
    });
    flash('已模拟套餐过期');
  }
  function prepareConnect() {
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((entry) => entry.id === selectedEsim.id);
      if (target?.status === 'installed') target.status = 'ready_to_connect';
      return next;
    });
    go('connect');
  }
  return <div className="detail-page esim-detail">
    <PageHeader title="eSIM 详情" back={back} rule="FR-A05" review={review} onRule={onRule} />
    <section className={`large-esim-card ${selectedEsim.status}`}><div><span>{destination.flag}</span><p>{destination.name} eSIM</p><h2>{statusLabel(selectedEsim.status)}</h2></div><Wifi /></section>
    <section className="esim-specs"><div><span>套餐</span><strong>{skuLabel(sku)}</strong></div><div><span>剩余流量</span><strong>{remainingDataLabel(selectedEsim, sku)}</strong></div><div><span>有效期</span><strong>{selectedEsim.startedAt ? `${dateLabel(selectedEsim.expiresAt)} 到期` : planStartCopy(sku)}</strong></div></section>
    {selectedEsim.status === 'pending_install' && <button className="primary-action full" onClick={() => go('install')}>安装或分享 eSIM</button>}
    {selectedEsim.status === 'installed' && <button className="primary-action full" onClick={prepareConnect}>准备连接</button>}
    {selectedEsim.status === 'ready_to_connect' && <button className="primary-action full" onClick={() => go('connect')}>连接 eSIM</button>}
    {canTopUp && <button className="primary-action full" onClick={() => { setSelectedEsimId(selectedEsim.id); setTopUpEsimId(selectedEsim.id); setCheckoutMode('topup'); setSelectedDestinationId(destination.id); go('destination'); }}>Top up</button>}
    {selectedEsim.status === 'active' && <div className="demo-tools">{!sku.unlimited && <button onClick={consume}>模拟流量不足</button>}<button onClick={expire}>模拟过期</button></div>}
    <section className="detail-section"><h3>安装信息</h3><p>安装后，请在手机设置中开启这张 eSIM 的蜂窝数据与数据漫游，并在到达目的地后连接网络。</p></section>
  </div>;
}

function InstallPage({ data, selectedEsim, updateData, go, back, flash, review, onRule }) {
  const [method, setMethod] = useState('app');
  const steps = [
    ['app', '应用内安装', Download],
    ['qr', '使用二维码', QrCode],
    ['manual', '手动安装', Settings2],
  ];
  function install() {
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((item) => item.id === selectedEsim.id);
      if (target.status !== 'pending_install') return current;
      target.status = 'installed';
      target.installMethod = method;
      const sku = currentEsimSku(next, target);
      if (sku.activationPolicy === 'on_install') {
        const now = new Date();
        target.startedAt = now.toISOString();
        target.expiresAt = new Date(now.getTime() + sku.validityDays * 86400000).toISOString();
      }
      return next;
    });
    flash('安装已完成，请继续连接 eSIM');
    go('esim-detail', { replace: true });
  }
  return <div className="detail-page install-page">
    <PageHeader title="安装 eSIM" back={back} rule="FR-A05" review={review} onRule={onRule} />
    <section className="install-hero"><Smartphone /><h2>选择安装方式</h2><p>同一张 eSIM 只能安装一次。</p></section>
    {steps.map(([id, label, Icon]) => <button key={id} className={`install-method ${method === id ? 'selected' : ''}`} onClick={() => setMethod(id)}><Icon /><div><strong>{label}</strong><small>{id === 'app' ? '在此设备上开始安装' : id === 'qr' ? '用另一台设备扫描二维码' : '在系统设置中输入信息'}</small></div><span className="radio" /></button>)}
    {method === 'qr' && <div className="qr-placeholder"><QrCode /><span>演示二维码</span></div>}
    {method === 'manual' && <div className="manual-code"><span>SM-DP+ 地址</span><strong>demo.hellotalk.com</strong><span>激活码</span><strong>HT-ESIM-2026</strong></div>}
    <footer className="sticky-cta"><span /><button onClick={install}>开始安装</button></footer>
  </div>;
}

function ConnectPage({ data, selectedEsim, updateData, go, back, flash, review, onRule }) {
  const [checked, setChecked] = useState({ line: false, data: false, roaming: false });
  const ready = Object.values(checked).every(Boolean);
  function connect() {
    if (!ready) return;
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((item) => item.id === selectedEsim.id);
      if (target.status !== 'ready_to_connect') return current;
      const sku = currentEsimSku(next, target);
      target.status = 'active';
      if (!target.startedAt) {
        const now = new Date();
        target.startedAt = now.toISOString();
        target.expiresAt = new Date(now.getTime() + sku.validityDays * 86400000).toISOString();
      }
      return next;
    });
    flash('连接成功，eSIM 已开始使用');
    go('esim-detail', { replace: true });
  }
  return <div className="detail-page connect-page">
    <PageHeader title="连接 eSIM" back={back} rule="FR-A05" review={review} onRule={onRule} />
    <section className="install-hero"><Wifi /><h2>完成连接设置</h2><p>请在手机系统设置中依次完成以下操作。</p></section>
    {[['line', '开启这张 eSIM 线路'], ['data', '将蜂窝数据切换到这张 eSIM'], ['roaming', '打开数据漫游']].map(([id, label], index) => <label className="connect-step" key={id}><span>{index + 1}</span><strong>{label}</strong><input type="checkbox" checked={checked[id]} onChange={() => setChecked((value) => ({ ...value, [id]: !value[id] }))} /></label>)}
    <footer className="sticky-cta"><span /><button disabled={!ready} onClick={connect}>我已完成设置</button></footer>
  </div>;
}

function SupportPage({ go, back, flash, review, onRule }) {
  const topics = [
    ['安装 eSIM', '购买后可从“我的 eSIM”选择应用内、二维码或手动安装。'],
    ['连接与使用', '抵达目的地后，在系统设置中启用 eSIM 线路、蜂窝数据和数据漫游。'],
    ['加购套餐', '仅当当前套餐支持 Top up，且处于流量不足或过期状态时显示入口。'],
  ];
  return <div className="detail-page">
    <PageHeader title="帮助与支持" back={back} rule="FR-A05" review={review} onRule={onRule} />
    <div className="help-list">{topics.map(([title, description]) => <button key={title} onClick={() => flash(description)}><CircleHelp /><div><strong>{title}</strong><small>{description}</small></div><ChevronRight /></button>)}</div>
    <button className="primary-action full" onClick={() => go('store', { replace: true })}>返回商店</button>
  </div>;
}

function OnboardingPage({ data, updateData, go, back, setSelectedDestinationId, review, onRule }) {
  const [destination, setDestination] = useState('');
  const [compatibility, setCompatibility] = useState(data.profile.deviceSupport);
  const [step, setStep] = useState(1);
  const found = data.destinations.find((item) => item.enabled && item.name.includes(destination.trim()));
  const canContinue = step === 1 ? Boolean(destination.trim() && found) : true;
  function advance() {
    if (step === 1) {
      setSelectedDestinationId(found.id);
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    updateData((current) => ({ ...current, profile: { ...current.profile, deviceSupport: compatibility, onboardingCompleted: true } }));
    go('destination', { replace: true });
  }
  return <div className="onboarding-page">
    <PageHeader title="" back={back} rule="FR-A02" review={review} onRule={onRule} right={<IconButton label="关闭" onClick={() => back('store')}><X /></IconButton>} />
    <img src="/hello-esim-travelers.png" alt="" className="onboarding-art" />
    <section className="onboarding-card"><div className="step-row">{[1, 2, 3].map((item) => <span key={item} className={item <= step ? 'active' : ''} />)}<b>{step}/3</b></div>
      {step === 1 && <><h1>选择您的目的地</h1><p>HelloTalk eSIM 让您在各个国家、地区乃至全球范围内保持通信畅通。</p><div className="search-input"><Search /><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="例如：法国" /></div>{destination && <div className={found ? 'coverage-check ok' : 'coverage-check fail'}>{found ? <ShieldCheck /> : <X />}{found ? `HelloTalk 已覆盖 ${found.name}。` : '暂未找到该目的地。'}</div>}</>}
      {step === 2 && <><h1>确认您的设备</h1><p>eSIM 需要设备支持并处于运营商解锁状态。你可以先浏览套餐；不兼容设备将在购买前提示。</p><div className="compatibility-choice"><Smartphone /><div><strong>此设备是否支持 eSIM？</strong><small>可稍后在购买前重新确认。</small></div></div><div className="compatibility-options">{[['unknown', '不确定'], ['supported', '支持'], ['unsupported', '不支持']].map(([value, label]) => <button key={value} className={compatibility === value ? 'selected' : ''} onClick={() => setCompatibility(value)}>{label}</button>)}</div></>}
      {step === 3 && <><h1>开始挑选套餐</h1><p>{found?.name || '该目的地'}已准备好。套餐会标明流量、有效期、网络和是否支持加购。</p><div className="coverage-check ok"><Check />购买后可在“我的 eSIM”中完成安装与连接。</div></>}
    </section>
    <button disabled={!canContinue} className="onboarding-continue" onClick={advance}>{step === 3 ? '浏览套餐' : '继续'}</button>
  </div>;
}

function AdminConsole({ data, updateData, page, go, flash, review, onRule, setMode, setReview }) {
  const tabs = [
    ['overview', '概览', LayoutDashboard],
    ['destinations', '商店与目的地', Store],
    ['catalog', '目录与 SKU', Package],
    ['orders', '订单测试', ClipboardList],
    ['review', 'Review', BookOpenCheck],
  ];
  const current = page.replace('admin-', '');
  return <div className="admin-console">
    <header className="admin-header"><div className="brand-lockup"><span className="brand-dot">H</span><strong>HelloTalk eSIM Console</strong></div><div><button onClick={() => { setMode('app'); go('store', { replace: true }); }}><Smartphone />打开用户端</button><button className={review ? 'review-active' : ''} onClick={() => setReview((item) => !item)}><BookOpenCheck />Review</button></div></header>
    <div className="admin-body"><nav className="admin-nav">{tabs.map(([id, label, Icon]) => <button key={id} className={current === id ? 'active' : ''} onClick={() => go(`admin-${id}`, { replace: true })}><Icon /><span>{label}</span></button>)}</nav>
      <section className="admin-content">
        {current === 'overview' && <AdminOverview data={data} go={go} review={review} onRule={onRule} />}
        {current === 'destinations' && <AdminDestinations data={data} updateData={updateData} flash={flash} review={review} onRule={onRule} />}
        {current === 'catalog' && <AdminCatalog data={data} updateData={updateData} flash={flash} review={review} onRule={onRule} />}
        {current === 'orders' && <AdminOrders data={data} updateData={updateData} flash={flash} review={review} onRule={onRule} />}
        {current === 'review' && <AdminReview review={review} onRule={onRule} />}
      </section>
    </div>
  </div>;
}

function AdminTitle({ title, subtitle, rule, review, onRule, action }) {
  return <div className="admin-title"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}<RuleMarker id={rule} review={review} onClick={() => onRule(rule)} /></div>;
}

function AdminOverview({ data, go, review, onRule }) {
  const counts = [
    ['上架目的地', data.destinations.filter((item) => item.enabled).length, Store],
    ['有效 SKU', data.skus.filter((item) => item.enabled).length, Package],
    ['已付款订单', data.orders.filter((item) => item.status === 'paid').length, ReceiptText],
    ['待处理 eSIM', data.esims.filter((item) => item.status !== 'active' && item.status !== 'expired').length, Wifi],
  ];
  return <><AdminTitle title="运营概览" subtitle="管理前台目录、套餐和订单状态。配置仅保存在当前浏览器。" rule="FR-A06" review={review} onRule={onRule} />
    <div className="metric-grid">{counts.map(([label, value, Icon]) => <div className="metric-card" key={label}><Icon /><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="admin-two-col"><section className="admin-panel"><h2>当前业务规则</h2><ul><li>每个目的地绑定独立 Catalog，不共用日本套餐。</li><li>激活策略与 Top up 均在 SKU 级设置。</li><li>Stripe 演示付款成功才创建待安装 eSIM。</li><li>取消或失败的付款不创建 eSIM。</li></ul></section><section className="admin-panel"><h2>快速入口</h2><div className="quick-actions"><button onClick={() => go('admin-catalog')}>配置 SKU</button><button onClick={() => go('admin-orders')}>测试生命周期</button></div></section></div>
  </>;
}

function AdminDestinations({ data, updateData, flash, review, onRule }) {
  function mutateDestination(id, field, value) { updateData((current) => ({ ...current, destinations: current.destinations.map((item) => item.id === id ? { ...item, [field]: value } : item) })); }
  function toggleHomeCard(id) {
    updateData((current) => ({ ...current, settings: { ...current.settings, homeCards: current.settings.homeCards.map((card) => card.id === id ? { ...card, enabled: !card.enabled } : card) } }));
  }
  return <><AdminTitle title="商店与目的地" subtitle="控制商店分类中的可售目的地与绑定目录。" rule="FR-A06" review={review} onRule={onRule} action={<button className="save-button" onClick={() => flash('目的地配置已保存，用户端目录已同步')}>保存</button>} />
    <section className="admin-panel table-panel"><table><thead><tr><th>目的地</th><th>类型</th><th>绑定 Catalog</th><th>最低价格</th><th>上架</th></tr></thead><tbody>{data.destinations.map((item) => {
      const catalog = getCatalog(data, item.catalogId);
      const minPrice = minCatalogPrice(data, item.catalogId);
      return <tr key={item.id}><td><span className="flag-cell">{item.flag}</span><input value={item.name} onChange={(event) => mutateDestination(item.id, 'name', event.target.value)} /></td><td><select value={item.type} onChange={(event) => mutateDestination(item.id, 'type', event.target.value)}><option value="local">本地</option><option value="regional">区域</option><option value="global">全球</option></select></td><td>{catalog.name}</td><td>{minPrice === null ? '无可售 SKU' : money(minPrice)}</td><td><button className={`mini-switch ${item.enabled ? 'on' : ''}`} onClick={() => mutateDestination(item.id, 'enabled', !item.enabled)}><i /></button></td></tr>;
    })}</tbody></table></section>
    <section className="admin-panel table-panel"><h2>首页教育卡</h2><table><thead><tr><th>卡片主题</th><th>跳转位置</th><th>当前显示</th></tr></thead><tbody>{data.settings.homeCards.map((card) => <tr key={card.id}><td><strong>{card.title}</strong><small>{card.copy}</small></td><td>{card.action === 'store-unlimited' ? '商店 · 热门' : '商店 · 区域'}</td><td><button className={`mini-switch ${card.enabled ? 'on' : ''}`} onClick={() => toggleHomeCard(card.id)}><i /></button></td></tr>)}</tbody></table></section>
  </>;
}

function AdminCatalog({ data, updateData, flash, review, onRule }) {
  const [catalogId, setCatalogId] = useState(data.catalogs[0].id);
  const catalog = getCatalog(data, catalogId);
  const skus = data.skus.filter((item) => item.catalogId === catalogId);
  function updateCatalog(field, value) { updateData((current) => ({ ...current, catalogs: current.catalogs.map((item) => item.id === catalogId ? { ...item, [field]: value } : item) })); }
  function updateSku(id, field, value) { updateData((current) => ({ ...current, skus: current.skus.map((item) => item.id === id ? { ...item, [field]: value } : item) })); }
  return <><AdminTitle title="目录与 SKU" subtitle="SKU 独立定义数据量、有效期、价格、激活策略和 Top up。" rule="FR-A07" review={review} onRule={onRule} action={<button className="save-button" onClick={() => flash('SKU 配置已保存，前台详情与结算已同步')}>保存</button>} />
    <section className="admin-panel catalog-editor"><label>选择目录<select value={catalogId} onChange={(event) => setCatalogId(event.target.value)}>{data.catalogs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="field-grid"><label>覆盖范围<input value={catalog.coverage} onChange={(event) => updateCatalog('coverage', event.target.value)} /></label><label>网络<input value={catalog.network} onChange={(event) => updateCatalog('network', event.target.value)} /></label><label>运营商<input value={catalog.operator} onChange={(event) => updateCatalog('operator', event.target.value)} /></label></div></section>
    <section className="admin-panel table-panel"><table><thead><tr><th>流量</th><th>有效期</th><th>价格</th><th>不限流量</th><th>起算策略</th><th>Top up</th><th>上架</th></tr></thead><tbody>{skus.map((sku) => <tr key={sku.id}><td><input value={sku.data} onChange={(event) => updateSku(sku.id, 'data', event.target.value)} /></td><td><input type="number" value={sku.validityDays} onChange={(event) => updateSku(sku.id, 'validityDays', Number(event.target.value))} /></td><td><input type="number" step="0.5" value={sku.price} onChange={(event) => updateSku(sku.id, 'price', Number(event.target.value))} /></td><td><input type="checkbox" checked={sku.unlimited} onChange={(event) => updateSku(sku.id, 'unlimited', event.target.checked)} /></td><td><select value={sku.activationPolicy} onChange={(event) => updateSku(sku.id, 'activationPolicy', event.target.value)}><option value="on_network_connect">首次连接网络</option><option value="on_install">安装后</option></select></td><td><input type="checkbox" checked={sku.topUpEnabled} onChange={(event) => updateSku(sku.id, 'topUpEnabled', event.target.checked)} /></td><td><button className={`mini-switch ${sku.enabled ? 'on' : ''}`} onClick={() => updateSku(sku.id, 'enabled', !sku.enabled)}><i /></button></td></tr>)}</tbody></table></section></>;
}

function AdminOrders({ data, updateData, flash, review, onRule }) {
  const enabledSkus = data.skus.filter((item) => item.enabled);
  const [skuId, setSkuId] = useState(enabledSkus[0]?.id || '');
  function createOrder(status) {
    const sku = getSku(data, skuId);
    if (!sku) return flash('请先在目录与 SKU 中至少上架一个套餐');
    const now = new Date().toISOString();
    updateData((current) => {
      const next = structuredClone(current);
      const orderId = `test-${Date.now()}`;
      next.orders.unshift({ id: orderId, skuId, status, amount: sku.price, paymentProvider: 'stripe_demo', createdAt: now });
      if (status === 'paid') next.esims.unshift({ id: `test-esim-${Date.now()}`, orderId, currentSkuId: sku.id, status: 'pending_install', installMethod: null, remainingData: sku.unlimited ? null : sku.data, startedAt: null, expiresAt: null });
      return next;
    });
    flash(status === 'paid' ? '已创建成功订单和待安装 eSIM' : `已创建${status === 'failed' ? '失败' : '已取消'}订单`);
  }
  function advance(esim, nextStatus) {
    const allowed = validTransitions(esim);
    if (!allowed.includes(nextStatus)) return flash('该状态跃迁不合法');
    const sku = currentEsimSku(data, esim);
    if (nextStatus === 'low_data' && sku.unlimited) return flash('不限流量套餐不提供流量不足状态');
    updateData((current) => {
      const next = structuredClone(current);
      const target = next.esims.find((item) => item.id === esim.id);
      target.status = nextStatus;
      const targetSku = currentEsimSku(next, target);
      if (nextStatus === 'active' && !target.startedAt) {
        const now = new Date();
        target.startedAt = now.toISOString();
        target.expiresAt = new Date(now.getTime() + targetSku.validityDays * 86400000).toISOString();
      }
      if (nextStatus === 'low_data') {
        target.remainingData = lowDataAmount(targetSku);
      }
      return next;
    });
    flash(`已推进至 ${statusLabel(nextStatus)}`);
  }
  return <><AdminTitle title="订单测试与 eSIM 生命周期" subtitle="仅按合法状态机推进。失败和取消订单不生成 eSIM。" rule="FR-A08" review={review} onRule={onRule} />
    <section className="admin-panel create-order"><select value={skuId} onChange={(event) => setSkuId(event.target.value)} disabled={!enabledSkus.length}>{enabledSkus.length ? enabledSkus.map((sku) => <option key={sku.id} value={sku.id}>{getCatalog(data, sku.catalogId).name} · {skuLabel(sku)}</option>) : <option>暂无可售套餐</option>}</select><button onClick={() => createOrder('paid')} disabled={!enabledSkus.length}>创建成功订单</button><button onClick={() => createOrder('failed')} disabled={!enabledSkus.length}>模拟支付失败</button><button onClick={() => createOrder('cancelled')} disabled={!enabledSkus.length}>模拟取消订单</button></section>
    <section className="admin-panel table-panel"><table><thead><tr><th>订单</th><th>套餐</th><th>关联 eSIM</th><th>可执行操作</th></tr></thead><tbody>{data.orders.map((order) => { const sku = getSku(data, order.skuId); const linkedEsim = linkedEsimForOrder(data, order); const activeSku = linkedEsim && currentEsimSku(data, linkedEsim); const isTopUp = order.kind === 'topup'; return <tr key={order.id}><td><strong>{order.id.slice(-8)}</strong><small>{isTopUp ? '加购订单 · ' : ''}{order.status}</small></td><td>{getCatalog(data, sku.catalogId).name} · {skuLabel(sku)}</td><td>{linkedEsim ? <><strong>{statusLabel(linkedEsim.status)}</strong><small>{isTopUp ? `关联 eSIM · ${linkedEsim.id.slice(-8)}` : linkedEsim.id.slice(-8)}</small></> : '无 eSIM'}</td><td>{linkedEsim && !isTopUp ? <div className="row-actions">{validTransitions(linkedEsim).map((status) => <button key={status} onClick={() => advance(linkedEsim, status)}>推进至{statusLabel(status)}</button>)}{linkedEsim.status === 'low_data' && activeSku?.topUpEnabled && <button onClick={() => advance(linkedEsim, 'expired')}>模拟过期</button>}</div> : isTopUp ? '通过关联 eSIM 查看生命周期' : '—'}</td></tr>; })}</tbody></table></section></>;
}

function AdminReview({ review, onRule }) {
  return <><AdminTitle title="Review 追踪" subtitle="开启左侧 Linfan Review 后，可从规则卡定位页面，也可从页面编号回到规则。" rule="FR-A09" review={review} onRule={onRule} /><section className="admin-panel review-explainer"><BookOpenCheck /><div><h2>{review ? 'Review 已开启' : 'Review 当前关闭'}</h2><p>普通模式不会渲染规则面板、页面编号或连接线。开启后，前后台规则可双向定位。</p><div className="review-grid">{Object.entries(RULES).map(([id, rule]) => <button key={id} onClick={() => onRule(id)}><span>{id}</span>{rule.title}</button>)}</div></div></section></>;
}

createRoot(document.getElementById('root')).render(<AppShell />);
