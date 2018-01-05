//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Reflection;

namespace Sfx
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var contentRoot = Directory.GetCurrentDirectory();
            var location = Assembly.GetExecutingAssembly().Location;
            // Directory.GetCurrentDirectory does not get correct directory for UNC path.
            if (location.StartsWith("\\\\"))
            {
                contentRoot = Path.GetDirectoryName(location);
            }

            var host = new WebHostBuilder()
                .UseKestrel()
                .UseContentRoot(contentRoot)
                .UseUrls("http://*:5000")
                .UseIISIntegration()
                .UseStartup<Startup>()
                .Build();

            host.Run();
        }
    }
}
