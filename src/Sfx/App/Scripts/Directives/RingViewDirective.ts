module Sfx {

  

  export class RingViewDirective implements ng.IDirective {
    public restrict = "AE";
    public replace = true;
    public templateUrl = "partials/ring-view.html";
    public scope = {
        nodes: "=",
        clusterManifest: "=",
    };

    public link($scope: any, element: JQuery, attributes: any, ctrl: DetailViewPartController) {
      let makeTippy = (node, html) => {
        return tippy( node.popperRef(), {
          html: html,
          trigger: 'manual',
          arrow: true,
          placement: 'bottom',
          hideOnClick: false,
          interactive: true
        } ).tooltips[0];
      };

      let hideTippy = (node) => {
        let tippy = node.data('tippy');
  
        if(tippy != null){
          tippy.hide();
        }
      };

      let ws:WebSocket;
      let recreateTimer;
      $scope.ipaddr = "";


  
      let recreateWs = () => {

        let tmap = {}

        let m = $($scope.clusterManifest.raw.Manifest);
        m.find("NotificationEndpoint").each((idx, endpoint) => {
          let type = $(endpoint).parent().parent().attr("Name");
          let port = $(endpoint).attr("Port");
          tmap[type]  = port;
        });

        let candidateEndpoints = [];

        m.find("Node").each((idx, n) => {
          candidateEndpoints.push($(n).attr("IPAddressOrFQDN") + ":" + tmap[$(n).attr("NodeTypeRef")]);
        })

        // TODO load from config
        ws = new WebSocket("ws://" + candidateEndpoints[0]);
        // ws = new WebSocket("ws://127.0.0.1:10286");
  
        ws.onerror = (error) => {
          console.log(error)
          if (recreateTimer){
            clearTimeout(recreateTimer);
          }
          recreateTimer = setTimeout(recreateWs, 1000);
        };

        ws.onmessage = (message) => {
          let json;
          try {
            json = JSON.parse(message.data);
          } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
          }
          $scope.messageHandler(json);
        };

        ws.onopen = () => {
          candidateEndpoints.forEach((ip) => {
            $scope.sendQuery(ip);
          })
        };
      }

      $scope.clusterManifest.ensureInitialized().then( data => {
        recreateWs();
      })

      $scope.sendQuery = (endpint: string) => {
        if(ws.readyState !== WebSocket.OPEN){
          return;
        }

        ws.send(JSON.stringify(
          {
            "message_type": "query",
            "address": endpint,
          }
        ))
      }

      $scope.addNode = () => {
        $scope.sendQuery($scope.ipaddr);
        $scope.ipaddr = "";
      }

      let cy = cytoscape({
        container: document.getElementById('cytoscape-canvas'),
        zoomingEnabled: false,
        userZoomingEnabled: false,
        autoungrabify: false,
        style: [{
          "selector": "node",
          "style": {
              "content": "data(label)",
              "font-size": "12px",
              "text-valign": "center",
              "text-halign": "center",
              "background-color": "#7FBA00",
              "text-outline-color": "#555",
              "text-outline-width": "2px",
              "color": "#fff",
              "overlay-padding": "6px",
              "z-index": "10"
          }
       }],
      });

      let hideAllTippies = () => {
        cy.nodes().forEach(hideTippy);
      };

      cy.on('tap', (e) => {
        if(e.target === cy){
          hideAllTippies();
        }
      });
  
      cy.on('tap', 'edge', (e) => {
        hideAllTippies();
      });
  
      cy.on('zoom pan', (e) => {
        hideAllTippies();
      });   

      $(".main-view").scroll((e) => {
        hideAllTippies();
      });

      $scope.buildLabel = (node: any) => {
        return `${node.node_id.substring(0, 5)}(${node.phase})"`;
      }

      $scope.messageHandler = (node: any) => {

        let id = "sfnode_" + node.node_id;
        let n = cy.nodes("#" + id);

        if (!n.id()) {
          n = cy.add({
            group: 'nodes',
              data: { 
                "id": id,
                "label": $scope.buildLabel(node),
                "origin": node,
              },
            });

            let el = document.createElement('div')
            let tippy = makeTippy(n, el);

            n.data('tippy', tippy);
            n.data('el', el);


            n.on("click", () => {
              let origin = n.data('origin');

              // console.log(origin);
              let ul = $("<div>")
              ul.css("text-align", "left");
              ul.append($("<p>").text("Phase:" + origin.phase));
              ul.append($("<p>").text("Join Phase:" + origin.join_phase));
              ul.append($("<p>").text("Node Id:" + origin.node_id));
              ul.append($("<p>").text("Token Start:" + origin.routing_token_start));
              ul.append($("<p>").text("Token End:" + origin.routing_token_end));
              ul.append($("<p>").text("Token Version:" + origin.routing_token_version));

              $(el).replaceWith(ul);
              tippy.show();
            });

        } else {
            n.data("label", $scope.buildLabel(node));
            n.data("origin", node);
        }

        cy.edges('[source = "' + id + '"]').remove();


        node.neighborhood.forEach(neighbor => {
          let dstid = "sfnode_" + neighbor.node_id;
          if (dstid === id) {
            return;
          }

          try {
            cy.add({
              group: 'edges',
              data: { source: id, target: dstid},
            });
          }catch(e){
          }
        })

        let layout = cy.layout({'name': 'circle'});
        layout.run();
      }

      $scope.preprocess = (node: any) => {
        node.node_id = node.node_id.padStart(32, "0");
        node.routing_token_start = node.routing_token_start.padStart(32, "0");
        node.routing_token_end = node.routing_token_end.padStart(32, "0");
      }
    }
  }
}
