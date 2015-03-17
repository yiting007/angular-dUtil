var app = angular.module('dUtilApp', []);

app.directive('dUtilDiv', function($window){  //register a directive
    return {
        restrict: 'E',
    replace: false,
    template: '<div class=datePicker ng-click=handleClick()><input class=datePickerInfo ng-click=clickDatePicker() ng-model=displayDate readonly placeholder="select date range"><div class=calendar ng-show=expandDatePicker><div class=selectMonthYearBar><button ng-click=previousMonth()>Previous</button><select ng-model=range ng-options="range.name for range in ranges" ng-change=quickDateRange(range)></select><button ng-click=nextMonth()>Next</button></div><table><thead class=dateHead><td ng-repeat="d in dpObj.displayYearMonth track by $index">{{ d }}<td ng-repeat="row in dpObj.rows"><div><table class=dateTable><thead><tr><td>Su<td>Mo<td>Tu<td>We<td>Th<td>Fr<td>Sa<tbody><tr ng-repeat="week in row"><td ng-repeat="day in week track by $index" class=day ng-class="getClassForDays($parent.$index, $index, $parent.$parent.$index)" ng-click="onDayClick($parent.$index, $index, $parent.$parent.$index)">{{ day }}</table></div><tbody><tbody></table><div class=fromToBar>From <input ng-class="{fromToDisplay: fromDateToSelect}" ng-model=fromDate readonly>To <input ng-class="{fromToDisplay: !fromDateToSelect}" ng-model=toDate readonly></div></div></div>',
    link: function(scope, element, attrs){
        var clickInsideDatePicker = false;
        var fromBeforeTo = true;
        scope.fromDateToSelect = true;
        scope.expandDatePicker = false;
        //bind the click event, so click anywhere exclude the datepicker will
        //trigger the datepicker to close
        angular.element(document).bind("click", function(event){
            scope.$apply(function(){
                if(!clickInsideDatePicker){
                    scope.expandDatePicker = false;
                }
                clickInsideDatePicker= false;
            });
        });


        scope.years = getYears();
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

        var calendarNum = +attrs.calendarnum;  //default is 3
        var dateFormat = attrs.format;  //default is YYYY-MM-DD

        function getYears(){
            var y = [];
            var currentYear = +moment().year();    //woo, the magical + sign!
            var numYears = +attrs.years;
            for(var i = currentYear-numYears; i <= currentYear+numYears; i++){
                y.push(i);
            }
            return y;
        };

        var startMoment, endMoment;
        var today = moment();
        scope.dpObj = [];
        scope.dpObj.year = [];
        scope.dpObj.month= [];
        scope.dpObj.displayYearMonth = [];
        scope.dpObj.day= [];
        scope.dpObj.rows= [];
        scope.dpObj.spaces = [];

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


        //update day, month and year values for each calendar
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

        //generates each row of the selected month and year
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

        scope.$watch('externalDate', function(newValue){
            if(newValue){
                if(scope.fromDateToSelect){
                    scope.fromDate = newValue;
                    scope.fromDateToSelect = false;
                }else{
                    //check if to is after from
                    var to = moment(newValue, dateFormat);
                    if(to.isAfter(scope.fromDate)){
                        scope.toDate = newValue;
                        scope.fromDateToSelect = true;
                        fromBeforeTo = true;
                    }else{
                        fromBeforeTo = false;
                    }
                }
                scope.displayDate = scope.fromDate + ' to ' + scope.toDate;
            }
        });

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
        }

        scope.clickDatePicker = function(){
            scope.expandDatePicker = !scope.expandDatePicker;
        };

        scope.handleClick = function(){
            clickInsideDatePicker = true;
        };

        //called by onDayClick and getClassForDays
        function getCurrentDate(rowIndex, colIndex, calendar){
            var start = scope.dpObj.spaces[calendar];
            var sMoment = moment(scope.dpObj.year[calendar] + '-' + scope.dpObj.month[calendar] + '- 01', dateFormat);
            if(start > 0){
                sMoment.subtract(start, 'days');
            }
            return sMoment.add((rowIndex*7)+colIndex, 'days');
        }

        scope.onDayClick = function(rowIndex, colIndex, calendar){
            var dateClicked = getCurrentDate(rowIndex, colIndex, calendar);
            scope.externalDate = dateClicked.format(dateFormat);
            scope.range = scope.ranges[0];
        };

        scope.previousMonth = function(){
            var calendar = calendarNum - 1; //right most calendar
            var sMoment = moment(scope.dpObj.year[calendar] + '-' + scope.dpObj.month[calendar] + '- 01', dateFormat);
            sMoment.subtract(1, 'month');
            scope.month = sMoment.month() + 1;
            scope.year = sMoment.year();
        }

        scope.nextMonth = function(){
            var calendar = calendarNum - 1; //right most calendar
            var sMoment = moment(scope.dpObj.year[calendar] + '-' + scope.dpObj.month[calendar] + '- 01', dateFormat);
            sMoment.add(1, 'month');
            scope.month = sMoment.month() + 1;
            scope.year = sMoment.year();
        }

        //set dynamic css class for each date
        scope.getClassForDays = function(rowIndex, colIndex, calendar){
            var currentDate = getCurrentDate(rowIndex, colIndex, calendar);
            var classes = {
                activeDates: false,
                clickedDates: false,
                invalidDates: false,
                selectedDates: false
            };
            if(!scope.fromDateToSelect && scope.externalDate){
                var external = moment(scope.externalDate, dateFormat);
                classes.clickedDates = currentDate.isSame(external) && fromBeforeTo;
            }
            if(scope.fromDate && scope.toDate){ //highlights the date range
                var from = moment(scope.fromDate, dateFormat);
                var to = moment(scope.toDate, dateFormat);
                classes.selectedDates = !from.isAfter(currentDate) && !to.isBefore(currentDate);
            }
            return classes;
        };
    },
    scope: {
        externalDate: "=datePicker"
    }
    };
});


app.controller('testController', function($scope, $filter){

});
