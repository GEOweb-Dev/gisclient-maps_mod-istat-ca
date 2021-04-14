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
        debugger;
        // **** Get main selection control
        var selectControls = this.map.getControlsBy('gc_id', 'control-querytoolbar');
        if (selectControls.length != 1)
            return;
        if (!selectControls[0].controls)
            return;
        var selectControl = selectControls[0];

        // **** insert configured WFS layers
        if (typeof(clientConfig.MOD_ISTAT_CA_LAYER) === 'undefined') {
            return;
        }

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
    }
});

// **** Point marker draw control
window.GCComponents["Controls"].addControl('control-mod-istat-ca', function(map){
    return new OpenLayers.Control.DrawFeature(
        map.getLayersByName('layer-mod-istat-ca')[0],
        OpenLayers.Handler.Polygon,
        {
            gc_id: 'control-mod-istat-ca',
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
    )
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
                var drawControl = this.map.getControlsBy('gc_id', 'control-mod-istat-ca');
                if (drawControl.length == 1)
                    drawControl[0].deactivate();
            }
            else
            {
                this.activate();
                var drawControl = this.map.getControlsBy('gc_id', 'control-mod-istat-ca');
                if (drawControl.length == 1)
                    drawControl[0].activate();
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'tools'}
);
