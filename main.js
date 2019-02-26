'use strict'
var cheerio = require('cheerio'),
  http = require('http'),
  request = require('superagent'),
  http = require('http'),
  rf = require('fs'),
  AlfredNode = require('alfred-workflow-nodejs')

var actionHandler = AlfredNode.actionHandler
var workflow = AlfredNode.workflow

workflow.setName('qin')

var Item = AlfredNode.Item

var today = { start: 0, end: 1 },
  yesterday = { start: 1, end: 2 },
  the_day_before_yesterday = { start: 2, end: 3 }

var presetParams = {
  today: makeDate(0),
  yesterday: makeDate(-1),
  the_day_before_yesterday: makeDate(-2),
  all: ''
}

var displayByParamList = {
  today: '[今天]',
  yesterday: '[昨天]',
  the_day_before_yesterday: '[前天]',
  all: '[全部]'
}

function makeDate(offset) {
  var timestamp = +new Date() + offset * 1000 * 60 * 60 * 24
  var now = new Date(timestamp)
  var y = now.getFullYear()
  var m =
    now.getMonth() + 1 < 10 ? '0' + (now.getMonth() + 1) : now.getMonth() + 1
  var d = now.getDate() < 10 ? '0' + now.getDate() : now.getDate()
  return y + '/' + m + d
}

function makeWFData($, result, query) {
  query = query.trim()

  var searchString = makeDate(0)
  var defaultDisplay = '[今天]'
  if (presetParams.hasOwnProperty(query)) {
    searchString = presetParams[query]
    defaultDisplay = displayByParamList[query]
  }

  var parsedData = $(result).find('a')
  for (var i = 0; i < parsedData.length; i++) {
    var node = parsedData[i]
    var item = new Item({
      title: '' + defaultDisplay + '' + node.prev.data,
      arg: node.attribs.href,
      subtitle: node.prev.data,
      valid: true
    })
    if (node.attribs.href.indexOf(searchString) !== -1) {
      workflow.addItem(item)
    }
  }
}

var cachedData = {
  data: '',
  expire: null
}

function getData(cb, day) {
  var now = Date.now()
  day = day || 3
  if (cachedData.data && now < cachedData.expire && 0) {
    cb && cb(cachedData.data)
  } else {
    request
      .get('http://www.zhibo8.cc/nba/luxiang.htm')
      .set(
        'Accept',
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      )
      .set('Accept-Encoding', 'gzip,deflate')
      .set('Accept-Language', 'zh-CN')
      .set('Cache-Control', 'max-age=0')
      .set('Connection', 'keep-alive')
      .set(
        'Cookie',
        'bdshare_firstime=1446263591987; CNZZDATA5642869=cnzz_eid%3D376350549-1446268239-http%253A%252F%252Fwww.zhibo8.cc%252F%26ntime%3D1446268239; BAIDU_DUP_lcr=https://www.baidu.com/link?url=JST7uYIeblh_GvnOVMZUyh8Dxlrf_s8_zwV7LlkWv3W&wd=&eqid=db3350b9000023b700000003564223b1; CNZZDATA709406=cnzz_eid%3D1278675408-1446262447-null%26ntime%3D1447172836; CNZZDATA5642867=cnzz_eid%3D2032041784-1446262524-http%253A%252F%252Fwww.zhibo8.cc%252F%26ntime%3D1447173981'
      )
      .set('Host', 'www.zhibo8.cc')
      .set(
        'User-Agent',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Maxthon/4.4.6.2000 Chrome/30.0.1599.101 Safari/537.36'
      )
      .end(function(err, res) {
        var data = res.text
        var result = ''
        var $ = cheerio.load(data)
        var nodes = $('#left > .box').slice(0, day)
        // console.log(nodes.length)
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes.eq(i)
          var base = 'http://www.zhibo8.cc/'
          result =
            result +
            '<div class="box">' +
            node
              .html()
              .replace(/href="\//g, 'href="' + base)
              .replace(/\|/g, '') +
            '</div>'
        }
        cachedData.data = result
        cachedData.expire = now + 60 * 1000 * 5
        cb && cb($, cachedData.data)
      })
  }
}

actionHandler.onAction('qin', function(query) {
  getData(function($, result) {
    makeWFData($, result, query)
    workflow.feedback()
  }, +query)
})

AlfredNode.run()
