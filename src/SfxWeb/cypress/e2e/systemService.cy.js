import { addDefaultFixtures, apiUrl, addRoute } from './util';


const infraService = "System%2FInfrastructureService%2FType134";

describe("systemService - infraservice", () => {
  beforeEach(() => {
    addDefaultFixtures();

    addRoute("infra-service-data", "system-service/infrastructure-data.json", apiUrl(`/$/InvokeInfrastructureQuery?api-version=6.0&Command=GetJobs&ServiceId=System/InfrastructureService/Type134*`))

    addRoute("infra-service-info", "system-service/infra-service-info.json", apiUrl(`/Applications/System/$/GetServices/${infraService}?*`))
    addRoute("system-services", "system-service/system-services.json", apiUrl(`/Applications/System/$/GetServices?*`))
    addRoute("description", "system-service/infra-service-details.json", apiUrl(`/Applications/System/$/GetServices/${infraService}/$/GetDescription?*`))
    addRoute("health", "system-service/infra-service-health.json", apiUrl(`/Applications/System/$/GetServices/${infraService}/$/GetHealth?*`))
    addRoute("partitions", "system-service/infra-service-partitions.json", apiUrl(`/Applications/System/$/GetServices/${infraService}/$/GetPartitions?*`))


    cy.visit(`/#/apptype/System/app/System/service/${window.encodeURI(infraService)}`)
  })

  it('executing job', () => {
    cy.get('[data-cy=navtabs]').within(() => {
      cy.contains('infrastructure jobs').click();
    })

    cy.get('[data-cy=444703f2-0733-4537-9cf0-4a543ca12e91]').within(() => {
      cy.get('[data-cy=overview]').within(() => {
        cy.contains(' _primaray_0:ConfigurationUpdate ')
        cy.contains('Acknowledged')
      })
    })

    cy.get('[data-cy=completed]').click();

    cy.contains('FFFFFFF')
  })
})
