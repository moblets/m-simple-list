/* eslint no-undef: [0]*/
module.exports = {
  title: "mSimpleList",
  style: "m-simple-list.scss",
  template: 'm-simple-list.html',
  i18n: {
    pt: "lang/pt-BR.json",
    en: "lang/en-US.json"
  },
  link: function() {},
  controller: function(
    $scope,
    $rootScope,
    $mMoblet,
    $mDataLoader,
    $filter,
    $timeout,
    $state,
    $stateParams
  ) {
    var dataLoadOptions;
    var list = {
      /**
       * Set the view and update the needed parameters
       * @param  {object} data Data received from Moblets backend
       * @param  {boolean} more If called by "more" function, it will add the
       * data to the items array
       */
      setView: function(data, more) {
        if (isDefined(data)) {
          $scope.error = false;
          $scope.listStyle = data.listStyle;
          $scope.itemStyle = data.itemStyle;

          // If it was called from the "more" function, concatenate the items
          $scope.items = (more) ? $scope.items.concat(data.items) : data.items;

          // Check if the page is loading the list or a detail
          $scope.isDetail = list.isDetail();

          // Disable the "more" function if the API don't have more items
          $scope.more = (data.hasMoreItems) ? list.more : undefined;
        } else {
          $scope.error = true;
        }
        // Broadcast complete refresh and infinite scroll
        $rootScope.$broadcast('scroll.refreshComplete');
        $rootScope.$broadcast('scroll.infiniteScrollComplete');

        // If the view is showing the detail, call showDetail
        if ($scope.isDetail) {
          list.showDetail();
        }

        // Remove the loading animation
        $scope.isLoading = false;
      },
      /**
       * Check if the view is showing a detail or the list. The function checks
       * if $stateParams.detail is set.
       * @return {boolean} True if the view must show a detail.
       */
      isDetail: function() {
        return $stateParams.detail !== "" || $scope.items.length === 1;
      },
      /**
       * Show the detail getting the index from $stateParams.detail. Set "item"
       * to the selected detail
       */
      showDetail() {
        var itemIndex = _.findIndex($scope.items, function(item) {
          return item.id.toString() === $stateParams.detail;
        });
        $scope.item = $scope.items[itemIndex];
      },
      /**
       * Load data from the Moblets backend:
       * - show the page loader if it's called by init (sets showLoader to true)
       * - Use $mDataLoader.load to get the moblet data from Moblets backend.
       * 	 The parameters passed to $mDataLoader.load are:
       * 	 - $scope.moblet - the moblet created in the init function
       * 	 - false - A boolean that sets if you want to load data from the
       * 	   device storage or from the Moblets API
       * 	 - dataLoadOptions - An object with parameters for pagination
       * @param  {boolean} showLoader Boolean to determine if the page loader
       * is active
       */
      load: function(showLoader) {
        $scope.isLoading = showLoader || false;
        // Reset the pagination
        dataLoadOptions.offset = 0;
        // mDataLoader also saves the response in the local cache. It will be
        // used by the "showDetail" function
        $mDataLoader.load($scope.moblet, dataLoadOptions)
          .then(function(data) {
            list.setView(data)
          }
        );
      },
      /**
       * Load more data from the backend if there are more items.
       * - Update the offset summing the number of items
       - Use $mDataLoader.load to get the moblet data from Moblets backend.
       * 	 The parameters passed to $mDataLoader.load are:
       * 	 - $scope.moblet - the moblet created in the init function
       * 	 - false - A boolean that sets if you want to load data from the
       * 	   device storage or from the Moblets API
       * 	 - dataLoadOptions - An object with parameters for pagination
       */
      more: function() {
        // Add the items to the offset
        dataLoadOptions.offset += dataLoadOptions.items;

        $mDataLoader.load($scope.moblet, dataLoadOptions)
          .then(function(data) {
            list.setView(data, true);
          });
      },
      /**
       * Initiate the list moblet:
       * - Create a moblet with $mMoblet.load()
       * - put the list.load function in the $scope
       * - run list.load function
       */
      /*
        TODO
       */
      init: function() {
        dataLoadOptions = {
          offset: 0,
          items: 25,
          cache: ($stateParams.detail !== "")
        };

        $scope.moblet = $mMoblet.load();
        $scope.load = list.load;
        $scope.load(true);
      }
    }

    var listItem = {
      goTo: function(item) {
        $stateParams.detail = item.id;
        $state.go('moblet', $stateParams);
      }
    };

    $scope.load = list.load;
    $scope.goTo = listItem.goTo;
    list.init();
  }
};
