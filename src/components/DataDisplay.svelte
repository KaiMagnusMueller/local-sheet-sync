<script>
	export let label = 'Data Title';
</script>

<div>
	<span class="label line-clamp">{label}</span>
	<span><slot /></span>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	span {
		font-size: var(--font-size-xsmall);
	}

	.label {
		font-weight: var(--font-weight-medium);
		/* max-width: 230px; */
	}
</style>
