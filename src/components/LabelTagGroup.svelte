<script>
	export let labels;
</script>

{#each Object.keys(labels) as key}
	{#if labels[key]}
		<div
			class:sheet={key === 'sheet'}
			class:column={key === 'column'}
			title={`${key} assigned to this element`}>
			<!-- <span>{key}:</span> -->
			<span>{labels[key]}</span>
		</div>
	{/if}
{/each}

<style>
	/* span:first-of-type {
		text-transform: capitalize;
	} */

	div {
		border-radius: var(--border-radius-large);
		background: #0000000e;
		padding: 0.125rem 0.25rem;
	}

	div.sheet {
		background: hsla(124, 100%, 47%, 0.2);
	}

	div.column {
		background: hsla(179, 100%, 47%, 0.2);
	}
</style>
