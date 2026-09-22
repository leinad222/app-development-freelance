import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';

const databasePath = join(process.cwd(), 'data', 'aster.sqlite');
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

const productCount = database.prepare('SELECT COUNT(*) AS count FROM products').get().count;
if (productCount === 0) {
    const seed = database.prepare('INSERT INTO products (name, category, price, description) VALUES (?, ?, ?, ?)');
    const seedProducts = [
        ['MacBook Air', 'Mac', 'From $999', 'Thin, light, and ready for anything.'],
        ['Mac mini', 'Mac', 'From $599', 'More power in a smaller space.'],
        ['iPhone 17 Pro', 'iPhone', 'From $999', 'Pro performance in every frame.'],
        ['iPhone 17', 'iPhone', 'From $799', 'A brilliant everyday iPhone.'],
        ['iPad Air', 'iPad', 'From $599', 'Powerful, portable, and versatile.'],
        ['Apple Watch Series 11', 'Watch', 'From $399', 'A healthier way to live your day.'],
        ['AirPods Pro', 'AirPods', 'From $249', 'Immersive sound with active noise cancellation.'],
        ['Magic Keyboard', 'Accessories', 'From $99', 'A comfortable partner for your Mac.'],
    ];
    const insertMany = database.transaction((items) => items.forEach((item) => seed.run(...item)));
    insertMany(seedProducts);
}

database.prepare('INSERT OR IGNORE INTO users (id, name, email) VALUES (1, ?, ?)').run('Alex Morgan', 'alex@example.com');

const searchProducts = database.prepare(`
    SELECT id, name, category, price, description
    FROM products
    WHERE name LIKE ? OR category LIKE ? OR description LIKE ?
    ORDER BY name
    LIMIT 8
`);
const getAccount = database.prepare('SELECT id, name, email FROM users WHERE id = 1');
const getCart = database.prepare(`
    SELECT cart_items.id, cart_items.quantity, products.id AS product_id, products.name, products.category, products.price
    FROM cart_items JOIN products ON products.id = cart_items.product_id
    WHERE cart_items.user_id = 1 ORDER BY cart_items.id DESC
`);
const addCartItem = database.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity) VALUES (1, ?, 1)
    ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + 1
`);
const removeCartItem = database.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = 1');

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
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');

    if (requestUrl.pathname === '/api/products' && request.method === 'GET') {
        const query = requestUrl.searchParams.get('q')?.trim() ?? '';
        const pattern = `%${query}%`;
        const products = searchProducts.all(pattern, pattern, pattern);
        sendJson(response, 200, { products });
        return;
    }

    if (requestUrl.pathname === '/api/account' && request.method === 'GET') {
        sendJson(response, 200, { account: getAccount.get(), cartCount: getCart.all().reduce((total, item) => total + item.quantity, 0) });
        return;
    }

    if (requestUrl.pathname === '/api/cart' && request.method === 'GET') {
        const items = getCart.all();
        sendJson(response, 200, { items, count: items.reduce((total, item) => total + item.quantity, 0) });
        return;
    }

    if (requestUrl.pathname === '/api/cart' && request.method === 'POST') {
        try {
            const body = await readBody(request);
            const productId = Number(body.productId);
            if (!Number.isInteger(productId) || !database.prepare('SELECT id FROM products WHERE id = ?').get(productId)) {
                sendJson(response, 400, { error: 'A valid productId is required' });
                return;
            }
            addCartItem.run(productId);
            sendJson(response, 201, { items: getCart.all() });
        } catch {
            sendJson(response, 400, { error: 'Invalid request body' });
        }
        return;
    }

    const cartItemMatch = requestUrl.pathname.match(/^\/api\/cart\/(\d+)$/);
    if (cartItemMatch && request.method === 'DELETE') {
        removeCartItem.run(Number(cartItemMatch[1]));
        sendJson(response, 200, { items: getCart.all() });
        return;
    }

    sendJson(response, 404, { error: 'Not found' });
});

const port = Number(process.env.API_PORT ?? 3001);
server.listen(port, () => console.log(`Aster catalog API running at http://localhost:${port}`));
