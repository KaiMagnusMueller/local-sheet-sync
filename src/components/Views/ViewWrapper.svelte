<script>
	import { Button, IconButton, IconBack } from 'figma-plugin-ds-svelte';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let breadcrumbs = ['View Wrapper'];
</script>

<header>
	<div class="left-group">
		{#each breadcrumbs as item, index}
			{#if breadcrumbs.length > 1 && index !== breadcrumbs.length - 1}
				<button on:click={() => dispatch('navToIndex', index)}>{item}</button>
				<IconButton
					on:click={() => dispatch('navToIndex', index)}
					rounded
					iconName={IconBack} />
			{:else}
				<button disabled>{item}</button>
			{/if}
		{/each}
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
		min-height: 2.5rem;
	}

	header div {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	button {
		font-weight: var(--font-weight-bold);
	}

	.view-content {
		/* margin: 0 0.5rem; */
		flex-grow: 1;
	}
</style>
