<script>
	export let title = 'View Wrapper';
</script>

<header>
	<h1>{title}</h1>
	<slot name="header"></slot>
</header>

<slot></slot>

<style>
	header {
		padding: 1rem 0.5rem;
		display: flex;
		justify-content: space-between;
		background-color: var(--figma-color-bg);
		border-block-end: 1px solid var(--figma-color-border);
	}

	h1 {
		font-size: var(--font-size-xsmall);
		font-weight: var(--font-weight-bold);
	}
</style>
