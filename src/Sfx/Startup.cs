//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace Sfx
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder().SetBasePath(env.ContentRootPath)
                                                    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; }

        public void Configure(IApplicationBuilder app)
        {
            app.UseDefaultFiles();

            app.UseStaticFiles();

            Uri targetClusterUrl = new Uri(Configuration.GetSection("TargetCluster")?["Url"]);

            app.RunProxy(new ProxyOptions()
            {
                Scheme = targetClusterUrl.Scheme,
                Host = targetClusterUrl.Host,
                Port = targetClusterUrl.Port.ToString(),
                BackChannelMessageHandler = new ProxyHttpClientHandler() { AllowAutoRedirect = false, UseCookies = false },
            });
        }
    }

    public class ProxyHttpClientHandler : HttpClientHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Console.WriteLine(request.RequestUri.PathAndQuery);

            try
            {
                // if (request.RequestUri.PathAndQuery.StartsWith("/Applications/VisualObjects/$/GetUpgradeProgress"))
                // {
                //     var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK);
                    
                //     response.Content = new StringContent();
                //     response.Content.Headers.ContentType.MediaType = "application/json";
                //     return Task.FromResult(response);
                // }

                if (request.RequestUri.PathAndQuery.StartsWith("/Applications/VisualObjects/$/GetUpgradeProgress"))
                {
                    var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK);
                    
                    response.Content = new StringContent("{\"Name\":\"fabric:\\/YiWeb\",\"TypeName\":\"YiWebType\",\"TargetApplicationTypeVersion\":\"1.6.8\", \"UpgradeDomains\":[" 
                    + "{\"Name\":\"UD0\",\"State\":\"Completed\"},{\"Name\":\"UD1\",\"State\":\"Completed\"},{\"Name\":\"UD2\",\"State\":\"Completed\"}," 
                    + "{\"Name\":\"UD3\",\"State\":\"Completed\"},{\"Name\":\"UD4\",\"State\":\"Completed\"},{\"Name\":\"UD5\",\"State\":\"Completed\"}," 
                    + "{\"Name\":\"UD6\",\"State\":\"Pending\"},{\"Name\":\"UD7\",\"State\":\"Pending\"},{\"Name\":\"UD8\",\"State\":\"Completed\"}," 
                    + "{\"Name\":\"UD9\",\"State\":\"InProgress\"},{\"Name\":\"UD10\",\"State\":\"Pending\"},{\"Name\":\"UD12\",\"State\":\"Completed\"}" 
                    + "],\"UpgradeState\":\"RollingForwardPending\",\"NextUpgradeDomain\":\"UD10\",\"RollingUpgradeMode\":\"Monitored\",\"UpgradeDescription\":{\"Name\":\"fabric:\\/YiWeb\",\"TargetApplicationTypeVersion\":\"1.6.8\",\"Parameters\":[{\"Key\":\"YiWebAPI_InstanceCount\",\"Value\":\"3\"},{\"Key\":\"YiWebUI_InstanceCount\",\"Value\":\"3\"}],\"UpgradeKind\":\"Rolling\",\"RollingUpgradeMode\":\"Monitored\",\"UpgradeReplicaSetCheckTimeoutInSeconds\":4294967295,\"ForceRestart\":false,\"MonitoringPolicy\":{\"FailureAction\":\"Rollback\",\"HealthCheckWaitDurationInMilliseconds\":\"PT0H5M0S\",\"HealthCheckStableDurationInMilliseconds\":\"PT0H5M0S\",\"HealthCheckRetryTimeoutInMilliseconds\":\"PT0H10M0S\",\"UpgradeTimeoutInMilliseconds\":\"P10675199DT2H48M5.4775807S\",\"UpgradeDomainTimeoutInMilliseconds\":\"P10675199DT2H48M5.4775807S\"}},\"UpgradeDurationInMilliseconds\":\"PT0H34M2.56023S\",\"UpgradeDomainDurationInMilliseconds\":\"PT0H34M2.56023S\",\"UnhealthyEvaluations\":[{\"HealthEvaluation\":{\"Kind\":\"Services\",\"Description\":\"Unhealthy services: 100% (1\\/1), ServiceType='YiWebAPIType', MaxPercentUnhealthyServices=0%.\",\"AggregatedHealthState\":\"Error\",\"ServiceTypeName\":\"YiWebAPIType\",\"UnhealthyEvaluations\":[{\"HealthEvaluation\":{\"Kind\":\"Service\",\"Description\":\"Unhealthy service: ServiceName='fabric:\\/YiWeb\\/YiWebAPI', AggregatedHealthState='Error'.\",\"AggregatedHealthState\":\"Error\",\"ServiceName\":\"fabric:\\/YiWeb\\/YiWebAPI\",\"UnhealthyEvaluations\":[{\"HealthEvaluation\":{\"Kind\":\"Partitions\",\"Description\":\"Unhealthy partitions: 100% (1\\/1), MaxPercentUnhealthyPartitionsPerService=0%.\",\"AggregatedHealthState\":\"Error\",\"UnhealthyEvaluations\":[{\"HealthEvaluation\":{\"Kind\":\"Partition\",\"Description\":\"Unhealthy partition: PartitionId='4e025cbe-97c1-4032-a742-81d2e369b354', AggregatedHealthState='Error'.\",\"AggregatedHealthState\":\"Error\",\"PartitionId\":\"4e025cbe-97c1-4032-a742-81d2e369b354\",\"UnhealthyEvaluations\":[{\"HealthEvaluation\":{\"Kind\":\"Event\",\"Description\":\"Error event: SourceId='System.FM', Property='State'.\",\"AggregatedHealthState\":\"Error\",\"UnhealthyEvent\":{\"SourceId\":\"System.FM\",\"Property\":\"State\",\"HealthState\":\"Error\",\"TimeToLiveInMilliSeconds\":\"P10675199DT2H48M5.4775807S\",\"Description\":\"Partition is below target replica or instance count.\\r\\nfabric:\\/YiWeb\\/YiWebAPI 3 1 4e025cbe-97c1-4032-a742-81d2e369b354\\r\\n  InBuild vm2 131867840374016732\\r\\n  InBuild vm1 131867836473416335\\r\\n  InBuild vm0 131867839805120308\\r\\n  (Showing 3 out of 3 instances. Total available instances: 0)\\r\\n\\r\\nFor more information see: http:\\/\\/aka.ms\\/sfhealth\",\"SequenceNumber\":\"3158\",\"RemoveWhenExpired\":false,\"SourceUtcTimestamp\":\"2018-11-15T19:33:57.457Z\",\"LastModifiedUtcTimestamp\":\"2018-11-15T19:34:03.656Z\",\"IsExpired\":false,\"LastOkTransitionAt\":\"2018-11-14T02:14:30.275Z\",\"LastWarningTransitionAt\":\"0001-01-01T00:00:00.000Z\",\"LastErrorTransitionAt\":\"2018-11-14T02:14:30.275Z\"},\"ConsiderWarningAsError\":false}}]}}],\"MaxPercentUnhealthyPartitionsPerService\":0,\"TotalCount\":1}}]}}],\"MaxPercentUnhealthyServices\":0,\"TotalCount\":1}}],\"CurrentUpgradeDomainProgress\":{\"DomainName\":\"UD1\",\"NodeUpgradeProgressList\":[{\"NodeName\":\"_Node_0\",\"UpgradePhase\":\"PreUpgradeSafetyCheck\",\"PendingSafetyChecks\":[\"EnsurePartitionQuorum - 77cd4c63-4a57-4a27-b860-129qwef821ebe1573\", \"EnsurePartitionQuorum - 77cd4c63-4a57-4a27-b860-9f8121ebe1573\", \"EnsurePartitionQuorum - 77cd4c63-4a57-4a27-b860-9f8121ebe157qewr3\"]},{\"NodeName\":\"_Node_3\",\"UpgradePhase\":\"PreUpgradeSafetyCheck\",\"PendingSafetyChecks\":[\"EnsureAvailability\"]}]},\"StartTimestampUtc\":\"2018-11-15T19:03:12.198Z\",\"FailureTimestampUtc\":\"2018-01-01T00:00:00.000Z\",\"FailureReason\":\"HealthCheck\",\"UpgradeDomainProgressAtFailure\":{\"DomainName\":\"\",\"NodeUpgradeProgressList\":[]},\"UpgradeStatusDetails\":\"\"}");
                    response.Content.Headers.ContentType.MediaType = "application/json";
                    return Task.FromResult(response);
                }

                if (request.RequestUri.PathAndQuery.StartsWith("/Applications/VisualObjects/?")) {
                    var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK);
                    
                    response.Content = new StringContent("{\"Name\":\"fabric:\\/VisualObjects\",\"TypeName\":\"VisualObjectsApplicationType\",\"TypeVersion\":\"1.6\",\"Status\":\"Upgrading\",\"Parameters\":[{\"Key\":\"YiWebAPI_InstanceCount\",\"Value\":\"3\"},{\"Key\":\"YiWebUI_InstanceCount\",\"Value\":\"3\"}],\"HealthState\":\"Error\",\"ApplicationDefinitionKind\":\"ServiceFabricApplicationDescription\",\"Id\":\"VisualObjects\"}");
                    response.Content.Headers.ContentType.MediaType = "application/json";
                    return Task.FromResult(response);                    
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

            return base.SendAsync(request, cancellationToken);
        }
    }
}
