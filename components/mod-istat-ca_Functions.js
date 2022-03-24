
window.GCComponents.Functions.modIstatCaGetData = function (selectionGeom) {
    var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
    loadingControl.maximizeControl();

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
                var drawControl = GisClientMap.map.getControlsBy('gc_id', 'control-mod-istat-ca');
                if (drawControl.length == 1)
                    drawControl[0].deactivate();
                loadingControl.minimizeControl();
                return alert('Errore di sistema');
            }
            if(!response.length) {
                istatReportHTML = "Nessun dato ISTAT disponibile nell'area selezionata";
                $('#DetailsWindow div.modal-body').html(istatReportHTML);
                $('#DetailsWindow h4.modal-title').html('Calcolo dati ISTAT su poligono selezionato');
                $('#DetailsWindow').modal('show');
                var drawControl = GisClientMap.map.getControlsBy('gc_id', 'control-mod-istat-ca');
                if (drawControl.length == 1)
                    drawControl[0].deactivate();
                loadingControl.minimizeControl();
                return;
            }

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
                if (isNaN(supRatio)) {
                    supRatio = 0;
                    console.log('supRatio set to 0 at index' + i);
                }
                var buildRatio = istatObj.ca_n_building/istatObj.gc_n_building;
                if (isNaN(buildRatio)) {
                    buildRatio = 0;
                    console.log('buildRatio set to 0 at index' + i);
                }
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

            var drawControl = GisClientMap.map.getControlsBy('gc_id', 'control-mod-istat-ca');
            if (drawControl.length == 1)
                drawControl[0].deactivate();

            loadingControl.minimizeControl();
        },
        error: function() {
            var drawControl = GisClientMap.map.getControlsBy('gc_id', 'control-mod-istat-ca');
            if (drawControl.length == 1)
                drawControl[0].deactivate();
            loadingControl.minimizeControl();
        }
    });
};

window.GCComponents.Functions.modIstatCaExport = function (selectionGeom, exportType) {
    var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
    loadingControl.maximizeControl();
    var params = {
        srid: GisClientMap.map.projection,
        export: exportType,
        sGeom: selectionGeom
    };

    if (GisClientMap.map.projection != GisClientMap.map.displayProjection) {
        params.srid = GisClientMap.map.displayProjection;
    }

    $.ajax({
        url: clientConfig.GISCLIENT_URL + '/services/plugins/mod-istat-ca/istatZoneCalc.php',
        method: 'POST',
        dataType: 'json',
        data: params,
        success: function(response) {
            if(!response || typeof(response) != 'object') {
                loadingControl.minimizeControl();
                return alert('Errore di sistema');
            }
            if(!response.hasOwnProperty('result')) {
                loadingControl.minimizeControl();
                return alert('Errore di sistema');
            }
            if(response.result != 'ok') {
                loadingControl.minimizeControl();
                return alert(response.message);
            }

            window.location.assign(response.file);

            loadingControl.minimizeControl();
        },
        error: function() {
            loadingControl.minimizeControl();
        }
    });
}

window.GCComponents.Functions.modIstatCaEditPanel = function () {
    formTitle = 'Inserisci o esporta poligono di selezione';
    var istatLayer = GisClientMap.map.getLayersByName('layer-mod-istat-ca')[0];
    var parserWKT = new OpenLayers.Format.WKT();

    $('ul.nav-tabs').hide();
    $('#ricerca').addClass('active');
    $('#avanzata').removeClass('active');
    $('#searchFormTitle').html(formTitle);
    var form = '<table>';
    form += '<tr><td>Poligono di selezione (WKT - Coordinate in ';
    form += GisClientMap.map.displayProjection + ' ' + Proj4js.defs[GisClientMap.map.displayProjection].match(/^\+title=[ ]*([^+]*)/)[1].trim();
    form += ')</td></tr>';
    form += '<tr><td><textarea name="select_polygon_wkt" class="form-control" rows="4" id="select_polygon_wkt">';

    if (istatLayer.features.length > 0) {
        var fSelection = istatLayer.features[0].clone();
        if (GisClientMap.map.projection != GisClientMap.map.displayProjection) {
            fSelection.geometry.transform(GisClientMap.map.projection, GisClientMap.map.displayProjection);
        }
        form += parserWKT.write(fSelection);
    }
    form += '</textarea>';
    form += '</td></tr>';
    form += '</table>';

    if ($.mobile) {
        form += '<button type="submit" role="btn-select" class="btn btn-default ui-btn ui-shadow ui-corner-all">Seleziona</button>';
        form += '<button type="submit" role="btn-copy" class="btn btn-default ui-btn ui-shadow ui-corner-all">Copia</button>';
        form += '<button type="submit" role="btn-export-shp" class="btn btn-default ui-btn ui-shadow ui-corner-all">Esporta SHP</button>';
    }
    else {
        form += '<button type="submit" role="btn-select" class="btn btn-default">Seleziona</button>';
        form += '<button type="submit" role="btn-copy" class="btn btn-default">Copia</button>';
        form += '<button type="submit" role="btn-export-shp" class="btn btn-default">Esporta SHP</button>';
    }

    //form += '</form>';

    $('#ricerca').empty().append(form);

    $('#ricerca button[role="btn-select"]').click(function(event) {
        event.preventDefault();
        var WKTInput = $('#select_polygon_wkt').val();
        if (WKTInput.length > 0) {
            var geomInput = OpenLayers.Geometry.fromWKT(WKTInput);
            if (GisClientMap.map.projection != GisClientMap.map.displayProjection) {
                geomInput.transform(GisClientMap.map.displayProjection, GisClientMap.map.projection);
            }
            var istatFeature = new OpenLayers.Feature.Vector(geomInput, {color:clientConfig.MOD_ISTAT_CA_SELECTION_COLOR});
            istatLayer.removeAllFeatures();
            istatLayer.addFeatures([istatFeature]);
            window.GCComponents.Functions.modIstatCaGetData(geomInput);
            $('#SearchWindow').modal('hide');
        }
        else {
            alert ('Nessuna geometria disponibile per effettuare una selezione');
        }
    });

    $('#ricerca button[role="btn-copy"]').click(function(event) {
        event.preventDefault();
        var geomCopy = document.getElementById("select_polygon_wkt");
        if (geomCopy.value.length > 0) {
            geomCopy.select();
            geomCopy.setSelectionRange(0, 99999);
            document.execCommand("copy");
            alert ('Geometria WKT copiata negli appunti');
            $('#SearchWindow').modal('hide');
        }
        else {
            alert ('Geometria WKT non disponibile per esportazione');
        }
    });

    $('#ricerca button[role="btn-export-shp"]').click(function(event) {
        event.preventDefault();
        var WKTInput = $('#select_polygon_wkt').val();
        if (WKTInput.length > 0) {
            window.GCComponents.Functions.modIstatCaExport(WKTInput, 'shp');
            $('#SearchWindow').modal('hide');
        }
        else {
            alert ('Geometria WKT non disponibile per esportazione');
        }
    });

    $('#SearchWindow').modal('show');
};
