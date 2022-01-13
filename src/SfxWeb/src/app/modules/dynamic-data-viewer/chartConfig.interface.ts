export enum ChartConfigurationType {
  barChart = 'barChart',
  pieChart = 'pieChart'
}

export interface ChartConfiguration {
  id: string;
  type: ChartConfigurationType
  url: string;
}



export interface ChartConfigurationBarChart extends ChartConfiguration{
  type: ChartConfigurationType.barChart;

  x: string;
  y: string;
}


export const checkIfValidReport = (data: {}) => {
  return ('id' in data) && ('type' in data)
}
