
window.GCComponents.Functions.modIstatCaGetData = function (selectionGeom) {
    var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
    loadingControl.maximizeControl();

    debugger;
    var parserWKT = new OpenLayers.Format.WKT();
    var wktGeom = parserWKT.extractGeometry(selectionGeom);
    var istatReportHTML = "";

    var params = {
        featureType: clientConfig.MOD_ISTAT_CA_LAYER,
        featureTypeBuildings: clientConfig.MOD_ISTAT_CA_BUILDINGS_LAYER,
        srid: GisClientMap.map.projection,
        projectName : GisClientMap.projectName,
        mapsetName : GisClientMap.mapsetName,
        sGeom: wktGeom
    };

    $.ajax({
        url: clientConfig.GISCLIENT_URL + '/services/plugins/mod-istat-ca/istatZoneCalc.php',
        method: 'POST',
        dataType: 'json',
        data: params,
        success: function(response) {
            if(!response || typeof(response) != 'object') {
                return alert('Errore di sistema');
                loadingControl.minimizeControl();
            }
            if(!response.length) {
                istatReportHTML = "Nessun dato ISTAT disponibile nell'area selezionata";
                loadingControl.minimizeControl();
                return;
            }

            debugger;
            var features = [];
            var nAbitanti = [0,0,0,0];
            var nAbitazOccResid = [0,0,0,0];
            var nAbitazVuote = [0,0,0,0];
            var nAbitazOccNoResid = [0,0,0,0];
            var superfAbitaz = [0,0,0,0];
            var nEdificiResid = [0,0,0,0];
            var nEdificiComplex = [0,0,0,0];
            for(var i = 0; i < response.length; i++) {
                var istatObj = response[i];
                var supRatio = istatObj.istat_ca_area/istatObj.istat_gc_area;
                var buildRatio = istatObj.ca_n_building/istatObj.gc_n_building;
                if (supRatio == 1) {
                    nAbitanti[0] += istatObj.abitanti;
                    nAbitazOccResid[0] += istatObj.a2;
                    nAbitazVuote[0] += istatObj.a3;
                    nAbitazOccNoResid[0] += istatObj.a7;
                    superfAbitaz[0] += istatObj.a44;
                    nEdificiResid[0] += istatObj.e3;
                    nEdificiComplex[0] += istatObj.e4;
                }
                nAbitanti[1] += istatObj.abitanti;
                nAbitazOccResid[1] += istatObj.a2;
                nAbitazVuote[1] += istatObj.a3;
                nAbitazOccNoResid[1] += istatObj.a7;
                superfAbitaz[1] += istatObj.a44;
                nEdificiResid[1] += istatObj.e3;
                nEdificiComplex[1] += istatObj.e4;
                nAbitanti[2] += (istatObj.abitanti*supRatio);
                nAbitazOccResid[2] += (istatObj.a2*supRatio);
                nAbitazVuote[2] += (istatObj.a3*supRatio);
                nAbitazOccNoResid[2] += (istatObj.a7*supRatio);
                superfAbitaz[2] += (istatObj.a44*supRatio);
                nEdificiResid[2] += (istatObj.e3*supRatio);
                nEdificiComplex[2] += (istatObj.e4*supRatio);
                nAbitanti[3] += (istatObj.abitanti*buildRatio);
                nAbitazOccResid[3] += (istatObj.a2*buildRatio);
                nAbitazVuote[3] += (istatObj.a3*buildRatio);
                nAbitazOccNoResid[3] += (istatObj.a7*buildRatio);
                superfAbitaz[3] += (istatObj.a44*buildRatio);
                nEdificiResid[3] += (istatObj.e3*buildRatio);
                nEdificiComplex[3] += (istatObj.e4*buildRatio);

                var geometry = OpenLayers.Geometry.fromWKT(istatObj.gc_geom_wkt_mapsrid);
                var istatFeature = new OpenLayers.Feature.Vector(geometry, {fid:istatObj.fid,color:clientConfig.MOD_ISTAT_CA_LAYER_COLOR});
                features.push(istatFeature);
            }
            debugger;
            var istatLayer = GisClientMap.map.getLayersByName('layer-mod-istat-ca')[0];
            istatLayer.addFeatures(features);
            istatLayer.refresh();
            istatReportHTML += '<ul class="nav nav-tabs">';
            istatReportHTML += '<li class="active"><a href="#istat-dwellers" data-toggle="tab">Abitanti</a></li>';
            istatReportHTML += '<li role="istat-buildings"><a href="#istat-buildings" data-toggle="tab">Edifici</a></li>';
            istatReportHTML += '</ul>';
            istatReportHTML += '<div class="tab-content">';
            istatReportHTML += '<div class="tab-pane active" id="istat-dwellers" style="height: auto;">'
            istatReportHTML += 'Calcolo degli abitanti:<ul>'
            istatReportHTML += '<li>Nelle sezioni di censimento contenute nel poligono: ' + nAbitanti[0] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono: ' + nAbitanti[1] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di area intersecante: ' + nAbitanti[2] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di case intersecanti: ' + nAbitanti[3] + '</li>';
            istatReportHTML += '</ul>';
            istatReportHTML += 'Calcolo delle abitazioni occupate da almeno una persona residente:<ul>'
            istatReportHTML += '<li>Nelle sezioni di censimento contenute nel poligono: ' + nAbitazOccResid[0] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono: ' + nAbitazOccResid[1] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di area intersecante: ' + nAbitazOccResid[2] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di case intersecanti: ' + nAbitazOccResid[3] + '</li>';
            istatReportHTML += '</ul>';
            istatReportHTML += 'Calcolo delle abitazioni vuote e abitazioni occupate solo da persone non residenti:<ul>'
            istatReportHTML += '<li>Nelle sezioni di censimento contenute nel poligono: ' + nAbitazVuote[0] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono: ' + nAbitazVuote[1] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di area intersecante: ' + nAbitazVuote[2] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di case intersecanti: ' + nAbitazVuote[3] + '</li>';
            istatReportHTML += '</ul>';
            istatReportHTML += 'Calcolo delle abitazioni occupate solo da persone non residenti:<ul>'
            istatReportHTML += '<li>Nelle sezioni di censimento contenute nel poligono: ' + nAbitazOccNoResid[0] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono: ' + nAbitazOccNoResid[1] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di area intersecante: ' + nAbitazOccNoResid[2] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di case intersecanti: ' + nAbitazOccNoResid[3] + '</li>';
            istatReportHTML += '</ul>';
            istatReportHTML += 'Calcolo delle superfici delle abitazioni occupate da almeno una persona residente:<ul>'
            istatReportHTML += '<li>Nelle sezioni di censimento contenute nel poligono: ' + superfAbitaz[0] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono: ' + superfAbitaz[1] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di area intersecante: ' + superfAbitaz[2] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di case intersecanti: ' + superfAbitaz[3] + '</li>';
            istatReportHTML += '</ul>';
            istatReportHTML += '</div><div class="tab-pane" id="istat-buildings">';
            istatReportHTML += 'Calcolo degli edifici ad uso residenziale:<ul>'
            istatReportHTML += '<li>Nelle sezioni di censimento contenute nel poligono: ' + nEdificiResid[0] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono: ' + nEdificiResid[1] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di area intersecante: ' + nEdificiResid[2] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di case intersecanti: ' + nEdificiResid[3] + '</li>';
            istatReportHTML += '</ul>';
            istatReportHTML += 'Calcolo degli edifici e complessi di edifici (utilizzati) ad uso produttivo, commerciale, direzionale/terziario, turistico:<ul>'
            istatReportHTML += '<li>Nelle sezioni di censimento contenute nel poligono: ' + nEdificiComplex[0] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono: ' + nEdificiComplex[1] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di area intersecante: ' + nEdificiComplex[2] + '</li>';
            istatReportHTML += '<li>Nelle sezioni di censimento intersecanti il poligono in proporzione alla percentuale di case intersecanti: ' + nEdificiComplex[3] + '</li>';
            istatReportHTML += '</ul></div>';

            $('#DetailsWindow div.modal-body').html(istatReportHTML);
            $('#DetailsWindow h4.modal-title').html('Calcolo dati ISTAT su poligono selezionato');
            $('#DetailsWindow').modal('show');

            loadingControl.minimizeControl();
        },
        error: function() {
            loadingControl.minimizeControl();
        }
    });
};
