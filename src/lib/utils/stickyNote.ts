import * as THREE from 'three';
import { liveTune } from './tunerStore.ts';

const SHEET = { W: 1, H: 0.94 };
const NOTE = { W: SHEET.W, H: SHEET.H, SEGS: 44, SPAN: 0.48 };
const WIND = {
	SPEED: 1,
	CURL: 0.14,
	FLUTTER: 0.035,
	TREMBLE: 0.016,
	GUST: 0.3,
	SCROLL: 1.1,
	POKE: 0.6,
	PIN_HALF: 0.3
};
const LIGHT = { X: -2, Y: 2.5, Z: 3, POWER: 1.1, AMBIENT: 0.72 };
const SHADOW = { OPACITY: 0.2, SOFT: 9 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (v: number) => {
	const t = clamp01(v);
	return t * t * (3 - 2 * t);
};

function drawNoteCanvas(title: string, items: string[], size = 512): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = Math.round(size * (SHEET.H / SHEET.W));
	const ctx = canvas.getContext('2d');
	if (!ctx) return canvas;

	const w = canvas.width;
	const h = canvas.height;
	const grad = ctx.createLinearGradient(0, 0, 0, h);
	grad.addColorStop(0, '#f9dd55');
	grad.addColorStop(1, '#f2cf3e');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = '#7c4a12';
	ctx.font = `800 ${0.15 * w}px "Arial Narrow", sans-serif`;
	ctx.fillText(title, 0.09 * w, 0.24 * h);

	ctx.font = `italic ${0.055 * w}px "Nothing You Could Do", "Bradley Hand", cursive`;
	items.forEach((item, idx) => {
		const y = h * (0.37 + 0.125 * idx);
		ctx.beginPath();
		ctx.arc(0.12 * w, y - 0.02 * w, 0.02 * w, 0, Math.PI * 2);
		ctx.lineWidth = Math.max(1.5, w * 0.004);
		ctx.strokeStyle = '#7c4a12';
		ctx.stroke();

		ctx.fillText(item, 0.17 * w, y);

		ctx.setLineDash([3, 5]);
		ctx.beginPath();
		ctx.moveTo(0.09 * w, y + 0.025 * w);
		ctx.lineTo(0.91 * w, y + 0.025 * w);
		ctx.stroke();
		ctx.setLineDash([]);
	});

	return canvas;
}

export function mountStickyNote(
	container: HTMLElement,
	title: string,
	items: string[],
	motionScale = 1
): () => void {
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const dprCap = 1.25;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
	camera.position.z = NOTE.H / NOTE.SPAN / (2 * Math.tan((Math.PI / 180) * 17.5));

	const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setClearColor(0x000000, 0);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	container.appendChild(renderer.domElement);

	const dirLight = new THREE.DirectionalLight(0xffffff, LIGHT.POWER);
	dirLight.position.set(LIGHT.X, LIGHT.Y, LIGHT.Z);
	dirLight.castShadow = true;
	dirLight.shadow.mapSize.set(256, 256);
	dirLight.shadow.blurSamples = 10;
	dirLight.shadow.camera.left = -2;
	dirLight.shadow.camera.right = 2;
	dirLight.shadow.camera.top = 2;
	dirLight.shadow.camera.bottom = -2;
	dirLight.shadow.camera.near = 1;
	dirLight.shadow.camera.far = 10;
	dirLight.shadow.radius = SHADOW.SOFT;

	scene.add(dirLight, new THREE.AmbientLight(0xffffff, Math.PI * LIGHT.AMBIENT));

	const texSize = Math.max(
		512,
		Math.round((container.clientHeight || 300) * NOTE.SPAN * (NOTE.W / NOTE.H) * Math.min(window.devicePixelRatio || 1, dprCap))
	);
	const texture = new THREE.CanvasTexture(drawNoteCanvas(title, items, texSize));
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

	const material = new THREE.MeshStandardMaterial({
		map: texture,
		roughness: 0.92,
		side: THREE.DoubleSide
	});

	const segs = 22;
	const geometry = new THREE.PlaneGeometry(NOTE.W, NOTE.H, segs, segs);
	const basePos = Float32Array.from(geometry.attributes.position.array);
	const vertCount = basePos.length / 3;
	const preW = new Float32Array(vertCount);
	const preM = new Float32Array(vertCount);
	const preDiag = new Float32Array(vertCount);
	const preYLift = new Float32Array(vertCount);

	for (let v = 0; v < vertCount; v++) {
		const bx = basePos[v * 3];
		const by = basePos[v * 3 + 1];
		const m = (NOTE.H / 2 - by) / NOTE.H;
		const o = Math.abs(bx) / NOTE.W;
		const val = smoothstep(m / 0.85) + smoothstep((o - WIND.PIN_HALF) / (0.5 - WIND.PIN_HALF)) * (1 - smoothstep(m / 0.35)) * smoothstep(m / 0.12) * 0.55;
		preW[v] = Math.pow(clamp01(val), 2.1);
		preM[v] = m;
		preDiag[v] = m * (0.5 - bx / NOTE.W);
		preYLift[v] = 0.4 * smoothstep(m / 0.3);
	}

	const noteMesh = new THREE.Mesh(geometry, material);
	noteMesh.castShadow = true;
	scene.add(noteMesh);

	const shadowMat = new THREE.ShadowMaterial({ opacity: SHADOW.OPACITY });
	const shadowGeo = new THREE.PlaneGeometry(6, 6);
	const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
	shadowPlane.position.z = -0.02;
	shadowPlane.receiveShadow = true;
	scene.add(shadowPlane);

	let dirty = true;
	let disposed = false;
	let visible = true;

	let centerX = 0;
	let centerY = 0;
	let boxW = 1;
	const updateBounds = () => {
		let left = 0;
		let top = 0;
		let el: HTMLElement | null = container;
		while (el) {
			left += el.offsetLeft;
			top += el.offsetTop;
			el = el.offsetParent as HTMLElement | null;
		}
		boxW = container.offsetWidth || 1;
		centerX = left + boxW / 2;
		centerY = top + (container.offsetHeight || 1) / 2;
	};

	const resize = () => {
		const w = container.clientWidth || 1;
		const h = container.clientHeight || 1;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		updateBounds();
		dirty = true;
	};

	const applyFrame = (tSec: number, scrollBoost = 0, px = 0, py = 0, proximity = 0) => {
		const d = tSec * liveTune.page2.windSpeed;
		shadowMat.opacity = liveTune.page2.shadowOpacity;
		const gustWave = Math.pow(Math.max(0, Math.sin(0.31 * d) * Math.sin(0.117 * d + 2) - 0.25) / 0.75, 1.6) + scrollBoost * liveTune.page2.scrollWind;
		const gustAmp = WIND.GUST * gustWave;
		const pos = geometry.attributes.position.array as Float32Array;
		const curl = liveTune.page2.curl;
		const pokeScale = WIND.POKE * proximity;
		const trembleScale = WIND.TREMBLE * (0.35 + 1.8 * gustWave);

		for (let v = 0; v < vertCount; v++) {
			const i = v * 3;
			const bx = basePos[i];
			const by = basePos[i + 1];
			const m = preM[v];
			const flutter = WIND.FLUTTER * (Math.sin(1.1 * d + 1.4 * m - 0.8 * bx) + 0.5 * Math.sin(1.9 * d - 0.9 * m - 1.2 * bx + 1.3));
			const tremble = trembleScale * (Math.sin(8.7 * d + 1.9 * bx + 1.1 * m) + 0.6 * Math.sin(13.3 * d + 3.1 * bx));
			const gustShape = 0.55 + 0.45 * Math.sin(1.3 * d + 1.6 * bx) + 0.9 * preDiag[v];
			const poke = pokeScale * (0.5 + 0.9 * (bx * px + (m - 0.5) * py));
			const z = preW[v] * (curl + motionScale * (flutter + tremble + gustAmp * gustShape + poke));
			pos[i + 2] = z;
			pos[i + 1] = by + z * z * preYLift[v];
		}
		geometry.attributes.position.needsUpdate = true;
		geometry.computeVertexNormals();
		dirty = true;
	};

	document.fonts?.ready.then(() => {
		if (disposed) return;
		texture.image = drawNoteCanvas(title, items, texSize);
		texture.needsUpdate = true;
		dirty = true;
	});

	resize();
	applyFrame(0);
	renderer.render(scene, camera);

	let prevScrollY = window.scrollY;
	let scrollEnergy = 0;
	let ptrX = Number.NaN;
	let ptrY = Number.NaN;
	let smoothPx = 0;
	let smoothPy = 0;
	let smoothProx = 0;
	let prevTime = performance.now();
	let rafId = 0;

	const tick = (now: number) => {
		if (disposed) return;
		rafId = requestAnimationFrame(tick);
		if (!visible) return;

		const dt = Math.min((now - prevTime) / 1000, 0.1) || 0.016;
		prevTime = now;

		const sy = window.scrollY;
		const vel = Math.min(Math.abs(sy - prevScrollY) / dt / 1500, 1.2);
		prevScrollY = sy;
		const rate = vel > scrollEnergy ? 9 : 2.5;
		scrollEnergy += (vel - scrollEnergy) * (1 - Math.exp(-rate * dt));

		let tx = 0;
		let ty = 0;
		let tp = 0;
		if (!Number.isNaN(ptrX)) {
			const ex = (ptrX - centerX) / boxW;
			const ey = (ptrY + sy - centerY) / boxW;
			tp = Math.max(0, 1 - Math.hypot(ex, ey) / 1.7);
			tx = Math.max(-1, Math.min(1, 1.4 * ex));
			ty = Math.max(-1, Math.min(1, 1.4 * ey));
		}

		const k = 1 - Math.exp(-5 * dt);
		smoothPx += (tx - smoothPx) * k;
		smoothPy += (ty - smoothPy) * k;
		smoothProx += (tp - smoothProx) * k;

		applyFrame(now / 1000, scrollEnergy, smoothPx, smoothPy, smoothProx);
		if (dirty) {
			dirty = false;
			renderer.render(scene, camera);
		}
	};

	const io = new IntersectionObserver(
		([entry]) => {
			visible = entry.isIntersecting;
		},
		{ rootMargin: '25% 0px' }
	);
	io.observe(container);

	const ro = new ResizeObserver(resize);
	ro.observe(container);

	const abort = new AbortController();
	if (window.matchMedia('(hover: hover), (max-width: 743px)').matches) {
		window.addEventListener(
			'pointermove',
			(e) => {
				ptrX = e.clientX;
				ptrY = e.clientY;
			},
			{ signal: abort.signal, passive: true }
		);
	}

	if (!reduce) {
		rafId = requestAnimationFrame(tick);
	}

	return () => {
		disposed = true;
		cancelAnimationFrame(rafId);
		abort.abort();
		io.disconnect();
		ro.disconnect();
		geometry.dispose();
		texture.dispose();
		material.dispose();
		shadowGeo.dispose();
		shadowMat.dispose();
		renderer.dispose();
		renderer.domElement.remove();
	};
}
