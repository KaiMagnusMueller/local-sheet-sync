import { getLabels } from "./handle-labels";

export function getAncestorNodeArray(selection) {
    let ancestorNodeArray = [];
    selection.forEach((elem) => {
        ancestorNodeArray = ancestorNodeArray.concat(getLineageNodeArray(elem));
    });
    ancestorNodeArray.forEach((elem) => {
        if (elem.type === 'PAGE') {
            delete elem.parent;
        }
    });
    return ancestorNodeArray;
}

/**
 * Retrieves an array of lineage nodes for a given current node.
 *
 * @param currentNode - The current node for which to retrieve the lineage.
 * @returns An array of nodes up to the ultimate ancestor.
 */
function getLineageNodeArray(currentNode: BaseNode): any[] {
    let lineage = [copyNode(currentNode)];
    while (currentNode.type !== 'PAGE') {
        currentNode = currentNode.parent;
        lineage.push(copyNode(currentNode));
    }
    return lineage;
}

/**
 * Returns an array with duplicate objects removed according to a given property.
 *
 * @param array - The array where duplicates should be removed from
 * @param prop - The object property that should be checked
 */
export function uniqObjInArr(array: Object[], prop: string): any[] {
    let distinct = [];
    let uniq = [];
    for (let i = 0; i < array.length; i++) {
        if (!distinct.includes(array[i][prop])) {
            distinct.push(array[i][prop]);
            uniq.push(array[i]);
        }
    }
    return uniq;
}

// Extracted createDataTree function
export function createDataTree(dataset) {
    const hashTable = Object.create(null);
    dataset.forEach((aData) => (hashTable[aData.id] = { ...aData, childNodes: [] }));
    const dataTree = [];

    dataset.forEach((aData) => {
        if (aData.parent?.id) {
            hashTable[aData.parent.id].childNodes.push(hashTable[aData.id]);
        } else {
            dataTree.push(hashTable[aData.id]);
        }
    });
    return dataTree;
}

function copyNode(node: BaseNode) {
    const { existingLabels } = getLabels(node.name);

    return {
        id: node.id,
        name: node.name,
        parent: node.parent,
        node: node,
        // children: node.children,
        type: node.type,
        labels: existingLabels
    };
}

export function cleanTree(node) {
    if (!node.childNodes || node.childNodes.length === 0) {
        return node;
    }

    while (node.childNodes.length === 1) {
        node = node.childNodes[0];
    }

    node.childNodes = node.childNodes.map(child => cleanTree(child)).filter(child => child !== null);

    return node;
}
