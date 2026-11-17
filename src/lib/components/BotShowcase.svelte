<script lang="ts">
	import museHi from '#lib/assets/muse-hi.svg';
	import designerImg from '#lib/assets/bot-avatars-all/Designer.png';
	import engineerImg from '#lib/assets/bot-avatars-all/Engineer.png';
	import ideasImg from '#lib/assets/bot-avatars-all/Ideas.png';
	import pmImg from '#lib/assets/bot-avatars-all/PM.png';
	import strategyImg from '#lib/assets/bot-avatars-all/Strategy.png';

	type DragKey =
		| 'subhead'
		| 'leftTags'
		| 'leftCopy'
		| 'showcaseLeft'
		| 'showcaseRight'
		| 'museCenter'
		| 'exploreStamp'
		| 'rollIt'
		| 'railTop'
		| 'railMid'
		| 'railBot';

	let dragEnabled = $state(true);
	let copied = $state(false);
	let offsets = $state<Record<DragKey, { x: number; y: number }>>({
		subhead: { x: 0, y: 0 },
		leftTags: { x: 0, y: 0 },
		leftCopy: { x: 0, y: 0 },
		showcaseLeft: { x: 0, y: 0 },
		showcaseRight: { x: 0, y: 0 },
		museCenter: { x: 0, y: 0 },
		exploreStamp: { x: 0, y: 0 },
		rollIt: { x: 0, y: 0 },
		railTop: { x: 0, y: 0 },
		railMid: { x: 0, y: 0 },
		railBot: { x: 0, y: 0 }
	});

	let activeDrag: {
		key: DragKey;
		startX: number;
		startY: number;
		origX: number;
		origY: number;
	} | null = null;

	function startDrag(key: DragKey, e: PointerEvent) {
		if (!dragEnabled) return;
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		activeDrag = {
			key,
			startX: e.clientX,
			startY: e.clientY,
			origX: offsets[key].x,
			origY: offsets[key].y
		};
	}

	function onDragMove(e: PointerEvent) {
		if (!activeDrag) return;
		const vw = window.innerWidth / 100;
		const dx = Number(((e.clientX - activeDrag.startX) / vw).toFixed(2));
		const dy = Number(((e.clientY - activeDrag.startY) / vw).toFixed(2));
		offsets[activeDrag.key] = {
			x: Number((activeDrag.origX + dx).toFixed(2)),
			y: Number((activeDrag.origY + dy).toFixed(2))
		};
	}

	function endDrag() {
		activeDrag = null;
	}

	function copyLayout() {
		const changed = Object.entries(offsets)
			.filter(([, v]) => v.x !== 0 || v.y !== 0)
			.map(([k, v]) => `${k}: x=${v.x}vw, y=${v.y}vw`)
			.join('\n');
		const out = changed || 'no changes yet (all 0vw)';
		navigator.clipboard?.writeText(out);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	function resetLayout() {
		for (const k of Object.keys(offsets) as DragKey[]) {
			offsets[k] = { x: 0, y: 0 };
		}
	}
</script>

<section class="bot-showcase" class:drag-mode={dragEnabled}>
	<div class="paper-grain" aria-hidden="true"></div>

	<!-- Top pill -->
	<div
		class="subhead-wrap draggable"
		style:translate="{offsets.subhead.x}vw {offsets.subhead.y}vw"
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
		onpointerdown={(e) => startDrag('leftCopy', e)}
		onpointermove={onDragMove}
		onpointerup={endDrag}
	>
		Always ready for crisp layouts, playful micro-interactions, and bold visual systems.
		Easygoing. Pixel-sharp. No drama.
	</p>

	<!-- 2 taped showcase avatars -->
	<div
		class="showcase-circle showcase-left draggable"
		style:translate="{offsets.showcaseLeft.x}vw {offsets.showcaseLeft.y}vw"
		onpointerdown={(e) => startDrag('showcaseLeft', e)}
		onpointermove={onDragMove}
		onpointerup={endDrag}
	>
		<img class="showcase-tape" src="/assets/masking-tape-x2.png" alt="" draggable="false" />
		<img class="showcase-img" src={pmImg} alt="" draggable="false" />
	</div>

	<div
		class="showcase-circle showcase-right draggable"
		style:translate="{offsets.showcaseRight.x}vw {offsets.showcaseRight.y}vw"
		onpointerdown={(e) => startDrag('showcaseRight', e)}
		onpointermove={onDragMove}
		onpointerup={endDrag}
	>
		<img class="showcase-tape" src="/assets/masking-tape-x2.png" alt="" draggable="false" />
		<img class="showcase-img" src={strategyImg} alt="" draggable="false" />
	</div>

	<!-- Center giant typography + Muse + Explore stamp -->
	<div class="center-stage">
		<div class="giant-the" aria-hidden="true">THE</div>
		<div class="giant-creative" aria-hidden="true">
			{#each 'CREATIVE'.split('') as ch, i (i)}
				<span class="c-char" style:--i={i} style:--letters={8}>{ch}</span>
			{/each}
		</div>

		<img
			class="muse-center draggable"
			style:translate="{offsets.museCenter.x}vw {offsets.museCenter.y}vw"
			onpointerdown={(e) => startDrag('museCenter', e)}
			onpointermove={onDragMove}
			onpointerup={endDrag}
			src={museHi}
			alt="Raditya Rayhan"
			draggable="false"
		/>

		<div
			class="explore-stamp draggable"
			style:translate="{offsets.exploreStamp.x}vw {offsets.exploreStamp.y}vw"
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
		onpointerdown={(e) => startDrag('rollIt', e)}
		onpointermove={onDragMove}
		onpointerup={endDrag}
	>
		ROLL IT!
	</span>

	<div class="rail-arc">
		<div
			class="rail-circle rail-top draggable"
			style:translate="{offsets.railTop.x}vw {offsets.railTop.y}vw"
			onpointerdown={(e) => startDrag('railTop', e)}
			onpointermove={onDragMove}
			onpointerup={endDrag}
		>
			<img src={engineerImg} alt="" draggable="false" />
		</div>
		<div
			class="rail-circle rail-mid is-active draggable"
			style:translate="{offsets.railMid.x}vw {offsets.railMid.y}vw"
			onpointerdown={(e) => startDrag('railMid', e)}
			onpointermove={onDragMove}
			onpointerup={endDrag}
		>
			<img src={designerImg} alt="" draggable="false" />
		</div>
		<div
			class="rail-circle rail-bot draggable"
			style:translate="{offsets.railBot.x}vw {offsets.railBot.y}vw"
			onpointerdown={(e) => startDrag('railBot', e)}
			onpointermove={onDragMove}
			onpointerup={endDrag}
		>
			<img src={ideasImg} alt="" draggable="false" />
		</div>
	</div>

	<!-- Drag Mode Toolbar -->
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

	.drag-toolbar {
		position: absolute;
		bottom: 1.5vw;
		left: 1.5vw;
		z-index: 50;
		display: flex;
		gap: 0.5vw;
		background: rgba(1, 41, 0, 0.92);
		padding: 0.5vw;
		border-radius: 0.6vw;
		border: 1px solid rgba(182, 254, 0, 0.35);
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
