BEM.DOM.decl({ name: "map", modName: "api", modValue: "ymaps" }, {

    onSetMod : {
        'js' : function () {
            this.loadMapsApi();
        }
    },

    // Описываем модули, котоыре будем загружить.
    mapsPackages: [
        // Первый этап загрузки.
        [
            'package.map'

        ],
        // Второй этап загрузки.
        [   
            'package.standard'
        ]
    ],
    /** 
     * Загрузчик API.
     */
    loadMapsApi: function () {
        if (!window.ymaps) {
            var apiScript = document.createElement('script'),
                apiCallback = 'ymapsloaded', 
                _this = this;

            window[apiCallback] = $.proxy(function () {
                this.onAPILoaded();
            }, this);

            apiScript.src = [
                'http://api-maps.yandex.ru/2.0/?',
                '&load=' + this.mapsPackages[0].join(','),
                '&lang=' + this.params.lang,
                '&onload=' + apiCallback
            ].join('');

            document.getElementsByTagName('head')[0].appendChild(apiScript);
        } else {
            this.onAPILoaded();
        }   
    }, 

    /** 
     * Выполнится после загрузки API.
     */
    onAPILoaded: function () {
        // Запускаем инициализацию карты.
        this.initMap();
        // И говорим, чтобы API подгрузило вторую часть описаных нами пакетов. 
        // Это очень полезно для слабого интернета. 
        ymaps.load(this.mapsPackages[1].join(','), function () {
            // Когда пакеты подгрузятся, выполним последние шаги. 
            this.continueInit();
        }, this);
    },

    /** 
     * Инициализация карты. 
     */
    initMap: function () {
        var center = this.params.center || [55.76, 37.64],
            zoom = this.params.zoom;

        // Инициализация карты
        this.map = new ymaps.Map(this.domElem[0], {
            center: center,
            zoom: zoom,
            behaviors: ['drag', 'dblClickZoom', 'scrollZoom']
        });
    },

    continueInit: function () {
        // Так как сначала мы загрузили чистую карту без компонент, 
        // нужно ее пересобрать с новыми модулями. 
        this.map.destroy()
        this.initMap();   

        // Если есть метки, то добавляем метки на карту. 
        if (this.params.geoObjects && this.params.geoObjects.length > 0) {
            this.params.geoObjects.forEach(function (item) {
                // Проверяем, является ли элемент коллекцией.
                var geoObject;
                if (item.collection) {
                    geoObject = new ymaps.GeoObjectArray({ 
                        properties: item.properties 
                    }, { 
                        preset: item.preset 
                    });

                    // Теперь добавим элементы, описанные в bemjson в коллецию.
                    item.data.forEach(function (placemark) {
                        geoObject.add(new ymaps.Placemark(placemark.coords, placemark.options));
                    }, this);
                } else {
                    geoObject = new ymaps.Placemark(item.coords, item.options);
                }
                
                // После можно добавлять географический объект на карту.
                this.map.geoObjects.add(geoObject);
            }, this);
        }

        // Установка bounds по добавленным геообъектам. 
        if (this.params.setupBoundsByGeoObjects) {
            this.map.setBounds(this.map.geoObjects.getBounds());
        }

        // Добавляем контроллы на карту
        this.map.controls
            .add('zoomControl')
            .add('scaleLine')
            .add('typeSelector')
            .add('mapTools');

        // Блок поделится информацией о том, что он инициализировал карту. 
        this.trigger('map-inited');
    },

    /** 
     * Получение ссылки на карту. 
     */
    getMap: function () {
        return this.map
    }
});