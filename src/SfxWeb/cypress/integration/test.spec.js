describe('My First Test', () => {
    it('Visits the Kitchen Sink', () => {
      cy.visit('localhost:2500');

      cy.wait(10000)

    //   cy.contains('Applications').click()

    //   cy.contains('fabric:/VisualObjectsApplicationType').click()
    //     cy.wait(2000);

    //   cy.contains('fabric:/VisualObjectsApplicationType/VisualObjects.ActorService').click()
    
    //   cy.wait(2000);
    //   cy.contains('28bfaf73-37b0-467d-9d47-d011b0aedbc0').click()

    //   cy.wait(2000);
    //   cy.contains('132399270159727393').click()      
      
      cy.contains('Nodes').click()
      cy.wait(2000);
      cy.get('.detail-list-container').contains('_nt_3').click()

      cy.wait(2000);
      cy.get('.detail-list-container').contains('fabric:/VisualObjectsApplicationType').click()

      cy.contains('fabric:/VisualObjectsApplicationType').click()
      cy.contains('VisualObjects.ActorServicePkg').click()
      cy.get('[aria-label="VisualObjects.ActorServicePkg"]').find('.bowtie-chevron-right-light').click()
    })
  })