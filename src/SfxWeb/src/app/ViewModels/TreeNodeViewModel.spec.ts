import { TreeNodeViewModel } from "./TreeNodeViewModel";
import { TreeViewModel } from './TreeViewModel';
import { ITreeNode } from './TreeTypes';
import { of } from 'rxjs';
import { TreeService } from '../services/tree.service';
import { HealthUtils } from '../Utils/healthUtils';
import { ValueResolver } from '../Utils/ValueResolver';
import { BadgeConstants, HealthStateConstants } from '../Common/Constants';

describe('Tree Node', () => {


    let testNode: TreeNodeViewModel;
    let treeViewModel: TreeViewModel;
    let node: ITreeNode = {
        displayName : () => "node1",
        nodeId: "nodeId1",
        childrenQuery: () => of([child]),
        alwaysVisible: true,
    };

    let child: ITreeNode = {
        displayName: () => "child1",
    }

    let parent: TreeNodeViewModel;
    beforeEach((() => {

    }));

    fit('validate tree Node', () => {
        testNode = new TreeNodeViewModel(treeViewModel, node, parent);

        expect(testNode.displayHtml).toBe("node1");
        expect(testNode.isExpanded).toBeFalsy();
        expect(testNode.isCollapsed).toBeTruthy();
        expect(testNode.hasChildren).toBeTruthy();

        testNode.toggle();

        expect(testNode.isExpanded).toBeTruthy();
        expect(testNode.hasChildren).toBeTruthy();
        expect(testNode.isCollapsed).toBeFalsy();

        expect(testNode.paddingLeftPx).toBe("18px");
    });

    describe('validate tree Node - IsVisibleBadge', () => {
        let vr: ValueResolver;

        beforeEach(() => {
            node.alwaysVisible = false;
            testNode = new TreeNodeViewModel(treeViewModel, node, parent);

            testNode['_tree'] = {} as TreeViewModel;
            testNode['_tree'].showOkItems = false;
            testNode['_tree'].showWarningItems = false;
            testNode['_tree'].showErrorItems = false;

            vr =  new ValueResolver();
        })

        fit('always visible', () => {
            expect(testNode.isVisibleByBadge).toBeTruthy();
        })

        fit('always visible', () => {
            node.alwaysVisible = false;
            testNode.update(node);
            expect(testNode.isVisibleByBadge).toBeTruthy();
        })

        fit('Healthy', () => {
            node.alwaysVisible = false;

            //healthy
            node.badge = () => vr.resolveHealthStatus("OK");
            testNode.update(node);
            expect(testNode.isVisibleByBadge).toBeFalsy();
            testNode['_tree'].showOkItems = true;
            expect(testNode.isVisibleByBadge).toBeTruthy();
        })

        fit('Warning', () => {
            node.alwaysVisible = false;

            //healthy
            node.badge = () => vr.resolveHealthStatus("Warning");
            testNode.update(node);
            expect(testNode.isVisibleByBadge).toBeFalsy();
            testNode['_tree'].showWarningItems = true;
            expect(testNode.isVisibleByBadge).toBeTruthy();
        })

    });
  });

