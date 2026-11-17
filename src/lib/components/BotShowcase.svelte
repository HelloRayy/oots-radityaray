<script lang="ts">
	import { onMount } from 'svelte';
	import claudeIcon from '#lib/assets/asset-muse-icon/claude.svg';
	import figmaIcon from '#lib/assets/asset-muse-icon/figma.svg';
	import githubIcon from '#lib/assets/asset-muse-icon/github.svg';
	import jsIcon from '#lib/assets/asset-muse-icon/js.svg';
	import museIlyIcon from '#lib/assets/asset-muse-icon/muse-ily.svg';
	import nodejsIcon from '#lib/assets/asset-muse-icon/nodejs.svg';
	import reactIcon from '#lib/assets/asset-muse-icon/react.svg';
	import vscoideIcon from '#lib/assets/asset-muse-icon/vscoide.svg';

	type DragKey =
		| 'subhead'
		| 'leftTags'
		| 'leftCopy'
		| 'museCenter'
		| 'exploreStamp'
		| 'giantThe'
		| 'giantCreative'
		| 'rollIt';

	type MuseIconItem = {
		id: string;
		name: string;
		src: string;
		x: number;
		y: number;
		width: number;
		height: number;
		scale: number;
		rotate: number;
		deleted: boolean;
	};

	const INITIAL_MUSE_ICONS: MuseIconItem[] = [
		{ id: 'claude', name: 'Claude', src: claudeIcon, x: 26.49, y: 2.69, width: 5, height: 5, scale: 1.8, rotate: -4.5, deleted: false },
		{ id: 'figma', name: 'Figma', src: figmaIcon, x: 78.38, y: 19.82, width: 5, height: 5, scale: 1.8, rotate: 5, deleted: false },
		{ id: 'github', name: 'GitHub', src: githubIcon, x: 20.83, y: 38.59, width: 5, height: 5, scale: 1.9, rotate: -4, deleted: false },
		{ id: 'js', name: 'JS', src: jsIcon, x: 8.1, y: 19.29, width: 5, height: 5, scale: 1.8, rotate: 4, deleted: false },
		{ id: 'nodejs', name: 'Node.js', src: nodejsIcon, x: 75.2, y: 3.72, width: 5, height: 5, scale: 2.6, rotate: 6, deleted: false },
		{ id: 'vscoide', name: 'VS Code', src: vscoideIcon, x: 72.32, y: 39.4, width: 5, height: 5, scale: 1.7, rotate: 8, deleted: false }
	];

	let sectionEl: HTMLElement | null = null;
	let dragEnabled = $state(false);
	let copied = $state(false);
	let selectedIconId = $state<string | null>(null);
	let selectedDragKey = $state<DragKey | null>(null);
	let museIcons = $state<MuseIconItem[]>(INITIAL_MUSE_ICONS.map((item) => ({ ...item })));

	const selectedIcon = $derived(
		museIcons.find((item) => item.id === selectedIconId && !item.deleted) ?? null
	);

	type OffsetTransform = { x: number; y: number; scale: number; rotate: number };

	const createDefaultOffsets = (): Record<DragKey, OffsetTransform> => ({
		subhead: { x: 0, y: 0, scale: 1, rotate: 0 },
		leftTags: { x: 0.32, y: -15.88, scale: 1, rotate: 0 },
		leftCopy: { x: 0.85, y: 5.09, scale: 1, rotate: 0 },
		museCenter: { x: -0.75, y: 7.25, scale: 1.2, rotate: 0 },
		exploreStamp: { x: 0.49, y: 30.31, scale: 1, rotate: 0 },
		giantThe: { x: 0, y: 3.64, scale: 1.3, rotate: 0 },
		giantCreative: { x: 0, y: -13.61, scale: 1.3, rotate: 0 },
		rollIt: { x: -4.02, y: -6.87, scale: 1, rotate: 0 }
	});

	let offsets = $state<Record<DragKey, OffsetTransform>>(createDefaultOffsets());

	let activeDrag: {
		kind: 'offset' | 'icon';
		key: string;
		startX: number;
		startY: number;
		origX: number;
		origY: number;
	} | null = null;

	function startDrag(key: DragKey, e: PointerEvent) {
		if (!dragEnabled) return;
		e.preventDefault();
		selectedIconId = null;
		selectedDragKey = key;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		activeDrag = {
			kind: 'offset',
			key,
			startX: e.clientX,
			startY: e.clientY,
			origX: offsets[key].x,
			origY: offsets[key].y
		};
	}

	function startIconDrag(id: string, e: PointerEvent) {
		if (!dragEnabled) return;
		e.preventDefault();
		e.stopPropagation();
		selectedIconId = id;
		selectedDragKey = null;
		const item = museIcons.find((icon) => icon.id === id);
		if (!item) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		activeDrag = {
			kind: 'icon',
			key: id,
			startX: e.clientX,
			startY: e.clientY,
			origX: item.x,
			origY: item.y
		};
	}

	function onDragMove(e: PointerEvent) {
		if (!activeDrag) return;
		const vw = window.innerWidth / 100;
		const dx = Number(((e.clientX - activeDrag.startX) / vw).toFixed(2));
		const dy = Number(((e.clientY - activeDrag.startY) / vw).toFixed(2));
		const nextX = Number((activeDrag.origX + dx).toFixed(2));
		const nextY = Number((activeDrag.origY + dy).toFixed(2));
		if (activeDrag.kind === 'offset') {
			const k = activeDrag.key as DragKey;
			offsets[k].x = nextX;
			offsets[k].y = nextY;
		} else {
			const target = museIcons.find((icon) => icon.id === activeDrag?.key);
			if (target) {
				target.x = nextX;
				target.y = nextY;
			}
		}
	}

	function endDrag() {
		activeDrag = null;
	}

	function deleteSelectedIcon() {
		if (!selectedIconId) return;
		const target = museIcons.find((icon) => icon.id === selectedIconId);
		if (target) target.deleted = true;
		selectedIconId = null;
	}

	function copyLayout() {
		const changedOffsets = Object.entries(offsets)
			.filter(([, v]) => v.x !== 0 || v.y !== 0 || v.scale !== 1 || v.rotate !== 0)
			.map(([k, v]) => `${k}: x=${v.x}vw, y=${v.y}vw, scale=${v.scale}, rotate=${v.rotate}deg`);

		const iconLines = museIcons
			.filter((icon) => !icon.deleted)
			.map(
				(icon) =>
					`icon[${icon.id}]: x=${icon.x}vw, y=${icon.y}vw, width=${icon.width}vw, height=${icon.height}vw, scale=${icon.scale}, rotate=${icon.rotate}deg`
			);

		const deletedLines = museIcons
			.filter((icon) => icon.deleted)
			.map((icon) => `icon[${icon.id}]: deleted`);

		const out = [...changedOffsets, ...iconLines, ...deletedLines].join('\n') || 'no changes yet';
		navigator.clipboard?.writeText(out);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	function resetLayout() {
		offsets = createDefaultOffsets();
		museIcons = INITIAL_MUSE_ICONS.map((item) => ({ ...item }));
		selectedIconId = null;
		selectedDragKey = null;
	}

	onMount(() => {
		if (!sectionEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let rafId = 0;
		let targetX = 0;
		let targetY = 0;
		let currentX = 0;
		let currentY = 0;

		const tick = () => {
			if (!sectionEl || dragEnabled) {
				currentX = 0;
				currentY = 0;
				sectionEl?.style.setProperty('--mx', '0');
				sectionEl?.style.setProperty('--my', '0');
				rafId = 0;
				return;
			}
			currentX += (targetX - currentX) * 0.1;
			currentY += (targetY - currentY) * 0.1;
			sectionEl.style.setProperty('--mx', currentX.toFixed(4));
			sectionEl.style.setProperty('--my', currentY.toFixed(4));

			if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
				rafId = requestAnimationFrame(tick);
			} else {
				rafId = 0;
			}
		};

		const onPointerMove = (e: PointerEvent) => {
			if (!sectionEl || dragEnabled) return;
			const rect = sectionEl.getBoundingClientRect();
			targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
			targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
			if (!rafId) rafId = requestAnimationFrame(tick);
		};

		const onPointerLeave = () => {
			targetX = 0;
			targetY = 0;
			if (!rafId) rafId = requestAnimationFrame(tick);
		};

		sectionEl.addEventListener('pointermove', onPointerMove);
		sectionEl.addEventListener('pointerleave', onPointerLeave);

		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			sectionEl?.removeEventListener('pointermove', onPointerMove);
			sectionEl?.removeEventListener('pointerleave', onPointerLeave);
		};
	});
</script>

<section class="bot-showcase" bind:this={sectionEl} class:drag-mode={dragEnabled}>
	<div class="paper-grain" aria-hidden="true"></div>

	<!-- Top pill -->
	<div
		class="subhead-wrap draggable"
		style:translate="{offsets.subhead.x}vw {offsets.subhead.y}vw"
		style:scale={offsets.subhead.scale}
		style:rotate="{offsets.subhead.rotate}deg"
		onpointerdown={(e) => startDrag('subhead', e)}
		onpointermove={onDragMove}
		onpointerup={endDrag}
	>
		<span class="subhead-pill">
			<span class="subhead-dots" aria-hidden="true"></span>
			MEET THE AI SQUAD
		</span>
	</div>

	<!-- Left tags & copy -->
	<div
		class="left-tags draggable"
		style:translate="{offsets.leftTags.x}vw {offsets.leftTags.y}vw"
		style:scale={offsets.leftTags.scale}
		style:rotate="{offsets.leftTags.rotate}deg"
		onpointerdown={(e) => startDrag('leftTags', e)}
		onpointermove={onDragMove}
		onpointerup={endDrag}
	>
		<span class="tag"><span class="tag-dots" aria-hidden="true"></span>UI / UX DESIGN</span>
		<span class="tag"><span class="tag-dots" aria-hidden="true"></span>GSAP MOTION</span>
		<span class="tag"><span class="tag-dots" aria-hidden="true"></span>SYSTEMS</span>
	</div>

	<p
		class="left-copy draggable"
		style:translate="{offsets.leftCopy.x}vw {offsets.leftCopy.y}vw"
		style:scale={offsets.leftCopy.scale}
		style:rotate="{offsets.leftCopy.rotate}deg"
		onpointerdown={(e) => startDrag('leftCopy', e)}
		onpointermove={onDragMove}
		onpointerup={endDrag}
	>
		Always ready for crisp layouts, playful micro-interactions, and bold visual systems.
		Easygoing. Pixel-sharp. No drama.
	</p>

	<!-- Center giant typography + Muse + Explore stamp -->
	<div class="center-stage">
		<div
			class="giant-the draggable"
			style:translate="{offsets.giantThe.x}vw {offsets.giantThe.y}vw"
		style:scale={offsets.giantThe.scale}
		style:rotate="{offsets.giantThe.rotate}deg"
			onpointerdown={(e) => startDrag('giantThe', e)}
			onpointermove={onDragMove}
			onpointerup={endDrag}
			aria-hidden="true"
		>
			TOOLS
		</div>
		<div
			class="giant-creative draggable"
			style:translate="{offsets.giantCreative.x}vw {offsets.giantCreative.y}vw"
		style:scale={offsets.giantCreative.scale}
		style:rotate="{offsets.giantCreative.rotate}deg"
			onpointerdown={(e) => startDrag('giantCreative', e)}
			onpointermove={onDragMove}
			onpointerup={endDrag}
			aria-hidden="true"
		>
			{#each 'DEVELOPER'.split('') as ch, i (i)}
				<span class="c-char" style:--i={i} style:--letters={8}>{ch}</span>
			{/each}
		</div>

		<img
			class="muse-center draggable"
			style:translate="{offsets.museCenter.x}vw {offsets.museCenter.y}vw"
		style:scale={offsets.museCenter.scale}
		style:rotate="{offsets.museCenter.rotate}deg"
			onpointerdown={(e) => startDrag('museCenter', e)}
			onpointermove={onDragMove}
			onpointerup={endDrag}
			src={museIlyIcon}
			alt="Raditya Rayhan"
			draggable="false"
		/>

		<div
			class="explore-stamp draggable"
			style:translate="{offsets.exploreStamp.x}vw {offsets.exploreStamp.y}vw"
		style:scale={offsets.exploreStamp.scale}
		style:rotate="{offsets.exploreStamp.rotate}deg"
			onpointerdown={(e) => startDrag('exploreStamp', e)}
			onpointermove={onDragMove}
			onpointerup={endDrag}
		>
			<span class="explore-ring"></span>
			<span class="explore-text">EXPLORE</span>
			<span class="explore-dot">↗</span>
		</div>
	</div>

	<!-- Right ROLL IT! 3-avatar arc -->
	<span
		class="roll-it draggable"
		style:translate="{offsets.rollIt.x}vw {offsets.rollIt.y}vw"
		style:scale={offsets.rollIt.scale}
		style:rotate="{offsets.rollIt.rotate}deg"
		onpointerdown={(e) => startDrag('rollIt', e)}
		onpointermove={onDragMove}
		onpointerup={endDrag}
	>
		ROLL IT!
	</span>

	<!-- Muse Icons (draggable, resizable, rotatable, deletable) -->
	{#each museIcons as icon, i (icon.id)}
		{#if !icon.deleted}
			<div
				class="muse-icon-item draggable"
				class:is-selected={dragEnabled && selectedIconId === icon.id}
				style:--depth-x="{((i % 2 === 0 ? 1 : -1) * (1.2 + (i % 3) * 0.55)).toFixed(2)}vw"
				style:--depth-y="{((i % 3 === 0 ? -1 : 1) * (1.0 + (i % 2) * 0.65)).toFixed(2)}vw"
				style:left="{icon.x}vw"
				style:top="{icon.y}vw"
				style:width="{icon.width}vw"
				style:height="{icon.height}vw"
				style:scale={icon.scale}
				style:transform="translate3d(calc(var(--mx, 0) * var(--depth-x, 0vw)), calc(var(--my, 0) * var(--depth-y, 0vw)), 0) rotate({icon.rotate}deg)"
				onpointerdown={(e) => startIconDrag(icon.id, e)}
				onpointermove={onDragMove}
				onpointerup={endDrag}
			>
				<img src={icon.src} alt={icon.name} draggable="false" />
			</div>
		{/if}
	{/each}

	<!-- Drag Mode Toolbar -->
	<div class="drag-toolbar-wrap">
		{#if dragEnabled && selectedIcon}
			<div class="icon-inspector">
				<span class="inspector-title">{selectedIcon.name}</span>
				<label class="inspector-field">
					<span>X</span>
					<input type="range" min="-20" max="100" step="0.05" bind:value={selectedIcon.x} />
					<input class="num-input" type="number" step="0.05" bind:value={selectedIcon.x} />
				</label>
				<label class="inspector-field">
					<span>Y</span>
					<input type="range" min="-20" max="60" step="0.05" bind:value={selectedIcon.y} />
					<input class="num-input" type="number" step="0.05" bind:value={selectedIcon.y} />
				</label>
				<label class="inspector-field">
					<span>W</span>
					<input type="range" min="0" max="100" step="0.05" bind:value={selectedIcon.width} />
					<input class="num-input" type="number" min="0" step="0.05" bind:value={selectedIcon.width} />
				</label>
				<label class="inspector-field">
					<span>H</span>
					<input type="range" min="0" max="100" step="0.05" bind:value={selectedIcon.height} />
					<input class="num-input" type="number" min="0" step="0.05" bind:value={selectedIcon.height} />
				</label>
				<label class="inspector-field">
					<span>Size</span>
					<input type="range" min="0.2" max="3" step="0.01" bind:value={selectedIcon.scale} />
					<input class="num-input" type="number" min="0.1" step="0.01" bind:value={selectedIcon.scale} />
				</label>
				<label class="inspector-field">
					<span>Angle</span>
					<input type="range" min="-180" max="180" step="0.5" bind:value={selectedIcon.rotate} />
					<input class="num-input" type="number" step="0.5" bind:value={selectedIcon.rotate} />
				</label>
				<button type="button" class="tb-btn tb-delete" onclick={deleteSelectedIcon}>
					Delete
				</button>
			</div>
		{:else if dragEnabled && selectedDragKey}
			<div class="icon-inspector">
				<span class="inspector-title">{selectedDragKey}</span>
				<label class="inspector-field">
					<span>X</span>
					<input type="range" min="-50" max="50" step="0.05" bind:value={offsets[selectedDragKey].x} />
					<input class="num-input" type="number" step="0.05" bind:value={offsets[selectedDragKey].x} />
				</label>
				<label class="inspector-field">
					<span>Y</span>
					<input type="range" min="-50" max="50" step="0.05" bind:value={offsets[selectedDragKey].y} />
					<input class="num-input" type="number" step="0.05" bind:value={offsets[selectedDragKey].y} />
				</label>
				<label class="inspector-field">
					<span>Size</span>
					<input type="range" min="0.2" max="3" step="0.01" bind:value={offsets[selectedDragKey].scale} />
					<input class="num-input" type="number" min="0.1" step="0.01" bind:value={offsets[selectedDragKey].scale} />
				</label>
				<label class="inspector-field">
					<span>Angle</span>
					<input type="range" min="-180" max="180" step="0.5" bind:value={offsets[selectedDragKey].rotate} />
					<input class="num-input" type="number" step="0.5" bind:value={offsets[selectedDragKey].rotate} />
				</label>
			</div>
		{/if}
		<div class="drag-toolbar">
			<button
				type="button"
				class="tb-btn"
				class:is-on={dragEnabled}
				onclick={() => (dragEnabled = !dragEnabled)}
			>
				Drag: {dragEnabled ? 'ON' : 'OFF'}
			</button>
			<button type="button" class="tb-btn tb-copy" onclick={copyLayout}>
				{copied ? 'Copied!' : 'Copy Layout'}
			</button>
			<button type="button" class="tb-btn" onclick={resetLayout}>Reset</button>
		</div>
	</div>
</section>

<style>
	.bot-showcase {
		position: relative;
		width: 100%;
		height: 54vw;
		background: #fa8005;
		overflow: clip;
		z-index: 1;
	}

	.drag-mode .draggable {
		cursor: grab;
		outline: 1.5px dashed rgba(255, 255, 255, 0.45);
		outline-offset: 4px;
		pointer-events: auto !important;
		touch-action: none;
	}

	.drag-mode .draggable:active {
		cursor: grabbing;
		outline-color: #b6fe00;
	}

	.muse-icon-item {
		position: absolute;
		z-index: 12;
		user-select: none;
	}

	.muse-icon-item img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
		pointer-events: none;
	}

	.drag-mode .muse-icon-item.is-selected {
		outline: 2px solid #b6fe00;
		outline-offset: 4px;
	}

	.drag-toolbar-wrap {
		position: absolute;
		bottom: 1.5vw;
		left: 1.5vw;
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: 0.4vw;
		align-items: flex-start;
	}

	.icon-inspector {
		display: flex;
		align-items: center;
		gap: 0.6vw;
		background: rgba(1, 41, 0, 0.94);
		padding: 0.45vw 0.7vw;
		border-radius: 0.6vw;
		border: 1px solid rgba(182, 254, 0, 0.45);
		color: #fff;
		font-size: 12px;
	}

	.inspector-title {
		font-weight: 700;
		color: #b6fe00;
		margin-right: 0.2vw;
	}

	.inspector-field {
		display: flex;
		align-items: center;
		gap: 0.3vw;
		font-weight: 600;
	}

	.inspector-field span {
		min-width: 34px;
		white-space: nowrap;
	}

	.inspector-field input[type='range'] {
		width: 110px;
		accent-color: #b6fe00;
		cursor: pointer;
	}

	.num-input {
		width: auto;
		min-width: 38px;
		field-sizing: content;
		padding: 2px 5px;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.num-input::-webkit-outer-spin-button,
	.num-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.drag-toolbar {
		display: flex;
		gap: 0.5vw;
		background: rgba(1, 41, 0, 0.92);
		padding: 0.5vw;
		border-radius: 0.6vw;
		border: 1px solid rgba(182, 254, 0, 0.35);
	}

	.tb-delete {
		background: #c62828;
		color: #fff;
	}

	.tb-btn {
		padding: 0.4vw 0.8vw;
		border-radius: 0.4vw;
		font-size: 12px;
		font-weight: 700;
		color: #fff;
		background: rgba(255, 255, 255, 0.12);
	}

	.tb-btn.is-on {
		background: #034102;
		color: #b6fe00;
	}

	.tb-copy {
		background: #b6fe00;
		color: #013900;
	}

	.paper-grain {
		position: absolute;
		inset: 0;
		opacity: 0.16;
		pointer-events: none;
		background-image: url(/assets/paper-overlay.webp);
		background-repeat: repeat-y;
		background-size: 100%;
	}

	/* Top pill */
	.subhead-wrap {
		position: absolute;
		top: 2vw;
		left: 50%;
		transform: translateX(-50%);
		z-index: 5;
	}

	.subhead-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.45vw;
		padding: 0.45vw 0.95vw;
		border-radius: 0.45vw;
		background: #ffdc13;
		color: #d7791a;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.05vw;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		transform: rotate(-1.5deg);
	}

	.subhead-dots,
	.tag-dots {
		width: 0.2vw;
		height: 0.85vw;
		background-image: radial-gradient(circle, currentColor 45%, transparent 50%);
		background-size: 100% 0.28vw;
	}

	/* Left tags & copy */
	.left-tags {
		position: absolute;
		top: 17.5vw;
		left: 1.2vw;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5vw;
		z-index: 5;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.45vw;
		padding: 0.42vw 0.85vw;
		border-radius: 0.45vw;
		background: #ffdc13;
		color: #d7791a;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.1vw;
		text-transform: uppercase;
		transform: rotate(-1.5deg);
	}

	.left-copy {
		position: absolute;
		bottom: 10.5vw;
		left: 1.2vw;
		max-width: 16vw;
		font-family: var(--font-body);
		font-size: 1.05vw;
		font-weight: 600;
		line-height: 1.25;
		color: #fff1a2;
		z-index: 5;
	}

	/* 2 taped showcase avatars */
	.showcase-circle {
		position: absolute;
		width: 8.2vw;
		height: 8.2vw;
		z-index: 4;
	}

	.showcase-left {
		top: 14vw;
		left: 17vw;
	}

	.showcase-right {
		top: 18vw;
		right: 17.5vw;
	}

	.showcase-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 0.8vw 1.4vw rgba(0, 0, 0, 0.25));
	}

	.showcase-tape {
		position: absolute;
		top: -1.1vw;
		left: 50%;
		transform: translateX(-50%) rotate(-3deg);
		width: 4.5vw;
		z-index: 2;
		pointer-events: none;
	}

	/* Center stage */
	.center-stage {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.giant-the,
	.giant-creative {
		position: absolute;
		font-family: var(--font-heading);
		font-weight: 900;
		color: #fcd805;
		line-height: 0.78;
		letter-spacing: -0.02em;
		text-transform: uppercase;
		user-select: none;
	}

	.giant-the {
		top: 5.5vw;
		font-size: 16.5vw;
	}

	.giant-creative {
		bottom: 2.5vw;
		font-size: 16.5vw;
		display: flex;
		align-items: flex-end;
	}

	.c-char {
		--u: calc(2 * var(--i) / (var(--letters) - 1) - 1);
		display: inline-block;
		transform-origin: 50% 100%;
		transform: translateY(calc(1.3vw * (1 - var(--u) * var(--u))))
			rotate(calc(-5.5deg * var(--u)));
	}

	.muse-center {
		position: relative;
		z-index: 3;
		width: 30vw;
		height: auto;
		margin-top: 1vw;
		filter: drop-shadow(0 1.2vw 2.2vw rgba(0, 0, 0, 0.24));
	}

	.explore-stamp {
		position: absolute;
		top: 10vw;
		left: 57.5vw;
		z-index: 4;
		width: 11vw;
		height: 11vw;
		border-radius: 999px;
		background: #ffffff;
		color: #013900;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0.8vw 1.8vw rgba(0, 0, 0, 0.2);
		transform: rotate(8deg);
	}

	.explore-ring {
		position: absolute;
		inset: 0.6vw;
		border-radius: 999px;
		border: 2px dotted #013900;
	}

	.explore-text {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: 2.3vw;
		line-height: 1;
	}

	.explore-dot {
		margin-top: 0.25vw;
		width: 1.8vw;
		height: 1.8vw;
		border-radius: 999px;
		background: #b6fe00;
		display: grid;
		place-items: center;
		font-size: 1vw;
		font-weight: 900;
	}

	/* Right ROLL IT! 3-avatar arc */
	.roll-it {
		position: absolute;
		top: 19.5vw;
		right: 10.5vw;
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: 1.2vw;
		color: #fff1a2;
		transform: rotate(-10deg);
		z-index: 5;
	}

	.rail-arc {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.rail-circle {
		position: absolute;
		width: 7.5vw;
		height: 7.5vw;
		z-index: 5;
	}

	.rail-circle.is-active {
		width: 9.2vw;
		height: 9.2vw;
	}

	.rail-circle img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 0.6vw 1.2vw rgba(0, 0, 0, 0.26));
	}

	.rail-top {
		top: 15vw;
		right: 0.2vw;
	}

	.rail-mid {
		top: 21.5vw;
		right: 3.8vw;
	}

	.rail-bot {
		top: 29.5vw;
		right: 0.2vw;
	}
</style>
