import { StandaloneIntegrationService } from './services/standalone-integration.service';

export function initApp(standaloneIntegrationService: StandaloneIntegrationService) {
  return async () => {
    try {
      if(window.location.search.includes("?")) {
        standaloneIntegrationService.setConfiguration(window.location.search.split('?')[1]);
      }
      if(standaloneIntegrationService.isStandalone()) {
        return;
      }
    } catch (e) {
      console.log(e);
    }
  };
}
