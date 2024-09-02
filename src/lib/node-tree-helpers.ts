import { getLabels, hasLabels, mergeLabels } from "./handle-labels";

export function getAncestorNodeArray(selection) {
    let ancestorNodeArray = [];
    selection.forEach((elem) => {
        const lineageNodeArray = getLineageNodeArray(elem)

        // Merge labels of all nodes in the lineage
        for (let i = lineageNodeArray.length - 1; i > 0; i--) {
            const element = lineageNodeArray[i];
            if (hasLabels(element.name)) {
                const firstNode = lineageNodeArray[0];
                const mergedLabels = mergeLabels(firstNode.labels, element.labels);
                firstNode.labels = mergedLabels;
            }
        }

        ancestorNodeArray = ancestorNodeArray.concat(lineageNodeArray);
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
function getLineageNodeArray(currentNode: BaseNode): SNode[] {
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
export function createDataTree(dataset): TreeNode[] {
    const hashTable = Object.create(null);
    dataset.forEach((aData) => { hashTable[aData.id] = Object.assign({}, aData, { childNodes: [] }); });
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

function copyNode(node: BaseNode): SNode {
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

export function cleanTree(nodes: TreeNode[]): TreeNode[] {
    let localNodes = nodes;

    for (let i = 0; i < localNodes.length; i++) {
        let node = localNodes[i];

        // TODO: Watch for labels that might be present, if there are, we can't skip them
        // TODO: Alternatively search for another way to apply the correct labels to the respective nodes
        if (!node.childNodes || node.childNodes.length === 0) {
            continue;
        }

        if (node.childNodes.length === 1) {
            // console.log("Remove node:", node.name);

            // Update element in the localNodes array directly
            localNodes[i] = node.childNodes[0];
            node = localNodes[i];

            // Decrement index to reprocess the new node at the same position. Kinda hacky, oh well…
            i--;
        } else {
            // Either remove node or go to next level, if we do both, the node inbetween is skipped because we need to do another loop with i--
            node.childNodes = cleanTree(node.childNodes);
        }

    }

    return localNodes;
}




export function groupNodes(lineages: SNode[][]) {
    // Step 1: Group nodes by labels.sheet and labels.column
    const groupedByLabels = groupByLabels(lineages);
    // Step 2: Group by common ancestors
    const groupedByAncestors = groupByCommonAncestors(groupedByLabels);

    return groupedByAncestors;
}

function groupByLabels(lineages: SNode[][]): SNode[][][] {
    const groups: { [key: string]: SNode[][] } = {};

    for (const path of lineages) {
        const leaf = path[0];
        const key = `${leaf.labels.sheet || ''}-${leaf.labels.column || ''}`;

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(path);
    }

    return Object.values(groups);
}

function groupByCommonAncestors(groups: SNode[][][]): TreeNode[][] {

    const result: TreeNode[][] = [];

    while (groups.length > 0) {
        const currentGroup = groups.shift()!;

        let mergedGroup = [];
        currentGroup.forEach((path) => {
            mergedGroup = mergedGroup.concat(path);
        });

        let ancestorTreeRaw = createDataTree(uniqObjInArr(mergedGroup, 'id'));

        let ancestorTree = cleanTree(ancestorTreeRaw)

        const nodesWithLeafNodes = getNodesWithLeafNodes(ancestorTree);

        // console.log(nodesWithLeafNodes);

        function getNodesWithLeafNodes(tree: TreeNode[]): TreeNode[] {
            const result = [];

            function traverseTree(node) {
                if (node.childNodes.every(child => !child.childNodes || child.childNodes.length === 0)) {
                    result.push(node);
                } else {
                    node.childNodes.forEach(child => traverseTree(child));
                }
            }

            tree.forEach(node => traverseTree(node));
            return result;
        }

        result.push(nodesWithLeafNodes);
    }

    return result;
}
