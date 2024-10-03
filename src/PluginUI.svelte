<script>
	import PocketBase, { BaseAuthStore } from 'pocketbase';
	import * as XLSX from 'xlsx';
	import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
	import { sendMsgToFigma } from './lib/helper-functions';

	import DataSyncView from './components/Views/DataSyncView.svelte';
	import ProfileView from './components/Views/ProfileView.svelte';
	import MainSideNav from './components/MainSideNav/index.svelte';
	import PlanningView from './components/Views/PlanningView.svelte';

	let isApplyingData = false;
	let isFetchingPlanningData = true;
	let currentSaveVersion = '0.1';

	let currentUser = {
		id: '',
		name: '',
	};

	// Variables to store workbook and sheet data
	let sheetNames;

	let currentFile = {
		fileName: '',
		date: '',
		data: {},
		activeSheet: 0,
		createdByUser: {
			id: '',
			name: '',
		},
		saveVersion: '',
	};

	let activityHistory = [];
	let mostRecentHistoryItem;

	let labelsWithDataInCurrentPage = [];

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
		switch (event.data.pluginMessage.type) {
			case 'restore-sheet':
				// Use this event as a general startup event
				// This always fires when the plugin is opened and ready
				if (!event.data.pluginMessage.data) return console.log('no data to restore found');

				// Read the workbook from the file data
				const data = decompressFromUTF16(event.data.pluginMessage.data);
				currentFile = JSON.parse(data);
				console.log(currentFile);
				sheetNames = currentFile.data.map((sheet) => sheet.name);

				setTimeout(() => {
					sendMsgToFigma('get-ancestor-nodes-with-labels');
				}, 1000);

				break;
			case 'done-apply-data':
				isApplyingData = false;
				console.timeEnd('Elapsed time');
				break;
			case 'current-user':
				currentUser = event.data.pluginMessage.data;
				break;
			case 'announce-activity-history':
				if (!event.data.pluginMessage.data) return;
				activityHistory = JSON.parse(event.data.pluginMessage.data);
				mostRecentHistoryItem = activityHistory[activityHistory.length - 1];
				break;
			case 'get-pb-auth-token':
				if (!event.data.pluginMessage.data) return;
				pbAuthToken = JSON.parse(event.data.pluginMessage.data);
				try {
					// get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
					pb.authStore.isValid && pb.collection('users').authRefresh();
				} catch (_) {
					// clear the auth store on failed refresh
					pb.authStore.clear();
				}
				break;
			case 'current-page-labels-with-data':
				labelsWithDataInCurrentPage = JSON.parse(
					decompressFromUTF16(event.data.pluginMessage.data),
				);
				isFetchingPlanningData = false;
				break;
			case 'selection-changed':
				console.log('selection changed');
				break;
			default:
				break;
		}
	});

	// Function to handle file input change event
	function handleFileInput(e) {
		// Files are sent as an array in the event detail
		const file = e.detail[0];
		if (!file) return;

		const reader = new FileReader();
		reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
		reader.onload = (e) => {
			const data = new Uint8Array(e.target.result);

			// Read the workbook from the file data
			// For now use only default formatting in the sheet_to_json method
			// In the future, consider parsing dates and currencies
			const workbook = XLSX.read(data, { type: 'array', cellDates: true });
			console.log(workbook);
			const sheets = workbook.SheetNames.map((sheetName, i) => {
				const sheet = workbook.Sheets[sheetName];
				return formatAndCleanSheet(sheet, sheetName, i);
			});

			currentFile = {
				fileName: file.name,
				date: new Date().toISOString(),
				data: sheets,
				activeSheet: 0,
				createdByUser: currentUser,
				currentSaveVersion: currentSaveVersion,
			};

			sheetNames = currentFile.data.map((sheet) => sheet.name);

			saveFile(currentFile);
		};
	}

	async function saveFile(data) {
		const dataToSave = compressToUTF16(JSON.stringify(data));
		sendMsgToFigma('save-sheet', dataToSave);
	}

	function handleApplyData(e) {
		isApplyingData = true;
		sendMsgToFigma('apply-data', currentFile);
		console.time('Elapsed time');
	}

	function formatAndCleanSheet(sheet, sheetName, index) {
		let _sheet = XLSX.utils.sheet_to_json(sheet, {
			header: 1,
			defval: '',
			blankrows: false,
			skipHidden: true,
			raw: false,
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
			name: sheetName,
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
				<PlanningView {labelsWithDataInCurrentPage} {isFetchingPlanningData}></PlanningView>
			{:else if currentActiveItem.title === 'Data Sync'}
				<DataSyncView
					{currentFile}
					{isApplyingData}
					{sheetNames}
					{mostRecentHistoryItem}
					on:file-input={(e) => handleFileInput(e)}
					on:select-sheet={(e) => (currentFile.activeSheet = e.detail.index)}
					}
					on:apply-data={(e) => handleApplyData()}></DataSyncView>
			{/if}
		</main>
	{/if}
</div>

<style>
	:global(menu, ul, li) {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		margin-block-start: 0;
		margin-block-end: 0;
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

	:global(.line-clamp-3) {
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.line-clamp-2) {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.line-clamp) {
		display: -webkit-box;
		line-clamp: 1;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.pointer-none) {
		pointer-events: none;
	}

	:global(.horizontal-group) {
		display: flex;
		gap: 0.5rem;
	}
</style>
