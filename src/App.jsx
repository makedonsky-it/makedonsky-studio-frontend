import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react'
import { apiRequest } from './api'
import './App.css'

const getDefaultApiBaseUrl = () => {
  return '/api/v1'
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? getDefaultApiBaseUrl()
const ACCESS_TOKEN_KEY = 'makedonsky_access_token'
const GUEST_CART_KEY = 'makedonsky_guest_cart'

const getAssetBaseUrl = () => {
  try {
    const fallbackOrigin =
      typeof window === 'undefined' ? 'http://localhost:8080' : window.location.origin
    const apiUrl = new URL(API_BASE_URL, fallbackOrigin)
    apiUrl.pathname = apiUrl.pathname.replace(/\/api(?:\/v\d+)?\/?$/, '/')
    apiUrl.search = ''
    apiUrl.hash = ''
    return apiUrl.toString()
  } catch {
    return ''
  }
}

const ASSET_BASE_URL = getAssetBaseUrl()

const categoryLabels = {
  Paintings: 'Картины',
  Prints: 'Картины',
  Busts: 'Бюсты',
  Sculptures: 'Скульптуры',
  Apparel: 'Одежда',
  Accessories: 'Аксессуары',
}

const fallbackCategoryNames = ['Paintings', 'Busts', 'Sculptures']

const fallbackProducts = [
  {
    id: 'ms-005',
    title: 'Торс Аполлона Бельведерского',
    artist: 'После античного оригинала',
    category: 'Sculptures',
    price: 172000,
    stock: 1,
    image: '/real.jpg',
    description: 'Выразительная интерьерная скульптура с музейным силуэтом и плотной пластикой.',
    period: 'Римская традиция',
    medium: 'Гипс',
    createdBy: 'fallback',
  },
  {
    id: 'ms-006',
    title: 'Этюд античной головы',
    artist: 'Академическая школа',
    category: 'Sculptures',
    price: 94000,
    stock: 3,
    image: '/real.jpg',
    description: 'Компактная учебная скульптура для кабинета, мастерской или домашней библиотеки.',
    period: 'XIX век',
    medium: 'Гипс',
    createdBy: 'fallback',
  },
  {
    id: 'ms-007',
    title: 'Рельеф с античным профилем',
    artist: 'Современная мастерская',
    category: 'Sculptures',
    price: 88000,
    stock: 4,
    image: '/real.jpg',
    description: 'Настенный рельеф с собранной геометрией формы и мягкой светотенью.',
    period: 'XXI век',
    medium: 'Каменный композит',
    createdBy: 'fallback',
  },
  {
    id: 'ms-008',
    title: 'Учебная репродукция "Император"',
    artist: 'По мотивам Жака-Луи Давида',
    category: 'Paintings',
    price: 76000,
    stock: 5,
    image: '/art/bonaparte-crossing-the-alps.jpg',
    description: 'Декоративная репродукция с торжественным историческим жестом и насыщенным цветом.',
    period: 'XIX век',
    medium: 'Печать на холсте',
    createdBy: 'fallback',
  },
  {
    id: 'ms-009',
    title: 'Философский кабинет',
    artist: 'Римская копия',
    category: 'Busts',
    price: 132000,
    stock: 2,
    image: '/art/epicurus-bust.jpg',
    description: 'Камерный бюст для пространства, где нужен спокойный античный акцент.',
    period: 'По греческому оригиналу',
    medium: 'Мрамор',
    createdBy: 'fallback',
  },
  {
    id: 'ms-010',
    title: 'Афинская голова',
    artist: 'После греческого оригинала',
    category: 'Busts',
    price: 138000,
    stock: 1,
    image: '/art/athena-bust.jpg',
    description: 'Строгий музейный образ с ясным профилем и светлой каменной фактурой.',
    period: 'Римская копия',
    medium: 'Мрамор',
    createdBy: 'fallback',
  },
  {
    id: 'ms-001',
    title: 'Бонапарт на перевале Сен-Бернар',
    artist: 'Жак-Луи Давид',
    category: 'Paintings',
    price: 128000,
    stock: 1,
    image: '/art/bonaparte-crossing-the-alps.jpg',
    description: 'Большая репродукция в музейной подаче для кабинета, студии или библиотеки.',
    period: '1801',
    medium: 'Печать на холсте',
    createdBy: 'fallback',
  },
  {
    id: 'ms-002',
    title: 'Что есть истина? Христос и Пилат',
    artist: 'Николай Ге',
    category: 'Paintings',
    price: 118000,
    stock: 1,
    image: '/art/what-is-truth.jpg',
    description: 'Крупноформатная работа с драматичным светом и классической атмосферой.',
    period: '1890',
    medium: 'Печать на холсте',
    createdBy: 'fallback',
  },
  {
    id: 'ms-003',
    title: 'Бюст Афины Веллетрийской',
    artist: 'После греческого оригинала',
    category: 'Busts',
    price: 164000,
    stock: 2,
    image: '/art/athena-bust.jpg',
    description: 'Светлый мраморный бюст для интерьера с античным характером.',
    period: 'Римская копия, II век',
    medium: 'Мрамор',
    createdBy: 'fallback',
  },
  {
    id: 'ms-004',
    title: 'Бюст Эпикура',
    artist: 'Римская копия',
    category: 'Busts',
    price: 146000,
    stock: 2,
    image: '/art/epicurus-bust.jpg',
    description: 'Классический философский бюст с выразительным силуэтом и спокойным ритмом.',
    period: 'Копия греческого оригинала',
    medium: 'Мрамор',
    createdBy: 'fallback',
  },
]

const parseProductDescription = (value) => {
  const rawDescription = typeof value === 'string' ? value.trim() : ''

  if (!rawDescription) {
    return {
      description: '',
      artist: '',
      period: '',
      medium: '',
    }
  }

  const segments = rawDescription
    .split(/\n{2,}|\n/g)
    .map((segment) => segment.trim())
    .filter(Boolean)

  const details = {
    description: [],
    artist: '',
    period: '',
    medium: '',
  }

  for (const segment of segments) {
    if (segment.startsWith('Автор:')) {
      details.artist = segment.slice('Автор:'.length).trim()
      continue
    }

    if (segment.startsWith('Период:')) {
      details.period = segment.slice('Период:'.length).trim()
      continue
    }

    if (segment.startsWith('Материал:')) {
      details.medium = segment.slice('Материал:'.length).trim()
      continue
    }

    details.description.push(segment)
  }

  return {
    description: details.description.join('\n\n') || rawDescription,
    artist: details.artist,
    period: details.period,
    medium: details.medium,
  }
}

const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
}

const emptyProductForm = {
  title: '',
  artist: '',
  category: 'Paintings',
  price: '',
  stock: '',
  description: '',
  period: '',
  medium: '',
}

const emptyCheckoutForm = {
  deliveryMethod: 'courier',
  recipientName: '',
  phone: '',
  city: '',
  address: '',
  postalCode: '',
  comment: '',
}

const roleLabels = {
  guest: 'Гость',
  customer: 'Покупатель',
  admin: 'Администратор',
}

const sortLabels = {
  newest: 'Сначала новые',
  price_asc: 'Цена по возрастанию',
  price_desc: 'Цена по убыванию',
  title_asc: 'По названию',
}

const formatPrice = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)

const normalizeCategory = (value) => {
  if (!value) {
    return 'Paintings'
  }

  return String(value)
}

const getCategoryLabel = (value) => categoryLabels[value] ?? value

const resolveAssetUrl = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return ''
  }

  if (
    normalizedValue.startsWith('http://') ||
    normalizedValue.startsWith('https://') ||
    normalizedValue.startsWith('data:') ||
    normalizedValue.startsWith('blob:')
  ) {
    return normalizedValue
  }

  if (normalizedValue.startsWith('/art/') || normalizedValue.startsWith('/real.jpg')) {
    return normalizedValue
  }

  if (!ASSET_BASE_URL) {
    return normalizedValue
  }

  return new URL(normalizedValue, ASSET_BASE_URL).toString()
}

const normalizeUser = (user) => ({
  id: user.id,
  name: user.name ?? user.username ?? 'Без имени',
  email: user.email ?? '',
  role: user.role ?? 'customer',
})

const mapApiProduct = (product) => {
  const parsedDescription = parseProductDescription(product.description)

  return {
    id: product.id ?? product.slug ?? `item-${crypto.randomUUID?.() ?? Math.random()}`,
    title: product.title ?? product.name ?? 'Без названия',
    artist: product.artist ?? product.author ?? parsedDescription.artist ?? 'Не указан',
    category: normalizeCategory(product.category),
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? 0),
    image:
      resolveAssetUrl(
        product.coverImageUrl ??
          product.gallery?.[0] ??
          product.imageUrl ??
          product.image ??
          product.previewUrl ??
          '',
      ),
    description: parsedDescription.description,
    period: product.period ?? product.year ?? parsedDescription.period ?? '',
    medium: product.medium ?? product.material ?? parsedDescription.medium ?? '',
    createdBy: product.createdBy ?? 'api',
  }
}

const mapCartItem = (item) => {
  const product = item.product ?? {}

  return {
    productId: item.productId ?? product.id ?? item.id,
    quantity: Number(item.quantity ?? 0),
    price: Number(item.price ?? product.price ?? 0),
    title: item.title ?? product.title ?? 'Без названия',
    image:
      resolveAssetUrl(
        item.image ?? product.coverImageUrl ?? product.imageUrl ?? product.image ?? '',
      ),
    subtotal:
      Number(
        item.subtotal ??
          Number(item.price ?? product.price ?? 0) * Number(item.quantity ?? 0),
      ) || 0,
  }
}

const getInitialQueryState = () => {
  const params = new URLSearchParams(window.location.search)

  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? 'Все',
    page: Math.max(1, Number(params.get('page') ?? 1)),
    limit: Math.max(1, Number(params.get('limit') ?? 8)),
    sort: params.get('sort') ?? 'newest',
  }
}

const saveQueryState = (queryState) => {
  const params = new URLSearchParams()

  if (queryState.q) {
    params.set('q', queryState.q)
  }

  if (queryState.category !== 'Все') {
    params.set('category', queryState.category)
  }

  if (queryState.page > 1) {
    params.set('page', String(queryState.page))
  }

  if (queryState.limit !== 8) {
    params.set('limit', String(queryState.limit))
  }

  if (queryState.sort !== 'newest') {
    params.set('sort', queryState.sort)
  }

  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
  window.history.replaceState({}, '', nextUrl)
}

const getGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY)
}

const fallbackCatalogResult = (queryState) => {
  const normalizedSearch = queryState.q.trim().toLowerCase()
  let items = [...fallbackProducts]

  if (queryState.category !== 'Все') {
    items = items.filter((product) => product.category === queryState.category)
  }

  if (normalizedSearch) {
    items = items.filter((product) =>
      `${product.title} ${product.artist} ${product.description}`
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }

  if (queryState.sort === 'price_asc') {
    items.sort((left, right) => left.price - right.price)
  } else if (queryState.sort === 'price_desc') {
    items.sort((left, right) => right.price - left.price)
  } else if (queryState.sort === 'title_asc') {
    items.sort((left, right) => left.title.localeCompare(right.title, 'ru'))
  }

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / queryState.limit))
  const safePage = Math.min(queryState.page, totalPages)
  const start = (safePage - 1) * queryState.limit

  return {
    items: items.slice(start, start + queryState.limit),
    meta: {
      page: safePage,
      limit: queryState.limit,
      total,
      totalPages,
    },
  }
}

const buildCatalogParams = (queryState) => {
  const params = new URLSearchParams()
  params.set('page', String(queryState.page))
  params.set('limit', String(queryState.limit))

  if (queryState.q) {
    params.set('q', queryState.q)
  }

  if (queryState.category !== 'Все') {
    params.set('category', queryState.category)
  }

  if (queryState.sort) {
    params.set('sort', queryState.sort)
  }

  return params.toString()
}

const buildErrorState = (error) => ({
  code: error.code ?? 'UNKNOWN_ERROR',
  message: error.message ?? 'Произошла ошибка.',
  status: error.status ?? null,
  details: error.details ?? null,
})

function ErrorMessage({ error }) {
  if (!error) {
    return null
  }

  return (
    <div className="error-box">
      <strong>Не удалось выполнить действие</strong>
      <span>{error.message}</span>
    </div>
  )
}

function App() {
  const [queryState, setQueryState] = useState(getInitialQueryState)
  const [searchInput, setSearchInput] = useState(getInitialQueryState().q)
  const [catalogState, setCatalogState] = useState(() => {
    const fallback = fallbackCatalogResult(getInitialQueryState())

    return {
      items: fallback.items,
      meta: fallback.meta,
      source: 'loading',
      loading: true,
      error: null,
    }
  })
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(ACCESS_TOKEN_KEY) ?? '',
  )
  const [currentUser, setCurrentUser] = useState(null)
  const [authBootstrapped, setAuthBootstrapped] = useState(false)
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [categoryOptions, setCategoryOptions] = useState(fallbackCategoryNames)
  const [cartItems, setCartItems] = useState(getGuestCart)
  const [notice, setNotice] = useState('')
  const [authError, setAuthError] = useState(null)
  const [cartError, setCartError] = useState(null)
  const [checkoutError, setCheckoutError] = useState(null)
  const [adminError, setAdminError] = useState(null)
  const [checkoutResult, setCheckoutResult] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [, startTransition] = useTransition()

  const uploadPreview = useMemo(
    () => (uploadFile ? URL.createObjectURL(uploadFile) : ''),
    [uploadFile],
  )

  useEffect(() => {
    return () => {
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview)
      }
    }
  }, [uploadPreview])

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      return
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }, [accessToken])

  useEffect(() => {
    if (!currentUser) {
      saveGuestCart(cartItems)
    }
  }, [cartItems, currentUser])

  useEffect(() => {
    saveQueryState(queryState)
  }, [queryState])

  useEffect(() => {
    const handlePopState = () => {
      const nextQueryState = getInitialQueryState()
      setQueryState(nextQueryState)
      setSearchInput(nextQueryState.q)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await apiRequest({
        baseUrl: API_BASE_URL,
        path: '/auth/refresh',
        method: 'POST',
        useAuth: false,
        retry: false,
      })

      const nextToken = response.data?.accessToken ?? ''
      setAccessToken(nextToken)
      return nextToken
    } catch {
      setAccessToken('')
      setCurrentUser(null)
      return null
    }
  }, [])

  const requestApi = useCallback(
    (options) =>
      apiRequest({
        baseUrl: API_BASE_URL,
        token: accessToken,
        refreshAccessToken,
        ...options,
      }),
    [accessToken, refreshAccessToken],
  )

  const syncServerCart = useCallback(async () => {
    setCartLoading(true)
    setCartError(null)

    try {
      const response = await requestApi({ path: '/cart' })
      const items = Array.isArray(response.data?.items)
        ? response.data.items.map(mapCartItem)
        : []
      setCartItems(items)
    } catch (error) {
      setCartError(buildErrorState(error))
    } finally {
      setCartLoading(false)
    }
  }, [requestApi])

  const bootstrapSession = useCallback(async () => {
    try {
      let meResponse = null

      if (accessToken) {
        meResponse = await requestApi({ path: '/auth/me' })
      } else {
        const refreshed = await refreshAccessToken()

        if (refreshed) {
          meResponse = await requestApi({ path: '/auth/me' })
        }
      }

      if (meResponse?.data) {
        setCurrentUser(normalizeUser(meResponse.data))
        setAuthError(null)
      }
    } catch (error) {
      setCurrentUser(null)
      setAuthError(buildErrorState(error))
    } finally {
      setAuthBootstrapped(true)
    }
  }, [accessToken, refreshAccessToken, requestApi])

  const loadCatalog = useCallback(async () => {
    setCatalogState((current) => ({
      ...current,
      loading: true,
      error: null,
    }))

    try {
      const response = await requestApi({
        path: `/products?${buildCatalogParams(queryState)}`,
        useAuth: false,
      })

      const rawProducts = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
          ? response.data.items
          : []

      const meta = response.meta ?? {}

      setCatalogState({
        items: rawProducts.map(mapApiProduct),
        meta: {
          page: Number(meta.page ?? queryState.page),
          limit: Number(meta.limit ?? queryState.limit),
          total: Number(meta.total ?? rawProducts.length),
          totalPages: Number(
            meta.totalPages ??
              Math.max(1, Math.ceil(rawProducts.length / Math.max(queryState.limit, 1))),
          ),
        },
        source: 'api',
        loading: false,
        error: null,
      })
    } catch {
      const fallback = fallbackCatalogResult(queryState)
      setCatalogState({
        items: fallback.items,
        meta: fallback.meta,
        source: 'fallback',
        loading: false,
        error: null,
      })
    }
  }, [queryState, requestApi])

  const loadCategories = useCallback(async () => {
    try {
      const response = await requestApi({
        path: '/categories',
        useAuth: false,
      })

      const rawCategories = Array.isArray(response.data) ? response.data : []
      const nextNames = rawCategories
        .map((category) => category?.name)
        .filter((name) => typeof name === 'string' && name.trim().length > 0)

      if (nextNames.length > 0) {
        setCategoryOptions(Array.from(new Set(nextNames)))
      }
    } catch {
      setCategoryOptions(fallbackCategoryNames)
    }
  }, [requestApi])

  useEffect(() => {
    let active = true

    const run = async () => {
      if (!active) {
        return
      }

      await bootstrapSession()
    }

    void run()

    return () => {
      active = false
    }
  }, [bootstrapSession])

  useEffect(() => {
    if (!authBootstrapped || !currentUser) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void syncServerCart()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [authBootstrapped, currentUser, syncServerCart])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCatalog()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadCatalog])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCategories()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadCategories])

  const categories = useMemo(() => ['Все', ...categoryOptions], [categoryOptions])
  const currentProducts = catalogState.items
  const currentPage = catalogState.meta.page ?? queryState.page
  const totalPages = catalogState.meta.totalPages ?? 1
  const selectedProductCategory = categoryOptions.includes(productForm.category)
    ? productForm.category
    : (categoryOptions[0] ?? 'Paintings')

  const cartViewItems = cartItems.map((item) => {
    const product = currentProducts.find((entry) => entry.id === item.productId)

    return {
      ...item,
      title: product?.title ?? item.title,
      price: product?.price ?? item.price,
      image: product?.image ?? item.image,
      subtotal: item.subtotal || (product?.price ?? item.price) * item.quantity,
    }
  })

  const cartCount = cartViewItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartViewItems.reduce((sum, item) => sum + item.subtotal, 0)
  const isAdmin = currentUser?.role === 'admin'

  const updateQueryState = (patch) => {
    setQueryState((current) => ({
      ...current,
      ...patch,
    }))
  }

  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearchInput(value)

    startTransition(() => {
      updateQueryState({
        q: value,
        page: 1,
      })
    })
  }

  const handleCategoryChange = (category) => {
    startTransition(() => {
      updateQueryState({
        category,
        page: 1,
      })
    })
  }

  const handleSortChange = (event) => {
    updateQueryState({
      sort: event.target.value,
      page: 1,
    })
  }

  const handlePageChange = (nextPage) => {
    updateQueryState({
      page: nextPage,
    })
  }

  const setGuestCartItems = (updater) => {
    setCartItems((currentItems) => {
      const nextItems =
        typeof updater === 'function' ? updater(currentItems) : updater
      saveGuestCart(nextItems)
      return nextItems
    })
  }

  const upsertGuestCart = (product) => {
    setGuestCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product.id)

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: product.price * (item.quantity + 1),
              }
            : item,
        )
      }

      return [
        ...currentItems,
        {
          productId: product.id,
          quantity: 1,
          price: product.price,
          title: product.title,
          image: product.image,
          subtotal: product.price,
        },
      ]
    })
  }

  const addToCart = async (product) => {
    setCartError(null)

    if (!currentUser) {
      upsertGuestCart(product)
      setNotice('Работа добавлена в гостевую корзину.')
      return
    }

    setCartLoading(true)

    try {
      const response = await requestApi({
        path: '/cart/items',
        method: 'POST',
        body: {
          productId: product.id,
          quantity: 1,
        },
      })

      const items = Array.isArray(response.data?.items)
        ? response.data.items.map(mapCartItem)
        : []
      setCartItems(items)
      setNotice('Работа добавлена в корзину.')
    } catch (error) {
      setCartError(buildErrorState(error))
    } finally {
      setCartLoading(false)
    }
  }

  const changeCartQuantity = async (productId, delta) => {
    setCartError(null)

    if (!currentUser) {
      setGuestCartItems((currentItems) =>
        currentItems
          .map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: item.quantity + delta,
                  subtotal: item.price * (item.quantity + delta),
                }
              : item,
          )
          .filter((item) => item.quantity > 0),
      )
      setNotice('Корзина обновлена.')
      return
    }

    const currentItem = cartViewItems.find((item) => item.productId === productId)
    const nextQuantity = Math.max(0, (currentItem?.quantity ?? 0) + delta)

    if (nextQuantity === 0) {
      await removeFromCart(productId)
      return
    }

    setCartLoading(true)

    try {
      const response = await requestApi({
        path: `/cart/items/${productId}`,
        method: 'PATCH',
        body: {
          quantity: nextQuantity,
        },
      })

      const items = Array.isArray(response.data?.items)
        ? response.data.items.map(mapCartItem)
        : []
      setCartItems(items)
      setNotice('Корзина обновлена.')
    } catch (error) {
      setCartError(buildErrorState(error))
    } finally {
      setCartLoading(false)
    }
  }

  const removeFromCart = async (productId) => {
    setCartError(null)

    if (!currentUser) {
      setGuestCartItems((currentItems) =>
        currentItems.filter((item) => item.productId !== productId),
      )
      setNotice('Работа удалена из корзины.')
      return
    }

    setCartLoading(true)

    try {
      const response = await requestApi({
        path: `/cart/items/${productId}`,
        method: 'DELETE',
      })

      const items = Array.isArray(response.data?.items)
        ? response.data.items.map(mapCartItem)
        : []
      setCartItems(items)
      setNotice('Работа удалена из корзины.')
    } catch (error) {
      setCartError(buildErrorState(error))
    } finally {
      setCartLoading(false)
    }
  }

  const clearCart = async () => {
    setCartError(null)

    if (!currentUser) {
      setGuestCartItems([])
      setNotice('Корзина очищена.')
      return
    }

    setCartLoading(true)

    try {
      await requestApi({
        path: '/cart',
        method: 'DELETE',
      })

      setCartItems([])
      setNotice('Корзина очищена.')
    } catch (error) {
      setCartError(buildErrorState(error))
    } finally {
      setCartLoading(false)
    }
  }

  const mergeGuestCartAfterAuth = async () => {
    const guestCart = getGuestCart()

    if (guestCart.length === 0) {
      return
    }

    await requestApi({
      path: '/cart/merge',
      method: 'POST',
      body: {
        items: guestCart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    })

    clearGuestCart()
  }

  const handleAuthInput = (event) => {
    const { name, value } = event.target
    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    try {
      const response = await requestApi({
        path: '/auth/register',
        method: 'POST',
        useAuth: false,
        body: {
          name: authForm.name.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
        },
      })

      const nextToken = response.data?.accessToken ?? ''
      const nextUser = response.data?.user ? normalizeUser(response.data.user) : null

      setAccessToken(nextToken)
      setCurrentUser(nextUser)
      setAuthForm(emptyAuthForm)

      if (nextUser) {
        await mergeGuestCartAfterAuth()
        await syncServerCart()
      }

      setNotice('Аккаунт создан.')
    } catch (error) {
      setAuthError(buildErrorState(error))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    try {
      const response = await requestApi({
        path: '/auth/login',
        method: 'POST',
        useAuth: false,
        body: {
          email: authForm.email.trim(),
          password: authForm.password,
        },
      })

      const nextToken = response.data?.accessToken ?? ''
      const nextUser = response.data?.user ? normalizeUser(response.data.user) : null

      setAccessToken(nextToken)
      setCurrentUser(nextUser)
      setAuthForm(emptyAuthForm)

      if (nextUser) {
        await mergeGuestCartAfterAuth()
        await syncServerCart()
      }

      setNotice('Вы вошли в аккаунт.')
    } catch (error) {
      setAuthError(buildErrorState(error))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    setAuthLoading(true)
    setAuthError(null)

    try {
      await requestApi({
        path: '/auth/logout',
        method: 'POST',
      })
    } catch (error) {
      setAuthError(buildErrorState(error))
    } finally {
      setAccessToken('')
      setCurrentUser(null)
      setCartItems(getGuestCart())
      setAuthLoading(false)
      setNotice('Вы вышли из аккаунта.')
    }
  }

  const handleCheckoutInput = (event) => {
    const { name, value } = event.target
    setCheckoutForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleCheckoutSubmit = async (event) => {
    event.preventDefault()
    setCheckoutLoading(true)
    setCheckoutError(null)
    setCheckoutResult(null)

    try {
      const response = await requestApi({
        path: '/checkout',
        method: 'POST',
        body: {
          deliveryMethod: checkoutForm.deliveryMethod,
          comment: checkoutForm.comment.trim(),
          recipient: {
            name: checkoutForm.recipientName.trim(),
            phone: checkoutForm.phone.trim(),
          },
          address: {
            city: checkoutForm.city.trim(),
            line1: checkoutForm.address.trim(),
            postalCode: checkoutForm.postalCode.trim(),
          },
        },
      })

      setCheckoutResult(response.data)
      setCheckoutForm(emptyCheckoutForm)
      await syncServerCart()
      setNotice('Заказ отправлен.')
    } catch (error) {
      setCheckoutError(buildErrorState(error))
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleProductInput = (event) => {
    const { name, value } = event.target
    setProductForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setUploadFile(file)
  }

  const uploadProductImage = async () => {
    if (!uploadFile) {
      return ''
    }

    const formData = new FormData()
    formData.append('file', uploadFile)

    const response = await requestApi({
      path: '/uploads',
      method: 'POST',
      body: formData,
      isFormData: true,
    })

    return response.data?.url ?? ''
  }

  const handleProductSubmit = async (event) => {
    event.preventDefault()
    setAdminLoading(true)
    setAdminError(null)

    try {
      const descriptionParts = [
        productForm.description.trim(),
        productForm.artist.trim() ? `Автор: ${productForm.artist.trim()}` : '',
        productForm.period.trim() ? `Период: ${productForm.period.trim()}` : '',
        productForm.medium.trim() ? `Материал: ${productForm.medium.trim()}` : '',
      ].filter(Boolean)

      const imageUrl = await uploadProductImage()
      await requestApi({
        path: '/products',
        method: 'POST',
        body: {
          title: productForm.title.trim(),
          description: descriptionParts.join('\n\n'),
          category: selectedProductCategory,
          price: Number(productForm.price),
          currency: 'RUB',
          stock: Number(productForm.stock),
          status: 'active',
          coverImageUrl: imageUrl,
          gallery: imageUrl ? [imageUrl] : [],
        },
      })

      setProductForm(emptyProductForm)
      setUploadFile(null)
      setNotice('Работа добавлена в каталог.')
      await (async () => {
        const response = await requestApi({
          path: `/products?${buildCatalogParams(queryState)}`,
          useAuth: false,
        })

        const rawProducts = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.items)
            ? response.data.items
            : []

        setCatalogState((current) => ({
          ...current,
          items: rawProducts.map(mapApiProduct),
          source: 'api',
          error: null,
        }))
      })()
    } catch (error) {
      setAdminError(buildErrorState(error))
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="store-shell">
      <div className="page-glow page-glow-top" />
      <div className="page-glow page-glow-bottom" />

      <header className="topbar">
        <a href="#home" className="brand">
          Makedonsky Studio
        </a>

        <nav className="topnav" aria-label="Навигация магазина">
          <a href="#catalog">Каталог</a>
          <a href="#account">Аккаунт</a>
          <a href="#cart">Корзина</a>
        </nav>

        <a href="#cart" className="cart-badge">
          Корзина
          <span>{cartCount}</span>
        </a>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="overline">Античная коллекция</p>
          <h1>Картины, бюсты и предметы с античным характером.</h1>
          <p className="hero-text">
            Подборка работ для кабинета, библиотеки и спокойного интерьерного
            пространства с классическим настроением.
          </p>

          <div className="hero-actions">
            <a href="#catalog" className="primary-link">
              Открыть каталог
            </a>
            <a href="#account" className="secondary-link">
              Войти
            </a>
          </div>

          <div className="benefit-row">
            <span>Репродукции</span>
            <span>Мраморные бюсты</span>
            <span>Коллекционные акценты</span>
          </div>
        </div>

        <div className="hero-media">
          <img src="/real.jpg" alt="Makedonsky Studio" />
          <div className="hero-note">
            <strong>Makedonsky Studio</strong>
            <span>Кирилл Македонский</span>
          </div>
        </div>
      </section>

      <section className="info-strip">
        <article>
          <span>Категории</span>
          <strong>{categories.length - 1}</strong>
        </article>
        <article>
          <span>Работы</span>
          <strong>{catalogState.meta.total ?? currentProducts.length}</strong>
        </article>
        <article>
          <span>В корзине</span>
          <strong>{cartCount}</strong>
        </article>
      </section>

      <main className="content-grid">
        <section className="catalog-section" id="catalog">
          <div className="section-head">
            <div>
              <p className="overline">Галерея</p>
              <h2>Каталог</h2>
            </div>

            <div className="catalog-controls">
              <label className="search-box">
                <span>Поиск</span>
                <input
                  type="search"
                  placeholder="Картины, бюсты, художники..."
                  value={searchInput}
                  onChange={handleSearchChange}
                />
              </label>

              <label className="search-box search-box-short">
                <span>Сортировка</span>
                <select value={queryState.sort} onChange={handleSortChange}>
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="filter-row">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={queryState.category === category ? 'is-active' : undefined}
                onClick={() => handleCategoryChange(category)}
              >
                {category === 'Все' ? category : getCategoryLabel(category)}
              </button>
            ))}
          </div>

          <ErrorMessage error={catalogState.error} />

          <div className="product-grid">
            {catalogState.loading ? (
              <div className="catalog-empty">Загрузка каталога...</div>
            ) : currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-visual">
                    {product.image ? (
                      <img src={product.image} alt={product.title} />
                    ) : (
                      <div className="product-fallback" />
                    )}
                    <span>{getCategoryLabel(product.category)}</span>
                  </div>

                  <div className="product-copy">
                    <div className="product-topline">
                      <span className="mini-badge">{product.id}</span>
                      <span className="mini-badge">
                        {product.stock <= 2 ? `Осталось ${product.stock}` : 'В наличии'}
                      </span>
                    </div>

                    <h3>{product.title}</h3>
                    <p className="product-artist">{product.artist}</p>
                    <p>{product.description}</p>
                  </div>

                  <div className="product-meta product-meta-detail">
                    <div>
                      <strong>{formatPrice(product.price)}</strong>
                      <span>{product.medium || 'Коллекционная работа'}</span>
                    </div>
                    <span>{product.period || getCategoryLabel(product.category)}</span>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => addToCart(product)}
                  >
                    Добавить в корзину
                  </button>
                </article>
              ))
            ) : (
              <div className="catalog-empty">Сейчас в каталоге ничего нет.</div>
            )}
          </div>

          <div className="pagination-row">
            <button
              type="button"
              className="secondary-button small-button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              Назад
            </button>
            <span>
              Страница {currentPage} из {Math.max(1, totalPages)}
            </span>
            <button
              type="button"
              className="secondary-button small-button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              Вперёд
            </button>
          </div>
        </section>

        <aside className="sidebar">
          <section className="account-card" id="account">
            <div className="section-head account-head">
              <div>
                <p className="overline">Профиль</p>
                <h2>Аккаунт</h2>
              </div>
              <span className="account-role">
                {currentUser ? roleLabels[currentUser.role] : roleLabels.guest}
              </span>
            </div>

            <div className="account-preview account-preview-text">
              <div>
                <strong>{currentUser?.name ?? 'Гостевой режим'}</strong>
                <span>
                  {currentUser?.email ??
                    'Войдите, чтобы сохранить корзину и оформить заказ.'}
                </span>
              </div>
            </div>

            {currentUser ? (
              <div className="action-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLogout}
                  disabled={authLoading}
                >
                  Выйти
                </button>
              </div>
            ) : (
              <form className="stack-form" onSubmit={handleLogin}>
                <input
                  name="name"
                  placeholder="Имя"
                  value={authForm.name}
                  onChange={handleAuthInput}
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Почта"
                  value={authForm.email}
                  onChange={handleAuthInput}
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Пароль"
                  value={authForm.password}
                  onChange={handleAuthInput}
                />

                <div className="form-actions">
                  <button type="submit" className="primary-button" disabled={authLoading}>
                    Войти
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleRegister}
                    disabled={authLoading}
                  >
                    Регистрация
                  </button>
                </div>
              </form>
            )}

            <ErrorMessage error={authError} />
            {notice ? <p className="notice">{notice}</p> : null}
          </section>

          <section className="cart-card" id="cart">
            <div className="section-head account-head">
              <div>
                <p className="overline">Покупка</p>
                <h2>Корзина</h2>
              </div>
              <strong className="cart-total">{formatPrice(cartTotal)}</strong>
            </div>

            <div className="cart-toolbar">
              <span>{cartCount} позиций</span>
              <button type="button" className="text-button" onClick={clearCart}>
                Очистить
              </button>
            </div>

            <ErrorMessage error={cartError} />

            <div className="cart-list">
              {cartViewItems.length > 0 ? (
                cartViewItems.map((item) => (
                  <article key={item.productId} className="cart-item">
                    <div className="cart-item-copy">
                      <strong>{item.title}</strong>
                      <span>{formatPrice(item.price)}</span>
                    </div>

                    <div className="cart-actions">
                      <button
                        type="button"
                        onClick={() => changeCartQuantity(item.productId, -1)}
                        disabled={cartLoading}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeCartQuantity(item.productId, 1)}
                        disabled={cartLoading}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeFromCart(item.productId)}
                        disabled={cartLoading}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-state">Корзина пока пуста.</p>
              )}
            </div>

            <form className="stack-form checkout-form" onSubmit={handleCheckoutSubmit}>
              <div className="section-head checkout-head">
                <div>
                  <p className="overline">Оформление</p>
                  <h3>Оформление заказа</h3>
                </div>
              </div>

              <select
                name="deliveryMethod"
                value={checkoutForm.deliveryMethod}
                onChange={handleCheckoutInput}
              >
                <option value="courier">Курьер</option>
                <option value="pickup">Самовывоз</option>
              </select>
              <input
                name="recipientName"
                placeholder="Получатель"
                value={checkoutForm.recipientName}
                onChange={handleCheckoutInput}
              />
              <input
                name="phone"
                placeholder="Телефон"
                value={checkoutForm.phone}
                onChange={handleCheckoutInput}
              />
              <div className="field-pair">
                <input
                  name="city"
                  placeholder="Город"
                  value={checkoutForm.city}
                  onChange={handleCheckoutInput}
                />
                <input
                  name="address"
                  placeholder="Адрес"
                  value={checkoutForm.address}
                  onChange={handleCheckoutInput}
                />
              </div>
              <input
                name="postalCode"
                placeholder="Индекс"
                value={checkoutForm.postalCode}
                onChange={handleCheckoutInput}
              />
              <textarea
                name="comment"
                rows="3"
                placeholder="Комментарий к заказу"
                value={checkoutForm.comment}
                onChange={handleCheckoutInput}
              />
              <button
                type="submit"
                className="primary-button"
                disabled={checkoutLoading || cartViewItems.length === 0}
              >
                Оформить заказ
              </button>
            </form>

            <ErrorMessage error={checkoutError} />

            {checkoutResult && (
              <div className="success-box">
                <strong>Заказ отправлен</strong>
                <span>
                  Номер: {checkoutResult.order?.id ?? checkoutResult.id ?? 'без номера'}
                </span>
              </div>
            )}
          </section>

          {isAdmin ? (
            <section className="admin-card">
              <div className="section-head account-head">
                <div>
                  <p className="overline">Управление</p>
                  <h2>Новая работа</h2>
                </div>
                <span className="account-role">Админ</span>
              </div>

              <div className="account-preview account-preview-text">
                <div>
                  <strong>Добавление в каталог</strong>
                  <span>Заполните карточку и загрузите изображение новой работы.</span>
                </div>
              </div>

              <form className="stack-form" onSubmit={handleProductSubmit}>
                <input
                  name="title"
                  placeholder="Название"
                  value={productForm.title}
                  onChange={handleProductInput}
                />
                <input
                  name="artist"
                  placeholder="Автор"
                  value={productForm.artist}
                  onChange={handleProductInput}
                />
                <select
                  name="category"
                  value={selectedProductCategory}
                  onChange={handleProductInput}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
                <div className="field-pair">
                  <input
                    name="price"
                    type="number"
                    min="0"
                    placeholder="Цена"
                    value={productForm.price}
                    onChange={handleProductInput}
                  />
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    placeholder="Количество"
                    value={productForm.stock}
                    onChange={handleProductInput}
                  />
                </div>
                <div className="field-pair">
                  <input
                    name="period"
                    placeholder="Период"
                    value={productForm.period}
                    onChange={handleProductInput}
                  />
                  <input
                    name="medium"
                    placeholder="Материал"
                    value={productForm.medium}
                    onChange={handleProductInput}
                  />
                </div>
                <textarea
                  name="description"
                  placeholder="Описание"
                  rows="3"
                  value={productForm.description}
                  onChange={handleProductInput}
                />
                <label className="upload-field">
                  <span>Изображение</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>

                {uploadPreview && (
                  <div className="upload-preview">
                    <img src={uploadPreview} alt="Предпросмотр" />
                  </div>
                )}

                <button type="submit" className="primary-button" disabled={adminLoading}>
                  Добавить работу
                </button>
              </form>

              <ErrorMessage error={adminError} />
            </section>
          ) : null}
        </aside>
      </main>
    </div>
  )
}

export default App
