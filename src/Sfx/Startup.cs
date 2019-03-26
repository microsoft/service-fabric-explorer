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
BackChannelMessageHandler = new ProxyHttpClientHandler() { AllowAutoRedirect = false, UseCookies = false },            });
        }
    }

    public class ProxyHttpClientHandler : HttpClientHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Console.WriteLine(request.RequestUri.LocalPath);

            try
            {
                // if (request.RequestUri.PathAndQuery.StartsWith("/Applications/VisualObjects/$/GetUpgradeProgress"))
                // {
                //     var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK);
                    
                //     response.Content = new StringContent();
                //     response.Content.Headers.ContentType.MediaType = "application/json";
                //     return Task.FromResult(response);
                // }
                Console.WriteLine(request.RequestUri.PathAndQuery.ToString());
                if (request.RequestUri.PathAndQuery.Contains("GetUpgradeProgress"))
                {
                    var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK);
                    
                    response.Content = new StringContent("{\"CodeVersion\":\"6.4.644.9590\",\"ConfigVersion\":\"2\",\"UpgradeDomains\":[{\"Name\":\"0\",\"State\":\"Completed\"},{\"Name\":\"1\",\"State\":\"Completed\"},{\"Name\":\"2\",\"State\":\"Completed\"},{\"Name\":\"3\",\"State\":\"Completed\"},{\"Name\":\"4\",\"State\":\"Completed\"}],\"UpgradeState\":\"RollingForwardCompleted\",\"NextUpgradeDomain\":\"\",\"RollingUpgradeMode\":\"Monitored\",\"UpgradeDescription\":{\"CodeVersion\":\"6.4.644.9590\",\"ConfigVersion\":\"2\",\"UpgradeKind\":\"Rolling\",\"RollingUpgradeMode\":\"Monitored\",\"UpgradeReplicaSetCheckTimeoutInSeconds\":4294967295,\"ForceRestart\":false,\"MonitoringPolicy\":{\"FailureAction\":\"Rollback\",\"HealthCheckWaitDurationInMilliseconds\":\"PT0H5M0S\",\"HealthCheckStableDurationInMilliseconds\":\"PT0H5M0S\",\"HealthCheckRetryTimeoutInMilliseconds\":\"PT0H40M0S\",\"UpgradeTimeoutInMilliseconds\":\"PT16H0M0S\",\"UpgradeDomainTimeoutInMilliseconds\":\"PT3H0M0S\"},\"ClusterHealthPolicy\":{\"ConsiderWarningAsError\":false,\"MaxPercentUnhealthyNodes\":100,\"MaxPercentUnhealthyApplications\":0},\"EnableDeltaHealthEvaluation\":true,\"ClusterUpgradeHealthPolicy\":{\"MaxPercentDeltaUnhealthyNodes\":0,\"MaxPercentUpgradeDomainDeltaUnhealthyNodes\":0}},\"UpgradeDurationInMilliseconds\":\"PT1H27M7.07325S\",\"UpgradeDomainDurationInMilliseconds\":\"PT0H0M0.070293S\",\"UnhealthyEvaluations\":[],\"CurrentUpgradeDomainProgress\":{\"DomainName\":\"\",\"NodeUpgradeProgressList\":[]},\"StartTimestampUtc\":\"2019-03-21T01:01:12.764Z\",\"FailureTimestampUtc\":\"0001-01-01T00:00:00.000Z\",\"FailureReason\":\"None\",\"UpgradeDomainProgressAtFailure\":{\"DomainName\":\"\",\"NodeUpgradeProgressList\":[]}}");
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
