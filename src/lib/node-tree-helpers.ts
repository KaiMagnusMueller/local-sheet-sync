import { getLabels, hasLabels, mergeLabels } from "./handle-labels";

// ---------------------------------
// SEARCH NODE HELPERS
// ---------------------------------



/**
 * Retrieves a list of nodes to search from a given set of scene nodes.
 * If the provided set is empty, it defaults to searching the current page's children.
 *
 * @param nodeSearchSet - A readonly array of SceneNode objects to search within.
 * @returns An array of BaseNode objects that are eligible for searching.
 */
export function getNodesToSearch(nodeSearchSet: readonly SceneNode[]): SceneNode[] {
    let nodesToSearch: SceneNode[] = [];
    switch (nodeSearchSet.length) {
        case 0:
            // Search current page if no selection
            figma.currentPage.children.forEach(node => {
                //@ts-ignore
                if (node.findAll !== undefined) {
                    nodesToSearch.push(node);
                }
            });
            break;
        default:
            nodeSearchSet.forEach(node => {
                //@ts-ignore
                if (node.findAll !== undefined) {
                    nodesToSearch.push(node);
                }
            });
            break;
    }

    return nodesToSearch;
}

export function getNodesToApplyData(nodesToSearch: SceneNode[]) {
    let nodesToApplyData: SceneNode[] = [];

    nodesToSearch.forEach(node => {
        //@ts-ignore
        const matchingNodes = node.findAll(node => {
            const match = node.name.match(/({.*})/);
            if (!match) return false;

            try {
                const jsonObject = JSON.parse(match[0]);
                return !!jsonObject.column;
            } catch (error) {
                console.error('Invalid JSON:', error);
                return false;
            }
        });
        nodesToApplyData = nodesToApplyData.concat(matchingNodes);
    });

    return nodesToApplyData;

}



// ---------------------------------
// TREE GROUP HELPERS
// ---------------------------------
export function getAncestorNodes(selection: SceneNode[]): SceneNode[] {
    let ancestorNodes = [];
    selection.forEach((elem) => {
        ancestorNodes.push(getUltimateAncestorNode(elem));
    });
    return ancestorNodes;
}

/**
 * Retrieves the ultimate ancestor node of the given current node.
 * 
 * @param {BaseNode} currentNode - The current node to find the ultimate ancestor for.
 * @returns {BaseNode} The ultimate ancestor node of the current node.
 */
export function getUltimateAncestorNode(currentNode: SceneNode): SceneNode | BaseNode {
    let ultimateAncestor = currentNode as SceneNode | BaseNode;
    while (ultimateAncestor.parent.type !== 'PAGE') {
        ultimateAncestor = ultimateAncestor.parent;
    }
    return ultimateAncestor;
}

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

export function copyNode(node: BaseNode): SNode {
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
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];

        if (!node.childNodes || node.childNodes.length === 0) {
            continue;
        }

        if (node.childNodes.length === 1) {
            // console.log("Remove node:", node.name);

            // Update element in the localNodes array directly
            nodes[i] = node.childNodes[0];
            node = nodes[i];

            // Decrement index to reprocess the new node at the same position. Kinda hacky, oh well…
            i--;
        } else {
            // Either remove node or go to next level, if we do both, the node inbetween is skipped because we need to do another loop with i--
            node.childNodes = cleanTree(node.childNodes);
        }

    }
    return nodes;
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
