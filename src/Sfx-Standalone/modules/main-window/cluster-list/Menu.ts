// // declare const angular: angular.IAngularStatic;
// import { Folder } from "./Model";
// declare const angular: angular.IAngularStatic;

// let menuModule = angular.module("menu-app", []);

// var myApp = angular.module('myApp', []);


// myApp.factory('Data', function(){
//     return { FirstName: '' };
// });

// myApp.controller('FirstCtrl', function( $scope, Data ){
// 	$scope.Data = Data;
// });

// myApp.controller('SecondCtrl', function( $scope, Data ){
// 	$scope.Data = Data;
// });
    
    // menuModule.controller("MenuController", ["$scope", MenuController]);


// menuModule.factory("MenuFactory", ["$scope", MenuFactory]);
//     menuModule.controller("MenuController", ["$scope", function($scope, MenuFactory) {
//         $scope.title = MenuFactory.title;
//         $scope.folders = MenuFactory.folders;
//         $scope.addFolder = function() {
//             MenuFactory.addFolder();
//         };
//     }]);
//     menuModule.controller("DialogController", ["$scope", function($scope, MenuFactory) {
//         $scope.folders = MenuFactory.folders;
//     }]);


// angular.module("sfx").controller('MenuController',['$scope', function($scope){
//     $scope.folders = new Array<Folder>();
//     // $scope.clusters = new Array();
//     let iframeMap = new StringMap<HTMLElement>();
//     let currCluster: Cluster;


//     // $scope.onload = function(){
//     //     // localStorage.removeItem('folders');
//     //     console.log("Loading Things");
//     //     if(JSON.parse(localStorage.getItem('folders')) === null){
//     //         console.log("Nothing in the folders");
//     //         let folder = new Folder("----No Folder----");
//     //         $scope.folders.push(folder);
//     //     }
//     //     else{
//     //         let json = JSON.parse(localStorage.getItem('folders'));
//     //         console.log(json);
//     //         let cluster_found:boolean = false;
//     //         for(let folder of json){
//     //             let new_folder = new Folder(folder.label);
//     //             $scope.folders.push(new_folder);
//     //             for(let cluster of folder.clusters){
//     //                 let new_cluster = new Cluster(cluster.label, cluster.url);
//     //                 new_cluster.folder = folder.label;
//     //                 new_folder.clusters.push(new_cluster);
//     //                 iframeMap.add(cluster.url, document.createElement('iframe'));
//     //                 iframeMap.get(cluster.url).setAttribute("src", cluster.url);
//     //                 document.getElementById("iframes").appendChild(iframeMap.get(cluster.url));

//     //                 if(cluster_found === false){
//     //                     currCluster = cluster;
//     //                     cluster_found = true;
//     //                 }
//     //             }
//     //         }
//     //     }
//     // }
    


//     $scope.addCluster = function(label:string, url:string, folder:Folder){
        
//         $scope.new_cluster = "";
//         $scope.new_url = "";
//         $scope.selectedFolder = "";
//         let cluster = new Cluster(label, url + "/Explorer");
//         // if(cluster.url === "http://tcfabric01:19080"){
//         //     cluster.url = url;
//         // }
//         if(url === "index.html"){
//             cluster.url = url;
//         }
//         if($('#new_url').is(':disabled')){
//             cluster.url = "http://localhost:19080";
//         }

//         //Error Checking:
//         if(checkForErrors(cluster)){
//             return;
//         }
    
//         if(!currCluster){
//             currCluster = cluster;
//         }

//         if(folder){
//             cluster.folder = folder.label;
//             folder.clusters.push(cluster);
//         }
//         else{
//             // this.clusters.push(cluster);
//             this.folders[0].clusters.push(cluster);
//             cluster.folder = $scope.folders[0].label;
//         }

//         $scope.addcluster = false;
//         iframeMap.add(cluster.url, document.createElement('iframe'));
//         iframeMap.get(cluster.url).setAttribute("src", cluster.url);
//         document.getElementById("iframes").appendChild(iframeMap.get(cluster.url));
//         $scope.changeCluster(cluster);

//     }
//     $scope.addFolder = function(label:string){
//         $scope.new_folder = "";
//         if(!label){
//             document.getElementById("folder_error").innerHTML = "Must Enter a Folder Label!";
//             return;
//         }
//         else if(getFolder(label)){
//             document.getElementById("folder_error").innerHTML = "Folder already exists!";
//             return;
//         }

//         this.folders.push(new Folder(label));
//     }

//     $scope.changeCluster = function(new_cluster : Cluster){
//         iframeMap.get(currCluster.url).style.display = "none";
//         iframeMap.get(new_cluster.url).style.display = "block";
//         currCluster = new_cluster;

//         localStorage.setItem('folders', JSON.stringify($scope.folders));
//         console.log(JSON.parse(localStorage.getItem('folders')));
    
//     }


//     $scope.removeCluster = function(cluster:Cluster, folder_label: string){
//         console.log(cluster);
//         let folder = getFolder(folder_label) as Folder; 
//         folder.clusters.splice(folder.indexOf(cluster), 1);
//         if(currCluster === cluster){
//             iframeMap.get(currCluster.url).style.display = "none";
//             currCluster = null;
//         }
//         iframeMap.remove(cluster.url);

//     }

//     $scope.renameCluster = function(cluster:Cluster){
//         let dialog = prompt("Please enter a new cluster name", cluster.label);
//         if(dialog === null || dialog === ""){
//             cluster.label = cluster.label;
//         }
//         else{
//             cluster.label = dialog;
//         }
//     }


//     $scope.moveCluster = function(cluster: Cluster, folder_label: string){

//         console.log(cluster);
//         let folder = getFolder(folder_label);
//         let dialog = prompt("Please enter the folder name you want to move or create new folder", folder.label);
//         if(dialog === null || dialog === ""){
//             cluster.folder = folder.label;
//         }
//         else if(getFolder(dialog)){
//             let changeFolder = confirm("You want to change folder to " + dialog + "?");
//             if(changeFolder === true){
//                 getFolder(dialog).clusters.push(cluster);
//                 folder.clusters.splice(folder.indexOf(cluster), 1);
//                 cluster.folder = getFolder(dialog).label;
//             }
//             else{
//                 cluster.folder = folder.label;
//             }
//         }
//         else{
//             let createFolder = confirm("You want to create a new folder " + dialog + "?");
//             if(createFolder === true){
//                 $scope.addFolder(dialog);
//                 getFolder(dialog).clusters.push(cluster);
//                 folder.clusters.splice(folder.indexOf(cluster), 1);
//                 cluster.folder = getFolder(dialog).label;
//                 console.log(folder);
//                 console.log(getFolder(dialog));
//             }
//             else{
//                 cluster.folder = folder.label;
//             }
//         }
//     }

//     $scope.removeFolder = function(folder:Folder){
//         console.log(folder);
//         for(let cluster of folder.clusters){
//             $scope.removeCluster(cluster, folder.label);
//         }
//         $scope.folders.splice($scope.folders.indexOf(folder), 1);
//     }

//     $scope.renameFolder = function(folder:Folder){

//         let dialog = prompt("Please enter a new folder name", folder.label);
//         if(dialog === null || dialog === ""){
//             folder.label = folder.label;
//         }
//         else{
//             folder.label = dialog;
//         }
//     }
    
//     function getFolder(label: string){
//         for(let folder of $scope.folders){
//             if(folder.label === label) return folder;
//         }
//     }

//     function checkForErrors(cluster: Cluster){
    
//         if(!cluster.url){
//             document.getElementById("cluster_url_error").innerHTML = "Must Enter a Label";
//             return true;
//         }
//         else if(getCluster(cluster.url, "url")){
//             document.getElementById("cluster_url_error").innerHTML = cluster.url + " is already connected, Please enter new url";
//             return true;
//         }
//         else if(!checkUrl(cluster.url)){
//             document.getElementById("cluster_url_error").innerHTML = "URL not a Service Fabric Cluster!";
//             return true;
//         }

//         if(!cluster.label){
//             cluster.label = cluster.url 
//         }
        
//         else if(getCluster(cluster.label, "label")){
//             document.getElementById("cluster_name_error").innerHTML = cluster.label + " is already taken, Please enter new name";
//             return true;
//         }

//         return false;
//     }

//     function checkUrl(url: string){
//         let request;
//         if((<any>window).XMLHttpRequest){
//             request = new XMLHttpRequest();
//             console.log("initialized request");
//         }
//         else if((<any>window).ActiveXObject){
//             request = new ActiveXObject("Microsoft.XMLHTTP");
//         }
//         if(request){
//             request.open("GET", url);
//             console.log(request);
//             console.log(request.status);
//             if(request.status === 400){
//                 return false;
//             }
//             else if(request.status === 403){
//                 return false;
//             }
//         return true;
//         }


//         return false;

//     }

//     function getCluster(label: string, type:string){
//         for(let folder of $scope.folders){
//                for(let cluster of folder.clusters){
//                    if(cluster.label === label && type === "label") return cluster;
//                    else if(cluster.url === label && type === "url") return cluster;
//                } 
//         }

//         for(let cluster of $scope.folders[0].clusters){
//             if(cluster.label === label) return cluster;
//             else if(cluster.url === label) return cluster;
//         }
//     }

//     // window.onbeforeunload = function() {
//     //     localStorage.setItem('folders', JSON.stringify($scope.folders));
//     //     console.log(JSON.parse(localStorage.getItem('folders')));
        
//     // }
    
// }]);



