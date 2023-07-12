import { StandaloneIntegrationService } from './services/standalone-integration.service';
import Highcharts from 'highcharts';
import Accessibility from 'highcharts/modules/accessibility';
import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
Accessibility(Highcharts);
HighchartsSankey(Highcharts);
HighchartsOrganization(Highcharts);

export function initApp(standaloneIntegrationService: StandaloneIntegrationService) {
  return async () => {
    try {
      if("SFXintegrationConfiguration" in window) {
        standaloneIntegrationService.setConfiguration((window as any).SFXintegrationConfiguration);
      }
      if(standaloneIntegrationService.isStandalone()) {
        return;
      }
    } catch (e) {
      console.log(e);
    }
  };
}
