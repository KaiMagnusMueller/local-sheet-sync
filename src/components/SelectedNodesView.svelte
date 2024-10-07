<script>
	import { IconButton } from 'figma-plugin-ds-svelte';
	import { sendMsgToFigma } from '../lib/helper-functions';
	import CenteredCircles3 from '../assets/icons/centered-circles-3.svg';

	export let nodes = [];
</script>

<ul>
	{#each nodes as node}
		<li>
			<span>{node.name}</span>
			<IconButton
				rounded
				on:click={sendMsgToFigma('select-nodes', [node.id])}
				iconName={CenteredCircles3} />
		</li>
	{/each}
</ul>
