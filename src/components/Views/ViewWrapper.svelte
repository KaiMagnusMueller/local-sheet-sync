<script>
	export let title = 'View Wrapper';
</script>

<header>
	<h1>{title}</h1>
	<slot name="header"></slot>
</header>

<div>
	<slot></slot>
</div>

<style>
	header {
		padding: 0.75rem 0.5rem;
		display: flex;
		justify-content: space-between;
		background-color: var(--figma-color-bg);
		border-block-end: 1px solid var(--figma-color-border);
	}

	h1 {
		font-size: var(--font-size-xsmall);
		font-weight: var(--font-weight-bold);
		line-height: var(--font-line-height);
	}

	div {
		/* margin: 0 0.5rem; */
		flex-grow: 1;
	}
</style>
