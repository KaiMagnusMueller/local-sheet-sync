<script>
	import DataDisplay from './DataDisplay.svelte';
	import { Button } from 'figma-plugin-ds-svelte';

	export let validFileTypes = '.xlsx';
	export let fileName = '';
	export let lastUpdatedTime = '';

	let filePicker;
</script>

<div>
	<input
		bind:this={filePicker}
		type="file"
		id="file-input"
		name="file-input"
		hidden
		on:change
		accept={validFileTypes} />

	<Button on:click={filePicker.click()} variant="primary">Import File</Button>

	<DataDisplay label={fileName || 'Last import'}
		>{'Last updated: ' +
			new Date(lastUpdatedTime).toLocaleString([], {
				day: 'numeric',
				month: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}) || 'No file selected'}</DataDisplay>
</div>

<style>
	div {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		align-items: center;
	}
</style>
