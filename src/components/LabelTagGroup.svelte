<script>
	export let labels;
</script>

{#each Object.keys(labels) as key}
	{#if labels[key]}
		<div
			class="tag"
			class:green={key === 'sheet'}
			class:blue={key === 'column'}
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
</style>
