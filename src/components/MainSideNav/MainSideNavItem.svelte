<script>
	export let item;
</script>

<li>
	<button
		on:click|self
		class:active={item.active}
		title={item.title}
		class:profile-img={item.src}>
		{#if item.icon}
			<span data-label={item.title}>
				{item.icon}
			</span>
		{:else}
			<img src={item.src} alt={item.name} />
		{/if}
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

	button.active {
		border-color: var(--figma-color-border-brand-strong);
	}

	button:hover {
		background-color: var(--figma-color-bg-hover);
	}

	.profile-img {
		border-radius: 9999px;
		background-color: var(--figma-color-bg-secondary);
		overflow: hidden;
		border: 2px solid var(--figma-color-border-brand-strong);
		padding: 0;
	}

	span,
	img {
		pointer-events: none;
	}

	img {
		width: 100%;
		height: 100%;
	}
</style>
