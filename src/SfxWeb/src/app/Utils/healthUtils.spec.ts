import { IUnhealthyEvaluationNode, getNestedNode, getParentPath, getLeafNodes } from "./healthUtils";
import { HealthEvaluation } from '../Models/DataModels/Shared';

    
describe('Health Utils', () => {
    let parent: IUnhealthyEvaluationNode 
    let child1: IUnhealthyEvaluationNode 
    let child2: IUnhealthyEvaluationNode 
    let nestedchild: IUnhealthyEvaluationNode 
  
    beforeEach((() => {
        parent = {
            healthEvaluation: {
                treeName: "0",
                viewPathUrl: "0",
                healthState : { badgeClass: "Ok", text: "Ok", badgeId: "ok" },
            } as HealthEvaluation,
            children: [],
            parent: null,
            containsErrorInPath: false,
            displayNames: [],
            id: "root"
        };
        
        child1 = {
            healthEvaluation: {
                treeName: "1",
                viewPathUrl: "1",
                healthState : { badgeClass: "Ok", text: "Ok", badgeId: "ok" },
            } as HealthEvaluation,
            children: [],
            parent,
            containsErrorInPath: false,
            displayNames: [],
            id: "child1"
        };

        child2 = {
            healthEvaluation: {
                treeName: "2",
                viewPathUrl: "2",
                healthState : { badgeClass: "Ok", text: "Ok", badgeId: "ok" },
            } as HealthEvaluation,
            children: [],
            parent,
            containsErrorInPath: false,
            displayNames: [],
            id: "child2"
        };

        parent.children = [child1, child2];

        nestedchild = {
            healthEvaluation: {
                treeName: "3",
                viewPathUrl: "3",
                healthState : { badgeClass: "Ok", text: "Ok", badgeId: "ok" },
            } as HealthEvaluation,
            children: [],
            parent: child2,
            containsErrorInPath: false,
            displayNames: [],
            id: "nestedchild"
        };

        child2.children = [nestedchild];
    }));

    describe('validate getNestedNode', () => {
        fit('validate getNestedNode no path', () => {
            let node = getNestedNode([], parent);
            expect(node).toEqual(parent);
        });

        fit('validate getNestedNode nested child', () => {
            let node = getNestedNode(["child2", "nestedchild"], parent);
            expect(node).toEqual(nestedchild);
        });

        fit('validate getNestedNode no matching path', () => {
            let node = getNestedNode(["child3"], parent);
            expect(node).toBeNull();
        });
    })

    describe('validate getParentPath', () => {
        fit('validate getParentPath no parent', () => {
            let parents = getParentPath(parent);
            expect(parents.length).toEqual(0);
        });

        fit('validate getParentPath nested child', () => {
            let parents = getParentPath(nestedchild);
            expect(parents.length).toEqual(2);
            expect(parents[0]).toEqual(parent);
            expect(parents[1]).toEqual(child2);
        });
    })

    describe('validate getLeafNodes', () => {
        fit('validate getLeafNodes nested', () => {
            let nodes = getLeafNodes(nestedchild, false);
            expect(nodes.length).toEqual(1);

            const node = nodes[0];
            expect(node.displayNames.length).toEqual(2);
            expect(node.displayNames[0]).toEqual({
                text: "0",
                link: "0",
                badge:"Ok",
                node: parent
            });

            expect(node.displayNames[1]).toEqual({
                text: "2",
                link: "2",
                badge:"Ok",
                node: child2
            });

            expect(nestedchild.displayNames.length).toEqual(0);
        });

        fit('validate getLeafNodes nested skip root', () => {
            let nodes = getLeafNodes(nestedchild);
            expect(nodes.length).toEqual(1);

            const node = nodes[0];
            expect(node.displayNames.length).toEqual(1);
            expect(node.displayNames[0]).toEqual({
                text: "2",
                link: "2",
                badge:"Ok",
                node: child2
            });
            expect(nestedchild.displayNames.length).toEqual(0);
        });
    })

    describe('validate getParentPath', () => {
        fit('validate getParentPath no parent', () => {
            let parents = getParentPath(parent);
            expect(parents.length).toEqual(0);
        });

        fit('validate getParentPath nested child', () => {
            let parents = getParentPath(nestedchild);
            expect(parents.length).toEqual(2);
            expect(parents[0]).toEqual(parent);
            expect(parents[1]).toEqual(child2);
        });
    })
  });

