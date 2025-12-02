const request = require('supertest');
const app = require('../src/app');

describe('API Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('Authentication', () => {
  const testUser = {
    username: 'testuser' + Date.now(),
    password: 'testpassword123'
  };
  let authToken;

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Utilisateur créé avec succès');
  });

  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send(testUser);
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    authToken = response.body.token;
  });

  it('should reject login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'wrongpassword' });
    expect(response.status).toBe(401);
  });

  it('should get current user with valid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe(testUser.username);
  });
});

describe('Stocks CRUD', () => {
  let authToken;
  let stockId;
  let categoryId;

  beforeAll(async () => {
    // Create user and login
    const user = { username: 'stockuser' + Date.now(), password: 'password123' };
    await request(app).post('/api/auth/register').send(user);
    const loginRes = await request(app).post('/api/auth/login').send(user);
    authToken = loginRes.body.token;

    // Create a category
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Category ' + Date.now() });
    categoryId = catRes.body.id;
  });

  it('should create a new stock item', async () => {
    const response = await request(app)
      .post('/api/stocks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Item',
        description: 'Test description',
        category_id: categoryId,
        quantity: 100,
        unit: 'pièce',
        min_quantity: 10
      });
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    stockId = response.body.id;
  });

  it('should get all stocks', async () => {
    const response = await request(app)
      .get('/api/stocks')
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get stock by ID', async () => {
    const response = await request(app)
      .get(`/api/stocks/${stockId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Test Item');
  });

  it('should update a stock item', async () => {
    const response = await request(app)
      .put(`/api/stocks/${stockId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Item' });
    expect(response.status).toBe(200);
  });

  it('should record stock movement', async () => {
    const response = await request(app)
      .post(`/api/stocks/${stockId}/movement`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'sortie', quantity: 10, reason: 'Test exit' });
    expect(response.status).toBe(200);
    expect(response.body.new_quantity).toBe(90);
  });

  it('should get stock movements', async () => {
    const response = await request(app)
      .get(`/api/stocks/${stockId}/movements`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should delete a stock item', async () => {
    const response = await request(app)
      .delete(`/api/stocks/${stockId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
  });
});

describe('Categories CRUD', () => {
  let authToken;
  let categoryId;

  beforeAll(async () => {
    const user = { username: 'catuser' + Date.now(), password: 'password123' };
    await request(app).post('/api/auth/register').send(user);
    const loginRes = await request(app).post('/api/auth/login').send(user);
    authToken = loginRes.body.token;
  });

  it('should create a new category', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Electronics ' + Date.now(), description: 'Electronic items' });
    expect(response.status).toBe(201);
    categoryId = response.body.id;
  });

  it('should get all categories', async () => {
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should delete a category', async () => {
    const response = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
  });
});
