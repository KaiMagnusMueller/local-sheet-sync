<script>
	export let images = [];
	import { getUint8Array } from '../lib/helper-functions';

	export let aspectRatio = '1.75/1';
	export let width = '';

	// When there are many different controls, use a wrapper div with a style display:contents like this:
	// <div slot="hoverControls" style="display: contents;">
</script>

<div class="preview-container" style="aspect-ratio: {aspectRatio}; width: {width}">
	{#each images as image, index}
		<div class="image-container">
			<img
				class="shadow"
				style="transform: rotate({images.length > 1
					? -10 + (20 / (images.length - 1)) * index
					: 0}deg);"
				src={getUint8Array(image)}
				alt="" />
		</div>
	{/each}

	{#if $$slots.hoverControls}
		<div class="hover-controls">
			<slot name="hoverControls"></slot>
		</div>
	{/if}
</div>

<style>
	.preview-container {
		border-radius: var(--border-radius-large);
		background-color: var(--figma-color-bg-secondary);
		padding: 0.5rem;
		position: relative;
		/* border: 2px solid var(--figma-color-border); */
	}

	.image-container {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100%;
		padding: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		transform: translate(-50%, -50%);
		transform-origin: center;
		/* padding: 1rem; */
	}

	img {
		/* width: 100%; */
		object-fit: contain;
		max-width: 100%;
		max-height: 100%;
		background-color: white;
		border-radius: var(--border-radius-small);
	}

	.shadow {
		/* class:shadow={images.length > 1} */
		box-shadow: 0 0 8px #bbbbbb;
	}

	@media (prefers-color-scheme: dark) {
		.shadow {
			box-shadow: 0 0 8px #333333;
		}
	}

	.hover-controls {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem;
		display: none;
		background-color: var(--figma-color-bg);
		border-radius: 9px;
		box-shadow:
			0px 0px 0.5px rgba(0, 0, 0, 0.3),
			0px 1px 3px rgba(0, 0, 0, 0.15);
	}

	.preview-container:hover .hover-controls {
		display: flex;
	}
</style>
