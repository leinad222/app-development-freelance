import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import appleLogo from '../images.png';
import './style.css';

function ProductScene() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.set(0, 0.2, 5.8);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const group = new THREE.Group();
        group.rotation.set(-0.28, -0.5, 0.12);
        scene.add(group);
        const geometry = new RoundedBoxGeometry(1.8, 0.12, 2.45, 8, 0.06);
        const material = new THREE.MeshStandardMaterial({ color: '#c9cbd0', roughness: 0.22, metalness: 0.85 });
        const product = new THREE.Mesh(geometry, material);
        group.add(product);
        const screenGeometry = new THREE.PlaneGeometry(1.67, 2.3);
        const screenMaterial = new THREE.MeshStandardMaterial({ color: '#0e1117', roughness: 0.18, metalness: 0.5 });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.y = 0.07;
        screen.rotation.x = -Math.PI / 2;
        product.add(screen);
        scene.add(new THREE.HemisphereLight('#ffffff', '#b6b8c2', 2.4));
        const keyLight = new THREE.PointLight('#ffffff', 35, 14);
        keyLight.position.set(3, 4, 4);
        scene.add(keyLight);
        const blueLight = new THREE.PointLight('#8aa7ff', 18, 12);
        blueLight.position.set(-3, 2, 1);
        scene.add(blueLight);
        const resize = () => {
            const { width, height } = canvas.parentElement.getBoundingClientRect();
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener('resize', resize);
        const intro = gsap.fromTo(group.scale, { x: 0.35, y: 0.35, z: 0.35 }, { x: 1, y: 1, z: 1, duration: 1.4, ease: 'expo.out' });
        gsap.to(group.rotation, { y: 0.1, z: -0.08, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to(group.position, { y: 0.12, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        let frameId;
        const render = () => { renderer.render(scene, camera); frameId = requestAnimationFrame(render); };
        render();
        return () => {
            intro.kill();
            gsap.killTweensOf([group.rotation, group.position, group.scale]);
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', resize);
            geometry.dispose(); material.dispose(); screenGeometry.dispose(); screenMaterial.dispose(); renderer.dispose();
        };
    }, []);
    return <canvas ref={canvasRef} aria-label="Animated laptop product illustration" />;
}

const products = [
    ['Mac', 'From $999', 'product-mac', '⌘', 'MacBook Air', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85'],
    ['iPhone', 'From $799', 'product-phone', '●', 'iPhone 17', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85'],
    ['iPad', 'From $599', 'product-ipad', '▣', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=85'],
    ['Watch', 'From $399', 'product-watch', '◉', 'Apple Watch Series 11', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=85'],
    ['AirPods', 'From $249', 'product-airpods', '◌', 'AirPods Pro', 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85'],
];
const services = [['Expert service and support', 'From setup to screen repair, our specialists are here to help.', 'Learn more'], ['Free delivery in 60 minutes', 'Order online and get your essentials delivered when you need them.', 'Delivery details'], ['Buy online, pick up in-store', 'Reserve your order and collect it from your nearest Aster store.', 'Find a store']];

async function addProductToCart(productId) {
    await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
}

function ProductSearch({ onCartChange, onAdded }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (!isOpen) return undefined;
        const timer = window.setTimeout(async () => {
            setIsLoading(true);
            try { const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`); const data = await response.json(); setResults(data.products ?? []); } catch { setResults([]); } finally { setIsLoading(false); }
        }, 180);
        return () => window.clearTimeout(timer);
    }, [isOpen, query]);
    return <div className="search-wrap">
        <button className="search-trigger" aria-label="Search products" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>⌕</button>
        {isOpen && <div className="search-panel"><div className="search-drawer-heading"><p>Search Aster</p><button onClick={() => setIsOpen(false)} aria-label="Close search">×</button></div><div className="search-input-wrap"><span>⌕</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, accessories and support" aria-label="Search products, accessories and support" /></div>{!query && <div className="search-suggestions"><span>Popular searches</span><button onClick={() => setQuery('Mac')}>Mac</button><button onClick={() => setQuery('iPhone')}>iPhone</button><button onClick={() => setQuery('AirPods')}>AirPods</button><button onClick={() => setQuery('support')}>Support</button></div>}<div className="search-results">{isLoading && <p className="search-message">Searching the catalog...</p>}{!isLoading && results.length === 0 && <p className="search-message">No products found.</p>}{!isLoading && results.map((product) => <div className="search-result" key={product.id}><span><b>{product.name}</b><small>{product.category} · {product.description}</small></span><button className="add-button" onClick={async () => { await addProductToCart(product.id); onCartChange(); onAdded(product.name); }}>Add</button></div>)}</div></div>}
    </div>;
}

function AccountPanel({ onClose }) {
    const [account, setAccount] = useState(null);
    useEffect(() => { fetch('/api/account').then((response) => response.json()).then((data) => setAccount(data.account)); }, []);
    return <div className="popover account-panel"><div className="popover-heading"><b>Your account</b><button onClick={onClose} aria-label="Close account">×</button></div>{account ? <><div className="account-avatar">{account.name.slice(0, 1)}</div><h3>{account.name}</h3><p>{account.email}</p><button className="button primary account-button">Manage account</button></> : <p className="search-message">Loading account...</p>}</div>;
}

function CartPanel({ onClose, onCartChange }) {
    const [items, setItems] = useState([]);
    const loadCart = () => fetch('/api/cart').then((response) => response.json()).then((data) => setItems(data.items ?? []));
    useEffect(() => { loadCart(); }, []);
    const removeItem = async (id) => { await fetch(`/api/cart/${id}`, { method: 'DELETE' }); await loadCart(); onCartChange(); };
    return <div className="popover cart-panel"><div className="popover-heading"><b>Your bag</b><button onClick={onClose} aria-label="Close bag">×</button></div>{items.length === 0 ? <p className="search-message">Your bag is empty.</p> : items.map((item) => <div className="cart-item" key={item.id}><span><b>{item.name}</b><small>{item.category} · Qty {item.quantity}</small></span><button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>×</button></div>)}{items.length > 0 && <button className="button primary checkout-button">Checkout</button>}</div>;
}

const newProducts = [
    { eyebrow: 'New generation', name: 'iPhone 17 Pro', text: 'Pro performance. Built for the moments that matter.', action: 'Explore iPhone', image: products[1][5], className: 'slide-phone' },
    { eyebrow: 'Now available', name: 'MacBook Air', text: 'Light, bright, and ready for everything ahead.', action: 'Explore Mac', image: products[0][5], className: 'slide-mac' },
    { eyebrow: 'Just arrived', name: 'Apple Watch Series 11', text: 'A healthier way to live your day, beautifully.', action: 'Explore Watch', image: products[3][5], className: 'slide-watch' },
];

function NewProductSlideshow() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    useEffect(() => {
        if (isPaused) return undefined;
        const timer = window.setInterval(() => setActiveSlide((slide) => (slide + 1) % newProducts.length), 5000);
        return () => window.clearInterval(timer);
    }, [isPaused]);
    const slide = newProducts[activeSlide];
    const moveSlide = (direction) => setActiveSlide((current) => (current + direction + newProducts.length) % newProducts.length);
    return <div className="slideshow-shell" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={() => setIsPaused(false)}>
        <div className="feature-banner" aria-roledescription="carousel" aria-label="Featured new products">
            <div className="feature-copy" key={slide.name}><p className="eyebrow">{slide.eyebrow}</p><h2>{slide.name}</h2><p>{slide.text}</p><a className="button dark" href="#shop">{slide.action}</a></div>
            <div className={`feature-product-art ${slide.className}`}><img src={slide.image} alt={slide.name} /></div>
        </div>
        <div className="slide-controls"><button onClick={() => moveSlide(-1)} aria-label="Previous product">←</button><div className="slide-dots">{newProducts.map((item, index) => <button className={index === activeSlide ? 'active' : ''} onClick={() => setActiveSlide(index)} aria-label={`Show ${item.name}`} key={item.name} />)}</div><button onClick={() => moveSlide(1)} aria-label="Next product">→</button></div>
    </div>;
}

const categoryMarks = { Mac: '⌘', iPhone: '●', iPad: '▣', Watch: '◉', AirPods: '◌', 'TV & Home': '⌂', AirTag: '○', Accessories: '＋' };
const categoryClasses = { Mac: 'product-mac', iPhone: 'product-phone', iPad: 'product-ipad', Watch: 'product-watch', AirPods: 'product-airpods', 'TV & Home': 'product-home', AirTag: 'product-airtag', Accessories: 'product-accessories' };

function ProductCatalogue({ onAdded }) {
    const [catalogue, setCatalogue] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    useEffect(() => {
        fetch('/api/products')
            .then((response) => { if (!response.ok) throw new Error('Catalogue unavailable'); return response.json(); })
            .then((data) => setCatalogue(data.products ?? []))
            .catch(() => setHasError(true))
            .finally(() => setIsLoading(false));
    }, []);
    const categories = ['All', ...new Set(catalogue.map((product) => product.category))];
    const visibleProducts = activeCategory === 'All' ? catalogue : catalogue.filter((product) => product.category === activeCategory);
    const addProduct = async (product) => { await addProductToCart(product.id); onAdded(product.name); };
    return <div className="catalogue-shell">
        <div className="category-filters" role="tablist" aria-label="Filter products by category">{categories.map((category) => <button className={category === activeCategory ? 'active' : ''} role="tab" aria-selected={category === activeCategory} onClick={() => setActiveCategory(category)} key={category}>{category}</button>)}</div>
        {isLoading && <p className="catalogue-message">Loading the latest product catalogue...</p>}
        {hasError && <p className="catalogue-message">We could not load the catalogue. Please try again shortly.</p>}
        {!isLoading && !hasError && <div className="product-grid">{visibleProducts.map((product) => <article className={`product-card ${categoryClasses[product.category] ?? ''}`} key={product.id}><div className="product-image-wrap"><img src={product.image_url} alt={product.name} loading="lazy" /><span className="product-mark">{categoryMarks[product.category] ?? '＋'}</span></div><h3>{product.name}</h3><p>{product.price}</p><button className="product-add" onClick={() => addProduct(product)} aria-label={`Add ${product.name} to bag`}>+</button></article>)}</div>}
        {!isLoading && !hasError && visibleProducts.length === 0 && <p className="catalogue-message">No products in this category yet.</p>}
    </div>;
}

function App() {
    const [accountOpen, setAccountOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [notice, setNotice] = useState('');
    const refreshCart = () => fetch('/api/cart').then((response) => response.json()).then((data) => setCartCount(data.count ?? 0));
    const showAddedNotice = (name) => { setNotice(`${name} added to your bag`); window.setTimeout(() => setNotice(''), 2600); };
    useEffect(() => { refreshCart(); }, []);
    return <main className="storefront">
        <div className="announcement">Free delivery within 60 minutes on orders over $50 <a href="#services">Learn more</a></div>
        <nav className="nav"><a className="logo" href="/" aria-label="Aster home"><img src={appleLogo} alt="" /> <span>aster</span></a><div className="nav-links"><a href="#shop">Shop</a><a href="#new">What's new</a><a href="#services">Services</a><a href="#services">Stores</a></div><div className="nav-actions"><ProductSearch onCartChange={refreshCart} onAdded={showAddedNotice} /><div className="nav-popover-wrap"><button aria-label="Account" onClick={() => setAccountOpen((open) => !open)}>♙</button>{accountOpen && <AccountPanel onClose={() => setAccountOpen(false)} />}</div><div className="nav-popover-wrap"><button aria-label="Shopping bag" onClick={() => setCartOpen((open) => !open)}>▢<span className="cart-count">{cartCount}</span></button>{cartOpen && <CartPanel onClose={() => setCartOpen(false)} onCartChange={refreshCart} />}</div></div></nav>
        <section className="hero"><div className="hero-copy"><p className="eyebrow">Aster Premium Partner</p><h1>Technology<br /><em>made human.</em></h1><p className="hero-text">The best of Apple, with local expertise and service that stays with you.</p><div className="hero-actions"><a className="button primary" href="#shop">Shop Apple</a><a className="text-link" href="#services">Explore services <span>→</span></a></div></div><div className="hero-product"><ProductScene /><span className="hero-label">MacBook Air <b>Light. Bright. Ready.</b></span></div></section>
        <section className="section" id="shop"><div className="section-heading"><p className="eyebrow">Apple catalogue</p><h2>Find your next favourite.</h2><p className="catalogue-intro">Explore the latest products, accessories, and home essentials available through Aster.</p></div><ProductCatalogue onAdded={(name) => { refreshCart(); showAddedNotice(name); }} /></section>
        <section className="new-section" id="new"><div className="section-heading"><p className="eyebrow">Just landed</p><h2>See what's new.</h2></div><NewProductSlideshow /></section>
        <section className="service-section" id="services"><div className="section-heading"><p className="eyebrow">More than a store</p><h2>Here when you need us.</h2></div><div className="service-grid">{services.map(([title, text, link]) => <article className="service-card" key={title}><span className="service-icon">✦</span><h3>{title}</h3><p>{text}</p><a className="text-link" href="#services">{link} <span>→</span></a></article>)}</div></section>
        {notice && <div className="cart-notice" role="status">✓ {notice}</div>}
        <footer className="footer"><div><a className="logo" href="/" aria-label="Aster home"><img src={appleLogo} alt="" /> <span>aster</span></a><p>Apple Premium Partner</p></div><div className="footer-columns"><div><b>Shop</b><a href="#shop">Mac</a><a href="#shop">iPhone</a><a href="#shop">iPad</a></div><div><b>Services</b><a href="#services">Repairs</a><a href="#services">Trade in</a><a href="#services">Find a store</a></div><div><b>About</b><a href="#services">Contact us</a><a href="#services">Workshops</a><a href="#services">Support</a></div></div><small>© 2026 Aster. This is an independent concept.</small></footer>
    </main>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
