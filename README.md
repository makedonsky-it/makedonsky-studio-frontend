# Makedonsky Studio Frontend

Минималистичный storefront под видео про backend для интернет-магазина `Makedonsky Studio`.

Во фронтенде уже заложены и визуально показаны:

- авторизация и регистрация
- роли `guest`, `customer`, `admin`
- каталог товаров
- поиск и фильтрация
- корзина
- создание товаров только от лица `admin`
- backend-ready состояние для дальнейшей серверной реализации

## Stack

- React 19
- Vite
- Чистый CSS без UI-библиотек

## Запуск

```bash
npm install
npm run dev
```

Сборка production:

```bash
npm run build
```


## Backend Contract

Ниже спецификация API, которую стоит считать основным контрактом для серверной части.

### 1. Base URL

```text
/api/v1
```

Пример:

```text
http://localhost:8080/api/v1
```

### 2. Формат данных

- Все запросы и ответы: `application/json`, кроме загрузки файлов.
- Даты: ISO 8601 UTC, пример `2026-05-18T14:37:00.000Z`
- Денежные значения: целое число в минимальной валютной единице.
- Для RUB можно использовать `price: 8900`, что соответствует `8 900 ₽`.
- Все идентификаторы строковые.

### 3. Роли

- `guest`
- `customer`
- `admin`

Правила:

- `guest` может смотреть каталог и вести локальную корзину
- `customer` может смотреть каталог и работать со своей серверной корзиной
- `admin` может всё, что `customer`, плюс создавать, редактировать и удалять товары

### 4. Аутентификация

Рекомендуемый вариант:

- `accessToken` живёт 15 минут
- `refreshToken` живёт 30 дней
- `refreshToken` хранится в `httpOnly` cookie
- `accessToken` можно отдавать в JSON-ответе и использовать как `Bearer`

Заголовок:

```http
Authorization: Bearer <access_token>
```

### 5. Единый формат ответа

Успех:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Ошибка:

```json
{
  "data": null,
  "meta": {
    "requestId": "req_01JV8R8W4K"
  },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is invalid",
    "details": {
      "field": "email"
    }
  }
}
```

### 6. Основные сущности

#### User

```json
{
  "id": "usr_01",
  "name": "Кирилл Македонский",
  "email": "hello@makedonsky.studio",
  "role": "admin",
  "status": "active",
  "createdAt": "2026-05-18T14:37:00.000Z",
  "updatedAt": "2026-05-18T14:37:00.000Z"
}
```

#### Product

```json
{
  "id": "prd_01",
  "title": "Bronze Motion Hoodie",
  "slug": "bronze-motion-hoodie",
  "description": "Тяжёлый худи с мягкой фактурой и минимальной вышивкой M.",
  "category": "Apparel",
  "price": 8900,
  "currency": "RUB",
  "stock": 12,
  "status": "active",
  "coverImageUrl": "https://cdn.example.com/products/prd_01-cover.jpg",
  "gallery": [
    "https://cdn.example.com/products/prd_01-1.jpg",
    "https://cdn.example.com/products/prd_01-2.jpg"
  ],
  "createdBy": "usr_01",
  "createdAt": "2026-05-18T14:37:00.000Z",
  "updatedAt": "2026-05-18T14:37:00.000Z"
}
```

#### Cart

```json
{
  "id": "cart_01",
  "userId": "usr_02",
  "items": [
    {
      "productId": "prd_01",
      "quantity": 2,
      "price": 8900,
      "subtotal": 17800
    }
  ],
  "totalItems": 2,
  "totalPrice": 17800,
  "updatedAt": "2026-05-18T14:37:00.000Z"
}
```

#### Category

```json
{
  "id": "cat_apparel",
  "name": "Apparel",
  "slug": "apparel"
}
```

#### Order

Если хочешь продолжить магазин дальше, лучше сразу предусмотреть заказ:

```json
{
  "id": "ord_01",
  "userId": "usr_02",
  "status": "pending",
  "items": [
    {
      "productId": "prd_01",
      "title": "Bronze Motion Hoodie",
      "price": 8900,
      "quantity": 2,
      "subtotal": 17800
    }
  ],
  "totalPrice": 17800,
  "createdAt": "2026-05-18T14:37:00.000Z"
}
```

## Auth API

### POST `/auth/register`

Создаёт пользователя с ролью `customer`.

Request:

```json
{
  "name": "Алина Орлова",
  "email": "alina@example.com",
  "password": "StrongPassword123!"
}
```

Response `201 Created`:

```json
{
  "data": {
    "user": {
      "id": "usr_02",
      "name": "Алина Орлова",
      "email": "alina@example.com",
      "role": "customer",
      "status": "active",
      "createdAt": "2026-05-18T14:37:00.000Z",
      "updatedAt": "2026-05-18T14:37:00.000Z"
    },
    "accessToken": "jwt_access_token"
  },
  "meta": {},
  "error": null
}
```

Validation:

- `name`: 2..80 символов
- `email`: уникальный, валидный формат
- `password`: минимум 8 символов

### POST `/auth/login`

Request:

```json
{
  "email": "hello@makedonsky.studio",
  "password": "StrongPassword123!"
}
```

Response `200 OK`:

```json
{
  "data": {
    "user": {
      "id": "usr_01",
      "name": "Кирилл Македонский",
      "email": "hello@makedonsky.studio",
      "role": "admin",
      "status": "active",
      "createdAt": "2026-05-18T14:37:00.000Z",
      "updatedAt": "2026-05-18T14:37:00.000Z"
    },
    "accessToken": "jwt_access_token"
  },
  "meta": {},
  "error": null
}
```

Ошибки:

- `401 INVALID_CREDENTIALS`
- `423 USER_BLOCKED`

### POST `/auth/refresh`

Обновляет `accessToken` по `refreshToken`.

Response `200 OK`:

```json
{
  "data": {
    "accessToken": "new_jwt_access_token"
  },
  "meta": {},
  "error": null
}
```

### POST `/auth/logout`

Очищает refresh-сессию.

Response `204 No Content`

### GET `/auth/me`

Возвращает текущего пользователя.

Response `200 OK`:

```json
{
  "data": {
    "id": "usr_01",
    "name": "Кирилл Македонский",
    "email": "hello@makedonsky.studio",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-05-18T14:37:00.000Z",
    "updatedAt": "2026-05-18T14:37:00.000Z"
  },
  "meta": {},
  "error": null
}
```

## Catalog API

### GET `/categories`

Response `200 OK`:

```json
{
  "data": [
    {
      "id": "cat_apparel",
      "name": "Apparel",
      "slug": "apparel"
    },
    {
      "id": "cat_prints",
      "name": "Prints",
      "slug": "prints"
    }
  ],
  "meta": {},
  "error": null
}
```

### GET `/products`

Поддерживаемые query params:

- `page`
- `limit`
- `q`
- `category`
- `minPrice`
- `maxPrice`
- `inStock`
- `sort`

Рекомендуемые значения `sort`:

- `newest`
- `price_asc`
- `price_desc`
- `title_asc`

Пример:

```http
GET /api/v1/products?page=1&limit=12&q=hoodie&category=Apparel&sort=price_desc
```

Response `200 OK`:

```json
{
  "data": [
    {
      "id": "prd_01",
      "title": "Bronze Motion Hoodie",
      "slug": "bronze-motion-hoodie",
      "description": "Тяжёлый худи с мягкой фактурой и минимальной вышивкой M.",
      "category": "Apparel",
      "price": 8900,
      "currency": "RUB",
      "stock": 12,
      "status": "active",
      "coverImageUrl": "https://cdn.example.com/products/prd_01-cover.jpg",
      "gallery": [],
      "createdBy": "usr_01",
      "createdAt": "2026-05-18T14:37:00.000Z",
      "updatedAt": "2026-05-18T14:37:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1
  },
  "error": null
}
```

Правила:

- в публичный каталог попадают только товары со `status = active`
- поиск работает по `title`, `description`, `category`
- если `inStock=true`, возвращаются только товары со `stock > 0`

### GET `/products/:productId`

Response `200 OK`:

```json
{
  "data": {
    "id": "prd_01",
    "title": "Bronze Motion Hoodie",
    "slug": "bronze-motion-hoodie",
    "description": "Тяжёлый худи с мягкой фактурой и минимальной вышивкой M.",
    "category": "Apparel",
    "price": 8900,
    "currency": "RUB",
    "stock": 12,
    "status": "active",
    "coverImageUrl": "https://cdn.example.com/products/prd_01-cover.jpg",
    "gallery": [
      "https://cdn.example.com/products/prd_01-1.jpg"
    ],
    "createdBy": "usr_01",
    "createdAt": "2026-05-18T14:37:00.000Z",
    "updatedAt": "2026-05-18T14:37:00.000Z"
  },
  "meta": {},
  "error": null
}
```

Ошибка:

- `404 PRODUCT_NOT_FOUND`

## Admin Product API

Эти маршруты доступны только для `admin`.

### POST `/products`

Request:

```json
{
  "title": "Afterglow Cap",
  "description": "Пятипанельная кепка с лаконичным лого и жёсткой формой.",
  "category": "Accessories",
  "price": 3700,
  "currency": "RUB",
  "stock": 15,
  "status": "active",
  "coverImageUrl": "https://cdn.example.com/products/prd_06-cover.jpg",
  "gallery": [
    "https://cdn.example.com/products/prd_06-1.jpg"
  ]
}
```

Response `201 Created`:

```json
{
  "data": {
    "id": "prd_06",
    "title": "Afterglow Cap",
    "slug": "afterglow-cap",
    "description": "Пятипанельная кепка с лаконичным лого и жёсткой формой.",
    "category": "Accessories",
    "price": 3700,
    "currency": "RUB",
    "stock": 15,
    "status": "active",
    "coverImageUrl": "https://cdn.example.com/products/prd_06-cover.jpg",
    "gallery": [
      "https://cdn.example.com/products/prd_06-1.jpg"
    ],
    "createdBy": "usr_01",
    "createdAt": "2026-05-18T14:37:00.000Z",
    "updatedAt": "2026-05-18T14:37:00.000Z"
  },
  "meta": {},
  "error": null
}
```

Validation:

- `title`: 3..120 символов
- `description`: 10..5000 символов
- `category`: только допустимое значение или категория из БД
- `price`: integer >= 0
- `stock`: integer >= 0
- `currency`: пока можно захардкодить `RUB`

Ошибка доступа:

- `403 FORBIDDEN`

Важно:

- даже если фронтенд скрывает кнопку создания, backend всё равно обязан проверять роль
- нельзя доверять UI в вопросах RBAC

### PATCH `/products/:productId`

Частичное обновление товара.

Request:

```json
{
  "price": 4100,
  "stock": 19
}
```

Response `200 OK`:

```json
{
  "data": {
    "id": "prd_06",
    "title": "Afterglow Cap",
    "slug": "afterglow-cap",
    "description": "Пятипанельная кепка с лаконичным лого и жёсткой формой.",
    "category": "Accessories",
    "price": 4100,
    "currency": "RUB",
    "stock": 19,
    "status": "active",
    "coverImageUrl": "https://cdn.example.com/products/prd_06-cover.jpg",
    "gallery": [],
    "createdBy": "usr_01",
    "createdAt": "2026-05-18T14:37:00.000Z",
    "updatedAt": "2026-05-18T14:50:00.000Z"
  },
  "meta": {},
  "error": null
}
```

### DELETE `/products/:productId`

Можно делать физическое удаление или мягкое через `status = archived`.

Response:

- `204 No Content`

Рекомендация:

- для магазина лучше soft delete

## Upload API

Если ты будешь добавлять реальные изображения товаров, нужен отдельный endpoint.

### POST `/uploads`

Тип запроса:

- `multipart/form-data`

Поля:

- `file`

Response `201 Created`:

```json
{
  "data": {
    "url": "https://cdn.example.com/uploads/file.jpg",
    "filename": "file.jpg",
    "mimeType": "image/jpeg",
    "size": 248122
  },
  "meta": {},
  "error": null
}
```

Ограничения:

- только изображения
- максимум, например, 5 MB

## Cart API

Корзина нужна и для `guest`, и для `customer`.

Практичный вариант:

- `guest` корзина живёт на фронте
- после логина фронт отправляет локальные товары на merge
- backend объединяет guest items с серверной корзиной пользователя

### GET `/cart`

Только авторизованный пользователь.

Response `200 OK`:

```json
{
  "data": {
    "id": "cart_01",
    "userId": "usr_02",
    "items": [
      {
        "productId": "prd_01",
        "quantity": 2,
        "price": 8900,
        "subtotal": 17800
      }
    ],
    "totalItems": 2,
    "totalPrice": 17800,
    "updatedAt": "2026-05-18T14:37:00.000Z"
  },
  "meta": {},
  "error": null
}
```

### POST `/cart/items`

Добавляет товар в корзину.

Request:

```json
{
  "productId": "prd_01",
  "quantity": 1
}
```

Response `200 OK`:

```json
{
  "data": {
    "id": "cart_01",
    "userId": "usr_02",
    "items": [
      {
        "productId": "prd_01",
        "quantity": 1,
        "price": 8900,
        "subtotal": 8900
      }
    ],
    "totalItems": 1,
    "totalPrice": 8900,
    "updatedAt": "2026-05-18T14:37:00.000Z"
  },
  "meta": {},
  "error": null
}
```

Правила:

- если товар уже в корзине, увеличивать количество
- если `stock` недостаточен, вернуть ошибку

Ошибки:

- `404 PRODUCT_NOT_FOUND`
- `409 INSUFFICIENT_STOCK`

### PATCH `/cart/items/:productId`

Меняет количество товара.

Request:

```json
{
  "quantity": 3
}
```

Response `200 OK`:

```json
{
  "data": {
    "id": "cart_01",
    "userId": "usr_02",
    "items": [
      {
        "productId": "prd_01",
        "quantity": 3,
        "price": 8900,
        "subtotal": 26700
      }
    ],
    "totalItems": 3,
    "totalPrice": 26700,
    "updatedAt": "2026-05-18T14:40:00.000Z"
  },
  "meta": {},
  "error": null
}
```

Validation:

- `quantity >= 1`

### DELETE `/cart/items/:productId`

Удаляет товар из корзины.

Response `200 OK`:

```json
{
  "data": {
    "id": "cart_01",
    "userId": "usr_02",
    "items": [],
    "totalItems": 0,
    "totalPrice": 0,
    "updatedAt": "2026-05-18T14:41:00.000Z"
  },
  "meta": {},
  "error": null
}
```

### DELETE `/cart`

Полностью очищает корзину.

Response `204 No Content`

### POST `/cart/merge`

Нужен для сценария:

1. пользователь добавил товары как `guest`
2. затем вошёл в аккаунт
3. фронтенд отправил локальную корзину на сервер
4. backend объединил её с текущей серверной корзиной

Request:

```json
{
  "items": [
    {
      "productId": "prd_01",
      "quantity": 2
    },
    {
      "productId": "prd_04",
      "quantity": 1
    }
  ]
}
```

Response `200 OK`:

```json
{
  "data": {
    "id": "cart_01",
    "userId": "usr_02",
    "items": [
      {
        "productId": "prd_01",
        "quantity": 2,
        "price": 8900,
        "subtotal": 17800
      },
      {
        "productId": "prd_04",
        "quantity": 1,
        "price": 11200,
        "subtotal": 11200
      }
    ],
    "totalItems": 3,
    "totalPrice": 29000,
    "updatedAt": "2026-05-18T14:42:00.000Z"
  },
  "meta": {},
  "error": null
}
```

Правило merge:

- одинаковые `productId` суммируются
- итоговое количество не должно превышать `stock`

## Orders API

Не обязателен для текущего UI, но для backend-магазина это следующий логичный модуль.

### POST `/orders`

Создаёт заказ из текущей корзины.

Request:

```json
{
  "comment": "Позвонить перед отправкой"
}
```

Response `201 Created`:

```json
{
  "data": {
    "id": "ord_01",
    "userId": "usr_02",
    "status": "pending",
    "items": [
      {
        "productId": "prd_01",
        "title": "Bronze Motion Hoodie",
        "price": 8900,
        "quantity": 2,
        "subtotal": 17800
      }
    ],
    "totalPrice": 17800,
    "createdAt": "2026-05-18T14:45:00.000Z"
  },
  "meta": {},
  "error": null
}
```

### GET `/orders`

Для `customer` возвращает только свои заказы.

Для `admin` может возвращать все заказы.

### GET `/orders/:orderId`

Детали заказа.

## Checkout API

Это уже хороший материал для видео, потому что здесь сходятся транзакции, остатки, Celery и audit log.

### POST `/checkout`

Создаёт заказ из текущей корзины и запускает фоновые процессы.

Request:

```json
{
  "comment": "Позвонить перед отправкой",
  "deliveryMethod": "courier",
  "recipient": {
    "name": "Алина Орлова",
    "phone": "+79990000000"
  },
  "address": {
    "city": "Екатеринбург",
    "line1": "ул. Пример, 10",
    "postalCode": "620000"
  }
}
```

Response `201 Created`:

```json
{
  "data": {
    "order": {
      "id": "ord_01",
      "status": "pending",
      "totalPrice": 17800,
      "createdAt": "2026-05-18T14:45:00.000Z"
    },
    "jobs": [
      "job_send_confirmation_01",
      "job_update_sales_snapshot_01"
    ]
  },
  "meta": {},
  "error": null
}
```

Серверные шаги:

1. Проверить токен пользователя.
2. Открыть транзакцию в PostgreSQL.
3. Заблокировать нужные inventory rows.
4. Проверить остатки и цены.
5. Создать заказ и order items.
6. Списать или зарезервировать остатки.
7. Очистить корзину.
8. Записать audit log.
9. После commit отправить async jobs.

Ошибки:

- `409 INSUFFICIENT_STOCK`
- `409 CHECKOUT_ALREADY_IN_PROGRESS`
- `422 VALIDATION_ERROR`

## Internal API

Эти маршруты лучше не документировать публично для клиента, но для backend-демо они очень полезны.

### GET `/internal/health/live`

Проверяет, что процесс жив.

Response `200 OK`:

```json
{
  "status": "ok"
}
```

### GET `/internal/health/ready`

Проверяет готовность зависимостей.

Что желательно проверять:

- доступность PostgreSQL
- доступность Redis
- доступность RabbitMQ
- состояние миграций

Response `200 OK` или `503 Service Unavailable`.

### GET `/internal/metrics`

Expose endpoint под Prometheus scrape.

Пример метрик:

- `http_requests_total`
- `http_request_duration_seconds`
- `db_query_duration_seconds`
- `celery_task_duration_seconds`
- `orders_created_total`
- `cart_merge_total`
- `product_cache_hit_total`
- `product_cache_miss_total`

## Admin Ops API

Это необязательная, но очень уместная зона для демонстрации Redis, Celery и observability.

Все маршруты ниже только для `admin`.

### POST `/admin/reindex`

Ставит фоновую задачу на полную переиндексацию каталога.

Response `202 Accepted`:

```json
{
  "data": {
    "jobId": "job_reindex_01",
    "status": "queued"
  },
  "meta": {},
  "error": null
}
```

### POST `/admin/cache/invalidate`

Request:

```json
{
  "scope": "products",
  "keys": [
    "products:list:*",
    "product:prd_01"
  ]
}
```

Response `202 Accepted`.

### GET `/admin/jobs/:jobId`

Возвращает состояние фоновой задачи.

Response `200 OK`:

```json
{
  "data": {
    "id": "job_reindex_01",
    "name": "catalog.reindex_search",
    "queue": "catalog",
    "status": "started",
    "createdAt": "2026-05-18T15:00:00.000Z",
    "startedAt": "2026-05-18T15:00:03.000Z",
    "finishedAt": null
  },
  "meta": {},
  "error": null
}
```

## Что фронтенд ожидает от backend

1. Стабильные JSON-ответы с единым envelope.
2. Пагинацию и фильтрацию в `/products`.
3. Строгую проверку роли на сервере.
4. Отдельный сценарий merge гостевой корзины после логина.
5. Наличие `id`, `createdAt`, `updatedAt`, `role`, `stock`, `price`, `status`.
6. Предсказуемые статусы ошибок и машинные `error.code`.
