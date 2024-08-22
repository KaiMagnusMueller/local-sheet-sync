<script>
	import * as XLSX from 'xlsx';
	import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

	// Variables to store workbook and sheet data
	let workbook;
	let sheetNames;
	let worksheet;
	let activeSheet;

	window.addEventListener('message', (event) => {
		if (event.data.pluginMessage.type == 'restore-sheet') {
			if (event.data.pluginMessage.data) {
				// Read the workbook from the file data

				const data = decompressFromUTF16(event.data.pluginMessage.data);
				workbook = JSON.parse(data);

				// Get sheet names and the first sheet
				sheetNames = workbook.SheetNames;

				const firstSheetName = workbook.SheetNames[0];

				// Get the first worksheet and convert it to JSON
				worksheet = workbook.Sheets[firstSheetName];

				// Select the first sheet by default
				selectSheet(0);
			} else {
				console.log('no tutorials viewed...');
			}
		}
	});

	// Function to handle file input change event
	function handleFileInput(e) {
		const file = e.target.files[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const data = new Uint8Array(e.target.result);

				// Read the workbook from the file data
				workbook = XLSX.read(data, { type: 'array' });

				saveSheet(workbook);

				// Get sheet names and the first sheet
				sheetNames = workbook.SheetNames;
				const firstSheetName = workbook.SheetNames[0];

				// Get the first worksheet and convert it to JSON
				worksheet = workbook.Sheets[firstSheetName];

				// Select the first sheet by default
				selectSheet(0);
			};
			reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
		}
	}

	async function saveSheet(data) {
		const dataToSave = compressToUTF16(JSON.stringify(data));

		parent.postMessage(
			{
				pluginMessage: {
					type: 'save-sheet',
					data: dataToSave,
				},
			},
			'*',
		);
	}

	// Function to select a sheet by index
	function selectSheet(index) {
		if (!workbook) {
			return;
		}

		const sheet = workbook.Sheets[sheetNames[index]];
		let _activeSheet = XLSX.utils.sheet_to_json(sheet, {
			header: 1,
			defval: '',
			blankrows: false,
			skipHidden: true,
		});

		//Search for empty columns in header row
		let indexOfEmptyCell = -1;
		for (let i = 1; i < _activeSheet[0].length; i++) {
			let cell = _activeSheet[0][i];
			if (cell === '') {
				indexOfEmptyCell = i;
				break;
			}
		}

		// TODO: Move this to a separate function in the future
		if (indexOfEmptyCell !== -1) {
			console.log(
				'Empty column with index',
				indexOfEmptyCell,
				'detected. Removing',
				_activeSheet[0].length - indexOfEmptyCell,
				'columns.',
			);

			//Remove empty columns
			for (let i = 0; i < _activeSheet.length; i++) {
				_activeSheet[i].splice(indexOfEmptyCell, _activeSheet[i].length - indexOfEmptyCell);
			}
		}

		return (activeSheet = {
			name: sheetNames[index],
			header: _activeSheet[0],
			data: _activeSheet.slice(1),
		});
	}

	function handleAssignLabel(e) {
		parent.postMessage(
			{
				pluginMessage: {
					type: 'assign-layer-name',
					data: {
						sheet: e.target.dataset.sheet,
						column: e.target.dataset.column,
						row: e.target.dataset.row,
					},
				},
			},
			'*',
		);
	}

	function handleApplyData(e) {
		parent.postMessage(
			{
				pluginMessage: {
					type: 'apply-data',
					data: activeSheet,
				},
			},
			'*',
		);
	}
</script>

<div class="wrapper">
	<!-- Display the selected sheet data in a table -->
	<header>
		<!-- File input to upload Excel file -->
		<input type="file" name="file-input" on:change={handleFileInput} />
		<button on:click={(e) => handleApplyData(e)}>Apply data</button>
	</header>

	<main>
		{#if activeSheet}
			<button data-sheet={activeSheet.name} on:click|self={(e) => handleAssignLabel(e)}
				>{activeSheet.name}</button>

			<table>
				{#if activeSheet.header}
					<thead>
						<tr>
							{#each activeSheet.header as colHeaderCell}
								<th
									><button
										data-column={colHeaderCell}
										on:click|self={(e) => handleAssignLabel(e)}
										><span class="line-clamp-3">{colHeaderCell}</span></button
									></th>
							{/each}
						</tr>
					</thead>
				{/if}

				<tbody>
					{#each activeSheet.data as row, index}
						<tr>
							{#each row as cell, index}
								<td><span class="line-clamp-2">{cell}</span></td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</main>

	<!-- Display buttons to select different sheets -->
	{#if sheetNames}
		<menu>
			{#each sheetNames as sheet, index}
				<ul>
					<button
						on:click|self={() => selectSheet(index)}
						class:active={index === sheetNames.indexOf(activeSheet.name)}
						><span class="line-clamp-2">{sheet}</span></button>
				</ul>
			{/each}
		</menu>
	{/if}
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
	}

	.wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	header,
	main {
		gap: 1rem;
		padding-inline: 0.5rem;
	}

	header {
		padding-block-start: 0.5rem;
		display: flex;
		justify-content: space-between;
	}

	main {
		display: flex;
		flex-direction: column;
		overflow: scroll;
	}

	table {
		border-collapse: collapse;
	}

	th,
	td {
		border: 1px solid #000;
		padding: 0.5rem;
	}

	th span,
	td span {
		min-width: min-content;
		max-width: 200px;
	}

	menu {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		overflow-x: scroll;
		position: sticky;
		bottom: 0;
		background-color: var(--figma-color-bg-secondary);
		padding: 0.5rem;
		padding-block-end: 0.8rem;
	}

	ul {
		list-style: none;
		display: contents;
		/* padding: 0.5rem;
		border: 1px solid #000; */
	}

	button {
		display: flex;
		align-items: center;
		padding: 0.25rem;
	}

	button.active {
		background-color: var(--figma-color-highlight);
	}

	button span {
		pointer-events: none;
	}

	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.line-clamp {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.pointer-none {
		pointer-events: none;
	}
</style>
