// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { addDefaultFixtures } from "./util.cy";

const evalExpanderRotation = (rotated, selector) => {

    (selector === "focused"? cy.focused() : cy.contains(selector)).within(() => {
        cy.get("button[class*='expander']").should(rotated ? "have.class" : "not.have.class", "rotated");
    })

}

const evalTreePanelFocus = (focused) => {
    cy.get("[data-cy=tree-panel]").should(focused ? "have.class" : "not.have.class", "focused")
        .and(focused ? "have.css" : "not.have.css", "border", "2px solid rgb(255, 255, 255)");
}

context('tree', () => {
    describe("accessibility", () => {
        it("keyboard navigation", () => {
            addDefaultFixtures();
            cy.visit("");

            //focused highlights tree
            cy.get(".selected").focus();;
            evalTreePanelFocus(true);

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

            evalTreePanelFocus(true);
            
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
            evalTreePanelFocus(false);

            cy.get("[data-cy=tree]").within(() => {
                cy.contains("_nt_1").should("have.class", "selected").and("have.attr", "aria-current", "page")
                    .and("have.attr", "tabindex", "0");
            })
        })
    })
});