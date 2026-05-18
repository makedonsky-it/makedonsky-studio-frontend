import { useDeferredValue, useEffect, useState, useTransition } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

const demoUsers = {
  customer: {
    id: 'usr_customer_demo',
    name: 'Алина Орлова',
    email: 'alina@makedonsky.studio',
    role: 'customer',
  },
  admin: {
    id: 'usr_admin_demo',
    name: 'Кирилл Македонский',
    email: 'hello@makedonsky.studio',
    role: 'admin',
  },
}

const categoryLabels = {
  Paintings: 'Картины',
  Busts: 'Бюсты',
  Sculptures: 'Скульптуры',
}

const initialProducts = [
  {
    id: 'ms-001',
    title: 'Bonaparte Crossing the Alps',
    artist: 'Жак-Луи Давид',
    category: 'Paintings',
    price: 128000,
    stock: 1,
    image: '/art/bonaparte-crossing-the-alps.jpg',
    description: 'Большая репродукция в музейной подаче для кабинета, студии или библиотеки.',
    period: '1801',
    medium: 'Печать на холсте',
    createdBy: 'usr_admin_demo',
  },
  {
    id: 'ms-002',
    title: 'What Is Truth? Christ and Pilate',
    artist: 'Николай Ге',
    category: 'Paintings',
    price: 118000,
    stock: 1,
    image: '/art/what-is-truth.jpg',
    description: 'Крупноформатная работа с драматичным светом и классической атмосферой.',
    period: '1890',
    medium: 'Печать на холсте',
    createdBy: 'usr_admin_demo',
  },
  {
    id: 'ms-003',
    title: 'Athena of Velletri Bust',
    artist: 'После греческого оригинала',
    category: 'Busts',
    price: 164000,
    stock: 2,
    image: '/art/athena-bust.jpg',
    description: 'Светлый мраморный бюст для интерьера с античным характером.',
    period: 'Римская копия, II век',
    medium: 'Мрамор',
    createdBy: 'usr_admin_demo',
  },
  {
    id: 'ms-004',
    title: 'Epicurus Bust',
    artist: 'Римская копия',
    category: 'Busts',
    price: 146000,
    stock: 2,
    image: '/art/epicurus-bust.jpg',
    description: 'Классический философский бюст с выразительным силуэтом и спокойным ритмом.',
    period: 'Копия греческого оригинала',
    medium: 'Мрамор',
    createdBy: 'usr_admin_demo',
  },
]

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
  image: '',
}

const roleLabels = {
  guest: 'Гость',
  customer: 'Покупатель',
  admin: 'Администратор',
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

  const lower = String(value).toLowerCase()

  if (lower.includes('bust') || lower.includes('бюст')) {
    return 'Busts'
  }

  if (lower.includes('sculpt') || lower.includes('скульп')) {
    return 'Sculptures'
  }

  return 'Paintings'
}

const mapApiProduct = (product) => ({
  id: product.id ?? product.slug ?? `item-${crypto.randomUUID?.() ?? Math.random()}`,
  title: product.title ?? product.name ?? 'Без названия',
  artist: product.artist ?? product.author ?? 'Не указан',
  category: normalizeCategory(product.category),
  price: Number(product.price ?? 0),
  stock: Number(product.stock ?? 0),
  image:
    product.coverImageUrl ??
    product.imageUrl ??
    product.image ??
    product.previewUrl ??
    '',
  description: product.description ?? '',
  period: product.period ?? product.year ?? '',
  medium: product.medium ?? product.material ?? '',
  createdBy: product.createdBy ?? 'api',
})

function App() {
  const [products, setProducts] = useState(initialProducts)
  const [cart, setCart] = useState([
    { productId: 'ms-001', quantity: 1 },
    { productId: 'ms-003', quantity: 1 },
  ])
  const [currentUser, setCurrentUser] = useState(null)
  const [activeCategory, setActiveCategory] = useState('Все')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [notice, setNotice] = useState('Добро пожаловать в Makedonsky Studio.')
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    const controller = new AbortController()

    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          return
        }

        const payload = await response.json()
        const rawProducts = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.data)
            ? payload.data
            : Array.isArray(payload.items)
              ? payload.items
              : []

        setProducts(rawProducts.map(mapApiProduct))
        setCatalogLoaded(true)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCatalogLoaded(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [])

  const deferredSearch = useDeferredValue(searchQuery)
  const isAdmin = currentUser?.role === 'admin'
  const categories = ['Все', ...new Set(products.map((product) => product.category))]
  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === 'Все' || product.category === activeCategory
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${product.title} ${product.artist} ${product.description} ${categoryLabels[product.category] ?? ''}`
        .toLowerCase()
        .includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })

  const cartItems = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId)

      if (!product) {
        return null
      }

      return {
        ...item,
        product,
        subtotal: product.price * item.quantity,
      }
    })
    .filter(Boolean)

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearchInput(value)

    startTransition(() => {
      setSearchQuery(value)
    })
  }

  const handleCategoryChange = (category) => {
    startTransition(() => {
      setActiveCategory(category)
    })
  }

  const addToCart = (productId) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === productId)

      if (existingItem) {
        return currentCart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...currentCart, { productId, quantity: 1 }]
    })

    setNotice('Работа добавлена в корзину.')
  }

  const changeCartQuantity = (productId, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )

    setNotice('Корзина обновлена.')
  }

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.productId !== productId),
    )
    setNotice('Работа удалена из корзины.')
  }

  const clearCart = () => {
    setCart([])
    setNotice('Корзина очищена.')
  }

  const signInAs = (role) => {
    if (role === 'guest') {
      setCurrentUser(null)
      setNotice('Вы вошли как гость.')
      return
    }

    setCurrentUser(demoUsers[role])
    setNotice('Аккаунт переключён.')
  }

  const handleAuthInput = (event) => {
    const { name, value } = event.target
    setAuthForm((current) => ({ ...current, [name]: value }))
  }

  const handleRegister = (event) => {
    event.preventDefault()

    const name = authForm.name.trim()
    const email = authForm.email.trim()

    if (!name || !email || !authForm.password.trim()) {
      setNotice('Заполните имя, email и пароль.')
      return
    }

    setCurrentUser({
      id: `usr_${Date.now()}`,
      name,
      email,
      role: 'customer',
    })
    setAuthForm(emptyAuthForm)
    setNotice('Аккаунт создан.')
  }

  const handleLogin = (event) => {
    event.preventDefault()

    const email = authForm.email.trim().toLowerCase()

    if (!email || !authForm.password.trim()) {
      setNotice('Введите email и пароль.')
      return
    }

    const role = email.includes('admin') || email.includes('kirill') ? 'admin' : 'customer'
    setCurrentUser(
      role === 'admin'
        ? demoUsers.admin
        : {
            id: 'usr_customer_custom',
            name: authForm.name.trim() || 'Новый покупатель',
            email,
            role: 'customer',
          },
    )
    setAuthForm(emptyAuthForm)
    setNotice('Вы вошли в аккаунт.')
  }

  const handleProductInput = (event) => {
    const { name, value } = event.target
    setProductForm((current) => ({ ...current, [name]: value }))
  }

  const handleProductSubmit = (event) => {
    event.preventDefault()

    if (!isAdmin) {
      return
    }

    const title = productForm.title.trim()
    const description = productForm.description.trim()
    const price = Number(productForm.price)
    const stock = Number(productForm.stock)

    if (
      !title ||
      !description ||
      productForm.price === '' ||
      productForm.stock === '' ||
      Number.isNaN(price) ||
      Number.isNaN(stock) ||
      price < 0 ||
      stock < 0
    ) {
      setNotice('Заполните все поля работы.')
      return
    }

    const newProduct = {
      id: `ms-${String(products.length + 1).padStart(3, '0')}`,
      title,
      artist: productForm.artist.trim() || 'Не указан',
      category: productForm.category,
      price,
      stock,
      image: productForm.image.trim() || '/art/athena-bust.jpg',
      description,
      period: productForm.period.trim(),
      medium: productForm.medium.trim(),
      createdBy: currentUser.id,
    }

    setProducts((currentProducts) => [newProduct, ...currentProducts])
    setProductForm(emptyProductForm)
    setNotice('Работа добавлена в каталог.')
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
          <p className="overline">Antique collection</p>
          <h1>Картины, бюсты и предметы с античным характером.</h1>
          <p className="hero-text">
            Витрина собрана как галерея классических работ: крупные полотна,
            античные бюсты и интерьерные акценты с музейным настроением.
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
            <span>Музейная подача</span>
          </div>
        </div>

        <div className="hero-media">
          <img src="/real.jpg" alt="Makedonsky Studio" />
          <div className="hero-note">
            <strong>Makedonsky Studio</strong>
            <span>Antique gallery</span>
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
          <strong>{products.length}</strong>
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
              <p className="overline">Catalog</p>
              <h2>Каталог</h2>
            </div>

            <label className="search-box">
              <span>Поиск</span>
              <input
                type="search"
                placeholder="Картины, бюсты, художники..."
                value={searchInput}
                onChange={handleSearchChange}
              />
            </label>
          </div>

          <div className="filter-row">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={category === activeCategory ? 'is-active' : undefined}
                onClick={() => handleCategoryChange(category)}
              >
                {category === 'Все' ? category : categoryLabels[category]}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-visual">
                    {product.image ? (
                      <img src={product.image} alt={product.title} />
                    ) : (
                      <div className="product-fallback" />
                    )}
                    <span>{categoryLabels[product.category] ?? product.category}</span>
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
                    <span>{product.period || categoryLabels[product.category]}</span>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => addToCart(product.id)}
                  >
                    Добавить в корзину
                  </button>
                </article>
              ))
            ) : (
              <div className="catalog-empty">
                {catalogLoaded ? 'Сейчас в каталоге ничего нет.' : 'Каталог подбирается.'}
              </div>
            )}
          </div>
        </section>

        <aside className="sidebar">
          <section className="account-card" id="account">
            <div className="section-head account-head">
              <div>
                <p className="overline">Account</p>
                <h2>Аккаунт</h2>
              </div>
              <span className="account-role">
                {currentUser ? roleLabels[currentUser.role] : roleLabels.guest}
              </span>
            </div>

            <div className="profile-switcher">
              {['guest', 'customer', 'admin'].map((role) => (
                <button key={role} type="button" onClick={() => signInAs(role)}>
                  {roleLabels[role]}
                </button>
              ))}
            </div>

            <div className="account-preview account-preview-text">
              <div>
                <strong>{currentUser?.name ?? 'Гостевой режим'}</strong>
                <span>{currentUser?.email ?? 'Можно смотреть каталог и собирать корзину.'}</span>
              </div>
            </div>

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
                placeholder="Email"
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
                <button type="submit" className="primary-button">
                  Войти
                </button>
                <button type="button" className="secondary-button" onClick={handleRegister}>
                  Создать аккаунт
                </button>
              </div>
            </form>

            <p className="notice">{notice}</p>
          </section>

          <section className="cart-card" id="cart">
            <div className="section-head account-head">
              <div>
                <p className="overline">Cart</p>
                <h2>Корзина</h2>
              </div>
              <strong className="cart-total">{formatPrice(cartTotal)}</strong>
            </div>

            <div className="cart-toolbar">
              <span>{cartCount} поз.</span>
              <button type="button" className="text-button" onClick={clearCart}>
                Очистить
              </button>
            </div>

            <div className="cart-list">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <article key={item.productId} className="cart-item">
                    <div className="cart-item-copy">
                      <strong>{item.product.title}</strong>
                      <span>{formatPrice(item.product.price)}</span>
                    </div>

                    <div className="cart-actions">
                      <button
                        type="button"
                        onClick={() => changeCartQuantity(item.productId, -1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeCartQuantity(item.productId, 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeFromCart(item.productId)}
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

            <button type="button" className="primary-button" disabled={cartItems.length === 0}>
              Оформить заказ
            </button>
          </section>

          {isAdmin && (
            <section className="admin-card">
              <div className="section-head account-head">
                <div>
                  <p className="overline">Admin</p>
                  <h2>Новая работа</h2>
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
                  value={productForm.category}
                  onChange={handleProductInput}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
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
                <input
                  name="image"
                  placeholder="Ссылка на изображение"
                  value={productForm.image}
                  onChange={handleProductInput}
                />
                <textarea
                  name="description"
                  placeholder="Описание"
                  rows="4"
                  value={productForm.description}
                  onChange={handleProductInput}
                />
                <button type="submit" className="primary-button">
                  Добавить работу
                </button>
              </form>
            </section>
          )}
        </aside>
      </main>
    </div>
  )
}

export default App
