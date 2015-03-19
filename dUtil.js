var app = angular.module('dUtilApp', []);

app.directive('datePicker', function($window){  //register a directive
    return {
        restrict: 'E',
    // require: 'ngModel',
    replace: false,
    // templateUrl: 'myUtil/dUtil_templates.html',
    template: ' <div class="datePicker" ng-click="handleClick()"> <input class="datePickerInfo" type="text"  ng-click="clickDatePicker()" ng-model="displayDate" readonly placeholder="select date range"></input> <div class="calendar" ng-show="expandDatePicker"> <div class="selectMonthYearBar"> <button ng-click="previousMonth()">&#8592</button> <select ng-model="range" ng-options="range.name for range in ranges" ng-change="quickDateRange(range)"></select> <button ng-click="nextMonth()">&#8594</button> </div> <table class="datePickerTable"> <thead class="calendarHead"> <td ng-repeat="d in dpObj.displayYearMonth track by $index">{{ d }} </td> </thead> <tr class="calendarTable"> <td ng-repeat="row in dpObj.rows"> <table class="dateTable"> <thead class="dateHead"> <tr> <td>S</td> <td>M</td> <td>T</td> <td>W</td> <td>T</td> <td>F</td> <td>S</td> </tr> </thead> <tbody> <tr ng-repeat="week in row"> <td ng-repeat="day in week track by $index" class="day" ng-class="getClassForDays($parent.$index, $index, $parent.$parent.$index)" ng-click="onDayClick($parent.$index, $index, $parent.$parent.$index)">{{ day }}</td> </tr> </tbody> </table> </td> </tr> </table> <div class=fromToBar> From <input ng-class="{fromToDisplay: fromDateToSelect}" ng-model="fromDate" type="text" readonly></input> To <input ng-class="{fromToDisplay: !fromDateToSelect}" ng-model="toDate" type="text" readonly></input> </div> </div> </div> ',

    link: function(scope, element, attrs){
        var clickInsideDatePicker = false;
        var fromBeforeTo = true;
        scope.fromDateToSelect = true;
        scope.expandDatePicker = false;
        /**
        * @description Bind the click event, so click anywhere exclude the datepicker
        * will trigger the datepicker to close
        */
        angular.element(document).bind("click", function(event){
            scope.$apply(function(){
                if(!clickInsideDatePicker){
                    scope.expandDatePicker = false;
                }
                clickInsideDatePicker= false;
            });
        });

        scope.ranges = [ 
        {name: 'Custom ranges', v: '-1'},
        {name: 'Today', v: '0'},
        {name: 'Yesterday', v: '1'}, 
        {name: 'Last Week', v: '7'}, 
        {name: 'Last Month', v: '28'}, 
        {name: 'Last 3 Months', v: '91'}, 
        {name: 'Last 12 Months', v: '364'} 
        ];
        scope.range = scope.ranges[0];

        var calendarNum = scope.calendarNum;
        var dateFormat = scope.format;

        var startMoment, endMoment;
        var today = moment();
        scope.dpObj = [];
        scope.dpObj.year = [];
        scope.dpObj.month= [];
        scope.dpObj.displayYearMonth = [];
        scope.dpObj.day= [];
        scope.dpObj.rows= [];
        scope.dpObj.spaces = [];

        /**
        * @description Update the calendars when year or month changes
        */
        scope.$watch('year+month', function(newValue){
            var momentSet;
            if(!scope.year || !scope.month){
                scope.year = moment().year();
                scope.month = moment().month() + 1;
                calUpdates(true);
            }
            if(newValue){
                if(!scope.day){
                    scope.day = moment().format('DD');
                }
                momentSet = moment(scope.year+ '-' + scope.month + '-' + scope.day, dateFormat);
                calUpdates(false);
            }
        });


        /**
        * @description Update day, month and year values for each calendar
        * @calledBy scope.$watch('year+month')
        */
        function calUpdates(init){
            var momentSet = [];
            if(init){
                momentSet.push(moment());
            }else{
                momentSet.push(moment(scope.year+ '-' + scope.month + '-' + scope.day, dateFormat)); //current
            }
            for(var i=1; i<calendarNum; i++){
                momentSet.push(momentSet[0].clone().subtract(i, 'months')); //1
            }
            for(var i=calendarNum-1; i>=0; i--){    //from calendar 0-2 
                var j = calendarNum-i-1;
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
        */
        function getRows(momentDate, rows, cal){
            rows.splice(0, rows.length-1);
            startMoment = momentDate.clone().startOf('month').startOf('week');
            endMoment = momentDate.clone().endOf('month').endOf('week');
            var diff = endMoment.diff(startMoment, 'days');
            var weeks = Math.ceil(diff / 7);
            var eachDate = startMoment.clone();
            var start = false, end = false;
            for(var i=0; i<weeks; i++){
                rows.push([]);
                for(var j=0; j<7; j++){
                    if(!start){ //detect the first day of the month
                        if(eachDate.date() != 1){
                            scope.dpObj.spaces[cal]++;
                            rows[i][j] = ''; //eachDate.date();
                        }else{
                            start = true;
                            rows[i][j] = eachDate.date(); //returns the number
                        }
                    }else if(!end){ //detect the end day of the month
                        if(eachDate.date() == 1){
                            break;
                        }
                        rows[i][j] = eachDate.date(); //returns the number
                    }
                    eachDate.add(1, 'days');    //renew to the next day
                }
            }
        }

        /**
        * @description Range dropdown list event
        */
        scope.quickDateRange = function(range){
            if(range.name === 'Custom ranges'){
                return;
            }
            var from = moment();    //today
            var to = moment();
            switch(range.name){
                case 'Today': break;    //do nothing
                case 'Yesterday':
                              from.subtract(1, 'days');
                              to.subtract(1, 'days');
                              break;
                default:
                              from.subtract(range.v, 'days');   //what to show then range > 3 month?
                              break;
            }
            scope.fromDate = from.format(dateFormat);
            scope.toDate = to.format(dateFormat);
            scope.displayDate = scope.fromDate + ' to ' + scope.toDate;
        }

        /**
        * @description Expand date picker when clicked on it
        */
        scope.clickDatePicker = function(){
            scope.expandDatePicker = !scope.expandDatePicker;
        };

        /**
        * @description Detect if the click is inside date picker
        */
        scope.handleClick = function(){
            clickInsideDatePicker = true;
        };

        /**
        * @description Decide the start day of month
        * @calledBy onDayClick, getClassForDays
        */
        function getCurrentDate(rowIndex, colIndex, calendar){
            var start = scope.dpObj.spaces[calendar];
            var sMoment = moment(scope.dpObj.year[calendar] + '-' + scope.dpObj.month[calendar] + '- 01', dateFormat);
            if(start > 0){
                sMoment.subtract(start, 'days');
            }
            return sMoment.add((rowIndex*7)+colIndex, 'days');
        }

        /**
        * @description Update externalDate when a day being clicked on
        */
        scope.onDayClick = function(rowIndex, colIndex, calendar){
            var dateClicked = getCurrentDate(rowIndex, colIndex, calendar);
            scope.externalDate = dateClicked.format(dateFormat);
            clickUpdate(scope.externalDate);
            scope.range = scope.ranges[0];
        };
        
        /**
        * @description Update from and to dates
        * @calledBy onDayClick
        */
        function clickUpdate(newValue){
            if(newValue){
                if(scope.fromDateToSelect){
                    scope.fromDate = newValue;
                    scope.fromDateToSelect = false;
                }else{
                    //check if to is after from
                    var to = moment(newValue, dateFormat);
                    if (!to.isBefore(scope.fromDate)){  //cannot select the same day?
                        scope.toDate = newValue;
                        scope.fromDateToSelect = true;
                        fromBeforeTo = true;
                    }else{
                        fromBeforeTo = false;
                    }
                }
                scope.displayDate = scope.fromDate + ' to ' + scope.toDate;
            }
        }



        /**
         * @description Update calendars to one month before
        */
        scope.previousMonth = function(){
            var calendar = calendarNum - 1; //right most calendar
            var sMoment = moment(scope.dpObj.year[calendar] + '-' + scope.dpObj.month[calendar] + '- 01', dateFormat);
            sMoment.subtract(1, 'month');
            scope.month = sMoment.month() + 1;
            scope.year = sMoment.year();
        }

        /**
        * @description Update calendars to one month after
        */
        scope.nextMonth = function(){
            var calendar = calendarNum - 1; //right most calendar
            var sMoment = moment(scope.dpObj.year[calendar] + '-' + scope.dpObj.month[calendar] + '- 01', dateFormat);
            sMoment.add(1, 'month');
            scope.month = sMoment.month() + 1;
            scope.year = sMoment.year();
        }

        /**
        * @description Set dynamic css class for each date
        */
        scope.getClassForDays = function(rowIndex, colIndex, calendar){
            var currentDate = getCurrentDate(rowIndex, colIndex, calendar);
            var sMoment = moment(scope.dpObj.year[calendar] + '-' + scope.dpObj.month[calendar] + '- 01', dateFormat);
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
            if(!scope.fromDateToSelect && scope.externalDate){  //highlights the clicked date
                var external = moment(scope.externalDate, dateFormat);
                classes.clickedDates = currentDate.isSame(external) && fromBeforeTo;
            }
            if(scope.fromDate && scope.toDate){ //highlights the date range
                var from = moment(scope.fromDate, dateFormat);
                var to = moment(scope.toDate, dateFormat);
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
        calendarNum: '=?',
        fromDate: '=?',
        toDate: '=?',
        range: '=?'
    },
    controller: 
        function($scope){
            $scope.format = $scope.format || 'YYYY-MM-DD';
            $scope.calendarNum = $scope.calendarNum || 3;
        }
    };
});

