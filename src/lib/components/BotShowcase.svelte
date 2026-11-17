<script lang="ts">
	import museHi from '#lib/assets/muse-hi.svg';
	import designerImg from '#lib/assets/bot-avatars-all/Designer.png';
	import engineerImg from '#lib/assets/bot-avatars-all/Engineer.png';
	import ideasImg from '#lib/assets/bot-avatars-all/Ideas.png';
	import pmImg from '#lib/assets/bot-avatars-all/PM.png';
	import strategyImg from '#lib/assets/bot-avatars-all/Strategy.png';
</script>

<section class="bot-showcase">
	<div class="paper-grain" aria-hidden="true"></div>

	<!-- Top pill -->
	<div class="subhead-wrap">
		<span class="subhead-pill">
			<span class="subhead-dots" aria-hidden="true"></span>
			MEET THE AI SQUAD
		</span>
	</div>

	<!-- Left tags & copy -->
	<div class="left-tags">
		<span class="tag"><span class="tag-dots" aria-hidden="true"></span>UI / UX DESIGN</span>
		<span class="tag"><span class="tag-dots" aria-hidden="true"></span>GSAP MOTION</span>
		<span class="tag"><span class="tag-dots" aria-hidden="true"></span>SYSTEMS</span>
	</div>

	<p class="left-copy">
		Always ready for crisp layouts, playful micro-interactions, and bold visual systems.
		Easygoing. Pixel-sharp. No drama.
	</p>

	<!-- 2 taped showcase circles (matching target) -->
	<div class="showcase-circle showcase-left" aria-hidden="true">
		<img class="showcase-tape" src="/assets/masking-tape-x2.png" alt="" draggable="false" />
		<img class="showcase-img" src={pmImg} alt="" draggable="false" />
	</div>

	<div class="showcase-circle showcase-right" aria-hidden="true">
		<img class="showcase-tape" src="/assets/masking-tape-x2.png" alt="" draggable="false" />
		<img class="showcase-img" src={strategyImg} alt="" draggable="false" />
	</div>

	<!-- Center giant typography + Muse + Explore stamp -->
	<div class="center-stage">
		<div class="giant-the" aria-hidden="true">THE</div>
		<div class="giant-creative" aria-hidden="true">CREATIVE</div>

		<img class="muse-center" src={museHi} alt="Raditya Rayhan" draggable="false" />

		<div class="explore-stamp" aria-hidden="true">
			<span class="explore-ring"></span>
			<span class="explore-text">EXPLORE</span>
			<span class="explore-dot">↗</span>
		</div>
	</div>

	<!-- Right ROLL IT! 3-circle arc -->
	<span class="roll-it" aria-hidden="true">ROLL IT!</span>
	<div class="rail-arc" aria-hidden="true">
		<div class="rail-circle rail-top">
			<img src={engineerImg} alt="" draggable="false" />
		</div>
		<div class="rail-circle rail-mid is-active">
			<img src={designerImg} alt="" draggable="false" />
		</div>
		<div class="rail-circle rail-bot">
			<img src={ideasImg} alt="" draggable="false" />
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
		border-radius: 0.35vw;
		background: #ffdc13;
		color: #d7791a;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.05vw;
		letter-spacing: 0.01em;
		text-transform: uppercase;
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
		border-radius: 0.3vw;
		background: #ffdc13;
		color: #d7791a;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.1vw;
		text-transform: uppercase;
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

	/* 2 taped showcase circles */
	.showcase-circle {
		position: absolute;
		width: 8.2vw;
		height: 8.2vw;
		border-radius: 999px;
		z-index: 4;
		box-shadow: 0 0.8vw 1.6vw rgba(0, 0, 0, 0.22);
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
		border-radius: 999px;
		object-fit: cover;
		background: #fff1a2;
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

	/* Right ROLL IT! 3-circle arc */
	.roll-it {
		position: absolute;
		top: 19.5vw;
		right: 11vw;
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
		width: 7.4vw;
		height: 7.4vw;
		border-radius: 999px;
		padding: 0.35vw;
		background: rgba(255, 255, 255, 0.2);
		box-shadow: 0 0.6vw 1.4vw rgba(0, 0, 0, 0.2);
		z-index: 5;
	}

	.rail-circle.is-active {
		width: 8.4vw;
		height: 8.4vw;
		background: #fff1a2;
		padding: 0.45vw;
	}

	.rail-circle img {
		width: 100%;
		height: 100%;
		border-radius: 999px;
		object-fit: cover;
	}

	.rail-top {
		top: 14.5vw;
		right: 1.2vw;
	}

	.rail-mid {
		top: 21.5vw;
		right: 5vw;
	}

	.rail-bot {
		top: 29.5vw;
		right: 1.2vw;
	}
</style>
