import { addDefaultFixtures } from "./util.cy";

context('tree', () => {
    describe("accessibility", () => {
        it("keyboard navigation", () => {
            addDefaultFixtures();
            cy.visit("");

            //focused highlights tree
            cy.get(".selected").focus();;
            cy.get("[data-cy=tree-panel]").should("have.class", "focused").and("have.css", "border", "2px solid rgb(255, 255, 255)");
            
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
                cy.contains("Applications").within(() => {
                    cy.get("button[class*='expander']").should("have.class", "rotated");
                })

                cy.contains("Nodes").within(() => {
                    cy.get("button[class*='expander']").should("have.class", "rotated");
                })

                cy.contains("System").within(() => {
                    cy.get("button[class*='expander']").should("have.class", "rotated");
                })
            })

            //right arrow
            cy.focused().type("{rightarrow}");
            cy.focused().contains("VisualObjectsApplicationType")
            cy.focused().within(() => {
                cy.get("button[class*='expander']").should("not.have.class", "rotated");
            })

            cy.focused().type("{rightarrow}");
            cy.focused().contains("VisualObjectsApplicationType")
            cy.focused().within(() => {
                cy.get("button[class*='expander']").should("have.class", "rotated");
            })

            //left arrow
            cy.focused().type("{leftarrow}");
            cy.focused().contains("VisualObjectsApplicationType")
            cy.focused().within(() => {
                cy.get("button[class*='expander']").should("not.have.class", "rotated");
            })

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
            
            cy.focused().within(() => {
                cy.get("button[class*='expander']").should("not.have.class", "rotated");
            })
            cy.get("[data-cy=tree-panel]").should("have.class", "focused").and("have.css", "border", "2px solid rgb(255, 255, 255)");
            
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
            cy.get("[data-cy=tree-panel]").should("not.have.class", "focused").and("not.have.css", "border", "2px solid rgb(255, 255, 255)");

            cy.get("[data-cy=tree]").within(() => {
                cy.contains("_nt_1").should("have.class", "selected").and("have.attr", "aria-current", "page")
                    .and("have.attr", "tabindex", "0");
            })
        })
    })
});