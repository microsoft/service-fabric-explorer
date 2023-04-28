import { TreeViewModel } from './TreeViewModel';
import { ITreeNode } from './TreeTypes';
import { of } from 'rxjs';
import { ValueResolver } from '../Utils/ValueResolver';
import { TreeNodeGroupViewModel } from './TreeNodeGroupViewModel';

describe('Tree Node', () => {
    let vr: ValueResolver;

    let testNode: TreeNodeGroupViewModel;
    let treeViewModel: TreeViewModel;
    let node: ITreeNode;

    let child: ITreeNode;

    const parent = null;
    let childQuery: ITreeNode[];

    beforeEach((() => {
        vr =  new ValueResolver();

        treeViewModel = new TreeViewModel( () => of([]));

        child = {
            displayName: () => 'child1',
            nodeId: 'child1'
        };

        childQuery = [child];

        node  = {
            displayName : () => 'node1',
            nodeId: 'nodeId1',
            childrenQuery: () => of(childQuery),
            alwaysVisible: true,
        };

        testNode = new TreeNodeGroupViewModel(treeViewModel, node, parent);

    }));

    fit('validate tree Node', () => {
        testNode = new TreeNodeGroupViewModel(treeViewModel, node, parent);

        expect(testNode.displayName()).toBe('node1');
        expect(testNode.isExpanded).toBeFalsy();
        expect(testNode.isCollapsed).toBeTruthy();
        expect(testNode.hasChildren).toBeTruthy();

        testNode.toggle();

        expect(testNode.isExpanded).toBeTruthy();
        expect(testNode.hasChildren).toBeTruthy();
        expect(testNode.isCollapsed).toBeFalsy();

        expect(testNode.paddingLeftPx).toBe('10px');
    });

    describe('validate tree Node - IsVisibleBadge', () => {

        beforeEach(() => {
            node.alwaysVisible = false;

            testNode.tree = {} as TreeViewModel;
            testNode.tree.showOkItems = false;
            testNode.tree.showWarningItems = false;
            testNode.tree.showErrorItems = false;
            testNode.tree.orderbyHealthState = false;
        });

        fit('always visible', () => {
            expect(testNode.isVisibleByBadge).toBeTruthy();
        });

        fit('always visible', () => {
            node.alwaysVisible = false;
            testNode.update(node);
            expect(testNode.isVisibleByBadge).toBeTruthy();
        });

        fit('Healthy', () => {
            node.alwaysVisible = false;

            node.badge = () => vr.resolveHealthStatus('OK');
            testNode.update(node);
            expect(testNode.isVisibleByBadge).toBeFalsy();
            testNode.tree.showOkItems = true;
            expect(testNode.isVisibleByBadge).toBeTruthy();
        });

        fit('Warning', () => {
            node.alwaysVisible = false;
            node.badge = () => vr.resolveHealthStatus('Warning');
            testNode.update(node);

            expect(testNode.isVisibleByBadge).toBeFalsy();
            testNode.tree.showWarningItems = true;
            expect(testNode.isVisibleByBadge).toBeTruthy();
        });

        fit('Error', () => {
            node.alwaysVisible = false;
            node.badge = () => vr.resolveHealthStatus('Error');
            testNode.update(node);

            expect(testNode.isVisibleByBadge).toBeFalsy();
            testNode.tree.showErrorItems = true;
            expect(testNode.isVisibleByBadge).toBeTruthy();
        });

    });

    describe('refreshing tree state', () => {


        fit('refresh adding/removing a child', () => {
            expect(testNode.displayedChildren.length).toBe(0);
            testNode.toggle();

            expect(testNode.displayedChildren.length).toBe(1);

            const child2 = {
                displayName: () => 'child2',
                nodeId: 'child2'
            };

            childQuery = [child, child2];
            testNode.refreshExpandedChildrenRecursively().subscribe();
            expect(testNode.displayedChildren.length).toBe(2);


            childQuery = [];
            testNode.refreshExpandedChildrenRecursively().subscribe();
            expect(testNode.displayedChildren.length).toBe(0);

        });

        fit('refresh updating a child', () => {
            expect(testNode.displayedChildren.length).toBe(0);
            testNode.toggle();

            expect(testNode.displayedChildren.length).toBe(1);
            expect(testNode.displayedChildren[0].displayName()).toBe('child1');

            const child2 = {
                displayName: () => 'child2',
                nodeId: 'child1'
            };

            childQuery = [child2];
            testNode.refreshExpandedChildrenRecursively().subscribe();
            expect(testNode.displayedChildren.length).toBe(1);
            expect(testNode.displayedChildren[0].displayName()).toBe('child2');
        });

        fit('sort children', () => {
            const child2 = {
                displayName: () => 'child2',
                nodeId: 'child2',
                sortBy: () => [-1],
            };

            const child3 = {
                displayName: () => 'child3',
                nodeId: 'child3',
                sortBy: () => [2]
            };

            childQuery = [child3, child2];
            testNode.toggle();
            expect(testNode.displayedChildren.length).toBe(2);
            expect(testNode.displayedChildren[0].nodeId).toBe('child2');

            const child4 = {
                displayName: () => 'child4',
                nodeId: 'child4',
                sortBy: () => [1]
            };

            childQuery = [child3, child2, child4];
            testNode.refreshExpandedChildrenRecursively().subscribe();
            expect(testNode.displayedChildren[1].nodeId).toBe('child4');

        });

        fit('sort children by sort health order', () => {
            const child2 = {
                displayName: () => 'child2',
                nodeId: 'child2',
                sortBy: () => [1],
                badge: () => vr.resolveHealthStatus('Ok')
            };

            const child3 = {
                displayName: () => 'child3',
                nodeId: 'child3',
                sortBy: () => [2],
                badge: () => vr.resolveHealthStatus('Warning')
            };

            const child4 = {
                displayName: () => 'child4',
                nodeId: 'child4',
                sortBy: () => [3],
                badge: () => vr.resolveHealthStatus('Error')
            };

            childQuery = [child2, child3, child4];
            testNode.toggle();
            expect(testNode.displayedChildren[0].nodeId).toBe('child2');
            expect(testNode.displayedChildren[1].nodeId).toBe('child3');
            expect(testNode.displayedChildren[2].nodeId).toBe('child4');

            testNode.tree.orderbyHealthState = true;

            expect(testNode.displayedChildren[0].nodeId).toBe('child4');
            expect(testNode.displayedChildren[1].nodeId).toBe('child3');
            expect(testNode.displayedChildren[2].nodeId).toBe('child2');

        });

    });

  });

