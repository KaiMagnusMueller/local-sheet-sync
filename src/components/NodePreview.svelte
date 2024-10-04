<script>
	import { getUint8Array } from '../lib/helper-functions';
	export let image;
</script>

<div>
	<img src={getUint8Array(image)} alt="" />
</div>

<style>
	div {
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
</style>
