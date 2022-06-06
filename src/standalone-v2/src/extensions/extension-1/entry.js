exports.initialize = function(data) {
    console.log(data)
    try {
        data.authenticationManager.registerAuthOption({
            id: "test-auth",
            displayName: "test-auth",
            getHandler: () => {},
            validators: []
        })
        console.log(data.authenticationManager.authOptions);

        const cluster = data.clusterManager.getCluster("1");
        cluster.name = Math.random().toString();
        data.clusterManager.updateCluster(cluster);
    } catch(e) {
        console.log(e)
    }

}