<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	let sectionEl: HTMLElement | null = null;

	// Temporary HUD Tuner state
	let hudOpen = $state(true);
	let copied = $state(false);
	let scrub = $state(0.6);
	let cornerRatio = $state(0.13);
	let inset = $state(0.045);
	let openAt = $state(0.4);
	let parallaxScale = $state(1);

	let rebuildCamera: (() => void) | null = null;

	function resetTuner() {
		scrub = 0.6;
		cornerRatio = 0.13;
		inset = 0.045;
		openAt = 0.4;
		parallaxScale = 1;
		rebuildCamera?.();
	}

	async function copyTuner() {
		const payload = JSON.stringify(
			{ scrub, cornerRatio, inset, openAt, parallaxScale },
			null,
			2
		);
		try {
			await navigator.clipboard.writeText(payload);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// ignore clipboard errors
		}
	}

	function shuffle<T>(arr: T[]): T[] {
		const copy = [...arr];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	function prepareSvgStroke(el: SVGGeometryElement) {
		const len = el.getTotalLength();
		gsap.set(el, { strokeDasharray: `${len} ${len + 2}`, strokeDashoffset: len + 1 });
		return len;
	}

	onMount(() => {
		const root = sectionEl;
		if (!root) return;

		gsap.registerPlugin(ScrollTrigger);

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			root.dataset.reveal = 'live';
			return;
		}

		const canvas = root.querySelector<HTMLElement>('.giant-canvas');
		const rows = gsap.utils.toArray<HTMLElement>('.giant-row', root);
		const wrapper = root.querySelector<HTMLElement>('.wrapper');
		const topTitle = root.querySelector<HTMLElement>('.giant-canvas > .top-title');
		if (!canvas || rows.length < 2) return;

		// 1. Parallax engine for .giant-prop and .giant-slot
		const parallaxLayers = gsap.utils.toArray<HTMLElement>('.giant-prop, .giant-slot', root);
		const getCenterOffset = (el: HTMLElement) => {
			let cx = el.offsetWidth / 2;
			let cur: HTMLElement | null = el;
			while (cur && cur !== canvas) {
				cx += cur.offsetLeft;
				cur = cur.offsetParent as HTMLElement | null;
			}
			return cx;
		};
		const parseEase = (name: string) =>
			gsap.parseEase(name) ?? gsap.parseEase('power2.inOut');

		const pItems = parallaxLayers.map((el) => ({
			el,
			setDx: gsap.quickSetter(el, '--pdx'),
			setRot: el.matches('.giant-prop--tag') ? gsap.quickSetter(el, '--prot') : null,
			home: 0,
			drift: 0.03,
			easeName: 'power2.inOut',
			ease: parseEase('power2.inOut')
		}));

		const measureParallax = () => {
			for (const item of pItems) {
				item.home = getCenterOffset(item.el);
				const cs = getComputedStyle(item.el);
				const pp = parseFloat(cs.getPropertyValue('--pp'));
				item.drift = Number.isFinite(pp) ? pp : 0.03;
				item.easeName = cs.getPropertyValue('--pe').trim() || 'power2.inOut';
				item.ease = parseEase(item.easeName);
			}
		};

		const updateParallax = (canvasX: number) => {
			const vw = window.innerWidth;
			const half = vw / 2;
			const span = 0.65 * vw;
			for (const item of pItems) {
				const rawPp = parseFloat(item.el.style.getPropertyValue('--pp'));
				const drift = (Number.isFinite(rawPp) ? rawPp : item.drift) * parallaxScale;
				const rawPe = item.el.style.getPropertyValue('--pe').trim();
				if (rawPe && rawPe !== item.easeName) {
					item.easeName = rawPe;
					item.ease = parseEase(rawPe);
				}
				const norm = Math.max(-1, Math.min(1, (canvasX + item.home - half) / span));
				const eased = Math.sign(norm) * item.ease(Math.abs(norm));
				item.setDx(`${-drift * vw * eased}px`);
				item.setRot?.(`${-8 * eased * parallaxScale}deg`);
			}
		};

		measureParallax();

		// 2. Camera path & Bezier corner smoothing
		const getScreenH = () => wrapper?.clientHeight || window.innerHeight;

		const computePath = () => {
			const vw = window.innerWidth;
			const vh = getScreenH();
			const pad = vw * inset;
			const rawStops: { x: number; y: number }[] = [];
			const rawEnds: boolean[] = [];
			const rawOpens: number[] = [];

			for (const row of rows) {
				rawOpens.push(rawStops.length);
				const left = row.offsetLeft;
				const width = row.offsetWidth;
				const rectLeft = row.getBoundingClientRect().left;
				let maxRight = width;
				for (const prop of row.querySelectorAll<HTMLElement>('.giant-prop')) {
					maxRight = Math.max(maxRight, prop.getBoundingClientRect().right - rectLeft);
				}
				const y = vh / 2 - (row.offsetTop + row.offsetHeight / 2);
				if (maxRight <= vw - 2 * pad) {
					rawStops.push({ x: vw / 2 - (left + width / 2), y });
					rawEnds.push(true);
				} else {
					rawStops.push({ x: pad - left, y });
					rawEnds.push(false);
					const rightPad = maxRight > width ? 2 * pad : pad;
					rawStops.push({ x: vw - rightPad - (left + maxRight), y });
					rawEnds.push(true);
				}
			}

			if (topTitle) {
				rawStops.unshift({
					x: rawStops[0].x,
					y: vh * openAt - (topTitle.offsetTop + topTitle.offsetHeight / 2)
				});
				rawEnds.unshift(true);
				for (let i = 0; i < rawOpens.length; i++) rawOpens[i] += 1;
			}

			const smoothStops: { x: number; y: number }[] = [];
			const smoothEnds: boolean[] = [];
			const openMap: number[] = [];

			for (let i = 0; i < rawStops.length; i++) {
				const cur = rawStops[i];
				const prev = rawStops[i - 1];
				const next = rawStops[i + 1];
				const pushRaw = () => {
					openMap[i] = smoothStops.length;
					smoothStops.push(cur);
					smoothEnds.push(rawEnds[i]);
				};
				if (!prev || !next) {
					pushRaw();
					continue;
				}
				const dx1 = cur.x - prev.x;
				const dy1 = cur.y - prev.y;
				const dx2 = next.x - cur.x;
				const dy2 = next.y - cur.y;
				const len1 = Math.hypot(dx1, dy1);
				const len2 = Math.hypot(dx2, dy2);
				const angle =
					(180 * Math.acos(Math.min(1, Math.max(-1, (dx1 * dx2 + dy1 * dy2) / (len1 * len2))))) /
					Math.PI;

				if (len1 < 1 || len2 < 1 || angle < 70) {
					pushRaw();
					continue;
				}

				const radius = cornerRatio * Math.min(len1, len2);
				const p1x = cur.x - (dx1 / len1) * radius;
				const p1y = cur.y - (dy1 / len1) * radius;
				const p2x = cur.x + (dx2 / len2) * radius;
				const p2y = cur.y + (dy2 / len2) * radius;
				openMap[i] = smoothStops.length;
				const steps = 4;
				for (let s = 0; s <= steps; s++) {
					const t = s / steps;
					const inv = 1 - t;
					smoothStops.push({
						x: inv * inv * p1x + 2 * inv * t * cur.x + t * t * p2x,
						y: inv * inv * p1y + 2 * inv * t * cur.y + t * t * p2y
					});
					smoothEnds.push(s === steps && rawEnds[i]);
				}
			}

			return {
				stops: smoothStops,
				ends: smoothEnds,
				opens: rawOpens.map((idx) => openMap[idx] ?? idx)
			};
		};

		const segmentLengths = (pts: { x: number; y: number }[]) =>
			pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));

		// 3. Reveal, Tape Peel, Arrows, Hand Notes, and Letter Poke
		root.dataset.reveal = 'live';
		const revealTweens: gsap.core.Tween[] = [];
		const arrowTimelines: gsap.core.Timeline[] = [];

		const rowChars = rows.map((row) => {
			const chars = gsap.utils.toArray<HTMLElement>('.char', row);
			if (chars.length) gsap.set(chars, { yPercent: 115 });
			return chars;
		});

		const indices = gsap.utils.toArray<HTMLElement>('.giant-index', root);
		if (indices.length) gsap.set(indices, { autoAlpha: 0 });

		const rowTapes = rows.map((row) => gsap.utils.toArray<HTMLElement>('.giant-tape', row));
		rowTapes.flat().forEach((el) => el.style.setProperty('--peel', '0'));

		const revealedChars = new Set<HTMLElement>();
		const revealBatch = (batch: HTMLElement[]) => {
			const fresh = batch.filter((c) => !revealedChars.has(c));
			if (!fresh.length) return;
			fresh.forEach((c) => revealedChars.add(c));
			for (const c of fresh) {
				const giant = c.closest('.giant');
				if (giant?.querySelector('.char') !== c) continue;
				const idxEl = giant.querySelector<HTMLElement>('.giant-index');
				if (idxEl) {
					revealTweens.push(gsap.to(idxEl, { autoAlpha: 1, duration: 0.7, ease: 'power1.out' }));
				}
			}
			revealTweens.push(
				gsap.to(shuffle(fresh), {
					yPercent: 0,
					duration: 0.7,
					stagger: 0.055,
					ease: 'power3.out'
				})
			);
		};

		let pendingBatch: HTMLElement[] = [];
		let batchTimer: gsap.core.Tween | null = null;
		const flushBatch = () => {
			batchTimer?.kill();
			batchTimer = null;
			const list = pendingBatch;
			pendingBatch = [];
			if (list.length) revealBatch(list);
		};
		const queueChar = (c: HTMLElement) => {
			pendingBatch.push(c);
			if (pendingBatch.length >= 5) flushBatch();
			else batchTimer ??= gsap.delayedCall(0.28, flushBatch);
		};

		const tapeParents = new Map<HTMLElement, HTMLElement>();
		rowTapes.flat().forEach((tape) => {
			if (tape.parentElement) tapeParents.set(tape.parentElement, tape);
		});
		const peeledTapes = new Set<HTMLElement>();
		const triggerPeel = (tape: HTMLElement) => {
			if (peeledTapes.has(tape)) return;
			peeledTapes.add(tape);
			const state = { p: 0 };
			revealTweens.push(
				gsap.to(state, {
					p: 1,
					duration: 0.75,
					delay: 0.3,
					ease: 'power2.inOut',
					onUpdate: () => tape.style.setProperty('--peel', String(state.p))
				})
			);
		};

		const arrowEls = gsap.utils.toArray<HTMLElement>('.diag-down-arrow, .diag-up-arrow', root);
		const arrowParts = arrowEls.map((el) => {
			const line = el.querySelector<SVGGeometryElement>('.arrow-line');
			const head = el.querySelector<SVGGeometryElement>('.arrow-head');
			if (line) prepareSvgStroke(line);
			if (head) prepareSvgStroke(head);
			return { line, head };
		});
		const drawnArrows = new Set<number>();
		const triggerArrow = (idx: number) => {
			if (drawnArrows.has(idx)) return;
			drawnArrows.add(idx);
			const part = arrowParts[idx];
			if (!part) return;
			const tl = gsap.timeline();
			if (part.line) tl.to(part.line, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' });
			if (part.head) tl.to(part.head, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut' }, 0.9);
			arrowTimelines.push(tl);
		};

		// Hand-notes reveal
		const notes = gsap.utils.toArray<HTMLElement>('.hand-note', root);
		const noteStates = new Map<HTMLElement, boolean>();
		notes.forEach((note) => {
			const ruleX = note.querySelector<SVGGeometryElement>('.hand-rule--x path');
			const ruleY = note.querySelector<SVGGeometryElement>('.hand-rule--y path');
			const lines = gsap.utils.toArray<HTMLElement>('.hand-line', note);
			if (ruleX) prepareSvgStroke(ruleX);
			if (ruleY) prepareSvgStroke(ruleY);
			gsap.set(lines, { autoAlpha: 0, y: 6 });
		});
		const triggerNote = (note: HTMLElement) => {
			if (noteStates.get(note)) return;
			noteStates.set(note, true);
			const ruleX = note.querySelector<SVGGeometryElement>('.hand-rule--x path');
			const ruleY = note.querySelector<SVGGeometryElement>('.hand-rule--y path');
			const lines = gsap.utils.toArray<HTMLElement>('.hand-line', note);
			const tl = gsap.timeline({ delay: 0.15 });
			if (ruleX) tl.to(ruleX, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, 0);
			if (ruleY) tl.to(ruleY, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, 0.1);
			tl.to(lines, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'power2.out' }, 0.2);
			arrowTimelines.push(tl);
		};

		const clipToChar = new Map<Element, HTMLElement>();
		const arrowIndexMap = new Map<Element, number>();
		arrowEls.forEach((el, i) => arrowIndexMap.set(el, i));

		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const target = entry.target as HTMLElement;
					io.unobserve(target);
					const c = clipToChar.get(target);
					if (c) {
						queueChar(c);
						continue;
					}
					const tape = tapeParents.get(target);
					if (tape) {
						triggerPeel(tape);
						continue;
					}
					const arrowIdx = arrowIndexMap.get(target);
					if (arrowIdx !== undefined) {
						triggerArrow(arrowIdx);
						continue;
					}
					if (target.classList.contains('hand-note')) {
						triggerNote(target);
					}
				}
			},
			{ rootMargin: '20% 20% 20% 20%', threshold: 0 }
		);

		const rowClips = rowChars.map((chars) =>
			chars.map((c) => {
				const clip = c.closest('.clip') ?? c;
				clipToChar.set(clip, c);
				return clip;
			})
		);
		rowClips.flat().forEach((el) => io.observe(el));
		tapeParents.forEach((_, parent) => io.observe(parent));
		arrowEls.forEach((el) => io.observe(el));
		notes.forEach((el) => io.observe(el));

		// Top title reveal
		const topChars = topTitle ? gsap.utils.toArray<HTMLElement>('.char', topTitle) : [];
		const subhead = topTitle?.querySelector<HTMLElement>('.subhead') ?? null;
		let topSt: ScrollTrigger | null = null;
		if (topTitle) {
			if (topChars.length) gsap.set(topChars, { yPercent: 115 });
			if (subhead) gsap.set(subhead, { autoAlpha: 0 });
			topSt = ScrollTrigger.create({
				trigger: topTitle,
				start: 'top 75%',
				once: true,
				onEnter: () => {
					if (topChars.length) {
						revealTweens.push(
							gsap.to(shuffle(topChars), {
								yPercent: 0,
								duration: 0.7,
								stagger: 0.014,
								ease: 'power3.out'
							})
						);
					}
					if (subhead) {
						revealTweens.push(
							gsap.to(subhead, {
								autoAlpha: 1,
								rotateY: 0,
								startAt: {
									rotateY: -90,
									transformPerspective: 800,
									transformOrigin: '50% 50%'
								},
								duration: 0.65,
								ease: 'back.out(1.6)',
								delay: 0.12
							})
						);
					}
				}
			});
		}

		// Poke/hover interaction on .giant letters
		const pokeCleanups: (() => void)[] = [];
		for (const row of rows) {
			const chars = gsap.utils.toArray<HTMLElement>('.giant .char', row);
			for (const ch of chars) {
				const onEnter = () => {
					gsap.to(ch, {
						y: '-0.06em',
						rotate: (Math.random() - 0.5) * 8,
						duration: 0.22,
						ease: 'power2.out',
						overwrite: 'auto'
					});
				};
				const onLeave = () => {
					gsap.to(ch, {
						y: 0,
						rotate: 0,
						duration: 0.45,
						ease: 'elastic.out(1, 0.45)',
						overwrite: 'auto'
					});
				};
				ch.addEventListener('pointerenter', onEnter);
				ch.addEventListener('pointerleave', onLeave);
				pokeCleanups.push(() => {
					ch.removeEventListener('pointerenter', onEnter);
					ch.removeEventListener('pointerleave', onLeave);
				});
			}
		}

		// 4. Build & rebuild ScrollTrigger camera timeline
		let camTl: gsap.core.Timeline | null = null;
		let camSt: ScrollTrigger | null = null;

		const buildCamera = () => {
			camSt?.kill();
			camTl?.kill();

			const path = computePath();
			const count = path.stops.length;
			const lens = segmentLengths(path.stops);
			const totalLen = lens.reduce((a, b) => a + b, 0) || 1;
			const stopAt = (idx: number, axis: 'x' | 'y') => () => {
				const stops = computePath().stops;
				return stops[Math.min(idx, stops.length - 1)][axis];
			};

			gsap.set(canvas, { x: stopAt(0, 'x'), y: stopAt(0, 'y') });
			updateParallax(Number(gsap.getProperty(canvas, 'x')));

			camTl = gsap.timeline({
				onUpdate: () => updateParallax(Number(gsap.getProperty(canvas, 'x')))
			});

			const times: number[] = [0];
			for (let i = 1; i < count; i++) {
				camTl.to(canvas, {
					x: stopAt(i, 'x'),
					y: stopAt(i, 'y'),
					duration: (lens[i - 1] / totalLen) * (count - 1),
					ease: 'none'
				});
				times[i] = camTl.duration();
			}

			const unit = camTl.duration() / Math.max(1, count - 1);

			path.opens.forEach((openIdx, rowIdx) => {
				const endIdx = (path.opens[rowIdx + 1] ?? count) - 1;
				const flushTime = Math.max(0, (times[endIdx] ?? camTl!.duration()) - 0.001);
				camTl!.call(
					() => {
						flushBatch();
						const chars = rowChars[rowIdx];
						if (chars?.length) {
							rowClips[rowIdx].forEach((el) => io.unobserve(el));
							revealBatch(chars);
						}
						rowTapes[rowIdx]?.forEach((tape) => {
							if (tape.parentElement) io.unobserve(tape.parentElement);
							triggerPeel(tape);
						});
					},
					undefined,
					flushTime
				);
				if (rowIdx > 0) {
					const arrowTime = Math.max(0, (times[openIdx] ?? 0) - 0.001);
					camTl!.call(
						() => {
							const arrowEl = arrowEls[rowIdx - 1];
							if (arrowEl) io.unobserve(arrowEl);
							triggerArrow(rowIdx - 1);
						},
						undefined,
						arrowTime
					);
				}
			});

			camSt = ScrollTrigger.create({
				trigger: wrapper ?? root,
				start: 'top top',
				end: () => '+=' + Math.round(segmentLengths(computePath().stops).reduce((a, b) => a + b, 0) * unit),
				pin: wrapper ?? true,
				pinSpacing: true,
				scrub,
				invalidateOnRefresh: true,
				onRefresh: () => {
					measureParallax();
					updateParallax(Number(gsap.getProperty(canvas, 'x')));
				},
				animation: camTl
			});
		};

		rebuildCamera = () => {
			buildCamera();
			ScrollTrigger.refresh();
		};

		buildCamera();

		return () => {
			rebuildCamera = null;
			camSt?.kill();
			camTl?.kill();
			topSt?.kill();
			io.disconnect();
			batchTimer?.kill();
			revealTweens.forEach((t) => t.kill());
			arrowTimelines.forEach((t) => t.kill());
			pokeCleanups.forEach((fn) => fn());
			pItems.forEach((item) => {
				item.el.style.removeProperty('--pdx');
				item.el.style.removeProperty('--prot');
			});
			gsap.set(canvas, { clearProps: 'transform' });
		};
	});
</script>

<!-- Hidden SVG Filters for 3D Tape Backside Colors -->
<svg class="peel-defs" aria-hidden="true" width="0" height="0" style="position:absolute;pointer-events:none;">
	<defs>
		<filter id="peel-back-kraft" x="0%" y="0%" width="100%" height="100%">
			<feFlood flood-color="#dbac80" result="flood" />
			<feComposite operator="in" in="flood" in2="SourceAlpha" />
		</filter>
		<filter id="peel-back-black" x="0%" y="0%" width="100%" height="100%">
			<feFlood flood-color="#2f2f2f" result="flood" />
			<feComposite operator="in" in="flood" in2="SourceAlpha" />
		</filter>
	</defs>
</svg>

<section bind:this={sectionEl} class="giant-pinning" aria-label="Why We Exist">
	<span class="giant-brow" aria-hidden="true"></span>
	<div class="wrapper">
		<div class="giant-canvas">
			<div class="top-title">
				<h5 class="subhead">WHY WE EXIST</h5>
				<h2 class="h2" aria-label="WE’RE HERE FOR THE EVERYDAY MOMENTS.">
					<span class="line">
						{#each 'WE’RE\u00A0HERE'.split('') as ch, i}
							<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
						{/each}
					</span>
					<span class="line">
						{#each 'FOR\u00A0THE\u00A0EVERYDAY'.split('') as ch, i}
							<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
						{/each}
					</span>
					<span class="line">
						{#each 'MOMENTS.'.split('') as ch, i}
							<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
						{/each}
					</span>
				</h2>
			</div>

			<!-- Row 1: TO CREATE -->
			<div class="giant-row down-to-horizontal">
				<h2 class="giant" aria-label="TO CREATE">
					<img class="giant-index" src="/assets/index-1.svg" alt="" aria-hidden="true" draggable="false" />
					<span class="clip" style="--i:0"><span class="char">T</span></span>
					<span class="clip" style="--i:1"><span class="char">O</span></span>
					<span
						class="giant-slot"
						aria-hidden="true"
						style="--giant-tilt:3.19deg;--giant-dy:-0.118em;--giant-dx:0em;--pp:0.012;--pe:sine.inOut"
					>
						<img class="giant-card" src="/assets/create-masking-first.webp" alt="" />
						<span
							class="peel giant-tape"
							style="--peel-w:0.62em;--peel-h:0.1961em;--peel-from:calc(var(--peel-edge) + 0.34 * var(--peel-span));--peel-to:calc(var(--peel-edge) + 0 * var(--peel-span));--peel-dir:88.4deg;--peel-back:url(#peel-back-kraft)"
							data-peel="manual"
						>
							<span class="peel-face"><span class="peel-turn"><img src="/assets/opp-tape-x4.png" alt="" draggable="false" /></span></span>
							<span class="peel-flap" aria-hidden="true"><span class="peel-turn"><img src="/assets/opp-tape-x4.png" alt="" draggable="false" /></span></span>
						</span>
					</span>
					<span>
						{#each 'CREATE'.split('') as ch, i}
							<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
						{/each}
					</span>
				</h2>

				<span class="giant-prop giant-prop--shot" aria-hidden="true" style="--px:98%;--py:-15%;--pw:15vw;--pr:-8deg;--pz:2;--pp:-0.03;--pe:none">
					<img src="/assets/create-double-last.webp" alt="" />
					<span
						class="peel giant-tape"
						style="--peel-w:0.62em;--peel-h:0.1961em;--peel-from:calc(var(--peel-edge) + 0.34 * var(--peel-span));--peel-to:calc(var(--peel-edge) + 0 * var(--peel-span));--peel-dir:88.4deg;--peel-back:url(#peel-back-kraft)"
						data-peel="manual"
					>
						<span class="peel-face"><span class="peel-turn"><img src="/assets/opp-tape-x4.png" alt="" draggable="false" /></span></span>
						<span class="peel-flap" aria-hidden="true"><span class="peel-turn"><img src="/assets/opp-tape-x4.png" alt="" draggable="false" /></span></span>
					</span>
				</span>

				<img class="giant-prop giant-prop--tag" src="/assets/slider/double/card.webp" alt="" aria-hidden="true" style="--px:69%;--py:-24%;--pw:22.71vw;--pr:-6deg;--pz:1;--pp:0.03;--pe:sine.inOut" />
				<img class="giant-prop giant-prop--tag" src="/assets/slider/masking/card.webp" alt="" aria-hidden="true" style="--px:53%;--py:50%;--pw:22.71vw;--pr:5deg;--pz:1;--pp:0.03;--pe:power1.inOut" />
				<img class="giant-prop giant-prop--tag" src="/assets/slider/opp-quiet/card.webp" alt="" aria-hidden="true" style="--px:94%;--py:46%;--pw:22.71vw;--pr:-14deg;--pz:1;--pp:-0.02;--pe:power2.inOut" />

				<div class="hand-note giant-note" style="--px:26%;--py:78%" aria-hidden="true">
					<div class="hand-ink">
						<svg class="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M 0 3 C 30 8 65 8 100 1" /></svg>
						<svg class="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M 6 0 C 2 33 3 70 6 100" /></svg>
						<span class="hand-line">every masterpiece</span>
						<span class="hand-line">starts held</span>
						<span class="hand-line">in place.</span>
					</div>
				</div>
			</div>

			<!-- Arrow 1: Down-Right -->
			<div class="diag-down-arrow" aria-hidden="true">
				<svg viewBox="0 0 150 100" fill="none">
					<path class="arrow-line" d="M4 8 C 46 14 100 42 132 84" />
					<path class="arrow-head" d="M111 80 L132 84 L123 65" />
				</svg>
			</div>

			<!-- Row 2: TO FIX -->
			<div class="giant-row diagdown-to-horizontal">
				<h2 class="giant" aria-label="TO FIX">
					<img class="giant-index" src="/assets/index-2.svg" alt="" aria-hidden="true" draggable="false" />
					<span class="clip" style="--i:0"><span class="char">T</span></span>
					<span class="clip" style="--i:1"><span class="char">O</span></span>
					<span
						class="giant-slot"
						aria-hidden="true"
						style="--giant-tilt:9.6deg;--giant-dy:-0.36em;--giant-dx:0.15em;--pp:0.01;--pe:none"
					>
						<img class="giant-card" src="/assets/cloth-tapex4.webp" alt="" />
						<span
							class="peel giant-tape"
							style="--peel-w:0.62em;--peel-h:0.2105em;--peel-from:calc(var(--peel-edge) + 0.28 * var(--peel-span));--peel-to:calc(var(--peel-edge) + 0 * var(--peel-span));--peel-dir:88.4deg;--peel-back:url(#peel-back-black)"
							data-peel="manual"
						>
							<span class="peel-face"><span class="peel-turn"><img src="/assets/black-cloth-tape-x4.png" alt="" draggable="false" /></span></span>
							<span class="peel-flap" aria-hidden="true"><span class="peel-turn"><img src="/assets/black-cloth-tape-x4.png" alt="" draggable="false" /></span></span>
						</span>
					</span>
					<span>
						{#each 'FIX'.split('') as ch, i}
							<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
						{/each}
					</span>
				</h2>

				<span class="giant-prop giant-prop--shot" aria-hidden="true" style="--px:32%;--py:22%;--pw:21vw;--pr:-5deg;--pz:1;--pp:-0.025;--pe:power1.inOut">
					<img src="/assets/cloth-tapex4-bottomleft.webp" alt="" />
					<span
						class="peel giant-tape"
						style="--peel-w:0.62em;--peel-h:0.2105em;--peel-from:calc(var(--peel-edge) + 0.28 * var(--peel-span));--peel-to:calc(var(--peel-edge) + 0 * var(--peel-span));--peel-dir:88.4deg;--peel-back:url(#peel-back-black)"
						data-peel="manual"
					>
						<span class="peel-face"><span class="peel-turn"><img src="/assets/black-cloth-tape-x4.png" alt="" draggable="false" /></span></span>
						<span class="peel-flap" aria-hidden="true"><span class="peel-turn"><img src="/assets/black-cloth-tape-x4.png" alt="" draggable="false" /></span></span>
					</span>
				</span>

				<img class="giant-prop giant-prop--tag" src="/assets/slider/cloth/card.webp" alt="" aria-hidden="true" style="--px:-5%;--py:47%;--pw:22.71vw;--pr:12deg;--pz:1;--pp:0.04;--pe:sine.inOut" />

				<div class="hand-note giant-note" style="--px:19%;--py:-24%" aria-hidden="true">
					<div class="hand-ink">
						<svg class="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M 0 3 C 30 8 65 8 100 1" /></svg>
						<svg class="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M 6 0 C 2 33 3 70 6 100" /></svg>
						<span class="hand-line">the quick fix</span>
						<span class="hand-line">that outlasts</span>
						<span class="hand-line">the thing it fixed.</span>
					</div>
				</div>
			</div>

			<!-- Arrow 2: Up-Right -->
			<div class="diag-up-arrow" aria-hidden="true">
				<svg viewBox="0 0 150 100" fill="none">
					<path class="arrow-line" d="M4 92 C 46 86 100 58 132 16" />
					<path class="arrow-head" d="M111 20 L132 16 L123 35" />
				</svg>
			</div>

			<!-- Row 3: TO PROTECT -->
			<div class="giant-row diagup-to-horizontal">
				<h2 class="giant" aria-label="TO PROTECT">
					<img class="giant-index" src="/assets/index-3.svg" alt="" aria-hidden="true" draggable="false" />
					<span class="clip" style="--i:0"><span class="char">T</span></span>
					<span class="clip" style="--i:1"><span class="char">O</span></span>
					<span
						class="giant-slot"
						aria-hidden="true"
						style="--giant-tilt:4.8deg;--giant-dy:-0.1571em;--giant-dx:0.0785em;--pp:0.014;--pe:sine.inOut"
					>
						<img class="giant-card" src="/assets/protect-opp-tape-x4-square.webp" alt="" />
						<span
							class="peel giant-tape"
							style="--peel-w:0.62em;--peel-h:0.1961em;--peel-from:calc(var(--peel-edge) + 0.38 * var(--peel-span));--peel-to:calc(var(--peel-edge) + 0 * var(--peel-span));--peel-dir:88.4deg;--peel-back:url(#peel-back-kraft)"
							data-peel="manual"
						>
							<span class="peel-face"><span class="peel-turn"><img src="/assets/opp-tape-x4.png" alt="" draggable="false" /></span></span>
							<span class="peel-flap" aria-hidden="true"><span class="peel-turn"><img src="/assets/opp-tape-x4.png" alt="" draggable="false" /></span></span>
						</span>
					</span>
					<span>
						{#each 'PROTECT'.split('') as ch, i}
							<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
						{/each}
					</span>
				</h2>

				<span class="giant-prop giant-prop--shot" aria-hidden="true" style="--px:98%;--py:12%;--pw:17vw;--pr:5deg;--pz:3;--pp:0.045;--pe:none">
					<img src="/assets/opp-tape-last.webp" alt="" />
					<span
						class="peel giant-tape"
						style="--peel-w:0.62em;--peel-h:0.1961em;--peel-from:calc(var(--peel-edge) + 0.38 * var(--peel-span));--peel-to:calc(var(--peel-edge) + 0 * var(--peel-span));--peel-dir:88.4deg;--peel-back:url(#peel-back-kraft)"
						data-peel="manual"
					>
						<span class="peel-face"><span class="peel-turn"><img src="/assets/opp-tape-x4.png" alt="" draggable="false" /></span></span>
						<span class="peel-flap" aria-hidden="true"><span class="peel-turn"><img src="/assets/opp-tape-x4.png" alt="" draggable="false" /></span></span>
					</span>
				</span>

				<img class="giant-prop giant-prop--tag" src="/assets/sibling-opp-normal.webp" alt="" aria-hidden="true" style="--px:61%;--py:-32%;--pw:22.71vw;--pr:6deg;--pz:1;--pp:-0.02;--pe:power2.inOut" />
				<img class="giant-prop giant-prop--tag" src="/assets/sibling-opp-normal.webp" alt="" aria-hidden="true" style="--px:43%;--py:49%;--pw:22.71vw;--pr:9deg;--pz:1;--pp:0.032;--pe:power1.inOut" />

				<div class="hand-note giant-note" style="--px:25%;--py:75%" aria-hidden="true">
					<div class="hand-ink">
						<svg class="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M 0 3 C 30 8 65 8 100 1" /></svg>
						<svg class="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M 6 0 C 2 33 3 70 6 100" /></svg>
						<span class="hand-line">from our hands</span>
						<span class="hand-line">to theirs,</span>
						<span class="hand-line">arriving whole.</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Temporary HUD Tuner -->
<div class="giant-hud" data-open={hudOpen}>
	<div class="giant-hud-bar">
		<strong>GiantPinning HUD</strong>
		<div class="giant-hud-actions">
			<button type="button" onclick={copyTuner}>{copied ? 'Copied!' : 'Copy'}</button>
			<button type="button" onclick={resetTuner}>Reset</button>
			<button type="button" onclick={() => (hudOpen = !hudOpen)}>{hudOpen ? 'Hide' : 'Show'}</button>
		</div>
	</div>
	{#if hudOpen}
		<div class="giant-hud-body">
			<label>
				<span>Scrub: {scrub.toFixed(2)}</span>
				<input type="range" min="0.1" max="2" step="0.05" bind:value={scrub} onchange={() => rebuildCamera?.()} />
			</label>
			<label>
				<span>Corner Bezier: {cornerRatio.toFixed(2)}</span>
				<input type="range" min="0" max="0.35" step="0.01" bind:value={cornerRatio} onchange={() => rebuildCamera?.()} />
			</label>
			<label>
				<span>Inset: {inset.toFixed(3)}</span>
				<input type="range" min="0.01" max="0.15" step="0.005" bind:value={inset} onchange={() => rebuildCamera?.()} />
			</label>
			<label>
				<span>Open At: {openAt.toFixed(2)}</span>
				<input type="range" min="0.2" max="0.7" step="0.02" bind:value={openAt} onchange={() => rebuildCamera?.()} />
			</label>
			<label>
				<span>Parallax: {parallaxScale.toFixed(2)}x</span>
				<input type="range" min="0" max="2.5" step="0.1" bind:value={parallaxScale} />
			</label>
		</div>
	{/if}
</div>

<style>
	.giant-pinning {
		--giant-bg: #b6fe00;
		--giant-ink: #013900;
		--giant-size: 38.194vw;
		--giant-open-gx: 1vw;
		--giant-inset: 0.045;
		--giant-open-at: 0.4;
		--giant-tail: 18vw;
		--giant-arc: var(--curve-depth);
		--giant-sheet: calc(var(--screen-lg) + var(--giant-arc));
		z-index: 11;
		margin-top: calc(var(--giant-arc) * -1);
		padding-top: var(--giant-arc);
		padding-bottom: var(--giant-tail);
		background-color: transparent;
		background-image: linear-gradient(var(--giant-bg) 0 0);
		background-position: 0 100%;
		background-repeat: no-repeat;
		background-size: 100% calc(100% - var(--giant-arc) + 1px);
		position: relative;
		overflow: hidden;
	}

	.giant-brow {
		height: var(--giant-arc);
		background: var(--giant-bg);
		-webkit-mask-image: var(--section-bite);
		mask-image: var(--section-bite);
		pointer-events: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
	}

	.giant-brow::before {
		content: '';
		background: url(/assets/paper-overlay.webp);
		background-size: 100% var(--giant-sheet);
		opacity: 0.2;
		pointer-events: none;
		background-position: 0 0;
		background-repeat: no-repeat;
		position: absolute;
		inset: 0;
	}

	.giant-pinning .wrapper {
		height: var(--screen-lg);
		position: relative;
		overflow: hidden;
	}

	.giant-pinning .wrapper::before {
		content: '';
		background: url(/assets/paper-overlay.webp);
		background-size: 100% var(--giant-sheet);
		opacity: 0.2;
		pointer-events: none;
		background-position: 0 100%;
		background-repeat: no-repeat;
		position: absolute;
		inset: 0;
	}

	.giant-pinning::after {
		content: '';
		height: var(--giant-tail);
		background: url(/assets/paper-overlay.webp);
		background-size: 100vw var(--giant-sheet);
		opacity: 0.2;
		pointer-events: none;
		background-repeat: repeat;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
	}

	.giant-canvas {
		will-change: transform;
		position: absolute;
		inset: 0;
	}

	.giant-canvas > * {
		left: var(--gx);
		top: var(--gy);
		position: absolute;
	}

	.giant-pinning .top-title {
		--gx: calc(var(--giant-open-gx) - var(--giant-inset) * 100vw);
		--gy: 22vw;
		text-align: center;
		z-index: 2;
		width: 100vw;
		color: var(--giant-ink);
		flex-direction: column;
		align-items: center;
		gap: 1vw;
		display: flex;
	}

	.giant-pinning .subhead {
		background: var(--giant-ink);
		color: var(--giant-bg);
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.04vw;
		line-height: 1;
		letter-spacing: 0.04em;
		padding: 0.55vw 1.15vw;
		border-radius: 0.28vw;
		transform: rotate(-2deg);
		width: fit-content;
		margin-inline: auto;
	}

	.giant-pinning .top-title .h2 {
		font-family: var(--font-heading);
		text-align: center;
		letter-spacing: -0.188vw;
		font-size: 6.25vw;
		font-style: normal;
		font-weight: 800;
		line-height: 0.77;
		flex-direction: column;
		align-items: center;
		margin: 0;
		display: flex;
	}

	.giant-pinning .h2 .line {
		display: flex;
	}

	.down-to-horizontal {
		--gx: var(--giant-open-gx);
		--gy: 48vw;
	}
	.diagdown-to-horizontal {
		--gx: 215vw;
		--gy: 95vw;
	}
	.diagup-to-horizontal {
		--gx: 371vw;
		--gy: 48vw;
	}

	.diag-down-arrow,
	.diag-up-arrow {
		width: 26vw;
		height: 17.33vw;
		color: var(--giant-ink);
		opacity: 0.75;
	}

	.diag-down-arrow svg,
	.diag-up-arrow svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.diag-down-arrow path,
	.diag-up-arrow path {
		fill: none;
		stroke: currentColor;
		stroke-width: 0.5px;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.diag-down-arrow {
		--gx: 184vw;
		--gy: 77vw;
	}
	.diag-up-arrow {
		--gx: 338vw;
		--gy: 80vw;
	}

	.giant-row {
		width: max-content;
		color: var(--giant-ink);
	}

	.giant-row .giant {
		font-family: var(--font-heading);
		font-size: var(--giant-size);
		letter-spacing: -0.005em;
		white-space: nowrap;
		z-index: 1;
		align-items: center;
		margin: 0;
		font-weight: 800;
		line-height: 0.82;
		display: flex;
		position: relative;
	}

	.giant-row .giant-index {
		pointer-events: none;
		flex: none;
		align-self: flex-start;
		width: auto;
		max-width: none;
		height: 0.089em;
		margin: 0.078em 0.061em 0 0;
	}

	.giant-slot {
		--giant-slot: 0.5947em;
		width: var(--giant-slot);
		z-index: 2;
		rotate: var(--giant-tilt, 0deg);
		translate: calc(var(--giant-dx, 0em) + var(--pdx, 0px)) var(--giant-dy, 0em);
		will-change: transform;
		flex: none;
		position: relative;
	}

	.giant-card {
		aspect-ratio: 1;
		object-fit: cover;
		width: 100%;
		height: auto;
		box-shadow: -0.0182em 0.026em var(--drop-blur) var(--drop-ink);
		border-radius: 0.14em;
		display: block;
	}

	.giant-slot .giant-tape,
	.giant-prop--shot .giant-tape {
		--peel: 1;
		--peel-shadow: none;
		z-index: 3;
		width: 0.42em;
		position: absolute;
		top: 0;
		left: 50%;
		translate: -50% -46%;
	}

	.giant-row .giant > span {
		display: flex;
	}

	.giant-pinning .clip {
		flex: none;
		margin: -0.2em -0.05em 0;
		padding: 0.2em 0.05em 0;
		display: block;
		overflow: hidden;
	}

	.giant-pinning .char {
		display: block;
		transform: translateY(130%);
		cursor: default;
		will-change: transform;
	}

	.giant-pinning[data-reveal='live'] .char {
		transform: none;
	}

	.giant-prop {
		left: var(--px);
		top: var(--py);
		width: calc(var(--pw) * var(--gp-scale, 1));
		height: auto;
		rotate: calc(var(--pr) + var(--prot, 0deg));
		z-index: var(--pz);
		translate: var(--pdx, 0px);
		will-change: transform;
		filter: drop-shadow(0.35vw 0.5vw var(--drop-blur) var(--drop-ink));
		pointer-events: none;
		-webkit-user-select: none;
		user-select: none;
		position: absolute;
	}

	.giant-prop--shot {
		font-size: calc(var(--pw) * var(--gp-scale, 1) * 1.6815);
		filter: drop-shadow(0.7vw 1vw var(--drop-blur) var(--drop-ink));
		border-radius: 0.14em;
	}

	.giant-prop--shot > img {
		border-radius: inherit;
		width: 100%;
		height: auto;
		display: block;
	}

	/* 3D Peel Tape */
	.peel {
		rotate: var(--peel-dir, 0deg);
		--peel-bleed: 0.6vw;
		--peel-w: 0px;
		--peel-h: 0px;
		--peel-span: calc(
			var(--peel-w) * max(sin(var(--peel-dir, 0deg)), -1 * sin(var(--peel-dir, 0deg))) +
				var(--peel-h) * max(cos(var(--peel-dir, 0deg)), -1 * cos(var(--peel-dir, 0deg)))
		);
		--peel-pad: calc(var(--peel-bleed) + max(0px, calc((var(--peel-span) - var(--peel-h)) / 2)));
		--peel-shut: calc(-1 * var(--peel-pad));
		--peel-far: calc(100% + var(--peel-pad));
		--peel-edge: calc(50% - var(--peel-span) / 2);
		--peel-from: var(--peel-shut);
		--peel-to: 32%;
		--peel-cut: calc(var(--peel-from) + var(--peel) * (var(--peel-to) - var(--peel-from)));
		display: block;
		position: relative;
	}

	.peel-face {
		height: 100%;
		clip-path: polygon(
			var(--peel-shut) var(--peel-cut),
			var(--peel-far) var(--peel-cut),
			var(--peel-far) var(--peel-far),
			var(--peel-shut) var(--peel-far)
		);
		filter: var(--peel-shadow, none);
		display: block;
	}

	.peel-flap {
		width: 100%;
		height: 100%;
		left: 0;
		top: calc(-100% + 2 * var(--peel-cut) - 1px);
		clip-path: polygon(
			var(--peel-shut) var(--peel-shut),
			var(--peel-far) var(--peel-shut),
			var(--peel-far) var(--peel-cut),
			var(--peel-shut) var(--peel-cut)
		);
		position: absolute;
		transform: scaleY(-1);
	}

	.peel-turn {
		height: 100%;
		rotate: calc(-1 * var(--peel-dir, 0deg));
		display: block;
	}

	.peel img {
		object-fit: cover;
		-webkit-user-select: none;
		user-select: none;
		-webkit-user-drag: none;
		width: 100%;
		height: 100%;
		display: block;
	}

	.peel-flap img {
		filter: var(--peel-back, url(#peel-back)) brightness(calc(1 + var(--peel) * 0.22));
	}

	/* Hand Note */
	.hand-note {
		--hand-w: 12.8vw;
		--hand-ink: var(--giant-ink);
		--note-fs: 0.9722vw;
		--note-lh: 1.0417vw;
		--note-indent-x: 1.2vw;
		--note-indent-y: 0.9vw;
		--note-bow: 0.486vw;
		--note-lead-x: 1.667vw;
		--note-lead-y: 1.319vw;
		--note-tail: 1.25vw;
		--note-rule: max(1.2px, 0.087vw);
		--note-stroke: 0.02em;
		width: var(--hand-w);
		height: calc(var(--hand-w) * 0.6875);
		pointer-events: none;
		position: absolute;
		left: var(--px);
		top: var(--py);
		z-index: 1;
	}

	.hand-note .hand-ink {
		top: calc(var(--hand-w) * 0.2119 + var(--note-indent-y));
		left: calc(var(--hand-w) * 0.1447 + var(--note-indent-x));
		font-family: var(--font-note);
		font-weight: 400;
		font-size: var(--note-fs);
		line-height: var(--note-lh);
		letter-spacing: 0;
		-webkit-text-stroke: var(--note-stroke) currentColor;
		text-transform: lowercase;
		white-space: nowrap;
		text-align: left;
		color: var(--hand-ink);
		transform-origin: 0 0;
		position: absolute;
		transform: rotate(353deg);
	}

	.hand-note .hand-rule {
		max-width: none;
		position: absolute;
		overflow: visible;
	}

	.hand-note .hand-rule path {
		fill: none;
		stroke: var(--hand-ink);
		stroke-width: calc(10 * tan(atan2(var(--note-rule), var(--note-bow))));
		stroke-linecap: round;
	}

	.hand-note .hand-rule--x {
		top: calc(-1 * (var(--note-indent-y) + var(--note-rule) / 2 + var(--note-bow) * 0.435));
		left: calc(-1 * (var(--note-indent-x) + var(--note-rule) / 2 + var(--note-lead-x)));
		width: calc(100% + var(--note-indent-x) + var(--note-rule) / 2 + var(--note-lead-x) + var(--note-tail));
		height: var(--note-bow);
		transform-origin: var(--note-lead-x) 50%;
	}

	.hand-note .hand-rule--y {
		left: calc(-1 * (var(--note-indent-x) + var(--note-rule) / 2 + var(--note-bow) * 0.418));
		top: calc(-1 * (var(--note-indent-y) + var(--note-rule) / 2 + var(--note-lead-y)));
		width: var(--note-bow);
		height: calc(100% + var(--note-indent-y) + var(--note-rule) / 2 + var(--note-lead-y) + var(--note-tail));
		transform-origin: 50% var(--note-lead-y);
		rotate: 3deg;
	}

	.hand-note .hand-line {
		display: block;
	}

	/* Temporary HUD Tuner */
	.giant-hud {
		position: fixed;
		bottom: 16px;
		left: 16px;
		z-index: 900;
		background: rgba(1, 32, 0, 0.9);
		color: #b6fe00;
		border: 1px solid rgba(182, 254, 0, 0.35);
		border-radius: 10px;
		padding: 10px 12px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		width: 240px;
		backdrop-filter: blur(8px);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
	}

	.giant-hud-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.giant-hud-actions {
		display: flex;
		gap: 4px;
	}

	.giant-hud-actions button {
		background: rgba(182, 254, 0, 0.16);
		color: #b6fe00;
		border: 1px solid rgba(182, 254, 0, 0.35);
		border-radius: 5px;
		padding: 2px 6px;
		font-size: 10px;
		cursor: pointer;
	}

	.giant-hud-body {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 8px;
	}

	.giant-hud-body label {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.giant-hud-body input[type='range'] {
		width: 100%;
		accent-color: #b6fe00;
	}

	@media (prefers-reduced-motion: reduce) {
		.giant-pinning {
			--giant-size: 18vw;
		}
		.giant-pinning .wrapper {
			height: auto;
			padding: 8vw 6vw;
			overflow: visible;
		}
		.giant-canvas {
			will-change: auto;
			flex-direction: column;
			gap: 7vw;
			display: flex;
			position: static;
		}
		.giant-canvas > * {
			position: relative;
			top: auto;
			left: auto;
		}
		.giant-prop,
		.diag-down-arrow,
		.diag-up-arrow {
			display: none;
		}
		.giant-row .giant {
			white-space: normal;
		}
	}

	@media (max-width: 743px) {
		.giant-pinning {
			--giant-open-at: 0.22;
			--giant-size: 91.67vw;
			--giant-open-gx: 2.4vw;
			--giant-tail: 0vw;
			margin-bottom: calc(58vw - var(--screen-lg) / 2);
		}
		.giant-pinning .top-title {
			--gy: 52vw;
			gap: 3vw;
		}
		.giant-pinning .top-title .h2 {
			letter-spacing: -0.4vw;
			font-size: 14vw;
		}
		.down-to-horizontal {
			--gy: 115vw;
		}
		.diagdown-to-horizontal {
			--gx: 516vw;
			--gy: 228vw;
		}
		.diagup-to-horizontal {
			--gx: 890vw;
			--gy: 115vw;
		}
		.diag-down-arrow,
		.diag-up-arrow {
			width: 62.4vw;
			height: 41.6vw;
		}
		.diag-down-arrow {
			--gx: 442vw;
			--gy: 185vw;
		}
		.diag-up-arrow {
			--gx: 811vw;
			--gy: 192vw;
		}
		.giant-pinning .giant-prop {
			--pw: 45vw !important;
		}
		.giant-pinning .giant-note {
			--hand-w: 80.8vw;
			font-size: 20px !important;
		}
	}
</style>
