window.GCComponents["Layers"].addLayer('layer-mod-istat-ca', {
    displayInLayerSwitcher:false,
    styleMap: new OpenLayers.StyleMap({
        'default': {
            fill: false,
            fillColor: '${color}',
            fillOpacity: 0.8,
            hoverFillColor: "white",
            hoverFillOpacity: 0.9,
            strokeColor: '${color}',
            strokeOpacity: 0.8,
            strokeWidth: 4,
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 10,
            pointRadius: 8,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "inherit"
        },
        'select': {
            fill: true,
            fillColor: "red",
            fillOpacity: 0.9,
            hoverFillColor: "white",
            hoverFillOpacity: 0.9,
            strokeColor: "red",
            strokeOpacity: 1,
            strokeWidth: 5,
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 10,
            pointRadius: 8,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        },
        'temporary': {
            fill: true,
            fillColor: "EEA652",
            fillOpacity: 0.2,
            hoverFillColor: "white",
            hoverFillOpacity: 0.8,
            strokeColor: "#EEA652",
            strokeOpacity: 1,
            strokeLinecap: "round",
            strokeWidth: 4,
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 0.2,
            pointRadius: 6,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        }
    })
}, {
    "sketchcomplete": function(obj) {
        // **** insert configured WFS layers
        if (typeof(clientConfig.MOD_ISTAT_CA_LAYER) === 'undefined') {
            return;
        }
        this.removeAllFeatures();

        window.GCComponents.Functions.modIstatCaGetData(obj.feature.geometry);
        obj.feature.attributes.color = clientConfig.MOD_ISTAT_CA_SELECTION_COLOR;
        //return false;
    },
    "beforefeatureadded": function(obj) {
        if (!obj.feature.attributes.hasOwnProperty('color')) {
            obj.feature.attributes.color = 'blue';
        }
    },
    "featureadded": function(obj) {
    },

    "refresh": function(obj) {
        this.origLayerIndex = this.map.getLayerIndex(this);
        var maxIndex = this.map.getLayerIndex(this.map.layers[this.map.layers.length -1]);
        if(this.origLayerIndex < maxIndex) this.map.raiseLayer(this, (maxIndex - this.origLayerIndex));
        this.map.resetLayersZIndex();
        this.redraw();
        var selectControl = this.map.getControlsBy('gc_id', 'control-mod-istat-ca-select_query_result');
        if (selectControl.length == 1) {

            selectControl[0].deactivate();
        }
    }
});

window.GCComponents["Controls"].addControl('control-mod-istat-ca-select_query_result', function(map){
    var wfsLayer = GisClientMap.map.getLayersByName('wfsResults');
    if (wfsLayer.length > 0) {
        return new OpenLayers.Control.SelectFeature(
            wfsLayer[0],
            {
                gc_id: 'control-mod-istat-ca-select_query_result',
                multiple: false,
                clickout: true,
                toggle: false,
                box: false,
                hover: false,
                onSelect: function(obj) {
                    if (obj.geometry.CLASS_NAME != 'OpenLayers.Geometry.Polygon' && obj.geometry.CLASS_NAME != 'OpenLayers.Geometry.MultiPolygon') {
                        alert ('Geometria non valida, è possibile selezionare solo oggetti avente geometria poligonale');
                        this.unselectAll();
                        return;
                    }
                    if ((typeof(clientConfig.MOD_ISTAT_CA_LAYERS_SELECTABLE) === 'undefined') || (clientConfig.MOD_ISTAT_CA_LAYERS_SELECTABLE.length == 0) || (clientConfig.MOD_ISTAT_CA_LAYERS_SELECTABLE.indexOf(obj.featureTypeName) >= 0 )) {
                        var selectionFeature = new OpenLayers.Feature.Vector(obj.geometry, {fid:0,color:clientConfig.MOD_ISTAT_CA_SELECTION_COLOR});
                        var istatLayer = GisClientMap.map.getLayersByName('layer-mod-istat-ca')[0];
                        istatLayer.removeAllFeatures();
                        istatLayer.addFeatures([selectionFeature]);
                        window.GCComponents.Functions.modIstatCaGetData(obj.geometry);
                    }
                    else {
                        alert ('Oggetto non valido come poligono per calcolo abitanti equivalenti su base ISTAT');
                    }
                    this.unselectAll();
                },
                onUnselect: function (obj) {
                },
                eventListeners: {
                    'activate': function(e){
                        if (map.currentControl != this) {
                            map.currentControl.deactivate();
                            var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                            if (touchControl.length > 0) {
                                touchControl[0].dragPan.deactivate();
                            }
                        }
                        this.origLayerIndex = this.map.getLayerIndex(this.layer);
                        var maxIndex = this.map.getLayerIndex(this.map.layers[this.map.layers.length -1]);
                        if(this.origLayerIndex < maxIndex) this.map.raiseLayer(this.layer, (maxIndex - this.origLayerIndex));
                        this.map.resetLayersZIndex();
                        map.currentControl=this;
                        map.div.style.cursor = 'crosshair';
                    },
                    'deactivate': function(e){
                        var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                        if (touchControl.length > 0) {
                            touchControl[0].dragPan.activate();
                        }
                        map.div.style.cursor = 'default';
                    },
                }
            }
        )
    }
});

window.GCComponents["Controls"].addControl('control-mod-istat-ca-toolbar', function(map){
    return new  OpenLayers.Control.Panel({
        gc_id: 'control-mod-istat-ca-toolbar',
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-mod-istat-ca"),
        autoActivate:false,
        saveState:true,
        draw: function() {
            var controls = [
                new OpenLayers.Control.DrawFeature(
                    map.getLayersByName('layer-mod-istat-ca')[0],
                    OpenLayers.Handler.Polygon,
                    {
                        gc_id: 'control-mod-istat-ca',
                        iconclass:"glyphicon-white glyphicon-edit",
                        text:'Selezione grafica',
                        title:'Seleziona Sezioni di Censimento',
                        eventListeners: {
                            'activate': function(e){
                                if (map.currentControl != this) {
                                    map.currentControl.deactivate();
                                    var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                                    if (touchControl.length > 0) {
                                        touchControl[0].dragPan.deactivate();
                                    }
                                }
                                map.currentControl=this;
                            },
                            'deactivate': function(e){
                                var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                                if (touchControl.length > 0) {
                                    touchControl[0].dragPan.activate();
                                }
                                var btnControl = map.getControlsBy('id', 'button-mod-istat-ca')[0];
                                if (btnControl.active)
                                    btnControl.deactivate();

                            }
                        }
                    }
                ),
                new OpenLayers.Control(
                    {
                        ctrl: this,
                        type: OpenLayers.Control.TYPE_BUTTON ,
                        iconclass:"glyphicon-white glyphicon-screenshot",
                        title:"Oggetto interrogato",
                        text:"Oggetto interrogato",
                        trigger: function () {
                            var selectControl = this.map.getControlsBy('gc_id', 'control-mod-istat-ca-select_query_result');
                            if (selectControl.length == 1) {

                                selectControl[0].activate();
                            }
                        }
                    }
                ),
                new OpenLayers.Control(
                    {
                        ctrl: this,
                        type: OpenLayers.Control.TYPE_BUTTON ,
                        iconclass:"glyphicon-white glyphicon-share",
                        text:"Importa/Esporta Poligono",
                        title:"Importa/Esporta Poligono",
                        trigger: function () {
                            window.GCComponents.Functions.modIstatCaEditPanel.call(this);
                        }
                    }
                )
            ];
            this.addControls(controls);
            OpenLayers.Control.Panel.prototype.draw.apply(this);
        },
        redraw: function () {
            OpenLayers.Control.Panel.prototype.redraw.apply(this);
        }
    })
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-mod-istat-ca',
    'Seleziona Sezioni di Censimento',
    'glyphicon-white glyphicon-user',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            this.map.getLayersByName('layer-mod-istat-ca')[0].removeAllFeatures();
            if (this.active) {
                this.deactivate();
                var drawControl = this.map.getControlsBy('gc_id', 'control-mod-istat-ca-toolbar');
                if (drawControl.length == 1)
                    drawControl[0].deactivate();
            }
            else
            {
                this.activate();
                var drawControl = this.map.getControlsBy('gc_id', 'control-mod-istat-ca-toolbar');
                if (drawControl.length == 1)
                    drawControl[0].activate();
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'tools'}
);
