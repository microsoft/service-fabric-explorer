// import { TreeNodeViewModel } from "./TreeNodeViewModel";
// import { TreeViewModel } from './TreeViewModel';
// import { ITreeNode } from './TreeTypes';
// import { of } from 'rxjs';
// import { TreeService } from '../services/tree.service';
// import { HealthUtils } from '../Utils/healthUtils';
// import { ValueResolver } from '../Utils/ValueResolver';
// import { BadgeConstants, HealthStateConstants } from '../Common/Constants';
// import { TreeNodeGroupViewModel } from './TreeNodeGroupViewModel';

// describe('Tree Node', () => {


//     let testNode: TreeNodeViewModel;
//     let child: ITreeNode;
//     let node: ITreeNode;
//     let queryNodes: ITreeNode[] = [node];
//     let query = () => of(queryNodes);
//     let treeViewModel: TreeViewModel;;
//     let treeNodeGroupViewModel: TreeNodeGroupViewModel;

//     beforeEach((() => {
//         let child = {
//             displayName: () => "child1",
//         }
    
//         let node: ITreeNode = {
//             displayName : () => "node1",
//             nodeId: "nodeId1",
//             childrenQuery: () => of([child]),
//             alwaysVisible: true,
//         };
    
//         query = () => of([node]);
    
//         treeViewModel = new TreeViewModel(query);
//         testNode = new TreeNodeViewModel(treeViewModel, node, null);
    
//         treeNodeGroupViewModel = new TreeNodeGroupViewModel(treeViewModel, testNode, query);
        
//     }));

//     fit('validate tree Node', () => {

//         // expect(testNode.isExpanded).toBeTruthy();
//         // expect(testNode.hasChildren).toBeTruthy();
//         // expect(testNode.isCollapsed).toBeFalsy();

//         // expect(testNode.paddingLeftPx).toBe("18px");
//     });

//   });

