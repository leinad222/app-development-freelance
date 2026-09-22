import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const databasePath = join(process.cwd(), 'data', 'aster.sqlite');
const distPath = join(process.cwd(), 'dist');
mkdirSync(dirname(databasePath), { recursive: true });
const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price TEXT NOT NULL,
        description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        UNIQUE(user_id, product_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    );
`);

try {
    database.exec('ALTER TABLE products ADD COLUMN image_url TEXT');
} catch (error) {
    if (!String(error.message).includes('duplicate column name')) throw error;
}

try {
    database.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
} catch (error) {
    if (!String(error.message).includes('duplicate column name')) throw error;
}
database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
`);

const productCount = database.prepare('SELECT COUNT(*) AS count FROM products').get().count;
if (productCount === 0) {
    const seed = database.prepare('INSERT INTO products (name, category, price, description, image_url) VALUES (?, ?, ?, ?, ?)');
    const seedProducts = [
        ['MacBook Air', 'Mac', 'From $999', 'Thin, light, and ready for anything.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85'],
        ['Mac mini', 'Mac', 'From $599', 'More power in a smaller space.', 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=900&q=85'],
        ['iPhone 17 Pro', 'iPhone', 'From $999', 'Pro performance in every frame.', 'https://images.unsplash.com/photo-1592286927505-2fd0b9f7e6c0?auto=format&fit=crop&w=900&q=85'],
        ['iPhone 17', 'iPhone', 'From $799', 'A brilliant everyday iPhone.', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85'],
        ['iPad Air', 'iPad', 'From $599', 'Powerful, portable, and versatile.', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=85'],
        ['Apple Watch Series 11', 'Watch', 'From $399', 'A healthier way to live your day.', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=85'],
        ['AirPods Pro', 'AirPods', 'From $249', 'Immersive sound with active noise cancellation.', 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85'],
        ['Magic Keyboard', 'Accessories', 'From $99', 'A comfortable partner for your Mac.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85'],
    ];
    const insertMany = database.transaction((items) => items.forEach((item) => seed.run(...item)));
    insertMany(seedProducts);
}

const productImages = {
    'MacBook Air': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85',
    'Mac mini': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=900&q=85',
    'iPhone 17 Pro': 'https://images.unsplash.com/photo-1592286927505-2fd0b9f7e6c0?auto=format&fit=crop&w=900&q=85',
    'iPhone 17': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85',
    'iPad Air': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=85',
    'Apple Watch Series 11': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=85',
    'AirPods Pro': 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85',
    'Magic Keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
};
const updateImages = database.prepare("UPDATE products SET image_url = ? WHERE name = ? AND (image_url IS NULL OR image_url = '')");
Object.entries(productImages).forEach(([name, imageUrl]) => updateImages.run(imageUrl, name));

const catalogueProducts = [
    ['MacBook Pro 14-inch', 'Mac', 'From $1,599', 'Pro performance for demanding creative workflows.', productImages['MacBook Air']],
    ['MacBook Pro 16-inch', 'Mac', 'From $2,499', 'Maximum performance for the biggest ideas.', productImages['MacBook Air']],
    ['iMac', 'Mac', 'From $1,299', 'A powerful all-in-one for home and work.', productImages['MacBook Air']],
    ['Mac Studio', 'Mac', 'From $1,999', 'Serious power for professional studios.', productImages['Mac mini']],
    ['iPhone 17 Pro Max', 'iPhone', 'From $1,199', 'The ultimate iPhone camera and battery experience.', productImages['iPhone 17 Pro']],
    ['iPhone 17e', 'iPhone', 'From $599', 'The essential iPhone experience.', productImages['iPhone 17']],
    ['iPad Pro', 'iPad', 'From $999', 'The ultimate iPad for professional work.', productImages['iPad Air']],
    ['iPad', 'iPad', 'From $349', 'Colourful, capable, and made for everyday life.', productImages['iPad Air']],
    ['iPad mini', 'iPad', 'From $499', 'The full iPad experience in a compact design.', productImages['iPad Air']],
    ['Apple Watch Ultra 3', 'Watch', 'From $799', 'The most rugged and capable Apple Watch.', productImages['Apple Watch Series 11']],
    ['Apple Watch SE', 'Watch', 'From $249', 'Essential features and great value.', productImages['Apple Watch Series 11']],
    ['AirPods Max', 'AirPods', 'From $549', 'High-fidelity audio with a personal fit.', productImages['AirPods Pro']],
    ['AirPods 4', 'AirPods', 'From $129', 'A redesigned everyday listening experience.', productImages['AirPods Pro']],
    ['Apple TV 4K', 'TV & Home', 'From $129', 'Cinema-quality entertainment at home.', productImages['Mac mini']],
    ['HomePod', 'TV & Home', 'From $299', 'Room-filling sound with Siri built in.', productImages['AirPods Pro']],
    ['HomePod mini', 'TV & Home', 'From $99', 'Big sound in a small package.', productImages['AirPods Pro']],
    ['AirTag', 'AirTag', 'From $29', 'Keep track of your everyday essentials.', productImages['AirPods Pro']],
    ['Magic Mouse', 'Accessories', 'From $79', 'A smooth, rechargeable partner for Mac.', productImages['Magic Keyboard']],
    ['Magic Trackpad', 'Accessories', 'From $129', 'A spacious surface for precise control.', productImages['Magic Keyboard']],
    ['Apple Pencil Pro', 'Accessories', 'From $129', 'Bring your ideas to life on iPad.', productImages['iPad Air']],
    ['Apple Pencil USB-C', 'Accessories', 'From $79', 'A simple, versatile stylus for iPad.', productImages['iPad Air']],
    ['iPhone Silicone Case', 'Accessories', 'From $49', 'A protective case with a soft-touch finish.', productImages['iPhone 17']],
    ['USB-C Charge Cable', 'Accessories', 'From $19', 'A reliable cable for charging and data.', productImages['MacBook Air']],
];
const addMissingProduct = database.prepare('INSERT INTO products (name, category, price, description, image_url) VALUES (?, ?, ?, ?, ?)');
const hasProduct = database.prepare('SELECT id FROM products WHERE name = ?');
const addMissingProducts = database.transaction((items) => items.forEach((item) => {
    if (!hasProduct.get(item[0])) addMissingProduct.run(...item);
}));
addMissingProducts(catalogueProducts);

const demoPasswordHash = bcrypt.hashSync('aster-demo', 10);
database.prepare('INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (1, ?, ?, ?)').run('Alex Morgan', 'alex@example.com', demoPasswordHash);
database.prepare('UPDATE users SET password_hash = ? WHERE id = 1 AND password_hash IS NULL').run(demoPasswordHash);

const searchProducts = database.prepare(`
    SELECT id, name, category, price, description, image_url
    FROM products
    WHERE name LIKE ? OR category LIKE ? OR description LIKE ?
    ORDER BY name
    LIMIT 100
`);
const getAccount = database.prepare('SELECT id, name, email FROM users WHERE id = ?');
const getCart = database.prepare(`
    SELECT cart_items.id, cart_items.quantity, products.id AS product_id, products.name, products.category, products.price
    FROM cart_items JOIN products ON products.id = cart_items.product_id
    WHERE cart_items.user_id = ? ORDER BY cart_items.id DESC
`);
const addCartItem = database.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)
    ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + 1
`);
const removeCartItem = database.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?');
const findSession = database.prepare('SELECT user_id FROM sessions WHERE token = ?');
const findUserByEmail = database.prepare('SELECT id, name, email, password_hash FROM users WHERE lower(email) = lower(?)');
const createUser = database.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
const createSession = database.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)');
const deleteSession = database.prepare('DELETE FROM sessions WHERE token = ?');

const parseCookies = (request) => Object.fromEntries((request.headers.cookie ?? '').split(';').filter(Boolean).map((item) => {
    const [key, ...value] = item.trim().split('=');
    return [key, decodeURIComponent(value.join('='))];
}));
const getCurrentUser = (request) => {
    const token = parseCookies(request).aster_session;
    const session = token ? findSession.get(token) : null;
    return session ? session.user_id : null;
};
const setSessionCookie = (response, token) => response.setHeader('Set-Cookie', `aster_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
const clearSessionCookie = (response) => response.setHeader('Set-Cookie', 'aster_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');

const readBody = async (request) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    return body ? JSON.parse(body) : {};
};

const sendJson = (response, status, payload) => {
    response.writeHead(status);
    response.end(JSON.stringify(payload));
};

const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url, 'http://localhost');

    if (requestUrl.pathname === '/api/auth/register' && request.method === 'POST') {
        response.setHeader('Content-Type', 'application/json');
        try {
            const body = await readBody(request);
            const name = String(body.name ?? '').trim();
            const email = String(body.email ?? '').trim().toLowerCase();
            const password = String(body.password ?? '');
            if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
                sendJson(response, 400, { error: 'Use a name, valid email, and password of at least 8 characters.' });
                return;
            }
            if (findUserByEmail.get(email)) {
                sendJson(response, 409, { error: 'An account with that email already exists.' });
                return;
            }
            const result = createUser.run(name, email, bcrypt.hashSync(password, 12));
            const token = randomBytes(32).toString('hex');
            createSession.run(token, result.lastInsertRowid);
            setSessionCookie(response, token);
            sendJson(response, 201, { account: { id: result.lastInsertRowid, name, email } });
        } catch {
            sendJson(response, 400, { error: 'Unable to create account.' });
        }
        return;
    }

    if (requestUrl.pathname === '/api/auth/login' && request.method === 'POST') {
        response.setHeader('Content-Type', 'application/json');
        try {
            const body = await readBody(request);
            const user = findUserByEmail.get(String(body.email ?? '').trim().toLowerCase());
            if (!user?.password_hash || !bcrypt.compareSync(String(body.password ?? ''), user.password_hash)) {
                sendJson(response, 401, { error: 'Email or password is incorrect.' });
                return;
            }
            const token = randomBytes(32).toString('hex');
            createSession.run(token, user.id);
            setSessionCookie(response, token);
            sendJson(response, 200, { account: { id: user.id, name: user.name, email: user.email } });
        } catch {
            sendJson(response, 400, { error: 'Unable to sign in.' });
        }
        return;
    }

    if (requestUrl.pathname === '/api/auth/logout' && request.method === 'POST') {
        response.setHeader('Content-Type', 'application/json');
        const token = parseCookies(request).aster_session;
        if (token) deleteSession.run(token);
        clearSessionCookie(response);
        sendJson(response, 200, { ok: true });
        return;
    }

    if (requestUrl.pathname === '/api/products' && request.method === 'GET') {
        response.setHeader('Content-Type', 'application/json');
        const query = requestUrl.searchParams.get('q')?.trim() ?? '';
        const pattern = `%${query}%`;
        const products = searchProducts.all(pattern, pattern, pattern);
        sendJson(response, 200, { products });
        return;
    }

    if (requestUrl.pathname === '/api/account' && request.method === 'GET') {
        response.setHeader('Content-Type', 'application/json');
        const userId = getCurrentUser(request);
        if (!userId) { sendJson(response, 401, { error: 'Sign in required.' }); return; }
        const items = getCart.all(userId);
        sendJson(response, 200, { account: getAccount.get(userId), cartCount: items.reduce((total, item) => total + item.quantity, 0) });
        return;
    }

    if (requestUrl.pathname === '/api/cart' && request.method === 'GET') {
        response.setHeader('Content-Type', 'application/json');
        const userId = getCurrentUser(request);
        if (!userId) { sendJson(response, 401, { error: 'Sign in required.' }); return; }
        const items = getCart.all(userId);
        sendJson(response, 200, { items, count: items.reduce((total, item) => total + item.quantity, 0) });
        return;
    }

    if (requestUrl.pathname === '/api/cart' && request.method === 'POST') {
        response.setHeader('Content-Type', 'application/json');
        try {
            const userId = getCurrentUser(request);
            if (!userId) { sendJson(response, 401, { error: 'Sign in required.' }); return; }
            const body = await readBody(request);
            const productId = Number(body.productId);
            if (!Number.isInteger(productId) || !database.prepare('SELECT id FROM products WHERE id = ?').get(productId)) {
                sendJson(response, 400, { error: 'A valid productId is required' });
                return;
            }
            addCartItem.run(userId, productId);
            sendJson(response, 201, { items: getCart.all(userId) });
        } catch {
            sendJson(response, 400, { error: 'Invalid request body' });
        }
        return;
    }

    const cartItemMatch = requestUrl.pathname.match(/^\/api\/cart\/(\d+)$/);
    if (cartItemMatch && request.method === 'DELETE') {
        response.setHeader('Content-Type', 'application/json');
        const userId = getCurrentUser(request);
        if (!userId) { sendJson(response, 401, { error: 'Sign in required.' }); return; }
        removeCartItem.run(Number(cartItemMatch[1]), userId);
        sendJson(response, 200, { items: getCart.all(userId) });
        return;
    }

    if (request.method === 'GET' && existsSync(distPath)) {
        const requestedFile = requestUrl.pathname === '/' ? 'index.html' : requestUrl.pathname.slice(1);
        const filePath = join(distPath, requestedFile);
        const safePath = filePath.startsWith(distPath) ? filePath : join(distPath, 'index.html');
        const finalPath = existsSync(safePath) ? safePath : join(distPath, 'index.html');
        const contentTypes = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml' };
        response.writeHead(200, { 'Content-Type': contentTypes[finalPath.slice(finalPath.lastIndexOf('.'))] ?? 'text/html' });
        response.end(readFileSync(finalPath));
        return;
    }

    response.setHeader('Content-Type', 'application/json');
    sendJson(response, 404, { error: 'Not found' });
});

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
server.listen(port, () => console.log(`Aster storefront running on port ${port}`));
