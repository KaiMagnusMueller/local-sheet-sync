<script>
	import { createEventDispatcher } from 'svelte';

	export let item;

	let dispatch = createEventDispatcher();
</script>

<li class="nav-item">
	<button on:click|self class:active={item.active} title={item.title}>
		<span data-label={item.title}>
			{item.icon}
		</span>
	</button>
</li>

<style>
	li {
		user-select: none;
	}

	button {
		border: none;
		padding: 0;
		font-size: var(--font-size-xsmall);
		background: none;
		position: relative;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--figma-color-bg-secondary);
		border-radius: 6px;
		border: 2px solid transparent;
		width: 2rem;
		aspect-ratio: 1;
	}
	span {
		pointer-events: none;
	}

	.nav-item {
	}

	button.active {
		border-color: var(--figma-color-border-brand-strong);
	}

	button:hover {
		background-color: var(--figma-color-bg-hover);
	}
</style>
