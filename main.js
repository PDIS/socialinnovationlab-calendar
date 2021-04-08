var calender = new Vue({
  el: '#calenderList',
  data: {
    calenders: [],
    interval_time: 1000 * 60 * 60 * 1 //getCalendar every 3 hrs here every 1 hrs
  },
  methods: {
    getWednesday: function (monthCount, setfirstDate) {
      var d = new Date(),
        month = d.getMonth(),
        Wednesdays = []

      d.setDate(setfirstDate)
      // Get the first Wednesday in the month
      while (d.getDay() !== 3) {
        d.setDate(d.getDate() + 1)
      }
      var tmpd = new Date()
      tmpd.setMonth(tmpd.getMonth() + monthCount)
      var endmonth = tmpd.getMonth()

      // Get all the other Wednesday in the month
      while (d.getMonth() !== endmonth) {
        Wednesdays.push(new Date(d.getTime()))
        d.setDate(d.getDate() + 7)
      }
      // only show now+90days;
      let now = new Date()
      let endDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 90
      )
      // endDay = new Date("2021-04-01");
      Wednesdays = Wednesdays.filter(
        (item) => item.getTime() <= endDay.getTime()
      )
      return Wednesdays
    },
    mapOfficeHourArrayToDict: function (elements) {
      let item = {}
      elements.forEach((element) => {
        let day = moment.utc(element.start).local().format('YYYY-MM-DD')
        item[day] = element
      })
      return item
    },
    initCalender: function () {
      var calenders = []
      var xhr = new XMLHttpRequest()
      xhr.open('GET', 'https://aucal.pdis.nat.gov.tw/auCal')
      xhr.send()
      xhr.onload = function () {
        if (xhr.status === 200) {
          var res = JSON.parse(xhr.responseText)
          var dayList = calender.getWednesday(4, new Date().getDate())
          var pointer = 0
          var resBook
          var xhrBook = new XMLHttpRequest()
          xhrBook.open('GET', 'https://aucal.pdis.nat.gov.tw/getReserve')
          xhrBook.send()
          xhrBook.onload = function () {
            if (xhrBook.status === 200) {
              resBook = JSON.parse(xhrBook.responseText)
              var booked = {}
              resBook.reservations.forEach(function (element) {
                var date = element.startDate.substring(
                  0,
                  element.startDate.indexOf('T')
                )
                let startHour = moment(element.startDate).hour()

                // afternoon
                // 避免開放早上預約衝突，等正式釋出後修正

                //後臺預約起訖跨多個時段時 前臺顯示並計算出跨幾個已預約時段
                let times =
                  moment.utc(element.bufferedEndDate).local().valueOf() / 1000 -
                  moment.utc(element.bufferedStartDate).local().valueOf() / 1000
                var numOfSlot = Math.ceil(times / (60 * 60)) // 60min per slot
                if (typeof booked[date] === 'undefined') {
                  booked[date] = {}
                  booked[date]['afternoon'] = 0
                  booked[date]['morning'] = 0
                  if (startHour >= 13) {
                    booked[date]['afternoon'] = numOfSlot
                  } else {
                    booked[date]['morning'] = numOfSlot
                  }
                } else {
                  if (startHour >= 13) {
                    booked[date]['afternoon'] =
                      booked[date]['afternoon'] + numOfSlot
                  } else {
                    booked[date]['morning'] =
                      booked[date]['morning'] + numOfSlot
                  }
                }
              })
              // console.dir(booked,{depyh:null});

              const availableTimespans = [
                'T13:00',
                'T14:00',
                'T15:00',
                'T16:00'
              ]
              var MaxBooking = availableTimespans.length //每日可預約總數
              const MaxAvailableMonth = 3 //開放可預約月數 本月+N月
              calenders.forEach(function (element) {
                let isDayAvailable = false
                if (booked[element.fullDT] == undefined) {
                  element.bookStatus = '尚可預約'
                  element.clsBookStatus = 'blue'
                  isDayAvailable = true
                } else if (booked[element.fullDT]['afternoon'] == MaxBooking) {
                  element.bookStatus = '已額滿'
                  element.clsBookStatus = 'red'
                } else if (booked[element.fullDT]['afternoon'] < MaxBooking) {
                  element.bookStatus = '尚可預約'
                  element.clsBookStatus = 'blue'
                  isDayAvailable = true
                } else if (
                  new Date(element.fullDT).getMonth() <=
                    new Date().getMonth() + MaxAvailableMonth &&
                  new Date(element.fullDT) > new Date()
                ) {
                  element.bookStatus = '尚可預約'
                  element.clsBookStatus = 'blue'
                  isDayAvailable = true
                } else {
                  element.bookStatus = '未開放預約'
                  element.clsBookStatus = 'red'
                }

                if (booked[element.fullDT] == undefined) {
                  element.subtitle = '尚可預約'
                  element.clsSubtitle = 'calenderSubtitle blue'
                  isDayAvailable = true
                } else if (booked[element.fullDT]['morning'] == 2) {
                  element.subtitle = '已額滿'
                  element.clsSubtitle = 'calenderSubtitle red'
                } else if (booked[element.fullDT]['morning'] < 2) {
                  element.subtitle = '尚可預約'
                  element.clsSubtitle = 'calenderSubtitle blue'
                  isDayAvailable = true
                } else if (
                  new Date(element.fullDT).getMonth() <=
                    new Date().getMonth() + MaxAvailableMonth &&
                  new Date(element.fullDT) > new Date()
                ) {
                  element.subtitle = '尚可預約'
                  element.clsSubtitle = 'calenderSubtitle blue'
                  isDayAvailable = true
                } else {
                  element.subtitle = '未開放預約'
                  element.clsSubtitle = 'calenderSubtitle red'
                }
                if (isDayAvailable) {
                  element.cls = 'calenderGreen'
                } else {
                  element.cls = 'calenderRed'
                }
              })
            } else {
              //err
            }
          }

          let officeHourDict = calender.mapOfficeHourArrayToDict(res.items)

          dayList.forEach(function (day) {
            if (calenders.length >= 12) {
              return
            }
            let YDate = moment.utc(day).local().format('YYYY-MM-DD')
            let date = moment.utc(day).local().format('MM-DD')
            let item = officeHourDict[YDate]

            if (item == undefined) {
              var objCalender = {
                fullDT: day.getFullYear() + '-' + date,
                title: date + '(三)',
                date: date + '(三)',
                subtitle: '',
                cls: 'calenderRed',
                clsSubtitle: 'calenderSubtitle red',
                bookStatus: '',
                clsBookStatus: ''
              }
              calenders.push(objCalender)
            } else {
              var startHHmm = moment.utc(item.start).local().format('HH:mm')
              var endHHmm = moment.utc(item.end).local().format('HH:mm')
              var clsSubtitle = 'calenderSubtitle blue'
              if (startHHmm != '10:00' || endHHmm != '14:00') {
                clsSubtitle = 'calenderSubtitle red'
              }
              if (startHHmm == '09:00') {
                startHHmm = '10:00'
              }
              var datetime =
                startHHmm + '～' + moment.utc(item.end).local().format('HH:mm')
              var objCalender = {
                fullDT: day.getFullYear() + '-' + date,
                title: date + '(三)',
                date: date + '(三)',
                subtitle: datetime,
                cls: 'calenderGreen',
                clsSubtitle: clsSubtitle,
                bookStatus: '',
                clsBookStatus: ''
              }
              calenders.push(objCalender)
            }
          })

          new Vue({
            el: '#updateDT',
            data: {
              updateDT:
                moment.utc(res.updateTime).local().format('YYYY-MM-DD HH') +
                ':00'
            }
          })
        } else {
          //err
        }
      }
      this.calenders = calenders
    }
  },
  created() {
    this.initCalender()
    setInterval(function () {
      calender.initCalender()
      console.log('re render')
    }, this.interval_time)
  }
})
