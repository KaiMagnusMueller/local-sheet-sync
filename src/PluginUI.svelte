<script>
	import DataSyncView from './components/Views/DataSyncView.svelte';
	import ProfileView from './components/Views/ProfileView.svelte';

	import * as XLSX from 'xlsx';
	import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

	import MainSideNav from './components/MainSideNav/index.svelte';

	// Variables to store workbook and sheet data
	let workbook;
	let sheetNames;
	let worksheet;
	let activeSheet;
	let activeSheetName;

	import PocketBase, { BaseAuthStore } from 'pocketbase';
	import { sendMsgToFigma } from './lib/helper-functions';

	/**
	 * The default token store for browsers with auto fallback
	 * to runtime/memory if local storage is undefined (eg. in node env).
	 */
	export class FigmaAuthStore extends BaseAuthStore {
		constructor(storageKey = 'pocketbase_auth') {
			super();

			this.storageFallback = {};
			this.storageKey = storageKey;

			// this._bindStorageEvent();
		}

		get token() {
			const data = this._storageGet(this.storageKey) || {};
			return data.token || '';
		}

		get model() {
			const data = this._storageGet(this.storageKey) || {};
			return data.model || null;
		}

		save(token, model) {
			this._storageSet(this.storageKey, {
				token: token,
				model: model,
			});

			user = model;

			handleAuthChange();

			super.save(token, model);
		}

		clear() {
			this._storageRemove(this.storageKey);

			user = null;
			handleAuthChange();

			super.clear();
		}

		_storageGet(key) {
			const rawValue = pbAuthToken || '';
			try {
				return JSON.parse(rawValue);
			} catch (e) {
				return rawValue;
			}
		}

		_storageSet(key, value) {
			let normalizedVal = value;

			if (typeof value !== 'string') {
				normalizedVal = JSON.stringify(value);
			}

			sendMsgToFigma('set-pb-auth-token', { key: key, value: normalizedVal });
			pbAuthToken = value;
		}

		_storageRemove(key) {
			sendMsgToFigma('set-pb-auth-token', { key: key, value: '' });
			pbAuthToken = null;
		}

		// _bindStorageEvent() {
		// }
	}

	let pbAuthToken;

	const pb = new PocketBase(process.env.PB_BACKEND_URL, new FigmaAuthStore());

	let user;

	window.addEventListener('message', (event) => {
		if (event.data.pluginMessage.type == 'get-pb-auth-token') {
			if (!event.data.pluginMessage.data) return;

			pbAuthToken = JSON.parse(event.data.pluginMessage.data);

			try {
				// get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
				pb.authStore.isValid && pb.collection('users').authRefresh();
			} catch (_) {
				// clear the auth store on failed refresh
				pb.authStore.clear();
			}
		}
		if (event.data.pluginMessage.type == 'restore-sheet') {
			if (event.data.pluginMessage.data) {
				// Read the workbook from the file data

				const data = decompressFromUTF16(event.data.pluginMessage.data);
				workbook = JSON.parse(data);

				console.log(workbook);

				// Get sheet names and the first sheet
				sheetNames = workbook.SheetNames;

				const firstSheetName = workbook.SheetNames[0];

				// Get the first worksheet and convert it to JSON
				worksheet = workbook.Sheets[firstSheetName];

				// Select the first sheet by default
				selectSheet(0);
			} else {
				console.log('no data to restore found');
			}
		}
		if (event.data.pluginMessage.type == 'done-apply-data') {
			isApplyingData = false;
			console.timeEnd('Elapsed time');
		}
	});

	// Function to handle file input change event
	function handleFileInput(e) {
		// Files are sent as an array in the event detail
		const file = e.detail[0];
		if (!file) return;

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
		if (!workbook) return;

		const sheet = workbook.Sheets[sheetNames[index]];
		activeSheetName = sheetNames[index];

		return (activeSheet = formatAndCleanSheet(sheet, index));
	}

	let isApplyingData = false;

	function handleApplyData(e) {
		isApplyingData = true;

		const sheetNames = Object.keys(workbook.Sheets);

		const allSheets = sheetNames.map((sheetName, i) => {
			const sheet = workbook.Sheets[sheetName];
			return formatAndCleanSheet(sheet, i);
		});

		parent.postMessage(
			{
				pluginMessage: {
					type: 'apply-data',
					data: allSheets,
				},
			},
			'*',
		);
		console.time('Elapsed time');
	}

	function formatAndCleanSheet(sheet, index) {
		let _sheet = XLSX.utils.sheet_to_json(sheet, {
			header: 1,
			defval: '',
			blankrows: false,
			skipHidden: true,
		});

		//Search for empty columns in header row
		let indexOfEmptyCell = -1;
		for (let i = 1; i < _sheet[0].length; i++) {
			let cell = _sheet[0][i];
			if (cell === '') {
				indexOfEmptyCell = i;
				break;
			}
		}

		// TODO: Move this to a separate function in the future
		if (indexOfEmptyCell !== -1) {
			// console.log(
			// 	'Empty column with index',
			// 	indexOfEmptyCell,
			// 	'detected. Removing',
			// 	_sheet[0].length - indexOfEmptyCell,
			// 	'columns.',
			// );

			//Remove empty columns
			for (let i = 0; i < _sheet.length; i++) {
				_sheet[i].splice(indexOfEmptyCell, _sheet[i].length - indexOfEmptyCell);
			}
		}

		return {
			name: sheetNames[index],
			header: _sheet[0],
			data: _sheet.slice(1),
		};
	}

	let mainSideNavItems = [
		{ title: 'Planning', icon: '🗂️', active: true, group: 'TOP' },
		{ title: 'Data Sync', icon: '🔄', active: false, group: 'TOP' },
		{
			title: 'Profile',
			icon: '🔒',
			active: false,
			group: 'BOTTOM',
		},
	];
	let currentActiveItem;
	let previousActiveItem;

	function handleAuthChange(e) {
		const profileIndex = mainSideNavItems.findIndex((item) => item.title === 'Profile');

		console.log(currentActiveItem);

		if (user) {
			mainSideNavItems[profileIndex] = {
				...mainSideNavItems[profileIndex],
				name: user.name,
				icon: undefined,
				src: `${process.env.PB_BACKEND_URL}/api/files/${user.collectionId}/${user.id}/${user.avatar}?token=`,
			};
		} else {
			mainSideNavItems[profileIndex] = {
				...mainSideNavItems[profileIndex],
				icon: '🔒',
				name: undefined,
				src: undefined,
			};
		}

		console.log(mainSideNavItems);

		mainSideNavItems = mainSideNavItems;
	}
</script>

<MainSideNav
	bind:items={mainSideNavItems}
	bind:currentActiveItem
	bind:previousActiveItem
	on:selectMainNavItem />

<div class="wrapper">
	<!-- Display the selected sheet data in a table -->
	{#if !!currentActiveItem}
		<main>
			{#if currentActiveItem.title === 'Profile'}
				<ProfileView {pb} bind:user on:authChange={(e) => handleAuthChange(e)} />
			{:else if currentActiveItem.title === 'Planning'}
				<p>Planning view</p>
			{:else if currentActiveItem.title === 'Data Sync'}
				<DataSyncView
					{activeSheet}
					{isApplyingData}
					{sheetNames}
					{activeSheetName}
					on:file-input={(e) => handleFileInput(e)}
					on:select-sheet={(e) => selectSheet(e.detail.index)}
					on:apply-data={(e) => handleApplyData}></DataSyncView>
			{/if}
		</main>
	{/if}
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		color: var(--figma-color-text);
	}

	.wrapper {
		display: flex;
		flex-direction: column;
		overflow: auto;
		width: 100%;
	}

	main {
		overflow: auto;
		flex-grow: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	header {
		padding-block-start: 0.5rem;
		margin-block-end: -0.5rem;
	}

	footer {
		border-block-start: 1px solid var(--figma-color-border);
		padding-block: 0.5rem;
		display: flex;
		padding-inline: 0.5rem;
		justify-content: space-between;
		position: sticky;
		bottom: 0;
		background-color: var(--figma-color-bg);
	}

	.table-wrapper {
		padding-inline: 0.5rem;
		overflow: scroll;
	}

	table {
		border-collapse: collapse;
		font-size: var(--font-size-xsmall);
		margin-block-end: 0.5rem;
	}

	th,
	td {
		border: 1px solid var(--figma-color-border);
		overflow: hidden;
	}

	thead {
		/* position: sticky;
		top: 0; */
		background-color: var(--figma-color-bg);
		border-block-start: 1px solid var(--figma-color-border);
	}

	th:first-of-type {
		border-top-left-radius: var(--border-radius-large);
	}

	:global(.line-clamp-3) {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.line-clamp-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.line-clamp) {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.pointer-none {
		pointer-events: none;
	}

	:global(.horizontal-group) {
		display: flex;
		gap: 0.5rem;
	}

	/* main {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 0.5rem;
	} */

	/* header {
		padding-block-start: 0.5rem;
		margin-block-end: -0.5rem;
		backdrop-filter: blur(10px);
		background-color: rgba(255, 255, 255, 0.716);
		position: sticky;
		top: 0;
	} */

	/* footer {
		border-block-start: 1px solid var(--figma-color-border);
		padding-block: 0.5rem;
		display: flex;
		padding-inline: 0.5rem;
		justify-content: space-between;
		position: sticky;
		bottom: 0;
		background-color: var(--figma-color-bg);
	} */
</style>
