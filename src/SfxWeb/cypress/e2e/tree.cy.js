import { addDefaultFixtures } from "./util.cy";

const evalExpanderRotation = (rotated, selector) => {

    (selector === "focused"? cy.focused() : cy.contains(selector)).within(() => {
        cy.get("button[class*='expander']").should(rotated ? "have.class" : "not.have.class", "rotated");
    })

}

context('tree', () => {
    describe("accessibility", () => {
        it("keyboard navigation", () => {
            addDefaultFixtures();
            cy.visit("");

            // Wait for the tree to finish loading so the selected node is stable before we
            // focus it; a re-render during load can otherwise drop focus and break the
            // keyboard navigation steps below.
            cy.get("[data-cy=tree]").within(() => {
                cy.contains("Applications").should("be.visible");
                cy.contains("Nodes").should("be.visible");
                cy.contains("System").should("be.visible");
            });

            // On load the app moves focus to the page heading (~200ms later, via FocusService) for
            // accessibility. Wait for that to land before we take over, so it can't steal focus
            // mid-test — that race (not event propagation) is what failed under the esbuild builder.
            cy.get("h1.detail-view-title").should("be.focused");

            // Reliably focus the tree so the following keyboard navigation steps work.
            cy.get(".selected").focus().should("be.focused");

            //down arrow
            cy.focused().type("{downarrow}");
            cy.focused().contains("Applications")
            cy.focused().should("have.attr", "tabindex", "0");
            cy.get("[data-cy=tree]").within(() => {
                cy.contains("Cluster").should("have.attr", "tabindex", "-1");
            })
            
            //* expands all
            cy.focused().type("*");
            cy.get("[data-cy=tree]").within(() => {
                evalExpanderRotation(true, "Applications");
                evalExpanderRotation(true, "Nodes");
                evalExpanderRotation(true, "System");
            })

            //right arrow
            cy.focused().type("{rightarrow}");
            cy.focused().contains("VisualObjectsApplicationType")
            evalExpanderRotation(false, "focused");

            cy.focused().type("{rightarrow}");
            cy.focused().contains("VisualObjectsApplicationType")
            evalExpanderRotation(true, "focused");


            //left arrow
            cy.focused().type("{leftarrow}");
            cy.focused().contains("VisualObjectsApplicationType")
            evalExpanderRotation(false, "focused");


            cy.focused().type("{leftarrow}");
            cy.focused().contains("Applications");

            //up arrow
            cy.focused().type("{uparrow}");
            cy.focused().contains("Cluster");

            //going back doesn't go out of bound
            cy.focused().type("{uparrow}");
            cy.focused().contains("Cluster");
            cy.focused().type("{leftarrow}");
            cy.focused().contains("Cluster");
            
            evalExpanderRotation(false, "focused");

            cy.focused().type("{rightarrow}");

            //end
            cy.focused().type("{end}");
            cy.focused().contains("fabric:/System/NamingService");

            //going forward doesn't go out of bound
            cy.focused().type("{downarrow}");
            cy.focused().contains("fabric:/System/NamingService");
            cy.focused().type("{rightarrow}");
            cy.focused().contains("fabric:/System/NamingService");

            //home
            cy.focused().type("{home}");
            cy.focused().contains("Cluster");

            //typahead
            cy.focused().type("_");
            cy.focused().contains("_nt_0");
            cy.focused().type("_");
            cy.focused().contains("_nt_1");

            //navigate to node
            cy.focused().type("{enter}");
            cy.wait(500);
            cy.focused().contains("Node _nt_1");
            cy.url().should("include", "node/_nt_1");

            cy.get("[data-cy=tree]").within(() => {
                cy.contains("_nt_1").should("have.class", "selected").and("have.attr", "aria-current", "page")
                    .and("have.attr", "tabindex", "0");
            })
        })
    })
});