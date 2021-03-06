Polymer({
    is: 'VMap-tree',
    behaviors: [px.card],
    properties: {
        legendData: {
            type: Array,
            value: [],
            notify: true
        },
        data: {
            type: Array,
            value: [],
            notify: true
        },
        dataLoading: {
            type: Boolean,
            value: true
        },
        timers: {
            type: Array,
            value: []
        },
        barChartData: {
            type: Array,
            value: [],
            notify: true
        }

    },
      getCxtDetailsinfo: function() {
        var contextBrowser = document.querySelector('pxi-context-browser');
        var contextDetails = {
            classification: contextBrowser.getAttribute('classification'),
            assestUri: contextBrowser.getAttribute('assestUri'),
            userName: contextBrowser.getAttribute('userName'),
            assetName: contextBrowser.getAttribute('assetName')
        };
        return contextDetails;
    },

    showHideCard: function() {
        this.style.display = "none";
        document.querySelector('pfd-viewer').style = 'block';
    },
       /*Generating Breadcrumbs.*/
    genrteExternalInfo: function(data) {
        this.contextData = data;
        var self = this;
        var bcsContainer = document.querySelector('.vmap-bcs');
        while (bcsContainer.firstChild) {
            bcsContainer.removeChild(bcsContainer.firstChild);
        };
        var dataSize = data.length
        for (var i = 0; i < dataSize; i++) {
            if (data[i].isOpenable) {
                var bcElem = document.createElement('div');
                bcElem.className = 'single-vbc flt-left';
                if (i != dataSize - 1) {
                    bcElem.innerText = data[i].name + ' > ';
                    bcElem.classList.add('cursor', 'clickable');
                    bcElem.id = i;
                    /*Click on Breadcrumbs Navigation*/
                    bcElem.onclick = function() {
                        document.querySelector('pxi-context-browser').openedItemName = self.contextData[this.id].id;
                        document.querySelector('pxi-context-browser').configureBreadcrumbs();
                        document.querySelector('pxi-context-browser').selectItem(self.findAssetInMenu(document.querySelector('pxi-context-browser').browserContext.data[0], self.contextData[this.id].id));
                        var currentId = this.id;
                        var prevId = currentId - 1;
                        self.fire('open-context', {
                            current: self.contextData[currentId],
                            parent: self.contextData[prevId]
                        });
                    };
                } else {
                    bcElem.innerText = data[i].name;
                }
                bcsContainer.appendChild(bcElem);
            }

        }
    },
      refreshMap: function() {
        var self = this;
        self.intervalRefresh = setInterval(function() {
            self.fetchVMapTreeData();
            self.getTimeline();
            var autoslide = document.querySelector('#moveSlider');
            autoslide.setAttribute('value', '168');
        }, 60000);
    },
    /*To Find assest Info for breadcrumbs.*/
    findAssetInMenu: function(obj, str) {
        var _this = this;
        if (obj.id === str) {
            return obj;
        } else {
            for (var i = 0; i < obj.children.length; i++) {
                if (obj.children.length > 1) {
                    for (var j = 0; j < obj.children.length; j++) {
                        if (obj.children[j].id === str) {
                            return _this.findAssetInMenu(obj.children[j], str);
                        }
                    }
                }
                return _this.findAssetInMenu(obj.children[i], str);
            }
        }
    },
        startTimer: function() {
        var popupDiv = document.querySelector(".popup-vmap-container");
        this.timers.push(setTimeout(function() {
            popupDiv.style.display = "none";
        }, 500));
    },

    stopTimer: function() {
        if (this.timers.length) {
            for (var index in this.timers) {
                clearTimeout(this.timers[index]);
            }
        }
    },
      applyFilter: function() {
        clearTimeout(this.myVar);
        var data = this.data;
        this.$.filterTooltip.tooltipMessage = 'Filter applied';
        this.$.filiterIcon.classList.add('active-filter');
        data.filters.prodImp = this.$.productionFilter.value;
        data.filters.controls = this.$.controlFilter.value;
        data.filters.safety = this.$.safetyFilter.value;
        this.resetTimeOut();
        this.drawVMap(data);
        this.saveFilter(data.filters);
    },

    saveFilter: function(filters) {
        var contextDetails = this.getContextDetails();
        var dataObj = {
            'safety': filters.safety,
            'controls': filters.controls,
            'prodImp': filters.prodImp,
            'assetUri': contextDetails.assestUri
        };

        this.fetch(dataObj, 'api/vmap/applyFilter');
    },
    resetTimeOut: function() {
        var self = this;
        self.myVar = setTimeout(function() {
            self.resetFilter();
        }, 300000);
    },
       fetch: function(dataObj, url, successCallback, errorCallback) {
        var contextDetails = this.getContextDetails();
        dataObj.userId = contextDetails.userName;
        if (contextDetails.userName) {
            px.dealer.httpRequest({
                url: url,
                data: dataObj,
                method: 'POST'
            }).then(function(response) {
                successCallback && typeof successCallback === "function" && successCallback(response);
            }, function(message) {
                console.log(message);
                errorCallback && typeof errorCallback === "function" && errorCallback(message);
            });
        }
    },


 attached: function(alters, alertName) {
        var self = this;
        self.addEventListener('VMap-data-started', function() {
            this.set('dataLoading', true);
        });

        self.addEventListener('VMap-data-finished', function() {
            this.set('dataLoading', false);
        });
        self.addEventListener('move-slider', function() {
            var autoslide = document.querySelector('#moveSlider');
            autoslide.setAttribute('value', '168');
        });

        self.dragSlider();
        document.querySelector('.legend-section').style.display = 'none';
        this.style.display = "block";
        self.fetchVMapTreeData();
        self.getTimeline();
        self.refreshMap();
        var legendData = [{
            label: 'Safety',
            type: 'safety',
            class: '',
            isSwitched: true,
            color: '#ed1c24'
        }, {
            label: 'Controls',
            type: 'controls',
            class: '',
            isSwitched: true,
            color: '#f8d632'

        }, {
            label: 'Prod Impact',
            type: 'prodImpact',
            class: '',
            isSwitched: true,
            color: '#51bee5'
        }];
        self.legendData = legendData;
    }
});
function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}
function getIcon(severity, type) {
    var icons = {
        excursion: {
            0: 'images/Ex_Hi.png',
            1: 'images/Ex_Hi.png',
            2: 'images/Ex_Mid.png',
            3: 'images/Ex_Low.png',
        },
        anomaly: {
            0: 'images/Ex_Hi.png',
            1: 'images/Anmls_Hi.png',
            2: 'images/Anmls_Med.png',
            3: 'images/anmls_low.png'
        }

    }
    var temp = icons[type][severity];
    return icons[type][severity];
}
detached: function() {
    var self = this;
    if (self.intervalRefresh) {
        clearInterval(self.intervalRefresh);
    }
},
