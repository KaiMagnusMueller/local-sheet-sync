<script>
	import { getUint8Array } from '../lib/helper-functions';
	export let image;

	// When there are many different controls, use a wrapper div with a style display:contents like this:
	// <div slot="hoverControls" style="display: contents;">
</script>

<div class="preview-container">
	<img src={getUint8Array(image)} alt="" />

	{#if $$slots.hoverControls}
		<div class="hover-controls">
			<slot name="hoverControls"></slot>
		</div>
	{/if}
</div>

<style>
	.preview-container {
		border-radius: var(--border-radius-large);
		aspect-ratio: 1.75/1;
		height: 128px;
		background-color: var(--figma-color-bg-secondary);
		padding: 0.5rem;
		position: relative;
		/* border: 2px solid var(--figma-color-border); */
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
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
