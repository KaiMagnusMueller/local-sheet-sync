<script>
	import DataDisplay from './DataDisplay.svelte';
	import { Button } from 'figma-plugin-ds-svelte';

	export let validFileTypes = '.xlsx';
	export let fileName = 'Last import';
	export let lastUpdatedTime = 'No file selected';

	let filePicker;

	function handleFileInput(e) {
		const files = e.target.files;
		console.log(files);
		fileName = files[0].name;
		lastUpdatedTime =
			'Last updated: ' +
			new Date().toLocaleString([], {
				day: 'numeric',
				month: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
	}
</script>

<div>
	<input
		bind:this={filePicker}
		type="file"
		id="file-input"
		name="file-input"
		hidden
		on:change={handleFileInput}
		on:change
		accept={validFileTypes} />

	<Button on:click={filePicker.click()} variant="primary">Import File</Button>

	<DataDisplay label={fileName}>{lastUpdatedTime}</DataDisplay>
</div>

<style>
	div {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		align-items: center;
	}
</style>
