import type { WorkBook } from "xlsx";

// global.d.ts
declare global {
    interface ImportedFile {
        fileName: string;
        date: string;
        data: {};
        activeSheet: number;
        createdByUser: {
            id: string;
            name: string;
        },
        saveVersion: string;
    }

    interface Search {
        node_types: SearchNodeTypes;
        area_type: "PAGE" | "SELECTION" | "ROOT_FRAME" | "SELECTION_PRESET";
        case_sensitive: boolean;
        string_match: "EXACT" | "FUZZY";
        query_text: string;
        query_submit_time: number;
        selected_nodes?: string[];
    }

    type SearchNodeTypes = [NodeType | "ALL"];

    interface SNode {
        id: string;
        name: string;
        node: BaseNode;
        labels: Labels;
        type: string;
        parent?: BaseNode;
    }

    interface TreeNode extends SNode {
        childNodes: TreeNode[];
    }

    interface Labels {
        sheet?: string;
        column?: string;
        row?: string;
    }

    interface HistoryItem {
        fileName: string;
        action: "applyData" | "importData";
        timestamp: string;
        user: {
            id: string;
            name: string;
        };
    }
}

export { };