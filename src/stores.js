import { readable, writable } from 'svelte/store';

export let UIState = writable({
	showMainMenu: true,
	showSearchResults: false,
	showAboutScreen: false,
});

export let defaultSettings = readable({
	recentSearchLength: 20,
	rememberNodeFilterCounts: true,
	compactMode: false,
});

export let settings = writable({});

export let tutorials = writable([
	{
		id: 1,
		title: 'Tree Select',
		body: 'Quickly select elements with the same name or type in your designs',
		link: {
			title: 'Learn more',
			href: 'https://www.kaimagnus.de/articles/using-the-tree-navigator-plugin',
		},
		image: 'https://res.cloudinary.com/dm3a0qioc/image/upload/v1678665215/Layer%20Tree%20Search%20Plugin/LayerTree_mdly1q.png',
		viewed: false,
	},
	{
		id: 2,
		title: 'Recent Searches',
		body: 'Rerun a search to go back to a previous selection',
		link: {
			title: 'Learn more',
			href: 'https://www.kaimagnus.de/articles/using-the-tree-navigator-plugin#recent-searches',
		},
		image: 'https://res.cloudinary.com/dm3a0qioc/image/upload/v1678738209/Layer%20Tree%20Search%20Plugin/RecentSearches_eprbxa.png',
		viewed: false,
	},
	{
		id: 3,
		title: 'Tip: Narrow down your selection',
		body: "You can search inside your layer tree selection with the 'Current selection' filter",
		image: 'https://res.cloudinary.com/dm3a0qioc/image/upload/v1709913838/Layer%20Tree%20Search%20Plugin/NarrowSearch_axkfrv.png',
		viewed: false,
	},
	{
		id: 4,
		title: 'New Layer Type Icons',
		body: 'Not sure which layer to select? Layer type icons now help you choose the right one.',
		image: 'https://res.cloudinary.com/dm3a0qioc/image/upload/v1709916526/Layer%20Tree%20Search%20Plugin/TreeIcons_v1ipto.png',
		viewed: false,
	},
]);
