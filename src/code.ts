import { loadFonts, postMessageToast, selectNodesById } from './lib/figma-backend-utils';
import { getLabels, mergeLabels } from './lib/handle-labels';
import { copyNode, getAncestorNodes, getAncestorNodeArray, getNodesToApplyData, getNodesToSearch, groupNodes } from './lib/node-tree-helpers';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

console.clear();
figma.showUI(__html__, { width: 680, height: 420, themeColors: true });

// Possibly offer this as option
figma.skipInvisibleInstanceChildren = true;
let documentNode = figma.root;

let sheet = documentNode.getPluginData('sheet');
// TODO: Add settings
let settings = documentNode.getPluginData('settings');

let activityHistory = documentNode.getPluginData('activity-history');

// ---------------------------------
// ON STARTUP
// ---------------------------------
if (sheet) {
    console.log("Loading sheet data");
    figma.ui.postMessage({
        type: 'restore-sheet',
        data: sheet,
    });
}

let pocketbase_auth_token;

try {
    figma.clientStorage.getAsync('pocketbase_auth').then(auth => {
        pocketbase_auth_token = auth || "";
        // console.log("Getting auth token:", pocketbase_auth_token);
        figma.ui.postMessage({
            type: 'get-pb-auth-token',
            data: pocketbase_auth_token,
        });
    });

} catch (error) {
    pocketbase_auth_token = ""
    console.error("Error retrieving pocketbase_auth:", error);
}

const currentUser = {
    id: figma.currentUser.id,
    name: figma.currentUser.name
}

figma.ui.postMessage({
    type: 'current-user',
    data: currentUser,
});

if (activityHistory) {
    announceActivityHistory(activityHistory)
} else {
    activityHistory = "[]";
}

let parsedActivityHistory = JSON.parse(activityHistory);


async function getAncestorNodesContainingNodesWithLabels(selection: readonly SceneNode[]) {
    let nodesToSearch = getNodesToSearch(selection);
    let ancestorNodes = getAncestorNodes(nodesToSearch);

    let ancestorNodesContainingNodesWithLabels = ancestorNodes.filter(node => {
        if (!("findOne" in node)) { return false };
        return node.findOne(n => !!n.name.match(/({.*})/));
    });

    let nodePlannerSummary: {
        rootNode: SNode,
        preview: Uint8Array,
        groupedNodesWithLabels: TreeNode[][]
    }[] = []

    // Collect all exportAsync promises
    let exportPromises = ancestorNodesContainingNodesWithLabels.map(async node => {
        const nodesToApplyData = getNodesToApplyData([node]);
        const selectedNodesLineage = nodesToApplyData.map(node => { return getAncestorNodeArray([node]) });
        const groupedNodes = groupNodes(selectedNodesLineage);


        let preview = await node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 300 } });
        nodePlannerSummary.push({
            rootNode: copyNode(node),
            preview: preview,
            groupedNodesWithLabels: groupedNodes
        });
    });



    // Wait for all exportAsync promises to resolve
    await Promise.all(exportPromises);

    figma.ui.postMessage({
        type: 'current-page-labels-with-data',
        data: compressToUTF16(JSON.stringify(nodePlannerSummary)),
    });
}




// ---------------------------------
// ON PLUGIN MESSAGE
// ---------------------------------
figma.ui.onmessage = (msg) => {
    switch (msg.type) {
        case "select-nodes":
            // Selects all nodes with the given IDs. The IDs are passed as an array in msg.data.
            selectNodesById(msg.data, true);

            break;
        case 'save-sheet':
            const sheetData = msg.data;
            documentNode.setPluginData('sheet', sheetData);

            break;
        case "assign-layer-name":
            const newLabels: Labels = msg.data
            applyLabelsToSelection(figma.currentPage.selection, newLabels);

            break;
        case "apply-data":
            applyDataToSelection(figma.currentPage.selection, msg.data);

            break
        case "set-pb-auth-token":
            console.log("Setting auth token:", msg.data);
            const authData = msg.data;
            figma.clientStorage.setAsync(authData.key, authData.value);

            break;
        case "get-ancestor-nodes-with-labels":
            getAncestorNodesContainingNodesWithLabels(figma.currentPage.selection);

            break;
        default:
            break;
    }
};


// ---------------------------------
// HANDLE MESSAGES
// ---------------------------------
function applyLabelsToSelection(currentSelection: readonly SceneNode[], newLabels: Labels) {
    currentSelection.forEach(node => {
        const { existingLabels, nodeName } = getLabels(node.name);
        const mergedLabels = mergeLabels(existingLabels, newLabels);

        if (!mergedLabels) {
            node.name = nodeName;
        } else {
            const newName = nodeName + " " + JSON.stringify(mergedLabels);
            node.name = newName;
        }
    });
}



async function applyDataToSelection(currentSelection: readonly SceneNode[], dataToApply) {
    let updatedNodes = 0

    const nodesToSearch = getNodesToSearch(currentSelection);
    const nodesToApplyData = getNodesToApplyData(nodesToSearch);

    await loadFonts(nodesToApplyData);

    const selectedNodesLineage = nodesToApplyData.map(node => { return getAncestorNodeArray([node]) });
    const groupedNodes = groupNodes(selectedNodesLineage);

    // console.log("NodesLineage:", selectedNodesLineage);
    console.log("Grouped nodes:", groupedNodes);

    groupedNodes.forEach(group => {
        group.forEach(rootNode => {
            rootNode.childNodes.forEach((node, i) => {
                applyData(node, i, node.labels, dataToApply.data);
                updatedNodes++;
            });
        });
    });

    console.log("Applied data to", updatedNodes, updatedNodes !== 1 ? "elements" : "element");

    const historyItem: HistoryItem = {
        fileName: dataToApply.fileName,
        action: "applyData",
        timestamp: new Date().toISOString(),
        user: currentUser,
    }


    // TODO: Move this to a function


    updateActivityHistory(historyItem);

    figma.ui.postMessage({
        type: 'done-apply-data'
    });
}


function applyData(node, i: number, labels: Labels, dataToApply) {
    if (!labels.column) {
        return console.log("Node has no column definiton.")
    }

    if (!labels.sheet) {
        console.log("Node has no sheet definition, using default sheet 0");
    }

    const sheetIndex = Math.max(dataToApply.findIndex(e => { return e.name === labels.sheet }), 0);
    const columnIndex = dataToApply[sheetIndex].header.findIndex(e => { return e === labels.column })

    if (sheetIndex < 0) {
        return console.log("Sheet does not exist in imported data. Sheet name:", labels.sheet);
    }
    if (columnIndex < 0) {
        return console.log("Column does not exist in sheet. Sheet name:", labels.sheet, "Column name:", labels.column);

    }

    const sheetDataToApply = dataToApply[sheetIndex].data //2D Array of sheet

    const cellData = sheetDataToApply[i % sheetDataToApply.length][columnIndex]

    // console.log(cellData);

    node.node.characters = cellData.toString();
}

function updateActivityHistory(historyItem: HistoryItem) {
    parsedActivityHistory.push(historyItem);

    activityHistory = JSON.stringify(parsedActivityHistory);
    documentNode.setPluginData('activity-history', activityHistory);

    announceActivityHistory(activityHistory)
}

function announceActivityHistory(activityHistory) {
    figma.ui.postMessage({
        type: 'announce-activity-history',
        data: activityHistory,
    });
};

// ---------------------------------
// SELECTION CHANGE EVENT
// ---------------------------------
figma.on('selectionchange', handleSelectionChange);

function handleSelectionChange() {
    // @ts-ignore
    let currentSelection: Array<SceneNode>;

    try {
        // @ts-ignore
        currentSelection = figma.currentPage.selection;
    } catch (error) {
        postMessageToast('Node is hidden and inacessible to the plugin');
        return;
    }

    figma.ui.postMessage({
        type: 'selection-changed',
        data: currentSelection,
    });
}




