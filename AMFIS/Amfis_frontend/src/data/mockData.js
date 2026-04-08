export const mockDatasets = [
  {
    id: 'financial-q3',
    name: 'Financial_Q3_Data',
    lastUpdated: '10 mins ago',
    healthScore: 65,
    riskLevel: 'high',
    accuracyDrop: true,
    driftDetected: true,
    driftMetric: 'KL Div: 0.15',
    failures: 12
  },
  {
    id: 'user-behavior',
    name: 'User_Behavior_Log',
    lastUpdated: '1 hr ago',
    healthScore: 82,
    riskLevel: 'medium',
    accuracyDrop: false,
    driftDetected: true,
    driftMetric: 'PSI: 0.11',
    failures: 3
  },
  {
    id: 'vision-sensor',
    name: 'Vision_Sensor_V2',
    lastUpdated: '2 hrs ago',
    healthScore: 95,
    riskLevel: 'low',
    accuracyDrop: false,
    driftDetected: false,
    driftMetric: '',
    failures: 0
  },
  {
    id: 'retail-txn',
    name: 'Retail_Transactions_DB',
    lastUpdated: '5 hrs ago',
    healthScore: 78,
    riskLevel: 'medium',
    accuracyDrop: false,
    driftDetected: true,
    driftMetric: 'KS Test: 0.08',
    failures: 1
  },
  {
    id: 'text-classification',
    name: 'Customer_Support_Tickets',
    lastUpdated: '1 day ago',
    healthScore: 55,
    riskLevel: 'high',
    accuracyDrop: true,
    driftDetected: true,
    driftMetric: 'KL Div: 0.22',
    failures: 24
  },
  {
    id: 'iot-metrics',
    name: 'IoT_Sensor_Metrics',
    lastUpdated: 'Just now',
    healthScore: 98,
    riskLevel: 'low',
    accuracyDrop: false,
    driftDetected: false,
    driftMetric: '',
    failures: 0
  }
];
