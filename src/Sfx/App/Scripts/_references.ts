// It is important to keep this file ordered correctly. Or you'll get runtime errors.
//
// App/tsconfig.json controls the TypeScript compiler options.
// The gulp engine use gulp-typescript to compile this tsconfig.json as a project,
// by default it includes all .ts files recursively from the App folder (where tsconfig.json is).
// But TypeScript compiler has no clue how to order your .ts file in the secequences they will
// be needed at runtime except tracking the references directive in every .ts files.
// (https://github.com/Microsoft/TypeScript/issues/3098)
// But putting the references in every .ts files are tedious, ugly and hard to maintain.
//
// This file serves three purposes:
//   a) provides intellisense
//   b) tells TypeScript compiler how to sort the .ts files
//   c) remove the need to add any references directives in other .ts files

/// <reference path="app.ts" />

/// <reference path="versioninfo.ts" />
/// <reference path="common/constants.ts" />
/// <reference path="common/observable.ts" />
/// <reference path="common/responsemessagehandlers.ts" />
/// <reference path="common/standaloneintegration.ts" />

/// <reference path="utils/idgenerator.ts" />
/// <reference path="utils/utils.ts" />
/// <reference path="utils/timeutils.ts" />
/// <reference path="utils/stringutils.ts" />
/// <reference path="utils/idutils.ts" />
/// <reference path="utils/htmlutils.ts" />
/// <reference path="utils/collectionutils.ts" />
/// <reference path="utils/valueresolver.ts" />

/// <reference path="models/action.ts" />
/// <reference path="models/actioncollection.ts" />
/// <reference path="models/authentication.ts" />
/// <reference path="models/healthchunkrawdatatypes.ts" />
/// <reference path="models/listsettings.ts" />
/// <reference path="models/rawdatatypes.ts" />
/// <reference path="models/datamodels/base.ts" />
/// <reference path="models/datamodels/shared.ts" />
/// <reference path="models/datamodels/collections.ts" />
/// <reference path="models/datamodels/node.ts" />
/// <reference path="models/datamodels/partition.ts" />
/// <reference path="models/datamodels/application.ts" />
/// <reference path="models/datamodels/deployedapplication.ts" />
/// <reference path="models/datamodels/deployedreplica.ts" />
/// <reference path="models/datamodels/replica.ts" />
/// <reference path="models/datamodels/deployedservicepackage.ts" />
/// <reference path="models/datamodels/deployedcodepackage.ts" />
/// <reference path="models/datamodels/cluster.ts" />
/// <reference path="models/datamodels/service.ts" />
/// <reference path="models/datamodels/applicationtype.ts" />
/// <reference path="models/datamodels/aad.ts" />

/// <reference path="viewmodels/treetypes.ts" />
/// <reference path="viewmodels/treenodegroupviewmodel.ts" />
/// <reference path="viewmodels/treenodeviewmodel.ts" />
/// <reference path="viewmodels/treeviewmodel.ts" />
/// <reference path="viewmodels/dashboardviewmodels.ts" />
/// <reference path="viewmodels/metricsviewmodel.ts" />

/// <reference path="services/controllermanagerservice.ts" />
/// <reference path="services/responseheadersservice.ts" />
/// <reference path="services/authenticationservice.ts" />
/// <reference path="services/refreshservice.ts" />
/// <reference path="services/HttpService.ts" />
/// <reference path="services/RestClientService.ts" />
/// <reference path="services/dataservice.ts" />
/// <reference path="services/messageservice.ts" />
/// <reference path="services/storageservice.ts" />
/// <reference path="services/routesservice.ts" />
/// <reference path="services/clustertreeservice.ts" />
/// <reference path="services/telemetryservice.ts" />
/// <reference path="services/themeservice.ts" />
/// <reference path="services/settingsservice.ts" />

/// <reference path="directives/sliderdirective.ts" />
/// <reference path="directives/splitterdirective.ts" />
/// <reference path="directives/detailviewpartdirective.ts" />
/// <reference path="directives/detaillistdirective.ts" />
/// <reference path="directives/metricsbarchartdirective.ts" />
/// <reference path="directives/dashboardchartdirective.ts" />
/// <reference path="directives/directives.ts" />

/// <reference path="filters/filters.ts" />

/// <reference path="controllers/controllerbase.ts" />
/// <reference path="controllers/authenticationcontroller.ts" />
/// <reference path="controllers/settingscontroller.ts" />
/// <reference path="controllers/themecontroller.ts" />
/// <reference path="controllers/actioncontroller.ts" />
/// <reference path="controllers/treeviewcontroller.ts" />
/// <reference path="controllers/apptypeviewcontroller.ts" />
/// <reference path="controllers/appviewcontroller.ts" />
/// <reference path="controllers/clusterviewcontroller.ts" />
/// <reference path="controllers/deployedappviewcontroller.ts" />
/// <reference path="controllers/deployedcodepackageviewcontroller.ts" />
/// <reference path="controllers/deployedreplicaviewcontroller.ts" />
/// <reference path="controllers/deployedserviceviewcontroller.ts" />
/// <reference path="controllers/deployedservicereplicasviewcontroller.ts" />
/// <reference path="controllers/deployedservicecodepackagesviewcontroller.ts" />
/// <reference path="controllers/navbarcontroller.ts" />
/// <reference path="controllers/nodesviewcontroller.ts" />
/// <reference path="controllers/nodeviewcontroller.ts" />
/// <reference path="controllers/partitionviewcontroller.ts" />
/// <reference path="controllers/replicaviewcontroller.ts" />
/// <reference path="controllers/serviceviewcontroller.ts" />
/// <reference path="controllers/appsviewcontroller.ts" />
/// <reference path="controllers/systemappsviewcontroller.ts" />
/// <reference path="controllers/imagestoreviewcontroller.ts" />

// Bootstrap should be the last script to load to make sure all data structures are ready when bootstrap
/// <reference path="common/authenticationbootstrap.ts" />

