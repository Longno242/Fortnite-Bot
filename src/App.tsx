import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import {
  BadgeDollarSign,
  Boxes,
  Compass,
  FileCode2,
  Gamepad2,
  Home,
  Image as ImageIcon,
  KeyRound,
  Map,
  Newspaper,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Trophy,
} from 'lucide-react'

type LoadState<T> = { loading: boolean; error: string | null; data: T | null }
type JsonRecord = Record<string, unknown>

const api = axios.create({
  baseURL: 'https://fortnite-api.com',
  headers: { Authorization: import.meta.env.VITE_FORTNITE_API_KEY ?? '' },
})

const statLabels = [
  ['score', 'Score'],
  ['scorePerMatch', 'Score / Match'],
  ['wins', 'Wins'],
  ['kills', 'Kills'],
  ['kd', 'K/D'],
  ['winRate', 'Win Rate'],
  ['matches', 'Matches'],
  ['minutesPlayed', 'Minutes Played'],
] as const

const navItems = [
  { to: '/overview', label: 'Overview', icon: <Home size={15} /> },
  { to: '/stats', label: 'Player Stats', icon: <Trophy size={15} /> },
  { to: '/creator', label: 'Creator Code', icon: <BadgeDollarSign size={15} /> },
  { to: '/banners', label: 'Banners', icon: <ImageIcon size={15} /> },
  { to: '/cosmetics', label: 'Cosmetics', icon: <Boxes size={15} /> },
  { to: '/shop', label: 'Custom Shop', icon: <ShoppingBag size={15} /> },
  { to: '/news', label: 'News', icon: <Newspaper size={15} /> },
  { to: '/map-playlists', label: 'Map + Playlists', icon: <Map size={15} /> },
  { to: '/coverage', label: 'Coverage', icon: <FileCode2 size={15} /> },
]

function App() {
  const keyMissing = !import.meta.env.VITE_FORTNITE_API_KEY

  return (
    <main className="app-shell with-sidebar">
      <aside className="left-nav">
        <h3>
          <Compass size={15} /> Categories
        </h3>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        {keyMissing ? (
          <section className="warning">
            <KeyRound size={16} />
            Missing `VITE_FORTNITE_API_KEY` in `.env.local`
          </section>
        ) : null}

        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/creator" element={<CreatorPage />} />
          <Route path="/banners" element={<BannersPage />} />
          <Route path="/cosmetics" element={<CosmeticsPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/map-playlists" element={<MapPlaylistsPage />} />
          <Route path="/coverage" element={<CoveragePage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </div>
    </main>
  )
}

function OverviewPage() {
  const aes = useApiData(() => api.get('/v2/aes'))
  const status = useApiData(() => api.get('/v2/status'))
  const shop = useApiData(() => api.get('/v2/shop'))

  return (
    <Page title="Fortnite API Website Dashboard" subtitle="Route-based pages with dedicated views for each category.">
      <button className="btn-primary" onClick={() => { void aes.reload(); void status.reload(); void shop.reload() }}>
        <Sparkles size={16} /> Refresh Overview
      </button>

      <section className="grid three">
        <StatCard title="AES Dynamic Keys" value={String(getLength(getValue(aes.data, ['data', 'dynamicKeys'])))} />
        <StatCard title="API Status" value={asText(getValue(status.data, ['status'])) || 'Unknown'} />
        <StatCard title="Shop Entries Today" value={String(getLength(getValue(shop.data, ['data', 'entries'])))} />
      </section>
    </Page>
  )
}

function StatsPage() {
  const [playerName, setPlayerName] = useState('Ninja')
  const stats = useApiData(() => api.get('/v2/stats/br/v2', { params: { name: playerName } }), false)

  const statModes = useMemo(() => {
    const allStats = getValue(stats.data, ['data', 'stats', 'all'])
    if (!isRecord(allStats)) return []
    const order = ['overall', 'solo', 'duo', 'trio', 'squad', 'ltm']
    return Object.entries(allStats)
      .filter(([, value]) => isRecord(value))
      .sort(([a], [b]) => indexOfOrEnd(order, a) - indexOfOrEnd(order, b))
      .map(([mode, value]) => ({ mode, stats: value as JsonRecord }))
  }, [stats.data])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void stats.reload()
  }

  return (
    <Page title="Player Stats (Per Game Mode)">
      <form className="inline-form" onSubmit={onSubmit}>
        <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Exact Epic display name" />
        <button type="submit"><Search size={14} /> Search</button>
      </form>
      <LoadInfo state={stats} />
      <div className="mode-grid">
        {statModes.map((mode) => (
          <article key={mode.mode} className="mode-card">
            <h4>{formatMode(mode.mode)}</h4>
            <div className="stat-grid">
              {statLabels.map(([key, label]) => (
                <div className="metric" key={key}>
                  <span>{label}</span>
                  <strong>{String(getValue(mode.stats, [key]) ?? '-')}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Page>
  )
}

function CreatorPage() {
  const [code, setCode] = useState('ninja')
  const creator = useApiData(() => api.get('/v2/creatorcode/search', { params: { name: code } }), false)

  return (
    <Page title="Creator Code Lookup">
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); void creator.reload() }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Creator code" />
        <button type="submit"><Search size={14} /> Check</button>
      </form>
      <LoadInfo state={creator} />
      {creator.data ? (
        <section className="card">
          <p><strong>Owner:</strong> {String(getValue(creator.data, ['data', 'account', 'name']) ?? 'Unknown')}</p>
          <p><strong>Code:</strong> {String(getValue(creator.data, ['data', 'code']) ?? 'Unknown')}</p>
          <p><strong>Status:</strong> {String(getValue(creator.data, ['data', 'status']) ?? 'Unknown')}</p>
        </section>
      ) : null}
    </Page>
  )
}

function BannersPage() {
  const banners = useApiData(() => api.get('/v1/banners'))
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(120)

  const items = useMemo(() => {
    const raw = getValue(banners.data, ['data'])
    if (!Array.isArray(raw)) return []
    const filtered = raw.filter((item) =>
      `${asText(getValue(item, ['devName']))} ${asText(getValue(item, ['id']))}`.toLowerCase().includes(query.toLowerCase()),
    )
    return filtered.map((item) => ({
      name: asText(getValue(item, ['devName'])) || asText(getValue(item, ['id'])) || 'Banner',
      image: asText(getValue(item, ['images', 'icon'])) || asText(getValue(item, ['images', 'smallIcon'])) || '',
    }))
  }, [banners.data, query])

  return (
    <Page title="Banners (Search + All Results)">
      <div className="toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search banners..." />
        <button onClick={() => void banners.reload()}>Refresh</button>
      </div>
      <LoadInfo state={banners} />
      <p className="muted">Showing {Math.min(limit, items.length)} of {items.length}</p>
      <div className="media-row">
        {items.slice(0, limit).map((item) => (
          <article className="media-card" key={`${item.name}-${item.image}`}>
            <img src={item.image} alt={item.name} />
            <div className="media-meta"><strong>{item.name}</strong></div>
          </article>
        ))}
      </div>
      {limit < items.length ? <button className="btn-primary" onClick={() => setLimit((v) => v + 120)}>Load More</button> : null}
    </Page>
  )
}

function CosmeticsPage() {
  const cosmetics = useApiData(() => api.get('/v2/cosmetics/br'))
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(120)

  const items = useMemo(() => {
    const raw = getValue(cosmetics.data, ['data'])
    if (!Array.isArray(raw)) return []
    return raw
      .map((item) => ({
        name: asText(getValue(item, ['name'])) || 'Cosmetic',
        type: asText(getValue(item, ['type', 'displayValue'])) || 'Unknown',
        rarity: asText(getValue(item, ['rarity', 'displayValue'])) || 'Unknown',
        image: asText(getValue(item, ['images', 'featured'])) || asText(getValue(item, ['images', 'icon'])) || '',
      }))
      .filter((item) => `${item.name} ${item.type} ${item.rarity}`.toLowerCase().includes(query.toLowerCase()))
  }, [cosmetics.data, query])

  return (
    <Page title="Cosmetics Catalog (Search + Full List)">
      <div className="toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cosmetics, type, rarity..." />
        <button onClick={() => void cosmetics.reload()}>Refresh</button>
      </div>
      <LoadInfo state={cosmetics} />
      <p className="muted">Showing {Math.min(limit, items.length)} of {items.length}</p>
      <div className="media-row">
        {items.slice(0, limit).map((item) => (
          <article className="media-card" key={`${item.name}-${item.image}`}>
            <img src={item.image} alt={item.name} />
            <div className="media-meta">
              <strong>{item.name}</strong>
              <span>{item.type} • {item.rarity}</span>
            </div>
          </article>
        ))}
      </div>
      {limit < items.length ? <button className="btn-primary" onClick={() => setLimit((v) => v + 120)}>Load More</button> : null}
    </Page>
  )
}

function ShopPage() {
  const shop = useApiData(() => api.get('/v2/shop'))
  const [query, setQuery] = useState('')

  const items = useMemo(() => {
    const raw = getValue(shop.data, ['data', 'entries'])
    if (!Array.isArray(raw)) return []
    return raw
      .map((entry) => ({
        name: asText(getValue(entry, ['bundle', 'name'])) || asText(getValue(entry, ['offerTag', 'text'])) || 'Shop item',
        price: asText(getValue(entry, ['finalPrice'])) || asText(getValue(entry, ['regularPrice'])) || 'N/A',
        image:
          asText(getValue(entry, ['newDisplayAsset', 'renderImages', '0', 'image'])) ||
          asText(getValue(entry, ['brItems', '0', 'images', 'featured'])) ||
          asText(getValue(entry, ['brItems', '0', 'images', 'icon'])) ||
          '',
      }))
      .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
  }, [shop.data, query])

  return (
    <Page title="Custom Item Shop UI">
      <div className="shop-hero">
        <h3><ShoppingBag size={16} /> Daily Shop</h3>
        <div className="toolbar">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shop items..." />
          <button onClick={() => void shop.reload()}>Refresh Shop</button>
        </div>
      </div>
      <LoadInfo state={shop} />
      <p className="muted">Shop items found: {items.length}</p>
      <div className="shop-grid">
        {items.map((item) => (
          <article className="shop-card" key={`${item.name}-${item.image}`}>
            <img src={item.image} alt={item.name} />
            <div className="shop-meta">
              <strong>{item.name}</strong>
              <span>{item.price} V-Bucks</span>
            </div>
          </article>
        ))}
      </div>
    </Page>
  )
}

function NewsPage() {
  const news = useApiData(() => api.get('/v2/news'))
  const items = useMemo(() => {
    const motds = getValue(news.data, ['data', 'br', 'motds'])
    const raw = Array.isArray(motds) ? motds : []
    return raw.map((item) => ({
      title: asText(getValue(item, ['title'])) || 'Update',
      body: asText(getValue(item, ['body'])) || '',
      image: asText(getValue(item, ['image'])) || asText(getValue(item, ['tileImage'])) || '',
    }))
  }, [news.data])

  return (
    <Page title="News">
      <LoadInfo state={news} />
      <div className="media-row">
        {items.map((item) => (
          <article className="media-card" key={`${item.title}-${item.image}`}>
            <img src={item.image} alt={item.title} />
            <div className="media-meta">
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </Page>
  )
}

function MapPlaylistsPage() {
  const map = useApiData(() => api.get('/v1/map'))
  const playlists = useApiData(() => api.get('/v1/playlists'))
  const playlistItems = useMemo(() => {
    const raw = getValue(playlists.data, ['data'])
    return Array.isArray(raw) ? raw.slice(0, 100) : []
  }, [playlists.data])
  const mapImage = asText(getValue(map.data, ['data', 'images', 'pois'])) || asText(getValue(map.data, ['data', 'images', 'blank']))

  return (
    <Page title="Map + Playlists">
      <section className="grid two">
        <section className="card">
          <h3><Map size={16} /> Current Map</h3>
          <LoadInfo state={map} />
          {mapImage ? <img className="map-thumb" src={mapImage} alt="Map" /> : null}
        </section>
        <section className="card">
          <h3><Gamepad2 size={16} /> Playlists</h3>
          <LoadInfo state={playlists} />
          <div className="simple-list">
            {playlistItems.map((item) => (
              <p key={asText(getValue(item, ['id']))}>{asText(getValue(item, ['name'])) || 'Playlist'}</p>
            ))}
          </div>
        </section>
      </section>
    </Page>
  )
}

function CoveragePage() {
  const endpoints = [
    '/v2/stats/br/v2',
    '/v2/creatorcode/search',
    '/v1/banners',
    '/v2/cosmetics/br',
    '/v2/shop',
    '/v2/news',
    '/v1/map',
    '/v1/playlists',
    '/v2/aes',
    '/v2/status',
  ]
  return (
    <Page title="Endpoint Coverage">
      <section className="card">
        {endpoints.map((ep) => (
          <p key={ep}><Shield size={14} /> {ep}</p>
        ))}
      </section>
    </Page>
  )
}

function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section>
      <header className="hero pro-hero">
        <div className="hero-left">
          <h1>{title}</h1>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
      </header>
      {children}
    </section>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <p className="stat-value">{value}</p>
    </section>
  )
}

function LoadInfo({ state }: { state: LoadState<unknown> }) {
  if (state.loading) return <p className="muted">Loading...</p>
  if (state.error) return <p className="error">{state.error}</p>
  return null
}

function useApiData<T>(loader: () => Promise<{ data: T }>, auto = true) {
  const [state, setState] = useState<LoadState<T>>({ loading: auto, error: null, data: null })
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  const reload = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await loader()
      setState({ loading: false, error: null, data: response.data })
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error || error.message : 'Unknown error'
      setState({ loading: false, error: message, data: null })
    }
  }

  useEffect(() => {
    if (auto) {
      let active = true
      const run = async () => {
        try {
          const response = await loaderRef.current()
          if (active) {
            setState({ loading: false, error: null, data: response.data })
          }
        } catch (error) {
          const message = axios.isAxiosError(error) ? error.response?.data?.error || error.message : 'Unknown error'
          if (active) {
            setState({ loading: false, error: message, data: null })
          }
        }
      }
      void run()
      return () => {
        active = false
      }
    }
    return undefined
  }, [auto])

  return { ...state, reload }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function getValue(source: unknown, path: string[]): unknown {
  let current: unknown = source
  for (const key of path) {
    if (!isRecord(current)) return null
    current = current[key]
  }
  return current
}

function getLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function formatMode(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : 'Unknown'
}

function indexOfOrEnd(list: string[], item: string): number {
  const index = list.indexOf(item)
  return index === -1 ? list.length : index
}

export default App
