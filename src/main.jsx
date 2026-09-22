import { StrictMode, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import './style.css';

function Scene() {
    scene.background = new THREE.Color('#ffffff');

    useEffect(() => {
        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#f5f5f7');

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#ffffff');
        camera.position.set(0, 0.25, 5.8);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const group = new THREE.Group();
        scene.add(group);

        const geometry = new RoundedBoxGeometry(1.45, 0.12, 2.2, 8, 0.06);
        const material = new THREE.MeshStandardMaterial({
            color: '#d8d9dc',
            roughness: 0.2,
            metalness: 0.9,
        });
        const product = new THREE.Mesh(geometry, material);
        product.rotation.x = -0.18;
        group.add(product);

        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(1.32, 2.02),
            new THREE.MeshStandardMaterial({ color: '#15171b', roughness: 0.28, metalness: 0.35 }),
        );
        screen.position.y = 0.075;
        screen.rotation.x = -Math.PI / 2;
        product.add(screen);

        scene.add(new THREE.HemisphereLight('#ffffff', '#b8b8bd', 2.5));
        const keyLight = new THREE.PointLight('#ffffff', 35, 15);
        keyLight.position.set(3, 4, 4);
        scene.add(keyLight);
        const fillLight = new THREE.PointLight('#aeb8ff', 12, 12);
        fillLight.position.set(-3, 1, 2);
        scene.add(fillLight);

        const resize = () => {
            const { width, height } = canvas.parentElement.getBoundingClientRect();
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener('resize', resize);

        const entrance = gsap.fromTo(
            group.scale,
            { x: 0.2, y: 0.2, z: 0.2 },
            { x: 1, y: 1, z: 1, duration: 1.5, ease: 'expo.out' },
        );
        gsap.to(group.rotation, { y: 0.18, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to(product.position, { y: 0.16, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });

        let frameId;
        const render = () => {
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            entrance.kill();
            gsap.killTweensOf([group.rotation, product.position, group.scale]);
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', resize);
            geometry.dispose();
            material.dispose();
            screen.geometry.dispose();
            screen.material.dispose();
            renderer.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} aria-label="Animated three dimensional Aurora laptop" />;
}
return <canvas ref={canvasRef} aria-label="Animated laptop product illustration" />;
function App() {
    return (
        <main className="app-shell">
            <nav className="topbar">
                <a className="brand" href="/" aria-label="Aurora home"><span className="brand-mark">A</span>Aurora</a>
                <main className="storefront">
                    <div className="announcement">Free delivery within 60 minutes on orders over $50 <a href="#services">Learn more</a></div>
                    <nav className="nav"><a className="logo" href="/" aria-label="Aster home"><span>✦</span> aster</a><div className="nav-links"><a href="#shop">Shop</a><a href="#new">What's new</a><a href="#services">Services</a><a href="#stores">Stores</a></div><div className="nav-actions"><button aria-label="Search">⌕</button><button aria-label="Account">♙</button><button aria-label="Shopping bag">▢</button></div></nav>
                    <section className="hero"><div className="hero-copy"><p className="eyebrow">Aster Premium Partner</p><h1>Technology<br /><em>made human.</em></h1><p className="hero-text">The best of Apple, with local expertise and service that stays with you.</p><div className="hero-actions"><a className="button primary" href="#shop">Shop Apple</a><a className="text-link" href="#services">Explore services <span>→</span></a></div></div><div className="hero-product"><ProductScene /><span className="hero-label">MacBook Air <b>Light. Bright. Ready.</b></span></div></section>
                    <section className="section" id="shop"><div className="section-heading"><p className="eyebrow">Everything Apple</p><h2>Find your next favourite.</h2><a className="text-link" href="#new">View all products <span>→</span></a></div><div className="product-grid">{products.map(([name, price, className, mark]) => <a className={`product-card ${className}`} href="#new" key={name}><span className="product-mark">{mark}</span><h3>{name}</h3><p>{price}</p><span className="card-arrow">↗</span></a>)}</div></section>
                    <section className="new-section" id="new"><div className="section-heading"><p className="eyebrow">Just landed</p><h2>See what's new.</h2></div><div className="feature-banner"><div><p className="eyebrow">New generation</p><h2>iPhone 17 Pro</h2><p>Pro performance. Built for the moments that matter.</p><a className="button dark" href="#shop">Explore iPhone</a></div><div className="phone-art"><div className="phone-camera" /></div></div></section>
                    <section className="service-section" id="services"><div className="section-heading"><p className="eyebrow">More than a store</p><h2>Here when you need us.</h2></div><div className="service-grid">{services.map(([title, text, link]) => <article className="service-card" key={title}><span className="service-icon">✦</span><h3>{title}</h3><p>{text}</p><a className="text-link" href="#services">{link} <span>→</span></a></article>)}</div></section>
                    <footer className="footer"><div><a className="logo" href="/" aria-label="Aster home"><span>✦</span> aster</a><p>Apple Premium Partner</p></div><div className="footer-columns"><div><b>Shop</b><a href="#shop">Mac</a><a href="#shop">iPhone</a><a href="#shop">iPad</a></div><div><b>Services</b><a href="#services">Repairs</a><a href="#services">Trade in</a><a href="#stores">Find a store</a></div><div><b>About</b><a href="#services">Contact us</a><a href="#services">Workshops</a><a href="#services">Support</a></div></div><small>© 2026 Aster. This is an independent concept.</small></footer>
                </main>;
}

                createRoot(document.getElementById('root')).render(
                <StrictMode><App /></StrictMode>,
                );
