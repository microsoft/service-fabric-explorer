//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;

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
                BackChannelMessageHandler = new HttpClientHandler() { AllowAutoRedirect = false, UseCookies = false },
            });
        }
    }
}