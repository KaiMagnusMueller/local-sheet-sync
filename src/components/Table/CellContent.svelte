<script>
	import { IconLinkConnected, IconButton } from 'figma-plugin-ds-svelte';
	import { createEventDispatcher } from 'svelte';

	export let content = 'Content';
	export let header = false;
	export let showButton = false;

	let dispatch = createEventDispatcher();
</script>

<div class="content-wrapper" class:header>
	<span class="line-clamp">{content}</span>

	<div class="button-container" class:visible={showButton}>
		<!-- TODO: Context menu, to select all three (sheet, column, row) at the same time -->
		<IconButton
			on:click={(e) => dispatch('buttonClick', e)}
			rounded
			iconName={IconLinkConnected} />
	</div>
</div>

<style>
	.content-wrapper {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		position: relative;
		padding: 0.5rem;
	}

	.content-wrapper.header span {
		font-weight: var(--font-weight-bold);
		text-align: left;
	}

	span {
		/* word-break: break-all; */
	}

	.button-container {
		position: absolute;
		right: 0;
		display: none;
		background: linear-gradient(to right, transparent 0%, var(--figma-color-bg) 25%);
		padding-inline-start: 0.5rem;
	}

	.button-container.visible {
		display: block;
	}

	.content-wrapper:hover .button-container {
		display: block;
	}
</style>
