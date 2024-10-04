<script>
	import { IconButton, IconBack } from 'figma-plugin-ds-svelte';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let showNavBack = false;
	export let title = 'View Wrapper';
</script>

<header>
	<div class="left-group">
		{#if showNavBack}
			<IconButton on:click={() => dispatch('navBack', {})} rounded iconName={IconBack} />
		{/if}

		<h1>{title}</h1>
	</div>
	<div class="right-group">
		<slot name="header"></slot>
	</div>
</header>

<div class="view-content">
	<slot></slot>
</div>

<style>
	header {
		padding-inline: 0.5rem;
		display: flex;
		justify-content: space-between;
		background-color: var(--figma-color-bg);
		border-block-end: 1px solid var(--figma-color-border);
	}

	header div {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	h1 {
		font-size: var(--font-size-xsmall);
		font-weight: var(--font-weight-bold);
		line-height: var(--font-line-height);
		padding-block: 0.75rem;
	}

	.view-content {
		/* margin: 0 0.5rem; */
		flex-grow: 1;
	}
</style>
