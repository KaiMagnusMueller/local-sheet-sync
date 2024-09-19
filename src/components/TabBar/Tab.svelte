<script>
	import { createEventDispatcher } from 'svelte';

	import { IconLinkConnected, IconButton } from 'figma-plugin-ds-svelte';

	export let activeIndex;
	export let item = 'Tabname';
	export let index;

	let dispatch = createEventDispatcher();
</script>

<li class:active={index === activeIndex}>
	<button on:click|self>
		<span data-label={item}>
			{item}
		</span>
	</button>

	<IconButton on:click={(e) => dispatch('buttonClick', e)} rounded iconName={IconLinkConnected}
	></IconButton>
</li>

<style>
	li {
		border-radius: var(--border-radius-large);
		display: flex;
		overflow: hidden;
		list-style: none;
		flex-shrink: 0;
	}

	li:hover {
		background-color: var(--figma-color-bg-hover);
	}

	button {
		border: none;
		padding: 0.5rem;
		font-size: var(--font-size-xsmall);
		background: none;
		position: relative;
	}

	button:hover {
		background: hsla(0, 0%, 50%, 0.09);
	}

	span {
		/* max-width: 120px; */
		visibility: hidden;
		position: relative;
		white-space: nowrap;
		pointer-events: none;
	}

	span:after {
		content: attr(data-label);
		visibility: visible;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		white-space: nowrap;
		font-weight: var(--font-weight-medium);
		color: var(--figma-color-text-secondary);
	}

	li.active span::after {
		color: var(--figma-color-text);
		font-weight: var(--font-weight-bold);
	}

	.active {
		background-color: var(--figma-color-bg-selected);
		position: sticky;
		left: 0;
		z-index: 1;
	}

	li.active:hover {
		background-color: var(--figma-color-bg-selected-hover);
	}
</style>
