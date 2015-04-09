var app = angular.module('dUtilApp', []);

app.factory('datePickerFactory', function() {

  var datePickerFactory = function() {};

  datePickerFactory.prototype.getMoment = function(year, month, day) {
    var newDate = moment(year + '-' + month + '-' + day, 'YYYY-MM-DD'); //parser ignores non-alphanumeric characters(both - and / are fine)
    return newDate;
  };

  return datePickerFactory;
});

app.directive('datePicker', function($window, datePickerFactory) { //register a directive
  return {
    restrict: 'E',
    require: 'ngModel',
    replace: false,
    // templateUrl: 'myUtil/dUtil_templates.html',
    template: ' <div class="datePicker" ng-click="handleClick()" > <input ng-class="{datePickerInvalid: !validRange}" class="datePickerInfo" type="text"  ng-click="clickDatePicker()" ng-model="dateInfo.displayDate" readonly placeholder="select date range"></input><label class="datePickerErrMsg" ng-model="errMsg">{{ errMsg }}</label> <div class="calendar" ng-show="expandDatePicker"> <div class="selectMonthYearBar"> <button ng-click="previousMonth()">&#8592</button> <select ng-model="dateInfo.range" ng-options="range.name for range in ranges" ng-change="quickDateRange(dateInfo.range)"></select> <button ng-click="nextMonth()">&#8594</button> </div> <table class="datePickerTable"> <thead class="calendarHead"> <td ng-repeat="d in dpObj.displayYearMonth track by $index">{{ d }} </td> </thead> <tr class="calendarTable"> <td ng-repeat="row in dpObj.rows"> <table class="dateTable"> <thead class="dateHead"> <tr> <td>S</td> <td>M</td> <td>T</td> <td>W</td> <td>T</td> <td>F</td> <td>S</td> </tr> </thead> <tbody> <tr ng-repeat="week in row"> <td ng-repeat="day in week track by $index" class="day" ng-class="getClassForDays($parent.$index, $index, $parent.$parent.$index)" ng-click="onDayClick($parent.$index, $index, $parent.$parent.$index)">{{ day }}</td> </tr> </tbody> </table> </td> </tr> </table> <div class=fromToBar> From <input ng-class="{fromToDisplay: fromDateToSelect}" ng-model="dateInfo.fromDate" type="text" readonly></input> To <input ng-class="{fromToDisplay: !fromDateToSelect}" ng-model="dateInfo.toDate" type="text" readonly></input> </div> </div> </div> ',

    link: function(scope, element, attrs, ngModelCtrl) {

      var clickInsideDatePicker = false;
      var fromBeforeTo = true;
      scope.validRange = true;
      scope.fromDateToSelect = true;
      scope.expandDatePicker = false;
      /**
       * @description Bind the click event, so click anywhere exclude the datepicker
       * will trigger the datepicker to close
       */
      angular.element(document).bind("click", function(event) {
        scope.$apply(function() {
          if (!clickInsideDatePicker) {
            if (!fromBeforeTo) {
              scope.expandDatePicker = true;
            } else {
              scope.expandDatePicker = false;
            }
          }
          clickInsideDatePicker = false;
        });
      });

      var dateHelper = new datePickerFactory();

      scope.ranges = [{
        name: 'Custom ranges',
        v: '-1'
      }, {
        name: 'Today',
        v: '0'
      }, {
        name: 'Yesterday',
        v: '1'
      }, {
        name: 'Last Week',
        v: '7'
      }, {
        name: 'Last Month',
        v: '28'
      }, {
        name: 'Last 3 Months',
        v: '91'
      }, {
        name: 'Last 12 Months',
        v: '364'
      }];

      var calendarNum = scope.calendarNum;
      var dateFormat = scope.format;
      var startMoment, endMoment;

      /**
       * @dpObj:
       *    year             - current year of each calendar
       *    month            - current month of each calendar
       *    displayYearMonth - displayed MM-yyyy of each calendar
       *    day
       *    rows             - each row in the caldenar
       *    spaces           - starting spaces at the begining of each month
       */
      scope.dpObj = {};
      scope.dpObj.year = [];
      scope.dpObj.month = [];
      scope.dpObj.displayYearMonth = [];
      scope.dpObj.day = [];
      scope.dpObj.rows = [];
      scope.dpObj.spaces = [];

      /**
       * @dateInfo:
       *   displayDate - date that displayed in the box
       *   range       - date range
       *   fromDate    - from date
       *   toDate      - to date
       */
      scope.dateInfo = {}; //I'm using an object to bind to ngModel
      scope.dateInfo.range = scope.ranges[4]; //set default as one month


      /**
       * @description Update the ngModel
       * ngChange won't evaluate if the model is changed programmatically and not by a change to the input value
       * so update model required
       * Also: If the new value is an object (rather than a string or a number), 
       * so we should make a copy of the object before passing it to $setViewValue.
       */
      function updateModel() {
        var newVal = angular.copy(scope.dateInfo);
        ngModelCtrl.$setViewValue(newVal);

        // console.log('$viewValue: ' + angular.toJson(ngModelCtrl.$viewValue));   //actuall string value in the view
        // console.log('$modelValue: ' + angular.toJson(ngModelCtrl.$modelValue)); //the value in the model that the control is bound to
        // ngModelCtrl.$render();  //do I need to call render here? seems not
      }

      /**
       * @description ngModel validators
       * Why the front end doesn't read values from model.$error???
       */

      // ngModelCtrl.$parsers.unshift(checkValidation);  //value modified by the users
      // ngModelCtrl.$formatters.push(checkValidation);   //model modified in the code
      // attrs.$observe('datePicker', function(){
      //     checkValidation(ngModelCtrl.$viewValue);
      // });

      // function checkValidation(viewValue){
      //     if (viewValue && viewValue.toDate) {
      //         var to = moment(viewValue.toDate, dateFormat);
      //         if (!to.isBefore(viewValue.fromDate)) {
      //             ngModelCtrl.$setValidity('datePicker', true);
      //             scope.validRange = true;
      //             return viewValue;
      //         }else{
      //             ngModelCtrl.$setValidity('datePicker', false);
      //             scope.validRange = false;
      //             return viewValue;
      //         }
      //     }
      // }

      /**
      * @description Update directive's dateInfo object
      *     Changes are made from the model and we get
      *     the updated value from ngModelCtrl's $viewValue
      */
      scope.$watch(function ngModelWatch() {
        if (ngModelCtrl && ngModelCtrl.$viewValue) {
          var update = false;
          if ( ngModelCtrl.$viewValue.range && 
              ngModelCtrl.$viewValue.range['name'] != 'Custom ranges' && 
              ngModelCtrl.$viewValue.range['name'] != scope.dateInfo.range['name'] ) {
            scope.dateInfo.range = angular.copy(ngModelCtrl.$viewValue.range);  //UI won't updated?!
            scope.quickDateRange(ngModelCtrl.$viewValue.range);
          }else if (ngModelCtrl.$viewValue.fromDate != scope.dateInfo.fromDate) {
            scope.dateInfo.fromDate = ngModelCtrl.$viewValue.fromDate;
            update = true;
          }else if (ngModelCtrl.$viewValue.toDate != scope.dateInfo.toDate) {
            scope.dateInfo.toDate = ngModelCtrl.$viewValue.toDate;
            update = true;
          }
          if (update) {
              scope.dateInfo.displayDate = scope.dateInfo.fromDate + ' to ' + scope.dateInfo.toDate;
              scope.dateInfo.range = scope.ranges[0];
              updateModel();
          }
        }
      });

      /**
       * @description Update the calendars when year or month changes
       */
      scope.$watch('year+month', function(newValue) {
        var momentSet;
        if (!scope.year || !scope.month) {
          scope.year = moment().year();
          scope.month = moment().month() + 1;
          calUpdates(true);
          scope.quickDateRange(scope.dateInfo.range);
        }
        if (newValue) {
          if (!scope.day) {
            scope.day = moment().format('DD');
          }
          momentSet = dateHelper.getMoment(scope.year, scope.month, scope.day);
          calUpdates(false);
        }
      });

      /**
       * @description Update day, month and year values for each calendar
       * @calledBy scope.$watch('year+month')
       */
      function calUpdates(init) {
        var momentSet = [];
        if (init) {
          momentSet.push(moment());
        } else {

          momentSet.push(dateHelper.getMoment(scope.year, scope.month, scope.day));
          // momentSet.push(moment(scope.year+ '-' + scope.month + '-' + scope.day, 'YYYY-MM-DD')); //current
        }
        for (var i = 1; i < calendarNum; i++) {
          momentSet.push(momentSet[0].clone().subtract(i, 'months')); //1
        }
        for (var i = calendarNum - 1; i >= 0; i--) { //from calendar 0-2 
          var j = calendarNum - i - 1;
          scope.dpObj.year[j] = momentSet[i].year();
          scope.dpObj.month[j] = momentSet[i].month() + 1;
          scope.dpObj.displayYearMonth[j] = momentSet[i].format('MMMM') + ' - ' + scope.dpObj.year[j];
          scope.dpObj.rows[j] = [];
          scope.dpObj.spaces[j] = 0;
          getRows(momentSet[i], scope.dpObj.rows[j], j);
        }
      }

      /**
       * @description Generates each row for the calendar (the dates)
       * @calledBy calUpdates
       */
      function getRows(momentDate, rows, cal) {
        rows.splice(0, rows.length - 1);
        startMoment = momentDate.clone().startOf('month').startOf('week');
        endMoment = momentDate.clone().endOf('month').endOf('week');
        var diff = endMoment.diff(startMoment, 'days');
        var weeks = Math.ceil(diff / 7);
        var eachDate = startMoment.clone();
        var start = false,
          end = false;
        for (var i = 0; i < weeks; i++) {
          rows.push([]);
          for (var j = 0; j < 7; j++) {
            if (!start) { //detect the first day of the month
              if (eachDate.date() != 1) {
                scope.dpObj.spaces[cal]++;
                rows[i][j] = ''; //eachDate.date();
              } else {
                start = true;
                rows[i][j] = eachDate.date(); //returns the number
              }
            } else if (!end) { //detect the end day of the month
              if (eachDate.date() == 1) {
                break;
              }
              rows[i][j] = eachDate.date(); //returns the number
            }
            eachDate.add(1, 'days'); //renew to the next day
          }
        }
      }

      /**
       * @description Range dropdown list event
       */
      scope.quickDateRange = function(range) {
        if (range['name'] === 'Custom ranges') {
          return;
        }
        var from = moment(); //today
        var to = moment();
        switch (range['name']) {
          case 'Today':
            break; //do nothing
          case 'Yesterday':
            from.subtract(1, 'days');
            to.subtract(1, 'days');
            break;
          default:
            from.subtract(range['v'], 'days'); //what to show then range > 3 month?
            break;
        }
        scope.dateInfo.fromDate = from.format(dateFormat);
        scope.dateInfo.toDate = to.format(dateFormat);
        scope.dateInfo.displayDate = scope.dateInfo.fromDate + ' to ' + scope.dateInfo.toDate;
        updateModel();
      }

      /**
       * @description Expand date picker when clicked on it
       */
      scope.clickDatePicker = function() {
        scope.expandDatePicker = !scope.expandDatePicker;
      };

      /**
       * @description Detect if the click is inside date picker
       */
      scope.handleClick = function() {
        clickInsideDatePicker = true;
      };

      /**
       * @description Decide the start day of month
       * @calledBy onDayClick, getClassForDays
       */
      function getCurrentDate(rowIndex, colIndex, calendar) {
        var start = scope.dpObj.spaces[calendar];
        var sMoment = dateHelper.getMoment(scope.dpObj.year[calendar], scope.dpObj.month[calendar], '01');
        if (start > 0) {
          sMoment.subtract(start, 'days');
        }
        return sMoment.add((rowIndex * 7) + colIndex, 'days');
      }

      /**
       * @description Update externalDate when a day being clicked on
       */
      scope.onDayClick = function(rowIndex, colIndex, calendar) {
        var dateClicked = getCurrentDate(rowIndex, colIndex, calendar);
        scope.externalDate = dateClicked.format(dateFormat);
        clickUpdate(scope.externalDate);
        scope.dateInfo.range = scope.ranges[0];
        updateModel();  //update model right after range changes
      };

      /**
       * @description Update from and to dates
       * @calledBy onDayClick
       */
      function clickUpdate(newValue) {
        if (newValue) {
          if (scope.fromDateToSelect) {
            scope.dateInfo.fromDate = newValue;
            scope.fromDateToSelect = false;
          } else {
            //check if to is after from
            var to = moment(newValue, dateFormat);
            if (!to.isBefore(scope.dateInfo.fromDate)) {
              scope.dateInfo.toDate = newValue;
              scope.fromDateToSelect = true;
              fromBeforeTo = true;
              scope.errMsg = '';
            } else {
              fromBeforeTo = false;
              scope.errMsg = 'To date must be equal or after from date (' + scope.dateInfo.fromDate + ')';
            }
          }
          scope.dateInfo.displayDate = scope.dateInfo.fromDate + ' to ' + scope.dateInfo.toDate;
          updateModel();
        }
      }

      /**
       * @description Update calendars to one month before
       */
      scope.previousMonth = function() {
        var calendar = calendarNum - 1; //right most calendar
        var sMoment = dateHelper.getMoment(scope.dpObj.year[calendar], scope.dpObj.month[calendar], '01');
        sMoment.subtract(1, 'month');
        scope.month = sMoment.month() + 1;
        scope.year = sMoment.year();
      }

      /**
       * @description Update calendars to one month after
       */
      scope.nextMonth = function() {
        var calendar = calendarNum - 1; //right most calendar
        var sMoment = dateHelper.getMoment(scope.dpObj.year[calendar], scope.dpObj.month[calendar], '01');
        sMoment.add(1, 'month');
        scope.month = sMoment.month() + 1;
        scope.year = sMoment.year();
      }

      /**
       * @description Set dynamic css class for each date
       */
      scope.getClassForDays = function(rowIndex, colIndex, calendar) {
        var currentDate = getCurrentDate(rowIndex, colIndex, calendar);
        var sMoment = dateHelper.getMoment(scope.dpObj.year[calendar], scope.dpObj.month[calendar], '01');
        var classes = {
          activeDates: false,
          clickedDates: false,
          invalidDates: false,
          todayDates: false,
          selectedDates: false
        };
        if (currentDate.isBefore(sMoment)) {
          classes.invalidDates = true;
          return classes;
        }
        if (!scope.fromDateToSelect && scope.externalDate) { //highlights the clicked date
          var external = moment(scope.externalDate, dateFormat);
          classes.clickedDates = currentDate.isSame(external) && fromBeforeTo;
        }
        if (scope.dateInfo.fromDate && scope.dateInfo.toDate) { //highlights the date range
          var from = moment(scope.dateInfo.fromDate, dateFormat);
          var to = moment(scope.dateInfo.toDate, dateFormat);
          classes.selectedDates = !from.isAfter(currentDate) && !to.isBefore(currentDate);
        }
        if (currentDate.isSame(moment().format(dateFormat))) {
          classes.todayDates = true;
        }
        return classes;
      };
    },
    scope: {
      format: '=?',
      calendarNum: '=?'
    },
    controller: function($scope) {
      $scope.format = $scope.format || 'YYYY-MM-DD';
      $scope.calendarNum = $scope.calendarNum || 3;
    }
  };
});
