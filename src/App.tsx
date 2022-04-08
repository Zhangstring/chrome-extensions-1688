import React, { useState, useEffect } from 'react';
import './App.css';
import { Input, Button, Table } from 'antd'
import { getCurrentTab } from './utils';
import dayjs from 'dayjs'
import * as XLSX from 'xlsx';

function App() {
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['list'], (result) => {
      const {list} = result
      if(list) {
        setList(list)
      }
    })
  }, [])

  const columns = [
    {
      title: '搜索关键词',
      dataIndex: 'searchValue',
      key: 'searchValue',
    },
    {
      title: '搜索时间',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: '搜索数量',
      dataIndex: 'list',
      key: 'list',
      render: (list: any[]) => {
        return list.length
      }
    },
    {
      title: 'Action',
      dataIndex: '',
      key: 'x',
      render: (_: any, record: any) => <a onClick={() => {download(record)}}>下载</a>,
    },
  ]

  const download = (record: any) => {
    const _headers = ['title', 'price', 'link', 'companyName']
    const _data = record.list
    const headers = _headers
    .map((v, i) => Object.assign({}, {v: v, position: String.fromCharCode(65+i) + 1 }))
    .reduce((prev, next) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});
    const data = _data
    .map((v: any, i: any) => _headers.map((k, j) => Object.assign({}, { v: v[k], position: String.fromCharCode(65+j) + (i+2) })))
    .reduce((prev: any, next: any) => prev.concat(next))
    .reduce((prev: any, next: any) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});
    // 合并 headers 和 data
    var output = Object.assign({}, headers, data);
    // 获取所有单元格的位置
    var outputPos = Object.keys(output);
    // 计算出范围
    var ref = outputPos[0] + ':' + outputPos[outputPos.length - 1];
  
    const wb: XLSX.WorkBook = {
      Sheets: {'data': Object.assign({}, output, { '!ref': ref })},
      SheetNames: ['data']
    }
    XLSX.writeFile(wb, `${record.searchValue}.xlsx`);
  }

  const crawling = async () => {
    setLoading(true)
    const startTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const nowTime = +new Date()
    const tab = await getCurrentTab();
    if(tab.id) {
      await chrome.tabs.sendMessage(tab.id, {page}, (res) => {
        const value = {searchValue: res.searchValue, list: res.list, startTime}
        setList([value, ...list]);
        setLoading(false)
        const time = (+new Date() - nowTime) / 1000
        console.log(`爬取完成，耗时${time}秒`)
        chrome.storage.local.get(['list'], (result) => {
          const {list} = result
          if(list) {
            const newList = [value, ...list]
            chrome.storage.local.set({list: newList}, () => {
              console.log('存储成功')
            })
          } else {
            chrome.storage.local.set({list: [value]}, () => {
              console.log('存储成功')
            })
          }
        })
      })
    } else {
      setLoading(false)
    }
  }

  const pageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = e.target
    setPage(Number(value));
  }

  return (
    <div className="App">
      <div className="form">
        <span className="form-label">页数：</span>
        <Input placeholder='请输入爬取页数' defaultValue={page} onChange={pageChange}></Input>
        <Button type="primary" onClick={crawling}>爬取</Button>
      </div>
      <p>{loading ? "正在爬取：" : ''}</p>
      <Table columns={columns} dataSource={list} />
    </div>
  );
}

export default App;
